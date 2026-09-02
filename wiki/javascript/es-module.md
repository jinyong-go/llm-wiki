---
title: ES Module
updated: 2026-08-31 14:25:48
tags:
  - javascript
  - esm
  - nodejs
---

## 1. 개요
ES Module(ESM)은 ECMAScript 표준(ES2015+)에 정의된 **언어 자체 기능**이다. 큰 프로그램을 재사용 가능한 여러 모듈로 나눠 관리하려는 요구는 이전부터 있었지만, 언어 표준에 모듈 시스템이 없어 Node.js의 CommonJS나 AMD 같은 서드파티 방식에 의존해야 했다. ESM은 이를 언어 차원에서 표준화해 브라우저·Node.js 등 어떤 런타임에서도 트랜스파일 없이 동일한 문법으로 모듈을 가져오고 내보낼 수 있게 한다. 브라우저는 네이티브 지원 덕분에 모듈 로딩을 자체적으로 최적화할 수 있고, 정적으로 분석 가능한 구조 덕분에 번들러의 트리쉐이킹·데드 코드 제거 같은 최적화도 더 정교해진다.

---

## 2. 문법
ES Module은 `import`로 다른 모듈의 값을 가져오고, `export`로 값을 내보낸다.

### 2.1. import
```js
// foo.js
import { area } from './circle.js';
console.log(area(4));
```
`import` 선언은 다른 모듈에서 내보낸(export) 값을 정적으로 가져온다. named import(`import { x } from ...`), default import(`import x from ...`), namespace import(`import * as ns from ...`), 부수효과만을 위한 import(`import './x.js'`, 값을 가져오지 않고 모듈 코드만 실행) 네 형태가 있으며, 반드시 모듈 최상위에서만 선언할 수 있다. 조건부·동적 로딩은 3장의 동적 `import()` 참고.

### 2.2. export
```js
// circle.js
export const area = (r) => Math.PI * r ** 2;
```
`export` 선언은 모듈 내부 값을 외부에 공개한다. 한 모듈에 여러 개 둘 수 있는 named export(`export const x = ...` 또는 선언 후 `export { x }`)와, 모듈당 하나만 허용되는 default export(`export default ...`) 두 형태가 있다. 다른 모듈의 export를 그대로 재노출하는 re-export(`export { x } from '...'`, `export * from '...'`)도 지원한다.

### 2.3. 기타
- 동적 `import(specifier)`: 함수처럼 호출해 모듈 네임스페이스 객체로 resolve되는 Promise를 반환한다. 최상위 제약 없이 조건문·함수 내부에서도 쓸 수 있고, `type="module"`이 아닌 일반 스크립트에서도 사용 가능하다(3장 참고).
- `import.meta`: 현재 모듈의 메타데이터를 담은 객체. `import.meta.url`(현재 모듈의 URL), `import.meta.resolve(specifier)`(모듈 지정자를 실제 URL로 해석) 등을 제공한다.
- import attributes(`with { type: "json" }`): JSON 모듈처럼 비-JS 리소스를 가져올 때 모듈 타입을 명시하는 구문. `import`뿐 아니라 re-export에도 붙일 수 있다.
- import map(`<script type="importmap">`): 브라우저에서 `import 'lodash'` 같은 bare specifier의 해석 경로를 지정하는 설정. `node_modules` 기반 해석이 없는 브라우저 환경에서 이를 대신한다.

---

## 3. 동작
- 파싱 단계에서 `import`/`export` 선언을 정적으로 분석해 의존성 그래프를 먼저 구성한 뒤 비동기로 로드·실행한다.
- `import`/`export`는 반드시 모듈 최상위에서 선언해야 한다(조건문 내부 사용 불가). 조건부 로딩이 필요하면 동적 `import()`를 사용한다 — 함수처럼 호출 가능하며 모듈 네임스페이스 객체로 resolve되는 Promise를 반환하고, `type="module"`이 아닌 일반 스크립트에서도 쓸 수 있다.
- 가져온 바인딩은 **live binding**이다. 내보낸 변수의 값이 바뀌면 가져온 쪽에도 자동 반영된다. 단 import한 변수는 읽기 전용이라 직접 재할당할 수 없다.
- 모듈 최상위의 `this`는 `undefined`다.
- 자동으로 strict mode가 적용된다.
- 하나의 모듈이 여러 `<script>`/`import`로 참조돼도 실행은 한 번만 이뤄진다(모듈 레지스트리에 캐시).
- top-level await를 지원한다. `await`가 상위 모듈의 평가를 지연시키되, 형제 모듈의 로드는 막지 않는다.
- `require`·`__filename` 같은 CommonJS 전역이 없다. 대체 API는 [[module-system]] 3장 참고.

---

## 4. 모듈 해석
Node.js에서 정적 `import`와 동적 `import()`는 `require()`([[commonjs]] 3.1장)보다 엄격한 해석 규칙을 따른다.
- 파일 확장자를 반드시 명시해야 한다. 확장자 생략이나 `.js`→`.json`→`.node` 순의 자동 확장자 탐색을 지원하지 않는다. 상대·절대 경로 지정자는 `.js`/`.mjs`/`.cjs` 확장자가 있어야 하며, 그 외 확장자는 `ERR_UNKNOWN_FILE_EXTENSION` 에러가 난다.
- 디렉토리를 모듈처럼 취급하는 기능(폴더의 `index.js` 자동 로드, "folders as modules")을 지원하지 않는다. 디렉토리 진입점이 필요하면 `package.json`의 `exports` 필드로 명시해야 한다([[module-system]] 4.3장 참고).
- `file:`, `data:` URL을 지정자로 바로 사용할 수 있다(`require()`는 URL 지정자를 기본 지원하지 않음).

