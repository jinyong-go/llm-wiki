---
title: journalctl — 서비스 로그 조회
updated: 2026-07-14 16:00:22
tags:
  - linux
  - systemd
  - logging
---

systemd-journald가 수집하는 로그를 조회하는 도구. `StandardOutput=journal`이 기본값이므로 별도 로그 설정 없이도 모든 systemd 서비스 로그를 조회할 수 있다.

## 1. 기본 조회

```bash
journalctl                     # 전체 로그 (오래된 것부터)
journalctl -e                  # 최신 로그로 바로 이동 (pager end)
journalctl -r                  # 최신 항목부터 역순 출력
journalctl --no-pager          # pager 없이 stdout 직접 출력 (파이프 연동 시)
```

## 2. 서비스 단위 조회 (-u)

```bash
journalctl -u myapp.service             # 특정 서비스 로그
journalctl -u myapp.service -f          # 실시간 팔로우 (tail -f)
journalctl -u myapp.service -n 100      # 최근 100줄
journalctl -u myapp.service -e          # 최신 로그로 이동
journalctl -u nginx.service -u myapp.service  # 여러 서비스 동시 조회
```

## 3. 시간 범위 필터

```bash
journalctl -u myapp.service --since "2026-05-13 09:00:00"
journalctl -u myapp.service --since "2026-05-13 09:00:00" --until "2026-05-13 10:00:00"
journalctl -u myapp.service --since yesterday
journalctl -u myapp.service --since "1 hour ago"
journalctl -u myapp.service --since today
```

## 4. 우선순위 필터 (-p)

```bash
journalctl -p err              # error 이상 (err, crit, alert, emerg)
journalctl -p warning          # warning 이상
journalctl -u myapp.service -p err   # 서비스 + 우선순위 조합
```

| 숫자 | 키워드 | 의미 |
|------|--------|------|
| 0 | emerg | 시스템 사용 불가 |
| 1 | alert | 즉각 조치 필요 |
| 2 | crit | 심각한 오류 |
| 3 | err | 오류 |
| 4 | warning | 경고 |
| 5 | notice | 정상이지만 주목 |
| 6 | info | 정보 |
| 7 | debug | 디버그 |

## 5. 부팅 단위 조회 (-b)

```bash
journalctl --list-boots                # 부팅 이력 목록
journalctl -b                          # 현재 부팅의 로그
journalctl -b -1                       # 직전 부팅의 로그
journalctl -b -1 -u myapp.service      # 직전 부팅의 서비스 로그
journalctl -k                          # 현재 부팅의 커널 로그 (dmesg)
```

서비스 재시작 전후 로그가 뒤섞일 때 `-b`로 부팅 단위 분리가 유용하다.

## 6. 키워드 검색

```bash
journalctl -u myapp.service -g "Exception"       # 정규식 검색
journalctl -u myapp.service -g "ERROR|WARN"      # OR 패턴
journalctl -u myapp.service --since today -g "OutOfMemoryError"
```

## 7. 출력 형식 (-o)

```bash
journalctl -u myapp.service -o short          # 기본값
journalctl -u myapp.service -o short-iso      # ISO 8601 타임스탬프
journalctl -u myapp.service -o cat            # 메시지 텍스트만 (타임스탬프 없음)
journalctl -u myapp.service -o json-pretty    # JSON 구조화 출력
journalctl -u myapp.service -o verbose        # 모든 필드 출력
```

파이프 처리 시:
```bash
journalctl -u myapp.service --no-pager -o cat | grep "ERROR"
journalctl -u myapp.service --no-pager -o json | jq '.MESSAGE'
```

## 8. 설명 포함 출력 (-x)

```bash
journalctl -xe               # 오류 메시지에 설명 텍스트 추가 + 마지막으로 이동
journalctl -u myapp.service -x
```

systemd 이벤트(서비스 시작 실패 등)에 원인 설명이 추가되어 트러블슈팅 시 유용.

## 9. 실용 패턴

```bash
# 서비스 기동 실패 원인 확인
journalctl -u myapp.service -n 50 -x

# 오늘 발생한 에러만 추출
journalctl -u myapp.service --since today -p err --no-pager

# OOM 관련 로그 전체에서 검색
journalctl -g "Out of memory" --since "7 days ago"

# 파일로 저장
journalctl -u myapp.service --since "2026-05-13" --no-pager > myapp_20260513.log

# 로그 용량 확인
journalctl --disk-usage
```

## 10. 권한

`systemd-journal`, `adm`, `wheel` 그룹 멤버는 전체 로그 조회 가능. 일반 사용자는 자신이 실행한 세션의 로그만 조회된다.

```bash
sudo usermod -aG systemd-journal appuser
```

---
## Sources
- [journalctl(1)](https://man7.org/linux/man-pages/man1/journalctl.1.html)

---
## Related pages
- [[systemctl]]
- [[systemd-unit-file]]
- [[ps]]
- [[nohup]]
