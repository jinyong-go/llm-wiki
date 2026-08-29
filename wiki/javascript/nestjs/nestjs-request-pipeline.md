---
title: NestJS 요청 파이프라인
updated: 2026-08-24 16:08:18
tags:
  - nodejs
  - nestjs
  - decorator
---

## 1. 개요

Guard·Pipe·Interceptor·Exception Filter는 컨트롤러 핸들러를 감싸는 4가지 컴포넌트다. 모두 `@Injectable()` 클래스로 작성하고 정해진 인터페이스를 구현하며, 전용 데코레이터로 컨트롤러 클래스나 핸들러 메서드에 적용한다. 생성자 주입도 다른 provider와 동일하게 지원한다([[nestjs-dependency-injection]]).

요청 처리 전체 순서(Middleware → Guard → Interceptor → Pipe → 핸들러 → Interceptor → Exception Filter)는 [[nestjs-controllers]] §5 참고.

## 2. 등록 범위

네 컴포넌트 모두 동일한 3단계 등록 패턴을 공유한다.

| 범위 | 방법 | 의존성 주입 |
|---|---|---|
| 메서드 | 핸들러에 `@UseGuards()`/`@UsePipes()`/`@UseInterceptors()`/`@UseFilters()` | 가능 |
| 컨트롤러 | 컨트롤러 클래스에 동일 데코레이터 | 가능 |
| 전역(인스턴스) | `main.ts`에서 `app.useGlobalGuards()` 등 | **불가**(모듈 컨텍스트 밖에서 실행) |
| 전역(프로바이더) | 모듈 `providers`에 `APP_GUARD`/`APP_PIPE`/`APP_INTERCEPTOR`/`APP_FILTER` 토큰으로 등록 | 가능(권장) |

