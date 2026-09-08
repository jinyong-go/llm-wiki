---
title: X.509 인증서
updated: 2026-09-08 23:03:19
tags:
  - crypto
  - pki
  - x509
  - certificate
---

## 1. 개요

X.509는 **PKI(공개키 기반구조)에서 사용하는 인증서 국제 표준**(ITU-T)이다. 두 가지를 규정한다.

1. **인증서 내부 구조** — ASN.1로 구조·데이터를 기술하고 DER로 인코딩
2. **인증 체계의 사용 방식** — 발급·배포·검증으로 신원을 증명하고 데이터를 보호하는 과정

인터넷(TLS 등)에서의 프로파일은 **RFC 5280**(X.509 v3 인증서 + v2 CRL)이 정의한다. CLI 조작(발급·조회·검증)은 [[openssl-x509]] 참고.

---

## 2. 인증서 구조

```
Certificate ::= SEQUENCE {
    tbsCertificate       TBSCertificate,
    signatureAlgorithm   AlgorithmIdentifier,
    signatureValue       BIT STRING }
```

| 구성 | 설명 |
|---|---|
| `tbsCertificate` | **To-Be-Signed** — 서명 대상이 되는 인증서 본체 |
| `signatureAlgorithm` | CA가 서명에 사용한 알고리즘 (OID + 파라미터, 예: 1.2.840.113549.1.1.11 = SHA256withRSA) |
| `signatureValue` | tbsCertificate에 대한 **CA 개인키 서명 값** |

### 2.1. TBSCertificate 필드

| 필드 | 설명 |
|---|---|
| `version` | X.509 버전 (v3 = 2) |
| `serialNumber` | CA 내 인증서 고유 정수 |
| `signature` | 서명 알고리즘 (외곽 signatureAlgorithm과 일치해야 함) |
| `issuer` | 발급 CA의 DN(Distinguished Name) |
| `validity` | 유효기간 — `notBefore` / `notAfter` |
| `subject` | **인증서 소유 주체(피발급자)**의 DN |
| `subjectPublicKeyInfo` | 주체 공개키 + 알고리즘 |
| `issuerUniqueID` / `subjectUniqueID` | (Optional) 고유 식별자 — 실사용 드묾 |
| `extensions` | (Optional, v3) 확장 필드 |

### 2.2. 주요 Extensions

v3에서 도입. 각 확장은 critical 플래그를 가진다 — critical인 확장을 이해하지 못하는 구현은 인증서를 거부해야 한다.

#### Subject Key Identifier (SKI)

- **무엇**: 인증서에 담긴 **주체 공개키의 식별자** (옥텟 문자열)
- **생성**: RFC 5280이 제시하는 관례는 `subjectPublicKey` BIT STRING의 **SHA-1 해시(160비트)** — 또는 타입 비트 `0100` + SHA-1 하위 60비트의 단축형. 고유하기만 하면 다른 방식도 허용된다
- **목적**: 같은 주체가 여러 키를 가질 때(키 교체 등) **어느 공개키인지 식별**하고, 하위 인증서의 AKI와 매칭되어 **체인 구성(path building)의 연결 고리**가 된다. CA 인증서에는 필수. non-critical

#### Authority Key Identifier (AKI)

- **무엇**: 이 인증서에 **서명한 CA 키의 식별자** — 보통 `keyIdentifier`(= 발급자 인증서의 SKI 값), 선택적으로 발급자 DN + 일련번호 조합
- **생성**: 발급 시 CA가 자기 인증서의 SKI를 복사해 넣는다
- **목적**: 발급 CA가 **여러 키를 운용 중일 때(키 롤오버)** 어느 키로 서명했는지 특정한다. 검증자는 `하위 AKI == 상위 SKI` 매칭으로 체인을 조립한다. non-critical

#### Key Usage

공개키의 **암호학적 용도**를 비트 플래그로 제한한다. critical 권장.

