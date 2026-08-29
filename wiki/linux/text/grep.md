---
title: grep — 패턴 검색
updated: 2026-07-14 15:34:25
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

각 FILE에서 패턴을 검색해 **매칭되는 줄을 출력**한다.

```bash
grep [options] PATTERNS [FILE...]
```

- **PATTERNS** — 개행으로 구분해 **여러 패턴을 한 번에** 지정할 수 있다. 셸에서 사용할 때는 따옴표로 감싼다:
    - **작은따옴표** `'...'` — 셸이 내용을 해석하지 않고 그대로 전달. `$`, `*`, `\` 등 정규식 메타문자를 보호하므로 기본으로 사용
    - **큰따옴표** `"..."` — `$변수`·`$(명령)` 확장이 일어남. 패턴에 셸 변수를 넣어야 할 때 사용
- **FILE** — `-`는 표준 입력. 미지정 시 비재귀 검색은 표준 입력을 읽고, 재귀 검색(`-r`)은 현재 디렉터리를 검사한다.
- **종료 코드** — `0`=매칭 있음, `1`=매칭 없음, `2`=오류. 스크립트 조건 분기에 사용 (`-q`와 조합, §3).

---

## 2. 옵션

### 2.1. 패턴 문법

| 옵션 | 설명 |
|------|------|
| (기본) `-G` | 기본 정규식 (BRE). `+`/`?`에 `\` 필요 |
| `-E` | 확장 정규식 (ERE). `egrep`과 동일 |
| `-F` | 고정 문자열. 정규식 해석 안 함 (가장 빠름) |
| `-P` | Perl 호환 정규식 (PCRE). `\d`, `\w`, lookahead 등 지원 |

### 2.2. 매칭 제어

| 옵션 | 설명 |
|------|------|
| `-i` | 대소문자 무시 |
| `-v` | 매칭 줄 반전 (매칭 안 된 줄 출력) |
| `-w` | 단어 단위 매칭 (word boundary) |
| `-x` | 줄 전체가 패턴과 일치 |
| `-m N` | N개 매칭 후 중단 |

### 2.3. 출력 제어

| 옵션 | 설명 |
|------|------|
| `-n` | 줄 번호 표시 |
| `-c` | 매칭 줄 수만 출력 |
| `-l` | 매칭된 파일명만 출력 |
| `-L` | 매칭 없는 파일명만 출력 |
| `-o` | 매칭된 부분만 출력 (줄 전체 아님) |
| `-q` | 출력 없음. 종료 코드만 확인 |
| `-A N` | 매칭 줄 이후 N줄 포함 |
| `-B N` | 매칭 줄 이전 N줄 포함 |
| `-C N` | 매칭 줄 전후 N줄 포함 |

### 2.4. 파일/디렉터리

| 옵션 | 설명 |
|------|------|
| `-r` | 재귀 검색 |
| `-R` | 재귀 검색 + 심볼릭링크 따라가기 |
| `--include=GLOB` | 특정 파일 패턴만 검색 |
| `--exclude=GLOB` | 특정 파일 패턴 제외 |
| `--exclude-dir=GLOB` | 특정 디렉터리 제외 |

---

## 3. 자주 쓰는 패턴

```bash
# 기본 검색
grep "ERROR" app.log
grep -i "error" app.log            # 대소문자 무시

# 컨텍스트 포함 (스택트레이스 분석)
grep -A 10 "NullPointerException" app.log
grep -B 2 -A 5 "FATAL" app.log

# 재귀 코드 검색
grep -rn "TODO" src/ --include="*.java"
grep -r "deprecated" . --include="*.java" --exclude-dir=".git"

# 여러 패턴 (OR)
grep -E "ERROR|WARN|FATAL" app.log

# 패턴 제외 (주석/빈 줄 제거)
grep -v "^#" config.yml | grep -v "^$"

# 파일 목록만 (포함/미포함)
grep -rl "import org.springframework" src/
grep -rL "@Test" src/test/

# 특정 단어만 (word boundary)
grep -w "port" config.properties    # "report", "transport" 제외

# 매칭 부분만 추출
grep -oE "[0-9]+ms" app.log         # 응답 시간만 추출
grep -oP "(?<=userId=)\d+" app.log  # userId 값만 추출 (PCRE)

# 스크립트에서 조건 확인
if grep -q "ERROR" app.log; then
    echo "에러 발생"
fi

# 두 파일에서 공통 패턴
grep -f patterns.txt target.log

# 로그 카운트
grep -c "ERROR" app.log
```

---

## 4. 기타

- **다른 도구와의 조합** — grep은 검색·추출까지만 담당한다. 매칭 줄의 편집(치환·삭제)은 [[sed]], 필드 단위 처리·집계는 [[awk]]로 이어서 처리한다. 세 도구는 파이프라인으로 조합해 사용하는 경우가 많다 (grep 필터링 → sed 변환 → awk 집계). 조합 예시는 [[awk]] §6 참고.

---

## Sources
- [grep(1)](https://man7.org/linux/man-pages/man1/grep.1.html)
- [Bash Reference Manual — Quoting](https://www.gnu.org/software/bash/manual/html_node/Quoting.html)

---

## Related pages
- [[sed]]
- [[awk]]
- [[find]]
- [[cat-tee-more-less]]
- [[standard-streams]]
