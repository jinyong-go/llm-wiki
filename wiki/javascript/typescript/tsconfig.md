---
title: tsconfig.json
updated: 2026-08-25 13:21:56
tags:
  - javascript
  - typescript
  - configuration
---

## 1. 개요

`tsconfig.json`이 디렉터리에 있으면 그 디렉터리가 TypeScript 프로젝트의 루트임을 나타낸다. 컴파일 대상 파일과 컴파일러 옵션을 지정한다. `tsc`를 입력 파일 없이 실행하면 현재 디렉터리에서 상위로 올라가며 이 파일을 찾고, `-p 경로`로 위치를 직접 지정할 수도 있다. 입력 파일을 직접 나열하면 `tsconfig.json`은 무시된다.

순수 JavaScript 프로젝트는 동일하게 동작하는 `jsconfig.json`을 대신 쓸 수 있다. `tsc --init`으로 기본 설정 파일을 생성한다.

## 2. 최상위 필드

| 필드 | 역할 | 기본값 |
|---|---|---|
| `compilerOptions` | 컴파일러 옵션([§3](#3-compileroptions)) | — |
| `files` | 포함할 파일 allowlist. 없는 파일이 있으면 에러 | — |
| `include` | 포함할 파일 패턴 배열(`*`/`?`/`**/`) | `files` 지정 시 `[]`, 아니면 `**/*` |
| `exclude` | `include` 결과에서 제외할 패턴 | `node_modules`, `bower_components`, `jspm_packages`, `<outDir>` |
| `extends` | 상속할 다른 설정 파일 경로 | — |
| `references` | 프로젝트 참조(§4) | — |

`exclude`는 `include`가 찾는 대상만 줄일 뿐, 코드에서 `import`로 참조되면 `exclude` 대상이어도 프로그램에 포함된다.

### 2.1. extends

문자열 하나 또는 문자열 배열(TypeScript 5.0+)을 받는다. 배열이면 뒤 항목이 앞 항목을 확장하는 체인으로 동작하며, 충돌하는 옵션은 **뒤 항목이 우선**한다.

```json
{
  "extends": ["@tsconfig/strictest/tsconfig.json", "../../tsconfig.base.json"],
  "compilerOptions": { "outDir": "../lib" }
}
```

상속하는 설정의 `files`/`include`/`exclude`는 base 설정의 값을 덮어쓴다. `references`는 상속되지 않는 유일한 최상위 필드다.

## 3. compilerOptions

전체 옵션은 방대하므로 공식 카테고리별 대표 옵션만 정리한다. NestJS가 `nest new`로 생성하는 실제 설정([[nestjs]] §3.1)을 예로 든다. 자주 쓰는 옵션은 값 타입·예시와 함께 하위 항목에서 따로 설명한다.

| 카테고리 | 대표 옵션 | 설명 |
|---|---|---|
| Language and Environment | `target`, `lib`, `experimentalDecorators` | 출력 ECMAScript 버전, 사용 가능한 전역 API, 데코레이터 문법 활성화 |
| Modules | `module`, `moduleResolution`, `paths` | 출력 모듈 형식과 모듈 해석 방식([[module-system]]) |
| Emit | `outDir`, `declaration`, `sourceMap`, `removeComments` | 컴파일 결과물 위치와 `.d.ts`/소스맵 생성 여부 |
| Type Checking | `strict`, `strictNullChecks`, `noImplicitAny` | 타입 검사 엄격도. `strict`는 이 계열 옵션을 한 번에 켜는 묶음 플래그 |
| Interop Constraints | `esModuleInterop`, `isolatedModules`, `verbatimModuleSyntax` | CommonJS/ESM 상호운용, 파일 단위 독립 트랜스파일 제약 |
| JavaScript Support | `allowJs`, `checkJs` | `.js` 파일 포함·타입 검사 여부 |
| Projects | `composite`, `incremental`, `tsBuildInfoFile` | 프로젝트 참조·증분 빌드([§4](#4-references-프로젝트-참조)) |
| Completeness | `skipLibCheck` | `node_modules` 내 `.d.ts` 타입 검사 생략(빌드 속도 개선) |

```json
// NestJS 기본 생성 tsconfig.json (발췌)
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2023",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  }
}
```

### 3.1. target / lib

`target`은 문자열 리터럴(ECMAScript 버전명), `lib`은 문자열 배열이다. 보통 `target`이 정하는 기본 lib를 그대로 쓰고 `DOM` 등 환경별 타입만 추가한다.

```json
{ "compilerOptions": { "target": "ES2022", "lib": ["ES2022", "DOM"] } }
```

### 3.2. module / moduleResolution

둘 다 문자열 리터럴이다. Node.js를 직접 대상으로 하면 `nodenext`, 번들러(Vite/Webpack 등)나 Bun을 쓰면 `bundler`를 쓴다([[module-system]]).

```json
{ "compilerOptions": { "module": "nodenext", "moduleResolution": "nodenext" } }
```

### 3.3. strict

boolean이다. `strictNullChecks`/`noImplicitAny`/`strictFunctionTypes` 등 여러 검사를 한 번에 켠다.

```json
{ "compilerOptions": { "strict": true } }
```

### 3.4. esModuleInterop

boolean이다. CommonJS 모듈을 ESM처럼 default import(`import express from 'express'`)할 수 있게 한다. `false` 지정은 TypeScript 6.0부터 deprecated됐다([[typescript-6.0]]).

```json
{ "compilerOptions": { "esModuleInterop": true } }
```

### 3.5. outDir / rootDir

둘 다 경로 문자열이다. `outDir` 아래에 `rootDir` 기준 디렉터리 구조가 그대로 재현된다.

```json
{ "compilerOptions": { "rootDir": "./src", "outDir": "./dist" } }
```

### 3.6. paths

`{ [별칭 패턴]: 실제_경로_배열 }` 형태다. TypeScript 4.1부터 `tsconfig.json` 위치 기준 상대경로로 해석되어 `baseUrl` 없이 단독 사용 가능하다(`baseUrl`은 deprecated, [[typescript-6.0]]). 타입 검사에만 영향을 주므로 번들러의 alias 설정이나 `tsconfig-paths` 같은 런타임 리졸버가 별도로 필요하다.

```json
{ "compilerOptions": { "paths": { "@app/*": ["./src/app/*"] } } }
```

### 3.7. skipLibCheck

boolean이다. `node_modules` 내부 `.d.ts` 타입 검사를 생략해 빌드 속도를 높인다. 실무에서 거의 항상 켠다.

```json
{ "compilerOptions": { "skipLibCheck": true } }
```

### 3.8. declaration / sourceMap

둘 다 boolean이다. `declaration`은 `.d.ts` 생성(라이브러리 배포 시 필요), `sourceMap`은 디버깅용 소스맵 생성이다.

```json
{ "compilerOptions": { "declaration": true, "sourceMap": true } }
```

## 4. references — 프로젝트 참조

여러 `tsconfig.json`으로 구성된 대규모 프로젝트를 하위 프로젝트 단위로 쪼개, 빌드·에디터 반응 속도를 개선하는 기능이다. 참조받는 프로젝트는 `compilerOptions.composite: true`가 필요하다.

```json
{
  "references": [{ "path": "../shared" }]
}
```

## 5. Deprecated 옵션

이 문서는 현재 유효한 옵션만 다룬다. 버전별로 deprecated된 옵션과 대체 방법은 별도 문서에 정리했다.

- [[typescript-5.0]] — TS 6.0에서 이미 제거된 배치
- [[typescript-6.0]] — TS 7.0(Go 네이티브 컴파일러)에서 제거 예정인 현재 배치

---

## Sources

- TypeScript Docs — tsconfig.json: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
- TypeScript — TSConfig Reference: https://www.typescriptlang.org/tsconfig/
- TypeScript 5.0 Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html

---

## Related pages

- [[typescript]] — TypeScript 개요, 컴파일러, 장단점
- [[module-system]] — CommonJS vs ES Module, `module`/`moduleResolution` 관련
- [[nestjs]] — `nest new` 생성 tsconfig.json/tsconfig.build.json 실물
- [[typescript-5.0]] — 버전별 추가/deprecated 옵션
- [[typescript-6.0]] — 버전별 추가/deprecated 옵션
