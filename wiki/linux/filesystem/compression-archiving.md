---
title: 리눅스 압축 및 아카이빙 상세 가이드
updated: 2026-07-14 14:35:36
tags:
  - linux
  - cli
  - compression
  - archiving
  - backend
  - logs
---

## 1. 개념: 아카이빙 vs 압축
리눅스에서는 여러 파일을 하나로 묶는 **아카이빙**과 용량을 줄이는 **압축**을 별개의 작업으로 취급한다.

| 용어 | 역할 | 주요 도구 | 확장자 |
| :--- | :--- | :--- | :--- |
| **아카이빙 (Archiving)** | 여러 파일/디렉터리를 하나로 묶음 (권한 유지) | `tar` | `.tar` |
| **압축 (Compression)** | 알고리즘을 사용하여 파일 크기를 줄임 | `gzip`, `bzip2`, `xz` | `.gz`, `.bz2`, `.xz` |
| **통합 도구** | 아카이빙과 압축을 동시에 수행 | `zip`, `tar` (옵션 사용) | `.zip`, `.tar.gz` 등 |

---

## 2. 압축 도구별 특징 비교
백엔드 개발 환경에서 상황에 맞는 도구를 선택하는 것이 중요하다.

| 도구 | 속도 | 압축률 | 특징 | 추천 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Gzip** | **가장 빠름** | 보통 | 리눅스 표준, CPU 부하 적음 | **로그 파일, CI/CD 빌드 캐시** |
| **Bzip2** | 중간 | 좋음 | Gzip보다 좋고 XZ보다 빠름 | 레거시 시스템 백업 |
| **XZ** | 가장 느림 | **가장 좋음** | 높은 CPU 사용량, 가장 작은 크기 | **배포용 패키지, 장기 보관 데이터** |
| **Zip** | 중간 | 보통 | **Windows/macOS 호환**, 단일 압축 | **JAR/WAR 관리, OS 간 파일 공유** |

---

## 3. tar (Tape Archiver) 마스터하기
리눅스에서 가장 많이 쓰이는 도구로, 아카이빙과 압축 도구를 연계하여 사용한다.

### 3.1. 주요 옵션
- `-c`: 아카이브 생성 (Create)
- `-x`: 아카이브 해제 (Extract)
- `-v`: 과정 상세 출력 (Verbose)
- `-f`: 대상 파일 지정 (File, 항상 필요하며 마지막에 위치)
- `-C`: 대상 디렉터리 지정 (Change Directory)

### 3.2. 압축 알고리즘 지정 옵션
- `-z`: Gzip (`.tar.gz`)
- `-j`: Bzip2 (`.tar.bz2`)
- `-J`: XZ (`.tar.xz`)
- `-a`: 확장자에 따라 **자동으로 압축 알고리즘 선택** (Auto)

### 3.3. 실무 활용 패턴
```bash
# Gzip으로 압축하여 묶기
tar -czvf project.tar.gz ./project

# 특정 디렉터리에 압축 해제하기
tar -xzvf project.tar.gz -C /opt/deploy/

# 압축 해제 없이 내용물 확인
tar -tvf project.tar.gz

# 상위 1단계 디렉터리를 제외하고 해제 (예: GitHub 압축 풀 때 유용)
tar -xzvf project.tar.gz --strip-components=1
```

---

## 4. Zip & Unzip
JAR, WAR 파일 등 자바 기반 백엔드 개발 시 자주 접하게 되는 형식이다. Windows/macOS와의 호환성이 가장 좋다.

