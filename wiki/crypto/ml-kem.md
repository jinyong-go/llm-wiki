---
title: ML-KEM — 격자 기반 KEM (FIPS 203)와 BouncyCastle 구현
updated: 2026-07-14 11:26:44
tags:
  - java
  - crypto
  - pqc
  - ml-kem
  - bouncycastle
---

## 1. 개념

**ML-KEM**(Module-Lattice-Based Key-Encapsulation Mechanism)은 NIST **FIPS 203**(2024) 표준 PQC(Post-Quantum Cryptography) 키 캡슐화 메커니즘이다. CRYSTALS-**Kyber**를 표준화한 것이다.

- **KEM이란**: 공개키로 **공유 비밀(shared secret) + 캡슐화 값(ciphertext)** 을 생성하고(`Encaps`), 개인키로 같은 비밀을 복원한다(`Decaps`). 임의 평문을 암호화하는 것이 아니라 **대칭키 합의**를 수행한다. 도출한 비밀을 KDF/대칭 암호(AES 등)에 사용한다.
- **세 알고리즘**: `KeyGen`(키쌍) → `Encaps`(송신측, 공개키로 비밀+암호문 생성) → `Decaps`(수신측, 개인키로 비밀 복원).
- **기반 난제**: **MLWE**(Module Learning With Errors) 격자 문제. 양자 컴퓨터의 Shor 알고리즘으로 깨지지 않아 RSA/ECC의 대안이 된다. IND-CCA2 보안(Fujisaki–Okamoto 변환).

```
송신측                               수신측
                          공개키 pk ←── KeyGen() → (pk, sk)
Encaps(pk) → (K, ct)  ── ct ──▶  Decaps(sk, ct) → K
   K로 AES 키 사용          K로 AES 키 사용 (양측 동일 K)
```

관련 개념: [[openssl-keygen]](비대칭 키 생성 비교), [[openssl-overview]](대칭/비대칭/PEM 구조).

---

## 2. 파라미터 세트

세 세트는 $n=256$, $q=3329$를 공유하고 **module rank $k$** 와 잡음 파라미터로 보안 강도를 조절한다. 위로 갈수록 보안↑·성능↓·크기↑. (크기 단위: byte)

| 세트 | 보안 카테고리 | 대응 대칭강도 | $k$ | 공개키 | 개인키 | 암호문 | 공유 비밀 |
|------|---------------|---------------|-----|--------|--------|--------|-----------|
| ML-KEM-512 | Category 1 | AES-128 | 2 | 800 | 1632 | 768 | 32 |
| ML-KEM-768 | Category 3 | AES-192 | 3 | 1184 | 2400 | 1088 | 32 |
| ML-KEM-1024 | Category 5 | AES-256 | 4 | 1568 | 3168 | 1568 | 32 |

> 일반적 기본 권장값은 **ML-KEM-768**(Category 3). 공유 비밀은 세트와 무관하게 항상 32 byte다.

---

## 3. 장단점

### 3.1. 장점
- **양자 내성** — 격자 기반으로 Shor 알고리즘에 안전(RSA/ECDH 대체).
- **빠른 연산** — KeyGen/Encaps/Decaps가 빠르고, PQC 후보 중 키·암호문이 비교적 작다.
- **표준화** — NIST FIPS 203 정식 표준. 주요 라이브러리(BouncyCastle, OpenSSL 3.5+, OpenJDK 24+)가 지원.

### 3.2. 단점
- **큰 키/암호문** — ECDH 공개키(약 32~65 byte) 대비 800~1568 byte로 크다(TLS 핸드셰이크 비용↑).
- **KEM 한정** — 직접 암호화·서명 불가. 공유 비밀 합의만 하므로 **KDF + 대칭 암호** 조합이 필요하다. 서명은 별도 표준 **ML-DSA**(FIPS 204).
- **신규성** — 전환기에는 검증된 고전 알고리즘과 결합한 **하이브리드(예: X25519 + ML-KEM-768)** 배치가 권장된다.[^1]

