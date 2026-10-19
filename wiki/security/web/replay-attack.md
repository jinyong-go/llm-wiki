---
title: 재전송 공격
updated: 2026-10-19 18:01:14
tags:
  - web
  - network
  - security
  - replay-attack
---

## 1. 개요

재전송 공격은 유효한 메시지를 기록한 뒤 다시 제출해 수신자가 정상 요청으로 받아들이게 하는 공격이다. 서명된 API 요청이나 인증 메시지도 재사용 검사가 없으면 대상이 된다. 기밀성·무결성과 별도로 메시지의 신선도와 중복 여부를 검증해야 한다.

---

## 2. 대상

- 서명된 API 요청: 서명이 유효해도 같은 요청을 다시 보내면 정상 요청으로 수용될 수 있다.
- 인증 토큰: [[jwt]]의 `jti`, [[oauth2]]의 refresh token 회전과 DPoP, [[sso]]의 Assertion ID가 재사용 검사 수단이다.
- 인증 응답: [[webauthn]]의 challenge, Kerberos의 Authenticator가 일회성 검사 대상이다.
- TLS 1.3 0-RTT: 일반적인 TLS 레코드는 프로토콜이 재전송을 방어하지만, TLS 1.3의 0-RTT 데이터는 연결 간 재전송 방지를 보장하지 않는다. 애플리케이션은 재전송해도 안전한 데이터만 0-RTT로 전송해야 한다.

---

## 3. 방어 기법

### 3.1. Nonce

Nonce는 한 번만 사용하는 값이다. 서버 발급 challenge를 응답에 포함하거나, 클라이언트가 생성한 고유 난수를 요청에 포함해 검증한다. 서버는 발급·사용·만료 상태를 관리하고 같은 값의 재사용을 거부한다. [[webauthn]]의 challenge가 서버 발급 방식의 예다.

타임스탬프가 없어도 서버가 challenge의 만료를 관리하면 상태 보관 기간을 제한할 수 있다. 반면 클라이언트 생성 nonce를 만료 조건 없이 영구적으로 유효하게 취급하면 사용 이력 보관도 계속 필요하다.[^1]

### 3.2. 타임스탬프

서명된 요청의 생성 시각이나 만료 시각을 검증해 허용 기간 밖의 요청을 거부한다. 허용 범위는 프로토콜과 시계 오차에 맞춰 정한다. 타임스탬프만으로는 유효기간 안의 중복 요청을 막지 못한다.

### 3.3. 시퀀스 번호

IPsec ESP는 증가하는 시퀀스 번호와 수신 비트맵으로 재전송을 검사한다. 수신자는 무결성 검증을 통과한 패킷으로만 윈도우를 갱신하고, 중복 번호나 범위 밖의 오래된 번호를 거부한다. 상세 규칙과 Java 예제는 [[sliding-window]]를 참고한다.

### 3.4. 조합

서명은 nonce·시각뿐 아니라 메서드·대상 URI·본문 무결성 등 애플리케이션이 보호해야 하는 요청 요소에 바인딩해야 한다. nonce만 서명하면 그 서명을 다른 요청에 옮겨 사용하는 공격이 가능하다.

서명과 시각을 검증한 후 nonce의 중복 검사와 사용 등록을 원자적으로 수행한다. nonce 상태는 해당 요청이 더 이상 유효하게 수용될 수 없는 시점까지 유지한다. 미래 시각을 허용하는 정책에서는 최초 수신 시각부터 단순히 허용 오차만큼 보관하면 부족할 수 있다.[^1]

---

## 4. 구현

타임스탬프로 수용 기간을 제한하고, 그 기간 동안 nonce 사용 기록을 원자적으로 등록한다. Redis의 `SET NX EX`는 존재 확인과 등록을 한 명령으로 수행한다.

```java
Duration window = Duration.ofMinutes(5);
Instant ts = Instant.ofEpochSecond(request.timestamp());
if (Duration.between(ts, Instant.now()).abs().compareTo(window) > 0) {
    throw new ReplayException("expired");
}
Boolean first = redis.opsForValue()
        .setIfAbsent("nonce:" + request.nonce(), "1", window.multipliedBy(2));
if (!Boolean.TRUE.equals(first)) {
    throw new ReplayException("duplicate");
}
```

TTL은 과거·미래 양방향 허용 범위를 모두 덮도록 잡는다. 서명 검증은 이 검사보다 먼저 수행해, 위조된 요청이 nonce 저장소를 채우지 못하게 한다.

---

## Sources
- [RFC 9421 §7.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2)
- [RFC 8446 §8](https://www.rfc-editor.org/rfc/rfc8446.html#section-8)
- [RFC 4303 §3.4.3](https://www.rfc-editor.org/rfc/rfc4303.html#section-3.4.3)
- [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)

---
## Related pages
- [[sliding-window]]
- [[webauthn]]
- [[sso]]
- [[oauth2]]
- [[jwt]]

---

[^1]: nonce 상태 관리에 대한 구현 판단. RFC 9421의 nonce 유일성 및 시각 검증을 기준으로, 서버가 수용할 수 있는 기간 전체에 사용 기록이 남아 있어야 중복을 거부할 수 있다고 도출했다. 원자성이 없으면 동시 요청이 같은 nonce 검사를 통과할 수 있다.
