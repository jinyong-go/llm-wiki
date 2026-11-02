---
title: JPA 테스트
updated: 2026-11-02 22:55:12
tags:
  - java
  - spring
  - jpa
  - testing
---

## 1. 개요

Spring Boot는 JPA(Jakarta Persistence API) 테스트에 필요한 자동설정을 중심으로 구성하는 슬라이스 테스트 어노테이션 `@DataJpaTest`를 제공한다. 슬라이스는 컴포넌트 스캔 대상과 자동설정을 특정 계층으로 제한한다. 전체 애플리케이션 설정이 필요하면 `@SpringBootTest`에 JPA 테스트용 `@AutoConfigure…` 어노테이션을 조합한다(§3.5).

본문의 예제와 패키지는 Spring Boot 4.1과 Spring Framework 7.0 기준이다. Boot 3과의 주요 차이는 §2에 함께 표시한다.

---

## 2. 의존성

Boot 4부터 테스트 지원도 기술별 모듈로 나뉜다. Data JPA 테스트에는 `spring-boot-starter-data-jpa-test`를 추가한다. Boot 3은 `spring-boot-starter-test` 하나에 모든 슬라이스를 포함한다.

```groovy
// Boot 4
testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
testRuntimeOnly 'com.h2database:h2'
```

Boot 4에서 패키지는 다음과 같이 바뀌었다.

| 타입 | Boot 3 | Boot 4 |
|---|---|---|
| `@DataJpaTest` | `org.springframework.boot.test.autoconfigure.orm.jpa` | `org.springframework.boot.data.jpa.test.autoconfigure` |
| `TestEntityManager`, `@AutoConfigureTestEntityManager` | `org.springframework.boot.test.autoconfigure.orm.jpa` | `org.springframework.boot.jpa.test.autoconfigure` |
| `@AutoConfigureTestDatabase` | `org.springframework.boot.test.autoconfigure.jdbc` | `org.springframework.boot.jdbc.test.autoconfigure` |

---

## 3. 설정

### 3.1. @DataJpaTest

`@DataJpaTest`는 `@Entity` 클래스와 Spring Data JPA 리포지터리만 스캔한다. 나머지 빈은 직접 추가해야 한다(§3.2). 테스트 컨텍스트는 다음 메타 어노테이션으로 구성된다.

