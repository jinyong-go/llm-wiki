---
title: git log
updated: 2026-10-21 22:52:59
tags:
  - git
  - vcs
---

## 1. 개요

커밋 히스토리를 조회하고 필터링한다. 기본적으로 현재 브랜치의 커밋을 최신순으로 출력한다.

---

## 2. 기본 사용법

```bash
git log                    # 현재 브랜치 전체 이력
git log --oneline          # 한 줄 요약
git log --oneline --graph --all --decorate  # 모든 브랜치 그래프
```

---

## 3. 출력 개수 및 범위 제한

```bash
git log -5                           # 최근 5개
git log -n 10                        # 최근 10개
git log --since="2 weeks ago"        # 최근 2주
git log --since="2026-01-01" --until="2026-03-01"
git log origin..HEAD                 # origin에 없는 내 커밋 (push 전 확인)
git log HEAD..origin                 # 내가 받지 않은 원격 커밋 (pull 전 확인)
git log main..feature/login          # feature/login에 있고 main에 없는 커밋
```

범위 문법(`..`, `...`)은 [[git-revisions]] §8에서 다룬다.

---

## 4. 작성자·메시지 필터링

```bash
git log --author="홍길동"
git log --author="hong\|kim"          # 정규식: hong 또는 kim
git log --committer="jenkins"

git log --grep="fix"                  # 메시지에 fix 포함
git log --grep="JIRA-123"
git log -i --grep="hotfix"            # 대소문자 무시
git log --grep="feat" --grep="api" --all-match  # 두 패턴 모두 만족
git log --invert-grep --grep="WIP"    # WIP 제외

# 파일 내용 변경 기준 검색
git log -S "UserService"              # 문자열의 등장 횟수가 바뀐 커밋 (추가·삭제)
git log -G "TODO.*refactor"           # 변경된 줄에 정규식 일치
```

---

## 5. 머지 커밋 처리

```bash
git log --no-merges                   # 머지 커밋 제외
git log --merges                      # 머지 커밋만
git log --first-parent                # 첫 번째 부모만 따라감 (main 브랜치 흐름만)
```

`--first-parent`는 feature 브랜치의 개별 커밋을 숨기고 main에 머지된 시점만 보여준다. 릴리즈 이력을 파악할 때 유용하다.

---

## 6. 특정 파일 이력

```bash
git log -- src/UserService.java       # 파일 이력 (삭제된 파일도 포함)
git log -p -- src/UserService.java    # 변경 내용(diff) 포함
git log --follow -- src/User.java     # 파일명 변경 이전 이력까지 추적
git log -L 10,30:src/UserService.java # 10~30번째 줄의 변경 이력
git log -L :parseToken:src/Auth.java  # 함수/메서드 변경 이력
```

---

## 7. 변경 내용 포함 출력

```bash
git log -p                  # 각 커밋의 diff 포함
git log --stat              # 파일별 변경 줄 수 통계
git log --shortstat         # 통계 한 줄 요약
git log --name-only         # 변경된 파일명만
git log --name-status       # 파일명 + 변경 유형(A/M/D/R)
```

---

## 8. 출력 형식

### 8.1. 기본 제공 형식

```bash
git log --oneline           # <단축SHA> <제목>
git log --pretty=short      # 제목 + 저자
git log --pretty=medium     # 기본값. 날짜 포함
git log --pretty=full       # 커미터 정보 포함
git log --pretty=fuller     # 작성자/커밋 날짜 모두
git log --pretty=raw        # 내부 객체 원문
```

### 8.2. `--format` 플레이스홀더

```bash
git log --pretty=format:"<형식 문자열>"
```

| 플레이스홀더 | 출력 |
|-------------|------|
| `%H` | 전체 커밋 해시 |
| `%h` | 단축 커밋 해시 |
| `%T` / `%t` | 트리 해시 (전체/단축) |
| `%P` / `%p` | 부모 커밋 해시 (전체/단축) |
| `%an` | 작성자 이름 |
| `%ae` | 작성자 이메일 |
| `%ad` | 작성자 날짜 (`--date=` 형식 적용) |
| `%ar` | 작성자 날짜 (상대, e.g. "3 days ago") |
| `%as` | 작성자 날짜 (YYYY-MM-DD) |
| `%cn` / `%ce` | 커미터 이름 / 이메일 |
| `%cr` | 커밋 날짜 (상대) |
| `%s` | 제목 (첫 번째 줄) |
| `%b` | 본문 (제목 이후) |
| `%d` | 브랜치/태그 데코레이션 `(HEAD -> main)` |
| `%n` | 줄바꿈 |

자주 쓰는 형식:

```bash
# 단축 해시 + 작성자 + 상대 날짜 + 제목
git log --pretty=format:"%h  %an  %ar  %s"

# 컬러 포함 상세 포맷
git log --pretty=format:"%Cred%h%Creset %C(yellow)%d%Creset %s %Cgreen(%ar)%Creset %C(bold blue)<%an>%Creset"

# CSV 출력 (스크립트 파싱용)
git log --pretty=format:"%H,%as,%an,%s" --no-merges
```

### 8.3. `--date`

```bash
git log --date=relative    # "2 hours ago"
git log --date=short       # "2026-05-13"
git log --date=iso         # "2026-05-13 17:11:20 +0900"
git log --date=unix        # Unix timestamp
```

### 8.4. alias

[[git-config]] §4.9의 alias로 자주 쓰는 형식을 등록한다.

```bash
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.ll "log --pretty=format:'%h %as %an %s' --no-merges"
git config --global alias.lf "log --pretty=fuller --stat"
```

---

## 9. 그래프 시각화

```bash
git log --oneline --graph --all --decorate
```

```
* 3f2a1b4 (HEAD -> main) feat: 로그인 API 추가
| * 9c4d2e1 (feature/signup) feat: 회원가입 구현
|/
* 7a1b3c5 (origin/main) chore: 의존성 업데이트
* 2d4e6f8 fix: NPE 수정
```

`--all`은 모든 브랜치, `--decorate`는 브랜치/태그 이름을 표시한다.

---

## Sources
- [git-log](https://git-scm.com/docs/git-log)

---

## Related pages
- [[git-revisions]]
- [[git-file-states]]
- [[git-internals]]
