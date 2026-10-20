---
title: RESTful API 설계
updated: 2026-10-20 14:14:04
tags:
  - web
  - http
  - rest
  - api
  - backend
---

## 1. 개요

REST(Representational State Transfer)는 Roy Fielding이 정의한 분산 시스템 아키텍처 스타일이다. 자원(resource)을 URI로 식별하고, 자원의 표현(representation)을 HTTP 메서드로 주고받으며 상태를 전이한다.

REST 제약을 지키는 API를 RESTful하다고 한다. 실무의 많은 "REST API"는 [[#3. Uniform Interface|Self-descriptive·HATEOAS]]를 만족하지 못해 엄밀히는 HTTP API에 가깝다.

---

## 2. 제약 조건

| 제약 | 의미 |
|------|------|
| Client-Server | UI(클라이언트)와 데이터 저장(서버)의 관심사 분리 |
| Stateless | 각 요청이 필요한 정보를 모두 포함하며, 서버는 세션 상태를 보관하지 않음 |
| Cacheable | 응답에 캐시 가능 여부를 명시(HTTP 캐시 활용) |
| Uniform Interface | 일관된 인터페이스로 자원 조작. REST의 핵심 제약 |
| Layered System | 프록시·게이트웨이 등 계층 구성이 가능하며 클라이언트는 이를 알 필요 없음 |
| Code-on-Demand(선택) | 서버가 실행 코드(JS 등)를 전달해 클라이언트 기능 확장 |

---

## 3. Uniform Interface

Uniform Interface는 4가지 세부 제약으로 구성되며, 실무에서 지켜지지 않는 경우가 많다.

1. **자원의 식별(Identification of resources)**: 자원은 URI로 식별한다.
2. **표현을 통한 자원 조작**: 클라이언트는 자원의 표현(JSON 등)을 주고받으며 자원을 조작한다.
3. **자기 서술적 메시지(Self-descriptive messages)**: 메시지만 보고 처리 방법을 알 수 있어야 한다. 예를 들어 `Content-Type`으로 본문 해석 방법을 명시한다. 흔히 충족되지 않는다.
4. **HATEOAS(Hypermedia As The Engine Of Application State)**: 응답에 다음으로 전이 가능한 상태의 링크를 포함해, 클라이언트가 하이퍼미디어로 상태를 전이한다. 흔히 충족되지 않는다.

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

Fielding은 하이퍼텍스트로 애플리케이션 상태를 전이하지 않는 API는 RESTful하지 않다고 명시했다. 3·4를 만족하지 못하는 API는 HTTP API로 부르는 것이 정확하다.

---

## 4. HTTP 메서드

| 메서드 | 용도 | Safe | Idempotent | Req Body |
|--------|------|:----:|:----------:|:--------:|
| GET | 자원 조회 | ✅ | ✅ | ✕ |
| HEAD | 헤더만 조회(본문 없음) | ✅ | ✅ | ✕ |
| POST | 생성·비멱등 처리 | ✕ | ✕ | ✅ |
| PUT | 자원 전체 교체(없으면 생성) | ✕ | ✅ | ✅ |
| PATCH | 자원 부분 수정 | ✕ | ✕* | ✅ |
| DELETE | 자원 삭제 | ✕ | ✅ | ✕ |
| OPTIONS | 통신 옵션 조회(CORS 프리플라이트) | ✅ | ✅ | ✕ |

- **Safe**: 서버 상태를 변경하지 않음(조회 전용)
- **Idempotent**: 같은 요청을 여러 번 보내도 서버 상태가 한 번 보낸 것과 같음
- PATCH(*)는 일반적으로 비멱등이며 구현에 따라 멱등일 수 있음

### 4.1. POST vs PUT vs PATCH
- `POST /orders`: 새 자원 생성. 두 번 호출하면 두 개가 생성된다(비멱등).
- `PUT /orders/42`: 42를 요청 본문으로 전체 교체한다. 여러 번 호출해도 상태가 같다(멱등).
- `PATCH /orders/42`: 일부 필드만 수정한다.

멱등성은 재시도 안전성과 직결된다. 네트워크 오류로 재요청할 때 GET·PUT·DELETE는 안전하지만 POST는 중복 생성 위험이 있어, 멱등 키(`Idempotency-Key` 헤더, IETF 초안·만료) 같은 보완이 필요하다.

---

## 5. 요청 데이터

| 위치 | 용도 | 예 |
|------|------|-----|
| Path parameter | 자원 식별 | `/users/42`, `/users/42/orders/7` |
| Query parameter | 필터·정렬·페이징 등 조회 조건 | `/users?status=active&sort=name&page=2&size=20` |
| Request body | 생성·수정 데이터(주로 JSON) | `POST /users` + `{"name":"kim"}` |
| Header | 인증·협상·조건부 요청 | `Authorization`, `Accept`, `Content-Type`, `If-None-Match` |

자원 식별은 path, 조회 조건은 query, 상태 변경 데이터는 body로 전달한다. GET은 본문을 쓰지 않는다.

### 5.1. Content-Type
- `application/json`: API의 표준 형식. 프로그래밍 방식 요청(fetch 등)에서 주로 사용
- `application/x-www-form-urlencoded`: `key=value&k2=v2` 형식의 단순 텍스트 폼. 이진 데이터에 부적합
- `multipart/form-data`: 파일 업로드·대용량 전송. 각 파트를 boundary로 구분
- `text/plain`: 드물게 사용

뒤의 세 형식은 HTML 폼 `enctype` 값과 같으며, 이 외의 `Content-Type`을 쓰는 교차 출처 요청은 프리플라이트 대상이다([[cors-preflight]]).

---

## 6. 응답

### 6.1. 상태 코드
- **2xx**: 200 OK(조회·일반 성공), 201 Created(생성, `Location` 헤더로 위치 전달), 202 Accepted(비동기 접수), 204 No Content(본문 없는 성공, 예: DELETE)
- **3xx**: 301 Moved Permanently, 304 Not Modified(조건부 캐시)
- **4xx**: 400 Bad Request(문법 오류), 401 Unauthorized(인증 필요), 403 Forbidden(권한 없음), 404 Not Found, 405 Method Not Allowed, 409 Conflict(상태 충돌), 422 Unprocessable Content(검증 실패), 429 Too Many Requests(레이트 리밋)
- **5xx**: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable(`Retry-After`)

### 6.2. 응답 헤더·에러 형식
- `Location`(201), `ETag`·`Last-Modified`(캐시·낙관적 동시성), `Retry-After`(429·503)
- 에러 본문은 일관된 구조로 작성한다. RFC 9457 Problem Details 형식:
```json
{ "type": "https://.../errors/validation", "title": "Validation failed",
  "status": 422, "detail": "name must not be blank", "instance": "/users" }
```

---

## 7. URI 설계

다음 규칙은 RFC 표준이 아닌 관례다[^1].

- 컬렉션은 명사 복수형으로 쓴다: `/orders`, `/users`. 행위는 HTTP 메서드로 표현하므로 동사를 쓰지 않는다.
- 슬래시(`/`)는 계층 관계를 나타낸다: `/users/42/orders`
- URI 끝에 `/`를 붙이지 않는다.
- 가독성을 위해 하이픈(`-`)을 쓰고 언더바(`_`)는 쓰지 않는다.
- 경로는 소문자로 쓴다.
- 파일 확장자를 넣지 않는다. 형식은 `Accept` 헤더로 협상한다(content negotiation).
- 버전은 경로(`/v1/...`)나 헤더로 표시한다.

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

## Sources
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [MDN: POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST)
- [MDN: Content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Content_negotiation)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [NHN Cloud Meetup: REST API 제대로 알고 사용하기](https://meetup.nhncloud.com/posts/92)
- [Roy Fielding: REST APIs must be hypertext-driven](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven)
- [IETF: The Idempotency-Key HTTP Header Field (draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)

---

## Related pages
- [[oauth2]]
- [[cors]]
- [[cors-preflight]]
- [[curl]]

---

[^1]: 끝 `/`·`_` 금지, 소문자, 확장자 배제 등은 RFC에 정의되지 않은 설계 관례로, NHN Cloud Meetup 글의 규칙을 따른다.
