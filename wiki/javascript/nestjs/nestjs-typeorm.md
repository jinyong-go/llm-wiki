---
title: NestJS TypeORM
updated: 2026-08-27 10:52:15
tags:
  - nodejs
  - nestjs
  - database
  - typeorm
---

## 1. 개요

`@nestjs/typeorm`은 TypeORM 공식 통합이다. Repository 패턴을 쓰며 MySQL/PostgreSQL/SQLite/MSSQL/Oracle과 MongoDB까지 폭넓게 지원한다.

## 2. 설치

```bash
npm install --save @nestjs/typeorm typeorm mysql2
```

DB에 따라 `mysql2` 대신 아래 드라이버 패키지를 설치한다.

| DB | 드라이버 패키지 |
|---|---|
| MySQL/MariaDB | `mysql2` |
| PostgreSQL | `pg` |
| SQLite | `sqlite3` 또는 `better-sqlite3` |
| MSSQL | `mssql` |
| Oracle | `oracledb` |
| MongoDB | `mongodb` |

## 3. 설정

### 3.1. 연결

값이 고정돼도 되는 경우(로컬 개발 등)라면 `forRoot()`에 객체를 직접 넘기면 된다.

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'test',
  entities: [User],
}),
```

`host`/`username`/`password`처럼 환경마다 다르거나 코드에 하드코딩하면 안 되는 값은 `.env`에 두고([[nestjs-config]]) `ConfigService`로 읽어온다. `forRootAsync()`로 등록하며, `useFactory`/`useClass`/`useExisting`의 의미는 일반 provider와 동일하다([[nestjs-dependency-injection]] §3).

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('HOST'),
        port: +config.get('PORT'),
        username: config.get('USERNAME'),
        password: config.get('PASSWORD'),
        database: config.get('DATABASE'),
        entities: [User],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class AppModule {}
```

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `retryAttempts`/`retryDelay` | `10`/`3000` | 연결 재시도 횟수·간격(ms) |
| `autoLoadEntities` | `false` | `true`면 `entities` 배열 없이 `forFeature()` 등록분을 자동 로드 |
| `synchronize` | — | 엔티티로 스키마 자동 반영. **프로덕션 금지**(데이터 손실 위험) |
| `entities` | — | 이 연결이 사용할 Entity 클래스 배열(또는 glob 경로 문자열) |
| `database` | — | 연결할 데이터베이스 이름(SQLite는 파일 경로) |
| `logging` | `false` | 실행 SQL 로깅 여부(`true`/`"all"`/로그 종류 배열) |
| `extra` | — | 드라이버에 그대로 전달되는 추가 옵션(예: 커넥션 풀 `{ max: 10 }`) |

### 3.2. 모델 등록

도메인 모듈에서 그 모듈이 쓸 Entity만 `forFeature()`로 등록한다.

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [TypeOrmModule], // 다른 모듈에서 이 Repository를 쓰려면 필요
})
export class UsersModule {}
```

등록한 Repository는 `@InjectRepository()`로 주입받아 사용한다([§6.1](#61-injectrepository)).

### 3.3. 여러 데이터베이스 연결

기본 연결 외에 추가 연결은 `name`으로 구분한다(이름을 생략하면 `'default'`).

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  database: 'main_db',
  entities: [User],
  // name 생략 시 'default'
}),
TypeOrmModule.forRoot({
  name: 'albumsConnection',
  type: 'mysql',
  host: 'localhost',
  database: 'albums_db',
  entities: [Album],
}),
```

