---
title: DFS (깊이 우선 탐색)
updated: 2026-10-26 17:59:20
tags:
  - programming
  - algorithm
  - graph
---

## 1. 개요

DFS(Depth-First Search)는 현재 정점의 미방문 이웃을 따라 깊게 탐색하고, 더 탐색할 이웃이 없으면 이전 정점으로 돌아가는 그래프 탐색 알고리즘이다. 재귀 호출이나 명시적 스택으로 구현한다. 시작점 하나에서 탐색하면 그 정점에서 도달할 수 있는 정점들을 방문한다.

일반 그래프에서 최단 경로를 보장하지 않는다. 방문 상태와 진입·종료 순서를 이용해 사이클 탐지, 위상 정렬, 강연결 요소 등의 문제를 해결한다. 최단 이동 횟수가 필요하면 [[bfs]]를 검토한다.

## 2. 동작

### 2.1. 재귀형

1. 현재 정점을 탐색 중으로 표시하고 진입 순번을 기록한다.
2. 인접한 미방문 정점마다 재귀 호출한다.
3. 모든 이웃을 처리하면 탐색 완료로 표시하고 종료 순번을 기록한 뒤 반환한다.

### 2.2. 반복형

재귀 호출 대신 명시적 스택에 탐색 상태를 저장한다. §3.2에서는 각 정점에서 아직 검사하지 않은 이웃을 가리키는 반복자를 저장한다. 스택 맨 위의 정점에서 미방문 이웃을 찾으면 그 이웃으로 내려가고, 이웃을 모두 처리하면 스택에서 꺼내 이전 정점으로 돌아간다. 인접 목록 순서가 같으면 재귀형과 같은 첫 방문 순서를 만든다.[^1]

### 2.3. 비연결 그래프

시작점 하나의 DFS로 방문하지 못한 정점이 남을 수 있다. 그래프 전체를 처리하려면 방문 상태를 유지하면서 모든 미방문 정점에서 DFS를 시작한다. 여러 DFS 트리를 합친 결과를 DFS 포리스트라고 한다.

## 3. 구현

### 3.1. 재귀형

정점 번호는 0부터 `adjacency.size() - 1`까지이며 시작점은 유효한 정점이라고 가정한다. `adjacency`는 인접 정점 목록이다. `color`의 0은 미방문, 1은 탐색 중, 2는 탐색 완료를 뜻한다. `entryTime`과 `exitTime`에는 진입·종료 순번을 기록하고, 미방문 정점은 -1로 구분한다.

`dfs(start)`는 시작점에서 도달할 수 있는 미방문 정점만 처리하고, `dfsAll()`은 남은 모든 미방문 정점을 처리한다. 상태는 인스턴스에 유지되므로 독립적인 새 탐색에는 새 `Dfs` 인스턴스를 사용한다.[^1]

```java
import java.util.*;

class Dfs {
    final List<List<Integer>> adjacency;
    final int[] color; // 0: 미방문, 1: 탐색 중, 2: 탐색 완료
    final int[] entryTime;
    final int[] exitTime;
    int time = 0;

    Dfs(List<List<Integer>> adjacency) {
        this.adjacency = adjacency;
        int vertexCount = adjacency.size();
        color = new int[vertexCount];
        entryTime = new int[vertexCount];
        exitTime = new int[vertexCount];
        Arrays.fill(entryTime, -1);
        Arrays.fill(exitTime, -1);
    }

    void dfs(int start) {
        if (color[start] != 0) return;
        visit(start);
    }

    void dfsAll() {
        // 기존 방문 상태를 유지해 각 정점을 한 번만 탐색한다.
        for (int vertex = 0; vertex < adjacency.size(); vertex++) {
            dfs(vertex);
        }
    }

    private void visit(int vertex) {
        color[vertex] = 1;
        entryTime[vertex] = time++; // 탐색 시작 순번
        for (int neighbor : adjacency.get(vertex)) {
            if (color[neighbor] == 0) visit(neighbor);
        }
        color[vertex] = 2;
        exitTime[vertex] = time++; // 모든 이웃을 처리한 뒤 종료 순번 기록
    }
}
```

