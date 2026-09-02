---
title: Spring Batch StepScope·JobScope
updated: 2026-09-01 11:43:12
tags:
  - java
  - spring
  - spring-batch
  - batch
  - bean-scope
---

## 1. 개요

`@StepScope`·`@JobScope`는 Spring Batch가 제공하는 **커스텀 빈 스코프**다. 기본 빈은 singleton이라 애플리케이션 기동 시 1회 생성되지만, 이 스코프를 적용하면 **빈 생성 시점을 Step/Job 실행 시점으로 지연**한다.

- `@StepScope` — `StepExecution`마다 새 빈 인스턴스 생성
- `@JobScope` — `JobExecution`마다 새 빈 인스턴스 생성 (Spring Batch 3.0 도입)

이 지연 생성이 **Late Binding**(지연 바인딩)의 토대가 된다. 즉 실행 시점에야 알 수 있는 값(`JobParameters`, 실행 컨텍스트)을 빈에 주입할 수 있다.

관련: [[batch]] — Job/Step/실행 도메인 모델.

---

## 2. 동작 원리 — Late Binding과 프록시

### 2.1. Late Binding

`JobParameters`는 잡을 실행할 때(`JobLauncher.run(job, params)`) 결정된다. 그러나 빈 설정은 기동 시점에 정의되므로, 일반 singleton 빈은 실행 시점 값에 접근할 수 없다.

스코프 빈은 생성이 실행 시점까지 미뤄지므로, SpEL `#{...}`로 실행 시점 값을 주입받을 수 있다.

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

> singleton 빈에서 `#{jobParameters[...]}`를 쓰면 `'jobParameters' cannot be found` 류 오류가 난다. `JobParameters`·실행 컨텍스트 SpEL은 **스코프 빈에서만** 유효하다. (출처: jojoldu)

### 2.2. 프록시

스코프 빈은 실제로는 **프록시 객체**로 주입된다. `@StepScope`/`@JobScope`는 내부적으로 `@Scope(value="step"|"job", proxyMode=TARGET_CLASS)`에 해당한다. 다른 빈(또는 Step 정의)은 프록시를 참조하고, 실제 대상 객체는 스코프가 활성화될 때(Step/Job 실행 시) 생성·바인딩된다.

- `FlatFileItemReader`처럼 `ItemStream`을 구현한 컴포넌트는 반환 타입을 구체 타입으로 선언해야 프록시가 `open`/`update`/`close` 계약을 올바로 위임한다. (출처: 공식 문서)

### 2.3. 스코프 등록

`StepScope`·`JobScope`는 스프링 컨테이너에 등록되어 있어야 한다. `@EnableBatchProcessing`(또는 XML `batch` 네임스페이스, 명시적 스코프 빈 정의)로 자동 등록된다.

---

## 3. StepScope

- 생성 단위: `StepExecution` (스텝 실행마다 새 인스턴스).
- 주 대상: `ItemReader`, `ItemProcessor`, `ItemWriter`, `Tasklet` 등 스텝 구성요소.
- 접근 가능 컨텍스트: `jobParameters`, `jobExecutionContext`, `stepExecutionContext`.

```java
@Bean
@StepScope
public Tasklet myTasklet(
        @Value("#{jobParameters['fileName']}") String fileName) {
    return (contribution, chunkContext) -> {
        // fileName은 잡 실행 시점에 바인딩됨
        return RepeatStatus.FINISHED;
    };
}
```

> [!warning] Step 자체에는 StepScope를 쓰지 않는다
> `Step` 빈 본체를 step-scoped로 만들면 안 된다. 스코프는 스텝의 **구성요소**(reader/writer/tasklet)에만 적용한다. (출처: 공식 문서)

---

## 4. JobScope

- 생성 단위: `JobExecution` (잡 실행마다 새 인스턴스).
- 접근 가능 컨텍스트: `jobParameters`, `jobExecutionContext`.
- 용도: 잡 레벨 파라미터화. 예) `Step` 정의 자체를 잡 파라미터로 동적 구성(예: chunk size).

```java
@Bean
@JobScope
public Step step(JobRepository jobRepository,
                 PlatformTransactionManager tx,
                 @Value("#{jobParameters['chunkSize']}") int chunkSize) {
    return new StepBuilder("step", jobRepository)
            .<Integer, Integer>chunk(chunkSize, tx)
            .reader(reader())
            .writer(writer())
            .build();
}
```

---

## 5. SpEL 표현식

스코프 빈에서 `@Value`로 주입 가능한 실행 시점 값:

| 표현식 | 의미 | StepScope | JobScope |
|--------|------|:---:|:---:|
| `#{jobParameters['key']}` | 잡 실행 파라미터 | ✓ | ✓ |
| `#{jobExecutionContext['key']}` | Job 레벨 `ExecutionContext` | ✓ | ✓ |
| `#{stepExecutionContext['key']}` | Step 레벨 `ExecutionContext` | ✓ | ✗ |

- 맵 키는 따옴표로 감싼다: `#{jobParameters['inputFile']}`.

---

## 6. 사용 이유·장점

1. **JobParameter Late Binding** — 컨트롤러/서비스에서 실행 시점에 파라미터를 동적으로 넘기고, 그 값을 reader/writer 등에 바인딩할 수 있다. 외부 입력(요청 파라미터 등) 기반 배치에 필수.
2. **Thread Safety / 상태 격리** — 실행마다 별도 인스턴스를 생성하므로, 멀티 스레드·병렬 스텝에서 상태를 공유하지 않아 동시성 문제가 줄어든다. (특히 `ItemReader`처럼 내부에 진행 상태를 가지는 컴포넌트에 중요)

(출처: jojoldu)

---

## 7. 주의사항

- **Step 빈 자체에 `@StepScope` 금지** — 구성요소에만 적용(§3).
- **프록시/반환 타입** — `ItemStream` 구현 컴포넌트는 구체 타입으로 선언(§2.2).
- **멀티 스레드·파티션 스텝에서 JobScope 빈 사용 금지** — 프레임워크가 생성하지 않은 스레드는 스코프 셋업을 관리할 수 없다. (출처: 공식 문서)
- **스코프 등록 필요** — `@EnableBatchProcessing` 등으로 스코프가 등록되어 있어야 동작.

---

## Sources
- Spring Batch Reference (latest, 6.x) — Late Binding of Job and Step Attributes: https://docs.spring.io/spring-batch/reference/step/late-binding.html
- jojoldu, "Spring Batch 가이드 - Spring Batch Scope & Job Parameter": https://jojoldu.tistory.com/330

---

## Related pages
- [[batch]] — Job/Step/실행 도메인 모델, Chunk·Tasklet
- [[batch-job-parameters]] — JobParameters: 타입·전달·사용 방법
- [[jpa-transaction]] — 스텝 트랜잭션 경계
- [[aop]] — 스코프 프록시의 기반인 스프링 프록시 메커니즘
- [[batch-testing]] — `@StepScope` 빈 테스트(StepScopeTestUtils/StepScopeTestExecutionListener)
