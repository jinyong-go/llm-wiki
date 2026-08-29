---
title: Cookie
updated: 2026-07-06 17:31:44
tags:
  - web
  - http
  - cookie
  - security
---

## 1. 개요

Cookie는 서버가 `Set-Cookie` 응답 헤더로 발급하고, 브라우저가 저장했다가 **같은 서버로의 이후 요청에 자동 첨부**(`Cookie` 요청 헤더)하는 작은 데이터 조각이다. stateless인 HTTP에서 클라이언트를 기억하는 기본 수단이다 — 서버 세션과의 비교는 [[session-vs-cookie]] 참고.

```
HTTP/1.1 200 OK
Set-Cookie: theme=dark; Max-Age=31536000; Path=/

GET /page HTTP/1.1
Cookie: theme=dark
```

## 2. 주요 특징

- **`name=value` 형식** — 쿠키는 이름-값 쌍이 원칙이다(RFC 6265). `=` 없이 값만 설정하는 경우 동작이 갈린다:
  - RFC 6265(현행): `=`가 없으면 **set-cookie-string 전체를 무시** — 쿠키가 생성되지 않음
  - RFC 6265bis(개정)·최신 Chrome/Firefox: **빈 이름 쿠키**(name="", value=값)로 처리. 단 규격은 **서버가 이름 없는 쿠키를 만들지 말 것(MUST NOT)**을 명시 — 브라우저가 되돌려 보낼 때 직렬화가 예측 불가능하기 때문
  - 실무: 항상 `name=value`로 설정한다. 이름 없는 쿠키는 Safari 등 브라우저 간 불일치, 서버 프레임워크 파싱 비호환, `__Host-` 접두사 규칙 혼동 등의 문제가 있다
- **자동 첨부** — 브라우저가 scope(Domain/Path)에 맞는 모든 요청에 자동으로 실어 보낸다. 편리함의 근원이자 CSRF 취약점의 근원(5장)
- **용량 제한** — 쿠키당 약 4KB, 도메인당 개수 제한. 모든 요청에 실리므로 크기가 커지면 대역폭 낭비
- **수명** — `Expires`/`Max-Age` 지정 시 **persistent cookie**(만료까지 유지), 미지정 시 **session cookie**(브라우저 종료 시 삭제)
- **클라이언트 소유** — 사용자가 개발자 도구로 열람·수정·삭제할 수 있다 → 서버는 쿠키 값을 신뢰할 수 없으며, 무결성이 필요하면 서명(예: 세션 ID는 서버 대조, 값 자체엔 서명) 필요
- **first-party vs third-party** — 방문 중인 사이트가 설정한 쿠키 vs 페이지에 임베드된 다른 도메인(광고·분석)이 설정한 쿠키. 제3자 쿠키는 트래킹 우려로 브라우저들이 단계적 차단 중

## 3. 주요 저장 용도

| 용도 | 예 | 비고 |
|---|---|---|
| **세션 관리** | 세션 ID(`JSESSIONID`), 로그인 토큰 | 가장 중요한 용도 — 인증 상태 유지. 보안 속성(4장) 필수 |
| **개인화** | 언어, 테마, 통화 단위 | 서버 세션 없이 유지되는 사용자 설정 |
| **트래킹** | 방문 이력, 광고 식별자 | 주로 제3자 쿠키. 개인정보 규제(GDPR 동의 배너)의 대상 |
| 임시 상태 | 비로그인 장바구니, A/B 테스트 그룹 | |

> **민감 정보 직접 저장 금지** — 비밀번호·개인정보·권한 플래그를 쿠키 값에 넣으면 열람·변조된다. 서버 측 데이터를 가리키는 불투명한 식별자만 저장한다.

## 4. 보안 속성 (Set-Cookie)

| 속성 | 효과 | 방어 대상 |
|---|---|---|
| **`HttpOnly`** | JavaScript(`document.cookie`) 접근 차단 | **XSS**로 인한 세션 ID 탈취 — 세션 쿠키에 필수 |
| **`Secure`** | HTTPS 요청에만 전송 (localhost 예외) | 중간자 공격(평문 노출) |
| **`SameSite=Strict`** | 크로스 사이트 요청에 일절 미전송 | **CSRF** — 가장 엄격. 외부 링크로 진입해도 미전송이라 UX 저하 |
| **`SameSite=Lax`** | 크로스 사이트 서브요청(이미지·iframe·POST)엔 미전송, 최상위 GET 네비게이션엔 전송 | CSRF — 모던 브라우저 기본값 |
| **`SameSite=None`** | 크로스 사이트에도 전송 — **`Secure` 필수** | 제3자 컨텍스트(임베드)가 필요한 경우만 사용 |
| `Domain` / `Path` | 전송 범위 제한 (Domain 지정 시 서브도메인 포함으로 오히려 범위가 넓어짐에 주의) | 과도한 노출 축소 |
| `Expires` / `Max-Age` | 영속 수명 지정 (미지정 = 브라우저 세션) | – |
| **`__Host-` 접두사** | `Secure` + `Path=/` + `Domain` 미지정 강제 → 설정한 호스트에만 전송 | 서브도메인 쿠키 주입 |
| `__Secure-` 접두사 | `Secure` 강제 (Domain은 허용) | 비HTTPS 설정 실수 |

**세션 쿠키 권장 조합**:

```
Set-Cookie: __Host-SESSIONID=...; HttpOnly; Secure; SameSite=Lax; Path=/
```

## 5. Cookie 관련 취약점·공격

| 공격 | 원리 | 완화 |
|---|---|---|
| **세션 하이재킹 (XSS 경유)** | XSS로 주입된 스크립트가 `document.cookie`에서 세션 ID를 읽어 공격자에게 전송 → 세션 도용 | `HttpOnly` + XSS 자체 방어(출력 이스케이프, CSP) |
| **CSRF** | 쿠키 자동 첨부를 악용 — 로그인된 사용자가 악성 페이지를 열면 브라우저가 세션 쿠키를 실어 위조 요청 전송 | `SameSite=Lax/Strict` + CSRF 토큰, 중요 작업 재인증 |
| **네트워크 스니핑 (MITM)** | 평문 HTTP 전송 중 쿠키 탈취 | `Secure` + 전 구간 HTTPS(HSTS) |
| **Session Fixation** | 공격자가 미리 알고 있는 세션 ID를 피해자에게 심고, 피해자 로그인 후 그 ID로 접근 | **로그인 성공 시 세션 ID 재발급**, URL 세션 ID 금지 |
| **쿠키 주입 (cookie tossing)** | 장악한 서브도메인에서 `Domain=example.com` 쿠키를 설정해 본 도메인 세션에 개입 | `__Host-` 접두사(Domain 지정 불가 강제) |
| 쿠키 변조 | 클라이언트가 쿠키 값(권한 플래그 등)을 직접 수정 | 민감 값 저장 금지, 서버 측 상태 대조·서명 |

## Sources
- [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN — Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [RFC 6265: HTTP State Management Mechanism](https://www.rfc-editor.org/rfc/rfc6265.html)
- [RFC 6265bis (draft) — Cookies](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html)

---

## Related pages
- [[session-vs-cookie]]
- [[web-storage]]
- [[jwt]]
- [[cors]]
