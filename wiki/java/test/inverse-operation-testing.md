---
title: 역연산 함수 테스트
updated: 2026-10-22 23:09:21
tags:
  - java
  - testing
  - best-practices
  - known-answer-test
  - crypto
---

## 1. 개요

어떤 함수 `f`를 테스트하려는데 유효한 입력을 만들려면 그 역연산 `f⁻¹`이 필요한 경우가 있다.

- **복호화(`decrypt`)**: 유효한 암호문을 얻으려면 암호화가 필요
- **역직렬화(`deserialize`/`parse`)**: 유효한 바이트열·문자열이 필요
- **압축 해제(`decompress`)**: 유효한 압축 데이터가 필요
- **디코딩(`decode`, Base64/Protobuf 등)**: 인코딩된 입력이 필요

문제는 라이브러리가 역방향(`f`)을 제공하지 않거나(예: 복호화만 노출), 제공하더라도 그것 역시 검증 대상(SUT, System Under Test)일 때다. 단방향 함수인 해시처럼 애초에 역이 존재하지 않는 경우도 같은 범주다.

---

## 2. 미러 역함수 안티패턴

가장 흔한 유혹은 `f⁻¹`의 구현을 보고 그 역연산을 직접 만들어 입력을 생성하는 것이다. 이는 자기충족적(tautological) 테스트가 된다.

- **같은 오해 공유**: 직접 만든 `f`와 라이브러리 `f⁻¹`이 같은 잘못된 가정(패딩·엔디안·인코딩·IV 위치 등)을 가지면 테스트는 통과하지만 실제 데이터에서는 실패한다. [[good-test-practices]] §4.3의 Behavioral 속성을 만족하지 못하는 테스트다.
- **구조에 결합**: `f⁻¹`의 내부를 뒤집은 것이라 라이브러리 내부 구현이 바뀌면 함께 깨진다. Structure-insensitive 속성 위반이다.
- **검증 대상 변질**: 검증 대상이 라이브러리 `f⁻¹`이 아니라 직접 만든 `f`의 역이 된다.

역방향을 쓰더라도 그것은 SUT와 독립적이어야 한다. SUT를 보고 만든 미러는 독립이 아니다.

---

## 3. 전략

우선순위는 §3.1 KAT, §3.2 독립 구현 라운드트립 순이며 §3.3·§3.4는 보조 수단이다.

### 3.1. Known Answer Test

신뢰할 수 있는 독립 출처가 만든 입력과 기대 출력의 고정 쌍을 픽스처로 두고 결과를 검증한다. 역방향 구현이 전혀 없어도 성립하며, 단방향 함수(해시)의 유일한 검증 수단이다. KAT(Known Answer Test)의 출처 우선순위는 다음과 같다.

1. 알고리즘 공식 규격의 test vector(NIST CAVP, RFC 부록 등)
2. 성숙한 독립 도구(`openssl` 등)나 다른 성숙한 라이브러리가 생성한 값
3. 독점 포맷일 때 실제 데이터를 만든 운영 시스템의 샘플(golden file)

```java
// 출처: BouncyCastle GCMTest "Test Case 3" (재현 가능하도록 출처 명기)
static final byte[] KEY        = hex("feffe9928665731c6d6a8f9467308308");
static final byte[] IV         = hex("cafebabefacedbaddecaf888");
static final byte[] CIPHERTEXT = hex("42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e"
                                   + "21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e091473f5985");
static final byte[] TAG        = hex("4d5c2af327cd64a62cf35abd2ba6fab4");
static final byte[] EXPECTED   = hex("d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a72"
                                   + "1c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255");

@Test
void 알려진_벡터를_복호화한다() {
    byte[] plaintext = library.decrypt(CIPHERTEXT, KEY, IV, TAG);
    assertThat(plaintext).isEqualTo(EXPECTED);
}
```

### 3.2. 독립 구현 라운드트립

역방향이 표준 알고리즘이면 미러가 아니라 독립적으로 신뢰되는 구현(JDK JCE `Cipher`, 다른 성숙한 라이브러리, `openssl`)으로 입력을 만든 뒤 SUT로 역연산한다.

```java
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");   // JDK 표준 구현을 독립 신뢰원으로 사용
c.init(ENCRYPT_MODE, keySpec, gcmSpec);
byte[] ciphertext = c.doFinal("hello".getBytes(UTF_8));

assertThat(library.decrypt(ciphertext, key, iv))
    .isEqualTo("hello".getBytes(UTF_8));
```

### 3.3. 자체 라운드트립

