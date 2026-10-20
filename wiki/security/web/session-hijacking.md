---
title: 세션 하이재킹
updated: 2026-10-20 17:54:47
tags:
  - web
  - http
  - session
  - security
---

## 1. 개요

세션 하이재킹은 공격자가 이미 인증된 사용자의 세션 ID를 탈취하거나 강제로 심어, 해당 사용자로 완전히 위장해 세션을 가로채는 공격이다. OWASP는 세션 하이재킹의 원인을 노출(disclosure), 가로채기(capture), 예측(prediction), 무차별 대입(brute force), 고정(fixation) 다섯 가지로 분류한다[^1].

[[csrf]]와 혼동하기 쉽지만 목적과 수단이 다르다. CSRF는 세션 ID를 훔치지 않고 쿠키 자동 첨부를 악용해 피해자 대신 요청을 위조하는 반면, 세션 하이재킹은 세션 ID 자체를 확보해 해당 세션의 권한으로 임의 요청을 보낸다. 민감한 작업에 재인증을 요구하면 탈취한 세션으로도 그 작업은 수행할 수 없다.

---

## 2. 공격 기법

### 2.1. 노출 (Disclosure)

세션 ID를 URL 쿼리 파라미터에 실으면 `Referer` 헤더, 브라우저 히스토리, 프록시·서버 접근 로그, 공유된 URL을 통해 제3자에게 노출될 수 있다.

### 2.2. 세션 스니핑 (Sidejacking)

세션 ID가 암호화되지 않은 구간을 지날 때 네트워크 트래픽을 도청해 탈취하는 방식이다. 공개 Wi-Fi처럼 같은 네트워크를 공유하는 환경에서 특히 위험하다. Firesheep이 이 공격을 자동화한 대표 사례다(§4).

### 2.3. 클라이언트 사이드 탈취

XSS(Cross-Site Scripting, 크로스사이트 스크립팅)로 주입된 스크립트가 `document.cookie`에서 세션 ID를 읽어 공격자 서버로 전송하거나, 악성코드가 브라우저 저장소·캐시에서 세션 값을 직접 추출하는 방식이다.

### 2.4. 세션 ID 예측 (Prediction)

세션 ID 생성 로직이 순차 증가나 타임스탬프 조합처럼 규칙성을 가지면, 공격자가 유효한 세션 ID를 추측해낼 수 있다. 암호학적으로 안전하지 않은 난수 생성기를 사용하는 경우도 여기 해당한다.

### 2.5. 무차별 대입 (Brute Force)

세션 ID의 엔트로피가 낮으면 가능한 값의 공간이 작아져 무차별 대입으로 유효한 세션 ID를 찾을 수 있다. OWASP는 세션 ID가 최소 64비트 엔트로피를 가져야 한다고 권장한다[^1].

### 2.6. 세션 고정 (Session Fixation)

공격자가 스스로 발급받았거나 임의로 정한 세션 ID를 로그인 전 피해자에게 미리 심어두고, 피해자가 그 ID로 로그인하면 공격자도 동일한 ID로 인증된 세션에 접근하는 공격이다. 세션 스니핑·예측·무차별 대입이 이미 활성화된 세션을 사후에 가로채는 것과 달리, 고정은 공격자가 사전에 알고 있는 ID를 피해자가 인증하게 만든다는 점에서 구분된다.

---

## 3. 방어 기법

### 3.1. 세션 ID 엔트로피 확보

세션 ID는 CSPRNG(Cryptographically Secure Pseudo-Random Number Generator, 암호학적으로 안전한 난수 생성기)로 생성하고 최소 64비트 이상의 엔트로피를 가져야 한다. 16진수로 인코딩할 경우 최소 16자 이상이 필요하며, ID 전체가 무작위여야 한다. 일부만 무작위이고 나머지가 고정·예측 가능하면 실효 엔트로피가 줄어든다. 프레임워크가 제공하는 세션 ID를 우선 사용한다. 직접 생성한다면 OWASP는 최소 128비트 크기의 CSPRNG 출력을 사용하고 고유성을 확보하도록 권고한다. 64비트 최소 엔트로피와 직접 생성 시의 크기 권고를 구분해야 한다[^1].

### 3.2. 전 구간 TLS 적용

로그인 페이지뿐 아니라 세션 ID가 오가는 모든 구간을 HTTPS로 보호해야 한다. `Secure` 속성과 결합하면 세션 스니핑을 차단할 수 있다. 다만 TLS는 예측·무차별 대입·고정 공격은 막지 못하므로 단독 방어 수단이 아니다[^1].

