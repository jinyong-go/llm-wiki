# wiki-lint report — 2026-10-21 (dbms)

- **범위**: `wiki/dbms/` 10개 문서 (clob-in-oracle, concurrency-control, deadlock-livelock, execution-plan, index-scan, optimizer-statistics, oracle-hints, partitioning, sql-functions, upsert-merge)
- **결과**: broken links 0건 / 원문 미확인 출처 4건 / 사실 오류·출처 불일치 10건 / 문서 내 모순 3건 / 근거 부족 3건 / 구성·양식 개선 다수
- **조치**: 오류(C1–C13, W1–W3) → 구성 개선 → 문체·양식 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크: `[[...]]` 대상 전부 존재. `wiki/index.md`에 10개 문서 모두 등재
- 외부 출처 URL 79개 확인
	- dev.mysql.com 22개는 curl에서 403이나 WebFetch로 정상 조회(봇 차단으로 판단)
	- 원문 미확인: `blogs.oracle.com/optimizer` 2건(403, `index-scan`·`optimizer-statistics`), `baeldung.com/cs/deadlock-livelock-starvation`(403, `deadlock-livelock`), `support.oracle.com` 2702986(로그인 필요, `upsert-merge` ORA-38104 근거)
	- learn.microsoft.com 2건은 `?view=` 파라미터 리다이렉트

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `upsert-merge.md` | §4 | PostgreSQL 15+ `MERGE`에 `WHEN NOT MATCHED BY SOURCE` 포함으로 서술. 15·16 문법에 없음, 17+ 지원 |
| C2 | `sql-functions.md` | §5 | `SUBSTRING(s FROM pos FOR len)` "전체(표준)". Oracle은 `SUBSTR`만 제공 |
| C3 | `optimizer-statistics.md` | §4.3 | MySQL 히스토그램 "자동 재계산되지 않음". 8.4는 `AUTO UPDATE` 절 지원(기본 `MANUAL UPDATE`) |
| C4 | `partitioning.md` | §4 | MySQL 무중단 파티션 전환 "제한적". `ALTER TABLE ... EXCHANGE PARTITION ... WITH TABLE` 지원 |
| C5 | `clob-in-oracle.md` | §2 | "최대 4GB는 CHUNK 1바이트 가정 하한값". CHUNK는 블록 크기 배수(같은 문서 §4)로 성립 불가. 공식 최대치 (4GB−1)×CHUNK |
| C6 | `clob-in-oracle.md` | §7·§8.1 | AL16UTF16을 "고정폭 2바이트"로 서술. 보충 문자는 4바이트(surrogate pair) |
| C7 | `execution-plan.md` | §4.1 | `EXPLAIN ANALYZE` "8.0.31+ DML 지원". 문서상 대상은 `SELECT`, 다중 테이블 `UPDATE`/`DELETE`, `TABLE` |
| C8 | `index-scan.md` | §3 | pg_hint_plan은 `shared_preload_libraries` 등록 필수로 서술. `LOAD 'pg_hint_plan'`으로 세션 활성화 가능 |
| C9 | `upsert-merge.md` | §2 | `ON CONFLICT DO UPDATE` "충돌 여부와 무관하게" 행 잠금. 문서는 DO UPDATE 실행 시 `WHERE` 조건이 거짓인 행도 잠긴다는 의미 |
| C10 | `concurrency-control.md` | §2 | READ UNCOMMITTED dirty read 허용 서술에 PostgreSQL RU가 RC와 동일하게 동작한다는 내용 누락 |

---

## 3. 문서 내 모순

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C11 | `clob-in-oracle.md` | §5.2 | "7.1 참고". 해당 설명은 §8.1 |
| C12 | `index-scan.md` | §7.3 | IN-list "항상 INLIST ITERATOR"와 "단일 범위·전체 테이블 스캔 선택 가능" 서술 충돌 |
| C13 | `upsert-merge.md` | §6 | MySQL "같은 문장 내 중복 매칭: 하나만 갱신". §5.1·원문은 유니크 인덱스가 여러 개인 경우의 동작. 같은 문장 내 중복 입력 행 동작은 원문에 없음 |

---

## 4. 근거 부족

| # | 파일 | 내용 |
|---|---|---|
| W1 | `clob-in-oracle.md` §6 | `VARCHAR2` "관례적으로 200자 미만" |
| W2 | `index-scan.md` §3.2 | Index Only Scan "세 방식 중 가장 빠름" |
| W3 | `oracle-hints.md` §2·§7 | 블록 주석 "권장", 힌트 세트 지정 "권장" |

---

## 5. 구성·양식

- `§` 없는 절 참조: `clob-in-oracle`, `execution-plan`, `index-scan`, `optimizer-statistics`, `upsert-merge`
- `concurrency-control.md` §3.1–§3.3 제목의 잔존 번호("2-1." 등)
- 절 사이 `---` 누락: `deadlock-livelock`, `execution-plan`, `index-scan`, `optimizer-statistics`, `partitioning`, `sql-functions`
- 대시 연결, 강조 볼드, 명사형 종결 다수
