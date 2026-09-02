---
title: TypeScript
updated: 2026-08-25 13:21:56
tags:
  - javascript
  - typescript
---

## 1. 개요

**TypeScript**는 JavaScript의 상위집합(superset)이자 정적 타입 검사기다. Microsoft가 개발했고(Anders Hejlsberg 주도), 2012년 최초 공개됐다. 유효한 JavaScript는 대부분 그대로 유효한 TypeScript이며, 여기에 타입 주석·인터페이스 등 타입 시스템을 얹은 것이다.

타입은 **erasable**(소거 가능)하다 — 컴파일 시 타입 주석은 완전히 제거되고 런타임에 남는 코드는 순수 JavaScript와 동일하다. 타입 시스템은 이름이 아니라 형태(shape)가 같으면 호환되는 **구조적 타입(structural typing)**을 따른다 — 이름 기반인 Java/C#의 명목적 타입(nominal typing)과 다르다.

### 1.1. 왜 사용하는가

가장 흔한 프로그래밍 오류는 "기대한 것과 다른 종류의 값이 쓰인" 타입 오류다. TypeScript는 코드 실행 전(컴파일 타임)에 이런 오류를 잡아내는 것을 목표로 한다.

- **조기 오류 발견**: 런타임이 아니라 컴파일 타임에 타입 불일치를 잡는다
- **에디터 지원**: 타입 정보를 기반으로 자동완성·정의로 이동·이름 변경 같은 IDE 기능이 크게 강화된다
- **협업·문서화**: 함수 시그니처·인터페이스가 사실상의 계약(contract) 역할을 해 대규모·다인 협업에서 코드 의도를 명시적으로 드러낸다
- **점진적 도입**: JS 상위집합이라 기존 JS 코드베이스에 파일 단위로 점진적으로 도입할 수 있다

## 2. 컴파일러 — tsc

공식 컴파일러는 `tsc`이며, `npm i -D typescript`로 설치한다. 옵션은 `tsconfig.json`으로 설정한다([[tsconfig]]).

2026-07-08 TypeScript 7.0부터 `tsc`는 Go로 새로 작성된 네이티브 컴파일러다. 6.0까지는 TypeScript 자신으로 작성되어 JS로 컴파일된 컴파일러였고, 베타 기간에는 `@typescript/native-preview` 패키지의 `tsgo` 명령으로 별도 배포됐다가 7.0 정식 릴리스에서 표준 `typescript` 패키지의 `tsc`로 흡수됐다. 기존 대비 8~12배 빠르며, 타입 체크 의미론은 기존과 동일하게 유지한다(포트이지 재작성이 아님).

## 3. 관련 도구

### 3.1. 타입 체크와 트랜스파일의 분리

esbuild·SWC·Babel(`@babel/preset-typescript`) 같은 번들러/트랜스파일러는 타입 주석을 **제거만** 할 뿐 타입 오류를 검사하지 않는다. 실제 오류 검사는 `tsc`(또는 `tsc --noEmit`)가 담당한다. Vite·Next.js 등 현대 빌드 도구 대부분이 이 분리 구조를 쓴다 — 빌드 시에는 빠른 트랜스파일러로 타입 주석만 벗겨내고, 타입 검사는 별도로(주로 CI에서) `tsc`를 돌린다.

### 3.2. 실행 도구

| 도구         | 특징                                              |
| ---------- | ----------------------------------------------- |
| `ts-node`  | Node.js 위에서 TS를 즉석 컴파일해 실행. `tsc` 기반이라 상대적으로 느림 |
| `tsx`      | esbuild 기반, `ts-node`보다 빠른 대안                   |
| Deno / Bun | 런타임 자체가 TS를 기본 지원, 별도 설치 불필요                    |

### 3.3. Node.js 네이티브 지원

Node.js 24(LTS)부터 `.ts` 파일을 별도 도구 없이 `node file.ts`로 바로 실행할 수 있다. `amaro`(SWC 기반) 모듈이 타입 주석을 공백으로 치환해 지우는 **type stripping** 방식이며, 타입 검사는 하지 않는다. `enum`처럼 런타임 코드를 생성하는 문법은 "소거 가능"하지 않아 지원 범위 밖이며, 이런 문법 사용을 컴파일 타임에 막는 `--erasableSyntaxOnly` 옵션도 있다.

## 4. 장단점

### 4.1. 장점

- 컴파일 타임 타입 검사로 런타임 전에 오류를 잡는다
- 대규모·장기 프로젝트에서 리팩토링 안전성이 높고, 인터페이스가 협업 계약 역할을 한다
- 자동완성·이름 변경 등 에디터 지원이 강력하다
- JS 상위집합이라 기존 JS 생태계(npm 패키지)를 그대로 쓸 수 있다

### 4.2. 단점

- 빌드(컴파일/트랜스파일) 단계가 추가된다 — 다만 [§3.3](#33-nodejs-네이티브-지원)처럼 런타임 스트리핑으로 완화할 수 있다
- 제네릭·조건부 타입 등 타입 시스템 자체의 학습 곡선이 있다
- 서드파티 JS 라이브러리에 타입 정의(`@types/*` 또는 자체 `.d.ts`)가 없으면 타입 안전성이 깨진다
- 타입은 컴파일 타임에만 존재해 런타임 값 검증(예: 외부 API 응답)까지 보장하지 않는다 — 필요하면 zod 등 별도 런타임 검증 라이브러리가 필요하다

### 4.3. 선택 기준

| 항목 | JavaScript | TypeScript |
|---|---|---|
| 오류 발견 시점 | 런타임 | 대부분 컴파일 타임 |
| 빌드 단계 | 불필요 | 필요(또는 런타임 type stripping) |
| 적합 규모 | 소규모·프로토타입 | 대규모·장기 유지보수·팀 개발 |

---

## Sources

- TypeScript Docs — Handbook Intro: https://www.typescriptlang.org/docs/handbook/intro.html
- Announcing TypeScript 7.0: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- InfoQ — Microsoft Releases TypeScript 7.0 with a Native Go Compiler: https://www.infoq.com/news/2026/08/typescript-7-released/
- Node.js Docs — Modules: TypeScript: https://nodejs.org/api/typescript.html

---

## Related pages

- [[tsconfig]] — tsconfig.json 옵션
- [[typescript-6.0]] — TypeScript 6.0, JS 기반 마지막 릴리스
- [[module-system]] — CommonJS vs ES Module
