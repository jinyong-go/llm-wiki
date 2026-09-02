---
title: Session vs Cookie
updated: 2026-07-06 17:23:20
tags:
  - web
  - http
  - session
  - cookie
  - security
---

## 1. 배경

HTTP는 **stateless** — 요청 간 상태가 유지되지 않는다. 로그인 상태 등 클라이언트를 기억하는 수단이 Cookie와 Session이며, 둘은 대립 개념이 아니라 함께 사용된다: 세션은 대개 쿠키(세션 ID)를 운반 수단으로 쓴다.

---

## 2. Cookie

상세는 [[cookie]] 참고. 서버가 `Set-Cookie` 응답 헤더로 발급하고, 브라우저가 저장했다가 **같은 서버로의 이후 요청에 자동 첨부**(`Cookie` 헤더)하는 작은 데이터 조각.

- **저장 위치**: 클라이언트(브라우저)
- **용량**: 쿠키당 약 4KB, 도메인당 개수 제한
- **수명**: `Expires`/`Max-Age` 지정 시 영속(persistent) — 미지정 시 **세션 쿠키**(브라우저 종료 시 삭제)
- **특징**: 값이 클라이언트에 있으므로 사용자가 열람·변조 가능 → **민감 정보 직접 저장 금지**
- 용도: 세션 ID 운반, 개인화 설정, (제3자 쿠키의 경우) 트래킹

---

## 3. Session

상태 데이터를 **서버 측에 저장**하고, 클라이언트에는 그 데이터를 찾을 열쇠인 **세션 ID만** 전달하는 방식.

- **동작**: 로그인 → 서버가 세션 생성·ID 발급(`JSESSIONID` 등을 Set-Cookie) → 이후 요청의 세션 ID로 서버가 상태 조회
- **저장소**: 메모리, 파일, Redis 등 외부 스토어 — 다중 인스턴스 환경에서는 sticky session 또는 세션 스토어 공유가 필요하다 ([[redis]])
- **수명**: 서버 타임아웃(비활성 30분 등)·로그아웃 시 서버에서 즉시 무효화 가능
- **특징**: 실제 데이터가 서버에 있어 클라이언트가 변조할 수 없다. 대신 서버 메모리/스토리지 부담과 수평 확장 시 공유 문제가 생긴다 — 이를 피하는 stateless 대안이 [[jwt]]

---

## 4. 비교

| 항목 | Cookie | Session |
|---|---|---|
| 데이터 저장 위치 | **클라이언트**(브라우저) | **서버** (클라이언트엔 ID만) |
| 보안 | 사용자가 열람·변조 가능 | 데이터 접근 불가, ID 탈취만 위험 |
| 용량 | ~4KB/쿠키 | 서버 자원 한도 내 제한 없음 |
| 서버 부하 | 없음 | 세션 수만큼 메모리/스토어 부담 |
| 수평 확장 | 영향 없음 | 세션 공유 필요(Redis 등) |
| 만료 제어 | 브라우저에 위임 (서버가 강제 삭제 불가) | 서버가 즉시 무효화 가능 |
| 속도 | 조회 없음 (요청에 포함) | 요청마다 세션 스토어 조회 |

---

## 5. 보안

세션 ID를 운반하는 쿠키에는 보안 속성(`HttpOnly`/`Secure`/`SameSite`/`__Host-` 접두사)이 필수다. 속성 상세와 쿠키 관련 공격(세션 하이재킹·CSRF·session fixation 등)은 [[cookie]] 참고.

---

## Sources
- [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN — Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)

---

## Related pages
- [[cookie]]
- [[web-storage]]
- [[jwt]]
- [[redis]]
