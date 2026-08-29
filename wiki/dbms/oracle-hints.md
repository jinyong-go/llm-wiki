---
title: Oracle 옵티마이저 힌트
updated: 2026-07-15 17:45:40
tags:
  - dbms
  - oracle
  - sql
  - optimizer
  - hint
  - index
  - join
---

## 1. 개요

Oracle 옵티마이저 힌트는 SQL 문에 주석 형태로 삽입하여 실행 계획을 개발자가 직접 제어하는 메커니즘이다.
힌트는 **옵티마이저에 대한 지시(directive)**이며, 유효하지 않거나 충돌하는 힌트는 조용히 무시된다.

---

## 2. 힌트 문법

```sql
-- 블록 주석 형식 (권장)
SELECT /*+ INDEX(emp emp_dept_idx) */ emp_id, name FROM emp;

-- 단일 행 주석 형식 (힌트 뒤 나머지 문장은 반드시 다음 줄에 작성)
SELECT --+ FULL(emp)
    emp_id FROM emp;
```

**규칙:**
- `+`는 `/*` 바로 뒤에 붙어야 한다 — `/* +`처럼 공백이 있으면 일반 주석으로 처리됨
- 한 쿼리 블록에 힌트 블록은 1개만 허용; 여러 힌트는 공백으로 구분
- FROM 절에 alias가 있으면 반드시 alias를 사용 (테이블명 또는 스키마명 불가)
- 서브쿼리에 힌트를 적용할 때는 Query Block 이름(`QB_NAME`) 또는 인라인 힌트 사용

```sql
-- alias 사용 예시
SELECT /*+ INDEX(e emp_dept_idx) */ e.emp_id
FROM emp e;

-- 여러 힌트 조합
SELECT /*+ LEADING(d e) USE_HASH(e) INDEX(e emp_dept_idx) */
    e.emp_id, d.dept_name
FROM dept d, emp e
WHERE d.dept_id = e.dept_id;
```

---

## 3. 액세스 경로 힌트

### 3.1. 주요 힌트

| 힌트 | 설명 |
|---|---|
| `FULL(t)` | Full table scan 강제 |
| `INDEX(t [idx])` | B-tree / bitmap / domain 인덱스 사용 |
| `NO_INDEX(t [idx])` | 특정 인덱스 제외 (미지정 시 모든 인덱스 제외) |
| `INDEX_ASC(t [idx])` | 인덱스 범위 스캔 — 오름차순 |
| `INDEX_DESC(t [idx])` | 인덱스 범위 스캔 — 내림차순 |
| `INDEX_COMBINE(t [idx...])` | 비트맵 인덱스 조합 (Bitmap AND/OR) |
| `INDEX_JOIN(t [idx...])` | 여러 인덱스만으로 결과 반환 (테이블 액세스 없음) |
| `INDEX_FFS(t [idx])` | Fast full index scan (멀티블록 I/O) |
| `INDEX_SS(t [idx])` | Index skip scan |
| `NO_INDEX_FFS(t [idx])` | Fast full index scan 제외 |
| `NO_INDEX_SS(t [idx])` | Skip scan 제외 |

### 3.2. 인덱스 힌트 사용 예시

```sql
-- 단일 인덱스 지정
SELECT /*+ INDEX(emp emp_name_idx) */ emp_id FROM emp WHERE last_name = 'Kim';

-- 인덱스 미지정: 옵티마이저가 적합한 인덱스를 선택
SELECT /*+ INDEX(emp) */ emp_id FROM emp WHERE last_name = 'Kim';

-- 여러 인덱스 후보 제시: 옵티마이저가 비용이 낮은 것 선택
SELECT /*+ INDEX(emp emp_name_idx emp_dept_idx) */ emp_id FROM emp WHERE last_name = 'Kim';

-- 인덱스 제외
SELECT /*+ NO_INDEX(emp emp_name_idx) */ emp_id FROM emp WHERE last_name = 'Kim';

-- 내림차순 스캔 (ORDER BY col DESC에 유리)
SELECT /*+ INDEX_DESC(emp emp_hire_idx) */ emp_id FROM emp ORDER BY hire_date DESC;

-- Fast full scan (COUNT(*), 집계에 유리)
SELECT /*+ INDEX_FFS(emp emp_dept_idx) */ COUNT(*) FROM emp WHERE dept_id = 10;
```

---

## 4. 조인 순서 힌트

