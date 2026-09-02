---
title: DBMS 데드락과 라이브락 (Deadlock, Livelock)
updated: 2026-07-20 10:51:56
tags:
  - dbms
  - concurrency
  - locking
  - transaction
  - troubleshooting
---

## 1. 개요

둘 다 트랜잭션이 진행되지 못하는 동시성 장애 상태이나 양상이 다르다.

| 구분 | 데드락 | 라이브락 |
|---|---|---|
| 상태 | 상호 대기로 완전 정지 | 상태는 계속 변하지만 진행 없음 |
| 원인 | 순환 대기 | 충돌 회피 동작의 반복 충돌 |
| 감지 | DBMS가 자동 감지·해소 | 정지 상태가 아니라서 감지 어려움 |
| 해소 | 희생자(victim) 롤백 | 백오프·재시도 상한 등 애플리케이션 대응 |

## 2. 데드락

### 2.1. 발생 조건

네 조건이 모두 성립할 때 발생한다 (Coffman 조건).

- 상호 배제 — 자원(락)을 한 번에 하나의 트랜잭션만 점유
- 점유 대기 — 락을 보유한 채 다른 락을 대기
- 비선점 — 락을 강제로 뺏을 수 없음
- 순환 대기 — 대기 관계가 순환 구조를 형성

전형적 사례: 두 트랜잭션이 같은 행들을 서로 반대 순서로 갱신, 또는 여러 트랜잭션이 공유 락(shared lock) 보유 후 각자 배타 락(exclusive lock) 승급 시도 ([[concurrency-control]]의 `FOR SHARE` 항목 참고).

### 2.2. DBMS별 감지·해소

DBMS는 대기 그래프(wait-for graph)의 순환을 검사해 자동으로 감지하고, 트랜잭션 하나를 희생자로 골라 롤백한다.

- **MySQL InnoDB** — 데드락 감지가 기본 활성. 삽입·갱신·삭제 행 수가 적은 트랜잭션을 희생자로 선택해 롤백하고 에러 1213(`ER_LOCK_DEADLOCK`)을 반환한다. 고동시성 환경에서 감지 비용이 클 경우 `innodb_deadlock_detect=OFF`로 끄고 `innodb_lock_wait_timeout` 초과 롤백에 의존할 수 있다. 테이블 락 등 감지가 적용되지 않는 경우도 타임아웃으로 해소한다
- **PostgreSQL** — 락 대기가 `deadlock_timeout`(기본 1s)을 넘으면 데드락 검사를 수행한다. 감지 시 관여 트랜잭션 중 하나를 중단(SQLSTATE `40P01`)하며, 어느 쪽이 중단될지는 예측할 수 없다
- **Oracle** — 자동 감지 후 감지한 세션의 해당 문장만 롤백하고 `ORA-00060`을 반환한다. 트랜잭션 자체는 유지되므로 애플리케이션이 명시적으로 롤백 또는 재시도해야 한다

### 2.3. 진단

- MySQL: `SHOW ENGINE INNODB STATUS`로 최근 데드락 상세 확인, `innodb_print_all_deadlocks=ON`으로 모든 데드락을 에러 로그에 기록
- PostgreSQL: 에러 로그의 데드락 상세(관여 프로세스·쿼리), `pg_locks` 뷰로 대기 관계 조회
- Oracle: 트레이스 파일에 관여 세션·SQL·락 정보 기록

### 2.4. 예방

- **락 획득 순서 고정** — 모든 트랜잭션이 여러 객체를 같은 순서로 잠금. 가장 효과적인 방법
- **필요한 최고 강도 락을 먼저 획득** — 공유 락 후 배타 락 승급 패턴 제거
- **트랜잭션 짧게 유지** — 락 유지 시간 축소. 사용자 입력 대기 등 장기 트랜잭션 금지
- **인덱스 최적화** — 스캔 행이 줄면 잠기는 행도 줄어 충돌 확률 감소
- **격리 수준 하향** — 잠금 읽기 사용 시 READ COMMITTED 고려 (갭 락 회피)
- **재시도 로직** — 데드락 롤백은 정상 동작의 일부. 애플리케이션은 재실행을 전제로 작성

## 3. 라이브락

### 3.1. 정의

트랜잭션이 중단 없이 계속 동작하지만 작업이 진전되지 않는 상태. 데드락과 달리 대기 정지가 아니라 상태 변화가 계속되므로 DBMS가 자동 감지하지 못한다.

### 3.2. DBMS 사례

- 배타 락 반복 거부 — 겹치는 공유 락이 끊임없이 유입되어 배타 락 요청이 계속 밀리는 경우
- 재시도 동기화 — 데드락·충돌 회피 로직이 동시에 동일하게 반복(락 해제 후 재시도)되어 매번 다시 충돌하는 경우
- 낙관적 락 재시도 폭증 — 충돌이 잦은 워크로드에서 다수 트랜잭션이 검증 실패·재시도를 반복 ([[concurrency-control]]의 낙관적 락 참고)
- 데드락 희생자 반복 — 재시도한 트랜잭션이 반복해서 희생자로 선정되는 경우

### 3.3. 대응

- **랜덤 백오프** — 재시도 간격에 무작위 지연을 넣어 동기화된 반복 충돌을 해소
- **재시도 상한** — 무한 재시도를 차단하고 초과 시 실패 처리
- **대기 큐 공정성** — DBMS 락 매니저는 락 요청을 대기 큐로 관리해 선행 배타 락 대기자가 후행 공유 락에 무한히 밀리지 않도록 한다[^1]

[^1]: 추론. PostgreSQL은 락 대기자를 큐로 관리하며 후행 요청이 선행 대기자와 충돌하면 함께 대기시키는 동작이 문서화되어 있으나([Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)), 모든 DBMS의 락 매니저가 동일한 공정성을 보장하는지는 개별 확인하지 않았음.

---

## Sources
- [MySQL: Deadlock Detection](https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlock-detection.html)
- [MySQL: How to Minimize and Handle Deadlocks](https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlocks-handling.html)
- [PostgreSQL: Explicit Locking — Deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL: Lock Management (deadlock_timeout)](https://www.postgresql.org/docs/current/runtime-config-locks.html)
- [Oracle: Data Concurrency and Consistency](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html)
- [Deadlock, Livelock and Starvation (Baeldung CS)](https://www.baeldung.com/cs/deadlock-livelock-starvation)
- [Starvation and Livelock (GeeksforGeeks)](https://www.geeksforgeeks.org/operating-systems/deadlock-starvation-and-livelock/)

---

## Related pages
- [[concurrency-control]]
- [[jpa-transaction]]
- [[hikari-deadlock]]
