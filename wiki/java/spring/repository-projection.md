---
title: JPA 리포지터리 프로젝션
updated: 2026-07-08 10:32:15
tags:
  - java
  - spring
  - spring-data-jpa
  - jpa
  - projection
  - dto
  - query
---

## 1. 개요

Spring Data JPA의 query method는 보통 aggregate root 엔티티를 반환하지만, 필요에 따라 **엔티티가 아닌 다른 타입**을 반환할 수도 있다. 방식은 크게 세 가지다.

- Interface-based projection
- Class-based projection (DTO, `record`)
- Dynamic projection

projection 타입은 엔티티 타입 계층 밖에 있어야 한다. 엔티티가 구현한 인터페이스나 상위 타입을 반환하면 projection이 아니라 **fully materialized entity**가 반환된다.

---

## 2. Interface-based projection

읽고 싶은 속성만 getter로 노출하는 인터페이스를 반환 타입으로 사용한다.

```java
interface NamesOnly {
    String getFirstname();
    String getLastname();
}

interface PersonRepository extends Repository<Person, UUID> {
    Collection<NamesOnly> findByLastname(String lastname);
}
```

- 런타임에 projection 인터페이스의 **proxy**가 생성됨
- getter 이름이 엔티티 속성과 정확히 매칭되어야 함
- 중첩 projection 가능

```java
interface PersonSummary {
    String getFirstname();
    String getLastname();
    AddressSummary getAddress();

    interface AddressSummary {
        String getCity();
    }
}
```

### 2.1. Closed projection / Open projection

모든 accessor가 대상 엔티티 속성과 직접 매칭되면 **closed projection**이다. Spring Data가 필요한 속성을 알고 있어 query 최적화 여지가 있다.

`@Value`를 써서 계산 값을 노출하면 **open projection**이다. SpEL이 어떤 속성이든 참조할 수 있어 query 최적화가 어렵다.

```java
interface NamesOnly {
    @Value("#{target.firstname + ' ' + target.lastname}")
    String getFullName();
}
```

### 2.2. Nullable wrapper

인터페이스 getter는 `Optional` 같은 nullable wrapper를 반환할 수 있다.

```java
interface NamesOnly {
    Optional<String> getFirstname();
}
```

---

## 3. Class-based projection

엔티티 대신 DTO 클래스나 `record`를 반환한다.

- 프록시 기반이 아님
- 중첩 projection 불가
- 조회 필드는 projection 타입의 **생성자 파라미터**로 결정됨
- 생성자가 여러 개면 `@PersistenceCreator`로 대상 생성자 지정 필요

```java
record NamesOnly(String firstname, String lastname) {}
```

---

## 4. Derived query에서 반환

반환 타입을 projection 타입으로 지정하면 된다.

```java
interface PersonRepository extends Repository<Person, UUID> {
    Collection<NamesOnly> findByLastname(String lastname);
}
```

- interface projection → proxy 기반
- class-based projection → JPA 생성자 인스턴스화
- projection은 top-level property 선택에 맞춰짐. 중첩 속성으로 join이 생기면 그 중첩 속성은 전체 materialized될 수 있음

---

## 5. JPQL `@Query`에서 반환

### 5.1. class-based projection

JPQL에서 DTO를 반환하려면 `select new ...(...)`가 필요하다.

```java
@Query("""
    select new com.example.NamesOnly(u.firstname, u.lastname)
    from User u
    where u.lastname = :lastname
""")
List<NamesOnly> findNames(String lastname);
```

- DTO 타입의 **FQCN** 사용
- 생성자 인자 순서·타입이 DTO 생성자와 일치해야 함

---

## 6. Dynamic projection

projection 타입을 호출 시점에 결정한다.

```java
interface PersonRepository extends Repository<Person, UUID> {
    <T> Collection<T> findByLastname(String lastname, Class<T> type);
}

// 사용
people.findByLastname("Matthews", NamesOnly.class);
people.findByLastname("Matthews", Person.class);
```

`Class<T>` 파라미터는 dynamic projection 파라미터로 인식된다. 쿼리 인자로 `Class` 자체를 써야 하면 `Class<?>`처럼 다른 제네릭 형태를 사용한다.

---

## 7. Native query에서 반환

### 7.1. interface-based projection

native query에서도 interface projection을 사용할 수 있다. 컬럼 alias가 getter 이름과 맞아야 한다.

```java
public interface PlayerName {
    String getFirstName();
    String getLastName();
}

@Query(value = "SELECT p.first_name as firstName, p.last_name as lastName FROM chess_player p WHERE id = :id",
       nativeQuery = true)
PlayerName findPlayerNameById(Long id);
```

- snake_case 컬럼이면 camelCase alias를 명시하는 것이 안전함
- alias 불일치 시 해당 getter가 `null` 반환

### 7.2. class-based projection

Spring Data JPA는 **native query 결과를 class-based DTO로 자동 매핑하지 않는다.** `@NamedNativeQuery` + `@SqlResultSetMapping`으로 명시적 연결이 필요하다.

