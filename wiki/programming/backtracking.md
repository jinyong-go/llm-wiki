---
title: 백트래킹 (Backtracking)
updated: 2026-10-26 17:41:53
tags:
  - programming
  - algorithm
---

## 1. 개요
**백트래킹(Backtracking)** 은 해의 후보를 한 단계씩 확장하다가 유효한 해로 완성될 수 없다고 판단되는 즉시 그 후보를 버리고 이전 단계로 돌아가는 탐색 기법이다. 제약 충족 문제와 열거 문제에 쓰인다. 부분 후보를 노드로 하는 상태 공간 트리(state space tree)를 깊이 우선으로 순회하므로 [[dfs]]의 응용이며, 유효하지 않은 노드의 서브트리 전체를 건너뛰는 가지치기(pruning)로 완전 탐색보다 탐색량을 줄인다. 용어는 1950년대 D. H. Lehmer가 처음 사용했다.

## 2. 동작

### 2.1. 구성 요소
Wikipedia는 문제 인스턴스 $P$에 대해 다음 6개 절차로 백트래킹을 일반화한다.

| 절차 | 역할 |
|---|---|
| `root(P)` | 초기 부분 후보 반환 |
| `reject(P, c)` | $c$가 유효한 해로 완성될 수 없으면 참 |
| `accept(P, c)` | $c$가 완전한 해이면 참 |
| `first(P, c)` | $c$를 한 단계 확장한 첫 번째 자식 후보 생성 |
| `next(P, s)` | 후보 $s$의 다음 형제 후보 생성 |
| `output(P, c)` | 해 $c$ 처리 |

탐색은 `reject`를 먼저 검사하고, 통과하면 `accept`로 해를 판정한 뒤 자식 후보를 순서대로 재귀 탐색한다. 해가 반드시 리프일 필요는 없어 해를 출력한 뒤에도 더 확장할 수 있다. `reject`가 루트에 가까운 노드에서 참을 반환할수록 잘려 나가는 서브트리가 커져 효율이 높아진다.

### 2.2. 선택·재귀·되돌리기
구현은 보통 하나의 가변 상태를 공유하며 다음을 반복한다.
1. 후보 하나를 선택해 상태에 반영한다.
2. 재귀 호출로 다음 단계를 탐색한다.
3. 반영한 선택을 원래대로 되돌린다.

되돌리기를 하므로 단계마다 상태를 복사할 필요가 없고, 해를 찾은 시점에만 상태를 복사해 결과에 저장한다.

### 2.3. 조기 종료
모든 해가 아니라 첫 번째 해, 지정한 개수의 해만 필요하거나 시간·검사 횟수 한도가 있으면 그 시점에 탐색을 멈출 수 있다. 재귀 함수가 `boolean`을 반환하게 하고 `true`를 받으면 즉시 반환하는 방식이 일반적이다.

## 3. 구현
```java
void backtrack(State state, List<Result> results) {
    if (reject(state)) return;           // 가지치기
    if (accept(state)) {
        results.add(state.snapshot());   // 해는 복사해서 저장
        return;                          // 해를 더 확장할 수 있으면 생략
    }
    for (Choice c : candidates(state)) {
        state.apply(c);                  // 선택
        backtrack(state, results);       // 재귀
        state.undo(c);                   // 되돌리기
    }
}
```

## 4. 가지치기

가지치기(Pruning)는 탐색 중인 부분 후보에서 필요한 해를 더 얻을 수 없다고 판단하면, 그 후보를 확장하는 탐색을 생략하는 기법이다. 상태 공간 트리에서는 현재 노드 아래의 서브트리를 방문하지 않는 것에 해당한다. 완성된 후보를 만든 뒤 실패를 판정하는 대신, 부분 후보만으로 결과를 판단해 불필요한 재귀 호출을 줄인다.

제약 위반이나 남은 자원 부족으로 해를 완성할 수 없는 분기를 제외할 수 있다. 중복 없는 결과를 구하는 문제에서는 다른 분기와 같은 결과만 만드는 분기도 제외한다. 가지치기 조건은 필요한 해를 누락하지 않아야 한다.[^1]

현재 부분 후보 전체를 포기할 때는 `return`, 반복문에서 특정 선택만 제외할 때는 `continue`를 사용한다. 이후 선택까지 모두 제외할 수 있다는 근거가 있으면 `break`를 사용한다.[^1]

