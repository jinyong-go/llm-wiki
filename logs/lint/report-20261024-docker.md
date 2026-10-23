# wiki-lint report — 2026-10-24 (docker)

- **범위**: `wiki/docker/` 12개 문서 (docker-container-commands, docker-container, docker-image, docker-network-commands, docker-network-drivers, docker-network, docker-overview, docker-security, docker-volume-commands, docker-volume, dockerfile-directives, dockerfile)
- **결과**: broken links 1건(문서 간 앵커) / 사실 오류·출처 불일치 15건 / 원문 미확인·근거 부족 3건 / 구성·양식 개선 다수
- **조치**: 사실 정정(C1–C15, L1) → 구성 개선 → 문체 정리 순으로 diff 제시 후 승인 대기

---

## 1. 링크

- L1: `docker-network-commands.md` §2 `[[docker-network-drivers#기본-bridge-vs-사용자-정의-bridge]]` 깨짐. 실제 제목은 `1.2. 기본 Bridge vs 사용자 정의 Bridge`
- 그 외 위키링크 대상 전부 존재. `wiki/index.md`에 12개 문서 모두 등재
- 외부 URL 19개 중 403 7개(Baeldung 전부). 봇 차단으로 원문 미확인
- `raw/`에 docker 소스 없음. 전부 웹 출처 의존

---

## 2. 사실 오류·출처 불일치

| # | 파일 | 위치 | 내용 |
|---|---|---|---|
| C1 | `docker-volume-commands.md` | §1.5·§3 | `docker volume prune`은 API 1.42+부터 기본으로 익명 볼륨만 삭제. named 포함은 `-a` 필요 |
| C2 | `docker-volume-commands.md` | §3 | `docker rm -v`는 익명 볼륨만 삭제. named 볼륨에 대한 dangling 설명 오류 |
| C3 | `dockerfile-directives.md` | §3.2 | "URL 다운로드는 ADD보다 `RUN wget/curl`". 현행 best practices는 원격 artifact에 `ADD` 권장(캐시 정확성, `--checksum`, Git URL) |
| C4 | `dockerfile-directives.md` | §5 | "ARG는 이미지 레이어에 남지 않음". ARG 값은 `docker history`·max 모드 provenance에 노출 |
| C5 | `dockerfile-directives.md` | §4 | "ENTRYPOINT 무조건 실행". `docker run --entrypoint`로 덮어쓰기 가능 |
| C6 | `docker-image.md` | §3 | Engine 29.0+ 신규 설치 기본은 containerd image store. overlay2는 classic driver 기준 |
| C7 | `docker-image.md` | §2.2 | 환경 변수·실행 명령·아키텍처는 OCI image config 소관. 매니페스트는 config·layers descriptor 참조 |
| C8 | `docker-network.md` | §1.1 | 172.17.0.1은 게이트웨이. 기본 대역은 `172.17.0.0/16` |
| C9 | `docker-network-drivers.md` | §2·§6 | host 드라이버 "Linux 전용". Docker Desktop 4.34+ 지원(L4 한정) |
| C10 | `docker-network-drivers.md` | §3.1 | 외부 K/V 저장소 overlay는 현행 문서에 없음. Swarm 참여 필수, 암호화는 VXLAN 수준 IPsec이며 성능 저하 명시 |
| C11 | `docker-network-drivers.md` | §4.1 | Macvlan 호스트 통신 불가 원인은 "Linux 커널 제약"(문서 표현 "보안 정책") |
| C12 | `docker-container.md` vs `docker-overview.md` | §1 / §3 표 | 시작 속도 "밀리초" vs "초" 충돌. 공식 문서에 수치 없음 |
| C13 | `docker-container.md` | §3 | 상태 `removing` 누락 |
| C14 | `docker-container.md` | §2 | USER 네임스페이스는 `userns-remap` 활성화 시에만 적용 |
| C15 | `docker-security.md` | §1.1·§3 | 제한 사항에 `--privileged`(without `--userns=host`) 누락. "어떠한 관리자 권한도 행사 불가"는 단정 표현 |

부정확 기술: `--rm` 익명 볼륨 삭제 누락, `--restart` 기본값 `no` 누락·`on-failure` 기준(non-zero 종료), `docker stop` grace period(Linux 기본 10초)·`STOPSIGNAL`, `-v`의 named 볼륨 용도, `docker-volume` §1 볼륨 정의와 bind mount 혼재

---

## 3. 원문 미확인·근거 부족

- 원문 미확인: Baeldung 7개 페이지(403)
- 출처 미반영: `dockerfile.md` Sources의 Spring Boot Dockerfiles, Build Cloud optimization 내용이 본문에 없음
- 각주 없는 추론: `docker-network-drivers` §6 성능·격리 등급표, `docker-overview` §3 크기·부팅 수치·"2013년 등장", `docker-volume` §3 성능 행, 볼륨 "필수적/반드시" 단정

---

## 4. 구성·양식

- 문서 간 반복: docker-network §1.1·§3·§4 ↔ docker-network-drivers §1.1·§1.2 ↔ docker-network-commands §1·§2, docker-image §4 ↔ docker-volume §1.1, docker-image §6 ↔ dockerfile §3.1, docker-image §2.1 ↔ dockerfile §2.1, docker-overview §5 ↔ docker-container §2, docker-container §4 ↔ docker-container-commands §3·§4, docker-security §2.1 ↔ dockerfile §3.2
- `## 1. 개요` 누락 개념 문서 6개(container, network, network-drivers, security, volume, dockerfile-directives). 절 밖 소개 문장 6개
- 문체 혼용('-합니다' 6개 문서), '도커'/'Docker' 표기 혼용
- 제목 괄호·부제, 절 제목 영문 괄호, 수식어형 절 제목("백엔드 개발자 실무 팁")
- 볼드 남용(12개 전부), 대시 연결, 설명성 괄호, 수사 표현
- 축약어 원어 미병기: MSA, DoS, MAC, DNS, K/V
- 오타: `docker-volume` §3 "영향받받지"
- Sources `[기관: 제목](URL)` 형식 미준수 12개
- 다이어그램 후보: network-commands §3, image §4, directives §4.1
- `wiki/index.md` 하위 항목 나열 8개
- 태그 불일치(`ops`/`devops`, `commands`, `management`, `instructions`)
