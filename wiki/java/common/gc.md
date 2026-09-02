---
title: Garbage Collector (GC)
updated: 2026-07-08 10:32:15
tags:
  - java
  - jvm
  - gc
  - memory
---

## 1. 개요
HotSpot JVM은 힙에서 더 이상 참조되지 않는 객체를 자동 회수하는 여러 종류의 가비지 컬렉터(GC)를 제공한다. GC는 처리량(throughput), 지연시간(latency, STW pause), 메모리 사용(footprint)의 세 축에서 서로 다른 트레이드오프를 가지므로 워크로드에 맞게 선택한다.

- **STW(Stop-The-World)**: GC가 애플리케이션 스레드를 멈추고 작업하는 구간. 이 시간이 곧 응답 지연으로 나타난다.
- **세대 가설(weak generational hypothesis)**: 대부분의 객체는 생성 직후 죽는다는 경험칙. Young/Old 영역을 분리해 Young을 자주, Old를 드물게 수집하는 방식의 근거다.
- **동시(concurrent) GC**: 애플리케이션 스레드와 병행해 마킹·정리를 수행하여 STW를 줄이는 방식.

GC 지정·튜닝 옵션의 전체 목록은 [[jvm-options]]의 "GC 선택" 절을 참고한다. 본 문서는 각 GC의 특성과 지원 이력을 다룬다. 본문에 나오는 세부 용어(concurrent marking, compaction, colored pointer, load barrier)는 4장에서 설명한다.

---

## 2. GC별 상세

### 2.1. Serial GC
Young·Old를 모두 **단일 스레드**로 수집하는 가장 단순한 컬렉터.
- **동작**: Young은 copying, Old는 mark-sweep-compact. 수집 전 구간 STW.
- **장점**: 구현이 단순하고 GC 자체 오버헤드·메모리 footprint가 가장 작다. 단일 코어·소규모 힙에서 효율적.
- **단점**: 멀티코어를 활용하지 못하고, 힙이 커지면 STW가 급격히 길어진다.
- **지원**: JDK 1.0부터 항상 제공. 제거·deprecated 이력 없음.
- **지정**: `-XX:+UseSerialGC`

### 2.2. Parallel GC
Throughput Collector. Young·Old 수집을 **여러 스레드로 병렬 STW** 처리한다.
- **동작**: Young copying, Old mark-sweep-compact를 다중 스레드로 수행. 전 구간 STW지만 병렬화로 STW 시간을 단축.
- **장점**: 처리량(단위 시간당 애플리케이션 작업량)이 높다. 배치·대량 연산처럼 응답 지연보다 전체 처리량이 중요한 워크로드에 적합.
- **단점**: STW 기반이라 힙이 클수록 일시정지가 길어 대화형·저지연 서비스에는 부적합.
- **지원**: JDK 1.4~5부터. **JDK 8의 기본 GC**. 현재까지 유지.
- **지정**: `-XX:+UseParallelGC` (스레드 수: `-XX:ParallelGCThreads=<n>`)

### 2.3. CMS GC (제거됨)
Concurrent Mark Sweep. Old 영역을 애플리케이션과 **동시에 마킹·정리**하여 STW를 줄인 최초의 저지연 컬렉터.
- **동작**: Old를 concurrent mark-sweep으로 수집(compaction 없음). Young은 별도 STW(ParNew).
- **장점**: 등장 당시 기준으로 Old GC의 STW를 크게 단축.
- **단점**: compaction을 하지 않아 **단편화(fragmentation)**가 누적되고, 이로 인해 Full GC(STW)로 폴백하면 오히려 긴 정지가 발생한다. CPU를 상시 점유하며 튜닝이 복잡하다.
- **지원**: JDK 1.4.1 도입 → **JDK 9에서 deprecated (JEP 291)** → **JDK 14에서 제거 (JEP 363)**. G1이 대체.
- **지정**(제거 전): `-XX:+UseConcMarkSweepGC`

