---
title: Java JWT — jjwt·Nimbus·Auth0 생성·검증 예시
updated: 2026-07-08 10:50:28
tags:
  - java
  - crypto
  - jwt
  - jjwt
  - nimbus
---

## 1. 개요

JWT 개념(구조·클레임·JWS/JWE·서명 알고리즘·보안)은 [[jwt]] 참조. 이 문서는 Java에서 **라이브러리별로 JWT를 생성·검증**하는 실행 예시다. 대표 3종을 다룬다.

| 라이브러리 | 좌표 | 특징 |
|---|---|---|
| **JJWT** | `io.jsonwebtoken:jjwt-*` | 가장 널리 쓰임, 간결한 빌더 API, JWS 중심 |
| **Nimbus JOSE+JWT** | `com.nimbusds:nimbus-jose-jwt` | JOSE 전체(JWS/JWE/JWK) 지원, Spring Security OAuth2가 내부 사용 |
| **Auth0 java-jwt** | `com.auth0:java-jwt` | 단순·경량, HS/RS/ES 서명 |

많이 쓰이는 알고리즘: **HS256**(HMAC, 대칭) · **RS256**(RSA, 비대칭) · **ES256**(ECDSA, 비대칭) · **EdDSA**. 원리·선택 기준은 [[jwt]] §5 참조.

---

## 2. JJWT (0.12.x)

### 2.1. 의존성
```gradle
implementation("io.jsonwebtoken:jjwt-api:0.12.6")
runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
```

### 2.2. HS256 생성·검증
```java
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Date;

SecretKey key = Jwts.SIG.HS256.key().build();   // 안전한 랜덤 HMAC 키(>=256bit)

// 생성
String jwt = Jwts.builder()
        .issuer("my-app")
        .subject("alice")
        .claim("role", "admin")
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 3_600_000))
        .signWith(key)                          // 알고리즘은 키에서 추론(HS256)
        .compact();

// 검증 + 파싱
Jws<Claims> jws = Jwts.parser()
        .verifyWith(key)
        .requireIssuer("my-app")                // iss 클레임 강제
        .build()
        .parseSignedClaims(jwt);                // 서명·exp 검증 실패 시 예외
Claims claims = jws.getPayload();
System.out.println(claims.getSubject() + " / " + claims.get("role"));
```

### 2.3. RS256 변형 — 비대칭 키
```java
import java.security.KeyPair;

KeyPair kp = Jwts.SIG.RS256.keyPair().build();
String jwt = Jwts.builder().subject("alice")
        .signWith(kp.getPrivate(), Jwts.SIG.RS256)   // 개인키 서명
        .compact();

Jws<Claims> jws = Jwts.parser()
        .verifyWith(kp.getPublic())                  // 공개키 검증
        .build().parseSignedClaims(jwt);
```

---

## 3. Nimbus JOSE+JWT

### 3.1. 의존성
```gradle
implementation("com.nimbusds:nimbus-jose-jwt:9.40")
```

### 3.2. HS256 생성·검증
```java
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;
import java.util.Date;

byte[] secret = new byte[32];                  // HS256은 최소 32바이트
new java.security.SecureRandom().nextBytes(secret);

// 생성
JWTClaimsSet claims = new JWTClaimsSet.Builder()
        .issuer("my-app")
        .subject("alice")
        .claim("role", "admin")
        .issueTime(new Date())
        .expirationTime(new Date(System.currentTimeMillis() + 3_600_000))
        .build();
SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
signedJWT.sign(new MACSigner(secret));
String token = signedJWT.serialize();

// 검증 + 파싱
SignedJWT parsed = SignedJWT.parse(token);
if (!parsed.verify(new MACVerifier(secret)))
        throw new SecurityException("서명 불일치");
JWTClaimsSet c = parsed.getJWTClaimsSet();
if (c.getExpirationTime().before(new Date()))
        throw new SecurityException("만료됨");        // exp 수동 검증
if (!"my-app".equals(c.getIssuer()))
        throw new SecurityException("iss 불일치");
// 실무: DefaultJWTProcessor + DefaultJWTClaimsVerifier로 클레임 검증 일원화
```

### 3.3. RS256 변형 — JWK 키쌍
```java
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;

RSAKey rsaJWK = new RSAKeyGenerator(2048).keyID("k1").generate();

SignedJWT jwt = new SignedJWT(
        new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(rsaJWK.getKeyID()).build(),
        claims);
jwt.sign(new RSASSASigner(rsaJWK));                       // 개인키 서명
String token = jwt.serialize();

SignedJWT parsed = SignedJWT.parse(token);
boolean ok = parsed.verify(new RSASSAVerifier(rsaJWK.toPublicJWK()));  // 공개키 검증
```

---

## 4. Auth0 java-jwt

### 4.1. 의존성
```gradle
implementation("com.auth0:java-jwt:4.4.0")
```

