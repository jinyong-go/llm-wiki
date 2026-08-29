---
title: Java 21 주요 기능
updated: 2026-07-08 10:50:28
tags:
  - java
  - java21
  - lts
  - virtual-thread
---

## 1. 개요
Java 21은 **2023년 9월 19일** 정식 릴리즈(General Availability)된 LTS 버전으로, **가상 스레드(Virtual Threads)**를 통한 동시성 모델의 혁신과 더욱 강력해진 패턴 매칭 기능을 제공합니다. Java 11·17에 이은 세 번째 LTS 릴리즈입니다.

### 1.1. LTS 지원 기간 — Oracle 기준
- **Premier Support**: ~2028년 9월
- **Extended Support**: ~2031년 9월 (Premier 종료 후 3년 추가)
- 무료 사용 라이선스(NFTC)는 **2026년 9월**까지 제공됩니다(차기 LTS인 JDK 25 릴리즈 1년 후). 이후 프로덕션 사용은 OTN 라이선스(유료 구독)로 전환되며, 무료 사용이 필요하면 Eclipse Temurin·Amazon Corretto 등 OpenJDK 배포판을 사용합니다.

> 지원 종료일은 벤더(Oracle/Adoptium/Corretto 등)마다 상이하므로 실제 도입 시 사용하는 배포판의 로드맵을 확인해야 합니다.

---

## 2. 주요 기능

### 2.1. 가상 스레드 (Virtual Threads - JEP 444)
처리량이 높은 동시성 애플리케이션을 작성하고 유지 관리하는 데 드는 비용을 획기적으로 줄여주는 경량 스레드입니다.
- **목적**: OS 스레드와 $1:1$로 매핑되지 않고 JVM이 수천~수백만 개의 가상 스레드를 적은 수의 OS 스레드(carrier) 위에서 스케줄링하여, 익숙한 동기·블로킹 코드 스타일 그대로 높은 처리량을 얻습니다.
- **선언**: 기존 `Thread`·`ExecutorService` API를 그대로 사용합니다.
  ```java
  // 개별 생성
  Thread.ofVirtual().start(() -> handle(request));

  // 요청마다 가상 스레드를 할당하는 executor
  try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      executor.submit(() -> callExternalApi());
  }
  ```
- **이점**: 스레드당 메모리 점유가 매우 적고 컨텍스트 스위칭 비용이 낮아, Thread-per-request 모델을 그대로 두고도 효율적으로 확장할 수 있습니다. 블로킹 I/O 시 carrier 스레드를 점유하지 않고 반납(unmount)합니다.
- **제약**: CPU 바운드 작업의 처리 속도를 높이지는 않습니다(I/O 바운드 확장용). `synchronized` 블록 안에서 블로킹하면 carrier에 고정(pinning)되어 이점이 줄므로 `ReentrantLock` 사용이 권장되며, 풀링(pooling) 대상이 아니라 작업마다 새로 생성하는 것이 원칙입니다.

### 2.2. Sequenced Collections (JEP 431)
정해진 순서(encounter order)가 있는 컬렉션을 위한 공통 인터페이스 계층을 도입했습니다.
- **목적**: 순서가 있는 컬렉션마다 첫/끝 원소 접근 방식이 제각각이던 문제(`list.get(0)` vs `deque.getFirst()` vs `list.get(list.size()-1)`)를 통일합니다.
- **선언**: `SequencedCollection`/`SequencedSet`/`SequencedMap` 인터페이스가 공통 메서드를 제공합니다.
  ```java
  List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
  list.getFirst();        // 1
  list.getLast();         // 3
  list.addFirst(0);       // [0, 1, 2, 3]
  list.reversed();        // [3, 2, 1, 0] (역순 뷰)

  LinkedHashMap<String,Integer> m = new LinkedHashMap<>();
  m.put("a", 1); m.put("b", 2);
  m.firstEntry();         // a=1
  ```
