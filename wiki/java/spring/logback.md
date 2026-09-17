---
title: Logback — Spring Boot 설정
updated: 2026-07-08 10:32:15
tags:
  - java
  - spring
  - spring-boot
  - logging
  - logback
---

## 1. 개요

Logback은 **Spring Boot의 기본 로깅 구현체**다. 모든 starter가 의존하는 `spring-boot-starter-logging`에 포함되어 별도 의존성·설정 없이 즉시 동작한다. SLF4J를 네이티브로 구현하므로 브리지 어댑터가 필요 없다.

Log4j2와의 비교·선택 기준은 [[logging-frameworks]] 참고. Log4j2로 교체하는 방법은 [[log4j2]] 참고.

---

## 2. application.properties 설정

간단한 조정은 설정 파일만으로 가능하다 — 이 프로퍼티들은 구현체 무관하게 동작한다.

```properties
# 레벨 (루트/패키지별)
logging.level.root=INFO
logging.level.com.example.order=DEBUG
logging.level.org.springframework.web=WARN

# 파일 출력 (name과 path는 동시 지정 불가 — name 우선)
logging.file.name=/var/log/app/app.log

# 패턴
logging.pattern.console=%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n
```

### 2.1. 롤링 정책 (Boot 2.4+)

```properties
logging.logback.rollingpolicy.file-name-pattern=${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz
logging.logback.rollingpolicy.max-file-size=10MB
logging.logback.rollingpolicy.max-history=30
logging.logback.rollingpolicy.total-size-cap=1GB
logging.logback.rollingpolicy.clean-history-on-start=false
```

---

## 3. logback-spring.xml

프로퍼티로 부족한 세밀한 제어(appender 구성, 프로필 분기)는 XML로 한다.

> **파일명은 `logback.xml`이 아니라 `logback-spring.xml`을 권장한다.** `logback.xml`은 Spring 컨텍스트 초기화 **전에** Logback이 직접 로드하므로 `<springProfile>`/`<springProperty>` 같은 Spring 확장 태그가 동작하지 않는다. `-spring` 접미사 파일은 Spring Boot가 초기화를 제어한다.

### 3.1. Spring 확장 태그

```xml
<configuration>
  <!-- Environment 프로퍼티 참조 -->
  <springProperty scope="context" name="appName"
                  source="spring.application.name" defaultValue="app"/>

  <!-- 프로필별 분기 -->
  <springProfile name="local">
    <root level="DEBUG"><appender-ref ref="CONSOLE"/></root>
  </springProfile>
  <springProfile name="prod">
    <root level="INFO"><appender-ref ref="FILE"/></root>
  </springProfile>
  <!-- 프로필 표현식: name="dev | staging", name="!prod" -->
</configuration>
```

### 3.2. Appender 구성 예시

```xml
<configuration>
  <springProperty scope="context" name="appName" source="spring.application.name" defaultValue="app"/>

  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
  </appender>

  <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/var/log/${appName}/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
      <fileNamePattern>/var/log/${appName}/app.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
      <maxFileSize>10MB</maxFileSize>
      <maxHistory>30</maxHistory>
      <totalSizeCap>1GB</totalSizeCap>
    </rollingPolicy>
    <encoder>
      <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>
    </encoder>
  </appender>

  <!-- 비동기 래핑: 큐 기반. 처리량 한계는 logging-frameworks 참고 -->
  <appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
    <appender-ref ref="FILE"/>
    <queueSize>512</queueSize>
    <discardingThreshold>0</discardingThreshold>  <!-- 0: 가득 차기 전 이벤트 버리지 않음 -->
  </appender>

  <root level="INFO">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="ASYNC_FILE"/>
  </root>

  <logger name="com.example.order" level="DEBUG"/>
</configuration>
```

### 3.3. Boot 기본 설정 재사용

Spring Boot가 제공하는 기본 콘솔/파일 appender 정의를 include하여 확장할 수 있다.

```xml
<configuration>
  <include resource="org/springframework/boot/logging/logback/defaults.xml"/>
  <include resource="org/springframework/boot/logging/logback/console-appender.xml"/>
  <root level="INFO"><appender-ref ref="CONSOLE"/></root>
</configuration>
```

---

## 4. Appender 종류

| Appender | 용도 |
|---|---|
| `ConsoleAppender` | 콘솔(System.out/err) 출력 |
| `FileAppender` | 단일 파일 출력 (롤링 없음) |
| `RollingFileAppender` | 파일 출력 + 롤링 (운영 표준) |
| `AsyncAppender` | 다른 appender를 큐 기반 비동기로 래핑 (6장) |
| `SMTPAppender` | 이벤트 발생 시 이메일 발송 |
| `DBAppender` | DB 테이블에 저장 |
| `SocketAppender` / `SSLSocketAppender` | 원격 서버로 직렬화 이벤트 전송 |
| `SiftingAppender` | MDC 키 값별로 하위 appender를 동적 분리 |

