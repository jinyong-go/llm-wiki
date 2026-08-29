---
title: HikariCP 데드락
updated: 2026-07-10 14:07:27
tags:
  - spring
  - hikari
  - connection-pool
  - deadlock
  - transaction
  - troubleshooting
---

## 1. 개요

HikariCP 데드락은 단일 스레드가 이미 커넥션을 보유한 상태에서 추가 커넥션을 요청할 때 풀에 여분이 없어 발생하는 교착 상태다. 코드 레벨의 버그가 아닌 **풀 크기와 트랜잭션 중첩 깊이의 구조적 미스매치**가 원인이다.

주요 발생 패턴:
- `@Transactional(propagation = REQUIRES_NEW)` 중첩 — 부모 트랜잭션 커넥션을 보유한 채 자식 트랜잭션 커넥션 요청
- Spring Boot 2.x + MySQL + `@GeneratedValue(AUTO)` — ID 채번 Sub Transaction이 추가 커넥션 소비

## 2. 발생 메커니즘

### 2.1. handOffQueue 교착

HikariCP는 커넥션 획득 시 다음 순서로 탐색한다:
1. ThreadLocal 캐시 탐색
2. ConcurrentBag에서 idle 커넥션 탐색
3. handOffQueue에서 `connectionTimeout`(기본 30초)까지 대기

스레드가 커넥션 A를 보유한 상태에서 커넥션 B를 요청하면:
- idle 커넥션이 없으므로 handOffQueue 대기 진입
- 커넥션 A를 반납하지 않는 한 다른 스레드도 반납 불가 (모두 동일한 상황이면 교착)
- 30초 후 `SQLTransientConnectionException` 발생 → Sub Transaction rollback → 상위 트랜잭션 rollbackOnly

**증상**: `"Connection is not available, request timed out after 30000ms"` 에러가 약 30초 주기로 반복되며 간헐적으로 성공

**풀 통계 변화** (스레드 1개, 풀 1개, 커넥션 2개 필요 시):

| 단계 | total | active | idle | waiting |
| :--- | :---: | :---: | :---: | :---: |
| 초기 | 1 | 0 | 1 | 0 |
| 첫 번째 커넥션 획득 | 1 | 1 | 0 | 0 |
| 두 번째 커넥션 요청 | 1 | 1 | 0 | 1 |
| connectionTimeout 후 | 1 | 0 | 1 | 0 |

### 2.2. 풀 고갈 수학적 조건

풀 고갈이 발생하는 조건:

```
P ≤ T × (D - 1)
```

- `P`: maximumPoolSize
- `T`: 동시 요청 스레드 수
- `D`: 트랜잭션 중첩 깊이 (커넥션 최대 보유 수)

예) Tomcat 기본 스레드 200개, 중첩 깊이 2: `P ≤ 200 × (2-1) = 200` → 풀 크기가 200 이하면 고갈 가능

**데드락이 수학적으로 불가능한 최솟값**:

```
Pmin = T × (D - 1) + 1
```

실무에서는 성능 버퍼를 포함한 공식을 사용한다:

```
pool_size = Tn × (Cm - 1) + (Tn / 2)
```

예) 스레드 16개, 커넥션 2개 필요: 16 × 1 + 8 = **24** (우아한형제들 적용 사례)

## 3. 실전 사례: `@GeneratedValue(AUTO)` + MySQL + Spring Boot 2.x

### 3.1. Spring Boot 버전별 AUTO 동작 차이

| 버전 | `new_generator_mappings` | AUTO 동작 | MySQL 결과 |
| :--- | :--- | :--- | :--- |
| Spring Boot 1.5.x | false | native → Dialect 결정 | IdentityGenerator (auto_increment) |
| **Spring Boot 2.x** | **true (기본값)** | **SequenceStyleGenerator** | **TableStructure** (`hibernate_sequence` 테이블) |

Spring Boot 2.x에서 MySQL + `@GeneratedValue(AUTO)` 조합은 내부적으로 ID 채번을 **Sub Transaction**으로 실행한다:

```sql
-- Sub Transaction (별도 커넥션)
select next_val as id_val from hibernate_sequence for update;
update hibernate_sequence set next_val = ? where next_val = ?;
```