### 2.4. G1 GC
Garbage-First. 힙을 균일한 크기의 **리전(region)**으로 나눠, 쓰레기가 많은 리전을 우선 수집한다.
- **동작**: 힙을 다수 리전으로 분할하고 Young/Old를 리전 단위로 관리. concurrent marking으로 회수 이득이 큰 리전을 선별해 부분적으로 수집·compaction. `-XX:MaxGCPauseMillis` 목표 안에서 수집 리전 수를 조절한다.
- **장점**: 처리량과 지연의 **균형**. 목표 정지시간 설정이 가능하고, compaction으로 단편화를 억제한다. 수 GB~수십 GB 힙에서 범용적.
- **단점**: 리전 관리·remembered set 등으로 메모리·CPU 오버헤드가 있다. 초대형 힙에서의 극단적 저지연은 ZGC/Shenandoah보다 불리.
- **지원**: JDK 6u14 experimental → 7u4 정식 → **JDK 9부터 기본 GC (JEP 248)**. JDK 25에서 이전에 Serial로 폴백하던 제약 환경까지 포함한 전 환경 기본으로 확대 (JEP 523).
- **지정**: `-XX:+UseG1GC` (튜닝 옵션은 [[jvm-options]] "G1 주요 옵션" 참고)

### 2.5. ZGC
확장 가능한 저지연 컬렉터. **거의 모든 작업을 동시(concurrent)**로 수행한다.
- **동작**: colored pointer와 load barrier를 이용해 동시 마킹·재배치(relocation)를 수행. STW는 힙 크기와 거의 무관하게 짧게 유지된다.
- **장점**: 힙이 수백 GB~TB급이어도 STW를 **밀리초 이하** 수준으로 유지. 대용량·저지연 서비스에 적합.
- **단점**: load barrier 등으로 처리량이 다소 낮고 메모리(footprint) 요구가 크다. 순수 배치 처리량 목적에는 Parallel/G1이 유리할 수 있다.
- **지원**: **JDK 11 experimental (JEP 333)** → **JDK 15 정식 (JEP 377)**. Generational ZGC는 JDK 21 도입 (JEP 439) → JDK 23 기본 (JEP 474) → 비세대(non-generational) 모드는 JDK 24에서 제거 (JEP 490).
- **지정**: `-XX:+UseZGC`
  - JDK 21·22에서 세대별 사용: `-XX:+UseZGC -XX:+ZGenerational`
  - JDK 23+는 세대별이 기본이므로 `-XX:+ZGenerational` 불필요(23에서 deprecated, 24에서 제거).

### 2.6. Shenandoah GC
Red Hat 주도의 저지연 컬렉터. **동시 압축(concurrent compaction)**을 수행한다.
- **동작**: Brooks pointer(forwarding pointer) 기반으로 애플리케이션과 동시에 객체를 이동·압축. STW가 힙 크기에 거의 비례하지 않는다.
- **장점**: 힙 크기와 무관하게 짧은 정지시간. 동시 compaction으로 단편화도 억제. G1 대비 지연 우위.
- **단점**: forwarding pointer·barrier로 처리량·메모리 오버헤드가 있다. OpenJDK 배포판(벤더)·버전에 따라 포함 여부가 다를 수 있다.
- **지원**: **JDK 12 experimental (JEP 189)** → **JDK 15 정식 (JEP 379)**. Generational Shenandoah는 JDK 25 도입 (JEP 521). (일부 벤더는 JDK 8·11에 백포트 제공.)
- **지정**: `-XX:+UseShenandoahGC`

### 2.7. Epsilon GC
No-Op 컬렉터. 메모리 **할당만 하고 회수는 하지 않는다**.
- **동작**: 힙 할당만 처리하며 GC를 수행하지 않는다. 힙이 소진되면 OOM으로 종료.
- **장점**: GC 오버헤드가 0이라 GC 영향을 배제한 성능 측정, 메모리 압박 테스트, 힙을 다 쓰기 전에 끝나는 초단명 작업에 유용.
- **단점**: 실사용(장기 실행) 서비스에는 부적합. 회수가 없으므로 반드시 OOM에 도달한다.
- **지원**: **JDK 11 experimental 도입 (JEP 318)**. 이후에도 experimental 상태로 유지되어 명시적 해제가 필요.
- **지정**: `-XX:+UnlockExperimentalVMOptions -XX:+UseEpsilonGC`

---

## 3. 선택 가이드

| GC | 우선 지표 | 적합 워크로드 | 도입 | 기본/정식 | 제거·deprecated |
|---|---|---|---|---|---|
| Serial | footprint | 단일 코어·소규모 힙, 컨테이너 소형 | JDK 1.0 | – | – |
| Parallel | throughput | 배치·대량 연산, 지연 비민감 | JDK 1.4~5 | JDK 8 기본 | – |
| CMS | latency | (사용 금지 — 대체됨) | JDK 1.4.1 | – | JDK 9 deprecated / JDK 14 제거 |
| G1 | 균형 | 범용 서버, 수 GB~수십 GB 힙 | JDK 6u14 exp | JDK 9 기본 | – |
| ZGC | latency | 대용량 힙·저지연 서비스 | JDK 11 exp | JDK 15 정식 | 비세대 모드 JDK 24 제거 |
| Shenandoah | latency | 저지연 서비스, 힙 무관 짧은 정지 | JDK 12 exp | JDK 15 정식 | – |
| Epsilon | 측정 | 성능 테스트·초단명 작업 | JDK 11 exp | (experimental 유지) | – |

