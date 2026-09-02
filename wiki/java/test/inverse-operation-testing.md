---
title: 역연산 함수 테스트 — Known Answer Test·라운드트립
updated: 2026-08-31 14:25:48
tags:
  - java
  - testing
  - best-practices
  - known-answer-test
  - crypto
---

## 1. 문제 정의

어떤 함수 `f`를 테스트하려는데, **유효한 입력을 만들려면 그 역연산 `f⁻¹`이 필요한** 경우가 있다.

- **복호화** `decrypt` — 유효한 암호문을 얻으려면 암호화가 필요
- **역직렬화** `deserialize`/`parse` — 유효한 바이트열/문자열이 필요
- **압축 해제** `decompress` — 유효한 압축 데이터가 필요
- **디코딩** `decode`(Base64/Protobuf 등) — 인코딩된 입력이 필요

문제는 라이브러리가 **역방향(`f`)을 제공하지 않거나**(예: 복호화만 노출), 제공하더라도 그것 역시 검증 대상(SUT)일 때다. 단방향 함수인 **해시**처럼 애초에 역이 존재하지 않는 경우도 같은 범주다.

---

## 2. 안티패턴 — SUT를 미러링한 역함수 자작

가장 흔한 유혹은 **`f⁻¹`의 구현을 보고 그 역연산을 직접 만들어** 입력을 생성하는 것이다. 이는 자기충족적(tautological) 테스트가 된다.

- **같은 오해를 공유** — 내가 만든 `f`와 라이브러리 `f⁻¹`이 같은 잘못된 가정(패딩·엔디안·인코딩·IV 위치 등)을 가지면, 테스트는 통과하지만 실제 데이터에선 실패한다. 즉 [[good-test-practices]] §4.3의 **Behavioral**하지 못한 테스트(버그를 못 잡음)다.
- **구조에 결합** — `f⁻¹`의 내부를 뒤집은 것이라 라이브러리 내부 구현이 바뀌면 함께 깨진다(**Structure-insensitive** 위반).
- 결국 검증 대상이 "라이브러리 `f⁻¹`"이 아니라 "내가 만든 `f`의 역"이 된다.

> 핵심: 역방향을 쓰더라도 그것이 **SUT와 독립적**이어야 한다. SUT를 보고 만든 미러는 독립이 아니다.

---

## 3. 전략

### 3.1. Known Answer Test (테스트 벡터) ⭐ — 1순위

**신뢰할 수 있는 독립 출처**가 만든 `입력 → 기대 출력` 고정 쌍을 픽스처로 두고 결과를 검증한다. 역방향 구현이 전혀 없어도 성립하며, 단방향 함수(해시)의 유일한 검증 수단이다.

출처 우선순위:
1. 알고리즘 **공식 규격의 test vector**(NIST CAVP, RFC 부록 등)
2. 성숙한 **독립 도구**(`openssl` 등)나 다른 성숙한 라이브러리가 생성한 값
3. **실제 데이터를 만든 운영 시스템**의 샘플(golden file) — 독점 포맷일 때

```java
// 출처: NIST CAVP AES-GCM test vector #N (재현 가능하도록 출처 명기)
static final byte[] KEY        = hex("feffe9928665731c6d6a8f9467308308");
static final byte[] IV         = hex("cafebabefacedbaddecaf888");
static final byte[] CIPHERTEXT = hex("42831ec2217774244b7221b784d0d49c...");
static final byte[] TAG        = hex("4d5c2af327cd64a62cf35abd2ba6fab4");
static final String EXPECTED   = "hello world";

@Test
void 알려진_벡터를_복호화한다() {
    byte[] plaintext = library.decrypt(CIPHERTEXT, KEY, IV, TAG);
    assertThat(new String(plaintext, UTF_8)).isEqualTo(EXPECTED);
}
```

### 3.2. 독립·권위 있는 구현으로 라운드트립 — 2순위

역방향이 **표준 알고리즘**이면, 미러가 아니라 **독립적으로 신뢰되는 구현**(JDK JCE `Cipher`, 다른 성숙한 라이브러리, `openssl`)으로 입력을 만든 뒤 SUT로 역연산한다.

```java
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");   // JDK 표준 = 독립 신뢰원
c.init(ENCRYPT_MODE, keySpec, gcmSpec);
byte[] ciphertext = c.doFinal("hello".getBytes(UTF_8));

assertThat(library.decrypt(ciphertext, key, iv))
    .isEqualTo("hello".getBytes(UTF_8));
```

### 3.3. 라운드트립 — 보조

라이브러리가 `f`와 `f⁻¹`을 모두 제공하면 `f⁻¹(f(x)) == x`를 검증할 수 있다. 작성이 쉽고 넓은 입력을 커버하지만 **한계가 분명**하다.

- 두 방향이 **같은 버그를 공유**하면(예: 양쪽 다 동일하게 잘못된 인코딩) 통과해버린다.
- 따라서 라운드트립은 **KAT를 대체하지 못하고 보완**한다. 최소 하나의 KAT로 "절대 기준"을 고정하고, 라운드트립으로 입력 다양성을 넓히는 조합이 좋다.

### 3.4. 프로퍼티/메타모픽 테스트 — 보완

정확한 출력을 몰라도 성립하는 성질을 검증한다. 예: `decompress(x)`의 길이 ≥ 입력 길이, `decode`가 특정 구조를 만족, 동일 입력은 항상 동일 출력(결정성). 프로퍼티 기반 도구(jqwik 등)로 무작위 입력에 적용할 수 있다.

