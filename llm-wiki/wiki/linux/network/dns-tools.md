---
title: DNS 진단 도구 — dig, nslookup, host, resolvectl
updated: 2026-07-08 10:32:15
tags:
  - linux
  - dns
  - network
---

## 1. dig — DNS 조회 도구

`bind-utils` / `dnsutils` 패키지에 포함. 가장 상세한 DNS 응답을 보여주며 스크립트 연동에 적합하다.

### 1.1. 기본 사용법

```bash
dig example.com            # A 레코드 (기본)
dig example.com A          # 명시적으로 A 레코드
dig example.com AAAA       # IPv6 주소
dig example.com MX         # 메일 서버
dig example.com NS         # 네임서버
dig example.com TXT        # TXT 레코드 (SPF, DKIM, 도메인 인증 등)
dig example.com CNAME      # CNAME
dig -x 8.8.8.8             # 역방향 조회 (PTR)
```

### 1.2. 특정 DNS 서버 지정

```bash
dig @8.8.8.8 example.com         # Google DNS로 직접 질의
dig @1.1.1.1 example.com         # Cloudflare DNS
dig @10.0.0.1 internal.example.com  # 내부 DNS 서버 지정
```

**활용:** 로컬 DNS와 외부 DNS 응답이 다를 때 원인 비교에 유용.

### 1.3. 출력 제어

```bash
dig example.com +short             # IP 주소만 출력
dig example.com +noall +answer     # answer 섹션만 출력
dig example.com +nocomments        # 주석 제거
dig example.com +nocmd +noall +answer  # 가장 간결한 출력
```

### 1.4. 출력 구조

```
; <<>> DiG 9.18 <<>> example.com
;; QUESTION SECTION:
;example.com.        IN  A

;; ANSWER SECTION:
example.com.  3600  IN  A  93.184.216.34

;; AUTHORITY SECTION:    ← 응답한 권한 네임서버
;; ADDITIONAL SECTION:   ← 네임서버 IP 등 부가 정보

;; Query time: 12 msec
;; SERVER: 8.8.8.8#53   ← 응답한 DNS 서버
;; WHEN: ...
;; MSG SIZE rcvd: 56
```

| 필드 | 의미 |
|------|------|
| TTL (`3600`) | 캐시 유효 시간(초) |
| `IN` | Internet 클래스 |
| `A` | 레코드 타입 |

### 1.5. 실용 패턴

```bash
# 여러 레코드 타입 한번에
dig example.com ANY

# 상세 쿼리 경로 추적 (루트부터 순차 조회)
dig +trace example.com

# TCP 강제 사용 (UDP 512바이트 초과 응답 시)
dig +tcp example.com

# 짧은 형식으로 역방향 조회
dig -x 93.184.216.34 +short

# 응답 시간 측정 (DNS 레이턴시 확인)
dig example.com | grep "Query time"

# 내부 서비스 DNS 전파 확인 (배포 후)
watch -n 2 "dig @10.0.0.1 myservice.internal +short"
```

---

## 2. nslookup — 간단한 대화형 DNS 조회

대부분의 환경에 기본 설치. 빠른 확인용으로 사용하고 스크립트에는 `dig`를 권장한다.

```bash
nslookup example.com               # A 레코드
nslookup example.com 8.8.8.8       # 특정 서버 질의
nslookup -type=MX example.com      # 레코드 타입 지정
nslookup -type=TXT example.com
```

대화형 모드:
```bash
nslookup
> server 8.8.8.8      # DNS 서버 변경
> set type=MX
> example.com
> exit
```

---

## 3. host — 한 줄 DNS 조회

```bash
host example.com               # A + MX 요약
host -t A example.com          # A 레코드만
host -t MX example.com         # MX 레코드
host 93.184.216.34             # 역방향 조회 (PTR)
host example.com 8.8.8.8       # 특정 서버 질의
```

출력이 한 줄로 간결해 shell 스크립트 내 IP 추출에 편리:
```bash
host -t A example.com | awk '{print $NF}'
```

---

## 4. resolvectl — systemd-resolved 통한 조회

`systemd-resolved` 환경에서 캐시와 DNSSEC 상태까지 포함한 조회를 제공한다.

```bash
resolvectl query example.com          # 기본 조회 (A + AAAA)
resolvectl query -t MX example.com    # 레코드 타입 지정
resolvectl query 93.184.216.34        # 역방향 조회 (PTR)
```

### 4.1. 상태 및 설정 확인

```bash
resolvectl status                  # 전체 DNS 설정 + 인터페이스별 서버
resolvectl status eth0             # 특정 인터페이스 DNS 설정
resolvectl statistics              # 쿼리 수, 캐시 적중률, DNSSEC 통계
resolvectl flush-caches            # DNS 캐시 초기화
```

`resolvectl status` 출력 예시:
```
Global
       Protocols: +LLMNR +mDNS -DNSOverTLS DNSSEC=no/unsupported
resolv.conf mode: stub
      DNS Servers: 10.0.0.1
       DNS Domain: example.internal

Link 2 (eth0)
      DNS Servers: 10.0.0.1
       DNS Domain: example.internal
```

### 4.2. 인터페이스별 DNS 서버 임시 설정

```bash
sudo resolvectl dns eth0 8.8.8.8 8.8.4.4
sudo resolvectl domain eth0 example.internal
sudo resolvectl revert eth0     # 원래 설정으로 복원
```

---

## 5. 도구 비교

| 도구 | 용도 | 특징 |
|------|------|------|
| `dig` | 상세 DNS 분석, 스크립트 | 가장 상세, `+trace`로 경로 추적 |
| `nslookup` | 빠른 대화형 확인 | 대부분 기본 설치, 스크립트 부적합 |
| `host` | 한 줄 요약 | 간결한 출력, 스크립트에 적합 |
| `resolvectl` | systemd-resolved 환경 | 캐시·DNSSEC 상태 포함, 캐시 초기화 |

## 6. 트러블슈팅 패턴

```bash
# 1. 로컬 DNS 서버 확인
cat /etc/resolv.conf

# 2. 로컬 서버로 질의
dig example.com

# 3. 외부 서버와 비교 (전파 지연, 캐시 문제 구분)
dig @8.8.8.8 example.com

# 4. 로컬 캐시 초기화 후 재시도
resolvectl flush-caches
dig example.com

# 5. nsswitch.conf 해석 순서 확인
cat /etc/nsswitch.conf | grep hosts

# 6. /etc/hosts 항목 확인 (DNS보다 우선)
grep example.com /etc/hosts

# 7. 쿼리 경로 전체 추적
dig +trace example.com
```

---
## Sources
- [resolvectl(1)](https://man7.org/linux/man-pages/man1/resolvectl.1.html)
- [dig(1)](https://linux.die.net/man/1/dig)

---
## Related pages
- [[dns-configuration]]
- [[network-diagnostics]]
- [[curl]]
