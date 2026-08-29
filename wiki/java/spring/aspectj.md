---
title: AspectJ
updated: 2026-07-08 10:50:28
tags:
  - java
  - aop
  - aspectj
  - weaving
---

## 1. 개요

AspectJ는 Java의 원조 AOP 프레임워크로, 완전한 AOP 솔루션을 목표로 한다. Spring AOP가 프록시 기반 런타임 위빙만 지원하는 것과 달리, AspectJ는 컴파일 타임·포스트 컴파일·로드 타임 위빙을 모두 지원하며 더 넓은 범위의 Join Point를 제어할 수 있다.

---

## 2. 위빙 방식 3종

### 2.1. 컴파일 타임 위빙 (Compile-time Weaving, CTW)

AspectJ 컴파일러(ajc)가 소스 코드와 Aspect를 함께 컴파일해 위빙된 클래스 파일을 생성한다.

```
[소스 .java] + [Aspect .java] → ajc → [위빙된 .class]
```

- 런타임 오버헤드 없음 (가장 빠름)
- 빌드 도구에 ajc 통합 필요

**Gradle 설정 예시 (Freefair 플러그인):**

```groovy
plugins {
    id "io.freefair.aspectj.post-compile-weaving" version "8.x"
}
dependencies {
    aspectpath "org.aspectj:aspectjrt:1.9.x"
}
```

### 2.2. 포스트 컴파일 위빙 (Post-compile Weaving)

바이너리 위빙(binary weaving)이라고도 한다. 이미 컴파일된 클래스 파일이나 JAR를 ajc로 재처리하여 위빙한다. 소스 코드를 수정할 수 없는 서드파티 라이브러리에 Aspect를 적용할 때 사용한다.

```
[기존 .class / .jar] → ajc (post-compile) → [위빙된 .class]
```

### 2.3. 로드 타임 위빙 (Load-time Weaving, LTW)

클래스 로더가 JVM에 클래스를 로드하는 시점에 위빙한다. 바이너리를 수정하지 않으므로 유연하지만, `-javaagent`로 AspectJ 에이전트를 JVM에 붙여야 한다.

```bash
java -javaagent:aspectjweaver.jar -jar app.jar
```

**Spring과 LTW 통합:**

```java
@Configuration
@EnableLoadTimeWeaving
public class LtwConfig { }
```

또는 `aop.xml`로 선언적 구성:

```xml
<!-- META-INF/aop.xml -->
<aspectj>
    <weaver options="-verbose">
        <include within="com.example.*"/>
    </weaver>
    <aspects>
        <aspect name="com.example.aspect.SecurityAspect"/>
    </aspects>
</aspectj>
```

---

## 3. 위빙 방식 비교

| 항목 | CTW | 포스트 컴파일 | LTW | Spring AOP |
|---|---|---|---|---|
| 위빙 시점 | 컴파일 | 빌드 후 | 클래스 로드 | 런타임 |
| 성능 | 최고 | 높음 | 보통 | 낮음 |
| 소스 수정 불필요 | X | O | O | O |
| JVM 에이전트 | 불필요 | 불필요 | 필요 | 불필요 |
| 빌드 복잡도 | 높음 | 높음 | 중간 | 낮음 |

---

## 4. Join Point 지원 범위

Spring AOP는 메서드 실행만 지원하지만 AspectJ는 훨씬 넓은 범위를 지원한다.

| Join Point | Spring AOP | AspectJ |
|---|---|---|
| 메서드 실행 (Method Execution) | O | O |
| 메서드 호출 (Method Call) | X | O |
| 생성자 호출 (Constructor Call) | X | O |
| 생성자 실행 (Constructor Execution) | X | O |
| 필드 읽기 (Field Reference) | X | O |
| 필드 쓰기 (Field Assignment) | X | O |
| 정적 초기화자 실행 | X | O |
| 객체 초기화 | X | O |
| 예외 핸들러 실행 | X | O |
| Advice 실행 | X | O |

AspectJ는 `final` 클래스·메서드, `static` 메서드에도 적용 가능하다. Spring AOP는 이들을 오버라이드할 수 없어 적용 불가.

---

## 5. @AspectJ 스타일과 Spring 통합

AspectJ의 어노테이션 문법(`@Aspect`, `@Before`, `@Around` 등)은 **Spring AOP에서도 그대로 사용**된다. 이때 위빙은 AspectJ가 아닌 Spring의 런타임 프록시로 수행된다.

**활성화 방법:**

```java
@Configuration
@EnableAspectJAutoProxy
public class AopConfig { }
```

Spring Boot에서는 `spring-boot-starter-aop` 추가 시 자동 활성화된다. `aspectjweaver` 라이브러리(1.9+)가 클래스패스에 있어야 한다.

**@AspectJ 스타일 Aspect 예시:**

```java
@Aspect
@Component
public class SecurityAspect {

    @Before("@annotation(com.example.RequiresAdmin)")
    public void checkAdminRole(JoinPoint jp) {
        // 권한 확인 로직
    }
}
```

이 코드는 Spring AOP(런타임 프록시)와 AspectJ CTW/LTW 양쪽에서 모두 동작한다.

---

## 6. AspectJ 컴파일러 (ajc)

| 도구 | 설명 |
|---|---|
| `ajc` | AspectJ 컴파일러. `.aj` 파일 및 Java 소스를 컴파일하고 위빙 수행. |
| `ajdb` | AspectJ 디버거 |
| `ajdoc` | AspectJ 문서 생성기 |
| `ajbrowser` | 프로그램 구조 뷰어 |

Maven으로 CTW 적용:

```xml
<plugin>
    <groupId>dev.aspectj</groupId>
    <artifactId>aspectj-maven-plugin</artifactId>
    <version>1.14</version>
    <configuration>
        <complianceLevel>17</complianceLevel>
    </configuration>
    <executions>
        <execution>
            <goals><goal>compile</goal></goals>
        </execution>
    </executions>
</plugin>
```

---

## 7. 선택 기준

| 상황 | 선택 |
|---|---|
| Spring Bean 메서드만 어드바이스하면 충분 | Spring AOP |
| self-invocation, static, final 메서드 인터셉션 필요 | AspectJ |
| Spring 컨테이너 외부 객체(도메인 객체 등) | AspectJ |
| 수만 개 이상의 Aspect → 성능 민감 | AspectJ CTW/LTW |
| 빠른 개발, 낮은 빌드 복잡도 | Spring AOP |

Spring AOP와 AspectJ는 상호 호환된다. Spring AOP로 처리할 수 있는 부분은 Spring AOP를 쓰고, 지원 범위 밖의 경우에만 AspectJ를 추가 도입하는 혼합 전략도 유효하다.

---

## Sources

- [Comparing Spring AOP and AspectJ (Baeldung)](https://www.baeldung.com/spring-aop-vs-aspectj)
- [Enabling @AspectJ Support (Spring Framework Reference)](https://docs.spring.io/spring-framework/reference/core/aop/ataspectj.html)
- [Aspect Oriented Programming with Spring (Spring Framework Reference)](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [The AspectJ Project (Eclipse)](https://www.eclipse.org/aspectj/)

---

## Related pages

- [[aop]]
