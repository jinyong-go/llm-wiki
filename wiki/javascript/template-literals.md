---
title: 자바스크립트 템플릿 리터럴 (백틱)
updated: 2026-08-31 14:25:48
tags:
  - javascript
  - string
---

## 1. 개요

**템플릿 리터럴**(template literal)은 백틱(`` ` ``)으로 감싸는 문자열 리터럴로, 여러 줄 문자열·문자열 보간·태그된 템플릿을 지원한다. 문자열 보간 용도로 가장 흔히 쓰여 **템플릿 문자열**(template string)로도 불리지만, 태그된 템플릿은 문자열이 아닌 임의의 값을 반환할 수 있어 정확한 명칭은 아니다.

```javascript
`string text`
`string text ${expression} string text`
tagFunction`string text ${expression} string text`
```

내부적으로는 백틱 사이 텍스트와 `${expression}` 플레이스홀더들을 함수에 전달하는 구조다. 태그 함수를 지정하지 않으면 기본 동작인 문자열 보간(치환 후 연결)이 수행되고, 지정하면 해당 함수가 결과를 결정한다.

---

## 2. 문자열 보간

`${expression}` 플레이스홀더로 표현식 값을 문자열에 삽입한다. `+` 연산자 기반 문자열 연결보다 가독성이 높다.

```javascript
const a = 5;
const b = 10;
`Fifteen is ${a + b} and not ${2 * a + b}.`;
// "Fifteen is 15 and not 20."
```

`+` 연산자와의 차이: 템플릿 리터럴은 표현식 값을 **문자열로 직접 강제 변환**하는 반면, `+`는 피연산자를 먼저 원시값(primitive)으로 변환한 뒤 처리한다.

---

## 3. 여러 줄 문자열

소스에 포함된 개행 문자는 그대로 문자열의 일부가 된다.

```javascript
`string text line 1
string text line 2`;
// "string text line 1\nstring text line 2"
```

일반 문자열처럼 `\`로 개행을 이스케이프하면 소스 코드상으로만 줄바꿈하고 실제 문자열에는 줄바꿈이 포함되지 않는다.

```javascript
`string text line 1 \
string text line 2`;
// "string text line 1 string text line 2"
```

---

## 4. 이스케이프

백틱과 `$`는 앞에 `\`를 붙여 이스케이프할 수 있다.

```javascript
`\`` === "`";   // true — 백틱 이스케이프
`\${1}` === "${1}"; // true — 보간 방지
```

---

## 5. 중첩

`${expression}` 플레이스홀더 내부에서 다시 템플릿 리터럴(백틱)을 사용할 수 있다. 삼항 연산자를 겹겹이 쓰는 것보다 가독성이 높은 경우에 유용하다.

```javascript
const classes = `header ${
  isLargeScreen() ? "" : `icon-${item.isCollapsed ? "expander" : "collapser"}`
}`;
```

---

## 6. 태그된 템플릿 (Tagged Template)

백틱 앞에 함수 이름을 붙이면 **태그된 템플릿**(tagged template)이 된다. 템플릿의 각 부분이 함수로 전달되어 임의의 처리를 거친 뒤, 그 반환값이 리터럴의 값이 된다 — 반드시 문자열일 필요는 없다.

```javascript
function myTag(strings, personExp, ageExp) {
  const ageStr = ageExp < 100 ? "youngster" : "centenarian";
  return `${strings[0]}${personExp}${strings[1]}${ageStr}${strings[2]}`;
}

myTag`That ${"Mike"} is a ${28}.`;
// "That Mike is a youngster."
```

- 태그 함수의 첫 인자는 문자열 조각 배열, 나머지 인자는 `${}` 표현식 값들. 배열 길이는 `${}` 치환 개수 + 1 (항상 non-empty).
- 동일한 태그된 템플릿 리터럴 표현식은 몇 번을 평가하든 **동일한 문자열 배열 객체**를 태그 함수에 전달한다 (identity 기반 캐싱에 활용 가능). 이 배열과 `raw` 프로퍼티는 고정(frozen) 상태다.
- 태그는 단순 식별자뿐 아니라 우선순위 16 초과의 임의 표현식(프로퍼티 접근, 함수 호출, `new` 등)이 될 수 있다.
- 태그되지 않은 템플릿 리터럴을 이어붙이면(`` `a``b` ``) `TypeError`. 단 옵셔널 체이닝과 결합(`` a?.`b` ``)은 `SyntaxError`.

### 6.1. raw 문자열

태그 함수 첫 인자의 `raw` 프로퍼티는 이스케이프 시퀀스가 처리되지 않은 원본 텍스트를 담는다.

```javascript
function tag(strings) {
  console.log(strings.raw[0]);
}
tag`line 1 \n line 2`;
// "line 1 \n line 2" (역슬래시·n 문자 그대로)
```

`String.raw`는 원본 텍스트 그대로 문자열을 만드는 내장 태그 함수다.

```javascript
String.raw`Hi\n${2 + 3}!`;
// "Hi\\n5!" (길이 6 — \n이 처리되지 않고 두 문자로 남음)
```

### 6.2. 이스케이프 시퀀스 완화

일반(태그되지 않은) 템플릿 리터럴은 잘못된 형식의 이스케이프 시퀀스(예: `\9`, `\xz`, `\u{110000}`)에서 `SyntaxError`가 발생한다. 반면 **태그된** 템플릿 리터럴은 이 제약이 없다 — LaTeX 등 JS 이스케이프 규칙과 다른 임의 문자열을 `String.raw`로 다루기 위함이다. 이 경우 잘못된 이스케이프의 "cooked" 값은 `undefined`가 되고, `raw` 값에서는 원본 그대로 확인 가능하다.

```javascript
function log(str) {
  console.log("cooked:", str[0], "raw:", str.raw[0]);
}
log`\unicode`;
// cooked: undefined
// raw: \unicode
```

---
## Sources
- [Template literals — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

---

## Related pages
- [[null-operators]]
- [[commonjs]]
