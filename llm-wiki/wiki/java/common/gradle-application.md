---
title: Gradle 애플리케이션 실행 구성
updated: 2026-08-11 17:04:12
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

실행 가능한 Java 애플리케이션 빌드는 두 가지를 지정해야 한다.

- **메인 클래스** — `public static void main(String[])`을 가진 진입점
- **클래스패스** — 실행 시 로드할 클래스·jar 목록

두 값의 설정 위치는 패키징·실행 방식에 따라 달라진다.

| 방식 | 메인 클래스 | 의존 jar 위치 | 실행 |
|---|---|---|---|
| `application` 플러그인 | `application { mainClass }` | 배포본 `lib/` | `bin/<app>` 시작 스크립트 |
| 실행 가능 jar | `jar` 매니페스트 `Main-Class` | 매니페스트 `Class-Path`가 가리키는 외부 경로 | `java -jar` |
| Fat jar | `jar`/`shadowJar` 매니페스트 `Main-Class` | jar 내부에 전개 | `java -jar` |
| Spring Boot | `springBoot { mainClass }` | jar 내부 `BOOT-INF/lib` | `java -jar` |

---

## 2. 메인 클래스 지정

### 2.1. application 플러그인

`application` 플러그인을 적용하고 `mainClass`에 FQCN을 지정한다. 이 값은 `run` Task, 시작 스크립트, 매니페스트 생성에 모두 사용된다.

```groovy
plugins {
    id 'application'
}

application {
    mainClass = 'com.example.Main'
    applicationName = 'my-app'
    applicationDefaultJvmArgs = ['-Xmx512m', '-Dfile.encoding=UTF-8']
}
```

`mainClass`는 `Property<String>` 타입이다. 구버전에서 쓰던 `mainClassName`은 Gradle 8.0에서 제거되었으므로 `mainClass`를 쓴다.

JPMS 모듈 애플리케이션은 `mainModule`을 함께 지정한다.

```groovy
application {
    mainModule = 'com.example.app'
    mainClass = 'com.example.Main'
}
```

### 2.2. jar 매니페스트

`java -jar`로 실행하려면 JVM이 `META-INF/MANIFEST.MF`의 `Main-Class` 속성을 읽는다. `jar` Task의 `manifest` 블록에서 지정한다.

```groovy
jar {
    manifest {
        attributes 'Main-Class': 'com.example.Main'
    }
}
```

`application` 플러그인을 함께 적용했다면 값을 중복 기재하지 않고 참조한다.

```groovy
jar {
    manifest {
        attributes 'Main-Class': application.mainClass.get()
    }
}
```

### 2.3. JavaExec Task

특정 클래스를 실행하는 Task를 따로 만들 때는 `JavaExec`에 `mainClass`와 `classpath`를 함께 지정한다([[gradle-task]] §2.6).

```groovy
tasks.register('generateKey', JavaExec) {
    classpath = sourceSets.main.runtimeClasspath
    mainClass = 'com.example.tool.KeyGenerator'
    args '--out', 'build/key.p12'
}
```

### 2.4. Spring Boot

Spring Boot Gradle 플러그인은 아래 순서로 메인 클래스를 결정한다. 앞선 항목이 없을 때 다음으로 넘어간다.

1. `bootJar` Task의 `mainClass`
2. `springBoot` DSL의 `mainClass`
3. `application` 플러그인의 `mainClass`
4. 매니페스트 `Start-Class` 속성
5. main 소스셋 산출물에서 `public static void main(String[])`을 가진 클래스 자동 탐색

```groovy
springBoot {
    mainClass = 'com.example.ExampleApplication'
}
```

생성된 실행 jar의 매니페스트에는 `Main-Class`로 Spring Boot의 `JarLauncher`가, `Start-Class`로 위에서 결정된 애플리케이션 클래스가 기록된다.

---

## 3. 클래스패스 구성

### 3.1. 리포지토리 의존성

기본 방식은 `repositories`와 `dependencies` 선언이다([[gradle]] §7). Gradle이 의존성을 해석해 `compileClasspath`/`runtimeClasspath`를 자동 구성하므로 jar 경로를 직접 다룰 일이 없다.

