---
title: JUnit 테스트 실행 순서
updated: 2026-09-15 23:23:14
tags:
  - java
  - junit
  - testing
  - integration-test
---

## 1. 개요

JUnit Jupiter는 기본적으로 테스트 클래스와 메서드를 **결정적이지만 의도적으로 비자명한(nonobvious)** 알고리즘으로 정렬한다. 같은 스위트를 다시 실행하면 같은 순서가 보장되어 빌드는 재현 가능하지만, 소스 선언 순서나 메서드 이름 순서에 의존할 수는 없다.

단위 테스트는 실행 순서에 의존하지 않아야 한다([[good-test-practices]]). 순서 강제가 정당한 경우는 시퀀스 자체가 검증 대상인 통합 테스트나 기능 테스트로 한정되며, 보통 §4의 `@TestInstance(Lifecycle.PER_CLASS)`와 함께 쓴다.

---

## 2. 메서드 순서

### 2.1 설정

테스트 클래스 또는 테스트 인터페이스에 `@TestMethodOrder`를 붙이고 사용할 `MethodOrderer` 구현을 지정한다.

```java
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

@TestMethodOrder(OrderAnnotation.class)
class OrderedTestsDemo {

    @Test @Order(1)
    void nullValues() { }

    @Test @Order(2)
    void emptyValues() { }

    @Test @Order(3)
    void validValues() { }
}
```

### 2.2 내장 MethodOrderer

| 구현 | 정렬 기준 |
|------|-----------|
| `MethodOrderer.OrderAnnotation` | `@Order` 값의 수치 |
| `MethodOrderer.MethodName` | 메서드명과 형식 매개변수 목록의 영숫자 순 |
| `MethodOrderer.DisplayName` | 표시 이름의 영숫자 순 |
| `MethodOrderer.Random` | 유사난수. 커스텀 시드 설정 가능 |

`MethodOrderer` 인터페이스를 직접 구현해 커스텀 정렬을 쓸 수도 있다.

### 2.3 @Nested 상속

클래스에 설정한 `MethodOrderer`는 그 안의 `@Nested` 클래스에 **재귀적으로 상속**된다. 중첩 클래스마다 애너테이션을 반복할 필요가 없다. 특정 중첩 클래스만 상속을 끊으려면 `@TestMethodOrder(MethodOrderer.Default.class)`를 명시한다.

### 2.4 전역 설정

`src/test/resources/junit-platform.properties`에 기본 Orderer의 FQCN을 지정한다. `@TestMethodOrder`가 상위 클래스나 인터페이스에 있으면 그쪽이 우선한다.

```properties
junit.jupiter.testmethod.order.default = \
    org.junit.jupiter.api.MethodOrderer$OrderAnnotation
```

---

## 3. 클래스 순서

### 3.1 내장 ClassOrderer

| 구현 | 정렬 기준 |
|------|-----------|
| `ClassOrderer.OrderAnnotation` | `@Order` 값의 수치 |
| `ClassOrderer.ClassName` | FQCN의 영숫자 순 |
| `ClassOrderer.DisplayName` | 표시 이름의 영숫자 순 |
| `ClassOrderer.Random` | 유사난수. 커스텀 시드 설정 가능 |

### 3.2 전역 설정

**최상위 클래스의 순서는 설정 파라미터로만 지정할 수 있다.** 클래스에 `@Order`를 붙여도 `ClassOrderer.OrderAnnotation`을 등록하지 않으면 무시된다.

```properties
junit.jupiter.testclass.order.default = \
    org.junit.jupiter.api.ClassOrderer$OrderAnnotation
```

정렬 범위는 계층별로 나뉜다. 최상위 클래스는 최상위끼리, `@Nested` 클래스는 **같은 enclosing 클래스를 공유하는 중첩 클래스끼리** 정렬된다. 서로 다른 최상위 클래스의 중첩 클래스 사이에는 순서가 성립하지 않는다.

### 3.3 @TestClassOrder

`@Nested` 클래스의 순서는 바깥 클래스에 `@TestClassOrder`를 붙여 지역적으로 지정한다. 지역 선언은 상속된 선언이나 전역 설정을 항상 덮어쓴다.

```java
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class OrderedNestedTestClassesDemo {

    @Nested @Order(1)
    class PrimaryTests {
        @Test void test1() { }
    }

    @Nested @Order(2)
    class SecondaryTests {
        @Test void test2() { }
    }
}
```

---

## 4. 상태 공유

Jupiter는 기본값 `Lifecycle.PER_METHOD`에서 테스트 메서드마다 클래스 인스턴스를 새로 만든다. 앞 단계가 만든 식별자를 다음 단계로 넘기려면 `static` 필드를 써야 한다.

