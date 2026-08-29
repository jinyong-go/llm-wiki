---
title: RDBMS 공통 SQL 함수
updated: 2026-07-16 11:16:05
tags:
  - dbms
  - sql
  - oracle
  - postgresql
  - mysql
  - function
---

## 1. 개요

실무에서 사용 빈도가 높은 SQL 함수를 DBMS별(Oracle, PostgreSQL, MySQL)로 정리한다. 순위 함수는 윈도우 함수, 나머지는 스칼라 함수에 속한다 (조건 분기의 CASE는 함수가 아닌 표현식이지만 함께 다룬다).

## 2. 타입 변환

| 함수 | 지원 | 용도 |
|---|---|---|
| `CAST(v AS type)` | 전체 (표준) | 범용 타입 변환 |
| `TO_CHAR(v, fmt)` | Oracle, PostgreSQL | 날짜·숫자 → 문자열 |
| `TO_NUMBER(s, fmt)` | Oracle, PostgreSQL | 문자열 → 숫자 |
| `TO_DATE(s, fmt)`, `TO_TIMESTAMP(s, fmt)` | Oracle, PostgreSQL | 문자열 → 날짜·타임스탬프 |
| `v::type` | PostgreSQL | `CAST`의 축약 문법 |
| `DATE_FORMAT(dt, fmt)` | MySQL | 날짜 → 문자열 |
| `STR_TO_DATE(s, fmt)` | MySQL | 문자열 → 날짜 |
| `CONVERT(v, type)` | MySQL | `CAST`와 동등 |

- Oracle·PostgreSQL은 `YYYY-MM-DD HH24:MI:SS` 형식 모델을 공유한다 (PostgreSQL의 `to_*` 계열은 Oracle 호환 목적으로 제공).
- MySQL은 `%Y-%m-%d %H:%i:%s` 지정자를 사용하며 `TO_CHAR`/`TO_DATE`가 없다.

```sql
-- Oracle/PostgreSQL
SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM dual;  -- Oracle
SELECT to_date('2026-07-16', 'YYYY-MM-DD');                  -- PostgreSQL

-- MySQL
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');
SELECT STR_TO_DATE('2026-07-16', '%Y-%m-%d');
```

- 문자열 → 날짜/숫자의 암시적 변환은 세션 설정(Oracle `NLS_DATE_FORMAT` 등)에 의존하므로 명시적 변환이 권장된다.
- 조건절 컬럼에 변환 함수를 적용하면 인덱스를 못 타는 문제는 [[index-scan]] 참고.

### 2.1 대상 타입

`CAST(v AS type)`의 `type`에는 각 DBMS의 데이터 타입명을 사용한다.

| DBMS | 주요 대상 타입 |
|---|---|
| Oracle | `VARCHAR2(n)`, `NUMBER(p,s)`, `DATE`, `TIMESTAMP`, `BINARY_DOUBLE` |
| PostgreSQL | `varchar(n)`, `text`, `numeric(p,s)`, `integer`, `date`, `timestamp`, `boolean` |
| MySQL | `CHAR(n)`, `DECIMAL(p,s)`, `SIGNED`/`UNSIGNED`, `DATE`, `DATETIME`, `TIME`, `JSON`, `BINARY` |

- MySQL의 `CAST` 대상 타입명은 컬럼 정의 타입명과 다르다: 정수는 `INT`가 아닌 `SIGNED`/`UNSIGNED`, 문자열은 `VARCHAR`가 아닌 `CHAR`를 사용한다.

```sql
SELECT CAST('123' AS NUMBER)  FROM dual;  -- Oracle
SELECT CAST('123' AS integer);            -- PostgreSQL
SELECT CAST('123' AS SIGNED);             -- MySQL
```

## 3. 현재 날짜·시간

| 함수 | 지원 | 기준 시각 |
|---|---|---|
| `SYSDATE`, `SYSTIMESTAMP` | Oracle | DB 서버 OS 시각. 호출 시점마다 갱신 |
| `CURRENT_DATE`, `CURRENT_TIMESTAMP` | Oracle | 세션 타임존 기준 |
| `now()`, `CURRENT_TIMESTAMP`, `transaction_timestamp()` | PostgreSQL | 트랜잭션 시작 시각. 트랜잭션 내 불변 |
| `statement_timestamp()` | PostgreSQL | 문장 시작 시각 |
| `clock_timestamp()` | PostgreSQL | 실제 현재 시각. 한 문장 안에서도 변함 |
| `NOW()`, `CURRENT_TIMESTAMP`, `CURDATE()` | MySQL | 문장 시작 시각. 한 문장 내 불변 |
| `SYSDATE()` | MySQL | 함수 실행 시점. 문장 내에서도 값이 달라질 수 있음 |

