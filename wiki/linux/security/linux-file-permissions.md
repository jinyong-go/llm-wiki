---
title: 리눅스 파일 권한 관리
updated: 2026-07-08 10:32:15
tags:
  - linux
  - filesystem
  - permissions
  - security
---

## 1. 개념

리눅스의 모든 파일과 디렉터리는 **누가(대상)** **무엇을(권한)** 할 수 있는지를 [[inode]]의 `st_mode` 필드에 기록한다. 권한 변경은 `chmod`, 소유자 변경은 `chown`으로 수행한다.

---

## 2. 권한 종류

| 기호 | 숫자 | 설명 |
|------|------|------|
| `r` | `4` | 읽기 (Read) |
| `w` | `2` | 쓰기 (Write) |
| `x` | `1` | 실행 (Execute) / 디렉터리 진입 |

권한은 세 대상 각각에 독립적으로 부여된다.

| 기호 | 설명 |
|------|------|
| `u` | 소유자 (user/owner) |
| `g` | 소유 그룹 (group) |
| `o` | 기타 (others) |
| `a` | 전체 (all = u+g+o) |

---

## 3. ls -l 출력 해석

```
-rwxr-xr--  1 alice  staff  4096 May 13 11:00 script.sh
```

첫 번째 필드 10자리의 구조:

```
[파일타입][u권한][g권한][o권한]
    -       rwx     r-x     r--
```

| 위치 | 값 | 의미 |
|------|-----|------|
| 1 | `-` | 일반 파일 (`d`=디렉터리, `l`=심볼릭링크 등) |
| 2-4 | `rwx` | 소유자: 읽기+쓰기+실행 |
| 5-7 | `r-x` | 그룹: 읽기+실행 |
| 8-10 | `r--` | 기타: 읽기만 |

---

## 4. 8진수(Octal) 표기

각 대상의 r/w/x 값을 더한 숫자 세 자리로 표현한다.

| 8진수 | 권한 | 설명 |
|-------|------|------|
| `7` | `rwx` | 읽기+쓰기+실행 |
| `6` | `rw-` | 읽기+쓰기 |
| `5` | `r-x` | 읽기+실행 |
| `4` | `r--` | 읽기만 |
| `0` | `---` | 권한 없음 |

자주 쓰는 조합:

| 모드 | 기호 | 용도 |
|------|------|------|
| `755` | `rwxr-xr-x` | 실행 파일, 디렉터리 |
| `644` | `rw-r--r--` | 일반 파일 (설정 파일 등) |
| `600` | `rw-------` | 개인 키, 비밀 파일 |
| `777` | `rwxrwxrwx` | 모두 허용 (보안상 지양) |

---

## 5. 특수 권한 비트

일반 rwx 외에 앞에 1자리를 추가해 4자리로 표현한다.

| 비트 | 숫자 | 기호 | 설명 |
|------|------|------|------|
| setuid | `4` | `s` (u 위치) | 실행 시 소유자 UID로 동작 |
| setgid | `2` | `s` (g 위치) | 실행 시 소유 그룹 GID로 동작. 디렉터리에 설정하면 하위 파일이 디렉터리의 그룹을 상속 |
| sticky | `1` | `t` (o 위치) | 디렉터리에서 파일 소유자만 삭제/이름변경 가능. `/tmp`에 사용 |

```bash
chmod 4755 file   # setuid + rwxr-xr-x
chmod 1777 /tmp   # sticky + rwxrwxrwx
```

---

## 6. 디렉터리에서의 권한 의미

파일과 달리 디렉터리에서 권한의 의미가 다르다.

| 권한 | 디렉터리에서의 의미 |
|------|-------------------|
| `r` | 디렉터리 내 파일 목록 조회 (`ls`) |
| `w` | 파일 생성, 삭제, 이름변경 |
| `x` | 디렉터리 진입 (`cd`), 내부 파일 접근 |

---

## 7. chmod — 권한 변경

```bash
chmod [option]... {mode | --reference=ref_file} file...
```

파일의 소유자이거나 적절한 권한을 가진 프로세스만 변경할 수 있다.

### 7.1. 기호 모드 (Symbolic mode)

```
[ugoa][+-=][rwxXst]
```

| 연산자 | 설명 |
|--------|------|
| `+` | 지정 권한 추가 |
| `-` | 지정 권한 제거 |
| `=` | 지정 권한으로 정확히 설정 (나머지 제거) |

| 권한 문자 | 설명 |
|-----------|------|
| `r` / `w` / `x` | 읽기 / 쓰기 / 실행 |
| `X` | 디렉터리이거나 이미 누군가 실행 권한이 있는 경우에만 실행 추가 |
| `s` | setuid(`u+s`) / setgid(`g+s`) |
| `t` | sticky bit |

```bash
chmod u+x file          # 소유자에 실행 권한 추가
chmod go-w file         # 그룹/기타의 쓰기 권한 제거
chmod a=r file          # 모두 읽기만으로 설정
chmod u=rw,go=r file    # 소유자 rw, 그룹/기타 r
chmod a-x,a+X dir/      # 파일은 실행 제거, 디렉터리는 실행 유지 (재귀 시 유용)
```

### 7.2. 8진수 모드 (Numeric/Octal mode)