[^1]: FIPS 203 원문이 아니라 PQC 전환기의 업계 권고를 일반화한 주장임.

---

## 4. BouncyCastle 구현 (Java, JCA)

### 4.1. 의존성·프로바이더

```xml
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.81</version>
</dependency>
```

```java
import org.bouncycastle.jce.provider.BouncyCastleProvider;
Security.addProvider(new BouncyCastleProvider());   // provider 이름 "BC"
```

> ML-KEM은 BouncyCastle 1.78부터 PQC 전용 provider(BCPQC)가 아니라 **본 provider("BC")** 에 포함된다. `getInstance(..., "BC")`로 접근한다.

### 4.2. 키 생성 → 캡슐화 → 복원

`SecretKeyWithEncapsulation`은 KEM 비밀과 그 캡슐화 값을 함께 담는 캐리어다 — `getEncoded()`가 공유 비밀(대칭키), `getEncapsulation()`이 송신할 암호문이다.

```java
import org.bouncycastle.jcajce.SecretKeyWithEncapsulation;
import org.bouncycastle.jcajce.spec.KEMGenerateSpec;
import org.bouncycastle.jcajce.spec.KEMExtractSpec;
import org.bouncycastle.jcajce.spec.MLKEMParameterSpec;

// 1) 수신측: 키쌍 생성 (pk는 송신측에 전달)
KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-KEM", "BC");
kpg.initialize(MLKEMParameterSpec.ml_kem_768, new SecureRandom());
KeyPair kp = kpg.generateKeyPair();

// 2) 송신측: 공개키로 캡슐화 → 공유 비밀(AES 키) + 암호문(encapsulation)
KeyGenerator gen = KeyGenerator.getInstance("ML-KEM", "BC");
gen.init(new KEMGenerateSpec(kp.getPublic(), "AES"), new SecureRandom());
SecretKeyWithEncapsulation encapsulated = (SecretKeyWithEncapsulation) gen.generateKey();

byte[] sharedSecretSender = encapsulated.getEncoded();        // 32 byte 공유 비밀
byte[] ciphertext        = encapsulated.getEncapsulation();   // 수신측에 전송

// 3) 수신측: 개인키 + 암호문으로 동일한 공유 비밀 복원
KeyGenerator ext = KeyGenerator.getInstance("ML-KEM", "BC");
ext.init(new KEMExtractSpec(kp.getPrivate(), ciphertext, "AES"));
SecretKeyWithEncapsulation decapsulated = (SecretKeyWithEncapsulation) ext.generateKey();

byte[] sharedSecretReceiver = decapsulated.getEncoded();

// 양측 비밀 일치
assert java.util.Arrays.equals(sharedSecretSender, sharedSecretReceiver);
```

### 4.3. 공유 비밀로 AES 사용

캡슐화 결과 `SecretKeyWithEncapsulation`은 알고리즘이 `"AES"`인 `SecretKey`이므로 그대로 대칭 암호에 넣는다.

```java
SecretKey aesKey = new SecretKeySpec(sharedSecretSender, "AES");   // 또는 encapsulated 직접 사용
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
byte[] sealed = cipher.doFinal(plaintext);
```

> 송신측은 `ciphertext`(+ AES IV·태그)를 함께 전송하고, 수신측은 복원한 비밀로 동일 AES 키를 만들어 복호화한다. KEM은 **키 합의**까지만 책임지고 데이터 기밀성은 AES-GCM 등 [[openssl-cms]] 수준의 대칭 암호가 담당한다.

### 4.4. 버전·인코딩 호환성 주의

BouncyCastle의 ML-KEM JCA 지원은 초기 릴리스(1.78~1.80)에서 변동이 있었으므로 상호운용 시 주의한다.

