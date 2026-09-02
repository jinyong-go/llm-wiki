---
title: NestJS Config
updated: 2026-08-21 15:38:05
tags:
  - nodejs
  - nestjs
  - configuration
---

## 1. 개요

Node.js 애플리케이션은 환경변수(`process.env`)로 설정을 구성하는 것이 관례([12-Factor](https://12factor.net/config))다. 환경마다 `.env` 파일을 스왑하는 방식이 일반적이며, NestJS는 이를 위해 `@nestjs/config` 패키지를 공식 제공한다. 내부적으로 [dotenv](https://github.com/motdotla/dotenv)로 `.env` 파일을 파싱하므로, 직접 `dotenv`를 설치·호출할 필요는 없다.

```bash
npm i --save @nestjs/config
```

---

## 2. 설치와 등록

### 2.1. ConfigModule.forRoot()

루트 모듈에서 `ConfigModule.forRoot()`를 호출하면 프로젝트 루트의 `.env` 파일을 읽어 `process.env`의 값과 병합하고, 그 결과를 `ConfigService`가 제공하도록 등록한다.

```typescript
@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

```
DATABASE_USER=test
DATABASE_PASSWORD=test
```

**우선순위**: 같은 키가 OS 환경변수(`export DATABASE_USER=...`)와 `.env` 파일 양쪽에 있으면 **런타임 환경변수가 우선**한다(dotenv 규칙).

### 2.2. 커스텀 .env 경로

```typescript
ConfigModule.forRoot({ envFilePath: '.development.env' });

// 여러 경로 — 먼저 매칭된 파일의 값이 우선
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

### 2.3. 전역 등록과 .env 비활성화

```typescript
ConfigModule.forRoot({
  isGlobal: true,     // 다른 모듈에서 매번 import 하지 않아도 ConfigService 사용 가능
  ignoreEnvFile: true, // .env 파일을 읽지 않고 런타임 환경변수만 사용
});
```

---

## 3. ConfigService로 값 읽기

### 3.1. 기본 사용

`isGlobal: true`가 아니라면 사용하는 모듈에 `ConfigModule`을 import해야 한다.

```typescript
constructor(private configService: ConfigService) {}

const dbUser = this.configService.get<string>('DATABASE_USER');
const dbHost = this.configService.get<string>('database.host', 'localhost'); // 기본값 지정
```

제네릭으로 환경변수 인터페이스를 지정하면 존재하지 않는 키 접근을 컴파일 타임에 막고(`infer: true`) 타입도 추론된다.

```typescript
interface EnvironmentVariables {
  PORT: number;
}

constructor(private configService: ConfigService<EnvironmentVariables, true>) {
  const port = this.configService.get('PORT', { infer: true }); // number
}
```

### 3.2. 커스텀 설정 팩토리 함수

단순 키-값을 넘어 중첩 객체·타입 변환·기본값이 필요하면, 설정 객체를 반환하는 팩토리 함수를 `load`로 등록한다.

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
});
```

```typescript
ConfigModule.forRoot({ load: [configuration] });
```

YAML 등 다른 포맷도 팩토리 함수 안에서 직접 파싱하면 동일하게 쓸 수 있다(`js-yaml` 등). 단, `load`로 불러온 커스텀 설정은 `validationSchema`로 **자동 검증되지 않는다** — 검증이 필요하면 팩토리 함수 안에서 직접 처리해야 한다.

### 3.3. 네임스페이스 (registerAs)

관련 설정을 그룹으로 묶고 타입을 지정해 주입하려면 `registerAs()`를 쓴다.

```typescript
// config/database.config.ts
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432,
}));
```

```typescript
const dbHost = this.configService.get<string>('database.host'); // dot notation

// 또는 네임스페이스를 직접 타입 주입
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

### 3.4. forRoot와 forFeature

`forRoot()`/`forFeature()`는 `@nestjs/config`만의 API가 아니라, 설정이 필요한 동적 모듈([[nestjs-modules]] §5)에서 널리 쓰이는 관례다(`TypeOrmModule`, `MongooseModule` 등도 같은 패턴을 따른다).

