---
title: NestJS Mongoose
updated: 2026-08-26 17:57:26
tags:
  - nodejs
  - nestjs
  - database
  - mongoose
---

## 1. 개요

`@nestjs/mongoose`는 MongoDB용 ODM인 Mongoose의 공식 통합이다. 클래스에 데코레이터를 붙이면 Mongoose 스키마로 변환된다.

## 2. 설치

```bash
npm i @nestjs/mongoose mongoose
```

## 3. Schema

모든 것은 **Schema**에서 시작한다 — 스키마 하나가 MongoDB 컬렉션 하나에 대응하며, 그 컬렉션에 들어갈 문서(document)의 형태(필드·타입)를 정의한다. `@Schema()`를 붙인 클래스는 스키마 정의로 취급되며, 클래스 이름을 복수형으로 바꾼 이름의 컬렉션에 매핑된다(`Cat` → `cats`). `SchemaFactory.createForClass()`가 이 클래스를 실제 Mongoose 스키마 객체로 변환한다.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class Cat {
  @Prop({ required: true }) name: string;
  @Prop() age: number;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }) owner: Owner;
}
export const CatSchema = SchemaFactory.createForClass(Cat);
```

### 3.1. 자주 쓰는 옵션

| 데코레이터 | 옵션 | 역할 |
|---|---|---|
| `@Schema()` | `timestamps` | `true`면 `createdAt`/`updatedAt` 필드를 자동 추가 |
| `@Schema()` | `collection` | 기본(클래스명 복수형) 대신 컬렉션 이름을 직접 지정 |
| `@Prop()` | `required` | 필수 필드 지정 |
| `@Prop()` | `default` | 기본값 |
| `@Prop()` | `unique` | 유니크 인덱스 생성(검증기 아님, [§6.3](#63-예외-처리) 참고) |
| `@Prop()` | `enum` | 지정한 값 목록으로 제한 |
| `@Prop()` | `type`/`ref` | 타입 명시, 다른 모델 참조([§3.2](#32-참조-관계)) |

```typescript
@Schema({ timestamps: true })
export class Cat {
  @Prop({ required: true, unique: true }) name: string;
  @Prop({ enum: ['kitten', 'adult'], default: 'kitten' }) stage: string;
}
```

### 3.2. 참조 관계

MongoDB는 관계형 DB의 **JOIN을 지원하지 않는다.** `type: mongoose.Schema.Types.ObjectId, ref: 'Owner'`는 "이 필드가 Owner 컬렉션의 문서를 가리키는 ObjectId"라는 의미일 뿐이다 — 이 상태로 조회하면 참조된 문서가 아니라 **ObjectId 값 그대로** 반환된다. 실제 문서를 채워 넣으려면 조회 시 `populate()`를 명시적으로 호출해야 한다([§6.2](#62-n1-문제)).

```typescript
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner; // populate() 없이 조회하면 ObjectId만 담김

@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[]; // 다중 참조
```

## 4. 설정

### 4.1. 연결

`mongodb://` URI처럼 환경마다 다르거나 하드코딩하면 안 되는 값은 `.env`에 두고([[nestjs-config]]) `ConfigService`로 읽어온다. `forRoot()`는 URI 문자열을 직접 받지만, `forRootAsync()`는 `useFactory`가 옵션 객체를 반환해야 한다(예: `{ uri }`).

인증 정보(username/password)는 두 가지 방식으로 넣을 수 있다.

1. **URI에 포함** — `mongodb://user:pass@host:port/db`. 비밀번호에 `@`/`:`/`/`/`?` 같은 특수문자가 있으면 URL 인코딩이 필요하다.

   ```typescript
   import { Module } from '@nestjs/common';
   import { MongooseModule } from '@nestjs/mongoose';
   import { ConfigModule, ConfigService } from '@nestjs/config';

   @Module({
     imports: [
       MongooseModule.forRootAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           uri: config.get<string>('MONGODB_URI'),
         }),
       }),
     ],
   })
   export class AppModule {}
   ```

2. **`user`/`pass` 옵션을 별도 지정** — Mongoose 전용 옵션으로, URI에는 host/port/db만 넣고 인증 정보는 옵션 객체로 분리한다. 특수문자 인코딩 문제가 없어 필드별로 값을 읽어오기에 더 적합하다.

   ```typescript
   import { Module } from '@nestjs/common';
   import { MongooseModule } from '@nestjs/mongoose';
   import { ConfigModule, ConfigService } from '@nestjs/config';

   @Module({
     imports: [
       MongooseModule.forRootAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           uri: `mongodb://${config.get('MONGO_HOST')}:${config.get('MONGO_PORT')}/${config.get('MONGO_DB')}`,
           user: config.get('MONGO_USER'),
           pass: config.get('MONGO_PASSWORD'),
         }),
       }),
     ],
   })
   export class AppModule {}
   ```

옵션 객체는 Mongoose의 `mongoose.connect()` 설정을 그대로 받는다. `uri`/`user`/`pass` 외에 자주 쓰는 옵션은 다음과 같다.

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `dbName` | — | 연결 문자열의 DB 이름을 무시하고 별도로 지정 |
| `autoIndex` | `true` | 스키마의 인덱스를 연결 시 자동 생성. 대규모 프로덕션에서는 인덱스 생성이 성능 저하를 유발할 수 있어 `false`로 끄는 것을 권장(TypeORM의 `synchronize`와 비슷한 이유) |
| `maxPoolSize` | `100` | 유지할 최대 커넥션 풀 크기 |
| `serverSelectionTimeoutMS` | `30000` | 서버 선택 재시도 제한 시간(ms). 서버리스 환경이 아니라면 줄이지 않는 게 좋음 |

### 4.2. 모델 등록

도메인 모듈에서 그 모듈이 쓸 모델만 `forFeature()`로 등록한다. 이 등록을 거쳐야 Schema가 실제 **Model**이 된다 — Model은 등록된 컬렉션에 대해 문서를 생성·조회·수정·삭제하는 역할을 한다(TypeORM의 Repository, Sequelize의 Model 클래스에 해당하는 역할).

```typescript
// cats.module.ts
MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
```

### 4.3. 여러 데이터베이스 연결

```typescript
MongooseModule.forRoot(/* 기본 연결 URI */),
MongooseModule.forRoot(/* 다른 URI */, { connectionName: 'cats' }),
```

연결 이름이 같으면 덮어써지므로 이름을 반드시 구분해야 한다.

## 5. 의존성 주입

### 5.1. @InjectModel

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}
  create(dto: CreateCatDto) { return new this.catModel(dto).save(); }
  findAll() { return this.catModel.find().exec(); }
}
```

