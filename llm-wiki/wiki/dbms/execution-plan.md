---
title: RDBMS 실행 계획 (Execution Plan)
updated: 2026-08-11 17:04:12
tags:
  - dbms
  - sql
  - oracle
  - postgresql
  - mysql
  - execution-plan
  - tuning
---

## 1. 개요

실행 계획은 옵티마이저가 SQL을 실행하기 위해 수립한 작업 경로와 순서이다. 비용 기반 옵티마이저(CBO)는 [[optimizer-statistics]]를 바탕으로 후보 계획의 비용을 계산해 가장 낮은 것을 선택한다.

- **예상 실행 계획**: 쿼리를 실행하지 않고 옵티마이저의 예측만 출력.
- **실제 실행 계획**: 쿼리를 실행하고 단계별 실측치(행 수, 시간, I/O)를 함께 출력. 튜닝은 예상치와 실측치의 괴리를 찾는 것이 핵심이다.
- **Cost는 상대적 예측치**다. 시간 단위가 아니며 DBMS 간, 서로 다른 쿼리 간 절대 비교에 쓸 수 없다.

실행 계획은 계층적 트리 구조(row source tree)다. **가장 깊이 들여쓰기된 연산부터 실행**되고, 같은 레벨의 형제 노드는 위에서 아래로 실행되며, 결과 행은 부모 노드로 전달된다(bottom-up).

## 2. Oracle

### 2.1 확인 방법

```sql
-- 예상 실행 계획
EXPLAIN PLAN FOR <SQL>;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- 실제 실행 계획 (캐싱된 커서의 실측 통계)
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('<sql_id>', 0, 'ALLSTATS LAST'));
```

- `sql_id`는 공유 풀(라이브러리 캐시)에 캐싱된 SQL 문장을 식별하는 해시 기반 ID다. `V$SQL`에서 SQL 텍스트로 검색하거나, 실행 중인 세션은 `V$SESSION.SQL_ID`로 확인한다.
- 단계별 실측치(A-Rows 등)는 세션에 `STATISTICS_LEVEL=ALL`이 설정되어 있거나 쿼리에 `/*+ GATHER_PLAN_STATISTICS */` 힌트가 있어야 수집된다.
- SQL*Plus `SET AUTOTRACE ON`으로 실행 직후 계획·통계를 볼 수 있다.
- 장시간 쿼리는 Real-Time SQL Monitoring(`V$SQL_MONITOR`, Tuning Pack 필요)으로 실행 중 진행 상황을 단계별로 관찰할 수 있다.

### 2.2 출력 항목

기본 출력:

| 항목 | 의미 |
|---|---|
| Id | 실행 단계 번호. 들여쓰기가 계층 구조 |
| Operation | 연산 유형 (`INDEX RANGE SCAN`, `HASH JOIN` 등) |
| Name | 대상 객체 (테이블/인덱스명) |
| Rows (E-Rows) | 예측 결과 행 수 (cardinality) |
| Bytes | 예측 데이터 크기 |
| Cost (%CPU) | 예측 비용과 CPU 비중 |
| Time | 예측 소요 시간 |

`ALLSTATS LAST` 실측 출력:

| 항목 | 의미 |
|---|---|
| Starts | 해당 단계 실행 횟수 (NL 조인 inner는 outer 행 수만큼 반복) |
| A-Rows | 실제 결과 행 수 |
| A-Time | 실제 누적 소요 시간 |
| Buffers | 논리 I/O (버퍼 캐시 읽기 블록 수) |
| Reads | 물리 I/O (디스크 읽기 블록 수) |

부가 섹션:

- **Predicate Information**: `access()`는 스캔 범위를 좁히는 조건, `filter()`는 읽은 후 걸러내는 조건 ([[index-scan]] 7.2 참고)
- **Note**: dynamic sampling 사용 여부 등
- **Hint Report** (19c+): 힌트 적용·무시 내역 ([[oracle-hints]] 참고)

### 2.3 성능 확인 포인트

- **E-Rows vs A-Rows 괴리**: 실측이 예측의 수십 배 이상 차이 나는 단계가 잘못된 계획 선택의 원인. A-Rows는 `Starts × 단계당 행`의 누적이므로 Starts를 감안해 비교한다. 괴리가 크면 통계 재수집·히스토그램을 검토한다.
- **Buffers·Reads**: 쿼리의 실제 부하 지표. Cost보다 논리 I/O(Buffers) 감소를 기준으로 튜닝 효과를 판단한다.
- **A-Time이 큰 단계**: 병목 지점. 상위 노드의 A-Time은 하위 노드를 포함한 누적치다.
- **filter로 대량 탈락하는 단계**: 많이 읽고 대부분 버리는 패턴은 인덱스 구성 재검토 대상.

## 3. PostgreSQL

### 3.1 확인 방법

