---
title: EntityListener 의존성 주입
updated: 2026-07-10 14:51:34
tags:
  - java
  - jpa
  - spring
  - hibernate
  - entity
  - di
---

## 1. 개요

[[jpa-entity-lifecycle|EntityListener]]에 `@Autowired`로 빈을 주입하면 콜백 실행 시 필드가 `null`인 경우가 있다.
원인은 리스너 인스턴스의 생성 주체(JPA 프로바이더)와 생성 시점(`EntityManagerFactory` 부트스트랩)에 있다.

---

## 2. 리스너 인스턴스 생성 구조

JPA에서 EntityListener 인스턴스는 Spring이 아닌 **영속성 프로바이더가 생성·관리**한다.
Spring 연동 시 생성 경로:

Hibernate `ManagedBeanRegistry` → `BeanContainer` SPI → `SpringBeanContainer` → Spring `BeanFactory`

- Hibernate 5.3+: 리스너·컨버터 등 확장 포인트의 인스턴스 생성을 `BeanContainer` SPI에 위임 가능 (`hibernate.resource.beans.container`)
- Spring 5.1+: SPI 구현체 `SpringBeanContainer` 제공 — `ConfigurableListableBeanFactory`에 위임
- Spring Boot: `HibernateJpaConfiguration`이 `SpringBeanContainer`를 자동 설정

Hibernate 전용 메커니즘이므로 다른 JPA 구현체에는 적용되지 않는다.

---

## 3. 주입이 실패하는 이유

`SpringBeanContainer`가 있어도 주입이 항상 성공하는 것은 아니다.

1. 리스너 인스턴스는 `EntityManagerFactory` 초기화 시점에 생성된다. 이는 애플리케이션 구동 초기라 **대부분의 빈이 아직 등록되기 전**이다.
2. `SpringBeanContainer.createBean()`은 `beanFactory.createBean()`으로 autowiring을 시도하지만, 의존 빈을 만들 수 없으면 **Hibernate 기본 생성자(리플렉션)로 fallback**한다. 이때 DEBUG 로그만 남기므로 실패가 조용히 지나간다 — 콜백에서 `null` 필드로 발견된다.
3. 생성된 리스너 인스턴스는 캐시되어 재사용된다. 이후 컨텍스트가 완성되어도 재생성되지 않는다.

Spring Data의 `AuditingEntityListener`가 동작하는 것은 `@EnableJpaAuditing`이 `EntityManagerFactory` 초기화 전에 필요한 빈(`AuditingHandler`)을 준비해 두기 때문이다.

> 출처 간 관점 차이: Spring javadoc([SpringBeanContainer](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/orm/hibernate5/SpringBeanContainer.html))은 `SpringBeanContainer`로 리스너 autowiring을 지원한다고 기술하고, 참조 기사([Medium](https://medium.com/@kindtiger95/hibernate-entitylistener-객체에-bean-주입이-안되는-이유-e3ed8268a068))는 주입 실패를 보고한다. 실제 성패는 EMF 부트스트랩 시점에 의존 빈을 생성할 수 있는지에 달려 있다.

리스너가 생성자 주입 의존을 갖고 `@EnableJpaAuditing` 등과 결합하면 EMF 초기화 중 **데드락**이 발생할 수 있다(Spring Boot [#22997](https://github.com/spring-projects/spring-boot/issues/22997), Hibernate 측 문제로 분류). 의존성을 `ObjectFactory`로 감싸면 우회된다.

---

## 4. 대안

### 4.1. 이벤트 발행으로 로직 이전 (권장)

리스너는 이벤트 발행만 하고, 비즈니스 로직은 Spring이 관리하는 핸들러 빈으로 옮긴다.

`ApplicationEventPublisher`는 Spring 인프라가 미리 준비해 두는 빈이라 EMF 부트스트랩 시점에도 주입이 성공한다.

```java
public class UserEntityListener {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostPersist
    public void onPostPersist(User user) {
        eventPublisher.publishEvent(new UserCreatedEvent(user));
    }
}

@Component
public class UserCreatedEventHandler {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(UserCreatedEvent event) {
        // Spring 빈이므로 DI 자유롭게 사용
    }
}
```

`@PostPersist`는 커밋 전에 실행되므로([[jpa-entity-lifecycle]] 2.2), 커밋 확정 후 로직은 `@TransactionalEventListener(AFTER_COMMIT)`로 처리한다. 이벤트 메커니즘 상세는 [[spring-event]] 참고.

### 4.2. 지연 조회 주입

의존 빈의 조회를 리스너 생성 시점이 아닌 사용 시점으로 미루는 방식.

- `@Lazy @Autowired`: 프록시로 주입되고 첫 사용 시 실제 빈을 조회하므로 생성 시점 문제를 우회
- `ApplicationContext`를 주입받아 콜백 안에서 `getBean()`: 사용 시점 조회라 EMF 생성 이후에 실행됨
- 의존 대상이 리포지토리라면 `@EnableJpaRepositories(bootstrapMode = BootstrapMode.DEFERRED)`로 초기화 순서 문제 완화 가능

### 4.3. static 필드 주입 (비권장)

`@Component` 설정 클래스의 `@PostConstruct`에서 리스너의 static 필드에 빈을 대입하는 방식. 동작은 하지만 초기화 순서 의존·동시성 문제가 있어 참조 기사도 비판한다.
마커 인터페이스 + `@PostConstruct` 리플렉션으로 일괄 주입하는 체계화 변형도 같은 계열이다.

---

## Sources

- [Hibernate EntityListener 객체에 Bean 주입이 안되는 이유 (Medium)](https://medium.com/@kindtiger95/hibernate-entitylistener-객체에-bean-주입이-안되는-이유-e3ed8268a068)
- [Hibernate User Guide §25 — Managed Beans](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#beans)
- [SpringBeanContainer (Spring Framework 6.2 Javadoc)](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/orm/hibernate5/SpringBeanContainer.html)
- [SpringBeanContainer 소스 (v6.2.7) — fallback 로직](https://github.com/spring-projects/spring-framework/blob/v6.2.7/spring-orm/src/main/java/org/springframework/orm/hibernate5/SpringBeanContainer.java)
- [Spring Boot HibernateJpaConfiguration 소스](https://github.com/spring-projects/spring-boot/blob/v3.5.0/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/orm/jpa/HibernateJpaConfiguration.java)
- [JPA EntityListeners에서 @Autowired 미동작 문제 해결 (kimchanjung)](https://kimchanjung.github.io/programming/2020/06/28/spring-jpa-antity-listner-autowired-not-working/) — ApplicationEventPublisher + 이벤트 발행 패턴
- [EntityListeners에서 DI를 하는 방법 (kangwoojin)](https://kangwoojin.github.io/programing/jpa-entity-listeners/) — @Lazy·ApplicationContext·BootstrapMode
- [JPA EntityListeners에 의존성 주입하기 (keencho)](https://blog.keencho.com/posts/jpa-entity-listener-di/) — static 일괄 주입 변형
- [Deadlock on JPA EntityListener instantiation (Spring Boot #22997)](https://github.com/spring-projects/spring-boot/issues/22997)

---

## Related pages

- [[jpa-entity-lifecycle]]
- [[enable-annotations]]
- [[spring-event]]
- [[dependency-injection]]
