---
title: OpenSSL X.509 — 인증서 생성·조회·서명
updated: 2026-07-08 10:50:28
tags:
  - linux
  - openssl
  - x509
  - pki
  - tls
  - certificate
---

## 1. 개요

X.509는 공개키 인증서 표준. CA(Certificate Authority)가 서명한 인증서를 통해 공개키의 소유자를 보증한다.

```
개인키 생성 (openssl genpkey)
  └─ CSR 생성 (openssl req -new)
       └─ 인증서 서명·발급 (openssl x509 또는 CA)
```

| 명령 | 용도 |
|------|------|
| `openssl req` | CSR 생성, 자체 서명 인증서 생성 |
| `openssl x509` | 인증서 조회·검증·서명·변환 |
| `openssl verify` | 인증서 체인 및 신뢰성 검증 |

---

## 2. X.509 인증서 주요 필드

| 필드 | 설명 |
|------|------|
| Subject | 인증서 소유자 (CN, O, C 등) |
| Issuer | 서명한 CA 정보 |
| Serial Number | CA가 발급한 고유 일련번호 |
| Validity | Not Before / Not After (유효 기간) |
| Subject Public Key | 소유자의 공개키 |
| Extensions | SAN, Key Usage, Basic Constraints 등 |
| Signature | CA의 개인키 서명값 |

---

## 3. CSR 생성 (`openssl req`)

CSR(Certificate Signing Request)은 인증서 발급 요청서. 개인키와 Subject 정보가 포함된다.

```bash
# 기존 개인키로 CSR 생성 (Subject 대화형 입력)
openssl req -new -key private.key -out request.csr

# -subj로 Subject 직접 지정 (비대화형)
openssl req -new -key private.key -out request.csr \
  -subj "/C=KR/ST=Seoul/O=MyOrg/CN=example.com"

# SAN(Subject Alternative Name) 추가
openssl req -new -key private.key -out request.csr \
  -subj "/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com,IP:192.168.1.1"

# CSR 내용 확인
openssl req -in request.csr -text -noout

# CSR 서명 검증
openssl req -in request.csr -verify -noout
```

`-subj` 형식: `/필드=값/필드=값/...`

| 필드 | 의미 |
|------|------|
| `C` | Country (2자리 국가코드) |
| `ST` | State/Province |
| `L` | Locality (도시) |
| `O` | Organization |
| `OU` | Organizational Unit |
| `CN` | Common Name (도메인 또는 이름) |

---

## 4. 인증서 조회 (`openssl x509`)

```bash
# 전체 내용 출력
openssl x509 -in cert.crt -text -noout

# 특정 필드만 출력
openssl x509 -in cert.crt -subject -noout
openssl x509 -in cert.crt -issuer -noout
openssl x509 -in cert.crt -serial -noout
openssl x509 -in cert.crt -dates -noout         # 유효 기간
openssl x509 -in cert.crt -fingerprint -noout   # SHA-1 지문
openssl x509 -in cert.crt -fingerprint -sha256 -noout

# 공개키 추출
openssl x509 -in cert.crt -pubkey -noout

# DER 형식 인증서 조회
openssl x509 -in cert.der -inform DER -text -noout
```

---

## 5. 자체 서명 인증서 생성

테스트·개발 환경에서 CA 없이 인증서를 직접 생성.

**방법 1: `openssl req -x509` (한 번에 생성)**

```bash
openssl req -x509 -newkey rsa:2048 -keyout private.key -out cert.crt \
  -days 365 -noenc \
  -subj "/CN=example.com" \
  -addext "subjectAltName=DNS:example.com"
```

**방법 2: CSR → 서명 분리**

```bash
# 1. 개인키 생성
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.key

# 2. CSR 생성
openssl req -new -key private.key -out request.csr -subj "/CN=example.com"

# 3. CSR에 자체 서명 → 인증서 발급
openssl x509 -req -in request.csr -key private.key \
  -out cert.crt -days 365 -set_serial 1
```

> OpenSSL 3.0부터 `-signkey` 대신 `-key`가 공식 옵션명. `-signkey`는 하위 호환으로 유지.

---

## 6. CA로 CSR 서명

```bash
openssl x509 -req -in request.csr \
  -CA ca.crt -CAkey ca.key \
  -out cert.crt \
  -days 365 -set_serial 1 \
  -copy_extensions copy     # CSR의 SAN 등 extensions 복사
```

여러 인증서 발급 시 일련번호 자동 관리:

```bash
openssl x509 -req -in request.csr \
  -CA ca.crt -CAkey ca.key \
  -out cert.crt -days 365 \
  -CAcreateserial           # ca.srl 파일로 serial 자동 관리
```

