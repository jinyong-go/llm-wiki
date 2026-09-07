---
title: BouncyCastle ML-KEM — 키 생성·캡슐화·복원
updated: 2026-09-07 22:18:44
tags:
  - java
  - crypto
  - pqc
  - ml-kem
  - bouncycastle
---

## 1. 개요

ML-KEM의 원리·파라미터는 [[ml-kem]] 참조. 이 문서는 **BouncyCastle**(`bcprov`)와 **JCA**로 ML-KEM 키쌍을 만들고 캡슐화·복원한 뒤 공유 비밀을 대칭 암호에 연결하는 실행 예시다.

KEM은 키 합의까지만 책임지므로, 데이터 기밀성은 도출한 비밀로 구성한 AES-GCM 등이 담당한다.

---

## 2. 의존성·프로바이더

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

---

## 3. 구현

### 3.1. 키 생성 (KeyGen)

```java
import org.bouncycastle.jcajce.spec.MLKEMParameterSpec;

KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-KEM", "BC");
kpg.initialize(MLKEMParameterSpec.ml_kem_768, new SecureRandom());
KeyPair kp = kpg.generateKeyPair();   // kp.getPublic() = 캡슐화 키, kp.getPrivate() = 복호화 키
```

`MLKEMParameterSpec`은 `ml_kem_512` / `ml_kem_768` / `ml_kem_1024`를 제공한다.

### 3.2. 캡슐화 (Encaps)

`SecretKeyWithEncapsulation`은 KEM 비밀과 그 캡슐화 값을 함께 담는 캐리어다 — `getEncoded()`가 공유 비밀(대칭키), `getEncapsulation()`이 송신할 암호문이다. 캡슐화 키(공개키)만 있으면 되므로 송신측은 §3.1의 키쌍 생성 없이 전달받은 공개키로 바로 이 단계를 수행한다.

```java
import org.bouncycastle.jcajce.SecretKeyWithEncapsulation;
import org.bouncycastle.jcajce.spec.KEMGenerateSpec;

KeyGenerator gen = KeyGenerator.getInstance("ML-KEM", "BC");
gen.init(new KEMGenerateSpec(kp.getPublic(), "AES"), new SecureRandom());
SecretKeyWithEncapsulation encapsulated = (SecretKeyWithEncapsulation) gen.generateKey();

byte[] sharedSecretSender = encapsulated.getEncoded();        // 32 byte 공유 비밀
byte[] ciphertext         = encapsulated.getEncapsulation();  // 수신측에 전송 (768 byte)
```

### 3.3. 복원 (Decaps)

```java
import org.bouncycastle.jcajce.spec.KEMExtractSpec;

KeyGenerator ext = KeyGenerator.getInstance("ML-KEM", "BC");
ext.init(new KEMExtractSpec(kp.getPrivate(), ciphertext, "AES"));
SecretKeyWithEncapsulation decapsulated = (SecretKeyWithEncapsulation) ext.generateKey();

byte[] sharedSecretReceiver = decapsulated.getEncoded();

// 양측 비밀 일치
assert java.util.Arrays.equals(sharedSecretSender, sharedSecretReceiver);
```

### 3.4. 인코딩·디코딩 (키 ↔ byte[])

캡슐화 키는 네트워크로 송신측에 전달해야 하고, 복호화 키는 저장소에 보관해야 하므로 byte[]로 직렬화·복원하는 경로가 필요하다. `PublicKey`/`PrivateKey`는 표준 JCA 인터페이스의 `getEncoded()`로 바로 인코딩되며, 각각 X.509 `SubjectPublicKeyInfo`, PKCS#8 `PrivateKeyInfo` 구조를 따른다.

```java
// 인코딩: PublicKey/PrivateKey → byte[]
byte[] encodedPublicKey  = kp.getPublic().getEncoded();
byte[] encodedPrivateKey = kp.getPrivate().getEncoded();
```

복원은 `KeyFactory`에 알고리즘("ML-KEM")과 인코딩 규격을 명시한 `EncodedKeySpec`을 넘긴다.

```java
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

// 디코딩: byte[] → PublicKey/PrivateKey
KeyFactory kf = KeyFactory.getInstance("ML-KEM", "BC");
PublicKey  restoredPublicKey  = kf.generatePublic(new X509EncodedKeySpec(encodedPublicKey));
PrivateKey restoredPrivateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(encodedPrivateKey));
```

