---
title: JPA $N+1$ 문제 ($N+1$ Problem)
updated: 2026-07-03 14:54:06
tags:
  - java
  - jpa
  - hibernate
  - spring-data-jpa
  - performance
---

## 1. 개요
**$N+1$ 문제**는 단일 요청(예: 모든 User 조회)에 대해 연관된 정보를 가져오기 위해 각 엔티티마다 추가적인 요청이 발생하는 상황을 의미합니다.

- 한 번의 쿼리로 $N$개의 엔티티를 가져왔을 때, 각 엔티티의 연관 관계를 로딩하기 위해 $N$번의 쿼리가 추가로 실행됩니다.
- 이는 DB 요청량을 급증시켜 성능 저하의 주된 원인이 됩니다.

---

## 2. 발생 원인

### 2.1. 지연 로딩 (Lazy Fetch)
- 엔티티 조회 시 연관된 데이터를 즉시 가져오지 않고, 실제 해당 데이터에 접근할 때 쿼리를 발행합니다.
- 대량의 엔티티를 처리하며 각 엔티티의 연관 객체에 접근할 경우 $N+1$ 문제가 발생합니다.

### 2.2. 즉시 로딩 (Eager Fetch)
- 단일 엔티티 조회 시에는 한 번의 쿼리로 조인이 수행되어 최적화될 수 있습니다.
- 하지만 모든 엔티티를 조회(findAll)하는 경우, JPA는 기본 쿼리 실행 후 즉시 로딩 설정된 모든 연관 관계를 채우기 위해 개별적으로 추가 쿼리를 실행하므로 $N+1$ 문제가 즉시 발생합니다.

---

## 3. 해결 방법

### 3.1. 페치 조인 (Fetch Join)
- JPQL에서 `JOIN FETCH` 또는 `LEFT JOIN FETCH`를 사용하여 연관된 엔티티를 하나의 SQL 쿼리로 함께 조회합니다.
- Hibernate 6부터는 페치 조인으로 인한 결과 중복이 메모리에서 자동으로 제거됩니다.

### 3.2. @EntityGraph
- JPA 2.1에서 도입된 기능으로, 쿼리 실행 시 연관된 속성을 함께 로딩하도록 설정하는 페치 계획(Fetch Plan)입니다.
- `@NamedEntityGraph`로 정의하거나 Spring Data JPA의 `@EntityGraph` 어노테이션을 통해 선언적으로 사용할 수 있습니다.

### 3.3. 배치 사이즈 설정 (@BatchSize)
- Hibernate가 제공하는 어노테이션으로, 초기화되지 않은 프록시를 페칭할 때 지정된 크기만큼 `IN` 절을 사용하여 한 번의 라운드 트립으로 로드합니다.
- `JOIN FETCH`가 어려운 상황에서 쿼리 횟수를 획기적으로 줄여주는 대안입니다.

### 3.4. 데이터 타입 변경
- `List` 대신 `Set`을 사용하면 Hibernate는 카테시안 곱(Cartesian Product)으로부터 발생하는 중복을 제거할 수 있어 단일 쿼리로 최적화될 가능성이 높습니다.
- 다만, 조인 결과가 매우 커질 수 있음에 유의해야 합니다.

### 3.5. DTO 프로젝션
- 필요한 데이터만 선택하여 DTO로 직접 조회하는 방식입니다. 이는 단일 쿼리로 필요한 모든 데이터를 가져오는 효율적인 대안입니다.

---

## 4. 실무 고려 사항
- 액세스 패턴을 조사하여 대부분의 경우 연관 정보가 필요하다면 페치 조인을 고려해야 합니다.
- 단순한 어노테이션 설정만으로는 예상치 못한 쿼리 폭발이 발생할 수 있으므로 실행되는 SQL을 반드시 확인해야 합니다.
- 테스트 시 쿼리 실행 횟수를 검증(assert)하는 로직을 추가하여 $N+1$ 문제를 사전에 탐지할 수 있습니다.

---

## Sources
- [N+1 Problem in Hibernate and Spring Data JPA (Baeldung)](https://www.baeldung.com/spring-hibernate-n1-problem)
- [Hibernate ORM User Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)
- [JPA Query Methods (Spring Data JPA Reference)](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
- [Spring Data JPA vs JDBC: The Performance Showdown Every Spring Boot Developer Needs to See 🚀 (Medium)](https://medium.com/@narasimha4789/spring-jpa-vs-jdbc-the-performance-showdown-every-spring-boot-developer-needs-to-see-529da52742b5)

---

## Related pages
- [[jpa-delete]]
- [[repository-projection]]
- [[multi-datasource]]
