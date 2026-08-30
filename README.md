# llm-wiki

AI 에이전트가 관리하는 개인 지식 위키([Karpathy의 llm-wiki 패턴](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 기반)와, 그 위키 콘텐츠를 요청 시점에 렌더링하는 Next.js SSR 앱으로 구성된 모노레포.

## 구조

```
.
├── llm-wiki/            # 위키 콘텐츠 (원본 진실원)
│   ├── raw/             # 불변 원본 소스
│   ├── wiki/            # 위키 문서 (Markdown, index.md가 카탈로그)
│   │   ├── ai/ crypto/ dbms/ docker/ git/ java/ javascript/ linux/ programming/ web/ ...
│   ├── logs/YYYY-MM/    # 위키 변경 이력 (prepend-only)
│   ├── AGENTS.md        # 위키 콘텐츠 작성/수정 규칙
│   └── .obsidian/       # Obsidian vault 설정
├── app/                 # Next.js App Router
│   ├── page.tsx          # 홈 (wiki/index.md 렌더링)
│   ├── [...slug]/page.tsx  # 위키 문서 라우트 (wiki/<slug>.md)
│   └── layout.tsx         # 공통 레이아웃 + 사이드바
├── components/          # Sidebar, WikiArticle 등 UI 컴포넌트
├── lib/                 # Markdown 파이프라인, 위키 인덱스, 페이지 로더
├── CLAUDE.md / AGENTS.md   # 저장소 루트 안내 (에이전트용)
└── package.json
```

- 콘텐츠(위키 문서) 작업은 `llm-wiki/AGENTS.md`의 규칙을 따른다.
- 앱 코드(`app/`, `lib/`, `components/`) 작업은 일반적인 Next.js 프로젝트 기준으로 판단한다.

## 기술 스택

- **Next.js 16** (App Router, SSR) + **React 19** + **TypeScript**
- **Markdown 파이프라인**: `unified` + `remark-parse` / `remark-gfm` / `remark-math` → `remark-rehype` → `rehype-slug` / `rehype-katex` / `rehype-highlight` / `rehype-stringify`
- **위키링크**: `[[문서명]]`, `[[문서명|라벨]]`, `[[문서명#헤딩]]`, `[[#헤딩]]` 문법을 자체 remark 플러그인(`lib/remark-wikilink.ts`)으로 링크로 변환
- **프론트매터 파싱**: `gray-matter`
- **파일 검색/인덱싱**: `fast-glob`, `github-slugger`
- **수식**: KaTeX, **코드 하이라이팅**: highlight.js (`github-dark` 테마)
- **Lint**: ESLint (`eslint-config-next`)

## 렌더링 방식

빌드 시점에 전체 위키 페이지를 미리 변환하지 않는다. 대신:

1. `lib/wiki-index.ts`가 `llm-wiki/wiki/**/*.md`를 스캔해 프론트매터만 가볍게 읽어 **인덱스**(슬러그, 제목, 태그, 사이드바 네비게이션 트리)를 구성한다. 개발 모드에서는 요청마다 다시 빌드해 파일 수정이 즉시 반영되고, 프로덕션에서는 메모리에 캐시된다.
2. 요청받은 라우트(`app/[...slug]/page.tsx` 또는 `app/page.tsx`)가 `lib/get-page.ts`를 통해 해당 슬러그의 `.md` 파일 **하나만** 그때그때 읽어 Markdown → HTML로 변환해 반환한다.
3. 모든 페이지는 `export const dynamic = 'force-dynamic'`으로 강제 SSR되므로, 이 앱은 순수 정적 호스팅이 아니라 **Node 런타임에서 `next start`를 실행해야** 동작한다.

깨진 위키링크는 빌드 실패 없이 서버 콘솔에 경고만 출력한다(`lib/get-page.ts`의 `onBrokenLink`).

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 (파일 수정 즉시 반영)
npm run dev

# 프로덕션 빌드 + 실행
npm run build
npm run start

# Lint
npm run lint
```

기본 포트는 `http://localhost:3000`.

## 위키 콘텐츠 편집

위키 문서 생성/수정/삭제는 반드시 `llm-wiki/AGENTS.md`를 먼저 읽고 그 규칙(사전 승인, 이력 기록, 프론트매터 형식, `raw/` 기반 근거 등)을 따른다.
