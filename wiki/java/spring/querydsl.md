---
title: QueryDSL — 타입 안전 쿼리, 동적 조건, 빌드 설정
updated: 2026-07-08 10:32:15
tags:
  - java
  - spring
  - jpa
  - querydsl
  - spring-data-jpa
  - gradle
  - maven
---

## 1. 개요

QueryDSL은 Java에서 **타입 안전(type-safe)** 한 SQL 유사 쿼리를 빌드하는 DSL 프레임워크다. 엔티티로부터 생성된 `Q`-type을 통해 문자열이 아닌 코드로 쿼리를 조립한다.

| 방식 | 타입 안전 | 동적 조건 | 가독성 |
|------|-----------|-----------|--------|
| Spring Data 파생 쿼리(`findByXxx`) | ✓ | ✗ (조합 폭발) | 높음(단순) |
| JPQL / HQL | ✗ (문자열) | △ (문자열 연결) | 중간 |
| JPA Criteria API | ✓ | ✓ | 낮음 (장황) |
| **QueryDSL** | ✓ | ✓ (깔끔) | 높음 (fluent) |

---

## 2. 기본 JPA 대비 장점

### 2.1. 타입 안전
필드명·타입 오류가 **컴파일 타임**에 잡힌다. JPQL 문자열 오타는 런타임에야 발견된다. IDE 자동완성과 리팩터링(필드명 변경) 추적도 지원된다.

### 2.2. 동적 조건 처리
Spring Data 파생 쿼리는 선택적 필터 조합마다 메서드가 필요해 폭발하고, JPQL은 문자열 연결로 오류가 잦다. QueryDSL은 **`where()`가 `null` 인자를 무시**하는 성질을 이용해 동적 조건을 깔끔히 처리한다.

```java
// BooleanExpression 분리 방식 (재사용·조합 용이, 권장)
public List<User> search(String login, Boolean disabled) {
    return queryFactory.selectFrom(user)
        .where(loginEq(login), disabledEq(disabled))   // null 조건은 자동 제외
        .fetch();
}
private BooleanExpression loginEq(String login) {
    return login != null ? user.login.eq(login) : null;
}
private BooleanExpression disabledEq(Boolean disabled) {
    return disabled != null ? user.disabled.eq(disabled) : null;
}
```

```java
// BooleanBuilder 방식 (명령형 누적)
BooleanBuilder builder = new BooleanBuilder();
if (login != null)    builder.and(user.login.eq(login));
if (disabled != null) builder.and(user.disabled.eq(disabled));
queryFactory.selectFrom(user).where(builder).fetch();
```

> 분리한 `BooleanExpression`은 `.and()`/`.or()`로 조합·재사용할 수 있어 BooleanBuilder보다 의도가 드러난다.

### 2.3. 복잡 쿼리·가독성
조인·서브쿼리·집계를 fluent API로 표현해 Criteria API보다 간결하다 (6장 예시).

---

## 3. Q-type 과 컨벤션

`@Entity`를 APT(Annotation Processing Tool) 또는 KSP로 처리하면 `Q` 접두사 클래스가 자동 생성된다.

```java
public static final QUser user = new QUser("user");  // 정적 인스턴스
```

- 엔티티 필드마다 대응하는 `*Path`(`StringPath`, `NumberPath`, `SetPath` 등) 생성.
- **자동 생성물이므로 직접 수정 금지** — 엔티티 변경 시 재빌드.
- **컨벤션**: `QUser.user` 정적 인스턴스를 `static import`해 쿼리를 간결하게 쓴다. 별칭이 충돌하는 self-join 등에서만 `new QUser("u2")`로 별도 인스턴스를 만든다.

---

## 4. 빌드 설정

`Q`-type 생성을 위해 빌드 도구에 애너테이션 처리(APT/KSP)를 설정해야 한다.

### 4.1. 공식 QueryDSL vs OpenFeign QueryDSL

| 항목 | 공식 `com.querydsl` | OpenFeign `io.github.openfeign.querydsl` |
|------|------|------|
| 최종 릴리스 | 5.1.0 (유지보수 중단) | 7.0+ (활성 유지보수) |
| 취약점 | CVE 존재 | 6.11에서 CVE-2024-49203 수정 |
| KSP 지원 | ✗ | 6.9+ (6.11 안정화) |
| API 호환성 | — | 공식과 거의 동일 |

