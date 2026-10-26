---
title: Testcontainers
updated: 2026-10-26 14:23:30
tags:
  - java
  - testing
  - junit
  - docker
  - spring
---

## 1. 개요

Testcontainers는 테스트 코드에서 Docker 컨테이너의 생성, 시작, 정리를 관리하는 Java 라이브러리다. 데이터베이스(Database, DB), 메시지 브로커 등 외부 의존 서비스를 컨테이너로 실행해 통합 테스트에 사용한다. 컨테이너의 실행 범위는 생명주기 관리 방식에 따라 달라진다.

테스트에 필요한 서비스를 로컬에 별도로 설치하지 않아도 된다. 컨테이너의 노출 포트는 기본적으로 사용 가능한 호스트 포트에 무작위로 매핑된다.

---

## 2. 환경 구성

### 2.1. 실행 환경

실행하려면 Docker API와 호환되는 컨테이너 런타임이 필요하다. Linux의 Docker와 Mac·Windows의 Docker Desktop은 별도 설정 없이 자동 감지된다. Colima, Podman 같은 대체 런타임은 `DOCKER_HOST` 등의 환경변수를 설정해야 할 수 있다(§2.3, [[docker-overview]]).

### 2.2. 의존성

groupId는 `org.testcontainers`다. 이 문서의 API와 예시는 2.0.5를 기준으로 한다. 2.0부터 서비스 모듈과 JUnit 통합 모듈의 artifact 이름에 `testcontainers-` 접두사가 붙는다. 주요 변경은 §9에서 다룬다.

| artifact | 용도 |
|---|---|
| `testcontainers` | 코어. `GenericContainer`, 대기 전략, 네트워크 |
| `testcontainers-junit-jupiter` | JUnit 5 확장(§4.2) |
| `testcontainers-postgresql`, `testcontainers-mysql`, `testcontainers-kafka` 등 | 서비스별 전용 모듈 |
| `testcontainers-bom` | 모듈 버전 일괄 관리 |

```groovy
testImplementation platform('org.testcontainers:testcontainers-bom:2.0.5')
testImplementation 'org.testcontainers:testcontainers-junit-jupiter'
testImplementation 'org.testcontainers:testcontainers-postgresql'
```

### 2.3. 설정

일반 설정은 다음 순서로 우선 적용한다. Docker 연결 설정에는 `DOCKER_HOST` 같은 별도 환경변수도 사용한다.

1. 환경변수
2. 사용자 홈의 `~/.testcontainers.properties`
3. 클래스패스의 `testcontainers.properties`

일반 설정의 환경변수 이름은 프로퍼티 키를 대문자로 바꾸고 `.`을 `_`로 바꾼 뒤 `TESTCONTAINERS_` 접두사를 붙인다. 예를 들어 `checks.disable`은 `TESTCONTAINERS_CHECKS_DISABLE`이 된다.

| 프로퍼티 | 동작 |
|---|---|
| `checks.disable` | 시작 전 환경 점검 생략 |
| `hub.image.name.prefix` | Docker Hub 이미지 이름에 레지스트리 접두사 추가(§10.2) |
| `ryuk.container.privileged` | Ryuk privileged 실행 여부(§4.5) |
| `docker.host` | `DOCKER_HOST`와 동일 |

| 환경변수 | 동작 |
|---|---|
| `DOCKER_HOST` | Docker API 접속 주소 |
| `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE` | Ryuk 등이 사용하는 Docker 소켓 경로 |
| `TESTCONTAINERS_HOST_OVERRIDE` | `getHost()`가 반환할 호스트 |

---

## 3. 컨테이너 정의

### 3.1. GenericContainer

`GenericContainer`는 지정한 Docker 이미지로 컨테이너를 구성한다. 예시에서는 `DockerImageName.parse()`로 이미지 이름을 지정한다. 무인자 생성자는 deprecated다.

```java
GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
    .withExposedPorts(6379)
    .withEnv("TZ", "Asia/Seoul");
```

### 3.2. 모듈 컨테이너

전용 모듈은 서비스별 기본 설정, 대기 전략, 접속 정보 메서드를 제공한다. 2.0부터 컨테이너 클래스의 패키지는 `org.testcontainers.<모듈명>`이다. 예를 들어 `PostgreSQLContainer`는 `org.testcontainers.postgresql`에 있다.