### 3.3. HttpOnly·SameSite

`HttpOnly`는 XSS를 통한 `document.cookie` 탈취를 차단하고, `SameSite=Strict` 또는 `Lax`는 크로스 사이트 경로로 세션 쿠키가 유출·오용되는 경로를 줄인다([[cookie]] §4).

### 3.4. 세션 ID 재발급

로그인 성공, 권한 상승 등 인증 상태가 바뀌는 시점마다 세션 ID를 재발급해야 한다. 공격자가 사전에 심어둔 ID는 재발급과 함께 무효화되므로 세션 고정을 직접 방어하는 조치다[^1].

### 3.5. 세션 타임아웃

세션 만료는 두 기준을 함께 적용한다. idle timeout은 마지막 요청 이후 비활동 시간을 기준으로 하며, 이 시간을 넘기면 세션을 만료시킨다. absolute timeout은 세션 생성 시점부터의 총 경과 시간을 기준으로 하며, 활동 여부와 무관하게 이 시간이 지나면 세션을 강제 종료한다. 둘 중 하나만 적용하면 계속 활동 중인 탈취 세션(idle timeout만 있는 경우)이나 짧은 활동 후 방치된 세션(absolute timeout만 있는 경우)을 놓칠 수 있다. OWASP는 민감도가 높은 서비스는 idle timeout 2~5분, 낮은 서비스는 15~30분을, absolute timeout은 4~8시간을 예시로 제시한다[^1].

### 3.6. 클라이언트 속성 바인딩

세션 ID를 발급 시점의 IP·User-Agent 등과 함께 기록해두고 이후 요청에서 값이 달라지면 이상 징후로 탐지한다. NAT·모바일망에서는 정상 사용자도 IP가 자주 바뀌고 User-Agent는 조작 가능하므로, 차단보다는 탐지·경고 목적의 보조 수단으로 쓰인다[^1].

### 3.7. 세션 전달과 폐기

세션 ID는 쿠키로만 전달하고 URL 쿼리 파라미터에 포함하지 않는다. 세션 쿠키에는 `__Host-` 접두사를 사용해 Domain 설정을 금지하고 host 범위를 제한할 수 있다.

```http
Set-Cookie: __Host-SessionID=<CSPRNG로 생성한 값>; Secure; HttpOnly; SameSite=Lax; Path=/
```

`__Host-`는 Secure와 Path=/를 요구하며 Domain을 허용하지 않는다. `SameSite` 값은 서비스의 로그인 이동과 교차 사이트 흐름에 맞춰 선택한다. 로그아웃에서는 쿠키 삭제와 함께 서버 측 세션도 무효화해야 한다. 쿠키만 삭제하면 이미 탈취된 세션 ID는 서버에서 계속 유효할 수 있다[^1].

### 3.8. Spring 설정

Spring Security는 인증 성공 시 세션 ID를 바꾸는 세션 고정 방어를 기본 적용한다(Servlet 3.1+에서 `changeSessionId`). 쿠키 속성과 idle timeout은 Spring Boot 속성으로 지정한다.

```yaml
server.servlet.session:
  timeout: 15m
  cookie:
    http-only: true
    secure: true
    same-site: lax
```

```java
http.sessionManagement(session -> session
    .sessionFixation(fixation -> fixation.changeSessionId()));
```

absolute timeout은 서블릿 설정에 없으므로 세션 생성 시각을 저장하고 필터에서 검사하는 식으로 직접 구현한다.

---

## 4. 실제 사례

2010년 공개된 Firesheep은 Firefox 확장으로, 공용 Wi-Fi에서 오가는 패킷을 스니핑해 Facebook·Twitter 등 로그인 이후 쿠키를 평문 HTTP로 전송하던 사이트의 세션 쿠키를 자동으로 수집했다. 수집된 세션은 사이드바에 표시되어 클릭 한 번으로 해당 사용자로 로그인할 수 있었다. 공개 첫 달에만 100만 회 이상 다운로드되며 세션 하이재킹의 실질적 위험을 알렸고, 이후 다수 웹 서비스가 로그인 이후 구간에도 HTTPS를 전면 적용하는 계기가 되었다.

---

## Sources
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Wikipedia: Firesheep](https://en.wikipedia.org/wiki/Firesheep)
- [Spring Security: Session Management](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)
- [Spring Boot: Application Properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

---

## Related pages
- [[cookie]]
- [[session-vs-cookie]]
- [[csrf]]
- [[replay-attack]]
- [[xss]]

---

[^1]: OWASP Session Management Cheat Sheet의 정의·권장값을 요약.