| 메타 어노테이션 | 역할 |
|---|---|
| `@AutoConfigureDataJpa` | JPA 리포지터리와 Hibernate 자동설정 |
| `@AutoConfigureJdbc` | `DataSource`, 트랜잭션 매니저, `JdbcTemplate` 자동설정과 DB 초기화(§3.4)[^1] |
| `@AutoConfigureTestDatabase` | 임베디드 DB로 `DataSource` 교체(§3.3) |
| `@AutoConfigureTestEntityManager` | `TestEntityManager` 빈 등록(§4) |
| `@Transactional` | 테스트 메서드마다 트랜잭션을 시작하고 종료 시 롤백(§5) |
| `@OverrideAutoConfiguration(enabled = false)` | 그 밖의 자동설정 비활성화 |

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired UserRepository repository;

    @Test
    void findByUsername() {
        em.persistAndFlush(new User("sboot", "1234"));
        em.clear();

        User user = repository.findByUsername("sboot");
        assertThat(user.getEmployeeNumber()).isEqualTo("1234");
    }
}
```

어노테이션 속성으로 테스트 컨텍스트를 조정한다.

| 속성 | 기본값 | 동작 |
|---|---|---|
| `showSql` | `true` | `spring.jpa.show-sql` 매핑 |
| `properties` | `{}` | `key=value` 형식으로 `Environment`에 프로퍼티 추가 |
| `bootstrapMode` | `DEFAULT` | `spring.data.jpa.repositories.bootstrap-mode` 매핑 |
| `includeFilters`, `excludeFilters` | `{}` | 컴포넌트 스캔 필터 추가 |
| `useDefaultFilters` | `true` | 기본 필터 사용 여부 |
| `excludeAutoConfiguration` | `{}` | 자동설정 제외. `@ImportAutoConfiguration(exclude=...)`의 별칭 |

```java
@DataJpaTest(showSql = false, properties = "spring.jpa.properties.hibernate.format_sql=true")
class UserRepositoryTest { }
```

### 3.2. 추가 빈 등록

슬라이스는 일반 `@Component`, `@ConfigurationProperties` 빈과 `@Configuration` 클래스를 스캔하지 않는다. 테스트에 필요한 빈은 다음 방법으로 추가한다.

| 방법 | 대상 |
|---|---|
| `@Import` | `@Configuration` 클래스나 개별 컴포넌트 |
| `@EnableConfigurationProperties` | `@ConfigurationProperties` 빈 |
| `includeFilters` | 스캔 필터로 지정한 컴포넌트 |

```java
@DataJpaTest
@Import({JpaAuditingConfig.class, QuerydslConfig.class})
class OrderRepositoryTest { }
```

슬라이스 테스트는 `@SpringBootApplication` 클래스를 설정 소스로 사용한다. 메인 클래스에 붙인 `@EnableJpaAuditing` 같은 기능별 설정과 `@ComponentScan`은 모든 슬라이스 테스트에 적용된다. 기능별 설정은 메인 클래스와 같은 패키지의 별도 `@Configuration` 클래스로 분리하고, 필요한 테스트에서 `@Import`로 가져온다.

```java
@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
public class JpaAuditingConfig { }
```

### 3.3. 데이터베이스 교체

`@AutoConfigureTestDatabase`는 테스트에서 사용할 `DataSource`를 결정한다. `DataSource` 빈이 여러 개면 `@Primary` 빈만 교체 대상이다. `replace` 속성은 기존 `DataSource`를 임베디드 DB로 교체하는 조건을 정한다. `connection` 속성은 임베디드 DB 종류를 지정하며, 지정하지 않으면 클래스패스에서 감지한다.

| `replace` | 동작 |
|---|---|
| `NON_TEST` | 자동설정되었고 테스트 DB에 연결된 경우를 제외하고 교체. 3.4에서 추가된 기본값 |
| `ANY` | 자동설정 여부와 관계없이 교체 |
| `AUTO_CONFIGURED` | 자동설정된 경우에만 교체 |
| `NONE` | 교체하지 않음 |

`NON_TEST`는 다음 연결을 테스트 DB로 판단한다.

- `@ServiceConnection`을 붙인 Testcontainers DB와 Docker Compose 연결처럼 `ContainerImageMetadata`를 가진 빈 정의
- `@DynamicPropertySource`로 지정한 `spring.datasource.url`
- `jdbc:tc:`로 시작하는 Testcontainers JDBC URL로 지정한 `spring.datasource.url`

`@ServiceConnection` 등 위 조건을 충족하는 Testcontainers 연결은 기본 설정에서 교체 대상이 아니므로 컨테이너 DB로 테스트한다([[testcontainers]] §8.2).

```java
@DataJpaTest
@Testcontainers
class UserRepositoryPostgresTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres =
            new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));
}
```

위 조건에 해당하지 않는 DB에 연결하려면 `Replace.NONE`을 지정한다.

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class UserRepositoryRealDbTest { }
```

### 3.4. 스키마 초기화

Boot는 `Connection` 타입과 JDBC URL로 H2, HSQLDB, Derby를 임베디드 DB로 판별한다. 스키마 생성 관련 기본값은 임베디드 DB 여부에 따라 다르다.

| 설정 | 임베디드 DB | 그 외 DB |
|---|---|---|
| `spring.jpa.hibernate.ddl-auto` | Flyway·Liquibase가 없으면 `create-drop`, 있으면 `none` | `none` |
| `spring.sql.init.mode` | `schema.sql`과 `data.sql` 실행 | 실행하지 않음 |

Flyway와 Liquibase는 DB 종류와 관계없이 클래스패스에 있으면 실행된다. 마이그레이션 도구를 사용하면 `schema.sql`, `data.sql`을 함께 쓰지 않고 마이그레이션 도구만으로 스키마를 만든다.

