---
title: Log4j2 — Spring Boot 설정
updated: 2026-07-08 10:32:15
tags:
  - java
  - spring
  - spring-boot
  - logging
  - log4j2
---

## 1. 개요

Spring Boot에서 Log4j2를 쓰려면 기본 구현체(Logback)를 **제외하고 교체**해야 한다. 고처리량 Async Logger·garbage-free 모드가 필요할 때 선택한다 — 비교·선택 기준은 [[logging-frameworks]] 참고, 기본 구현체 설정은 [[logback]] 참고.

---

## 2. 의존성 교체

`spring-boot-starter-logging`(Logback)을 제외하고 `spring-boot-starter-log4j2`를 추가한다. 두 구현체가 클래스패스에 공존하면 충돌한다.

**Maven** — 전역 제외를 위해 각 starter(보통 대표 starter 하나)에 exclusion을 건다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

**Gradle** — 전역 exclude 또는 module replacement(공식 문서 권장) 중 택일.

```groovy
// 방법 1: 전역 제외
configurations.configureEach {
    exclude group: 'org.springframework.boot', module: 'spring-boot-starter-logging'
}
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-log4j2'
}

// 방법 2: module replacement
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-log4j2'
    modules {
        module('org.springframework.boot:spring-boot-starter-logging') {
            replacedBy 'org.springframework.boot:spring-boot-starter-log4j2', 'Use Log4j2 instead of Logback'
        }
    }
}
```

> starter에는 SLF4J 브리지(`log4j-slf4j2-impl`)가 포함되므로 애플리케이션 코드는 그대로 SLF4J API를 사용한다.

---

## 3. 설정 파일

> **파일명은 `log4j2.xml`이 아니라 `log4j2-spring.xml`을 권장한다.** [[logback]]과 같은 이유 — `-spring` 접미사여야 Spring Boot가 초기화를 제어해 `<SpringProfile>` 등 확장을 쓸 수 있다.

`classpath:log4j2-spring.xml`이 기본 탐지되며, 다른 위치는 `logging.config`로 지정한다. XML 외 JSON·YAML·properties 형식도 지원한다 (JSON은 `jackson-databind`, YAML은 `jackson-dataformat-yaml` 의존성 필요).

### 3.1. 기본 구성 예시

```xml
<Configuration status="WARN">
  <Properties>
    <Property name="LOG_PATTERN">%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n</Property>
  </Properties>

  <Appenders>
    <Console name="Console" target="SYSTEM_OUT">
      <PatternLayout pattern="${LOG_PATTERN}"/>
    </Console>

    <RollingFile name="File" fileName="/var/log/app/app.log"
                 filePattern="/var/log/app/app.%d{yyyy-MM-dd}.%i.log.gz">
      <PatternLayout pattern="${LOG_PATTERN}"/>
      <Policies>
        <TimeBasedTriggeringPolicy/>
        <SizeBasedTriggeringPolicy size="10MB"/>
      </Policies>
      <DefaultRolloverStrategy max="30"/>
    </RollingFile>
  </Appenders>

  <Loggers>
    <Logger name="com.example.order" level="DEBUG"/>
    <Root level="INFO">
      <AppenderRef ref="Console"/>
      <AppenderRef ref="File"/>
    </Root>
  </Loggers>
</Configuration>
```

### 3.2. Spring Boot 확장 (Boot 2.6+)

`log4j2-spring.xml`에서 프로필 분기와 Environment 프로퍼티 참조가 가능하다.

```xml
<Loggers>
  <!-- 프로필별 분기 (arbiter) -->
  <SpringProfile name="local">
    <Root level="DEBUG"><AppenderRef ref="Console"/></Root>
  </SpringProfile>
  <SpringProfile name="prod">
    <Root level="INFO"><AppenderRef ref="File"/></Root>
  </SpringProfile>
</Loggers>
```

```xml
<!-- Environment 프로퍼티 lookup -->
<Property name="appName">${spring:spring.application.name}</Property>
```

