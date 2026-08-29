---
title: DBMS별 Upsert / Merge
updated: 2026-08-12 17:40:32
tags:
  - dbms
  - sql
  - oracle
  - postgresql
  - mysql
---

## 1. 개요

Upsert는 키가 존재하면 UPDATE, 없으면 INSERT를 한 문장으로 수행하는 연산이다("update" + "insert"). SELECT로 존재 여부를 먼저 확인한 뒤 INSERT/UPDATE를 분기하는 방식(check-then-act)은 두 문장 사이에 다른 트랜잭션이 같은 키를 먼저 삽입할 수 있어 경쟁 조건(race condition)이나 유니크 제약 위반 예외로 이어진다. 배치 적재·동기화 작업에서 "있으면 갱신, 없으면 추가"가 반복적으로 필요한 경우, 매 행마다 SELECT를 날리는 대신 DBMS별 원자적 upsert 문법을 쓰면 문장 수와 왕복(round-trip)이 줄고 동시성 문제도 DB 엔진이 처리한다.

세 DBMS 모두 공통적으로 다음 원칙을 갖는다.

- **결정적(deterministic) 동작만 허용한다.** 한 문장 안에서 타깃의 같은 행을 두 번 이상 갱신하는 상황(소스에 중복 키가 있는 경우 등)은 오류로 처리된다(다만 뒤에서 보듯 MySQL은 예외적으로 오류 없이 침묵하는 경우가 있다). 이 결정성을 보장하는 방식은 DBMS마다 다르다: PostgreSQL·MySQL은 매칭 대상에 유니크 인덱스/제약을 요구해 애초에 충돌 판단 기준을 명확히 하는 반면, Oracle MERGE는 유니크 제약을 요구하지 않고 대신 실행 시점에 매칭이 1:1인지 검사해 위반 시 오류(`ORA-30926`)로 막는다.

## 2. 장단점

**장점**

- **원자성** — INSERT와 UPDATE를 하나의 문장·트랜잭션으로 묶어, 두 결과 중 하나만 일어나고 그 사이에 다른 트랜잭션이 끼어들 여지가 없다.
- **경쟁 조건 방지** — "확인 후 행동(check-then-act)" 패턴에서 발생하는 TOCTOU(time-of-check to time-of-use) 문제 자체가 없다.
- **왕복 감소** — 애플리케이션 → DB 호출이 SELECT + INSERT/UPDATE 2회에서 1회로 줄어, 특히 대량 배치 적재 시 네트워크 지연·트랜잭션 오버헤드가 감소한다.
- **애플리케이션 로직 단순화** — 존재 여부 분기 코드를 애플리케이션이 아닌 DB에 위임할 수 있다.

**단점**

- **락 범위 확대** — PostgreSQL `ON CONFLICT DO UPDATE`는 충돌 여부와 무관하게 대상 행에 `SELECT ... FOR UPDATE`에 준하는 행 잠금을 건다. 같은 키를 여러 트랜잭션이 동시에 upsert하면 잠금 경합이 커지고, 유니크 인덱스가 여러 개인 테이블에서는 중복 키 오류나 데드락으로 이어질 수 있다.
- **AUTO_INCREMENT 소모(MySQL)** — `ON DUPLICATE KEY UPDATE`는 "mixed-mode insert"로 분류되어, 실제로는 UPDATE만 일어나도 InnoDB가 할당한 auto-increment 값이 갱신 단계에서 쓰이지 않고 버려질 수 있다. 결과적으로 PK 값에 구멍(gap)이 생긴다.
- **행별 분기 판별이 번거로움** — INSERT됐는지 UPDATE됐는지 애플리케이션에서 구분하려면 별도 처리가 필요하다(MySQL의 affected-rows 1/2/0 구분, PostgreSQL의 `xmax` 확인 등 우회적 방법에 의존).
- **트리거 동작 불명확** — INSERT/UPDATE 각각에 트리거가 걸려 있을 때 upsert 문장이 어느 쪽을 발동시키는지 DBMS·상황별로 다르므로, 트리거 기반 로직과 결합 시 예상과 다르게 동작할 수 있다.
- **이식성 부족** — 세 DBMS의 문법이 서로 달라(아래 6장 비교), ORM·공용 SQL로 추상화하기 어렵고 DBMS 전환 시 재작성이 필요하다.
- **의도치 않은 덮어쓰기 위험** — `SET` 절에 명시하지 않은 컬럼은 기존 값이 유지되지만, 실수로 전체 컬럼을 갱신 대상에 포함하면 부분 갱신을 의도한 코드에서 다른 컬럼 값을 덮어쓸 수 있다.