`for update`가 행 락을 걸기 때문에 현재 트랜잭션이 끝날 때까지 다른 세션이 접근하지 못한다. Hibernate는 상위 트랜잭션과 독립된 Sub Transaction으로 채번 쿼리를 실행하므로 **`repository.save()` 한 번이 커넥션을 2개 소비**한다.

```java
@Transactional
public Message save(Message message) {
    return repository.save(message);
    // 내부: 커넥션 1(Sub TX: ID 채번) + 커넥션 2(Root TX: INSERT)
}
```

**환경 조건**: 스레드 16개, 풀 크기 10개 → 10개 스레드가 Root TX 커넥션 점유 → 전원 ID 채번용 커넥션 대기 → 교착 상태

## 4. 진단

### 4.1. JVM 스레드 덤프

데드락 발생 시 스레드 덤프에서 다음 패턴이 나타난다:

```
Thread State: TIMED_WAITING (parking)
  at com.zaxxer.hikari.util.ConcurrentBag.borrow(ConcurrentBag.java:...)
```

대부분의 스레드가 `TIMED_WAITING` 상태로 HikariCP `ConcurrentBag.borrow()`에서 대기 중이면 풀 고갈 데드락이다. CPU 사용률은 낮지만 응답이 없는 현상이 특징이다.

### 4.2. JMX 메트릭 확인

`registerMbeans=true` 설정 시 JMX로 풀 상태를 실시간 확인할 수 있다.

```yaml
spring:
  datasource:
    hikari:
      register-mbeans: true
```

풀 고갈 징후:

| 메트릭 | 정상 | 고갈 징후 |
| :--- | :--- | :--- |
| `hikaricp.connections.active` | < maximumPoolSize | = maximumPoolSize |
| `hikaricp.connections.idle` | > 0 | = 0 |
| `hikaricp.connections.pending` | 0 | ≥ 1 |

DB 측에서는 쿼리를 실행 중인 것이 아니라 JVM이 커넥션을 대기 중이므로 `idle in transaction` 상태의 커넥션이 다수 보인다.

### 4.3. 자가 진단

1. `maximumPoolSize=1`로 설정 후 해당 코드 실행 → `connectionTimeout` 발생 시 커넥션 2개 이상 사용
2. `@Transactional(propagation = REQUIRES_NEW)` 사용 여부 확인 — 별도 커넥션 요구
3. Spring Boot 2.x + MySQL + `@GeneratedValue(AUTO)` 조합 점검

## 5. 해결 방법

### 5.1. 방법 1: 풀 크기 조정

가장 간단하지만 근본 해결이 아니다. 스레드 수를 파악하기 어렵고(특히 Tomcat 기본 200), 풀을 크게 늘리면 DB `max_connections` 한계에 도달할 수 있다.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 24  # 예: 스레드 16 × (2-1) + 8
```

### 5.2. 방법 2: Sequence Optimizer 변경

`@GeneratedValue(AUTO)` 대신 `@GeneratedValue(SEQUENCE)` + Optimizer를 명시해 Sub Transaction 발생 빈도 자체를 줄인다.

**Optimizer 비교:**

| Optimizer | DB 호출 빈도 | 동작 |
| :--- | :--- | :--- |
| `NoopOptimizer` (기본) | 매 INSERT마다 | `+1`씩 증가, Sub TX마다 DB 접근 |
| `HiLoOptimizer` | 범위 단위 | Deprecated |
| `PooledOptimizer` | `incrementSize`마다 | 범위 `(seq - increment) ~ seq` 메모리 관리 |
| `PooledLoOptimizer` | `incrementSize`마다 | 범위 `seq ~ (seq + increment)` 메모리 관리 |
| `PooledLoThreadLocalOptimizer` | `incrementSize`마다 | **스레드별 독립 범위 관리** (가장 효율적) |

```java
@Entity
class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message-id-generator")
    @GenericGenerator(
        name = "message-id-generator",
        strategy = "sequence",
        parameters = {
            @Parameter(name = SequenceStyleGenerator.SEQUENCE_PARAM, value = "hibernate_sequence"),
            @Parameter(name = SequenceStyleGenerator.INCREMENT_PARAM, value = "1000"),
            @Parameter(name = AvailableSettings.PREFERRED_POOLED_OPTIMIZER, value = "pooled-lotl")
        }
    )
    private long id;
}
```

`increment=1000`으로 설정하면 1,000개 INSERT당 DB를 1번만 호출한다. `pooled-lotl`은 스레드별로 ID 구간을 독립 관리해 스레드 간 경합을 없앤다.

### 5.3. 방법 3: 보조 풀 분리

`REQUIRES_NEW`를 사용하는 로직(예: 감사 로그)에 별도 DataSource와 TransactionManager를 할당해 풀 경쟁을 차단한다.

```java
@Bean
public DataSource auditDataSource() {
    HikariConfig config = new HikariConfig();
    config.setPoolName("AuditPool");
    config.setMaximumPoolSize(5);
    // ...
    return new HikariDataSource(config);
}

