---
title: Mockito void 메서드 모킹
updated: 2026-10-22 23:09:21
tags:
  - java
  - testing
  - mockito
  - mock
---

## 1. 개요

목의 `void` 메서드는 반환값이 없어 상태 검증(state verification)을 할 수 없다. 검증 수단은 호출 여부·횟수·인자를 확인하는 상호작용 검증(behavior verification)뿐이다.

또한 `when(mock.method())`는 void 반환을 다른 메서드의 인자로 넣는 형태라 컴파일되지 않는다. 그래서 void 메서드의 스터빙·예외·커스텀 동작 지정은 전부 `doXxx().when()` 계열로 한다(`when()` vs `doXxx()` 문법 배경은 [[mockito-doreturn-vs-when]] §3.1 참고).

---

## 2. doNothing()

목(mock)의 모든 void 메서드는 기본적으로 아무 일도 하지 않으므로 `doNothing()`은 대부분 불필요하다. 공식 문서가 드는 사용 사례는 두 가지다.

- void 메서드의 연속 호출 스터빙: `doNothing().doThrow(new RuntimeException()).when(mock).someVoidMethod()`는 첫 호출에서 아무것도 하지 않고 다음 호출부터 예외를 던진다.
- spy의 void 메서드가 실제 로직을 실행하지 않게 할 때

```java
List<String> spy = spy(new LinkedList<>());
doNothing().when(spy).clear();
spy.clear();   // 실제 clear()가 실행되지 않음
```

---

## 3. doThrow()

```java
doThrow(new RuntimeException()).when(mockedList).clear();
// 다음 호출은 RuntimeException을 던짐
mockedList.clear();
```

### 3.1. 연속 예외
```java
doThrow(FirstException.class, SecondException.class)
    .when(mockedList).clear();
// 1번째 호출 → FirstException, 2번째 호출 → SecondException
```

### 3.2. Checked Exception 제약
`doThrow()`에 넘기는 예외가 checked exception이면, 목이 되는 실제 메서드의 `throws` 절에 선언된 타입이어야 한다. Java의 컴파일 타임 예외 규칙을 Mockito도 그대로 따르기 때문이다. `RuntimeException`(unchecked)은 이 제약이 없어 항상 던질 수 있다.

---

## 4. doAnswer()

호출 인자를 받아 원하는 로직을 실행하고 싶을 때 쓴다. `InvocationOnMock`에서 인자를 꺼낸다.

```java
doAnswer(invocation -> {
    String arg = invocation.getArgument(1);
    // 원하는 로직
    return null;   // void 스텁이므로 반환값은 무시됨
}).when(mock).doSomething(anyString(), anyString());
```

콜백 인자 패턴은 void 메서드가 콜백 객체를 인자로 받아 나중에 그 콜백을 호출하는 구조(비동기 API 등)를 테스트할 때 쓴다.

```java
// 목 대상 메서드: void execute(String operand, Callback callback)
// 콜백 인터페이스 메서드: void receive(String item)
doAnswer(invocation -> {
    Callback callback = invocation.getArgument(1);
    callback.receive("dummy");
    return null;
}).when(mock).execute(anyString(), any(Callback.class));
```

---

## 5. verify()

반환값이 없으므로 "호출됐는지·몇 번·어떤 인자로"만 검증한다.

```java
verify(mock).doSomething("a");                 // 정확히 1회, 인자 "a"
verify(mock, times(2)).doSomething("a");        // 정확히 2회
verify(mock, never()).doSomething("b");         // 호출 안 됨
```

### 5.1. ArgumentCaptor로 인자 캡처

`equals()` 매칭만으로 부족할 때, 실제로 전달된 인자를 꺼내 별도로 단언한다.

```java
ArgumentCaptor<Person> captor = ArgumentCaptor.forClass(Person.class);
verify(mock).doSomething(captor.capture());
assertEquals("John", captor.getValue().getName());
```
공식 문서는 ArgumentCaptor를 검증(verify)에서 쓰고 스터빙에는 쓰지 않도록 권고한다. 스터빙에 쓰면 captor가 assert 블록 밖에서 생성되어 가독성이 떨어지고, 스터빙된 메서드가 호출되지 않으면 아무것도 캡처되지 않아 결함 위치 추적이 어려워진다.

---

## 6. BDDMockito 대응

`do`를 `will`로 바꾸며 나머지 문법은 동일하다([[mockito-doreturn-vs-when]] §5).

```java
willThrow(new RuntimeException()).given(mockedList).clear();
willDoNothing().given(mockedList).clear();
willAnswer(invocation -> { ... }).given(mock).doSomething(anyString());
```

---

## 7. 주의점

- spy의 void 메서드는 기본적으로 실제 로직을 실행한다. 막는 방법은 §2.
- checked exception은 대상 메서드의 `throws` 선언과 일치해야 하며, 불일치 시 `MockitoException`("Checked exception is invalid for this method")이 발생한다.
- `ArgumentCaptor`는 검증용으로 한정. 스터빙 중 캡처는 피한다.

---

## Sources
- [Mockito: Mockito javadoc §11·§12·§15·§37](https://site.mockito.org/javadoc/current/org/mockito/Mockito.html)
- [Baeldung: Mocking void Methods with Mockito](https://www.baeldung.com/mockito-void-methods)

---

## Related pages
- [[mockito-doreturn-vs-when]]
- [[test-double]]
- [[java-testing-libraries]]