```typescript
TypeOrmModule.forFeature([Album], 'albumsConnection'),
```

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AlbumsService {
  constructor(@InjectDataSource('albumsConnection') private dataSource: DataSource) {}
}
```

## 4. Entity

`@Entity()`를 붙인 클래스가 테이블에 매핑된다. 컬럼·관계는 프로퍼티에 데코레이터를 붙여 선언한다.

`@Entity()`는 테이블명을 첫 인자로 받거나(`@Entity('custom_table')`), `{ name, schema }` 같은 옵션 객체를 받을 수 있다 — 생략하면 클래스명이 테이블명이 된다.

### 4.1. 컬럼 데코레이터

| 데코레이터 | 역할 | 자주 쓰는 옵션 |
|---|---|---|
| `@PrimaryColumn(옵션?)` | 기본키. 값을 직접 할당해야 함 | `type`, `name` |
| `@PrimaryGeneratedColumn(전략?)` | 자동 증가(또는 `uuid`) 기본키. 기존에 이름 붙은 시퀀스를 지정하는 옵션은 없음(`nextval()` 직접 호출 등 우회 필요) | `'increment'`(기본)/`'uuid'`/`'rowid'` |
| `@Column(옵션?)` | 일반 컬럼 | `type`, `nullable`, `default`, `unique`, `length`, `name`(컬럼명 오버라이드), `comment` |
| `@CreateDateColumn(옵션?)` | 삽입 시각 자동 설정 | `type`(기본 `timestamp`), `name` |
| `@UpdateDateColumn(옵션?)` | 저장할 때마다 갱신 시각 자동 설정 | `type`, `name` |
| `@DeleteDateColumn(옵션?)` | 소프트 삭제 시각(설정 시 기본 조회에서 제외) | `name` |
| `@VersionColumn()` | 저장 때마다 증가하는 버전 번호(낙관적 락에 사용) | — |
| `@Index(옵션?)` | 인덱스 생성 | `unique`(유니크 인덱스), `where`(부분 인덱스) |

### 4.2. 관계 데코레이터

외래키는 항상 **owning side**(실질적으로 컬럼을 만드는 쪽)에 생긴다.

| 데코레이터 | 관계 | Owning side | 외래키 위치 | 자주 쓰는 옵션 |
|---|---|---|---|---|
| `@ManyToOne(타입, 역방향?, 옵션?)` | N:1 | 항상 이 쪽 | 이 쪽 테이블 | `nullable`, `onDelete`(`'CASCADE'` 등), `eager` |
| `@OneToMany(타입, 역방향, 옵션?)` | 1:N | 없음(항상 inverse) | 반대쪽(`@ManyToOne`) 테이블 | `cascade`, `eager` |
| `@OneToOne(타입, 역방향?, 옵션?)` | 1:1 | `@JoinColumn()`을 붙인 쪽 | 그 쪽 테이블 | `nullable`, `onDelete`, `eager` |
| `@ManyToMany(타입, 역방향?, 옵션?)` | N:N | `@JoinTable()`을 붙인 쪽 | 별도 교차 테이블 | `cascade`, `eager` |

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 200 }) title: string;
  @CreateDateColumn() createdAt: Date;

  @ManyToOne(() => User, user => user.posts) // owning side, userId 컬럼 생성
  user: User;
}

@Entity()
export class User {
  @PrimaryGeneratedColumn() id: number;

  @OneToMany(() => Post, post => post.user) // inverse side, 컬럼 없음
  posts: Post[];
}
```

`@JoinColumn({ name: 'author_id' })`로 외래키 컬럼명을 바꾸고, `@ManyToMany()` + `@JoinTable()`로 N:N 교차 테이블을 만든다.

## 5. Repository

TypeORM은 Spring Data JPA의 `findByEmailAndActive(...)`처럼 **메서드 이름을 분석해 쿼리를 자동 생성하는 기능이 없다.** 쿼리는 항상 명시적으로 작성한다 — 옵션 객체, QueryBuilder, 아니면 raw SQL이다.

