---
title: Git 내부 구조
updated: 2026-07-08 10:32:15
tags:
  - git
  - vcs
---

## 1. 스냅샷 모델 (Snapshot vs Delta)

Git은 데이터를 **스냅샷의 스트림**으로 저장한다. 기존 VCS(SVN, CVS)와 근본적으로 다르다.

**델타 방식 (기존 VCS):**
```
파일A: v1 → Δ1 → Δ2 → Δ3
파일B: v1 → Δ1 → Δ2
```
각 버전을 "이전 버전 + 변경 사항"으로 저장.

**Git 스냅샷 방식:**
```
커밋1: [파일A_v1, 파일B_v1, 파일C_v1]
커밋2: [파일A_v2, 파일B_v1(링크), 파일C_v2]
커밋3: [파일A_v2(링크), 파일B_v3, 파일C_v2(링크)]
```
매 커밋마다 전체 파일 트리를 스냅샷으로 저장. 변경되지 않은 파일은 이전 스냅샷의 객체를 참조하는 링크로 처리해 용량을 절약한다.

이 구조 덕분에 브랜치 전환, 히스토리 탐색, diff 연산이 모두 빠르다.

---

## 2. 3개 영역 (Three Sections)

```
┌─────────────────┐    git add    ┌──────────────┐   git commit  ┌──────────────┐
│  Working Tree   │ ────────────► │ Staging Area │ ────────────► │ Git Directory│
│  (작업 디렉터리) │               │   (Index)    │               │  (.git/)     │
│                 │ ◄──────────── │              │               │              │
└─────────────────┘  git restore  └──────────────┘               └──────────────┘
```

| 영역 | 설명 |
|------|------|
| **Working Tree** | 실제 파일이 있는 디렉터리. 편집기로 작업하는 공간 |
| **Staging Area (Index)** | 다음 커밋에 포함될 내용을 준비하는 공간. `.git/index` 파일 |
| **Git Directory** | 저장소 메타데이터와 객체 데이터베이스. `git clone` 시 복사되는 대상 |

### 2.1. 3가지 파일 상태

| 상태 | 위치 | 의미 |
|------|------|------|
| **Modified** | Working Tree | 변경됐지만 아직 Staging Area에 없음 |
| **Staged** | Staging Area | 다음 커밋에 포함될 것으로 표시됨 |
| **Committed** | Git Directory | 로컬 데이터베이스에 안전하게 저장됨 |

---

## 3. .git 디렉터리 구조

```
.git/
├── HEAD              # 현재 체크아웃된 브랜치 포인터
├── config            # 저장소 로컬 설정 (remote URL, user 등)
├── index             # 스테이징 영역 (바이너리)
├── objects/          # Content-addressable 객체 저장소
│   ├── pack/         # packfile (압축된 객체 묶음)
│   └── info/
├── refs/
│   ├── heads/        # 로컬 브랜치 (파일 내용 = 커밋 SHA)
│   ├── remotes/      # 원격 브랜치
│   └── tags/         # 태그
├── logs/
│   ├── HEAD          # HEAD 이동 이력 (reflog)
│   └── refs/heads/   # 브랜치별 이동 이력
├── COMMIT_EDITMSG    # 가장 최근 커밋 메시지
├── ORIG_HEAD         # merge/rebase 전 HEAD (복구용)
└── MERGE_HEAD        # merge 진행 중일 때 병합 대상 커밋
```

```bash
cat .git/HEAD
# ref: refs/heads/main

cat .git/refs/heads/main
# 3a8f2c1d4e7b9f6c5a2d1e8f3b4c7d9e2f5a8b1c
```

---

## 4. 4가지 객체 타입 (Object Store)

Git의 모든 데이터는 `.git/objects/`에 SHA-1 해시를 키로 저장된다. 4가지 타입이 있다.

### 4.1. blob
파일의 **내용**만 저장. 파일명, 경로, 권한은 포함하지 않는다.

```
blob <size>\0<content>
→ SHA-1 해시 계산 → objects/ab/cdef1234... 에 저장
```

### 4.2. tree
**디렉터리 구조**를 표현. blob과 다른 tree에 대한 참조(파일명 + 권한 포함)를 저장.

```
tree
├── 100644 blob a1b2c3  README.md
├── 100644 blob d4e5f6  pom.xml
└── 040000 tree g7h8i9  src/
```

### 4.3. commit
**스냅샷의 루트 tree** + 부모 커밋 + 메타데이터를 저장.

```
tree   a1b2c3d4e5f6...   ← 루트 tree 객체 SHA
parent 9f8e7d6c5b4a...   ← 부모 커밋 SHA (최초 커밋은 없음)
author  홍길동 <hong@example.com> 1715596800 +0900
committer 홍길동 <hong@example.com> 1715596800 +0900

feat: 로그인 기능 추가
```

커밋은 부모 커밋을 가리키므로 전체 히스토리가 **DAG(비순환 방향 그래프)** 를 형성한다.

### 4.4. tag (annotated)
특정 커밋을 가리키는 **영구 참조** + 태그 메시지. `git tag -a`로 생성.

---

## 5. SHA-1과 Content-Addressable Storage

Git은 내용(content)을 기반으로 SHA-1 해시를 계산하고 그 해시가 곧 파일 이름이 된다.

```bash
# 객체 내용 확인
git cat-file -t 3a8f2c1d   # 타입 출력 (blob/tree/commit/tag)
git cat-file -p 3a8f2c1d   # 내용 출력
```

**특성:**
- 동일한 내용은 항상 동일한 SHA-1 → 중복 저장 없음
- 내용이 1바이트라도 바뀌면 완전히 다른 해시 → 변조 불가능
- SHA-1 40자 중 앞 7~8자만으로도 저장소 내 고유 식별 가능

> SHA-1은 이론상 충돌 가능성이 있어 Git은 SHA-256으로의 전환을 진행 중이다 (Git 2.29+ `--object-format=sha256` 옵션).

---
## Sources
- [Pro Git: Getting Started What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)

---
## Related pages
- [[git-file-states]]
