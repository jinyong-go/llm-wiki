---
title: SOLID 원칙
updated: 2026-07-08 10:32:15
tags:
  - programming
  - oop
  - design
  - solid
  - clean-code
---

## 1. 개요

SOLID는 Robert C. Martin(Uncle Bob)이 정리한 객체지향 설계의 5가지 원칙이다. 각 원칙의 머리글자를 따서 SOLID라 부른다. 이 원칙들을 따르면 변경에 유연하고, 이해하기 쉽고, 재사용 가능한 소프트웨어 구조를 만들 수 있다.

| 약자 | 원칙 | 핵심 |
| :--- | :--- | :--- |
| **S** | Single Responsibility Principle | 클래스는 하나의 책임만 가진다 |
| **O** | Open/Closed Principle | 확장에는 열려 있고 수정에는 닫혀 있어야 한다 |
| **L** | Liskov Substitution Principle | 하위 타입은 상위 타입을 대체할 수 있어야 한다 |
| **I** | Interface Segregation Principle | 클라이언트가 사용하지 않는 인터페이스에 의존하지 않아야 한다 |
| **D** | Dependency Inversion Principle | 고수준 모듈은 저수준 모듈에 의존하지 않아야 한다. 둘 다 추상화에 의존해야 한다 |

---

## 2. S — 단일 책임 원칙 (Single Responsibility Principle)

> "A class should have one, and only one, reason to change."

클래스가 변경되어야 하는 이유는 단 하나여야 한다. "책임"은 기능의 수가 아니라 **변경의 축(axis of change)**을 의미한다.

### 2.1. 위반 예시

```java
class UserService {
    public User findById(Long id) { ... }      // 비즈니스 로직
    public void sendWelcomeEmail(User user) { ... }  // 이메일 발송
    public String toJson(User user) { ... }     // 직렬화
}
```

`UserService`는 사용자 조회, 이메일 발송, 직렬화라는 세 가지 변경 이유를 가진다. 이메일 템플릿이 바뀌거나 JSON 라이브러리가 교체될 때마다 `UserService`를 수정해야 한다.

### 2.2. 적용 후

```java
class UserService {
    public User findById(Long id) { ... }
}

class EmailNotificationService {
    public void sendWelcomeEmail(User user) { ... }
}

class UserSerializer {
    public String toJson(User user) { ... }
}
```

각 클래스는 하나의 변경 이유만 갖는다.

### 2.3. 주의

SRP를 과도하게 적용하면 클래스가 지나치게 잘게 쪼개져 오히려 이해하기 어려워진다. "책임"의 경계는 도메인 컨텍스트에 따라 달라지므로, 같은 맥락에서 함께 변하는 것들은 하나의 클래스에 둔다.

---

## 3. O — 개방-폐쇄 원칙 (Open/Closed Principle)

> "Software entities should be open for extension, but closed for modification."

새로운 기능을 추가할 때 기존 코드를 수정하지 않고 확장(상속, 구성, 전략 패턴 등)을 통해 구현해야 한다.

### 3.1. 위반 예시

```java
class DiscountCalculator {
    public double calculate(Order order, String discountType) {
        if (discountType.equals("VIP")) {
            return order.getTotal() * 0.9;
        } else if (discountType.equals("COUPON")) {
            return order.getTotal() - 1000;
        }
        return order.getTotal();
    }
}
```

할인 유형이 추가될 때마다 `if` 분기가 늘어나며 기존 코드를 수정해야 한다.

### 3.2. 적용 후

```java
interface DiscountPolicy {
    double apply(double total);
}

class VipDiscount implements DiscountPolicy {
    public double apply(double total) { return total * 0.9; }
}

class CouponDiscount implements DiscountPolicy {
    public double apply(double total) { return total - 1000; }
}

class DiscountCalculator {
    public double calculate(Order order, DiscountPolicy policy) {
        return policy.apply(order.getTotal());
    }
}
```

새로운 할인 정책은 `DiscountPolicy`를 구현하는 클래스를 추가하는 것으로 끝난다. 기존 코드는 변경하지 않는다.

---

## 4. L — 리스코프 치환 원칙 (Liskov Substitution Principle)

> "Subtypes must be substitutable for their base types."

Barbara Liskov가 제안한 원칙. 상위 타입 객체를 하위 타입으로 교체해도 프로그램의 동작이 바뀌어서는 안 된다.

### 4.1. 위반 예시

```java
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; }
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; }
}
```

```java
Rectangle r = new Square();
r.setWidth(5);
r.setHeight(3);
System.out.println(r.area()); // 9 (기대: 15) — LSP 위반
```

`Square`는 `Rectangle`의 계약(width와 height를 독립적으로 설정 가능)을 깨뜨린다.

### 4.2. 해결 방법

상속 대신 공통 인터페이스로 분리한다:

```java
interface Shape {
    int area();
}

class Rectangle implements Shape { ... }
class Square implements Shape { ... }
```

