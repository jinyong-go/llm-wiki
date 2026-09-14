---
title: Spock — Groovy 기반 테스트·명세 프레임워크
updated: 2026-09-14 16:34:37
tags:
  - java
  - groovy
  - testing
  - spock
  - bdd
---

## 1. 개요 — Spock이란

**Spock**은 Java/Groovy 애플리케이션을 위한 **테스트·명세(specification) 프레임워크**다. 테스트 클래스가 곧 동작 명세서가 되도록 BDD 스타일의 표현력 있는 문법을 제공한다.

- **Groovy로 작성**하지만 테스트 대상은 Java 코드도 무방하다.
- **JUnit Platform 위에서 실행**된다 → 기존 IDE·빌드 도구·리포팅과 그대로 호환된다([[junit-test-suite]]의 Platform 생태계 공유).
- **Power Assert**: 단언이 실패하면 표현식의 모든 중간 값을 출력한다.
- **모킹/스터빙이 내장**되어 별도 Mockito 없이 `Mock`/`Stub`/`Spy`를 쓴다.
- **데이터 테이블**로 데이터 주도 테스트를 간결하게 표현한다.

### 1.1. 핵심 용어

- **SUS(system under specification)**: 명세가 검증하는 대상 시스템. 클래스 하나부터 애플리케이션 전체까지 될 수 있다.
- **feature**: SUS가 가져야 할 기능·속성 단위. Spock에서 하나의 "feature 메서드"가 하나의 feature를 서술한다(JUnit의 테스트 메서드에 대응).
- **fixture**: feature 서술이 시작되는 SUS와 협력자의 특정 시점 상태(전제 조건).

---

## 2. 의존성 설정

Spock 버전 문자열은 **`{spock}-groovy-{groovy}`** 규칙을 따른다(예: `2.3-groovy-4.0`, `2.4-groovy-5.0`). BOM으로 버전을 일괄 관리하는 것이 권장된다.

### 2.1. Gradle

```kotlin
plugins {
    groovy
}
dependencies {
    testImplementation(platform("org.spockframework:spock-bom:2.4-groovy-4.0"))
    testImplementation("org.spockframework:spock-core")
    testImplementation("org.spockframework:spock-spring")     // Spring TestContext 연동 시
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
tasks.named<Test>("test") {
    useJUnitPlatform()                                        // JUnit Platform 기반 실행
}
```

### 2.2. Maven

Groovy 컴파일을 위해 `gmavenplus-plugin`이 필요하고, Surefire가 `*Spec`을 테스트로 인식하도록 includes를 추가한다.

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.gmavenplus</groupId>
      <artifactId>gmavenplus-plugin</artifactId>
      <!-- compile / compileTests 실행으로 Groovy 소스 컴파일 -->
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-surefire-plugin</artifactId>
      <configuration>
        <includes>
          <include>**/*Spec.java</include>   <!-- Spock 명세 -->
          <include>**/*Test.java</include>
        </includes>
      </configuration>
    </plugin>
  </plugins>
</build>
```
- `spock-core`만 필수, `spock-spring`은 Spring 연동 시 추가한다.
- Maven Surefire의 디스커버리 패턴([[junit-test-suite]] §7 참고)은 기본적으로 `.java`만 잡으므로 `*Spec` 포함 설정이 필요하다.

---

## 3. 기본 구조

테스트 클래스는 `spock.lang.Specification`을 상속한다.

```groovy
import spock.lang.Specification
import spock.lang.Shared

class MyFirstSpec extends Specification {

    // 인스턴스 필드 — feature 메서드마다 새로 초기화됨
    def stack = new Stack()

    // 공유 필드 — 모든 feature가 공유 (비싼 자원)
    @Shared res = new ExpensiveResource()

    // 픽스처 메서드
    def setupSpec()   {}   // 클래스 내 전체 feature 실행 전 1회
    def setup()       {}   // 각 feature 실행 전
    def cleanup()     {}   // 각 feature 실행 후 (실패해도 실행)
    def cleanupSpec() {}   // 전체 feature 실행 후 1회

