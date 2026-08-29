---
title: 설정 기반 동적 빈 등록 제어
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring-boot
  - configuration
---

## 1. 개요

설정값(프로퍼티/프로파일)에 따라 빈으로 등록할 클래스·패키지를 컨테이너 부트스트랩 시점에 결정하는 방법을 다룬다. 공통 원리는 **빈 인스턴스화 이전, 빈 정의(BeanDefinition) 등록 단계에 개입**하는 것이다. 설정 소스 자체의 우선순위는 [[externalized-configuration]] 참조.

## 2. 동작 원리: 빈 정의 등록 단계

1. `ApplicationContext.refresh()` 중 `ConfigurationClassPostProcessor`(`BeanDefinitionRegistryPostProcessor` 구현체)가 `@Configuration` 클래스를 파싱한다.
2. 이 단계는 일반 빈 정의 로드 후, 빈 인스턴스화 전에 실행된다. 아래 모든 방법은 이 단계(또는 그 이전)에 개입한다.
3. `@Import` 대상(`ImportSelector`/`ImportBeanDefinitionRegistrar`)은 파싱 중 인스턴스화되며, 본 메서드 호출 전에 `EnvironmentAware`, `BeanFactoryAware`, `BeanClassLoaderAware`, `ResourceLoaderAware` 콜백이 호출된다. 따라서 `Environment`로 설정값을 읽어 등록 대상을 분기할 수 있다.
4. Aware 대신 `Environment`, `BeanFactory`, `ClassLoader`, `ResourceLoader`를 파라미터로 받는 단일 생성자도 지원된다.

## 3. @Conditional 계열 — 가장 단순한 방법

후보 설정 클래스마다 조건 어노테이션을 선언하는 방식. `@Profile`은 이것의 특수형이다.

```java
@Configuration
@ConditionalOnProperty(name = "my.feature.mode", havingValue = "kafka")
public class KafkaModuleConfig { }

@Configuration
@ConditionalOnProperty(name = "my.feature.mode", havingValue = "rabbit")
public class RabbitModuleConfig { }
```

스프링 부트는 `@ConditionalOnProperty` 외에 `@ConditionalOnClass`, `@ConditionalOnBean`/`@ConditionalOnMissingBean`, `@ConditionalOnExpression`(SpEL) 등을 제공한다. 커스텀 조건은 `Condition`을 구현한다. `ConditionContext`가 `Environment`를 제공한다.

```java
public class OnKafkaModeCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata meta) {
        return "kafka".equals(context.getEnvironment().getProperty("my.feature.mode"));
    }
}

@Configuration
@Conditional(OnKafkaModeCondition.class)
public class KafkaModuleConfig { }
```

### 3.1. 장점

- 별도 인프라 코드 없이 어노테이션만으로 동작하는 가장 선언적인 방식.
- 스프링 부트 자동 구성과 동일한 모델이라 관례에 부합하고, 조건 평가 리포트(`--debug`) 등 도구 지원이 가장 좋다.
- 클래스·`@Bean` 메서드 단위로 세밀하게 적용할 수 있고 여러 조건을 조합할 수 있다.

### 3.2. 한계

- **후보의 정적 열거**: 조건이 붙을 클래스가 코드에 미리 열거되어 있어야 한다. "설정값으로 클래스 이름·패키지를 계산"하는 것은 불가능하다.
- **분산 선언**: 후보가 많아지면 조건이 각 클래스에 흩어져 전체 분기 구조를 한눈에 파악하기 어렵다.
- **스캔 대상 자체는 제어 불가**: 컴포넌트 스캔 범위(패키지)를 바꾸는 용도가 아니다. 스캔된 후보의 등록 여부만 결정한다.

후보가 유한하고 정적으로 열거 가능하다면 이 방식으로 충분하다. 아래 방법들은 이 한계에 해당할 때의 후보다.

## 4. @ComponentScan 플레이스홀더 — 스캔 패키지 변경

스캔 패키지만 설정값으로 바꾸면 되는 경우의 후보. `basePackages`는 `Environment` 기반 `${...}` 플레이스홀더와 Ant 스타일 패키지 패턴(`org.example.**`)을 지원한다.

```java
@Configuration
@ComponentScan(basePackages = "${my.scan.base-package}")
public class DynamicScanConfig { }
```

```yaml
# application.yml
my:
  scan:
    base-package: com.example.module.kafka
```

### 4.1. 장점

