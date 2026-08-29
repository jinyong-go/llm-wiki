---
title: RDBMS 파티셔닝
updated: 2026-08-12 17:51:52
tags:
  - dbms
  - oracle
  - postgresql
  - mysql
  - partitioning
---

## 1. 개요

파티셔닝은 하나의 논리적 테이블을 여러 물리적 저장 단위(파티션)로 나눠 저장하는 기법이다. 애플리케이션·질의 입장에서는 여전히 하나의 테이블로 보이지만, 내부적으로는 파티션 키 값에 따라 각 행이 특정 파티션에 저장된다. 데이터가 커질수록 테이블 전체를 스캔하는 비용, 인덱스 크기, 백업·삭제 같은 유지보수 작업의 부담이 함께 커지는데, 파티셔닝은 이런 대용량 테이블을 다루기 쉬운 단위로 쪼개기 위한 수단이다.

핵심 개념은 **파티션 프루닝(partition pruning)**이다. 옵티마이저가 질의의 조건(주로 `WHERE`)을 파티션 키와 비교해, 조건을 만족하는 행이 있을 수 없는 파티션은 아예 스캔 대상에서 제외한다. 파티션 키가 조건에 포함되지 않으면 프루닝이 동작하지 않아 모든 파티션을 스캔하게 되므로, 파티셔닝 설계는 실제 질의 패턴(주로 어떤 컬럼으로 필터링하는지)에 맞춰야 한다.

## 2. 장단점

**장점**

- **성능** — 파티션 프루닝으로 스캔 범위가 줄고, 파티션 단위 병렬 처리(파티션와이즈 조인 등)로 대용량 조인·집계가 빨라진다.
- **관리 용이성** — 오래된 데이터를 삭제할 때 행 단위 `DELETE` 대신 파티션 자체를 `DROP`/분리하면 훨씬 빠르고 트랜잭션 로그 부담도 적다. 백업·통계 수집·재구성도 파티션 단위로 나눠 수행할 수 있다.
- **가용성** — 파티션별로 독립적인 유지보수(재구성, 이동)가 가능해, 일부 파티션 작업이 전체 테이블 접근을 막지 않는다.
- **인덱스 크기 관리** — 로컬 인덱스는 파티션 크기만큼만 커지므로, 전체 테이블에 하나의 거대한 인덱스를 두는 것보다 관리가 쉽다.

**단점**

- **유니크/PK 제약 제한** — PostgreSQL·MySQL은 유니크 제약(PK 포함)이 파티션 키 컬럼을 반드시 포함하도록 요구한다(각 파티션이 독립된 로컬 인덱스로만 유일성을 보장하기 때문). 이는 스키마 설계를 제약하고, 파티션 키와 무관한 컬럼만으로 전역 유일성을 보장하기 어렵게 만든다.
- **프루닝 실패 시 역효과** — 파티션 키가 질의 조건에 없으면 모든 파티션을 스캔해야 해, 파티셔닝하지 않은 테이블보다 오히려 느려질 수 있다(파티션 수만큼 스캔 대상이 늘어남).
- **플래닝 오버헤드** — 파티션 수가 많아지면 옵티마이저가 각 파티션을 고려하는 데 드는 비용이 커진다. PostgreSQL 공식 문서는 수천 개 단위를 실용적 상한으로 든다.
- **FK 제약 (MySQL)** — InnoDB는 파티션 테이블에 외래 키를 정의할 수도, 파티션 테이블을 참조할 수도 없다.
- **재구성 운영 부담** — 데이터 분포가 바뀌면 파티션 분할·병합·재분배가 필요한데, 이 자체가 별도의 운영 작업이다.

## 3. DBMS별 파티셔닝

### 3.1. Oracle

```sql
CREATE TABLE sales (
  sale_id   NUMBER,
  sale_date DATE,
  amount    NUMBER
)
PARTITION BY RANGE (sale_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
(
  PARTITION p_init VALUES LESS THAN (DATE '2026-01-01')
);
```

