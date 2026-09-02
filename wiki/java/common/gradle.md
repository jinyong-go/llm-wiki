---
title: Gradle
updated: 2026-08-31 17:21:44
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

**Gradle**은 빌드 스크립트에 정의된 정보를 바탕으로 빌드·테스트·배포를 자동화하는 빌드 도구다. 빌드 스크립트는 **Groovy** 또는 **Kotlin** DSL로 작성한다.

| 개념 | 의미 |
|---|---|
| Build | 결과물을 만드는 과정·환경. 하나 이상의 **Project**와 빌드 스크립트로 구성됨 |
| Project | 빌드 대상이 되는 소프트웨어 단위(애플리케이션, 라이브러리 등). 하나의 루트 Project와 여러 서브프로젝트로 구성될 수 있음 |
| Task | 컴파일·테스트 실행 등 빌드를 구성하는 최소 작업 단위. 빌드 스크립트나 플러그인이 등록함 |
| Build Script | `build.gradle(.kts)` — Task·의존성 등 빌드 방법을 정의하는 설정 파일 |
| Plugin | Gradle 기능을 확장하는 단위. Task·컨벤션을 프로젝트에 추가함 |
| Dependency | 프로젝트가 필요로 하는 외부/내부 리소스. Gradle이 빌드 시 자동으로 해석(resolve)함 |

프로젝트 루트에 `gradlew`/`gradlew.bat` 파일이 있으면 Gradle 프로젝트임을 나타낸다.

```
project
├── gradle                      — wrapper 파일 저장
├── gradlew / gradlew.bat       — wrapper 스크립트
├── settings.gradle(.kts)       — 루트 프로젝트명·서브프로젝트 정의
├── subproject-a
│   ├── build.gradle(.kts)
│   └── src/
└── subproject-b
    ├── build.gradle(.kts)
    └── src/
```

---

## 2. 설정 파일

빌드의 진입점은 `settings.gradle(.kts)` 파일이다. 프로젝트 구조(루트 프로젝트명, 서브프로젝트 목록)를 정의하며, 단일 프로젝트 빌드에서는 선택 사항이지만 멀티 프로젝트 빌드에서는 필수다. 설정 파일이 없으면 Gradle은 단일 프로젝트 빌드로 취급한다.

```groovy
rootProject.name = 'root-project'

include 'sub-project-a'
include 'sub-project-b'
```

---

## 3. Gradle Wrapper

Gradle 빌드를 실행하는 권장 방식이다. 지정된 버전의 Gradle을 필요 시 자동으로 다운로드해 실행하므로, 로컬에 Gradle을 설치하지 않아도 되고 팀·CI 환경 간 버전을 통일할 수 있다.

| 파일 | 역할 |
|---|---|
| `gradle/wrapper/gradle-wrapper.jar` | wrapper 코드. 지정 버전 Gradle을 다운로드·설치 |
| `gradle/wrapper/gradle-wrapper.properties` | wrapper 설정(배포판 URL, 타입 등) |
| `gradlew` | Unix용 실행 스크립트 |
| `gradlew.bat` | Windows용 실행 스크립트 |

```bash
./gradlew build          # wrapper로 빌드 (권장)
./gradlew --version       # 버전 확인
./gradlew :wrapper --gradle-version 7.2   # wrapper 버전 변경
```

wrapper 파일은 `gradle :wrapper` 명령으로 생성하며, 직접 수정하지 않는다.

---

## 4. 빌드 라이프사이클

빌드는 순서대로 실행되는 3단계로 구성된다.

### 4.1. Initialization

- `~/.gradle/init.d/*.gradle`의 init 스크립트를 먼저 실행한다(전역 환경 설정용, 예: 사내 리포지토리 강제 지정)
- `settings.gradle(.kts)`를 평가해 `Settings` 객체를 생성한다
- `include()`/`includeBuild()`로 지정된 프로젝트마다 `Project` 객체를 인스턴스화한다 — 이 시점까지는 아직 각 프로젝트의 빌드 스크립트를 읽지 않는다

### 4.2. Configuration

