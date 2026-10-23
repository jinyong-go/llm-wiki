---
title: 도커 개요
updated: 2026-10-24 00:27:44
tags:
  - docker
  - container
  - devops
  - backend
---

## 1. 개요

Docker는 컨테이너 이미지를 빌드하고 컨테이너를 실행·배포·관리하는 플랫폼이다. 애플리케이션과 실행 환경을 이미지로 묶어 여러 환경에서 일관되게 실행할 수 있다.

---

## 2. 필요성

물리 서버에서 서비스를 직접 구동하는 대신 추상화 계층을 두는 이유는 다음과 같다.

- **유연성·확장성**: 구성 변경과 호스트 간 이동이 쉽고, 필요에 따라 인스턴스를 늘리거나 줄일 수 있다.
- **자원 효율**: 하드웨어 자원을 동적으로 할당해 유휴 자원을 줄인다.
- **프로세스 격리**: 서비스별 코드, 설정, 의존성을 분리해 한 서비스의 업데이트가 다른 서비스에 영향을 주지 않는다.
- **환경 일관성**: 개발, 테스트, 운영 환경을 같은 이미지로 실행해 환경 차이로 인한 오류를 줄인다.

---

## 3. VM 비교

가장 큰 차이는 OS 커널의 공유 여부와 가상화 수준이다.

| 구분 | 도커 컨테이너 | 가상 머신 |
| :--- | :--- | :--- |
| 핵심 기술 | Docker Engine | 하이퍼바이저(Hypervisor) |
| OS 구조 | Linux 컨테이너는 호스트 Linux 커널 공유 | 게스트 OS 포함 |
| 격리 수준 | 커널 기능을 이용한 프로세스 격리 | 하드웨어 가상화 기반 격리 |
| 시작 | 프로세스 실행 수준 | 게스트 OS 부팅 필요 |
| 이식성 | 엔진만 있으면 동일하게 실행 | 이미지 이동은 가능하나 크기가 큼 |

### 3.1. 동작 방식

- **도커**: 호스트 OS의 커널 기능으로 프로세스를 격리한다. 가상 하드웨어 계층이 없어 오버헤드가 작다.
- **VM**: 하이퍼바이저가 하드웨어를 가상화하고 그 위에 전체 OS를 실행한다. 격리 수준이 더 높고, 호스트와 다른 커널이나 OS를 실행할 수 있다.

이 비교는 Linux 컨테이너를 기준으로 한다. macOS와 Windows의 Docker Desktop은 Linux 컨테이너를 실행할 때 Linux 가상 머신을 사용한다. 격리에 쓰이는 커널 기능은 [[docker-container]] §2에서 다룬다.

---

## 4. 핵심 개념

- **[[docker-image]]**: 애플리케이션 실행에 필요한 요소를 담은 읽기 전용 템플릿이며 계층형 파일 시스템을 사용한다.
- **[[docker-container]]**: 이미지를 실행한 인스턴스이며 이미지 위에 쓰기 가능 레이어가 추가된다.
- **[[dockerfile]]**: 이미지를 생성하는 명령어를 담은 빌드 스크립트이다.
- **레지스트리(Registry)**: 이미지를 저장하고 배포하는 시스템이며 Docker Hub, Amazon ECR(Elastic Container Registry) 등이 있다.

---

## Sources
- [Docker Docs: What is Docker?](https://docs.docker.com/get-started/docker-overview/)
- [Baeldung: Docker Guide](https://www.baeldung.com/ops/docker-guide)
- [Baeldung: Docker and Containers vs. Virtual Machines](https://www.baeldung.com/cs/containers-vs-virtual-machines)

---

## Related pages
- [[docker-image]]
- [[docker-container]]
- [[dockerfile]]
- [[docker-security]]
- [[docker-network]]
- [[docker-volume]]
