---
title: MockWebServer
updated: 2026-10-26 13:27:25
tags:
  - java
  - testing
  - junit
  - mock
  - http
---

## 1. 개요

MockWebServer는 OkHttp 프로젝트가 제공하는 HTTP 클라이언트 테스트용 웹 서버다. 미리 등록한 응답을 반환하고, 수신한 요청을 기록해 검증할 수 있게 한다. 실제 소켓으로 통신하므로 클라이언트의 HTTP 스택 전체가 테스트 범위에 포함된다. 클라이언트가 OkHttp일 필요는 없다.

테스트는 응답 등록, 애플리케이션 코드 실행, 요청 검증 순서로 진행한다. 기본 동작은 등록 순서대로 응답을 꺼내는 큐 방식이며, 요청 조건으로 응답을 고르는 [[mockserver]]의 Expectation과 다르다. 조건별 응답이 필요하면 `Dispatcher`를 구현한다(§4.2).

---

## 2. 의존성

| artifact | 패키지 | 설명 |
|---|---|---|
| `mockwebserver3` | `mockwebserver3` | 코어. JUnit 의존성 없음 |
| `mockwebserver3-junit5` | `mockwebserver3.junit5` | JUnit 5 통합 |
| `mockwebserver` | `okhttp3.mockwebserver` | 구 API |

groupId는 `com.squareup.okhttp3`이며 2026-10-26 기준 최신 버전은 5.5.1이다. 이 문서는 5.x의 `mockwebserver3` API를 기준으로 한다[^1]. 5.0.0부터 좌표와 패키지가 바뀌었고, 구 `okhttp3.mockwebserver` artifact도 계속 배포된다(§6).

```groovy
testImplementation 'com.squareup.okhttp3:mockwebserver3-junit5:5.5.1'
```

---

## 3. 생명주기

### 3.1. @StartStop

`MockWebServer` 필드에 `@StartStop`을 붙이면 확장(Extension)이 서버를 시작하고 종료한다. 인스턴스 필드는 테스트 메서드마다 `beforeEach`에서, static 필드는 테스트 클래스 단위로 `beforeAll`에서 시작된다. 시작한 서버는 JUnit `ExtensionContext.Store`에 저장되며, 해당 범위가 끝날 때 JUnit이 닫는다. 5.5.0부터 `@Nested` 테스트를 지원한다.

```java
class PaymentClientTest {
    @StartStop
    public final MockWebServer server = new MockWebServer();

    PaymentClient client;

    @BeforeEach
    void setUp() {
        client = new PaymentClient(server.url("/").toString());
    }
}
```

확장의 `BeforeEachCallback`이 사용자 `@BeforeEach` 메서드보다 먼저 실행되므로, `@BeforeEach`에서 `url()`을 호출할 수 있다[^2].

### 3.2. 직접 제어

`start()`는 기본적으로 `localhost`의 빈 포트(port 0)에 바인딩한다. 고정 포트를 쓰면 포트를 사용할 수 없을 때 테스트가 불안정해지므로 port 0이 권장된다. `close()`로 종료한 인스턴스는 다시 사용할 수 없다. 인스턴스 생성 비용이 작아 테스트마다 새로 만든다.

```java
private MockWebServer server;

@BeforeEach
void start() throws IOException {
    server = new MockWebServer();
    server.start();
}

@AfterEach
void stop() { server.close(); }
```

`port`, `url()` 등의 접근자는 서버가 시작되지 않았으면 `IllegalStateException`을 던진다. 4.x에서는 이 접근자가 서버를 자동으로 시작했다.

---

## 4. 응답

### 4.1. MockResponse

`MockResponse`는 불변 객체이며 Java에서는 `MockResponse.Builder`로 생성한다. 기본값은 상태 코드 200과 빈 본문이다.

```java
server.enqueue(new MockResponse.Builder()
    .code(201)
    .addHeader("Content-Type", "application/json; charset=utf-8")
    .body("{\"id\": \"p-1\"}")
    .build());
```

`enqueue()`된 응답은 요청 도착 순서대로 하나씩 소비된다. 같은 응답이 여러 번 필요하면 그 수만큼 등록한다.

### 4.2. Dispatcher

`Dispatcher.dispatch(RecordedRequest)`를 구현해 요청 내용에 따라 응답을 결정한다. 기본 구현체는 큐 방식의 `QueueDispatcher`다. Dispatcher를 교체한 뒤 `enqueue()`를 호출하면 `ClassCastException`이 발생한다.

