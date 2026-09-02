---
title: Forward Headers — 리버스 프록시 뒤 redirect 문제
updated: 2026-07-14 11:26:44
tags:
  - java
  - spring
  - nginx
  - reverse-proxy
  - redirect
---

nginx 같은 리버스 프록시가 TLS를 종료(terminate)하고 Spring Boot에 평문 HTTP로 포워딩할 때, 앱이 생성하는 redirect URL이 외부 요청과 어긋나 발생하는 문제와 해결 설정을 정리한다.

## 1. 문제

프록시가 TLS를 종료하면 앱이 보는 요청은 `http://내부호스트:8080`이다. 앱이 redirect를 만들 때(`HttpServletResponse.sendRedirect`, `RedirectView`, Spring Security 인증 리다이렉트 등) `Location` 헤더의 절대 URL을 **자신이 본 요청 기준**으로 구성하므로 다음이 발생한다.

- `https://` 대신 `http://`로 리다이렉트 → mixed-content / 스킴 불일치 오류
- 외부 포트(443) 대신 내부 포트(8080)로 리다이렉트
- Spring Security 환경에서 https↔http 불일치로 인한 **리다이렉트 루프**

## 2. 해결: forward-headers-strategy

프록시가 붙이는 `X-Forwarded-Proto` / `X-Forwarded-Host` / `X-Forwarded-Port` / `X-Forwarded-For`(또는 RFC 7239 `Forwarded`) 헤더를 신뢰해, 앱이 **원래 외부 요청 기준**으로 URL을 재구성하도록 한다.

```yaml
server:
  forward-headers-strategy: native   # 또는 framework
```

| 값 | 처리 주체 | 설명 |
|---|---|---|
| `native` | 서블릿 컨테이너 | Tomcat `RemoteIpValve`, Jetty `ForwardedRequestCustomizer` 등 컨테이너 내장 기능 사용. `X-Forwarded-For`/`X-Forwarded-Proto`면 보통 충분 |
| `framework` | Spring Framework | `ForwardedHeaderFilter`(서블릿) / `ForwardedHeaderTransformer`(리액티브) 등록. RFC 7239 `Forwarded` 포함 포괄 지원 |
| `none` | 없음 | `X-Forwarded-*` 무시 |

### 2.1. 기본값[^1]
- Cloud Foundry / Heroku / Kubernetes 환경: 기본 `native`
- 그 외 일반 환경: 기본 `none` → **직접 설정하지 않으면 헤더를 무시**하므로 위 문제가 발생

[^1]: 기본값 서술은 Spring Boot의 실행 환경(클라우드 플랫폼) 자동 감지 동작으로부터 추론.

## 3. nginx 짝 설정

앱 설정이 동작하려면 nginx가 실제로 헤더를 보내야 한다.

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header X-Forwarded-Port  $server_port;
}
```

## 4. Tomcat 세부 제어 (native)

헤더 이름이 비표준이거나 신뢰 프록시를 한정하려면:

```yaml
server:
  tomcat:
    remoteip:
      protocol-header: x-forwarded-proto
      remote-ip-header: x-forwarded-for
      internal-proxies: "192\\.168\\.\\d{1,3}\\.\\d{1,3}"   # 신뢰할 프록시 IP 정규식
```

- `internal-proxies`: 신뢰하는 프록시 IP 정규식. 일치하지 않는 출처의 `X-Forwarded-*`는 무시 → 헤더 스푸핑 방어.
- TLS를 프록시에서 종료하는 경우, redirect 전에 `X-Forwarded-Proto`가 반영되도록 `server.tomcat.redirect-context-root: false` 권장.

---

## Sources

- [Spring Boot Reference — How-to: Use Behind a Proxy Server](https://docs.spring.io/spring-boot/docs/2.7.15/reference/html/howto.html)
- [Spring Boot API — ServerProperties.ForwardHeadersStrategy](https://docs.spring.io/spring-boot/3.3/api/java/org/springframework/boot/autoconfigure/web/ServerProperties.ForwardHeadersStrategy.html)
- [Spring Security Reference — HTTP](https://docs.spring.io/spring-security/reference/features/exploits/http.html)

---

## Related pages

- [[reverse-proxy]] — 리버스 프록시 개념·X-Forwarded-* 전달(이 문제의 상위 맥락)
- [[externalized-configuration]]