`schema.sql`과 `data.sql`은 기본적으로 `EntityManagerFactory` 생성 전에 실행된다. Hibernate가 만든 스키마에 `data.sql`로 데이터를 넣으려면 `spring.jpa.defer-datasource-initialization=true`로 실행 순서를 바꾼다.

### 3.5. @SpringBootTest 조합

`@AutoConfigure…` 어노테이션은 `@SpringBootTest`에도 붙일 수 있다. 전체 애플리케이션 설정을 로드하면서 임베디드 DB나 `TestEntityManager`를 사용할 때 쓴다. `TestEntityManager`는 트랜잭션 안에서만 동작하므로 `@Transactional`을 함께 붙인다.

```java
@SpringBootTest
@AutoConfigureTestDatabase
@AutoConfigureTestEntityManager
@Transactional
class OrderServiceIntegrationTest { }
```

---

## 4. TestEntityManager

`TestEntityManager`는 `EntityManager` 메서드 중 테스트에 필요한 일부와 데이터 준비용 헬퍼 메서드를 제공한다. 현재 트랜잭션에 바인딩된 `EntityManager`를 사용하므로 트랜잭션 안에서 호출해야 한다.

| 메서드 | 동작 |
|---|---|
| `persist(e)` | 엔티티 영속화 |
| `persistAndFlush(e)` | 영속화 후 flush |
| `persistAndGetId(e, Class)` | 영속화 후 ID 반환 |
| `persistFlushFind(e)` | 영속화와 flush 후 ID로 조회 |
| `find(Class, id)` | 기본 키로 조회 |
| `flush()` | 영속성 컨텍스트를 DB에 동기화 |
| `clear()` | 영속성 컨텍스트를 비워 관리 중인 엔티티 전체를 준영속 상태로 전환 |
| `detach(e)`, `merge(e)`, `refresh(e)`, `remove(e)` | `EntityManager`의 동명 메서드 |
| `getEntityManager()` | 내부 `EntityManager` 반환 |

같은 영속성 컨텍스트에서 `persist`한 엔티티를 조회하면 DB를 거치지 않고 1차 캐시의 인스턴스가 반환될 수 있다. 매핑이나 쿼리 결과를 검증하려면 `flush()`와 `clear()`를 호출한 뒤 조회한다.[^2]

---

## 5. 트랜잭션

### 5.1. 롤백

`@DataJpaTest`는 `@Transactional`을 포함하므로 각 테스트 메서드는 테스트 관리 트랜잭션 안에서 실행되고 종료 시 롤백된다. `@BeforeEach`와 `@AfterEach`는 같은 트랜잭션 안에서, `@BeforeAll`과 `@AfterAll`은 트랜잭션 밖에서 실행된다. 트랜잭션 시작 전후에 실행할 코드는 `@BeforeTransaction`과 `@AfterTransaction`으로 지정한다.

| 설정 | 동작 |
|---|---|
| `@Commit` 또는 `@Rollback(false)` | 테스트 종료 시 커밋 |
| `@Rollback` | 테스트 종료 시 롤백. 클래스 수준 `@Commit`을 메서드에서 덮어쓸 때 사용 |
| `@Transactional(propagation = NOT_SUPPORTED)` | 테스트 관리 트랜잭션 미사용 |

테스트 관리 트랜잭션의 `propagation`은 `NOT_SUPPORTED`와 `NEVER`만 지원한다. `rollbackFor`, `isolation`, `timeout`, `readOnly`는 지원하지 않는다.

### 5.2. TestTransaction

`TestTransaction`의 정적 메서드로 테스트 도중 트랜잭션을 종료하거나 새로 시작한다. `@TransactionalEventListener`의 `AFTER_COMMIT` 리스너처럼 커밋 이후의 동작을 검증할 때 사용한다([[spring-event]]).

```java
@Test
void commitThenVerify() {
    repository.save(new User("sboot", "1234"));

    TestTransaction.flagForCommit();
    TestTransaction.end();          // 커밋
    assertThat(TestTransaction.isActive()).isFalse();

    TestTransaction.start();        // 이후 작업은 다시 롤백 대상
}
```

