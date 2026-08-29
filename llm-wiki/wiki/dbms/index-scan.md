---
title: RDBMS 인덱스 스캔 (Index Scan)
updated: 2026-07-15 17:45:40
tags:
  - dbms
  - sql
  - oracle
  - postgresql
  - mysql
  - sqlserver
  - index
  - tuning
---

## 1. 개요

인덱스 스캔은 옵티마이저가 테이블 전체를 읽지 않고 인덱스를 통해 필요한 행을 찾아가는 접근 경로(access path)이다. B-tree 인덱스는 탐색용 루트/브랜치 블록(branch block)과 인덱스 키·rowid를 담은 리프 블록(leaf block)으로 구성되며, 리프 블록은 키 순서로 정렬되고 양방향 연결 리스트로 이어져 있어 범위 스캔과 역방향 스캔이 가능하다.

기본 동작은 두 단계이다.

1. 루트 → 브랜치 → 리프로 수직 탐색해 시작 지점을 찾고, 리프 블록을 수평으로 스캔해 조건을 만족하는 rowid를 얻는다.
2. rowid로 테이블 블록에 접근해 행을 읽는다 (`TABLE ACCESS BY INDEX ROWID`). 필요한 컬럼이 모두 인덱스에 있으면 이 단계는 생략된다.

정렬 순서를 따라가는 인덱스 스캔은 현재 블록을 읽어야 다음 블록을 알 수 있으므로 single-block I/O를 사용한다. 전체 테이블 스캔이나 index fast full scan은 multiblock I/O를 사용한다.

## 2. 인덱스 스캔 유형 - Oracle

인덱스 배제는 `NO_INDEX(t [idx])`, 전체 테이블 스캔 강제는 `FULL(t)`. 힌트 문법과 충돌 규칙은 [[oracle-hints]] 참고.

### 2.1 Index Unique Scan

유니크 인덱스의 모든 컬럼에 등치(`=`) 조건이 있을 때 선택된다. 최대 1건의 rowid만 반환하며 첫 레코드를 찾는 즉시 탐색을 멈춘다.

- 사용 시점: PK/유니크 키 단건 조회. 가장 저렴한 접근 경로.
- 지정: `INDEX(t [idx])`

```sql
SELECT * FROM products WHERE prod_id = 19;  -- prod_id는 PK
-- INDEX UNIQUE SCAN | PRODUCTS_PK
```

### 2.2 Index Range Scan

인덱스 선두 컬럼(leading column)에 `=`, `<`, `>`, `BETWEEN`, `LIKE '접두어%'` 등의 조건이 있을 때 선택된다. 시작 리프 블록부터 조건 범위가 끝날 때까지 연결 리스트를 따라 스캔하며, 결과는 인덱스 키 오름차순으로 반환된다. `ORDER BY ... DESC`는 리프를 역방향으로 읽는 `INDEX RANGE SCAN DESCENDING`으로 처리할 수 있다.

- 사용 시점: 선택도가 높은(반환 행이 적은) 범위·등치 조건. 가장 일반적인 유형.
- 한계: 선두 와일드카드(`LIKE '%ASD'`)에는 사용 불가. 반환 행이 많으면 rowid별 테이블 접근 비용이 누적되어 전체 테이블 스캔보다 불리해진다 (6 참고).
- 지정: `INDEX(t [idx])`, 방향은 `INDEX_ASC` / `INDEX_DESC`

```sql
SELECT * FROM employees WHERE department_id = 20 AND salary > 1000;
-- TABLE ACCESS BY INDEX ROWID BATCHED | EMPLOYEES
--   INDEX RANGE SCAN | EMP_DEPARTMENT_IX
```

### 2.3 Index Full Scan

인덱스 전체 리프를 키 정렬 순서대로 스캔한다. 최좌측 리프 블록까지 내려간 뒤 연결 리스트를 따라 끝까지 읽으며, single-block I/O를 사용한다.

- 사용 시점: 인덱스 컬럼 `ORDER BY`의 정렬 연산 생략. 정렬된 결과가 필요하면서 테이블 접근을 줄이고 싶을 때.
- 한계: single-block I/O라서 인덱스 전체를 빠르게 읽는 목적이라면 fast full scan보다 느리다.
- 지정: `INDEX(t [idx])`

### 2.4 Index Fast Full Scan

쿼리에 필요한 컬럼이 모두 인덱스에 포함되고 정렬이 불필요할 때, 인덱스 세그먼트 전체를 디스크 저장 순서대로 multiblock I/O로 읽는다. 테이블에 접근하지 않는다.

