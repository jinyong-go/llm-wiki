---
title: 도커파일 지시어
updated: 2026-09-01 11:43:12
tags:
  - docker
  - dockerfile
  - instructions
  - devops
---

## 1. 실행 형식: Exec Form vs Shell Form
`RUN`, `CMD`, `ENTRYPOINT` 지시어는 명령을 실행하는 두 가지 형식을 지원한다.

### 1.1. Exec Form
권장 형식이다.
- **형식**: `["executable", "param1", "param2"]`
- **특징**:
    - JSON 배열 형태로 작성한다.
    - 셸을 호출하지 않고 실행 파일을 직접 실행한다.
    - **PID 1 처리**: 실행 파일이 컨테이너의 PID 1이 되어 커널 시그널(`SIGTERM`)을 직접 받을 수 있다. 이는 애플리케이션의 **우아한 종료(Graceful Shutdown)**를 위해 필수적이다.
    - 셸 변수(예: `$VAR`) 확장이 수행되지 않는다.
- **예시**: `ENTRYPOINT ["java", "-jar", "app.jar"]`

### 1.2. Shell Form
- **형식**: `command param1 param2`
- **특징**:
    - 일반적인 셸 명령어 형태로 작성한다.
    - 내부적으로 `/bin/sh -c`를 통해 실행된다.
    - 셸 환경 변수 확장, 파이프(`|`), 리다이렉션(`>`) 등을 사용할 수 있다.
    - **문제점**: 실행 파일이 PID 1인 셸의 자식 프로세스로 실행되므로, `docker stop` 시 시그널이 앱에 전달되지 않아 강제 종료될 위험이 있다.
- **예시**: `RUN apt-get update && apt-get install -y git`

---

## 2. RUN: 명령 실행 및 캐시 관리

### 2.1. 캐시 버스팅 (Cache Busting)
`RUN` 지시어는 빌드 성능을 위해 캐싱되지만, 패키지 관리자 사용 시 주의가 필요하다.
- **잘못된 예시**: `RUN apt-get update`와 `RUN apt-get install -y curl`을 별도 레이어로 두면, 나중에 패키지 목록만 추가했을 때 `update` 레이어는 캐시를 사용하게 되어 구버전 패키지를 설치하거나 빌드에 실패할 수 있다.
- **권장 방식**: `RUN apt-get update && apt-get install -y ...`와 같이 **업데이트와 설치를 하나의 RUN 문으로 묶어야** 한다. 이를 통해 패키지 목록이 변경될 때만 `update`가 다시 실행되도록 강제할 수 있다.

---

## 3. 복사: COPY vs ADD

### 3.1. COPY
- 호스트의 파일이나 디렉터리를 이미지 내부로 복사하는 기본 지시어이다.
- 기능이 단순하고 투명하여 가장 널리 권장된다.
- **빌드 컨텍스트 최적화**: `.dockerignore`를 통해 불필요한 파일이 복사되지 않도록 관리해야 한다.

### 3.2. ADD
- `COPY` 기능 + 원격 URL 다운로드 및 자동 압축 해제 지원.
- **압축 해제 용도**: 로컬의 `tar.gz` 등을 복사하면서 즉시 압축을 풀 때 유용하다.
- **URL 다운로드**: `ADD`보다는 `RUN wget/curl && rm` 방식을 권장한다 (동일 레이어에서 잔여물을 삭제하여 크기 최적화 가능).

---

## 4. 실행 명령: ENTRYPOINT vs CMD
두 지시어는 모두 컨테이너 시작 시 실행될 명령을 정의하지만 역할이 다르다.

- **ENTRYPOINT**: 컨테이너의 **메인 명령**. 무조건 실행되며, `docker run` 인자는 뒤에 덧붙여진다.
- **CMD**: 컨테이너의 **기본 인자**. `docker run` 시 인자를 전달하면 완전히 덮어씌워진다.

### 4.1. 헬퍼 스크립트 패턴 (Helper Script)
복잡한 초기화 로직(권한 설정, DB 준비 등)이 필요한 경우 `ENTRYPOINT`에 셸 스크립트를 지정한다.
```dockerfile
COPY ./docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["postgres"]
```
- 스크립트 내부에서 `exec "$@"`를 사용하여 전달받은 `CMD`를 실행함으로써, 최종 앱 프로세스가 PID 1을 유지하게 하는 것이 핵심이다.

---

## 5. 변수: ARG vs ENV
- **ARG (Build-time)**: 빌드 시점에만 사용 (`--build-arg`). 이미지 레이어에 남지 않음.
- **ENV (Runtime)**: 컨테이너 실행 시에도 유지되는 환경 변수. 애플리케이션 설정값 전달에 적합.

---

## Sources
- [Difference Between run, cmd and entrypoint in a Dockerfile](https://www.baeldung.com/ops/dockerfile-run-cmd-entrypoint)
- [Building best practices](https://docs.docker.com/build/building/best-practices/)

---

## Related pages
- [[dockerfile]]
- [[docker-image]]
