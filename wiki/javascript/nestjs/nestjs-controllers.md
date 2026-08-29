---
title: NestJS 컨트롤러 데코레이터
updated: 2026-08-24 15:04:05
tags:
  - nodejs
  - nestjs
  - decorator
---

## 1. 개요

`@Controller(prefix?)`는 HTTP 요청을 처리할 클래스를 지정한다. 실제 라우트 경로는 이 prefix와 메서드 데코레이터(`@Get()` 등)에 지정한 경로를 결합해 정해진다.

```typescript
@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
```

`@Controller()`는 `host` 옵션으로 서브도메인 라우팅도 지원한다. 호스트명에도 경로 파라미터처럼 토큰을 쓸 수 있고, `@HostParam()`으로 값을 꺼낸다.

```typescript
@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get()
  getInfo(@HostParam('account') account: string) {
    return account;
  }
}
```

CLI로 생성하려면 `nest g controller cats`를 실행한다.

컨트롤러 클래스를 정의하는 것만으로는 부족하다 — 모듈의 `controllers` 배열에 등록해야 Nest가 인스턴스화한다([[nestjs-modules]]).

---

## 2. HTTP 메서드 데코레이터

`@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, `@Head()`가 표준 HTTP 메서드에 대응하며, `@All()`은 모든 메서드를 한 핸들러로 처리한다. 각 데코레이터는 경로 인자를 받는다 — 문자열 하나(`@Get(':id')`)뿐 아니라 문자열 배열도 가능해, 서로 다른 여러 경로를 같은 핸들러로 매핑할 수 있다(`@Get(['cats', 'dogs'])`). 경로 외 별도 옵션은 없으며, 상태 코드·헤더·리다이렉트는 아래처럼 전용 데코레이터로 다룬다.

### 2.1. 상태 코드·헤더·리다이렉트

```typescript
@Post()
@HttpCode(204)
@Header('Cache-Control', 'no-store')
create() { /* ... */ }
```

- 기본 상태 코드는 GET 등 200, POST만 201 — `@HttpCode()`로 변경
- `@Header(key, value)`로 커스텀 응답 헤더 지정
- `@Redirect(url?, statusCode?)`(기본 302)로 리다이렉트. 핸들러가 `{ url, statusCode }` 형태의 객체를 반환하면 데코레이터 인자보다 그 반환값이 우선한다(동적 리다이렉트)

### 2.2. 라우트 와일드카드

경로 끝에 `*`를 붙이면 그 뒤 임의의 문자열에 매치된다(`abcd/*` → `abcd/`, `abcd/123` 등). Express v5는 중간에 오는 와일드카드에 이름을 요구하지만(`abcd/*splat`), Nest의 Express 호환 계층 덕분에 이름 없는 `*`도 그대로 쓸 수 있다. Fastify는 경로 중간의 와일드카드를 지원하지 않는다.

---

## 3. 파라미터 데코레이터

| 데코레이터 | 대응 값 |
|---|---|
| `@Req()`, `@Request()` | `req` |
| `@Res()`, `@Response()` | `res`(*) |
| `@Next()` | `next` |
| `@Session()` | `req.session` |
| `@Param(key?)` | `req.params` / `req.params[key]` |
| `@Body(key?)` | `req.body` / `req.body[key]` |
| `@Query(key?)` | `req.query` / `req.query[key]` |
| `@Headers(key?)` | `req.headers` / `req.headers[key]` |
| `@Ip()` | `req.ip` |
| `@HostParam(key?)` | `req.hosts` |

대부분의 경우 `@Req()`로 원시 요청 객체를 받기보다, 아래처럼 목적이 분명한 전용 데코레이터를 쓴다.

### 3.1. @Param — 경로 파라미터

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  return `cat #${id}`;
}
```

인자 없이 `@Param()`만 쓰면 모든 경로 파라미터를 객체로 받는다(`params.id`). 파라미터가 있는 라우트는 정적 경로보다 **뒤에** 선언해야 정적 경로 요청을 가로채지 않는다.

### 3.2. @Body — 요청 본문과 DTO

바디 형태는 **DTO(Data Transfer Object) 클래스**로 정의한다. 인터페이스가 아니라 클래스를 쓰는 이유는, 인터페이스는 컴파일 시 소거되어 런타임에 타입 정보가 남지 않지만 클래스는 남기 때문이다 — Pipe가 검증·변환을 하려면 이 런타임 타입 정보(metatype)가 필요하다.

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

```typescript
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
```

### 3.3. @Query — 쿼리 파라미터

```typescript
@Get()
async findAll(@Query('age') age: number, @Query('breed') breed: string) {}
```

`GET /cats?age=2&breed=Persian` → `age=2`, `breed='Persian'`. `filter[where][name]=John`처럼 중첩·배열 형태의 복잡한 쿼리는 Express의 `extended` 쿼리 파서나 Fastify의 `querystringParser`(`qs` 패키지 등) 설정이 별도로 필요하다.

### 3.4. @Res / @Req — 라이브러리 전용 모드

핸들러 인자에 `@Res()`(또는 `@Response()`)를 쓰면 **라이브러리 전용 모드**로 전환된다. 이름 그대로 Nest의 표준 응답 처리(반환값 자동 직렬화, 기본 상태 코드 부여, 인터셉터의 응답 후처리 등)를 건너뛰고, Express/Fastify가 원래 제공하는 `res` 객체를 개발자가 직접 다루는 모드다. 이 모드에서는 `res.json(...)`이나 `res.send(...)`를 **직접 호출해 응답을 마쳐야** 하며, 아무 응답도 보내지 않으면 요청이 끝나지 않고 그대로 멈춘다(hang). 또한 코드가 특정 라이브러리(Express/Fastify)의 API에 직접 의존하게 되어 플랫폼 독립성([[nestjs]] §1.4)을 잃고, `@HttpCode()`/`@Header()`나 인터셉터의 응답 변형과도 호환되지 않는다.

`@Res({ passthrough: true })`를 쓰면 이 제약을 완화할 수 있다 — 쿠키·헤더 설정처럼 원시 `res` 객체가 필요한 일부만 직접 처리하고, 나머지(직렬화·상태 코드 등)는 계속 Nest 표준 방식에 맡긴다.

```typescript
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.status(HttpStatus.OK);
  return [];
}
```

---

## 4. 비동기 처리

핸들러는 `Promise`(`async`/`await`)와 RxJS `Observable` 반환을 모두 지원한다. `Observable`을 반환하면 Nest가 내부적으로 구독해 마지막 방출값을 응답으로 사용한다.

```typescript
@Get()
async findAll(): Promise<Cat[]> {
  return this.catsService.findAll();
}

@Get()
findAllStream(): Observable<Cat[]> {
  return this.catsService.findAllAsStream();
}
```

---

## 5. 요청 파이프라인 데코레이터

컨트롤러 주변에는 요청 흐름에 관여하는 컴포넌트가 더 있다: **Guard**, **Pipe**, **Interceptor**, **Exception Filter**. 각 컴포넌트는 정해진 인터페이스를 구현한 클래스로 작성하고, 전용 데코레이터로 컨트롤러 클래스나 핸들러 메서드에 적용한다. 상세는 각각 별도 문서에서 다룰 예정이며, 여기서는 개념과 적용 방법만 정리한다.

요청 처리 순서:

```
요청
 → Middleware           (전역 → 모듈)
 → Guard                (전역 → 컨트롤러 → 라우트)
 → Interceptor(진입 전)   (전역 → 컨트롤러 → 라우트)
 → Pipe                 (전역 → 컨트롤러 → 라우트 → 파라미터)
 → 컨트롤러 핸들러
 → Interceptor(이후)      (라우트 → 컨트롤러 → 전역)
 → Exception Filter*      (라우트 → 컨트롤러 → 전역)
응답
```

\* 처리되지 않은 예외가 발생했을 때만 개입한다.

### 5.1. Guard

요청을 라우트 핸들러로 넘길지 판단(인가)한다. `CanActivate` 인터페이스를 구현하고, `@UseGuards(...)`로 적용한다. 상세는 [[nestjs-request-pipeline]] 참고.

### 5.2. Pipe

핸들러 인자를 변환·검증한다. `PipeTransform` 인터페이스를 구현하고, `@UsePipes(...)`로 적용한다. 상세는 [[nestjs-request-pipeline]] 참고.

### 5.3. Interceptor

핸들러 전후 로직을 추가하고 반환값·예외를 변형한다. `NestInterceptor` 인터페이스를 구현하고, `@UseInterceptors(...)`로 적용한다. 상세는 [[nestjs-request-pipeline]] 참고.

### 5.4. Exception Filter

처리되지 않은 예외를 응답으로 변환한다. `@UseFilters(...)`로 적용하며, 필터 클래스 자체에는 어떤 예외를 처리할지 `@Catch(...)`로 지정한다. 상세는 [[nestjs-request-pipeline]] 참고.

---

## Sources

- NestJS Docs — Controllers: https://docs.nestjs.com/controllers
- NestJS Docs — Guards: https://docs.nestjs.com/guards
- NestJS Docs — Pipes: https://docs.nestjs.com/pipes
- NestJS Docs — Interceptors: https://docs.nestjs.com/interceptors
- NestJS Docs — Exception filters: https://docs.nestjs.com/exception-filters
- NestJS Docs — Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle

---

## Related pages

- [[nestjs]] — NestJS 개요, 플랫폼, 데코레이터
- [[nestjs-modules]] — 컨트롤러를 등록하는 모듈 구조
- [[nestjs-dependency-injection]] — Provider, 토큰
- [[nestjs-request-pipeline]] — Guard·Pipe·Interceptor·Exception Filter 상세
