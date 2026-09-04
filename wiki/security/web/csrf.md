---
title: CSRF — Cross-Site Request Forgery
updated: 2026-09-04 23:10:34
tags:
  - web
  - http
  - csrf
  - security
  - backend
---

## 1. 개요

**CSRF**(Cross-Site Request Forgery, 사이트 간 요청 위조)는 인증된 사용자의 브라우저를 속여 사용자가 의도하지 않은 요청을 신뢰하는 사이트로 전송시키는 공격이다. 브라우저는 [[cookie]]를 요청 대상 사이트로 자동 첨부하므로, 서버는 사용자가 직접 보낸 정상 요청과 악성 사이트가 유발한 위조 요청을 구분하지 못한다. 공격자는 응답을 읽을 필요가 없으므로, **상태를 변경하는 작업**(송금, 비밀번호·이메일 변경, 게시물 삭제 등)이 주 대상이다.

## 2. 성립 조건과 원리

CSRF가 성립하려면 다음이 모두 충족돼야 한다.

1. 대상 사이트가 CSRF 방어 기법을 갖추지 않음
2. 상태를 변경하는 요청(폼 제출, API 호출 등)이 존재
3. 요청에 필요한 파라미터를 공격자가 전부 예측 가능
4. 피해자가 대상 사이트에 로그인해 세션 쿠키를 보유한 상태로 악성 페이지를 방문

공격자는 세션 쿠키를 훔치는 것이 아니라 쿠키가 자동 첨부되는 점을 악용해 요청만 대신 보내는 것이므로 응답을 볼 수 없고, 정보 탈취가 아닌 **행위 위조**가 목적이다.

### 2.1. GET vs POST

- **GET** — `<img src="...">`, `<a href="...">` 등으로 자동 유발되어 방어가 없으면 가장 쉽게 악용된다. 예를 들어 은행 송금 기능이 GET으로 구현돼 있다면 아래 이미지 태그만으로 공격이 성립한다.

  ```html
  <img src="https://bank.example.com/transfer?to=attacker&amount=100000" width="0" height="0">
  ```

  피해자가 은행에 로그인한 상태로 이 페이지를 열면 브라우저는 `bank.example.com`의 세션 쿠키를 자동으로 실어 GET 요청을 전송한다. HTTP 스펙상 GET은 상태를 변경하지 않는 안전한 메서드로 규정되지만, 이를 어기고 GET으로 상태를 바꾸는 엔드포인트가 실제 사고의 주요 원인이었다(5장).
- **단순 POST** — `application/x-www-form-urlencoded`나 `multipart/form-data` 형식은 숨겨진 `<form>`을 자동 제출하는 스크립트로 동일하게 위조할 수 있다. [[cors]]의 단순 요청 조건과 겹친다.
- **JSON 본문·PUT/DELETE·커스텀 헤더** — `fetch`/`XMLHttpRequest`로만 만들 수 있어 SOP·CORS 프리플라이트의 보호를 받는다. CORS가 CSRF를 막아서가 아니라 이런 요청 형태 자체를 `<form>`으로는 만들 수 없기 때문이다([[cors]] 3장 오해 참고).

## 3. 방어 기법

### 3.1. Synchronizer Token Pattern (동기화 토큰)

서버가 세션마다 예측 불가능한 CSRF 토큰을 발급해 폼에 숨겨 넣고, 상태 변경 요청 시 토큰을 검증하는 방식이다. 가장 널리 쓰이지만 서버가 세션별 토큰을 관리해야 하는 상태 저장 방식이다.

```html
<form action="/transfer" method="post">
  <input type="hidden" name="csrf_token" value="OWY4NmQwODE4ODRj...">
</form>
```

### 3.2. Double Submit Cookie (이중 제출 쿠키)

토큰을 쿠키와 요청 파라미터(또는 헤더) 양쪽에 실어 보내고 서버가 일치 여부만 비교하는 방식으로, 서버 상태 저장이 불필요한 무상태(stateless) 방식이다.

- **Naive 방식** — 단순 난수만 비교하는 방식으로, 서브도메인 장악이나 DNS 문제로 쿠키를 주입당하면 공격자가 쿠키·파라미터 값을 동일하게 맞춰 우회할 수 있어 권장되지 않는다.
- **Signed 방식** — 토큰을 세션 ID 등과 함께 HMAC으로 서명해 발급하고 서버가 재계산해 검증하는 방식으로, 순수 난수 대조보다 안전해 권장된다.

### 3.3. SameSite 쿠키

`SameSite=Lax`는 모던 브라우저의 기본값으로 크로스 사이트 서브요청에 쿠키 첨부를 차단한다([[cookie]] 4장). 가장 손쉬운 1차 방어지만 단독으로는 불충분하다.

