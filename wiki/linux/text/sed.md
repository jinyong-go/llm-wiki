---
title: sed — 스트림 편집기
updated: 2026-07-14 15:34:25
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

**스트림 편집기(stream editor)** — 입력 스트림(파일 또는 파이프라인)에 줄 단위 텍스트 변환(치환·삭제·삽입)을 수행한다.

```bash
sed [options] 'script' [FILE...]
```

- **입력을 한 번만 통과(one pass)** 하므로 대화형 편집기(ed 등)보다 효율적이며, **파이프라인 안에서 텍스트를 필터링**할 수 있다는 점이 다른 편집기와의 핵심 차이다.
- **script** — `-e`/`-f` 옵션이 없으면 첫 번째 인자를 스크립트로 인식하고 나머지를 입력 파일로 처리한다.
- **FILE** — 미지정 시 표준 입력을 읽는다.
- 원본 파일은 변경하지 않는 것이 기본 (`-i`로 in-place 수정).

---

## 2. 옵션

| 옵션 | 설명 |
|------|------|
| `-n` | 자동 출력 억제. `p` 명령과 함께 선택 출력 |
| `-e 'script'` | 스크립트 추가. 여러 번 사용 가능 |
| `-f FILE` | 스크립트 파일에서 읽기 |
| `-i[SUFFIX]` | 파일 직접 수정 (in-place). SUFFIX 지정 시 백업 생성 |
| `-E` / `-r` | 확장 정규식 (ERE) 사용 |

---

## 3. 스크립트

### 3.1. 주소 지정

```bash
sed '5s/…'           # 5번째 줄
sed '2,5s/…'         # 2~5번째 줄 범위
sed '$s/…'           # 마지막 줄
sed '1~2s/…'         # 1번부터 2줄마다 (홀수 줄)
sed '/pattern/s/…'   # 패턴 매칭 줄
sed '/start/,/end/s/…' # 범위: start ~ end 매칭 사이
sed '5,+3s/…'        # 5번째부터 3줄 더 (5~8)
sed '/pattern/!s/…'  # 패턴 불일치 줄 (! = NOT)
```

### 3.2. s — 치환

```bash
s/old/new/          # 줄당 첫 매칭만
s/old/new/g         # 모든 매칭 (global)
s/old/new/2         # 두 번째 매칭부터
s/old/new/i         # 대소문자 무시
s/old/new/p         # 치환 후 줄 추가 출력 (-n과 조합)
s/\(group\)/\1/     # BRE 캡처 그룹
s/(group)/\1/       # ERE 캡처 그룹 (-E 사용 시)
s/old/&-suffix/     # &는 매칭된 전체 텍스트
```

### 3.3. d — 삭제

```bash
sed '/^#/d'          # 주석 줄 삭제
sed '/^$/d'          # 빈 줄 삭제
sed '1,5d'           # 1~5번째 줄 삭제
```

### 3.4. p — 출력

```bash
sed -n '10,20p'      # 10~20번째 줄만 출력
sed -n '/ERROR/p'    # ERROR 매칭 줄만 출력
```

### 3.5. a / i / c — 삽입·교체

```bash
sed '/pattern/a\추가할 줄'   # 매칭 줄 아래에 삽입
sed '/pattern/i\추가할 줄'   # 매칭 줄 위에 삽입
sed '/pattern/c\대체할 줄'   # 매칭 줄 전체 교체
```

### 3.6. y — 문자 단위 변환

```bash
sed 'y/abc/ABC/'     # a→A, b→B, c→C
```

### 3.7. q — 중단

```bash
sed '10q'            # 10줄 출력 후 종료 (head와 유사)
```

---

## 4. 자주 쓰는 패턴

```bash
# 설정값 변경 (in-place, 백업 포함)
sed -i.bak 's/^PORT=.*/PORT=9090/' app.conf

# 주석/빈 줄 제거
sed '/^#/d; /^$/d' config.yml

# 여러 치환 한 번에
sed -e 's/foo/bar/g' -e 's/baz/qux/g' file.txt

# 특정 줄 범위만 출력 (head/tail 조합 대안)
sed -n '100,200p' large.log

# 특정 패턴 사이 추출
sed -n '/START/,/END/p' app.log

# 줄 끝 공백 제거
sed 's/[[:space:]]*$//' file.txt

# CRLF → LF 변환
sed 's/\r$//' file.txt

# 환경변수 치환 (배포 템플릿)
sed "s/\${PORT}/${PORT}/g" config.template > config.yml

# 첫 번째 매칭만 변경 (0,/pattern/ 주소)
sed '0,/old/{s/old/new/}' file.txt
```

---

## 5. 기타

- **다른 도구와의 조합** — 검색·추출은 [[grep]], 필드 단위 처리·집계는 [[awk]]. 세 도구는 파이프라인으로 조합해 사용하는 경우가 많다 (grep 필터링 → sed 변환 → awk 집계). 조합 예시는 [[awk]] §6 참고.

---

## Sources
- [sed(1)](https://man7.org/linux/man-pages/man1/sed.1.html)

---

## Related pages
- [[grep]]
- [[awk]]
- [[standard-streams]]
- [[cat-tee-more-less]]
