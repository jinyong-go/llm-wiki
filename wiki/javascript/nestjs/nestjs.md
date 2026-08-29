---
title: NestJS
updated: 2026-08-25 17:58:02
tags:
  - nodejs
  - nestjs
  - framework
  - decorator
---

## 1. 개요

**NestJS**는 Node.js 위에서 동작하는 서버사이드 프레임워크다. 효율적이고 확장 가능한 Node.js 서버사이드 애플리케이션 구축을 목표로 만들어졌으며, TypeScript를 기본 언어로 사용하고(순수 JavaScript도 가능) Angular의 아키텍처(모듈, 데코레이터, 의존성 주입)에서 영향을 받았다.

플랫폼 독립적으로 설계되어, 동일한 컨트롤러·서비스 코드를 HTTP 서버뿐 아니라 마이크로서비스·WebSocket·GraphQL 등 다른 전송 계층 위에서도 재사용할 수 있다.

### 1.1. 제공 기능

라우팅·DI 같은 코어 기능 외에, 실무에서 반복적으로 필요한 기능을 `@nestjs/*` 패키지나 공식 통합으로 제공한다.

| 영역 | 제공 방식 |
|---|---|
| 라우팅·요청 처리 | `@Controller`/HTTP 메서드 데코레이터, Guard·Pipe·Interceptor·Exception Filter([[nestjs-controllers]]) |
| 의존성 주입 | `@Injectable()`과 IoC 컨테이너([[nestjs-dependency-injection]]) |
| DB 연동 | `@nestjs/typeorm`([[nestjs-typeorm]]), `@nestjs/mongoose`([[nestjs-mongoose]]), `@nestjs/sequelize`([[nestjs-sequelize]]) 공식 통합, Prisma([[nestjs-prisma]]). 비교는 [[nestjs-database]] |
| 설정 관리 | `@nestjs/config`의 `ConfigModule`/`ConfigService`, `.env` 로드([[nestjs-config]]) |
| 유효성 검사 | `class-validator`/`class-transformer` 기반 `ValidationPipe` |
| 정적 파일 서빙 | `@nestjs/serve-static`([[nestjs-static-files]]) |
| 그 외 | 마이크로서비스(TCP/Redis/MQTT/gRPC/Kafka), WebSocket 게이트웨이, GraphQL, OpenAPI(Swagger) 문서화, `@nestjs/testing` 기반 테스트 유틸리티 |

이런 기능들이 프레임워크 차원에서 표준화되어 있어, Express처럼 매번 직접 조립할 필요가 적다.

### 1.2. 객체지향 기반 설계

Nest는 OOP(객체지향)·FP(함수형)·FRP(반응형 함수형) 프로그래밍의 요소를 결합한다고 소개하지만, 프레임워크의 뼈대는 객체지향에 가깝다.

