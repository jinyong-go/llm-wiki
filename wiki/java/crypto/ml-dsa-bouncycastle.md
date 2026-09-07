---
title: BouncyCastle ML-DSA — 서명·검증·인증서 발급
updated: 2026-09-07 22:27:37
tags:
  - java
  - crypto
  - pqc
  - ml-dsa
  - bouncycastle
  - x509
---

## 1. 개요

ML-DSA의 원리·파라미터는 [[ml-dsa]] 참조. 이 문서는 **BouncyCastle**(`bcprov`+`bcpkix`)와 **JCA**로 ML-DSA 키쌍을 만들어 서명·검증하고, 그 키로 X.509 인증서를 발급하는 실행 예시다.

---

## 2. 의존성·프로바이더

서명만이면 `bcprov`만으로 충분하고, 인증서 발급(§4)에는 `bcpkix`가 추가로 필요하다.

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

---

## 3. 구현

### 3.1. 키 생성 (KeyGen)

```java
import org.bouncycastle.jcajce.spec.MLDSAParameterSpec;

KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-DSA", "BC");
kpg.initialize(MLDSAParameterSpec.ml_dsa_65, new SecureRandom());
KeyPair kp = kpg.generateKeyPair();
```

`MLDSAParameterSpec`은 `ml_dsa_44` / `ml_dsa_65` / `ml_dsa_87`과 사전 해시(HashML-DSA) 변형 `ml_dsa_44_with_sha512` 등을 제공한다([[ml-dsa]] §8).

### 3.2. 서명 (Sign)

```java
byte[] message = "hello pqc".getBytes(StandardCharsets.UTF_8);

Signature signer = Signature.getInstance("ML-DSA", "BC");
signer.initSign(kp.getPrivate());
signer.update(message);
byte[] signature = signer.sign();
```

### 3.3. 검증 (Verify)

```java
Signature verifier = Signature.getInstance("ML-DSA", "BC");
verifier.initVerify(kp.getPublic());
verifier.update(message);
boolean valid = verifier.verify(signature);   // true
```

### 3.4. 인코딩·디코딩 (키 ↔ byte[])

공개키는 검증자에게 전달해야 하고, 개인키는 저장소에 보관해야 하므로 byte[]로 직렬화·복원하는 경로가 필요하다. `PublicKey`/`PrivateKey`는 표준 JCA 인터페이스의 `getEncoded()`로 바로 인코딩되며, 각각 X.509 `SubjectPublicKeyInfo`, PKCS#8 `PrivateKeyInfo` 구조를 따른다.

```java
// 인코딩: PublicKey/PrivateKey → byte[]
byte[] encodedPublicKey  = kp.getPublic().getEncoded();
byte[] encodedPrivateKey = kp.getPrivate().getEncoded();
```

복원은 `KeyFactory`에 알고리즘("ML-DSA")과 인코딩 규격을 명시한 `EncodedKeySpec`을 넘긴다.

```java
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

KeyFactory kf = KeyFactory.getInstance("ML-DSA", "BC");
PublicKey  restoredPublicKey  = kf.generatePublic(new X509EncodedKeySpec(encodedPublicKey));
PrivateKey restoredPrivateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(encodedPrivateKey));
```

> ASN.1 인코딩 형식은 BC 버전에 따라 변동이 있었다(§5, ML-KEM과 공통 issue #1969 — [[ml-kem-bouncycastle]] §6 참조). 직렬화한 개인키를 외부와 교환·저장할 때는 인코딩 버전 호환성을 확인한다.

---

## 4. ML-DSA 키로 X.509 인증서 발급

자체 서명(self-signed) 인증서를 만드는 예시다. **서명 알고리즘 이름은 `"ML-DSA"`(또는 세트 일치 `"ML-DSA-65"`)** 를 `JcaContentSignerBuilder`에 넘기고 provider는 `"BC"`로 둔다.

```java
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

KeyPair kp = /* §3.1의 ML-DSA 키쌍 */;

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

---

## 5. 버전·상호운용 주의

- **버전**: ML-DSA JCA 지원이 초기 릴리스에서 변동이 있었으므로 **1.81 이상**을 권장한다. `JcaContentSignerBuilder`의 알고리즘 이름은 `"Dilithium3"`·BCPQC 조합이 아니라 **`"ML-DSA"`/`"ML-DSA-65"` + `"BC"`** 를 사용한다(issue #1991).
- **타 구현 상호운용**: OpenSSL 등으로 만든 ML-DSA 개인키를 BC로 읽어 검증할 때 인코딩 차이로 실패한 사례가 있다(issue #2060). 키를 외부와 교환하면 **인코딩 포맷·서명 검증을 통합 테스트로 확인**한다.

---

## 6. 요약

- `KeyPairGenerator.getInstance("ML-DSA", "BC")` + `MLDSAParameterSpec.ml_dsa_65`로 키쌍 생성.
- 서명/검증은 표준 `Signature.getInstance("ML-DSA", "BC")` — `initSign`/`initVerify` + `update`/`sign`·`verify`.
- 키 직렬화는 `getEncoded()`(X.509/PKCS#8), 복원은 `KeyFactory` + `X509EncodedKeySpec`/`PKCS8EncodedKeySpec`.
- `JcaContentSignerBuilder("ML-DSA").setProvider("BC")` + `JcaX509v3CertificateBuilder`로 인증서 발급. provider는 항상 `"BC"`. BC는 1.81 이상 권장.

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
- [[ml-dsa]] — ML-DSA 원리·수학적 구조 (개념)
- [[ml-kem-bouncycastle]] — 격자 기반 KEM의 BouncyCastle 구현, 같은 PQC 계열의 짝
- [[openssl-x509]] — X.509 인증서 구조·발급·검증
- [[openssl-dgst]] — 고전 해시·서명(sign/verify) 비교
- [[openssl-keygen]] — RSA/EC/Ed25519 키 생성(고전 서명 키 비교)
- [[openssl-s_client]] — TLS 인증서 체인(PQC 인증서 적용 지점)
