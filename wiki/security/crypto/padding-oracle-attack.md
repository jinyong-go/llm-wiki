---
title: 패딩 오라클 공격
updated: 2026-10-19 17:18:36
tags:
  - crypto
  - cbc
  - padding-oracle
  - block-cipher
  - security
---

## 1. 개요

패딩 오라클 공격은 조작한 암호문의 패딩 유효성을 관측해 키 없이 평문을 복원하는 공격이다. CBC 암호문의 변형 가능성과 복호화 오류의 차이를 결합한다. 조건에 따라 원하는 평문으로 복호화되는 암호문 구성에도 악용할 수 있다.

오라클(oracle)은 조작한 입력에 대한 응답으로 공격에 필요한 판정 정보를 제공하는 대상이다. 패딩 오라클에서는 오류 메시지·상태 코드·응답 시간 등의 차이가 패딩 유효성을 드러낸다.

## 2. 성립 조건

다음 조건이 함께 필요하다.

1. CBC와 PKCS#7 등 패딩을 사용하는 암호 구성이 있다.
2. 공격자가 암호문이나 IV를 변형해 복호화 측에 제출할 수 있다.
3. 복호화 전에 암호문·IV의 인증을 수행하지 않거나, 패딩 검사 결과가 다른 실패와 구분된다.

키를 직접 알아내는 공격은 아니다. 패딩이 없는 모드에는 이 패딩 판정 기법을 그대로 적용할 수 없지만, 그것만으로 무결성이 보장되는 것은 아니다.

## 3. 복원 원리

### 3.1. PKCS#7 패딩

CBC에서 입력을 블록 크기의 배수로 맞추기 위해 패딩을 채운다. 블록 암호를 사용하는 모든 모드가 패딩을 요구하는 것은 아니다. PKCS#7은 **부족한 바이트 수만큼, 그 값 자체를 반복해서 채운다.**

```
평문 뒤에 5바이트가 부족 → 05 05 05 05 05 를 채움
```

복호화 측은 마지막 바이트의 값이 1부터 블록 크기 사이인지 확인하고, 해당 개수의 마지막 바이트가 모두 같은 값인지 검증한 뒤 제거한다. 입력 길이가 이미 블록 크기의 배수여도 한 블록을 패딩으로 추가한다. 검증 실패 시 패딩 오류(예: Java `BadPaddingException`, ASP.NET `CryptographicException`)가 발생한다.

### 3.2. CBC 복호화 구조

$$P_i = D_k(C_i) \oplus C_{i-1}$$

- $C_i$: $i$번째 암호문 블록, $C_0$은 IV
- $D_k(C_i)$: 키 없이는 계산 불가능한 "중간값"(intermediate value) $I_i$

공격자는 $C_{i-1}$(또는 IV)을 **자유롭게 조작**할 수 있고, $I_i = D_k(C_i)$ 자체는 알 수 없지만 **패딩 유효/무효 여부만으로 $I_i$를 1바이트씩 역산**할 수 있다.

### 3.3. 바이트 단위 복원 절차

목표 블록 $C_i$의 평문 마지막 바이트를 구한다고 하자.

