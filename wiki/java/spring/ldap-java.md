---
title: Java LDAP — JNDI·Spring LDAP 연동
updated: 2026-07-22 09:56:05
tags:
  - java
  - ldap
  - jndi
  - spring-ldap
  - spring
---

## 1. 개요

Java에서 LDAP 연동은 크게 두 가지 방식으로 접근한다. LDAP 개념(DN/RDN, 오퍼레이션, 검색, 인증)은 [[ldap]] 참조.

| | JNDI | Spring LDAP |
|---|---|---|
| 위치 | JDK 표준(`javax.naming.*`) | 별도 라이브러리(`spring-ldap-core` / `spring-boot-starter-data-ldap`) |
| 특징 | 저수준, 연결·예외 처리를 직접 다룸 | `LdapTemplate`이 리소스 관리·예외 변환·필터 이스케이프를 대신 처리 |
| 권장 상황 | 외부 의존성 최소화, 단순 조회·인증 | Spring 기반 애플리케이션, 반복적인 CRUD |

이하 §2~§7은 JNDI, §8은 Spring LDAP을 다룬다.

---

## 2. JNDI 연결 설정

`InitialDirContext` 생성 시 넘기는 `Hashtable`(환경, `env`)의 키는 `javax.naming.Context`의 문자열 상수다. 상수 대신 문자열 키를 직접 써도 동일하게 동작한다.

### 2.1. 표준 속성 (javax.naming.Context)

