---
title: Git 파일 상태와 상태 전환 명령어
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

## 1. 파일 상태 라이프사이클

```
                    ┌──────────────────────────────────────────────┐
                    │              Working Tree                    │
  ┌─────────────┐   │  ┌───────────┐       ┌────────────────────┐ │   ┌──────────────┐
  │  Untracked  │   │  │Unmodified │       │      Modified      │ │   │    Staged    │
  │  (미추적)   │   │  │ (추적됨,  │       │  (추적됨, 변경됨,  │ │   │  (다음 커밋  │
  │             │   │  │변경 없음) │       │   스테이징 안 됨)  │ │   │   대기 중)   │
  └──────┬──────┘   │  └─────┬─────┘       └─────────┬──────────┘ │   └──────┬───────┘
         │          │        │                        │            │          │
         │          │        │ 파일 수정              │            │          │
         │          │        │ ──────────────────────►│            │          │
         │          │        │                        │ git add    │          │
         │ git add  │        │◄─────────────────────────────────────────────►│          │
         │──────────┼────────┼────────────────────────┼─────────── ────────────────────►│
         │          │        │                        │            │          │
         │          │        │◄───────────────────────────────────────────────────────── git commit
         │          │        │                        │            │          │
         │◄─────────┼────────┼────────────────────────┼────────────┼──────────┼── git rm --cached
         │          └────────┴────────────────────────┴────────────┘          │
         └──────────────────────────────────────────────────────────── git rm ─┘
```

### 1.1. 상태 요약

| 상태 | 위치 | 설명 |
|------|------|------|
| **Untracked** | Working Tree | Git이 전혀 모르는 새 파일. 마지막 스냅샷에도, 스테이징에도 없음 |
| **Unmodified** | Working Tree | 추적 중이며 마지막 커밋 이후 변경 없음 |
| **Modified** | Working Tree | 추적 중이며 마지막 커밋 이후 변경됨. 아직 스테이징 안 됨 |
| **Staged** | Staging Area | 다음 커밋에 포함될 것으로 표시됨 (`git add` 이후) |

---

## 2. 상태 확인

### 2.1. git status

```bash
git status           # 전체 상태
git status -s        # 짧은 형식 (short)
git status --short
```

`-s` 출력 형식 — 두 자리 컬럼: `[Staging Area][Working Tree]`

```
?? new-file.txt        # Untracked
A  staged-new.txt      # 새 파일, Staged
 M modified.txt        # Modified (스테이징 안 됨)
M  staged-mod.txt      # Modified + Staged
MM both.txt            # Staged 이후 Working Tree에서 또 수정됨
D  deleted.txt         # 삭제됨 (스테이징 안 됨)
```

| 기호 | 의미 |
|------|------|
| `??` | Untracked |
| `A` | Staging Area에 새로 추가됨 |
| `M` | Modified |
| `D` | Deleted |
| `R` | Renamed |
| `C` | Copied |

### 2.2. git diff

```bash
git diff             # Working Tree vs Staging Area (Unstaged 변경)
git diff --staged    # Staging Area vs 마지막 커밋 (Staged 변경)
git diff --cached    # --staged 와 동일
git diff HEAD        # Working Tree vs 마지막 커밋 (전체 변경)
git diff <commit>    # 특정 커밋과 비교
```

> `git diff`는 스테이징된 내용이 없으면 아무것도 출력하지 않는다. 스테이징된 변경만 보려면 반드시 `--staged`를 붙인다.

---

## 3. 상태 전환 명령어

### 3.1. git add — Untracked/Modified → Staged

```bash
git add <file>          # 특정 파일 스테이징
git add <dir>/          # 디렉터리 내 전체 스테이징
git add .               # 현재 디렉터리 기준 모든 변경 스테이징
git add -p              # 변경을 hunk 단위로 선택적 스테이징 (interactive patch)
```

`git add`는 **실행 시점의 파일 내용**을 스테이징한다. `git add` 이후 파일을 다시 수정하면 이전 버전만 스테이징된 상태이므로 `git add`를 다시 실행해야 한다.

`git add`의 3가지 역할:
1. Untracked 파일 추적 시작
2. Modified 파일 스테이징
3. Merge 충돌 파일을 해결됨으로 표시

### 3.2. git commit — Staged → Committed

