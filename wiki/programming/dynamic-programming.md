---
title: 동적 계획법 (Dynamic Programming)
updated: 2026-10-04 23:11:01
tags:
  - programming
  - algorithm
---

## 1. 개요
**동적 계획법(DP, Dynamic Programming)** 은 문제를 더 작은 부분 문제로 재귀적으로 나누어 풀고, 한 번 계산한 부분 문제의 결과를 저장해 재사용하는 최적화 기법이다. 1950년대 Richard Bellman이 고안했다. Bellman은 시간에 따라 변하는 다단계 과정을 나타내려고 "dynamic"을, 선형 계획법(linear programming)과 같이 최적의 계획·일정 수립이라는 의미로 "programming"을 택했다고 자서전에 기록했다.

## 2. 적용 조건

### 2.1 최적 부분 구조
**최적 부분 구조(optimal substructure)** 는 문제의 최적해를 부분 문제의 최적해를 조합해 구할 수 있는 성질이다. 최단 경로에서 $s \to t$ 최단 경로 위의 정점 $v$에 대해 $s \to v$ 구간도 최단 경로인 것이 예이다.

### 2.2 중복 부분 문제
**중복 부분 문제(overlapping sub-problems)** 는 같은 부분 문제가 재귀 과정에서 반복해 등장하는 성질이다. 피보나치 수 $F(n) = F(n-1) + F(n-2)$를 단순 재귀로 계산하면 $F(n-2)$가 여러 번 계산된다.

### 2.3 다른 기법과 비교
| 구분 | 분할 정복 | DP | 그리디 |
|---|---|---|---|
| 부분 문제 중복 | 없음 | 있음 | 해당 없음 |
| 결과 재사용 | 안 함 | 저장 후 재사용 | 안 함 |
| 선택 방식 | 모든 부분 문제 결합 | 모든 선택지 비교 | 현재 최선 하나만 선택 |
| 예 | 병합 정렬 | 배낭, LCS | 활동 선택 |

분할 정복은 부분 문제가 겹치지 않는다는 점에서 DP와 구분된다. 그리디는 매 단계 한 가지 선택만 확정하므로 탐욕적 선택 속성이 성립할 때만 최적해를 보장하며, 성립하지 않는 문제는 모든 선택지를 비교하는 DP가 필요하다.[^1]

## 3. 구현 방식

### 3.1 탑다운
**탑다운(top-down)** 은 목표 값에서 출발해 재귀로 부분 문제를 호출하고 결과를 표에 저장하는 방식이며, 이 저장 기법을 **메모이제이션(memoization)** 이라 한다. 단순 재귀로 $F(29)$를 계산하면 호출이 100만 회를 넘지만 메모이제이션을 적용하면 57회로 줄고 시간 복잡도는 $O(2^n)$에서 $O(n)$이 된다.

```java
long[] memo = new long[91]; // 0은 미계산 표시

long fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}
```

### 3.2 바텀업
**바텀업(bottom-up)** 은 기저 조건부터 반복문으로 작은 부분 문제를 먼저 채우는 방식이며 표를 채운다는 의미로 **타뷸레이션(tabulation)** 이라고도 한다.