### 4.1. ConsoleAppender

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `target` | `System.out` / `System.err` | `System.out` |
| `withJansi` | Windows에서 ANSI 색상 코드 지원 (Jansi 라이브러리 필요) | `false` |

```xml
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
  <target>System.out</target>
  <encoder>
    <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
  </encoder>
</appender>
```

### 4.2. FileAppender

롤링 없이 한 파일에 계속 기록한다. 운영에서는 파일이 무한히 커지므로 `RollingFileAppender`를 쓴다.

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `file` | 로그 파일 경로. 미존재 시 생성 | – |
| `append` | 기존 파일에 이어쓰기. `false`면 기동 시 truncate | `true` |
| `immediateFlush` | 이벤트마다 즉시 flush. `false`면 처리량↑, 크래시 시 버퍼 유실 위험 | `true` |
| `prudent` | 다중 JVM이 같은 파일에 안전 기록 (FileLock 기반, 성능 비용 큼. `append=true` 강제) | `false` |

### 4.3. RollingFileAppender

`FileAppender`를 상속하며 두 가지 협력자로 롤링을 수행한다.
- **rollingPolicy** — *무엇을* 할지: 파일 이름 변경·압축 방식 (5장)
- **triggeringPolicy** — *언제* 할지: 롤링 시점 판단

`TimeBasedRollingPolicy`·`SizeAndTimeBasedRollingPolicy`는 두 역할을 겸하므로 rollingPolicy만 지정하면 된다. `FixedWindowRollingPolicy`만 별도 `SizeBasedTriggeringPolicy`가 필요하다. 프로퍼티는 `FileAppender`와 동일하며(`file`은 생략 가능 — 생략 시 `fileNamePattern`으로만 운용), 정책별 상세는 5장.

```xml
<!-- 파일 appender의 대표 구성: 일 단위 + 10MB 크기 롤링 -->
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
  <file>/var/log/app/app.log</file>
  <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
    <fileNamePattern>/var/log/app/app.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
    <maxFileSize>10MB</maxFileSize>
    <maxHistory>30</maxHistory>
  </rollingPolicy>
  <encoder>
    <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>
  </encoder>
</appender>
```

### 4.4. SMTPAppender

이벤트를 `CyclicBuffer`에 쌓다가 **트리거 이벤트(기본: ERROR 이상) 도착 시** 버퍼 내용 전체를 메일 본문으로 발송한다 — 장애 직전 문맥이 함께 전달된다.

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `smtpHost` / `smtpPort` | SMTP 서버 | – / 25 |
| `to` / `from` / `subject` | 수신·발신·제목 (`subject`에 `%logger`, `%msg` 패턴 사용 가능) | – |
| `username` / `password` / `STARTTLS`·`SSL` | 인증·암호화 | – |
| `cyclicBufferTracker.bufferSize` | 메일에 포함할 최근 이벤트 수 | 256 |
| `evaluator` | 발송 트리거 조건 커스터마이즈 (`JaninoEventEvaluator` 등) | ERROR 이상 |

```xml
<appender name="EMAIL" class="ch.qos.logback.classic.net.SMTPAppender">
  <smtpHost>smtp.example.com</smtpHost>
  <to>oncall@example.com</to>
  <from>app@example.com</from>
  <subject>[%level] ${appName}: %logger - %msg</subject>
  <layout class="ch.qos.logback.classic.html.HTMLLayout"/>
</appender>
```

### 4.5. DBAppender

`logging_event`, `logging_event_property`, `logging_event_exception` 3개 테이블에 이벤트를 저장한다(스키마는 배포판 SQL 스크립트 제공). `connectionSource`로 `DataSourceConnectionSource`(커넥션 풀) 또는 `DriverManagerConnectionSource`를 지정한다. 이벤트당 INSERT가 발생하므로 대량 로깅에는 부적합하다.

### 4.6. SocketAppender / SSLSocketAppender

직렬화된 `ILoggingEvent`를 원격 수신 서버(`ServerSocketReceiver`)로 전송한다. 중앙 수집 구조를 만들 때 사용한다.

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `remoteHost` / `port` | 수신 서버 | – |
| `reconnectionDelay` | 연결 실패 시 재시도 간격 | 30s |
| `queueSize` | 전송 대기 큐 크기 | 128 |

### 4.7. SiftingAppender

