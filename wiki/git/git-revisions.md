---
title: Git 리비전 참조 문법 및 git rev-parse
updated: 2026-07-08 10:50:28
tags:
  - git
  - vcs
---

Git에서 특정 커밋, 트리, 블롭을 가리킬 때 사용하는 참조 문법 전체. `git log`, `git diff`, `git checkout`, `git reset` 등 커밋을 인수로 받는 모든 명령에서 사용된다.

---

## 1. SHA-1 참조

```bash
git show dae86e1950b1277e545cee180551750029cfe735  # 전체 40자
git show dae86e                                     # 앞 6~7자 (저장소 내 고유하면 OK)
```

---

## 2. 심볼릭 참조

```bash
git show HEAD           # 현재 체크아웃된 커밋
git show main           # main 브랜치의 최신 커밋
git show origin/main    # 원격 추적 브랜치
git show v1.2.0         # 태그
```

### 2.1. 특수 참조

| 참조 | 의미 |
|------|------|
| `HEAD` | 현재 작업 중인 커밋 (체크아웃된 커밋) |
| `ORIG_HEAD` | merge, rebase, reset 등 큰 동작 직전의 HEAD |
| `MERGE_HEAD` | merge 진행 중인 상대 커밋 |
| `FETCH_HEAD` | 마지막 `git fetch`로 받아온 브랜치 |
| `CHERRY_PICK_HEAD` | cherry-pick 진행 중인 커밋 |
| `REBASE_HEAD` | rebase 충돌 중인 현재 커밋 |

`ORIG_HEAD`는 실수한 merge나 reset을 되돌릴 때 유용하다:

```bash
git reset --hard ORIG_HEAD   # 직전 merge/rebase/reset 취소
```

---

## 3. `~` (Tilde) — 선형 조상

`~n`은 **첫 번째 부모만** 따라 n세대 위 조상을 가리킨다.

```
HEAD~1   = HEAD의 부모 (= HEAD^)
HEAD~2   = HEAD의 할아버지 (= HEAD^^)
HEAD~3   = HEAD의 증조부모 (= HEAD^^^)
HEAD~n   = n번 위 조상
```

```bash
git show HEAD~1        # 바로 이전 커밋
git show HEAD~3        # 3개 전 커밋
git diff HEAD~5 HEAD   # 5커밋 동안의 전체 변경
git log HEAD~10..HEAD  # 최근 10개 커밋
```

---

## 4. `^` (Caret) — n번째 부모

`^n`은 **n번째 부모**를 가리킨다. 일반 커밋은 부모가 1개이므로 `^`와 `^1`이 동일하다. **머지 커밋**은 부모가 여러 개이므로 `^2`, `^3`으로 각 부모를 지정할 수 있다.

```
HEAD^    = HEAD^1   = 첫 번째 부모 (= HEAD~1)
HEAD^2              = 두 번째 부모 (머지 커밋에서만 의미 있음)
HEAD^3              = 세 번째 부모
```

### 4.1. 머지 커밋에서의 ^

```
         A (main)
        / \
       M   \      ← M 은 머지 커밋
      / \   \
     B   C---D (feature)
```

`M` 이 `A`와 `D`를 머지한 커밋이라면:
- `M^1` = `A` (main 쪽 부모, 머지 받은 쪽)
- `M^2` = `D` (feature 쪽 부모, 머지 된 쪽)

```bash
git log M^2..M      # feature 브랜치에서 머지된 커밋들
git diff M^1 M^2    # 두 부모 브랜치 간 차이
```

---

## 5. `~` vs `^` 핵심 차이

| 표기 | 의미 |
|------|------|
| `HEAD~n` | 첫 번째 부모만 따라 n세대 위 (선형) |
| `HEAD^n` | n번째 부모 (머지 커밋의 어느 쪽 부모인지) |
| `HEAD~2` | = `HEAD^^` = `HEAD^1^1` |
| `HEAD^2` | 두 번째 부모 (머지 커밋 전용) |

```
G   H
 \ /
  D   E
  |\ /
  | B
  |/
  A  ← 현재 HEAD

HEAD     = A
HEAD^    = HEAD^1 = D  (첫 번째 부모)
HEAD^2   = B           (두 번째 부모, 머지된 쪽)
HEAD~2   = HEAD^^  = G (첫 번째 부모를 2번 따라감)
HEAD^2^  = E           (B의 첫 번째 부모)
HEAD~2^2 = H           (G의 형제, D의 두 번째 부모)
```

---

## 6. `@` — reflog 및 특수 참조

### 6.1. reflog 인덱스 — `@{n}`

```bash
HEAD@{0}       = 현재 HEAD
HEAD@{1}       = 직전 HEAD 위치
HEAD@{3}       = 3번 전 HEAD 위치
main@{1}       = main 브랜치의 직전 커밋
```

```bash
git show HEAD@{1}              # 직전 HEAD 상태
git log HEAD@{5}..HEAD         # 최근 5번의 HEAD 이동 동안의 커밋
git diff HEAD@{2} HEAD         # 2번 전과 현재 비교
```

