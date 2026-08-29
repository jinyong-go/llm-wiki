---
title: systemd 유닛 파일 작성 및 서비스 등록
updated: 2026-07-08 10:32:15
tags:
  - linux
  - systemd
  - service
---

## 1. 유닛 파일 위치

| 경로 | 용도 |
|------|------|
| `/etc/systemd/system/` | 관리자가 직접 작성한 유닛. 최우선 적용 |
| `/usr/lib/systemd/system/` | 패키지 매니저가 설치한 유닛. 직접 수정 금지 |
| `/run/systemd/system/` | 런타임 생성 유닛. 재부팅 시 소멸 |

커스텀 서비스는 `/etc/systemd/system/`에 작성한다.

## 2. 유닛 파일 구조

`.service` 파일은 INI 형식으로 `[Unit]`, `[Service]`, `[Install]` 세 섹션으로 구성된다.

### 2.1. [Unit] 섹션

```ini
[Unit]
Description=My Application          # 서비스 설명 (systemctl status에 표시)
Documentation=https://example.com   # 문서 URL
After=network.target                 # 이 유닛이 시작된 후에 시작
After=network-online.target          # 네트워크 완전 활성화 후 시작 (권장)
Wants=network-online.target          # 약한 의존성 (실패해도 계속)
Requires=postgresql.service          # 강한 의존성 (실패 시 함께 실패)
```

**After vs Requires/Wants:**
- `After=` / `Before=` — 시작 순서만 지정. 의존성을 만들지 않음
- `Wants=` — 약한 의존성. 지정 유닛이 실패해도 본 유닛은 계속 시작
- `Requires=` — 강한 의존성. 지정 유닛이 실패하면 본 유닛도 실패

### 2.2. [Service] 섹션

#### Type

| Type | 사용 시점 |
|------|-----------|
| `simple` (기본) | 프로세스가 포그라운드에서 계속 실행. Spring Boot JAR, Node.js 등 |
| `exec` | simple과 유사하지만 execve() 성공 후 시작으로 간주. simple보다 안전 |
| `forking` | 데몬이 fork 후 부모 종료. 기존 SysV 스타일 데몬 |
| `notify` | 서비스가 `sd_notify(READY=1)`을 직접 전송해 준비 완료 알림 |
| `oneshot` | 한 번 실행 후 종료. 스크립트성 작업. `RemainAfterExit=yes`와 함께 사용 |

#### 실행 설정

```ini
[Service]
Type=simple
User=appuser                             # 실행 사용자 (root 금지)
Group=appgroup                           # 실행 그룹
WorkingDirectory=/opt/myapp             # 작업 디렉터리
ExecStart=/usr/bin/java -jar /opt/myapp/myapp.jar
ExecStop=/bin/kill -TERM $MAINPID        # 종료 명령 (기본: SIGTERM)
ExecReload=/bin/kill -HUP $MAINPID      # reload 명령
```

#### 환경 변수

```ini
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SERVER_PORT=8080"
EnvironmentFile=/etc/myapp/myapp.env    # 파일에서 읽기 (KEY=VALUE 형식)
```

`EnvironmentFile`은 민감한 값(DB 비밀번호 등)을 유닛 파일 외부로 분리할 때 사용. 파일 권한은 `600`으로 설정한다.

#### 재시작 정책

```ini
Restart=on-failure      # 비정상 종료 시 자동 재시작 (권장)
RestartSec=5            # 재시작 전 대기 시간 (기본: 100ms)
```

| Restart 값 | 재시작 조건 |
|------------|-------------|
| `no` | 재시작 안 함 (기본) |
| `on-success` | 정상 종료(exit 0) 시 |
| `on-failure` | 비정상 종료, 시그널, timeout 시 |
| `on-abnormal` | 시그널·timeout·watchdog 시 |
| `always` | 종료 원인 무관하게 항상 |

장기 실행 서비스에는 `on-failure`를 권장한다.

#### 타임아웃

```ini
TimeoutStartSec=30      # 시작 타임아웃 (초)
TimeoutStopSec=30       # 종료 타임아웃. 초과 시 SIGKILL
```

#### 표준 출력·에러

```ini
StandardOutput=journal   # stdout → journald (기본)
StandardError=journal    # stderr → journald (기본)
```

`journal`이 기본값이므로 별도 설정 없이도 `journalctl -u <unit>`으로 로그를 조회할 수 있다.

### 2.3. [Install] 섹션

```ini
[Install]
WantedBy=multi-user.target   # systemctl enable 시 multi-user.target.wants/에 심링크 생성
```

`multi-user.target`은 네트워크가 활성화된 일반 멀티유저 모드로, 대부분의 서버 서비스에 사용한다.

---

## 3. Spring Boot 앱 등록 예시

**/etc/systemd/system/myapp.service**

```ini
[Unit]
Description=My Spring Boot Application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/opt/myapp
EnvironmentFile=/etc/myapp/myapp.env
ExecStart=/usr/bin/java -Xmx512m -jar /opt/myapp/myapp.jar
Restart=on-failure
RestartSec=10
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**/etc/myapp/myapp.env** (권한: 600, 소유자: appuser)

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
DB_PASSWORD=secret
```

---

## 4. 서비스 등록 절차

```bash
# 1. 유닛 파일 작성
sudo vi /etc/systemd/system/myapp.service

# 2. systemd에 변경사항 반영 (파일 추가·수정 시 필수)
sudo systemctl daemon-reload

# 3. 부팅 시 자동 시작 등록
sudo systemctl enable myapp.service

# 4. 즉시 시작
sudo systemctl start myapp.service

# 5. 상태 확인
systemctl status myapp.service
```

## 5. 서비스 제거 절차

```bash
sudo systemctl stop    myapp.service
sudo systemctl disable myapp.service
sudo rm /etc/systemd/system/myapp.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
```

## 6. drop-in으로 기존 유닛 수정

패키지 설치 유닛(`/usr/lib/systemd/system/`)을 수정할 때는 원본 대신 drop-in을 사용한다. 패키지 업그레이드에도 설정이 유지된다.

```bash
# 파일 생성: /etc/systemd/system/<unit>.d/override.conf
sudo systemctl edit nginx.service
```

```ini
# override.conf 예시: 환경변수만 추가
[Service]
Environment="HTTP_PROXY=http://proxy.internal:3128"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx.service
```

---
## Sources
- [systemd.service(5)](https://man7.org/linux/man-pages/man5/systemd.service.5.html)
- [systemd.unit(5)](https://man7.org/linux/man-pages/man5/systemd.unit.5.html)

---
## Related pages
- [[systemctl]]
- [[journalctl]]
- [[environment-variables]]
