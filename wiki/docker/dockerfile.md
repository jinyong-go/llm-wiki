---
title: 도커파일
updated: 2026-10-24 00:27:44
tags:
  - docker
  - container
  - devops
  - build
  - best-practices
---

## 1. 개요

Dockerfile은 이미지 빌드 단계를 순서대로 정의하는 텍스트 파일이다. 빌더는 각 지시어를 위에서 아래로 처리해 이미지를 만든다.

---

## 2. 동작

### 2.1. 레이어

`RUN`, `COPY`, `ADD`는 읽기 전용 레이어를 만들며, 레이어 구조는 [[docker-image]] §2.1에서 다룬다.

### 2.2. 빌드 캐시

도커는 이전 빌드에서 만든 레이어를 재사용해 빌드 시간을 줄인다. 어떤 지시어나 복사 대상 파일이 바뀌면 그 이후 모든 지시어의 캐시가 무효화되므로, 자주 바뀌는 소스 코드 복사는 뒤쪽에 둔다.

---

## 3. 작성 규칙

### 3.1. 이미지 크기

- **멀티 스테이지 빌드**: 빌드 도구와 실행 결과물을 다른 스테이지로 분리해 최종 이미지 크기를 줄인다.
- **패키지 설치와 정리**: 캐시가 오래된 패키지 목록을 재사용하지 않도록 `apt-get update`와 `apt-get install`을 같은 `RUN`에서 실행한다. 패키지 목록 파일을 같은 단계에서 삭제하면 이미지 크기도 줄일 수 있다.
- **경량 베이스 이미지**: `alpine`, distroless, `-slim` 태그 등 패키지가 적은 이미지를 베이스로 쓴다.

### 3.2. 신뢰성·보안

- **베이스 이미지 고정**: 태그(`:latest`) 대신 다이제스트(`@sha256:...`)를 지정해 빌드 재현성을 확보한다.
- **베이스 이미지 갱신**: `docker build --pull`로 빌드할 때마다 최신 베이스 이미지를 확인한다.
- **non-root 사용자**: `USER` 지시어로 root가 아닌 사용자로 실행한다([[docker-security]] §3.1).

### 3.3. 유지보수

- **멀티라인 인수 정렬**: `apt-get install` 등의 패키지 목록을 알파벳순으로 정렬해 중복을 막는다.
- **`.dockerignore`**: `.git`, `node_modules` 등 빌드에 불필요한 파일을 빌드 컨텍스트에서 제외해 빌드 시간을 줄이고 민감한 파일이 이미지에 들어가지 않게 한다.

---

## 4. 주요 지시어

지시어별 상세 동작과 실행 형식은 [[dockerfile-directives]]에서 다룬다.

| 지시어 | 용도 |
| :--- | :--- |
| `FROM` | 베이스 이미지 지정 |
| `WORKDIR` | 이후 명령의 작업 디렉터리 설정 |
| `COPY`, `ADD` | 파일을 이미지로 복사. `ADD`는 원격 URL과 tar 자동 해제 지원 |
| `RUN` | 빌드 시점에 명령 실행 |
| `ENV`, `ARG` | 환경 변수와 빌드 시점 변수 정의 |
| `ENTRYPOINT` | 컨테이너 시작 시 실행할 주 명령 |
| `CMD` | 컨테이너 시작 시 기본 인자 또는 명령 |

---

## Sources
- [Baeldung: Difference Between run, cmd and entrypoint in a Dockerfile](https://www.baeldung.com/ops/dockerfile-run-cmd-entrypoint)
- [Docker Docs: Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker Docs: Optimize for building in the cloud](https://docs.docker.com/build-cloud/optimization/)

---

## Related pages
- [[docker-overview]]
- [[docker-image]]
- [[docker-container]]
- [[dockerfile-directives]]