- 사용 시점: `COUNT(*)` 등 인덱스만으로 처리 가능한 집계. 인덱스가 테이블보다 작으므로 전체 테이블 스캔보다 I/O가 적다.
- 한계: 결과 정렬 미보장. 정렬 필요 시 별도 sort 발생.
- 지정: `INDEX_FFS(t [idx])`, 배제는 `NO_INDEX_FFS`

```sql
SELECT COUNT(*) FROM departments;
-- INDEX FAST FULL SCAN | DEPT_ID_PK
```

### 2.5 Index Skip Scan

복합 인덱스의 선두 컬럼이 조건에 없을 때, 선두 컬럼의 고유값별로 인덱스를 논리적 서브인덱스로 분할해 각각 탐색한다. 개념적으로 선두 컬럼 값별 조건의 `UNION ALL`과 같다.

- 사용 시점: 선두 컬럼 카디널리티가 낮고(예: 성별) 후행 컬럼 카디널리티가 높을 때, 인덱스 신규 생성 없이 기존 복합 인덱스 활용.
- 한계: 선두 컬럼 고유값 수만큼 탐색이 반복되므로 선두 컬럼 카디널리티가 높으면 급격히 비효율.
- 지정: `INDEX_SS(t [idx])`, 배제는 `NO_INDEX_SS`

```sql
-- 인덱스: (cust_gender, cust_email)
SELECT * FROM customers WHERE cust_email = 'Abbey@company.example.com';
-- INDEX SKIP SCAN | CUST_GENDER_EMAIL_IX
```

### 2.6 Index Join Scan

여러 인덱스를 각각 스캔한 뒤 rowid 기준 해시 조인으로 결합해, 테이블 접근 없이 결과를 만든다.

- 사용 시점: 쿼리의 모든 컬럼이 여러 인덱스에 나뉘어 커버되고, 인덱스 조인 비용 < 테이블 접근 비용일 때.
- 지정: `INDEX_JOIN(t [idx...])`

### 2.7 유형 비교

| 유형 | 정렬 보장 | I/O | 테이블 접근 | 주 용도 |
|---|---|---|---|---|
| Unique Scan | — (1건) | single-block | O | PK/유니크 등치 조회 |
| Range Scan | O (ASC/DESC) | single-block | O | 선택도 높은 범위·등치 조건 |
| Full Scan | O | single-block | O | 정렬 생략 |
| Fast Full Scan | X | multiblock | X | 커버링 집계 |
| Skip Scan | X | single-block | O | 선두 컬럼 없는 복합 인덱스 |
| Join Scan | X | single-block | X | 다중 인덱스 커버링 |

## 3. 인덱스 스캔 유형 - PostgreSQL

쿼리 힌트를 기본 지원하지 않는다. 스캔 방식 지정은 플래너 파라미터(`enable_*`, 완전 비활성화가 아닌 비용 페널티 부여)를 세션 수준에서 조정하거나 `pg_hint_plan` 확장의 힌트 주석을 사용한다.

### 3.1 Index Scan

인덱스에서 얻은 위치로 행 단위로 힙(테이블)에 접근한다.

- 사용 시점: 반환 행 비율이 매우 낮을 때, 또는 인덱스 정렬 순서를 활용할 때.
- 한계: 행마다 랜덤 I/O가 발생하므로 반환 행이 많으면 비효율.
- 지정: `enable_indexscan` 파라미터, pg_hint_plan `IndexScan(t [idx])`

### 3.2 Index Only Scan

필요한 컬럼이 모두 인덱스에 있고 visibility map으로 가시성이 확인되면 힙 접근을 생략한다.

- 사용 시점: 커버링 조회. 세 방식 중 가장 빠름.
- 한계: 쓰기가 잦은 테이블은 visibility map 미갱신으로 힙 확인이 늘어 효과 감소.
- 지정: `enable_indexonlyscan` 파라미터, pg_hint_plan `IndexOnlyScan(t [idx])`

### 3.3 Bitmap Index Scan + Bitmap Heap Scan

인덱스를 스캔해 후보 페이지 비트맵을 만든 뒤 힙 페이지를 물리 순서로 읽는다.

- 사용 시점: 반환 행이 Index Scan보다 많고 Seq Scan보다 적은 중간 영역. 여러 인덱스 조건의 AND/OR 결합.
- 한계: 페이지 물리 순서로 읽으므로 인덱스 정렬 순서가 사라져 별도 정렬 필요.
- 지정: `enable_bitmapscan` 파라미터, pg_hint_plan `BitmapScan(t [idx])`