### 6.2. 날짜 기반 — `@{date}`

```bash
git show main@{yesterday}            # 어제의 main
git show main@{"1 week ago"}         # 1주 전 main
git log main@{"2026-01-01"}..main    # 올해 초 이후 main의 변경
```

### 6.3. 직전 브랜치 — `@{-n}`

```bash
git checkout @{-1}    # 방금 전에 있던 브랜치로 이동 (= git switch -)
git log @{-1}..HEAD   # 직전 브랜치와 현재 브랜치의 차이
```

### 6.4. upstream / push 참조

```bash
@{upstream}  또는  @{u}    # 현재 브랜치의 원격 추적 브랜치
@{push}                    # push 대상 브랜치

git log @{u}..HEAD         # 아직 push 안 된 커밋 목록
git diff @{u}              # push 안 된 변경 내용 전체
```

---

## 7. 범위 지정 (Revision Ranges)

### 7.1. `..` (두 점) — 차집합

`A..B` = **B에서 도달 가능하지만 A에서는 도달 불가능한 커밋**

```bash
git log main..feature      # feature에 있고 main에 없는 커밋
git log origin/main..HEAD  # push 안 된 내 커밋
git log HEAD..origin/main  # pull 안 된 원격 커밋
```

### 7.2. `...` (세 점) — 대칭 차집합

`A...B` = **A 또는 B에서 도달 가능하지만 양쪽 모두에서 도달 가능하지는 않은 커밋**

```bash
git log main...feature     # main과 feature가 분기된 이후 양쪽의 커밋
git diff main...feature    # feature 브랜치가 분기된 지점과의 diff
```

```
     main
      |
  X---Y---Z      ← main only
 /
A
 \
  B---C---D      ← feature only

main..feature  → B, C, D
feature..main  → Y, Z
main...feature → Y, Z, B, C, D (대칭 차집합)
```

### 7.3. `^` (배제)

```bash
git log ^main feature      # = git log main..feature
git log feature --not main # 동일
```

---

## 8. git rev-parse — 참조를 SHA-1로 변환

참조 이름을 실제 SHA-1 해시로 변환하거나, 저장소 경로 정보를 추출하는 도구. 주로 셸 스크립트에서 사용한다.

### 8.1. 참조 → SHA-1 변환

```bash
git rev-parse HEAD              # HEAD의 SHA-1
git rev-parse main              # main 브랜치의 SHA-1
git rev-parse HEAD~3            # 3개 전 커밋의 SHA-1
git rev-parse --short HEAD      # 단축 해시 (7자)
git rev-parse --short=12 HEAD   # 12자 단축 해시
```

### 8.2. 브랜치 이름 확인

```bash
git rev-parse --abbrev-ref HEAD           # 현재 브랜치 이름 (예: "main")
git rev-parse --symbolic-full-name HEAD   # 전체 ref 이름 (예: "refs/heads/main")
git rev-parse --abbrev-ref @{upstream}    # upstream 브랜치 이름
```

### 8.3. 저장소 경로

```bash
git rev-parse --show-toplevel    # 저장소 루트 절대경로
git rev-parse --git-dir          # .git 디렉터리 경로
git rev-parse --show-prefix      # 현재 위치의 저장소 루트 기준 상대경로
git rev-parse --show-cdup        # 저장소 루트까지의 상대경로 (예: "../../")
```

### 8.4. 저장소 상태 확인

```bash
git rev-parse --is-inside-work-tree    # "true" / "false"
git rev-parse --is-bare-repository     # "true" / "false"
git rev-parse --is-inside-git-dir      # "true" / "false"
```

### 8.5. 셸 스크립트 활용 패턴

```bash
# 저장소 루트로 이동
cd "$(git rev-parse --show-toplevel)"

# 현재 브랜치 이름 변수에 저장
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "현재 브랜치: $BRANCH"

# 커밋 존재 여부 검증 (없으면 exit 1)
git rev-parse --verify "$REV" > /dev/null 2>&1 || { echo "유효하지 않은 커밋"; exit 1; }

# HEAD와 origin/main이 같은지 확인 (배포 전 동기화 체크)
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
    echo "최신 상태"
fi

# Git 저장소 내부인지 확인
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Git 저장소 내부"
fi
```

---

## 9. git show — 특정 커밋/객체 상세 출력

```bash
git show HEAD             # 최신 커밋 + diff
git show HEAD~2           # 2개 전 커밋
git show abc1234          # SHA로 지정
git show v1.0.0           # 태그
git show HEAD:pom.xml     # 특정 커밋 시점의 파일 내용
git show HEAD~3:src/Main.java  # 3개 전 커밋 시점의 파일
```

---
## Sources
- [gitrevisions](https://git-scm.com/docs/gitrevisions)
- [git-rev-parse](https://git-scm.com/docs/git-rev-parse)

---
## Related pages
- [[git-log]]
- [[git-internals]]
- [[git-file-states]]