신규 프로젝트는 **OpenFeign QueryDSL 사용을 권장**한다.

### 4.2. Gradle

**공식 QueryDSL 5.x (Spring Boot 3.x, Java)**

```groovy
dependencies {
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor "com.querydsl:querydsl-apt:5.0.0:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}
```

Q-type 생성 경로: `build/generated/`. IDE에서 해당 경로를 소스 폴더로 등록해야 한다 (`File > Project Structure > Sources`).

**OpenFeign QueryDSL (Java, annotationProcessor)**

```groovy
def queryDslVersion = "7.0"
def querydslSrcDir = layout.buildDirectory.dir("generated/querydsl").get().asFile

tasks.withType(JavaCompile).configureEach {
    options.getGeneratedSourceOutputDirectory().set(file(querydslSrcDir))
}
sourceSets {
    main { java { srcDirs += querydslSrcDir } }
}
dependencies {
    implementation("io.github.openfeign.querydsl:querydsl-core:${queryDslVersion}")
    implementation("io.github.openfeign.querydsl:querydsl-jpa:${queryDslVersion}")
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:${queryDslVersion}:jpa")
}
```

**OpenFeign QueryDSL (Kotlin, KSP 기반)**

kapt는 유지보수 모드로 전환되어 KSP가 권장된다. KSP 지원은 OpenFeign QueryDSL 6.9+부터 가능하다.

```groovy
plugins {
    id("com.google.devtools.ksp") version "1.9.23-1.0.20"
}
dependencies {
    implementation("io.github.openfeign.querydsl:querydsl-jpa:6.11")
    ksp("io.github.openfeign.querydsl:querydsl-ksp-codegen:6.11")
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:6.11:jakarta")
}
```

Q-type 생성 경로: `build/generated/ksp/main/kotlin/`

```bash
./gradlew kspKotlin        # KSP만 실행
./gradlew clean build      # 전체 빌드
```

> **KSP `@JdbcTypeCode` 오류**: `@JdbcTypeCode(SqlTypes.JSON)`은 `TypeExtractor`가 처리하지 못해 오류가 난다(6.11 이하). `@Type(JsonBinaryType::class)`로 우회하며, **6.12에서 수정**되었다.

### 4.3. Maven — 공식 QueryDSL 5.x

```xml
<properties>
    <querydsl.version>5.0.0</querydsl.version>
</properties>

<dependencies>
    <!-- APT: Q-type 생성용 (빌드 타임만 필요) -->
    <dependency>
        <groupId>com.querydsl</groupId>
        <artifactId>querydsl-apt</artifactId>
        <version>${querydsl.version}</version>
        <classifier>jakarta</classifier>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>com.querydsl</groupId>
        <artifactId>querydsl-jpa</artifactId>
        <classifier>jakarta</classifier>
        <version>${querydsl.version}</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>com.mysema.maven</groupId>
            <artifactId>apt-maven-plugin</artifactId>
            <version>1.1.3</version>
            <executions>
                <execution>
                    <goals><goal>process</goal></goals>
                    <configuration>
                        <outputDirectory>target/generated-sources/java</outputDirectory>
                        <processor>com.querydsl.apt.jpa.JPAAnnotationProcessor</processor>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

Q-type 생성: `mvn compile`

### 4.4. 5.x → OpenFeign 마이그레이션 (Kotlin/KSP)

```groovy
// Before (kapt 기반)
plugins { kotlin("kapt") }
dependencies {
    implementation("com.querydsl:querydsl-jpa:5.1.0")
    kapt("com.querydsl:querydsl-apt:5.1.0:jpa")
}