## 4. 인덱스 스캔 유형 - MySQL

`EXPLAIN`의 `type` 컬럼이 인덱스 접근 방식을 나타낸다. 인덱스 선택은 유형 공통으로 인덱스 힌트(`USE INDEX`, `FORCE INDEX`, `IGNORE INDEX`) 또는 옵티마이저 힌트(`/*+ INDEX(t idx) */`, `NO_INDEX`, 8.0.20+)로 지정한다.

### 4.1 const, eq_ref

PK·유니크 인덱스의 모든 컬럼 등치 조회. `const`는 상수 비교로 최대 1행, `eq_ref`는 조인에서 선행 테이블 행마다 1행을 읽는다. Oracle unique scan에 대응.

### 4.2 ref

비유니크 인덱스 또는 선두 컬럼(leftmost prefix) 등치 조회. 매칭 행이 적을 때 적합.

### 4.3 range

인덱스 범위 스캔 (`BETWEEN`, `IN`, 부등호 등).

- 지정: `FORCE INDEX (idx)` 또는 `/*+ INDEX(t idx) */`. 범위 최적화 배제는 `/*+ NO_RANGE_OPTIMIZATION(t idx) */`

### 4.4 index

인덱스 전체 스캔. `Extra: Using index`면 커버링 인덱스로 테이블 접근을 생략하며, 아니면 인덱스 순서의 전체 테이블 스캔이라 `ALL`(전체 테이블 스캔)과 비용이 비슷하다.

InnoDB 세컨더리 인덱스는 리프에 PK 값을 포함하므로, PK 컬럼은 명시하지 않아도 커버링에 포함된다. 세컨더리 인덱스 → 테이블 행 접근은 PK(클러스터드 인덱스) 재탐색으로 이뤄진다.[^1]

## 5. 인덱스 스캔 유형 - 기타

SQL Server 실행 계획 연산자 기준:

- **Index Seek / Clustered Index Seek**: B-tree를 수직 탐색해 조건(SeekPredicates)을 만족하는 행만 처리. Oracle unique/range scan에 대응.
  - 지정: `WITH (INDEX(idx))`, seek 강제는 `WITH (FORCESEEK)`
- **Index Scan / Clustered Index Scan**: 인덱스 리프 전체를 읽음. 클러스터드 인덱스 스캔은 사실상 전체 테이블 스캔.
  - 지정: scan 강제는 `WITH (FORCESCAN)`
- **Key Lookup / RID Lookup**: 논클러스터드 인덱스에 없는 컬럼을 클러스터드 인덱스 키(힙이면 RID)로 재조회. Oracle의 `TABLE ACCESS BY INDEX ROWID`에 대응하며, 실행 횟수가 많으면 커버링 인덱스 추가를 검토한다.

## 6. 인덱스 스캔 vs 전체 테이블 스캔

인덱스 스캔이 항상 유리한 것은 아니다. 옵티마이저는 두 경로의 예상 비용을 비교해 선택한다.

### 6.1 대용량 조회 시 인덱스 스캔이 불리한 이유

- rowid 기반 테이블 접근은 행마다 랜덤 single-block I/O를 발생시킨다. 반환 행이 많으면 같은 테이블 블록을 반복해서 읽을 수도 있다.
- 전체 테이블 스캔은 multiblock I/O로 연속 블록을 한 번에 읽으므로 블록당 비용이 훨씬 낮다.
- 따라서 반환 행 비율이 일정 수준을 넘으면 총 I/O는 전체 테이블 스캔이 더 적다. 임계 비율은 클러스터링 팩터, 블록당 행 수, multiblock read 크기에 따라 달라지므로 고정된 값(예: 5%)은 없다.[^2]

### 6.2 선택 기준

- **선택도(selectivity)**: 조건을 만족하는 행의 비율. 낮을수록(적게 반환할수록) 인덱스 스캔 유리.
- **클러스터링 팩터(clustering factor)**: 인덱스 키 순서와 테이블 행 저장 순서의 일치 정도. 인덱스 순서로 스캔할 때 테이블 블록 전환 횟수로 측정하며, 테이블 블록 수에 가까울수록(낮을수록) rowid 접근 비용이 낮고, 행 수에 가까울수록(높을수록) 같은 선택도라도 전체 테이블 스캔이 선택되기 쉽다.
- **커버링 여부**: 필요한 컬럼이 모두 인덱스에 있으면 테이블 접근이 없어 대량 조회도 인덱스(fast full scan, index only scan)가 유리할 수 있다.
- **정렬 활용**: 인덱스 순서로 읽으면 sort 연산을 생략할 수 있어, I/O가 다소 많아도 인덱스 스캔이 선택될 수 있다.

