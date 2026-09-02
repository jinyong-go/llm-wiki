---
title: 메모리 부족 진단 및 해결
updated: 2026-07-14 16:00:22
tags:
  - linux
  - memory
  - process
  - monitoring
  - troubleshooting
---

## 1. 개요

메모리 부족이 의심될 때의 절차: ① 프로세스를 메모리 사용량 순으로 정렬해 점유 주체를 찾고, ② 실제 부족인지(캐시 착시 여부) 확인한 뒤, ③ 원인에 맞는 조치를 취한다.

---

## 2. 메모리 사용량 순으로 프로세스 정렬

### 2.1. top / htop

`top` 실행 중 `M`(대문자) 키로 `%MEM` 기준 내림차순 정렬한다. 시작부터 정렬된 상태로 보려면 `top -o %MEM`. 컬럼·조작키 상세는 [[system-monitoring]] 참조.

`%MEM`은 전체 물리 메모리 대비 `RES`(실제 상주 물리 메모리) 비율이다. `VIRT`(가상 메모리 예약량)는 실제 점유가 아니므로 부족 진단에는 `RES`를 본다.

### 2.2. ps — 스크립트·로그용

`top`보다 가볍고 1회성 출력에 적합하다.

```bash
ps aux --sort=-%mem | head              # 메모리 상위 프로세스
ps -eo pid,comm,%mem,rss --sort=-%mem | head
```

`--sort=-key`의 `-`는 내림차순. `rss`는 비스왑 물리 메모리 사용량(KiB), `%mem`은 시스템 전체 메모리 대비 비율이다.

---

## 3. 실제 부족 여부 확인

```bash
free -h
```

```
              total        used        free      shared  buff/cache   available
Mem:           62Gi        42Gi       1.6Gi       0.5Gi        18Gi        19Gi
Swap:         8.0Gi       3.6Gi       4.4Gi
```

| 컬럼 | 의미 |
|---|---|
| `total` | 전체 사용 가능 물리 메모리 (`MemTotal`) |
| `used` | `total - available` |
| `free` | 커널이 전혀 사용하지 않는 완전 미할당 메모리 (`MemFree`) |
| `shared` | 주로 tmpfs가 사용 (`Shmem`) |
| `buff/cache` | 커널 버퍼·페이지 캐시 (필요 시 자동 회수) |
| `available` | 스왑 없이 새 프로세스에 할당 가능한 추정량 |

핵심: **`free`가 작아도 부족이 아니다.** 커널은 미사용 메모리를 페이지 캐시로 쓰므로 `free`는 항상 작게 보인다. 실제 여유는 캐시 회수분을 포함한 **`available`**으로 판단한다. `available`이 충분하면 부족이 아니다.

### 3.1. 정확한 프로세스별 측정 — smem

`RES`/`rss`는 공유 라이브러리를 여러 프로세스에 중복 계산한다. 실제 고유 점유는 PSS(Proportional Set Size, 공유 페이지를 공유 프로세스 수로 나눠 배분)가 정확하다.

```bash
smem -rs pss        # PSS 기준 내림차순 정렬
```

`smem`은 기본 설치가 아닐 수 있다(별도 패키지).

---

## 4. 원인별 해결

| 상황 | 진단 / 조치 |
|---|---|
| 특정 프로세스 과다 점유 | 위 정렬로 식별 → 재시작·종료, 애플리케이션 메모리 누수 점검 |
| `available`은 충분 | 캐시 착시. 조치 불필요 |
| 일시적 부족 | swap 추가: `fallocate -l 4G /swapfile` → `chmod 600` → `mkswap` → `swapon` |
| OOM Killer 발생 이력 | `dmesg -T | grep -i oom` 또는 `journalctl -k | grep -i oom`. 어떤 프로세스가 종료됐는지 확인 |
| 커널 메모리(slab) 과다 | `slabtop`으로 slab 캐시 상위 항목 확인 |
| 반복 발생 / 격리 필요 | cgroup으로 프로세스별 상한 설정. systemd 서비스는 유닛에 `MemoryMax=` ([[systemd-unit-file]]) |

### 4.1. OOM Killer

물리 메모리와 스왑이 모두 고갈되면 커널의 OOM Killer가 `oom_score`가 높은 프로세스를 강제 종료한다. 갑작스러운 프로세스 종료 시 위 로그 명령으로 OOM 여부를 먼저 확인한다. 특정 프로세스를 보호하려면 `/proc/<pid>/oom_score_adj` 값을 낮춘다(−1000 ~ 1000).

---

## Sources
- [free(1)](https://man7.org/linux/man-pages/man1/free.1.html)
- [ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html)
- [top(1)](https://man7.org/linux/man-pages/man1/top.1.html)
- [proc(5) — /proc/meminfo, oom_score_adj](https://man7.org/linux/man-pages/man5/proc.5.html)

---

## Related pages
- [[system-monitoring]]
- [[ps]]
- [[nohup]]
- [[systemd-unit-file]]
- [[java-process-analysis-tools]]
