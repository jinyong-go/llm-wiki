---
title: Spring Batch 재시작·스킵·재시도 — Restart, Skip, Retry, 내결함성
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring
  - spring-batch
  - batch
  - fault-tolerance
  - retry
---

## 1. 개요

Spring Batch는 배치 처리의 실패에 대응하는 두 축을 제공한다.

- **재시작(Restart)** — 실패·중단된 잡을 같은 `JobInstance`로 다시 실행하여 **실패 지점부터 재개**한다.
- **내결함성(Fault Tolerance)** — 처리 중 일부 레코드 오류를 **건너뛰거나(skip)** **다시 시도(retry)** 하여 스텝 전체 실패를 막는다.

이 둘은 모두 `JobRepository`가 실행 상태와 `ExecutionContext`(체크포인트)를 메타데이터 테이블에 영속화하기 때문에 가능하다. 관련: [[batch]] — 도메인 모델, [[batch-chunk]] — chunk 트랜잭션 경계.

> [!note] 버전
> 개념은 Spring Batch 4~6에서 동일하다(Boot 2→Batch 4, Boot 3→Batch 5, Boot 4→Batch 6). **재시도 설정 API는 6.0에서 변경**되었다(§4.2). 본 문서는 6.x 레퍼런스를 기준으로 하고 버전 차이를 함께 표시한다.

---

## 2. 재시작 — 잡(Job) 레벨

특정 `JobInstance`에 대해 이미 `JobExecution`이 존재하는 상태에서 잡을 다시 실행하면 그것이 **"재시작(restart)"** 이다. 잡은 **기본적으로 재시작 가능(restartable = true)** 하다.

### 2.1. 재시작 비활성화

`preventRestart()`로 잡을 재시작 불가로 만든다(restartable = false). 재시작 불가 잡을 다시 실행하려 하면 **`JobRestartException`** 이 발생한다.

```java
@Bean
public Job footballJob(JobRepository jobRepository) {
    return new JobBuilder("footballJob", jobRepository)
            .preventRestart()      // restartable = false
            // ...
            .build();
}
```

`restartable=false`는 "이 잡은 다시 시작될 수 없다"는 의미다. 재실행이 필요한 시나리오라면 개발자가 **새 `JobInstance`를 생성**해 실행할 책임이 있다(예: 식별 JobParameters에 타임스탬프 추가). [[batch-job-parameters]] 참고.

### 2.2. 완료된 잡 재실행

이미 **완료(COMPLETED)** 된 `JobInstance`를 동일한 식별 파라미터로 다시 실행하면 새 `JobInstance`가 생기지 않아 거부되며 **`JobInstanceAlreadyCompleteException`** 이 발생한다. 즉, 재시작은 **실패(FAILED)·중단(STOPPED)** 상태의 잡을 이어서 실행하는 경우에만 성립한다.[^1]

[^1]: JobInstanceAlreadyCompleteException(완료된 인스턴스 재실행)과 JobRestartException(restartable=false 재시작)의 발생 조건 구분으로부터 추론.

---

## 3. 재시작 — 스텝(Step) 레벨

재시작된 잡이 스텝들을 어떻게 처리할지는 스텝별로 설정한다.

| 설정 | 기본값 | 동작 |
|------|--------|------|
| (기본) | — | **`COMPLETED` 상태 스텝은 건너뜀** |
| `allowStartIfComplete(true)` | false | 완료 여부와 무관하게 **항상 실행** |
| `startLimit(n)` | `Integer.MAX_VALUE` | 스텝 시작 가능 횟수 제한. 초과 시 `StartLimitExceededException` |

### 3.1. allowStartIfComplete — 완료 스텝 재실행

기본적으로 재시작 시 이미 완료된 스텝은 건너뛴다. 매 실행마다 반드시 수행해야 하는 검증·정리·리소스 준비 스텝은 `allowStartIfComplete(true)`로 강제 실행한다.

```java
@Bean
public Step gameLoad(JobRepository jobRepository, PlatformTransactionManager tx) {
    return new StepBuilder("gameLoad", jobRepository)
            .allowStartIfComplete(true)        // 완료돼도 재시작 시 항상 실행
            .<String, String>chunk(10, tx)
            .reader(gameFileItemReader())
            .writer(gameWriter())
            .build();
}
```

### 3.2. startLimit — 시작 횟수 제한

수동 개입이 필요한 리소스를 무효화하는 스텝 등, 실행 횟수를 제한해야 할 때 사용한다.

