---
title: KDF
updated: 2026-10-21 16:40:24
tags:
  - crypto
  - kdf
  - password
  - security
---

## 1. 개요

KDF(Key Derivation Function)는 패스워드나 공유 비밀 등의 키 자료로부터 용도에 맞는 키를 유도하는 함수다. 입력과 목적에 따라 패스워드 기반과 공유 비밀 기반으로 나눠 설명한다.

패스워드 기반 함수는 연산·메모리 비용을 부과해 패스워드 추측 비용을 높인다. 공유 비밀 기반 함수는 키 합의 등으로 확보한 비밀에서 키 자료를 추출하고 용도별 키를 유도한다. KDF 자체가 입력에 없는 비밀 엔트로피를 만들어 내는 것은 아니다.

Java 구현 예제는 [[kdf-java]]를 참고한다.

## 2. 패스워드 기반

패스워드 저장은 재입력한 값이 저장된 검증값과 일치하는지 확인하는 용도이며, 암호화 키 유도는 암호 알고리즘에 사용할 키를 만드는 용도다. 이 절은 패스워드 기반 KDF와 패스워드 저장용 해시 함수를 함께 다루며, bcrypt는 패스워드 저장용으로 설명한다.

패스워드는 후보 공간이 작으므로 빠른 일반 해시만으로 저장하지 않는다. 항목마다 다른 salt로 사전 계산의 재사용을 제한하고, 연산·메모리 비용을 부과해 각 추측의 비용을 높인다.

알고리즘별 수치는 OWASP Password Storage Cheat Sheet가 제시한 최소 구성의 예다. 서버의 동시 로그인 수, 처리 지연, 메모리 한도를 측정해 실제 비용을 정하고 주기적으로 재평가한다.

### 2.1. Argon2id

Argon2i와 Argon2d의 메모리 접근 방식을 조합해 부채널과 병렬 추측 공격을 함께 고려한 변형이다. 신규 패스워드 저장에 우선 권고된다.

`m`은 전체 메모리 사용량이며 단위는 KiB다. `t`는 메모리를 순회하는 횟수, `p`는 병렬도다. `p`를 늘려도 전체 메모리가 그 배수로 증가하지는 않는다. 최소 구성의 예는 `m=19456`인 19 MiB, `t=2`, `p=1`이다. 라이브러리의 메모리 단위와 저장값 인코딩 형식도 확인한다.

### 2.2. scrypt

Argon2id를 사용할 수 없는 경우 검토한다. `N`은 CPU·메모리 비용, `r`은 블록 크기, `p`는 병렬화 파라미터다. `N`은 1보다 큰 2의 거듭제곱이어야 한다.

최소 구성의 예는 `N=2^17`, `r=8`, `p=1`이며, 약 128 MiB의 메모리를 요구한다. 동시 실행 수를 고려해 서비스의 메모리 한도 안에서 설정한다.

### 2.3. bcrypt

Argon2id나 scrypt를 사용할 수 없는 기존 시스템의 패스워드 저장에 사용한다. `cost`에 따라 반복 비용이 증가하며, OWASP는 10 이상을 권고한다.

대부분의 구현에서 입력은 최대 72바이트다. 긴 패스워드의 처리와 UTF-8 바이트 길이를 확인하고, 라이브러리가 길이 초과를 거부하는지 잘라내는지 구분한다. 사전 해시를 임의로 추가하면 null byte 처리나 다른 공격 경로가 생길 수 있으므로 검증된 구성을 따른다.

### 2.4. PBKDF2

PBKDF2(Password-Based Key Derivation Function 2)는 PRF(Pseudorandom Function)를 반복 적용해 키 자료를 유도한다. 각 출력 블록에서 반복 결과를 XOR하고, 블록들을 연결한 뒤 지정한 바이트 길이만큼 사용한다. 단순히 이전 해시 결과를 반복해서 해시하는 것과는 구조가 다르다.

HMAC(Hash-based Message Authentication Code)을 PRF로 사용할 수 있다. OWASP는 패스워드 저장에 HMAC-SHA-256을 사용할 때 반복 횟수 600,000회 이상을 권고한다. PBKDF2는 메모리 비용을 부과하는 설계는 아니다.

FIPS 검증 구현이 필요한 패스워드 처리에 우선 검토할 수 있다. 알고리즘 이름만으로 FIPS 준수가 충족되지는 않으므로 사용하는 암호 모듈의 검증 범위와 운영 조건을 함께 확인한다.

## 3. 공유 비밀 기반

### 3.1. HKDF

HKDF(HMAC-based Extract-and-Expand Key Derivation Function)는 RFC 5869의 extract-then-expand 구조다. Extract는 IKM(Input Keying Material)을 고정 길이의 PRK(Pseudorandom Key)로 추출하고, Expand는 PRK와 `info`에서 필요한 길이의 OKM(Output Keying Material)을 만든다.

