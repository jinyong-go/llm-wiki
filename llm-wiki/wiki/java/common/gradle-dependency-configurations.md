---
title: Gradle 의존성 Configuration
updated: 2026-08-31 17:33:58
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Gradle의 **Configuration**은 의존성을 용도별로 묶는 이름 있는 집합이다. 역할에 따라 세 종류로 나뉜다.

| 역할 | 의미 |
|---|---|
| Declarable(선언용) | 빌드 스크립트에서 의존성을 선언하는 대상. `implementation`/`api` 등 |
| Resolvable(해석용) | 선언된 의존성을 실제 클래스패스로 해석. `compileClasspath`/`runtimeClasspath` 등 |
| Consumable(노출용) | 다른 프로젝트가 이 프로젝트를 의존할 때 가져가는 대상. `apiElements`/`runtimeElements` 등 |

`java`/`java-library` 플러그인을 적용하면 이 세 역할의 표준 Configuration이 자동 생성된다. 이 문서는 실제로 의존성을 선언할 때 쓰는 **Declarable Configuration**을 중심으로 다룬다. `api`/`compileOnlyApi`는 `java-library` 플러그인 전용이며, 나머지는 `java` 플러그인만으로도 사용 가능하다.

---

## 2. 종류

실제로 의존성을 선언할 때 쓰는 Declarable Configuration은 아래와 같다.

### 2.1. implementation

