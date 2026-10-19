# wiki-lint report — 2026-10-19 (programming)

- **범위**: `wiki/programming/` 16개 문서 (backtracking, bfs, cqrs, design-patterns, design-patterns-behavioral, design-patterns-creational, design-patterns-structural, dfs, dynamic-programming, first-class-citizen, jmeter-components, jmeter-introduction, load-testing, reactive-programming, solid, tps-improvement)
- **결과**: broken links 0건 / 사실 오류 12건 / 근거 부족 8건 / 문서 간 충돌 6건 / 구성·양식 개선 다수
- **조치**: 오류 → 충돌 → 양식 순으로 단계별 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크: 16개 문서의 `[[...]]` 대상 전부 존재. 깨짐 0건
- `raw/` 경로 인용 없음

---

## 2. 사실 오류

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| E1 | `design-patterns-structural.md` | §4.3 | 주석 `암호화 → 압축 → 파일 쓰기`. 바깥 데코레이터가 Compression이므로 실제 순서는 압축 → 암호화 → 파일 쓰기 |
| E2 | `design-patterns-structural.md` | §4.5 | `HttpServletRequestWrapper`·`HttpServletResponseWrapper`는 Spring이 아닌 Servlet API(`jakarta.servlet`) |
| E3 | `design-patterns-structural.md` | §3.4 | `FilterSecurityInterceptor`는 Composite 예시가 아닌 단일 필터이며 Spring Security 6에서 `AuthorizationFilter`로 대체 |
| E4 | `design-patterns-creational.md` | §3.5 | `DriverManager`는 `Connection`만 반환. `Statement`는 `Connection`이, `ResultSet`은 `Statement`가 생성하므로 추상 팩토리는 `Connection` |
| E5 | `design-patterns-creational.md` | §3.2·§3.3 | 구조도는 Button·Checkbox, 코드는 Button·Dialog로 제품군 불일치 |
| E6 | `design-patterns-creational.md` | §5.2 | 깊은 복사 예제의 미선언 `metadata` 필드, `CloneNotSupportedException` 미처리, `deepCopy`의 `<T>` 미선언과 IOException 미처리로 컴파일 불가 |
| E7 | `design-patterns-behavioral.md` | §3.4 | `ScrollableResults`는 JPA가 아닌 Hibernate API |
| E8 | `design-patterns-behavioral.md` | §8.4 | Spring Security에 `AuthenticationStrategy` 타입 없음. `SessionAuthenticationStrategy` |
| E9 | `cqrs.md` | §3.2 | `ApplicationEventPublisher` 메서드는 `publishEvent`. 트랜잭션 내 동기 `@EventListener`는 롤백 시에도 읽기 저장소에 반영되므로 `@TransactionalEventListener(AFTER_COMMIT)` 또는 Outbox 필요 |
| E10 | `cqrs.md` | §7.2 | Axon 이벤트 소싱 Aggregate의 no-arg 생성자 누락, `ConfirmOrderCommand`의 `@TargetAggregateIdentifier` 누락, 이벤트에 없는 `event.getTotal()` 사용, record 접근자와 getter 혼용 |
| E11 | `cqrs.md` | §3.1 | 인터페이스 프로젝션은 JPA가 아닌 Spring Data JPA 기능 |
| E12 | `solid.md` | §1 | SOLID 약어는 Michael Feathers가 2004년경 명명 |

---

## 3. 근거 부족·과장

| # | 파일 | 내용 |
|---|---|---|
| W1 | `cqrs.md` §5 | "서버는 비즈니스 예외만 처리"는 서버 측 입력 검증 생략으로 읽힘. 서버 검증은 필수 |
| W2 | `cqrs.md` §3·§9 | Level 1~3 분류, "읽기 100 : 쓰기 1" 비율은 출처에 없음. 각주 필요 |
| W3 | `solid.md` §5.3 | Repository Projection은 조회 결과 형태에 관한 기능으로 ISP 예시로 부적절. `Repository` 상속 후 필요한 메서드만 노출하는 방식이 ISP |
| W4 | `solid.md` §6.3 | "IoC 컨테이너가 DIP를 자동 실현"은 과장. 구체 클래스도 주입 가능 |
| W5 | `solid.md` §2 | Sources의 Clean Architecture SRP 재정의("하나의 actor에 대해서만 책임") 미반영 |
| W6 | `reactive-programming.md` §5 | Vert.x core는 Reactive Streams 미구현(`vertx-reactive-streams` 모듈 별도). `Flow`는 `SubmissionPublisher` 구현체 존재 |
| W7 | `tps-improvement.md` §6.2 | 블로킹 I/O의 논블로킹 전환은 소켓 I/O 기준. 파일 I/O 등은 carrier 점유·pinning 단서 필요 |
| W8 | design-patterns 3종 | `Calendar.getInstance()`, `LoggerFactory.getLogger()`(정적 팩토리), `StringBuilder`, `CriteriaBuilder`는 GoF 정의와 차이. 각주로 구분 필요 |

