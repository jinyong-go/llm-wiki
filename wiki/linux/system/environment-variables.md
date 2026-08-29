---
title: 환경변수 — 개념, 설정, 조회, 활용
updated: 2026-07-14 17:27:27
tags:
  - linux
  - bash
  - cli
  - devops
---

## 1. 개념

환경변수(environment variable)는 프로세스에 전달되는 **`KEY=VALUE` 형태의 문자열 쌍**이다. 운영체제가 각 프로세스에 제공하며, 자식 프로세스는 부모로부터 환경변수를 상속받는다.

**셸 변수 vs 환경변수**

| 구분 | 설명 | 자식 프로세스 상속 |
|------|------|:-:|
| 셸 변수 | 현재 셸 세션에만 존재 (`VAR=value`) | ✗ |
| 환경변수 | `export`로 내보낸 변수 | ✓ |

```bash
# 셸 변수 (자식에게 전달 안 됨)
MYVAR=hello
bash -c 'echo $MYVAR'   # 출력 없음

# 환경변수 (자식에게 전달됨)
export MYVAR=hello
bash -c 'echo $MYVAR'   # hello
```

---

## 2. 조회

```bash
# 현재 환경의 모든 환경변수 출력
env
printenv

# 특정 변수 값만 출력
printenv PATH
printenv JAVA_HOME LANG USER   # 여러 개 동시 조회

# echo로 단일 변수 출력
echo $HOME
echo $PATH

# 현재 셸의 모든 변수(환경변수 + 셸 변수 + 함수) 출력
set

# export된 변수만 목록으로 확인
export -p         # declare -x 형태로 출력
declare -x        # 동일

# 특정 변수가 설정됐는지 확인
[[ -z "$JAVA_HOME" ]] && echo "JAVA_HOME 미설정" || echo "JAVA_HOME=$JAVA_HOME"
```

> `env`와 `printenv`는 환경변수만 출력한다. `set`은 환경변수에 더해 export되지 않은 셸 변수와 함수까지 모두 출력한다.

---

## 3. 설정 및 해제

### 3.1. 설정

```bash
# 셸 변수 (현재 셸에서만 유효)
VAR=value
MY_LIST="item1 item2"

# 환경변수로 내보내기
export VAR=value
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# 기존 셸 변수를 export (값 재지정 없이)
VAR=hello
export VAR

# 한 명령어 실행 동안만 환경변수 오버라이드 (현재 셸 변경 없음)
PORT=9090 java -jar app.jar
DB_URL=jdbc:postgresql://staging/db ./run-tests.sh
```

### 3.2. 해제

```bash
unset VAR          # 셸 변수 및 환경변수 모두 삭제
unset -v VAR       # 변수만 삭제 (함수 제외)
unset -f myfunc    # 함수만 삭제

# export 취소 (변수는 유지, 환경변수에서만 제거)
export -n VAR
```

---

## 4. 범위와 영속성

| 범위 | 방법 | 유지 시점 |
|------|------|-----------|
| 한 명령어만 | `VAR=value COMMAND` | 해당 명령 실행 중만 |
| 현재 셸 세션 | `export VAR=value` | 셸 종료 시 소멸 |
| 현재 사용자 (영구) | `~/.bashrc` 또는 `~/.profile` | 로그인/셸 시작 시 로드 |
| 시스템 전역 (영구) | `/etc/environment` 또는 `/etc/profile.d/` | 모든 사용자에게 적용 |

### 4.1. 영구 설정 파일

```bash
# ~/.bashrc: 비로그인 인터랙티브 셸마다 실행 (터미널 새 탭 등)
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc   # 현재 셸에 즉시 적용

# ~/.profile: 로그인 셸 1회 실행. GUI 로그인 세션 포함
echo 'export MY_TOKEN=abc123' >> ~/.profile

# /etc/environment: 시스템 전역. KEY=VALUE 형식만 허용 (스크립트 문법 불가)
echo 'LANG=ko_KR.UTF-8' | sudo tee -a /etc/environment

# /etc/profile.d/*.sh: 시스템 전역. 스크립트 형식 가능
echo 'export APP_ENV=production' | sudo tee /etc/profile.d/myapp.sh
```

> `.bashrc`는 `bash` 전용이다. `zsh`는 `~/.zshrc`를 사용한다. 두 셸 모두 지원하려면 `~/.profile`에 넣는다.