```bash
chmod 644 file      # rw-r--r--
chmod 755 file      # rwxr-xr-x
chmod 4755 file     # setuid + rwxr-xr-x
chmod 1777 /tmp     # sticky + rwxrwxrwx
chmod 00755 dir/    # setuid/setgid 명시적 해제
```

### 7.3. chmod 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-R`, `--recursive` | 디렉터리와 하위 파일을 재귀적으로 변경 |
| `-v`, `--verbose` | 모든 파일에 대해 수행 내용 출력 |
| `-c`, `--changes` | 실제로 변경된 파일만 출력 |
| `-f`, `--silent` | 오류 메시지 숨김 |
| `--reference=file` | 지정 파일과 동일한 권한으로 설정 |
| `--preserve-root` | 재귀 실행 시 `/`에 대한 변경 거부 |
| `-h`, `--no-dereference` | 심볼릭 링크 자체의 권한 변경 |
| `-H` | `-R` 사용 시 커맨드라인 인수인 심볼릭 링크만 따라감 (기본값) |
| `-L` | `-R` 사용 시 모든 심볼릭 링크를 따라감 |
| `-P` | `-R` 사용 시 심볼릭 링크를 따라가지 않음 |

### 7.4. chmod 특수 비트 동작

- 정규 파일의 그룹 ID가 사용자의 유효 그룹 ID와 다른 경우 `chmod`는 setgid 비트를 자동으로 해제한다.
- `-R`로 재귀 변경 시에도 디렉터리의 setuid/setgid는 명시적으로 지정하지 않으면 보존된다. 8진수로 해제하려면 앞에 0을 추가해야 한다.

### 7.5. chmod 심볼릭 링크 처리

- 커맨드라인에서 명시한 심볼릭 링크 → 링크가 가리키는 파일의 권한을 변경
- `-R` 재귀 탐색 중 만난 심볼릭 링크 → 기본적으로 무시 (`-H` 기본값)
- `-L`과 `-R` 조합은 보안 위험: 공격자가 탐색 중 심볼릭 링크를 임의 대상으로 교체할 수 있음

---

## 8. chown / chgrp — 소유자 및 그룹 변경

```bash
chown [option]... owner[:group] file...
chown [option]... --reference=ref_file file...

chgrp [option]... group file...
chgrp [option]... --reference=ref_file file...
```

`chown`은 소유자와 그룹을 동시에 변경할 수 있다. 그룹만 변경할 때는 `chgrp`을 사용하거나 `chown :group` 형식을 쓴다.

루트 권한으로 생성된 파일을 일반 계정에 넘기거나, 특정 서비스 계정(`www-data`, `nginx` 등)에 소유권을 이전할 때 주로 사용한다.

### 8.1. chown 동작 규칙

| 입력 형식 | 동작 |
|-----------|------|
| `owner` | 소유자만 변경, 그룹 유지 |
| `owner:group` | 소유자와 그룹 모두 변경 |
| `owner:` | 소유자를 변경하고 그룹을 소유자의 로그인 그룹으로 변경 |
| `:group` | 그룹만 변경 (`chgrp`과 동일) |

### 8.2. 사용 예

```bash
# 소유자만 변경
chown alice file.txt

# 소유자와 그룹 동시 변경
chown alice:developers file.txt

# 그룹만 변경 (소유자 유지)
chown :developers file.txt

# 디렉터리와 하위 전체 재귀 변경
chown -R alice:developers /var/www/

# 참조 파일과 동일한 소유자:그룹으로 설정
chown --reference=ref.txt target.txt

# chgrp 사용
chgrp staff /u
chgrp -hR staff /u
```

### 8.3. chown / chgrp 주요 옵션

`chown`과 `chgrp`은 옵션 구조가 동일하다.

| 옵션 | 설명 |
|------|------|
| `-R`, `--recursive` | 디렉터리와 하위 파일을 재귀적으로 변경 |
| `-v`, `--verbose` | 변경된 모든 파일 내역 출력 |
| `-c`, `--changes` | 실제로 변경된 파일만 출력 |
| `-f`, `--silent` | 오류 메시지 숨김 |
| `-h`, `--no-dereference` | 심볼릭 링크 자체의 소유권 변경 |
| `--dereference` | 심볼릭 링크가 가리키는 원본 파일의 소유권 변경 (chown 기본값) |
| `-H` | `-R` 사용 시 커맨드라인 인수인 심볼릭 링크만 따라감 |
| `-L` | `-R` 사용 시 모든 심볼릭 링크를 따라감 |
| `-P` | `-R` 사용 시 심볼릭 링크를 따라가지 않음 (chgrp 기본값) |
| `--from=owner:group` | 현재 소유자/그룹이 일치하는 파일만 변경 |
| `--reference=file` | 지정 파일과 동일한 소유자:그룹으로 설정 |
| `--preserve-root` | 재귀 실행 시 `/`에 대한 변경 거부 |

### 8.4. chown / chgrp 심볼릭 링크 처리

- `chown` 기본값: `--dereference` — 링크가 가리키는 원본 파일 변경
- `chgrp` 기본값: `-P` — 심볼릭 링크를 따라가지 않음
- `-h`(`--no-dereference`): 링크 파일 자체의 소유권 변경

---

## Sources
- [chmod](https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html)
- [chmod(1)](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [chown(1)](https://man7.org/linux/man-pages/man1/chown.1.html)
- [chgrp(1)](https://man7.org/linux/man-pages/man1/chgrp.1.html)

---

## Related pages
- [[inode]]
