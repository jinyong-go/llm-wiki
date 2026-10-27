---
title: Spring Batch StepScope·JobScope
updated: 2026-10-27 22:59:14
tags:
  - java
  - spring
  - spring-batch
  - batch
  - bean-scope
---

## 1. 개요

`@StepScope`·`@JobScope`는 Spring Batch가 제공하는 커스텀 빈 스코프다. 기본 빈은 singleton이라 애플리케이션 기동 시 1회 생성되지만, 이 스코프를 적용하면 빈 생성 시점을 Step/Job 실행 시점으로 지연한다.

- `@StepScope`: `StepExecution`마다 새 빈 인스턴스 생성
- `@JobScope`: `JobExecution`마다 새 빈 인스턴스 생성

이 지연 생성이 Late Binding(지연 바인딩)의 토대가 된다. 즉 실행 시점에야 알 수 있는 값(`JobParameters`, 실행 컨텍스트)을 빈에 주입할 수 있다.

---

## 2. 동작 원리

### 2.1. Late Binding

`JobParameters`는 잡을 실행할 때 결정된다. 그러나 빈 설정은 기동 시점에 정의되므로, 일반 singleton 빈은 실행 시점 값에 접근할 수 없다.

스코프 빈은 생성이 실행 시점까지 미뤄지므로, SpEL(Spring Expression Language) `#{...}`로 실행 시점 값을 주입받을 수 있다.

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

> singleton 빈에서 `#{jobParameters[...]}`를 쓰면 `'jobParameters' cannot be found` 류 오류가 난다. `JobParameters`·실행 컨텍스트 SpEL은 스코프 빈에서만 유효하다.[^1]

### 2.2. 프록시

스코프 빈은 실제로는 프록시 객체로 주입된다. `@StepScope`/`@JobScope`는 내부적으로 `@Scope(value="step"|"job", proxyMode=TARGET_CLASS)`에 해당한다. 다른 빈(또는 Step 정의)은 프록시를 참조하고, 실제 대상 객체는 스코프가 활성화될 때(Step/Job 실행 시) 생성·바인딩된다.

- `FlatFileItemReader`처럼 `ItemStream`을 구현한 컴포넌트는 반환 타입을 구체 타입으로 선언해야 프록시가 `open`/`update`/`close` 계약을 올바로 위임한다.

### 2.3. 스코프 등록

`StepScope`·`JobScope`는 스프링 컨테이너에 등록되어 있어야 한다. Spring Boot 배치 자동설정이 사용하는 `DefaultBatchConfiguration`이 `ScopeConfiguration`을 import하므로 별도 설정 없이 등록된다. `@EnableBatchProcessing`을 붙이거나 `DefaultBatchConfiguration`을 상속하면 Boot 배치 자동설정은 비활성화되지만, 두 방식 모두 `ScopeConfiguration`을 import하므로 스코프는 그대로 등록된다.

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
> `Step` 빈 본체를 step-scoped로 만들면 안 된다. 스코프는 스텝의 구성요소(reader/writer/tasklet)에만 적용한다.

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

> [!warning] 멀티 스레드·파티션 스텝
> 멀티 스레드·파티션 스텝에서는 JobScope 빈을 쓰지 않는다. 프레임워크가 생성하지 않은 스레드는 스코프 셋업을 관리할 수 없다.

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

## 6. 상태 격리

실행마다 별도 인스턴스를 생성하므로, 멀티 스레드·병렬 스텝에서 상태를 공유하지 않아 동시성 문제가 줄어든다. `ItemReader`처럼 내부에 진행 상태를 가지는 컴포넌트에 특히 중요하다.[^2]

---

## Sources
- [Spring: Spring Batch Reference, Late Binding of Job and Step Attributes](https://docs.spring.io/spring-batch/reference/step/late-binding.html)
- [jojoldu: Spring Batch 가이드 - Spring Batch Scope & Job Parameter](https://jojoldu.tistory.com/330)
- [Spring: Spring Boot Reference, Spring Batch](https://docs.spring.io/spring-boot/reference/io/spring-batch.html)

---

## Related pages
- [[batch]]
- [[batch-job-parameters]]
- [[jpa-transaction]]
- [[aop]]
- [[batch-testing]]

---

[^1]: jojoldu 글(Sources)의 설명.
[^2]: jojoldu 글(Sources)의 설명.
