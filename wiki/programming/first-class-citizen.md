---
title: 일급 객체 (First-class Citizen)
updated: 2026-07-14 11:26:44
tags:
  - programming
  - language
  - functional-programming
---

**일급 객체(first-class citizen)** 는 언어에서 다른 개체들이 일반적으로 사용할 수 있는
모든 연산을 지원하는 개체다. Christopher Strachey가 1960년대에 도입한 개념으로,
ALGOL에서 실수(first-class)와 달리 프로시저는 변수나 식으로 표현될 수 없던 것을 대비한 데서 유래한다.

## 1. 정의

Robin Popplestone이 정리한 일급 개체의 4가지 권리:

1. 함수의 실인자(actual parameter)가 될 수 있다
2. 함수의 반환값이 될 수 있다
3. 대입문의 대상이 될 수 있다
4. 동등성 검사(equality test)의 대상이 될 수 있다

## 2. 일급 함수

함수가 다른 변수와 동일하게 취급되는 언어는 **일급 함수(first-class function)** 를
가진다고 말한다 (MDN 기준 3조건):

- 변수에 대입 가능
- 다른 함수의 인자로 전달 가능 — 이렇게 전달되는 함수가 **콜백(callback)**
- 다른 함수의 반환값이 될 수 있음

함수를 인자로 받거나 반환하는 함수를 **고차 함수(higher-order function)** 라 한다.

```javascript
const foo = () => "hello";          // 변수에 대입
const call = (f) => f();            // 인자로 전달 (f는 콜백, call은 고차 함수)
const make = () => () => "hi";      // 함수를 반환
```

## 3. 언어별 지원

| 언어 | 함수의 일급 지원 |
| --- | --- |
| Python, JavaScript, Smalltalk, Scala, Haskell | 완전 지원 |
| C | 함수 포인터로 제한적 지원[^1] |
| Java | 메서드 자체는 일급 아님 — 함수형 인터페이스로 우회 (4장) |

Smalltalk·Ruby·Python·Common Lisp에서는 클래스도 일급이다(메타클래스의 인스턴스).

[^1]: Wikipedia는 C의 함수를 "second-class citizen"으로 부르기도 한다고 기술한다.

## 4. Java에서의 일급 함수

Java의 메서드는 값이 아니므로 그 자체로는 일급이 아니다.
Java 8+의 lambda는 "기능을 메서드 인자처럼, 코드를 데이터처럼"(Oracle Tutorial)
다루게 하지만, 실체는 **함수형 인터페이스(단일 추상 메서드 인터페이스)의 인스턴스**다.

`java.util.function`의 표준 함수형 인터페이스:

| 인터페이스 | 추상 메서드 |
| --- | --- |
| `Predicate<T>` | `boolean test(T t)` |
| `Consumer<T>` | `void accept(T t)` |
| `Function<T,R>` | `R apply(T t)` |

```java
Predicate<Person> adult = p -> p.getAge() >= 18;   // 변수에 대입
roster.stream().filter(adult)                      // 인자로 전달
      .forEach(Person::print);                     // 메서드 참조
```

lambda 식 자체의 문법적 지위는 [[expression-vs-statement]](§15.27) 참고.

---

## Sources
- [First-class citizen — Wikipedia](https://en.wikipedia.org/wiki/First-class_citizen)
- [First-class Function — MDN Glossary](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)
- [Lambda Expressions — The Java Tutorials (Oracle)](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)

---

## Related pages
- [[expression-vs-statement]]
