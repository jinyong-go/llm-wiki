---
title: cp / mv — 파일 복사 및 이동
updated: 2026-07-08 10:32:15
tags:
  - linux
  - cli
  - devops
---

## 1. cp — 파일/디렉터리 복사

```bash
cp [options] SOURCE DEST
cp [options] SOURCE... DIRECTORY
```

### 1.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-r` / `-R` | 디렉터리 재귀 복사 |
| `-a` | `--archive`. `-dR --preserve=all`과 동일. 모든 속성(권한, 소유자, 타임스탬프, 심볼릭링크 등) 보존. 백업 시 표준 |
| `-p` | 권한·소유자·타임스탬프 보존 (`--preserve=mode,ownership,timestamps`) |
| `-i` | 덮어쓰기 전 확인 |
| `-n` | 기존 파일 덮어쓰지 않음 |
| `-u` | 원본이 더 최신이거나 대상이 없을 때만 복사 |
| `-v` | 복사 진행 상황 출력 |
| `-f` | 덮어쓰기 불가한 파일 제거 후 재시도 |
| `-l` | 복사 대신 하드링크 생성 |
| `-s` | 복사 대신 심볼릭링크 생성 |
| `-L` | 심볼릭링크를 따라가 실제 파일 복사 |
| `--backup[=CONTROL]` | 기존 파일 백업 생성 후 덮어쓰기 |

### 1.2. 자주 쓰는 패턴

```bash
# 파일 단순 복사
cp file.txt file_copy.txt

# 디렉터리 재귀 복사
cp -r src/ dest/

# 모든 속성 보존하며 복사 (배포, 백업 시)
cp -a /app/release/ /app/backup/

# 최신 파일만 동기화 (배포 스크립트)
cp -ru src/ dest/

# 복사 전 백업
cp --backup=simple config.yml config.yml

# 여러 파일을 디렉터리로 복사
cp *.log /var/log/backup/

# 심볼릭링크가 가리키는 실제 파일 복사
cp -L /etc/localtime /app/localtime
```

> `-a`는 배포/백업 시 사실상 표준 옵션이다. `-p`는 권한만 보존할 때 사용한다.

---

## 2. mv — 파일/디렉터리 이동 및 이름 변경

```bash
mv [options] SOURCE DEST
mv [options] SOURCE... DIRECTORY
```

같은 파일시스템 내 이동은 inode 재배치만 수행(빠름). 파일시스템 간 이동은 내부적으로 복사 후 삭제(느림).

### 2.1. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-i` | 덮어쓰기 전 확인 |
| `-n` | 기존 파일 덮어쓰지 않음 |
| `-f` | 확인 없이 강제 덮어쓰기 |
| `-u` | 원본이 더 최신이거나 대상이 없을 때만 이동 |
| `-v` | 이동 진행 상황 출력 |
| `-t DIR` | 여러 파일을 지정 디렉터리로 이동 |
| `--backup[=CONTROL]` | 기존 파일 백업 후 이동 |

> `-i`, `-n`, `-f`를 함께 쓰면 마지막 옵션만 적용된다.

### 2.2. 자주 쓰는 패턴

```bash
# 파일 이름 변경
mv old_name.txt new_name.txt

# 파일을 디렉터리로 이동
mv app.jar /opt/app/

# 여러 파일을 한 디렉터리로 이동
mv -t /var/log/ *.log

# 덮어쓰기 방지
mv -n temp.txt dest/

# 기존 파일 백업 후 교체 (배포 시)
mv --backup=simple app.jar /opt/app/app.jar

# 최신 파일만 이동
mv -u *.class build/
```

---

## 3. --backup 제어 값

| 값 | 동작 |
|----|------|
| `simple` | `~` 접미사로 백업 (`file.txt~`) |
| `numbered` | 번호 접미사로 백업 (`file.txt.~1~`) |
| `existing` | 기존 번호 백업이 있으면 numbered, 없으면 simple |
| `none` / `off` | 백업 안 함 |

---

## Sources
- [cp(1)](https://man7.org/linux/man-pages/man1/cp.1.html)
- [mv(1)](https://man7.org/linux/man-pages/man1/mv.1.html)
- [tar(1)](https://man7.org/linux/man-pages/man1/tar.1.html)

---

## Related pages
- [[linux-file-permissions]]
- [[find]]
