---
title: AI 에이전트 스킬 파일
updated: 2026-07-08 10:32:15
tags:
  - ai
  - agent
  - skill
  - claude-code
  - slash-command
---

## 1. 개요

스킬 파일(Skill file)은 AI 에이전트가 특정 워크플로우를 재사용 가능한 형태로 정의한 마크다운 파일이다. [[ai-agent-schema|스키마 파일]](CLAUDE.md 등)이 에이전트의 전반적인 행동 원칙을 정의한다면, 스킬 파일은 **특정 태스크를 어떻게 수행할지**를 단계별로 정의한다.

스킬은 두 가지 방식으로 활성화된다. 사용자가 슬래시 명령어(`/skill-name`)로 **명시적으로 호출**하거나, 에이전트가 frontmatter의 `description`을 보고 작업 맥락에 맞다고 판단해 **자동으로 호출(model-invoked)**한다. 어느 경우든 에이전트는 해당 파일의 지침에 따라 작업을 수행한다. 세션 시작 시 자동으로 로드되는 스키마 파일과 달리, 스킬 파일의 본문은 호출 시에만 컨텍스트에 로드된다.

## 2. 스키마 파일과의 차이

| 구분 | 스키마 파일 (CLAUDE.md 등) | 스킬 파일 |
| :--- | :--- | :--- |
| 목적 | 에이전트 전반 행동 원칙 | 특정 워크플로우 절차 |
| 로드 시점 | 세션 시작 시 자동 로드 | 자동 호출 또는 `/skill-name` 호출 시 로드 |
| 범위 | 모든 작업에 상시 적용 | 호출된 순간만 적용 |
| 파일 수 | 1~3개 (계층별) | 워크플로우마다 1개 |
| 관리 단위 | 프로젝트 전체 규칙 | 개별 자동화 단위 |

스키마 파일에 모든 절차를 몰아넣으면 컨텍스트가 길어져 에이전트가 끝까지 따르지 못하는 문제가 생긴다. 자주 쓰는 워크플로우는 스킬로 분리하면 필요할 때만 로드되어 컨텍스트를 아낄 수 있다.

## 3. 파일 위치 및 구조 (Claude Code)

Claude Code에서 커스텀 스킬은 디렉터리마다 `SKILL.md` 파일을 두는 방식으로 저장한다. **디렉터리 이름이 곧 스킬 이름**(슬래시 명령어)이 된다.

```
프로젝트/
├── CLAUDE.md                       # 에이전트 행동 규칙
└── .claude/
    └── skills/
        ├── review/
        │   └── SKILL.md            # /review 로 호출
        ├── deploy/
        │   ├── SKILL.md            # /deploy 로 호출
        │   └── checklist.md        # 보조 파일 (필요 시 참조)
        └── ingest/
            └── SKILL.md            # /ingest 로 호출
```

보조 파일(참조 문서, 예시, 헬퍼 스크립트 등)은 스킬 디렉터리 안에 함께 둘 수 있고, `SKILL.md`에서 필요할 때 읽도록 지시한다.

```
skills/
└── deploy/
    ├── SKILL.md            # 메인 스킬 정의 (필수)
    ├── references/         # 참조 자료
    │   └── patterns.md
    └── scripts/            # 헬퍼 스크립트
        └── helper.sh
```

**글로벌 스킬**: `~/.claude/skills/`에 저장하면 모든 프로젝트에서 사용 가능하다.

**디렉터리 스코프**: 서브디렉터리 아래에 `.claude/skills/`를 두면 해당 경로에서 작업할 때만 해당 스킬이 활성화된다. 예: `apps/web/.claude/skills/build/SKILL.md` → `apps/web/` 내에서만 `/build` 사용 가능.

**번들 스킬**: Claude Code는 기본 제공 스킬을 내장하고 있다. 사용자 정의 스킬과 동일한 방식으로 호출된다.

### 3.1. 레거시 `commands/` 형식

기존의 `.claude/commands/<name>.md` 형식(파일명이 명령어 이름)도 여전히 동작한다. `skills/`와 동일하게 로드되며 차이는 파일 배치뿐이다. 신규 작성 시에는 보조 파일 번들과 자동 호출(`description`)을 지원하는 `skills/<name>/SKILL.md` 형식이 권장된다.

## 4. 스킬 파일 형식

`SKILL.md`는 YAML frontmatter(선택)와 본문(마크다운)으로 구성된다. 본문 내용 자체가 에이전트에게 전달되는 지침이다.

### 4.1. Frontmatter 필드

```yaml
---
name: deploy                 # (필수) 스킬 식별자
description: 스테이징/프로덕션 배포 시 사용. "배포", "deploy", "릴리즈" 요청에 활성화.  # (필수) 자동 호출 트리거 조건
version: 1.0.0               # (선택) 버전
license: MIT                 # (선택) 라이선스
---
```

