---
title: awk — 필드 단위 텍스트 처리
updated: 2026-07-14 15:34:25
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

레코드(줄)를 필드로 분리해 처리하는 **AWK 프로그래밍 언어** 처리기. 집계, 변환, 조건 필터링에 강하다. 리눅스의 `gawk`는 GNU 구현으로 POSIX 표준을 따르며 GNU 확장을 추가한 것이다.

```bash
awk [options] 'program' [FILE...]
awk -f script.awk [FILE...]
```

- **레코드와 필드** — 입력을 레코드(기본: 개행 구분, `RS`)로 나누고, 각 레코드를 필드(구분자 `FS`, 기본: 공백/탭)로 분할해 `$1`, `$2`, …로 참조한다.
- **program** — 첫 번째 인자로 직접 전달하거나 `-f`로 파일에서 읽는다 (`-f` 복수 지정 시 연결됨).
- **FILE** — 미지정 시 표준 입력을 읽는다.

---

## 2. 옵션

| 옵션 | 설명 |
|------|------|
| `-F sep` | 필드 구분자 지정 |
| `-v var=val` | 변수 초기값 지정 |
| `-f FILE` | 프로그램을 파일에서 읽기 |

---

## 3. 프로그램 구조

```awk
BEGIN  { 초기화 }        # 입력 처리 전 1회 실행
pattern { action }      # 각 레코드에 패턴 매칭 후 실행
END    { 마무리 }        # 모든 입력 처리 후 1회 실행
```

패턴과 액션은 각각 생략 가능. 패턴만 있으면 `{print}`가 기본 액션.

---

## 4. 문법

### 4.1. 패턴 종류

```awk
/regex/              # 정규식 매칭
$2 > 100             # 조건식
NR > 5 && NR < 10    # 논리 연산
NR==1, NR==5         # 범위 패턴 (1~5번 레코드)
$1 ~ /pattern/       # 필드 정규식 매칭
$1 !~ /pattern/      # 필드 정규식 불일치
```

### 4.2. 내장 변수

| 변수 | 설명 |
|------|------|
| `$0` | 현재 레코드 전체 |
| `$1`, `$2`, ... | 1번째, 2번째 필드 |
| `NR` | 현재까지 처리한 총 레코드 수 |
| `NF` | 현재 레코드의 필드 수. `$NF`=마지막 필드 |
| `FNR` | 현재 파일 내 레코드 번호 |
| `FS` | 입력 필드 구분자 (기본: 공백/탭) |
| `OFS` | 출력 필드 구분자 (기본: 공백) |
| `RS` | 입력 레코드 구분자 (기본: 개행) |
| `ORS` | 출력 레코드 구분자 (기본: 개행) |
| `FILENAME` | 현재 처리 중인 파일명 |

### 4.3. 내장 함수

```awk
# 출력
print $1, $2         # OFS로 구분해 출력
printf "%s: %d\n", $1, $2   # 형식 지정 출력

# 문자열
length($1)           # 길이
substr($1, 2, 3)     # 2번째 문자부터 3자
index($1, "abc")     # "abc"가 시작하는 위치
split($1, arr, ":")  # ":"로 분할해 arr 배열에 저장
sub(/old/, "new", $1) # 첫 매칭 치환
gsub(/old/, "new")   # 전체 매칭 치환 ($0 대상)
tolower($1)          # 소문자 변환
toupper($1)          # 대문자 변환
sprintf(fmt, args)   # 형식 문자열 반환

# 시스템
system("cmd")        # 셸 명령 실행
```

---

## 5. 자주 쓰는 패턴

```bash
# 특정 컬럼 추출
awk '{print $1, $3}' file.txt
awk -F: '{print $1, $3}' /etc/passwd      # ':' 구분

# 조건 필터링
awk '$3 > 1000 {print $1, $3}' data.txt   # 3번째 필드 > 1000
awk 'NR > 1' data.csv                     # 헤더 줄 제외
awk '/ERROR/ {print NR": "$0}' app.log    # ERROR 줄 + 번호

# 집계 (합계/평균/카운트)
awk '{sum += $2} END {print "합계:", sum}' data.txt
awk 'BEGIN{c=0} {c++} END{print c}' file  # wc -l과 동일
awk '{sum+=$2; cnt++} END{print sum/cnt}' data.txt

# 접근 로그 IP별 요청 수
awk '{count[$1]++} END {for(ip in count) print ip, count[ip]}' access.log

# CSV 특정 컬럼 추출 + 헤더 제외
awk -F, 'NR>1 {print $1, $4}' data.csv

# 필드 수정 후 재출력
awk -F: '{$3=0; print}' OFS=: /etc/passwd

# 여러 파일 처리 시 파일명 포함
awk 'FNR==1 {print "=== " FILENAME " ===" } {print}' *.log

# 응답 시간 분포 (100ms 단위 버킷)
awk '{bucket=int($NF/100)*100; count[bucket]++}
     END {for(b in count) print b"ms:", count[b]}' access.log | sort -n

# 특정 패턴 사이 줄만 추출
awk '/BEGIN_SECTION/,/END_SECTION/' file.txt

# 중복 제거 (sort | uniq 대안, 순서 유지)
awk '!seen[$0]++' file.txt

# 필드 기반 조인 (두 파일)
awk 'NR==FNR{map[$1]=$2; next} {print $0, map[$1]}' file1 file2
```

---

## 6. 기타

- **다른 도구와의 조합** — 검색·추출은 [[grep]], 줄 편집(치환·삭제)은 [[sed]]. 세 도구는 파이프라인으로 조합해 사용하는 경우가 많다 (grep 필터링 → sed 변환 → awk 집계):

```bash
# grep → sed → awk 파이프라인
grep "ERROR" app.log \
  | sed 's/\[.*\] //' \
  | awk -F'|' '{count[$2]++} END {for(k in count) print k, count[k]}'

# 로그에서 느린 쿼리 추출 (1000ms 초과)
grep "query_time" slow.log \
  | awk '$NF > 1000 {print $0}' \
  | sed 's/  */ /g'

# 설정 파일에서 주석 제거 후 특정 섹션 추출
sed '/^#/d; /^$/d' config.yml \
  | awk '/^\[database\]/,/^\[/' \
  | grep -v "^\["
```

---

## Sources
- [gawk(1)](https://man7.org/linux/man-pages/man1/gawk.1.html)

---

## Related pages
- [[grep]]
- [[sed]]
- [[standard-streams]]
- [[find]]
