---
title: CommonJS
updated: 2026-08-07 13:49:17
tags:
  - javascript
  - commonjs
  - nodejs
---

## 1. 개요
CommonJS(CJS)는 ECMAScript 표준이 아니다. 2009년 CommonJS 프로젝트가 정의한 모듈 규격을 Node.js가 채택해 구현한 것이다. 자바스크립트가 브라우저 밖, 즉 서버 환경에서 실행되기 시작하면서 코드를 독립된 파일 단위로 나눠 캡슐화하고 재사용할 표준 방식이 필요했고, CommonJS가 Node.js에서 이 역할을 맡은 최초의 모듈 시스템이다. Node.js는 파일 하나를 모듈 하나로 취급하며, 모듈 내부 변수는 함수로 감싸져(module wrapper) 자동으로 비공개(private) 상태가 되어 모듈 간 이름 충돌 없이 코드를 재사용할 수 있다.

---

## 2. 문법
CommonJS 모듈은 `require()`로 다른 모듈을 가져오고, `exports`/`module.exports`로 값을 내보낸다.

### 2.1. require
```js
// foo.js
const circle = require('./circle.js');
console.log(circle.area(4));
```
`require(id)`는 다른 모듈·JSON 파일·Node.js 코어 모듈을 가져오는 함수다. 인자로 받은 경로/이름(`id`)에 해당하는 모듈을 로드하고, 그 모듈의 `module.exports` 값을 반환한다. 해석·캐싱·순환 참조 규칙은 3.1절 참고.

### 2.2. exports
```js
// circle.js
const { PI } = Math;
exports.area = (r) => PI * r ** 2;
```
`exports`는 `module.exports`를 가리키는 축약 참조 변수다. `exports.f = ...` 형태로 프로퍼티를 추가하는 용도로만 써야 하며, 새 객체를 통째로 재할당하면 `module.exports`와의 연결이 끊어져 내보내지지 않는다(3.2절 참고). 실제로 내보내는 값을 담는 객체는 `module.exports`이며, `require()`가 반환하는 값은 항상 이 객체다.

### 2.3. 기타
모듈 래퍼(3장)가 주입하는 `__filename`, `__dirname`, `module` 외에도 다음이 제공된다.

- `module.id`, `module.filename`: 모듈 식별자(보통 파일 절대경로)와 파일명.
- `module.loaded`: 로딩 완료 여부.
- `module.children`: 이 모듈이 처음 require한 하위 모듈 목록.
- `module.paths`: 모듈 탐색 경로 목록.
- `module.parent`: 이 모듈을 최초로 require한 모듈(deprecated — `require.main`, `module.children` 사용 권장).
- `module.require(id)`: 해당 모듈에서 호출한 것처럼 동작하는 `require()`.
- `require.resolve(request)`: 모듈을 로드하지 않고 해석된 파일 경로만 반환.
- `require.cache`: require된 모듈이 캐시되는 객체(3.1절 참고). 키를 삭제하면 다음 require 시 재로드된다.
- `require.main`: Node.js 프로세스 시작 시 로드된 엔트리 모듈을 가리키는 Module 객체.
- `require.extensions`: 확장자별 로드 방식을 지정하던 API(deprecated).

---

## 3. 동작
- 모듈은 함수로 감싸져 실행되며(module wrapper), 이 래퍼가 `require`, `module`, `exports`, `__filename`, `__dirname`을 인자로 주입한다.
- 모듈 최상위의 `this`는 `module.exports`(빈 객체)를 가리킨다.
- top-level await를 지원하지 않는다.

### 3.1. require 동작
`require()` 호출 시점에 파일을 동기적으로 읽고 즉시 실행한다. 런타임에 평가되는 함수 호출이므로 조건문·반복문 안에서도 호출할 수 있다(동적 로딩).

모듈 해석: `/`로 시작하면 절대 경로로 그대로 사용한다. `./`, `../`로 시작하면 require를 호출한 파일 기준 상대 경로로 해석한다. 그 외(접두사 없음)는 코어 모듈이거나 `node_modules`에서 탐색한다. 정확한 파일명이 없으면 `.js` → `.json` → `.node` 순으로 확장자를 붙여 재시도하며, `.cjs`처럼 다른 확장자는 전체 파일명을 명시해야 한다. 디렉토리를 지정하면 그 안의 `index.js`(또는 `package.json`의 `main`이 가리키는 파일)를 찾는 "folders as modules" 방식도 지원한다. 찾지 못하면 `MODULE_NOT_FOUND` 에러를 던진다. ESM의 `import`는 이런 확장자·디렉토리 자동 해석을 지원하지 않는다([[es-module]] 4장 참고).

