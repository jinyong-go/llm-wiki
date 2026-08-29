---
title: 자바스크립트 Promise
updated: 2026-08-27 17:05:57
tags:
  - javascript
  - async
  - promise
---

## 1. 개요

자바스크립트는 싱글 스레드다. I/O처럼 시간이 걸리는 작업을 동기적으로 기다리면 그동안 다른 코드가 전혀 실행되지 못한다. **비동기**는 이런 작업을 백그라운드에 맡기고, 결과가 준비되면 나중에 처리하도록 미루는 방식이다.

콜백 → **Promise** → **async/await**([[async-await]]) 순으로 발전했다. 콜백은 중첩이 깊어질수록 가독성이 떨어지는 "콜백 지옥" 문제가 있었고, `Promise`는 이를 체이닝 가능한 객체로 표준화했다.

`Promise`는 비동기 작업의 **최종 완료(또는 실패)와 그 결과값**을 나타내는 객체다.

---

## 2. 상태

| 상태 | 의미 |
|---|---|
| `pending` | 초기 상태. 아직 완료되지 않음 |
| `fulfilled` | 성공적으로 완료됨 |
| `rejected` | 실패함 |

`fulfilled`/`rejected`를 합쳐 **settled**(확정, **completed**라고도 함)라 한다 — pending을 벗어나 fulfilled나 rejected 중 하나로 정해진 상태다. 한 번 settled되면 상태는 바뀌지 않는다.

**resolved**는 settled(completed)됐거나, 다른 Promise의 상태를 따르도록 고정된 상태를 뜻한다. 고정 대상이 아직 pending이면 resolved이면서도 pending일 수 있다 — resolved가 곧 fulfilled를 뜻하지는 않는다.

```javascript
const p = new Promise((resolve) => {
  resolve(new Promise((innerResolve) => setTimeout(innerResolve, 1000)));
});
// p는 이 시점에 이미 resolved(다른 promise로 고정)지만,
// 내부 promise가 1초 뒤 fulfilled되기 전까지는 pending 상태다.
```

---

## 3. 생성과 소비

```javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    const ok = Math.random() > 0.5;
    ok ? resolve("성공") : reject(new Error("실패"));
  }, 300);
});

p.then(
  (value) => console.log(value),    // fulfilled 상태일 때 실행
  (reason) => console.error(reason) // rejected 상태일 때 실행
);
```

`then(onFulfilled, onRejected)`으로 두 콜백을 등록한다. `catch(onRejected)`는 `then(undefined, onRejected)`의 축약이고, `finally(callback)`은 성공/실패 여부와 무관하게 실행된다. 세 메서드 모두 **새 Promise를 반환**하므로 체이닝할 수 있다.

`then()`의 두 번째 인자(`onRejected`)는 **그 `then()`이 호출된 Promise 자체가 rejected일 때만** 실행된다 — 첫 번째 인자(`onFulfilled`)가 실행되다 던진 에러는 잡지 못한다. 이 점이 `.then(a).catch(b)`처럼 뒤에 `catch()`를 체이닝하는 것과의 핵심 차이다.

```javascript
p.then(
  (value) => { throw new Error("onFulfilled 내부 에러"); },
  (reason) => console.error("이 핸들러는 실행되지 않음:", reason)
).catch((err) => console.error("catch가 대신 잡음:", err));
```

