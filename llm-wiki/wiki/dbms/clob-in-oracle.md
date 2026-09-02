---
title: CLOB in Oracle
updated: 2026-09-02 09:13:53
tags:
  - dbms
  - oracle
  - lob
  - character-set
  - postgresql
  - mysql
---

## 1. 개요

CLOB(Character Large Object)은 Oracle에서 대용량 문자 데이터를 저장하는 LOB(Large Object) 데이터 타입이다. 단일바이트·멀티바이트 문자 데이터를 모두 지원하며 데이터베이스 문자셋(character set)을 사용한다. XML/HTML 문서, 텍스트 파일, 길이 제한 없는 메모 필드 등에 사용된다.

테이블 컬럼에는 CLOB 값 자체가 아니라 **LOB 로케이터(locator)**가 저장되며, 값은 조건에 따라 행 안(in-row)에 함께 저장되거나 별도 LOB 세그먼트(out-of-row)에 저장된다 (3. 저장 방식 참고).

---

## 2. 특징

- **최대 크기**: $(2^{32}-1)\text{바이트} \times \text{CHUNK 크기}$. 표준 블록 크기·기본 CHUNK 설정 기준으로는 사실상 데이터베이스 블록 크기에 비례해 수 GB~수십 TB까지 확장 가능하다 — 흔히 알려진 "최대 4GB"는 CHUNK를 1바이트로 가정한 하한값 표현이다.
- **완전한 트랜잭션 지원**: SQL, `DBMS_LOB` 패키지, OCI를 통한 변경 모두 COMMIT/ROLLBACK 대상이 된다.
- **로케이터 기반 접근**: 컬럼 접근 시 값 전체가 아닌 로케이터가 반환되며, 이를 통해 piece-wise(부분) 랜덤 접근·조작이 가능하다.
- 한 테이블에 여러 CLOB 컬럼 정의 가능 (레거시 `LONG` 타입은 테이블당 1개로 제한, 랜덤 접근 불가).
- 객체 타입(사용자 정의 타입)의 속성으로 사용 가능 (`LONG`은 불가).

---

## 3. 저장 방식

### 3.1 In-row vs out-of-row

- **In-row (기본, `ENABLE STORAGE IN ROW`)**: LOB 값이 로케이터와 함께 다른 컬럼과 같은 데이터 블록에 저장된다.
- **Out-of-row (`DISABLE STORAGE IN ROW`)**: 별도 LOB 세그먼트에 저장하고 행에는 로케이터만 남긴다.

행 내 저장 가능 여부는 **약 4000바이트**(제어 정보를 포함한 `VARCHAR2` 최대 크기 4000바이트 기준) 임계값으로 결정된다.

- LOB 값이 (제어 정보 포함) 약 4000바이트 이하이고 `ENABLE STORAGE IN ROW`이면 in-row 후보가 된다. 값이 `NULL`이면 크기와 무관하게 항상 in-row로 취급된다.
- LOB 값이 약 4000바이트를 초과하면 `ENABLE`/`DISABLE STORAGE IN ROW` 설정과 **무관하게** 강제로 out-of-row 저장된다.
- Out-of-row 저장 시 실제 할당 단위는 `CHUNK` 크기(기본값 = DB 블록 크기)의 배수이므로, 4000바이트를 살짝 넘는 값도 최소 1 chunk(예: 8KB) 단위로 공간이 확보된다 — 작은 초과분이라도 청크 하나를 통째로 점유하는 비효율이 생길 수 있다.
- 값이 대부분 작으면(4000바이트 이하) in-row가 별도 세그먼트 접근 오버헤드 없이 유리해 기본값으로 권장된다.

### 3.2 BasicFile vs SecureFile

Oracle 12c부터 `SECUREFILE`이 기본 LOB 저장 방식이다.

| 구분 | BasicFile | SecureFile |
|---|---|---|
| 성격 | 레거시 방식 | 12c+ 기본, 개선된 구현 |
| 압축/중복제거/암호화 | 미지원 | 지원 (`COMPRESS`/`DEDUPLICATE`/`ENCRYPT`) |
| CHUNK | 실제 I/O 단위 크기 결정 | 하위호환 목적의 advisory 값 |

