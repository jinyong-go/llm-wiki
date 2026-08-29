---
name: wiki-lint
description: 위키의 깨진 링크·정보 충돌을 점검할 때 사용. "wiki-lint", 위키 무결성 검사, broken link/conflict 확인 요청에 활성화.
version: 1.0.0
---

# wiki-lint

위키의 무결성을 점검한다.

## Checks

- **broken links** — `[[wiki-link]]` 대상이 `raw/`에 존재하지 않거나, 웹사이트에 연결할 수 없는 경우.
- **conflicts** — 소스와 위키 페이지 전반에서 정보/주장의 불일치가 존재하는 경우.

## Output

- 점검 결과를 출력한다.
- 사용자가 원하면 `log/lint/report-{date:yyyyMMdd}.md` 파일로 저장한다.
  - 날짜는 `bash`의 `date`로 가져온다.
