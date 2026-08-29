---
title: lsof — 열린 파일 목록 조회
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - network
  - devops
---

## 1. 개념

"List Open Files". 현재 실행 중인 프로세스가 열고 있는 파일, 소켓, 파이프 등을 조회한다. 리눅스에서 네트워크 소켓, 디바이스, 파이프도 모두 파일로 취급되므로 포트 점유 확인, 커넥션 누수 탐지, 디스크 공간 누수 진단 등에 폭넓게 사용된다.

```bash
lsof [options] [file/dir]
```

> 다른 프로세스의 파일 목록 조회는 root 권한이 필요하다.

---

## 2. 출력 컬럼

```
COMMAND   PID   USER   FD   TYPE   DEVICE   SIZE/OFF   NODE   NAME
java     1234  app    23u  IPv4   0x1234    0t0        TCP    *:8080 (LISTEN)
```

| 컬럼 | 설명 |
|------|------|
| `COMMAND` | 프로세스 명령어 이름 (최대 9자) |
| `PID` | 프로세스 ID |
| `USER` | 프로세스 소유자 |
| `FD` | 파일 디스크립터 번호 또는 특수 식별자 |
| `TYPE` | 파일 유형 |
| `DEVICE` | 장치 번호 |
| `SIZE/OFF` | 파일 크기 또는 오프셋 |
| `NODE` | inode 번호 (네트워크 소켓은 프로토콜 표시) |
| `NAME` | 파일 경로 또는 네트워크 주소:포트 |

### 2.1. FD 필드

숫자(0, 1, 2, 3...) 외에 특수 식별자가 있다.

| FD 값 | 설명 |
|-------|------|
| `cwd` | 현재 작업 디렉터리 |
| `txt` | 실행 코드/데이터 (프로그램 바이너리) |
| `mem` | 메모리 맵 파일 (공유 라이브러리 등) |
| `0` | stdin |
| `1` | stdout |
| `2` | stderr |
| `숫자` | 일반 파일 디스크립터 |

숫자 뒤에 붙는 접근 모드:

| 문자 | 의미 |
|------|------|
| `r` | 읽기 |
| `w` | 쓰기 |
| `u` | 읽기 + 쓰기 |

### 2.2. TYPE 필드

| TYPE | 설명 |
|------|------|
| `REG` | 일반 파일 |
| `DIR` | 디렉터리 |
| `IPv4` | IPv4 소켓 |
| `IPv6` | IPv6 소켓 |
| `unix` | UNIX 도메인 소켓 |
| `FIFO` | 파이프 |
| `CHR` | 문자 디바이스 |

---

## 3. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-i [조건]` | 네트워크 소켓 필터. 조건 생략 시 전체 |
| `-p PID` | 특정 PID 프로세스만 |
| `-u user` | 특정 사용자만 |
| `-c name` | 특정 명령어 이름으로 필터 |
| `-d FD` | 특정 FD만 (`cwd`, `1,2,3`, `^2`) |
| `-n` | 호스트명 DNS 역조회 생략 (속도 향상) |
| `-P` | 포트 번호를 서비스명으로 변환 안 함 |
| `-t` | PID만 출력 (스크립트 연계용) |
| `-a` | 여러 옵션을 OR 대신 AND로 결합 |
| `+d DIR` | 지정 디렉터리(최상위만) 내 열린 파일 |
| `+D DIR` | 지정 디렉터리(하위 포함) 내 열린 파일 |
| `-r [초]` | 반복 모드. 지정 초마다 갱신 (기본 15초) |

---

## 4. -i 옵션 — 네트워크 소켓 필터

```
-i [46][protocol][@host][:port]
```

```bash
lsof -i              # 모든 네트워크 소켓
lsof -i :8080        # 포트 8080
lsof -i TCP:8080     # TCP 포트 8080만
lsof -i UDP:53       # UDP 포트 53 (DNS)
lsof -i 4            # IPv4만
lsof -i 6            # IPv6만
lsof -i @10.0.0.5    # 특정 IP와의 연결
lsof -i TCP:1-1024   # TCP 포트 범위
```

TCP 상태 필터 (`-s` 옵션 조합):

```bash
lsof -i -sTCP:LISTEN       # 리스닝 소켓만
lsof -i -sTCP:ESTABLISHED  # ESTABLISHED 연결만
lsof -i -sTCP:CLOSE_WAIT   # CLOSE_WAIT 상태
```

---

## 5. 백엔드 진단 시나리오

```bash
# 1. 포트를 점유한 프로세스 확인
lsof -i :8080
lsof -i TCP:8080 -n -P      # DNS/포트명 변환 생략으로 빠르게

# 2. 특정 프로세스의 네트워크 연결 확인
lsof -p 1234 -i             # PID 1234의 소켓만
lsof -a -p 1234 -i -sTCP:ESTABLISHED  # ESTABLISHED만

# 3. 애플리케이션의 열린 파일/소켓 전체 조회
lsof -c java -n -P          # java 프로세스 전체
lsof -a -c java -d ^mem,^txt  # 라이브러리/바이너리 제외

# 4. 삭제됐지만 아직 열려 있는 파일 (디스크 공간 누수 진단)
lsof | grep deleted
# → 프로세스가 파일을 열고 있으면 rm 해도 디스크가 해제되지 않는다.
#   해당 프로세스를 재시작해야 실제 공간이 확보된다.

# 5. CLOSE_WAIT 연결 누수 확인 (커넥션 풀 미반환 등)
lsof -i -sTCP:CLOSE_WAIT -n -P

# 6. 특정 파일을 사용 중인 프로세스 확인 (마운트 해제 불가 시)
lsof /var/log/app.log
lsof +D /data/mount           # 디렉터리 전체

# 7. 스크립트에서 파일 사용 프로세스 종료
lsof -t /path/to/file | xargs kill -HUP

# 8. 포트 리스닝 상태 전체 요약 (ss 대안)
lsof -i -sTCP:LISTEN -n -P
```

---

## Sources
- [lsof(8)](https://man7.org/linux/man-pages/man8/lsof.8.html)

---

## Related pages
- [[network-diagnostics]]
- [[system-monitoring]]
