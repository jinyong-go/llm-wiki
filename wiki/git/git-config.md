---
title: git config — 설정 관리
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

## 1. 설정 파일 위치와 우선순위

Git 설정은 범위(scope)에 따라 4개 레이어로 나뉜다. **아래로 갈수록 우선순위가 높다.**

| 범위 | 옵션 | 파일 위치 | 적용 대상 |
|------|------|-----------|-----------|
| system | `--system` | `/etc/gitconfig` | 시스템 전체 모든 사용자 |
| global | `--global` | `~/.gitconfig` 또는 `~/.config/git/config` | 현재 사용자 전체 저장소 |
| local | `--local` | `.git/config` | 해당 저장소만 (기본값) |
| worktree | `--worktree` | `.git/config.worktree` | 특정 worktree (extensions.worktreeConfig 필요) |

`local` > `global` > `system` 순으로 적용된다. local에서 설정한 값이 global을 덮어쓴다.

```bash
# 모든 설정과 출처 확인
git config --list --show-origin
git config --list --show-scope
```

---

## 2. 기본 명령어

```bash
# 설정값 읽기
git config <key>                       # 유효한 값 출력 (우선순위 가장 높은 것)
git config --get <key>                 # 동일
git config --get-regexp '^core\.'      # 정규식으로 일치하는 키 전체

# 설정값 쓰기
git config --global <key> <value>      # global에 저장
git config --local  <key> <value>      # local에 저장 (기본)

# 설정값 삭제
git config --global --unset <key>

# 설정 목록 보기
git config --list                      # 모든 범위 병합해서 출력
git config --global --list             # global만

# 에디터로 직접 편집
git config --global --edit             # ~/.gitconfig 열기
git config --local  --edit             # .git/config 열기
```

---

## 3. 자주 사용하는 설정

### 3.1. 사용자 정보

커밋 메타데이터에 기록된다. 저장소마다 다른 이메일을 써야 한다면 local로 덮어쓴다.

```bash
git config --global user.name  "홍길동"
git config --global user.email "hong@personal.com"

# 회사 저장소에서만 다른 이메일 사용
git config --local user.email "hong@company.com"
```

`user.useConfigOnly = true`를 설정하면 user.name / user.email이 명시되지 않은 저장소에서 커밋 시도 시 오류를 발생시켜 실수로 잘못된 이메일이 커밋되는 것을 방지한다.

```bash
git config --global user.useConfigOnly true
```

### 3.2. 초기 브랜치명

```bash
git config --global init.defaultBranch main
```

### 3.3. pull 동작 방식

```bash
# merge 대신 rebase로 pull (히스토리 선형 유지 권장)
git config --global pull.rebase true

# fast-forward만 허용 (merge/rebase 모두 안 함)
git config --global pull.ff only
```

### 3.4. push 동작 방식

```bash
# 현재 브랜치와 같은 이름의 원격 브랜치로만 push (기본값, 안전)
git config --global push.default simple

# push 시 추적 브랜치 자동 설정 (Git 2.37+)
git config --global push.autoSetupRemote true
```

`push.default` 값 비교:

| 값 | 동작 |
|----|------|
| `simple` | 현재 브랜치 → 같은 이름의 upstream (기본값) |
| `current` | 현재 브랜치 → 같은 이름의 원격 브랜치 |
| `upstream` | 현재 브랜치 → 추적 중인 upstream 브랜치 |
| `matching` | 로컬-원격 이름이 같은 모든 브랜치 동시 push (위험) |
| `nothing` | 명시적 refspec 없으면 push 거부 |

### 3.5. 에디터

```bash
git config --global core.editor "vim"
git config --global core.editor "code --wait"   # VS Code
git config --global core.editor "nano"
```

커밋 메시지, interactive rebase, `git commit --amend` 등에 사용된다.

### 3.6. 줄바꿈 처리

```bash
# macOS / Linux: 저장소에 CRLF가 들어오면 LF로 정규화, 체크아웃 시 변환 없음
git config --global core.autocrlf input

# Windows: 체크아웃 시 LF→CRLF, 커밋 시 CRLF→LF
git config --global core.autocrlf true

# 변환 없음 (모든 플랫폼 동일 파일 사용 시)
git config --global core.autocrlf false
```

### 3.7. 전역 .gitignore

IDE 파일, OS 파일 등 개인 환경에만 해당하는 무시 패턴을 저장소 `.gitignore`가 아닌 전역 파일로 관리한다.

```bash
git config --global core.excludesFile ~/.gitignore_global
```

```
# ~/.gitignore_global
.DS_Store
.idea/
*.iml
*.swp
Thumbs.db
```

### 3.8. 인증 정보 저장

```bash
# macOS keychain 사용 (macOS 권장)
git config --global credential.helper osxkeychain

# 메모리에 일정 시간 캐시 (Linux)
git config --global credential.helper "cache --timeout=3600"

# 파일에 평문 저장 (비권장)
git config --global credential.helper store
```