| | `forRoot()` | `forFeature()` |
|---|---|---|
| 호출 위치 | 루트 모듈(`AppModule`)에서 보통 **한 번** | 필요한 각 기능 모듈에서 **여러 번** 가능 |
| 역할 | 모듈 전체의 동작 방식을 설정("how") — 연결 방식, 로딩 방식 등 | 이미 구성된 모듈에 특정 기능 단위 리소스를 추가 등록("what") |
| `@nestjs/config`에서 | `.env` 경로, 검증 스키마, 전역 여부 등 `ConfigModule` 자체를 구성 | `registerAs()`로 만든 네임스페이스 설정 객체 하나를 해당 기능 모듈의 provider로 등록 |

`ConfigModule.forFeature()`는 루트의 `load` 배열에 모든 설정 파일을 몰아 등록하는 대신, 기능별 설정을 그 기능 모듈 안에서 지역적으로 등록하고 싶을 때 쓴다. `forRoot()`가 이미 처리한 `.env` 로딩·검증을 다시 수행하지 않고, 그 위에 네임스페이스 provider 하나를 추가할 뿐이다.

```typescript
// database.config.ts
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
}));
```

```typescript
// database.module.ts — DatabaseModule에서만 필요한 설정을 로컬로 등록
@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

모듈 초기화 순서는 보장되지 않으므로, `forFeature()`로 등록한 값을 다른 모듈이 생성자에서 즉시 읽으면 그 값을 등록한 모듈이 아직 초기화되지 않았을 수 있다. 이 경우 생성자 대신 `onModuleInit()` 훅에서 읽어야 안전하다.

---

## 4. 검증

필수 환경변수 누락이나 잘못된 값은 **부트스트랩 시점에 예외를 던져** 막는 것이 권장된다.

### 4.1. Joi 스키마

```bash
npm install --save joi
```

```typescript
ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().port().default(3000),
  }),
});
```

기본적으로 스키마에 없는 키는 허용(`allowUnknown: true`)되고, 모든 에러를 모아서 보고(`abortEarly: false`)한다. `validationOptions`로 재정의할 수 있다.

### 4.2. 커스텀 validate 함수

`class-validator`/`class-transformer`로 검증하려면 동기 함수를 직접 작성해 전달한다.

```typescript
export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(errors.toString());
  return validated;
}
```

```typescript
ConfigModule.forRoot({ validate });
```

두 방식 모두 검증 실패 시 애플리케이션 부트스트랩 자체가 중단된다.

---

## 5. 부트스트랩 설정 (main.ts, 포트 등)

`ConfigService`는 다른 provider와 마찬가지로 **DI 컨테이너를 통해서만** 얻을 수 있다. `main.ts`의 `bootstrap()`은 `NestFactory.create(AppModule)`로 애플리케이션 인스턴스를 만든 **이후**에야 `app.get(ConfigService)`로 조회할 수 있다 — `forRoot()`가 포트 값을 직접 설정해주는 것이 아니라, `forRoot()`는 `ConfigModule`이 `.env`를 어떻게 읽을지(경로·검증·전역 여부)를 구성할 뿐이다.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
}
bootstrap();
```

### 5.1. app 생성 이전에 값이 필요한 경우

`NestFactory.create()` 호출 전에는 DI 컨테이너 자체가 없으므로 `ConfigService`를 쓸 수 없다. 대표적으로 `NestFactory.createMicroservice()`에 넘길 옵션(포트, 트랜스포트 등)이 여기 해당한다. 이때는 아래 방법 중 하나를 쓴다.

**(1) `process.env`를 직접 읽는다** — `.env`가 이미 로드되어 있어야 한다.

```bash
nest start --env-file .env
```

```typescript
// main.ts — Nest 앱 인스턴스 생성 전이라 ConfigService가 아직 없음
async function bootstrap() {
  const port = Number(process.env.PORT ?? 3000);

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { port },
  });

  await app.listen();
}
bootstrap();
```

`--env-file`은 Node.js 20+ 네이티브 옵션을 Nest CLI가 그대로 노출한 것으로, Nest가 부트스트랩되기 전에 `.env` 값을 `process.env`에 채워 넣는다.

**(2) `ConfigModule.envVariablesLoaded` 훅을 기다린다** — 특히 `AppModule`의 `imports` 배열 자체를 환경변수 값에 따라 동적으로 결정해야 할 때 쓴다(모듈 그래프 구성 시점이라 `app` 인스턴스보다도 먼저 필요).

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

