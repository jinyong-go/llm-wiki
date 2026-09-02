---
title: RDBMS 옵티마이저 통계 (Optimizer Statistics)
updated: 2026-07-16 10:50:35
tags:
  - dbms
  - sql
  - oracle
  - postgresql
  - mysql
  - statistics
  - analyze
---

## 1. 개요

옵티마이저 통계는 테이블·컬럼·인덱스의 데이터 분포를 기록한 메타 정보로, CBO(Cost-Based Optimizer, 비용 기반 옵티마이저)가 [[execution-plan]]의 비용을 계산하는 근거다.

수집은 사용자가 명령으로 직접 실행하는 방법 외에, 세 DBMS 모두 자동 수집을 지원한다. Oracle은 야간 유지관리 창의 자동 통계 수집 잡, PostgreSQL은 autovacuum의 임계치 기반 자동 실행, MySQL(InnoDB)은 행의 10% 변경 시 백그라운드 자동 재계산으로 동작한다. 상세 조건은 각 DBMS 절 참고.

| 대상 | 주요 항목 |
|---|---|
| 테이블 | 행 수, 블록(페이지) 수, 평균 행 길이 |
| 컬럼 | 고유값 수(NDV), NULL 수, 최소/최대값, 히스토그램 |
| 인덱스 | 깊이, 리프 블록 수, 클러스터링 팩터 ([[index-scan]] 6.2 참고) |

## 2. Oracle

### 2.1 수집

```sql
EXEC DBMS_STATS.GATHER_TABLE_STATS('<schema>', '<table>');
EXEC DBMS_STATS.GATHER_SCHEMA_STATS('<schema>');
```

- 기본적으로 야간 유지관리 창의 자동 통계 수집 잡이 누락·낡은(stale) 통계를 갱신한다.
- `ESTIMATE_PERCENT`는 기본값 `AUTO_SAMPLE_SIZE` 사용이 권장된다 (전수에 가까운 정확도를 해시 기반으로 빠르게 산출).
- `METHOD_OPT` 기본값 `FOR ALL COLUMNS SIZE AUTO`는 컬럼 사용 이력을 근거로 히스토그램 생성 여부를 자동 결정한다.

### 2.2 히스토그램

데이터 편중(skew)이 있는 컬럼의 카디널리티 예측을 위해 생성한다. `SIZE AUTO`는 쿼리에서 사용된 조건 컬럼 이력(`SYS.COL_USAGE$`)을 참고하므로, **테이블이 쿼리된 적이 있어야 생성**된다. 기본 최대 버킷 수는 254.

| 유형 | 조건 |
|---|---|
| Frequency | NDV ≤ 버킷 수. 고유값마다 버킷 1개 |
| Top Frequency | NDV > 버킷 수, 상위 n개 값이 행의 대부분(기본 99.6%+) 차지 |
| Hybrid | NDV > 버킷 수, Top Frequency 미충족 (12c+, 기본) |
| Height-Balanced | 레거시. `AUTO_SAMPLE_SIZE`가 아닌 수동 샘플링 시에만 생성 |

### 2.3 조회·관리

```sql
SELECT table_name, num_rows, last_analyzed, stale_stats
FROM   user_tab_statistics;
```

- 통계 고정: `DBMS_STATS.LOCK_TABLE_STATS` (변동이 심한 중간 테이블 등)
- 통계 부재 시 옵티마이저는 dynamic statistics(동적 샘플링)로 실행 시점에 보완한다.

## 3. PostgreSQL

### 3.1 수집

```sql
ANALYZE <table>;   -- 테이블명 생략 시 전체 DB
```

- 일부 행을 랜덤 샘플링해 수집한다. 평소에는 autovacuum[^1]이 변경 누적치가 임계(`autovacuum_analyze_threshold` + 행 수 × `autovacuum_analyze_scale_factor`, 기본 10%)를 넘으면 자동 실행한다.
- **파티션 상위 테이블은 autovacuum이 ANALYZE하지 않으므로** 대량 변경 후 수동 실행이 권장된다.

### 3.2 저장·조회

- 테이블 수준(`reltuples`, `relpages`)은 `pg_class`, 컬럼 수준은 `pg_statistic`(뷰 `pg_stats`)에 저장된다.
- 컬럼당 most common values·histogram 항목 수는 `default_statistics_target`(기본 100)이 결정한다. 분포가 불규칙한 컬럼은 개별 상향:

```sql
ALTER TABLE t ALTER COLUMN c SET STATISTICS 500;
```

### 3.3 확장 통계

기본 통계는 컬럼 간 독립을 가정하므로, 상관관계가 있는 컬럼 조합은 `CREATE STATISTICS`로 보완한다.

```sql
CREATE STATISTICS s (dependencies) ON city, zip FROM addr;
```

