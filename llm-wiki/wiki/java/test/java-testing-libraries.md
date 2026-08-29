---
title: Java 테스트 라이브러리 개요 — 목적별 분류
updated: 2026-07-14 11:26:44
tags:
  - java
  - testing
  - overview
---

## 1. 개요

Java 테스트는 보통 **하나의 라이브러리가 아니라 목적별 조합**으로 구성한다. 실행 프레임워크(JUnit) + 단언(AssertJ) + 모킹(Mockito) + 통합 의존성(Testcontainers)이 전형적 스택이다. 아래는 목적별 분류다.

> Spring Boot의 `spring-boot-starter-test`는 JUnit Jupiter·AssertJ·Mockito·Hamcrest·JSONAssert·JsonPath를 한 번에 가져온다. Spring 프로젝트라면 대부분 이 번들로 시작한다.

| 목적 | 대표 라이브러리 |
|------|-----------------|
| 테스트 프레임워크 | **JUnit 5**, TestNG, Spock |
| 단언(Assertion) | **AssertJ**, Hamcrest, JUnit 내장 |
| 모킹(Mocking) | **Mockito**, EasyMock, JMockit |
| 통합/외부 의존성 | **Testcontainers**, WireMock, 임베디드 DB |
| API/REST | REST Assured, Spring MockMvc |
| 특수 목적 | jqwik, Cucumber, ArchUnit, PIT, JMH, Datafaker |
| 커버리지 | [[jacoco]] |

---

## 2. 테스트 프레임워크

테스트의 수명주기·발견·실행을 담당하는 핵심 런너.

- **JUnit 5 (Jupiter)** — 사실상 표준. 가장 널리 사용. 확장 모델(`@ExtendWith`), 매개변수화 테스트 등. → [[junit-parameterized-test]]
- **JUnit 4** — 레거시. 다수 기존 프로젝트가 사용. `@RunWith` 기반. 신규는 5 권장.
- **TestNG** — 그룹(`groups`)·의존(`dependsOnMethods`)·병렬 실행·데이터 프로바이더에 강점. 대규모 통합/E2E 스위트에서 선호되기도 함.
- **Spock** — Groovy 기반 BDD 프레임워크. `given/when/then` 블록, 강력한 데이터 테이블·내장 모킹. 표현력이 높지만 Groovy 의존.

---

## 3. 단언 (Assertion)

테스트 결과를 검증하는 표현. 가독성·실패 메시지 품질이 차이를 만든다.

- **AssertJ** — `assertThat(x).isEqualTo(...).contains(...)` 형태의 **fluent 체이닝**. 타입별 풍부한 단언과 명확한 실패 메시지로 현재 가장 권장.
- **Hamcrest** — `assertThat(x, is(...))` matcher 기반. JUnit 4 시절 표준, 일부 API(예: MockMvc matcher)에서 여전히 사용.
- **JUnit Jupiter Assertions** — `assertEquals`/`assertThrows` 등 내장 기본. 간단한 검증에 충분.
- **Truth** (Google) — AssertJ와 유사한 fluent 단언. Google 생태계에서 사용.

---

## 4. 모킹 (Mocking)

협력 객체를 가짜로 대체해 **단위 테스트를 격리**한다.

- **Mockito** — 사실상 표준. `mock()`/`when().thenReturn()`/`verify()`. `mockito-junit-jupiter`로 JUnit 5 연동, `mockito-inline`(또는 최신 기본)으로 static/final 모킹.
- **EasyMock / JMockit** — 대안 모킹 프레임워크. record-replay(EasyMock) 등 스타일 차이.
- **PowerMock** — static/final/생성자 등 Mockito가 과거에 못 하던 영역 모킹. 바이트코드 조작 기반이라 무겁고, 최신 Mockito가 상당 부분 대체해 **신규 사용은 비권장 추세**.[^1]
- **Spring `@MockitoBean`/`@MockBean`** — Spring 컨텍스트의 빈을 모킹으로 교체(슬라이스/통합 테스트).

[^1]: 출처의 직접 서술이 아니라 최신 Mockito의 static/final 모킹 지원(§4 Mockito 항목)과 PowerMock 유지보수 정체로부터 도출한 주장임.

---

## 5. 통합 / 외부 의존성

실제(또는 그에 준하는) 외부 시스템을 띄워 **데이터 접근·통합 경로**를 검증한다.

- **Testcontainers** — Docker 컨테이너로 **실제 DB·메시지 큐·브라우저** 등의 일회성(throwaway) 인스턴스를 코드로 띄운다. mock/인메모리가 아닌 **운영과 동일한 서비스**로 테스트하고, 매 실행이 알려진 상태에서 시작한다. DAO 통합 테스트·애플리케이션 통합 테스트에 사용. PostgreSQL/MySQL/Kafka 등 전용 모듈 제공.
- **WireMock** — 외부 **HTTP API를 스텁/모킹**. 응답·지연·실패 시나리오를 정의해 클라이언트 코드를 격리 테스트. 독립 프로세스/JUnit 확장/컨테이너로 실행.
- **MockWebServer** (OkHttp) — 경량 HTTP 모킹 서버. 단순 요청/응답 검증에 적합.
- **임베디드 DB** — **H2**(인메모리 RDB), Embedded PostgreSQL 등. 빠르지만 운영 DB와 방언 차이가 있어 정합성은 Testcontainers가 우위.[^2]
- **Embedded Kafka / GreenMail** — 메시징·메일 등 특정 미들웨어의 임베디드 대체.

