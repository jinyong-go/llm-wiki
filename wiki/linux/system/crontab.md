---
title: crontab — 리눅스 작업 스케줄러
updated: 2026-07-21 11:07:34
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

crontab(cron table)은 cron(8) 데몬이 읽어 지정된 시각에 명령을 반복 실행하도록 등록하는 파일이다.
사용자별 crontab은 `/var/spool/cron/`에, 시스템 crontab은 `/etc/crontab`과 `/etc/cron.d/`에 저장된다.
직접 편집하지 않고 `crontab` 명령어로 관리한다.

---

## 2. crontab 명령어

| 옵션 | 동작 |
|------|------|
| `-e` | 편집 (VISUAL/EDITOR 환경변수의 에디터 사용), 저장 시 자동 설치 |
| `-l` | 현재 crontab 출력 |
| `-r` | 현재 crontab 삭제 |
| `-i` | `-r`과 함께 사용, 삭제 전 확인 프롬프트 |
| `-u user` | 대상 사용자 지정 (기본은 실행 사용자 자신) |
| `-T` | 설치 전 문법 검사만 수행 |
| `-s` | 편집 전 현재 SELinux 컨텍스트를 MLS_LEVEL로 추가 |
| `-V` | 버전 출력 |

```bash
crontab -e           # 현재 사용자 crontab 편집
crontab -l           # 조회
crontab -r           # 삭제
crontab -u www -e    # www 사용자 crontab 편집 (root 권한 필요)
```

편집·삭제 시 이전 내용은 `$XDG_CACHE_HOME/crontab/crontab.bak` (또는 `crontab.<user>.bak`)에 백업된다.[^1]

---

## 3. crontab 파일 문법

### 3.1 필드

```
분(0-59) 시(0-23) 일(1-31) 월(1-12) 요일(0-7, 0/7=일)  명령어
```

| 문자 | 의미 | 예 |
|------|------|-----|
| `*` | 전체 범위 | `* * * * *` (매분) |
| `-` | 범위 | `8-11` (8~11시) |
| `,` | 목록 | `1,2,5,9` |
| `/` | step (범위 내 간격) | `*/2` (2시간마다), `0-23/2` |
| `~` | 범위 내 무작위 값 (설치 시 1회 결정) | `6~15` |
| 이름 | 월/요일 앞 3글자 (대소문자 무관) | `mon,wed,fri`, `jan-mar` |

'일(day of month)'과 '요일(day of week)'이 모두 `*`가 아니면 OR 조건으로 매칭된다.
예: `30 4 1,15 * 5` → 매월 1일·15일 오전 4:30 및 매주 금요일.

### 3.2 특수 닉네임

| 닉네임 | 동일 표현 |
|---------|----------|
| `@reboot` | 부팅 직후 1회 |
| `@yearly`, `@annually` | `0 0 1 1 *` |
| `@monthly` | `0 0 1 * *` |
| `@weekly` | `0 0 * * 0` |
| `@daily` | `0 0 * * *` |
| `@hourly` | `0 * * * *` |

### 3.3 환경변수 설정

crontab 파일 상단에 `name = value` 형태로 설정 가능.

| 변수 | 용도 |
|------|------|
| `SHELL` | 명령 실행 셸 (기본 `/bin/sh`) |
| `PATH` | 명령 탐색 경로. 로그인 셸보다 최소한으로 설정되므로 절대경로 권장 |
| `MAILTO` | 출력 결과를 받을 메일 주소. 빈 문자열이면 메일 미발송 |
| `MAILFROM` | 메일 발신자 주소 |
| `HOME` | 홈 디렉터리 (기본은 `/etc/passwd` 값) |
| `CRON_TZ` | 해당 crontab의 시간대 |
| `RANDOM_DELAY` | 작업 시작을 지정 분(min) 내 무작위 지연 |

`LOGNAME`은 재정의 불가.

---

## 4. 파일 위치

| 경로 | 용도 |
|------|------|
| `/var/spool/cron/` | 사용자별 crontab 저장 (직접 편집 금지) |
| `/etc/crontab` | 시스템 crontab, 명령어 앞에 사용자명 필드 필요 |
| `/etc/cron.d/` | 패키지·서비스용 시스템 crontab 디렉터리, 사용자명 필드 필요 |
| `/etc/cron.allow`, `/etc/cron.deny` | crontab 명령 사용 권한 제어 (실행 중인 잡 자체는 제어 불가) |

시스템 crontab(`/etc/crontab`, `/etc/cron.d/*`)은 필드가 하나 더 있다.

```
* * * * * root touch /tmp/file
```

---

## 5. 예시

```bash
# 매일 자정 5분 후 실행, 출력을 로그에 추가
5 0 * * *  $HOME/bin/daily.job >> $HOME/tmp/out 2>&1

# 매월 1일 14:15
15 14 1 * *  $HOME/bin/monthly

# 평일 22시
0 22 * * 1-5  mail -s "reminder" joe

# 2시간마다
0 */2 * * *  /usr/local/bin/sync.sh

# 특수 닉네임: 재부팅 시 1회, 매일 자정
@reboot  /usr/local/bin/startup.sh
@daily   /usr/local/bin/backup.sh
```

---

## 6. 주의사항

- step 값(`/n`)은 해당 필드 범위 내에서만 적용된다. `*/35`는 35분마다가 아니라 매시 0분·35분에 실행된다.
- 서머타임 전환 등으로 존재하지 않는 시각은 실행되지 않고, 중복되는 시각은 두 번 실행될 수 있다.
- crontab 파일의 마지막 줄은 개행 문자로 끝나야 하며, 그렇지 않으면 cron이 해당 crontab을 (부분적으로) 손상된 것으로 간주한다.
- cron.allow/cron.deny는 crontab 명령 사용 권한만 제어하며, 이미 등록된 crontab의 실행은 막지 못한다.

---

## Sources
- [crontab(5)](https://man7.org/linux/man-pages/man5/crontab.5.html)
- [crontab(1)](https://man7.org/linux/man-pages/man1/crontab.1.html)

---

## Related pages
- [[systemctl]]
- [[systemd-unit-file]]
- [[nohup]]
- [[time]]

[^1]: `XDG_CACHE_HOME`은 캐시 파일 저장 위치를 지정하는 XDG Base Directory 표준 환경변수이며, 미설정 시 `$HOME/.cache`가 사용된다.