- **처리량 최우선** → Parallel
- **지연·처리량 균형(범용)** → G1 (JDK 9+ 기본)
- **대용량 힙 + 저지연** → ZGC 또는 Shenandoah
- **최소 footprint** → Serial
- **GC 배제 측정** → Epsilon

> exp = experimental. experimental GC는 `-XX:+UnlockExperimentalVMOptions`가 필요하다.

---

## 4. 용어

### 4.1. concurrent marking
살아있는 객체 그래프를 **애플리케이션 스레드와 병행**하여 탐색·표시하는 단계. 마킹 전체를 STW로 수행하는 방식 대비 정지시간이 크게 줄어든다. 대신 마킹 도중 애플리케이션이 참조를 바꿀 수 있으므로, 변경을 추적하는 장치(write barrier, SATB 등)가 필요해 약간의 상시 오버헤드가 생긴다. G1·ZGC·Shenandoah가 사용한다.

### 4.2. compaction
살아남은 객체를 힙의 한쪽으로 몰아 **연속된 빈 공간**을 만드는 재배치 작업. 회수만 하고 재배치하지 않으면 빈 공간이 조각나(단편화) 큰 객체를 할당할 연속 공간이 부족해진다.
- CMS: compaction 없음 → 단편화 누적이 Full GC 폴백의 원인.
- G1: 리전 단위로 STW 중 객체를 옮기며 compaction(evacuation).
- ZGC·Shenandoah: compaction까지 동시에 수행(concurrent compaction/relocation).

### 4.3. colored pointer
ZGC의 핵심 기법. 64비트 **포인터의 여분 비트에 객체 상태 메타데이터**(마킹 여부, 재배치 여부 등)를 저장한다. 객체 헤더가 아닌 참조 자체에 상태가 실리므로, 참조를 읽는 순간 그 참조가 유효한지(재배치 전 주소인지)를 즉시 판별할 수 있다. 이 기법 때문에 ZGC는 64비트 플랫폼 전용이다.

### 4.4. load barrier
애플리케이션이 힙에서 **참조를 읽을(load) 때마다 JIT가 삽입하는 짧은 검사 코드**. ZGC에서는 읽은 포인터의 color 비트를 검사해, 재배치 등으로 낡은(stale) 참조면 새 주소로 고쳐 쓴 뒤(self-healing) 애플리케이션에 전달한다. 이 덕분에 객체 이동을 동시에 수행해도 애플리케이션은 항상 올바른 참조만 보게 되지만, 모든 참조 읽기에 비용이 붙어 처리량이 다소 낮아진다.

---

## Sources
- [JEP 248: Make G1 the Default Garbage Collector](https://openjdk.org/jeps/248)
- [JEP 291: Deprecate the Concurrent Mark Sweep (CMS) Garbage Collector](https://openjdk.org/jeps/291)
- [JEP 318: Epsilon: A No-Op Garbage Collector](https://openjdk.org/jeps/318)
- [JEP 333: ZGC: A Scalable Low-Latency Garbage Collector (Experimental)](https://openjdk.org/jeps/333)
- [JEP 363: Remove the Concurrent Mark Sweep (CMS) Garbage Collector](https://openjdk.org/jeps/363)
- [JEP 377: ZGC: A Scalable Low-Latency Garbage Collector (Production)](https://openjdk.org/jeps/377)
- [JEP 379: Shenandoah: A Low-Pause-Time Garbage Collector (Production)](https://openjdk.org/jeps/379)
- [JEP 439: Generational ZGC](https://openjdk.org/jeps/439)
- [JEP 474: ZGC: Generational Mode by Default](https://openjdk.org/jeps/474)
- [JEP 490: ZGC: Remove the Non-Generational Mode](https://openjdk.org/jeps/490)
- [HotSpot Virtual Machine Garbage Collection Tuning Guide (JDK 21)](https://docs.oracle.com/en/java/javase/21/gctuning/index.html)

---

## Related pages
- [[jvm-options]]
- [[java-process-analysis-tools]]
- [[java17-features]]
- [[java21-features]]