### 4.1. 제약 위반

이미 선택한 값들이 문제의 제약을 위반하면 해당 부분 후보를 더 확장하지 않는다. 이후 선택을 추가해도 기존 선택 사이의 위반을 해소할 수 없기 때문이다.

N-Queens에서는 새 퀸이 기존 퀸과 같은 열이나 대각선에 있으면 충돌한다. 이 칸에 퀸을 추가한 뒤 나머지 행을 탐색해도 유효한 배치를 만들 수 없으므로, 해당 칸을 건너뛰고 다른 열을 검사한다. 충돌 검사와 구현은 §7.5에서 다룬다.

### 4.2. 정렬 후 중단

양수로 이루어진 배열에서 목표 합을 만드는 문제라면, 현재 선택한 값이 남은 목표값 `remain`보다 클 때 그 선택으로는 해를 만들 수 없다. 양수를 더 선택해도 합이 줄어들지 않기 때문이다.[^1]

배열을 오름차순으로 정렬했다면 뒤의 값도 모두 `remain`보다 크거나 같다. 따라서 현재 값만 `continue`로 건너뛰는 대신 `break`로 반복문을 끝낼 수 있다. 예를 들어 후보가 `[2, 3, 6, 7]`이고 `remain`이 5라면 6을 검사하는 시점에 7도 제외할 수 있다.[^1]

이 조건은 남은 값으로 합을 줄일 수 없다는 전제에 의존한다. 음수가 섞인 문제에 그대로 적용하면 유효한 조합을 누락할 수 있다.[^1]

### 4.3. 중복 제거

같은 값이 여러 번 등장하고 결과의 중복을 허용하지 않는 문제에서는, 값이 같은 원소를 서로 바꾸어 선택해도 동일한 결과가 만들어질 수 있다. 배열을 정렬해 같은 값을 인접하게 배치한 뒤, 같은 깊이에서 동일한 값으로 시작하는 분기를 하나만 탐색한다.[^1]

조합형에서는 `i > start && a[i] == a[i - 1]`이면 현재 원소를 건너뛴다. 예를 들어 `[1, 1, 2]`의 첫 번째 1로 시작하는 분기를 탐색했다면, 같은 깊이에서 두 번째 1로 시작하는 분기는 생략한다. 재귀 호출 안에서는 `start`가 바뀌므로 두 번째 1을 추가로 선택해 `[1, 1]`을 만드는 것은 허용된다.[^1]

순열형에서는 `i > 0 && a[i] == a[i - 1] && !used[i - 1]`이면 건너뛴다. 앞의 같은 값이 현재 경로에 없다면 그 값을 먼저 쓰는 분기와 중복되므로 제외한다. 앞의 같은 값이 이미 경로에 있다면 두 원소를 모두 사용하는 선택이므로 허용한다. 이 규칙은 값이 같은 원소를 인덱스 순서대로 선택하게 한다.[^1]

### 4.4. 남은 개수 검사

서로 다른 원소 $n$개에서 $k$개를 고를 때 현재 선택한 개수가 $m$이면, 앞으로 $k-m$개를 더 골라야 한다. 선택 가능한 원소가 그보다 적으면 어떤 원소를 골라도 필요한 개수를 채울 수 없으므로 현재 분기를 중단한다.[^1]

예를 들어 $n=5$, $k=3$이고 현재 한 개를 선택했다면 두 개가 더 필요하다. 남은 후보가 5 하나뿐이라면 더 탐색할 필요가 없다.[^1]

$[1,n]$에서 현재 선택할 값을 $i$라고 하면, $i$를 포함해 남은 원소 수는 $n-i+1$이다. 따라서 다음 조건을 만족하는 범위만 반복하면 된다.[^1]

$$n-i+1 \ge k-m \quad\Longleftrightarrow\quad i \le n-(k-m)+1$$

§7.2의 반복 상한 `n - (k - cur.size()) + 1`은 이 조건을 코드로 표현한 것이다.[^1]

## 5. 복잡도

$n$은 입력 원소 수이며, N-Queens에서는 체스판의 한 변 길이와 퀸의 수다. $k$는 조합에서 선택할 원소 수다.