커밋한 데이터는 롤백되지 않으므로 테스트에서 직접 정리한다.

### 5.3. 롤백되지 않는 경우

다음 작업은 테스트 관리 트랜잭션에 참여하지 않으므로 테스트가 끝나도 롤백되지 않는다.

- 별도 스레드에서 실행한 작업. 테스트 트랜잭션 상태는 `ThreadLocal`로 테스트 스레드에 바인딩되므로 JUnit Jupiter의 `assertTimeoutPreemptively()` 안의 작업은 참여하지 않는다.
- 전파 속성이 `REQUIRED`, `SUPPORTS` 외의 값인 애플리케이션 트랜잭션. `REQUIRES_NEW`가 대표적이다([[jpa-transaction]] §5).[^3]
- `@SpringBootTest`의 `webEnvironment`가 `RANDOM_PORT`나 `DEFINED_PORT`일 때 서버가 HTTP 요청을 처리하며 시작한 트랜잭션. 서버는 테스트와 다른 스레드에서 실행된다.
- `@BeforeAll`에서 저장한 데이터. 클래스 수준 생명주기 메서드는 트랜잭션 밖에서 실행된다.

### 5.4. flush

테스트 관리 트랜잭션은 커밋 없이 롤백되므로 커밋 시점의 flush가 일어나지 않는다. 제약조건 위반처럼 flush 시점에 발생하는 예외를 테스트가 놓쳐 운영 환경에서만 드러날 수 있다. 영속성 컨텍스트를 변경하는 코드를 검증할 때는 테스트 메서드에서 `flush()`를 호출한다.

```java
@Test
void duplicateUsername() {
    em.persist(new User("sboot", "1"));
    repository.save(new User("sboot", "2"));   // username unique 제약

    assertThatThrownBy(() -> em.flush())
            .isInstanceOf(PersistenceException.class);
}
```

JPA의 `@PostPersist`, `@PreUpdate`, `@PostUpdate` 콜백도 flush 전에는 호출되지 않는다([[jpa-entity-lifecycle]]).

---

## 6. 테스트 데이터

`@Sql`은 테스트 전후에 SQL 스크립트를 실행한다. `/`로 시작하지 않는 경로는 테스트 클래스 패키지 기준의 클래스패스 상대 경로로 해석한다. 기본 실행 시점은 테스트 메서드 전이며, `executionPhase`에 `AFTER_TEST_METHOD`를 지정하면 메서드 후에 실행한다. Spring Framework 6.1부터는 클래스 수준 선언에 `BEFORE_TEST_CLASS`와 `AFTER_TEST_CLASS`도 지정할 수 있다.

```java
@DataJpaTest
class OrderRepositoryTest {

    @Test
    @Sql("/data/orders.sql")
    void findByStatus() { /* ... */ }
}
```

테스트 관리 트랜잭션이 있으면 스크립트도 같은 트랜잭션에서 실행되어 함께 롤백된다. 스크립트 결과를 테스트 트랜잭션과 별도로 커밋하려면 `@SqlConfig(transactionMode = ISOLATED)`를 지정한다.

---

## 7. 트러블슈팅

### 7.1. 빈 누락

서비스, `JPAQueryFactory`, `AuditorAware` 같은 빈을 주입할 때 `NoSuchBeanDefinitionException`이 발생하거나 Auditing 필드가 `null`로 저장된다. 슬라이스에 필요한 빈이 포함되지 않은 경우다. 등록 방법은 §3.2를 참고한다.

### 7.2. 의도하지 않은 빈 로드

`@DataJpaTest`에 서비스나 웹 설정 빈이 포함되거나, 관련 없는 기능 설정 때문에 컨텍스트 로드가 실패할 수 있다. 메인 클래스의 `@ComponentScan`이나 `@Enable…` 설정이 슬라이스에도 적용되는지 확인한다. 기능별 설정을 별도 `@Configuration`으로 분리하는 방법은 §3.2를 참고한다. 설정을 옮기기 어렵다면 테스트 패키지 계층에 `@SpringBootConfiguration`을 두어 메인 클래스 대신 설정 소스로 사용할 수 있다.

