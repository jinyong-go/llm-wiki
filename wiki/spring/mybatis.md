---
title: MyBatis — 설정·의존성, 매핑, 트랜잭션, 키 생성
updated: 2026-07-09 16:42:53
tags:
  - java
  - spring
  - mybatis
  - sql
  - persistence
  - spring-boot
  - transaction
---

## 1. 개요

MyBatis는 SQL을 직접 작성하고 Java 객체와 매핑하는 **SQL 매핑 프레임워크**다. JDBC 보일러플레이트를 제거하고 결과셋 매핑을 자동화하지만, SQL 생성은 개발자가 직접 담당한다.

---

## 2. 설정과 의존성

### 2.1. Spring 없이 단독 사용

**의존성 (Maven)**

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.x</version>
</dependency>
```

**`mybatis-config.xml`** — 단독 사용 시에는 `<environments>`/`<dataSource>`/`<transactionManager>`를 **직접 정의**한다 (Spring 통합 시에는 무시됨, 3장 참고).

```xml
<configuration>
  <environments default="dev">
    <environment id="dev">
      <transactionManager type="JDBC"/>          <!-- JDBC | MANAGED -->
      <dataSource type="POOLED">                 <!-- POOLED | UNPOOLED | JNDI -->
        <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url"    value="jdbc:mysql://localhost/test"/>
        <property name="username" value="root"/>
        <property name="password" value="pw"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper class="com.example.mapper.PersonMapper"/>
  </mappers>
</configuration>
```

**SqlSessionFactory / SqlSession** — 직접 생성하며 트랜잭션을 코드로 제어한다.

```java
String resource = "mybatis-config.xml";
SqlSessionFactory factory =
    new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream(resource));

