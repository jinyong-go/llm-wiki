---
title: HikariCP 풀 사이징
updated: 2026-07-20 11:07:09
tags:
  - spring
  - datasource
  - connection-pool
  - hikari
  - performance
---

## 1. 개요

커넥션 풀 크기는 크게가 아니라 작게 잡는 것이 핵심이다. 동시 사용자 10,000명 규모에서도 수십 개 이하의 커넥션이 적정하며, 과대 설정은 응답시간을 악화시킨다.

## 2. 원리

- 코어 수를 초과하는 스레드는 컨텍스트 스위칭 비용으로 오히려 느려진다
- 단, 스레드가 Disk·Network I/O로 블로킹되는 동안 다른 스레드가 실행될 수 있으므로 코어 수보다 많은 커넥션이 유효하다. DB 병목은 CPU, Disk, Network 세 가지로 요약된다
- SSD는 탐색·회전 지연이 없어 블로킹이 적으므로 커넥션을 늘리는 근거가 아니라 줄이는(코어 수에 근접) 근거가 된다
- Oracle Real-World Performance 시연: 다른 변경 없이 커넥션 2048→96 축소만으로 응답시간 ~100ms → ~2ms 개선
- PostgreSQL 벤치마크에서 TPS는 약 50 커넥션부터 정체

## 3. 공식

### 3.1. 시작점

PostgreSQL 프로젝트가 제안한 시작점으로, HikariCP는 대부분의 DB에 적용 가능하다고 본다.

```
connections = (core_count × 2) + effective_spindle_count
```

- `core_count`: 물리 코어 수. 하이퍼스레딩 스레드는 제외
- `effective_spindle_count`: 활성 데이터셋이 완전히 캐시되면 0, 캐시 적중률이 낮아질수록 실제 스핀들 수에 근접. SSD에 대한 공식의 유효성은 분석된 바 없음
- 예) 4-core CPU + HDD 1개: (4×2)+1 = 9, 올림해 10
- 시작점일 뿐이므로 예상 부하를 시뮬레이션해 이 값 주변에서 테스트 권장

작은 풀을 유지하고 나머지 애플리케이션 스레드는 커넥션 대기로 포화시키는 것이 원칙이다. 적정 풀 크기는 DB가 동시에 처리 가능한 쿼리 수이며, 코어 수 × 2를 크게 넘지 않는다.

### 3.2. 데드락 방지

단일 스레드가 커넥션 여러 개를 보유하는 경우(pool-locking) 데드락을 피하기 위한 최소 풀 크기:

```
pool_size = Tn × (Cm - 1) + 1
```

- `Tn`: 최대 동시 스레드 수
- `Cm`: 스레드 하나가 동시에 보유하는 최대 커넥션 수
- 예) 스레드 8개가 각 3개 커넥션 필요: 8 × (3-1) + 1 = 17
- 최적값이 아닌 데드락 회피를 위한 최소값
- 풀 확대 전 애플리케이션 수준 해결을 우선 검토. JTA 사용 시 동일 트랜잭션의 스레드에 같은 커넥션을 반환해 필요 커넥션 수 감소

발생 원인, 진단, 해결 방법 상세는 [[hikari-deadlock]] 참고.

## 4. 배포 환경별 조정

- 장기·단기 트랜잭션 혼재: 풀 인스턴스 2개 분리 (장기 작업용, 실시간 쿼리용)
- 장기 트랜잭션 위주: 잡 큐 등 외부 제약이 커넥션 수를 결정하므로 잡 큐 크기를 풀에 맞춤

---

## Sources
- [HikariCP Wiki — About Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)

---

## Related pages
- [[hikari-datasource]]
- [[hikari-deadlock]]
- [[multi-datasource]]