```java
server.setDispatcher(new Dispatcher() {
    @Override
    public MockResponse dispatch(RecordedRequest request) {
        switch (request.getUrl().encodedPath()) {
            case "/v1/token":
                return new MockResponse.Builder().body("t-1").build();
            case "/v1/payments":
                return new MockResponse.Builder().code(201).build();
            default:
                return new MockResponse.Builder().code(404).build();
        }
    }
});
```

`dispatch()`는 블로킹이 허용된다. 따라서 `CountDownLatch` 등으로 응답 시점을 제어할 수 있다.

### 4.3. 지연·장애

| 메서드 | 동작 |
|---|---|
| `headersDelay(delay, unit)` | 응답 헤더 전송 지연 |
| `bodyDelay(delay, unit)` | 응답 본문 전송 지연. 헤더는 영향 없음 |
| `throttleBody(bytes, period, unit)` | `bytes`만큼 전송할 때마다 `period`만큼 대기. 느린 네트워크 재현 |
| `onRequestStart`, `onRequestBody`, `onResponseStart`, `onResponseBody`, `onResponseEnd` | 해당 시점에 `SocketEffect` 적용 |
| `failHandshake()` | TLS 핸드셰이크 실패 |

`SocketEffect`의 종류는 다음과 같다.

| SocketEffect | HTTP/1 | HTTP/2 |
|---|---|---|
| `CloseSocket` | TCP 소켓 종료, 입출력 shutdown 선택 | 동일 |
| `ShutdownConnection` | 소켓 종료 | 응답 후 GOAWAY 전송 |
| `CloseStream(errorCode)` | 소켓 종료 | 스트림에 에러 코드 전송 |
| `Stall` | 처리 중단 | 동일 |

```java
// 읽기 타임아웃 테스트
server.enqueue(new MockResponse.Builder()
    .body("ok")
    .headersDelay(3, TimeUnit.SECONDS)
    .build());

// 응답 도중 연결 끊김
server.enqueue(new MockResponse.Builder()
    .onResponseStart(SocketEffect.ShutdownConnection.INSTANCE)
    .build());
```

---

## 5. 요청 검증

`takeRequest()`는 수신한 요청을 도착 순서대로 꺼낸다. 요청이 없으면 계속 블로킹되므로, 요청이 오지 않을 수 있는 테스트에서는 `takeRequest(timeout, unit)`을 사용한다. 이 오버로드는 시간 내에 요청이 없으면 `null`을 반환한다.

```java
RecordedRequest request = server.takeRequest(1, TimeUnit.SECONDS);
assertEquals("POST", request.getMethod());
assertEquals("/v1/payments", request.getUrl().encodedPath());
assertEquals("application/json; charset=utf-8", request.getHeaders().get("Content-Type"));
assertEquals("{\"amount\":1000}", request.getBody().utf8());
assertEquals(1, server.getRequestCount());
```

| 속성 | 내용 |
|---|---|
| `method` | `GET`, `POST` 등 |
| `target` | 요청 대상. 보통 경로(쿼리 포함)이고, 프록시 요청에서는 절대 URL 또는 `host:port` |
| `version` | `HTTP/1.1`, `HTTP/2` 등 |
| `requestLine` | `method target version` 형식 문자열 |
| `url` | 요청 라인, `Host` 헤더, 로컬 호스트명으로 구성한 `HttpUrl` |
| `headers` | 전체 헤더 |
| `body` | `ByteString`. 본문이 없으면 `null`. `bodyLimit`를 넘으면 잘림 |
| `bodySize` | 잘리기 전 본문 크기 |
| `chunkSizes` | chunked 인코딩의 청크 크기 목록. chunked가 아니면 `null` |
| `connectionIndex`, `exchangeIndex` | 연결 번호와 연결 내 교환 번호. 커넥션 재사용 검증에 사용 |
| `handshake`, `handshakeServerNames` | TLS 핸드셰이크 정보와 SNI |

---

## 6. 4.x API와 차이

5.x의 `mockwebserver3`는 구 `okhttp3.mockwebserver`와 비교해 다음이 바뀌었다.

| 항목 | 4.x (`okhttp3.mockwebserver`) | 5.x (`mockwebserver3`) |
|---|---|---|
| `MockResponse` | 가변 객체, setter 체인 | 불변 객체, `Builder` |
| 요청 대상 | `path` | `target` |
| 요청 라인 | `requestLine` 문자열 | `method`, `target`, `version` 분리 |
| 요청 본문 | 가변 `Buffer` | 불변 `ByteString?` |
| 소켓 동작 | `SocketPolicy` | `SocketEffect` + 시점별 메서드 |
| 순번 | `sequenceNumber` | `exchangeIndex`, `connectionIndex` |
| 접근자 호출 | 서버 자동 시작 | 미시작 시 `IllegalStateException` |
| JUnit 5 | `MockWebServerExtension` 파라미터 주입(5.0 알파 버전) | `@StartStop` |