- Initialization에서 확정된 모든 프로젝트의 빌드 스크립트(`build.gradle(.kts)`)를 평가한다 — Task 등록, 프로퍼티 설정이 이 단계에서 이뤄짐
- 등록된 Task의 입출력을 분석해 **Task 그래프**(DAG)를 구성한다
- **Configuration Cache** 활성화 시, 이 단계에 직렬화 서브페이즈가 추가되어 Task 상태 일부와 의존성 해석까지 미리 수행하고 결과를 캐시에 저장한다(Execution 단계에서 재사용)

### 4.3. Execution

- Configuration 단계에서 만든 Task 그래프 중 요청된 Task와 그 의존 Task만 스케줄링해 실행한다
- 서로 의존하지 않는 Task는 병렬 실행 가능하다
- Configuration Cache 미사용 시, 의존성 그래프 해석(Dependency Graph Resolution)과 아티팩트 다운로드(Artifact Resolution)는 원칙적으로 이 단계에서 지연 수행된다 — 단, 빌드 스크립트가 `configuration.files`처럼 Configuration의 해석 결과를 즉시(eager) 참조하면 Configuration 단계에서 앞당겨 실행될 수 있다

### 4.4. Task 그래프(DAG)

전체 프로젝트의 Task는 방향성 비순환 그래프(Directed Acyclic Graph)를 구성한다. 예를 들어 `assemble`이 `build`에, `createDocs`가 `assemble`에 의존하도록 선언하면 `build → assemble → createDocs` 순서 그래프가 만들어진다. Gradle은 Task를 실행하기 전에 그래프 전체를 먼저 구성하며, 요청되지 않은 Task는 Configuration 단계에서도 실제로 설정(configure)되지 않을 수 있다(`tasks.register()`를 통한 Task Configuration Avoidance).

---

## 5. Task

Task는 컴파일, JAR 생성, Javadoc 생성 등 독립적인 작업 단위다. 다른 Task에 의존하도록 선언할 수 있으며, Gradle이 의존관계를 바탕으로 실행 순서를 결정하고 최신 상태(up-to-date)인 Task는 건너뛴다.

어떤 플러그인도 적용하지 않은 프로젝트에서 `gradle tasks`를 실행하면 아래 Task만 나타난다 — 즉 이 Task들은 Gradle 코어가 모든 프로젝트에 암묵적으로 적용하는 Help/Build Setup 관련 플러그인이 제공하며, 별도 등록·플러그인 적용 없이 항상 사용 가능하다.

| 분류 | Task | 비고 |
|---|---|---|
| Build Setup | `init`, `wrapper`, `updateDaemonJvm` | 루트 프로젝트에 자동 적용 |
| Help | `tasks`, `help`, `projects`, `properties`, `dependencies`, `dependencyInsight`, `buildEnvironment`, `javaToolchains`, `outgoingVariants`, `resolvableConfigurations`, `artifactTransforms` | 모든 프로젝트에 자동 적용 |

반면 아래 Task는 해당 플러그인을 적용해야만 나타난다.

| Task | 제공 플러그인 |
|---|---|
| `clean`, `assemble`, `check`, `build` | `base`(Base Plugin — `java` 등 언어 플러그인이 내부적으로 함께 적용) |
| `compileJava`, `classes`, `testClasses`, `jar`, `test`, `javadoc` | `java` / `java-library` |
| `run` | `application` |

```bash
./gradlew tasks    # 현재 적용된 플러그인 기준 사용 가능한 Task 목록(카테고리별)
./gradlew build    # build 및 의존 Task(compileJava, test, jar 등) 실행
```

`build` 실행 시 `compileJava → classes → jar → assemble → check → build` 순으로 의존 Task가 먼저 실행된다 — 순서는 직접 관리할 필요 없이 Gradle이 계산한다.

---

## 6. 플러그인

Gradle 코어는 의존성 해석·Task 오케스트레이션 등 기본 인프라만 제공하며, Java 컴파일·배포 등 대부분의 기능은 플러그인이 추가한다. 플러그인은 Task, Configuration(`implementation`/`runtimeOnly` 등), DSL 요소(`application {}` 등)를 추가할 수 있다.

