---
title: JWT
updated: 2026-10-20 18:00:44
tags:
  - web
  - jwt
  - security
  - authentication
  - token
---

## 1. 개요

JWT(JSON Web Token, RFC 7519)는 두 당사자 간에 클레임(claim)을 전달하기 위한 컴팩트하고 URL-safe한 토큰 규격이다. 클레임은 JSON으로 표현한다. JWS는 서명 또는 MAC으로 무결성을 보호하고, JWE는 인증된 암호화로 기밀성과 무결성을 보호한다.

핵심: JWT는 "데이터 포맷"이지 프로토콜이 아니다. 발급·전달·검증 방법은 이를 쓰는 애플리케이션이 정한다. OAuth 2.0의 토큰 포맷으로 쓰일 수 있지만([[oauth2]] §8.2), OAuth와 무관하게 자체 세션 토큰·서비스 간 주장 전달에도 쓴다.

용도: 인가(로그인 후 자원 접근 자격), 정보 교환(서명으로 위·변조 검증 가능한 데이터 전달).

---

## 2. 구조

`header.payload.signature`의 세 부분을 각각 base64url로 인코딩해 `.`으로 연결한 형태다. 이 3-segment 구조는 서명형(JWS) 기준이며, 암호화형인 JWE(§5)는 5-segment 구조로 다르다.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← header
.eyJzdWIiOiIxMjMiLCJuYW1lIjoia2ltIn0    ← payload
.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk  ← signature
```

- base64url은 암호화가 아닌 인코딩이기 때문에 JWS의 header와 payload는 누구나 디코딩해 읽을 수 있다. 서명은 위·변조를 검증하는 데 사용되며, 내용을 숨기지는 않는다.

### 2.1. Header

정식 명칭은 JOSE Header이며, JWT에 적용하는 서명·암호화 알고리즘과 토큰 타입 등의 정보를 담는다.

```json
{ "alg": "HS256", "typ": "JWT" }
```
- `alg`: JWS의 서명·MAC 알고리즘 또는 JWE의 키 관리 알고리즘을 나타낸다. JWS에서는 HS256·RS256·ES256 등을 사용한다. JWE의 콘텐츠 암호화 알고리즘은 `enc`에 지정한다.
- `typ`: 토큰 타입을 나타낸다. 일반 JWT는 `JWT`, OAuth JWT access token 프로파일은 `at+jwt`를 사용한다.
- `kid`: 검증 키를 선택하기 위한 식별자다. 신뢰하는 키 집합 안에서만 해석한다(§8).

### 2.2. Payload
```json
{ "sub": "1234567890", "name": "kim", "iat": 1516239022, "exp": 1516242622 }
```

### 2.3. Signature
헤더의 `alg`로 `base64url(header) + "." + base64url(payload)`에 서명한다.
```
HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), secret )   // HS256 예
```

---

## 3. 클레임

JWT 페이로드에 담기는 클레임은 이름 충돌 방지·표준화 수준에 따라 등록·공개·비공개 클레임 세 종류로 나뉜다(RFC 7519 §4).

### 3.1. 등록 클레임

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

### 3.2. 공개 클레임

등록 클레임에 없는 이름을 자유롭게 정의할 수 있지만, 충돌을 막기 위해 IANA 레지스트리에 등록하거나 충돌 방지 이름(collision-resistant name, 보통 URI 형태)을 사용해야 하는 클레임이다. 이름을 정의하는 쪽이 해당 네임스페이스를 실제로 통제하고 있어야 한다.

### 3.3. 비공개 클레임

발급자와 검증자가 이름과 의미를 합의해 사용하는 클레임으로, 등록 클레임이나 공개 클레임에 해당하지 않는다. ‘비공개’는 합의한 당사자 사이에서 사용하는 이름이라는 뜻이며, 값이 암호화되거나 숨겨진다는 뜻은 아니다.

아래는 서비스 내부의 테넌트 식별자와 권한 목록을 자체 정의한 예시다.

```json
{
  "app_tenant_id": "tenant-42",
  "app_permissions": ["orders:read", "orders:write"]
}
```

이 예시에서 `app_tenant_id`는 사용자가 속한 테넌트를, `app_permissions`는 허용된 작업 목록을 나타낸다. 다른 서비스에서는 같은 이름을 다른 의미나 자료형으로 사용할 수 있으므로, 토큰을 주고받는 서비스 간에 정의를 일치시켜야 한다.

---

## 4. 서명 알고리즘

| 알고리즘 | 방식 | 키 |
|----------|------|-----|
| HS256 | HMAC-SHA256 | 대칭키(공유 비밀): 발급자·검증자가 같은 비밀 공유 |
| RS256 | RSA 서명 | 비대칭키: 개인키 서명, 공개키 검증 |
| ES256 | ECDSA(P-256) 서명 | 비대칭키: RSA보다 짧은 키·서명 |
| EdDSA | Ed25519/Ed448 서명 | 비대칭키. RFC 8037 |

- 대칭(HS256): 단순하지만 비밀을 공유해야 한다. 검증자가 많으면 비밀 유출 위험↑.
- 비대칭(RS256/ES256/EdDSA): 발급자만 개인키를 갖고, 검증자는 공개키만 있으면 된다. 다자 검증(예: 여러 마이크로서비스)에 적합. OIDC ID Token은 보통 RS256.

> 서명·HMAC의 원리는 [[openssl-dgst]], 키 생성은 [[openssl-keygen]] 참고.

---

## 5. JWE

JWE(JSON Web Encryption, RFC 7516)는 페이로드를 암호화해 기밀성을 보장하는 방식이다. §2의 서명형(JWS)은 header·payload가 base64url 인코딩일 뿐이라 누구나 읽을 수 있고 서명은 위·변조만 막는 반면, JWE는 페이로드 자체를 암호화하므로 제3자가 내용을 읽을 수 없다.

JWE는 Compact Serialization 기준으로 다음 다섯 부분을 `.`으로 연결한다. `||`는 연결 연산을 뜻하며, 아래 줄들을 이어 붙이면 하나의 문자열이 된다(RFC 7516 §3.1).

```text
BASE64URL(UTF8(Protected Header)) || '.' ||
BASE64URL(Encrypted Key) || '.' ||
BASE64URL(IV) || '.' ||
BASE64URL(Ciphertext) || '.' ||
BASE64URL(Authentication Tag)
```

통상 "JWT"라고 하면 JWS 형태를 가리키며 대부분의 인증 토큰이 여기 해당한다. JWE는 민감한 데이터를 토큰에 직접 담아야 할 때 사용한다.

---

## 6. 검증 절차

수신 측은 다음을 모두 통과해야 토큰을 신뢰한다.

1. 암호학적 검증: 서버가 허용한 알고리즘과 신뢰하는 발급자의 키로 서명 또는 MAC을 검증한다. JWE는 복호화와 인증 태그 검증을 수행하고, 중첩 JWT는 내부 토큰도 검증한다.
2. 시각 검증: 적용 프로파일에서 요구하는 클레임의 존재를 확인하고 `exp`·`nbf` 및 허용 시계 오차를 검증한다. 일반 JWT 규격 자체는 이 클레임을 모두 필수로 정하지 않는다.
3. 용도 검증: 적용 프로파일에 맞춰 `iss`·`aud`·`sub` 및 토큰 타입을 확인한다. ID Token을 API용 access token으로 수용하지 않도록 용도별 검증 규칙을 구분한다.
4. 재사용을 금지하는 용도에서는 `jti` 등 식별자의 사용 이력을 서버에서 확인한다. 클레임이 존재한다는 사실만으로 재사용이 차단되지는 않는다.

하나라도 실패하면 전체 토큰을 거부한다(RFC 8725).

---

## 7. 클라이언트 저장 위치

브라우저(SPA 등)에서 JWT를 어디에 저장할지는 토큰 규격과 별개의 보안 문제다.

### 7.1. localStorage / sessionStorage
동일 출처의 모든 JavaScript가 접근 가능하므로, XSS 공격 발생 시 토큰이 그대로 탈취된다. OWASP는 인증 토큰·세션 ID·JWT·refresh token을 localStorage/sessionStorage에 저장하지 말 것을 권고한다. 이는 저장소 선택에 대한 보안 권고이며 JWT 규격의 필수 조건은 아니다.

### 7.2. HttpOnly + Secure + SameSite 쿠키
- `HttpOnly`: JavaScript(`document.cookie`)로 접근 불가. XSS로 직접 탈취 불가.
- `Secure`: HTTPS 연결에서만 전송.
- `SameSite=Strict` 또는 `Lax`: 크로스사이트 요청에 자동 첨부되지 않도록 제한. CSRF에 대한 심층 방어 수단이며 CSRF 토큰을 대체하지는 않는다. `SameSite=None`은 반드시 `Secure`와 함께 사용해야 한다.

교차 출처 요청의 쿠키 전송 조건은 [[cors]] §6을 참고한다. 클라이언트 타입별 저장 위치 비교는 [[oauth2]] §7.2를 참고한다.

`HttpOnly; Secure; SameSite` 쿠키를 우선 사용하거나 BFF(Backend-for-Frontend)[^1] 패턴을 사용하는 것이 권장된다.

### 7.3. 메모리 / Web Worker
JS 변수(메모리)에만 두면 새로고침 시 소실되지만 탈취 노출 시간이 짧다. Web Worker에서 비밀을 얻고 보관하며 메인 컨텍스트로 반환하지 않으면 직접 노출을 줄일 수 있다. 그러나 메시지 인터페이스를 통해 XSS가 비밀을 사용하는 작업을 유발할 수 있으므로, Worker 사용만으로 안전한 격리가 보장되지는 않는다.

---

## 8. 보안

RFC 8725(JWT Best Current Practices)이 정리한 권고 사항이다.

- `alg: none` 공격: 서명을 제거하고 `alg`를 `none`으로 바꾼 토큰을 서버가 그대로 신뢰하면 위조 성공. `none`은 허용하지 않는다.
- 알고리즘 혼동(RS256에서 HS256으로 변경): 공격자가 `alg`를 HS256으로 바꾸면, 서버가 RSA 공개키를 HMAC 비밀로 오용해 검증이 뚫린다. 서버가 기대하는 `alg`를 고정/allowlist로 강제하고 토큰의 `alg`는 신뢰하지 않는다.
- 알고리즘 allowlist: 라이브러리는 허용 알고리즘 집합을 지정하게 하고 그 외엔 쓰지 않아야 한다(MUST).
- 모든 클레임 검증: `iss`/`sub`/`aud` 등을 검증해 토큰 치환 공격 방지.
- 키 엔트로피: HS256의 키로 사람이 외우는 비밀번호를 직접 쓰지 말 것(MUST NOT). 충분히 랜덤한 키 사용.
- 민감정보 금지: JWS payload는 평문 노출되므로 비밀을 담지 않는다(필요 시 JWE).
- 헤더 파라미터 신뢰 금지: `kid`를 파일 경로·SQL·LDAP 조회에 그대로 쓰면 인젝션이 되고, `jku`·`x5u`가 가리키는 URL에서 키를 받아오면 공격자 키로 검증하게 된다. 키 위치는 서버 설정으로 고정한다(RFC 8725 §3.10).
- 명시적 타입 지정: 용도가 다른 JWT끼리 서로 대체되지 않도록 `typ`을 지정하고 검증한다(RFC 8725 §3.11, §3.12).

---

## 9. 장단점

### 9.1. 장점

- Stateless·자기 완결형: 서버가 세션을 저장하지 않고 토큰만으로 검증(DB 조회 불필요).
- 분산·교차 도메인: 공개키만 배포하면 여러 서비스가 독립 검증(비대칭).
- 표준·언어 무관 생태계.

### 9.2. 단점

- 폐기: 자체 검증만으로는 발급된 access token이 만료 전에 폐기됐는지 알 수 없다. 즉시 차단하려면 거부 목록 등 서버 측 상태를 확인해야 한다. 짧은 만료는 노출 기간을 제한하고, refresh token 회전은 갱신 자격의 재사용을 탐지한다. 회전만으로 기존 access token이 즉시 폐기되지는 않는다.
- payload 노출: 서명형은 내용이 읽힌다(민감정보 금지).
- 크기: 쿠키/헤더로 매 요청 전송 시 오버헤드.
- 잘못 쓰기 쉬움: alg 혼동·검증 누락 등 구현 함정. §6과 §8을 참고한다.

---

## Sources
- [Fetch Standard §3.3.5](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials)
- [RFC 9700 §4.14](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14)
- [RFC 7519: JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7515: JSON Web Signature (JWS)](https://datatracker.ietf.org/doc/html/rfc7515)
- [RFC 7516: JSON Web Encryption (JWE)](https://datatracker.ietf.org/doc/html/rfc7516)
- [RFC 7518: JSON Web Algorithms (JWA)](https://datatracker.ietf.org/doc/html/rfc7518)
- [RFC 8037: CFRG Curves for JOSE (EdDSA)](https://datatracker.ietf.org/doc/html/rfc8037)
- [RFC 8725: JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [jwt.io: Introduction to JSON Web Tokens](https://jwt.io/introduction)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials)
- [MDN: Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin)

---

## Related pages
- [[jwt-java]]
- [[session-vs-cookie]]
- [[oauth2]]
- [[openssl-dgst]]
- [[openssl-keygen]]
- [[padding-oracle-attack]]

---

[^1]: BFF(Backend-for-Frontend): 프론트엔드 전용 백엔드를 두어 토큰을 서버 측에만 보관하고, 브라우저에는 HttpOnly 세션 쿠키만 발급하는 아키텍처 패턴.
