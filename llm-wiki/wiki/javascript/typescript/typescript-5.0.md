---
title: TypeScript 5.0
updated: 2026-08-25 17:39:20
tags:
  - javascript
  - typescript
  - typescript5
---

## 1. 개요

TypeScript 5.0은 2023-03-16 릴리스됐다. 새 데코레이터 표준 구현, ESM 프로젝트 지원 강화, 컴파일러 자체의 크기·속도 개선을 주요 목표로 삼았다.

## 2. 컴파일러 옵션

### 2.1. 추가된 옵션

| 옵션 | 타입/값 | 설명 |
|---|---|---|
| `moduleResolution: "bundler"` | 문자열 리터럴 | Vite/esbuild/Webpack 등 번들러의 ESM+CommonJS 혼합 해석 규칙을 모델링 |
| `verbatimModuleSyntax` | boolean | 타입 수정자(`import type`) 없는 import/export는 그대로 보존, `type` 수정자가 붙은 건 완전히 제거. `importsNotUsedAsValues`/`preserveValueImports` 대체 |
| `allowImportingTsExtensions` | boolean | `.ts`/`.mts`/`.tsx` 확장자를 붙인 import 허용(`--noEmit`/`--emitDeclarationOnly`와 함께만 사용 가능) |
| `resolvePackageJsonExports` | boolean | `package.json`의 `exports` 필드 참조. `node16`/`nodenext`/`bundler`에서 기본 `true` |
| `resolvePackageJsonImports` | boolean | `package.json`의 `imports` 필드(`#`로 시작하는 조회) 참조. 위와 동일 조건에서 기본 `true` |
| `allowArbitraryExtensions` | boolean | `.css` 등 임의 확장자 import 시 `{name}.d.{ext}.ts` 선언 파일 탐색 허용 |
| `customConditions` | `string[]` | `exports`/`imports` 해석 시 사용할 커스텀 조건 이름 목록 |

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "customConditions": ["my-condition"]
  }
}
```

### 2.2. 기본값 변경

| 옵션 | 이전 기본값 | 새 기본값 |
|---|---|---|
| `newLine` | OS에 따라 다름 | `"lf"` |
| `forceConsistentCasingInFileNames` | `false` | `true` |

### 2.3. Deprecated 옵션

계획대로 TypeScript 6.0에서 완전히 제거됐다([[typescript-6.0]]) — 현재는 지정하면 에러가 난다.

| 옵션 | 값 예시 | 대체 | 비고 |
|---|---|---|---|
| `importsNotUsedAsValues` | `"remove"`/`"preserve"`/`"error"` | `verbatimModuleSyntax: true` | 타입 전용 import 처리 방식 통합 |
| `preserveValueImports` | `true` | `verbatimModuleSyntax: true` | 위와 동일한 사유로 통합 |
| `target` | `"ES3"` | `"ES2015"` 이상 | ES3 타깃 자체가 지원 종료 |
| `out` | `"./bundle.js"` | `outFile` | 단일 파일 번들 출력(단, `outFile`도 6.0에서 deprecated) |
| `charset` | `"utf8"` | (없음) | 항상 UTF-8로 가정하므로 무의미해짐 |
| `noImplicitUseStrict` | `true` | (없음) | 모든 출력이 이미 strict/모듈이라 무의미 |
| `noStrictGenericChecks` | `true` | (없음) | 제네릭 엄격 검사가 항상 적용됨 |
| `keyofStringsOnly` | `true` | (없음) | `keyof`가 `string`만 반환하던 구버전 호환용 |
| `suppressExcessPropertyErrors` | `true` | (없음) | 초과 프로퍼티 검사를 끄는 안전하지 않은 옵션 |
| `suppressImplicitAnyIndexErrors` | `true` | (없음) | 위와 동일한 사유 |
| `prepend`(`references` 항목 내) | `true` | (없음) | 프로젝트 참조의 출력 병합 순서 지정 기능 |

5.0~5.4에서는 `"ignoreDeprecations": "5.0"`으로 경고를 숨길 수 있었으나, 5.5부터 무효화됐다.

## 3. 언어 기능 변경

컴파일러 옵션이 아니라 언어·타입 시스템 자체의 변경이다.

| 기능 | 설명 |
|---|---|
| Decorators | ECMAScript 표준 데코레이터(TC39 stage 3) 정식 구현. 기존 `experimentalDecorators`와 문법·동작이 다르다 |
| `const` 타입 파라미터 | 제네릭 타입 파라미터에 `const` 수정자를 붙이면 `as const`처럼 리터럴 타입으로 추론(`function f<const T>(x: T)`) |
| 모든 enum이 union enum | 계산된 enum 멤버(`enum E { A = Math.random() }`)도 고유 타입을 가져, 모든 enum이 union enum처럼 동작 |
| `export type *` | 타입만 재내보내는 네임스페이스 re-export(`export type * as vehicles from "./vehicles"`) |
| JSDoc `@satisfies` | `.js` 파일에서 `satisfies` 연산자와 동일한 타입 검증을 JSDoc 주석으로 수행 |
| JSDoc `@overload` | `.js` 파일에서 함수 오버로드 시그니처를 JSDoc으로 선언 |
| 관계 연산자 암묵적 형변환 금지 | `>`/`<`/`<=`/`>=`에 문자열-숫자 혼합 비교 시 에러(`ns > 4`가 `ns: number\|string`이면 에러, `+ns > 4`로 명시 필요) |
| enum 값 검증 강화 | 열거형에 정의되지 않은 리터럴 값을 할당하면 에러 |

```typescript
function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    console.log(`Entering ${String(context.name)}`);
    return originalMethod.call(this, ...args);
  };
}

class Person {
  @loggedMethod
  greet() { console.log("Hello"); }
}
```

---

## Sources

- TypeScript 5.0 Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html
- TypeScript 5.5 Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html

---

## Related pages

- [[tsconfig]] — tsconfig.json 현재 유효 옵션
- [[typescript-6.0]] — 다음 버전