다음 표는 모든 해를 구하는 구현의 해 개수와 시간 복잡도를 나타낸다. 부분집합·조합·순열의 시간에는 탐색뿐 아니라 각 해를 복사해 결과에 저장하는 비용도 포함한다.[^2] N-Queens의 $O(n!)$은 열 중복을 제외한 후보 탐색에 대한 추정이며, 체스판을 문자열로 만들어 저장하는 비용은 별도로 계산한다.[^3]

| 문제 | 해 개수 | 시간 복잡도 |
|---|---|---|
| 부분집합 | $2^n$ | $O(n2^n)$ |
| 조합 | $\binom{n}{k}$ | $O\left(k\binom{n}{k}\right)$ |
| 순열 | $n!$ | $O(n \cdot n!)$ |
| N-Queens | $n$에 따라 다름 | 후보 탐색 $O(n!)$, 결과 생성 $O(Sn^2)$ |

N-Queens의 $S$는 해의 개수다. §7.5의 구현은 해 하나마다 길이 $n$인 문자열 $n$개를 생성하므로 결과 생성 비용은 $O(Sn^2)$이다. 복잡도는 각 예제의 후보 생성 방식과 결과 표현을 기준으로 하며, 도출 근거는 각주에 기술한다.[^3]

결과 저장을 제외한 보조 공간은 재귀 호출 스택, 현재 경로, 점유 배열 등에 사용하는 $O(n)$이다. 모든 해를 결과 목록에 저장하면 결과 크기만큼 공간이 추가로 필요하다. 가지치기는 실제 탐색량을 줄이지만 최악 복잡도의 차수는 바꾸지 못하는 경우가 많다.[^4]

## 6. 비교
| 구분 | 완전 탐색 | 백트래킹 | 분기 한정 |
|---|---|---|---|
| 목적 | 모든 후보 검사 | 제약을 만족하는 해 탐색·열거 | 최적해 탐색 |
| 가지치기 기준 | 없음 | 제약 위반 여부 | 최적값의 상한·하한 비교 |
| 탐색 순서 | 임의 | DFS | DFS, BFS, best-first(우선순위 큐) |

**분기 한정(Branch and Bound)** 은 1960년 Land와 Doig가 제안한 최적화 기법으로, 각 분기의 한정값(bound)을 계산해 현재 최적해보다 나아질 수 없는 분기를 버린다. 백트래킹은 제약 검사만으로 가지를 친다는 점에서 구분된다.[^5]

## 7. 문제 예시
순열은 [[dfs]]의 §9.5 LeetCode 46 Permutations, 격자 경로 탐색은 §9.4 LeetCode 79 Word Search 참고.

### 7.1. LeetCode 78 Subsets
서로 다른 정수 배열($1 \le n \le 10$)의 모든 부분집합을 반환한다. 모든 노드가 해이므로 진입 시마다 현재 경로를 저장하고, `start` 이후 원소만 골라 같은 집합이 다른 순서로 생성되지 않게 한다.

```java
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, int start, List<Integer> cur, List<List<Integer>> result) {
    result.add(new ArrayList<>(cur));
    for (int i = start; i < nums.length; i++) {
        cur.add(nums[i]);
        backtrack(nums, i + 1, cur, result);
        cur.remove(cur.size() - 1);
    }
}
```

### 7.2. LeetCode 77 Combinations
$[1, n]$에서 $k$개를 고르는 모든 조합을 반환한다($1 \le n \le 20$). §4.4의 남은 개수 검사로 반복 상한을 `n - (k - cur.size()) + 1`로 줄인다.

```java
List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(n, k, 1, new ArrayList<>(), result);
    return result;
}

void backtrack(int n, int k, int start, List<Integer> cur, List<List<Integer>> result) {
    if (cur.size() == k) { result.add(new ArrayList<>(cur)); return; }
    for (int i = start; i <= n - (k - cur.size()) + 1; i++) {
        cur.add(i);
        backtrack(n, k, i + 1, cur, result);
        cur.remove(cur.size() - 1);
    }
}
```

### 7.3. LeetCode 39 Combination Sum
서로 다른 정수 배열에서 합이 `target`인 모든 조합을 반환하며 같은 원소를 여러 번 쓸 수 있다. 재사용을 허용하려고 재귀 시 `i + 1`이 아닌 `i`를 넘기고, §4.2의 정렬 후 중단을 적용한다.

