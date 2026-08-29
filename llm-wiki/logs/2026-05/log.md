# log

---

## 2026-05-28 15:20:00

- **생성**: `wiki/dbms/execution-plan-and-statistics.md` — RDBMS 실행 계획 및 옵티마이저 통계 정보 통합 문서 생성
- **삭제**: `wiki/dbms/execution-plan.md`, `wiki/dbms/optimizer-statistics.md` — 이전 분리 생성된 개별 문서들 제거
- **수정**: `wiki/dbms/oracle-hints.md` — Related pages 링크를 통합 문서(`[[execution-plan-and-statistics]]`)로 갱신
- **수정**: `wiki/index.md` — DBMS 섹션을 통합 문서 링크 및 설명으로 업데이트

---

## 2026-05-20 17:11:09

- **생성**: `wiki/java/spring/spring-aop.md` — Spring AOP 개요: AOP 용어 정의, Advice 5종 비교 표, 런타임 프록시(JDK/CGLIB), Spring AOP vs AspectJ 비교, self-invocation·static/final 제약사항
- **생성**: `wiki/java/spring/spring-aop-usage.md` — Spring AOP 사용법: 의존성, @Aspect 클래스, Pointcut 표현식, Advice 5종 코드 예시, MethodSignature 정보 추출, 로깅 패턴, Mockito 단위/SpringBootTest 통합 테스트
- **생성**: `wiki/java/spring/aspectj.md` — AspectJ: 위빙 3방식(CTW/포스트 컴파일/LTW), JoinPoint 지원 범위, ajc, Spring LTW 통합, @AspectJ 스타일, 선택 기준
- **수정**: `wiki/index.md` — Spring 섹션에 spring-aop, spring-aop-usage, aspectj 추가

---

## 2026-05-20 15:52:51

- **생성**: `wiki/java/common/sbom.md` — SBOM 개요: 개념·구성 요소, SPDX/CycloneDX/SWID 형식 비교, 라이프사이클, 보안 통합(Dependency-Track/Dependabot), 공급망 보안, 규제(EO 14028/FDA/CISA), 클라우드 네이티브 SBOM
- **생성**: `wiki/java/common/sbom-java.md` — Java SBOM 생성: Source vs Build SBOM, Maven/Gradle 의존성 선언, Gradle Lockfile, 트랜지티브 해석 차이, 멀티모듈, cdxgen/CycloneDX Plugin/Trivy 도구, Gradle Plugin 상세 설정, Shaded JAR 처리, Best Practices
- **수정**: `wiki/index.md` — Java 섹션에 sbom, sbom-java 항목 추가

---

## 2026-05-19 17:45:59

- **수정**: `wiki/java/spring/mybatis-overview.md` — 비교/장단점/의존성/버전 호환성 중심으로 재작성
- **생성**: `wiki/java/spring/mybatis-usage.md` — mybatis-config.xml, Spring/Boot 설정, Mapper API, Dynamic SQL, 트랜잭션
- **삭제**: `wiki/java/spring/mybatis-build.md` → `mybatis-usage.md`로 대체
- **수정**: `wiki/index.md` — mybatis-build → mybatis-usage 링크 갱신

---

## 2026-05-19 17:26:04

- **생성**: `wiki/java/spring/mybatis-overview.md` — SqlSessionFactory/SqlSession, Mapper 애너테이션, Dynamic SQL, mybatis-config.xml 주요 설정
- **생성**: `wiki/java/spring/mybatis-build.md` — SqlSessionFactoryBean, @MapperScan, 트랜잭션, Spring Boot 자동 구성, 버전 호환성
- **수정**: `wiki/index.md` — mybatis-overview, mybatis-build 항목 추가
- 소스: `Quick Guide to MyBatis.md`, `MyBatis 3 Configuration.md`, `MyBatis with Spring.md`, `mybatis-spring.md`, `mybatis-spring 1.md`, `mybatis-spring 2.md`, `Introduction – mybatis-spring-boot-autoconfigure.md`

---

## 2026-05-19 17:04:47

- **생성**: `wiki/java/spring/jooq-overview.md` — DSLContext, CRUD, 조인, count, JPA 통합 주의사항
- **생성**: `wiki/java/spring/jooq-build.md` — Maven/Spring Boot 의존성, 코드 생성(DB 스캔/JPADatabase), Spring 설정
- **수정**: `wiki/index.md` — jooq-overview, jooq-build 항목 추가
- 소스: `Getting Started with jOOQ.md`, `Introduction to Jooq with Spring.md`, `Spring Boot Support for jOOQ.md`, `Join Two Tables Using jOOQ.md`, `Count Query In jOOQ.md`, `jOOQ를 JPA와 같이 써보자.md`

---

## 2026-05-19 16:30:56

- **삭제**: `wiki/java/spring/querydsl-setup.md` → `querydsl-build.md`로 대체
- **생성**: `wiki/java/spring/querydsl-build.md` — 제목 변경: "QueryDSL 빌드 설정 — Maven/Gradle, APT/KSP, OpenFeign 포크"
- **수정**: `wiki/index.md`, `wiki/java/spring/querydsl-overview.md` — 링크 `querydsl-setup` → `querydsl-build` 갱신

---

## 2026-05-19 16:28:28

- **생성**: `wiki/java/spring/querydsl-overview.md` — Q-type, JPAQueryFactory 빈 등록, 쿼리 API, Custom Repository 패턴
- **생성**: `wiki/java/spring/querydsl-setup.md` — Maven/Gradle 빌드 설정, 공식 vs OpenFeign 포크, KSP 적용, 마이그레이션
- **수정**: `wiki/index.md` — querydsl-overview, querydsl-setup 항목 추가
- 소스: `Intro to Querydsl.md`, `A Guide to Querydsl with JPA.md`, `Gradle SpringBoot 3.x + QueryDSL 적용하기.md`, `QueryDSL OpenFeign QueryDSL 기본 설정 및 사용법.md`, `OpenFeign QueryDSL 6.11 적용하기 (feat. KSP).md`

---

## 2026-05-19 15:55:11

- **수정**: `wiki/linux/security/openssl-crl.md`
  - `-verify` 동작 보강: 묵시적 활성화 조건, 실패 시 즉시 종료, OpenSSL 3.3+ exit code 1 반환 명시
  - 옵션 테이블에 누락 항목 추가: `-hash_old`, `-nameopt`, `-dateopt`, `-key`, `-keyform`, `-badsig`, `-CApath`, `-CAstore`

---

## 2026-05-18 17:57:51

- updated `wiki/java/spring/repository-projection.md`
  - 메타데이터 포맷 수정 (bold 키, H1 제거)
  - 추가 소스: Transactionality (Spring Data JPA 공식), Repository query return types (Spring Data JPA 공식)
  - 추가 섹션: 반환 타입 표(Page/Slice/Stream/Optional 등), 리포지토리 트랜잭션 설정(SimpleJpaRepository 상속/커스텀 쿼리 @Transactional 필요/facade 패턴)
  - Related pages 추가: jpa-transaction, jpa-n-plus-one, jpa-composite-key, jpa-delete
- updated `wiki/index.md`: repository-projection 설명 업데이트

---

## 2026-05-18 17:45:23

- created `wiki/java/spring/jpa-transaction.md`
  - sources: Transaction Propagation and Isolation (Baeldung), Transactions with Spring and JPA (Baeldung), Does @Transactional Work on Private Method? (Baeldung), JPA Transactional 잘 알고 쓰고 계신가요 (카카오페이), Spring Transaction and Connection Management (Vlad Mihalcea), Using Transactions for Read-Only Operations (Baeldung), 실무에서 만난 글로벌 롤백 마킹
  - AOP 프록시 원리(CGLIB/JDK), 접근 제어자 제한(private 무시/Spring 6.0+ protected 지원), self-invocation 문제, Propagation 7종 비교표, Isolation 4종 + DB별 기본값, Rollback 규칙(Checked Exception), 글로벌 롤백 마킹(globalRollbackOnParticipationFailure/UnexpectedRollbackException/해결책), readOnly 트랜잭션(SimpleJpaRepository 기본 설정/set_option 추가 쿼리 성능 실측/SUPPORTS propagation), 커넥션 획득 시점(eager 획득 문제/lazy 설정), 안티패턴 요약
- updated `wiki/index.md`: Spring 섹션에 jpa-transaction 항목 추가

---

## 2026-05-18 16:47:00

- updated `wiki/java/spring/jpa-entity-lifecycle.md`, `jpa-n-plus-one.md`, `jpa-composite-key.md`: Related pages에 `[[jpa-delete]]` 역링크 추가 (wiki-lint 결과 반영)

---

## 2026-05-18 16:44:40

- created `wiki/java/spring/jpa-delete.md`
  - sources: Spring Data JPA Delete and Relationships (Baeldung), Spring Data JPA @Modifying Annotation (Baeldung), JPA @Modifying이란? (블로그), How to Implement a Soft Delete with Spring JPA (Baeldung), Soft deletion in Hibernate (JPA Buddy), SQLRestriction (Hibernate Javadocs)
  - deleteById/deleteAll/파생쿼리/bulkDML(@Modifying) 방식 비교 및 라이프사이클 콜백 호출 여부, @Modifying 옵션(clearAutomatically/flushAutomatically) + 1차 캐시 불일치 문제, CascadeType.ALL + orphanRemoval, Soft Delete(@SQLDelete/@SQLRestriction/@Where), ToMany/Lazy-ToOne/Eager-ToOne 함정 및 @NotFound 부작용, 유니크 제약 주의, @FilterDef+@Filter 동적 필터
- updated `wiki/index.md`: Spring 섹션에 jpa-delete 항목 추가

---

## 2026-05-18 16:40:28

- created `wiki/dbms/oracle-hints.md` (new category: `dbms/`)
  - sources: Using Optimizer Hints (Oracle 11g Performance Tuning Guide Ch.19), SQL Tuning Guide (Oracle 19c Ch.19)
  - 힌트 문법(블록/단일행 주석, alias 규칙), 액세스 경로 힌트(INDEX/NO_INDEX/INDEX_ASC/INDEX_DESC/INDEX_COMBINE/INDEX_JOIN/INDEX_FFS/INDEX_SS/FULL), 조인 순서 힌트(LEADING/ORDERED), 조인 방법 힌트(USE_NL/USE_HASH/USE_MERGE 및 NO_ 변형), 최적화 목표(ALL_ROWS/FIRST_ROWS), 힌트 충돌 규칙, Hint Report(Oracle 19c+ DBMS_XPLAN E/N/U 애노테이션)
- updated `wiki/index.md`: `## DBMS` 섹션 신규 추가

---

## 2026-05-18 14:35:04

- created `wiki/java/spring/jpa-entity-lifecycle.md`
  - sources: JPA Entity Lifecycle Events (Baeldung), Change Field Value Before Update and Insert in Hibernate (Baeldung), Auditing with JPA Hibernate and Spring Data JPA (Baeldung)
  - 콜백 7가지 어노테이션, 메서드 규칙(JPA 명세 제한), 엔티티 내부 콜백, 외부 EntityListener, Spring Data Auditing(@EnableJpaAuditing·AuditingEntityListener·@CreatedDate·AuditorAware), Hibernate Envers(@Audited·AuditReader), 방식별 비교표

