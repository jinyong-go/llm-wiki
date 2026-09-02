---
title: React SSR — 서버 렌더링 API와 스트리밍
updated: 2026-08-31 11:23:31
tags:
  - javascript
  - react
  - ssr
  - streaming
  - hydration
---

## 1. 개요

**React SSR**은 `react-dom/server` 모듈의 API로 React 컴포넌트 트리를 서버에서 HTML로 렌더링하는 것이다. SSR/CSR의 개념과 하이드레이션(hydration) 원리는 [[ssr-vs-csr]] 참고. 이 문서는 React가 제공하는 서버 렌더링 API 종류와 스트리밍 동작을 다룬다.

React의 서버 렌더링 API는 두 세대로 나뉜다.

- **비스트리밍 SSR**: `renderToString`, `renderToStaticMarkup` — 동기 함수, 문자열을 즉시 반환.
- **스트리밍 SSR**: `renderToPipeableStream`(Node.js), `renderToReadableStream`(Web Streams) — `Suspense`와 결합해 준비된 부분부터 순차 전송.

---

## 2. 패키지 구성

### 2.1. 기본 포함 (react, react-dom)

`react`와 `react-dom`만 설치하면 아래 API를 바로 쓸 수 있다. 별도 패키지가 아니라 `react-dom`의 서브 경로(subpath)다.

| import 경로 | 제공 API | 용도 |
|---|---|---|
| `react-dom/server` | `renderToString`, `renderToStaticMarkup`, `renderToPipeableStream`, `renderToReadableStream` | 서버에서 HTML 생성 |
| `react-dom/client` | `hydrateRoot`, `createRoot` | 클라이언트에서 하이드레이션/마운트 |

```bash
npm install react react-dom
```

### 2.2. 추가 설치가 필요한 경우

**라우팅** — `react` 자체에는 라우터가 없다. URL별로 다른 컴포넌트를 SSR하려면 `react-router-dom`을 별도 설치해야 하고, 서버는 `StaticRouter`, 클라이언트는 `BrowserRouter`를 쓴다.

```bash
npm install react-router-dom
```

```jsx
// server
import { StaticRouter } from "react-router-dom/server";
import { renderToString } from "react-dom/server";

const html = renderToString(
  <StaticRouter location={req.url}>
    <App />
  </StaticRouter>
);

// client
import { BrowserRouter } from "react-router-dom";
import { hydrateRoot } from "react-dom/client";

hydrateRoot(
  document.getElementById("root"),
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

**메타프레임워크** — 번들링(서버/클라이언트 분리 빌드), 라우팅, 스트리밍을 직접 조립하는 대신 Next.js(`next`)나 Remix(`react-router` v7 프레임워크 모드) 같은 메타프레임워크를 설치해 통합 제공받는 것이 실무 표준이다. React Router 공식 문서도 수동 SSR 구현 대신 Remix 사용을 권장한다.

---

## 3. 비스트리밍 SSR

### 3.1. renderToString

```jsx
import { renderToString } from "react-dom/server";
const html = renderToString(<App />);
```

- 컴포넌트 트리를 HTML 문자열로 즉시 반환한다.
- 클라이언트에서 `hydrateRoot`로 하이드레이션 가능한 HTML을 만든다.
- **스트리밍·데이터 대기를 지원하지 않는다.** 컴포넌트가 `Suspense`로 인해 서스펜드되면 데이터를 기다리지 않고 즉시 `fallback`을 HTML에 넣는다.
- React 공식 문서는 Node.js 환경에서는 `renderToPipeableStream`, Web Streams 환경(Deno, 엣지 런타임)에서는 `renderToReadableStream`으로 마이그레이션을 권장한다.

### 3.2. renderToStaticMarkup

```jsx
import { renderToStaticMarkup } from "react-dom/server";
const html = renderToStaticMarkup(<Page />);
```

- `renderToString`과 유사하지만 하이드레이션에 필요한 내부 속성(`data-reactroot` 등)을 넣지 않는다.
- **결과물은 하이드레이션이 불가능하다.** 이메일 템플릿, 완전 정적 페이지처럼 이후 React가 관여하지 않는 순수 HTML 생성에 쓴다.

---

## 4. 스트리밍 SSR

### 4.1. API

| API | 대상 환경 | 반환 |
|---|---|---|
| `renderToPipeableStream` | Node.js (`Writable` 스트림) | `{ pipe, abort }` |
| `renderToReadableStream` | Web Streams(Deno, 엣지 런타임) | `Promise<ReadableStream>` (+ `allReady`) |

```jsx
// Node.js
import { renderToPipeableStream } from "react-dom/server";

