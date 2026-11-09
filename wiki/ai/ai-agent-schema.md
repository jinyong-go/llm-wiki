---
title: AI 에이전트 스키마 파일
updated: 2026-11-09 22:49:18
tags:
  - ai
  - agent
  - schema
  - claude-code
  - instruction
---

## 1. 개요

AI 에이전트 스키마 파일(또는 instruction 파일)은 에이전트가 프로젝트 내에서 어떻게 행동할지를 정의하는 설정 문서다. 에이전트는 세션 시작 시 이 파일을 자동으로 읽어 프로젝트 컨텍스트, 규칙, 워크플로우를 파악한다. 코드에 하드코딩된 프롬프트가 아니라 **사람이 읽고 편집할 수 있는 마크다운 파일**로 관리한다는 점이 특징이다.

## 2. 에이전트별 파일명

에이전트마다 읽는 파일명이 다르다. 동일 저장소에서 여러 에이전트를 지원하려면 파일을 병렬로 두거나, 한 파일에서 다른 파일을 가져오는 방식을 사용한다. Claude Code는 `CLAUDE.md`에 `@AGENTS.md`처럼 `@경로`를 적어 다른 파일을 가져온다.

| 에이전트 | 스키마 파일 | 비고 |
| :--- | :--- | :--- |
| Claude Code | `CLAUDE.md` | 프로젝트 루트 또는 서브디렉터리 |
| OpenAI Codex / OpenCode | `AGENTS.md` | 전역 또는 프로젝트 루트부터 작업 디렉터리까지 |
| Gemini CLI | `GEMINI.md` | 전역, 워크스페이스, 하위 디렉터리 |
| Cursor | `.cursor/rules/*.mdc` | 룰셋 파일 분리 가능 |
| GitHub Copilot | `.github/copilot-instructions.md` | 경로별 `.github/instructions/*.instructions.md`, `AGENTS.md` |

여러 위치의 파일을 합치는 방식은 §6에서 다룬다.

## 3. 스키마에 포함되는 내용

스키마 파일에 포함할 내용은 프로젝트 성격에 따라 다르지만, 일반적으로 다음 범주로 구성된다.

### 3.1. 프로젝트 컨텍스트
에이전트가 모르는 배경 지식을 제공한다. 도메인, 기술 스택, 제약사항, 팀 컨벤션 등.

```markdown
## Project
This is a Spring Boot 3.x REST API service.
Primary DB: Oracle 19c. Deployment: Kubernetes.
```

### 3.2. 디렉터리 구조
주요 디렉터리와 역할을 명시해 파일 탐색 비용을 줄인다.

```markdown
## Structure
src/main/java/...   -- application code
src/test/           -- unit & integration tests
docs/adr/           -- architecture decision records (immutable)
```

### 3.3. 워크플로우 및 명령
반복되는 작업의 절차를 정의한다. 트리거 문구와 단계별 순서를 함께 명시하면 에이전트가 일관되게 실행한다.

```markdown
## Workflows
### review
triggered by: "review this"
1. Read changed files
2. Check for security issues (OWASP Top 10)
3. Check for test coverage gaps
4. Output findings with file:line references
```

### 3.4. 코딩 규칙 및 금지 사항
스타일, 패턴, 하지 말아야 할 것을 명시한다. "하지 말 것"을 명시하는 것이 "할 것"만큼 중요하다.

```markdown
## Rules
- Use constructor injection, not field injection (@Autowired on fields)
- Do not add comments explaining WHAT the code does
- Do not create new files unless explicitly requested
- Match existing code style; do not reformat unrelated code
```

### 3.5. 페이지·문서 형식
[[llm-wiki]] 같은 지식 관리 시스템에서는 에이전트가 생성하는 문서의 형식, frontmatter, 네이밍 컨벤션을 정의한다.

```markdown
## Page Format
| **Title** | ... |
| **Last updated** | YYYY-MM-DD HH:MM:SS |
Use [[wiki-links]] for cross-references.
Sources section is mandatory.
```

### 3.6. 제한 및 안전 규칙
에이전트가 독립적으로 취해선 안 되는 행동을 명시한다.

```markdown
## Safety
- Never push to main directly
- Never modify files in raw/ (immutable sources)
- Ask before deleting any file
```

---

## 4. 대표 예시

