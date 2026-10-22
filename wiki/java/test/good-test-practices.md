---
title: 좋은 테스트 코드
updated: 2026-10-22 23:09:21
tags:
  - java
  - testing
  - best-practices
  - tdd
---

## 1. 개요

테스트는 한 번 작성하고 끝나는 코드가 아니라 제품 코드가 바뀔 때마다 함께 유지되는 자산이다. 잘못 작성된 테스트는 리팩터링을 방해하고("메인 코드 수정보다 깨진 테스트 수정에 더 많은 시간"), 실패해도 원인을 알 수 없어 신뢰를 잃는다. 좋은 테스트의 목표는 변경에 강하면서(리팩터링 내성) 문제를 빠르고 명확하게 드러내는 것이다.

---

## 2. 결과 검증

가장 흔한 실수는 기능의 최종 결과가 아니라 내부 구현을 검증하는 것이다. 구현이 바뀌면 동작이 같아도 테스트가 깨진다.

### 2.1. 중간 단계 검증

공개 기능의 최종 결과만 확인하면 될 것을 그 기능이 내부적으로 거치는 보조 계산·중간 단계까지 각각 검증하면, 내부 로직을 리팩터링하는 순간 동작이 같아도 테스트 대부분이 깨진다. 공개 API의 최종 결과만 검증한다.

예를 들어 주문 총액을 계산하는 `OrderService.calculateTotal()`이 내부적으로 `applyDiscount()`(할인)와 `applyTax()`(세금)를 거친다고 하자.

```java
// 내부 중간 단계까지 검증: 할인/세금 계산 방식을 바꾸면 깨짐
@Test
void 총액_계산_내부단계() {
    var order = new Order(10_000);
    assertThat(orderService.applyDiscount(order)).isEqualTo(9_000);  // 내부 단계
    assertThat(orderService.applyTax(9_000)).isEqualTo(9_900);       // 내부 단계
}

// 공개 API의 최종 결과만 검증: 내부 계산 방식이 바뀌어도 안정적
@Test
void 총액_계산() {
    var order = new Order(10_000);   // 정가 10,000
    assertThat(orderService.calculateTotal(order)).isEqualTo(9_900); // 최종 결과
}
```

중간 단계를 검증하려고 `applyDiscount`/`applyTax`를 `public`으로 노출하는 것 자체가 신호다. 할인·세금을 하나의 정책 객체로 합치거나 순서를 바꾸는 리팩터링을 하면 최종 총액은 같아도 위쪽 테스트는 전부 깨진다.

### 2.2. 호출 여부 검증

특정 메서드가 호출됐는지(예: 저장소의 갱신 메서드 호출 여부)를 검증하면 같은 결과를 내는 다른 메서드로 구현이 바뀌는 순간 동작이 옳아도 실패한다. 호출 여부가 아니라 저장·변경된 실제 데이터의 상태를 검증한다.

```java
// 호출 여부 검증: 같은 결과를 내는 다른 메서드로 바꾸면 깨짐
verify(orderRepository).updateStatus(orderId, PAID);

// 상태 검증
assertThat(orderRepository.findById(orderId).getStatus()).isEqualTo(PAID);
```

| 항목 | 피할 것 | 지향할 것 |
|------|---------|-----------|
| 검증 대상 | 내부 구현 세부 | 비즈니스 기능 결과 |
| Mock 사용 | 특정 메서드 호출 검증 | 최종 상태 확인 |
| 리팩터링 내성 | 낮음 | 높음 |

이는 [[test-double]]에서 상태 검증을 우선하고 행위 검증은 부수효과 위임에만 쓰는 원칙과 같은 맥락이며, Test Desiderata의 Behavioral·Structure-insensitive 속성(§4.3)에 해당한다.

---

## 3. Given-When-Then

Martin Fowler는 테스트를 세 단계로 구조화해 의도를 드러내는 방식을 설명한다.

- **Given**: 행위 이전의 상태(사전 조건, pre-condition)
- **When**: 검증 대상이 되는 행위(stimulus)
- **Then**: 그 행위로 기대되는 변화

Bill Wake의 Arrange-Act-Assert(AAA), Meszaros의 Four-Phase Test(Setup-Exercise-Verify-Teardown)와 같은 구조다. [[spock]]의 블록(`given/when/then`)이 이를 문법으로 구현한 예다.

