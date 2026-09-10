---
title: index
updated: 2026-09-06 00:00:38
tags:
  - meta
---

## Linux CLI

- [[df]] — 파일시스템 수준 용량 조회 (메타데이터 직접 읽기, 빠름)
- [[du]] — 파일/디렉터리 수준 용량 측정 (재귀 스캔, 느림)
- [[inode]] — 파일 메타데이터 구조체 (타입, 권한, 타임스탬프, 블록 포인터)
- [[compression-archiving]] — 리눅스 압축·아카이빙 (tar/gzip/xz/zip)
- [[linux-file-permissions]] — 파일 권한 관리 (권한 모델, chmod, chown/chgrp)
- [[system-monitoring]] — 시스템 모니터링 (top/htop)
- [[memory-troubleshooting]] — 메모리 부족 진단·해결 (free·smem·swap·OOM Killer)
- [[linux-system-info]] — 시스템 및 장치 정보 (uname, lscpu 등)
- [[ssh]] — SSH/SCP: 공개키 인증, 설정, 포트 포워딩
- [[network-diagnostics]] — 네트워크 진단 (ss, ping, nc)
- [[dns-configuration]] — DNS 해석 순서, resolv.conf, systemd-resolved
- [[dns-tools]] — DNS 진단 도구 (dig, nslookup, host, resolvectl)
- [[curl]] — HTTP API 호출 및 연결 진단
- [[lsof]] — 열린 파일/소켓 조회 (포트 점유·누수 진단)
- [[cp-mv]] — 파일/디렉터리 복사(cp) 및 이동(mv)
- [[ls]] — 디렉터리 목록 조회
- [[find]] — 파일 탐색: 조건 검색과 액션
- [[file-encoding]] — 파일 인코딩 감지·변환 (file/enca/iconv)
- [[directory-navigation]] — 디렉터리 탐색 (cd, pushd/popd)
- [[standard-streams]] — 표준 스트림, 리다이렉션, 파이프
- [[cat-tee-more-less]] — 파일 출력 및 뷰어 (cat, tee, more/less)
- [[grep]] — 텍스트 패턴 검색
- [[sed]] — 스트림 편집: 치환·삭제·삽입
- [[awk]] — 필드 단위 텍스트 처리·집계
- [[ps]] — 프로세스 목록 조회·필터링
- [[nohup]] — 세션 종료 후 프로세스 유지 (nohup/disown)
- [[crontab]] — crontab: 작업 스케줄러 문법, 명령어, 환경변수
- [[systemctl]] — systemd 서비스 제어
- [[systemd-unit-file]] — systemd 유닛 파일 작성과 서비스 등록
- [[journalctl]] — systemd 서비스 로그 조회
- [[environment-variables]] — 환경변수: 개념·조회·설정·확장
- [[shell-special-parameters]] — 셸 특수 매개변수 ($?, $!, $@ 등)
- [[time]] — 날짜·시간 명령어 (date, timedatectl, hwclock)
- [[user-group-management]] — 계정·그룹 관리 명령어
- [[readline-shortcuts]] — 셸 커서 이동·편집 단축키 (Emacs/Vi 모드)
- [[vim-01-modes]] — vi/vim 모드 체계와 저장·종료
- [[vim-02-navigation]] — vi/vim 이동 명령어
- [[vim-03-editing]] — vi/vim 편집 명령어
- [[vim-04-search-replace]] — vi/vim 검색·치환
- [[vim-05-practical]] — vi/vim 실용 팁 (블록, 레지스터, 매크로 등)
- [[openssl-overview]] — OpenSSL 개요: 구조, 서브커맨드, 인코딩 형식
- [[openssl-dgst]] — openssl dgst: 해시, HMAC, 디지털 서명
- [[openssl-keygen]] — openssl 키 생성·변환
- [[openssl-x509]] — openssl X.509: CSR, 인증서 발급·검증
- [[openssl-crl]] — openssl CRL: 조회, 변환, 서명 검증
- [[openssl-pkcs12]] — openssl PKCS#12: 번들 조회·추출·생성
- [[openssl-cms]] — openssl CMS/S/MIME: 서명·암호화
- [[openssl-ts]] — openssl ts: RFC 3161 타임스탬프 요청·응답·검증
- [[openssl-s_client]] — openssl s_client: TLS 연결 진단

