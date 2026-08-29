---
title: expression vs statement
updated: 2026-07-09 08:52:49
tags:
  - java
  - language
---

Java 코드는 **식(expression)** 과 **문(statement)** 으로 구성된다.
식은 평가(evaluate)되어 결과를 내고, 문은 실행(execute)되어 효과를 낸다.

## 1. expression

식은 평가되어 결과를 산출한다. `void` 메서드 호출을 제외하면 값이 있다 (JLS Ch.15).
평가 시 다음 셋 중 하나를 지시(denote)한다 (§15.1).

- **변수** — 대입의 좌변이 될 수 있다

  ```java
  a[0]                 // 배열 접근
  p.name               // 필드 접근
  ```

- **값** — 평가 결과가 값

  ```java
  1 + 2                // int 3
  x > 0 && x < 10      // boolean
  "id-" + 42           // String "id-42"
  Math.max(1, 2)       // 값을 반환하는 메서드 호출
  new int[]{1, 2}      // 배열 생성
  ```

- **아무것도 아님** — `void` 메서드 호출만 해당

  ```java
  list.clear()
  ```

### 1.1. 구문 형태

- primary — 리터럴 `42`, `this`, 필드 접근 `p.name`, 배열 접근 `a[0]`, 메서드 호출 `f()`
- 단항 연산 — `-x`, `!done`, `++i`
- 이항 연산 — `a + b`, `x > 0`, `s instanceof String`
- 삼항 `?:` — `a > b ? a : b`
- 대입 — `x = 1`, `n += 2`
- 캐스트 — `(long) x`
- lambda(§15.27) — `x -> x + 1`
- switch expression(§15.28) — `switch (d) { case MON -> 1; default -> 0; }`

### 1.2. poly vs standalone

타입 결정 방식 기준 분류. 문맥(대입 대상, 메서드 인자 등)이 타입에 영향을 주면
**poly expression**, 자체로 타입이 정해지면 **standalone expression**.
lambda, 메서드 호출, `<>` 인스턴스 생성, 삼항, switch expression이 poly가 될 수 있다.

---

## 2. statement

문은 효과를 위해 실행되며 값을 갖지 않는다 (JLS Ch.14).

- block / empty / labeled

  ```java
  { x++; }                            // block
  ;                                   // empty statement
  outer: while (run) { break outer; } // labeled statement
  ```

- local variable declaration

  ```java
  int x = 5;
  var name = "kim";
  ```

- expression statement — 3장

- 제어 흐름 — `if`, `switch`, `while`, `do-while`, `for`(기본·향상)

  ```java
  if (x > 0) { x--; }
  while (x > 3) { x--; }
  for (int i = 0; i < 3; i++) { }
  switch (x) {
      case 3 -> System.out.println("three");
      default -> { }
  }
  ```

- 제어 이동 — `break`, `continue`, `return`, `yield`, `throw`

  ```java
  if (i == 1) continue;                  // 루프 내부
  return;                                // 메서드 내부
  throw new IllegalStateException();
  ```

- 기타 — `assert`, `synchronized`, `try`(catch/finally, try-with-resources)

  ```java
  assert x > 0;
  synchronized (lock) { x++; }
  try (var in = Files.newInputStream(path)) {
      in.read();
  } catch (IOException e) { }
  ```

문은 값이 없으므로 대입·인자 등 값이 필요한 자리에 올 수 없다:
`int y = if (x > 0) ...` 은 문법 오류다.

---

## 3. expression statement

모든 식이 문이 될 수는 없다. JLS §14.8은 부수효과를 갖는 **7개 형태만**
세미콜론을 붙여 문으로 쓰도록 허용한다.

```java
obj = value;               // Assignment
++x;                       // PreIncrementExpression
--x;                       // PreDecrementExpression
x++;                       // PostIncrementExpression
x--;                       // PostDecrementExpression
list.add(e);               // MethodInvocation
new Thread(r).start();     // ClassInstanceCreationExpression (예: new Foo();)
```

`1 + 2;` 나 `(x);` 처럼 값만 계산하고 버리는 식은 컴파일 오류다.
C/C++과 달리 괄호로 감싼 식도 문이 될 수 없다 — 효과 없는 코드를 문법 차원에서 차단한다.
이런 "값을 버리는 식"이 허용되는 곳은 expression statement와
lambda 본문의 단일 식(§15.27.2) 두 곳뿐이다.

---

## 4. 혼동하기 쉬운 지점

### 4.1. 대입은 식이다

대입식은 대입된 값을 산출한다(§15.26). 체이닝·루프 조건 대입이 가능한 이유.

```java
a = b = 0;                                     // b = 0 이 0을 산출
while ((line = r.readLine()) != null) { ... }  // 대입 결과를 null 비교
if (x = 1) { ... }  // 컴파일 오류: int는 boolean 아님 (C와 달리 boolean 타입만 통과)
```

### 4.2. 삼항은 식, if는 문

값 선택은 삼항, 흐름 제어는 if.

```java
int m = a > b ? a : b;          // expression — 값 산출
if (a > b) m = a; else m = b;   // statement — 효과 실행
```

### 4.3. switch는 둘 다 존재

switch expression은 Java 14+.

| | switch statement | switch expression |
| --- | --- | --- |
| 역할 | 효과 실행 | 값 산출 |
| 완전성(exhaustive) | 선택 (enhanced switch 제외) | 필수 |
| fall-through | `case:` 레이블에서 가능 | 불가 |
| 블록에서 값 반환 | — | `yield` |

```java
int r = switch (day) {          // switch expression
    case MON -> 1;
    default  -> { yield 0; }    // 블록이면 yield 필수
};
```

`yield`는 switch expression 안에서만 유효한 문이다.
[[java17-features]](Switch Expressions), [[java21-features]](Pattern Matching for switch) 참고.

### 4.4. void 메서드 호출은 식이지만 값이 없다

어디에도 대입할 수 없고, expression statement 또는 void 호환 lambda 본문으로만 쓸 수 있다.

```java
Runnable r = () -> System.out.println("hi");  // void 호환 lambda body
```

---

## Sources
- [JLS SE21 Ch.15 Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html)
- [JLS SE21 Ch.14 Blocks and Statements](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html)

---

## Related pages
- [[java17-features]]
- [[java21-features]]
- [[first-class-citizen]]
