---
title: ML-DSA — 격자 기반 디지털 서명 (FIPS 204)와 BouncyCastle 구현·인증서 발급
updated: 2026-07-14 11:26:44
tags:
  - java
  - crypto
  - pqc
  - ml-dsa
  - bouncycastle
  - x509
---

## 1. 개념

**ML-DSA**(Module-Lattice-Based Digital Signature Algorithm)는 NIST **FIPS 204**(2024) 표준 PQC(Post-Quantum Cryptography) 디지털 **서명** 알고리즘이다. CRYSTALS-**Dilithium**을 표준화한 것이다. 키 합의용인 [[ml-kem]]과 짝을 이루며, 이쪽은 **서명/검증**을 담당한다.

- **서명이란**: 개인키로 메시지에 서명(`Sign`)하고, 공개키로 무결성·발신자를 검증(`Verify`)한다. RSA/ECDSA/EdDSA의 PQC 대체재다.
- **세 알고리즘**: `KeyGen`(키쌍) → `Sign(sk, msg)`(서명 생성) → `Verify(pk, msg, sig)`(검증).
- **기반 난제**: **MLWE**(Module Learning With Errors) + **MSIS**(Module Short Integer Solution) 격자 문제. 양자 컴퓨터에 내성. **Fiat–Shamir with Aborts** 패러다임. EUF-CMA 보안.
- **변형**: 순수(pure) 서명과 사전 해시(pre-hash) 서명(`*_with_sha512`)을 지원하며, 도메인 분리를 위한 컨텍스트 문자열을 받을 수 있다.

관련: [[ml-kem]](키 캡슐화, 같은 격자 계열), [[openssl-dgst]](고전 서명/해시), [[openssl-x509]](X.509 인증서).

---

## 2. 파라미터 세트

세 세트는 module 차원과 잡음 파라미터로 보안 강도를 조절한다. 위로 갈수록 보안↑·크기↑. (크기 단위: byte)

| 세트 | 보안 카테고리 | 대응 대칭강도 | 공개키 | 개인키 | 서명 |
|------|---------------|---------------|--------|--------|------|
| ML-DSA-44 | Category 2 | AES-128 | 1312 | 2560 | 2420 |
| ML-DSA-65 | Category 3 | AES-192 | 1592 | 4032 | 3309 |
| ML-DSA-87 | Category 5 | AES-256 | 2592 | 4896 | 4627 |

> 일반적 기본 권장값은 **ML-DSA-65**(Category 3). [[ml-kem]]과 달리 최저 세트가 Category **2**부터 시작한다. BouncyCastle은 각 세트에 `_with_sha512` 사전 해시 변형도 제공한다.

---

## 3. 장단점

### 3.1. 장점
- **양자 내성** — 격자(MLWE/MSIS) 기반으로 Shor 알고리즘에 안전. RSA/ECDSA 대체.
- **빠른 검증** — 검증이 빠르고 서명도 실용적 속도. 상태 비저장(stateless)이라 해시 기반 서명(SLH-DSA/FIPS 205)보다 다루기 쉽다.
- **표준화** — NIST FIPS 204 정식 표준. BouncyCastle, OpenSSL 3.5+, OpenJDK 24+ 지원.

### 3.2. 단점
- **큰 키/서명** — ECDSA(서명 약 64~72B, 키 32B) 대비 키 1.3~2.6KB·서명 2.4~4.6KB로 매우 크다. **인증서·TLS 핸드셰이크·체인 크기 증가**가 실무 부담.
- **신규성** — 전환기에는 고전 알고리즘과 결합한 **하이브리드 인증서/서명** 배치가 권장된다.[^1]
- **역할 구분** — 서명 전용. 키 교환은 [[ml-kem]], 암호화는 대칭/하이브리드를 별도로 사용한다.

[^1]: FIPS 204 원문이 아니라 PQC 전환기의 업계 권고를 일반화한 주장임.

---

## 4. BouncyCastle 구현 (Java, JCA)

### 4.1. 의존성·프로바이더

서명만이면 `bcprov`만으로 충분하고, 인증서 발급(§4.3)에는 `bcpkix`가 추가로 필요하다.

```xml
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.81</version>
</dependency>
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcpkix-jdk18on</artifactId>   <!-- X.509 인증서/CSR 빌더 -->
    <version>1.81</version>
</dependency>
```

```java
import org.bouncycastle.jce.provider.BouncyCastleProvider;
Security.addProvider(new BouncyCastleProvider());   // provider 이름 "BC"
```

