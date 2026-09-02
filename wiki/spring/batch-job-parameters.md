---
title: Spring Batch JobParameters
updated: 2026-09-01 11:43:12
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

## 2. 지원 타입과 버전 차이

JobParameter가 지원하는 타입은 **Spring Batch 5.0에서 크게 바뀌었다.**

| 버전 | 지원 타입 | 비고 |
|------|-----------|------|
| ~4.3.x | `String`, `Long`, `Double`, `Date`(`java.util.Date`) — **4개 고정 타입** | 메타데이터에 타입별 컬럼(`STRING_VAL`/`LONG_VAL`/`DOUBLE_VAL`/`DATE_VAL`)로 저장 |
| 5.0+ (~6.x) | **임의 타입** (`JobParameter<T>`) | 타입의 FQN(정규화 이름)을 문자열로 영속화하고, 문자열 리터럴을 Spring `ConversionService`로 대상 타입으로 변환 |

### 2.1. 주요 변경
- 4개 고정 타입 → **모든 타입 사용 가능**. 파라미터 타입의 FQN과 값을 함께 저장한다.
- 메타데이터 스키마 변경: 타입별 4개 컬럼이 사라지고 `PARAMETER_NAME`/`PARAMETER_TYPE`/`PARAMETER_VALUE` 구조로 단순화.
- `JobParametersBuilder`에 시간 타입 메서드 추가: `addLocalDate`, `addLocalDateTime`, `addLocalTime`, 그리고 임의 타입용 `addJobParameter`.

> [!note] 호환성
> 4.x의 `addDate(java.util.Date)`는 5.x에서도 존재하지만, 5.x부터는 `java.time` 타입(`LocalDate` 등)을 직접 쓸 수 있다. 임의 타입을 쓰려면 해당 타입에 대한 변환기(Converter)가 `ConversionService`에 등록되어 있어야 한다.[^1]

[^1]: 5.x가 임의 타입 파라미터를 문자열로 영속화하고 ConversionService로 변환한다는 방식(§2 표)으로부터 추론.

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

> 같은 식별 파라미터로 이미 **완료된** 잡을 다시 실행하려 하면 새 `JobInstance`가 생기지 않아 재실행이 거부된다. 매번 새로 실행하려면 식별 파라미터(예: 타임스탬프)를 달리해야 한다.

---

## 4. 파라미터 전달 방법

### 4.1. 코드에서 직접 실행

`JobParametersBuilder`로 만들고 `JobLauncher.run(job, params)`(또는 `JobOperator.start`)로 전달한다.

```java
JobParameters params = new JobParametersBuilder()
        .addString("inputFile", "data.csv")
        .addLocalDate("baseDate", LocalDate.of(2026, 6, 26))
        .addLong("time", System.currentTimeMillis())   // 매 실행 새 JobInstance 유도
        .toJobParameters();

jobLauncher.run(job, params);
```

### 4.2. 커맨드라인 실행

커맨드라인 실행기(버전에 따라 `CommandLineJobRunner` 또는 `CommandLineJobOperator`)로 파라미터를 인자로 넘긴다. **표기법이 버전별로 다르다.**

| 버전 | 표기법 | 예시 |
|------|--------|------|
| ~4.x | `name(type)=value`, 식별 여부는 `+`/`-` 접두 | `+schedule.date(date)=2007/05/05 -vendor.id(long)=123` |
| 5.0+ | `name=value,type,identifying` (콤마 구분, type은 FQN) | `schedule.date=2026-06-26,java.time.LocalDate,true` |

5.0+ 기본 변환기 `DefaultJobParametersConverter`는 type·identifying 생략 시 각각 `String`·식별로 처리한다.

```bash
# 5.0+ DefaultJobParametersConverter (type 생략 시 String)
java CommandLineJobOperator io.spring.MyJobConfig start myJob \
    inputFile=data.csv \
    baseDate=2026-06-26,java.time.LocalDate
```

값에 콤마가 포함되는 경우 `JsonJobParametersConverter`(JSON 표기법)를 쓴다.

```
inputFile='{"value":"a,b,c.csv","type":"java.lang.String","identifying":"true"}'
```

### 4.3. Spring Boot

Spring Boot는 `JobLauncherApplicationRunner`로 기동 시 잡을 자동 실행하며, **커맨드라인 인자(`--key=value`)를 잡 파라미터로 전달**한다.

```bash
java -jar app.jar --inputFile=data.csv --baseDate=2026-06-26
```

---

## 5. 파라미터 사용 방법

### 5.1. 스코프 빈 + SpEL

`@StepScope`/`@JobScope` 빈에서 SpEL로 주입한다. 실행 시점에 바인딩되므로 reader/writer/tasklet에 동적 입력을 줄 때 표준 방식이다.

```java
@Bean
@StepScope
public FlatFileItemReader<Foo> reader(
        @Value("#{jobParameters['inputFile']}") String path) {
    return new FlatFileItemReaderBuilder<Foo>()
            .name("reader")
            .resource(new FileSystemResource(path))
            .build();
}
```

상세: [[batch-scope]].

### 5.2. 실행 컨텍스트에서 직접 조회

`Tasklet`·리스너 등에서는 실행 객체를 통해 직접 읽는다.

```java
public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
    JobParameters params = chunkContext.getStepContext().getStepExecution()
            .getJobParameters();
    String inputFile = params.getString("inputFile");
    LocalDate baseDate = params.getLocalDate("baseDate");   // 5.0+ 타입 접근자
    ...
}
```

---

## Sources
- Spring Batch Reference (latest, 6.x) — Running a Job: https://docs.spring.io/spring-batch/reference/job/running.html
- Spring Batch Reference (latest, 6.x) — Domain Language (JobParameters): https://docs.spring.io/spring-batch/reference/domain.html
- What's New in Spring Batch 5.0 (JobParameters 타입 변경): https://docs.spring.io/spring-batch/docs/5.0.0/reference/html/whatsnew.html
- DefaultJobParametersConverter / JsonJobParametersConverter API: https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/core/converter/JsonJobParametersConverter.html

---

## Related pages
- [[batch]] — Job/JobInstance/JobExecution 도메인 모델
- [[batch-scope]] — StepScope·JobScope에서 파라미터 Late Binding
- [[batch-fault-tolerance]] — 식별 파라미터와 JobInstance 재시작 판정
- [[jpa-transaction]] — 스텝 트랜잭션 경계
