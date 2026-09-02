---
title: OKF (Open Knowledge Format)
updated: 2026-07-08 10:32:15
tags:
  - ai
  - knowledge-format
  - markdown
  - spec
---

## 1. 개요

OKF(Open Knowledge Format)는 *knowledge* — 데이터·시스템을 둘러싼 메타데이터, 맥락, 큐레이션된 통찰 — 를 표현하기 위한 개방형 포맷이다. 사람과 AI 에이전트가 모두 작성·소비하도록 설계되었으며, 조직 간 교환을 목표로 한다.

현재 버전은 **0.1 (Draft)** 이다.

구조는 의도적으로 최소화되어 있다: **YAML frontmatter를 가진 마크다운 파일의 디렉터리**. 스키마 레지스트리, 중앙 권한, 필수 툴링이 없다. `cat`으로 파일을 읽을 수 있으면 OKF를 읽을 수 있고, `git clone`이 되면 배포할 수 있다.

이 위키(`llm-wiki`) 자체가 OKF가 참조하는 "LLM wiki" 패턴(마크다운 + frontmatter 기반 에이전트 가독 지식베이스)과 동일 계열이다.

## 2. 동기와 목표

OKF는 지식이 다음 속성을 갖는 일반적·확립된 포맷으로 표현되어야 한다는 입장을 취한다.

- **Readable** — 툴 없이 사람이 읽음
- **Parseable** — 전용 SDK 없이 에이전트가 파싱함
- **Diffable** — 버전 관리에서 diff 가능
- **Portable** — 툴·조직·시간을 넘어 이식 가능

**Goals**

1. enrichment agent가 써넣을 보편 포맷 정의
2. consumption agent의 읽기·순회 방식 안내
3. 시스템·조직 간 지식 교환 촉진
4. 의미 있는 소비에 필요한 최소 **필수** 필드 표준화

**Non-goals**

- 고정된 개념 분류체계(taxonomy) 정의
- 저장·서빙·쿼리 인프라 규정
- 도메인 스키마(Avro, Protobuf, OpenAPI 등) 대체 — OKF는 이를 *참조*할 뿐 포섭하지 않음

## 3. 용어

| 용어 | 정의 |
|---|---|
| **Knowledge Bundle** | 자기완결적·계층적 지식 문서 모음. 배포의 단위 |
| **Concept** | 번들 내 지식 단위. 마크다운 문서 1개. 유형 자산(테이블, API)·추상 개념(지표, 비즈니스 프로세스) 모두 표현 가능 |
| **Concept ID** | 번들 내 파일 경로에서 `.md` 접미사 제거 (예: `tables/users.md` → `tables/users`) |
| **Frontmatter** | 파일 최상단에 `---`로 구분된 YAML 메타데이터 블록 |
| **Body** | frontmatter 이후 전체 내용 |
| **Link** | 개념 간 표준 마크다운 링크. 계층(부모/자식) 외 관계 표현 |
| **Citation** | 본문 주장을 뒷받침하는 외부 출처로의 링크 |

## 4. 번들 구조

번들은 마크다운 파일의 디렉터리 트리이다. 디렉터리 구조는 도메인과 독립적이며 producer가 자유롭게 구성한다.

```
path/to/bundle/
├── index.md          # 선택. progressive disclosure용 디렉터리 목록
├── log.md            # 선택. 변경 이력
├── <concept>.md      # 번들 루트의 개념
└── <subdirectory>/   # 개념을 그룹화하는 하위 디렉터리
    ├── index.md
    ├── <concept>.md
    └── <subdirectory>/
```

배포 방식: git 저장소(권장 — 이력·기여자·diff 제공) / tarball·zip 아카이브 / 더 큰 저장소의 하위 디렉터리.

### 4.1. 예약 파일명

다음 파일명은 계층의 모든 레벨에서 정해진 의미를 가지며 개념 문서로 사용할 수 없다. 그 외 모든 `.md`는 개념 문서이다.

| 파일명 | 용도 |
|---|---|
| `index.md` | 디렉터리 목록 |
| `log.md` | 변경 이력 |

태그별 집계 파일 포맷은 규정하지 않는다. 태그 브라우징 뷰가 필요한 producer는 소비 시점에 frontmatter를 스캔해 합성한다.

## 5. 개념 문서

모든 개념은 UTF-8 마크다운 파일이며 (1) YAML frontmatter 블록과 (2) 마크다운 body로 구성된다.

### 5.1. Frontmatter

```yaml
---
type: <Type name>              # REQUIRED
title: <표시 이름>              # 선택
description: <한 줄 요약>       # 선택
resource: <자산 정규 URI>      # 선택
tags: [<tag>, <tag>, …]        # 선택
timestamp: <ISO 8601 datetime> # 선택. 최종 수정 시각
# … 그 외 producer 정의 키/값
---
```

- **필수: `type`** — 개념 종류를 식별하는 짧은 문자열. consumer의 라우팅·필터링·표현에 사용 (예: `BigQuery Table`, `API Endpoint`, `Metric`, `Playbook`, `Reference`). 중앙 등록이 없으므로 producer는 서술적인 값을 선택하고, consumer는 미지의 type을 graceful하게(일반 개념으로) 처리해야 한다(MUST).
- **권장(우선순위순):** `title`(없으면 파일명에서 유도 가능) → `description`(한 문장 요약) → `resource`(자산 식별 URI, 추상 개념엔 없음) → `tags` → `timestamp`(ISO 8601).
- **확장:** producer는 임의 키를 추가할 수 있다. consumer는 round-trip 시 미지 키를 보존하고(SHOULD), 미인식 필드가 있다고 문서를 거부해선 안 된다(SHOULD NOT).

