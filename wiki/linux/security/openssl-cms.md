---
title: OpenSSL CMS — 서명·암호화 메시지
updated: 2026-07-08 10:32:15
tags:
  - linux
  - openssl
  - cms
  - smime
  - cryptography
  - signature
---

## 1. 개요

CMS(Cryptographic Message Syntax, RFC 5652)는 디지털 서명·암호화된 메시지를 표현하는 표준 형식. S/MIME 이메일, 전자서명 문서, 코드 서명 등에 사용된다.

| 명령 | 설명 |
|------|------|
| `openssl cms` | CMS/S/MIME v3 처리 (현재 권장) |
| `openssl smime` | S/MIME v2 처리 (레거시, cms 사용 권장) |

**CMS 데이터 타입:**

| 타입 | 설명 |
|------|------|
| `SignedData` | 디지털 서명 데이터 |
| `EnvelopedData` | 암호화 데이터 (수신자 공개키로 봉인) |
| `DigestedData` | 다이제스트 데이터 |

---

## 2. 서명 (`-sign`)

개인키와 인증서로 메시지에 디지털 서명.

```bash
# 분리 서명 (Detached) — 원본과 서명 파일 분리
openssl cms -sign \
  -in message.txt \
  -signer cert.pem \
  -inkey private.key \
  -out signed.cms

# 포함 서명 (Opaque) — 원본이 서명 파일 내부에 포함
openssl cms -sign -nodetach \
  -in message.txt \
  -signer cert.pem \
  -inkey private.key \
  -out signed.cms

# 해시 알고리즘 지정 (기본: SHA-256)
openssl cms -sign \
  -in message.txt \
  -signer cert.pem \
  -inkey private.key \
  -md sha384 \
  -out signed.cms

# 중간 인증서 체인 포함
openssl cms -sign \
  -in message.txt \
  -signer cert.pem \
  -inkey private.key \
  -certfile chain.pem \
  -out signed.cms
```

| 옵션 | 설명 |
|------|------|
| `-signer <file>` | 서명 인증서 |
| `-inkey <file>` | 서명에 사용할 개인키 |
| `-md <alg>` | 해시 알고리즘 (기본: sha256) |
| `-nodetach` | 원본을 서명 내부에 포함 (Opaque 서명) |
| `-certfile <file>` | 체인 인증서 포함 |
| `-cades` | CAdES-BES 준수 서명 생성 |

---

## 3. 서명 검증 (`-verify`)

```bash
# CA 인증서로 서명 검증 (원본 내용 출력)
openssl cms -verify \
  -in signed.cms \
  -CAfile ca.pem \
  -out message.txt

# 분리 서명 검증 (원본 파일 별도 지정)
openssl cms -verify \
  -in signed.cms \
  -content message.txt \
  -CAfile ca.pem

# 인증서 체인 검증 생략 (테스트용)
openssl cms -verify \
  -in signed.cms \
  -noverify \
  -out message.txt
```

| 옵션 | 설명 |
|------|------|
| `-CAfile <file>` | 신뢰하는 CA 인증서 |
| `-content <file>` | 분리 서명 검증 시 원본 파일 지정 |
| `-noverify` | 서명 인증서 체인 검증 생략 (테스트용) |
| `-out <file>` | 검증된 원본 내용 저장 |

---

## 4. 암호화 (`-encrypt`)

수신자의 공개키(인증서)로 메시지를 봉인. 수신자 개인키 없이는 복호화 불가.

```bash
# AES-256-CBC로 암호화
openssl cms -encrypt \
  -aes-256-cbc \
  -in message.txt \
  -out encrypted.cms \
  recipient.pem

# 복수 수신자
openssl cms -encrypt \
  -aes-256-cbc \
  -in message.txt \
  -out encrypted.cms \
  alice.pem bob.pem
```

> 기본 암호화 알고리즘은 3DES. 보안상 `-aes-256-cbc` 명시 권장.

---

## 5. 복호화 (`-decrypt`)

```bash
openssl cms -decrypt \
  -in encrypted.cms \
  -recip cert.pem \
  -inkey private.key \
  -out message.txt
```

| 옵션 | 설명 |
|------|------|
| `-recip <file>` | 수신자 인증서 |
| `-inkey <file>` | 수신자 개인키 |
| `-out <file>` | 복호화된 내용 저장 |

---

## 6. `openssl smime`

S/MIME 2.0(RFC 2311) 처리. 신규 작업에는 `openssl cms` 사용 권장.

> `openssl smime`의 기본 다이제스트는 **SHA-1** (`openssl cms`는 SHA-256). 레거시 클라이언트와 호환 시 주의.

```bash
# 서명
openssl smime -sign \
  -in message.txt -signer cert.pem -inkey private.key -out signed.msg

# 검증
openssl smime -verify \
  -in signed.msg -CAfile ca.pem -out message.txt

# 암호화
openssl smime -encrypt \
  -aes-256-cbc -in message.txt -out encrypted.msg recipient.pem

# 복호화
openssl smime -decrypt \
  -in encrypted.msg -recip cert.pem -inkey private.key
```

`openssl cms`와 옵션 구조가 거의 동일하지만 S/MIME 2.0 포맷만 처리한다.

---

## Sources
- [openssl-cms (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-cms/)
- [openssl-smime (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-smime/)

---

## Related pages
- [[cms]] — CMS 규격 상세 (구조·RFC 계보·RecipientInfo)
- [[openssl-overview]]
- [[openssl-dgst]]
- [[openssl-keygen]]
- [[openssl-x509]]
- [[openssl-pkcs12]]
- [[openssl-s_client]]
