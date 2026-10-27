# wiki-lint report — 2026-10-27 (java-spring-batch)

- **범위**: `wiki/java/spring/` Spring Batch 문서 9개 (batch, batch-scope, batch-job-parameters, batch-tasklet, batch-chunk, batch-db-reader-writer, batch-fault-tolerance, batch-flow, batch-testing)
- **결과**: broken links 0건(외부 URL 403 2건 별도) / 사실 오류·출처 불일치 6건 / 문서 간 불일치·버전 기준 불일치 4건 / 근거 미확인 2건 / Boot 2(Batch 4.x) 잔존 내용 다수 / 구성·양식 개선 다수
- **조치**: 사실 정정 → Batch 4.x 내용 제거 → Batch 6 deprecated API 반영 → 구성 개선 → 문체 정리 순으로 diff 제시 후 단계별 승인·반영(`bf40ef3`, `396c229`, `376d4d2`, 문체 정리 커밋)

---

## 1. 링크

- 위키링크 대상 전부 존재(`excel`, `mybatis`, `junit-parameterized-test` 등 다른 디렉터리 포함)
- 외부 URL 27개 중 25개 200. `baeldung.com` 2건 403(봇 차단 추정). `raw/java/spring/`의 사본으로 대조
- `docs/current/api` 링크는 Spring Batch 5.2.6 API를 가리키나 문서에는 "6.x"로 표기

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `batch-db-reader-writer.md` | §4 note·[^2] | "JPA는 커서 reader를 기본 제공하지 않는다" 오류. `JpaCursorItemReader`는 4.3부터 제공(5.2.x javadoc `Since: 4.3`) |
| C2 | `batch.md`, `batch-chunk.md`, `batch-db-reader-writer.md` | 구현체 표·§5 | Hibernate reader/writer는 5.0에서 deprecated, 5.2에서 제거(5.0.2 deprecated list, 5.2.x 클래스 목록) |
| C3 | `batch-testing.md` | §3 note·§4~6 | `AssertFile`은 5.0에서 deprecated, 5.2에서 제거. "6.0에서는 명칭만 치환" 서술과 충돌 |
| C4 | `batch-flow.md` | §5.3 note | "`ItemListenerSupport`는 5.0에서 deprecated" 오류. 5.0 deprecated list·5.2.6 API·6.0 deprecated list 모두 미표시 |
| C5 | `batch-job-parameters.md` | §4.3 | Boot가 `--key=value`를 잡 파라미터로 전달한다는 서술 오류. Spring Boot how-to는 `--` 없는 `key=value` 사용을 명시 |
| C6 | `batch-testing.md` | §8·[^1] | "Boot 3.x는 `spring.batch.job.name`을 비워 두는 방식" 오류. Boot 4.1 레퍼런스도 `spring.batch.job.enabled=false`로 비활성화, `spring.batch.job.name`은 다중 Job 빈일 때 실행 잡 지정 |

---

## 3. 문서 간·버전 기준 불일치

| # | 파일 | 내용 |
|---|---|---|
| V1 | `batch.md` §2, `batch-job-parameters.md` §4.1 | `JobLauncher`를 실행 진입점으로 서술. 6.0에서 deprecated(`JobOperator`가 `JobLauncher` 확장). `batch-testing`만 전환을 언급 |
| V2 | `batch-chunk`, `batch-scope`, `batch-fault-tolerance`, `batch-flow` | `chunk(n, tx)`는 Batch 5 권장·Batch 6 deprecated, `chunk(n).transactionManager(tx)`는 그 반대. 6.0+ 표기 예시가 5 형식 사용 |
| V3 | `batch-job-parameters.md` §4.2 | "5.0+" 표기에 6.0 도입 `CommandLineJobOperator` 예시 사용 |
| V4 | `batch-testing.md` §3 note | "기본 인메모리 `JobRepository`"는 Baeldung(Boot 2.3) 서술. Boot 3은 `DataSource` 기반(`@ConditionalOnBean(DataSource.class)`), Boot 4는 In-memory·JDBC·MongoDB 지원 |

---

## 4. 근거 미확인

- `batch-fault-tolerance.md` §4.2 `noRetry`: 6.x 레퍼런스(retry·skip 페이지)에서 미확인
- `batch-fault-tolerance.md` §1 "Spring Retry 의존이 제거": 6.0 what's new는 "Spring Retry 대신 Spring Framework 7 retry 기반"으로만 서술

---

## 5. Boot 2(Batch 4.x) 잔존 내용

- 버전 범위 note "Batch 4~6(Boot 2→Batch 4)": `batch.md`, `batch-fault-tolerance.md`
- 4.x JobParameters 4개 고정 타입·타입별 컬럼·`+name(type)=value` 표기: `batch-job-parameters.md` §2·§4.2
- 4.x `List<? extends T>` 시그니처 마이그레이션 note: `batch-chunk.md` §5, `batch-flow.md` §5.3
- 버전 표기 "(Spring Batch 3.0 도입)", "(4.1+)": `batch-scope.md`, `batch-testing.md`
- `@EnableBatchProcessing`으로 스코프 등록 필요(Boot 2 방식): `batch-scope.md` §2.3·§7. Boot 3 이상은 `DefaultBatchConfiguration`이 `ScopeConfiguration`을 import
- jojoldu `spring-batch-querydsl` 라이브러리 `build.gradle`이 Boot 2.3.8 기준: `batch-db-reader-writer.md` §6.3(각주로 표시)

---

## 6. 구성·양식

- Sources `[기관: 제목](URL)` 형식 미준수 9개
- Related pages 설명 부착 9개, 관련성 낮은 링크 1개(`batch-testing` `[[junit-parameterized-test]]`)
- 문서 간 반복: `batch.md` §6 ↔ `batch-chunk` §3~5(구현체 표), `batch.md` §5 ↔ `batch-chunk` §6(Tasklet·Chunk 비교), `batch.md`·`batch-chunk` 커서/페이징 note ↔ `batch-db-reader-writer` §2, `batch-job-parameters` §3 ↔ `batch-fault-tolerance` §2.2, `batch-job-parameters` §5.1 ↔ `batch-scope` §2.1
- 문서 내 반복·요약 절: `batch.md` §3.3·§4.2, `batch-fault-tolerance` §6, `batch-flow` §8, `batch-scope` §6·§7, `batch-db-reader-writer` §8 일부
- 대시 연결 절 제목 다수, 서술형 절 제목(`batch-tasklet` "언제 사용하는가")
- 대시 연결 본문 약 45곳, 본문 화살표 11곳, 볼드 남용 약 75곳, 볼드 소제목(`batch-fault-tolerance` §4.2)
- 인라인 `(출처: …)` 표기 10곳
- 축약어 원어 미병기: ETL, JDBC, JPA, JPQL, StAX, OXM, DTO, SpEL, FQN, PK, GC, DDL
- 잘못된 문서 참조 `(§[[batch]] 처리 방식 비교)`(`batch-tasklet`)
- `wiki/index.md` 하위 항목 나열 7개
