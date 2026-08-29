---
title: ps — 프로세스 목록 조회
updated: 2026-07-14 16:45:56
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

`/proc` 가상 파일시스템을 읽어 실행 중인 프로세스 정보를 출력한다. 특별한 권한 없이 실행 가능. 출력은 실행 시점의 **스냅샷**이며, 반복 갱신 모니터링은 top을 사용한다 ([[system-monitoring]]).

```bash
ps [option...]
```

---

## 2. 옵션

### 2.1. 옵션 스타일

| 스타일 | 형식 | 예시 |
|--------|------|------|
| UNIX | `-` 단일 대시 | `ps -ef` |
| BSD | 대시 없음 | `ps aux` |
| GNU | `--` 이중 대시 | `ps --forest` |

세 스타일은 혼용 가능하나 옵션 의미가 달라지는 경우가 있다 (예: `-u`와 `u`는 다름).

### 2.2. 프로세스 선택

| 옵션 | 설명 |
|------|------|
| `-e` / `-A` | 모든 프로세스 |
| `a` | 터미널 소유 제한 해제 (다른 사용자 포함) |
| `x` | 터미널 없는 프로세스 포함 |
| `-u user` | 유효 사용자(EUID)로 필터 |
| `-U user` | 실제 사용자(RUID)로 필터 |
| `-p pidlist` | PID 지정. 여러 개는 쉼표 구분 |
| `-C cmdlist` | 실행 파일명으로 필터 |
| `--ppid pidlist` | 부모 PID로 필터 |
| `-t ttylist` | 터미널로 필터 |
| `r` | 실행 중(R 상태) 프로세스만 |

### 2.3. 출력 형식

| 옵션 | 설명 |
|------|------|
| `-f` | 전체 형식 (UID, PID, PPID, C, STIME, TTY, TIME, CMD) |
| `-F` | 확장 전체 형식 (`-f` + SZ, RSS, PSR, STIME) |
| `-l` | 상세 형식 (F, S, UID, PID, PPID, C, PRI, NI, ADDR, SZ, WCHAN, TTY, TIME, CMD) |
| `u` | BSD 사용자 중심 형식 (%CPU, %MEM, VSZ, RSS 포함) |
| `-o format` | 사용자 정의 컬럼 |
| `-H` / `f` | 트리 형식 (ASCII 계층 구조) |
| `--forest` | GNU 트리 형식 |
| `-L` | 스레드 표시 (LWP, NLWP 컬럼 추가) |
| `-T` | 스레드 표시 (SPID 컬럼 추가) |
| `h` / `--no-headers` | 헤더 줄 생략 |
| `--sort spec` / `-k spec` | 정렬. `[+\|-]key` 형식. `+`=오름차순, `-`=내림차순 |

---

## 3. 출력

### 3.1. 주요 출력 컬럼

| 컬럼                | 설명                                |
| ----------------- | --------------------------------- |
| `PID`             | 프로세스 ID                           |
| `PPID`            | 부모 프로세스 ID                        |
| `USER`            | 유효 사용자명                           |
| `%CPU`            | 프로세스 시작 이후 누적 CPU 사용률 (스냅샷 아님)    |
| `%MEM`            | 물리 메모리(RSS) / 전체 메모리 비율           |
| `VSZ`             | 가상 메모리 크기 (KiB). 매핑된 모든 메모리 포함    |
| `RSS`             | 실제 상주 메모리 (KiB). 스왑 제외, 공유 메모리 포함 |
| `TTY`             | 연결된 터미널. `?` = 터미널 없음             |
| `STAT`            | 프로세스 상태 코드                        |
| `START`           | 프로세스 시작 시각                        |
| `TIME`            | 누적 CPU 시간                         |
| `COMMAND` / `CMD` | 실행 명령어. `[]` = 커널 스레드             |
| `NI`              | Nice 값 (-20 ~ 19. 낮을수록 높은 우선순위)   |
| `PRI`             | 실제 스케줄러 우선순위                      |
| `WCHAN`           | 프로세스가 대기 중인 커널 함수명                |

> **VSZ vs RSS**: VSZ는 매핑만 된 메모리(실제 미사용 포함), RSS는 실제 물리 메모리에 올라온 크기. 메모리 누수 확인은 RSS를 기준으로 한다.

### 3.2. 프로세스 상태 코드 (STAT)

| 코드 | 의미 |
|------|------|
| `R` | 실행 중 또는 실행 대기 |
| `S` | 인터럽트 가능한 슬립 (이벤트 대기) |
| `D` | 인터럽트 불가 슬립 (주로 I/O 대기). `kill`로 종료 불가 |
| `Z` | 좀비. 종료됐지만 부모가 회수하지 않은 상태 |
| `T` | 잡 컨트롤 시그널로 중단 |
| `I` | 유휴 커널 스레드 |

