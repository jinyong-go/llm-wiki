---
title: Gradle Task
updated: 2026-07-22 17:26:46
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

**Task**는 컴파일, JAR 생성, Javadoc 생성 등 빌드를 구성하는 **독립적인 작업 단위**다. Task는 내부적으로 `Action` 객체의 **순차 목록**으로 이뤄지며, Task가 실행되면 이 목록의 액션이 순서대로 실행된다.

Task를 다룰 때는 세 단계를 구분한다 — 이후 절에서 각각 다룬다.

| 단계 | 의미 |
|---|---|
| **등록(Registering)** | 빌드 로직에서 Task를 사용하겠다고 Gradle에 알림([§3](#3-등록-방법)) |
| **설정(Configuring)** | 등록된 Task의 입력·출력 등을 정의 |
| **구현(Implementing)** | 커스텀 Task 클래스를 작성([§2.10](#210-커스텀-타입)) |

---

## 2. 타입

Task는 크게 **타입 미지정(ad-hoc)**과 **타입 지정** 두 방식으로 만든다. 타입을 지정할 때는 `register()`의 두 번째 인자로 타입을 전달한다.

```groovy
tasks.register('myCopy', Copy) {
    from 'resources'
    into 'target'
    include '**/*.txt', '**/*.xml', '**/*.properties'
}
```

액션 안에서 `StopActionException`을 던지면 그 Task의 이후 액션만 건너뛰고, `StopExecutionException`을 던지면 그 Task 자체를 건너뛰고 다음 Task로 진행한다.

### 2.1. 타입 미지정(ad-hoc)

별도 타입 없이 `doFirst`/`doLast`로 액션만 추가하는 방식이다. `doFirst()`는 액션 목록 **맨 앞**에, `doLast()`는 **맨 뒤**에 추가한다.

```groovy
tasks.register('hello') {
    doFirst {
        println '맨 먼저 실행'
    }
    doLast {
        println '맨 나중 실행'
    }
}
```

### 2.2. Copy — 파일 복사

- 용도: 파일 복사(이름 변경·필터링 가능)
- 주요 프로퍼티/메서드
  - `from` — 복사할 소스 파일/디렉터리 지정
  - `into` — 복사 대상 디렉터리 지정
  - `include` — 포함할 파일 패턴(Ant 스타일) 지정
  - `exclude` — 제외할 파일 패턴 지정
  - `rename` — 파일명 변경 규칙 지정
  - `filter` — 파일 내용을 라인 단위로 치환·필터링
  - `expand` — 파일 내 `$property` 형태의 참조를 실제 값으로 치환

### 2.3. Delete — 파일·디렉터리 삭제

- 용도: 파일·디렉터리 삭제
- 주요 프로퍼티/메서드
  - `delete` — 삭제할 파일/디렉터리 지정
  - `followSymlinks` — 삭제 시 심볼릭 링크를 따라갈지 여부(기본값 `false`)

### 2.4. Zip / Jar / Tar — 아카이브 생성

- 용도: 아카이브 생성(`Jar`는 `Zip`의 서브타입)
- 주요 프로퍼티/메서드
  - `from` / `into` / `include` / `exclude` — `Copy`와 동일하게 아카이브에 포함할 파일 지정
  - `archiveFileName` — 생성될 아카이브 파일명
  - `archiveBaseName` — 아카이브 이름의 기본 부분(버전·분류자 제외)
  - `destinationDirectory` — 아카이브가 생성될 디렉터리

### 2.5. Exec — 외부 명령 실행

- 용도: 외부 명령 실행
- 주요 프로퍼티/메서드
  - `commandLine` — 실행 파일과 인자를 포함한 전체 커맨드 지정
  - `workingDir` — 프로세스를 실행할 작업 디렉터리(기본값: 프로젝트 디렉터리)
  - `args` — 실행 파일에 전달할 인자 추가
  - `environment` — 프로세스에 전달할 환경변수(기본값: 현재 프로세스 환경)
  - `standardOutput` — 표준 출력을 받을 스트림(기본값: `System.out`)

### 2.6. JavaExec — Java 애플리케이션 실행

- 용도: 별도 JVM 프로세스에서 Java 애플리케이션의 `main` 메서드 실행
- 주요 프로퍼티/메서드
  - `mainClass` — 실행할 메인 클래스 지정
  - `classpath` — 실행 시 사용할 클래스패스
  - `args` — 애플리케이션에 전달할 인자
  - `jvmArgs` — JVM 실행 인자 전달(`JavaForkOptions` 인터페이스가 제공 — `Test`도 같은 인터페이스를 구현해 `jvmArgs`를 동일하게 쓸 수 있음)
  - `systemProperty` — 실행 JVM에 시스템 프로퍼티 전달

### 2.7. Javadoc — Javadoc 생성

- 용도: Javadoc 생성
- 주요 프로퍼티/메서드
  - `source` — 문서화할 소스 파일(필수 — 지정하지 않으면 산출물이 생성되지 않음)
  - `classpath` — 소스 코드의 타입 참조를 해석할 클래스패스
  - `destinationDir` — 생성된 문서를 저장할 디렉터리
  - `options` — doclet·인코딩 등 Javadoc 생성 옵션

### 2.8. GradleBuild — 다른 Gradle 빌드 실행

- 용도: 다른 Gradle 빌드 실행
- 주요 프로퍼티/메서드
  - `dir` — 실행할 다른 Gradle 빌드의 루트 디렉터리(미지정 시 이 Task를 정의한 프로젝트 자신의 디렉터리가 기본값)
  - `tasks` — 그 빌드에서 실행할 Task 이름 목록

```groovy
tasks.register('nestedBuild', GradleBuild) {
    dir = file('../other-project')
    tasks = ['build']
}
```

### 2.9. 기타 — Spring Boot 프로젝트에서 자주 쓰는 Task

Spring Boot 프로젝트에서 자주 쓰는 Task다. `bootJar`/`bootWar`/`bootRun`은 Spring Boot Gradle 플러그인(`org.springframework.boot`)이 추가하며, `test`는 Spring Boot 전용이 아니라 `java` 플러그인이 제공하는 일반 Task다.

- **bootJar**
  - 용도: 의존성을 모두 포함한 실행 가능한 JAR 생성(`java -jar`로 실행). `java` 플러그인 적용 시 자동 등록되며 `assemble`이 이 Task에 의존
  - 주요 프로퍼티/메서드: `mainClass` — 메인 클래스 지정(미지정 시 `public static void main` 메서드를 자동 탐지), `archiveClassifier` — 아카이브 분류자

- **bootWar**
  - 용도: 의존성을 모두 포함한 실행 가능한 WAR 생성. `war` 플러그인 적용 시 자동 등록되며 `assemble`이 이 Task에 의존
  - 주요 프로퍼티/메서드: `mainClass`, `archiveClassifier` — `bootJar`와 동일

- **bootRun**
  - 용도: 아카이브로 패키징하지 않고 애플리케이션을 바로 실행. `JavaExec`의 서브타입이라 [§2.6](#26-javaexec--java-애플리케이션-실행)의 `mainClass`/`classpath`/`args`/`jvmArgs`/`systemProperty`를 그대로 상속
  - 주요 프로퍼티/메서드: `optimizedLaunch` — 개발 시 빠른 기동을 위한 JVM 최적화 여부(기본값 `true`, `bootRun` 고유 프로퍼티)

- **test**
  - 용도: 테스트 실행(`java` 플러그인이 제공하는 일반 Task)
  - 주요 프로퍼티/메서드: `useJUnitPlatform()` — JUnit 5(JUnit Platform) 기반 테스트 사용, `systemProperty` — 테스트 JVM에 시스템 프로퍼티 전달, `include`/`exclude` — 테스트 클래스 패턴 필터, `testLogging` — 콘솔 로깅 설정, `maxHeapSize`/`jvmArgs` — 테스트 JVM 힙 크기·인자 설정(`jvmArgs`는 `JavaExec`와 공유하는 `JavaForkOptions` 프로퍼티)

### 2.10. 커스텀 타입

Gradle이 제공하는 타입으로 부족하면 `DefaultTask`를 상속한 커스텀 Task 클래스를 만든다. 클래스는 `abstract`로 선언하고, 실제 동작은 `@TaskAction`을 붙인 메서드에 구현한다.

```groovy
abstract class MyCopyTask extends DefaultTask {
    @TaskAction
    void copyFiles() {
        fileTree('sourceDir').matching {
            include '**/*.txt'
        }.forEach { file ->
            file.copyTo(file.path.replace('sourceDir', 'destinationDir'))
        }
    }
}

tasks.register('myCustomCopy', MyCopyTask)
```

---

## 3. 등록 방법

### 3.1. tasks.register() — 지연 등록

```groovy
tasks.register('hello') {
    doLast {
        println 'hello'
    }
}
```

`register()`는 **지연 등록**이다 — Task 객체를 즉시 생성하지 않고, 실제로 그 Task가 필요할 때(빌드 대상 그래프에 포함될 때)까지 생성·설정을 미룬다(Task Configuration Avoidance). 필요 없는 Task까지 매번 설정하는 비용을 줄여 Configuration 단계 성능을 개선한다.

과거에는 `tasks.create("name")`으로 Task를 **즉시 생성**했다. `TaskContainer.create()` 계열 메서드는 모두 **공식적으로 deprecated**되었으며, 오래된 빌드 스크립트에서 이 패턴을 마주칠 수 있지만 새로 작성할 때는 `register()`를 쓴다.

### 3.2. tasks.named() — 기존 Task 설정

이미 등록된 Task를 나중에 참조·설정할 때 쓴다.

```groovy
tasks.named('myCopy') {
    into 'target'
}
```

> 블록 없이 즉시 실행되는 최상위 `copy { ... }` 같은 축약 문법은 Task Configuration Avoidance를 깨뜨리므로 권장하지 않는다.

### 3.3. 그룹·설명·숨김 Task

`group`/`description` 프로퍼티로 `./gradlew tasks` 출력에 표시되는 분류·설명을 지정한다.

```groovy
tasks.register('run') {
    group = 'Application'
    description = 'Runs this project as a JVM application.'
}
```

Gradle에는 Task를 "private"으로 지정하는 기능이 따로 없다. 다만 `group`이 없고 다른 Task의 의존 대상도 아닌 Task는 `./gradlew tasks` 목록에서 **숨겨진다**(hidden) — 실행은 여전히 가능하며, `./gradlew tasks --all`로는 숨겨진 Task까지 모두 볼 수 있다.

---

## 4. 의존관계와 순서

### 4.1. dependsOn — 의존성

가장 단순한 방식으로, 지정한 Task가 **함께 실행 대상에 포함**된다.

```groovy
tasks.register('taskX') {
    dependsOn 'taskY'
}
```

`taskX`를 실행하면 `taskY`가 먼저 실행된 뒤 `taskX`가 실행된다.

### 4.2. mustRunAfter / shouldRunAfter — 순서만 강제

**순서(ordering)**는 **의존성(dependency)**과 다르다 — 어떤 Task가 실행될지에는 영향을 주지 않고, 두 Task가 **모두 실행 대상에 포함됐을 때의 순서만** 정한다.

```groovy
def taskX = tasks.register('taskX') { doLast { println 'taskX' } }
def taskY = tasks.register('taskY') { doLast { println 'taskY' } }

taskY.configure {
    mustRunAfter taskX   // 또는 shouldRunAfter taskX
}
```

- `taskY.mustRunAfter(taskX)`만으로는 `taskY`만 실행해도 `taskX`가 함께 실행되지 않는다 — `taskX`와 `taskY`가 **둘 다 스케줄됐을 때만** 순서가 적용된다.
- **mustRunAfter**는 강제 규칙이다.
- **shouldRunAfter**는 더 약한 규칙으로, 다음 경우 무시된다: ① 그 규칙이 순환(cycle)을 만들 때, ② 병렬 실행 중 다른 의존성은 모두 충족됐는데 `shouldRunAfter` 대상만 안 끝난 경우.
- 둘 다 `--continue` 옵션으로 실행 시 앞 Task가 실패해도 뒤 Task가 실행될 수 있다 — **실행 의존성 자체를 만들지는 않기 때문**.

### 4.3. finalizedBy — 마무리 Task

지정한 Task가 스케줄되면, 대상 Task 실행 후 **성공·실패와 무관하게** 자동으로 함께 스케줄된다. 통합 테스트용으로 띄운 서버를 테스트 성패와 무관하게 종료하는 등의 정리(cleanup) 작업에 적합하다.

```groovy
def taskX = tasks.register('taskX') { doLast { println 'taskX' } }
def taskY = tasks.register('taskY') { doLast { println 'taskY' } }

taskX.configure { finalizedBy taskY }
```

`./gradlew taskX`를 실행하면 `taskX` 실패 여부와 무관하게 `taskY`도 실행된다.

---

## 5. 조건부 실행 — onlyIf

`onlyIf`로 술어(predicate)를 붙이면, 그 술어가 `true`를 반환할 때만 Task의 액션이 실행된다. 술어는 Task 실행 직전에 평가된다.

```groovy
def hello = tasks.register('hello') {
    doLast { println 'hello world' }
}

hello.configure {
    def skipProvider = providers.gradleProperty("skipHello")
    onlyIf("there is no property skipHello") {
        !skipProvider.present
    }
}
```

```bash
./gradlew hello -PskipHello   # SKIPPED로 출력
```

`onlyIf`에 넘긴 문자열은 Task가 건너뛰어진 이유로 `--info` 로그에 표시된다.

조건에 따라 스킵하는 게 아니라 Task를 **아예 완전히 비활성화**하려면 `enabled` 프로퍼티를 쓴다.

```groovy
tasks.named('hello') {
    enabled = false
}
```

---

## 6. 증분 빌드와 Task Input/Output

Gradle은 Task의 입력·출력이 이전 빌드와 달라지지 않았으면 액션을 건너뛰고 `UP-TO-DATE`로 표시한다(증분 빌드). 이 최적화가 동작하려면 Task가 최소 하나의 출력을 가져야 하고, 커스텀 Task 타입에서는 프로퍼티 getter에 `@Input`/`@InputFiles`/`@OutputDirectory`/`@OutputFile` 같은 애너테이션을 붙여 무엇이 입력이고 출력인지 Gradle에 알려야 한다. [§2.10](#210-커스텀-타입)의 `MyCopyTask` 예시는 이런 애너테이션이 없어 매 빌드마다 재실행된다.

```groovy
abstract class MyCopyTask extends DefaultTask {
    @InputDirectory
    abstract DirectoryProperty getSourceDir()

    @OutputDirectory
    abstract DirectoryProperty getDestinationDir()

    @TaskAction
    void copyFiles() {
        // ...
    }
}
```

---

## Sources
- Gradle User Guide — More about Tasks: https://docs.gradle.org/current/userguide/more_about_tasks.html
- Gradle User Guide — Controlling Task Execution: https://docs.gradle.org/current/userguide/controlling_task_execution.html
- Gradle API — Task (doFirst/doLast/dependsOn/mustRunAfter/finalizedBy Javadoc): https://docs.gradle.org/current/javadoc/org/gradle/api/Task.html
- Gradle API — TaskContainer (register 오버로드 Javadoc): https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/TaskContainer.html
- Gradle API — GradleBuild: https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/GradleBuild.html
- Gradle DSL — Copy: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Copy.html
- Gradle DSL — Delete: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Delete.html
- Gradle DSL — Zip: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.bundling.Zip.html
- Gradle DSL — Exec: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Exec.html
- Gradle DSL — Javadoc: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.javadoc.Javadoc.html
- Gradle User Guide — Incremental Build: https://docs.gradle.org/current/userguide/incremental_build.html
- Gradle DSL — Test: https://docs.gradle.org/current/dsl/org.gradle.api.tasks.testing.Test.html
- Spring Boot Gradle Plugin — Packaging Executable Archives: https://docs.spring.io/spring-boot/gradle-plugin/packaging.html
- Spring Boot Gradle Plugin — Running your Application with Gradle: https://docs.spring.io/spring-boot/gradle-plugin/running.html
- Gradle API — JavaExec: https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/JavaExec.html
- Gradle API — JavaForkOptions: https://docs.gradle.org/current/javadoc/org/gradle/process/JavaForkOptions.html

---

## Related pages
- [[gradle]] — Gradle 개요
- [[gradle-multi-project]] — Gradle 멀티 프로젝트
