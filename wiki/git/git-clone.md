---
title: git clone — 저장소 복제
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

원격(또는 로컬) 저장소를 로컬에 복제한다. 전체 히스토리와 모든 브랜치를 포함한 완전한 사본을 만들고, `origin`이라는 이름으로 원격을 자동 등록한다.

## 1. clone이 하는 일

```bash
git clone https://github.com/user/repo.git
```

내부적으로 다음 작업이 순서대로 일어난다:

1. `repo/` 디렉터리 생성 → `git init`
2. `origin` 원격 등록 → URL 저장
3. 모든 데이터 다운로드 (objects, refs)
4. 원격 브랜치를 `refs/remotes/origin/*`으로 생성
5. 기본 브랜치(`HEAD`가 가리키는 것)를 로컬에 체크아웃

---

## 2. URL 형식

| 프로토콜 | 형식 | 특징 |
|----------|------|------|
| **HTTPS** | `https://github.com/user/repo.git` | 방화벽 통과 용이. 토큰/비밀번호 인증 |
| **SSH** | `git@github.com:user/repo.git` | 공개키 인증. 비밀번호 없이 사용 편리 |
| **SSH (URL)** | `ssh://git@github.com/user/repo.git` | SSH 명시적 URL 형식 |
| **로컬** | `/path/to/repo.git` | 같은 파일시스템. hardlink 사용으로 빠름 |
| **로컬 (file://)** | `file:///path/to/repo.git` | 로컬이지만 네트워크 전송 방식 사용 |

백엔드 팀 환경에서는 SSH 방식을 권장한다. 한 번 키를 등록하면 이후 인증 없이 push/pull 가능.

---

## 3. 기본 옵션

### 3.1. 디렉터리명 지정

```bash
git clone https://github.com/user/repo.git           # → ./repo/
git clone https://github.com/user/repo.git myproject  # → ./myproject/
git clone https://github.com/user/repo.git .          # 현재 디렉터리 (비어 있어야 함)
```

### 3.2. -b / --branch — 특정 브랜치 체크아웃

```bash
git clone -b develop https://github.com/user/repo.git
git clone -b release/1.2.0 https://github.com/user/repo.git
```

브랜치명 대신 태그도 지정할 수 있다. 히스토리는 전체를 받지만 체크아웃 브랜치만 달라진다.

### 3.3. -o / --origin — 원격 이름 변경

```bash
git clone -o upstream https://github.com/original/repo.git
# origin 대신 upstream으로 원격이 등록됨
```

오픈소스 기여 시 `upstream`(원본)과 `origin`(내 fork)을 구분할 때 사용.

---

## 4. 얕은 복제 (Shallow Clone)

히스토리 전체가 아닌 최근 N개 커밋만 복제한다. 저장소가 크거나 CI/CD 파이프라인처럼 전체 히스토리가 불필요한 경우에 유용하다.

```bash
git clone --depth 1 https://github.com/user/repo.git          # 최신 커밋 1개
git clone --depth 10 https://github.com/user/repo.git         # 최근 10개 커밋
git clone --shallow-since="2025-01-01" https://...            # 날짜 이후 히스토리만
```

얕은 복제의 특성:
- 불완전한 히스토리이므로 `git log`에서 이전 커밋이 보이지 않음
- 나중에 `git fetch --unshallow`로 전체 히스토리를 보완할 수 있음
- `--depth`는 암묵적으로 `--single-branch`를 적용 (다른 브랜치는 받지 않음)

```bash
# 얕은 복제 후 전체로 전환
git fetch --unshallow
```

---

## 5. 부분 복제 (Partial Clone)

blob(파일 내용) 객체를 나중에 필요할 때만 받는다. 매우 큰 저장소에서 clone 속도를 높일 때 사용.

```bash
# blob을 전혀 받지 않음 (메타데이터만)
git clone --filter=blob:none https://github.com/user/repo.git

# 1MB 이상 파일은 나중에 받음
git clone --filter=blob:limit=1m https://github.com/user/repo.git
```

> 실제로 파일에 접근하면 그 시점에 자동으로 내려받는다. 빌드 서버처럼 일부 파일만 필요한 환경에 적합.

---

## 6. 단일 브랜치 복제

```bash
git clone --single-branch -b main https://github.com/user/repo.git
```

지정한 브랜치의 히스토리만 복제한다. 다른 브랜치는 추후 `git fetch`로 가져올 수 없다 (`remote.origin.fetch` 설정이 단일 브랜치로 고정됨).

반대로 모든 브랜치를 명시적으로 받으려면:

```bash
git clone --no-single-branch https://github.com/user/repo.git
```

---

## 7. 서브모듈 포함 복제

```bash
git clone --recurse-submodules https://github.com/user/repo.git

# 서브모듈도 shallow clone으로
git clone --recurse-submodules --shallow-submodules https://...
```

`--recurse-submodules` 없이 복제하면 서브모듈 디렉터리가 비어 있다. 나중에 초기화하려면:

```bash
git submodule update --init --recursive
```

---

## 8. Bare / Mirror 복제

```bash
# Bare: 워킹 트리 없는 서버용 저장소
git clone --bare https://github.com/user/repo.git repo.git

# Mirror: --bare + 모든 refs(브랜치, 태그, refspec) 복제
#         저장소 완전 백업 또는 미러 서버 구축에 사용
git clone --mirror https://github.com/user/repo.git repo.git
```

`--mirror`는 `remote.origin.fetch = +refs/*:refs/*`로 설정되어 `git remote update`로 원본의 삭제된 브랜치까지 동기화된다.

---

## 9. clone 시 설정 주입 (-c)

```bash
git clone -c core.autocrlf=false \
          -c user.email="ci@company.com" \
          https://github.com/user/repo.git
```

clone과 동시에 로컬 설정을 주입한다. CI 환경에서 전역 설정 없이 저장소별 설정을 적용할 때 유용.

---

## 10. 실용 패턴 요약

```bash
# 일반 개발 시작 (SSH 권장)
git clone git@github.com:company/service.git

# 특정 브랜치로 클론
git clone -b develop git@github.com:company/service.git

# CI/CD 빠른 클론 (전체 히스토리 불필요)
git clone --depth 1 --no-tags https://github.com/user/repo.git

# 대형 저장소 (LFS 또는 대용량 파일 포함)
git clone --filter=blob:none https://github.com/user/large-repo.git

# 저장소 백업
git clone --mirror git@github.com:company/service.git /backup/service.git

# 서브모듈이 있는 프로젝트
git clone --recurse-submodules git@github.com:company/monorepo.git
```

---
## Sources
- [git-clone](https://git-scm.com/docs/git-clone)
- [Pro Git: Git Basics Getting a Git Repository](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository)

---
## Related pages
- [[git-init]]
- [[git-internals]]
- [[git-file-states]]
