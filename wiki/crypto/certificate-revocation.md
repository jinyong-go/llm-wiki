---
title: 인증서 폐기 — 사유·CRL·OCSP
updated: 2026-07-14 14:28:58
tags:
  - crypto
  - pki
  - x509
  - revocation
  - crl
  - ocsp
---

## 1. 개요

**인증서 폐기(revocation)** 는 유효기간이 남은 인증서를 **만료 전에 무효화**하는 것이다. 키 유출, 오발급, 소속 변경, CA 손상 등으로 더는 신뢰할 수 없을 때 필요하다. 서명·유효기간만으로는 이를 알 수 없으므로, 검증자는 **폐기 정보(사유·시각)** 를 별도로 조회한다.

폐기 정보 자체(§2)는 전달 방식과 무관하며, 이를 검증자에게 전달하는 표준 방식이 **CRL**(Certificate Revocation List)과 **OCSP**(Online Certificate Status Protocol)다.

---

## 2. 폐기 정보와 특성

폐기된 인증서에는 **폐기 시각**과 **사유(reasonCode)** 가 따른다. 이 값들은 CRL 엔트리(`crlEntryExtensions`)와 OCSP `revoked` 응답(`RevokedInfo`)에 **동일하게** 실린다(같은 `CRLReason` 열거형).

### 2.1. 폐기 사유 (CRLReason)
RFC 5280 §5.3.1에 정의된 값:

| 값 | 사유 | 의미 |
|---|---|---|
| 0 | unspecified | 미지정 |
| 1 | keyCompromise | 개인키 유출 |
| 2 | cACompromise | CA 키 유출 |
| 3 | affiliationChanged | 소속·정보 변경 |
| 4 | superseded | 재발급으로 대체됨 |
| 5 | cessationOfOperation | 운영 종료 |
| 6 | certificateHold | **일시 보류**(해제 가능) |
| 8 | removeFromCRL | 보류 해제(CRL에서 제거) |
| 9 | privilegeWithdrawn | 권한 회수 |
| 10 | aACompromise | 속성기관(AA) 키 유출 |

### 2.2. 특성
- **폐기는 원칙적으로 불가역** — 단 `certificateHold`(6)만 일시 보류이며 `removeFromCRL`(8)로 해제 가능.
- **폐기 시각(revocationDate/revocationTime)** — 이 시점 이후로 인증서를 신뢰하지 않는다.

---

## 3. 전달 방식 — CRL

**개념**: CA(또는 CRL 발급자)가 **폐기된 인증서 일련번호 목록**에 서명해 공개 저장소에 배포한다. 검증자는 CRL을 받아 대상 serial이 목록에 있는지 확인한다. 유효기간은 보통 24시간 이하.

**X.509 구조 (RFC 5280 §5)**
```
CertificateList ::= SEQUENCE {
    tbsCertList          TBSCertList,        -- 서명 대상
    signatureAlgorithm   AlgorithmIdentifier,
    signatureValue       BIT STRING }        -- CA 서명

TBSCertList ::= SEQUENCE {
    version, signature, issuer,
    thisUpdate           Time,               -- 발행 시각
    nextUpdate           Time OPTIONAL,       -- 다음 갱신 예정
    revokedCertificates  SEQUENCE OF SEQUENCE {
        userCertificate       CertificateSerialNumber,  -- 폐기된 serial
        revocationDate        Time,                     -- §2
        crlEntryExtensions    Extensions OPTIONAL       -- reasonCode(§2)
    } OPTIONAL,
    crlExtensions        [0] Extensions OPTIONAL }       -- CRL Number, AKI, IDP
```

**관련 확장·변형**
- **CRL Distribution Points(CRLDP)** — 인증서에 담기는 확장. CRL을 받을 URL을 가리킨다.
- **Delta CRL** — base CRL 이후 **변경분만** 담아 대역폭 절감(Freshest CRL 확장으로 위치 지정).
- **ARL(Authority Revocation List)** — **CA 인증서**만을 대상으로 한 CRL.

**장단점**
- 장점: 오프라인 검증(한 번 받아 캐시), 실시간 서버 불필요, 프라이버시 양호.
- 단점: 크기 증가(대형 CA는 수 MB), 최신성 지연(nextUpdate까지), 다운로드 비용.

---

## 4. 전달 방식 — OCSP

**개념**: 검증자가 **인증서 한 건의 상태**를 OCSP 응답자(responder)에 **실시간 질의**한다. 전체 목록 대신 단건이라 응답이 작고 최신이다(RFC 6960).

