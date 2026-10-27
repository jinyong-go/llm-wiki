---
title: Spring Batch JobParameters
updated: 2026-10-27 22:48:33
tags:
  - java
  - spring
  - spring-batch
  - batch
  - job-parameters
---

## 1. 개요

`JobParameters`는 배치 잡을 실행할 때 전달하는 **키/값 집합**이다. 두 가지 역할을 한다.

- **식별(identification)** — `JobInstance = Job 이름 + 식별 JobParameters`. 식별 파라미터가 같으면 같은 `JobInstance`(재시작), 다르면 새 `JobInstance`.
- **참조 데이터(reference data)** — 실행 중 비즈니스 로직에서 사용하는 입력값(파일 경로, 기준일자 등).

관련: [[batch]] — JobInstance/JobExecution 도메인 모델, [[batch-scope]] — 스코프 빈에서의 파라미터 Late Binding.

---

## 2. 지원 타입

`JobParameter<T>`는 임의 타입을 지원한다. 타입의 FQN(정규화 이름)과 값을 문자열로 영속화하고, 읽을 때 Spring `ConversionService`로 대상 타입으로 변환한다. 메타데이터 테이블에는 `PARAMETER_NAME`/`PARAMETER_TYPE`/`PARAMETER_VALUE` 컬럼으로 저장된다.

`JobParametersBuilder`는 `addString`·`addLong`·`addDouble`·`addDate` 외에 `addLocalDate`·`addLocalDateTime`·`addLocalTime`, 임의 타입용 `addJobParameter`를 제공한다. 임의 타입을 쓰려면 해당 타입에 대한 변환기(Converter)가 `ConversionService`에 등록되어 있어야 한다.[^1]

---

## 3. 식별 / 비식별 파라미터

각 파라미터는 **식별 여부(identifying flag)** 를 가진다.

- 기본값은 **식별(identifying = true)** — `JobInstance` 동일성 판단에 포함.
- 비식별로 지정하면 실행 시 전달되지만 `JobInstance` 식별에는 영향을 주지 않는다(순수 참조 데이터, 예: 재시작 시 달라지는 부가 정보).

```java
JobParameters params = new JobParametersBuilder()
        .addString("inputFile", "data.csv", true)   // 식별
        .addLong("requestedBy", 123L, false)         // 비식별
        .toJobParameters();
```

매번 새 `JobInstance`로 실행하려면 식별 파라미터(예: 타임스탬프)를 달리한다. 완료된 잡을 같은 식별 파라미터로 다시 실행할 때의 동작은 [[batch-fault-tolerance]] §2.2.

---

## 4. 파라미터 전달 방법

### 4.1. 코드에서 직접 실행

`JobParametersBuilder`로 만들고 Batch 5는 `JobLauncher.run(job, params)`, Batch 6은 `JobOperator.start(job, params)`로 전달한다. 6.0에서 `JobLauncher`는 deprecated되었다.

```java
JobParameters params = new JobParametersBuilder()
        .addString("inputFile", "data.csv")
        .addLocalDate("baseDate", LocalDate.of(2026, 6, 26))
        .addLong("time", System.currentTimeMillis())   // 매 실행 새 JobInstance 유도
        .toJobParameters();

jobLauncher.run(job, params);        // Batch 6: jobOperator.start(job, params)
```

### 4.2. 커맨드라인 실행

커맨드라인 실행기(Batch 5는 `CommandLineJobRunner`, Batch 6은 `CommandLineJobOperator`)로 파라미터를 `name=value,type,identifying` 형식(콤마 구분, type은 FQN)으로 넘긴다. 예: `schedule.date=2026-06-26,java.time.LocalDate,true`.

기본 변환기 `DefaultJobParametersConverter`는 type·identifying 생략 시 각각 `String`·식별로 처리한다.

```bash
# Batch 6 CommandLineJobOperator (type 생략 시 String)
java CommandLineJobOperator io.spring.MyJobConfig start myJob \
    inputFile=data.csv \
    baseDate=2026-06-26,java.time.LocalDate
```

값에 콤마가 포함되는 경우 `JsonJobParametersConverter`(JSON 표기법)를 쓴다.

```
inputFile='{"value":"a,b,c.csv","type":"java.lang.String","identifying":"true"}'
```

### 4.3. Spring Boot

Spring Boot는 `JobLauncherApplicationRunner`로 기동 시 잡을 자동 실행한다. 잡 파라미터는 `--` 없이 `key=value` 형식의 커맨드라인 인자로 전달한다. `--`로 시작하는 인자는 Spring `Environment` 속성으로 변환되므로 잡 파라미터 전달에 쓰지 않는다.

```bash
java -jar app.jar inputFile=data.csv baseDate=2026-06-26,java.time.LocalDate
```

실패한 잡을 재시작할 때는 식별·비식별 파라미터를 모두 다시 지정해야 한다. 비식별 파라미터는 이전 실행에서 복사되지 않는다.

---

## 5. 파라미터 사용 방법

### 5.1. 스코프 빈 + SpEL

`@StepScope`/`@JobScope` 빈에서 `@Value("#{jobParameters['inputFile']}")` 형태의 SpEL로 주입한다. 실행 시점에 바인딩되므로 reader/writer/tasklet에 동적 입력을 줄 때 표준 방식이다. 예시와 동작 원리는 [[batch-scope]] §2.1.

### 5.2. 실행 컨텍스트에서 직접 조회

`Tasklet`·리스너 등에서는 실행 객체를 통해 직접 읽는다.

```java
public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
    JobParameters params = chunkContext.getStepContext().getStepExecution()
            .getJobParameters();
    String inputFile = params.getString("inputFile");
    LocalDate baseDate = params.getLocalDate("baseDate");
    ...
}
```

---

## Sources
- [Spring: Spring Batch Reference, Running a Job](https://docs.spring.io/spring-batch/reference/job/running.html)
- [Spring: Spring Batch Reference, Domain Language](https://docs.spring.io/spring-batch/reference/domain.html)
- [Spring: What's New in Spring Batch 5.0](https://docs.spring.io/spring-batch/docs/5.0.0/reference/html/whatsnew.html)
- [Spring: Spring Boot How-to, Batch Applications](https://docs.spring.io/spring-boot/how-to/batch.html)
- [Spring: Spring Batch API, JsonJobParametersConverter](https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/core/converter/JsonJobParametersConverter.html)

---

## Related pages
- [[batch]]
- [[batch-scope]]
- [[batch-fault-tolerance]]
- [[jpa-transaction]]

---

[^1]: 임의 타입 파라미터를 문자열로 영속화하고 ConversionService로 변환한다는 방식(§2)으로부터 추론.
