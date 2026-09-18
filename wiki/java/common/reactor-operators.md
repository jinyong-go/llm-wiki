---
title: Reactor 연산자
updated: 2026-09-18 13:25:21
tags:
  - java
  - reactive
  - project-reactor
  - operators
  - performance
---

## 1. 개요

이 문서는 `Flux`/`Mono` 체인을 구성하는 연산자와 그 표기법(마블 다이어그램), 그리고 잘못 사용하면 성능 이슈를 유발할 수 있는 연산자를 다룬다. `Flux`/`Mono` 자체의 정의·생성 방법은 [[project-reactor]] 참고. 에러 처리 연산자와 테스트는 별도 문서에서 다룰 예정이라 제외한다.

---

## 2. 마블 다이어그램 읽는 법

마블 다이어그램은 연산자가 시간에 따라 신호를 어떻게 변환하는지 그림으로 표현한 것이다. 표기 규칙은 다음과 같다.

- **타임라인**: 왼쪽에서 오른쪽으로 시간이 흐른다.
- **`-`**: 시간의 경과.
- **숫자/문자**: 방출되는 요소(`onNext`).
- **`|`**: 정상 완료(`onComplete`).
- **`X`**: 에러 발생(`onError`).
- **인스턴스 메서드**(`source.op()`)는 소스가 위쪽 타임라인 하나, 연산자를 통과한 결과가 아래쪽 타임라인이다. `Flux.merge()` 같은 **정적 메서드**는 입력 타임라인이 여러 개다.

`map`의 예:

```
source: --1--2--3--|
              map(x -> x * 2)
result: --2--4--6--|
```

`filter`의 예(짝수만 통과):

```
source: --1--2--3--4--|
              filter(x -> x % 2 == 0)
result: -----2-----4--|
```

---

## 3. 연산자 카테고리

### 3.1 변환

- `map` — 요소를 동기적으로 1:1 변환.
- `flatMap` — 요소마다 새 `Publisher`를 만들어 평탄화. 내부 시퀀스들이 **완료 순서대로** 병합되어 원래 순서가 보장되지 않는다.
- `concatMap` — `flatMap`과 같은 1:N 변환이지만, 이전 내부 시퀀스가 끝날 때까지 기다렸다가 다음 것을 구독해 **원래 순서를 보장**한다.
- `flatMapSequential` — `flatMap`처럼 내부 시퀀스를 동시에 구독하되, 방출은 원래 순서대로 재정렬해서 내보낸다(동시성과 순서를 절충).

```
source:      --A--B--C--|
flatMap(x -> Flux.just(x+"1", x+"2").delayElements(...))
result:      --A2--A1--B1--C1--B2--C2--|   (완료 순서에 따라 뒤섞일 수 있음)

concatMap:   --A1--A2--B1--B2--C1--C2--|   (항상 순서 보장, 순차 실행이라 더 느림)
```

### 3.2 필터링

- `filter` — 조건에 맞는 요소만 통과.
- `distinct` / `distinctUntilChanged` — 중복 제거(전자는 지금까지 본 모든 값을 기억, 후자는 직전 값과만 비교).
- `take(n)` / `skip(n)` — 앞에서 n개만 취하거나 건너뜀.
- `takeUntil` / `takeWhile` — 조건을 만족할 때까지(또는 만족하는 동안)만 통과.

### 3.3 결합

- `concat` — 순차적으로 이어붙임(앞 시퀀스가 끝나야 다음 시작).
- `merge` — 여러 시퀀스를 동시에 구독해 도착하는 대로 병합(순서 보장 안 함).
- `zip` — 각 소스에서 같은 인덱스의 요소끼리 짝지어 하나로 결합. 가장 느린 소스에 맞춰짐.
- `combineLatest` — 어느 소스든 새 값이 나올 때마다 각 소스의 최신 값들을 조합.

```
sourceA: --1-----2-----3--|
sourceB: ---a--b----c------|
zip:     ---1a-----2b--3c-|   (인덱스끼리 짝지어짐, 순서·개수 어긋나면 대기)
```

### 3.4 시간 기반

- `delayElements(Duration)` — 각 요소 방출을 지연.
- `timeout(Duration)` — 지정 시간 내에 다음 신호가 없으면 에러.
- `Flux.interval(Duration)` — 주기적으로 값을 방출하는 무한 시퀀스(hot).

### 3.5 배치/윈도우

- `buffer(n)` / `buffer(Duration)` — n개씩 또는 시간 간격으로 모아 리스트로 묶어서 방출.
- `window(n)` — buffer와 비슷하지만 리스트가 아니라 `Flux<Flux<T>>`로 쪼갠다.
- `groupBy(keyFn)` — 키 기준으로 묶어 `Flux<GroupedFlux<K, T>>`로 분기.

### 3.6 부수효과(Peek)

- `doOnNext` / `doOnComplete` / `doOnError` / `doOnCancel` — 신호가 지나갈 때 부수효과(로깅 등)만 실행하고 시퀀스 자체는 바꾸지 않는다.
- `log()` — 각 신호를 로깅. 내부적으로 `doOnEach` 계열과 유사하게 동작.

### 3.7 멀티캐스팅

- `publish()` / `share()` — cold를 hot으로 전환([[project-reactor]] 4장 참고).
- `cache(n)` / `replay(n)` — 방출된 값을 캐시해 이후 구독자에게 재생.

---

