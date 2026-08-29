---
title: 파일 출력 및 뷰어 — cat / tee / more / less
updated: 2026-07-14 14:35:36
tags:
  - linux
  - cli
---

## 1. 개요

| 명령어 | 역할 |
|--------|------|
| `cat` | 파일 내용 출력 및 연결 |
| `tee` | stdin을 stdout과 파일로 동시 출력 |
| `more` | 기본 페이저 (레거시) |
| `less` | 고기능 페이저. 실무 표준 |

---

## 2. cat — 파일 연결 및 출력

```bash
cat [options] [FILE...]
```

파일 인자 없이 실행하면 stdin을 stdout으로 그대로 전달한다.

### 2.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-n` | 모든 줄에 번호 표시 |
| `-b` | 공백이 아닌 줄에만 번호 표시 (`-n` 대체) |
| `-s` | 연속된 빈 줄을 하나로 압축 |
| `-A` | `-vET`와 동일. 모든 비출력 문자 표시 |
| `-E` | 각 줄 끝에 `$` 표시 (CRLF 감지 등) |
| `-T` | 탭 문자를 `^I`로 표시 |
| `-v` | 비출력 문자를 `^X`/`M-` 표기로 표시 |

### 2.2. 자주 쓰는 패턴

```bash
# 파일 내용 출력
cat file.txt

# 여러 파일 연결 출력
cat header.txt body.txt footer.txt

# 줄 번호 표시
cat -n app.log

# 줄 끝 확인 (CRLF vs LF 판별)
cat -A file.txt     # CRLF이면 ^M$ 표시, LF이면 $ 표시

# 빈 파일 생성
cat > newfile.txt   # Ctrl+D로 종료
# 또는
> newfile.txt

# 파일에 내용 추가
cat >> file.txt

# 파일 연결 후 새 파일 생성
cat part1.sql part2.sql > full.sql

# stdin + 파일 조합 ('-'는 stdin)
cat header.txt - footer.txt < body.txt

# Here Document로 파일 생성 (스크립트에서 많이 사용)
cat > /etc/app/config.yml << EOF
server:
  port: 8080
EOF

# 탭/비출력 문자 확인 (들여쓰기 문제 진단)
cat -A Makefile     # 탭은 ^I, 스페이스는 그냥 공백으로 표시
```

> 단순히 파일을 보는 용도라면 `less`가 낫다. `cat`은 파일 연결, 파이프라인 시작, 스크립트 내 파일 생성에 적합하다.

---

## 3. tee — 스트림 분기

stdin을 읽어 **stdout과 파일에 동시에** 출력한다. 파이프라인 중간에서 스냅샷을 남기거나 동시에 여러 대상에 출력할 때 사용한다.

```bash
tee [options] [FILE...]
```

### 3.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-a` | 파일에 추가 모드 (덮어쓰지 않음) |
| `-i` | SIGINT 무시 (긴 파이프라인에서 안전 종료) |

### 3.2. 자주 쓰는 패턴

```bash
# 출력을 보면서 파일에도 저장
command | tee output.log

# 파일에 추가 (로그 누적)
command | tee -a app.log

# 여러 파일에 동시 저장
command | tee file1.log file2.log

# 파이프라인 중간에서 디버깅용 스냅샷
cmd1 | tee /tmp/stage1.log | cmd2 | tee /tmp/stage2.log | cmd3

# stdout + stderr 모두 파일과 터미널로
command 2>&1 | tee app.log

# stderr로 동시 출력 (프로세스 치환)
command | tee >(cat >&2) > output.log

# 여러 후처리 동시 실행 (프로세스 치환)
command | tee >(grep ERROR > errors.log) >(wc -l > count.txt) > /dev/null

# root 권한 필요한 파일에 쓰기 (sudo cat은 안 됨)
echo "config" | sudo tee /etc/app/config.conf > /dev/null
```

