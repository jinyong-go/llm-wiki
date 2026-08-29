# llm-wiki (모노레포 루트)

이 저장소는 두 부분으로 구성됨:
- `llm-wiki/` — 위키 콘텐츠(원본 진실원). 생성/수정/삭제 규칙은 [llm-wiki/AGENTS.md](llm-wiki/AGENTS.md) 참고. 위키 콘텐츠 작업 전 반드시 해당 파일을 읽을 것.
- `web/` — `llm-wiki/wiki/*.md`를 빌드 시점에 HTML로 변환해 보여주는 React 정적 사이트.

콘텐츠 편집 작업은 `llm-wiki/` 디렉터리의 규칙을 따르고, 웹 앱 작업은 `web/` 디렉터리 내 코드/설정을 기준으로 판단할 것.
