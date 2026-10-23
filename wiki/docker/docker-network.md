---
title: 도커 네트워크
updated: 2026-10-24 00:27:44
tags:
  - docker
  - network
  - bridge
  - devops
---

## 1. 개요

Docker 네트워크는 컨테이너를 서로 연결하고 네트워크 격리를 설정하는 단위다. 컨테이너는 네트워크 드라이버가 제공하는 방식으로 하나 이상의 네트워크에 연결된다.

---

## 2. 기본 구조

- **기본 브리지**: Linux Docker Engine은 기본 `bridge` 네트워크와 호스트의 `docker0` 브리지를 사용한다. 기본 서브넷은 환경 설정에 따라 달라질 수 있으며, 흔히 `172.17.0.0/16`이 사용된다.
- **veth(Virtual Ethernet) pair**: 브리지 네트워크에 연결된 컨테이너는 veth 쌍을 통해 호스트 브리지와 연결될 수 있다. 한쪽 인터페이스는 컨테이너 네트워크 네임스페이스에, 다른 쪽은 호스트 브리지에 연결된다.

---

## 3. 드라이버

드라이버별 작동 원리는 [[docker-network-drivers]]에서 다룬다.

| 드라이버 | 특징 | 용도 |
| :--- | :--- | :--- |
| `bridge` | 기본 드라이버. 컨테이너 간 통신과 외부 연결 지원 | 같은 호스트 내 컨테이너 간 통신 |
| `host` | 호스트의 네트워크 스택을 직접 공유 | 포트 매핑 없이 호스트 네트워크 사용 |
| `overlay` | 여러 도커 데몬 사이의 연결 지원 | Swarm, 멀티 호스트 클러스터 |
| `ipvlan` | IPv4·IPv6 주소 지정을 직접 제어 | L2·L3 언더레이 네트워크 통합 |
| `macvlan` | 컨테이너에 고유 MAC(Media Access Control) 주소를 부여해 물리 네트워크에 직접 연결 | 물리 장비처럼 보여야 하는 레거시 애플리케이션 |
| `none` | 네트워킹 비활성화 | 네트워크가 필요 없는 작업 |

---

## Sources
- [Docker Docs: Networking overview](https://docs.docker.com/engine/network/)
- [Docker Docs: Network drivers](https://docs.docker.com/engine/network/drivers/)

---

## Related pages
- [[docker-overview]]
- [[docker-container]]
- [[docker-network-drivers]]
- [[docker-network-commands]]