discriminator(기본 `MDCBasedDiscriminator`)가 돌려주는 **키 값별로 하위 appender 인스턴스를 런타임에 생성·분리**한다. 사용자별·테넌트별 파일 분리가 대표 사례. `timeout` 경과 시 미사용 인스턴스를 정리한다.

```xml
<appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
  <discriminator>
    <key>userid</key>                      <!-- MDC.put("userid", ...) 값 -->
    <defaultValue>unknown</defaultValue>
  </discriminator>
  <sift>
    <!-- 키 값마다 이 템플릿으로 appender 인스턴스 생성 -->
    <appender name="FILE-${userid}" class="ch.qos.logback.core.FileAppender">
      <file>/var/log/app/user-${userid}.log</file>
      <encoder><pattern>%d %level %msg%n</pattern></encoder>
    </appender>
  </sift>
</appender>
```

---

## 5. 롤링 정책

`RollingFileAppender`에 `rollingPolicy`로 지정한다.

| 정책 | 트리거 | 특징 |
|---|---|---|
| `TimeBasedRollingPolicy` | 시간 | **주기는 `fileNamePattern`의 `%d` 패턴이 결정** — `%d{yyyy-MM-dd}` 일 단위, `%d{yyyy-MM-dd_HH}` 시간 단위, `%d{yyyy-MM}` 월 단위 |
| `SizeAndTimeBasedRollingPolicy` | 시간 + 크기 | 시간 롤링에 파일 크기 상한 추가. 패턴에 `%i`(같은 주기 내 인덱스) 필수 |
| `FixedWindowRollingPolicy` (+`SizeBasedTriggeringPolicy`) | 크기 | 크기 도달 시 `app.1.log → app.2.log` 식 인덱스 순환 |

**주요 프로퍼티**

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `fileNamePattern` | 롤링된 파일 이름 패턴. **확장자를 `.gz`/`.zip`으로 끝내면 자동 압축** | – |
| `maxHistory` | 보관할 롤링 파일 수 (시간 단위 기준 — 일 롤링이면 일수) | 0 (무제한) |
| `maxFileSize` | 파일당 최대 크기 (SizeAndTimeBased 전용) | – |
| `totalSizeCap` | 전체 아카이브 총량 상한. 초과 시 오래된 것부터 삭제 (`maxHistory`와 병용) | 0 (무제한) |
| `cleanHistoryOnStart` | 기동 시 보관 기한 지난 아카이브 삭제 | `false` |

> Boot 프로퍼티 `logging.logback.rollingpolicy.*`(2장)는 기본 파일 appender의 `SizeAndTimeBasedRollingPolicy`를 제어하는 축약이다.

---

## 6. 비동기

Logback의 비동기 수단은 `AsyncAppender` 하나다 — 다른 appender를 `BlockingQueue` 기반으로 래핑한다(3장 예시의 `ASYNC_FILE`). Disruptor 기반인 Log4j2 Async Logger와의 처리량 차이는 [[logging-frameworks]] 참고.

| 프로퍼티 | 설명 | 기본값 |
|---|---|---|
| `queueSize` | 내부 BlockingQueue 크기 | 256 |
| `discardingThreshold` | 큐 잔여가 이 값 이하면 TRACE/DEBUG/INFO 이벤트 폐기. **0이면 폐기 안 함** | queueSize/5 (80% 차면 폐기) |
| `neverBlock` | 큐가 가득 차도 블로킹하지 않고 즉시 폐기 (지연 민감 시) | `false` |
| `includeCallerData` | 호출자 정보(클래스·라인) 추출 — 비용 큼 | `false` |
| `maxFlushTime` | 종료 시 큐 비우기 대기 시간(ms) | 1000 |

---

## 7. 주의사항

- `logging.*` 프로퍼티와 `logback-spring.xml`이 겹치면 XML이 appender·패턴을 정의하는 한 XML이 기준이 된다. 레벨은 `logging.level.*`로 덮어쓸 수 있다.
- `AsyncAppender`는 `BlockingQueue` 기반 — 큐가 가득 차면 기본적으로 TRACE/DEBUG/INFO 이벤트를 버린다(`discardingThreshold`). 유실이 허용되지 않으면 0으로 설정하되 블로킹을 감수해야 한다.
- 여러 JVM이 같은 파일에 기록해야 하면 `<prudent>true</prudent>` 사용 (성능 비용 있음).

---

## Sources
- [Spring Boot Reference — Logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Logback Manual](https://logback.qos.ch/manual/index.html)
- [Logback Manual — Appenders](https://logback.qos.ch/manual/appenders.html)
- [Spring Boot Logback and Log4j2 Extensions | Baeldung](https://www.baeldung.com/spring-boot-logback-log4j2)

---

## Related pages
- [[logging-frameworks]]
- [[log4j2]]
- [[externalized-configuration]]
