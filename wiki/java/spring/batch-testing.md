---
title: Spring Batch 테스트
updated: 2026-10-27 22:59:14
tags:
  - java
  - spring
  - spring-batch
  - batch
  - testing
---

## 1. 개요

배치 잡 테스트는 비동기 실행·메타데이터 상태·실행 시점 바인딩(스코프 빈) 때문에 일반 Spring 테스트와 다른 어려움이 있다. `spring-batch-test` 모듈이 이를 위한 헬퍼·리스너·러너를 제공한다.

테스트 단위는 세 층위로 나뉜다.

| 층위 | 대상 | 핵심 도구 |
|------|------|-----------|
| End-to-End | 잡 전체 | `launchJob()` / `startJob()` |
| 스텝 단위 | 개별 `Step` | `launchStep()` / `startStep()` |
| 컴포넌트 단위 | `@StepScope` reader/writer, 리스너 | `StepScopeTestUtils`, `MetaDataInstanceFactory` |

관련: [[batch]] 도메인 모델, [[batch-scope]] StepScope, [[batch-flow]] 리스너.

---

## 2. 의존성

`spring-boot-starter-batch`에 더해 테스트 스코프로 `spring-batch-test`(와 `spring-boot-starter-test`)를 추가한다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.batch</groupId>
    <artifactId>spring-batch-test</artifactId>
    <scope>test</scope>
</dependency>
```

---

## 3. `@SpringBatchTest`

테스트 클래스에 붙이면 다음을 테스트 컨텍스트에 주입한다.

- **`JobLauncherTestUtils`** (~5.x) / **`JobOperatorTestUtils`** (6.0+): 잡·스텝 실행 트리거
- **`JobRepositoryTestUtils`**: 메타데이터(`JobExecution`) 생성·정리
- **`StepScopeTestExecutionListener`**, **`JobScopeTestExecutionListener`**: 스코프 빈 테스트용 실행 컨텍스트 제공

```java
@SpringBatchTest
@SpringJUnitConfig(MyBatchConfig.class)
class MyBatchTest {

    @Autowired JobLauncherTestUtils jobLauncherTestUtils;
    @Autowired JobRepositoryTestUtils jobRepositoryTestUtils;

    @AfterEach
    void cleanUp() {
        jobRepositoryTestUtils.removeJobExecutions();   // 테스트 간 메타데이터 정리
    }

    private JobParameters defaultJobParameters() {
        return new JobParametersBuilder()
                .addString("file.input", TEST_INPUT)
                .addString("file.output", TEST_OUTPUT)
                .toJobParameters();
    }
}
```

> [!note] 메타데이터 격리
> Spring Boot 자동설정의 `JobRepository`는 메타데이터를 저장소에 기록한다. Boot 3은 `DataSource`를, Boot 4는 In-memory·JDBC(Java Database Connectivity)·MongoDB 중 하나를 저장소로 쓴다.[^1] 같은 클래스에서 여러 테스트를 돌리면 `removeJobExecutions()`로 정리해야 하고, 여러 테스트 클래스를 함께 돌리면 동일 데이터소스를 쓰는 `JobRepository`끼리 충돌하므로 `@DirtiesContext`로 컨텍스트를 무효화한다.

> [!note] 버전 차이 (6.0)
> 6.0에서 `JobLauncher`가 `JobOperator`로 대체되면서 테스트 유틸도 `JobLauncherTestUtils`에서 `JobOperatorTestUtils`로, 메서드도 `launchJob`/`launchStep`에서 `startJob`/`startStep`으로 바뀌었다. 본 문서 예시는 5.x(`JobLauncherTestUtils`) 기준이며, 6.0에서는 명칭만 치환하면 된다.

---

## 4. End-to-End 잡 테스트

잡 전체를 실행하고 종료 상태·출력 결과를 검증한다. 입력 파일·출력 경로는 `JobParameters`로 전달한다([[batch-job-parameters]]).

```java
@Test
void givenReferenceOutput_whenJobExecuted_thenSuccess() throws Exception {
    JobExecution jobExecution = jobLauncherTestUtils.launchJob(defaultJobParameters());

    assertEquals("transformBooksRecords", jobExecution.getJobInstance().getJobName());
    assertEquals("COMPLETED", jobExecution.getExitStatus().getExitCode());

    // 파일 출력 비교 (AssertJ)
    assertThat(new File(TEST_OUTPUT))
            .hasSameTextualContentAs(new File(EXPECTED_OUTPUT));
}
```

- `launchJob()`은 기본 파라미터로, `launchJob(JobParameters)`는 지정 파라미터로 실행한다.
- `JobExecution`의 `ExitStatus`(exit code) / `BatchStatus` / write count 등을 검증한다.
- 출력 파일 비교는 AssertJ의 `hasSameTextualContentAs`를 쓴다. `spring-batch-test`의 `AssertFile`은 5.0에서 deprecated되었고 5.2에서 제거되었다.

---

## 5. 개별 스텝 테스트

잡 전체 실행이 비싸면 스텝만 격리해 테스트한다. `launchStep`은 지정 스텝을 단일 스텝 잡으로 감싸 실행한다.

```java
@Test
void whenStep1Executed_thenSuccess() throws Exception {
    JobExecution jobExecution = jobLauncherTestUtils.launchStep("step1", defaultJobParameters());

    Collection<StepExecution> stepExecutions = jobExecution.getStepExecutions();
    assertEquals(1, stepExecutions.size());
    assertEquals("COMPLETED", jobExecution.getExitStatus().getExitCode());
}

