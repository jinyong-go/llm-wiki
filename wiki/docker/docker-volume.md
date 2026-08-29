---
title: 도커 볼륨 및 데이터 마운트 가이드 (Docker Volumes & Mounts)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - storage
  - volume
  - bind-mount
  - persistence
  - performance
---

도커 컨테이너의 데이터 영속성 계층인 볼륨의 원리와 다양한 마운트 방식(Volumes, Bind Mounts, tmpfs)을 정리합니다.

## 1. 개요 및 작동 원리
도커 컨테이너의 파일 시스템은 기본적으로 **휘발성(Ephemeral)**입니다. 컨테이너가 삭제되면 내부의 변경 사항도 모두 사라지는데, 이를 해결하기 위해 호스트의 파일 시스템과 컨테이너 내부의 특정 경로를 연결(Mount)하는 기술이 볼륨입니다.

- **원리:** 리눅스의 마운트 개념을 활용하여, 컨테이너 유니온 파일 시스템(UnionFS)의 특정 레이어 위에 호스트의 디렉터리를 덮어씌워 데이터를 공유합니다.

### 1.1. CoW 성능 저하와 볼륨의 필요성
도커 이미지는 **Copy-on-Write(CoW)** 방식을 사용합니다. 컨테이너 내부에서 기존 파일을 수정할 때, 하위 레이어에서 상위 쓰기 레이어로 파일을 복사(Copy-up)한 후 수정이 발생합니다.
- **성능 문제**: 대용량 파일이나 깊은 디렉터리 구조에서 쓰기 작업이 빈번할 경우 이 복사 과정이 심각한 I/O 오버헤드를 유발합니다.
- **해결책**: **볼륨**은 CoW 시스템을 우회하여 호스트 파일 시스템에 직접 쓰기 때문에 네이티브 수준의 성능을 제공합니다. 따라서 DB 데이터 디렉터리 등은 반드시 볼륨을 사용해야 합니다.

## 2. 마운트 방식별 파일 처리 동작

### 2.1. 볼륨 (Volumes) - Populate & Shadowing
- **비어 있는 볼륨**: 볼륨을 특정 경로에 마운트할 때 해당 볼륨이 비어 있다면, 컨테이너의 기존 파일들이 볼륨으로 **복사(Populate)**됩니다.
- **데이터가 있는 볼륨**: 이미 데이터가 들어 있는 볼륨을 마운트하면, 컨테이너의 기존 내용은 가려지고 볼륨의 내용만 보입니다(**Shadowing**).

### 2.2. 바인드 마운트 (Bind Mounts) - Overwriting
- 호스트의 경로를 마운트하면 컨테이너 내부의 기존 경로는 무조건 **덮어씌워집니다**. 호스트 측이 비어 있다면 컨테이너 내부도 비어 보이게 됩니다.

## 3. 마운트 타입 비교 요약

| 비교 항목 | 볼륨 (Volumes) | 바인드 마운트 (Bind Mounts) | tmpfs |
| :--- | :--- | :--- | :--- |
| **저장 위치** | 도커 관리 영역 (Linux 기준 `/var/lib/docker/volumes/`) | 호스트의 모든 경로 | 호스트 메모리 (RAM) |
| **관리 주체** | Docker CLI | 사용자 (Host OS) | Host 커널 |
| **데이터 유지** | 컨테이너 삭제 후에도 유지 | 유지 | 컨테이너 정지 시 삭제 |
| **이식성** | 높음 (환경에 영향받받지 않음) | 낮음 (특정 경로에 의존) | 없음 |
| **성능 (Linux)** | 높음 | 높음 | **최상** |
| **초기 파일 처리** | 컨테이너 파일을 볼륨으로 복사 가능 (Populate) | 컨테이너 파일을 무조건 덮어씀 | 해당 없음 |

## 4. 사용 예시 및 명령어

### 4.1. 데이터베이스 영속성 (Volumes)
```bash
# DB 볼륨 생성 및 마운트 실행
docker volume create postgres_data
docker run -d -v postgres_data:/var/lib/postgresql/data postgres
```

### 4.2. 개발 소스 동기화 (Bind Mounts)
```bash
# 호스트의 현재 경로를 컨테이너의 /app으로 연결
docker run -d -v $(pwd):/app -w /app node:latest npm start
```

---

## Sources
- [Guide to Docker Volumes](https://www.baeldung.com/ops/docker-volumes)
- [Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/)
- [Volumes](https://docs.docker.com/engine/storage/volumes/)

---

## Related pages
- [[docker-container]]
- [[docker-image]]
- [[docker-volume-commands]]
