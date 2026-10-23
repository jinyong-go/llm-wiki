---
title: 도커 네트워크 CLI
updated: 2026-10-24 00:27:44
tags:
  - docker
  - network
  - cli
  - troubleshooting
---

## 1. 명령어

이 문서는 네트워크 생성·조회·연결에 사용하는 명령과 컨테이너 간 통신 문제를 점검하는 기본 절차를 정리한다.

| 명령어 | 설명 | 예시 |
| :--- | :--- | :--- |
| `docker network ls` | 네트워크 목록 조회 | `docker network ls` |
| `docker network create` | 네트워크 생성 | `docker network create my-net` |
| `docker network inspect` | 서브넷, 연결된 컨테이너 등 상세 정보 조회 | `docker network inspect my-net` |
| `docker network connect` | 컨테이너를 네트워크에 연결 | `docker network connect my-net app` |
| `docker network disconnect` | 컨테이너를 네트워크에서 분리 | `docker network disconnect my-net app` |
| `docker network rm` | 네트워크 삭제 | `docker network rm my-net` |
| `docker network prune` | 사용하지 않는 네트워크 일괄 삭제 | `docker network prune -f` |

`docker network create`의 기본 드라이버는 bridge이며, 기본 bridge와 사용자 정의 bridge의 차이는 [[docker-network-drivers#2.2. 기본 Bridge vs 사용자 정의 Bridge|docker-network-drivers §2.2]]에서 다룬다.

---

## 2. 디버깅

컨테이너 간 통신이 되지 않으면 다음 순서로 점검한다.

```mermaid
flowchart LR
    A[네트워크 소속 확인] -->|정상| B[컨테이너 내부 진단]
    B -->|정상| C[호스트 점검]
    A -->|미연결| X[docker network connect]
```

### 2.1. 연결 상태

컨테이너가 대상 네트워크에 연결되어 있는지 확인한다.

```bash
docker inspect <container_name> --format '{{json .NetworkSettings.Networks}}'
```

### 2.2. 컨테이너 내부

`docker exec`로 컨테이너 안에서 네트워크 도구를 실행한다.

- **DNS 조회**: 사용자 정의 네트워크에서 `nslookup <target_container_name>`으로 이름 해석을 확인한다.
- **ping**: `ping <target_ip_or_name>`으로 도달 여부를 확인한다.
- **포트 응답**: `curl -I http://<target>:<port>`로 서비스 응답을 확인한다.

### 2.3. 호스트

- **IP forwarding**: 외부와 통신하려면 `cat /proc/sys/net/ipv4/ip_forward` 값이 `1`이어야 한다.
- **iptables**: `sudo iptables -L -n`으로 도커 규칙이 방화벽 규칙에 막히지 않았는지 확인한다.
- **포트 충돌**: `ss -tuln`으로 호스트 포트를 다른 프로세스가 점유하고 있는지 확인한다.

---

## Sources
- [Docker Docs: Networking overview](https://docs.docker.com/engine/network/)
- [Docker Docs: Network drivers](https://docs.docker.com/engine/network/drivers/)

---

## Related pages
- [[docker-network]]
- [[docker-network-drivers]]
- [[docker-container-commands]]