// SqlSession은 thread-safe하지 않으므로 요청당 생성 후 닫는다.
try (SqlSession session = factory.openSession()) {   // autoCommit=false (기본)
    PersonMapper mapper = session.getMapper(PersonMapper.class);
    mapper.save(person);
    session.commit();                                // 명시적 커밋 필요
}
```

> `openSession()`의 기본 `autoCommit=false` → 변경은 `commit()` 전까지 반영되지 않으며 예외 시 `rollback()`. `openSession(true)`로 열면 문장마다 자동 커밋된다 (5장).

### 2.2. Spring Boot 자동 설정

권장 방식이다.

**의존성**

```xml
<!-- Maven -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>4.0.0</version>
</dependency>
```

```groovy
// Gradle
implementation("org.mybatis.spring.boot:mybatis-spring-boot-starter:4.0.0")
```

**자동 구성 동작** — starter가 다음을 자동 처리한다.
1. classpath `DataSource` 감지
2. `SqlSessionFactory` 등록 (`SqlSessionFactoryBean`)
3. `SqlSessionTemplate` 등록 (thread-safe, Spring 트랜잭션 연동)
4. `@Mapper` 인터페이스 스캔 후 빈 등록

```java
@Mapper
public interface CityMapper {
    @Select("SELECT * FROM city WHERE state = #{state}")
    City findByState(@Param("state") String state);
}
```

**`application.properties`**

```properties
mybatis.mapper-locations=classpath*:mapper/**/*.xml
mybatis.type-aliases-package=com.example.domain
mybatis.configuration.map-underscore-to-camel-case=true
mybatis.configuration.default-statement-timeout=30
mybatis.executor-type=REUSE
```

> `mybatis.configuration.*`과 `mybatis.config-location`은 **동시에 사용할 수 없다**. 우선순위로 한쪽이 적용되는 것이 아니라, 둘 다 지정하면 기동 시 `SqlSessionFactoryBean`이 예외(`Property 'configuration' and 'configLocation' can not specified with together`)를 던져 **애플리케이션 시작이 실패**한다. XML 설정 파일을 쓰려면 설정 전체를 `mybatis-config.xml`로 옮기고, 아니면 전부 `mybatis.configuration.*` 프로퍼티로 관리한다.

```java
// 자동 구성 커스터마이징
@Bean
ConfigurationCustomizer mybatisConfigurationCustomizer() {
    return config -> config.setDefaultExecutorType(ExecutorType.BATCH);
}
```

> **참고 — Spring(비 Boot) 수동 통합**: `mybatis-spring` 의존성을 추가하고 `SqlSessionFactoryBean`·`DataSourceTransactionManager`를 직접 빈 등록한 뒤 `@MapperScan("패키지")`로 Mapper를 등록한다. 이때 두 빈에 주입하는 `DataSource`는 동일 빈이어야 한다.

```java
@Configuration
@MapperScan("com.example.mapper")            // Mapper 인터페이스 스캔·빈 등록
public class MyBatisConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost/test");
        config.setUsername("root");
        config.setPassword("pw");
        return new HikariDataSource(config);
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        // XML 매퍼 위치·타입 별칭 등 Boot의 mybatis.* 프로퍼티에 해당하는 설정
        factoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/**/*.xml"));
        factoryBean.setTypeAliasesPackage("com.example.domain");
        return factoryBean.getObject();
    }

    @Bean
    public DataSourceTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);  // SqlSessionFactory와 동일 DataSource
    }

    // 선택 — 생략 시 MapperFactoryBean이 SqlSessionFactory로 자동 생성
    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
        // ExecutorType 변경 시: new SqlSessionTemplate(sqlSessionFactory, ExecutorType.BATCH)
    }
}
```

> **`SqlSessionTemplate` 빈은 필수가 아니다.** `@MapperScan`이 등록하는 `MapperFactoryBean`은 컨텍스트에 `SqlSessionTemplate` 빈이 없으면 `SqlSessionFactory`로 내부에서 자동 생성한다(둘 다 있으면 template 우선). 명시 등록이 필요한 경우:
> - **ExecutorType 변경** — `BATCH` 등은 생성자에서만 지정 가능
> - **멀티 DataSource** — `@MapperScan(sqlSessionTemplateRef = "...")`로 매퍼 그룹별 템플릿 지정 ([[multi-datasource]])
> - Mapper 인터페이스 대신 `SqlSessionTemplate`을 DAO에 직접 주입해 사용하는 경우

**버전 호환성**

| mybatis-spring-boot-starter | mybatis-spring | Spring Boot | Java |
|---|---|---|---|
| 4.0 | 4.0 | 4.0+ | 17+ |
| 3.0 | 3.0 | 3.2 – 3.5 | 17+ |
| 2.3 | 2.1 | 2.7 | 8+ |

---

## 3. 주요 설정 (Configuration)

Spring/Spring Boot 통합 환경에서는 `mybatis-config.xml`의 `<environments>`/`<dataSource>`/`<transactionManager>`가 무시된다 — `SqlSessionFactoryBean`이 자체 생성하기 때문이다.

### 3.1. settings

| 설정 | 설명 | 기본값 |
|------|------|--------|
| `mapUnderscoreToCamelCase` | 스네이크 케이스 컬럼 → 카멜 케이스 프로퍼티 자동 변환 | `false` |
| `lazyLoadingEnabled` | 전역 지연 로딩 | `false` |
| `cacheEnabled` | 2차 캐시 전역 활성화 | `true` |
| `defaultExecutorType` | `SIMPLE` / `REUSE` / `BATCH` | `SIMPLE` |
| `localCacheScope` | 로컬 캐시 범위 (`SESSION`/`STATEMENT`) | `SESSION` |
| `defaultStatementTimeout` | 기본 쿼리 타임아웃(초) | 미설정 |
| `useGeneratedKeys` | 전역 자동 생성 키 사용 | `false` |

### 3.2. typeAliases

```xml
<typeAliases>
  <package name="com.example.domain"/>   <!-- 패키지 내 전체 클래스 등록 -->
</typeAliases>
```

클래스에 `@Alias("name")`으로 개별 별칭 지정 가능.

### 3.3. mappers 등록

```xml
<mappers>
  <mapper resource="com/example/mapper/PersonMapper.xml"/>  <!-- 클래스패스 XML -->
  <mapper class="com.example.mapper.PersonMapper"/>         <!-- 인터페이스 클래스 -->
  <package name="com.example.mapper"/>                      <!-- 패키지 전체 -->
</mappers>
```

### 3.4. typeHandlers

PreparedStatement 파라미터 설정 및 ResultSet 값 추출 시 Java ↔ JDBC 타입 변환을 담당한다.
- 3.4.5+: `java.time.*` 기본 지원
- Enum: `EnumTypeHandler`(이름 저장) / `EnumOrdinalTypeHandler`(ordinal 저장)
- 커스텀: `BaseTypeHandler<T>` 상속 후 `@MappedJdbcTypes` 지정

### 3.5. plugins (Interceptor)

Executor / ParameterHandler / ResultSetHandler / StatementHandler의 메서드 호출을 가로챈다.

```java
@Intercepts({@Signature(type = Executor.class, method = "update",
    args = {MappedStatement.class, Object.class})})
