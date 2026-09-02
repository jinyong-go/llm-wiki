---
title: Spring Batch
updated: 2026-09-01 11:43:12
tags:
  - java
  - spring
  - spring-batch
  - batch
  - transaction
---

## 1. 개요

Spring Batch는 대용량 데이터의 **일괄(batch) 처리**를 위한 프레임워크다. 비대화형으로 다량의 레코드를 처리하는 작업(정산·집계, 파일↔DB 이관, ETL, 대량 발송 등)을 표준화된 구조로 작성하게 한다.

핵심 제공 기능:
- **트랜잭션 관리**와 청크 단위 커밋
- **상태 영속화** — 실행 이력·진행 상태를 메타데이터 테이블에 기록
- **재시작(restart)** — 실패 지점부터 재개
- **건너뛰기(skip)·재시도(retry)** — 일부 레코드 오류에 대한 내결함성
- 처리 통계(read/write/skip/commit count 등)

> [!note] 버전과 개념
> 개념·도메인 모델·처리 방식은 Spring Batch 4~6에서 동일하다(Spring Boot 2→Batch 4, Boot 3→Batch 5, Boot 4→Batch 6). 차이는 주로 설정 API·자동설정·메타데이터 스키마 컬럼 등 구현 레벨이며 별도 문서로 분리한다. 본 문서는 버전 무관 개념을 다루며, 출처는 최신 레퍼런스(6.x)를 따른다.
> 재실행·상태·제어, 메타데이터 스키마 상세는 별도 문서로 분리 예정.
> Spring Batch 6.0부터 XML 네임스페이스 설정은 deprecated이며 Java 설정이 권장된다.

---

## 2. 도메인 모델

배치 실행은 다음 계층으로 구성된다.

| 개념 | 의미 |
|------|------|
| `Job` | 배치 프로세스 전체를 캡슐화한 최상위 단위. 하나 이상의 `Step`을 순서대로 포함 |
| `JobInstance` | **논리적 잡 실행 1건**. `Job 이름 + 식별(identifying) JobParameters` 조합으로 식별 |
| `JobParameters` | 잡 실행 시 전달하는 파라미터. *식별용*은 `JobInstance` 동일성 판단에 사용, *비식별용*은 참조 데이터로만 사용 |
| `JobExecution` | `JobInstance`를 실제로 **실행한 1회 시도**. 재시작 시 동일 `JobInstance`에 새 `JobExecution`이 추가됨. 상태(`BatchStatus`)·시작/종료 시각 보유 |
| `Step` | 잡을 구성하는 독립적·순차적 처리 단계 |
| `StepExecution` | `Step`의 실행 1회 시도. read/write/skip/commit count 등 통계 보유 |
| `ExecutionContext` | 재시작용 상태 저장소(key/value). `JobExecution`·`StepExecution` 각각에 별도로 존재 |
| `JobRepository` | 위 도메인 객체의 영속화(CRUD) 담당. 실행 이력·상태를 메타데이터 테이블에 기록하여 중복 실행 방지·재시작·통계 조회의 근거가 됨 |
| `JobLauncher` | `Job`과 `JobParameters`를 받아 실행을 시작하는 진입점 |

관계 요약:

```
JobInstance (Job이름 + 식별 파라미터)
  └─ JobExecution (실행 시도 N회)
       ├─ ExecutionContext (Job 레벨)
       └─ StepExecution (스텝별)
            └─ ExecutionContext (Step 레벨)
```

`JobInstance = Job + 식별 JobParameters` 가 핵심 계약이다. 같은 식별 파라미터로 다시 실행하면 같은 `JobInstance`의 재시작이 되고, 식별 파라미터가 다르면 새 `JobInstance`가 생성된다.

---

## 3. Job

`Job`은 배치 프로세스 전체를 캡슐화하는 **최상위 컨테이너**다. 여러 `Step`을 정의하고 실행 순서를 조율하는 것이 핵심 책임이다.

### 3.1. Job의 구성

하나의 `Job`은 다음을 포함한다.

- **이름(name)** — 잡을 식별하는 고유 이름. `JobInstance` 식별(`Job 이름 + 식별 JobParameters`)의 한 축이며, 메타데이터에 잡 단위로 기록된다.
- **Step의 정의와 실행 순서(flow)** — 잡을 구성하는 `Step`들과 그 순서·전이를 정의한다. 빌더에서 `start(첫 스텝)` → `next(다음 스텝)` 형태로 순차 흐름을 구성한다.
- **재시작 설정(restartability)** — 잡 단위 재시작 허용 여부 등 실행 정책. (상세 규칙은 별도 문서에서 다룸)
- **`JobRepository` 의존** — 잡(및 내부 스텝)은 실행 메타데이터를 영속화할 `JobRepository`를 필요로 한다.

### 3.2. 흐름 제어

기본 흐름은 스텝의 순차 실행이지만, 조건 분기·병렬 실행을 위한 요소도 제공한다.

