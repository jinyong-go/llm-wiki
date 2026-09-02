---
title: Java 날짜 클래스의 Thread-Unsafe 문제
updated: 2026-08-12 09:32:28
tags:
  - java
  - concurrency
  - thread-safety
  - date-time
---

`SimpleDateFormat`, `DateFormat`, `Calendar`는 내부에 가변 상태(mutable state)를 가지며 동기화되어 있지 않다. 이런 클래스를 **static 필드**로 선언해 여러 스레드가 공유하면 경쟁 조건(race condition)이 발생한다.

## 1. SimpleDateFormat / DateFormat

### 1.1. 원인

`SimpleDateFormat`은 내부에 `Calendar` 타입 필드(`calendar`) 하나를 `format()`과 `parse()`가 공유해 임시 작업 공간으로 쓴다. `format(Date date)`는 `calendar.setTime(date)`로 필드를 채운 뒤 그 값을 읽어 문자열을 조립하고, `parse(String text)`도 같은 필드에 값을 채워가며 파싱한다. 즉 "쓰기 → 읽기" 사이에 원자성이 없어, 스레드 A가 값을 쓴 직후 스레드 B가 같은 필드를 덮어쓰면 A는 자신이 아닌 B가 쓴 값으로 결과를 만든다.

이 때문에 스레드 A가 요청한 날짜인데 스레드 B의 날짜 문자열이 반환되는 조용한 데이터 오염이 발생하거나, 파싱 중간에 필드가 다른 스레드에 의해 바뀌어 `NumberFormatException`·`ArrayIndexOutOfBoundsException` 같은 예측 불가능한 예외가 발생할 수 있다. Javadoc도 "Date formats are not synchronized. It is recommended to create separate format instances for each thread. If multiple threads access a format concurrently, it must be synchronized externally."라고 명시한다.

```java
// 위험: 여러 스레드가 하나의 인스턴스를 공유
private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd");

void log() {
    String s = SDF.format(new Date()); // 동시 호출 시 값 오염 가능
}
```

### 1.2. 대안

- **`java.time.format.DateTimeFormatter` (Java 8+, 권장)** — 포맷팅 대상(`TemporalAccessor`)과 포맷터 자체가 모두 불변으로 설계되어 있다. `format()`은 내부에 값을 쓰지 않고 전달받은 시간 객체에서 값을 읽기만 하므로 공유 상태가 없다. 따라서 `static final`로 선언해 여러 스레드가 안전하게 공유할 수 있다.
  ```java
  private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  // LocalDate, LocalDateTime 등 java.time 타입과 함께 사용
  ```
- **`ThreadLocal<SimpleDateFormat>`** — 스레드별로 독립된 인스턴스를 재사용해 생성 비용을 줄인다. 단, 스레드 풀을 사용하는 환경(WAS 등)에서 `remove()`를 호출하지 않으면 스레드가 재사용될 때 값이 계속 남아있거나, 애플리케이션 재배포(hot redeploy) 시 이전 클래스로더가 GC되지 못하는 메모리 누수로 이어질 수 있다.
  ```java
  private static final ThreadLocal<SimpleDateFormat> SDF = ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
  ```
- **호출마다 새 인스턴스 생성** — 가장 단순하지만 `SimpleDateFormat` 생성 비용(패턴 파싱)이 반복 발생한다. 호출 빈도가 낮다면 충분히 실용적인 선택.
- **Apache Commons Lang `FastDateFormat`** — 스레드 안전한 `SimpleDateFormat` 대체재. `getInstance(...)` 팩터리로 얻으며 포맷팅과 파싱을 모두 지원한다(3.2+). `java.time`으로 전환이 어려운 레거시 코드에서 static 공유 인스턴스로 바로 대체 가능.
- **외부 동기화 (`synchronized`)** — 가장 안전하지만 포맷팅/파싱을 단일 스레드로 직렬화하므로 동시성 저하가 크다. 다른 대안이 불가능할 때만 고려.

## 2. Calendar / GregorianCalendar

### 2.1. 원인

`Calendar`는 연/월/일/시/분/초 등을 담는 내부 필드 배열(`fields[]`)과 그로부터 계산된 `time`(epoch millis)을 함께 유지하며, `set()`/`get()`/`add()` 호출마다 두 표현 사이를 상호 변환(`computeTime()`/`computeFields()`)한다. 이 변환 과정 자체가 내부 상태를 여러 단계에 걸쳐 수정한다.

한 스레드가 변환 도중인 인스턴스를 다른 스레드가 동시에 읽거나 쓰면 계산이 뒤섞여 잘못된 날짜값을 반환하거나 예외가 발생할 수 있다. `SimpleDateFormat`이 내부적으로 `Calendar` 필드를 사용하는 것도 이 문제와 연결된다. `Calendar.getInstance()`는 매 호출 시 새 인스턴스를 반환하는 팩터리 메서드이므로 그 자체는 스레드 안전하지만, **반환된 인스턴스를 여러 스레드가 공유**하는 순간 안전하지 않아진다. Javadoc에는 별도의 스레드 안전성 명시가 없다는 점도 주의가 필요하다 (문서화되지 않은 non-thread-safe 사례).

### 2.2. 대안

- **`java.time.LocalDate` / `LocalDateTime` / `ZonedDateTime` (Java 8+, 권장)** — 모든 `java.time` 타입은 불변이다. `plusDays()` 등 변경 메서드는 기존 객체를 수정하지 않고 새 인스턴스를 반환하므로, 여러 스레드가 같은 인스턴스를 자유롭게 공유해도 안전하다.
  ```java
  LocalDate d = LocalDate.now();
  LocalDate next = d.plusDays(1); // d는 그대로, next가 새 인스턴스
  ```
- Java 8 미만 환경이라면 Joda-Time 라이브러리가 동일한 불변 설계를 제공한다.

---

## Sources
- [Oracle Javadoc — SimpleDateFormat (Synchronization 절)](https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html)
- [Bug ID: JDK-4101500 — java.text.NumberFormat is not thread safe](https://bugs.java.com/bugdatabase/view_bug.do?bug_id=4101500)
- [Apache Commons Lang — FastDateFormat](https://commons.apache.org/proper/commons-lang/apidocs/org/apache/commons/lang3/time/FastDateFormat.html)
- [JetBrains Inspectopedia — Non-Thread-Safe Static Field Access](https://www.jetbrains.com/help/inspectopedia/AccessToNonThreadSafeStaticField.html) (SimpleDateFormat, Calendar 등 포함 목록)

---

## Related pages
- [[java17-features]]
