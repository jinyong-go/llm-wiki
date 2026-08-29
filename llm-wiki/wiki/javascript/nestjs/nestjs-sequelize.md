---
title: NestJS Sequelize
updated: 2026-08-27 11:22:54
tags:
  - nodejs
  - nestjs
  - database
  - sequelize
---

## 1. 개요

`@nestjs/sequelize`는 Sequelize(`sequelize-typescript`) 공식 통합이다. TypeORM의 Repository 패턴과 달리 모델 클래스 자체가 DB와 상호작용하는 **Active Record** 패턴을 쓴다.

## 2. 설치

```bash
npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
```

DB에 따라 `mysql2` 대신 아래 드라이버 패키지를 설치한다.

| DB | 드라이버 패키지 |
|---|---|
| MySQL/MariaDB | `mysql2` |
| PostgreSQL | `pg`(+ `pg-hstore`) |
| SQLite | `sqlite3` |
| MSSQL | `tedious` |
| Oracle | `oracledb` |

## 3. 설정

### 3.1. 연결

값이 고정돼도 되는 경우(로컬 개발 등)라면 `forRoot()`에 객체를 직접 넘기면 된다.

```typescript
SequelizeModule.forRoot({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'test',
  models: [User],
}),
```

`host`/`username`/`password`처럼 환경마다 다르거나 코드에 하드코딩하면 안 되는 값은 `.env`에 두고([[nestjs-config]]) `ConfigService`로 읽어온다.

```typescript
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'mysql',
        host: config.get('HOST'),
        port: +config.get('PORT'),
        username: config.get('USERNAME'),
        password: config.get('PASSWORD'),
        database: config.get('DATABASE'),
        models: [User],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class AppModule {}
```

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `retryAttempts`/`retryDelay` | `10`/`3000` | 연결 재시도 |
| `autoLoadModels` | `false` | `forFeature()` 등록분 자동 로드 |
| `keepConnectionAlive` | `false` | 앱 종료 시에도 연결 유지 |
| `synchronize` | **`true`(기본값에 주의)** | 모델로 스키마 자동 동기화. 프로덕션에서는 꺼야 함 |
| `models` | — | 이 연결이 사용할 Model 클래스 배열 |
| `database` | — | 연결할 데이터베이스 이름 |
| `logging` | `console.log` | 실행 SQL 로깅 함수(`false`로 끄면 비활성화) |
| `dialectOptions` | — | 드라이버별 추가 옵션(예: `ssl` 설정) |

### 3.2. 모델 등록

도메인 모듈에서 그 모듈이 쓸 모델만 `forFeature()`로 등록한다.

```typescript
// users.module.ts
SequelizeModule.forFeature([User]),
```

### 3.3. 여러 데이터베이스 연결

```typescript
SequelizeModule.forRoot({
  dialect: 'mysql',
  host: 'localhost',
  database: 'main_db',
  models: [User],
}),
SequelizeModule.forRoot({
  name: 'albumsConnection',
  dialect: 'mysql',
  host: 'localhost',
  database: 'albums_db',
  models: [Album],
}),
SequelizeModule.forFeature([Album], 'albumsConnection'),
```

## 4. Model 정의

TypeORM의 `@Entity` 클래스와 달리 `Model`을 상속하며, 인스턴스 자신이 `save()`/`destroy()` 같은 메서드를 갖는다(Active Record). 컬럼·관계는 프로퍼티에 데코레이터를 붙여 선언한다.

### 4.1. 컬럼 데코레이터

| 데코레이터 | 역할 | 자주 쓰는 옵션 |
|---|---|---|
| `@Table(옵션?)` | 클래스를 테이블에 매핑 | `tableName`, `freezeTableName`, `timestamps`, `paranoid`, `underscored` |
| `@Column(타입?)` | 컬럼 정의. TypeScript 타입에서 데이터 타입을 추론하거나 `DataType`으로 명시 | `type`, `field`(컬럼명 오버라이드), `comment` |
| `@PrimaryKey` | 기본키 지정 | — |
| `@AutoIncrement` | 자동 증가 | — |
| `@Default(값)` | 기본값 | 값 그 자체(리터럴/함수) |
| `@AllowNull(boolean)` | null 허용 여부(기본 `false`) | `true`/`false` |
| `@Unique(이름?)` | 유니크 제약(문자열 인자를 주면 여러 컬럼을 묶는 복합 유니크) | 유니크 키 이름 |
| `@CreatedAt`/`@UpdatedAt` | 생성·수정 시각 자동 기록 | — |
| `@DeletedAt` | 소프트 삭제 시각(`paranoid: true`일 때 기본 조회에서 제외) | — |
| `@Index(이름?)` | 인덱스(문자열 인자를 주면 여러 컬럼을 묶는 복합 인덱스) | 인덱스 이름, `unique` |

```typescript
import { Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({ timestamps: true })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  firstName: string;

  @Default(true)
  @Column
  isActive: boolean;

  @CreatedAt creationDate: Date;
  @UpdatedAt updatedOn: Date;
}
```

### 4.2. 관계 데코레이터

TypeORM과 달리 외래키를 표시하는 `@ForeignKey()`와, 관계를 "어느 방향으로 읽을지" 정하는 `@BelongsTo`/`@HasOne`/`@HasMany`/`@BelongsToMany`가 분리돼 있다.