public class MyPlugin implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        return invocation.proceed();
    }
}
```

---

## 4. SQL 작성과 매핑

SQL을 정의하고 결과를 객체로 받는 방법을 다룬다 — Mapper 작성, 결과 매핑, 자동 생성 키, 동적 SQL, 저장 프로시저.

### 4.1. Mapper 작성

#### 애너테이션 방식

```java
@Insert("INSERT INTO person(name) VALUES (#{name})")
Integer save(Person person);

@Select("SELECT personId, name FROM person WHERE personId = #{personId}")
Person getPersonById(Integer personId);

@Update("UPDATE person SET name = #{name} WHERE personId = #{personId}")
void updatePerson(Person person);

@Delete("DELETE FROM person WHERE personId = #{personId}")
void deletePersonById(Integer personId);
```

#### XML 방식

```xml
<mapper namespace="com.example.mapper.PersonMapper">
  <select id="getPersonById" parameterType="int" resultType="Person">
    SELECT person_id, name FROM person WHERE person_id = #{personId}
  </select>
</mapper>
```

| 애너테이션 | 설명 |
|-----------|------|
| `@Param("name")` | SQL `#{name}` 참조를 위한 파라미터 명명 (복수 파라미터 시 필수) |
| `@MapKey("field")` | 결과 목록을 특정 필드를 key로 하는 `Map`으로 변환 |
| `@Options(...)` | 자동 생성 키, 캐시 플러시, statementType 등 부가 설정 |

### 4.2. 결과값 객체 매핑

#### 컬럼명 자동 매핑
`mapUnderscoreToCamelCase=true`면 `first_name` 컬럼이 `firstName` 프로퍼티에 자동 매핑된다. 그 외에는 SELECT 별칭이나 명시적 매핑이 필요하다.

#### 명시적 매핑 (@Results / XML resultMap)

```java
@Select("SELECT person_id, name FROM person WHERE person_id = #{id}")
@Results(id = "personMap", value = {
    @Result(property = "personId", column = "person_id", id = true),
    @Result(property = "name",     column = "name")
})
Person getPersonById(Integer id);
```

```xml
<resultMap id="personMap" type="Person">
  <id     property="personId" column="person_id"/>
  <result property="name"     column="name"/>
  <!-- 생성자 매핑 -->
  <constructor>
    <idArg  column="person_id" javaType="int"/>
    <arg    column="name"      javaType="String"/>
  </constructor>
</resultMap>

<select id="getPersonById" resultMap="personMap">
  SELECT person_id, name FROM person WHERE person_id = #{id}
</select>
```

#### 연관 관계 매핑

```java
// 1:N — @Many (중첩 select)
@Select("SELECT person_id, name FROM person WHERE person_id = #{id}")
@Results({
    @Result(property = "personId", column = "person_id"),
    @Result(property = "addresses", column = "person_id",
            many = @Many(select = "getAddresses"))   // 1:1은 @One(one = ...)
})
Person getPersonWithAddresses(Integer id);
```

XML에서는 `<association>`(N:1·1:1), `<collection>`(1:N)으로 표현한다. 중첩 select 방식은 N+1이 발생할 수 있으므로 JOIN 결과를 단일 resultMap으로 매핑하는 방식과 트레이드오프를 고려한다.

### 4.3. Auto-Increment 키 반환

INSERT 후 DB가 생성한 PK를 파라미터 객체의 프로퍼티로 되돌려 받는다.

#### MySQL 등 AUTO_INCREMENT — `useGeneratedKeys`

JDBC 드라이버의 `getGeneratedKeys()`를 사용한다. 생성된 키는 `keyProperty`가 가리키는 파라미터 객체 필드에 채워진다.

```java
@Insert("INSERT INTO person(name) VALUES (#{name})")
@Options(useGeneratedKeys = true, keyProperty = "personId", keyColumn = "person_id")
void save(Person person);   // 호출 후 person.getPersonId()에 생성된 PK가 채워짐
```

```xml
<insert id="save" parameterType="Person"
        useGeneratedKeys="true" keyProperty="personId" keyColumn="person_id">
  INSERT INTO person(name) VALUES (#{name})
</insert>
```

전역 적용: `mybatis.configuration.use-generated-keys=true`.

#### 시퀀스/미지원 DB — `<selectKey>` / `@SelectKey`

