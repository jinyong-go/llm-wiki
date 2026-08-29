---
title: 모듈 시스템
updated: 2026-08-24 17:40:06
tags:
  - javascript
  - commonjs
  - esm
  - nodejs
---

## 1. 개요
자바스크립트는 원래 모듈 시스템 없이 설계된 언어였으나, 코드를 파일 단위로 분리하고 재사용할 필요성이 커지면서 서로 다른 시점에 등장한 두 모듈 시스템이 지금까지 공존하고 있다.

CommonJS(CJS)는 ECMAScript 표준이 아니다. 2009년 CommonJS 프로젝트가 정의한 규격을 Node.js가 채택해 구현한 것으로, `require()`와 `module.exports`/`exports` 문법을 사용한다.

ES Module(ESM)은 ECMAScript 표준(ES2015+)에 `import`/`export` 문으로 명시된 **언어 자체 기능**이다. `import`/`export` 문법을 사용한다.

---

## 2. CommonJS vs ESM

### 2.1. 문법

**CommonJS**
```js
// circle.js
const { PI } = Math;
exports.area = (r) => PI * r ** 2;

// foo.js
const circle = require('./circle.js');
console.log(circle.area(4));
```

**ES Module**
```js
// circle.js
export const area = (r) => Math.PI * r ** 2;

// foo.js
import { area } from './circle.js';
console.log(area(4));
```

### 2.2. 동작

| | CommonJS | ES Module |
|---|---|---|
| 로드 시점 | `require()` 호출 시 동기적으로 읽고 즉시 실행 | 정적 분석으로 의존성 그래프 구성 후 비동기 로드·실행 |
| 정적/동적 | 런타임 함수 호출 → 조건문·반복문 안에서도 호출 가능(동적) | 최상위에서만 선언 가능(정적). 동적 로딩은 `import()` |
| 모듈 해석 | 확장자 생략·자동 탐색(`.js`→`.json`→`.node`) 가능, 디렉토리의 `index.js` 자동 해석 지원 | 확장자 명시 필수, 디렉토리 자동 해석 없음(`exports` 필드로만 하위 진입점 정의, 4.3장 참고) |
| 내보낸 값 | 내보낸 시점의 스냅숏 (재할당 반영 안 됨, 객체 프로퍼티 변경은 반영) | live binding (원본 값 변경이 자동 반영, 재할당은 불가) |
| 최상위 `this` | `module.exports`(빈 객체) | `undefined` |
| top-level await | 미지원 | 지원 |
| Node.js 지정 | `.cjs` 확장자 또는 `"type": "commonjs"` | `.mjs` 확장자 또는 `"type": "module"` |

상세 동작(module wrapper, `nomodule` 폴백, 브라우저 `<script type="module">`의 defer 동작 등)은 각 문서 참고.

---

## 3. CommonJS 전용 기능과 ESM 대체 API
ES Module에는 다음 CommonJS 전역이 없다. Node.js 문서가 제시하는 대체 API는 다음과 같다.

| CommonJS | ES Module 대체 |
|---|---|
| `require()` | `import`, 필요 시 `module.createRequire()` |
| `__filename` | `import.meta.filename` |
| `__dirname` | `import.meta.dirname` |
| `require.main === module` | `import.meta.main` |
| `require.resolve()` | `import.meta.resolve()` |

---

## 4. 실행 환경

### 4.1. 바닐라 자바스크립트에서의 사용 가능 여부
CommonJS는 불가능하지만 ES Module은 가능하다.

- **CommonJS**: `require`/`module.exports`는 Node.js가 모듈 실행 시 함수로 감싸 주입하는 런타임 값이다. 브라우저는 이를 구현하지 않으므로, 브라우저(바닐라 JS)에서 그대로 쓸 수 없다. webpack·browserify 같은 번들러로 변환하거나 Node.js 환경에서 실행해야 한다.
- **ES Module**: ECMAScript 언어 표준의 일부이므로 별도 도구 없이 사용 가능하다.
  - 브라우저: `<script type="module" src="main.js"></script>`로 바로 로드. 모든 최신 브라우저가 네이티브 지원.
  - Node.js: `.mjs` 확장자 또는 `package.json`의 `"type": "module"` 설정만으로 사용.

