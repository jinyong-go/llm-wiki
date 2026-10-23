---
title: 도커 보안과 격리
updated: 2026-10-24 00:27:44
tags:
  - docker
  - security
  - namespace
  - isolation
  - best-practices
---

## 1. 개요

컨테이너 보안은 컨테이너 프로세스의 권한과 호스트 자원 접근을 제한하는 데서 시작한다. 비특권 사용자 실행, user namespace, capability 제한, 자원 제한을 함께 고려한다.

---

## 2. User Namespace

Linux 네임스페이스는 프로세스에 격리된 시스템 자원 뷰를 제공하며, user namespace는 그중 UID·GID를 격리한다.

### 2.1. 원리

데몬의 `userns-remap` 설정은 컨테이너 내부의 UID·GID를 호스트의 subordinate ID 범위에 매핑한다. 예를 들어 컨테이너의 root(UID 0)는 호스트에서 231072 같은 비특권 UID로 보일 수 있다. 이 매핑은 컨테이너 프로세스가 호스트에서 갖는 권한을 줄인다. `userns-remap`을 사용해도 Docker 데몬은 root 권한으로 실행되며, 데몬까지 비특권 사용자로 실행하는 방식은 Rootless mode다.

### 2.2. 설정

`/etc/docker/daemon.json`에 설정을 추가하고 데몬을 재시작한다. `default`를 지정하면 `dockremap` 사용자와 그룹이 생성된다.

```json
{
  "userns-remap": "default"
}
```

### 2.3. 제한 사항

데몬에서 user namespace를 활성화하면 다음 기능과 호환되지 않는다.

- 호스트의 PID나 네트워크 네임스페이스 공유(`--pid=host`, `--network=host`)
- 사용자 매핑을 지원하지 않는 외부 볼륨·스토리지 드라이버
- `--userns=host` 없이 `--privileged` 사용

---

## 3. 권장 사항

### 3.1. non-root 사용자

Dockerfile에서 전용 사용자를 만들고 `USER`로 전환한다. 애플리케이션에 root 권한이 필요하지 않다면 일반 사용자로 실행해 공격 표면을 줄인다.

```dockerfile
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```

### 3.2. 특권 모드 제한

`--privileged`는 컨테이너에 모든 capability와 호스트 장치 접근을 허용해 격리를 약화한다. 특정 권한만 필요하면 `--cap-add`로 해당 capability만 부여한다.

### 3.3. 리소스 제한

한 컨테이너가 호스트 자원을 모두 소모해 다른 서비스를 멈추게 하는 DoS(Denial of Service)를 막기 위해 cgroups로 CPU와 메모리를 제한한다.

```bash
docker run --memory="512m" --cpus="1.5" <image>
```

### 3.4. 베이스 이미지

Alpine, distroless 같은 경량 베이스 이미지를 써서 셸, 패키지 매니저 등 공격에 쓰일 수 있는 바이너리를 줄인다([[dockerfile]] §3.1).

---

## Sources
- [Docker Docs: Isolate containers with a user namespace](https://docs.docker.com/engine/security/userns-remap/)
- [Docker Docs: Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker Docs: What is Docker?](https://docs.docker.com/get-started/docker-overview/)

---

## Related pages
- [[docker-overview]]
- [[docker-container]]
- [[dockerfile]]
- [[docker-image]]
