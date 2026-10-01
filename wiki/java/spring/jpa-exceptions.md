---
title: JPA 예외
updated: 2026-10-01 16:45:35
tags:
  - java
  - jpa
  - spring
  - hibernate
  - exception
---

## 1. 개요

Spring Data JPA 리포지터리 메서드에서 발생한 예외는 리포지터리 프록시의 `PersistenceExceptionTranslationInterceptor`가 Spring `DataAccessException` 계층으로 변환한다. Hibernate 예외는 `HibernateJpaDialect`(내부 `HibernateExceptionTranslator`)가 먼저 처리하고 나머지 JPA 표준 예외는 `EntityManagerFactoryUtils.convertJpaAccessExceptionIfPossible()`이 처리한다. 변환된 예외는 모두 unchecked이므로 [[jpa-transaction]]의 기본 롤백 대상이다.

```
SQLException (JDBC 드라이버)
 → org.hibernate.exception.* (Dialect별 SQLException 분류)
 → org.springframework.dao.* (HibernateJpaDialect)
```

---

## 2. 발생 시점

SQL이 실제로 실행되는 시점에 예외가 발생한다.

| 상황 | 발생 위치 |
|---|---|
| `save()` + `IDENTITY` 전략 | `save()` 호출 시 (INSERT 즉시 실행) |
| `save()` + `SEQUENCE`·직접 할당 ID | flush 시점 |
| 더티 체킹 UPDATE, `delete()` | flush 시점 |
| 조회 메서드, `@Query` | 메서드 호출 시 |

flush는 `flush()`, `saveAndFlush()`, JPQL 실행 전 auto flush, 트랜잭션 커밋 시에 일어난다. 커밋 시점에 실패하면 `JpaTransactionManager.doCommit()`이 같은 규칙으로 예외를 변환한다. 이 예외는 리포지터리 호출 지점이 아니라 `@Transactional` 메서드가 끝날 때 던져지므로 서비스 메서드 안의 try-catch로는 잡을 수 없다. 즉시 감지가 필요하면 `saveAndFlush()`를 사용한다.

---

## 3. 유형별 매핑

### 3.1. 무결성 제약 위반

| 원인 | Hibernate/JPA 예외 | Spring 예외 |
|---|---|---|
| PK·UNIQUE·FK·NOT NULL·CHECK 위반 | `ConstraintViolationException` | `DataIntegrityViolationException` |
| 컬럼 길이·숫자 범위 초과 | `DataException` | `DataIntegrityViolationException` |
| Hibernate nullability 사전 검사 실패 | `PropertyValueException` | `DataIntegrityViolationException` |
| `persist()` 대상 엔티티가 이미 존재 | `EntityExistsException` | `DataIntegrityViolationException` |
| 한 세션에 같은 ID를 가진 다른 인스턴스 | `NonUniqueObjectException` | `DuplicateKeyException` |

PK 위반과 UNIQUE 위반은 같은 예외 타입으로 변환된다. `HibernateJpaDialect`에 `SQLExceptionTranslator`를 지정하지 않으면 DB 중복키 오류도 `DuplicateKeyException`이 아닌 `DataIntegrityViolationException`이 된다[^1]. 제약 위반을 구분하려면 원인 예외의 제약 조건명을 확인한다.

```java
try {
    memberRepository.saveAndFlush(member);
} catch (DataIntegrityViolationException e) {
    if (e.getCause() instanceof org.hibernate.exception.ConstraintViolationException cve
            && "uk_member_email".equalsIgnoreCase(cve.getConstraintName())) {
        throw new DuplicateEmailException(member.getEmail());
    }
    throw e;
}
```

### 3.2. save()와 PK 중복

`SimpleJpaRepository.save()`는 `isNew()`가 참일 때만 `persist()`를 호출하고 그 외에는 `merge()`를 호출한다. 기본 `isNew()` 판단 기준은 ID가 `null`인지(원시 타입이면 `0`인지)이고, `@Version`이 있으면 version이 `null`인지로 판단한다.

| ID 설정 | 동작 | 결과 |
|---|---|---|
| 직접 할당 ID, 행 존재 | SELECT 후 UPDATE | 예외 없이 기존 행 덮어씀 |
| 직접 할당 ID, 행 없음 | SELECT 후 INSERT | 정상 저장 |
| `@GeneratedValue` ID를 수동 설정, 행 없음 | Hibernate 6.6+에서 `StaleObjectStateException` | `ObjectOptimisticLockingFailureException` |