통계 정보가 낡으면 잘못된 경로가 선택된다. [[optimizer-statistics]] 참고.

## 7. 주의사항

### 7.1 복합 인덱스 컬럼 순서

"카디널리티가 높은(선택도가 좋은) 컬럼을 복합 인덱스 선두에 둬야 성능이 좋다"는 통념은 부정확하다. `WHERE A = ? AND B = ?`처럼 인덱스의 모든 컬럼이 등치 조건으로 참조되면 `(A, B)`든 `(B, A)`든 성능 차이가 사실상 없다. 두 순서 모두 결합 선택도가 같아 도달하는 리프 엔트리 집합이 동일하고, 브랜치 블록에는 첫 대상 리프 블록을 가리키기에 충분한 컬럼 정보가 있어 저카디널리티 컬럼이 선두여도 수직 탐색 횟수가 같으며, B-tree 깊이(blevel)도 컬럼 순서로 달라지지 않는다.

컬럼 순서는 카디널리티가 아니라 쿼리의 조건 형태로 정한다.

- 선두 컬럼 요건: `(A, B)` 인덱스는 `WHERE B = ?` 단독 쿼리에서 range scan을 못 탄다 (skip scan 또는 full scan으로 대체). 어떤 쿼리가 인덱스를 재사용할지가 순서로 결정된다.
- 등치 조건을 범위 조건보다 앞에: 범위 조건이 다른 조건보다 선행하면 그 이후 컬럼의 조건이 필터 조건으로 강등된다 (7.2 참고).
- 저카디널리티 선두의 이점: 선두 컬럼 고유값이 적으면 skip scan 활용 여지가 생기고 (2.5 참고), 반복 값이 앞에 몰려 prefix compression 효율도 높아진다.

이 통념은 단일 컬럼 인덱스 선택 기준(고카디널리티 컬럼일수록 인덱스 효과가 큼)을 복합 인덱스의 컬럼 배치 기준으로 잘못 확장한 것이다.[^3]

### 7.2 범위 조건과 액세스·필터 조건

인덱스 스캔에서 조건은 두 방식으로 동작한다.

- **액세스 조건(access predicate)**: 리프 스캔의 시작·종료 지점을 결정해 스캔 범위 자체를 좁힌다.
- **필터 조건(filter predicate)**: 리프 순회 중 엔트리별로 평가만 하며 스캔 범위를 좁히지 못한다.

범위 조건(`<`, `>`, `BETWEEN`, `LIKE '접두어%'`)이 선행 컬럼에 적용되면 **그 이후 인덱스 컬럼의 조건은 액세스 조건이 아닌 필터 조건으로 동작**한다. 범위 안에서는 후행 컬럼 값이 정렬되어 있지 않아 시작·종료 지점 계산에 쓸 수 없기 때문이다. 조건에 맞지 않는 리프 엔트리까지 모두 읽고 버리게 되어 인덱스 스캔 성능이 감소한다.

```sql
-- 인덱스: (order_date, status)
SELECT * FROM orders
WHERE order_date > DATE '2026-01-01' AND status = 'PAID';
-- access: order_date > :d          → 범위 전체 리프 스캔
-- filter: status = 'PAID'          → 엔트리별 평가 (범위 축소 없음)
-- 인덱스가 (status, order_date)면 두 조건 모두 access
```

LIKE는 첫 와일드카드 앞의 문자열만 액세스 조건으로 쓰인다. `LIKE 'ABC%'`는 `'ABC'` 접두어 범위의 range scan이 되지만 그 시점부터 범위 조건이므로 후행 컬럼은 필터로 강등되며, `LIKE '%ABC'`처럼 와일드카드로 시작하면 액세스 조건 자체가 될 수 없다. 실행 계획의 Predicate Information에서 `access()`/`filter()` 구분으로 확인한다 ([[execution-plan]] 참고).

### 7.3 IN-List

`IN (v1, v2, ...)`은 등치 조건의 OR과 동등하다. Oracle은 인덱스로 IN-list를 처리할 때 `INLIST ITERATOR`가 값별로 하위 range scan을 반복 실행한다. 쿼리를 UNION ALL로 재작성하는 것이 아니라 동일 플랜 서브트리의 반복 실행이다.

