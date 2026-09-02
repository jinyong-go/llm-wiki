---
title: NestJS Prisma
updated: 2026-08-27 13:15:13
tags:
  - nodejs
  - nestjs
  - database
  - prisma
---

## 1. 개요

Prisma는 `schema.prisma` 파일로 모델을 선언하면, 그 스키마로부터 완전히 타입화된 클라이언트(`PrismaClient`)를 **코드 생성**하는 스키마 우선(schema-first) ORM이다. TypeORM/Sequelize처럼 클래스에 데코레이터를 붙이는 대신, 별도 DSL로 스키마를 작성하고 CLI가 클라이언트 코드를 만들어낸다. NestJS 공식 `@nestjs/*` 패키지는 없고, `PrismaService`를 직접 만들어 provider로 등록하는 방식을 쓴다.

## 2. 설치

```bash
npm install prisma --save-dev
npx prisma init
```

`prisma/schema.prisma`, `.env`가 생성된다.

DB에 따라 별도 드라이버 패키지를 설치할 필요 없이 `datasource`의 `provider` 값만 바꾸면 된다 — Prisma 자체 쿼리 엔진이 각 DB와 통신한다.

| DB | `datasource` provider |
|---|---|
| PostgreSQL | `postgresql` |
| MySQL/MariaDB | `mysql` |
| SQLite | `sqlite` |
| MSSQL | `sqlserver` |
| MongoDB | `mongodb` |
| CockroachDB | `cockroachdb` |

## 3. 설정

### 3.1. 연결

`datasource`에 연결 문자열을, `generator`에 클라이언트 생성 옵션을 지정한다.

```prisma
// schema.prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"   // NestJS(CommonJS)와 맞추려면 필수
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

생성된 `PrismaClient`를 상속한 `PrismaService`를 provider로 등록해 연결을 노출한다.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {}
```

```typescript
import { Module } from '@nestjs/common';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`forRoot`/`forFeature` 관례를 쓰는 TypeORM·Mongoose·Sequelize와 달리, `PrismaService`는 일반 provider로 등록해 어디서든 주입해 쓴다.

### 3.2. 여러 데이터베이스 연결

Prisma에는 TypeORM/Sequelize의 `forRoot(name)`처럼 여러 연결을 이름으로 구분하는 1급 기능이 없다. 각 DB마다 별도 `schema.prisma`(서로 다른 `output` 경로)로 클라이언트를 따로 생성하고, 각각을 별도 `PrismaService`로 provider 등록해 구분한다.

CLI 명령을 실행할 때 `--schema` 플래그로 대상 스키마 파일을 지정한다.

```bash
npx prisma generate --schema=prisma/main.prisma
npx prisma generate --schema=prisma/albums.prisma

npx prisma migrate dev --schema=prisma/albums.prisma --name init
```

`prisma/schema/` 폴더에 여러 `.prisma` 파일을 두는 멀티파일 스키마 기능과는 다르다 — 그건 하나의 datasource/client를 구성하는 모델을 여러 파일로 나눠 쓰는 조직화 기능이라 결국 클라이언트 하나로 병합된다. 서로 다른 DB에 연결하려면 이렇게 스키마 파일 자체를 분리해야 한다.

```typescript
// albums-prisma.service.ts — 별도 schema(prisma/albums.prisma)로 생성된 클라이언트 사용
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/albums-prisma/client';

@Injectable()
export class AlbumsPrismaService extends PrismaClient {
  constructor() {
    super({ datasourceUrl: process.env.ALBUMS_DATABASE_URL });
  }
}
```

```typescript
@Module({
  providers: [PrismaService, AlbumsPrismaService],
  exports: [PrismaService, AlbumsPrismaService],
})
export class PrismaModule {}
```

## 4. 모델 정의

### 4.1. 모델 정의

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User?  @relation(fields: [authorId], references: [id])
  authorId Int?
}
```

### 4.2. 관계

TypeORM/Sequelize의 관계 데코레이터에 대응하는 자리로, Prisma는 데코레이터 대신 스키마 문법으로 관계를 표현한다.

| 관계 | 표현 |
|---|---|
| 1:N | N쪽에 FK 필드 + `@relation(fields, references)`, 1쪽엔 리스트 타입(`Post[]`)만 선언 |
| 1:1 | FK 필드에 `@unique` 추가(1:N과 동일한 `@relation`이지만 FK가 유니크) |
| N:N(암시적) | 양쪽에 리스트 타입만 선언 — Prisma가 중간 테이블을 자동 생성(추가 컬럼 불가) |
| N:N(명시적) | 중간 모델을 직접 선언하고 양쪽에서 `@relation("이름")`으로 연결(중간 테이블에 추가 컬럼 필요할 때) |

