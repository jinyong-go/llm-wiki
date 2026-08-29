---
title: Spring AOP
updated: 2026-07-09 17:57:59
tags:
  - java
  - spring
  - aop
  - proxy
  - pointcut
  - advice
---

## 1. 개요

AOP(Aspect-Oriented Programming)는 로깅·보안·트랜잭션 등 여러 클래스에 걸쳐 공통으로 필요한 관심사(cross-cutting concern)를 비즈니스 로직에서 분리하는 프로그래밍 패러다임이다. Spring AOP는 Spring IoC 컨테이너와 통합된 **프록시 기반 런타임 AOP** 구현체이다.

---

## 2. 핵심 용어

| 용어 | 정의 |
|---|---|
| **Aspect** | 여러 클래스에 걸쳐 적용되는 관심사의 모듈화. `@Aspect` 클래스로 구현. |
| **Join Point** | Advice를 적용할 수 있는 프로그램 실행 지점. Spring AOP에서는 **항상 메서드 실행**이다. |
| **Advice** | Aspect가 특정 Join Point에서 취하는 동작. |
| **Pointcut** | Join Point를 선택하는 술어(predicate). AspectJ 표현식 언어를 기본으로 사용. |
| **Target Object** | 하나 이상의 Aspect에 의해 어드바이스되는 객체. Spring AOP에서는 항상 프록시 객체. |
| **AOP Proxy** | Aspect 계약을 구현하기 위해 AOP 프레임워크가 생성한 객체. JDK 동적 프록시 또는 CGLIB. |
| **Weaving** | Aspect를 대상 객체와 연결해 어드바이스된 객체를 만드는 과정. Spring AOP는 런타임에 수행. |
| **Introduction** | 기존 타입에 새로운 인터페이스(및 구현)를 추가 선언. AspectJ 용어로는 inter-type declaration. |

---

## 3. 동작 원리: 런타임 위빙

Spring AOP는 **런타임 프록시** 방식으로 동작한다.

```
호출자 → [AOP Proxy] → 어드바이스 체인 → Target Object
```

프록시 생성 방식:

| 조건 | 프록시 방식 |
|---|---|
| 대상 객체가 인터페이스를 하나라도 구현 | **JDK 동적 프록시** (순수 Spring 기본값) |
| 대상 객체가 인터페이스를 구현하지 않음 | **CGLIB 프록시** (서브클래스 생성) |

Spring AOP는 Spring 컨테이너가 관리하는 Bean에만 적용된다.

> **Spring Boot 주의**: Spring Boot 2.1+는 `proxy-target-class=true`가 기본이라 인터페이스 구현 여부와 무관하게 **항상 CGLIB**로 프록시한다 (6장 참조).

---

## 4. Spring AOP vs AspectJ

| 항목 | Spring AOP | AspectJ |
|---|---|---|
| 구현 | 순수 Java, 런타임 프록시 | Java 확장, 별도 컴파일러(ajc) |
| 위빙 시점 | 런타임 | 컴파일 타임 / 로드 타임 / 포스트 컴파일 |
| 지원 Join Point | **메서드 실행만** | 메서드 호출·생성자·필드·정적 초기화자 등 |
| 적용 대상 | Spring Bean만 | 모든 도메인 객체 |
| 성능 | 프록시 오버헤드 있음 | 런타임 오버헤드 없음 |
| 학습 난이도 | 쉬움 | 복잡 (ajc 빌드 통합 필요) |

위빙 방식·Join Point 범위·선택 기준 등 자세한 내용은 [[aspectj]] 참조.

---

## 5. 제약사항

**Self-invocation 불적용**: 같은 클래스 내에서 메서드를 호출하면 프록시를 거치지 않으므로 Advice가 실행되지 않는다.

```java
@Service
public class OrderService {
    public void placeOrder() {
        validate(); // ← 프록시를 우회 → @Before validate() Advice 미실행
    }

    public void validate() { ... }
}
```

