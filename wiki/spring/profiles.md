---
title: Profiles — Spring Boot 프로파일 활성화·그룹·Multi-Document 설정
updated: 2026-08-31 14:25:48
tags:
  - java
  - spring-boot
  - configuration
---

## 1. 개요

Spring Profile은 환경별로 설정과 빈 구성을 분리하는 메커니즘이다. `@Component`, `@Configuration`, `@ConfigurationProperties`에 `@Profile`을 붙여 특정 프로파일에서만 로드되도록 제한할 수 있다.

```java
@Configuration(proxyBeanMethods = false)
@Profile("production")
public class ProductionConfiguration { }
```

---

## 2. 프로파일 활성화

| 방법 | 예시 |
|---|---|
| 설정 파일 | `spring.profiles.active=dev,hsqldb` |
| CLI 인수 | `--spring.profiles.active=dev,hsqldb` |
| 환경변수 | `SPRING_PROFILES_ACTIVE=dev,hsqldb` |
| 프로그래밍 | `app.setAdditionalProfiles("dev", "hsqldb")` |

`spring.profiles.active`는 [[externalized-configuration]]의 PropertySource 우선순위를 따른다 — CLI 인수가 설정 파일 값을 대체한다.

활성 프로파일이 없으면 `default` 프로파일이 적용되며, `spring.profiles.default`로 이름을 변경할 수 있다.

### 2.1. spring.profiles.include

활성 프로파일을 대체하지 않고 **추가**한다. include된 프로파일은 `spring.profiles.active`보다 앞에 추가된다.

```yaml
spring:
  profiles:
    include:
      - "common"
      - "local"
```

`--spring.profiles.active=production` 실행 시 활성 프로파일: `common`, `local`, `production`

---

## 3. Profile Group

관련 프로파일 여러 개를 논리적 이름 하나로 묶는다.

```yaml
spring:
  profiles:
    group:
      production:
        - "proddb"
        - "prodmq"
```

`--spring.profiles.active=production` 실행 시 `production`, `proddb`, `prodmq`가 모두 활성화된다.

---

## 4. Multi-Document 파일

단일 물리 파일을 여러 논리 문서로 분할한다. 문서는 위에서 아래로 처리되며 **뒤의 문서가 앞의 문서를 override**한다(last-wins).

- YAML 구분자: `---` (YAML 표준)
- Properties 구분자: `#---` 또는 `!---` (Spring Boot 확장)

Properties 구분자 규칙:
- 행 앞에 공백이 없어야 함
- 대시는 정확히 3개
- 구분자 바로 앞뒤 행에 같은 주석 접두사 사용 불가

### 4.1. Activation Properties

`spring.config.activate.*`로 문서별 활성화 조건을 지정한다.

| 속성 | 조건 |
|---|---|
| `on-profile` | 프로파일 표현식 매칭 시 활성 |
| `on-cloud-platform` | 해당 CloudPlatform 감지 시 활성 |

두 조건을 함께 지정하면 AND로 동작한다. 조건 없는 문서는 항상 적용된다.

```yaml
spring:
  application:
    name: myapp        # 공통 (항상 적용)
---
spring:
  config:
    activate:
      on-profile: dev
server:
  port: 8081
---
spring:
  config:
    activate:
      on-profile: "prod | staging"
server:
  port: 80
```

Properties 형식:

```properties
myprop=always-set
#---
spring.config.activate.on-profile=dev
server.port=8081
```

### 4.2. 프로파일 표현식

`on-profile`에는 논리 표현식 사용 가능: `!`(NOT), `&`(AND), `|`(OR). 목록으로 지정하면 하나라도 매칭 시 활성(OR).

---

## 5. 제약사항

- `spring.profiles.active` / `default` / `include` / `group`은 **non-profile-specific 문서에서만** 사용 가능. 다음 위치에서는 사용 불가:
  - profile-specific 파일 (`application-prod.yaml` 등)
  - `spring.config.activate.on-profile`이 지정된 문서
- multi-document properties 파일은 `@PropertySource`, `@TestPropertySource`로 로드할 수 없다.
- 프로파일 이름은 문자·숫자로 시작·종료해야 하며 `-`, `_`, `.`, `+`, `@` 허용 (`spring.profiles.validate=false`로 검증 비활성화 가능).
- Spring Boot 2.4 이전의 `spring.profiles` 키는 deprecated — `spring.config.activate.on-profile`로 대체됨.[^1]

[^1]: 출처의 공식 문서 페이지에는 legacy 키(spring.profiles) 언급이 없다. Boot 2.4의 config data 처리 개편 사실로부터 추론한 서술임.

---

## Sources

- [Profiles :: Spring Boot](https://docs.spring.io/spring-boot/reference/features/profiles.html)
- [Externalized Configuration :: Spring Boot](https://docs.spring.io/spring-boot/reference/features/external-config.html)

---

## Related pages

- [[externalized-configuration]]
- [[configuration-properties]]
- [[bean-registration-control]]