### 3.2. 반복형

이웃 반복자를 스택에 저장해 재귀 호출의 진행 위치를 유지하고 첫 방문 순서를 반환한다. 한 정점을 처음 방문할 때만 반복자를 추가하므로 스택 깊이는 최대 정점 수다.[^1]

아래 코드와 이후 예시의 메서드는 클래스 내부에 선언하며 `java.util.*`를 import한다고 가정한다.

```java
static List<Integer> dfsIterative(
        List<List<Integer>> adjacency, int start) {
    boolean[] visited = new boolean[adjacency.size()];
    List<Integer> order = new ArrayList<>();

    // 스택의 각 반복자는 해당 정점에서 아직 검사하지 않은 이웃을 나타낸다.
    Deque<Iterator<Integer>> stack = new ArrayDeque<>();
    visited[start] = true;
    order.add(start);
    stack.push(adjacency.get(start).iterator());

    while (!stack.isEmpty()) {
        Iterator<Integer> neighbors = stack.peek();
        if (!neighbors.hasNext()) {
            stack.pop(); // 모든 이웃을 처리했으므로 이전 정점으로 돌아간다.
            continue;
        }

        int neighbor = neighbors.next();
        if (visited[neighbor]) continue;

        visited[neighbor] = true;
        order.add(neighbor);
        stack.push(adjacency.get(neighbor).iterator());
    }
    return order;
}
```

## 4. 복잡도

$V$는 정점 수, $E$는 간선 수다. 다음 표의 보조 공간은 입력 그래프 저장 공간을 제외한다. 반복형은 §3.2의 이웃 반복자 방식이 기준이다.

| 구현·표현 | 시간 | 보조 공간 |
|---|---|---|
| 재귀형·인접 리스트 | $O(V+E)$ | $O(V)$ |
| 반복형·인접 리스트 | $O(V+E)$ | $O(V)$ |
| 인접 행렬 | $O(V^2)$ | $O(V)$ |

인접 리스트에서는 각 정점을 한 번 방문하고 각 정점의 이웃을 한 번 검사한다. 인접 리스트 길이의 합은 방향 그래프에서 $E$, 무방향 그래프에서 $2E$다. 인접 행렬에서는 방문한 정점마다 최대 $V$개의 인접 여부를 검사한다. 방문 상태와 시간 배열, 호출 스택 또는 명시적 스택에 $O(V)$ 공간을 쓴다.[^2]

재귀 깊이는 최악의 경우 $V$다. 긴 경로를 탐색하면 호출 스택이 깊어져 `StackOverflowError`가 발생할 수 있다. Java의 고정된 안전 깊이는 없으며 실행 환경에 따라 달라진다. 깊이가 클 수 있는 입력에서는 반복형을 고려한다.[^3]

## 5. 시간과 순서

### 5.1. 진입·종료 시간

`entryTime[vertex]`는 정점의 탐색을 시작할 때 부여한 순번이고, `exitTime[vertex]`는 모든 인접 정점의 처리를 마칠 때 부여한 순번이다. 실제 경과 시간이 아니라 탐색 이벤트의 순서다.

동일한 탐색에서 방문한 서로 다른 정점 $u$, $v$에 대해 다음 조건이 성립하면 $u$는 DFS 트리에서 $v$의 조상이다. 원본 그래프의 일반적인 도달 관계를 판정하는 조건은 아니다.[^4]

$$entryTime[u] < entryTime[v] < exitTime[v] < exitTime[u]$$

### 5.2. 방문 순서

- **전위(preorder)**: 정점을 처음 방문한 순서다.
- **후위(postorder)**: 정점의 탐색을 종료한 순서다.
- **역후위(reverse postorder)**: 후위의 역순이다. 방향 비순환 그래프에서는 위상 순서가 된다.

## 6. 간선 분류

방향 그래프의 간선은 DFS 트리의 관계에 따라 다음과 같이 분류한다. 현재 정점의 간선을 검사할 때 목적지가 미방문이면 트리 간선, 탐색 중이면 역방향 간선이다. 목적지가 완료 상태이면 DFS 트리의 자손인지에 따라 순방향 또는 교차 간선으로 구분한다.

