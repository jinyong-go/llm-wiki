---
title: JUnit 5 ParameterizedTest — 매개변수화 테스트, 인자 소스·변환·집계·표시 이름
updated: 2026-08-31 14:25:48
tags:
  - java
  - junit
  - testing
  - parameterized-test
---

## 1. 개요 — 언제 쓰는가

`@ParameterizedTest`는 **하나의 테스트 메서드를 여러 인자 집합으로 반복 실행**한다. 같은 검증 로직을 입력만 바꿔 돌릴 때 `@Test`를 여러 개 복제하는 대신 사용한다.

적합한 상황:
- **경계값·동치 분할** — 0, 음수, 최대값 등 여러 입력으로 같은 단언.
- **표(table) 기반 테스트** — `입력 → 기대출력` 쌍을 데이터로 나열.
- **enum 전수 검증** — 모든 enum 상수에 대해 동작 확인.

| 어노테이션 | 용도 |
|------------|------|
| `@Test` | 단일 실행 |
| `@RepeatedTest(n)` | 같은 입력으로 n회 반복 |
| `@ParameterizedTest` | **서로 다른 입력**으로 반복 |

> `@ParameterizedTest` 메서드는 `@ArgumentsSource`(또는 그 합성 어노테이션 `@ValueSource` 등)로 **인자 소스를 최소 하나** 지정해야 한다.

---

## 2. 의존성

`junit-jupiter-params` 아티팩트가 필요하다. 보통 `junit-jupiter` 집계 의존성에 포함된다.

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>   <!-- params 포함 -->
    <scope>test</scope>
</dependency>
```
```kotlin
// Gradle
testImplementation("org.junit.jupiter:junit-jupiter-params")
```

---

## 3. 인자 소스 (Argument Sources)

### 3.1. @ValueSource — 단일 리터럴 배열

원시 타입·`String`·`Class` 리터럴 하나의 배열을 공급한다. 인자가 **1개**일 때만 쓴다.

```java
@ParameterizedTest
@ValueSource(ints = { 1, 2, 3 })
void isPositive(int n) {
    assertTrue(n > 0);
}
// strings = {...}, longs/doubles/booleans 등 지원
```

### 3.2. @NullSource / @EmptySource / @NullAndEmptySource

`@ValueSource`는 `null`을 표현할 수 없으므로 별도 제공한다.

- `@NullSource` — `null` 1건
- `@EmptySource` — 빈 값(빈 `String`/컬렉션/배열/맵)
- `@NullAndEmptySource` — 위 둘 결합

```java
@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = { " ", "\t", "\n" })
void blankStrings(String text) {
    assertTrue(text == null || text.isBlank());
}
```

### 3.3. @EnumSource — enum 상수

```java
@ParameterizedTest
@EnumSource(ChronoUnit.class)              // 전체 상수
void allUnits(TemporalUnit unit) { assertNotNull(unit); }

@ParameterizedTest
@EnumSource(names = { "DAYS", "HOURS" })   // 일부만
void someUnits(ChronoUnit unit) { }

@ParameterizedTest
@EnumSource(mode = EXCLUDE, names = { "ERAS", "FOREVER" })  // 제외
void mostUnits(ChronoUnit unit) { }
```
`mode`: `INCLUDE`(기본)·`EXCLUDE`·`MATCH_ALL`·`MATCH_ANY`(정규식 매칭).

### 3.4. @MethodSource — 팩토리 메서드

같은 클래스의 `static` 메서드(또는 외부 클래스의 FQN 메서드)가 반환하는 `Stream`/`Collection`/배열을 인자로 쓴다. **여러 인자**는 `Arguments`로 묶는다.

```java
@ParameterizedTest
@MethodSource("addCases")
void add(int a, int b, int expected) {
    assertEquals(expected, a + b);
}

static Stream<Arguments> addCases() {
    return Stream.of(
        arguments(1, 1, 2),
        arguments(2, 3, 5)
    );
}

// 단일 인자면 Stream<String> 처럼 단순 반환도 가능
static Stream<String> fruits() { return Stream.of("apple", "banana"); }
```
메서드 이름을 생략하면 테스트 메서드와 **같은 이름**의 팩토리를 찾는다.

### 3.5. @FieldSource — static 필드

JUnit 5.11부터 지원한다.

컬렉션/스트림을 담은 `static` 필드를 소스로 쓴다.

```java
@ParameterizedTest
@FieldSource("fruits")
void field(String fruit) { assertNotNull(fruit); }

static final List<String> fruits = List.of("apple", "banana");
```

### 3.6. @CsvSource — 인라인 CSV

여러 인자를 CSV 행으로 나열한다. 표 기반 테스트에 가장 흔히 쓴다.

```java
@ParameterizedTest
@CsvSource({
    "apple,        1",
    "banana,       2",
    "'lemon, lime', 3"   // 콤마 포함 값은 작은따옴표
})
void rank(String fruit, int rank) { }
```

Text Block + 헤더 표시:
```java
@ParameterizedTest
@CsvSource(useHeadersInDisplayName = true, textBlock = """
    FRUIT,        RANK
    apple,        1
    banana,       2
    """)
