---
title: TPS 향상 전략
updated: 2026-09-16 09:58:29
tags:
  - performance
  - scaling
  - concurrency
  - jvm
---

## 1. 개요
애플리케이션 서버의 처리량(TPS)을 높이려면 먼저 병목 지점이 DB인지 서버인지부터 구분해야 한다. 서버가 병목인 경우, 원인이 CPU bound 연산인지 IO bound 대기인지에 따라 해법이 달라진다. CPU bound는 스케일링(수직/수평)으로, IO bound는 스레드 풀 조정·비동기·경량 스레드로 대응한다.

## 2. 병목 지점 진단

### 2.1 USE Method
Brendan Gregg의 USE Method: 모든 자원(CPU, 메모리, 디스크 I/O, 네트워크)에 대해 utilization(사용률), saturation(포화도·대기 큐), errors(오류)를 점검한다. utilization 100%는 병목 후보, saturation 존재는 대기 발생을 의미한다. 짧은 스파이크는 장주기 평균에 가려질 수 있어 순간 포화를 놓칠 수 있다.

### 2.2 DB 병목 vs 서버 병목
- 특정 엔드포인트만 느리면 해당 코드·쿼리 문제, 전체가 느리면 인프라(DB·네트워크·서버) 문제일 가능성이 높다
- APM(Application Performance Monitoring)의 분산 트레이싱으로 요청 처리 시간 중 애플리케이션 코드/외부 호출/DB 쿼리 비중을 분해해 확인
- 서버 CPU·메모리 사용률이 높고 APM에서 특정 함수 실행 시간이 길면 서버(연산) 병목
- 슬로우 쿼리 로그, EXPLAIN, 커넥션 풀의 Active/Idle/Wait Time 지표로 DB 병목 여부 확인 ([[jdbc-connection-pool]], [[hikari-pool-sizing]])

## 3. 처리량의 이론적 한계: Little's Law
$$L = \lambda W$$
- $L$: 시스템 내 동시 처리 중인 요청 수(concurrency)
- $\lambda$: 요청 도착률(처리량, TPS)
- $W$: 요청 하나의 평균 처리 시간(지연시간)

응답시간이 고정이면 처리량을 높이기 위해 동시 처리 요청 수를 늘려야 한다. 예: 평균 지연 50ms로 200 TPS를 처리 중이면 동시 처리 요청은 10개. 2000 TPS로 늘리려면 동시 처리 요청이 100개로 늘어야 한다. 스레드-요청 1:1 모델에서는 스레드 수가 이 동시성의 상한이 되므로, 스레드 수 부족이 곧 TPS 상한이 된다.

## 4. 스레드 풀 사이징

### 4.1 Goetz 공식
```
스레드 수 = 코어 수 × (1 + 대기시간/서비스시간)
```
- 서비스시간: 실제 CPU 연산에 쓰는 시간, 대기시간: I/O·락 대기 등 블로킹 시간
- 대기시간/서비스시간 비율을 blocking coefficient라 한다
- CPU bound 작업은 blocking coefficient가 0에 가까워 스레드 수 ≈ 코어 수. 코어 수 이상 늘려도 처리량은 늘지 않는다
- 예: 4코어, 외부 호출 대기 50ms + 처리 5ms → `4 × (1 + 50/5) = 44`
- 여러 스레드 풀을 운영하며 목표 CPU 사용률을 별도로 두려면 계수를 곱한다: `코어 수 × 목표 CPU 사용률(0~1) × (1 + 대기시간/서비스시간)`

### 4.2 풀 크기와 처리량의 관계
스레드 풀 크기가 정해지면 Little's Law로 이론적 처리 가능 TPS를 역산할 수 있다: `풀 크기 / 평균 응답시간(초)`. §4.1 예시(44 스레드, 응답시간 55ms)를 대입하면 `44 / 0.055 ≈ 800 TPS`. 이론적 상한이며 실측 부하테스트로 조정해야 한다.

### 4.3 하위 자원의 한계
스레드 풀은 하위 의존 자원(DB 커넥션 풀, 외부 서비스 동시 처리 한도)을 넘어서면 의미가 없다. DB 커넥션 풀보다 큰 스레드 풀은 스레드가 커넥션 대기로 막힐 뿐이다 ([[hikari-pool-sizing]]).

## 5. CPU bound 병목 대응
연산 자체가 오래 걸려 코어가 포화된 경우, 스레드·커넥션을 늘려도 처리량이 늘지 않는다.

### 5.1 수직 스케일링(Vertical Scaling)
더 강력한 단일 서버(코어 수·클럭 증가)로 교체. 구현이 단순하고 분산 복잡도가 없지만 단일 머신 최대 사양이라는 물리적 한계가 있다.

