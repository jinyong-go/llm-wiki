---
title: df — 파일시스템 용량 조회
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - disk
  - filesystem
---

## 1. 개념

파일시스템의 메타데이터를 직접 읽어 사용량을 출력한다. 디렉터리를 재귀 스캔하지 않으므로 속도가 빠르다.

```bash
df [option]... [file]...
```

인수 없이 실행하면 현재 마운트된 모든 파일시스템을 출력한다. 인수로 파일 경로를 주면 해당 파일이 속한 파일시스템 정보를 출력한다.

---

## 2. 출력 컬럼

| 컬럼 | 설명 |
|------|------|
| Filesystem (source) | 장치명 또는 마운트 소스 |
| Size | 전체 블록 수 |
| Used | 사용 중인 블록 수 |
| Avail | 사용 가능한 블록 수 |
| Use% (pcent) | 사용 비율 |
| Mounted on (target) | 마운트 지점 |

기본 단위는 1024바이트 블록이며, `POSIXLY_CORRECT`가 설정된 경우 512바이트로 변경된다.

---

## 3. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-h`, `--human-readable` | 1024 거듭제곱 단위 출력 (KiB, MiB, GiB) |
| `--si` | 1000 거듭제곱 단위 출력 (KB, MB, GB) |
| `-i`, `--inodes` | 블록 사용량 대신 [[inode]] 사용량 출력 |
| `-T`, `--print-type` | 파일시스템 종류 출력 (ext4, xfs, nfs 등) |
| `-a`, `--all` | dummy, duplicate, inaccessible 파일시스템 포함 |
| `-l`, `--local` | 원격 파일시스템 제외, 로컬만 출력 |
| `-t fstype` | 특정 파일시스템 타입만 필터링 |
| `-x fstype` | 특정 파일시스템 타입 제외 |
| `--total` | 모든 항목의 합계 행 추가 |
| `--output[=field_list]` | 출력 컬럼을 콤마로 지정 (e.g. `--output=target,pcent,ipcent`) |

### 3.1. -h vs --si 차이

```bash
df -h   # 1 MiB = 1,048,576 bytes (2^20)
df --si # 1 MB  = 1,000,000 bytes (10^6)
```

두 옵션을 혼용하면 같은 수치라도 다르게 보인다.

---

## 4. df vs du 수치 불일치

[[du]]와 수치가 다를 수 있는 케이스가 있다. 자세한 내용은 [[du]] 참고.

---

## Sources
- [df](https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html)
- [df(1)](https://man7.org/linux/man-pages/man1/df.1.html)

---

## Related pages
- [[du]]
- [[inode]]
