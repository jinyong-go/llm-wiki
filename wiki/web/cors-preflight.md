---
title: CORS Preflight
updated: 2026-10-20 17:46:04
tags:
  - web
  - http
  - cors
  - backend
---

## 1. 개요

프리플라이트(preflight)는 브라우저가 교차 출처 본 요청을 보내기 전에 `OPTIONS` 메서드로 서버의 허용 여부를 확인하는 요청이다. [[cors]] 프로토콜을 이해하는 서버만 비단순 요청을 받도록 하는 사전 검사이며, 성공 결과는 프리플라이트 캐시에 저장된다.

---

## 2. 발생 조건

`fetch()`처럼 unsafe-request 플래그를 설정하는 API에서 다음 중 하나에 해당하면 프리플라이트가 발생한다.

1. 메서드가 CORS-safelisted 메서드(GET, HEAD, POST)가 아님[^1]
2. CORS-unsafe 요청 헤더가 있음
	- safelisted 헤더(`Accept`, `Accept-Language`, `Content-Language`, `Content-Type`, `Range`) 외의 헤더
	- safelisted 헤더라도 값이 128바이트를 초과하거나 CORS-unsafe 바이트를 포함함
	- safelisted 헤더 값의 합계가 1024바이트를 초과하면 해당 헤더 전체가 unsafe로 취급됨
	- `Content-Type`의 MIME 타입이 `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`이 아님
3. use-CORS-preflight 플래그가 설정됨
	- `XMLHttpRequestUpload`에 이벤트 리스너를 등록한 경우
	- 요청 본문에 `ReadableStream`을 사용한 경우

```javascript
// application/json + Authorization → 프리플라이트 발생
fetch("https://api.example.com/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer ..." },
  body: JSON.stringify({ id: 1 }),
});
```

---

## 3. 요청

브라우저는 다음 형태의 요청을 구성한다. 프리플라이트에는 쿠키 등 자격 증명이 포함되지 않는다.

```http
OPTIONS /orders HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Accept: */*
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization,content-type
```

`Access-Control-Request-Headers`에는 CORS-unsafe 헤더 이름이 소문자로 정렬되어 공백 없이 `,`로 연결된다. unsafe 헤더가 없으면 이 헤더는 생략된다.

---

## 4. 응답 검사

### 4.1. 성공 조건

다음을 모두 충족해야 본 요청이 전송된다.

1. 응답 상태가 ok status(200–299)
2. CORS 검사 통과: `Access-Control-Allow-Origin`, 자격 증명 모드가 `include`면 `Access-Control-Allow-Credentials: true`
3. 본 요청 메서드가 safelisted이거나 `Access-Control-Allow-Methods`에 포함됨
4. 모든 CORS-unsafe 헤더 이름이 `Access-Control-Allow-Headers`에 포함됨 (대소문자 무시)

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 3600
Vary: Origin
```

### 4.2. 와일드카드

`Access-Control-Allow-Methods`·`Access-Control-Allow-Headers`의 `*`는 자격 증명 모드가 `include`가 아닐 때만 와일드카드로 해석된다. `Authorization`은 CORS non-wildcard 헤더이므로 `*`로 허용되지 않고 이름을 명시해야 한다.

### 4.3. 리다이렉트

프리플라이트는 리다이렉트를 따르지 않는다. 3xx 응답은 ok status가 아니므로 네트워크 오류로 처리된다[^2]. HTTP→HTTPS 리다이렉트, 경로 끝 `/` 보정 리다이렉트가 OPTIONS에도 적용되면 프리플라이트가 실패한다.

---

## 5. 캐시

성공한 프리플라이트 결과는 메서드·헤더 이름 단위 항목으로 프리플라이트 캐시에 저장된다. 이 캐시는 브라우저의 일반 HTTP 캐시와 별개다. 캐시 키는 네트워크 파티션 키, 요청 origin, 요청 URL, 자격 증명 여부로 구성된다. URL 단위로 저장되므로 경로나 쿼리 문자열이 다르면 별도의 프리플라이트가 발생한다.

| 조건 | 유효 시간 |
|---|---|
| `Access-Control-Max-Age` 없음 | 5초 |
| Chromium 76 이상 상한 | 7200초 |
| Firefox 상한 | 86400초 |

상한을 넘는 값은 브라우저 상한으로 줄어든다. 본 요청이 네트워크 오류로 끝나면 해당 origin·URL의 캐시 항목이 삭제된다.

---

## 6. 서버 처리

### 6.1. 인증 필터

프리플라이트에는 쿠키·`Authorization`이 포함되지 않는다. 인증 필터가 CORS 처리보다 먼저 OPTIONS 요청을 검사하면 401/403을 반환하고, 이 응답은 ok status가 아니므로 프리플라이트가 실패한다. Spring Security는 `http.cors(...)`로 CORS 처리를 인증보다 앞에 둔다.

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(Customizer.withDefaults())   // UrlBasedCorsConfigurationSource 빈, 없으면 Spring MVC CORS 설정 사용
        .authorizeHttpRequests(a -> a.anyRequest().authenticated());
    return http.build();
}
```

### 6.2. 체크리스트

1. OPTIONS 요청을 인증·라우팅 이전에 처리하고 2xx로 응답
2. 프록시·게이트웨이가 OPTIONS를 차단하거나 리다이렉트하지 않는지 확인
3. `Access-Control-Allow-Headers`에 클라이언트가 보내는 커스텀 헤더 전체 포함
4. `Access-Control-Max-Age`로 반복 프리플라이트 감소

---

## Sources
- [Fetch Standard §4.8 CORS-preflight fetch](https://fetch.spec.whatwg.org/#cors-preflight-fetch)
- [Fetch Standard §4.9 CORS-preflight cache](https://fetch.spec.whatwg.org/#cors-preflight-cache)
- [Fetch Standard: CORS-safelisted request-header](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)
- [MDN: Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Max-Age)
- [MDN: Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
- [MDN: CORS – Simple requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#simple_requests)
- [Spring Security Reference: CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)

---

## Related pages
- [[cors]]
- [[csrf]]
- [[restful-api-design]]
- [[reverse-proxy]]

---

[^1]: CORS 이전부터 HTML `<form>`은 GET·POST 요청을 임의의 출처로 보낼 수 있었다. 따라서 서버는 이미 이런 요청에 대해 [[csrf]] 방어를 해야 했으며, 같은 요청에 프리플라이트를 요구하지 않는다. POST의 `Content-Type`이 폼 `enctype`의 세 값으로 제한되는 것도 같은 이유다.
[^2]: Fetch 표준은 프리플라이트를 HTTP-network-or-cache fetch로 수행하며 이 단계는 리다이렉트를 처리하지 않는다. 프리플라이트 응답 검사는 ok status(200–299)를 요구한다. 이 두 규칙을 근거로 3xx는 실패한다고 판단했다.