번들러(webpack, Babel 등)는 ESM 자체를 가능하게 하는 필수 도구가 아니라, 코드 분할·트리쉐이킹·구형 브라우저 호환(트랜스파일) 등 **최적화 목적**으로 쓰인다.

### 4.2. Node.js 상호운용성
- ESM의 `import`로 CommonJS 모듈을 불러올 수 있다. 이때 `module.exports` 값이 `default` export로 제공되고, 정적 분석으로 named export도 best-effort로 제공된다.
- 반대로 CommonJS의 `require()`는 top-level await를 쓰지 않는 동기적 ESM만 로드 가능하다(`require(esm)`). Node.js 20.19.0, 22.12.0부터 플래그 없이 기본 활성화됐다(그 이전 버전은 `--experimental-require-module` 플래그 필요). 비동기 로드가 필요하면 동적 `import()`를 사용한다 (CommonJS·ESM 양쪽에서 지원).

### 4.3. 패키지 진입점: `exports`/`imports`
`package.json`의 `"exports"` 필드는 패키지의 진입점과 하위 경로(subpath)를 명시적으로 선언한다. CommonJS·ESM 양쪽의 해석에 모두 적용되며, 정의되지 않은 경로는 캡슐화되어 외부에서 접근할 수 없다 — 예를 들어 `require('pkg/internal.js')`가 정의에 없으면 `ERR_PACKAGE_PATH_NOT_EXPORTED`로 실패한다.

```json
{
  "exports": {
    ".": "./index.js",
    "./feature.js": {
      "import": "./feature.mjs",
      "require": "./feature.cjs"
    }
  }
}
```

**conditional exports**: 위처럼 `"import"`/`"require"` 조건으로 같은 하위 경로가 로드 방식에 따라 다른 파일을 가리키게 할 수 있다. Node.js는 `"node-addons"` → `"node"` → `"import"` → `"require"` → `"module-sync"` → `"default"` 순으로 조건을 매칭하며, `"import"`와 `"require"`는 항상 상호 배타적이다.

**`imports` 필드**: `#`로 시작하는 키만 허용되는, 패키지 **내부 전용** 매핑이다(`import '#dep'`). `exports`와 달리 외부 패키지로도 매핑할 수 있어, Node 전용 구현과 폴리필을 조건부로 분기하는 등의 용도로 쓴다.

**dual package hazard**: `"import"`/`"require"` 조건이 서로 다른 파일(예: `index.mjs`/`index.cjs`)을 가리키면, 같은 패키지를 CJS와 ESM 양쪽에서 각각 로드했을 때 두 개의 독립된 모듈 인스턴스가 생길 수 있다.[^1] `instanceof` 검사나 모듈 내부의 싱글턴 상태가 두 인스턴스 사이에 공유되지 않아 예기치 않은 버그로 이어질 수 있다. `"module-sync"` 조건(4.2절의 `require(esm)`과 함께 도입)은 ESM 파일 하나를 `import`·`require()` 양쪽에서 공유해 이 문제를 줄이는 방법이다.

---

[^1]: 추론. Node.js 공식 문서(packages.html)는 conditional exports가 "hazard"를 유발할 수 있다고만 언급하고, 상세 메커니즘은 외부 예제 저장소(nodejs/package-examples)로 위임한다. 여기서는 Node.js의 모듈 레지스트리가 resolve된 파일 경로 기준으로 캐시된다는 사실([[commonjs]] 3.1장)로부터, `import`/`require` 조건이 서로 다른 파일을 가리키면 캐시 키(경로)가 달라져 별도 인스턴스가 생긴다는 결론을 유추함.

## Sources
- [MDN — JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [MDN — import 문](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [Node.js — Modules: CommonJS modules](https://nodejs.org/api/modules.html)
- [Node.js — Modules: ECMAScript modules](https://nodejs.org/api/esm.html)
- [Node.js — Modules: Packages](https://nodejs.org/api/packages.html)
- [Node.js — v20.19.0 릴리스 노트](https://nodejs.org/en/blog/release/v20.19.0)
- [Node.js — v22.12.0 릴리스 노트](https://nodejs.org/en/blog/release/v22.12.0)

---

## Related pages
- [[commonjs]]
- [[es-module]]
- [[tsconfig]] — `module`/`moduleResolution` 컴파일러 옵션