`logging.level.*` 등 `logging.*` 프로퍼티는 구현체 무관하게 그대로 동작한다 ([[logback]] 2장과 동일. 단 `logging.logback.*`는 제외).

---

## 4. Appender 종류

| Appender | 용도 |
|---|---|
| `Console` | 콘솔 출력 |
| `File` | 단일 파일 출력 (롤링 없음) |
| `RollingFile` | 파일 출력 + 롤링 (운영 표준) |
| `RollingRandomAccessFile` | RollingFile의 상시 버퍼 변형 — 처리량 더 높음 |
| `Async` | 다른 appender를 비동기로 래핑 (6장) |
| `Failover` | 주 appender 실패 시 보조 appender로 전환 |
| `Routing` | ThreadContext(MDC)·lookup 값에 따라 appender 동적 라우팅 |
| `SMTP` | 이벤트 발생 시 이메일 발송 |
| `JDBC` / `NoSQL` / `JPA` | DB 저장 |
| `Socket` / `Kafka` / `HTTP` | 원격·메시징 시스템 전송 |

### 4.1. Console

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `target` | `SYSTEM_OUT` / `SYSTEM_ERR` | `SYSTEM_OUT` |
| `follow` | `System.setOut()` 등으로 리다이렉트된 스트림 추적 | `false` |
| `direct` | `java.io.FileDescriptor` 직접 기록 — 더 빠름 (`follow`와 배타) | `false` |

```xml
<Console name="Console" target="SYSTEM_OUT">
  <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
</Console>
```

### 4.2. File / RollingFile / RollingRandomAccessFile

**File** — 롤링 없는 단일 파일. 운영에서는 `RollingFile`을 쓴다.

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `fileName` | 활성 로그 파일 경로 | – |
| `append` | 이어쓰기 | `true` |
| `immediateFlush` | 이벤트마다 즉시 flush. `false`면 처리량↑, 크래시 시 버퍼 유실 위험 | `true` |
| `bufferedIO` / `bufferSize` | 버퍼링 사용·크기 | `true` / 8192 |
| `locking` | OS 파일 락 사용 (다중 프로세스 기록, 성능 비용) | `false` |

**RollingFile** — `fileName`(활성 파일) + `filePattern`(롤링 파일 패턴, **`.gz`/`.zip` 확장자면 자동 압축**)을 지정하고, 롤링 시점·방식은 5장의 Policy/Strategy로 제어한다.

```xml
<!-- 파일 appender의 대표 구성: 일 단위 + 10MB 크기 롤링 -->
<RollingFile name="File" fileName="/var/log/app/app.log"
             filePattern="/var/log/app/app.%d{yyyy-MM-dd}.%i.log.gz">
  <PatternLayout pattern="${LOG_PATTERN}"/>
  <Policies>
    <TimeBasedTriggeringPolicy/>
    <SizeBasedTriggeringPolicy size="10MB"/>
  </Policies>
</RollingFile>
```

**RollingRandomAccessFile** — `RandomAccessFile` + 상시 `ByteBuffer`(기본 256KB) 기반 변형. `immediateFlush=false`와 조합하면 RollingFile 대비 처리량이 높다. Async Logger와 함께 고처리량 구성에 쓰인다.

### 4.3. Failover

주 appender 실패(예: 원격 전송 불가) 시 보조 목록으로 전환한다. `retryIntervalSeconds`(기본 60) 후 주 appender 복귀를 재시도한다.

```xml
<Failover name="Failover" primary="Kafka" retryIntervalSeconds="60">
  <Failovers>
    <AppenderRef ref="File"/>   <!-- Kafka 불가 시 로컬 파일로 -->
  </Failovers>
</Failover>
```

### 4.4. Routing

`Routes`의 `pattern`을 lookup(주로 `$${ctx:키}` — ThreadContext)으로 평가해 **이벤트마다 대상 appender를 동적 선택·생성**한다. Logback `SiftingAppender`에 대응.