`description`은 에이전트가 **언제 이 스킬을 자동으로 호출할지** 판단하는 근거다. 사용자가 말할 법한 트리거 문구·키워드·대상 주제를 구체적으로 기술할수록 적절한 시점에 활성화된다. 다른 스킬과 트리거 조건이 겹치지 않게 작성한다.

> 레거시 `commands/<name>.md` 형식은 frontmatter 필드가 다르다: `description`, `argument-hint`(인자 힌트), `allowed-tools`(사전 허용 도구로 권한 프롬프트 감소), `model`(모델 오버라이드). 본문에서 `$ARGUMENTS`로 사용자 입력을 참조한다.

### 4.2. 기본 형식

```markdown
---
name: deploy
description: 스테이징 환경 배포 시 사용. "배포", "deploy" 요청에 활성화.
---

# Deploy

스테이징 환경에 애플리케이션을 배포한다.

## Steps
1. `npm run build` 실행
2. `npm test` 로 테스트 통과 확인
3. `git push origin staging` 으로 스테이징 배포
4. https://staging.example.com 응답 코드 200 확인
```

### 4.3. 서브커맨드

파일 내에 `Subcommands` 테이블을 두면 `/skill <subcommand>` 형태로 세분화할 수 있다. 에이전트는 테이블을 읽어 어느 서브커맨드에 해당하는 액션을 실행할지 결정한다.

```markdown
## Subcommands

| Subcommand | Action |
|---|---|
| `staging`  | 스테이징 환경으로 배포                     |
| `prod`     | 프로덕션 배포 (사용자 확인 후 진행)         |
| `rollback` | 직전 배포로 롤백                          |
```

호출: `/deploy staging`, `/deploy rollback`

서브커맨드 없이 기본 호출(`/deploy`)하면 테이블 상단 흐름이나 사용법 안내를 실행한다.

### 4.4. 인자 전달

호출 시 파일 경로나 텍스트를 함께 전달하면 에이전트가 이를 작업 대상으로 인식한다.

```
/review src/auth/login.ts
/ingest https://example.com/docs
/refactor "extract this into a separate function"
```

### 4.5. 조건 분기

자연어로 조건을 기술하면 에이전트가 상황에 맞게 판단한다.

```markdown
## Steps
1. 인자로 파일 경로가 주어진 경우 해당 파일만 리뷰
2. 인자가 없으면 `git diff --staged` 결과를 리뷰 대상으로 사용
3. 변경사항이 없으면 사용자에게 리뷰할 대상을 물어본다
```

## 5. 대표 예시

### 5.1. Claude Code 번들 스킬

Claude Code가 기본 제공하는 스킬의 구조적 특징:

**`claude-api`**: LLM 기반 애플리케이션 개발 지원. 프로젝트 언어 자동 감지 → 언어별 SDK 문서 로드 → 코드 작성의 흐름을 정의한다. `migrate` 서브커맨드로 기존 코드를 최신 모델 API로 마이그레이션하는 워크플로우를 별도 분기로 분리했다.

**`artifact-design`**: HTML 아티팩트 생성 시 디자인 가이드라인(레이아웃, 색상, 타이포그래피, 반응형)을 적용한다. 스킬 자체가 다른 스킬이나 코드 생성 도중 참조(Read)되도록 설계되어 있다.

두 번들 스킬 모두 단순한 지침 나열이 아니라 판단 흐름(언어 감지, 지원 여부 확인, 서브커맨드 분기)을 포함하고 있다는 점이 특징이다.

### 5.2. 코드 리뷰 스킬

```markdown
---
name: code-review
description: 코드 리뷰 요청 시 사용. 파일·diff 검토, "리뷰", "review" 요청에 활성화.
---

# Code Review

주어진 파일 또는 diff에 대해 코드 리뷰를 수행한다.

## Steps
1. 인자로 파일이 주어지면 해당 파일을 읽는다.
   인자가 없으면 `git diff --staged` 를 대상으로 한다.
2. 다음 체크리스트를 기준으로 검토한다:
   - Security: SQL injection, XSS, command injection 여부
   - Logic: 엣지 케이스 누락, off-by-one 오류
   - Style: CLAUDE.md 에 정의된 프로젝트 컨벤션 준수
   - Tests: 변경된 코드에 대한 테스트 존재 여부
3. 각 이슈를 다음 형식으로 출력한다:
   `file.ts:line — [severity] description`
   severity: critical / warning / suggestion
4. 심각도 순으로 정렬하고, 전체 요약을 마지막에 붙인다.
```

### 5.3. LLM Wiki ingest 스킬

