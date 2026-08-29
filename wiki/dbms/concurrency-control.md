---
title: DBMS 동시성 제어와 일관성 전략 (Concurrency Control and Consistency)
updated: 2026-07-15 17:45:40
tags:
  - dbms
  - sql
  - concurrency
  - isolation-level
  - locking
  - mvcc
  - transaction
---

## 1. 개요

동시성 제어(Concurrency Control)는 여러 트랜잭션이 동시에 실행될 때 데이터
정합성을 보장하는 기법이다. 핵심은 **일관성 ↔ 성능(동시성/TPS)의 트레이드오프**이다.
정합성을 강하게 보장할수록 락 범위·유지 시간이 늘거나 검증 실패(abort) 재시도가
증가해 처리량(TPS)이 감소한다.

계층은 세 단계로 구분한다.
- **정책**: 트랜잭션 격리 수준 — 무엇을 허용/금지할지 정의
- **메커니즘**: 비관적 락 / 낙관적 락 / MVCC — 정책을 구현하는 방식
- **도구**: `SELECT ... FOR UPDATE` 등 SQL 명시적 잠금 문법

---

## 2. 트랜잭션 격리 수준 (Isolation Level)

각 수준은 허용되는 이상 현상(anomaly)으로 정의된다.

| 격리 수준 | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | 허용 | 허용 | 허용 |
| READ COMMITTED   | 방지 | 허용 | 허용 |
| REPEATABLE READ  | 방지 | 방지 | 허용* |
| SERIALIZABLE     | 방지 | 방지 | 방지 |

\* SQL 표준 기준. 실제 방지 여부는 DBMS 구현에 따라 다름 — 아래 '구현 차이' 참고.

- **Dirty Read**: 커밋되지 않은 데이터를 읽음
- **Non-repeatable Read**: 같은 행 재조회 시 값이 달라짐 (다른 tx의 UPDATE)
- **Phantom Read**: 같은 조건 범위 재조회 시 행 수가 달라짐 (INSERT/DELETE)

### 2.1. 수준별 장단점

- **READ UNCOMMITTED**
  - 장점: 락 거의 없음, 최고 동시성/TPS
  - 단점: dirty read 발생. 실무 사용 거의 없음
- **READ COMMITTED**
  - 장점: dirty read 방지하면서 락 유지 시간이 짧아 동시성 높음
  - 단점: 한 트랜잭션 내에서 읽기 일관성 없음(non-repeatable, phantom)
  - 비고: PostgreSQL·Oracle 기본값
- **REPEATABLE READ**
  - 장점: 트랜잭션 내 동일 스냅샷 보장(반복 읽기 일관성)
  - 단점: 표준상 팬텀 가능. 스냅샷/락 유지로 롱 트랜잭션 시 오버헤드,
    쓰기 충돌 시 직렬화 실패 가능
  - 비고: MySQL InnoDB 기본값
- **SERIALIZABLE**
  - 장점: 완전한 직렬성, 이상 현상 전부 차단
  - 단점: 락 경합 최대 또는 직렬화 실패(abort) 재시도 증가 → TPS 최저

핵심: 격리 수준을 높이면 이상 현상은 줄지만, 락 범위·유지 시간이 늘거나 검증
abort가 증가하여 동시성과 TPS가 감소한다.

### 2.2. 구현 차이

- **MySQL InnoDB**: REPEATABLE READ 기본. **Next-Key Lock**(레코드 락 + 갭 락)으로
  REPEATABLE READ에서도 팬텀을 상당 부분 방지(*). READ COMMITTED는 갭 락을 쓰지
  않아 팬텀이 발생 가능.
- **PostgreSQL**: READ COMMITTED 기본. RR은 **Snapshot Isolation**으로 구현되어
  팬텀은 없으나 **Write Skew** 발생 가능. SERIALIZABLE은 **SSI**(Serializable
  Snapshot Isolation)로 이를 탐지·abort. RR/SERIALIZABLE 사용 시 직렬화 실패에
  대비한 재시도 로직이 필요하다.
- **Oracle**: READ UNCOMMITTED/RR 미지원. SERIALIZABLE은 스냅샷 기반으로,
  실질적으로 Snapshot Isolation이므로 **Write Skew**가 가능하다(진정한 직렬성 아님).

---

## 3. 동시성 제어 메커니즘

### 3.1. 2-1. 비관적 락 (Pessimistic Locking)

"충돌이 자주 일어난다"고 가정하고 **작업 전에 락을 먼저 획득**한다.

- 동작: 공유 락(S)/배타 락(X)을 대상(row/page/table)에 걸고, 이론적으로는
  **2PL(Two-Phase Locking)** — 락 획득 단계와 해제 단계를 분리해 직렬성 보장.
- 장점: 충돌 시에도 데이터 정합성 확실, 재시도 로직 불필요
- 단점: 락 경합으로 처리량 저하, **데드락** 위험, 대기 시간 발생
- 적합: 충돌 빈도 높음, 재시도 비용이 큰 경우 (예: 재고 차감, 계좌 이체)

### 3.2. 2-2. 낙관적 락 (Optimistic Locking)

"충돌이 드물다"고 가정하고 **락 없이 진행 후 커밋 시점에 충돌을 검증**한다.

- 동작: `version`/`timestamp` 컬럼으로 구현. DB 기능이 아닌 **애플리케이션
  패턴**인 경우가 많다.
  ```sql
  UPDATE item SET stock = stock - 1, version = version + 1
  WHERE id = ? AND version = ?;   -- 영향 행 수 0이면 충돌 → 재시도
  ```
