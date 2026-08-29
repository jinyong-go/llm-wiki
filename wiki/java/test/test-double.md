---
title: 테스트 더블 — Mock·Stub·Spy 차이
updated: 2026-07-08 10:32:15
tags:
  - java
  - testing
  - test-double
  - mock
  - stub
  - spy
---

## 1. 개요 — 테스트 더블이란

**테스트 더블(Test Double)**은 테스트 대상(SUT, System Under Test)이 의존하는 실제 협력 객체(collaborator)를 대체하는 가짜 객체다. 실제 협력 객체를 쓰기 어렵거나(느림·비결정적·부수효과), SUT의 상호작용을 통제·관찰하려 할 때 사용한다.

Gerard Meszaros가 정의하고 Martin Fowler가 정리한 5종 분류가 표준으로 쓰인다. 흔히 혼동되는 **Mock·Stub·Spy**가 이 중 핵심이다.

---

## 2. 분류

| 종류 | 정의 |
|------|------|
| **Dummy** | 전달되지만 실제로 사용되지 않음. 파라미터 목록을 채우는 용도. |
| **Fake** | 동작하는 구현을 갖지만 운영에 부적합한 지름길을 씀(예: 인메모리 DB). |
| **Stub** | 테스트용으로 정해둔 **고정 응답(canned answer)**만 반환. 그 외 호출엔 반응 안 함. |
| **Spy** | Stub이면서 **호출된 방식(정보)을 기록**함. |
| **Mock** | 받을 것으로 **기대되는 호출의 명세(expectation)**를 미리 프로그래밍한 객체. |

> "이들 중 **오직 Mock만 행위 검증(behavior verification)을 요구**한다. 나머지는 대개 상태 검증(state verification)을 쓴다." — Fowler

---

## 3. 핵심 축 — 상태 검증 vs 행위 검증

Mock/Stub/Spy를 가르는 본질은 **무엇을 검증하는가**이다.

- **상태 검증(State Verification)**: 실행 후 SUT와 협력 객체의 **상태(반환값·필드)**를 확인. → Stub이 뒷받침.
- **행위 검증(Behavior Verification)**: SUT가 협력 객체를 **올바르게 호출했는지**(횟수·인자·순서)를 확인. → Mock이 강제.

| 종류 | 목적 | 검증 방식 | 핵심 질문 |
|------|------|-----------|-----------|
| **Stub** | 정해진 응답 제공 | 상태 검증 | "이 응답을 주면 SUT가 올바른 결과를 내는가?" |
| **Mock** | 호출 발생 검증 | 행위 검증 | "SUT가 협력 객체를 올바르게 **호출**했는가?" |
| **Spy** | 실제 객체 + 호출 기록 | 상태/행위 혼합 | "실제 동작은 살리되 호출을 관찰/부분 제어하고 싶다" |

### 3.1. Stub — 응답을 대신함
협력 객체가 **무엇을 반환하는지**만 관심. 호출 횟수는 검증하지 않는다. SUT의 **결과(상태)**를 검증하기 위한 입력 공급원이다.

### 3.2. Mock — 상호작용을 검증함
협력 객체가 **어떻게 호출되었는지**(횟수·인자·순서)를 검증한다. 반환값 자체보다 부수효과 위임이 올바른지를 확인한다.

### 3.3. Spy — 실제 객체를 부분 대체
**실제 구현을 그대로 실행**하면서 호출을 기록하거나 일부 메서드만 오버라이드(부분 스터빙)한다. 레거시 코드나 실제 동작 일부가 필요할 때 쓰지만, 남용하면 테스트 의도가 모호해진다.

---

## 4. 프레임워크별 구현 차이

같은 이름을 프레임워크마다 다르게 쓴다는 점이 혼동의 주원인이다.

### 4.1. Spock — 셋을 명시적으로 구분

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
- **Stub**에 `1 *` 카디널리티를 써도 검증 대상이 아니라 무시된다.
- **Mock**은 카디널리티 검증과 응답 지정을 모두 지원한다.

### 4.2. Mockito — mock / spy 두 가지

Mockito는 `mock()`·`spy()`만 있고 **Stub은 별도 객체가 아니라 스터빙 행위**(`when().thenReturn()`)를 가리킨다.

```java
List<String> mocked = mock(List.class);
when(mocked.get(0)).thenReturn("a");    // 스터빙(= stub 역할)
verify(mocked).add("x");                // 행위 검증(= mock 역할)

List<String> spy = spy(new ArrayList<>());
spy.add("a");                           // 실제 add 실행
verify(spy).add("a");                   // 호출 검증
doReturn("x").when(spy).get(0);         // 부분 스터빙(spy는 doReturn 권장)
```
- Mockito의 `mock()`은 "기본은 stub, `verify()`를 붙이면 mock"으로 동작한다.
- Spy는 실제 메서드가 실행되므로, 스터빙 시 `when(spy.get(0))`은 실제 호출을 유발할 수 있어 `doReturn(...).when(spy)` 형태가 안전하다.

---

## 5. 실무 선택 기준

- **반환값으로 SUT 결과 검증** → Stub (Mockito는 `when().thenReturn()`)
- **호출 여부·횟수·인자가 검증 대상** → Mock + `verify` / Spock `n *`
- **파라미터 자리만 채움** → Dummy
- **실제처럼 동작하는 경량 대체(인메모리 등)** → Fake
- **실제 로직 일부는 살리고 일부만 제어** → Spy (설계 냄새 신호일 수 있으니 최소화)

> **주의**: 행위 검증(Mock)을 남용하면 테스트가 구현 세부에 결합되어 리팩터링에 취약해진다. 가능하면 **상태 검증(Stub)** 을 우선하고, 부수효과 위임처럼 상태로 확인 불가능한 경우에만 Mock을 쓰는 것이 일반적 권장이다.

---

## 6. 요약

- 테스트 더블 5종: Dummy(미사용)·Fake(경량 실구현)·Stub(고정 응답)·Spy(Stub+호출 기록)·Mock(호출 기대 명세).
- 본질 축은 **상태 검증(Stub) vs 행위 검증(Mock)**. Mock만 행위 검증을 강제한다.
- Spock은 `Stub`/`Mock`/`Spy`를 명시 구분. Mockito는 `mock()`/`spy()`뿐이며 stub은 `when().thenReturn()` 행위로 표현.
- 기본은 Stub(상태 검증) 우선, 부수효과 위임 검증에만 Mock 사용.

---

## Sources
- Martin Fowler, "Mocks Aren't Stubs" (Meszaros 분류·상태 vs 행위 검증): https://martinfowler.com/articles/mocksArentStubs.html
- Spock Framework Reference — Interaction Based Testing: https://spockframework.org/spock/docs/2.3/all_in_one.html
- Mockito javadoc (mock/spy/verify): https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html

---

## Related pages
- [[good-test-practices]] — 결과/상태 검증 우선 원칙의 상위 맥락
- [[inverse-operation-testing]] — 미러 대신 독립 구현/고정 벡터를 쓰는 이유
- [[spock]] — Spock의 Mock/Stub/Spy 구현(§7 상호작용 기반 테스트)
- [[java-testing-libraries]] — 모킹 라이브러리 분류(Mockito/EasyMock/JMockit/PowerMock)
- [[mockito-doreturn-vs-when]] — Mockito 스터빙 구문(spy에서 doReturn을 쓰는 이유)
