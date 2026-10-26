---
title: Java 테스트 라이브러리
updated: 2026-10-26 13:35:39
tags:
  - java
  - testing
  - overview
---

## 1. 개요

Java 테스트는 보통 하나의 라이브러리가 아니라 목적별 조합으로 구성한다. 실행 프레임워크(JUnit), 단언(AssertJ), 모킹(Mockito), 통합 의존성(Testcontainers)을 묶은 구성이 전형적이다.

Spring Boot의 `spring-boot-starter-test`는 JUnit·Spring Test·Spring Boot Test·AssertJ·Hamcrest·Mockito·JSONassert·JsonPath·Awaitility를 한 번에 가져온다. Spring 프로젝트는 대부분 이 번들로 시작한다.

| 목적 | 대표 라이브러리 |
|------|-----------------|
| 테스트 프레임워크 | JUnit Jupiter, TestNG, Spock |
| 단언(Assertion) | AssertJ, Hamcrest, JUnit 내장 |
| 모킹(Mocking) | Mockito, EasyMock, JMockit |
| 통합/외부 의존성 | Testcontainers, WireMock, MockServer, 임베디드 DB |
| API/REST | REST Assured, Spring MockMvc |
| 특수 목적 | jqwik, Cucumber, ArchUnit, PIT, JMH, Datafaker |
| 커버리지 | [[jacoco]] |

---

## 2. 테스트 프레임워크

테스트의 수명주기·발견·실행을 담당하는 런너다.

- **JUnit Jupiter(5+, 최신 6.x)**: 사실상 표준이다. 확장 모델(`@ExtendWith`), 매개변수화 테스트([[junit-parameterized-test]]) 등을 제공한다.
- **TestNG**: 그룹(`groups`)·의존(`dependsOnMethods`)·병렬 실행·데이터 프로바이더를 지원한다. 대규모 통합/E2E 스위트에서 쓰인다.
- **Spock**: Groovy 기반 BDD 프레임워크다. `given/when/then` 블록, 데이터 테이블, 내장 모킹을 제공하며 Groovy에 의존한다([[spock]]).

---

## 3. 단언(Assertion)

테스트 결과를 검증하는 표현이며, 라이브러리에 따라 가독성과 실패 메시지 품질이 달라진다.

- **AssertJ**: `assertThat(x).isEqualTo(...).contains(...)` 형태의 fluent 체이닝을 제공한다. 타입별 단언과 상세한 실패 메시지를 지원한다.
- **Hamcrest**: `assertThat(x, is(...))` 형태의 matcher 기반 단언이다. 일부 API(예: MockMvc matcher)에서 사용한다.
- **JUnit Jupiter Assertions**: `assertEquals`·`assertThrows` 등 내장 단언이다. 간단한 검증에 사용한다.
- **Truth**: Google이 만든 AssertJ와 유사한 fluent 단언이다.

---

## 4. 모킹(Mocking)

협력 객체를 가짜로 대체해 단위 테스트를 격리한다. 개념은 [[test-double]].

- **Mockito**: 사실상 표준이다. `mock()`·`when().thenReturn()`·`verify()`를 제공하고, `mockito-junit-jupiter`로 JUnit Jupiter와 연동한다. 5.0부터 기본값인 inline mock maker로 static·final을 모킹한다.
- **EasyMock, JMockit**: 대안 모킹 프레임워크로, record-replay(EasyMock) 등 스타일이 다르다.
- **PowerMock**: Mockito가 과거에 지원하지 않던 static·final·생성자 모킹을 바이트코드 조작으로 제공한다. 최신 Mockito가 상당 부분을 대체해 신규 사용은 줄어드는 추세다.[^1]
- **Spring `@MockitoBean`·`@MockBean`**: Spring 컨텍스트의 빈을 모킹 객체로 교체한다(슬라이스·통합 테스트).

---

## 5. 통합/외부 의존성

실제 또는 그에 준하는 외부 시스템을 띄워 데이터 접근·통합 경로를 검증한다.

- **Testcontainers**: Docker 컨테이너로 실제 DB·메시지 큐·브라우저 등의 일회성(throwaway) 인스턴스를 코드로 띄운다. mock이나 인메모리가 아닌 운영과 동일한 서비스로 테스트하며 매 실행이 알려진 상태에서 시작한다. DAO·애플리케이션 통합 테스트에 쓰이며 PostgreSQL·MySQL·Kafka 등 전용 모듈을 제공한다. 상세는 [[testcontainers]].
- **WireMock**: 외부 HTTP API를 스텁·모킹한다. 응답·지연·실패 시나리오를 정의해 클라이언트 코드를 격리 테스트하며 독립 프로세스·JUnit 확장·컨테이너로 실행한다.
- **MockServer**: 외부 HTTP API를 Expectation으로 모킹하고 수신 요청을 검증한다. JUnit 5 Extension과 Spring Test Listener를 제공하며 프록시로 실제 요청을 기록할 수 있다. 상세는 [[mockserver]].
- **MockWebServer(OkHttp)**: 경량 HTTP 모킹 서버로, 단순 요청/응답 검증에 쓴다. 상세는 [[mockwebserver]].
- **임베디드 DB**: H2(인메모리 RDB), Embedded PostgreSQL 등이다. 빠르지만 운영 DB와 방언 차이가 있어 정합성은 Testcontainers가 우위다.[^2]
- **Embedded Kafka, GreenMail**: 메시징·메일 등 특정 미들웨어를 임베디드로 대체한다.

