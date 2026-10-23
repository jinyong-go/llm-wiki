---
title: 도커 볼륨 관리 CLI
updated: 2026-10-24 00:27:44
tags:
  - docker
  - volume
  - cli
---

## 1. 관리 명령어

이 문서는 볼륨을 생성·조회·삭제하고 컨테이너에 연결하는 명령을 정리한다. 삭제와 백업 명령은 대상 데이터의 수명에 유의해 사용한다.

### 1.1. docker volume create

이름을 지정해 볼륨을 생성한다.

- **`--driver`**: 볼륨 드라이버를 지정한다. 기본값은 `local`이다.
- **`--label`**: 볼륨에 메타데이터 라벨을 추가한다.

```bash
docker volume create my-data
```

### 1.2. docker volume ls

호스트의 볼륨 목록을 조회한다.

- **`-f, --filter`**: 조건으로 필터링한다. `dangling=true`는 어떤 컨테이너도 참조하지 않는 볼륨만 조회한다.
- **`-q, --quiet`**: 볼륨 이름만 출력한다.

### 1.3. docker volume inspect

볼륨의 드라이버, 옵션, 저장 경로 등을 JSON으로 출력한다. `Mountpoint` 필드에서 호스트상의 실제 저장 위치를 확인할 수 있다.

```bash
docker volume inspect my-data
```

### 1.4. docker volume rm

볼륨을 삭제한다. 컨테이너가 사용 중인 볼륨은 삭제할 수 없으므로 먼저 컨테이너를 제거한다.

```bash
docker volume rm my-data
```

### 1.5. docker volume prune

어떤 컨테이너도 참조하지 않는 볼륨을 삭제한다. 기본으로는 익명 볼륨만 삭제하고, `-a, --all`(API 1.42+)을 지정하면 사용하지 않는 named 볼륨도 삭제한다.

```bash
docker volume prune
docker volume prune -a
```

---

## 2. 마운트 옵션

`docker run`에서 `-v` 또는 `--mount`로 볼륨을 컨테이너에 연결한다.

### 2.1. -v

`-v <볼륨명>:<컨테이너_경로>[:<옵션>]` 형식의 짧은 문법이다.

```bash
# 읽기 전용 마운트
docker run -d -v my-data:/app/data:ro nginx
```

### 2.2. --mount

`key=value` 쌍으로 지정하는 명시적 문법이며 공식 문서는 일반적으로 `--mount`를 권장한다.

```bash
docker run -d --mount source=my-data,target=/app/data nginx
```

---

## 3. 정리·백업

- **정리**: `docker rm -v`는 컨테이너와 연결된 익명 볼륨만 삭제하고 named 볼륨은 남긴다. 남은 볼륨은 `docker volume prune`으로 정리하며, named 볼륨까지 지우려면 `-a`를 지정한다.
- **백업**: 볼륨을 마운트한 임시 컨테이너에서 `tar`로 묶어 호스트 디렉터리에 저장한다.

```bash
# my-data 볼륨을 현재 디렉터리의 backup.tar로 백업
docker run --rm -v my-data:/data -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /data
```

---

## Sources
- [Docker Docs: Volumes](https://docs.docker.com/engine/storage/volumes/)
- [Baeldung: Guide to Docker Volumes](https://www.baeldung.com/ops/docker-volumes)
- [Docker Docs: Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Docker Docs: docker volume prune](https://docs.docker.com/reference/cli/docker/volume/prune/)
- [Docker Docs: docker container rm](https://docs.docker.com/reference/cli/docker/container/rm/)

---

## Related pages
- [[docker-volume]]
- [[docker-container-commands]]
