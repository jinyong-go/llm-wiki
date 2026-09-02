---
title: GoF 구조 패턴
updated: 2026-07-08 10:32:15
tags:
  - programming
  - oop
  - design-patterns
  - gof
  - structural
---

구조 패턴은 클래스·객체를 조합해 더 큰 구조를 형성한다. → [[design-patterns]]

---

## 1. Adapter

### 1.1. 핵심 아이디어

호환되지 않는 인터페이스를 가진 클래스들이 함께 동작하도록 변환 레이어를 제공한다. 기존 코드를 수정하지 않고 연결한다.

### 1.2. 구현 (Object Adapter)

```java
// 클라이언트가 기대하는 인터페이스
public interface JsonParser {
    Map<String, Object> parse(String json);
}

// 기존 라이브러리 (변경 불가)
public class LegacyXmlParser {
    public Document parseXml(String xml) { /* ... */ return doc; }
}

// Adapter: LegacyXmlParser를 JsonParser 인터페이스로 감쌈
public class XmlToJsonAdapter implements JsonParser {
    private final LegacyXmlParser xmlParser;

    public XmlToJsonAdapter(LegacyXmlParser xmlParser) {
        this.xmlParser = xmlParser;
    }

    @Override
    public Map<String, Object> parse(String data) {
        // data를 XML로 변환 후 xmlParser 호출 → Map으로 변환
        Document doc = xmlParser.parseXml(convertToXml(data));
        return convertToMap(doc);
    }
}
```

### 1.3. 장단점

| | |
| :--- | :--- |
| 장점 | 기존 코드 수정 없이 인터페이스 불일치 해결(OCP), 단일 책임 분리 |
| 단점 | 어댑터 클래스 추가로 복잡성 증가, 모든 요청이 위임을 거침 |

### 1.4. 실무

- `Arrays.asList()`: 배열 → `List` 인터페이스 어댑터
- `InputStreamReader(InputStream)`: 바이트 스트림 → 문자 스트림 어댑터
- Spring `HandlerAdapter`: 다양한 핸들러 타입을 `DispatcherServlet`이 일관되게 호출하도록 적응

---

## 2. Bridge

### 2.1. 핵심 아이디어

추상화(Abstraction)와 구현(Implementation)을 독립적인 계층으로 분리한다. 두 계층이 각각 독립적으로 확장 가능하다. 상속 대신 구성을 사용한다.

### 2.2. 구조

```
Abstraction ──────────► Implementor (인터페이스)
  └── RefinedAbstraction    ├── ConcreteImplementorA
                            └── ConcreteImplementorB
```

### 2.3. 구현

```java
// Implementor: 플랫폼별 렌더링
public interface Renderer {
    void renderCircle(double x, double y, double radius);
}
public class VectorRenderer implements Renderer {
    public void renderCircle(double x, double y, double radius) { /* SVG */ }
}
public class RasterRenderer implements Renderer {
    public void renderCircle(double x, double y, double radius) { /* Pixel */ }
}

// Abstraction: 도형 계층
public abstract class Shape {
    protected final Renderer renderer;   // 구현을 보유

    protected Shape(Renderer renderer) { this.renderer = renderer; }

    public abstract void draw();
    public abstract void resize(double factor);
}

// RefinedAbstraction
public class Circle extends Shape {
    private double x, y, radius;

    public Circle(double x, double y, double radius, Renderer renderer) {
        super(renderer);
        this.x = x; this.y = y; this.radius = radius;
    }

    @Override
    public void draw() { renderer.renderCircle(x, y, radius); }

    @Override
    public void resize(double factor) { radius *= factor; }
}

// 사용
Shape c = new Circle(0, 0, 5, new VectorRenderer());
c.draw();   // SVG로 렌더링
c = new Circle(0, 0, 5, new RasterRenderer());
c.draw();   // 픽셀로 렌더링
```

도형 × 렌더러 조합이 N×M개라도 클래스는 N+M개면 충분하다. 상속으로 구현하면 N×M개가 필요하다.

