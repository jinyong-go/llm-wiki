---
title: Spring Batch 조건별 플로우 — 순차/조건 전이, ExitStatus, JobExecutionDecider
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring
  - spring-batch
  - batch
  - flow
---

## 1. 개요

잡(Job)은 여러 `Step`을 조합한다. 스텝들이 분기(`if`처럼 여러 경로)를 가지면 그 흐름을 **조건부 플로우(conditional flow)** 라 한다. Spring Batch는 두 가지 분기 방법을 제공한다.

- **ExitStatus 기반 전이** — 스텝 종료 시의 exit code를 패턴 매칭해 다음 스텝을 선택.
- **`JobExecutionDecider`** — 스텝 상태 밖의 외부 요인까지 반영하는 프로그래밍 분기.

관련: [[batch]] §3.2(흐름 제어), [[batch-fault-tolerance]](`stopAndRestart`·재시작 연계).

---

## 2. BatchStatus vs ExitStatus

조건 전이는 `BatchStatus`가 아니라 **`ExitStatus`(exit code)** 로 동작한다. 둘을 구분해야 한다.

| 구분 | 의미 | 값/타입 |
|------|------|---------|
| `BatchStatus` | `JobExecution`/`StepExecution`의 상태. 프레임워크 **내부**에서 사용하는 enum | `ABANDONED`, `COMPLETED`, `FAILED`, `STARTED`, `STARTING`, `STOPPED`, `STOPPING`, `UNKNOWN` |
| `ExitStatus` | 스텝 실행 **완료 후** 상태. **조건 흐름 결정에 사용** | exit code 문자열(커스텀 가능) |

기본적으로 스텝/잡의 `ExitStatus`는 그 `BatchStatus`와 **같다**(예: 정상 종료 시 `COMPLETED`). 흐름을 세분화하려면 커스텀 `ExitStatus`를 설정한다(§5).

---

## 3. 순차 플로우

기본 흐름은 `next()`로 스텝을 차례로 연결한다. 앞 스텝이 `COMPLETED`면 다음으로 진행하고, 실패하면 잡이 종료된다.

```java
@Bean
public Job job(JobRepository jobRepository, Step stepA, Step stepB, Step stepC) {
    return new JobBuilder("job", jobRepository)
            .start(stepA)
            .next(stepB)
            .next(stepC)
            .build();
}
```

---

## 4. 조건 전이 — `on()` / `from()` / `to()`

`on(pattern)`으로 exit code를 매칭하고 `to(step)`로 갈 스텝을 지정한다. 분기 시작점을 명시할 때는 `from(step).on(...).to(...)`를 쓴다.

```java
@Bean
public Job job(JobRepository jobRepository, Step stepA, Step stepB, Step stepC) {
    return new JobBuilder("job", jobRepository)
            .start(stepA)
            .on("*").to(stepB)              // stepA가 어떤 코드로든 끝나면 stepB
            .from(stepA).on("FAILED").to(stepC)  // 단, FAILED면 stepC로
            .end()
            .build();
}
```

### 4.1. 와일드카드

`on()` 패턴에 쓸 수 있는 특수문자는 **두 개뿐**이다.

- `*` — 0개 이상의 문자
- `?` — 정확히 1개의 문자

예: `c*t`는 `cat`·`count` 매칭, `c?t`는 `cat`만 매칭. 프레임워크가 전이를 **가장 구체적 → 가장 덜 구체적** 순으로 자동 정렬해 평가하므로, 위 예에서 `FAILED`는 `*`보다 우선 매칭된다.

---

## 5. ExitStatus 커스터마이즈

흐름을 데이터·결과에 따라 갈라야 하면 스텝의 exit code를 직접 바꾼다. 두 가지 위치가 있다.

### 5.1. StepExecutionListener.afterStep — 스텝 통계 기반

스텝 종료 후 통계(예: skip 수)를 보고 exit code를 바꾼다. 변경하지 않을 때는 `null`을 반환한다.

```java
public class SkipCheckingListener implements StepExecutionListener {
    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        String exitCode = stepExecution.getExitStatus().getExitCode();
        if (!exitCode.equals(ExitStatus.FAILED.getExitCode())
                && stepExecution.getSkipCount() > 0) {
            return new ExitStatus("COMPLETED WITH SKIPS");
        }
        return null;   // 기본 ExitStatus 유지
    }
}
```

이후 `on("COMPLETED WITH SKIPS").to(...)`로 분기할 수 있다. skip 동작은 [[batch-fault-tolerance]] 참고.

### 5.2. 처리 데이터 기반 — `StepExecution.setExitStatus()`

