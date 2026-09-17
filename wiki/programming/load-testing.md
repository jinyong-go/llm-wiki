---
title: 부하 테스트
updated: 2026-09-17 10:33:57
tags:
  - performance
  - testing
  - load-testing
---

## 1. 개요

### 1.1 정의
부하 테스트는 시스템에 일정 수준의 트래픽(동시 사용자, 요청)을 가해 그 조건에서의 동작과 성능을 검증하는 성능 테스트(Performance Testing)의 한 유형이다. 여러 연산을 동시에 처리하고 다수 사용자로부터의 다양한 요청에 응답해야 하는 시스템의 위험 요소를 사전에 파악하는 데 쓰인다.

### 1.2 목적
- 평상시 트래픽에서 시스템이 성능 기준을 충족하는지 검증
- 코드·인프라 변경 후에도 성능이 유지되는지 회귀 확인
- 병목 지점을 프로덕션 장애로 이어지기 전에 사전 발견
- 용량 산정(capacity planning) 및 스케일링 의사결정 근거 마련

## 2. 테스트 유형
"부하 테스트"는 넓게는 트래픽을 흉내 내는 모든 테스트를 가리키기도 하지만, 목적에 따라 세분화된다. 유형별로 명칭이나 경계는 조직·문헌마다 다를 수 있다.[^1]

| 유형 | 부하 수준 | 기간 | 목적 |
|---|---|---|---|
| Smoke | 낮음 | 짧음(초~분) | 스크립트·시스템이 최소 부하에서 정상 동작하는지 확인 |
| Average-load(평균 부하) | 평균 프로덕션 수준 | 중간(5~60분) | 평상시 사용량에서 성능 유지 여부 확인 |
| Stress | 평균 이상 | 중간(5~60분) | 평균을 초과하는 부하에서의 대응력 확인 |
| Soak(내구성) | 평균 | 긺(시간 단위) | 장시간 지속 사용 시 메모리 누수·자원 고갈 등 확인 |
| Spike | 매우 높음(급증) | 짧음(수 분) | 갑작스러운 트래픽 급증에 대한 생존 여부 확인 |
| Breakpoint | 한계까지 점증 | 필요한 만큼 | 시스템의 상한 용량 파악 |

권장 순서는 Smoke → Average-load → 필요에 따라 Stress/Soak/Spike/Breakpoint로 점진적으로 확장하는 것이다. 어떤 유형도 단독으로 모든 위험을 제거하지 못하므로, 시스템의 위험 프로파일(장시간 사용 위험이 큰지, 순간 폭주 위험이 큰지)에 따라 우선순위를 정한다.

## 3. 주요 지표
- Throughput(처리량): 초당 요청 수(Requests Per Second, RPS) 또는 초당 트랜잭션 수(Transactions Per Second, TPS)
- Error rate(오류율): 실패한 요청의 비율
- Duration/Latency(응답시간): 평균, 중앙값과 함께 p90/p95/p99 같은 백분위수를 함께 본다. 평균만으로는 꼬리 지연(tail latency)을 놓칠 수 있다
- Concurrent users(동시 사용자 수, VU): 특정 시점에 시스템과 상호작용 중인 사용자 수
- 자원 사용률: 부하 발생기(load generator)와 대상 시스템 양쪽의 CPU·메모리·네트워크 사용률

처리량·오류율·응답시간 세 지표는 RED 방법론(Rate·Errors·Duration)의 기준과 대응하며, 트래픽·가용성·지연을 각각 나타낸다.[^2]

## 4. 동시 사용자 수 산정
분석 도구(예: 웹 애널리틱스)에서 시간당 세션 수와 평균 세션 시간을 얻을 수 있다면 다음 식으로 시간당 동시 사용자 수 기준선을 구할 수 있다.

$$
\text{동시 사용자 수} = \frac{\text{시간당 세션 수} \times \text{평균 세션 시간(초)}}{3600}
$$

일 평균이나 월 평균 대신 시간대별(hourly) 지표를 사용해야 특정 시간대에 몰리는 피크 트래픽을 놓치지 않는다. 부하 테스트는 평균 트래픽이 아니라 피크 트래픽을 기준으로 설계하고, 과거 최고 트래픽에 안전 마진을 더해 목표치를 잡는 것이 권장된다.

## 5. 실행 과정
1. 목표·성능 기준(SLA) 정의
2. 실제 사용 패턴에 근거한 시나리오 설계 (§4의 동시 사용자 산정 활용)
3. 프로덕션과 유사한 테스트 환경 준비
4. 부하 패턴 설계: ramp-up(점증) → 목표 부하 유지 → ramp-down(점감). ramp-up 기간은 보통 전체 테스트 시간의 5~15%, 목표 부하 유지 기간은 ramp-up의 5배 이상을 권장
5. 테스트 실행과 동시에 부하 발생기·대상 시스템 자원 모니터링
6. 결과 분석 및 병목 식별
7. 튜닝 후 재실행(반복적 과정)

