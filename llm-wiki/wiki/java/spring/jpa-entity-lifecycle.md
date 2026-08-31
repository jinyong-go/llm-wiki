---
title: JPA 엔티티 라이프사이클 콜백 & EntityListener
updated: 2026-08-31 14:25:48
tags:
  - java
  - jpa
  - spring
  - hibernate
  - entity
  - lifecycle
  - auditing
---

## 1. 개요

JPA는 엔티티 상태 변화(INSERT / UPDATE / DELETE / LOAD) 시점에 메서드를 자동 호출하는 **라이프사이클 콜백** 메커니즘을 제공한다. 적용 방식은 두 가지: 엔티티 클래스 내부 메서드에 직접 선언, 또는 별도 `EntityListener` 클래스에 위임.

---

## 2. 라이프사이클 콜백

### 2.1. 콜백 어노테이션

| 어노테이션 | 호출 시점 |
|-----------|---------|
| `@PrePersist` | `persist()` 호출 직전 (INSERT 전) |
| `@PostPersist` | INSERT 완료 후 |
| `@PreUpdate` | UPDATE SQL 발생 직전 |
| `@PostUpdate` | UPDATE 완료 후 |
| `@PreRemove` | `remove()` 호출 직전 (DELETE 전) |
| `@PostRemove` | DELETE 완료 후 |
| `@PostLoad` | 엔티티가 영속성 컨텍스트에 로드된 직후 |

### 2.2. Post 계열 호출 시점

`@PrePersist` / `@PreRemove`는 `persist()`·`merge()`·`remove()` 연산의 일부로 항상 동기 호출된다. 반면 Post 계열(`@PostPersist`, `@PostUpdate`, `@PostRemove`)은 **해당 DML이 DB에서 실행된 직후** 호출된다. JPA의 쓰기 지연(write-behind)으로 DML 실행 시점 자체가 상황에 따라 달라지므로, 콜백 호출 시점도 3가지로 나뉜다.

| DML 실행 시점 | 발생 조건 |
|---|---|
| ① 연산 호출 직후 | `persist()` 등 호출 즉시 DML 실행. e.g. Hibernate의 IDENTITY 전략은 PK 확보를 위해 `persist()` 시점에 즉시 INSERT |
| ② flush 시점 | 지연된 DML이 `em.flush()` 호출 또는 JPQL/Criteria 쿼리 실행 전 auto-flush에서 실행 |
| ③ 트랜잭션 커밋 시점 | 그때까지 flush가 없었다면 커밋 직전 암묵적 flush에서 DML 실행 |

②③은 ①에서 DML이 지연된 결과일 뿐, "DML 직후 호출" 규칙은 세 경우 모두 동일하다.

주의사항:

- ③이어도 커밋 **완료 후가 아니라 커밋 과정의 flush 중**이다. 콜백은 트랜잭션 안에서 실행되므로 호출 후에도 롤백될 수 있고, persist/remove 콜백에서 예외를 던지면 트랜잭션이 롤백된다. 커밋 확정 후에만 실행할 로직(알림 발송 등)은 `@TransactionalEventListener(phase = AFTER_COMMIT)`를 사용한다.
- `persist` 후 같은 트랜잭션에서 수정하거나, 수정 후 같은 트랜잭션에서 삭제하는 경우 `@PreUpdate` / `@PostUpdate` 호출 여부는 구현체 의존이다. 이식성 있는 코드는 특정 호출 시점에 의존하면 안 된다.

### 2.3. 콜백 메서드 규칙

- 반환 타입: `void`
- 파라미터: 엔티티 내부 메서드는 인수 없음; `EntityListener` 클래스는 엔티티 타입을 파라미터로 받음
- 접근 제어자: 무관 (`static` 불가)
- **JPA 명세 제한**: 라이프사이클 메서드 안에서 `EntityManager` / `Query` 조작, 다른 엔티티 접근, 같은 영속성 컨텍스트 내 관계 수정 불가. **엔티티 자신의 비관계형(non-relationship) 상태만 수정 가능.**

### 2.4. 엔티티 내부 콜백

```java
@Entity
public class User {

    @Id @GeneratedValue
    private Long id;

    private String firstName;
    private String lastName;

    @Transient
    private String fullName;

    @PrePersist
    public void onPrePersist() {
        // INSERT 전 처리
    }

    @PostPersist
    public void onPostPersist() {
        // @GeneratedValue PK는 여기서부터 접근 가능
    }

    @PreUpdate
    public void onPreUpdate() {
        // 실제 변경이 없으면 호출되지 않음
    }

    @PostUpdate
    public void onPostUpdate() {
        // 변경 여부와 무관하게 항상 호출
    }

    @PostLoad
    public void onPostLoad() {
        fullName = firstName + " " + lastName;
    }
}
```

하나의 메서드에 여러 어노테이션을 조합할 수 있다.

```java
@PrePersist
@PreUpdate
private void beforeWrite() {
    name = name.toUpperCase();
}
```

