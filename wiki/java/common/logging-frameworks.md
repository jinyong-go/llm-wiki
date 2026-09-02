---
title: Java 로깅 프레임워크 비교 — Logback vs Log4j2
updated: 2026-07-14 11:26:44
tags:
  - java
  - logging
  - logback
  - log4j2
  - slf4j
---

## 1. 개요

Java 로깅은 일반적으로 **SLF4J(추상화) + 구현체(Logback 또는 Log4j2)** 구조를 사용한다 — [[design-patterns-structural]]의 Bridge 패턴 사례. 애플리케이션 코드는 SLF4J API에만 의존하고, 실제 출력은 클래스패스의 구현체가 담당하므로 구현체 교체가 코드 수정 없이 가능하다.

두 구현체는 같은 계보다. Log4j 1.x의 원저자(Ceki Gülcü)가 만든 후속작이 **Logback**, Apache 재단이 Log4j 1.x를 재설계한 후속작이 **Log4j2**다.

| 구성 | Logback | Log4j2 |
|---|---|---|
| SLF4J 연동 | 네이티브 구현 (브리지 불필요) | `log4j-slf4j2-impl` 브리지 필요 |
| 핵심 모듈 | `logback-classic`, `logback-core` | `log4j-api`, `log4j-core` |
| Spring Boot | `spring-boot-starter-logging` 기본 | `spring-boot-starter-log4j2`로 교체 |

---

## 2. Log4j2가 더 좋은 부분

### 2.1. 비동기 처리량 — Async Logger
가장 큰 차별점. 큐(`BlockingQueue`) 기반인 Logback `AsyncAppender`와 달리 **LMAX Disruptor**(lock-free 링 버퍼)를 사용한다. 공식 벤치마크 기준 멀티스레드 환경에서 Logback 대비 **처리량 수 배~10배, 지연은 수십 배 낮다**. 락 경합이 없어 스레드 수가 늘수록 격차가 커진다.

```xml
<!-- 전체 Async Logger 활성화: JVM 옵션 또는 시스템 프로퍼티 -->
-Dlog4j2.contextSelector=org.apache.logging.log4j.core.async.AsyncLoggerContextSelector
```

> Disruptor 라이브러리(`com.lmax:disruptor`)를 클래스패스에 추가해야 한다.

### 2.2. GC 부담 — Garbage-free 모드
정상 상태(steady state)에서 임시 객체를 거의 생성하지 않는 모드를 제공한다. 로깅으로 인한 GC 압박이 줄어 [[gc]] 정지시간에 민감한 저지연 서비스에서 유효하다. 2.18.0부터는 기본 Async wait strategy(Timeout)도 garbage-free다.

### 2.3. 지연 평가 — 람다 지원
```java
// 레벨 미달 시 expensive() 호출 자체가 일어나지 않는다
log.debug("result: {}", () -> expensive());
```
Logback(SLF4J API)은 `isDebugEnabled()` 가드로 동일 효과를 내야 한다.

### 2.4. 기타
- **설정 자동 리로드** 시 로그 이벤트 유실 없이 반영
- 설정 형식: XML·JSON·YAML·properties 모두 지원
- 플러그인 아키텍처, 커스텀 로그 레벨, Failover Appender

---

## 3. Logback이 더 좋은 부분

### 3.1. Spring Boot 기본 구현체
`spring-boot-starter-logging`에 포함되어 **설정 없이 즉시 동작**한다. `application.properties`의 `logging.*` 프로퍼티, `logback-spring.xml`의 `<springProfile>`/`<springProperty>` 등 Spring 통합이 매끄럽다. Log4j2로 바꾸려면 기본 로깅 스타터를 제외하고 `spring-boot-starter-log4j2`를 추가해야 한다.

### 3.2. SLF4J 네이티브
SLF4J를 직접 구현하므로 브리지 어댑터 계층이 없다. 의존성 구성이 단순하고 브리지 버전 불일치 문제가 없다.

### 3.3. 단순함과 성숙도
구성 요소가 적고 레퍼런스·운영 경험 축적이 크다. 일반 웹 서비스 수준의 로깅에서는 설정·트러블슈팅 자료가 풍부하다.

### 3.4. 부가 기능
- `logback-access` — 서블릿 컨테이너(Tomcat/Jetty) 액세스 로그 통합
- **prudent mode** — 여러 JVM이 같은 로그 파일에 안전하게 기록
- 조건부 설정(`<if>/<then>/<else>`, Janino 필요)

### 3.5. 보안 이력
Log4Shell(CVE-2021-44228, log4j-core 2.x RCE) 같은 대형 사고 이력이 없다. 조직에 따라 log4j 계열 기피 정책이 존재한다. (Logback도 CVE가 없지는 않으나 파급이 작았다.)

---

## 4. 성능 요약

| 시나리오               | 우위         | 비고                                                       |
| ------------------ | ---------- | -------------------------------------------------------- |
| 동기(synchronous) 로깅 | 비슷         | 체감 차이 크지 않음                                              |
| 비동기 — 처리량          | **Log4j2** | Disruptor lock-free vs 큐 락 경합                            |
| 비동기 — 지연(latency)  | **Log4j2** | garbage-free async가 최저 응답시간                              |
| GC 부하              | **Log4j2** | garbage-free 모드. Logback AsyncAppender는 큐 사용으로 가비지 다량 생성 |

---

## 5. 선택 기준[^1]

- **일반 Spring Boot 서비스** → Logback 유지가 실용적. 동기 로깅 중심이면 교체 이득이 크지 않다.
- **고처리량·저지연 로깅** (대량 이벤트 기록, GC 민감 서비스) → Log4j2 Async Logger + garbage-free가 우위.
- **멀티 JVM이 한 파일에 기록** → Logback prudent mode.
- 어느 쪽이든 애플리케이션 코드는 SLF4J API로 작성해 구현체 교체 여지를 남긴다.

[^1]: 이 기준은 출처의 직접 권고가 아니라 2·3·4장의 사실(비동기 성능, garbage-free, prudent mode)로부터 도출한 일반적 권고임.

---

## Sources
- [Apache Log4j — Asynchronous Loggers](https://logging.apache.org/log4j/2.x/manual/async.html)
- [Apache Log4j — Garbage-free Logging](https://logging.apache.org/log4j/2.x/manual/garbagefree.html)
- [Logback Manual](https://logback.qos.ch/manual/index.html)
- [Spring Boot Reference — Logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [CVE-2021-44228 (Log4Shell)](https://nvd.nist.gov/vuln/detail/CVE-2021-44228)

---

## Related pages
- [[logback]]
- [[log4j2]]
- [[design-patterns-structural]]
- [[gc]]
- [[externalized-configuration]]