---

## 5. 변수 확장

| 문법 | 동작 |
|------|------|
| `$VAR` / `${VAR}` | 변수 값으로 치환. `${VAR}`는 `${VAR}text` 처럼 경계 명확화에 사용 |
| `${VAR:-default}` | VAR가 미설정이거나 빈 문자열이면 default 사용 (VAR 변경 없음) |
| `${VAR:=default}` | VAR가 미설정이거나 빈 문자열이면 default를 VAR에 대입하고 반환 |
| `${VAR:+alt}` | VAR가 설정됐으면 alt 반환, 미설정이면 빈 문자열 |
| `${VAR:?message}` | VAR가 미설정이면 message 출력 후 스크립트 종료 |
| `${#VAR}` | VAR 값의 문자열 길이 |
| `${VAR#prefix}` | 앞에서 가장 짧은 prefix 패턴 제거 |
| `${VAR##prefix}` | 앞에서 가장 긴 prefix 패턴 제거 |
| `${VAR%suffix}` | 뒤에서 가장 짧은 suffix 패턴 제거 |
| `${VAR%%suffix}` | 뒤에서 가장 긴 suffix 패턴 제거 |
| `${VAR/old/new}` | 첫 번째 매칭 치환 |
| `${VAR//old/new}` | 모든 매칭 치환 |

```bash
# 기본값 활용
PORT=${PORT:-8080}
DB_HOST=${DB_HOST:-localhost}

# 필수 변수 검증 (미설정 시 즉시 종료)
: ${DATABASE_URL:?"DATABASE_URL must be set"}
: ${API_KEY:?"API_KEY must be set"}

# 경로 조작
FILE=/var/log/app.log
echo ${FILE##*/}    # app.log (파일명만)
echo ${FILE%/*}     # /var/log (디렉터리만)
echo ${FILE%.log}   # /var/log/app (확장자 제거)
```

---

## 6. env — 환경 제어 실행

```bash
env [options] [NAME=VALUE...] [COMMAND [ARG...]]
```

| 옵션 | 설명 |
|------|------|
| `-i` / `--ignore-environment` | 완전히 비어있는 환경으로 시작 |
| `-u NAME` / `--unset=NAME` | 특정 변수를 제거한 환경으로 실행 |
| `-C DIR` / `--chdir=DIR` | 실행 디렉터리 변경 |
| `-S STR` / `--split-string` | 문자열을 공백 기준으로 분리 (shebang에서 다중 인자 전달 시 사용) |
| `(인자 없음)` | 현재 환경변수 전체 출력 |

```bash
# 환경변수 확인
env

# 특정 변수만 오버라이드해서 실행
env PORT=9090 APP_ENV=staging java -jar app.jar

# 완전히 격리된 환경으로 실행 (PATH 등 없음)
env -i HOME=$HOME PATH=/usr/bin:/bin bash --norc

# 특정 변수 제거 후 실행
env -u JAVA_OPTS java -jar app.jar

# shebang에서 PATH 기반으로 인터프리터 탐색
#!/usr/bin/env python3
#!/usr/bin/env -S python3 -u         # -S로 인자 여러 개 전달
#!/usr/bin/env -S node --experimental-modules
```

> `#!/usr/bin/env python3`은 `python3` 위치가 시스템마다 다를 때 PATH에서 탐색하도록 하는 표준 shebang 패턴이다.

---

## 7. printenv — 환경변수 출력

```bash
printenv               # 모든 환경변수 출력
printenv PATH          # PATH 값만 출력
printenv HOME USER SHELL   # 여러 변수 동시 출력
printenv -0 PATH       # NUL 구분자 출력 (파이프라인 처리용)
```

`env`와 달리 printenv는 출력 전용이며 명령어를 실행하지 않는다.

---

## 8. envsubst — 텍스트 내 환경변수 치환

설정 파일 템플릿에서 `$VAR` 또는 `${VAR}` 형식을 실제 환경변수 값으로 치환한다. `gettext-base` 패키지에 포함.

```bash
envsubst [SHELL-FORMAT]
```

- 인자 없이 실행하면 stdin에서 읽어 모든 `$VAR`/`${VAR}` 치환
- `SHELL-FORMAT` 인자로 치환할 변수 범위를 제한

