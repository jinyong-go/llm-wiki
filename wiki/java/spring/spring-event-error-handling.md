---
title: Spring 이벤트 리스너 예외 처리
updated: 2026-07-21 11:36:55
tags:
  - java
  - spring
  - event
---

## 1. 개요

리스너 예외를 발행자·다른 리스너가 어떻게 처리하는지는 실행 방식(동기/비동기/트랜잭션 바인딩, [[spring-event]] §4)에 따라 다르다.

---

## 2. 동기 리스너

### 2.1. 기본 동작

- 기본 `SimpleApplicationEventMulticaster`는 `errorHandler` 미설정 시, 리스너 예외 발생 즉시 해당 멀티캐스트를 **중단**한다. 등록 순서상 이후 리스너는 호출되지 않는다.
- 예외는 래핑 없이 `publishEvent()` 호출자에게 그대로 전파된다.
- 리스너는 발행자의 트랜잭션 컨텍스트에 참여하므로, 예외가 발행자 메서드를 벗어나면 트랜잭션 롤백을 유발할 수 있다(일반 `@Transactional` 예외 규칙, [[jpa-transaction]] 참고).

```java
@EventListener
public void handle(OrderCreatedEvent event) {
    throw new IllegalStateException("실패");  // publishEvent() 호출자로 전파, 이후 리스너 미실행
}
```

### 2.2. ErrorHandler로 동작 변경

`applicationEventMulticaster` 빈을 재정의해 `ErrorHandler`를 지정하면 예외를 가로챌 수 있다.

```java
@Bean
ApplicationEventMulticaster applicationEventMulticaster() {
    SimpleApplicationEventMulticaster multicaster = new SimpleApplicationEventMulticaster();
    multicaster.setErrorHandler(TaskUtils.LOG_AND_SUPPRESS_ERROR_HANDLER);
    return multicaster;
}
```

| 전략 | 동작 |
|---|---|
| (미설정, 기본) | 예외 발생 시 멀티캐스트 즉시 중단, 발행자로 전파 |
| `TaskUtils.LOG_AND_SUPPRESS_ERROR_HANDLER` | 로그만 남기고 억제 — 이후 리스너 계속 실행, 발행자는 예외를 모름 |
| `TaskUtils.LOG_AND_PROPAGATE_ERROR_HANDLER` | 로그 후 재던짐 — 기본과 유사하게 전파 |
| 커스텀 `ErrorHandler` 구현 | 리스너별 보상 로직·알림 등 자유 구현 |

`taskExecutor`를 함께 지정하면(비동기 멀티캐스팅) 리스너별 예외가 개별적으로 실행기(executor)에 전파되며, 한 리스너의 예외가 다른 리스너 실행을 막지 않는다.

---

## 3. 비동기 리스너 (@Async)

- `@Async` 리스너의 예외는 **호출자(발행자)에게 전파되지 않는다** — 발행자는 리스너 완료를 기다리지 않으므로 애초에 예외를 받을 수단이 없다.
- 반환 타입이 `void`인 경우, 예외는 `AsyncUncaughtExceptionHandler`로만 확인 가능하다. 미설정 시 기본 `SimpleAsyncUncaughtExceptionHandler`가 에러 레벨 로그만 남긴다.
- `Future`/`CompletableFuture` 반환 메서드는 해당 객체로 예외를 조회할 수 있으나, `@EventListener` 리스너는 반환값을 재발행에 쓰므로 보통 `void`다.

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> log.error("비동기 리스너 예외: {}", method, ex);
    }
}
```

---

## 4. @TransactionalEventListener

Phase별로 예외의 영향이 다르다.

| Phase | 예외 발생 시 |
|---|---|
| `BEFORE_COMMIT` | 예외가 그대로 전파되어 **커밋이 중단되고 롤백** 처리됨 |
| `AFTER_COMMIT` | 트랜잭션이 이미 커밋 완료된 상태 — 예외가 나도 **롤백 불가**, 로그만 남음 |
| `AFTER_ROLLBACK` / `AFTER_COMPLETION` | 콜백 내부에서 예외를 잡아 **로그만 남기고 삼킴** — 발행자에 전파되지 않음 |

`BEFORE_COMMIT`은 `TransactionSynchronizationUtils.triggerBeforeCommit()`이 예외를 잡지 않고 그대로 전달하므로, `AbstractPlatformTransactionManager.processCommit()`이 이를 커밋 실패로 처리해 롤백한다. 반면 `beforeCompletion`/`afterCompletion` 콜백은 트랜잭션 매니저가 예외를 잡아 로그만 남긴다.

---

## 5. 요약

| 방식 | 발행자에 전파 | 다른 리스너 영향 |
|---|---|---|
| 동기(기본) | O | 이후 리스너 미실행(중단) |
| 동기 + ErrorHandler(LOG_AND_SUPPRESS) | X | 계속 실행 |
| 비동기(@Async) | X (AsyncUncaughtExceptionHandler로만 확인) | 리스너별 독립 실행이므로 영향 없음 |
| @TransactionalEventListener BEFORE_COMMIT | 커밋 중단(롤백) | — |
| @TransactionalEventListener AFTER_COMMIT/AFTER_ROLLBACK/AFTER_COMPLETION | X (로그만) | — |

---

## Sources
- [Spring Framework — Standard and Custom Events](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html)
- [SimpleApplicationEventMulticaster Javadoc — setErrorHandler](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/event/SimpleApplicationEventMulticaster.html)
- [TaskUtils Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/TaskUtils.html)
- [AsyncUncaughtExceptionHandler Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/interceptor/AsyncUncaughtExceptionHandler.html)
- [AsyncConfigurer Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/AsyncConfigurer.html)
- [TransactionSynchronizationUtils 소스](https://github.com/spring-projects/spring-framework/blob/main/spring-tx/src/main/java/org/springframework/transaction/support/TransactionSynchronizationUtils.java)
- [AbstractPlatformTransactionManager 소스 — processCommit](https://github.com/spring-projects/spring-framework/blob/main/spring-tx/src/main/java/org/springframework/transaction/support/AbstractPlatformTransactionManager.java)

---

## Related pages
- [[spring-event]]
- [[jpa-transaction]]
- [[enable-annotations]]
