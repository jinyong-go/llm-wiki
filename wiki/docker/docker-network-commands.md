---
title: Docker 네트워크 CLI
updated: 2026-09-01 11:43:12
tags:
  - docker
  - network
  - cli
  - troubleshooting
---

Docker 네트워크를 관리하기 위한 주요 명령어와 문제 해결을 위한 디버깅 절차를 정리합니다.

## 1. 주요 네트워크 CLI 명령어

| 명령어 | 설명 | 예시 |
| :--- | :--- | :--- |
| `docker network ls` | 호스트의 모든 네트워크 목록 조회 | `docker network ls` |
| `docker network create` | 새 네트워크 생성 (기본 bridge) | `docker network create my-net` |
| `docker network inspect` | 네트워크 상세 구성 정보(IP, 연결된 컨테이너 등) 확인 | `docker network inspect my-net` |
| `docker network connect` | 실행 중인 컨테이너를 특정 네트워크에 연결 | `docker network connect my-net app` |
| `docker network disconnect`| 컨테이너를 네트워크에서 분리 | `docker network disconnect my-net app`|
| `docker network rm` | 특정 네트워크 삭제 | `docker network rm my-net` |
| `docker network prune` | 사용 중이지 않은 모든 네트워크 일괄 삭제 | `docker network prune -f` |

---

## 2. 네트워크 구성 권장 사항

Docker는 보안과 유연한 서비스 탐색을 위해 기본 `bridge` 네트워크보다는 **사용자 정의(User-defined) 브릿지 네트워크** 사용을 강력히 권장합니다.

- **핵심 이유:** 자동 DNS 해소(Container Name 기반 통신), 서비스 간 격리, 실시간 네트워크 연결/분리 가능 등.
- **상세 차이점:** 기본 브릿지와 사용자 정의 브릿지의 기술적 차이는 [[docker-network-drivers#기본-bridge-vs-사용자-정의-bridge]]에서 확인할 수 있습니다.

---

## 3. 네트워크 디버깅 및 트러블슈팅

네트워크 통신이 되지 않을 경우 다음 순서로 점검합니다.

### 3.1. 1단계: 연결 상태 확인
컨테이너가 실제로 해당 네트워크에 속해 있는지 확인합니다.
```bash
docker inspect <container_name> --format '{{json .NetworkSettings.Networks}}'
```

### 3.2. 2단계: 컨테이너 내부 진단
`docker exec`를 통해 컨테이너 안에서 직접 네트워크 도구를 실행합니다.
- **DNS 조회:** `nslookup <target_container_name>` (사용자 정의 네트워크인 경우)
- **Ping 테스트:** `ping <target_ip_or_name>`
- **포트 응답:** `curl -I http://<target>:<port>`

### 3.3. 3단계: 호스트 레벨 점검
- **IP Forwarding:** `cat /proc/sys/net/ipv4/ip_forward` 값이 `1`이어야 외부와 통신 가능합니다.
- **Iptables:** 도커의 규칙이 방화벽에 의해 차단되지 않았는지 확인합니다 (`sudo iptables -L -n`).
- **포트 충돌:** 호스트의 포트가 이미 다른 프로세스에 의해 점유되었는지 확인합니다 (`netstat -tuln`).

---

## Sources
- [Networking overview](https://docs.docker.com/engine/network/)
- [Network drivers](https://docs.docker.com/engine/network/drivers/)

---

## Related pages
- [[docker-network]]
- [[docker-network-drivers]]
- [[docker-container-commands]]