---

## 4. 저장 옵션

`CREATE TABLE` 시 `LOB (col) STORE AS [BASICFILE|SECUREFILE] (...)` 절로 지정한다.

```sql
CREATE TABLE doc_tab (
  id NUMBER,
  content CLOB
)
LOB (content) STORE AS SECUREFILE
  (TABLESPACE lob_ts
   ENABLE STORAGE IN ROW
   CHUNK 8192
   RETENTION
   CACHE
   LOGGING
   COMPRESS MEDIUM
   DEDUPLICATE);
```

| 옵션 | 설명 |
|---|---|
| `ENABLE\|DISABLE STORAGE IN ROW` | in-row 저장 허용 여부 |
| `CHUNK n` | LOB 접근·수정 시 I/O 단위 (바이트, DB 블록 크기의 배수) |
| `PCTVERSION n` \| `RETENTION` | (BasicFile) 읽기 일관성을 위해 보존할 이전 버전 비율 / (SecureFile) Undo 기반 보존 방식 |
| `CACHE` \| `NOCACHE` \| `CACHE READS` | 버퍼 캐시 사용 여부. `CACHE`는 `LOGGING`을 내포해 `NOLOGGING`과 병행 불가 |
| `LOGGING` \| `NOLOGGING` \| `FILESYSTEM_LIKE_LOGGING` | REDO 로깅 여부. `FILESYSTEM_LIKE_LOGGING`(SecureFile)은 메타데이터만 로깅 |
| `COMPRESS [LOW\|MEDIUM\|HIGH]` | (SecureFile) LOB 압축 |
| `DEDUPLICATE` | (SecureFile) 동일 LOB 값 중복 제거 |
| `ENCRYPT` | (SecureFile) LOB 값 암호화 |

---

## 5. DBMS_LOB 패키지

CLOB을 포함한 LOB 조작용 PL/SQL 내장 패키지. SQL에서 `LENGTH`/`SUBSTR`/`INSTR` 등 표준 함수를 CLOB에 직접 사용할 수도 있지만, 대용량 데이터의 부분 읽기·쓰기·비교에는 `DBMS_LOB`을 사용한다.

| 함수/프로시저 | 설명 |
|---|---|
| `GETLENGTH(lob)` | 길이 반환 |
| `SUBSTR(lob, amount, offset)` | 부분 값 추출 |
| `INSTR(lob, pattern, offset, occurrence)` | 패턴 위치 검색 (정규식 미지원) |
| `READ(lob, amount, offset, buffer)` | 지정 위치부터 읽기 |
| `WRITE(lob, amount, offset, buffer)` | 지정 위치에 덮어쓰기 |
| `WRITEAPPEND`/`APPEND(dest, src)` | 끝에 값 추가 |
| `COPY(dest, src, amount, ...)` | LOB 간 복사 |
| `TRIM(lob, newlen)` | 길이 절삭 |
| `ERASE(lob, amount, offset)` | 지정 구간 삭제 |
| `COMPARE(lob1, lob2, ...)` | 두 LOB 값 비교 |
| `CONVERTTOCLOB`/`CONVERTTOBLOB` | CLOB↔BLOB 변환 (문자셋 변환 포함) |
| `CREATETEMPORARY`/`FREETEMPORARY` | 세션 임시 LOB 생성·해제 |
| `LOADFROMFILE` | `BFILE` → CLOB/BLOB 데이터 적재 |

### 5.1 행 잠금

`WRITE`/`WRITEAPPEND`/`APPEND`/`COPY`/`ERASE`/`TRIM` 등 LOB 값을 변경하는 프로시저는 호출 전 대상 행을 `SELECT ... FOR UPDATE`로 명시적으로 잠가야 한다. 일반 SQL `INSERT`/`UPDATE`는 실행 시 행을 암묵적으로 잠그지만, 이 프로시저들은 LOB 세그먼트를 직접 조작할 뿐 행을 암묵적으로 잠그지 않기 때문이다. 잠그지 않으면 두 세션이 동일 LOB 값을 동시에 수정해 갱신 유실(lost update)이 발생할 수 있다.