| 비트 | 의미 |
|---|---|
| `digitalSignature` | 서명 검증 (엔터티 인증·무결성 — TLS 핸드셰이크 서명 등) |
| `nonRepudiation` (contentCommitment) | 부인 방지 전자서명 |
| `keyEncipherment` | 대칭키를 이 공개키로 암호화해 전달 (RSA key transport) |
| `dataEncipherment` | 데이터 자체를 공개키로 암호화 (실사용 드묾) |
| `keyAgreement` | (EC)DH 키 합의에 사용 |
| `keyCertSign` | **인증서 서명** — CA 전용, Basic Constraints cA=true와 병행 필수 |
| `cRLSign` | CRL 서명 |
| `encipherOnly` / `decipherOnly` | keyAgreement와 조합 시 방향 제한 |

#### Basic Constraints

- **무엇**: `cA`(boolean) + `pathLenConstraint`(선택)
- **목적**: 이 인증서가 **다른 인증서를 발급할 수 있는 CA인지** 판별. `cA=true`가 아니면 keyCertSign이 있어도 발급 불가. `pathLenConstraint=N`은 이 CA 아래로 올 수 있는 **중간 CA 개수를 N개로 제한** (0이면 최종 엔터티만 발급 가능). CA 인증서에서 critical 필수
- **보안 의미**: 최종 엔터티 인증서로 하위 인증서를 발급하는 위조를 차단하는 핵심 장치

#### Extended Key Usage (EKU)

Key Usage보다 구체적인 **응용 수준 용도**를 OID 목록으로 제한한다.

| OID               | 이름                    | 용도                                                              |
| ----------------- | --------------------- | --------------------------------------------------------------- |
| 1.3.6.1.5.5.7.3.1 | `serverAuth`          | **TLS 서버 인증** — HTTPS 서버 인증서의 필수 EKU. 브라우저는 이 EKU 없는 서버 인증서를 거부 |
| 1.3.6.1.5.5.7.3.2 | `clientAuth`          | **TLS 클라이언트 인증** — mTLS에서 클라이언트 신원 증명                           |
| 1.3.6.1.5.5.7.3.3 | `codeSigning`         | **실행 코드 서명** — Authenticode, JAR 서명 등 배포 코드의 출처·무결성 증명          |
| 1.3.6.1.5.5.7.3.4 | `emailProtection`     | **S/MIME** — 이메일 서명·암호화 ([[cms]])                               |
| 1.3.6.1.5.5.7.3.8 | `timeStamping`        | **타임스탬프 토큰 서명** — RFC 3161 TSA 전용. 서명 시점 증명                     |
| 1.3.6.1.5.5.7.3.9 | `OCSPSigning`         | **OCSP 응답 서명** — 위임된 OCSP 응답자 인증서                               |
| 2.5.29.37.0       | `anyExtendedKeyUsage` | 모든 용도 허용 (제한 없음 표시)                                             |

> Key Usage와 EKU가 모두 있으면 **양쪽 모두에 부합하는 용도로만** 사용 가능하다. 예: serverAuth 인증서는 통상 `digitalSignature`(+RSA면 `keyEncipherment`)와 조합.

실사용 인증서 유형별 Key Usage×EKU 조합과 상세 사례는 [[certificate-purpose]] 참고.

#### Subject Alternative Name (SAN)

- **무엇**: subject DN 외의 **추가 식별자 목록** — `dNSName`, `iPAddress`, `rfc822Name`(이메일), `uniformResourceIdentifier`
- **목적**: 하나의 인증서로 복수 도메인·IP를 커버 (멀티 도메인, `*.example.com` 와일드카드)
- **현대 TLS의 필수 확장**: 호스트명 검증은 **SAN의 dNSName 기준** — CN 매칭은 deprecated이며 주요 브라우저는 SAN 없는 서버 인증서를 거부한다. RFC 5280 기준 subject가 빈 시퀀스면 SAN이 critical이어야 한다

### 2.3. 주요 알고리즘