```java
PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
postgres.start();
String url = postgres.getJdbcUrl();        // 실제 호스트와 매핑 포트를 포함한 JDBC URL
String user = postgres.getUsername();      // 기본값 test
String password = postgres.getPassword();  // 기본값 test
```

---

## 4. 생명주기

### 4.1. 직접 제어

`start()`와 `stop()`으로 직접 제어할 수 있다. 컨테이너 클래스는 `AutoCloseable`을 구현하므로 try-with-resources로 사용할 수 있다.

### 4.2. JUnit 5

테스트 클래스에 `@Testcontainers`를 선언하면 JUnit 확장이 `@Container` 필드의 시작과 종료를 관리한다. static 필드는 클래스의 테스트 메서드 사이에서 공유하고, 인스턴스 필드는 테스트 메서드마다 시작하고 종료한다[^1].

| 필드 | 시작 | 종료 |
|---|---|---|
| static | 클래스의 첫 테스트 전 1회 | 클래스의 마지막 테스트 후 |
| 인스턴스 | 테스트 메서드마다 | 테스트 메서드마다 |

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class OrderRepositoryTest {
    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));

    @Test
    void query() throws SQLException {
        try (Connection conn = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement statement = conn.createStatement();
             ResultSet result = statement.executeQuery("SELECT 1")) {
            assertTrue(result.next());
            assertEquals(1, result.getInt(1));
        }
    }
}
```

Java 버전에 따른 `@Nested` 클래스의 static 필드 선언 제약은 각주를 참고한다[^2].

| 속성 | 동작 |
|---|---|
| `disabledWithoutDocker` | `true`면 Docker가 없을 때 실패 대신 테스트를 건너뜀 |
| `parallel` | `true`면 컨테이너들을 순차가 아닌 병렬로 시작 |

`parallel = true`는 여러 컨테이너의 시작을 병렬화한다. 테스트 메서드를 병렬 실행하는 옵션은 아니다. JUnit 확장은 순차 테스트 실행에서만 검증되었으며 테스트 병렬 실행은 지원하지 않는다.

### 4.3. 싱글턴

`@Container` static 필드는 테스트 클래스 단위로 컨테이너를 재시작한다. 여러 테스트 클래스가 컨테이너 하나를 공유하려면 추상 기반 클래스의 static 초기화 블록에서 직접 시작한다. 이렇게 하면 기반 클래스가 로드될 때 한 번만 시작된다. 이 컨테이너에는 `@Container`를 붙이지 않으며, 테스트가 끝난 뒤의 정리는 Ryuk(§4.5)가 맡는다.

```java
abstract class AbstractIntegrationTest {
    static final PostgreSQLContainer POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
        POSTGRES.start();
    }
}

class OrderRepositoryTest extends AbstractIntegrationTest { }
```

### 4.4. 재사용

`withReuse(true)`로 표시한 컨테이너는 테스트가 끝나도 종료되지 않는다. 다음 실행에서 설정이 같으면 그 컨테이너를 다시 사용한다. 이 기능은 실험적이며 지속적 통합(Continuous Integration, CI)용이 아니다. 사용하려면 다음을 모두 지켜야 한다.

- `TESTCONTAINERS_REUSE_ENABLE=true` 환경변수 또는 `~/.testcontainers.properties`의 `testcontainers.reuse.enable=true`로 활성화한다. 클래스패스의 properties 파일로는 활성화되지 않는다.
- `start()`로 직접 시작하고 `stop()`을 호출하지 않는다. try-with-resources나 JUnit 확장도 사용하지 않는다.

### 4.5. 정리

Testcontainers는 첫 컨테이너를 시작할 때 Ryuk 컨테이너도 함께 띄운다. Ryuk는 자바 가상 머신(Java Virtual Machine, JVM)이 종료되면 이번 세션에서 만든 컨테이너, 네트워크, 볼륨을 정리한다.

Ryuk는 privileged 컨테이너로 실행된다. privileged 컨테이너를 허용하지 않는 환경에서는 `TESTCONTAINERS_RYUK_DISABLED=true`로 끌 수 있으며, 이 경우에도 JVM 종료 시점의 정리는 수행된다. 단, `kill -9`로 종료하면 정리되지 않는다.

---

## 5. 대기 전략

`start()`는 컨테이너가 실행 상태에 도달하고 대기 전략이 만족될 때까지 블로킹된다. 기본 대기 전략은 첫 번째 매핑 포트가 연결을 받을 때까지 최대 60초 기다리는 것이다. 제한 시간은 `withStartupTimeout()`으로 바꾸고, 다른 조건이 필요하면 `waitingFor()`에 `Wait`의 팩터리 메서드로 만든 전략을 지정한다.

| 전략 | 조건 |
|---|---|
| `Wait.forListeningPort()` | 노출 포트가 연결 수락 |
| `Wait.forHttp(path)` | HTTP 응답 상태 코드. `forStatusCode`, `forStatusCodeMatching`, `usingTls` |
| `Wait.forLogMessage(regex, times)` | 로그에 정규식이 지정 횟수만큼 출력 |
| `Wait.forHealthcheck()` | Docker HEALTHCHECK 결과가 `healthy` |

```java
GenericContainer<?> nginx = new GenericContainer<>(DockerImageName.parse("nginx:1.27-alpine"))
    .withExposedPorts(80)
    .waitingFor(Wait.forHttp("/").forStatusCode(200))
    .withStartupTimeout(Duration.ofSeconds(90));
