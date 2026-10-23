---
title: 도커 볼륨과 데이터 마운트
updated: 2026-10-24 00:28:11
tags:
  - docker
  - storage
  - volume
  - bind-mount
  - persistence
  - performance
---

## 1. 개요

컨테이너를 제거하면 쓰기 가능 레이어의 데이터도 사라진다. 볼륨은 Docker가 관리하며 컨테이너 수명과 별도로 데이터를 유지할 수 있다. 바인드 마운트는 호스트의 지정 경로를 컨테이너에 연결한다(§2.2). 바인드 마운트는 이미지의 기존 경로 내용을 가리며, 빈 볼륨은 기본 설정에서 해당 경로의 파일을 볼륨으로 복사한다(§2.1).

### 1.1. 성능

고전 스토리지 드라이버에서는 쓰기 가능 레이어의 기존 파일을 수정할 때 CoW(Copy-on-Write) copy-up이 발생할 수 있다([[docker-image]] §4). 볼륨은 이 쓰기 가능 레이어를 거치지 않으므로, 쓰기가 많은 데이터에는 볼륨을 사용하는 편이 적합하다. 실제 성능은 저장소와 실행 환경에 따라 달라진다.

---

## 2. 초기 파일 처리

### 2.1. 볼륨

- **빈 볼륨**: 비어 있는 볼륨을 마운트하면 컨테이너의 해당 경로에 있던 파일이 볼륨으로 복사(populate)된다. `volume-nocopy` 옵션을 지정하면 복사하지 않는다.
- **데이터가 있는 볼륨**: 컨테이너의 기존 내용은 가려지고 볼륨의 내용만 보인다.

### 2.2. 바인드 마운트

호스트 경로를 마운트하면 컨테이너의 기존 경로 내용은 가려진다. 호스트 경로가 비어 있으면 컨테이너 안에서도 빈 디렉터리로 보인다.

---

## 3. 비교

| 항목 | 볼륨 | 바인드 마운트 | tmpfs |
| :--- | :--- | :--- | :--- |
| 저장 위치 | 도커 관리 영역(Linux는 `/var/lib/docker/volumes/`) | 호스트의 임의 경로 | 호스트 메모리 |
| 관리 주체 | 도커 | 사용자 | 호스트 커널 |
| 데이터 유지 | 컨테이너 삭제 후에도 유지 | 유지 | 컨테이너 정지 시 삭제 |
| 이식성 | 높음. 호스트 경로에 의존하지 않음 | 낮음. 특정 경로에 의존 | 없음 |
| 초기 파일 처리 | 빈 볼륨이면 컨테이너 파일 복사 | 컨테이너 내용을 가림 | 해당 없음 |

---

## 4. 예시

### 4.1. 데이터베이스

```bash
docker volume create postgres_data
docker run -d -v postgres_data:/var/lib/postgresql/data postgres
```

### 4.2. 소스 동기화

```bash
# 호스트의 현재 디렉터리를 컨테이너의 /app에 연결
docker run -d -v $(pwd):/app -w /app node:latest npm start
```

---

## Sources
- [Baeldung: Guide to Docker Volumes](https://www.baeldung.com/ops/docker-volumes)
- [Docker Docs: Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Docker Docs: Storage drivers](https://docs.docker.com/engine/storage/drivers/)
- [Docker Docs: Volumes](https://docs.docker.com/engine/storage/volumes/)

---

## Related pages
- [[docker-container]]
- [[docker-image]]
- [[docker-volume-commands]]
