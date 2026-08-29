---
title: JMH를 이용한 Java 마이크로벤치마크 (Java Microbenchmark Harness)
updated: 2026-07-30 15:27:53
tags:
  - java
  - test
  - jmh
  - benchmark
  - performance
---

## 1. 개요

JMH(Java Microbenchmark Harness)는 OpenJDK가 관리하는 공식 마이크로벤치마크 프레임워크이다.
나노초~밀리초 단위 코드의 성능을 측정할 때 JVM의 JIT 워밍업, 데드 코드 제거,
상수 폴딩 등이 결과를 왜곡하는데, JMH는 이를 통제한 상태로 측정한다.

JUnit처럼 라이브러리만 추가하는 방식이 아니다. **어노테이션 프로세서가 벤치마크
실행 코드를 컴파일 시점에 생성**하므로 `jmh-core`와 `jmh-generator-annprocess`가
모두 필요하며, IDE에서 직접 실행하는 것은 환경 통제가 되지 않아 공식적으로
비권장이다(빌드된 uber-jar 실행 권장).

### 1.1. 단순 반복 측정과의 차이

흔히 쓰는 "for 루프로 N회 반복 후 `System.nanoTime()` 차이를 재는" 방식은
다음 문제가 있다.

```java
long start = System.nanoTime();
for (int i = 0; i < 1_000_000; i++) {
    target.method();
}
long elapsed = System.nanoTime() - start;
```

- **워밍업 미고려**: 측정 구간에 인터프리터 실행·JIT 컴파일 전환이 섞여
  정상 상태(steady state) 성능이 아닌 값이 나온다.
- **데드 코드 제거**: 결과를 사용하지 않으면 JIT가 루프 전체를 제거할 수
  있어 실제로는 아무것도 측정하지 않을 위험이 있다.
- **루프 자체의 최적화**: JIT가 반복문을 벡터화·언롤링하는 등 최적화하여,
  실제 개별 호출 비용과 다른 값이 측정될 수 있다.
- **단일 표본**: 한 번 실행한 결과만으로는 분산·신뢰구간을 알 수 없어
  노이즈와 실제 성능 차이를 구분할 수 없다.
- **프로세스 오염**: 같은 JVM에서 여러 측정을 이어 실행하면 이전 측정의
  JIT 프로파일이 다음 측정에 영향을 준다.

JMH는 각 문제를 구조적으로 해결한다.

| 문제 | JMH의 해결 |
|---|---|
| 워밍업 미고려 | `@Warmup`으로 워밍업 구간을 분리·집계 제외 (§3.8) |
| 데드 코드 제거 | 반환값 자동 소비·`Blackhole`로 강제 소비 (§3.1, §6) |
| 상수 폴딩 | 입력을 `@State`의 non-final 필드에서 읽도록 강제 (§3.4, §6) |
| 단일 표본 | 여러 이터레이션 결과를 Score와 Error(신뢰구간)로 집계 (§5) |
| 프로세스 오염 | `@Fork`로 벤치마크마다 독립 JVM 실행 (§3.7) |

직접 짠 반복 측정 코드는 위 문제를 개별적으로 손수 처리해야 하는 반면,
JMH는 어노테이션 선언만으로 이를 강제해 결과의 재현성과 신뢰도를 높인다.

---

## 2. 설정

### 2.1. Maven — 신규 프로젝트

archetype으로 벤치마크 프로젝트를 생성하는 것이 공식 권장 방식이다.

```bash
mvn archetype:generate -DinteractiveMode=false \
  -DarchetypeGroupId=org.openjdk.jmh \
  -DarchetypeArtifactId=jmh-java-benchmark-archetype \
  -DgroupId=org.sample -DartifactId=benchmark -Dversion=1.0
```

빌드 및 실행:
```bash
mvn clean verify
java -jar target/benchmarks.jar
```

### 2.2. Maven — 기존 프로젝트에 추가

```xml
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.37</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.37</version>
    <scope>provided</scope>
</dependency>
```

`maven-compiler-plugin`의 `annotationProcessorPaths`에 `jmh-generator-annprocess`를
등록해야 벤치마크 코드가 생성된다.