$$PRK = HMAC(salt, IKM)$$
$$OKM = HKDF\text{-}Expand(PRK, info, L)$$

Extract에서 `salt`는 HMAC의 키, IKM은 메시지 입력이다. PRK의 길이는 해시 출력 길이인 $HashLen$바이트이며, $L$은 필요한 OKM의 바이트 길이다.

패스워드 추측을 늦추기 위한 비용 파라미터는 없다. Expand의 HMAC 호출 횟수는 $\lceil L/HashLen \rceil$이며, 최대 출력 길이는 $255\times HashLen$바이트다. `salt`와 `info`의 역할은 §3.2에서 설명한다.

### 3.2. salt와 info

패스워드용 salt와 HKDF의 salt는 모두 비밀일 필요가 없다. 패스워드용 salt는 항목별로 다르게 생성해 같은 패스워드의 저장값을 구분한다.

HKDF의 salt는 입력 키 자료와 독립적으로 선택하고 프로토콜의 추출 조건에 맞춰 사용한다. RFC 5869는 salt 생략과 재사용을 허용하므로 패스워드용 salt의 유일성 요구를 그대로 적용하지 않는다. 외부에서 전달받는 salt의 선택이나 조작 가능성은 프로토콜의 인증 조건에 따라 확인한다.

`info`는 출력 키를 특정 문맥에 연결하는 입력이며 비밀일 필요가 없다. 같은 비밀에서 서로 다른 키를 유도할 때는 프로토콜·알고리즘·방향·키 용도를 구분한다. 예를 들어 클라이언트 송신용과 서버 송신용 키에 각각 `client-to-server`, `server-to-client`처럼 다른 값을 사용한다. 실제 인코딩과 값은 사용하는 프로토콜을 따른다.

## 4. 용도

| 용도 | 적용 방식 |
|---|---|
| 패스워드 검증 | salt와 비용 파라미터를 포함한 검증값을 저장하고 재입력한 패스워드를 검증. 알고리즘별 기준은 §2 참조 |
| 파일 암호화 키 유도 | 패스워드에서 포맷·프로토콜이 정한 길이의 암호화 키 유도. 패스워드 기반 함수는 §2 참조 |
| 세션 키 유도 | 키 합의 또는 [[ml-kem]]으로 확보한 공유 비밀에서 프로토콜이 정한 키 유도. HKDF의 구조와 용도 분리는 §3 참조 |

## 5. 운영

- 패스워드용 salt는 CSPRNG로 항목마다 새로 생성하고 저장값과 함께 보관한다. [[kdf-java]]의 예제는 16바이트를 사용한다.
- 비용과 알고리즘을 저장값에 기록하고, 로그인 검증 성공 후 필요하면 새 설정으로 재해시한다.
- pepper를 사용한다면 [[hsm]]이나 시크릿 저장소 등 DB와 분리된 경계에서 보호한다. DB 유출에 대한 추가 방어이며 패스워드용 KDF를 대체하지 않는다.
- 로그인에는 호출 빈도 제한과 동시 실행 한도를 적용한다. 비용 증가는 정상 요청과 공격 요청 모두의 서버 부하를 높인다.
- [[cpu-usage-troubleshooting]]의 KeyStore 반복 처리처럼 동일 키 자료의 불필요한 재유도를 줄일 수 있는 경로는 별도로 점검한다. 로그인 패스워드나 검증 결과를 일반적으로 캐시하라는 의미는 아니다.[^1]
- HKDF는 패스워드 추측을 늦추지 않으므로 패스워드 저장에 사용하지 않는다. 패스워드 검증은 라이브러리 API를 우선 사용하고, 인증값을 직접 비교해야 하면 상수 시간 비교를 사용한다.

---

## Sources

- [Spring Security Password Storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 7914: scrypt](https://www.rfc-editor.org/rfc/rfc7914.html)
- [RFC 9106: Argon2](https://www.rfc-editor.org/rfc/rfc9106)
- [RFC 5869: HKDF](https://www.rfc-editor.org/rfc/rfc5869)
- [RFC 8018: PKCS #5 v2.1 (PBKDF2)](https://www.rfc-editor.org/rfc/rfc8018)

---

## Related pages

- [[kdf-java]]
- [[ml-kem]]
- [[ml-dsa]]
- [[cpu-usage-troubleshooting]]
- [[openssl-keygen]]
- [[jwt]]

---

[^1]: 운영 판단. 패스워드 검증의 비용·요청 제한은 OWASP 권고에 근거하며, 재유도 축소는 내부 KeyStore 반복 호출 사례에 적용 범위를 제한했다. 로그인 검증 결과를 캐시하는 설계는 별도 위협 모델과 만료·폐기 정책을 요구한다.
