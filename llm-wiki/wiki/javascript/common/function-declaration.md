---
title: 자바스크립트 함수 선언
updated: 2026-08-27 17:40:43
tags:
  - javascript
  - function
---

## 1. 개요

자바스크립트에서 함수를 정의하는 방법은 크게 세 가지다: **함수 선언문**(function declaration), **함수 표현식**(function expression), **화살표 함수**(arrow function). 문법만 다른 게 아니라 호이스팅 여부와 `this` 바인딩 방식이 서로 다르다.

---

## 2. 함수 선언문

```javascript
function add(a, b) {
  return a + b;
}
```

### 2.1. 호이스팅

함수 선언문은 **함수 전체(본문 포함)가 호이스팅**된다 — 선언보다 앞에서 호출해도 정상 동작한다.

```javascript
hoisted(); // "동작함"

function hoisted() {
  console.log("동작함");
}
```

[[variable-declaration]]에서 다루는 `var`/`let`/`const`의 호이스팅과는 다르다 — 변수는 선언만 끌어올려지고 초기화는 그 자리에 남지만, 함수 선언문은 값(함수 본문)까지 통째로 끌어올려진다.

### 2.2. 블록 스코프

non-strict 모드에서 블록(`if`, `{}` 등) 안의 함수 선언문은 구현체마다 동작이 달라 신뢰할 수 없다. **strict 모드**에서는 `let`처럼 그 블록에 스코프되고, 블록 최상단으로 호이스팅된다([[lexical-scope]] §2 스코프 종류 참고).

```javascript
"use strict";
{
  foo(); // "foo" — 블록 안에서는 호출 가능
  function foo() {
    console.log("foo");
  }
}
foo(); // ReferenceError — 블록 밖에서는 접근 불가
```

---

## 3. 함수 표현식

```javascript
const add = function (a, b) {
  return a + b;
};
```

### 3.1. 호이스팅되지 않음

함수 표현식은 대입된 변수의 호이스팅 규칙만 따른다 — `var`라면 선언만 호이스팅되고 값은 실행 시점에 대입되므로, 정의 전에 호출하면 에러가 난다.

```javascript
notHoisted(); // TypeError: notHoisted is not a function

var notHoisted = function () {
  console.log("bar");
};
```

### 3.2. 익명 vs 기명 함수 표현식

이름을 생략할 수 있다(**익명 함수**). 함수 내부에서 자기 자신을 재귀 호출해야 한다면 **기명 함수 표현식**을 쓴다 — 이 이름은 함수 본문 안에서만 유효하고, 바깥 스코프에는 노출되지 않는다.

```javascript
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1); // fact는 함수 본문 안에서만 참조 가능
};

factorial(3); // 6
typeof fact;  // "undefined" — 바깥에서는 접근 불가
```

---

## 4. 화살표 함수

```javascript
const add = (a, b) => a + b;
```

괄호는 매개변수가 하나뿐일 때만 생략할 수 있고, 중괄호는 본문이 표현식 하나뿐이라 값을 암묵적으로 반환할 때만 생략할 수 있다. 여러 문장이 필요하면 중괄호와 명시적 `return`을 써야 한다.

```javascript
const double = (n) => n * 2;        // 괄호 생략 불가(스타일에 따라 생략하기도 함), 중괄호 생략
const log = (a, b) => {             // 매개변수 2개 → 괄호 필수
  console.log(a, b);
  return a + b;                     // 문장이 여럿 → 중괄호·return 필수
};
```

### 4.1. 일반 함수와의 차이

**`this`/`arguments`/`super` 바인딩이 없다** — 자신을 둘러싼 스코프의 것을 그대로 가져와 쓴다. 그래서 메서드로는 적합하지 않다. 자세한 내용과 예시는 [[lexical-scope]] §6 참고.

**생성자로 쓸 수 없다** — `new`로 호출하면 `TypeError`.

```javascript
const Foo = () => {};
new Foo(); // TypeError: Foo is not a constructor
```

**generator로 만들 수 없다** — 화살표 함수 본문에서 `yield`를 쓸 수 없다.

```javascript
const gen = () => {
  yield 1; // SyntaxError: yield는 제너레이터 함수 안에서만 사용 가능
};
```

---

## 5. 매개변수

### 5.1. 기본값

인자를 생략하거나 `undefined`를 넘기면 기본값이 적용된다. 각 매개변수의 기본값은 **서로 독립적으로 적용**된다 — 여러 매개변수에 기본값을 줘도 마지막 것만 적용되는 게 아니라, 인자가 없거나 `undefined`인 자리마다 각자의 기본값이 채워진다.

```javascript
function multiply(a = 5, b = 1) {
  return a * b;
}

multiply();       // 5 — a=5(기본값), b=1(기본값)
multiply(10);      // 10 — a=10, b=1(기본값)
multiply(10, 20);  // 200 — 둘 다 인자로 채워짐
```

자바스크립트는 이름 있는 인자가 없어 위치로만 전달하므로, 앞쪽 매개변수를 건너뛰고 뒤쪽만 넘기려면 명시적으로 `undefined`를 써야 한다.

```javascript
multiply(undefined, 20); // 100 — a=5(기본값), b=20
```

### 5.2. 나머지 매개변수

마지막 매개변수에 `...`를 붙이면 남은 인자들을 배열로 받는다. 함수당 하나만, 반드시 마지막 위치에만 쓸 수 있다.

```javascript
function sum(...nums) {
  return nums.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3); // 6
```

---

## 6. 선언 방식 비교

| | 함수 선언문 | 함수 표현식 | 화살표 함수 |
|---|---|---|---|
| 호이스팅 | 본문까지 호이스팅 | 대입 변수의 규칙만 따름 | 대입 변수의 규칙만 따름 |
| 이름 | 필수 | 선택(익명 가능) | 없음(변수에 대입해 참조) |
| 자신만의 `this` | 있음(호출 방식에 따라 결정) | 있음(호출 방식에 따라 결정) | 없음(바깥 스코프의 `this`) |
| `arguments` 객체 | 있음 | 있음 | 없음 |
| `new`로 생성자 호출 | 가능 | 가능 | 불가(`TypeError`) |

---

## 7. 기타

### 7.1. 즉시 실행 함수(IIFE)

정의하자마자 바로 실행하는 함수 표현식이다. 임시 변수를 스코프 안에 가두고 싶을 때 쓴다 — ES6 이후로는 모듈이나 블록 스코프(`let`/`const`)가 대신하는 경우가 많아 쓰임이 줄었다.

```javascript
const result = (() => {
  const a = compute1();
  const b = compute2();
  return a + b;
})();
// a, b는 바깥에서 접근 불가
```

### 7.2. 메서드 단축 문법

객체 리터럴 안에서는 `function` 키워드 없이 메서드를 정의할 수 있다.

```javascript
const obj = {
  greet() {           // function greet() {...}과 동일
    return "hi";
  },
};
```

화살표 함수는 `this`가 없어 이 자리에 쓰면 안 된다 — 이유는 [[lexical-scope]] §6 참고.

---

## Sources

- MDN — function statement: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function
- MDN — function expression: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function
- MDN — Arrow function expressions: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
- MDN — Default parameters: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters
- MDN — Rest parameters: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters

---

## Related pages

- [[lexical-scope]] — this 바인딩, 클로저
- [[variable-declaration]] — var/let/const 호이스팅과의 비교
- [[first-class-citizen]] — 함수를 값으로 다루는 개념