| 간선 | 설명 |
|---|---|
| 트리 간선(tree edge) | 미방문 정점을 처음 발견한 간선 |
| 역방향 간선(back edge) | 탐색 중인 조상 또는 자기 자신으로 가는 간선 |
| 순방향 간선(forward edge) | DFS 트리의 자손으로 가는 비트리 간선 |
| 교차 간선(cross edge) | 조상·자손 관계가 아닌 정점으로 가는 간선 |

역방향 간선은 방향 그래프의 사이클을 나타내며 자기 루프도 포함한다. 무방향 그래프에서는 부모로 되돌아가는 동일 간선의 반대 방향을 별도로 취급해야 한다. 동일 간선을 하나로 보면 트리 간선과 역방향 간선만 존재한다.[^5]

## 7. 활용

### 7.1. 사이클 탐지

방향 그래프는 §3.1의 3색 상태를 사용한다. 탐색 중인 정점으로 가는 간선이 있으면 현재 재귀 경로로 되돌아가므로 사이클이다. 탐색 완료 상태의 정점으로 가는 간선만으로는 사이클이라고 판단하지 않는다.

무방향 단순 그래프에서는 부모 간선을 제외하고 이미 방문한 정점을 만나면 사이클이다. 다중 간선이 있으면 부모 정점으로 가는 간선을 모두 제외해서는 안 된다. 간선 ID를 저장하는 등의 방법으로 탐색에 사용한 부모 간선만 구분해야 한다.[^6]

### 7.2. 위상 정렬

위상 정렬(topological sort)은 방향 비순환 그래프(DAG, Directed Acyclic Graph)에서 각 간선의 출발 정점이 도착 정점보다 앞에 오도록 정점을 나열하는 것이다. DFS 종료 시점에 정점을 목록에 추가하고 목록을 뒤집는다. DAG에서는 간선의 도착 정점이 출발 정점보다 먼저 종료되므로 역후위가 위상 순서가 된다.

사이클이 있으면 위상 순서가 존재하지 않는다. 다음 코드는 사이클이 있으면 `null`을 반환한다. 모든 정점을 처리하며 시간 복잡도는 $O(V+E)$다.

```java
// 사이클이 있으면 null을 반환한다.
static List<Integer> topologicalSort(List<List<Integer>> adjacency) {
    int vertexCount = adjacency.size();
    int[] color = new int[vertexCount];
    List<Integer> order = new ArrayList<>();
    for (int vertex = 0; vertex < vertexCount; vertex++) {
        if (color[vertex] == 0 && !visit(adjacency, vertex, color, order)) return null;
    }
    Collections.reverse(order);
    return order;
}

static boolean visit(List<List<Integer>> adjacency, int vertex, int[] color, List<Integer> order) {
    color[vertex] = 1; // 현재 재귀 경로에서 탐색 중이다.
    for (int neighbor : adjacency.get(vertex)) {
        if (color[neighbor] == 1) return false; // 역방향 간선을 발견했다.
        if (color[neighbor] == 0 && !visit(adjacency, neighbor, color, order)) return false;
    }
    color[vertex] = 2;
    order.add(vertex); // 후위 순서로 기록하고 호출부에서 뒤집는다.
    return true;
}
```

### 7.3. 강연결 요소

SCC(Strongly Connected Component)는 방향 그래프에서 모든 정점 쌍이 서로 도달 가능한 최대 정점 집합이다.

Kosaraju 알고리즘은 원본 그래프 전체를 DFS해 종료 순서를 구한다. 다음으로 간선을 뒤집은 전치 그래프에서 종료 순서의 역순으로 미방문 정점을 탐색한다. 두 번째 탐색에서 한 번의 DFS로 방문한 정점 집합이 SCC 하나다. 두 번의 탐색과 전치 그래프 구성에 $O(V+E)$ 시간이 든다. SCC를 정점 하나씩으로 묶은 응축 그래프(condensation graph)는 비순환이다.

### 7.4. 브리지

