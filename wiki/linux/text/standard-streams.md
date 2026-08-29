---
title: 표준 스트림 — stdin / stdout / stderr / 리다이렉션
updated: 2026-07-14 17:27:27
tags:
  - linux
  - cli
  - bash
  - devops
---

## 1. 개념

UNIX 프로그램은 시작 시 세 개의 스트림이 자동으로 열린다.

| 스트림 | FD | 기본 연결 | 용도 |
|--------|-----|----------|------|
| stdin  | 0   | 키보드   | 프로그램 입력 |
| stdout | 1   | 터미널   | 일반 출력 |
| stderr | 2   | 터미널   | 오류/진단 메시지 |

**버퍼링 동작:**
- `stderr`: 무버퍼(unbuffered). 즉시 출력됨
- `stdout`: 터미널 연결 시 라인 버퍼, 파이프/파일 연결 시 블록 버퍼
- 버퍼링 차이로 인해 `stdout`과 `stderr`의 출력 순서가 뒤바뀔 수 있다

---

## 2. 리다이렉션 — 출력

```bash
command > file        # stdout → file (덮어쓰기)
command >> file       # stdout → file (추가)
command 2> file       # stderr → file (덮어쓰기)
command 2>> file      # stderr → file (추가)
command &> file       # stdout + stderr → file (권장)
command &>> file      # stdout + stderr → file (추가)
command > file 2>&1   # &>와 동일 (구식 표현)
```

### 2.1. 리다이렉션 순서가 중요한 이유

```bash
# stdout과 stderr 모두 dirlist로
ls > dirlist 2>&1

# stderr는 (원래) stdout인 터미널로, stdout만 dirlist로
ls 2>&1 > dirlist
```

셸은 리다이렉션을 **왼쪽에서 오른쪽** 순서로 처리한다. 두 번째 예시에서 `2>&1` 시점의 stdout은 아직 터미널이다.

---

## 3. 리다이렉션 — 입력

```bash
command < file        # file → stdin
command <> file       # file을 읽기/쓰기 모드로 FD 0에 연결
```

---

## 4. /dev/null — 출력 버리기

```bash
command > /dev/null        # stdout 버리기
command 2> /dev/null       # stderr 버리기
command &> /dev/null       # 모두 버리기

# 스크립트에서 성공 여부만 확인
if command &> /dev/null; then
    echo "성공"
fi
```

---

## 5. 파이프 — 프로세스 간 연결

```bash
cmd1 | cmd2          # cmd1의 stdout → cmd2의 stdin
cmd1 |& cmd2         # cmd1의 stdout + stderr → cmd2의 stdin
```

파이프는 각 명령을 **서브셸**에서 실행한다. 파이프라인의 종료 코드는 마지막 명령의 종료 코드다.

```bash
# pipefail: 파이프 중 하나라도 실패하면 전체 실패
set -o pipefail
cmd1 | cmd2 | cmd3    # cmd1 또는 cmd2 실패 시 종료 코드 반영

# 파이프라인 각 단계 종료 코드 확인 (PIPESTATUS 배열)
cmd1 | cmd2
echo "${PIPESTATUS[@]}"   # 예: 0 1
```

---

## 6. Here Document — 멀티라인 입력

```bash
command << EOF
line 1
line 2
EOF

# 변수 확장 비활성화 (리터럴 그대로 전달)
command << 'EOF'
$VAR is not expanded
EOF

# 선행 탭 제거 (<<- : 탭 들여쓰기 허용)
command <<- EOF
    indented content
    EOF
```

> Here Document 내부는 기본적으로 변수·명령 치환이 적용된다. `'EOF'`처럼 구분자를 인용하면 비활성화된다.

---

## 7. Here String — 단일 문자열 입력

```bash
command <<< "string"

# 예시
grep "pattern" <<< "$variable"
base64 <<< "hello"
read var <<< "value"
```

파일 생성 없이 문자열을 stdin으로 전달한다.

---

## 8. 파일 디스크립터 조작