- 표준인 `CURRENT_TIMESTAMP`도 기준 시각은 DBMS마다 다르다.
- 같은 이름이라도 의미가 다르다: Oracle `SYSDATE`는 표준적 현재 시각 용도지만, MySQL `SYSDATE()`는 비결정적이어서 statement 기반 복제에 안전하지 않고 인덱스 활용도 불가 — MySQL에서는 `NOW()` 사용이 권장된다.
- PostgreSQL `now()`는 트랜잭션 시작 시각이므로 장시간 트랜잭션 내 실측 시각이 필요하면 `clock_timestamp()`를 쓴다.

## 4. 날짜 연산

| 함수/연산 | 지원 | 동작 |
|---|---|---|
| `EXTRACT(field FROM d)` | 전체 (표준) | 연·월·일 등 성분 추출 |
| `d ± n` | Oracle | n일 가감 (DATE 산술) |
| `ADD_MONTHS(d, n)` | Oracle | n개월 가감 |
| `MONTHS_BETWEEN(d1, d2)` | Oracle | 개월 차이 (소수 포함) |
| `TRUNC(d, 'MM')` | Oracle | 지정 단위로 절삭 |
| `LAST_DAY(d)` | Oracle, MySQL | 해당 월의 말일 |
| `d ± INTERVAL '1 day'` | PostgreSQL | interval 가감 |
| `date_trunc('month', d)` | PostgreSQL | 지정 단위로 절삭 |
| `age(d1, d2)` | PostgreSQL | 년·월·일 단위 차이 |
| `DATE_ADD(d, INTERVAL n DAY)`, `DATE_SUB` | MySQL | 가감 |
| `DATEDIFF(d1, d2)` | MySQL | 일수 차이 (d1 − d2) |
| `TIMESTAMPDIFF(unit, d1, d2)` | MySQL | 지정 단위 차이 (d2 − d1) |

```sql
SELECT TRUNC(SYSDATE, 'MM') FROM dual;        -- Oracle: 이번 달 1일
SELECT date_trunc('month', now());            -- PostgreSQL
SELECT DATE_ADD(CURDATE(), INTERVAL 1 MONTH); -- MySQL
```

- 날짜 차이 함수는 인자 순서에 따른 부호가 DBMS마다 다르다: MySQL `DATEDIFF`는 d1 − d2, `TIMESTAMPDIFF`는 d2 − d1.

## 5. 문자열

| 함수 | 지원 | 용도 |
|---|---|---|
| `SUBSTRING(s FROM pos FOR len)` | 전체 (표준) | 부분 문자열. `SUBSTR(s, pos, len)` 축약형도 전체 지원 |
| `POSITION(sub IN s)` | PostgreSQL, MySQL (표준) | 부분 문자열 위치 (없으면 0) |
| `INSTR(s, sub)` | Oracle, MySQL | 부분 문자열 위치 (없으면 0) |
| `REPLACE(s, from, to)` | 전체 | 치환 |
| `TRIM`, `LTRIM`, `RTRIM` | 전체 | 양쪽/왼쪽/오른쪽 문자 제거 |
| `LPAD(s, n, pad)`, `RPAD` | 전체 | 지정 길이까지 채움 |
| `UPPER`, `LOWER` | 전체 | 대소문자 변환 |
| `\|\|` | Oracle, PostgreSQL (표준) | 문자열 결합 연산자. MySQL 기본은 OR 의미 (`PIPES_AS_CONCAT` 모드 필요) |
| `CONCAT(a, b, ...)` | 전체 | 결합. Oracle만 인자 2개 고정 |

길이 함수는 기준(문자 수 vs 바이트 수)이 DBMS마다 다르다:

| DBMS | 문자 수 | 바이트 수 |
|---|---|---|
| Oracle | `LENGTH` | `LENGTHB` |
| PostgreSQL | `length`, `char_length` | `octet_length` |
| MySQL | `CHAR_LENGTH` | `LENGTH` |

- MySQL `LENGTH`는 바이트 기준이므로 멀티바이트 문자(UTF-8 한글 = 3바이트)에서 문자 수와 다르다.
- NULL 결합 동작 차이: PostgreSQL `||`과 MySQL `CONCAT`은 인자에 NULL이 있으면 결과가 NULL, Oracle `||`은 NULL을 빈 문자열로 취급한다.

