# wiki-lint report — 2026-10-20 (all)

- **범위**: `wiki/` 전체 262개 문서(index 제외). 형식·내용 구성만 점검하고 출처 검증은 제외
- **결과**: 형식 오류 9종, 구성 개선 4종, 문체 5종, 규칙 적용 범위 결정 2건
- **조치**: 형식 오류 → 구성 → 문체(카테고리별) 순으로 diff 제시 후 승인

---

## 1. 형식 오류

| 항목 | 대상 | 내용 |
|---|---|---|
| 절 번호 `1.1` 형식 | 28개, 제목 325개 | backtracking, bfs, clob-in-oracle, cqrs, crontab, design-patterns, design-patterns-behavioral, design-patterns-creational, design-patterns-structural, dfs, dynamic-programming, execution-plan, index-scan, jmeter-components, jmeter-introduction, jni, junit-test-execution-order, keystore-java, load-testing, netty, netty-implementation, optimizer-statistics, project-reactor, reactive-programming, reactor-operators, solid, sql-functions, tps-improvement |
| `####` 번호 없음 | 6개 | mybatis, jacoco, git-stash, systemd-unit-file, cmp, x509-certificate |
| H1을 절 구분으로 사용 | 3개 | git-fetch-pull-push, git-reset-revert, git-switch-restore. H1 아래 `##` 번호가 명령을 넘어 이어짐 |
| 각주가 Related pages 앞 | 34개 | batch, batch-chunk, batch-db-reader-writer, batch-fault-tolerance, batch-flow, batch-job-parameters, batch-tasklet, batch-testing, bean-registration-control, commonjs, crl-java, deadlock-livelock, enable-annotations, es-module, forward-headers-proxy, gc-monitoring, gradle-application, gradle-dependency-configurations, jacoco, java-testing-libraries, jmh, junit-test-execution-order, keystore-java, logging-frameworks, mockserver, module-system, nestjs-mongoose, nestjs-request-pipeline, network-diagnostics, npx, optimizer-statistics, package-manager, profiles, shell-special-parameters |
| 각주 앞 `---` 없음 | 19개 | backtracking, bfs, clob-in-oracle, cqrs, crontab, design-patterns-behavioral, design-patterns-creational, dfs, dynamic-programming, first-class-citizen, index-scan, jmeter-introduction, jpa-exceptions, kdf, load-testing, netty, netty-implementation, reactive-programming, tps-improvement |
| Sources 앞 `---` 없음 | 3개 | commonjs, es-module, module-system |
| 각주 정의 한 줄 병합 | 2개 | index-scan(289행), batch-tasklet(138행). `[^2]` 이후가 각주로 렌더링되지 않음 |
| 각주 번호가 등장 순서와 다름 | 5개 | clob-in-oracle, netty, backtracking, csrf, cors-preflight |
| Related pages 비어 있음 | 1개 | jni |
| 링크 텍스트가 `[`로 시작 | 1개 | querydsl Sources의 `[[Gradle] …]`이 위키링크로 해석됨 |

위키링크 깨짐 0건(검출 6건은 `llm-wiki`·`ai-agent-schema`의 코드 예시). index 형식·누락·파일명 중복 없음.

---

## 2. 구성

- **요약·정리 절**(28개): ldap, docker-volume, dockerfile, git-clone, git-config, git-file-states, git-stash, logging-frameworks, netty-implementation, ml-dsa-bouncycastle, ml-kem-bouncycastle, aop-transaction-order, batch-fault-tolerance, configuration-properties, externalized-configuration, jpa-transaction, redis, spring-event-error-handling, good-test-practices, inverse-operation-testing, jacoco, junit-parameterized-test, mockito-doreturn-vs-when, test-double, readline-shortcuts, tps-improvement, certificate-revocation, cmp. openssl의 "주요 옵션 정리"는 옵션 참조 표이므로 제외
- **인바운드 링크 없음**(23개): ai-agent-skill, bitwise-operators, clob-in-oracle, compression-archiving, cqrs, crontab, docker-network-commands, fetch-api, file-encoding, function-declaration, git-fetch-pull-push, gradle-shadow, jni, jpa-exceptions, junit-test-execution-order, mockito-void-methods, padding-oracle-attack, partitioning, readline-shortcuts, template-literals, thread-unsafe-utilities, upsert-merge, user-group-management
- **"n장" 참조**(24개): aop, bean-registration-control, cms, commonjs, cookie, csrf, enable-annotations, es-module, expression-vs-statement, jpa-exceptions, jwt, logback, mybatis, netty-implementation, oauth2, partitioning, querydsl, reactive-programming, reactor-operators, session-hijacking, upsert-merge, web-storage, webauthn, x509-certificate
- **긴 문서**: design-patterns-behavioral(655행), redis(556행), mybatis(519행)
- 첫 절이 개요가 아닌 문서 69개는 git·linux·docker 명령 문서 계열의 일관된 구성으로 위반 아님

---

## 3. 문체

| 항목 | 문서 | 줄 |
|---|---|---|
| 항목명 대시(`**항목** — 설명`) | 63 | 442 |
| 제목 내 대시 | 88 | 315 |
| 문장 대시 연결 | 159 | 467 |
| 본문 화살표(코드·표 제외) | 90 | 227 |
| 볼드 과다(15개 초과) | 49 | 최대 gc 66개 |

---

## 4. 규칙 적용 범위

- Sources `[기관: 제목](URL)` 형식: 238개 문서 불일치
- Related pages 설명 없이 링크만: 84개 문서 불일치
- 일괄 변환 또는 신규·수정 문서부터 적용 중 결정 필요