- 장점: 락 경합 없음, 읽기 위주 워크로드에서 확장성 높음
- 단점: 충돌 시 재시도 비용, 충돌 잦으면 재시도 폭증으로 오히려 비효율
- 적합: 읽기 위주, 충돌 빈도 낮음 (예: JPA `@Version`)

### 3.3. 2-3. MVCC (Multi-Version Concurrency Control)

읽기와 쓰기가 서로 막지 않도록 **버전 스냅샷**을 유지한다.

- 동작: 읽기는 특정 시점 스냅샷을 조회, 쓰기는 새 버전을 생성. 읽기가 쓰기를,
  쓰기가 읽기를 블로킹하지 않음.
- 장점: 읽기-쓰기 비블로킹으로 높은 동시성
- 단점: 구버전 저장 공간 필요(Postgres dead tuple → VACUUM, Oracle UNDO,
  InnoDB undo log), 롱 트랜잭션이 구버전 정리를 지연시킴
- 비고: PostgreSQL, MySQL InnoDB, Oracle 모두 채택

### 3.4. 메커니즘 비교

| 구분 | 비관적 락 | 낙관적 락 | MVCC |
|---|---|---|---|
| 충돌 처리 | 사전 차단(락) | 사후 검증(version) | 버전 격리 |
| 충돌 잦을 때 | 유리 | 불리(재시도↑) | - |
| 읽기 동시성 | 낮음 | 높음 | 높음 |
| 주 비용 | 락 경합/데드락 | 재시도 | 버전 저장/정리 |

---

## 4. SQL 명시적 잠금 도구

비관적 락을 SQL 레벨에서 직접 지정한다. 락은 트랜잭션 커밋/롤백 시 해제된다.

### 4.1. `SELECT ... FOR UPDATE`
- 동작: 조회된 행에 **배타 락(X)** 을 건다. 다른 트랜잭션의
  `FOR UPDATE`/`FOR SHARE`/`UPDATE`/`DELETE`를 커밋까지 차단(대기).
- 장점: 조회 후 갱신(read-then-write)의 정합성 보장(Lost Update 방지)
- 단점: 락 경합, 데드락 위험, 대기로 인한 응답 지연

### 4.2. `SELECT ... FOR SHARE` / `LOCK IN SHARE MODE`
- 동작: 조회 행에 **공유 락(S)** 을 건다. 다른 트랜잭션의 읽기는 허용, 쓰기는 차단.
- 장점: 참조되는 행이 갱신/삭제되지 않음을 보장하며 읽기 동시성 유지
  (예: 부모 행 존재 보장)
- 단점: 여러 tx가 S락 보유 후 각자 X락을 시도하면 **데드락** 빈발
- 비고: MySQL 8.0+ `FOR SHARE`, 5.7 이하 `LOCK IN SHARE MODE`

### 4.3. `NOWAIT`
- 동작: 락을 즉시 획득 못 하면 대기 없이 에러 반환
- 장점: 무한 대기 방지, 빠른 실패로 응답성 확보
- 단점: 애플리케이션에서 실패 처리/재시도 로직 필요

### 4.4. `SKIP LOCKED`
- 동작: 이미 잠긴 행을 건너뛰고 잠기지 않은 행만 반환
- 장점: 다중 워커가 작업 큐를 락 대기 없이 병렬 분배(각자 다른 행 획득)
- 단점: 결과 집합이 전체를 보장하지 않음 → **작업 큐 패턴 전용**
  ```sql
  SELECT * FROM job_queue WHERE status='ready'
  ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED;
  ```

### 4.5. `FOR UPDATE OF <table>`
- 동작: 조인 쿼리에서 특정 테이블의 행만 잠금
- 장점: 불필요한 테이블 락을 피해 경합 감소

### 4.6. `LOCK TABLE`
- 동작: 테이블 전체에 락
- 장점: 단순·강력한 차단
- 단점: 동시성 최악. 스키마 변경 등 예외적 상황 외 지양

### 4.7. 어드바이저리 락 (Advisory Lock)
- 동작: 행이 아닌 임의 키(정수)에 대한 애플리케이션 정의 락
  (PostgreSQL `pg_advisory_lock`). 세션 레벨(명시적 해제까지 유지) 또는
  트랜잭션 레벨(커밋 시 자동 해제)로 획득.
- 장점: 논리적 자원(배치 잡, 임계 구역)에 대한 락 → 분산 락 대용
- 단점: 애플리케이션이 락 규약을 지켜야 함, 세션 종료/명시적 해제 관리 필요

공통 주의: 명시적 락 사용 시 여러 트랜잭션이 락을 서로 다른 순서로 획득하면
데드락이 발생한다. 락 획득 순서를 일관되게 고정해 예방한다.

---

## 5. 선택 가이드

- **충돌 잦고 + 재시도 비용 큼** → 비관적 락(`FOR UPDATE`)
- **충돌 드물고 + 읽기 위주** → 낙관적 락(`version`)
- **작업 큐 병렬 처리** → `FOR UPDATE SKIP LOCKED`
- **정합성 최우선, TPS 희생 가능** → 격리 수준 상향(RR/SERIALIZABLE)
- **읽기 처리량 최우선** → READ COMMITTED + MVCC 활용

---

## Sources
- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [MySQL: Locking Reads](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html)
- [MySQL: Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html)
- [Oracle: Data Concurrency and Consistency](https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html)

---

## Related pages
- [[execution-plan]]
- [[optimizer-statistics]]
- [[oracle-hints]]
- [[jpa-transaction]]
