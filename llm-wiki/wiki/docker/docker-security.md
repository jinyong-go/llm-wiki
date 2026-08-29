---
title: 도커 보안 및 격리 (Docker Security & Isolation)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - security
  - namespace
  - isolation
  - best-practices
---

도커 컨테이너의 보안을 강화하기 위한 핵심 기술인 사용자 네임스페이스 격리와 주요 보안 권장 사항을 정리합니다.

## 1. 사용자 네임스페이스 격리 (User Namespace)
리눅스 네임스페이스는 실행 중인 프로세스에 격리된 시스템 자원 뷰를 제공합니다. 그중 **User Namespace**는 컨테이너 보안의 핵심입니다.

### 1.1. 원리 (`userns-remap`)
- 컨테이너 내부의 `root` (UID 0) 사용자를 호스트 머신의 **비특권 사용자(unprivileged user)**로 매핑합니다.
- 컨테이너 내에서는 모든 권한을 가진 root처럼 동작하지만, 실제 호스트 시스템에서는 아무런 권한이 없는 높은 번호의 UID(예: 231072)로 인식됩니다.
- **효과**: 컨테이너 침해 사고 발생 시, 공격자가 컨테이너를 탈출하더라도 호스트 시스템에 대해 어떠한 관리자 권한도 행사할 수 없습니다.

### 1.2. 설정 방법 (`daemon.json`)
`/etc/docker/daemon.json` 파일에 설정을 추가하여 활성화합니다.
```json
{
  "userns-remap": "default"
}
```
- `default` 설정 시 `dockremap`이라는 전용 사용자와 그룹이 자동으로 생성됩니다.
- 설정 후 도커 데몬을 재시작하면 적용됩니다.

---

## 2. 주요 보안 베스트 프랙티스

### 2.1. Non-Root 사용자 사용
Dockerfile 작성 시, 애플리케이션 실행 전 전용 사용자를 생성하고 전환하는 것이 권장됩니다.
```dockerfile
# 유저 생성 및 전환
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```
- 애플리케이션이 반드시 루트 권한을 필요로 하지 않는다면, 항상 일반 사용자로 실행하여 공격 표면을 줄여야 합니다.

### 2.2. 특권 모드(`--privileged`) 제한
- `--privileged` 플래그는 컨테이너에 호스트의 모든 장치 접근 권한을 부여하며 격리를 무력화합니다.
- 반드시 필요한 경우가 아니라면 사용을 금지하고, 대신 필요한 특정 권한만 부여하는 `--cap-add` 사용을 고려해야 합니다.

### 2.3. 리소스 제한 (Cgroups)
- 특정 컨테이너가 호스트의 모든 자원을 소모하여 다른 서비스에 영향을 주는 DoS 공격을 방지하기 위해 CPU와 메모리 제한을 설정합니다.
- 예: `docker run --memory="512m" --cpus="1.5" ...`

### 2.4. 불필요한 패키지 제거
- `Alpine`이나 `Distroless`와 같은 경량 베이스 이미지를 사용하여 이미지 내에 포함된 취약한 바이너리(셸, 패키지 매니저 등)를 최소화합니다.

---

## 3. 알려진 제한 사항
사용자 네임스페이스를 사용할 경우 다음과 같은 기능이 제한될 수 있습니다.
- 호스트의 PID나 네트워크 네임스페이스 공유 (`--pid=host`, `--network=host`).
- 일부 외부 볼륨 드라이버와의 호환성 문제.

---

## Sources
- [Isolate containers with a user namespace](https://docs.docker.com/engine/security/userns-remap/)
- [Building best practices](https://docs.docker.com/build/building/best-practices/)
- [What is Docker?](https://docs.docker.com/get-started/docker-overview/)

---

## Related pages
- [[docker-overview]]
- [[docker-container]]
- [[dockerfile]]
- [[docker-image]]
