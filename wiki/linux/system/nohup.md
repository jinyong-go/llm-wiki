---
title: nohup — 세션 종료 후 프로세스 유지
updated: 2026-07-14 17:27:27
tags:
  - linux
  - cli
  - devops
---

## 1. 개요

터미널 세션이 종료될 때 전송되는 `SIGHUP` 시그널을 무시하고 명령어를 실행한다.

```bash
nohup COMMAND [ARG...]
```

---

## 2. 동작 방식

| 스트림 | 터미널 연결 시 동작 |
|--------|------------------|
| stdin | 읽을 수 없는 파일로 리다이렉션 |
| stdout | 현재 디렉터리의 `nohup.out`으로 추가 저장. 쓰기 불가이면 `$HOME/nohup.out` |
| stderr | stdout으로 리다이렉션 |

---

## 3. 종료 코드

| 코드 | 의미 |
|------|------|
| 125 | nohup 자체 실패 |
| 126 | COMMAND 실행 권한 없음 |
| 127 | COMMAND 찾을 수 없음 |
| 그 외 | COMMAND의 종료 코드 |

---

## 4. nohup vs disown

| 비교 | `nohup` | `disown` |
|------|---------|---------|
| 적용 시점 | 명령어 실행 전 | 이미 실행 중인 잡에 적용 |
| 동작 | SIGHUP 무시 설정 후 실행 | 잡 테이블에서 제거 |
| 출력 처리 | nohup.out으로 자동 리다이렉션 | 변경 없음 (리다이렉션 별도 필요) |
| 쉘 내장 | 외부 명령어 | 쉘 내장 명령어 |

---

## 5. 자주 쓰는 패턴

```bash
# 기본: 세션 종료 후에도 계속 실행
nohup java -jar app.jar &

# 출력을 명시적으로 파일 지정
nohup java -jar app.jar > app.log 2>&1 &

# stdout/stderr 분리
nohup java -jar app.jar > app.out 2> app.err &

# 출력 버리기
nohup java -jar app.jar > /dev/null 2>&1 &

# PID 확인 및 저장
nohup java -jar app.jar > app.log 2>&1 &
echo $! > app.pid
cat app.pid

# 실행 중인 프로세스에 disown 적용 (이미 실행 중일 때)
java -jar app.jar &
disown %1          # 잡 번호로
disown -h %1       # SIGHUP만 무시 (잡 테이블에는 유지)
disown $!          # 마지막 백그라운드 프로세스

# 포그라운드 → 백그라운드 전환 후 세션 분리
java -jar app.jar
# Ctrl+Z → 중단
bg                 # 백그라운드로 전환
disown %1          # 잡 테이블에서 제거
```

> 장기 실행 서비스는 nohup보다 `systemd` 유닛 또는 `screen`/`tmux`를 사용하는 것이 일반적이다.

---

## 6. 기타

- **다른 도구와의 조합** — 실행한 프로세스의 상태 확인은 [[ps]], 서비스 상시 운영은 [[systemd-unit-file]].

```bash
# nohup으로 실행한 프로세스 모니터링
nohup java -jar app.jar > app.log 2>&1 &
APP_PID=$!
ps -p $APP_PID -o pid,ppid,stat,%cpu,%mem,vsz,rss,etime,cmd
```

---

## Sources
- [nohup(1)](https://man7.org/linux/man-pages/man1/nohup.1.html)

---

## Related pages
- [[ps]]
- [[shell-special-parameters]]
- [[standard-streams]]
- [[systemd-unit-file]]