**수식 코드** (두 번째 문자):

| 코드 | 의미 |
|------|------|
| `<` | 높은 우선순위 |
| `N` | 낮은 우선순위 (nice) |
| `s` | 세션 리더 |
| `l` | 멀티스레드 |
| `+` | 포그라운드 프로세스 그룹 |

예: `Ss` = 슬립 중인 세션 리더, `Sl` = 슬립 중인 멀티스레드 프로세스

### 3.3. 사용자 정의 출력 (`-o`)

```bash
ps -o pid,ppid,user,stat,cmd
ps -o pid=,comm=          # 헤더 없이 출력 (모든 헤더가 빈 문자열이면)
ps -o pid,ruser=RealUser -o comm=Command  # 헤더 이름 변경
ps -o pid,wchan:20,comm   # 컬럼 너비 지정 (wchan을 20자로)
```

유용한 `-o` 키: `pid`, `ppid`, `user`, `ruser`, `%cpu`, `%mem`, `vsz`, `rss`, `stat`, `start_time`, `etime`, `cmd`, `comm`, `args`, `nlwp`, `lwp`, `ni`, `pri`

---

## 4. 자주 쓰는 패턴

```bash
# 모든 프로세스 조회
ps -ef                          # UNIX 스타일
ps aux                          # BSD 스타일 (%CPU/%MEM/VSZ/RSS/STAT 포함)

# 특정 사용자 프로세스
ps -u appuser -f

# 특정 프로세스 찾기
ps -C java -f                   # 실행 파일명으로
ps -p 1234 -f                   # PID로
ps aux | grep "[j]ava"          # grep 패턴 (자기 자신 제외)

# 프로세스 트리
ps -ejH                         # UNIX 스타일
ps axf                          # BSD 스타일
ps -e --forest -o pid,comm      # 커스텀 컬럼 + 트리

# 스레드 조회 (Java/멀티스레드 앱)
ps -eLf -p 1234                 # 특정 PID의 스레드 목록
ps -L -p 1234 -o lwp,stat,wchan,comm  # 스레드별 상태 및 대기 함수

# 메모리 기준 정렬 (메모리 누수 의심 시)
ps aux --sort=-%mem | head -20
ps aux --sort=-rss | head -20

# CPU 기준 정렬
ps aux --sort=-%cpu | head -10

# 좀비 프로세스 확인
ps aux | awk '$8 == "Z" {print}'
ps -eo pid,ppid,stat,comm | grep "^.*Z"

# 특정 포트 서비스 확인 (lsof와 조합)
ps -p $(lsof -t -i:8080) -f

# 커스텀 형식으로 모니터링
ps -eo pid,ppid,user,%cpu,%mem,vsz:10,rss:10,stat,start_time,comm \
   --sort=-%cpu | head -20

# Java 애플리케이션 스레드 수 확인
ps -eo pid,nlwp,comm | grep java | sort -k2 -rn
```

---

## 5. 기타

- **권한과 가시성** — `/proc`의 기본 마운트(`hidepid=0`)에서는 모든 사용자가 모든 `/proc/PID` 디렉터리에 접근할 수 있어, **타 사용자의 프로세스도 일반 계정으로 조회 가능**하다. 다음의 예외가 있다:
    - `hidepid=1` 마운트 시 자신의 프로세스만 접근 가능(타 사용자의 cmdline·status 보호), `hidepid=2`는 디렉터리 존재 자체를 숨겨 PID 탐지도 차단
    - 프로세스 목록은 보여도 `/proc/PID/environ`(환경변수)·`/proc/PID/fd/`(열린 파일 디스크립터) 등 민감 파일은 소유자·root 전용
    - 소켓-PID 매핑은 `/proc/PID/fd/` 대조로 이뤄지므로, `ss -p`/`netstat -p`가 타 사용자 소켓의 프로세스를 표시하려면 root가 필요하다 ([[network-diagnostics]] §2.1)
- **다른 도구와의 조합** — 세션 종료 후에도 유지되는 프로세스 실행은 [[nohup]], 출력의 텍스트 가공·집계는 [[awk]], 포트 점유 확인은 [[lsof]].

```bash
# Java 힙/GC 문제 진단 (스레드 상태 분포)
ps -L -p $(pgrep -f "app.jar") -o lwp,stat,wchan,comm \
  | awk 'NR>1 {count[$2]++} END {for(s in count) print s, count[s]}'

# 좀비 프로세스 부모 찾기 (회수 안 된 자식)
ps -eo pid,ppid,stat,comm | awk '$3~/Z/ {print "zombie:", $1, "parent:", $2}'
```

---

## Sources
- [ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html)
- [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

---

## Related pages
- [[nohup]]
- [[system-monitoring]]
- [[lsof]]
- [[awk]]
- [[standard-streams]]