---

## 7. HTTPS

`okhttp-tls` 모듈의 `HeldCertificate`로 인증서를 만들고, `HandshakeCertificates`로 서버와 클라이언트의 `SSLSocketFactory`를 구성한다. 클라이언트가 테스트용 인증서만 신뢰하도록 설정하므로 `HostnameVerifier`나 `X509TrustManager`를 비활성화할 필요가 없다.

```java
HeldCertificate localhost = new HeldCertificate.Builder()
    .addSubjectAlternativeName("localhost")
    .build();
HandshakeCertificates serverCerts = new HandshakeCertificates.Builder()
    .heldCertificate(localhost)
    .build();
server.useHttps(serverCerts.sslSocketFactory());

HandshakeCertificates clientCerts = new HandshakeCertificates.Builder()
    .addTrustedCertificate(localhost.certificate())
    .build();
OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(clientCerts.sslSocketFactory(), clientCerts.trustManager())
    .build();
```

클라이언트 인증서 요청은 `requestClientAuth()`, 강제는 `requireClientAuth()`로 설정한다. ALPN(Application-Layer Protocol Negotiation)으로 협상할 프로토콜은 `protocols`로 지정하며 기본값은 `[HTTP_2, HTTP_1_1]`이다.

---

## 8. FAQ

### 8.1. 테스트 멈춤

등록된 응답보다 요청이 많으면 `QueueDispatcher`가 다음 응답을 기다리며 블로킹된다. 그 결과 클라이언트는 읽기 타임아웃이 날 때까지 대기한다. `((QueueDispatcher) server.getDispatcher()).setFailFast(true)`를 설정하면 큐가 비었을 때 즉시 404를 반환한다. 마찬가지로 요청이 오지 않았는데 `takeRequest()`를 호출하면 무한 대기한다(§5).

### 8.2. 응답 순서 불일치

병렬 요청이나 재시도가 있으면 요청 도착 순서가 `enqueue()` 순서와 달라질 수 있다. 이 경우 경로 기반 `Dispatcher`(§4.2)를 사용한다.

### 8.3. Spring

Spring Framework 레퍼런스는 `WebClient` 테스트용 목 서버로 OkHttp MockWebServer와 WireMock을 제시한다. 클라이언트의 base URL에 `server.url("/")`을 지정해 사용한다.

---

## Sources
- [square/okhttp: MockWebServer README](https://github.com/square/okhttp/blob/master/mockwebserver/README.md)
- [square/okhttp: MockWebServer for JUnit 5 README](https://github.com/square/okhttp/blob/master/mockwebserver-junit5/README.md)
- [square/okhttp: CHANGELOG](https://github.com/square/okhttp/blob/master/CHANGELOG.md)
- [square/okhttp: okhttp-tls README](https://github.com/square/okhttp/blob/master/okhttp-tls/README.md)
- [square/okhttp: mockwebserver3 소스 (parent-5.5.1)](https://github.com/square/okhttp/tree/parent-5.5.1/mockwebserver/src/main/kotlin/mockwebserver3)
- [square/okhttp: StartStopExtension 소스 (parent-5.5.1)](https://github.com/square/okhttp/blob/parent-5.5.1/mockwebserver-junit5/src/main/kotlin/mockwebserver3/junit5/internal/StartStopExtension.kt)
- [Maven Central: mockwebserver3 maven-metadata](https://repo1.maven.org/maven2/com/squareup/okhttp3/mockwebserver3/maven-metadata.xml)
- [Spring Framework: WebClient Testing](https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-testing.html)

---

## Related pages
- [[mockserver]]
- [[java-testing-libraries]]
- [[test-double]]

---

[^1]: 공식 MockWebServer README는 의존성으로 `mockwebserver3:5.5.1`을 안내하지만, Java 예시는 `getBody().readUtf8()`과 `okhttp3.mockwebserver.Dispatcher` import 등 4.x API를 사용한다. okhttp-tls README도 4.x 시그니처인 `useHttps(sslSocketFactory, false)`를 사용한다. 이 문서의 예시는 5.5.1 소스의 시그니처(`getBody().utf8()`, `useHttps(sslSocketFactory)`)를 따랐다.
[^2]: 공식 문서에 명시되지 않았다. JUnit 5가 확장의 `BeforeEachCallback`을 사용자 `@BeforeEach` 메서드보다 먼저 실행하는 규칙에서 추론했다.
