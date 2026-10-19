---
title: XSS
updated: 2026-10-19 18:01:14
tags:
  - web
  - security
  - xss
  - backend
---

## 1. 개요

XSS(Cross-Site Scripting, 교차 사이트 스크립팅)는 신뢰하지 않는 데이터가 웹페이지의 실행 가능한 코드로 해석되는 취약점이다. 공격자가 삽입한 스크립트는 피해자가 방문한 페이지의 origin에서 실행되며, 페이지 내용과 해당 origin에서 접근 가능한 데이터·기능을 악용할 수 있다.

[[csrf]]는 피해자의 브라우저가 인증 정보를 첨부하는 점을 악용한다. XSS는 페이지 안에서 코드를 실행하므로 응답 데이터 열람, 화면 변조, 사용자 권한의 요청 전송까지 가능하다. 쿠키·토큰이 노출되면 [[session-hijacking]]으로 이어질 수 있다.

---

## 2. 유형

### 2.1. 반사형

반사형 XSS는 요청으로 전달한 값이 안전하게 처리되지 않은 채 응답에 포함되는 경우다. 검색 결과나 오류 메시지처럼 입력을 즉시 출력하는 기능에서 발생할 수 있다.

예를 들어 검색어 `q`를 HTML 본문에 그대로 연결하는 서버가 있다고 가정한다.

```java
String html = "<p>검색어: " + request.getParameter("q") + "</p>";
```

공격자가 `q`에 `<img src=x onerror="alert('XSS')">`를 넣은 URL을 전달하고 피해자가 열면, 서버는 이를 이미지 요소로 포함한 HTML을 반환한다. 브라우저가 해당 이벤트 핸들러 실행을 허용하는 환경에서는 이미지 로드 실패 시 스크립트가 실행된다. 입력값은 검색어 대신 HTML 구문으로 해석된다.

이 경우 서버 템플릿의 HTML 본문 인코딩을 적용해야 한다. URL 인코딩은 요청 값을 전달하기 위한 처리이므로 출력 인코딩을 대체하지 않는다.

### 2.2. 저장형

저장형 XSS는 공격자가 제출한 데이터가 저장된 뒤, 다른 사용자가 조회하는 과정에서 실행되는 경우다. 게시글·댓글·프로필뿐 아니라 문의 내용과 접속 기록을 보여주는 관리자 화면도 대상이 된다.

예를 들어 공격자가 댓글에 다음 값을 등록한다.

```html
<img src=x onerror="alert('XSS')">
```

서버가 댓글을 DB에 저장하고, 조회 화면이 이를 인코딩 없이 HTML에 삽입하면 댓글을 읽는 사용자의 브라우저에서 코드가 실행될 수 있다. 공격자는 피해자마다 별도의 요청을 보낼 필요 없이 저장된 콘텐츠를 통해 영향을 줄 수 있다. DB 조회 결과도 원래 출처가 사용자 입력이면 신뢰할 수 없다.

### 2.3. DOM 기반

DOM 기반 XSS는 클라이언트 코드가 신뢰하지 않는 데이터를 실행 가능한 DOM 구문으로 삽입하는 경우다.

다음 코드는 URL fragment를 디코딩한 뒤 `innerHTML`에 전달한다.

```html
<div id="message"></div>
<script>
  const value = decodeURIComponent(location.hash.slice(1));
  document.getElementById("message").innerHTML = value;
</script>
```

fragment가 `#%3Cimg%20src%3Dx%20onerror%3D%22alert('XSS')%22%3E`라면 디코딩 결과는 앞선 이미지 요소가 된다. 브라우저가 이를 HTML로 해석하면서 이벤트 핸들러가 실행될 수 있다. URL fragment는 HTTP 요청에 포함되지 않으므로, 이 예제에서는 공격 문자열이 서버에 전달되지 않아도 취약점이 성립한다.

일반 텍스트를 표시하려는 기능이라면 `innerHTML` 대신 `textContent`를 사용한다. 반사형·저장형은 데이터의 전달·저장 방식에 따른 구분이고, DOM 기반은 클라이언트 처리 방식에 따른 구분이다. 저장된 댓글을 클라이언트가 위험한 DOM API로 삽입하는 경우처럼 분류가 겹칠 수 있다.

---

## 3. 데이터 흐름