```bash
# 기본 치환
echo "Server: $HOST:$PORT" | envsubst

# 템플릿 파일 처리
envsubst < config.template > config.yml
envsubst < nginx.conf.template | sudo tee /etc/nginx/nginx.conf

# 특정 변수만 치환 (다른 $VAR는 그대로 유지)
envsubst '${HOST} ${PORT}' < config.template > config.yml

# -v: 템플릿에 사용된 변수 목록만 출력 (치환 안 함)
envsubst -v '${HOST} ${PORT} ${APP_ENV}'
```

**배포 템플릿 예시:**

```bash
# config.template
server:
  host: ${DB_HOST}
  port: ${DB_PORT}
  name: ${DB_NAME}
  password: ${DB_PASSWORD}

# 배포 스크립트
export DB_HOST=prod-db.internal
export DB_PORT=5432
export DB_NAME=myapp
export DB_PASSWORD=$(cat /run/secrets/db_password)

envsubst < config.template > /app/config.yml
```

---

## 9. 주요 환경변수

| 변수 | 설명 |
|------|------|
| `PATH` | 실행 파일 탐색 경로. `:` 구분 |
| `HOME` | 현재 사용자의 홈 디렉터리 |
| `USER` / `LOGNAME` | 현재 사용자명 |
| `SHELL` | 로그인 셸 경로 |
| `PWD` | 현재 작업 디렉터리 |
| `OLDPWD` | 이전 작업 디렉터리 (`cd -`의 기반) |
| `LANG` / `LC_ALL` | 로케일 설정. 인코딩, 정렬, 날짜 형식 영향 |
| `TZ` | 시간대 설정. 예: `Asia/Seoul` |
| `TERM` | 터미널 타입. 색상·키 처리 기반 |
| `EDITOR` / `VISUAL` | 기본 텍스트 에디터 |
| `TMPDIR` | 임시 파일 디렉터리 (기본 `/tmp`) |
| `PS1` | 프롬프트 문자열 |
| `IFS` | 내부 필드 구분자 (기본: 공백/탭/개행) |
| `JAVA_HOME` | JDK 설치 경로. Maven·Gradle 등이 참조 |
| `MAVEN_HOME` | Maven 설치 경로 |

---

## 10. 자주 쓰는 패턴

```bash
# Spring Boot: 프로파일·포트 환경변수로 실행
SPRING_PROFILES_ACTIVE=prod SERVER_PORT=8080 java -jar app.jar

# 필수 환경변수 일괄 검증 (스크립트 시작부)
set -euo pipefail
: ${DATABASE_URL:?"DATABASE_URL must be set"}
: ${REDIS_URL:?"REDIS_URL must be set"}
: ${JWT_SECRET:?"JWT_SECRET must be set"}

# 환경변수 파일(.env) 로드
set -a                  # 이후 모든 변수를 자동 export
source .env
set +a

# 또는 export 없이 안전하게 로드
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  export "$key=$value"
done < .env

# PATH에 경로 추가 (중복 방지)
[[ ":$PATH:" != *":/opt/myapp/bin:"* ]] && export PATH="/opt/myapp/bin:$PATH"

# 현재 환경변수를 다른 사용자/프로세스에 전달
env | grep "^APP_" > /tmp/app_env   # APP_ 접두사 변수만 저장
env $(cat /tmp/app_env | xargs) ./worker.sh

# 민감 정보 노출 없이 디버깅 (특정 변수 제외)
env | grep -v "PASSWORD\|SECRET\|TOKEN\|KEY"

# Docker/컨테이너 환경변수 확인
docker exec <container> env
docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' <container>

# envsubst로 Kubernetes ConfigMap 생성
envsubst < k8s/deployment.yaml.template | kubectl apply -f -
```

---

## Sources
- [env(1)](https://man7.org/linux/man-pages/man1/env.1.html)
- [printenv(1)](https://man7.org/linux/man-pages/man1/printenv.1.html)
- [envsubst-Invocation](https://www.gnu.org/software/gettext/manual/html_node/envsubst-Invocation.html)
- [Environment](https://www.gnu.org/software/bash/manual/html_node/Environment.html)

---

## Related pages
- [[shell-special-parameters]]
- [[standard-streams]]
- [[grep]]
- [[sed]]
- [[awk]]
- [[java-version]]
- [[directory-navigation]]
