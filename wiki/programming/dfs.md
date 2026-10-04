---
title: DFS (깊이 우선 탐색)
updated: 2026-10-04 23:07:21
tags:
  - programming
  - algorithm
  - graph
---

## 1. 개요
**DFS(Depth-First Search)** 는 한 경로를 갈 수 있는 끝까지 따라간 뒤 되돌아와(backtracking) 다른 경로를 탐색하는 그래프 탐색 알고리즘이다. 재귀 호출 또는 스택(Stack)으로 구현한다. 최단 경로를 보장하지 않지만 방문·종료 시점 정보를 활용해 사이클 탐지, 위상 정렬, 강연결 요소 등을 구한다. 너비 우선 탐색은 [[bfs]] 참고.

## 2. 동작

### 2.1 재귀형
1. 현재 정점을 방문 처리한다.
2. 인접한 미방문 정점마다 재귀 호출한다.
3. 더 갈 곳이 없으면 반환하여 이전 정점으로 돌아간다.

### 2.2 반복형
명시적 스택에 정점을 넣고 꺼내며 인접 정점을 처리한다. 최악 공간 복잡도는 $O(E)$이다. 스택에 넣는 순서와 방문 처리 시점 때문에 방문 순서가 재귀형과 다를 수 있다.[^1]

### 2.3 비연결 그래프
연결되지 않은 그래프는 모든 미방문 정점에서 DFS를 시작해야 전체를 방문한다.

## 3. 구현

### 3.1 재귀형과 시간 기록
`color`로 정점 상태(0 미방문, 1 방문 중, 2 완료)를 관리하고 `tin`, `tout`에 진입·종료 시간을 기록한다.

```java
import java.util.*;

class Dfs {
    List<List<Integer>> adj;
    int[] color, tin, tout; // color 0 미방문, 1 방문 중, 2 완료
    int timer = 0;

    Dfs(List<List<Integer>> adj) {
        this.adj = adj;
        int n = adj.size();
        color = new int[n]; tin = new int[n]; tout = new int[n];
    }

    void dfs(int v) {
        color[v] = 1;
        tin[v] = timer++;
        for (int u : adj.get(v)) {
            if (color[u] == 0) dfs(u);
        }
        color[v] = 2;
        tout[v] = timer++;
    }
}
```

### 3.2 반복형
```java
static void dfsIterative(List<List<Integer>> adj, int start) {
    boolean[] visited = new boolean[adj.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int v = stack.pop();
        if (visited[v]) continue;
        visited[v] = true;
        for (int u : adj.get(v)) {
            if (!visited[u]) stack.push(u);
        }
    }
}
```

## 4. 복잡도
정점 수를 $V$, 간선 수를 $E$라 할 때 인접 리스트 기준 시간 복잡도는 $O(V+E)$이다. 각 정점은 한 번 방문되고 각 정점의 인접 리스트는 한 번씩 확인되며, 인접 리스트 길이의 합은 방향 그래프에서 $E$, 무방향 그래프에서 $2E$이다. 인접 행렬로 표현하면 $O(V^2)$이다.[^2] 공간 복잡도는 $O(V)$이며 재귀 호출 깊이는 최대 $V$이다. JVM은 스레드가 허용된 스택보다 큰 스택을 요구하면 `StackOverflowError`를 던지며, 허용 크기는 구현에 따라 다르고 제어 옵션이 제공될 수 있다. 정점이 매우 많은 선형 그래프처럼 재귀 깊이가 커지는 입력에서는 반복형이나 스레드 스택 크기 조정을 고려한다.[^3]

## 5. 시간 기록과 순서

### 5.1 진입·종료 시간
`tin`(진입 시간)과 `tout`(종료 시간)을 기록하면 $tin[i] < tin[j]$이고 $tout[i] > tout[j]$일 때 $i$가 $j$의 조상임을 판정할 수 있다.

### 5.2 방문 순서
- **전위(preorder)**: 첫 방문 순서
- **후위(postorder)**: 마지막 방문(종료) 순서
- **역후위(reverse postorder)**: 후위의 역순이며 위상 정렬에 사용

## 6. 간선 분류
| 간선 | 설명 |
|---|---|
| 트리 간선(tree edge) | 미방문 정점으로 가는 간선. DFS 트리를 이룬다 |
| 역방향 간선(back edge) | 조상으로 가는 간선. 사이클을 의미한다 |
| 순방향 간선(forward edge) | 자손으로 가는 비트리 간선. 방향 그래프에만 존재 |
| 교차 간선(cross edge) | 조상·자손 관계가 아닌 정점으로 가는 간선. 방향 그래프에만 존재 |

## 7. 활용

### 7.1 사이클 탐지
방향 그래프는 3색(미방문/방문 중/완료)을 쓴다. 방문 중(색 1)인 정점을 다시 만나면 역방향 간선이므로 사이클이다. 무방향 그래프는 부모를 제외하고 이미 방문한 정점을 만나면 사이클이다.[^4]

