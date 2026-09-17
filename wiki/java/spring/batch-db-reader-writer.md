---
title: Spring Batch DB ItemReader·ItemWriter
updated: 2026-09-01 11:43:12
tags:
  - java
  - spring
  - spring-batch
  - batch
  - jdbc
  - jpa
---

## 1. 개요

Chunk 지향 처리에서 DB를 입출력으로 쓰는 대표 구현체를 기술별 카테고리로 정리한다. 읽기는 **커서(cursor)** 와 **페이징(paging)** 두 방식이 있고, 쓰기는 묶음(batch) 단위로 기록한다.

- 카테고리: **JDBC**, **JPA**, **Hibernate**, **Spring Data**
- 기반 개념: [[batch-chunk]] — ItemReader/Processor/Writer 인터페이스·역할

---

## 2. 읽기 방식 — 커서 vs 페이징

| 항목 | 커서(Cursor) | 페이징(Paging) |
|------|-------------|----------------|
| 동작 | 커서를 열고 `read()`마다 한 행 전진 (스트리밍) | 페이지 단위 쿼리를 반복 실행 |
| 커넥션 | 스텝 내내 1개 유지 | 페이지마다 짧은 쿼리 |
| 메모리 | 낮음(스트리밍) | 페이지 크기만큼 적재 |
| 멀티스레드 | 단일 스레드용(공유 부적합) | 병렬 처리에 유리 |
| DB 지원 | 커서 지원 필요 | 더 범용적 |
| 대용량 | 이상적 | 중간 규모에 적합, 라운드트립 증가 |

> 멀티스레드 스텝·파티셔닝에서는 페이징 reader가 적합하다. 커서 reader는 `ResultSet`을 공유할 수 없어 단일 스레드에 쓴다.[^1]

[^1]: 커서 reader가 스텝 내내 하나의 ResultSet을 유지한다는 동작(§2 표)으로부터 추론.

정렬 키 주의: 페이징 reader는 페이지 간 누락/중복을 막기 위해 **유니크한 정렬 키**(`sortKey`)가 필요하다.

---

## 3. JDBC

### 3.1. JdbcCursorItemReader

`ResultSet` 커서로 스트리밍한다.

- 주요 속성: `dataSource`, `sql`, `rowMapper`, `fetchSize`(드라이버 fetch 힌트), `maxRows`, `queryTimeout`, `verifyCursorPosition`, `saveState`.

```java
@Bean
public JdbcCursorItemReader<Customer> jdbcCursorReader(DataSource dataSource) {
    return new JdbcCursorItemReaderBuilder<Customer>()
            .name("jdbcCursorReader")
            .dataSource(dataSource)
            .sql("select id, name, credit from customer")
            .rowMapper(new CustomerRowMapper())
            .fetchSize(1000)
            .build();
}
```

### 3.2. JdbcPagingItemReader

`PagingQueryProvider`가 페이지 단위 SQL을 생성한다.

- 주요 속성: `dataSource`, `queryProvider`, `pageSize`, `rowMapper`, `parameterValues`.
- `SqlPagingQueryProviderFactoryBean`으로 `selectClause`/`fromClause`/`whereClause`/`sortKey`를 지정. **`sortKey`는 유니크해야 한다.**

```java
@Bean
public JdbcPagingItemReader<Customer> jdbcPagingReader(
        DataSource dataSource, PagingQueryProvider queryProvider) {
    return new JdbcPagingItemReaderBuilder<Customer>()
            .name("jdbcPagingReader")
            .dataSource(dataSource)
            .queryProvider(queryProvider)
            .parameterValues(Map.of("status", "NEW"))
            .rowMapper(new CustomerRowMapper())
            .pageSize(1000)
            .build();
}

@Bean
public SqlPagingQueryProviderFactoryBean queryProvider(DataSource dataSource) {
    SqlPagingQueryProviderFactoryBean p = new SqlPagingQueryProviderFactoryBean();
    p.setDataSource(dataSource);
    p.setSelectClause("select id, name, credit");
    p.setFromClause("from customer");
    p.setWhereClause("where status = :status");
    p.setSortKey("id");   // 유니크
    return p;
}
```

### 3.3. StoredProcedureItemReader

저장 프로시저/함수를 커서로 읽는다. 반환 방식: ResultSet 반환(SQL Server/MySQL 등), ref-cursor out 파라미터(Oracle/PostgreSQL), 함수 반환값.

- 주요 속성: `dataSource`, `procedureName`, `rowMapper`, `parameters`(`SqlParameter`/`SqlOutParameter`), `refCursorPosition`, `function`(함수면 true).

### 3.4. JdbcBatchItemWriter

파라미터 바인딩 SQL을 **JDBC batch update**로 일괄 실행한다.

- 주요 속성: `dataSource`, `sql`, `itemSqlParameterSourceProvider`(아이템→파라미터 매핑) 또는 빈 프로퍼티 매핑, `assertUpdates`(true면 갱신 행 0건일 때 예외).