브리지는 무방향 그래프에서 제거했을 때 연결 요소 수를 증가시키는 간선이다.

`low[vertex]`는 해당 정점의 서브트리에서 트리 간선을 따라 내려간 뒤 역방향 간선을 최대 한 번 사용해 도달할 수 있는 정점의 최소 진입 순번이다. 역방향 간선을 사용하지 않는 경우도 포함하므로 처음에는 자신의 진입 순번으로 설정한다.

DFS 트리 간선의 부모가 `current`, 자식이 `child`일 때 `low[child] > entryTime[current]`이면 브리지다. 자식 서브트리에서 이 간선 외의 경로로 현재 정점이나 그 조상에 도달할 수 없다는 뜻이다. `low[child] == entryTime[current]`이면 현재 정점으로 돌아오는 우회 경로가 있으므로 브리지가 아니다. 시간 복잡도는 $O(V+E)$다. 다중 간선은 §7.1과 같이 부모 간선을 구분한다.

### 7.5. 기타

단절점(articulation point), 최소 공통 조상(LCA, Lowest Common Ancestor), 미로 탐색·생성, 순열·조합·N-Queens를 위한 [[backtracking]]에도 쓰인다. 단절점과 Tarjan SCC는 이 문서에서 다루지 않는다.

## 8. BFS와 비교

방문 배열을 사용하는 BFS와 재귀 DFS의 최악 보조 공간은 모두 $O(V)$다. BFS는 넓은 레벨에서 큐가 커지고, 재귀 DFS는 긴 경로에서 호출 스택이 깊어진다. 어느 쪽이 메모리를 적게 사용하는지는 그래프와 구현에 따라 달라진다.[^7]

| 구분 | DFS | [[bfs]] |
|---|---|---|
| 자료구조 | 스택 또는 재귀 | 큐 |
| 인접 리스트 탐색 시간 | $O(V+E)$ | $O(V+E)$ |
| 최단 경로 | 일반적으로 보장하지 않음 | 가중치가 없거나 동일한 그래프에서 보장 |
| 대기 상태 | 현재 탐색 경로와 미처리 분기 | 같은 레벨과 다음 레벨의 정점 |
| 대표 용도 | 사이클, 위상 정렬, 백트래킹 | 최단 거리, 레벨 순회 |

유한 그래프에서는 방문 표시로 사이클의 반복 탐색을 막을 수 있다. 무한 그래프에서는 방문 표시가 있어도 새로운 정점을 따라 계속 내려가 다른 분기의 해를 찾지 못할 수 있다. 재귀 구현의 호출 스택 제약은 §4를 참고한다.[^7]

## 9. 문제 예시

### 9.1. LeetCode 200 Number of Islands

문자 `'1'`은 땅, `'0'`은 물인 격자에서 상하좌우로 연결된 섬의 개수를 구한다. 미방문 땅에서 DFS를 시작할 때마다 섬 하나를 세고, 연결된 땅을 모두 방문한다.

방문한 땅을 `'0'`으로 바꾸므로 입력 격자가 변경된다. 재귀 호출 전에 방문 표시를 해 같은 땅을 반복 방문하지 않는다.[^8]

```java
int numIslands(char[][] grid) {
    int count = 0;
    for (int row = 0; row < grid.length; row++) {
        for (int column = 0; column < grid[0].length; column++) {
            if (grid[row][column] != '1') continue;
            sink(grid, row, column);
            count++; // 이번 탐색으로 연결된 섬 하나를 모두 방문했다.
        }
    }
    return count;
}

void sink(char[][] grid, int row, int column) {
    if (row < 0 || column < 0
            || row >= grid.length || column >= grid[0].length) return;
    if (grid[row][column] != '1') return;

    grid[row][column] = '0'; // 재귀 호출 전에 방문 표시해 중복 방문을 막는다.
    sink(grid, row + 1, column);
    sink(grid, row - 1, column);
    sink(grid, row, column + 1);
    sink(grid, row, column - 1);
}
```

### 9.2. LeetCode 207 Course Schedule