```sql
DECLARE
  v_clob CLOB;
BEGIN
  SELECT content INTO v_clob
  FROM   doc_tab
  WHERE  id = 1
  FOR UPDATE;                                   -- 명시적 행 잠금

  DBMS_LOB.WRITEAPPEND(v_clob, LENGTH('appended text'), 'appended text');

  COMMIT;                                       -- 잠금 해제
END;
/
```

### 5.2 GETLENGTH와 바이트 크기

`GETLENGTH`는 CLOB/NCLOB에 대해 **문자 수**를, BLOB/BFILE에 대해서는 **바이트 수**를 반환한다.

```sql
DECLARE
  v_clob  CLOB;
  v_chars NUMBER;
BEGIN
  SELECT content INTO v_clob FROM doc_tab WHERE id = 1;
  v_chars := DBMS_LOB.GETLENGTH(v_clob);   -- 문자 수 (바이트 수 아님)
  DBMS_OUTPUT.PUT_LINE('문자 수: ' || v_chars);
END;
/
```

멀티바이트 문자셋 CLOB에 `LENGTHB`를 직접 사용하면 `ORA-22998` 오류가 발생한다. 저장 바이트 크기가 필요하면 `CONVERTTOBLOB`으로 변환 후 `GETLENGTH`를 호출한다 (문자 수와 저장 바이트 수가 다른 이유는 7.1 참고).

```sql
DECLARE
  v_clob        CLOB;
  v_blob        BLOB;
  v_bytes       NUMBER;
  v_dest_offset INTEGER := 1;
  v_src_offset  INTEGER := 1;
  v_lang_ctx    INTEGER := DBMS_LOB.DEFAULT_LANG_CTX;
  v_warning     INTEGER;
BEGIN
  SELECT content INTO v_clob FROM doc_tab WHERE id = 1;

  DBMS_LOB.CREATETEMPORARY(v_blob, TRUE);
  DBMS_LOB.CONVERTTOBLOB(
    dest_lob     => v_blob,
    src_clob     => v_clob,
    amount       => DBMS_LOB.LOBMAXSIZE,
    dest_offset  => v_dest_offset,
    src_offset   => v_src_offset,
    blob_csid    => 0,                    -- 0: 원본 CLOB과 동일 문자셋 사용
    lang_context => v_lang_ctx,
    warning      => v_warning);

  v_bytes := DBMS_LOB.GETLENGTH(v_blob);  -- 바이트 수
  DBMS_LOB.FREETEMPORARY(v_blob);
  DBMS_OUTPUT.PUT_LINE('바이트 수: ' || v_bytes);
END;
/
```

---

## 6. 선택 기준

| 타입 | 적합한 경우 |
|---|---|
| `VARCHAR2` | 짧은 텍스트 (관례적으로 200자 미만), 인덱싱·비교 연산 빈번 |
| `CLOB` | 크기 제한이 없는 문서·텍스트 (XML, HTML, 로그, 메모) |
| `NCLOB` | 문자 데이터 대부분이 아시아 언어이며 저장 효율이 중요한 경우 (국가별 문자셋 사용, 8. 기타 참고) |
| `BLOB` | 바이너리 데이터. XML도 클라이언트·서버 문자셋이 다르면 CLOB 변환 과정에서 원본이 손상될 수 있어 원본 보존이 중요하면 BLOB 권장 |

---

## 7. 타 DBMS 비교

PostgreSQL `text`, MySQL `TEXT`/`LONGTEXT`는 CLOB과 달리 별도의 내부 재인코딩 없이 설정된 인코딩을 그대로 가변폭으로 저장한다.

| DBMS | 대용량 문자 타입 | 저장 인코딩 | 내부 재인코딩 |
|---|---|---|---|
| Oracle | CLOB | DB 문자셋을 따르되, 멀티바이트 문자셋이면 저장 시 AL16UTF16으로 강제 변환 (8.1) | 있음 |
| PostgreSQL | `text` | `server_encoding`(보통 UTF8) 그대로, 1~4바이트/글자 가변 | 없음 |
| MySQL | `TEXT`/`LONGTEXT` | 컬럼에 지정된 문자셋(예: `utf8mb4`) 그대로, 1~4바이트/글자 가변 | 없음 |

