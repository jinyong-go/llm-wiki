---
title: @Enable 계열 어노테이션
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring-boot
  - configuration
---

## 1. 개요

`@EnableXxx`는 `@Configuration` 클래스에 선언해 특정 인프라 기능(비동기, 스케줄링, 트랜잭션, 캐싱 등)을 켜는 어노테이션 계열이다. XML 시대의 `<tx:annotation-driven/>`, `<task:*>`, `<cache:*>`, `<aop:aspectj-autoproxy>` 네임스페이스의 어노테이션 대응물이며, 기능에 필요한 인프라 빈(인터셉터, 포스트 프로세서 등)을 컨테이너에 등록한다.

스프링의 인프라 기능은 기본적으로 꺼져 있다. `@Transactional`, `@Async`, `@Cacheable` 같은 어노테이션을 코드에 붙여도, 이를 감지·처리할 인프라 빈이 없으면 아무 동작도 하지 않는다. `@EnableXxx`는 이 인프라 빈을 등록하는 opt-in 스위치다.

사용 시점은 다음과 같다. 부트 없이 스프링 프레임워크만 사용할 때는 필요한 기능마다 직접 선언한다. 스프링 부트에서는 자동 구성이 상당수 기능의 인프라를 조건부로 등록해 주므로 명시 선언이 필요 없는 경우가 많고, 자동 구성이 다루지 않는 기능(예: `@EnableScheduling`, `@EnableAsync`)이나 기본 구성에서 벗어나는 커스터마이징(예: `@EnableJpaRepositories`로 스캔 경로·복수 DataSource 지정, [[multi-datasource]])이 목적일 때 선언한다. 또한 자체 `@EnableMyModule`을 정의해 라이브러리 기능의 활성화 진입점으로 제공할 수도 있다(4장).

## 2. 동작 원리: @Import 메타 어노테이션

모든 `@EnableXxx`는 내부적으로 `@Import`를 메타 어노테이션으로 갖는다. import 대상의 유형에 따라 세 가지로 나뉜다. 각 유형의 상세 메커니즘은 [[bean-registration-control]] 참조.

| import 대상 유형 | 동작 | 예 |
|---|---|---|
| 일반 `@Configuration` | 설정 클래스를 그대로 추가 | `@EnableScheduling` → `SchedulingConfiguration` |
| `ImportSelector` | 속성값(주로 `mode`)에 따라 설정 클래스를 선택 | `@EnableAsync` → `AsyncConfigurationSelector` |
| `ImportBeanDefinitionRegistrar` | 어노테이션 속성을 읽어 빈 정의를 직접 등록(스캔·프록시) | `@EnableJpaRepositories` → `JpaRepositoriesRegistrar` |

### 2.1. AdviceMode 패턴

`@EnableAsync`, `@EnableCaching`, `@EnableTransactionManagement`의 import 대상은 `AdviceModeImportSelector`(`ImportSelector` 구현 추상 클래스)의 하위 클래스다. 공통 속성 `mode`로 어드바이스 적용 방식을 선택한다.

- `AdviceMode.PROXY`(기본): 프록시 기반. 프록시를 통한 호출만 가로챈다. 셀프 호출(self-invocation) 한계는 [[aop]] 참조.
- `AdviceMode.ASPECTJ`: 위빙 기반. 로컬 호출도 가로챈다.

공통 속성: `proxyTargetClass`(CGLIB 강제, PROXY 모드 한정), `order`(어드바이저 순서).

### 2.2. Configurer 커스터마이징 패턴

다수의 `@EnableXxx`는 켜진 인프라를 세부 조정하는 Configurer를 짝으로 제공한다. `@Configuration` 클래스가 구현하면 프레임워크가 호출한다. 각 Configurer는 서로 독립된 인터페이스이며 공통 상위 인터페이스/추상 클래스는 없다.