### 7.3. 임베디드 DB 없음

컨텍스트 로드 시 다음 오류가 발생한다.

```
Failed to replace DataSource with an embedded database for tests. If you want an embedded database please put a supported one on the classpath or tune the replace attribute of @AutoConfigureTestDatabase.
```

`replace` 조건에 따라 `DataSource`를 교체해야 하는데 클래스패스에 임베디드 DB가 없는 경우다. 임베디드 DB 의존성을 추가하거나, Testcontainers의 `@ServiceConnection`으로 연결하거나, `Replace.NONE`을 지정한다(§3.3).

### 7.4. 테이블 없음

임베디드 DB에서 통과하던 테스트가 Testcontainers나 실제 DB에서 테이블이 없다는 SQL 오류로 실패할 수 있다. 임베디드 DB가 아닌 경우의 스키마 초기화 기본값은 §3.4와 같다. Flyway나 Liquibase로 스키마를 만들거나 `spring.jpa.hibernate.ddl-auto=create-drop` 또는 `spring.sql.init.mode=always`를 지정한다.

`data.sql` 실행 중 테이블이 없다는 오류가 나면 Hibernate 스키마 생성 뒤에 스크립트를 실행하도록 `spring.jpa.defer-datasource-initialization=true`를 지정한다(§3.4).

### 7.5. H2와 운영 DB 차이

운영 DB 전용 함수나 문법을 쓰는 네이티브 쿼리와 Flyway 마이그레이션 스크립트가 H2에서 실패한다. H2는 다른 DB의 동작 중 일부만 에뮬레이션하기 때문이다. `MODE=PostgreSQL`, `MODE=MySQL` 같은 호환 모드로 일부 차이를 줄일 수 있다. 운영 DB와 같은 동작을 검증하려면 Testcontainers로 같은 종류의 DB를 사용한다(§3.3).

```properties
spring.datasource.url=jdbc:h2:mem:test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
```

호환 모드 URL을 `spring.datasource.url`로 지정하면 `NON_TEST` 조건에 의해 기본 임베디드 DB로 다시 교체되므로 `Replace.NONE`을 함께 지정한다.[^4]

### 7.6. LazyInitializationException 미발생

운영 환경에서 `LazyInitializationException`이 발생하는 지연 로딩 접근이 테스트에서는 통과한다. 테스트 메서드 전체가 하나의 테스트 관리 트랜잭션으로 실행되어 영속성 컨텍스트가 테스트 종료까지 유지되기 때문이다.[^5] 지연 로딩 경계를 검증하려면 `clear()`로 엔티티를 준영속 상태로 만든 뒤 접근하거나, `NOT_SUPPORTED`로 테스트 관리 트랜잭션을 끈다(§5.1).

### 7.7. 데이터 잔존

롤백될 것으로 기대한 데이터가 다음 테스트에 남아 있다. 데이터가 테스트 관리 트랜잭션 밖에서 커밋되었기 때문이다(§5.3). 해당 작업을 테스트 트랜잭션 안으로 옮기거나, `@AfterEach` 또는 `@Sql(executionPhase = AFTER_TEST_METHOD)`로 직접 정리한다.

---