```bash
# FD 복제
exec 3>&1             # FD 3을 stdout(1)의 복사본으로 열기
exec 4<file           # FD 4를 파일 읽기로 열기

# FD 닫기
exec 3>&-             # FD 3 닫기
exec 4<&-             # FD 4 닫기

# FD 이동 (이동 후 원본 닫힘)
exec 3>&1-            # FD 1을 FD 3으로 이동
```

---

## 9. 특수 파일

| 경로 | 설명 |
|------|------|
| `/dev/stdin` | FD 0과 동일 |
| `/dev/stdout` | FD 1과 동일 |
| `/dev/stderr` | FD 2와 동일 |
| `/dev/null` | 읽으면 EOF, 쓰면 버림 |
| `/dev/fd/N` | FD N과 동일 |
| `/dev/tcp/host/port` | TCP 소켓 열기 (bash 전용) |

```bash
# /dev/stderr로 직접 오류 출력
echo "ERROR: something failed" > /dev/stderr
```

---

## 10. tee — 분기 출력

stdout을 파일과 다음 파이프로 동시에 전달한다.

```bash
command | tee file                 # stdout → 파일 + 터미널
command | tee -a file              # 추가(append) 모드
command | tee file1 file2          # 여러 파일 동시 저장
command |& tee file                # stdout + stderr → 파일 + 터미널
command 2>&1 | tee file            # 위와 동일

# 파이프라인 중간에서 디버깅
cmd1 | tee /tmp/debug.log | cmd2
```

---

## 11. 프로세스 치환

파일 대신 명령의 출력/입력을 임시 파일 디스크립터로 대체한다.

```bash
# <(cmd): cmd의 stdout을 파일처럼 읽기
diff <(sort file1) <(sort file2)
while read line; do ...; done < <(command)

# >(cmd): 파일처럼 쓰면 cmd의 stdin으로 전달
tee >(grep ERROR > errors.log) >(wc -l > count.txt) > /dev/null
```

> 프로세스 치환은 bash/zsh 전용이다. `/bin/sh` 스크립트에서는 사용 불가.

---

## 12. 백엔드 진단 시나리오

```bash
# 1. 애플리케이션 로그: stdout은 파일, stderr는 별도 에러 파일
java -jar app.jar > app.log 2> error.log

# 2. stdout + stderr 모두 같은 로그 파일로 (타임스탬프 포함)
java -jar app.jar &>> /var/log/app.log

# 3. 로그 보면서 파일로도 저장 (모니터링)
java -jar app.jar 2>&1 | tee -a app.log

# 4. 에러만 필터링해 저장
java -jar app.jar 2>&1 | tee app.log | grep -i error > errors.log

# 5. 스크립트에서 에러 메시지 출력
log_error() {
    echo "[ERROR] $1" >&2
}

# 6. 스크립트에서 stderr 무시, stdout만 처리
result=$(command 2>/dev/null)

# 7. curl 응답 바디와 상태코드 분리
http_body=$(curl -s -w "" https://api.example.com/health 2>/dev/null)
http_code=$(curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health)

# 8. 파이프라인 실패 감지
set -o pipefail
app_output=$(java -jar app.jar | grep "Started") || {
    echo "앱 시작 실패" >&2
    exit 1
}

# 9. Here Document로 설정 파일 생성
cat > /etc/app/config.yml << EOF
server:
  port: ${PORT:-8080}
  host: ${HOST:-0.0.0.0}
EOF

# 10. 멀티라인 SQL 실행
psql -U postgres << 'EOF'
SELECT pid, query, state
FROM pg_stat_activity
WHERE state != 'idle';
EOF
```

---

## Sources
- [stdin(3) — Linux manual page](https://man7.org/linux/man-pages/man3/stdin.3.html)
- [Redirections (Bash Reference Manual)](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [Guide to Stream Redirections in Linux (Baeldung)](https://www.baeldung.com/linux/stream-redirections)

---

## Related pages
- [[shell-special-parameters]]
- [[network-diagnostics]]
- [[find]]
- [[curl]]
- [[directory-navigation]]
