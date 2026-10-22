---
title: 테스트 더블
updated: 2026-10-22 23:09:21
tags:
  - java
  - testing
  - test-double
  - mock
  - stub
  - spy
---

## 1. 개요

테스트 더블(Test Double)은 테스트 대상(SUT, System Under Test)이 의존하는 실제 협력 객체(collaborator)를 대체하는 가짜 객체다. 실제 협력 객체를 쓰기 어렵거나(느림·비결정적·부수효과), SUT의 상호작용을 통제·관찰하려 할 때 사용한다.

Gerard Meszaros가 정의하고 Martin Fowler가 정리한 5종 분류가 표준으로 쓰인다. 흔히 혼동되는 Mock·Stub·Spy가 이 중 핵심이다.

---

## 2. 분류

| 종류 | 정의 |
|------|------|
| Dummy | 전달되지만 실제로 사용되지 않음. 파라미터 목록을 채우는 용도 |
| Fake | 동작하는 구현을 갖지만 운영에 부적합한 지름길을 씀(예: 인메모리 DB) |
| Stub | 테스트용으로 정해 둔 고정 응답(canned answer)만 반환. 그 외 호출에는 반응하지 않음 |
| Spy | Stub이면서 호출된 방식(정보)을 기록 |
| Mock | 받을 것으로 기대되는 호출의 명세(expectation)를 미리 프로그래밍한 객체 |

Fowler에 따르면 이 중 Mock만 행위 검증(behavior verification)을 요구하며, 나머지는 대개 상태 검증(state verification)을 쓴다.

---

## 3. 상태 검증과 행위 검증

Mock·Stub·Spy를 가르는 기준은 무엇을 검증하는가이다.

- **상태 검증(State Verification)**: 실행 후 SUT와 협력 객체의 상태(반환값·필드)를 확인한다. Stub이 이를 뒷받침한다.
- **행위 검증(Behavior Verification)**: SUT가 협력 객체를 올바르게 호출했는지(횟수·인자·순서)를 확인한다. Mock이 이를 강제한다.

| 종류 | 목적 | 검증 방식 | 핵심 질문 |
|------|------|-----------|-----------|
| Stub | 정해진 응답 제공 | 상태 검증 | "이 응답을 주면 SUT가 올바른 결과를 내는가?" |
| Mock | 호출 발생 검증 | 행위 검증 | "SUT가 협력 객체를 올바르게 호출했는가?" |
| Spy | 응답 제공 + 호출 기록 | 상태/행위 혼합 | "응답을 주면서 호출 내역도 관찰할 수 있는가?" |

### 3.1. Stub

협력 객체가 무엇을 반환하는지만 다루며 호출 횟수는 검증하지 않는다. SUT의 결과(상태)를 검증하기 위한 입력 공급원이다.

### 3.2. Mock

협력 객체가 어떻게 호출되었는지(횟수·인자·순서)를 검증한다. 반환값 자체보다 부수효과 위임이 올바른지를 확인한다.

### 3.3. Spy

Meszaros·Fowler의 Spy는 Stub이면서 호출 정보를 기록해 나중에 검증할 수 있게 하는 더블이다. Mockito `spy()`와 Spock `Spy()`는 실제 객체를 감싸 실제 구현을 실행하면서 호출을 기록하고 일부 메서드만 스터빙하는 부분 모의(partial mock)다.[^1] 레거시 코드나 실제 동작 일부가 필요할 때 쓰지만, 남용하면 테스트 의도가 모호해진다.

---

## 4. 프레임워크별 구현 차이

같은 이름을 프레임워크마다 다른 의미로 쓰는 것이 혼동의 주원인이다.

### 4.1. Spock

Spock은 [[spock]] §7에서 세 팩토리를 분리 제공한다.

```groovy
def stub = Stub(Subscriber)             // 응답만, 호출 횟수 검증 불가
def mock = Mock(Subscriber)             // 응답 + 카디널리티(횟수) 검증
def spy  = Spy(new RealSubscriber())    // 실제 객체 래핑

stub.receive(_) >> "ok"                 // Stub: 응답 지정
1 * mock.receive("event")               // Mock: 행위 검증
1 * spy.receive("event")                // Spy: 실제 실행 + 검증
spy.receive("x") >> "overridden"        // Spy: 부분 스터빙
```

Stub 호출이 `1 *` 같은 필수 상호작용과 일치하면 `InvalidSpecException`이 발생한다. Mock은 카디널리티 검증과 응답 지정을 모두 지원한다.

### 4.2. Mockito

Mockito는 `mock()`·`spy()`만 제공하며, Stub은 별도 객체가 아니라 스터빙 행위(`when().thenReturn()`)를 가리킨다.

```java
List<String> mocked = mock(List.class);
when(mocked.get(0)).thenReturn("a");    // 스터빙(= stub 역할)
verify(mocked).add("x");                // 행위 검증(= mock 역할)

List<String> spy = spy(new ArrayList<>());
spy.add("a");                           // 실제 add 실행
verify(spy).add("a");                   // 호출 검증
doReturn("x").when(spy).get(0);         // 부분 스터빙(spy는 doReturn 권장)
```

Mockito의 `mock()` 객체는 스터빙만 하면 Stub 역할을, `verify()`로 호출을 검증하면 Mock 역할을 한다.[^2] Spy는 실제 메서드가 실행되므로 스터빙할 때 `when(spy.get(0))`은 실제 호출을 유발할 수 있어 `doReturn(...).when(spy)` 형태가 안전하다.

---

## 5. 선택 기준

- **Stub**: 반환값으로 SUT 결과를 검증할 때(Mockito는 `when().thenReturn()`)
- **Mock**: 호출 여부·횟수·인자가 검증 대상일 때(Mockito `verify`, Spock `n *`)
- **Dummy**: 파라미터 자리만 채울 때
- **Fake**: 실제처럼 동작하는 경량 대체(인메모리 등)가 필요할 때
- **Spy**: 실제 로직 일부는 살리고 일부만 제어할 때. 설계 문제의 신호일 수 있어 최소화한다.

행위 검증(Mock)을 남용하면 테스트가 구현 세부에 결합되어 리팩터링에 취약해진다. 상태 검증을 우선하고, 부수효과 위임처럼 상태로 확인할 수 없는 경우에만 Mock을 쓴다.[^3]

---

## Sources
- [Martin Fowler: Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html)
- [Spock: Interaction Based Testing](https://spockframework.org/spock/docs/2.3/all_in_one.html)
- [Mockito: Mockito javadoc](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)

---

## Related pages
- [[good-test-practices]]
- [[inverse-operation-testing]]
- [[spock]]
- [[java-testing-libraries]]
- [[mockito-doreturn-vs-when]]
- [[mockito-void-methods]]

---

[^1]: Fowler 정의에는 실제 객체 위임이 포함되지 않는다. 프레임워크의 spy는 실제 구현을 실행한다는 점에서 같은 이름의 다른 개념이다.
[^2]: Mockito 문서의 직접 서술이 아니라, `mock()`이 기본값을 반환하고 `verify()`로 호출을 검증할 수 있다는 javadoc 설명을 Fowler 분류에 대응시킨 해석이다.
[^3]: Fowler의 "Mocks Aren't Stubs"가 설명하는 행위 검증의 구현 결합 문제에 근거한 권장이며, Fowler 자신은 classicist와 mockist 방식을 모두 소개한다.