| 어노테이션 | Configurer (유형) | 조정 대상 |
|---|---|---|
| `@EnableAsync` | `AsyncConfigurer` (인터페이스) | 기본 `Executor`, 예외 핸들러 |
| `@EnableScheduling` | `SchedulingConfigurer` (인터페이스) | 스케줄러, 태스크 등록 |
| `@EnableTransactionManagement` | `TransactionManagementConfigurer` (인터페이스) | 사용할 `TransactionManager` 지정(복수 존재 시) |
| `@EnableCaching` | `CachingConfigurer` (인터페이스) | `CacheManager`, `KeyGenerator` |
| `@EnableWebMvc` | `WebMvcConfigurer` (인터페이스) | 포매터, 컨버터, 인터셉터 등 |

## 3. 대표 어노테이션 일람

| 어노테이션 | import 대상 (유형) | 활성화 기능 |
|---|---|---|
| `@EnableScheduling` | `SchedulingConfiguration` (Configuration) | `@Scheduled` 감지·실행 |
| `@EnableAsync` | `AsyncConfigurationSelector` (Selector) | `@Async` 비동기 실행 |
| `@EnableTransactionManagement` | `TransactionManagementConfigurationSelector` (Selector) | `@Transactional` ([[jpa-transaction]]) |
| `@EnableCaching` | `CachingConfigurationSelector` (Selector) | `@Cacheable`/`@CachePut` 등 |
| `@EnableAspectJAutoProxy` | `AspectJAutoProxyRegistrar` (Registrar[^1]) | `@Aspect` 자동 프록시 ([[aop]]) |
| `@EnableWebMvc` | `DelegatingWebMvcConfiguration` (Configuration) | Spring MVC 구성 |
| `@EnableAutoConfiguration` | `AutoConfigurationImportSelector` (DeferredImportSelector) | 스프링 부트 자동 구성 |
| `@EnableConfigurationProperties` | `EnableConfigurationPropertiesRegistrar` (Registrar[^1]) | `@ConfigurationProperties` 빈 등록 ([[configuration-properties]]) |
| `@EnableJpaRepositories` | `JpaRepositoriesRegistrar` (Registrar) | 리포지토리 인터페이스 스캔·프록시 생성 ([[multi-datasource]]) |

[^1]: 해당 클래스는 패키지 비공개로 공식 javadoc 페이지가 없다. Registrar 유형 표기는 어노테이션 javadoc의 역할 서술과 클래스 네이밍에 근거한 추론이다.

### 3.1. 주요 예시

**@EnableScheduling** — `@Scheduled` 메서드 감지·실행.

```java
@Configuration
@EnableScheduling
public class SchedulingConfig { }

@Component
public class ReportTask {
    @Scheduled(cron = "0 0 6 * * *")
    public void generate() { ... }
}
```

**@EnableAsync** — `@Async` 비동기 실행. `AsyncConfigurer`로 기본 Executor 지정.

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(7);
        executor.initialize();
        return executor;
    }
}
```

**@EnableTransactionManagement** — `@Transactional` 처리. `mode`/`proxyTargetClass`로 어드바이스 방식 제어.

```java
@Configuration
@EnableTransactionManagement(mode = AdviceMode.PROXY, proxyTargetClass = true)
public class TxConfig {
    @Bean
    public PlatformTransactionManager txManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

**@EnableCaching** — `@Cacheable` 등 처리. `CacheManager` 빈 필수.

```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Set.of(new ConcurrentMapCache("default")));
        return cacheManager;
    }
}
```

**@EnableAspectJAutoProxy** — `@Aspect` 자동 프록시.

```java
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig { }
```

**@EnableWebMvc** — MVC 직접 구성. `WebMvcConfigurer`로 세부 조정.

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new MyConverter());
    }
}
```

**@EnableAutoConfiguration** — 자동 구성 활성화·선택 제외.

```java
@EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)
public class MinimalApp { }
```

**@EnableConfigurationProperties** — `@ConfigurationProperties` 클래스를 빈으로 등록.

```java
@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig { }
```

**@EnableJpaRepositories** — 리포지토리 스캔 경로·연결 대상 지정.

```java
@Configuration
@EnableJpaRepositories(
    basePackages = "${my.repo.base-package}",  // 플레이스홀더·Ant 패턴 지원
    entityManagerFactoryRef = "customEmf",
    transactionManagerRef = "customTxManager")
