---
title: BFS (너비 우선 탐색)
updated: 2026-10-26 17:48:15
tags:
  - programming
  - algorithm
  - graph
---

## 1. 개요

BFS(Breadth-First Search)는 시작 정점으로부터의 최단 거리가 작은 정점부터 방문하는 그래프 탐색 알고리즘이다. 여기서 거리는 경로의 간선 수다. 방문할 정점을 선입선출 큐에 저장해 같은 거리의 정점을 처리한 뒤 다음 거리의 정점을 처리한다. 가중치가 없거나 모든 간선의 가중치가 같은 그래프에서 최단 경로를 구할 때 사용한다. 깊이 우선 탐색은 [[dfs]]를 참고한다.

## 2. 동작

### 2.1. 탐색 절차

1. 시작 정점의 거리를 0으로 설정하고 방문 처리한 뒤 큐에 넣는다.
2. 큐에서 정점 $v$를 꺼낸다.
3. $v$의 미방문 인접 정점 $u$의 거리를 $d[u]=d[v]+1$로, 직전 정점을 $p[u]=v$로 기록하고 방문 처리한 뒤 큐에 넣는다.
4. 큐가 빌 때까지 정점을 꺼내고 인접 정점을 검사하는 작업을 반복한다.

### 2.2. 방문 처리

방문 처리는 정점을 큐에 넣는 시점에 한다. 같은 정점으로 이어지는 경로가 여러 개여도 처음 발견한 경로가 최단 경로이므로, 이후 발견은 건너뛸 수 있다. 방문 처리를 큐에서 꺼내는 시점까지 미루면 여러 인접 정점이 같은 정점을 중복으로 넣을 수 있다.[^1]

`distance[neighbor] == -1`을 미방문 조건으로 사용하면 별도의 방문 배열이 필요 없다. 시작 정점의 거리는 0으로 설정하고, 처음 발견한 인접 정점의 거리는 현재 거리보다 1 크게 설정한다. 큐에는 거리가 감소하지 않는 순서로 정점이 들어 있으며, 큐 맨 앞 정점의 거리가 $d$이면 나머지 정점의 거리는 $d$ 또는 $d+1$이다.

### 2.3. 레벨 처리

같은 거리의 정점들을 묶어서 처리하려면 반복 시작 시점의 큐 크기를 저장하고 그 개수만큼만 꺼낸다. 처리 도중 새로 들어간 정점은 다음 레벨에 속한다. §7.2에서는 레벨 하나가 1분에 해당한다.[^2]

### 2.4. 비연결 그래프

시작점 하나에서 탐색하면 그 정점에서 도달할 수 있는 정점만 방문한다. 무방향 그래프 전체의 연결 요소를 구하려면 방문 상태를 유지하면서 모든 미방문 정점에서 BFS를 시작한다. §7.4에서도 같은 방식으로 모든 연결 요소를 검사한다.

## 3. 구현

### 3.1. 거리와 경로

정점 번호는 0부터 `adjacency.size() - 1`까지이며 시작점은 유효한 정점이라고 가정한다. `adjacency`는 각 정점의 인접 정점 목록이다. `distance[vertex]`는 시작점부터의 거리이며 -1이면 도달할 수 없다. `parent[vertex]`는 최단 경로에서 직전 정점이며 시작점과 미방문 정점에서는 -1이다.

각 탐색의 거리와 부모 배열을 `BfsResult`로 반환해 후속 탐색이 이전 결과를 덮어쓰지 않게 한다. `pathTo(target)`은 도착 정점에서 `parent`를 따라 거슬러 올라간 뒤 순서를 뒤집는다. 도달할 수 없는 정점은 빈 목록을 반환한다. 최단 경로가 여러 개이면 인접 정점 순서에 따라 그중 하나를 반환한다.[^3]