### 3.9. Alias (단축 명령)

```bash
git config --global alias.st   "status -s"
git config --global alias.co   "checkout"
git config --global alias.br   "branch"
git config --global alias.lg   "log --oneline --graph --decorate --all"
git config --global alias.unstage "restore --staged"
git config --global alias.last  "log -1 HEAD --stat"
```

사용:
```bash
git st        # git status -s
git lg        # 그래프 로그
git unstage pom.xml   # git restore --staged pom.xml
```

`!` 접두사로 외부 셸 명령도 alias 가능:
```bash
git config --global alias.publish '!git push -u origin $(git branch --show-current)'
```

### 3.10. merge / diff 도구

```bash
# merge 충돌 시 도구 지정
git config --global merge.tool vimdiff
git config --global merge.tool intellij

# diff 도구 지정
git config --global diff.tool vimdiff
```

사용:
```bash
git mergetool    # 충돌 파일을 merge.tool로 열기
git difftool     # diff.tool로 비교
```

### 3.11. 프록시

```bash
# 전체 HTTP/HTTPS 트래픽에 프록시
git config --global http.proxy  http://proxy.company.com:3128
git config --global https.proxy http://proxy.company.com:3128

# 특정 URL만 프록시 예외
git config --global http.https://internal.company.com.proxy ""

# 프록시 해제
git config --global --unset http.proxy
```

### 3.12. 그 외 유용한 설정

```bash
# 자동 수정 (오타 교정, 단위: 0.1초. 50 = 5초 후 자동 실행)
git config --global help.autocorrect 50

# 색상 출력 (기본값 auto)
git config --global color.ui auto

# 커밋 diff를 커밋 메시지 편집기에 포함 (내용 보며 메시지 작성)
git config --global commit.verbose true

# rebase 중 autostash (작업 중 변경사항 자동 stash/unstash)
git config --global rebase.autoStash true

# 브랜치 생성 시 자동으로 원격 추적 설정
git config --global branch.autoSetupMerge always

# diff 알고리즘 (histogram이 Myers보다 가독성 좋음)
git config --global diff.algorithm histogram
```

---

## 4. includeIf — 조건부 설정 파일 포함

디렉터리나 브랜치에 따라 다른 설정 파일을 자동 적용한다. 개인 프로젝트/회사 프로젝트를 구분하거나 특정 저장소 그룹에 다른 이메일을 적용할 때 유용하다.

```ini
# ~/.gitconfig
[user]
    name  = 홍길동
    email = hong@personal.com

[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

[includeIf "gitdir:~/oss/"]
    path = ~/.gitconfig-oss
```

```ini
# ~/.gitconfig-work
[user]
    email = hong@company.com
[core]
    sshCommand = ssh -i ~/.ssh/id_rsa_work
```

`~/work/` 하위의 저장소에서는 자동으로 `hong@company.com`이 사용된다.

조건 종류:

| 조건 | 의미 |
|------|------|
| `gitdir:/path/` | 저장소 경로 일치 |
| `gitdir/i:/path/` | 대소문자 무시 경로 일치 |
| `onbranch:main` | 현재 브랜치가 main |
| `hasconfig:remote.*.url:https://github.com/**` | remote URL 패턴 일치 |

---

## 5. 환경 변수 오버라이드

설정 파일 없이 일회성으로 설정값을 주입할 때 사용한다. CI/CD 파이프라인에서 특히 유용하다.

```bash
# -c 옵션: 단일 명령에 설정 적용
git -c user.email="ci@company.com" commit -m "auto commit"

# 환경 변수로 여러 설정 주입
GIT_CONFIG_COUNT=2 \
GIT_CONFIG_KEY_0=user.name \
GIT_CONFIG_VALUE_0="CI Bot" \
GIT_CONFIG_KEY_1=user.email \
GIT_CONFIG_VALUE_1="ci@company.com" \
git commit -m "ci: auto update"

# 전역 설정 파일 경로 변경
GIT_CONFIG_GLOBAL=/tmp/custom-gitconfig git config --list

# 시스템 설정 무시
GIT_CONFIG_NOSYSTEM=1 git config --list
```

---

## 6. 설정 우선순위 요약

```
GIT_CONFIG_* 환경변수 / git -c
        ↓ (높은 우선순위)
  .git/config  (local)
        ↓
  ~/.gitconfig  (global)
        ↓
  /etc/gitconfig  (system)
        ↓ (낮은 우선순위)
```

특정 키의 실제 적용값 확인:
```bash
git config user.email                     # 최종 적용값
git config --show-origin user.email       # 어느 파일에서 왔는지 포함
git config --show-scope user.email        # 범위(scope) 포함
```

---
## Sources
- [git-config](https://git-scm.com/docs/git-config)
- [Pro Git: Customizing Git Git Configuration](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)

---
## Related pages
- [[git-init]]
- [[git-clone]]
- [[git-internals]]