| 소스셋 프로퍼티 | 구성 대상 |
|---|---|
| `sourceSets.main.compileClasspath` | `compileOnly` + `implementation` |
| `sourceSets.main.runtimeClasspath` | `runtimeOnly` + `implementation` + 컴파일 산출물 |
| `sourceSets.main.output` | 컴파일된 클래스(`build/classes/java/main`)와 리소스 |

### 3.2. 로컬 jar 파일

리포지토리에 없는 jar는 파일 의존성으로 선언한다.

```groovy
dependencies {
    implementation files('libs/vendor-sdk.jar', 'libs/vendor-crypto.jar')
    implementation fileTree('libs') { include '*.jar' }
}
```

`fileTree`는 디렉터리 내 jar를 일괄 포함하지만, 파일 순서가 보장되지 않아 Task 캐시 판정에 영향을 줄 수 있다. 대상이 고정적이면 `files`로 명시하는 편이 낫다.

파일 의존성은 전이 의존성을 해석하지 않으며, 발행되는 의존성 기술자에 포함되지 않는다.

### 3.3. 로컬 리포지토리

디렉터리를 리포지토리로 선언하는 `flatDir`도 있으나, 메타데이터(POM/Ivy XML)를 지원하지 않아 전이 의존성이 해석되지 않는다. 공식 문서는 로컬 파일 URL을 가진 Maven 리포지토리를 권장한다.

```groovy
repositories {
    maven { url = uri('file:///opt/repo/maven') }   // 권장
    flatDir { dirs 'libs' }                          // 비권장
}
```

---

## 4. lib 구성 방식

### 4.1. application 플러그인 배포본

`application` 플러그인은 애플리케이션 jar와 모든 런타임 의존성을 `lib/`에, 시작 스크립트를 `bin/`에 배치한 배포본을 생성한다.

| Task | 타입 | 산출물 |
|---|---|---|
| `run` | `JavaExec` | 로컬 실행 |
| `startScripts` | `CreateStartScripts` | Unix/Windows 시작 스크립트 |
| `installDist` | `Sync` | `build/install/<app>/` 디렉터리 |
| `distZip` / `distTar` | `Zip` / `Tar` | 배포 아카이브 |

```
build/install/my-app
├── bin
│   ├── my-app
│   └── my-app.bat
└── lib
    ├── my-app.jar
    ├── guava-32.1.2-jre.jar
    └── ...
```

생성된 시작 스크립트는 `lib/`의 jar를 하나씩 나열한 `CLASSPATH` 변수를 만들고 `java -classpath "$CLASSPATH" <mainClass>` 형태로 실행한다. 와일드카드나 `-jar`를 쓰지 않는다.[^1]

```sh
CLASSPATH=$APP_HOME/lib/my-app.jar:$APP_HOME/lib/guava-32.1.2-jre.jar
```

`src/dist/` 아래 파일은 배포본 루트에 그대로 포함되므로 설정 파일·README 등을 여기에 둔다.

### 4.2. lib 복사 + 매니페스트 Class-Path

`java -jar`를 유지하면서 의존성을 외부 디렉터리에 두려면, 의존 jar를 복사하고 매니페스트 `Class-Path`에 상대 경로를 나열한다.

```groovy
tasks.register('copyDeps', Copy) {
    from configurations.runtimeClasspath
    into layout.buildDirectory.dir('libs/lib')
}

jar {
    dependsOn 'copyDeps'
    manifest {
        attributes(
            'Main-Class': 'com.example.Main',
            'Class-Path': configurations.runtimeClasspath.collect { "lib/${it.name}" }.join(' ')
        )
    }
}
```

제약:

- `Class-Path` 값은 공백으로 구분한 상대 URL이며 **와일드카드를 지원하지 않는다**. jar를 전부 나열해야 한다.
- 경로 기준은 해당 jar의 위치다.
- `configurations.runtimeClasspath.collect`는 Configuration 단계에서 의존성 해석을 앞당겨 수행한다([[gradle]] §4.3).
- 의존성 목록이 빌드 시점에 고정되므로 `lib/` 내용이 바뀌면 jar를 다시 빌드해야 한다.

### 4.3. Fat jar

의존성을 jar 하나에 전개해 넣는 방식이다. `jar` Task로 직접 구성할 수 있다.

