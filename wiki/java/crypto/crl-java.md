---
title: Java CRL 생성 — BouncyCastle
updated: 2026-07-14 14:28:58
tags:
  - java
  - crypto
  - bouncycastle
  - x509
  - pki
  - crl
---

## 1. 개요

CA가 폐기한 인증서 목록인 **CRL**(Certificate Revocation List, RFC 5280 §5)을 Java로 생성·파싱·검증하는 방법. CRL 개념·구조는 [[certificate-revocation]], CLI는 [[openssl-crl]] 참고.

역할 분담:
- **생성** — JDK 표준 공개 API에는 CRL 생성 기능이 없어[^1] **BouncyCastle `X509v2CRLBuilder`** 를 사용한다.
- **파싱·검증** — `java.security.cert`의 `CertificateFactory`/`X509CRL` 표준 API로 가능하다.

[^1]: JCA/PKI 프로그래머 가이드의 엔진 클래스 목록에 CRL 생성용 클래스가 없고, `X509CRL`·`CertificateFactory`는 인코딩된 CRL의 파싱·검증용이라는 점에 근거한 서술. 생성은 내부 API(`sun.security.x509`)나 서드파티가 필요하다.

---

## 2. 의존성

```groovy
implementation 'org.bouncycastle:bcpkix-jdk18on:1.78.1'   // cert, operator 포함
```

---

## 3. CRL 생성 — X509v2CRLBuilder

CA의 인증서·개인키로 CRL을 만들고 서명한다.

```java
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.*;
import org.bouncycastle.cert.jcajce.*;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import java.math.BigInteger;
import java.security.cert.X509CRL;
import java.util.Date;

X509Certificate caCert = ...;   // CRL 발급 CA 인증서
PrivateKey caKey       = ...;   // CA 개인키

Date now = new Date();
Date nextUpdate = new Date(now.getTime() + 7L * 24 * 60 * 60 * 1000);  // 7일 후

// issuer = CA subject, thisUpdate = 발급 시각
JcaX509v2CRLBuilder builder = new JcaX509v2CRLBuilder(caCert, now);
builder.setNextUpdate(nextUpdate);

// 폐기 항목 추가: (일련번호, 폐기 시각, 사유)
builder.addCRLEntry(BigInteger.valueOf(101), now, CRLReason.keyCompromise);
builder.addCRLEntry(BigInteger.valueOf(102), now, CRLReason.superseded,
        new Date(now.getTime() - 24L * 60 * 60 * 1000));   // + invalidityDate 확장

// CRL 확장 — RFC 5280가 발급 CA에 요구(MUST)하는 2종
JcaX509ExtensionUtils extUtils = new JcaX509ExtensionUtils();
builder.addExtension(Extension.authorityKeyIdentifier, false,
        extUtils.createAuthorityKeyIdentifier(caCert));            // AKI
builder.addExtension(Extension.cRLNumber, false,
        new CRLNumber(BigInteger.ONE));                            // CRL Number (단조 증가)

// CA 키로 서명
ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
        .setProvider("BC").build(caKey);
X509CRLHolder holder = builder.build(signer);

// JCA 타입으로 변환
X509CRL crl = new JcaX509CRLConverter().setProvider("BC").getCRL(holder);
byte[] der = holder.getEncoded();               // DER 저장용
```

`addCRLEntry` 오버로드:

| 시그니처 | 용도 |
|---|---|
| `(serial, revocationDate, reason)` | reasonCode 확장 포함 |
| `(serial, revocationDate, reason, invalidityDate)` | + invalidityDate 확장 |
| `(serial, revocationDate, Extensions)` | 임의 entry 확장 직접 지정 |

---

## 4. 폐기 사유 (CRLReason)

`org.bouncycastle.asn1.x509.CRLReason`의 상수 (RFC 5280 §5.3.1):

| 상수 | 값 | 의미 |
|---|---|---|
| `unspecified` | 0 | 사유 미지정 |
| `keyCompromise` | 1 | EE 개인키 유출 |
| `cACompromise` | 2 | CA 키 유출 |
| `affiliationChanged` | 3 | 소속 변경 |
| `superseded` | 4 | 재발급으로 대체 |
| `cessationOfOperation` | 5 | 용도 폐지 |
| `certificateHold` | 6 | 일시 정지 |
| `removeFromCRL` | 8 | (delta CRL) hold 해제 |
| `privilegeWithdrawn` | 9 | 권한 회수 |
| `aACompromise` | 10 | 속성 기관 키 유출 |