```

실행 상태를 판정하는 시작 확인 전략(`StartupCheckStrategy`)은 대기 전략과 별개다. 기본값인 `IsRunningStartupCheckStrategy`는 컨테이너가 실행 중인지만 확인한다. 한 번 실행하고 종료하는 컨테이너에는 종료 코드 0을 성공으로 판정하는 `OneShotStartupCheckStrategy`를 쓴다.

`dependsOn(other)`를 지정하면 다른 컨테이너가 준비된 뒤에 시작한다.

---

## 6. 네트워크

### 6.1. 포트 매핑

`withExposedPorts()`에 지정하는 포트는 컨테이너 내부 포트다. 호스트 쪽에는 빈 포트가 무작위로 매핑되므로, 실제 포트는 컨테이너가 실행된 뒤 `getMappedPort(내부포트)`로 조회한다. 노출 포트가 하나뿐이면 `getFirstMappedPort()`를 쓸 수 있다. 호스트 주소는 `localhost`로 하드코딩하지 말고 `getHost()`로 얻는다. CI 환경에 따라 컨테이너가 다른 호스트에 있을 수 있기 때문이다.

```java
String address = redis.getHost() + ":" + redis.getMappedPort(6379);
```

### 6.2. 호스트 포트 노출

컨테이너가 호스트에서 실행 중인 서버에 접속해야 하면 `Testcontainers.exposeHostPorts(port)`를 호출한다. 이 호출은 호스트 서버가 시작된 뒤, 컨테이너가 시작되기 전에 해야 한다. 컨테이너에서는 `host.testcontainers.internal:<port>`로 접근한다.

### 6.3. 컨테이너 간 통신

`Network.newNetwork()`로 만든 네트워크에 여러 컨테이너를 연결하면, 호스트 포트를 거치지 않고 네트워크 별칭으로 서로 통신한다. 하나의 컨테이너는 네트워크 하나에만 연결할 수 있다.

```java
Network network = Network.newNetwork();
GenericContainer<?> cache = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
    .withNetwork(network)
    .withNetworkAliases("cache");
