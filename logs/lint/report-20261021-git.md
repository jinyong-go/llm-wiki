# wiki-lint report — 2026-10-21 (git)

- **범위**: `wiki/git/` 18개 문서 (git-add, git-branch, git-clone, git-commit, git-config, git-detached-head, git-fetch-pull-push, git-file-states, git-init, git-internals, git-log, git-merge, git-rebase, git-reset-revert, git-revisions, git-stash, git-switch-restore, git-tag)
- **결과**: broken links 0건 / 사실 오류·출처 불일치 10건 / 설정 예시 오류 2건 / 다이어그램·예시 오류 6건 / 근거 부족 1건 / 구성·양식 개선 다수
- **조치**: 오류(C1–C18) → 구성 개선 → 문체·양식 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- 위키링크: `[[...]]` 61개 대상 전부 존재. 깨짐 0건
- `wiki/index.md`에 18개 문서 모두 등재
- 외부 출처 URL 24개(git-scm.com) 전부 200
- `raw/`에 git 관련 소스 없음. 전 문서가 웹 공식 문서에만 의존

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `git-fetch-pull-push.md` | §2.1·§2.5 | `git pull` 기본을 fetch + merge로, diverged 시 "방법 1: merge(머지 커밋 생성)"로 서술. git-pull 문서는 조정 방식 미지정 시 `--ff-only`가 기본이며 diverged면 실패 |
| C2 | `git-detached-head.md` | §4.3 | "reflog는 기본 90일 보존". Detached HEAD에서 잃은 커밋은 unreachable이므로 `gc.reflogExpireUnreachable` 기본 30일 적용 |
| C3 | `git-file-states.md` | §2.1 | `D  deleted.txt`를 "스테이징 안 됨"으로 서술. 첫 컬럼 `D`는 "deleted from index"(스테이징됨), 미스테이징 삭제는 ` D` |
| C4 | `git-file-states.md` | §2.2 | "`git diff`는 스테이징된 내용이 없으면 아무것도 출력하지 않는다". 실제로는 unstaged 변경이 없을 때 빈 출력 |
| C5 | `git-tag.md` | §1 | `git log --tags`도 annotated tag만 대상으로 서술. git-tag 문서는 `git describe`만 예시. `--tags`는 `refs/tags` 전체 |
| C6 | `git-fetch-pull-push.md`, `git-tag.md` | §3.5, §5 | `--follow-tags`를 "현재 커밋에 연관된 annotated 태그"로 서술. 실제는 push되는 ref에서 도달 가능하고 원격에 없는 annotated 태그 |
| C7 | `git-switch-restore.md` | §2.5 | `git checkout HEAD~2 <file>` ≡ `git restore --source HEAD~2 <file>`. checkout(tree-ish 지정)은 인덱스도 갱신하므로 `--staged --worktree` 필요 |
| C8 | `git-init.md` | §3.1 | 기본 브랜치 `master`. 공식 문서는 Git 3.0에서 `main`으로 변경 예정 명시 |
| C9 | `git-branch.md` | §3 | `-d` 조건 "HEAD 또는 upstream". 실제는 upstream 기준, upstream 미설정 시 HEAD 기준 |
| C10 | `git-clone.md` | §6 | `--single-branch` 후 다른 브랜치를 "fetch로 가져올 수 없다". 문서는 이후 fetch가 해당 브랜치만 갱신한다고만 명시. refspec 지정 fetch로 가능 |

---

## 3. 설정 예시 오류

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C11 | `git-config.md` | §3.11 | `https.proxy`는 git-config에 없는 키. `http.proxy`가 HTTPS에도 적용 |
| C12 | `git-config.md` | §3.10 | `merge.tool intellij`는 내장 값이 아님. 그 외 값은 custom tool로 취급되어 `mergetool.<tool>.cmd` 필요 |

---

## 4. 다이어그램·예시 오류

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C13 | `git-revisions.md` | §5 | `HEAD~2^2 = H` 오류. 해당 그래프에서 D = `HEAD^`이므로 H = `HEAD^^2` = `HEAD~1^2` |
| C14 | `git-revisions.md` | §7.2 | X가 main 전용이므로 `feature..main` = X, Y, Z. `main...feature`에도 X 누락 |
| C15 | `git-rebase.md` | §1.1 | merge 결과에 `D'`, `E'` 표기. merge는 커밋을 재작성하지 않음 |
| C16 | `git-reset-revert.md` | §4 | `reset --soft HEAD~1` 후 `add -p`로 분리하는 예시. 전부 staged 상태라 두 번째 커밋 실패. `--mixed` 필요 |
| C17 | `git-reset-revert.md` | §2.1.3 | `--hard`로 잃은 미커밋 변경을 reflog로 복구 가능하다고 서술. reflog는 ref 이동만 기록하므로 복구 불가 |
| C18 | `git-init.md` | §6 | `echo "target/\n..."`는 bash에서 `\n`을 해석하지 않음. `printf` 필요 |

---

## 5. 근거 부족

| # | 파일 | 내용 |
|---|---|---|
| W1 | `git-internals.md` §3–§5 | `.git` 구조·객체·SHA-1 서술이 출처(Pro Git 1.3)에 없음. Pro Git "Git Internals" 장 추가 필요 |

---

## 6. 구성·양식

- 제목 대시 연결: 대부분 문서 `title: git xxx — 설명`
- 요약 절: `git-branch.md` §7, `git-detached-head.md` §6, `git-file-states.md` §5
- 중복: `git-config.md` §1·§6 우선순위, `git-file-states.md` §1.1·`git-internals.md` §2.1 상태 표
- 각주 없는 주장: rebase 권장(`git-fetch-pull-push.md` §2.2), histogram 가독성(`git-config.md` §3.12)
- `git-detached-head.md` §2.5 제목과 본문 불일치
- 본문 화살표 사용: `git-clone.md` §1 등
