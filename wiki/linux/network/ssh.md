---
title: SSH / SCP
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - network
  - security
  - devops
---

## 1. 개념

SSH(Secure Shell)는 암호화된 채널을 통해 원격 호스트에 접속하고 명령을 실행하는 프로토콜이다. OpenSSH가 사실상 표준 구현체이며 리눅스에 기본 설치된다.

```bash
ssh [user@]hostname
ssh [user@]hostname:port          # URI 형식: ssh://user@host:port
ssh user@host 'command'           # 원격 명령 실행 후 종료
```

---

## 2. 인증 방식

| 방식      | 설명                                            |
| ------- | --------------------------------------------- |
| 공개키 인증  | 키 쌍 기반. 서버에 공개키를 등록해두고 클라이언트가 개인키로 인증. **권장** |
| 비밀번호 인증 | 패스워드 직접 입력. 자동화 불가, 브루트포스 위험                  |

### 2.1. 공개키 인증 설정 절차

```bash
# 1. 클라이언트에서 키 쌍 생성 (Ed25519 권장)
ssh-keygen -t ed25519 -C "comment"
# RSA를 써야 한다면: ssh-keygen -t rsa -b 4096

# 2. 생성된 파일
~/.ssh/id_ed25519       # 개인키 (절대 외부 공유 금지, 권한 600)
~/.ssh/id_ed25519.pub   # 공개키 (서버에 등록할 파일)

# 3. 서버의 authorized_keys에 공개키 등록
ssh-copy-id user@host                        # 자동 등록
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys  # 수동 등록
```

**키 알고리즘 선택**: Ed25519 > ECDSA > RSA(4096). 레거시 서버 호환이 필요한 경우에만 RSA를 사용한다.

---

## 3. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-i identity_file` | 사용할 개인키 파일 지정 (기본: `~/.ssh/id_*`) |
| `-p port` | 접속 포트 지정 (기본: 22) |
| `-l user` | 로그인 사용자 지정 (`user@host`와 동일) |
| `-v` / `-vv` / `-vvv` | 디버그 출력 (연결 문제 진단 시 사용) |
| `-N` | 원격 명령 실행 없이 포워딩만 수행 |
| `-f` | 백그라운드로 실행 (포워딩 터널 유지에 사용) |
| `-T` | pseudo-terminal 할당 안 함 |
| `-t` | pseudo-terminal 강제 할당 |
| `-J jump_host` | 점프 호스트(배스천 서버)를 경유해 접속 |
| `-o option=value` | `ssh_config` 옵션을 커맨드라인에서 직접 지정 |

---

## 4. ~/.ssh/config — 호스트 설정 파일

반복적인 옵션 입력을 줄이고 여러 서버를 별칭으로 관리한다.

```
# ~/.ssh/config

# 개발 서버
Host dev
    HostName 192.168.1.10
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
    Port 22

# 프로덕션 (배스천 경유)
Host prod
    HostName 10.0.0.5
    User ec2-user
    IdentityFile ~/.ssh/prod_key
    ProxyJump bastion

# 배스천 서버
Host bastion
    HostName bastion.example.com
    User admin
    IdentityFile ~/.ssh/bastion_key

# 모든 호스트 공통 설정
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes
```

설정 후 `ssh dev`, `ssh prod` 처럼 별칭으로 접속한다.

**주요 지시어**:

| 지시어 | 설명 |
|--------|------|
| `HostName` | 실제 호스트명 또는 IP |
| `User` | 로그인 사용자 |
| `IdentityFile` | 개인키 경로 |
| `Port` | 접속 포트 |
| `ProxyJump` | 점프 호스트 지정 |
| `ServerAliveInterval` | keepalive 패킷 전송 주기(초). 세션 끊김 방지 |
| `StrictHostKeyChecking` | `no`로 설정 시 known_hosts 확인 생략 (자동화 스크립트에서 사용, 보안 주의) |

---

## 5. 포트 포워딩

