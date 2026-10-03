---
title: BFS (너비 우선 탐색)
updated: 2026-10-03 23:33:29
tags:
  - programming
  - algorithm
  - graph
---

## 1. 개요
**BFS(Breadth-First Search)** 는 시작 정점에서 가까운 정점부터 레벨 순으로 방문하는 그래프 탐색 알고리즘이다. 간선 수가 같은 정점을 모두 방문한 뒤 다음 레벨로 넘어가며, 방문 대기 정점은 큐(Queue)로 관리한다. 가중치 없는 그래프에서 시작 정점으로부터의 최단 거리(간선 수 기준)를 구하는 데 쓰인다. 깊이 우선 탐색은 [[dfs]] 참고.

## 2. 동작

### 2.1 절차
1. 시작 정점을 방문 처리하고 큐에 넣는다.
2. 큐에서 정점 $v$를 꺼낸다.
3. $v$의 미방문 인접 정점 $u$를 방문 처리하고 $d[u]=d[v]+1$, $p[u]=v$를 기록한 뒤 큐에 넣는다.
4. 큐가 빌 때까지 2~3을 반복한다.

### 2.2 방문 처리 시점
방문 처리는 큐에 넣는 시점에 한다. 꺼내는 시점에 하면 같은 정점이 큐에 중복 삽입될 수 있다. 이 방식에서 큐 안의 정점은 거리가 $d$인 정점과 $d+1$인 정점으로만 구성되고 거리 순 정렬 상태가 유지된다.[^1]

## 3. 구현

### 3.1 거리와 경로 복원
`dist[]`에 거리, `parent[]`에 직전 정점을 기록한다. 경로는 도착 정점에서 `parent`를 따라 거슬러 올라간 뒤 뒤집어 복원한다.

```java
import java.util.*;

class Bfs {
    static int[] dist, parent;

    static void bfs(List<List<Integer>> adj, int start) {
        int n = adj.size();
        dist = new int[n];
        parent = new int[n];
        Arrays.fill(dist, -1);
        Arrays.fill(parent, -1);
        Deque<Integer> queue = new ArrayDeque<>();
        dist[start] = 0;
        queue.add(start);
        while (!queue.isEmpty()) {
            int cur = queue.poll();
            for (int next : adj.get(cur)) {
                if (dist[next] == -1) {
                    dist[next] = dist[cur] + 1;
                    parent[next] = cur;
                    queue.add(next);
                }
            }
        }
    }

    // 도착 정점에서 parent를 따라 거슬러 올라간 뒤 뒤집는다
    static List<Integer> path(int to) {
        List<Integer> path = new ArrayList<>();
        if (dist[to] == -1) return path;
        for (int v = to; v != -1; v = parent[v]) path.add(v);
        Collections.reverse(path);
        return path;
    }
}
```

### 3.2 격자 BFS
격자는 각 칸을 정점, 상하좌우 인접 칸을 간선으로 보고 방향 배열로 순회한다.

```java
static final int[] DX = {1, -1, 0, 0};
static final int[] DY = {0, 0, 1, -1};

static int[][] bfsGrid(int[][] grid, int sx, int sy) {
    int h = grid.length, w = grid[0].length;
    int[][] dist = new int[h][w];
    for (int[] row : dist) Arrays.fill(row, -1);
    Deque<int[]> queue = new ArrayDeque<>();
    dist[sx][sy] = 0;
    queue.add(new int[]{sx, sy});
    while (!queue.isEmpty()) {
        int[] c = queue.poll();
        for (int k = 0; k < 4; k++) {
            int x = c[0] + DX[k], y = c[1] + DY[k];
            if (x >= 0 && y >= 0 && x < h && y < w && grid[x][y] == 0 && dist[x][y] == -1) {
                dist[x][y] = dist[c[0]][c[1]] + 1;
                queue.add(new int[]{x, y});
            }
        }
    }
    return dist;
}
```

## 4. 복잡도
정점 수를 $V$, 간선 수를 $E$라 할 때 인접 리스트 기준 시간 복잡도는 $O(V+E)$이다. 각 정점은 한 번 방문되고 각 정점의 인접 리스트는 한 번씩 확인되며, 인접 리스트 길이의 합은 방향 그래프에서 $E$, 무방향 그래프에서 $2E$이다. 인접 행렬로 표현하면 $O(V^2)$이다.[^2] 공간은 큐와 방문·거리·부모 배열에 $O(V)$를 쓴다. 격자 $h \times w$에서는 $V=hw$, $E \le 4hw$이므로 $O(hw)$이다.[^3]

## 5. 변형

