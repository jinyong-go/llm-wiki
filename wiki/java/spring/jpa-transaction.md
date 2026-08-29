---
title: JPA 트랜잭션 — @Transactional
updated: 2026-07-10 14:07:27
tags:
  - java
  - jpa
  - spring
  - hibernate
  - transaction
  - transactional
  - propagation
  - isolation
  - rollback
---

## 1. 개요

Spring `@Transactional`은 AOP 프록시 기반으로 트랜잭션 경계를 선언적으로 정의한다. 메서드 호출을 `TransactionInterceptor`가 가로채어 트랜잭션 시작·커밋·롤백을 처리한다.

```
createTransactionIfNecessary()
try {
    callMethod();
    commitTransactionAfterReturning();
} catch (exception) {
    completeTransactionAfterThrowing();
    throw exception;
}
```

Spring Boot에서 `spring-data-*` 또는 `spring-tx` 의존성이 클래스패스에 있으면 트랜잭션 관리가 자동 활성화된다.

---

## 2. 프록시 타입

| 조건 | 프록시 타입 |
|---|---|
| 빈이 인터페이스를 구현 | JDK Dynamic Proxy (기본값) |
| 인터페이스 없음 or `proxyTargetClass=true` | CGLIB |

---

## 3. 어노테이션 적용 위치와 우선순위

적용 가능 위치: 인터페이스, 클래스, 메서드.

우선순위 (낮 → 높): 인터페이스 → 슈퍼클래스 → 클래스 → 인터페이스 메서드 → 슈퍼클래스 메서드 → **클래스 메서드**

클래스 레벨 선언 시 해당 클래스의 **모든 public 메서드**에 적용된다.

---

## 4. @Transactional이 무시되는 상황

### 4.1. 접근 제어자 제한

| 접근 제어자 | Spring 5 이하 | Spring 6.0+ CGLIB | JDK Proxy |
|---|---|---|---|
| `public` | ✅ | ✅ | ✅ |
| `protected` | ❌ 무시 | ✅ | ❌ |
| package-private | ❌ 무시 | ✅ | ❌ |
| `private` | ❌ 무시 | ❌ 무시 | ❌ |

`private` 메서드에 선언해도 오류 없이 조용히 무시된다.

### 4.2. Self-invocation (내부 호출)

같은 클래스 내에서 `this.method()`로 호출하면 프록시를 거치지 않아 트랜잭션이 적용되지 않는다.

```java
@Service
public class OrderService {

    @Transactional
    public void outer() {
        inner();  // ❌ this.inner() — 프록시 바이패스, 트랜잭션 무시
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void inner() { ... }
}
```

해결: `inner()`를 별도 빈으로 분리하여 주입받아 호출.

---

## 5. Propagation (전파 속성)

기본값은 `REQUIRED`.

| 전파 속성 | 기존 트랜잭션 없음 | 기존 트랜잭션 있음 |
|---|---|---|
| `REQUIRED` | 새 트랜잭션 생성 | 기존에 참여 |
| `REQUIRES_NEW` | 새 트랜잭션 생성 | 기존 일시정지 → 새 트랜잭션 |
| `NESTED` | 새 트랜잭션 생성 | savepoint 설정 후 중첩 실행 |
| `SUPPORTS` | 트랜잭션 없이 실행 | 기존에 참여 |
| `MANDATORY` | `IllegalTransactionStateException` | 기존에 참여 |
| `NOT_SUPPORTED` | 트랜잭션 없이 실행 | 기존 일시정지 후 비트랜잭션 실행 |
| `NEVER` | 트랜잭션 없이 실행 | `IllegalTransactionStateException` |

- `REQUIRES_NEW` / `NOT_SUPPORTED`의 실제 트랜잭션 일시정지는 `JTATransactionManager`만 완전 지원. 그 외에는 참조를 보관하고 컨텍스트에서 제거하는 방식으로 시뮬레이션.
- `NESTED`는 `DataSourceTransactionManager`가 지원. `JpaTransactionManager`는 `nestedTransactionAllowed = true`이고 JDBC 드라이버가 savepoint를 지원할 때만 동작.

---

## 6. Isolation (격리 수준)

| 레벨 | Dirty Read | Non-repeatable Read | Phantom Read | DB 기본값 |
|---|---|---|---|---|
| `READ_UNCOMMITTED` | 발생 | 발생 | 발생 | — |
| `READ_COMMITTED` | 방지 | 발생 | 발생 | PostgreSQL, SQL Server, Oracle |
| `REPEATABLE_READ` | 방지 | 방지 | 발생 | MySQL InnoDB |
| `SERIALIZABLE` | 방지 | 방지 | 방지 | — |