### 4.3. LSP 위반 징후

- 하위 클래스에서 상위 클래스의 메서드를 `throw UnsupportedOperationException`으로 재정의
- 하위 클래스의 사전조건이 상위 클래스보다 강하거나 사후조건이 더 약한 경우
- 사용 측 코드에 `instanceof` 분기가 등장

---

## 5. I — 인터페이스 분리 원칙 (Interface Segregation Principle)

> "Clients should not be forced to depend upon interfaces that they do not use."

하나의 범용 인터페이스보다 여러 개의 구체적인 인터페이스가 낫다.

### 5.1. 위반 예시

```java
interface Animal {
    void eat();
    void fly();
    void swim();
}

class Dog implements Animal {
    public void eat() { ... }
    public void fly() { throw new UnsupportedOperationException(); }  // 불필요
    public void swim() { ... }
}
```

`Dog`는 `fly()`가 필요 없지만 구현을 강제당한다. `fly()` 시그니처가 바뀌면 `Dog`도 영향을 받는다.

### 5.2. 적용 후

```java
interface Eatable { void eat(); }
interface Flyable  { void fly(); }
interface Swimmable { void swim(); }

class Dog implements Eatable, Swimmable {
    public void eat() { ... }
    public void swim() { ... }
}

class Duck implements Eatable, Flyable, Swimmable { ... }
```

각 클라이언트(Dog, Duck)는 필요한 인터페이스에만 의존한다.

### 5.3. 실무 적용

Spring의 `Repository` 계층을 예로 들면, `JpaRepository`가 제공하는 수십 개의 메서드가 불필요한 경우 커스텀 인터페이스만 노출하는 `Repository Projection`([[repository-projection]])과 같은 패턴이 ISP의 실현이다.

---

## 6. D — 의존성 역전 원칙 (Dependency Inversion Principle)

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."
> "Abstractions should not depend on details. Details should depend on abstractions."

### 6.1. 위반 예시

```java
class OrderService {          // 고수준
    private MySQLOrderRepository repo = new MySQLOrderRepository();  // 저수준에 직접 의존

    public void place(Order order) {
        repo.save(order);
    }
}
```

`OrderService`가 `MySQLOrderRepository`라는 구체 클래스에 직접 의존한다. DB를 바꾸면 `OrderService`도 수정해야 한다.

### 6.2. 적용 후

```java
interface OrderRepository {          // 추상화
    void save(Order order);
}

class MySQLOrderRepository implements OrderRepository { ... }
class InMemoryOrderRepository implements OrderRepository { ... }  // 테스트용

class OrderService {
    private final OrderRepository repo;

    OrderService(OrderRepository repo) {    // 생성자 주입 (DI)
        this.repo = repo;
    }

    public void place(Order order) {
        repo.save(order);
    }
}
```

`OrderService`와 `MySQLOrderRepository` 모두 `OrderRepository` 추상화에 의존한다. 의존 방향이 역전된다.

### 6.3. DIP와 DI(의존성 주입)의 관계

DIP는 **원칙**이고, Dependency Injection은 DIP를 달성하는 **기법** 중 하나다. Spring의 IoC 컨테이너는 DI를 통해 DIP를 자동으로 실현해 준다.

---

## 7. 원칙 간 관계

SOLID 원칙들은 독립적이지 않다. 함께 작동할 때 효과가 극대화된다:

- **SRP + ISP**: 책임을 쪼개면 인터페이스도 자연히 작아진다.
- **OCP + DIP**: 추상화(DIP)가 있어야 수정 없이 확장(OCP)할 수 있다.
- **LSP**: OCP의 전제 조건. 대체 가능한 하위 타입이 없으면 OCP를 달성할 수 없다.

## 8. 실무 관점

SOLID는 목표가 아니라 **도구**다. 모든 코드에 적용하는 것이 아니라 복잡성이 증가하는 지점, 즉 변경이 잦거나 여러 팀이 함께 작업하거나 테스트가 어려운 코드에 우선 적용한다.

| 증상 | 관련 원칙 |
| :--- | :--- |
| 수정할 때 예상치 못한 곳이 함께 바뀐다 | SRP, OCP |
| 새 기능 추가 시 기존 코드를 자주 수정한다 | OCP, DIP |
| `instanceof` 분기가 많다 | LSP |
| 구현 안 하는 메서드가 많다 | ISP |
| 테스트에서 DB/외부 API를 Mock하기 어렵다 | DIP |

---

## Sources
- [Design Principles and Design Patterns — Robert C. Martin (2000)](https://web.archive.org/web/20150906155800/http://www.objectmentor.com/resources/articles/Principles_and_Patterns.pdf)
- [Clean Architecture — Robert C. Martin (2017)](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)
- [A Behavioral Notion of Subtyping — Barbara Liskov, Jeannette Wing (1994)](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf)

---

## Related pages
- [[repository-projection]]
- [[aop]]
- [[jpa-transaction]]