> ML-DSA는 PQC 전용 provider(**BCPQC**)가 아니라 **본 provider("BC")** 에 있다. `JcaContentSignerBuilder` 등에 BCPQC를 지정하면 `no such algorithm` 오류가 난다(issue #1991). 항상 `"BC"`를 쓴다.

### 4.2. 키 생성 → 서명 → 검증

```java
import org.bouncycastle.jcajce.spec.MLDSAParameterSpec;

// 1) 키쌍 생성
KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA", "BC");
kpg.initialize(MLDSAParameterSpec.ml_dsa_65, new SecureRandom());
KeyPair kp = kpg.generateKeyPair();

byte[] message = "hello pqc".getBytes(StandardCharsets.UTF_8);

// 2) 서명 (개인키)
Signature signer = Signature.getInstance("ML-DSA", "BC");
signer.initSign(kp.getPrivate());
signer.update(message);
byte[] signature = signer.sign();

// 3) 검증 (공개키)
Signature verifier = Signature.getInstance("ML-DSA", "BC");
verifier.initVerify(kp.getPublic());
verifier.update(message);
boolean valid = verifier.verify(signature);   // true
```

`MLDSAParameterSpec`은 `ml_dsa_44` / `ml_dsa_65` / `ml_dsa_87`과 사전 해시 변형 `ml_dsa_44_with_sha512` 등을 제공한다.

### 4.3. ML-DSA 키로 X.509 인증서 발급

자체 서명(self-signed) 인증서를 만드는 예시다. **서명 알고리즘 이름은 `"ML-DSA"`(또는 세트 일치 `"ML-DSA-65"`)** 를 `JcaContentSignerBuilder`에 넘기고 provider는 `"BC"`로 둔다.

```java
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

KeyPair kp = /* §4.2의 ML-DSA 키쌍 */;

X500Name subject = new X500Name("CN=pqc-example, O=Example, C=KR");
BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
Date notBefore = new Date();
Date notAfter  = Date.from(Instant.now().plus(365, ChronoUnit.DAYS));

X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
        subject,        // issuer == subject (self-signed)
        serial,
        notBefore, notAfter,
        subject,
        kp.getPublic());

// ML-DSA 개인키로 인증서 서명
ContentSigner signer = new JcaContentSignerBuilder("ML-DSA")
        .setProvider("BC")
        .build(kp.getPrivate());

X509Certificate cert = new JcaX509CertificateConverter()
        .setProvider("BC")
        .getCertificate(certBuilder.build(signer));

cert.verify(kp.getPublic(), "BC");   // 자체 서명 검증
System.out.println(cert.getSigAlgName());   // ML-DSA 계열
```

**CA가 발급**하는 경우는 issuer를 CA의 `X500Name`으로, 공개키를 피발급자(subject)의 키로 두고, `JcaContentSignerBuilder(...).build(caPrivateKey)`처럼 **CA의 개인키로 서명**하면 된다. CSR이 필요하면 `PKCS10CertificationRequestBuilder` + 같은 `ContentSigner`를 사용한다. X.509 구조·확장은 [[openssl-x509]] 참고.

### 4.4. 버전·상호운용 주의

- **버전**: ML-DSA JCA 지원이 초기 릴리스에서 변동이 있었으므로 **1.81 이상**을 권장한다. `JcaContentSignerBuilder`의 알고리즘 이름은 `"Dilithium3"`·BCPQC 조합이 아니라 **`"ML-DSA"`/`"ML-DSA-65"` + `"BC"`** 를 사용한다(issue #1991).
- **타 구현 상호운용**: OpenSSL 등으로 만든 ML-DSA 개인키를 BC로 읽어 검증할 때 인코딩 차이로 실패한 사례가 있다(issue #2060). 키를 외부와 교환하면 **인코딩 포맷·서명 검증을 통합 테스트로 확인**한다.

---

## 5. 요약

- ML-DSA = FIPS 204 격자(MLWE+MSIS) 기반 **서명**. Dilithium 표준화. 서명/검증 담당, 키 교환은 [[ml-kem]].
- 세트는 44/65/87 — 보안 Category 2/3/5, 기본 권장 65. 키·서명이 ECDSA보다 크게 증가.
- BouncyCastle은 `KeyPairGenerator("ML-DSA")` + `MLDSAParameterSpec`, `Signature("ML-DSA")`로 서명/검증, `JcaContentSignerBuilder("ML-DSA").setProvider("BC")` + `JcaX509v3CertificateBuilder`로 인증서 발급. provider는 항상 `"BC"`.

---

## Sources
- NIST FIPS 204 — Module-Lattice-Based Digital Signature Standard: https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf
- BouncyCastle — MLDSAParameterSpec API: https://downloads.bouncycastle.org/java/docs/bcprov-jdk18on-javadoc/org/bouncycastle/jcajce/spec/MLDSAParameterSpec.html
- BouncyCastle — PQC Almanac (ML-DSA 예시): https://downloads.bouncycastle.org/java/docs/PQC-Almanac.pdf
- bc-java pkix CertTest (ML-DSA 인증서 테스트): https://github.com/bcgit/bc-java/blob/main/pkix/src/test/java/org/bouncycastle/cert/test/CertTest.java
- bc-java issue #1991 (JcaContentSignerBuilder ML-DSA 이름/provider): https://github.com/bcgit/bc-java/issues/1991
- bc-java issue #2060 (OpenSSL ↔ BouncyCastle ML-DSA 상호운용): https://github.com/bcgit/bc-java/issues/2060

---

## Related pages
- [[ml-kem]] — 격자 기반 KEM(키 캡슐화), 같은 PQC 계열의 짝
- [[openssl-x509]] — X.509 인증서 구조·발급·검증
- [[openssl-dgst]] — 고전 해시·서명(sign/verify) 비교
- [[openssl-keygen]] — RSA/EC/Ed25519 키 생성(고전 서명 키 비교)
- [[openssl-s_client]] — TLS 인증서 체인(PQC 인증서 적용 지점)
