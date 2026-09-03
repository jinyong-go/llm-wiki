---
title: Replay Attack
updated: 2026-09-03 22:36:42
tags:
  - web
  - network
  - security
  - replay-attack
---

## 1. 개요

Replay Attack(재전송 공격)은 공격자가 네트워크상에서 오간 **유효한 메시지를 가로채 기록**한 뒤, 나중에 그대로 또는 지연시켜 **재전송**함으로써 수신측이 정상 요청으로 오인하게 만드는 공격이다. 메시지가 암호화·서명되어 있어도 내용을 해독할 필요 없이 그대로 재생하는 것만으로 성립하므로, 기밀성·무결성 보장과는 별개로 **신선도(freshness)** 검증이 필요하다. 대상 예: 로그인/인증 메시지, API 요청(HMAC 서명 포함), 결제 트랜잭션, IPsec/TLS 패킷.

방어 기법은 크게 네 가지로 나뉜다.

- **Nonce** — 매 메시지마다 고유값(1회용) 부여, 서버가 사용 이력과 대조
- **타임스탬프** — 메시지 유효기간을 두고 허용 오차 밖이면 거부
- **Nonce + 타임스탬프** — 서명에 둘 다 포함해 신선도 보장, 저장소 크기도 유한화
- **시퀀스 번호 + Sliding Window** — 순서 있는 채널에서 순증가 번호로 순서·중복 판별

## 2. Nonce

Nonce(Number used ONCE)는 요청마다 부여하는 일회용 값으로, 서버가 사용된 nonce를 기록해두었다가 동일 값이 재사용되면 거부한다. 생성 방식은 두 가지로 나뉜다.

- **서버 발급(challenge-response)** — 서버가 먼저 nonce를 발급하고 클라이언트는 그 값을 포함해 요청(HTTP Digest Authentication, WebAuthn challenge 등). 발급을 위한 왕복(round trip)이 추가로 필요
- **클라이언트 생성** — 클라이언트가 충분히 큰 난수(UUID 등)를 생성해 요청에 포함, 서버는 사용된 nonce를 저장소에 기록해 중복 검사

타임스탬프 없이 nonce만 사용하면 서버가 사용 이력을 무기한 보관해야 하는 문제가 있다(4장 참고).

## 3. 타임스탬프

요청 생성 시각을 메시지(또는 서명 대상)에 포함시키고, 서버는 수신 시각과 비교해 **허용 오차(tolerance window)**를 벗어나면 거부한다. 클라이언트-서버 시계 오차(clock skew)를 감안해 실무에서는 통상 수 분(예: 3~5분) 범위로 설정한다.

한계: 허용 오차 범위 안에서는 가로챈 요청을 재전송해도 그대로 통과하므로, 타임스탬프만으로는 오차 내 재전송을 막지 못한다.

## 4. Nonce + 타임스탬프 조합

두 값을 함께 서명(HMAC 등)에 포함시켜 신선도를 보장하는 방식으로, 결제·계정 변경 등 중요 작업에 권장된다.

- 타임스탬프로 1차 검증(저장소 조회 없이 즉시 판정) 후, 통과한 요청에 한해 nonce 중복 여부를 저장소에서 확인
- 타임스탬프 허용 오차 구간만큼만 nonce를 보관하면 되므로 저장소가 무한히 커지지 않아, 2장의 저장소 문제가 3장과의 결합으로 해결된다

## 5. 시퀀스 번호 + Sliding Window (Anti-Replay Window)

IPsec AH/ESP([RFC 4303](https://www.rfc-editor.org/rfc/rfc4303.html))가 사용하는 방식으로, 순서가 보장되지 않는 채널에서 순증가 시퀀스 번호와 윈도우 비트맵으로 중복·재전송을 판별한다. 수신자는 무결성 검증에 성공한 최고 시퀀스 번호 N과 윈도우 크기 W(기본 64)를 유지하며, 윈도우보다 오래된 시퀀스는 무조건 거부하고 윈도우 내부는 비트맵으로 중복 여부를 확인한다. 상세 구조·판정 알고리즘·구현 예제는 [[sliding-window]] 참고.

---

## Sources
- [RFC 4303 — IP Encapsulating Security Payload (ESP)](https://www.rfc-editor.org/rfc/rfc4303.html)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [A Guide to Replay Attacks And How to Defend Against Them — Packetlabs](https://www.packetlabs.net/posts/a-guide-to-replay-attacks-and-how-to-defend-against-them/)

---
## Related pages
- [[sliding-window]]
- [[sso]]
- [[oauth2]]
- [[jwt]]