```java
List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates);
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(int[] a, int remain, int start, List<Integer> cur, List<List<Integer>> result) {
    if (remain == 0) { result.add(new ArrayList<>(cur)); return; }
    for (int i = start; i < a.length; i++) {
        if (a[i] > remain) break;
        cur.add(a[i]);
        backtrack(a, remain - a[i], i, cur, result);
        cur.remove(cur.size() - 1);
    }
}
```

### 7.4. LeetCode 40 Combination Sum II
중복이 있을 수 있는 배열에서 각 원소를 한 번만 써서 합이 `target`인 조합을 중복 없이 반환한다. `combinationSum2()`에서 배열을 오름차순으로 정렬해 같은 값을 인접하게 배치한다. 정렬된 배열에서는 §4.3의 조건으로 같은 깊이의 중복 값을 건너뛰고, 현재 값이 남은 목표값을 초과하면 §4.2의 조건으로 반복을 중단할 수 있다. 각 원소를 한 번만 사용하도록 재귀 시 `i + 1`을 넘긴다.[^1]

```java
List<List<Integer>> combinationSum2(int[] candidates, int target) {
    Arrays.sort(candidates);
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(int[] a, int remain, int start, List<Integer> cur, List<List<Integer>> result) {
    if (remain == 0) { result.add(new ArrayList<>(cur)); return; }
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue; // 같은 깊이의 중복 값 건너뛰기
        if (a[i] > remain) break;
        cur.add(a[i]);
        backtrack(a, remain - a[i], i + 1, cur, result);
        cur.remove(cur.size() - 1);
    }
}
```

### 7.5. LeetCode 51 N-Queens
$n \times n$ 체스판에 서로 공격하지 않도록 퀸 $n$개를 놓는 문제다. LeetCode 51에서는 $1 \le n \le 9$이며, 모든 해를 문자열 배열로 반환한다.

한 행에 퀸을 하나씩 놓고 다음 행을 탐색한다. 새 퀸이 기존 퀸과 같은 열이나 대각선에 있으면 해당 칸을 건너뛴다.

행 단위로 퀸을 놓고 열, 주대각선($row - c$), 부대각선($row + c$) 점유 여부를 배열로 관리하면 충돌 검사가 $O(1)$이다. 주대각선 인덱스는 음수가 되지 않도록 $row - c + n - 1$을 쓴다.

```java
List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n]; // queens[row] = 퀸의 열
    place(0, n, queens, new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1], result);
    return result;
}

// row: 현재 퀸을 배치할 행 번호
// column[c]: c열의 퀸 점유 여부
// diagonal[row - c + n - 1]: 주대각선의 퀸 점유 여부
// antiDiagonal[row + c]: 부대각선의 퀸 점유 여부
void place(int row, int n, int[] queens, boolean[] column,
           boolean[] diagonal, boolean[] antiDiagonal,
           List<List<String>> result) {
    if (row == n) {
        result.add(render(queens, n)); // 모든 행에 배치했으므로 결과 저장
        return;
    }
    for (int c = 0; c < n; c++) {
        // 같은 주대각선은 row - c가 같다. n - 1을 더해 음수 인덱스를 피한다.
        int diagonalIndex = row - c + n - 1;
        // 같은 부대각선은 row + c가 같다.
        int antiDiagonalIndex = row + c;

        // 같은 열이나 대각선에 퀸이 있으면 이 칸을 건너뛴다.
        if (column[c] || diagonal[diagonalIndex]
                || antiDiagonal[antiDiagonalIndex]) continue;

        queens[row] = c; // row행의 퀸을 c열에 배치
        column[c] = true;
        diagonal[diagonalIndex] = true;
        antiDiagonal[antiDiagonalIndex] = true;
        place(row + 1, n, queens, column, diagonal, antiDiagonal, result);

        // 다음 후보를 탐색하도록 점유 표시를 되돌린다.
        column[c] = false;
        diagonal[diagonalIndex] = false;
        antiDiagonal[antiDiagonalIndex] = false;
    }
}

List<String> render(int[] queens, int n) {
    List<String> board = new ArrayList<>();
    for (int q : queens) {
        char[] row = new char[n];
        Arrays.fill(row, '.');
        row[q] = 'Q';
        board.add(new String(row));
    }
    return board;
}
```

