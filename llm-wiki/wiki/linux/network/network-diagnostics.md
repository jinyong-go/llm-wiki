---
title: 네트워크 진단 — ss / ping / nc
updated: 2026-07-14 16:45:56
tags:
  - linux
  - cli
  - network
  - devops
---

## 1. 개념

| 명령어 | 패키지 | 역할 |
|--------|--------|------|
| `ss` | iproute2 | 소켓 상태 조회 (`netstat` 대체) |
| `ping` | iputils | ICMP로 호스트 도달 가능성 및 RTT 측정 |
| `nc` (ncat) | nmap | TCP/UDP 연결 테스트, 간이 서버/클라이언트 |

---

## 2. ss — 소켓 상태 조회

`netstat`의 현대적 대체. `/proc`를 직접 읽어 더 빠르고 상세한 정보를 제공한다.

```bash
ss [options] [FILTER]
```

### 2.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-t` | TCP 소켓 |
| `-u` | UDP 소켓 |
| `-l` | 리스닝 소켓만 (기본값은 연결된 소켓만) |
| `-a` | 리스닝 + 연결된 소켓 모두 |
| `-n` | 포트/주소를 숫자로 표시 (DNS 역조회 생략, 빠름) |
| `-p` | 소켓을 사용 중인 프로세스(PID, 이름) 표시 |
| `-s` | 소켓 유형별 요약 통계 |
| `-i` | TCP 내부 정보 (RTT, cwnd 등) |
| `-e` | 소켓 상세 정보 (uid, inode) |

> `-p`로 **자신이 소유하지 않은 소켓**의 프로세스(PID/이름)를 표시하려면 **root 권한이 필요**하다 — 권한이 없으면 소켓 목록은 보이되 프로세스 칸이 비어 있다(netstat은 `-` 표시). 소켓-PID 매핑이 각 프로세스의 `/proc/PID/fd/`를 대조하는 방식인데 이 디렉터리가 소유자·root 전용이기 때문이다. 프로세스 가시성 상세는 [[ps]] §5 참고.[^1]

[^1]: root 요구는 netstat(8)의 명시("You will also need superuser privileges to see this information on sockets you don't own")이며, ss에 대한 적용은 동일한 /proc/PID/fd 대조 방식에 근거한 추론.

### 2.2. 자주 쓰는 패턴

```bash
# 리스닝 중인 TCP 포트 전체 확인 (프로세스 포함)
ss -tlnp

# 리스닝 중인 TCP/UDP 포트 모두 확인
ss -alnp

# 현재 ESTABLISHED TCP 연결 확인
ss -tnp state established

# 특정 포트로 들어오는 연결 확인 (예: 8080)
ss -tnp 'dport = :8080 or sport = :8080'

# 특정 포트를 사용 중인 프로세스 확인
ss -tlnp | grep :6379

# 소켓 요약 통계 (전체 TCP/UDP 연결 수 파악)
ss -s

# TIME_WAIT 상태 TCP 소켓 수 확인 (연결 과부하 진단)
ss -t state time-wait | wc -l
```

### 2.3. ss 출력 컬럼

```
Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
tcp    LISTEN  0       128     0.0.0.0:8080          0.0.0.0:*          users:(("java",pid=1234,...))
```

| 컬럼 | 설명 |
|------|------|
| `State` | 소켓 상태 (`LISTEN`, `ESTAB`, `TIME-WAIT`, `CLOSE-WAIT` 등) |
| `Recv-Q` | 수신 버퍼에서 대기 중인 바이트 수. LISTEN 상태에서는 backlog 대기 연결 수 |
| `Send-Q` | 송신 버퍼에서 아직 전송되지 않은 바이트 수. LISTEN 상태에서는 최대 backlog 크기 |
| `Local Address:Port` | 로컬 주소:포트. `0.0.0.0`은 모든 인터페이스 |
| `Peer Address:Port` | 연결 상대방 주소:포트. `*`는 미연결(LISTEN) 상태 |

> `Recv-Q`가 지속적으로 높으면 애플리케이션이 데이터를 제때 처리하지 못하고 있음을 의미한다.

---

## 3. ping — 호스트 연결 확인

ICMP ECHO_REQUEST를 전송해 호스트 도달 가능성과 왕복 지연시간(RTT)을 측정한다.

```bash
ping [options] destination
```

### 3.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-c count` | 지정한 횟수만 전송 후 종료 |
| `-i interval` | 패킷 전송 간격(초, 기본 1초) |
| `-w deadline` | 전체 실행 제한 시간(초). count에 관계없이 이 시간이 지나면 종료 |
| `-W timeout` | 응답 대기 시간(초, 기본 1초) |
| `-q` | 요약만 출력 (스크립트/모니터링에 유용) |
| `-n` | 역방향 DNS 조회 생략 |
| `-4` / `-6` | IPv4 / IPv6 강제 사용 |