---

## 6. API/REST 테스트

- **REST Assured**: REST API를 `given().when().then()` DSL로 호출하고 응답 상태·헤더·JSON 본문을 단언한다.
- **Spring MockMvc, WebTestClient**: Spring MVC 컨트롤러를 서블릿 컨테이너 없이(MockMvc), WebFlux 컨트롤러를 논블로킹으로(WebTestClient) 테스트한다.
- **JSONassert**: JSON 문서를 구조적으로 비교한다(순서 무시 등). `spring-boot-starter-test`에 포함된다.

---

## 7. Spring 테스트

- **spring-test, spring-boot-starter-test**: `@SpringBootTest`(전체 컨텍스트), 슬라이스 테스트(`@WebMvcTest`·`@DataJpaTest`·`@JsonTest` 등), `@MockitoBean`을 제공하며 §1의 단언·모킹 라이브러리를 포함한다.
- **spring-batch-test**: 배치 잡·스텝과 스코프 빈을 테스트한다([[batch-testing]]).

---

## 8. 특수 목적

| 분류 | 라이브러리 | 용도 |
|------|------------|------|
| 속성 기반(Property-based) | jqwik | 입력을 무작위 생성해 불변식 검증(예외 케이스 탐색) |
| BDD/명세 | Cucumber, JBehave | Gherkin(`Given/When/Then`) 자연어 시나리오 |
| 계약 테스트(Contract) | Spring Cloud Contract, Pact | 서비스 간 API 계약을 소비자·공급자 양측에서 검증 |
| 아키텍처 테스트 | ArchUnit | 패키지 의존·레이어 규칙을 테스트로 강제 |
| 변이 테스트(Mutation) | PIT(pitest) | 코드를 변이시켜 테스트가 잡아내는지로 테스트 품질 측정 |
| 마이크로벤치마크 | JMH | JIT 워밍업 등을 고려한 성능 측정([[jmh]]) |
| 테스트 데이터 생성 | Datafaker, Instancio, EasyRandom | 무작위·현실적 테스트 객체·필드 생성 |
| 커버리지 | JaCoCo | 실행된 코드 비율 측정([[jacoco]]) |

변이 테스트(PIT)와 커버리지(JaCoCo)는 보완 관계다. 커버리지는 실행 여부를, 변이 테스트는 단언이 결함을 잡는지를 본다.

---

## 9. 전형적 조합

- **단위 테스트**: JUnit Jupiter, AssertJ, Mockito
- **데이터 접근/통합**: 단위 테스트 구성에 Testcontainers(실제 DB) 또는 H2(속도 우선) 추가
- **외부 API 연동**: 단위 테스트 구성에 WireMock 추가
- **Spring**: `spring-boot-starter-test`(§1 구성)와 Testcontainers
- **품질 게이트**: [[jacoco]] 커버리지와 선택적 PIT 변이 테스트

---

## Sources
- [Spring Boot: Test Scope Dependencies](https://docs.spring.io/spring-boot/reference/testing/test-scope-dependencies.html)
- [Testcontainers: Testcontainers for Java](https://java.testcontainers.org/)
- [Testcontainers: Database containers](https://java.testcontainers.org/modules/databases/)
- [Mockito: Mockito framework site](https://site.mockito.org/)
- [AssertJ: Fluent assertions](https://assertj.github.io/doc/)
- [Baeldung: Mockito vs EasyMock vs JMockit](https://www.baeldung.com/mockito-vs-easymock-vs-jmockit)
- [Baeldung: Introduction to WireMock](https://www.baeldung.com/introduction-to-wiremock)
- [MockServer: Running MockServer](https://www.mock-server.com/mock_server/running_mock_server.html)

---

## Related pages
- [[junit-parameterized-test]]
- [[junit-test-suite]]
- [[jacoco]]
- [[spock]]
- [[test-double]]
- [[good-test-practices]]
- [[mockito-doreturn-vs-when]]
- [[jmh]]
- [[mockserver]]

---

[^1]: 출처의 직접 서술이 아니라 최신 Mockito의 static/final 모킹 지원(§4 Mockito 항목)과 PowerMock 유지보수 정체로부터 도출한 주장이다.
[^2]: Testcontainers가 운영과 동일한 실제 DB를 사용한다는 사실(§5 Testcontainers 항목)과 임베디드 DB의 방언 차이로부터 추론한 서술이다.