### 4.3. 마이그레이션

```bash
npx prisma migrate dev --name init   # SQL 마이그레이션 생성·적용
npx prisma generate                   # PrismaClient 코드 생성
```

## 5. 쿼리

### 5.1. 기본 CRUD

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from './generated/prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  users(where?: Prisma.UserWhereInput) {
    return this.prisma.user.findMany({ where });
  }

  createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }
}
```

스키마에서 생성된 `Prisma.UserCreateInput` 같은 타입을 그대로 써서, DTO를 별도로 정의하지 않아도 되는 경우가 많다.

### 5.2. Raw SQL

```typescript
this.prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${id}`;
this.prisma.$executeRaw`UPDATE "User" SET name = ${name} WHERE id = ${id}`;
```

태그 템플릿 리터럴로 파라미터가 자동 이스케이프된다.

## 6. 의존성 주입

### 6.1. PrismaService 주입

`PrismaService`는 `@InjectRepository()`/`@InjectModel()` 같은 전용 데코레이터 없이, 일반 provider와 동일하게 생성자로 주입해 쓴다.

```typescript
constructor(private prisma: PrismaService) {}
```

### 6.2. 테스트에서 교체

`PrismaService` 클래스 자체가 DI 토큰이므로 `getRepositoryToken()`/`getModelToken()` 같은 토큰 조회 함수 없이 클래스를 직접 provide 키로 써서 mock으로 교체한다.

```typescript
{ provide: PrismaService, useValue: mockPrismaService }
```

일반 패턴은 [[nestjs-testing]] §3 참고.

## 7. 기타

### 7.1. 객체 매핑

Prisma는 애초에 **클래스 기반 Entity/Model이 없다** — `findMany()`/`findUnique()` 등 모든 조회 메서드가 처음부터 순수 객체(plain object)를 반환한다. TypeORM/Sequelize처럼 "Entity 인스턴스 vs raw 객체"를 구분할 필요가 없다.

`select`/`include`로 조회 결과의 모양을 좁히면, 그 모양에 맞는 타입이 자동으로 추론된다.

```typescript
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { name: true, email: true }, // { name: string; email: string }로 타입 추론
});
```

다만 이렇게 얻은 값도 여전히 plain object다 — 메서드가 있는 실제 DTO 클래스 인스턴스가 필요하면(예: `class-validator`로 직렬화 규칙을 걸 때) TypeORM/Sequelize와 동일하게 직접 변환해야 한다([[nestjs-typeorm]] §8.1).

```typescript
const dto = new UserDto(user.name, user.email);
// 또는 plainToInstance(UserDto, user)
```

### 7.2. 예외 처리

Prisma는 알려진 실행 오류를 `PrismaClientKnownRequestError`로 던지며, `.code` 프로퍼티로 종류를 구분한다. 자주 만나는 코드는 `P2002`(유니크 제약 위반)와 `P2025`(수정·삭제 대상 레코드 없음)다. `@prisma/client`가 아니라 `@prisma/client/runtime/library`에서 import해야 한다.

```typescript
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.code === 'P2002' ? 409 : 400;
    response.status(status).json({ message: exception.message });
  }
}
```

Exception Filter 작성법은 [[nestjs-request-pipeline]] §6 참고. `findUnique()` 대신 `findUniqueOrThrow()`를 쓰면 레코드가 없을 때 자동으로 `P2025`를 던진다.

### 7.3. N+1 문제

Prisma Client는 Entity 클래스가 아니라 쿼리 엔진이 직접 SQL을 생성하므로, `include`를 쓰면 관계마다 **행 단위가 아니라 관계 단위로 배치(batch)** 쿼리를 날린다 — 부모 1번 + 관계 종류당 `WHERE id IN (...)` 1번씩이라, 고전적인 "행마다 쿼리"는 아니지만 진짜 단일 JOIN도 아니다.

```typescript
this.prisma.user.findMany({
  include: { posts: true, profile: true }, // 총 3개 쿼리: user, posts(IN), profile(IN)
});
```

`include` 없이 반복문 안에서 개별 조회를 호출하면 여전히 고전적인 N+1이 생긴다.

### 7.4. 종료 시 연결 정리

`PrismaService`에 `OnModuleDestroy`를 구현해 앱 종료 시 연결을 명시적으로 끊을 수 있다.

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## Sources

- NestJS Docs — Prisma: https://docs.nestjs.com/recipes/prisma

---

## Related pages

- [[nestjs-database]] — ORM 비교
- [[nestjs-dependency-injection]] — 일반 provider 등록·주입
- [[nestjs-typeorm]] — 객체 매핑 제약 비교
- [[nestjs-request-pipeline]] — Exception Filter 작성법
