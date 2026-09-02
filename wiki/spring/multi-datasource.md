---
title: JPA 다중 DB 설정
updated: 2026-07-09 17:57:59
tags:
  - java
  - spring
  - spring-boot
  - jpa
  - datasource
  - database
---

## 1. 개요

JPA에서 다중 DB를 다룰 때 기본 모델은 **독립 persistence unit 구성**이다. 각 DB마다 `DataSource`, `LocalContainerEntityManagerFactoryBean`, `PlatformTransactionManager`, `@EnableJpaRepositories`를 따로 둔다.

---

## 2. 필수 구성 요소

| 구성 요소 | 역할 | 다중 DB에서 주의할 점 |
|---|---|---|
| `DataSource` | JDBC 커넥션 풀 | 각 DB별로 별도 빈 필요 |
| `DataSourceProperties` | URL, 계정, 풀 설정 바인딩 | 각 prefix 별로 분리 (`app.datasource.foo.*`) |
| `LocalContainerEntityManagerFactoryBean` | JPA `EntityManagerFactory` 생성 | DB별 엔티티 패키지와 `DataSource`를 연결 |
| `PlatformTransactionManager` (`JpaTransactionManager`) | 트랜잭션 경계 관리 | DB별 트랜잭션 매니저를 분리 |
| `@EnableJpaRepositories` | 리포지토리 스캔/바인딩 | `entityManagerFactoryRef`, `transactionManagerRef`를 명시 |
| `@EntityScan` 또는 `packagesToScan` | 엔티티 스캔 범위 제한 | DB별 엔티티가 섞이지 않게 분리 |

---

## 3. 기본 원칙

### 3.1. 추가 `DataSource`는 주입 후보 충돌을 피해야 한다

Spring Boot How-to 문서의 다중 `DataSource` 예시는 **추가 `DataSource` 빈에 `defaultCandidate=false`를 지정**하고, 주입 시 `@Qualifier`를 함께 사용한다. 이렇게 해야 기본 `DataSource` 자동 설정이 불필요하게 물러서지 않고, 주입 지점도 명확해진다.

```java
@Qualifier("orders")
@Bean(defaultCandidate = false)
@ConfigurationProperties("app.datasource.orders")
public DataSourceProperties ordersDataSourceProperties() {
    return new DataSourceProperties();
}

@Qualifier("orders")
@Bean(defaultCandidate = false)
@ConfigurationProperties("app.datasource.orders.configuration")
public HikariDataSource ordersDataSource(
        @Qualifier("orders") DataSourceProperties properties) {
    return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class)
            .build();
}
```

### 3.2. 1-1. `DataSource` 설정 방식은 두 단계로 나눠 생각한다

Spring Boot How-to 문서 기준으로 `DataSource` 설정은 다음 두 단계다.

| 단계 | 역할 | 대표 방법 |
|---|---|---|
| 연결 정보 바인딩 | URL, 사용자명, 비밀번호, 드라이버, 공통 속성 | `DataSourceProperties` 또는 `@ConfigurationProperties` |
| 실제 풀 인스턴스 생성 | Hikari/Tomcat/DBCP2 등 실제 `DataSource` 생성 | `DataSourceBuilder.create()` 또는 `initializeDataSourceBuilder()` |

문서가 보여 주는 대표 방식은 두 가지다.

| 방식 | 예시 | 특징 |
|---|---|---|
| `DataSourceBuilder` 직접 생성 | `DataSourceBuilder.create().type(HikariDataSource.class).build()` | 단순하지만 Hikari의 `url`/`jdbc-url` 차이를 직접 처리해야 할 수 있음 |
| `DataSourceProperties` 기반 생성 | `properties.initializeDataSourceBuilder()` | `url` -> `jdbc-url` 변환을 포함해 Spring Boot 기본 동작과 가장 유사 |

다중 DB에서는 두 번째 방식이 보통 더 안전하다. DB마다 prefix를 나누고, 각 `DataSourceProperties`가 자기 설정만 들고 있도록 만들기 쉽기 때문이다.

### 3.3. 1-2. 가장 단순한 방식: `DataSourceBuilder` 직접 사용

추가 `DataSource` 하나만 빠르게 등록할 때는 `DataSourceBuilder`를 직접 써도 된다.

```java
@Qualifier("orders")
@Bean(defaultCandidate = false)
@ConfigurationProperties("app.datasource.orders")
public HikariDataSource ordersDataSource() {
    return DataSourceBuilder.create()
            .type(HikariDataSource.class)
            .build();
}
```

이 방식의 주의점은 Hikari가 `url` 대신 `jdbc-url` 속성을 사용한다는 점이다. 따라서 `@ConfigurationProperties`를 Hikari에 바로 바인딩하면 다음처럼 써야 할 수 있다.

```properties
app.datasource.orders.jdbc-url=jdbc:mysql://localhost/orders
app.datasource.orders.username=dbuser
app.datasource.orders.password=dbpass
```

### 3.4. 1-3. 권장 방식: `DataSourceProperties` + `initializeDataSourceBuilder()`

Spring Boot 문서는 `DataSourceProperties`가 `url` -> `jdbc-url` 번역을 처리하므로, Hikari를 쓸 때도 일반적인 `url` 속성을 유지할 수 있다고 설명한다.

```java
@Qualifier("orders")
@Bean(defaultCandidate = false)
@ConfigurationProperties("app.datasource.orders")
public DataSourceProperties ordersDataSourceProperties() {
    return new DataSourceProperties();
}

@Qualifier("orders")
@Bean(defaultCandidate = false)
@ConfigurationProperties("app.datasource.orders.configuration")
public HikariDataSource ordersDataSource(
        @Qualifier("orders") DataSourceProperties properties) {
    return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class)
            .build();
}
```

