---
title: KDF
updated: 2026-10-20 17:46:04
tags:
  - crypto
  - kdf
  - password
  - security
  - java
---

## 1. 개요

KDF(Key Derivation Function)는 패스워드나 공유 비밀 등의 키 자료로부터 용도에 맞는 키를 유도하는 함수다. 패스워드 기반 함수는 추측 비용을 높이는 데, 공유 비밀 기반 함수는 키 자료의 추출과 용도 분리에 초점을 둔다. KDF 자체가 입력에 없는 비밀 엔트로피를 만들어 내는 것은 아니다.

## 2. 선택

| 상황 | 선택 |
|---|---|
| 신규 패스워드 저장 | Argon2id를 우선 검토하고, 사용할 수 없으면 scrypt 검토 |
| 기존 bcrypt 시스템 | 입력 길이와 비용을 점검하고 필요 시 마이그레이션 |
| FIPS 검증 구현이 필요한 패스워드 처리 | PBKDF2-HMAC-SHA-256 우선 검토 |
| ECDH·[[ml-kem]] 공유 비밀에서 세션 키 유도 | 프로토콜이 정한 HKDF 등 사용 |
| 패스워드에서 파일 암호화 키 유도 | 포맷·프로토콜이 정한 Argon2id 또는 PBKDF2 등 사용 |

알고리즘 이름만으로 FIPS 준수가 충족되지는 않는다. 사용하는 암호 모듈의 검증 범위와 운영 조건을 함께 확인한다.

## 3. 패스워드 기반

패스워드는 후보 공간이 작으므로 빠른 일반 해시만으로 저장하지 않는다. 항목마다 다른 salt로 사전 계산의 재사용을 제한하고, 연산·메모리 비용을 부과해 각 추측의 비용을 높인다.

다음 수치는 OWASP Password Storage Cheat Sheet의 권고 구성이다. 서버의 동시 로그인 수, 처리 지연, 메모리 한도를 측정해 실제 비용을 정하고 주기적으로 재평가한다.

| 알고리즘 | 비용 파라미터 | OWASP 권고 구성 | 제약 |
|---|---|---|---|
| Argon2id | 메모리 m, 반복 t, 병렬도 p | m=19 MiB, t=2, p=1 | 신규 패스워드 저장에 우선 권고 |
| scrypt | N, r, p | N=2^17, r=8, p=1 | Argon2id를 사용할 수 없는 경우 검토 |
| bcrypt | cost | cost ≥ 10 | 레거시용. 대부분의 구현에서 입력 72바이트 제한 |
| PBKDF2-HMAC-SHA-256 | 반복 횟수 | 600,000회 이상 | 메모리 비용을 부과하는 설계는 아님 |

### 3.1. Argon2id

메모리 사용량·반복 횟수·병렬도를 조절한다. Argon2i와 Argon2d의 메모리 접근 방식을 조합해 부채널과 병렬 추측 공격을 함께 고려한 변형이다. 정확한 파라미터는 라이브러리의 단위와 인코딩 형식도 확인한다.

### 3.2. scrypt

`N`은 CPU·메모리 비용, `r`은 블록 크기, `p`는 병렬화 파라미터다. `N`은 2의 거듭제곱이어야 한다. 파라미터별 메모리 요구량을 확인해 서비스 한도 안에서 설정한다.

### 3.3. bcrypt

`cost`에 따라 반복 비용이 증가한다. 긴 패스워드의 처리와 UTF-8 바이트 길이를 확인하고, 라이브러리가 길이 초과를 거부하는지 잘라내는지 구분한다. 사전 해시를 임의로 추가하면 null byte 처리나 다른 공격 경로가 생길 수 있으므로 검증된 구성을 따른다.

### 3.4. PBKDF2

PRF를 반복 적용한 결과를 XOR해 키 자료를 유도하며 HMAC-SHA-256 등을 PRF로 사용한다. FIPS 검증 구현이 필요한 환경에서 우선 검토할 수 있다. 단순히 HMAC 결과에 다시 HMAC을 적용하는 반복 해시와는 구조가 다르다.

