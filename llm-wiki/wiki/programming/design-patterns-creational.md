---
title: GoF 생성 패턴
updated: 2026-07-08 10:32:15
tags:
  - programming
  - oop
  - design-patterns
  - gof
  - creational
---

생성 패턴은 객체 생성 로직을 캡슐화해 클라이언트가 구체 클래스에 의존하지 않도록 한다. → [[design-patterns]]

---

## 1. Singleton

### 1.1. 핵심 아이디어

클래스의 인스턴스를 정확히 하나만 생성하고, 어디서나 동일한 인스턴스에 접근할 수 있는 전역 진입점을 제공한다.

### 1.2. 구현

**Enum Singleton (권장)**: JVM이 직렬화·리플렉션 공격을 자동으로 차단한다.

```java
public enum AppConfig {
    INSTANCE;

    private final String dbUrl = System.getenv("DB_URL");

    public String getDbUrl() { return dbUrl; }
}

// 사용
AppConfig.INSTANCE.getDbUrl();
```

**Double-Checked Locking**: 지연 초기화가 필요할 때 사용한다. `volatile` 없이는 JVM 명령어 재정렬로 인해 불완전한 객체가 반환될 수 있다.

```java
public class ConnectionPool {
    private static volatile ConnectionPool instance;

    private ConnectionPool() { }

    public static ConnectionPool getInstance() {
        if (instance == null) {
            synchronized (ConnectionPool.class) {
                if (instance == null) {
                    instance = new ConnectionPool();
                }
            }
        }
        return instance;
    }
}
```

**Initialization-on-demand holder**: 지연 초기화 + 스레드 안전을 가장 단순하게 달성한다.

```java
public class Registry {
    private Registry() { }

    private static class Holder {
        static final Registry INSTANCE = new Registry();
    }

    public static Registry getInstance() { return Holder.INSTANCE; }
}
```

### 1.3. 장단점

| | |
| :--- | :--- |
| 장점 | 인스턴스 중복 생성 방지, 전역 상태 일관성, 리소스 절감 |
| 단점 | 전역 상태 → 테스트 격리 어려움, [[solid]]의 SRP·OCP 위반 가능성, 멀티스레드 구현 주의 필요 |

### 1.4. 실무

- Spring `@Component`, `@Service` 등은 기본적으로 싱글턴 스코프
- 직접 Singleton을 구현하기보다 Spring IoC 컨테이너에 위임하는 것이 권장된다
- `static` 필드 기반 싱글턴은 단위 테스트에서 상태가 테스트 간에 누수될 수 있어 주의

---

## 2. Factory Method

### 2.1. 핵심 아이디어

객체 생성 인터페이스를 정의하되, 어떤 클래스를 인스턴스화할지 결정은 서브클래스에 위임한다. `new`를 직접 호출하는 대신 팩토리 메서드를 호출한다.

### 2.2. 구조

```
Creator (abstract)
  └── createProduct(): Product  ← 팩토리 메서드 (서브클래스가 오버라이드)
  └── someOperation()           ← createProduct() 를 사용하는 비즈니스 로직

ConcreteCreator extends Creator
  └── createProduct(): ConcreteProduct
```

### 2.3. 구현

```java
// Product
public interface Notification {
    void send(String message);
}

// ConcreteProducts
public class EmailNotification implements Notification {
    public void send(String message) { /* SMTP */ }
}
public class SmsNotification implements Notification {
    public void send(String message) { /* SMS API */ }
}

// Creator
public abstract class NotificationService {
    protected abstract Notification createNotification();   // 팩토리 메서드

    public void notify(String message) {
        Notification n = createNotification();
        n.send(message);
    }
}

// ConcreteCreators
public class EmailNotificationService extends NotificationService {
    @Override
    protected Notification createNotification() {
        return new EmailNotification();
    }
}
public class SmsNotificationService extends NotificationService {
    @Override
    protected Notification createNotification() {
        return new SmsNotification();
    }
}
```

### 2.4. 장단점

| | |
| :--- | :--- |
| 장점 | 생성 로직과 비즈니스 로직 분리(SRP), 새 타입 추가 시 기존 코드 수정 불필요(OCP) |
| 단점 | 제품 유형마다 Creator 서브클래스가 필요 → 클래스 수 증가 |

### 2.5. 실무

- `Calendar.getInstance()`, `NumberFormat.getInstance()`
- Spring `FactoryBean<T>`: `getObject()`가 팩토리 메서드
- `LoggerFactory.getLogger()` (SLF4J)

---

## 3. Abstract Factory

### 3.1. 핵심 아이디어

연관된 객체들의 패밀리를 일관되게 생성하는 인터페이스를 제공한다. 구체 팩토리를 교체하면 전체 제품군이 교체된다.

### 3.2. 구조

```
AbstractFactory
  ├── createButton(): Button
  └── createCheckbox(): Checkbox

WindowsFactory implements AbstractFactory   → WindowsButton, WindowsCheckbox
MacFactory    implements AbstractFactory    → MacButton,     MacCheckbox
```

### 3.3. 구현

