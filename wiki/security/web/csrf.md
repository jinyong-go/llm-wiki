---
title: CSRF
updated: 2026-10-20 17:54:47
tags:
  - web
  - http
  - csrf
  - security
  - backend
---

## 1. 개요

CSRF(Cross-Site Request Forgery, 사이트 간 요청 위조)는 인증된 사용자의 브라우저를 속여 사용자가 의도하지 않은 요청을 신뢰하는 사이트로 전송시키는 공격이다. 브라우저는 [[cookie]]를 요청 대상 사이트로 자동 첨부하므로, 서버는 사용자가 직접 보낸 정상 요청과 악성 사이트가 유발한 위조 요청을 구분하지 못한다. 공격자는 응답을 읽을 필요가 없으므로, 상태를 변경하는 작업(송금, 비밀번호·이메일 변경, 게시물 삭제 등)이 주 대상이다.

## 2. 성립 조건

세션 기반 CSRF에서는 일반적으로 다음 조건이 필요하다. 인증 전에도 성립하는 로그인 CSRF는 §4에서 별도로 다룬다.

1. 대상 사이트가 CSRF 방어 기법을 갖추지 않음
2. 상태를 변경하는 요청(폼 제출, API 호출 등)이 존재
3. 요청에 필요한 파라미터를 공격자가 전부 예측 가능
4. 피해자 브라우저가 대상 요청에 유효한 인증 정보를 첨부할 수 있고, 공격자가 요청을 유발할 수 있음

공격자는 세션 쿠키를 훔치는 것이 아니라 쿠키가 자동 첨부되는 점을 악용해 요청만 대신 보내는 것이므로 응답을 읽을 필요 없이 행위를 위조한다. 응답 열람 가능 여부는 SOP·CORS 등 별도 정책에 따라 결정된다.

### 2.1. 요청 유형

- GET: 이미지 로드나 링크 이동 등으로 유발되어 방어가 없으면 가장 쉽게 악용된다. 예를 들어 은행 송금 기능이 GET으로 구현돼 있다면 아래 이미지 태그만으로 공격이 성립한다.

  ```html
  <img src="https://bank.example.com/transfer?to=attacker&amount=100000" width="0" height="0">
  ```

  피해자가 은행에 로그인했고 쿠키 정책이 교차 사이트 이미지 요청에 쿠키 첨부를 허용하면 인증된 GET 요청이 전송된다. `SameSite=Lax`나 `Strict`는 이 이미지 요청의 쿠키 첨부를 제한하므로 예제가 항상 성립하지는 않는다. 반면 Lax 쿠키는 교차 사이트 최상위 GET 이동에 포함될 수 있다. HTTP 스펙상 GET은 상태를 변경하지 않는 안전한 메서드로 규정되지만, 이를 어기고 GET으로 상태를 바꾸는 엔드포인트가 실제 사고의 주요 원인이었다(§5).
- 단순 POST: `application/x-www-form-urlencoded`나 `multipart/form-data` 형식은 숨겨진 `<form>`을 자동 제출하는 스크립트로 동일하게 위조할 수 있다. [[cors]]의 단순 요청 조건과 겹친다.
- JSON 본문·PUT/DELETE·커스텀 헤더: 일반 HTML 폼으로 해당 메서드·헤더 조합을 만들 수 없다. 교차 출처 스크립트 요청은 프리플라이트를 거치므로, 서버가 신뢰하지 않는 출처를 거부하면 본 요청을 막을 수 있다. 서버가 JSON만 수용하고 단순 Content-Type이나 메서드 우회 파라미터로 같은 작업을 허용하지 않아야 한다.

## 3. 방어 기법

### 3.1. 동기화 토큰

서버가 세션마다 예측 불가능한 CSRF 토큰을 발급해 폼에 숨겨 넣고, 상태 변경 요청 시 토큰을 검증하는 방식이다. 가장 널리 쓰이지만 서버가 세션별 토큰을 관리해야 하는 상태 저장 방식이다.

