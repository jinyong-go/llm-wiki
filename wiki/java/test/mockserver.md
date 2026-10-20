---
title: MockServer
updated: 2026-10-20 17:46:04
tags:
  - java
  - testing
  - junit
  - mock
  - http
---

## 1. 개요

MockServer는 요청이 Expectation(요청 조건과 응답 동작을 묶은 규칙)과 일치하면 지정한 응답을 반환하는 HTTP(S) 목 서버다. 일치하는 Expectation이 없으면 404를 반환한다. 프록시로 동작하면 요청을 실제 서비스로 전달하고 기록한다.

외부 HTTP API를 호출하는 코드를 실제 네트워크 통신으로 테스트할 때 사용한다. 유사 도구로 WireMock이 있다.

## 2. 의존성

| 용도 | artifact |
|---|---|
| JUnit 5 Extension | `mockserver-junit-jupiter-no-dependencies` |
| Spring 테스트 실행 수신기(Test Listener) | `mockserver-spring-test-listener-no-dependencies` |
| 서버 직접 제어 | `mockserver-netty-no-dependencies` |
| 클라이언트 | `mockserver-client-java-no-dependencies` |

groupId는 `org.mock-server`, 최신 버전은 8.0.0이다. `-no-dependencies` artifact는 의존 라이브러리를 패키지 relocate로 내장해 전이 의존성이 없다.

```groovy
testImplementation 'org.mock-server:mockserver-junit-jupiter-no-dependencies:8.0.0'
```

## 3. JUnit 5 통합

### 3.1. 선언

`@ExtendWith(MockServerExtension.class)`와 `@MockServerSettings` 중 하나만 선언한다. `@MockServerSettings`에 Extension이 이미 포함되어 있어 둘을 함께 쓰면 서버가 두 번 기동된다. 옵션이 필요 없으면 `@ExtendWith`, 필요하면 `@MockServerSettings`를 쓴다. 매처는 요청 비교 조건을 뜻한다.

| 속성 | 기본값 | 동작 |
|---|---|---|
| `ports` | `{}` | 비어 있으면 빈 포트에 바인딩 |
| `perTestSuite` | `false` | `true`면 JVM 전체에서 서버 1개 공유, `false`면 테스트 클래스마다 기동·정지 |
| `resetBeforeEach` | `false` | `true`면 테스트 메서드 실행 전에 Expectation, 수신 요청 기록, 로그를 초기화[^1] |

### 3.2. MockServer 클라이언트 주입

`ClientAndServer` 또는 `MockServerClient`를 생성자, 테스트 생명주기 메서드, 테스트 메서드의 매개변수로 받는다. 포트를 지정하지 않았다면 `getPort()`로 실제 포트를 얻는다.

```java
@MockServerSettings(resetBeforeEach = true)
class PaymentClientTest {
    private final ClientAndServer server;
    private final PaymentClient client;

    PaymentClientTest(ClientAndServer server) {
        this.server = server;
        this.client = new PaymentClient("http://localhost:" + server.getPort());
    }
}
```

`resetBeforeEach` 초기화는 `@BeforeEach`보다 먼저 실행된다. 따라서 `@BeforeEach`에서 새로 등록한 Expectation은 해당 테스트에서 유지된다.

### 3.3. 직접 기동

```java
private ClientAndServer mockServer;

@BeforeEach
void start() { mockServer = ClientAndServer.startClientAndServer(); }

@AfterEach
void stop() { mockServer.stop(); }
```

### 3.4. Spring

`@MockServerTest`는 빈 포트로 서버를 기동한다. 각 테스트가 끝나면 서버 상태를 초기화하고 모든 테스트 클래스가 서버 인스턴스를 공유한다. 포트는 `@MockServerPort` 필드나 `${mockServerPort}`로 참조한다. `mockserver.` 접두사 프로퍼티는 MockServer 설정, 나머지는 Spring Environment에 들어간다.

```java
@SpringBootTest
@MockServerTest({
    "payment.url=http://localhost:${mockServerPort}",
    "mockserver.logLevel=WARN"
})
class PaymentServiceTest {
    private MockServerClient mockServerClient;
}
```

## 4. Expectation

요청 매처와 응답을 `when().respond()`로 연결한다.

```java
server
    .when(
        request().withMethod("POST").withPath("/payments")
            .withBody(json("{\"amount\": 1000}"))
    )
    .respond(
        response().withStatusCode(201)
            .withHeader("Content-Type", "application/json")
            .withBody("{\"id\": \"p-1\"}")
    );
```