    // feature 메서드 — 이름은 문자열로 서술
    def "스택에 push 하면 크기가 증가한다"() {
        when:
        stack.push("a")

        then:
        !stack.empty
        stack.size() == 1
        stack.peek() == "a"
    }
}
```

---

## 4. 블록 (Blocks)

feature 메서드는 라벨 블록으로 단계를 구분한다. 블록은 중첩될 수 없으며, feature 메서드는 최소 1개의 명시적(라벨이 붙은) 블록을 가져야 한다. 이 명시적 블록의 존재 여부가 일반 메서드와 feature 메서드를 구분하는 기준이다.

### 4.1. 블록 순서 규칙

- `given`(또는 첫 블록 앞의 암묵적 given)은 항상 최상단에 1회만 올 수 있다.
- `when`-`then`은 항상 쌍으로 오며, 한 feature 메서드 안에 여러 쌍이 올 수 있다.
- `expect`는 `when`+`then`을 한 블록으로 합친 것으로, 순수 함수 검증에 적합하다.
- `cleanup`은 1회만 올 수 있고 `where` 앞에만 위치할 수 있다.
- `where`는 항상 마지막에 1회만 올 수 있다(선언 위치는 마지막이지만, 실제로는 feature 실행 전에 평가되어 반복 케이스를 만든다).

### 4.2. 블록 종류

| 블록 | 역할 |
|------|------|
| `given:` (= `setup:`) | 픽스처·전제 조건 |
| `when:` | 자극(stimulus) — 대상 행위 실행 |
| `then:` | 검증 — 조건·예외·상호작용 |
| `expect:` | `when`+`then` 결합 (순수 함수 검증에 적합) |
| `and:` | 같은 종류 블록을 가독성 위해 분할 |
| `cleanup:` | 자원 해제 (실패해도 실행) |
| `where:` | 데이터 주도 반복 데이터 공급 |

```groovy
def "두 수의 최댓값"() {
    expect:
    Math.max(a, b) == c

    where:
    a | b || c
    1 | 3 || 3
    7 | 4 || 7
}
```

### 4.3. 조건과 Power Assert

`then`/`expect` 블록의 top-level 표현식은 (void 메서드 호출·상호작용 표현식 제외) 자동으로 조건(condition)으로 취급되어 평범한 boolean 식으로 단언을 표현한다. 조건이 실패하면 Power Assert가 평가 과정의 모든 중간 값을 함께 보여준다.

```groovy
when:
stack.push("push me")

then:
stack.size() == 2   // 실제로는 1이라 실패

// 실패 출력:
// Condition not satisfied:
//
// stack.size() == 2
// |     |      |
// |     1      false
// [push me]
```

### 4.4. 이전 값 비교 — old()

`then` 블록에서 `old(expr)`로 같은 표현식이 `when` 실행 전에 가졌던 값을 가져와, 실행 후 값과 비교할 수 있다. 상태 변화를 검증할 때 유용하다.

```groovy
when:
stack.push("a")

then:
stack.size() == old(stack.size()) + 1
```

---

## 5. 예외 조건

`then:`/`expect:`에서 `thrown()`·`notThrown()`으로 예외를 검증한다.

```groovy
def "빈 스택을 pop 하면 예외"() {
    when:
    stack.pop()

    then:
    thrown(EmptyStackException)
}

def "예외 객체 접근"() {
    when:
    stack.pop()

    then:
    def e = thrown(EmptyStackException)
    e.cause == null
}
```

---

## 6. 데이터 주도 테스트 (Data-Driven)

### 6.1. 데이터 테이블

`where:` 블록에 표를 작성한다. `|`는 입력, `||`는 입력/기대값 구분 관례다. 행마다 feature가 1회 실행된다.

```groovy
def "최댓값 계산"() {
    expect:
    Math.max(a, b) == c

    where:
    a | b || c
    1 | 3 || 3
    7 | 4 || 7
    0 | 0 || 0
}
```

### 6.2. 데이터 파이프 — `<<`

변수에 데이터 프로바이더(컬렉션·이터러블)를 연결한다.

```groovy
where:
message << ["hello", "world", "test"]

// 다중 변수 — 컬렉션 구조 분해
[a, b, c] << sql.rows("select a, b, c from table")
```

### 6.3. @Unroll — 반복별 리포트

데이터 주도 feature는 기본적으로 각 반복이 별도 테스트로 표시(unroll)된다. 표시 이름은 `#변수` 플레이스홀더로 꾸민다.

```groovy
@Unroll("max(#a, #b) == #c")
def "최댓값"() {
    expect:
    Math.max(a, b) == c

    where:
    a | b || c
    1 | 3 || 3
    7 | 4 || 7
}
// 리포트: "max(1, 3) == 3", "max(7, 4) == 7"
```
> Spock 2.x에서는 unroll이 사실상 기본 동작이라 `@Unroll`은 주로 이름 커스터마이즈 용도로 쓴다.

---

## 7. 상호작용 기반 테스트 (모킹)

### 7.1. 생성

```groovy
def subscriber = Mock(Subscriber)   // 명시 타입
Subscriber sub = Mock()             // 타입 추론
def stub      = Stub(Subscriber)    // 스텁 (카디널리티 검증 없음)
def spy       = Spy(realSubscriber) // 실제 객체 래핑
```

- **Mock**: 호출을 받아 기본값(`null`/`0`/`false`) 반환. 상호작용(호출 횟수) 검증 가능.
- **Stub**: 협력자 응답만 제공, 호출 횟수는 검증하지 않음.
- **Spy**: 실제 객체를 감싸 실제 동작 유지하면서 상호작용 검증.

### 7.2. 상호작용 검증 — 카디널리티

`then:` 블록에서 `횟수 * 대상.메서드(인자)` 형식으로 호출을 검증한다.

```groovy
def "이벤트가 구독자에게 전달된다"() {
    given:
    def subscriber = Mock(Subscriber)
    def publisher = new Publisher()
    publisher.add(subscriber)

    when:
    publisher.fire("event")

    then:
    1 * subscriber.receive("event")     // 정확히 1회
}
```

