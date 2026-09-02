---
title: JPA 삭제 — Delete & Soft Delete
updated: 2026-07-08 10:32:15
tags:
  - java
  - jpa
  - spring
  - hibernate
  - delete
  - soft-delete
  - modifying
  - cascade
---

## 1. 개요

Spring Data JPA에서 엔티티를 삭제하는 방법은 크게 세 가지다: Repository 기본 메서드, 파생 쿼리(Derived Delete), `@Query` + `@Modifying` 벌크 DML. 각 방식은 **라이프사이클 콜백 호출 여부**와 **성능 특성**이 다르다.

---

## 2. Delete 방식 비교

| 방식 | 내부 동작 | @PreRemove 등 콜백 | 트랜잭션 |
|---|---|---|---|
| `deleteById(id)` / `deleteAll()` | SELECT → 건별 DELETE | 호출됨 | 자동 |
| `deleteByXxx()` (파생 쿼리) | SELECT → 건별 DELETE | 호출됨 | `@Transactional` 필요 |
| `@Query` + `@Modifying` | 단일 DML 쿼리 | **호출 안 됨** | `@Transactional` 필요 |

---

## 3. CrudRepository 기본 메서드

```java
// 단건 삭제
repository.deleteById(id);

// 전체 삭제
repository.deleteAll();
```

`JpaRepository`, `PagingAndSortingRepository`도 동일 메서드를 제공한다.

---

## 4. 파생 삭제 쿼리 (Derived Delete)

메서드 이름을 `deleteBy`로 시작하고 조건 필드명을 붙여 정의한다.

```java
@Repository
public interface BookRepository extends CrudRepository<Book, Long> {
    long deleteByTitle(String title);
}
```

- 반환 타입 `long`: 삭제된 레코드 수
- 내부적으로 SELECT 후 건별 DELETE → `@PreRemove` 등 라이프사이클 콜백 호출됨
- 실행 시 트랜잭션이 없으면 예외 → **`@Transactional` 필수**

```java
@Transactional
public void removeByTitle(String title) {
    bookRepository.deleteByTitle(title);
}
```

---

## 5. @Modifying — 벌크 DML

`@Query`로 작성한 DML(INSERT / UPDATE / DELETE / DDL)에는 `@Modifying`이 필수다. 없으면 `InvalidDataAccessApiUsageException` 발생.

```java
@Modifying
@Query("delete from Book b where b.title = :title")
void deleteByTitle(@Param("title") String title);

@Modifying
@Query("delete User u where u.active = false")
int deleteDeactivatedUsers();  // 반환값: 영향받은 행 수
```

파생 쿼리와 달리 **단일 JPQL 쿼리**만 실행 → `@PreRemove` 등 라이프사이클 콜백이 호출되지 않는다.

### 5.1. 영속성 컨텍스트 동기화 문제

벌크 DML은 영속성 컨텍스트(1차 캐시)를 우회해 DB에 직접 실행된다. 따라서 같은 트랜잭션 내에 이미 로드된 엔티티가 있으면 캐시와 DB가 불일치하는 상황이 생긴다.

```java
// 문제 상황: 벌크 삭제 후 1차 캐시에 남아 있는 엔티티가 조회됨
teamRepository.save(new Team("팀A"));       // 영속성 컨텍스트에 캐시됨
teamRepository.deleteByName("팀A");         // DB 삭제, 캐시는 그대로
teamRepository.findById(id).isPresent();    // true — 캐시에서 반환!
```

`@Modifying` 옵션으로 해결한다.

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `clearAutomatically` | `false` | 쿼리 실행 **후** 영속성 컨텍스트 clear |
| `flushAutomatically` | `false` | 쿼리 실행 **전** flush (미저장 변경이 있을 때 유용) |

```java
@Modifying(clearAutomatically = true)
@Query("delete from Book b where b.title = :title")
void deleteByTitle(@Param("title") String title);
```

---

## 6. 연관관계와 Cascade

### 6.1. CascadeType.ALL + orphanRemoval

```java
@Entity
public class Category {

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Book> books;
}
```

- `cascade = CascadeType.ALL`: 부모 삭제 시 자식도 함께 삭제
- `orphanRemoval = true`: 컬렉션에서 제거된 자식 엔티티를 자동 DELETE

**단방향**: 부모 삭제 → 자식 삭제. 반대(자식 삭제 → 부모 유지)는 성립하지 않는다.

---

## 7. Soft Delete

물리 삭제 대신 `deleted` 플래그를 `true`로 표시하는 패턴. 감사(audit), 복구 가능성, 참조 무결성이 요구될 때 사용한다.

### 7.1. @SQLDelete + @SQLRestriction

```java
@Entity
@Table(name = "table_product")
@SQLDelete(sql = "UPDATE table_product SET deleted = true WHERE id=?")
@SQLRestriction("deleted = false")   // Hibernate 6+ 권장
// @Where(clause = "deleted=false")  // Hibernate 5 이하
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean deleted = false;
}
```

