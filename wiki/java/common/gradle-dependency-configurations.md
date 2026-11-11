---
title: Gradle 의존성 Configuration
updated: 2026-11-11 22:55:03
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Gradle의 Configuration은 의존성을 선언하고, 해석하거나, 다른 프로젝트에 제공하는 이름 있는 집합이다. Java 플러그인이 만드는 Configuration은 다음 세 역할로 나뉜다.

| 역할 | 용도 | 예 |
|---|---|---|
| 선언(Declarable) | 빌드 스크립트에서 의존성을 선언 | `implementation`, `api` |
| 해석(Resolvable) | 의존성을 컴파일·실행 클래스패스로 구성 | `compileClasspath`, `runtimeClasspath` |
| 제공(Consumable) | 다른 프로젝트가 사용할 의존성 정보를 제공 | `apiElements`, `runtimeElements` |

보통 의존성을 추가할 때는 선언 역할의 Configuration을 사용한다. 이 문서는 Java 프로젝트에서 자주 쓰는 항목을 설명한다.

## 2. 자주 쓰는 Configuration

### 2.1. implementation

프로덕션 코드의 컴파일과 실행에 필요한 의존성을 선언한다. 라이브러리 프로젝트에서는 소비자의 컴파일 클래스패스에 노출되지 않지만, 소비자 런타임에는 전이적으로 포함된다. 대부분의 의존성은 `implementation`으로 선언한다.

```groovy
dependencies {
    implementation 'group:name:version'
}
```

### 2.2. api

`java-library` 플러그인을 적용한 라이브러리에서 사용한다. 라이브러리의 공개된 메서드 매개변수·반환형, 상속 관계처럼 소비자 코드가 컴파일할 때 필요한 의존성을 `api`로 선언한다.

```groovy
dependencies {
    api 'group:public-api-type:version'
    implementation 'group:internal-helper:version'
}
```

소비자가 라이브러리의 공개 API를 사용할 때 필요하지 않은 의존성은 `implementation`으로 둔다. ABI 세부 기준은 Gradle의 [Java Library 문서](https://docs.gradle.org/current/userguide/java_library_plugin.html)를 참고한다.

### 2.3. compileOnly

컴파일할 때만 필요하고 실행 환경에서 별도로 제공되는 의존성에 사용한다. 예를 들어 컨테이너가 제공하는 API나 어노테이션 프로세서가 처리하는 어노테이션이 이에 해당한다. 런타임 클래스패스에는 포함되지 않는다.

```groovy
dependencies {
    compileOnly 'group:name:version'
}
```

### 2.4. runtimeOnly

컴파일에는 필요하지 않고 애플리케이션 실행 때 필요한 의존성을 선언한다. JDBC 드라이버나 로깅 구현체처럼 인터페이스와 구현체를 분리한 경우에 쓸 수 있다.

```groovy
dependencies {
    runtimeOnly 'group:name:version'
}
```

### 2.5. 테스트 의존성

테스트에만 필요한 의존성은 `test` 접두사가 붙은 Configuration에 선언한다. 프로덕션 코드의 의존성은 테스트 컴파일·실행에도 포함된다.

```groovy
dependencies {
    testImplementation 'group:test-library:version'
    testRuntimeOnly 'group:test-engine:version'
}
```

`testImplementation`은 `implementation`을 상속하고, `testRuntimeOnly`는 `runtimeOnly`를 상속한다. 테스트 소스에서만 필요한 의존성은 `testCompileOnly`에 둔다.

## 3. 특수 용도 Configuration

### 3.1. compileOnlyApi

`java-library` 플러그인에서 컴파일 시에만 필요한 타입을 소비자의 컴파일 클래스패스에도 제공할 때 사용한다. 예를 들어 공개 API에 어노테이션 타입이 있지만, 해당 라이브러리를 실행할 때는 그 의존성이 필요하지 않은 경우에 적합하다.

```groovy
dependencies {
    compileOnlyApi 'group:annotation-api:version'
}
```

### 3.2. annotationProcessor

컴파일 중 코드를 생성하는 어노테이션 프로세서를 선언한다. 이 Configuration은 일반 컴파일·런타임 클래스패스와 분리되어 있다.

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok:<version>'
    annotationProcessor 'org.projectlombok:lombok:<version>'
}
```

프로세서가 생성한 코드를 테스트에서도 사용한다면 `testCompileOnly`와 `testAnnotationProcessor`에도 선언한다.

## 4. 클래스패스 비교

다음 표는 각 의존성을 선언한 프로젝트와 그 프로젝트를 사용하는 소비자에게 어떤 클래스패스가 구성되는지 보여준다. `O`는 포함, `X`는 미포함을 뜻한다.

| 선언 Configuration | 선언한 프로젝트의 컴파일 | 선언한 프로젝트의 런타임 | 소비자의 컴파일 | 소비자의 런타임 |
|---|:---:|:---:|:---:|:---:|
| `implementation` | O | O | X | O |
| `api` | O | O | O | O |
| `compileOnly` | O | X | X | X |
| `compileOnlyApi` | O | X | O | X |
| `runtimeOnly` | X | O | X | O |
| `annotationProcessor` | 별도 프로세서 경로 | X | X | X |

`implementation`은 컴파일 시 소비자에게 숨겨지지만 런타임 전이 의존성에는 포함된다. 따라서 소비자 런타임에도 포함하지 않아야 하는 의존성은 애초에 소비자가 사용하지 않도록 구성해야 한다.

Gradle은 선언 Configuration을 조합해 실제 컴파일·런타임 클래스패스를 만든다.

| 해석 Configuration | 포함하는 선언 Configuration |
|---|---|
| `compileClasspath` | `compileOnly`, `implementation` |
| `runtimeClasspath` | `runtimeOnly`, `implementation` |
| `testCompileClasspath` | `testCompileOnly`, `testImplementation` |
| `testRuntimeClasspath` | `testRuntimeOnly`, `testImplementation` |

## 5. 선택 기준

1. 기본적으로 `implementation`을 사용한다.
2. 라이브러리의 공개 API를 컴파일하는 데 필요한 의존성은 `api`로 선언한다.
3. 컴파일에만 필요하면 `compileOnly`, 실행에만 필요하면 `runtimeOnly`를 사용한다.
4. 테스트 전용 의존성은 `testImplementation`, `testCompileOnly`, `testRuntimeOnly` 중 용도에 맞는 항목에 둔다.
5. 코드 생성 프로세서는 `annotationProcessor`에 선언하고, 애노테이션 자체도 필요하면 `compileOnly`를 함께 쓴다.

---

## Sources
- [Gradle User Guide: Java Library Plugin](https://docs.gradle.org/current/userguide/java_library_plugin.html)
- [Gradle User Guide: Java Plugin](https://docs.gradle.org/current/userguide/java_plugin.html)
- [Gradle User Guide: Dependency Management for Java Projects](https://docs.gradle.org/current/userguide/dependency_management_for_java_projects.html)

---

## Related pages
- [[gradle]]
- [[gradle-task]]
- [[gradle-multi-project]]