## Sources
- [Spring: Spring Boot Reference, Testing Spring Boot Applications](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html)
- [Spring: Spring Boot Reference, Test Slices](https://docs.spring.io/spring-boot/appendix/test-auto-configuration/slices.html)
- [Spring: Spring Boot 3.5 Reference, Test Slices](https://docs.spring.io/spring-boot/3.5/appendix/test-auto-configuration/slices.html)
- [Spring: Spring Boot 4.1 API, DataJpaTest](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html)
- [Spring: Spring Boot 4.1 API, TestEntityManager](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/jpa/test/autoconfigure/TestEntityManager.html)
- [Spring: Spring Boot 4.1 API, AutoConfigureTestDatabase](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/jdbc/test/autoconfigure/AutoConfigureTestDatabase.html)
- [Spring: Spring Boot 4.1 API, AutoConfigureTestDatabase.Replace](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/jdbc/test/autoconfigure/AutoConfigureTestDatabase.Replace.html)
- [Spring: Spring Boot 3.5 API, DataJpaTest](https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/test/autoconfigure/orm/jpa/DataJpaTest.html)
- [Spring: Spring Boot 3.5 API, AutoConfigureTestDatabase.Replace](https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/test/autoconfigure/jdbc/AutoConfigureTestDatabase.Replace.html)
- [Spring: Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Spring: Spring Boot How-to, Database Initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
- [Spring: spring-boot v4.1.2, AutoConfigureJdbc.java](https://github.com/spring-projects/spring-boot/blob/v4.1.2/module/spring-boot-jdbc-test/src/main/java/org/springframework/boot/jdbc/test/autoconfigure/AutoConfigureJdbc.java)
- [Spring: spring-boot v4.1.2, TestDatabaseAutoConfiguration.java](https://github.com/spring-projects/spring-boot/blob/v4.1.2/module/spring-boot-jdbc-test/src/main/java/org/springframework/boot/jdbc/test/autoconfigure/TestDatabaseAutoConfiguration.java)
- [Spring: spring-boot v4.1.2, spring-boot-flyway AutoConfigureDataSourceInitialization.imports](https://github.com/spring-projects/spring-boot/blob/v4.1.2/module/spring-boot-flyway/src/main/resources/META-INF/spring/org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureDataSourceInitialization.imports)
- [Spring: Spring Framework Reference, Transaction Management (TestContext)](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)
- [Spring: Spring Framework Reference, Executing SQL Scripts](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/executing-sql.html)
- [H2: Features, Compatibility](https://www.h2database.com/html/features.html)

---

## Related pages
- [[testcontainers]]
- [[jpa-transaction]]
- [[jpa-entity-lifecycle]]
- [[jpa-n-plus-one]]
- [[spring-event]]
- [[java-testing-libraries]]
- [[batch-testing]]

---

[^1]: Boot 4 레퍼런스 부록의 슬라이스 표는 `@DataJpaTest`에 `DataJpaRepositoriesAutoConfiguration`과 `HibernateJpaAutoConfiguration`만 나열한다. v4.1.2 소스에서는 `@DataJpaTest`가 `@AutoConfigureJdbc`를, `@AutoConfigureJdbc`가 `@AutoConfigureDataSourceInitialization`을 포함한다. 이 어노테이션의 imports 파일에 `spring-boot-flyway`와 `spring-boot-liquibase` 모듈은 각 자동설정을, `spring-boot-jdbc-test`는 `DataSourceInitializationAutoConfiguration`을 등록한다. Boot 3.5 부록도 `@DataJpaTest`에 Flyway, Liquibase, `SqlInitializationAutoConfiguration`을 포함한다. 부록은 메타 어노테이션으로 조합된 자동설정을 표시하지 않는 것으로 판단했다.
[^2]: 공식 문서는 `flush()`와 `clear()`의 동작만 설명하고 1차 캐시가 조회 검증에 미치는 영향은 명시하지 않는다. 같은 영속성 컨텍스트에서 동일 ID 엔티티는 같은 인스턴스로 관리된다는 JPA 동작에서 추론했다.
[^3]: 공식 문서는 `REQUIRED`, `SUPPORTS` 외의 전파 속성에 주의하라고만 쓰고 롤백 여부는 명시하지 않는다. `REQUIRES_NEW`는 기존 트랜잭션을 보류하고 새 트랜잭션을 독립적으로 커밋하므로 테스트 롤백 대상에서 빠진다고 판단했다.
[^4]: `NON_TEST`가 테스트 DB로 인정하는 조건에 일반 `spring.datasource.url` 설정은 포함되지 않는다는 점에서 추론했다.
[^5]: 공식 문서는 ORM 테스트의 거짓 양성을 flush 누락 사례로만 설명한다. 지연 로딩 사례는 테스트 관리 트랜잭션이 테스트 메서드 전체를 감싸 영속성 컨텍스트가 유지된다는 동작에서 추론했다.
