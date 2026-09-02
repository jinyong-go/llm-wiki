---
title: Java 17 주요 기능
updated: 2026-07-08 10:50:28
tags:
  - java
  - java17
  - lts
---

## 1. 개요
Java 17은 **2021년 9월 14일** 정식 릴리즈(General Availability)된 LTS(Long Term Support) 버전으로, 이전 버전들에서 preview로 제공되던 여러 언어 기능들이 정식으로 포함되었습니다. Java 11에 이은 두 번째 LTS 릴리즈입니다.

### 1.1. LTS 지원 기간 — Oracle 기준
- **Premier Support**: ~2026년 9월
- **Extended Support**: ~2029년 9월 (Premier 종료 후 3년 추가)
- LTS 릴리즈는 CPU(Critical Patch Update) 일정에 따라 최소 8년간 보안·안정성 업데이트를 받습니다.
- 무료 상업 사용 라이선스(NFTC)는 2024년 9월까지 제공된 뒤 1년의 유예를 거쳐 종료되었습니다. 이후 프로덕션 사용은 유료 구독이 필요하며, 무료 사용이 필요하면 Eclipse Temurin·Amazon Corretto 등 OpenJDK 배포판을 사용합니다.

> 지원 종료일은 벤더(Oracle/Adoptium/Corretto 등)마다 상이하므로 실제 도입 시 사용하는 배포판의 로드맵을 확인해야 합니다.

---

## 2. 주요 언어 기능

### 2.1. Sealed Classes (JEP 409)
상속 또는 구현이 가능한 클래스와 인터페이스를 명시적으로 제한합니다.
- **목적**: 슈퍼클래스의 저자가 의도한 하위 타입 외에 임의의 확장을 방지하여 도메인 모델의 무결성을 유지합니다.
- **선언**: `sealed` 수식어와 `permits` 절을 사용합니다.
- **제약**: 허용된 서브클래스는 반드시 `final`, `sealed`, 또는 `non-sealed` 중 하나의 수식어를 가져야 합니다.
- **이점**: 컴파일러가 타입 계층을 완전히 파악할 수 있어, `switch` 문 등에서 모든 케이스에 대한 **전수 검사(exhaustiveness checking)**가 가능해집니다.

### 2.2. Records (JEP 395)
불변(immutable) 데이터를 운반하는 클래스를 간결하게 정의하기 위한 특수한 종류의 클래스입니다.
- **목적**: 데이터 전달용 클래스(DTO·VO)에서 반복되는 보일러플레이트를 제거하고, "이 타입은 데이터의 투명한 운반자"라는 의도를 코드로 명확히 드러냅니다.
- **선언**: 헤더에 컴포넌트(필드) 목록을 선언하면, 생성자·getter·`equals()`·`hashCode()`·`toString()`이 컴파일 시 자동 생성됩니다.
  ```java
  // 한 줄로 필드·생성자·접근자·equals/hashCode/toString 모두 정의
  public record Point(int x, int y) {}

  Point p = new Point(3, 4);
  p.x();              // getX()가 아니라 컴포넌트명 그대로: x()
  p.equals(new Point(3, 4));  // true (값 기반 비교)

  // 검증·정규화는 compact 생성자로
  public record Range(int lo, int hi) {
      public Range {                       // 파라미터 목록·필드 대입 생략
          if (lo > hi) throw new IllegalArgumentException("lo > hi");
      }
  }
  ```
- **이점**: 값 기반 `equals()`/`hashCode()`가 자동 제공되어 컬렉션 키·비교 로직이 안전해지고, 코드량이 크게 줄어 실수 여지가 감소합니다.
- **제약**: 모든 필드는 암시적으로 `final`이며(불변), 다른 클래스를 **상속받을 수 없습니다**(인터페이스 구현은 가능). 인스턴스 필드를 추가로 선언할 수 없습니다.