**요청/응답 구조**
```
OCSPRequest → CertID ::= SEQUENCE {
    hashAlgorithm    AlgorithmIdentifier,   -- SHA-1/SHA-256
    issuerNameHash   OCTET STRING,          -- 발급 CA 이름 해시
    issuerKeyHash    OCTET STRING,          -- 발급 CA 공개키 해시
    serialNumber     CertificateSerialNumber }

OCSPResponse → 서명된 CertStatus:
    good | revoked{ revocationTime, revocationReason(§2) } | unknown
    thisUpdate / nextUpdate,  nonce(재전송 방지, 선택)
```
- 응답은 **OCSP 응답자 개인키로 서명**된다(위임 인증서에 `id-kp-OCSPSigning` EKU).
- **AIA(Authority Information Access)** — 인증서에 담기는 확장. OCSP 응답자 URL을 가리킨다.

**OCSP Stapling** — 서버가 자기 인증서의 OCSP 응답을 **미리 받아 TLS 핸드셰이크에 첨부**(RFC 6066). 클라이언트가 CA에 직접 조회하지 않아 지연↓·프라이버시↑. **Must-Staple**(RFC 7633)은 stapled 응답을 필수로 강제해 soft-fail 우회를 막는다.

**장단점**
- 장점: 실시간·최신, 응답 경량, stapling으로 성능·프라이버시 개선.
- 단점: 응답자 가용성 의존, **프라이버시 문제**(비스테이플 시 CA가 방문 사이트·IP 인지), soft-fail로 보안 약화 가능.

---

## 5. CRL vs OCSP

| 항목 | CRL | OCSP |
|---|---|---|
| 방식 | 폐기 목록 일괄 배포 | 단건 실시간 질의 |
| 위치 확장 | CRL Distribution Points | AIA |
| 최신성 | nextUpdate까지 지연 | 실시간 |
| 크기 | 클 수 있음 | 작음 |
| 오프라인 | 가능(캐시) | 원칙적 온라인(스테이플 예외) |
| 프라이버시 | 양호 | 비스테이플 시 노출 |
| 실패 처리 | 목록 부재 시 판단 곤란 | soft-fail 우회 위험 |

---

## 6. 실무 동향

- **Let's Encrypt OCSP 종료(2025)** — 프라이버시 위험(응답자가 방문 이력 파악)을 이유로 OCSP를 접고 **CRL로 회귀**. Must-Staple 요청은 2025-01-30부터 실패 처리.
- **soft-fail 딜레마** — 브라우저는 가용성 때문에 폐기 조회 실패를 대체로 통과시켜, 공격자가 조회를 차단하면 폐기가 무력화될 수 있다. 보완책으로 **stapling+Must-Staple**, **CRLite**(브라우저 내장 압축 폐기 집합), **단명 인증서(short-lived)** 로 폐기 자체를 줄이는 방향이 확산.

> 구현(Java `PKIXRevocationChecker`·CertStore로 CRL/OCSP 검증)은 [[cert-path-validation]] §4.3, OpenSSL CLI는 [[openssl-crl]] 참조.

---

## 7. 요약
- 폐기는 만료 전 인증서를 무효화하는 것. **폐기 정보=사유(§2 reasonCode)+시각**이며 CRL·OCSP에 공통으로 실린다.
- **CRL**: 폐기 목록 배포(오프라인·프라이버시 양호, 크기·지연 단점).
- **OCSP**: 단건 실시간 질의(최신·경량, 응답자 의존·프라이버시 단점). Stapling/Must-Staple로 보완.
- 최신 흐름은 프라이버시·soft-fail 문제로 **CRL 회귀·CRLite·단명 인증서** 쪽.

---

## Sources
- RFC 5280 — X.509 Certificate and CRL Profile: https://datatracker.ietf.org/doc/html/rfc5280
- RFC 6960 — Online Certificate Status Protocol (OCSP): https://datatracker.ietf.org/doc/html/rfc6960
- RFC 6066 — TLS Certificate Status Request (Stapling): https://datatracker.ietf.org/doc/html/rfc6066
- RFC 7633 — TLS Feature Extension (Must-Staple): https://datatracker.ietf.org/doc/html/rfc7633
- Let's Encrypt — Ending OCSP Support in 2025: https://letsencrypt.org/2024/12/05/ending-ocsp

---

## Related pages
- [[x509-certificate]] — 인증서 구조·검증·폐기 개요
- [[cert-path-validation]] — Java에서 CRL/OCSP 폐기 검증 구현
- [[crl-java]] — Java로 CRL 생성·파싱·검증 (BouncyCastle)
- [[openssl-crl]] — OpenSSL CLI로 CRL 조회·검증
- [[cmp]] — 인증서 폐기 요청(rr) 프로토콜