- **이점**: `List`, `Deque`, `LinkedHashSet`, `LinkedHashMap` 등이 이를 구현하여 순서 기반 접근·역순 순회 코드를 일관되고 간결하게 작성할 수 있습니다.
- **제약**: 순서 개념이 없는 `HashSet`·`HashMap`에는 적용되지 않습니다. `reversed()`는 원본을 복사하지 않는 **뷰(view)** 이므로 원본 변경이 반영됩니다.

### 2.3. 패턴 매칭 (Pattern Matching)
- **목적**: 타입 검사·형변환·필드 추출·분기 조건을 하나의 선언적 패턴으로 표현하여, `instanceof` 체인이나 중첩 `if`를 제거합니다.
- **선언**:
  - **Record Patterns (JEP 440)**: `instanceof`나 `switch`에서 레코드의 구성 요소를 직접 분해(destructuring)하여 매칭합니다.
  - **Pattern Matching for switch (JEP 441)**: `switch`에서 타입 패턴을 사용하며, `when` 절로 세부 조건(guard)을 추가하고 `null` 케이스도 직접 처리할 수 있습니다.
  ```java
  record Point(int x, int y) {}
  record Line(Point start, Point end) {}

  // Record Pattern으로 중첩 분해
  static String describe(Object obj) {
      return switch (obj) {
          case null                     -> "null";
          case Point(int x, int y) when x == y -> "대각선 위 점";   // guard
          case Point(int x, int y)      -> "점 (" + x + ", " + y + ")";
          case Line(Point s, Point e)   -> "선 " + s + " → " + e;  // 중첩 분해
          default                       -> "기타";
      };
  }
  ```
- **이점**: 타입별 분기와 데이터 추출이 한 곳에 모여 가독성이 높아지고, sealed 타입과 결합하면 컴파일러가 **전수 검사(exhaustiveness)**를 수행해 케이스 누락을 잡아줍니다.
- **제약**: Record Pattern은 `record` 타입에만 적용됩니다. guard(`when`) 조건의 케이스 순서에 유의해야 하며(먼저 매칭되는 케이스가 선택됨), 표현식으로 쓸 때는 모든 경우가 처리되어야 합니다.

### 2.4. Generational ZGC (JEP 439)
ZGC(Z Garbage Collector)에 세대별(Generational) 가비지 컬렉션 방식을 도입하여 성능을 개선했습니다.
- **목적**: "대부분의 객체는 일찍 죽는다"는 약한 세대 가설을 ZGC에 적용해, 어린 객체(young generation)를 더 자주 수집함으로써 낮은 지연시간을 유지하면서 처리량을 높입니다.
- **선언**: `-XX:+UseZGC -XX:+ZGenerational` 옵션으로 활성화합니다(JDK 21 기준. JDK 23부터는 세대별이 기본).
- **이점**: 힙 전체를 매번 스캔하지 않아 GC 오버헤드와 힙 여유 요구량이 줄고, 대용량 힙에서도 밀리초 단위의 짧은 정지시간을 유지합니다.
- **제약**: 초저지연이 목표인 컬렉터로, 순수 배치 처리량만 중시하는 경우 G1/Parallel GC가 더 나을 수 있어 워크로드에 맞춘 선택이 필요합니다.

---

## 3. Preview 및 기타 기능
- **Structured Concurrency (JEP 453 - Preview)**: 여러 스레드에서 실행되는 관련 작업을 하나의 단위로 묶어 에러 처리와 취소를 용이하게 합니다.
- **Scoped Values (JEP 446 - Preview)**: 스레드 내 및 자식 스레드 간에 불변 데이터를 안전하고 효율적으로 공유할 수 있게 합니다.

---

## Sources
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 431: Sequenced Collections](https://openjdk.org/jeps/431)
- [JEP 440: Record Patterns](https://openjdk.org/jeps/440)
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441)
- [JEP 439: Generational ZGC](https://openjdk.org/jeps/439)
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453)
- [JDK 21 (openjdk.org)](https://openjdk.org/projects/jdk/21/)
- [Oracle Java SE Support Roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)

---

## Related pages
- [[java17-features]]
- [[jvm-options]]
- [[expression-vs-statement]]