```java
long fib(int n) {
    if (n <= 1) return n;
    long[] dp = new long[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

### 3.3 비교
| 구분 | 탑다운 | 바텀업 |
|---|---|---|
| 계산 범위 | 필요한 상태만 | 모든 상태 |
| 계산 순서 | 재귀가 자동 결정 | 직접 지정 |
| 재귀 깊이 | 상태 깊이만큼 스택 사용 | 없음 |
| 공간 최적화 | 어려움 | 롤링 배열 적용 가능 |

재귀 깊이가 큰 문제에서는 스택 오버플로를 피하기 위해 바텀업이 유리하다. Java의 재귀 깊이 제한은 [[dfs]]의 4. 복잡도 참고.

## 4. 설계 절차
1. **상태 정의**: `dp[i]`, `dp[i][j]`가 의미하는 값을 한 문장으로 정한다.
2. **점화식**: 현재 상태를 이전 상태로 표현한다.
3. **기저 조건**: 더 나눌 수 없는 상태의 값을 정한다.
4. **계산 순서**: 점화식이 참조하는 상태가 먼저 계산되도록 순서를 정한다.
5. **답의 위치**: `dp[n]`, `dp[n][m]`, 배열 전체의 최댓값 등 답이 담긴 위치를 정한다.

시간 복잡도는 다음과 같이 추정한다.[^2]

$$T = (\text{상태 수}) \times (\text{상태당 전이 비용})$$

표 대신 `HashMap`, `TreeMap`으로 상태를 저장하면 조회 비용이 곱해지므로 상태가 정수 범위로 표현되면 배열을 쓴다.

## 5. 공간 최적화
점화식이 직전 몇 개 상태만 참조하면 표 전체 대신 그 개수만큼만 유지한다. 피보나치는 변수 2개로 공간 $O(1)$, 2차원 DP에서 `dp[i]`가 `dp[i-1]` 행만 참조하면 행 2개 또는 1차원 배열로 $O(m)$이 된다. 1차원 배열로 줄일 때는 덮어쓰기 전 값과 후 값 중 어느 쪽을 참조해야 하는지에 따라 순회 방향을 정하며 배낭 문제의 예는 6.3에 있다.

## 6. 대표 유형

### 6.1 1차원 선형
`dp[i]`를 앞쪽 $i$개 원소로 만든 결과로 정의한다. 계단 오르기 $dp[i] = dp[i-1] + dp[i-2]$, 인접 원소를 고를 수 없는 최대 합 $dp[i] = \max(dp[i-1], dp[i-2] + a_i)$ 등이 있다.

### 6.2 격자 경로
오른쪽·아래로만 이동하는 격자에서 $(i, j)$까지의 경로 수는 다음과 같다.

$$dp[i][j] = dp[i-1][j] + dp[i][j-1]$$

최소 비용 경로는 합 대신 $\min$과 칸 비용을 쓴다.

### 6.3 배낭
**0-1 배낭(0-1 knapsack)** 은 무게 $w_i$, 가치 $v_i$인 물건 $n$개를 각각 최대 한 번씩 골라 용량 $W$ 안에서 가치 합을 최대화하는 문제이다. 1차원 배열 점화식은 다음과 같고 시간 $O(nW)$, 공간 $O(W)$이다.

$$f[j] = \max(f[j],\ f[j - w_i] + v_i)$$

| 유형 | 물건 사용 | 용량 순회 방향 |
|---|---|---|
| 0-1 배낭 | 최대 1회 | 역순 ($W \to w_i$) |
| 완전 배낭 | 무제한 | 정순 ($w_i \to W$) |
| 개수 제한 배낭 | 최대 $k_i$회 | 이진 분할 후 0-1 배낭 |

역순으로 순회하면 $f[j - w_i]$가 아직 갱신되지 않은 이전 물건까지의 값이라 같은 물건이 중복 선택되지 않고, 정순으로 순회하면 이미 현재 물건을 반영한 값을 참조해 재선택이 가능하다. 개수 제한 배낭은 $k_i$개를 $1, 2, 4, \dots$ 묶음으로 나눠 0-1 배낭으로 풀며 $O(nW \log k)$이다. 복잡도가 입력 길이가 아닌 값 $W$에 비례하므로 $W$가 크면 적용할 수 없다.[^3]

### 6.4 LIS
**최장 증가 부분 수열(LIS, Longest Increasing Subsequence)** 은 $a_i$로 끝나는 LIS 길이를 `dp[i]`로 두면 $O(n^2)$이다.

$$dp[i] = 1 + \max_{j < i,\ a_j < a_i} dp[j]$$

$O(n \log n)$ 해법은 $d[l]$을 길이 $l$인 증가 부분 수열의 마지막 원소 중 최솟값으로 정의한다. $d$는 항상 증가 상태이므로 각 $a_i$마다 이분 탐색으로 $a_i$ 이상인 첫 위치를 찾아 교체하고, 없으면 끝에 추가한다. 최종 길이가 LIS 길이이다. 엄격하지 않은 증가(비감소) 수열은 $a_i$ 초과인 첫 위치를 찾는다.

### 6.5 두 문자열
두 문자열의 접두사 쌍 $(i, j)$를 상태로 두며 상태 수 $O(nm)$, 시간 $O(nm)$이다. **최장 공통 부분 수열(LCS, Longest Common Subsequence)** 과 **편집 거리(edit distance)** 가 대표적이다.

$$\text{LCS}[i][j] = \begin{cases} \text{LCS}[i-1][j-1] + 1 & s_i = t_j \\ \max(\text{LCS}[i-1][j],\ \text{LCS}[i][j-1]) & \text{otherwise} \end{cases}$$

### 6.6 기타
부분집합을 비트로 표현해 상태로 쓰는 비트마스크 DP, 트리의 서브트리를 상태로 쓰는 트리 DP, 구간 $[l, r]$을 상태로 쓰는 구간 DP 등이 있으며 이 문서에서 다루지 않는다.

## 7. 문제 예시

### 7.1 LeetCode 70 Climbing Stairs
계단을 1칸 또는 2칸씩 올라 $n$칸($1 \le n \le 45$)에 도달하는 방법의 수를 구한다. $dp[i] = dp[i-1] + dp[i-2]$이며 직전 두 값만 유지한다.

```java
int climbStairs(int n) {
    int prev = 1, cur = 1; // dp[0], dp[1]
    for (int i = 2; i <= n; i++) {
        int next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}
```

### 7.2 LeetCode 198 House Robber
인접한 두 집을 함께 털 수 없을 때 털 수 있는 최대 금액을 구한다. $i$번째 집을 털지 않으면 $dp[i-1]$, 털면 $dp[i-2] + a_i$이다.[^4]

```java
int rob(int[] nums) {
    int prev = 0, cur = 0; // dp[i-2], dp[i-1]
    for (int x : nums) {
        int next = Math.max(cur, prev + x);
        prev = cur;
        cur = next;
    }
    return cur;
}
```

### 7.3 LeetCode 322 Coin Change
무제한 사용 가능한 동전으로 `amount`($\le 10^4$)를 만드는 최소 동전 수를 구하고 불가능하면 -1을 반환한다. 완전 배낭이므로 금액을 정순으로 순회한다. $dp[j] = \min(dp[j],\ dp[j - c] + 1)$이며 $O(|coins| \cdot amount)$이다.

```java
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); // 도달 불가 표시
    dp[0] = 0;
    for (int c : coins)
        for (int j = c; j <= amount; j++)
            dp[j] = Math.min(dp[j], dp[j - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

### 7.4 LeetCode 416 Partition Equal Subset Sum
배열을 합이 같은 두 부분집합으로 나눌 수 있는지 판단한다. 전체 합이 홀수이면 불가능하고, 짝수이면 합이 절반인 부분집합 존재 여부를 0-1 배낭으로 판단하므로 역순으로 순회한다.

```java
boolean canPartition(int[] nums) {
    int sum = Arrays.stream(nums).sum();
    if (sum % 2 == 1) return false;
    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int x : nums)
        for (int j = target; j >= x; j--)
            dp[j] |= dp[j - x];
    return dp[target];
}
```

### 7.5 LeetCode 300 Longest Increasing Subsequence
엄격히 증가하는 최장 부분 수열의 길이를 구하며 후속 질문으로 $O(n \log n)$을 요구한다. 6.4의 $d$ 배열과 이분 탐색을 쓴다.

```java
int lengthOfLIS(int[] nums) {
    int[] d = new int[nums.length];
    int len = 0;
    for (int x : nums) {
        int lo = 0, hi = len; // x 이상인 첫 위치
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (d[mid] < x) lo = mid + 1; else hi = mid;
        }
        d[lo] = x;
        if (lo == len) len++;
    }
    return len;
}
```

### 7.6 LeetCode 1143 Longest Common Subsequence
두 문자열(각 길이 $\le 1000$)의 LCS 길이를 구한다. 6.5의 점화식을 쓰며 인덱스 0을 빈 접두사로 두어 기저 조건을 0으로 채운다.

```java
int longestCommonSubsequence(String s, String t) {
    int n = s.length(), m = t.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = s.charAt(i - 1) == t.charAt(j - 1)
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}
```

### 7.7 LeetCode 72 Edit Distance
삽입·삭제·교체 연산으로 `word1`을 `word2`로 바꾸는 최소 연산 수를 구한다. 마지막 문자가 같으면 $dp[i-1][j-1]$, 다르면 교체 $dp[i-1][j-1]$, 삭제 $dp[i-1][j]$, 삽입 $dp[i][j-1]$ 중 최솟값에 1을 더한다. 기저 조건은 빈 문자열과의 거리 $dp[i][0] = i$, $dp[0][j] = j$이다.[^4]

```java
int minDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
    return dp[n][m];
}
```

---
## Sources
- [Dynamic programming (Wikipedia)](https://en.wikipedia.org/wiki/Dynamic_programming)
- [Introduction to Dynamic Programming (CP-Algorithms)](https://cp-algorithms.com/dynamic_programming/intro-to-dp.html)
- [Knapsack Problem (CP-Algorithms)](https://cp-algorithms.com/dynamic_programming/knapsack.html)
- [Longest increasing subsequence (CP-Algorithms)](https://cp-algorithms.com/dynamic_programming/longest_increasing_subsequence.html)
- [70. Climbing Stairs (LeetCode)](https://leetcode.com/problems/climbing-stairs/)
- [198. House Robber (LeetCode)](https://leetcode.com/problems/house-robber/)
- [322. Coin Change (LeetCode)](https://leetcode.com/problems/coin-change/)
- [416. Partition Equal Subset Sum (LeetCode)](https://leetcode.com/problems/partition-equal-subset-sum/)
- [300. Longest Increasing Subsequence (LeetCode)](https://leetcode.com/problems/longest-increasing-subsequence/)
- [1143. Longest Common Subsequence (LeetCode)](https://leetcode.com/problems/longest-common-subsequence/)
- [72. Edit Distance (LeetCode)](https://leetcode.com/problems/edit-distance/)

---
## Related pages
- [[backtracking]]
- [[dfs]]

[^1]: Wikipedia는 DP와 분할 정복의 차이(부분 문제 중복 여부)만 명시한다. 그리디와의 비교 및 활동 선택 예시는 조사한 출처에 없으며 각 기법의 일반적 정의에서 정리한 내용이다.
[^2]: CP-Algorithms의 "부분 문제당 작업량 × 부분 문제 수" 추정법을 따른다. 1~5단계 설계 절차는 출처에 단계로 제시되어 있지 않으며 출처의 상태·점화식·기저 조건·계산 순서 서술을 일반화한 것이다.
[^3]: CP-Algorithms는 $O(nW)$ 복잡도만 제시한다. 값 $W$에 비례해 큰 $W$에 부적합하다는 점(의사 다항 시간)은 복잡도 식에서 도출한 내용이다.
[^4]: House Robber와 편집 거리의 점화식은 조사한 출처에 직접 서술되어 있지 않으며 LeetCode 문제 정의에서 도출한 표준 해법이다. CP-Algorithms는 편집 거리를 대표 DP 문제로만 언급한다.