- `DEFAULT`: 각 RDBMS의 기본값 사용
- Oracle: `READ_UNCOMMITTED`, `REPEATABLE_READ` 미지원
- PostgreSQL: `READ_UNCOMMITTED`를 `READ_COMMITTED`로 fallback
- isolation 설정 시 Spring이 JDBC 커넥션을 eager하게 획득 (→ [[#커넥션 획득 시점]] 섹션 참고)

---

## 7. Rollback 규칙

기본값: `RuntimeException` / `Error`만 롤백. **Checked Exception은 롤백하지 않는다.**

```java
// Checked Exception도 롤백
@Transactional(rollbackFor = SQLException.class)
public void save() throws SQLException { ... }

// 특정 예외는 롤백 제외
@Transactional(noRollbackFor = DataIntegrityViolationException.class)
public void save() { ... }
```

**프로그래밍 방식 롤백 마킹** (try-catch 내에서 사용):

```java
TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
```

선언적 방식이 권장됨. `setRollbackOnly()` 호출 후에는 커밋이 불가능하며 반드시 롤백된다.

---

## 8. 글로벌 롤백 마킹 (UnexpectedRollbackException)

`PROPAGATION_REQUIRED`로 부모 트랜잭션에 참여한 자식 메서드에서 RuntimeException이 발생하면, `AbstractPlatformTransactionManager`의 `globalRollbackOnParticipationFailure`(기본값 `true`)에 의해 **전체 트랜잭션이 rollback-only로 마킹**된다.

부모에서 try-catch로 예외를 잡아도 부모 트랜잭션 커밋 시 `UnexpectedRollbackException`이 발생한다.

```java
@Transactional
public void outer() {
    try {
        inner();         // RuntimeException 발생
    } catch (Exception e) {
        // 잡았지만 이미 rollback-only 마킹됨
    }
    // outer 커밋 시점에 UnexpectedRollbackException 발생
}

@Transactional   // REQUIRED → 부모 트랜잭션에 참여
public void inner() {
    throw new RuntimeException();
}
```

**내부 동작**: `JpaTransactionManager.doSetRollbackOnly()` → `EntityTransaction.setRollbackOnly()` 호출

**해결 방법:**

| 방법 | 설명 | 주의 |
|---|---|---|
| `REQUIRES_NEW` | 자식이 독립 트랜잭션 → 자식 롤백이 부모에 영향 없음 | 추가 커넥션 사용 |
| `NESTED` | savepoint 기반 부분 롤백 | DataSourceTransactionManager 필요 |
| Checked Exception | rollback 규칙이 RuntimeException만 적용 | 예외 계층 변경 필요 |
| `globalRollbackOnParticipationFailure = false` | 전역 설정 변경 | Hibernate/JDBC 환경에서 데이터 일관성 주의 |

```java
@Bean
public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
    JpaTransactionManager tm = new JpaTransactionManager(emf);
    tm.setGlobalRollbackOnParticipationFailure(false);
    return tm;
}
```

---

## 9. readOnly 트랜잭션

```java
@Transactional(readOnly = true)
public List<Book> findAll() { ... }
```

| 레이어 | 효과 |
|---|---|
| Hibernate | dirty checking 비활성화 (FlushMode.MANUAL), 스냅샷 미생성 |
| JDBC | DB에 `SET SESSION TRANSACTION READ ONLY` 전송 |

**readOnly flag는 힌트일 뿐**이다. JPA 명세상 쓰기 작업을 반드시 막지는 않으며 구현체 의존적이다.

### 9.1. SimpleJpaRepository 기본 트랜잭션

Spring Data JPA가 제공하는 `SimpleJpaRepository`는 클래스 레벨에 `@Transactional(readOnly = true)`가 선언되어 있다. `save()`, `delete()` 등 쓰기 메서드에는 별도 `@Transactional`이 선언된다.

```java
@Transactional(readOnly = true)   // 클래스 레벨
class SimpleJpaRepository<T, ID> {

    @Transactional   // 쓰기 메서드 오버라이드
    public <S extends T> S save(S entity) { ... }
}
```

Querydsl, JPQL 커스텀 쿼리는 `SimpleJpaRepository`를 거치지 않으므로 자동 트랜잭션 없음.

### 9.2. readOnly와 성능 — 주의사항

`@Transactional(readOnly = true)` 사용 시 DB에 실제 트랜잭션이 열린다. 기본 propagation인 `REQUIRED`로 동작하므로 상위 트랜잭션이 없으면 새 트랜잭션을 생성한다. 단순 조회 1건에 다음 추가 쿼리가 발생한다.

```
SET autocommit = 0
SET SESSION TRANSACTION READ ONLY
SELECT ...
COMMIT
SET autocommit = 1
(+ sql_mode, character_set 등)
```

카카오페이 실측: `@Transactional(readOnly=true)` 없는 단순 조회가 DB select 처리량 **2~3배** 향상. 단순 단건 조회에는 트랜잭션을 사용하지 않거나 `Propagation.SUPPORTS`를 함께 지정하는 것을 고려한다.

```java
// 상위 트랜잭션이 없으면 트랜잭션 없이 실행됨
@Transactional(readOnly = true, propagation = Propagation.SUPPORTS)
public Book findById(Long id) { ... }
```

---

## 10. 커넥션 획득 시점

기본 설정: 트랜잭션 시작 시 JDBC 커넥션을 **즉시(eager) 획득**. `readOnly` 또는 `isolation` 속성을 설정한 경우에도 동일. JDBC 커넥션에 해당 속성을 세팅하기 위해 `HibernateJpaDialect`가 커넥션을 먼저 가져온다.

**문제**: 트랜잭션 범위 내에 외부 API 호출 등 DB 이외의 처리가 있으면 그 시간 동안 커넥션이 점유된다.

```java
@Transactional(readOnly = true)
public Product findById(Long id) {
    FxRate rate = restTemplate.getForObject(...);  // 수백 ms — 커넥션 hold 중
    return productRepository.findById(id).orElseThrow();
}
```

**해결**: 트랜잭션 범위를 DB 호출 직전까지 축소하거나, 별도 트랜잭셔널 서비스로 분리한다.

커넥션 lazy 획득을 위한 HikariCP + Hibernate 설정 (read-write 전용, isolation/readOnly 설정과 함께 사용 불가):

```properties
spring.datasource.hikari.auto-commit=false
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
```

---

## 11. 주요 안티패턴 요약

| 안티패턴 | 결과 | 해결책 |
|---|---|---|
| private / self-invocation | 트랜잭션 무시 | public 메서드로 변경 또는 별도 빈으로 분리 |
| Checked Exception 무처리 | 롤백 안 됨 | `rollbackFor` 명시 |
| 클래스 레벨 `@Transactional` 남용 | 의도치 않은 범위 확대 | 메서드 레벨로 내리기 |
| 트랜잭션 내 외부 API 호출 | 커넥션 장시간 hold | 트랜잭션 범위를 DB 작업 직전으로 축소 |
| 단순 조회에 `@Transactional(readOnly=true)` | 불필요한 추가 쿼리 | `SUPPORTS` propagation 사용 또는 미사용 |
| 자식 예외를 부모에서 try-catch | `UnexpectedRollbackException` | `REQUIRES_NEW` 또는 `NESTED` propagation 사용 |

---

## Sources
- [Transaction Propagation and Isolation in Spring @Transactional (Baeldung)](https://www.baeldung.com/spring-transactional-propagation-isolation)
- [Transactions with Spring and JPA (Baeldung)](https://www.baeldung.com/transaction-configuration-with-jpa-and-spring)
- [Does Spring @Transactional Annotation Work on a Private Method? (Baeldung)](https://www.baeldung.com/spring-transactional-annotation-private-method)
- [JPA Transactional 잘 알고 쓰고 계신가요? (카카오페이 기술 블로그)](https://tech.kakaopay.com/post/jpa-transactional-bri/)
- [Spring Transaction and Connection Management (Vlad Mihalcea)](https://vladmihalcea.com/spring-transaction-connection-management/)
- [Using Transactions for Read-Only Operations (Baeldung)](https://www.baeldung.com/spring-transactions-read-only)
- [실무에서 만난 글로벌 롤백 마킹](https://mj950425.github.io/jvm-lang/project/dev/rollback-marking/)

---

## Related pages
- [[jpa-delete]]
- [[jpa-entity-lifecycle]]
- [[jpa-n-plus-one]]
- [[routing-datasource]]
- [[batch]]
- [[enable-annotations]]
- [[spring-event]] — 트랜잭션 단계 바인딩 이벤트 리스너(@TransactionalEventListener)
- [[aop-transaction-order]] — 커스텀 @Around Aspect와 트랜잭션 경계·롤백의 상호작용