### 6.1. Core 플러그인

Gradle 배포판에 포함되어 별도 버전 지정 없이 ID만으로 적용 가능하다.

| 플러그인 ID | 기능 |
|---|---|
| `base` | `clean`/`assemble`/`check`/`build` 등 라이프사이클 Task 제공 |
| `java` | Java 컴파일·테스트·JAR 패키징(`compileJava`/`test`/`jar`) |
| `java-library` | `java`에 `api`/`implementation` 구분을 추가한 라이브러리용 플러그인 |
| `application` | 실행 가능한 JVM 애플리케이션 빌드(`run`, 배포용 스크립트 생성) |
| `war` | WAR 아카이브 패키징 |
| `checkstyle` / `pmd` | 정적 코드 분석 |
| `jacoco` | 테스트 커버리지 측정 |
| `maven-publish` | Maven 리포지토리로 아티팩트 배포 |

### 6.2. Community 플러그인

Gradle Plugin Portal(plugins.gradle.org)에 배포된 서드파티 플러그인으로, ID와 버전을 함께 지정해 적용한다. 빌드 실행 시 Gradle이 자동으로 다운로드한다.

| 플러그인 ID | 기능 |
|---|---|
| `org.springframework.boot` | Spring Boot 애플리케이션 빌드·실행 가능한 JAR 생성 |
| `org.jetbrains.kotlin.jvm` | Kotlin 컴파일 지원(JetBrains 유지보수) |
| `com.diffplug.spotless` | 코드 포맷팅(ktlint/prettier/google-java-format 연동) |
| `com.github.spotbugs` | 정적 버그 탐지 |
| `com.google.protobuf` | Protocol Buffers 코드 생성 |

```groovy
plugins {
    id 'java-library'
    id 'org.springframework.boot' version '3.1.5'
}
```

### 6.3. Custom 플러그인

프로젝트 자체 컨벤션이나 여러 서브프로젝트가 공유할 로직을 직접 작성한 플러그인이다. Java/Kotlin/Groovy로 작성하며, 보통 `buildSrc` 또는 별도 included build에 위치시키고 이름으로 적용한다.

```groovy
plugins {
    id 'my.custom-conventions'
}
```

---

## 7. 의존성 관리

### 7.1. 리포지토리

의존성을 어디서 받아올지 `repositories {}` 블록에 선언한다. 선언하지 않으면 Gradle은 의존성을 해석할 수 없다.

```groovy
repositories {
    mavenCentral()
    google()
    maven { url 'https://repo.example.com/maven' }   // 사설 리포지토리
}
```

### 7.2. Configuration(의존성 버킷)

의존성은 용도별 **Configuration**으로 그룹화해 선언한다. `java`/`java-library` 플러그인을 적용하면 아래 Configuration이 자동 생성된다. 각 Configuration의 상세 역할·컴파일/런타임 클래스패스 노출 범위·선택 기준은 [[gradle-dependency-configurations]] 참고.

- **`implementation`** — 프로덕션 코드 컴파일·실행에만 필요. 이 Configuration으로 선언한 의존성은 소비자(이 라이브러리를 사용하는 다른 프로젝트)의 컴파일 클래스패스에 노출되지 않는다 — 내부 구현 의존성을 숨겨 재컴파일 범위를 줄이는 목적
- **`api`**(`java-library` 플러그인 전용) — 소비자에게도 노출되어야 하는 의존성. 이 라이브러리의 public API 타입 시그니처에 등장하는 의존성이면 `api`를 써야 함
- **`compileOnly`** — 컴파일 시점에만 필요하고 런타임에는 없어도 되는 의존성(예: Lombok, 서블릿 컨테이너가 런타임에 제공하는 `servlet-api`)
- **`runtimeOnly`** — 런타임에만 필요하고 컴파일 시점에는 불필요한 의존성(예: JDBC 드라이버, 로깅 구현체)
- **`testImplementation`** — 테스트 코드 컴파일·실행에만 필요(예: JUnit)

### 7.3. 의존성 선언

의존성 좌표는 `group:name:version` 형식이다.