- **버전**: 키 크기·인코딩 관련 수정이 누적되었으므로 **1.81 이상**을 권장한다. (1.79에서 JCA/JCE API의 ML-KEM 키 크기 오류가 보고됨 — issue #1890)
- **개인키 ASN.1 인코딩**: ML-KEM/ML-DSA 개인키의 ASN.1 인코딩 형식이 IETF 드래프트와 어긋난 시기가 있었다(issue #1969). 직렬화한 키(`getEncoded()`)를 다른 라이브러리·다른 BC 버전과 주고받을 때 **인코딩 포맷이 호환되는지 반드시 검증**한다.
- **타 구현과의 상호운용**: libOQS·OpenSSL 등 다른 구현과 키/암호문을 교환할 때, 공개키·암호문(seed 포함 여부 등) 표현 차이로 복원이 실패할 수 있다(issue #2037). 공유 비밀이 양측에서 일치하는지 통합 테스트로 확인한다.

> 동일 JVM·동일 BC 버전 내에서 캡슐화/복원만 하는 경우(위 §4.2)는 영향이 없다. 주의가 필요한 것은 **키를 직렬화해 외부와 교환**하거나 **버전·라이브러리를 혼용**하는 경우다.

### 4.5. 대안 - Java 21+ 표준 KEM API

Java 21부터 `javax.crypto.KEM` 표준 API가 추가되어, provider만 BC로 두고 표준 인터페이스로 쓸 수 있다.

```java
KEM kem = KEM.getInstance("ML-KEM", "BC");
KEM.Encapsulator enc = kem.newEncapsulator(kp.getPublic());
KEM.Encapsulated e = enc.encapsulate();          // e.key()=공유키, e.encapsulation()=암호문
SecretKey k1 = e.key();

KEM.Decapsulator dec = kem.newDecapsulator(kp.getPrivate());
SecretKey k2 = dec.decapsulate(e.encapsulation());
// k1.equals(k2)
```

---

## 5. 요약

- ML-KEM = FIPS 203 격자(MLWE) 기반 KEM. 공유 비밀 합의 후 대칭 암호와 결합해 사용.
- 세트는 512/768/1024 — 보안·크기 트레이드오프, 기본 권장 768, 공유 비밀은 항상 32 byte.
- BouncyCastle은 `KeyPairGenerator("ML-KEM")` + `MLKEMParameterSpec`, `KEMGenerateSpec`/`KEMExtractSpec`, `SecretKeyWithEncapsulation`로 구현. Java 21+는 `javax.crypto.KEM` 표준 API 사용 가능.

---

## Sources
- NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism Standard: https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf
- NIST SP 800-227 — Recommendations for Key-Encapsulation Mechanisms: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf
- BouncyCastle — MLKEMParameterSpec API: https://downloads.bouncycastle.org/java/docs/bcprov-jdk14-javadoc/org/bouncycastle/jcajce/spec/MLKEMParameterSpec.html
- BouncyCastle — SecretKeyWithEncapsulation API: https://downloads.bouncycastle.org/java/docs/bcprov-jdk14-javadoc/org/bouncycastle/jcajce/SecretKeyWithEncapsulation.html
- BouncyCastle — PQC Almanac (ML-KEM 예시): https://downloads.bouncycastle.org/csharp/docs/PQC-Almanac.pdf
- bc-java issue #1890 (ML-KEM 키 크기, 1.79): https://github.com/bcgit/bc-java/issues/1890
- bc-java issue #1969 (ML-KEM/ML-DSA 개인키 ASN.1 인코딩 IETF draft 미준수): https://github.com/bcgit/bc-java/issues/1969
- bc-java issue #2037 (libOQS ↔ BouncyCastle ML-KEM 상호운용): https://github.com/bcgit/bc-java/issues/2037

---

## Related pages
- [[ml-dsa]] — 격자 기반 디지털 서명(FIPS 204), 같은 PQC 계열의 짝
- [[kdf]] — 공유 비밀에서 세션 키 유도(HKDF)
- [[openssl-keygen]] — RSA/EC/Ed25519 비대칭 키 생성 (고전 알고리즘 비교)
- [[openssl-overview]] — 대칭/비대칭 암호, 키·인증서 계층
- [[openssl-cms]] — 합의한 대칭키로 데이터 암호화(EnvelopedData)
- [[openssl-s_client]] — TLS 핸드셰이크(PQC 하이브리드 키 교환의 적용 지점)