- `Lax`는 최상위 GET 네비게이션에는 쿠키를 여전히 포함하므로, GET으로 상태를 바꾸는 엔드포인트가 있으면 우회된다(2.1절 참고).
- 등록 도메인(registrable domain) 단위로 판정하므로 서브도메인 중 하나라도 신뢰 못 하면 위험하다.
- 구형 브라우저는 지원하지 않을 수 있다.

### 3.4. Origin/Referer 헤더 검증

요청의 `Origin`(없으면 `Referer`) 헤더가 서버 자신의 출처와 일치하는지 검사하는 방식이다. 구현은 간단하지만, 프록시가 헤더를 제거하거나 프라이버시 설정으로 `Origin: null`이 오는 경우가 전체 트래픽의 1~2% 정도 있어 이를 무조건 허용하면 방어가 약해진다.

### 3.5. Custom Header (커스텀 헤더)

AJAX/API 요청에 `X-CSRF-Token` 같은 커스텀 헤더를 요구하는 방식이다. `<form>`으로는 커스텀 헤더를 만들 수 없고, JS로 만들면 CORS 프리플라이트를 거치므로 다른 출처는 헤더를 실을 수 없다. CORS 설정에서 `Access-Control-Allow-Origin`을 신뢰 출처로 명시해야 우회되지 않는다.

> SameSite·Origin 검증·Custom Header는 모두 XSS가 있으면 무력화되는데, 같은 출처에서 실행되는 악성 스크립트가 토큰을 직접 읽어 정상 요청처럼 보낼 수 있기 때문이다. CSRF 방어는 XSS 방어를 전제로 한다.

## 4. 로그인 CSRF

인증되지 않은 상태에서도 성립하는데, 공격자가 자신의 계정으로 피해자를 강제 로그인시켜 피해자가 이후 입력하는 신용카드 정보 등을 공격자 계정에 귀속시키는 식이다. 로그인 폼에도 로그인 이전 세션(pre-session) 기반 CSRF 토큰이 필요하며, 로그인 성공 시 세션 ID를 재발급해 세션 고정 공격도 함께 막는다([[cookie]] 5장).

## 5. 실제 사고 사례

| 연도 | 대상 | 내용 |
|---|---|---|
| 2006 | Netflix | `Remember Me` 상태에서 페이지 방문만으로 DVD 대여 큐 조작, 배송지·로그인 정보 변경 가능 |
| 2007 | ING Direct | 온라인 뱅킹에서 CSRF로 임의 계좌 송금 가능 |
| 2008 | YouTube | 로그인 사용자의 좋아요 등 거의 모든 계정 작업을 공격자가 대행 가능 |
| 2008 | uTorrent | 로컬 웹 설정 페이지가 GET 요청만으로 제어돼 대규모 악성코드 설치에 악용 |
| 2008 | 멕시코 은행 고객 라우터 | 위조 메일 열람 시 피해자 홈 라우터에 위조 요청 전송, DNS 설정을 공격자 서버로 변경(파밍) |
| 2014 | Netflix | 계정 탈취·비밀번호 변경 가능한 CSRF 취약점 |
| 2020 | TikTok | CSRF를 포함한 취약점 조합으로 원클릭 계정 탈취 가능 |

상태 변경 엔드포인트가 GET을 허용했거나, 토큰·SameSite·Origin 검증 중 어느 것도 갖추지 않았던 경우가 공통적이다.[^1]

## 6. 요약

- CSRF는 쿠키 자동 첨부를 악용해 **인증된 사용자 대신 요청을 위조**하는 공격이며, 응답 열람이 아닌 행위 위조가 목적이다.
- 상태 변경 작업에 GET을 쓰지 않는 것이 최소 전제 조건이다.
- 방어는 Synchronizer Token·Double Submit Cookie 같은 토큰 검증에 SameSite 쿠키·Origin/Referer 검증을 중첩 적용하는 것이 실무 권장이며, CORS는 CSRF 방어 수단이 아니다([[cors]]).
- 모든 CSRF 방어는 XSS가 있으면 토큰·헤더를 스크립트가 직접 읽어 무력화되므로 XSS 방어를 전제로 한다.

[^1]: 추론. 5장 표의 각 사고는 개별 출처에서 원인을 명시하나, "GET 허용 또는 방어 기법 부재"라는 공통 패턴은 사고 개요들을 종합한 분석이며 각 출처가 직접 명시한 것은 아님.

---

## Sources
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP — Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
- [Wikipedia — Cross-site request forgery](https://en.wikipedia.org/wiki/Cross-site_request_forgery)

---
## Related pages
- [[cookie]]
- [[cors]]
- [[replay-attack]]
- [[restful-api-design]]
