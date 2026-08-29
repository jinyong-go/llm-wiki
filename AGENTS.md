# llm-wiki (모노레포 루트)

이 저장소는 두 부분으로 구성됨:
- `llm-wiki/` — 위키 콘텐츠(원본 진실원). 생성/수정/삭제 규칙은 [llm-wiki/AGENTS.md](llm-wiki/AGENTS.md) 참고. 위키 콘텐츠 작업 전 반드시 해당 파일을 읽을 것.
- 저장소 루트 자체(`app/`, `lib/`, `components/`, `package.json` 등) — `llm-wiki/wiki/*.md`를 요청 시점에 읽어 렌더링하는 Next.js(App Router) SSR 앱. 빌드 시 전체 페이지를 미리 변환하지 않고, 요청받은 페이지 하나만 그때그때 마크다운을 HTML로 변환해 내려줌. 순수 정적 호스팅이 아니라 `next start`를 실행하는 Node 런타임이 필요함.

콘텐츠 편집 작업은 `llm-wiki/` 디렉터리의 규칙을 따르고, 앱 코드 작업은 저장소 루트 기준으로 판단할 것.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
