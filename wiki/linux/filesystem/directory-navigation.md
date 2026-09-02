---
title: 디렉터리 탐색 — cd / pushd / popd / dirs
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - bash
---

## 1. 개념

`cd`, `pushd`, `popd`, `dirs`는 모두 bash 내장 명령어(builtin)다. 셸 프로세스의 현재 작업 디렉터리(CWD)를 변경하거나 디렉터리 스택을 관리한다.

---

## 2. cd — 디렉터리 변경

```bash
cd [DIR]
```

| 형태 | 동작 |
|------|------|
| `cd /path/to/dir` | 절대 경로로 이동 |
| `cd relative/path` | 상대 경로로 이동 |
| `cd` | `$HOME`으로 이동 |
| `cd ~` | `$HOME`으로 이동 |
| `cd ~user` | 지정 사용자의 홈 디렉터리로 이동 |
| `cd -` | 이전 디렉터리로 이동 (`$OLDPWD` 활용). 경로 출력 |
| `cd ..` | 부모 디렉터리로 이동 |

### 2.1. CDPATH

`$CDPATH` 환경변수에 경로를 등록하면 상대 경로 입력 시 해당 경로들을 탐색한다.

```bash
export CDPATH="$HOME/projects:/opt"
cd myapp    # $HOME/projects/myapp 또는 /opt/myapp 탐색
```

---

## 3. 디렉터리 스택

`pushd`/`popd`는 디렉터리 스택을 이용해 여러 위치를 저장·복원한다. 스택 맨 앞(인덱스 0)이 현재 디렉터리다.

```
스택 상태 예시:
~/app /var/log /tmp
  0      1      2
```

---

## 4. pushd — 디렉터리를 스택에 저장하고 이동

```bash
pushd [DIR | +N | -N] [-n]
```

| 형태 | 동작 |
|------|------|
| `pushd DIR` | 현재 디렉터리를 스택에 저장하고 DIR로 이동 |
| `pushd` (인자 없음) | 스택 상위 두 디렉터리 교환 (현재↔직전) |
| `pushd +N` | 왼쪽에서 N번째 항목을 맨 앞으로 회전, 해당 디렉터리로 이동 |
| `pushd -N` | 오른쪽에서 N번째 항목을 맨 앞으로 회전 |
| `pushd -n DIR` | 디렉터리 변경 없이 스택에만 추가 |

---

## 5. popd — 스택에서 꺼내 이동

```bash
popd [+N | -N] [-n]
```

| 형태 | 동작 |
|------|------|
| `popd` | 스택 맨 앞 항목 제거, 다음 항목으로 이동 |
| `popd +N` | 왼쪽에서 N번째 항목만 제거 (이동 안 함) |
| `popd -N` | 오른쪽에서 N번째 항목만 제거 |
| `popd -n` | 디렉터리 변경 없이 스택에서만 제거 |

---

## 6. dirs — 스택 목록 출력

```bash
dirs [-clpv] [+N | -N]
```

| 옵션 | 설명 |
|------|------|
| `-l` | `~` 축약 없이 전체 경로 출력 |
| `-p` | 한 줄에 하나씩 출력 |
| `-v` | 인덱스 번호와 함께 출력 |
| `-c` | 스택 전체 비우기 |
| `+N` | 왼쪽에서 N번째 항목만 출력 |
| `-N` | 오른쪽에서 N번째 항목만 출력 |

---

## 7. 자주 쓰는 패턴

```bash
# 1. 두 디렉터리 오가기
pushd /var/log         # /var/log로 이동, 스택: /var/log ~
pushd                  # 이전 디렉터리로 전환: ~ /var/log
pushd                  # 다시 전환: /var/log ~

# 2. 여러 위치 저장 후 순차 복귀
pushd ~/projects/app
pushd /etc/nginx
pushd /var/log
dirs -v
# 0  /var/log
# 1  /etc/nginx
# 2  ~/projects/app
# 3  ~
popd   # /etc/nginx로
popd   # ~/projects/app로
popd   # ~로

# 3. 스택을 유지하면서 특정 위치로 이동
pushd +1               # 1번 항목으로 이동 (스택 회전)

# 4. 임시 디렉터리 이동 후 복귀
pushd /tmp
# ... 작업 ...
popd                   # 원래 위치로 복귀

# 5. cd -를 이용한 빠른 토글
cd /var/log
cd /etc
cd -    # /var/log로 (경로 출력됨)
cd -    # /etc로

# 6. 스택 초기화
dirs -c

# 7. 서버 배포 스크립트에서 활용
deploy() {
    pushd /opt/app > /dev/null
    git pull && ./gradlew build
    popd > /dev/null
}
```

---

## Sources
- [bash#The-Directory-Stack](https://www.gnu.org/software/bash/manual/bash.html#The-Directory-Stack)

---

## Related pages
- [[linux-system-info]]
- [[find]]
- [[ls]]