체이닝과 `catch()`의 정확한 동작은 [§4](#4-체이닝) 참고.

---

## 4. 체이닝

`then()`/`catch()`/`finally()`는 모두 새 Promise를 반환하므로 연속으로 이어붙일 수 있다.

### 4.1. then()

새 Promise를 반환하며, 그 상태는 핸들러의 실행 결과로 결정된다.

- 핸들러가 값을 반환하면 다음 Promise는 그 값으로 fulfilled된다.
- 핸들러가 Promise를 반환하면 다음 Promise는 그 Promise를 따라간다.
- 핸들러가 예외를 던지면 다음 Promise는 그 에러로 rejected된다.

```javascript
fetchUser(id)
  .then((user) => fetchPosts(user.id)) // promise 반환 → 그 promise를 따라감
  .then((posts) => posts.length)       // 값 반환 → 다음 then은 이 값으로 fulfilled
  .then((count) => console.log(count));
```

### 4.2. catch()

`then(undefined, onRejected)`의 축약이다. 앞선 `then()`에 `onRejected`가 없으면, 에러는 그다음 `onRejected`가 있는 지점까지 그대로 전파된다 — 그래서 체인 끝에 `catch()` 하나만 두는 패턴이 흔하다.

```javascript
fetchUser(id)
  .then((user) => fetchPosts(user.id)) // 여기서 에러가 나도 onRejected 없음 → 전파
  .then((posts) => console.log(posts)) // 여기도 없음 → 전파
  .catch((err) => console.error(err)); // 앞의 두 then()에서 난 에러를 모두 여기서 잡음
```

### 4.3. finally()

fulfilled/rejected 여부와 무관하게 실행된다. 콜백은 인자를 받지 않으며, 반환값도 무시된다 — 체인의 값/에러를 그대로 다음으로 통과시킨다(단, `finally` 콜백이 예외를 던지거나 rejected Promise를 반환하면 그 상태로 바뀐다).

```javascript
fetchUser(id)
  .then((user) => console.log(user))
  .catch((err) => console.error(err))
  .finally(() => console.log("요청 종료")); // 성공/실패 상관없이 항상 실행
```

---

## 5. 동시성 정적 메서드

여러 Promise를 동시에 다룰 때 쓴다. 모두 Promise의 iterable을 받아 새 Promise 하나를 반환한다.

### 5.1. Promise.all()

모든 Promise가 fulfilled되어야 fulfilled된다(결과값 배열, 입력 순서 유지). 하나라도 rejected되면 그 즉시 그 이유로 rejected된다(나머지 Promise는 계속 실행되지만 결과는 무시됨).

```javascript
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);
```

### 5.2. Promise.allSettled()

성공/실패와 무관하게 **모든 Promise가 settled될 때까지 기다린다.** 항상 fulfilled되며, 각 원소는 `{ status: 'fulfilled', value }` 또는 `{ status: 'rejected', reason }` 형태다.

```javascript
const results = await Promise.allSettled([fetchUser(id), fetchPosts(id)]);
results.forEach((r) =>
  r.status === "fulfilled" ? console.log(r.value) : console.error(r.reason)
);
```

### 5.3. Promise.race()

가장 먼저 settled되는(fulfilled든 rejected든) Promise의 결과를 그대로 따른다.

```javascript
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => setTimeout(() => reject(new Error("타임아웃")), 3000)),
]); // fetchData가 3초 안에 끝나지 않으면 타임아웃 에러로 rejected
```

### 5.4. Promise.any()

하나라도 fulfilled되면 그 즉시 그 값으로 fulfilled된다. **전부** rejected될 때만 `AggregateError`(각 실패 이유를 담은 배열)로 rejected된다.

```javascript
const first = await Promise.any([
  fetch("https://mirror1.example.com/data"),
  fetch("https://mirror2.example.com/data"),
]); // 둘 중 먼저 성공하는 응답
```

`async`/`await`에서 이 메서드들을 활용해 동시 실행을 구성하는 방법은 [[async-await]] §4 참고.

---

## 6. Thenable

`then()` 메서드를 가진 객체는 네이티브 `Promise`가 아니어도 Promise처럼 취급된다(**thenable**). Promise가 언어 표준이 되기 전부터 존재하던 여러 Promise 구현체(jQuery Deferred, Bluebird 등)와 상호운용하기 위한 장치다. `Promise.resolve()`와 `await`는 thenable을 만나면 그 `then()`을 호출해 감싸인 값/에러를 그대로 따라간다.

```javascript
const thenable = {
  then(onFulfilled, onRejected) {
    setTimeout(() => onFulfilled(42), 100);
  },
};

Promise.resolve(thenable).then((v) => console.log(v)); // 42 — thenable을 네이티브 Promise처럼 처리
await thenable; // 42 — await도 동일하게 동작
```

네이티브 `Promise`도 thenable의 일종이다(`then()`을 가지므로). 반대로 모든 thenable이 `Promise`의 인스턴스인 것은 아니다 — `instanceof Promise`는 실패할 수 있다.

---

## 7. Promise를 반환하는 내장 함수/API

일부 표준 내장 함수·Web API는 콜백 대신 Promise를 반환하도록 설계되어 있다.

| 함수/API | 반환값 |
|---|---|
| `fetch(url)` | HTTP 응답(`Response`)을 담은 Promise |
| `import(specifier)`(동적 import) | 모듈 네임스페이스 객체를 담은 Promise |
| `navigator.clipboard.writeText()` | 완료를 나타내는 Promise |
| Node.js `fs.promises.readFile()` | 파일 내용을 담은 Promise(콜백 기반 `fs.readFile`과 별개 API) |

---

## Sources

- MDN — Promise: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
- MDN — Using promises: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
- MDN — Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- MDN — import(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import

---

## Related pages

- [[async-await]] — Promise 기반 동기적 문법
- [[lexical-scope]] — 클로저와 콜백
- [[first-class-citizen]] — 함수를 값으로 다루는 콜백/핸들러 전달