#### 공개키 알고리즘 (`subjectPublicKeyInfo`)

| 알고리즘 | OID | 권장 크기 | 비고 |
|---|---|---|---|
| **RSA** | 1.2.840.113549.1.1.1 | 2048비트 이상 (장기 사용 3072+) | 가장 널리 배포. 키·서명이 큼 |
| **EC (ECDSA/ECDH)** | 1.2.840.10045.2.1 (id-ecPublicKey) | P-256 / P-384 (P-256 ≈ RSA 3072 보안 수준) | 작은 키·빠른 서명. 현대 TLS 주류 |
| **Ed25519 / Ed448** | 1.3.101.112 / 1.3.101.113 | 고정 (256/456비트) | 파라미터 실수 여지 없음. 웹 PKI(CA/Browser Forum) 채택은 제한적 |
| DSA | 1.2.840.10040.4.1 | – | **deprecated** — 신규 사용 금지 |
| **ML-DSA** (PQC) | 2.16.840.1.101.3.4.3.17/18/19 (44/65/87) | 파라미터 세트별 고정 | FIPS 204. PQC(Post-Quantum Cryptography) 인증서 — [[ml-dsa]] |

#### 서명 알고리즘 (`signatureAlgorithm`)

| 알고리즘 | OID | 비고 |
|---|---|---|
| **sha256WithRSAEncryption** | 1.2.840.113549.1.1.11 | RSA PKCS#1 v1.5 + SHA-256 — 가장 흔함 |
| sha384/sha512WithRSAEncryption | 1.2.840.113549.1.1.12 / .13 | 상위 해시 변형 |
| **RSASSA-PSS** | 1.2.840.113549.1.1.10 | 증명 가능 안전성의 RSA 패딩 — PKCS#1 v1.5 대비 권장이나 호환성 확인 필요 |
| **ecdsa-with-SHA256** | 1.2.840.10045.4.3.2 | ECDSA + SHA-256 (P-256과 조합) |
| ecdsa-with-SHA384 / SHA512 | 1.2.840.10045.4.3.3 / .4 | P-384/P-521과 조합 |
| **Ed25519** | 1.3.101.112 | 해시 내장(사전 해시 불필요) — 공개키 알고리즘과 동일 OID |
| ML-DSA-44/65/87 | 2.16.840.1.101.3.4.3.17/18/19 | PQC 서명 |
| ~~md5WithRSA / sha1WithRSA~~ | 1.2.840.113549.1.1.4 / .5 | **금지** — 충돌 공격으로 위조 가능. SHA-1 인증서는 브라우저가 거부 |

> 서명 알고리즘은 **발급 CA의 키 종류**가 결정한다 (인증서 자신의 키가 아님). 예: RSA 루트 CA가 EC 인증서에 서명하면 `sha256WithRSAEncryption`이다.

---

## 3. 인증서 파일 형식

| 확장자 | 형식 | 포함 데이터 | 특징 |
|---|---|---|---|
| `.pem` | Base64 텍스트 | 인증서/개인키/공개키 | `-----BEGIN CERTIFICATE-----` 구분자. 저장·설정 파일에 표준적 |
| `.der` | 바이너리 | 인증서 | PEM의 바이너리 원형. 크기 작아 전송·저장 유리 |
| `.cer` / `.crt` | 텍스트·바이너리 겸용 | 인증서 | 내용은 PEM 또는 DER — .cer는 Windows, .crt는 Linux 관례 |
| `.p7b` / `.p7c` | PKCS#7/CMS | 인증서·체인 (개인키 X) | 체인 배포용 — [[cms]]의 certs-only SignedData |
| `.pfx` / `.p12` | PKCS#12 | 인증서·체인·**개인키** | 패스워드로 암호화된 번들 — [[openssl-pkcs12]] |

형식 변환은 [[openssl-x509]]·[[openssl-overview]] 참고.

---

## 4. 인증서 검증

### 4.1. 서명 검증