```typescript
// app.module.ts — 전역 등록 권장 방식
providers: [
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

Pipe는 위 방식 외에 `@Body(ValidationPipe)`처럼 파라미터 데코레이터 인자로 특정 인자에만 적용할 수도 있다.

## 3. Guard — 인가

`CanActivate` 인터페이스를 구현한다. `canActivate(context: ExecutionContext)`가 `boolean`(또는 `Promise`/`Observable`)을 반환하며, `true`면 요청을 핸들러로 넘기고 `false`면 `ForbiddenException`(403)을 자동 발생시킨다.

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

컨트롤러 클래스나 핸들러 메서드에 `@UseGuards()`로 적용한다.

```typescript
@Controller('cats')
@UseGuards(AuthGuard)
export class CatsController {}
```

`Reflector`[^1]로 커스텀 데코레이터가 붙인 메타데이터를 읽어 역할 기반 인가를 구현하는 것이 대표적인 활용이다.

```typescript
export const Roles = Reflector.createDecorator<string[]>();

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) return true;
    const { user } = context.switchToHttp().getRequest();
    return matchRoles(roles, user.roles);
  }
}
```

`@Roles(['admin'])`로 핸들러에 메타데이터를 붙이고 `@UseGuards(RolesGuard)`를 적용하면, 이 Guard가 메타데이터를 읽어 검사한다.

```typescript
@Post()
@Roles(['admin'])
@UseGuards(RolesGuard)
create() {}
```

### 3.1. ExecutionContext

`canActivate(context: ExecutionContext)`가 받는 인자다. `ArgumentsHost`를 확장한 타입으로([§6.2](#62-argumentshost)), `switchToHttp()`로 요청 객체를 꺼내는 것 외에 `getHandler()`(현재 실행될 핸들러 메서드)·`getClass()`(그 핸들러가 속한 컨트롤러 클래스)를 추가로 제공한다. `Reflector.get(메타데이터, context.getHandler())`처럼 메타데이터를 읽을 때 이 두 메서드로 대상을 지정한다. Interceptor의 `intercept()`도 동일한 타입을 받는다([§5.1](#51-executioncontextcallhandler)).

## 4. Pipe — 변환·검증

`PipeTransform<T, R>` 인터페이스를 구현한다. `transform(value: T, metadata: ArgumentMetadata): R`이 반환한 값이 핸들러 인자로 전달되며, 예외를 던지면 컨트롤러 메서드는 실행되지 않고 예외 필터가 처리한다. 용도는 두 가지다 — **변환**(문자열→숫자 등 형 변환)과 **검증**(조건 불충족 시 예외). `ArgumentMetadata`는 [§4.3](#43-argumentmetadata) 참고.

### 4.1. 내장 Pipe

`@nestjs/common`이 기본 제공한다.

| Pipe | 역할 |
|---|---|
| `ValidationPipe` | DTO 기반 검증(§4.2) |
| `ParseIntPipe`/`ParseFloatPipe`/`ParseBoolPipe`/`ParseEnumPipe`/`ParseUUIDPipe`/`ParseDatePipe` | 문자열을 지정 타입으로 파싱, 실패 시 400 |
| `ParseArrayPipe`/`ParseFilePipe` | 배열/파일 파싱·검증 |
| `DefaultValuePipe` | 값이 `null`/`undefined`일 때 기본값 주입(`Parse*` 앞에 배치) |

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

### 4.2. class-validator 기반 검증

```bash
npm i --save class-validator class-transformer
```

DTO 클래스 필드에 `@IsString()`/`@IsInt()` 등을 붙이고, `ValidationPipe`가 `plainToInstance()`로 평문 객체를 인스턴스화한 뒤 `validate()`로 검사해 오류가 있으면 `BadRequestException`을 던진다. 네이티브 타입(`String`/`Number`/`Boolean`/`Array`/`Object`)은 검증을 건너뛴다.

메서드에 `@UsePipes()`로 적용한다(전역 등록은 [§2](#2-등록-범위) 참고).

```typescript
@Post()
@UsePipes(ValidationPipe)
async create(@Body() createCatDto: CreateCatDto) {}
```

### 4.3. ArgumentMetadata

`transform(value, metadata: ArgumentMetadata)`가 받는 두 번째 인자다. `{ type: 'body' | 'query' | 'param' | 'custom', metatype?, data? }` 구조로, 처리 중인 인자의 종류(`type`)와 타입 정보(`metatype`)를 담는다. `metatype`이 정확하려면 DTO를 인터페이스가 아닌 **클래스**로 정의해야 한다([[nestjs-controllers]] §3.2) — TypeScript 인터페이스는 컴파일 후 사라져 런타임에 타입 정보가 남지 않기 때문이다.

## 5. Interceptor — AOP

`NestInterceptor` 인터페이스를 구현한다. `intercept(context: ExecutionContext, next: CallHandler): Observable<any>`에서 `next.handle()`을 호출해야 핸들러가 실행되며, 반환된 RxJS `Observable`을 파이프 연산자로 감싸 핸들러 실행 전후에 로직을 끼워 넣는다(AOP의 Pointcut과 유사). `handle()`을 호출하지 않으면 핸들러는 실행되지 않는다 — 이 성질로 캐싱(저장된 값을 `of()`로 즉시 반환)도 구현할 수 있다.

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`${Date.now() - now}ms`)),
    );
  }
}
```

컨트롤러 클래스나 핸들러 메서드에 `@UseInterceptors()`로 적용한다.

```typescript
@UseInterceptors(LoggingInterceptor)
@Controller('cats')
export class CatsController {}
```

| RxJS 연산자 | 용도 |
|---|---|
| `tap` | 응답 값을 바꾸지 않고 부수 효과(로깅 등) 실행 |
| `map` | 응답 값 변형(`{ data: ... }`로 감싸기 등) |
| `catchError` | 핸들러에서 던진 예외를 다른 예외로 변환 |
| `timeout` + `catchError` | 지정 시간 초과 시 `RequestTimeoutException` 발생 |