직접 할당 ID를 쓰면 PK 중복이 예외가 아니라 덮어쓰기로 처리된다. 중복을 예외로 감지하려면 `Persistable<ID>`를 구현해 `isNew()`를 직접 정의한다.

```java
@Entity
public class Product implements Persistable<String> {
    @Id private String code;
    @Transient private boolean isNew = true;

    @Override public String getId() { return code; }
    @Override public boolean isNew() { return isNew; }

    @PostLoad @PostPersist
    void markNotNew() { this.isNew = false; }
}
```

### 3.3. 동시성·락

| 원인 | Hibernate/JPA 예외 | Spring 예외 |
|---|---|---|
| `@Version` 충돌 (영향 행 0) | `StaleObjectStateException`, `OptimisticLockException` | `ObjectOptimisticLockingFailureException`, `JpaOptimisticLockingFailureException` |
| 락 획득 실패·락 타임아웃 | `LockAcquisitionException`, `LockTimeoutException` | `CannotAcquireLockException` |
| 비관적 락 실패 | `PessimisticLockException` | `PessimisticLockingFailureException` |
| 쿼리 타임아웃 | `QueryTimeoutException` | `org.springframework.dao.QueryTimeoutException` |

낙관적 락 예외 두 개는 모두 `OptimisticLockingFailureException`의 하위 타입이므로 상위 타입으로 잡는다. 데드락은 Dialect가 해당 오류 코드(MySQL 1213, PostgreSQL `40P01` 등)를 `LockAcquisitionException`으로 분류할 때 `CannotAcquireLockException`이 된다[^2]. 관련 개념은 [[deadlock-livelock]], [[concurrency-control]] 참고.

### 3.4. 조회 결과

| 상황 | 결과 |
|---|---|
| `findById()` 결과 없음 | `Optional.empty()` |
| 단건 반환 쿼리 메서드 결과 없음 | `null` 또는 `Optional.empty()` |
| 단건 반환 쿼리 메서드 결과 2건 이상 | `IncorrectResultSizeDataAccessException` |
| `deleteById()` 대상 없음 | 무시 (`findById().ifPresent(this::delete)`)[^3] |
| `getReferenceById()` 프록시 초기화 시 행 없음 | `jakarta.persistence.EntityNotFoundException` |

`getReferenceById()`는 프록시만 반환한다. 이후 리포지터리 호출 밖에서 프록시가 초기화되면 예외 변환을 거치지 않으므로 JPA 예외가 그대로 전파된다.

### 3.5. API 오용

모두 `InvalidDataAccessApiUsageException`으로 변환된다.

| 원인 | 원본 예외 |
|---|---|
| `findById(null)`, `save(null)` 등 null 인자 | `IllegalArgumentException` (`Assert.notNull`) |
| 트랜잭션 없이 `@Modifying` 쿼리 실행 | `TransactionRequiredException` |
| DML `@Query`에 `@Modifying` 누락 | `IllegalStateException` ([[jpa-delete]]) |
| 저장되지 않은 transient 엔티티를 참조한 채 flush | `TransientObjectException` |
| detached 엔티티를 persist (cascade 포함) | `PersistentObjectException` |
| 삭제된 엔티티 재저장 | `ObjectDeletedException` |

### 3.6. SQL·리소스

| 원인 | Hibernate/JPA 예외 | Spring 예외 |
|---|---|---|
| SQL 문법 오류, 없는 테이블·컬럼 | `SQLGrammarException` | `InvalidDataAccessResourceUsageException` |
| JPQL 해석 오류 (런타임 생성 쿼리) | `QueryException` | `InvalidDataAccessResourceUsageException` |
| DB 연결 끊김 | `JDBCConnectionException` | `DataAccessResourceFailureException` |
| 트랜잭션 시작 시 커넥션 획득 실패 | Hikari `SQLTransientConnectionException` | `CannotCreateTransactionException` |
| 커밋 실패, 원인 변환 불가 | `RollbackException` | `TransactionSystemException` |
| 그 외 미분류 | `PersistenceException` | `JpaSystemException` |

`@Query`와 파생 쿼리 메서드는 애플리케이션 시작 시 검증되므로 오류가 있으면 실행 시점이 아니라 컨텍스트 로딩 단계에서 실패한다. 커넥션 획득 실패는 [[hikari-datasource]] 참고.

Bean Validation 위반(`jakarta.validation.ConstraintViolationException`)은 영속성 예외가 아니므로 변환되지 않는다. `persist()` 시점에 발생하면 원본 예외가 그대로 전파되고, 커밋 시점에 발생하면 `TransactionSystemException`에 감싸진다. 이름이 같은 `org.hibernate.exception.ConstraintViolationException`(DB 제약 위반)과는 다른 예외다.

