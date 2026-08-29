---
title: 도커 컨테이너 명령어 상세 가이드 (Docker Container CLI)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - container
  - cli
  - commands
  - ops
---

컨테이너의 전체 라이프사이클을 제어하고 관리하기 위한 주요 CLI 명령어와 실무 활용 예시를 정리합니다.

## 1. 라이프사이클 제어 (Lifecycle)

### 1.1. docker run
이미지로부터 새로운 컨테이너를 생성하고 실행합니다.
- **주요 옵션 상세:**
    - `-d, --detach`: 백그라운드 모드로 실행. 터미널 제어권을 즉시 반환하며 컨테이너 ID만 출력합니다.
    - `-i, --interactive`: 표준 입력(STDIN)을 열어둡니다. 컨테이너와 상호작용이 필요한 경우 필수입니다.
    - `-t, --tty`: 가상 터미널(TTY)을 할당합니다. 쉘(`bash`, `sh`)을 사용할 때 텍스트 포맷과 색상 등을 제대로 보려면 `-it` 조합으로 주로 사용합니다.
    - `-p, --publish`: 포트 매핑 (`호스트:컨테이너`). 외부 네트워크 요청을 컨테이너 내부 포트로 전달합니다.
    - `-v, --volume`: 볼륨 마운트. 호스트 경로를 컨테이너 내부에 연결하여 데이터를 유지합니다.
    - `-e, --env`: 환경 변수 설정. 애플리케이션 설정을 주입할 때 사용합니다.
    - `--rm`: 컨테이너 종료 시 관련 리소스(쓰기 가능 레이어 등)를 자동으로 삭제합니다. 일회성 테스트에 유용합니다.
    - `--restart`: 재시작 정책 (`always`: 항상 재시작, `on-failure`: 에러 발생 시만, `unless-stopped`: 수동 정지 전까지).

---

## 2. 상호작용 및 운영 (Operation)

### 2.1. docker exec
실행 중인 컨테이너 내부에서 새로운 프로세스를 실행합니다.
- **주요 옵션 상세:**
    - **`-it` (Interactive + TTY):** 컨테이너 내부의 쉘에 접속할 때 사용합니다. `-i`는 입력을 가능하게 하고, `-t`는 터미널 화면처럼 보이게 해줍니다.
    - **`-u, --user`:** 특정 사용자(UID/이름) 권한으로 명령을 실행합니다. 기본적으로 Dockerfile에 정의된 사용자로 실행되지만, 설정 수정 등을 위해 `root` 권한이 필요할 때 `-u root`로 우회할 수 있습니다.
    - **`-w, --workdir`:** 명령이 실행될 초기 작업 디렉터리를 지정합니다.
- **실무 예시:**
    ```bash
    # root 사용자로 접속하여 패키지 업데이트
    docker exec -u root -it my-web-server apt-get update
    ```

### 2.2. docker cp
호스트와 컨테이너 사이에서 파일을 주고받습니다.
- **형식:** `docker cp [소스] [대상]`
- **특징:** 컨테이너가 정지된 상태에서도 동작하며, 컨테이너 이름을 경로의 일부로 사용합니다 (`컨테이너명:경로`).

### 2.3. 기타 생명주기 제어
- **`docker stop`**: 실행 중인 컨테이너에 `SIGTERM`을 보내고, 일정 시간 후 `SIGKILL`을 보내 안전하게 정지시킵니다.
- **`docker kill`**: 실행 중인 컨테이너에 즉시 `SIGKILL`을 보내 강제 종료합니다.
- **`docker restart`**: 컨테이너를 정지 후 다시 시작합니다.
- **`docker rm`**: 정지된 컨테이너를 삭제합니다. (`-f` 옵션 시 실행 중인 컨테이너도 강제 삭제)
- **`docker container prune`**: 정지된 모든 컨테이너를 일괄 삭제합니다.

---

## 3. 정보 조회 및 진단 (Inspection)

### 3.1. docker inspect
컨테이너의 모든 메타데이터를 JSON 형식으로 출력합니다.
- **주요 옵션 상세:**
    - **`-f, --format`:** Go 템플릿 문법을 사용하여 방대한 JSON 데이터 중 **특정 필드만 추출**합니다.
- **Go 템플릿 활용 패턴:**
    ```bash
    # 컨테이너 IP 주소만 추출
    docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <ID>

    # 컨테이너의 로그 경로 확인
    docker inspect -f '{{.LogPath}}' <ID>

    # 마운트된 볼륨 목록 확인
    docker inspect -f '{{json .Mounts}}' <ID>
    ```

### 3.2. docker ps
컨테이너 목록을 조회합니다.
- **주요 옵션 상세:**
    - `-a, --all`: 실행 중인 것뿐만 아니라 종료된 모든 컨테이너를 보여줍니다.
    - `-q, --quiet`: 컨테이너 ID만 출력합니다. `docker rm $(docker ps -aq)`와 같이 일괄 작업 시 유용합니다.
    - `-s, --size`: 컨테이너의 크기를 출력합니다.
        - **size**: 컨테이너의 쓰기 가능 레이어에 사용된 데이터 양.
        - **virtual size**: 베이스 이미지 크기 + 쓰기 가능 레이어 크기.
    - `-f, --filter`: `status=exited`, `name=my-app` 등 조건별 필터링을 수행합니다.

### 3.3. docker logs
컨테이너의 로그를 확인합니다.
- **주요 옵션 상세:**
    - `-f, --follow`: 로그 출력을 실시간으로 계속 보여줍니다 (Tail -f와 유사).
    - `-n, --tail`: 마지막 몇 줄부터 보여줄지 지정합니다 (기본값 all).
    - `-t, --timestamps`: 로그 각 줄 앞에 타임스탬프를 표시합니다.
    - `--since`: 특정 시간(예: `10m`, `2024-05-01`) 이후의 로그만 조회합니다.

---

## 4. 자원 제한 및 관리

### 4.1. docker stats
모든 실행 중인 컨테이너의 CPU, 메모리, 네트워크/디스크 I/O 사용량을 실시간 스트리밍합니다. 시스템 부하 진단 시 필수 명령어입니다.

### 4.2. docker update
실행 중인 컨테이너의 자원 한도를 동적으로 변경합니다.
- **예시:** `docker update --cpus 2 --memory 4g my-app` (중단 없이 스펙 변경 가능)

---

## Sources
- [docker container](https://docs.docker.com/reference/cli/docker/container/)
- [docker container stats](https://docs.docker.com/reference/cli/docker/container/stats/)
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/)

---

## Related pages
- [[docker-container]]
- [[docker-overview]]
- [[docker-volume-commands]]