---

## 3. EntityListener

동일 로직을 여러 엔티티에 적용할 때 `EntityListener`로 분리한다. 엔티티에 `@EntityListeners`로 등록.

```java
public class AuditTrailListener {

    @PrePersist
    @PreUpdate
    @PreRemove
    private void beforeAnyOperation(Object entity) {
        // entity 파라미터로 대상 엔티티 수신
    }

    @PostPersist
    @PostUpdate
    @PostRemove
    private void afterAnyOperation(Object entity) { ... }

    @PostLoad
    private void afterLoad(Object entity) { ... }
}
```

```java
@Entity
@EntityListeners(AuditTrailListener.class)
public class User { ... }

// 여러 리스너 동시 등록
@EntityListeners({ AuditTrailListener.class, SecurityListener.class })
public class Order { ... }
```

EntityListener 인스턴스는 JPA 프로바이더가 생성하므로 Spring DI가 그대로 동작하지 않을 수 있다. 상세와 대안은 [[entity-listener-di]] 참조.

---

## 4. Spring Data JPA Auditing

`AuditingEntityListener` + `@EnableJpaAuditing` 조합으로 생성일시·수정일시·작성자를 자동 추적한다.

### 4.1. 의존성·설정

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
}
```

```java
@Configuration
@EnableJpaAuditing
public class PersistenceConfig { ... }
```

### 4.2. 엔티티

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Article {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime modifiedDate;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String modifiedBy;
}
```

공통 필드는 `@MappedSuperclass`로 추출해 재사용하는 것이 일반적이다.

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime modifiedDate;
}
```

### 4.3. 작성자 추적 — AuditorAware

`@CreatedBy` / `@LastModifiedBy`는 `AuditorAware<T>` 구현체에서 현재 사용자를 가져온다.

```java
@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        return Optional.ofNullable(
            SecurityContextHolder.getContext()
                .getAuthentication()
                .getName()
        );
    }
}
```

```java
// 빈 이름 명시 시
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
```

---

## 5. Hibernate Envers — 엔티티 이력 관리

JPA 콜백 방식과 달리 **별도 이력 테이블**에 변경 내역을 자동 저장한다.

### 5.1. 의존성·설정

```groovy
dependencies {
    implementation 'org.hibernate.orm:hibernate-envers'
}
```

**의존성 추가만으로 활성화된다.** Envers는 Hibernate integrator 메커니즘(Java ServiceLoader)으로 자신을 자동 등록하고 Hibernate 이벤트 리스너에 연결되므로, Spring Data Auditing의 `@EnableJpaAuditing` 같은 활성화 어노테이션이나 설정 클래스가 필요 없다. 어떤 엔티티를 감사할지는 `@Audited`로만 지정한다.

설정 변경이 필요할 때만 `org.hibernate.envers.*` 프로퍼티를 사용한다 (Spring Boot에서는 `spring.jpa.properties.` 접두사).

| 프로퍼티 (`org.hibernate.envers.`) | 기본값 | 설명 |
|---|---|---|
| `audit_table_suffix` | `_AUD` | 감사 테이블 이름 접미사 |
| `audit_table_prefix` | (없음) | 감사 테이블 이름 접두사 |
| `revision_field_name` | `REV` | 리비전 번호 컬럼명 |
| `revision_type_field_name` | `REVTYPE` | 변경 유형 컬럼명 |
| `store_data_at_delete` | `false` | DELETE 리비전에 삭제 시점 데이터 저장 여부 |
| `default_schema` | (원본과 동일) | 감사 테이블 스키마 |
| `audit_strategy` | `DefaultAuditStrategy` | `ValidityAuditStrategy` 지정 시 `REVEND` 컬럼으로 유효 구간 기록 (조회 성능 향상, 쓰기 비용 증가) |

> 테이블 자동 생성은 Hibernate 스키마 생성(`ddl-auto`)에 의존한다. Flyway/Liquibase 등 마이그레이션 도구로 스키마를 관리한다면 아래 5.3의 테이블 DDL을 직접 작성해야 한다.

### 5.2. 엔티티

```java
@Entity
@Audited          // 엔티티 전체 감사
public class Bar { ... }

