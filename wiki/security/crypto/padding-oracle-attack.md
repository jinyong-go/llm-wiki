---
title: Padding Oracle Attack
updated: 2026-09-04 17:00:33
tags:
  - crypto
  - cbc
  - padding-oracle
  - block-cipher
  - security
---

## 1. 개요

Padding Oracle Attack은 **CBC 모드로 암호화된 데이터의 복호화 과정에서 패딩 유효성 여부가 공격자에게 노출**될 때, 이를 이용해 **키 없이 평문을 복원**하거나 **임의 평문을 암호문으로 위조**하는 공격이다. 2002년 Serge Vaudenay가 "Security Flaws Induced by CBC Padding"에서 최초로 공개했다.

- **Oracle** — 공격자가 조작한 암호문을 서버(복호화 측)에 보내고, 그 응답(예외, 에러 메시지, 응답 지연 등)으로 "패딩이 유효한가"만 판별할 수 있게 해주는 대상
- 대상 조건: **패딩이 필요한 블록 암호 모드(CBC 등) + 패딩 스킴(PKCS#7 등)** 조합, 그리고 패딩 오류가 다른 오류와 **구분 가능하게 노출**되는 경우. 패딩 자체가 없는 스트림형 모드(CTR/OFB/CFB)나 AEAD(GCM 등)는 이 공격의 대상이 아니다(§3.1)
- 영향: 암호문을 키 없이 **복호화**(기밀성 붕괴) 및 **위조**(무결성이 암호화만으로 보장된다고 가정한 경우 권한 상승 등)

## 2. 원리

### 2.1. PKCS#7 패딩

블록 암호는 블록 크기(8·16바이트)의 배수로만 암호화하므로, 평문 길이를 맞추기 위해 패딩을 채운다. PKCS#7은 **부족한 바이트 수만큼, 그 값 자체를 반복해서 채운다.**

```
평문 뒤에 5바이트가 부족 → 05 05 05 05 05 를 채움
```

복호화 측은 마지막 바이트 값을 읽어 그만큼 뒤에서 잘라내고, 그 값만큼의 바이트가 모두 동일한지 검증한다. 검증 실패 시 패딩 오류(예: Java `BadPaddingException`, ASP.NET `CryptographicException`)가 발생한다.

### 2.2. CBC 복호화 구조

$$P_i = D_k(C_i) \oplus C_{i-1}$$

- $C_i$: $i$번째 암호문 블록, $C_0$은 IV
- $D_k(C_i)$: 키 없이는 계산 불가능한 "중간값"(intermediate value) $I_i$

공격자는 $C_{i-1}$(또는 IV)을 **자유롭게 조작**할 수 있고, $I_i = D_k(C_i)$ 자체는 알 수 없지만 **패딩 유효/무효 여부만으로 $I_i$를 1바이트씩 역산**할 수 있다.

### 2.3. 바이트 단위 복원 절차

목표 블록 $C_i$의 평문 마지막 바이트를 구한다고 하자.

1. $C_{i-1}$의 마지막 바이트를 $g = 0..255$로 바꿔가며 $(C'_{i-1} \| C_i)$를 오라클에 전송
2. 패딩이 **유효**해지는 $g$를 발견 (대부분 마지막 바이트가 `0x01`이 되는 경우)
3. 이때 $I_i[\text{last}] = g \oplus 0x01$ 이므로, 원래 평문 바이트는 $P_i[\text{last}] = I_i[\text{last}] \oplus C_{i-1}[\text{last}]$(원본 $C_{i-1}$)
4. 뒤에서 두 번째 바이트를 구할 때는, 이미 알아낸 $I_i[\text{last}]$를 이용해 $C'_{i-1}$의 마지막 바이트를 고정(패딩 `0x02`가 되도록)한 뒤, 그 앞 바이트를 다시 0..255 브루트포스
5. 이를 블록 크기만큼 반복하면 **블록 하나를 키 없이 완전히 복원**(블록당 최대 256×16회 정도의 요청, $2^{128}$ 전수조사 대비 압도적으로 적음)
6. 전체 암호문은 블록마다 직전 블록을 "IV" 삼아 위 과정을 반복해 처음부터 끝까지 복원

> 2번 단계에서 우연히 `0x01` 외의 값(예: 실제 평문이 `... 02 02`인 경우)으로도 패딩이 유효해 보일 수 있어(false positive), 실제 구현체는 직전 바이트를 한 번 더 변형해 재검증한다.

같은 원리로 **중간값 $I_i$를 원하는 대로 만든 뒤 이전 블록을 XOR로 역산**하면, 공격자가 원하는 평문을 만들어내는 임의 암호문 위조(encryption oracle)도 가능하다.

## 3. 방어 방법

### 3.1. AEAD 전환

가능하면 CBC+패딩 조합을 새로 설계하지 않고 **AEAD로 대체하는 것이 근본적 해결책**이다.

- AES-GCM, ChaCha20-Poly1305, AES-CCM 등은 암호화와 무결성 검증(인증 태그)이 한 연산에 결합되어 있고, **패딩이라는 개념 자체가 없거나(CTR 기반 스트림 암호화) 패딩 오류와 태그 오류가 구분되지 않는다**
- 태그 검증 실패 시 단일 실패 상태만 존재하므로 오라클이 성립할 여지가 없음
- TLS 1.3은 AEAD 스위트만 지원해 프로토콜 차원에서 이 공격을 구조적으로 제거함(§3.6)

### 3.2. Encrypt-then-MAC

**CBC를 유지해야 하는 경우**, Encrypt-then-MAC 구조로 패딩 오류가 외부에 노출되지 않도록 한다.

- 암호화 후 **암호문(및 IV) 전체에 대해 MAC(HMAC-SHA256 등)을 계산**하고, **복호화(패딩 제거)보다 먼저 MAC을 검증**
- MAC 검증에 실패하면 **패딩 제거 로직을 아예 실행하지 않고** 즉시 실패 처리 → 공격자에게 "패딩 오류"라는 상태 자체가 노출되지 않음
- **IV도 MAC 검증 범위에 포함**시켜야 함(IV만 따로 조작하는 비트 플리핑 공격 방지)
- 암호화 키와 MAC 키를 분리(키 재사용 금지)
- 반대로 MAC-then-Encrypt(암호화 전에 MAC을 계산해 함께 암호화)는 복호화 시 패딩을 먼저 벗겨야 MAC 검증이 가능한 구조라 패딩 오류가 먼저 발생할 수 있어 오라클이 성립할 수 있음(Lucky 13이 실제로 이 구조를 공격)

### 3.3. 상수 시간 처리

- MAC 비교는 언어가 제공하는 상수 시간(constant-time) 비교 함수를 사용(`MessageDigest.isEqual`(Java), `hmac.compare_digest`(Python), `crypto.timingSafeEqual`(Node.js)). 일반 `==`/`Arrays.equals`는 첫 불일치 바이트에서 조기 반환해 타이밍 차이를 만듦
- 패딩 길이에 따라 이후 처리(MAC 계산 범위 등)에 걸리는 시간이 달라지지 않도록, **패딩 유효/무효와 무관하게 항상 동일한 양의 연산을 수행**하도록 구현(Lucky 13은 이 부분의 미세한 시간 차이를 이용)

### 3.4. 에러 응답 통일

- 패딩 실패·MAC 실패·기타 복호화 오류를 **구분 없이 동일한 일반 오류**로 응답
- 예외 메시지·스택트레이스를 클라이언트에 노출 금지(로그에만 상세 기록)
- HTTP 상태 코드·응답 본문 크기·응답 시간 등 **간접적인 side channel**도 동일하게 유지

### 3.5. 검증된 라이브러리·표준 사용

- CBC+PKCS7+HMAC을 직접 조합하는 대신, 이미 Encrypt-then-MAC 또는 AEAD로 구현·검증된 상위 API를 사용(libsodium/NaCl `crypto_secretbox`, Google Tink, JOSE JWE의 AEAD 알고리즘(`A256GCM` 등))
- 세션 토큰 등 굳이 암호화(기밀성)가 필요 없고 위·변조 방지만 필요하면, 애초에 암호화 대신 **서명(JWS 등)만 사용**해 복호화 오라클 자체를 없애는 것도 방법(→ [[jwt]])

### 3.6. 레거시 프로토콜·암호 스위트 비활성화

- SSLv3 등 CBC 스위트만 존재하는 구버전 프로토콜 비활성화(POODLE 대응)
- TLS 1.2 이하에서는 서버 설정에서 CBC 기반 스위트보다 AEAD 스위트(`TLS_..._GCM_...` 등)를 우선 협상하도록 구성, 가능하면 TLS 1.3으로 전환

## 4. 탐지 방법 (테스트)

OWASP WSTG(WSTG-CRYP-02) 기준 블랙박스 점검 절차:

1. 암호화된 것으로 보이는(무작위성이 높고, 블록 크기의 배수인) 파라미터를 식별
2. 해당 값의 특정 바이트를 비트 플리핑해 서버에 재전송
3. 응답이 다음 세 가지 상태로 구분되는지 확인
    - 정상 복호화(원래 요청과 동일하게 처리됨)
    - 복호화는 되었으나 내용이 깨져 애플리케이션 로직에서 오류 발생
    - **패딩 오류로 복호화 자체가 실패**
4. 세 번째 상태가 별도로 식별 가능(다른 예외 메시지, 응답 시간 차이 등)하면 패딩 오라클 존재
5. PadBuster, POET 등 도구로 실제 복호화·위조가 가능한지 확인

안전한 구현은 `ok`/`failed` 두 가지 응답만 존재해야 하며, 그 외 상태를 구분할 수 있는 side channel이 없어야 한다.

## 5. 실제 사례

- **Vaudenay (2002)** — IPsec, SSL/TLS, WTLS의 CBC 패딩 검증 방식에서 최초로 공격 개념 제시
- **ASP.NET Padding Oracle (2010, CVE-2010-3332, MS10-070)** — ViewState/폼 인증 티켓 등을 서버가 CBC로 암호화해 클라이언트에 보관했는데, 패딩 오류 시 별도 예외(`CryptographicException`)가 노출되어 오라클 성립. Rizzo·Duong이 "Practical Padding Oracle Attacks"(USENIX WOOT 2010)에서 도구화(POET, PadBuster)하여 ViewState 복호화는 물론 서버 내 임의 파일(`web.config` 등) 다운로드까지 시연. 같은 논문에서 JavaServerFaces, Ruby on Rails, OWASP ESAPI 등 여러 프레임워크의 유사 취약점도 함께 지적
- **POODLE (2014, CVE-2014-3566)** — SSLv3의 CBC 패딩 검증이 스펙상 패딩 바이트 내용을 실질적으로 검사하지 않는 허점을 이용, TLS→SSLv3 다운그레이드를 유도해 세션 쿠키 등을 탈취
- **Lucky 13 (2013)** — MAC-then-Encrypt 구조의 TLS(≤1.2) CBC 스위트에서, 패딩 검증과 MAC 검증에 걸리는 시간 차이(타이밍 사이드채널)로 오라클을 구성

---

## Sources
- [OWASP WSTG — Testing for Padding Oracle](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/02-Testing_for_Padding_Oracle)
- Juliano Rizzo, Thai Duong, "Practical Padding Oracle Attacks", USENIX WOOT 2010: https://www.usenix.org/event/woot10/tech/full_papers/Rizzo.pdf
- [Wikipedia — Padding oracle attack](https://en.wikipedia.org/wiki/Padding_oracle_attack)
- Microsoft Security Advisory 2416728 (MS10-070, CVE-2010-3332): https://learn.microsoft.com/en-us/security-updates/securityadvisories/2010/2416728
- OpenSSL, "This POODLE Bites: Exploiting The SSL 3.0 Fallback" (CVE-2014-3566): https://www.openssl.org/~bodo/ssl-poodle.pdf
- Lucky 13 and other padding oracle attacks on CBC ciphers: https://www.sjoerdlangkemper.nl/2022/03/20/padding-oracle-attacks-lucky13/

---

## Related pages
- [[openssl-dgst]] — HMAC/서명 원리 (Encrypt-then-MAC 방어에 사용)
- [[jwt]] — JWE의 CBC-HMAC 알고리즘군(A128CBC-HS256 등)도 같은 구조적 위험을 공유, JWS만 사용 시 오라클 자체가 성립하지 않음
