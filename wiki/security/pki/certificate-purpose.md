---
title: 인증서 용도
updated: 2026-09-08 23:03:19
tags:
  - crypto
  - pki
  - x509
  - certificate
  - key-usage
---

## 1. 개요

인증서의 실제 용도는 Key Usage(암호학적 연산 제한) 단독이 아니라 Extended Key Usage(응용 수준 용도)·Basic Constraints(CA 여부)까지 함께 판단해야 확정된다. 각 확장 자체의 정의·비트·OID는 [[x509-certificate]] §2.2 참고.

이 문서가 다루는 용도별 프로파일:

- TLS 서버 인증서
- TLS 클라이언트 인증서
- 개인 전자서명용 인증서
- 암호화용 인증서
- 코드 서명 인증서
- S/MIME 인증서
- 타임스탬프 서명 인증서
- OCSP 응답자 인증서
- CA(발급자) 인증서

---

## 2. TLS 서버 인증서

### 2.1. 설정

- **Key Usage**: `digitalSignature`(ephemeral (EC)DHE 핸드셰이크 서명 — TLS 1.2의 (EC)DHE 사이퍼스위트와 TLS 1.3 전체에 필요, RSA-sign·ECDSA 공통) + `keyEncipherment`(RSA **정적** 키 교환 전용 — TLS 1.2 이하 구형 사이퍼스위트, TLS 1.3에서는 폐지됨). 정적 ECDH를 쓰는 드문 경우는 `keyAgreement`
- **EKU**: `serverAuth`(1.3.6.1.5.5.7.3.1) 필수
- **Basic Constraints**: `cA=false`

### 2.2. 실사용

HTTPS 웹서버, 리버스 프록시·로드밸런서의 TLS 종단, API 게이트웨이, 쿠버네티스 Ingress 등에서 사용한다. 브라우저는 SAN(dNSName)이 없거나 `serverAuth` EKU가 없는 서버 인증서를 거부한다. CN 매칭 방식은 더 이상 사용되지 않는다(deprecated). 공개 신뢰(Public Trust) 인증서는 CA/Browser Forum Baseline Requirements를 따르며, DV/OV/EV 검증 수준 차이는 발급 정책의 차이일 뿐 Key Usage·EKU 값 자체와는 무관하다.

---

## 3. TLS 클라이언트 인증서

### 3.1. 설정

- **Key Usage**: `digitalSignature`
- **EKU**: `clientAuth`(1.3.6.1.5.5.7.3.2)
- **Basic Constraints**: `cA=false`

### 3.2. 실사용

mTLS(mutual TLS) 환경에서 클라이언트 신원을 증명한다 — 서비스 메시(Istio/Envoy) 내부 마이크로서비스 간 인증, API 게이트웨이의 클라이언트 인증, VPN(IPsec/IKEv2, OpenVPN) 사용자 인증, 스마트카드·HSM 기반 사용자 로그인 등에 쓰인다.

---

## 4. 개인 전자서명용 인증서

### 4.1. 설정

- **Key Usage**: `digitalSignature` + `nonRepudiation`(contentCommitment). 부인방지가 핵심 요구사항이면 `nonRepudiation` 단독으로 제한 — ETSI EN 319 412-2 §4.3.2가 정의하는 Type A 키 사용 조합이며 eIDAS 적격인증서(자연인 대상)에 흔히 쓰임
- **EKU**: 표준 EKU 없이 쓰이는 경우가 많음. 벤더별 문서서명 EKU(예: Microsoft Document Signing)도 사용됨

### 4.2. 실사용

PDF/전자문서 서명, 전자계약, 전자결재, 세금계산서 등 공공·금융 전자문서 제출에 쓰인다. 부인방지가 법적 효력을 가지므로 서명 키는 소유자가 단독으로 통제해야 한다. HSM·스마트카드·USB 토큰 보관이 원칙이며, 소프트웨어 저장은 신뢰도가 낮게 취급된다. 서명 키는 CA/운영자가 백업(escrow)할 수 없어 분실 시 재발급만 가능하지만 암호화 키는 복구를 위해 위탁이 허용되므로, 이 차이 때문에 서명용 키와 암호화용 키를 별도 쌍으로 발급하는 **이중 키쌍(dual key pair) 모델**을 채택하는 PKI가 있다[^1].

---

## 5. 암호화용 인증서

### 5.1. 설정

- **Key Usage**: `keyEncipherment`(RSA) 또는 `keyAgreement`(EC)

### 5.2. 실사용

이메일·문서 암호화, 대칭키 전달(키 캡슐화)에 쓰인다. §4의 서명용 인증서와 짝을 이루는 이중 키쌍 모델에서는, 유실 시 복구가 가능해야 암호화된 과거 데이터에 계속 접근할 수 있기 때문에 이 키만 키 복구 서비스(Key Recovery Agent)의 대상이 된다.

---

## 6. 코드 서명 인증서

### 6.1. 설정

- **Key Usage**: `digitalSignature`, **critical 필수**, `keyCertSign`/`cRLSign` 배제
- **EKU**: `codeSigning`(1.3.6.1.5.5.7.3.3) 필수, `anyExtendedKeyUsage`/`serverAuth` 배제

