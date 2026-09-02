---
title: GoF 행동 패턴
updated: 2026-07-08 10:32:15
tags:
  - programming
  - oop
  - design-patterns
  - gof
  - behavioral
---

행동 패턴은 객체 간 상호작용과 책임 분배를 정의한다. → [[design-patterns]]

---

## 1. Chain of Responsibility

### 1.1. 핵심 아이디어

요청을 처리할 수 있는 객체들을 체인으로 연결한다. 각 핸들러는 요청을 처리하거나 다음 핸들러로 전달한다. 송신자와 수신자를 분리한다.

### 1.2. 구현

```java
public abstract class RequestHandler {
    private RequestHandler next;

    public RequestHandler setNext(RequestHandler next) {
        this.next = next;
        return next;   // 체이닝을 위해 next 반환
    }

    public void handle(HttpRequest request) {
        if (next != null) next.handle(request);
    }
}

public class AuthHandler extends RequestHandler {
    @Override
    public void handle(HttpRequest request) {
        if (!request.hasAuthToken()) {
            throw new UnauthorizedException();
        }
        super.handle(request);  // 다음 핸들러로 전달
    }
}

public class RateLimitHandler extends RequestHandler {
    @Override
    public void handle(HttpRequest request) {
        if (isRateLimitExceeded(request.getIp())) {
            throw new TooManyRequestsException();
        }
        super.handle(request);
    }
}

public class LoggingHandler extends RequestHandler {
    @Override
    public void handle(HttpRequest request) {
        log.info("Request: {}", request);
        super.handle(request);
    }
}

// 체인 조립
RequestHandler chain = new LoggingHandler();
chain.setNext(new AuthHandler())
     .setNext(new RateLimitHandler());

chain.handle(request);
```

### 1.3. 장단점

| | |
| :--- | :--- |
| 장점 | 처리 순서·구성 런타임 변경 가능, 송신자·수신자 결합 제거, 단일 책임 분리 |
| 단점 | 요청이 처리되지 않고 체인 끝까지 전달될 수 있음, 디버깅 시 흐름 추적 어려움 |

### 1.4. 실무

- Java Servlet Filter Chain: `FilterChain.doFilter()`
- Spring Security: `SecurityFilterChain`
- Spring MVC `HandlerInterceptor`

---

## 2. Command

### 2.1. 핵심 아이디어

요청을 객체로 캡슐화한다. 요청의 매개변수화, 큐잉, 로깅, 실행 취소(Undo)를 지원한다.

### 2.2. 구현

```java
public interface Command {
    void execute();
    void undo();
}

// Receiver
public class TextEditor {
    private StringBuilder text = new StringBuilder();

    public void insertText(String str, int pos) {
        text.insert(pos, str);
    }
    public void deleteText(int from, int to) {
        text.delete(from, to);
    }
    public String getText() { return text.toString(); }
}

// ConcreteCommand
public class InsertCommand implements Command {
    private final TextEditor editor;
    private final String text;
    private final int position;

    public InsertCommand(TextEditor editor, String text, int position) {
        this.editor   = editor;
        this.text     = text;
        this.position = position;
    }

    @Override public void execute() { editor.insertText(text, position); }
    @Override public void undo()    { editor.deleteText(position, position + text.length()); }
}

// Invoker (실행 이력 관리)
public class CommandHistory {
    private final Deque<Command> history = new ArrayDeque<>();

    public void execute(Command command) {
        command.execute();
        history.push(command);
    }

    public void undo() {
        if (!history.isEmpty()) history.pop().undo();
    }
}

// 사용
CommandHistory history = new CommandHistory();
TextEditor editor = new TextEditor();
history.execute(new InsertCommand(editor, "Hello", 0));
history.execute(new InsertCommand(editor, " World", 5));
System.out.println(editor.getText());   // "Hello World"
history.undo();
System.out.println(editor.getText());   // "Hello"
```

### 2.3. 장단점

|     |                                          |
| :-- | :--------------------------------------- |
| 장점  | 실행 취소/재실행, 요청 큐잉 및 지연 실행, 요청 로깅, 트랜잭션 지원 |
| 단점  | 커맨드 클래스 수 증가                             |

### 2.4. 실무

- `java.lang.Runnable`: 실행을 캡슐화한 Command
- Spring `@Async`의 작업 큐잉
- 게임 입력 처리: 각 입력을 Command 객체로 저장해 리플레이 구현

---

## 3. Iterator