---

## 5. CRL 갱신

CRL은 누적 목록이므로 갱신 시 **기존 항목을 유지**하고 새 항목을 더한다.

```java
X509CRLHolder prev = new X509CRLHolder(Files.readAllBytes(Path.of("prev.crl")));

JcaX509v2CRLBuilder builder = new JcaX509v2CRLBuilder(caCert, new Date());
builder.setNextUpdate(nextUpdate);
builder.addCRL(prev);                                        // 기존 항목 복사
builder.addCRLEntry(BigInteger.valueOf(103), new Date(), CRLReason.superseded);

BigInteger prevNumber = CRLNumber.getInstance(
        prev.getExtension(Extension.cRLNumber).getParsedValue()).getCRLNumber();
builder.addExtension(Extension.cRLNumber, false, new CRLNumber(prevNumber.add(BigInteger.ONE)));
builder.addExtension(Extension.authorityKeyIdentifier, false,
        extUtils.createAuthorityKeyIdentifier(caCert));
```

> `X509v2CRLBuilder(X509CRLHolder template)` 생성자로 기존 CRL을 템플릿으로 시작할 수도 있다.

---

## 6. 파싱·검증 — java.security

생성된 CRL의 소비 측은 표준 API만으로 처리한다.

```java
import java.security.cert.*;

CertificateFactory cf = CertificateFactory.getInstance("X.509");
X509CRL crl = (X509CRL) cf.generateCRL(new FileInputStream("ca.crl"));

crl.verify(caCert.getPublicKey());              // 서명 검증 (실패 시 예외)

// 특정 인증서의 폐기 여부
boolean revoked = crl.isRevoked(targetCert);
X509CRLEntry entry = crl.getRevokedCertificate(BigInteger.valueOf(101));
if (entry != null) {
    System.out.println(entry.getRevocationDate() + " / " + entry.getRevocationReason());
}
```

경로 검증에 CRL을 공급하는 방법(`CertStore`, `PKIXRevocationChecker`)은 [[cert-path-validation]] §4.3 참고.

---

## 7. 주의사항

- **서명 키** — CRL은 해당 인증서를 발급한 CA의 키로 서명해야 검증자가 수용한다(간접 CRL 제외).
- **필수 확장** — RFC 5280은 발급 CA에 **AKI(§5.2.1)와 CRL Number(§5.2.3) 포함을 요구(MUST)** 한다. CRL Number는 단조 증가.
- **nextUpdate** — 다음 CRL 발급 예정 시각. RFC 5280은 포함을 요구하며(MUST), 지난 CRL은 검증자가 stale로 취급할 수 있다.
- **누적 유지** — 폐기 항목은 해당 인증서의 유효기간이 끝날 때까지 CRL에 유지해야 한다.
- **thisUpdate/nextUpdate 시각 인코딩** — 2050년 이전은 UTCTime, 이후는 GeneralizedTime (빌더가 처리).

---

## Sources
- BouncyCastle Javadoc — `X509v2CRLBuilder`: https://downloads.bouncycastle.org/java/docs/bcpkix-jdk18on-javadoc/org/bouncycastle/cert/X509v2CRLBuilder.html
- Java PKI Programmer's Guide: https://docs.oracle.com/en/java/javase/21/security/java-pki-programmers-guide.html
- RFC 5280 — CRL and CRL Extensions Profile (§5): https://datatracker.ietf.org/doc/html/rfc5280

---

## Related pages
- [[certificate-revocation]] — CRL/OCSP 폐기 개념·구조
- [[x509-certificate]] — 인증서·폐기 검증 개념
- [[cert-path-validation]] — 경로 검증에 CRL 공급 (같은 카테고리)
- [[cmp-bouncycastle]] — BouncyCastle CA 작업 (같은 카테고리)
- [[openssl-crl]] — CLI로 CRL 조회·검증