### 6.2. 실사용

Windows Authenticode(exe/msi/드라이버), macOS 코드 서명·공증, [[jar-signing]], 모바일 앱 서명(APK/IPA) 등 배포 코드의 출처·무결성 증명에 쓰인다. 타임스탬프와 조합하면 서명 인증서가 만료된 뒤에도 서명 유효성이 유지된다(RFC 3161). EV 코드서명 인증서는 개인키를 HSM에 강제 보관하고, 발급 즉시 OS 평판 시스템(SmartScreen 등)의 신뢰를 얻는 특징이 있다.

---

## 7. S/MIME 인증서

### 7.1. 설정

- **Key Usage**: 서명은 `digitalSignature`+`nonRepudiation`, 암호화는 `keyEncipherment` — 단일 인증서에 함께 넣거나 서명/암호화 인증서를 분리
- **EKU**: `emailProtection`(1.3.6.1.5.5.7.3.4)

### 7.2. 실사용

이메일 서명(발신자 인증·무결성)과 암호화(기밀성)에 쓰인다([[cms]]). 기업 메일 게이트웨이의 자동 서명/암호화, Outlook·Thunderbird 등 클라이언트의 인증서 기반 S/MIME이 대표 사례다.

---

## 8. 타임스탬프 서명 인증서

### 8.1. 설정

- **Key Usage**: `digitalSignature`/`nonRepudiation`만 허용, 다른 비트 배제
- **EKU**: `timeStamping`(1.3.6.1.5.5.7.3.8) **단독**, **critical 필수**

### 8.2. 실사용

RFC 3161 TSA(Time-Stamping Authority)는 전자서명·코드서명의 서명 시점을 증명해 문서 위변조 방지에 시간 축을 더한다. 상세 프로토콜·구조는 [[timestamp-token]] 참고.

---

## 9. OCSP 응답자 인증서

### 9.1. 설정

- **Key Usage**: `digitalSignature`
- **EKU**: `OCSPSigning`(1.3.6.1.5.5.7.3.9)

### 9.2. 실사용

위임된 OCSP 응답자(delegated responder)가 CA를 대신해 실시간 폐기 상태를 응답할 때 쓰인다. `id-pkix-ocsp-nocheck` 확장을 넣어 응답자 자신의 폐기 여부 확인을 생략시키는 경우가 흔하다(순환 참조 방지). 상세는 [[certificate-revocation]] 참고.

---

## 10. CA(발급자) 인증서

### 10.1. 설정

- **Key Usage**: `keyCertSign`(+ CRL 발행 시 `cRLSign`)
- **Basic Constraints**: `cA=true`, **critical 필수**
- **EKU**: 보통 없음(하위 인증서 EKU 제한 없음)

### 10.2. 실사용

루트 CA는 오프라인 HSM에 보관하고, 중간 CA가 온라인에서 실제 발급을 담당하는 계층 구조가 일반적이다. 발급 정책은 CP/CPS(Certificate Policy/Certification Practice Statement) 문서로 공개한다. Name Constraints를 조합해 하위 CA가 발급 가능한 도메인·조직 범위를 제한하는 방식은 사설 PKI·기업 내부 CA에서 흔히 쓰인다.

---

## 11. openssl 용도 검사 (`-purpose`)

`openssl verify -purpose <p>`는 위 조합을 자동 판정한다.

| `-purpose` 값 | 대응 프로파일 |
|---|---|
| `sslserver` | 2장 TLS 서버 |
| `sslclient` | 3장 TLS 클라이언트 |
| `smimesign` | 7장 S/MIME 서명 |
| `smimeencrypt` | 7장 S/MIME 암호화 |
| `crlsign` | CA의 `cRLSign` 확인 |
| `timestampsign` | 8장 타임스탬프 |
| `codesign` | 6장 코드 서명 |
| `ocsphelper` | 9장 (타깃 인증서 자체는 검사 안 함, OCSP 함수 내부에서 별도 검증) |
| `any` | 확장 검사 생략 |

CLI 예시는 [[openssl-x509]] §8 참고.

---

## Sources
- `raw/crypto/X.509.md`
- [RFC 5280: Internet X.509 PKI Certificate and CRL Profile](https://datatracker.ietf.org/doc/html/rfc5280)
- [OpenSSL openssl-verification-options](https://docs.openssl.org/master/man1/openssl-verification-options/)
- [DigiCert/QuoVadis — eIDAS Qualified Key Usages](https://knowledge.digicert.com/quovadis/general-information/eIDAS-Qualified-KUEs.html)

[^1]: 서명용/암호화용 인증서 분리는 "부인방지 키는 백업 불가"라는 원칙(ETSI EN 319 412-2, RFC 5280 nonRepudiation 정의)에서 도출되는 일반적 PKI 설계 관행이며, 특정 국내 서비스의 실제 발급 정책을 직접 확인한 근거는 아니다.

---

## Related pages
- [[x509-certificate]] — Key Usage/EKU 확장 정의 상세
- [[certificate-revocation]]
- [[timestamp-token]]
- [[cms]]
- [[jar-signing]]
- [[openssl-x509]]