| 종류 | 용도 |
|---|---|
| dependencies | 함수적 종속 (예: zip → city). 등치 조건 조합의 선택도 보정 |
| ndistinct | 컬럼 조합의 고유값 수 (`GROUP BY a, b` 추정) |
| mcv | 컬럼 조합의 최빈값 목록 |

## 4. MySQL (InnoDB)

### 4.1 수집

```sql
ANALYZE TABLE <table>;   -- 동기(포그라운드) 재계산
```

- 영속 통계(`innodb_stats_persistent=ON`, 기본)는 서버 재시작 후에도 유지되어 계획 안정성을 높인다.
- `innodb_stats_auto_recalc=ON`(기본)이면 **테이블 행의 10% 변경 시 백그라운드 자동 재계산**된다.
- 카디널리티는 인덱스 페이지 샘플링(`innodb_stats_persistent_sample_pages`, 기본 20)으로 추정한다. 대형 테이블에서 추정이 부정확하면 테이블 단위로 상향:

```sql
ALTER TABLE t STATS_SAMPLE_PAGES=100;
```

### 4.2 저장·조회

```sql
SELECT * FROM mysql.innodb_table_stats WHERE table_name='t';
SELECT * FROM mysql.innodb_index_stats WHERE table_name='t';
```

### 4.3 히스토그램

인덱스 없는 컬럼의 편중 데이터 예측용 (8.0+):

```sql
ANALYZE TABLE t UPDATE HISTOGRAM ON c WITH 32 BUCKETS;
-- 조회: information_schema.COLUMN_STATISTICS
```

자동 재계산되지 않으므로 데이터 변경 후 수동 갱신이 필요하다.

## 5. 트러블슈팅

### 5.1 테스트 데이터 추가 후 코스트 이상 현상

대량의 테스트 데이터를 추가한 뒤에도 이전 소량 데이터 기준의 실행 계획·비용이 그대로 출력되는 경우가 있다.

- **원인**: 통계가 갱신되지 않아 CBO가 구(舊) 통계 기반으로 계획을 수립.
- **해결**: 데이터 이행·대규모 DML 후 즉시 해당 테이블 통계를 재수집(`DBMS_STATS`/`ANALYZE`)한다. 갱신 후 최신 데이터 크기를 반영한 경로로 전환된다.
	- 예: Nested Loops → Hash Join

### 5.2 바인드 변수와 히스토그램에 의한 계획 급변

같은 쿼리가 어느 시점부터 갑자기 느려지는 경우.

- **원인**: 히스토그램이 있는 편중 컬럼에 바인드 변수를 쓰면 최초 하드 파싱 시 피킹(peek)된 값 기준으로 계획이 수립·공유된다. 저빈도 값 기준 계획이 고빈도 값 실행에 재사용되면 성능이 급락한다.
- **해결**: Oracle 11g+는 Adaptive Cursor Sharing이 값별로 계획을 분화해 완화한다. 편중이 심한 조건은 리터럴 분리, SQL Plan Baseline에 의한 계획 고정을 검토한다.

### 5.3 자동 수집에서 제외되는 테이블

자동 수집이 켜져 있어도 통계가 갱신되지 않는 대상이 있다.

- **PostgreSQL 임시 테이블**: autovacuum이 접근할 수 없어 세션에서 수동 `ANALYZE`가 필요하다. 파티션 상위 테이블도 동일 (3.1 참고).
- **Oracle 휘발성 중간 테이블**: 잡 실행 중 행 수가 급변해 어느 시점 통계도 대표성이 없다. 대표 상태에서 수집 후 통계를 고정(2.3 참고)하거나 동적 샘플링에 맡긴다.

[^1]: autovacuum은 PostgreSQL의 백그라운드 프로세스로, 죽은 튜플(dead tuple) 공간 회수(VACUUM)와 옵티마이저 통계 수집(ANALYZE)을 테이블별 변경 누적치 기반으로 자동 수행한다.

---
## Sources
- [Oracle SQL Tuning Guide — Optimizer Statistics Concepts (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-statistics-concepts.html)
- [Oracle SQL Tuning Guide — Histograms (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/histograms.html)
- [PostgreSQL: Statistics Used by the Planner](https://www.postgresql.org/docs/current/planner-stats.html)
- [PostgreSQL: ANALYZE](https://www.postgresql.org/docs/current/sql-analyze.html)
- [MySQL: InnoDB Persistent Optimizer Statistics](https://dev.mysql.com/doc/refman/8.4/en/innodb-persistent-stats.html)
- [MySQL: ANALYZE TABLE Statement](https://dev.mysql.com/doc/refman/8.4/en/analyze-table.html)
- [Oracle Optimizer Blog — Why do I have SQL statement plans that change for the worse?](https://blogs.oracle.com/optimizer/why-do-i-have-sql-statement-plans-that-change-for-the-worse)
- [PostgreSQL: Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)

---
## Related pages
- [[execution-plan]]
- [[index-scan]]
- [[oracle-hints]]