- **RANGE/LIST/HASH**와 이들을 조합한 **COMPOSITE**(range-hash, range-list 등)를 지원한다.
- RANGE 파티션에 `INTERVAL`을 지정하면 값이 늘어날 때 파티션이 자동으로 생성된다(위 예시는 매월 자동 확장).
- `EXCHANGE PARTITION`으로 별도 테이블과 파티션을 무중단으로 맞바꿔, 대량 데이터 적재·보관을 빠르게 처리할 수 있다.
- 인덱스는 **로컬**(테이블 파티션과 1:1 대응, 파티션 추가/삭제 시 자동 유지·관리 쉬움)과 **글로벌**(파티션 구조와 무관하게 별도 구성, 관리 부담은 크지만 OLTP성 조회가 빠름) 중 선택할 수 있다.

### 3.2. PostgreSQL

```sql
CREATE TABLE measurement (
  city_id int,
  logdate date,
  amount  int
) PARTITION BY RANGE (logdate);

CREATE TABLE measurement_2026_01 PARTITION OF measurement
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

- 10+에서 선언적 파티셔닝(declarative partitioning)으로 **RANGE**/**LIST**를, 11+에서 **HASH**를 지원한다.
- 파티션은 `CREATE TABLE ... PARTITION OF ... FOR VALUES`로 생성하거나, 기존 테이블을 `ALTER TABLE ... ATTACH PARTITION`으로 편입·`DETACH PARTITION`으로 분리할 수 있다. `DETACH ... CONCURRENTLY`는 `ACCESS EXCLUSIVE` 대신 `SHARE UPDATE EXCLUSIVE` 락만 사용해 운영 중 분리 부담을 줄인다.
- 유니크/PK 제약은 **파티션 키 컬럼을 반드시 포함**해야 한다. 포함하지 않으면 `unique constraint on partitioned table must include all partitioning columns` 오류가 발생한다.
- **12+부터 파티션 테이블을 참조하는 외래 키**를 지원한다(단, 참조 대상 유니크 제약과 마찬가지로 파티션 키 포함 제약을 그대로 물려받는다).
- 파티션 프루닝은 `enable_partition_pruning`(기본 on)으로 plan 단계와 실행 단계 모두에서 동작한다. 상속 기반의 구식 파티셔닝은 `constraint_exclusion`에 의존하며 plan 단계에서만, 그리고 더 제한적으로 동작한다.

### 3.3. MySQL

```sql
CREATE TABLE sales (
  sale_id   INT,
  sale_date DATE,
  amount    INT,
  PRIMARY KEY (sale_id, sale_date)
)
PARTITION BY RANGE (YEAR(sale_date)) (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027)
);
```

- **RANGE**/**LIST**/**HASH**/**KEY**를 지원한다. HASH는 사용자가 정의한 정수 반환 표현식을, KEY는 서버 내장 해시 함수를 사용한다(대상 컬럼만 지정).
- **모든 유니크 키(PK 포함)가 파티셔닝 표현식에 쓰인 모든 컬럼을 포함**해야 한다. 위반 시 `Error 1503: A PRIMARY KEY must include all columns in the table's partitioning function` 오류가 발생한다. 위 예시에서 `PARTITION BY RANGE (YEAR(sale_date))`를 쓰려면 PK에 `sale_date`가 포함되어야 하는 이유다.
- InnoDB 파티션 테이블은 **외래 키를 정의할 수도, 참조 대상이 될 수도 없다**. 참조 무결성이 필요한 테이블에는 파티셔닝을 적용하기 어렵다.

## 4. DBMS별 비교

| | Oracle | PostgreSQL | MySQL |
|---|---|---|---|
| 지원 유형 | RANGE/LIST/HASH/COMPOSITE | RANGE/LIST/HASH(11+) | RANGE/LIST/HASH/KEY |
| 파티션 자동 확장 | `INTERVAL`(RANGE) | 미지원(수동 `ATTACH`) | 미지원(수동 `ADD PARTITION`) |
| 유니크/PK 제약 | 제한 없음(글로벌 인덱스로 별도 보장 가능) | 파티션 키 포함 필수 | 파티셔닝 표현식 전체 컬럼 포함 필수 |
| 인덱스 | 로컬·글로벌 모두 지원 | 로컬만(파티션별 개별 인덱스) | 로컬만 |
| 외래 키 | 지원 | 지원(12+, 참조 대상 유니크 제약과 동일한 제한) | InnoDB 파티션 테이블 미지원 |
| 무중단 파티션 전환 | `EXCHANGE PARTITION` | `ATTACH`/`DETACH PARTITION` (`CONCURRENTLY`) | 제한적 |

