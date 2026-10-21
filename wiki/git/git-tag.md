---
title: git tag
updated: 2026-10-21 22:52:59
tags:
  - git
  - vcs
---

## 1. 개요

특정 커밋에 이름을 붙인다. 주로 릴리즈 버전을 표시하는 데 사용한다.

---

## 2. Lightweight vs Annotated

| 구분 | 생성 방법 | 저장 내용 | 용도 |
|------|----------|----------|------|
| Lightweight | `-a`/`-m` 없이 생성 | 커밋 SHA만 가리키는 포인터 | 임시·개인 레이블 |
| Annotated | `-a` 또는 `-m` 지정 | 작성자·날짜·메시지·옵션 GPG 서명 포함 | 릴리즈 버전 |

`git describe` 등 객체 이름을 붙이는 일부 명령은 기본적으로 lightweight tag를 무시한다.

```bash
git tag v1.0.0                    # lightweight
git tag -a v1.0.0 -m "Release 1.0.0"  # annotated
```

---

## 3. 태그 생성

```bash
git tag <name>                     # 현재 HEAD에 lightweight 태그
git tag <name> <commit>            # 특정 커밋에 태그
git tag -a <name> -m "<msg>"       # annotated 태그
git tag -a <name> -F CHANGELOG.md  # 파일에서 메시지 읽기
git tag -s <name> -m "<msg>"       # GPG 서명 태그
git tag -f <name>                  # 기존 태그 덮어쓰기
```

---

## 4. 태그 조회

```bash
git tag                            # 전체 목록 (알파벳순)
git tag -l "v1.*"                  # 패턴 매칭
git tag -n1                        # annotated 태그 메시지 첫 줄 포함

git show v1.0.0                    # 태그 상세 + 커밋 diff
git tag --contains HEAD            # HEAD를 포함하는 태그
git tag --merged main              # main에서 도달 가능한 태그
```

### 4.1. 버전순 정렬

```bash
git tag --list --sort=version:refname
# v1.0.0
# v1.2.0
# v1.10.0   ← 사전순이면 v1.2.0 뒤에 오지만 버전순으로 올바르게 정렬됨

git tag --list --sort=-version:refname  # 내림차순
```

기본 정렬 설정:
```bash
git config --global tag.sort version:refname
```

---

## 5. 로컬 태그 삭제

```bash
git tag -d v1.0.0                  # 로컬 태그 삭제
```

---

## 6. 원격 태그

```bash
git push origin v1.0.0             # 특정 태그 push
git push origin --tags             # 모든 로컬 태그 push
git push origin --follow-tags      # push되는 ref에서 도달 가능하고 원격에 없는 annotated 태그도 push

git fetch --tags                   # 원격 태그 fetch
git push origin --delete v1.0.0    # 원격 태그 삭제
```

---

## 7. 태그 서명 검증

```bash
git tag -v v1.0.0
```

---

## 8. 실용 패턴

```bash
# 릴리즈 태그 생성 및 push
git tag -a v2.1.0 -m "Release 2.1.0: 결제 모듈 추가"
git push origin v2.1.0

# 과거 커밋에 태그 붙이기
git tag -a v1.9.0 abc1234 -m "Hotfix release"

# 모든 태그 목록을 버전순으로 확인
git tag -l --sort=-version:refname | head -5

# 최신 태그 확인
git describe --tags --abbrev=0

# 태그 기준 diff
git diff v1.0.0 v2.0.0
git log v1.0.0..v2.0.0 --oneline
```

---

## Sources
- [git-tag](https://git-scm.com/docs/git-tag)

---

## Related pages
- [[git-log]]
- [[git-revisions]]
- [[git-internals]]
