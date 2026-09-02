---
title: 시간 관련 명령어 — date / timedatectl / hwclock
updated: 2026-07-14 16:00:22
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

| 명령어 | 역할 |
|--------|------|
| `date` | 날짜·시간 출력, 형식 지정, epoch 변환, 날짜 연산 |
| `timedatectl` | 시스템 타임존·NTP 설정 (systemd) |
| `hwclock` | 하드웨어 시계(RTC)와 시스템 클럭 동기화 |

리눅스에는 두 종류의 시계가 있다.

| 시계 | 설명 |
|------|------|
| 시스템 클럭 | 커널이 관리. 부팅 후 동작. `date`로 조회 |
| 하드웨어 클럭(RTC) | 배터리로 동작. 전원 꺼져도 유지. `hwclock`으로 조회 |

부팅 시 시스템 클럭은 RTC에서 초기화되고, NTP로 동기화된다.

---

## 2. date — 날짜·시간 출력 및 연산

```bash
date [options] [+FORMAT]
date [-u] [MMDDhhmm[[CC]YY][.ss]]   # 시스템 시간 직접 설정
```

### 2.1. 형식 지정자

```bash
date '+FORMAT'   # + 뒤에 포맷 문자열
```

**날짜:**

| 지정자 | 출력 | 예시 |
|--------|------|------|
| `%Y` | 4자리 연도 | `2026` |
| `%y` | 2자리 연도 | `26` |
| `%m` | 월 (01-12) | `05` |
| `%d` | 일 (01-31) | `09` |
| `%e` | 일, 공백 패딩 | ` 9` |
| `%j` | 연중 몇 번째 날 (001-366) | `129` |
| `%u` | 요일 (1=월 ~ 7=일) | `3` |
| `%A` | 요일 전체 이름 | `Wednesday` |
| `%a` | 요일 약어 | `Wed` |
| `%B` | 월 전체 이름 | `May` |
| `%b` | 월 약어 | `May` |
| `%q` | 분기 (1-4) | `2` |

**시간:**

| 지정자 | 출력 | 예시 |
|--------|------|------|
| `%H` | 시 (00-23) | `14` |
| `%M` | 분 (00-59) | `30` |
| `%S` | 초 (00-60) | `05` |
| `%N` | 나노초 | `123456789` |
| `%p` | AM/PM | `PM` |

**복합·특수:**

| 지정자 | 출력 | 예시 |
|--------|------|------|
| `%F` | `%Y-%m-%d` | `2026-05-09` |
| `%T` | `%H:%M:%S` | `14:30:05` |
| `%R` | `%H:%M` | `14:30` |
| `%s` | Unix epoch (초) | `1746790205` |
| `%Z` | 타임존 약어 | `KST` |
| `%z` | UTC 오프셋 | `+0900` |

**패딩 제어** (`%` 바로 뒤에 삽입):

| 플래그 | 효과 |
|--------|------|
| `-` | 패딩 없음. `%-d` → `9` |
| `_` | 공백 패딩. `%_d` → ` 9` |
| `0` | 0 패딩 (기본). `%0d` → `09` |
| `^` | 대문자. `%^A` → `WEDNESDAY` |

### 2.2. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-d "STRING"` / `--date` | 특정 시각 계산. 상대 표현 및 epoch 지원 |
| `-u` / `--utc` | UTC 기준으로 출력 또는 설정 |
| `-r FILE` / `--reference` | 파일의 최종 수정 시각 출력 |
| `-s "STRING"` / `--set` | 시스템 시각 설정 (root 필요) |
| `-I[FMT]` / `--iso-8601` | ISO 8601 형식 출력. FMT: `date`/`hours`/`minutes`/`seconds`/`ns` |
| `-R` / `--rfc-email` | RFC 5322 형식 출력 |
| `--rfc-3339=FMT` | RFC 3339 형식 출력 |

### 2.3. -d: 날짜 연산 및 파싱

```bash
# 상대 날짜 표현
date -d "1 day ago"
date -d "3 days ago" '+%Y-%m-%d'
date -d "next monday"
date -d "next friday 09:00"
date -d "2 weeks ago"
date -d "1 month ago"
date -d "+1 hour"

# ISO 날짜 기준 계산
date -d "2026-01-01 +30 days" '+%Y-%m-%d'
date -d "2026-05-31 -1 month" '+%Y-%m-%d'

# Epoch 변환
date -d "@1746790205"           # epoch → 날짜
date -d "@1746790205" '+%Y-%m-%d %H:%M:%S %Z'

# 특정 날짜 파싱
date -d "2026-05-13 14:30:00"
date -d "Mon May 13 14:30:00 KST 2026"
```