캐싱: 모듈은 **resolve된 파일 경로** 기준으로 캐시된다. 같은 파일을 여러 번 require해도 코드는 최초 1회만 실행되고, 이후에는 캐시된 동일한 `module.exports` 객체가 반환된다. 코드를 매번 다시 실행하고 싶다면 함수를 export하고 호출부에서 그 함수를 호출해야 한다. 대소문자만 다른 경로(`require('./foo')`와 `require('./FOO')`)는 실제로 같은 파일이라도 별개 캐시 항목으로 취급되어 중복 로드된다.

순환 참조: `a.js`가 `b.js`를 require하고, `b.js`가 다시 `a.js`를 require하는 경우 — 무한 루프를 막기 위해 `b.js`는 `a.js`의 **그 시점까지만 완성된(unfinished) exports 객체**를 받는다.

```js
// a.js
exports.done = false;
const b = require('./b.js');
exports.done = true;

// b.js
exports.done = false;
const a = require('./a.js'); // a는 아직 완료 전 → a.done === false
exports.done = true;

// main.js
const a = require('./a.js');
const b = require('./b.js');
// main 시점엔 둘 다 완료 → a.done === true, b.done === true
```

### 3.2. exports 동작
`module.exports`에 할당한 값은 해당 시점의 스냅숏이다. 내보낸 뒤 모듈 내부에서 원본 변수를 재할당해도 이미 가져간 쪽에는 반영되지 않는다(단, 객체 프로퍼티 변경은 참조 공유로 반영됨).

`exports`는 모듈 평가 전 `module.exports`와 **같은 객체를 가리키도록** 초기화된 참조 변수일 뿐이다. `exports.f = ...`는 `module.exports.f = ...`의 축약형이다.

`exports`에 **새 객체를 통째로 재할당**하면 `module.exports`와의 연결이 끊어져 아무것도 내보내지지 않는다 — `require()`가 반환하는 값은 항상 `module.exports`이기 때문이다.

```js
module.exports.hello = true; // 내보내짐
exports = { hello: false };  // 내보내지지 않음 (module.exports와 무관해짐)
```

모듈 전체를 함수 하나로 내보낼 때는 관용적으로 둘 다 재할당한다.
```js
module.exports = exports = function Constructor() { /* ... */ };
```

---

## 4. Node.js에서 사용
`.cjs` 확장자 또는 `package.json`의 `"type": "commonjs"`로 이 방식을 지정한다.

브라우저는 `require`/`module.exports`를 구현하지 않으므로 CommonJS 코드를 그대로 실행할 수 없다. webpack·browserify 같은 번들러로 변환해야 한다.

---

## 5. 장단점

**장점**
- 문법이 단순하고 동기적이라 흐름을 추적하기 쉽다.
- `require()`가 런타임 함수 호출이므로 조건부·동적 로딩이 자연스럽다.
- Node.js 생태계에 가장 오래 정착되어 있어 대다수 npm 패키지와 호환된다.

**단점**
- 브라우저 네이티브 지원이 없어 번들러 변환이 필수다.
- `require()`가 런타임에 결정되므로 정적 분석이 불가능해 트리쉐이킹 최적화가 어렵다.[^1]
- 동기적 로드 방식이라 네트워크로 원격 모듈을 가져오는 데는 적합하지 않다.
- top-level await 미지원.

---

[^1]: 추론. `require()`의 인자는 런타임에 평가되는 임의의 표현식일 수 있어(3.1절의 동적 로딩 특성) 번들러가 빌드 시점에 실제 사용 여부를 정적으로 판단하기 어렵다는 일반론이며, webpack 등 번들러 문서가 ESM의 정적 `import`/`export`를 트리쉐이킹의 전제 조건으로 명시하는 것에 근거한 유추.

## Sources
- [Node.js — Modules: CommonJS modules](https://nodejs.org/api/modules.html)

---

## Related pages
- [[module-system]]
- [[es-module]]