| Context 상수 | 문자열 키 | 설명 |
|---|---|---|
| `INITIAL_CONTEXT_FACTORY` | `java.naming.factory.initial` | 초기 컨텍스트 팩토리 클래스. LDAP은 `com.sun.jndi.ldap.LdapCtxFactory` |
| `PROVIDER_URL` | `java.naming.provider.url` | 접속할 서버 URL(`ldap://host:port`, `ldaps://host:port`). 베이스 DN을 붙여 지정할 수도 있음 |
| `SECURITY_AUTHENTICATION` | `java.naming.security.authentication` | 인증 방식 — `none`(익명) / `simple`(평문 bind) / SASL 메커니즘명(공백 구분, 예 `GSSAPI`, `DIGEST-MD5`) |
| `SECURITY_PRINCIPAL` | `java.naming.security.principal` | 인증 주체 DN(simple bind 시) |
| `SECURITY_CREDENTIALS` | `java.naming.security.credentials` | 인증 자격증명(비밀번호 등) |
| `SECURITY_PROTOCOL` | `java.naming.security.protocol` | `ssl` 지정 시 SSL/TLS로 연결 |
| `REFERRAL` | `java.naming.referral` | 리퍼럴 처리 방식 — `ignore`(기본값) / `follow` / `throw` |
| `BATCHSIZE` | `java.naming.batchsize` | `search()`/`list()`/`listBindings()` 결과를 서버에서 몇 건씩 읽어와 `NamingEnumeration`에 채울지 지정(기본값 1). `SearchControls.setCountLimit()`(반환 총량 제한, [§4.2](#42-searchcontrols--기타-옵션))과는 무관하며, 값이 클수록 왕복 횟수는 줄지만 메모리 사용량이 늘어남 |

이 표의 속성들은 **JNDI 표준**이라 어떤 서비스 제공자(LDAP뿐 아니라 DNS 등)를 쓰든 동일하게 해석된다.

### 2.2. LDAP 프로바이더 전용 속성

JDK 기본 LDAP 프로바이더(`com.sun.jndi.ldap`)가 추가로 제공하는 속성이다. 다른 LDAP 프로바이더 구현체에서는 지원하지 않을 수 있다.

| 속성 | 설명 |
|---|---|
| `java.naming.ldap.version` | LDAP 프로토콜 버전(2 또는 3) |
| `java.naming.ldap.derefAliases` | 별칭 엔트리 역참조 시점(`always`/`never`/`finding`/`searching`) |
| `com.sun.jndi.ldap.connect.timeout` | 연결 타임아웃(ms). 미설정 시 TCP 기본 타임아웃 사용. 커넥션 풀 사용 시에는 풀에서 커넥션을 기다리는 최대 시간으로도 쓰임 |
| `com.sun.jndi.ldap.read.timeout` | 서버 응답 대기 타임아웃(ms). 미설정 시 무한 대기 |
| `com.sun.jndi.ldap.connect.pool` | `true`면 조건이 맞는 경우 커넥션 풀 사용 |

### 2.3. 연결 예시

```java
Hashtable<String, String> env = new Hashtable<>();
env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
env.put(Context.PROVIDER_URL, "ldap://dir.example.com:389");
env.put(Context.SECURITY_AUTHENTICATION, "simple");
env.put(Context.SECURITY_PRINCIPAL, "uid=admin,dc=example,dc=com");
env.put(Context.SECURITY_CREDENTIALS, "secret");
env.put("com.sun.jndi.ldap.connect.timeout", "3000");
env.put("com.sun.jndi.ldap.read.timeout", "5000");

DirContext ctx = new InitialDirContext(env);   // 생성 시점에 bind 수행
```

Simple bind는 평문 전송이므로 프로덕션에서는 `ldaps://` 또는 StartTLS로 감싼다([[ldap]] §6.2).

---

## 3. 엔트리 속성 표현 — Attributes/BasicAttributes/BasicAttribute

검색 조건·생성/변경할 값 모두 `javax.naming.directory` 패키지의 속성 클래스로 표현한다.

| 타입 | 역할 |
|---|---|
| `Attributes`(인터페이스) | 엔트리의 속성 **집합**(속성 이름 → 값). `get(id)`/`put(id, val)`/`remove(id)`/`getAll()`/`getIDs()`/`size()` |
| `BasicAttributes` | `Attributes`의 기본 구현체. 생성자로 대소문자 구분 여부(`ignoreCase`) 지정 가능 |
| `Attribute`(인터페이스) | 하나의 속성 값(들). LDAP 속성은 **다중값**을 가질 수 있으므로 `add(value)`/`remove(value)`/`get()`(첫 값)/`getAll()`(전체 값)/`size()` 제공 |
| `BasicAttribute` | `Attribute`의 기본 구현체. `ordered` 여부로 값 순서 유지 여부 지정 가능 |

LDAP 속성 이름은 대소문자를 구분하지 않으므로, `Attributes`를 생성할 때 `ignoreCase=true`를 권장한다(Oracle LDAP 프로바이더 가이드).

```java
Attributes attrs = new BasicAttributes(true);   // ignoreCase=true

Attribute objectClass = new BasicAttribute("objectclass");
objectClass.add("top");
objectClass.add("inetOrgPerson");
attrs.put(objectClass);          // 다중값 속성

attrs.put("cn", "John Doe");     // 단일값 — BasicAttributes.put(String, Object)가 내부적으로 BasicAttribute 생성
attrs.put("sn", "Doe");
attrs.put("mail", "john.doe@example.com");
```

다중값 속성 조회:

```java
Attribute mail = attrs.get("mail");
String first = (String) mail.get();          // 첫 값
NamingEnumeration<?> all = mail.getAll();     // 전체 값 순회
```

**주의**: `Attributes`/`Attribute` 객체는 로컬 자바 객체일 뿐이며, 값을 바꿔도 디렉터리에는 반영되지 않는다. 디렉터리 반영은 `DirContext`의 `bind`/`rebind`/`createSubcontext`/`modifyAttributes` 호출을 통해서만 이뤄진다.

---

## 4. 검색(Search)

### 4.1. SearchControls — 스코프

| 상수 | 값 | LDAP 스코프([[ldap]] §4.1) | 설명 |
|---|---|---|---|
| `OBJECT_SCOPE` | 0 | baseObject | 지정한 엔트리 자체만 검색 |
| `ONELEVEL_SCOPE` | 1(기본값) | singleLevel | 지정한 컨텍스트 바로 하위만(자신 제외) |
| `SUBTREE_SCOPE` | 2 | wholeSubtree | 지정한 엔트리를 포함해 하위 전체 |

`new SearchControls()`의 기본값은 **ONELEVEL_SCOPE**다. 대부분의 실무 검색(전체 하위 트리 조회)은 `SUBTREE_SCOPE`를 명시적으로 지정해야 한다.

### 4.2. SearchControls — 기타 옵션

| 메서드 | 설명 |
|---|---|
| `setCountLimit(long)` | 반환할 최대 엔트리 수(0 = 제한 없음, 기본값) |
| `setTimeLimit(int)` | 검색 대기 시간(ms, 0 = 무제한, 기본값) |
| `setReturningAttributes(String[])` | 반환받을 속성 지정. `null` = 전체 속성(기본값), 빈 배열(`new String[0]`) = 속성 없이 이름만 |
| `setReturningObjFlag(boolean)` | 바인딩된 객체 자체를 반환할지(기본값 `false` — 이름/클래스만 반환) |
| `setDerefLinkFlag(boolean)` | 검색 중 링크(별칭 엔트리) 역참조 여부 |

```java
SearchControls controls = new SearchControls();
controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
controls.setReturningAttributes(new String[] { "cn", "mail" });
controls.setCountLimit(100);
```

### 4.3. 필터 문자열로 검색

```java
NamingEnumeration<SearchResult> results =
    ctx.search("ou=People,dc=example,dc=com", "(uid={0})",
               new Object[] { "john.doe" }, controls);

while (results.hasMore()) {
    SearchResult r = results.next();
    Attributes attrs = r.getAttributes();
    System.out.println(attrs.get("cn").get());
}
results.close();
```

필터 값을 `{0}` 플레이스홀더로 넘기면 JNDI가 이스케이프를 처리해 LDAP 인젝션을 방지한다.

### 4.4. Attributes로 검색 — 필터 문자열 없는 매칭

`DirContext.search(Name, Attributes matchingAttributes)`는 필터 문자열 없이 `Attributes`를 검색 조건으로 사용한다. 조건에 포함된 각 속성은 이름이 같고 값이 대상 엔트리 값의 부분집합이면 매치되며, 조건에 든 모든 속성이 AND로 결합된다. 값 없이 이름만 있는 속성은 presence 검사(`attr=*`)와 동일하게 동작한다.

```java
Attributes matchAttrs = new BasicAttributes(true);
matchAttrs.put("objectclass", "person");
matchAttrs.put("uid", "john.doe");

NamingEnumeration<SearchResult> results =
    ctx.search("ou=People,dc=example,dc=com", matchAttrs);
```

단순 AND-equality 조건이면 필터 문자열보다 이 방식이 간결하다. OR·부정·와일드카드 등 복잡한 조건은 필터 문자열([§4.3](#43-필터-문자열로-검색))을 사용해야 한다.

---

## 5. 엔트리 생성 — createSubcontext

```java
Attributes attrs = new BasicAttributes(true);
Attribute oc = new BasicAttribute("objectclass");
oc.add("top");
oc.add("inetOrgPerson");
attrs.put(oc);
attrs.put("cn", "John Doe");
attrs.put("sn", "Doe");
attrs.put("mail", "john.doe@example.com");

ctx.createSubcontext("uid=john.doe,ou=People,dc=example,dc=com", attrs);
```

`objectclass`는 엔트리 생성 시 사실상 필수다([[ldap]] §2.5) — 대상 스키마가 요구하는 필수 속성(MUST)을 모두 채워야 한다.

---

## 6. 엔트리 변경 — modifyAttributes

`DirContext.modifyAttributes()`에 변경 목록(`ModificationItem[]`)을 넘겨 속성 단위로 수정한다. 각 항목은 변경 종류 상수 + 변경할 `Attribute`로 구성된다.

| 상수 | 동작 |
|---|---|
| `DirContext.ADD_ATTRIBUTE` | 값을 추가(속성이 없으면 새로 생성). 기존 값 집합과의 합집합이 됨 |
| `DirContext.REPLACE_ATTRIBUTE` | 값을 지정한 값으로 완전히 교체(속성이 없으면 생성). 값을 지정하지 않으면 속성 삭제 |
| `DirContext.REMOVE_ATTRIBUTE` | 지정한 값(또는 값 미지정 시 속성 전체)을 삭제 |

목록의 변경은 **순서대로 적용**되며, 전부 성공하거나 전부 실패한다(원자적).

```java
ModificationItem[] mods = new ModificationItem[3];
mods[0] = new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
    new BasicAttribute("mail", "new.mail@example.com"));
mods[1] = new ModificationItem(DirContext.ADD_ATTRIBUTE,
    new BasicAttribute("telephonenumber", "+1 555 555 5555"));
mods[2] = new ModificationItem(DirContext.REMOVE_ATTRIBUTE,
    new BasicAttribute("jpegphoto"));

ctx.modifyAttributes("uid=john.doe,ou=People,dc=example,dc=com", mods);
```

`Attributes` 전체를 한 번에 같은 방식으로 적용하는 축약형도 있다(개별 속성마다 다른 변경 종류를 줄 필요가 없을 때).

```java
ctx.modifyAttributes(dn, DirContext.REPLACE_ATTRIBUTE, newAttrs);
```

---

## 7. 생성·변경 분기(Upsert) 패턴

대상 엔트리가 이미 존재하는지 검색으로 먼저 확인한 뒤, 있으면 변경(`modifyAttributes`)·없으면 생성(`createSubcontext`)으로 분기하는 패턴이다. `NamingEnumeration.hasMore()`가 결과 존재 여부를 알려준다.

```java
NamingEnumeration<SearchResult> existing = ctx.search(
    "ou=People,dc=example,dc=com", "(uid={0})",
    new Object[] { "john.doe" }, controls);

if (existing.hasMore()) {
    ModificationItem[] mods = {
        new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
            new BasicAttribute("mail", "new.mail@example.com"))
    };
    ctx.modifyAttributes("uid=john.doe,ou=People,dc=example,dc=com", mods);
} else {
    ctx.createSubcontext("uid=john.doe,ou=People,dc=example,dc=com", buildAttributes());
}
existing.close();
```

대상 DN을 이미 알고 있는 경우, 검색 대신 `ctx.lookup(dn)`을 시도해 `NameNotFoundException` 발생 여부로 존재를 판별하는 방법도 있다 — 검색보다 가볍지만 조건부 존재 확인(특정 속성값 매칭)은 할 수 없다.

---

## 8. Spring LDAP

### 8.1. 의존성과 설정

```gradle
implementation 'org.springframework.boot:spring-boot-starter-data-ldap'
```

```yaml
spring:
  ldap:
    urls: ldap://dir.example.com:389
    base: dc=example,dc=com
    username: uid=admin,dc=example,dc=com
    password: secret
```

Spring Boot가 위 설정으로 `LdapTemplate` 빈을 자동 구성한다.

### 8.2. 검색 — AttributesMapper

```java
@Repository
public class PersonRepository {
    private final LdapTemplate ldapTemplate;

    public PersonRepository(LdapTemplate ldapTemplate) {
        this.ldapTemplate = ldapTemplate;
    }

    public List<String> findAllCommonNames() {
        return ldapTemplate.search(
            "ou=People", "(objectclass=person)",
            (AttributesMapper<String>) attrs -> (String) attrs.get("cn").get());
    }
}
```

### 8.3. LdapQueryBuilder — 동적 필터

```java
import static org.springframework.ldap.query.LdapQueryBuilder.query;

List<String> names = ldapTemplate.search(
    query().where("objectclass").is("person").and("sn").is(lastName),
    (AttributesMapper<String>) attrs -> (String) attrs.get("cn").get());
```

필터 문자열을 직접 조립하지 않으므로 값이 자동으로 이스케이프되어 LDAP 인젝션을 방지한다.

지원하는 조건 종류: `is`(=) / `gte`(>=) / `lte`(<=) / `like`(와일드카드 포함) / `whitespaceWildcardsLike`(공백을 와일드카드로 치환) / `isPresent`(속성 존재 여부, `attr=*`) / `not`(부정).

다중값 속성 매칭은 LDAP 프로토콜 차원의 동작이라 별도 API 없이 동일한 `is()`로 처리된다 — equality 필터(`attr=value`)는 다중값 속성 중 하나라도 일치하면 매치된다. 여러 값 중 하나라도 있으면 매치하려면(OR) 같은 속성에 `or()`를 체이닝하고, 여러 값을 모두 가진 엔트리만 찾으려면(AND) `and()`를 체이닝한다.

```java
// (|(cn=Doe)(cn=Doo)) — cn이 Doe 또는 Doo 중 하나라도 있으면 매치
query().where("cn").is("Doe").or("cn").is("Doo");

// (&(mail=a@x.com)(mail=b@x.com)) — mail이 두 값을 모두 가진 엔트리만 매치
query().where("mail").is("a@x.com").and("mail").is("b@x.com");
```

### 8.4. ODM(Object-Directory Mapping) — @Entry

JPA `@Entity`에 대응하는 매핑 방식이다.

```java
@Entry(objectClasses = { "inetOrgPerson", "organizationalPerson", "person", "top" },
       base = "ou=People")
public class Person {
    @Id
    private Name dn;

    @Attribute(name = "cn")
    private String fullName;

    @Attribute(name = "sn")
    private String lastName;

    @Attribute(name = "mail")
    private String email;
}
```

```java
Person p = ldapTemplate.findOne(query().where("uid").is("john.doe"), Person.class);
ldapTemplate.create(newPerson);
ldapTemplate.update(existingPerson);
ldapTemplate.delete(existingPerson);
```

### 8.5. Bind/Rebind/Unbind(저수준)

`DirContextAdapter` 없이 `Attributes`를 직접 다루는 저수준 방식이다.

| 메서드 | 동작 |
|---|---|
| `bind(dn, obj, attrs)` | 엔트리 생성. DN이 이미 존재하면 `NameAlreadyBoundException` |
| `rebind(dn, obj, attrs)` | 엔트리 생성 또는 **전체 교체**. unbind 후 bind와 동일하게 동작하는 crude한 방식 — `attrs`에 포함하지 않은 기존 속성은 사라짐 |
| `unbind(dn)` | 엔트리 삭제 |

두 번째 인자(`obj`)는 보통 `null`이며, `attrs`만으로 엔트리를 표현한다.

```java
Name dn = LdapNameBuilder.newInstance("dc=example,dc=com")
    .add("ou", "People").add("uid", "john.doe").build();

Attributes attrs = new BasicAttributes();
// objectclass, cn, sn 등 채움

ldapTemplate.bind(dn, null, attrs);     // 생성 (이미 존재하면 예외)
ldapTemplate.rebind(dn, null, attrs);   // 생성 또는 전체 교체
ldapTemplate.unbind(dn);                // 삭제
```

`rebind`는 지정하지 않은 속성까지 사라지므로, 일부 속성만 바꿀 때는 `modifyAttributes`(§6과 동일 시그니처)를 쓴다.

---

## 9. 선택 기준

| 상황 | 권장 |
|---|---|
| Spring 기반 애플리케이션, 반복적인 CRUD·조회 | Spring LDAP(`LdapTemplate`/ODM) |
| 외부 의존성 최소화, 단순 인증·조회 1회성 로직 | JNDI 직접 사용 |
| 사용자 로그인 검증(자격증명 확인) | 대상 DN으로 bind 시도 — Spring 환경이면 Spring Security LDAP 모듈 사용 고려 |

---

## Sources
- Oracle — javax.naming.Context (Java SE 17): https://docs.oracle.com/en/java/javase/17/docs/api/java.naming/javax/naming/Context.html
- Oracle — javax.naming.directory.SearchControls (Java SE 17): https://docs.oracle.com/en/java/javase/17/docs/api/java.naming/javax/naming/directory/SearchControls.html
- Oracle — javax.naming.directory.BasicAttributes (Java SE 17): https://docs.oracle.com/en/java/javase/17/docs/api/java.naming/javax/naming/directory/BasicAttributes.html
- Oracle — javax.naming.directory.BasicAttribute (Java SE 17): https://docs.oracle.com/en/java/javase/17/docs/api/java.naming/javax/naming/directory/BasicAttribute.html
- Oracle — javax.naming.directory.DirContext (Java SE 17): https://docs.oracle.com/en/java/javase/17/docs/api/java.naming/javax/naming/directory/DirContext.html
- Oracle — LDAP Naming Service Provider for JNDI (환경 속성 전체): https://docs.oracle.com/javase/8/docs/technotes/guides/jndi/jndi-ldap.html
- Oracle JNDI Tutorial — Batch Size: https://docs.oracle.com/javase/jndi/tutorial/ldap/search/batch.html
- Oracle JNDI Tutorial — Modifying Attributes: https://docs.oracle.com/javase/jndi/tutorial/basics/directory/modattrs.html
- Oracle JNDI Tutorial — Setting Timeout for LDAP Operations: https://docs.oracle.com/javase/tutorial/jndi/newstuff/readtimeout.html
- Spring LDAP Reference — Object-Directory Mapping (ODM): https://docs.spring.io/spring-ldap/reference/odm.html
- Spring LDAP Reference — Advanced LDAP Queries: https://docs.spring.io/spring-ldap/reference/query-builder-advanced.html
- Spring LDAP Reference — Basic Operations: https://docs.spring.io/spring-ldap/docs/1.3.2.RELEASE/reference/html/basic.html

---

## Related pages
- [[ldap]] — LDAP 개념(DIT/DN/RDN, 오퍼레이션, 검색, 인증)
