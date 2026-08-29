---
title: git commit — 커밋 생성
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

인덱스(스테이징 영역)의 스냅샷을 저장소에 영구 기록한다.

---

## 1. 기본 사용법

```bash
git commit -m "메시지"          # 메시지 직접 지정
git commit                      # 에디터 열기
git commit -a -m "메시지"       # 추적 파일의 수정/삭제 자동 스테이지 후 커밋 (신규 파일 제외)
git commit -v                   # 에디터에 staged diff 표시
git commit -vv                  # staged + unstaged diff 모두 표시
```

---

## 2. 커밋 수정

### 2.1. `--amend` — 직전 커밋 수정

```bash
git commit --amend              # 메시지 + 내용 변경 (에디터 오픈)
git commit --amend --no-edit    # 메시지 유지, 내용만 추가
git commit --amend -m "새 메시지"
```

`--amend`는 직전 커밋을 새 커밋으로 대체한다. **이미 push한 커밋에 사용하면 force push가 필요**하므로 공유 브랜치에서는 주의한다.

### 2.2. 커밋 메시지 재사용

```bash
git commit -C <SHA>     # 해당 커밋의 메시지·작성자·타임스탬프 그대로 사용
git commit -c <SHA>     # 위와 동일하나 에디터를 열어 편집 가능
```

---

## 3. fixup / squash — 대화형 rebase 연계

`git rebase -i --autosquash`와 함께 사용해 특정 커밋에 변경을 자동 합치는 워크플로우다.

```bash
git commit --fixup=<SHA>         # "fixup! <원본메시지>" 커밋 생성 → rebase 시 내용 합침, 메시지 버림
git commit --fixup=amend:<SHA>   # "amend! <원본메시지>" 커밋 생성 → 내용 + 메시지 교체
git commit --fixup=reword:<SHA>  # 메시지만 교체 (내용 변경 없음)
git commit --squash=<SHA>        # "squash! <원본메시지>" → rebase 시 메시지도 합침
```

적용:
```bash
git rebase -i --autosquash <upstream>
```

---

## 4. Author / Committer

Git은 두 가지 신원을 별도로 저장한다.

| 구분 | 의미 | 환경변수 |
|------|------|---------|
| Author | 코드를 작성한 사람 | `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_AUTHOR_DATE` |
| Committer | 커밋을 저장소에 기록한 사람 | `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL`, `GIT_COMMITTER_DATE` |

```bash
git commit --author="홍길동 <hong@example.com>" -m "외부 기여 반영"
git commit --date="2026-01-01T09:00:00" -m "날짜 지정 커밋"
```

---

## 5. Hooks

커밋 과정에서 순서대로 실행된다.

| Hook | 시점 | 비정상 종료 시 |
|------|------|--------------|
| `pre-commit` | `git commit` 직후 | 커밋 중단 |
| `prepare-commit-msg` | 메시지 템플릿 준비 후 | 커밋 중단 |
| `commit-msg` | 메시지 입력 완료 후 | 커밋 중단 |
| `post-commit` | 커밋 완료 후 | 영향 없음 |

`-n` / `--no-verify`로 `pre-commit`과 `commit-msg` hook을 건너뛸 수 있다.

---

## 6. 주요 설정

```bash
git config commit.verbose true        # 항상 -v 모드
git config commit.template ~/.gitmessage  # 커밋 메시지 템플릿 파일
git config commit.gpgSign true        # 모든 커밋 GPG 서명
```

---

## 7. 실용 패턴

```bash
# staged 내용 확인 후 커밋
git diff --staged
git commit -m "feat: 로그인 API 추가"

# 빠뜨린 파일 추가
git add src/ForgottenFile.java
git commit --amend --no-edit

# fixup 워크플로우
git add -p                         # 일부만 스테이지
git commit --fixup=abc1234
git rebase -i --autosquash HEAD~5  # fixup 자동 정렬 + squash
```

---
## Sources
- [git-commit](https://git-scm.com/docs/git-commit)

---
## Related pages
- [[git-add]]
- [[git-rebase]]
- [[git-reset-revert]]
- [[git-file-states]]
