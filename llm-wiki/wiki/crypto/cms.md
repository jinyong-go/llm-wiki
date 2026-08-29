---
title: CMS (Cryptographic Message Syntax)
updated: 2026-07-14 11:10:21
tags:
  - crypto
  - cms
  - pkcs7
  - pki
  - signature
  - encryption
---

## 1. 개요

CMS(Cryptographic Message Syntax)는 임의 데이터에 전자 서명·암호화·MAC(Message Authentication Code)·다이제스트를 적용한 메시지를 표현하는 **PKCS#7 기반 암호화 메시지 포맷**이다. IETF 표준이며 현행 규격은 **RFC 5652 (Internet Standard 70)**. ASN.1로 정의되고 DER/BER로 인코딩된다. PKI의 X.509 인증서를 신원·키 배포 수단으로 사용하며, S/MIME 이메일·전자서명 문서·타임스탬프·코드 서명의 기반 형식이다.

주요 기능:
- 데이터 암호화 (기밀성)
- 전자 서명 (무결성·송신자 인증·부인 방지)
- 메시지 인증 코드(MAC) (무결성)
- 키 교환·키 관리 (수신자별 콘텐츠 암호화 키 전달)

OpenSSL CLI로 다루는 방법은 [[openssl-cms]] 참고.

---

## 2. 규격 계보

| 규격 | 연도 | 내용 |
|---|---|---|
| PKCS#7 v1.5 (RFC 2315) | 1998 | RSA 사의 원형 규격 |
| RFC 2630 | 1999 | IETF가 CMS로 표준화 (S/MIME v3 기반) |
| RFC 3369 / 3370 | 2002 | 메시지 구문과 알고리즘 규격 분리 (3370 = CMS Algorithms) |
| RFC 3852 | 2004 | RecipientInfo 확장 등 |
| **RFC 5652** | 2009 | 현행 (STD 70) |

하위 호환이 유지되어 PKCS#7 v1.5 메시지를 CMS 구현이 처리할 수 있다.

---

## 3. 콘텐츠 타입

최외곽 `ContentInfo`가 타입 OID와 내용을 감싼다. 타입은 중첩 가능하다 (4.5 참고).

| 타입 | 규격 | 기능 | 대표 사용처 |
|---|---|---|---|
| `data` | RFC 5652 | 임의 옥텟 (보통 최내곽) | MIME 본문 등 원문 운반 |
| `signed-data` | RFC 5652 | 전자 서명 | S/MIME 서명, 코드 서명, 타임스탬프, 인증서 번들 |
| `enveloped-data` | RFC 5652 | 수신자 지정 암호화 | S/MIME 암호화 메일 |
| `digested-data` | RFC 5652 | 해시만 포함 | 단독 사용 드묾 (중첩 구성 요소) |
| `encrypted-data` | RFC 5652 | 수신자 정보 없는 암호화 | PKCS#12 내부 |
| `authenticated-data` | RFC 5652 | MAC 무결성 | 단독 사용 드묾 |
| `auth-enveloped-data` | RFC 5083 | AEAD(Authenticated Encryption with Associated Data) 암호화+무결성 | S/MIME 4.0 (AES-GCM) |

---

## 4. 구조 상세

### 4.1. SignedData

```
SignedData ::= SEQUENCE {
    version CMSVersion,
    digestAlgorithms DigestAlgorithmIdentifiers,
    encapContentInfo EncapsulatedContentInfo,
    certificates [0] IMPLICIT CertificateSet OPTIONAL,
    crls [1] IMPLICIT RevocationInfoChoices OPTIONAL,
    signerInfos SignerInfos }
```

| 필드 | 설명 |
|---|---|
| `digestAlgorithms` | 사용된 해시 알고리즘 집합 (SHA-256 등) |
| `encapContentInfo` | 원본 데이터 (**Detached 서명이면 생략**) |
| `certificates` | 검증용 X.509 인증서 (체인 포함 가능) |
| `crls` | 인증서 폐기 정보 |
| `signerInfos` | 서명자별 SignerInfo 집합 — 다중 서명 지원 |

