---
title: git add — 스테이징
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

워킹 트리의 변경 내용을 인덱스(스테이징 영역)에 등록한다. `git commit`은 인덱스에 있는 내용만 커밋한다.

---

## 1. 기본 사용법

```bash
git add <path>        # 특정 파일/디렉터리
git add .             # 현재 디렉터리 이하 전체 (new/modified/deleted)
git add -A            # 저장소 전체 (new/modified/deleted)
git add -u            # 추적 중인 파일만 (modified/deleted, 신규 제외)
```

### 1.1. `-A` vs `-u` vs `.` 차이

| 옵션 | 신규 파일 | 수정 파일 | 삭제 파일 | 범위 |
|------|----------|----------|----------|------|
| `-A` | ✓ | ✓ | ✓ | 저장소 전체 |
| `-u` | ✗ | ✓ | ✓ | 저장소 전체 |
| `.` | ✓ | ✓ | ✓ | 현재 디렉터리 이하 |

---

## 2. 대화형 스테이징

### 2.1. `-p` / `--patch` — 헝크 단위 선택

파일 전체가 아닌 변경 블록(hunk) 단위로 선택해 스테이징한다.

```bash
git add -p              # 모든 변경 헝크 순회
git add -p src/User.java  # 특정 파일만
```

**헝크 선택 키:**

| 키 | 동작 |
|----|------|
| `y` | 이 헝크를 스테이지 |
| `n` | 스킵 |
| `q` | 종료 (나머지 모두 스킵) |
| `a` | 이 헝크 및 이후 모두 스테이지 |
| `d` | 이 헝크 및 이후 모두 스킵 |
| `s` | 현재 헝크를 더 작게 분할 |
| `e` | 에디터로 직접 편집 |
| `?` | 도움말 |

### 2.2. `-i` / `--interactive` — 전체 메뉴

```bash
git add -i
```

status / update / revert / add untracked / patch / diff 등 서브커맨드를 메뉴로 제공한다. `-p`는 patch 서브커맨드로 직접 진입하는 단축 형태다.

---

## 3. 기타 옵션

```bash
git add -N <file>         # intent-to-add: 내용 없이 경로만 등록 (git diff에 unstaged로 표시됨)
git add --chmod=+x <file> # 실행 권한 비트를 인덱스에만 적용 (디스크 파일 불변)
git add -f <file>         # .gitignore에 걸린 파일 강제 추가
git add -n                # dry-run (실제 스테이지 없이 결과 미리 보기)
git add --renormalize -A  # core.autocrlf 변경 후 전체 파일 line ending 재정규화
```

---

## 4. 실용 패턴

```bash
# 커밋 전 변경 내용 확인
git diff --staged         # 인덱스 vs HEAD (스테이지된 변경)

# 일부만 스테이지하고 나머지 테스트
git add -p src/Service.java
git stash push --keep-index   # 스테이지 외 변경 임시 보관
./gradlew test
git stash pop

# 실행 권한 변경 (OS가 달라 diff에 노이즈 생길 때)
git add --chmod=+x scripts/deploy.sh
```

---
## Sources
- [git-add](https://git-scm.com/docs/git-add)
- [git-restore](https://git-scm.com/docs/git-restore)

---
## Related pages
- [[git-file-states]]
- [[git-commit]]
- [[git-switch-restore]]
- [[git-stash]]
