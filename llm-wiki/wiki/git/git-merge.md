---
title: git merge — 브랜치 병합
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

두 개 이상의 브랜치 이력을 하나로 합친다.

---

## 1. Fast-Forward 제어

```bash
git merge feature/login          # 기본: FF 가능하면 FF, 아니면 merge commit
git merge --no-ff feature/login  # 항상 merge commit 생성 (이력에 병합 사실 기록)
git merge --ff-only feature/login  # FF만 허용, 불가능하면 중단
git merge --squash feature/login   # 변경 내용만 적용, 커밋은 직접 생성
```

### 1.1. 방식 비교

| 옵션 | merge commit 생성 | 브랜치 이력 보존 | 용도 |
|------|-----------------|----------------|------|
| `--ff` (기본) | FF 가능 시 안 함 | 부분적 | 일반 |
| `--no-ff` | 항상 | ✓ | feature 브랜치 병합 |
| `--ff-only` | 안 함 | ✗ | pull 전략 강제 |
| `--squash` | 안 함 (직접 커밋) | ✗ | 브랜치 이력 정리 |

---

## 2. 머지 전략

```bash
git merge -s ort feature         # ort 전략 (기본, 3-way merge)
git merge -s ours other          # 현재 브랜치 내용 유지, 상대 이력만 흡수
git merge -s octopus a b c       # 다수 브랜치 동시 병합
```

### 2.1. 전략 옵션 (`-X`)

```bash
git merge -X ours feature        # 충돌 시 현재 브랜치 우선
git merge -X theirs feature      # 충돌 시 상대 브랜치 우선
git merge -X ignore-space-change # 공백 변경 무시
git merge -X patience            # patience 알고리즘으로 diff
```

---

## 3. 충돌 해결

### 3.1. 충돌 발생 시 흐름

```bash
git merge feature/login
# CONFLICT (content): Merge conflict in src/UserService.java
# Automatic merge failed; fix conflicts and then commit the result.

# 1. 충돌 파일 편집 (마커 제거)
vim src/UserService.java

# 2. 해결된 파일 스테이지
git add src/UserService.java

# 3. 머지 커밋 생성
git merge --continue    # 또는 git commit
```

### 3.2. 충돌 마커

```
<<<<<<< HEAD (현재 브랜치)
현재 브랜치 내용
=======
상대 브랜치 내용
>>>>>>> feature/login
```

`merge.conflictStyle = diff3` 설정 시 공통 조상도 표시된다:
```
<<<<<<< HEAD
현재 내용
||||||| 공통 조상 내용
=======
상대 내용
>>>>>>> feature/login
```

### 3.3. 충돌 확인 도구

```bash
git diff                         # 현재 충돌 상태
git diff AUTO_MERGE              # 충돌 해결 과정 diff
git show :1:src/UserService.java # 공통 조상 버전
git show :2:src/UserService.java # HEAD 버전
git show :3:src/UserService.java # MERGE_HEAD 버전
git log --merge -p src/UserService.java  # 양쪽 변경 이력
```

---

## 4. 머지 중단 / 재개

```bash
git merge --abort     # 머지 전 상태로 완전 복구
git merge --continue  # 충돌 해결 후 재개
git merge --quit      # 머지 상태만 초기화 (워킹 트리 유지)
```

---

## 5. 주요 옵션

```bash
git merge --no-commit feature    # 머지는 하되 커밋 중단 (검토 후 직접 커밋)
git merge --edit feature         # 자동 생성된 메시지를 에디터에서 편집
git merge --no-edit feature      # 메시지 편집 건너뜀
git merge --autostash feature    # dirty 워킹 트리를 자동 stash/pop
git merge --allow-unrelated-histories other  # 공통 조상 없는 저장소 병합
git merge --verify-signatures feature  # 서명 검증
```

---

## 6. 실용 패턴

```bash
# feature 브랜치 병합 (이력 보존)
git switch main
git merge --no-ff feature/login -m "Merge feature/login into main"

# pull 시 FF만 허용 (merge commit 방지)
git config pull.ff only

# squash merge 후 직접 커밋
git merge --squash feature/cleanup
git commit -m "cleanup: 코드 정리"

# 충돌 시 전체 파일을 한쪽으로 취하기
git checkout --ours src/config.yml    # 현재 브랜치 버전
git checkout --theirs src/config.yml  # 상대 브랜치 버전
git add src/config.yml
```

---
## Sources
- [git-merge](https://git-scm.com/docs/git-merge)

---
## Related pages
- [[git-rebase]]
- [[git-branch]]
- [[git-reset-revert]]
- [[git-internals]]
