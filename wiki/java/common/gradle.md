---
title: Gradle
updated: 2026-11-11 22:51:25
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Gradle은 소스 코드와 빌드 설정을 바탕으로 컴파일, 테스트, 패키징을 자동화하는 빌드 도구다. 빌드 스크립트는 Groovy DSL 또는 Kotlin DSL로 작성한다.

| 개념 | 설명 |
|---|---|
| 빌드(Build) | 소프트웨어를 만들고 검사하는 전체 과정 |
| 프로젝트(Project) | 애플리케이션이나 라이브러리처럼 빌드할 단위 |
| Task | 컴파일, 테스트, JAR 생성처럼 빌드에서 실행하는 작업 |
| 플러그인(Plugin) | 프로젝트에 Task와 빌드 설정을 추가하는 기능 묶음 |
| 의존성(Dependency) | 프로젝트가 사용하는 외부 또는 다른 프로젝트의 코드 |

일반적인 Gradle 프로젝트에는 다음 파일과 디렉터리가 있다.

```
project/
├── gradle/wrapper/             # Wrapper 설정과 실행 코드
├── gradlew                     # Unix 계열용 Wrapper 스크립트
├── gradlew.bat                 # Windows용 Wrapper 스크립트
├── settings.gradle(.kts)       # 빌드 이름과 포함할 프로젝트 설정
├── build.gradle(.kts)          # 이 프로젝트의 빌드 설정
└── src/                        # 소스 코드와 리소스
```

## 2. 설정 파일

`settings.gradle(.kts)`는 빌드에 포함할 프로젝트와 빌드 이름을 정한다. `build.gradle(.kts)`는 해당 프로젝트에 적용할 플러그인, 의존성, Task를 설정한다. 단일 프로젝트에서는 설정 파일에 기본값을 사용할 수 있지만, 멀티 프로젝트에서는 `settings.gradle(.kts)`로 하위 프로젝트를 포함한다.

```groovy
// settings.gradle
rootProject.name = 'sample'
include 'app', 'library'
```

자세한 멀티 프로젝트 구성은 [[gradle-multi-project]]를 참고한다.

## 3. Gradle Wrapper

Wrapper는 프로젝트가 지정한 Gradle 버전을 실행하는 스크립트다. 팀원과 CI가 같은 버전으로 빌드할 수 있고, Gradle을 미리 설치하지 않은 환경에서도 실행할 수 있다. 프로젝트에서는 `gradle` 대신 Wrapper를 사용한다.

```bash
./gradlew build        # Unix 계열에서 빌드
./gradlew --version    # 사용 중인 Gradle 버전 확인
```

