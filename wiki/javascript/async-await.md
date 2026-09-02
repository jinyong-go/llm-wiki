---
title: 자바스크립트 async/await
updated: 2026-08-31 16:55:52
tags:
  - javascript
  - async
  - promise
---

## 1. 개요

`async`/`await`는 Promise 기반 비동기 코드를 동기 코드처럼 보이게 작성하는 문법(syntactic sugar)으로, async 함수는 여전히 [[promise|Promise]]를 반환하고 `await`는 그 Promise가 처리(settle)되기를 기다린다.

`then()` 체이닝과 비교하면 여러 이점이 있다. 코드가 위에서 아래로 순차적으로 읽혀 가독성이 높고, 동기 코드와 동일한 `try`/`catch`로 에러를 처리할 수 있어 체인 곳곳에 `catch()`를 배치할 필요가 없다. 에러 발생 시 스택 트레이스에 `await`가 있던 함수가 남아 디버깅이 쉽고, 이전 단계의 결과를 지역 변수에 담아 이후 단계에서 자유롭게 재사용할 수 있다 — 체이닝에서는 이전 `then()`의 결과를 다음 `then()`에서 쓰려면 클로저나 중첩이 필요하다.

---

## 2. async 함수

`async function`은 항상 **Promise를 반환**한다. 반환값이 Promise가 아니면 자동으로`Promise.resolve()`로 감싸진다.

```javascript
async function foo() {
  return 1;
}
// function foo() { return Promise.resolve(1); } 와 동작이 같다
```

단, 반환값이 이미 Promise일 때는 동작이 다르다. `Promise.resolve(promise)`는 인자로 받은 Promise와 **같은 객체를 그대로 반환**하지만, async 함수는 반환값이 Promise여도 **항상 새 Promise 객체를 만들어 그 Promise를 따라가게(resolve)** 한다 — 최종적으로 담기는 값은 같아도 객체 참조는 달라진다.

```javascript
const p = Promise.resolve(1);
async function bar() { return p; }

console.log(Promise.resolve(p) === p); // true  — 같은 객체를 그대로 반환
console.log(bar() === p);              // false — bar()는 p를 따라가는 새 promise
```

---

## 3. await 키워드

`await`는 모듈 최상위 또는 `async` 함수 내에서 사용할 수 있다. Promise가 확정(settled)될 때까지 **그 함수의 실행만** 멈추고, 성공(fulfilled)하면 값을 반환하고, 실패(rejected)하면 그 자리에서 예외를 던진다.

```javascript
async function getUser(id) {
  try {
    const res = await fetch(`/users/${id}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

Promise가 아닌 값에 `await`를 써도 에러 없이 그 값 자체로 즉시 처리(resolve)된다. 이 경우도 다음 tick까지는 미뤄진다.

---

## 4. 순차 실행 vs 동시 실행

`await`를 반복해서 쓰면 각 작업이 **순차적으로** 실행된다.

```javascript
const a = await taskA(); // taskA 완료까지 대기
const b = await taskB(); // 그 다음 taskB 시작
```

서로 의존하지 않는 작업이면 먼저 시작만 해두고 나중에 `await`하거나, `Promise.all()`([[promise|Promise]] §5)로 묶어 **동시에** 실행한다.

```javascript
// 동시 실행: 두 작업을 먼저 시작한 뒤 한꺼번에 대기
const [a, b] = await Promise.all([taskA(), taskB()]);
```

`await taskA(); await taskB();`처럼 개별로 나눠 await하면, `taskB`가 `taskA`보다 먼저 실패해도 그 시점엔 아직 `catch`에 연결되지 않아 **처리되지 않은 거부(unhandled rejection)**가 될 수 있다 — 동시 실행이 필요하면 `Promise.all()`/`Promise.allSettled()`로 묶는 편이 안전하다.

---

## 5. 주의사항

### 5.1. forEach는 await를 기다리지 않는다

```javascript
// 의도와 다르게 각 콜백이 동시에 실행되고, forEach 자체는 기다리지 않고 바로 다음 줄로 넘어감
items.forEach(async (item) => {
  await process(item);
});
console.log("완료"); // process()들이 끝나기 전에 먼저 출력됨

// 순차 실행: for...of
for (const item of items) {
  await process(item);
}

// 동시 실행 후 전체 대기: Promise.all + map
await Promise.all(items.map((item) => process(item)));
```

`forEach`는 콜백의 반환값(Promise)에 관심이 없어 기다려주지 않는다.

### 5.2. try 블록 안에서 return await

try 블록 안에서 Promise를 await 없이 그냥 return하면, 그 Promise가 실패(rejected)해도 **함수 자신의 catch 블록이 잡지 못한다** — 함수가 이미 반환을 마친 뒤라 예외가 호출자 쪽으로 넘어가기 때문이다.

```javascript
async function bad() {
  try {
    return fetchData(); // await 없음 → 여기서 실패해도 catch가 못 잡음
  } catch (err) {
    console.error("여기 도달 안 함", err);
  }
}

async function good() {
  try {
    return await fetchData(); // await 있음 → 실패하면 catch가 잡음
  } catch (err) {
    console.error("여기서 잡힘", err);
  }
}
```

`return await`는 에러 스택 트레이스에 그 함수 자신이 남는다는 이점이 있다. `await` 없이 Promise를 그대로 반환하면, 나중에 그 Promise가 실패했을 때의 스택 트레이스에는 실패를 던진 함수만 보이고 그 Promise를 반환한 함수는 흔적이 남지 않는다. 여러 곳에서 재사용되는 비동기 함수가 많은 Node.js 백엔드 환경에서는 이 차이가 "어디서 호출했는지" 추적을 어렵게 만든다. `Promise.all()`도 마찬가지다 — `return Promise.all(...)` 대신 `return await Promise.all(...)`로 감싸야, 그리고 내부 `map` 콜백도 각각 `await`해야 호출부까지 스택에 온전히 남는다.

```javascript
// map 콜백과 Promise.all 양쪽 모두 await해야 스택 트레이스가 온전히 남는다
async function getAllTimes(list) {
  return await Promise.all(list.map(async (item) => await getTime(item)));
}
```

`await`는 마이크로태스크를 하나 더 만들어 미세한 성능 비용이 있다(ESLint `no-return-await` 규칙이 기본적으로 이를 피하라고 권장하는 이유). 하지만 백엔드 환경에서는 네트워크·DB 지연이 그보다 훨씬 크게 작용하는 경우가 대부분이라, try/catch로 잡을 에러가 없더라도 에러 추적이 중요한 함수라면 `return await`를 유지하는 편이 실무적으로 낫다.

### 5.3. 처리되지 않은 거부(unhandled rejection)

async 함수 호출 결과(Promise)를 `await`도 `catch()`도 하지 않고 그냥 두면, 실패했을 때 처리되지 않은 거부가 된다.

```javascript
async function risky() { throw new Error("실패"); }

risky(); // 반환된 promise를 아무도 처리하지 않음 → 처리되지 않은 거부

risky().catch((err) => console.error(err)); // 명시적으로 처리
```

---

## Sources

- MDN — async function: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
- MDN — await: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
- jojoldu — return await와 Node.js 에러 스택 트레이스: https://jojoldu.tistory.com/699

---

## Related pages

- [[promise]] — 상태·체이닝·동시성 메서드
- [[lexical-scope]] — 클로저와 콜백