// 같은 네트워크의 다른 컨테이너는 cache:6379로 접속
```

---

## 7. JDBC URL

Java Database Connectivity(JDBC) URL에 `tc:`와 이미지 태그를 지정하면 연결 시점에 Testcontainers가 데이터베이스 컨테이너를 시작한다. 컨테이너 객체를 직접 생성할 필요는 없다. 해당 Testcontainers 모듈과 JDBC 드라이버는 런타임 클래스패스에 있어야 한다.

URL의 호스트와 포트 대신 컨테이너의 실제 접속 주소를 사용한다. PostgreSQL에서는 URL의 데이터베이스 이름도 컨테이너 설정에 반영된다[^3].

```properties
# 원래 URL: jdbc:postgresql://localhost:5432/app
spring.datasource.url=jdbc:tc:postgresql:16-alpine:///app
```

| 파라미터 | 동작 |
|---|---|
| `TC_INITSCRIPT=path` | 컨테이너 시작 후 클래스패스 SQL 스크립트 실행. `file:` 접두사면 파일 경로 |
| `TC_INITFUNCTION=Class::method` | `Connection`을 인자로 받는 public static 메서드 실행 |
| `TC_DAEMON=true` | 마지막 연결이 닫혀도 컨테이너 유지. 기본은 종료 |
| `TC_TMPFS=/path:rw` | tmpfs 마운트로 데이터를 메모리에 저장 |
| `TC_REUSABLE=true` | 재사용 컨테이너(§4.4) |

---

## 8. Spring Boot

### 8.1. 컨테이너 관리

JUnit 확장이 관리하는 컨테이너는 테스트 클래스나 메서드가 끝날 때 종료된다. Spring TestContext 프레임워크는 그보다 오래 `ApplicationContext`를 캐시할 수 있다. 캐시된 컨텍스트가 이미 종료된 컨테이너에 의존하면 후속 테스트나 빈 소멸 콜백이 실패할 수 있다.

컨텍스트를 재사용하는 동안 컨테이너도 유지해야 한다면 테스트 설정의 `@Bean`으로 등록한다. Spring Boot가 컨테이너의 시작과 종료를 관리한다.

```java
@TestConfiguration(proxyBeanMethods = false)
class ContainersConfig {
    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
    }
}

@SpringBootTest
@Import(ContainersConfig.class)
class OrderServiceTest { }
```

### 8.2. 서비스 연결

`spring-boot-testcontainers`를 추가하고 컨테이너 필드나 `@Bean` 메서드에 `@ServiceConnection`을 붙인다. 그러면 Spring Boot가 컨테이너 접속 정보로 `ConnectionDetails` 빈을 만들고, 이 빈이 `spring.datasource.url` 같은 연결 설정 프로퍼티보다 우선한다. 예를 들어 `PostgreSQLContainer`로는 `JdbcConnectionDetails`와 `R2dbcConnectionDetails`가 만들어진다.

```java
@Testcontainers
@SpringBootTest
class OrderServiceTest {
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
}
```

Spring Boot는 컨테이너 타입이나 이미지 저장소 이름으로 연결 정보의 종류를 판단한다. static 필드는 컨테이너 인스턴스에서 이미지 이름을 확인할 수 있다. `@Bean` 메서드는 조기 초기화를 피하기 위해 호출하지 않고 반환 타입으로 판단한다.

반환 타입이 `GenericContainer`인 빈 메서드에서는 `@ServiceConnection(name = "redis")`처럼 서비스 이름을 지정한다. 사용자 정의 이미지의 저장소 이름으로 서비스를 식별할 수 없는 경우에도 `name`으로 연결 정보의 종류를 지정할 수 있다.

### 8.3. 동적 프로퍼티

`@ServiceConnection`이 지원하지 않는 서비스나 프로퍼티에는 `@DynamicPropertySource`로 컨테이너 값을 프로퍼티에 등록한다.

```java
@DynamicPropertySource
static void properties(DynamicPropertyRegistry registry) {
    registry.add("payment.url", () -> "http://" + api.getHost() + ":" + api.getFirstMappedPort());
}
```

---

## 9. API 변경

2.0.0의 주요 변경은 다음과 같다.

| 항목 | 1.x | 2.x |
|---|---|---|
| 모듈 artifact | `postgresql`, `junit-jupiter` | `testcontainers-postgresql`, `testcontainers-junit-jupiter` |
| 컨테이너 패키지 | `org.testcontainers.containers` | `org.testcontainers.<모듈명>` |
| 모듈 기본 생성자 | 기본 이미지 사용 | 제거. 이미지 지정 필수 |

1.x 패키지의 `org.testcontainers.containers.PostgreSQLContainer`는 2.0.5에도 남아 있지만 deprecated다.

---

## 10. FAQ

### 10.1. Docker 환경 감지 실패

`Could not find a valid Docker environment`는 Testcontainers가 컨테이너 런타임에 접속하지 못했을 때 발생한다. 다음 순서로 확인한다.

1. 컨테이너 런타임이 실행 중인지 확인한다.
2. macOS Docker Desktop에서 `/var/run/docker.sock`이 없으면 Settings > Advanced의 "Allow the default Docker socket to be used"를 활성화한다.
3. Colima, Podman 같은 대체 런타임은 §2.3의 환경변수를 설정한다.
4. Docker Engine 버전과 Testcontainers 버전의 호환성을 확인한다.

Docker Engine 29.0은 데몬이 받아들이는 최소 API 버전을 1.44로 올렸다. 이 때문에 더 낮은 API 버전으로 요청하는 Testcontainers는 `client version ... is too old` 응답을 받고 환경 감지에 실패한다[^4]. Testcontainers 2.0.2는 기본 API 버전을 1.44로 올렸고, 1.21.4는 1.x에서 같은 호환성 문제를 수정했다. 2.0.3은 오래된 Docker Engine에서는 1.32로 대체하도록 수정했다. Docker Engine 29.3.0은 최소 API 버전을 다시 1.40으로 낮췄다.

### 10.2. Docker Hub 요청 제한

Docker Hub는 이미지 pull 횟수를 제한한다. 테스트가 쓰는 이미지 외에도 Testcontainers 자체가 `testcontainers/ryuk`, `alpine`(시작 점검), `testcontainers/sshd`(§6.2 호스트 포트 노출)를 pull한다. 사설 레지스트리에 미러를 두고 `hub.image.name.prefix`(§2.3)를 설정하면 Docker Hub 이미지 이름에 접두사가 붙는다. 코드의 이미지 이름은 바꾸지 않아도 된다.

```properties
# ~/.testcontainers.properties
hub.image.name.prefix=registry.mycompany.com/mirror/
```

### 10.3. 컨테이너 안에서 테스트 실행

CI에서 테스트를 컨테이너 안에서 실행하면, 테스트 컨테이너가 Docker 소켓을 통해 호스트 Docker에 형제(sibling) 컨테이너를 만든다. Testcontainers는 자신이 컨테이너 안에 있음을 감지하면 `localhost` 대신 기본 게이트웨이 IP를 사용한다.

- Docker 소켓을 볼륨으로 마운트한다.
- 파일을 마운트하는 기능을 쓰면 소스 디렉터리를 같은 경로로 마운트한다.
- Docker Desktop에서는 `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal`을 설정한다.

```bash
docker run --rm -v $PWD:$PWD -w $PWD \
  -v /var/run/docker.sock:/var/run/docker.sock maven:3 mvn test