```sql
-- 인덱스: (status, order_date)
SELECT * FROM orders
WHERE status IN ('PAID', 'SHIPPED') AND order_date > DATE '2026-01-01';
-- INLIST ITERATOR
--   TABLE ACCESS BY INDEX ROWID BATCHED | ORDERS
--     INDEX RANGE SCAN | ORDERS_STATUS_DATE_IX
```

- 값별 실행이 각각 등치 조건이므로, 범위 조건과 달리 **후행 컬럼 조건이 액세스 조건으로 유지**된다. 위 예시는 (status, order_date) 각 조합의 좁은 범위만 스캔한다.
- 값마다 루트→브랜치→리프 수직 탐색이 반복되므로, **IN 값 수가 많으면 반복 비용이 누적되어 오히려 성능이 감소**할 수 있다. 이 경우 옵티마이저는 단일 범위 스캔이나 전체 테이블 스캔을 선택할 수 있다.
- 별개의 변환으로, top-level OR/IN을 UNION ALL 분기로 재작성하는 **OR expansion**이 있다. 분기별로 서로 다른 인덱스·접근 경로가 유리할 때 등 변환 후 비용이 더 낮다고 판단되는 경우에만 비용 기반으로 적용된다.

---
## Sources
- [Oracle SQL Tuning Guide — Optimizer Access Paths (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-access-paths.html)
- [Oracle SQL Tuning Guide — Optimizer Statistics Concepts (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-statistics-concepts.html)
- [PostgreSQL: Combining Multiple Indexes](https://www.postgresql.org/docs/current/indexes-bitmap-scans.html)
- [Percona — One Index, Three Different PostgreSQL Scan Types](https://www.percona.com/blog/one-index-three-different-postgresql-scan-types-bitmap-index-and-index-only/)
- [MySQL: EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [SQL Server: Showplan Logical and Physical Operators Reference](https://learn.microsoft.com/en-us/sql/relational-databases/showplan-logical-and-physical-operators-reference)
- [Richard Foote — It's Less Efficient To Have Low Cardinality Leading Columns In An Index (Right)?](https://richardfoote.wordpress.com/2008/02/13/its-less-efficient-to-have-low-cardinality-leading-columns-in-an-index-right/)
- [Richard Foote — Index Column Order: Impact On Index Branch Blocks Part I](https://richardfoote.wordpress.com/2018/06/04/index-column-order-impact-on-index-branch-blocks-part-i-day-in-day-out/)
- [Use The Index, Luke — Greater, Less and BETWEEN (Access/Filter Predicates)](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/greater-less-between-tuning-sql-access-filter-predicates)
- [Use The Index, Luke — Tuning SQL LIKE using indexes](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning)
- [Oracle SQL Tuning Guide — Reading Execution Plans (INLIST ITERATOR)](https://docs.oracle.com/database/121/TGSQL/tgsql_interp.htm)
- [Oracle SQL Tuning Guide — Query Transformations: OR Expansion (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/query-transformations.html)
- [MySQL: Index Hints](https://dev.mysql.com/doc/refman/8.4/en/index-hints.html)
- [MySQL: Optimizer Hints](https://dev.mysql.com/doc/refman/8.4/en/optimizer-hints.html)
- [SQL Server: Table Hints (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/queries/hints-transact-sql-table)
- [PostgreSQL: Planner Method Configuration](https://www.postgresql.org/docs/current/runtime-config-query.html)
- [pg_hint_plan](https://github.com/ossc-db/pg_hint_plan)

---
## Related pages
- [[execution-plan]]
- [[optimizer-statistics]]
- [[oracle-hints]]
- [[concurrency-control]]

[^1]: InnoDB 세컨더리 인덱스의 PK 포함과 클러스터드 인덱스 재탐색은 MySQL EXPLAIN 문서의 커버링 인덱스 설명(InnoDB는 세컨더리 인덱스에 PK가 포함됨)에서 도출한 구조적 설명이다.
[^2]: Oracle Access Paths 문서는 전체 테이블 스캔 선택 사유로 낮은 선택도와 multiblock I/O 효율을 제시하나 구체적 임계 비율은 명시하지 않는다. "고정 임계값이 없다"는 서술은 비용 요인(클러스터링 팩터 등)이 테이블마다 다르다는 점에서 도출한 추론이다.
[^3]: 통념의 기원은 출처 문서에 명시된 것이 아니라, 단일 컬럼 인덱스 기준과 복합 인덱스 배치 기준의 혼동이라는 점에서 도출한 추론이다.