```groovy
0 * subscriber.receive("x")    // 호출 안 됨
(1..3) * subscriber.receive(_) // 1~3회, _ = 임의 인자
1 * subscriber.receive(!null)  // null 아닌 인자
1 * _.receive("x")             // 임의 mock 대상
```

### 7.3. 스터빙 — 응답 지정

```groovy
subscriber.receive(_) >> "ok"                 // 항상 "ok"
subscriber.receive(_) >>> ["ok", "fail", "ok"] // 호출마다 순차 반환
subscriber.receive(_) >> { String m -> m.length() > 3 ? "ok" : "fail" } // 클로저로 계산
```

---

## 8. 장단점

**장점**
- 블록 구조(`given/when/then`)로 의도가 드러나는 가독성 높은 명세.
- Power Assert의 풍부한 실패 진단 — 단언 API 없이 평범한 boolean 식만 쓴다.
- 데이터 테이블 기반 데이터 주도 테스트가 매우 간결.
- 모킹/스터빙 내장 — 프레임워크 일관성.
- Groovy의 클로저·연산자 오버로딩을 활용한 표현력.

**단점**
- Groovy 런타임·컴파일 단계가 추가된다(빌드에 Groovy 플러그인 필요).
- Java만 쓰는 팀에는 Groovy 학습 비용이 진입장벽.
- IDE·정적 분석 지원이 순수 JUnit보다 다소 약하다.
- 순수 Java 단언 대비 디버깅 시 Groovy 동적 타입 특성을 감안해야 한다.

---

## 9. 기타 및 주의점

### 9.1. Groovy-Spock 버전 불일치

Spock 버전은 특정 Groovy 버전에 강하게 종속된다(§2). 맞지 않는 조합을 쓰면 `Could not instantiate global transform class org.spockframework.compiler.SpockTransform` 또는 `Spock ... is not compatible with Groovy ...` 오류가 발생한다. Spock 2.0-M3 이상은 `spock.iKnowWhatImDoing.disableGroovyVersionCheck` 시스템 프로퍼티로 검사를 우회할 수 있으나 비권장.

### 9.2. IntelliJ에서 Specification 심볼 인식 실패

Groovy 테스트 소스는 `src/test/groovy`에 위치해야 하며 해당 디렉터리를 Test Sources Root로 지정해야 한다. Maven은 기본적으로 `src/test/java`만 소스 루트로 인식하므로, Groovy 소스 디렉터리를 별도로 등록하지 않으면 `Specification` 등의 심볼을 해석하지 못한다.

### 9.3. Maven에서 테스트가 인식·실행되지 않음

`gmavenplus-plugin`에 실행할 goal(`compileTests` 등)을 명시하지 않으면 Groovy 소스가 컴파일되지 않아 테스트가 실행되지 않는다. Java와 Groovy를 함께 사용하는 프로젝트는 `generate-test-sources` 단계에 바인딩되는 `generateTestStubs` goal도 필요하다.

### 9.4. final 클래스/메서드 모킹 제약

기본 모킹 백엔드(ByteBuddy)는 final 클래스·메서드 모킹에 제약이 있다. `byte-buddy` 1.9+를 classpath에 추가하거나, Mockito 4.11+ 사용 시 `Mock(mockMaker: MockMakers.mockito)`로 Mockito 모크 메이커를 선택하면 final 모킹이 가능하다. 명세 대상이 Groovy 코드라면 `GroovyMock`으로도 우회할 수 있다.

---

## Sources
- Spock Framework Reference (2.3): https://spockframework.org/spock/docs/2.3/all_in_one.html
- Spock Primer (2.4): https://spockframework.org/spock/docs/2.4/spock_primer.html
- spockframework/spock-example build.gradle: https://github.com/spockframework/spock-example/blob/master/build.gradle
- Maven Repository — spock-core: https://mvnrepository.com/artifact/org.spockframework/spock-core
- Baeldung — Setting up and Using Spock With Gradle: https://www.baeldung.com/groovy-spock-gradle-setup
- Solid Soft — Running Spock with unsupported Groovy version (Gradle + Maven): https://blog.solidsoft.pl/2021/11/19/running-spock-with-unsupported-groovy-version-gradle-maven/
- GMavenPlus Wiki — Usage: https://github.com/groovy/GMavenPlus/wiki/Usage
- JetBrains — Getting started with Spock: https://www.jetbrains.com/help/idea/spock.html
- Spock Extensions docs (Mock maker 선택): https://spockframework.org/spock/docs/2.4-M2/extensions.html

---

## Related pages
- [[java-testing-libraries]] — Java 테스트 라이브러리 개요(Spock의 위치: 프레임워크 분류)
- [[junit-test-suite]] — JUnit Platform 실행 생태계·Surefire 디스커버리 패턴
- [[test-double]] — Mock/Stub/Spy 차이(Spock §7 모킹의 개념적 배경)
