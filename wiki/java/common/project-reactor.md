---
title: Project Reactor
updated: 2026-09-18 13:25:21
tags:
  - java
  - reactive
  - project-reactor
  - reactive-streams
  - spring-webflux
---

## 1. 개요

Project Reactor는 Reactive Streams 사양을 구현한 JVM 리액티브 라이브러리다. `Flux`(0~N개 비동기 시퀀스)와 `Mono`(0~1개 비동기 결과) 두 타입을 제공하며, Spring WebFlux의 기반 라이브러리다. 리액티브 프로그래밍 자체의 개념·배경·Reactive Streams 동작 원리는 [[reactive-programming]] 참고.

> 일반 변환 연산자(map/filter/flatMap 등)는 [[reactor-operators]] 참고. 에러 처리 연산자, 테스트(StepVerifier 등)는 별도 문서에서 다룰 예정이라 이 문서에서는 제외한다.

---

## 2. 의존성 추가

Reactor 3는 서로 호환되는 아티팩트 버전을 묶어 관리하는 BOM(Bill of Materials)을 사용한다. 버전은 BOM 하나로만 관리하고, 개별 아티팩트에는 버전을 명시하지 않는 방식을 권장한다. 최소 Java 8 이상이 필요하다.

**Gradle (5.0 이상)**
```groovy
dependencies {
    implementation platform('io.projectreactor:reactor-bom:2025.0.7')
    implementation 'io.projectreactor:reactor-core'
}
```

**Maven**
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.projectreactor</groupId>
            <artifactId>reactor-bom</artifactId>
            <version>2025.0.7</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-core</artifactId>
    </dependency>
</dependencies>
```

Spring Boot 프로젝트에서 `spring-boot-starter-webflux`를 추가하면 `reactor-core`가 전이 의존성으로 함께 들어와 별도 추가가 필요 없다.

---

## 3. 주요 구성 요소

### 3.1 Flux와 Mono

`Flux<T>`는 0개에서 N개까지의 항목을 비동기로 방출하고, `onComplete` 또는 `onError`로 종료되는 `Publisher<T>` 구현체다.

```java
Flux<Integer> flux = Flux.just(1, 2, 3);
flux.subscribe(System.out::println);
```

이 예시의 `Flux.just`가 실제로 어떻게 동작하는지(값을 언제 캡처하는지)는 4장의 Hot/Cold 구분에서 다시 다룬다.

`Mono<T>`는 최대 1개의 항목만 방출하는 특화된 `Publisher<T>`다. `Flux`보다 적은 연산자만 제공하며, 다른 `Publisher`와 결합하는 연산자(`concatWith` 등)는 결과 타입이 `Flux`로 전환된다.

```java
Mono<String> mono = Mono.justOrEmpty(findUser(id));
mono.subscribe(System.out::println);
```

체인을 조립하는 것만으로는 아무 일도 일어나지 않는다. 실제 데이터 흐름은 `subscribe()` 호출 시점에 시작된다. 실무에서는 사용자가 직접 `subscribe()`를 호출하기보다, 완성된 체인을 Spring WebFlux 같은 프레임워크에 넘겨 논블로킹 실행 엔진이 구독을 대신 처리하게 하는 경우가 많다.

**생성 방법**

`Flux`/`Mono`는 정적 팩토리 메서드로 생성한다.

| 메서드 | 대상 | 용도 |
|---|---|---|
| `just(T...)` | Flux/Mono | 이미 갖고 있는 값(들)을 시퀀스로 감싼다 |
| `fromIterable(Iterable)` | Flux | 컬렉션을 시퀀스로 변환 |
| `range(start, count)` | Flux | 정수 범위 시퀀스 생성 |
| `empty()` | Flux/Mono | 값 없이 완료만 하는 시퀀스 |
| `error(Throwable)` | Flux/Mono | 즉시 에러로 종료하는 시퀀스 |
| `defer(Supplier<Publisher>)` | Flux/Mono | 구독 시점까지 실제 생성을 지연 |

`defer`는 4.2에서 다루는 hot→cold 전환과 직접 연결된다.

### 3.2 Schedulers

`Scheduler`는 `ExecutorService`와 유사한 스케줄링 책임을 갖는 실행 컨텍스트 추상화다. 대표적인 기본 구현은 다음과 같다.

| Scheduler | 특징 |
|---|---|
| `Schedulers.immediate()` | 별도 스레드 전환 없이 현재 스레드에서 즉시 실행(no-op) |
| `Schedulers.single()` | 재사용 가능한 단일 스레드. 모든 호출자가 같은 스레드를 공유 |
| `Schedulers.boundedElastic()` | 제한된 크기의 탄력적 스레드 풀. blocking I/O 작업에 적합 |
| `Schedulers.parallel()` | CPU 코어 수만큼 워커를 갖는 고정 풀. CPU-bound 작업에 적합 |

`publishOn`과 `subscribeOn`으로 체인의 실행 스레드를 전환한다.

| 연산자 | 적용 시점 | 영향 범위 |
|---|---|---|
| `publishOn` | 체인 중간, 다른 연산자와 동일한 위치 | 호출 지점 **아래(다운스트림)** 연산자의 실행 스레드만 변경. 위치가 중요함 |
| `subscribeOn` | 구독 시점(역방향 체인 구성) | 체인 **전체**가 구독을 시작하는 스레드를 변경. 다운스트림에 가장 가까운 호출만 적용되어 위치가 결과에 영향 없음 |

```java
Flux.range(1, 3)
    .subscribeOn(Schedulers.boundedElastic()) // 구독(소스 실행) 스레드
    .map(this::heavyCompute)
    .publishOn(Schedulers.parallel())         // 이 지점 이후 실행 스레드 전환
    .subscribe(System.out::println);