패턴은 단순하게 유지한다. 부하가 여러 번 오르내리는 "롤러코스터"형 패턴은 자원을 낭비하고 원인 분리를 어렵게 만든다.

## 6. 주요 도구
- Apache JMeter — GUI 기반 테스트 계획 작성과 CLI 기반 부하 실행을 모두 지원하는 오픈소스 도구 ([[jmeter-introduction]], [[jmeter-components]])
- k6 — JavaScript 기반 스크립팅, CLI 중심, 대시보드(Grafana Cloud) 연동
- Gatling, Locust, nGrinder, Apache Bench(ab), wrk 등도 흔히 쓰인다

## 7. 주의사항
- **부하 발생기 자체가 병목이 될 수 있다.** 부하 발생기의 CPU(80% 이하 유지 권장), 메모리(90% 이하, 스왑 비활성화 권장), 네트워크 대역폭을 모니터링해야 하며, 이 자원이 포화되면 측정된 응답시간이 실제보다 부풀려질 수 있다
- **부하 발생기 1대의 한계를 넘으면 분산 실행이 필요하다.** 필요한 요청량이 발생기 1대의 처리 한계를 넘으면 여러 대로 분산해 부하를 생성해야 한다
- **happy path[^3]만 가정한 응답 검증은 부하 상태에서 깨질 수 있다.** 시스템이 과부하로 실패 응답(빈 본문, 오류 코드 등)을 반환할 수 있으므로, 검증 로직은 예외적 응답에도 견고해야 한다
- **ramp-up 없이 즉시 목표 부하를 가하면 안 된다.** 급격한 부하는 시스템이나 스테이징 환경을 예기치 않게 다운시킬 수 있어, 처음에는 작게 시작하고 점진적으로 늘리는 것이 권장된다
- **일 평균·월 평균 트래픽으로 목표치를 잡으면 피크 시간대 위험을 과소평가한다** (§4)

## 8. 기타
- **지속적 성능 테스트(Continuous Performance Testing)**: 부하 테스트를 일회성으로 그치지 않고 CI/CD 파이프라인, cron 작업, 릴리스 체크리스트 등을 통해 정기적으로 실행하면 성능 회귀를 조기에 감지할 수 있다. 자동화라고 해서 수동 테스트가 필요 없어지는 것은 아니며, 두 방식을 병행하는 것이 권장된다
- **Synthetic monitoring과의 구분**: Smoke test 수준의 가벼운 부하를 운영 환경에 상시 주기적으로 실행해 서비스 상태를 감시하는 것을 synthetic monitoring이라 한다. 사전에 한계를 검증하는 부하 테스트와 달리, synthetic monitoring은 실서비스를 지속적으로 관찰하는 목적을 가진다
- 병목 진단·처리량 이론(Little's Law)·스레드 풀 사이징 등 서버 측 대응은 [[tps-improvement]] 참고

---
## Sources
- [Load test types - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
- [Average-load testing - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/test-types/load-testing/)
- [Metrics - Grafana k6 documentation](https://grafana.com/docs/k6/latest/using-k6/metrics/)
- [Calculate concurrent users for load tests - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/calculate-concurrent-users/)
- [Running large tests - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/running-large-tests/)
- [Automated performance testing - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/automated-performance-testing/)
- [Synthetic monitoring - Grafana k6 documentation](https://grafana.com/docs/k6/latest/testing-guides/synthetic-monitoring/)
- [Glossary (happy path) - Grafana k6 documentation](https://grafana.com/docs/k6/latest/reference/glossary/#happy-path)

---
## Related pages
- [[jmeter-introduction]]
- [[jmeter-components]]
- [[tps-improvement]]

[^1]: k6 공식 문서도 "이 테스트 유형들의 명칭에 대한 합의조차 없다"고 명시하며, 한 애플리케이션의 stress test가 다른 애플리케이션에는 average-load test일 수 있다고 설명한다. 위 표의 경계는 절대적 기준이 아니라 상대적 참고치다.
[^2]: RED 방법론(Rate, Errors, Duration)과 Google SRE의 Four Golden Signals는 k6 지표 문서에서 인용하는 외부 개념으로, k6 자체 정의는 아니다.
[^3]: happy path란 시스템이 오류 없이 정상적으로 응답하는 기본 흐름만 가정하는 것을 가리키는 용어다. k6 용어집은 "시스템이 오류를 반환하지 않을 때 발생하는 기본 동작(the default behavior that happens when the system returns no errors)"으로 정의한다.
