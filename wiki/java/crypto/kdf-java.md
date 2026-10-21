---
title: Java KDF
updated: 2026-10-21 16:21:56
tags:
  - java
  - crypto
  - kdf
  - password
---

## 1. 개요

Java에서 PBKDF2·Argon2id·HKDF를 사용하는 예제다. 알고리즘의 원리·용도·운영 기준은 [[kdf]]를 참고한다.

## 2. PBKDF2

다음 코드는 JDK의 표준 JCA 구현을 사용한다.

```java
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public class Pbkdf2Example {
    public static void main(String[] args) throws Exception {
        char[] password = "example-password".toCharArray();
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        PBEKeySpec spec = new PBEKeySpec(password, salt, 600_000, 256);
        try {
            byte[] hash = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
            System.out.println(hash.length); // 32
            // 저장 시 알고리즘·반복 횟수·salt·hash를 함께 관리한다.
        } finally {
            spec.clearPassword();
            Arrays.fill(password, '\0');
        }
    }
}
```

`clearPassword()`는 PBEKeySpec 내부의 패스워드 복사본을 지운다. 호출자가 가진 입력 배열 등 다른 복사본까지 지우는 것은 아니다.

## 3. Argon2id

Spring Security의 `spring-security-crypto`와 BouncyCastle 구현을 사용한다.

```java
PasswordEncoder encoder = new Argon2PasswordEncoder(
        16,        // salt 바이트 수
        32,        // 해시 바이트 수
        1,         // 병렬도
        19 * 1024, // 메모리 KiB
        2);        // 반복 횟수
String stored = encoder.encode(rawPassword);
boolean ok = encoder.matches(rawPassword, stored);
```

저장 문자열에는 salt와 파라미터가 포함된다. 검증은 직접 분해·비교하기보다 `matches()`를 사용한다.

## 4. HKDF

JDK 25의 정식 KDF API를 사용하는 예다. JDK 24에서는 preview API였으며, 해당 API를 사용할 수 없는 환경에서는 BouncyCastle의 `HKDFBytesGenerator` 등을 검토한다.

```java
KDF hkdf = KDF.getInstance("HKDF-SHA256");
AlgorithmParameterSpec params = HKDFParameterSpec.ofExtract()
        .addIKM(sharedSecret)
        .addSalt(salt)
        .thenExpand("aes-encryption".getBytes(StandardCharsets.UTF_8), 32);
SecretKey aesKey = hkdf.deriveKey("AES", params);
```

`sharedSecret`과 `salt`는 프로토콜에서 제공한 값이다. 필요한 타입은 `javax.crypto.KDF`, `javax.crypto.spec.HKDFParameterSpec`, `java.security.spec.AlgorithmParameterSpec` 등이다.

---

## Sources

- [Oracle JDK 25 JCA Reference: KDF](https://docs.oracle.com/en/java/javase/25/security/java-cryptography-architecture-jca-reference-guide.html)
- [Spring Security Password Storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [JEP 510: Key Derivation Function API](https://openjdk.org/jeps/510)
- [JDK 25 Security Enhancements](https://seanjmullan.org/blog/2025/09/23/jdk25)
- [Oracle JDK 25: KDF](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/javax/crypto/KDF.html)
- [Oracle JDK 25: HKDFParameterSpec](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/javax/crypto/spec/HKDFParameterSpec.html)

---

## Related pages

- [[kdf]]