- 표준 어노테이션과 프로퍼티만으로 동작한다. 추가 코드가 전혀 없어 가장 단순하다.
- Ant 스타일 패턴(`**`)으로 여러 패키지를 한 번에 지정할 수 있다.

### 4.2. 한계

- 값 검증이나 분기 로직을 넣을 수 없다. 프로퍼티 값이 곧 스캔 대상이다.
- 컴포넌트 스캔 방식으로만 등록된다. 스캔 대상이 아닌 빈(프록시, 외부 라이브러리 클래스 등)은 다룰 수 없다.

## 5. ImportSelector — 설정 클래스 이름 계산

`@Import(MySelector.class)`로 사용. `selectImports(AnnotationMetadata)`가 반환한 FQCN 문자열이 추가 `@Configuration`으로 파싱된다.

```java
public class ModeSelector implements ImportSelector, EnvironmentAware {
    private Environment env;

    @Override
    public void setEnvironment(Environment env) { this.env = env; }

    @Override
    public String[] selectImports(AnnotationMetadata meta) {
        String mode = env.getProperty("my.mode", "local");
        return new String[]{"com.example.config." + StringUtils.capitalize(mode) + "Config"};
    }
}

@Configuration
@Import(ModeSelector.class)
public class AppConfig { }
```

### 5.1. DeferredImportSelector

모든 `@Configuration` 클래스 처리가 끝난 뒤 실행되는 변형. `@Conditional` 평가 순서가 중요할 때(예: 사용자 정의 빈 존재 여부에 따라 기본 구성을 공급) 사용한다. 스프링 부트 자동 구성의 `AutoConfigurationImportSelector`가 이 방식으로 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`의 후보를 로드한다.

```java
public class DefaultsSelector implements DeferredImportSelector, EnvironmentAware {
    private Environment env;

    @Override
    public void setEnvironment(Environment env) { this.env = env; }

    @Override
    public String[] selectImports(AnnotationMetadata meta) {
        // 사용자 @Configuration이 모두 파싱된 뒤 호출됨
        return env.getProperty("my.defaults.enabled", Boolean.class, true)
                ? new String[]{"com.example.config.DefaultsConfig"}
                : new String[0];
    }
}
```

### 5.2. 장점

- `@Conditional`과 달리 등록할 설정 클래스 이름을 설정값으로 **계산**할 수 있다.
- 분기 로직이 셀렉터 한 곳에 모여 전체 분기 구조를 파악하기 쉽다.
- `DeferredImportSelector`로 사용자 설정 이후로 평가를 미룰 수 있다(자동 구성과 동일 메커니즘).

### 5.3. 한계

- 반환이 FQCN 문자열이라 컴파일 타임 타입 안전성이 없다. 오타·이름 변경은 런타임에 발견된다.
- 등록 단위가 `@Configuration` 클래스다. 임의 빈 정의를 직접 만들 수는 없다(그 용도는 6장).
- 셀렉터 자체는 정식 빈이 아니므로 일반 DI를 받을 수 없다. `Environment` 등 지원되는 4종만 접근 가능하다.

## 6. ImportBeanDefinitionRegistrar — 빈 정의 직접 생성

`@Import`로 사용하되 클래스 이름 반환 대신 `BeanDefinitionRegistry`에 빈 정의를 직접 등록한다. MyBatis `@MapperScan`([[mybatis]]), Spring Cloud `@EnableFeignClients`가 이 방식이다.

```java
public class ScanRegistrar implements ImportBeanDefinitionRegistrar, EnvironmentAware {
    private Environment env;

    @Override
    public void setEnvironment(Environment env) { this.env = env; }

    @Override
    public void registerBeanDefinitions(AnnotationMetadata meta, BeanDefinitionRegistry registry) {
        var scanner = new ClassPathBeanDefinitionScanner(registry, false, env);
        scanner.addIncludeFilter(new AnnotationTypeFilter(MyMarker.class));
        scanner.scan(env.getProperty("my.scan.base-package"));
    }
}