## 3. Oracle — MERGE

```sql
MERGE INTO target t
USING source s
ON (t.id = s.id)
WHEN MATCHED THEN
  UPDATE SET t.name = s.name, t.updated_at = SYSDATE
WHEN NOT MATCHED THEN
  INSERT (id, name, updated_at)
  VALUES (s.id, s.name, SYSDATE);
```

- `USING`에는 테이블·뷰·서브쿼리가 올 수 있다. `ON`은 매칭 조건이며, 반드시 유니크 컬럼일 필요는 없다(대신 결과가 결정적이지 않으면 런타임에 오류가 발생한다. 3.1절 참고).
- `WHEN MATCHED`/`WHEN NOT MATCHED` 중 최소 하나는 필수이며, 둘 다 명시 가능하다.
- `WHEN MATCHED` 절에는 `DELETE WHERE`를 추가해 갱신 후 조건에 맞는 행을 삭제할 수 있다(원본이 아닌 갱신된 값 기준으로 평가됨).

### 3.1. 오류 사례

- **`ON` 절 컬럼을 `UPDATE SET`으로 변경 → `ORA-38104`**
  `ON` 조건에 쓰인 컬럼을 `WHEN MATCHED ... UPDATE SET`에서 갱신하려 하면 `ORA-38104: Columns referenced in the ON Clause cannot be updated`가 발생한다. 해당 갱신이 성립되면 이미 매칭된 행이 갱신 도중 "매칭되지 않는" 상태로 바뀔 수 있어, 갱신 전후로 매칭 결과가 흔들리는 것을 막기 위한 제약이다. 이런 컬럼을 조건부로 바꿔야 한다면 `ON` 조건에서 빼고 `UPDATE ... WHERE`로 옮겨야 한다.
- **소스 중복으로 같은 타깃 행이 두 번 매칭 → `ORA-30926`**
  `USING`의 소스에 `ON` 키 기준 중복 행이 있어 같은 타깃 행에 두 번 이상 매칭되면 `ORA-30926: unable to get a stable set of rows in the source tables`가 발생한다. 소스 쿼리에 `DISTINCT`나 분석 함수로 키 중복을 제거해야 해결된다.

## 4. PostgreSQL — INSERT ... ON CONFLICT

```sql
INSERT INTO target (id, name, updated_at)
VALUES (1, 'foo', now())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;
```

- `ON CONFLICT`의 대상(conflict target)은 유니크 인덱스 또는 유니크/PK 제약이어야 하며, `DO UPDATE`를 쓰려면 대상 지정이 **필수**다(`DO NOTHING`은 생략 가능, 이 경우 모든 제약과의 충돌을 무시).
- `EXCLUDED`는 INSERT하려던 값을 담은 pseudo-table로, `DO UPDATE SET` 안에서 새 값을 참조할 때 사용한다.
- **PostgreSQL 15+는 표준 `MERGE` 문도 지원**하며 Oracle과 유사하게 `WHEN MATCHED`/`WHEN NOT MATCHED`(+`WHEN NOT MATCHED BY SOURCE`)를 사용한다.

### 4.1. 오류 사례

- **지정한 컬럼에 유니크 제약/인덱스가 없음 → `there is no unique or exclusion constraint matching the ON CONFLICT specification`**
  `ON CONFLICT (col)`에 지정한 컬럼 조합과 정확히 일치하는 유니크 인덱스가 테이블에 없으면 이 오류가 발생한다. 부분 유니크 인덱스(`WHERE` 조건 포함)를 대상으로 하려면 `ON CONFLICT (col) WHERE ...`처럼 술어까지 함께 지정해야 추론된다.
- **한 문장에서 같은 행을 두 번 갱신 → 21000 cardinality violation**
  `ON CONFLICT DO UPDATE command cannot affect row a second time` 오류(SQLSTATE 21000)는 하나의 INSERT 문에 넘긴 값들 중 두 개 이상이 같은 충돌 대상(유니크 키)을 가리킬 때 발생한다. Oracle의 `ORA-30926`과 동일한 취지의 결정성 보장이며, 입력 데이터를 미리 중복 제거해야 한다.