## 5. 주의사항

- **질의 패턴에 맞는 파티션 키 선택** — 파티션 키가 실제 `WHERE`/조인 조건에 자주 등장하는 컬럼과 다르면 프루닝이 동작하지 않아 파티셔닝의 이점을 못 얻는다(2장 참고). 설계 전에 대표 질의를 먼저 분석해야 한다.
- **삭제·보관 주기와 파티션 단위를 맞춘다** — 한 번에 삭제·아카이브할 데이터가 정확히 하나의 파티션에 담기도록 범위를 설계하면, 대량 `DELETE` 대신 파티션 `DROP`/분리만으로 정리가 끝난다.
- **파티션 키 값 변경(행 이동)을 피한다** — 파티션 키를 갱신해 행이 다른 파티션으로 옮겨가야 하는 경우, Oracle은 기본적으로 `ORA-14402` 오류로 막고(`ENABLE ROW MOVEMENT` 필요), PostgreSQL은 내부적으로 DELETE+INSERT로 처리해(11+) 일반 UPDATE보다 비용이 크다. 파티션 키는 되도록 갱신되지 않는 컬럼(생성일자 등)으로 선택한다.
- **미래 파티션을 미리 준비한다** — Oracle의 `INTERVAL`은 새 파티션을 자동 생성하지만, PostgreSQL·MySQL은 수동으로 미리 만들어 둬야 한다. 해당 범위의 파티션이 없는 상태로 INSERT가 들어오면 오류가 나므로, 스케줄러로 다음 기간 파티션을 미리 생성하는 운영이 필요하다.
- **RANGE(날짜) 파티셔닝의 핫 파티션 문제** — 최신 데이터를 계속 적재하는 테이블은 삽입이 가장 최근 파티션에 몰려 그 파티션에만 잠금·I/O가 집중될 수 있다. 파티션 단위를 더 잘게 나누거나 필요 시 해시를 조합해 분산을 고려한다.
- **과도한 서브파티셔닝 지양** — 서브파티셔닝은 세밀한 제어를 주지만 파티션 수를 배로 늘려 2장의 플래닝 오버헤드 문제를 악화시킨다. 서로 다른 두 축으로 자주 필터링할 때만 사용한다.
- **파티션 단위 통계 수집** — 옵티마이저가 파티션별 카디널리티를 정확히 추정하도록, 전체 테이블이 아닌 파티션 단위로 통계를 갱신한다([[optimizer-statistics]] 참고).

---

## Sources
- [Oracle VLDB and Partitioning Guide (19c) — Recommendations for Choosing a Partitioning Strategy](https://docs.oracle.com/en/database/oracle/oracle-database/19/vldbg/recommendations-partition-strategy.html)
- [Oracle VLDB and Partitioning Guide — Index Partitioning](https://docs.oracle.com/en/database/oracle/oracle-database/18/vldbg/index-partitioning.html)
- [Oracle Error Help — ORA-14402](https://docs.oracle.com/en/error-help/db/ora-14402/)
- [PostgreSQL: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [MySQL 8.4 Reference Manual — Partitioning Types](https://dev.mysql.com/doc/refman/8.4/en/partitioning-types.html)
- [MySQL 8.4 Reference Manual — Partitioning Keys, Primary Keys, and Unique Keys](https://dev.mysql.com/doc/refman/8.4/en/partitioning-limitations-partitioning-keys-unique-keys.html)
- [MySQL 8.4 Reference Manual — Restrictions and Limitations on Partitioning](https://dev.mysql.com/doc/refman/8.0/en/partitioning-limitations.html)
- [EnterpriseDB — PostgreSQL 12: Foreign Keys and Partitioned Tables](https://www.enterprisedb.com/blog/postgresql-12-foreign-keys-and-partitioned-tables)

---

## Related pages
- [[execution-plan]]
- [[index-scan]]
- [[optimizer-statistics]]