선수 과목 관계 `[a, b]`는 `b`를 먼저 이수해야 `a`를 수강할 수 있다는 뜻이다. 과목을 정점으로 보고 선수 과목에서 후속 과목으로 간선을 만든다. 이 방향 그래프에 사이클이 없으면 모든 과목을 이수할 수 있다.

모든 미방문 정점에서 3색 DFS를 시작해 역방향 간선을 탐지한다. `color`의 의미는 §3.1과 같다.

```java
boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adjacency = new ArrayList<>();
    for (int course = 0; course < numCourses; course++) {
        adjacency.add(new ArrayList<>());
    }
    for (int[] prerequisite : prerequisites) {
        // 선수 과목에서 후속 과목으로 간선을 만든다.
        adjacency.get(prerequisite[1]).add(prerequisite[0]);
    }
    int[] color = new int[numCourses]; // 0: 미방문, 1: 탐색 중, 2: 탐색 완료
    for (int vertex = 0; vertex < numCourses; vertex++) {
        if (color[vertex] == 0 && hasCycle(adjacency, vertex, color)) return false;
    }
    return true;
}

boolean hasCycle(List<List<Integer>> adjacency, int vertex, int[] color) {
    color[vertex] = 1;
    for (int neighbor : adjacency.get(vertex)) {
        if (color[neighbor] == 1) return true; // 현재 경로로 되돌아가는 간선
        if (color[neighbor] == 0 && hasCycle(adjacency, neighbor, color)) return true;
    }
    color[vertex] = 2;
    return false;
}
```

### 9.3. LeetCode 210 Course Schedule II

§9.2와 같은 입력에서 이수 가능한 과목 순서를 반환하며 불가능하면 빈 배열을 반환한다. 가능한 순서가 여러 개이면 그중 하나를 반환한다.

아래 `findOrder()`는 §7.2의 `topologicalSort()`와 `visit()`을 함께 사용한다. 사이클을 나타내는 `null`을 빈 배열로 바꿔 문제의 반환 형식을 맞춘다.[^8]

```java
int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adjacency = new ArrayList<>();
    for (int course = 0; course < numCourses; course++) {
        adjacency.add(new ArrayList<>());
    }
    for (int[] prerequisite : prerequisites) {
        // prerequisite[1]을 먼저 이수해야 prerequisite[0]을 들을 수 있다.
        adjacency.get(prerequisite[1]).add(prerequisite[0]);
    }

    List<Integer> order = topologicalSort(adjacency);
    if (order == null) return new int[0];

    int[] result = new int[order.size()];
    for (int index = 0; index < order.size(); index++) {
        result[index] = order.get(index);
    }
    return result;
}
```

### 9.4. LeetCode 79 Word Search

문자 격자에서 상하좌우로 인접한 칸을 이어 단어를 만들 수 있는지 판단하며 같은 칸은 한 경로에서 한 번만 쓴다. 각 칸에서 DFS로 단어를 한 글자씩 맞춰 가는 백트래킹을 사용한다.

현재 경로에서 사용한 칸을 `'#'`로 표시하고, 재귀 탐색을 마치면 성공 여부와 관계없이 원래 문자로 복원한다. 입력과 단어는 영문자로 구성되므로 사용 표시가 입력 문자와 겹치지 않는다. 탐색 후에는 입력 보드가 원래 상태로 유지된다.[^8]

```java
boolean exist(char[][] board, String word) {
    for (int row = 0; row < board.length; row++) {
        for (int column = 0; column < board[0].length; column++) {
            if (search(board, word, 0, row, column)) return true;
        }
    }
    return false;
}

boolean search(char[][] board, String word, int index, int row, int column) {
    if (index == word.length()) return true;
    if (row < 0 || column < 0
            || row >= board.length || column >= board[0].length) return false;
    if (board[row][column] != word.charAt(index)) return false;

    char originalCharacter = board[row][column];
    board[row][column] = '#'; // 현재 경로에서 사용한 칸을 표시한다.
    boolean found = search(board, word, index + 1, row + 1, column)
            || search(board, word, index + 1, row - 1, column)
            || search(board, word, index + 1, row, column + 1)
            || search(board, word, index + 1, row, column - 1);
    board[row][column] = originalCharacter; // 성공·실패 모두 원래 문자로 복원한다.
    return found;
}
```