1. $C_{i-1}$의 마지막 바이트를 $g = 0..255$로 바꿔가며 $(C'_{i-1} \| C_i)$를 오라클에 전송
2. 패딩이 **유효**해지는 $g$를 발견 (대부분 마지막 바이트가 `0x01`이 되는 경우)
3. 이때 $I_i[\text{last}] = g \oplus 0x01$ 이므로, 원래 평문 바이트는 $P_i[\text{last}] = I_i[\text{last}] \oplus C_{i-1}[\text{last}]$(원본 $C_{i-1}$)
4. 뒤에서 두 번째 바이트를 구할 때는, 이미 알아낸 $I_i[\text{last}]$를 이용해 $C'_{i-1}$의 마지막 바이트를 고정(패딩 `0x02`가 되도록)한 뒤, 그 앞 바이트를 다시 0..255 브루트포스
5. 이를 블록 크기만큼 반복하면 **블록 하나를 키 없이 완전히 복원**(블록당 최대 256×16회 정도의 요청, $2^{128}$ 전수조사 대비 압도적으로 적음)
6. 전체 암호문은 블록마다 직전 블록을 "IV" 삼아 위 과정을 반복해 처음부터 끝까지 복원

> 2번 단계에서 우연히 `0x01` 외의 값(예: 실제 평문이 `... 02 02`인 경우)으로도 패딩이 유효해 보일 수 있어(false positive), 실제 구현체는 직전 바이트를 한 번 더 변형해 재검증한다.

같은 원리로 선택한 암호문 블록의 중간값 $I_i$를 알아내고, 원하는 평문 $P_i$에 대해 이전 블록을 $C_{i-1}=I_i\oplus P_i$로 정하면 해당 평문으로 복호화되도록 구성할 수 있다. 전체 메시지 위조 가능 여부는 IV 제어와 메시지 구조 등 추가 조건에 따라 달라진다.

## 4. 방어

### 4.1. AEAD

신규 설계는 AES-GCM·ChaCha20-Poly1305 등 검증된 AEAD 구성을 우선 사용한다. 인증에 실패한 암호문은 평문을 애플리케이션에 제공하지 않아야 한다. AEAD를 선택하는 것과 올바른 nonce 관리·오류 처리는 별개의 구현 요구사항이다.

일반적인 GCM·ChaCha20-Poly1305는 PKCS#7 패딩 검사를 사용하지 않으므로 CBC 패딩 오라클과 같은 경로가 없다. TLS 1.3도 AEAD 암호 스위트만 사용한다.

### 4.2. Encrypt-then-MAC

**CBC를 유지해야 하는 경우**, Encrypt-then-MAC 구조로 패딩 오류가 외부에 노출되지 않도록 한다.

- 암호화 후 **암호문(및 IV) 전체에 대해 MAC(HMAC-SHA256 등)을 계산**하고, **복호화(패딩 제거)보다 먼저 MAC을 검증**
- MAC 검증에 실패하면 **패딩 제거 로직을 아예 실행하지 않고** 즉시 실패 처리 → 공격자에게 "패딩 오류"라는 상태 자체가 노출되지 않음
- **IV도 MAC 검증 범위에 포함**시켜야 함(IV만 따로 조작하는 비트 플리핑 공격 방지)
- 암호화 키와 MAC 키를 분리(키 재사용 금지)
- 반대로 MAC-then-Encrypt(암호화 전에 MAC을 계산해 함께 암호화)는 복호화 시 패딩을 먼저 벗겨야 MAC 검증이 가능한 구조라 패딩 오류가 먼저 발생할 수 있어 오라클이 성립할 수 있음(Lucky 13이 실제로 이 구조를 공격)

### 4.3. 오류와 시간 차이

인증되지 않은 암호문에서 패딩 유효성이 관측되지 않도록 한다. 패딩·MAC 실패의 외부 오류 형식을 통일하고, 예외 메시지·스택 트레이스를 응답에 노출하지 않는다. 본문 길이와 시간 차이도 판정 신호가 될 수 있다.

MAC 비교는 `MessageDigest.isEqual`이나 `hmac.compare_digest` 같은 상수 시간 비교 API를 사용한다. 비교 함수만 바꿔도 복호화 전체의 시간 차이가 사라지는 것은 아니다. 레거시 MAC-then-Encrypt는 패딩·MAC 처리의 시간 차이를 줄이는 검증된 구현이 필요하며, 임의 지연을 넣는 방식으로 해결하지 않는다.

### 4.4. 라이브러리

- CBC+PKCS7+HMAC을 직접 조합하는 대신, 이미 Encrypt-then-MAC 또는 AEAD로 구현·검증된 상위 API를 사용(libsodium/NaCl `crypto_secretbox`, Google Tink, JOSE JWE의 AEAD 알고리즘(`A256GCM` 등))
- 세션 토큰 등 굳이 암호화(기밀성)가 필요 없고 위·변조 방지만 필요하면, 애초에 암호화 대신 **서명(JWS 등)만 사용**해 복호화 오라클 자체를 없애는 것도 방법(→ [[jwt]])

JWE의 `A128CBC-HS256` 등은 CBC와 HMAC을 결합한 인증된 암호화 구성이다. RFC 7518은 HMAC 검증이 실패하면 중단하고, 성공한 뒤에만 복호화·패딩 검사를 수행하도록 정의한다. CBC를 사용한다는 이유만으로 인증 없는 CBC와 같은 패딩 오라클 위험을 가진다고 서술하지 않는다.


### 4.5. 레거시 프로토콜

- SSLv3 비활성화(POODLE 대응, RFC 7568). SSLv3에서 CBC 외 선택지인 RC4도 취약해 안전한 스위트가 없다
- TLS 1.2 이하에서는 서버 설정에서 CBC 기반 스위트보다 AEAD 스위트(`TLS_..._GCM_...` 등)를 우선 협상하도록 구성, 가능하면 TLS 1.3으로 전환

## 5. 탐지

OWASP WSTG의 블랙박스 점검은 조작한 암호문에 대한 응답 차이를 비교한다.

1. 암호화된 것으로 추정되는 입력과 그 인코딩을 식별한다. 길이가 블록 크기의 배수라는 사실만으로 CBC라고 확정하지 않는다.
2. 암호문·IV의 바이트를 바꾸어 제출하고 응답 상태·본문·처리 시간을 비교한다.
3. 단순 형식 오류와 복호화 실패, 패딩 이후 애플리케이션 처리 실패를 구분할 수 있는지 확인한다.
4. 패딩 유효성이 반복적으로 판별되는 경우 실제 평문 복원이 가능한지 검증한다.

정상 응답과 실패 응답이 다르다는 사실만으로 취약점이 성립하는 것은 아니다. 반대로 오류 본문이 같다는 이유만으로 안전하다고 판단해서도 안 된다. 인증되지 않은 입력의 패딩 유효성이 다른 신호로 노출되는지 확인해야 한다.

## 6. 사례

- **Vaudenay (2002)** — IPsec, SSL/TLS, WTLS의 CBC 패딩 검증 방식에서 최초로 공격 개념 제시
- **ASP.NET Padding Oracle (2010, CVE-2010-3332, MS10-070)** — ViewState/폼 인증 티켓 등을 서버가 CBC로 암호화해 클라이언트에 보관했는데, 패딩 오류 시 별도 예외(`CryptographicException`)가 노출되어 오라클 성립. Rizzo·Duong이 "Practical Padding Oracle Attacks"(USENIX WOOT 2010)에서 도구화(POET, PadBuster)하여 ViewState 복호화는 물론 서버 내 임의 파일(`web.config` 등) 다운로드까지 시연. 같은 논문에서 JavaServerFaces, Ruby on Rails, OWASP ESAPI 등 여러 프레임워크의 유사 취약점도 함께 지적
- **Lucky 13 (2013)** — MAC-then-Encrypt 구조의 TLS(≤1.2) CBC 스위트에서, 패딩 검증과 MAC 검증에 걸리는 시간 차이(타이밍 사이드채널)로 오라클을 구성
- **POODLE (2014, CVE-2014-3566)** — SSLv3의 CBC 패딩 검증이 스펙상 패딩 바이트 내용을 실질적으로 검사하지 않는 허점을 이용, TLS→SSLv3 다운그레이드를 유도해 세션 쿠키 등을 탈취

---

## Sources
- [RFC 7518 §5.2.2.2: AES_CBC_HMAC_SHA2 Decryption](https://www.rfc-editor.org/rfc/rfc7518.html#section-5.2.2.2)
- [OWASP WSTG — Testing for Padding Oracle](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/02-Testing_for_Padding_Oracle)
- Juliano Rizzo, Thai Duong, "Practical Padding Oracle Attacks", USENIX WOOT 2010: https://www.usenix.org/event/woot10/tech/full_papers/Rizzo.pdf
- [Wikipedia — Padding oracle attack](https://en.wikipedia.org/wiki/Padding_oracle_attack)
- Microsoft Security Advisory 2416728 (MS10-070, CVE-2010-3332): https://learn.microsoft.com/en-us/security-updates/securityadvisories/2010/2416728
- OpenSSL, "This POODLE Bites: Exploiting The SSL 3.0 Fallback" (CVE-2014-3566): https://www.openssl.org/~bodo/ssl-poodle.pdf
- Lucky 13 and other padding oracle attacks on CBC ciphers: https://www.sjoerdlangkemper.nl/2022/03/20/padding-oracle-attacks-lucky13/
- Serge Vaudenay, "Security Flaws Induced by CBC Padding", EUROCRYPT 2002: https://www.iacr.org/archive/eurocrypt2002/23320530/cbc02_e02d.pdf
- [RFC 7568: Deprecating SSL 3.0](https://www.rfc-editor.org/rfc/rfc7568)

---

## Related pages
- [[openssl-dgst]] — HMAC/서명 원리 (Encrypt-then-MAC 방어에 사용)
- [[jwt]]: JWE CBC-HMAC은 MAC을 먼저 검증하는 인증된 암호화 구성. 인증 없는 CBC와 구분
