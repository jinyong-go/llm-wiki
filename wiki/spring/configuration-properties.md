---
title: `@ConfigurationProperties` in Spring Boot
updated: 2026-08-21 15:38:05
tags:
  - java
  - spring-boot
  - configuration
  - binding
---

## 1. 개요

`@ConfigurationProperties`는 외부 설정 소스(properties/YAML/환경변수 등)를 **타입-안전한 POJO에 계층적으로 바인딩**하는 어노테이션이다. 동일 prefix를 가진 여러 프로퍼티를 한 클래스에 묶어 주며, JSR-303 검증과 IDE 메타데이터 자동완성을 지원한다.

바인딩 대상이 되는 설정 소스의 탐색·우선순위는 [[externalized-configuration]]의 15단계 `PropertySource` 규칙을 그대로 따른다. 본 문서는 그 소스를 **POJO에 매핑하는 방법**에 집중한다.

---

## 2. 사용 방법과 관련 어노테이션

### 2.1. 빈 등록 3가지 방식

`@ConfigurationProperties` 클래스를 스프링 컨텍스트에 등록하는 방법.

**(1) `@Component` 계열과 조합** — 클래스가 직접 컴포넌트 스캔된다.

```java
@Configuration
@ConfigurationProperties(prefix = "mail")
public class MailProperties {
    private String host;
    private int port;
    // getters / setters
}
```

**(2) `@EnableConfigurationProperties` (명시적 등록)** — 클래스에 스테레오타입 어노테이션을 붙이지 않고 별도 `@Configuration`에서 등록한다. 조건부 자동구성(Auto-configuration) 작성에 적합.

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(MailProperties.class)
public class MailAutoConfiguration { }
```

**(3) `@ConfigurationPropertiesScan` (Spring Boot 2.2+)** — `@Component`도 `@EnableConfigurationProperties`도 불필요. 지정 패키지를 스캔해 자동 등록한다.

```java
@SpringBootApplication
@ConfigurationPropertiesScan("com.example.config")
public class MyApplication { }
```

> 빈 이름 규칙: `<prefix>-<fully.qualified.ClassName>` (예: `mail-com.example.MailProperties`)

### 2.2. `@Bean` 메서드에 적용

소스를 수정할 수 없는 외부 라이브러리 클래스에 프로퍼티를 바인딩할 때 사용한다.

```java
@Configuration(proxyBeanMethods = false)
public class ThirdPartyConfiguration {
    @Bean
    @ConfigurationProperties("another")
    public AnotherComponent anotherComponent() {
        return new AnotherComponent();
    }
}
```

### 2.3. 관련 어노테이션 요약

| 어노테이션 | 역할 |
|---|---|
| `@ConfigurationProperties(prefix)` | prefix 하위 프로퍼티를 POJO에 바인딩 |
| `@EnableConfigurationProperties` | CP 클래스를 명시적으로 빈 등록 |
| `@ConfigurationPropertiesScan` | CP 클래스를 패키지 스캔으로 등록 (2.2+) |
| `@ConstructorBinding` | 생성자 기반 불변 바인딩 지정 (버전별 의미 상이 → 7장) |
| `@DefaultValue` | 생성자 파라미터 기본값 지정 |
| `@Validated` | 시작 시점 JSR-303 검증 활성화 |
| `@ConfigurationPropertiesBinding` | 커스텀 `Converter`를 바인딩에 등록 |
| `@DurationUnit`·`@PeriodUnit`·`@DataSizeUnit` | 단위 없는 값의 기본 단위 지정 |

---

## 3. 설정파일 ↔ 필드 매핑 방식

### 3.1. Relaxed Binding (느슨한 바인딩)

Spring Boot는 프로퍼티 이름과 필드 이름이 정확히 일치하지 않아도 바인딩한다. `firstName` 필드에 바인딩되는 형식:

| 형식 | 예시 | 권장 소스 |
|---|---|---|
| kebab-case | `my.person.first-name` | `.properties`, YAML (권장) |
| camelCase | `my.person.firstName` | `.properties`, YAML |
| underscore | `my.person.first_name` | `.properties`, YAML |
| UPPER_CASE | `MY_PERSON_FIRSTNAME` | 환경변수 (권장) |

- **prefix는 반드시 kebab-case** (`my.main-project.person`).
- 환경변수 변환 규칙: `.` → `_`, `-` 제거, 대문자화.
  - `spring.main.log-startup-info` → `SPRING_MAIN_LOGSTARTUPINFO`
- List 환경변수: `MY_SERVICE_0_OTHER` → `my.service[0].other`

### 3.2. 중첩·List·Map 바인딩

```java
@ConfigurationProperties(prefix = "mail")
public class MailProperties {
    private List<String> defaultRecipients;
    private Map<String, String> additionalHeaders;
    private Credentials credentials;   // 중첩 클래스
    // getters / setters
}
```

```properties
mail.default-recipients[0]=admin@example.com
mail.default-recipients[1]=ops@example.com
mail.additional-headers.secure=true
mail.credentials.username=john
mail.credentials.password=secret
```

> **List 병합 주의**: 여러 `PropertySource`(예: 기본 프로파일 + `dev` 프로파일)에 동일 List가 있으면 병합되지 않고 **우선순위 높은 소스의 List가 전체를 교체**한다. Map은 서로 다른 키에 한해 병합된다.

### 3.3. 타입 변환

| 타입 | 기본 단위 | 단위 오버라이드 | 지원 단위 |
|---|---|---|---|
| `Duration` | 밀리초 | `@DurationUnit` | `ns us ms s m h d` |
| `Period` | 일(day) | `@PeriodUnit` | `y m w d` |
| `DataSize` | 바이트 | `@DataSizeUnit` | `B KB MB GB TB` |

```java
@DurationUnit(ChronoUnit.SECONDS)
private Duration sessionTimeout = Duration.ofSeconds(30);  // my.session-timeout=30 → 30초
private Duration readTimeout = Duration.ofMillis(1000);    // my.read-timeout=500ms → 500밀리초
```

**커스텀 Converter** — `@ConfigurationPropertiesBinding`으로 등록.

```java
@Component
@ConfigurationPropertiesBinding
public class EmployeeConverter implements Converter<String, Employee> {
    @Override
    public Employee convert(String from) {
        String[] data = from.split(",");
        return new Employee(data[0], Double.parseDouble(data[1]));
    }
}
```

---

## 4. 바인딩 방식: Setter vs Constructor

### 4.1. Setter 바인딩
기본 방식. 가변 POJO + getter/setter. `@Component`/`@Bean`/`@Import`로 등록한 빈은 이 방식만 가능.

### 4.2. Constructor 바인딩
setter 없이 `final` 필드로 불변 객체를 만든다.

```java
@ConfigurationProperties("mail.credentials")
public class ImmutableCredentials {
    private final String authMethod;
    private final String username;
    private final String password;