이 두 방법은 `ConfigService`의 타입 추론·기본값·검증 결과(§4)를 거치지 않고 `process.env`를 원시 그대로 읽는다는 공통점이 있다 — `.env` 파싱 자체(dotenv)는 이미 끝난 상태이지만, `@nestjs/config`가 제공하는 부가 기능은 아직 적용되지 않은 값이다.

---

## 6. 기타 옵션

- **변수 확장** — `expandVariables: true`로 `.env` 내부에서 다른 변수를 참조(`SUPPORT_EMAIL=support@${APP_URL}`, `dotenv-expand` 기반)
- **캐시** — `cache: true`로 `ConfigService#get`이 매번 `process.env`를 조회하지 않고 캐시된 값을 사용
- **커스텀 getter** — `ConfigService`를 감싸는 서비스에 `get isAuthEnabled()`처럼 의미 있는 이름의 getter를 추가해 가독성 개선
- **ConditionalModule** — 환경변수 값에 따라 특정 모듈을 조건부로 로드(`ConditionalModule.registerWhen(FooModule, 'USE_FOO')`)

---

## 7. Spring 설정과 비교

| 항목 | Spring Boot | NestJS(`@nestjs/config`) |
|---|---|---|
| 설정 파일 | `application.properties`/`.yml` (+ profile별 파일) | `.env`(dotenv) 또는 커스텀 팩토리 함수(JS/YAML 등 임의 포맷) |
| 소스 우선순위 | 15단계 `PropertySource`([[externalized-configuration]]) | 런타임 환경변수 > `.env` 파일(여러 경로 지정 시 첫 매칭이 우선) |
| 단일 값 접근 | `@Value("${key}")`(SpEL 가능) | `configService.get('KEY')` |
| 그룹·타입 바인딩 | `@ConfigurationProperties`([[configuration-properties]]: relaxed binding, 불변 record) | `registerAs()` 네임스페이스 + `@Inject(config.KEY)`로 타입 지정 주입 |
| 검증 | `@Validated` + JSR-303, 실패 시 시작 중단 | Joi 스키마 또는 custom `validate()`, 실패 시 부트스트랩 중단 |
| 등록 범위 | 단일 전역 `Environment` | 모듈 캡슐화가 기본, `isGlobal: true`로 전역화 |
| 프로파일 전환 | `spring.profiles.active`, `application-{profile}.yml` 내장 메커니즘 | 내장 프로파일 개념 없음. `envFilePath` 배열이나 `NODE_ENV` 분기로 직접 구현 |
| 부트스트랩 이전 값 | JVM `-D`, CLI 인자 등 애플리케이션 시작 전 이미 로드됨 | `ConfigService`는 `app` 생성 후에만 사용 가능. 그 이전에는 `process.env` 직접 참조 필요([§5.1](#51-app-생성-이전에-값이-필요한-경우)) |

가장 큰 차이는 **설정 접근 시점**이다. Spring은 `Environment`/`@ConfigurationProperties`가 애플리케이션 컨텍스트 초기화 이전부터 사용 가능한 경우가 많은 반면, NestJS의 `ConfigService`는 다른 provider와 동일하게 DI 그래프의 일부이므로 `NestFactory.create()` 호출 **이후**에야 꺼내 쓸 수 있다. 또한 Spring은 프로파일(`spring.profiles.active`) 전환이 프레임워크에 내장되어 있지만, NestJS는 이를 제공하지 않고 `.env` 파일 경로 선택이나 `NODE_ENV` 분기를 직접 구현해야 한다.

---

## Sources

- NestJS Docs — Configuration: https://docs.nestjs.com/techniques/configuration
- Spring Boot Docs — Externalized Configuration: https://docs.spring.io/spring-boot/reference/features/external-config.html

---

## Related pages

- [[nestjs]] — NestJS 개요, 플랫폼, 데코레이터
- [[nestjs-modules]] — 모듈 캡슐화, 공유, 전역·동적 모듈
- [[nestjs-dependency-injection]] — Provider, 토큰, 커스텀 프로바이더
- [[configuration-properties]] — Spring `@ConfigurationProperties`
- [[externalized-configuration]] — Spring PropertySource 우선순위