### 2.4. 장단점

| | |
| :--- | :--- |
| 장점 | 추상화·구현 독립 확장, 클래스 폭발 방지, 런타임 구현 교체 가능 |
| 단점 | 추상화 레이어가 늘어나 코드 추적이 어려워질 수 있음 |

### 2.5. 실무

- JDBC: `java.sql.Driver`(구현)와 `Connection`/`Statement`(추상화) 분리
- 로깅: SLF4J(추상화) + Logback/Log4j2(구현)

---

## 3. Composite

### 3.1. 핵심 아이디어

개별 객체(Leaf)와 복합 객체(Composite)를 동일한 인터페이스(Component)로 다룬다. 트리 구조로 구성되며, 클라이언트는 단일 객체와 복합 객체를 구분하지 않는다.

### 3.2. 구현

```java
// Component
public interface FileSystemItem {
    String getName();
    long getSize();
    void print(String indent);
}

// Leaf
public class File implements FileSystemItem {
    private final String name;
    private final long size;

    public File(String name, long size) { this.name = name; this.size = size; }

    @Override public String getName() { return name; }
    @Override public long getSize()   { return size; }
    @Override public void print(String indent) {
        System.out.println(indent + name + " (" + size + "B)");
    }
}

// Composite
public class Directory implements FileSystemItem {
    private final String name;
    private final List<FileSystemItem> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public void add(FileSystemItem item)    { children.add(item); }
    public void remove(FileSystemItem item) { children.remove(item); }

    @Override public String getName() { return name; }
    @Override public long getSize()   { return children.stream().mapToLong(FileSystemItem::getSize).sum(); }
    @Override public void print(String indent) {
        System.out.println(indent + "[" + name + "]");
        children.forEach(c -> c.print(indent + "  "));
    }
}

// 사용
Directory root = new Directory("root");
root.add(new File("readme.txt", 1024));
Directory src = new Directory("src");
src.add(new File("Main.java", 2048));
root.add(src);
root.print("");
System.out.println("Total: " + root.getSize());
```

### 3.3. 장단점

| | |
| :--- | :--- |
| 장점 | 트리 구조를 균일하게 처리, 클라이언트 코드 단순화, 새 컴포넌트 추가 용이 |
| 단점 | 공통 인터페이스 설계가 어려울 수 있음, Leaf에 불필요한 Composite 메서드 노출 가능 |

### 3.4. 실무

- Java Swing: `JComponent` 계층
- HTML DOM: `Element` (Composite) + `TextNode` (Leaf)
- Spring Security: `FilterSecurityInterceptor` 체인

---

## 4. Decorator

### 4.1. 핵심 아이디어

객체를 래퍼로 감싸 기능을 동적으로 추가한다. 상속보다 유연하며, 런타임에 여러 데코레이터를 중첩할 수 있다.

### 4.2. 구조

```
Component (인터페이스)
  ├── ConcreteComponent        ← 실제 구현
  └── BaseDecorator            ← Component를 보유하는 추상 래퍼
        └── ConcreteDecorator  ← 기능 추가
```

### 4.3. 구현

```java
public interface DataSource {
    void writeData(String data);
    String readData();
}

// ConcreteComponent
public class FileDataSource implements DataSource {
    private final String filename;
    public FileDataSource(String filename) { this.filename = filename; }

    @Override public void writeData(String data) { /* 파일 쓰기 */ }
    @Override public String readData()            { /* 파일 읽기 */ return ""; }
}

// BaseDecorator
public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrappee;
    protected DataSourceDecorator(DataSource source) { this.wrappee = source; }

    @Override public void writeData(String data) { wrappee.writeData(data); }
    @Override public String readData()            { return wrappee.readData(); }
}

// ConcreteDecorators
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) { super(source); }

    @Override public void writeData(String data) { super.writeData(encrypt(data)); }
    @Override public String readData()            { return decrypt(super.readData()); }

    private String encrypt(String data) { return Base64.getEncoder().encodeToString(data.getBytes()); }
    private String decrypt(String data) { return new String(Base64.getDecoder().decode(data)); }
}

public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource source) { super(source); }

    @Override public void writeData(String data) { super.writeData(compress(data)); }
    @Override public String readData()            { return decompress(super.readData()); }

    private String compress(String data)   { /* gzip */ return data; }
    private String decompress(String data) { /* gzip */ return data; }
}

// 중첩 사용
DataSource source = new CompressionDecorator(
                        new EncryptionDecorator(
                            new FileDataSource("data.txt")));
source.writeData("Hello World");   // 암호화 → 압축 → 파일 쓰기
```