void rank(String fruit, int rank) { }
```
구분자 변경(`delimiter`/`delimiterString`), `null` 표현(`nullValues = "NIL"`) 등을 지원한다.

### 3.7. @CsvFileSource — 외부 CSV 파일

클래스패스(`resources`) 또는 파일시스템(`files`)의 CSV를 읽는다.

```java
@ParameterizedTest
@CsvFileSource(resources = "/data.csv", numLinesToSkip = 1)  // 헤더 1줄 건너뜀
void fromFile(String country, int ref) { }
```

### 3.8. @ArgumentsSource — 커스텀 공급자

`ArgumentsProvider`를 직접 구현해 복잡한 인자 생성 로직을 캡슐화한다.

**ArgumentsProvider**는 인자 집합의 스트림을 공급하는 인터페이스다.
- `provideArguments(...)`가 `Stream<? extends Arguments>`를 반환하며, 스트림의 각 `Arguments`가 한 번의 테스트 실행이 된다.
- 인자 생성 로직이 **테스트 클래스에서 분리**되므로 여러 테스트 클래스에서 재사용할 수 있다. `@MethodSource` 팩토리가 커지거나 외부 자원(파일·DB) 기반 생성이 필요할 때 쓴다.
- 구현 제약: **최상위 클래스 또는 `static` 중첩 클래스**여야 하고 **기본 생성자**가 필요하다.
- `ExtensionContext`로 실행 컨텍스트(테스트 클래스·설정 파라미터 등)에 접근할 수 있다.

```java
@ParameterizedTest
@ArgumentsSource(MyArgumentsProvider.class)
void custom(String arg) { }