해결: 별도 Bean으로 분리하거나 AspectJ LTW를 사용한다.

**적용 불가 대상:**
- `static` 메서드 — 프록시 서브클래스에서 오버라이드 불가
- `final` 클래스/메서드 — CGLIB 서브클래스 생성 불가
- Spring 컨테이너 외부 객체 — `new`로 직접 생성한 인스턴스

---

## 6. Spring Boot 설정

### 6.1. 의존성과 자동 설정

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

`spring-boot-starter-aop`는 `spring-aop`와 `aspectjweaver`를 포함한다. 클래스패스에 `Aspect`가 존재하면 **`AopAutoConfiguration`이 `@EnableAspectJAutoProxy`를 자동 적용**하므로 별도 선언이 필요 없다.

### 6.2. 자동 설정 프로퍼티

| 프로퍼티 | 기본값 | 의미 |
|---|---|---|
| `spring.aop.auto` | `true` | AOP 자동 설정 활성화. `false`면 `AopAutoConfiguration` 비활성. |
| `spring.aop.proxy-target-class` | `true` | `true`면 **CGLIB 강제**(인터페이스 빈도 클래스 프록시), `false`면 인터페이스는 JDK 동적 프록시. |

> Spring Boot 2.1+의 기본값은 `proxy-target-class=true`다. 순수 Spring(`@EnableAspectJAutoProxy` 기본값 `false`)과 달리 **인터페이스 기반 빈도 CGLIB로 프록시**된다. JDK 동적 프록시(인터페이스 타입 주입)가 필요하면 다음으로 끈다.

```properties
spring.aop.proxy-target-class=false
```

### 6.3. 수동 활성화

자동 설정을 쓰지 않거나 프록시 방식을 코드로 고정할 때:

```java
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig { }
```

---

## 7. Aspect 클래스 작성

`@Aspect`는 마커 애너테이션이므로 컴포넌트 스캔 대상이 되려면 `@Component`를 함께 붙여야 한다.

```java
@Aspect
@Component
public class LoggingAspect {
    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);
}
```

여러 Aspect의 적용 순서가 중요하면 `@Order`(또는 `Ordered` 구현)로 지정한다. 값이 작을수록 바깥쪽(먼저 실행)이다.

```java
@Aspect
@Component
@Order(1)
public class TransactionAspect { ... }
```

---

## 8. Pointcut 표현식

### 8.1. execution 표현식 문법

```
execution([접근제어자] 반환타입 [클래스패턴.]메서드명(파라미터) [throws 예외])
```

| 표현식 | 의미 |
|---|---|
| `execution(* com.example.service.*.*(..))` | service 패키지 내 모든 메서드 |
| `execution(* com.example.service.UserService.*(..))` | UserService의 모든 메서드 |
| `execution(public * *(..))` | 모든 public 메서드 |
| `execution(* com.example.service.UserService.*(String))` | String 파라미터 하나인 메서드 |
| `@annotation(com.example.MyAnnotation)` | 해당 애너테이션이 붙은 메서드 |

### 8.2. @Pointcut 재사용

권장 방식이다.

인라인 표현식 대신 `@Pointcut` 메서드로 정의하면 여러 Advice에서 재사용할 수 있다.

```java
@Aspect
@Component
public class LoggingAspect {

    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    @Before("serviceLayer()")
    public void logBefore(JoinPoint jp) { ... }

    @After("serviceLayer()")
    public void logAfter(JoinPoint jp) { ... }
}
```

---

## 9. Advice 5종

| Advice | 애너테이션 | 실행 시점 |
|---|---|---|
| **Before** | `@Before` | Join Point 실행 직전. 예외를 던지지 않는 한 실행 흐름을 막지 못한다. |
| **After Returning** | `@AfterReturning` | Join Point가 정상 반환된 후. |
| **After Throwing** | `@AfterThrowing` | 메서드가 예외를 던지며 종료된 경우. |
| **After (finally)** | `@After` | 정상/예외 여부와 무관하게 Join Point 종료 후 항상 실행. |
| **Around** | `@Around` | Join Point를 둘러싸는 가장 강력한 Advice. `proceed()`로 실행 여부를 직접 제어. |