```

### 3.3 Sinks

`Sinks`는 여러 `Subscriber`를 다루는 `Publisher`와 유사한 구조를 만들면서, 신호를 수동으로 안전하게 트리거할 수 있게 하는 클래스다. 과거 `Processor`가 필요했던 상황에서 대신 사용이 권장된다.

| 종류 | 동작 |
|---|---|
| `Sinks.Many` - multicast | 새로 push된 데이터만 backpressure를 지키며 구독자에게 전달 |
| `Sinks.Many` - unicast | 단일 구독자만 지원, 내부 버퍼로 backpressure 처리 |
| `Sinks.Many` - replay | 방출된 요소를 캐시해 늦게 온 구독자에게 재생 |
| `Sinks.One` / `Sinks.Empty` | `Mono`처럼 동작, 단일 요소 또는 완료·에러 신호만 발생(`Empty`는 값 발출 불가) |

### 3.4 Context

`Context`는 Map과 유사한 키-값 저장 인터페이스로, `Flux`/`Mono` 시퀀스 자체에 결속된다. `ThreadLocal`은 하나의 스레드가 동시에 여러 비동기 시퀀스를 처리할 수 있는 리액티브 환경에서 스레드에 값을 묶는 방식이 성립하지 않기 때문에, Reactor는 스레드 대신 시퀀스에 결속되는 `Context`를 대안으로 제공한다.

```java
Mono.deferContextual(ctx ->
    Mono.just("user=" + ctx.get("userId"))
).contextWrite(Context.of("userId", "1001"))
 .subscribe(System.out::println);
```

`contextWrite`로 구독 시점에 값을 채우고, `deferContextual`로 소스 연산자에서 값을 읽는다. `Context`는 불변이라 `put`/`putAll` 같은 쓰기 연산은 새 인스턴스를 반환한다.

---

## 4. Publisher 구분: Cold vs Hot

### 4.1 Cold Publisher

구독이 생길 때마다 데이터를 새로 생성한다. 구독이 없으면 데이터도 생성되지 않으며, 구독자마다 독립적으로 전체 시퀀스를 처음부터 받는다.

```java
Flux<String> source = Flux.fromIterable(List.of("blue", "green", "orange", "purple"))
    .map(String::toUpperCase);