### 2.4. 타임존 지정 출력

```bash
# TZ 환경변수로 특정 타임존 출력
TZ="UTC" date '+%Y-%m-%d %H:%M:%S'
TZ="America/New_York" date '+%Y-%m-%d %H:%M:%S %Z'
TZ="Europe/London" date '+%Y-%m-%d %H:%M:%S %Z'
TZ="Asia/Tokyo" date

# -d 와 타임존 조합
date -d 'TZ="America/Los_Angeles" 09:00 next Friday' '+%Y-%m-%d %H:%M:%S %Z'
```

### 2.5. 자주 쓰는 패턴

```bash
# 로그 파일명에 타임스탬프
LOG_FILE="/var/log/app-$(date '+%Y%m%d-%H%M%S').log"

# ISO 8601 타임스탬프 (로그·API)
date '+%Y-%m-%dT%H:%M:%S%z'    # 2026-05-13T14:30:05+0900
date --iso-8601=seconds         # 2026-05-13T14:30:05+09:00

# UTC 타임스탬프
date -u '+%Y-%m-%dT%H:%M:%SZ'  # 2026-05-13T05:30:05Z

# epoch 시간 조회
date '+%s'                      # 현재 epoch
date -d "2026-01-01" '+%s'      # 특정 날짜의 epoch

# epoch → 가독성 있는 형식
date -d "@$(stat -c %Y somefile)" '+%Y-%m-%d %H:%M:%S'

# 두 날짜 사이의 일수 계산
START=$(date -d "2026-01-01" '+%s')
END=$(date -d "2026-05-13" '+%s')
echo $(( (END - START) / 86400 )) 일

# 파일의 최종 수정 시각
date -r /var/log/app.log '+%Y-%m-%d %H:%M:%S'

# 스크립트 실행 시간 측정
START_TS=$(date '+%s%N')
sleep 1
END_TS=$(date '+%s%N')
echo "소요: $(( (END_TS - START_TS) / 1000000 ))ms"
```

---

## 3. timedatectl — 시스템 시간·타임존·NTP

systemd 환경에서 시스템 클럭, 타임존, NTP 동기화를 설정한다.

```bash
timedatectl [options] [COMMAND]
```

### 3.1. 서브커맨드

| 서브커맨드 | 설명 |
|-----------|------|
| `status` | 현재 설정 요약 출력 (기본) |
| `show` | 기계 파싱용 출력 (key=value) |
| `set-time TIME` | 시스템 시각 설정. 형식: `"2026-05-13 14:30:00"` |
| `set-timezone TZ` | 타임존 설정 |
| `list-timezones` | 사용 가능한 타임존 목록 |
| `set-ntp BOOL` | NTP 동기화 활성화/비활성화 |
| `set-local-rtc BOOL` | RTC를 로컬 시간으로 저장 여부 (기본 0=UTC 권장) |
| `timesync-status` | NTP 동기화 상세 상태 |
| `show-timesync` | 기계 파싱용 NTP 상태 |

### 3.2. status 출력 읽기

```
               Local time: Tue 2026-05-13 14:30:05 KST
           Universal time: Tue 2026-05-13 05:30:05 UTC
                 RTC time: Tue 2026-05-13 05:30:04
                Time zone: Asia/Seoul (KST, +0900)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

| 필드 | 설명 |
|------|------|
| `Local time` | 현재 타임존 기준 시각 |
| `Universal time` | UTC 시각 |
| `RTC time` | 하드웨어 시계 시각 |
| `Time zone` | 현재 타임존 및 UTC 오프셋 |
| `System clock synchronized` | NTP 동기화 완료 여부 |
| `NTP service` | NTP 서비스 실행 상태 |
| `RTC in local TZ` | RTC가 로컬 시간 기준인지 (UTC 권장) |

### 3.3. 자주 쓰는 패턴

```bash
# 현재 상태 확인
timedatectl

# NTP 동기화 상세 확인
timedatectl timesync-status

# 타임존 목록 검색
timedatectl list-timezones | grep -i seoul
timedatectl list-timezones | grep -i america

