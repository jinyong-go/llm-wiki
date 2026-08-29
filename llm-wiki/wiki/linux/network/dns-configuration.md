---
title: DNS 설정 — resolv.conf, hosts, nsswitch.conf
updated: 2026-07-08 10:32:15
tags:
  - linux
  - dns
  - network
---

## 1. DNS 해석 순서

리눅스의 호스트명 해석 순서는 `/etc/nsswitch.conf`의 `hosts` 항목이 결정한다.

```bash
cat /etc/nsswitch.conf | grep hosts
# hosts: files dns
```

| 순서 | 서비스 | 파일 |
|------|--------|------|
| 1 | `files` | `/etc/hosts` (정적 매핑) |
| 2 | `dns` | `/etc/resolv.conf`에 지정된 DNS 서버 |
| 3 | `resolve` | systemd-resolved (systemd 환경) |
| 4 | `myhostname` | 로컬 호스트명 합성 |

`files`가 앞에 있으므로 `/etc/hosts`에 항목이 있으면 DNS 쿼리 없이 그 값을 반환한다.

---

## 2. /etc/resolv.conf

DNS 리졸버가 참조하는 핵심 설정 파일.

### 2.1. 디렉티브

**nameserver**
```
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
```
- 최대 3개 (`MAXNS` 상수)
- 순서대로 시도하며 앞 서버가 응답 없으면 다음 서버로 전환

**search** — 도메인 검색 경로
```
search example.internal corp.example.com
```
`ndots` 미만의 점(`.`)을 포함한 짧은 이름 조회 시 각 search 도메인을 차례로 붙여 시도한다.

예: `search example.internal` 설정 + `db-server` 조회
→ `db-server.example.internal` 순으로 시도

**domain** — `search`의 구식 표현 (단일 도메인만 지원), 사용 지양.

**options** — 리졸버 동작 조정
```
options ndots:5 timeout:2 attempts:3 rotate
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `ndots:n` | 1 | 이 값 이상의 `.`이 있어야 절대 도메인으로 간주 (최대 15) |
| `timeout:n` | 5 | 서버당 응답 대기 시간(초, 최대 30) |
| `attempts:n` | 2 | 서버당 재시도 횟수(최대 5) |
| `rotate` | 없음 | nameserver를 라운드로빈으로 선택 |
| `edns0` | 없음 | EDNS0 확장 활성화 (대형 DNS 응답 처리) |
| `single-request` | 없음 | IPv4/IPv6 쿼리를 병렬이 아닌 순차 발송 |
| `use-vc` | 없음 | UDP 대신 TCP 강제 사용 |
| `trust-ad` | 없음 | DNSSEC AD 비트 신뢰 (검증된 환경에서만) |

**ndots 실무 주의:** 쿠버네티스는 기본 `ndots:5`를 설정한다. 외부 도메인 조회 시 search 도메인을 먼저 붙여 5회 시도 후 절대 도메인으로 쿼리하므로 레이턴시가 발생할 수 있다.

### 2.2. 전체 예시

```
nameserver 10.0.0.1
nameserver 8.8.8.8
search example.internal
options ndots:2 timeout:2 attempts:2 rotate
```

---

## 3. /etc/hosts

DNS 쿼리 없이 IP와 호스트명을 정적으로 매핑한다. `nsswitch.conf`의 `files`가 `dns`보다 앞에 있으면 이 파일이 먼저 참조된다.

```
# IP주소        호스트명              별칭
127.0.0.1       localhost
::1             localhost ip6-localhost
10.0.1.50       db-primary.internal  db-primary
10.0.1.51       db-replica.internal  db-replica
```

**활용 패턴:**
- 내부 서버 주소 고정 (DNS 없이 이름으로 접근)
- 특정 도메인 차단 (`0.0.0.0 ads.example.com`)
- 개발 환경 로컬 도메인 설정

---

## 4. /etc/nsswitch.conf — hosts 항목

```
hosts: files dns
```

항목 간 동작은 `[STATUS=ACTION]`으로 제어할 수 있다.

```
hosts: files [NOTFOUND=return] dns
```
→ `/etc/hosts`에 없으면(`NOTFOUND`) DNS를 시도하지 않고 즉시 실패 반환.

| STATUS | 의미 |
|--------|------|
| `success` | 항목 발견 |
| `notfound` | 서비스는 정상이나 항목 없음 |
| `unavail` | 서비스 자체 이용 불가 |
| `tryagain` | 서비스 일시 불가 |

---

## 5. systemd-resolved 통합

최신 배포판(Ubuntu 18.04+, RHEL 8+ 등)에서는 `systemd-resolved`가 DNS를 관리하며 `/etc/resolv.conf`가 심링크로 교체된다.

### 5.1. resolv.conf 심링크 확인

```bash
ls -la /etc/resolv.conf
# /etc/resolv.conf -> ../run/systemd/resolve/stub-resolv.conf
```

| 심링크 대상 | 의미 |
|-------------|------|
| `/run/systemd/resolve/stub-resolv.conf` | `127.0.0.53` 스텁 리졸버 사용 (권장) |
| `/run/systemd/resolve/resolv.conf` | 실제 업스트림 서버 직접 노출 |
| 심링크 없음 | 수동 관리 |

### 5.2. systemd-resolved 설정 파일

`/etc/systemd/resolved.conf` 또는 `/etc/systemd/resolved.conf.d/*.conf`

```ini
[Resolve]
DNS=10.0.0.1 8.8.8.8     # 사용할 DNS 서버
FallbackDNS=1.1.1.1       # 폴백 서버
Domains=example.internal  # 기본 검색 도메인
DNSSEC=no                 # DNSSEC 검증 (off/allow-downgrade/yes)
DNSOverTLS=no             # DNS-over-TLS
Cache=yes                 # 응답 캐시 여부
```

설정 변경 후:
```bash
sudo systemctl restart systemd-resolved
resolvectl status          # 현재 DNS 설정 확인
```

### 5.3. resolv.conf 직접 수정이 무시되는 경우

`systemd-resolved` 또는 `NetworkManager`가 `/etc/resolv.conf`를 관리하면 직접 수정해도 재시작 시 덮어씌워진다.

```bash
# NetworkManager 확인
nmcli general status

# NetworkManager에서 DNS 서버 설정
nmcli con mod "연결이름" ipv4.dns "8.8.8.8 8.8.4.4"
nmcli con up "연결이름"

# systemd-resolved 경유 시
sudo resolvectl dns eth0 8.8.8.8 8.8.4.4
```

영구 수동 설정이 필요한 경우:
```bash
# systemd-resolved 비활성화 후 resolv.conf 직접 관리
sudo systemctl disable --now systemd-resolved
sudo rm /etc/resolv.conf
sudo vi /etc/resolv.conf
# 이후 immutable 설정으로 덮어쓰기 방지
sudo chattr +i /etc/resolv.conf
```

---
## Sources
- [resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html)
- [nsswitch.conf(5)](https://man7.org/linux/man-pages/man5/nsswitch.conf.5.html)
- [resolvectl(1)](https://man7.org/linux/man-pages/man1/resolvectl.1.html)

---
## Related pages
- [[dns-tools]]
- [[systemctl]]
- [[network-diagnostics]]
- [[environment-variables]]