```java
@Bean
public Step playerSummarization(JobRepository jobRepository, PlatformTransactionManager tx) {
    return new StepBuilder("playerSummarization", jobRepository)
            .startLimit(2)                     // 최대 2회까지만 시작 가능
            .<String, String>chunk(10, tx)
            .reader(playerSummarizationSource())
            .writer(summaryWriter())
            .build();
}
```

`startLimit(2)`인 스텝은 2번까지 시작할 수 있고, **3번째 시작 시도에서 잡이 실패**한다.

### 3.3. 실패 지점 재개

chunk 지향 스텝은 커밋 시점마다 진행 위치를 `StepExecution`의 `ExecutionContext`에 기록한다. 상태를 가지는 reader(`ItemStream` 구현)는 `open()`에서 이 컨텍스트를 읽어 **마지막 커밋 이후 지점부터 재개**한다. [[batch-chunk]] §3 참고.

---

## 4. 내결함성 — `faultTolerant()`

스텝에 skip·retry를 적용하려면 `StepBuilder`에서 `faultTolerant()`를 호출해 `FaultTolerantStepBuilder`로 전환해야 한다. **내결함성은 chunk 지향 스텝에만 적용**된다(Tasklet은 항목 단위 skip/retry 없음). [[batch-chunk]] §6 참고.

### 4.1. Skip — 결정적 오류 건너뛰기

특정 레코드의 오류를 건너뛰고 처리를 계속한다. **read / process / write 세 단계 모두**에서 발생할 수 있다.

```java
@Bean
public Step step1(JobRepository jobRepository, PlatformTransactionManager tx) {
    return new StepBuilder("step1", jobRepository)
            .<String, String>chunk(10, tx)
            .reader(flatFileItemReader())
            .writer(itemWriter())
            .faultTolerant()
            .skip(FlatFileParseException.class)   // skip 대상 예외(+하위 클래스)
            .skipLimit(10)                        // 누적 10건까지 허용
            .noSkip(FileNotFoundException.class)  // 제외할 예외
            .build();
}
```

정책을 직접 지정할 수도 있다.

```java
SkipPolicy skipPolicy = new LimitCheckingExceptionHierarchySkipPolicy(
        Set.of(FlatFileParseException.class), 10);
// ... .faultTolerant().skipPolicy(skipPolicy)
```

규칙:
- 선언한 예외와 그 **하위 클래스**가 skip 대상이다.
- read/process/write **단계별로 skip 카운트를 따로 집계**하지만, **`skipLimit`은 전체 합산** 기준으로 적용된다.
- `skipLimit=10`이면 **11번째 skip에서 스텝이 실패**한다(=10건까지만 허용).

> Skip은 다시 시도해도 결과가 같은 **결정적 오류**(파싱 오류 등 비핵심 데이터)에 적합하다. 금융 레코드처럼 누락이 곧 정합성 손상인 핵심 데이터에는 부적합하다.

### 4.2. Retry — 비결정적 오류 재시도

기다렸다 다시 시도하면 성공할 수 있는 **비결정적 오류**(락 경합 등)에 대해 **항목 단위로 재시도**한다.

> [!note] 버전 차이 (설정 API)
> 재시도 설정 API가 **Spring Batch 6.0에서 변경**되었다. Spring Retry 의존이 제거되고 `RetryPolicy` 빌더 방식으로 통합되었다.

**~5.x — 빌더 메서드 직접 지정**
```java
return new StepBuilder("step1", jobRepository)
        .<String, String>chunk(2, tx)
        .reader(itemReader()).writer(itemWriter())
        .faultTolerant()
        .retry(DeadlockLoserDataAccessException.class)
        .retryLimit(3)
        .build();
```

**6.0+ — `RetryPolicy.builder()`**
```java
RetryPolicy retryPolicy = RetryPolicy.builder()
        .maxRetries(3)
        .includes(Set.of(DeadlockLoserDataAccessException.class))
        .build();

return new StepBuilder("step1", jobRepository)
        .<String, String>chunk(2, tx)
        .reader(itemReader()).writer(itemWriter())
        .faultTolerant()
        .retryPolicy(retryPolicy)
        .build();
```

특정 예외를 재시도 대상에서 제외하려면 `noRetry(Exception.class)`를 사용한다.

> 재시도 대상으로 적합한 예: `DeadlockLoserDataAccessException`(데드락 패자) — 잠시 후 재시도 시 성공 가능. 부적합한 예: `FlatFileParseException` — 같은 입력은 항상 같은 결과이므로 재시도 무의미. 데드락 자체의 해결은 [[hikari-deadlock]] 참고.