```java
import java.util.*;

class Bfs {
    static class BfsResult {
        final int[] distance;
        final int[] parent;

        BfsResult(int[] distance, int[] parent) {
            this.distance = distance;
            this.parent = parent;
        }

        List<Integer> pathTo(int target) {
            List<Integer> path = new ArrayList<>();
            if (distance[target] == -1) return path;
            // 직전 정점을 따라 거슬러 올라간 뒤 시작점부터의 순서로 뒤집는다.
            for (int vertex = target; vertex != -1; vertex = parent[vertex]) {
                path.add(vertex);
            }
            Collections.reverse(path);
            return path;
        }
    }

    static BfsResult bfs(List<List<Integer>> adjacency, int start) {
        int vertexCount = adjacency.size();
        int[] distance = new int[vertexCount];
        int[] parent = new int[vertexCount];
        Arrays.fill(distance, -1);
        Arrays.fill(parent, -1);

        Deque<Integer> queue = new ArrayDeque<>();
        distance[start] = 0;
        queue.addLast(start);
        while (!queue.isEmpty()) {
            int current = queue.removeFirst();
            for (int neighbor : adjacency.get(current)) {
                if (distance[neighbor] != -1) continue;
                // 큐에 넣기 전에 거리를 기록해 중복 삽입을 막는다.
                distance[neighbor] = distance[current] + 1;
                parent[neighbor] = current;
                queue.addLast(neighbor);
            }
        }
        return new BfsResult(distance, parent);
    }
}
```

### 3.2. 격자 탐색

격자는 각 칸을 정점, 상하좌우 인접 칸을 간선으로 보고 방향 배열로 순회한다. 격자는 비어 있지 않은 직사각형이며, 0은 이동 가능한 칸이고 1은 벽이다. 시작 좌표는 격자 범위 안에 있다고 가정한다. 반환 배열의 값은 시작점부터의 이동 횟수이며, 벽과 도달할 수 없는 칸은 -1이다. 시작 칸이 벽이면 모든 거리를 -1로 반환한다.[^3]

아래 코드와 이후 예시의 메서드는 클래스 내부에 선언하며 `java.util.*`를 import한다고 가정한다.

```java
static final int[] ROW_OFFSETS = {1, -1, 0, 0};
static final int[] COLUMN_OFFSETS = {0, 0, 1, -1};

static int[][] bfsGrid(int[][] grid, int startRow, int startColumn) {
    int height = grid.length;
    int width = grid[0].length;
    int[][] distance = new int[height][width];
    for (int[] row : distance) Arrays.fill(row, -1);

    // 시작 칸이 벽이면 탐색하지 않는다.
    if (grid[startRow][startColumn] != 0) return distance;

    Deque<int[]> queue = new ArrayDeque<>();
    distance[startRow][startColumn] = 0;
    queue.addLast(new int[]{startRow, startColumn});
    while (!queue.isEmpty()) {
        int[] current = queue.removeFirst();
        int row = current[0];
        int column = current[1];
        for (int direction = 0; direction < ROW_OFFSETS.length; direction++) {
            int nextRow = row + ROW_OFFSETS[direction];
            int nextColumn = column + COLUMN_OFFSETS[direction];
            if (nextRow < 0 || nextRow >= height
                    || nextColumn < 0 || nextColumn >= width) continue;
            if (grid[nextRow][nextColumn] != 0
                    || distance[nextRow][nextColumn] != -1) continue;

            // 큐에 넣기 전에 거리를 기록해 중복 삽입을 막는다.
            distance[nextRow][nextColumn] = distance[row][column] + 1;
            queue.addLast(new int[]{nextRow, nextColumn});
        }
    }
    return distance;
}
```

## 4. 복잡도

$V$는 정점 수, $E$는 간선 수다. 격자의 높이는 $h$, 너비는 $w$다. 다음 표의 보조 공간은 입력 그래프의 저장 공간을 제외하고 큐와 탐색 상태에 사용하는 공간이다.

| 표현 | 시간 | 보조 공간 |
|---|---|---|
| 인접 리스트 | $O(V+E)$ | $O(V)$ |
| 인접 행렬 | $O(V^2)$ | $O(V)$ |
| 상하좌우 격자 | $O(hw)$ | $O(hw)$ |

