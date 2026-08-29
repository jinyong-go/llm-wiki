---
title: systemctl — 서비스 제어 명령어
updated: 2026-07-14 16:00:22
tags:
  - linux
  - systemd
  - service
---

systemd 시스템 및 서비스 관리자의 CLI. 서비스 시작·중지·활성화와 유닛 상태 조회를 담당한다.

## 1. 서비스 상태 조회

```bash
systemctl status <unit>         # 상태 + 최근 로그 출력
systemctl is-active <unit>      # active / inactive (종료 코드 0/1)
systemctl is-enabled <unit>     # enabled / disabled
systemctl is-failed <unit>      # failed 여부
systemctl list-units --type=service             # 메모리에 로드된 서비스 목록
systemctl list-units --type=service --all       # inactive 포함 전체
systemctl list-unit-files --type=service        # 설치된 유닛 파일 + 활성화 상태
```

`status` 출력 구조:
```
● myapp.service - My Application
     Loaded: loaded (/etc/systemd/system/myapp.service; enabled; ...)
     Active: active (running) since ...
   Main PID: 1234 (java)
      Tasks: 42
     Memory: 256.0M
        CPU: 3.421s
     CGroup: /system.slice/myapp.service
             └─1234 java -jar /opt/myapp/myapp.jar
```

## 2. 서비스 제어

```bash
systemctl start   <unit>    # 즉시 시작
systemctl stop    <unit>    # 즉시 중지
systemctl restart <unit>    # 중지 후 재시작
systemctl reload  <unit>    # 프로세스 종료 없이 설정만 재로드 (지원 시)
systemctl reload-or-restart <unit>   # reload 지원 시 reload, 아니면 restart
systemctl try-restart <unit>         # 현재 실행 중인 경우에만 재시작
```

## 3. 부팅 시 자동 시작 관리

```bash
systemctl enable  <unit>      # 부팅 시 자동 시작 활성화 (심링크 생성)
systemctl disable <unit>      # 자동 시작 비활성화 (심링크 제거)
systemctl enable --now <unit> # 활성화 + 즉시 시작
systemctl disable --now <unit># 비활성화 + 즉시 중지
systemctl reenable <unit>     # 심링크 초기화 후 재활성화
```

> `enable`은 부팅 자동 시작만 등록하며, 현재 세션에서 즉시 시작하지 않는다. 즉시 시작하려면 `--now`를 추가하거나 `start`를 별도로 실행한다.

## 4. 마스킹

```bash
systemctl mask   <unit>   # /dev/null 심링크로 완전 차단 (start/enable 모두 거부)
systemctl unmask <unit>   # 마스킹 해제
```

`disable`은 자동 시작만 막지만 `mask`는 수동 시작도 막는다. 잘못 활성화되면 안 되는 서비스(예: `cups`)에 사용.

## 5. 유닛 파일 변경 후 반영

```bash
systemctl daemon-reload          # 유닛 파일 추가·수정 후 systemd에 반영 (필수)
systemctl reset-failed [<unit>]  # failed 상태 초기화
```

유닛 파일을 수정하면 반드시 `daemon-reload` 후 `restart`해야 변경사항이 적용된다.

## 6. 유닛 파일 편집

```bash
systemctl edit <unit>             # drop-in 파일 생성 (/etc/systemd/system/<unit>.d/override.conf)
systemctl edit --full <unit>      # 원본 유닛 파일 직접 편집
systemctl cat <unit>              # 현재 유효한 유닛 파일 내용 출력
systemctl revert <unit>           # drop-in 파일 제거, vendor 버전으로 복원
```

`edit`는 업그레이드 시 변경사항이 덮어씌워지지 않도록 drop-in 방식을 사용하므로 직접 `/usr/lib/systemd/system/` 파일을 수정하는 것보다 권장된다.

## 7. 의존성 및 로그 확인

```bash
systemctl list-dependencies <unit>           # 의존 유닛 트리
systemctl list-dependencies --reverse <unit> # 역방향 (이 유닛을 필요로 하는 유닛)
journalctl -u <unit>                          # 서비스 로그 → [[journalctl]] 참조
```

## 8. 시스템 전체 상태

```bash
systemctl is-system-running   # running / degraded / maintenance 등
systemctl --failed             # 실패한 유닛 목록
```

`degraded`는 하나 이상의 유닛이 failed 상태임을 의미한다. `--failed`로 어떤 유닛인지 확인 후 원인 조치한다.

---
## Sources
- [systemctl(1)](https://man7.org/linux/man-pages/man1/systemctl.1.html)

---
## Related pages
- [[systemd-unit-file]]
- [[journalctl]]
- [[ps]]
- [[nohup]]