- PostgreSQL은 `server_encoding` 하나만 사용하며 CLOB/NCLOB 같은 구분이 없다. 저장은 항상 설정된 인코딩 그대로이고, client-server 간 변환은 전송 시점에만 일어난다.[^3]
- MySQL은 컬럼별로 문자셋을 지정할 수 있으나(`CHARACTER SET utf8mb4` 등), 지정한 문자셋이 곧 물리 저장 인코딩이다. `ucs2`/`utf16`처럼 고정폭 문자셋을 명시적으로 선택하지 않는 한 가변폭으로 저장된다.[^4]
- 따라서 "1글자 = 고정 N바이트" 계산은 Oracle CLOB(멀티바이트 DB 문자셋 기준)에서는 유효하지만, PostgreSQL `text`·MySQL `TEXT`/`LONGTEXT`(UTF-8 계열 문자셋 기준)에는 적용되지 않는다 — 문자 구성에 따라 바이트 수가 달라진다.

---

## 8. 기타

### 8.1 내부 저장 인코딩과 용량 변화

데이터베이스 문자셋이 **가변폭 멀티바이트**(예: `AL32UTF8`)인 경우, CLOB 컬럼 값은 디스크에 **고정폭 2바이트 유니코드인 `AL16UTF16`**으로 변환되어 저장된다.[^1] 이로 인해 원본 데이터의 문자 구성에 따라 저장 용량이 달라진다:

- **영문 등 단일바이트 문서**: `AL32UTF8`에서 1바이트인 문자가 CLOB 저장 시 2바이트가 되어 **용량이 약 2배**로 증가한다.
- **아시아 언어 문서**: `AL32UTF8`에서 보통 3바이트인 문자가 CLOB 저장 시 2바이트가 되어, 동일 문서를 `AL32UTF8` 기반 `LONG` 컬럼에 저장할 때 대비 **약 30% 적은 용량**을 사용한다 (문서 구성에 따라 편차 있음).

데이터베이스 문자셋이 **단일바이트**(예: `US7ASCII`)인 경우에는 이 변환이 적용되지 않는다.

Oracle은 신규 데이터베이스에 `AL32UTF8` 문자셋과 `VARCHAR2`/`CHAR`/`CLOB` 사용을 권장하며, 아시아 언어 비중이 높다면 국가별 문자셋(national character set)을 `AL16UTF16`으로 설정하고 `NCLOB`/`NVARCHAR2`를 사용하는 것이 저장 효율 면에서 유리하다고 안내한다.

`GETLENGTH`가 반환하는 문자 수와 실제 저장 바이트 수가 다른 이유(5.2 참고)는 이 내부 인코딩 변환 때문이다: 문자 수는 논리적 개수이지만, 저장은 항상 `AL16UTF16` 고정 2바이트 기준으로 이뤄진다.

### 8.2 실측 검증

CLOB이 실제로 AL16UTF16 기준(고정 2바이트)으로 저장되는지 확인하려면 세그먼트 크기가 아니라 논리적 문자 수 기준으로 비교해야 한다.

**저장 용량 조회 (개괄)**

```sql
SELECT l.column_name, s.segment_name, s.bytes, s.blocks
FROM   user_lobs    l
JOIN   user_segments s ON s.segment_name = l.segment_name
WHERE  l.table_name  = 'MY_TABLE'
  AND  l.column_name = 'MY_CLOB_COL';
```

이 방식에는 세 가지 주의점이 있다:

1. **In-row 데이터 누락**: 값이 약 4000바이트 이하면 LOB 세그먼트가 아니라 테이블 세그먼트에 저장되므로(3.1 참고) 위 쿼리로 잡히지 않는다. 값 대부분이 4000바이트를 초과하면 이 영향은 작다.
2. **파티션 테이블**: 파티션 테이블은 `user_lobs.segment_name`이 NULL이므로 `user_lob_partitions`를 조회해야 한다.
3. **CHUNK 단위 반올림**: out-of-row 데이터는 CHUNK 크기(기본 DB 블록 크기, 흔히 8192바이트) 배수로만 공간이 할당된다. 세그먼트 bytes를 행 수로 나눈 평균은 순수 인코딩 바이트(문자 수 × 2)보다 항상 크게 나온다.

