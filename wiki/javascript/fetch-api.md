---
title: 자바스크립트 Fetch API
updated: 2026-09-06 00:10:51
tags:
  - javascript
  - fetch
  - http
---

## 1. 개요

**Fetch API**는 HTTP 요청을 보내고 응답을 처리하는 자바스크립트 인터페이스다. 콜백 기반 `XMLHttpRequest`를 대체하며, [[promise|Promise]] 기반으로 동작해 콜백 중첩 없이 [[async-await]]와 자연스럽게 결합된다. `Request`/`Response`가 표준 객체로 캡슐화되어 있어 `clone()`으로 재사용하거나 Service Worker의 `fetch` 이벤트에서 그대로 가로채고 재구성할 수 있고, 본문을 `ReadableStream`으로 다뤄 대용량 응답도 메모리 효율적으로 처리할 수 있다. 전역 함수 `fetch(resource, options)`를 호출해 요청하며, `window`와 worker 컨텍스트 모두에서 사용 가능하다.

---

## 2. 기본 사용법

`fetch()`는 서버로부터 상태 코드와 헤더를 받는 즉시(본문 수신 전이라도) Promise를 `Response` 객체로 fulfilled한다. 본문은 `json()`/`text()` 같은 별도 비동기 메서드로 읽어야 한다 — 헤더 수신과 본문 읽기가 분리된 2단계 비동기 과정이다.

```javascript
async function getData() {
  const response = await fetch("https://example.org/products.json");
  const result = await response.json();
  console.log(result);
}
```

---

## 3. 응답 상태 확인

`fetch()`가 반환하는 Promise는 **네트워크 오류**(연결 실패, 잘못된 URL 등)에서만 reject된다. 서버가 `404`·`500` 같은 HTTP 에러 상태로 응답해도 reject되지 않고 `Response`로 fulfilled된다 — `response.ok`(200번대 여부) 또는 `response.status`를 직접 확인해야 한다.

```javascript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Response status: ${response.status}`);
}
```

---

## 4. 요청 옵션

`options` 객체(`RequestInit`)로 메서드·헤더·본문 등을 지정한다.

### 4.1. method

기본값은 `GET`. `POST`/`PUT`/`DELETE` 등은 `method`로 지정한다.

```javascript
await fetch("https://example.org/post", { method: "POST" });
```

### 4.2. headers

객체 리터럴 또는 `Headers` 인스턴스로 지정한다. `Headers`는 헤더 이름을 소문자로 정규화하고 값의 앞뒤 공백을 제거하는 등 추가 검증을 한다. 일부 헤더는 브라우저가 자동 설정하며 스크립트로 지정할 수 없다(forbidden request header).

```javascript
await fetch(url, {
  headers: { "Content-Type": "application/json" },
});

// Headers 인스턴스로 지정
const headers = new Headers();
headers.append("Content-Type", "application/json");
await fetch(url, { headers });
```

### 4.3. body

`GET`/`HEAD` 요청에는 body를 포함할 수 없다. 문자열, `FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams`, `ReadableStream` 등을 지정할 수 있다. 요청 본문도 스트림이라 한 번 전송한 `Request` 인스턴스는 재사용할 수 없다 — 재사용하려면 `clone()` 필요.

```javascript
await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "example" }),
});
```

### 4.4. credentials

쿠키·TLS 클라이언트 인증서·`Authorization` 헤더 등 자격 증명 포함 여부를 결정한다. 기본값 `same-origin`. `omit`/`include`로 변경 가능하다. cross-origin에서 `include` 사용 시 서버가 `Access-Control-Allow-Credentials`와 함께 `Access-Control-Allow-Origin`에 구체적 origin(와일드카드 `*` 불가)을 응답해야 한다([[cors]] 참고).

```javascript
await fetch(url, { credentials: "include" }); // cross-origin에도 쿠키 포함
```

### 4.5. mode

cross-origin 요청 처리 방식. `cors`(기본, CORS 메커니즘 적용) / `same-origin`(cross-origin 요청 자체 금지) / `no-cors`(메서드를 GET/HEAD/POST로 제한, 응답이 opaque — 헤더·본문에 스크립트로 접근 불가).

```javascript
await fetch(url, { mode: "same-origin" }); // cross-origin이면 네트워크 에러
```

---

## 5. 응답 본문 읽기

`Response`는 본문을 다양한 형식으로 읽을 수 있도록 `json()`, `text()`, `blob()`, `arrayBuffer()`, `formData()` 등 비동기 메서드를 제공한다. 모두 Promise를 반환하며, 파싱 실패 시(JSON이 아닌데 `json()` 호출 등) reject된다.

요청·응답 본문은 `ReadableStream`이며, 한 번 읽으면 잠기고(locked) 소진된(disturbed) 상태가 되어 다시 읽을 수 없다. 본문을 두 번 읽어야 하면 읽기 전에 `clone()`으로 복제한다.

```javascript
const response1 = await fetch(url);
const response2 = response1.clone();
const a = await response1.json();
const b = await response2.json();
```

큰 응답은 `response.body`(`ReadableStream`)를 직접 스트리밍 처리해 메모리 사용을 줄이고 수신 즉시 처리할 수 있다.

```javascript
const response = await fetch(url);
const stream = response.body.pipeThrough(new TextDecoderStream());
for await (const chunk of stream) {
  console.log(chunk);
}
```

---

## 6. 요청 취소

`AbortController`로 생성한 `signal`을 옵션에 넘기면 `abort()`로 요청을 취소할 수 있다. 취소되면 `fetch()` Promise가 `AbortError`로 reject된다(본문을 읽는 도중 취소되면 본문 읽기 쪽이 reject).

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000); // 3초 타임아웃

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (e) {
  if (e.name === "AbortError") console.error("타임아웃");
}
```

