---
title: 계정 및 그룹 관리
updated: 2026-07-14 16:00:22
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

| 명령어 | 역할 |
|--------|------|
| `useradd` / `usermod` / `userdel` | 사용자 계정 생성·수정·삭제 |
| `groupadd` / `groupmod` / `groupdel` | 그룹 생성·수정·삭제 |
| `passwd` / `chage` | 패스워드 관리 및 만료 정책 |
| `id` / `whoami` / `groups` | 현재 사용자·그룹 조회 |
| `who` / `w` / `last` | 로그인 세션 조회 |

---

## 2. 중요 파일 구조

### 2.1. /etc/passwd — 사용자 계정 데이터베이스

```
username:password:UID:GID:comment:home_dir:shell
```

| 필드 | 설명 |
|------|------|
| username | 로그인 이름 |
| password | 패스워드 해시. 현재는 `x`(shadow 파일 사용) 또는 `!`(잠김) |
| UID | 사용자 ID. 일반 사용자는 1000+ (배포판마다 다름) |
| GID | 기본(primary) 그룹 ID |
| comment | 전체 이름 등 설명. GECOS 필드 |
| home_dir | 홈 디렉터리 경로 |
| shell | 로그인 셸. `/bin/false` 또는 `/usr/sbin/nologin` = 로그인 불가 |

**UID 범위 관례 (Debian/Ubuntu 기준):**

| 범위 | 용도 |
|------|------|
| 0 | root |
| 1 ~ 999 | 시스템 계정 (데몬, 서비스) |
| 1000+ | 일반 사용자 |

### 2.2. /etc/shadow — 패스워드 해시 및 만료 정보

```
username:hash:lastchg:min:max:warn:inactive:expire:reserved
```

| 필드 | 설명 |
|------|------|
| username | 로그인 이름 |
| hash | 패스워드 해시. `!` 또는 `!!` = 잠김, 빈 문자열 = 패스워드 없음 |
| lastchg | 마지막 패스워드 변경일 (1970-01-01 기준 일수) |
| min | 패스워드 변경 최소 간격 (일). `0` = 제한 없음 |
| max | 패스워드 유효 기간 (일). `99999` = 무제한 |
| warn | 만료 전 경고 기간 (일) |
| inactive | 만료 후 잠금까지 유예 기간 (일) |
| expire | 계정 만료일 (1970-01-01 기준 일수). 빈 값 = 무제한 |
| reserved | 예약 |

패스워드 해시 형식: `$알고리즘$솔트$해시`
- `$1$` = MD5 (취약, 사용 금지)
- `$5$` = SHA-256
- `$6$` = SHA-512 (현재 기본값)
- `$y$` = yescrypt (최신)

### 2.3. /etc/group — 그룹 데이터베이스

```
groupname:password:GID:member_list
```

| 필드 | 설명 |
|------|------|
| groupname | 그룹 이름 |
| password | 그룹 패스워드. 대부분 `x` (gshadow 사용) 또는 빈 값 |
| GID | 그룹 ID |
| member_list | 보조 그룹 멤버 목록 (쉼표 구분). 기본 그룹 멤버는 표시 안 됨 |

---

## 3. 사용자 조회

```bash
# 현재 사용자 정보
whoami                    # 유효 사용자명만
id                        # uid, gid, groups 전부 출력
id username               # 특정 사용자 조회

id -u                     # 유효 UID만
id -g                     # 유효 GID만
id -G                     # 모든 그룹 GID
id -un                    # 유효 사용자명 (숫자 → 이름)
id -Gn                    # 모든 그룹 이름

# 그룹 멤버십 확인
groups                    # 현재 사용자의 그룹 목록
groups username           # 특정 사용자의 그룹 목록

# 로그인 세션
who                       # 현재 로그인된 사용자 목록
w                         # 로그인 세션 + 현재 실행 중인 명령 포함
last                      # 최근 로그인 이력 (wtmp 기반)
last username             # 특정 사용자 로그인 이력
lastb                     # 실패한 로그인 시도 (btmp 기반, root 필요)
```