### 2.3. Text Blocks (JEP 378)
여러 줄의 문자열 리터럴을 이스케이프 없이 직관적으로 작성할 수 있는 기능을 제공합니다.
- **목적**: HTML·SQL·JSON 등 여러 줄 구조화 텍스트를 `\n`·`\"` 이스케이프와 문자열 연결(`+`) 없이 원본 형태 그대로 작성합니다.
- **선언**: 삼중 따옴표(`"""`)로 감싸며, 여는 `"""` 뒤에는 반드시 개행이 와야 합니다.
  ```java
  String json = """
      {
          "name": "order",
          "qty": 3
      }
      """;

  String sql = """
      SELECT id, name
      FROM orders
      WHERE status = 'PAID'
      """;
  ```
- **이점**: 가독성이 크게 향상되고, 공통 앞공백(incidental indentation)은 컴파일러가 자동으로 제거하여 코드 들여쓰기와 문자열 내용을 분리할 수 있습니다.
- **제약**: 결과 타입은 일반 `String`과 동일합니다(별도 타입 아님). 줄 끝 공백은 기본적으로 제거되며, 유지하려면 `\s` 이스케이프를, 의도적 줄바꿈 억제에는 줄 끝 `\`를 사용합니다.

### 2.4. Pattern Matching for instanceof (JEP 394)
타입 체크와 형변환을 동시에 수행하여 불필요한 캐스팅 코드를 제거합니다.
```java
if (obj instanceof String s) {
    // 이 스코프에서 s를 String 타입으로 바로 사용 가능
    System.out.println(s.length());
}
```

### 2.5. Switch Expressions (JEP 361)
`switch` 문을 표현식(expression)으로 사용할 수 있어 값을 반환할 수 있게 되었습니다.
- **목적**: 조건에 따라 값을 결정하는 로직을 `switch` 문 + 임시 변수 대입 대신 하나의 표현식으로 간결하게 작성합니다.
- **선언**: 화살표(`->`) 구문을 사용하며, 복수 라벨은 콤마로 묶습니다. 단순 반환은 `->` 우변에 값을, 블록에서 반환할 때는 `yield`를 사용합니다.
  ```java
  int numDays = switch (day) {
      case MON, TUE, WED, THU, FRI -> 8;
      case SAT, SUN -> 0;
  };

  // 블록에서 값을 반환할 때는 yield
  String grade = switch (score / 10) {
      case 10, 9 -> "A";
      case 8     -> "B";
      default -> {
          System.out.println("낮은 점수: " + score);
          yield "F";
      }
  };
  ```
- **이점**: 화살표 구문은 자동으로 각 케이스가 독립 실행되어 `break` 누락으로 인한 **fall-through 버그를 원천 차단**합니다. `enum` 등 유한 타입에서는 모든 케이스를 다루면 `default` 없이도 컴파일러가 전수 검사를 수행합니다.
- **제약**: 표현식으로 쓰일 때는 모든 경로가 값을 반환해야 하므로, 케이스를 빠짐없이 다루거나 `default`가 필요합니다. 화살표(`->`)와 콜론(`:`) 스타일은 하나의 `switch` 안에서 혼용할 수 없습니다.

---

## 3. 기타 변경 사항
- **JDK 내부 캡슐화 강화 (JEP 403)**: `--illegal-access` 옵션이 제거되어, 내부 API에 대한 접근이 기본적으로 차단됩니다. 리플렉션을 통한 접근이 필요한 경우 `--add-opens` 옵션을 사용해야 합니다.

---

## Sources
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409)
- [JEP 395: Records](https://openjdk.org/jeps/395)
- [JEP 378: Text Blocks](https://openjdk.org/jeps/378)
- [JEP 394: Pattern Matching for instanceof](https://openjdk.org/jeps/394)
- [JEP 361: Switch Expressions](https://openjdk.org/jeps/361)
- [JDK 17 (openjdk.org)](https://openjdk.org/projects/jdk/17/)
- [Oracle Java SE Support Roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)

---

## Related pages
- [[java21-features]]
- [[jvm-options]]
- [[expression-vs-statement]]
