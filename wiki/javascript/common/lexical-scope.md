---
title: 자바스크립트 렉시컬 스코프
updated: 2026-08-11 17:56:14
tags:
  - javascript
  - scope
  - closure
---

## 1. 개요

**스코프**는 값과 표현식이 참조 가능한 실행 컨텍스트다. 어떤 식별자가 현재 스코프에 없으면 사용할 수 없다.

자바스크립트는 **렉시컬 스코프**(정적 스코프)를 채택한다. 식별자가 어느 바인딩을 가리키는지가 **소스 코드에 작성된 위치**로 결정된다는 뜻이다. 함수가 호출되는 위치나 호출 경로는 영향을 주지 않는다.

```javascript
const x = "outer";

function inner() {
  console.log(x);   // 항상 "outer" — inner가 정의된 위치 기준
}

function caller() {
  const x = "inner";
  inner();          // "outer"
}
caller();
```

호출 스택을 따라 식별자를 찾는 방식은 **동적 스코프**이며, 위 예시에서 `"inner"`가 출력됐을 것이다. 자바스크립트에는 이 방식이 없다.

---

## 2. 스코프 종류

| 스코프 | 생성 단위 | 대상 |
|---|---|---|
| 전역 | 스크립트 모드로 실행되는 코드 전체 | 모든 선언 |
| 모듈 | 모듈 단위 파일 | 모든 선언 ([[es-module]]) |
| 함수 | 함수 | 모든 선언 |
| 블록 | 중괄호 `{}` | `let`, `const`, `class`, strict 모드의 `function` |

스코프는 계층을 이룬다. **자식 스코프는 부모 스코프에 접근할 수 있지만 반대는 불가능하다.**

```javascript
{ const x = 1; }
console.log(x);   // ReferenceError

{ var y = 1; }
console.log(y);   // 1 — var는 블록 스코프가 아님
```

선언 키워드별 스코프 차이는 [[variable-declaration]] §2 참고.

---

## 3. 스코프 체인

중첩된 함수는 자신을 감싸는 스코프에 접근할 수 있고, 그 바깥 스코프에도 연쇄적으로 접근한다. 이 연결을 **스코프 체인**이라 한다.

```javascript
const e = 10;
function sum(a) {
  return function (b) {
    return function (c) {
      return function (d) {
        return a + b + c + d + e;
      };
    };
  };
}

console.log(sum(1)(2)(3)(4));   // 20
```

식별자 해석은 가장 안쪽 스코프에서 시작해 바깥으로 진행하며, **처음 발견된 바인딩**을 사용한다. 안쪽에 같은 이름이 있으면 바깥 바인딩은 가려진다(shadowing).

```javascript
const v = "global";
function f() {
  const v = "local";
  console.log(v);   // "local" — 바깥 v는 가려짐
}
```

전역까지 탐색해도 없으면 `ReferenceError`가 발생한다.

---

## 4. 환경 레코드

명세 수준에서 스코프는 **환경 레코드**(Environment Record)로 표현된다. 식별자 이름과 값의 결합(binding)을 관리하는 명세 타입이다.