| 요소/프로퍼티 | 설명 |
|---|---|
| `Routes pattern` | 라우팅 키 (`$${ctx:tenant}` 등, 런타임 평가라 `$$`) |
| `<Route key="...">` | 패턴 값이 key와 일치할 때의 appender 정의 |
| `<Route>` (key 없음) | 디폴트 라우트 — 키 값별 appender 동적 생성 템플릿 |
| `IdlePurgePolicy` | `timeToLive` 동안 미사용 appender 정리 |

```xml
<Routing name="Routing">
  <Routes pattern="$${ctx:tenant}">
    <Route>   <!-- tenant 값별 파일 동적 생성 -->
      <RollingFile name="Rolling-${ctx:tenant}"
                   fileName="/var/log/app/${ctx:tenant}.log"
                   filePattern="/var/log/app/${ctx:tenant}.%d{yyyy-MM-dd}.log.gz">
        <PatternLayout pattern="${LOG_PATTERN}"/>
        <TimeBasedTriggeringPolicy/>
      </RollingFile>
    </Route>
  </Routes>
  <IdlePurgePolicy timeToLive="15" timeUnit="minutes"/>
</Routing>
```

### 4.5. SMTP

기본적으로 **ERROR 이상 이벤트 발생 시** 내부 버퍼(기본 512개)에 쌓인 직전 이벤트들과 함께 메일을 발송한다. `to`/`from`/`subject`/`smtpHost`/`smtpPort`/`smtpUsername`/`smtpPassword`/`bufferSize`를 지정한다.

```xml
<SMTP name="Mail" to="oncall@example.com" from="app@example.com"
      subject="[ERROR] ${spring:spring.application.name}"
      smtpHost="smtp.example.com" bufferSize="512"/>
```

### 4.6. JDBC

`ConnectionSource`(`DataSource` JNDI 또는 `ConnectionFactory` 팩토리 메서드)로 커넥션을 얻어 `tableName` 테이블에 기록한다. `<Column>`/`<ColumnMapping>`으로 컬럼-패턴/이벤트 필드를 매핑하고, `bufferSize` 지정 시 배치 INSERT로 묶는다.

### 4.7. Socket / Kafka / HTTP

| Appender | 주요 프로퍼티 |
|---|---|
| `Socket` | `host`, `port`, `protocol`(TCP/UDP/SSL) — 원격 수집 서버 전송 |
| `Kafka` | `topic`, `<Property name="bootstrap.servers">` — Kafka 발행. 로깅 경로에 브로커 의존이 생기므로 `Failover`와 병용 권장 |
| `HTTP` | `url`, `method`, 헤더 `<Property>` — HTTP 엔드포인트 전송 |

---

## 5. 롤링 정책

### 5.1. Triggering Policy — 롤링 주기와 크기

`RollingFile`의 `<Policies>`에 지정하며, **복수 지정 시 하나라도 충족하면 롤링**된다.

| 정책 | 트리거 | 주요 프로퍼티 |
|---|---|---|
| `TimeBasedTriggeringPolicy` | 시간 | `interval` — **`filePattern`의 `%d` 최소 시간 단위의 배수** (패턴이 `yyyy-MM-dd`면 interval=1은 매일, 2는 격일). `modulate="true"` — 경계 정렬(예: 시간 단위 롤링을 정시에) |
| `SizeBasedTriggeringPolicy` | 크기 | `size` — `10MB`/`1GB` 등 |
| `CronTriggeringPolicy` | cron | `schedule` — cron 표현식 (`0 0 4 * * ?` 매일 04시) |
| `OnStartupTriggeringPolicy` | 기동 | JVM 시작 시 롤링. `minSize` — 이 크기 이상일 때만 |

### 5.2. Rollover Strategy — 보관 개수와 삭제

| 프로퍼티/요소 | 설명 | 기본값 |
|---|---|---|
| `DefaultRolloverStrategy max` | 같은 주기 내 `%i` 인덱스 최대 개수 | 7 |
| `<Delete>` 액션 | 조건 기반 아카이브 삭제 — `basePath`, `maxDepth`, `<IfFileName>`, `<IfLastModified age="30d">`, `<IfAccumulatedFileSize exceeds="1GB">` | – |

