---
title: CMS
updated: 2026-10-20 18:00:44
tags:
  - crypto
  - cms
  - pkcs7
  - pki
  - signature
  - encryption
---

## 1. 개요

CMS(Cryptographic Message Syntax)는 임의 데이터에 전자 서명·암호화·MAC(Message Authentication Code)·다이제스트를 적용한 메시지를 표현하는 PKCS#7 기반 암호화 메시지 포맷이다. IETF 표준이며 현행 규격은 RFC 5652 (Internet Standard 70). ASN.1로 정의되고 DER/BER로 인코딩된다. PKI의 X.509 인증서를 신원·키 배포 수단으로 사용하며, S/MIME 이메일·전자서명 문서·타임스탬프·코드 서명의 기반 형식이다.

주요 기능:
- 데이터 암호화 (기밀성)
- 전자 서명 (무결성·송신자 인증·부인 방지)
- 메시지 인증 코드(MAC) (무결성)
- 키 교환·키 관리 (수신자별 콘텐츠 암호화 키 전달)

OpenSSL CLI로 다루는 방법은 [[openssl-cms]] 참고.

---

## 2. 콘텐츠 타입

최외곽 `ContentInfo`가 타입 OID와 내용을 감싼다. 타입은 중첩할 수 있으며 §2.8에서 조합을 설명한다. 각 타입의 보호 범위는 다음과 같다.

| 타입 | 기밀성 | 무결성 확인 | 전자서명 |
|---|---|---|---|
| data | 없음 | 없음 | 없음 |
| SignedData | 없음 | 서명으로 검증 | 있음 |
| EnvelopedData | 있음 | 타입 자체의 별도 인증값 없음 | 없음 |
| DigestedData | 없음 | 해시 비교. 공격자가 함께 바꾸면 탐지 불가 | 없음 |
| EncryptedData | 있음 | 타입 자체의 별도 인증값 없음 | 없음 |
| AuthenticatedData | 없음 | MAC으로 검증 | 없음 |
| AuthEnvelopedData | 있음 | AEAD 태그로 검증 | 없음 |

MAC·AEAD의 검증 성공만으로 특정 개인의 신원이나 부인 방지가 보장되는 것은 아니다. 키를 공유하거나 수신자 자신이 인증값을 만들 수 있는 경우를 고려해야 한다.

```
ContentInfo ::= SEQUENCE {
    contentType ContentType,
    content [0] EXPLICIT ANY DEFINED BY contentType }
```

### 2.1. data

OID `1.2.840.113549.1.7.1`. 내부 구조가 없는 임의 옥텟 문자열이며 해석은 응용에 맡긴다(RFC 5652 §4). 단독으로 쓰이기보다 다른 타입의 `encapContentInfo`·`encryptedContentInfo` 안에서 원문을 운반하는 최내곽 타입으로 쓰인다. S/MIME에서는 MIME 엔티티가 여기 담긴다.

### 2.2. SignedData

OID `1.2.840.113549.1.7.2`. 임의 개수의 서명자가 콘텐츠에 전자 서명한 구조다.

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
| `encapContentInfo` | 원본 데이터. Detached 서명이면 내부 `eContent`만 생략[^1] |
| `certificates` | 검증용 X.509 인증서 (체인 포함 가능) |
| `crls` | 인증서 폐기 정보 |
| `signerInfos` | 서명자별 SignerInfo 집합: 다중 서명 지원 |

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
| `sid` | 서명자 인증서 식별: `IssuerAndSerialNumber` 또는 `SubjectKeyIdentifier` |
| `signedAttrs` | 서명 대상 속성: 콘텐츠 타입, 메시지 해시(messageDigest), 서명 시간 등 |
| `signature` | `signedAttrs`(없으면 콘텐츠 해시)에 대한 서명 값 |
| `unsignedAttrs` | 서명에 포함되지 않는 속성: 대표적으로 타임스탬프 토큰 |