- `@SQLDelete`: `deleteById()` 등 Hibernate 삭제 시 지정한 native SQL UPDATE로 대체
- `@SQLRestriction` / `@Where`: 모든 SELECT 쿼리에 조건을 자동 추가. **비활성화 불가**, 파라미터화 불가

### 7.2. 연관관계 함정

| 연관 타입 | 동작 |
|---|---|
| `@OneToMany` / `@ManyToMany` | 소프트 삭제된 엔티티 정상 필터링 (Lazy/Eager 무관) |
| Lazy `@ManyToOne` / `@OneToOne` | 접근 시 `EntityNotFoundException` 발생 |
| Eager `@ManyToOne` / `@OneToOne` (단건) | 소프트 삭제 엔티티 정상 로드 (예외 없음) |
| Eager `@ManyToOne` / `@OneToOne` (`findAll`) | `EntityNotFoundException` 발생 |

Lazy ToOne에서 프록시를 초기화하면 `@Where`/`@SQLRestriction`이 적용되어 엔티티를 찾지 못하고 예외가 던져진다. Eager인 경우 JOIN으로 한 번에 가져오므로 `@Where`가 개입할 수 없어 로드되지만, `findAll` 시에는 별도 쿼리로 전환되어 다시 예외가 발생한다.

`@NotFound(action = NotFoundAction.IGNORE)`를 추가하면 예외 대신 `null`이 세팅되지만, **해당 연관을 Lazy에서 Eager로 강제 전환**하므로 성능에 영향을 준다.

### 7.3. 유니크 제약 주의

소프트 삭제된 행이 테이블에 남아 있으므로 일반 UNIQUE 제약과 충돌할 수 있다. 삭제된 행이 같은 값의 신규 등록을 막는다. PostgreSQL 등 부분 인덱스를 지원하는 DB에서는 다음과 같이 회피한다.

```sql
CREATE UNIQUE INDEX author_login_idx ON author (login) WHERE deleted = false;
```

---

## 8. 동적 필터 — @FilterDef + @Filter

`@SQLRestriction`은 항상 적용되어 비활성화할 수 없다. 관리자 화면처럼 삭제된 데이터도 조회해야 하는 경우 동적 필터를 사용한다.

```java
@Entity
@Table(name = "tbl_products")
@SQLDelete(sql = "UPDATE tbl_products SET deleted = true WHERE id=?")
@FilterDef(name = "deletedFilter", parameters = @ParamDef(name = "isDeleted", type = "boolean"))
@Filter(name = "deletedFilter", condition = "deleted = :isDeleted")
public class Product {
    private boolean deleted = false;
}
```

```java
@Service
public class ProductService {

    @Autowired private ProductRepository productRepository;
    @Autowired private EntityManager entityManager;

    public Iterable<Product> findAll(boolean isDeleted) {
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("deletedFilter");
        filter.setParameter("isDeleted", isDeleted);
        Iterable<Product> result = productRepository.findAll();
        session.disableFilter("deletedFilter");
        return result;
    }
}
```

- `@FilterDef`: 필터 이름과 파라미터 타입 선언
- `@Filter`: 조건 SQL 정의 (파라미터 바인딩 가능)
- `session.enableFilter()` / `session.disableFilter()`: 요청 단위로 필터 활성화

---

## 9. 방식별 선택 기준

| 상황 | 권장 방식 |
|---|---|
| 단건 삭제, 라이프사이클 콜백 필요 | `deleteById()` |
| 조건부 단건·소량 삭제, 콜백 필요 | `deleteByXxx()` 파생 쿼리 |
| 대량 삭제, 성능 우선 | `@Modifying` + `@Query` (`clearAutomatically = true`) |
| 물리 삭제 불가, 복구·감사 필요 | `@SQLDelete` + `@SQLRestriction` |
| 삭제 데이터도 조건부 조회 필요 | `@FilterDef` + `@Filter` |

---

## Sources
- [Spring Data JPA Delete and Relationships (Baeldung)](https://www.baeldung.com/spring-data-jpa-delete)
- [Spring Data JPA @Modifying Annotation (Baeldung)](https://www.baeldung.com/spring-data-jpa-modifying-annotation)
- [Spring Data JPA 벌크성 쿼리 / @Modifying 어노테이션 (velog)](https://velog.io/@guns95/Spring-data-jpa%EB%B2%8C%ED%81%AC%EC%84%B1-%EC%BF%BC%EB%A6%AC-Modifying-%EC%96%B4%EB%85%B8%ED%85%8C%EC%9D%B4%EC%85%98)
- [How to Implement a Soft Delete with Spring JPA (Baeldung)](https://www.baeldung.com/spring-jpa-soft-delete)
- [Soft Deletion in Hibernate: Things You May Miss (JPA Buddy)](https://jpa-buddy.com/blog/soft-deletion-in-hibernate-things-you-may-miss/)
- [SQLRestriction (Hibernate Javadocs)](https://docs.jboss.org/hibernate/orm/current/javadocs/org/hibernate/annotations/SQLRestriction.html)

---

## Related pages
- [[jpa-entity-lifecycle]]
- [[jpa-n-plus-one]]
- [[jpa-composite-key]]