// After (KSP 기반)
plugins { id("com.google.devtools.ksp") version "1.9.23-1.0.20" }
dependencies {
    implementation("io.github.openfeign.querydsl:querydsl-jpa:6.11")
    ksp("io.github.openfeign.querydsl:querydsl-ksp-codegen:6.11")
}
```

기존 kapt로 생성된 Q-type 파일을 삭제한 뒤 `./gradlew clean build`로 재생성한다.

---

## 5. 자바 코드 내 설정

`JPAQueryFactory`는 쿼리 빌드의 진입점이며, `EntityManager`를 주입받아 빈으로 등록한다.

```java
@Configuration
@RequiredArgsConstructor
public class QueryDSLConfig {
    private final EntityManager entityManager;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }
}
```

---

## 6. 쿼리 API

### 6.1. 기본 조회 및 필터링

```java
QUser user = QUser.user;

// 단건 조회 — 결과 없으면 null, 복수 결과 시 NonUniqueResultException
User result = queryFactory.selectFrom(user)
    .where(user.login.eq("Kent"))
    .fetchOne();

// 목록 조회
List<User> list = queryFactory.selectFrom(user)
    .where(user.login.eq("Kent").and(user.disabled.eq(false)))
    .fetch();

// OR 조건
.where(user.login.eq("Kent").or(user.disabled.eq(true)))
```

### 6.2. 정렬 및 집계

```java
// 정렬
List<User> sorted = queryFactory.selectFrom(user)
    .orderBy(user.login.asc())
    .fetch();

// 집계 (count, sum, avg, max, min)
int maxAge = queryFactory.select(person.age.max())
    .from(person)
    .fetchOne();

// GroupBy + 별칭 지정
NumberPath<Long> count = Expressions.numberPath(Long.class, "c");
List<Tuple> result = queryFactory
    .select(blogPost.title, blogPost.id.count().as(count))
    .from(blogPost)
    .groupBy(blogPost.title)
    .orderBy(count.desc())
    .fetch();
```

### 6.3. 조인 및 서브쿼리

```java
// Inner Join
List<User> users = queryFactory.selectFrom(user)
    .innerJoin(user.blogPosts, blogPost)
    .on(blogPost.title.eq("Hello World!"))
    .fetch();

// 서브쿼리 (JPAExpressions)
List<User> users = queryFactory.selectFrom(user)
    .where(user.id.in(
        JPAExpressions.select(blogPost.user.id)
            .from(blogPost)
            .where(blogPost.title.eq("Hello World!"))))
    .fetch();
```

### 6.4. DML

```java
// Update
queryFactory.update(user)
    .where(user.login.eq("Ash"))
    .set(user.login, "Ash2")
    .set(user.disabled, true)
    .execute();

// Delete
queryFactory.delete(user)
    .where(user.login.eq("David"))
    .execute();
```

> `JPAQueryFactory`는 `insert()`를 지원하지 않는다. JPA `Query.executeUpdate()`가 INSERT를 지원하지 않기 때문이다. 삽입은 `EntityManager.persist()` 또는 `SQLQueryFactory`(querydsl-sql)를 사용한다.

---

## 7. Projection

엔티티 전체가 아니라 필요한 컬럼만 DTO로 조회할 때 사용한다. QueryDSL은 여러 방식을 제공한다.

### 7.1. Tuple
여러 컬럼을 `select`하면 `Tuple`로 반환된다. 별도 DTO 없이 간단하지만 `tuple.get(path)` 접근이라 타입 안전성·가독성이 낮아 서비스 계층 노출은 권장되지 않는다.

```java
List<Tuple> result = queryFactory
    .select(user.login, user.age)
    .from(user)
    .fetch();
String login = result.get(0).get(user.login);
```

### 7.2. `Projections.bean` — Setter 기반
DTO의 **기본 생성자 + setter**로 채운다. 프로퍼티 이름과 path 이름이 일치해야 하며, 다르면 `.as("프로퍼티명")`으로 별칭을 맞춘다.

```java
List<UserDto> dtos = queryFactory
    .select(Projections.bean(UserDto.class,
        user.login.as("name"),   // path명 != DTO 프로퍼티명 → 별칭
        user.age))
    .from(user)
    .fetch();