`useGeneratedKeys`는 DB의 AUTO_INCREMENT 지원이 전제다. Oracle 시퀀스처럼 미지원이거나 커스텀 키 로직이 필요하면 `selectKey`를 사용한다.

```xml
<!-- Oracle 시퀀스: INSERT 전에 키 채번 → order="BEFORE" -->
<insert id="save" parameterType="Person">
  <selectKey keyProperty="personId" resultType="long" order="BEFORE">
    SELECT person_seq.NEXTVAL FROM dual
  </selectKey>
  INSERT INTO person(person_id, name) VALUES (#{personId}, #{name})
</insert>
```

```java
@Insert("INSERT INTO person(name) VALUES (#{name})")
@SelectKey(statement = "SELECT LAST_INSERT_ID()", keyProperty = "personId",
           resultType = long.class, before = false)   // MySQL: INSERT 후 조회
void save(Person person);
```

> **order/before 규칙**: MySQL·SQL Server 등 자동 증가는 INSERT **후** 채번이므로 `order="AFTER"`(`before=false`). Oracle 시퀀스는 INSERT **전** 채번이므로 `order="BEFORE"`(`before=true`).

### 4.4. Dynamic SQL

#### XML 태그

```xml
<select id="search" resultType="Person">
  SELECT * FROM person
  <where>
    <if test="name != null">    AND name LIKE #{name} || '%' </if>
    <if test="disabled != null">AND disabled = #{disabled}   </if>
  </where>
  <if test="ids != null">
    AND person_id IN
    <foreach item="id" collection="ids" open="(" separator="," close=")">#{id}</foreach>
  </if>
</select>
```

`<where>`는 선행 `AND`/`OR`를 자동 제거한다. 그 외 `<choose>/<when>/<otherwise>`, `<set>`, `<trim>` 등을 제공한다.

#### 애너테이션 방식 (Provider)

```java
@SelectProvider(type = PersonSqlProvider.class, method = "getPersonByName")
Person getPersonByName(String name);

public class PersonSqlProvider {
    public String getPersonByName(String name) {
        return new SQL() {{
            SELECT("*"); FROM("person");
            WHERE("name LIKE #{name} || '%'");
        }}.toString();
    }
}
```

`@InsertProvider`, `@UpdateProvider`, `@DeleteProvider`도 동일 방식.

### 4.5. Stored Procedure

저장 프로시저를 호출하려면 일반 statement가 아닌 **CALLABLE statement**로 실행해야 하므로 `@Options(statementType = StatementType.CALLABLE)`(XML은 `statementType="CALLABLE"`)를 지정한다. JDBC 이스케이프 문법 `{CALL 프로시저명(...)}`으로 호출한다.

각 파라미터에는 입출력 방향을 `mode`로 명시한다.

| mode | 의미 |
|------|------|
| `IN` | 입력 전용 (기본) |
| `OUT` | 출력 전용 — 프로시저가 값을 반환. `jdbcType` 지정 필수 |
| `INOUT` | 입력 후 출력으로 갱신 |

`OUT`/`INOUT` 파라미터는 `jdbcType`(필요 시 `javaType`)을 명시해야 하며, 호출 후 전달한 파라미터 객체의 해당 프로퍼티에 결과가 채워진다.

```java
// 입력 파라미터로 조회 결과(ResultSet)를 매핑하는 경우
@Select("{CALL getPersonByProc(#{personId, mode=IN, jdbcType=INTEGER})}")
@Options(statementType = StatementType.CALLABLE)
Person getPersonByProc(Integer personId);
```

```xml
<!-- OUT 파라미터로 값을 돌려받는 경우 -->
<select id="callTotal" statementType="CALLABLE">
  {CALL get_order_total(
    #{userId,   mode=IN,  jdbcType=INTEGER},
    #{total,    mode=OUT, jdbcType=DECIMAL})}
</select>
```

> 결과를 ResultSet으로 돌려주는 프로시저는 `resultType`/`resultMap`으로 매핑하고, OUT 파라미터로 돌려주는 경우는 `mode=OUT`으로 받는다. 한 프로시저가 둘을 동시에 사용할 수도 있다.

---

## 5. 트랜잭션 관리

### 5.1. 단독 사용 — autoCommit

- `factory.openSession()` → **`autoCommit=false`(기본)**. 변경은 `session.commit()` 전까지 반영되지 않고, 예외 시 `session.rollback()`. `try-with-resources`로 `close()` 보장.
- `factory.openSession(true)` → **autoCommit 모드**. 각 문장이 즉시 커밋되며 트랜잭션 묶음이 불가능하므로 쓰기 작업에는 권장하지 않는다.

