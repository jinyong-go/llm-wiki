---
title: Mockito when()과 doXxx()
updated: 2026-10-22 23:09:21
tags:
  - java
  - testing
  - mockito
  - mock
---

## 1. 개요

Mockito에서 목(mock) 동작을 지정하는 방식은 두 가지다.

- **`when(mock.method()).thenXxx(...)`**: 이 호출이 일어나면(when) 이렇게 동작하라(then)
- **`doXxx(...).when(mock).method()`**: 이렇게 동작하라(do), 이 호출에 대해(when)

둘은 대부분 같은 일을 하지만 실제 메서드 호출 여부·타입 안전성·void 지원·체이닝에서 차이가 있어 Mockito는 둘 다 제공한다.

---

## 2. `when().thenXxx()`

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

`employee`는 목이다. `employee.greet()`를 호출하면 Mockito가 그 호출을 기록하고, `when()`으로 감싸면 비즈니스 로직의 상호작용이 아니라 동작을 지정하려는 선언임을 인식한다. 이어지는 `thenXxx()`로 기대 동작을 정한다.

계열 메서드: `thenReturn` · `thenThrow` · `thenAnswer` · `thenCallRealMethod`.

---

## 3. `doXxx().when()`

### 3.1. void 메서드

```java
// ❌ 컴파일 에러 — void 반환을 메서드 인자로 감쌀 수 없음
when(employee.work(SUNDAY)).thenThrow(new IAmOnHolidayException());

// ✅ doXxx 사용
doThrow(new IAmOnHolidayException()).when(employee).work(SUNDAY);
```
`work()`는 `void`라 `when(employee.work(...))`처럼 다른 메서드 호출의 인자로 넣을 수 없다. `doXxx()`는 목 호출을 인자로 감싸지 않으므로 컴파일된다.

계열 메서드: `doReturn` · `doThrow` · `doAnswer` · `doNothing` · `doCallRealMethod`.

### 3.2. spy 스터빙

`when().thenReturn()`은 스터빙 시점에 실제 메서드를 호출한다. 목은 기본값을 반환하니 문제없지만 spy는 실제 객체에 연결돼 있어 실제 로직이 실행된다.

```java
List<String> spy = spy(new ArrayList<>());

// ❌ 실제 get(0) 호출 → 빈 리스트라 IndexOutOfBoundsException
when(spy.get(0)).thenReturn("foo");

// ✅ 실제 메서드를 호출하지 않음
doReturn("foo").when(spy).get(0);
```
> 공식 문서: *"when using spies please consider doReturn|Answer|Throw() family of methods for stubbing."*

spy는 실제 인스턴스가 아니라 복사본에 위임한다. final 메서드는 Mockito 5.0부터 기본값인 inline mock maker에서 스터빙할 수 있다.[^1]

관련 배경은 [[test-double]](spy는 실제 객체 래핑)와 [[inverse-operation-testing]](미러/부수효과 회피)를 참고.

---

## 4. 핵심 차이

| 항목 | `when().thenXxx()` | `doXxx().when()` |
|------|--------------------|------------------|
| 스터빙 시 실제 메서드 호출 | 호출됨(spy에서 부수효과 위험) | 호출 안 됨 |
| 타입 안전성 | 컴파일 타임 체크(반환 타입 불일치 시 컴파일 에러) | `doReturn(Object)`라 컴파일은 통과하고 런타임에 실패 |
| void 메서드 | 불가(컴파일 에러) | 가능(`doNothing`/`doThrow`/`doAnswer`) |
| 연속 호출 동작 | `thenXxx()` 체이닝 | `when()` 앞에서 `doXxx()` 체이닝 |
| 가독성 | 높음("when~then") | 낮음("do~when") |

### 4.1. 체이닝 차이의 원리
- `when()`은 `OngoingStubbing<T>`를 반환하고 그 `thenXxx()`도 같은 타입을 반환하므로 연속 호출 반환을 체이닝할 수 있다.
  ```java
  when(mock.next()).thenReturn(1).thenReturn(2).thenThrow(new RuntimeException());
  ```
- `doXxx()`는 `Stubber`를 반환하고, `Stubber`도 `doThrow`·`doReturn`·`doNothing` 등을 제공하므로 `when(mock)` 호출 전까지 연속 동작을 체이닝할 수 있다. `Stubber.when(T mock)`은 앱 타입 `T`를 반환하므로 그 뒤로는 체이닝할 수 없다.[^2]
  ```java
  doThrow(new RuntimeException("one")).doThrow(new RuntimeException("two")).when(mock).someVoidMethod();
  doReturn(1, 2, 3).when(spy).next();
  ```

---

## 5. BDDMockito

BDD 표기에서는 `when`을 `given`으로, `do`를 `will`로 바꾸며 나머지는 동일하다([[good-test-practices]]의 Given-When-Then 구조에 대응).

```java
given(employee.greet()).willReturn("Hello");                       // 비-void
willThrow(new IAmOnHolidayException()).given(employee).work(SUNDAY); // void
```

---

## 6. 선택 기준

- 목의 비-void 메서드: `when().thenReturn()`
- void 메서드: `doNothing`·`doThrow`·`doAnswer`
- spy: `doReturn`·`doAnswer`·`doThrow`
- BDD 스타일 팀: `given`·`will`로 통일

---

## Sources
- [Baeldung: Difference Between when() and doXxx() Methods in Mockito](https://www.baeldung.com/java-mockito-when-vs-do)
- `raw/java/test/Difference Between when() and doXxx() Methods in Mockito.md`
- [Mockito: javadoc Spying on real objects](https://site.mockito.org/javadoc/current/org/mockito/Mockito.html)
- [Sangsoo Nam: Mockito: doReturn vs thenReturn](http://sangsoonam.github.io/2019/02/04/mockito-doreturn-vs-thenreturn.html)
- [Mockito: javadoc Stubber](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/stubbing/Stubber.html)

---

## Related pages
- [[test-double]]
- [[good-test-practices]]
- [[java-testing-libraries]]
- [[inverse-operation-testing]]
- [[mockito-void-methods]]

---

[^1]: javadoc §13은 "Mockito doesn't mock final methods"라고 서술하지만, §0.2는 5.0.0부터 inline mock maker가 기본이라고 명시하고 §39는 inline mock maker의 final 메서드 모킹을 설명한다.
[^2]: raw 소스(Baeldung)는 doXxx() 방식으로 여러 동작을 체이닝할 수 없다고 서술하나, Mockito Stubber javadoc은 when() 이전 단계의 연속 스터빙 예시를 제시한다. 공식 문서를 따랐다.
