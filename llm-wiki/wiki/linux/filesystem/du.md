---
title: du — 파일/디렉터리 용량 측정
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - disk
  - filesystem
---

## 1. 개념

파일과 디렉터리를 재귀적으로 스캔하여 실제 점유 크기를 출력한다. 어느 디렉터리/파일이 많은 용량을 차지하는지 파악할 때 사용한다. [[df]]보다 느리다.

```bash
du [option]... [file]...
```

인수 없이 실행하면 현재 디렉터리 아래 전체를 스캔한다. 하드 링크가 여러 개인 파일은 한 번만 집계한다.

---

## 2. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-h`, `--human-readable` | 1024 거듭제곱 단위 출력 (KiB, MiB, GiB) |
| `-s`, `--summarize` | 지정한 대상의 합계만 출력 (하위 목록 생략) |
| `-d n`, `--max-depth=n` | 하위 n단계까지만 출력 (`--max-depth=0`은 `-s`와 동일) |
| `-a`, `--all` | 디렉터리뿐만 아니라 개별 파일 크기까지 모두 출력 |
| `-c`, `--total` | 마지막에 총 합계 출력 |
| `-x`, `--one-file-system` | 다른 파티션에 마운트된 디렉터리 제외 |
| `--apparent-size` | 물리적 블록 크기가 아닌 논리적 파일 크기 (`wc -c` 기준) |
| `-b`, `--bytes` | `--apparent-size --block-size=1`과 동일 |
| `--inodes` | 블록 대신 [[inode]] 사용 개수로 출력 |
| `-t size`, `--threshold=size` | 지정 크기 이상(양수) 또는 이하(음수) 항목만 필터링 |
| `--exclude=pattern` | 특정 패턴과 일치하는 파일/디렉터리 제외 |

### 2.1. apparent-size vs 실제 디스크 사용량

```bash
# sparse file 예시: 논리 크기 2GiB이지만 실제 블록 사용량은 거의 0
dd bs=1 seek=2GiB if=/dev/null of=big
du big               # 실제 블록 사용량 출력 (매우 작음)
du --apparent-size big   # 2GiB 출력
```

---

## 3. sort -h 와의 조합

`du -h` 출력을 크기 순으로 정렬할 때 `sort -h`(`--human-numeric-sort`)를 사용한다. 이 옵션은 K/M/G/T 같은 SI 단위를 숫자로 인식하여 정렬한다.

```bash
# 현재 디렉터리에서 용량이 큰 항목을 내림차순으로 출력
du -h --max-depth=1 | sort -hr

# 특정 크기 이상만 필터링
du --threshold=200MB

# inode를 많이 사용하는 디렉터리 찾기
du --inodes -x --threshold=20000 /
```

---

## 4. df vs du — 차이점 및 불일치

| 항목 | [[df]] | du |
|------|--------|----|
| 측정 대상 | 파일시스템 전체 | 지정 파일/디렉터리 |
| 동작 방식 | 메타데이터 직접 읽기 | 재귀 스캔 |
| 속도 | 빠름 | 느림 |
| inode 확인 | `-i` 옵션 | `--inodes` 옵션 |

### 4.1. 수치 불일치 케이스

프로세스가 파일 핸들을 열고 있는 상태에서 `rm`으로 파일을 삭제하면, `du`는 해당 파일을 집계하지 않지만 [[df]]는 해당 공간을 여전히 사용 중으로 표시한다. 프로세스가 종료되거나 파일 핸들을 닫아야 실제로 해제된다.

```bash
# 어느 프로세스가 삭제된 파일을 열고 있는지 확인
lsof | grep deleted
```

copy-on-write, 압축 파일시스템, NFS 환경에서도 `du`의 수치가 실제 디바이스 사용량과 다를 수 있다.

---

## Sources
- [du](https://www.gnu.org/software/coreutils/manual/html_node/du-invocation.html)
- [du(1)](https://man7.org/linux/man-pages/man1/du.1.html)
- [sort](https://www.gnu.org/software/coreutils/manual/html_node/sort-invocation.html)

---

## Related pages
- [[df]]
- [[inode]]