| 힌트 | 설명 |
|---|---|
| `LEADING(t1 t2 ...)` | 지정한 순서로 조인 (권장) |
| `ORDERED` | FROM 절에 나열된 순서로 조인 (레거시) |

```sql
-- dept를 driving table로, emp를 inner table로
SELECT /*+ LEADING(d e) */ d.dept_name, e.emp_id
FROM dept d, emp e
WHERE d.dept_id = e.dept_id;
```

`ORDERED`는 FROM 절 순서를 직접 제어해야 하므로 유지보수가 어렵다. `LEADING`을 사용하는 것이 권장된다.

---

## 5. 조인 방법 힌트

| 힌트 | 설명 |
|---|---|
| `USE_NL(t)` | Nested Loop Join — `t`가 inner 테이블 |
| `USE_HASH(t)` | Hash Join — `t`가 probe 테이블 |
| `USE_MERGE(t)` | Sort Merge Join |
| `NO_USE_NL(t)` | NL Join 제외 |
| `NO_USE_HASH(t)` | Hash Join 제외 |
| `NO_USE_MERGE(t)` | Merge Join 제외 |

**주의:** `USE_NL`, `USE_MERGE`, `USE_HASH`는 해당 테이블이 **inner(probe) 테이블**일 때만 적용된다.

```sql
-- Nested Loop: dept → emp (emp이 inner)
SELECT /*+ LEADING(d e) USE_NL(e) INDEX(e emp_dept_idx) */
    d.dept_name, e.emp_id
FROM dept d, emp e
WHERE d.dept_id = e.dept_id;

-- Hash Join: dept → emp
SELECT /*+ LEADING(d e) USE_HASH(e) */
    d.dept_name, e.emp_id
FROM dept d, emp e
WHERE d.dept_id = e.dept_id;

-- Sort Merge Join
SELECT /*+ USE_MERGE(e) */
    d.dept_name, e.emp_id
FROM dept d, emp e
WHERE d.dept_id = e.dept_id;
```

### 5.1. 조인 방법 선택 기준

| 방법 | 적합한 상황 |
|---|---|
| Nested Loop | 소량 결과, outer 테이블 소규모, inner 인덱스 존재 |
| Hash Join | 대용량 테이블 동등 조인, 인덱스 없음 |
| Sort Merge | 비동등 조인(`<`, `>`), 이미 정렬된 데이터 |

---

## 6. 최적화 목표 힌트

| 힌트 | 설명 |
|---|---|
| `ALL_ROWS` | 전체 행 처리량 최소화 (배치, 리포트) |
| `FIRST_ROWS(n)` | 첫 n행 반환 시간 최소화 (OLTP, 페이지네이션) |

```sql
SELECT /*+ FIRST_ROWS(10) */ emp_id FROM emp ORDER BY hire_date;
```

---

## 7. 힌트 충돌 및 무시 규칙

- 동일 인덱스에 `INDEX`와 `NO_INDEX` 동시 지정 → **둘 다 무시**
- 충돌하는 조인 방법 힌트 → **둘 다 무시**
- 유효하지 않은 테이블명/alias → 힌트 무시 (오류 없음)
- 완전한 실행 계획 제어를 위해 `LEADING` + `USE_NL/HASH` + `INDEX` 세트로 지정 권장

---

## 8. 힌트 적용 여부 확인

Oracle 19c부터 `DBMS_XPLAN` 출력에 **Hint Report** 섹션이 포함된다.

```sql
EXPLAIN PLAN FOR
SELECT /*+ INDEX(emp emp_dept_idx) */ emp_id FROM emp WHERE dept_id = 10;

-- 사용된 힌트 + 미사용 힌트 모두 표시
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'ALL'));

-- 미사용 힌트만 표시 (기본값)
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(format => 'TYPICAL'));
```

**Hint Report 애노테이션:**

| 기호 | 의미 |
|---|---|
| `E` | 문법 오류 (syntax error) |
| `N` | 미해석 — 테이블명/alias 불일치 등 |
| `U` | 인식됐으나 옵티마이저가 적용 불가 |

---

## Sources
- [Oracle SQL Language Reference — Comments (Hints) (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Comments.html)
- [SQL Tuning Guide](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/influencing-the-optimizer.html#GUID-125341C0-DBA3-4FAB-B4DB-8857CC36015C)

---

## Related pages
- [[execution-plan]]
- [[optimizer-statistics]]
- [[concurrency-control]]