### 2.3. Gradle

커뮤니티 플러그인 `me.champeau.jmh`를 사용한다.

```groovy
plugins {
    id 'me.champeau.jmh' version '0.7.3'
}

jmh {                       // 실행 프로파일을 빌드 스크립트에서 제어 가능
    fork = 1
    warmupIterations = 3
    iterations = 5
}
```

- 벤치마크 소스는 `src/jmh/java`에 배치한다.
- `gradle jmh` — 전체 벤치마크 실행, `gradle jmhJar` — 실행용 uber-jar 생성.

---

## 3. 주요 어노테이션

### 3.1. `@Benchmark`
측정 대상 메서드를 지정한다. `public` 메서드여야 하며, 어노테이션 프로세서가
이 메서드를 감싸는 측정 루프 코드를 생성한다. 한 클래스에 여러 `@Benchmark`
메서드를 두면 각각 독립적으로 측정·비교된다. 메서드의 **반환값은 JMH가
자동으로 소비(consume)** 하므로, 계산 결과를 반환하도록 작성하면 데드 코드
제거를 막을 수 있다.

### 3.2. `@BenchmarkMode`
무엇을 측정할지 `Mode` 값으로 정의한다. 배열로 여러 모드를 동시에 지정할 수 있다.

- **`Throughput`** (기본값): 단위 시간당 수행 횟수(ops/s). 이터레이션 시간 동안
  메서드를 반복 호출해 횟수를 센다. 처리량 관점 비교에 사용.
- **`AverageTime`**: 1회 호출당 평균 소요 시간(time/op). Throughput의 역수 관점으로,
  "이 연산이 평균 몇 ns 걸리는가"를 볼 때 사용.
- **`SampleTime`**: 호출 중 일부를 무작위 샘플링해 소요 시간 분포를 수집한다.
  p50/p90/p99 등 **백분위**가 출력되므로 지연 시간 분포·꼬리 지연 확인에 사용.
- **`SingleShotTime`**: 이터레이션당 **단 1회만** 호출해 시간을 측정한다.
  반복 호출로 워밍업된 상태가 아닌 **콜드 스타트** 비용을 볼 때 사용하며,
  보통 `@Warmup(iterations = 0)`과 조합한다.
- **`All`**: 위 모든 모드를 순차 실행.

### 3.3. `@OutputTimeUnit`
결과 출력의 시간 단위를 `TimeUnit` 값(`NANOSECONDS`~`DAYS`)으로 지정한다.
측정 자체에는 영향이 없고 보고 형식만 바뀐다. 나노초 단위 연산을 `SECONDS`로
출력하면 유효숫자가 잘리므로 연산 규모에 맞는 단위를 고른다.

### 3.4. `@State`
벤치마크 입력·상태를 보관하는 클래스를 `Scope`와 함께 지정한다. 상태 클래스는
`public`이어야 하고 기본 생성자가 필요하며(중첩 클래스는 `static`), 벤치마크
클래스 자신에 붙여도 되고 별도 클래스로 분리해 `@Benchmark` 메서드의
파라미터로 주입받을 수도 있다.

- **`Scope.Thread`**: 스레드마다 별도 인스턴스. 상태 공유가 없는 일반적인 경우의
  기본 선택.
- **`Scope.Benchmark`**: 모든 스레드가 인스턴스 하나를 공유. 동시성 자료구조 등
  **경합 상태의 성능**을 측정할 때 사용.
- **`Scope.Group`**: 스레드 그룹(`@Group`) 단위로 공유. 생산자/소비자처럼
  서로 다른 역할의 스레드가 같은 상태를 다루는 비대칭 벤치마크에 사용.

```java
@State(Scope.Benchmark)
public static class SharedCounter {
    AtomicLong counter = new AtomicLong();
}

@Benchmark
public long increment(SharedCounter s) {   // 파라미터로 상태 주입
    return s.counter.incrementAndGet();
}
```

### 3.5. `@Setup` / `@TearDown`
상태 초기화/정리 메서드를 지정한다. 실행 시간은 **측정에 포함되지 않는다**.
`Level`로 실행 시점을 제어한다.