```java
public interface UIFactory {
    Button createButton();
    Dialog createDialog();
}

public class WebUIFactory implements UIFactory {
    public Button createButton()  { return new HtmlButton(); }
    public Dialog createDialog()  { return new HtmlDialog(); }
}

public class DesktopUIFactory implements UIFactory {
    public Button createButton()  { return new SwingButton(); }
    public Dialog createDialog()  { return new SwingDialog(); }
}

// 클라이언트는 UIFactory 인터페이스만 알면 됨
public class Application {
    private final UIFactory factory;

    public Application(UIFactory factory) { this.factory = factory; }

    public void render() {
        Button btn = factory.createButton();
        Dialog dlg = factory.createDialog();
        btn.render();
        dlg.render();
    }
}
```

### 3.4. 장단점

| | |
| :--- | :--- |
| 장점 | 제품 패밀리 간 일관성 보장, 구체 클래스와 클라이언트 분리 |
| 단점 | 새 제품 종류 추가 시 모든 팩토리 클래스를 수정해야 함 |

### 3.5. 실무

- JDBC: `DriverManager`가 DB 벤더별로 `Connection`, `Statement`, `ResultSet`을 일관되게 생성
- Spring `AbstractApplicationContext`: `BeanFactory`의 추상 팩토리 역할

---

## 4. Builder

### 4.1. 핵심 아이디어

복잡한 객체를 단계적으로 조립한다. 동일한 조립 과정으로 다양한 표현의 객체를 생성할 수 있다. 생성자 인자가 많을 때 가독성과 불변성을 모두 확보한다.

### 4.2. 구현

```java
public class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;

    private HttpRequest(Builder builder) {
        this.method    = builder.method;
        this.url       = builder.url;
        this.headers   = Collections.unmodifiableMap(builder.headers);
        this.body      = builder.body;
        this.timeoutMs = builder.timeoutMs;
    }

    public static class Builder {
        private final String method;
        private final String url;
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeoutMs = 3000;

        public Builder(String method, String url) {
            this.method = method;
            this.url    = url;
        }

        public Builder header(String key, String value) {
            headers.put(key, value); return this;
        }
        public Builder body(String body)       { this.body = body;           return this; }
        public Builder timeout(int ms)         { this.timeoutMs = ms;        return this; }
        public HttpRequest build()             { return new HttpRequest(this); }
    }
}

// 사용
HttpRequest req = new HttpRequest.Builder("POST", "https://api.example.com/orders")
    .header("Content-Type", "application/json")
    .body("{\"item\":\"book\"}")
    .timeout(5000)
    .build();
```

### 4.3. 장단점

| | |
| :--- | :--- |
| 장점 | 선택적 매개변수 처리, 불변 객체 생성, 단계별 검증 가능, 가독성 |
| 단점 | 클래스마다 Builder 내부 클래스가 추가됨, 단순 객체에는 과도한 구조 |

### 4.4. 실무

- Lombok `@Builder`: 어노테이션으로 Builder 자동 생성
- `StringBuilder`, `java.net.http.HttpClient.newBuilder()`
- Spring `MockMvcRequestBuilders`, `UriComponentsBuilder`
- JPA Criteria API `CriteriaBuilder`

---

## 5. Prototype

### 5.1. 핵심 아이디어

기존 객체(프로토타입)를 복사해 새 객체를 생성한다. 초기화 비용이 크거나 초기 상태가 복잡한 객체를 반복 생성할 때 유용하다.

### 5.2. 구현

```java
public abstract class Shape implements Cloneable {
    protected String color;

    public abstract double area();

    @Override
    public Shape clone() {
        try {
            return (Shape) super.clone();   // 얕은 복사
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius, String color) {
        this.radius = radius;
        this.color  = color;
    }

    @Override
    public double area() { return Math.PI * radius * radius; }
}

// 사용
Circle original = new Circle(5.0, "red");
Circle copy     = (Circle) original.clone();
copy.color = "blue";   // 복사본만 변경
```

**깊은 복사가 필요한 경우**: 참조 타입 필드는 `clone()` 내부에서 직접 복사해야 한다.

```java
@Override
public Shape clone() {
    Shape cloned = (Shape) super.clone();
    cloned.metadata = new HashMap<>(this.metadata);  // 깊은 복사
    return cloned;
}
```

또는 직렬화를 활용한다:

```java
public T deepCopy(T obj) {
    ByteArrayOutputStream bos = new ByteArrayOutputStream();
    new ObjectOutputStream(bos).writeObject(obj);
    return (T) new ObjectInputStream(
        new ByteArrayInputStream(bos.toByteArray())).readObject();
}
```

### 5.3. 장단점

| | |
| :--- | :--- |
| 장점 | 비싼 초기화 비용 회피, 복잡한 상태의 객체를 간단히 복제 |
| 단점 | 깊은/얕은 복사 구분이 까다로움, 순환 참조 처리 복잡 |

### 5.4. 실무

- Spring `@Scope("prototype")`: 요청마다 새 인스턴스 생성
- `ArrayList`, `HashMap`의 복사 생성자: `new ArrayList<>(original)`
- 게임 개발에서 유닛·적 캐릭터 초기 상태 복제

---

## Sources

- *Design Patterns: Elements of Reusable Object-Oriented Software* — Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994, Addison-Wesley)
- [Refactoring.Guru — Creational Patterns](https://refactoring.guru/design-patterns/creational-patterns)
- [SourceMaking — Creational Patterns](https://sourcemaking.com/design_patterns/creational_patterns)

---

## Related pages

- [[design-patterns]]
- [[design-patterns-structural]]
- [[design-patterns-behavioral]]
- [[solid]]