source.subscribe(d -> System.out.println("Subscriber 1: " + d));
source.subscribe(d -> System.out.println("Subscriber 2: " + d));
```

두 구독자 모두 BLUE/GREEN/ORANGE/PURPLE을 처음부터 전부 받는다(구독마다 소스가 재실행됨). HTTP 요청처럼 구독마다 실제 부수효과(네트워크 호출 등)가 새로 발생하는 시퀀스가 대표적인 cold publisher다.

**hot으로 전환**: `share()` 또는 `replay(...)` 연산자를 적용하면 cold publisher를 hot publisher로 바꿀 수 있다.

- `share()`는 내부적으로 `publish().refCount(1)`과 동일하게 동작한다. 첫 구독자가 나타나면 그때 업스트림 소스에 한 번만 연결(connect)하고, 이후 구독자들은 그 하나의 실행 결과를 공유해서 받는다. 구독자 수가 0명으로 떨어지면 연결이 끊기고, 다음 구독자가 나타날 때 다시 새로 연결(재시작)한다.
- `replay(...)`는 share()와 비슷하게 하나의 업스트림 실행을 공유하되, 방출된 값을 버퍼에 캐시해뒀다가 늦게 들어온 구독자에게도 과거 값을 재생해준다는 점이 다르다.

### 4.2 Hot Publisher

구독자 수와 무관하게 데이터를 방출한다. 이미 구독 중이던 대상에게는 신호를 바로 전파하고, 늦게 구독한 대상은 구독 이후에 발생한 신호만 받는다. `Sinks`가 대표적이다.

```java
Sinks.Many<String> hotSource = Sinks.unsafe().many().multicast().directBestEffort();
Flux<String> hotFlux = hotSource.asFlux().map(String::toUpperCase);

hotFlux.subscribe(d -> System.out.println("Subscriber 1: " + d));
hotSource.emitNext("blue", FAIL_FAST);
hotSource.emitNext("green", FAIL_FAST);

hotFlux.subscribe(d -> System.out.println("Subscriber 2: " + d)); // 여기서부터 수신 시작

hotSource.emitNext("orange", FAIL_FAST);
hotSource.emitNext("purple", FAIL_FAST);
hotSource.emitComplete(FAIL_FAST);
```

Subscriber 2는 구독 이전에 emit된 blue/green을 받지 못하고 orange/purple부터 받는다.

**주의: `just`는 예외적으로 hot이다.** Reactor의 몇 안 되는 hot 연산자 중 하나가 `just`인데, 값을 조립(assembly) 시점에 즉시 캡처해뒀다가 이후 구독하는 모든 대상에게 그 값을 재생하기 때문이다. 예를 들어 `Mono.just(httpCall())`은 `httpCall()`을 **선언 시점에 한 번만** 실행하고 그 결과를 모든 구독자에게 재생한다 — 구독마다 새로 실행되길 기대했다면 의도와 다르게 동작한다.

**cold로 전환**: 이런 경우 `defer`로 감싸면 실제 실행을 구독 시점으로 미룰 수 있다. `Mono.defer(() -> Mono.just(httpCall()))`은 구독마다 `httpCall()`을 새로 실행하는 cold publisher가 된다.

---

## Sources
- [Flux, an Asynchronous Sequence of 0-N Items](https://projectreactor.io/docs/core/release/reference/coreFeatures/flux.html)
- [Mono, an Asynchronous 0-1 Result](https://projectreactor.io/docs/core/release/reference/coreFeatures/mono.html)
- [Simple Ways to Create a Flux or Mono and Subscribe to It](https://projectreactor.io/docs/core/release/reference/coreFeatures/simple-ways-to-create-a-flux-or-mono-and-subscribe-to-it.html)
- [Threading and Schedulers](https://projectreactor.io/docs/core/release/reference/coreFeatures/schedulers.html)
- [Sinks](https://projectreactor.io/docs/core/release/reference/coreFeatures/sinks.html)
- [Hot Versus Cold](https://projectreactor.io/docs/core/release/reference/advancedFeatures/reactor-hotCold.html)
- [Broadcasting to Multiple Subscribers with ConnectableFlux](https://projectreactor.io/docs/core/release/reference/advancedFeatures/advanced-broadcast-multiple-subscribers-connectableflux.html)
- [Adding a Context to a Reactive Sequence](https://projectreactor.io/docs/core/release/reference/advancedFeatures/context.html)
- [Getting Started :: Reactor Core Reference Guide](https://projectreactor.io/docs/core/release/reference/gettingStarted.html)

---

## Related pages
- [[reactive-programming]]
- [[netty]]
