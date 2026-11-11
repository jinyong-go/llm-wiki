---
title: Gradle Task
updated: 2026-11-11 22:58:23
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Task는 컴파일, 테스트, 파일 복사처럼 빌드에서 실행하는 작업이다. 플러그인이 제공하는 Task를 설정하거나, 빌드 스크립트에서 직접 등록할 수 있다.

Task를 사용할 때는 다음 세 단계를 구분한다.

| 단계 | 의미 |
|---|---|
| 등록 | Gradle에 Task를 알림 |
| 설정 | Task의 입력, 출력, 실행 조건을 지정 |
| 실행 | 요청한 Task와 필요한 선행 Task를 수행 |

## 2. Task 등록과 설정

### 2.1. 새 Task 등록

`tasks.register()`는 Task를 지연 등록한다. Gradle은 Task가 빌드에 필요할 때 설정하므로, 사용하지 않는 Task를 미리 모두 구성하지 않는다.

```groovy
tasks.register('hello') {
    doLast {
        println 'hello'
    }
}
```

`doFirst()`와 `doLast()`는 실행할 동작을 추가한다. `doFirst()`의 동작이 먼저 실행되고, `doLast()`는 뒤에 실행된다. 대부분의 경우에는 기존 Task를 연결하거나 전용 Task 타입을 사용하는 것이 적절하다.

### 2.2. 기존 Task 설정

이미 등록된 Task는 `tasks.named()`로 설정한다.

```groovy
tasks.named('test') {
    useJUnitPlatform()
}
```

`tasks.create()`처럼 Task를 즉시 만드는 방식은 사용하지 말고, 새 Task는 `register()`로 등록한다.

### 2.3. Task 표시 정보

`group`과 `description`을 지정하면 `./gradlew tasks` 출력에 Task의 분류와 설명이 표시된다.

```groovy
tasks.register('hello') {
    group = 'Help'
    description = 'Prints a greeting.'
}
```

## 3. Task 의존성과 실행 순서

`dependsOn`은 선행 Task를 실행 대상에 포함한다. `mustRunAfter`와 `shouldRunAfter`는 두 Task가 모두 실행 대상일 때만 순서를 정한다. `finalizedBy`는 대상 Task가 끝난 뒤 정리 Task를 실행할 때 사용한다.

| 선언 | 실행 대상에 미치는 영향 | 용도 |
|---|---|---|
| `dependsOn` | 지정 Task도 실행 | 선행 작업 지정 |
| `mustRunAfter` | 추가하지 않고 순서만 강제 | 두 Task의 필수 실행 순서 지정 |
| `shouldRunAfter` | 추가하지 않고 가능한 경우 순서 지정 | 선호하는 실행 순서 지정 |
| `finalizedBy` | 마무리 Task를 함께 실행 | 임시 서버 종료 등 정리 작업 |

```groovy
def prepare = tasks.register('prepare')
def packageApp = tasks.register('packageApp')
def cleanUp = tasks.register('cleanUp')

packageApp.configure {
    dependsOn prepare
    finalizedBy cleanUp
}
```

`./gradlew packageApp`은 `prepare`를 먼저 실행하고, 작업이 끝난 뒤 `cleanUp`을 실행한다. 반면 `mustRunAfter`만 선언하면 앞 Task를 자동으로 실행하지 않는다. 상세 실행 규칙은 [Task 실행 제어 문서](https://docs.gradle.org/current/userguide/controlling_task_execution.html)를 참고한다.

## 4. 조건에 따른 실행

`onlyIf`는 조건이 참일 때만 Task 동작을 실행한다. Task 자체를 비활성화하려면 `enabled`를 `false`로 설정한다.

```groovy
tasks.named('test') {
    onlyIf { providers.gradleProperty('runTests').isPresent() }
}
```

조건이 거짓이면 Task는 `SKIPPED`로 표시된다. 조건에 따라 생략되는 이유를 로그에서 확인하려면 `onlyIf`에 설명도 지정할 수 있다.

## 5. 증분 빌드와 입출력

Gradle은 Task의 입력과 출력이 이전 실행과 같으면 작업을 다시 수행하지 않을 수 있다. 사용자 정의 Task는 프로퍼티에 입력·출력 애너테이션을 붙여 Gradle이 변경 여부를 확인할 수 있게 해야 한다.

```groovy
abstract class WriteMessage extends DefaultTask {
    @Input
    abstract Property<String> getMessage()

    @OutputFile
    abstract RegularFileProperty getOutputFile()

    @TaskAction
    void write() {
        outputFile.get().asFile.text = message.get()
    }
}
```

입력·출력을 선언하지 않으면 Gradle은 Task를 안전하게 건너뛸지 판단하기 어렵다. 사용자 정의 Task와 증분 빌드의 자세한 규칙은 [증분 빌드 문서](https://docs.gradle.org/current/userguide/incremental_build.html)를 참고한다.

## 6. 자주 쓰는 Task 타입

Gradle과 플러그인은 파일 처리와 프로그램 실행에 사용할 수 있는 Task 타입을 제공한다.

| 타입 | 용도 | 대표 설정 |
|---|---|---|
| `Copy` | 파일 복사 | `from`, `into`, `include`, `exclude` |
| `Delete` | 파일·디렉터리 삭제 | `delete` |
| `Zip`, `Jar`, `Tar` | 아카이브 생성 | `from`, `archiveFileName`, `destinationDirectory` |
| `JavaExec` | Java 프로그램 실행 | `mainClass`, `classpath`, `args` |
| `Exec` | 외부 명령 실행 | `commandLine`, `workingDir`, `environment` |
| `Javadoc` | Java API 문서 생성 | `source`, `classpath`, `destinationDirectory` |

예를 들어 Java 프로그램을 실행하는 Task는 다음과 같이 등록한다.

```groovy
tasks.register('generateKey', JavaExec) {
    classpath = sourceSets.main.runtimeClasspath
    mainClass = 'com.example.tool.KeyGenerator'
    args '--out', 'build/key.p12'
}
```

Javadoc Task의 출력 위치 속성은 `destinationDirectory`다. 현재 Gradle DSL 문서에서 이 속성은 incubating으로 표시되므로, 사용하는 Gradle 문서에서 안정성 상태를 확인한다. Spring Boot의 `bootJar`, `bootWar`, `bootRun`은 [[gradle-application]]에서 설명한다.

---

## Sources
- [Gradle User Guide: More about Tasks](https://docs.gradle.org/current/userguide/more_about_tasks.html)
- [Gradle User Guide: Controlling Task Execution](https://docs.gradle.org/current/userguide/controlling_task_execution.html)
- [Gradle API: Task](https://docs.gradle.org/current/javadoc/org/gradle/api/Task.html)
- [Gradle API: TaskContainer](https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/TaskContainer.html)
- [Gradle DSL: Copy](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Copy.html)
- [Gradle DSL: Delete](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Delete.html)
- [Gradle DSL: Zip](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.bundling.Zip.html)
- [Gradle DSL: Exec](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Exec.html)
- [Gradle DSL: Javadoc](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.javadoc.Javadoc.html)
- [Gradle User Guide: Incremental Build](https://docs.gradle.org/current/userguide/incremental_build.html)
- [Gradle API: JavaExec](https://docs.gradle.org/current/javadoc/org/gradle/api/tasks/JavaExec.html)

---

## Related pages
- [[gradle]]
- [[gradle-multi-project]]
- [[gradle-application]]