사용처
- S/MIME 서명 메일, 전자서명 문서(CAdES), 코드 서명(Windows Authenticode, JAR 서명)
- RFC 3161 타임스탬프 토큰(`TimeStampToken`)의 컨테이너 ([[timestamp-token]])
- certs-only 메시지: 서명 없이 `certificates`만 채운 퇴화(degenerate) 형태로 인증서 체인 배포에 사용. `.p7b`/`.p7c` 파일이 이것 ([[openssl-pkcs12]]의 인증서 번들과 비교)

#### 2.2.1. Detached 서명

`encapContentInfo` 내부의 `eContent`를 생략하면 원본과 서명이 분리된 detached signature가 된다. 대용량 원본(PDF 등)에 효율적이며, 원본을 별도 보관·전송하고 서명만 유통할 수 있다. 검증 시에는 원본을 외부에서 제공해야 한다.

사용처: PDF 전자서명, 코드 서명, 대용량 파일·펌웨어 서명. [[openssl-cms]]의 `-sign`(기본 detached) / `-nodetach` 옵션이 이 구분이다.

### 2.3. EnvelopedData

OID `1.2.840.113549.1.7.3`. 대칭키(Content Encryption Key, CEK)로 콘텐츠를 암호화하고, CEK를 수신자별 방식(§4)으로 보호해 함께 전달하는 하이브리드 암호화 구조.

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
| `recipientInfos` | 수신자별로 보호된 CEK 목록: 다중 수신자 지원 |
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
| `contentEncryptionAlgorithm` | 콘텐츠 암호화 알고리즘 + 파라미터(IV 등): AES-128/256-CBC 등 |
| `encryptedContent` | CEK로 암호화된 콘텐츠. 생략 시 암호문을 외부에서 별도 전달 |

사용처: S/MIME 암호화 메일, 기관 간 파일 암호화 전달(수신자 인증서 기반), CMP·EST 등 인증서 관리 프로토콜의 페이로드 보호. 신규 설계는 AEAD를 쓰는 AuthEnvelopedData(2.7)가 권장된다.

### 2.4. DigestedData

OID `1.2.840.113549.1.7.5`. 콘텐츠와 그 해시를 함께 담는다.

```
DigestedData ::= SEQUENCE {
    version CMSVersion,
    digestAlgorithm DigestAlgorithmIdentifier,
    encapContentInfo EncapsulatedContentInfo,
    digest Digest }
```

| 필드 | 설명 |
|---|---|
| `digestAlgorithm` | 해시 알고리즘 (SHA-256 등) |
| `encapContentInfo` | 원본 콘텐츠 |
| `digest` | `eContent`에 대한 해시 값 |

서명·키가 없어 누구나 해시를 재계산할 수 있으므로 단독으로는 변조를 막지 못한다. RFC 5652 §7이 제시하는 전형적 용도는 DigestedData를 EnvelopedData의 콘텐츠로 넣어, 암호화된 콘텐츠에 무결성 확인 수단을 더하는 것이다.

### 2.5. EncryptedData

OID `1.2.840.113549.1.7.6`. `RecipientInfo` 없이 암호화된 콘텐츠만 담는다.

