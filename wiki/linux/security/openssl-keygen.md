---
title: OpenSSL 키 생성
updated: 2026-07-08 10:50:28
tags:
  - linux
  - openssl
  - cryptography
  - rsa
  - ec
  - ed25519
---

## 1. 개요

| 키 유형 | 생성 명령 | 용도 |
|---------|----------|------|
| 대칭키 | `openssl rand` | AES 등 대칭 암호화 키 |
| 비대칭 개인키 | `openssl genpkey` | RSA, EC, Ed25519 개인키 |
| 공개키 추출 | `openssl pkey -pubout` | 개인키에서 공개키 분리 |
| 키 확인 | `openssl pkey -text -noout` | 키 내용·유효성 검사 |

---

## 2. 대칭키 생성 (`openssl rand`)

암호화·복호화에 동일한 키 사용. AES 등 대칭 암호화에서 무작위 바이트 배열로 생성.

```bash
# AES-256 키 (256-bit = 32바이트)
openssl rand -out secret.key 32

# 출력 형식 지정
openssl rand -base64 32   # Base64 텍스트
openssl rand -hex 32      # 16진수 문자열
```

| 옵션 | 설명 |
|------|------|
| `-out <file>` | 키를 파일로 저장 (기본: stdout) |
| `-base64` | Base64 인코딩 출력 |
| `-hex` | 16진수 문자열 출력 |

---

## 3. 비대칭키 생성 (`openssl genpkey`)

공개키·개인키 쌍으로 구성. RSA 전용인 `openssl genrsa`보다 `openssl genpkey`가 권장된다.

### 3.1. RSA

```bash
# RSA-2048 개인키
openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:2048

# RSA-4096
openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:4096
```

| pkeyopt 파라미터 | 기본값 | 설명 |
|-----------------|--------|------|
| `rsa_keygen_bits` | 2048 | 키 길이 (비트) |
| `rsa_keygen_pubexp` | 65537 | 공개 지수 |
| `rsa_keygen_primes` | 2 | 소수 개수 |

### 3.2. EC (타원곡선)

```bash
# P-256
openssl genpkey -algorithm EC -out private.key -pkeyopt ec_paramgen_curve:P-256

# P-384
openssl genpkey -algorithm EC -out private.key -pkeyopt ec_paramgen_curve:P-384
```

### 3.3. 권장 - Ed25519

별도 파라미터 없이 생성. 키 크기가 작고 서명 속도가 빠르다.

```bash
openssl genpkey -algorithm ED25519 -out private.key
```

---

## 4. 키 파일 암호화

개인키 파일을 비밀번호로 암호화해서 저장. `-cipher` 형태로 알고리즘 지정.

```bash
# 생성과 동시에 암호화
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
  -aes-256-cbc -out private_enc.key
# 비밀번호 입력 프롬프트 발생

# 기존 키에 암호화 추가
openssl pkey -in private.key -aes-256-cbc -out private_enc.key

# 암호화된 키에서 암호화 제거
openssl pkey -in private_enc.key -out private.key
```

> DER 형식은 암호화를 지원하지 않는다. 암호화가 필요하면 PEM 형식을 사용해야 한다.

---

## 5. 공개키 추출

```bash
# 개인키 → 공개키 (PEM)
openssl pkey -in private.key -pubout -out public.key
```

---

## 6. 키 확인 (`openssl pkey`)

```bash
# 개인키 내용 출력
openssl pkey -in private.key -text -noout

# 공개키 정보만 출력
openssl pkey -in private.key -text_pub -noout

# 공개키 파일 확인
openssl pkey -pubin -in public.key -text -noout

# 키 쌍 유효성 검사
openssl pkey -in private.key -check
```

| 옵션 | 설명 |
|------|------|
| `-text` | 키 컴포넌트를 평문으로 출력 |
| `-text_pub` | 공개키 컴포넌트만 평문 출력 |
| `-noout` | 인코딩된 키 출력 억제 |
| `-pubin` | 입력 파일이 공개키임을 명시 |
| `-pubout` | 공개키만 출력 |
| `-check` | 키 쌍 일관성 검사 |

---

## 7. 키 형식 변환 — PEM ↔ DER

```bash
# PEM → DER
openssl pkey -in private.key -outform DER -out private.der

# DER → PEM
openssl pkey -in private.der -inform DER -out private.key
```

---

## 8. `openssl genrsa`

RSA 전용으로 `genpkey` 이전부터 존재. 현재도 동작하지만 `genpkey` 사용을 권장.

```bash
openssl genrsa -out private.key 2048
openssl genrsa -aes256 -out private.key 2048   # 암호화 포함
```

---

## Sources
- [openssl-rand (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-rand/)
- [openssl-genpkey (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-genpkey/)
- [openssl-pkey (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-pkey/)

---

## Related pages
- [[openssl-overview]]
- [[openssl-dgst]]
- [[openssl-x509]]
- [[openssl-pkcs12]]
- [[openssl-cms]]
- [[ml-kem]] — 격자 기반 PQC KEM(FIPS 203), 고전 비대칭 키 대안
