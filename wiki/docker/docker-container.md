---
title: 도커 컨테이너
updated: 2026-09-01 11:43:12
tags:
  - docker
  - container
  - namespace
  - cgroup
  - oci
  - lifecycle
---

도커 컨테이너의 기술적 본질, 격리 원리, 생명주기 및 모니터링 메커니즘을 상세히 정리합니다.

## 1. 컨테이너의 정의와 본질
도커 컨테이너는 운영체제 수준의 가상화 기술을 이용해 애플리케이션과 그 실행에 필요한 모든 라이브러리, 의존성을 하나로 묶은 **실행 가능한 인스턴스**입니다.
- **프로세스 격리:** 가상 머신(VM)처럼 별도의 OS를 띄우는 것이 아니라, 호스트 OS의 커널을 공유하며 프로세스 단위로 격리되어 실행됩니다.
- **경량성:** 하드웨어 가상화가 없어 오버헤드가 매우 적고 시작 속도가 밀리초(ms) 단위로 빠릅니다.

## 2. 핵심 작동 원리 (Linux Kernel Primitives)
컨테이너는 Linux 커널의 여러 기능을 조합하여 격리된 환경을 구축합니다.
- **Namespaces (격리)**: PID, NET, MNT, UTS, IPC, USER 네임스페이스를 통해 프로세스, 네트워크, 파일시스템 등을 논리적으로 분리합니다.
- **Control Groups (Cgroups, 자원 제한)**: CPU, 메모리, Disk I/O 등 하드웨어 자원 사용량을 제어하여 "Noisy Neighbor" 문제를 방지합니다.
- **Union File System (UnionFS)**: [[docker-image]]의 읽기 전용 레이어 위에 컨테이너 전용 **쓰기 가능(Writable) 레이어**를 추가합니다 (Copy-on-Write 방식).

## 3. 컨테이너 생명주기 상태 (Lifecycle States)
컨테이너는 상태에 따라 자원 소비 방식이 달라집니다.

| 상태 | 설명 | 자원 소비 |
| :--- | :--- | :--- |
| **Created** | `docker create` 직후 상태. 한 번도 시작되지 않음. | CPU/정지된 메모리 사용 안 함. |
| **Running** | 프로세스가 격리된 환경에서 실제로 구동 중인 상태. | CPU 및 메모리 정상 소비. |
| **Restarting** | 재시작 정책에 의해 다시 시작되는 과정 중인 상태. | 일시적 자원 소비. |
| **Paused** | 모든 프로세스가 일시 중단된 상태 (`docker pause`). | **CPU 해제, 메모리 점유 유지**. |
| **Exited** | 프로세스가 종료된 상태 (정상 종료 또는 오류). | 자원 소비 안 함 (파일시스템은 유지). |
| **Dead** | 제거 시도 중 외부 자원 점유 등의 이유로 삭제에 실패한 비정상 상태. | 자원 소비 안 함. 삭제만 가능. |

## 4. 모니터링 및 상태 확인
### 4.1. 컨테이너 상태 조회
```bash
# 전체 컨테이너 상태 확인
docker ps -a

# 특정 컨테이너 상태만 출력
docker inspect -f '{{.State.Status}}' <container_id>
```

### 4.2. 자원 사용량 실시간 모니터링 (`docker stats`)
실시간으로 컨테이너의 성능 지표를 확인할 수 있습니다.
- **CPU %**: 호스트 CPU 대비 사용량.
- **MEM USAGE / LIMIT**: 현재 메모리 사용량 및 설정된 제한값.
- **NET I/O**: 네트워크 송수신량.
- **BLOCK I/O**: 디스크 I/O.
- **PIDS**: 컨테이너 내에서 생성된 프로세스/스레드 수.

```bash
# 모든 실행 중인 컨테이너 통계 보기
docker stats

# 스트리밍 없이 한 번만 출력
docker stats --no-stream
```

## 5. 컨테이너 런타임 아키텍처 (OCI)
도커는 표준화된 컨테이너 실행을 위해 **OCI(Open Container Initiative)** 표준을 따르는 모듈형 구조를 가집니다.
- **dockerd**: 고수준 API 처리.
- **containerd**: 컨테이너 생명주기 및 이미지/스토리지 관리.
- **runc**: 실제 리눅스 커널 기능을 호출하여 컨테이너 환경을 생성하는 저수준 런타임.

---

## Sources
- [What is Docker?](https://docs.docker.com/get-started/docker-overview/)
- [States of a Docker Container](https://www.baeldung.com/ops/docker-container-states)
- [docker container stats](https://docs.docker.com/reference/cli/docker/container/stats/)

---

## Related pages
- [[docker-overview]]
- [[docker-image]]
- [[docker-container-commands]]
- [[docker-volume]]
