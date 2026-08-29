---
title: NestJS 의존성 주입
updated: 2026-08-24 17:13:30
tags:
  - nodejs
  - nestjs
  - di
  - decorator
---

## 1. 개요

NestJS의 DI는 **Provider**와 **IoC 컨테이너** 개념으로 동작한다. 서비스·리포지터리 등 대부분의 클래스가 provider가 될 수 있으며, `@Injectable()`을 붙이면 해당 클래스가 Nest IoC 컨테이너의 관리(인스턴스화·캐싱·주입) 대상이 된다.

```typescript
@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];
  findAll(): Cat[] { return this.cats; }
}
```

---

## 2. 데코레이터 기반 주입

### 2.1. 토큰과 등록

컨테이너 내부는 개념적으로 `{ 토큰: 인스턴스 }` 형태의 맵이다. **토큰(token)**은 컨테이너가 provider를 찾는 키이고, 생성자에서 타입이나 `@Inject(token)`으로 의존성을 요청하면 컨테이너가 같은 토큰으로 등록된 provider를 찾아 그 인스턴스를 반환한다.

DI가 성립하려면 세 단계가 필요하다.

1. **선언** — `@Injectable()`로 컨테이너 관리 대상 표시
2. **요청** — 소비자가 생성자에서 타입으로 의존성을 선언
3. **등록** — 모듈의 `providers` 배열에 추가해 토큰과 구현체를 연결

```typescript
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}
}
```

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

`providers: [CatsService]`는 아래 표준 형식의 축약이다.

```typescript
providers: [{ provide: CatsService, useClass: CatsService }]
```