```html
<form action="/transfer" method="post">
  <input type="hidden" name="csrf_token" value="OWY4NmQwODE4ODRj...">
</form>
```

### 3.2. 이중 제출 쿠키

인증 쿠키와 별도로 CSRF 토큰 쿠키를 발급하고, 클라이언트가 같은 토큰을 요청 헤더나 폼 필드에도 담아 제출하는 방식이다. 서버가 CSRF 토큰을 세션별로 저장할 필요는 없다.

1. 서버가 CSRF 토큰을 생성해 쿠키로 전달한다.
2. 클라이언트는 토큰을 읽어 상태 변경 요청의 `X-CSRF-Token` 헤더나 숨김 필드에 넣는다. 쿠키는 브라우저가 자동으로 첨부한다.
3. 서버는 쿠키와 헤더·필드의 토큰이 모두 존재하고 일치하는지 확인한다. 서명형은 현재 세션에 대한 HMAC 검증도 수행한다.

공격자는 피해자의 브라우저가 쿠키를 전송하도록 유도할 수 있지만, SOP가 유지되고 쿠키 주입이나 XSS가 없다면 토큰을 읽어 별도 필드에 같은 값으로 제출할 수 없다. 따라서 쿠키의 존재만 확인해서는 방어할 수 없다.

- **단순 비교형**: 난수 토큰의 일치 여부만 검사한다. 공격자가 취약한 서브도메인 등을 통해 대상 도메인에 쿠키를 주입하면, 자신이 정한 토큰을 쿠키와 요청 필드에 함께 넣어 우회할 수 있어 권장되지 않는다.
- **서명형**: 서버 비밀키로 현재 로그인 세션을 식별하는 값과 난수를 HMAC 처리해 토큰을 발급한다. 서버는 요청에서 받은 난수와 현재 세션 정보로 HMAC을 재계산해 상수 시간 비교[^1]로 검증한다. 세션 결합 없이 서명만 추가해서는 충분하지 않으며, 세션 ID 원문을 CSRF 토큰에 노출해서는 안 된다.

JavaScript가 CSRF 쿠키를 읽어 헤더에 복사하는 구성에서는 해당 쿠키에 `HttpOnly`를 설정하지 않는다. 인증 쿠키의 `HttpOnly`는 유지한다.

### 3.3. SameSite 쿠키

`SameSite=Lax`는 교차 사이트 서브리소스 요청의 쿠키 첨부를 제한한다. 속성을 생략했을 때의 기본 동작에 의존하지 말고 명시적으로 설정한다. 단독 방어로는 불충분하다.

- `Lax`는 최상위 GET 네비게이션에는 쿠키를 여전히 포함하므로, GET으로 상태를 바꾸는 엔드포인트가 있으면 우회된다(§2.1 참고).
- 사이트 판정은 scheme과 등록 가능 도메인을 기준으로 하며 origin 판정과 다르다. 같은 scheme의 형제 서브도메인은 같은 사이트일 수 있으므로 신뢰하지 않는 서브도메인에 주의한다.
- 구형 브라우저는 지원하지 않을 수 있다.

### 3.4. Origin/Referer 헤더 검증

요청의 `Origin`(없으면 `Referer`) 헤더가 서버 자신의 출처와 일치하는지 검사하는 방식이다. 리다이렉트나 sandboxed iframe 등에서는 `Origin: null`이 올 수 있고 헤더가 누락될 수도 있다. 누락·null 값을 무조건 허용하지 말고 서버가 검증하는 CSRF 토큰 등의 명시적 대체 절차를 적용한다. 프록시 환경에서는 신뢰하는 프록시 설정으로 대상 origin을 결정한다.

### 3.5. 커스텀 헤더

AJAX/API 요청에 `X-CSRF-Token` 같은 커스텀 헤더를 요구하는 방식이다. `<form>`으로는 커스텀 헤더를 만들 수 없고, 교차 출처 스크립트가 추가하면 CORS 프리플라이트를 거친다. 서버는 해당 헤더를 필수로 검사하고 신뢰하지 않는 출처의 프리플라이트를 허용하지 않아야 한다. 형식상 헤더의 존재만 확인하는 방식과 실제 CSRF 토큰 값을 검증하는 방식은 구분한다.

