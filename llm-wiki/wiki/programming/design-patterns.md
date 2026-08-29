---
title: GoF 디자인 패턴
updated: 2026-07-08 10:32:15
tags:
  - programming
  - oop
  - design-patterns
  - gof
---

## 1. 개요

GoF(Gang of Four) 디자인 패턴은 Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides가 1994년 *Design Patterns: Elements of Reusable Object-Oriented Software*에서 정리한 23개의 객체지향 설계 패턴이다. 세 범주로 분류된다.

- **생성(Creational)**: 객체 생성 방식을 캡슐화. 생성 로직을 클라이언트와 분리한다.
- **구조(Structural)**: 클래스·객체를 조합해 더 큰 구조를 만든다.
- **행동(Behavioral)**: 객체 간 상호작용과 책임 분배를 정의한다.

---

## 2. 패턴 목록

### 2.1. 생성 패턴 — [[design-patterns-creational]]

| 패턴 | 핵심 아이디어 | 대표 사용처 |
| :--- | :--- | :--- |
| **Singleton** | 인스턴스를 하나만 생성, 전역 접근 제공 | `Runtime.getRuntime()`, Spring `@Scope("singleton")` |
| **Factory Method** | 객체 생성을 서브클래스에 위임 | `Calendar.getInstance()`, Spring `FactoryBean` |
| **Abstract Factory** | 연관된 객체 패밀리를 일관되게 생성 | JDBC `Connection` / `Statement` / `ResultSet` |
| **Builder** | 복잡한 객체를 단계적으로 조립 | `StringBuilder`, Lombok `@Builder`, `HttpClient.newBuilder()` |
| **Prototype** | 기존 객체를 복사해 새 객체 생성 | `Object.clone()`, Spring `@Scope("prototype")` |

### 2.2. 구조 패턴 — [[design-patterns-structural]]

| 패턴 | 핵심 아이디어 | 대표 사용처 |
| :--- | :--- | :--- |
| **Adapter** | 호환되지 않는 인터페이스를 연결 | `Arrays.asList()`, `InputStreamReader` |
| **Bridge** | 추상화와 구현을 독립적으로 확장 | JDBC Driver 분리, 플랫폼별 UI 렌더러 |
| **Composite** | 개별 객체와 컨테이너를 동일하게 처리 | 파일시스템, UI 컴포넌트 트리 |
| **Decorator** | 런타임에 객체에 기능을 동적으로 추가 | Java I/O 스트림, Spring Security 필터 |
| **Facade** | 복잡한 서브시스템에 단순한 인터페이스 제공 | `SLF4J`, `JdbcTemplate` |
| **Flyweight** | 공유로 대량의 세밀한 객체 메모리 절감 | `Integer.valueOf()` 캐시, String Pool |
| **Proxy** | 원본 객체 접근을 제어하는 대리 객체 | Spring AOP, JDK Dynamic Proxy |

### 2.3. 행동 패턴 — [[design-patterns-behavioral]]

| 패턴 | 핵심 아이디어 | 대표 사용처 |
| :--- | :--- | :--- |
| **Chain of Responsibility** | 요청을 체인으로 전달, 처리자가 결정 | Servlet Filter, Spring Security |
| **Command** | 요청을 객체로 캡슐화, 실행 취소 지원 | `Runnable`, `java.awt.event.ActionListener` |
| **Iterator** | 내부 구조를 노출하지 않고 순차 접근 | `java.util.Iterator`, enhanced for |
| **Mediator** | 객체 간 직접 참조 제거, 중재자 통신 | Spring `ApplicationEventPublisher` |
| **Memento** | 객체 상태를 캡처·복원 (실행 취소) | 텍스트 에디터 undo, 게임 세이브 |
| **Observer** | 상태 변화를 구독자에게 자동 통지 | Spring 이벤트, `java.util.EventListener` |
| **State** | 상태에 따라 동작을 변경 | TCP 연결 상태, 주문 상태 머신 |
| **Strategy** | 알고리즘을 캡슐화해 교체 가능하게 | `Comparator`, `DiscountPolicy` |
| **Template Method** | 알고리즘 골격 정의, 세부 단계는 서브클래스 | `JdbcTemplate`, `AbstractList` |
| **Visitor** | 구조 변경 없이 새 연산을 추가 | `javax.lang.model.ElementVisitor`, AST 처리 |
| **Interpreter** | 언어 문법을 클래스로 표현 | 정규표현식, SpEL, SQL 파서 |

---

## Sources

- *Design Patterns: Elements of Reusable Object-Oriented Software* — Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994, Addison-Wesley)
- [Refactoring.Guru — Design Patterns](https://refactoring.guru/design-patterns)
- [SourceMaking — Design Patterns](https://sourcemaking.com/design_patterns)

---

## Related pages

- [[design-patterns-creational]]
- [[design-patterns-structural]]
- [[design-patterns-behavioral]]
- [[solid]]