| 데코레이터 | 의미 | 외래키 위치 | 자주 쓰는 옵션 |
|---|---|---|---|
| `@ForeignKey(() => Model)` | 이 컬럼이 외래키임을 표시 | 이 모델(반드시 `@Column`과 함께 사용) | — |
| `@BelongsTo(() => Model, 옵션?)` | "내가 저 모델에 속한다"(N:1의 N쪽) | 이 모델(= `@ForeignKey`가 붙은 쪽) | `foreignKey`, `as`(별칭), `onDelete`/`onUpdate` |
| `@HasMany(() => Model, 옵션?)` | "저 모델들이 내게 속한다"(1:N의 1쪽) | 상대 모델 | `foreignKey`, `as`, `onDelete` |
| `@HasOne(() => Model, 옵션?)` | "저 모델 하나가 내게 속한다"(1:1) | 상대 모델 | `foreignKey`, `as` |
| `@BelongsToMany(() => Model, () => Through, 옵션?)` | N:N, 중간 테이블 지정 | 중간(through) 모델 | `foreignKey`, `otherKey`, `as` |

```typescript
import { Table, Column, Model, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';

@Table
export class Player extends Model {
  @ForeignKey(() => Team)
  @Column
  teamId: number;

  @BelongsTo(() => Team) // Player가 Team에 속함 — 외래키(teamId)는 Player 쪽
  team: Team;
}

@Table
export class Team extends Model {
  @HasMany(() => Player) // Team이 여러 Player를 가짐 — 외래키는 Player 쪽에 있음
  players: Player[];
}
```

## 5. 의존성 주입

### 5.1. @InjectModel

`forFeature()`로 등록한 모델은 `@InjectModel(Model)`로 주입받아 사용한다. 인자로는 `forFeature()`에 등록한 모델 클래스를 그대로 넘긴다.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private userModel: typeof User) {}
  findAll() { return this.userModel.findAll(); }
  findOne(id: string) { return this.userModel.findOne({ where: { id } }); }
}
```

여러 연결을 쓸 때는 `@InjectModel(User, 'albumsConnection')`처럼 두 번째 인자로 연결 이름을 지정한다.

### 5.2. 테스트에서 교체

테스트에서 실제 DB 연결 없이 서비스 로직만 검증하려면 `@InjectModel()`이 주입하는 모델을 mock으로 교체해야 한다. `getModelToken()`으로 실제 주입 토큰을 얻어 provider를 바꿔치기한다.

```typescript
import { getModelToken } from '@nestjs/sequelize';

{ provide: getModelToken(User), useValue: mockUserModel }
```

일반 패턴은 [[nestjs-testing]] §3 참고.

## 6. 기타

### 6.1. 객체 매핑

`findAll()`/`findOne()`은 기본적으로 **Model 인스턴스**(Active Record)를 반환한다. `{ raw: true }` 옵션을 주면 인스턴스 메서드·getter가 없는 순수 객체(plain object)를 받는다.

```typescript
this.userModel.findAll({ raw: true }); // Model 인스턴스가 아닌 plain object 배열
```

`sequelize.query()`로 raw SQL을 실행할 때도 기본은 plain object다. `model`/`mapToModel` 옵션을 주면 Sequelize **자신의 Model 클래스**로는 매핑해주지만, 임의의 DTO 클래스로 매핑하는 기능은 없다.

```typescript
await this.sequelize.query('SELECT * FROM users', {
  model: User,
  mapToModel: true, // User Model 인스턴스로 매핑됨
});
```

TypeORM과 같은 제약이다([[nestjs-typeorm]] §8.1). DTO 인스턴스가 필요하면 직접 변환해야 한다.

```typescript
const raws = await this.userModel.findAll({ raw: true, attributes: ['name', 'email'] });
const dtos = raws.map(r => new UserDto(r.name, r.email));
// 또는 class-transformer의 plainToInstance(UserDto, raws)
```

### 6.2. forFeature와 연관 모델

`@HasMany`/`@BelongsTo` 등으로 다른 모델을 참조하기만 하고 그 모델 자체는 `forFeature()`(또는 `forRoot()`의 `models`)에 등록하지 않으면, 연관관계 정의만 있을 뿐 실제로 로드되지 않는다 — 관계 대상 모델도 반드시 명시적으로 등록해야 한다.

```typescript
// Team이 Player를 @HasMany로 참조한다면 Player도 함께 등록해야 함
SequelizeModule.forFeature([Team, Player]),
```

### 6.3. N+1 문제

`include` 없이 인스턴스마다 연관 데이터를 따로 조회하면(예: `user.getPosts()`를 반복 호출) 고전적인 N+1이 발생한다. `include`를 쓰면 기본적으로 **하나의 JOIN 쿼리**로 가져오지만, `hasMany`/`belongsToMany` 관계에서는 조인으로 행이 중복되고 Sequelize가 이를 애플리케이션 레벨에서 다시 조립(de-duplicate)한다 — 관계 건수가 많으면 이 방식이 오히려 느리다.

```typescript
// 기본: 단일 JOIN, hasMany에서 중복 행 발생 가능
this.userModel.findAll({ include: [Post] });

// separate: true — 메인 쿼리 1번 + 관계 쿼리 1번으로 분리, 대량 hasMany에 유리
this.userModel.findAll({ include: [{ model: Post, separate: true }] });
```

`separate: true`는 `hasMany`에만 쓸 수 있고 기본값이 아니므로, 관계 데이터가 많을 것으로 예상되면 명시적으로 켜야 한다.

### 6.4. 순환 연관관계

두 모델이 서로를 외래키로 참조하면(A→B, B→A) `synchronize`/`sync()`가 테이블 생성 순서를 정하지 못해 실패할 수 있다. 한쪽 `@ForeignKey`에 `{ constraints: false }`를 줘서 외래키 제약을 완화하면 우회할 수 있다.

---

## Sources

- NestJS Docs — SQL (TypeORM & Sequelize): https://docs.nestjs.com/techniques/sql
- nestjs/sequelize (GitHub): https://github.com/nestjs/sequelize

---

## Related pages

- [[nestjs-database]] — ORM 비교
- [[nestjs-typeorm]] — Repository 패턴과의 차이
