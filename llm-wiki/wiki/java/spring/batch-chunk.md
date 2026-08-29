---
title: Spring Batch Chunk 지향 처리 — 개념, ItemReader/Processor/Writer, 예시, 장단점
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring
  - spring-batch
  - batch
  - chunk
---

## 1. 개념

Chunk 지향 처리는 Spring Batch의 **표준 대량 처리 모델**이다. 데이터를 **한 건씩 읽어(read)**, 선택적으로 **가공(process)** 한 뒤, 정해진 개수(**chunk size**)만큼 모이면 **한 번에 기록(write)** 하고 트랜잭션을 커밋한다.

- **chunk size = commit-interval** — 한 트랜잭션에 처리할 아이템 수.
- 읽기는 한 건씩이지만 쓰기는 묶음 단위 → DB 일괄 처리 등으로 효율적.
- **chunk 1개 = 트랜잭션 1개**. chunk 처리 중 실패하면 해당 chunk 트랜잭션만 롤백된다.

처리 루프(의사 코드):

```java
List items = new ArrayList();
for (int i = 0; i < commitInterval; i++) {
    Object item = itemReader.read();   // null이면 입력 종료
    if (item != null) items.add(item);
}

List processed = new ArrayList();
for (Object item : items) {
    Object out = itemProcessor.process(item);  // null이면 필터링(제외)
    if (out != null) processed.add(out);
}

itemWriter.write(processed);   // 묶음 단위 기록 → 커밋
```

읽을 항목이 없을 때(`read()`가 `null`)까지 위 과정을 반복한다.

관련: [[batch]] — Step·처리 방식 개요, [[jpa-transaction]] — 트랜잭션 경계.

---

## 2. 예시

```java
@Bean
public Step chunkStep(JobRepository jobRepository,
                      PlatformTransactionManager tx) {
    return new StepBuilder("chunkStep", jobRepository)
            .<Member, MemberDto>chunk(100, tx)   // <입력타입, 출력타입> + chunk size
            .reader(memberReader())
            .processor(memberProcessor())
            .writer(memberWriter())
            .build();
}
```

- `chunk(100, tx)`: 100건마다 커밋. 제네릭 `<I, O>`는 reader 입력 타입과 writer 출력 타입.
- `processor`는 생략 가능(reader→writer 직결).

---

## 3. ItemReader

데이터 소스에서 아이템을 **한 건씩** 읽는다.

```java
public interface ItemReader<T> {
    T read() throws Exception;   // 더 읽을 항목이 없으면 null 반환
}
```

- **역할**: 파일 한 줄, DB 한 행, XML 한 요소 등 논리적 1건을 도메인 객체로 매핑해 반환. 순방향(forward-only) 읽기.
- **종료 신호**: 항목이 없으면 예외가 아니라 `null`을 반환한다(0건 쿼리는 첫 호출에서 바로 `null`).
- **`ItemStream`(상태/재시작)**: 상태를 가지는 reader(파일 위치 등)는 `ItemStream`의 `open()`(초기화)·`update()`(체크포인트 저장)·`close()`(정리)를 함께 구현해 재시작 시 마지막 위치부터 재개한다.

### 3.1. 자주 쓰는 구현체

| 분류 | 구현체 | 설명 |
|------|--------|------|
| 파일 | `FlatFileItemReader` | 구분자/고정길이 텍스트를 객체로 매핑 |
| | `StaxEventItemReader` | StAX 기반 XML 조각 매핑 |
| | `JsonItemReader` | JSON 배열 매핑(Jackson/Gson) |
| | `MultiResourceItemReader` | 여러 파일을 순차 처리하도록 위임 |
| DB(커서) | `JdbcCursorItemReader` | JDBC `ResultSet` 커서 스트리밍 |
| | `HibernateCursorItemReader` | Hibernate HQL + `StatelessSession` |
| DB(페이징) | `JdbcPagingItemReader` | `PagingQueryProvider`로 페이지 조회 |
| | `JpaPagingItemReader` | JPQL + `EntityManagerFactory` |
| | `RepositoryItemReader` | Spring Data Repository 사용 |
| 메시징 | `KafkaItemReader`, `AmqpItemReader`, `JmsItemReader` 등 | 브로커에서 읽기 |

> 커서 방식은 단일 커넥션으로 스트리밍해 메모리에 유리하나 커넥션을 길게 점유한다. 페이징 방식은 페이지마다 쿼리를 재실행하며 멀티스레드·재시작에 유리하다.[^1]

[^1]: 출처의 직접 서술이 아니라 두 방식의 동작(단일 ResultSet 스트리밍 vs 페이지 쿼리 반복)으로부터 추론.

---

## 4. ItemProcessor

읽은 아이템을 **변환·검증·필터링**한다. 선택 요소다.

```java
public interface ItemProcessor<I, O> {
    O process(I item) throws Exception;
}
```

- **역할**: 입력 타입 `I`를 출력 타입 `O`로 변환(엔티티→DTO 등), 비즈니스 검증, 보강(enrich).
- **필터링**: `process()`가 **`null`을 반환하면 해당 아이템은 writer로 전달되지 않는다**(제외). 필터된 수는 `filterCount`로 집계.
- reader→writer 직결이 가능하므로 변환·필터가 불필요하면 생략한다.

### 4.1. 자주 쓰는 구현체