### 3.1. 핵심 아이디어

컬렉션의 내부 표현을 노출하지 않고 순차적으로 접근하는 방법을 제공한다. 컬렉션 구조와 순회 알고리즘을 분리한다.

### 3.2. 구현

```java
// Java의 Iterable + Iterator가 이 패턴의 표준 구현
public class NumberRange implements Iterable<Integer> {
    private final int start;
    private final int end;
    private final int step;

    public NumberRange(int start, int end, int step) {
        this.start = start; this.end = end; this.step = step;
    }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int current = start;

            @Override public boolean hasNext() { return current <= end; }
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                int val = current;
                current += step;
                return val;
            }
        };
    }
}

// 사용 — 내부 구현 노출 없이 순회
for (int n : new NumberRange(0, 10, 2)) {
    System.out.print(n + " ");   // 0 2 4 6 8 10
}
```

### 3.3. 장단점

| | |
| :--- | :--- |
| 장점 | 순회 로직과 컬렉션 구현 분리(SRP), 여러 순회 방식을 동시에 지원 |
| 단점 | 단순 컬렉션에는 과도한 구조 |

### 3.4. 실무

- `java.util.Iterator`, `java.util.ListIterator`
- enhanced for loop은 `Iterable`이 기반
- JPA `ScrollableResults`: 대용량 쿼리 결과 커서 기반 순회

---

## 4. Mediator

### 4.1. 핵심 아이디어

객체들이 직접 참조하는 대신 중재자 객체를 통해 통신한다. 객체 간 의존성을 제거하고 통신을 중앙 집중화한다.

### 4.2. 구현

```java
public interface ChatMediator {
    void sendMessage(String message, User sender);
    void addUser(User user);
}

public class ChatRoom implements ChatMediator {
    private final List<User> users = new ArrayList<>();

    @Override
    public void addUser(User user) { users.add(user); }

    @Override
    public void sendMessage(String message, User sender) {
        users.stream()
             .filter(u -> u != sender)
             .forEach(u -> u.receive(message, sender.getName()));
    }
}

public class User {
    private final String name;
    private final ChatMediator mediator;

    public User(String name, ChatMediator mediator) {
        this.name = name; this.mediator = mediator;
    }

    public String getName() { return name; }
    public void send(String message)                  { mediator.sendMessage(message, this); }
    public void receive(String message, String from)  { System.out.println(from + " → " + name + ": " + message); }
}

// 사용
ChatMediator room = new ChatRoom();
User alice = new User("Alice", room);
User bob   = new User("Bob",   room);
room.addUser(alice);
room.addUser(bob);
alice.send("Hello!");   // Bob만 수신
```

### 4.3. 장단점

| | |
| :--- | :--- |
| 장점 | 컴포넌트 간 직접 결합 제거, 재사용성 향상, 통신 로직 중앙화 |
| 단점 | 중재자가 God Object가 될 위험 |

### 4.4. 실무

- Spring `ApplicationEventPublisher`: 이벤트 발행자와 리스너 간 Mediator
- Java AWT `ActionListener` 등록 메커니즘

---

## 5. Memento

### 5.1. 핵심 아이디어

객체의 내부 상태를 캡슐화하여 외부에 저장하고, 이후 그 상태로 복원한다. 캡슐화를 위반하지 않으면서 상태를 스냅샷으로 관리한다.

### 5.2. 구현

```java
// Memento: 상태 스냅샷 (불변)
public record EditorState(String content, int cursorPos) { }

// Originator: 상태를 생성·복원
public class Editor {
    private String content   = "";
    private int    cursorPos = 0;

    public void type(String text) {
        content = content.substring(0, cursorPos) + text + content.substring(cursorPos);
        cursorPos += text.length();
    }

    public EditorState save()                  { return new EditorState(content, cursorPos); }
    public void restore(EditorState state)     { content = state.content(); cursorPos = state.cursorPos(); }

    public String getContent() { return content; }
}

// Caretaker: Memento 관리
public class History {
    private final Deque<EditorState> states = new ArrayDeque<>();

    public void push(EditorState state) { states.push(state); }
    public EditorState pop()            { return states.isEmpty() ? null : states.pop(); }
}

// 사용
Editor editor   = new Editor();
History history = new History();

editor.type("Hello");
history.push(editor.save());

editor.type(" World");
history.push(editor.save());

editor.type("!!!");
System.out.println(editor.getContent());    // "Hello World!!!"

editor.restore(history.pop());
System.out.println(editor.getContent());    // "Hello World"
```

