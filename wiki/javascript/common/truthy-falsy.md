---
title: 자바스크립트 Truthy와 Falsy
updated: 2026-08-10 17:16:44
tags:
  - javascript
  - boolean
---

## 1. 개요

자바스크립트는 불리언 컨텍스트(`if`, `Boolean()`, `!`, `&&`/`||`)에서 값을 평가할 때 불리언으로의 암묵적 변환을 수행한다. 이때 `true`로 취급되는 값을 **truthy**, `false`로 취급되는 값을 **falsy**라 한다.

```javascript
if ("hello") { }     // 실행됨 — truthy
if (0) { }            // 실행 안 됨 — falsy
Boolean([]);           // true — 빈 배열도 truthy
```

---

## 2. Falsy 값

falsy로 평가되는 값은 다음 8가지로 고정되어 있다.

| 값 | 비고 |
| --- | --- |
| `false` | 불리언 리터럴 |
| `0`, `-0` | 숫자 0과 음의 0 |
| `0n` | BigInt 0 |
| `""` | 빈 문자열 |
| `null` | |
| `undefined` | |
| `NaN` | |

```javascript
Boolean(false); Boolean(0); Boolean(-0); Boolean(0n);
Boolean(""); Boolean(null); Boolean(undefined); Boolean(NaN);
// 전부 false
```

---

## 3. Truthy 값

falsy 8가지를 제외한 모든 값은 truthy다. 특히 **객체는 내용과 무관하게 항상 truthy**다.

```javascript
Boolean([]);              // true — 빈 배열
Boolean({});               // true — 빈 객체
Boolean("0");               // true — 문자열 "0"은 빈 문자열이 아님
Boolean(new Boolean(false)); // true — Boolean 래퍼 객체 자체는 truthy
```

---

## 4. Nullish와의 관계

`null`과 `undefined`는 falsy에 포함되지만, falsy 값의 범위는 **nullish**([[null-operators]] 참고)보다 넓다. `0`, `""`, `NaN`, `false`도 falsy이지만 nullish는 아니다.

```javascript
[null, undefined, 0, "", NaN, false].every(v => !v);        // true  — 전부 falsy
[null, undefined, 0, "", NaN, false].filter(v => v == null); // [null, undefined] — nullish만
```

이 차이는 널 병합(`??`)이 논리 OR(`||`)와 다르게 동작하는 이유가 된다. `||`는 falsy 여부로, `??`는 nullish 여부로 판단한다.

```javascript
0 || 42; // 42 — 0은 falsy라 대체됨
0 ?? 42; // 0  — 0은 nullish가 아니라 유지됨
```

---

## Sources
- [Truthy — MDN Glossary](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
- [Falsy — MDN Glossary](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
- [Boolean() — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

---

## Related pages
- [[null-operators]]