```groovy
dependencies {
    implementation 'com.google.guava:guava:32.1.2-jre'
    api 'org.apache.juneau:juneau-marshall:8.2.0'
    compileOnly 'org.projectlombok:lombok:1.18.30'
    runtimeOnly 'com.mysql:mysql-connector-j:8.3.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
}
```

### 7.4. 의존성 트리 조회

```bash
./gradlew :app:dependencies    # Configuration별 의존성 트리 출력
```

### 7.5. 버전 카탈로그

`gradle/libs.versions.toml` 파일에 버전·라이브러리 좌표를 한 곳에서 관리하는 방식이다. `[versions]`/`[libraries]`/`[bundles]`/`[plugins]` 4개 섹션으로 구성되며, Gradle이 자동으로 인식해 빌드 스크립트에서 `libs` 접근자로 참조할 수 있게 한다.

```toml
[versions]
guava = "32.1.2-jre"

[libraries]
guava = { group = "com.google.guava", name = "guava", version.ref = "guava" }
```

```groovy
dependencies {
    implementation libs.guava
}
```

---

## 8. CLI 사용법

```
gradle [taskName...] [--option-name...]
```

```bash
gradle build                    # build 실행
gradle clean build              # clean 후 build
gradle build --build-cache      # 빌드 캐시 활성화
gradle :test                    # 루트 프로젝트의 test Task 실행
gradle :subproject:test         # 서브프로젝트의 test Task 실행(콜론으로 경로 구분)
```

wrapper 사용 시 `gradle` 대신 `./gradlew`(Unix/macOS) 또는 `gradlew.bat`(Windows)를 쓴다.

### 8.1. 자주 쓰는 옵션

| 옵션 | 설명 |
|---|---|
| `-x`, `--exclude-task` | 지정 Task를 실행에서 제외(의존 Task도 함께 제외) |
| `--continue` | Task 실패 후에도 의존관계가 끊기지 않은 나머지 Task를 계속 실행 |
| `--rerun-tasks` | up-to-date 체크를 무시하고 모든 Task를 강제로 재실행 |
| `--offline` | 네트워크 접근 없이 빌드(이미 캐시된 의존성만 사용) |
| `-U`, `--refresh-dependencies` | 의존성 상태를 강제로 새로 확인 |
| `--parallel` / `--no-parallel` | 프로젝트 단위 병렬 빌드 활성화/비활성화 |
| `--build-cache` / `--no-build-cache` | 빌드 캐시 활성화/비활성화 |
| `-q`, `--quiet` | ERROR 이상만 출력 |
| `-w`, `--warn` | WARN 이상 출력 |
| `-i`, `--info` | INFO 이상 출력(옵션 없을 때 기본은 LIFECYCLE) |
| `-d`, `--debug` | DEBUG(전체) 로그 출력 |
| `-s`, `--stacktrace` | 예외 발생 시 축약된 스택트레이스 출력 |
| `-S`, `--full-stacktrace` | 예외 발생 시 전체 스택트레이스 출력 |
| `-t`, `--continuous` | 소스 변경을 감지해 Task를 자동 재실행 |
| `--scan` | Build Scan(웹 기반 리포트) 생성 |
| `-p`, `--project-dir` | 시작 디렉터리 지정(기본값: 현재 디렉터리) |

```bash
./gradlew build -x test           # test Task를 제외하고 build 실행
./gradlew test --continue         # 실패해도 나머지 테스트 계속 실행
./gradlew build --offline         # 네트워크 없이 빌드
```

---

## 9. Maven과 비교

### 9.1. 빌드 스크립트 형식

- **Maven** — `pom.xml`. XML 기반 선언적 설정
- **Gradle** — `build.gradle(.kts)`. Groovy 또는 Kotlin DSL — 선언적 설정과 프로그래밍 로직을 함께 쓸 수 있음

### 9.2. 빌드 모델