---

## 2026-05-18 14:30:12

- created `wiki/java/spring/jpa-composite-key.md`
  - sources: Composite Primary Keys in JPA (Baeldung), Hibernate ORM User Guide
  - @EmbeddedId(@Embeddable 키 클래스 + 단일 필드), @IdClass(키 클래스 + 엔티티 각 필드 @Id 중복), 비교표, Spring Data JPA 레포지토리 선언, @MapsId 파생 식별자

---

## 2026-05-18 14:17:50

- updated `wiki/linux/text/standard-streams.md`
  - sources: stdin(3) Linux manual page, Redirections (Bash Reference Manual), Guide to Stream Redirections in Linux (Baeldung)
  - 형식 수정: 첫 줄 H1 헤딩 제거, 메타데이터 키 볼드 처리
  - Sources: 외부 URL → raw/ 파일 경로로 교체, Baeldung 소스 추가
  - 내용 변경 없음 (기존 페이지가 소스 전체를 이미 커버)

---

## 2026-05-18 14:08:05

- updated `wiki/linux/security/openssl-overview.md`, `openssl-dgst.md`, `openssl-keygen.md`, `openssl-x509.md`, `openssl-pkcs12.md`, `openssl-cms.md`, `openssl-s_client.md` (7개 파일)
  - 메타데이터 키 볼드 적용 (`**Title**`, `**Last updated**`, `**Tags**`)
  - Sources 섹션: 외부 URL → `raw/linux/openssl/` 파일 경로로 교체
  - dgst: `-sign`이 Ed25519·Ed448 미지원 주의사항 추가 (`openssl pkeyutl` 사용 권고)
  - x509: serial 미지정 시 랜덤 생성 주의사항 추가
  - cms: `openssl smime` 기본 다이제스트 SHA-1 (cms는 SHA-256) 명시
  - s_client: SNI 자동 설정 (1.1.1+) 주석, `-ign_eof` 비대화형 사용 섹션 및 옵션 추가, STARTTLS 지원 프로토콜 전체 목록 보완 (xmpp-server, irc, lmtp, nntp, sieve)

---

## 2026-05-18 13:53:41

- updated `wiki/java/common/jvm-options.md`
  - added source: Exploring Advanced JVM Options (Baeldung)
  - 추가: MetaspaceSize/MaxRAMPercentage/AlwaysPreTouch 등 메모리 옵션, GC 선택표(Shenandoah/ZGC/Epsilon 포함), Unified Logging(-Xlog), JIT 옵션 상세, OOM 처리(Exit/Crash/OnOOM), NativeMemoryTracking, 컨테이너 환경 옵션, 모듈 시스템(--add-opens), 실전 예시

---

## 2026-05-18 13:43:27

- created `wiki/java/spring/externalized-configuration.md`
  - sources: Externalized Configuration (Spring Boot 공식)
  - PropertySource 15단계 우선순위, Config data 파일 순위, 검색 경로, OS 환경변수/JVM -D/CLI/JSON 사용법, Profile-specific last-wins, Property Placeholder

---

## 2026-05-18 13:38:28

- created `wiki/java/spring/configuration-properties.md`
  - sources: Guide to @ConfigurationProperties in Spring Boot (Baeldung), Externalized Configuration (Spring Boot 공식), ConstructorBinding API (2.6.3, 3.0)
  - 빈 등록 3가지 방법, Relaxed Binding, 중첩 프로퍼티, Constructor Binding, 검증, 타입 변환, @Bean 메서드 적용, @Value 비교

---

## 2026-05-18 13:35:19 (wiki-lint-java-common)

**변경 사항** :
- `wiki/java/common/` 하위 7개 파일 전면 수정
    - `java-version.md`, `java17-features.md`, `java21-features.md`, `jmap.md`, `jps.md`, `jstack.md`, `jvm-options.md`
    - `AGENTS.md` 가이드라인에 따라 메타데이터 표 형식 적용, `raw/` 소스 기반으로 내용 재구성, `Sources` 및 `Related pages` 섹션 보완
    - 불필요한 서술 제거 및 LaTeX 수식 표현 적용

---

## 2026-05-18 13:30:57 (jpa-n-plus-one creation)

**변경 사항** :
- `wiki/java/spring/jpa-n-plus-one.md` 생성 — JPA N+1 문제 정의, 원인(지연/즉시 로딩), 해결 방법(Fetch Join, @EntityGraph, Batch Size, DTO 조회) 및 실무 권장 전략 정리
- `wiki/index.md` 업데이트 — Spring 섹션에 `[[jpa-n-plus-one]]` 항목 추가

---

## 2026-05-18 13:22:01 (repository-projection rename)

**변경 사항** :
- `wiki/java/spring/class-projection.md` → `wiki/java/spring/repository-projection.md` 이동 및 제목 변경
- `wiki/java/spring/repository-projection.md` 수정 — interface-based projection, closed/open projection, nullable wrapper, native query의 interface projection alias 규칙 추가. 범위를 “리포지터리가 엔티티 외 타입을 반환하는 방법” 전체로 확장
- `wiki/index.md` 업데이트 — Spring 섹션 항목을 `[[repository-projection]]`로 변경

---

## 2026-05-18 13:19:36 (class-projection)

**변경 사항** :
- `wiki/java/spring/class-projection.md` 생성 — JPA class-based projection 정리 (DTO/record 타입 정의, derived query, JPQL constructor expression, dynamic projection, native query에서의 `@NamedNativeQuery` + `@SqlResultSetMapping`)
- `wiki/index.md` 업데이트 — Spring 섹션에 `[[class-projection]]` 항목 추가

---

## 2026-05-18 11:36:17 (multi-datasource datasource config)

**변경 사항** :
- `wiki/java/spring/multi-datasource.md` 수정 — `DataSource` 설정 방법 추가 (`DataSourceBuilder` 직접 생성, `DataSourceProperties + initializeDataSourceBuilder()` 권장 방식, Hikari의 `url`/`jdbc-url` 차이, DB별 prefix 분리)

---

## 2026-05-18 11:36:17 (sources raw-only)

**변경 사항** :
- `AGENTS.md` 업데이트 — 위키 출처 규칙을 `raw/` 파일 기준으로 한정, `Sources` 섹션 설명도 raw 파일 목록 기준으로 수정
- `wiki/java/spring/multi-datasource.md` 수정 — `Sources`를 외부 URL 대신 `raw/java/spring/...` 파일 경로로 변경
- `wiki/java/spring/routing-datasource.md` 수정 — `Sources`를 외부 URL 대신 `raw/java/spring/...` 파일 경로로 변경

---

## 2026-05-18 11:34:48 (AGENTS update)

**변경 사항** :
- `AGENTS.md` 업데이트 — `wiki/java/spring/` 설명을 Spring / JPA / DataSource 관련 위키 페이지로 명확화
- `AGENTS.md` 업데이트 — 위키 콘텐츠 소스를 `raw/` 또는 기존 공식/준공식 URL까지 허용하는 규칙으로 정리

---

## 2026-05-18 11:33:20 (routing-datasource split)