Repository는 `forFeature()`로 등록한 뒤([§3.2](#32-모델-등록)) `@InjectRepository()`로 주입받는다([§6.1](#61-injectrepository)). 아래 예시는 이렇게 주입받은 `this.repo`(`Repository<User>`)를 사용한다.

### 5.1. 옵션 객체 기반 메서드

단순 조회는 `FindOptionsWhere` 객체로 표현한다.

```typescript
this.repo.find({ where: { firstName: 'Timber' } });
this.repo.findBy({ firstName: 'Timber' });           // find()의 축약형
this.repo.findOneBy({ id });
this.repo.findAndCount({ where: { active: true } }); // [결과, 총 개수]
```

관계·정렬·페이징도 같은 옵션 객체 안에서 `relations`/`order`/`take`/`skip`으로 지정한다.

### 5.2. QueryBuilder

JOIN·서브쿼리처럼 옵션 객체로 표현하기 어려운 쿼리는 `createQueryBuilder()`로 SQL에 가까운 형태를 체이닝한다.

```typescript
this.repo.createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.name = :name', { name: 'John' })
  .orderBy('post.createdAt', 'DESC')
  .getMany();
```

### 5.3. 커스텀 Repository

반복되는 쿼리는 `Repository.extend()`로 재사용 가능한 메서드를 묶는다(예전 `@EntityRepository()` 데코레이터는 TypeORM 0.3에서 제거됐다).

```typescript
import { dataSource } from '../data-source';

export const UserRepository = dataSource.getRepository(User).extend({
  findByName(firstName: string, lastName: string) {
    return this.createQueryBuilder('user')
      .where('user.firstName = :firstName', { firstName })
      .andWhere('user.lastName = :lastName', { lastName })
      .getMany();
  },
});
```

### 5.4. Raw SQL

Repository/QueryBuilder로 표현하기 어려운 쿼리는 `.query()`로 원시 SQL을 직접 실행할 수 있다.

```typescript
this.dataSource.query('SELECT * FROM user WHERE id = ?', [id]);
```

## 6. 의존성 주입

### 6.1. @InjectRepository

`forFeature()`로 등록한 Entity의 Repository는 `@InjectRepository(Entity)`로 주입받는다.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
}
```

여러 연결을 쓸 때는 `@InjectRepository(User, 'albumsConnection')`처럼 두 번째 인자로 연결 이름을 지정한다([§3.3](#33-여러-데이터베이스-연결)).

### 6.2. 테스트에서 교체

```typescript
import { getRepositoryToken } from '@nestjs/typeorm';

{ provide: getRepositoryToken(User), useValue: mockRepository }
```

`overrideProvider()` 기반 mock 교체의 일반 패턴은 [[nestjs-testing]] §3 참고.

## 7. 트랜잭션

여러 쿼리를 하나의 원자적 단위로 묶어야 할 때 쓴다 — 트랜잭션 안에서는 전역 `Repository`/`EntityManager` 대신 **트랜잭션에 묶인 매니저**로만 쿼리해야 커밋·롤백이 함께 적용된다.

### 7.1. 콜백 방식

```typescript
await this.dataSource.transaction(async manager => {
  await manager.save(User, user1);
  await manager.save(User, user2);
  // 에러가 던져지면 자동 롤백, 정상 종료 시 자동 커밋
});
```

### 7.2. QueryRunner(수동 제어)

커밋·롤백 시점을 직접 제어해야 하면 `QueryRunner`를 쓴다.

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  await queryRunner.manager.save(User, user1);
  await queryRunner.manager.save(User, user2);
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release(); // 커넥션 반환 — 항상 호출
}
```

### 7.3. 격리 수준(Isolation Level)

```typescript
await this.dataSource.transaction('SERIALIZABLE', async manager => { /* ... */ });
```

`DataSource` 생성 옵션에 `isolationLevel`을 지정하면 모든 트랜잭션의 기본값이 된다.

## 8. 기타

### 8.1. 객체 매핑

TypeORM에는 JPA의 constructor expression(`SELECT new com.example.Dto(...)`)처럼 쿼리 결과를 DTO 생성자로 바로 매핑하는 기능이 없다. QueryBuilder의 반환 방식은 두 갈래로 고정돼 있다.

| 메서드 | 반환 |
|---|---|
| `getMany()`/`getOne()` | 실제 **Entity 인스턴스** |
| `getRawMany()`/`getRawOne()` | `SELECT`에 지정한 컬럼/별칭 그대로의 **순수 객체(plain object)** |

`getRawMany<UserDto>()`처럼 제네릭을 줘도 컴파일 타임 타입 힌트일 뿐 실제로 `UserDto` 인스턴스가 생성되지는 않는다 — `instanceof UserDto`는 실패하고 DTO에 메서드가 있어도 호출할 수 없다([[nestjs-config]]의 `ConfigService.get<T>()`와 같은 함정).

실제 DTO 인스턴스가 필요하면 raw 결과를 직접 변환해야 한다.

```typescript
const raws = await this.repo.createQueryBuilder('user')
  .select(['user.name', 'user.email'])
  .getRawMany();

// 수동 매핑
const dtos = raws.map(r => new UserDto(r.user_name, r.user_email));

// class-transformer
import { plainToInstance } from 'class-transformer';
const dtos = plainToInstance(UserDto, raws);
```

Entity 인스턴스와 집계 컬럼(raw)을 함께 받아야 하면 `getRawAndEntities()`를 쓴다(entity 쪽은 인스턴스, raw 쪽은 여전히 plain object).

### 8.2. 관계 로딩

관계는 기본적으로 **지연 로딩**이다 — `find()`/`findOne()`에서 `relations` 옵션을 주지 않으면 관계 프로퍼티는 로드되지 않고 `undefined`다.

```typescript
this.repo.find({ relations: ['posts'] }); // posts까지 함께 로드
```

`@OneToMany(() => Post, ..., { eager: true })`처럼 관계에 `eager: true`를 주면 매번 자동으로 로드되지만, 양쪽 관계에 동시에 걸면 서로를 무한히 로드하려는 순환 참조 에러가 난다 — 한쪽에만(보통 자주 조회하는 쪽) 걸어야 한다.

### 8.3. bigint·COUNT가 문자열로 반환

`bigint` 컬럼이나 `COUNT()` 집계 결과는 숫자가 아니라 **문자열**로 반환된다 — PostgreSQL `bigint`의 최댓값이 JS `Number.MAX_SAFE_INTEGER`를 넘어설 수 있어 정밀도 손실을 막기 위한 의도된 동작이다.

```typescript
const { count } = await this.repo.createQueryBuilder('user').select('COUNT(*)', 'count').getRawOne();
typeof count; // 'string'
```

숫자로 다뤄야 하면 명시적으로 변환한다(`Number(count)`).

### 8.4. N+1 문제

엔티티를 여러 건 조회한 뒤 각 엔티티에서 관계를 반복 접근하면(예: 각 User마다 따로 `posts`를 조회) 조회 1번 + 관계당 N번의 쿼리가 발생한다. 기본 `relationLoadStrategy`는 `'join'`이라 `relations`/`eager`로 명시한 관계는 LEFT JOIN으로 한 번에 가져와 N+1이 생기지 않지만, 명시하지 않은 관계에 뒤늦게 접근하면(레이지 로딩) 그 시점에 별도 쿼리가 나간다.

```typescript
// N+1: user마다 posts 쿼리가 따로 나감
const users = await this.repo.find();
for (const user of users) {
  await user.posts; // 각 반복마다 SELECT
}

// 해결: relations로 미리 조인
const users = await this.repo.find({ relations: ['posts'] });
```

관계가 중첩되거나 JOIN 결과가 너무 커지면 `relationLoadStrategy: 'query'`로 관계별 **분리된 쿼리**(관계당 1번, row당 1번이 아님)로 전환할 수 있다.

---

## Sources

- NestJS Docs — Database: https://docs.nestjs.com/techniques/database

---

## Related pages

- [[nestjs-database]] — ORM 비교
- [[nestjs-dependency-injection]] — useFactory/useClass/useExisting
- [[nestjs-testing]] — Mock Repository 교체
