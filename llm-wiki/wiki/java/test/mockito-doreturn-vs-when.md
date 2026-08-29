---
title: Mockito when().thenXxx() vs doXxx().when() — 동작·차이·좋은 패턴
updated: 2026-07-08 10:32:15
tags:
  - java
  - testing
  - mockito
  - mock
---

## 1. 개요

Mockito에서 목(mock) 동작을 지정하는 방식은 두 가지다.

- **`when(mock.method()).thenXxx(...)`** — "이 호출이 일어나면(when) → 이렇게 동작하라(then)"
- **`doXxx(...).when(mock).method()`** — "이렇게 동작하라(do) → 이 호출에 대해(when)"

둘은 대부분 같은 일을 하지만, **실제 메서드 호출 여부·타입 안전성·void 지원·체이닝**에서 갈린다. 그래서 Mockito는 둘 다 제공한다.

---

## 2. `when().thenXxx()` — 기본 방식

```java
interface Employee {
    String greet();
    void work(DayOfWeek day);
}

@Test
void when_구문() {
    when(employee.greet()).thenReturn("Hello");   // 등록
    assertThat(employee.greet()).isEqualTo("Hello");
}
```

동작 원리: `employee`는 목이다. `employee.greet()`를 호출하면 Mockito가 그 호출을 **기록**하고, `when()`으로 감싸면 "이건 비즈니스 로직의 상호작용이 아니라 **동작을 지정하려는 선언**"임을 인식한다. 이어지는 `thenXxx()`로 기대 동작을 정한다.

계열 메서드: `thenReturn` · `thenThrow` · `thenAnswer` · `thenCallRealMethod`.

---

## 3. `doXxx().when()` — void와 spy를 위한 방식

### 3.1. void 메서드는 `when()`으로 감쌀 수 없다

```java
// ❌ 컴파일 에러 — void 반환을 메서드 인자로 감쌀 수 없음
when(employee.work(SUNDAY)).thenThrow(new IAmOnHolidayException());

// ✅ doXxx 사용
doThrow(new IAmOnHolidayException()).when(employee).work(SUNDAY);
```
`work()`는 `void`라 `when(employee.work(...))`처럼 **다른 메서드 호출의 인자로 넣을 수 없다**. `doXxx()`는 목 호출을 인자로 감싸지 않으므로 컴파일된다.

계열 메서드: `doReturn` · `doThrow` · `doAnswer` · `doNothing` · `doCallRealMethod`.

### 3.2. spy 스터빙 — 실제 메서드 호출을 피한다

`when().thenReturn()`은 스터빙 시점에 **실제 메서드를 호출**한다. 목은 기본값을 반환하니 문제없지만, **spy는 실제 객체에 연결**돼 있어 실제 로직이 실행된다.

```java
List<String> spy = spy(new ArrayList<>());

// ❌ 실제 get(0) 호출 → 빈 리스트라 IndexOutOfBoundsException
when(spy.get(0)).thenReturn("foo");

// ✅ 실제 메서드를 호출하지 않음
doReturn("foo").when(spy).get(0);
```
> 공식 문서: *"when using spies please consider doReturn|Answer|Throw() family of methods for stubbing."*

관련 배경은 [[test-double]](spy는 실제 객체 래핑)와 [[inverse-operation-testing]](미러/부수효과 회피)를 참고.

---

## 4. 핵심 차이

| 항목 | `when().thenXxx()` | `doXxx().when()` |
|------|--------------------|------------------|
| 스터빙 시 **실제 메서드 호출** | **호출됨** (spy에서 부수효과 위험) | **호출 안 됨** |
| **타입 안전성** | 컴파일 타임 체크(반환 타입 불일치 시 컴파일 에러) | `doReturn(Object)` → 컴파일 통과, **런타임 실패** |
| **void 메서드** | 불가(컴파일 에러) | 가능(`doNothing`/`doThrow`/`doAnswer`) |
| **여러 동작 체이닝** | 가능 | 불가 |
| 가독성 | 높음("when~then") | 낮음("do~when") |

### 4.1. 체이닝 차이의 원리
- `when()`은 **`OngoingStubbing<T>`**를 반환하고, 그 `thenXxx()`도 같은 타입을 반환한다 → **연속 호출 반환을 체이닝**할 수 있다.
  ```java
  when(mock.next()).thenReturn(1).thenReturn(2).thenThrow(new RuntimeException());
  ```
- `doXxx()`는 **`Stubber`**를 반환하고 `Stubber.when(T mock)`은 **앱 타입 `T`**(예: `Employee`)를 반환한다. Mockito 타입이 아니라 **체이닝으로 여러 동작을 추가할 수 없다**.

---

## 5. BDDMockito — given/will 스타일

BDD 표기로 바꾸면 `when`→`given`, `do`→`will`로 치환된다. 나머지는 동일하다([[good-test-practices]]의 Given-When-Then과 어울림).

```java
given(employee.greet()).willReturn("Hello");                       // 비-void
willThrow(new IAmOnHolidayException()).given(employee).work(SUNDAY); // void
```

---

## 6. 장단점 · 좋은 패턴

**`when().thenXxx()` (기본 권장)**
- 장점: 타입 안전, 가독성, 다중 동작 체이닝.
- 단점: void 불가, spy에서 실제 메서드 호출 위험.
- → **일반 목(mock)의 비-void 메서드 스터빙 기본값.**

**`doXxx().when()`**
- 장점: void 지원, 실제 메서드 미호출(spy 안전), setup 중 예외 회피.
- 단점: 타입 비안전(런타임 실패), 체이닝 불가, 가독성 낮음.
- → **void 메서드, spy 스터빙, setup 중 실제 실행이 곤란한 경우.**

**패턴 요약**
- 목 + 비-void → `when().thenReturn()`
- void → `doNothing/doThrow/doAnswer`
- spy → `doReturn/doAnswer/doThrow` 계열
- 팀이 BDD 스타일이면 `given/will`로 일관성 유지
- 주의: spy는 실제 인스턴스가 아니라 **복사본**에 위임하며, **final 메서드는 mock 불가**.

---

## 7. 요약

- 두 구문은 대체로 동치지만 **void·spy·타입안전·체이닝**에서 갈린다.
- 기본은 **`when().thenXxx()`**(타입 안전·가독성·체이닝). **void와 spy**는 **`doXxx().when()`**.
- 체이닝 차이는 반환 타입(`OngoingStubbing<T>` vs `Stubber`) 때문.
- BDD 팀은 `given/will`로 통일.

---

## Sources
- raw/java/test/Difference Between when() and doXxx() Methods in Mockito.md (Baeldung, Attila Fejér): https://www.baeldung.com/java-mockito-when-vs-do
- Mockito javadoc — Spying on real objects / doReturn: https://site.mockito.org/javadoc/current/org/mockito/Mockito.html
- Sangsoo Nam — Mockito: doReturn vs thenReturn: http://sangsoonam.github.io/2019/02/04/mockito-doreturn-vs-thenreturn.html

---

## Related pages
- [[test-double]] — Mock/Stub/Spy 개념(spy 실제 메서드 호출 배경)
- [[good-test-practices]] — Given-When-Then, Mock 남용 주의
- [[java-testing-libraries]] — Mockito의 위치(모킹 라이브러리)
- [[inverse-operation-testing]] — 부수효과/미러 회피 관점