# 타임존 설정
sudo timedatectl set-timezone Asia/Seoul
sudo timedatectl set-timezone UTC

# NTP 활성화
sudo timedatectl set-ntp true

# NTP 비활성화 후 수동 시각 설정
sudo timedatectl set-ntp false
sudo timedatectl set-time "2026-05-13 14:30:00"
```

---

## 4. 타임존 관리

### 4.1. 설정 파일

| 경로 | 설명 |
|------|------|
| `/etc/localtime` | 현재 타임존 정의 파일의 심볼릭 링크 |
| `/etc/timezone` | 타임존 이름 문자열. `timedatectl`과 동기화됨 |
| `/usr/share/zoneinfo/` | 타임존 데이터베이스. `Asia/Seoul`, `UTC` 등 |

```bash
# 현재 타임존 확인
cat /etc/timezone
ls -la /etc/localtime    # 어디 링크됐는지 확인

# timedatectl로 변경 (권장)
sudo timedatectl set-timezone Asia/Seoul

# 수동으로 심볼릭 링크 변경 (systemd 없는 환경)
sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
echo "Asia/Seoul" | sudo tee /etc/timezone
```

### 4.2. 프로세스 단위 타임존 오버라이드

`TZ` 환경변수는 시스템 설정을 덮어쓴다. 서버는 UTC로 운영하면서 특정 로직만 KST로 처리할 때 사용한다.

```bash
# 특정 명령어에만 적용
TZ="Asia/Seoul" date
TZ="UTC" date

# Java 프로세스에 타임존 강제 지정 (-Duser.timezone 또는 TZ 환경변수)
TZ="Asia/Seoul" java -jar app.jar
java -Duser.timezone=Asia/Seoul -jar app.jar
```

---

## 5. hwclock — 하드웨어 시계

RTC(배터리 구동 시계)와 시스템 클럭을 동기화한다. 주로 시스템 초기화나 가상화 환경의 시간 오차 진단에 사용한다.

```bash
# 하드웨어 시계 현재 값 조회
sudo hwclock --show

# 하드웨어 시계 → 시스템 클럭 동기화 (부팅 시 자동 수행됨)
sudo hwclock --hctosys

# 시스템 클럭 → 하드웨어 시계 동기화
sudo hwclock --systohc

# UTC 기준으로 저장 여부 명시 (--utc 또는 --localtime)
sudo hwclock --show --utc
```

> 실제로는 `timedatectl`과 NTP가 시간 동기화를 처리하므로 hwclock을 직접 사용하는 일은 드물다. 가상 머신에서 호스트와 시간 오차가 클 때 확인용으로 사용한다.

---

## 6. 조합 패턴

```bash
# 서버 시간 설정 점검 스크립트
echo "=== 시스템 시각 ===" && date '+%Y-%m-%d %H:%M:%S %Z'
echo "=== UTC ===" && date -u '+%Y-%m-%d %H:%M:%S UTC'
echo "=== timedatectl ===" && timedatectl status
echo "=== RTC ===" && sudo hwclock --show --utc 2>/dev/null || echo "(hwclock 없음)"

# 특정 날짜까지 남은 일수 계산
TARGET="2026-12-31"
DIFF=$(( ($(date -d "$TARGET" '+%s') - $(date '+%s')) / 86400 ))
echo "$TARGET 까지 ${DIFF}일"

# 로그 파일 날짜 범위 필터 (grep과 조합)
YESTERDAY=$(date -d "1 day ago" '+%Y-%m-%d')
grep "$YESTERDAY" /var/log/app.log

# cronolog 스타일: 날짜별 로그 디렉터리 생성
LOG_DIR="/var/log/app/$(date '+%Y/%m/%d')"
mkdir -p "$LOG_DIR"

# Spring Boot 배포 시 타임존 일관성 확인
echo "서버 타임존:" && timedatectl | grep "Time zone"
echo "Java 타임존:" && java -XshowSettings:all -version 2>&1 | grep "user.timezone"
```

---

## Sources
- [date(1)](https://man7.org/linux/man-pages/man1/date.1.html)
- [timedatectl(1)](https://man7.org/linux/man-pages/man1/timedatectl.1.html)
- [hwclock(8)](https://man7.org/linux/man-pages/man8/hwclock.8.html)

---

## Related pages
- [[environment-variables]]
- [[grep]]
- [[sed]]
- [[awk]]
- [[ps]]
- [[nohup]]
- [[standard-streams]]