```java
@Test
void 출금하면_잔액이_줄어든다() {
    // given
    Account account = new Account(10_000);

    // when
    account.withdraw(3_000);

    // then
    assertThat(account.getBalance()).isEqualTo(7_000);
}
```

---

## 4. 좋은 테스트의 속성

### 4.1. FIRST

Robert C. Martin이 Clean Code에서 제시한 단위 테스트 규칙이다.

| 약자 | 의미 |
|------|------|
| **F**ast | 자주 돌릴 수 있도록 빠르게 실행 |
| **I**ndependent | 테스트 간 의존이 없어 순서와 무관 |
| **R**epeatable | 어떤 환경에서도 같은 결과 |
| **S**elf-validating | 통과/실패를 스스로 판정(수동 확인 불필요) |
| **T**imely | 통과시킬 제품 코드 직전에 작성[^1] |

### 4.2. Test Desiderata

Kent Beck이 정리한 테스트의 가치를 높이는 12가지 속성으로, 속성 간 트레이드오프를 선택해 테스트의 가치를 최적화하는 것을 목표로 한다. 어떤 속성은 서로를 돕고(자동화하면 빨라짐), 어떤 속성은 서로 충돌한다(운영 예측력을 높이면 느려짐). 겉보기에만 충돌하는 경우도 있어 composability를 활용하면 테스트를 더 빠르면서도 예측력 있게 만들 수 있다.

| 속성 | 의미 | 위반 시 증상 |
|------|------|--------------|
| Isolated | 실행 순서와 무관하게 같은 결과 | 다른 테스트가 남긴 상태에 의존해 순서가 바뀌면 실패 |
| Composable | 각 변동 차원을 분리해 테스트하고 조합 가능 | 한 테스트가 여러 관심사를 섞어 원인 분리가 어려움 |
| Deterministic | 입력이 안 바뀌면 결과도 안 바뀜 | 시간·난수·스레드 타이밍에 따라 간헐적 실패(flaky) |
| Fast | 빠르게 실행 | 느려서 자주 안 돌리게 되고 피드백이 늦어짐 |
| Writable | 대상 코드 대비 저렴하게 작성 | 테스트 준비(셋업)가 과해 작성 자체를 기피 |
| Readable | 왜 이 테스트가 있는지 의도가 읽힘 | 실패해도 무엇을 보장하려던 건지 알 수 없음 |
| Behavioral | 코드의 동작 변화에 민감 | 버그가 생겨도 테스트가 통과함(검증 공백) |
| Structure-insensitive | 코드의 구조 변화에는 둔감 | 리팩터링만 해도 테스트가 깨짐 |
| Automated | 사람 개입 없이 실행 | 수동 확인 단계가 있어 재현·CI 불가 |
| Specific | 실패 시 원인이 명확 | 하나 깨지면 어디가 문제인지 추적에 시간 소모 |
| Predictive | 통과하면 운영에서도 동작하리라 신뢰 가능 | 테스트는 다 통과하는데 운영에서 장애 발생 |
| Inspiring | 통과가 배포 자신감을 줌 | 통과해도 불안해 수동으로 재확인 |

서로 맞물리는 속성은 다음과 같다.

- **Behavioral과 Structure-insensitive**: 이 둘의 균형이 §2 결과 검증 원칙의 근거다. 동작 변화는 잡고 구조 변화에는 깨지지 않는 테스트가 리팩터링 내성을 만든다.
- **Fast와 Predictive**: 실제 DB·네트워크를 쓸수록 운영 예측력은 오르지만 느려진다. 단위/통합 테스트 비중으로 조율한다.
- **Composable과 Fast·Predictive**: 변동 차원을 분리해 테스트하고 결과를 조합하면 속도와 예측력의 충돌을 완화할 수 있다.

FIRST와 겹치는 부분이 많지만(Fast, Isolated와 Independent, Deterministic과 Repeatable), Test Desiderata는 속성을 규칙이 아니라 절충 대상으로 보며 Behavioral·Structure-insensitive·Specific·Predictive·Inspiring 같은 가치 지향 속성을 추가로 다룬다.

### 4.3. Behavioral과 Structure-insensitive

12속성 중 이 둘은 좋은 테스트의 방향을 정의하는 한 쌍이다. §2의 결과 검증 원칙은 두 속성을 동시에 만족시키기 위한 것이다.

