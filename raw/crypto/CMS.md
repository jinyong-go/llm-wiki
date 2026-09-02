## **CMS (Cryptographic Message Syntax)** 

전자 서명, 암호화, 인증 및 데이터 무결성을 제공하는 pkcs#7 기반 암호화 메시지 포맷.. IETF 표준방식(*RFC 5652) 

RFC 2315(PKCS#7 ver1.5) -> RFC 2630 -> RFC 3369 -> RFC 5652 

## **CMS 주요 기능** 

- 데이터 암호화(기밀성 제공) 

- 전자 서명 (무결성 및 인증) 

- 메시지 인증 코드(MAC) (데이터 무결성 보장) 

- 키 교환 및 키 관리(보안 통신) 

## **CMS 데이터 형식** 

CMS는 ASN.1 인코딩 사용, DER / BER 형식 사용 

- Data : 단순 데이터(서명 및 암호화 없음) 

- Signed-data : 전자 서명(송신자 인증 및 무결성) 

- Enveloped-Data : 암호화된 메시지 (기밀성) 

- Digested-Data : 해시값 포함 (데이터 변조 방지) 

- Encrypted-Data : 암호화된 데이터(수신자 정보 없음) 

- Authenticated-Data : MAC(데이터 무결성) 

## **Signed-data** 

디지털 서명이 포함된 CMS 데이터. 

```
SignedData ::= SEQUENCE {
        version CMSVersion,
        digestAlgorithms DigestAlgorithmIdentifiers,
        encapContentInfo EncapsulatedContentInfo,
        certificates [0] IMPLICIT CertificateSet OPTIONAL,
        crls [1] IMPLICIT RevocationInfoChoices OPTIONAL,
        signerInfos SignerInfos
}
```

version à CMS 버전 

digestAlgorithms à 해시 알고리즘(SHA-256, SHA-512 등) encapContentInfo à 원본 데이터(Detached 서명인 경우 생략) certificates à X.509 인증서 

crls à 인증서 폐기 목록(CRL) signerInfos à 서명자 정보(서명 값, 서명 알고리즘, 인증서 정보 등) 

```
SignerInfo ::= SEQUENCE {
    version CMSVersion,
    sid SignerIdentifier,
    digestAlgorithm DigestAlgorithmIdentifier,
    signedAttrs [0] IMPLICIT Attributes OPTIONAL,
    signatureAlgorithm SignatureAlgorithmIdentifier,
    signature SignatureValue,
    unsignedAttrs [1] IMPLICIT Attributes OPTIONAL
}
```

version à CMS 버전 

sid à 서명자의 인증서 정보(IssuerAndSerialNumber, SubjectKeyIdentifier) 

digestAlgorithm à 해시 알고리즘 

signedAttrs à 서명 속성(데이터 타입, 서명 시간, CMS 알고리즘 보안 속성, 메시지 해시값) signatureAlgorithm à 서명 알고리즘 

signature à 서명 값 

unsignedAttrs à 비 서명 속성(타임스탬프) 

## **Detached-signed-data** 

Signed-data의 원본 데이터(encapContentInfo)와 서명(signerInfos)이 분리 되어 있는 데이터 원본 데이터가 큰 경우(PDF 등) 효율적이고 원본 데이터가 없으니 데이터 무결성 및 원본 데이터 유지 가 가능 

encapContentInfo 이 없으면 Detached-signed-data 

`SignedData ::=` **`SEQUENCE`** `{ version CMSVersion, digestAlgorithms DigestAlgorithmIdentifiers, encapContentInfo EncapsulatedContentInfo, --` 비어 있음 `(Detached) certificates [0]` **`IMPLICIT`** `CertificateSet` **`OPTIONAL`** `, crls [1]` **`IMPLICIT`** `RevocationInfoChoices` **`OPTIONAL`** `, signerInfos SignerInfos }` 

## **Enveloped-Data** 

수신자를 지정하여 암호화된 데이터를 포함하는 형식. 

비대칭키 암호화(RSA, ECC)와 대칭키 암호화(AES, 3DES 등)을 함께 사용. 

정보를 수신자만 확인할 수 있게 데이터를 대칭키로 암호화하고 대칭키를 수신자의 공개키로 암호화하 여 암호화된 정보와 함께 전달 

*Signed-and-enveloped-data는 Signed-data의 encapContentInfo 항목을 암호화하여 특정 수신자만 원 문 메시지를 확인하고 서명을 검증할 수 있게 합니다. 

```
EnvelopedData ::= SEQUENCE {
    version CMSVersion,
    originatorInfo [0] IMPLICIT OriginatorInfo OPTIONAL,
    recipientInfos RecipientInfos,
    encryptedContentInfo EncryptedContentInfo,
    unprotectedAttrs [1] IMPLICIT Attributes OPTIONAL
}
```

## version à CMS 버전 

originatorInfo à 송신자 정보 (송신자의 인증서 포함 가능, 선택적) recipientInfos à 수신자 정보 목록 (각 수신자의 공개키로 암호화된 대칭키 포함) encryptedContentInfo à 암호화된 메시지 데이터 및 암호화 알고리즘 정보 unprotectedAttrs à 보호되지 않은 속성(문서 식별자, 타임스탬프 등 메타데이터) 

## **Digested-Data** 

메시지 무결성을 보장하기 위한 해시(Hash) 값을 포함하는 형식. 서명 값 X 

```
DigestedData ::= SEQUENCE {
  version CMSVersion,
digestAlgorithm DigestAlgorithmIdentifier,
  encapContentInfo EncapsulatedContentInfo,
digest Digest
  }
```

## version à CMS 버전 

digestAlgorithm à 해시 알고리즘 (SHA-256, SHA-512 등) encapContentInfo à 원본 데이터 digest à 해시 값 

## **Encrypted-Data** 

수신자 정보를 포함하지 않고 데이터만 암호화 하는 방식. RecipientInfo X 

```
EncryptedData ::= SEQUENCE {
  version CMSVersion,
  encryptedContentInfo EncryptedContentInfo,
  unprotectedAttrs [1] IMPLICIT UnprotectedAttributes OPTIONAL }
```

## version à CMS 버전 

encryptedContentInfoà 암호화된 데이터 및 알고리즘 정보 unprotectedAttrsà 보호되지 않은 속성(문서 식별자, 타임스탬프 등 메타데이터) 

## **Authenticated-Data** 

AuthenticatedData는 MAC을 포함 하여 데이터가 변조되지 않았음을 검증하는 형식 

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

## version à CMS 버전 

originatorInfo à송신자 정보 recipientInfos à MAC 키를 복호화 할 수 있는 수신자 정보 macAlgorithm à 사용된 MAC 알고리즘 (HMAC-SHA256, GMAC 등) digestAlgorithm à HMAC과 함께 사용할 해시 알고리즘 encapContentInfo à 인증할 데이터 및 컨텐츠 유형 authAttrs à MAC 생성 시 포함된 서명된 속성 (messageDigest, Timestamp 등) mac à 메시지 인증 코드 unauthAttrs à 서명되지 않은 추가 속성 (타임스탬프 등) 

