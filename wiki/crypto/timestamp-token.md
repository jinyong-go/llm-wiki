---
title: 타임스탬프 토큰 (Time-Stamp Token)
updated: 2026-07-14 11:44:34
tags:
  - crypto
  - pki
  - timestamp
  - cms
---

## 1. 개요

타임스탬프 토큰(TST, Time-Stamp Token)은 특정 데이터가 특정 시점에 존재했음(proof-of-existence)을 신뢰된 제3자인 **TSA(Time Stamping Authority)**가 서명으로 증명하는 데이터 구조다. **RFC 3161 TSP(Time-Stamp Protocol)**에서 정의되며, 토큰 자체는 [[cms]] `SignedData` 구조다.

클라이언트는 원본이 아닌 **해시만** TSA에 전송하므로 원본 데이터가 노출되지 않는다. TSA는 해시에 신뢰 시각을 결합해 서명하며, 이후 누구든 토큰 서명을 검증해 "이 해시(=데이터)가 이 시각에 존재했다"를 확인할 수 있다.

---

## 2. 용도

- **전자서명 장기 검증(LTV, Long-Term Validation)** — 서명 값에 타임스탬프(signature-time-stamp)를 받아 두면, 이후 서명자 인증서가 만료·폐기되어도 "서명이 인증서 유효 기간 내에 생성되었음"을 증명할 수 있다. CAdES(RFC 5126)·PAdES 확장 전자서명 프로파일의 핵심 요소다.
- **코드 서명** — 실행 파일·JAR 서명에 타임스탬프를 결합하면 서명자 인증서 만료 후에도 서명의 유효성이 유지된다. 타임스탬프가 없으면 인증서 만료와 함께 서명 검증이 실패한다.
- **존재 증명·부인 방지 보강** — 문서·로그·거래 기록이 특정 시점 이전에 존재했음을 제3자가 증명. 전자문서 보관, 특허·저작권 선행성 입증 등에 사용된다.
- **토큰 자체의 갱신(renewal)** — 토큰 서명에 사용된 알고리즘이 약화되기 전에 기존 토큰을 새 토큰으로 다시 타임스탬프하여 증명력을 연장할 수 있다 (RFC 3161 §4).

---

## 3. 프로토콜 (TSP)

요청-응답 구조. 클라이언트가 `TimeStampReq`를 보내고 TSA가 `TimeStampResp`를 반환한다.

### 3.1. TimeStampReq

```
TimeStampReq ::= SEQUENCE {
    version        INTEGER { v1(1) },
    messageImprint MessageImprint,
    reqPolicy      TSAPolicyId          OPTIONAL,
    nonce          INTEGER              OPTIONAL,
    certReq        BOOLEAN DEFAULT FALSE,
    extensions     [0] IMPLICIT Extensions OPTIONAL }

MessageImprint ::= SEQUENCE {
    hashAlgorithm  AlgorithmIdentifier,
    hashedMessage  OCTET STRING }
```

- **version** — 요청 형식의 버전. 현재 v1만 정의되어 있다.
- **messageImprint** — 타임스탬프 대상 데이터의 해시 알고리즘 OID와 해시 값. TSA는 원본을 보지 않고 해시 길이가 알고리즘과 일치하는지만 검사한다. 해시 알고리즘은 충돌 저항성이 있는 것을 사용해야 한다.
- **reqPolicy** — 토큰 발급에 적용을 요청하는 **TSA 정책의 OID**. TSA 정책은 토큰이 어떤 조건·운영 기준 하에 발급되는지를 정의하는 문서로, 토큰 사용 조건, 감사 로그 가용성, 보장하는 시간 정확도 수준 등을 포함할 수 있다. 클라이언트가 특정 정책을 지정하면 TSA는 반드시 그 정책으로 발급해야 하며, 지원하지 않으면 `unacceptedPolicy` 오류를 반환해야 한다(MUST). 생략하면 TSA의 기본 정책이 적용된다.
- **nonce** — 클라이언트가 생성하는 대형 난수. TSA는 응답 토큰에 같은 값을 반드시 되돌려줘야 하며, 클라이언트는 이를 비교해 응답이 자신의 요청에 대한 최신 응답인지(재전송 공격 여부) 확인한다. 로컬 시계 없이 응답 적시성을 검증하는 수단이다.
- **certReq** — true면 TSA가 서명에 사용한 인증서(SigningCertificate 속성의 ESSCertID가 가리키는 인증서)를 응답 SignedData의 `certificates` 필드에 포함해야 한다. false/생략이면 포함하지 않으며, 검증자는 인증서를 다른 경로로 확보해야 한다.
- **extensions** — 향후 확장을 위한 필드. TSA가 인식하지 못하는 확장이 있으면 (critical 여부와 무관하게) 토큰을 발급하지 않고 `unacceptedExtension` 오류를 반환해야 한다.