- **Behavioral**: 대상 코드의 동작(관측 가능한 입출력·상태 변화)이 바뀌면 테스트 결과도 바뀌어야 한다. 즉 버그가 들어오면 실패해야 한다. 이 속성이 약하면 테스트가 있어도 회귀를 잡지 못하는 검증 공백이 생긴다.
- **Structure-insensitive**: 대상 코드의 내부 구조(클래스 분리, 메서드 추출, private 헬퍼, 호출 순서)만 바뀌고 동작이 그대로면 테스트 결과가 바뀌지 않아야 한다. 이 속성이 약하면 순수 리팩터링에도 테스트가 깨져 변경을 방해한다.

| | Structure-insensitive 높음 | Structure-insensitive 낮음 |
|---|---|---|
| Behavioral 높음 | 이상적. 버그는 잡고 리팩터링에는 안 깨짐 | 버그는 잡지만 리팩터링마다 깨짐(유지비 증가) |
| Behavioral 낮음 | 안 깨지지만 버그도 못 잡음 | 깨지기만 하고 버그는 못 잡음 |

각 속성을 해치는 요인은 다음과 같다.

- **Structure-insensitive**: 내부 메서드 호출 여부 검증(Mock `verify`), private·중간 계산 결과 단언, 호출 순서 강제, 내부 자료구조 형태에 대한 단언
- **Behavioral**: 널 아님만 확인하는 등 지나치게 느슨한 단언, 실제 로직을 통째로 스텁으로 대체해 대상 동작을 거치지 않게 만드는 것

테스트는 무엇을 하는가(동작)에 결합하고 어떻게 하는가(구조)에는 결합하지 않아야 한다. 그래서 공개 API의 입력과 출력·상태를 검증하고([[test-double]]의 상태 검증) 내부 호출·중간 단계는 검증하지 않는다. 예시는 §2.1·§2.2.

단, 메일 발송이나 결제 요청처럼 상태로 관측할 수 없는 외부 부수효과는 상호작용(Mock) 검증이 정당하다. 그 호출 자체가 대상의 관측 가능한 동작이기 때문이다.

### 4.4. Solitary와 Sociable

Fowler의 단위 테스트 분류다.

- **Solitary**: 협력 객체를 테스트 더블로 격리한다(mockist 선호).
- **Sociable**: 실제 협력 객체와 상호작용한다(classicist 선호, Fowler 본인 선호).

원격 결제 검증처럼 실제 협력 객체를 쓰기 곤란할 때만 더블을 쓰는 것이 실용적인 절충이다.

Fowler는 컴파일할 가치가 있는 코드가 생기면 1분에도 몇 번씩 유닛 테스트를 돌린다고 서술한다. 테스트는 이렇게 자주 돌릴 만큼 빨라야 한다(self-testing code).

---

## 5. 작성 규칙

- 테스트 이름은 행위와 기대 결과를 서술한다(`출금하면_잔액이_줄어든다`).
- 하나의 테스트는 하나의 개념만 검증한다.
- 조건문·반복문 같은 로직을 테스트 안에 두지 않는다. 로직은 그 자체가 버그 소지다.

---

## Sources
- [jojoldu: 테스트 코드에서 내부 구현 검증 피하기](https://jojoldu.tistory.com/614)
- [Martin Fowler: UnitTest](https://martinfowler.com/bliki/UnitTest.html)
- [Martin Fowler: GivenWhenThen](https://martinfowler.com/bliki/GivenWhenThen.html)
- [Kent Beck: Test Desiderata](https://testdesiderata.com/)
- Robert C. Martin: Clean Code (원문 미확인)
- [HowToDoInJava: Embrace FIRST Principles for Reliable Unit Tests](https://howtodoinjava.com/best-practices/first-principles-for-good-tests)
- [DZone: FIRST Principles: Solid Rules for Tests](https://dzone.com/articles/first-principles-solid-rules-for-tests)

---

## Related pages
- [[inverse-operation-testing]]
- [[test-double]]
- [[spock]]
- [[java-testing-libraries]]

---

[^1]: Clean Code 원문은 확인하지 못했다. "just before the production code that makes them pass"라는 정의는 2차 출처(howtodoinjava, DZone)의 인용에 근거한다.