### 5.2. Body

표준 마크다운. 사람의 가독성과 에이전트 검색을 모두 돕기 위해 산문보다 구조적 마크다운(헤딩·리스트·표·코드 블록)을 선호한다. 필수 섹션은 없으나 다음 헤딩은 관용적 의미를 가진다.

| 헤딩 | 용도 |
|---|---|
| `# Schema` | 자산의 컬럼/필드에 대한 구조적 설명 |
| `# Examples` | 구체적 사용 예시 (주로 코드 블록) |
| `# Citations` | 본문 주장의 외부 출처 |

## 6. 크로스링킹

개념 간 연결은 표준 마크다운 링크 두 형태를 지원한다.

- **절대(번들 상대) 링크** — `/`로 시작, 번들 루트 기준. `[customers table](/tables/customers.md)`. 하위 디렉터리 내 문서 이동에 안정적이라 **권장**.
- **상대 링크** — 표준 마크다운 상대 경로. `[neighboring](./other.md)`.

링크 의미론: A→B 링크는 *관계*를 주장하며, 관계의 종류(부모/자식, references, joins-with, depends-on 등)는 링크가 아니라 주변 산문으로 전달된다. 그래프 뷰를 만드는 consumer는 보통 모든 링크를 untyped 관계의 방향성 간선으로 취급한다. consumer는 **broken link를 허용해야 한다(MUST)** — 대상이 없는 링크는 오류가 아니라 아직 작성되지 않은 지식일 수 있다.

## 7. index / log / citations 파일

- **`index.md`** — 디렉터리 내용을 열거해 progressive disclosure를 지원한다. frontmatter가 없다(예외: 번들 루트의 `okf_version` 선언만 허용). body는 섹션별로 `* [Title](url) - 설명` 목록을 둔다. 항목 설명은 링크된 개념의 frontmatter `description`을 포함하는 것이 좋다(SHOULD). producer가 자동 생성하거나 consumer가 없을 때 즉석 합성할 수 있다.
- **`log.md`** — 해당 스코프의 변경 이력. ISO 8601 `YYYY-MM-DD` 날짜 헤딩을 최신순으로 두고, 각 항목은 산문이다. 선행 볼드 단어(`**Update**`, `**Creation**`, `**Deprecation**` 등)는 관례이지 필수가 아니다.
- **`# Citations`** — 본문이 외부 자료에 근거한 주장을 할 때, 문서 하단에 번호 매긴 출처 목록으로 둔다(SHOULD). 링크는 절대 URL, 번들 상대 경로, 또는 외부 자료를 일급 개념으로 미러링한 `references/` 하위 경로일 수 있다.

## 8. 적합성 (Conformance)

번들이 OKF v0.1에 **적합**하려면:

1. 트리의 모든 비예약 `.md` 파일이 파싱 가능한 YAML frontmatter 블록을 포함한다.
2. 모든 frontmatter 블록이 비어있지 않은 `type` 필드를 포함한다.
3. 예약 파일명(`index.md`, `log.md`)이 존재할 때 규정 구조를 따른다.

그 외 제약은 모두 soft guidance이다. 특히 consumer는 다음 이유로 번들을 거부해선 안 된다(MUST NOT): 선택 frontmatter 필드 누락 / 미지 `type` 값 / 미지 추가 키 / broken 크로스링크 / `index.md` 누락. 이 관대한 소비 모델은 번들이 성장·리팩터·부분 자동생성되어도 유용하게 남도록 의도된 것이다.

## 9. 버전 관리

버전은 `<major>.<minor>` 형식이다. **minor** 증가는 하위호환 추가(새 선택 필드, 새 관용 섹션 헤딩), **major** 증가는 파괴적 변경(필수 필드 개명, 예약 파일명 변경)을 의미한다. 번들은 루트 `index.md` frontmatter에 `okf_version: "0.1"`을 선언할 수 있다. 선언된 버전을 모르는 consumer는 번들을 거부하기보다 best-effort 소비를 시도해야 한다(SHOULD).

## 10. 다른 포맷과의 관계

OKF는 여러 확립된 패턴과 의도적으로 가깝다: 마크다운+frontmatter를 에이전트 가독 지식베이스로 쓰는 **LLM "wiki" 저장소**, 계층적 마크다운과 크로스링크를 쓰는 **Obsidian·Notion** 같은 개인 지식 도구, 카탈로그 메타데이터를 별도 레지스트리가 아닌 소스 코드 옆에 저장하는 **"metadata as code"** 접근. 차이는 OKF가 툴링을 강제하지 않으면서 상호운용에 필요한 최소 규칙만 **명세화(specified)** 했다는 점이다.

---

## Sources
- [knowledge-catalog/okf/SPEC.md](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)

---

## Related pages
- [[git-internals]] — 권장 배포 매체인 git 저장소의 내부 모델
- [[llm-wiki]] — OKF가 참조하는 LLM wiki 패턴의 구현 예시