```markdown
---
name: ingest
description: raw/ 의 새 소스를 wiki에 통합할 때 사용. "ingest", "위키 작성" 요청에 활성화.
---

# Ingest

raw/ 디렉터리의 새 소스를 읽어 wiki에 통합한다.

## Steps
1. raw/ 파일 목록과 logs/log.md 를 비교해 미처리 파일 식별
2. 소스를 읽고, wiki/index.md 에서 관련 페이지 목록 수집
3. 관련 페이지 갱신 또는 신규 생성. [[wiki-link]] 크로스링크 유지
4. wiki/index.md 항목 갱신
5. logs/log.md 에 날짜·제목·요약 추가

## Rules
- 소스에 없는 내용은 추가하지 않는다
- 상충 정보는 명시적으로 표시한다
- 사용자 승인 후 파일을 수정한다
```

### 5.4. 릴리즈 노트 생성 스킬

```markdown
---
name: release-notes
description: 릴리즈 노트·CHANGELOG 생성 시 사용. "릴리즈 노트", "changelog" 요청에 활성화.
---

# Release Notes

마지막 태그 이후의 커밋을 분석해 릴리즈 노트를 생성한다.

## Steps
1. `git tag --sort=-creatordate` 로 최신 태그 확인
2. `git log <last-tag>..HEAD --oneline` 로 커밋 목록 조회
3. Features / Bug Fixes / Breaking Changes / Internal 로 분류
4. 기술 용어를 사용자 관점 한 줄 설명으로 변환
5. CHANGELOG.md 형식으로 출력

## Subcommands
| Subcommand | Action |
|---|---|
| `draft`    | 초안 출력만 (파일 저장 없음) |
| `write`    | CHANGELOG.md 에 직접 추가   |
```

## 6. 활용 패턴

### 6.1. 팀 워크플로우 표준화

배포, 코드 리뷰, 릴리즈 노트 등 팀이 반복하는 작업을 스킬로 정의한다. "어떻게 하는지"를 코드와 함께 Git으로 관리하며, 신규 팀원도 `/deploy`만 입력하면 정해진 절차를 밟는다.

### 6.2. 다단계 워크플로우 분리

하나의 큰 워크플로우를 서브커맨드로 나눈다. `/release draft`(초안 확인) → `/release write`(반영)처럼 각 단계를 명시적으로 분리해 중간 검토 지점을 만든다.

### 6.3. 스키마 파일 경량화

CLAUDE.md에 모든 워크플로우를 넣으면 컨텍스트가 길어진다. 자주 쓰지 않는 절차는 스킬로 분리하고, CLAUDE.md에는 상시 적용 규칙만 남긴다.

### 6.4. 온보딩 자동화

`.claude/skills/setup/SKILL.md`를 두고 신규 환경 셋업 절차(의존성 설치, 설정 파일 생성, DB 마이그레이션 등)를 정의한다. 신규 개발자가 `/setup`으로 전체 과정을 수행할 수 있다.

### 6.5. 스킬 조합

스킬 내에서 다른 스킬을 참조하도록 지침을 작성할 수 있다. 예: review 스킬이 실행 중 `security-checklist.md`를 읽어 체크리스트를 보강하거나, artifact 생성 스킬이 design 스킬의 가이드라인을 먼저 로드하도록 구성한다.

## 7. 장점

**재사용성**: 반복 프롬프트를 매번 타이핑하지 않고 파일로 관리한다. Git으로 팀 전체가 동일한 워크플로우를 공유한다.

**버전 관리**: 코드와 함께 Git으로 관리된다. 워크플로우 변경 이력 추적이 가능하고 PR로 리뷰할 수 있다.

**일관성**: 에이전트가 항상 동일한 절차를 따른다. 담당자마다 다른 프롬프트를 쓰는 편차를 없앤다.

**발견성**: `/` 입력 시 사용 가능한 스킬 목록이 표시된다. 팀원이 어떤 자동화가 있는지 탐색할 수 있다.

**컨텍스트 효율**: 스키마 파일에 모든 절차를 담는 것보다, 필요할 때만 로드되는 스킬로 분리하면 에이전트 컨텍스트 창을 효율적으로 사용한다.

**점진적 개선**: 첫 버전이 rough해도 된다. 실제 사용 중 불필요한 단계를 발견하면 파일을 수정·커밋한다. 스키마 파일과 동일한 진화 방식이다.

---

## Sources
- [Claude Code — Skills](https://code.claude.com/docs/en/skills)
- [Claude Code — The .claude directory](https://code.claude.com/docs/en/claude-directory)
- [Claude Code — Custom slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

---

## Related pages
- [[ai-agent-schema]]
- [[llm-wiki]]