`provide`가 토큰이고, `useClass`(또는 `useValue`/`useFactory`/`useExisting`, [§3](#3-의존성-교체-커스텀-프로바이더))가 그 토큰에 대해 컨테이너가 실제로 무엇을 반환할지 정의한다. `providers: [CatsService]` 축약형은 "`CatsService`라는 토큰에 `CatsService` 클래스 자신을 연결하라"는 의미다. 토큰은 클래스뿐 아니라 문자열·`Symbol`·추상 클래스도 될 수 있다([§2.4](#24-비클래스-토큰)).

컨테이너는 `CatsController`를 생성할 때 의존성을 분석해 `CatsService` 토큰을 조회하고, 기본 스코프(싱글턴)면 캐시된 인스턴스를 반환하거나 새로 생성한다. 분석은 전이적(transitive)이라 `CatsService`가 다시 다른 provider에 의존하면 그것도 함께 해석된다.

### 2.2. 프로퍼티 기반 주입

생성자 대신 프로퍼티에 `@Inject()`를 붙여 주입받을 수 있다. 상위 클래스를 상속하면서 `super()`로 의존성을 계속 전달하기 번거로운 경우에 쓴다.

```typescript
@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

클래스가 다른 클래스를 상속하지 않는 한, 필요한 의존성이 시그니처에 드러나는 **생성자 기반 주입이 권장**된다.

### 2.3. 선택적 의존성

기본값으로 대체 가능한 의존성은 `@Optional()`로 표시한다. 미등록 시 에러 대신 `undefined`가 주입된다.

```typescript
@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

### 2.4. 비클래스 토큰

토큰은 클래스명이 아니어도 된다. 문자열·`Symbol`·enum을 토큰으로 쓰고 `@Inject(token)`으로 주입받는다.

```typescript
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
```

TypeScript **인터페이스**는 컴파일 시 소거되어 런타임 토큰으로 쓸 수 없으므로, 인터페이스 기반 의존성은 별도의 문자열/`Symbol` 토큰을 정의해 연결해야 한다. 반면 **추상 클래스**는 런타임에 존재하므로 그 자체를 토큰 겸 타입으로 쓸 수 있고, 이 경우 `@Inject()` 없이 생성자 타입만으로 주입된다.

```typescript
export abstract class LoggerService {
  abstract log(message: string): void;
}

@Injectable()
export class PinoLoggerService implements LoggerService {
  log(message: string) { /* ... */ }
}

@Module({
  providers: [{ provide: LoggerService, useClass: PinoLoggerService }],
})
export class AppModule {}
```

---

## 3. 의존성 교체: 커스텀 프로바이더

표준 provider(`useClass`, 클래스 자신을 토큰으로 등록) 외에, 토큰에 대한 등록 자체를 교체하는 4가지 방식이 있다.

| 방식 | 값의 출처 | 새 인스턴스 생성 |
|---|---|---|
| `useValue` | 이미 만들어진 값 | 아니오 |
| `useClass` | 지정한 클래스 | 예(DI 컨테이너가 생성) |
| `useFactory` | 함수의 반환값 | 함수 내부에서 결정 |
| `useExisting` | 기존 토큰의 인스턴스 | 아니오(공유) |

### 3.1. useValue

이미 만들어진 값(리터럴 객체, 클래스 인스턴스, 외부 라이브러리 인스턴스, 상수)을 그대로 토큰에 연결한다. 컨테이너가 별도로 인스턴스화하지 않고 제공한 값을 그대로 반환하므로 항상 동일한 참조가 재사용된다. TypeScript의 구조적 타이핑 덕분에 원래 클래스와 같은 인터페이스를 가진 객체라면 무엇이든 대체할 수 있어, 테스트에서 실제 서비스를 mock 객체로 바꿔치기할 때 가장 많이 쓰인다.

```typescript
const mockCatsService = { findAll: () => [] };

@Module({
  providers: [{ provide: CatsService, useValue: mockCatsService }],
})
export class AppModule {}
```

### 3.2. useClass

토큰이 가리킬 **클래스**를 동적으로 결정한다. `useValue`와 달리 지정한 클래스를 컨테이너가 직접 인스턴스화하므로, 그 클래스 자신이 생성자에 의존성을 선언하면 정상적으로 주입받는다(DI 체인이 계속 이어진다). 환경별로 다른 구현을 등록하고 싶을 때 쓴다.

```typescript
const configServiceProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development'
    ? DevelopmentConfigService
    : ProductionConfigService,
};

@Module({ providers: [configServiceProvider] })
export class AppModule {}
```

`ConfigService`라는 토큰으로 주입을 요청하는 모든 소비자는, `@Injectable()`이 붙은 기본 `ConfigService` 구현이 아니라 이 provider가 지정한 클래스의 인스턴스를 받는다.

### 3.3. useFactory

토큰에 대해 반환할 값을 **함수**로 계산한다. 팩토리 함수는 인자 없이 단순 값을 반환할 수도 있고, `inject` 배열에 다른 provider의 토큰을 나열해 그 인스턴스들을 인자로 받아 계산에 사용할 수도 있다 — `inject`와 팩토리 함수 인자는 순서대로 1:1 대응한다. 비동기 함수(Promise 반환)도 허용되어, 외부 리소스 연결처럼 초기화에 비동기 작업이 필요한 provider에 적합하다.

```typescript
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: MyOptionsProvider) => {
    return new DatabaseConnection(optionsProvider.get());
  },
  inject: [MyOptionsProvider],
};

@Module({
  providers: [connectionProvider, MyOptionsProvider],
})
export class AppModule {}
```

`inject`의 각 항목은 `{ token, optional: true }` 형태로 선택적 의존성으로 표시할 수도 있다. 서비스가 아닌 임의의 값(환경별 설정 객체 등)을 제공하는 데도 쓸 수 있다.

### 3.4. useExisting

이미 등록된 provider에 대한 **별칭 토큰**을 만든다. `useClass`가 새 인스턴스를 만드는 것과 달리, `useExisting`은 기존 토큰이 가리키는 인스턴스를 그대로 재사용한다 — 두 토큰이 같은 싱글턴 인스턴스를 공유한다. 같은 provider를 서로 다른 이름(문자열 토큰과 클래스 토큰 등)으로 여러 곳에서 참조해야 할 때 쓴다.

```typescript
@Injectable()
class LoggerService {}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

`LoggerService` 토큰과 `'AliasedLoggerService'` 토큰 모두, 싱글턴 스코프라면 동일한 인스턴스로 해석된다.

### 3.5. 테스트에서 교체

`@nestjs/testing`의 `Test.createTestingModule()`은 `overrideProvider()`로 실제 모듈 그래프를 바꾸지 않고 provider만 갈아끼울 수 있다.

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [CatsModule],
})
  .overrideProvider(CatsService)
  .useValue({ findAll: () => ['test'] })
  .compile();
```

`useClass`/`useValue`/`useFactory` 세 방식 모두 지원하며, 같은 패턴으로 `overrideGuard()`/`overrideInterceptor()`/`overrideFilter()`/`overridePipe()`도 제공한다. 상세는 [[nestjs-testing]] 참고.

---

## 4. 모듈 범위와 공개

Provider는 선언된 모듈에 **캡슐화**되는 것이 기본이라, 다른 모듈에서 주입받으려면 그 모듈이 `exports`에 포함해야 하고 사용하는 쪽은 `imports`로 가져와야 한다. 같은 provider를 여러 모듈이 각자 `providers`에 등록하면, 모듈마다 별도의 인스턴스가 생겨 상태 불일치·메모리 낭비로 이어질 수 있다 — export/import를 통한 공유가 원칙이다.

```typescript
@Module({
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

`exports`의 세부 규칙, 전역 모듈(`@Global()`), 동적 모듈은 [[nestjs-modules]]에서 다룬다.

---

## 5. Provider Scope

| Scope | 동작 |
|---|---|
| `DEFAULT`(기본) | 애플리케이션 전체에서 공유되는 싱글턴. 부트스트랩 시 1회 생성 |
| `REQUEST` | 요청마다 새 인스턴스 생성, 요청 종료 후 GC |
| `TRANSIENT` | 주입받는 소비자마다 매번 새 인스턴스 생성(공유 안 함) |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

Node.js는 요청마다 스레드를 분리하지 않으므로 대부분 싱글턴으로 충분하며 성능상으로도 권장된다. 요청 단위 캐싱·추적·멀티테넌시 같은 예외적 상황에서만 `REQUEST`를 고려한다.

---

## 6. 순환 의존성

두 provider(또는 모듈)가 서로 의존하면 컨테이너가 메타데이터를 확정할 수 없어 인스턴스화에 실패한다. `forwardRef()`로 양쪽 모두에서 상대를 지연 참조하면 해결된다.

```typescript
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
```

모듈 간 순환 참조도 동일하게 양쪽 `imports`에 `forwardRef()`를 적용해 해결한다. 인스턴스화 순서는 보장되지 않으므로 어느 쪽 생성자가 먼저 호출되는지에 코드가 의존하면 안 된다. 대안으로 `ModuleRef` 클래스를 이용해 필요한 시점에 provider를 수동 조회하는 방법도 있다.

---

## 7. Spring DI와 비교

| 항목 | Spring([[dependency-injection]]) | NestJS |
|---|---|---|
| 컨테이너 등록 | 컴포넌트 스캔(`@Component`/`@Service`) 또는 `@Configuration`의 `@Bean` | 모듈의 `providers` 배열에 명시적 등록 |
| 컨테이너 범위 | 단일 `ApplicationContext`, 기본적으로 전체 공개 | 모듈 단위 캡슐화, `exports`로 명시해야 다른 모듈에 공개 |
| 기본 주입 방식 | 생성자 권장, Setter는 선택적 의존성용, 필드 주입 비권장 | 생성자 권장, 프로퍼티 주입(`@Inject`)은 상속 시에만 |
| 토큰 해석 | 타입 기반, 후보가 여럿이면 `@Qualifier`/빈 이름으로 구분 | 타입(클래스) 또는 명시적 토큰(문자열/`Symbol`/추상 클래스) |
| 의존성 교체 | `@Primary`, `@Profile`, `@Qualifier`로 여러 빈 후보 중 선택 | `useClass`/`useFactory`/`useValue`/`useExisting`으로 토큰의 등록 자체를 교체 |
| 스코프 | singleton(기본)/prototype/request/session 등 | `DEFAULT`(싱글턴, 기본)/`REQUEST`/`TRANSIENT` |
| 순환 의존성 | 생성자 주입 시 `BeanCurrentlyInCreationException`으로 즉시 감지, 재설계 권장 | `forwardRef()`로 공식 지원, 재설계가 어려운 경우 사용 |
| 선택적 의존성 | `@Autowired(required=false)`, `Optional<T>`, `@Nullable` | `@Optional()` |

가장 큰 구조적 차이는 **컨테이너 범위**다. Spring은 하나의 `ApplicationContext`에 등록된 빈이 기본적으로 어디서나 보이는 반면, NestJS는 provider가 선언된 모듈에 캡슐화되고 `exports`/`imports`로 명시해야 공유된다 — Spring이 전역 공개를 기본값으로 두고 필요 시 제한하는 쪽이라면, NestJS는 기본적으로 격리하고 필요 시 공개하는 쪽이다.

**의존성 교체** 방식도 접근이 다르다. Spring은 같은 타입의 빈 후보를 여러 개 등록해두고 `@Primary`/`@Qualifier`/`@Profile`로 그중 하나를 **선택**하는 모델이다. NestJS는 후보를 여러 개 두지 않고, 토큰 하나에 대한 등록 자체를 `useClass`/`useFactory` 등으로 **교체**하는 모델이다. 그래서 NestJS에는 Spring의 `@Primary`/`@Qualifier`에 대응하는 별도 개념이 없다 — 같은 타입을 여러 구현으로 구분해야 하면 애초에 서로 다른 토큰(문자열/`Symbol`)으로 등록한다.

**순환 의존성**에 대한 태도도 다르다. Spring은 생성자 주입에서 이를 설계 결함 신호로 보고 즉시 예외를 던져 재설계를 유도한다. NestJS는 `forwardRef()`라는 공식 API로 우회 경로를 제공한다.

---

## Sources

- NestJS Docs — Providers: https://docs.nestjs.com/providers
- NestJS Docs — Custom providers: https://docs.nestjs.com/fundamentals/custom-providers
- NestJS Docs — Injection scopes: https://docs.nestjs.com/fundamentals/injection-scopes
- NestJS Docs — Circular dependency: https://docs.nestjs.com/fundamentals/circular-dependency
- NestJS Docs — Testing: https://docs.nestjs.com/fundamentals/testing
- Spring Framework — Dependency Injection: https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html

---

## Related pages

- [[nestjs]] — NestJS 개요, 플랫폼, 데코레이터
- [[nestjs-modules]] — 모듈 캡슐화, 공유, 전역·동적 모듈
- [[nestjs-testing]] — Jest 기반 테스트, Mock 교체 상세
- [[dependency-injection]] — Spring 의존성 주입 방식