- **Maven** — `default`/`clean`/`site` 3개의 고정된 라이프사이클을 제공하며, 각 라이프사이클은 정해진 순서의 phase(`validate`→`compile`→`test`→`package`→`verify`→`install`→`deploy`)로 구성된다. 플러그인의 goal을 각 phase에 바인딩하는 방식으로 동작을 채워 넣는다
- **Gradle** — 고정된 phase 목록 대신 Task 그래프(DAG, [§4.4](#44-task-그래프dag))를 구성해, 요청한 Task와 그 의존 Task만 실행한다. Task 간 의존관계를 자유롭게 정의할 수 있어 라이프사이클 자체를 프로젝트가 설계함

### 9.3. 의존성 범위 대응

| Maven scope | Gradle Configuration | 비고 |
|---|---|---|
| `compile`(기본값) | `implementation` / `api` | 소비자 노출 여부에 따라 구분(Maven은 구분 없음) |
| `provided` | `compileOnly` | 컴파일 시에만 필요, 런타임 제외 |
| `runtime` | `runtimeOnly` | 컴파일 시 불필요, 런타임에만 필요 |
| `test` | `testImplementation` | 테스트 코드 전용 |
| `system` | 없음(로컬 파일 직접 참조로 대체) | Gradle은 리포지토리를 거치지 않는 로컬 jar 의존성을 권장하지 않음 |

### 9.4. 빌드 성능

- **Gradle** — Incremental build, Build Cache(`--build-cache`), Configuration Cache, 상시 실행 데몬(daemon)을 코어 기능으로 기본 제공
- **Maven** — 빌드 캐시는 코어 기능이 아니라 `maven-build-cache-extension`을 프로젝트에 별도로 선언해야 활성화된다. 상시 데몬도 코어에 없으며, Apache 커뮤니티 프로젝트인 `mvnd`(Maven Daemon)가 Gradle에서 쓰이는 기법을 참고해 별도로 제공한다

---

## Sources
- Gradle User Guide — Gradle Basics: https://docs.gradle.org/current/userguide/gradle_basics.html
- Gradle User Guide — Settings File Basics: https://docs.gradle.org/current/userguide/settings_file_basics.html
- Gradle User Guide — Gradle Wrapper Basics: https://docs.gradle.org/current/userguide/gradle_wrapper_basics.html
- Gradle User Guide — Build Lifecycle: https://docs.gradle.org/current/userguide/build_lifecycle.html
- Gradle User Guide — Task Basics: https://docs.gradle.org/current/userguide/task_basics.html
- Gradle User Guide — Base Plugin: https://docs.gradle.org/current/userguide/base_plugin.html
- Gradle User Guide — Organizing Tasks: https://docs.gradle.org/current/userguide/organizing_tasks.html
- Gradle User Guide — Plugin Basics: https://docs.gradle.org/current/userguide/plugin_basics.html
- Gradle User Guide — Dependency Management Basics: https://docs.gradle.org/current/userguide/dependency_management_basics.html
- Gradle User Guide — Command-Line Interface Basics: https://docs.gradle.org/current/userguide/command_line_interface_basics.html
- Gradle User Guide — Command-Line Interface: https://docs.gradle.org/current/userguide/command_line_interface.html
- Gradle User Guide — Logging: https://docs.gradle.org/current/userguide/logging.html
- Gradle CLI 실행 결과(로컬 검증, Gradle 8.13) — 플러그인 미적용/`java` 플러그인 적용 시 `gradle tasks` 출력 비교, `gradle --help` 옵션 목록
- Apache Maven — Introduction to the Build Lifecycle: https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html
- Apache Maven — Introduction to the Dependency Mechanism: https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html
- Apache Maven — Build Cache Extension: https://maven.apache.org/extensions/maven-build-cache-extension/
- Apache maven-mvnd (GitHub): https://github.com/apache/maven-mvnd

---

## Related pages
- [[maven]] — Maven 빌드 방식(§9 Maven과 비교)
- [[gradle-multi-project]] — Gradle 멀티 프로젝트: settings.gradle 구성, 프로젝트 간 의존성, cross-project configuration과 컨벤션 플러그인
- [[gradle-task]] — Gradle Task: 타입, 등록 방법, 의존관계와 순서, 조건부 실행
- [[gradle-dependency-configurations]] — Gradle 의존성 Configuration 상세 비교: implementation/api/compileOnly/runtimeOnly 등