### 3.2. TimeStampResp

```
TimeStampResp ::= SEQUENCE {
    status         PKIStatusInfo,
    timeStampToken TimeStampToken OPTIONAL }

PKIStatusInfo ::= SEQUENCE {
    status       PKIStatus,
    statusString PKIFreeText     OPTIONAL,
    failInfo     PKIFailureInfo  OPTIONAL }
```

`PKIStatusInfo`는 [[cmp]](RFC 2510)에서 가져온 구조다. `status` 값:

- **granted(0)** — 요청한 그대로 토큰이 발급됨. `timeStampToken` 필드가 존재한다.
- **grantedWithMods(1)** — 토큰이 발급되었으나 요청 내용에 **수정(modification)이 가해짐**. `timeStampToken` 필드가 존재한다. granted와의 차이는 "요청한 대로(as requested)"인지 "수정을 거쳐(with modifications)"인지이며, 클라이언트는 수정 내용이 수용 가능한지 판단해야 한다. RFC 3161은 구체적인 수정 사례를 명시하지 않는다[^1].
- **rejection(2)** — 발급 거부. 토큰이 없으며 `failInfo`에 사유가 표시된다.
- **waiting(3)** — 요청 접수 후 처리 대기 (비동기 폴링 시).
- **revocationWarning(4)** — TSA 인증서의 폐기가 임박했다는 경고.
- **revocationNotification(5)** — TSA 인증서가 폐기되었다는 통지.

토큰이 없는 응답(2 이상)에서 `failInfo`의 주요 값:

- `badAlg(0)` — 지원하지 않는 해시 알고리즘
- `badRequest(2)` — 허용되지 않거나 지원하지 않는 트랜잭션
- `badDataFormat(5)` — 데이터 형식 오류
- `timeNotAvailable(14)` — TSA 시간 소스 사용 불가
- `unacceptedPolicy(15)` — 요청한 정책 미지원
- `unacceptedExtension(16)` — 요청 확장 미지원
- `systemFailure(25)` — 시스템 오류

[^1]: grantedWithMods가 반환되는 구체적 상황(예: 다른 정책으로 대체 발급)은 RFC에 명시가 없으며 구현·정책에 따른다.

---

## 4. 토큰 구조

`TimeStampToken`은 CMS `ContentInfo`(signed-data)이며, 서명 대상 콘텐츠(`eContent`)의 타입이 `id-ct-TSTInfo`(1.2.840.113549.1.9.16.1.4)인 `TSTInfo`다.

```
TimeStampToken ::= ContentInfo        -- SignedData
  └─ eContentType: id-ct-TSTInfo
  └─ eContent: TSTInfo

TSTInfo ::= SEQUENCE {
    version        INTEGER { v1(1) },
    policy         TSAPolicyId,
    messageImprint MessageImprint,
    serialNumber   INTEGER,
    genTime        GeneralizedTime,
    accuracy       Accuracy             OPTIONAL,
    ordering       BOOLEAN DEFAULT FALSE,
    nonce          INTEGER              OPTIONAL,
    tsa            [0] GeneralName      OPTIONAL,
    extensions     [1] IMPLICIT Extensions OPTIONAL }

Accuracy ::= SEQUENCE {
    seconds INTEGER              OPTIONAL,
    millis  [0] INTEGER (1..999) OPTIONAL,
    micros  [1] INTEGER (1..999) OPTIONAL }
```

