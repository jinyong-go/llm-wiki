---
title: git stash
updated: 2026-10-24 23:26:53
tags:
  - git
  - vcs
---

## 1. 개요

커밋하지 않은 변경 내용을 스택에 임시 저장하고 워킹 트리를 HEAD 상태로 되돌린다. 브랜치 전환이나 긴급 수정 시 활용한다.

| 서브커맨드 | 설명 |
|-----------|------|
| `push` (기본값) | 변경 내용을 스태시에 저장하고 워킹 트리 복구 |
| `pop` | 최근 스태시를 꺼내 적용하고 스택에서 제거 |
| `apply` | 스태시를 적용하되 스택에서 제거하지 않음 |
| `list` | 스태시 목록 표시 |
| `show` | 스태시 내용 diff로 표시 |
| `drop` | 특정 스태시 삭제 |
| `branch` | 스태시를 새 브랜치에 적용 |
| `clear` | 스태시 전체 삭제 |

---

## 2. 내부 구조

스태시 엔트리는 두 부모를 가진 커밋이다.
- 첫 번째 부모 `H`: 저장 시점의 HEAD
- 두 번째 부모 `I`: 인덱스 상태 커밋
- 트리 `W`: 워킹 트리 상태

---

## 3. push

```bash
git stash                           # 기본 저장 (추적 파일의 변경, 스테이징 포함)
git stash push -m "작업 중: 결제 모듈"  # 설명 추가
git stash push src/Payment.java     # 특정 파일만 저장
```

### 3.1. 주요 옵션

```bash
-u / --include-untracked   # Untracked 파일도 포함
-a / --all                 # Ignored 파일까지 모두 포함
-k / --keep-index          # 스테이지된 변경은 그대로 유지 (워킹 트리만 되돌림)
-p / --patch               # 헝크 단위로 선택해 저장
-S / --staged              # 스테이지된 변경만 저장
```

### 3.2. `-k` 예시

```bash
git add -p                          # 일부만 스테이지
git stash push --keep-index         # 스테이지 외 변경은 스태시로
./gradlew test                      # staged 변경만 반영된 상태로 테스트
git stash pop                       # 나머지 복원
```

---

## 4. pop / apply

```bash
git stash pop                  # 최근 스태시 적용 + 제거
git stash pop stash@{2}        # 특정 스태시 지정

git stash apply                # 적용만 (스택에서 제거 안 함)
git stash apply --index        # 워킹 트리 + 인덱스 상태 모두 복원
```

충돌이 발생하면 `pop`은 스태시를 스택에서 제거하지 않고 남겨둔다.

---

## 5. list / show

```bash
git stash list
# stash@{0}: WIP on main: a3f1d2e feat: 로그인 구현
# stash@{1}: On feature/pay: 9c2b4f1 작업 중: 결제 모듈

git stash show                  # 최근 스태시의 diffstat
git stash show -p               # 전체 diff
git stash show stash@{1}        # 특정 스태시
```

---

## 6. stash 참조 문법

```
stash@{0}           최근 스태시
stash@{1}           이전 스태시
stash@{2.hours.ago} 2시간 전 스태시
```

인덱스를 생략하면 `stash@{0}`이 기본값이다.

---

## 7. branch

브랜치가 많이 달라져 `pop` 시 충돌이 예상될 때 유용하다.

```bash
git stash branch feature/new-work stash@{1}
# 해당 커밋 시점에서 새 브랜치 생성 → 스태시 적용 → 성공하면 스태시 제거
```

---

## 8. 브랜치 전환 중 변경 보관

```bash
# 긴급 hotfix: 현재 작업 보관 → 전환 → 복귀
git stash
git switch main
git switch -c hotfix/null-pointer
# ... 수정 및 커밋 ...
git switch feature/login
git stash pop
```

변경 일부만 보관하거나 스테이징된 변경만 저장하려면 §3.1의 `-p` 또는 `--staged`를 사용한다. 작업 트리가 깨끗하지 않은 상태에서 pull하는 흐름도 같은 방식으로 보관·복원할 수 있다.

---

## Sources
- [git-stash](https://git-scm.com/docs/git-stash)

---

## Related pages
- [[git-add]]
- [[git-commit]]
- [[git-switch-restore]]
- [[git-file-states]]
