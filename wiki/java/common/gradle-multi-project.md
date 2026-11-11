---
title: Gradle 멀티 프로젝트
updated: 2026-11-11 22:55:59
tags:
  - java
  - gradle
  - build-tool
  - multi-project
---

## 1. 개요

멀티 프로젝트 빌드는 여러 프로젝트를 하나의 Gradle 빌드로 관리하는 방식이다. 프로젝트마다 소스 코드와 빌드 설정을 나누면서, 공통 빌드 로직은 함께 관리할 수 있다.

```text
my-project/
├── settings.gradle
├── app/
│   └── build.gradle
├── api/
│   └── build.gradle
└── shared/
    └── build.gradle
```

`settings.gradle(.kts)`에서 하위 프로젝트를 포함하고, 각 프로젝트의 `build.gradle(.kts)`에서 플러그인·의존성·Task를 설정한다.

## 2. 하위 프로젝트 선언

`include()`에 프로젝트 경로를 지정한다. 경로의 콜론은 디렉터리 계층을 나타내므로 `services:api`는 `services/api` 디렉터리에 대응한다.

```groovy
// settings.gradle
rootProject.name = 'my-project'
include 'app', 'shared', 'services:api'
```

포함한 프로젝트에 해당하는 디렉터리는 빌드에 필요하다. 다른 위치에 프로젝트를 두거나 빌드 파일 이름을 바꾸려면 프로젝트 디스크립터를 설정한다.

```groovy
include 'api'
project(':api').projectDir = file('modules/public-api')
project(':api').buildFileName = 'api.gradle'
```

`rootProject.name`은 빌드의 루트 이름을 안정적으로 유지하도록 명시하는 것이 좋다. 지정하지 않으면 Gradle이 빌드 디렉터리 이름을 사용한다. 프로젝트 이름은 소문자와 하이픈을 사용하고, 특별한 이유가 없다면 디렉터리 이름과 일치시킨다.

## 3. 프로젝트 간 의존성

다른 프로젝트의 코드를 사용하려면 `project()`로 의존성을 선언한다. 예를 들어 `app`이 `shared`를 사용하는 경우 다음처럼 설정한다.

```groovy
// app/build.gradle
dependencies {
    implementation project(':shared')
}
```

Gradle은 의존 대상 프로젝트를 먼저 빌드하고 그 산출물을 `app`의 클래스패스에 추가한다. 따라서 `./gradlew :app:build`는 필요한 `shared`의 Task도 실행한다.

## 4. 공통 빌드 설정

### 4.1. 프로젝트 간 직접 설정

루트 프로젝트의 `allprojects {}`와 `subprojects {}` 블록은 다른 프로젝트의 설정을 한곳에서 변경한다. `allprojects {}`는 현재 프로젝트와 하위 프로젝트에, `subprojects {}`는 하위 프로젝트에 적용된다.

```groovy
subprojects {
    apply plugin: 'java-library'
}
```

이 방식은 각 프로젝트의 빌드 파일만 읽어서는 적용된 설정을 알기 어렵게 만든다. Gradle은 프로젝트 간 설정 결합을 줄이고, 각 프로젝트가 명시적으로 플러그인을 적용하는 방식을 권장한다.

### 4.2. 공통 설정의 대안

| 공유할 내용 | 사용할 기능 |
|---|---|
| 플러그인과 빌드 로직 | 컨벤션 플러그인 |
| 저장소 | `settings.gradle(.kts)`의 `dependencyResolutionManagement` |
| 라이브러리와 플러그인 버전 | 버전 카탈로그(`gradle/libs.versions.toml`) |

저장소 선언을 중앙에서 관리하는 기능과 허용 정책은 [Gradle 저장소 중앙화 문서](https://docs.gradle.org/current/userguide/centralizing_repositories.html)를 참고한다.

## 5. 컨벤션 플러그인

컨벤션 플러그인은 여러 프로젝트가 공유하는 빌드 설정을 플러그인으로 만든 것이다. 각 프로젝트에서 플러그인을 명시적으로 적용하므로 공통 설정이 어디서 오는지 파악하기 쉽다.

작은 빌드에서는 `buildSrc`에 플러그인을 둘 수 있다. 빌드 로직이 커지거나 여러 빌드에서 재사용해야 하면 `build-logic` 같은 별도 빌드로 분리한다.

| 방식 | 위치 | 적합한 경우 |
|---|---|---|
| `buildSrc` | 루트의 `buildSrc/` 디렉터리 | 한 빌드에서 간단한 로직을 공유할 때 |
| 별도 빌드 | 예: `build-logic/` | 빌드 로직을 분리하거나 여러 빌드에서 재사용할 때 |

`build-logic`을 사용하는 기본 구조는 다음과 같다.

```text
my-project/
├── settings.gradle
├── build-logic/
│   ├── settings.gradle
│   └── build.gradle
├── app/build.gradle
└── shared/build.gradle
```

루트 `settings.gradle`에서 빌드 로직을 포함하고, 각 프로젝트에서 플러그인을 적용한다.
`build-logic` 안에는 `java-common-conventions` 플러그인을 정의해야 한다.

```groovy
// settings.gradle
pluginManagement {
    includeBuild('build-logic')
}

include 'app', 'shared'
```

```groovy
// app/build.gradle
plugins {
    id 'java-common-conventions'
}
```

컨벤션 플러그인 작성법과 빌드 로직 공유 방식은 [Gradle 빌드 로직 공유 문서](https://docs.gradle.org/current/userguide/sharing_build_logic_between_subprojects.html)를 참고한다.

---

## Sources
- [Gradle User Guide: Multi-Project Builds](https://docs.gradle.org/current/userguide/multi_project_builds.html)
- [Gradle User Guide: Sharing Build Logic between Subprojects](https://docs.gradle.org/current/userguide/sharing_build_logic_between_subprojects.html)
- [Gradle User Guide: Declaring Dependencies Basics](https://docs.gradle.org/current/userguide/declaring_dependencies_basics.html)
- [Gradle User Guide: Declaring Repositories Basics](https://docs.gradle.org/current/userguide/declaring_repositories_basics.html)
- [Gradle User Guide: Centralizing Repository Declarations](https://docs.gradle.org/current/userguide/centralizing_repositories.html)
- [Gradle User Guide: Centralizing Dependencies](https://docs.gradle.org/current/userguide/centralizing_dependencies.html)
- [Gradle User Guide: Composite Builds](https://docs.gradle.org/current/userguide/composite_builds.html)

---

## Related pages
- [[gradle]]
- [[gradle-task]]