### 9.5. LeetCode 46 Permutations

서로 다른 정수 배열의 모든 순열을 반환한다. `current`는 현재 선택한 원소 순서이며, `used[index]`는 현재 경로에서 해당 원소를 사용했는지 나타낸다.

모든 원소를 선택하면 현재 경로를 복사해 결과에 저장한다. 재귀 탐색 후에는 마지막 선택과 사용 표시를 되돌려 다른 순열을 만든다. 결과에 경로 자체를 저장하면 이후 변경이 결과에도 반영되므로 복사본을 저장한다.[^8]

```java
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, boolean[] used, List<Integer> current,
               List<List<Integer>> result) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current)); // 이후 경로 변경과 분리해 결과를 저장한다.
        return;
    }
    for (int index = 0; index < nums.length; index++) {
        if (used[index]) continue;
        used[index] = true; // 현재 경로에서 이 원소를 사용한다.
        current.add(nums[index]);
        backtrack(nums, used, current, result);
        // 다음 후보를 탐색하기 전에 선택과 사용 표시를 되돌린다.
        current.remove(current.size() - 1);
        used[index] = false;
    }
}
```

---

## Sources
- [Princeton: NonrecursiveDFS 소스](https://raw.githubusercontent.com/kevin-wayne/algs4/master/src/main/java/edu/princeton/cs/algs4/NonrecursiveDFS.java)
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

---

[^1]: 이웃 반복자를 저장해 재귀형의 방문 순서를 재현하는 방식은 Princeton 구현을 따른다. 진입·종료 배열의 -1, 재탐색 방지, `dfsAll()`과 인스턴스별 상태 유지는 이 문서의 Java 예시에 맞춘 설계다.
[^2]: 인접 리스트의 시간·공간은 CP-Algorithms와 Princeton 구현을 기준으로 한다. 인접 리스트 길이 합과 인접 행렬의 $O(V^2)$는 표현 방식에서 도출했다. 이웃을 한꺼번에 스택에 넣고 꺼낼 때 방문 처리하는 방식은 대기 정점이 중복될 수 있다. 이 경우 스택이 $O(E)$까지 커질 수 있으므로 방문 배열을 포함한 보조 공간은 $O(V+E)$다.
[^3]: JVM 명세는 스레드에 허용된 스택보다 큰 스택이 필요한 경우 `StackOverflowError`가 발생한다고 정의한다. DFS의 고정된 안전 깊이는 명시하지 않는다. 반복형 전환 권고는 이 제약에서 도출했다.
[^4]: CP-Algorithms의 조상 판정 조건을 DFS 트리의 서로 다른 방문 정점에 적용했다. §3.1의 시간은 같은 인스턴스에서 부여한 순번이며, -1인 미방문 정점은 판정에서 제외한다.
[^5]: CP-Algorithms의 간선 분류를 따르며, 자기 루프는 현재 탐색 중인 자기 자신으로 가는 역방향 간선으로 취급한다. 무방향 간선은 인접 목록에 양방향으로 나타나므로 부모 간선의 반대 방향과 별개의 우회 간선을 구분해야 한다.
[^6]: 무방향 사이클 판정은 부모 간선을 제외한 방문 정점 연결에서 도출했다. 다중 간선에서 부모 정점으로 향하는 간선을 모두 건너뛰면 안 된다는 조건은 CP-Algorithms의 브리지 설명을 따른다.
[^7]: 메모리 비교와 무한 그래프의 종료 제약은 큐·스택에 저장하는 상태와 탐색 순서에서 도출했다. 유한 그래프의 방문 처리는 사이클에 따른 반복을 막지만 무한한 단순 경로의 탐색을 끝내지는 못한다.
[^8]: 입력 변경과 복원, 보조 메서드 의존성, 경로 복사는 이 문서의 Java 예시를 기준으로 설명했다. 입력 문자와 반환 형식은 각 LeetCode 문제 정의를 따른다.
