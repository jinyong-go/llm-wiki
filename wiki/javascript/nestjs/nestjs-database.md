---
title: NestJS 데이터베이스 연결
updated: 2026-08-26 17:57:26
tags:
  - nodejs
  - nestjs
  - database
---

## 1. 개요

NestJS에서 자주 쓰는 데이터베이스 통합 4가지를 비교한다. 상세 사용법은 각 문서 참고.

| | [[nestjs-typeorm]] | [[nestjs-mongoose]] | [[nestjs-sequelize]] | [[nestjs-prisma]] |
|---|---|---|---|---|
| 대상 | SQL(+ Mongo) | MongoDB | SQL | SQL |
| 공식 `@nestjs/*` 패키지 | ✅ | ✅ | ✅ | ❌(직접 wrapping) |
| 모델 정의 | 데코레이터(`@Entity`) | 데코레이터(`@Schema`) | 데코레이터(`@Table`, Active Record) | 별도 DSL(`schema.prisma`) → 코드 생성 |
| 접근 패턴 | Repository | Document Model | Active Record | 생성된 Client |
| 타입 안전성 | 보통(수동 타입) | 보통 | 보통 | 스키마 기반 자동 생성, 가장 강함 |

## 2. 등록 패턴

TypeORM/Mongoose/Sequelize 세 통합은 같은 관례를 공유한다 — 루트 모듈에서 `forRoot()`로 연결을 한 번 설정하고, 도메인 모듈에서 `forFeature()`로 그 모듈이 쓸 모델만 등록한 뒤, `@Inject*()`로 서비스에 주입한다([[nestjs-config]] §4에서 언급한 `forRoot`/`forFeature` 관례와 동일).

Prisma는 이 관례를 쓰지 않는다 — 스키마가 이미 전체 클라이언트 타입을 결정하므로, `PrismaService` 하나를 provider로 등록해 어디서든 주입해 쓴다.

## 3. 선택 기준

| 상황 | 추천 |
|---|---|
| MongoDB 사용 | Mongoose (또는 TypeORM의 Mongo 드라이버) |
| Repository 패턴·엔티티 중심 설계 선호 | TypeORM |
| Active Record·가벼운 설정 선호 | Sequelize |
| 스키마 기반 강한 타입 안전성, 자동 마이그레이션 선호 | Prisma |

## 4. Raw SQL / SQL Mapper

Spring의 JdbcTemplate·MyBatis에 정확히 대응하는 공식 NestJS 모듈은 없다.

| Spring 개념 | NestJS/Node 대응 |
|---|---|
| JdbcTemplate(얇은 JDBC 래퍼) | `pg`/`mysql2` 같은 raw 드라이버를 `useFactory` 커스텀 provider로 직접 등록. 공식 패키지 없음 |
| ORM 안에서 raw SQL 탈출구 | TypeORM `dataSource.query()`([[nestjs-typeorm]] §5.4) / Prisma `$queryRaw`/`$executeRaw`([[nestjs-prisma]] §6) |
| MyBatis(SQL을 코드/설정에 분리해 선언·매핑) | 정확히 대응하는 것 없음. 가장 가까운 건 Knex.js(SQL에 가까운 쿼리 빌더, NestJS 공식 docs에 커뮤니티 recipe로만 존재) |

Node 생태계에는 MyBatis식 "SQL Mapper" 프레임워크 문화 자체가 약하며, ORM을 쓰다 필요한 부분만 raw SQL로 탈출하는 방식이 사실상 표준이다.

---

## Sources

- NestJS Docs — Database: https://docs.nestjs.com/techniques/database
- NestJS Docs — SQL: https://docs.nestjs.com/techniques/sql
- NestJS Docs — Custom providers: https://docs.nestjs.com/fundamentals/custom-providers

---

## Related pages

- [[nestjs]] — DB 연동 패키지 개요
- [[nestjs-typeorm]]
- [[nestjs-mongoose]]
- [[nestjs-sequelize]]
- [[nestjs-prisma]]
- [[nestjs-config]] — forRoot/forFeature 관례