```java
@NamedNativeQuery(
    name = "ChessPlayer.findPlayerNameDtoById_Named",
    query = "SELECT p.first_name as first, p.last_name as last FROM chess_player p WHERE id = :id",
    resultSetMapping = "Mapping.PlayerNameDto"
)
@SqlResultSetMapping(
    name = "Mapping.PlayerNameDto",
    classes = @ConstructorResult(
        targetClass = PlayerNameDto.class,
        columns = {
            @ColumnResult(name = "first"),
            @ColumnResult(name = "last")
        }
    )
)
@Entity
public class ChessPlayer { ... }
```

---

## 8. 반환 타입

Spring Data JPA query method가 지원하는 주요 반환 타입이다.

| 반환 타입 | 설명 |
|---|---|
| `T` | 단건. 결과 없으면 `null`, 2개 이상이면 `IncorrectResultSizeDataAccessException` |
| `Optional<T>` | 단건. 결과 없으면 `Optional.empty()` |
| `List<T>` / `Collection<T>` | 복수 결과 |
| `Stream<T>` | Java 8 Stream. 사용 후 `close()` 필요 (try-with-resources 권장) |
| `Streamable<T>` | `Iterable` 확장. stream/map/filter/concatenation 지원 |
| `Slice<T>` | 페이징. 다음 페이지 존재 여부 포함. `total count` 쿼리 없음 |
| `Page<T>` | 페이징. total count 포함 (추가 count 쿼리 발생) |

---

## 9. 리포지토리 트랜잭션 설정

`SimpleJpaRepository`에서 상속된 메서드는 트랜잭션 설정을 그대로 상속한다.

- 읽기 메서드: `@Transactional(readOnly = true)`
- `save()`, `delete()` 등 쓰기 메서드: `@Transactional`

`@Query`로 직접 선언한 커스텀 쿼리 메서드는 기본적으로 **트랜잭션 설정이 없다**. 명시가 필요하면 `@Transactional`을 추가한다.

```java
@Transactional(readOnly = true)
interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByLastname(String lastname);  // readOnly 상속

    @Modifying
    @Transactional   // readOnly 오버라이드
    @Query("delete from User u where u.active = false")
    void deleteInactiveUsers();
}
```

단일 메서드의 트랜잭션 속성을 변경하려면 리포지토리에서 해당 메서드를 재선언한다.

```java
public interface UserRepository extends CrudRepository<User, Long> {

    @Override
    @Transactional(timeout = 10)
    List<User> findAll();
}
```

여러 리포지토리 호출을 하나의 트랜잭션으로 묶을 때는 facade 서비스로 경계를 정의한다.

```java
@Service
public class UserManagementImpl implements UserManagement {

    @Transactional
    public void addRoleToAllUsers(String roleName) {
        Role role = roleRepository.findByName(roleName);
        for (User user : userRepository.findAll()) {
            user.addRole(role);
            userRepository.save(user);
        }
    }
}
```

> 트랜잭션 경계는 단위 작업을 시작하는 서비스 레이어에서 정의하는 것이 일반적으로 권장된다.

---

## 10. 선택 기준

| 상황 | 권장 방식 |
|---|---|
| 엔티티 일부 필드만 간단히 조회 | interface projection |
| 중첩 projection이 필요 | interface projection |
| 값 객체/DTO/record로 명시적 반환 타입 | class-based projection |
| JPQL `@Query`에서 DTO 반환 | constructor expression (`select new`) |
| native query에서 인터페이스로 받고 싶음 | interface projection + alias 정렬 |
| native query에서 DTO 클래스로 받고 싶음 | `@NamedNativeQuery` + `@SqlResultSetMapping` |
| 런타임에 projection 타입을 바꿔야 함 | dynamic projection |

---

## 11. 체크리스트

- projection 타입이 엔티티 타입 계층 밖에 있는가
- interface projection이면 getter 이름이 엔티티 속성과 맞는가
- DTO/record 생성자 파라미터가 조회 필드와 맞는가
- 생성자가 여러 개라면 `@PersistenceCreator`를 붙였는가
- JPQL에서 DTO를 반환하면 `select new FQCN(...)`을 썼는가
- native query에서 interface projection이면 alias를 getter 이름과 맞췄는가
- native query에서 class projection이면 `@NamedNativeQuery` + `@SqlResultSetMapping`을 썼는가
- `@Query` 커스텀 메서드에 트랜잭션 설정이 필요하면 `@Transactional`을 명시했는가

---

## Sources
- [Projections :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html)
- [Spring Data JPA - How to Return DTOs from Native Queries (Thorben Janssen)](https://thorben-janssen.com/spring-data-jpa-dto-native-queries/)
- [Transactionality :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/jpa.html)
- [Repository query return types :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/query-return-types-reference.html)

---

## Related pages
- [[jpa-transaction]]
- [[jpa-n-plus-one]]
- [[jpa-composite-key]]
- [[jpa-delete]]