### 7.2 위상 정렬
**위상 정렬(topological sort)** 은 방향 비순환 그래프(DAG)에서 모든 간선 $v \to u$에 대해 $v$가 $u$보다 앞서도록 정점을 나열하는 것이다. DFS 종료 시점에 정점을 목록에 추가하고 목록을 뒤집는다. 간선 $v \to u$에서 $u$가 먼저 종료되므로 뒤집으면 $v$가 앞선다. 사이클이 있으면 위상 순서가 존재하지 않으며 시간 복잡도는 $O(V+E)$이다.

```java
// 반환값이 null이면 사이클
static List<Integer> topologicalSort(List<List<Integer>> adj) {
    int n = adj.size();
    int[] color = new int[n];
    List<Integer> order = new ArrayList<>();
    for (int v = 0; v < n; v++) {
        if (color[v] == 0 && !visit(adj, v, color, order)) return null;
    }
    Collections.reverse(order);
    return order;
}

static boolean visit(List<List<Integer>> adj, int v, int[] color, List<Integer> order) {
    color[v] = 1;
    for (int u : adj.get(v)) {
        if (color[u] == 1) return false;
        if (color[u] == 0 && !visit(adj, u, color, order)) return false;
    }
    color[v] = 2;
    order.add(v);
    return true;
}
```

### 7.3 강연결 요소
**강연결 요소(SCC, Strongly Connected Component)** 는 방향 그래프에서 서로 도달 가능한 정점의 최대 집합이다. Kosaraju 알고리즘은 원본 그래프를 DFS해 종료 시간을 기록하고, 간선을 뒤집은 전치 그래프를 종료 시간이 큰 정점부터 DFS한다. 각 DFS 트리가 SCC 하나이다. SCC를 하나의 정점으로 묶은 응축 그래프(condensation graph)는 비순환이며 시간 복잡도는 $O(V+E)$이다.

### 7.4 브리지
**브리지(bridge)** 는 제거하면 그래프가 분리되는 간선이다. `low[v]`를 $v$ 또는 그 자손에서 역방향 간선을 최대 한 번 써서 도달 가능한 최소 `tin`으로 정의하면, 트리 간선 $(v, to)$는 $low[to] > tin[v]$일 때 브리지이다. $to$의 서브트리가 $v$의 조상으로 우회할 수 없다는 뜻이다. 시간 복잡도는 $O(V+E)$이며 다중 간선이 있으면 부모로 가는 간선을 하나만 건너뛰도록 처리한다.

### 7.5 기타
단절점(articulation point), 최소 공통 조상(LCA), 미로 탐색·생성, [[backtracking]](순열·조합·N-Queens)에도 쓰인다. 단절점과 Tarjan SCC는 이 문서에서 다루지 않는다.

## 8. 장단점

### 8.1 장점
- 현재 경로 중심으로 상태를 유지하므로 [[bfs]]보다 메모리가 적은 경향이 있다.[^5]
- 진입·종료 시점 정보로 위상 정렬, 브리지, SCC 등 구조적 문제를 선형 시간에 해결한다.
- 경로 단위 상태를 되돌리는 백트래킹과 잘 맞는다.

### 8.2 단점
- 최단 경로를 보장하지 않는다.
- 방문 표시가 없거나 깊이 제한이 없으면 사이클 또는 무한 그래프에서 종료되지 않을 수 있다.
- 재귀 구현은 깊이가 크면 스택 오버플로 위험이 있다.

## 9. 문제 예시

### 9.1 LeetCode 200 Number of Islands
`'1'`(땅)과 `'0'`(물) 격자에서 상하좌우로 연결된 섬의 개수를 구한다. 미방문 땅에서 DFS를 시작할 때마다 섬 하나를 세고, 방문한 땅은 `'0'`으로 바꿔 표시한다.

```java
int numIslands(char[][] g) {
    int count = 0;
    for (int i = 0; i < g.length; i++)
        for (int j = 0; j < g[0].length; j++)
            if (g[i][j] == '1') { sink(g, i, j); count++; }
    return count;
}

void sink(char[][] g, int i, int j) {
    if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] != '1') return;
    g[i][j] = '0';
    sink(g, i + 1, j); sink(g, i - 1, j); sink(g, i, j + 1); sink(g, i, j - 1);
}
```

### 9.2 LeetCode 207 Course Schedule
선수 과목 관계 `[a, b]`(b를 먼저 들어야 a 수강)가 주어질 때 모든 과목을 이수할 수 있는지 판단한다. 선수 관계 방향 그래프에 사이클이 없으면 가능하므로 3색 DFS로 역방향 간선을 탐지한다.