```bash
git commit                   # 에디터에서 메시지 작성
git commit -m "message"      # 인라인 메시지
git commit -v                # 에디터에 diff 포함 (변경 내용 확인하며 작성)
git commit -a -m "message"   # 추적 중인 Modified 파일을 자동 스테이징 후 커밋
                              # Untracked 파일은 포함되지 않음
git commit --amend           # 마지막 커밋 수정 (메시지 또는 내용)
```

커밋 출력 읽기:
```
[main 463dc4f] feat: 로그인 기능 추가
 2 files changed, 45 insertions(+), 3 deletions(-)
 create mode 100644 src/LoginService.java
```

| 필드 | 설명 |
|------|------|
| `main` | 브랜치명 |
| `463dc4f` | 커밋 SHA 앞 7자 |
| `create mode 100644` | 새 파일 생성 (권한 644) |

### 3.3. git restore — Staged/Modified → 이전 상태 복원

```bash
git restore <file>             # Working Tree 변경 취소 → 마지막 커밋/스테이지 상태로
git restore --staged <file>    # Staged → Unstaged (스테이징 취소, 파일 내용은 유지)
git restore --staged .         # 전체 스테이징 취소
git restore --source=HEAD~2 <file>  # 특정 커밋 기준으로 복원
```

> `git restore`는 Git 2.23에서 추가됐다. 이전 버전에서는 `git checkout -- <file>` (Working Tree 복원), `git reset HEAD <file>` (스테이징 취소)를 사용한다.

### 3.4. git rm — 추적 중단 및 삭제

```bash
git rm <file>              # Working Tree에서 삭제 + 스테이징 영역에서 제거
git rm --cached <file>     # 스테이징 영역에서만 제거 (파일은 디스크에 유지)
                           # → 이후 Untracked 상태
git rm -f <file>           # Modified 또는 Staged 상태인 파일 강제 삭제
git rm -r --cached <dir>/  # 디렉터리 전체를 추적 중단 (.gitignore 적용 전 커밋된 파일 제거 시)
```

실수로 커밋된 파일 추적 중단:
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "chore: remove .env from tracking"
```

### 3.5. git mv — 이름 변경 / 이동

```bash
git mv old-name.java NewName.java
git mv src/Foo.java src/bar/Foo.java
```

내부적으로 `git rm` + `git add`와 동일. Git은 명시적 `mv` 없이 수동으로 파일을 이동/삭제한 뒤 `add`해도 rename으로 자동 감지한다.

---

## 4. .gitignore

Untracked 파일 중 Git이 무시해야 할 파일 패턴을 정의.

```
# 주석
*.class          # 확장자 일치
*.jar
target/          # 디렉터리 전체 (하위 포함)
build/
.env             # 특정 파일
*.log

/TODO            # 루트의 TODO만 (하위 디렉터리 TODO는 제외)
doc/*.txt        # doc 바로 아래 .txt (doc/sub/a.txt 제외)
doc/**/*.pdf     # doc 하위 전체 .pdf

!lib.a           # 예외: *.a 무시하지만 lib.a는 추적
```

자바 백엔드 프로젝트 기본:
```
# Build
target/
build/
*.class
*.jar
*.war

# IDE
.idea/
*.iml
.eclipse/
.settings/
.classpath
.project

# 환경 설정
.env
*.env.local
application-local.yml
application-local.properties

# OS
.DS_Store
Thumbs.db
```

> 이미 커밋된 파일은 `.gitignore`를 추가해도 무시되지 않는다. `git rm --cached`로 추적을 먼저 중단해야 한다.

---

## 5. 상태 전환 요약표

| 명령어 | Before | After |
|--------|--------|-------|
| `git add <file>` | Untracked | Staged |
| `git add <file>` | Modified | Staged |
| `git commit` | Staged | Committed (Unmodified) |
| 파일 편집 | Unmodified | Modified |
| `git restore <file>` | Modified | Unmodified |
| `git restore --staged <file>` | Staged | Modified 또는 Untracked |
| `git rm <file>` | Unmodified/Modified | 삭제됨 (Staged for deletion) |
| `git rm --cached <file>` | Staged/Unmodified | Untracked (파일 유지) |

---
## Sources
- [Pro Git: Git Basics Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [Pro Git: Getting Started What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)

---
## Related pages
- [[git-internals]]
