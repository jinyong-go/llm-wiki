---
title: Spring Batch
updated: 2026-10-27 22:59:14
tags:
  - java
  - spring
  - spring-batch
  - batch
  - transaction
---

## 1. 개요

Spring Batch는 대용량 데이터의 일괄(batch) 처리를 위한 프레임워크다. 비대화형으로 다량의 레코드를 처리하는 작업(정산·집계, 파일↔DB 이관, ETL(Extract, Transform, Load), 대량 발송 등)을 표준화된 구조로 작성하게 한다.

핵심 제공 기능:
- 트랜잭션 관리와 청크 단위 커밋
- **상태 영속화**: 실행 이력·진행 상태를 메타데이터 테이블에 기록
- **재시작(restart)**: 실패 지점부터 재개
- **건너뛰기(skip)·재시도(retry)**: 일부 레코드 오류에 대한 내결함성
- 처리 통계(read/write/skip/commit count 등)

> [!note] 버전과 개념
> 개념·도메인 모델·처리 방식은 Spring Batch 5~6에서 동일하다(Spring Boot 3은 Batch 5, Boot 4는 Batch 6). 차이는 주로 설정 API·자동설정·메타데이터 스키마 컬럼 등 구현 레벨이며 별도 문서로 분리한다. 본 문서는 버전 무관 개념을 다루며, 출처는 최신 레퍼런스(6.x)를 따른다.
> Spring Batch 6.0부터 XML 네임스페이스 설정은 deprecated이며 Java 설정이 권장된다.

---

## 2. 도메인 모델

배치 실행은 다음 계층으로 구성된다.

| 개념 | 의미 |
|------|------|
| `Job` | 배치 프로세스 전체를 캡슐화한 최상위 단위. 하나 이상의 `Step`을 순서대로 포함 |
| `JobInstance` | 논리적 잡 실행 1건. `Job 이름 + 식별(identifying) JobParameters` 조합으로 식별 |
| `JobParameters` | 잡 실행 시 전달하는 파라미터. *식별용*은 `JobInstance` 동일성 판단에 사용, *비식별용*은 참조 데이터로만 사용 |
| `JobExecution` | `JobInstance`를 실제로 실행한 1회 시도. 재시작 시 동일 `JobInstance`에 새 `JobExecution`이 추가됨. 상태(`BatchStatus`)·시작/종료 시각 보유 |
| `Step` | 잡을 구성하는 독립적·순차적 처리 단계 |
| `StepExecution` | `Step`의 실행 1회 시도. read/write/skip/commit count 등 통계 보유 |
| `ExecutionContext` | 재시작용 상태 저장소(key/value). `JobExecution`·`StepExecution` 각각에 별도로 존재 |
| `JobRepository` | 위 도메인 객체의 영속화(CRUD) 담당. 실행 이력·상태를 메타데이터 테이블에 기록하여 중복 실행 방지·재시작·통계 조회의 근거가 됨 |
| `JobOperator` | 잡의 시작·중지·재시작을 제어하는 진입점. Batch 5는 실행 시작을 `JobLauncher`가 담당하며, 6.0에서 `JobOperator`가 `JobLauncher`를 확장하면서 `JobLauncher`는 deprecated되었다 |

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

`Job`은 배치 프로세스 전체를 캡슐화하는 최상위 컨테이너다. 여러 `Step`을 정의하고 실행 순서를 조율하는 것이 핵심 책임이다.

### 3.1. Job의 구성

하나의 `Job`은 다음을 포함한다.

- **이름(name)**: 잡을 식별하는 고유 이름. `JobInstance` 식별(`Job 이름 + 식별 JobParameters`)의 한 축이며, 메타데이터에 잡 단위로 기록된다.
- **Step의 정의와 실행 순서(flow)**: 잡을 구성하는 `Step`들과 그 순서·전이를 정의한다. 빌더에서 `start(첫 스텝)`와 `next(다음 스텝)`로 순차 흐름을 구성한다.
- **재시작 설정(restartability)**: 잡 단위 재시작 허용 여부 등 실행 정책. 상세는 [[batch-fault-tolerance]] §2.
- **`JobRepository` 의존**: 잡(및 내부 스텝)은 실행 메타데이터를 영속화할 `JobRepository`를 필요로 한다.

