---
title: Gradle 멀티 프로젝트
updated: 2026-07-22 16:15:14
tags:
  - java
  - gradle
  - build-tool
  - multi-project
---

## 1. 개요

**멀티 프로젝트 빌드**는 하나의 루트 프로젝트와 하나 이상의 서브프로젝트로 구성되며, 전체 구조는 단일 `settings.gradle(.kts)` 파일에 정의된다. 모듈화, 병렬 실행, 빌드 로직 재사용을 위해 사용한다.

```
my-project/
├── settings.gradle     — 서브프로젝트 선언
├── build.gradle        — 루트 프로젝트 빌드 로직(선택)
├── app/
│   └── build.gradle
├── core/
│   └── build.gradle
└── util/
    └── build.gradle
```

각 서브프로젝트는 자체 빌드 로직·의존성·플러그인을 가질 수 있다.

---

## 2. settings.gradle(.kts) — 서브프로젝트 선언

### 2.1. include()

`include()`로 프로젝트 경로(project path)를 등록한다. 기본적으로 프로젝트 경로는 물리적 디렉터리 위치에 대응한다 — 예를 들어 경로 `services:api`는 루트 기준 `./services/api` 디렉터리에 매핑된다.

```groovy
rootProject.name = 'my-project'
include 'app', 'core', 'util'
```

중첩 구조는 콜론(`:`)으로 구분한다.

```groovy
rootProject.name = 'dependencies-java'
include 'api', 'shared', 'services:person-service'
```

Gradle 9.0.0부터, `include()`로 등록한 프로젝트의 디렉터리가 없거나 쓰기 불가능하면 빌드가 실패한다(이전에는 조용히 허용됨). 디렉터리를 설정 시점에 생성하려면 다음과 같이 한다.

```groovy
include 'project-without-directory'
project(':project-without-directory').projectDir.mkdirs()
```

### 2.2. 프로젝트 디스크립터로 이름·경로 커스터마이징

`project(":경로")`로 디스크립터에 접근해 이름, 디렉터리, 빌드 파일명을 변경할 수 있다.

```groovy
rootProject.name = 'main'
include('project-a')
project(':project-a').projectDir = file('custom/my-project-a')
project(':project-a').buildFileName = 'project-a.gradle'
```

중첩 디렉터리에 위치한 프로젝트는 `projectDir`을 명시하지 않으면 의도치 않은 빈 프로젝트가 생성될 수 있어 주의가 필요하다.

### 2.3. 이름 규칙 권장사항

- 서브프로젝트 이름은 커스터마이징하지 말고 기본값(디렉터리명)을 유지한다 — 어떤 프로젝트가 어느 폴더에 속하는지 추적하기 쉬움
- 모든 프로젝트명은 소문자 하이픈 표기(lower case hyphenation)를 사용한다
- `rootProject.name`을 반드시 명시한다 — 지정하지 않으면 컨테이너 디렉터리명을 사용하게 되어 체크아웃 위치에 따라 이름이 불안정해짐

---

## 3. 프로젝트 간 의존성

### 3.1. project() 함수

다른 서브프로젝트에 대한 의존성은 `project()` 함수로 선언한다.

```groovy
dependencies {
    implementation project(':utils')
    implementation project(':api')
}
```

프로젝트 의존성은 빌드 순서에도 영향을 준다 — 의존 대상 프로젝트가 먼저 빌드되고, 그 컴파일된 클래스와 전이 의존성이 소비 프로젝트의 클래스패스에 추가된다. 예를 들어 `./gradlew :api:compileJava`를 실행하면 `api`가 의존하는 `shared`가 먼저 빌드된다.

### 3.2. 타입세이프 프로젝트 접근자

`project(":경로")` 문자열은 오타·경로 변경 시 누락 위험이 있다. `settings.gradle(.kts)`에서 기능을 활성화하면 IDE 자동완성이 가능한 접근자를 쓸 수 있다(실험적 기능).