입력 지점(source)은 요청 파라미터, DB 조회 결과, URL, 브라우저 저장소 등이다. DB나 내부 API를 거쳤다는 이유만으로 데이터를 신뢰해서는 안 된다.

출력 지점(sink)은 데이터가 HTML·코드로 해석될 수 있는 위치다. `innerHTML`, `document.write()`, `eval()` 등이 해당한다. 입력부터 출력까지의 변환을 추적하고, 최종적으로 어느 문맥에서 해석되는지 확인해야 한다. 일반 요소에 텍스트를 표시할 때는 `textContent`나 `value`를 사용한다.

---

## 4. 방어

### 4.1. 출력 인코딩

출력 인코딩은 데이터를 코드가 아닌 문자로 해석하도록 변환한다. 출력 문맥마다 필요한 처리가 다르므로 HTML 인코딩 하나를 모든 위치에 적용해서는 안 된다.

| 출력 위치 | 처리 |
|---|---|
| HTML 본문 | 템플릿의 기본 HTML 이스케이프 사용 |
| HTML 속성 | 고정된 안전한 속성명과 따옴표 사용, 속성 문맥에 맞게 인코딩 |
| URL | 허용 scheme 검증, 파라미터 인코딩, HTML 속성에 삽입하면 속성 인코딩도 적용 |
| JavaScript·이벤트 핸들러 | 신뢰하지 않는 값을 코드 문자열에 직접 삽입하지 않음 |

입력 검증은 형식·길이·허용값을 제한하는 데 사용한다. 출력 인코딩을 대체하지 않는다. `<script>` 문자열 차단이나 정규식 기반 태그 제거만으로는 다양한 실행 경로를 막을 수 없다.

### 4.2. HTML 정제

사용자가 작성한 HTML을 실제로 렌더링해야 한다면 HTML 정제(sanitization)를 적용한다. 허용할 요소·속성·URL 정책을 정하고, DOMPurify 같은 검증된 라이브러리로 위험한 구문을 제거한다.

정제 후 다른 코드가 결과를 수정하면 안전성이 깨질 수 있다. 정제 라이브러리도 보안 업데이트를 유지해야 한다. 일반 텍스트만 필요하다면 HTML로 해석하지 않는 방식이 우선이다.

### 4.3. 서버 렌더링

서버 템플릿의 기본 이스케이프를 유지한다. Thymeleaf에서 `th:text`는 텍스트를 이스케이프하고, `th:utext`는 이스케이프하지 않은 HTML을 출력한다.

```html
<p th:text="${comment}"></p>
```

사용자 입력을 `th:utext`로 출력하려면 HTML 허용 정책과 정제가 필요하다. HTML 본문에서 안전한 출력 방식이 JavaScript·URL 문맥까지 자동으로 보호하는 것은 아니다.

### 4.4. 클라이언트 렌더링

DOM에 텍스트를 넣을 때는 `textContent`를 사용한다. React 등 프레임워크의 기본 바인딩은 텍스트로 처리되며, `dangerouslySetInnerHTML` 같은 HTML 삽입 API는 정제된 값에만 사용한다.

다음 HTML을 브라우저에서 열면 URL의 `q` 값을 텍스트로 표시한다. `?q=%3Cb%3Etest%3C%2Fb%3E`로 접근하면 굵은 글자 대신 `<b>test</b>`가 그대로 출력된다.

```html
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<title>텍스트 출력</title>
<p id="result"></p>
<script>
  const value = new URLSearchParams(location.search).get("q") ?? "";
  document.getElementById("result").textContent = value;
</script>
</html>
```

이 예제의 출력 대상은 일반 `p` 요소다. `textContent`를 `script` 요소에 사용하거나 값을 이후 코드 문자열로 재사용하는 경우까지 안전하다는 뜻은 아니다.

---

## 5. 보조 방어

### 5.1. CSP

CSP(Content Security Policy)는 실행 가능한 스크립트를 제한하는 추가 방어다. 출력 인코딩과 HTML 정제를 대체하지 않는다.

다음은 nonce 기반 정책의 예다.

```http
Content-Security-Policy: script-src 'nonce-{NONCE}'; object-src 'none'; base-uri 'none'
```

서버는 응답마다 예측 불가능한 nonce를 생성하고, 헤더와 허용할 스크립트 요소에 같은 값을 넣는다.

```html
<script nonce="{NONCE}" src="/app.js"></script>
```