@Bean
public PlatformTransactionManager auditTransactionManager(
        @Qualifier("auditDataSource") DataSource ds) {
    return new DataSourceTransactionManager(ds);
}

@Transactional(propagation = Propagation.REQUIRES_NEW,
               transactionManager = "auditTransactionManager")
public void writeAuditLog(AuditEvent event) {
    // 별도 풀에서 커넥션 획득 → 주 풀과 경쟁 없음
}
```

### 5.4. 방법 4: 비동기 이벤트 처리

네 가지 방법 중 권장 방식이다.

`REQUIRES_NEW`의 대표적 사용처인 감사 로그·알림 등을 비동기 이벤트로 분리한다. 트랜잭션 커밋 이후에 별도 스레드에서 실행하므로 중첩 깊이가 1로 줄어 수학적으로 풀 고갈이 불가능해진다. 이벤트 메커니즘 상세는 [[spring-event]] 참고.

```java
// 1. 이벤트 발행 (주 트랜잭션 내)
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    applicationEventPublisher.publishEvent(new OrderCreatedEvent(order));
}

// 2. 비동기 리스너 (별도 스레드, 커밋 이후 실행)
@Async("auditThreadPoolTaskExecutor")
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void handleOrderCreated(OrderCreatedEvent event) {
    auditLogRepository.save(new AuditLog(event));
}
```

**주의**: `@Async` 없이 `@TransactionalEventListener`만 사용하면 동기 실행되어 데드락 위험이 지속된다.

## 6. 벤치마크 비교

동기 `REQUIRES_NEW` vs 비동기 이벤트 처리 (200 동시 스레드 기준):

| 항목 | 동기 REQUIRES_NEW | 비동기 이벤트 |
| :--- | :--- | :--- |
| P99 지연시간 | 30,015ms (타임아웃) | 45ms |
| 처리량 | 0.5 req/sec | 250 req/sec |
| DB 활성 커넥션 | 10 (idle in transaction) | 10 (활성 쿼리) |
| 에러율 | 98.5% | 0% |
| JVM 스레드 상태 | 200개 TIMED_WAITING | ~15개 RUNNABLE |

CPU·메모리 사용률이 낮음에도 불구하고 응답이 없는 현상이 특징이다. 인프라 오토스케일링(HPA)도 CPU 기반으로 동작하기 때문에 이 상황에서는 스케일아웃이 작동하지 않고, 포드가 늘어날수록 DB `max_connections` 한계에 더 빨리 도달한다.

---

## Sources
- [HikariCP Dead lock에서 벗어나기 (이론편) — 우아한형제들](https://techblog.woowahan.com/2663/)
- [HikariCP Dead lock에서 벗어나기 (실전편) — 우아한형제들](https://techblog.woowahan.com/2664/)
- [The Suspension Trap: Preventing HikariCP Deadlocks in Nested Spring Transactions — azguards](https://azguards.com/backend-engineering/the-suspension-trap-preventing-hikaricp-deadlocks-in-nested-spring-transactions/)

---

## Related pages
- [[hikari-datasource]]
- [[jpa-transaction]]
- [[multi-datasource]]
- [[spring-event]]
