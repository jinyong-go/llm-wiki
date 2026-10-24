---
title: git fetch / pull / push
updated: 2026-10-24 23:22:01
tags:
  - git
  - vcs
---

## 1. 개요

원격 저장소와 로컬 저장소를 동기화하는 3개 명령을 다룬다.

| 명령어 | 방향 | 로컬 변경 |
|--------|------|----------|
| `fetch` | 원격 → 로컬 | 원격 추적 브랜치만 갱신 (워킹 트리 불변) |
| `pull` | 원격 → 로컬 | fetch + merge (또는 rebase) |
| `push` | 로컬 → 원격 | 원격 ref 업데이트 |

---

## 2. git fetch

원격 커밋·ref를 다운로드한다. 로컬 브랜치와 워킹 트리는 변경하지 않는다.

### 2.1. 기본 사용

```bash
git fetch origin              # 기본 원격 fetch
git fetch origin main         # 특정 브랜치만 fetch
git fetch --all               # 모든 원격 fetch
git fetch --dry-run           # 실제 다운로드 없이 동작 확인
```

### 2.2. refspec

```bash
# +<src>:<dst> 형식. + 는 fast-forward가 아니어도 강제 업데이트
git fetch origin main:refs/remotes/origin/main
git fetch origin '+refs/heads/*:refs/remotes/origin/*'
```

### 2.3. 태그 처리

```bash
git fetch --tags              # 원격 태그 전체 fetch
git fetch --no-tags           # 태그 제외
```

기본값: fetch한 커밋이 가리키는 태그만 함께 가져온다.

### 2.4. `--prune`

```bash
git fetch --prune             # 원격에서 삭제된 브랜치 ref 정리
git fetch --prune --prune-tags  # 원격에서 삭제된 태그도 정리 (--prune 활성화 필요)

# 설정으로 기본값 변경
git config --global fetch.prune true
```

### 2.5. shallow clone

```bash
git fetch --depth=10          # 최근 10개 커밋까지만 fetch
git fetch --unshallow         # shallow → full 전환
```

### 2.6. FETCH_HEAD

fetch 직후 `FETCH_HEAD`에 가져온 ref 목록이 기록된다.

```bash
git merge FETCH_HEAD          # fetch한 내용을 현재 브랜치에 머지
git log FETCH_HEAD            # fetch한 이력 확인
```

---

## 3. git pull

`git fetch` + `git merge` (또는 `git rebase`)를 순서대로 실행한다.
조정 방식(`--rebase`, `--no-rebase` 또는 `pull.rebase`, `pull.ff` 설정)을 지정하지 않으면 fast-forward만 수행하며, 로컬과 원격이 diverged 상태면 실패한다.

### 3.1. 기본 사용

```bash
git pull                      # upstream fetch 후 fast-forward (조정 방식 미설정 시)
git pull origin main          # 원격/브랜치 명시
```

### 3.2. `--rebase`

```bash
git pull --rebase             # fetch + rebase
git pull --rebase=interactive # fetch + interactive rebase

# 기본값으로 설정
git config --global pull.rebase true
```

merge pull은 머지 커밋을 생성하고 rebase pull은 로컬 커밋을 원격 커밋 위로 재배치해 선형 이력을 유지한다.[^1]

### 3.3. `--ff-only`

```bash
git pull --ff-only            # fast-forward 가능할 때만 진행, 불가 시 중단

# 기본값으로 설정
git config --global pull.ff only
```

diverged 상태에서 실수로 머지 커밋을 만드는 것을 방지한다.

### 3.4. `--no-commit` / `--squash`

```bash
git pull --no-commit          # 머지까지만 하고 커밋은 직접 생성
git pull --squash             # fetch한 커밋을 하나로 합쳐 스테이지에 올림
```

### 3.5. diverged 브랜치 처리

로컬과 원격이 각각 커밋을 가진 경우:

```bash
# 방법 1: merge (머지 커밋 생성)
git pull --no-rebase

# 방법 2: rebase (선형 이력 유지)
git pull --rebase

# 방법 3: fast-forward만 허용 (조정 방식 미설정 시 기본 동작, diverged 시 실패)
git pull --ff-only
```

---

## 4. git push

로컬 ref를 원격 저장소로 업로드한다.

### 4.1. 기본 사용

```bash
git push origin main          # 원격/브랜치 명시
git push                      # upstream 설정된 경우 생략 가능
```

### 4.2. `-u` / `--set-upstream`

```bash
git push -u origin main       # push + upstream 등록 (최초 1회)
# 이후 git push / git pull 만으로 동작
```

### 4.3. refspec

```bash
git push origin main:feature  # 로컬 main → 원격 feature로 push
git push origin :old-branch   # 원격 브랜치 삭제 (빈 src)
git push origin --delete old-branch  # 원격 브랜치 삭제 (명시적)
```

### 4.4. 강제 push

```bash
git push --force                  # 원격 이력 덮어쓰기
git push --force-with-lease       # 원격 ref가 원격 추적 브랜치 값과 같을 때만 강제 push
git push --force-with-lease=main  # 특정 브랜치만 lease 확인
```

`--force-with-lease`: push 전 원격 ref가 원격 추적 브랜치 값과 일치하는지 확인한다. 다른 사람의 커밋을 덮어쓰는 사고를 방지한다.

### 4.5. 태그 push

태그 push와 원격 태그 삭제는 [[git-tag]] §6에서 다룬다.

### 4.6. `--dry-run`

```bash
git push --dry-run                # 실제 push 없이 동작 확인
```

### 4.7. push.default

| 값 | 동작 |
|----|------|
| `simple` | upstream과 이름이 같을 때만 push (기본값, Git 2.0+) |
| `current` | 동일 이름의 원격 브랜치로 push (upstream 불필요) |
| `upstream` | upstream으로 push (이름 달라도 허용) |
| `matching` | 로컬·원격에 동일 이름 브랜치가 모두 있으면 전부 push |
| `nothing` | refspec 명시 강제 |

```bash
git config --global push.default simple
```

---

## 5. 실용 패턴

```bash
# 새 브랜치 push + upstream 등록
git switch -c feature/payment
git push -u origin feature/payment

# rebase 후 강제 push (공유 브랜치 주의)
git rebase main
git push --force-with-lease

# 최신 원격 상태 확인 후 fast-forward pull
git fetch --prune
git pull --ff-only
```

---

## Sources
- [git-fetch](https://git-scm.com/docs/git-fetch)
- [git-pull](https://git-scm.com/docs/git-pull)
- [git-push](https://git-scm.com/docs/git-push)

---

## Related pages
- [[git-branch]]
- [[git-merge]]
- [[git-rebase]]
- [[git-tag]]
- [[git-clone]]

---

[^1]: rebase는 로컬 커밋을 새 커밋으로 재작성하므로 아직 push하지 않은 커밋에만 안전하다([[git-rebase]] §1). 두 방식 중 무엇을 기본값으로 둘지는 이력 형태에 대한 팀 정책에 따른 선택이다.
