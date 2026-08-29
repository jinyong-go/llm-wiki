---
title: JPA 복합키 — @EmbeddedId / @IdClass
updated: 2026-07-08 10:32:15
tags:
  - java
  - jpa
  - spring
  - hibernate
  - pk
  - composite-key
  - entity
---

## 1. 개요

복합키(Composite Primary Key)는 두 개 이상의 컬럼 조합으로 PK를 구성하는 방식.
JPA는 두 가지 매핑 방법을 제공한다: `@EmbeddedId`와 `@IdClass`.

---

## 2. 복합키 클래스 필수 조건

JPA 명세가 요구하는 조건이다.

| 조건 | 내용 |
|------|------|
| 접근 제어자 | `public` 클래스 |
| 생성자 | no-arg 기본 생성자 필요 |
| `equals()` / `hashCode()` | PK 컬럼 값 기반으로 구현 필수 |
| `Serializable` | 구현 필수 |

복합키 구성 요소 타입: 기본 타입, 래퍼 타입, `String`, `UUID`, `Date`, `BigDecimal`, `BigInteger`.
컬렉션(`@OneToMany` 등)은 PK 구성 요소로 사용 불가.

---

## 3. @EmbeddedId

키 클래스에 `@Embeddable`을 붙이고, 엔티티에서 단일 필드에 `@EmbeddedId`로 선언.

```java
@Embeddable
public class BookId implements Serializable {
    private String title;
    private String language;

    public BookId() {}

    public BookId(String title, String language) {
        this.title = title;
        this.language = language;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BookId bookId = (BookId) o;
        return Objects.equals(title, bookId.title) &&
               Objects.equals(language, bookId.language);
    }

    @Override
    public int hashCode() {
        return Objects.hash(title, language);
    }
}

@Entity
public class Book {
    @EmbeddedId
    private BookId bookId;

    // 기타 필드, getter/setter
}
```

**조회:**

```java
// EntityManager
Book book = em.find(Book.class, new BookId("Clean Code", "EN"));

// Spring Data JPA
interface BookRepository extends JpaRepository<Book, BookId> {}
bookRepository.findById(new BookId("Clean Code", "EN"));
```

**JPQL:**

```jpql
SELECT b.bookId.title FROM Book b WHERE b.bookId.language = 'EN'
```

키 필드 접근 시 `b.bookId.title`처럼 한 단계 탐색이 추가된다.

---

## 4. @IdClass

키 클래스는 별도 어노테이션 없이 작성하고, 엔티티에 `@IdClass`를 선언한 뒤 각 PK 필드에 `@Id`를 붙인다.

```java
public class AccountId implements Serializable {
    private String accountNumber;
    private String accountType;

    public AccountId() {}

    public AccountId(String accountNumber, String accountType) {
        this.accountNumber = accountNumber;
        this.accountType = accountType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AccountId that = (AccountId) o;
        return Objects.equals(accountNumber, that.accountNumber) &&
               Objects.equals(accountType, that.accountType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accountNumber, accountType);
    }
}

@Entity
@IdClass(AccountId.class)
public class Account {
    @Id
    private String accountNumber;

    @Id
    private String accountType;

    // 기타 필드, getter/setter
}
```

**조회:**

```java
// EntityManager
Account account = em.find(Account.class, new AccountId("ACC-001", "SAVINGS"));

// Spring Data JPA
interface AccountRepository extends JpaRepository<Account, AccountId> {}
accountRepository.findById(new AccountId("ACC-001", "SAVINGS"));
```

**JPQL:**

```jpql
SELECT a.accountNumber FROM Account a WHERE a.accountType = 'SAVINGS'
```

키 필드에 직접 접근한다(`a.accountNumber`). `@EmbeddedId`보다 JPQL이 단순하다.

---

## 5. @EmbeddedId vs @IdClass 비교

| 항목 | `@EmbeddedId` | `@IdClass` |
|------|--------------|------------|
| 키 클래스 어노테이션 | `@Embeddable` 필요 | 없음 |
| 엔티티 필드 선언 | `@EmbeddedId` 단일 필드 | 각 PK 필드에 `@Id` 중복 선언 |
| 필드 중복 | 없음 | 있음 (키 클래스 + 엔티티) |
| JPQL 접근 | `b.bookId.title` (추가 탐색) | `a.accountNumber` (직접) |
| 키 전체를 객체로 다룰 때 | 적합 | 덜 적합 |
| 키 클래스 수정 불가 시 | 불가 (`@Embeddable` 필요) | 가능 |

> Hibernate는 JPA 명세 외에 "primary key class" 없이 `@Id`만 여러 개 선언하는 방식도 허용하지만, 이식성이 없어 권장하지 않는다.

---

## 6. Spring Data JPA 레포지토리 선언

```java
// @EmbeddedId
interface BookRepository extends JpaRepository<Book, BookId> {}

// @IdClass
interface AccountRepository extends JpaRepository<Account, AccountId> {}
```

메서드 파생 쿼리(Derived Query)도 일반 엔티티와 동일하게 동작한다.

```java
// @IdClass 엔티티의 개별 PK 필드로 쿼리 가능
List<Account> findByAccountType(String accountType);

// @EmbeddedId 엔티티
List<Book> findByBookIdLanguage(String language);
```

---

## 7. @MapsId — 파생 식별자 (Derived Identifier)

`@OneToOne` 또는 `@ManyToOne` 관계에서 부모 엔티티의 PK를 자신의 PK로 그대로 사용하는 패턴.

```java
@Entity
public class Person {
    @Id
    private Long id;

    private String registrationNumber;
}

@Entity
public class PersonDetails {
    @Id
    private Long id;  // Person.id와 동일한 값

    private String nickName;

    @OneToOne
    @MapsId          // id 필드를 person.id로 채움
    private Person person;
}
```

**저장:**

```java
Person person = new Person();
person.setId(1L);
em.persist(person);

PersonDetails details = new PersonDetails();
details.setNickName("John");
details.setPerson(person);   // @MapsId가 id = person.id 로 자동 설정
em.persist(details);
```

`@MapsId`는 `@EmbeddedId`에도 사용할 수 있으며, 조인 컬럼을 별도로 두지 않아 스키마가 단순해진다.

> `@PrimaryKeyJoinColumn` 방식도 동일한 목적으로 사용 가능하지만, 개발자가 직접 두 필드를 동기화해야 하므로 `@MapsId` 권장.

---

## Sources
- [Composite Primary Keys in JPA (Baeldung)](https://www.baeldung.com/jpa-composite-primary-keys)
- [Hibernate ORM User Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)

---

## Related pages
- [[jpa-delete]]
- [[jpa-n-plus-one]]
- [[repository-projection]]
- [[multi-datasource]]
