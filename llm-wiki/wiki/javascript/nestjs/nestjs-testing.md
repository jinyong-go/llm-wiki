---
title: NestJS 테스트
updated: 2026-08-24 17:10:48
tags:
  - nodejs
  - nestjs
  - testing
---

## 1. 개요

Jest가 기본 테스트 프레임워크로 설정되어 있다. `nest new`로 생성한 프로젝트는 Jest·`ts-jest`·`@nestjs/testing`이 기본 devDependencies에 포함되고([[nestjs]] §2.2), 컨트롤러·서비스 생성 시 `.spec.ts` 테스트 파일도 함께 스캐폴딩된다. 단위 테스트는 `*.spec.ts`, e2e 테스트는 `test/*.e2e-spec.ts` 파일명 규칙을 따른다([[nestjs]] §3.1).

`@nestjs/testing`은 Nest의 DI 시스템을 테스트 환경에서도 그대로 활용할 수 있게 해준다 — 실제 애플리케이션과 동일한 모듈 그래프를 구성한 뒤 특정 provider만 mock으로 교체하는 방식이 핵심이다.

## 2. 단위 테스트

### 2.1. 격리 테스트

DI 없이 클래스를 직접 인스턴스화하는 가장 단순한 방식이다.

```typescript
describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  it('should return an array of cats', async () => {
    const result = ['test'];
    jest.spyOn(catsService, 'findAll').mockImplementation(() => result);
    expect(await catsController.findAll()).toBe(result);
  });
});
```

### 2.2. TestingModule

`Test.createTestingModule()`로 실제 모듈과 동일한 메타데이터(`controllers`/`providers`/`imports`)를 넘겨 DI 그래프를 구성한다. `compile()`은 비동기이며, `moduleRef.get()`으로 인스턴스를 꺼낸다. `nest new`가 생성하는 기본 `app.controller.spec.ts`가 이 패턴을 쓴다.

```typescript
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });
});
```

`moduleRef.get()`은 정적 인스턴스만 조회한다. 요청 스코프 등 동적으로 생성되는 provider는 `moduleRef.resolve()`를 쓴다([§5](#5-요청-스코프-provider-테스트)).

## 3. Mock 교체

`overrideProvider(토큰).useValue()`/`useClass()`/`useFactory()`로 특정 provider만 갈아끼운다 — 기본 사용법은 [[nestjs-dependency-injection]] §3.5 참고. 여기서는 그 외 오버라이드 대상과 자동 목킹을 다룬다.

### 3.1. 그 외 오버라이드 대상

`overrideProvider()` 외에 아래 메서드도 동일하게 체이닝할 수 있다.

| 메서드 | 대상 |
|---|---|
| `overrideModule()` | 모듈 자체(`.useModule()`) |
| `overrideGuard()` | Guard |
| `overrideInterceptor()` | Interceptor |
| `overrideFilter()` | Exception Filter |
| `overridePipe()` | Pipe |

Guard·Interceptor 등 컴포넌트 정의는 [[nestjs-request-pipeline]] 참고.

### 3.2. 전역 등록된 컴포넌트 오버라이드

`APP_GUARD` 등 토큰으로 전역 등록한 컴포넌트는([[nestjs-request-pipeline]] §2) 프로덕션 코드에서 `useClass`로 등록하면 테스트에서 교체할 수 없다 — `useExisting`으로 바꾸고 클래스 자체를 `providers`에 추가해야 `overrideProvider()`가 먹힌다.

```typescript
// app.module.ts — 테스트 가능하도록 등록
providers: [
  { provide: APP_GUARD, useExisting: JwtAuthGuard },
  JwtAuthGuard,
],
```

```typescript
// 테스트
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

### 3.3. 자동 목킹

의존성이 많은 클래스를 테스트할 때 `useMocker()`로 누락된 provider 전체에 mock 팩토리를 적용할 수 있다.

```typescript
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
})
  .useMocker((token) => {
    if (token === CatsService) {
      return { findAll: jest.fn().mockResolvedValue(['test']) };
    }
  })
  .compile();
```

## 4. e2e 테스트

`test/` 디렉터리에 `*.e2e-spec.ts`로 작성하고, `supertest`로 실제 HTTP 요청을 시뮬레이션한다([[nestjs]] §3.1). `createNestApplication()`으로 전체 애플리케이션을 부트스트랩한 뒤 `init()`을 호출해야 한다.

```typescript
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
```

Fastify 어댑터([[nestjs]] §1.4)를 쓰면 `app.getHttpServer()` 대신 `app.getHttpAdapter().getInstance()`를 `ready()`한 뒤 `app.inject({ method, url })`로 요청한다.

## 5. 요청 스코프 Provider 테스트

요청마다 새로 생성되는 스코프 provider는 `moduleRef.get()`으로 조회할 수 없다. `ContextIdFactory.create()`로 컨텍스트 ID를 만들고 `moduleRef.resolve(토큰, contextId)`로 그 컨텍스트에 속한 인스턴스를 가져온다.

```typescript
const contextId = ContextIdFactory.create();
jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);
catsService = await moduleRef.resolve(CatsService, contextId);
```

## 6. 설정

### 6.1. package.json의 jest 필드

단위 테스트 설정은 최상위 `package.json`의 `jest` 필드에 있다(별도 설정 파일이 아님).

```json
"jest": {
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

e2e 테스트는 별도 파일 `test/jest-e2e.json`을 쓰며, `test:e2e` 스크립트가 `--config` 옵션으로 이를 가리킨다([[nestjs]] §4).

```json
{
  "rootDir": ".",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

### 6.2. 테스트 스크립트

| 스크립트 | 명령 | 역할 |
|---|---|---|
| `test` | `jest` | 단위 테스트 1회 실행 |
| `test:watch` | `jest --watch` | watch 모드 |
| `test:cov` | `jest --coverage` | 커버리지 리포트 포함 실행 |
| `test:debug` | `node --inspect-brk ... jest --runInBand` | Node 디버거 연결 실행 |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | e2e 테스트 |

CLI로 컨트롤러·서비스를 생성하면(`nest g controller/service`, [[nestjs]] §4) `.spec.ts` 파일이 함께 생성된다.

---

## Sources

- NestJS Docs — Testing: https://docs.nestjs.com/fundamentals/testing
- `@nestjs/cli@11` `nest new` 실행 결과(package.json `jest` 필드, `test/jest-e2e.json`, `app.controller.spec.ts`, `test/app.e2e-spec.ts` 확인)

---

## Related pages

- [[nestjs]] — 프로젝트 구조, 스크립트
- [[nestjs-dependency-injection]] — Provider, 토큰, overrideProvider 기본 사용법
- [[nestjs-request-pipeline]] — Guard·Pipe·Interceptor·Exception Filter, 전역 등록(APP_*)
