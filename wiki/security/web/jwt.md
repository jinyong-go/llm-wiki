---
title: JWT (JSON Web Token)
updated: 2026-09-13 00:33:04
tags:
  - web
  - jwt
  - security
  - authentication
  - token
---

## 1. 개요

**JWT**(JSON Web Token, RFC 7519)는 **두 당사자 간에 클레임(claim)을 전달하기 위한 컴팩트하고 URL-safe한 토큰 규격**이다. 클레임을 JSON으로 표현하고, 서명(JWS) 또는 암호화(JWE)해 무결성·기밀성을 보장한다.

핵심: **JWT는 "데이터 포맷"이지 프로토콜이 아니다.** 발급·전달·검증 방법은 이를 쓰는 애플리케이션이 정한다. OAuth 2.0의 토큰 포맷으로 쓰일 수 있지만(→ [[oauth2]] §8.2), OAuth와 무관하게 자체 세션 토큰·서비스 간 주장 전달에도 쓴다.

용도: **인가**(로그인 후 자원 접근 자격), **정보 교환**(서명으로 위·변조 검증 가능한 데이터 전달).

---

## 2. 구조

`header.payload.signature`의 세 부분을 각각 **base64url**로 인코딩해 `.`으로 연결한 형태다. 이 3-segment 구조는 서명형(JWS) 기준이며, 암호화형인 JWE(§4)는 5-segment 구조로 다르다.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← header
.eyJzdWIiOiIxMjMiLCJuYW1lIjoia2ltIn0    ← payload
.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk  ← signature
```

- **base64url은 암호화가 아니라 인코딩**이다. header·payload는 **누구나 디코딩해 읽을 수 있다**(JWS 기준). 서명은 위·변조를 막을 뿐 내용을 숨기지 않는다.

### 2.1. JOSE Header
```json
{ "alg": "HS256", "typ": "JWT" }
```
- `alg` — 서명/암호화 알고리즘(HS256, RS256, ES256, `none` 등).
- `typ` — 토큰 타입(보통 `JWT`). (`kid` 등 키 식별자도 올 수 있음.)

### 2.2. Payload (Claims)
```json
{ "sub": "1234567890", "name": "kim", "iat": 1516239022, "exp": 1516242622 }
```

### 2.3. Signature
헤더의 `alg`로 `base64url(header) + "." + base64url(payload)`에 서명한다.
```
HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), secret )   // HS256 예
```

---

## 3. 클레임 (Claims)

JWT 페이로드에 담기는 클레임은 이름 충돌 방지·표준화 수준에 따라 등록·공개·비공개 클레임 세 종류로 나뉜다(RFC 7519 §4).

### 3.1. 등록 클레임 (Registered)

IANA "JSON Web Token Claims" 레지스트리에 등록된 클레임이다. 사용이 필수는 아니지만, 상호운용 가능한 클레임 집합의 출발점으로 제공되며 애플리케이션이 실제 사용할 클레임과 필수 여부를 정의해야 한다.

| 클레임 | 의미 |
|--------|------|
| `iss` | 발급자(issuer) |
| `sub` | 주체(subject) |
| `aud` | 대상(audience) |
| `exp` | 만료 시각(expiration) |
| `nbf` | 유효 시작(not before) |
| `iat` | 발급 시각(issued at) |
| `jti` | 고유 ID(중복/재사용 방지) |

### 3.2. 공개 클레임 (Public)

등록 클레임에 없는 이름을 자유롭게 정의할 수 있지만, 충돌을 막기 위해 IANA 레지스트리에 등록하거나 충돌 방지 이름(collision-resistant name, 보통 URI 형태)을 사용해야 하는 클레임이다. 이름을 정의하는 쪽이 해당 네임스페이스를 실제로 통제하고 있어야 한다.

### 3.3. 비공개 클레임 (Private)

발급자와 검증자가 상호 합의해 사용하는 클레임으로, 등록 클레임도 공개 클레임도 아닌 이름이다. 충돌 방지 장치가 없으므로 당사자 간에만 통용되도록 주의해서 사용해야 한다.

---

## 4. JWE

JWE(JSON Web Encryption, RFC 7516)는 페이로드를 암호화해 기밀성을 보장하는 방식이다. §2의 서명형(JWS)은 header·payload가 base64url 인코딩일 뿐이라 누구나 읽을 수 있고 서명은 위·변조만 막는 반면, JWE는 페이로드 자체를 암호화하므로 제3자가 내용을 읽을 수 없다.

구조도 다르다. JWS는 `header.payload.signature` 3-segment인 반면, JWE는 Compact Serialization 기준 `BASE64URL(Protected Header) || '.' || BASE64URL(Encrypted Key) || '.' || BASE64URL(IV) || '.' || BASE64URL(Ciphertext) || '.' || BASE64URL(Authentication Tag)`, 5-segment 구조다(RFC 7516 §3.1).

통상 "JWT"라고 하면 JWS 형태를 가리키며 대부분의 인증 토큰이 여기 해당한다. JWE는 민감한 데이터를 토큰에 직접 담아야 할 때 사용한다.

---

## 5. 서명 알고리즘

| 알고리즘 | 방식 | 키 |
|----------|------|-----|
| **HS256** | HMAC-SHA256 | **대칭키**(공유 비밀) — 발급자·검증자가 같은 비밀 공유 |
| **RS256** | RSA 서명 | **비대칭키** — 개인키 서명, 공개키 검증 |
| **ES256** | ECDSA(P-256) 서명 | 비대칭키 — RSA보다 짧은 키·서명 |
| **EdDSA** | Ed25519/Ed448 서명 | 비대칭키 — RFC 8037, ES256 대비 서명 생성이 빠르고 결정적(deterministic) |

- **대칭(HS256)**: 단순하지만 비밀을 공유해야 한다. 검증자가 많으면 비밀 유출 위험↑.
- **비대칭(RS256/ES256/EdDSA)**: 발급자만 개인키를 갖고, 검증자는 **공개키만** 있으면 된다. 다자 검증(예: 여러 마이크로서비스)에 적합. OIDC ID Token은 보통 RS256.

> 서명·HMAC의 원리는 [[openssl-dgst]], 키 생성은 [[openssl-keygen]] 참고.

---

## 6. 검증 절차

수신 측은 다음을 **모두** 통과해야 토큰을 신뢰한다.

1. **서명 검증** — `alg`에 맞는 키로 서명을 재계산해 일치 확인(위·변조 탐지).
2. **`exp`/`nbf`** — 만료·유효 시작 시각 확인.
3. **`iss`/`aud`** — 기대한 발급자·대상인지 확인(다른 컨텍스트 토큰 오용 방지).
4. 필요 시 `jti`로 재사용 여부 확인.

하나라도 실패하면 **전체 토큰을 거부**한다(RFC 8725).

---

## 7. 보안 고려사항

RFC 8725(JWT Best Current Practices)이 정리한 권고 사항이다.

- **`alg: none` 공격** — 서명을 제거하고 `alg`를 `none`으로 바꾼 토큰을 서버가 그대로 신뢰하면 위조 성공. → `none` 허용 금지.
- **알고리즘 혼동(RS256 → HS256)** — 공격자가 `alg`를 HS256으로 바꾸면, 서버가 **RSA 공개키를 HMAC 비밀로 오용**해 검증이 뚫린다. → **서버가 기대하는 `alg`를 고정/allowlist**로 강제(토큰의 `alg`를 신뢰하지 말 것).
- **알고리즘 allowlist** — 라이브러리는 허용 알고리즘 집합을 지정하게 하고 그 외엔 쓰지 않아야 한다(MUST).
- **모든 클레임 검증** — `iss`/`sub`/`aud` 등을 검증해 토큰 치환 공격 방지.
- **키 엔트로피** — HS256의 키로 **사람이 외우는 비밀번호를 직접 쓰지 말 것**(MUST NOT). 충분히 랜덤한 키 사용.
- **민감정보 금지** — JWS payload는 평문 노출되므로 비밀을 담지 않는다(필요 시 JWE).

---

## 8. 장단점

**장점**
- **Stateless·자기 완결형** — 서버가 세션을 저장하지 않고 토큰만으로 검증(DB 조회 불필요).
- **분산·교차 도메인** — 공개키만 배포하면 여러 서비스가 독립 검증(비대칭).
- 표준·언어 무관 생태계.

**단점**
- **폐기(revocation)가 어렵다** — 발급된 토큰은 만료 전까지 유효. 즉시 무효화하려면 블랙리스트/짧은 만료+[[oauth2]] refresh 토큰 회전 등 별도 장치 필요.
- **payload 노출** — 서명형은 내용이 읽힌다(민감정보 금지).
- **크기** — 쿠키/헤더로 매 요청 전송 시 오버헤드.
- **잘못 쓰기 쉬움** — alg 혼동·검증 누락 등 구현 함정(→ §7).

---

## 9. 요약

- JWT = 클레임을 담는 **토큰 규격**(포맷). `header.payload.signature`를 base64url로 인코딩. **프로토콜 아님.**
- 통상 **JWS(서명형)** — 무결성 보장이지 기밀 아님(payload 읽힘, 민감정보 금지). JWE는 암호화형(5-segment, §4).
- 서명: 대칭 **HS256**(비밀 공유) vs 비대칭 **RS256/ES256/EdDSA**(공개키 검증, 다자 검증 적합).
- 검증은 **서명 + exp/nbf + iss/aud**를 모두 확인, 실패 시 전체 거부.
- 보안(RFC 8725): `alg:none` 금지·**alg 혼동 방지(alg 고정/allowlist)**·클레임 검증·강한 키.
- 폐기가 어려운 점은 짧은 만료 + refresh 토큰([[oauth2]])으로 보완.

---

## Sources
- RFC 7519 — JSON Web Token (JWT): https://datatracker.ietf.org/doc/html/rfc7519
- RFC 7515 — JSON Web Signature (JWS): https://datatracker.ietf.org/doc/html/rfc7515
- RFC 7516 — JSON Web Encryption (JWE): https://datatracker.ietf.org/doc/html/rfc7516
- RFC 7518 — JSON Web Algorithms (JWA): https://datatracker.ietf.org/doc/html/rfc7518
- RFC 8037 — CFRG Curves for JOSE (EdDSA): https://datatracker.ietf.org/doc/html/rfc8037
- RFC 8725 — JSON Web Token Best Current Practices: https://datatracker.ietf.org/doc/html/rfc8725
- jwt.io — Introduction to JSON Web Tokens: https://jwt.io/introduction

---

## Related pages
- [[jwt-java]] — Java 라이브러리별 JWT 생성·검증 예시(JJWT/Nimbus/Auth0)
- [[session-vs-cookie]] — 서버 세션 방식과의 비교(stateless 대안 관계)
- [[oauth2]] — JWT를 액세스/ID 토큰 포맷으로 사용(§8.2 관계)
- [[openssl-dgst]] — HMAC·디지털 서명 원리(HS256/RS256의 기반)
- [[openssl-keygen]] — RS256/ES256용 키 생성