인접 리스트에서는 각 정점을 한 번 방문하고 각 정점의 인접 리스트를 한 번 확인한다. 인접 리스트 길이의 합은 방향 그래프에서 $E$, 무방향 그래프에서 $2E$다. 인접 행렬에서는 방문한 정점마다 최대 $V$개의 인접 여부를 검사한다. 격자에서는 정점이 $hw$개이며 각 칸에서 최대 4개의 이웃을 검사한다.[^4]

경로 복원에는 경로에 포함된 정점 수에 비례하는 시간과 결과 목록 공간이 추가된다.[^3]

## 5. 변형

### 5.1. 다중 시작점

시작 정점 여러 개를 처음에 모두 거리 0으로 방문 처리해 큐에 넣는다. 시작점들 중 하나에서 각 정점으로 도달하는 최소 거리를 한 번의 탐색으로 구한다. 이후 방문 처리와 거리 갱신은 일반 BFS와 같다. 여러 위치에서 동시에 전파되는 문제에 적용하며, §7.2가 예시다.

### 5.2. 0-1 BFS

간선 가중치가 0 또는 1인 그래프에서 단일 시작점의 최단 거리를 구한다. 일반 BFS와 달리 처음 발견한 거리보다 짧은 경로를 나중에 발견할 수 있다. 따라서 미방문 여부만 검사하지 않고, 새 거리 `candidateDistance`가 기존 거리보다 작을 때 갱신한다. 이 거리 갱신을 완화라고 한다.

가중치가 0이면 덱 앞에, 1이면 뒤에 넣는다. 가중치 0 간선은 거리를 늘리지 않으므로 앞에서 처리한다. 시간 복잡도는 거리 배열 초기화를 포함해 $O(V+E)$다.[^5] 반환 배열의 `Integer.MAX_VALUE`는 도달할 수 없음을 뜻한다. 정수 가중치 범위를 확장한 Dial 알고리즘은 각주를 참고한다.[^6]

```java
// 각 간선은 int[]{도착 정점, 가중치}로 표현하며 가중치는 0 또는 1이다.
static int[] bfs01(List<List<int[]>> adjacency, int start) {
    int[] distance = new int[adjacency.size()];
    Arrays.fill(distance, Integer.MAX_VALUE);
    Deque<Integer> deque = new ArrayDeque<>();
    distance[start] = 0;
    deque.addFirst(start);
    while (!deque.isEmpty()) {
        int current = deque.removeFirst();
        for (int[] edge : adjacency.get(current)) {
            int neighbor = edge[0];
            int weight = edge[1];
            int candidateDistance = distance[current] + weight;
            if (candidateDistance >= distance[neighbor]) continue;

            // 더 짧은 경로를 찾았을 때만 거리를 갱신한다.
            distance[neighbor] = candidateDistance;
            if (weight == 0) deque.addFirst(neighbor);
            else deque.addLast(neighbor);
        }
    }
    return distance;
}
```

### 5.3. 양방향 탐색

시작점과 도착점에서 각각 BFS를 수행해 두 탐색이 만나는 경로를 찾는다. 양쪽 탐색은 레벨 단위로 확장한다. 방향 그래프에서는 도착점 쪽 탐색에 간선을 뒤집은 그래프를 사용한다. 항상 탐색량이 줄어드는 것은 아니며 그래프의 형태에 따라 효과가 달라진다.[^7]

## 6. 적용과 비교

가중치 없는 그래프의 최단 경로, 무방향 그래프의 연결 요소 탐색, 이분 그래프 판별, 최소 이동 횟수를 구하는 상태 탐색, 최단 사이클 탐색에 사용한다. 이분 그래프 판별은 §7.4에서 다룬다.

무한 암시적 그래프에서도 각 정점의 이웃 수가 유한하고 해가 유한 깊이에 있으면 BFS는 해당 깊이까지 탐색해 해를 찾는다. 해가 없으면 탐색이 끝나지 않을 수 있으며, 탐색 중인 정점을 저장할 메모리도 필요하다.[^8]