---

## 4. 사용자 관리

### 4.1. useradd — 사용자 생성

```bash
useradd [options] LOGIN
```

| 옵션 | 설명 |
|------|------|
| `-m` / `--create-home` | 홈 디렉터리 생성. 기본값은 배포판마다 다름 |
| `-M` | 홈 디렉터리 생성 안 함 |
| `-d DIR` | 홈 디렉터리 경로 명시 |
| `-s SHELL` | 로그인 셸 지정 |
| `-c COMMENT` | GECOS 필드 (전체 이름 등) |
| `-g GROUP` | 기본(primary) 그룹 지정 |
| `-G GROUPS` | 보조 그룹 목록 (쉼표 구분) |
| `-u UID` | UID 직접 지정 |
| `-r` / `--system` | 시스템 계정 생성 (UID < 1000, 홈 없음) |
| `-e DATE` | 계정 만료일 (YYYY-MM-DD) |
| `-f DAYS` | 패스워드 만료 후 계정 잠금까지 유예일. `-1` = 비활성화 |
| `-k DIR` | 스켈레톤 디렉터리 (홈에 복사할 초기 파일) |
| `-l` / `--no-log-init` | lastlog/faillog 초기화 생략 |

```bash
# 일반 사용자 생성
useradd -m -s /bin/bash -c "Jane Doe" jane
passwd jane

# 여러 보조 그룹 포함
useradd -m -s /bin/bash -G docker,sudo jane

# 서비스 계정 (로그인 불가, 홈 디렉터리 지정)
useradd -r -s /usr/sbin/nologin -d /opt/myapp -m myapp

# 계정 만료일 지정 (임시 계정)
useradd -m -e 2026-12-31 contractor

# 기본값 확인
useradd -D
cat /etc/default/useradd
```

> Debian/Ubuntu의 `adduser`는 `useradd`의 고수준 래퍼로 대화형으로 동작하며 홈 디렉터리를 자동 생성한다. 스크립트에서는 `useradd`를 직접 사용한다.

### 4.2. usermod — 사용자 수정

```bash
usermod [options] LOGIN
```

| 옵션 | 설명 |
|------|------|
| `-aG GROUPS` | 보조 그룹에 **추가** (`-a` 없으면 기존 그룹 전체 교체됨) |
| `-G GROUPS` | 보조 그룹 목록으로 **교체** |
| `-g GROUP` | 기본 그룹 변경 |
| `-d DIR` | 홈 디렉터리 경로 변경 |
| `-m` | `-d`와 함께 사용. 홈 디렉터리 내용을 새 경로로 이동 |
| `-l NEW_LOGIN` | 사용자명 변경 |
| `-s SHELL` | 셸 변경 |
| `-u UID` | UID 변경 |
| `-c COMMENT` | GECOS 필드 변경 |
| `-L` / `--lock` | 패스워드 앞에 `!` 추가 → 로그인 차단 |
| `-U` / `--unlock` | `!` 제거 → 로그인 복원 |
| `-e DATE` | 계정 만료일 변경 (빈 문자열 = 무제한) |

```bash
# 보조 그룹에 추가 (-a 필수!)
usermod -aG docker jane
usermod -aG sudo,docker jane

# 셸 변경
usermod -s /bin/zsh jane

# 홈 디렉터리 이동
usermod -d /home/newname -m jane

# 사용자명 변경 (홈 디렉터리 이름은 별도 변경 필요)
usermod -l newname jane

# 계정 잠금 / 해제
usermod -L jane
usermod -U jane

# 계정 만료일 제거 (영구 계정으로 복원)
usermod -e "" jane
```

> `-G` 단독 사용 시 기존 보조 그룹이 모두 교체된다. **그룹 추가는 반드시 `-aG`를 사용한다.**

### 4.3. userdel — 사용자 삭제

```bash
userdel [options] LOGIN
```

