---
title: 자바스크립트 변수 선언
updated: 2026-08-11 17:56:14
tags:
  - javascript
  - variable
---

## 1. 개요

자바스크립트에서 변수를 선언하는 방법은 `var`, `let`, `const` 세 가지다. 셋 다 변수를 선언하지만 스코프·호이스팅·재선언 규칙이 다르다.

`var`는 ES1부터 존재하는 함수 스코프 선언이고, `let`/`const`는 ES2015(ES6)에서 도입된 블록 스코프 선언이다. `let`은 재할당 가능한 변수를, `const`는 재할당 불가능한 바인딩을 선언한다.

---

## 2. 스코프

### 2.1. var — 함수 스코프

`var`로 선언한 변수의 스코프는 자신을 감싸는 가장 가까운 함수 전체다. `if`/`for`/`{}` 같은 블록 구문은 스코프를 만들지 않으므로, 블록 안에서 선언해도 함수 어디서든 접근할 수 있고 같은 이름은 같은 변수를 가리킨다.

```javascript
function varTest() {
  var x = 1;
  { var x = 2; } // 같은 변수
  console.log(x); // 2
}
```

반복문 헤더도 블록 스코프가 아니므로 반복이 끝난 뒤에도 변수가 남는다.

```javascript
for (var i of [1, 2, 3]);
console.log(i); // 3
```

함수 밖에서 선언하면 스크립트 또는 모듈 최상위가 스코프가 된다.

### 2.2. let/const — 블록 스코프

`let`/`const`로 선언한 변수의 스코프는 자신을 감싸는 가장 가까운 블록이다. 블록 안팎의 같은 이름은 서로 다른 변수이며, 블록 밖에서는 접근할 수 없다.

```javascript
function letTest() {
  let x = 1;
  { let x = 2; } // 다른 변수
  console.log(x); // 1
}
```

반복문 헤더에서 선언하면 반복문 밖에서 접근할 수 없다.

```javascript
for (let i of [1, 2, 3]);
console.log(i); // ReferenceError: i is not defined
```

---

## 3. 호이스팅과 TDZ

셋 다 선언은 스코프 최상단으로 끌어올려지지만(호이스팅), 접근 가능 시점이 다르다. `var`는 선언 전 접근 시 `undefined`를 반환하는 반면, `let`/`const`는 선언 지점에 도달하기 전까지 **TDZ**(Temporal Dead Zone) 상태로 접근 시 `ReferenceError`가 발생한다.

```javascript
console.log(bar); // undefined
console.log(foo); // ReferenceError: Cannot access 'foo' before initialization
var bar = 1;
let foo = 2;
```

---

## 4. 재선언과 재할당

| | 재선언 | 재할당 |
| --- | --- | --- |
| `var` | 가능 (에러 없음) | 가능 |
| `let` | 불가 (`SyntaxError`) | 가능 |
| `const` | 불가 (`SyntaxError`) | 불가 (`TypeError`) |

```javascript
var a = 1; var a = 2; // OK, a === 2
let b = 1; let b = 2; // SyntaxError
const c = 1; c = 2;   // TypeError: Assignment to constant variable
```

`const`는 값이 아니라 **바인딩(참조)**을 고정한다. 객체·배열을 가리키는 `const` 변수도 프로퍼티·요소 변경은 가능하다.

```javascript
const obj = { key: "value" };
obj.key = "otherValue"; // OK — 참조는 그대로, 내용만 변경
obj = {};                // TypeError
```

값 자체를 불변으로 만들려면 `Object.freeze()`가 필요하다.

`var`는 동일 스코프에서 `function` 선언과 공존 가능하지만, `let`/`const`/`class`/`import`와는 같은 스코프에서 공존할 수 없다.

---

## 5. 전역 객체 프로퍼티

스크립트 최상위에서 `var`로 선언한 변수는 전역 객체(`globalThis`)의 프로퍼티가 되지만, `let`/`const`는 그렇지 않다.

```javascript
var x = "global";
let y = "global";
console.log(globalThis.x); // "global"
console.log(globalThis.y); // undefined
```

---

## 6. 선택 기준

MDN을 포함한 다수 스타일 가이드는 재할당이 없는 변수에는 `const`를, 재할당이 필요한 경우에만 `let`을 권장한다. `var`는 스코프 문제(호이스팅, 함수 스코프)로 인한 버그 가능성 때문에 ES2015 이후 코드에서는 사용을 지양한다.

---
## Sources
- [let — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [const — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [var — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)

---

## Related pages
- [[lexical-scope]] — 스코프 체인, 환경 레코드, 클로저