### 5.3. 장단점

| | |
| :--- | :--- |
| 장점 | 캡슐화 유지하며 상태 복원, 실행 취소 구현 용이 |
| 단점 | 상태 스냅샷이 많으면 메모리 소비 큼, 깊은 복사 필요 시 복잡 |

### 5.4. 실무

- 텍스트 에디터 Undo/Redo
- 게임 세이브/로드
- 데이터베이스 트랜잭션의 롤백 포인트

---

## 6. Observer

### 6.1. 핵심 아이디어

객체(Subject)의 상태가 바뀌면 의존하는 모든 객체(Observer)에 자동으로 알린다. 1:N 의존관계를 느슨하게 정의한다.

### 6.2. 구현

```java
public interface EventListener<T> {
    void onEvent(T event);
}

public class EventBus<T> {
    private final List<EventListener<T>> listeners = new CopyOnWriteArrayList<>();

    public void subscribe(EventListener<T> listener)   { listeners.add(listener); }
    public void unsubscribe(EventListener<T> listener) { listeners.remove(listener); }

    public void publish(T event) {
        listeners.forEach(l -> l.onEvent(event));
    }
}

// 사용
EventBus<OrderCreatedEvent> bus = new EventBus<>();
bus.subscribe(event -> emailService.sendConfirmation(event.getOrder()));
bus.subscribe(event -> inventoryService.reserve(event.getOrder()));

bus.publish(new OrderCreatedEvent(order));
```

### 6.3. 장단점

| | |
| :--- | :--- |
| 장점 | 느슨한 결합, 런타임 구독자 추가/제거, 이벤트 기반 아키텍처 |
| 단점 | 구독자가 많으면 알림 순서 예측 어려움, 메모리 누수(구독 해제 누락), 순환 이벤트 위험 |

### 6.4. 실무

- Spring `@EventListener` / `ApplicationEventPublisher`
- Java `java.util.Observer` (deprecated, Java 9+)
- RxJava / Project Reactor: `Observable`, `Flux`의 기반 개념

---

## 7. State

### 7.1. 핵심 아이디어

객체의 내부 상태가 바뀌면 행동이 달라진다. 상태를 클래스로 분리해 상태별 행동을 캡슐화하고, `if`/`switch` 분기를 제거한다.

### 7.2. 구현

```java
public interface OrderState {
    void confirm(Order order);
    void ship(Order order);
    void deliver(Order order);
    void cancel(Order order);
}

public class PendingState implements OrderState {
    @Override public void confirm(Order order) { order.setState(new ConfirmedState()); }
    @Override public void ship(Order order)    { throw new IllegalStateException("결제 전 배송 불가"); }
    @Override public void deliver(Order order) { throw new IllegalStateException(); }
    @Override public void cancel(Order order)  { order.setState(new CancelledState()); }
}

public class ConfirmedState implements OrderState {
    @Override public void confirm(Order order) { throw new IllegalStateException("이미 확정됨"); }
    @Override public void ship(Order order)    { order.setState(new ShippedState()); }
    @Override public void deliver(Order order) { throw new IllegalStateException(); }
    @Override public void cancel(Order order)  { order.setState(new CancelledState()); }
}

public class Order {
    private OrderState state = new PendingState();

    public void setState(OrderState state) { this.state = state; }

    public void confirm()  { state.confirm(this); }
    public void ship()     { state.ship(this); }
    public void deliver()  { state.deliver(this); }
    public void cancel()   { state.cancel(this); }
}
```

### 7.3. 장단점

| | |
| :--- | :--- |
| 장점 | 상태별 로직 분리(SRP), 새 상태 추가 시 기존 코드 수정 최소화(OCP), 조건 분기 제거 |
| 단점 | 상태 클래스 수 증가, 간단한 상태 머신에는 과도한 구조 |

### 7.4. 실무

- 주문·결제·배송 상태 머신
- TCP 연결 상태 (LISTEN → SYN_RCVD → ESTABLISHED → ...)
- 자판기 구현

---

## 8. Strategy

### 8.1. 핵심 아이디어

알고리즘을 클래스로 캡슐화해 런타임에 교체 가능하게 한다. 알고리즘을 사용하는 코드와 구현을 분리한다.

### 8.2. 구현