> `echo "..." | sudo tee file`은 `sudo echo "..." > file`이 작동하지 않을 때(리다이렉션은 sudo 범위 밖) 사용하는 표준 패턴이다.

---

## 4. more — 기본 페이저

터미널 한 화면씩 파일을 표시한다. 앞으로만 이동 가능한 단방향 뷰어. `less`에 비해 기능이 제한적이며 레거시 환경에서만 사용된다.

```bash
more [options] [FILE...]
```

| 키 | 동작 |
|----|------|
| `Space` | 다음 화면 |
| `Enter` | 한 줄 아래 |
| `b` | 이전 화면 (지원 여부는 구현마다 다름) |
| `/pattern` | 패턴 검색 |
| `q` | 종료 |

> 실무에서는 `less`를 사용한다. `more`는 `less`가 없는 최소 환경(컨테이너, 임베디드)에서만 사용하게 된다.

---

## 5. less — 고기능 페이저

파일 전체를 읽지 않고 시작하므로 대용량 파일도 즉시 열린다. 양방향 이동, 검색, 다중 파일 지원.

```bash
less [options] [FILE...]
```

### 5.1. 시작 옵션

| 옵션 | 설명 |
|------|------|
| `-N` | 줄 번호 표시 |
| `-S` | 긴 줄 잘라서 표시 (가로 스크롤 가능) |
| `-i` | 검색 시 대소문자 무시 |
| `-F` | 전체 내용이 한 화면에 들어오면 자동 종료 |
| `+F` | 실시간 추적 모드로 시작 (`tail -f`와 유사) |
| `-R` | ANSI 색상 코드 렌더링 (컬러 로그 뷰) |
| `+줄번호` | 지정 줄에서 시작. 예: `less +100 file.log` |
| `+/pattern` | 지정 패턴 위치에서 시작 |

### 5.2. 이동 키

| 키 | 동작 |
|----|------|
| `Space` / `f` | 다음 화면 |
| `b` | 이전 화면 |
| `j` / `↓` | 한 줄 아래 |
| `k` / `↑` | 한 줄 위 |
| `g` | 파일 첫 줄 |
| `G` | 파일 마지막 줄 |
| `숫자g` | 지정 줄 번호로 이동 |
| `F` | 실시간 추적 모드 (Ctrl+C로 종료) |

### 5.3. 검색

| 키 | 동작 |
|----|------|
| `/pattern` | 정방향 검색 |
| `?pattern` | 역방향 검색 |
| `n` | 다음 검색 결과 |
| `N` | 이전 검색 결과 |
| `&pattern` | 매칭 줄만 표시 |

### 5.4. 기타 조작

| 키 | 동작 |
|----|------|
| `q` | 종료 |
| `:n` | 다음 파일 |
| `:p` | 이전 파일 |
| `:e 파일명` | 새 파일 열기 |
| `-N` | 줄 번호 토글 (실행 중 옵션 변경) |
| `=` | 현재 위치 정보 표시 |

### 5.5. 자주 쓰는 패턴

```bash
# 로그 파일 보기
less app.log

# 컬러 로그 보기 (ANSI 색상 유지)
less -R app.log

# 실시간 로그 추적
less +F app.log

# 특정 줄부터 보기
less +500 app.log

# 패턴 위치부터 보기
less +/ERROR app.log

# 여러 파일 순서대로 보기
less service1.log service2.log

# grep 결과 페이징
grep "ERROR" app.log | less -R

# 줄 번호 + 긴 줄 자르기
less -NS app.log
```

---

## Sources
- [cat(1)](https://man7.org/linux/man-pages/man1/cat.1.html)
- [tee(1)](https://man7.org/linux/man-pages/man1/tee.1.html)
- [more(1)](https://man7.org/linux/man-pages/man1/more.1.html)
- [less(1)](https://man7.org/linux/man-pages/man1/less.1.html)

---

## Related pages
- [[standard-streams]]
- [[grep]]
- [[sed]]
- [[awk]]
- [[find]]
