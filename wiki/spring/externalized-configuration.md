---
title: Externalized Configuration — Spring Boot 설정값 우선순위
updated: 2026-08-31 14:25:48
tags:
  - java
  - spring-boot
  - configuration
---

## 1. 개요

Spring Boot는 동일 코드로 여러 환경을 지원하기 위해 설정을 외부화한다. 설정 소스는 `@Value`, `Environment`, `@ConfigurationProperties` 세 가지 방법으로 접근할 수 있다.

여러 소스가 동일 키를 정의할 경우 **우선순위가 높은 소스가 낮은 소스를 override**한다.

---

## 2. PropertySource 우선순위

번호가 클수록 높은 우선순위. 뒤에 오는 소스가 앞 소스를 덮어쓴다.

| 순위 | 소스 | 비고 |
|---:|---|---|
| 1 | Default properties (`SpringApplication.setDefaultProperties()`) | 가장 낮음 |
| 2 | `@PropertySource` on `@Configuration` | context refresh 이후 적용 — `logging.*`, `spring.main.*` 사용 불가 |
| 3 | Config data (`application.properties` 등) | 하위 순위 별도 표 참고 |
| 4 | `RandomValuePropertySource` | `random.*` 키 전용 |
| 5 | OS 환경변수 | |
| 6 | Java System properties (`-D` JVM 옵션) | `System.getProperties()` |
| 7 | JNDI (`java:comp/env`) | 서블릿 컨테이너/앱 서버 환경 |
| 8 | `ServletContext` init parameters | |
| 9 | `ServletConfig` init parameters | |
| 10 | `SPRING_APPLICATION_JSON` | 환경변수 또는 시스템 프로퍼티에 inline JSON |
| 11 | Command line arguments (`--key=value`) | |
| 12 | `@SpringBootTest`의 `properties` 속성 | 테스트 전용 |
| 13 | `@DynamicPropertySource` | 테스트 전용 |
| 14 | `@TestPropertySource` | 테스트 전용 |
| 15 | Devtools global settings (`$HOME/.config/spring-boot`) | devtools 활성 시만 적용 |

### 2.1. 실무 요약

테스트·JNDI 항목은 제외한 순서다.

```
낮음 ──────────────────────────────────────────────────── 높음
기본값 < application.properties(jar 내) < application.properties(jar 외)
     < OS 환경변수 < JVM -D 옵션 < CLI -- 인수
```

---

## 3. Config data 파일 우선순위

위 표의 순위 3에 해당하는 설정 파일은 다시 4단계로 나뉜다.

| 순위 | 소스 |
|---:|---|
| 1 | jar 내부 `application.properties` / YAML |
| 2 | jar 내부 `application-{profile}.properties` / YAML |
| 3 | jar 외부 `application.properties` / YAML |
| 4 | jar 외부 `application-{profile}.properties` / YAML |

jar 외부가 내부를 override하고, profile-specific이 일반 파일을 override한다.

> `.properties`와 YAML이 동일 경로에 공존하면 `.properties`가 우선 적용된다.

---

## 4. 설정 파일 검색 경로

`application.properties`/YAML을 자동 탐색하는 기본 경로 (낮은 → 높은 우선순위):

1. `classpath:/`
2. `classpath:/config/`
3. `./` (현재 디렉터리)
4. `./config/`
5. `./config/*/` (config 하위 디렉터리, 알파벳 순)

파일 이름 변경: `spring.config.name=myproject` 경로 교체: `spring.config.location=optional:classpath:/custom/` 경로 추가: `spring.config.additional-location=optional:file:./custom/`

> `spring.config.location`은 기본 경로를 **교체**하고, `spring.config.additional-location`은 기본 경로에 **추가**한다.

---

## 5. 주요 소스별 사용법

### 5.1. OS 환경변수

프로퍼티 이름 변환 규칙:
- `.` → `_`
- `-` 제거
- 대문자화

```
spring.main.log-startup-info  →  SPRING_MAIN_LOGSTARTUPINFO
my.service[0].other           →  MY_SERVICE_0_OTHER
```

### 5.2. JVM 시스템 프로퍼티 (`-D`)

```bash
java -Dserver.port=8081 -jar myapp.jar
```

### 5.3. CLI 인수 (`--`)

```bash
java -jar myapp.jar --server.port=8081 --spring.profiles.active=prod
```

CLI 인수는 환경변수·JVM 옵션보다 우선순위가 높다. 비활성화:

```java
SpringApplication app = new SpringApplication(MyApp.class);
app.setAddCommandLineProperties(false);
```

### 5.4. SPRING_APPLICATION_JSON

환경변수 또는 시스템 프로퍼티에 JSON을 인라인으로 삽입한다.

```bash
SPRING_APPLICATION_JSON='{"my":{"name":"test"}}' java -jar myapp.jar
java -Dspring.application.json='{"my":{"name":"test"}}' -jar myapp.jar
java -jar myapp.jar --spring.application.json='{"my":{"name":"test"}}'
```

> `null` 값으로 하위 소스를 override하는 것은 불가능하다.

---

## 6. Profile-specific 파일 우선순위

`spring.profiles.active=prod,live`일 때:

- `application-live.properties` > `application-prod.properties` (**last-wins**)

Location group(`;` 구분)과 개별 location(`,` 구분) 사이에 그룹 단위 last-wins가 적용된다.

활성 프로파일이 없으면 `application-default.properties`가 적용된다.

---

## 7. Property Placeholder

`application.properties` 내에서 이전에 정의된 값을 참조할 수 있다.

```properties
app.name=MyApp
app.description=${app.name} is running (author: ${username:Unknown})
```

Placeholder 키는 kebab-case canonical form을 권장한다. `${demo.item-price}`는 `demo.item-price`, `demo.itemPrice`, `DEMO_ITEMPRICE` 모두 인식하지만, `${demo.itemPrice}`는 `demo.item-price`를 인식하지 못한다.

---

## Sources

- [Externalized Configuration :: Spring Boot](https://docs.spring.io/spring-boot/reference/features/external-config.html)

---

## Related pages

- [[profiles]]
- [[configuration-properties]]
- [[multi-datasource]]
- [[forward-headers-proxy]]
- [[bean-registration-control]]
- [[nestjs-config]] — NestJS ConfigModule/ConfigService와 비교
