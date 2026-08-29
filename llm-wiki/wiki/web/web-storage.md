---
title: Web Storage — localStorage / sessionStorage / IndexedDB
updated: 2026-07-06 17:59:41
tags:
  - web
  - browser
  - storage
  - security
---

## 1. 개요

브라우저가 클라이언트에 데이터를 저장하는 API들. [[cookie]]와 달리 **요청에 자동 첨부되지 않아** 순수 클라이언트 측 저장에 쓰인다 — 서버로 보내려면 JavaScript로 직접 실어야 한다.

- **Web Storage API** — `localStorage`, `sessionStorage` (key-value)
- **IndexedDB** — 브라우저 내장 트랜잭션 객체 데이터베이스

모두 **origin(scheme+host+port) 단위로 격리**된다(same-origin).

---

## 2. localStorage

- **수명**: 영속 — 브라우저를 닫아도, 재부팅해도 유지(명시적 삭제 전까지)
- **범위**: origin 단위. 같은 origin의 모든 탭·창이 공유
- **용량**: 약 5~10MB (브라우저별)
- **API**: **동기(synchronous)** — key/value 모두 문자열만 저장(객체는 `JSON.stringify` 필요)

```javascript
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');            // 'dark'
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'kim' }));
JSON.parse(localStorage.getItem('user')); // { id: 1, name: 'kim' }
localStorage.removeItem('theme');
localStorage.clear();
```

---

## 3. sessionStorage

- **수명**: 탭 세션 한정 — **탭/창을 닫으면 삭제**. 새로고침·같은 탭 내 이동에는 유지
- **범위**: **탭 단위 격리** — 같은 origin이라도 다른 탭끼리 공유되지 않음
- **용량·API**: localStorage와 동일(약 5MB, 동기, 문자열)

```javascript
sessionStorage.setItem('step', '2');
sessionStorage.getItem('step');   // '2'
// API는 localStorage와 완전히 동일, 수명·범위만 다름
```

---

## 4. IndexedDB

- **성격**: 브라우저 내장 **트랜잭션 기반 객체 저장 데이터베이스**(NoSQL 스타일). object store + 인덱스로 조회
- **수명**: 영속
- **용량**: 수백 MB~GB (디스크·사용자 설정에 따름)
- **저장 타입**: 문자열뿐 아니라 **객체·배열·Blob·File** 등 구조화 데이터 직접 저장(직렬화 불필요)
- **API**: **비동기(asynchronous)** — 메인 스레드를 막지 않음. 이벤트/Promise 기반이라 low-level이 복잡 → 실무에서는 `idb`, `Dexie.js` 등 래퍼를 흔히 사용

```javascript
const req = indexedDB.open('myDB', 1);
req.onupgradeneeded = (e) => {                 // 스키마 정의(버전 업 시)
  const db = e.target.result;
  db.createObjectStore('todos', { keyPath: 'id' });
};
req.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('todos', 'readwrite');
  tx.objectStore('todos').put({ id: 1, text: '우유 사기', done: false });
};
```

---

## 5. 비교

| 항목 | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|
| 수명 | 영속 | 탭 종료 시 삭제 | 영속 |
| 범위 | origin(탭 공유) | **탭 단위 격리** | origin(탭 공유) |
| 용량 | ~5–10MB | ~5MB | 수백 MB~GB |
| API | 동기 | 동기 | **비동기** |
| 저장 타입 | 문자열만 | 문자열만 | 객체·Blob 등 구조화 데이터 |
| 조회 | key 직접 | key 직접 | 인덱스·범위 쿼리 |
| 서버 자동 전송 | ❌ | ❌ | ❌ |

---

## 6. 용도와 선택

| 저장소 | 적합 용도 |
|---|---|
| **localStorage** | 지속 유지할 소량 설정 — 테마, 언어, 최근 검색어, 비민감 UI 상태 |
| **sessionStorage** | 탭 한정 임시 상태 — 다단계 폼 진행 상태, 탭별 스크롤/필터 |
| **IndexedDB** | 대용량·구조화 데이터, 오프라인 우선 앱(PWA), 캐시된 API 응답, 파일/이미지(Blob) |

---

## 7. 데이터 삭제·수명

브라우저의 "**캐시(cached images and files)**"와 "**쿠키 및 사이트 데이터**"는 별개 항목이다. Web Storage 3종은 후자(site data)에 속하며, HTTP 캐시와 저장 영역이 다르다.

| 사용자 동작 | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|
| 캐시(이미지·파일)만 삭제 | 유지 | 유지 | 유지 |
| 쿠키·사이트 데이터 삭제 | **삭제** | **삭제** | **삭제** |
| 탭 닫기 | 유지 | **삭제** | 유지 |
| 저장공간 부족 자동 축출(eviction) | 삭제 가능 | – | 삭제 가능 |

- **캐시만 삭제하면 셋 다 유지**된다. "쿠키 및 기타 사이트 데이터"를 지워야 함께 삭제된다(Chrome은 Web Storage를 쿠키와 분리해 지우는 옵션이 없어 묶여 삭제됨).
- **자동 축출(eviction)**: 디스크 부족 시 브라우저가 LRU(오래된 origin부터)로 site data를 비운다. `navigator.storage.persist()`로 "persistent" 권한을 얻으면 자동 축출에서 보호되지만, **사용자의 수동 삭제는 막지 못한다**.
- 서버는 `Clear-Site-Data` 응답 헤더로 특정 저장소를 지정 삭제할 수 있다(예: 로그아웃 시 `Clear-Site-Data: "storage"`).

---

## 8. 보안 고려사항

- **JavaScript로 접근 가능** → `HttpOnly` 같은 보호가 없다. **XSS가 발생하면 전부 탈취**된다
- **인증 토큰·세션 ID**: Web Storage 저장은 권장되지 않는다 — `HttpOnly` 쿠키가 JS 접근을 막아 더 안전하다 ([[cookie]], [[session-vs-cookie]])
- **비밀번호·개인정보 등 민감 정보**: 클라이언트에 아예 저장하지 않는다. 서버 측에 두고, 클라이언트에는 이를 가리키는 불투명한 식별자만 둔다 (쿠키도 대안이 아니다)
- origin 격리는 되지만, 같은 origin에 삽입된 서드파티 스크립트는 접근할 수 있다
- Web Storage는 사용자·확장프로그램이 언제든 삭제할 수 있으므로(7장), 유실되면 안 되는 데이터의 유일 저장소로 삼지 않는다

---

## Sources
- [MDN — Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN — IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN — Storage for the web](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [MDN — Clear-Site-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)

---

## Related pages
- [[cookie]]
- [[session-vs-cookie]]
- [[cors]]