## 4. 성능 이슈를 유발할 수 있는 연산자

### 4.1 flatMap의 기본 동시성(concurrency)

`flatMap`은 동시성(concurrency) 파라미터를 지정하지 않으면 기본값 256을 사용한다. 즉 최대 256개의 내부 `Publisher`를 동시에 구독한다. 다운스트림(예: DB, 외부 API)이 이 정도의 동시 요청을 감당하지 못하면 커넥션 풀 고갈이나 타임아웃 폭증으로 이어질 수 있다. 다운스트림 용량에 맞춰 `flatMap(fn, concurrency)`처럼 명시적으로 제한하는 것이 안전하다.

### 4.2 concatMap의 순차 처리 비용

`concatMap`은 순서를 보장하는 대신 병렬성이 없다. 내부 시퀀스 하나하나가 완료될 때까지 다음 게 시작되지 않으므로, 각 작업이 오래 걸리면 전체 처리 시간이 그만큼 길어진다. 순서가 중요하지 않다면 `flatMap`(빠르지만 순서 없음)이나 `flatMapSequential`(동시 실행 + 순서 보장)을 검토해야 한다.

### 4.3 block()/blockFirst()/blockLast()/toIterable()/toStream()

이 연산자들은 리액티브 시퀀스를 동기적으로 소비하기 위해 **현재 스레드를 blocking**한다. Netty 이벤트 루프나 `Schedulers.parallel()`/`Schedulers.single()` 같은 non-blocking 전용 스레드에서 호출하면 `IllegalStateException: block()/blockFirst()/blockLast() are blocking, which is not supported`가 발생한다. 설령 예외가 나지 않는 스레드라 해도, 리액티브 체인 중간에 blocking 호출을 섞으면 그 스레드를 점유해 다른 요청 처리를 지연시킨다([[reactive-programming]] 6.1 참고). blocking API를 꼭 호출해야 한다면 `Mono.fromCallable(() -> blockingCall())`로 감싸 `boundedElastic` 스케줄러에서 실행해야 한다.

### 4.4 무제한(unbounded) 버퍼링 연산자

`buffer()`, `collectList()`, `distinct()` 등은 내부적으로 결과를 모아두는 동안 크기 제한이 없으면 메모리 사용량이 계속 늘어날 수 있다. 특히 무한 스트림이나 대용량 데이터에 크기 제한 없는 `buffer()`/`collectList()`를 쓰면 메모리 부족으로 이어질 수 있어, 명시적인 backpressure 처리(`onBackpressureBuffer(maxSize, ...)` 등)나 크기 제한이 있는 변형을 사용해야 한다.

### 4.5 디버깅용 연산자의 프로덕션 오버헤드

- `Hooks.onOperatorDebug()`는 체인에 있는 **모든** 연산자 호출 시점(assembly time)마다 무거운 스택 트레이스 캡처를 수행한다. 실제로 에러가 나지 않는 정상 경로에서도 이 비용이 매번 발생해 프로덕션에서는 성능 저하를 유발한다. 디버깅이 필요하면 런타임 비용이 없는 `reactor-tools`의 `ReactorDebugAgent`(바이트코드 계측 방식)를 대신 쓰는 것이 권장된다.
- `checkpoint()`는 전역 디버그 모드 대신 특정 체인 구간에만 선택적으로 적용할 수 있어 상대적으로 비용이 적다. 설명 문자열만 붙이는 `checkpoint(String)` 형태가 스택 트레이스를 포함하는 기본형보다 비용이 낮다.
- `log()`는 내부적으로 로깅 프레임워크를 호출하므로, 동기 방식 로깅 프레임워크를 그대로 쓰면 로깅 자체가 blocking 지점이 될 수 있다. 프로덕션에서는 Logback `AsyncAppender`나 Log4j2 `AsyncLogger`처럼 비동기 방식으로 설정해야 한다.

### 4.6 중첩 구독(nested subscribe)

`map`/`doOnNext` 같은 연산자 안에서 다른 `Publisher`를 또 `subscribe()`하는 패턴은 안티패턴이다. 이렇게 하면 바깥 체인의 backpressure·에러 전파·취소 신호가 안쪽 구독까지 이어지지 않아 리액티브 체인이 사실상 끊긴다. 이런 경우는 `flatMap`/`concatMap` 등으로 안쪽 `Publisher`를 체인에 편입시켜야 한다.

---

## Sources
- [How to read marble diagrams? :: Reactor Core Reference Guide](https://projectreactor.io/docs/core/release/reference/apdx-howtoReadMarbles.html)
- [Which operator do I need? :: Reactor Core Reference Guide](https://projectreactor.io/docs/core/release/reference/apdx-operatorChoice.html)
- [Debugging Reactor :: Reactor Core Reference Guide](https://projectreactor.io/docs/core/release/reference/debugging.html)
- [Project Reactor — flatMap vs concatMap vs flatMapSequential](https://medium.com/@abugautam/project-reactor-flatmap-vs-concatmap-vs-flatmapsequential-dc74ca58829e)
- [How to Solve "block()/blockFirst()/blockLast() are blocking" — Baeldung](https://www.baeldung.com/java-fix-illegalstateexception-blocking)
- [Use of Hooks.onOperatorDebug causes performance degradation — Spring Framework GitHub Issue](https://github.com/spring-projects/spring-framework/issues/22007)

---

## Related pages
- [[project-reactor]]
- [[reactive-programming]]