| 개념 | Nest에서의 구현 |
|---|---|
| 클래스 | 컨트롤러·서비스·모듈·DTO 모두 클래스로 정의. 데코레이터가 클래스에 메타데이터를 부착([§5](#5-데코레이터)) |
| 캡슐화 | 모듈이 `providers`를 캡슐화하고, `exports`한 것만 외부에 공개([[nestjs-modules]]) |
| 인터페이스 | Guard(`CanActivate`)·Pipe(`PipeTransform`)·Interceptor(`NestInterceptor`)처럼 표준 인터페이스를 구현해 요청 파이프라인에 끼워 넣는 구조 |
| 의존성 주입(DI) | 클래스가 구체 구현을 직접 생성하지 않고 생성자에서 타입(또는 토큰)으로 요청하면, IoC 컨테이너가 인스턴스를 주입([[nestjs-dependency-injection]]) |

### 1.3. 사용 이유

Express 같은 저수준 HTTP 프레임워크는 미들웨어 체인만 제공할 뿐 아키텍처 문제는 해결하지 않는다. Nest는 이 문제에 대해, 테스트하기 쉽고 확장 가능하며 느슨하게 결합되고 유지보수하기 쉬운 애플리케이션을 만들 수 있는 즉시 사용 가능한(out-of-the-box) 애플리케이션 아키텍처를 제공하는 것을 목표로 한다. 상세 장단점 비교는 [§6](#6-장단점) 참고.

### 1.4. 플랫폼: Express vs Fastify

Nest는 **어댑터 패턴**으로 프레임워크 독립성을 확보한다. 어댑터가 미들웨어·핸들러 호출을 실제 HTTP 라이브러리(Express 또는 Fastify)의 구현으로 위임하는 방식이다.

| | Express (`@nestjs/platform-express`) | Fastify (`@nestjs/platform-fastify`) |
|---|---|---|
| 기본 여부 | 기본값, 설치 불필요 | `npm i --save @nestjs/platform-fastify` 필요 |
| 특징 | 널리 쓰이고 호환 미들웨어가 풍부함 | 벤치마크 기준 Express 대비 약 2배 빠름 |
| 리다이렉트 | `res.redirect(url)` | 상태 코드와 URL을 함께 반환해야 함(`res.status(302).redirect(url)`) |
| 리스닝 기본값 | 모든 인터페이스 | 기본적으로 `127.0.0.1`만. 외부 접속 허용 시 `listen(port, '0.0.0.0')` 명시 필요 |

Express가 기본값인 이유는 성능보다 생태계 크기(호환 미들웨어) 때문이다. `FastifyAdapter`를 사용하면 Fastify로 교체할 수 있다.

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Fastify로 전환하면 Express 전용으로 작성된 레시피·미들웨어는 그대로 쓸 수 없고, Fastify 대응 패키지로 바꿔야 한다.

---

## 2. 설치

### 2.1. 사전 요구사항과 설치

Node.js 20 이상이 필요하다. [[npm]]으로 Nest CLI를 전역 설치한 뒤 프로젝트를 생성한다.

```bash
npm i -g @nestjs/cli
nest new project-name
```

`nest new`는 `project-name` 디렉터리를 만들고 `node_modules` 설치, 보일러플레이트 파일 생성까지 한번에 처리한다.

### 2.2. 기본 설치 패키지

Node.js 기반이므로 의존성 관리는 npm과 `package.json`/`package-lock.json`을 그대로 따른다([[npm]] 참고). `nest new`로 생성한 프로젝트는 아래 dependencies를 기본 포함한다.

| 패키지 | 역할 |
|---|---|
| `@nestjs/core` | 프레임워크 코어(DI 컨테이너, 애플리케이션 부트스트랩) |
| `@nestjs/common` | 데코레이터·파이프·가드 등 공통 빌딩 블록 |
| `@nestjs/platform-express` | Express 어댑터(기본 HTTP 플랫폼, [§1.4](#14-플랫폼-express-vs-fastify)) |
| `reflect-metadata` | 데코레이터 메타데이터 리플렉션(DI 타입 추론에 필수, [§5](#5-데코레이터)) |
| `rxjs` | 인터셉터 등에서 사용하는 반응형 스트림 |

devDependencies에는 다음과 같은 개발용 도구가 포함된다.

| 패키지 | 역할 |
|---|---|
| `@nestjs/cli`, `@nestjs/schematics` | CLI 본체와 코드 생성용 스키매틱 |
| `@nestjs/testing` | `TestingModule` 등 DI 목(mock) 교체를 지원하는 테스트 유틸리티 |
| `typescript`, `typescript-eslint` | TypeScript 컴파일러와 ESLint용 TS 규칙 |
| `eslint` 및 관련 플러그인 | 정적 분석(`eslint.config.mjs`에서 설정) |
| `prettier` | 코드 포맷터(`.prettierrc`에서 설정) |
| `jest`, `ts-jest`, `@types/jest` | 단위·e2e 테스트 러너와 TS 지원 |
| `ts-node`, `tsconfig-paths` | 개발 모드 실행과 tsconfig 경로 별칭 해석 |
| `supertest`, `@types/supertest` | e2e 테스트용 HTTP 요청 어서션 |
| `@types/express`, `@types/node`, `source-map-support` | 타입 정의와 컴파일된 JS 스택 트레이스의 TS 소스 매핑 |

lockfile 개념과 `npm install`/`npm ci` 차이는 [[npm]] §4 참고. Fastify로 전환하면 `@nestjs/platform-express` 대신 `@nestjs/platform-fastify`를 설치한다.

---

## 3. 프로젝트 구조

### 3.1. 전체 구조

```
project-name/
  src/
    app.controller.spec.ts
    app.controller.ts
    app.module.ts
    app.service.ts
    main.ts
  test/
    app.e2e-spec.ts
    jest-e2e.json
  .gitignore
  .prettierrc
  eslint.config.mjs
  nest-cli.json
  package.json
  package-lock.json
  README.md
  tsconfig.build.json
  tsconfig.json
```

`node_modules/`(의존성 설치 결과)와 `dist/`(빌드 결과, [§4](#4-스크립트))는 생성되지만 위 목록에서는 생략했다.

| 파일/디렉터리 | 역할 |
|---|---|
| `src/` | 애플리케이션 소스 코드. 컨트롤러·서비스·모듈이 여기 위치 |
| `test/` | e2e 테스트. `jest-e2e.json`이 별도 Jest 설정을 지정 |
| `.gitignore` | git 추적 제외 목록(`node_modules`, `dist` 등) |
| `.prettierrc` | Prettier 포맷 설정 |
| `eslint.config.mjs` | ESLint flat config |
| `nest-cli.json` | Nest CLI 설정. 스키매틱 컬렉션, `sourceRoot`(소스 루트 디렉터리) 등 지정 |
| `package.json` | 의존성과 스크립트 정의([§2.2](#22-기본-설치-패키지), [§4](#4-스크립트)) |
| `package-lock.json` | 의존성 잠금 파일 |
| `README.md` | 프로젝트 설명 |
| `tsconfig.json` | TypeScript 컴파일러 옵션([[tsconfig]]) |
| `tsconfig.build.json` | 빌드 전용 tsconfig. `tsconfig.json`을 확장하며 `test`·스펙 파일을 제외([[tsconfig]] §2.1) |

### 3.2. main.ts

`src/main.ts`는 애플리케이션 진입점이다. `NestFactory`로 루트 모듈을 인스턴스화하고 지정한 포트에서 리스닝을 시작한다.

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`NestFactory.create()`가 반환하는 애플리케이션 객체는 사용 중인 플랫폼([§1.4](#14-플랫폼-express-vs-fastify)) 기반이며, `NestFactory.create<NestExpressApplication>(AppModule)`처럼 제네릭 타입을 명시하면 플랫폼 전용 API도 사용할 수 있다. `src/` 내 나머지 기본 파일의 역할은 아래와 같다.

| 파일 | 역할 |
|---|---|
| `app.module.ts` | 루트 모듈 |
| `app.controller.ts` | 라우트 하나를 갖는 기본 컨트롤러 |
| `app.service.ts` | 메서드 하나를 갖는 기본 서비스 |
| `app.controller.spec.ts` | 컨트롤러 단위 테스트 |

---

## 4. 스크립트

실행 명령은 `package.json`의 `scripts` 필드에 정의되며 `npm run <스크립트명>`으로 호출한다. `nest new`로 생성한 프로젝트는 기본적으로 아래 스크립트를 포함한다.

| 스크립트 | 명령 | 역할 |
|---|---|---|
| `start` | `nest start` | 1회 실행 |
| `start:dev` | `nest start --watch` | watch 모드, 파일 변경 시 자동 재컴파일·재시작 |
| `start:debug` | `nest start --debug --watch` | 디버그 모드 watch 실행 |
| `start:prod` | `node dist/main` | 빌드된 결과물(`dist/`)을 직접 실행 |
| `build` | `nest build` | TypeScript를 `dist/`로 컴파일 |
| `lint` | `eslint ... --fix` | ESLint 검사·자동수정 |
| `format` | `prettier --write ...` | Prettier 포맷팅 |
| `test` | `jest` | 단위 테스트 |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | e2e 테스트 |

새로운 스크립트를 추가하려면 `package.json`의 `scripts` 객체에 `"스크립트명": "실행할 명령"` 형태로 키-값 쌍을 추가하면 된다.

```json
{
  "scripts": {
    "seed": "ts-node src/seed.ts"
  }
}
```

CLI로 컨트롤러·서비스·모듈 파일을 생성하는 `nest generate`(축약형 `nest g`)는 `package.json` 스크립트가 아니라 Nest CLI가 직접 제공하는 별도 명령이다.

```bash
nest g controller cats
nest g service cats
nest g module cats
```

---

## 5. 데코레이터

**데코레이터(decorator)**는 클래스·메서드·프로퍼티·파라미터에 메타데이터를 부착하는 TypeScript 문법이다(`@Module()`, `@Injectable()`처럼 `@` 기호로 표시). Nest는 이 메타데이터를 런타임에 읽어 라우팅 맵과 DI 그래프를 구성하므로, 프레임워크 전체가 데코레이터 기반으로 동작한다.

데코레이터가 부착한 메타데이터를 런타임에 읽으려면 `reflect-metadata` 패키지가 필요하다. TypeScript 컴파일러의 `emitDecoratorMetadata` 옵션과 함께 동작하며, `nest new`로 생성한 프로젝트에는 기본 의존성으로 포함된다([§2.2](#22-기본-설치-패키지)).

데코레이터를 쓰는 이유는 클래스·메서드에 필요한 설정(라우트 경로, DI 대상 여부, 검증 대상 등)을 별도 설정 파일이 아니라 선언 지점 바로 위에 선언적으로 기술할 수 있기 때문이다. `@Module()`(모듈 정의, [[nestjs-modules]]), `@Controller()`/HTTP 메서드 데코레이터(라우팅, [[nestjs-controllers]]), `@Injectable()`(DI 대상 지정, [[nestjs-dependency-injection]])이 대표적이며, `createParamDecorator()`로 요청 값을 추출하는 커스텀 파라미터 데코레이터도 직접 정의할 수 있다.

---

## 6. 장단점

### 6.1. 장점

- **정형화된 아키텍처** — Express는 미들웨어 체인만 제공할 뿐 모듈 구조·계층 분리를 강제하지 않는다. 프로젝트가 커지면 팀마다, 개발자마다 구조가 달라져 유지보수가 어려워진다. NestJS는 모듈·컨트롤러·프로바이더와 DI 컨테이너로 구조를 강제해, 여러 개발자가 같은 방식으로 코드를 작성하게 만든다. 이는 협업·온보딩·장기 유지보수에 유리하다.
- **TypeScript 우선 설계** — DI 컨테이너와 데코레이터 파라미터가 완전히 타입화되어 있어 컴파일 타임에 오류를 잡을 수 있다. Express는 `@types/express`로 타입을 붙여도 `req.body`/`req.params`는 기본적으로 `any`다.
- **내장 크로스커팅 기능** — 검증(`class-validator`/`class-transformer`), 가드·인터셉터·파이프, `@nestjs/testing`을 통한 DI 목(mock) 교체 등이 프레임워크 차원에서 표준화되어 있어 직접 조립할 필요가 적다.
- **플랫폼 독립성** — Express/Fastify 전환([§1.4](#14-플랫폼-express-vs-fastify))은 물론, 동일한 코드를 마이크로서비스·WebSocket·GraphQL 등 다른 전송 계층에서도 재사용할 수 있다.

### 6.2. 단점

- **학습 곡선** — 데코레이터, DI, 모듈 개념에 대한 이해가 필요하다. TypeScript·OOP에 익숙하지 않으면 진입 장벽이 있다.
- **보일러플레이트** — 엔드포인트 하나에도 컨트롤러·서비스·모듈 3개 파일 등록이 필요해, 소규모 프로젝트·프로토타입에는 과할 수 있다.
- **약간의 런타임 오버헤드** — 기본값인 Express 어댑터 기준으로는 추상화 계층 때문에 raw Express보다 근소하게 느리다. Fastify 어댑터로 전환하면 이 격차를 줄이거나 역전할 수 있다([§1.4](#14-플랫폼-express-vs-fastify)).
- **상대적으로 좁은 미들웨어 생태계** — `@nestjs/*` 패키지가 주요 기능을 커버하지만 Express만큼 방대하지는 않다. 다만 Express 미들웨어를 Nest 앱 안에서 감싸 사용할 수는 있다.

### 6.3. 선택 기준

| 항목 | Express | NestJS |
|---|---|---|
| 아키텍처 강제 | 없음(미들웨어 체인) | 모듈/컨트롤러/프로바이더 + DI |
| 학습 곡선 | 낮음 | 중~높음 |
| 검증·테스트 | 직접 구성 | `class-validator`, `@nestjs/testing` 내장 |
| 적합 규모 | 소규모·프로토타입·1인 개발 | 대규모·장기 유지보수·팀 개발 |

---

## Sources

- NestJS Docs — Introduction: https://docs.nestjs.com/
- NestJS Docs — First steps: https://docs.nestjs.com/first-steps
- NestJS Docs — Platform agnosticism: https://docs.nestjs.com/fundamentals/platform-agnosticism
- NestJS Docs — Techniques: Database: https://docs.nestjs.com/techniques/database
- Encore — NestJS vs Express in 2026: https://encore.dev/articles/nestjs-vs-express
- NestJS Docs — Performance (Fastify): https://docs.nestjs.com/techniques/performance
- NestJS Docs — Controllers: https://docs.nestjs.com/controllers
- NestJS Docs — Providers: https://docs.nestjs.com/providers
- NestJS Docs — Modules: https://docs.nestjs.com/modules
- NestJS Docs — Custom route decorators: https://docs.nestjs.com/custom-decorators
- `@nestjs/cli@11` `nest new` 실행 결과(package.json, tsconfig.json, nest-cli.json 등 생성 파일 확인)

---

## Related pages

- [[npm]] — package.json, lockfile, scripts
- [[nestjs-dependency-injection]] — Provider, 토큰, 커스텀 프로바이더, 순환 의존성
- [[nestjs-modules]] — 모듈 캡슐화, 공유, 전역·동적 모듈
- [[nestjs-config]] — ConfigModule/ConfigService, .env, Spring 설정과 비교
- [[nestjs-controllers]] — 컨트롤러·라우팅·파라미터 데코레이터 상세, 요청 파이프라인
- [[nestjs-request-pipeline]] — Guard·Pipe·Interceptor·Exception Filter 상세
- [[nestjs-testing]] — Jest 기반 테스트, TestingModule, Mock 교체
- [[nestjs-database]] — TypeORM/Mongoose/Sequelize/Prisma 비교
- [[nestjs-static-files]] — 정적 파일 서빙: ServeStaticModule, useStaticAssets, 빌드 스크립트
