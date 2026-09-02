---
title: Spring 의존성 주입 방식
updated: 2026-08-31 14:25:48
tags:
  - java
  - spring
  - di
  - bean
---

## 1. 개요

Spring 컨테이너가 빈에 의존성을 주입하는 방식은 크게 **생성자 주입**과 **Setter 주입**이며, 어노테이션 기반에서는 **필드 주입**과 임의 설정 메서드 주입도 가능하다. Spring 팀의 공식 권장은 **필수 의존성은 생성자, 선택 의존성은 Setter**다.

---

## 2. 주입 방식

### 2.1. 생성자 주입

컨테이너가 의존성을 인자로 생성자를 호출한다. 빈 생성 시점에 모든 의존성이 확정된다.

```java
@Component
public class MovieRecommender {

    private final MovieFinder movieFinder;  // final 가능

    public MovieRecommender(MovieFinder movieFinder) {
        this.movieFinder = movieFinder;
    }
}
```

- `final` 필드 가능 → 불변 객체
- 필수 의존성이 `null`이 아님을 보장, 항상 완전히 초기화된 상태로 사용됨
- 생성자가 하나뿐이면 `@Autowired` 생략 가능
- Lombok `@RequiredArgsConstructor`로 보일러플레이트 제거 가능

### 2.2. Setter 주입

컨테이너가 기본 생성자로 인스턴스를 만든 뒤 setter를 호출해 주입한다.

```java
@Component
public class SimpleMovieLister {

    private MovieFinder movieFinder;

    @Autowired
    public void setMovieFinder(MovieFinder movieFinder) {
        this.movieFinder = movieFinder;
    }
}
```

- **선택적 의존성**에 적합 — 주입되지 않아도 클래스가 동작하는 의존성. 클래스 안에서 합리적인 기본값을 지정해 두고, 주입이 있으면 교체된다. 기본값을 줄 수 없는 의존성을 setter로 받으면 사용하는 모든 곳에서 null 체크가 필요해진다
- 객체 생성 후 재구성·재주입 가능 — JMX MBean 관리가 대표 사용처
- setter가 아닌 임의 이름·복수 인자 메서드에도 `@Autowired` 적용 가능

### 2.3. 필드 주입

필드에 `@Autowired`를 붙이면 컨테이너가 리플렉션으로 직접 대입한다.

```java
@Component
public class MovieRecommender {

    @Autowired
    private MovieCatalog movieCatalog;
}
```

코드는 가장 짧지만 다음 문제로 **권장되지 않는다**.

- **컨테이너 결합·불완전한 인스턴스** — 의존성 주입에 컨테이너(리플렉션)가 필요하다. `new`로 생성하면 의존성이 `null`인 인스턴스가 만들어지며, 테스트에서 의존성을 넣으려면 리플렉션이 필요하다.
- **의존성 은닉** — 필요한 의존성이 생성자·메서드 시그니처에 나타나지 않는다. 생성자 주입에서는 "이 클래스를 사용하려면 이 협력자들이 필요하다"는 요구사항이 public API에 그대로 드러나지만, 필드 주입에서는 소스 코드를 열어 보기 전까지 알 수 없다. 클래스 외부(호출자·테스트 작성자)가 타입의 계약만으로 인스턴스를 올바르게 구성할 수 없게 된다.
- **`final` 불가** — 불변 객체로 만들 수 없고, 필수/선택 의존성 구분이 코드에 표현되지 않는다.
- **단일 책임 위반 감지 지연** — 생성자 주입은 의존성이 늘면 생성자 파라미터가 함께 늘어나 책임 과다를 코드 수준에서 바로 확인할 수 있다. 필드 주입은 필드 선언 한 줄로 의존성이 추가되므로 클래스가 비대해져도 신호가 없다([[solid]] SRP).

---

## 3. 방식 비교

| | 생성자 주입 | Setter 주입 | 필드 주입 |
|---|---|---|---|
| 용도 | 필수 의존성 | 선택 의존성 | — (비권장) |
| 불변성(`final`) | 가능 | 불가 | 불가 |
| null 안전 | 생성 시점 보장 | null 체크 필요 | null 체크 필요 |
| 완전 초기화 보장 | 항상 | 부분 초기화 가능 | 부분 초기화 가능 |
| 컨테이너 없는 테스트 | 생성자 호출로 간단 | setter 호출 | 리플렉션 필요 |
| 재구성·재주입 | 불가 | 가능 (JMX) | 불가 |
| 순환 참조 | `BeanCurrentlyInCreationException` 즉시 감지 | 동작함 (비권장) | 동작함 (비권장) |

순환 참조: 생성자 주입 빈끼리 서로 의존하면 컨테이너가 런타임에 감지해 예외를 던진다. Setter 주입으로 풀 수는 있으나 공식 문서도 권장하지 않는다 — 설계 재검토가 우선이다.

---

## 4. 권장 사항

Spring 팀 공식 권장 (레퍼런스 원문 기준):

- **생성자 주입을 기본으로 사용** — 불변 객체 구현, 필수 의존성 non-null 보장, 완전 초기화 상태 반환
- 생성자 인자가 많아지는 것은 code smell — 책임 과다 신호이므로 클래스 분리 검토
- **Setter 주입은 클래스 내부에서 기본값을 부여할 수 있는 선택 의존성에만** 사용
- 선택 의존성 표현: `@Autowired(required = false)`, `Optional<T>`, `@Nullable`

---

## Sources

- [Spring Framework — Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
- [Spring Framework — Using @Autowired](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html)
- [Why field injection is evil (Oliver Drotbohm)](https://odrotbohm.de/2013/11/why-field-injection-is-evil/)

---

## Related pages

- [[bean-registration-control]]
- [[entity-listener-di]]
- [[solid]]
