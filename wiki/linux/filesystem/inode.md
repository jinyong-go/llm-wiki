---
title: inode — 파일 메타데이터 구조체
updated: 2026-07-08 10:32:15
tags:
  - linux
  - filesystem
  - inode
---

## 1. 개념

모든 파일은 inode(index node)를 하나씩 가진다. inode는 파일의 실제 데이터를 제외한 거의 모든 메타데이터를 저장하는 구조체다. `stat(2)` 또는 `statx(2)` 시스템 콜로 조회할 수 있다.

파일시스템 내에서 inode 번호는 유일하다. 단, 파일시스템 간 유일성은 보장되지 않으므로 하드 링크는 같은 파일시스템 내에서만 생성 가능하다.

---

## 2. inode에 저장되는 정보

| 필드 | stat 구조체 | 설명 |
|------|------------|------|
| 장치 ID | `st_dev` | inode가 속한 파일시스템의 장치 번호 |
| inode 번호 | `st_ino` | 파일시스템 내 고유 번호 |
| 파일 타입 및 모드 | `st_mode` | 파일 종류 + 권한 비트 |
| 하드 링크 수 | `st_nlink` | 이 inode를 가리키는 하드 링크 수 |
| 소유자 UID | `st_uid` | 파일 소유자의 사용자 ID |
| 소유자 GID | `st_gid` | 파일 소유자의 그룹 ID |
| 파일 크기 | `st_size` | 바이트 단위 크기 (일반 파일, 심볼릭 링크) |
| 할당 블록 수 | `st_blocks` | 512바이트 단위로 할당된 블록 수 |
| 마지막 접근 시간 | `st_atime` | atime — 읽기 등 접근 시 갱신 |
| 마지막 수정 시간 | `st_mtime` | mtime — 파일 내용 변경 시 갱신 |
| 상태 변경 시간 | `st_ctime` | ctime — 권한/소유자 등 inode 속성 변경 시 갱신 |
| 생성 시간 | `stx_btime` | btime — 파일 생성 시 설정 (모든 파일시스템에서 지원하지 않음) |

### 2.1. 타임스탬프 상세

- **atime** : 읽기(`read`), 실행(`execve`) 등 접근 시 갱신. `noatime` 마운트 옵션으로 비활성화 가능.
- **mtime** : 파일 내용 변경(`write`, `truncate`) 시 갱신. 디렉터리는 하위 파일 생성/삭제 시 갱신.
- **ctime** : 내용 변경뿐 아니라 권한, 소유자, 링크 수 등 inode 속성이 바뀔 때도 갱신.
- **btime** : 생성 후 변경되지 않음. XFS, Btrfs, ext4 등 일부 파일시스템에서만 지원.

나노초 타임스탬프는 XFS, JFS, Btrfs, ext4(Linux 2.6.23 이상)에서 지원한다. ext2, ext3, ReiserFS는 미지원.

---

## 3. 파일 타입

`st_mode`의 상위 비트(S_IFMT 마스크)가 파일 종류를 나타낸다.

| 상수 | 값 | 설명 |
|------|----|------|
| `S_IFREG` | `0100000` | 일반 파일 |
| `S_IFDIR` | `0040000` | 디렉터리 |
| `S_IFLNK` | `0120000` | 심볼릭 링크 |
| `S_IFBLK` | `0060000` | 블록 장치 |
| `S_IFCHR` | `0020000` | 문자 장치 |
| `S_IFIFO` | `0010000` | FIFO (named pipe) |
| `S_IFSOCK` | `0140000` | 소켓 |

POSIX 매크로(`S_ISREG(m)`, `S_ISDIR(m)` 등)를 사용하면 타입 검사를 간결하게 작성할 수 있다.

---

## 4. inode 고갈 문제

파일시스템 생성 시 inode 총 개수가 고정된다. inode가 모두 소진되면 디스크 공간이 남아 있어도 파일을 새로 생성할 수 없다..md, inode(7)

```bash
# inode 사용 현황 확인
df -i

# 출력 예시
# Filesystem      Inodes  IUsed   IFree IUse% Mounted on
# /dev/sda1      6553600 120000 6433600    2% /
```

inode를 많이 소비하는 원인으로는 소용량 파일이 대량으로 생성되는 경우(캐시, 임시 파일, 로그 파일 등)가 있다. [[du]] 의 `du --inodes` 옵션으로 어느 디렉터리가 inode를 많이 쓰는지 파악할 수 있다.

---

## Sources
- [inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html)
- [df](https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html)

---

## Related pages
- [[df]]
- [[du]]