### 5.2 수평 스케일링(Horizontal Scaling)
서버 인스턴스를 늘리고 로드밸런서로 분산한다 ([[load-balancer]]). Stateless 애플리케이션에 효과적이고 장애 격리에도 유리하다. 단, 병렬화 불가능한 직렬 구간(공유 자원 경합, 코디네이션 오버헤드)이 존재하면 노드를 늘릴수록 이득이 체감한다.[^1]

$$S(n) = \frac{1}{(1-p) + p/n}$$
- $p$: 병렬화 가능한 비율, $n$: 병렬 처리 유닛(코어/노드) 수

### 5.3 연산 자체 최적화
스케일링 전에 알고리즘 시간복잡도 개선이 비용 대비 효과가 큰 경우가 많다. 입력 크기 $n$ 기준 $O(n^2)$ 로직을 $O(n \log n)$(정렬 기반), $O(\log n)$(이진탐색·트리 인덱스), $O(1)$(해시맵 조회)로 낮추면 서버 증설 없이 서비스시간 자체가 줄어든다. 예: [[cpu-usage-troubleshooting]]

## 6. IO bound 병목 대응
스레드가 네트워크·디스크 I/O 대기로 블로킹되어 CPU는 유휴 상태인 경우, 스레드 수를 코어 수 이상으로 늘리는 것이 유효하다(§4.1). 다만 OS 스레드(platform thread) 자체가 비용이 커 무한정 늘릴 수 없다.

### 6.1 비동기(Asynchronous) 논블로킹 스타일
I/O 대기 중 스레드를 반환하고 콜백으로 완료를 통지하는 방식(Netty 이벤트 루프 등, [[netty]]). OS 스레드 수 제약 없이 높은 동시성을 낼 수 있지만, 요청 처리 로직을 콜백·파이프라인으로 쪼개야 해 스택 트레이스·디버깅·프로파일링이 어려워진다.

### 6.2 경량 스레드(Java 가상 스레드)
JDK 21(JEP 444)에서 정식화된 가상 스레드는 OS 스레드에 1:1로 매핑되지 않는 M:N 스케줄링 스레드다. 블로킹 I/O 호출 시 런타임이 논블로킹 시스템 콜로 전환하고 가상 스레드를 언마운트해, thread-per-request 스타일을 유지하면서 비동기 수준의 처리량을 얻는다.
- 스레드당 자원 비용이 낮아 요청마다 새로 생성하며 풀링하지 않는다
- CPU bound 작업에는 효과가 없다(코어 수 이상 늘려도 무의미, §5)
- 동시 작업 수가 많고(수천 이상) I/O 대기 비중이 큰 워크로드에서 효과가 크다
- 스레드-로컬 변수로 커넥션 등을 캐싱하던 기존 패턴은 가상 스레드마다 자원을 새로 만들 위험이 있어 캐싱 전략 재검토가 필요하다

## 7. 정리
| 병목 위치 | 원인 | 대응 |
|---|---|---|
| DB | 슬로우 쿼리, 락 경합, 커넥션 풀 부족 | 쿼리·인덱스 튜닝, 격리수준 조정, 풀 사이징 |
| 서버 · CPU bound | 연산 자체가 느림, 코어 포화 | 알고리즘 최적화 → 수직/수평 스케일링 |
| 서버 · IO bound | 스레드가 I/O 대기로 블로킹 | 스레드 풀 사이징 조정, 비동기·경량 스레드 도입 |

[^1]: Amdahl's Law는 원래 단일 시스템 내 다중 프로세서 병렬화를 대상으로 한다. 노드 간 통신·코디네이션 비용이 있는 분산 수평 확장에도 "직렬 구간이 병목이 된다"는 동일 원리가 유추적으로 적용되나, 이를 더 정밀하게(코디네이션 오버헤드까지) 모델링한 것은 Universal Scalability Law(USL)다.

---
## Sources
- [Little's law (Wikipedia)](https://en.wikipedia.org/wiki/Little's_law)
- [How to set an ideal thread pool size (Zalando Engineering)](https://engineering.zalando.com/posts/2019/04/how-to-set-an-ideal-thread-pool-size.html)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [The USE Method (Brendan Gregg)](https://www.brendangregg.com/usemethod.html)
- [Amdahl's law (Wikipedia)](https://en.wikipedia.org/wiki/Amdahl's_law)
- [Horizontal vs Vertical Scaling in AWS (CloudKeeper)](https://www.cloudkeeper.com/insights/blog/horizontal-vs-vertical-scaling)
- [Analyzing round trip query latency (Datadog)](https://www.datadoghq.com/blog/analyzing-roundtrip-query-latency/)

---
## Related pages
- [[jdbc-connection-pool]]
- [[hikari-pool-sizing]]
- [[cpu-usage-troubleshooting]]
- [[netty]]
- [[load-balancer]]
- [[gc]]
- [[jvm-options]]
