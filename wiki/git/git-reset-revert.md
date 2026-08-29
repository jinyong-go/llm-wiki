---
title: git reset / revert — 변경 되돌리기
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

## 1. reset vs revert 선택 기준

| 상황 | 도구 | 이유 |
|------|------|------|
| 아직 push하지 않은 커밋 되돌리기 | `reset` | 이력 자체를 수정 |
| 이미 push한 커밋 되돌리기 | `revert` | 새 커밋으로 역변환 생성 (이력 유지) |
| 스테이지 취소 (unstage) | `reset HEAD <file>` 또는 `restore --staged` | 인덱스만 조작 |
| 워킹 트리 파일 되돌리기 | `restore` | HEAD/커밋 기준 복원 |

---

# git reset

HEAD를 지정한 커밋으로 이동하고, 모드에 따라 인덱스와 워킹 트리를 동기화한다.

## 2. 모드 비교

```bash
git reset --soft  <commit>   # HEAD만 이동
git reset --mixed <commit>   # HEAD + 인덱스 (기본값)
git reset --hard  <commit>   # HEAD + 인덱스 + 워킹 트리
```

| 모드 | HEAD 이동 | 인덱스 변경 | 워킹 트리 변경 | 데이터 손실 |
|------|----------|-----------|--------------|-----------|
| `--soft` | ✓ | ✗ | ✗ | 없음 |
| `--mixed` | ✓ | ✓ | ✗ | 없음 |
| `--hard` | ✓ | ✓ | ✓ | ⚠️ 있음 |

### 2.1. `--soft` — 커밋 합치기

```bash
git reset --soft HEAD~3
git commit -m "세 커밋을 하나로 합침"
```

staged 상태가 유지되므로 바로 다시 커밋할 수 있다.

### 2.2. `--mixed` — unstage

기본 모드다.

```bash
git reset HEAD~1             # 직전 커밋 해제, 변경은 워킹 트리에 남음
git reset -- src/User.java   # 특정 파일만 unstage (HEAD 이동 없음)
```

### 2.3. `--hard` — 완전 폐기

```bash
git reset --hard HEAD~2      # 최근 2개 커밋과 변경 모두 삭제
git reset --hard ORIG_HEAD   # 직전 merge/reset 이전으로 복구
```

> **주의**: `--hard`는 커밋되지 않은 변경도 삭제한다. 복구하려면 `git reflog`를 사용한다.

## 3. ORIG_HEAD

`reset`, `merge`, `rebase` 등 큰 동작 직전 HEAD 위치를 자동으로 저장한다.

```bash
git reset --hard ORIG_HEAD   # 직전 merge/rebase/reset 취소
```

## 4. 경로 지정 reset (unstage)

HEAD는 이동하지 않고 인덱스만 변경한다.

```bash
git reset -- src/User.java        # HEAD 기준으로 unstage
git reset HEAD~1 -- src/User.java # 특정 커밋 기준으로 unstage
git reset -p                      # 헝크 단위 대화형 unstage
```

---

# git revert

지정한 커밋의 변경을 역으로 적용하는 **새 커밋**을 생성한다. 이력을 수정하지 않으므로 공유 브랜치에서 안전하다.

## 5. 기본 사용법

```bash
git revert HEAD             # 직전 커밋 되돌리기
git revert HEAD~2           # 3번째 전 커밋 되돌리기
git revert abc1234          # 특정 SHA 되돌리기
```

## 6. 여러 커밋 한 번에

```bash
git revert -n HEAD~3..HEAD  # 3개 커밋을 하나의 커밋으로 되돌리기
git revert --continue        # 충돌 해결 후 재개
git revert --abort           # 전체 취소
```

`-n` / `--no-commit`: 변경만 적용하고 커밋은 직접 생성한다. 여러 커밋을 하나의 revert 커밋으로 묶을 때 사용한다.

## 7. 머지 커밋 revert (`-m`)

머지 커밋은 부모가 둘이므로 어느 쪽을 mainline으로 볼지 지정해야 한다.

```bash
git revert -m 1 <merge-commit>   # 1번 부모(머지 받은 쪽, 보통 main)를 기준으로 되돌림
```

> **주의**: 머지 커밋을 revert한 뒤 같은 브랜치를 다시 머지하면 이전에 revert된 변경이 포함되지 않는다. 재머지 전에 revert 커밋을 한 번 더 revert해야 한다.

---

## 8. 실용 패턴

```bash
# 실수한 로컬 커밋 완전 제거
git reset --hard HEAD~1

# push 전 커밋 분리 (내용은 유지)
git reset --soft HEAD~1
git add -p
git commit -m "첫 번째 부분"
git commit -m "두 번째 부분"

# 배포 후 장애 발생 시 빠른 롤백
git revert HEAD --no-edit
git push origin main

# 특정 기능 커밋 여러 개를 하나의 revert로
git revert -n abc123 def456 ghi789
git commit -m "revert: 결제 모듈 기능 롤백"
```

---
## Sources
- [git-reset](https://git-scm.com/docs/git-reset)
- [git-revert](https://git-scm.com/docs/git-revert)

---
## Related pages
- [[git-commit]]
- [[git-rebase]]
- [[git-switch-restore]]
- [[git-revisions]]
- [[git-detached-head]]