### 5.1 0-1 BFS
간선 가중치가 0 또는 1인 그래프의 단일 출발점 최단 경로를 구한다. 큐 대신 deque를 써서 가중치 0 간선으로 도달한 정점은 앞에, 1 간선으로 도달한 정점은 뒤에 넣는다. 시간 복잡도는 $O(E)$로 우선순위 큐를 쓰는 Dijkstra의 $O(E\log V)$보다 작다. 가중치가 최대 $k$인 경우로 확장한 것이 **Dial 알고리즘**이며 $k+1$개의 순환 버킷을 사용한다.

```java
static int[] bfs01(List<List<int[]>> adj, int start) { // int[]{to, weight}
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, Integer.MAX_VALUE);
    Deque<Integer> deque = new ArrayDeque<>();
    dist[start] = 0;
    deque.add(start);
    while (!deque.isEmpty()) {
        int v = deque.pollFirst();
        for (int[] e : adj.get(v)) {
            if (dist[v] + e[1] < dist[e[0]]) {
                dist[e[0]] = dist[v] + e[1];
                if (e[1] == 0) deque.addFirst(e[0]);
                else deque.addLast(e[0]);
            }
        }
    }
    return dist;
}
```

### 5.2 다중 시작점 BFS
시작 정점 여러 개를 처음에 모두 거리 0으로 큐에 넣는다. 각 정점에서 가장 가까운 시작점까지의 거리를 한 번의 탐색으로 구한다.[^4]

### 5.3 양방향 BFS
시작점과 도착점에서 동시에 탐색해 두 탐색이 만나는 지점을 찾는다. 탐색 범위를 줄이기 위한 기법이다.[^4]

## 6. 장단점

### 6.1 장점
- 가중치 없는 그래프에서 최단 경로를 보장한다.
- 해가 존재하면 반드시 찾는다(완전성).
- 무한 암시적 그래프에서도 동작한다.

### 6.2 단점
- 프런티어(큐에 있는 정점)를 모두 저장하므로 [[dfs]]보다 메모리를 많이 쓴다.
- 가중치가 임의의 양수인 그래프에서는 최단 경로를 보장하지 않으므로 Dijkstra가 필요하다.

## 7. 활용
- 가중치 없는 그래프의 최단 경로
- 연결 요소 탐색
- 이분 그래프 판별(레벨 홀짝으로 2색 칠하기)
- 최소 이동 횟수 게임 상태 탐색
- 최단 사이클 탐색

## 8. 문제 예시

### 8.1 LeetCode 1091 Shortest Path in Binary Matrix
n×n 이진 격자에서 0인 칸만 지나 (0,0)에서 (n-1,n-1)까지 8방향으로 이동하는 최단 경로 길이를 구한다. 경로가 없으면 -1이다. 간선 가중치가 모두 1이므로 BFS를 사용하고, 방문한 칸을 1로 바꿔 방문 표시를 대신한다.

```java
int shortestPathBinaryMatrix(int[][] g) {
    int n = g.length;
    if (g[0][0] == 1 || g[n-1][n-1] == 1) return -1;
    Deque<int[]> q = new ArrayDeque<>();
    q.add(new int[]{0, 0, 1});
    g[0][0] = 1;
    while (!q.isEmpty()) {
        int[] c = q.poll();
        if (c[0] == n - 1 && c[1] == n - 1) return c[2];
        for (int dx = -1; dx <= 1; dx++)
            for (int dy = -1; dy <= 1; dy++) {
                int x = c[0] + dx, y = c[1] + dy;
                if (x >= 0 && y >= 0 && x < n && y < n && g[x][y] == 0) {
                    g[x][y] = 1;
                    q.add(new int[]{x, y, c[2] + 1});
                }
            }
    }
    return -1;
}
```

### 8.2 LeetCode 994 Rotting Oranges
격자에서 썩은 오렌지(2)가 매분 상하좌우의 신선한 오렌지(1)를 썩게 한다. 모든 오렌지가 썩는 최소 시간을 구하며 불가능하면 -1이다. 썩은 오렌지 전체를 처음에 큐에 넣는 다중 시작점 BFS이며 레벨 수가 경과 시간이다.

```java
int orangesRotting(int[][] g) {
    int h = g.length, w = g[0].length, fresh = 0, minutes = 0;
    Deque<int[]> q = new ArrayDeque<>();
    for (int i = 0; i < h; i++)
        for (int j = 0; j < w; j++) {
            if (g[i][j] == 2) q.add(new int[]{i, j});
            else if (g[i][j] == 1) fresh++;
        }
    int[] dx = {1, -1, 0, 0}, dy = {0, 0, 1, -1};
    while (!q.isEmpty() && fresh > 0) {
        for (int size = q.size(); size > 0; size--) { // 레벨 단위 처리
            int[] c = q.poll();
            for (int k = 0; k < 4; k++) {
                int x = c[0] + dx[k], y = c[1] + dy[k];
                if (x >= 0 && y >= 0 && x < h && y < w && g[x][y] == 1) {
                    g[x][y] = 2;
                    fresh--;
                    q.add(new int[]{x, y});
                }
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}
```

