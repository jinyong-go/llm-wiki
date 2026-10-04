---
title: 백트래킹 (Backtracking)
updated: 2026-10-04 23:11:01
tags:
  - programming
  - algorithm
---

## 1. 개요
**백트래킹(Backtracking)** 은 해의 후보를 한 단계씩 확장하다가 유효한 해로 완성될 수 없다고 판단되는 즉시 그 후보를 버리고 이전 단계로 돌아가는 탐색 기법이다. 제약 충족 문제와 열거 문제에 쓰인다. 부분 후보를 노드로 하는 상태 공간 트리(state space tree)를 깊이 우선으로 순회하므로 [[dfs]]의 응용이며, 유효하지 않은 노드의 서브트리 전체를 건너뛰는 가지치기(pruning)로 완전 탐색보다 탐색량을 줄인다. 용어는 1950년대 D. H. Lehmer가 처음 사용했다.

## 2. 동작

### 2.1 구성 요소
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

### 2.2 선택·재귀·되돌리기
구현은 보통 하나의 가변 상태를 공유하며 다음을 반복한다.
1. 후보 하나를 선택해 상태에 반영한다.
2. 재귀 호출로 다음 단계를 탐색한다.
3. 반영한 선택을 원래대로 되돌린다.

되돌리기를 하므로 단계마다 상태를 복사할 필요가 없고, 해를 찾은 시점에만 상태를 복사해 결과에 저장한다.

### 2.3 조기 종료
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

### 4.1 제약 위반
부분 후보가 이미 제약을 위반하면 더 확장하지 않는다. N-Queens에서 같은 열이나 대각선에 퀸이 있는 칸은 후보에서 제외한다.

### 4.2 정렬 후 중단
후보를 오름차순 정렬하면 현재 원소가 남은 목표값을 넘을 때 그 뒤 원소도 모두 넘으므로 `continue` 대신 `break`로 반복을 끝낸다.[^1]

### 4.3 중복 제거
입력에 중복 원소가 있으면 정렬한 뒤 같은 깊이에서 이전 원소와 같은 값을 건너뛴다. 조합형은 `i > start && a[i] == a[i - 1]`, 순열형은 `i > 0 && a[i] == a[i - 1] && !used[i - 1]` 조건을 쓴다.[^1]

### 4.4 남은 개수 검사
$n$개 중 $k$개를 고르는 조합에서 남은 원소 수가 더 골라야 할 개수보다 적으면 중단한다.[^1]

## 5. 복잡도
최악의 경우 시간 복잡도는 해의 개수와 해 하나를 복사하는 비용의 곱으로 상한을 잡는다.[^2]

| 문제 | 해 개수 | 시간 복잡도 |
|---|---|---|
| 부분집합 | $2^n$ | $O(n \cdot 2^n)$ |
| 조합 | $\binom{n}{k}$ | $O(k \cdot \binom{n}{k})$ |
| 순열 | $n!$ | $O(n \cdot n!)$ |
| N-Queens | 가변 | $O(n!)$[^3] |

공간 복잡도는 결과 저장을 제외하면 재귀 깊이와 현재 경로 크기인 $O(n)$이다. 가지치기는 실제 탐색량을 줄이지만 최악 복잡도의 차수는 바꾸지 못하는 경우가 많다.

## 6. 비교
| 구분 | 완전 탐색 | 백트래킹 | 분기 한정 |
|---|---|---|---|
| 목적 | 모든 후보 검사 | 제약을 만족하는 해 탐색·열거 | 최적해 탐색 |
| 가지치기 기준 | 없음 | 제약 위반 여부 | 최적값의 상한·하한 비교 |
| 탐색 순서 | 임의 | DFS | DFS, BFS, best-first(우선순위 큐) |

**분기 한정(Branch and Bound)** 은 1960년 Land와 Doig가 제안한 최적화 기법으로, 각 분기의 한정값(bound)을 계산해 현재 최적해보다 나아질 수 없는 분기를 버린다. 백트래킹은 제약 검사만으로 가지를 친다는 점에서 구분된다.[^4]

## 7. N-Queens
$n \times n$ 체스판에 서로 공격하지 않도록 퀸 $n$개를 놓는 문제이다. 8-Queens의 해는 92개이며 회전·대칭을 같은 것으로 보면 12개이다. 탐색 공간은 제약을 걸수록 다음과 같이 줄어든다.