### 5.2. Spring / Spring Boot — `@Transactional`

MyBatis-Spring은 Spring의 `DataSourceTransactionManager`를 통해 트랜잭션에 참여한다. `@Transactional` 및 AOP 방식 모두 지원되며, 커밋/롤백은 Spring이 관리한다 ([[jpa-transaction]]의 프록시·전파·롤백 규칙 그대로 적용).

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;

    @Transactional
    public void register(User user, Profile profile) {
        userMapper.insertUser(user);       // 같은 트랜잭션/커넥션에서 실행
        userMapper.insertProfile(profile); // 예외 시 둘 다 롤백
    }
}
```

주의사항:
- Spring이 관리하는 `SqlSession`(`SqlSessionTemplate`)에서 `commit()`/`rollback()`/`close()`를 **직접 호출하면 `UnsupportedOperationException`** — 트랜잭션 제어는 Spring에 위임한다.
- **Spring 트랜잭션 범위 밖**에서 Mapper를 호출하면 (`@Transactional` 없음) DataSource의 autoCommit 설정에 따라 문장 단위로 자동 커밋된다.
- 프로그래밍 방식이 필요하면 `TransactionTemplate` 사용.

```java
transactionTemplate.execute(txStatus -> {
    userMapper.insertUser(user);
    return null;
});
```

---

## 6. 비교와 장단점

| 항목 | JDBC | Hibernate/JPA | MyBatis |
|------|------|---------------|---------|
| SQL 제어 | 완전 직접 | ORM 생성 | 직접 작성 |
| 타입 안전성 | 없음 | 있음 | 부분적 (애너테이션 기반) |
| 매핑 방식 | 수동 | 자동 (엔티티) | XML/애너테이션 설정 |
| 복잡한 쿼리 | 용이 | 어려움 | 용이 |
| 동적 쿼리 | 문자열 조합 | JPQL/Criteria | XML 태그/`@SelectProvider` |
| Stored Procedure | 직접 | 제한적 | 지원 |

### 6.1. 장점
- DB 특화 SQL 최적화 가능 (힌트, 벤더 함수 등)
- 복잡한 다중 조인·집계 쿼리를 자유롭게 표현
- 경량 — ORM 레이어 오버헤드 없음
- 기존 SQL 지식을 그대로 활용
- 결과셋 → Java 객체 매핑이 유연 (다대일, 일대다 등)
- XML Mapper 방식에서 SQL이 코드와 분리되어 DBA와 협업 용이

### 6.2. 단점
- 단순 CRUD도 매퍼 코드/XML 작성 필요 (Spring Data JPA 대비 boilerplate 많음)
- DB 스키마 변경 시 SQL을 수동으로 관리
- 컴파일 타임 타입 검증 없음 (XML 매퍼, 문자열 SQL)
- ORM 1차 캐시·연관 관계 자동화(`@OneToMany` 등) 없음
- 페이징·정렬 등 공통 처리 패턴을 직접 구현해야 함

---

## Sources
- [Quick Guide to MyBatis | Baeldung](https://www.baeldung.com/mybatis)
- [MyBatis 3 | Configuration](https://mybatis.org/mybatis-3/configuration.html)
- [MyBatis 3 | Mapper XML / sqlmap (insert, selectKey)](https://mybatis.org/mybatis-3/sqlmap-xml.html)
- [MyBatis 3 | Java API (openSession / autoCommit)](https://mybatis.org/mybatis-3/java-api.html)
- [MyBatis with Spring | Baeldung](https://www.baeldung.com/spring-mybatis)
- [Return Auto Generated ID From Insert With MyBatis and Spring | Baeldung](https://www.baeldung.com/spring-mybatis-return-auto-generated-id)
- [mybatis-spring | Transactions](https://mybatis.org/spring/transactions.html)
- [mybatis-spring | Using an SqlSession (SqlSessionTemplate)](https://mybatis.org/spring/sqlsession.html)
- [mybatis-spring | Injecting Mappers (MapperFactoryBean)](https://mybatis.org/spring/mappers.html)
- [Introduction – mybatis-spring-boot-autoconfigure](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/)

---

## Related pages
- [[jpa-transaction]]
- [[multi-datasource]]
- [[querydsl]]
- [[batch]]
- [[bean-registration-control]]