```properties
app.datasource.orders.url=jdbc:mysql://localhost/orders
app.datasource.orders.username=dbuser
app.datasource.orders.password=dbpass
app.datasource.orders.configuration.maximum-pool-size=30
```

이 패턴의 장점은 다음과 같다.

- 연결 정보와 풀 구현별 튜닝 속성을 분리할 수 있다
- Hikari를 명시적으로 써도 `url` 속성을 그대로 유지할 수 있다
- Spring Boot 자동 설정과 비슷한 모델을 수동 다중 DB 구성에 재사용할 수 있다

### 3.5. 1-4. 첫 번째 DB와 추가 DB의 prefix를 분리한다

How-to 예시는 기본 `DataSource`는 `spring.datasource.*`, 추가 `DataSource`는 `app.datasource.*`처럼 나누어 설명한다. 실무에서는 이름이 더 드러나는 prefix를 쓰는 편이 낫다.

```properties
app.datasource.orders.url=jdbc:mysql://localhost/orders
app.datasource.orders.username=orders_user
app.datasource.orders.password=secret
app.datasource.orders.configuration.maximum-pool-size=20

app.datasource.billing.url=jdbc:mysql://localhost/billing
app.datasource.billing.username=billing_user
app.datasource.billing.password=secret
app.datasource.billing.configuration.maximum-pool-size=10
```

핵심은 prefix 이름 자체가 아니라, **DB별 설정 키 공간이 겹치지 않게 분리되는 것**이다.

### 3.6. JPA는 DB마다 `EntityManagerFactory`와 `TransactionManager`를 분리한다

Spring Data JPA 문서는 `LocalContainerEntityManagerFactoryBean`과 `JpaTransactionManager`를 직접 등록하는 구성을 보여 준다. 복수 DB에서는 이 구성을 **DB별로 반복**하고, 각 리포지토리가 어느 `EntityManagerFactory`/`TransactionManager`를 쓸지 명시해야 한다.

```java
@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(
        basePackages = "com.example.orders.repository",
        entityManagerFactoryRef = "ordersEntityManagerFactory",
        transactionManagerRef = "ordersTransactionManager"
)
class OrdersJpaConfig {

    @Bean
    LocalContainerEntityManagerFactoryBean ordersEntityManagerFactory(
            @Qualifier("orders") DataSource dataSource) {
        var vendorAdapter = new HibernateJpaVendorAdapter();
        var factory = new LocalContainerEntityManagerFactoryBean();
        factory.setJpaVendorAdapter(vendorAdapter);
        factory.setDataSource(dataSource);
        factory.setPackagesToScan("com.example.orders.entity");
        return factory;
    }

    @Bean
    PlatformTransactionManager ordersTransactionManager(
            @Qualifier("ordersEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```

같은 방식으로 `billing`, `audit` 등 다른 DB용 설정 클래스를 별도로 둔다.

### 3.7. 리포지토리와 엔티티 스캔 범위를 섞지 않는다

Spring Boot는 기본적으로 애플리케이션 패키지를 기준으로 `Repository`와 `@Entity`를 스캔한다. 다중 DB에서는 이 기본 스캔에만 의존하면 리포지토리가 잘못된 `EntityManagerFactory`에 연결되기 쉽다.

따라서 다음 둘 중 하나를 택한다.

- `@EnableJpaRepositories(basePackages=..., entityManagerFactoryRef=..., transactionManagerRef=...)`로 리포지토리 묶음을 명시적으로 분리
- `factory.setPackagesToScan(...)` 또는 `@EntityScan(...)`으로 엔티티 범위를 명시적으로 분리

---

## 4. 권장 구조

```text
com.example
├─ orders
│  ├─ entity
│  └─ repository
├─ billing
│  ├─ entity
│  └─ repository
└─ config
   ├─ OrdersJpaConfig
   └─ BillingJpaConfig
```

이 구조의 핵심은 다음이다.

- DB마다 엔티티 패키지를 분리
- DB마다 리포지토리 패키지를 분리
- 설정 클래스에서 각 패키지를 특정 `EntityManagerFactory`에 연결

---

## 5. 선택 기준

| 상황 | 적합한 방식 |
|---|---|
| 주문 DB와 정산 DB처럼 스키마/엔티티/리포지토리가 서로 다름 | DB별 `EntityManagerFactory` 분리 |
| 각 DB에 서로 다른 트랜잭션 정책이 필요함 | DB별 `JpaTransactionManager` 분리 |
| 리포지토리별로 다른 DB 연결이 필요함 | `@EnableJpaRepositories` 단위 분리 |

---

## 6. 체크리스트

- 추가 `DataSource`에 `@Bean(defaultCandidate=false)`를 붙였는가
- 각 `DataSource`에 별도 prefix를 두었는가
- 각 JPA 설정이 `LocalContainerEntityManagerFactoryBean`을 직접 만드는가
- 각 `@EnableJpaRepositories`가 `entityManagerFactoryRef`와 `transactionManagerRef`를 명시하는가
- 엔티티 패키지와 리포지토리 패키지가 DB별로 분리되어 있는가

---

## Sources
- [Data Access :: Spring Boot](https://docs.spring.io/spring-boot/how-to/data-access.html)
- [Configuration :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/create-instances.html)

---

## Related pages
- [[routing-datasource]]
- [[enable-annotations]]
