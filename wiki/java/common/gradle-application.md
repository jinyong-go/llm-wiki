---
title: Gradle 애플리케이션 실행 구성
updated: 2026-11-11 22:52:39
tags:
  - java
  - gradle
  - build-tool
---

## 1. 실행 방식 선택

Gradle 애플리케이션을 실행하려면 시작할 메인 클래스와 실행에 필요한 클래스패스가 필요하다. 메인 클래스는 `public static void main(String[])` 메서드를 가진 클래스다. 클래스패스는 애플리케이션과 의존 라이브러리의 위치를 가리킨다.

| 방식 | 의존 라이브러리 위치 | 실행 방법 | 적합한 경우 |
|---|---|---|---|
| `application` 플러그인 | 배포본의 `lib/` 디렉터리 | 생성된 시작 스크립트 | 여러 라이브러리 파일을 포함해 배포할 때 |
| 일반 실행 JAR | 외부 파일 또는 디렉터리 | `java -jar` 또는 메인 클래스 직접 실행 | 단순한 JAR 구성이 필요할 때 |
| Fat JAR | JAR 파일 내부 | `java -jar` | 배포 파일을 하나로 만들 때 |
| Spring Boot JAR | `BOOT-INF/lib/` | `java -jar` | Spring Boot 애플리케이션을 배포할 때 |

## 2. application 플러그인

`application` 플러그인은 메인 클래스를 실행하는 Task와 배포용 시작 스크립트를 만든다. `mainClass`에는 패키지명을 포함한 클래스 이름을 지정한다.

```groovy
plugins {
    id 'application'
}

application {
    mainClass = 'com.example.Main'
    applicationName = 'my-app'
    applicationDefaultJvmArgs = ['-Xmx512m']
}
```

`./gradlew run`은 개발 환경에서 애플리케이션을 실행한다. `./gradlew installDist`는 애플리케이션 JAR과 런타임 의존성을 `lib/`에, 시작 스크립트를 `bin/`에 배치한다. `distZip`과 `distTar`는 이 배포본을 압축 파일로 만든다.

```text
build/install/my-app/
├── bin/
│   ├── my-app
│   └── my-app.bat
└── lib/
    ├── my-app.jar
    └── dependency.jar
```

`src/dist/`에 파일을 두면 배포본의 최상위 디렉터리에 포함된다. 모듈식 Java 애플리케이션은 `mainModule`도 지정한다.

## 3. 실행 가능한 JAR

### 3.1. 일반 JAR

`java -jar`로 실행할 JAR에는 매니페스트의 `Main-Class` 속성이 필요하다.

```groovy
tasks.jar {
    manifest {
        attributes 'Main-Class': 'com.example.Main'
    }
}
```

일반 JAR에는 프로젝트 클래스와 리소스가 들어가지만, 의존 라이브러리는 자동으로 합쳐지지 않는다. `application` 플러그인의 배포본을 사용하거나, 외부 라이브러리 경로를 매니페스트 `Class-Path`에 적어야 한다. 후자의 경우 의존 JAR을 함께 복사하고, 각 경로를 실행 JAR 기준의 상대 경로로 작성한다.

```groovy
tasks.register('copyDependencies', Copy) {
    from configurations.runtimeClasspath
    into layout.buildDirectory.dir('libs/lib')
}

tasks.jar {
    dependsOn 'copyDependencies'
    manifest {
        attributes(
            'Main-Class': 'com.example.Main',
            'Class-Path': configurations.runtimeClasspath.files.collect { "lib/${it.name}" }.join(' ')
        )
    }
}
```

매니페스트의 `Class-Path`는 와일드카드를 지원하지 않으므로 필요한 JAR을 각각 나열해야 한다. 의존성 구성은 [[gradle-dependency-configurations]]를 참고한다.

### 3.2. Fat JAR

Fat JAR은 런타임 의존성의 파일을 하나의 JAR에 합친다. 간단한 프로젝트는 `jar` Task에 의존 파일을 추가해 만들 수 있다.

```groovy
tasks.jar {
    manifest {
        attributes 'Main-Class': 'com.example.Main'
    }
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
}
```

