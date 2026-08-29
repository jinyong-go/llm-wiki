---
title: OpenSSL s_client — TLS 연결 진단
updated: 2026-07-08 10:32:15
tags:
  - linux
  - openssl
  - tls
  - ssl
  - diagnostics
  - certificate
---

## 1. 개요

`openssl s_client`는 TLS/SSL 서버에 연결하는 범용 TLS 클라이언트 진단 도구. 실제 TLS 핸드셰이크를 수행하면서 인증서 체인 확인, 프로토콜 버전, 암호 스위트 등을 진단한다.

> 테스트 도구로 설계되어 인증서 검증 실패 시에도 기본적으로 연결을 계속한다. 실제 애플리케이션에서는 이 동작을 따라해선 안 된다.

---

## 2. 기본 연결 및 인증서 확인

```bash
# HTTPS 연결
openssl s_client -connect example.com:443

# 인증서 체인 전체 출력
openssl s_client -connect example.com:443 -showcerts

# CA 파일로 서버 인증서 검증
openssl s_client -connect example.com:443 \
  -verifyCAfile /etc/ssl/certs/ca-certificates.crt \
  -verify_return_error   # 검증 실패 시 핸드셰이크 중단

# 간결한 요약 출력
openssl s_client -connect example.com:443 -brief
```

---

## 3. SNI (Server Name Indication)

하나의 IP에 여러 도메인이 있는 경우 SNI로 대상 도메인 명시.

```bash
# SNI 명시적 지정
openssl s_client -connect 192.168.1.1:443 -servername example.com

# SNI 억제 (IP 기반 인증서 테스트)
openssl s_client -connect example.com:443 -noservername
```

> OpenSSL 1.1.1부터 `-connect`에 호스트명을 사용하면 SNI가 자동 설정된다. IP로 연결할 때는 `-servername`을 명시해야 한다.

---

## 4. STARTTLS

평문으로 시작해 TLS로 업그레이드하는 프로토콜.

```bash
# SMTP (25, 587)
openssl s_client -starttls smtp -connect mail.example.com:25

# IMAP (143)
openssl s_client -starttls imap -connect mail.example.com:143

# POP3 (110)
openssl s_client -starttls pop3 -connect mail.example.com:110

# LDAP (389)
openssl s_client -starttls ldap -connect ldap.example.com:389
```

지원 프로토콜: `smtp`, `pop3`, `imap`, `ftp`, `xmpp`, `xmpp-server`, `irc`, `postgres`, `mysql`, `lmtp`, `nntp`, `sieve`, `ldap`

---

## 5. TLS 버전 제어

```bash
# 특정 버전만 허용
openssl s_client -connect example.com:443 -tls1_2
openssl s_client -connect example.com:443 -tls1_3

# 특정 버전 비활성화
openssl s_client -connect example.com:443 -no_tls1 -no_tls1_1
```

---

## 6. 클라이언트 인증서 (mTLS)

서버가 클라이언트 인증서를 요구할 때.

```bash
openssl s_client -connect example.com:443 \
  -cert client.pem \
  -key client.key
```

---

## 7. 진단 옵션

```bash
# 프로토콜 메시지 출력
openssl s_client -connect example.com:443 -msg

# 전체 트래픽 hex dump
openssl s_client -connect example.com:443 -debug

# SSL 세션 상태 출력
openssl s_client -connect example.com:443 -state

# 종료 시 세션 정보 출력
openssl s_client -connect example.com:443 -prexit
```

---

## 8. 비대화형 사용

```bash
# 인증서 subject, issuer, 유효 기간 확인
echo | openssl s_client -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# 만료일만 추출
echo | openssl s_client -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -enddate

# SHA-256 fingerprint 확인
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -fingerprint -sha256
```

> `echo |`로 stdin에 EOF를 즉시 보내 비대화형으로 종료. `2>/dev/null`은 핸드셰이크 로그 억제.

파이프라인에서 stdin이 파일 등으로 연결된 경우 EOF 후 연결이 바로 끊길 수 있다. `-ign_eof` 옵션을 추가하면 stdin이 닫혀도 서버 응답이 끝날 때까지 연결을 유지한다.

```bash
# stdin 파이프 + 서버 응답 대기
cat request.txt | openssl s_client -connect example.com:443 -ign_eof
```

---

## 9. 세션 재사용 테스트

```bash
# 세션 저장
openssl s_client -connect example.com:443 -sess_out session.pem

# 저장된 세션으로 재연결
openssl s_client -connect example.com:443 -sess_in session.pem

# 세션 캐싱 5회 재연결 테스트
openssl s_client -connect example.com:443 -reconnect
```

---

## 10. 주요 옵션 정리

| 옵션 | 설명 |
|------|------|
| `-connect <host:port>` | 연결 대상 |
| `-servername <name>` | SNI 호스트명 |
| `-noservername` | SNI 억제 |
| `-showcerts` | 서버 인증서 체인 전체 출력 |
| `-verifyCAfile <file>` | 신뢰 CA 파일 |
| `-verify_return_error` | 검증 실패 시 연결 중단 |
| `-starttls <proto>` | STARTTLS 프로토콜 지정 |
| `-tls1_2` / `-tls1_3` | TLS 버전 강제 |
| `-no_tls1` / `-no_tls1_1` | 특정 TLS 버전 비활성화 |
| `-cert` / `-key` | 클라이언트 인증서·키 (mTLS) |
| `-brief` | 간결한 출력 |
| `-msg` | 프로토콜 메시지 출력 |
| `-debug` | 전체 트래픽 hex dump |
| `-state` | 핸드셰이크 상태 출력 |
| `-prexit` | 종료 시 세션 정보 출력 |
| `-sess_out` / `-sess_in` | 세션 저장·불러오기 |
| `-reconnect` | 세션 재사용 5회 테스트 |
| `-ign_eof` | stdin EOF 후에도 서버 응답이 끝날 때까지 연결 유지 |

---

## Sources
- [openssl-s_client (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-s_client/)

---

## Related pages
- [[openssl-overview]]
- [[openssl-keygen]]
- [[openssl-x509]]
- [[openssl-pkcs12]]