배치 잡 내부 **데이터 값**에 따라 분기해야 하면 `ItemProcessor`(또는 reader/writer)에서 `StepExecution.setExitStatus()`로 exit code를 설정한다. 아래는 양수 측정값이 있으면 `NOTIFY`로 종료하는 예다.

```java
public class NumberInfoClassifier extends ItemListenerSupport<NumberInfo, Integer>
        implements ItemProcessor<NumberInfo, Integer> {

    private StepExecution stepExecution;

    @BeforeStep
    public void beforeStep(StepExecution stepExecution) {
        this.stepExecution = stepExecution;
        this.stepExecution.setExitStatus(new ExitStatus("QUIET"));  // 기본값
    }

    @Override
    public Integer process(NumberInfo numberInfo) {
        return Integer.valueOf(numberInfo.getNumber());
    }

    @Override
    public void afterProcess(NumberInfo item, Integer result) {
        if (item.isPositive()) {
            stepExecution.setExitStatus(new ExitStatus("NOTIFY"));  // 조건 충족 시 변경
        }
    }
}
```

```java
new JobBuilder("number-generator", jobRepository)
        .start(dataProviderStep)
        .on("NOTIFY").to(notificationStep)
        .from(dataProviderStep).on("LOG_ERROR").to(errorLoggingStep)  // 추가 분기
        .end()
        .build();
```

`@BeforeStep`으로 `StepExecution`을 주입받아 기본 exit code를 깔고, `afterProcess`에서 조건 충족 시 덮어쓴다. reader/writer에서도 동일하게 설정할 수 있다.

### 5.3. 사용한 리스너 — StepExecutionListener / ItemListenerSupport

위 두 방식이 사용하는 리스너를 정리한다. 둘 다 스텝 생명주기 콜백(`StepListener` 계열)이며, 인터페이스 구현 또는 어노테이션(`@BeforeStep` 등)으로 등록한다.

**StepExecutionListener** — 스텝 실행 1회를 감싸는 가장 일반적인 리스너. §5.1이 이 리스너의 `afterStep` 반환값으로 분기한다.

```java
public interface StepExecutionListener extends StepListener {
    void beforeStep(StepExecution stepExecution);
    ExitStatus afterStep(StepExecution stepExecution);   // 반환값으로 exit code 교체
}
```

- `beforeStep` — 스텝 시작 직전. `afterStep` — 종료 후 호출되며, 반환한 `ExitStatus`로 exit code를 바꾼다(변경 없으면 `null`). 스텝이 정상 종료했든 실패했든 호출된다.
- 어노테이션: `@BeforeStep` / `@AfterStep`.
- Spring Batch 5.x부터 인터페이스 메서드가 default(no-op)라 **필요한 메서드만** 구현하면 된다.[^1]

[^1]: StepExecutionListener 인터페이스의 메서드가 default(no-op)로 선언된 API 시그니처로부터 추론.

**ItemListenerSupport** — chunk 처리의 단계별 리스너 3종을 한꺼번에 no-op으로 구현해 둔 보조 추상 클래스. 필요한 콜백만 골라 오버라이드한다. §5.2의 `NumberInfoClassifier`가 이를 상속해 `afterProcess`만 재정의했다.

| 인터페이스 | 메서드 | 어노테이션 |
|------------|--------|-----------|
| `ItemReadListener<T>` | `beforeRead()` / `afterRead(T)` / `onReadError(Exception)` | `@BeforeRead`/`@AfterRead`/`@OnReadError` |
| `ItemProcessListener<I,O>` | `beforeProcess(I)` / `afterProcess(I, O)` / `onProcessError(I, Exception)` | `@BeforeProcess`/`@AfterProcess`/`@OnProcessError` |
| `ItemWriteListener<S>` | `beforeWrite(chunk)` / `afterWrite(chunk)` / `onWriteError(Exception, chunk)` | `@BeforeWrite`/`@AfterWrite`/`@OnWriteError` |

> [!note] 버전
> - `ItemListenerSupport`는 **Spring Batch 5.0에서 deprecated**되었다. 세 리스너 인터페이스가 default(no-op) 메서드를 갖게 되어 보조 클래스가 불필요해졌기 때문이다. **5.0+에서는 필요한 리스너 인터페이스를 직접 구현**(또는 어노테이션 사용)하는 것이 권장된다.
> - write 콜백 인자는 4.x의 `List<? extends S>`에서 **5.0부터 `Chunk<? extends S>`** 로 변경되었다([[batch-chunk]] §5와 동일).

> 내결함성 단계의 `SkipListener`·`RetryListener`는 [[batch-fault-tolerance]] §5.2 참고.

---

## 6. 종료 전이 — `end()` / `fail()` / `stopAndRestart()`