일반 BFS는 간선 가중치가 서로 다르면 가중치 합의 최단 경로를 보장하지 않는다. 비음수 가중치에는 Dijkstra 등을 사용하고, 가중치가 0과 1로 제한되면 §5.2를 적용할 수 있다.

| 구분 | BFS | [[dfs]] |
|---|---|---|
| 자료구조 | 큐 | 스택 또는 재귀 |
| 인접 리스트 탐색 시간 | $O(V+E)$ | $O(V+E)$ |
| 최단 경로 | 가중치가 없거나 동일한 그래프에서 보장 | 일반적으로 보장하지 않음 |
| 대기 상태 | 같은 레벨과 다음 레벨의 정점 | 현재 탐색 경로와 미처리 분기 |
| 대표 용도 | 최단 거리, 레벨 순회 | 사이클, 위상 정렬, 백트래킹 |

BFS와 DFS의 메모리 사용량은 그래프 형태와 구현에 따라 달라진다. 방문 배열을 사용하는 일반 BFS와 재귀 DFS의 최악 보조 공간은 모두 $O(V)$다. BFS는 넓은 레벨에서 큐가 커지고, 재귀 DFS는 긴 경로에서 호출 스택이 깊어진다. 반복형 DFS는 중복 삽입 여부에 따라서도 공간 사용량이 달라진다.[^9]

## 7. 문제 예시

### 7.1. LeetCode 1091 Shortest Path in Binary Matrix

$n 	imes n$ 이진 격자에서 0인 칸만 지나 시작 칸 `(0, 0)`에서 도착 칸 `(n - 1, n - 1)`까지 8방향으로 이동하는 최단 경로를 구한다. 반환값은 이동 횟수가 아닌 경로에 포함된 칸 수이며 시작 칸도 포함하므로 초기 길이는 1이다. 경로가 없으면 -1을 반환한다.

각 이동의 비용이 같으므로 BFS를 사용한다. 방문한 칸을 1로 바꿔 중복 방문을 막으며 입력 격자가 변경된다. 행과 열의 이동량이 모두 0인 경우는 이동이 아니므로 제외한다.[^3]

```java
int shortestPathBinaryMatrix(int[][] grid) {
    int size = grid.length;
    if (grid[0][0] == 1 || grid[size - 1][size - 1] == 1) return -1;
    Deque<int[]> queue = new ArrayDeque<>();
    // 상태는 행, 열, 경로에 포함된 칸 수다. 시작 칸도 길이에 포함한다.
    queue.addLast(new int[]{0, 0, 1});
    grid[0][0] = 1;
    while (!queue.isEmpty()) {
        int[] current = queue.removeFirst();
        int row = current[0];
        int column = current[1];
        int pathLength = current[2];
        if (row == size - 1 && column == size - 1) return pathLength;
        for (int rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (int columnOffset = -1; columnOffset <= 1; columnOffset++) {
                if (rowOffset == 0 && columnOffset == 0) continue;
                int nextRow = row + rowOffset;
                int nextColumn = column + columnOffset;
                if (nextRow < 0 || nextRow >= size
                        || nextColumn < 0 || nextColumn >= size) continue;
                if (grid[nextRow][nextColumn] != 0) continue;

                // 큐에 넣을 때 입력 격자를 변경해 방문을 표시한다.
                grid[nextRow][nextColumn] = 1;
                queue.addLast(new int[]{nextRow, nextColumn, pathLength + 1});
            }
        }
    }
    return -1;
}
```

### 7.2. LeetCode 994 Rotting Oranges

격자의 0은 빈 칸, 1은 신선한 오렌지, 2는 썩은 오렌지다. 썩은 오렌지는 매분 상하좌우의 신선한 오렌지를 썩게 한다. 신선한 오렌지가 남지 않을 때까지의 최소 시간을 구하고, 불가능하면 -1을 반환한다. 처음부터 신선한 오렌지가 없으면 0이다.