8-Queens의 해는 92개이며 회전·대칭을 같은 것으로 보면 12개다. 다음 표는 후보 표현에 따른 완성 배치 수를 나타낸다.

| 조건 | 완성 배치 수 |
|---|---|
| 64칸 중 8칸 선택 | $\binom{64}{8} = 4{,}426{,}165{,}368$ |
| 행마다 퀸 1개 | $8^8 = 16{,}777{,}216$ |
| 행·열마다 퀸 1개 | $8! = 40{,}320$ |

---

## Sources
- [Emory: The N-Queens Problem & Backtracking](https://mathcenter.oxford.emory.edu/site/cs171/nQueensProblemAndBacktracking/)
- [Princeton: Combinatorial Search and Algorithm Design](https://www.cs.princeton.edu/courses/archive/fall19/cos226/lectures/67CombinatorialSearch.pdf)
- [Backtracking (Wikipedia)](https://en.wikipedia.org/wiki/Backtracking)
- [Eight queens puzzle (Wikipedia)](https://en.wikipedia.org/wiki/Eight_queens_puzzle)
- [Branch and bound (Wikipedia)](https://en.wikipedia.org/wiki/Branch_and_bound)
- [Backtracking Algorithms (GeeksforGeeks)](https://www.geeksforgeeks.org/dsa/backtracking-algorithms/)
- [78. Subsets (LeetCode)](https://leetcode.com/problems/subsets/)
- [77. Combinations (LeetCode)](https://leetcode.com/problems/combinations/)
- [39. Combination Sum (LeetCode)](https://leetcode.com/problems/combination-sum/)
- [40. Combination Sum II (LeetCode)](https://leetcode.com/problems/combination-sum-ii/)
- [47. Permutations II (LeetCode)](https://leetcode.com/problems/permutations-ii/)
- [51. N-Queens (LeetCode)](https://leetcode.com/problems/n-queens/)

---

## Related pages
- [[dfs]]
- [[bfs]]
- [[dynamic-programming]]

---

[^1]: 정렬 후 중단, 중복 제거, 남은 개수 검사와 `return`·`continue`·`break`의 구분은 출처의 완성된 설명을 옮긴 것이 아니라 문제 조건과 구현에서 도출했다. 정렬 후 중단은 LeetCode 39의 양수 조건, 중복 제거 조건식은 LeetCode 40·47의 중복 없는 해 요구를 전제로 한다. 남은 개수 검사는 LeetCode 77의 $k$개 선택 조건에서 도출했다. 중복 제거는 유효하지 않은 해뿐 아니라 다른 분기에서 생성하는 동일한 해를 제외한다.
[^2]: 출처에 문제별 복잡도가 명시되어 있지 않다. 서로 다른 원소를 대상으로 하는 부분집합·조합·순열 열거에서 해 개수는 각각 $2^n$, $\binom{n}{k}$, $n!$이다. 해 하나를 복사하는 비용은 각각 최대 $O(n)$, $O(k)$, $O(n)$이며, 표는 각 구현의 탐색과 결과 복사 비용을 포함해 계산했다. 목표 합을 구하는 §7.3·§7.4의 복잡도를 나타낸 표는 아니다.
[^3]: N-Queens의 $O(n!)$은 열 중복을 제외하면 첫 행 $n$개, 다음 행 최대 $n-1$개로 선택지가 줄어든다는 점에서 도출한 후보 탐색량 추정이며 출처에 명시되어 있지 않다. 대각선 가지치기로 실제 탐색량은 더 적다. §7.5의 `render()`는 해 하나마다 문자열 $n$개를 각각 길이 $n$으로 생성하므로 해가 $S$개일 때 결과 생성 비용은 $O(Sn^2)$이다.
[^4]: 출처에 직접 서술은 없다. 모든 후보가 해인 부분집합 열거처럼 가지치기가 일어나지 않는 입력에서는 탐색량이 줄지 않는다는 점에서 도출했다.
[^5]: Wikipedia Branch and bound 문서는 백트래킹을 관련 알고리즘으로 언급하지만 두 기법의 차이를 표로 정리하지 않는다. 가지치기 기준의 구분은 두 문서의 정의(`reject`의 유효성 판정, bounding function의 최적값 한정)를 비교해 정리한 내용이다.