```

### 7.3. `Projections.fields` — 필드 기반
setter 없이 **리플렉션으로 필드에 직접** 주입한다. 필드명과 path명(또는 별칭)이 일치해야 한다.

```java
Projections.fields(UserDto.class, user.login.as("name"), user.age)
```

### 7.4. `Projections.constructor` — 생성자 기반
인자 **타입·순서가 일치하는 생성자**를 호출한다. 이름이 아닌 순서로 매핑되므로 `.as()`가 불필요하다. DTO가 QueryDSL에 의존하지 않는 장점이 있으나, 컴파일 타임에 인자 불일치를 잡지 못한다(런타임 오류).

```java
Projections.constructor(UserDto.class, user.login, user.age)
```

### 7.5. `@QueryProjection` — 생성자 + Q-type 생성
DTO 생성자에 `@QueryProjection`을 붙이면 APT/KSP가 `QUserDto`를 생성한다. `new QUserDto(...)`로 사용하며 **컴파일 타임 타입 안전성**이 가장 높다. 단, DTO가 QueryDSL(`querydsl-core`)에 의존하게 된다.

```java
public class UserDto {
    private final String name;
    private final int age;

    @QueryProjection
    public UserDto(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

```java
List<UserDto> dtos = queryFactory
    .select(new QUserDto(user.login, user.age))
    .from(user)
    .fetch();
```

### 7.6. 방식 비교

| 방식 | 매핑 기준 | DTO 요건 | 타입 안전 | QueryDSL 의존 |
|------|-----------|----------|-----------|---------------|
| `Tuple` | path 키 | 없음 | 낮음 | - |
| `Projections.bean` | 이름(별칭) | 기본 생성자 + setter | 런타임 | 없음 |
| `Projections.fields` | 이름(별칭) | 필드 | 런타임 | 없음 |
| `Projections.constructor` | 순서·타입 | 일치 생성자 | 런타임 | 없음 |
| `@QueryProjection` | 순서·타입 | 생성자 + 어노테이션 | **컴파일 타임** | 있음 |

> 이름 불일치 시 `Projections.bean`/`fields`는 `.as("alias")`로 맞춘다. 서브쿼리 결과에는 `ExpressionUtils.as(JPAExpressions...., "alias")`를 사용한다.

---

## 8. 컨벤션: Custom Repository 패턴

Spring Data JPA의 사용자 정의 Repository 기능으로 QueryDSL 쿼리를 통합하는 표준 패턴이다.

```
UserRepository
  ├── JpaRepository<User, Long>      (Spring Data 기본 메서드)
  └── UserQueryRepository            (커스텀 QueryDSL 인터페이스)
        └── UserQueryRepositoryImpl  (구현체, 접미사 Impl 필수)
```

**1. 커스텀 인터페이스 정의**

```java
public interface UserQueryRepository {
    Optional<UserProfile> findUserProfileById(Long userId);
}
```

**2. 구현체 작성** (클래스명은 반드시 `Impl` 접미사 — Spring Data 규칙)

```java
@RequiredArgsConstructor
public class UserQueryRepositoryImpl implements UserQueryRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<UserProfile> findUserProfileById(Long userId) {
        // QueryDSL 쿼리 작성
    }
}
```

**3. 기존 Repository에 통합**

```java
public interface UserRepository extends JpaRepository<User, Long>, UserQueryRepository {
}
```

- 동적 조건 메서드(`BooleanExpression` 헬퍼)는 Impl에 모아 재사용한다.

---

## Sources
- [Intro to Querydsl | Baeldung](https://www.baeldung.com/intro-to-querydsl)
- [A Guide to Querydsl with JPA | Baeldung](https://www.baeldung.com/querydsl-with-jpa-tutorial)
- [[Gradle] SpringBoot 3.x + QueryDSL 적용하기 | velog](https://velog.io/@kimsundae/Gradle-SpringBoot-3.x-QueryDSL-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0)
- [OpenFeign QueryDSL 기본 설정 및 사용법](https://rebugs.tistory.com/900)
- [OpenFeign QueryDSL 6.11 + KSP | velog](https://velog.io/@csh0034/OpenFeign-QueryDSL-KSP)

---

## Related pages
- [[jpa-n-plus-one]]
- [[repository-projection]]
- [[jpa-transaction]]
- [[multi-datasource]]
- [[batch-db-reader-writer]]