### 4.1. 요청 매칭

| 매처 | 규칙 |
|---|---|
| `withPath` | 정규식. `.` 등 메타문자는 이스케이프 |
| `withPathParameters` | `/carts/{cartId}` 형식의 경로 파라미터를 정규식으로 비교 |
| `withQueryStringParameter` | 디코딩한 값으로 비교 |
| `withHeader` | 이름은 대소문자 무시, 값은 구분. 지정하지 않은 헤더는 무시 |
| `withBody("...")` | 문자열 전체 일치 |
| `withBody(json(...))` | 기본은 지정한 필드만 비교하며 배열 순서 무시. `MatchType.STRICT`는 추가 필드 불허 |
| `withBody(regex(...))` | 정규식 일치 |

### 4.2. 횟수·유효 시간·우선순위

`when()`의 추가 인자로 매칭 횟수(`Times`), 유효 시간(`TimeToLive`), 우선순위를 지정한다. 우선순위 값이 클수록 먼저 선택되며, 값이 같으면 먼저 등록된 Expectation이 선택된다. 횟수나 유효 시간이 소진된 Expectation은 비활성화된다.

```java
server.when(request().withPath("/token"), Times.exactly(2))
      .respond(response().withBody("t-1"));

// 기본 응답: 다른 Expectation과 일치하지 않을 때 사용
server.when(request(), Times.unlimited(), TimeToLive.unlimited(), -10)
      .respond(response().withStatusCode(503));
```

### 4.3. 응답 액션

`withDelay`는 응답을 지연시켜 클라이언트 타임아웃을 테스트한다. `respond(request -> ...)`는 요청에 따라 응답을 생성한다. `forward`는 실제 호스트로 요청을 전달하고, `error`는 연결 종료 등 네트워크 오류를 재현한다.

```java
server.when(request().withPath("/slow"))
      .respond(response().withBody("ok").withDelay(TimeUnit.SECONDS, 3));
```

## 5. 검증

```java
server.verify(request().withPath("/payments"), VerificationTimes.exactly(1));

// 순서 검증
server.verify(
    request().withPath("/auth"),
    request().withPath("/payments")
);
```

| 메서드 | 기능 |
|---|---|
| `retrieveRecordedRequests(null)` | 수신 요청 조회 |
| `retrieveActiveExpectations(null)` | 활성 Expectation 조회 |
| `clear(매처)` | 일치하는 Expectation과 기록 삭제 |
| `reset()` | 전체 초기화 |

병렬 테스트에서 공유 서버를 사용한다면 경로, 헤더, 쿼리 매개변수 중 하나에 테스트별 고유 값을 넣고 Expectation과 검증 양쪽에서 같은 값을 사용한다. 그래야 다른 테스트의 요청이 매칭되거나 검증 결과에 섞이지 않는다.

```java
String testId = UUID.randomUUID().toString();
HttpRequest request = request().withPath("/payments")
    .withHeader("X-Test-Id", testId);

server.when(request).respond(response().withStatusCode(201));
// 테스트 대상 호출 후 동일한 매처로 요청 횟수 검증
server.verify(request, VerificationTimes.exactly(1));
```

비동기 요청은 테스트 대상이 요청을 보낸 직후 검증하면 아직 기록되지 않았을 수 있다. Java 클라이언트에서는 `verify(request, times, Duration)` 오버로드로 제한 시간 동안 도착 여부를 확인할 수 있다. `retrieveRecordedRequests(null)`은 실패 진단을 위한 수신 요청 조회에 사용한다.

## 6. 주의사항

1. `@ExtendWith(MockServerExtension.class)`와 `@MockServerSettings`를 함께 선언하지 않는다.
2. 기본 설정에서는 Expectation이 같은 클래스의 테스트 사이에 누적된다.
3. 고정 포트를 쓰는 테스트 클래스를 병렬 실행하면 포트가 충돌한다[^2].
4. `perTestSuite = true`와 `@MockServerTest`는 서버를 공유한다. 병렬 실행 시 경로, 헤더, 쿼리 매개변수에 테스트별 고유 값을 사용한다. `@MockServerTest`는 처음 로드된 클래스의 `mockserver.*` 프로퍼티만 적용한다.
5. HTTPS 인증서는 MockServer CA가 서명하므로 클라이언트가 이 CA를 신뢰해야 한다.

## 7. FAQ

### 7.1. 404 응답

