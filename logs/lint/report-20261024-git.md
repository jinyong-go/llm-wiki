# wiki-lint report — 2026-10-24 (git)

- **범위**: `wiki/git/` 18개 문서
- **결과**: broken links 0건 / 사실 오류·출처 불일치 9건 / 예시 오류 5건 / 문서 간 불일치 2건 / 근거 부족 5건 / 경미·구성·양식 9건
- **이전 보고서**: `report-20261021-git` C1–C18, W1 반영 확인
- **조치**: 사실 정정(C·E·I·W) → 구성 개선 → 문체·양식 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크: `[[...]]` 대상 전부 존재. 깨짐 0건
- `wiki/index.md`에 18개 문서 모두 등재
- 외부 출처 URL 31개(git-scm.com) 전부 200. 200이 아닌 URL은 코드 블록 내 예시 URL뿐
- `raw/`에 git 관련 소스 없음

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `git-init.md` | §5 | 템플릿에 `.gitignore`를 넣으면 신규 저장소에 복사된다고 서술. 템플릿 파일은 `$GIT_DIR`로 복사되며 점으로 시작하는 파일은 복사되지 않음 |
| C2 | `git-tag.md` | §4.1 | "사전순이면 v1.10.0이 v1.2.0 뒤". 사전순에서는 앞(`v1.0.0, v1.10.0, v1.2.0`) |
| C3 | `git-fetch-pull-push.md` | §2.4 | `--prune-tags` 단독 예시. `--prune`이 활성화된 경우에만 동작 |
| C4 | `git-add.md` | §3.1 | `a`/`d` 범위 "이후 모두". 실제 범위는 같은 파일의 이후 hunk |
| C5 | `git-clone.md` | §4.2 | `-b <tag>`는 체크아웃 브랜치만 달라진다고 서술. 태그 지정 시 HEAD가 detached 상태 |
| C6 | `git-config.md` | §4.1 | `user.useConfigOnly` 예시가 global email을 함께 설정. 문서 시나리오는 global에 name만 두는 경우이며 global email이 있으면 효과 없음 |
| C7 | `git-revisions.md` | §7.4 | `git diff @{u}`를 "push 안 된 변경"으로 서술. 작업 트리와 upstream 비교이므로 미커밋 변경·upstream 전용 변경 포함. `git diff @{u}...HEAD` 필요 |
| C8 | `git-merge.md` | §5 | `--abort`를 "완전 복구"로 서술. 문서는 "try to reconstruct"이며 미커밋 변경은 복원 불가할 수 있음 명시 |
| C9 | `git-reset-revert.md` | §2.2 | `git reset HEAD~1 -- file`을 unstage로 서술. 인덱스를 HEAD~1 버전으로 설정 |

---

## 3. 예시 오류

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| E1 | `git-stash.md` | §8 | `stash push --staged` 직후 `git commit`. 스테이징 내용이 스태시로 이동해 커밋 대상 없음 |
| E2 | `git-detached-head.md` | §4.3 | reflog 예시 SHA 불일치(`checkout ... to a3f1d2e` 줄의 SHA가 `9c2b4f1`, 이후 commit도 `a3f1d2e`). main 복귀 checkout 항목 누락 |
| E3 | `git-file-states.md` | §5 | `.gitignore` 패턴 뒤 `# 주석`. 주석은 줄 시작 `#`만 인정. `!lib.a`의 전제 `*.a` 누락 |
| E4 | `git-file-states.md` | §4.4 | `.gitignore` 수정 후 `git add .gitignore` 없이 커밋 |
| E5 | `git-merge.md` | §4.2 | diff3 공통 조상 내용을 `|||||||` 마커 줄에 표기. 실제로는 마커 다음 줄부터 내용 |

---

## 4. 문서 간 불일치

| # | 위치 | 내용 |
|---|---|---|
| I1 | `git-internals.md` §6, `git-revisions.md` §2·§10.1 | 단축 SHA 길이 "7~8자"/"6~7자"/"최소 4자" 혼재. gitrevisions 기준은 저장소 내 고유한 앞부분 |
| I2 | `git-revisions.md` §4, `git-reset-revert.md` §3.1 | `HEAD~3` = "3개 전 커밋"과 `HEAD~2` = "3번째 전 커밋" 계수 방식 불일치 |

---

## 5. 근거 부족

| # | 위치 | 내용 |
|---|---|---|
| W1 | `git-config.md` §4.11 | `http.<url>.proxy ""` 해제. 빈 문자열 해제는 `remote.<name>.proxy`에만 명시 |
| W2 | `git-config.md` §4.8 | credential helper(cache, store) 출처 미기재 |
| W3 | `git-reset-revert.md` §3.3 | revert의 revert 절차 출처(revert-a-faulty-merge How-To) 미기재 |
| W4 | `git-detached-head.md`, `git-merge.md` §7, `git-tag.md` §6 | git-checkout·git-switch·git-push 출처 미기재 |
| W5 | `git-revisions.md` §7.2 | `main@{"2026-01-01"}`은 로컬 reflog 기반. 기본 보존 90일을 넘어 만료됐을 가능성(추론) |

---

## 6. 경미·구성·양식

- `git-stash.md` L138–140 `---` 중복
- `git-file-states.md` §6 상태 전환 표가 §2와 중복
- `git-log.md` §8.4 `alias.lg`가 `git-config.md` §4.9와 중복
- `git-merge.md` §3.1 `-X patience`는 deprecated 동의어
- `git-tag.md` §8 `git describe --tags --abbrev=0`은 HEAD에서 도달 가능한 가장 가까운 태그
- `git-branch.md` §4 일괄 삭제 grep이 main·develop 부분 문자열 포함 브랜치까지 제외
- `git-internals.md` §5.2, `git-rebase.md` §4.2 예시 SHA가 16진수 아님
- `git-add.md` Sources에 미사용 git-restore
- `git-detached-head.md` §4.4 코드 주석 대시 연결
