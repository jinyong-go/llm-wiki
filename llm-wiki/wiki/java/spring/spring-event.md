---
title: Spring 이벤트
updated: 2026-08-11 17:04:12
tags:
  - java
  - spring
  - event
---

## 1. 개요

`ApplicationContext`는 옵저버 패턴 기반의 이벤트 발행·구독 메커니즘을 제공한다.
빈 간 직접 의존 없이 부가 로직(알림, 캐시 갱신, 감사 등)을 분리할 수 있다.

## 2. 구성 요소

- `ApplicationEvent` — 이벤트 기반 클래스. Spring 4.2+부터는 상속 없이 **임의 객체 발행 가능** (내부적으로 `PayloadApplicationEvent`로 래핑)
- `ApplicationEventPublisher` — 발행 인터페이스. 빈에 직접 주입 가능
- `ApplicationListener<E>` — 인터페이스 기반 리스너 (전통 방식)
- `@EventListener` — 어노테이션 기반 리스너 (권장, Spring 4.2+)

### 2.1. 주입되는 구현체

`ApplicationEventPublisher` 주입 시 별도의 발행자 빈이 아니라 **`ApplicationContext` 자신이 주입**된다.
`ApplicationContext`가 `ApplicationEventPublisher`를 확장(구현)하며,
`AbstractApplicationContext.prepareBeanFactory()`가 컨텍스트 자신을 해당 타입의 주입 대상으로 등록하기 때문:

```java
beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
```

`publishEvent()` 호출 시 실제 멀티캐스팅은 `ApplicationEventMulticaster`에 위임된다. **멀티캐스팅(multicasting)은 발행된 이벤트 하나를 타입·조건이 일치하는 모든 리스너에게 전달하는 1:N 전파 동작**이다 — 발행자는 수신자가 누구인지(몇 개인지) 알지 못한 채 이벤트만 발행하고, 멀티캐스터가 구독 리스너(0~N개)를 찾아 각각 호출한다:

- 컨텍스트 refresh 시 `"applicationEventMulticaster"` 이름의 빈을 찾고, 없으면 기본 구현체 `SimpleApplicationEventMulticaster`를 생성해 등록
- 기본 구현은 발행자(호출자) 스레드에서 리스너들을 순차 호출한다 — 동기 실행 (§4.2)
- 같은 이름으로 빈을 정의하면 멀티캐스팅 방식 교체 가능 (`taskExecutor`/`errorHandler` 설정)

```java
// 발행
@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;  // = ApplicationContext
    // ...
    public void create(Order order) {
        publisher.publishEvent(new OrderCreatedEvent(order.getId()));
    }
}

// 이벤트: 상속 불필요 (record 가능)
public record OrderCreatedEvent(Long orderId) {}

// 구독
@Component
public class OrderEventHandler {
    @EventListener
    public void handle(OrderCreatedEvent event) { /* ... */ }
}
```

## 3. 내장 이벤트

### 3.1. Spring Framework 컨텍스트 이벤트

| 이벤트 | 발행 시점 |
|---|---|
| `ContextRefreshedEvent` | `refresh()` 완료 — 모든 싱글턴 인스턴스화 후 |
| `ContextStartedEvent` / `ContextStoppedEvent` | `start()` / `stop()` — Lifecycle 빈 신호 |
| `ContextClosedEvent` | `close()` 또는 JVM 종료 훅 — 재시작 불가 |
| `RequestHandledEvent` | HTTP 요청 처리 완료 (DispatcherServlet) |

### 3.2. Spring Boot 시동 이벤트 (발행 순서)

`ApplicationStartingEvent` → `ApplicationEnvironmentPreparedEvent` → `ApplicationContextInitializedEvent` → `ApplicationPreparedEvent` → (refresh) → `ApplicationStartedEvent` → `ApplicationReadyEvent` (실패 시 `ApplicationFailedEvent`)

컨텍스트 생성 전에 발행되는 이벤트는 `@Bean` 리스너로 수신 불가 —
`SpringApplication.addListeners(...)` 또는 `META-INF/spring.factories`의 `org.springframework.context.ApplicationListener` 키로 등록

## 4. @EventListener

### 4.1. 상세

**속성**:

| 속성 | 기본값 | 설명 |
|---|---|---|
| `value` / `classes` (별칭) | `{}` | 구독할 이벤트 클래스(들). 생략 시 메서드 파라미터 타입으로 결정. 복수 지정 시 파라미터는 생략하거나 모든 클래스의 공통 상위 타입이어야 함 |
| `condition` | `""` (항상 처리) | SpEL 조건식 — true 평가 시에만 처리. `#event`(이벤트 객체), `#args`/`#a0`(메서드 인자), 파라미터 이름으로 참조: `condition = "#event.content == 'x'"` |
| `id` | `""` (메서드 정규화 시그니처로 자동 설정) | 리스너 식별자 — `ApplicationEventMulticaster.removeApplicationListeners()` 등에서 사용 (Spring 5.3.5+) |

**동작 특성**:

