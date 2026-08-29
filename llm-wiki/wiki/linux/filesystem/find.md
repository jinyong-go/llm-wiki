---
title: find — 파일 탐색
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - devops
---

## 1. 개념

디렉터리 트리를 재귀적으로 순회하며 조건에 맞는 파일을 찾는다. 조건(expression)이 없으면 모든 파일을 출력한다.

```bash
find [시작경로...] [expression]
```

시작경로 생략 시 현재 디렉터리(`.`)를 기준으로 탐색.

---

## 2. 탐색 범위 제어

| 옵션 | 설명 |
|------|------|
| `-maxdepth N` | 최대 N 레벨까지 탐색. `-maxdepth 1`은 현재 디렉터리만 |
| `-mindepth N` | N 레벨 이상부터 탐색. `-mindepth 1`은 시작점 제외 |

---

## 3. 조건 옵션

### 3.1. 파일 유형

```bash
-type f   # 일반 파일
-type d   # 디렉터리
-type l   # 심볼릭링크
-type s   # 소켓
-type p   # FIFO(파이프)
```

### 3.2. 파일명

| 옵션 | 설명 |
|------|------|
| `-name pattern` | 파일명 패턴 매칭 (대소문자 구분) |
| `-iname pattern` | 파일명 패턴 매칭 (대소문자 무시) |
| `-path pattern` | 전체 경로 패턴 매칭 |
| `-regex pattern` | 정규식 매칭 (전체 경로 대상) |

> 쉘 글로브 문자(`*`, `?`)는 따옴표로 감싸야 한다. 예: `-name "*.log"`

### 3.3. 크기

```bash
-size +100M   # 100MB 초과
-size -10k    # 10KB 미만
-size 4k      # 정확히 4KB (블록 단위 반올림)
# 단위: c(바이트), k(KB), M(MB), G(GB)
```

### 3.4. 시간

| 옵션 | 설명 |
|------|------|
| `-mtime N` | 수정 시간 기준 (N×24시간). `+7`=7일 초과, `-1`=1일 이내 |
| `-mmin N` | 수정 시간 기준 (분 단위) |
| `-atime N` | 접근 시간 기준 |
| `-ctime N` | 상태 변경 시간 기준 (권한, 소유자 변경 포함) |
| `-newer FILE` | FILE보다 최신으로 수정된 파일 |

### 3.5. 소유권·권한

```bash
-user  alice      # 소유자 alice
-group dev        # 그룹 dev
-perm  644        # 정확히 644
-perm  -644       # 최소한 644 권한 포함 (AND)
-perm  /222       # 222 권한 중 하나라도 포함 (OR)
-empty            # 빈 파일 또는 빈 디렉터리
```

---

## 4. 논리 연산자

| 연산자 | 설명 |
|--------|------|
| `expr1 expr2` 또는 `-a` | AND (기본값) |
| `-o` | OR |
| `!` 또는 `-not` | NOT |
| `\( expr \)` | 우선순위 그룹핑 |

> `-a`가 `-o`보다 우선순위가 높다. 복합 조건은 반드시 괄호로 명시할 것.

---

## 5. 액션

| 액션 | 설명 |
|------|------|
| `-print` | 파일 경로 출력 (기본값) |
| `-print0` | NUL 문자로 구분 출력. 파일명에 공백/개행 포함 시 필수 |
| `-ls` | `ls -dils` 형식으로 출력 |
| `-delete` | 파일 삭제. 자동으로 `-depth` 활성화 |
| `-exec cmd {} \;` | 파일마다 명령 실행 (한 번에 하나) |
| `-exec cmd {} +` | 파일들을 모아 명령 한 번 실행 (효율적) |
| `-execdir cmd {} \;` | 파일이 위치한 디렉터리에서 실행 (더 안전) |
| `-printf format` | 형식 지정 출력 (`%p`=경로, `%s`=크기, `%T@`=타임스탬프) |

---

## 6. 백엔드 진단 시나리오

```bash
# 1. N일 이상 된 로그 파일 삭제
find /var/log -name "*.log" -mtime +7 -delete

# 2. 특정 확장자 파일 검색
find . -name "*.java" -o -name "*.xml"
find . \( -name "*.java" -o -name "*.xml" \) -type f

# 3. 최근 수정된 파일 확인 (배포 후 변경 파일 추적)
find /app -type f -newer /tmp/deploy.marker

# 4. 대용량 파일 탐지 (디스크 정리)
find /var -type f -size +100M -exec ls -lh {} \;

# 5. 애플리케이션 소유 파일 확인
find /opt/app -not -user appuser -type f

# 6. 삭제된 임시 파일 정리 (30일 이상 접근 안 된 캐시)
find /var/cache -type f -atime +30 -delete

# 7. 빈 디렉터리 찾기 및 삭제
find /tmp -type d -empty -delete

# 8. 파일명에 공백 포함 시 안전한 처리
find . -name "*.log" -print0 | xargs -0 gzip

# 9. SUID 설정 파일 찾기 (보안 감사)
find / -perm -4000 -type f 2>/dev/null

# 10. 소유자 없는 파일 찾기 (유저 삭제 후 잔여 파일)
find / -nouser -o -nogroup 2>/dev/null

# 11. 특정 디렉터리 제외하고 탐색
find . -path ./node_modules -prune -o -name "*.js" -print

# 12. 여러 파일을 한 번에 처리 (xargs 없이)
find . -name "*.class" -exec rm {} +
```

---

## Sources
- [find(1)](https://man7.org/linux/man-pages/man1/find.1.html)

---

## Related pages
- [[cp-mv]]
- [[ls]]
- [[linux-file-permissions]]
- [[df]]
- [[du]]