**논리적 문자 수 기준 비교**

```sql
SELECT COUNT(*)                                    AS row_cnt,
       SUM(DBMS_LOB.GETLENGTH(my_clob_col))         AS total_chars,
       AVG(DBMS_LOB.GETLENGTH(my_clob_col))          AS avg_chars
FROM   my_table
WHERE  my_clob_col IS NOT NULL;
```

`평균 세그먼트 bytes ÷ 평균 문자 수` 비율이 정확히 2.0이 아니라 CHUNK 반올림 오버헤드만큼 더 크게(경험적으로 2.0~2.5 수준) 나오는 것은 정상이다.[^2] 순수 인코딩 비율만 확인하려면 값 크기를 CHUNK 배수에 맞춰 통제한 테스트 데이터로 별도 검증해야 한다.

---

## Sources
- [Oracle SQL Language Reference — Data Types: LOB Data Types (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Oracle Database Globalization Support Guide — 6.5.3 Storing Documents in Multiple Languages in LOB Data Types (19c)](https://docs.oracle.com/en/database/oracle/oracle-database/19/nlspg/supporting-multilingual-databases-with-unicode.html)
- [Oracle Database SecureFiles and Large Objects Developer's Guide — Using Oracle LOB Storage (18c)](https://docs.oracle.com/en/database/oracle/oracle-database/18/adlob/using-oracle-LOBs-storage.html)
- [Oracle Database SecureFiles and Large Objects Developer's Guide — 11 LOB Storage with Applications (12c)](https://docs.oracle.com/database/121/ADLOB/adlob_tables.htm)
- [Oracle Database SecureFiles and Large Objects Developer's Guide — Using Oracle SecureFiles (12c)](https://docs.oracle.com/database/121/ADLOB/adlob_smart.htm)
- [Oracle Database SecureFiles and Large Objects Developer's Guide — Using LOB APIs (12c)](https://docs.oracle.com/database/121/ADLOB/adlob_lob_ops.htm)
- [Oracle PL/SQL Packages and Types Reference — DBMS_LOB (21c)](https://docs.oracle.com/en/database/oracle/oracle-database/21/arpls/DBMS_LOB.html)
- [PostgreSQL Documentation — Character Set Support (multibyte.html)](https://www.postgresql.org/docs/current/multibyte.html)
- [PostgreSQL Documentation — TOAST (storage-toast.html)](https://www.postgresql.org/docs/current/storage-toast.html)
- [PostgreSQL Documentation — Character Types (datatype-character.html)](https://www.postgresql.org/docs/current/datatype-character.html)
- [MySQL 8.0 Reference Manual — Column Character Set and Collation](https://dev.mysql.com/doc/refman/8.0/en/charset-column.html)
- [MySQL 8.0 Reference Manual — Data Type Storage Requirements](https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html)
- [MySQL 8.0 Reference Manual — InnoDB Row Formats](https://dev.mysql.com/doc/refman/8.0/en/innodb-row-format.html)

---

## Related pages
- [[sql-functions]]

[^1]: 원문(Globalization Support Guide §6.5.3): "Data in CLOB columns is stored in the AL16UTF16 character set when the database character set is multibyte, such as UTF8 or AL32UTF8. This means that the storage space required for an English document doubles when the data is converted. Storage for an Asian language document in a CLOB column requires less storage space than the same document in a LONG column using AL32UTF8, typically around 30% less, depending on the contents of the document."
[^2]: CHUNK 반올림에 의한 오버헤드 크기는 개별 값의 크기 분포에 따라 달라지는 추정치이며, Oracle 공식문서에 명시된 수치가 아니라 저장 구조(out-of-row 저장은 CHUNK 배수 단위로만 할당됨, 3.1 참고)로부터 유추한 설명이다.
[^3]: PostgreSQL Documentation — Character Set Support: "PostgreSQL supports automatic character set conversion between server and client for many combinations of character sets." 저장 자체는 서버 인코딩 그대로 유지됨.
[^4]: MySQL 8.0 Reference Manual — Column Character Set and Collation: 컬럼별 문자셋·콜레이션 지정 규칙.