여러 연결을 사용할 때는 `@InjectModel(Cat.name, 'cats')`처럼 두 번째 인자로 연결 이름을 지정한다([§4.3](#43-여러-데이터베이스-연결)).

### 5.2. 테스트에서 교체

```typescript
import { getModelToken } from '@nestjs/mongoose';

{ provide: getModelToken(Cat.name), useValue: mockCatModel }
```

일반 패턴은 [[nestjs-testing]] §3 참고.

## 6. 기타

### 6.1. 객체 매핑

`find()`/`findOne()` 등은 기본적으로 **Document 인스턴스**(하이드레이션된[^1] 객체, `save()`·가상 필드·getter/setter 포함)를 반환한다. `.lean()`을 붙이면 하이드레이션을 건너뛰어 순수 객체(plain object)를 받는다 — 메모리를 약 1/3로 줄이고 더 빠르지만, `save()`·가상 필드·타입 캐스팅을 잃는다.

```typescript
this.catModel.find().lean(); // Document가 아닌 plain object 배열
```

응답을 그대로 반환만 하는 조회(GET)에는 `.lean()`이 적합하고, 조회 후 수정해 다시 저장해야 하면(PUT/POST) 일반 Document를 써야 한다. TypeORM/Sequelize와 마찬가지로 임의의 DTO 클래스로 매핑하는 기능은 없다([[nestjs-typeorm]] §8.1).

### 6.2. N+1 문제

`populate()`를 반복문 안에서 문서마다 호출하면 고전적인 N+1이 발생한다. 루프 밖에서 한 번에 `find().populate('owner')`처럼 호출하면, Mongoose가 참조 ID를 모아 `$in` 쿼리로 배치 처리한다 — 보통 메인 쿼리 1번 + 참조 조회 1번, 총 2번으로 끝난다.

```typescript
// N+1: cat마다 owner 쿼리가 따로 나감
const cats = await this.catModel.find();
for (const cat of cats) {
  await cat.populate('owner');
}

// 해결: 미리 한 번에 populate
const cats = await this.catModel.find().populate('owner');
```

### 6.3. 예외 처리

**중복 키(E11000)**: 스키마의 `unique: true`는 검증기(validator)가 아니라 MongoDB 인덱스 설정이다 — 인스턴스 생성 시점이 아니라 `save()`가 실제 DB에 쓸 때 위반이 발생하며, `MongoServerError`(`.code === 11000`)로 던져진다.

```typescript
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { MongoServerError } from 'mongodb';

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.code === 11000 ? 409 : 400;
    response.status(status).json({ message: exception.message });
  }
}
```

Exception Filter 작성법은 [[nestjs-request-pipeline]] §6 참고.

**잘못된 ObjectId(CastError)**: 경로 파라미터가 24자리 hex 형식이 아니면 `CastError`가 던져진다. TypeORM의 `ParseUUIDPipe`([[nestjs-request-pipeline]] §4.1)에 대응하는 **`ParseObjectIdPipe`는 NestJS에 내장돼 있지 않다** — `mongoose.Types.ObjectId.isValid()`로 직접 검증하는 커스텀 Pipe를 만들어야 한다.

[^1]: 하이드레이션(hydration)은 원시 데이터를 `save()`·가상 필드·getter/setter 같은 메서드를 가진 실제 Document 인스턴스로 변환하는 과정이다. `HydratedDocument<T>` 타입이 이렇게 하이드레이션된 문서의 타입을 나타낸다.

---

## Sources

- NestJS Docs — MongoDB (Mongoose): https://docs.nestjs.com/techniques/mongodb
- Mongoose Docs — Lean: https://mongoosejs.com/docs/tutorials/lean.html
- Mongoose Docs — Query Population: https://mongoosejs.com/docs/populate.html
- Mongoose Docs — Connections: https://mongoosejs.com/docs/connections.html
- Mongoose Docs — Schemas: https://mongoosejs.com/docs/guide.html

---

## Related pages

- [[nestjs-database]] — ORM 비교
- [[nestjs-testing]] — Mock Model 교체
- [[nestjs-typeorm]] — 객체 매핑 제약 비교
- [[nestjs-request-pipeline]] — Exception Filter, 내장 Pipe