- **반환값 재발행** — non-void 반환 시 새 이벤트로 발행. `Collection`/배열 반환 시 복수 발행. 비동기 리스너에서는 미지원
- **순서 제어** — `@Order(n)`, 낮은 값 먼저
- **제네릭 이벤트** — `EntityCreatedEvent<Person>` 구분 수신 가능. 제네릭이 소거되는 경우 이벤트가 `ResolvableTypeProvider` 구현 필요
- 리스너 빈은 **lazy로 정의하면 안 됨** — 이벤트 수신 대상으로 등록되지 않음

### 4.2. 실행 시맨틱 — 동기

- `publishEvent()`는 기본적으로 **동기·발행자 스레드에서 실행** — 모든 리스너 완료까지 블로킹
- 리스너는 발행자의 **트랜잭션 컨텍스트에 참여**
- 리스너 예외는 발행자에게 전파됨 (상세·처리 가이드는 [[spring-event-error-handling]])
- 멀티캐스터에 `taskExecutor` 지정 시 모든 리스너가 비동기가 되므로, 선별 비동기화에는 `@Async` 권장

### 4.3. 실행 시맨틱 — 비동기

기본 동기 실행(§4.2)은 모든 리스너가 끝날 때까지 발행자를 블로킹하므로, 리스너 작업이 길거나(외부 API 호출·알림 발송 등) 발행자 응답을 지연시키면 안 될 때 리스너를 비동기로 전환한다. `@EnableAsync` + `@Async` 조합으로 리스너 메서드 호출이 `TaskExecutor`의 별도 스레드에 위임되며, 발행자는 리스너 완료를 기다리지 않고 즉시 반환한다 ([[enable-annotations]] 참고):

```java
@EventListener
@Async
public void handle(OrderCreatedEvent event) { /* 별도 스레드 */ }
```

제약:
- 예외가 발행자에게 전파되지 않음 ([[spring-event-error-handling]] 참고)
- 반환값 재발행 불가
- ThreadLocal·MDC(로깅 컨텍스트) 미전파

### 4.4. @TransactionalEventListener

리스너를 **트랜잭션 단계(phase)에 바인딩** (Spring 4.2+).

**속성** — `@EventListener`를 메타 어노테이션으로 가지므로 §4.1의 속성을 그대로 쓸 수 있고, 다음 2개가 추가된다:

| 속성 | 기본값 | 설명 |
|---|---|---|
| `phase` | `AFTER_COMMIT` | 리스너를 바인딩할 트랜잭션 단계 (아래 표) |
| `fallbackExecution` | `false` | 진행 중인 트랜잭션이 없을 때도 실행할지 여부 — false면 이벤트 폐기 |

| Phase | 시점 | 트랜잭션 자원 커밋 |
|---|---|---|
| `BEFORE_COMMIT` | 커밋 직전 | 트랜잭션과 함께 커밋됨 |
| `AFTER_COMMIT` (기본) | 커밋 성공 후 | **커밋 안 됨** |
| `AFTER_ROLLBACK` | 롤백 후 | 커밋 안 됨 |
| `AFTER_COMPLETION` | 커밋/롤백 공통 | 커밋 안 됨 |

주의사항:
- **진행 중 트랜잭션이 없으면 리스너가 아예 실행되지 않음** — `fallbackExecution = true`로 강제 실행 가능
- **AFTER_COMMIT 함정**: 트랜잭션은 이미 커밋 완료 상태이므로 리스너 안의 DB 변경(JPA 쓰기 등)은
  커밋되지 않고 조용히 유실됨 → 쓰기가 필요하면 `@Transactional(propagation = REQUIRES_NEW)` 필요
- `REQUIRES_NEW`로 발행 트랜잭션이 분리된 경우 리스너는 자신이 바인딩된 트랜잭션의 결과를 따름
- Spring 6.1+: 리액티브 트랜잭션(`ReactiveTransactionManager`)도 지원 — `TransactionalEventPublisher` 사용
- 용례: AFTER_COMMIT(알림·캐시 갱신), BEFORE_COMMIT(커밋 전 검증), AFTER_ROLLBACK(보상 로직)

---
## Sources

- `raw/java/spring/Spring Events (Baeldung).md`
- [Spring Framework — Standard and Custom Events](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html)
- [Spring Framework — Transaction-bound Events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)
- [TransactionPhase Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionPhase.html)
- [@EventListener Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/event/EventListener.html)
- [@TransactionalEventListener Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/event/TransactionalEventListener.html)
- [Spring Boot — Application Events and Listeners](https://docs.spring.io/spring-boot/reference/features/spring-application.html)
- [AbstractApplicationContext 소스 — registerResolvableDependency·initApplicationEventMulticaster](https://github.com/spring-projects/spring-framework/blob/main/spring-context/src/main/java/org/springframework/context/support/AbstractApplicationContext.java)
- [SimpleApplicationEventMulticaster Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/event/SimpleApplicationEventMulticaster.html) — 기본 멀티캐스터 동작

---
## Related pages

- [[spring-event-error-handling]] — 리스너 예외 동작·처리
- [[entity-listener-di]] — EntityListener DI 문제의 권장 대안이 이벤트 발행 패턴
- [[jpa-entity-lifecycle]]
- [[jpa-transaction]]
- [[enable-annotations]] — @EnableAsync
