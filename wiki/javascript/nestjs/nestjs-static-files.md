---
title: NestJS 정적 파일 서빙
updated: 2026-08-21 18:00:06
tags:
  - nodejs
  - nestjs
---

## 1. 개요

Nest에서 정적 파일을 서빙하는 방법은 두 가지다.

| | `ServeStaticModule` | `app.useStaticAssets()` |
|---|---|---|
| 패키지 | `@nestjs/serve-static` | 플랫폼 어댑터 내장(Fastify는 `@fastify/static` 추가 설치) |
| 등록 위치 | 모듈의 `imports`([[nestjs-modules]]) | `main.ts` 부트스트랩에서 `app` 인스턴스에 직접 |
| 목적 | SPA 빌드 산출물 전체를 하나의 루트로 서빙 | MVC 스타일 서버 렌더링에서 CSS/JS/이미지 같은 보조 자산 서빙 |

목적에 따라 골라 쓰면 되고, 두 방식을 함께 쓰는 것도 가능하다.

---

## 2. ServeStaticModule (SPA 전체 서빙)

### 2.1. 설치와 등록

```bash
npm install --save @nestjs/serve-static
```

```typescript
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
})
export class AppModule {}
```

### 2.2. 디렉터리 구조

`rootPath`는 컴파일된 `main.js` 기준(`__dirname`)의 상대 경로로 지정하는 경우가 많다 — 빌드 후 `dist/main.js`에서 프로젝트 루트의 `client/`를 가리키게 하기 위해서다.

```
project/
├─ client/              ← rootPath. 빌드된 SPA 산출물
│  ├─ index.html
│  └─ assets/
│     ├─ main.js
│     └─ main.css
├─ src/
│  ├─ app.module.ts
│  └─ main.ts
└─ dist/                ← 컴파일된 Nest 서버 (main.js가 여기 위치)
```

### 2.3. 주요 옵션

| 옵션 | 설명 |
|---|---|
| `rootPath` | 정적 파일 루트 디렉터리. 기본값 `"client"` |
| `serveRoot` | 정적 앱을 서빙할 URL 경로 prefix. 기본값 `""` |
| `renderPath` | 정적 앱에 매핑할 경로. 기본값은 와일드카드(모든 경로) |
| `useGlobalPrefix` | `true`면 `setGlobalPrefix()`로 설정한 전역 prefix가 정적 앱에도 적용 |
| `exclude` | 정적 서빙에서 제외할 경로(문자열 배열 또는 정규식). **Fastify 미지원** — Fastify는 `renderPath`를 정규식으로 대체 |
| `serveStaticOptions.index` | 디렉터리 요청 시 반환할 파일. 기본 `index.html`, `false`로 비활성화 가능 |
| `serveStaticOptions.maxAge` | `Cache-Control`의 max-age(ms 또는 문자열) |
| `serveStaticOptions.cacheControl` | `Cache-Control` 헤더 설정 여부. 기본 `true` |
| `serveStaticOptions.extensions` | 확장자 생략 시 시도할 확장자 목록(`['html']` 등) |
| `serveStaticOptions.redirect` | 디렉터리 요청 시 트레일링 슬래시로 리다이렉트. 기본 `true` |
| `serveStaticOptions.fallthrough` | **Fastify 전용.** `true`로 설정해야 미매칭 경로에서 404 대신 `index.html` 반환(Express 기본 동작 흉내) |

### 2.4. SPA 폴백과 컨트롤러 라우트

기본 `renderPath`는 와일드카드라 모든 미매칭 요청이 `index.html`로 폴백된다 — React Router 같은 클라이언트 사이드 라우팅을 지원하기 위해서다. `@Controller()`로 등록한 라우트는 이 폴백보다 **우선** 매칭되므로, API 라우트와 SPA 정적 서빙을 같은 애플리케이션에서 충돌 없이 함께 쓸 수 있다.

### 2.5. 다중 경로 등록

`forRoot()`는 여러 설정 객체를 인자로 받아, 서로 다른 `serveRoot`에 서로 다른 `rootPath`를 매핑할 수 있다.

```typescript
ServeStaticModule.forRoot(
  { rootPath: join(__dirname, '..', 'client'), serveRoot: '/app' },
  { rootPath: join(__dirname, '..', 'docs'), serveRoot: '/docs' },
);
```

### 2.6. 빌드 스크립트 구성 (React 예시)

React 등으로 만든 SPA와 Nest 서버를 함께 배포하려면, 두 빌드를 순서대로 실행하고 산출물 경로를 `rootPath`와 맞춰야 한다. 아래는 `client/`에 별도 React 프로젝트(Vite 기준)를 두고, 루트 `package.json`에서 두 빌드를 오케스트레이션하는 구성이다.[^1]