app.use("/", (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ["/main.js"],
    onShellReady() {
      res.setHeader("content-type", "text/html");
      pipe(res);
    },
  });
});
```

루트 컴포넌트는 `<html>` 태그를 포함해 문서 전체를 렌더링해야 한다. `bootstrapScripts`로 지정한 스크립트가 스트림 끝에 삽입되며, 클라이언트는 이를 통해 `hydrateRoot(document, <App />)`를 호출한다.

### 4.2. Suspense와 셸(shell)

`<Suspense>` 경계 바깥 부분을 **셸(shell)** 이라 한다. 셸만 완성되면 `onShellReady`가 호출되어 즉시 스트리밍을 시작할 수 있고, 이후 `Suspense`로 감싼 부분은 데이터가 준비되는 대로 순차적으로 스트림에 추가되며 `fallback`을 실제 콘텐츠로 교체하는 인라인 `<script>`가 함께 전송된다.

```jsx
function ProfilePage() {
  return (
    <ProfileLayout>
      <ProfileCover />
      <Suspense fallback={<BigSpinner />}>
        <Sidebar>
          <Friends />
          <Photos />
        </Sidebar>
        <Suspense fallback={<PostsGlimmer />}>
          <Posts />
        </Suspense>
      </Suspense>
    </ProfileLayout>
  );
}
```

`Suspense` 경계를 중첩할수록 더 세밀한 순서로 콘텐츠가 드러난다. `Promise`를 `use`로 읽는 등 `Suspense`를 트리거하는 데이터 소스만 서스펜드하며, 이펙트(`useEffect`)나 이벤트 핸들러 내 fetch는 감지하지 않는다.

크롤러·정적 생성처럼 점진적 로딩 없이 완성된 HTML 전체가 필요하면 `onShellReady` 대신 `onAllReady`(또는 `renderToReadableStream`의 `stream.allReady`)를 사용한다.

### 4.3. renderToString과의 차이

| 항목 | renderToString | 스트리밍 API |
|---|---|---|
| 반환 | 문자열(동기) | 스트림 |
| Suspense | fallback만 즉시 렌더, 데이터 대기 없음 | 준비된 콘텐츠를 순차 전송 |
| TTFB | 전체 렌더 완료까지 대기 | 셸 완성 즉시 전송 |
| 에러 처리 | 예외로 전파 | `onError`/`onShellError` 콜백 |

---

## 5. 하이드레이션

서버가 만든 HTML에 이벤트 핸들러를 붙이는 과정이다. 상세 원리·불일치(mismatch) 원인은 [[ssr-vs-csr]] §3.2 참고.

```jsx
import { hydrateRoot } from "react-dom/client";
hydrateRoot(document, <App />);   // renderToPipeableStream/renderToReadableStream로 전체 document를 렌더한 경우
```

스트리밍 SSR은 **선택적 하이드레이션(selective hydration)** 을 지원한다. 하이드레이션도 `Suspense` 경계 단위로 나뉘어, 사용자가 특정 영역을 클릭하면 React가 그 영역의 하이드레이션 우선순위를 높인다. 전체 페이지 하이드레이션 완료를 기다릴 필요가 없다.

---

## 6. 요약

- 기본 `react`/`react-dom`만으로 서버 렌더링·하이드레이션 API는 전부 쓸 수 있다. 라우팅(`react-router-dom`)이나 메타프레임워크는 별도 설치가 필요하다.
- 비스트리밍(`renderToString`/`renderToStaticMarkup`)은 구현이 간단하지만 Suspense를 기다리지 않고 fallback을 즉시 굳혀 보낸다. `renderToStaticMarkup`은 하이드레이션 자체가 불가능하다.
- 스트리밍(`renderToPipeableStream`/`renderToReadableStream`)은 셸을 먼저 보내고 `Suspense` 단위로 콘텐츠를 순차 전송해 TTFB·FCP를 개선하며, 선택적 하이드레이션까지 지원한다.

---

## Sources
- React — renderToString: https://react.dev/reference/react-dom/server/renderToString
- React — renderToStaticMarkup: https://react.dev/reference/react-dom/server/renderToStaticMarkup
- React — renderToPipeableStream: https://react.dev/reference/react-dom/server/renderToPipeableStream
- React — renderToReadableStream: https://react.dev/reference/react-dom/server/renderToReadableStream
- React Router — Server Side Rendering (v6.30.3): https://reactrouter.com/6.30.3/guides/ssr

---

## Related pages
- [[ssr-vs-csr]] — SSR/CSR 개념 비교, 하이드레이션 상세
- [[nestjs]] — Node.js 서버 프레임워크 (React SSR 서버 호스팅 예)