```sql
EXPLAIN <SQL>;                              -- 예상 실행 계획
EXPLAIN (ANALYZE, BUFFERS) <SQL>;           -- 실제 실행 + 실측치 + 버퍼 I/O
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) <SQL>;  -- 구조화 출력
```

`ANALYZE`는 쿼리를 **실제 실행**하므로 DML은 `BEGIN; ... ROLLBACK;`으로 감싼다.

### 3.2 출력 항목

```
Index Scan using idx_x on t  (cost=0.29..8.31 rows=1 width=44)
                             (actual time=0.021..0.022 rows=1 loops=1)
  Buffers: shared hit=3 read=1
```

| 항목 | 의미 |
|---|---|
| cost=시작..총 | 첫 행 반환까지 비용..전체 완료 비용 (임의 단위, seq page fetch=1 기준) |
| rows | 예측 결과 행 수 |
| width | 행당 평균 바이트 |
| actual time=시작..총 | 실측 시간 (ms). **loops당 평균** |
| rows (actual) | 실측 행 수. **loops당 평균** |
| loops | 해당 노드 실행 횟수 |
| Buffers: shared hit/read | 버퍼 캐시 적중 / 디스크 읽기 (블록 수) |

노드별 상세로 `Sort Method`(quicksort/external merge), `Hash Batches`, `Rows Removed by Filter` 등이 출력된다.

### 3.3 성능 확인 포인트

- **rows(예측) vs rows(실측)**: 실측은 loops당 평균이므로 **`actual rows × loops`로 환산해 비교**한다. 괴리가 크면 `ANALYZE` 재실행, `default_statistics_target` 상향, 확장 통계를 검토한다.
- **loops가 큰 Nested Loop**: inner 노드가 수만 회 반복되면 총비용이 급증한다.
- **Buffers**: `read`가 크면 물리 I/O 병목, `hit` 포함 총량이 크면 비효율적 접근 경로.
- **디스크 스필**: `Sort Method: external merge Disk: ...`, `Batches > 1`(해시)는 `work_mem` 부족 신호.
- **startup cost**: `LIMIT` 쿼리는 총비용보다 시작 비용이 중요하다.

## 4. MySQL

### 4.1 확인 방법

```sql
EXPLAIN <SQL>;                  -- 예상 (표 형식)
EXPLAIN FORMAT=TREE <SQL>;      -- 예상 (트리 형식, 8.0.16+)
EXPLAIN ANALYZE <SQL>;          -- 실제 실행 + 실측치 (8.0.18+, TREE 형식)
```

`EXPLAIN ANALYZE`는 쿼리를 실제 실행한다 (SELECT 권장, 8.0.31+에서 DML도 지원되나 실제 변경 발생).

### 4.2 출력 항목

표 형식 주요 컬럼:

| 항목 | 의미 |
|---|---|
| id / select_type | 쿼리 블록 번호와 유형 (SIMPLE, SUBQUERY, DERIVED 등) |
| type | 접근 방식. `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` ([[index-scan]] 4 참고) |
| possible_keys / key / key_len | 후보 인덱스 / 선택된 인덱스 / 사용된 키 길이 (복합 인덱스 활용 폭) |
| rows | 예측 검사 행 수 |
| filtered | 조건 통과 예상 비율(%). `rows × filtered`가 다음 단계 전달 행 수 |
| Extra | `Using index`(커버링), `Using filesort`, `Using temporary`, `Using index condition` 등 |

`EXPLAIN ANALYZE` 출력:

```
-> Index lookup on t using idx_x (x=10)
   (cost=1.1 rows=3) (actual time=0.02..0.04 rows=3 loops=1)
```

`actual time=첫 행..마지막 행`(ms, loops당 평균), `rows`(loops당 평균), `loops`.

### 4.3 성능 확인 포인트

- **type 등급**: `ALL`(전체 테이블 스캔)과 `index`(인덱스 전체 스캔)가 반복 실행 위치에 있으면 최우선 개선 대상.
- **rows × filtered vs 실측 rows**: 괴리가 크면 `ANALYZE TABLE`, 히스토그램을 검토한다.
- **key_len**: 복합 인덱스에서 예상보다 짧으면 후행 컬럼이 액세스 조건으로 쓰이지 못하는 것.
- **Extra**: `Using filesort`·`Using temporary`는 정렬·임시 테이블 비용, `Using index`는 커버링으로 양호.
- **EXPLAIN ANALYZE의 actual time**: 병목 노드 식별. loops당 평균이므로 총량은 `× loops`로 환산한다.

---
## Sources
- [Oracle SQL Tuning Guide — Generating and Displaying Execution Plans (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/generating-and-displaying-execution-plans.html)
- [Oracle SQL Tuning Guide — Query Execution Plans (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/query-execution-plans.html)
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [MySQL: EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [MySQL: Obtaining Information with EXPLAIN ANALYZE](https://dev.mysql.com/doc/refman/8.4/en/explain.html)

---
## Related pages
- [[optimizer-statistics]]
- [[index-scan]]
- [[oracle-hints]]