```groovy
jar {
    manifest {
        attributes 'Main-Class': 'com.example.Main'
    }
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

이 방식은 원본 jar의 서명 파일(`META-INF/*.SF`, `*.RSA`, `*.DSA`)까지 함께 포함되어 실행 시 `SecurityException`이 발생할 수 있다([[fat-jar-signature-error]]).

Shadow 플러그인은 서명 파일 제외, 서비스 파일 병합, 패키지 relocate를 처리한다. 플러그인 ID는 `com.gradleup.shadow`이며, 구 ID `com.github.johnrengelman.shadow`는 유지보수가 GradleUp으로 이관되었다.

```groovy
plugins {
    id 'application'
    id 'com.gradleup.shadow' version '<version>'
}

application {
    mainClass = 'com.example.Main'
}
```

`shadowJar`는 `application` 플러그인의 `mainClass`를 매니페스트에 반영하므로 별도 지정이 필요 없다.

### 4.4. Spring Boot bootJar

`bootJar`는 의존 jar를 전개하지 않고 `BOOT-INF/lib/`에 그대로 넣는다. 원본 jar가 보존되므로 서명 충돌 문제가 없다. `bootWar`는 `WEB-INF/lib/`, 배포용 WAR의 `runtimeOnly` 의존성은 `WEB-INF/lib-provided/`에 배치된다.

`java` 플러그인의 `jar` Task도 함께 동작해 `-plain` 분류자가 붙은 일반 jar가 추가로 생성된다. 불필요하면 비활성화한다.

```groovy
tasks.named('jar') {
    enabled = false
}
```

---

## 5. 주의

### 5.1. -jar와 -cp

`java -jar app.jar` 실행 시 지정한 jar가 **모든 사용자 클래스의 유일한 소스**가 되며, `-cp`/`-classpath` 옵션과 `CLASSPATH` 환경변수는 무시된다. 따라서 `java -cp "lib/*" -jar app.jar`는 의도대로 동작하지 않는다.

외부 클래스패스가 필요하면 `-jar`를 쓰지 않고 메인 클래스를 직접 지정한다.

```sh
java -cp "app.jar:lib/*" com.example.Main
```

### 5.2. 클래스패스 와일드카드

클래스패스 요소의 기본 이름이 `*`이면 JVM이 해당 디렉터리의 `.jar`/`.JAR` 파일 목록으로 전개한다. 하위 디렉터리는 탐색하지 않으며 전개 순서는 명세되지 않았다. 매니페스트 `Class-Path`에서는 사용할 수 없다.

---

## Sources
- Gradle User Guide — The Application Plugin: https://docs.gradle.org/current/userguide/application_plugin.html
- Gradle User Guide — The Java Plugin: https://docs.gradle.org/current/userguide/java_plugin.html
- Gradle User Guide — Declaring Dependencies Basics: https://docs.gradle.org/current/userguide/declaring_dependencies_basics.html
- Gradle User Guide — Supported Repository Types: https://docs.gradle.org/current/userguide/supported_repository_types.html
- Gradle User Guide — Upgrading from Gradle 7.x to 8.0: https://docs.gradle.org/current/userguide/upgrading_version_7.html
- Gradle 시작 스크립트 템플릿(unixStartScript.txt): https://github.com/gradle/gradle/blob/master/platforms/jvm/plugins-application/src/main/resources/org/gradle/api/internal/plugins/unixStartScript.txt
- Spring Boot Gradle Plugin — Packaging Executable Archives: https://docs.spring.io/spring-boot/gradle-plugin/packaging.html
- Shadow Gradle Plugin: https://gradleup.com/shadow/getting-started/
- Java SE 21 Tool Reference — java: https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html
- `raw/troubleshoot/fat jar and sign error.md`

[^1]: 시작 스크립트가 `-jar` 대신 `-classpath`를 쓰는 이유는 문서에 명시되어 있지 않다. §5.1의 제약상 `-jar`를 쓰면 `lib/`의 의존성을 로드할 수 없으므로, 외부 `lib/` 디렉터리 구조와 `-jar`가 양립할 수 없다는 점에서 도출한 추론이다.

---

## Related pages
- [[gradle]] — Gradle 개요, 의존성 관리
- [[gradle-task]] — Gradle Task 타입과 등록
- [[gradle-multi-project]] — Gradle 멀티 프로젝트
- [[fat-jar-signature-error]] — Fat Jar 서명 파일 충돌
- [[jar-signing]] — JAR 서명
- [[maven]] — Maven 빌드 방식