---

## 4. 실제 라이브러리는 어떻게 하는가

역연산 검증의 정석은 **하드코딩된 테스트 벡터(KAT)**다. 주요 프로젝트가 실제로 이 방식을 쓴다.

### 4.1. BouncyCastle (`GCMTest`)

`GCMTest.java`는 `TEST_VECTORS` 2D 배열에 **하드코딩된 hex 상수**(K, P, A, IV, C, T)를 두고, 각 벡터에 대해 암호화 결과가 기대 암호문 `C`·태그 `T`와 같은지, 그리고 **복호화 결과가 원문 `P`와 같은지**를 함께 검증한다. 하나의 고정 벡터가 **양방향을 동시에** 검증한다.

```java
if (!areEqual(C, data))
    fail("incorrect encrypt in: " + testName);
if (!areEqual(T, mac))
    fail("getMac() returned wrong mac in: " + testName);
// ... 이어서 복호화 결과가 P와 같은지 확인
```
(출처: bcgit/bc-java `GCMTest.java`)

### 4.2. NIST CAVP — Known Answer Test

FIPS 승인 알고리즘 검증 프로그램(CAVP)은 **KAT**를 기본 검증 수단으로 쓴다. 규격이 제공하는 정적 벡터로 S-box 등 비선형 요소를 남김없이 자극하며, 구현이 같은 결과를 내지 못하면 "벤더 구현에 문제가 있다"고 판정한다. 고정 벡터만으로는 "정답만 외운" 구현을 걸러낼 수 없어, 의사난수 데이터를 반복 적용하는 **Monte Carlo Test(MCT)**로 보완한다. (출처: NIST CAVP, CAVP FAQ)

### 4.3. Project Wycheproof

Google이 시작한 **구현 비종속(implementation-agnostic) 테스트 벡터** 저장소다. 실행 하니스가 아니라 **JSON 형식의 테스트 벡터**(키·IV·암호문·태그·기대 결과·`result` 등)를 배포하고, 각 라이브러리가 자기 파이프라인에서 출력과 기대값을 대조한다. AES-GCM·ECDSA·RSA·ML-KEM 등 주요 알고리즘의 **알려진 공격·규격 불일치·엣지 케이스**를 다룬다. (출처: C2SP/wycheproof)

> 세 사례의 공통점: **정답을 SUT 밖에서(규격·독립 도구·커뮤니티) 확보해 고정값으로 박아두고 대조**한다. 이것이 §3.1 KAT의 실증이다.

---

## 5. 실무 지침

- **벡터는 불변 픽스처**로 취급 — 테스트가 실패한다고 벡터를 "맞춰서" 바꾸면 검증력이 사라진다.
- **출처를 반드시 기록** — 어떤 규격/도구/파라미터로 만들었는지 주석·파일 메타로 남겨 재현·감사 가능하게.
- **필요한 값 전부 고정** — 복호화라면 키·IV/Nonce·(AEAD면) 태그·AAD·기대 평문을 한 세트로.
- **여러 벡터로 경계 커버** — 빈 입력, 블록 경계, 멀티바이트(UTF-8) 등. [[junit-parameterized-test]] `@CsvFileSource`나 [[spock]] 데이터 테이블로 표 관리.
- **실패 경로도 벡터로** — 잘못된 키, **변조된 입력**(AEAD는 인증 실패 예외 필수), 잘린/깨진 입력 → 예외 검증. Wycheproof가 강조하는 지점이다.
- **리터럴 또는 `resources/` 파일**로 두어 실행 시점 계산이 개입하지 않게 한다.

---

## 6. 요약

- 역연산이 필요한 테스트에서 **SUT를 미러링한 역함수 자작은 금물**(자기충족·구조 결합).
- **Known Answer Test(독립 출처의 고정 테스트 벡터)**가 1순위이며, 역방향이 없어도·단방향(해시)이어도 성립한다.
- 표준 알고리즘이면 **독립 구현으로 라운드트립**(2순위), 양방향 SUT 라운드트립은 KAT의 **보완**일 뿐.
- BouncyCastle·NIST CAVP·Wycheproof 모두 **정답을 SUT 밖에서 확보해 고정 벡터로 대조**한다.
- 벡터는 불변·출처 명기·경계/실패 경로 포함으로 관리한다.

---

## Sources
- BouncyCastle bc-java — GCMTest.java (하드코딩 테스트 벡터·암복호화 동시 검증): https://github.com/bcgit/bc-java/blob/main/core/src/test/java/org/bouncycastle/crypto/test/GCMTest.java
- NIST Cryptographic Algorithm Validation Program (CAVP) — Block Ciphers: https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/block-ciphers
- NIST CAVP FAQ (KAT vs Monte Carlo Test): https://csrc.nist.gov/csrc/media/Projects/cryptographic-algorithm-validation-program/documents/CAVPFAQ.pdf
- Project Wycheproof (C2SP/wycheproof) — 테스트 벡터 기반 검증: https://github.com/C2SP/wycheproof

---

## Related pages
- [[good-test-practices]] — Behavioral/Structure-insensitive, 결과 검증 원칙
- [[test-double]] — 미러 대신 독립 구현/고정값을 쓰는 이유(상태 검증)
- [[junit-parameterized-test]] — 다수 테스트 벡터를 데이터 주도로 관리
- [[ml-kem]] — PQC KEM (Wycheproof가 다루는 알고리즘 예)