### 4.4. 장단점

| | |
| :--- | :--- |
| 장점 | 런타임 기능 조합, 상속 없이 확장(OCP), 단일 기능 데코레이터를 자유롭게 조합 |
| 단점 | 데코레이터가 많으면 디버깅 어려움, 특정 데코레이터 제거 복잡 |

### 4.5. 실무

- Java I/O: `new BufferedReader(new InputStreamReader(new FileInputStream(...)))`
- Spring: `HttpServletRequestWrapper`, `HttpServletResponseWrapper`
- Spring Security 필터 체인

---

## 5. Facade

### 5.1. 핵심 아이디어

복잡한 서브시스템에 대한 단순화된 인터페이스를 제공한다. 서브시스템 내부 구조를 숨기고, 클라이언트가 알아야 할 것을 줄인다.

### 5.2. 구현

```java
// 복잡한 서브시스템 클래스들
class VideoDecoder     { VideoFile decode(VideoFile file) { ... } }
class AudioMixer       { void mix(VideoFile file) { ... } }
class BitrateReader    { int[] read(VideoFile file) { ... } }
class CodecFactory     { Codec extract(VideoFile file) { ... } }

// Facade
public class VideoConverter {
    private final VideoDecoder    decoder    = new VideoDecoder();
    private final AudioMixer      mixer      = new AudioMixer();
    private final BitrateReader   bitrate    = new BitrateReader();
    private final CodecFactory    codecFactory = new CodecFactory();

    public File convert(String filename, String format) {
        VideoFile file   = new VideoFile(filename);
        Codec sourceCodec = codecFactory.extract(file);
        VideoFile buffer  = decoder.decode(file);
        mixer.mix(buffer);
        // ...
        return new File(filename + "." + format);
    }
}

// 클라이언트는 단 하나의 메서드만 호출
File mp4 = new VideoConverter().convert("movie.ogg", "mp4");
```

### 5.3. 장단점

| | |
| :--- | :--- |
| 장점 | 클라이언트 코드 단순화, 서브시스템과 클라이언트 결합도 감소, 계층화된 아키텍처 지원 |
| 단점 | God Object가 될 위험, 내부 서브시스템 직접 접근이 필요한 경우 제약 |

### 5.4. 실무

- `JdbcTemplate`: JDBC의 Connection·PreparedStatement·ResultSet 관리를 단일 인터페이스로 추상화
- SLF4J: 다양한 로깅 구현체에 대한 Facade
- Spring `MailSender`: JavaMail 복잡성을 숨김

---

## 6. Flyweight

### 6.1. 핵심 아이디어

대량의 유사 객체가 존재할 때, 공유 가능한 상태(Intrinsic State)를 공유해 메모리를 절감한다. 객체별로 다른 상태(Extrinsic State)는 외부에서 주입한다.

- **Intrinsic State**: 객체 내부에 저장, 공유 가능 (변경 불가)
- **Extrinsic State**: 컨텍스트에 따라 달라짐, 외부에서 전달

### 6.2. 구현

