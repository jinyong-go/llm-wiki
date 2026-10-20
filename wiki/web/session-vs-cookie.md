---
title: Session vs Cookie
updated: 2026-10-20 14:14:04
tags:
  - web
  - http
  - session
  - cookie
  - security
---

## 1. 배경

HTTP는 stateless이므로 로그인 상태 등 클라이언트 상태를 별도로 유지해야 한다. 쿠키는 상태를 운반하는 수단이고, 세션은 상태를 서버에 저장하는 방식이다. 둘은 대립 개념이 아니며, 실제 비교 대상은 상태의 저장 위치다. 쿠키 자체의 동작과 속성은 [[cookie]] 참고.

---

## 2. 서버 측 세션

상태 데이터를 서버에 저장하고 클라이언트에는 세션 ID만 전달한다. 로그인 시 서버가 세션을 생성하고 `Set-Cookie`로 ID(`JSESSIONID` 등)를 발급하면, 이후 요청의 세션 ID로 상태를 조회한다.

저장소는 메모리, 파일, Redis 등이다. 다중 인스턴스 환경에서는 sticky session 또는 세션 스토어 공유([[redis]])가 필요하다. 서버 타임아웃이나 로그아웃 시 서버가 즉시 무효화할 수 있다.

---

## 3. 클라이언트 측 상태

상태를 쿠키 값이나 토큰에 직접 담는다. 서버에 저장소가 필요 없어 수평 확장에 유리하다. 값은 클라이언트가 열람할 수 있으며, 서명하면 변조를 탐지할 수 있다. 서명된 토큰의 대표 형식이 [[jwt]]다. 자체 검증만으로는 만료 전 폐기 여부를 알 수 없어, 즉시 차단하려면 거부 목록 등 서버 측 상태가 필요하다.

---

## 4. 비교

| 항목 | 서버 측 세션 | 클라이언트 측 상태 |
|---|---|---|
| 저장 위치 | 서버. 클라이언트에는 세션 ID | 쿠키 값·토큰 |
| 열람·변조 | 클라이언트가 데이터에 접근 불가 | 열람 가능. 서명 시 변조 탐지 |
| 용량 | 서버 자원 한도 | 쿠키당 약 4KB |
| 요청 처리 | 요청마다 세션 스토어 조회 | 저장소 조회 없음. 서명 검증 |
| 수평 확장 | 세션 공유 또는 sticky session 필요 | 영향 없음 |
| 무효화 | 서버가 즉시 무효화 | 만료 전 폐기에 서버 측 상태 필요. 탈취된 사본은 쿠키 삭제 지시로 무효화 불가 |

---

## 5. 보안

세션 ID를 운반하는 쿠키에는 보안 속성(`HttpOnly`/`Secure`/`SameSite`/`__Host-` 접두사)이 필수다. 속성 상세와 쿠키 관련 공격(세션 하이재킹·CSRF·session fixation 등)은 [[cookie]] 참고.

---

## Sources
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN: Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [MDN: Clear-Site-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)

---

## Related pages
- [[cookie]]
- [[web-storage]]
- [[jwt]]
- [[redis]]