### 4.3. Skip과 Retry 조합

같은 예외를 retry와 skip 모두로 선언하면, **재시도 한도를 모두 소진한 뒤 skip 대상으로 넘어간다**.[^2] 즉 "n회 재시도 후에도 실패하면 건너뛴다"를 표현할 수 있다.

[^2]: 출처에 순서의 직접 명시는 없으며, retry 한도 소진 후 예외가 다시 던져질 때 skip 판정이 적용되는 처리 구조로부터 추론.

---

## 5. 롤백과 리스너 상호작용

### 5.1. 롤백 동작과 `noRollback`

chunk 1개는 트랜잭션 1개다([[batch-chunk]]). **write 도중 예외가 나면 해당 chunk 트랜잭션이 롤백**되고, 내결함성 스텝은 아이템을 **한 건씩 다시 읽어(scan)** 처리하며 어느 항목이 문제인지 가려 skip/retry를 적용한다.

`noRollback(Exception.class)`은 read/process 중 해당 예외를 **롤백 없이 무시**하도록 표시한다.

```java
.faultTolerant().noRollback(ValidationException.class)
```

- write 단계에서는 `noRollback`이 **무시**된다 — 롤백 없는 skip/retry를 보장할 수 없기 때문이다.
- 관련 트랜잭션 속성(전파·readOnly·롤백 규칙)은 [[jpa-transaction]] 참고.

### 5.2. 리스너

- **`SkipListener`** — `onSkipInRead(Throwable)`, `onSkipInProcess(item, Throwable)`, `onSkipInWrite(item, Throwable)`. write 단계 skip 콜백은 chunk 내 다른 오류 가능성 때문에 **커밋 직전에 호출**된다.
- **`RetryListener`** — 재시도 시도/성공/실패 시점에 콜백. `FaultTolerantStepBuilder`에 등록한다.

---

## 6. 요약

| 기능 | 핵심 API | 기본값 | 적용 범위 |
|------|----------|--------|-----------|
| 잡 재시작 금지 | `preventRestart()` | restartable=true | Job |
| 완료 스텝 재실행 | `allowStartIfComplete(true)` | 완료 스텝 skip | Step |
| 스텝 시작 횟수 제한 | `startLimit(n)` | `Integer.MAX_VALUE` | Step |
| 내결함성 활성화 | `faultTolerant()` | 비활성 | chunk Step |
| 건너뛰기 | `skip(ex)` + `skipLimit(n)` / `skipPolicy` | 없음 | read/process/write |
| 재시도 | (6.0+) `retryPolicy(RetryPolicy.builder()...)` / (~5.x) `retry(ex)`+`retryLimit(n)` | 없음 | process/write |
| 롤백 제외 | `noRollback(ex)` | 예외 시 롤백 | read/process |

관련 예외: `JobRestartException`(재시작 불가 잡 재시작), `JobInstanceAlreadyCompleteException`(완료 잡 재실행), `StartLimitExceededException`(스텝 시작 한도 초과).

---

## Sources
- Spring Batch Reference (6.x) — Configuring Skip Logic: https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/configuring-skip.html
- Spring Batch Reference (6.x) — Configuring Retry Logic: https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/retry-logic.html
- Spring Batch Reference (6.x) — Configuring a Step for Restart: https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/restart.html
- Spring Batch Reference (6.x) — Configuring a Job (restartability): https://docs.spring.io/spring-batch/reference/job/configuring-job.html
- Spring Batch Reference (6.x) — Intercepting Step Execution (SkipListener/RetryListener): https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/intercepting-execution.html
- SkipListener API: https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/core/SkipListener.html
- FaultTolerantStepBuilder API (noRollback): https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/core/step/builder/FaultTolerantStepBuilder.html

---

## Related pages
- [[batch]] — 도메인 모델(JobInstance/JobExecution/ExecutionContext), Step 처리 방식
- [[batch-chunk]] — chunk 트랜잭션 경계, ItemReader/Processor/Writer
- [[batch-job-parameters]] — 식별 파라미터와 JobInstance 재시작 판정
- [[batch-flow]] — 조건별 플로우, stopAndRestart·ExitStatus 분기
- [[batch-tasklet]] — Tasklet은 항목 단위 내결함성 없음
- [[jpa-transaction]] — 트랜잭션 경계·롤백 규칙
- [[hikari-deadlock]] — 재시도 대상 데드락 예외의 근본 원인·해결
