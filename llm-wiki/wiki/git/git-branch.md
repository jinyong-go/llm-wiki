---
title: git branch — 브랜치 관리
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

브랜치를 생성·삭제·이름 변경·목록 조회하고 upstream 추적 설정을 관리한다. 체크아웃(작업 트리 전환)은 `git switch` 또는 `git checkout`이 담당하며, `git branch`는 **참조(ref) 관리** 전용이다.

---

## 1. 브랜치 목록 조회

```bash
git branch                  # 로컬 브랜치 목록 (현재 브랜치는 * 표시)
git branch -r               # 원격 추적 브랜치 목록
git branch -a               # 로컬 + 원격 모두
git branch -v               # SHA + 커밋 제목 포함
git branch -vv              # upstream 정보까지 포함
git branch --show-current   # 현재 브랜치 이름만 출력 (Detached HEAD이면 빈 출력)
```

### 1.1. -vv 출력 예시

```
* feature/login  a3f1d2e [origin/feature/login: ahead 2] feat: 로그인 구현
  main           9c2b4f1 [origin/main] chore: 의존성 업데이트
  hotfix/null    7d3e8b2 [origin/hotfix/null: gone] fix: NPE 수정
```

- `ahead N` — 로컬이 upstream보다 N개 앞섬 (push 필요)
- `behind N` — upstream이 N개 앞섬 (pull 필요)
- `gone` — upstream 브랜치가 원격에서 삭제됨

### 1.2. 필터링

```bash
git branch --merged          # HEAD에 병합된 브랜치 (삭제 안전)
git branch --no-merged       # HEAD에 병합되지 않은 브랜치
git branch --merged main     # main에 병합된 브랜치

git branch --contains <SHA>  # 특정 커밋을 포함하는 브랜치
git branch -l 'feature/*'   # 패턴 매칭 (--list 필수)
```

### 1.3. 정렬

```bash
git branch --sort=-committerdate   # 최근 커밋순 내림차순
git branch --sort=refname          # 이름순
```

git config로 기본 정렬 설정:
```bash
git config --global branch.sort -committerdate
```

---

## 2. 브랜치 생성

```bash
git branch <name>              # 현재 HEAD에서 생성 (전환 안 함)
git branch <name> <start>      # 특정 커밋/브랜치/태그에서 생성
git branch <name> origin/main  # 원격 브랜치를 기점으로 생성 + upstream 자동 설정
```

생성과 동시에 전환하려면 `git switch`를 사용한다:
```bash
git switch -c <name>           # 생성 + 전환
git switch -c <name> <start>   # 특정 지점에서 생성 + 전환
```

### 2.1. upstream 추적 설정 (`--track`)

```bash
git branch --track feature/login origin/feature/login
# 또는 -t 축약
git branch -t feature/login origin/feature/login
```

`branch.autoSetupMerge=true`(기본값)일 때, 원격 추적 브랜치를 시작점으로 사용하면 upstream이 자동 설정된다.

---

## 3. 브랜치 삭제

```bash
git branch -d <name>     # 안전 삭제 (HEAD 또는 upstream에 병합된 경우만)
git branch -D <name>     # 강제 삭제 (병합 여부 무관)
git branch -d -r origin/feature/old   # 원격 추적 브랜치 삭제 (로컬 참조만 제거)
```

원격 브랜치 자체를 삭제하려면:
```bash
git push origin --delete <name>
```

병합 완료된 브랜치 일괄 삭제 패턴:
```bash
git branch --merged main | grep -v '^\*\|main\|develop' | xargs git branch -d
```

---

## 4. 브랜치 이름 변경

```bash
git branch -m <new-name>            # 현재 브랜치 이름 변경
git branch -m <old-name> <new-name> # 특정 브랜치 이름 변경
git branch -M <new-name>            # 강제 변경 (new-name이 이미 존재해도)
```

원격에 반영하려면 이름 변경 후 push가 필요하다:
```bash
git branch -m old-name new-name
git push origin --delete old-name
git push origin new-name
git branch -u origin/new-name new-name  # upstream 재설정
```

---

## 5. upstream 설정

```bash
# upstream 설정
git branch -u origin/main               # 현재 브랜치의 upstream 설정
git branch --set-upstream-to=origin/main feature/login  # 특정 브랜치 지정

# upstream 해제
git branch --unset-upstream             # 현재 브랜치
git branch --unset-upstream feature/x  # 특정 브랜치
```

upstream 설정 확인:
```bash
git branch -vv          # 모든 브랜치의 upstream 확인
git config branch.<name>.remote   # 원격 이름
git config branch.<name>.merge    # merge 대상 ref
```

---

## 6. 주요 설정 (`git config`)

| 설정 키 | 기본값 | 설명 |
|---------|--------|------|
| `branch.autoSetupMerge` | `true` | 원격 추적 브랜치 기점 시 upstream 자동 설정 |
| `branch.autoSetupRebase` | `never` | pull 시 merge 대신 rebase 사용 여부 |
| `branch.sort` | `refname` | 기본 정렬 기준 |
| `branch.<name>.remote` | — | 해당 브랜치의 추적 원격 이름 |
| `branch.<name>.merge` | — | 추적 대상 ref (예: `refs/heads/main`) |
| `branch.<name>.rebase` | — | pull 시 rebase 여부 (`true`/`merges`/`interactive`) |

---

## 7. 요약 치트시트

```
브랜치 조회
  git branch -vv               현재 + upstream + ahead/behind
  git branch -a                로컬 + 원격 전체
  git branch --merged          삭제 가능 후보
  git branch --sort=-committerdate  최근 활동순

브랜치 생성/전환
  git switch -c <name>         생성 + 전환 (권장)
  git branch <name>            생성만 (전환 없음)

브랜치 삭제
  git branch -d <name>         안전 삭제
  git branch -D <name>         강제 삭제
  git push origin --delete <name>  원격 삭제

이름 변경
  git branch -m <old> <new>

upstream
  git branch -u origin/<name>  upstream 설정
  git branch --unset-upstream  upstream 해제
```

---
## Sources
- [git-branch](https://git-scm.com/docs/git-branch)

---
## Related pages
- [[git-internals]]
- [[git-detached-head]]
- [[git-revisions]]
- [[git-log]]