- **`Level.Trial`** (기본값): 포크(벤치마크 전체 실행)당 1회. 데이터 로딩 등
  비용 큰 준비 작업에 사용.
- **`Level.Iteration`**: 이터레이션마다 실행. 이터레이션 간 상태 리셋이 필요할 때.
- **`Level.Invocation`**: **호출마다** 실행. 타임스탬프 오버헤드가 측정을
  왜곡할 수 있어 공식 문서가 사용 자제를 권고한다. 호출마다 상태를 반드시
  초기화해야 하는 경우(예: 소모성 입력)에만 제한적으로 사용.

### 3.6. `@Param`
`@State` 클래스의 필드를 파라미터화한다. `@Param({"10", "1000"})`처럼
지정한 값마다 벤치마크가 자동 반복되어 입력 크기별 비교표가 만들어진다.

- 필드 타입은 문자열에서 변환 가능한 기본형·`String`·enum이어야 한다.
- `@Param` 필드가 여러 개면 **모든 조합(데카르트 곱)** 이 실행된다 — 조합 폭발 주의.
- CLI에서 `-p size=50,500`으로 재정의할 수 있다.

### 3.7. `@Fork`
벤치마크를 실행할 **독립 JVM 프로세스 수**를 지정한다. 기본값은 5이다. 포크별 결과가
합산 집계된다.

- 같은 JVM에서 여러 벤치마크를 이어 돌리면 JIT 프로파일이 섞여 결과가 오염되므로
  **최소 1 이상**이 필수다. `@Fork(0)`은 호스트 JVM에서 실행하며 디버깅 전용.
- `jvmArgs`/`jvmArgsAppend`/`jvmArgsPrepend`로 포크 JVM에 힙 크기, GC 등 JVM
  플래그를 지정할 수 있다: `@Fork(value = 2, jvmArgsAppend = "-Xmx2g")`
- `warmups = n`으로 결과를 버리는 워밍업 전용 포크를 앞에 추가할 수 있다.

### 3.8. `@Warmup` / `@Measurement`
워밍업/측정 이터레이션의 횟수와 길이를 지정한다. 두 어노테이션 모두
`iterations`(횟수), `time`(이터레이션 길이), `timeUnit`, `batchSize`(호출
묶음 크기) 속성을 가진다.

- 워밍업은 JIT 컴파일(C2)이 완료된 **정상 상태(steady state)** 에 도달시키기 위한
  단계로, 결과 집계에서 제외된다.
- 기본값(1.37): 워밍업 5회 × 10초, 측정 5회 × 10초, 포크 5 — 벤치마크당
  수 분이 걸린다. 개발 중에는 축소 설정을 쓰고, 최종 수치는 기본값에 가깝게 측정한다.

### 3.9. `@Threads`
같은 벤치마크를 동시에 실행할 스레드 수를 지정한다. 기본값은 1이다.
`Threads.MAX`는 사용 가능한 모든 코어를 사용한다. 멀티스레드 환경에서의
확장성·경합 측정에 사용하며, `Scope.Benchmark` 상태와 조합하면 공유
자원 경합을 재현할 수 있다.

### 3.10. 기타

- **`@OperationsPerInvocation(n)`**: 메서드 1회 호출이 내부적으로 n개 연산을
  수행할 때 지정하면 score가 연산 1개 기준으로 정규화된다.
- **`@CompilerControl(Mode.X)`**: JIT 동작 제어(`DONT_INLINE`, `INLINE`,
  `EXCLUDE`). 인라이닝이 결과에 미치는 영향을 진단할 때 사용.
- **`@Group` / `@GroupThreads`**: 서로 다른 `@Benchmark` 메서드를 한 그룹으로 묶어
  비대칭 워크로드(예: reader 3 + writer 1)를 구성한다.
- **`Blackhole`** (어노테이션 아님): `@Benchmark` 메서드 파라미터로 주입받아
  `bh.consume(value)`로 값을 소비한다. 반환값이 여러 개라 return으로 처리할
  수 없을 때 데드 코드 제거를 막는 수단.

---

## 4. 최소 실행 예시