특정 조건에서 잡을 끝내거나 멈추는 전이다.

| 메서드 | 결과 `BatchStatus` | 재시작 가능 | 용도 |
|--------|--------------------|-------------|------|
| `end()` | `COMPLETED` | 불가(완료 처리) | 더 진행 없이 정상 종료 |
| `fail()` | `FAILED` | 가능 | 실패로 종료, 이후 재시작 |
| `stopAndRestart(step)` | `STOPPED` | 재시작 시 지정 스텝부터 | 처리를 일시 중단 |

```java
// FAILED면 잡을 FAILED로 종료(재시작 가능), 그 외엔 step3 진행
new JobBuilder("job", jobRepository)
        .start(step1)
        .next(step2).on("FAILED").fail()
        .from(step2).on("*").to(step3)
        .end()
        .build();

// step1이 COMPLETED면 STOPPED로 멈추고, 재시작 시 step2부터 재개
new JobBuilder("job", jobRepository)
        .start(step1).on("COMPLETED").stopAndRestart(step2)
        .end()
        .build();
```

> 주의: 위 `end()`(빌더 종료용)와 전이로서의 `.on(...).end()`는 모두 `end`라는 이름을 쓰지만, 전이 `end()`는 "해당 조건에서 잡을 COMPLETED로 종료"를 의미한다. 재시작·`STOPPED` 의미는 [[batch-fault-tolerance]] §2~3과 연결된다.

---

## 7. 프로그래밍 분기 — `JobExecutionDecider`

스텝의 ExitStatus만으로 부족하고 **외부 요인**(설정값, 외부 시스템 상태 등)으로 분기해야 하면 `JobExecutionDecider`를 구현한다. `decide()`가 `FlowExecutionStatus`를 반환하고, 그 값이 `on()` 매칭 대상이 된다.

```java
public class NumberInfoDecider implements JobExecutionDecider {
    @Override
    public FlowExecutionStatus decide(JobExecution jobExecution, StepExecution stepExecution) {
        if (shouldNotify()) {
            return new FlowExecutionStatus("NOTIFY");
        }
        return new FlowExecutionStatus("QUIET");
    }
}
```

```java
new JobBuilder("number-generator", jobRepository)
        .start(dataProviderStep)
        .next(new NumberInfoDecider()).on("NOTIFY").to(notificationStep)
        .end()
        .build();
```

`next(decider)`로 끼워 넣고, `from(decider).on(...).to(...)`로 추가 분기를 연결한다.

---

## 8. 두 방식 선택 기준

| 방식 | 분기 근거 | 적합 상황 |
|------|-----------|-----------|
| ExitStatus 커스터마이즈 (§5) | 스텝 처리 결과·통계·데이터 | 잡 내부 데이터로 분기가 결정될 때 |
| `JobExecutionDecider` (§7) | 임의 로직(외부 요인 포함) | 스텝 결과 밖의 조건이 필요할 때 |

---

## 9. 스텝 유일성 주의

플로우 정의에서 한 스텝이 **여러 전이(outcome)** 를 가지면, `start`/`from`/`to` 등에 **동일한 스텝 인스턴스**를 전달해야 한다. 의존성 주입은 유일성을 보장하지만, `@Bean` 메서드로 스텝을 만들 때는 빈 메서드 프록싱이 필요하다 — `@Configuration(proxyBeanMethods = false)`로 두면 매번 새 인스턴스가 생겨 플로우 정의가 깨진다. (출처: 공식 레퍼런스 주석)

---

## Sources
- raw/java/spring/Conditional Flow in Spring Batch.md (Baeldung, https://www.baeldung.com/spring-batch-conditional-flow)
- Spring Batch Reference (6.x) — Controlling Step Flow: https://docs.spring.io/spring-batch/reference/step/controlling-flow.html
- Spring Batch Reference (6.x) — Intercepting Step Execution (StepExecutionListener/Item*Listener): https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/intercepting-execution.html
- ItemListenerSupport API (deprecated as of 5.0): https://docs.spring.io/spring-batch/docs/current/api/org/springframework/batch/core/listener/ItemListenerSupport.html

---

## Related pages
- [[batch]] — Job/Step 도메인 모델, 흐름 제어(순차·분기·split) 개요
- [[batch-fault-tolerance]] — `stopAndRestart`·재시작, skip 통계 기반 ExitStatus 분기
- [[batch-testing]] — StepExecutionListener·ExitStatus 분기 단위 테스트
- [[batch-chunk]] — ItemProcessor에서 ExitStatus 설정
- [[batch-tasklet]] — 단일 작업 스텝의 흐름 연결