```

privileged 컨테이너를 허용하지 않는 CI라서 Ryuk가 시작되지 않으면 §4.5에 따라 Ryuk를 끈다. 이 경우 비정상 종료 시 남은 컨테이너는 CI 환경에서 정리해야 한다.

### 10.4. 시작 타임아웃

기본 대기 시간 60초 안에 대기 전략(§5)이 만족되지 않으면 컨테이너 시작이 실패한다. 이미지 pull이나 초기화가 느린 환경에서는 `withStartupTimeout()`으로 대기 시간을 늘린다. 포트는 열렸지만 서비스가 아직 준비되지 않은 경우에는 로그나 HTTP 기반 대기 전략으로 바꾼다. 참고로 `PostgreSQLContainer`의 기본 대기 전략은 `database system is ready to accept connections` 로그가 두 번 출력될 때까지 기다린다.

### 10.5. 연결 거부

- 테스트 클래스가 바뀐 뒤 Spring 테스트에서 연결 거부가 발생하면, 캐시된 컨텍스트가 이미 종료된 컨테이너를 참조하는 경우다(§8.1).
- 코드에 `localhost:5432` 같은 고정 주소를 쓰면 연결이 거부된다. 접속 주소는 `getHost()`와 `getMappedPort()`로 얻는다(§6.1).

---

## Sources
- [Testcontainers for Java](https://java.testcontainers.org/)
- [Testcontainers: JUnit 5 Quickstart](https://java.testcontainers.org/quickstart/junit_5_quickstart/)
- [Testcontainers: Jupiter / JUnit 5](https://java.testcontainers.org/test_framework_integration/junit_5/)
- [Testcontainers: Manual container lifecycle control](https://java.testcontainers.org/test_framework_integration/manual_lifecycle_control/)
- [Testcontainers: Creating a container](https://java.testcontainers.org/features/creating_container/)
- [Testcontainers: Networking and communicating with containers](https://java.testcontainers.org/features/networking/)
- [Testcontainers: Waiting for containers to start or be ready](https://java.testcontainers.org/features/startup_and_waits/)
- [Testcontainers: Reusable Containers](https://java.testcontainers.org/features/reuse/)
- [Testcontainers: Custom configuration](https://java.testcontainers.org/features/configuration/)
- [Testcontainers: JDBC support](https://java.testcontainers.org/modules/databases/jdbc/)
- [Testcontainers: Postgres Module](https://java.testcontainers.org/modules/databases/postgres/)
- [Testcontainers: General Container runtime requirements](https://java.testcontainers.org/supported_docker_environment/)
- [testcontainers-java: Release 2.0.0](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.0)
- [testcontainers-java: PostgreSQLContainer 소스 (2.0.5)](https://github.com/testcontainers/testcontainers-java/blob/2.0.5/modules/postgresql/src/main/java/org/testcontainers/postgresql/PostgreSQLContainer.java)
- [Maven Central: testcontainers maven-metadata](https://repo1.maven.org/maven2/org/testcontainers/testcontainers/maven-metadata.xml)
- [Spring Boot: Testcontainers](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html)
- [testcontainers-java: GenericContainer 소스 (2.0.5)](https://github.com/testcontainers/testcontainers-java/blob/2.0.5/core/src/main/java/org/testcontainers/containers/GenericContainer.java)
- [testcontainers-java: PostgreSQLContainerProvider 소스 (2.0.5)](https://github.com/testcontainers/testcontainers-java/blob/2.0.5/modules/postgresql/src/main/java/org/testcontainers/containers/PostgreSQLContainerProvider.java)
- [testcontainers-java: JdbcDatabaseContainerProvider 소스 (2.0.5)](https://github.com/testcontainers/testcontainers-java/blob/2.0.5/modules/jdbc/src/main/java/org/testcontainers/containers/JdbcDatabaseContainerProvider.java)
- [Oracle: Java Language Specification §8.1.3](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.1.3)
- [Testcontainers: Image Registry rate limiting](https://java.testcontainers.org/supported_docker_environment/image_registry_rate_limiting/)
- [Testcontainers: Image name substitution](https://java.testcontainers.org/features/image_name_substitution/)
- [Testcontainers: Patterns for running tests inside a Docker container](https://java.testcontainers.org/supported_docker_environment/continuous_integration/dind_patterns/)
- [testcontainers-java: Release 2.0.2](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.2)
- [testcontainers-java: Release 2.0.3](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.3)
- [testcontainers-java: Release 1.21.4](https://github.com/testcontainers/testcontainers-java/releases/tag/1.21.4)
- [Docker: Docker Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/)
- [Docker: Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [Red Hat: ELY-2969](https://issues.redhat.com/browse/ELY-2969)
- [Docker Community Forums: TestContainer stopped working after updating Docker Desktop to v4.56.0](https://forums.docker.com/t/testcontainer-stopped-working-after-updating-docker-desktop-to-v4-56-0/150823)

---

## Related pages
- [[java-testing-libraries]]
- [[docker-overview]]
- [[docker-container]]
- [[mockserver]]
- [[mockwebserver]]

---

[^1]: Creating a container 문서는 인스턴스 필드에 선언한 `@Container` 예시를 두고 클래스의 모든 테스트 전에 시작해 모든 테스트 후에 제거한다고 설명한다. 반면 Jupiter / JUnit 5 문서는 인스턴스 필드를 테스트 메서드마다 시작·종료한다고 설명한다. 이 문서는 확장 동작을 직접 설명하는 Jupiter / JUnit 5 문서를 따랐다.

[^2]: Java 16부터 내부 클래스에 static 멤버를 선언할 수 있다. Java 16 이전에는 상수 변수인 static 멤버만 허용되므로 `@Nested` 클래스 안에 static 컨테이너 필드를 선언할 수 없다.
[^3]: JDBC support 문서는 호스트, 포트, 데이터베이스 이름이 무시된다고 설명한다. 그러나 2.0.5의 PostgreSQLContainerProvider는 공통 구현을 통해 URL의 데이터베이스 이름을 `withDatabaseName()`에 전달한다. 이 문서는 해당 버전의 구현을 따랐다.
[^4]: Testcontainers 릴리스 노트에는 2.0.2에서 기본 API 버전을 1.44로 설정하고 2.0.3에서 1.32로 대체하도록 수정했다는 내용만 있다. 이전 버전이 1.32 등 낮은 API 버전을 사용했다는 점은 Red Hat 이슈 트래커와 Docker 포럼의 오류 보고(`client version 1.32 is too old`)에서 확인했다.