`{NONCE}`는 서버가 치환할 자리다. 공격자가 삽입한 태그까지 일괄적으로 nonce를 부여해서는 안 된다.

Spring Security에서는 응답 헤더로 정책을 설정한다. nonce는 요청마다 생성해야 하므로 고정 정책에는 `'self'` 등 출처 기반 지시어를 사용하고, nonce 방식은 필터나 템플릿에서 값을 생성해 헤더와 스크립트 태그에 함께 넣는다.

```java
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("script-src 'self'; object-src 'none'; base-uri 'none'")));
```

### 5.2. 쿠키와 토큰

[[cookie]]의 `HttpOnly`는 JavaScript의 쿠키 직접 열람을 제한하지만 XSS 실행을 막지 않는다. 악성 스크립트는 피해자 브라우저에서 인증된 요청을 보내거나 응답을 읽을 수 있다.

[[jwt]]를 서버에 보관하는 방식도 브라우저에서 토큰이 직접 노출되는 범위를 줄이지만, XSS에 의한 사용자 권한의 요청 실행까지 막지는 않는다.

### 5.3. Trusted Types

Trusted Types는 `innerHTML` 같은 DOM sink에 문자열 대신 정책을 거친 객체만 허용하도록 브라우저가 강제하는 기능이다. DOM 기반 XSS의 sink를 코드에서 찾아 정책 한 곳으로 모은다.

```http
Content-Security-Policy: require-trusted-types-for 'script'
```

지원 브라우저 범위를 확인하고, 미지원 환경에서는 4장의 방어가 그대로 필요하다.

---

## 6. 실제 사례

### 6.1. MySpace

2005년 MySpace에서 Samy 웜이 프로필의 HTML 필터를 우회해 실행됐다. 감염된 프로필을 방문하면 스크립트가 사용자 권한으로 요청을 보내 특정 계정을 친구로 추가하고, 방문자의 프로필에도 코드를 복사해 확산했다.

공격 코드 작성자의 설명에 따르면, 당시 서비스가 상태 변경 요청에 요구하던 검증값도 선행 페이지를 조회해 추출했다. XSS가 페이지와 응답을 읽을 수 있으면 요청 검증값을 얻어 사용자 권한의 작업을 수행할 수 있음을 보여준다. 해당 기법은 당시 브라우저 동작에 의존한 역사적 사례다.

### 6.2. Twitter

2010년 9월 21일 Twitter.com에서 트윗에 포함된 코드가 다른 사용자의 브라우저에서 실행되는 사고가 발생했다. 링크 위에 마우스를 올리면 팝업이 표시되거나 사용자 모르게 해당 트윗을 리트윗하도록 변형됐다.

Twitter는 이전에 수정했던 취약점이 사이트 업데이트로 다시 발생했다고 밝혔다. 공식 발표에서 확인한 영향은 화면 변조와 의도하지 않은 리트윗 등이었으며, 계정 정보가 유출되지는 않았다고 설명했다.

### 6.3. TweetDeck

2014년 6월 TweetDeck에서 트윗 내용이 코드로 해석되는 XSS가 악용됐다. Sucuri의 분석에 따르면 타임라인에 표시된 트윗의 코드가 실행되어 팝업을 띄우고 자동 리트윗을 유발했다. 리트윗된 콘텐츠가 다른 사용자에게 표시되면서 공격이 연쇄적으로 전파됐다.

확인된 피해는 코드 실행과 사용자 의사에 반하는 게시 작업이며, 비밀번호 유출은 보고되지 않았다.

---
## Sources

- [OWASP XSS](https://community.owasp.org/attacks/xss/)
- [OWASP Types of XSS](https://community.owasp.org/Types_of_Cross-Site_Scripting)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP DOM XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [Thymeleaf Unescaped Text](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#unescaped-text)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Samy 웜 기술 설명](https://sa.my/myspace/tech.html)
- [Twitter 공식 사고 설명](https://blog.x.com/en_us/a/2010/all-about-the-onmouseover-incident)
- [Sucuri TweetDeck 사고 분석](https://blog.sucuri.net/2014/06/serious-cross-site-scripting-vulnerability-in-tweetdeck-twitter.html)
- [MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [Spring Security: Security HTTP Response Headers](https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html)

---
## Related pages

- [[csrf]]
- [[session-hijacking]]
- [[cookie]]
- [[jwt]]
- [[cors]]