```java
import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
@Fork(1)
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
public class StringConcatBenchmark {

    @Param({"10", "100"})
    private int size;

    @Benchmark
    public String plusConcat() {
        String s = "";
        for (int i = 0; i < size; i++) s += i;
        return s;                       // 반환값으로 데드 코드 제거 방지
    }

    @Benchmark
    public String builderConcat() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < size; i++) sb.append(i);
        return sb.toString();
    }
}
```

실행 (uber-jar, 정규식으로 대상 선택):
```bash
java -jar target/benchmarks.jar StringConcat -f 1 -wi 3 -i 5
# -f 포크 수, -wi 워밍업 횟수, -i 측정 횟수, -h 전체 옵션
```

또는 `main()`에서 `Runner`/`OptionsBuilder`로 실행할 수 있다.

---

## 5. 결과 해석

```
Benchmark                          (size)  Mode  Cnt     Score    Error  Units
StringConcatBenchmark.builderConcat    10  avgt    5    45.123 ±  1.204  ns/op
StringConcatBenchmark.plusConcat       10  avgt    5   152.398 ± 12.887  ns/op
```

- **Score**: 측정값 평균. 단위는 모드에 따라 다름 — `thrpt`는 ops/s(클수록 좋음),
  `avgt`는 time/op(작을수록 좋음)
- **Error**: **99.9% 신뢰구간의 폭**. `Score ± Error`가 실제 값의 추정 범위
- **Cnt**: 집계에 사용된 측정 횟수 (포크 수 × 측정 이터레이션 수)
- 워밍업 이터레이션 결과는 집계에서 제외된다

판단 기준:
- 두 벤치마크의 신뢰구간(`Score ± Error`)이 **겹치면 성능 차이를 단정할 수 없다**
- Error가 Score 대비 수 % 이상으로 크면 측정 신뢰도가 낮다. 원인: 워밍업 부족,
  백그라운드 프로세스, CPU 주파수 스케일링(터보 부스트), GC 개입
- 포크 간 결과 편차가 크면 fork 수를 늘려 확인한다
- `SampleTime` 모드는 p50/p90/p99 등 백분위를 출력하므로 지연 시간 분포 확인에 사용

---

## 6. 흔한 함정

공식 JMH Samples가 다루는 대표적인 측정 왜곡 사례이다.

- **데드 코드 제거**: 계산 결과를 사용하지 않으면 JIT가 코드 자체를 제거한다.
  결과를 **반환**하거나 `Blackhole.consume(value)`로 소비한다.
- **상수 폴딩**: 입력을 `final` 리터럴/지역 상수로 두면 컴파일 시점에 결과가
  계산된다. 입력은 반드시 `@State`의 non-final 필드에서 읽는다.
- **수동 루프 반복**: 벤치마크 메서드 안에서 직접 N회 반복하면 JIT 루프 최적화로
  왜곡된다. 반복은 JMH 하네스에 맡긴다.
- **fork 생략 금지**: 같은 JVM에서 여러 벤치마크를 이어 돌리면 JIT 프로파일이
  섞여 결과가 오염된다.
- 마이크로벤치마크 결과가 실제 애플리케이션 성능을 보장하지 않는다 — 병목 검증은
  실측 프로파일링과 병행한다.[^1]

[^1]: 공식 README의 "결과를 신뢰하기 전 peer review 권장" 취지를 일반화한 서술임.

---

## Sources
- [OpenJDK JMH — 공식 GitHub](https://github.com/openjdk/jmh)
- [JMH Samples — 공식 예제 (함정·어노테이션 설명 근거)](https://github.com/openjdk/jmh/tree/master/jmh-samples/src/main/java/org/openjdk/jmh/samples)
- [jmh-gradle-plugin (me.champeau.jmh)](https://github.com/melix/jmh-gradle-plugin)
- [Gradle Plugin Portal — me.champeau.jmh](https://plugins.gradle.org/plugin/me.champeau.jmh)
- [Baeldung — Microbenchmarking with Java](https://www.baeldung.com/java-microbenchmark-harness)

---

## Related pages
- [[java-testing-libraries]]