> `-set_serial`, `-CAserial`, `-CAcreateserial` 중 아무것도 지정하지 않으면 랜덤 serial이 생성된다.

---

## 7. 유효성 확인

```bash
# N초 내 만료 여부 확인 (만료 시 exit code 1)
openssl x509 -in cert.crt -checkend 86400 -noout   # 24시간 내 만료?

# 호스트명·이메일·IP 일치 확인
openssl x509 -in cert.crt -checkhost example.com -noout
openssl x509 -in cert.crt -checkemail user@example.com -noout
openssl x509 -in cert.crt -checkip 192.168.1.1 -noout
```

---

## 8. 인증서 체인 및 신뢰성 검증 (`openssl verify`)

인증서가 신뢰할 수 있는 CA에 의해 서명되었는지, 전체 체인이 유효한지 확인한다.

```bash
# 1. 단일 CA 인증서로 검증
openssl verify -CAfile ca.crt cert.crt

# 2. 중간 인증서(Intermediate)를 포함한 체인 검증
openssl verify -CAfile root_ca.crt -untrusted intermediate_ca.crt cert.crt

# 3. 시스템 신뢰 저장소 사용
openssl verify cert.crt

# 4. 상세 체인 정보 확인
openssl verify -show_chain -CAfile root.crt -untrusted inter.crt cert.crt
```

| 옵션 | 설명 |
|------|------|
| `-CAfile <file>` | 신뢰할 수 있는 Root CA 파일 |
| `-untrusted <file>` | 체인 구성에 필요한 중간 인증서들 |
| `-CApath <dir>` | 신뢰 CA들이 저장된 디렉터리 (해시 형식) |
| `-purpose <p>` | 인증서 용도 확인 (`sslserver`, `sslclient` 등) |
| `-crl_check` | CRL(폐기 목록) 검사 활성화 |

---

## 9. 형식 변환 — PEM ↔ DER

```bash
# PEM → DER
openssl x509 -in cert.crt -outform DER -out cert.der

# DER → PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.crt
```

---

## 10. 주요 옵션 정리

### 10.1. `openssl req`

| 옵션 | 설명 |
|------|------|
| `-new` | 새 CSR 생성 |
| `-x509` | CSR 대신 자체 서명 인증서 출력 |
| `-key <file>` | 서명에 사용할 개인키 |
| `-newkey rsa:bits` | 개인키 생성과 동시에 CSR/인증서 생성 |
| `-keyout <file>` | 생성된 개인키 저장 경로 |
| `-out <file>` | 출력 파일 |
| `-subj <dn>` | Subject DN 직접 지정 |
| `-addext <ext>` | X.509 extension 추가 (SAN 등) |
| `-noenc` | 개인키 암호화 없이 저장 (구 `-nodes`) |
| `-days <n>` | 유효 기간 (기본: 30일, `-x509` 사용 시) |
| `-text -noout` | 내용 확인 |
| `-verify` | CSR 서명 검증 |

### 10.2. `openssl x509`

| 옵션 | 설명 |
|------|------|
| `-in <file>` | 입력 인증서 파일 |
| `-out <file>` | 출력 파일 |
| `-inform DER\|PEM` | 입력 형식 (기본: PEM) |
| `-outform DER\|PEM` | 출력 형식 |
| `-text -noout` | 전체 내용 텍스트 출력 |
| `-subject`, `-issuer` | Subject/Issuer 출력 |
| `-serial` | 일련번호 출력 |
| `-dates` | 유효 기간 출력 |
| `-fingerprint` | 인증서 지문 출력 |
| `-pubkey` | 공개키 출력 |
| `-req` | 입력이 인증서가 아닌 CSR임을 명시 |
| `-key <file>` | 자체 서명 시 개인키 (구 `-signkey`) |
| `-CA <file>` | CA 인증서 |
| `-CAkey <file>` | CA 개인키 |
| `-CAcreateserial` | CA 일련번호 파일 자동 생성 |
| `-set_serial <n>` | 일련번호 직접 지정 |
| `-days <n>` | 유효 기간 (기본: 30일) |
| `-copy_extensions copy` | CSR의 extensions를 인증서로 복사 |
| `-checkend <sec>` | N초 내 만료 여부 확인 |
| `-checkhost <host>` | 호스트명 일치 확인 |

---

## Sources
- [openssl-req (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-req/)
- [openssl-x509 (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-x509/)

---

## Related pages
- [[x509-certificate]] — X.509 인증서 규격 상세 (구조·Extensions·체인·폐기)
- [[openssl-overview]]
- [[openssl-keygen]]
- [[openssl-pkcs12]]
- [[openssl-cms]]
- [[openssl-s_client]]
- [[ml-dsa]] — 격자 기반 PQC 서명(FIPS 204)으로 X.509 인증서 발급