백엔드 개발에서 가장 자주 쓰이는 기능이다. SSH 채널을 통해 원격/로컬 포트를 안전하게 연결한다.

### 5.1. 로컬 포워딩 (-L) — 원격 서비스를 로컬에서 접근

로컬 포트로 들어오는 트래픽을 SSH 터널을 통해 원격 측 호스트:포트로 전달한다.

```
ssh -L [로컬포트]:[원격호스트]:[원격포트] [SSH서버]
```

```bash
# 원격 DB(3306)에 로컬 13306으로 접근
ssh -L 13306:localhost:3306 user@db-server
# → localhost:13306으로 MySQL 접속 가능

# 배스천을 경유해 내부 DB에 접근
ssh -L 15432:internal-db:5432 user@bastion
# → localhost:15432로 PostgreSQL 접속 가능

# 백그라운드 터널 유지 (-N: 명령 실행 안 함, -f: 백그라운드)
ssh -NfL 13306:localhost:3306 user@db-server
```

### 5.2. 리모트 포워딩 (-R) — 로컬 서비스를 원격에서 접근

원격 서버 포트로 들어오는 트래픽을 로컬 호스트:포트로 전달한다.

```
ssh -R [원격포트]:[로컬호스트]:[로컬포트] [SSH서버]
```

```bash
# 개발 중인 로컬 서버(8080)를 원격 서버의 8080으로 노출
ssh -R 8080:localhost:8080 user@remote-server
```

### 5.3. 점프 호스트 (-J)

배스천 서버를 경유해 내부망 서버에 접속한다.

```bash
ssh -J bastion.example.com user@internal-server

# 여러 홉
ssh -J bastion1,bastion2 user@target
```

---

## 6. scp — 파일 복사

SFTP 프로토콜 위에서 동작하며 SSH와 동일한 인증을 사용한다. OpenSSH 9.0부터 기본 전송 프로토콜이 SFTP로 변경되었다.

```bash
# 로컬 → 원격
scp file.txt user@host:/remote/path/
scp -r ./dir  user@host:/remote/path/    # 디렉터리 재귀 복사

# 원격 → 로컬
scp user@host:/remote/file.txt ./local/

# 포트 지정 (대문자 -P)
scp -P 2222 file.txt user@host:/path/

# 개인키 지정
scp -i ~/.ssh/prod_key file.txt user@host:/path/

# 점프 호스트 경유
scp -J bastion file.txt user@internal:/path/

# 전송 속도 제한 (단위: Kbit/s)
scp -l 1024 large_file.tar.gz user@host:/path/
```

---

## 7. 주요 파일

| 경로 | 설명 |
|------|------|
| `~/.ssh/` | SSH 관련 파일 디렉터리. 권한 `700` 필수 |
| `~/.ssh/config` | 클라이언트 설정 파일. 권한 `600` |
| `~/.ssh/id_ed25519` | 개인키. 권한 `600` 필수 (그 외이면 ssh가 무시) |
| `~/.ssh/id_ed25519.pub` | 공개키 |
| `~/.ssh/authorized_keys` | 접속을 허용할 공개키 목록. 권한 `600` |
| `~/.ssh/known_hosts` | 접속한 서버의 호스트 키 지문 목록 |

---

## 8. 자주 쓰는 패턴

```bash
# 접속 문제 디버깅
ssh -vvv user@host

# 호스트 키 지문 변경 시 (서버 재설치 등) known_hosts 항목 제거
ssh-keygen -R hostname

# 원격 명령 실행 결과를 로컬에서 처리
ssh user@host 'ps aux | grep java' | grep -v grep

# 여러 서버에 동일 명령 실행
for host in web1 web2 web3; do ssh $host 'sudo systemctl restart app'; done
```

---

## Sources
- [ssh(1)](https://man7.org/linux/man-pages/man1/ssh.1.html)
- [scp(1)](https://man7.org/linux/man-pages/man1/scp.1.html)

---

## Related pages
- [[linux-file-permissions]]
- [[linux-system-info]]