---

## 4. 문서 간 충돌

| # | 대상 | 내용 |
|---|---|---|
| C1 | Spring Security 필터 체인 | `design-patterns.md`·`design-patterns-structural.md`는 Decorator, `design-patterns-behavioral.md`는 Chain of Responsibility. CoR로 통일 |
| C2 | SLF4J | `design-patterns-structural.md` §2.5 Bridge, §5.4 Facade. Facade로 통일 |
| C3 | `ActionListener` | `design-patterns.md` Command, `design-patterns-behavioral.md` §4.4 Mediator |
| C4 | `ApplicationEventPublisher` | Mediator(§4.4)와 Observer(§6.4)에 중복. 기준 각주 필요 |
| C5 | `JdbcTemplate` | Facade와 Template Method에 중복. 상속이 아닌 template-callback 방식 차이 명시 필요 |
| C6 | `dfs.md` §2.2 ↔ §4 | 반복형 공간 $O(E)$, §4는 $O(V)$. 재귀형 기준임을 명시 |

### 출처 대조 결과 (일치)
- `load-testing.md` ramp-up 5~15%, 유지 구간 ramp-up 5배 이상: k6 Average-load testing 문서와 일치
- 부하 발생기 CPU 80%·메모리 90%: k6 Running large tests 문서와 일치

---

## 5. 구성·양식

### 5.1 공통
- F1: 7월 문서(solid, design-patterns 4종, cqrs)는 `1.1.` 번호, 섹션 간 `---`, 빈 헤더 표(`| | |`) 사용. 10월 문서(bfs·dfs·backtracking·dp) 양식으로 통일
- F2: 대시 연결 위반. 제목 `Level 1 — 동일 DB`, `S — 단일 책임 원칙`, `2.1. 생성 패턴 — [[...]]`, `11.2. 구현 — 수식 파서`, 목록(first-class-citizen 2곳, cqrs §9, load-testing §6), `→ [[design-patterns]]` 화살표 연결
- F3: 각주 본문 중간 위치. `tps-improvement.md`(§7 뒤), `first-class-citizen.md`(§3 뒤)
- F4: Related pages 누락. reactive-programming ← `[[project-reactor]]`·`[[reactor-operators]]`, jmeter-*·tps-improvement ← `[[load-testing]]`, solid ← `[[design-patterns]]`, behavioral Observer·cqrs ← `[[spring-event]]`, behavioral ← `[[reactive-programming]]`
- F5: `wiki/index.md` 프로그래밍 항목 서술이 김. 주제 수준으로 축약
- F6: 알고리즘·설계·성능 문서 혼재. `programming/algorithm`, `design`, `performance` 하위 분류 검토(`/wiki-category`)

### 5.2 문서별
- `jmeter-introduction.md`: §3.1·§3.2 GUI 부하 테스트 금지 중복, "5. 관련 문서" 삭제, 제목 내 각주(`## 4. 장단점[^1]`) 본문 이동
- `jmeter-components.md`: `Scoping Rules`, `Pre-Processor / Post-Processor` 제목 단순화
- `load-testing.md`: §7 굵은 글씨 문장 목록 정리
- `tps-improvement.md`: Goetz 공식 LaTeX 전환, 제목 `처리량의 이론적 한계: Little's Law` 축약
- `first-class-citizen.md`: 도입 문단 `1. 개요`로 편입, `(4장)`·`(§15.27)` 참조 표기 통일, JLS 출처 추가
- `reactive-programming.md`: §5.1 Virtual Threads 별도 장 분리, 제목의 따옴표·`≠` 제거
- design-patterns 3종: Adapter 예제(XML→JSON) 교체, Interpreter 장점 중복 표현 정리
- `dfs.md`: 한 줄 섹션 "10. BFS와 비교" 삭제
- `backtracking.md` §5: 가지치기와 최악 복잡도 서술에 추론 각주 추가
