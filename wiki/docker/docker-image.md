---
title: 도커 이미지(Docker Image)
updated: 2026-07-08 10:32:15
tags:
  - docker
  - container
  - image
  - optimization
  - storage-driver
---

## 1. 개요
도커 이미지는 애플리케이션을 실행하는 데 필요한 모든 요소(코드, 런타임, 라이브러리, 환경 변수, 설정 파일 등)를 포함하는 **읽기 전용 스냅샷**이다. 한 번 생성된 이미지는 변하지 않는 **불변성(Immutability)**을 가지며, 컨테이너 실행을 위한 설계도 역할을 한다.

## 2. 이미지 구조 및 원리

### 2.1. 계층형 파일 시스템 (Layered File System)
- 이미지는 Dockerfile의 각 지시어(특히 `RUN`, `COPY`, `ADD`)가 생성하는 여러 개의 **읽기 전용 레이어(Read-only Layer)**가 쌓여서 구성된다.
- 각 레이어는 이전 레이어와의 차이점(Delta)만을 저장한다.
- **레이어 공유**: 동일한 베이스 레이어를 사용하는 서로 다른 이미지들은 해당 레이어를 물리적으로 한 번만 저장하여 디스크 공간과 네트워크 대역폭을 효율적으로 사용한다.
- **Content Addressable**: 각 레이어는 내용에 기반한 SHA256 해시값으로 식별되어 데이터 무결성을 보장한다.

### 2.2. 매니페스트 (Manifest)
- 이미지의 레이어 순서, 아키텍처 정보(amd64, arm64 등), 이미지 설정(환경 변수, 실행 명령 등)을 담고 있는 JSON 형식의 메타데이터이다.

---

## 3. 스토리지 드라이버 (Storage Drivers)
도커는 이미지 레이어를 관리하고 컨테이너의 쓰기 가능 레이어를 처리하기 위해 스토리지 드라이버를 사용한다.

| 드라이버 | 특징 및 권장 환경 |
| :--- | :--- |
| **`overlay2`** | **현재 모든 리눅스 배포판의 기본 드라이버**. 성능이 우수하고 메모리 효율이 좋다. |
| **`fuse-overlayfs`** | 루트리스(Rootless) 모드에서 Overlay2를 사용할 수 없을 때 대안으로 사용된다. |
| **`btrfs` / `zfs`** | 해당 파일 시스템을 사용하는 호스트에서 활용 가능하며, 스냅샷 기능을 제공한다. |
| **`vfs`** | CoW를 지원하지 않고 매번 전체 복사를 수행한다. 테스트 또는 특수 환경용. |

---

## 4. Copy-on-Write (CoW) 전략
CoW는 리소스를 최대한 효율적으로 공유하고 복사하기 위한 전략이다.

1.  **공유**: 하위 레이어의 파일에 읽기 권한만 필요한 경우, 복사본을 만들지 않고 기존 파일을 직접 참조한다.
2.  **복사 및 수정 (Copy-up)**: 컨테이너(또는 빌드 중인 새 레이어)가 기존 레이어에 존재하는 파일을 **처음으로 수정**하려고 할 때, 해당 파일을 상위 레이어(쓰기 가능 레이어)로 복사한 후 수정을 가한다.
3.  **장점**:
    - **공간 효율성**: 변경된 부분만 저장하므로 전체 복사보다 용량을 훨씬 적게 차지한다.
    - **빠른 시작**: 컨테이너 생성 시 이미지 전체를 복사할 필요 없이 얇은 쓰기 레이어만 추가하면 되므로 매우 빠르다.
4.  **단점**:
    - **I/O 오버헤드**: 대용량 파일을 처음 수정할 때 발생하는 `copy_up` 동작은 성능 저하를 유발할 수 있다. 따라서 쓰기 작업이 빈번한 데이터베이스 등은 **[[docker-volume]]** 사용이 필수적이다.

---

## 5. 주요 명령어
| 명령어 | 설명 |
| :--- | :--- |
| `docker build -t <명칭>:<태그> .` | Dockerfile을 사용하여 이미지를 빌드한다. |
| `docker image ls` | 로컬 이미지 목록 및 크기를 확인한다. |
| `docker image inspect <명칭>` | 이미지의 상세 메타데이터(레이어 ID 등)를 확인한다. |
| `docker image history <명칭>` | 이미지의 레이어 생성 이력과 실행 명령어를 확인한다. |
| `docker image prune` | 태그가 없는(dangling) 미사용 이미지를 일괄 삭제한다. |

---

## 6. 이미지 최적화 방법
1.  **경량 베이스 이미지 선택**: `Alpine`, `Distroless`, `-slim` 버전 활용.
2.  **멀티 스테이지 빌드**: 빌드 환경과 실행 환경 분리로 최종 크기 최소화.
3.  **레이어 최소화**: `RUN` 지시어에서 `&&`를 사용해 명령 통합 및 임시 파일 삭제.
4.  **빌드 캐시 최적화**: 변경 빈도가 낮은 레이어를 Dockerfile 상단에 배치.
5.  **.dockerignore**: 불필요한 파일(`.git`, 로그 등)을 빌드 컨텍스트에서 제외.

---

## Sources
- [Difference Between Docker Images and Containers](https://www.baeldung.com/ops/docker-images-vs-containers)
- [Tips for Creating Efficient Docker Images](https://www.baeldung.com/ops/efficient-docker-images)
- [Storage drivers](https://docs.docker.com/engine/storage/drivers/)

---

## Related pages
- [[docker-overview]]
- [[docker-container]]
- [[docker-volume]]
- [[dockerfile]]