@Entity
@Audited
public class Foo { ... }  // 연관 엔티티도 @Audited 필요
```

연관 대상이 감사 대상이 아니면 시작 시점에 매핑 에러가 발생한다. 특정 연관/필드만 제외하려면 `@NotAudited` 사용.

### 5.3. 생성 테이블

감사 대상 엔티티마다 **`{원본 테이블명}_AUD`** 테이블 1개 + 전역 공유 **`REVINFO`** 테이블 1개가 생성된다.

**`{table}_AUD`** — 엔티티 변경 스냅샷 저장:

| 컬럼 | 설명 |
|---|---|
| 원본 PK 컬럼 | 원본 엔티티의 식별자. `REV`와 함께 복합 PK 구성 |
| `REV` | 리비전 번호. `REVINFO.REV` 참조 (FK) |
| `REVTYPE` | 변경 유형: `0`=ADD(insert), `1`=MOD(update), `2`=DEL(delete) |
| 원본 나머지 컬럼 | 해당 리비전 시점의 값. DEL 리비전에서는 기본적으로 `null` (`store_data_at_delete=true` 시 삭제 직전 값 저장) |
| `REVEND` | `ValidityAuditStrategy` 사용 시에만 추가. 해당 행이 유효했던 마지막 리비전 |

**`REVINFO`** — 리비전 메타데이터 저장 (트랜잭션당 1행):

| 컬럼 | 설명 |
|---|---|
| `REV` | 자동 증가 리비전 번호 |
| `REVTSTMP` | 리비전 생성 시각 (epoch millis, `bigint`) |

리비전에 수정자 등 컬럼을 추가하려면 `@RevisionEntity`로 커스텀 리비전 엔티티를 정의한다 (이때 `REVINFO` 대신 해당 엔티티의 테이블 사용).

### 5.4. 히스토리 조회

조회 진입점은 `AuditReader`이며 `AuditReaderFactory.get(entityManager)`로 얻는다.

```java
AuditReader reader = AuditReaderFactory.get(entityManager);
```

**`find(Class, id, revision)`** — 특정 리비전 시점의 엔티티 상태(스냅샷)를 반환. 해당 리비전에 엔티티가 존재하지 않았으면(생성 전/삭제 후) `null`.

```java
Bar barAtRev2 = reader.find(Bar.class, barId, 2);
```

**`getRevisions(Class, id)`** — 해당 엔티티가 변경된 모든 리비전 번호 목록을 반환. 각 리비전 번호로 `find()`를 반복하면 전체 변경 이력을 재구성할 수 있다.

```java
List<Number> revisions = reader.getRevisions(Bar.class, barId);
```

**`forRevisionsOfEntity(Class, selectEntitiesOnly, selectDeletedEntities)`** — 리비전 단위 이력 쿼리 생성. 두 boolean 파라미터의 의미:

- `selectEntitiesOnly`: `true`면 엔티티 인스턴스만 반환, `false`면 `Object[]{엔티티, 리비전 엔티티, RevisionType}` 3요소 배열 반환
- `selectDeletedEntities`: `true`면 DEL 리비전 포함 (삭제 이력 조회에 필수)

```java
// 변경 이력을 "누가/언제/어떤 유형"과 함께 조회
List<Object[]> results = reader.createQuery()
    .forRevisionsOfEntity(Bar.class, false, true)
    .add(AuditEntity.id().eq(barId))
    .addOrder(AuditEntity.revisionNumber().desc())
    .getResultList();

for (Object[] row : results) {
    Bar snapshot = (Bar) row[0];                                // 해당 리비전의 엔티티 상태
    DefaultRevisionEntity rev = (DefaultRevisionEntity) row[1]; // 리비전 번호·시각
    RevisionType type = (RevisionType) row[2];                  // ADD / MOD / DEL
}
```

`AuditEntity`의 정적 메서드(`id()`, `property()`, `revisionNumber()` 등)로 필터·정렬 조건을 추가한다.

---

## 6. 방식별 비교

| | 엔티티 내부 콜백 | 외부 EntityListener | Spring Data Auditing | Hibernate Envers |
|---|---|---|---|---|
| 재사용성 | 낮음 | 높음 | 높음 | 높음 |
| DELETE 감사 | 제한적 | 제한적 | 불가 | 가능 |
| 히스토리 조회 | 불가 | 불가 | 불가 | 가능 |
| 설정 복잡도 | 낮음 | 낮음 | 중간 | 중간 |
| Spring DI 사용 | 불가 | 가능 | 기본 제공 | — |

> JPA 콜백 / Spring Data Auditing은 `@PreRemove`에서 엔티티 자신의 상태를 수정해도, 삭제 시 해당 행이 함께 사라지므로 삭제 감사에 실용적이지 않다. 삭제 이력이 필요하면 Envers를 사용한다.

---

## Sources
- `raw/java/spring/JPA Entity Lifecycle Events.md` (Baeldung)
- [Jakarta Persistence 3.1 §3.5.3 — Semantics of the Life Cycle Callback Methods](https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1)
- [Spring Framework — Transaction-bound Events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)
- [Change Field Value Before Update and Insert in Hibernate (Baeldung)](https://www.baeldung.com/java-hibernate-change-field-value-before-update-insert)
- [Auditing with JPA, Hibernate, and Spring Data JPA (Baeldung)](https://www.baeldung.com/database-auditing-jpa)
- [Hibernate User Guide — Envers](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#envers)

---

## Related pages
- [[entity-listener-di]]
- [[jpa-composite-key]]
- [[jpa-n-plus-one]]
- [[jpa-delete]]
- [[repository-projection]]
