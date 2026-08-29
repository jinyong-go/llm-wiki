---
title: 도커파일(Dockerfile)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - container
  - devops
  - build
  - best-practices
---

## 1. 개요
도커파일(Dockerfile)은 도커 이미지를 생성하기 위한 일련의 명령어를 포함하는 텍스트 파일이다. 사용자가 명령줄에서 호출할 수 있는 모든 명령을 포함하며, 이를 통해 이미지 빌드 과정을 자동화한다.

## 2. 작동 원리
### 2.1. 레이어 구조 (Layering)
- 각 지시어(`RUN`, `COPY`, `ADD`)는 새로운 **읽기 전용 레이어**를 생성한다.
- 여러 레이어가 쌓여 최종 이미지를 구성하며, 이는 저장 공간과 네트워크 대역폭을 효율적으로 사용하게 한다.

### 2.2. 빌드 캐싱 (Build Caching)
- 도커는 빌드 속도를 높이기 위해 이전 빌드에서 생성된 레이어를 재사용한다.
- **캐시 무효화**: 특정 지시어나 복사되는 파일이 변경되면, 그 이후의 모든 지시어에 대한 캐시가 무효화된다. 따라서 자주 변경되는 코드 복사는 가급적 뒤쪽에 배치하는 것이 유리하다.

---

## 3. 베스트 프랙티스 (Best Practices)

### 3.1. 이미지 크기 최적화
- **멀티 스테이지 빌드**: 빌드 도구와 결과물을 분리하여 최종 이미지 용량을 줄인다.
- **레이어 최소화**: 관련 명령어를 `&&`로 묶어 하나의 `RUN` 레이어로 합친다.
- **경량 베이스 이미지**: `alpine` 등 최소한의 패키지만 포함된 이미지를 기반으로 사용한다.

### 3.2. 빌드 신뢰성 및 보안
- **베이스 이미지 버전 고정 (Pinning)**: 태그(`:latest`) 대신 다이제스트(`@sha256:...`)를 사용하여 빌드 재현성을 보장하고 예상치 못한 변경을 방지한다.
- **최신 상태 유지**: `--pull` 플래그를 사용하여 빌드 시 항상 최신 베이스 이미지를 체크한다.
- **Non-Root 사용자**: `USER` 지시어를 사용하여 컨테이너를 루트 권한이 아닌 사용자로 실행한다.

### 3.3. 유지보수 및 가독성
- **멀티라인 인수 정렬**: `apt-get install` 등에서 패키지 목록을 알파벳순으로 정렬하여 중복을 방지하고 가독성을 높인다.
- **`.dockerignore` 활용**: 빌드에 불필요한 파일(`.git`, `node_modules` 등)을 제외하여 빌드 속도를 높이고 보안 유출을 방지한다.

---

## 4. 주요 지시어 요약
각 지시어의 상세 활용법과 실행 형식(Exec vs Shell)은 **[[dockerfile-directives]]**에서 자세히 다룬다.

| 지시어 | 핵심 용도 |
| :--- | :--- |
| `FROM` | 베이스 이미지 지정 (빌드의 시작점). |
| `WORKDIR` | 이후 명령이 실행될 작업 디렉터리 설정. |
| `COPY` / `ADD` | 파일을 이미지로 복사 (`COPY` 권장, `ADD`는 자동 압축 해제 기능 포함). |
| `RUN` | 빌드 시점에 명령 실행 및 새 레이어 생성. |
| `ENV` / `ARG` | 환경 변수 및 빌드 시점 변수 정의. |
| `ENTRYPOINT` | 컨테이너 실행 시 호출될 **주요 명령**. |
| `CMD` | 컨테이너 실행 시 **기본 인자** 또는 명령 제공. |

---

## Sources
- [Difference Between run, cmd and entrypoint in a Dockerfile](https://www.baeldung.com/ops/dockerfile-run-cmd-entrypoint)
- [Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Dockerfiles :: Spring Boot](https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html)
- [Optimize for building in the cloud](https://docs.docker.com/build-cloud/optimization/)

---

## Related pages
- [[docker-overview]]
- [[docker-image]]
- [[docker-container]]
- [[dockerfile-directives]]