```java
@FunctionalInterface
public interface SortStrategy {
    void sort(int[] data);
}

public class Sorter {
    private SortStrategy strategy;

    public Sorter(SortStrategy strategy) { this.strategy = strategy; }
    public void setStrategy(SortStrategy strategy) { this.strategy = strategy; }

    public void sort(int[] data) { strategy.sort(data); }
}

// 사용 — 람다로 전략 주입
Sorter sorter = new Sorter(Arrays::sort);              // 기본 정렬
sorter.sort(data);

sorter.setStrategy(data2 -> bubbleSort(data2));        // 전략 교체
sorter.sort(data);
```

실무에서는 `Comparator`가 Strategy의 대표적인 활용이다:

```java
List<Order> orders = ...;
// 금액 기준
orders.sort(Comparator.comparing(Order::getAmount));
// 날짜 역순
orders.sort(Comparator.comparing(Order::getCreatedAt).reversed());
```

### 8.3. 장단점

| | |
| :--- | :--- |
| 장점 | 알고리즘 교체 용이, 조건 분기 제거, 각 전략 독립 테스트 가능 |
| 단점 | 전략 클래스 수 증가 (Java 8+ 람다로 완화) |

### 8.4. 실무

- `java.util.Comparator`: 정렬 전략
- Spring Security `AuthenticationStrategy`
- [[solid]]의 OCP 예시 `DiscountPolicy`가 Strategy 패턴

---

## 9. Template Method

### 9.1. 핵심 아이디어

알고리즘의 골격을 상위 클래스에 정의하고, 세부 단계를 서브클래스에서 구현한다. 알고리즘 구조는 고정하되 특정 단계만 변경을 허용한다.

### 9.2. 구현

```java
public abstract class DataExporter {
    // Template Method: 알고리즘 골격 (final로 재정의 금지)
    public final void export(String destination) {
        List<Object> data = fetchData();        // (1) 데이터 로드
        List<Object> formatted = format(data);  // (2) 포맷 변환 (서브클래스)
        validate(formatted);                     // (3) 검증 (훅 메서드)
        write(formatted, destination);           // (4) 저장 (서브클래스)
    }

    protected abstract List<Object> fetchData();
    protected abstract List<Object> format(List<Object> data);
    protected abstract void write(List<Object> data, String dest);

    // Hook Method: 서브클래스가 선택적으로 오버라이드
    protected void validate(List<Object> data) { }
}

public class CsvExporter extends DataExporter {
    @Override
    protected List<Object> fetchData() { /* DB 조회 */ return List.of(); }

    @Override
    protected List<Object> format(List<Object> data) {
        /* CSV 변환 */ return data;
    }

    @Override
    protected void write(List<Object> data, String dest) {
        /* CSV 파일 쓰기 */
    }

    @Override
    protected void validate(List<Object> data) {
        if (data.isEmpty()) throw new IllegalStateException("데이터 없음");
    }
}
```

### 9.3. 장단점

| | |
| :--- | :--- |
| 장점 | 공통 알고리즘 중복 제거, 훅 메서드로 선택적 확장점 제공 |
| 단점 | 상속 강제 → 유연성 제한, 서브클래스가 많아지면 계층 복잡, 리스코프 치환 원칙 위반 주의 |

### 9.4. 실무

- Spring `JdbcTemplate.query()`: SQL 실행 골격 + `RowMapper` 콜백
- Spring `AbstractApplicationContext.refresh()`: 컨텍스트 초기화 골격
- `java.util.AbstractList`: `get()`·`size()`만 구현하면 나머지 동작

---

## 10. Visitor

### 10.1. 핵심 아이디어

객체 구조를 변경하지 않고 새로운 연산을 추가한다. 연산을 별도의 Visitor 클래스로 분리해 OCP를 달성한다. Double Dispatch를 활용해 실제 타입에 맞는 메서드를 호출한다.

### 10.2. 구현