### 3.2. 자주 쓰는 패턴

```bash
# 3번만 ping
ping -c 3 host

# 요약만 출력 (스크립트에서 생존 여부 확인)
ping -c 5 -q host

# 5초 안에 응답 없으면 종료
ping -w 5 -c 1 host

# 스크립트에서 호스트 생존 여부 확인 (종료 코드 활용)
if ping -c 1 -w 2 -q host &>/dev/null; then
    echo "alive"
fi
```

### 3.3. 출력 해석

```
PING db-server (10.0.0.5): 56 data bytes
64 bytes from 10.0.0.5: icmp_seq=1 ttl=64 time=0.452 ms

--- db-server ping statistics ---
5 packets transmitted, 5 received, 0% packet loss
rtt min/avg/max/mdev = 0.421/0.489/0.581/0.058 ms
```

| 항목 | 설명 |
|------|------|
| `time` | 왕복 지연시간(RTT). ms 단위 |
| `ttl` | Time To Live. 경유한 라우터 수 추정 가능 (초기값 64 또는 128에서 감소) |
| `packet loss` | 패킷 손실률. 0% 이상이면 네트워크 문제 의심 |
| `mdev` | RTT 표준편차. 높을수록 지연 편차가 큼 |

**종료 코드**: `0` = 정상 응답, `1` = 응답 없음, `2` = 기타 오류

---

## 4. nc (ncat) — 포트 연결 테스트 및 간이 소켓 도구

TCP/UDP 소켓을 직접 열고 닫을 수 있는 범용 네트워크 도구다. Nmap 프로젝트의 ncat이 현재 표준 구현체다.

```bash
ncat [options] [hostname] [port]   # ncat
nc   [options] [hostname] [port]   # nc (동일 도구 또는 호환 구현체)
```

두 가지 모드로 동작한다.
- **connect mode** (기본): 클라이언트로서 원격 호스트에 연결
- **listen mode** (`-l`): 서버로서 연결을 대기

### 4.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-l` | 리슨(서버) 모드 |
| `-z` | Zero-I/O 모드. 연결 성공 여부만 확인하고 데이터 전송 안 함 |
| `-v` | 상세 출력 (연결 성공/실패 메시지) |
| `-w timeout` | 연결 타임아웃(초) |
| `-u` | UDP 사용 (기본 TCP) |
| `-k` | 리슨 모드에서 연결 종료 후에도 계속 대기 |
| `-n` | DNS 조회 생략 |

### 4.2. 자주 쓰는 패턴

```bash
# 포트 열려있는지 확인 (가장 자주 쓰는 용도)
nc -zv host 6379           # Redis 포트 확인
nc -zv host 5432           # PostgreSQL 포트 확인
nc -zvw 3 host 8080        # 3초 타임아웃으로 확인

# 여러 포트 범위 스캔
nc -zv host 8080-8090

# HTTP 요청 직접 전송 (서버 응답 헤더 확인)
printf 'GET / HTTP/1.0\r\nHost: host\r\n\r\n' | nc host 80

# 간이 TCP 서버 (서버 소켓 테스트용)
nc -l 9999                 # 9999 포트에서 대기, 수신 내용 출력
nc -lk 9999                # 연결이 끊겨도 계속 대기 (-k)

# 파일 전송 (서버 → 클라이언트)
# 수신 측:
nc -l 9999 > received_file
# 송신 측:
nc host 9999 < send_file
```

> `-zv` 조합은 방화벽 규칙 확인, 서비스 포트 오픈 여부 확인에 가장 자주 쓰인다.

---

## 5. 백엔드 개발 진단 시나리오

```bash
# 1. 애플리케이션이 포트를 제대로 바인딩했는지 확인
ss -tlnp | grep :8080

# 2. DB 서버 포트 접근 가능한지 확인
nc -zvw 3 db-server 5432

# 3. DB 서버까지 네트워크 도달 여부 확인
ping -c 3 db-server

# 4. 현재 DB 연결 풀 상태 확인 (ESTABLISHED 연결 수)
ss -tnp state established dst db-server

# 5. CLOSE_WAIT 연결 누수 확인 (커넥션 풀 미반환 등)
ss -tnp state close-wait

# 6. 특정 서버로의 모든 연결 상태 한눈에 보기
ss -tnp dst 10.0.0.5
```

---

## Sources
- [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html)
- [ping(8)](https://man7.org/linux/man-pages/man8/ping.8.html)
- [ncat(1)](https://man7.org/linux/man-pages/man1/ncat.1.html)
- [netstat(8)](https://man7.org/linux/man-pages/man8/netstat.8.html)
- [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)

---

## Related pages
- [[ps]]
- [[ssh]]
- [[system-monitoring]]
- [[linux-system-info]]
