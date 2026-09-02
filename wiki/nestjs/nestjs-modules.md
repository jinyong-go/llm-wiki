---
title: NestJS 모듈
updated: 2026-08-21 15:02:38
tags:
  - nodejs
  - nestjs
  - module
---

## 1. 개요

모듈은 `@Module()` 데코레이터가 붙은 클래스로, Nest가 애플리케이션 구조를 조직하는 단위다. 모든 Nest 애플리케이션은 최소 하나의 루트 모듈을 가지며, 이를 시작점으로 provider·모듈 간 관계를 나타내는 애플리케이션 그래프를 구성한다.

| 필드 | 설명 |
|---|---|
| `providers` | Nest 인젝터가 인스턴스화할 provider. 최소 이 모듈 내에서 공유됨 |
| `controllers` | 이 모듈에 속한, 인스턴스화되어야 할 컨트롤러 |
| `imports` | 이 모듈이 필요로 하는 provider를 export하는 다른 모듈 목록 |
| `exports` | 이 모듈의 `providers` 중 다른(이 모듈을 import하는) 모듈에 공개할 대상. provider 자체 또는 토큰만 지정 가능 |

모듈은 기본적으로 provider를 **캡슐화**한다. 즉 현재 모듈에 속하거나, import한 모듈이 명시적으로 export한 provider만 주입받을 수 있다. export된 provider는 사실상 그 모듈의 공개 API 역할을 한다.

---

## 2. Feature 모듈

서로 관련된 컨트롤러와 서비스를 하나의 모듈로 묶어 도메인 경계를 명확히 한다.

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

```typescript
@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

CLI로 생성하려면 `nest g module cats`를 실행한다.

---

## 3. 공유와 재노출

### 3.1. Provider 공유

모듈은 기본적으로 **싱글턴**이므로, 같은 모듈 인스턴스를 여러 곳에서 재사용하면 그 안의 provider 인스턴스도 함께 공유된다. `CatsService`를 다른 모듈들과 공유하려면 `exports` 배열에 추가한다.

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

이제 `CatsModule`을 import하는 모든 모듈이 **동일한** `CatsService` 인스턴스를 공유한다. 반대로 여러 모듈이 각자 `providers`에 `CatsService`를 직접 등록하면, 모듈마다 별도의 인스턴스가 생겨 메모리 낭비와 상태 불일치(그 서비스가 내부 상태를 갖는 경우)로 이어질 수 있다.

### 3.2. 모듈 재노출

import한 모듈을 그대로 `exports`에 포함시키면, 그 모듈을 다시 export할 수 있다.

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

`CoreModule`을 import하는 모듈은 `CommonModule`을 직접 import하지 않아도 그 안의 export된 provider를 쓸 수 있다.

---

## 4. 전역 모듈

여러 모듈에서 반복적으로 import해야 하는 provider(설정, DB 커넥션 등)는 `@Global()`로 전역 등록할 수 있다.

```typescript
@Global()
@Module({
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

전역 모듈은 **한 번만**(보통 루트 모듈에서) 등록해야 하며, 등록 이후에는 다른 모듈이 `imports` 없이 바로 `CatsService`를 주입받을 수 있다. 다만 전역화는 모듈 간 결합을 숨기므로, 공식 문서는 대부분의 경우 `imports`로 명시적 관계를 유지할 것을 권장한다.

---

## 5. 동적 모듈

런타임 옵션에 따라 provider 구성이 달라지는 모듈은 `static` 메서드가 `DynamicModule`을 반환하는 형태로 만든다.

```typescript
@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

```typescript
@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

`DynamicModule`이 반환하는 필드는 `@Module()` 데코레이터에 정적으로 선언된 메타데이터를 **덮어쓰지 않고 확장**한다 — 그래서 정적으로 선언한 `Connection`과 `forRoot()`가 동적으로 만든 provider가 함께 export된다. 전역 스코프로 등록하려면 반환 객체에 `global: true`를 추가한다. 재노출 시에는 `exports`에 `DatabaseModule.forRoot(...)` 호출 없이 `DatabaseModule`만 넣으면 된다. 더 정교한 동적 모듈 작성에는 `ConfigurableModuleBuilder`를 쓸 수 있다.

---

## 6. 모듈에서의 DI

모듈 클래스 자신도 생성자로 provider를 주입받을 수 있다(설정 초기화 등에 활용).

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
```

다만 모듈 클래스 자체는 provider로 주입될 수 없다 — 순환 의존성 문제 때문이다([[nestjs-dependency-injection]] §6).

---

## Sources

- NestJS Docs — Modules: https://docs.nestjs.com/modules

---

## Related pages

- [[nestjs]] — NestJS 개요, 플랫폼, 데코레이터
- [[nestjs-dependency-injection]] — Provider, 토큰, 커스텀 프로바이더, 순환 의존성
