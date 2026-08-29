---
title: Spring Batch Tasklet — 개념, 사용 시점, 예시, 장단점
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring
  - spring-batch
  - batch
  - tasklet
---

## 1. Tasklet이란

`Tasklet`은 Spring Batch의 `Step`을 구성하는 두 처리 모델 중 하나로, **단일 작업을 수행**하는 방식이다(다른 하나는 Chunk 지향). 단일 메서드를 가진 함수형 인터페이스다.

```java
public interface Tasklet {
    RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext)
            throws Exception;
}
```

동작 방식:
- `TaskletStep`이 `execute()`를 **`RepeatStatus.FINISHED`를 반환하거나 예외가 발생할 때까지 반복 호출**한다.
- 반환값으로 반복을 제어한다: `FINISHED`(종료), `CONTINUABLE`(다시 호출). 대부분의 구현은 첫 호출에서 `FINISHED`를 반환해 1회만 실행된다.
- **`execute()` 호출 1회마다 트랜잭션 1개**가 감싸진다.

관련: [[batch]] — Step/처리 방식(Tasklet vs Chunk) 개요.

---

## 2. 언제 사용하는가

read-process-write(다건 반복) 패턴에 맞지 않는 **단일·이산적 작업**에 사용한다.

- 저장 프로시저 호출
- SQL/DDL 일괄 실행 (대량 update/delete, 테이블 truncate 등)
- 파일 작업 (처리 후 임시 파일 삭제·이동, 디렉터리 정리)
- 셋업/클린업 (스텝 전후 리소스 초기화·정리)
- 시스템 명령 실행

> 반대로, 데이터를 한 건씩 읽어 변환·기록하는 대량 처리는 Chunk 지향이 적합하다. (§[[batch]] 처리 방식 비교)

---

## 3. 예시

### 3.1. Tasklet 구현

파일 삭제 태스크 예시다.

```java
public class FileDeletingTasklet implements Tasklet, InitializingBean {

    private Resource directory;

    @Override
    public RepeatStatus execute(StepContribution contribution,
                                ChunkContext chunkContext) throws Exception {
        File dir = directory.getFile();
        Assert.state(dir.isDirectory(), "The resource must be a directory");

        for (File file : dir.listFiles()) {
            if (!file.delete()) {
                throw new UnexpectedJobExecutionException(
                        "Could not delete file " + file.getPath());
            }
        }
        return RepeatStatus.FINISHED;   // 1회만 실행
    }

    public void setDirectoryResource(Resource directory) {
        this.directory = directory;
    }

    @Override
    public void afterPropertiesSet() {
        Assert.state(directory != null, "Directory must be set");
    }
}
```

### 3.2. Step 등록

```java
@Bean
public Step deleteFilesStep(JobRepository jobRepository,
                            PlatformTransactionManager tx) {
    return new StepBuilder("deleteFilesStep", jobRepository)
            .tasklet(fileDeletingTasklet(), tx)   // chunk()와 함께 쓰지 않음
            .build();
}
```

람다로 간단히 작성할 수도 있다.

```java
.tasklet((contribution, chunkContext) -> {
    jdbcTemplate.update("DELETE FROM staging WHERE processed = true");
    return RepeatStatus.FINISHED;
}, tx)
```

### 3.3. 어댑터

기존 빈 메서드를 `Tasklet`으로 감싸려면 `MethodInvokingTaskletAdapter`를 쓴다.

```java
@Bean
public MethodInvokingTaskletAdapter myTasklet() {
    MethodInvokingTaskletAdapter adapter = new MethodInvokingTaskletAdapter();
    adapter.setTargetObject(fooDao());
    adapter.setTargetMethod("updateFoo");
    return adapter;
}
```

이 밖에 `Callable`을 실행하는 `CallableTaskletAdapter`, OS 명령을 실행하는 `SystemCommandTasklet` 등 내장 어댑터가 있다.

> `Tasklet`이 `StepListener`를 구현하면 `TaskletStep`이 자동으로 리스너로 등록한다.

---

## 4. 장단점

### 4.1. 장점
- **단순함** — reader/processor/writer 없이 메서드 하나로 단일 작업을 표현. 람다로도 작성 가능.
- **트랜잭션 보장** — `execute()` 호출이 트랜잭션으로 감싸져 작업 단위의 원자성을 얻는다.
- **유연성** — DB 호출, 파일/시스템 작업 등 read-process-write로 표현하기 어려운 임의 로직 수용.
- **배치 인프라 통합** — `StepExecution`·메타데이터·리스너·재시작 등 Step의 공통 기능을 그대로 활용.

### 4.2. 단점
- **청킹·통계 부재** — 자동 배칭이 없고 read/write count 같은 항목 단위 통계가 남지 않는다. 대량 데이터를 한 트랜잭션에서 처리하면 메모리·롤백 비용·락 점유가 커진다.
- **세밀한 재시작 한계** — Chunk처럼 "실패 지점부터" 재개되지 않는다. 진행 상태를 직접 `ExecutionContext`에 관리하지 않으면 보통 처음부터 다시 수행된다.[^1]
- **내결함성 기능 비적용** — Chunk의 skip/retry 같은 항목 단위 내결함성 메커니즘을 쓸 수 없다.[^2]
- **대량 처리 부적합** — 다건 반복 처리는 Chunk가 적합하며, Tasklet으로 대량 루프를 직접 구현하면 위 이점을 잃는다.

[^1]: Chunk의 재시작이 ExecutionContext 기반 실패 지점 재개라는 사실과 Tasklet에 대응 메커니즘이 없다는 점으로부터 추론.
[^2]: skip/retry가 chunk 지향 스텝 빌더(FaultTolerantStepBuilder)에만 제공되는 API 구조로부터 추론.

---

## Sources
- Spring Batch Reference (latest, 6.x) — TaskletStep: https://docs.spring.io/spring-batch/reference/step/tasklet.html
- Spring Batch Reference (latest, 6.x) — Configuring a Step: https://docs.spring.io/spring-batch/reference/step.html

---

## Related pages
- [[batch]] — Step·처리 방식(Tasklet vs Chunk) 개요
- [[batch-chunk]] — Chunk 지향 처리(대량 반복), Tasklet과 비교
- [[batch-scope]] — `@StepScope`로 Tasklet에 실행 시점 파라미터 주입
- [[batch-job-parameters]] — Tasklet에서 JobParameters 사용
- [[batch-fault-tolerance]] — 재시작/Skip/Retry (Tasklet은 항목 단위 내결함성 없음)
- [[jpa-transaction]] — execute 호출의 트랜잭션 경계
