# log

---

## 2026-10-03 23:33:29

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 복잡도 항목에 $V$(정점 수), $E$(간선 수) 정의와 $O(V+E)$ 도출 근거(인접 리스트 길이 합), 인접 행렬 시 $O(V^2)$ 추가. 근거 각주 추가에 따라 기존 각주 번호 재정렬

## 2026-10-03 23:18:30

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 기존 위키 형식에 맞춰 재작성. 도입부를 개요로 통합, 하위 항목을 `###` 헤딩으로 변환, 문단 서술로 정리, Sources를 링크 형식으로 변경, 제목에 한글 번역명과 `programming` 태그 추가. DFS 간선 분류에 순방향·교차 간선 정의 추가

## 2026-10-03 23:11:09

- **생성**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — BFS·DFS 신규 문서. BFS는 큐 기반 동작, 거리·경로 복원, 격자 BFS, 0-1 BFS 등 변형, 장단점, LeetCode 문제 예시 4종. DFS는 재귀·반복 구현, 시간 기록, 간선 분류, 활용(사이클 탐지, 위상 정렬, SCC, 브리지), 장단점, LeetCode 문제 예시 5종. `wiki/index.md` 프로그래밍 일반 섹션에 링크 추가

## 2026-10-01 16:45:35

- **생성**: `wiki/java/spring/jpa-exceptions.md` — Spring Data JPA 리포지터리 예외 신규 문서. 예외 변환 흐름, 발생 시점(flush·커밋), 유형별 매핑(무결성 제약, save()와 PK 중복, 동시성·락, 조회 결과, API 오용, SQL·리소스), DataAccessException 계층, 처리 기준으로 구성. `wiki/index.md` Spring 섹션에 링크 추가