## 4. 공유 비밀 기반

### 4.1. HKDF

HKDF는 RFC 5869의 extract-then-expand 구조다. Extract는 입력 키 자료 IKM을 고정 길이의 의사난수 키 PRK로 추출하고, Expand는 PRK와 `info`에서 필요한 길이의 키 자료를 만든다.

$$PRK = HMAC(salt, IKM)$$
$$OKM = HKDF\text{-}Expand(PRK, info, L)$$

패스워드 추측을 늦추기 위한 비용 파라미터는 없다. Expand의 HMAC 호출 횟수는 출력 길이 $L$에 따라 증가하며, 최대 출력 길이는 $255\times HashLen$바이트다. 같은 비밀을 여러 용도로 사용할 때는 `info`로 프로토콜·알고리즘·키 용도를 구분한다.

### 4.2. salt와 info

패스워드용 salt는 항목별로 다르게 생성해 같은 패스워드의 저장값을 구분한다. 반면 HKDF의 salt는 비밀이 아니며 프로토콜의 추출 조건에 맞춰 사용한다. RFC 5869는 salt 생략과 재사용을 허용하므로 패스워드용 salt의 유일성 요구를 그대로 적용하지 않는다. `info` 역시 비밀이 아니며 출력 키의 용도를 바인딩한다.

## 5. Java 예제

### 5.1. PBKDF2

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

### 5.2. Argon2id

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

### 5.3. HKDF

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

## 6. 운영

- 패스워드용 salt는 CSPRNG로 항목마다 새로 생성하고 저장값과 함께 보관한다. 예제는 16바이트를 사용한다.
- 비용과 알고리즘을 저장값에 기록하고, 로그인 검증 성공 후 필요하면 새 설정으로 재해시한다.
- pepper를 사용한다면 [[hsm]]이나 시크릿 저장소 등 DB와 분리된 경계에서 보호한다. DB 유출에 대한 추가 방어이며 패스워드용 KDF를 대체하지 않는다.
- 로그인에는 호출 빈도 제한과 동시 실행 한도를 적용한다. 비용 증가는 정상 요청과 공격 요청 모두의 서버 부하를 높인다.
- [[cpu-usage-troubleshooting]]의 KeyStore 반복 처리처럼 동일 키 자료의 불필요한 재유도를 줄일 수 있는 경로는 별도로 점검한다. 로그인 패스워드나 검증 결과를 일반적으로 캐시하라는 의미는 아니다.[^1]
- HKDF는 패스워드 추측을 늦추지 않으므로 패스워드 저장에 사용하지 않는다. 패스워드 검증은 라이브러리 API를 우선 사용하고, 인증값을 직접 비교해야 하면 상수 시간 비교를 사용한다.

---

## Sources

- [Oracle JDK 25 JCA Reference: KDF](https://docs.oracle.com/en/java/javase/25/security/java-cryptography-architecture-jca-reference-guide.html)
- [Spring Security Password Storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 9106: Argon2](https://www.rfc-editor.org/rfc/rfc9106)
- [RFC 5869: HKDF](https://www.rfc-editor.org/rfc/rfc5869)
- [RFC 8018: PKCS #5 v2.1 (PBKDF2)](https://www.rfc-editor.org/rfc/rfc8018)
- [JEP 510: Key Derivation Function API](https://openjdk.org/jeps/510)
- [JDK 25 Security Enhancements](https://seanjmullan.org/blog/2025/09/23/jdk25)

---

## Related pages

- [[ml-kem]]
- [[ml-dsa]]
- [[cpu-usage-troubleshooting]]
- [[openssl-keygen]]
- [[jwt]]

---

[^1]: 운영 판단. 패스워드 검증의 비용·요청 제한은 OWASP 권고에 근거하며, 재유도 축소는 내부 KeyStore 반복 호출 사례에 적용 범위를 제한했다. 로그인 검증 결과를 캐시하는 설계는 별도 위협 모델과 만료·폐기 정책을 요구한다.
