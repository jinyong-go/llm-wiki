---
title: Java 버전 확인 및 관리
updated: 2026-07-08 10:32:15
tags:
  - java
  - linux
  - devops
  - sdkman
---

## 1. 개요
Java 환경에서는 여러 JDK 버전을 설치하고 상황에 따라 전환하여 사용하는 작업이 빈번합니다. 시스템 전역 설정을 위한 `update-alternatives`와 사용자 수준의 유연한 관리를 위한 `SDKMAN!`을 활용할 수 있습니다.

---

## 2. Java 실행 및 경로 확인
시스템에 설치된 Java의 버전과 실제 실행 파일의 위치를 확인하는 기본 명령어입니다.

- **버전 확인**: `java -version` 또는 `java --version` (JDK 9 이상)
- **실행 파일 위치**: `which java` (심볼릭 링크 경로 반환 가능)
- **실제 경로 추적**: `readlink -f $(which java)`를 통해 여러 단계의 심볼릭 링크를 거친 최종 JDK 설치 경로를 확인할 수 있습니다.

---

## 3. update-alternatives
리눅스(Debian/Ubuntu 계열)에서 `/etc/alternatives` 구조를 통해 여러 버전의 소프트웨어를 관리하는 도구입니다.

- **JDK 등록**: `--install` 옵션을 사용하여 새 JDK 경로를 시스템 대안 목록에 추가합니다.
  ```bash
  sudo update-alternatives --install /usr/bin/java java /usr/lib/jvm/java-21-openjdk-amd64/bin/java 210
  ```
- **버전 전환**: `--config java`를 통해 설치된 목록 중 사용할 버전을 대화형으로 선택합니다.
- **자동/수동 모드**: 우선순위에 따른 자동 선택(`--auto`) 또는 특정 경로 강제 지정(`--set`)이 가능합니다.

---

## 4. SDKMAN!
개발자 개인 환경에서 여러 JDK 배포판을 sudo 권한 없이 간편하게 설치하고 전환할 수 있는 도구입니다.

### 4.1. 주요 기능
- **설치**: `sdk install java <version-identifier>`
- **버전 전환**:
    - 현재 셸에서만 사용: `sdk use java <version-identifier>`
    - 시스템 기본값 설정: `sdk default java <version-identifier>`
- **로컬 버전 등록**: 이미 설치된 JDK를 SDKMAN! 관리 하에 두려면 경로를 명시하여 설치합니다.
  ```bash
  sdk install java 17-local /path/to/local/jdk
  ```
- **프로젝트별 자동 전환**: 프로젝트 루트의 `.sdkmanrc` 파일을 기반으로 `sdk env` 명령을 통해 해당 프로젝트에 필요한 JDK 버전을 즉시 활성화할 수 있습니다. (`sdkman_auto_env=true` 설정 시 `cd` 이동만으로 자동 전환 가능)

---

## 5. JAVA_HOME 설정
많은 Java 기반 도구(Maven, Gradle 등)는 `JAVA_HOME` 환경변수를 참조합니다.

- **자동 설정 패턴**: `readlink`를 활용해 현재 활성 Java 경로를 기반으로 설정할 수 있습니다.
  ```bash
  export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
  ```
- **영구 적용**: `~/.bashrc` 또는 `/etc/environment` 파일에 정의하여 세션 시작 시 자동으로 로드되게 합니다.

---

## Sources
- [The java Command (JDK 21 Tool Specifications)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [update-alternatives(1) - Linux manual page](https://man7.org/linux/man-pages/man1/update-alternatives.1.html)
- [SDKMAN! the Software Development Kit Manager](https://sdkman.io/)

---

## Related pages
- [[jvm-options]]
- [[directory-navigation]]
- [[linux-file-permissions]]