- **version** — 토큰 형식의 버전. 현재 v1.
- **policy** — 토큰 발급에 실제 적용된 TSA 정책 OID (필수). 요청에 `reqPolicy`가 있었다면 반드시 같은 값이어야 한다.
- **messageImprint** — 요청의 `messageImprint`와 동일한 값이어야 한다. 검증자는 이 해시를 원본에서 재계산한 해시와 비교한다.
- **serialNumber** — TSA가 토큰마다 부여하는 정수. 동일 TSA가 발급한 모든 토큰에서 유일해야 하며(MUST), **TSA 이름 + serialNumber 조합이 토큰의 고유 식별자**가 된다. 시스템 중단·재기동 후에도 유일성이 유지되어야 한다.
- **genTime** — 토큰 생성 시각. UTC 기준 GeneralizedTime(`YYYYMMDDhhmmss[.s...]Z`)으로, 초 단위는 필수이고 필요 시 소수점 이하 초까지 표현 가능하다. DER 규칙상 반드시 `Z`로 끝나고 소수부의 후행 0은 생략해야 한다 (예: `19990609001326.34352Z`).
- **accuracy** — genTime의 오차 범위. 실제 생성 시각은 **[genTime − accuracy, genTime + accuracy]** 구간에 있음을 보장한다. seconds + millis + micros의 합으로 표현한다 (예: seconds=2, millis=500 → ±2.5초). 이 필드가 없으면 정확도는 다른 수단(예: 해당 TSA 정책 문서)으로 확인해야 한다.
- **ordering** —
    - **false(기본)**: genTime은 생성 시각만 나타내며 토큰 간 순서를 보장하지 않는다. 서로 다른 두 토큰의 선후는 두 genTime의 차이가 **두 accuracy의 합보다 클 때만** 판정할 수 있다.
    - **true**: 동일 TSA가 발급한 토큰끼리는 accuracy와 무관하게 **genTime 값만으로 항상 시간순 정렬이 가능**함을 TSA가 보장한다.
- **nonce** — 요청에 nonce가 있었으면 반드시 같은 값을 포함해야 한다.
- **tsa** — TSA 이름의 힌트(선택). 존재하면 토큰 검증에 사용될 인증서의 subject 이름 중 하나와 일치해야 한다. 실제 TSA 식별·검증은 SignerInfo의 SigningCertificate 속성(ESSCertID)으로 수행되므로 이 필드는 보조 수단이다.
- **extensions** — 요청에서 클라이언트가 요구한 확장만 포함할 수 있다.

TSA의 `SignerInfo`에는 서명자 인증서를 식별하는 **SigningCertificate(ESSCertID, SHA-1)** 속성이 필수였으나, RFC 5816이 SHA-1 외 해시를 허용하는 **SigningCertificateV2(ESSCertIDv2)**를 추가했다. SHA-1이 아닌 해시를 쓰면 V2를 사용해야 한다(MUST).

---

## 5. 검증

1. 응답 `status` 확인
2. 토큰의 `messageImprint`가 요청(또는 원본 재계산 해시)과 일치하는지 확인
3. 요청에 nonce를 넣었으면 토큰의 nonce와 일치 확인
4. CMS SignedData 서명 검증 ([[cms]] 5.2와 동일) + ESSCertID(v2)로 TSA 인증서 일치 확인
5. TSA 인증서 검증 — 경로 검증([[x509-certificate]]), 폐기 확인([[certificate-revocation]])
6. `policy`가 응용에서 수용 가능한지 확인

---

## 6. 기타

### 6.1. TSA 인증서 요구사항

- 타임스탬프 **전용 키**로 서명해야 한다
- 인증서에 ExtendedKeyUsage 확장이 **critical**로 존재하고, KeyPurposeId는 `id-kp-timeStamping`(1.3.6.1.5.5.7.3.8) **하나만** 포함해야 한다

### 6.2. 전송

| 방식   | 규약                                                                                     |
| ---- | -------------------------------------------------------------------------------------- |
| HTTP | `Content-Type: application/timestamp-query` / `application/timestamp-reply`, body는 DER |
| 파일   | DER 그대로 저장 — 확장자 `.tsq`(요청) / `.tsr`(응답)                                               |
| TCP  | 포트 318, 길이+플래그 프레이밍 (실사용 드묾)[^2]                                                       |

OpenSSL CLI 사용법은 [[openssl-ts]] 참고.

[^2]: "실사용 드묾"은 추론임. 현재 공개 TSA는 대부분 HTTP를 사용한다.

---

## Sources
- `raw/crypto/CMS.md`
- [RFC 3161: Time-Stamp Protocol (TSP)](https://www.rfc-editor.org/rfc/rfc3161)
- [RFC 5816: ESSCertIDv2 Update for RFC 3161](https://www.rfc-editor.org/rfc/rfc5816)

---

## Related pages
- [[openssl-ts]]
- [[cms]]
- [[x509-certificate]]
- [[certificate-revocation]]
- [[cmp]]