```groovy
enableFeaturePreview 'TYPESAFE_PROJECT_ACCESSORS'
```

```groovy
dependencies {
    implementation projects.utils
    implementation projects.api
}
```

---

## 4. build.gradle에서 공통 설정(cross-project configuration)

### 4.1. cross-project configuration이란

Gradle의 `Project` API가 제공하는 `allprojects {}`/`subprojects {}`는 한 프로젝트의 빌드 스크립트(보통 루트)에서 **다른 프로젝트들의 `Project` 객체에 직접 접근**해 그 프로젝트의 설정(리포지토리, 플러그인 적용, 의존성, Task 등)을 구성하는 방식이다. 즉 한 프로젝트의 빌드 스크립트가 자기 자신이 아니라 다른 프로젝트의 설정에 개입하는 것을 가리키며, 이를 **cross-project configuration**이라 부른다.

| 블록 | 적용 범위 |
|---|---|
| `allprojects {}` | 이 블록을 호출한 프로젝트(보통 루트) + 그 모든 서브프로젝트 |
| `subprojects {}` | 이 블록을 호출한 프로젝트의 서브프로젝트만(자기 자신 제외) |

```groovy
// 루트 build.gradle
allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply plugin: 'java-library'
    dependencies {
        testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
    }
}
```

### 4.2. 지양하는 이유

공식 문서는 이 방식을 "improper way"로 명시한다. 안에 무엇을 넣는지(플러그인·의존성·리포지토리·Task 등)와 무관하게 다음 문제가 동일하게 발생하기 때문이다.

- 서브프로젝트의 빌드 스크립트만 봐서는 자신에게 어떤 설정이 적용됐는지 알 수 없다 — 설정이 루트에서 암묵적으로 주입됨
- 프로젝트 수가 늘어날수록 조건 분기가 늘어 복잡도가 커진다
- 다른 프로젝트의 설정에 개입하는 구조이므로 프로젝트 간 **설정 시점(configuration-time) 결합**이 생기고, 이는 configuration-on-demand 같은 최적화를 방해할 수 있다

### 4.3. 대체 수단

cross-project configuration으로 흔히 하던 일은 각각 전용 대체 수단으로 옮기는 것이 현재 공식 권장 방향이다.

| 용도 | 대체 수단 |
|---|---|
| 플러그인 적용, 의존성 선언, Task 설정 등 빌드 로직 | 컨벤션 플러그인(§5, `buildSrc`/`build-logic`) — 서브프로젝트가 명시적으로 `plugins { id(...) }` 적용 |
| `repositories {}` | `settings.gradle(.kts)`의 `dependencyResolutionManagement { repositories {} }`(incubating) — `repositoriesMode`로 서브프로젝트의 개별 선언 허용/우선/금지까지 제어 가능 |
| 여러 모듈이 공유하는 의존성 버전 | 버전 카탈로그(`gradle/libs.versions.toml`) |

```groovy
// settings.gradle — allprojects { repositories {} } 대신
dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}
```

---

## 5. 컨벤션 플러그인

### 5.1. buildSrc

`buildSrc`는 빌드 루트에 위치하는 특수 디렉터리로, 존재하면 Gradle이 이를 **Composite Build**로 취급한다.

- 독립된 Gradle 프로젝트로 취급되어 자체 `build.gradle(.kts)`와 `src/`를 가짐
- 다른 빌드 스크립트가 평가되기 전에 먼저 컴파일됨
- 컴파일된 클래스·스크립트가 루트·모든 서브프로젝트 빌드 스크립트의 클래스패스에 제공됨

```
buildSrc/
├── build.gradle
└── src/main/groovy
    └── java-common-conventions.gradle
```

```groovy
// buildSrc/build.gradle
plugins {
    id 'groovy-gradle-plugin'
}
repositories {
    gradlePluginPortal()
}
```