| 구현체 | 설명 |
|--------|------|
| `CompositeItemProcessor` | 여러 프로세서를 순차 체이닝(앞 출력이 뒤 입력) |
| `ClassifierCompositeItemProcessor` | 분류 로직에 따라 아이템별 다른 프로세서로 분기 |
| `ValidatingItemProcessor` | `Validator`로 검증 후 통과분만 전달 |
| `ItemProcessorAdapter` / `FunctionItemProcessor` | 기존 메서드·`Function`을 프로세서로 어댑트 |

---

## 5. ItemWriter

가공된 아이템 **묶음(chunk)을 한 번에 기록**한다.

```java
public interface ItemWriter<T> {
    void write(Chunk<? extends T> items) throws Exception;
}
```

- **역할**: 출력 리소스(DB·큐·파일 등)에 묶음 단위로 insert/update/send. 필요 시 flush 수행.
- **묶음 처리**: 항목 하나가 아니라 chunk를 받으므로, JDBC batch처럼 일괄 처리에 최적화할 수 있다.
- **빈 chunk 처리**: 프로세서가 전부 필터링하거나 내결함성 스텝에서 모두 skip되면 빈 chunk가 올 수 있으므로 구현은 이를 안전하게 처리해야 한다.

> [!note] 버전 차이 (시그니처)
> `write` 인자가 Spring Batch 4.x의 `List<? extends T>`에서 **5.0부터 `Chunk<? extends T>`** 로 변경되었다. 커스텀 writer를 5.x로 올릴 때 시그니처를 바꿔야 한다.

### 5.1. 자주 쓰는 구현체

| 분류 | 구현체 | 설명 |
|------|--------|------|
| 파일 | `FlatFileItemWriter` | `LineAggregator`로 텍스트 출력 |
| | `StaxEventItemWriter` | OXM Marshaller로 XML 출력 |
| | `JsonFileItemWriter` | JSON 출력 |
| DB | `JdbcBatchItemWriter` | JDBC batch update로 일괄 기록 |
| | `JpaItemWriter` | JPA merge/persist |
| | `HibernateItemWriter` | Hibernate Session save/update |
| | `RepositoryItemWriter` | Spring Data Repository 사용 |
| 메시징 | `KafkaItemWriter`, `AmqpItemWriter`, `JmsItemWriter` 등 | 대상으로 전송 |
| 조합 | `CompositeItemWriter` | 여러 writer에 위임 |
| | `ClassifierCompositeItemWriter` | 분류에 따라 writer 분기 |

---

## 6. Tasklet과의 차이

| 항목 | Chunk 지향 | Tasklet |
|------|-----------|---------|
| 처리 모델 | read → process → write 반복 | 단일 `execute()` |
| 트랜잭션 경계 | chunk(다건) 단위 | execute 호출 단위 |
| 구성요소 | `ItemReader`(+`ItemProcessor`)+`ItemWriter` | `Tasklet` |
| 통계 | read/write/filter/skip count 집계 | 항목 단위 통계 없음 |
| 내결함성 | skip/retry 항목 단위 지원 | 없음 |
| 적합 작업 | 대량 반복 처리 | 단일 작업(프로시저·파일/시스템 등) |

상세: [[batch-tasklet]].

---

## 7. 장단점

### 7.1. 장점
- **메모리 효율** — 전체가 아닌 chunk 단위만 메모리에 적재. 대용량 처리에 적합.
- **트랜잭션 관리** — chunk 단위 커밋으로 부분 진행·실패 격리.
- **내결함성·재시작** — skip/retry와 `ExecutionContext` 기반 재시작으로 실패 지점부터 재개 가능.
- **풍부한 구현체** — 파일·DB·메시징용 reader/writer를 조합만으로 구성. 통계 자동 집계.

### 7.2. 단점
- **단일 작업엔 과함** — 단발성 작업은 [[batch-tasklet]]이 더 단순.
- **chunk size 튜닝 필요** — 너무 크면 메모리·롤백 비용·락 점유 증가, 너무 작으면 커밋 오버헤드 증가.
- **구성 복잡도** — reader/processor/writer 분리로 단순 로직 대비 보일러플레이트가 늘 수 있다.[^2]

[^2]: reader/processor/writer 3요소 분리 구조로부터 도출한 일반적 평가임.

---

## Sources
- Spring Batch Reference (latest, 6.x) — Item Reader: https://docs.spring.io/spring-batch/reference/readers-and-writers/item-reader.html
- Spring Batch Reference (latest, 6.x) — Item Writer: https://docs.spring.io/spring-batch/reference/readers-and-writers/item-writer.html
- Spring Batch Reference (latest, 6.x) — Chunk-oriented Processing (Configuring a Step): https://docs.spring.io/spring-batch/reference/step.html
- Spring Batch Reference (latest, 6.x) — ItemReaders and ItemWriters: https://docs.spring.io/spring-batch/reference/readersAndWriters.html

---

## Related pages
- [[batch]] — Step·처리 방식 개요, 도메인 모델
- [[batch-fault-tolerance]] — chunk 스텝의 Skip·Retry·롤백·재시작
- [[batch-flow]] — ItemProcessor에서 ExitStatus 설정해 조건 분기
- [[batch-tasklet]] — 단일 작업 처리 모델, Chunk와 비교
- [[batch-db-reader-writer]] — DB reader/writer 카테고리별 상세(JDBC/JPA/Hibernate/Spring Data)
- [[batch-scope]] — `@StepScope`로 reader/writer에 파라미터 주입
- [[batch-job-parameters]] — 실행 파라미터 전달·사용
- [[jpa-transaction]] — chunk 트랜잭션 경계, readOnly
- [[jpa-n-plus-one]] — reader 단계 연관 조회 N+1 주의
