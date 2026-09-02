---
title: 셸 커서 이동 및 편집 단축키 — Readline Emacs / Vi 모드
updated: 2026-07-14 14:35:36
tags:
  - linux
  - bash
  - cli
---

## 1. 개요

bash와 zsh는 **GNU Readline** 라이브러리를 사용해 명령어 입력 중 커서 이동, 텍스트 편집, 히스토리 검색을 지원한다. 두 가지 편집 모드를 제공한다.

| 모드 | 특징 | 기본값 |
|------|------|--------|
| Emacs 모드 | `Ctrl`/`Alt` 조합키. 항상 입력 상태 | bash/zsh 기본 |
| Vi 모드 | Insert/Command 두 모드 전환. vim 키 바인딩 | 별도 설정 필요 |

---

## 2. 모드 전환 및 설정

### 2.1. 세션 내 전환

```bash
# bash
set -o emacs    # Emacs 모드 활성화
set -o vi       # Vi 모드 활성화

# zsh
bindkey -e      # Emacs 모드
bindkey -v      # Vi 모드
```

### 2.2. 영구 설정

**bash** — `~/.bashrc`에 추가:
```bash
set -o vi
```

**zsh** — `~/.zshrc`에 추가:
```bash
bindkey -v
```

### 2.3. ~/.inputrc — Readline 전역 설정

bash와 readline을 사용하는 모든 프로그램에 적용된다.

```
# ~/.inputrc

# Vi 모드를 기본으로
set editing-mode vi

# Vi command mode에서 커서 모양을 블록으로 변경 (지원 터미널)
set vi-cmd-mode-string "\1\e[2 q\2"
set vi-ins-mode-string "\1\e[6 q\2"

# 대소문자 무시 완성
set completion-ignore-case on

# 완성 목록 즉시 표시 (Tab 두 번 불필요)
set show-all-if-ambiguous on

# 색상으로 완성 목록 구분
set colored-stats on
```

설정 즉시 반영: `Ctrl+x Ctrl+r` (bash) 또는 새 셸 시작.

---

## 3. Emacs 모드

> macOS에서는 Alt 대신 Option 키 또는 `Esc` 접두사를 사용한다.

### 3.1. 커서 이동

| 단축키 | 동작 |
|--------|------|
| `Ctrl+a` | 줄 처음으로 |
| `Ctrl+e` | 줄 끝으로 |
| `Ctrl+f` | 한 글자 앞으로 |
| `Ctrl+b` | 한 글자 뒤로 |
| `Alt+f` | 한 단어 앞으로 |
| `Alt+b` | 한 단어 뒤로 |
| `Ctrl+x Ctrl+x` | 줄 처음과 현재 위치 사이 토글 |

### 3.2. 편집 및 삭제

| 단축키 | 동작 |
|--------|------|
| `Ctrl+d` | 커서 위치 글자 삭제 (Delete) |
| `Backspace` / `Ctrl+h` | 커서 앞 글자 삭제 |
| `Ctrl+k` | 커서부터 줄 끝까지 잘라내기 (kill) |
| `Ctrl+u` | 커서부터 줄 처음까지 잘라내기 |
| `Alt+d` | 커서 위치부터 단어 끝까지 잘라내기 |
| `Alt+Backspace` / `Ctrl+w` | 커서 앞 단어 잘라내기 |
| `Ctrl+y` | 마지막으로 잘라낸 내용 붙여넣기 (yank) |
| `Alt+y` | yank 후 kill ring을 순환하며 이전 항목으로 교체 |
| `Ctrl+t` | 커서 앞 두 글자 순서 교환 (오타 교정) |
| `Alt+t` | 커서 앞 두 단어 순서 교환 |
| `Ctrl+_` / `Ctrl+x Ctrl+u` | 되돌리기 (undo) |
| `Alt+r` | 줄 전체를 히스토리 원본으로 되돌리기 |

> **Kill Ring**: `Ctrl+k`, `Ctrl+u`, `Alt+d`, `Ctrl+w` 등 잘라내기 명령은 내용을 kill ring에 쌓는다. `Ctrl+y`로 가장 최근 항목을 붙여넣고, `Alt+y`를 반복해 이전 항목을 순환할 수 있다.

### 3.3. 대소문자 변환

| 단축키 | 동작 |
|--------|------|
| `Alt+u` | 커서 위치부터 단어 끝까지 대문자로 |
| `Alt+l` | 커서 위치부터 단어 끝까지 소문자로 |
| `Alt+c` | 커서 위치 글자를 대문자로 + 단어 끝으로 이동 |

### 3.4. 히스토리