`src/main/groovy`(또는 Kotlin은 `src/main/kotlin`)에 놓은 스크립트 파일은 그 자체로 **컨벤션 플러그인**이 되며, 플러그인 ID는 파일명에서 확장자를 뺀 값이다.

```groovy
// buildSrc/src/main/groovy/java-common-conventions.gradle
plugins {
    id 'java-library'
}
repositories {
    mavenCentral()
}
dependencies {
    implementation 'org.slf4j:slf4j-api:2.0.9'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.11.3'
}
tasks.named('test') {
    useJUnitPlatform()
}
```

서브프로젝트에서는 플러그인처럼 적용한다.

```groovy
// api/build.gradle
plugins {
    id 'java-common-conventions'
}
dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.17.1'
}
```

이후 공통 의존성 버전을 바꾸려면 `buildSrc`의 컨벤션 플러그인 한 곳만 수정하면 모든 서브프로젝트에 반영된다.

**제약**: 멀티 프로젝트 빌드에서 `buildSrc`는 하나만 허용되며 루트 프로젝트 디렉터리에 있어야 한다. 또한 `buildSrc`의 코드가 바뀌면 Configuration 단계가 무효화되어 전체 Task가 재실행되므로 빌드가 느려질 수 있다.

### 5.2. build-logic(별도 Composite Build)

`buildSrc` 대신, `build-logic` 같은 이름의 독립된 Composite Build로 빌드 로직을 분리할 수도 있다. 자체 `settings.gradle(.kts)`를 가진 완전히 별도의 빌드로, 여러 루트 빌드에서 재사용하기 쉽고 `buildSrc`처럼 코드 변경 시 전체 빌드를 무효화하지도 않는다.

```
build-logic/
├── build.gradle
├── settings.gradle
└── src/main/groovy
    └── java-common-conventions.gradle
```

`build-logic`은 독립된 빌드이므로, 루트 프로젝트가 그 안의 플러그인을 인식하려면 루트 `settings.gradle(.kts)`의 `pluginManagement {}` 블록에서 `includeBuild()`로 등록해야 한다.

```groovy
// (루트) settings.gradle
pluginManagement {
    includeBuild('build-logic')
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

rootProject.name = 'my-project'
include 'api', 'services', 'shared'
```

이렇게 등록하고 나면, 각 서브프로젝트의 `build.gradle(.kts)`에서는 `buildSrc`를 쓸 때와 동일하게 플러그인 ID로 적용한다 — 서브프로젝트 입장에서는 컨벤션 플러그인이 `buildSrc`에서 왔는지 `build-logic`에서 왔는지 구분할 필요가 없다.

```groovy
// api/build.gradle
plugins {
    id 'java-common-conventions'
}
```

---

## Sources
- Gradle User Guide — Multi-Project Builds: https://docs.gradle.org/current/userguide/multi_project_builds.html
- Gradle User Guide — Sharing Build Logic between Subprojects: https://docs.gradle.org/current/userguide/sharing_build_logic_between_subprojects.html
- Gradle User Guide — Declaring Dependencies Basics (Project Dependencies): https://docs.gradle.org/current/userguide/declaring_dependencies_basics.html
- Gradle User Guide — Declaring Repositories Basics: https://docs.gradle.org/current/userguide/declaring_repositories_basics.html
- Gradle User Guide — Centralizing Repository Declarations: https://docs.gradle.org/current/userguide/centralizing_repositories.html
- Gradle User Guide — Centralizing Dependencies: https://docs.gradle.org/current/userguide/centralizing_dependencies.html
- Gradle User Guide — Composite Builds: https://docs.gradle.org/current/userguide/composite_builds.html
- Gradle API — Project (allprojects/subprojects Javadoc): https://docs.gradle.org/current/javadoc/org/gradle/api/Project.html

---

## Related pages
- [[gradle]] — Gradle 개요
- [[gradle-task]] — Gradle Task: 타입, 등록 방법, 의존관계와 순서, 조건부 실행
