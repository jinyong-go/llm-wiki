# log

---

## 2026-10-19 22:50:33

- **수정**: `wiki/programming/` 14개 문서의 구성·양식 정리. 7월 작성 문서(SOLID·GoF 패턴·CQRS)의 번호·구분선·표 형식을 통일하고 제목·목록의 대시 연결을 제거. 각주를 문서 최하단으로 옮기고 Related pages 보강. Adapter 예제 교체, Goetz 공식 LaTeX 전환, 리액티브 문서의 Virtual Threads 장 분리, JMeter 중복 서술·관련 문서 절 삭제, DFS 비교 절 삭제, 백트래킹 복잡도 각주 추가
- **수정**: `wiki/index.md`의 프로그래밍 항목을 주제 수준으로 축약

## 2026-10-19 22:48:02

- **수정**: `wiki/programming/` 4개 문서의 문서 간 충돌을 정리. Spring Security 필터 체인을 Chain of Responsibility, SLF4J를 Facade로 통일하고 Command 사용처를 `javax.swing.Action`으로 교체. `ApplicationEventPublisher`의 Observer·Mediator 분류와 `JdbcTemplate`의 template-callback 방식을 각주로 설명. DFS 공간 복잡도의 재귀형·반복형 기준을 명시

## 2026-10-19 22:47:14

- **수정**: `wiki/programming/` 8개 문서에 lint 결과(`logs/lint/report-20261019-programming.md`)의 사실 오류·근거 부족 항목을 반영. Decorator 실행 순서 주석, Servlet API·Hibernate·Spring Security 타입명, JDBC 추상 팩토리 설명, Prototype 깊은 복사 예제 컴파일 오류를 정정. CQRS의 트랜잭션 이벤트 리스너·Outbox, Axon 예제, 서버 측 검증 서술을 수정. SOLID 약어 유래·SRP 재정의·ISP 예시·DIP 서술, Vert.x·Flow 표, 가상 스레드 pinning 조건을 보완

## 2026-10-19 18:01:14

- **수정**: `wiki/security/web/` 10개 문서의 구성·문장 개선. CORS 설정 오류, CSRF Fetch Metadata·Spring Security 설정, XSS Trusted Types·CSP 설정, JWT 헤더 파라미터·명시적 타입, OAuth 확장 규격·리소스 서버 구현, OIDC 로그아웃·SAML 서명 래핑, WebAuthn Passkey, 재전송 방지 Redis 구현, 세션 Spring 설정 항목 추가
- **수정**: XSS 실행 예제를 클라이언트 렌더링 항목으로, JWT의 JWE를 서명 알고리즘 뒤로, 재전송 공격을 대상·방어·구현 순으로, 세션 하이재킹 공격 기법을 OWASP 분류 순으로 재배치. WebAuthn 벤더 목록 압축, 사례·각주·구분선 정리

## 2026-10-19 17:50:53

- **수정**: `wiki/security/web/cors.md`의 SOP 풀 이름과 요청·응답 헤더 설명을 보완. 개요·단순 요청 조건을 다듬고 Spring 경로 패턴을 복원. no-cors·응답 헤더 노출·오류 진단 항목 추가

## 2026-10-19 17:47:41

- **수정**: `wiki/security/crypto/cms.md` 구조 개편. 콘텐츠 타입 표와 구조 상세를 타입별 하위 항목으로 통합하고 DigestedData·EncryptedData·AuthenticatedData·AuthEnvelopedData 설명과 ASN.1을 보강. 규격 계보·알고리즘·상위 규격을 관련 규격 항목으로 이동
- **수정**: `wiki/security/pki/` 5개 문서에 lint 결과(`logs/lint/report-20261019-pki.md`)를 반영. 코드서명 HSM·SmartScreen 서술, CRL 갱신 주기, 다단계 중간 CA 설명을 정정하고 CMP 대화 잔재 문장을 삭제. 인증서 폐기·CMP 제목을 단순화하고 각주를 문서 최하단으로 이동. timestamp-token의 CMS 절 참조를 갱신

## 2026-10-19 17:26:20

- **생성**: `wiki/security/web/xss.md`에 XSS 유형별 예제, 출력 인코딩·HTML 정제·CSP·쿠키 방어, MySpace·Twitter·TweetDeck 사고 사례를 작성
- **수정**: `wiki/index.md`에 XSS 항목 추가

## 2026-10-19 17:18:36

- **수정**: `wiki/security/crypto/` 7개 문서에 lint 결과(`logs/lint/report-20261019.md`)를 반영. ML-DSA 서명 의사코드의 κ 증가 위치와 개인키 크기 공식, 근거 없는 서술을 정정하고 CMS detached 서명 설명을 RFC 5652에 맞춰 수정. 해시 함수의 SHA-3 권장·BLAKE3 표준·Git SHA-256 현황을 갱신하고 PBKDF2 출처를 RFC 8018로, SSLv3 설명을 정정. 각주를 문서 최하단으로 이동

## 2026-10-19 17:18:00

- **수정**: `wiki/security/web/` 9개 문서의 CORS·쿠키 전송, CSRF 조건, JWT 검증·폐기, OAuth PKCE·토큰 보관, SSO 흐름, WebAuthn Level 3 검증, 세션·재전송 방어 설명을 정정. 재전송 방지 Java 예제의 동시성·윈도우 크기를 수정하고 출처·제목·중복 요약을 정리
- **수정**: `wiki/index.md`의 웹 보안 항목을 주제 수준으로 축약

