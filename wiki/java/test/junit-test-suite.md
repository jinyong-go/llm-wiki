---
title: JUnit 테스트 스위트 — @Suite, @Tag, Gradle/Maven 디스커버리·태그 필터링
updated: 2026-09-14 16:34:37
tags:
  - java
  - junit
  - testing
  - test-suite
  - gradle
  - maven
---

## 1. 개요

**테스트 스위트(Test Suite)**는 여러 테스트 클래스를 하나로 묶어 한 번의 실행으로 돌리는 단위다. 관련 테스트를 그룹화해 IDE에서 특정 묶음만 빠르게 실행하거나, 실행 구성을 코드로 명시할 때 쓴다.

다만 실무에서는 Gradle/Maven 같은 **빌드 도구가 테스트 디스커버리(자동 탐색)와 [[#5. 태그 필터링 (@Tag)|태그 필터링]]을 직접 지원**하므로, 명시적 `@Suite` 클래스 사용 빈도는 줄어드는 추세다. 스위트는 "코드로 묶음을 고정하고 싶을 때", 빌드 도구 필터는 "빌드/CI 레벨에서 묶음을 거를 때" 적합하다.

---

## 2. 의존성

### 2.1. JUnit 4

스위트 자체에 별도 의존성이 필요 없다. `junit:junit`(4.x)만 있으면 `@RunWith`·`@Suite.SuiteClasses`를 바로 쓸 수 있다.

```kotlin
testImplementation("junit:junit:4.13.2")
```

### 2.2. JUnit 5

`junit-platform-suite` 의존성이 필요하다. 집계(aggregator) 아티팩트로 `junit-platform-suite-api`(애너테이션)와 `junit-platform-suite-engine`(실행 엔진)을 함께 가져온다.

```kotlin
// Gradle
testImplementation("org.junit.platform:junit-platform-suite")
```
```xml
<!-- Maven -->
<dependency>
    <groupId>org.junit.platform</groupId>
    <artifactId>junit-platform-suite</artifactId>
    <scope>test</scope>
</dependency>
```

---

## 3. JUnit 4에서의 사용

JUnit 4는 실행기(Runner)를 교체하는 방식으로 스위트를 구성한다. 클래스를 직접 나열하는 것만 지원한다.

### 3.1. 설정 방법

빈 클래스에 `@RunWith(Suite.class)`와 `@Suite.SuiteClasses`를 붙이고, 묶을 테스트 클래스를 나열한다.

```java
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

@RunWith(Suite.class)
@Suite.SuiteClasses({
    CalculatorTest.class,
    UserServiceTest.class,
    OrderServiceTest.class
})
public class AllTests {
    // 본문은 비움 — 애너테이션이 모든 역할을 함
}
```

### 3.2. 주요 애너테이션

| 애너테이션 | 역할 |
|------------|------|
| `@RunWith(Suite.class)` | 실행기(Runner)를 Suite로 교체 |
| `@Suite.SuiteClasses({...})` | 묶을 테스트 클래스를 나열(클래스 지정만 지원) |

---

## 4. JUnit 5에서의 사용

JUnit 5에서는 **JUnit Platform Suite Engine**이 스위트를 실행한다. JUnit 4의 `@RunWith(JUnitPlatform.class)`(deprecated)을 대체한다.

### 4.1. 설정 방법

빈 클래스에 `@Suite`와 선택·필터 애너테이션을 붙인다.

```java
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.IncludeTags;

@Suite
@SelectPackages({ "com.example.app.moduleA", "com.example.app.moduleB" })
@IncludeTags("fast")
public class FastSuite {
}
```

```java
@Suite
@SuiteDisplayName("통합 테스트 스위트")
@SelectPackages("com.example.app")
@IncludeClassNamePatterns(".*IntegrationTest")
@ExcludeTags("slow")
public class IntegrationSuite {
}
```

### 4.2. 주요 애너테이션

`@Select*`로 **탐색 대상**을 정하고, `@Include*`/`@Exclude*`로 그중 **필터링**한다. `@Include*`/`@Exclude*`는 단독으로 쓸 수 없고 `@Select*`와 함께 써야 한다.

**Select — 탐색 대상 지정**

| 애너테이션 | 대상 |
|------------|------|
| `@SelectClasses` | 특정 클래스 |
| `@SelectPackages` | 패키지(하위 포함) |
| `@SelectClasspathResource` | 클래스패스 리소스 |
| `@SelectFile` / `@SelectDirectories` | 파일 / 디렉터리 |
| `@SelectModules` | 모듈 |
| `@SelectUris` | URI |

**Filter — 선택된 것 중 거르기**

| 애너테이션 | 기준 |
|------------|------|
| `@IncludeTags` / `@ExcludeTags` | 태그·[[#5.2 태그 표현식|태그 표현식]] |
| `@IncludePackages` / `@ExcludePackages` | 패키지 |
| `@IncludeClassNamePatterns` / `@ExcludeClassNamePatterns` | 클래스명 정규식 |
| `@IncludeEngines` / `@ExcludeEngines` | 테스트 엔진 ID |

> 다중 패턴은 OR 로직으로 결합된다.

**기타**

- `@SuiteDisplayName` — 리포트용 표시 이름
- `@ConfigurationParameter` — 디스커버리 구성 키-값 (`@DisableParentConfigurationParameters`로 상위 구성 비활성화)
- `@BeforeSuite` / `@AfterSuite` — 스위트 내 모든 테스트 전/후 1회 실행되는 `static` 메서드

---

## 5. 태그 필터링 (@Tag)

스위트와 빌드 도구 양쪽 필터링의 공통 기반은 `@Tag`다. 테스트 클래스/메서드에 라벨을 붙여 분류한다.

```java
@Test
@Tag("fast")
void quickCheck() { }

@Test
@Tag("slow")
@Tag("integration")   // @Tag는 반복 적용 가능 (@Tags 컨테이너)
void heavyCheck() { }
```

### 5.1. 태그 이름 규칙

태그는 trim 후 다음을 만족해야 한다. 위반하면 경고 로그 후 무시된다.

- blank(빈 문자열) 불가
- 공백·ISO 제어문자 불가
- 예약문자 `,` `(` `)` `&` `|` `!` 포함 불가

### 5.2. 태그 표현식

| 연산자 | 의미 | 예시 |
|--------|------|------|
| `!` | NOT | `!slow` |
| `&` | AND | `fast & unit` |
| `\|` | OR | `fast \| smoke` |
| `( )` | 그룹핑 | `(fast \| smoke) & !slow` |

### 5.3. 적용 위치

같은 태그 표현식을 세 곳에서 쓸 수 있다 — `@Suite`의 `@IncludeTags`/`@ExcludeTags`, Gradle의 `includeTags`/`excludeTags`, Maven의 `<groups>`/`<excludedGroups>`.

---

## 6. Gradle — 디스커버리·태그 필터링

### 6.1. 디스커버리

`useJUnitPlatform()`을 활성화하면 JUnit Platform이 테스트를 탐색한다. (JUnit 4식 자동 클래스 스캔과 달리 Platform 모드는 include/exclude 패턴 기반으로 동작한다.)

```kotlin
// build.gradle.kts
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
```

### 6.2. 태그 필터링

```kotlin
tasks.withType<Test>().configureEach {
    useJUnitPlatform {
        includeTags("fast")
        excludeTags("slow")
    }
}
```
```groovy
// build.gradle (Groovy)
tasks.withType(Test).configureEach {
    useJUnitPlatform {
        includeTags 'fast'
        excludeTags 'slow'
    }
}
```

### 6.3. 이름 기반 필터

`--tests` CLI 옵션과 `filter {}` 블록은 **태그가 아니라 클래스/메서드/패키지 패턴**으로 거른다.

```bash
./gradlew test --tests 'SomeTestClass'
./gradlew test --tests 'SomeTestClass.someMethod'
./gradlew test --tests '*IntegTest'
```
```kotlin
tasks.test {
    filter {
        includeTestsMatching("*IntegTest")
        includeTestsMatching("org.example.internal.*")
    }
}
```
`--tests`를 여러 개 주면 합집합으로 누적되고, 빌드 스크립트의 `filter`는 `--tests`와 함께 누적 제약으로 적용된다.

---

## 7. Maven Surefire — 디스커버리·태그 필터링

### 7.1. 디스커버리

Surefire는 기본적으로 다음 이름 패턴을 테스트 클래스로 탐색한다(중첩 클래스는 기본 제외).

- `**/Test*.java`
- `**/*Test.java`
- `**/*Tests.java`
- `**/*TestCase.java`

`<includes>`/`<excludes>`로 변경할 수 있다.

### 7.2. 태그 필터링

`<groups>`가 `includeTags`, `<excludedGroups>`가 `excludeTags`에 대응하며 둘 다 태그 표현식을 받는다.

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <groups>acceptance | !feature-a</groups>
        <excludedGroups>integration, regression</excludedGroups>
    </configuration>
</plugin>
```

CLI로도 전달할 수 있다.

```bash
mvn test -Dgroups="acceptance | !feature-a"
mvn test -DexcludedGroups="integration, regression"
```

---

## 8. 주의점

### 8.1. 스위트에 포함된 테스트가 중복 실행됨

빌드 도구의 일반 디스커버리가 스위트에 포함된 테스트 클래스를 직접 탐색하면서, 스위트를 통한 실행과 개별 실행이 겹쳐 같은 테스트가 두 번 실행된다. 스위트 전용 클래스를 일반 디스커버리 패턴(`*Test`, `*Tests` 등, §6.1/§7.1 참고)에서 제외하거나, 스위트에 포함된 클래스 자체를 일반 디스커버리 대상에서 제외해 회피한다.

### 8.2. JUnit 5 Platform에서 JUnit 4 테스트가 "No tests found"로 나옴

Platform이 JUnit 4(Vintage) 테스트를 실행하려면 `junit-vintage-engine`이 classpath에 있어야 한다. 누락되면 JUnit 4 테스트는 조용히 건너뛰어져 아무것도 실행되지 않은 것으로 보인다. Vintage 엔진은 마이그레이션 기간의 임시 수단으로, 장기적으로는 Jupiter로 전환하는 것이 권장된다.

### 8.3. @IncludeTags/@ExcludeTags만 붙였는데 아무것도 실행되지 않음

§4.2에서 다룬 대로 `@Include*`/`@Exclude*`는 `@Select*` 없이 단독으로 쓸 수 없다. 탐색 대상을 지정하지 않으면 필터링할 대상이 없어 스위트가 빈 채로 끝난다.

### 8.4. 태그 필터가 동작하지 않음

`@Tag` 값이 예약문자(`,` `(` `)` `&` `|` `!`)나 공백을 포함하면 경고 로그만 남기고 조용히 무시된다(§5.1). 태그 필터가 안 걸릴 때 가장 먼저 확인할 부분이다.

---

## Sources
- JUnit User Guide (current): https://docs.junit.org/current/user-guide/index.html
- org.junit.platform.suite.api (5.13.0 API): https://docs.junit.org/5.13.0/api/org.junit.platform.suite.api/org/junit/platform/suite/api/package-summary.html
- org.junit.jupiter.api.Tag (5.13.0 API): https://docs.junit.org/5.13.0/api/org.junit.jupiter.api/org/junit/jupiter/api/Tag.html
- Gradle — Testing in Java & JVM projects: https://docs.gradle.org/current/userguide/java_testing.html
- Maven Surefire — Running JUnit Platform tests: https://maven.apache.org/surefire/maven-surefire-plugin/examples/junit-platform.html
- How to do in Java — JUnit 5 Test Suite: https://howtodoinjava.com/junit5/junit5-test-suites-examples/
- Baeldung — Creating a Test Suite With JUnit: https://www.baeldung.com/java-junit-test-suite
- Gradle Forums — How to prevent JUnit test suite classes from being ran twice: https://discuss.gradle.org/t/how-to-prevent-junit-test-suite-classes-from-being-ran-twice/7107

---

## Related pages
- [[junit-parameterized-test]] — JUnit 5 매개변수화 테스트
- [[java-testing-libraries]] — Java 테스트 라이브러리 전체 개요(목적별 분류)