썩은 오렌지 전체를 거리 0의 시작점으로 넣는 다중 시작점 BFS다. `levelSize`에 현재 큐 크기를 저장해 같은 분에 전파할 칸만 처리한다. 새로 썩은 칸은 다음 레벨에서 처리한다. 방문한 오렌지를 2로 바꾸므로 입력 격자가 변경된다.[^2]

```java
int orangesRotting(int[][] grid) {
    int height = grid.length;
    int width = grid[0].length;
    int freshCount = 0;
    int minutes = 0;
    Deque<int[]> queue = new ArrayDeque<>();
    for (int row = 0; row < height; row++) {
        for (int column = 0; column < width; column++) {
            if (grid[row][column] == 2) queue.addLast(new int[]{row, column});
            else if (grid[row][column] == 1) freshCount++;
        }
    }
    int[] rowOffsets = {1, -1, 0, 0};
    int[] columnOffsets = {0, 0, 1, -1};
    while (!queue.isEmpty() && freshCount > 0) {
        // 이번 분에 전파할 칸만 처리한다. 새로 썩은 칸은 다음 레벨에 속한다.
        int levelSize = queue.size();
        for (int processed = 0; processed < levelSize; processed++) {
            int[] current = queue.removeFirst();
            for (int direction = 0; direction < rowOffsets.length; direction++) {
                int nextRow = current[0] + rowOffsets[direction];
                int nextColumn = current[1] + columnOffsets[direction];
                if (nextRow < 0 || nextRow >= height
                        || nextColumn < 0 || nextColumn >= width) continue;
                if (grid[nextRow][nextColumn] != 1) continue;

                // 즉시 썩은 상태로 바꿔 여러 칸에서 중복 전파하지 않게 한다.
                grid[nextRow][nextColumn] = 2;
                freshCount--;
                queue.addLast(new int[]{nextRow, nextColumn});
            }
        }
        minutes++;
    }
    return freshCount == 0 ? minutes : -1;
}
```

### 7.3. LeetCode 127 Word Ladder

단어를 한 글자씩 바꿔 `beginWord`에서 `endWord`로 가는 최단 변환 수열을 구한다. 시작 단어 이후의 모든 단어는 `wordList`에 있어야 한다. 반환값은 변환 횟수가 아닌 수열의 단어 수이며, 변환이 불가능하면 0이다.

단어를 정점, 한 글자 차이를 간선으로 보는 암시적 그래프다. 각 위치의 글자를 다른 영문 소문자로 바꿔 이웃을 생성하고, `words`에서 제거에 성공한 단어만 큐에 넣는다. 집합에서 제거하는 것이 방문 처리이며, 같은 단어가 다시 큐에 들어가는 것을 막는다. 한 위치의 치환을 마치면 원래 문자를 복원한다.[^3]

```java
int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> words = new HashSet<>(wordList);
    if (!words.contains(endWord)) return 0;
    Deque<String> queue = new ArrayDeque<>();
    queue.addLast(beginWord);
    words.remove(beginWord);
    int sequenceLength = 1; // 시작 단어도 수열에 포함한다.
    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        for (int processed = 0; processed < levelSize; processed++) {
            String current = queue.removeFirst();
            if (current.equals(endWord)) return sequenceLength;
            char[] characters = current.toCharArray();
            for (int position = 0; position < characters.length; position++) {
                char originalCharacter = characters[position];
                for (char replacement = 'a'; replacement <= 'z'; replacement++) {
                    if (replacement == originalCharacter) continue;
                    characters[position] = replacement;
                    String neighbor = new String(characters);
                    // 미방문 단어만 큐에 넣고 집합에서 제거해 방문을 표시한다.
                    if (words.remove(neighbor)) queue.addLast(neighbor);
                }
                characters[position] = originalCharacter;
            }
        }
        sequenceLength++;
    }
    return 0;
}
```

### 7.4. LeetCode 785 Is Graph Bipartite?

무방향 그래프의 정점을 두 집합으로 나눠 모든 간선이 서로 다른 집합을 잇게 할 수 있는지 판별한다. 그래프는 연결되어 있지 않을 수 있다.