| 단축키 | 동작 |
|--------|------|
| `Ctrl+p` / `↑` | 이전 명령 |
| `Ctrl+n` / `↓` | 다음 명령 |
| `Ctrl+r` | 히스토리 역방향 증분 검색 (입력할수록 좁혀짐) |
| `Ctrl+s` | 히스토리 정방향 증분 검색 |
| `Ctrl+g` | 히스토리 검색 취소, 원래 줄 복원 |
| `Ctrl+o` | 검색으로 찾은 명령 실행 후 다음 히스토리로 이동 |
| `Alt+.` | 이전 명령의 마지막 인자 삽입 (반복 시 더 이전) |
| `Alt+>` | 히스토리 가장 끝(최신)으로 |
| `Alt+<` | 히스토리 가장 처음(가장 오래된)으로 |

> `Ctrl+r`로 검색 중: 추가 입력 시 더 좁혀짐, `Ctrl+r` 반복 시 이전 매칭으로 이동, `Enter`로 실행, `Ctrl+g`로 취소.

### 3.5. 완성 (Completion)

| 단축키 | 동작 |
|--------|------|
| `Tab` | 자동 완성 (파일명, 명령어, 변수 등) |
| `Tab Tab` | 완성 후보 목록 표시 |
| `Alt+?` | 완성 후보 목록 표시 |
| `Alt+*` | 완성 후보 전체를 줄에 삽입 |

### 3.6. 화면·프로세스 제어

| 단축키 | 동작 |
|--------|------|
| `Ctrl+l` | 화면 지우기 (현재 줄은 유지) |
| `Ctrl+c` | 현재 실행 중인 명령 중단 (SIGINT) |
| `Ctrl+z` | 현재 프로세스 일시 중단 (SIGTSTP) |
| `Ctrl+d` | 빈 줄에서: EOF 전송 (로그아웃) |
| `Ctrl+s` | 화면 출력 일시 정지 (XOFF) |
| `Ctrl+q` | 화면 출력 재개 (XON) |

### 3.7. 에디터로 편집

| 단축키 | 동작 |
|--------|------|
| `Ctrl+x Ctrl+e` | 현재 줄을 `$EDITOR`(기본 vi)로 열어 편집. 저장 후 실행 |

---

## 4. Vi 모드

Vi 모드는 **Insert 모드**와 **Command 모드** 두 가지 상태를 오간다. 셸 시작 시 Insert 모드로 진입한다.

```
Insert 모드 → Esc → Command 모드
Command 모드 → i / a / I / A → Insert 모드
```

### 4.1. Insert 모드에서 Command 모드로

| 키 | 동작 |
|----|------|
| `Esc` | Command 모드 진입 |
| `Ctrl+[` | `Esc`와 동일 |

### 4.2. Command 모드 — 커서 이동

| 키 | 동작 |
|----|------|
| `h` | 한 글자 왼쪽 |
| `l` | 한 글자 오른쪽 |
| `w` | 다음 단어 시작으로 (구분자 기준) |
| `W` | 다음 단어 시작으로 (공백 기준) |
| `b` | 이전 단어 시작으로 (구분자 기준) |
| `B` | 이전 단어 시작으로 (공백 기준) |
| `e` | 현재(다음) 단어 끝으로 |
| `E` | 현재(다음) 단어 끝으로 (공백 기준) |
| `0` | 줄 처음으로 |
| `^` | 줄 처음 비공백 문자로 |
| `$` | 줄 끝으로 |
| `f<c>` | 현재 위치 오른쪽에서 문자 `c` 찾아 이동 |
| `F<c>` | 현재 위치 왼쪽에서 문자 `c` 찾아 이동 |
| `t<c>` | `f<c>`와 동일하나 한 글자 앞에서 멈춤 |
| `T<c>` | `F<c>`와 동일하나 한 글자 뒤에서 멈춤 |
| `;` | 마지막 `f/F/t/T` 동작 반복 (같은 방향) |
| `,` | 마지막 `f/F/t/T` 동작 반복 (반대 방향) |

### 4.3. Command 모드 — 편집

| 키 | 동작 |
|----|------|
| `x` | 커서 위치 글자 삭제 |
| `X` | 커서 앞 글자 삭제 |
| `d<motion>` | motion 범위 삭제. `dw`, `db`, `d$`, `d0` |
| `D` | 커서부터 줄 끝까지 삭제 |
| `dd` | 줄 전체 삭제 |
| `c<motion>` | motion 범위 삭제 후 Insert 모드 진입. `cw`, `cb`, `c$` |
| `C` | 커서부터 줄 끝 삭제 후 Insert 모드 |
| `cc` / `S` | 줄 전체 삭제 후 Insert 모드 |
| `r<c>` | 커서 위치 글자를 `c`로 교체 (Insert 유지) |
| `R` | 덮어쓰기 모드 진입 |
| `s` | 커서 위치 글자 삭제 후 Insert 모드 |
| `y<motion>` | motion 범위 복사 (yank). `yw`, `y$` |
| `yy` / `Y` | 줄 전체 복사 |
| `p` | 커서 뒤에 붙여넣기 |
| `P` | 커서 앞에 붙여넣기 |
| `~` | 커서 위치 글자 대소문자 토글 |
| `u` | 마지막 편집 되돌리기 (undo) |
| `.` | 마지막 텍스트 변경 반복 |