## 6. NULL 처리

| 함수 | 표준 | 지원 | 동작 |
|---|---|---|---|
| `COALESCE(a, b, ...)` | O | 전체 | 첫 non-NULL 인자 반환. 앞 인자가 확정되면 뒤 인자는 평가하지 않음 |
| `NULLIF(a, b)` | O | 전체 | a = b이면 NULL, 아니면 a 반환 |
| `NVL(a, b)` | X | Oracle | a가 NULL이면 b 반환 (인자 2개 고정) |
| `NVL2(a, b, c)` | X | Oracle | a가 NULL이 아니면 b, NULL이면 c 반환 |
| `IFNULL(a, b)` | X | MySQL | a가 NULL이면 b 반환 |

```sql
SELECT COALESCE(nickname, username, 'anonymous');  -- 다단계 기본값
SELECT amount / NULLIF(qty, 0);                    -- 0 나눗셈 방지
```

- 이식성과 다중 인자 지원을 고려하면 표준인 `COALESCE`/`NULLIF` 사용이 권장된다.

## 7. 조건 분기

| 함수/표현식 | 표준 | 지원 | 동작 |
|---|---|---|---|
| `CASE WHEN cond THEN r ... ELSE d END` | O | 전체 | 검색 CASE. 조건을 순차 평가, 첫 참 반환 |
| `CASE v WHEN a THEN r ... ELSE d END` | O | 전체 | 단순 CASE. 값 동등 비교 |
| `DECODE(v, a, r1, b, r2, ..., d)` | X | Oracle | 값 비교 분기 |
| `IF(cond, t, f)` | X | MySQL | 3항 분기 |

```sql
SELECT CASE WHEN score >= 90 THEN 'A'
            WHEN score >= 80 THEN 'B'
            ELSE 'C' END grade
FROM   exam;
```

- `DECODE`는 예외적으로 NULL끼리 같다고 판정한다 (`DECODE(v, NULL, 'is null', ...)` 가능). CASE의 `WHEN v = NULL`은 항상 거짓.
- 이식성·가독성은 표준 `CASE` 사용이 권장된다. ELSE 생략 시 미매칭은 NULL 반환.

## 8. 순위

윈도우 함수로, `OVER (PARTITION BY ... ORDER BY ...)` 절과 함께 사용한다. GROUP BY와 달리 행을 집약하지 않고 각 행에 결과를 부여한다. MySQL은 8.0+에서 지원.

| 함수 | 동작 (ORDER BY 값 1, 1, 2 예시) |
|---|---|
| `ROW_NUMBER()` | 동점 무관 고유 순번: 1, 2, 3 |
| `RANK()` | 동점 동일 순위, 다음 순위 건너뜀: 1, 1, 3 |
| `DENSE_RANK()` | 동점 동일 순위, 건너뜀 없음: 1, 1, 2 |
| `NTILE(n)` | 행을 n개 그룹으로 균등 분할해 그룹 번호 부여 |

```sql
-- 부서별 급여 상위 3명
SELECT * FROM (
  SELECT e.*,
         ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) rn
  FROM   emp e
) t
WHERE  rn <= 3;
```

세 DBMS 모두 동일 문법·동일 동작이다.

---
## Sources
- [Oracle SQL Language Reference — Functions (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Functions.html)
- [PostgreSQL: Data Type Formatting Functions](https://www.postgresql.org/docs/current/functions-formatting.html)
- [PostgreSQL: Date/Time Functions and Operators](https://www.postgresql.org/docs/current/functions-datetime.html)
- [PostgreSQL: Conditional Expressions](https://www.postgresql.org/docs/current/functions-conditional.html)
- [PostgreSQL: String Functions and Operators](https://www.postgresql.org/docs/current/functions-string.html)
- [PostgreSQL: Window Functions](https://www.postgresql.org/docs/current/functions-window.html)
- [MySQL: Date and Time Functions](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html)
- [MySQL: Flow Control Functions](https://dev.mysql.com/doc/refman/8.4/en/flow-control-functions.html)
- [MySQL: String Functions](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html)
- [MySQL: Cast Functions and Operators](https://dev.mysql.com/doc/refman/8.4/en/cast-functions.html)
- [MySQL: Window Function Descriptions](https://dev.mysql.com/doc/refman/8.4/en/window-function-descriptions.html)

---
## Related pages
- [[index-scan]]
- [[execution-plan]]