```java
@Bean
public JdbcBatchItemWriter<Customer> jdbcBatchWriter(DataSource dataSource) {
    return new JdbcBatchItemWriterBuilder<Customer>()
            .dataSource(dataSource)
            .sql("insert into customer (id, name, credit) values (:id, :name, :credit)")
            .beanMapped()   // 아이템의 프로퍼티명으로 :파라미터 매핑
            .assertUpdates(true)
            .build();
}
```

---

## 4. JPA

### 4.1. JpaPagingItemReader

JPQL + `EntityManager`로 페이지 단위 조회. 페이지마다 영속성 컨텍스트를 clear해 메모리를 관리한다.

- 주요 속성: `entityManagerFactory`, `queryString`(JPQL), `pageSize`. (파라미터는 `parameterValues`)

```java
@Bean
public JpaPagingItemReader<Customer> jpaPagingReader(EntityManagerFactory emf) {
    return new JpaPagingItemReaderBuilder<Customer>()
            .name("jpaPagingReader")
            .entityManagerFactory(emf)
            .queryString("select c from Customer c where c.status = :status")
            .parameterValues(Map.of("status", "NEW"))
            .pageSize(1000)
            .build();
}
```

> JPA는 커서 reader를 기본 제공하지 않는다. 대용량을 단일 커넥션 스트리밍하려면 Hibernate 커서 reader를 쓴다.[^2]

[^2]: Spring Batch 제공 reader 목록에 JPA 커서 reader가 없다는 사실로부터 추론.

### 4.2. JpaItemWriter

`EntityManager`로 영속화한다.

- 주요 속성: `entityManagerFactory`, `usePersist`(true=`persist()` 신규 엔티티 / false 기본=`merge()` 준영속·관리 엔티티).

```java
@Bean
public JpaItemWriter<Customer> jpaWriter(EntityManagerFactory emf) {
    JpaItemWriter<Customer> writer = new JpaItemWriter<>();
    writer.setEntityManagerFactory(emf);
    writer.setUsePersist(true);   // insert 전용이면 persist가 유리
    return writer;
}
```

관련: [[jpa-transaction]], [[jpa-n-plus-one]] — reader 단계 연관 로딩 주의.

---

## 5. Hibernate

- **HibernateCursorItemReader** — HQL + `StatelessSession`으로 커서 스트리밍(대용량). **HibernatePagingItemReader** — 페이지 단위.
- **HibernateItemWriter** — Hibernate `Session`의 save/update. JPA writer보다 세션 동작을 세밀히 제어. (현재는 JPA 사용이 일반적)

주요 속성: `sessionFactory`, `queryString`(또는 `queryName`), `fetchSize`(커서), `pageSize`(페이징).

---

## 6. Spring Data

기존 Spring Data 리포지토리를 그대로 활용한다(별도 DAO 불필요).

- **RepositoryItemReader** — 리포지토리의 페이징 메서드를 호출해 읽는다. 주요 속성: `repository`, `methodName`, `arguments`, `sorts`(정렬 필수), `pageSize`.
- **RepositoryItemWriter** — 리포지토리 `save`로 기록. 주요 속성: `repository`, `methodName`(기본 `save`).

```java
@Bean
public RepositoryItemReader<Customer> repositoryReader(CustomerRepository repo) {
    return new RepositoryItemReaderBuilder<Customer>()
            .name("repositoryReader")
            .repository(repo)
            .methodName("findByStatus")
            .arguments(List.of("NEW"))
            .sorts(Map.of("id", Sort.Direction.ASC))
            .pageSize(1000)
            .build();
}
```

---

## 7. Offset 성능 이슈와 커스텀 리더

### 7.1. Offset 페이징의 한계

`JpaPagingItemReader`·`JdbcPagingItemReader`는 `LIMIT offset, size` 방식이라 **페이지가 뒤로 갈수록 급격히 느려진다.** DB가 건너뛸 offset만큼의 행을 매번 스캔한 뒤 버리기 때문이다. 예: `... limit 50000000, 100`은 5천만 행을 스캔한 뒤 100건만 취한다.

- 카카오페이 사례: `JpaPagingItemReader`로 300만 건 처리 시 약 112분, 데이터가 늘수록 비선형으로 악화. (출처: 카카오페이 기술블로그)
- 대량 처리에서 `JpaPagingItemReader`·`RepositoryItemReader`는 부적합. (출처: 카카오페이)

### 7.2. No Offset (Zero Offset) 방식

offset 대신 **마지막으로 읽은 PK를 조건으로** 다음 페이지를 조회한다. offset을 항상 0으로 유지하므로 데이터량과 무관하게 일정한 속도를 낸다.

```sql
-- offset 페이징 (느림)
select * from product where reg_date = :date order by id limit :offset, :size
-- No Offset (id가 정렬·커서 역할)
select * from product where reg_date = :date and id > :lastId order by id limit :size
```

- 정렬·커서 키로 쓸 컬럼은 인덱스가 있어야 하고 정렬 순서가 보장돼야 한다.
- 카카오페이는 `ZeroOffsetItemReader`(및 Kotlin Exposed 기반 `ExposedCursorItemReader`)로 300만 건을 약 4~5분에 처리(기존 112분 대비 8~13배). GC도 안정적. (출처: 카카오페이)