```java
boolean canFinish(int n, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] p : prerequisites) adj.get(p[1]).add(p[0]);
    int[] color = new int[n];
    for (int v = 0; v < n; v++)
        if (color[v] == 0 && hasCycle(adj, v, color)) return false;
    return true;
}

boolean hasCycle(List<List<Integer>> adj, int v, int[] color) {
    color[v] = 1;
    for (int u : adj.get(v)) {
        if (color[u] == 1) return true;
        if (color[u] == 0 && hasCycle(adj, u, color)) return true;
    }
    color[v] = 2;
    return false;
}
```

### 9.3 LeetCode 210 Course Schedule II
207과 같은 입력에서 이수 가능한 과목 순서를 반환하며 불가능하면 빈 배열을 반환한다. 7.2의 위상 정렬을 그대로 적용하고 사이클이면 빈 배열을 반환한다.

### 9.4 LeetCode 79 Word Search
문자 격자에서 상하좌우로 인접한 칸을 이어 단어를 만들 수 있는지 판단하며 같은 칸은 한 번만 쓴다. 각 칸에서 DFS로 단어를 한 글자씩 맞춰 가고, 실패하면 방문 표시를 되돌리는 백트래킹을 쓴다.

```java
boolean exist(char[][] b, String word) {
    for (int i = 0; i < b.length; i++)
        for (int j = 0; j < b[0].length; j++)
            if (search(b, word, 0, i, j)) return true;
    return false;
}

boolean search(char[][] b, String w, int idx, int i, int j) {
    if (idx == w.length()) return true;
    if (i < 0 || j < 0 || i >= b.length || j >= b[0].length || b[i][j] != w.charAt(idx)) return false;
    char tmp = b[i][j];
    b[i][j] = '#'; // 사용 표시
    boolean found = search(b, w, idx + 1, i + 1, j) || search(b, w, idx + 1, i - 1, j)
                 || search(b, w, idx + 1, i, j + 1) || search(b, w, idx + 1, i, j - 1);
    b[i][j] = tmp; // 되돌리기
    return found;
}
```

### 9.5 LeetCode 46 Permutations
서로 다른 정수 배열의 모든 순열을 반환한다. 상태 공간 트리를 DFS로 탐색하며 사용 여부 배열로 원소를 선택하고 재귀 후 되돌리는 백트래킹을 쓴다.

```java
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, boolean[] used, List<Integer> cur, List<List<Integer>> result) {
    if (cur.size() == nums.length) { result.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        cur.add(nums[i]);
        backtrack(nums, used, cur, result);
        cur.remove(cur.size() - 1);
        used[i] = false;
    }
}
```

## 10. BFS와 비교
[[bfs]]의 9. DFS와 비교 참고.

---
## Sources
- [Depth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Depth-first_search)
- [Depth First Search (CP-Algorithms)](https://cp-algorithms.com/graph/depth-first-search.html)
- [Topological Sorting (CP-Algorithms)](https://cp-algorithms.com/graph/topological-sort.html)
- [Finding bridges (CP-Algorithms)](https://cp-algorithms.com/graph/bridge-searching.html)
- [Strongly connected components (CP-Algorithms)](https://cp-algorithms.com/graph/strongly-connected-components.html)
- [JVM Specification §2 Run-Time Data Areas (Oracle)](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
- [200. Number of Islands (LeetCode)](https://leetcode.com/problems/number-of-islands/)
- [207. Course Schedule (LeetCode)](https://leetcode.com/problems/course-schedule/)
- [210. Course Schedule II (LeetCode)](https://leetcode.com/problems/course-schedule-ii/)
- [79. Word Search (LeetCode)](https://leetcode.com/problems/word-search/)
- [46. Permutations (LeetCode)](https://leetcode.com/problems/permutations/)

---
## Related pages
- [[bfs]]
- [[backtracking]]

[^1]: 스택에 넣는 순서와 방문 처리 시점 때문에 반복형과 재귀형의 방문 순서가 다를 수 있다는 점은 구현 특성에서의 추론이다.
[^2]: 인접 리스트 길이 합이 방향 그래프에서 $E$, 무방향 그래프에서 $2E$라는 점과 인접 행렬 표현의 $O(V^2)$는 출처에 직접 서술되어 있지 않으며 그래프 표현 방식에서 도출한 내용이다. CP-Algorithms는 $n$(정점 수), $m$(간선 수)으로 $O(n+m)$, Wikipedia는 $O(|V|+|E|)$로 표기한다.
[^3]: JVM 명세는 StackOverflowError 조건만 정의하며 DFS 깊이의 구체적 한계 수치는 출처에 없다. 반복형 전환 권장은 그 조건에서의 추론이다.
[^4]: 무방향 그래프의 사이클 판정 방식은 조사한 출처에 명시되지 않아 일반적으로 알려진 방식을 기술했다. CP-Algorithms는 DFS 활용 목록에 사이클 탐지를 포함한다.
[^5]: 출처 간 공간 복잡도는 둘 다 $O(V)$로 같다. 메모리 차이는 BFS가 프런티어 전체를 저장한다는 서술(Wikipedia BFS)에서 도출한 일반적 경향이며 그래프 형태에 따라 달라질 수 있다.