원본 라이브러리의 서명 파일까지 합치면 실행 중 서명 검증 오류가 날 수 있다. 서비스 파일 병합이나 패키지 경로 변경이 필요하면 Shadow 플러그인을 사용한다.

```groovy
plugins {
    id 'application'
    id 'com.gradleup.shadow' version '<plugin-version>'
}

application {
    mainClass = 'com.example.Main'
}
```

`./gradlew shadowJar`로 결과물을 만든다. Shadow의 의존성 선택, 서비스 파일 병합, 패키지 경로 변경은 [[gradle-shadow]]에서 다룬다. 서명 파일 오류는 [[fat-jar-signature-error]]를 참고한다.

### 3.3. Spring Boot JAR

Spring Boot Gradle 플러그인의 `bootJar` Task는 의존 JAR을 `BOOT-INF/lib/`에 넣고 애플리케이션 클래스를 `BOOT-INF/classes/`에 배치한다. 메인 클래스는 `springBoot` 설정에서 명시할 수 있다.

```groovy
springBoot {
    mainClass = 'com.example.Main'
}
```

`./gradlew bootJar`로 실행 가능한 JAR을 만든다. `bootWar`를 사용할 때는 애플리케이션 클래스와 라이브러리가 WAR 내부의 `WEB-INF/` 아래에 배치된다. `java` 플러그인의 일반 JAR도 함께 생성되며, 필요하면 `jar` Task를 비활성화할 수 있다.

```groovy
tasks.named('jar') {
    enabled = false
}
```

## 4. 별도 Java 실행 Task

빌드 중 도구나 특정 클래스를 실행하려면 `JavaExec` Task를 등록한다. `classpath`에는 실행에 필요한 클래스와 라이브러리를, `mainClass`에는 시작할 클래스를 지정한다.

```groovy
tasks.register('generateKey', JavaExec) {
    classpath = sourceSets.main.runtimeClasspath
    mainClass = 'com.example.tool.KeyGenerator'
    args '--out', 'build/key.p12'
}
```

Task의 다른 타입과 등록 방식은 [[gradle-task]]를 참고한다.

## 5. JVM 클래스패스 주의사항

`java -jar app.jar`를 실행하면 지정한 JAR의 매니페스트가 실행 설정을 제공한다. 이때 `-cp` 또는 `-classpath`와 `CLASSPATH` 환경변수는 클래스 검색에 사용되지 않는다. 외부 라이브러리를 직접 지정하려면 JAR 실행 옵션 대신 메인 클래스를 지정한다.

```sh
java -cp 'app.jar:lib/*' com.example.Main
```

클래스패스의 `lib/*`는 해당 디렉터리 바로 아래의 JAR 파일을 가리킨다. 하위 디렉터리는 포함하지 않으며, 매니페스트 `Class-Path`에는 이 와일드카드 표기를 사용할 수 없다.

---

## Sources
- [Gradle User Guide: The Application Plugin](https://docs.gradle.org/current/userguide/application_plugin.html)
- [Gradle User Guide: The Java Plugin](https://docs.gradle.org/current/userguide/java_plugin.html)
- [Gradle User Guide: Declaring Dependencies Basics](https://docs.gradle.org/current/userguide/declaring_dependencies_basics.html)
- [Gradle Application Plugin: Unix start script template](https://github.com/gradle/gradle/blob/master/platforms/jvm/plugins-application/src/main/resources/org/gradle/api/internal/plugins/unixStartScript.txt)
- [Spring Boot Gradle Plugin: Packaging Executable Archives](https://docs.spring.io/spring-boot/gradle-plugin/packaging.html)
- [Shadow Gradle Plugin: Getting Started](https://gradleup.com/shadow/getting-started/)
- [Java SE 21 Tool Reference: java](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- `raw/troubleshoot/fat jar and sign error.md`

---

## Related pages
- [[gradle]]
- [[gradle-task]]
- [[gradle-multi-project]]
- [[fat-jar-signature-error]]
- [[jar-signing]]
- [[maven]]
- [[gradle-shadow]]