## Git

- [[git-internals]] — Git 내부 구조: 스냅샷 모델, 객체, .git 디렉터리
- [[git-file-states]] — 파일 상태 라이프사이클과 전환 명령어
- [[git-init]] — 저장소 초기화 (Non-bare vs Bare)
- [[git-clone]] — 저장소 복제 (shallow/partial/mirror)
- [[git-config]] — 설정 관리: scope, alias, 조건부 설정
- [[git-log]] — 커밋 이력 조회: 필터링, 형식, 코드 검색
- [[git-revisions]] — 리비전 참조 문법과 특수 참조
- [[git-detached-head]] — Detached HEAD 원인과 해결
- [[git-branch]] — 브랜치 조회·생성·삭제, upstream 설정
- [[git-add]] — 스테이징 옵션
- [[git-commit]] — 커밋 생성 (amend, fixup, hooks)
- [[git-stash]] — 변경 임시 보관
- [[git-merge]] — 브랜치 병합: 전략, 충돌 해결
- [[git-tag]] — 태그 관리 (lightweight vs annotated)
- [[git-rebase]] — 커밋 재배치 (interactive, --onto)
- [[git-reset-revert]] — 변경 되돌리기: reset vs revert
- [[git-switch-restore]] — 브랜치 전환 및 파일 복원
- [[git-fetch-pull-push]] — 원격 저장소 동기화

## Java

- [[excel]] — Java Excel 처리 라이브러리 비교 (POI/FastExcel/EasyExcel)
- [[jni]] — Java JNI: native 메서드 선언, C 구현, 라이브러리 빌드/로드(java.library.path vs LD_LIBRARY_PATH), macOS quarantine 주의사항
- [[bitwise-operators]] — Java 비트 연산자: &/|/^/~, 시프트(<<,>>,>>>)와 마스킹 규칙, 타입 승격, Integer/Long 비트 유틸리티