### 4.1. Karpathy LLM Wiki 스키마
*[llm-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)*

패턴의 기원. 목적: 개인 지식 베이스를 LLM이 유지·관리. 미니멀한 규칙으로 에이전트의 판단에 많이 위임한다.

핵심 정의 내용:
- `raw/`(불변) · `wiki/`(에이전트 관리) · `index.md` · `log.md` 구조
- ingest / query / lint 3가지 워크플로우
- `[[wikilinks]]` 크로스링크 컨벤션
- 소스 인용 필수 규칙

### 4.2. SamurAIGPT/llm-wiki-agent CLAUDE.md
*[github.com/SamurAIGPT/llm-wiki-agent](https://github.com/SamurAIGPT/llm-wiki-agent)*

Karpathy 패턴을 프로덕션 수준으로 확장. 공개된 CLAUDE.md에서 확인 가능한 내용:

- **페이지 유형 세분화**: `source` · `entity` · `concept` · `synthesis` 4종 + 각 전용 디렉터리
- **도메인별 ingest 템플릿**: 소스 유형(일반 문서 / 일기·저널 / 회의록)을 감지해 다른 섹션 구성 적용
- **health vs lint 분리**: LLM 호출 없이 Python 스크립트로 구조 점검(health)을 먼저 실행 → 비용 절감
- **그래프 워크플로우**: `[[wikilink]]` 파싱 + 관계 추론 → 지식 그래프(`graph.html`) 생성
- **로그 형식 강제**: `## [YYYY-MM-DD] <operation> | <title>` — grep 파싱 가능

### 4.3. Claude Code 공식 CLAUDE.md 권장사항
Anthropic 문서에서 제시하는 일반 프로젝트용 CLAUDE.md 권장 내용:

- 빌드·테스트·린트 명령어 (`npm test`, `./gradlew test` 등)
- 코드 스타일과 컨벤션
- 아키텍처 개요 (모노레포라면 서브패키지 역할 포함)
- PR·커밋 메시지 컨벤션
- 절대 수정하지 않아야 할 파일/디렉터리

---

## 5. 작성 가이드라인

**1. 목적을 먼저 정의하라** 범용 규칙 나열보다 에이전트가 이 저장소에서 주로 하는 일(코드 리뷰, 지식 관리, 코드 생성 등)을 명시하는 것이 우선이다.

**2. 워크플로우는 단계별 순서 목록으로 기술하라** "소스를 처리하라"보다 "1. Read ... 2. Update index.md ... 3. Append to log.md" 처럼 구체적으로 써야 일관된 실행을 보장한다.

**3. "하지 말 것"을 명시하라** 에이전트가 흔히 과도하게 수행하는 행동(불필요한 리팩터링, 무관한 파일 수정, 주석 추가 등)은 명시적으로 금지한다.

**4. 짧게 유지하라** 스키마가 너무 길어지면 에이전트가 끝까지 따르지 못한다. 핵심 규칙만 남기고 나머지는 별도 문서로 분리해 링크한다.

**5. LLM과 함께 점진적으로 발전시켜라** 첫 버전은 rough해도 된다. 에이전트와 작업하면서 반복되는 수정이 생기면 그 패턴을 스키마에 추가한다. 스키마 변경도 커밋 이력으로 관리한다.

**6. 계층 구조를 활용하라 (Claude Code)** 글로벌 규칙은 `~/.claude/CLAUDE.md`, 프로젝트 공통은 루트 `CLAUDE.md`, 서브시스템별 규칙은 해당 디렉터리의 `CLAUDE.md`에 분리하면 유지보수가 쉬워진다.

---

## 6. 파일 로드 순서 및 우선순위

에이전트가 여러 위치의 스키마 파일을 읽을 때, 파일들을 어떻게 합치는지는 에이전트마다 다르다.

### 6.1. Claude Code

Claude Code는 세 레벨의 `CLAUDE.md`를 읽는다.

| 레벨 | 경로 | 적용 범위 |
| :--- | :--- | :--- |
| 글로벌 | `~/.claude/CLAUDE.md` | 모든 프로젝트에 적용 |
| 프로젝트 루트 | `<프로젝트 루트>/CLAUDE.md` | 해당 프로젝트에 적용 |
| 서브디렉터리 | `<작업 디렉터리>/CLAUDE.md` | 해당 디렉터리 내 작업 시 추가 적용 |

글로벌 파일과 작업 디렉터리 및 그 상위 디렉터리의 `CLAUDE.md`는 세션 시작 시 로드한다. 작업 디렉터리 아래 서브디렉터리의 `CLAUDE.md`는 해당 디렉터리의 파일을 읽거나 수정할 때 로드한다. 로드된 파일은 앞 파일을 덮어쓰지 않고 컨텍스트에 추가된다.

충돌이 발생할 경우, 언어 모델의 instruction following 특성상 컨텍스트에서 더 뒤에 나오는(더 구체적인) 규칙이 우선 적용되는 경향이 있다. 그러나 이는 모델의 판단에 의존하는 부분이며, 명시적으로 override를 보장하는 메커니즘은 없다.

**실용적 분리 전략**:
- `~/.claude/CLAUDE.md` → 코딩 스타일, 주석 정책 등 모든 프로젝트에 공통인 규칙
- 루트 `CLAUDE.md` → 프로젝트 컨텍스트, 빌드 명령, 아키텍처 개요
- 서브디렉터리 `CLAUDE.md` → 특정 모듈(예: `frontend/`, `ml/`)에만 적용되는 세부 규칙

`CLAUDE.md`는 `@경로` 문법으로 다른 파일을 가져올 수 있다. 상대 경로는 가져오는 파일 기준으로 해석하고, 가져온 파일이 다시 다른 파일을 가져오는 것은 4단계까지 허용된다. 코드 블록과 인라인 코드 안의 `@경로`는 가져오지 않는다.

### 6.2. Cursor

Cursor는 `.cursor/rules/` 디렉터리 내 여러 `.mdc` 파일을 지원하며, 각 파일의 frontmatter가 활성화 조건을 결정한다.

| frontmatter | 동작 |
| :--- | :--- |
| `alwaysApply: true` | 항상 컨텍스트에 포함 |
| `globs: ["src/**/*.ts"]` | 해당 경로 패턴과 일치하는 파일 작업 시 포함 |
| description만 있는 경우 | 에이전트가 관련성을 판단해 자동 포함 |

활성화된 모든 `.mdc` 파일은 병합되어 적용된다. Claude Code와 달리 디렉터리 계층 개념이 없으며, 파일별 활성화 조건으로 범위를 제어한다.

### 6.3. 기타 에이전트

- **OpenAI Codex**: 전역 `~/.codex/AGENTS.md`를 읽은 뒤 프로젝트 루트부터 작업 디렉터리까지 내려가며 디렉터리마다 `AGENTS.override.md` 또는 `AGENTS.md`를 하나씩 읽는다. 루트부터 순서대로 이어 붙이므로 작업 디렉터리에 가까운 파일이 뒤에 놓여 앞의 지침보다 우선한다. 합친 크기는 기본 32 KiB로 제한된다.
- **Gemini CLI**: 전역 `~/.gemini/GEMINI.md`, 워크스페이스 디렉터리와 상위 디렉터리의 `GEMINI.md`를 이어 붙여 매 프롬프트에 포함한다. 도구가 파일이나 디렉터리에 접근하면 해당 경로와 상위 경로의 `GEMINI.md`를 추가로 로드한다.
- **GitHub Copilot**: 저장소 전체에 적용되는 `.github/copilot-instructions.md`와 함께, `applyTo` glob으로 대상 경로를 지정하는 `.github/instructions/*.instructions.md`를 지원한다. 저장소 안 어디에나 `AGENTS.md`를 둘 수 있으며, 디렉터리 트리에서 가장 가까운 파일이 우선한다.

---

## Sources
- [llm-wiki (Andrej Karpathy)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [SamurAIGPT/llm-wiki-agent](https://github.com/SamurAIGPT/llm-wiki-agent)
- [LLM Wiki v2 — rohitg00](https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2)
- [Karpathy's Pattern for an LLM Wiki in Production — Aaron Fulkerson](https://aaronfulkerson.com/2026/04/12/karpathys-pattern-for-an-llm-wiki-in-production/)
- [Anthropic: Claude Code memory](https://code.claude.com/docs/en/memory)
- [OpenAI: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Google: Provide context with GEMINI.md files](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)
- [GitHub: Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)

---

## Related pages
- [[llm-wiki]]
- [[ai-agent-skill]]