    // 단일 생성자 → @ConstructorBinding 불필요 (Spring Boot 3.x)
    public ImmutableCredentials(String authMethod, String username, String password) {
        this.authMethod = authMethod;
        this.username = username;
        this.password = password;
    }
    // getters only
}
```

- `@EnableConfigurationProperties` 또는 `@ConfigurationPropertiesScan`으로 등록해야 한다 (`@Component`/`@Bean`/`@Import` 불가).
- 컴파일 시 `-parameters` 플래그 필요 (Spring Boot Gradle/Maven 플러그인 자동 적용).

**`@DefaultValue`** — 생성자 파라미터 기본값.

```java
public Security(String username, String password,
                @DefaultValue("USER") List<String> roles) { ... }
```

중첩 객체가 전혀 바인딩되지 않아도 `null` 대신 인스턴스를 반환하려면 값 없이 부착:

```java
public MyProperties(boolean enabled, @DefaultValue Security security) { ... }
```

**Java Record** — 단일 canonical 생성자를 가지므로 불변 바인딩에 자연스럽다 (Record 지원: Spring Boot 2.6+).

```java
@ConfigurationProperties(prefix = "mail.credentials")
public record ImmutableCredentials(String authMethod, String username, String password) { }
```

---

## 5. 검증

`@Validated` + JSR-303(`jakarta.validation`) 어노테이션으로 **애플리케이션 시작 시점에** 검증한다. 실패 시 `IllegalStateException`으로 시작이 중단된다 — 잘못된 설정이 런타임까지 숨지 않는 fail-fast 이점.

```java
@ConfigurationProperties("my.service")
@Validated
public class MyServiceProperties {
    @NotNull
    private InetAddress remoteAddress;

