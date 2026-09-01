---
title: 도커 볼륨 관리 CLI
updated: 2026-09-01 11:43:12
tags:
  - docker
  - volume
  - cli
  - management
---

도커 볼륨을 생성, 조회, 삭제 및 관리하기 위한 주요 CLI 명령어와 실무 예시를 정리합니다.

## 1. 주요 관리 명령어 (Subcommands)

### 1.1. docker volume create
새로운 이름을 가진 볼륨을 생성합니다.
- **예시:** `docker volume create my-data`
- **주요 옵션:**
    - `--driver`: 특정 볼륨 드라이버 지정 (기본값: `local`)
    - `--label`: 볼륨에 메타데이터(라벨) 추가

### 1.2. docker volume ls
현재 호스트에 존재하는 모든 볼륨의 목록을 확인합니다.
- **예시:** `docker volume ls`
- **주요 옵션:**
    - `-f, --filter`: 특정 조건으로 필터링 (예: `dangling=true` - 사용 중이지 않은 볼륨만 조회)
    - `-q, --quiet`: 볼륨 이름만 출력

### 1.3. docker volume inspect
하나 이상의 볼륨에 대한 상세 정보(저장 경로, 드라이버, 옵션 등)를 JSON 형식으로 출력합니다.
- **예시:** `docker volume inspect my-data`
- **활용:** `Mountpoint` 필드를 통해 호스트 상의 실제 데이터 저장 위치를 확인할 수 있습니다.

### 1.4. docker volume rm
하나 이상의 볼륨을 삭제합니다.
- **주의:** 컨테이너에 의해 사용 중인 볼륨은 삭제할 수 없습니다. 먼저 컨테이너를 제거해야 합니다.
- **예시:** `docker volume rm my-data`

### 1.5. docker volume prune
현재 컨테이너에서 사용하고 있지 않은 모든 로컬 볼륨을 일괄 삭제합니다. 데이터 유실 위험이 있으므로 주의해서 사용해야 합니다.
- **예시:** `docker volume prune`

---

## 2. 컨테이너 실행 시 마운트 예시

볼륨은 보통 `docker run` 명령 시 `-v` 또는 `--mount` 옵션을 통해 컨테이너에 연결됩니다.

### 2.1. -v (Short Syntax)
가장 일반적으로 사용되는 짧은 형식입니다.
- **형식:** `-v [볼륨명]:[컨테이너_경로]:[옵션]`
- **예시:** `docker run -d -v my-data:/app/data:ro nginx` (읽기 전용 마운트)

### 2.2. --mount (Explicit Syntax)
Docker에서 공식적으로 권장하는 보다 명시적인 형식입니다.
- **형식:** `--mount source=[볼륨명],target=[컨테이너_경로],[추가옵션]`
- **예시:** `docker run -d --mount source=my-data,target=/app/data nginx`

---

## 3. 실무 팁

- **Dangling 볼륨 정리:** 컨테이너 삭제 시 `-v` 옵션을 붙이지 않으면 볼륨은 남게 되어 'Dangling' 상태가 됩니다. 주기적으로 `docker volume prune`으로 정리해주는 것이 좋습니다.
- **백업 및 복구:** 볼륨 데이터를 백업하려면 해당 볼륨을 마운트한 임시 컨테이너를 실행하여 타르볼(tar)로 압축하는 방식을 주로 사용합니다.
    ```bash
    # 볼륨 데이터를 호스트의 backup.tar로 백업
    docker run --rm -v my-data:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data
    ```

---

## Sources
- [Volumes](https://docs.docker.com/engine/storage/volumes/)
- [Guide to Docker Volumes](https://www.baeldung.com/ops/docker-volumes)
- [Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)

---

## Related pages
- [[docker-volume]]
- [[docker-container-commands]]