@Configuration
@Import(ScanRegistrar.class)
public class AppConfig { }
```

### 6.1. 장점

- 빈 정의를 직접 생성하므로 설정값 기반 패키지 스캔, 프록시 빈, 외부 라이브러리 클래스 등록 등 `@Configuration` 클래스 단위로 표현할 수 없는 등록이 가능하다.
- `AnnotationMetadata`로 어노테이션 속성을 읽을 수 있어 `@EnableXxx(basePackages=...)` 형태의 커스텀 어노테이션 구현에 적합하다.
- 빈 이름·스코프·프로퍼티 등 `BeanDefinition` 수준의 세부 제어가 가능하다.

### 6.2. 한계

- 셀렉터보다 코드량과 복잡도가 크다. 단순히 설정 클래스를 켜고 끄는 용도라면 과하다.
- `BeanDefinitionRegistryPostProcessor` 타입 빈은 라이프사이클 제약으로 여기서 등록할 수 없다.
- 정식 빈이 아니므로 일반 DI 불가(지원되는 4종만). 리플렉션·문자열 기반 등록이라 컴파일 타임 검증이 약하다.

## 7. BeanDefinitionRegistryPostProcessor — @Import 없는 전역 개입

`@Import` 진입점 없이 같은 단계에 개입하는 후보. 정식 빈으로 등록되므로 Aware 콜백이 동작한다. 일반 빈 정의 로드 후, 다른 `BeanFactoryPostProcessor` 실행 전, 빈 인스턴스화 전에 `postProcessBeanDefinitionRegistry()`가 호출된다.

```java
@Component
public class DynamicRegistrarProcessor
        implements BeanDefinitionRegistryPostProcessor, EnvironmentAware {
    private Environment env;

    @Override
    public void setEnvironment(Environment env) { this.env = env; }

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        if (env.getProperty("my.feature.enabled", Boolean.class, false)) {
            var bd = BeanDefinitionBuilder
                    .genericBeanDefinition(MyFeatureService.class)
                    .getBeanDefinition();
            registry.registerBeanDefinition("myFeatureService", bd);
        }
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) { }
}
```

### 7.1. 장점

- `@Import` 어노테이션 진입점이 필요 없다. 컴포넌트 스캔이나 `@Bean`으로 등록하면 컨테이너 전역에 개입한다.
- 일반 빈 정의가 모두 로드된 뒤 실행되므로 기존 빈 정의를 조회·수정·삭제할 수도 있다.
- 다른 `BeanFactoryPostProcessor`보다 먼저 실행되어, 등록한 빈 정의가 이후 후처리 대상에 포함된다.

### 7.2. 한계

- 이 빈과 그 의존성은 컨테이너 초기 단계에 생성되므로 다른 빈 의존이나 `@Value` 주입은 피하고 `Environment`만 사용하는 것이 안전하다.[^1]
- 진입점이 어노테이션에 드러나지 않아 어디서 빈이 등록되는지 코드 추적이 어렵다.[^1]
- 기존 빈 정의까지 수정할 수 있는 강한 권한만큼 남용 시 구성 파악이 어려워진다.[^1]

[^1]: 출처의 직접 서술이 아니라 BeanFactoryPostProcessor의 조기 인스턴스화·프로그래밍 방식 등록이라는 동작 특성으로부터 도출한 실무 권고임.

## 8. ApplicationContextInitializer — refresh 이전 개입

`refresh()` 이전에 `ConfigurableApplicationContext`를 받아 프로그래밍 방식으로 초기화하는 콜백. 프로퍼티 소스 등록·프로파일 활성화·빈 등록에 사용한다. `SpringApplication.addInitializers()` 또는 `spring.context.initializer.classes` 프로퍼티로 등록한다.

```java
public class MyInitializer
        implements ApplicationContextInitializer<GenericApplicationContext> {
    @Override
    public void initialize(GenericApplicationContext ctx) {
        if (ctx.getEnvironment().getProperty("my.feature.enabled", Boolean.class, false)) {
            ctx.registerBean(MyFeatureService.class);
        }
    }
}

@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        var app = new SpringApplication(MyApplication.class);
        app.addInitializers(new MyInitializer());
        app.run(args);
    }
}
```

### 8.1. 장점

- `refresh()` 이전에 실행되는 가장 이른 개입 지점. 빈 등록뿐 아니라 프로퍼티 소스 추가·프로파일 활성화 등 컨텍스트 자체를 구성할 수 있다.
- 함수형 인터페이스라 람다로 등록할 수 있고, `registerBean()` 함수형 등록과 조합하면 리플렉션 기반 빈 정의 없이 동작한다.

### 8.2. 한계

- 어노테이션 구성 모델 밖에 있다. `SpringApplication` 코드나 프로퍼티로 별도 등록해야 하므로 라이브러리 형태로 자동 적용하기 번거롭다.
- `@Configuration` 파싱 이전 시점이라 다른 빈 정의를 참조하는 분기는 불가능하다.

## 9. BeanRegistrar (Spring Framework 7.0+) — 함수형 등록

함수형 빈 등록의 공식 인터페이스. `@Import`로 사용하며 `register(BeanRegistry, Environment)`로 `Environment`를 직접 받는다.

```java
class MyBeanRegistrar implements BeanRegistrar {
    @Override
    public void register(BeanRegistry registry, Environment env) {
        if (env.matchesProfiles("baz")) {
            registry.registerBean(Baz.class);
        }
    }
}