```java
// Element 인터페이스
public interface Shape {
    void accept(ShapeVisitor visitor);
}

// ConcreteElements
public class Circle implements Shape {
    public double radius;
    public Circle(double r) { this.radius = r; }

    @Override public void accept(ShapeVisitor visitor) { visitor.visit(this); }
}

public class Rectangle implements Shape {
    public double width, height;
    public Rectangle(double w, double h) { this.width = w; this.height = h; }

    @Override public void accept(ShapeVisitor visitor) { visitor.visit(this); }
}

// Visitor 인터페이스
public interface ShapeVisitor {
    void visit(Circle circle);
    void visit(Rectangle rectangle);
}

// ConcreteVisitors — 새 연산을 추가할 때 Shape 수정 불필요
public class AreaCalculator implements ShapeVisitor {
    private double totalArea = 0;

    @Override public void visit(Circle c)    { totalArea += Math.PI * c.radius * c.radius; }
    @Override public void visit(Rectangle r) { totalArea += r.width * r.height; }

    public double getTotal() { return totalArea; }
}

public class SvgExporter implements ShapeVisitor {
    @Override public void visit(Circle c)    { System.out.printf("<circle r='%.1f'/>%n", c.radius); }
    @Override public void visit(Rectangle r) { System.out.printf("<rect w='%.1f' h='%.1f'/>%n", r.width, r.height); }
}

// 사용
List<Shape> shapes = List.of(new Circle(5), new Rectangle(3, 4));
AreaCalculator calc = new AreaCalculator();
shapes.forEach(s -> s.accept(calc));
System.out.println("Total area: " + calc.getTotal());

SvgExporter svg = new SvgExporter();
shapes.forEach(s -> s.accept(svg));
```

### 10.3. 장단점

| | |
| :--- | :--- |
| 장점 | 새 연산 추가 시 Element 수정 불필요(OCP), 관련 연산 Visitor로 응집 |
| 단점 | 새 Element 추가 시 모든 Visitor를 수정해야 함, 캡슐화 약화 (internal state 노출) |

### 10.4. 실무

- `javax.lang.model.element.ElementVisitor`: 어노테이션 프로세서의 AST 순회
- ASM / Javassist 바이트코드 조작
- 컴파일러 AST 방문 (코드 분석·변환)

---

## 11. Interpreter

### 11.1. 핵심 아이디어

주어진 언어에 대한 문법을 클래스 계층으로 표현하고, 그 언어로 작성된 문장을 해석한다. 각 문법 규칙이 하나의 클래스에 대응한다.

### 11.2. 구현 — 수식 파서

```java
public interface Expression {
    int interpret(Map<String, Integer> context);
}

// Terminal Expression
public class NumberExpression implements Expression {
    private final int number;
    public NumberExpression(int n) { this.number = n; }
    @Override public int interpret(Map<String, Integer> ctx) { return number; }
}

public class VariableExpression implements Expression {
    private final String name;
    public VariableExpression(String name) { this.name = name; }
    @Override public int interpret(Map<String, Integer> ctx) {
        return ctx.getOrDefault(name, 0);
    }
}

// Non-Terminal Expressions
public class AddExpression implements Expression {
    private final Expression left, right;
    public AddExpression(Expression left, Expression right) {
        this.left = left; this.right = right;
    }
    @Override public int interpret(Map<String, Integer> ctx) {
        return left.interpret(ctx) + right.interpret(ctx);
    }
}

public class MultiplyExpression implements Expression {
    private final Expression left, right;
    public MultiplyExpression(Expression l, Expression r) { this.left = l; this.right = r; }
    @Override public int interpret(Map<String, Integer> ctx) {
        return left.interpret(ctx) * right.interpret(ctx);
    }
}

// 사용: (a + 3) * b
Map<String, Integer> ctx = Map.of("a", 5, "b", 4);
Expression expr = new MultiplyExpression(
    new AddExpression(new VariableExpression("a"), new NumberExpression(3)),
    new VariableExpression("b")
);
System.out.println(expr.interpret(ctx));  // (5 + 3) * 4 = 32
```

### 11.3. 장단점

| | |
| :--- | :--- |
| 장점 | 문법 변경이 용이, 새 규칙 추가 용이 |
| 단점 | 복잡한 문법에서 클래스 수 폭발, 성능 문제, 유지보수 어려움 → 복잡한 언어에는 ANTLR 같은 파서 제너레이터 사용 권장 |

### 11.4. 실무

- `java.util.regex.Pattern`: 정규표현식 해석기
- Spring Expression Language (SpEL)
- SQL 파서 (간단한 조건식 해석에 적용)

---

## Sources

- *Design Patterns: Elements of Reusable Object-Oriented Software* — Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994, Addison-Wesley)
- [Refactoring.Guru — Behavioral Patterns](https://refactoring.guru/design-patterns/behavioral-patterns)
- [SourceMaking — Behavioral Patterns](https://sourcemaking.com/design_patterns/behavioral_patterns)

---

## Related pages

- [[design-patterns]]
- [[design-patterns-creational]]
- [[design-patterns-structural]]
- [[solid]]
- [[aop]]
