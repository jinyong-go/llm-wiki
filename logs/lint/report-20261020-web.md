# wiki-lint report — 2026-10-20 (web)

- **범위**: `wiki/web/` 8개 문서 (cookie, cors, cors-preflight, load-balancer, restful-api-design, reverse-proxy, session-vs-cookie, web-storage)
- **결과**: broken links 0건 / 문서 내 앵커 1건 / 사실 오류·출처 불일치 8건 / 근거 부족 3건 / 구성·양식 개선 다수
- **조치**: 오류(C1–C8, 앵커) → 문서별 구성 개선 → 문체·양식 일괄 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크: `[[...]]` 대상 전부 존재. 깨짐 0건
- 외부 출처 URL 38개 확인. `baeldung.com/spring-cors`, Cloudflare learning 2건은 403(봇 차단으로 판단). 나머지 200
- MDN `Web/HTTP/Methods`, `Web/HTTP/Status`는 `Reference/...` 경로로 리다이렉트
- `restful-api-design.md:16`의 `(#3-uniform-interface--4가지-세부-제약)`는 GitHub식 앵커로 Obsidian에서 동작하지 않을 가능성

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `cookie.md` | §4 | `SameSite=Lax`를 "모던 브라우저 기본값"으로 서술. MDN Set-Cookie는 "일부 브라우저"의 기본값으로 명시. 기본 Lax의 2분 이내 POST 전송 예외 누락 |
| C2 | `cookie.md` | §2 | 제3자 쿠키 "브라우저들이 단계적 차단 중". Firefox(Total Cookie Protection)·Safari(ITP)는 기본 제한, Chrome은 기본 차단하지 않음 |
| C3 | `session-vs-cookie.md` | §4 | 쿠키 만료 제어 "서버가 강제 삭제 불가". `Max-Age=0`, `Clear-Site-Data: "cookies"`로 삭제 가능. `web-storage.md` §7과 충돌 |
| C4 | `web-storage.md` | §2·§3·§5 | 용량 "5~10MB"/"5MB". MDN Storage quotas 기준 origin당 localStorage 5MiB, sessionStorage 5MiB |
| C5 | `web-storage.md` | §4 | IndexedDB "이벤트/Promise 기반". 네이티브 API는 `IDBRequest` 이벤트 기반, Promise는 래퍼 제공 |
| C6 | `load-balancer.md` | §3 | L4 "패킷을 해석하지 않고 그대로 넘긴다". LVS(NAT·TUN·DR)는 패킷 전달, HAProxy(tcp)는 연결을 받아 서버 연결과 결합하는 TCP 프록시 |
| C7 | `load-balancer.md` | §3·§7.2 | "L7 LB는 리버스 프록시의 한 형태" / "리버스 프록시 기능의 일부"로 포함 관계 서술 불일치 |
| C8 | `restful-api-design.md` | §6.1 | `422 Unprocessable`. RFC 9110 명칭은 `422 Unprocessable Content` |

---

## 3. 근거 부족

| # | 파일 | 내용 |
|---|---|---|
| W1 | `restful-api-design.md` §1·§3 | Fielding의 지적으로 서술하나 Sources에 Fielding 문헌 없음 |
| W2 | `restful-api-design.md` §7 | 끝 `/`·`_` 금지 등 URI 규칙은 표준이 아닌 관례(NHN 글). 각주 필요 |
| W3 | `web-storage.md` §7 | "Chrome은 Web Storage를 쿠키와 분리해 지우는 옵션이 없다" 출처 없음 |

---

## 4. 구성·문장 개선

### 4.1. 공통

- `cookie`, `session-vs-cookie`, `web-storage`, `load-balancer`, `reverse-proxy`, `restful-api-design`: 대시 연결 문장, `→`·`↓`·`↑` 기호, 과도한 볼드, 서술형 소제목
- `load-balancer`, `reverse-proxy`, `restful-api-design`: 본문 반복인 `요약` 절
- Sources `이름: URL` 형식, Related pages의 `— 설명` 부가, `cookie.md`의 `---` 구분선 누락
- index Web 항목의 목차 나열식 서술

### 4.2. 문서별

| 문서 | 개선안 |
|---|---|
| `cookie` | §2 목록을 형식·전송 범위·수명·용량으로 분리, 이름 없는 쿠키는 각주로, `Partitioned`(CHIPS) 보완 |
| `session-vs-cookie` | 서버 측 상태 vs 클라이언트 측 상태(쿠키 값, JWT) 비교로 재구성, §2는 `cookie` 링크로 대체 |
| `web-storage` | 제목을 `브라우저 저장소`로, 탭 복제 시 sessionStorage 복사, `QuotaExceededError` 처리 예시 |
| `load-balancer` | §1·§5 중복 통합, §7.1 소제목 축소, 세션 고정 표의 계층 열 제거, 일관성 해시 "필수" 표현 완화 |
| `reverse-proxy` | `Forwarded`(RFC 7239) 추가, 앞단 프록시의 XFF 위조 주의, §5.3 빈 헤더 항목을 §5.1로 이동 |
| `restful-api-design` | `text/plain — 드묾`을 [[cors-preflight]] 연계로, `Idempotency-Key` 초안 명시, 명령형 문장 서술형으로 |
| `cors` | §4.1과 `cors-preflight` §2 중복(유지 결정) |
| `cors-preflight` | 문제 없음. 1024바이트 규칙 Fetch 표준 원문 재확인 |