프로덕션 코드의 컴파일·실행에 필요한 의존성. **컴파일 시점에는 선언한 프로젝트에서만 보이고, 이 프로젝트를 의존하는 소비자의 컴파일 클래스패스에는 노출되지 않는다** — 단, 런타임 클래스패스에는 전이적으로 노출된다([§3](#3-종합-비교) 참고). 내부 구현 세부사항을 숨겨 소비자의 불필요한 재컴파일을 줄이는 것이 목적이다.

```groovy
dependencies {
    implementation 'org.apache.commons:commons-lang3:3.5'
}
```

**기본적으로 `api`보다 `implementation`을 우선 사용한다** — 소비자의 컴파일 클래스패스를 오염시키지 않고, 내부 타입이 실수로 공개 API에 노출되면 소비자 쪽 컴파일이 즉시 실패해 조기에 발견할 수 있다.

### 2.2. api (java-library 전용)

소비자에게도 노출되어야 하는 의존성. 이 라이브러리의 **ABI**(Application Binary Interface)[^1]에 등장하는 타입이면 `api`로 선언해야 한다. 다음 중 하나에 해당하면 ABI 노출 대상이다(여기서 "공개"는 `public`뿐 아니라 컴파일러 관점에서 보이는 `protected`·package-private까지 포함한다):

- 슈퍼클래스·인터페이스로 사용되는 타입
- public 메서드의 파라미터·제네릭 타입
- public 필드 타입
- public 애노테이션 타입

반대로 메서드 본문에서만 쓰이거나, private 멤버·내부 클래스에서만 쓰이는 타입은 `implementation`으로 선언한다.

```groovy
dependencies {
    api 'org.apache.httpcomponents:httpclient:4.5.7'       // 생성자 파라미터로 노출
    implementation 'org.apache.commons:commons-lang3:3.5'  // 메서드 본문에서만 사용
}
```

`api` 의존성은 컴파일·런타임 양쪽 모두에서 소비자에게 전이적으로 노출된다.

### 2.3. compileOnly

서블릿 컨테이너가 제공하는 `servlet-api`, 어노테이션만 참조하고 처리 후 사라지는 `Lombok` 등 컴파일 시점에만 필요하고 런타임에는 없어도 되는 의존성에 사용한다. 컴파일 클래스패스에만 포함되고 런타임 클래스패스·소비자 어디에도 노출되지 않는다.

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok:1.18.30'
}
```

### 2.4. compileOnlyApi (java-library 전용)

`compileOnly`와 `api`를 합친 성격 — 컴파일 시점에만 필요하지만, 그 필요성이 **소비자에게도** 전이된다. 라이브러리의 public 시그니처에 등장하지만 런타임에는 필요 없는 타입에 쓴다. 예를 들어 셰이딩되어 배포되는 어노테이션 라이브러리가 여기 해당한다.

```groovy
dependencies {
    compileOnlyApi 'org.jspecify:jspecify:1.0.0'
}
```

### 2.5. runtimeOnly

런타임에만 필요하고 컴파일 시점에는 불필요한 의존성 — 컴파일 시점엔 인터페이스만 참조하고, 실제 구현체는 런타임에 클래스패스로 붙는 경우에 쓴다(예: JDBC 드라이버, SLF4J 구현체). 컴파일 클래스패스에는 포함되지 않고 런타임 클래스패스·소비자의 런타임 클래스패스에 노출된다.

```groovy
dependencies {
    runtimeOnly 'com.mysql:mysql-connector-j:8.3.0'
}
```

### 2.6. 테스트 전용 Configuration

`java` 플러그인은 테스트 소스셋 전용 Configuration을 별도로 제공하며, 대응하는 프로덕션 Configuration을 상속(extends)한다.

- **`testImplementation`**(`implementation` 상속) — 테스트 코드 컴파일·실행에 필요(예: JUnit). 프로덕션 `implementation` 의존성을 자동으로 함께 포함한다.
- **`testCompileOnly`** — 테스트 컴파일 시점에만 필요하고 런타임엔 불필요(예: 테스트 코드에서만 쓰는 Lombok).
- **`testRuntimeOnly`**(`runtimeOnly` 상속) — 테스트 실행 시점에만 필요(예: JUnit 엔진 구현체).

```groovy
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

### 2.7. annotationProcessor

컴파일 시점에 코드 생성을 수행하는 어노테이션 프로세서를 선언한다. 별도의 **annotation processing 클래스패스**로 취급되어 `compileClasspath`/`runtimeClasspath` 어디에도 포함되지 않는다.

```groovy
dependencies {
    annotationProcessor 'com.google.dagger:dagger-compiler:2.44'
    implementation 'com.google.dagger:dagger:2.44'  // 라이브러리 자체는 컴파일 클래스패스에도 필요
}
```

Lombok처럼 어노테이션 자체와 프로세서가 같은 아티팩트로 배포되는 경우, `compileOnly`와 `annotationProcessor`(테스트 코드에도 쓴다면 `testCompileOnly`/`testAnnotationProcessor`까지) 양쪽에 선언해야 한다 — 하나만 선언하면 컴파일 오류 또는 코드 생성 누락이 발생한다.

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'
    testCompileOnly 'org.projectlombok:lombok:1.18.30'
    testAnnotationProcessor 'org.projectlombok:lombok:1.18.30'
}
```

---

## 3. 종합 비교

| Configuration | 자신의 컴파일 CP | 자신의 런타임 CP | 소비자 컴파일 CP | 소비자 런타임 CP |
|---|:---:|:---:|:---:|:---:|
| `implementation` | O | O | X | O |
| `api` | O | O | O | O |
| `compileOnly` | O | X | X | X |
| `compileOnlyApi` | O | X | O | X |
| `runtimeOnly` | X | O | X | O |
| `annotationProcessor` | 별도(annotation processing 전용) | X | X | X |

(CP = classpath. `testImplementation`/`testCompileOnly`/`testRuntimeOnly`는 위 표의 프로덕션 대응 항목과 동일한 원리이되 대상이 테스트 소스셋으로 한정된다.)

**`implementation`이 "완전히 숨겨진다"는 오해에 주의** — 컴파일 클래스패스에서만 숨겨질 뿐, 런타임 클래스패스에는 전이적으로 노출된다. 완전히 숨기려면(컴파일·런타임 모두 비노출) 소비자가 필요로 하지 않는 진짜 내부 의존성이어야 하며, Gradle Configuration만으로는 런타임 노출 자체를 막을 수 없다.

Resolvable Configuration(`compileClasspath`/`runtimeClasspath`/`testCompileClasspath`/`testRuntimeClasspath`)은 위 Declarable Configuration들을 조합해 Gradle이 자동 구성하며, 직접 의존성을 선언하는 대상이 아니다.

| Resolvable Configuration | 구성(extends) |
|---|---|
| `compileClasspath` | `compileOnly` + `implementation` |
| `runtimeClasspath` | `runtimeOnly` + `implementation` |
| `testCompileClasspath` | `testCompileOnly` + `testImplementation` |
| `testRuntimeClasspath` | `testRuntimeOnly` + `testImplementation` |

---

## 4. 선택 기준

1. **기본값은 `implementation`.** 소비자 컴파일 클래스패스를 오염시키지 않는 안전한 기본 선택이다.
2. **`api`는 ABI에 등장할 때만.** [§2.2](#22-api-java-library-전용) 판단 기준에 해당하는 타입이 있을 때만 승격한다.
3. **런타임에만 필요하면 `runtimeOnly`.** 컴파일 시점엔 인터페이스·SPI만 참조하고 구현체는 런타임에 붙는 구조(JDBC 드라이버, 로깅 구현체)에 적합하다.
4. **컴파일에만 필요하면 `compileOnly`(+ 필요 시 `annotationProcessor`).** 런타임엔 컨테이너 등 다른 경로로 제공되거나, 코드 생성 후 사라지는 의존성에 적합하다.
5. **테스트 전용 의존성은 `test` 접두사 Configuration으로 격리.** 프로덕션 아티팩트(JAR)에 테스트 의존성이 섞이지 않는다.

[^1]: ABI(바이너리 인터페이스)는 소스 재컴파일 없이 바이너리(컴파일된 클래스 파일) 수준에서 유지되어야 하는 호환 규약이다. 여기서는 라이브러리의 컴파일된 클래스가 외부에 노출하는 타입 시그니처(상속 관계, public 메서드의 파라미터·반환 타입, public 필드, 애노테이션 타입)를 뜻한다.

---

## Sources

- Gradle User Guide — Java Library Plugin: https://docs.gradle.org/current/userguide/java_library_plugin.html
- Gradle User Guide — Java Plugin: https://docs.gradle.org/current/userguide/java_plugin.html
- Gradle User Guide — Dependency Management for Java Projects: https://docs.gradle.org/current/userguide/dependency_management_for_java_projects.html

---

## Related pages

- [[gradle]] — Gradle 개요(§7.2 Configuration 요약, §9.3 Maven scope 대응)
- [[gradle-task]] — Gradle Task
- [[gradle-multi-project]] — Gradle 멀티 프로젝트