인증서가 상위 CA에 의해 유효하게 서명되었는지 확인한다.

1. `tbsCertificate`를 `signatureAlgorithm`의 해시 알고리즘으로 해시
2. **상위(발급자) 인증서의 공개키**로 `signatureValue`를 검증 연산[^1]
3. 두 결과 비교 — 일치하면 서명 유효

[^1]: "공개키로 복호화"라는 관례적 설명은 RSA에 한정된 표현이다. ECDSA/EdDSA 등에서는 복호화가 아닌 서명 검증 연산으로 일반화된다.

### 4.2. 경로 검증 요소 (RFC 5280)

- **서명 검증** — 체인 각 단계에서 상위 인증서 공개키로 하위 서명 확인
- **신뢰 저장소 확인** — 루트 인증서가 클라이언트 Trust Store에 존재하는지
- **유효기간 검증** — 각 인증서의 notBefore ≤ 현재 ≤ notAfter
- **폐기 상태 검증** — CRL 또는 OCSP (6장)
- 제약 검증 — Basic Constraints(CA 여부·pathLen), Key Usage(keyCertSign) 등

---

## 5. 인증서 체인

신뢰할 수 있는 루트에서 최종 엔터티까지 이어지는 계층 연결 — PKI 신뢰 모델의 핵심.

| 계층 | 설명 |
|---|---|
| **루트 인증서** | 체인 최상위. **자체 서명**(issuer = subject). 클라이언트 신뢰 저장소에 사전 배포 |
| **중간 인증서** | 루트 CA가 발급. 최종 인증서 발급 권한 보유 (루트 키 노출 위험 격리) |
| **최종 엔터티 인증서** | 중간 CA가 발급. 서버/클라이언트가 직접 사용 |

**체인 검증 순서**: 최종 인증서 서명 검증(발급자 = 중간 CA 확인) → 중간 인증서 서명 검증(발급자 = 루트 CA 확인) → 루트가 신뢰 저장소에 있는지 확인 → 전 단계 유효하면 신뢰 성립.

---

## 6. 폐기 확인

| 방식 | 동작 | 특징 |
|---|---|---|
| **CRL** | CA가 폐기 인증서 목록을 주기 발행, 클라이언트가 다운로드 | 목록이 커질 수 있고 발행 주기만큼 지연 |
| **OCSP** | 인증서 단건 상태를 OCSP 응답자에 실시간 질의 | 실시간성 ↑, 응답자 가용성·프라이버시 이슈 |
| **OCSP Stapling** | 서버가 OCSP 응답을 미리 받아 TLS 핸드셰이크에 동봉 | 클라이언트 질의 제거 — 성능·프라이버시 개선 |

---

## 7. 사용 사례

- **HTTPS / TLS** — 서버(및 mTLS 클라이언트) 신원 증명, 통신 암호화의 신뢰 기반
- **S/MIME** — 이메일 서명·암호화 ([[cms]])
- **VPN** — 사용자·서버 상호 인증
- 코드 서명, 전자서명(타임스탬프·CAdES), 스마트카드 인증 등

---

## Sources
- `raw/crypto/X.509.md`
- [RFC 5280: Internet X.509 PKI Certificate and CRL Profile](https://datatracker.ietf.org/doc/html/rfc5280)
- [OpenSSL x509v3_config](https://docs.openssl.org/3.6/man5/x509v3_config/)

---

## Related pages
- [[certificate-purpose]] — Key Usage×EKU 조합별 인증서 용도·실사용 사례
- [[cmp]] — 인증서 발급·갱신·폐기 관리 프로토콜
- [[certificate-revocation]] — 인증서 폐기(CRL·OCSP) 상세
- [[cert-path-validation]] — Java/BouncyCastle 인증서 경로 검증 구현
- [[cms]]
- [[ml-dsa]]
- [[openssl-x509]]
- [[openssl-overview]]
- [[openssl-keygen]]
- [[openssl-pkcs12]]