### 3.2. 흐름 제어

기본 흐름은 스텝의 순차 실행이지만, 조건 분기·병렬 실행을 위한 요소도 제공한다.

- **순차(sequential)**: `start` 이후 `next`로 스텝을 차례로 연결.
- **분기(decision)**: 이전 스텝의 `ExitStatus` 등에 따라 다음 스텝을 선택하는 선언적 흐름 제어.
- **병렬(split)**: 여러 스텝/플로우를 동시에 실행.
- **flow**: 재사용 가능한 스텝 묶음을 외부화한 단위.

조건 분기 상세는 [[batch-flow]].

---

## 4. Step

`Step`은 잡을 구성하는 독립적·순차적 처리 단계다. 실제 배치 처리를 정의·제어하는 데 필요한 모든 정보를 캡슐화하며, 단순할 수도(파일을 DB에 적재) 복잡할 수도(업무 규칙 포함) 있다.

### 4.1. Step의 구성

하나의 `Step`은 아래 두 처리 모델 중 하나를 담는다(상세는 §5).

- **Chunk 지향**: `ItemReader` (+ 선택적 `ItemProcessor`) + `ItemWriter` + chunk size(commit-interval). 다건 반복 처리에 사용.
- **Tasklet 기반**: 단일 `Tasklet` 구현. read-process-write에 맞지 않는 단일 작업에 사용.

그 외 스텝 수준에서 트랜잭션 관리자, 내결함성(skip/retry), 리스너, 스코프 바인딩 등을 설정할 수 있다.

### 4.2. StepExecution

`Step`의 실행 1회 시도는 `StepExecution`으로 추적된다. 다음을 보유한다.

- 상태(`BatchStatus`)·`ExitStatus`/exit code
- 시작/종료 시각
- 통계: read / write / filter / commit / rollback / skip(read·process·write) count
- `ExecutionContext`(스텝 레벨): 재시작 시 진행 위치 복원에 사용

이 데이터는 커밋 직전 `JobRepository`에 주기적으로 저장되어 스텝 단위 재시작을 가능하게 한다.

---

## 5. 처리 방식

`Step`은 두 가지 처리 모델 중 하나로 동작한다.

### 5.1. Tasklet

`Tasklet.execute()` 하나로 단일 작업을 수행하는 모델이다. 반환값 `RepeatStatus`로 반복 여부를 제어하며, 호출 1회마다 트랜잭션 1개가 감싸진다. 상세는 [[batch-tasklet]].

### 5.2. Chunk

`ItemReader`로 한 건씩 읽어 chunk size(commit-interval)만큼 모은 뒤 `ItemWriter`로 한 트랜잭션에 일괄 기록하는 모델이다. 대량 레코드의 표준 처리 방식이며, reader·processor·writer 구현체는 [[batch-chunk]]에서 다룬다.

| 항목 | Tasklet | Chunk |
|------|---------|-------|
| 용도 | 단일 이산 작업 | 다건 반복 처리 |
| 트랜잭션 경계 | execute 호출 단위 | chunk(다건) 단위 |
| 구성요소 | `Tasklet` | `ItemReader` (+ `ItemProcessor`) + `ItemWriter` |
| 반복 제어 | `RepeatStatus`로 수동 | 읽을 항목 소진까지 자동 |
| 통계 | 항목 단위 통계 없음 | read/write/filter/skip count 집계 |
| 내결함성 | 없음 | skip/retry 항목 단위 지원 |


---

## Sources
- [Spring: Spring Batch Reference, Domain Language](https://docs.spring.io/spring-batch/reference/domain.html)
- [Spring: Spring Batch Reference, Configuring a Step](https://docs.spring.io/spring-batch/reference/step.html)

---

## Related pages
- [[batch-scope]]
- [[batch-job-parameters]]
- [[batch-tasklet]]
- [[batch-chunk]]
- [[batch-fault-tolerance]]
- [[batch-flow]]
- [[batch-testing]]
- [[batch-db-reader-writer]]
- [[jpa-transaction]]
- [[mybatis]]
- [[excel]]
- [[jpa-n-plus-one]]
- [[hikari-datasource]]