```java
// Flyweight: Intrinsic State만 보유
public final class CharStyle {
    private final String font;
    private final int size;
    private final String color;

    CharStyle(String font, int size, String color) {
        this.font = font; this.size = size; this.color = color;
    }

    public void render(char ch, int x, int y) {
        // x, y는 Extrinsic State — 외부에서 전달
        System.out.printf("'%c' at (%d,%d) font=%s size=%d color=%s%n",
            ch, x, y, font, size, color);
    }
}

// FlyweightFactory: 동일한 스타일 재사용
public class CharStyleFactory {
    private static final Map<String, CharStyle> cache = new HashMap<>();

    public static CharStyle getStyle(String font, int size, String color) {
        String key = font + ":" + size + ":" + color;
        return cache.computeIfAbsent(key, k -> new CharStyle(font, size, color));
    }
}

// 사용: 100만 글자를 렌더링해도 CharStyle 인스턴스는 스타일 수만큼만 생성
for (int i = 0; i < 1_000_000; i++) {
    CharStyle style = CharStyleFactory.getStyle("Arial", 12, "black");
    style.render(text[i], xPos[i], yPos[i]);
}
```

### 6.3. 장단점

| | |
| :--- | :--- |
| 장점 | 대량 유사 객체 생성 시 메모리 절감 |
| 단점 | Intrinsic/Extrinsic 상태 분리 복잡, 캐시 관리 오버헤드, 멀티스레드 캐시 접근 주의 |

### 6.4. 실무

- `Integer.valueOf(-128 ~ 127)`: JVM 캐시
- `String` intern pool
- Java 게임 엔진에서 Sprite·Tile 공유

---

## 7. Proxy

### 7.1. 핵심 아이디어

원본 객체에 대한 대리(Surrogate) 객체를 제공한다. 클라이언트는 프록시를 원본과 동일하게 사용하며, 프록시는 원본 접근 전후에 추가 작업을 수행한다.

### 7.2. 프록시 종류

| 종류 | 목적 |
| :--- | :--- |
| Virtual Proxy | 무거운 객체의 지연 초기화 |
| Protection Proxy | 접근 권한 제어 |
| Remote Proxy | 원격 객체 로컬 대리 (RMI) |
| Caching Proxy | 결과 캐싱 |
| Logging Proxy | 호출 기록 |

### 7.3. 구현 (JDK Dynamic Proxy)

```java
public interface OrderService {
    Order createOrder(OrderRequest request);
    Order getOrder(Long id);
}

// InvocationHandler로 횡단 관심사 주입
public class LoggingProxy implements InvocationHandler {
    private final Object target;

    public LoggingProxy(Object target) { this.target = target; }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return method.invoke(target, args);
        } finally {
            System.out.printf("[LOG] %s executed in %dms%n",
                method.getName(), System.currentTimeMillis() - start);
        }
    }
}

// 프록시 생성
OrderService service = (OrderService) Proxy.newProxyInstance(
    OrderService.class.getClassLoader(),
    new Class[]{OrderService.class},
    new LoggingProxy(new OrderServiceImpl())
);
service.createOrder(request);   // 로그 자동 출력
```

### 7.4. 장단점

| | |
| :--- | :--- |
| 장점 | 원본 코드 수정 없이 횡단 관심사 처리(로깅·보안·캐시), 지연 초기화, 원격 투명성 |
| 단점 | 응답 지연 증가, 클래스 수 증가, JDK Dynamic Proxy는 인터페이스 기반만 가능 |

### 7.5. 실무

- Spring AOP: CGLIB(클래스 기반) 또는 JDK Dynamic Proxy(인터페이스 기반)로 `@Transactional`, `@Cacheable` 등을 구현 (→ [[aop]])
- JPA `LazyLoading`: `@ManyToOne(fetch = LAZY)` 연관 엔티티가 Proxy로 반환됨

---

## Sources

- *Design Patterns: Elements of Reusable Object-Oriented Software* — Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994, Addison-Wesley)
- [Refactoring.Guru — Structural Patterns](https://refactoring.guru/design-patterns/structural-patterns)
- [SourceMaking — Structural Patterns](https://sourcemaking.com/design_patterns/structural_patterns)

---

## Related pages

- [[design-patterns]]
- [[design-patterns-creational]]
- [[design-patterns-behavioral]]
- [[solid]]
- [[aop]]
- [[logging-frameworks]]