### 7.3. QueryDSL 커스텀 리더

Spring Batch는 QueryDSL 전용 reader를 제공하지 않아, 보통 `AbstractPagingItemReader`를 상속해 `doReadPage()`를 QueryDSL로 구현한다. jojoldu의 `spring-batch-querydsl` 라이브러리가 이를 재사용 가능하게 제공한다. (출처: jojoldu)

- **`QuerydslPagingItemReader`** — offset 기반. 쿼리를 `Function<JPAQueryFactory, JPAQuery<T>>` 람다로 주입해 타입 안전하게 작성.

```java
@Bean
@StepScope
public QuerydslPagingItemReader<Product> reader(EntityManagerFactory emf) {
    return new QuerydslPagingItemReader<>(emf, chunkSize, queryFactory ->
            queryFactory.selectFrom(product)
                        .where(product.createDate.eq(txDate)));
}
```

- **`QuerydslNoOffsetPagingItemReader`** — §7.2의 No Offset을 QueryDSL로 구현. `QuerydslNoOffsetNumberOptions`(숫자 키)/`QuerydslNoOffsetStringOptions`(문자 키)에 정렬 기준 QClass 필드를 지정하면 마지막 ID를 캐시해 `where id > :lastId` 조건을 자동 추가. 대용량에서도 마지막 페이지까지 일정 속도.

```java
@Bean
@StepScope
public QuerydslNoOffsetPagingItemReader<Product> reader(EntityManagerFactory emf) {
    QuerydslNoOffsetNumberOptions<Product, Long> options =
            new QuerydslNoOffsetNumberOptions<>(product.id, Expression.ASC);
    return new QuerydslNoOffsetPagingItemReader<>(emf, chunkSize, options, queryFactory ->
            queryFactory.selectFrom(product)
                        .where(product.createDate.eq(txDate)));
}
```

- 장점: 타입 안전(QClass), Job 설정에서 람다로 간결히 생성, No Offset 성능, 보일러플레이트 제거.

관련: [[querydsl]] — QueryDSL 기본·설정.

> [!note] 라이브러리/구현체 표기
> `ZeroOffsetItemReader`·`ExposedCursorItemReader`(카카오페이), `Querydsl(NoOffset)PagingItemReader`(jojoldu `spring-batch-querydsl`)는 **Spring Batch 기본 제공이 아닌 외부/커스텀 구현체**다. No Offset은 구현 방식의 명칭이다.

---

## 8. 선택 기준 / 주의

- **대용량 + 단순 SQL**: JDBC 커서/페이징. 최고 성능, 매핑 직접.
- **도메인 엔티티·연관 매핑 필요**: JPA 페이징 또는 Spring Data.
- **멀티스레드/파티셔닝**: 페이징 계열(커서는 단일 스레드).
- **초대용량 페이징**: 일반 offset 페이징은 뒤 페이지에서 급격히 느려지므로 **No Offset 방식**(또는 커서)을 고려(§7).
- **정렬 키**: 페이징은 유니크 `sortKey`/`sorts` 필수(누락·중복 방지).
- **쓰기 성능**: 대량 insert는 `JdbcBatchItemWriter`(batch update)가 일반적으로 우수. JPA writer는 영속성 컨텍스트·flush 비용 고려.
- **skip/retry 정밀도**: 묶음 쓰기는 flush 시점에 오류가 드러나 단건 skip이 어렵다 → 내결함성이 중요하면 쓰기 단위·flush 전략을 점검. (출처: 공식 문서 권고)

---

## Sources
- Spring Batch Reference (latest, 6.x) — Database (cursor/paging readers, DB writers): https://docs.spring.io/spring-batch/reference/readers-and-writers/database.html
- Spring Batch Reference (latest, 6.x) — ItemReaders and ItemWriters: https://docs.spring.io/spring-batch/reference/readersAndWriters.html
- 카카오페이 기술블로그, "대용량 배치 성능 개선기 1편 - 데이터 읽기 편"(Offset 성능 이슈·No Offset/커서 리더): https://tech.kakaopay.com/post/ifkakao2022-batch-performance-read/
- jojoldu, "Spring Batch에서 QueryDSL 사용하기"(QueryDSL 커스텀 리더): https://jojoldu.tistory.com/473

---

## Related pages
- [[batch-chunk]] — ItemReader/Processor/Writer 인터페이스·역할·전체 구현체
- [[batch]] — Step·처리 방식 개요
- [[batch-scope]] — `@StepScope`로 reader/writer에 파라미터 주입
- [[jpa-transaction]] — 트랜잭션 경계·readOnly
- [[jpa-n-plus-one]] — reader 연관 조회 N+1
- [[mybatis]] — MyBatis 기반 reader/writer(`MyBatisCursorItemReader` 등) 대안
- [[querydsl]] — QueryDSL 기본·설정(커스텀 리더의 쿼리 작성)
