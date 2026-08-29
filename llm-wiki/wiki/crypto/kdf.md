---
title: KDF (Key Derivation Function)
updated: 2026-07-08 10:32:15
tags:
  - crypto
  - kdf
  - password
  - security
  - java
---

## 1. 목적

암호학적 키가 아닌 입력(패스워드, DH 공유 비밀 등)으로부터 **암호학적으로 안전한 키를 유도**하는 함수. 용도가 다른 두 계열이 있다.

- **키 스트레칭 (패스워드 기반)** — 저엔트로피 패스워드에 salt와 의도적 비용(연산·메모리)을 부과해 무차별 대입을 늦춘다 → PBKDF2·bcrypt·scrypt·Argon2. 패스워드 저장(해시)과 패스워드→암호화 키 유도에 사용.
- **키 확장 (키 기반)** — 이미 고엔트로피인 비밀(ECDH 공유 비밀, [[ml-kem]]의 공유 비밀 등)에서 용도별 키 여러 개를 유도한다 → HKDF. 비용 부과가 없다.

일반 해시(SHA-256 단발)와의 차이: **salt**로 레인보우 테이블·동일 패스워드 동일 해시 문제를 무력화하고, **비용 파라미터**로 GPU/ASIC 대량 시도 비용을 키운다.

---

## 2. 알고리즘

| 알고리즘 | 방식 | 비용 축 | OWASP 권장 최소값 | 비고 |
|---|---|---|---|---|
| **Argon2id** | 메모리 하드 (RFC 9106) | 메모리+연산+병렬 | m=19 MiB, t=2, p=1 | **1순위 권장** |
| **scrypt** | 메모리 하드 | 메모리+연산 | N=2^17, r=8, p=1 | Argon2 불가 시 |
| **bcrypt** | Blowfish 기반 | 연산 | cost ≥ 10 | 레거시용. **입력 72바이트 제한** |
| **PBKDF2** | HMAC 반복 (RFC 2898) | 연산(반복 횟수) | HMAC-SHA-256, 600,000회 | **FIPS-140 요구 환경** |
| **HKDF** | extract-then-expand (RFC 5869) | 없음 (1회 연산) | – | **패스워드용 아님** |

### 2.1. Argon2id
Password Hashing Competition(2015) 우승작. 메모리 점유(m)·반복(t)·병렬도(p)를 독립 조절한다. Argon2**i**(side-channel 내성)·Argon2**d**(GPU 내성)의 절충인 **id** 변형을 표준으로 쓴다. 메모리 하드라서 GPU/ASIC 병렬화 이득이 작다.

### 2.2. scrypt
메모리 하드 선구자. `N`(CPU/메모리 비용, 2의 거듭제곱)·`r`(블록 크기)·`p`(병렬화)로 조절. Argon2 이전 설계라 파라미터 간 상호작용이 덜 직관적이다.

### 2.3. bcrypt
cost(2^cost 반복)만 조절 가능한 연산 비용형. **입력이 72바이트로 잘리는 제한**이 있어 사전 해시(pre-hash) 우회 시도가 흔한데, 이는 별도 취약점(null byte 등)을 만들 수 있어 권장하지 않는다. 신규 시스템에는 Argon2id 권장.

### 2.4. PBKDF2
`HMAC(hash, password, salt)`를 지정 횟수 반복. 연산 비용만 있어 **메모리 하드가 아니고 GPU 병렬화에 취약**하지만, NIST 승인 알고리즘이라 FIPS-140 준수가 필요한 환경에서는 사실상 유일한 선택지다. 내부 해시는 SHA-256 이상 사용.

### 2.5. HKDF
extract(불균일 입력 → 균일한 PRK) 후 expand(PRK + `info` → 필요한 길이의 키 자료) 2단계. TLS 1.3 키 스케줄 등에서 사용. `info` 파라미터로 같은 비밀에서 **용도별로 독립적인 키**(암호화 키, MAC 키 등)를 분리 유도한다.

---

## 3. 예시 코드 (Java)

### 3.1. PBKDF2 — 표준 JCA

```java
byte[] salt = new byte[16];
SecureRandom.getInstanceStrong().nextBytes(salt);

PBEKeySpec spec = new PBEKeySpec(password, salt, 600_000, 256);  // OWASP 권장 반복
SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] hash = skf.generateSecret(spec).getEncoded();
spec.clearPassword();   // 메모리의 패스워드 제거
// 저장: salt + 반복 횟수 + hash (salt는 비밀 아님)
```