    @Valid  // 중첩 객체 검증 cascade
    private final Security security = new Security();

    public static class Security {
        @NotEmpty
        private String username;
        // getters / setters
    }
    // getters / setters
}
```

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

## 6. `@ConfigurationProperties` vs `@Value`

| 항목 | `@ConfigurationProperties` | `@Value` |
|---|---|---|
| Relaxed binding | O | 제한적 |
| 메타데이터(IDE 자동완성) | O | X |
| JSR-303 검증 | O | X |
| SpEL 평가 | X | O |
| 계층적/그룹 프로퍼티 | O (권장) | X (단일 값) |
| 불변(생성자) 바인딩 | O | X |
| 단위 타입(Duration 등) 변환 | O | X |

**장단점 요약**
- `@ConfigurationProperties` 장점: 타입 안전, 그룹화, 검증, 불변, 메타데이터. 단점: 전용 POJO 클래스 필요, SpEL 불가.
- `@Value` 장점: 단일 값 주입이 간결, SpEL 표현식 사용 가능. 단점: 그룹화·검증·메타데이터 미지원, relaxed binding 제한.

> **선택 기준**: 동일 prefix를 가진 프로퍼티 그룹 → `@ConfigurationProperties`. SpEL이 필요한 단일 값 → `@Value`.
> `@Value` 사용 시 kebab-case canonical form(`${demo.item-price}`)을 권장한다. `${demo.itemPrice}`는 환경변수 `DEMO_ITEMPRICE`는 인식하지만 `demo.item-price` properties 키는 인식하지 못한다.

---

## 7. Spring Boot 버전별 차이점

| 버전 | 변경 사항 |
|---|---|
| **2.2** | `@ConstructorBinding`과 생성자 기반 불변 바인딩 도입. `@ConfigurationPropertiesScan` 추가. (당시 `@ConstructorBinding`은 `org.springframework.boot.context.properties` 패키지, **타입·생성자 레벨 모두** 부착 가능) |
| **2.6** | Java `record`를 `@ConfigurationProperties` 대상으로 지원. |
| **3.0** | `@ConstructorBinding`이 **새 패키지 `org.springframework.boot.context.properties.bind.ConstructorBinding`**로 이동(기존 패키지는 deprecated). `@Target`이 `CONSTRUCTOR`로 한정되어 **타입 레벨 사용 불가**. **단일 파라미터 생성자는 어노테이션 없이 암묵적으로 생성자 바인딩**이 적용되며, 복수 생성자일 때만 사용할 생성자에 부착한다. |
| **3.2** | deprecated된 구 패키지 `org.springframework.boot.context.properties.ConstructorBinding` 제거. |

**실무 정리**
- 3.x: 불변 클래스/record는 단일 생성자이므로 `@ConstructorBinding` 없이 동작. 생성자가 둘 이상일 때만 대상 생성자에 새 패키지의 `@ConstructorBinding`을 부착.
- 2.x → 3.x 마이그레이션: 클래스(타입) 레벨 `@ConstructorBinding`을 제거하고, import 경로를 `...properties.bind.ConstructorBinding`으로 교체.

---

## Sources

- [Guide to @ConfigurationProperties in Spring Boot (Baeldung)](https://www.baeldung.com/configuration-properties-in-spring-boot)
- [Externalized Configuration :: Spring Boot Reference](https://docs.spring.io/spring-boot/reference/features/external-config.html)
- [ConstructorBinding (Spring Boot 2.7.16 API — 구 패키지)](https://docs.spring.io/spring-boot/docs/2.7.16/api/org/springframework/boot/context/properties/ConstructorBinding.html)
- [ConstructorBinding (Spring Boot 3.x API — 신 패키지 bind)](https://docs.spring.io/spring-boot/docs/3.1.x/api/org/springframework/boot/context/properties/bind/ConstructorBinding.html)
- [Migrate Application From Spring Boot 2 to Spring Boot 3 (Baeldung)](https://www.baeldung.com/spring-boot-3-migration)

---

## Related pages

- [[externalized-configuration]]
- [[java17-features]]
- [[java21-features]]
- [[multi-datasource]]
- [[bean-registration-control]]
- [[enable-annotations]]
- [[nestjs-config]] — NestJS ConfigModule/ConfigService와 비교