**최소 침습 원칙**: 필요한 기능을 구현할 수 있는 가장 약한 Advice 타입을 선택한다. 반환값 캐싱에는 Around 대신 AfterReturning을 사용한다. Around는 `proceed()` 호출 누락 위험이 있다.

---

## 10. Advice 코드 예시

### 10.1. @Before

```java
@Before("execution(* com.example.service.*.*(..))")
public void logBefore(JoinPoint jp) {
    log.debug(">> {}()", jp.getSignature().getName());
}
```

### 10.2. @AfterReturning

`returning` 속성 값은 파라미터 이름과 일치해야 한다.

```java
@AfterReturning(
    pointcut = "execution(* com.example.service.*.*(..))",
    returning = "result")
public void logAfterReturning(JoinPoint jp, Object result) {
    log.debug("<< {}() = {}", jp.getSignature().getName(), result);
}
```

### 10.3. @AfterThrowing

```java
@AfterThrowing(
    pointcut = "execution(* com.example.service.*.*(..))",
    throwing = "ex")
public void logAfterThrowing(JoinPoint jp, Throwable ex) {
    log.error("<< {}() threw {}", jp.getSignature().getName(), ex.getMessage());
}
```

### 10.4. @After

```java
@After("execution(* com.example.service.*.*(..))")
public void logAfter(JoinPoint jp) {
    log.debug("method {} finished", jp.getSignature().getName());
}
```

### 10.5. @Around

`ProceedingJoinPoint`의 `proceed()`를 반드시 호출해야 대상 메서드가 실행된다.

```java
@Around("execution(* com.example.service.*.*(..))")
public Object logAround(ProceedingJoinPoint pjp) throws Throwable {
    Object[] args = pjp.getArgs();
    String name = pjp.getSignature().getName();
    log.debug(">> {}() args={}", name, Arrays.toString(args));
    Object result = pjp.proceed();
    log.debug("<< {}() = {}", name, result);
    return result;
}
```

---

## 11. JoinPoint에서 메서드 정보 추출

`JoinPoint`를 `MethodSignature`로 캐스팅하면 리플렉션 정보에 접근할 수 있다.

```java
@Before("@annotation(com.example.AccountOperation)")
public void inspect(JoinPoint jp) {
    MethodSignature sig = (MethodSignature) jp.getSignature();

    // 메서드 식별
    Method method = sig.getMethod();
    String methodName = sig.getMethod().getName();
    Class<?> declaringType = sig.getDeclaringType();

    // 파라미터
    String[] paramNames = sig.getParameterNames();
    Class<?>[] paramTypes = sig.getParameterTypes();
    Object[] args = jp.getArgs();

    // 반환 타입·modifier·선언 예외
    Class<?> returnType = sig.getReturnType();
    int modifiers = sig.getModifiers();             // Modifier.toString(modifiers)
    Class<?>[] exceptionTypes = sig.getExceptionTypes();

    // 애너테이션 값 읽기
    AccountOperation ann = method.getAnnotation(AccountOperation.class);
    String operation = ann.operation();
}
```

---

## 12. 실전 패턴: 로깅/감사 Aspect

Around + Before/AfterReturning 분리 패턴의 선택 기준:

| 요건 | 권장 Advice |
|---|---|
| 인자 + 반환값 모두 로깅 | `@Around` |
| 인자만 로깅 | `@Before` |
| 반환값만 로깅 | `@AfterReturning` |
| 예외 로깅 | `@AfterThrowing` |