클래스에 `@TestInstance(Lifecycle.PER_CLASS)`를 붙이면 인스턴스가 클래스당 하나만 생성되어 일반 인스턴스 필드로 상태를 전달할 수 있다. `@BeforeAll`과 `@AfterAll`을 비정적 메서드로 선언하는 것도 가능해진다.

```properties
junit.jupiter.testinstance.lifecycle.default = per_class
```

전역 변경도 가능하지만 권장되지 않는다. 빌드는 per-class, IDE는 per-method로 동작하면 서버에서만 재현되는 오류를 디버깅하기 어려워진다. JVM 시스템 프로퍼티보다 설정 파일이 안전하다.

---

## 5. Spring 통합 테스트

### 5.1 트랜잭션 롤백

Spring TestContext에서 `@Transactional`이 붙은 테스트는 **완료 시 자동 롤백**된다. 단계별로 데이터를 쌓아 가는 시나리오 테스트에 붙이면 앞 단계의 결과가 사라져 다음 단계가 실패한다. 시나리오 테스트에는 `@Transactional`을 쓰지 않고 `@Sql` 스크립트나 `@AfterAll`에서 명시적으로 정리한다.

일부만 커밋이 필요하다면 `@Commit`/`@Rollback`으로 선언적으로 뒤집거나, `TestTransaction`의 정적 메서드로 트랜잭션을 직접 시작·종료한다.

### 5.2 예시

```java
@SpringBootTest
@AutoConfigureMockMvc
@Tag("scenario")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderScenarioIT {

    @Autowired MockMvc mvc;
    private Long orderId;   // PER_CLASS이므로 static 불필요

    @Test @Order(1)
    void 주문_생성() throws Exception {
        var body = mvc.perform(post("/orders")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"itemId":1,"qty":2}"""))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        orderId = JsonPath.parse(body).read("$.id", Long.class);
    }

    @Test @Order(2)
    void 결제() throws Exception {
        mvc.perform(post("/orders/{id}/payments", orderId))
            .andExpect(status().isOk());
    }

    @Test @Order(3)
    void 배송_시작() throws Exception {
        mvc.perform(post("/orders/{id}/shipments", orderId))
            .andExpect(status().isOk());
    }

    @AfterAll
    void cleanup() { /* 생성된 주문 삭제 */ }
}
```

### 5.3 태그 분리

순서 의존 테스트는 `@Tag`로 분리해 일반 테스트 실행에서 제외한다. 태그 표현식과 빌드 도구 필터링은 [[junit-test-suite]] 참고.

```kotlin
tasks.named<Test>("test") {
    useJUnitPlatform { excludeTags("scenario") }
}
```

---

## 6. 실패 전파

`@Order`로 순서를 고정해도 1단계가 실패한 뒤 2·3단계는 그대로 실행된다. 선행 조건이 무너진 상태에서 나온 실패라 로그만 늘어난다.