public class MyArgumentsProvider implements ArgumentsProvider {
    @Override
    public Stream<? extends Arguments> provideArguments(
            ParameterDeclarations params, ExtensionContext ctx) {
        return Stream.of("apple", "banana").map(Arguments::of);
    }
}
```

### 3.9. 커스텀 소스 어노테이션

`@ArgumentsSource`를 메타 어노테이션으로 붙인 **합성(composed) 어노테이션**을 만들면 `@ValueSource`처럼 쓰이는 자체 소스 어노테이션이 된다. `@ValueSource`·`@CsvSource` 등 내장 소스도 모두 이 구조(합성 어노테이션 + `ArgumentsProvider`)로 구현되어 있다.

어노테이션 속성 값은 `AnnotationBasedArgumentsProvider<A>`를 상속하면 파라미터로 받을 수 있다.

```java
// 1) 어노테이션 정의 — @ArgumentsSource를 메타 어노테이션으로 지정
@Target({ ElementType.ANNOTATION_TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@ArgumentsSource(IntRangeProvider.class)
public @interface IntRange {
    int from();
    int to();
}

// 2) 공급자 — 어노테이션 인스턴스를 파라미터로 수신
public class IntRangeProvider extends AnnotationBasedArgumentsProvider<IntRange> {
    @Override
    protected Stream<? extends Arguments> provideArguments(
            ParameterDeclarations params, ExtensionContext ctx, IntRange range) {
        return IntStream.range(range.from(), range.to()).mapToObj(Arguments::of);
    }
}

// 3) 사용 — 내장 소스 어노테이션과 동일한 방식
@ParameterizedTest
@IntRange(from = 0, to = 5)
void range(int n) { assertTrue(n < 5); }
```

`AnnotationBasedArgumentsProvider`가 없던 5.10 이전에는 `ArgumentsProvider`와 `AnnotationConsumer<A>`를 함께 구현해 같은 기능을 만들었다.

---

## 4. 인자 변환 (Conversion)

### 4.1. 암시적 변환
- **확대 변환**: `@ValueSource(ints=...)`를 `long`/`float`/`double` 파라미터로 받을 수 있다.
- **`String` → 타입**: CSV/ValueSource의 문자열을 `int`·`boolean`·`enum`·`UUID`·`LocalDate`·`File`·`Class` 등으로 자동 변환.

### 4.2. 명시적 변환 — @ConvertWith
```java
@ParameterizedTest
@EnumSource(ChronoUnit.class)
void explicit(@ConvertWith(ToStringArgumentConverter.class) String arg) { }

public class ToStringArgumentConverter extends SimpleArgumentConverter {
    @Override
    protected Object convert(Object source, Class<?> targetType) {
        return String.valueOf(source);
    }
}
```

### 4.3. 날짜·시간 — @JavaTimeConversionPattern
```java
@ParameterizedTest
@ValueSource(strings = { "01.01.2017", "31.12.2017" })
void dates(@JavaTimeConversionPattern("dd.MM.yyyy") LocalDate date) { }
```

---

## 5. 인자 집계 (Aggregation)

### 5.1. ArgumentsAccessor — 전체 인자 접근
인자가 많을 때 개별 파라미터 대신 접근자 하나로 받는다.

```java
@ParameterizedTest
@CsvSource({ "Jane, Doe, F, 1990-05-20" })
void accessor(ArgumentsAccessor args) {
    String first  = args.getString(0);
    Gender gender = args.get(2, Gender.class);
    LocalDate dob = args.get(3, LocalDate.class);
}
```

### 5.2. @AggregateWith — 도메인 객체로 집계
여러 컬럼을 하나의 객체로 묶는다.

```java
@ParameterizedTest
@CsvSource({ "Jane, Doe" })
void aggregate(@AggregateWith(PersonAggregator.class) Person p) { }

public class PersonAggregator extends SimpleArgumentsAggregator {
    @Override
    protected Object aggregateArguments(ArgumentsAccessor a, Class<?> targetType,
            AnnotatedElementContext ctx, int parameterIndex) {
        return new Person(a.getString(0), a.getString(1));
    }
}
```

---

## 6. 표시 이름 (Display Name)

`name` 속성과 플레이스홀더로 각 실행의 이름을 꾸민다.

```java
@ParameterizedTest(name = "{index} ==> {0} 의 순위는 {1}")
@CsvSource({ "apple, 1", "banana, 2" })
void display(String fruit, int rank) { }
```

플레이스홀더 목록:

- `{displayName}` — 테스트 메서드의 표시 이름. `@DisplayName`이 있으면 그 값
- `{index}` — 현재 실행 회차. 1부터 시작
- `{arguments}` — 전체 인자를 콤마로 연결한 문자열
- `{argumentsWithNames}` — 전체 인자를 `파라미터명=값` 형태로 연결
- `{argumentSetName}` — `argumentSet(...)`으로 부여한 인자 집합 이름. argumentSet을 쓴 경우에만 유효 (5.11+)
- `{argumentSetNameOrArgumentsWithNames}` — 집합 이름이 있으면 `{argumentSetName}`, 없으면 `{argumentsWithNames}` (5.11+)
- `{0}`, `{1}`, … — 개별 인자. 0부터 시작

추가 규칙:
- 기본 표시 이름 패턴은 `[{index}] {argumentSetNameOrArgumentsWithNames}`이며, 설정 파라미터 `junit.jupiter.params.displayname.default`로 전역 변경할 수 있다.
- `name`은 `MessageFormat` 패턴으로 처리되므로 작은따옴표는 `''`로 이스케이프한다.

명명 인자(`Named.of`/`named`) — 이름이 표시 이름에 반영된다:
```java
static Stream<Arguments> namedArgs() {
    return Stream.of(
        arguments(named("중요 파일", new File("a.txt"))),
        arguments(named("기타 파일", new File("b.txt")))
    );
}
// 인자 집합 전체에 이름 부여 (5.11+)
static List<Arguments> sets = List.of(
    argumentSet("정상 케이스", "apple", 1),
    argumentSet("경계 케이스", "", 0)
);
```

---

## 7. 여러 소스 조합 / 파라미터 선언 순서

- 소스 어노테이션은 **반복 적용**할 수 있다.
```java
@ParameterizedTest
@MethodSource("provider1")
@MethodSource("provider2")
void multiSource(String arg) { }
```
- 파라미터 선언 순서 규칙: **① 인덱스 인자 → ② 집계자(`ArgumentsAccessor`/`@AggregateWith`) → ③ 그 외 `ParameterResolver`가 주입하는 인자(`TestInfo` 등)** 순으로 선언한다.

---

## 8. 요약

- `@ParameterizedTest` + 인자 소스로 하나의 테스트를 여러 입력으로 반복. 의존성은 `junit-jupiter-params`.
- 소스: 단일 리터럴은 `@ValueSource`, null/빈값은 `@NullSource`/`@EmptySource`, enum은 `@EnumSource`, 동적·복합은 `@MethodSource`/`@FieldSource`, 표 기반은 `@CsvSource`/`@CsvFileSource`, 커스텀은 `@ArgumentsSource`.
- 변환(`@ConvertWith`/`@JavaTimeConversionPattern`)·집계(`ArgumentsAccessor`/`@AggregateWith`)·표시 이름(`name` 플레이스홀더·`named`)으로 가독성과 표현력을 높인다.

---

## Sources
- JUnit User Guide (6.0.3) — Parameterized Classes and Tests: https://docs.junit.org/6.0.3/writing-tests/parameterized-classes-and-tests.html
- JUnit Jupiter API — org.junit.jupiter.params.provider (current): https://junit.org/junit5/docs/current/api/org.junit.jupiter.params/org/junit/jupiter/params/provider/package-summary.html

---

## Related pages
- [[java-testing-libraries]] — Java 테스트 라이브러리 전체 개요(목적별 분류)
- [[java17-features]] — Text Block(@CsvSource textBlock에 사용)