- [[jvm-options]] — JVM 옵션 가이드 (메모리, GC, 로깅, 진단)
- [[gc]] — 가비지 컬렉터 종류별 동작·장단점·선택 가이드
- [[logging-frameworks]] — Java 로깅 프레임워크 비교 (Logback vs Log4j2)
- [[java-version]] — Java 버전 확인·관리
- [[java17-features]] — Java 17 LTS 주요 기능
- [[java21-features]] — Java 21 LTS 주요 기능
- [[expression-vs-statement]] — 식(expression) vs 문(statement): 정의와 혼동 지점
- [[sbom]] — SBOM 개요: 개념, 형식, 라이프사이클
- [[sbom-java]] — Java SBOM 생성: 도구와 빌드 설정
- [[java-process-analysis-tools]] — 자바 프로세스 분석·진단 도구 (jstack, jmap, JFR 등)
- [[cpu-usage-troubleshooting]] — CPU 사용량 증가 트러블슈팅 사례와 진단 워크플로우
- [[gradle]] — Gradle 개요: 프로젝트 구조, 빌드 라이프사이클, Task, 플러그인, 의존성 관리, CLI, Maven과 비교
- [[maven]] — Maven 빌드 방식: POM, 디렉터리 구조, 빌드 라이프사이클, 플러그인·Goal, 의존성 관리, 리포지토리, 멀티모듈, CLI
- [[gradle-multi-project]] — Gradle 멀티 프로젝트: settings.gradle 구성, 프로젝트 간 의존성, cross-project configuration과 컨벤션 플러그인
- [[gradle-task]] — Gradle Task: 타입, 등록 방법, 의존관계와 순서, 조건부 실행
- [[gradle-application]] — Gradle 애플리케이션 실행 구성: mainClass 지정, 클래스패스·lib 구성, 배포 형식별 비교
- [[gradle-dependency-configurations]] — Gradle 의존성 Configuration 상세 비교: implementation/api/compileOnly/compileOnlyApi/runtimeOnly/annotationProcessor, 클래스패스 노출 범위, 선택 기준
- [[gradle-shadow]] — Gradle Shadow: 버전별 플러그인 ID/호환성, shadowJar 기본 동작, application 통합, 의존성 필터링, 병합/relocate/minimize
- [[fat-jar-signature-error]] — Fat Jar 서명 파일(META-INF/*.SF/.RSA/.DSA) 충돌로 인한 SecurityException 원인·해결
- [[thread-unsafe-utilities]] — SimpleDateFormat/Calendar가 스레드 안전하지 않은 원인과 DateTimeFormatter/ThreadLocal 등 대안
- [[netty]] — Netty 아키텍처: 배경(blocking I/O 한계, TCP 메시지 경계 문제), 원리(논블로킹 멀티플렉싱, Reactor/EventLoop, 블로킹 금지 규칙), 구성 요소(Channel, ChannelPipeline, ByteBuf), Native Transport
- [[netty-implementation]] — Netty 구현: 부트스트랩/ChannelOption, ChannelInitializer, 핸들러(SimpleChannelInboundHandler/@Sharable), 길이 기반 프레이밍 코덱, ByteBuf 릴리스·ResourceLeakDetector, ChannelFuture 데드락 주의, IdleStateHandler

### 암호 (crypto)

- [[cmp-bouncycastle]] — BouncyCastle CMP 메시지 생성·파싱·검증 (개념은 [[cmp]])
- [[ml-kem-bouncycastle]] — BouncyCastle ML-KEM 키 생성·캡슐화·복원, 키 인코딩·디코딩 (개념은 [[ml-kem]])
- [[ml-dsa-bouncycastle]] — BouncyCastle ML-DSA 서명·검증, 키 인코딩·디코딩, X.509 인증서 발급 (개념은 [[ml-dsa]])
- [[jwt-java]] — Java JWT 생성·검증: 라이브러리 비교·예시 (개념은 [[jwt]])
- [[cert-path-validation]] — BouncyCastle 인증서 경로 검증 (개념은 [[x509-certificate]])
- [[crl-java]] — Java CRL 생성·파싱·검증 (개념은 [[certificate-revocation]])
- [[keystore-java]] — Java KeyStore 생성·저장·로드 (PKCS#12)
- [[jar-signing]] — JAR 서명: 구성 파일, jarsigner/빌드 도구 통합, 검증 절차와 실패 사례
- [[webauthn-java]] — Java(java-webauthn-server)·Spring Security WebAuthn 등록·인증 구현 (개념은 [[webauthn]])

### 테스트

- [[java-testing-libraries]] — Java 테스트 라이브러리 목적별 개요
- [[jmh]] — JMH 마이크로벤치마크: 설정, 어노테이션, 결과 해석
- [[mockito-doreturn-vs-when]] — Mockito 스터빙 구문 비교: when().thenXxx() vs doXxx().when()
- [[inverse-operation-testing]] — 역연산 함수 테스트 전략 (KAT, 라운드트립, 프로퍼티)
- [[good-test-practices]] — 좋은 테스트 코드 작성법
- [[test-double]] — 테스트 더블: Mock/Stub/Spy 차이와 선택 기준
- [[spock]] — Spock: Groovy 기반 BDD 테스트 프레임워크
- [[junit-test-suite]] — JUnit 테스트 스위트와 태그 필터링
- [[junit-parameterized-test]] — JUnit 5 ParameterizedTest: 인자 소스, 변환, 집계
- [[jacoco]] — JaCoCo 테스트 커버리지: 원리, 설정, 기준

## Security

### Crypto

- [[hash-function]] — 해시 함수: 요구 성질, 내부 구조(Merkle–Damgård/스펀지/HAIFA), 알고리즘, 주요 활용 사례
- [[cms]] — CMS(RFC 5652) 암호화 메시지 규격: 구조와 콘텐츠 타입
- [[kdf]] — KDF: 알고리즘 비교, 권장 파라미터, Java 예시
- [[ml-kem]] — ML-KEM(FIPS 203) 격자 기반 PQC KEM: 대수 구조(R_q·NTT), MLWE, K-PKE, FO 변환, 파라미터
- [[ml-dsa]] — ML-DSA(FIPS 204) 격자 기반 PQC 디지털 서명: 대수 구조, MLWE+MSIS, FS-with-Aborts, 힌트 메커니즘, 파라미터
- [[hsm]] — HSM: 하드웨어 키 보호 장치, FIPS 140-3, PKCS#11, 클라우드 HSM
- [[padding-oracle-attack]] — Padding Oracle Attack: CBC 패딩 검증 악용 복호화·위조, 원리, 방어(AEAD/Encrypt-then-MAC), ASP.NET/POODLE/Lucky13 사례

### PKI

- [[cmp]] — CMP: X.509 인증서 생명주기 관리 프로토콜
- [[certificate-revocation]] — 인증서 폐기: CRL과 OCSP 비교, 실무 동향
- [[x509-certificate]] — X.509 인증서: 구조, 확장, 검증, 체인, 폐기
- [[certificate-purpose]] — 인증서 용도: Key Usage×EKU 조합별 프로파일(TLS 서버/클라이언트, 전자서명, 코드서명, S/MIME 등)과 실사용 사례
- [[timestamp-token]] — RFC 3161 타임스탬프 토큰: TSP 프로토콜, TST 구조, 검증

### Web

- [[cors]] — CORS: SOP 완화 메커니즘, 프리플라이트, 설정
- [[csrf]] — CSRF: 성립 조건, GET/POST 취약성, 방어(토큰·SameSite·Origin 검증·Custom Header), 실제 사고 사례(Netflix/YouTube/uTorrent 등)
- [[jwt]] — JWT: 구조, 서명 방식, 검증, 보안
- [[oauth2]] — OAuth 2.0: 역할, Grant Type, PKCE, 보안 BCP
- [[sso]] — SSO: IdP/SP 모델, SAML 2.0/OpenID Connect/Kerberos 비교
- [[webauthn]] — WebAuthn: 공개키 기반 등록·인증 Ceremony, Attestation, Authenticator 분류, FIDO2/Passkey
- [[replay-attack]] — Replay Attack: 재전송 공격과 방어(Nonce/타임스탬프/조합), Sliding Window 개요
- [[sliding-window]] — Sliding Window(Anti-Replay Window): 구조·판정 규칙, RFC 4303/6479 구현(Java 예제), IPsec/DTLS/SRTP 활용 예시
- [[session-hijacking]] — 세션 하이재킹: 공격 기법(스니핑/예측/무차별 대입/고정/클라이언트 탈취/노출), 방어(엔트로피·TLS·재발급·타임아웃), Firesheep 사례

## Spring

- [[hikari-datasource]] — HikariCP DataSource: 내부 구조, 설정, 풀 사이즈
- [[hikari-deadlock]] — HikariCP 데드락: 메커니즘, 진단, 해결
- [[hikari-pool-sizing]] — HikariCP 풀 크기 결정: 원리, 공식, 데드락 방지 최소값
- [[redis]] — Spring Boot Redis: 클라이언트, 직렬화, 클러스터, 캐시
- [[externalized-configuration]] — Spring Boot 설정값 우선순위 (PropertySource 계층)
- [[profiles]] — Spring 프로파일: 활성화, 그룹, multi-document 설정
- [[configuration-properties]] — @ConfigurationProperties: 바인딩, 검증, @Value 비교
- [[bean-registration-control]] — 설정 기반 동적 빈 등록 제어 방법과 선택 기준
- [[enable-annotations]] — @Enable 계열 어노테이션: @Import 원리와 대표 예시
- [[dependency-injection]] — Spring 의존성 주입 방식: 생성자/Setter/필드 비교와 권장
- [[spring-event]] — Spring 이벤트: 발행·구독 구조, 내장 이벤트, @EventListener/@Async/@TransactionalEventListener
- [[spring-event-error-handling]] — Spring 이벤트 리스너 예외 처리: 동기/비동기/@TransactionalEventListener별 전파 규칙
- [[jpa-composite-key]] — JPA 복합키: @EmbeddedId/@IdClass
- [[jpa-entity-lifecycle]] — JPA 엔티티 라이프사이클 콜백, EntityListener, Auditing, Envers
- [[entity-listener-di]] — EntityListener 의존성 주입: 실패 원인과 대안
- [[multi-datasource]] — JPA 다중 DataSource 설정
- [[routing-datasource]] — Routing DataSource: 멀티 테넌시, 읽기-쓰기 분리
- [[repository-projection]] — JPA 리포지터리 프로젝션: 반환 타입별 방식
- [[jpa-n-plus-one]] — JPA N+1 문제: 원인과 해결책
- [[jpa-delete]] — JPA 삭제: 방식 비교, 벌크 DML, Soft Delete
- [[jpa-transaction]] — @Transactional: 프록시 원리, 전파, 롤백 규칙
- [[querydsl]] — QueryDSL 통합: 설정, 쿼리 API, Projection
- [[mybatis]] — MyBatis 통합: 설정, 매핑, Dynamic SQL, 트랜잭션
- [[ldap-java]] — Java LDAP 연동: JNDI 연결·검색·생성·변경, Spring LDAP(LdapTemplate/ODM) 비교와 예시 (개념은 [[ldap]])
- [[logback]] — Logback Spring Boot 설정
- [[log4j2]] — Log4j2 Spring Boot 설정
- [[aop]] — Spring AOP: 프록시 원리, Pointcut·Advice, 제약
- [[aop-transaction-order]] — AOP Advice 순서와 트랜잭션 경계: @Order·precedence, 위치별 실행 흐름, 예외 삼킴과 롤백
- [[aspectj]] — AspectJ: 위빙 방식, Spring 통합, 선택 기준
- [[forward-headers-proxy]] — 리버스 프록시 뒤 Forward Headers 처리
- [[batch]] — Spring Batch 개념: Job, Step, Tasklet vs Chunk
- [[batch-scope]] — Spring Batch StepScope·JobScope: Late Binding
- [[batch-job-parameters]] — Spring Batch JobParameters: 타입, 전달, 사용
- [[batch-tasklet]] — Spring Batch Tasklet: 개념과 사용 시점
- [[batch-chunk]] — Spring Batch Chunk 지향 처리: Reader/Processor/Writer
- [[batch-db-reader-writer]] — Spring Batch DB ItemReader/Writer: 커서 vs 페이징
- [[batch-fault-tolerance]] — Spring Batch 재시작, 스킵, 재시도
- [[batch-flow]] — Spring Batch 조건별 플로우 제어
- [[batch-testing]] — Spring Batch 테스트 방법과 유틸리티

## 프로그래밍 일반

- [[solid]] — SOLID 원칙: 정의, 위반 징후, 적용 기준
- [[design-patterns]] — GoF 디자인 패턴 23개 목록표
- [[design-patterns-creational]] — GoF 생성 패턴 5종
- [[design-patterns-structural]] — GoF 구조 패턴 7종
- [[design-patterns-behavioral]] — GoF 행동 패턴 11종
- [[cqrs]] — CQRS: Command/Query 모델 분리 패턴
- [[first-class-citizen]] — 일급 객체: 정의, 일급 함수, 언어별 지원

## AI

- [[okf]] — Open Knowledge Format: 마크다운 기반 지식 표현 포맷
- [[llm-wiki]] — LLM Wiki 패턴: 구조와 워크플로우
- [[ai-agent-schema]] — AI 에이전트 스키마 파일 (CLAUDE.md, AGENTS.md 등)
- [[ai-agent-skill]] — AI 에이전트 스킬 파일: 구조와 작성

## Docker

- [[docker-overview]] — 도커 기본 개념, 아키텍처, VM과의 차이
- [[dockerfile]] — 도커 이미지 빌드 스크립트: 원리, 지시어, 베스트 프랙티스
- [[dockerfile-directives]] — 도커파일 지시어 상세 (Exec vs Shell Form 등)
- [[docker-image]] — 도커 이미지: 레이어 구조, CoW, 최적화
- [[docker-container]] — 도커 컨테이너: 격리 원리, 자원 제한, OCI
- [[docker-container-commands]] — 도커 컨테이너 명령어: 라이프사이클, 모니터링
- [[docker-network]] — 도커 네트워크 구조와 드라이버 종류
- [[docker-network-drivers]] — 도커 네트워크 드라이버 상세 (Bridge, Overlay, Macvlan)
- [[docker-network-commands]] — 도커 네트워크 CLI와 디버깅
- [[docker-volume]] — 도커 볼륨과 데이터 마운트 (Volumes, Bind Mounts, tmpfs)
- [[docker-volume-commands]] — 도커 볼륨 관리 CLI
- [[docker-security]] — 도커 보안과 격리

## DBMS

- [[oracle-hints]] — Oracle 옵티마이저 힌트: 문법, 종류, 충돌 규칙
- [[clob-in-oracle]] — Oracle CLOB: 정의, 저장 방식(in-row/out-of-row, SecureFile), 저장 옵션, DBMS_LOB 패키지, 타입 선택 기준, PostgreSQL/MySQL 비교, AL16UTF16 내부 인코딩에 따른 용량 변화, 실측 검증
- [[execution-plan]] — RDBMS 실행 계획: DBMS별 확인 방법, 출력 항목, 성능 확인 포인트
- [[optimizer-statistics]] — RDBMS 옵티마이저 통계: DBMS별 수집·조회, 히스토그램
- [[index-scan]] — RDBMS 인덱스 스캔: DBMS별 유형, 전체 테이블 스캔 대비 선택 기준
- [[concurrency-control]] — DBMS 동시성 제어: 격리 수준, 락, MVCC
- [[deadlock-livelock]] — DBMS 데드락·라이브락: 감지, 해소, 예방
- [[sql-functions]] — DBMS별 자주 쓰는 SQL 함수: 타입 변환, 날짜·시간, 문자열, NULL 처리, 조건 분기, 순위
- [[upsert-merge]] — DBMS별 upsert: 장단점, Oracle MERGE, PostgreSQL ON CONFLICT, MySQL ON DUPLICATE KEY UPDATE 오류 사례 비교
- [[partitioning]] — RDBMS 파티셔닝: 장단점, Oracle(로컬/글로벌 인덱스), PostgreSQL(선언적 파티셔닝), MySQL(유니크 키 제약) 비교, 주의사항

## 디렉터리 서비스

- [[ldap]] — LDAP: 디렉터리 구조(DIT/DN/RDN), 오퍼레이션, 검색, LDIF, 인증·보안

## Web

- [[load-balancer]] — 로드 밸런서: 동작, L4 vs L7, 분산 알고리즘
- [[reverse-proxy]] — 리버스 프록시: 용도, 전달 헤더, nginx 설정
- [[cookie]] — Cookie: 동작, 보안 속성, 취약점
- [[web-storage]] — Web Storage: localStorage/sessionStorage/IndexedDB 비교
- [[session-vs-cookie]] — Session vs Cookie: HTTP 상태 유지 수단 비교
- [[restful-api-design]] — RESTful API 설계: REST 제약, HTTP 메서드, URI 규칙

## JavaScript

- [[function-declaration]] — 자바스크립트 함수 선언: 함수 선언문/함수 표현식/화살표 함수 비교, 호이스팅, 기본·나머지 매개변수
- [[promise]] — 자바스크립트 Promise: 상태, 생성과 소비, 체이닝(then/catch/finally), 동시성 정적 메서드(all/allSettled/race/any), Thenable
- [[async-await]] — 자바스크립트 async/await: async 함수의 Promise 반환, await 동작, 순차/동시 실행, forEach·return await·처리되지 않은 거부 주의사항
- [[null-operators]] — 자바스크립트 null 관련 연산자: 옵셔널 체이닝, 널 병합, 널 병합 할당
- [[truthy-falsy]] — 자바스크립트 Truthy/Falsy: 8가지 falsy 값, truthy 값, nullish와의 관계
- [[module-system]] — 자바스크립트 모듈 시스템: CommonJS vs ES Module 비교, package.json exports/imports
- [[commonjs]] — CommonJS: require/module.exports 문법과 동작
- [[es-module]] — ES Module: import/export 문법과 동작, 순환 참조, 브라우저 `<script type="module">`의 기본 defer 동작
- [[template-literals]] — 템플릿 리터럴(백틱): 문자열 보간, 여러 줄 문자열, 중첩, tagged template, raw 문자열
- [[fetch-api]] — Fetch API: 기본 사용법, 응답 상태 확인, 요청 옵션, 본문 읽기, 요청 취소, 리다이렉트·에러 처리
- [[variable-declaration]] — 자바스크립트 변수 선언: var/let/const 비교, 스코프, 호이스팅·TDZ, 재선언/재할당, 전역 객체 프로퍼티
- [[lexical-scope]] — 자바스크립트 렉시컬 스코프: 스코프 체인, 환경 레코드, 클로저, this, with·eval 예외

## TypeScript

- [[typescript]] — TypeScript: 정적 타입, 컴파일러(tsc/TS 7.0 네이티브), 관련 도구, 장단점
- [[tsconfig]] — tsconfig.json: 최상위 필드, compilerOptions 카테고리·주요 옵션, 프로젝트 참조
- [[typescript-5.0]] — TypeScript 5.0: 추가된 옵션·언어 기능(Decorators 등), deprecated 옵션(TS 6.0에서 제거됨)
- [[typescript-6.0]] — TypeScript 6.0: 추가된 옵션, 기본값 변경, 언어 기능, deprecated 옵션(TS 7.0에서 제거 예정)

## Node.js

- [[npm]] — npm: package.json, semver 버전 범위, lockfile, scripts·라이프사이클, workspaces, 명령어
- [[npx]] — npx: 로컬·원격 패키지 실행, bin 이름 추론, npm exec 차이, v7 변경사항
- [[package-manager]] — Node 패키지 매니저 비교: node_modules 배치(hoisting/심볼릭 링크/PnP), lockfile, Corepack

## NestJS

- [[nestjs]] — NestJS: Express/Fastify 플랫폼, 장단점, 설치, 프로젝트 구조, 스크립트, 데코레이터
- [[nestjs-dependency-injection]] — NestJS 의존성 주입: 토큰, 커스텀 프로바이더, 순환 의존성, Spring DI 비교
- [[nestjs-modules]] — NestJS 모듈: 캡슐화, 공유·재노출, 전역·동적 모듈
- [[nestjs-config]] — NestJS Config: ConfigModule/ConfigService, .env, forRoot/forFeature, Spring 설정과 비교
- [[nestjs-controllers]] — NestJS 컨트롤러: 라우팅, 파라미터 데코레이터, 요청 파이프라인 개략
- [[nestjs-request-pipeline]] — NestJS 요청 파이프라인: Guard, Pipe, Interceptor, Exception Filter
- [[nestjs-testing]] — NestJS 테스트: Jest, TestingModule, Mock 교체, e2e
- [[nestjs-database]] — NestJS 데이터베이스 연결: TypeORM/Mongoose/Sequelize/Prisma 비교, raw SQL
- [[nestjs-typeorm]] — NestJS TypeORM: Entity, Repository, 트랜잭션, 다중 연결
- [[nestjs-mongoose]] — NestJS Mongoose: Schema, Model, forFeature
- [[nestjs-sequelize]] — NestJS Sequelize: Active Record 모델, forFeature
- [[nestjs-prisma]] — NestJS Prisma: schema.prisma, PrismaService, raw SQL
- [[nestjs-static-files]] — NestJS 정적 파일 서빙: ServeStaticModule, useStaticAssets, 빌드 스크립트