@Configuration
@Import(MyBeanRegistrar.class)
public class MyConfiguration { }
```

### 9.1. 장점

- `Environment`를 메서드 시그니처로 직접 받는다. Aware 구현이나 생성자 주입 보일러플레이트가 없다.
- if/for 등 일반 제어 흐름으로 등록을 분기할 수 있고, supplier 기반 등록으로 리플렉션 없이 인스턴스를 생성한다.
- AOT 변환과 GraalVM 네이티브 이미지를 공식 지원한다.

### 9.2. 한계

- Spring Framework 7.0(Spring Boot 4)부터만 사용할 수 있다. 이전 버전과 호환되지 않는다.
- 6장 `ImportBeanDefinitionRegistrar`와 달리 `AnnotationMetadata`를 받지 않으므로 `@EnableXxx(속성)` 형태의 어노테이션 속성 기반 분기에는 부적합하다.

## 10. 커스텀 자동 구성 모듈 — 라이브러리 배포 형태

위 방법들을 조합해 라이브러리로 배포하는 형태. `META-INF/spring/...AutoConfiguration.imports` + `@AutoConfiguration` + `@ConditionalOnProperty` 조합이 프레임워크 권장 형태다. `@ConfigurationProperties`와의 조합은 [[configuration-properties]] 참조.

```java
@AutoConfiguration
@ConditionalOnProperty(name = "libx.enabled", havingValue = "true")
public class LibXAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    LibXService libXService() {
        return new LibXService();
    }
}
```

```
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.mycorp.libx.autoconfigure.LibXAutoConfiguration
```

### 10.1. 장점

- 사용하는 쪽은 의존성 추가와 프로퍼티 설정만으로 모듈이 켜지고 꺼진다. 스프링 부트가 권장하는 배포 형태다.
- `@AutoConfigureBefore/After` 등으로 자동 구성 간 순서를 제어할 수 있다.
- `@ConditionalOnMissingBean`과 조합해 사용자 정의 빈이 있으면 물러나는 기본값 제공 패턴을 구현할 수 있다.

### 10.2. 한계

- 자동 구성 클래스는 imports 파일로만 로드되어야 하며 컴포넌트 스캔 대상이 되면 안 된다. 별도 모듈/패키지 분리가 필요하다.
- 단일 애플리케이션 내부의 단순 분기 목적으로는 구조가 과하다.[^2]

[^2]: 자동 구성 모듈의 구조 요구(별도 모듈 분리, imports 파일 로드)로부터 도출한 실무 권고임.

## 11. 선택 기준

| 방법 | 적합한 경우 |
|---|---|
| `@ConditionalOnProperty` / `@Profile` | 후보를 정적으로 열거 가능 (대부분 충분) |
| `@ComponentScan` + `${...}` | 스캔 패키지만 변경 |
| `ImportSelector` | 켤 설정 클래스 이름을 설정값으로 계산 |
| `ImportBeanDefinitionRegistrar` | 패키지 스캔·프록시 등 빈 정의 직접 생성 |
| `BeanDefinitionRegistryPostProcessor` | `@Import` 진입점 없이 전역 개입 |
| `ApplicationContextInitializer` / `BeanRegistrar` | refresh 이전 프로그래밍 등록·AOT 친화 |

공통 제약: 모두 빈 인스턴스화 전에 결정이 끝난다. 런타임 중 빈 교체는 이 계열이 아닌 별도 패턴(전략 맵 주입 등)의 영역이다.

---
## Sources

- [ImportSelector (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/ImportSelector.html)
- [ImportBeanDefinitionRegistrar (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/ImportBeanDefinitionRegistrar.html)
- [BeanDefinitionRegistryPostProcessor (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/support/BeanDefinitionRegistryPostProcessor.html)
- [ComponentScan (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/ComponentScan.html)
- [ApplicationContextInitializer (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationContextInitializer.html)
- [Programmatic Bean Registration :: Spring Framework](https://docs.spring.io/spring-framework/reference/core/beans/java/programmatic-bean-registration.html)
- [Creating Your Own Auto-configuration :: Spring Boot](https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html)

---
## Related pages

- [[externalized-configuration]]
- [[configuration-properties]]
- [[mybatis]]
- [[enable-annotations]]