Expectation을 등록했는데 404가 반환되면 매칭 실패다. 다음 순서로 확인한다.

1. `retrieveActiveExpectations(null)`로 Expectation이 소진되지 않았는지 확인
2. `retrieveRecordedRequests(null)`로 요청이 도달했는지 확인
3. 로그의 `EXPECTATION_NOT_MATCHED` 이벤트에서 불일치 필드 확인. `ConfigurationProperties.matchersFailFast(false)`를 설정하면 불일치 필드를 모두 출력

주요 원인은 경로 끝 슬래시, `Content-Type`의 `charset` 접미사, `json()` 없이 문자열로 지정한 본문이다. 슬래시는 `/api/users/?`처럼 정규식으로 해결한다.

### 7.2. Expectation 잔존

이전 테스트의 Expectation이 남는 경우 `resetBeforeEach = true`를 설정하거나 `@BeforeEach`에서 `reset()`을 호출한다.

### 7.3. 순차 응답

같은 요청에 다른 응답을 순서대로 반환하려면 같은 매처로 횟수를 제한한 Expectation을 순서대로 등록한다[^3].

```java
server.when(request().withPath("/status"), Times.once())
      .respond(response().withStatusCode(503));
server.when(request().withPath("/status"))
      .respond(response().withStatusCode(200));
```

### 7.4. HTTPS 인증서 오류

MockServer CA를 신뢰하도록 설정한다. CA 인증서는 클래스패스 `/org/mockserver/socket/CertificateAuthorityCertificate.pem`에 있다.

```java
HttpsURLConnection.setDefaultSSLSocketFactory(
    new KeyStoreFactory(new MockServerLogger()).sslContext().getSocketFactory());
```

### 7.5. 로그 과다

로그가 많으면 `mockserver.logLevel=WARN`으로 낮춘다. 매칭을 디버깅할 때는 TRACE로 올린다.

### 7.6. 의존성 충돌

Netty, Jackson 버전이 충돌하면 `-no-dependencies` artifact를 사용한다.

---

## Sources
- [MockServer — Running MockServer](https://www.mock-server.com/mock_server/running_mock_server.html)
- [MockServer — Creating Expectations](https://www.mock-server.com/mock_server/creating_expectations.html)
- [MockServer — Verification](https://www.mock-server.com/mock_server/verification.html)
- [MockServer — MockServer Clients](https://www.mock-server.com/mock_server/mockserver_clients.html)
- [MockServer — Getting Started (Matching Order)](https://www.mock-server.com/mock_server/getting_started.html)
- [MockServer — Troubleshooting Matching](https://www.mock-server.com/mock_server/troubleshooting_matching.html)
- [MockServer — HTTPS & TLS](https://www.mock-server.com/mock_server/HTTPS_TLS.html)
- [MockServer — Running Tests In Parallel](https://www.mock-server.com/mock_server/running_tests_in_parallel.html)
- [MockServer API — MockServerSettings (8.0.0)](https://mock-server.com/versions/8.0.0/apidocs/org/mockserver/junit/jupiter/MockServerSettings.html)
- [MockServer API — Times (8.0.0)](https://mock-server.com/versions/8.0.0/apidocs/org/mockserver/matchers/Times.html)
- [MockServer API — TimeToLive (8.0.0)](https://mock-server.com/versions/8.0.0/apidocs/org/mockserver/matchers/TimeToLive.html)
- [MockServer 소스 — MockServerExtension](https://github.com/mock-server/mockserver-monorepo/blob/master/mockserver/mockserver-junit-jupiter/src/main/java/org/mockserver/junit/jupiter/MockServerExtension.java)
- [MockServer 소스 — MockServer(Netty)](https://github.com/mock-server/mockserver-monorepo/blob/master/mockserver/mockserver-netty/src/main/java/org/mockserver/netty/MockServer.java)

---

## Related pages
- [[java-testing-libraries]]
- [[test-double]]
- [[good-test-practices]]

---

[^1]: `resetBeforeEach`는 5.x API 문서에 없고 7.5.0 문서부터 확인된다. 구버전에서는 `reset()`을 직접 호출한다.
[^2]: 공식 문서에 명시되지 않았다. `perTestSuite = false`이면 테스트 클래스마다 서버를 기동하는 `MockServerExtension` 소스 동작에서 추론했다.
[^3]: Getting Started의 매칭 순서 규칙을 적용한 예시다. 우선순위가 같으면 등록 순서대로 매칭되고 소진된 Expectation은 제외된다.