> XSS가 있으면 이 장의 모든 방어가 무력화된다. 같은 출처에서 실행되는 스크립트는 페이지에서 CSRF 토큰을 읽고, 브라우저가 붙이는 Origin·SameSite 조건도 정상 요청과 동일하게 충족한다. CSRF 방어는 [[xss]] 방어를 전제로 한다.

### 3.6. Fetch Metadata

브라우저는 요청에 `Sec-Fetch-Site` 헤더로 요청 시작 지점과 대상의 관계(`same-origin`, `same-site`, `cross-site`, `none`)를 전달한다. 서버는 상태 변경 요청에서 `cross-site` 값을 거부하는 정책을 추가할 수 있다. 헤더를 보내지 않는 구형 브라우저가 있으므로 토큰 검증의 보조 수단으로 사용한다.

```java
String site = request.getHeader("Sec-Fetch-Site");
boolean unsafe = !Set.of("GET", "HEAD", "OPTIONS").contains(request.getMethod());
if (unsafe && "cross-site".equals(site)) {
    response.sendError(HttpServletResponse.SC_FORBIDDEN);
    return;
}
```

### 3.7. Spring Security

Spring Security는 CSRF 보호를 기본 활성화하며, 안전하지 않은 메서드(POST·PUT·DELETE 등)에서 세션에 저장한 토큰을 검증한다. 서버 렌더링 폼은 Thymeleaf 등이 숨김 필드를 자동으로 추가한다.

JavaScript가 토큰을 헤더로 보내는 SPA는 쿠키 기반 저장소를 사용한다. 현행 레퍼런스(7.x)는 이를 위한 설정을 제공한다.

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.spa());   // XSRF-TOKEN 쿠키 → X-XSRF-TOKEN 헤더
    return http.build();
}
```

6.x에서는 `CookieCsrfTokenRepository.withHttpOnlyFalse()`와 요청 핸들러를 직접 구성한다. 기본 핸들러는 BREACH 대응으로 토큰을 마스킹하므로, 쿠키 값을 그대로 헤더로 보내는 클라이언트와 맞지 않을 수 있다.

## 4. 로그인 CSRF

인증되지 않은 상태에서도 성립하는데, 공격자가 자신의 계정으로 피해자를 강제 로그인시켜 피해자가 이후 입력하는 신용카드 정보 등을 공격자 계정에 귀속시키는 식이다. 로그인 폼에도 로그인 이전 세션(pre-session) 기반 CSRF 토큰이 필요하며, 로그인 성공 시 세션 ID를 재발급해 세션 고정 공격도 함께 막는다([[cookie]] §5).

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

상태 변경 엔드포인트가 GET을 허용했거나, 토큰·SameSite·Origin 검증 중 어느 것도 갖추지 않았던 경우가 공통적이다.[^2]

---

## Sources
- [Fetch Standard §3.3](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [MDN Set-Cookie: SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP: Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
- [Wikipedia: Cross-site request forgery](https://en.wikipedia.org/wiki/Cross-site_request_forgery)
- [MDN: Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)
- [Spring Security: CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)

---
## Related pages
- [[cookie]]
- [[cors]]
- [[replay-attack]]
- [[restful-api-design]]
- [[xss]]
- [[session-hijacking]]

---

[^1]: 상수 시간 비교는 같은 길이의 두 값에서 일치하는 부분의 길이나 불일치 위치에 따라 비교 시간이 달라지지 않도록 검사하는 방식이다. 시간 차이로 HMAC 값을 추측하는 타이밍 공격을 줄이기 위해 사용하며, 실제 실행 시간이 항상 정확히 같다는 뜻은 아니다.
[^2]: 추론. §5 표의 각 사고는 개별 출처에서 원인을 명시하나, "GET 허용 또는 방어 기법 부재"라는 공통 패턴은 사고 개요들을 종합한 분석이며 각 출처가 직접 명시한 것은 아님.