타임아웃 전용이면 `AbortSignal.timeout(ms)`로 축약할 수 있다.

```javascript
const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
```

---

## 7. 기타

### 7.1. redirect: "manual"이 아무것도 안 하는 것처럼 보이는 이유

`redirect: "manual"`은 리다이렉트를 "처리"해주는 옵션이 아니라, 브라우저가 리다이렉트를 **따라가지 않고 그 사실만 알리는** 옵션이다. 서버가 3xx로 응답하면 `type`이 `opaqueredirect`인 응답을 반환하는데, 이 응답은 스펙상 `status`가 `0`, `body`가 `null`, 헤더가 빈 값으로 고정된다 — `Location` 헤더도 읽을 수 없다. `response.url`도 리다이렉트 목적지가 아니라 **원래 요청 URL 그대로** 남는다(실제로 리다이렉트를 따라가지 않았으므로). 즉 스크립트에서는 "리다이렉트가 발생했다"는 사실 외에 목적지를 알아낼 방법이 없다 — 원래 Service Worker가 리다이렉트 응답을 그대로 캐시했다가 나중에 재생하기 위한 용도이지, 페이지 스크립트가 목적지를 검사하려는 용도가 아니다. 목적지 URL이 필요하면 서버 측(프록시)에서 처리해야 한다.

```javascript
const response = await fetch(url, { redirect: "manual" });
console.log(response.type);   // "opaqueredirect" (리다이렉트가 있었다는 사실만 확인 가능)
console.log(response.status); // 0
console.log(response.url);    // 원래 요청 URL 그대로 (목적지 아님)
```

### 7.2. JSON 전송 시 Content-Type 미지정

`body`에 `JSON.stringify()` 결과(문자열)를 그대로 넣으면, fetch가 자동으로 붙이는 `Content-Type`은 `application/json`이 아니라 **`text/plain;charset=UTF-8`**이다(Fetch 스펙의 body 추출 알고리즘 — 문자열은 항상 `text/plain`으로 처리). 서버가 이를 JSON으로 파싱하지 못하는 흔한 원인이다 — `headers`에 `Content-Type: application/json`을 직접 지정해야 한다([§4.2](#42-headers) 참고).

### 7.3. 캐시로 인한 오래된 응답

`GET` 요청은 기본 `cache` 옵션(`default`)에 따라 브라우저 HTTP 캐시를 거친다. 서버 응답이 갱신됐는데도 오래된 데이터가 반환되면 캐시가 원인일 수 있다 — `cache: "no-store"`로 캐시를 우회한다.

### 7.4. 업로드 진행률 추적 불가

fetch는 요청 본문 전송 진행률을 알려주는 이벤트를 제공하지 않는다(`XMLHttpRequest`의 `upload.onprogress`에 해당하는 기능 없음). 업로드 진행률 표시가 필요하면 `XMLHttpRequest`를 사용해야 한다.

---

## 8. 에러 처리

fetch가 다루는 에러는 발생 지점에 따라 성격이 다르다.

| 상황 | 결과 |
|---|---|
| 네트워크 오류(연결 실패, DNS 실패, CORS 위반 등) | `fetch()` Promise가 `TypeError`로 reject |
| HTTP 에러 상태(404, 500 등) | reject되지 않음 — `response.ok`/`response.status`로 직접 확인([§3](#3-응답-상태-확인)) |
| 요청 취소(`AbortController.abort()`) | `fetch()` 또는 본문 읽기 Promise가 `AbortError`로 reject([§6](#6-요청-취소)) |
| 본문 파싱 실패(JSON이 아닌데 `json()` 호출 등) | 해당 메서드의 Promise가 reject([§5](#5-응답-본문-읽기)) |

네트워크 오류와 CORS 위반은 모두 동일하게 `TypeError: Failed to fetch`로 나타나 JS 코드에서 원인을 구분할 수 없다 — 브라우저 개발자 도구의 콘솔·네트워크 탭에서만 확인 가능하다([[cors]] 참고).

에러 종류에 따라 처리를 분기하려면 `catch` 블록에서 `error.name`(`TypeError`/`AbortError`/`TimeoutError` 등)으로 구분한다.

```javascript
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return await response.json();
} catch (err) {
  if (err.name === "AbortError" || err.name === "TimeoutError") {
    console.error("취소 또는 타임아웃");
  } else if (err instanceof TypeError) {
    console.error("네트워크 오류 또는 CORS 위반");
  } else {
    console.error("HTTP 에러 또는 파싱 실패:", err.message);
  }
}
```

---

## Sources

- MDN — Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- MDN — Using Fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- MDN — fetch(): https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
- MDN — RequestInit: https://developer.mozilla.org/en-US/docs/Web/API/RequestInit
- MDN — Response.type: https://developer.mozilla.org/en-US/docs/Web/API/Response/type
- MDN — AbortSignal.timeout(): https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
- WHATWG Fetch Standard — body 추출 알고리즘(문자열의 기본 Content-Type): https://fetch.spec.whatwg.org/#concept-bodyinit-extract
- WHATWG Fetch Standard — opaque-redirect filtered response: https://fetch.spec.whatwg.org/#concept-filtered-response-opaque-redirect

---

## Related pages

- [[promise]] — Promise 상태·체이닝
- [[async-await]] — Fetch 결과를 다루는 비동기 문법
- [[cors]] — credentials/mode 옵션과 연결되는 CORS 동작