## 5. MySQL — INSERT ... ON DUPLICATE KEY UPDATE

```sql
INSERT INTO target (id, name, updated_at)
VALUES (1, 'foo', NOW())
AS new_row
ON DUPLICATE KEY UPDATE
  name = new_row.name, updated_at = new_row.updated_at;
```

- PK 또는 유니크 인덱스 충돌 시 UPDATE를 수행한다. Oracle/PostgreSQL과 달리 충돌 대상 컬럼을 명시적으로 지정하지 않고, 테이블에 정의된 유니크 제약이 자동 대상이 된다.
- INSERT하려던 값 참조는 `VALUES(col)` 함수로 했으나 **8.0.20부터 deprecated**되었고, 대신 `INSERT ... AS alias`로 행 별칭을 붙여 `alias.col`로 참조하는 방식(**8.0.19+**)이 권장된다.
- 유사 기능인 `REPLACE INTO`는 충돌 시 기존 행을 **DELETE 후 INSERT**하므로 AUTO_INCREMENT 값이 바뀌고 명시하지 않은 컬럼이 기본값으로 초기화된다 — 부분 갱신이 필요하면 `ON DUPLICATE KEY UPDATE`를 써야 한다.

### 5.1. 오류 없이 조용히 다르게 동작하는 경우

Oracle/PostgreSQL은 매칭 기준이 유니크하지 않거나 중복되면 **오류**로 막지만, MySQL은 같은 상황에서 오류 없이 의도와 다르게 동작하는 경우가 있어 더 주의가 필요하다.

- **대상 컬럼에 유니크 제약이 없음 → 오류 없이 매번 INSERT됨**
  테이블에 PK/유니크 키가 전혀 없으면 "중복 키" 자체가 성립하지 않으므로 `ON DUPLICATE KEY UPDATE` 절은 절대 발동하지 않는다. 오류를 내지 않고 그냥 일반 INSERT처럼 매번 새 행이 쌓여, 의도한 upsert 대신 중복 데이터가 누적되는 방식으로 실패한다.
- **유니크 키가 여러 개이고 서로 다른 행에 각각 매칭 → 그중 하나만 갱신**
  테이블에 유니크 인덱스가 둘 이상 있고 삽입하려는 행이 서로 다른 기존 행과 각각 충돌하면, 오류 없이 그중 한 행만 갱신된다(정확히 어느 행인지는 문서상 보장되지 않음). MySQL 공식 문서도 유니크 인덱스가 여러 개인 테이블에는 이 구문 사용을 권장하지 않는다.

## 6. 비교

| | Oracle | PostgreSQL | MySQL |
|---|---|---|---|
| 문법 | `MERGE INTO ... USING ... ON` | `INSERT ... ON CONFLICT` (또는 15+ `MERGE`) | `INSERT ... ON DUPLICATE KEY UPDATE` |
| 매칭 대상에 유니크 제약 필요 | 불필요(임의 조건 가능) | 필수(DO UPDATE 시) — 없으면 오류 | 사실상 필요 — 없으면 오류 없이 매번 INSERT |
| 매칭 조건 컬럼 자체 갱신 | 불가(`ORA-38104`) | 제약 없음 | 제약 없음 |
| 같은 문장 내 중복 매칭 | `ORA-30926` | cardinality violation(21000) | 오류 없이 하나만 갱신 |
| 신규 값 참조 | 소스 별칭(`s.col`) | `EXCLUDED.col` | 행 별칭(`new_row.col`, `VALUES()`는 8.0.20+ deprecated) |

---

## Sources
- [Oracle SQL Language Reference — MERGE (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/MERGE.html)
- [Oracle Support — ORA-38104](https://support.oracle.com/knowledge/Oracle%20Database%20Products/2702986_1.html)
- [PostgreSQL: INSERT](https://www.postgresql.org/docs/current/sql-insert.html)
- [MySQL 8.4 Reference Manual — INSERT ... ON DUPLICATE KEY UPDATE](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html)
- [MySQL 8.4 Reference Manual — AUTO_INCREMENT Handling in InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html)
- [CYBERTEC — PostgreSQL 15: Using MERGE in SQL](https://www.cybertec-postgresql.com/en/postgresql-15-using-merge-in-sql/)

---

## Related pages
- [[sql-functions]]
- [[concurrency-control]]
- [[deadlock-livelock]]
