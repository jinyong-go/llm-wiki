# wiki-lint report — 2026-10-26 (javascript-common)

- **범위**: `wiki/javascript/common/` 12개 문서 (async-await, commonjs, es-module, fetch-api, function-declaration, lexical-scope, module-system, null-operators, promise, template-literals, truthy-falsy, variable-declaration)
- **결과**: broken links 0건(문서 내 앵커 6건 별도) / 사실 오류·출처 불일치 12건 / 근거 부족 6건 / 구성·양식 개선 다수
- **조치**: 사실 정정(C1–C12, L1) → 구성 개선 → 문체 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크 대상 15개 전부 존재(`cors`, `first-class-citizen`, `tsconfig` 포함). `wiki/index.md`에 12개 문서 모두 등재
- L1: 문서 내 GitHub 방식 앵커 6곳. `promise.md:69` `[§4](#4-체이닝)`, `fetch-api.md:163,182-184`, `lexical-scope.md:97` `[§7.1](#71-with)`. Obsidian에서 동작하지 않을 가능성이 있고 규칙상 `§n` 표기
- 외부 URL 43개 전부 200
- `raw/`에 JavaScript 소스 없음. 전부 웹 출처 의존

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `module-system.md` | §4.3 | 조건 목록은 권장 정의 순서이며 실제 매칭은 `exports` 객체의 키 순서(Node packages: "key order is significant") |
| C2 | `es-module.md` | §4 | "`.js`/`.mjs`/`.cjs` 외 확장자는 `ERR_UNKNOWN_FILE_EXTENSION`" 원문에 없음. JSON(`with { type: 'json' }`)·Wasm·text 모듈 지원 |
| C3 | `commonjs.md` | §5 | "정적 분석 불가능"은 오류. webpack 5는 일부 CommonJS 구문의 미사용 export 제거 지원. 각주("어렵다")와도 불일치 |
| C4 | `async-await.md` | §4 | unhandled rejection은 이미 시작한 Promise를 개별 await할 때 발생(MDN `[await p1, await p2]`). `await taskA(); await taskB();`는 해당 없음 |
| C5 | `async-await.md` | §5.2 | ESLint는 `no-return-await`를 더 이상 권장하지 않음. ECMA-262 변경으로 `return await`가 추가 마이크로태스크를 만들지 않음 |
| C6 | `truthy-falsy.md` | §2·§3 | MDN falsy 목록에 `document.all` 포함. "8가지 고정", "객체는 항상 truthy"와 충돌. `index.md` 서술 동일 |
| C7 | `lexical-scope.md` | §5 | "반환된 세 함수"이나 예시 메서드는 2개 |
| C8 | `function-declaration.md` | §4 | 주석 "괄호 생략 불가" 오류. 조건은 "단순 매개변수 하나"(MDN) |
| C9 | `null-operators.md` | §3 | MDN 내 불일치. Nullish coalescing 문서는 "`||`보다 바로 낮음", Operator precedence 표는 `||`와 `??` 같은 3단계. 각주 필요 |
| C10 | `null-operators.md` | §1 | `null == undefined`는 변환이 아니라 동등 비교 알고리즘의 특수 처리(MDN Equality) |
| C11 | `promise.md` | §5.4 | `AggregateError`는 `errors` 프로퍼티에 배열을 담은 에러 객체 |
| C12 | `module-system.md` | §3 | `import.meta.main` v24.2.0·v22.18.0 추가, Stability 1.0 정보 누락 |

부정확 기술: `promise` §2 "completed라고도 함"(MDN에 없음), `fetch-api` §8 `TypeError: Failed to fetch`는 Chromium 메시지, `fetch-api` §4.3 재사용 불가는 본문이 있는 `Request`만 해당, `lexical-scope` §4 `OuterEnv`는 호출 시 `[[Environment]]`로 설정, `function-declaration` §6 함수 선언문 이름 "필수"(`export default function () {}` 예외)

---

## 3. 근거 부족

- 각주 없는 추론: `es-module` §6.1 "왜 이렇게 동작하는가", `module-system` §4.3 `module-sync`의 hazard 완화, `async-await` §5.2 "실무적으로 낫다", `variable-declaration` §6 "다수 스타일 가이드", `commonjs` §5·`es-module` §8 장단점 전반
- 웹 일반 출처 단독: `async-await` §5.2 map 콜백 await와 스택 트레이스(jojoldu)

---

## 4. 구성·양식

- Sources `[기관: 제목](URL)` 형식 미준수 12개(세 가지 형식 혼재)
- Related pages 설명 부착 7개(module-system, function-declaration, promise, async-await, fetch-api, lexical-scope, variable-declaration)
- 대시 연결 본문 41곳, 본문 화살표 5곳
- 문서 간 반복: module-system §2.2·§4.1 ↔ commonjs §3·§4, es-module §3·§6·§7 / commonjs §2.2 ↔ §3.2 / es-module §2.3 ↔ §3 / null-operators §3 ↔ truthy-falsy §4
- 제목 괄호("(옵셔널 체이닝, 널 병합)", "(백틱)"), 절 제목 영문 괄호
- 서술형 절 제목: fetch-api §7.1, async-await §5.1, function-declaration §3.1
- 볼드 남용, 볼드 소제목(es-module §6.1, commonjs §5, es-module §8)
- 축약어 원어 미병기: CORS, AMD, TLS, DOM
- 빈 줄 중복·누락, "디렉토리"/"디렉터리" 혼용
- `wiki/index.md` 하위 항목 나열 12개
- 관련성 낮은 Related pages: template-literals `[[commonjs]]`, null-operators `[[template-literals]]`
