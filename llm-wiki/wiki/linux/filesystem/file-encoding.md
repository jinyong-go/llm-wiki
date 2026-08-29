---
title: 파일 인코딩 — file / iconv / enca
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - encoding
---

## 1. 개념

| 명령어 | 역할 |
|--------|------|
| `file` | 파일 유형 및 문자셋 감지 |
| `iconv` | 인코딩 변환 |
| `enca` | 인코딩 자동 감지 + 변환 (언어 기반) |

레거시 시스템 연동, 한국어 EUC-KR/CP949 파일 처리, CSV/로그 파일 인코딩 문제 진단 시 주로 사용한다.

---

## 2. file — 파일 유형 및 인코딩 감지

파일시스템 정보 → 매직 넘버 → 텍스트 패턴 순으로 파일 유형을 판별한다.

```bash
file [options] FILE...
```

### 2.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-i` / `--mime` | MIME 타입 + charset 출력 |
| `--mime-type` | MIME 타입만 출력 |
| `--mime-encoding` | charset만 출력 |
| `-b` / `--brief` | 파일명 없이 결과만 출력 |
| `-z` / `--uncompress` | 압축 파일 내부 검사 |
| `-L` | 심볼릭링크 따라가기 |
| `-f FILE` | 파일 목록을 파일에서 읽기 |

### 2.2. 사용 예시

```bash
# 파일 유형 확인
file report.csv
# → report.csv: ISO-8859 text, with CRLF line terminators

# MIME + charset 확인 (인코딩 파악)
file -i report.csv
# → report.csv: text/plain; charset=iso-8859-1

# charset만 추출
file --mime-encoding report.csv
# → report.csv: iso-8859-1

# 파일명 없이 결과만 (스크립트용)
file -b --mime-encoding *.txt

# 여러 파일 일괄 확인
file -i /var/log/*.log
```

---

## 3. iconv — 인코딩 변환

GNU libc 기반. 지원 인코딩 목록: `iconv -l`

```bash
iconv -f FROM_ENCODING -t TO_ENCODING [INPUT] [-o OUTPUT]
```

### 3.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-f FROM` | 입력 인코딩 |
| `-t TO` | 출력 인코딩 |
| `-o FILE` | 결과를 파일로 저장 |
| `-c` | 변환 불가 문자 건너뜀 (오류로 중단하지 않음) |
| `//IGNORE` | `-t` 값에 붙여 사용. 변환 불가 문자 무시 |
| `//TRANSLIT` | `-t` 값에 붙여 사용. 변환 불가 문자를 유사 문자로 대체 |
| `-l` | 지원 인코딩 목록 출력 |

### 3.2. 자주 쓰는 패턴

```bash
# EUC-KR → UTF-8 변환
iconv -f EUC-KR -t UTF-8 input.txt -o output.txt

# CP949 → UTF-8 변환 (Windows 한글)
iconv -f CP949 -t UTF-8 input.txt -o output.txt

# UTF-8 → EUC-KR 변환
iconv -f UTF-8 -t EUC-KR input.txt -o output.txt

# 표준 입출력 사용
iconv -f EUC-KR -t UTF-8 < input.txt > output.txt

# 변환 불가 문자 무시 (깨진 파일 처리)
iconv -f EUC-KR -t UTF-8//IGNORE input.txt -o output.txt

# 변환 불가 문자를 유사 문자로 대체
iconv -f UTF-8 -t ASCII//TRANSLIT input.txt

# 여러 파일 일괄 변환
for f in *.txt; do
    iconv -f EUC-KR -t UTF-8 "$f" -o "utf8_$f"
done

# 지원 인코딩 목록 중 한국어 관련
iconv -l | grep -i "949\|EUC-KR\|KSC"
```

### 3.3. 주요 한국어 인코딩 이름

| 인코딩 | iconv 이름 | 설명 |
|--------|-----------|------|
| EUC-KR | `EUC-KR` | Linux 한글 표준 |
| CP949 | `CP949` 또는 `MS949` | Windows 한글 (EUC-KR 확장) |
| UTF-8 | `UTF-8` | 유니코드 표준 |
| UTF-16LE | `UTF-16LE` | Windows 유니코드 파일 |

---

## 4. enca — 언어 기반 인코딩 자동 감지 및 변환

통계적 분석과 언어 모델을 이용해 인코딩을 추론한다. `iconv`보다 감지 정확도가 높지만 언어를 지정해야 한다.

```bash
enca [options] [FILE...]
```

### 4.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-L LANG` | 언어 지정 (감지 정확도에 결정적 영향) |
| `-x ENCODING` | 지정 인코딩으로 변환 (파일 직접 수정) |
| `-i` | iconv 호환 인코딩 이름으로 출력 |
| `-m` | MIME 인코딩 이름으로 출력 |
| `-e` | enca 내부 이름으로 출력 |
| `-d` | 상세 감지 정보 출력 |
| `-C CONV` | 변환기 지정 (`built-in`, `iconv`, `recode`) |
| `--list charsets` | 지원 인코딩 목록 |
| `--list languages` | 지원 언어 목록 |

### 4.2. 지원 언어 코드

`zh`(중국어), `ko`(한국어), `ja`(일본어), `ru`(러시아어), `cs`(체코어) 등. `enca --list languages`로 전체 확인.

### 4.3. 자주 쓰는 패턴

```bash
# 인코딩 감지 (한국어 파일)
enca -L ko file.txt

# iconv 호환 이름으로 출력
enca -L ko -i file.txt
# → EUC-KR

# UTF-8로 변환 (파일 직접 수정)
enca -L ko -x UTF-8 file.txt

# 언어 미지정 (다국어 혼재 상황)
enca -L none file.txt

# 여러 파일 일괄 변환
enca -L ko -x UTF-8 *.txt

# 감지만 하고 변환 안 함 (상세 정보)
enca -L ko -d file.txt
```

> `enca -x`는 파일을 직접 수정한다. 중요 파일은 반드시 백업 후 실행.

---

## 5. 인코딩 문제 진단 플로우

```bash
# 1. 파일 인코딩 확인
file -i suspicious.txt

# 2. enca로 이중 확인 (언어 지정)
enca -L ko suspicious.txt

# 3. iconv로 UTF-8 변환
iconv -f EUC-KR -t UTF-8 suspicious.txt -o fixed.txt

# 4. 변환 결과 확인
file -i fixed.txt
head fixed.txt
```

---

## Sources
- [file(1)](https://man7.org/linux/man-pages/man1/file.1.html)
- [iconv(1)](https://man7.org/linux/man-pages/man1/iconv.1.html)
- [enca(1)](https://manpages.debian.org/testing/enca/enca.1.en.html)

---

## Related pages
- [[cp-mv]]
- [[find]]
