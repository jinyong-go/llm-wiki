# llm-wiki web

`../llm-wiki/wiki/*.md`를 빌드 시점에 HTML로 변환해 보여주는 React 정적 사이트.

## 사용

```
npm install
npm run dev       # ../llm-wiki/wiki 콘텐츠를 읽어 src/content/*.json 생성 후 dev 서버 실행
npm run build     # 콘텐츠 재생성 + 타입체크 + dist/ 정적 빌드
npm run content   # 콘텐츠만 재생성 (dev/build 없이)
```

`src/content/pages.json`, `src/content/nav.json`은 빌드 시 생성되는 파일로 git에 커밋하지 않음(`.gitignore` 참고). `wiki/*.md`를 수정한 뒤에는 `npm run dev`/`npm run build`가 자동으로 재생성한다.

## 콘텐츠 파이프라인

`scripts/build-content.mjs`:
- frontmatter 파싱 (`gray-matter`)
- remark/rehype: GFM 표, LaTeX(KaTeX), 코드 하이라이트, 헤딩 앵커(`rehype-slug`)
- `scripts/remark-wikilink.mjs`: `[[page]]`, `[[page#heading]]`, `[[#heading]]` 형식의 위키링크를 라우트로 변환. 대상을 찾지 못하면 빌드 콘솔에 경고 출력(빌드는 실패하지 않음)

Node 24 LTS 기준 (`.nvmrc`). `raw/`는 기본적으로 사이트에 노출하지 않음.