Windows에서는 `gradlew.bat`을 실행한다. Wrapper의 버전 설정과 생성 방법은 [Gradle Wrapper 문서](https://docs.gradle.org/current/userguide/gradle_wrapper_basics.html)를 참고한다.

## 4. 빌드 실행 흐름

Gradle은 빌드를 세 단계로 처리한다.

1. **초기화(Initialization)**: 설정 파일을 읽고 빌드에 포함된 프로젝트를 찾는다.
2. **구성(Configuration)**: 프로젝트 빌드 스크립트를 읽어 Task와 Task 사이의 관계를 정한다.
3. **실행(Execution)**: 요청한 Task와 필요한 선행 Task를 실행한다.

예를 들어 `./gradlew build`를 실행하면 Gradle은 `build`에 필요한 Task를 찾아 실행 순서를 정한다. Task는 의존성에 따라 순서가 정해지며, 서로 의존하지 않는 Task는 병렬로 실행될 수 있다. 캐시와 단계별 동작은 [Gradle 빌드 수명 주기 문서](https://docs.gradle.org/current/userguide/build_lifecycle.html)를 참고한다.

## 5. Task와 플러그인

Task는 빌드의 작업 단위다. `java` 플러그인을 적용하면 Java 컴파일, 테스트, JAR 생성에 필요한 Task가 추가된다. 사용 가능한 Task를 확인하고 빌드하려면 다음 명령을 실행한다.

```bash
./gradlew tasks       # 사용 가능한 Task 확인
./gradlew build       # 플러그인이 제공하는 빌드 작업 실행
```

Gradle에는 기본 플러그인과 외부 플러그인이 있다. 기본 플러그인은 Gradle에 포함되어 있으며, 외부 플러그인은 빌드 스크립트에서 ID와 버전을 지정해 사용한다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '<plugin-version>'
}
```

Task의 종류와 등록 방법은 [[gradle-task]]를, 애플리케이션 실행과 패키징은 [[gradle-application]]을 참고한다.

## 6. 의존성 관리

Gradle은 저장소에서 의존성을 내려받고, 선언한 용도에 맞춰 컴파일·실행 클래스패스를 구성한다.

```groovy
repositories {
    mavenCentral()
}

dependencies {
    implementation 'group:name:version'
    testImplementation 'test-group:test-name:test-version'
}
```

`implementation`은 애플리케이션 코드의 컴파일과 실행에 쓰는 의존성이고, `testImplementation`은 테스트 코드에 쓰는 의존성이다. `api`, `compileOnly`, `runtimeOnly` 등 다른 Configuration의 선택 기준은 [[gradle-dependency-configurations]]를 참고한다.

의존성 트리는 다음 명령으로 확인한다.

```bash
./gradlew dependencies
```

## 7. 자주 쓰는 명령

Wrapper를 사용해 Task를 실행한다. 멀티 프로젝트에서는 `:프로젝트명:Task명` 형식으로 특정 프로젝트의 Task를 지정할 수 있다.

| 명령 | 용도 |
|---|---|
| `./gradlew tasks` | 사용 가능한 Task 확인 |
| `./gradlew clean build` | 이전 산출물을 지우고 빌드 |
| `./gradlew test` | 테스트 실행 |
| `./gradlew :app:test` | `app` 프로젝트의 테스트 실행 |
| `./gradlew build --offline` | 캐시에 있는 의존성만 사용해 빌드 |
| `./gradlew build --scan` | 빌드 결과를 Build Scan으로 확인 |

전체 옵션은 [Gradle 명령줄 인터페이스 문서](https://docs.gradle.org/current/userguide/command_line_interface.html)를 참고한다.

## 8. Maven과의 차이

Maven은 `pom.xml`과 정해진 빌드 수명 주기를 중심으로 설정한다. Gradle은 Groovy 또는 Kotlin 빌드 스크립트에서 Task와 의존 관계를 구성한다. 두 도구의 의존성 범위와 빌드 방식 비교는 [[maven]]을 참고한다.

---

## Sources
- [Gradle User Guide: Gradle Basics](https://docs.gradle.org/current/userguide/gradle_basics.html)
- [Gradle User Guide: Settings File Basics](https://docs.gradle.org/current/userguide/settings_file_basics.html)
- [Gradle User Guide: Gradle Wrapper Basics](https://docs.gradle.org/current/userguide/gradle_wrapper_basics.html)
- [Gradle User Guide: Build Lifecycle](https://docs.gradle.org/current/userguide/build_lifecycle.html)
- [Gradle User Guide: Task Basics](https://docs.gradle.org/current/userguide/task_basics.html)
- [Gradle User Guide: Plugin Basics](https://docs.gradle.org/current/userguide/plugin_basics.html)
- [Gradle User Guide: Dependency Management Basics](https://docs.gradle.org/current/userguide/dependency_management_basics.html)
- [Gradle User Guide: Command-Line Interface](https://docs.gradle.org/current/userguide/command_line_interface.html)

---

## Related pages
- [[maven]]
- [[gradle-multi-project]]
- [[gradle-task]]
- [[gradle-application]]
- [[gradle-dependency-configurations]]
