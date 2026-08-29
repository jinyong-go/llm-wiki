---
title: 자바스크립트 Null 관련 연산자 (옵셔널 체이닝, 널 병합)
updated: 2026-08-10 17:25:03
tags:
  - javascript
  - null
---

## 1. 개요

자바스크립트는 값의 부재를 나타내는 두 원시값 `null`과 `undefined`를 가진다. `undefined`는 값이 없음을, `null`은 객체가 없음을 의미하는 것이 관례다. 둘 다 **nullish**로 취급되며, 옵셔널 체이닝·널 병합의 판단 기준이 된다.

타입이 달라 `null === undefined`는 `false`이지만, 느슨한 동등 비교에서는 상호 변환되어 `null == undefined`는 `true`다.

---

## 2. 옵셔널 체이닝 (Optional Chaining)

`?.` 연산자를 사용하는 옵셔널 체이닝은 객체 프로퍼티 접근·메서드 호출 시 참조가 nullish면 에러 대신 `undefined`로 short-circuit한다.

```javascript
obj?.prop        // 프로퍼티 접근
obj?.[expr]      // 대괄호 표기
func?.(args)     // 함수 호출
```

```javascript
const customerCity = customer?.details?.address?.city; // 중간 어디든 nullish면 undefined
onError?.(err.message); // onError가 없어도 에러 없음
```

**Short-circuiting**: 체인 중 하나가 nullish면 이후 접근은 평가되지 않는다. 단, `()`로 그룹핑하면 그 지점에서 체인이 끊겨 이후 접근은 다시 평가된다.

```javascript
(potentiallyNullObj?.a).b; // TypeError — 그룹핑으로 체인이 끊김
```

**제약**:
- 선언되지 않은 루트 변수에는 사용 불가 (`ReferenceError`)
- 대입 대상이 될 수 없음: `obj?.prop = 1` → `SyntaxError`
- Tagged template, `new` 표현식의 생성자 위치에 사용 불가

```javascript
String?.raw`Hello`;         // SyntaxError — tagged template에 optional chain 불가
new Intl?.DateTimeFormat(); // SyntaxError — new 표현식의 생성자 위치에 optional chain 불가
```

---

## 3. 널 병합 (Nullish Coalescing)

`??` 연산자를 사용하는 널 병합은 좌변이 nullish일 때만 우변을 반환한다. 좌변이 falsy이지만 nullish가 아닌 값(`0`, `''`, `false`, `NaN` 등, [[truthy-falsy]] 참고)이면 좌변을 그대로 반환한다는 점이 `||`와 다르다.

```javascript
0 ?? 42;   // 0   (nullish 아님)
0 || 42;   // 42  (falsy라서 대체됨 — 의도치 않은 동작일 수 있음)
```

연산자 우선순위는 `||`보다 낮고 삼항 연산자보다 높다. `&&`/`||`와 괄호 없이 직접 혼용하면 `SyntaxError`.

```javascript
null || undefined ?? "foo";   // SyntaxError
(null || undefined) ?? "foo"; // "foo" — 괄호로 명시 필요
```

---

## 4. 널 병합 할당 (Logical Nullish Assignment)

`??=` 연산자를 사용하는 널 병합 할당은 좌변이 nullish일 때만 우변을 평가·대입한다. `x ??= y`는 `x ?? (x = y)`와 동등하되 `x`는 한 번만 평가된다.

```javascript
function config(options) {
  options.duration ??= 100;
  options.speed ??= 25;
  return options;
}
config({ duration: 125 }); // { duration: 125, speed: 25 }
```

좌변이 nullish가 아니면 우변은 평가조차 되지 않는다 (getter/setter, 부수효과 있는 표현식에서 유의).

---

## 5. 조합 사용

`?.`와 `??`를 함께 쓰면 nullish 접근에 기본값을 지정할 수 있다.

```javascript
const city = customer?.city ?? "Unknown city";
```

---

## Sources
- [Optional chaining (?.) — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [Nullish coalescing operator (??) — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- [Logical nullish assignment (??=) — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_nullish_assignment)
- [null — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

---

## Related pages
- [[truthy-falsy]]
