---
title: 도커 컨테이너
updated: 2026-10-24 00:27:44
tags:
  - docker
  - container
  - namespace
  - cgroup
  - oci
  - lifecycle
---

## 1. 개요

Docker 컨테이너는 이미지에서 생성한 격리된 프로세스 실행 환경이다. Linux에서는 커널 기능을 이용해 프로세스와 네트워크를 분리하고 컨테이너별 자원 사용을 제어한다.

- **프로세스 격리**: VM처럼 별도 OS를 실행하지 않고 호스트 OS의 커널을 공유하며 프로세스 단위로 격리된다.
- **경량성**: 하드웨어 가상화가 없어 오버헤드가 적고 VM보다 빠르게 시작한다.

---

## 2. 격리 원리

컨테이너는 Linux 커널의 여러 기능을 조합해 격리된 환경을 만든다.

- **네임스페이스(Namespaces)**: PID, NET, MNT, UTS, IPC 네임스페이스로 프로세스, 네트워크, 파일 시스템 등을 논리적으로 분리한다. USER 네임스페이스는 `userns-remap` 또는 Rootless mode처럼 사용자 네임스페이스를 사용하는 설정에서 적용된다([[docker-security]] §2).
- **cgroups(Control Groups)**: CPU, 메모리, 디스크 I/O 등 자원 사용을 제어해 한 컨테이너가 다른 컨테이너의 자원을 과도하게 사용하는 상황을 제한한다.
- **UnionFS(Union File System)**: [[docker-image]]의 읽기 전용 레이어 위에 컨테이너 전용 쓰기 가능 레이어를 CoW(Copy-on-Write) 방식으로 추가한다.

---

## 3. 상태

컨테이너는 상태에 따라 자원 소비 방식이 달라진다.

| 상태 | 설명 | 자원 소비 |
| :--- | :--- | :--- |
| Created | `docker create` 직후 한 번도 시작되지 않은 상태 | CPU·메모리 사용 안 함 |
| Running | 프로세스가 격리된 환경에서 실행 중인 상태 | CPU·메모리 소비 |
| Restarting | 재시작 정책에 따라 다시 시작하는 중인 상태 | 일시적 소비 |
| Paused | `docker pause`로 모든 프로세스가 일시 중단된 상태 | CPU 해제, 메모리 점유 유지 |
| Exited | 프로세스가 정상 종료 또는 오류로 끝난 상태 | 사용 안 함, 파일 시스템 유지 |
| Removing | `docker rm`으로 삭제가 진행 중인 상태 | 해제 진행 중 |
| Dead | 외부 프로세스의 자원 점유 등으로 삭제에 실패한 상태 | 사용 안 함, 삭제만 가능 |

상태 조회 명령은 [[docker-container-commands]] §3에서 다룬다.

---

## 4. 런타임 구조

도커는 OCI(Open Container Initiative) 표준을 따르는 모듈형 구조로 컨테이너를 실행한다.

- **dockerd**: 고수준 API를 처리한다.
- **containerd**: 컨테이너 생명주기와 이미지·스토리지를 관리한다.
- **runc**: Linux 커널 기능을 호출해 컨테이너 환경을 생성하는 저수준 런타임이다.

---

## Sources
- [Docker Docs: What is Docker?](https://docs.docker.com/get-started/docker-overview/)
- [Baeldung: States of a Docker Container](https://www.baeldung.com/ops/docker-container-states)
- [Docker Docs: docker container ls](https://docs.docker.com/reference/cli/docker/container/ls/)

---

## Related pages
- [[docker-overview]]
- [[docker-image]]
- [[docker-container-commands]]
- [[docker-volume]]
