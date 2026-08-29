---
title: 도커 네트워크(Docker Network)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - network
  - bridge
  - devops
---

## 1. 작동 원리
도커는 **컨테이너 네트워크 모델(CNM, Container Network Model)**을 기반으로 네트워크 격리 및 연결을 관리한다.

### 1.1. 기본 구조 (docker0 & veth)
- **`docker0` 브리지**: 도커 설치 시 자동으로 생성되는 가상 이더넷 브리지(소프트웨어 스위치)이다. 기본 IP 대역은 `172.17.0.1`이다.
- **veth(Virtual Ethernet) Pair**: 컨테이너가 생성될 때마다 한 쌍의 veth 인터페이스가 생성된다.
    - 한쪽 끝은 컨테이너 내부의 `eth0`로 할당된다.
    - 다른 한쪽은 호스트의 `docker0` 브리지에 연결된다.
- **네트워크 네임스페이스**: 각 컨테이너는 고유한 네트워크 네임스페이스를 가져 독립적인 네트워크 스택을 유지한다.

---

## 2. 네트워크 드라이버 (Network Drivers)
도커는 목적에 따라 다양한 네트워크 환경을 제공한다. 각 드라이버의 상세한 작동 원리와 내부 아키텍처는 [[docker-network-drivers]] 페이지에서 다룬다.

| 드라이버 | 특징 | 주요 용도 |
| :--- | :--- | :--- |
| **`bridge`** | **기본 드라이버**. 컨테이너 간 통신 및 외부 연결 지원. | 동일 호스트 내 컨테이너 간 통신 |
| **`host`** | 컨테이너가 호스트의 네트워크 스택을 직접 공유. | 고성능 네트워크 필요 시 (포트 매핑 불필요) |
| **`overlay`** | 여러 도커 데몬(호스트) 간의 연결 지원. | Docker Swarm, 멀티 호스트 클러스터 |
| **`ipvlan`** | IPv4/IPv6 주소 지정을 정밀하게 제어. MAC 주소 부족 시 유용. | L2/L3 언더레이 네트워크 통합 |
| **`macvlan`** | 컨테이너에 고유 MAC 주소 부여, 물리 네트워크에 직접 연결. | 레거시 앱, 실제 물리 장비처럼 인식 필요 시 |
| **`none`** | 네트워킹 비활성화. | 네트워크가 필요 없는 독립 작업 |

---

## 3. 주요 명령어 (Commands)
| 명령어 | 설명 |
| :--- | :--- |
| `docker network ls` | 생성된 네트워크 목록 확인 |
| `docker network create` | 새 네트워크 생성 (`--driver` 지정 가능) |
| `docker network inspect` | 네트워크 상세 설정 및 연결된 컨테이너 확인 |
| `docker network connect` | 컨테이너를 특정 네트워크에 연결 |
| `docker network disconnect` | 컨테이너를 네트워크에서 분리 |
| `docker network prune` | 미사용 네트워크 일괄 삭제 |

---

## 4. 백엔드 개발자 실무 팁
- **사용자 정의 브리지 네트워크**: 기본 `bridge` 네트워크는 컨테이너 이름으로의 이름 해석(DNS)을 지원하지 않지만, **사용자 정의 네트워크**는 별도 설정 없이 컨테이너 이름으로 서로를 찾을 수 있어 MSA 구성 시 필수적이다.
- **포트 매핑**: `docker run -p <HostPort>:<ContainerPort>`를 통해 호스트의 포트를 컨테이너 네트워크와 연결한다.

---

## Sources
- [Networking overview](https://docs.docker.com/engine/network/)
- [Network drivers](https://docs.docker.com/engine/network/drivers/)

---

## Related pages
- [[docker-overview]]
- [[docker-container]]
- [[docker-network-drivers]]