---

## 4. 계층

```
DataAccessException
├ NonTransientDataAccessException
│  ├ DataIntegrityViolationException
│  │  └ DuplicateKeyException
│  ├ InvalidDataAccessApiUsageException
│  ├ InvalidDataAccessResourceUsageException
│  ├ DataRetrievalFailureException
│  │  ├ IncorrectResultSizeDataAccessException
│  │  │  └ EmptyResultDataAccessException
│  │  └ ObjectRetrievalFailureException
│  └ NonTransientDataAccessResourceException
│     └ DataAccessResourceFailureException
├ TransientDataAccessException
│  ├ ConcurrencyFailureException
│  │  ├ OptimisticLockingFailureException
│  │  └ PessimisticLockingFailureException
│  │     └ CannotAcquireLockException
│  └ QueryTimeoutException
└ UncategorizedDataAccessException
   └ JpaSystemException
```

`TransientDataAccessException` 하위 예외는 같은 작업을 다시 시도하면 성공할 수 있는 예외이고, `NonTransientDataAccessException` 하위 예외는 원인을 고치지 않으면 다시 시도해도 실패한다.

---

## 5. 처리 기준

1. 재시도는 `TransientDataAccessException` 하위 예외에만 적용한다. 예외가 발생한 트랜잭션은 rollback-only로 마킹되므로([[jpa-transaction]] 8장) 재시도는 트랜잭션 경계 밖에서 새 트랜잭션으로 수행한다.
2. Hibernate 예외가 발생한 뒤에는 Session 상태를 신뢰할 수 없다. 해당 트랜잭션은 롤백하고 영속성 컨텍스트는 폐기한다.
3. `existsBy...()` 선조회로 중복을 검사해도 동시 요청 사이에 경합이 생기면 제약 위반이 발생한다. 최종 방어선은 DB 제약 조건과 `DataIntegrityViolationException` 처리다.

---

## Sources
- [EntityManagerFactoryUtils.java (Spring Framework)](https://github.com/spring-projects/spring-framework/blob/main/spring-orm/src/main/java/org/springframework/orm/jpa/EntityManagerFactoryUtils.java)
- [HibernateExceptionTranslator.java (Spring Framework)](https://github.com/spring-projects/spring-framework/blob/main/spring-orm/src/main/java/org/springframework/orm/jpa/hibernate/HibernateExceptionTranslator.java)
- [JpaTransactionManager.java (Spring Framework)](https://github.com/spring-projects/spring-framework/blob/main/spring-orm/src/main/java/org/springframework/orm/jpa/JpaTransactionManager.java)
- [SimpleJpaRepository.java (Spring Data JPA)](https://github.com/spring-projects/spring-data-jpa/blob/main/spring-data-jpa/src/main/java/org/springframework/data/jpa/repository/support/SimpleJpaRepository.java)
- [DAO Support: Exception Hierarchy (Spring Framework Reference)](https://docs.spring.io/spring-framework/reference/data-access/dao.html)
- [Hibernate 6.6 Migration Guide](https://docs.hibernate.org/orm/6.6/migration-guide/)
- [OptimisticLockException when manually setting the ID (Hibernate Discourse)](https://discourse.hibernate.org/t/optimisticlockexception-when-manually-setting-the-id-for-the-entity/10975)
- [Hibernate User Guide: Exception handling](https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#exception-handling)

---

## Related pages
- [[jpa-transaction]]
- [[jpa-delete]]
- [[jpa-entity-lifecycle]]
- [[hikari-datasource]]
- [[concurrency-control]]

[^1]: `HibernateExceptionTranslator`의 `jdbcExceptionTranslator`는 기본값이 `null`이고 `setJdbcExceptionTranslator()`로만 설정된다는 소스 코드에 근거한 판단이다. Spring Boot 자동 설정이 이 값을 지정하지 않는다는 점은 Boot 소스로 직접 확인하지 않았다.
[^2]: 오류 코드를 분류하는 방식은 Hibernate Dialect마다 다르다. 이 오류 코드들은 일반적으로 알려진 매핑을 적은 것이며 Dialect 소스로 확인하지 않았다.
[^3]: 현재 구현 기준이다. Spring Data JPA 2.x에서는 `EmptyResultDataAccessException`이 발생했다. 동작이 바뀐 정확한 버전은 원문으로 확인하지 않았다.
