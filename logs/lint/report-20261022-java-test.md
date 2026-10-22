# wiki-lint report — 2026-10-22 (java/test)

- **범위**: `wiki/java/test/` 13개 문서 (good-test-practices, inverse-operation-testing, jacoco, java-testing-libraries, jmh, junit-parameterized-test, junit-test-execution-order, junit-test-suite, mockito-doreturn-vs-when, mockito-void-methods, mockserver, spock, test-double)
- **결과**: broken links 2건(문서 내 앵커) / 사실 오류·출처 불일치 18건 / 원문 미확인·근거 부족 3건 / 구성·양식 개선 다수
- **조치**: 사실 정정(C1–C18, L1–L2) → 구성 개선 → 문체 정리 순으로 diff 제시 후 승인 대기. 사용자 요청으로 JUnit 4 내용 제거 병행

---

## 1. 링크

- 위키링크 `[[...]]` 대상 전부 존재. 깨짐 0건
- `wiki/index.md`에 13개 문서 모두 등재
- L1: `junit-test-suite.md` §4.2 `[[#5.2 태그 표현식|…]]` 깨짐. 실제 제목은 `5.2. 태그 표현식`
- L2: `jacoco.md` §4·§5 `[§5.1](#51-maven--execution)` 등 GitHub slug 앵커 3곳. Obsidian에서 미해석
- 외부 URL 76개 중 403 8개(Baeldung 7, mvnrepository 1). 봇 차단으로 원문 미확인
- `raw/java/test/` 소스 1개(Baeldung Mockito when vs doXxx). 나머지는 웹 출처 의존

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `mockito-doreturn-vs-when.md` | §4 표·§4.1·§6 | `doXxx()` 체이닝 불가 서술(raw Baeldung과 동일). Mockito `Stubber` javadoc은 `doThrow(..).doThrow(..).when(mock)` 연속 스터빙 예시 제시. `mockito-void-methods` §3.1과도 불일치 |
| C2 | `mockito-doreturn-vs-when.md` | §6 | "final 메서드는 mock 불가". Mockito 5.0부터 inline mock maker 기본. `java-testing-libraries` §4와 충돌 |
| C3 | `mockito-void-methods.md` | §2 | 공식 javadoc의 `doNothing()` 사용 사례는 연속 스터빙·spy void. 문서는 다른 두 사례를 들고, "ArgumentCaptor 결합"은 §5.1·§7과 모순 |
| C4 | `test-double.md` | §4.1 | Spock Stub에 `1 *` 사용 시 "무시". 공식은 `InvalidSpecException` 발생 |
| C5 | `test-double.md` | §2 vs §3·§3.3 | Spy 정의가 Fowler(기록하는 Stub)와 프레임워크 spy(실제 객체 부분 대체)로 혼재 |
| C6 | `inverse-operation-testing.md` | §3.1 | 벡터는 BC GCMTest Test Case 3이며 평문은 `d9313225…`. `EXPECTED = "hello world"` 및 "NIST CAVP" 주석 오류 |
| C7 | `inverse-operation-testing.md` | §3.4 | "`decompress(x)` 길이 ≥ 입력 길이"는 성립하지 않는 성질 |
| C8 | `good-test-practices.md` | §4.1 | Timely "직전/직후". Clean Code는 "just before"(책 원문 미확인, 2차 출처 기준) |
| C9 | `good-test-practices.md` | §4.2 | Composable 정의가 testdesiderata.com과 불일치. "12개 다 만족 불필요"·"포기 말라" 서술은 사이트에 없음(Medium 원문 차단) |
| C10 | `jacoco.md` | [^1] | "출처가 단언 품질을 다루지 않는다". Fowler TestCoverage가 AssertionFreeTesting을 직접 언급 |
| C11 | `jmh.md` | §5 | Error는 99.9% 신뢰구간의 "폭"이 아니라 반폭(half-width) |
| C12 | `java-testing-libraries.md` | §1·§9 | `spring-boot-starter-test` 구성에서 Spring Test·Spring Boot Test·Awaitility 누락 |
| C13 | `junit-test-suite.md` | §8.3 | "빈 채로 끝난다". `@Suite(failIfNoTests)` 기본 `true`(1.9+)로 실패 |
| C14 | `junit-test-suite.md` | §4 | `@RunWith(JUnitPlatform.class)`는 JUnit 4가 아니라 `junit-platform-runner` 소속 |
| C15 | `spock.md` | §9.4 | byte-buddy mock maker는 final 미지원. mockito mock maker(mockito-core 4.11+)만 지원 |
| C16 | `spock.md` | §2.2 | Surefire가 "`.java`만 잡음"은 오류. 기본 이름 패턴에 `*Spec`이 없는 것이 원인 |
| C17 | `mockserver.md` | §2 | "최신 8.0.0". Maven Central 최신 9.1.0 |
| C18 | `junit-parameterized-test.md` 외 | 제목·본문 | "JUnit 5" 기준 서술. 출처는 6.0.3/5.13.0 혼재, 최신 6.1.3 |

참고: MockServer 공식 문서는 `@ExtendWith`와 `@MockServerSettings` 병용 금지를 경고하면서 같은 페이지 예시에서 병용함(출처 내부 불일치).

---

## 3. 원문 미확인·근거 부족

- 원문 미확인: Baeldung 7개 페이지(403), Kent Beck Medium(Cloudflare 차단), Clean Code(책)
- 출처 없음: `java-testing-libraries`의 TestNG, Truth, PIT, ArchUnit, Cucumber, Pact, Datafaker, REST Assured, MockWebServer, Spring Cloud Contract
- 각주 없는 추론: `test-double` §4.2 "기본은 stub, verify 붙이면 mock", §5 "일반적 권장", `spock` §8 장단점

---

## 4. 구성·양식

- Sources `[기관: 제목](URL)` 형식 미준수 11개(jmh, mockserver 제외)
- Related pages 설명 부착 11개
- 대시·부제가 붙은 긴 제목 9개
- `## 1. 개요`가 아닌 첫 절 제목(`왜 중요한가`, `문제 정의`, `목적`, `개요 — …`)
- 대시 연결·본문 화살표·볼드 남용·이모지: good-test-practices, inverse-operation-testing, test-double, mockito-doreturn-vs-when, java-testing-libraries, spock, jacoco
- 요약·정리 절: good-test-practices §5, mockito-doreturn-vs-when §6 "패턴 요약"
- 문서 내 반복: good-test-practices §2.1·§4.3, spock §4.2·§6.1
- `mockserver.md` 절 구분선 누락, `jmh.md` 태그 `test`(타 문서 `testing`)
- `wiki/index.md` 하위 항목 나열: jmh, mockito-doreturn-vs-when, mockito-void-methods, inverse-operation-testing, junit-test-suite, junit-parameterized-test, mockserver