public class JpaConfig { }
```

## 4. 커스텀 @EnableXxx 작성

`@Import`를 메타 어노테이션으로 붙이면 동일한 패턴의 어노테이션을 만들 수 있다. import 대상에서 `AnnotationMetadata`로 어노테이션 속성을 읽는다. 구현 상세는 [[bean-registration-control]] 6장 참조.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(MyModuleRegistrar.class)
public @interface EnableMyModule {
    String basePackage() default "";
}

public class MyModuleRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata meta, BeanDefinitionRegistry registry) {
        var attrs = AnnotationAttributes.fromMap(
                meta.getAnnotationAttributes(EnableMyModule.class.getName()));
        String basePackage = attrs.getString("basePackage");
        // basePackage 스캔 후 빈 정의 등록
    }
}
```

## 5. 주의사항

- **스프링 부트에서 `@EnableWebMvc`는 자동 구성 포기 선언**: 부트의 MVC 자동 구성과 `@EnableWebMvc`는 함께 동작할 수 없다. 선언하는 순간 부트가 제공하던 MVC 자동 구성(메시지 컨버터, 정적 리소스 매핑 등)이 모두 비활성화되고 Spring MVC 기본 구성만 남기 때문에, MVC 구성을 처음부터 직접 통제하려는 경우가 아니면 일반적으로 사용하지 않는다. 부트의 자동 구성을 유지하면서 인터셉터·포매터 등을 추가하려면 `@EnableWebMvc` 없이 `WebMvcConfigurer` 구현 빈만 등록한다. 선언하는 경우에도 한 개의 `@Configuration`에만 선언해야 한다. import 대상인 `DelegatingWebMvcConfiguration`이 MVC 인프라(핸들러 매핑, 어댑터 등)를 등록하는 단일 진입점이기 때문이다. 커스터마이징 콜백인 `WebMvcConfigurer`는 컨테이너의 모든 구현 빈이 수집·반영되므로, 구성 분산이 필요하면 여러 클래스가 `WebMvcConfigurer`를 구현하는 방식으로 나눈다.
- **`@EnableAutoConfiguration`은 직접 선언할 일이 거의 없음**: `@SpringBootApplication`이 `@EnableAutoConfiguration`을 메타 어노테이션으로 포함하는 합성 어노테이션이므로, 일반적인 부트 애플리케이션에서는 이미 활성화되어 있다. 별도로 선언하는 경우는 `@SpringBootApplication`을 쓰지 않는 특수한 구성(테스트 슬라이스, 최소 구성 실험 등)뿐이다. 특정 자동 구성 제외는 `@SpringBootApplication(exclude = ...)` 또는 `spring.autoconfigure.exclude` 프로퍼티로 한다.
- **`@EnableCaching`은 `CacheManager` 빈 필수**: 기본값이 없으며 이름이 아닌 타입으로 탐색한다.
- **`@EnableAspectJAutoProxy`는 로컬 컨텍스트에만 적용**: 부모/자식 컨텍스트에는 각각 선언해야 하며 classpath에 aspectjweaver가 필요하다.

---
## Sources

- [EnableAsync (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/EnableAsync.html)
- [EnableScheduling (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/EnableScheduling.html)
- [EnableTransactionManagement (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html)
- [EnableCaching (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/cache/annotation/EnableCaching.html)
- [AdviceModeImportSelector (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/AdviceModeImportSelector.html)
- [EnableAspectJAutoProxy (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/EnableAspectJAutoProxy.html)
- [EnableWebMvc (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/config/annotation/EnableWebMvc.html)
- [Servlet Web Applications :: Spring Boot](https://docs.spring.io/spring-boot/reference/web/servlet.html)
- [EnableAutoConfiguration (Spring Boot API)](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/EnableAutoConfiguration.html)
- [EnableConfigurationProperties (Spring Boot API)](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/context/properties/EnableConfigurationProperties.html)
- [EnableJpaRepositories (Spring Data JPA API)](https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/config/EnableJpaRepositories.html)

---
## Related pages

- [[bean-registration-control]]
- [[configuration-properties]]
- [[aop]]
- [[jpa-transaction]]
- [[multi-datasource]]