| 옵션 | 설명 |
|------|------|
| `-r` / `--remove` | 홈 디렉터리 및 메일 스풀 삭제 |
| `-f` / `--force` | 로그인 중이거나 프로세스 실행 중이어도 강제 삭제 |

```bash
# 계정 삭제 (홈 디렉터리 유지)
userdel jane

# 계정 + 홈 디렉터리 삭제
userdel -r jane

# 해당 사용자 소유 파일 확인 (삭제 전 권장)
find / -user jane 2>/dev/null
find / -uid 1001 2>/dev/null   # UID로 검색 (삭제 후에도 유효)
```

> 홈 외부에 있는 파일(다른 파티션 등)은 `-r`로 삭제되지 않으므로 수동 확인이 필요하다.

---

## 5. 그룹 관리

### 5.1. groupadd — 그룹 생성

```bash
groupadd [options] GROUPNAME
```

| 옵션 | 설명 |
|------|------|
| `-g GID` | GID 직접 지정 |
| `-r` / `--system` | 시스템 그룹 생성 (GID < 1000) |
| `-f` / `--force` | 이미 존재하면 오류 없이 성공 처리 |

```bash
groupadd developers
groupadd -g 2000 appgroup
groupadd -r sysgroup          # 시스템 그룹
```

### 5.2. groupmod — 그룹 수정

```bash
groupmod [options] GROUPNAME
```

| 옵션 | 설명 |
|------|------|
| `-n NEW_NAME` | 그룹명 변경 |
| `-g NEW_GID` | GID 변경 |

```bash
groupmod -n newname developers
groupmod -g 2001 appgroup
```

### 5.3. groupdel — 그룹 삭제

```bash
groupdel GROUPNAME
```

어떤 사용자의 기본 그룹인 경우 삭제 불가. 먼저 해당 사용자의 기본 그룹을 변경해야 한다.

### 5.4. gpasswd — 그룹 멤버십 관리

```bash
gpasswd [options] GROUPNAME
```

| 옵션 | 설명 |
|------|------|
| `-a USER` | 그룹에 사용자 추가 |
| `-d USER` | 그룹에서 사용자 제거 |
| `-M USER1,USER2` | 그룹 멤버 목록으로 교체 |
| `-A USER1,USER2` | 그룹 관리자 지정 |

```bash
gpasswd -a jane developers
gpasswd -d jane developers
gpasswd -M alice,bob,charlie developers
```

### 5.5. newgrp — 유효 그룹 전환

```bash
newgrp GROUPNAME   # 서브셸을 열어 유효 그룹 전환
```

`usermod -aG`로 그룹을 추가한 후 재로그인 없이 즉시 적용할 때 사용한다.

---

## 6. 패스워드 관리

### 6.1. passwd — 패스워드 변경

```bash
passwd [options] [LOGIN]
```

| 옵션 | 설명 (root만) |
|------|------|
| `-d` | 패스워드 삭제 (패스워드 없는 계정) |
| `-e` | 즉시 만료. 다음 로그인 시 변경 강제 |
| `-l` | 패스워드 잠금 (`!` 접두사 추가) |
| `-u` | 패스워드 잠금 해제 |
| `-S` | 패스워드 상태 출력 |
| `-n DAYS` | 변경 최소 간격 (일) |
| `-x DAYS` | 유효 기간 (일). `-1` = 무제한 |
| `-w DAYS` | 만료 전 경고 기간 (일) |
| `-i DAYS` | 만료 후 유예 기간 (일) |
| `--stdin` | 표준 입력에서 패스워드 읽기 (스크립트용) |

```bash
# 현재 사용자 패스워드 변경
passwd

# 특정 사용자 패스워드 설정 (root)
passwd jane

# 스크립트에서 패스워드 설정
echo "newpassword" | passwd --stdin jane  # RHEL/CentOS 계열
echo "jane:newpassword" | chpasswd        # Debian/Ubuntu 포함 범용

# 패스워드 상태 확인
passwd -S jane
# 출력: jane P 2026-05-01 0 99999 7 -1

# 다음 로그인 시 변경 강제
passwd -e jane
```