### 4.2. HS256 생성·검증
```java
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import java.util.Date;

Algorithm alg = Algorithm.HMAC256("secret-at-least-32-bytes-long!!!");

String token = JWT.create()
        .withIssuer("my-app")
        .withSubject("alice")
        .withClaim("role", "admin")
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + 3_600_000))
        .sign(alg);

DecodedJWT decoded = JWT.require(alg)   // 서명 알고리즘 고정
        .withIssuer("my-app")
        .build()                        // exp/iss 등 검증 규칙 포함
        .verify(token);                 // 실패 시 JWTVerificationException
System.out.println(decoded.getSubject() + " / " + decoded.getClaim("role").asString());
```

---

## 5. 라이브러리 비교·선택

### 5.1. 기능·특성 비교

| 항목 | JJWT | Nimbus JOSE+JWT | Auth0 java-jwt |
|---|---|---|---|
| API 스타일 | 간결한 fluent 빌더 | 저수준·명시적(JOSE 객체 직접) | 단순 빌더 |
| 범위 | JWS + JWE | **JOSE 전체**(JWS/JWE/JWK/nested) | **JWS(서명)만** |
| JWK/JWKS | 제한적 | **완전 지원**(생성·원격 JWKS) | 없음 |
| 클레임 검증 | 빌더에 내장(`requireX`) | 직접 조립(`DefaultJWTClaimsVerifier`) | 빌더에 내장(`withX`) |
| 의존성 | api/impl/jackson 3분할 | 단일 | 단일(+jackson) |
| 생태계 | 독립, 광범위 사용 | **Spring Security(리소스 서버)** 내부 사용 | 독립, 경량 |

### 5.2. 장단점

**JJWT**
- 장점: 직관적 fluent API, 안전한 기본값(0.12+에서 약한 키·`alg:none` 차단), JWS/JWE 모두 지원.
- 단점: JWK/JOSE 고급 기능은 Nimbus보다 얕음, 런타임 모듈(impl/jackson) 분리로 의존성 3개.

**Nimbus JOSE+JWT**
- 장점: JOSE 표준을 가장 폭넓게 커버(JWE·JWK·중첩), 원격 JWKS 검증 지원, Spring Security와 자연스러운 통합.
- 단점: 저수준이라 서명/검증/클레임 검증을 각각 조립해야 함(코드 장황), 기본값 안전장치를 직접 챙겨야 함.

**Auth0 java-jwt**
- 장점: 학습·사용이 가장 단순, 검증 규칙 빌더가 명확.
- 단점: **JWE 미지원**(서명만), JWK/JOSE 범위 좁음, 복잡한 요구엔 부족.

### 5.3. 선택 가이드

- **일반 백엔드의 서명 토큰 발급/검증** → **JJWT**(간결·안전 기본값).
- **JWE·JWK·원격 JWKS, Spring Security 리소스 서버 연동** → **Nimbus**.
- **아주 단순한 서명/검증만 필요** → **Auth0 java-jwt**.

---

## 6. 검증 시 공통 주의

- **알고리즘 고정** — 검증 측이 기대 알고리즘을 명시(allowlist)해 `alg:none`·HS/RS 혼동 공격을 막는다([[jwt]] 보안). 세 라이브러리 모두 검증기에 알고리즘/키를 고정한다.
- **클레임 검증** — 서명뿐 아니라 `exp`/`nbf`/`iss`/`aud`를 반드시 확인. jjwt·Auth0은 빌더에서, Nimbus는 `DefaultJWTClaimsVerifier`로 처리.
- **키 길이** — HS256은 최소 256비트(32바이트) 비밀 필요.
- **민감정보 금지** — payload는 base64url일 뿐 암호화가 아니다(서명=JWS). 기밀이 필요하면 JWE.

---

## Sources
- JJWT: https://github.com/jwtk/jjwt
- Nimbus JOSE+JWT: https://connect2id.com/products/nimbus-jose-jwt
- Auth0 java-jwt: https://github.com/auth0/java-jwt
- RFC 7519 — JSON Web Token (JWT): https://datatracker.ietf.org/doc/html/rfc7519
- RFC 7515 — JSON Web Signature (JWS): https://datatracker.ietf.org/doc/html/rfc7515
- RFC 7518 — JSON Web Algorithms (JWA): https://datatracker.ietf.org/doc/html/rfc7518
- RFC 8037 — CFRG Curves for JOSE (EdDSA): https://datatracker.ietf.org/doc/html/rfc8037
- RFC 8725 — JWT Best Current Practices: https://datatracker.ietf.org/doc/html/rfc8725

---

## Related pages
- [[jwt]] — JWT 개념·구조·클레임·서명 알고리즘·보안
- [[oauth2]] — JWT를 액세스 토큰으로 쓰는 맥락
- [[cmp-bouncycastle]] — 같은 Java 암호 카테고리(BouncyCastle CMP)