| 종류 | 역할 |
|---|---|
| Declarative | 블록 스코프의 `let`·`const`·`class`·함수 선언 바인딩 |
| Object | 식별자를 객체 프로퍼티에 결합. `with` 문이 사용 ([§7.1](#71-with)) |
| Function | 함수 실행 시 생성. `this`·`super` 바인딩 담당 |
| Global | 최외곽 전역 바인딩 |
| Module | 모듈 최상위 선언과 import 바인딩 |

각 환경 레코드는 외부 환경을 가리키는 참조(`OuterEnv` 내부 슬롯)를 갖는다. 이 참조가 연결되어 스코프 체인을 구성한다.

식별자 해석 절차는 다음과 같다.

1. 현재 환경 레코드에서 바인딩을 찾는다
2. 없으면 `OuterEnv`를 따라 바깥 환경으로 이동한다
3. 발견하거나 전역까지 소진할 때까지 반복한다

렉시컬 스코프가 성립하는 이유가 여기 있다. `OuterEnv`는 함수가 **정의될 때** 그 시점의 환경으로 결정되며, 호출 방식과 무관하다.

---

## 5. 클로저

**클로저**는 함수와 그 함수가 선언된 렉시컬 환경의 조합이다. 자바스크립트에서는 함수가 생성될 때마다 클로저가 만들어진다.

외부 함수가 반환된 뒤에도 내부 함수가 외부 변수를 계속 참조할 수 있다.

```javascript
function makeCounter() {
  let count = 0;                    // 외부에서 직접 접근 불가
  return {
    increment() { count += 1; },
    value() { return count; },
  };
}

const c1 = makeCounter();
const c2 = makeCounter();
c1.increment();
c1.increment();
console.log(c1.value());   // 2
console.log(c2.value());   // 0 — 호출마다 독립된 환경
```

`makeCounter()` 호출마다 새 환경 레코드가 생성되므로 인스턴스별 상태가 분리된다. 반환된 세 함수는 **같은 환경을 공유**하므로 `count`를 함께 조작한다.

이 구조가 접근 제한자 없이 비공개 상태를 만드는 수단이 된다(모듈 패턴).

### 5.1. 반복문과 클로저

`var`는 함수 스코프이므로 반복 전체가 바인딩 하나를 공유한다. 반복 중 만들어진 함수들이 모두 같은 변수를 참조하게 되고, 실행 시점에는 마지막 값만 남아 있다.

```javascript
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map((f) => f()));   // [3, 3, 3]
```

`let`은 반복마다 별도 블록 스코프를 만들므로 각 함수가 자기 바인딩을 갖는다.

```javascript
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map((f) => f()));   // [0, 1, 2]
```

`let`을 쓸 수 없는 환경에서는 함수 팩토리로 호출마다 새 스코프를 만든다.

```javascript
function makeFn(v) {
  return () => v;
}
for (var i = 0; i < 3; i++) {
  fns.push(makeFn(i));
}
```

---

## 6. this

`this`는 스코프 체인으로 해석되지 않는다. 일반 함수의 `this`는 **호출 시점**에 결정되므로 렉시컬 스코프 규칙을 따르지 않는다.

```javascript
const obj = {
  count: 10,
  later() {
    setTimeout(function () {
      console.log(this.count);   // undefined — this가 obj가 아님
    }, 300);
  },
};
obj.later();
```

화살표 함수는 `this`·`arguments`·`super`에 대한 자체 바인딩이 없어, 이들을 **정의된 위치의 스코프에서** 가져온다. 이 경우에 한해 `this`가 렉시컬하게 결정된다.

```javascript
const obj = {
  count: 10,
  later() {
    setTimeout(() => {
      console.log(this.count);   // 10 — 바깥 later()의 this
    }, 300);
  },
};
obj.later();
```

같은 이유로 화살표 함수는 메서드로 쓰지 않는다.

---

## 7. 예외

스코프를 정적으로 결정할 수 없게 만드는 두 구문이 있다. 둘 다 사용을 피한다.

### 7.1. with

`with`는 지정한 객체를 **스코프 체인 맨 앞에 추가**한다. 블록 안의 모든 비한정 식별자는 그 객체에서 먼저 탐색된다.

```javascript
with (Math) {
  a = PI * r * r;
}
```

어떤 이름이 객체 프로퍼티인지 바깥 변수인지 런타임에야 알 수 있어 정적 분석과 최적화를 방해한다. deprecated 상태이며 strict 모드에서 금지된다.

```javascript
"use strict";
with (Math) {}   // SyntaxError: Strict mode code may not include a with statement
```

모듈과 클래스 본문은 strict 모드가 강제되므로 그곳에서도 쓸 수 없다. 구조 분해로 대체한다.

```javascript
const { PI, cos, sin } = Math;
```

### 7.2. eval

`eval("...")` 형태의 **직접 호출**은 호출 지점의 지역 스코프에서 실행되어 지역 변수에 접근한다.

```javascript
function test() {
  const x = 2;
  console.log(eval("x + 1"));   // 3
}
```

non-strict 모드의 직접 호출은 `var` 선언을 **주변 스코프로 누출**시킨다.

```javascript
eval("var a = 1;");
console.log(a);   // 1
```

strict 모드에서는 `var`가 eval 내부로 한정되며, `let`·`const`는 모드와 무관하게 항상 평가되는 스크립트 안으로 한정된다.

`(0, eval)("...")`, `eval?.("...")`, 별칭 변수 호출 등 **간접 호출**은 항상 전역 스코프에서 실행되어 지역 변수에 접근하지 못한다.

```javascript
function test() {
  const x = 2;
  console.log(eval?.("x + 1"));   // ReferenceError: x is not defined
}
```

직접 호출은 주변 컨텍스트의 strictness를 상속하지만, 간접 호출은 전달된 문자열 자체에 `"use strict"`가 있을 때만 strict가 된다.

---

## Sources
- MDN — Scope (Glossary): https://developer.mozilla.org/en-US/docs/Glossary/Scope
- MDN — Closures: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures
- MDN — Arrow function expressions: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
- MDN — with: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with
- MDN — eval(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
- ECMAScript — Environment Records: https://tc39.es/ecma262/#sec-environment-records

---

## Related pages
- [[variable-declaration]] — var/let/const의 스코프·호이스팅 차이
- [[es-module]] — 모듈 스코프
- [[first-class-citizen]] — 일급 함수와 클로저