### 4.4. Command 모드 — Insert 모드 진입

| 키 | 진입 위치 |
|----|-----------|
| `i` | 커서 앞 |
| `a` | 커서 뒤 (append) |
| `I` | 줄 처음 비공백 문자 앞 |
| `A` | 줄 끝 |

### 4.5. Command 모드 — 히스토리

| 키 | 동작 |
|----|------|
| `k` / `↑` | 이전 명령 |
| `j` / `↓` | 다음 명령 |
| `G` | 가장 오래된 히스토리로 |
| `gg` | 가장 최신 히스토리로 (빈 줄) |

### 4.6. Command 모드 — 히스토리 검색

| 키 | 동작 |
|----|------|
| `/pattern` | 히스토리에서 역방향 검색 |
| `?pattern` | 히스토리에서 정방향 검색 |
| `n` | 같은 방향으로 다음 매칭 |
| `N` | 반대 방향으로 다음 매칭 |

### 4.7. Command 모드 — 기타

| 키 | 동작 |
|----|------|
| `v` | 현재 줄을 `$EDITOR`로 열어 편집 후 실행 |
| `#` | 현재 줄 앞에 `#` 추가해 주석으로 히스토리 저장 |
| `Ctrl+l` | 화면 지우기 (Command 모드에서도 동작) |

---

## 5. 모드 비교 요약

| 기능 | Emacs 모드 | Vi 모드 (Command) |
|------|-----------|------------------|
| 줄 처음 | `Ctrl+a` | `0` / `^` |
| 줄 끝 | `Ctrl+e` | `$` |
| 단어 앞으로 | `Alt+f` | `w` |
| 단어 뒤로 | `Alt+b` | `b` |
| 글자 삭제(앞) | `Backspace` | `X` |
| 글자 삭제(뒤) | `Ctrl+d` | `x` |
| 단어 삭제(앞) | `Alt+Backspace` | `db` |
| 단어 삭제(뒤) | `Alt+d` | `dw` |
| 줄 끝까지 삭제 | `Ctrl+k` | `D` |
| 줄 처음까지 삭제 | `Ctrl+u` | `d0` |
| 붙여넣기 | `Ctrl+y` | `p` |
| 되돌리기 | `Ctrl+_` | `u` |
| 히스토리 이전 | `Ctrl+p` | `k` |
| 히스토리 검색 | `Ctrl+r` | `/` |
| 에디터 열기 | `Ctrl+x Ctrl+e` | `v` |

---

## 6. 자주 쓰는 패턴

```bash
# [Emacs] 긴 명령 중간에 오타 수정
# 방법 1: Alt+b로 단어 이동 후 Alt+d로 삭제 후 재입력
# 방법 2: Ctrl+r로 히스토리 검색 후 Ctrl+e로 끝에서 편집

# [Emacs] 이전 명령 재사용 (일부만 변경)
Ctrl+p          # 이전 명령 불러오기
Ctrl+a          # 줄 처음으로
Alt+f Alt+f      # 두 단어 앞으로 이동
Alt+d          # 단어 삭제 후 새 값 입력

# [Emacs] 이전 명령의 마지막 인자 재사용
git log --oneline HEAD~10
git diff Alt+.   # Alt+. → HEAD~10이 삽입됨

# [Vi] 복잡한 명령 에디터에서 편집
# Esc → v → vim 열림 → :wq 저장 → 자동 실행

# [Vi] 특정 문자로 빠르게 이동해 수정
# 예: "java -jar app.jar --spring.port=8080"에서 포트 변경
# Esc → f= → l → cw → 9090

# [Emacs] Ctrl+r 히스토리 검색 워크플로우
Ctrl+r           # 검색 시작
java          # "java"가 포함된 가장 최근 명령으로 이동
Ctrl+r           # 다음 매칭 (더 이전 명령으로)
Ctrl+e           # 줄 끝으로 이동 (검색 종료)
Enter         # 실행

# .inputrc에서 특정 키 바인딩 추가 (예: Emacs 모드에서 Alt+. 동작)
# ~/.inputrc:
# "\e.": yank-last-arg
```

---

## Sources
- [readline](https://www.gnu.org/software/readline/manual/readline.html)
- [Readline-vi-Mode](https://www.gnu.org/software/bash/manual/html_node/Readline-vi-Mode.html)

---

## Related pages
- [[standard-streams]]
- [[grep]]
- [[sed]]
- [[awk]]
- [[directory-navigation]]
- [[environment-variables]]