| 조건 | 배치 수 |
|---|---|
| 64칸 중 8칸 선택 | $\binom{64}{8} = 4{,}426{,}165{,}368$ |
| 열마다 퀸 1개 | $8^8 = 16{,}777{,}216$ |
| 행·열마다 퀸 1개(순열) | $8! = 40{,}320$ |
| 백트래킹 | 15,720회 배치 검사 |

행 단위로 퀸을 놓고 열, 주대각선($r - c$), 부대각선($r + c$) 점유 여부를 배열로 관리하면 충돌 검사가 $O(1)$이다. 주대각선 인덱스는 음수가 되지 않도록 $r - c + n - 1$을 쓴다.

## 8. 문제 예시
순열은 [[dfs]]의 9.5 LeetCode 46 Permutations, 격자 경로 탐색은 9.4 LeetCode 79 Word Search 참고.

### 8.1 LeetCode 78 Subsets
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

### 8.2 LeetCode 77 Combinations
$[1, n]$에서 $k$개를 고르는 모든 조합을 반환한다($1 \le n \le 20$). 4.4의 남은 개수 검사로 반복 상한을 `n - (k - cur.size()) + 1`로 줄인다.

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

### 8.3 LeetCode 39 Combination Sum
서로 다른 정수 배열에서 합이 `target`인 모든 조합을 반환하며 같은 원소를 여러 번 쓸 수 있다. 재사용을 허용하려고 재귀 시 `i + 1`이 아닌 `i`를 넘기고, 4.2의 정렬 후 중단을 적용한다.

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

### 8.4 LeetCode 40 Combination Sum II
중복이 있을 수 있는 배열에서 각 원소를 한 번만 써서 합이 `target`인 조합을 중복 없이 반환한다. 39와 같은 구조에서 재귀 시 `i + 1`을 넘기고 4.3의 중복 건너뛰기를 추가한다.

```java
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

### 8.5 LeetCode 51 N-Queens
$n \times n$($1 \le n \le 9$) 체스판에서 N-Queens의 모든 해를 문자열 배열로 반환한다. 7의 방식대로 행 단위로 퀸을 놓고 열·대각선 점유 배열로 충돌을 검사한다.

```java
List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n]; // queens[r] = 퀸의 열
    place(0, n, queens, new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1], result);
    return result;
}

void place(int r, int n, int[] queens, boolean[] col, boolean[] diag, boolean[] anti,
           List<List<String>> result) {
    if (r == n) { result.add(render(queens, n)); return; }
    for (int c = 0; c < n; c++) {
        if (col[c] || diag[r - c + n - 1] || anti[r + c]) continue;
        queens[r] = c;
        col[c] = diag[r - c + n - 1] = anti[r + c] = true;
        place(r + 1, n, queens, col, diag, anti, result);
        col[c] = diag[r - c + n - 1] = anti[r + c] = false;
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

---
## Sources
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

[^1]: 정렬 후 중단, 중복 건너뛰기, 남은 개수 검사는 조사한 출처에 직접 서술되어 있지 않다. Wikipedia의 `reject` 일반화를 구체 문제에 적용한 일반적 기법이며, 중복 건너뛰기 조건은 LeetCode 40, 47의 "중복 없는 해" 요구에서 도출했다.
[^2]: 출처에 문제별 복잡도가 명시되어 있지 않다. 해 개수($2^n$, $\binom{n}{k}$, $n!$)와 해 하나를 결과에 복사하는 비용($O(n)$ 또는 $O(k)$)을 곱해 계산한 상한이다.
[^3]: N-Queens의 $O(n!)$은 행마다 남은 열만 후보가 되어 첫 행 $n$개, 다음 행 최대 $n-1$개로 줄어든다는 점에서 도출한 상한이며 출처에 명시되어 있지 않다. 대각선 가지치기로 실제 탐색량은 더 적다.
[^4]: Wikipedia Branch and bound 문서는 백트래킹을 관련 알고리즘으로 언급하지만 두 기법의 차이를 표로 정리하지 않는다. 가지치기 기준의 구분은 두 문서의 정의(`reject`의 유효성 판정, bounding function의 최적값 한정)를 비교해 정리한 내용이다.