```
project/
├─ client/                 ← React 프로젝트(자체 package.json)
│  ├─ src/
│  ├─ package.json
│  └─ dist/                ← npm run build 결과물 (Vite 기본 출력 경로)
├─ src/                    ← Nest 서버 소스
│  ├─ app.module.ts
│  └─ main.ts
├─ dist/                   ← nest build 결과물 (main.js가 여기 위치)
└─ package.json            ← 루트
```

루트 `package.json`:

```json
{
  "scripts": {
    "build:client": "npm run build --prefix client",
    "build:server": "nest build",
    "build": "npm run build:client && npm run build:server",
    "start:prod": "node dist/main"
  }
}
```

`client/package.json`(React 쪽, 예시는 Vite):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

`build` 스크립트가 클라이언트를 먼저 빌드해 `client/dist/`를 만들고, 이어서 `nest build`가 서버를 `dist/`로 컴파일한다. `rootPath`는 이 클라이언트 산출물 경로를 가리켜야 한다.

```typescript
ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'client', 'dist'),
});
```

여러 프로젝트를 한 저장소에서 관리하는 규모라면, 스크립트 체이닝 대신 npm workspaces([[npm]] §6)로 두 프로젝트를 등록하고 `npm run build --workspaces`로 한 번에 빌드하는 방법도 있다.

> 개발 중에는 보통 React 개발 서버(`vite`/`webpack-dev-server`)를 프록시와 함께 별도로 띄워 API를 호출하고, `ServeStaticModule`은 **운영 빌드 산출물을 서빙**하는 용도로만 쓴다 — 위 구성은 그 배포 시점 빌드에 해당한다.

---

## 3. app.useStaticAssets() (MVC 보조 자산)

템플릿 엔진으로 서버 사이드 렌더링을 할 때, `views/`의 템플릿과 별개로 `public/`의 CSS·JS·이미지를 서빙하는 용도다. `main.ts`의 부트스트랩 단계에서 설정한다.

```
project/
├─ public/
│  ├─ css/style.css
│  └─ js/app.js
├─ views/
│  └─ index.hbs
└─ src/main.ts
```

### 3.1. Express

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';

const app = await NestFactory.create<NestExpressApplication>(AppModule);

app.useStaticAssets(join(__dirname, '..', 'public'));
app.setBaseViewsDir(join(__dirname, '..', 'views'));
app.setViewEngine('hbs');
```

경로에 prefix를 주려면 두 번째 인자로 옵션을 넘긴다: `app.useStaticAssets(path, { prefix: '/static' })`.

### 3.2. Fastify

Fastify는 `@fastify/static` 패키지가 별도로 필요하고, 인자 형태도 Express와 다르다 — 경로 문자열이 아니라 `root` 키를 포함한 **옵션 객체**를 받는다.

```bash
npm install @fastify/static
```

```typescript
import { NestFastifyApplication } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

app.useStaticAssets({
  root: join(__dirname, '..', 'public'),
  prefix: '/public/',
});
```

---

## 4. 선택 기준

- 빌드된 **SPA를 통째로** 서빙하고 API도 같이 두려면 → `ServeStaticModule`
- 서버 사이드 템플릿(MVC)의 **보조 자산**만 서빙하려면 → `app.useStaticAssets()`
- Fastify를 쓴다면 어느 방식이든 Express와 옵션 형태·기본 동작이 다르므로([§2.3](#23-주요-옵션) `fallthrough`, [§3.2](#32-fastify) 옵션 객체 형태) 별도 확인이 필요하다.

---

## Sources

- NestJS Docs — Serve Static: https://docs.nestjs.com/recipes/serve-static
- NestJS Docs — Model-View-Controller: https://docs.nestjs.com/techniques/mvc
- `@nestjs/serve-static` — ServeStaticModuleOptions: https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts

---

## Related pages

- [[nestjs]] — NestJS 개요, 플랫폼(Express/Fastify)
- [[nestjs-modules]] — 모듈 등록(forRoot)
- [[nestjs-controllers]] — 컨트롤러 라우팅과의 관계
- [[npm]] — package.json scripts, workspaces

---

[^1]: 이 빌드 스크립트 구성은 NestJS 공식 `serve-static` 문서에 명시되어 있지 않다. 공식 문서는 "SPA를 빌드해 `rootPath`에 두라"고만 안내하며, 예제 샘플(`sample/24-serve-static`)도 빌드 과정 없이 정적 `index.html`을 그대로 둔다. 위 구성은 Node.js 프로젝트에서 흔히 쓰이는 `npm --prefix`/workspaces 관례([[npm]])를 `rootPath` 요구사항에 맞춰 조합한 것이다.
