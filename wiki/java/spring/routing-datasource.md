---
title: Routing DataSource
updated: 2026-07-08 10:32:15
tags:
  - java
  - spring
  - spring-boot
  - datasource
  - routing
  - database
---

## 1. 개요

`AbstractRoutingDataSource`는 `getConnection()` 호출 시 현재 lookup key를 기준으로 실제 대상 `DataSource`를 선택하는 Spring JDBC 추상 클래스다. Javadoc은 lookup key가 보통 **thread-bound transaction context**에서 결정된다고 설명한다.

이 방식은 여러 persistence unit을 분리하는 문법이 아니라, **하나의 진입 `DataSource` 뒤에서 실제 DB를 동적으로 바꾸는 라우팅 계층**이다.

---

## 2. 적합한 사용 사례

| 상황 | 설명 |
|---|---|
| 멀티 테넌시 | 같은 엔티티/리포지토리 모델을 유지하면서 테넌트별 DB만 바꿀 때 |
| 읽기/쓰기 분리 | 조회는 replica, 변경은 primary로 보내야 할 때 |
| 요청 컨텍스트 기반 분기 | 헤더, 세션, AOP 컨텍스트 등에 따라 DB를 고를 때 |

반대로 주문 DB와 정산 DB처럼 **엔티티/리포지토리 자체가 다르면** 라우팅보다 [[multi-datasource]]처럼 persistence unit을 분리하는 쪽이 맞다.

---

## 3. 핵심 동작

`AbstractRoutingDataSource`는 내부에 여러 대상 `DataSource`를 가지고 있다가, 매 연결 요청마다 `determineCurrentLookupKey()`가 반환한 key로 대상 `DataSource`를 찾는다.

```java
public class ClientRoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return DatabaseContextHolder.get();
    }
}
```

구성 시에는 다음 두 가지를 지정한다.

- `targetDataSources`: lookup key -> 실제 `DataSource` 매핑
- `defaultTargetDataSource`: key가 없거나 fallback 시 사용할 기본 `DataSource`

---

## 4. 컨텍스트 보관 방식

Baeldung 예시는 lookup key를 `ThreadLocal`에 저장하는 `ContextHolder`를 사용한다. 현재 요청 흐름에서 사용할 DB key를 먼저 저장하고, 라우터가 이를 읽어 실제 `DataSource`를 고른다.

```java
public class DatabaseContextHolder {

    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void set(String key) {
        CONTEXT.set(key);
    }

    public static String get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```

`ThreadLocal`을 쓰는 경우 요청 종료 시 `clear()`를 호출하지 않으면 다음 요청에 컨텍스트가 누수될 수 있다.

---

## 5. 설정 예시

```java
@Bean
public DataSource routingDataSource(
        @Qualifier("writer") DataSource writer,
        @Qualifier("reader") DataSource reader) {

    Map<Object, Object> targets = new HashMap<>();
    targets.put("writer", writer);
    targets.put("reader", reader);

    var routing = new ClientRoutingDataSource();
    routing.setTargetDataSources(targets);
    routing.setDefaultTargetDataSource(writer);
    return routing;
}
```

Javadoc 기준으로 `setLenientFallback(false)`를 주면, 등록되지 않은 key가 들어왔을 때 무조건 기본 `DataSource`로 떨어지지 않고 예외를 내게 할 수 있다.

---

## 6. 운영 시 주의점

| 항목 | 주의점 |
|---|---|
| 트랜잭션 경계 | 트랜잭션 시작 이후 key를 바꾸면 의도와 다른 DB 연결이 유지될 수 있다 |
| ThreadLocal 정리 | 필터/AOP/finally 블록에서 `clear()` 보장 필요 |
| fallback 정책 | 잘못된 key를 조용히 기본 DB로 보내지 않도록 `setLenientFallback(false)` 검토 |
| JPA와의 결합 | 엔티티/리포지토리 모델이 동일한 경우에만 자연스럽다 |

---

## 7. 체크리스트

- lookup key를 어디서 결정하는지 명확한가
- `ThreadLocal` 컨텍스트를 항상 정리하는가
- `defaultTargetDataSource`와 fallback 정책을 의도적으로 정했는가
- 읽기/쓰기 분리라면 트랜잭션 시작 시점 이전에 key가 설정되는가
- 엔티티/리포지토리 구조가 실제로 라우팅 모델에 적합한가

---

## Sources
- [AbstractRoutingDataSource (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/lookup/AbstractRoutingDataSource.html)
- [A Guide to Spring AbstractRoutingDataSource (Baeldung)](https://www.baeldung.com/spring-abstract-routing-data-source)

---

## Related pages
- [[multi-datasource]]
