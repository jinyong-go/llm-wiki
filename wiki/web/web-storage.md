---
title: 브라우저 저장소
updated: 2026-10-20 17:54:47
tags:
  - web
  - browser
  - storage
  - security
---

## 1. 개요

브라우저가 클라이언트에 데이터를 저장하는 API다. [[cookie]]와 달리 요청에 자동 첨부되지 않으며, 서버로 보내려면 JavaScript로 직접 실어야 한다.

- Web Storage API: `localStorage`, `sessionStorage` (key-value)
- IndexedDB: 브라우저 내장 트랜잭션 기반 객체 데이터베이스

모두 origin(scheme+host+port) 단위로 격리된다.

---

## 2. localStorage

- **수명**: 영속. 브라우저를 닫거나 재부팅해도 명시적으로 삭제하기 전까지 유지
- **범위**: origin 단위. 같은 origin의 모든 탭·창이 공유
- **용량**: origin당 5MiB. 초과 시 `QuotaExceededError`
- **API**: 동기(synchronous). key와 value 모두 문자열만 저장하며 객체는 `JSON.stringify` 필요

```javascript
localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');            // 'dark'
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'kim' }));
JSON.parse(localStorage.getItem('user')); // { id: 1, name: 'kim' }
localStorage.removeItem('theme');
localStorage.clear();
```

용량을 초과하면 `setItem`이 `QuotaExceededError`를 던진다.

```javascript
try {
  localStorage.setItem('cache', payload);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // 오래된 항목 삭제 후 재시도
  }
}
```

---

## 3. sessionStorage

- **수명**: 탭이나 창을 닫으면 삭제. 새로고침·같은 탭 내 이동에는 유지
- **범위**: 탭(최상위 브라우징 컨텍스트) 단위. 새 탭이나 창은 새 세션으로 시작한다. `opener`가 있는 페이지는 opener의 sessionStorage 복사본으로 시작하며, 이후 변경은 서로 영향을 주지 않는다
- **용량·API**: localStorage와 동일(origin당 5MiB, 동기, 문자열)

```javascript
sessionStorage.setItem('step', '2');
sessionStorage.getItem('step');   // '2'
// API는 localStorage와 동일하며 수명·범위만 다름
```

---

## 4. IndexedDB

- **성격**: 브라우저 내장 트랜잭션 기반 객체 저장 데이터베이스(NoSQL 계열). object store와 인덱스로 조회
- **수명**: 영속
- **용량**: 수백 MB~GB. 디스크 여유 공간과 사용자 설정에 따름
- **저장 타입**: 객체·배열·Blob·File 등 구조화 데이터를 직렬화 없이 저장
- **API**: 비동기(asynchronous)로 메인 스레드를 막지 않는다. `IDBRequest` 이벤트 기반이라 직접 사용하기 복잡해 Promise 기반 래퍼(`idb`, `Dexie.js` 등)를 흔히 사용

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
| 범위 | origin(탭 공유) | 탭 단위 | origin(탭 공유) |
| 용량 | 5MiB | 5MiB | 수백 MB~GB |
| API | 동기 | 동기 | 비동기 |
| 저장 타입 | 문자열 | 문자열 | 객체·Blob 등 구조화 데이터 |
| 조회 | key | key | 인덱스·범위 쿼리 |
| 서버 자동 전송 | 없음 | 없음 | 없음 |

---

## 6. 용도

| 저장소 | 용도 |
|---|---|
| localStorage | 지속 유지할 소량 설정: 테마, 언어, 최근 검색어, 비민감 UI 상태 |
| sessionStorage | 탭 한정 임시 상태: 다단계 폼 진행 상태, 탭별 스크롤·필터 |
| IndexedDB | 대용량·구조화 데이터, 오프라인 우선 앱(PWA), 캐시된 API 응답, 파일·이미지(Blob) |

---

## 7. 삭제

브라우저 설정의 "캐시된 이미지 및 파일"과 "쿠키 및 사이트 데이터"는 별개 항목이다. 세 저장소는 사이트 데이터에 속하며 HTTP 캐시와 저장 영역이 다르다.

| 사용자 동작 | localStorage | sessionStorage | IndexedDB |
|---|---|---|---|
| 캐시(이미지·파일)만 삭제 | 유지 | 유지 | 유지 |
| 쿠키·사이트 데이터 삭제 | 삭제 | 삭제 | 삭제 |
| 탭 닫기 | 유지 | 삭제 | 유지 |
| 저장 공간 부족 시 자동 축출(eviction) | 삭제 가능 | | 삭제 가능 |

- 캐시만 삭제하면 세 저장소 모두 유지된다. "쿠키 및 기타 사이트 데이터"를 지워야 함께 삭제된다.
- **자동 축출(eviction)**: 저장 공간이 부족하면 브라우저가 가장 오래 사용하지 않은 origin부터(LRU) 사이트 데이터를 비운다. `navigator.storage.persist()`로 persistent 권한을 얻으면 자동 축출에서 제외되지만, 사용자의 수동 삭제는 막지 못한다.
- 서버는 `Clear-Site-Data` 응답 헤더로 특정 저장소를 삭제할 수 있다. 예를 들어 로그아웃 시 `Clear-Site-Data: "storage"`를 보낸다.

---

## 8. 보안

- JavaScript로 접근할 수 있고 `HttpOnly` 같은 보호가 없어, XSS가 발생하면 저장된 값이 모두 탈취된다
- 인증 토큰·세션 ID는 Web Storage에 저장하지 않는 것이 권장된다. `HttpOnly` 쿠키는 JavaScript 접근을 막는다([[cookie]], [[session-vs-cookie]])
- 비밀번호·개인정보 등 민감 정보는 클라이언트에 저장하지 않는다. 서버 측에 두고 클라이언트에는 이를 가리키는 불투명한 식별자만 둔다. 쿠키도 대안이 아니다
- origin 단위로 격리되지만 같은 origin에 삽입된 서드파티 스크립트는 접근할 수 있다
- 사용자나 확장 프로그램이 언제든 삭제할 수 있으므로(§7), 유실되면 안 되는 데이터의 유일한 저장소로 삼지 않는다

---

## Sources
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN: Storage for the web](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN: Clear-Site-Data header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data)

---

## Related pages
- [[cookie]]
- [[session-vs-cookie]]
- [[cors]]