### 3.2. Argon2id — Spring Security

```java
// spring-security-crypto + bouncycastle 필요
PasswordEncoder encoder = new Argon2PasswordEncoder(
        16,        // salt 길이
        32,        // 해시 길이
        1,         // parallelism (p)
        19 * 1024, // 메모리 KiB (m=19MiB)
        2);        // 반복 (t)
String stored = encoder.encode(rawPassword);   // salt·파라미터 포함 인코딩 문자열
boolean ok = encoder.matches(rawPassword, stored);
```

BouncyCastle 직접 사용 시 `Argon2BytesGenerator` + `Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)`.

### 3.3. HKDF — JDK 25+ 표준 API (JEP 510)

```java
// javax.crypto.KDF — JDK 24 preview(JEP 478) → JDK 25 정식(JEP 510)
KDF hkdf = KDF.getInstance("HKDF-SHA256");

AlgorithmParameterSpec params = HKDFParameterSpec.ofExtract()
        .addIKM(sharedSecret)               // ECDH/ML-KEM 공유 비밀 (고엔트로피)
        .addSalt(salt)
        .thenExpand("aes-encryption".getBytes(UTF_8), 32);  // info로 용도 분리

SecretKey aesKey = hkdf.deriveKey("AES", params);
```

JDK 24 이하는 BouncyCastle `HKDFBytesGenerator` + `HKDFParameters` 사용.

> bcrypt는 표준 JCA 구현이 없다 — Spring Security `BCryptPasswordEncoder` 또는 jBCrypt 사용.

---

## 4. 보안 고려사항

- **salt** — 사용자·항목마다 유일하게 `SecureRandom`으로 16바이트 이상 생성. 비밀이 아니므로 해시와 함께 저장한다. 재사용하면 동일 패스워드가 동일 해시로 노출된다.
- **비용 파라미터 상향 주기화** — 하드웨어 발전에 맞춰 주기적으로 재평가하고, 로그인 성공 시점에 구 파라미터 해시를 신 파라미터로 **재해시**하는 마이그레이션 전략을 둔다.
- **pepper (선택)** — DB 외부(HSM·환경변수·시크릿 매니저)에 보관하는 전역 비밀을 추가 입력으로 사용. DB만 유출됐을 때 오프라인 공격을 차단한다.
- **HKDF 오용 금지** — HKDF·단순 해시는 비용이 없어 패스워드에 쓰면 무차별 대입에 무방비다. 반대로 고엔트로피 공유 비밀에 Argon2 같은 비용형 KDF는 불필요한 낭비.
- **PBKDF2 주의** — SHA-1 조합 지양. FIPS 요구가 없다면 Argon2id 우선.
- **DoS 트레이드오프** — KDF 비용은 곧 서버 부하다. 로그인 폭주·반복 호출 경로에서 CPU/메모리를 소모시키는 공격 벡터가 될 수 있다 — [[cpu-usage-troubleshooting]]의 KeyStore PBKDF 반복 호출 사례처럼 **유도 결과 캐싱·호출 빈도 설계**가 필요하다. rate limiting과 병행.
- **검증 비교** — 해시 비교는 상수 시간 비교(`MessageDigest.isEqual()`) 사용. 문자열 `equals()`는 타이밍 부채널 여지가 있다.

---

## 5. 선택 가이드

| 상황 | 선택 |
|---|---|
| 패스워드 저장 (일반) | **Argon2id** > scrypt > bcrypt |
| 패스워드 저장 (FIPS-140 준수) | PBKDF2-HMAC-SHA-256, 600k+ |
| 공유 비밀 → 세션 키 (TLS·ECDH·[[ml-kem]]) | **HKDF** |
| 패스워드 → 파일/DB 암호화 키 | Argon2id 또는 PBKDF2 |

---

## Sources
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 9106: Argon2](https://www.rfc-editor.org/rfc/rfc9106)
- [RFC 5869: HKDF](https://www.rfc-editor.org/rfc/rfc5869)
- [RFC 2898: PKCS #5 (PBKDF2)](https://www.rfc-editor.org/rfc/rfc2898)
- [JEP 510: Key Derivation Function API](https://openjdk.org/jeps/510)
- [JDK 25 Security Enhancements](https://seanjmullan.org/blog/2025/09/23/jdk25)

---

## Related pages
- [[ml-kem]]
- [[ml-dsa]]
- [[cpu-usage-troubleshooting]]
- [[openssl-keygen]]
- [[jwt]]
