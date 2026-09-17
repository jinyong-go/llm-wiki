---
title: JMeter 소개
updated: 2026-09-17 09:30:05
tags:
  - performance
  - testing
  - load-testing
---

## 1. 개요

### 1.1 정의
Apache JMeter는 오픈소스 100% 순수 Java 애플리케이션이다. 기능 테스트와 부하 테스트, 성능 측정을 목적으로 하며 원래 웹 애플리케이션 테스트용으로 설계되었으나 이후 다양한 프로토콜로 확장되었다.

### 1.2 목적
서버, 서버 그룹, 네트워크, 객체에 부하를 가해 강건성을 검증하거나 다양한 부하 조건에서의 전반적인 성능을 분석하는 데 사용한다. 지원 대상은 다음과 같다.
- Web: HTTP, HTTPS (Java, Node.js, PHP, ASP.NET 등)
- SOAP / REST 웹서비스
- FTP
- Database (JDBC)
- LDAP
- Message-oriented middleware (JMS)
- Mail: SMTP(S), POP3(S), IMAP(S)
- 네이티브 명령어·셸 스크립트
- TCP
- Java Object

### 1.3 한계
JMeter는 브라우저가 아니라 프로토콜 레벨에서 동작한다. 웹/원격 서비스 입장에서는 브라우저처럼 보이지만 브라우저가 수행하는 모든 동작을 지원하지는 않는다. 특히 HTML 내 JavaScript를 실행하지 않고, 브라우저처럼 HTML을 렌더링하지도 않는다(응답을 HTML 등으로 볼 수는 있으나 그 표시 시간은 샘플에 포함되지 않으며 한 스레드당 한 샘플만 표시된다).

## 2. 설치

### 2.1 요구사항
- Java 8 이상. 보안·성능을 위해 사용 중인 메이저 버전의 최신 마이너 버전 설치를 권장
- JRE로도 실행되나, HTTPS 레코딩 시 JDK의 keytool이 필요하므로 JDK 설치를 권장

### 2.2 설치 절차
공식 배포 페이지에서 최신 릴리즈(zip/tar)를 내려받아 원하는 위치에 압축을 해제한다. JAVA_HOME이 올바르게 설정되어 있다면 추가 설정 없이 바로 사용할 수 있다. 설치 경로에 공백이 포함되면 특히 client-server 모드에서 문제가 발생할 수 있으므로 피한다.

설치 디렉터리 구조:
```
apache-jmeter-X.Y/
├── bin/
├── docs/
├── extras/
├── lib/
│   ├── ext/
│   └── junit/
├── licenses/
└── printable_docs/
```
상위 디렉터리명(apache-jmeter-X.Y)은 변경 가능하지만 하위 디렉터리명은 유지해야 한다.

## 3. 실행 방법

### 3.1 GUI 모드
`bin/jmeter.bat`(Windows) 또는 `bin/jmeter`(Unix)를 실행하면 GUI가 뜬다. GUI 모드는 테스트 계획 작성, 브라우저·네이티브 애플리케이션 레코딩(File → Templates... → Recording), 디버깅(Run → Start no pauses, Run → Start, Thread Group 단위 Validate, View Results Tree)에 사용한다. 공식 문서는 부하 테스트 자체는 GUI 모드로 실행하지 말 것을 명시한다. 리소스 소모가 크기 때문이다.

### 3.2 CLI 모드 (Command-Line/Non-GUI 모드)
부하 테스트는 GUI 모드로도 실행할 수 있지만, 리소스 소모가 커 공식 문서는 CLI 모드 사용을 권장한다.
```
jmeter -n -t my_test.jmx -l log.jtl
```
주요 옵션:

| 옵션 | 설명 |
|---|---|
| -n | CLI 모드로 실행 |
| -t | 실행할 JMX(테스트 계획) 파일 |
| -l | 샘플 결과를 기록할 JTL 파일 |
| -j | JMeter 실행 로그 파일 |
| -r / -R | 속성 remote_hosts 또는 지정한 서버 목록에서 원격 실행 |
| -g | 기존 CSV 결과로 리포트 대시보드만 생성 |
| -e | 부하 테스트 종료 후 리포트 대시보드 생성 |
| -o | 대시보드 출력 폴더(비어 있거나 존재하지 않아야 함) |

CLI 모드는 결과를 CSV/XML로 남기고, 실행 중에는 기본적으로 요약 정보를 출력한다. `-e`/`-o` 옵션으로 부하 테스트 종료 시 HTML 리포트를 바로 생성할 수 있다.

### 3.3 서버 모드(분산 테스트)
원격 노드에서 `jmeter-server[.bat]`를 실행해 서버 모드로 띄운 뒤, GUI 또는 CLI(`-r`/`-R`)로 컨트롤한다.

## 4. 장단점[^1]

장점:
- 오픈소스이며 100% Java로 작성되어 Java가 동작하는 모든 OS에서 크로스플랫폼으로 실행
- HTTP(S)뿐 아니라 JDBC, FTP, LDAP, JMS, Mail, TCP, 셸 명령 등 다양한 프로토콜을 하나의 도구로 테스트
- GUI로 레코딩·빠른 테스트 계획 작성·디버깅이 가능하고, CLI 모드로 헤드리스 부하 테스트 및 HTML 리포트 자동 생성 지원
- JSR223(Groovy, BeanShell 등) 스크립팅, 플러그인, Maven/Gradle/Jenkins 연동으로 확장성과 CI 통합이 용이

단점:
- 브라우저가 아니므로 JavaScript를 실행하지 않고 HTML을 렌더링하지 않아, 클라이언트 렌더링에 의존하는 시나리오의 실제 사용자 경험 측정에는 한계가 있음
- GUI 모드는 리소스 소모가 커 대규모 부하 테스트에는 부적합해 CLI 모드로 전환이 필요
- 기본 힙 크기가 1GB로 제한되어 있어 스레드 수·시나리오 규모가 크면 별도 튜닝이 필요

## 5. 관련 문서
JMeter의 세부 구성 요소(Thread Group, Sampler, Listener 등)는 [[jmeter-components]] 참고.

---
## Sources
- [Apache JMeter](https://jmeter.apache.org/)
- [Getting Started - Apache JMeter User's Manual](https://jmeter.apache.org/usermanual/get-started.html)

---
## Related pages
- [[jmeter-components]]
- [[tps-improvement]]

[^1]: 공식 문서는 "장점/단점"을 별도 목록으로 제시하지 않는다. 위 항목은 홈페이지의 기능 소개(features)와 "JMeter is not a browser" 절, Getting Started의 GUI/CLI 모드 안내를 근거로 정리한 것이다.