### 6.2. chage — 패스워드 만료 정책

```bash
chage [options] LOGIN
```

| 옵션 | 설명 |
|------|------|
| `-l` | 현재 만료 정보 출력 |
| `-d DATE` | 마지막 패스워드 변경일 설정 (`-d 0` = 즉시 만료) |
| `-E DATE` | 계정 만료일 (YYYY-MM-DD, `-1` = 무제한) |
| `-I DAYS` | 패스워드 만료 후 유예 기간 |
| `-m DAYS` | 최소 변경 간격 |
| `-M DAYS` | 최대 유효 기간 |
| `-W DAYS` | 만료 전 경고 기간 |

```bash
# 만료 정보 확인
chage -l jane

# 다음 로그인 시 패스워드 변경 강제
chage -d 0 jane

# 패스워드 90일 유효, 7일 전 경고
chage -M 90 -W 7 jane

# 계정 만료일 설정 / 제거
chage -E 2026-12-31 jane
chage -E -1 jane          # 만료 없음
```

---

## 7. 자주 쓰는 패턴

```bash
# 애플리케이션 서비스 계정 생성
sudo useradd \
  -r \
  -s /usr/sbin/nologin \
  -d /opt/myapp \
  -c "MyApp Service Account" \
  myapp
sudo mkdir -p /opt/myapp
sudo chown myapp:myapp /opt/myapp

# 사용자 생성 + 패스워드 설정 + sudo 권한 부여 (원라이너)
USERNAME=devuser
useradd -m -s /bin/bash -G sudo "$USERNAME"
echo "${USERNAME}:$(openssl rand -base64 12)" | chpasswd
passwd -e "$USERNAME"    # 첫 로그인 시 변경 강제

# 현재 사용자가 docker 그룹에 있는지 확인 후 없으면 추가
groups $USER | grep -q docker || sudo usermod -aG docker $USER
# 그룹 적용: newgrp docker 또는 재로그인

# 계정 일괄 잠금 (퇴직자 처리)
for user in alice bob charlie; do
  usermod -L "$user"
  chage -E 1 "$user"     # 1970-01-02로 만료일 설정 → 즉시 차단
done

# 특정 그룹 멤버 목록 확인
getent group docker
grep "^docker:" /etc/group

# 시스템 전체 사용자 목록 (일반 사용자만, UID 1000+)
awk -F: '$3 >= 1000 && $3 < 65534 {print $1, $3, $6, $7}' /etc/passwd

# 셸이 /bin/false 또는 nologin인 계정 목록 (서비스 계정)
awk -F: '$7 ~ /nologin|false/ {print $1}' /etc/passwd

# 사용자 계정 전체 현황 스냅샷
echo "=== 일반 사용자 ===" && awk -F: '$3>=1000 && $3<65534{print $1}' /etc/passwd
echo "=== 패스워드 상태 ===" && for u in $(awk -F: '$3>=1000&&$3<65534{print $1}' /etc/passwd); do passwd -S "$u"; done
echo "=== 그룹 현황 ===" && cat /etc/group | awk -F: '$4!=""'
```

---

## Sources
- [useradd(8)](https://man7.org/linux/man-pages/man8/useradd.8.html)
- [usermod(8)](https://man7.org/linux/man-pages/man8/usermod.8.html)
- [userdel(8)](https://man7.org/linux/man-pages/man8/userdel.8.html)
- [groupadd(8)](https://man7.org/linux/man-pages/man8/groupadd.8.html)
- [passwd(1)](https://man7.org/linux/man-pages/man1/passwd.1.html)
- [id(1)](https://man7.org/linux/man-pages/man1/id.1.html)

---

## Related pages
- [[linux-file-permissions]]
- [[environment-variables]]
- [[ps]]
- [[nohup]]