- **순차(sequential)** — `start` 이후 `next`로 스텝을 차례로 연결.
- **분기(decision)** — 이전 스텝의 `ExitStatus` 등에 따라 다음 스텝을 선택하는 선언적 흐름 제어.
- **병렬(split)** — 여러 스텝/플로우를 동시에 실행.
- **flow** — 재사용 가능한 스텝 묶음을 외부화한 단위.

### 3.3. 계층상 위치

`Job`은 *정의*이고, 그 정의의 실제 실행은 `JobInstance`(논리적 실행) → `JobExecution`(물리적 실행 시도)으로 이어진다. 즉 `Job`은 "무엇을 어떤 순서로 처리할지"를 기술한 템플릿이며, 파라미터를 받아 실행될 때 인스턴스·실행 객체가 생성된다.

---

## 4. Step

`Step`은 잡을 구성하는 **독립적·순차적 처리 단계**다. 실제 배치 처리를 정의·제어하는 데 필요한 모든 정보를 캡슐화하며, 단순할 수도(파일→DB 적재) 복잡할 수도(업무 규칙 포함) 있다.

### 4.1. Step의 구성

하나의 `Step`은 아래 두 처리 모델 중 **하나**를 담는다(상세는 §5).

- **Chunk 지향** — `ItemReader` (+ 선택적 `ItemProcessor`) + `ItemWriter` + chunk size(commit-interval). 다건 반복 처리에 사용.
- **Tasklet 기반** — 단일 `Tasklet` 구현. read-process-write에 맞지 않는 단일 작업에 사용.

그 외 스텝 수준에서 트랜잭션 관리자, 내결함성(skip/retry), 리스너, 스코프 바인딩 등을 설정할 수 있다.

### 4.2. 독립성과 트랜잭션

- 각 `Step`은 **자체 트랜잭션 경계**를 가진다(Chunk는 chunk 단위, Tasklet은 execute 호출 단위).
- 스텝은 잡 내에서 정의된 순서대로 순차 실행된다.

### 4.3. StepExecution — 실행 추적

`Step`의 실행 1회 시도는 `StepExecution`으로 추적된다. 다음을 보유한다.

- 상태(`BatchStatus`)·`ExitStatus`/exit code
- 시작/종료 시각
- 통계: read / write / filter / commit / rollback / skip(read·process·write) count
- `ExecutionContext`(스텝 레벨) — 재시작 시 진행 위치 복원에 사용

이 데이터는 커밋 직전 `JobRepository`에 주기적으로 저장되어 **스텝 단위 재시작**을 가능하게 한다.

---

## 5. 스텝 처리 방식 — Tasklet vs Chunk

`Step`은 두 가지 처리 모델 중 하나로 동작한다.

### 5.1. Tasklet

- 단일 작업을 수행하는 모델. `Tasklet.execute()` 한 메서드를 구현한다.
- 반환값 `RepeatStatus`로 반복 여부를 제어한다: `CONTINUABLE`이면 다시 호출, `FINISHED`면 종료.
- **호출 1회당 트랜잭션 1개**가 감싸진다.
- 용도: 단일·이산적 작업 — 저장 프로시저 호출, SQL 일괄 update, 파일 삭제·정리, 셋업/클린업 등 read-process-write 패턴에 맞지 않는 작업.

### 5.2. Chunk

- **read → (process) → write** 를 반복하는 모델. 대량 레코드의 표준 처리 방식이다.
- 동작: `ItemReader`로 한 건씩 읽어 **chunk size(=commit-interval)** 만큼 모은 뒤, 모인 아이템을 `ItemWriter`로 **한 트랜잭션에 일괄 기록**하고 커밋한다. 더 읽을 항목이 없을 때까지 반복.
- chunk size가 클수록 트랜잭션 오버헤드는 줄지만 트랜잭션당 처리량(메모리·롤백 비용)이 커진다.

| 항목 | Tasklet | Chunk |
|------|---------|-------|
| 용도 | 단일 이산 작업 | 다건 반복 처리 |
| 트랜잭션 경계 | execute 호출 단위 | chunk(다건) 단위 |
| 구성요소 | `Tasklet` | `ItemReader` (+ `ItemProcessor`) + `ItemWriter` |
| 반복 제어 | `RepeatStatus`로 수동 | 읽을 항목 소진까지 자동 |

관련: [[jpa-transaction]] — 청크 처리의 트랜잭션 경계.

---

## 6. Chunk 구성요소

### 6.1. ItemReader

데이터를 한 건씩 읽어 반환한다(`null` 반환 시 입력 종료). 대표 구현:

| 분류 | 구현체 | 설명 |
|------|--------|------|
| 파일 | `FlatFileItemReader` | 구분자/고정길이 텍스트 파일을 객체로 매핑 |
| | `StaxEventItemReader` | StAX 기반 XML 조각을 객체로 매핑 |
| | `JsonItemReader` | JSON 배열을 객체로 매핑(Jackson/Gson) |
| | `MultiResourceItemReader` | 여러 파일을 순차 처리하도록 다른 reader에 위임 |
| DB(커서) | `JdbcCursorItemReader` | JDBC `ResultSet` 커서를 스트리밍 |
| | `HibernateCursorItemReader` | Hibernate HQL + `StatelessSession` 스트리밍 |
| | `StoredProcedureItemReader` | 커서를 반환하는 저장 프로시저 |
| DB(페이징) | `JdbcPagingItemReader` | `PagingQueryProvider`로 페이지 단위 조회 |
| | `JpaPagingItemReader` | JPQL + `EntityManagerFactory`로 페이지 단위 조회 |
| | `RepositoryItemReader` | Spring Data Repository 추상화 사용 |
| 메시징/기타 | `KafkaItemReader`, `AmqpItemReader`, `JmsItemReader`, `MongoItemReader`, `Neo4jItemReader` 등 | 각 브로커/저장소에서 읽기 |

> 커서 방식은 단일 커넥션으로 스트리밍하여 메모리에 유리하나 장시간 커넥션을 점유한다. 페이징 방식은 페이지마다 쿼리를 재실행하며 멀티스레드·재시작에 유리하다.[^1]

[^1]: 출처의 직접 서술이 아니라 두 방식의 동작(단일 ResultSet 스트리밍 vs 페이지 쿼리 반복)으로부터 추론.

### 6.2. ItemProcessor

읽은 아이템을 **변환·검증·필터링**한다. `process()`가 `null`을 반환하면 해당 아이템은 write 대상에서 제외된다(filter). 스텝에서 선택 요소이며, reader→writer 직결도 가능하다.

- `CompositeItemProcessor` — 여러 프로세서를 순차 체이닝
- `ClassifierCompositeItemProcessor` — 분류 로직에 따라 아이템별로 다른 프로세서로 분기

### 6.3. ItemWriter

모인 아이템 묶음(chunk)을 일괄 기록한다. 대표 구현:

| 분류 | 구현체 | 설명 |
|------|--------|------|
| 파일 | `FlatFileItemWriter` | `LineAggregator`로 텍스트 파일 출력 |
| | `StaxEventItemWriter` | OXM Marshaller로 XML 출력 |
| | `JsonFileItemWriter` | JSON 출력(Jackson/Gson) |
| DB | `JdbcBatchItemWriter` | JDBC batch update로 일괄 기록 |
| | `JpaItemWriter` | JPA merge/persist |
| | `HibernateItemWriter` | Hibernate Session save/update |
| | `RepositoryItemWriter` | Spring Data Repository 사용 |
| 메시징/기타 | `KafkaItemWriter`, `AmqpItemWriter`, `JmsItemWriter`, `MongoItemWriter`, `SimpleMailMessageItemWriter` 등 | 각 대상으로 전송 |
| 조합/데코레이터 | `CompositeItemWriter` | 여러 writer에 위임 |
| | `ClassifierCompositeItemWriter` | 분류 로직에 따라 writer 분기 |
| | `MultiResourceItemWriter` | 임계치마다 출력 리소스 롤오버 |
| | `SynchronizedItemStreamWriter` | writer를 스레드 안전하게 래핑 |

---

## Sources
- Spring Batch Reference (latest, 6.x) — Domain Language: https://docs.spring.io/spring-batch/reference/domain.html
- Spring Batch Reference (latest, 6.x) — Configuring a Step (Chunk/Tasklet): https://docs.spring.io/spring-batch/reference/step.html
- Spring Batch Reference (latest, 6.x) — ItemReaders and ItemWriters: https://docs.spring.io/spring-batch/reference/readersAndWriters.html

---

## Related pages
- [[batch-scope]] — StepScope·JobScope: 실행 시점 파라미터 Late Binding
- [[batch-job-parameters]] — JobParameters: 타입·전달·사용 방법
- [[batch-tasklet]] — Tasklet: 개념·사용 시점·예시·장단점
- [[batch-chunk]] — Chunk 지향 처리: ItemReader/Processor/Writer 상세
- [[batch-fault-tolerance]] — 재시작(Restart)·Skip·Retry 내결함성
- [[batch-flow]] — 조건별 플로우: on/from/to·ExitStatus·JobExecutionDecider
- [[batch-testing]] — 테스트: @SpringBatchTest, 잡/스텝 실행, 스코프 빈, 도메인 목킹
- [[batch-db-reader-writer]] — DB reader/writer 카테고리별(JDBC/JPA/Hibernate/Spring Data)
- [[jpa-transaction]] — 청크 처리 트랜잭션 경계, 롤백·readOnly
- [[mybatis]] — MyBatis 기반 reader/writer 연동
- [[excel]] — 대용량 엑셀 스트리밍 입출력
- [[jpa-n-plus-one]] — reader 단계 연관 조회 시 N+1 주의
- [[hikari-datasource]] — 메타데이터/처리용 커넥션 풀 설정
