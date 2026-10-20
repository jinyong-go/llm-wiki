---
title: Cookie
updated: 2026-10-20 17:54:47
tags:
  - web
  - http
  - cookie
  - security
---

## 1. 개요

Cookie는 서버가 `Set-Cookie` 응답 헤더로 발급하고, 브라우저가 저장했다가 같은 서버로 보내는 이후 요청에 `Cookie` 요청 헤더로 자동 첨부하는 작은 데이터다. stateless인 HTTP에서 클라이언트를 기억하는 기본 수단이며, 서버 세션과의 비교는 [[session-vs-cookie]] 참고.

```
HTTP/1.1 200 OK
Set-Cookie: theme=dark; Max-Age=31536000; Path=/

GET /page HTTP/1.1
Cookie: theme=dark
```

---

## 2. 특징

### 2.1. 형식

쿠키는 `name=value` 쌍으로 설정한다. 이름 없이 값만 설정한 쿠키는 규격과 브라우저마다 처리가 달라 사용하지 않는다[^1].

### 2.2. 전송 범위

브라우저는 `Domain`·`Path`에 맞는 모든 요청에 쿠키를 자동으로 첨부한다. 이 동작이 [[csrf]]의 원인이 된다(§5).

방문 중인 사이트가 설정한 쿠키를 first-party 쿠키, 페이지에 임베드된 다른 사이트(광고·분석)가 설정한 쿠키를 third-party 쿠키라 한다. 제3자 쿠키는 Firefox(Total Cookie Protection)·Safari(ITP)가 기본으로 제한한다. Chrome은 기본 차단하지 않으며 시크릿 모드나 사용자 설정 시 차단한다.

`Partitioned`(CHIPS) 속성을 지정한 쿠키는 설정한 출처와 최상위 사이트를 함께 키로 저장되어, 설정 당시의 최상위 사이트 안에서만 읽힌다. `Secure`가 필수다.

### 2.3. 수명

`Expires`/`Max-Age`를 지정하면 만료 시각까지 유지되는 persistent cookie, 지정하지 않으면 브라우저 종료 시 삭제되는 session cookie다.

### 2.4. 용량

쿠키당 약 4KB이며 도메인당 개수도 제한된다. 모든 요청에 실리므로 크기가 커지면 대역폭이 낭비된다.

### 2.5. 신뢰성

사용자가 개발자 도구로 쿠키를 열람·수정·삭제할 수 있으므로 서버는 쿠키 값을 신뢰하지 않는다. 세션 ID는 서버 측 상태와 대조하고, 값 자체의 무결성이 필요하면 서명한다.

---

## 3. 용도

| 용도 | 예 | 비고 |
|---|---|---|
| 세션 관리 | 세션 ID(`JSESSIONID`), 로그인 토큰 | 인증 상태 유지. §4의 보안 속성 필수 |
| 개인화 | 언어, 테마, 통화 단위 | 서버 세션 없이 유지되는 사용자 설정 |
| 트래킹 | 방문 이력, 광고 식별자 | 주로 제3자 쿠키. GDPR 등 개인정보 규제 대상 |
| 임시 상태 | 비로그인 장바구니, A/B 테스트 그룹 | |

비밀번호·개인정보·권한 플래그를 쿠키 값에 넣으면 열람·변조될 수 있다. 쿠키에는 서버 측 데이터를 가리키는 불투명한 식별자만 저장한다.

---

## 4. 보안 속성

| 속성 | 효과 | 방어 대상 |
|---|---|---|
| `HttpOnly` | JavaScript(`document.cookie`) 접근 차단 | XSS로 인한 세션 ID 탈취. 세션 쿠키에 필수 |
| `Secure` | HTTPS 요청에만 전송. localhost는 예외 | 중간자 공격(평문 노출) |
| `SameSite=Strict` | 크로스 사이트 요청에 전송하지 않음 | CSRF. 외부 링크로 진입해도 전송하지 않아 사용성이 떨어짐 |
| `SameSite=Lax` | 크로스 사이트 서브요청(이미지·iframe·POST)에는 전송하지 않고, 최상위 GET 네비게이션에는 전송 | CSRF |
| `SameSite=None` | 크로스 사이트에도 전송. `Secure` 필수 | 임베드 등 제3자 컨텍스트가 필요한 경우에만 사용 |
| `Domain` / `Path` | 전송 범위 지정. `Domain`을 지정하면 서브도메인까지 포함되어 범위가 넓어짐 | 노출 범위 축소 |
| `Expires` / `Max-Age` | 영속 수명 지정. 미지정 시 브라우저 세션 동안 유지 | |
| `__Host-` 접두사 | `Secure`, `Path=/`, `Domain` 미지정을 강제해 설정한 호스트에만 전송 | 서브도메인 쿠키 주입 |
| `__Secure-` 접두사 | `Secure` 강제. `Domain`은 허용 | 비HTTPS 설정 실수 |

`SameSite`를 지정하지 않았을 때 `Lax`를 기본 적용하는 브라우저는 일부다. 기본값으로 적용된 `Lax`는 설정 후 2분 이내의 POST 요청에도 쿠키를 전송한다.

세션 쿠키 권장 조합:

```
Set-Cookie: __Host-SESSIONID=...; HttpOnly; Secure; SameSite=Lax; Path=/
```

---

## 5. 공격

| 공격 | 원리 | 완화 |
|---|---|---|
| 세션 하이재킹 | 세션 ID를 탈취(XSS·스니핑·예측)하거나 미리 심어(Session Fixation) 사용자로 위장 | [[session-hijacking]] 참고 |
| CSRF | 로그인된 사용자가 악성 페이지를 열면 브라우저가 세션 쿠키를 자동 첨부해 위조 요청 전송 | `SameSite=Lax/Strict`, CSRF 토큰, 중요 작업 재인증 |
| 네트워크 스니핑(MITM) | 평문 HTTP 전송 중 쿠키 탈취 | `Secure`, 전 구간 HTTPS(HSTS) |
| 쿠키 주입(cookie tossing) | 장악한 서브도메인에서 `Domain=example.com` 쿠키를 설정해 본 도메인 세션에 개입 | `__Host-` 접두사 |
| 쿠키 변조 | 클라이언트가 쿠키 값(권한 플래그 등)을 직접 수정 | 민감 값 저장 금지, 서버 측 상태 대조·서명 |

---

## Sources
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN: Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [MDN: Third-party cookies](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies)
- [MDN: Partitioned cookies (CHIPS)](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Privacy_sandbox/Partitioned_cookies)
- [RFC 6265: HTTP State Management Mechanism](https://www.rfc-editor.org/rfc/rfc6265.html)
- [RFC 6265bis (draft): Cookies](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html)

---

## Related pages
- [[session-vs-cookie]]
- [[web-storage]]
- [[jwt]]
- [[cors]]
- [[session-hijacking]]
- [[csrf]]

---

[^1]: RFC 6265는 `=`가 없는 set-cookie-string 전체를 무시한다. RFC 6265bis와 최신 Chrome·Firefox는 이름이 빈 쿠키로 처리하지만, 서버가 이름 없는 쿠키를 만들지 말 것(MUST NOT)을 명시한다. Safari 등 브라우저 간 동작과 서버 프레임워크의 파싱이 일치하지 않는다.
