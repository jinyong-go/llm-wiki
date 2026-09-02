---
title: AOP Advice 순서와 트랜잭션 경계
updated: 2026-07-23 16:29:03
tags:
  - java
  - spring
  - aop
  - transaction
  - transactional
  - proxy
---

## 1. 개요

서비스 메서드에 `@Transactional`이 선언된 상태에서 같은 메서드에 커스텀 `@Around` Aspect를 추가하면, `@Transactional`의 `TransactionInterceptor`와 커스텀 Aspect가 **같은 프록시 체인에 함께 들어간다**. 둘 중 무엇이 바깥쪽(outer)이고 무엇이 안쪽(inner)이냐에 따라 커스텀 로직의 실행 시점뿐 아니라 **롤백 여부까지** 달라진다. 순서를 지정하지 않으면 이 관계가 미정의(undefined) 상태가 되어, 예외를 삼키는 `@Around`와 결합될 때 "`RuntimeException`이 발생했는데도 커밋되는" 문제로 이어진다([§5](#5-사례--예외를-삼켜-롤백이-되지-않은-경우)).

---

## 2. Advice 순서 규칙

### 2.1. 우선순위와 안/밖 관계

Spring AOP는 AspectJ의 **우선순위**(precedence) 규칙을 따른다.

> 안으로 들어갈 때는 우선순위가 높은 advice가 먼저 실행되고, 나갈 때는 우선순위가 높은 advice가 마지막에 실행된다.

즉 **우선순위가 높을수록 체인의 더 바깥쪽**에 위치한다. 우선순위는 `@Order`(또는 `Ordered` 구현)로 지정하며, **값이 작을수록 우선순위가 높다**(더 바깥쪽).

### 2.2. 순서 미정의

서로 다른 Aspect가 같은 Join Point에 적용될 때 우선순위를 지정하지 않으면 **실행 순서는 정의되지 않는다**(Spring 공식 문서 명시). 미정의라는 것은 특정 순서가 계약으로 보장되지 않는다는 뜻이므로, 어떤 환경에서 한 방향으로 동작하더라도 Spring 버전이나 빌드가 바뀌면 뒤집힐 수 있다. 따라서 "대개 이렇게 동작하더라"는 관찰에 의존해서는 안 되고, 순서가 트랜잭션 경계와 얽혀 중요하다면 [§2.1](#21-우선순위와-안밖-관계)의 `@Order`로 우선순위를 명시해야 한다.

### 2.3. 트랜잭션 Advisor의 기본 순서

`@Transactional`의 advisor 순서는 `@EnableTransactionManagement`의 `order` 속성이 결정하며, **기본값은 `Ordered.LOWEST_PRECEDENCE`**(최저 우선순위)다.

- 커스텀 Aspect에 `@Order`를 **어떤 값이든 명시**하면 `LOWEST_PRECEDENCE`보다 항상 우선순위가 높으므로 **자동으로 트랜잭션보다 바깥쪽**에 놓인다.
- 커스텀 Aspect에 `@Order`를 **명시하지 않으면** 역시 `LOWEST_PRECEDENCE`가 되어 트랜잭션 advisor와 동률(tie)이 되고, [§2.2](#22-순서-미정의)에 따라 상대 위치가 미정의 상태가 된다.

---

## 3. @Aspect 빈은 프록시 대상에서 제외

Aspect에 `@Transactional`을 붙여도 동작하지 않는다. Advisor를 제공하는 `@Aspect` 빈 자신은 `AspectJAwareAdvisorAutoProxyCreator.shouldSkip()`에 의해 **auto-proxy 대상에서 제외**되기 때문이다(자기 자신을 advise하는 순환 방지).

```java
// AspectJAwareAdvisorAutoProxyCreator
protected boolean shouldSkip(Class<?> beanClass, String beanName) {
    for (Advisor advisor : findCandidateAdvisors()) {
        if (advisor instanceof AspectJPointcutAdvisor pointcutAdvisor &&
                pointcutAdvisor.getAspectName().equals(beanName)) {
            return true;   // 이 빈이 Advisor를 제공하는 Aspect 자신이면 프록시 생성 생략
        }
    }
    return super.shouldSkip(beanClass, beanName);
}
```

따라서 Aspect 클래스나 그 메서드에 붙인 `@Transactional`은 **트랜잭션 프록시가 생성되지 않아 무효(inert)**다. Aspect 안에서 하는 DB 작업은 별도의 트랜잭션이 열리지 않고, 호출 시점에 이미 열려 있는(= advise 대상 서비스의) 트랜잭션에 그대로 참여한다.

---

## 4. 위치별 실행 흐름과 롤백

Spring 트랜잭션 인프라의 롤백 판단은 다음 원칙을 따른다.

> The Spring Framework's transaction infrastructure code catches any **unhandled** Exception as it bubbles up the call stack and makes a determination whether to mark the transaction for rollback.

핵심은 **"unhandled"** — 예외가 `TransactionInterceptor`에 **도달하기 전에 잡혀버리면(catch 후 rethrow 안 함) 롤백 판단 자체가 일어나지 않는다.** 이것이 Advice 위치와 결합되는 지점이다.

### 4.1. 커스텀 Aspect가 바깥쪽

```
Around(전처리) → Tx 시작 → 대상 메서드 → Tx 커밋/롤백 → Around(후처리)
```

대상 메서드의 예외가 `TransactionInterceptor`에 **먼저** 도달해 롤백 여부가 이미 결정된다. 이후 바깥쪽 Aspect가 예외를 삼켜도 **롤백 자체에는 영향이 없다**(다만 호출자에게 예외가 전파되지 않아 실패가 감춰지는 문제는 남는다).

### 4.2. 커스텀 Aspect가 안쪽

```
Tx 시작 → Around(전처리) → 대상 메서드 → Around(후처리) → Tx 커밋/롤백
```

대상 메서드의 예외를 **Aspect가 먼저** 받는다. Aspect가 삼키고 rethrow하지 않으면, `TransactionInterceptor` 입장에서는 `proceed()`가 **정상 반환된 것으로 보여 커밋한다** — 실제로는 실패했는데 DB에 반영되는 위험한 상황이다.

---

## 5. 사례 — 예외를 삼켜 롤백이 되지 않은 경우

### 5.1. 상황

- 서비스(`@Service`) 메서드에 `@Transactional` 선언
- `@EnableTransactionManagement`에 `order` 미설정
- 같은 서비스 메서드에 `@Around` Aspect 적용
  - Aspect에도 `order` 미설정
  - `proceed()`를 `try/catch`로 감싸고 예외를 **삼킴**
  - Aspect에도 `@Transactional`을 붙여 사용
  - Aspect의 DB 작업은 서비스 롤백과 **무관하게** 커밋되어야 하는 요구사항

### 5.2. 문제

서비스 메서드에서 `RuntimeException`이 발생하면 기본 규칙상 롤백되어야 하는데, **실제로는 롤백되지 않고 UPDATE가 커밋**되었다.

### 5.3. 원인

두 원인이 겹쳤다.

1. **순서 미지정 → Aspect가 트랜잭션 안쪽에 위치**: `@EnableTransactionManagement`와 `@Around` 모두 `LOWEST_PRECEDENCE`로 동률([§2.3](#23-트랜잭션-advisor의-기본-순서)). 커밋이 관찰됐다는 것은 이 앱에서 `@Around`가 트랜잭션보다 **안쪽**([§4.2](#42-커스텀-aspect가-안쪽))에 배치됐음을 뜻한다. 이 위치에서 예외를 삼키면 `TransactionInterceptor`는 실패를 목격하지 못하고 커밋한다.
2. **Aspect의 `@Transactional`은 무효**([§3](#3-aspect-빈은-프록시-대상에서-제외)): Aspect DB 작업을 서비스와 분리하려고 붙인 `@Transactional`이 실제로는 아무 트랜잭션도 만들지 않아, 애초에 의도한 격리도 이뤄지지 않았다.

### 5.4. 해결

- **Aspect의 DB 쓰기 작업을 별도 서비스로 분리**하고, 그 서비스 메서드에 `@Transactional(propagation = Propagation.REQUIRES_NEW)` 적용 → 서비스 롤백과 무관하게 독립 커밋([§3](#3-aspect-빈은-프록시-대상에서-제외)의 self-proxy 제약 회피 + 별도 트랜잭션 확보)
- **Aspect에서 `@Transactional`을 제거**하고, 예외를 **삼키지 않고 그대로 전파**하도록 수정 → `TransactionInterceptor`가 예외를 정상적으로 받아 서비스 롤백 수행
- 서비스에서 예외 발생 시 롤백되는 것 확인

---

## 6. 정리

- 트랜잭션과 관계가 중요한 커스텀 Aspect에는 **반드시 `@Order`를 명시**한다 — 미지정 시 순서가 미정의라 재현 어려운 버그가 된다.
- 예외를 삼키는(rethrow하지 않는) `@Around`는 트랜잭션 **안쪽**에 있을 때 롤백을 은폐한다. 삼켜야 할 이유가 없다면 그대로 전파하고, 의도적으로 삼켜야 한다면 `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`로 명시적으로 롤백을 표시한다.
- `@Aspect` 빈 자신은 프록시되지 않으므로 Aspect에 붙인 `@Transactional`은 무효다. Aspect의 DB 작업을 트랜잭션 경계와 다르게 다루려면 **별도 빈으로 분리하고 `Propagation`을 명시**한다.
- self-invocation 제약은 `@Transactional`과 커스텀 Aspect 모두에 동일하게 적용된다 — [[aop]], [[jpa-transaction]] 참고.

---

## Sources
- `raw/troubleshoot/Spring AOP and transaction.md`
- Spring Framework Reference — Advice Ordering: https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html
- Spring Framework Reference — Using @Transactional (order 속성 기본값): https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html
- Spring Framework Reference — Rolling Back a Declarative Transaction: https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html
- Spring Framework 소스 — AspectJAwareAdvisorAutoProxyCreator#shouldSkip

---

## Related pages
- [[aop]] — Spring AOP 개념·Pointcut·Advice·제약
- [[jpa-transaction]] — @Transactional 프록시 원리, Propagation, 롤백 규칙
