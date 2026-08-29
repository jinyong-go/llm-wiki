---
title: RESTful API 설계 — REST 제약·HTTP 메서드·요청/응답·리소스 설계
updated: 2026-07-08 10:32:15
tags:
  - web
  - http
  - rest
  - api
  - backend
---

## 1. REST 개요

**REST**(Representational State Transfer)는 Roy Fielding이 정의한 분산 시스템 아키텍처 스타일이다. 자원(resource)을 **URI로 식별**하고, 그 자원의 **표현(representation)**을 HTTP 메서드로 주고받으며 상태를 전이한다.

REST를 지키는 API를 **RESTful**하다고 한다. 다만 실무의 많은 "REST API"는 뒤의 [Self-descriptive·HATEOAS](#3-uniform-interface--4가지-세부-제약)를 만족하지 못해 엄밀히는 **HTTP API**에 가깝다(Fielding의 지적).

---

## 2. REST 6가지 제약 조건

| 제약 | 의미 |
|------|------|
| **Client-Server** | UI(클라이언트)와 데이터 저장(서버) 관심사 분리 |
| **Stateless** | 각 요청은 필요한 정보를 모두 포함, 서버가 세션 상태를 보관하지 않음 |
| **Cacheable** | 응답은 캐시 가능 여부를 명시(HTTP 캐시 활용) |
| **Uniform Interface** | 일관된 인터페이스로 자원 조작(REST의 핵심) |
| **Layered System** | 프록시·게이트웨이 등 계층 구성 가능, 클라이언트는 알 필요 없음 |
| **Code-on-Demand** *(선택)* | 서버가 실행 코드(JS 등)를 전달해 클라이언트 기능 확장 |

---

## 3. Uniform Interface — 4가지 세부 제약

REST를 REST답게 만드는 핵심 제약이며, 실무에서 지켜지지 않는 경우가 많다.

1. **자원의 식별(Identification of resources)** — 자원은 URI로 식별한다.
2. **표현을 통한 자원 조작** — 클라이언트는 자원의 표현(JSON 등)을 주고받으며 자원을 조작한다.
3. **자기 서술적 메시지(Self-descriptive messages)** — 메시지만 보고 처리 방법을 알 수 있어야 한다(예: `Content-Type`으로 본문 해석법 명시). 흔히 미충족.
4. **HATEOAS**(Hypermedia As The Engine Of Application State) — 응답에 **다음에 전이 가능한 상태로의 링크**를 포함해, 클라이언트가 하이퍼미디어로 상태를 전이한다. 흔히 미충족.

```json
// HATEOAS 예: 응답이 다음 행동 링크를 포함
{
  "id": 42, "status": "PENDING",
  "_links": {
    "self":   { "href": "/orders/42" },
    "cancel": { "href": "/orders/42/cancel", "method": "POST" }
  }
}
```

> **결론(Fielding/NHN)**: 3·4를 만족하기 어렵다면 "REST API"라 부르기보다 **HTTP API**로 정확히 칭하거나, Self-descriptive·HATEOAS를 갖추도록 설계하라.

---

## 4. HTTP 메서드와 용도

| 메서드 | 용도 | Safe | Idempotent | Req Body |
|--------|------|:----:|:----------:|:--------:|
| **GET** | 자원 조회 | ✅ | ✅ | ✕ |
| **HEAD** | 헤더만 조회(본문 없음) | ✅ | ✅ | ✕ |
| **POST** | 생성·비멱등 처리 | ✕ | ✕ | ✅ |
| **PUT** | 자원 **전체 교체**(없으면 생성) | ✕ | ✅ | ✅ |
| **PATCH** | 자원 **부분 수정** | ✕ | ✕* | ✅ |
| **DELETE** | 자원 삭제 | ✕ | ✅ | ✕ |
| **OPTIONS** | 통신 옵션(CORS preflight) | ✅ | ✅ | ✕ |

- **Safe**: 서버 상태를 변경하지 않음(조회 전용).
- **Idempotent**: 같은 요청을 여러 번 보내도 결과(서버 상태)가 한 번 보낸 것과 같음.
- *PATCH는 일반적으로 비멱등(구현에 따라 멱등 가능).

### 4.1. POST vs PUT vs PATCH
- **POST** `/orders` → 새 자원 생성. 두 번 호출하면 두 개 생성(비멱등).
- **PUT** `/orders/42` → 42를 요청 본문으로 **통째 교체**. 여러 번 호출해도 상태 동일(멱등).
- **PATCH** `/orders/42` → 일부 필드만 수정.

멱등성은 **재시도 안전성**과 직결된다. 네트워크 오류로 재요청할 때 GET/PUT/DELETE는 안전하지만 POST는 중복 생성 위험이 있어 **멱등 키(Idempotency-Key)** 같은 보완이 필요하다.

---

## 5. 요청 데이터 전달 방법

| 위치 | 용도 | 예 |
|------|------|-----|
| **Path parameter** | 자원 **식별** | `/users/42`, `/users/42/orders/7` |
| **Query parameter** | **필터·정렬·페이징** 등 조회 조건 | `/users?status=active&sort=name&page=2&size=20` |
| **Request body** | 생성/수정 **데이터**(주로 JSON) | `POST /users` + `{"name":"kim"}` |
| **Header** | 인증·협상·조건부 | `Authorization`, `Accept`, `Content-Type`, `If-None-Match` |

### 5.1. 본문 인코딩(Content-Type)
- **`application/json`** — API의 표준. 프로그래밍적 요청(fetch 등)에서 주로 사용.
- **`application/x-www-form-urlencoded`** — `key=value&k2=v2` 형식. 단순 텍스트 폼. 이진 데이터 부적합.
- **`multipart/form-data`** — **파일 업로드**·대용량. 각 파트를 boundary로 구분.
- **`text/plain`** — 드묾.

> 원칙: **자원 식별은 path, 조회 조건은 query, 상태 변경 데이터는 body.** GET은 본문을 쓰지 않는다.

---

## 6. 응답 설계

### 6.1. 상태 코드
- **2xx** 200 OK(조회/일반 성공) · 201 Created(생성, `Location` 헤더로 위치) · 202 Accepted(비동기 접수) · 204 No Content(본문 없는 성공, 예: DELETE)
- **3xx** 301 Moved Permanently · 304 Not Modified(조건부 캐시)
- **4xx** 400 Bad Request(문법 오류) · 401 Unauthorized(인증 필요) · 403 Forbidden(권한 없음) · 404 Not Found · 405 Method Not Allowed · 409 Conflict(상태 충돌) · 422 Unprocessable(검증 실패) · 429 Too Many Requests(레이트 리밋)
- **5xx** 500 Internal Server Error · 502 Bad Gateway · 503 Service Unavailable(`Retry-After`)

### 6.2. 응답 헤더·에러 포맷
- `Location`(201), `ETag`/`Last-Modified`(캐시·낙관적 동시성), `Retry-After`(429/503).
- 에러 본문은 일관된 구조로. RFC 9457 **Problem Details** 관례:
```json
{ "type": "https://.../errors/validation", "title": "Validation failed",
  "status": 422, "detail": "name must not be blank", "instance": "/users" }
```

---

## 7. 리소스 명명 · URI 설계 규칙

- **명사·복수형 컬렉션**: `/orders`, `/users` (동사 금지 — 행위는 HTTP 메서드가 표현).
- **계층/중첩**: `/users/42/orders` (슬래시 `/`는 계층 관계).
- **URI 끝에 `/`를 붙이지 않는다.**
- **하이픈(`-`)으로 가독성**, **언더바(`_`)는 쓰지 않는다.**
- **소문자** 경로 사용.
- **파일 확장자를 URI에 넣지 않는다** — 형식은 `Accept` 헤더로 협상(content negotiation).
- **버전**은 경로(`/v1/...`) 또는 헤더로.

```
GET    /v1/users?status=active&page=2   # 조회+필터+페이징
POST   /v1/users                        # 생성 → 201 + Location
GET    /v1/users/42                      # 단건 조회
PUT    /v1/users/42                      # 전체 교체
PATCH  /v1/users/42                      # 부분 수정
DELETE /v1/users/42                      # 삭제 → 204
GET    /v1/users/42/orders               # 하위 컬렉션
```

---

## 8. 요약

- REST = 6제약(Client-Server·Stateless·Cacheable·**Uniform Interface**·Layered·Code-on-Demand).
- Uniform Interface의 Self-descriptive·HATEOAS까지 지켜야 진짜 REST; 못 지키면 HTTP API로 부르는 게 정확.
- 메서드: 조회 GET, 생성 POST, 전체교체 PUT, 부분수정 PATCH, 삭제 DELETE. **Safe/Idempotent**로 재시도 안전성 판단.
- 데이터 전달: 식별=path, 조건=query, 데이터=body(JSON/form/multipart), 부가정보=header.
- 응답: 의미에 맞는 상태 코드 + `Location`/`ETag` + 일관된 에러 포맷.
- URI: 명사·복수·소문자·하이픈·중첩, 동사·확장자·끝 슬래시 배제.

---

## Sources
- MDN — HTTP request methods: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- MDN — POST(폼 인코딩): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST
- MDN — Content negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation
- RFC 9110 — HTTP Semantics(메서드·Safe/Idempotent): https://www.rfc-editor.org/rfc/rfc9110
- NHN Cloud Meetup — REST API 제대로 알고 사용하기: https://meetup.nhncloud.com/posts/92

---

## Related pages
- [[oauth2]] — API 인가 프레임워크(Bearer 토큰 발급·위임)
- [[cors]] — 브라우저 교차 출처 API 호출 허용(SOP 완화)
- [[curl]] — HTTP API 호출·응답 진단 도구