### 5.1. ExecutionContext·CallHandler

`intercept(context: ExecutionContext, next: CallHandler)`가 받는 두 인자다. `ExecutionContext`는 Guard와 동일한 타입이다([§3.1](#31-executioncontext)). `CallHandler`는 `handle()` 메서드 하나만 제공하며, 호출하면 실제 라우트 핸들러가 실행되고 결과가 RxJS `Observable`로 반환된다 — 이 반환값에 연산자를 연결해 응답을 가공한다.

## 6. Exception Filter — 예외 처리

Nest는 내장 전역 필터로 처리되지 않은 예외를 잡아 응답으로 변환한다. `HttpException`(및 서브클래스)은 그 `status`/`message`를 그대로 응답하고, 그 외 예외는 `500 Internal server error`로 처리한다.

```typescript
throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
```

자주 쓰는 서브클래스: `BadRequestException`(400), `UnauthorizedException`(401), `ForbiddenException`(403), `NotFoundException`(404), `ConflictException`(409), `InternalServerErrorException`(500) 등. 커스텀 예외는 `HttpException`을 상속하면 내장 필터가 자동 인식한다. `HttpException` 서브클래스는 기본적으로 로깅되지 않는다(정상 흐름으로 취급).

### 6.1. 커스텀 필터

`ExceptionFilter` 인터페이스(`catch(exception, host: ArgumentsHost)`)를 구현하고, `@Catch(예외타입)`으로 어떤 예외를 처리할지 지정한다. 인자를 비우면(`@Catch()`) 모든 예외를 잡는다. `ArgumentsHost`는 [§6.2](#62-argumentshost) 참고.

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(exception.getStatus()).json({
      statusCode: exception.getStatus(),
      timestamp: new Date().toISOString(),
    });
  }
}
```

메서드·컨트롤러·전역 범위 모두 `@UseFilters()`로 적용한다.

```typescript
@Post()
@UseFilters(HttpExceptionFilter)
create() {}
```

`BaseExceptionFilter`(`@nestjs/core`)를 상속해 기본 처리 로직을 재사용하면서 일부만 확장할 수도 있다. 메서드/컨트롤러 범위로 등록할 때는 `@UseFilters(AllExceptionsFilter)`처럼 **클래스**로 전달해야 한다(인스턴스 전달 시 자동 인스턴스화·재사용이 깨짐).

### 6.2. ArgumentsHost

`catch(exception, host: ArgumentsHost)`가 받는 두 번째 인자다. HTTP·마이크로서비스·WebSocket 등 어떤 실행 컨텍스트에서도 동작하는 유틸리티로, `switchToHttp()`로 전환한 뒤 `getRequest()`/`getResponse()`로 요청·응답 객체를 꺼낸다. Guard·Interceptor가 받는 `ExecutionContext`([§3.1](#31-executioncontext))는 이 타입을 확장해 `getHandler()`/`getClass()`를 추가한 것이다.

[^1]: `Reflector`는 `@nestjs/core`가 제공하는 클래스로, 데코레이터가 핸들러·클래스에 부착한 메타데이터를 런타임에 읽어오는 유틸리티다. `reflector.get(메타데이터-키, context.getHandler())`처럼 호출해 특정 대상에 붙은 값을 꺼낸다.

---

## Sources

- NestJS Docs — Guards: https://docs.nestjs.com/guards
- NestJS Docs — Pipes: https://docs.nestjs.com/pipes
- NestJS Docs — Interceptors: https://docs.nestjs.com/interceptors
- NestJS Docs — Exception filters: https://docs.nestjs.com/exception-filters

---

## Related pages

- [[nestjs]] — NestJS 개요, 데코레이터
- [[nestjs-controllers]] — 컨트롤러, 요청 처리 순서
- [[nestjs-dependency-injection]] — Provider, 토큰
- [[nestjs-modules]] — 모듈 provider 등록
