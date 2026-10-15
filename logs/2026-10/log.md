# log

---

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
