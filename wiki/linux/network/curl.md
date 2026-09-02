---
title: curl
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - network
  - http
  - devops
---

## 1. 개념

URL로 데이터를 전송하고 수신하는 CLI 도구. HTTP(S)를 포함해 FTP, SMTP 등 다양한 프로토콜을 지원한다. 백엔드 개발에서는 주로 REST API 호출 테스트, 헬스체크 스크립트, 서비스 간 연결 진단에 사용한다.

```bash
curl [options] URL
```

기본 동작: GET 요청, 응답 바디를 stdout으로 출력.

---

## 2. HTTP 메서드

```bash
# GET (기본값, -X 생략 가능)
curl https://api.example.com/users

# POST — JSON 바디 (--json: Content-Type/Accept 자동 설정, 7.82.0+)
curl --json '{"name":"alice"}' https://api.example.com/users

# POST — 폼 데이터 (application/x-www-form-urlencoded)
curl -d "name=alice&age=30" https://api.example.com/users

# POST — 파일에서 바디 읽기
curl --json @body.json https://api.example.com/users
curl -d @body.json -H "Content-Type: application/json" https://api.example.com/users

# PUT / PATCH / DELETE
curl -X PUT  --json '{"name":"bob"}' https://api.example.com/users/1
curl -X PATCH --json '{"name":"bob"}' https://api.example.com/users/1
curl -X DELETE https://api.example.com/users/1
```

> `--json`은 `--data-binary [data] -H "Content-Type: application/json" -H "Accept: application/json"` 의 단축 옵션이다.

---

## 3. 요청 헤더

```bash
# 헤더 추가/덮어쓰기
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/me
curl -H "X-Request-Id: abc123" -H "Accept: application/json" https://api.example.com

# 헤더 제거
curl -H "User-Agent:" https://api.example.com
```

---

## 4. 인증

| 방식 | 옵션 | 설명 |
|------|------|------|
| Basic Auth | `-u user:password` | Base64 인코딩. HTTPS에서만 사용 |
| Bearer Token | `-H "Authorization: Bearer $TOKEN"` | REST API 표준 방식 |
| OAuth2 Bearer | `--oauth2-bearer $TOKEN` | RFC 6750 준수 |

```bash
# Basic Auth
curl -u admin:secret https://api.example.com/admin

# Bearer Token
curl -H "Authorization: Bearer $ACCESS_TOKEN" https://api.example.com/me

# OAuth2
curl --oauth2-bearer "$ACCESS_TOKEN" https://api.example.com/me
```

> `-u user:password`는 프로세스 목록에 노출될 수 있다. 스크립트에서는 환경변수나 파일로 관리할 것.

---

## 5. 응답 처리

| 옵션 | 설명 |
|------|------|
| `-i` | 응답 헤더 + 바디 출력 |
| `-I` | 응답 헤더만 출력 (HEAD 요청) |
| `-s` | 진행률/에러 메시지 숨김 (스크립트에서 출력 파싱 시 필수) |
| `-v` | 요청/응답 헤더 및 연결 과정 상세 출력 (디버깅용) |
| `-o file` | 응답 바디를 파일로 저장 |
| `-w format` | 전송 완료 후 지정한 변수 출력 |

```bash
# 응답 헤더 확인 (Content-Type, Set-Cookie 등)
curl -i https://api.example.com/users

# 응답 헤더만 확인
curl -I https://api.example.com/health

# 스크립트에서 HTTP 상태코드만 추출
curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health

# 상태코드 + 응답 바디 저장
curl -s -w "\n%{http_code}" https://api.example.com/users

# 응답 바디를 파일로 저장
curl -s -o response.json https://api.example.com/users

# 연결 문제 디버깅
curl -v https://api.example.com/users
```

### 5.1. -w 주요 변수

| 변수 | 설명 |
|------|------|
| `%{http_code}` | HTTP 응답 코드 |
| `%{time_total}` | 전체 소요 시간(초) |
| `%{time_connect}` | TCP 연결 소요 시간(초) |
| `%{time_starttransfer}` | TTFB (첫 바이트 수신까지 시간) |
| `%{content_type}` | 응답 Content-Type |
| `%{size_download}` | 다운로드 바이트 수 |

```bash
# 응답 시간 측정 (API 성능 확인)
curl -s -o /dev/null -w "http=%{http_code} total=%{time_total}s ttfb=%{time_starttransfer}s\n" \
  https://api.example.com/users
```