[junit-pioneer](https://junit-pioneer.org)의 `@DisableIfTestFails`를 클래스에 붙이면 **첫 실패 이후 같은 클래스의 남은 테스트가 비활성화**된다.

```java
@DisableIfTestFails
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Tests {

    @Test @Order(1)
    void test1() { }

    @Test @Order(2)
    void test2() { fail("fails"); }

    @Test @Order(3)
    void test3() { }   // 실행되지 않고 disabled 처리
}
```

| 속성 | 기본값 | 동작 |
|------|--------|------|
| `onAssertion` | `true` | 단언 실패에도 이후 테스트를 비활성화. `false`면 단언 실패는 무시 |
| `with` | 전체 예외 | 지정한 예외 타입으로 실패한 경우에만 비활성화 |

실패한 가정(`Assumption`)으로 중단된 테스트는 비활성화 대상에서 제외된다. 인터페이스에 붙여 상속시킬 수 있으며, 이때 `with`는 합집합으로, `onAssertion`은 OR로 병합된다. 비활성화 범위는 실패가 발생한 클래스 내부로 한정된다.

---

## 7. 병렬 실행

병렬 실행을 켜도 `MethodOrderer`를 사용하는 클래스와 `Lifecycle.PER_CLASS` 클래스는 **기본 실행 모드 적용 대상에서 제외**된다. 전자는 지정한 순서와 충돌하고, 후자는 스레드 안전성을 보장할 수 없기 때문이다. 이런 클래스는 `@Execution(CONCURRENT)`를 명시적으로 붙인 경우에만 병렬로 실행된다. 즉 순서 의존 테스트에 `@Execution(SAME_THREAD)`를 따로 붙일 필요는 없다.

반면 `ClassOrderer`는 병렬 실행 시 **스케줄 순서만 보장**한다. 최상위 클래스는 정렬된 순서로 스케줄되지만 실행 스레드를 JUnit이 직접 제어하지 않으므로 그 순서대로 시작된다는 보장이 없다.

여러 시나리오 클래스가 같은 DB 테이블 같은 공유 자원을 쓴다면 `@ResourceLock`으로 동시 접근을 막는다.

---

## 8. 동적 테스트

단계가 앞 결과에 따라 달라지거나 단계 수가 런타임에 결정되는 경우 `@TestFactory`가 맞는다. 스트림 선언 순서대로 지연 실행되며, 컨텍스트를 팩토리 메서드의 지역 변수로 유지하므로 `PER_CLASS` 설정이 필요 없다.

```java
@TestFactory
Stream<DynamicTest> 주문_시나리오() {
    var ctx = new ScenarioContext();
    return Stream.of(
        dynamicTest("주문 생성", () -> ctx.orderId = createOrder()),
        dynamicTest("결제",      () -> pay(ctx.orderId)),
        dynamicTest("배송",      () -> ship(ctx.orderId))
    );
}
```

개별 동적 테스트에는 생명주기 콜백이 적용되지 않는다. `@BeforeEach`와 `@AfterEach`는 `@TestFactory` 메서드 전후에 한 번씩만 실행되므로, 람다에서 참조하는 테스트 인스턴스 필드는 동적 테스트 사이에 초기화되지 않는다. 한 단계가 실패해도 나머지 동적 테스트는 계속 실행된다[^1].

---

## 9. JUnit 4

JUnit 4는 `@FixMethodOrder`로 정렬 방식만 고를 수 있고 `@Order` 같은 임의 순서 지정은 지원하지 않는다. 순서를 강제하려면 메서드 이름에 접두사를 붙여 사전순으로 맞추는 방식을 쓴다.

```java
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class OrderedTest {
    @Test public void t1_createOrder() { }
    @Test public void t2_pay() { }
}
```

| 상수 | 동작 |
|------|------|
| `DEFAULT` | 결정적이지만 예측 불가능한 순서 |
| `NAME_ASCENDING` | 메서드명 사전순. `Method.toString()`이 tiebreaker |
| `JVM` | JVM이 반환한 순서. 실행마다 달라질 수 있음 |

---

## 10. 주의점

### 10.1 개별 실행 시 실패

순서 의존 테스트는 IDE에서 메서드 하나만 골라 실행하면 선행 상태가 없어 실패한다. 디버깅 비용이 높으므로 시나리오 단위를 너무 길게 만들지 않는다.

### 10.2 @Order 값 간격

`@Order(1)`, `@Order(2)`처럼 촘촘하게 매기면 중간에 단계를 끼워 넣을 때 이후 값을 모두 수정해야 한다. 10 단위로 띄우면 재번호 없이 삽입할 수 있다.

### 10.3 클래스 @Order 무시

§3.2대로 최상위 클래스의 `@Order`는 `junit.jupiter.testclass.order.default` 설정 없이는 아무 효과가 없다. 애너테이션만 붙이고 동작하지 않는다면 이 설정을 먼저 확인한다.

### 10.4 원칙과의 상충

순서 의존은 [[good-test-practices]]의 Independent·Isolated 속성을 의도적으로 포기하는 선택이다. 단위 테스트에는 적용하지 않고, E2E 시나리오 검증에 한정해 §5.3처럼 태그로 분리해 운영한다.

---

[^1]: 가이드는 `DynamicTest`가 지연 실행된다고만 기술하고 실패 시 후속 요소의 처리는 명시하지 않는다. 각 `DynamicTest`가 독립된 테스트 노드로 보고된다는 점에 근거한 추론이다.

---

## Sources
- JUnit User Guide — Test Execution Order: https://docs.junit.org/current/writing-tests/test-execution-order.html
- JUnit User Guide — Test Instance Lifecycle: https://docs.junit.org/current/writing-tests/test-instance-lifecycle.html
- JUnit User Guide — Parallel Execution: https://docs.junit.org/current/writing-tests/parallel-execution.html
- JUnit User Guide — Dynamic Tests: https://docs.junit.org/current/writing-tests/dynamic-tests.html
- JUnit Pioneer — @DisableIfTestFails: https://junit-pioneer.org/docs/disable-if-test-fails/
- Spring Framework Reference — Transaction Management: https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html
- JUnit 4 Javadoc — MethodSorters: https://junit.org/junit4/javadoc/latest/org/junit/runners/MethodSorters.html

---

## Related pages
- [[good-test-practices]] — 좋은 테스트 코드 작성법
- [[junit-test-suite]] — JUnit 테스트 스위트와 태그 필터링
- [[junit-parameterized-test]] — JUnit 5 매개변수화 테스트
- [[java-testing-libraries]] — Java 테스트 라이브러리 전체 개요