```
EncryptedData ::= SEQUENCE {
    version CMSVersion,
    encryptedContentInfo EncryptedContentInfo,
    unprotectedAttrs [1] IMPLICIT UnprotectedAttributes OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `encryptedContentInfo` | 암호화된 콘텐츠 + 알고리즘 (구조는 2.3과 동일) |
| `unprotectedAttrs` | 암호화되지 않는 메타데이터 |

키 관리는 규격 밖의 수단으로 해결한다는 전제다(RFC 5652 §8). PKCS#12(.p12/.pfx)가 패스워드 유도 키로 내용물을 보호할 때 이 구조를 쓴다([[openssl-pkcs12]]).

### 2.6. AuthenticatedData

OID `1.2.840.113549.1.9.16.1.2`. 콘텐츠에 MAC을 붙여 무결성을 보장한다.

```
AuthenticatedData ::= SEQUENCE {
    version CMSVersion,
    originatorInfo [0] IMPLICIT OriginatorInfo OPTIONAL,
    recipientInfos RecipientInfos,
    macAlgorithm MessageAuthenticationCodeAlgorithm,
    digestAlgorithm [1] DigestAlgorithmIdentifier OPTIONAL,
    encapContentInfo EncapsulatedContentInfo,
    authAttrs [2] IMPLICIT AuthAttributes OPTIONAL,
    mac MessageAuthenticationCode,
    unauthAttrs [3] IMPLICIT UnauthAttributes OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `recipientInfos` | 수신자별로 보호된 MAC 키 (§4 방식) |
| `macAlgorithm` | MAC 알고리즘 (HMAC-SHA256 등) |
| `digestAlgorithm` | `authAttrs`가 있을 때 콘텐츠 해시용. `authAttrs`가 있으면 필수 |
| `authAttrs` | MAC 대상 속성. 있으면 content-type·message-digest 속성 필수 |
| `mac` | `authAttrs`의 DER 인코딩(없으면 콘텐츠)에 대한 MAC 값 |
| `unauthAttrs` | MAC에 포함되지 않는 속성 |

송신자는 MAC 키를 무작위로 생성해 수신자별로 보호해 전달한다. 콘텐츠를 암호화하지 않고 MAC으로 무결성을 검증한다. 같은 MAC 키를 가진 수신자도 인증값을 만들 수 있으므로 전자서명과 같은 부인 방지를 제공하지 않는다.

### 2.7. AuthEnvelopedData

OID `1.2.840.113549.1.9.16.1.23` (RFC 5083). EnvelopedData의 암호화를 AEAD(Authenticated Encryption with Associated Data)로 바꿔 기밀성과 무결성을 한 번에 제공한다.

```
AuthEnvelopedData ::= SEQUENCE {
    version CMSVersion,
    originatorInfo [0] IMPLICIT OriginatorInfo OPTIONAL,
    recipientInfos RecipientInfos,
    authEncryptedContentInfo EncryptedContentInfo,
    authAttrs [1] IMPLICIT AuthAttributes OPTIONAL,
    mac MessageAuthenticationCode,
    unauthAttrs [2] IMPLICIT UnauthAttributes OPTIONAL }
```

| 필드 | 설명 |
|---|---|
| `recipientInfos` | 수신자별로 보호된 CEK (2.3과 동일) |
| `authEncryptedContentInfo` | AEAD 알고리즘 + 파라미터(nonce 등) + 암호문 |
| `authAttrs` | 암호화되지 않지만 AAD로 인증되는 속성 |
| `mac` | AEAD 인증 태그 |
| `unauthAttrs` | 인증되지 않는 속성 |

알고리즘은 AES-GCM/CCM(RFC 5084)과 ChaCha20-Poly1305(RFC 8103)가 정의되어 있다. S/MIME 4.0(RFC 8551)의 암호화 메일이 이 타입을 사용하며, 신규 설계에서 EnvelopedData 대신 권장된다.

### 2.8. 중첩

PKCS#7의 `SignedAndEnvelopedData` 타입은 CMS에서 중첩(nesting)으로 대체되었다. SignedData의 콘텐츠 자리에 EnvelopedData를 넣거나(암호화 후 서명), EnvelopedData의 콘텐츠로 SignedData를 넣어(서명 후 암호화) 특정 수신자만 원문 확인·서명 검증이 가능한 메시지를 구성한다. 일반적으로 서명 후 암호화가 권장된다. S/MIME의 서명+암호화 메일이 이 구성이다.

중첩은 한 타입의 콘텐츠 자리(`encapContentInfo` / `encryptedContentInfo`)에 다른 CMS 타입을 넣고, 그 타입 OID(`eContentType` / `contentType`)로 내부 타입을 표시하는 방식이다.

서명 후 암호화 (권장): 서명자 신원과 서명 값까지 암호화되어 은닉됨:

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

수신자는 CEK를 복호해 SignedData를 복원한 뒤 서명을 검증한다.

암호화 후 서명: 서명이 노출되어 누가 보냈는지 제3자가 확인 가능. 서명자가 암호문 내용을 모른 채 서명했을 수 있다는 문제(원문 소유 증명 불가)가 있다:

```
ContentInfo (signed-data)
└─ SignedData
   ├─ encapContentInfo (eContentType: enveloped-data)
   │  └─ EnvelopedData          — 원문 암호화
   └─ signerInfos               — 암호문에 대한 서명
```

중첩 깊이에 제한은 없으며, S/MIME은 서명, 암호화, 서명 순으로 감싸는 3중 래핑(triple wrapping, RFC 2634)도 정의한다.

---

## 3. 수신 처리

타입별로 복호화와 검증 절차가 다르다. 서명값 검증과 인증서 신뢰성 검증은 별도 판단이며, 둘을 모두 충족해야 신뢰하는 서명자의 메시지로 수용할 수 있다.

### 3.1. 인증서 검증

CMS 자체는 인증서 검증 절차를 정의하지 않으며, 공개키의 선택·검증은 X.509 경로 검증(RFC 5280) 등 외부 절차에 따른다 (RFC 5652 §5.6):
- 신뢰 앵커(루트 CA)까지 체인 구성 및 각 인증서의 서명 검증
- 유효기간 확인
- 폐기 여부 확인 (CRL/OCSP)
- 키 용도(Key Usage) 확인: 서명 검증은 digitalSignature/nonRepudiation, 키 전달은 keyEncipherment 등

### 3.2. SignedData 검증

1. `sid`로 서명자 인증서를 식별(보통 `certificates` 필드에서)하고 인증서 검증 후 공개키 획득
2. `digestAlgorithm`으로 콘텐츠(`eContent` 옥텟, detached면 외부 원본) 해시 재계산: 송신자가 계산한 해시 값에 의존해서는 안 됨(MUST NOT)
3. `signedAttrs`가 있으면:
   - `message-digest` 속성 값 = 재계산한 콘텐츠 해시인지 확인
   - `content-type` 속성 값 = `eContentType`인지 확인
   - `signedAttrs`의 DER 인코딩을 서명 알고리즘에 맞게 검증. 해시 입력에는 전송 필드의 IMPLICIT `[0]` 태그 대신 ASN.1 `SET OF` 태그와 길이·내용을 사용
4. `signedAttrs`가 없으면 콘텐츠 해시가 곧 서명 검증 입력
5. 공개키로 `signature` 값 검증

### 3.3. EnvelopedData 복호화

EnvelopedData에는 서명·MAC이 없어 무결성·송신자 인증을 제공하지 않는다. 수신 처리는 검증이 아닌 복호화다:
1. `recipientInfos`에서 자신의 인증서(issuer+serial 또는 SubjectKeyIdentifier)와 일치하는 RecipientInfo 식별
2. 방식별로 CEK 복원: 개인키로 복호(키 전달), 키 합의로 KEK 유도 후 복호 등
3. CEK로 `encryptedContent` 복호화

복호화 성공이 무결성을 보장하지 않으며(CBC 패딩은 변조 탐지 수단이 아님), 무결성·인증이 필요하면 SignedData 중첩(2.8)이나 `auth-enveloped-data`를 사용한다.

### 3.4. AuthEnvelopedData 검증

복호화와 AEAD 태그 검증을 수행하며, 검증에 실패하면 평문을 사용하지 않고 파기한다. RFC 5083 §2의 요구사항이다. 인증되지 않는 속성인 `unauthAttrs`는 별도 정책 없이 신뢰하지 않는다.

### 3.5. DigestedData 검증

콘텐츠 해시를 독립적으로 재계산해 `digest`와 비교한다. 해시와 원문을 함께 변조할 수 있는 공격자에 대한 인증 수단은 아니다.

### 3.6. AuthenticatedData 검증

`recipientInfos`로 MAC 키를 복원하고 MAC을 재계산해 `mac`과 비교한다. `authAttrs`가 있으면 콘텐츠의 message-digest와 content-type도 검사한다. MAC 키를 공유하는 당사자 사이에서 누가 생성했는지 구분할 수 없다는 점에 주의한다.

### 3.7. EncryptedData 복호화

규격 밖에서 얻은 키로 콘텐츠를 복호화한다. EncryptedData 자체에는 서명이나 MAC 검증 요소가 없다.

---

## 4. RecipientInfo

| 타입 | 방식 | 규격 |
|---|---|---|
| `KeyTransRecipientInfo` | 수신자 RSA 공개키로 CEK 암호화 (전통적) | RFC 5652 |
| `KeyAgreeRecipientInfo` | (EC)DH 키 합의로 KEK 유도 | RFC 5652 |
| `KEKRecipientInfo` | 사전 공유 대칭 KEK | RFC 5652 |
| `PasswordRecipientInfo` | 패스워드 유도 키 | RFC 3211 |
| `OtherRecipientInfo` | 확장점 | RFC 5652 |
| `KEMRecipientInfo` | KEM 공유 비밀 → KDF → KEK | RFC 9629 (5652 갱신) |

`KEMRecipientInfo`(2024)는 PQC(Post-Quantum Cryptography) 대비 확장으로, RSA-KEM(RFC 9690)·ML-KEM(RFC 9936)의 CMS 적용 기반이다.

---

## 5. 관련 규격

### 5.1. 계보

| 규격 | 연도 | 내용 |
|---|---|---|
| PKCS#7 v1.5 (RFC 2315) | 1998 | RSA 사의 원형 규격 |
| RFC 2630 | 1999 | IETF가 CMS로 표준화 (S/MIME v3 기반) |
| RFC 3369 / 3370 | 2002 | 메시지 구문과 알고리즘 규격 분리 (3370 = CMS Algorithms) |
| RFC 3852 | 2004 | RecipientInfo 확장 등 |
| RFC 5652 | 2009 | 현행 (STD 70) |

하위 호환이 유지되어 PKCS#7 v1.5 메시지를 CMS 구현이 처리할 수 있다.

### 5.2. 알고리즘과 확장

| 규격 | 내용 |
|---|---|
| RFC 3370 | CMS 기본 알고리즘 (SHA-1, RSA, DSA, DH 등) |
| RFC 5754 | SHA-2 계열 서명 사용 |
| RFC 8419 | EdDSA(Ed25519/Ed448) 서명 사용 |
| RFC 5084 | AES-CCM/GCM (auth-enveloped-data용) |
| RFC 8933 | 서명 알고리즘 식별자 보호: 알고리즘 치환 공격 대응 |

### 5.3. 상위 규격

- S/MIME: 이메일 서명·암호화. v2(RFC 2311), v3(2633), v3.1(3851), v3.2(5751)를 거쳐 현재 v4.0(RFC 8551)
- RFC 3161 TSP: 타임스탬프 프로토콜. `TimeStampToken`이 SignedData 구조이며 TSA가 서명 ([[timestamp-token]])
- CAdES (RFC 5126): 장기 검증(LTV)을 위한 확장 전자서명 프로파일
- 기타: 펌웨어 서명(RFC 4108), EST 인증서 등록(RFC 7030)

---

## Sources

- `raw/crypto/CMS.md`
- [RFC 5652: Cryptographic Message Syntax](https://datatracker.ietf.org/doc/html/rfc5652)
- [RFC 5083: CMS Authenticated-Enveloped-Data](https://www.rfc-editor.org/rfc/rfc5083)
- [RFC 5084: AES-CCM and AES-GCM in CMS](https://www.rfc-editor.org/rfc/rfc5084)
- [RFC 8103: ChaCha20-Poly1305 in CMS](https://www.rfc-editor.org/rfc/rfc8103)
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
- [[padding-oracle-attack]]

---

[^1]: `raw/crypto/CMS.md`는 "encapContentInfo가 없으면 Detached"로 서술하나, RFC 5652 §5.2에서 `encapContentInfo`는 필수 필드이며 `eContent`가 OPTIONAL이다. RFC를 따름.
