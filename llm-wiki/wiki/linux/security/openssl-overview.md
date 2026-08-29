---
title: OpenSSL 개요
updated: 2026-07-14 11:44:34
tags:
  - linux
  - openssl
  - tls
  - cryptography
  - pki
---

## 1. 개요

OpenSSL은 SSL/TLS 프로토콜 구현과 범용 암호화 기능을 제공하는 오픈소스 라이브러리 + CLI 도구.

두 가지 구성요소:

| 구성요소 | 설명 |
|---------|------|
| **libcrypto** | 암호화 기본 요소 — 해시, 대칭/비대칭 암호화, PRNG, ASN.1 파싱 등 |
| **libssl** | TLS/DTLS 프로토콜 구현 — libcrypto 위에서 동작 |

CLI는 이 두 라이브러리를 `openssl <subcommand>` 형태로 노출한다.

```bash
openssl version -a    # 버전 및 빌드 정보 확인
openssl help          # 서브커맨드 목록
openssl <subcommand> -help  # 서브커맨드별 옵션
```

---

## 2. 서브커맨드 구조

```
openssl <subcommand> [options]
```

| 카테고리 | 서브커맨드 | 용도 |
|----------|-----------|------|
| 해시·다이제스트 | `dgst` | SHA-256/SHA-512 등 해시, HMAC |
| 난수 | `rand` | 암호학적으로 안전한 난수 생성 |
| 대칭 암호화 | `enc` | AES-256-CBC 등 대칭 암복호화 |
| 키 생성 | `genrsa`, `genpkey`, `ecparam` | RSA/EC 개인키 생성 |
| 키 조작 | `rsa`, `ec`, `pkey` | 키 변환, 공개키 추출, 검사 |
| 인증서 서명 요청 | `req` | CSR 생성, 자체 서명 인증서 생성 |
| X.509 인증서 | `x509` | 인증서 조회·서명·변환 |
| PKCS#12 | `pkcs12` | 개인키 + 인증서 번들 (.p12/.pfx) |
| CA 관리 | `ca` | CA로서 인증서 발급·폐기 관리 |
| CRL | `crl` | 인증서 폐기 목록 조회·생성 |
| OCSP | `ocsp` | 실시간 인증서 상태 확인 |
| TLS 연결 테스트 | `s_client` | TLS 클라이언트 (핸드셰이크 진단) |
| TLS 서버 | `s_server` | 테스트용 TLS 서버 |
| 속도 측정 | `speed` | 알고리즘별 처리 속도 벤치마크 |

---

## 3. 핵심 개념

### 3.1. 키·인증서 계층

```
개인키 (Private Key)
  └─ 공개키 (Public Key) 추출 가능
       └─ CSR (Certificate Signing Request)
            └─ X.509 인증서 (CA 서명 또는 자체 서명)
                  └─ PKCS#12 (개인키 + 인증서 번들)
```

### 3.2. 인코딩 형식

| 형식 | 확장자 | 설명 |
|------|--------|------|
| PEM | `.pem`, `.crt`, `.key` | Base64 인코딩, `-----BEGIN ...-----` 헤더 포함 |
| DER | `.der`, `.cer` | 바이너리 ASN.1 인코딩 |
| PKCS#12 | `.p12`, `.pfx` | 개인키 + 인증서 바이너리 번들 |

PEM은 텍스트이므로 `cat`으로 내용 확인이 가능하고, 복사·붙여넣기가 쉽다. DER은 Java KeyStore 등 일부 도구에서 요구한다.

### 3.3. 주요 알고리즘

| 유형 | 알고리즘 |
|------|---------|
| 비대칭 | RSA (2048/4096), EC (P-256/P-384/Ed25519) |
| 해시 | SHA-256, SHA-384, SHA-512, SHA3-256 |
| 대칭 | AES-128/256-CBC/GCM, ChaCha20-Poly1305 |
| MAC | HMAC-SHA256, HMAC-SHA512 |

---

## 4. 빠른 참조

```bash
# 현재 시스템 OpenSSL 버전 확인
openssl version

# 지원하는 알고리즘 목록
openssl list -digest-algorithms
openssl list -cipher-algorithms
openssl list -public-key-algorithms

# 서브커맨드 도움말
openssl dgst -help
openssl req -help
```

---

## Sources
- [OpenSSL Guide: Introduction (OpenSSL Documentation)](https://docs.openssl.org/master/man7/ossl-guide-introduction/)

---

## Related pages
- [[openssl-dgst]]
- [[openssl-keygen]]
- [[openssl-x509]]
- [[openssl-pkcs12]]
- [[openssl-cms]]
- [[openssl-ts]]
- [[openssl-s_client]]
- [[ml-kem]] — 격자 기반 PQC KEM(FIPS 203)