---

## 6. 에러 처리

```bash
# 4xx/5xx 응답 시 종료 코드 22로 실패 처리 (응답 바디 출력 안 함)
curl -f https://api.example.com/users

# 4xx/5xx 응답 시 실패 처리 + 응답 바디도 출력
curl --fail-with-body https://api.example.com/users

# 스크립트에서 활용
if ! curl -sf https://api.example.com/health > /dev/null; then
    echo "API 서버 응답 없음"
fi
```

| 옵션 | 응답 바디 출력 | 종료 코드 |
|------|---------|---------|
| (없음) | O | 0 (항상) |
| `-f` | X | 22 (4xx/5xx) |
| `--fail-with-body` | O | 22 (4xx/5xx) |

---

## 7. SSL/TLS

```bash
# 인증서 검증 생략 (개발/테스트 환경 자체 서명 인증서)
curl -k https://localhost:8443/api

# 사내 CA 인증서 지정
curl --cacert /path/to/ca.crt https://internal.example.com

# 클라이언트 인증서 (mTLS)
curl --cert client.crt --key client.key https://api.example.com
```

> `-k`(`--insecure`)는 프로덕션에서 사용 금지. mTLS가 필요한 내부 서비스는 `--cert`/`--key` 사용.

---

## 8. 타임아웃 & 재시도

```bash
# 연결 타임아웃 3초, 전체 요청 타임아웃 10초
curl --connect-timeout 3 --max-time 10 https://api.example.com/users

# 최대 3회 재시도 (408/429/5xx 및 타임아웃 시)
curl --retry 3 https://api.example.com/users

# 연결 거부(ECONNREFUSED)도 재시도 대상에 포함
curl --retry 3 --retry-connrefused https://api.example.com/users
```

| 옵션 | 설명 |
|------|------|
| `--connect-timeout` | TCP+TLS 핸드셰이크 최대 시간(초) |
| `-m` / `--max-time` | 전체 요청 최대 시간(초) |
| `--retry <num>` | 실패 시 재시도 횟수. 지수 백오프 적용(1s → 2s → 4s ... 최대 10분) |
| `--retry-connrefused` | 연결 거부도 재시도 트리거에 포함 |

---

## 9. 리다이렉트

```bash
# 3xx 리다이렉트 자동 추적
curl -L https://short.url/abc

# 리다이렉트 최대 횟수 제한
curl -L --max-redirs 5 https://example.com
```

> 기본적으로 301/302/303 후 POST → GET으로 메서드가 바뀐다. `--post301` 등으로 유지 가능.

---

## 10. 쿠키

```bash
# 쿠키 직접 전송
curl -b "session=abc123" https://api.example.com

# 쿠키 파일에서 읽기 + 응답 쿠키 저장
curl -b cookies.txt -c cookies.txt https://api.example.com/login
```

---

## 11. 백엔드 진단 시나리오

```bash
# 1. REST API 헬스체크 (상태코드만)
curl -s -o /dev/null -w "%{http_code}\n" https://api.example.com/health

# 2. JSON API 응답 파싱 (jq 연계)
curl -s -H "Authorization: Bearer $TOKEN" https://api.example.com/users | jq '.[]'

# 3. POST 요청 + 응답 헤더 + 상태코드 확인
curl -s -i --json '{"email":"test@example.com"}' https://api.example.com/users \
  -w "\n>>> HTTP %{http_code}\n"

# 4. 응답 시간 측정 (성능 진단)
curl -s -o /dev/null \
  -w "dns=%{time_namelookup}s connect=%{time_connect}s ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
  https://api.example.com/users

# 5. 내부 서비스 연결 확인 (사설 CA 환경)
curl --cacert /etc/ssl/certs/internal-ca.crt \
     -H "Authorization: Bearer $TOKEN" \
     https://internal-service.svc.cluster.local/health

# 6. 스크립트에서 API 호출 후 에러 처리
response=$(curl -sf --json '{"key":"value"}' https://api.example.com/resource) || {
    echo "API 호출 실패"
    exit 1
}
echo "$response" | jq .
```

---

## Sources
- [curl manpage](https://curl.se/docs/manpage.html)

---

## Related pages
- [[network-diagnostics]]
- [[ssh]]