**소스** :
- [Data Access :: Spring Boot](https://docs.spring.io/spring-boot/how-to/data-access.html#howto.data-access.configure-two-datasources)
- [Configuration :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/create-instances.html)
- [AbstractRoutingDataSource (Spring Framework Javadoc)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/lookup/AbstractRoutingDataSource.html)
- [A Guide to Spring AbstractRoutingDatasource](https://www.baeldung.com/spring-abstract-routing-data-source)

**변경 사항** :
- `wiki/java/spring/multi-datasource.md` 수정 — 라우팅 관련 설명, 예시, 소스 분리. 다중 JPA persistence unit 설정 내용만 남김
- `wiki/java/spring/routing-datasource.md` 생성 — `AbstractRoutingDataSource` 개요, lookup key, `ThreadLocal` 컨텍스트, fallback 정책, 운영 시 주의점 정리
- `wiki/index.md` 업데이트 — Spring 섹션에 `[[routing-datasource]]` 추가, `[[multi-datasource]]` 설명 정리

---

## 2026-05-18 11:12:27 (multi-datasource)

**소스** :
- [Data Access :: Spring Boot](https://docs.spring.io/spring-boot/how-to/data-access.html#howto.data-access.configure-two-datasources)
- [Configuration :: Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/repositories/create-instances.html)
- [AbstractRoutingDataSource (Spring Framework Javadoc)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/lookup/AbstractRoutingDataSource.html)
- [A Guide to Spring AbstractRoutingDatasource](https://www.baeldung.com/spring-abstract-routing-data-source)

**변경 사항** :
- `wiki/java/spring/multi-datasource.md` 생성 — JPA 다중 DB 설정 정리 (추가 `DataSource`의 `defaultCandidate=false`/`@Qualifier`, DB별 `LocalContainerEntityManagerFactoryBean`·`JpaTransactionManager`, `@EnableJpaRepositories`의 `entityManagerFactoryRef`·`transactionManagerRef`, 엔티티/리포지토리 패키지 분리, `AbstractRoutingDataSource` 적용 시점)
- `wiki/index.md` 업데이트 — Spring 섹션에 `[[multi-datasource]]` 항목 추가

---

## 2026-05-15 17:47:55 (jpa-composite-key)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-composite-key.md` 생성 — @IdClass(키 클래스·엔티티 선언·JPQL 직접 접근·@Id+@ManyToOne FK 매핑)와 @EmbeddedId(@Embeddable 키 클래스·JPQL 중첩 접근·@MapsId FK 매핑) 각각 설명, 공통 요구사항(Serializable/equals/hashCode), 방식 비교표(캡슐화·JPQL·@Column 위치·선택 기준)
- `wiki/index.md` 업데이트 — `[[jpa-composite-key]]` 항목 추가

---

## 2026-05-15 17:38:46 (jpa-lifecycle-callbacks)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-lifecycle-callbacks.md` 생성 — @PrePersist/@PostPersist/@PreUpdate/@PostUpdate/@PreRemove/@PostRemove/@PostLoad 콜백 어노테이션 트리거 시점·메서드 규칙, @EntityListeners 외부 리스너(분리 패턴·다중 리스너·실행 순서), Spring Data JPA AuditingEntityListener(@EnableJpaAuditing/@CreatedDate/@LastModifiedDate/@CreatedBy/@LastModifiedBy/MappedSuperclass/AuditorAware), 리스너에서 Spring Bean 주입(ApplicationContextAware 우회), 상속 콜백 우선순위, 방식 비교표
- `wiki/java/spring-boot/jpa/jpa-entity.md` 업데이트 — Related pages에 `[[jpa-lifecycle-callbacks]]` 추가, Last updated 갱신
- `wiki/index.md` 업데이트 — `[[jpa-lifecycle-callbacks]]` 항목 추가

---

## 2026-05-15 17:22:13 (jpa-query)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-query.md` 생성 — @Query 속성 전체(value/nativeQuery/countQuery/countProjection/name/countName/queryRewriter), JPQL·Native SQL 사용법, 결과 매핑 5가지(JPQL new 생성자/인터페이스 Closed·Open 프로젝션/@SqlResultSetMapping+@NamedNativeQuery/클래스·Record 기반/동적 프로젝션), 방식별 비교표
- `wiki/index.md` 업데이트 — `[[jpa-query]]` 항목 추가

---

## 2026-05-15 17:10:54 (jpa-repository)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-repository.md` 생성 — Repository 계층 구조(CrudRepository·PagingAndSortingRepository·JpaRepository 메서드 비교), @Repository 필요 여부, @Query/@Modifying/@EntityGraph/@Lock/@QueryHints/@NoRepositoryBean 어노테이션, 쿼리 메서드 개요(상세는 jpa-query-methods로 분리 예정)
- `wiki/index.md` 업데이트 — `[[jpa-repository]]` 항목 추가

---

## 2026-05-15 16:06:29 (configuration-proxy)

**변경 사항** :
- `wiki/java/spring-boot/config/configuration-proxy.md` 생성 — `@Configuration` proxyBeanMethods Full mode(CGLIB 프록시, @Bean 직접 호출 싱글톤 보장) vs Lite mode(false), 의존 표현 방식(직접 호출 vs 파라미터 주입) 비교, @Component Lite mode 주의사항, 선택 기준
- `wiki/index.md` 업데이트 — `[[configuration-proxy]]` 항목 추가

---

## 2026-05-15 15:46:13 (jpa-transaction 보강)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-transaction.md` 수정 — 사례 3번(UnexpectedRollbackException) 보강: 배치 상품 처리 실제 사례, `AbstractPlatformTransactionManager.globalRollbackOnParticipationFailure` 메커니즘, `doSetRollbackOnly()` 흐름 다이어그램, 해결책 3가지(`REQUIRES_NEW`/`globalRollbackOnParticipationFailure(false)`/`NESTED`) 비교표 추가
- Sources에 mj950425.github.io rollback-marking 사례 링크 추가

---

## 2026-05-15 15:39:57 (jpa-transaction)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-transaction.md` 생성 — AOP 프록시 동작 원리, @Transactional 속성(propagation/isolation/readOnly/rollbackFor), 내부 메서드 호출 self-invocation 문제·해결책, 수동 롤백, 트러블슈팅 5가지(Checked예외 롤백 누락/try-catch 예외 삼킴/UnexpectedRollbackException/private 메서드/LazyInitializationException)
- `wiki/index.md` 업데이트 — `[[jpa-transaction]]` 항목 추가

---

## 2026-05-15 15:35:56 (jpa-performance)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-performance.md` 생성 — H2/MariaDB/PostgreSQL 환경별 Native JDBC·JdbcTemplate·MyBatis·Hibernate 처리 속도 비교, 배치 처리·N+1·집계 쿼리 시나리오별 수치, 실무 시사점
- `wiki/index.md` 업데이트 — `[[jpa-performance]]` 항목 추가

---

## 2026-05-15 15:28:49 (jpa-association)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-association.md` 생성 — 연관관계 주인(mappedBy/@JoinColumn), @ManyToOne/@OneToMany(양방향/단방향)/@OneToOne/@ManyToMany(중간 엔티티 분리), cascade 옵션, orphanRemoval, N+1 참고 링크
- `wiki/index.md` 업데이트 — `[[jpa-association]]` 항목 추가

---

## 2026-05-15 15:24:09 (jpa-n-plus-one)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-n-plus-one.md` 생성 — N+1 문제 원인(FetchType), Fetch Join 동작 원리·JPQL 사용법(@Query), 페이지네이션 제약·중복·MultipleBagFetchException 주의사항, @Fetch(FetchMode), batch_fetch_size/@EntityGraph 대안
- `wiki/index.md` 업데이트 — `[[jpa-entity]]`, `[[jpa-n-plus-one]]` 항목 추가

---

## 2026-05-15 14:55:00 (directory-restructure spring-boot db config)

**변경 사항** :
- `wiki/java/spring-boot/{datasource,multi-datasource,jdbc-template}.md` → `spring-boot/db/` 이동
- `wiki/java/spring-boot/{configuration-properties,externalized-config}.md` → `spring-boot/config/` 이동
- `AGENTS.md` 업데이트 — `spring-boot/db/`, `spring-boot/config/` 디렉터리 구조 반영

---

## 2026-05-15 14:53:12 (jpa-setup)

**소스** :
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/)
- [Spring Boot Auto-configuration: JPA](https://docs.spring.io/spring-boot/reference/data/sql.html#data.sql.jpa-and-spring-data)
- [Hibernate ORM Documentation](https://hibernate.org/orm/documentation/)

**변경 사항** :
- `wiki/java/spring-boot/jpa/jpa-setup.md` 생성 — Spring Boot JPA 시작 (의존성, application.yml ddl-auto·open-in-view 설정, 커스텀 EntityManagerFactory 설정, 엔티티·연관관계·감사·Repository 어노테이션 정리, 자동 설정 동작 원리 및 트랜잭션 흐름)
- `wiki/index.md` 업데이트 — JPA 섹션에 `[[jpa-setup]]` 추가

---

## 2026-05-15 14:50:03 (directory-restructure linux)

**변경 사항** :
- `wiki/linux/` 하위 41개 파일을 6개 서브 폴더로 재배치
  - `filesystem/` (9): df, du, inode, ls, find, cp-mv, directory-navigation, file-encoding, compression-archiving
  - `text/` (3): standard-streams, cat-tee-more-less, grep-sed-awk
  - `network/` (6): ssh, curl, network-diagnostics, dns-configuration, dns-tools, lsof
  - `system/` (9): system-monitoring, linux-system-info, ps-nohup, systemctl, systemd-unit-file, journalctl, user-group-management, environment-variables, time
  - `editor/` (6): readline-shortcuts, vim-01~05
  - `security/` (8): linux-file-permissions, openssl-overview, openssl-dgst, openssl-keygen, openssl-x509, openssl-pkcs12, openssl-cms, openssl-s_client
- `AGENTS.md` 업데이트 — linux 서브 폴더 구조 반영

---

## 2026-05-15 14:48:36 (move httpservletrequest-guide)

**변경 사항** :
- `wiki/java/common/httpservletrequest-guide.md` → `wiki/java/spring-boot/web/` 이동

---

## 2026-05-15 14:48:03 (directory-restructure web)

**변경 사항** :
- `wiki/java/spring-boot/{controller-advice,controller-annotations,filter,filter-vs-interceptor,interceptor}.md` → `wiki/java/spring-boot/web/` 이동
- `AGENTS.md` 업데이트 — `spring-boot/web/` 디렉터리 구조 반영

---

## 2026-05-15 14:47:19 (directory-restructure logging)

**변경 사항** :
- `wiki/java/spring-boot/{logging-overview,logback,log4j2,logging-masking}.md` → `wiki/java/spring-boot/logging/` 이동
- `AGENTS.md` 업데이트 — `spring-boot/logging/` 디렉터리 구조 반영

---

## 2026-05-15 14:44:36 (directory-restructure java/common)

**변경 사항** :
- `wiki/java/*.md` → `wiki/java/common/` 디렉터리 이동 (자바 언어·JVM 관련 파일을 common 하위로 재배치)
- `AGENTS.md` 업데이트 — `java/common/` 디렉터리 구조 반영

---

## 2026-05-15 14:40:24 (directory-restructure + jpa-overview)

**변경 사항** :
- `wiki/spring-boot/` → `wiki/java/spring-boot/` 디렉터리 이동 (spring-boot 전체를 java 하위로 재배치)
- `wiki/java/spring-boot/jpa/` 디렉터리 신규 생성
- `wiki/java/spring-boot/jpa/jpa-overview.md` 생성 — JPA 개요 (ORM 개념, 영속성 컨텍스트·1차 캐시·더티 체킹·쓰기 지연, 엔티티 생명주기, Hibernate 등 주요 구현체, JPA vs MyBatis vs JdbcTemplate 비교, 장단점)
- `AGENTS.md` 업데이트 — 디렉터리 구조 반영 (spring-boot을 java/ 하위로, jpa를 spring-boot/ 하위로)
- `wiki/index.md` 업데이트 — JPA 섹션 신규 추가, `[[jpa-overview]]` 등록

---

## 2026-05-15 14:10:23 (logging-masking)

**소스** :
- [Logback Manual: Custom Converters](https://logback.qos.ch/manual/layouts.html#customConversionSpecifier)
- [Log4j2 Manual: Custom Pattern Converters](https://logging.apache.org/log4j/2.x/manual/extending.html#PatternConverters)
- [Log4j2 Manual: Rewrite Appender](https://logging.apache.org/log4j/2.x/manual/appenders/delegating.html#RewriteAppender)

**변경 사항** :
- `wiki/spring-boot/logging-masking.md` 생성 — 로깅 PII 마스킹 정리 (공통 마스킹 유틸리티, Logback: %replace·MessageConverter, Log4j2: %replace·PatternConverter Plugin·RewriteAppender+RewritePolicy, 애플리케이션 레벨 마스킹, 방법 비교표)
- `wiki/index.md` 업데이트 — Spring Boot 섹션에 `[[logging-masking]]` 추가

---

## 2026-05-15 13:55:35 (logback)

**소스** :
- [Spring Boot Reference: Logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Logback Manual: Configuration](https://logback.qos.ch/manual/configuration.html)
- [Logback Manual: Appenders](https://logback.qos.ch/manual/appenders.html)

**변경 사항** :
- `wiki/spring-boot/logback.md` 업데이트 — logback.xml vs logback-spring.xml 로딩 주체·시점 비교 보강, XML 구성 요소 섹션 신규 추가(<configuration>/<property>/<springProperty>/<encoder>/<filter>/<springProfile>/<include> 상세), 패턴 변환어 표 추가, Appender 상세 보강(ConsoleAppender/FileAppender/RollingFileAppender 3종 롤링 정책/AsyncAppender 태그 설명 표)

---

## 2026-05-15 13:41:15 (multi-datasource)

**소스** :
- [Configure Two DataSources :: Spring Boot](https://docs.spring.io/spring-boot/how-to/data-access.html#howto.data-access.configure-two-datasources)
- [AbstractRoutingDataSource (Spring Framework Javadoc)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/lookup/AbstractRoutingDataSource.html)

**변경 사항** :
- `wiki/spring-boot/multi-datasource.md` 생성 — 다중 DataSource 설정(@Primary/@Qualifier/defaultCandidate=false, DataSourceProperties), JPA 다중 EntityManager, AbstractRoutingDataSource 원리·구현(ThreadLocal 라우팅 키), Read/Write Splitting AOP 예시
- `wiki/index.md` 업데이트 — Spring Boot 섹션에 `[[multi-datasource]]` 항목 추가

---

## 2026-05-15 (httpservletrequest-guide)

**소스** : [Jakarta Servlet Specification](https://jakarta.ee/specifications/servlet/), [Baeldung: Reading HttpServletRequest Multiple Times](https://www.baeldung.com/reading-httpservletrequest-multiple-times)

**변경 사항** :
- `wiki/java/httpservletrequest-guide.md` 생성 — HttpServletRequest 요청 정보 추출 방법(URL, IP, 헤더, 파라미터) 및 스트림 휘발성 대응을 위한 본문 캐싱 커스텀 Wrapper 구현 가이드 작성
- `wiki/index.md` 업데이트 — Java 섹션에 `[[httpservletrequest-guide]]` 추가 및 마지막 업데이트 시각 갱신

---

---

## 2026-05-15 (openssl-related-pages-links)

**변경 사항** :
- `wiki/linux/openssl-keygen.md` 업데이트 — `[[openssl-req-x509]]` 오류 링크를 `[[openssl-x509]]`로 수정, `[[openssl-pkcs12]]`, `[[openssl-cms]]` 추가
- `wiki/linux/openssl-x509.md` 업데이트 — `[[openssl-cms]]` 추가
- `wiki/linux/openssl-pkcs12.md` 업데이트 — `[[openssl-cms]]` 추가
- `wiki/linux/openssl-cms.md` 업데이트 — `[[openssl-dgst]]`, `[[openssl-s_client]]` 추가
- `wiki/linux/openssl-s_client.md` 업데이트 — `[[openssl-pkcs12]]` 추가, 순서 정리

---

## 2026-05-15 (openssl-dgst-links)

**변경 사항** :
- `wiki/linux/openssl-dgst.md` 업데이트 — Related pages에 [[openssl-keygen]], [[openssl-cms]] 위키 링크 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-overview-links)

**변경 사항** :
- `wiki/linux/openssl-overview.md` 업데이트 — Related pages의 텍스트 링크를 실제 위키 링크([[openssl-dgst]], [[openssl-keygen]], [[openssl-x509]], [[openssl-pkcs12]], [[openssl-cms]], [[openssl-s_client]])로 교체 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-s_client)

**소스** : [openssl-s_client(1)](https://docs.openssl.org/3.0/man1/openssl-s_client)

**변경 사항** :
- `wiki/linux/openssl-s_client.md` 생성 — TLS 연결 진단 정리 (기본 연결·인증서 확인, SNI, STARTTLS, TLS 버전 제어, mTLS, 진단 옵션, 비대화형 스크립트 패턴, 세션 재사용)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-s_client]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-cms)

**소스** : [openssl-cms(1)](https://docs.openssl.org/3.0/man1/openssl-cms), [openssl-smime(1)](https://docs.openssl.org/3.0/man1/openssl-smime)

**변경 사항** :
- `wiki/linux/openssl-cms.md` 생성 — CMS/S/MIME 정리 (서명·검증, 암호화·복호화, Detached vs Opaque 서명, CAdES, smime 레거시 비교)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-cms]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-pkcs12)

**소스** : [openssl-pkcs12(1)](https://docs.openssl.org/3.0/man1/openssl-pkcs12)

**변경 사항** :
- `wiki/linux/openssl-pkcs12.md` 생성 — PKCS#12 정리 (파일 조회, 개인키·인증서 추출, 번들 생성, 비밀번호 지정 방식, OpenSSL 3.0 암호화 변경사항 및 legacy 호환, 주요 옵션)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-pkcs12]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-x509)

**소스** : [openssl-req(1)](https://docs.openssl.org/3.0/man1/openssl-req), [openssl-x509(1)](https://docs.openssl.org/3.0/man1/openssl-x509)

**변경 사항** :
- `wiki/linux/openssl-x509.md` 생성 — X.509 인증서 정리 (CSR 생성·req, 인증서 조회, 자체 서명 인증서, CA 서명, 유효성 확인, PEM↔DER 변환, 주요 옵션 정리)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-x509]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-keygen)

**소스** : [openssl-rand(1)](https://docs.openssl.org/3.0/man1/openssl-rand), [openssl-genpkey(1)](https://docs.openssl.org/3.0/man1/openssl-genpkey), [openssl-pkey(1)](https://docs.openssl.org/3.0/man1/openssl-pkey)

**변경 사항** :
- `wiki/linux/openssl-keygen.md` 생성 — OpenSSL 키 생성 정리 (대칭키 rand, 비대칭키 genpkey RSA/EC/Ed25519, 키 파일 암호화, 공개키 추출, 키 확인·검증, PEM↔DER 변환, genrsa 레거시)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-keygen]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (quick-fix-broken-links)

**변경 사항** :
- `wiki/java/java17-features.md` 업데이트 — 없는 `[[Records]]` 내부 링크를 일반 텍스트로 변경하고 마지막 업데이트 시각 갱신
- `wiki/linux/openssl-overview.md` 업데이트 — 아직 생성되지 않은 OpenSSL 하위 커맨드 위키 링크를 일반 텍스트로 변경하고 마지막 업데이트 시각 갱신
- `wiki/linux/openssl-dgst.md` 업데이트 — 아직 생성되지 않은 OpenSSL 하위 커맨드 위키 링크를 일반 텍스트로 변경하고 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-dgst)

**소스** : [OpenSSL dgst man page (3.0)](https://docs.openssl.org/3.0/man1/openssl-dgst)

**변경 사항** :
- `wiki/linux/openssl-dgst.md` 생성 — openssl dgst 서브커맨드 정리 (해시 기본 사용법, 주요 옵션, 출력 형식 비교, HMAC, 디지털 서명, XOF 알고리즘)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-dgst]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (spring-boot-logging-pages)

**소스** : `https://docs.spring.io/spring-boot/reference/features/logging.html`, `https://docs.spring.io/spring-boot/how-to/logging.html`, `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/AbstractRequestLoggingFilter.html`, `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/CommonsRequestLoggingFilter.html`, `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html`, `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html`, `https://logback.qos.ch/manual/configuration.html`, `https://logback.qos.ch/manual/appenders.html`, `https://logging.apache.org/log4j/2.x/manual/configuration.html`, `https://logging.apache.org/log4j/2.x/manual/appenders.html`

**변경 사항** :
- `wiki/spring-boot/logging-overview.md` 생성 — Spring Boot 로깅 추상화, 구현체 선택, 로깅 레벨, 실무 로깅 위치와 책임 분리 초안 작성
- `wiki/spring-boot/logback.md` 생성 — `logback-spring.xml` 구조, appender, rolling, profile 분기, MDC 패턴 정리
- `wiki/spring-boot/log4j2.md` 생성 — Log4j2 의존성 교체, `log4j2-spring.xml` 구조, appender, rolling, profile 분기, 비동기 로깅 정리
- `wiki/index.md` 업데이트 — Spring Boot 섹션에 로깅 문서 3건 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (openssl-overview)

**소스** : [OpenSSL Documentation](https://docs.openssl.org/), [OpenSSL man pages](https://www.openssl.org/docs/man3.0/man1/)

**변경 사항** :
- `wiki/linux/openssl-overview.md` 생성 — OpenSSL 개요 (libcrypto/libssl 구조, 서브커맨드 일람, 키·인증서 계층, PEM/DER/PKCS#12 인코딩 형식, 주요 알고리즘)
- `wiki/index.md` 업데이트 — Linux CLI 섹션에 `[[openssl-overview]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (java21-features)

**소스** : [JEP 431](https://openjdk.org/jeps/431), [JEP 439](https://openjdk.org/jeps/439), [JEP 440](https://openjdk.org/jeps/440), [JEP 441](https://openjdk.org/jeps/441), [JEP 443](https://openjdk.org/jeps/443), [JEP 444](https://openjdk.org/jeps/444), [JEP 446](https://openjdk.org/jeps/446), [JEP 453](https://openjdk.org/jeps/453), [JEP 454](https://openjdk.org/jeps/454)

**변경 사항** :
- `wiki/java/java21-features.md` 생성 — Java 21 LTS 주요 기능 정리 (Virtual Threads, Sequenced Collections, Record Patterns, Pattern Matching for switch, Structured Concurrency, Scoped Values, Foreign Function & Memory API)
- `wiki/index.md` 업데이트 — Java 섹션에 `[[java21-features]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (spring-filter-interceptor-path-patterns)

**소스** : `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html`, `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/OncePerRequestFilter.html`, `https://docs.spring.io/spring-boot/reference/web/servlet.html`, `https://www.baeldung.com/spring-exclude-filter`

**변경 사항** :
- `wiki/spring-boot/filter.md` 업데이트 — 필터의 특정 URL만 적용하는 방법(`FilterRegistrationBean#addUrlPatterns`)과 제외 방법(`shouldNotFilter`) 보강
- `wiki/spring-boot/interceptor.md` 업데이트 — 인터셉터의 `addPathPatterns(...)`, `excludePathPatterns(...)` 사용 예시와 적용 범위 설명 추가
- `wiki/spring-boot/filter-vs-interceptor.md` 업데이트 — URL 패턴 포함/제외 제어 관점의 차이와 선택 기준 보강

---

## 2026-05-15 (java17-features)

**소스** : [JEP 361](https://openjdk.org/jeps/361), [JEP 378](https://openjdk.org/jeps/378), [JEP 394](https://openjdk.org/jeps/394), [JEP 395](https://openjdk.org/jeps/395), [JEP 403](https://openjdk.org/jeps/403), [JEP 409](https://openjdk.org/jeps/409)

**변경 사항** :
- `wiki/java/java17-features.md` 생성 — Java 17 LTS 주요 기능 정리 (Records, Sealed Classes, Pattern Matching for instanceof, Text Blocks, Switch Expressions, JDK 내부 캡슐화 강화)
- `wiki/index.md` 업데이트 — Java 섹션에 `[[java17-features]]` 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (spring-body-caching-wrapper-notes)

**소스** : `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/ContentCachingRequestWrapper.html`, `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/ContentCachingResponseWrapper.html`, `https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html`

**변경 사항** :
- `wiki/spring-boot/filter.md` 업데이트 — 요청/응답 본문 재사용을 위한 `ContentCachingRequestWrapper`, `ContentCachingResponseWrapper` 설명과 필터 예시 추가
- `wiki/spring-boot/interceptor.md` 업데이트 — 본문 캐싱 래퍼 적용은 보통 인터셉터가 아니라 필터에서 시작해야 한다는 제약 추가
- `wiki/spring-boot/filter-vs-interceptor.md` 업데이트 — 요청/응답 본문 캐싱 관점의 선택 기준과 비교 항목 보강

---

## 2026-05-15 (spring-filter-interceptor-pages)

**소스** : `https://docs.spring.io/spring-boot/reference/web/servlet.html`, `https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/web/servlet/FilterRegistrationBean.html`, `https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/OncePerRequestFilter.html`, `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html`, `https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html`, `https://docs.spring.io/spring-framework/docs/6.1.7/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html`, `https://docs.spring.io/spring-framework/docs/5.3.x/javadoc-api/org/springframework/web/servlet/handler/HandlerInterceptorAdapter.html`, `https://docs.spring.io/spring-security/reference/servlet/architecture.html`, `https://www.baeldung.com/spring-mvc-handlerinterceptor-vs-filter`, `https://www.baeldung.com/spring-onceperrequestfilter`

**변경 사항** :
- `wiki/spring-boot/filter.md` 생성 — Servlet Filter와 `OncePerRequestFilter`의 개념, 실행 흐름, 등록 방식, 구현 예시 정리
- `wiki/spring-boot/interceptor.md` 생성 — `HandlerInterceptor`의 개념, 콜백 흐름, 등록 방식, 구현 예시와 비동기 주의점 정리
- `wiki/spring-boot/filter-vs-interceptor.md` 생성 — Filter와 Interceptor의 차이, 보안/응답 수정/계층별 선택 기준 비교
- `wiki/index.md` 업데이트 — Spring Boot 섹션에 새 문서 3건 추가 및 마지막 업데이트 시각 갱신

---

## 2026-05-15 (wiki-metadata-table-normalization)

**변경 사항** :
- `wiki/docker/*.md` 일부 문서와 `wiki/linux/compression-archiving.md` 업데이트 — 최상단 메타데이터(`Title`, `Last updated`, `Tags`)를 비표준 텍스트 형식에서 표 형식으로 통일하고 수정 시각 갱신

---

## 2026-05-15 (wiki-lint-broken-links)

**소스** : `https://git-scm.com/docs/git-restore`, `https://docs.spring.io/spring-boot/api/java/org/springframework/boot/SpringApplication.html`, `https://docs.spring.io/spring-boot/reference/io/validation.html`, `https://man7.org/linux/man-pages/man1/tar.1.html`

**변경 사항** :
- `wiki/index.md` 업데이트 — `[[wiki/linux/curl]]`를 `[[curl]]`로 수정하고 마지막 업데이트 시각 갱신
- `wiki/docker/docker-overview.md` 업데이트 — Docker 개념 링크를 기존 위키 페이지(`[[docker-image]]`, `[[docker-container]]`, `[[dockerfile]]`)로 수정
- `wiki/linux/cp-mv.md` 업데이트 — 없는 `[[tar]]` 관련 페이지 링크를 제거하고 `tar(1)` 공식 문서 URL을 Sources에 추가
- `wiki/git/git-add.md` 업데이트 — 없는 `[[git-restore]]` 링크를 `[[git-switch-restore]]`로 교체하고 `git-restore` 공식 문서 URL을 Sources에 추가
- `wiki/spring-boot/datasource.md` 업데이트 — 없는 `[[spring-boot-application]]` 링크를 제거하고 `SpringApplication` API 문서 URL을 Sources에 추가
- `wiki/spring-boot/configuration-properties.md` 업데이트 — 없는 `[[spring-boot-application]]`, `[[validation-jsr380]]` 링크를 제거하고 Spring Boot Validation/SpringApplication 공식 문서 URL을 Sources에 추가

---

## 2026-05-14 (docker-container-cli-detailing)

- `wiki/docker/docker-container-commands.md` 업데이트 — 컨테이너 CLI 명령어 상세화 (주요 옵션 `inspect -f`, `exec -it`, `exec -u` 등에 대한 상세 설명 및 실무 예시 보강)
- `wiki/index.md` 전체 마지막 업데이트 일시 갱신

---

## 2026-05-14 (docker-container-refactoring)

- `wiki/docker/docker-container.md` 업데이트 — 컨테이너 아키텍처 심층 가이드 (Linux Namespaces 격리, Cgroups 자원 제한, OCI 런타임 표준, containerd/runc의 역할 및 관계) 정리
- `wiki/docker/docker-container-commands.md` 업데이트 — 컨테이너 CLI 상세화 (상세 옵션 해설, 실무 워크플로우 시나리오, 동적 자원 업데이트 `update` 등 추가)
- `wiki/index.md` Docker 섹션 설명 업데이트 및 전체 마지막 업데이트 일시 갱신

---

## 2026-05-14 (docker-volume-commands)

- `wiki/docker/docker-volume-commands.md` 생성 — 도커 볼륨 관리 CLI 가이드 (create, ls, inspect, rm, prune 서브커맨드와 `-v`, `--mount` 옵션 상세 설명 및 백업/복구 실무 팁 추가)
- `wiki/docker/docker-volume.md` 업데이트 — 볼륨 관리 명령어 가이드 링크 추가
- `wiki/index.md`에 Docker 섹션 1개 항목 추가 및 전체 마지막 업데이트 일시 갱신

---

## 2026-05-14 (docker-volume-refactoring)

- `wiki/docker/docker-volume.md` 업데이트 — 문서 구조 리팩토링 (개요 및 작동 원리, 사용 이유, 마운트 타입 계층화, 실무 사용 예시 추가 등)
- `wiki/index.md` 전체 마지막 업데이트 일시 갱신

---

## 2026-05-14 (docker-volume)

- `wiki/docker/docker-volume.md` 생성 — 도커 볼륨 및 데이터 마운트 가이드 (Volumes, Bind Mounts, tmpfs의 원리와 장단점, OS별 성능 차이, 마운트 시 파일 덮어쓰기/복사 동작 상세 설명) 정리
- `wiki/index.md`에 Docker 섹션 1개 항목 추가 및 전체 마지막 업데이트 일시 갱신

---

## 2026-05-14 (docker-network-refactoring)

- `wiki/docker/docker-network-drivers.md` 업데이트 — "기본 Bridge vs 사용자 정의 Bridge" 상세 비교 섹션 추가 및 설명 보강
- `wiki/docker/docker-network-commands.md` 업데이트 — 상세 비교 내용을 제거하고 `docker-network-drivers.md`로 연결되는 링크로 대체하여 역할 분리 (CLI 사용법 중심)

---

## 2026-05-14 (docker-network-commands)

- `wiki/docker/docker-network-commands.md` 생성 — 도커 네트워크 CLI 및 디버깅 가이드 (주요 명령어 `ls`/`create`/`inspect`/`connect`/`disconnect`/`rm`/`prune`, 기본 브릿지 vs 사용자 정의 브릿지 상세 비교 및 권장 이유, 단계별 네트워크 트러블슈팅 체크리스트) 정리
- `wiki/index.md`에 Docker 섹션 1개 항목 추가

---

## 2026-05-14 (jdbc-template)

- `wiki/spring-boot/jdbc-template.md` 생성 — Spring JDBC 가이드: 의존성(Gradle/Maven), JdbcTemplateAutoConfiguration 자동 설정·자동 등록 빈, 핵심 객체(JdbcTemplate/NamedParameterJdbcTemplate/JdbcClient/RowMapper/SqlParameterSource), 파라미터 바인딩(?위치/이름/MapSqlParameterSource/BeanPropertySqlParameterSource), 결과 매핑(query/queryForObject/queryForMap 비교표), 사용 예시(조회/수정/삭제/KeyHolder/batchUpdate), 트랜잭션(@Transactional/TransactionTemplate), spring.jdbc.template.* 설정, DataAccessException 계층, 비교표
- `wiki/index.md` Spring Boot 섹션 항목 추가

---

## 2026-05-14 (externalized-config-prefixes)

- `wiki/spring-boot/externalized-config.md` 업데이트 — 설정 위치 접두사 섹션 추가: classpath:(클래스패스, 와일드카드 미지원), file:(파일시스템, 와일드카드 지원), optional:(부재 허용, 조합 사용), configtree:(디렉터리→프로퍼티 변환, K8s ConfigMap·Secret·Docker Secret 예시), env:(환경변수 값 파싱), 확장자 힌트([.ext])

---

## 2026-05-14 (externalized-config)

- `wiki/spring-boot/externalized-config.md` 생성 — 설정 소스 우선순위 전체(10개 소스 표), 주요 소스별 사용법(커맨드라인/JVM시스템프로퍼티/환경변수/SPRING_APPLICATION_JSON), 설정 로딩 시점(ConfigDataEnvironmentPostProcessor vs @PropertySource 제약), 설정 파일 탐색 위치 순서, 프로파일별 설정 파일 로딩 규칙, 플레이스홀더·기본값·환경변수 relaxed binding, spring.config.location/additional-location/import/optional: 커스터마이징
- `wiki/index.md` Spring Boot 섹션 항목 추가

---

## 2026-05-14 (datasource)

- `wiki/spring-boot/datasource.md` 생성 — DataSource 자동 설정 메커니즘(DataSourceAutoConfiguration 동작 조건), 커넥션 풀 선택 순서(HikariCP→Tomcat→DBCP2→Oracle UCP), spring.datasource.* 기본 프로퍼티(url/username/password/driver-class-name/type/jndi-name), HikariCP 실무 설정(pool size/timeout/keepalive/유효성검사), DBCP2 설정, 커스텀 DataSource 빈, MySQL 운영 환경 설정 예시
- `wiki/index.md` Spring Boot 섹션 항목 추가

---

## 2026-05-14 (configuration-properties-activation-comparison)

- `wiki/spring-boot/configuration-properties.md` 업데이트 — 활성화 방법 비교표 확장: 시작 시 클래스패스 스캔 여부, 조건부 등록 가능 여부 추가

---

## 2026-05-14 (configuration-properties-value-comparison)

- `wiki/spring-boot/configuration-properties.md` 업데이트 — @Value 비교 섹션 확장: 관심사 집중·중복 방지·타입 안전성·테스트 용이성·IDE 자동완성·복합 타입 표현 등 장점 상세화 및 코드 예시 추가

---

## 2026-05-14 (configuration-properties)

- `wiki/spring-boot/configuration-properties.md` 생성 — @ConfigurationProperties 상세 가이드: 활성화 방법 2가지(@EnableConfigurationProperties/@ConfigurationPropertiesScan), JavaBean/생성자 바인딩, @ConstructorBinding Spring Boot 2 vs 3 차이점, Relaxed Binding, Validation, @Value 비교
- `wiki/index.md` Spring Boot 섹션 신설 및 항목 추가

---

## 2026-05-14 (docker-network-drivers)

- `wiki/docker/docker-network-drivers.md` 생성 — 도커 네트워크 드라이버 상세 가이드 (Bridge의 NAT/iptables 기반 작동 방식, Host의 성능 이점, Overlay의 VXLAN 터널링, Macvlan/IPvlan의 L2/L3 가상화 및 비교 등) 정리
- `wiki/docker/docker-network.md` 업데이트 — 상세 드라이버 가이드 링크 추가
- `wiki/index.md`에 Docker 섹션 1개 항목 추가

---

## 2026-05-14 (docker-network)

- `wiki/docker/docker-network.md` 생성 — 도커 네트워크 작동 원리(docker0 브리지, veth pair, 네임스페이스), 드라이버 종류(bridge, host, overlay, macvlan, none), 주요 CLI 명령어 및 실무 팁(이름 해석 등) 정리
- `wiki/index.md`에 Docker 섹션 1개 항목 추가

---

## 2026-05-14 (compression-options)

- `wiki/linux/compression-archiving.md` 업데이트 — `zip`/`unzip` 상세 옵션(r, e, u, x, d, O 등) 추가

---

## 2026-05-14 (compression-consolidation)

- `wiki/linux/compression-archiving.md` 생성 — `linux-compression`, `tar`, `gzip`, `bzip2`, `xz` 내용을 통합하고 `zip`/`unzip` 기본 활용 및 로그 분석용 Z-명령어(`zcat`, `zgrep` 등) 내용 추가
- `wiki/linux/tar.md`, `wiki/linux/gzip.md`, `wiki/linux/bzip2.md`, `wiki/linux/xz.md`, `wiki/linux/linux-compression.md` 삭제
- `wiki/index.md` 목차 통합 및 업데이트

---

## 2026-05-14 (docker-basics)

- `wiki/docker/docker-overview.md` 생성 — 도커 기본 개념, 아키텍처, 핵심 원리(격리성·휴대성 등), VM과의 상세 비교(커널 공유 vs 하드웨어 격리), 활용 예시(CI/CD, Docker Compose, Testcontainers)
- `wiki/docker/dockerfile.md` 생성 — 도커파일 작동 원리(레이어·캐싱), 주요 지시어(`FROM`, `RUN`, `CMD` 등), 멀티 스테이지 빌드 및 Java/Spring Boot 레이어링 최적화 예시
- `wiki/docker/docker-image.md` 생성 — 이미지의 불변성 및 레이어 구조(계층형 파일 시스템), 매니페스트, Copy-on-Write 원리, 경량 베이스 이미지 및 빌드 캐시 최적화 기법, 주요 CLI 명령어(build, ls, pull, push, rm, inspect 등) 추가
- `wiki/docker/docker-container.md` 생성 — 컨테이너의 정의, 라이프사이클 상태(Created/Running/Paused/Stopped), 쓰기 가능 레이어 및 Copy-on-Write 작동 방식, 주요 관리 명령어(run, ps, stop, rm, exec 등)
- `wiki/docker/docker-container-commands.md` 생성 — 도커 컨테이너 명령어 상세 가이드 (pause/unpause 프로세스 제어, inspect 필드 추출, stats 실시간 모니터링, exec vs attach 차이점, docker update를 통한 자원 제한 동적 변경 등)
- `wiki/docker/dockerfile-directives.md` 생성 — 도커파일 지시어 상세 가이드 (Exec vs Shell Form의 PID 1 처리 차이, COPY vs ADD, ARG vs ENV 비교, ENTRYPOINT와 CMD의 조합 활용 등)
- `wiki/index.md`에 Docker 섹션 신규 추가 및 6개 항목 추가

---

## 2026-05-14 (git-remote-sync)

- `wiki/git/git-fetch-pull-push.md` 생성 — fetch(refspec/--prune/--tags/--depth/FETCH_HEAD), pull(--rebase/--ff-only/--squash/diverged 처리/pull.rebase 설정), push(-u/refspec/--force-with-lease/--follow-tags/push.default 비교표)
- `wiki/index.md`에 Git 섹션 1개 항목 추가

---

## 2026-05-14 (format-cleanup)

- 위키 전체 60개 파일 페이지 형식 일괄 변환
  - 메타데이터 테이블: `Title` 행 추가, `마지막 업데이트` → `Last updated`, `태그` → `Tags`
  - 소스 섹션: `**소스** :` → `## Sources` (vim 인라인 변형 포함)
  - 연관 페이지: `## 연관 페이지` → `## Related pages`
- `(사용자 노트)` 줄 삭제 — `linux-compression.md`, `xz.md`, `gzip.md`, `du.md`, `bzip2.md` 5개 파일

---

## 2026-05-14 (git-history)

- `raw/git/git-add.md` 추가 — https://git-scm.com/docs/git-add
- `raw/git/git-commit.md` 추가 — https://git-scm.com/docs/git-commit
- `raw/git/git-stash.md` 추가 — https://git-scm.com/docs/git-stash
- `raw/git/git-merge.md` 추가 — https://git-scm.com/docs/git-merge
- `raw/git/git-tag.md` 추가 — https://git-scm.com/docs/git-tag
- `raw/git/git-rebase.md` 추가 — https://git-scm.com/docs/git-rebase
- `raw/git/git-reset.md` 추가 — https://git-scm.com/docs/git-reset
- `raw/git/git-revert.md` 추가 — https://git-scm.com/docs/git-revert
- `raw/git/git-switch.md` 추가 — https://git-scm.com/docs/git-switch
- `raw/git/git-restore.md` 추가 — https://git-scm.com/docs/git-restore
- `wiki/git/git-add.md` 생성 — -A/-u/. 차이, -p 헝크 선택키 전체, -i interactive, -N/--chmod/--renormalize
- `wiki/git/git-commit.md` 생성 — -m/-a/-v, --amend/--no-edit, --fixup/--squash/--reword(autosquash 연계), Author vs Committer, hooks(pre-commit/commit-msg/post-commit), 주요 config
- `wiki/git/git-stash.md` 생성 — push/pop/apply/list/show/drop/branch/clear, -u/-k/-p/-S/-a, stash@{n} 참조, 내부 구조
- `wiki/git/git-merge.md` 생성 — --ff/--no-ff/--ff-only/--squash 비교, -s/-X 전략, 충돌 마커/diff3, --abort/--continue, checkout --ours/--theirs
- `wiki/git/git-tag.md` 생성 — lightweight vs annotated 비교, -a/-m/-d/-f/-s, --sort=version:refname, 원격 push/delete, git describe
- `wiki/git/git-rebase.md` 생성 — 기본 rebase, --onto, -i interactive 명령어 전체(pick/reword/edit/squash/fixup/drop/exec), --autosquash, --autostash, 커밋 분할 패턴
- `wiki/git/git-reset-revert.md` 생성 — reset --soft/--mixed/--hard 비교표, path reset, ORIG_HEAD, revert -m(머지커밋), --no-commit, reset vs revert 선택 기준
- `wiki/git/git-switch-restore.md` 생성 — switch(-c/-C/--orphan/--guess/--merge), restore(--staged/--worktree/--source 조합), 삭제 파일 복구, git checkout 대응표
- `wiki/index.md`에 Git 섹션 8개 항목 추가

---

## 2026-05-14 (git-branch)

- `raw/git/git-branch.md` 추가 — https://git-scm.com/docs/git-branch
- `wiki/git/git-branch.md` 생성 — 목록 조회(-v/-vv/ahead·behind·gone/-r/-a), 필터링(--merged/--no-merged/--contains/패턴), 정렬(--sort=-committerdate), 생성(--track/자동upstream), 삭제(-d/-D/원격삭제/일괄삭제패턴), 이름 변경(-m/-M/원격반영), upstream 설정(-u/--set-upstream-to/--unset-upstream), 주요 config(autoSetupMerge/autoSetupRebase/branch.sort)
- `wiki/index.md`에 Git 섹션 1개 항목 추가

---

## 2026-05-13 (git-detached-head)

- `wiki/git/git-detached-head.md` 생성 — Detached HEAD 개념(.git/HEAD 비교), 발생 원인 5가지(SHA/태그/원격브랜치 체크아웃·rebase·bisect), 탐색 중 커밋 주의사항, 해결 케이스 4가지(탐색·커밋보존·reflog복구·원격추적), git rev-parse 스크립트 판별, 요약 플로우
- `wiki/index.md`에 Git 섹션 1개 항목 추가

---

## 2026-05-13 (git-history-revisions)

- `raw/git/git-log.md` 추가 — https://git-scm.com/docs/git-log
- `raw/git/gitrevisions.md` 추가 — https://git-scm.com/docs/gitrevisions
- `raw/git/git-rev-parse.md` 추가 — https://git-scm.com/docs/git-rev-parse
- `wiki/git/git-log.md` 생성 — 범위 제한(since/until/author/grep/-S/-G), 머지 처리(--first-parent), 파일 이력(--follow/-L), 출력 형식(--format 플레이스홀더 전체), 그래프, alias 조합
- `wiki/git/git-revisions.md` 생성 — SHA-1·심볼릭 참조, 특수참조(ORIG_HEAD/MERGE_HEAD), ~(선형조상) vs ^(n번째부모) 차이, @{n}/@{date}/@{-1}/@{u}, ..(차집합) vs ...(대칭차집합), git rev-parse 패턴(show-toplevel/abbrev-ref/verify/스크립트)
- `wiki/index.md`에 Git 섹션 2개 항목 추가

---

## 2026-05-13 (git-config)

- `raw/git/git-config.md` 추가 — https://git-scm.com/docs/git-config
- `raw/git/pro-git-customizing-git-configuration.md` 추가 — https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration
- `wiki/git/git-config.md` 생성 — scope 우선순위(system/global/local/worktree), 기본 명령어(get/set/unset/list/edit/show-origin), 자주 쓰는 설정(user/init/pull/push/editor/autocrlf/excludesFile/credential/alias/proxy), includeIf 조건부 설정, GIT_CONFIG_* 환경변수
- `wiki/index.md`에 Git 섹션 1개 항목 추가

---

## 2026-05-13 (git-init-clone)

- `CLAUDE.md` 폴더 구조 섹션 업데이트 — raw/linux, raw/java, raw/git, wiki/linux, wiki/java, wiki/git 서브폴더 반영
- `raw/git/pro-git-getting-a-git-repository.md` 추가 — https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository
- `raw/git/git-init.md` 추가 — https://git-scm.com/docs/git-init
- `raw/git/git-clone.md` 추가 — https://git-scm.com/docs/git-clone
- `wiki/git/git-init.md` 생성 — 기본 사용법, .git 골격, -b/--bare/--shared/--quiet, Non-bare vs Bare 비교, 전역 설정, 실용 패턴
- `wiki/git/git-clone.md` 생성 — clone 동작 하순서, URL 형식(HTTPS/SSH/local), -b/-o, shallow(--depth/--unshallow), partial(--filter), single-branch, 서브모듈, bare/mirror, -c 설정 주입
- `wiki/index.md`에 Git 섹션 2개 항목 추가

---

## 2026-05-13 (git-basics)

- `raw/git/pro-git-what-is-git.md` 추가 — https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F
- `raw/git/pro-git-recording-changes.md` 추가 — https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository
- `wiki/git/git-internals.md` 생성 — 스냅샷 모델 vs 델타, 3개 영역(Working Tree/Staging Area/Git Directory), .git 디렉터리 구조, 4가지 객체 타입(blob/tree/commit/tag), SHA-1
- `wiki/git/git-file-states.md` 생성 — 파일 상태 라이프사이클, git status(-s), git diff(--staged), git add(-p), git commit(-a/--amend), git restore(--staged), git rm(--cached), git mv, .gitignore
- `wiki/index.md`에 Git 섹션 신규 추가 (2개 항목)

---

## 2026-05-13 (dns)

- `raw/linux/resolv.conf(5) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/man5/resolv.conf.5.html
- `raw/linux/nsswitch.conf(5) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/man5/nsswitch.conf.5.html
- `raw/linux/resolvectl(1) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/1/resolvectl.1.html
- `wiki/linux/dns-configuration.md` 생성 — DNS 해석 순서(nsswitch.conf), resolv.conf 디렉티브/options, /etc/hosts, systemd-resolved 통합 및 NetworkManager 관리 대응
- `wiki/linux/dns-tools.md` 생성 — dig(+trace/+short/+tcp), nslookup, host, resolvectl(status/flush-caches), 트러블슈팅 패턴
- `wiki/index.md`에 Linux CLI 섹션 2개 항목 추가

---

## 2026-05-13 (systemd)

- `raw/linux/systemctl(1) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/1/systemctl.1.html
- `raw/linux/systemd.service(5) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/5/systemd.service.5.html
- `raw/linux/systemd.unit(5) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/5/systemd.unit.5.html
- `raw/linux/journalctl(1) - Linux manual page.md` 추가 — https://man7.org/linux/man-pages/1/journalctl.1.html
- `wiki/linux/systemctl.md` 생성 — 상태 조회, 서비스 제어, enable/disable, mask, daemon-reload, edit
- `wiki/linux/systemd-unit-file.md` 생성 — [Unit]/[Service]/[Install] 섹션, Type, Restart, EnvironmentFile, Spring Boot 예시, 등록·제거 절차, drop-in
- `wiki/linux/journalctl.md` 생성 — -u/-f/-p/-g/--since/-b/-o 필터, 실용 패턴
- `wiki/index.md`에 Linux CLI 섹션 3개 항목 추가

---

## 2026-05-13 (jvm-diagnostics)

- `wiki/java/jps.md` 생성 — JVM 프로세스 목록, -l/-m/-v/-q 옵션, PID 추출 패턴
- `wiki/java/jstack.md` 생성 — 스레드 덤프, 스레드 상태, 데드락 감지, 높은 CPU 추적 절차
- `wiki/java/jmap.md` 생성 — 힙 히스토그램, 힙 덤프, OOM 자동 덤프, jcmd 대안, Eclipse MAT
- `wiki/index.md`에 Java 섹션 3개 항목 추가

---

## 2026-05-13 (vim)

- `wiki/linux/vim-01-modes.md` 생성 — 모드 체계, Normal→Insert 진입 키, 저장·종료
- `wiki/linux/vim-02-navigation.md` 생성 — 문자·단어·줄·화면 이동, 마크
- `wiki/linux/vim-03-editing.md` 생성 — 삭제·복사·변경·undo·점 명령·들여쓰기
- `wiki/linux/vim-04-search-replace.md` 생성 — 검색, 치환(:s), :g 전역 명령
- `wiki/linux/vim-05-practical.md` 생성 — Visual 블록, 외부 명령, 레지스터, 매크로, vimdiff, .vimrc
- `wiki/index.md`에 vim 5개 항목 추가

---

## 2026-05-13 (wiki-category)

- `raw/` 루트의 Linux 관련 파일 16개를 `raw/linux/`로 이동
- `raw/java-launcher.md`, `raw/sdkman.md`를 `raw/java/`로 이동 (신규 폴더)
- `wiki/linux/java-version.md`, `wiki/linux/jvm-options.md`를 `wiki/java/`로 이동 (신규 폴더)
- `wiki/index.md`에 Java 섹션 추가 및 Linux CLI 섹션에서 Java 항목 분리

---

## 2026-05-13 (22)

**소스** :
- `raw/readline.md` → `https://www.gnu.org/software/readline/manual/readline.html`
- `raw/bash-readline-vi.md` → `https://www.gnu.org/software/bash/manual/html_node/Readline-vi-Mode.html`

**변경 사항** :
- `wiki/linux/readline-shortcuts.md` 생성 — 모드 전환(set -o vi/emacs, bindkey, ~/.inputrc), Emacs 모드(커서 이동/편집·Kill Ring/대소문자 변환/히스토리·C-r 검색/완성/화면 제어/C-x C-e), Vi 모드(Insert↔Command 전환/Command 모드 이동·f/F/t/T·;/,/편집·d·c·y·p·~/u·./히스토리·k·j/검색·//n/에디터·v), 모드 비교 표, 패턴
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (21)

**소스** :
- `raw/useradd.md` → `https://man7.org/linux/man-pages/man8/useradd.8.html`
- `raw/usermod.md` → `https://man7.org/linux/man-pages/man8/usermod.8.html`
- `raw/userdel.md` → `https://man7.org/linux/man-pages/man8/userdel.8.html`
- `raw/groupadd.md` → `https://man7.org/linux/man-pages/man8/groupadd.8.html`
- `raw/passwd.md` → `https://man7.org/linux/man-pages/man1/passwd.1.html`
- `raw/id.md` → `https://man7.org/linux/man-pages/man1/id.1.html`

**변경 사항** :
- `wiki/linux/user-group-management.md` 생성 — 중요 파일 구조(/etc/passwd 7필드·/etc/shadow 9필드·해시 알고리즘·/etc/group), 사용자 조회(id/-u/-g/-G/-n/whoami/groups/who/w/last), useradd(옵션·서비스 계정 생성), usermod(-aG 주의사항·계정 잠금), userdel(-r/-f), 그룹 관리(groupadd/groupmod/groupdel/gpasswd/newgrp), passwd(-l/-u/-e/--stdin/chpasswd), chage(만료 정책), 백엔드 패턴(서비스 계정/일괄 잠금/사용자 현황)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (20)

**소스** :
- `raw/date.md` → `https://man7.org/linux/man-pages/man1/date.1.html`
- `raw/timedatectl.md` → `https://man7.org/linux/man-pages/man1/timedatectl.1.html`
- `raw/hwclock.md` → `https://man7.org/linux/man-pages/man8/hwclock.8.html`

**변경 사항** :
- `wiki/linux/time.md` 생성 — 시스템·하드웨어 시계 개념, date(형식 지정자 전체/패딩 플래그/-d 상대 날짜·epoch 변환/TZ 오버라이드/패턴), timedatectl(서브커맨드/status 출력 해석/타임존 설정/NTP), 타임존 관리(/etc/localtime//etc/timezone/TZ/Java -Duser.timezone), hwclock(--show/--hctosys/--systohc)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (19)

**소스** :
- `raw/env.md` → `https://man7.org/linux/man-pages/man1/env.1.html`
- `raw/printenv.md` → `https://man7.org/linux/man-pages/man1/printenv.1.html`
- `raw/envsubst.md` → `https://www.gnu.org/software/gettext/manual/html_node/envsubst-Invocation.html`
- `raw/bash-environment.md` → `https://www.gnu.org/software/bash/manual/html_node/Environment.html`

**변경 사항** :
- `wiki/linux/environment-variables.md` 생성 — 환경변수 개념(셸 변수 vs export), 조회(env/printenv/set/declare), 설정·해제(export/unset/VAR=value CMD), 범위·영속성(~/.bashrc/~/.profile//etc/environment), 변수 확장, envsubst(템플릿 치환·변수 범위 제한), 주요 환경변수 목록, 백엔드 패턴(.env 로드/필수 변수 검증/envsubst+k8s)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (18)

**소스** :
- `raw/sdkman.md` → `https://sdkman.io/usage`

**변경 사항** :
- `wiki/linux/java.md` 삭제 — jvm-options.md / java-version.md 로 분리
- `wiki/linux/jvm-options.md` 생성 — java 실행 형식, 표준 옵션(-cp/-D/-jar/--add-opens), 메모리(-Xms/-Xmx/-Xss), GC 선택(G1/ZGC/Shenandoah/Parallel) 및 튜닝, GC 로깅(-Xlog), 진단(HeapDump/PrintFlagsFinal/NMT), JIT, 환경변수(JDK_JAVA_OPTIONS), 백엔드 패턴
- `wiki/linux/java-version.md` 생성 — 버전 확인(java -version/which/readlink -f), 설치 경로 탐색(/usr/lib/jvm), update-alternatives(등록/전환/slave), JAVA_HOME 설정(영구/동적), SDKMAN(배포판·버전 선택, .sdkmanrc 프로젝트 고정)
- `wiki/index.md` 업데이트 — java 단일 항목 → jvm-options / java-version 두 항목으로 교체

---

## 2026-05-13 (17)

**소스** :
- `raw/java-launcher.md` → `https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html`
- `raw/update-alternatives.md` → `https://man7.org/linux/man-pages/man1/update-alternatives.1.html`

**변경 사항** :
- `wiki/linux/java.md` 생성 — java 명령어(표준 옵션, 메모리 -Xms/-Xmx/-Xss, GC 선택 G1/ZGC/Shenandoah/Parallel, GC 로깅 -Xlog, 진단 HeapDump/PrintFlagsFinal/NMT, JIT), 버전 관리(update-alternatives 등록·전환·slave, JAVA_HOME 설정, SDKMAN)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (16)

**변경 사항** :
- `raw/` 루트 파일 19개 → `raw/linux/` 이동 (awk, bash-directory-stack, bash-redirections, cat, cp, enca, file, find, grep, iconv, less, lsof, more, mv, nohup, ps, sed, stdin, tee)
- `wiki/linux/*.md` 소스 경로 일괄 업데이트 — `raw/X.md` → `raw/linux/X.md` (10개 파일)
- `wiki/linux/curl.md` 소스 경로 수정 — `raw/curl - How To Use.md` → `raw/linux/curl.md`

---

## 2026-05-13 (15)

**소스** :
- `raw/ps.md` → `https://man7.org/linux/man-pages/man1/ps.1.html`
- `raw/nohup.md` → `https://man7.org/linux/man-pages/man1/nohup.1.html`

**변경 사항** :
- `wiki/linux/ps-nohup.md` 생성 — ps(옵션 스타일, 프로세스 선택/출력 형식, 주요 컬럼, 상태 코드 R/S/D/Z/T, -o 커스텀 포맷, 백엔드 패턴), nohup(SIGHUP 무시, 스트림 동작, disown 비교, 종료 코드, 백그라운드 패턴)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (14)

**소스** :
- `raw/cat.md` → `https://man7.org/linux/man-pages/man1/cat.1.html`
- `raw/tee.md` → `https://man7.org/linux/man-pages/man1/tee.1.html`
- `raw/more.md` → `https://man7.org/linux/man-pages/man1/more.1.html`
- `raw/less.md` → `https://man7.org/linux/man-pages/man1/less.1.html`
- `raw/grep.md` → `https://man7.org/linux/man-pages/man1/grep.1.html`
- `raw/sed.md` → `https://man7.org/linux/man-pages/man1/sed.1.html`
- `raw/awk.md` → `https://man7.org/linux/man-pages/man1/gawk.1.html`

**변경 사항** :
- `wiki/linux/cat-tee-more-less.md` 생성 — cat(-n/-b/-s/-A/-E/-T, 파일 연결, Here Doc, CRLF 감지), tee(-a/-i, sudo tee 패턴, 프로세스 치환), more(레거시 페이저 키), less(-N/-S/-i/-F/+F/-R, 이동·검색·파일 전환 키)
- `wiki/linux/grep-sed-awk.md` 생성 — grep(BRE/ERE/PCRE, 매칭/출력/파일 옵션, -A/-B/-C, 백엔드 패턴), sed(주소 지정, s/d/p/a/i/c/y/q 명령, in-place 수정, 백엔드 패턴), awk(BEGIN/END, $0/$1/NR/NF/FNR, 내장 함수, 집계·중복제거·파일조인 패턴)
- `wiki/index.md` 업데이트 — 신규 페이지 2개 목차 추가

---

## 2026-05-13 (13)

**소스** :
- `raw/bash-redirections.md` → `https://www.gnu.org/software/bash/manual/html_node/Redirections.html`
- `raw/stdin.md` → `https://man7.org/linux/man-pages/man3/stdin.3.html`

**변경 사항** :
- `wiki/linux/standard-streams.md` 생성 — stdin/stdout/stderr 개념(FD/버퍼링), 리다이렉션(>/>>/</2>/&>/순서), /dev/null, 파이프(|/|&/pipefail/PIPESTATUS), Here Document/String, FD 복제·닫기, 특수 파일, tee, 프로세스 치환, 백엔드 시나리오 10가지
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (12)

**소스** :
- `raw/cp.md` → `https://man7.org/linux/man-pages/man1/cp.1.html`
- `raw/mv.md` → `https://man7.org/linux/man-pages/man1/mv.1.html`
- `raw/linux/ls(1) - Linux manual page.md` → `https://man7.org/linux/man-pages/man1/ls.1.html`
- `raw/find.md` → `https://man7.org/linux/man-pages/man1/find.1.html`
- `raw/file.md` → `https://man7.org/linux/man-pages/man1/file.1.html`
- `raw/iconv.md` → `https://man7.org/linux/man-pages/man1/iconv.1.html`
- `raw/enca.md` → `https://manpages.debian.org/testing/enca/enca.1.en.html`
- `raw/bash-directory-stack.md` → `https://www.gnu.org/software/bash/manual/bash.html#The-Directory-Stack`

**변경 사항** :
- `wiki/linux/cp-mv.md` 생성 — cp(-r/-a/-p/-u/-n/--backup), mv(-i/-n/-f/-t/--backup), 파일시스템 간 이동 동작
- `wiki/linux/ls.md` 생성 — 출력 형식(-l/-1/-C), 정렬(-t/-S/-r), 숨김 파일(-a/-A), 크기(-h), -l 출력 컬럼 해석
- `wiki/linux/find.md` 생성 — 탐색 범위/유형/이름/크기/시간/권한 조건, 액션(-exec/-delete/-print0), 논리 연산자, 백엔드 시나리오 12가지
- `wiki/linux/file-encoding.md` 생성 — file(-i/--mime-encoding), iconv(-f/-t/-c///IGNORE///TRANSLIT), enca(-L/-x), 인코딩 진단 플로우
- `wiki/linux/directory-navigation.md` 생성 — cd(-, ~, CDPATH), pushd/popd/dirs 스택 인덱스, 실용 패턴
- `wiki/index.md` 업데이트 — 신규 페이지 5개 목차 추가

---

## 2026-05-13 (11)

**소스** : `raw/lsof.md` → `https://man7.org/linux/man-pages/man8/lsof.8.html`

**변경 사항** :
- `raw/lsof.md` 생성 — 링크 전용 소스 파일
- `wiki/linux/lsof.md` 생성 — 출력 컬럼(FD/TYPE 필드), 주요 옵션, -i 네트워크 필터, 백엔드 진단 시나리오(포트 점유/CLOSE_WAIT/삭제 파일 누수/커넥션 풀)
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (10)

**소스** : `curl - How To Use.md`

**변경 사항** :
- `wiki/linux/curl.md` 생성 — HTTP 메서드(GET/POST/PUT/DELETE/PATCH), 헤더, 인증(Basic/Bearer/OAuth2), 응답 처리(-i/-s/-v/-w), 에러 처리(-f/--fail-with-body), SSL/TLS(-k/--cacert/mTLS), 타임아웃/재시도, 리다이렉트, 백엔드 진단 시나리오
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (9)

**변경 사항** :
- `wiki/linux/` 폴더 생성 — 기존 위키 페이지 13개 이동 (bzip2, df, du, gzip, inode, linux-compression, linux-file-permissions, linux-system-info, network-diagnostics, ssh, system-monitoring, tar, xz)
- `raw/linux/` 폴더 생성 — 기존 소스 파일 전체 이동
- 각 위키 페이지 소스 경로 `raw/` → `raw/linux/` 일괄 업데이트

---

## 2026-05-13 (8)

**소스** : `ss(8) - Linux manual page.md`, `ping(8) - Linux manual page.md`, `ncat(1) - Linux manual page.md`

**변경 사항** :
- `wiki/network-diagnostics.md` 생성 — ss 소켓 상태 조회(옵션/출력 컬럼/패턴), ping 연결 확인(옵션/출력 해석/종료 코드), nc 포트 테스트(-zv 조합, 파일 전송, 간이 서버); 백엔드 진단 시나리오 포함
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (7)

**소스** : `ssh(1) - Linux manual page.md`, `scp(1) - Linux manual page.md`

**변경 사항** :
- `wiki/ssh.md` 생성 — 공개키 인증 설정, ~/.ssh/config, 포트 포워딩(로컬/리모트), 점프 호스트, scp 파일 복사, 주요 파일 권한
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (6)

**소스** : `uname(1) - Linux manual page.md`, `hostnamectl(1) - Linux manual page.md`, `os-release(5) - Linux manual page.md`, `lscpu(1) - Linux manual page.md`, `lspci(8) - Linux manual page.md`

**변경 사항** :
- `wiki/linux-system-info.md` 생성 — OS/커널 확인(uname, /etc/os-release, hostnamectl), CPU 정보(lscpu), PCI 장치(lspci); 백엔드 개발자 관점 활용 포인트 포함
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (5)

**소스** : `top(1) - Linux manual page.md`, `htop(1) - Linux manual page.md`

**변경 사항** :
- `wiki/system-monitoring.md` 생성 — top 상단 요약(uptime/Tasks/CPU/메모리), 하단 컬럼, 옵션, 조작키; htop 옵션, 조작키; top vs htop 비교표
- `wiki/index.md` 업데이트 — 신규 페이지 목차 추가

---

## 2026-05-13 (4)

**소스** : `파일 권한 관리 320fb1aab3088034b5bee905e349e6e1.md`, `chmod invocation (GNU Coreutils 9.11).md`, `chmod(1) - Linux manual page.md`, `chown(1) - Linux manual page.md`, `chgrp(1) - Linux manual page.md`

**변경 사항** :
- `wiki/linux-file-permissions.md` 생성 — 권한 모델, chmod(기호/8진수 모드, 특수 비트, 심볼릭 링크), chown/chgrp(동작 규칙, 옵션, 심볼릭 링크) 통합 정리
- `wiki/chmod.md` 삭제 — linux-file-permissions.md에 통합
- `wiki/chown.md` 삭제 — linux-file-permissions.md에 통합
- `wiki/index.md` 업데이트 — 단일 항목으로 통합

---

## 2026-05-13 (3)

**소스** : `아카이빙 및 압축.md`, `GNU tar 1.35.md`, `tar(1) - Linux manual page.md`, `GNU Gzip.md`, `bzip2 and libbzip2, version 1.0.8.md`, `XZ(1).md`

**변경 사항** :
- `wiki/linux-compression.md` 생성 — 아카이빙/압축 개념 개요, 도구 비교표, 확장자 조합, 선택 기준
- `wiki/tar.md` 생성 — 동작 옵션, 공통 옵션, 압축 연계 옵션, 자주 쓰는 패턴
- `wiki/gzip.md` 생성 — 옵션, 파생 도구(zcat/zless/zgrep), tar 연계
- `wiki/bzip2.md` 생성 — 옵션, 블록 크기/메모리 표, bzip2recover, tar 연계
- `wiki/xz.md` 생성 — 옵션, 명령 별칭, 멀티스레드, tar 연계
- `wiki/index.md` 업데이트 — 신규 페이지 5개 목차 추가

---

## 2026-05-13 (2)

**변경 사항** :
- `wiki/df-du.md` 삭제 — `wiki/df.md`, `wiki/du.md`로 분리
- `wiki/inode.md` 업데이트 — `[[df-du]]` 링크를 `[[df]]`, `[[du]]`로 교체
- `wiki/index.md` 업데이트 — 목차 항목 분리 반영

---

## 2026-05-13

**소스** : `df invocation (GNU Coreutils 9.11).md`, `df(1) - Linux manual page.md`, `du invocation (GNU Coreutils 9.11).md`, `du(1) - Linux manual page.md`, `inode(7) - Linux manual page.md`, `sort invocation (GNU Coreutils 9.11).md`

**변경 사항** :
- `wiki/df-du.md` 생성 — df/du 옵션 정리, 출력 컬럼 설명, sort -h 연계 사용법, df vs du 불일치 케이스
- `wiki/inode.md` 생성 — inode 구조, 저장 필드, 파일 타입 상수, 타임스탬프 종류, inode 고갈 문제
- `wiki/index.md` 생성 — 위키 전체 목차 초기화
- 2026-05-15 13:45:12 | Create Controller Annotations guide (wiki/spring-boot/controller-annotations.md) with attribute details and internal flow
- 2026-05-15 14:10:22 | Create ControllerAdvice guide (wiki/spring-boot/controller-advice.md) including 404/405 handling and whitelabel avoidance
- 2026-05-15 14:30:11 | Create Data Binding Principles guide (wiki/spring-boot/data-binding-principles.md) covering @RequestBody and @ModelAttribute details
- 2026-05-15 15:10:00 | Move Data Binding guide to wiki/java/spring-boot/web/ and restructure index.md with Web sub-heading
- 2026-05-15 17:28:53 | Create Dynamic Template Risks guide (wiki/java/spring-boot/web/dynamic-template-risks.md) covering SSTI, RCE, and performance issues
- 2026-05-15 17:48:56 | Create Error Handling Strategy guide (wiki/java/spring-boot/web/error-handling-strategy.md) covering Whitelabel disabling, @ControllerAdvice, and ErrorController
- [2026-05-19 15:51:23] raw/linux/openssl/* 소스 기반 wiki/linux/security/openssl-x509.md에 '인증서 체인 및 신뢰성 검증(openssl verify)' 섹션 추가
- [2026-05-19 15:52:51] raw/linux/openssl/openssl-crl 소스 기반 wiki/linux/security/openssl-crl.md 생성 및 인덱스 업데이트

---