### 4.1. zip 주요 옵션
| 옵션 | 설명 |
| :--- | :--- |
| **`-r`** | **재귀적 압축**. 디렉터리 내부의 모든 파일과 서브 디렉터리를 포함한다. |
| `-e` | **암호화**. 압축 시 비밀번호를 설정한다. |
| `-u` | **업데이트**. 기존 압축 파일에 새 파일을 추가하거나 변경된 파일만 갱신한다. |
| `-x` | **제외**. 특정 파일이나 패턴(예: `node_modules/*`)을 압축에서 제외한다. |
| `-m` | **이동**. 파일을 압축한 후 원본 파일을 삭제한다. |
| `-j` | **경로 무시**. 디렉터리 구조를 저장하지 않고 파일명만 저장한다. |
| `-0` ~ `-9` | **압축 레벨**. 0(압축 안 함)부터 9(최대 압축)까지 설정 가능하다. |

### 4.2. unzip 주요 옵션
| 옵션 | 설명 |
| :--- | :--- |
| **`-l`** | **목록 조회**. 압축을 풀지 않고 내부 파일 목록과 용량 등을 확인한다. |
| **`-d <dir>`** | **경로 지정**. 특정 디렉터리에 압축을 해제한다. |
| `-o` | **덮어쓰기**. 기존 파일이 있어도 묻지 않고 덮어쓴다. |
| `-n` | **덮어쓰지 않음**. 기존 파일이 있으면 추출을 건너뀐다. |
| `-t` | **테스트**. 압축 파일의 무결성을 검사한다. |
| `-O <enc>` | **인코딩 지정**. Windows에서 생성된 한글 파일명이 깨질 때 사용한다. (예: `-O cp949`) |
| `-j` | **경로 무시**. 압축 파일 내의 디렉터리 구조를 무시하고 현재 디렉터리에 모든 파일을 푼다. |

### 4.3. 실무 활용 패턴
```bash
# 디렉터리 전체 압축 (특정 폴더 제외)
zip -r project.zip ./project -x "node_modules/*" ".git/*"

# 압축 해제 없이 특정 파일 내용 확인 (cat 처럼 사용)
unzip -p project.zip application.yml | grep "port"

# 특정 디렉터리에 덮어쓰며 해제 (CI/CD 스크립트 등)
unzip -o project.zip -d /var/www/html/
```

---

## 5. 백엔드 개발자 팁: Z-Commands
운영 환경에서는 로그가 `.gz` 형태로 압축되어 저장되는 경우가 많다. 이때 압축을 풀지 않고 바로 내용을 확인하는 명령어가 필수적이다.

| 명령어 | 역할 | 활용 예시 |
| :--- | :--- | :--- |
| **`zcat`** | 압축 파일 내용 출력 | `zcat access.log.gz` |
| **`zless`** | 압축 파일 페이지 단위 보기 | `zless error.log.gz` (검색 가능) |
| **`zgrep`** | 압축 파일 내 문자열 검색 | `zgrep "ERROR" app.log.gz` |
| **`zdiff`** | 압축 파일 간 차이점 비교 | `zdiff log.1.gz log.2.gz` |

**장점**: 디스크 공간을 사용하지 않고, I/O 부하를 줄이면서 빠르게 로그를 탐색할 수 있다.

---

## 6. JAR / WAR 파일 다루기
자바의 아카이브 파일인 `.jar`, `.war`는 내부적으로 **ZIP 형식**과 동일하다.

- **내용 확인**: `jar -tf app.jar` 또는 `unzip -l app.jar`
- **특정 설정 파일 추출**: `unzip app.jar BOOT-INF/classes/application.yml`
- **메타데이터 확인**: `unzip -p app.jar META-INF/MANIFEST.MF`

---

## Sources
- [GNU tar Manual](https://www.gnu.org/software/tar/manual/)
- [GNU Gzip Manual](https://www.gnu.org/software/gzip/manual/)
- [Info-ZIP (Zip/Unzip) Project](http://www.info-zip.org/)
- [Baeldung: Guide to Linux Tar Command](https://www.baeldung.com/linux/tar-command)

---

## Related pages
- [[ls]] — 파일 목록 확인
- [[grep]], [[sed]], [[awk]] — 텍스트 처리 및 로그 분석