---

## 5. 순환 참조
CommonJS와 달리 ESM은 live binding(3장)이므로, 순환 참조가 있어도 바인딩 자체는 항상 연결된다. 문제는 참조된 변수를 실제로 **읽는 시점**에 그 값이 아직 초기화됐는지 여부다.

```js
// a.js (entry module)
import { b } from './b.js';
export const a = 2;

// b.js
import { a } from './a.js';
console.log(a); // ReferenceError: Cannot access 'a' before initialization
export const b = 1;
```
`a.js`를 평가하려면 의존성인 `b.js`를 먼저 평가해야 하는데, 이 시점에 `b.js`가 동기적으로 `a`를 읽으면 아직 초기화되지 않은 상태라 실패한다. 참조를 `setTimeout` 등으로 지연시켜 모듈 평가가 끝난 뒤(비동기적으로) 읽으면 값이 채워져 있으므로 에러 없이 동작한다.

CommonJS의 순환 참조 동작(미완성 exports 스냅숏 반환)은 [[commonjs]] 3.1장 참고.

---

## 6. 브라우저 스크립트 로딩

```html
<script type="module" src="main.js"></script>
```

별도 도구 없이 모든 최신 브라우저가 네이티브 지원한다.

### 6.1. defer 동작
모듈 스크립트는 `defer` 속성을 붙이지 않아도 항상 지연 실행된다. `type="module"`에 `defer`를 함께 써도 아무 효과가 없다 — 모듈은 이미 defer 상태이기 때문이다.

**동작 방식**
- HTML 파싱을 막지 않고 모듈과 그 의존성(정적으로 분석된 `import` 그래프 전체)을 병렬로 fetch한다.
- 문서 파싱이 끝난 뒤, `DOMContentLoaded` 이벤트가 발생하기 전에 실행된다.
- 여러 모듈 스크립트가 있으면 문서에 등장한 순서대로 실행된다.
- 교차 출처 fetch 시 CORS 프로토콜을 강제한다(classic script와 달리).

**왜 이렇게 동작하는가** 모듈은 실행 전에 `import`로 연결된 의존성 그래프 전체를 먼저 내려받아야 한다. 이 과정은 네트워크 상에서 여러 파일을 비동기로 가져오는 작업이므로 본질적으로 즉시 실행이 불가능하다. 스펙은 이 fetch-then-execute 흐름을 classic script의 `defer`와 동일한 타이밍(파싱 완료 후, `DOMContentLoaded` 이전, 문서 순서대로)에 맞춰 실행하도록 정의했다.

**장점**
- **parser-blocking 회피**: `<script>` 만나는 즉시 fetch·실행하며 파싱을 멈추는 classic script와 달리, HTML 파싱이 끊기지 않는다.
- **DOM 접근 안전성**: 파싱이 끝난 뒤 실행되므로, 모듈 코드가 아직 파싱되지 않은 하위 DOM 요소를 참조해 실패하는 문제가 없다.
- **실행 순서 보장**: `async`와 달리 여러 모듈 스크립트 간 상대적 실행 순서가 문서 순서로 고정된다 — 의존 관계가 있는 코드를 안전하게 나눠 작성할 수 있다.
- **위치 무관**: 위 특성 덕분에 `<head>`에 두어도 렌더링을 막지 않는다.

### 6.2. `nomodule` 폴백
`type="module"`을 지원하는 브라우저는 `nomodule` 속성이 붙은 스크립트를 무시한다. 구형 브라우저용 폴백 스크립트를 함께 제공할 수 있다.
```html
<script type="module" src="main.js"></script>
<script nomodule src="fallback.js"></script>
```

---

## 7. Node.js에서 사용
`.mjs` 확장자 또는 `package.json`의 `"type": "module"` 설정만으로 사용 가능하다.

---

## 8. 장단점

**장점**
- 브라우저·Node.js 모두 네이티브 지원 — 별도 도구 없이 실행 가능.
- 정적 `import`/`export` 구조 덕분에 번들러가 미사용 코드를 제거하는 트리쉐이킹이 가능하다.[^1]
- top-level await로 모듈 최상위에서 비동기 초기화를 처리할 수 있다.

**단점**
- `import`/`export`가 최상위에서만 허용돼 조건부 로딩 시 별도로 동적 `import()`가 필요하다.
- CommonJS 전용으로 작성된 구버전 패키지와 상호운용 시 default/named export 처리에 주의가 필요하다([[module-system]] 4.2장 참고).

---

[^1]: 추론. `import`/`export` 선언이 모듈 최상위에서만 허용되는 정적 구조(3장)여서 번들러가 빌드 시점에 실제 사용 여부를 판단할 수 있다는 일반론이며, webpack 등 번들러 문서가 이를 트리쉐이킹의 전제 조건으로 명시하는 것에 근거한 유추.

## Sources
- [MDN — JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN — import 문](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [MDN — `<script>` 요소](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
- [Node.js — Modules: ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js — Modules: Packages](https://nodejs.org/api/packages.html)

---

## Related pages
- [[module-system]]
- [[commonjs]]
