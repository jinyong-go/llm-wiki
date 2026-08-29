---
title: git fetch / pull / push — 원격 저장소 동기화
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

원격 저장소와 로컬 저장소를 동기화하는 3개 명령어.

| 명령어 | 방향 | 로컬 변경 |
|--------|------|----------|
| `fetch` | 원격 → 로컬 | 원격 추적 브랜치만 갱신 (워킹 트리 불변) |
| `pull` | 원격 → 로컬 | fetch + merge (또는 rebase) |
| `push` | 로컬 → 원격 | 원격 ref 업데이트 |

---

# git fetch

원격 커밋·ref를 다운로드한다. 로컬 브랜치와 워킹 트리는 변경하지 않는다.

## 1. 기본 사용

```bash
git fetch origin              # 기본 원격 fetch
git fetch origin main         # 특정 브랜치만 fetch
git fetch --all               # 모든 원격 fetch
git fetch --dry-run           # 실제 다운로드 없이 동작 확인
```

## 2. refspec

```bash
# +<src>:<dst> 형식 — + 는 fast-forward가 아니어도 강제 업데이트
git fetch origin main:refs/remotes/origin/main
git fetch origin '+refs/heads/*:refs/remotes/origin/*'
```

## 3. 태그 처리

```bash
git fetch --tags              # 원격 태그 전체 fetch
git fetch --no-tags           # 태그 제외
```

기본값: fetch한 커밋이 가리키는 태그만 함께 가져온다.

## 4. prune — 삭제된 원격 ref 정리

```bash
git fetch --prune             # 원격에서 삭제된 브랜치 ref 정리
git fetch --prune-tags        # 원격에서 삭제된 태그도 정리

# 설정으로 기본값 변경
git config --global fetch.prune true
```

## 5. shallow clone 연계

```bash
git fetch --depth=10          # 최근 10개 커밋까지만 fetch
git fetch --unshallow         # shallow → full 전환
```

## 6. FETCH_HEAD

fetch 직후 `FETCH_HEAD`에 가져온 ref 목록이 기록된다.

```bash
git merge FETCH_HEAD          # fetch한 내용을 현재 브랜치에 머지
git log FETCH_HEAD            # fetch한 이력 확인
```

---

# git pull

`git fetch` + `git merge` (또는 `git rebase`)를 순서대로 실행한다.

## 7. 기본 사용

```bash
git pull                      # upstream fetch + merge
git pull origin main          # 원격/브랜치 명시
```

## 8. --rebase — 선형 이력 유지

```bash
git pull --rebase             # fetch + rebase
git pull --rebase=interactive # fetch + interactive rebase

# 기본값으로 설정 (권장)
git config --global pull.rebase true
```

merge pull은 머지 커밋을 생성해 이력이 복잡해진다. rebase pull은 선형 이력을 유지한다.

## 9. --ff-only — 안전한 pull

```bash
git pull --ff-only            # fast-forward 가능할 때만 진행, 불가 시 중단

# 기본값으로 설정
git config --global pull.ff only
```

diverged 상태에서 실수로 머지 커밋을 만드는 것을 방지한다.

## 10. --no-commit / --squash

```bash
git pull --no-commit          # 머지까지만 하고 커밋은 직접 생성
git pull --squash             # fetch한 커밋을 하나로 합쳐 스테이지에 올림
```

## 11. diverged 브랜치 처리

로컬과 원격이 각각 커밋을 가진 경우:

```bash
# 방법 1: merge (머지 커밋 생성)
git pull

# 방법 2: rebase (선형 이력 유지, 권장)
git pull --rebase

# 방법 3: fast-forward만 허용 (diverged 시 에러로 명시적 판단 유도)
git pull --ff-only
```

## 12. 주요 설정

```bash
git config pull.rebase true   # pull = fetch + rebase
git config pull.ff only       # ff 불가 시 중단
```

---

# git push

로컬 ref를 원격 저장소로 업로드한다.

## 13. 기본 사용

```bash
git push origin main          # 원격/브랜치 명시
git push                      # upstream 설정된 경우 생략 가능
```

## 14. -u / --set-upstream

```bash
git push -u origin main       # push + upstream 등록 (최초 1회)
# 이후 git push / git pull 만으로 동작
```

## 15. refspec

```bash
git push origin main:feature  # 로컬 main → 원격 feature로 push
git push origin :old-branch   # 원격 브랜치 삭제 (빈 src)
git push origin --delete old-branch  # 원격 브랜치 삭제 (명시적)
```

## 16. 강제 push

```bash
git push --force                  # 원격 이력 덮어쓰기 ⚠️
git push --force-with-lease       # 원격에 다른 사람 커밋 없을 때만 강제 push (권장)
git push --force-with-lease=main  # 특정 브랜치만 lease 확인
```

`--force-with-lease`: push 전 원격 ref가 로컬 추적 브랜치와 일치하는지 확인한다. 다른 사람의 커밋을 덮어쓰는 사고를 방지한다.

## 17. 태그 push

```bash
git push origin v1.0.0            # 특정 태그 push
git push origin --tags            # 모든 로컬 태그 push
git push origin --follow-tags     # 현재 커밋에 연관된 annotated 태그만 push (권장)
```

## 18. --dry-run

```bash
git push --dry-run                # 실제 push 없이 동작 확인
```

## 19. push.default 설정

| 값 | 동작 |
|----|------|
| `simple` | upstream과 이름이 같을 때만 push (기본값, Git 2.0+) |
| `current` | 동일 이름의 원격 브랜치로 push (upstream 불필요) |
| `upstream` | upstream으로 push (이름 달라도 허용) |
| `matching` | 로컬·원격에 동일 이름 브랜치가 모두 있으면 전부 push ⚠️ |
| `nothing` | refspec 명시 강제 |

```bash
git config --global push.default simple
```

---

## 20. 실용 패턴

```bash
# 새 브랜치 push + upstream 등록
git switch -c feature/payment
git push -u origin feature/payment

# rebase 후 강제 push (공유 브랜치 주의)
git rebase main
git push --force-with-lease

# 원격 브랜치 삭제
git push origin --delete feature/old

# 최신 원격 상태 확인 후 fast-forward pull
git fetch --prune
git pull --ff-only

# 원격 태그 제거
git push origin --delete v1.0.0-rc
```

---

## Sources
- [git-fetch](https://git-scm.com/docs/git-fetch)
- [git-pull](https://git-scm.com/docs/git-pull)
- [git-push](https://git-scm.com/docs/git-push)

---
## Related pages
- [[git-branch]]
- [[git-merge]]
- [[git-rebase]]
- [[git-tag]]
- [[git-clone]]