```java
@Aspect
@Component
public class AuditAspect {

    @Pointcut("execution(public * com.example.service.*.*(..))")
    public void publicServiceMethods() {}

    @Around("publicServiceMethods()")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        long elapsed = System.currentTimeMillis() - start;
        log.info("[{}] {}ms", pjp.getSignature().toShortString(), elapsed);
        return result;
    }
}
```

---

## 13. 테스트

### 13.1. 단위 테스트 (Mockito)

Spring 컨텍스트 없이 Aspect 내부 로직만 검증한다.

```java
@ExtendWith(MockitoExtension.class)
class ExecutionTimeAspectTest {

    @Mock ProceedingJoinPoint pjp;
    @Mock Logger logger;
    @InjectMocks ExecutionTimeAspect aspect;

    @Test
    void whenProceed_thenLoggerCalled() throws Throwable {
        when(pjp.proceed()).thenReturn(null);
        aspect.logExecutionTime(pjp);
        verify(pjp, times(1)).proceed();
        verify(logger, times(1)).info(anyString());
    }
}
```

`ArgumentCaptor`로 로그 메시지 내용을 정밀 검증:

```java
ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
verify(logger).info(captor.capture());
assertThat(captor.getValue()).startsWith("Execution time=");
```

### 13.2. 통합 테스트 (@SpringBootTest)

실제 프록시가 생성되어야 Advice가 적용된다. `@Autowired`로 주입받아야 하며 `new`로 생성한 인스턴스에는 Advice가 적용되지 않는다.

```java
@SpringBootTest
class AuditAspectIntegrationTest {

    @Autowired ArraySorting arraySorting; // new ArraySorting()은 안 됨

    @Test
    void whenSort_thenLogPrinted() {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        System.setOut(new PrintStream(baos));

        arraySorting.sort(List.of(3, 1, 2));

        assertThat(baos.toString()).contains("Execution time=");
    }
}
```

---

## 14. 주의사항

- **`proceed()` 호출 누락**: `@Around`에서 잊으면 대상 메서드가 실행되지 않는다.
- **성능 오버헤드**: 프록시 생성 비용 및 메서드 호출 체인 증가. Aspect가 수만 개 이상이면 [[aspectj]] LTW를 고려한다.
- **프로파일 조건부 활성화**: 개발용 Aspect는 `@Profile("dev")`로 제한해 프로덕션 오버헤드를 방지한다.
- **static 메서드 적용 불가**: 정적 메서드 인터셉션이 필요하면 AspectJ 컴파일 타임 위빙을 사용한다.
- **트랜잭션도 AOP 기반**: `@Transactional` 역시 같은 프록시 메커니즘을 쓰므로 self-invocation 제약이 동일하게 적용된다 ([[jpa-transaction]]).

---

## 15. 사용 시기

AOP 적합: 로깅·실행 시간 측정, 보안 검증, 트랜잭션 관리, 캐싱·성능 모니터링.
AOP 부적합: 비즈니스 로직 자체, 단순 위임/상속으로 해결 가능한 경우(남용 시 로직 추적 곤란).

---

## Sources

- [Aspect Oriented Programming with Spring (Spring Framework Reference)](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [Enabling @AspectJ Support (Spring Framework Reference)](https://docs.spring.io/spring-framework/reference/core/aop/ataspectj.html)
- [AopAutoConfiguration (Spring Boot API)](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/aop/AopAutoConfiguration.html)
- [Introduction to Spring AOP (Baeldung)](https://www.baeldung.com/spring-aop)
- [Get Advised Method Info in Spring AOP (Baeldung)](https://www.baeldung.com/spring-aop-get-advised-method-info)
- [Testing a Spring AOP Aspect (Baeldung)](https://www.baeldung.com/spring-aop-testing)

---

## Related pages

- [[aspectj]]
- [[jpa-transaction]]
- [[aop-transaction-order]] — @Around와 @Transactional 순서, 예외 삼킴과 롤백
- [[enable-annotations]]
