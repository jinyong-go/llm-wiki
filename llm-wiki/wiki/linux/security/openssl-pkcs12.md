---
title: OpenSSL PKCS#12 — 인증서 번들 생성·추출
updated: 2026-07-08 10:32:15
tags:
  - linux
  - openssl
  - pkcs12
  - pki
  - certificate
---

## 1. 개요

PKCS#12는 개인키, 인증서, 체인 인증서를 하나의 바이너리 파일로 묶는 컨테이너 형식. 확장자는 `.p12` 또는 `.pfx`. Java KeyStore, Windows 인증서 저장소, 브라우저 가져오기 등에서 주로 사용된다.

`openssl pkcs12`는 **조회 모드**(기본)와 **생성 모드**(`-export`) 두 가지로 동작한다.

---

## 2. 파일 조회

```bash
# 구조 및 암호화 알고리즘 정보 출력
openssl pkcs12 -in certs.p12 -info -noout

# 개인키만 추출 (암호화 없이)
openssl pkcs12 -in certs.p12 -nocerts -out key.pem -noenc

# 클라이언트 인증서만 추출 (중간/루트 제외)
openssl pkcs12 -in certs.p12 -clcerts -nokeys -out cert.pem

# CA 인증서(중간·루트)만 추출
openssl pkcs12 -in certs.p12 -cacerts -nokeys -out chain.pem

# 내용 검증만 (출력 없음)
openssl pkcs12 -in certs.p12 -noout
```

---

## 3. PKCS#12 파일 생성 — `-export`

```bash
# 개인키 + 인증서 + 체인 인증서를 하나로 묶기
openssl pkcs12 -export \
  -out cert.p12 \
  -inkey key.pem \
  -in cert.pem \
  -certfile chain.pem \
  -name "my-cert"

# 체인 인증서 자동 포함 (-chain)
openssl pkcs12 -export \
  -out cert.p12 \
  -inkey key.pem \
  -in cert.pem \
  -chain -CAfile ca-bundle.pem \
  -name "my-cert"

# 비밀번호 비대화형 지정
openssl pkcs12 -export \
  -out cert.p12 \
  -inkey key.pem \
  -in cert.pem \
  -passout pass:mypassword
```

---

## 4. 비밀번호 지정 방식 (`-passin` / `-passout`)

| 형식 | 설명 |
|------|------|
| `pass:1234` | 비밀번호 직접 지정 |
| `stdin` | 터미널에서 입력 |
| `file:path` | 파일에서 읽기 |
| `env:VAR` | 환경변수에서 읽기 |

---

## 5. OpenSSL 3.0 호환성

OpenSSL 3.0부터 기본 암호화 알고리즘이 변경되었다.

| | 기본 (3.0+) | 레거시 |
|-|------------|--------|
| 인증서 암호화 | AES-256-CBC + PBKDF2 | RC2-40-CBC 또는 3DES-CBC |
| 개인키 암호화 | AES-256-CBC + PBKDF2 | 3DES-CBC |

구버전 도구(Java 구버전 keytool 등)가 생성한 `.p12` 파일을 읽을 때 오류가 발생하면 `-legacy` 옵션 추가:

```bash
openssl pkcs12 -in old.p12 -info -noout -legacy
```

---

## 6. 주요 옵션 정리

| 옵션 | 설명 |
|------|------|
| `-in <file>` | 입력 파일 |
| `-out <file>` | 출력 파일 |
| `-passin <arg>` | 입력 파일 비밀번호 |
| `-passout <arg>` | 출력 파일 비밀번호 |
| `-info` | 암호화 알고리즘 등 메타데이터 출력 |
| `-noout` | 출력 억제 (검증만) |
| `-nokeys` | 개인키 제외하고 인증서만 출력 |
| `-nocerts` | 인증서 제외하고 개인키만 출력 |
| `-clcerts` | 클라이언트 인증서만 출력 (중간/루트 제외) |
| `-cacerts` | 중간·루트 인증서만 출력 |
| `-noenc` | 추출된 개인키를 암호화 없이 저장 (구 `-nodes`) |
| `-export` | 생성 모드로 전환 |
| `-inkey <file>` | 포함할 개인키 |
| `-certfile <file>` | 함께 묶을 중간 인증서 |
| `-chain` | 체인 인증서 자동 포함 |
| `-name <alias>` | 친숙한 이름(Friendly Name) 부여 |
| `-legacy` | 구버전 알고리즘(RC2/3DES) 호환 모드 |

---

## Sources
- [openssl-pkcs12 (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-pkcs12/)

---

## Related pages
- [[openssl-overview]]
- [[openssl-keygen]]
- [[openssl-x509]]
- [[openssl-cms]]
