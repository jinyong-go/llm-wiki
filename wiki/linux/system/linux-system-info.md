---
title: 리눅스 시스템 및 장치 정보
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - sysadmin
  - devops
---

## 1. 개념

배포 서버나 개발 환경에서 빠르게 확인해야 하는 시스템 정보는 크게 세 가지다.

| 목적 | 명령어 |
|------|--------|
| OS 및 커널 버전 확인 | `uname`, `hostnamectl`, `cat /etc/os-release` |
| CPU 코어·아키텍처 확인 | `lscpu` |
| PCI 장치(NIC·스토리지 컨트롤러) 확인 | `lspci` |

---

## 2. OS / 커널 정보

### 2.1. uname — 커널 정보

```bash
uname -a          # 모든 정보 한 줄 출력
uname -r          # 커널 릴리즈 버전만 (ex. 6.1.0-28-amd64)
uname -m          # 아키텍처만 (ex. x86_64, aarch64)
```

`uname -a` 출력 순서: `커널명 호스트명 릴리즈 빌드상세 아키텍처 OS명`

백엔드 관점에서 주로 확인하는 항목:
- `-r`: 커널 버전 — OS 업그레이드 여부, 특정 커널 기능 지원 확인
- `-m`: 아키텍처 — JVM 바이너리 선택, Docker 이미지 플랫폼(`linux/amd64` vs `linux/arm64`) 결정

### 2.2. /etc/os-release — 배포판 정보

```bash
cat /etc/os-release
```

주요 필드:

| 필드 | 설명 | 예시 |
|------|------|------|
| `NAME` | 배포판 이름 | `Ubuntu`, `Debian GNU/Linux` |
| `VERSION_ID` | 배포판 버전 | `22.04`, `12` |
| `ID` | 스크립트용 식별자 | `ubuntu`, `debian`, `rhel` |
| `ID_LIKE` | 상위 호환 배포판 | `debian` (Ubuntu의 경우) |
| `PRETTY_NAME` | 표시용 전체 이름 | `Ubuntu 22.04.4 LTS` |

패키지 관리자(`apt` vs `yum/dnf`) 선택, Docker 베이스 이미지 결정, OS별 설정 파일 경로 파악에 사용한다.

### 2.3. hostnamectl — 시스템 종합 정보

```bash
hostnamectl          # 상태 조회
hostnamectl hostname  # 호스트명만 출력
sudo hostnamectl set-hostname <새이름>  # 호스트명 변경
```

`systemd` 기반 배포판(Ubuntu 15.04+, CentOS 7+, Debian 8+)에서만 사용 가능.

`hostnamectl` 출력에서 유용한 항목:
- `Operating System`: OS 이름 + 버전 (`/etc/os-release`의 `PRETTY_NAME`과 동일)
- `Kernel`: 커널 버전 (`uname -r`과 동일)
- `Virtualization`: 가상화 유형 — `kvm`, `vmware`, `docker`, `container` 등. **물리 서버인지 VM인지 빠르게 확인할 수 있는 유일한 명령어**

---

## 3. CPU 정보 — lscpu

```bash
lscpu
lscpu -C          # 캐시 상세 정보
```

백엔드 개발자가 주로 확인하는 항목:

| 항목 | 설명 | 활용 |
|------|------|------|
| `Architecture` | `x86_64`, `aarch64` 등 | JVM, 네이티브 라이브러리 선택 |
| `CPU(s)` | 논리 프로세서 수 (= 코어 × 스레드) | 스레드 풀, 커넥션 풀 크기 기준 |
| `Core(s) per socket` | 물리 코어 수 | GC 스레드 수 계산 기준 |
| `Thread(s) per core` | 하이퍼스레딩 여부 (2이면 활성화) | CPU-bound vs IO-bound 작업 구분 |
| `Model name` | CPU 모델명 | 세대별 성능 차이 파악 |
| `NUMA node(s)` | NUMA 노드 수 | 멀티 소켓 서버에서 메모리 접근 비용 고려 |

> **스레드 풀 크기 산정 예시**: CPU(s)=8, Thread(s) per core=2이면 물리 코어는 4개. IO-bound 애플리케이션은 논리 코어(8) 기준, CPU-bound는 물리 코어(4) 기준으로 풀 크기를 설정한다.

---

## 4. PCI 장치 — lspci

```bash
lspci                    # 전체 장치 목록
lspci | grep -i eth      # 이더넷 컨트롤러 확인
lspci | grep -i vga      # 그래픽 카드 확인
lspci -k                 # 각 장치의 커널 드라이버 표시
lspci -nn                # 벤더·장치 ID 숫자로 함께 출력
```

백엔드 관점에서는 주로 **네트워크 카드 확인**에 사용한다. NIC 모델에 따라 드라이버 버그, 최대 전송 속도(1GbE vs 10GbE), 오프로드 기능 지원 여부가 다르다. `lspci -k`로 어떤 커널 드라이버가 NIC를 담당하는지 확인할 수 있다.

---

## 5. 자주 쓰는 조합

```bash
# 배포 서버 접속 시 빠른 환경 파악
uname -rm && cat /etc/os-release | grep PRETTY_NAME

# CPU 코어 수만 빠르게 확인
nproc                    # 논리 코어 수 (lscpu 없이)
lscpu | grep -E "^CPU\(s\)|^Core|^Thread"

# 가상화 환경 여부 확인
hostnamectl | grep -i virtual
systemd-detect-virt      # 단일 출력 (none = 물리 서버)
```

---

## Sources
- [uname(1)](https://man7.org/linux/man-pages/man1/uname.1.html)
- [hostnamectl(1)](https://man7.org/linux/man-pages/man1/hostnamectl.1.html)
- [os-release(5)](https://man7.org/linux/man-pages/man5/os-release.5.html)
- [lscpu(1)](https://man7.org/linux/man-pages/man1/lscpu.1.html)
- [lspci(8)](https://man7.org/linux/man-pages/man8/lspci.8.html)

---

## Related pages
- [[linux-file-permissions]]
- [[system-monitoring]]