[^2]: Testcontainers가 운영과 동일한 실제 DB를 사용한다는 사실(§5 Testcontainers 항목)과 임베디드 DB의 방언 차이로부터 추론.

---

## 6. API / REST 테스트

- **REST Assured** — REST API를 `given().when().then()` DSL로 호출·검증. 응답 상태·헤더·JSON 본문 단언.
- **Spring MockMvc / WebTestClient** — Spring MVC/WebFlux 컨트롤러를 서블릿 컨테이너 없이(MockMvc) 또는 논블로킹(WebTestClient)으로 테스트.
- **JSONAssert** — JSON 문서를 구조적으로 비교(순서 무시 등). `spring-boot-starter-test`에 포함.

---

## 7. Spring 테스트

- **spring-test / spring-boot-starter-test** — `@SpringBootTest`(전체 컨텍스트), 슬라이스 테스트 `@WebMvcTest`·`@DataJpaTest`·`@JsonTest` 등, `@MockitoBean`. 위 단언/모킹 번들 포함.
- **spring-batch-test** — 배치 잡/스텝·스코프 빈 테스트. → [[batch-testing]]

---

## 8. 특수 목적

| 분류 | 라이브러리 | 용도 |
|------|------------|------|
| 속성 기반(Property-based) | **jqwik** | 입력을 무작위 생성해 불변식 검증(예외 케이스 탐색) |
| BDD/명세 | **Cucumber**, JBehave | Gherkin(`Given/When/Then`) 자연어 시나리오 |
| 계약 테스트(Contract) | **Spring Cloud Contract**, Pact | 서비스 간 API 계약을 소비자/공급자 양측에서 검증 |
| 아키텍처 테스트 | **ArchUnit** | 패키지 의존·레이어 규칙을 테스트로 강제 |
| 변이 테스트(Mutation) | **PIT (pitest)** | 코드를 변이시켜 테스트가 잡아내는지로 **테스트 품질** 측정 |
| 마이크로벤치마크 | **JMH** | JIT 워밍업 등을 고려한 정확한 성능 측정 → [[jmh]] |
| 테스트 데이터 생성 | **Datafaker**, Instancio, EasyRandom | 무작위/현실적 테스트 객체·필드 생성 |
| 커버리지 | **JaCoCo** | 실행된 코드 비율 측정 → [[jacoco]] |

> 변이 테스트(PIT)와 커버리지(JaCoCo)는 보완 관계다. 커버리지는 "실행 여부", 변이 테스트는 "단언이 결함을 잡는지"를 본다.

---

## 9. 전형적 조합

- **단위 테스트**: JUnit 5 + AssertJ + Mockito
- **데이터 접근/통합**: 위 + Testcontainers(실DB) 또는 H2(속도 우선)
- **외부 API 연동**: 위 + WireMock
- **Spring**: `spring-boot-starter-test`(JUnit5/AssertJ/Mockito/JSONAssert 포함) + Testcontainers
- **품질 게이트**: [[jacoco]] 커버리지 + (선택) PIT 변이 테스트

---

## Sources
- Testcontainers for Java: https://java.testcontainers.org/
- Testcontainers — Database containers: https://java.testcontainers.org/modules/databases/
- Mockito framework site: https://site.mockito.org/
- AssertJ — Fluent assertions: https://assertj.github.io/doc/
- Baeldung — Mockito vs EasyMock vs JMockit: https://www.baeldung.com/mockito-vs-easymock-vs-jmockit
- Baeldung — Introduction to WireMock: https://www.baeldung.com/introduction-to-wiremock

---

## Related pages
- [[junit-parameterized-test]] — JUnit 5 매개변수화 테스트(프레임워크 상세)
- [[junit-test-suite]] — JUnit 테스트 스위트·태그 필터링(@Suite, @Tag, Gradle/Maven)
- [[jacoco]] — 테스트 커버리지 측정
- [[spock]] — Groovy 기반 BDD 명세 프레임워크(블록 구조·데이터 테이블·모킹 내장)
- [[test-double]] — Mock/Stub/Spy 차이(모킹 라이브러리의 개념적 배경)
- [[good-test-practices]] — 좋은 테스트 코드 작성법(결과 검증·GWT·FIRST/Test Desiderata)
- [[mockito-doreturn-vs-when]] — Mockito when().thenXxx() vs doXxx().when() 스터빙 구문
- [[jmh]] — JMH 마이크로벤치마크(설정·어노테이션·결과 해석)