@Test
void whenStep2Executed_thenSuccess() {
    JobExecution jobExecution = jobLauncherTestUtils.launchStep("step2", defaultJobParameters());

    // StepExecution 통계로 처리 건수 검증
    jobExecution.getStepExecutions()
            .forEach(se -> assertEquals(8, se.getWriteCount()));
}
```

스텝 출력 파일을 §4와 같이 비교하거나, `StepExecution`의 `getWriteCount()`/`getReadCount()`/`getSkipCount()` 등 통계로 검증한다.

---

## 6. `@StepScope` 컴포넌트 테스트

`@StepScope` reader/writer는 스텝 실행 시점에 `JobParameters`/`StepExecution`을 Late Binding하므로([[batch-scope]]), 테스트에서 가짜 `StepExecution` 컨텍스트를 만들어 주어야 한다.

### 6.1. StepScopeTestUtils.doInStepScope

`MetaDataInstanceFactory.createStepExecution(jobParameters)`로 `StepExecution`을 만들고, `doInStepScope` 블록 안에서 컴포넌트를 직접 구동한다. 직접 제어하므로 스트림 `open`/`close`는 테스트가 책임진다.

```java
@Autowired ItemReader<BookRecord> itemReader;   // @StepScope FlatFileItemReader

@Test
void whenReaderCalled_thenSuccess() throws Exception {
    StepExecution stepExecution =
            MetaDataInstanceFactory.createStepExecution(defaultJobParameters());

    StepScopeTestUtils.doInStepScope(stepExecution, () -> {
        itemReader.open(stepExecution.getExecutionContext());
        BookRecord r = itemReader.read();
        assertThat(r.getBookName()).isEqualTo("Foundation");
        itemReader.close();
        return null;
    });
}
```

writer도 동일하게 `doInStepScope` 안에서 `open`, `write(items)`, `close` 순으로 호출한 뒤 출력 파일을 비교한다.

### 6.2. StepScopeTestExecutionListener

`@SpringBatchTest`가 등록하는 리스너 방식. 테스트에 `StepExecution`을 반환하는 팩토리 메서드를 두면 리스너가 시그니처로 감지해 스코프 컨텍스트로 사용한다.

```java
public StepExecution getStepExecution() {
    StepExecution execution = MetaDataInstanceFactory.createStepExecution();
    execution.getExecutionContext().putString("input.data", "foo,bar,spam");
    return execution;
}

@Test
void testReader() { assertNotNull(reader.read()); }
```

`JobScope` 빈은 `JobScopeTestExecutionListener` + `getJobExecution()` 팩토리 메서드로 동일하게 테스트한다.

---

## 7. 도메인 객체 목킹

`StepExecution`이 `JobExecution`을, `JobExecution`이 `JobInstance`와 `JobParameters`를 참조하는 계층 의존 때문에 수동 생성이 번거롭다. 팩토리가 유효한 스텁을 간단히 만들어 준다.

```java
StepExecution stepExecution = MetaDataInstanceFactory.createStepExecution();
```

리스너(`StepExecutionListener.afterStep` 등) 단위 테스트에 적합하다. 예: read count 0일 때 `FAILED`를 반환하는 리스너 검증.

```java
@Test
void testAfterStep() {
    StepExecution stepExecution = MetaDataInstanceFactory.createStepExecution();
    stepExecution.setExitStatus(ExitStatus.COMPLETED);
    stepExecution.setReadCount(0);

    ExitStatus exitStatus = new NoWorkFoundStepExecutionListener().afterStep(stepExecution);
    assertEquals(ExitStatus.FAILED.getExitCode(), exitStatus.getExitCode());
}
```

리스너 종류는 [[batch-flow]] §5.3 참고.

---

## 8. 보조 설정

- **자동 실행 비활성화**: 테스트에서 잡이 부팅 시 자동 실행되지 않도록 `spring.batch.job.enabled=false`로 설정한다. `spring.batch.job.name`은 `Job` 빈이 여러 개일 때 기동 시 실행할 잡을 지정하는 속성이다.
- 테스트 입력 파일은 `@StepScope` reader에 `@Value("#{jobParameters['file.input']}")`로 주입하므로, 테스트는 `JobParameters`만 바꿔 다른 입력으로 재사용할 수 있다.


---

## Sources
- [Baeldung: Testing a Spring Batch Job](https://www.baeldung.com/spring-batch-testing-job)
- `raw/java/spring/Testing a Spring Batch Job.md`
- [Spring: Spring Batch Reference, Unit Testing](https://docs.spring.io/spring-batch/reference/testing.html)
- [Spring: Spring Batch 5.2 API, JobLauncherTestUtils](https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/test/JobLauncherTestUtils.html)
- [Spring: Spring Boot Reference, Spring Batch](https://docs.spring.io/spring-boot/reference/io/spring-batch.html)
- [Spring: Spring Batch 5.0 API, Deprecated List](https://docs.spring.io/spring-batch/docs/5.0.2/api/deprecated-list.html)

---

## Related pages
- [[batch]]
- [[batch-scope]]
- [[batch-job-parameters]]
- [[batch-flow]]
- [[batch-fault-tolerance]]
- [[batch-chunk]]

---

[^1]: raw 출처(Baeldung)는 "in-memory JobRepository"로 서술하지만, Boot 3 배치 자동설정은 `DataSource` 빈이 있을 때만 활성화되고(`@ConditionalOnBean(DataSource.class)`), Boot 4 레퍼런스는 In-memory·JDBC·MongoDB 저장소를 자동설정 대상으로 명시한다. Baeldung의 서술은 임베디드 DB(H2 등) 사용을 가리킨 것으로 보인다.