## 2026-10-15 22:47:28

- **수정**: `wiki/java/common/gc-monitoring.md` — GCTimeRatio·Unified Logging 기본값·JDK 8 옵션 대체·jcmd attach 조건을 정정. 도구 영향도와 지표 설명을 명확히 하고 Sources 링크를 Markdown으로 통일
- **수정**: `wiki/index.md` — GC 모니터링 항목의 주제 설명을 로그 분석과 진단으로 구체화

## 2026-10-15 22:42:31

- **수정**: `wiki/java/test/mockserver.md` — 개요를 기능 설명과 사용 목적으로 문단 분리. 3.2 제목을 MockServer 클라이언트 주입으로 구체화

## 2026-10-15 22:34:58

- **생성**: `wiki/java/common/gc-monitoring.md` — GC 모니터링 신규 문서. 지표(정지 시간, 처리량, 할당률 등), -Xlog 문법·권장 설정·로그 해석, jstat, jcmd(GC.heap_info, VM.log, PerfCounter), JFR, JMX·Micrometer, 주의사항. JDK 17 실측 출력 포함. `wiki/index.md` 링크 추가
- **수정**: `wiki/java/common/jvm-options.md` §4에 `[[gc-monitoring]]` 참조 추가, `gc.md`·`java-process-analysis-tools.md` Related pages 갱신

## 2026-10-15 22:31:46

- **수정**: `wiki/java/test/mockserver.md` — API 출처를 8.0.0으로 통일하고 JUnit·Spring 초기화 시점과 범위, 병렬 테스트의 고유 매처 사용, 비동기 요청 검증을 보완. 용어 설명과 Sources Markdown 링크 적용
- **수정**: `wiki/index.md` — MockServer 항목에 병렬 테스트 격리 주제 추가

## 2026-10-15 22:22:49

- **생성**: `wiki/java/test/mockserver.md` — MockServer 신규 문서. 의존성, JUnit 5 통합(@ExtendWith/@MockServerSettings 선택, 속성), Spring @MockServerTest, Expectation 매칭·횟수·우선순위, 검증, 주의사항, FAQ. `wiki/index.md` 링크 추가
- **수정**: `wiki/java/test/java-testing-libraries.md` — §5 통합/외부 의존성과 요약 표에 MockServer 추가, Sources·Related pages 갱신

## 2026-10-04 23:11:01

- **생성**: `wiki/programming/dynamic-programming.md` — 동적 계획법 신규 문서. 적용 조건, 탑다운·바텀업 비교, 설계 절차, 공간 최적화, 대표 유형(선형, 격자, 배낭, LIS, 두 문자열), LeetCode 문제 예시 7종. `wiki/index.md` 링크 추가
- **수정**: `wiki/programming/backtracking.md` — Related pages에 `[[dynamic-programming]]` 추가

## 2026-10-04 23:07:21

- **생성**: `wiki/programming/backtracking.md` — 백트래킹 신규 문서. 6개 절차 구조, 선택·재귀·되돌리기, 가지치기 기법, 복잡도, 완전 탐색·분기 한정 비교, N-Queens 탐색 공간, LeetCode 문제 예시 5종. `wiki/index.md` 링크 추가
- **수정**: `wiki/programming/dfs.md` — 7.5 백트래킹 위키 링크 및 Related pages에 `[[backtracking]]` 추가

## 2026-10-03 23:33:29

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 복잡도 항목에 $V$(정점 수), $E$(간선 수) 정의와 $O(V+E)$ 도출 근거(인접 리스트 길이 합), 인접 행렬 시 $O(V^2)$ 추가. 근거 각주 추가에 따라 기존 각주 번호 재정렬

## 2026-10-03 23:18:30

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 기존 위키 형식에 맞춰 재작성. 도입부를 개요로 통합, 하위 항목을 `###` 헤딩으로 변환, 문단 서술로 정리, Sources를 링크 형식으로 변경, 제목에 한글 번역명과 `programming` 태그 추가. DFS 간선 분류에 순방향·교차 간선 정의 추가

## 2026-10-03 23:11:09

- **생성**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — BFS·DFS 신규 문서. BFS는 큐 기반 동작, 거리·경로 복원, 격자 BFS, 0-1 BFS 등 변형, 장단점, LeetCode 문제 예시 4종. DFS는 재귀·반복 구현, 시간 기록, 간선 분류, 활용(사이클 탐지, 위상 정렬, SCC, 브리지), 장단점, LeetCode 문제 예시 5종. `wiki/index.md` 프로그래밍 일반 섹션에 링크 추가

## 2026-10-01 16:45:35

- **생성**: `wiki/java/spring/jpa-exceptions.md` — Spring Data JPA 리포지터리 예외 신규 문서. 예외 변환 흐름, 발생 시점(flush·커밋), 유형별 매핑(무결성 제약, save()와 PK 중복, 동시성·락, 조회 결과, API 오용, SQL·리소스), DataAccessException 계층, 처리 기준으로 구성. `wiki/index.md` Spring 섹션에 링크 추가