`color`의 0은 미방문, 1과 -1은 두 집합을 나타낸다. 인접 정점을 반대 색으로 칠하고, 이미 같은 색이면 `false`를 반환한다. 바깥 반복문은 모든 미방문 정점에서 탐색을 시작해 각 연결 요소를 검사한다.[^3]

```java
boolean isBipartite(int[][] graph) {
    int[] color = new int[graph.length]; // 0은 미방문, 1과 -1은 두 집합의 색이다.
    // 비연결 그래프도 검사하도록 각 미방문 정점에서 새 탐색을 시작한다.
    for (int start = 0; start < graph.length; start++) {
        if (color[start] != 0) continue;
        Deque<Integer> queue = new ArrayDeque<>();
        color[start] = 1;
        queue.addLast(start);
        while (!queue.isEmpty()) {
            int current = queue.removeFirst();
            for (int neighbor : graph[current]) {
                if (color[neighbor] == color[current]) return false;
                if (color[neighbor] != 0) continue;
                color[neighbor] = -color[current];
                queue.addLast(neighbor);
            }
        }
    }
    return true;
}
```

---

## Sources
- [Princeton: BreadthFirstPaths 소스](https://raw.githubusercontent.com/kevin-wayne/algs4/master/src/main/java/edu/princeton/cs/algs4/BreadthFirstPaths.java)
- [Poole·Mackworth: Uninformed Search Strategies](https://artint.info/3e/html/ArtInt3e.Ch3.S5.html)
- [NetworkX: Unweighted Shortest Paths 소스](https://networkx.org/documentation/stable/_modules/networkx/algorithms/shortest_paths/unweighted.html)
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

---

[^1]: 큐 삽입 시 방문 처리는 Princeton 구현에서 확인된다. 중복 삽입을 막는 이유는 여러 인접 정점이 같은 정점을 발견하는 경우에서 도출했다.
[^2]: 레벨별 큐 크기 처리와 경과 시간의 관계는 LeetCode 994의 동시 전파 조건을 코드로 구현한 설명이다.
[^3]: 변수명, 반환 형식, 미도달 값, 격자 시작점 처리, 이웃 생성과 경로 복원 비용은 이 문서의 Java 예시를 기준으로 설명했다. 문제 예시의 반환 기준은 각 LeetCode 문제 정의를 따른다.
[^4]: 인접 리스트의 시간·보조 공간은 Princeton 구현을 기준으로 한다. 인접 리스트 길이 합, 인접 행렬의 $O(V^2)$, 격자의 $O(hw)$는 그래프 표현과 이웃 수에서 도출했다.
[^5]: CP-Algorithms는 0-1 BFS를 $O(E)$로 설명한다. 이 문서는 정점 수만큼의 거리 배열 초기화 비용도 포함해 $O(V+E)$로 표기한다.
[^6]: 가중치가 0부터 $k$까지의 정수이면 $k+1$개의 순환 버킷을 사용하는 Dial 알고리즘으로 확장할 수 있다. CP-Algorithms의 Dial's algorithm 설명을 따른다.
[^7]: NetworkX의 양방향 탐색은 양쪽 프런티어를 레벨 단위로 확장하고 방향 그래프에서는 도착점 쪽의 선행 정점을 사용한다. 탐색량 감소가 항상 보장되지 않는다는 설명은 그래프 구조에 따라 두 탐색의 방문 범위가 달라진다는 점에서 도출했다.
[^8]: Poole·Mackworth 교재의 레벨 순 탐색과 완전성 설명에 각 레벨을 유한 시간에 처리한다는 전제를 명시했다. 이웃 수가 유한하면 유한 깊이의 정점 수가 유한하므로 해당 깊이의 해에 도달한다.
[^9]: 메모리 비교는 큐, 방문 배열, 재귀 호출 스택에 저장하는 상태에서 도출했다. 반복형 DFS의 중복 삽입에 따른 공간 차이는 [[dfs]] §2.2·§3.2를 참고한다.