```
SignerInfo ::= SEQUENCE {
    version CMSVersion,
    sid SignerIdentifier,
    digestAlgorithm DigestAlgorithmIdentifier,
    signedAttrs [0] IMPLICIT Attributes OPTIONAL,
    signatureAlgorithm SignatureAlgorithmIdentifier,
    signature SignatureValue,
    unsignedAttrs [1] IMPLICIT Attributes OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `sid` | 서명자 인증서 식별 — `IssuerAndSerialNumber` 또는 `SubjectKeyIdentifier` |
| `signedAttrs` | 서명 대상 속성 — 콘텐츠 타입, 메시지 해시(messageDigest), 서명 시간 등 |
| `signature` | `signedAttrs`(없으면 콘텐츠 해시)에 대한 서명 값 |
| `unsignedAttrs` | 서명에 포함되지 않는 속성 — 대표적으로 타임스탬프 토큰 |

**사용처**
- S/MIME 서명 메일, 전자서명 문서(CAdES), 코드 서명(Windows Authenticode, JAR 서명)
- RFC 3161 타임스탬프 토큰(`TimeStampToken`)의 컨테이너 ([[timestamp-token]])
- **certs-only 메시지** — 서명 없이 `certificates`만 채운 퇴화(degenerate) 형태로 인증서 체인 배포에 사용. `.p7b`/`.p7c` 파일이 이것 ([[openssl-pkcs12]]의 인증서 번들과 비교)

### 4.2. Detached 서명

`encapContentInfo`의 콘텐츠를 생략하면 원본과 서명이 분리된 **detached signature**가 된다. 대용량 원본(PDF 등)에 효율적이며, 원본을 별도 보관·전송하고 서명만 유통할 수 있다. 검증 시에는 원본을 외부에서 제공해야 한다.

**사용처** — PDF 전자서명(문서의 ByteRange를 제외한 영역에 detached CMS 삽입), 코드 서명, 대용량 파일·펌웨어 서명. [[openssl-cms]]의 `-sign`(기본 detached) / `-nodetach` 옵션이 이 구분이다.

### 4.3. EnvelopedData

대칭키(Content Encryption Key, CEK)로 콘텐츠를 암호화하고, CEK를 수신자별 방식(6장)으로 보호해 함께 전달하는 **하이브리드 암호화** 구조.

```
EnvelopedData ::= SEQUENCE {
    version CMSVersion,
    originatorInfo [0] IMPLICIT OriginatorInfo OPTIONAL,
    recipientInfos RecipientInfos,
    encryptedContentInfo EncryptedContentInfo,
    unprotectedAttrs [1] IMPLICIT Attributes OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `originatorInfo` | 송신자 인증서 등 (키 합의 방식에서 사용) |
| `recipientInfos` | 수신자별로 보호된 CEK 목록 — 다중 수신자 지원 |
| `encryptedContentInfo` | 암호화된 콘텐츠 + 콘텐츠 암호화 알고리즘 |
| `unprotectedAttrs` | 암호화되지 않는 메타데이터 |

```
EncryptedContentInfo ::= SEQUENCE {
    contentType ContentType,
    contentEncryptionAlgorithm ContentEncryptionAlgorithmIdentifier,
    encryptedContent [0] IMPLICIT EncryptedContent OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `contentType` | 암호화된 콘텐츠의 원래 타입 OID (보통 `data`, 중첩 시 `signed-data` 등) |
| `contentEncryptionAlgorithm` | 콘텐츠 암호화 알고리즘 + 파라미터(IV 등) — AES-128/256-CBC 등 |
| `encryptedContent` | CEK로 암호화된 콘텐츠. 생략 시 암호문을 외부에서 별도 전달 |

**사용처** — S/MIME 암호화 메일, 기관 간 파일 암호화 전달(수신자 인증서 기반), CMP·EST 등 인증서 관리 프로토콜의 페이로드 보호. 신규 설계는 AEAD를 쓰는 `auth-enveloped-data`(RFC 5083)가 권장된다.

### 4.4. 기타 타입

- **DigestedData** — `digestAlgorithm` + `encapContentInfo` + `digest`. 무결성 확인용 해시만 포함하며 서명 값이 없다. 단독 사용은 드물고 다른 타입과의 중첩 구성 요소로 쓰인다.
- **EncryptedData** — `RecipientInfo`가 없는 암호화. 키 배포를 규격 밖에서 해결하는 경우 사용. **PKCS#12(.p12/.pfx)가 패스워드 유도 키로 내용물을 보호할 때 이 구조를 쓴다** ([[openssl-pkcs12]]).
- **AuthenticatedData** — MAC 알고리즘(HMAC-SHA256 등)과 `mac` 값으로 무결성을 보장. MAC 키는 `recipientInfos`로 전달. 서명(부인 방지)이 불필요하고 무결성만 필요한 경우용이나 실사용은 드물다.

### 4.5. 서명 + 암호화 중첩

PKCS#7의 `SignedAndEnvelopedData` 타입은 CMS에서 **중첩(nesting)으로 대체**되었다. SignedData의 콘텐츠 자리에 EnvelopedData를 넣거나(암호화 후 서명), EnvelopedData의 콘텐츠로 SignedData를 넣어(서명 후 암호화) 특정 수신자만 원문 확인·서명 검증이 가능한 메시지를 구성한다. 일반적으로 **서명 후 암호화**가 권장된다. S/MIME의 서명+암호화 메일이 이 구성이다.

중첩은 한 타입의 콘텐츠 자리(`encapContentInfo` / `encryptedContentInfo`)에 다른 CMS 타입을 넣고, 그 타입 OID(`eContentType` / `contentType`)로 내부 타입을 표시하는 방식이다.

**서명 후 암호화 (권장)** — 서명자 신원과 서명 값까지 암호화되어 은닉됨:

```
ContentInfo (enveloped-data)
└─ EnvelopedData
   ├─ recipientInfos            — 수신자별 보호된 CEK
   └─ encryptedContentInfo
      ├─ contentType: signed-data
      └─ encryptedContent       — 암호화된 SignedData 전체
         └─ SignedData
            ├─ encapContentInfo (eContentType: data) — 원문
            └─ signerInfos      — 원문에 대한 서명
```

수신자는 CEK 복호 → SignedData 복원 → 서명 검증 순으로 처리한다.

**암호화 후 서명** — 서명이 노출되어 누가 보냈는지 제3자가 확인 가능. 서명자가 암호문 내용을 모른 채 서명했을 수 있다는 문제(원문 소유 증명 불가)가 있다:

```
ContentInfo (signed-data)
└─ SignedData
   ├─ encapContentInfo (eContentType: enveloped-data)
   │  └─ EnvelopedData          — 원문 암호화
   └─ signerInfos               — 암호문에 대한 서명
```

중첩 깊이에 제한은 없으며, S/MIME은 3중 래핑(서명→암호화→서명, triple wrapping, RFC 2634)도 정의한다.

---

## 5. 검증

타입별로 수신 측이 수행하는 검증이 다르다. 상대의 인증서를 사용하는 경우 공통적으로 인증서 검증이 선행된다.

### 5.1. 인증서 검증

CMS 자체는 인증서 검증 절차를 정의하지 않으며, 공개키의 선택·검증은 X.509 경로 검증(RFC 5280) 등 외부 절차에 따른다 (RFC 5652 §5.6):
- 신뢰 앵커(루트 CA)까지 체인 구성 및 각 인증서의 서명 검증
- 유효기간 확인
- 폐기 여부 확인 (CRL/OCSP)
- 키 용도(Key Usage) 확인 — 서명 검증은 digitalSignature/nonRepudiation, 키 전달은 keyEncipherment 등

### 5.2. SignedData — 서명 검증 (RFC 5652 §5.4, §5.6)

1. `sid`로 서명자 인증서 식별(보통 `certificates` 필드에서) → 인증서 검증 후 공개키 획득
2. `digestAlgorithm`으로 콘텐츠(`eContent` 옥텟, detached면 외부 원본) 해시 재계산 — 송신자가 계산한 해시 값에 의존해서는 안 됨(MUST NOT)
3. `signedAttrs`가 있으면:
   - `message-digest` 속성 값 = 재계산한 콘텐츠 해시인지 확인
   - `content-type` 속성 값 = `eContentType`인지 확인
   - 서명 검증 입력은 `signedAttrs` 전체의 DER 인코딩 해시
4. `signedAttrs`가 없으면 콘텐츠 해시가 곧 서명 검증 입력
5. 공개키로 `signature` 값 검증

### 5.3. EnvelopedData — 검증 없음, 복호화만

EnvelopedData에는 서명·MAC이 없어 **무결성·송신자 인증을 제공하지 않는다**. 수신 처리는 검증이 아닌 복호화다:
1. `recipientInfos`에서 자신의 인증서(issuer+serial 또는 SubjectKeyIdentifier)와 일치하는 RecipientInfo 식별
2. 방식별로 CEK 복원 — 개인키로 복호(키 전달), 키 합의로 KEK 유도 후 복호 등
3. CEK로 `encryptedContent` 복호화

복호화 성공이 무결성을 보장하지 않으며(CBC 패딩은 변조 탐지 수단이 아님), 무결성·인증이 필요하면 SignedData 중첩(4.5)이나 `auth-enveloped-data`를 사용한다.

### 5.4. 기타 타입

- **AuthEnvelopedData** — 복호화와 AEAD 인증 태그 검증이 함께 수행되며, 검증 실패 시 평문을 파기해야 한다(MUST, RFC 5083 §2). 무결성은 보장되나 서명이 아니므로 부인 방지는 없음
- **DigestedData** — 콘텐츠 해시를 독립적으로 재계산해 `digest` 값과 비교 (RFC 5652 §7)
- **AuthenticatedData** — `recipientInfos`로 MAC 키 복원 → MAC 재계산 → `mac` 값과 비교. `authAttrs`가 있으면 message-digest·content-type 속성 검사도 SignedData와 동일하게 수행 (RFC 5652 §9.3). MAC 키를 여러 당사자가 공유하면 출처 인증이 성립하지 않음 (RFC 5652 §12)
- **EncryptedData** — 검증 요소 없음. 규격 밖에서 얻은 키로 복호화만 수행

---

## 6. RecipientInfo — CEK 전달 방식

| 타입 | 방식 | 규격 |
|---|---|---|
| `KeyTransRecipientInfo` | 수신자 RSA 공개키로 CEK 암호화 (전통적) | RFC 5652 |
| `KeyAgreeRecipientInfo` | (EC)DH 키 합의로 KEK 유도 | RFC 5652 |
| `KEKRecipientInfo` | 사전 공유 대칭 KEK | RFC 5652 |
| `PasswordRecipientInfo` | 패스워드 유도 키 | RFC 3211 |
| `OtherRecipientInfo` | 확장점 | RFC 5652 |
| `KEMRecipientInfo` | KEM 공유 비밀 → KDF → KEK | **RFC 9629** (5652 갱신) |

`KEMRecipientInfo`(2024)는 PQC(Post-Quantum Cryptography) 대비 확장으로, RSA-KEM(RFC 9690)·ML-KEM(RFC 9936)의 CMS 적용 기반이다.

---

## 7. 알고리즘·보강 규격

| 규격 | 내용 |
|---|---|
| RFC 3370 | CMS 기본 알고리즘 (SHA-1, RSA, DSA, DH 등) |
| RFC 5754 | SHA-2 계열 서명 사용 |
| RFC 8419 | EdDSA(Ed25519/Ed448) 서명 사용 |
| RFC 5084 | AES-CCM/GCM (auth-enveloped-data용) |
| RFC 8933 | 서명 알고리즘 식별자 보호 — 알고리즘 치환 공격 대응 |

---

## 8. CMS를 사용하는 상위 규격

- **S/MIME** — 이메일 서명·암호화. v2(RFC 2311) → v3(2633) → v3.1(3851) → v3.2(5751) → **v4.0(RFC 8551)**
- **RFC 3161 TSP** — 타임스탬프 프로토콜. `TimeStampToken`이 SignedData 구조이며 TSA가 서명 ([[timestamp-token]])
- **CAdES (RFC 5126)** — 장기 검증(LTV)을 위한 확장 전자서명 프로파일
- 기타: 펌웨어 서명(RFC 4108), EST 인증서 등록(RFC 7030)

---

## Sources
- `raw/crypto/CMS.md`
- [RFC 5652: Cryptographic Message Syntax](https://datatracker.ietf.org/doc/html/rfc5652)
- [RFC 5083: CMS Authenticated-Enveloped-Data](https://www.rfc-editor.org/rfc/rfc5083)
- [RFC 9629: Using KEM Algorithms in CMS](https://www.rfc-editor.org/rfc/rfc9629.html)
- [RFC 8551: S/MIME 4.0](https://www.rfc-editor.org/rfc/rfc8551)
- [RFC 3161: Time-Stamp Protocol](https://www.rfc-editor.org/rfc/rfc3161)
- [RFC 5280: Internet X.509 PKI Certificate and CRL Profile](https://datatracker.ietf.org/doc/html/rfc5280)

---

## Related pages
- [[timestamp-token]]
- [[x509-certificate]]
- [[openssl-cms]]
- [[openssl-x509]]
- [[openssl-overview]]
- [[openssl-pkcs12]]