라이브러리가 `f`와 `f⁻¹`을 모두 제공하면 `f⁻¹(f(x)) == x`를 검증할 수 있다. 작성이 쉽고 넓은 입력을 커버하지만, 두 방향이 같은 버그를 공유하면(예: 양쪽 다 동일하게 잘못된 인코딩) 통과해 버린다. 따라서 라운드트립은 KAT를 대체하지 못하고 보완한다. 최소 하나의 KAT로 기준을 고정하고 라운드트립으로 입력 다양성을 넓힌다.

### 3.4. 프로퍼티·메타모픽 테스트

정확한 출력을 몰라도 성립하는 성질을 검증한다. `decode` 결과가 특정 구조를 만족하는지, 동일 입력에 항상 동일 출력을 내는지(결정성) 등이 해당한다. 프로퍼티 기반 도구(jqwik 등)로 무작위 입력에 적용할 수 있다.

---

## 4. 적용 사례

역연산 검증에는 하드코딩된 테스트 벡터(KAT)가 주로 쓰이며, 주요 프로젝트도 이 방식을 사용한다.

### 4.1. BouncyCastle

`GCMTest.java`는 `TEST_VECTORS` 2차원 배열에 하드코딩된 hex 상수(K, P, A, IV, C, T)를 두고, 각 벡터에 대해 암호화 결과가 기대 암호문 `C`·태그 `T`와 같은지와 복호화 결과가 원문 `P`와 같은지를 함께 검증한다. 하나의 고정 벡터가 양방향을 동시에 검증한다.

```java
// 출처: bcgit/bc-java GCMTest.java
if (!areEqual(C, data))
    fail("incorrect encrypt in: " + testName);
if (!areEqual(T, mac))
    fail("getMac() returned wrong mac in: " + testName);
// ... 이어서 복호화 결과가 P와 같은지 확인
```

### 4.2. NIST CAVP

FIPS 승인 알고리즘 검증 프로그램(CAVP, Cryptographic Algorithm Validation Program)은 KAT를 기본 검증 수단으로 쓴다. 규격이 제공하는 정적 벡터로 S-box 등 비선형 요소를 모두 자극하며, 구현이 같은 결과를 내지 못하면 벤더 구현에 문제가 있다고 판정한다. 고정 벡터만으로는 정답만 맞추는 구현을 걸러낼 수 없어 의사난수 데이터를 반복 적용하는 Monte Carlo Test(MCT)로 보완한다.

### 4.3. Project Wycheproof

Google이 시작한 구현 비종속(implementation-agnostic) 테스트 벡터 저장소다. 실행 하니스가 아니라 JSON 형식의 테스트 벡터(키·IV·암호문·태그·기대 결과·`result` 등)를 배포하고, 각 라이브러리가 자기 파이프라인에서 출력과 기대값을 대조한다. AES-GCM·ECDSA·RSA·ML-KEM 등 주요 알고리즘의 알려진 공격·규격 불일치·엣지 케이스를 다룬다.

세 사례 모두 정답을 SUT 밖(규격·독립 도구·커뮤니티)에서 확보해 고정값으로 두고 대조한다. §3.1 KAT의 실제 적용 예다.

---

## 5. 작성 지침

- **불변 픽스처**: 테스트가 실패한다고 벡터를 결과에 맞춰 바꾸면 검증력이 사라진다.
- **출처 기록**: 어떤 규격·도구·파라미터로 만들었는지 주석이나 파일 메타데이터로 남겨 재현·감사가 가능하게 한다.
- **전체 값 고정**: 복호화라면 키·IV/Nonce·태그(AEAD)·AAD·기대 평문을 한 세트로 고정한다.
- **경계 커버**: 빈 입력, 블록 경계, 멀티바이트(UTF-8) 등 여러 벡터를 두고 [[junit-parameterized-test]]의 `@CsvFileSource`나 [[spock]] 데이터 테이블로 관리한다.
- **실패 경로**: 잘못된 키, 변조된 입력(AEAD는 인증 실패 예외 필수), 잘리거나 깨진 입력에 대해 예외를 검증한다. Wycheproof가 강조하는 지점이다.
- **고정 저장**: 리터럴이나 `resources/` 파일로 두어 실행 시점 계산이 개입하지 않게 한다.

---

## Sources
- [BouncyCastle: bc-java GCMTest.java](https://github.com/bcgit/bc-java/blob/main/core/src/test/java/org/bouncycastle/crypto/test/GCMTest.java)
- [NIST: CAVP Block Ciphers](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/block-ciphers)
- [NIST: CAVP FAQ](https://csrc.nist.gov/csrc/media/Projects/cryptographic-algorithm-validation-program/documents/CAVPFAQ.pdf)
- [C2SP: Project Wycheproof](https://github.com/C2SP/wycheproof)

---

## Related pages
- [[good-test-practices]]
- [[test-double]]
- [[junit-parameterized-test]]
- [[ml-kem]]