### 8.3 LeetCode 127 Word Ladder
단어를 한 글자씩 바꿔 beginWord에서 endWord로 가는 최단 변환 수열의 단어 수를 구한다. 중간 단어는 wordList에 있어야 하며 변환이 불가능하면 0이다. 단어를 정점, 한 글자 차이를 간선으로 보는 암시적 그래프의 최단 경로 문제로, 각 단어의 글자를 a~z로 바꿔 wordList에 있는지 확인하며 BFS한다.

```java
int ladderLength(String begin, String end, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(end)) return 0;
    Deque<String> q = new ArrayDeque<>();
    q.add(begin);
    words.remove(begin);
    int steps = 1;
    while (!q.isEmpty()) {
        for (int size = q.size(); size > 0; size--) {
            String cur = q.poll();
            if (cur.equals(end)) return steps;
            char[] cs = cur.toCharArray();
            for (int i = 0; i < cs.length; i++) {
                char orig = cs[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    cs[i] = c;
                    String next = new String(cs);
                    if (words.remove(next)) q.add(next); // 방문 처리를 삭제로 대신
                }
                cs[i] = orig;
            }
        }
        steps++;
    }
    return 0;
}
```

### 8.4 LeetCode 785 Is Graph Bipartite?
무방향 그래프의 정점을 두 집합으로 나눠 모든 간선이 서로 다른 집합을 잇게 할 수 있는지 판별한다. BFS로 정점에 두 색을 번갈아 칠하고 인접 정점의 색이 같으면 false이다. 연결되지 않은 그래프를 위해 모든 미방문 정점에서 탐색을 시작한다.

```java
boolean isBipartite(int[][] graph) {
    int[] color = new int[graph.length]; // 0 미방문, 1/-1 색
    for (int s = 0; s < graph.length; s++) {
        if (color[s] != 0) continue;
        Deque<Integer> q = new ArrayDeque<>();
        color[s] = 1;
        q.add(s);
        while (!q.isEmpty()) {
            int v = q.poll();
            for (int u : graph[v]) {
                if (color[u] == color[v]) return false;
                if (color[u] == 0) { color[u] = -color[v]; q.add(u); }
            }
        }
    }
    return true;
}
```

## 9. DFS와 비교
| 구분 | BFS | [[dfs]] |
|---|---|---|
| 자료구조 | 큐 | 스택/재귀 |
| 시간 | $O(V+E)$ | $O(V+E)$ |
| 최단 경로 | 가중치 없는 그래프에서 보장 | 보장 안 함 |
| 메모리 | 프런티어 전체 저장 | 현재 경로 중심 |
| 대표 용도 | 최단 거리, 레벨 순회 | 사이클, 위상 정렬, 백트래킹 |

---
## Sources
- [Breadth-first search (Wikipedia)](https://en.wikipedia.org/wiki/Breadth-first_search)
- [Breadth-first search (CP-Algorithms)](https://cp-algorithms.com/graph/breadth-first-search.html)
- [0-1 BFS (CP-Algorithms)](https://cp-algorithms.com/graph/01_bfs.html)
- [1091. Shortest Path in Binary Matrix (LeetCode)](https://leetcode.com/problems/shortest-path-in-binary-matrix/)
- [994. Rotting Oranges (LeetCode)](https://leetcode.com/problems/rotting-oranges/)
- [127. Word Ladder (LeetCode)](https://leetcode.com/problems/word-ladder/)
- [785. Is Graph Bipartite? (LeetCode)](https://leetcode.com/problems/is-graph-bipartite/)

---
## Related pages
- [[dfs]]

[^1]: CP-Algorithms는 큐 안의 정점 거리가 최대 1만 차이 난다는 성질을 0-1 BFS의 정당성 근거로 사용한다. 큐에 넣는 시점의 방문 처리 필요성은 구현에서의 일반적 관행이며 출처에 명시적 서술은 없다.
[^2]: 인접 리스트 길이 합이 방향 그래프에서 $E$, 무방향 그래프에서 $2E$라는 점과 인접 행렬 표현의 $O(V^2)$는 출처에 직접 서술되어 있지 않으며 그래프 표현 방식에서 도출한 내용이다. CP-Algorithms는 $n$(정점 수), $m$(간선 수)으로 $O(n+m)$, Wikipedia는 $O(|V|+|E|)$로 표기한다.
[^3]: 격자 복잡도는 격자를 정점 $hw$개, 인접 칸을 간선으로 보는 데서 도출한 추론이다.
[^4]: 다중 시작점 BFS와 양방향 BFS는 조사한 출처에 상세 서술이 없어 일반적으로 알려진 내용을 최소한으로 기술했다.