> ASN.1 인코딩 형식은 BC 버전에 따라 변동이 있었다(§6, issue #1969). 직렬화한 개인키를 외부와 교환·저장할 때는 인코딩 버전 호환성을 확인한다.

---

## 4. 공유 비밀 사용

### 4.1. AES 직접 사용

캡슐화 결과 `SecretKeyWithEncapsulation`은 알고리즘이 `"AES"`인 `SecretKey`이므로 그대로 대칭 암호에 넣는다.

```java
SecretKey aesKey = new SecretKeySpec(sharedSecretSender, "AES");   // 또는 encapsulated 직접 사용
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
byte[] sealed = cipher.doFinal(plaintext);
```

송신측은 `ciphertext`(+ AES IV·태그)를 함께 전송하고, 수신측은 복원한 비밀로 동일 AES 키를 만들어 복호화한다.

### 4.2. KDF 경유

공유 비밀은 32 byte 균등 난수이므로 단일 대칭키로 바로 쓸 수 있으나, **키를 여러 개 파생**하거나 **세션 문맥을 바인딩**하려면 [[kdf]](HKDF 등)를 거친다.

```java
// HKDF-Expand: 방향별 키 분리 예
byte[] c2sKey = hkdf(sharedSecretSender, "c2s".getBytes(UTF_8), 32);
byte[] s2cKey = hkdf(sharedSecretSender, "s2c".getBytes(UTF_8), 32);
```

### 4.3. 복원 실패 검출

ML-KEM Decaps는 암묵적 거부(implicit rejection) 때문에 **잘못된 암호문에도 오류 없이 32 byte를 반환**한다([[ml-kem]] §5.4). 따라서 `getEncoded()` 성공 여부로 무결성을 판단할 수 없고, **AEAD 태그 검증 실패**로 검출해야 한다.

```java
try {
    byte[] opened = cipher.doFinal(sealed);   // AEADBadTagException → 키 불일치
} catch (AEADBadTagException e) {
    // 암호문 위조 또는 키 불일치
}
```

---

## 5. Java 21+ 표준 KEM API

Java 21부터 `javax.crypto.KEM` 표준 API가 추가되어, provider만 BC로 두고 표준 인터페이스로 쓸 수 있다. OpenJDK 24+는 provider 없이도 ML-KEM을 지원한다.

```java
KEM kem = KEM.getInstance("ML-KEM", "BC");
KEM.Encapsulator enc = kem.newEncapsulator(kp.getPublic());
KEM.Encapsulated e = enc.encapsulate();          // e.key()=공유키, e.encapsulation()=암호문
SecretKey k1 = e.key();

KEM.Decapsulator dec = kem.newDecapsulator(kp.getPrivate());
SecretKey k2 = dec.decapsulate(e.encapsulation());
// k1.equals(k2)
```

`encapsulate(from, to, algorithm)` 오버로드로 공유 비밀의 일부 구간만 잘라 특정 알고리즘 키로 받을 수도 있다.

---

## 6. 버전·인코딩 호환성 주의

BouncyCastle의 ML-KEM JCA 지원은 초기 릴리스(1.78~1.80)에서 변동이 있었으므로 상호운용 시 주의한다.

- **버전**: 키 크기·인코딩 관련 수정이 누적되었으므로 **1.81 이상**을 권장한다. (1.79에서 JCA/JCE API의 ML-KEM 키 크기 오류가 보고됨 — issue #1890)
- **개인키 ASN.1 인코딩**: ML-KEM/ML-DSA 개인키의 ASN.1 인코딩 형식이 IETF 드래프트와 어긋난 시기가 있었다(issue #1969). 직렬화한 키(`getEncoded()`)를 다른 라이브러리·다른 BC 버전과 주고받을 때 **인코딩 포맷이 호환되는지 반드시 검증**한다.
- **타 구현과의 상호운용**: libOQS·OpenSSL 등 다른 구현과 키/암호문을 교환할 때, 복호화 키를 seed(64 byte) 형태로 담는지 확장 형태(768k+96 byte)로 담는지 등 표현 차이로 복원이 실패할 수 있다(issue #2037). 공유 비밀이 양측에서 일치하는지 통합 테스트로 확인한다.

> 동일 JVM·동일 BC 버전 내에서 캡슐화/복원만 하는 경우(§3)는 영향이 없다. 주의가 필요한 것은 **키를 직렬화해 외부와 교환**하거나 **버전·라이브러리를 혼용**하는 경우다.

---

## 7. 요약

- `KeyPairGenerator.getInstance("ML-KEM", "BC")` + `MLKEMParameterSpec.ml_kem_768`로 키쌍 생성.
- 캡슐화는 `KeyGenerator` + `KEMGenerateSpec`, 복원은 `KEMExtractSpec`. 결과는 `SecretKeyWithEncapsulation`(비밀 + 암호문).
- Decaps는 실패해도 오류를 내지 않으므로 AEAD 태그로 검출한다.
- 외부와 키를 교환하면 인코딩 호환성을 통합 테스트로 확인. BC는 1.81 이상 권장.

---

## Sources
- NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism Standard: https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf
- BouncyCastle — MLKEMParameterSpec API: https://downloads.bouncycastle.org/java/docs/bcprov-jdk14-javadoc/org/bouncycastle/jcajce/spec/MLKEMParameterSpec.html
- BouncyCastle — SecretKeyWithEncapsulation API: https://downloads.bouncycastle.org/java/docs/bcprov-jdk14-javadoc/org/bouncycastle/jcajce/SecretKeyWithEncapsulation.html
- BouncyCastle — PQC Almanac (ML-KEM 예시): https://downloads.bouncycastle.org/csharp/docs/PQC-Almanac.pdf
- JEP 452 / `javax.crypto.KEM` (Java 21 Key Encapsulation Mechanism API): https://openjdk.org/jeps/452
- bc-java issue #1890 (ML-KEM 키 크기, 1.79): https://github.com/bcgit/bc-java/issues/1890
- bc-java issue #1969 (ML-KEM/ML-DSA 개인키 ASN.1 인코딩 IETF draft 미준수): https://github.com/bcgit/bc-java/issues/1969
- bc-java issue #2037 (libOQS ↔ BouncyCastle ML-KEM 상호운용): https://github.com/bcgit/bc-java/issues/2037

---

## Related pages
- [[ml-kem]] — ML-KEM 원리·수학적 구조 (개념)
- [[ml-dsa]] — 격자 기반 디지털 서명(FIPS 204)과 BouncyCastle 구현
- [[kdf]] — 공유 비밀에서 세션 키 유도(HKDF)
- [[keystore-java]] — Java KeyStore 저장·로드
- [[cms]] — 합의한 대칭키로 데이터 암호화(EnvelopedData)