```xml
<RollingFile name="File" fileName="/var/log/app/app.log"
             filePattern="/var/log/app/app.%d{yyyy-MM-dd}.%i.log.gz">
  <PatternLayout pattern="${LOG_PATTERN}"/>
  <Policies>
    <TimeBasedTriggeringPolicy interval="1" modulate="true"/>
    <SizeBasedTriggeringPolicy size="10MB"/>
  </Policies>
  <DefaultRolloverStrategy max="20">
    <Delete basePath="/var/log/app" maxDepth="1">
      <IfFileName glob="app.*.log.gz"/>
      <IfLastModified age="30d"/>        <!-- 30일 지난 아카이브 삭제 -->
    </Delete>
  </DefaultRolloverStrategy>
</RollingFile>
```

> Logback과 달리 `maxHistory`·`totalSizeCap` 프로퍼티가 없고, 보관 기간·총량 제한은 `<Delete>` 액션으로 구현한다.

---

## 6. 비동기

Log4j2의 비동기는 두 수준이 있다 — **Async Logger**(Disruptor 기반, 권장)와 **Async Appender**(큐 기반 래핑). 성능 배경은 [[logging-frameworks]] 참고.

### 6.1. Async Logger

Log4j2 최대 강점인 Disruptor 기반 비동기 로깅.

```groovy
// LMAX Disruptor 의존성 필요
implementation 'com.lmax:disruptor:4.0.0'
```

```properties
# 모든 로거를 비동기로 (JVM 시스템 프로퍼티)
-Dlog4j2.contextSelector=org.apache.logging.log4j.core.async.AsyncLoggerContextSelector
```

전체가 아닌 일부만 비동기로 하려면 설정 파일에서 `<AsyncLogger name="..." level="...">`를 사용한다(동기·비동기 혼합).

### 6.2. Async Appender

Async Logger와 별개로, appender 수준의 큐 기반 비동기 래핑도 제공한다. Disruptor가 아닌 `ArrayBlockingQueue` 기반이라 Async Logger보다 처리량이 낮다 — Logback `AsyncAppender`에 대응하는 수단.

```xml
<Async name="AsyncFile">
  <AppenderRef ref="File"/>
</Async>
```

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `bufferSize` | 내부 큐 크기 | 1024 |
| `blocking` | 큐 가득 시 블로킹 여부. `false`면 error appender로 우회/폐기 | `true` |
| `shutdownTimeout` | 종료 시 큐 비우기 대기(ms) | 0 (무한) |

---

## 7. 주의사항

- **버전 관리**: log4j-core 2.x의 Log4Shell(CVE-2021-44228)은 2.17.1+에서 수정됨. Spring Boot 의존성 관리를 따르면 안전한 버전이 오지만, 버전을 수동 고정하는 경우 최신 유지 필수.
- Logback 제외가 누락된 모듈이 하나라도 있으면 `LoggerFactory` 바인딩 충돌 경고 또는 기동 실패가 발생한다 — 멀티 모듈 프로젝트에서는 전역 제외 방식이 안전하다.
- `log4j2.xml`(접미사 없음)을 쓰면 동작은 하지만 Spring 확장(`SpringProfile`, `spring:` lookup)이 동작하지 않고, Boot가 초기화를 완전히 제어하지 못한다는 경고가 남는다.

---

## Sources
- [Spring Boot Reference — Logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Spring Boot How-to — Configure Log4j for Logging](https://docs.spring.io/spring-boot/how-to/logging.html)
- [Apache Log4j — Appenders](https://logging.apache.org/log4j/2.x/manual/appenders.html)
- [Apache Log4j — Asynchronous Loggers](https://logging.apache.org/log4j/2.x/manual/async.html)
- [Spring Boot Logback and Log4j2 Extensions | Baeldung](https://www.baeldung.com/spring-boot-logback-log4j2)
- [CVE-2021-44228 (Log4Shell)](https://nvd.nist.gov/vuln/detail/CVE-2021-44228)

---

## Related pages
- [[logging-frameworks]]
- [[logback]]
- [[externalized-configuration]]
