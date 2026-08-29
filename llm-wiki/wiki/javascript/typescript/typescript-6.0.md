---
title: TypeScript 6.0
updated: 2026-08-25 17:38:41
tags:
  - javascript
  - typescript
  - typescript6
---

## 1. 개요

TypeScript 6.0은 2026-03-23 릴리스됐다. 현재 JavaScript로 작성된 컴파일러의 **마지막 릴리스**로 소개됐으며, Go로 새로 작성 중인 네이티브 컴파일러 기반 TypeScript 7.0으로 넘어가기 위한 전환 버전이다.

## 2. 컴파일러 옵션

### 2.1. 추가된 옵션

| 옵션 | 타입/값 | 설명 |
|---|---|---|
| `stableTypeOrdering` | boolean | 6.0의 타입 순서 동작을 7.0과 미리 일치시켜 마이그레이션 충격을 줄임. 최대 25% 성능 저하가 있어 장기 사용은 비권장(전환기 임시 옵션) |
| `ignoreConfig` | boolean, **CLI 전용**(`tsc --ignoreConfig`) | 명령줄에 입력 파일을 직접 지정할 때 `tsconfig.json`을 무시. tsconfig.json 내부에 넣는 옵션이 아님 |

```json
{ "compilerOptions": { "stableTypeOrdering": true } }
```
```bash
tsc --ignoreConfig foo.ts
```

### 2.2. 기본값 변경

| 옵션 | 이전 기본값 | 새 기본값 | 사유 |
|---|---|---|---|
| `strict` | `false` | `true` | 신규 프로젝트 대부분이 strict를 필요로 함 |
| `module` | `"commonjs"` | `"esnext"` | ESM이 사실상 표준 모듈 형식이 됨 |
| `target` | `"es5"` | `"es2025"` | 대부분 evergreen 런타임에 배포 |
| `types` | `["*"]`(모든 `@types` 자동 포함) | `[]` | 불필요한 선언 파일 로드 방지로 빌드 성능 개선 |
| `rootDir` | 소스 파일들의 공통 상위 디렉터리 추론 | `"."`(tsconfig.json 위치) | 파일 분석 오버헤드 감소, 동작 예측 가능성 향상 |
| `noUncheckedSideEffectImports` | `false` | `true` | side-effect import(`import "./foo"`) 오타 탐지 |
| `libReplacement` | `true` | `false` | watch 모드 성능 개선(모듈 해석 실패 감소) |

기존 동작을 유지하려면 해당 값을 tsconfig.json에 명시하면 된다(예: `"module": "commonjs"`).

### 2.3. Deprecated 옵션

`"ignoreDeprecations": "6.0"`으로 경고를 숨길 수 있으나, **7.0에서는 완전히 제거된다.**

| 옵션 | 값 예시 | 대체 | 비고 |
|---|---|---|---|
| `baseUrl` | `"./src"` | `paths`(단독 사용 가능, 필요시 `"*": ["./src/*"]` catch-all) | `paths`의 prefix이자 bare specifier의 fallback 해석 경로로도 동작해 의도치 않은 경로 해석을 유발 |
| `moduleResolution` | `"node"`(`"node10"`) | Node.js 대상: `"nodenext"` / 번들러 대상: `"bundler"` | Node.js 10 시절 알고리즘 그대로 고정, 이후 Node.js 변경 미반영 |
| `moduleResolution` | `"classic"` | `"nodenext"` 또는 `"bundler"` | TS 최초의 모듈 해석 알고리즘, 현대 사용 사례 미지원 |
| `module` | `"amd"`/`"umd"`/`"systemjs"`/`"none"` | `"esnext"` 등 ESM + 외부 번들러 | 초기 모듈 로더 시대의 유산. `amd-module` 지시문도 함께 무효화 |
| `target` | `"es5"` | `"ES2015"` 이상 | IE 단종으로 ES5 출력 필요성 소멸 |
| `downlevelIteration` | `true` | (없음) | ES5 출력 전용 옵션이라 `target: es5` deprecation에 종속되어 무의미해짐 |
| `outFile` | `"./bundle.js"` | Webpack/Rollup/esbuild/Vite 등 외부 번들러 | 다중 파일을 단일 출력으로 합치는 용도였으나 번들러가 대체 |
| `esModuleInterop` | `false` | 항상 `true`로 고정 | `false` 지정 시 CommonJS 상호운용 런타임 문제를 유발해온 값이라 무시됨 |
| `allowSyntheticDefaultImports` | `false` | 항상 `true`로 고정 | `esModuleInterop`과 동일한 사유로 `false` 지정 금지 |
| `alwaysStrict` | `false` | (없음, 항상 strict) | 모든 출력이 이미 JS strict mode로 간주됨 |
| `/// <reference no-default-lib="true"/>` | (지시문) | `--noLib` 또는 `--libReplacement` | 지시문 오용 사례가 많아 폐지 |

## 3. 언어 기능 변경

컴파일러 옵션이 아니라 언어·타입 시스템 자체의 변경이다. 6.0은 deprecation 위주 릴리스라 5.0만큼 크지 않다.

| 기능 | 설명 |
|---|---|
| 문맥 민감 함수 판정 완화 | 메서드 문법으로 쓴 함수가 `this`를 실제로 참조하지 않으면 더 이상 "문맥 민감 함수"로 취급하지 않아, 제네릭 인자 추론 순서에서 우선순위가 높아짐(추론 정확도 개선) |
| `Temporal` 타입 | Stage 4 ECMAScript Temporal API 타입 추가. `lib`에 `esnext`/`esnext.temporal` 필요 |
| `Map`/`WeakMap` upsert 메서드 타입 | Stage 4 제안인 `getOrInsert`/`getOrInsertComputed` 타입 추가(`esnext` lib) |
| `RegExp.escape` 타입 | Stage 4 제안, 정규식 특수문자를 자동 이스케이프하는 함수의 타입(`es2025` lib) |
| DOM iterable 통합 | `lib.dom.iterable.d.ts`가 기본 `dom` lib에 통합돼, `NodeList` 등을 순회하려고 `"lib": ["dom", "dom.iterable"]`을 따로 쓸 필요가 없어짐 |

## 4. 언어 문법 Deprecation

tsconfig 옵션은 아니지만 같은 배치로 함께 deprecated됐다.

| 문법 | 대체 |
|---|---|
| `module Foo { ... }` (네임스페이스) | `namespace Foo { ... }` — `declare module "..."` 형태는 계속 지원 |
| `import x from "./f.json" asserts { type: "json" }` | `import x from "./f.json" with { type: "json" }` (import attributes) |

---

## Sources

- TypeScript 6.0 Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- Announcing the TypeScript native port: https://devblogs.microsoft.com/typescript/typescript-native-port/

---

## Related pages

- [[typescript]] — TypeScript 개요, 컴파일러(TS 7.0 네이티브 포트)
- [[tsconfig]] — tsconfig.json 현재 유효 옵션
- [[typescript-5.0]] — 이전 버전
