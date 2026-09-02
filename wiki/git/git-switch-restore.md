---
title: git switch / restore — 브랜치 전환 및 파일 복원
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

Git 2.23에서 `git checkout`의 두 역할을 분리했다.

| 명령어 | 역할 | git checkout 대응 |
|--------|------|------------------|
| `git switch` | 브랜치 전환 | `git checkout <branch>` |
| `git restore` | 파일 복원 | `git checkout -- <file>` |

---

# git switch

## 1. 기본 전환

```bash
git switch main                 # 브랜치 전환
git switch -                    # 직전 브랜치로 복귀 (= git switch @{-1})
git switch --detach HEAD~2      # 특정 커밋으로 Detached HEAD 전환
```

## 2. 브랜치 생성 + 전환

```bash
git switch -c <name>            # 현재 HEAD에서 생성 + 전환
git switch -c <name> <start>    # 특정 지점에서 생성 + 전환
git switch -c <name> origin/feature  # 원격 기반 생성 (upstream 자동 설정)
git switch -C <name>            # 이미 존재하면 강제 초기화 후 전환
```

## 3. 원격 브랜치 추적

```bash
# origin에 동일 이름 브랜치 존재 시 자동 추적 브랜치 생성 (--guess 기본값)
git switch feature/login        # origin/feature/login 자동 추적

git switch --no-guess feature/login  # 자동 추적 비활성화
git switch -t origin/feature/login   # 명시적 upstream 설정
```

`checkout.guess = false` 설정으로 `--no-guess`를 기본값으로 만들 수 있다.

## 4. 로컬 변경 처리

```bash
git switch -f main              # 변경 버리고 강제 전환 (--discard-changes)
git switch -m main              # 3-way merge로 변경 유지하며 전환
git switch --conflict=diff3 main  # 충돌 마커 스타일 지정
```

## 5. 기타 옵션

```bash
git switch --orphan fresh-start  # 이력 없는 새 브랜치 생성 (모든 추적 파일 제거)
git switch --recurse-submodules main  # 서브모듈도 함께 전환
```

---

# git restore

워킹 트리 또는 인덱스의 파일을 특정 소스 기준으로 복원한다. 커밋 이력을 변경하지 않는다.

## 6. 복원 대상 지정

| 옵션 | 복원 대상 | 기본 소스 |
|------|----------|----------|
| (없음) | 워킹 트리 | 인덱스 |
| `--staged` (`-S`) | 인덱스 | HEAD |
| `--worktree` (`-W`) | 워킹 트리 | 인덱스 |
| `--staged --worktree` | 인덱스 + 워킹 트리 | HEAD |

```bash
git restore src/User.java               # 워킹 트리 복원 (인덱스 기준)
git restore --staged src/User.java      # unstage (HEAD 기준으로 인덱스 복원)
git restore --staged --worktree src/User.java  # 인덱스 + 워킹 트리 모두 HEAD로 복원
```

## 7. `--source` — 복원 기준 지정

```bash
git restore --source HEAD~2 src/User.java           # 2커밋 전 상태로 복원
git restore --source main src/config/application.yml  # 다른 브랜치 파일로 복원
git restore --source v1.0.0 src/User.java           # 태그 기준 복원
```

## 8. 삭제된 파일 복구

```bash
git restore src/DeletedFile.java   # 인덱스에 있는 파일을 워킹 트리에 복원
```

인덱스에도 없는 경우(커밋에만 있는 경우):
```bash
git restore --source HEAD src/DeletedFile.java
```

## 9. 대화형 복원

```bash
git restore -p src/User.java       # 헝크 단위 선택 복원
```

---

## 10. git checkout과의 관계

```bash
# 아래 두 명령은 동일
git checkout main
git switch main

# 아래 두 명령은 동일
git checkout -- src/User.java
git restore src/User.java

# 아래 두 명령은 동일
git checkout HEAD~2 src/User.java
git restore --source HEAD~2 src/User.java

# 아래 두 명령은 동일
git reset HEAD src/User.java
git restore --staged src/User.java
```

`git checkout`은 여전히 동작하지만, `git switch`와 `git restore`가 각 역할에 더 명확하다.

---

## 11. 실용 패턴

```bash
# 수정 내용 버리기
git restore src/User.java          # 특정 파일
git restore .                      # 전체

# 스테이지 취소
git restore --staged src/User.java

# 다른 브랜치의 설정 파일만 가져오기
git restore --source hotfix/db-config src/config/db.yml

# 실수로 삭제한 파일 복구
git restore src/MissingFile.java

# feature 브랜치 전환 (원격 자동 추적)
git switch feature/payment
```

---
## Sources
- [git-switch](https://git-scm.com/docs/git-switch)
- [git-restore](https://git-scm.com/docs/git-restore)

---
## Related pages
- [[git-branch]]
- [[git-stash]]
- [[git-reset-revert]]
- [[git-detached-head]]
- [[git-file-states]]
