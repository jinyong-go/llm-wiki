---
title: 도커 네트워크 드라이버
updated: 2026-10-24 00:27:44
tags:
  - docker
  - network
  - drivers
  - bridge
  - overlay
  - devops
---

## 1. 개요

네트워크 드라이버는 컨테이너의 네트워크 연결 방식과 적용 범위를 정한다. 같은 호스트 안의 연결, 호스트 네트워크 공유, 여러 호스트 간 연결 등 요구사항에 따라 드라이버를 선택한다.

---

## 2. Bridge 드라이버

같은 호스트의 컨테이너 사이 통신에 쓰는 기본 드라이버이다.

### 2.1. 작동 원리

- **기본 구조**: `docker0`와 veth pair 구성은 [[docker-network]] §2에서 다룬다.
- **NAT(Network Address Translation)**: 기본 설정에서 컨테이너가 외부와 통신할 때 출발지 주소를 호스트 IP로 변환한다. `docker run -p <HostPort>:<ContainerPort>`로 지정한 포트 매핑은 호스트 운영체제의 네트워크 규칙으로 구현되며, Linux에서는 `iptables` 규칙 등이 사용된다.
- **DNS(Domain Name System) 해석**: 사용자 정의 브리지에서는 도커 내장 DNS 서버가 컨테이너 이름과 별칭을 해석한다. 기본 브리지는 이를 지원하지 않는다.

### 2.2. 기본 Bridge vs 사용자 정의 Bridge

공식 문서는 사용자 정의 브리지가 기본 브리지보다 우수하다고 설명한다.

| 구분 | 기본 Bridge (`bridge`) | 사용자 정의 Bridge |
| :--- | :--- | :--- |
| 자동 DNS 해석 | 미지원. IP 또는 `--link`로만 통신 | 컨테이너 이름으로 통신 |
| 격리 | 네트워크를 지정하지 않은 모든 컨테이너가 공유 | 같은 네트워크의 컨테이너만 통신 |
| 연결 변경 | 컨테이너를 정지하고 다시 생성 | `connect`/`disconnect`로 실행 중 연결·해제 |
| 설정 | 모든 컨테이너가 같은 설정을 쓰며 변경 시 Docker 재시작 필요 | 네트워크별로 서브넷, 게이트웨이 등 설정 |
| 연결 방식 | 레거시 `--link` 필요 | 이름 기반 자동 탐색 |

---

## 3. Host 드라이버

컨테이너가 호스트의 네트워크 환경을 그대로 사용한다.

### 3.1. 작동 원리

- **격리 없음**: 네트워크 네임스페이스를 분리하지 않아 컨테이너 프로세스가 호스트의 IP와 포트를 직접 점유한다.
- **성능**: 브리지와 NAT를 거치지 않아 네트워크 오버헤드가 작다.
- **주의사항**: 호스트와 포트가 충돌할 수 있고 격리 수준이 낮다. `-p` 등 포트 publish 옵션은 경고와 함께 무시된다.
- **지원 환경**: Docker Engine(Linux)과 Docker Desktop 4.34 이상에서 지원한다. Docker Desktop에서는 L4(TCP/UDP)에서만 동작하고 Linux 컨테이너만 지원한다.

---

## 4. Overlay 드라이버

서로 다른 호스트의 컨테이너를 하나의 가상 네트워크로 연결한다.

### 4.1. 작동 원리

- **VXLAN(Virtual Extensible LAN)**: L2 이더넷 프레임을 L3 UDP 패킷으로 캡슐화해 호스트 간 터널을 만든다.
- **Swarm 필수**: overlay 네트워크를 쓰려면 호스트가 Swarm에 참여해야 하며, 독립 컨테이너만 연결하는 경우에도 같다.
- **데이터 암호화**: `--opt encrypted`로 VXLAN 수준의 IPsec 암호화를 켠다. 무시할 수 없는 성능 저하가 따르며 Windows에서는 지원하지 않는다.

---

## 5. Macvlan 드라이버

컨테이너를 물리 네트워크의 독립 장비처럼 보이게 한다.

### 5.1. 작동 원리

- **하위 인터페이스**: 호스트의 물리 인터페이스(예: `eth0`)를 부모로 가상 하위 인터페이스를 만든다.
- **주소**: 각 컨테이너는 고유한 MAC(Media Access Control) 주소와 물리 네트워크 대역의 IP를 받는다.
- **용도**: 물리 네트워크에 직접 연결되어야 하는 레거시 애플리케이션이나 네트워크 모니터링 애플리케이션에 쓴다.
- **주의**: Linux 커널의 제약으로 호스트와 macvlan 컨테이너는 직접 통신할 수 없다. 컨테이너를 bridge 네트워크에도 연결하거나, 호스트에 같은 부모 인터페이스로 macvlan 인터페이스를 만들어 우회한다.

---

## 6. IPvlan 드라이버

Macvlan과 비슷하지만 MAC 주소 처리와 라우팅 방식이 다르다.

### 6.1. 작동 원리

- **L2 모드**: 모든 컨테이너가 부모 인터페이스의 MAC 주소를 공유하고 IP만 다르게 받는다. 스위치의 MAC 테이블 크기가 제한된 환경에서 Macvlan 대신 쓴다.
- **L3 모드**: 호스트가 컨테이너의 라우터 역할을 한다. L2 브로드캐스트가 발생하지 않아 대규모 네트워크에서 브로드캐스트 부하를 피할 수 있다.

---

## 7. 비교

| 드라이버 | 범위 | 연결 방식 | 주요 조건·특성 |
| :--- | :--- | :--- | :--- |
| Bridge | 단일 호스트 | 브리지 네트워크를 통해 연결하고 외부 통신에 NAT 사용 | 사용자 정의 네트워크에서 컨테이너 이름 DNS 지원 |
| Host | 단일 호스트 | 호스트 네트워크 네임스페이스 공유 | 포트 publish 옵션 무시 |
| Overlay | 여러 Docker 데몬 | 호스트 네트워크 위에 가상 네트워크 구성 | 호스트가 Swarm에 참여해야 함 |
| Macvlan | 물리 LAN | 컨테이너마다 MAC 주소 사용 | 호스트와 컨테이너 간 직접 통신에 제약 |
| IPvlan | 물리 LAN | 부모 인터페이스의 MAC 주소를 공유하고 IP로 구분 | L2·L3 모드 지원 |

---

## Sources
- [Docker Docs: Network drivers](https://docs.docker.com/engine/network/drivers/)
- [Docker Docs: Networking overview](https://docs.docker.com/engine/network/)
- [Docker Docs: Host network driver](https://docs.docker.com/engine/network/drivers/host/)
- [Docker Docs: Overlay network driver](https://docs.docker.com/engine/network/drivers/overlay/)
- [Docker Docs: Macvlan network driver](https://docs.docker.com/engine/network/drivers/macvlan/)

---

## Related pages
- [[docker-network]]
- [[docker-container]]
- [[docker-network-commands]]
