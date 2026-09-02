# log

---

## 2026-06-30 17:58:41

- **생성**: `wiki/java/test/spock.md` — Spock 테스트·명세 프레임워크
  - 특징(Groovy 기반·JUnit Platform 실행·Power Assert·모킹 내장), 장단점
  - 구조(extends Specification·픽스처·@Shared), 블록(given/when/then/expect/where/and/cleanup), 예외(thrown/notThrown)
  - 데이터 주도(데이터 테이블 a|b||c·데이터 파이프 <<·@Unroll #변수)
  - 모킹(Mock/Stub/Spy·카디널리티 1*·스터빙 >>/>>>)
  - 의존성(Gradle groovy 플러그인+spock-bom/spock-core/spock-spring+junit-platform-launcher·useJUnitPlatform, Maven gmavenplus+Surefire *Spec, {spock}-groovy-{groovy} 버전 규칙)
  - 출처: Spock Reference 2.3, spock-example build.gradle, mvnrepository, Baeldung
- **수정**: `wiki/index.md` Java>테스트에 `[[spock]]` 추가
- **수정**: `java-testing-libraries` related에 `[[spock]]` 역링크 추가 (요청대로 junit-parameterized-test 링크는 제외)

---

## 2026-06-30 17:49:35

- **수정**: `wiki/java/test/` related 링크 정리(연관성 낮은 링크 삭제)
  - `java-testing-libraries`: `spring-batch-testing`·`docker-overview` 제거
  - `junit-parameterized-test`: `junit-test-suite`·`jacoco`·`spring-batch-testing` 제거 (java-testing-libraries·java17-features만 유지)
  - `jacoco`: `junit-parameterized-test`(범용 커버리지·특별 연관 없음)·`spring-batch-testing`(도메인 외) 제거 (java-testing-libraries·jvm-options 유지)

---

## 2026-06-30 17:43:55

- **생성**: `wiki/java/test/junit-test-suite.md` — JUnit 테스트 스위트·태그 필터링
  - 스위트 개념(빌드 도구 디스커버리·태그 필터로 대체되는 추세), JUnit4(@RunWith(Suite.class)+@SuiteClasses)
  - JUnit5 Platform Suite: 의존성(junit-platform-suite), @Suite + @Select*(탐색)/@Include*·@Exclude*(필터), @SuiteDisplayName/@ConfigurationParameter/@BeforeSuite·@AfterSuite
  - @Tag 이름 규칙(예약문자 ,()&|! 불가)·태그 표현식(!·&·|·())
  - Gradle: useJUnitPlatform { includeTags/excludeTags }(태그) vs --tests/filter(이름), 디스커버리
  - Maven Surefire: 디스커버리 이름 패턴, <groups>/<excludedGroups>(태그 표현식)
  - 출처: JUnit User Guide·suite.api/Tag API(5.13.0), Gradle java_testing, Maven Surefire junit-platform, howtodoinjava
- **수정**: `wiki/index.md` Java>테스트에 `[[junit-test-suite]]` 추가
- **수정**: `junit-parameterized-test`/`java-testing-libraries` related에 역링크 추가

---

## 2026-06-30 10:40:00

- **생성**: `wiki/java/test/java-testing-libraries.md` — Java 테스트 라이브러리 목적별 개요
  - 프레임워크(JUnit5/4·TestNG·Spock), 단언(AssertJ·Hamcrest·Truth), 모킹(Mockito·EasyMock·JMockit·PowerMock·@MockitoBean)
  - 통합/외부 의존성(Testcontainers·WireMock·MockWebServer·H2/임베디드DB·Embedded Kafka), REST(REST Assured·MockMvc·JSONAssert)
  - Spring(spring-boot-starter-test 번들·슬라이스), 특수(jqwik·Cucumber·Spring Cloud Contract/Pact·ArchUnit·PIT·JMH·Datafaker)
  - 전형적 조합 정리, spring-boot-starter-test 포함 라이브러리 명시
  - 출처: Testcontainers/Mockito/AssertJ 공식, Baeldung(WireMock·Mockito 비교)
- **수정**: `wiki/index.md` Java>테스트에 `[[java-testing-libraries]]` 추가
- **수정**: `junit-parameterized-test`/`jacoco` related에 역링크 추가

---

## 2026-06-30 10:32:28

- **생성**: `wiki/java/test/jacoco.md` — JaCoCo 테스트 커버리지 측정
  - 목적(미검증 코드 식별·품질 게이트·리포트)
  - 원리: Java agent 바이트코드 계측(프로브 주입), .exec 실행 데이터, on-the-fly vs offline
  - 카운터표: Instructions(C0)/Branches(C1)/Lines(디버그 정보 필요)/Methods/Classes/Cyclomatic Complexity
  - Maven: jacoco-maven-plugin prepare-agent/report/check 골 + 룰 예시, forkCount=0 주의
  - Gradle: jacoco 플러그인 jacocoTestReport/jacocoTestCoverageVerification + check 연결, toolVersion
  - 사용: 실행·리포트 위치(target/site/jacoco, build/reports/jacoco/test), 검증, exclusions
  - 출처: JaCoCo 공식 문서(overview/counters/maven), Gradle JaCoCo Plugin
- **수정**: `wiki/index.md` Java>테스트에 `[[jacoco]]` 추가
- **수정**: `junit-parameterized-test` related에 역링크 추가

---

## 2026-06-29 17:17:50

- **생성**: `wiki/java/test/junit-parameterized-test.md` — JUnit 5 ParameterizedTest 상세
  - 용도(@Test/@RepeatedTest 비교), 의존성 junit-jupiter-params
  - 인자 소스: @ValueSource, @NullSource/@EmptySource/@NullAndEmptySource, @EnumSource(names/mode), @MethodSource, @FieldSource(5.11+), @CsvSource(textBlock/헤더), @CsvFileSource, @ArgumentsSource(ArgumentsProvider) — 각 예시
  - 변환(@ConvertWith/SimpleArgumentConverter, @JavaTimeConversionPattern), 집계(ArgumentsAccessor, @AggregateWith)
  - 표시 이름(name 플레이스홀더 {index}/{0}, named/argumentSet), 다중 소스 조합, 파라미터 선언 순서
  - 출처: JUnit User Guide 6.0.3, Jupiter params API
- **수정**: `wiki/index.md` Java에 `### 테스트` 소항목 신설 + `[[junit-parameterized-test]]` 추가
- **수정**: `spring-batch-testing` related에 역링크 추가

---

## 2026-06-29 17:02:11

- **생성**: `wiki/java/crypto/ml-dsa.md` — ML-DSA(FIPS 204) 후양자 디지털 서명 + BouncyCastle 구현·인증서 발급
  - 개념 간략: 서명(Sign/Verify), MLWE+MSIS 격자 난제, Fiat-Shamir with Aborts, EUF-CMA, Dilithium 표준화
  - 파라미터 세트표(44/65/87: 보안 Category 2/3/5·공개키/개인키/서명 크기), _with_sha512 사전 해시 변형
  - 장단점: 양자내성·빠른 검증·표준 vs 큰 키/서명·하이브리드 권장·서명 전용(키교환은 ml-kem)
  - BouncyCastle: bcprov+bcpkix, "BC" provider, KeyPairGenerator("ML-DSA")+MLDSAParameterSpec, Signature("ML-DSA") 서명/검증, X.509 자체서명 인증서 발급(JcaContentSignerBuilder("ML-DSA").setProvider("BC")+JcaX509v3CertificateBuilder), CA 발급·CSR 안내
  - 버전 주의: 1.81+ 권장, BCPQC 아닌 BC provider(#1991), OpenSSL 상호운용(#2060)
  - 출처: NIST FIPS 204, BC API/PQC Almanac/CertTest, bc-java issue #1991/#2060
- **수정**: `wiki/index.md` Java>crypto에 `[[ml-dsa]]` 추가
- **수정**: `ml-kem`/`openssl-x509` related에 `[[ml-dsa]]` 역링크 추가

---

## 2026-06-29 14:08:48

- **생성**: `wiki/java/crypto/ml-kem.md` — ML-KEM(FIPS 203) 후양자 KEM + BouncyCastle 구현
  - 개념 간략: KEM(Encaps/Decaps), MLWE 격자 난제, IND-CCA2, Kyber 표준화
  - 파라미터 세트표(512/768/1024: 보안 카테고리·module rank k·키/암호문 크기, 공유비밀 32B 고정)
  - 장단점: 양자내성·빠름·표준 vs 큰 키·KEM 한정(KDF+대칭 필요)·하이브리드 권장·서명은 ML-DSA
  - BouncyCastle JCA 구현: bcprov-jdk18on, "BC" provider, KeyPairGenerator("ML-KEM")+MLKEMParameterSpec, KEMGenerateSpec/KEMExtractSpec, SecretKeyWithEncapsulation, AES-GCM 연계, Java21 javax.crypto.KEM 대안
  - 출처: NIST FIPS 203·SP 800-227, BouncyCastle API/PQC Almanac
- **수정**: `ml-kem.md` §4.4 추가 — 버전·인코딩 호환성 주의(1.81+ 권장, 개인키 ASN.1 인코딩 IETF 미준수 이력, libOQS/OpenSSL 상호운용 검증). 출처에 bc-java issue #1890/#1969/#2037 추가
- **수정**: `wiki/index.md` Java 섹션에 `### crypto` 소항목 신설 + `[[ml-kem]]` 추가
- **수정**: `openssl-keygen`/`openssl-overview` Related에 `[[ml-kem]]` 역링크 추가

---

## 2026-06-29 13:56:59

- **추가(raw)**: `raw/java/spring/Testing a Spring Batch Job.md` — Baeldung 배치 테스트 글(사용자 추가)
- **생성**: `wiki/java/spring/spring-batch-testing.md` — Spring Batch 테스트 가이드
  - 의존성(spring-batch-test), `@SpringBatchTest` 주입(JobLauncherTestUtils/JobRepositoryTestUtils/Step·JobScopeTestExecutionListener)
  - E2E 잡(`launchJob`/`launchJob(params)`)·개별 스텝(`launchStep`) 테스트, `AssertFile.assertFileEquals`, StepExecution 통계 검증
  - `@StepScope` 컴포넌트: `MetaDataInstanceFactory.createStepExecution`+`StepScopeTestUtils.doInStepScope`(open/read/close), `StepScopeTestExecutionListener`/getStepExecution
  - 도메인 목킹 `MetaDataInstanceFactory`, 메타데이터 정리 `removeJobExecutions()`·`@DirtiesContext`
  - 버전 차이: 6.0 `JobOperatorTestUtils`/`startJob`·`startStep`
  - 출처: raw Baeldung 글 + 공식 레퍼런스 Unit Testing
- **수정**: `wiki/index.md`에 `[[spring-batch-testing]]` 추가
- **수정**: `spring-batch`/`spring-batch-scope`/`spring-batch-flow` related에 역링크 추가

---

## 2026-06-29 13:08:07

- **추가(raw)**: `raw/java/spring/Conditional Flow in Spring Batch.md` — Baeldung 조건별 플로우 글(사용자 추가)
- **생성**: `wiki/java/spring/spring-batch-flow.md` — Spring Batch 조건별 플로우 가이드
  - BatchStatus vs ExitStatus(기본 동일, 조건 전이는 ExitStatus 기준)
  - 순차 `next()`, 조건 전이 `on()/from()/to()`, 와일드카드 `*`/`?`, 구체성 우선 정렬
  - ExitStatus 커스터마이즈: `StepExecutionListener.afterStep`(통계 기반), `StepExecution.setExitStatus`(데이터 기반, @BeforeStep/afterProcess)
  - 종료 전이 `end()`/`fail()`/`stopAndRestart()` 비교, `JobExecutionDecider`(`decide`→`FlowExecutionStatus`)
  - 스텝 유일성 주의(proxyBeanMethods)
  - 출처: raw Baeldung 글 + 공식 레퍼런스 Controlling Step Flow
- **수정**: `spring-batch-flow.md` §5.3 추가 — StepExecutionListener(beforeStep/afterStep·@BeforeStep/@AfterStep), ItemListenerSupport(ItemRead/Process/WriteListener no-op 구현, 5.0 deprecated·write 인자 List→Chunk). 출처에 Intercepting Step Execution·ItemListenerSupport API 추가
- **수정**: `wiki/index.md`에 `[[spring-batch-flow]]` 추가
- **수정**: `spring-batch`/`spring-batch-fault-tolerance`/`spring-batch-chunk` related에 역링크 추가

---

## 2026-06-29 11:35:17

- **생성**: `wiki/java/spring/spring-batch-fault-tolerance.md` — Spring Batch 재시작·스킵·재시도 내결함성 가이드
  - 잡 재시작: `preventRestart()`/restartable, `JobRestartException`, 완료 잡 재실행 `JobInstanceAlreadyCompleteException`
  - 스텝 재시작: `allowStartIfComplete(true)`(완료 스텝 강제 실행), `startLimit(n)`/`StartLimitExceededException`, ExecutionContext 재개
  - 내결함성 `faultTolerant()`: skip(`skip`/`skipLimit`/`noSkip`/`LimitCheckingExceptionHierarchySkipPolicy`, read/process/write 합산 limit), retry(6.0 `RetryPolicy.builder().maxRetries().includes()` vs ~5.x `retry`/`retryLimit`)
  - 롤백 상호작용 `noRollback`(write 단계 무시), `SkipListener`(onSkipInRead/Process/Write)·`RetryListener`, retry→skip 조합
  - 출처: Spring Batch Reference 6.x(skip/retry/restart/job configuring/intercepting), SkipListener·FaultTolerantStepBuilder API
- **수정**: `wiki/index.md` Spring 섹션에 `[[spring-batch-fault-tolerance]]` 추가
- **수정**: `spring-batch`/`spring-batch-chunk`/`spring-batch-job-parameters`/`spring-batch-tasklet` related에 역링크 추가

---

## 2026-06-23 17:01:44

- **수정**: `wiki/java/common/cpu-usage-troubleshooting.md` — 4.4절 'vmstat 시스템 차원 CPU 부하 성격 파악' 추가
  - vmstat 구문(delay/count), 첫 줄=부팅 후 평균 vs 둘째 줄부터 구간 통계
  - 진단 핵심 컬럼: procs r/b, system in/cs, cpu us/sy/id/wa/st
  - 사례 적용: PBKDF 연산 부하는 us 높고 sy/wa 낮음 → 사용자 코드 핫스폿으로 방향 좁혀 4.1(top -H→jstack)로 진입
  - 출처에 vmstat(8) man page 추가 (웹 검증)
- **수정**: `wiki/index.md` — `[[cpu-usage-troubleshooting]]` 설명에 vmstat 진단 추가

---

## 2026-06-23 16:58:09

- **생성**: `wiki/linux/system/memory-troubleshooting.md` — 메모리 부족 진단·해결 가이드
  - 메모리 순 프로세스 정렬: top `M`/`top -o %MEM`(상세는 system-monitoring 참조), `ps aux --sort=-%mem`, RES/%MEM vs VIRT
  - `free -h` 컬럼 설명, available vs free 캐시 착시(부족 판단은 available 기준), smem PSS vs RSS
  - 원인별 해결: 과점유 프로세스, swap 추가, OOM Killer 로그 확인(dmesg/journalctl), slabtop, cgroup `MemoryMax=`, oom_score_adj
  - 출처: free(1)/ps(1)/top(1)/proc(5) man page (free·ps 컬럼 의미 웹 검증)
- **수정**: `wiki/linux/system/system-monitoring.md` — Related pages에 `[[memory-troubleshooting]]` 추가
- **수정**: `wiki/index.md` — 리눅스 시스템 섹션에 `[[memory-troubleshooting]]` 항목 추가

---

## 2026-06-23 16:30:39

- **수정**: `wiki/ai/ai-agent-skill.md` — Claude Code 스킬 구조를 최신 형식으로 갱신
  - 파일 위치를 `.claude/commands/<name>.md`에서 `.claude/skills/<name>/SKILL.md`(디렉터리명=스킬명)로 변경, 보조 파일 번들 구조 추가
  - 레거시 `commands/` 형식 호환 섹션 분리 명시
  - frontmatter 필드 정리(`name`/`description`/`version`/`license`), `description` 기반 자동 호출(model-invoked) 동작 설명 추가
  - 비교 표 로드 시점 갱신, 대표 예시(코드 리뷰/ingest/릴리즈 노트)에 frontmatter 반영
  - Sources에 Skills·.claude directory 공식 문서 추가
- **수정**: `wiki/index.md` — `[[ai-agent-skill]]` 설명을 `SKILL.md` 구조·frontmatter 기준으로 갱신

---

## 2026-06-22 16:24:21

- **생성**: `wiki/programming/cqrs.md` — CQRS 패턴 전체 가이드
  - Origin: Greg Young ~2010, CQS(Bertrand Meyer 1988)에서 파생
  - Command/Query 모델 분리 개념, 코드 예시
  - 3단계 구현 수준: 동일 DB → 분리 DB(이벤트 동기화) → Event Sourcing 결합
  - CQRS vs Event Sourcing 독립성 비교 테이블
  - 동기/비동기 Command 처리 비교, 최종 일관성 처리 전략
  - Java 구현: 수동 CommandBus/QueryBus, Axon Framework(@CommandHandler/@QueryHandler/@EventHandler), Spring 최소 적용
  - 장단점, 적용 판단 기준(Fowler "be very cautious")
- **수정**: `wiki/index.md` — 프로그래밍 일반 섹션에 `[[cqrs]]` 추가

---

## 2026-06-22 15:37:21

- **생성**: `wiki/programming/design-patterns.md` — GoF 23개 패턴 개요 + 분류별 목록표
- **생성**: `wiki/programming/design-patterns-creational.md` — 생성 패턴 5개
  - Singleton: Enum/DCL/Holder 3가지 구현, Spring 싱글턴과 관계
  - Factory Method: 서브클래스 위임, Calendar·FactoryBean 실무
  - Abstract Factory: 제품 패밀리 일관성, JDBC 예시
  - Builder: 불변 객체·선택적 파라미터, Lombok @Builder 실무
  - Prototype: 얕은/깊은 복사, Spring prototype scope
- **생성**: `wiki/programming/design-patterns-structural.md` — 구조 패턴 7개
  - Adapter: Object Adapter, Arrays.asList/InputStreamReader 실무
  - Bridge: 추상화×구현 조합 폭발 방지, JDBC/SLF4J 실무
  - Composite: 파일시스템 트리 예시
  - Decorator: DataSource 중첩 래퍼, Java I/O 실무
  - Facade: VideoConverter, JdbcTemplate 실무
  - Flyweight: Intrinsic/Extrinsic 분리, Integer 캐시 실무
  - Proxy: Virtual/Protection/Logging 종류, JDK Dynamic Proxy, Spring AOP 연결
- **생성**: `wiki/programming/design-patterns-behavioral.md` — 행동 패턴 11개
  - CoR·Command·Iterator·Mediator·Memento·Observer·State·Strategy·Template Method·Visitor·Interpreter
  - 각 패턴 핵심 아이디어, Java 예시 코드, 장단점, 실무 사용처
- **수정**: `wiki/index.md` — 프로그래밍 일반 섹션에 4개 항목 추가

---

## 2026-06-22 15:27:00

- **생성**: `wiki/java/excel.md` — Java Excel 처리 라이브러리 가이드
  - Apache POI 5.5.1: HSSF/XSSF/SXSSF 3계층, SXSSF 스트리밍 쓰기(windowSize·dispose), SAX 스트리밍 읽기(XSSFReader+SheetContentsHandler)
  - FastExcel 0.20.2/0.18.4: 독립 스트리밍 라이브러리, 쓰기·읽기 API, 제한사항(xls 미지원·수식·차트·암호화)
  - EasyExcel 4.0.3: @ExcelProperty DTO 매핑, AnalysisEventListener 리스너 패턴, 대용량 페이지 쓰기, 템플릿 Fill. 2025-09 유지보수 모드 주의 명시
  - 라이브러리 선택 기준 테이블
- **수정**: `wiki/index.md` — Java 섹션 최상단에 `[[excel]]` 항목 추가

---

## 2026-06-22 15:10:40

- **생성**: `wiki/programming/solid.md` — SOLID 원칙 전체 가이드
  - 5원칙 개요 테이블
  - SRP: 변경의 축 개념, 위반·적용 예시, 과도한 분리 주의사항
  - OCP: 전략 패턴으로 기존 코드 수정 없이 확장하는 예시
  - LSP: Rectangle/Square 고전 예시, 위반 징후(instanceof 분기, UnsupportedOperationException)
  - ISP: 범용 인터페이스 분리 예시, Repository Projection 실무 연결
  - DIP: 고수준/저수준 모듈 추상화 예시, DI와의 관계
  - 원칙 간 관계 (SRP+ISP, OCP+DIP, LSP→OCP 전제)
  - 실무 적용: 증상별 관련 원칙 테이블
- **생성**: `wiki/programming/` 디렉터리 — 프로그래밍 일반 카테고리 신설
- **수정**: `wiki/index.md` — `## 프로그래밍 일반` 섹션 추가, `[[solid]]` 항목 등록

---

## 2026-06-22 14:55:52

- **생성**: `wiki/java/spring/spring-redis.md` — Spring Boot Redis 전체 가이드
  - 의존성 (spring-boot-starter-data-redis, commons-pool2, Jedis 전환 방법)
  - RedisAutoConfiguration 조건부 빈 등록 원리
  - RedisTemplate 직렬화 전략 (JdkSerialization → StringRedisSerializer + GenericJackson2JsonRedisSerializer 권장)
  - Operations 인터페이스 (ValueOps/ListOps/SetOps/ZSetOps/HashOps) 및 BoundOperations
  - 커넥션 풀 설정 (commons-pool2 자동 활성화)
  - LettuceConnectionFactory 고급 설정: SocketOptions, ClusterTopologyRefreshOptions, ClusterClientOptions, LettuceClientConfiguration
  - DynamicCommandTimeout: 명령어별 타임아웃 분리
  - DynamicConnection: 장애 노드 필터링 (nodeFilter, validateClusterNodeMembership)
  - Cluster/Sentinel 설정
  - Spring Cache 연동 (@EnableCaching, @Cacheable, RedisCacheConfiguration, 캐시별 TTL)
  - 사용 사례: 세션 저장소, Pub/Sub, 파이프라이닝, 분산 락
  - 성능·장애대응 설정 요약 테이블
  - Lettuce vs Jedis 비교 테이블
- **수정**: `wiki/index.md` — Spring 섹션에 `[[spring-redis]]` 항목 추가

---

## 2026-06-22 14:45:45

- **생성**: `wiki/java/spring/hikari-deadlock.md` — HikariCP 데드락 전용 문서. hikari-datasource.md에서 데드락 섹션 분리 + azguards.com 내용 추가
  - 발생 메커니즘 (handOffQueue 교착, 풀 통계 상태표)
  - 풀 고갈 수학적 조건 `P ≤ T×(D-1)`, 안전 최솟값 공식
  - @GeneratedValue(AUTO)+MySQL+Spring Boot 2.x 함정 (Sub TX, new_generator_mappings 버전별 차이)
  - 진단: JVM 스레드 덤프 패턴, JMX 메트릭 확인법, 자가진단 절차
  - 해결 방법 4가지: 풀 크기 조정 / Sequence Optimizer / 보조 풀 분리 / 비동기 이벤트(권장)
  - 벤치마크: 동기 REQUIRES_NEW vs 비동기 이벤트 (P99: 30015ms → 45ms, 에러율 98.5% → 0%)
- **수정**: `wiki/java/spring/hikari-datasource.md` — 데드락 섹션 제거 후 [[hikari-deadlock]] 참조로 대체, Related pages 추가
- **수정**: `wiki/index.md` — Spring 섹션에 `[[hikari-deadlock]]` 항목 추가

---

## 2026-06-22 14:41:39

- **수정**: `wiki/java/spring/hikari-datasource.md` — 우아한형제들 기술블로그(이론편·실전편) 내용 추가
  - 커넥션 획득·반납 3단계 흐름 및 handOffQueue 상세화
  - 데드락 섹션 신규 추가: 발생 메커니즘, 풀 통계 상태표, 증상 패턴
  - Spring Boot 2.x `@GeneratedValue(AUTO)` + MySQL 조합 함정 (Sub Transaction으로 커넥션 2개 소비)
  - Spring Boot 1.5.x vs 2.x `new_generator_mappings` 동작 차이
  - 해결 방법: 풀 크기 버퍼 공식 `Tn×(Cm-1)+(Tn/2)`, Sequence Optimizer 5종 비교 및 `pooled-lotl` 적용 코드
  - 데드락 자가진단 방법
  - Sources에 우아한형제들 링크 2건 추가

---

## 2026-06-22 14:28:03

- **이동**: `wiki/spring/hikari-datasource.md` → `wiki/java/spring/hikari-datasource.md`
- **삭제**: 빈 디렉터리 `wiki/spring/` 제거

---

## 2026-06-22 14:24:42

- **생성**: `wiki/spring/hikari-datasource.md` — HikariCP DataSource 정리. Spring Boot 기본 풀·우선순위, ConcurrentBag/프록시 아키텍처 내부 원리, 전체 설정 파라미터(자주 쓰는 것/드물게 쓰는 것), 풀 크기 결정 공식(core×2+spindle, 데드락 방지), MySQL 권장 설정·누수 감지·다중 DataSource 예시, Apache DBCP2 비교표
- **수정**: `wiki/index.md` — Spring 섹션에 `[[hikari-datasource]]` 항목 추가

---

## 2026-06-22 14:20:49

- **수정**: `wiki/ai/okf.md` — Sources의 raw 파일 경로를 원본 URL 링크로 교체, `Last updated` 갱신

---

## 2026-06-22 14:05:31

- **수정(일괄)**: `wiki/dbms/` 2개 파일 — Sources 섹션의 raw 파일 경로를 원본 URL 마크다운 링크로 교체, `Last updated` 갱신
  - `oracle-hints.md`: Using Optimizer Hints, SQL Tuning Guide (Oracle 19c)
  - `execution-plan-and-statistics.md`: ORACLE Understanding SQL Execution Plans, SQL Tuning Guide (Oracle 18c), ANALYZE (PostgreSQL) — `Troubleshooting execution plan.md`는 소스 URL 없는 개인 노트로 raw 경로 유지

---

## 2026-06-22 11:42:54

- **생성**: `wiki/ai/ai-agent-skill.md` — AI 에이전트 스킬 파일 전반 정리. 스키마 파일(CLAUDE.md)과의 차이(자동 로드 vs 호출 시 로드), Claude Code `.claude/commands/` 구조(프로젝트/글로벌/디렉터리 스코프), 파일 형식(서브커맨드 테이블·인자 전달·조건 분기), 번들 스킬(claude-api/artifact-design) 및 사용자 정의 예시(코드 리뷰/ingest/릴리즈 노트), 활용 패턴, 장점
- **수정**: `wiki/index.md` — AI 섹션에 `[[ai-agent-skill]]` 항목 추가

---

## 2026-06-22 11:37:52

- **수정**: `wiki/ai/ai-agent-schema.md` — "파일 로드 순서 및 우선순위" 섹션 추가. Claude Code 3계층(`~/.claude/CLAUDE.md` → 루트 → 서브디렉터리) 누적 로드 방식, Cursor `.mdc` 파일별 활성화 조건(`alwaysApply`/`globs`/description), 기타 에이전트 단일 파일 방식 정리

---

## 2026-06-22 10:53:44

- **생성**: `wiki/ai/ai-agent-schema.md` — AI 에이전트 스키마 파일 전반 정리. 에이전트별 파일명(CLAUDE.md/AGENTS.md/GEMINI.md/Cursor/.github/copilot-instructions.md), 포함 내용 범주(프로젝트 컨텍스트·워크플로우·코딩 규칙·제한), Karpathy·SamurAIGPT·Claude Code 공식 예시 비교, 작성 가이드라인 6항목
- **수정**: `wiki/ai/llm-wiki.md` — 스키마 링크를 `[[ai-agent-schema]]`로 갱신
- **수정**: `wiki/index.md` — AI 섹션 항목 갱신

---

## 2026-06-22 10:40:27

- **생성**: `wiki/ai/llm-wiki.md` — LLM Wiki 패턴 정리. 목적(지식 컴파일·누적), RAG와 차이, 3계층 구조(raw/wiki/schema), 워크플로우(ingest/query/lint), 확장 패턴(v2: 신뢰도 점수·지식 그래프·이벤트 드리븐). 소스: Karpathy gist, SamurAIGPT/llm-wiki-agent, LLM Wiki v2
- **수정**: `wiki/ai/okf.md` — Related pages에 `[[llm-wiki]]` 역링크 추가, 메타데이터 형식을 표 형식으로 통일, `Last updated` 갱신
- **수정**: `wiki/index.md` — AI 섹션에 `[[llm-wiki]]` 항목 추가

---

## 2026-06-22 10:34:08

- **수정(일괄)**: `wiki/docker/` 12개 파일 — Sources 섹션의 `[[raw파일명]]` 위키 링크를 원본 URL 마크다운 링크로 교체, `Last updated` 갱신
  - 대상: `docker-overview`, `docker-container`, `docker-container-commands`, `docker-image`, `docker-volume`, `docker-volume-commands`, `docker-network`, `docker-network-commands`, `docker-network-drivers`, `docker-security`, `dockerfile`, `dockerfile-directives`
  - raw 파일 frontmatter의 `source:` 필드를 기준으로 `[[파일명]]` → `[제목](URL)` 변환

---

## 2026-06-19 17:57:13

- **수정(linux 출처 정리)**: `raw/linux/` 삭제로 깨진 Sources를 공식 웹 문서로 교체.
  - openssl 8개(`openssl-cms`·`openssl-crl`·`openssl-dgst`·`openssl-keygen`·`openssl-overview`·`openssl-pkcs12`·`openssl-s_client`·`openssl-x509`) → `docs.openssl.org/master/man1/openssl-*/`(가이드는 man7)
  - `text/standard-streams.md` → man7 stdin(3)·GNU Bash Redirections 매뉴얼·Baeldung stream-redirections
  - `network/dns-tools.md` → 평문 dig 출처를 마크다운 링크로 정리
  - 그 외 linux 문서는 이미 man7.org/gnu.org 등 정상 웹 출처라 변경 없음

---

## 2026-06-19 17:53:37

- **수정**: `wiki/linux/editor/readline-shortcuts.md` — 키 표기를 Readline 단축 표기(`C-`/`M-`)에서 풀네임(`Ctrl+`/`Alt+`)으로 전면 변경(`Ctrl-X Ctrl-R` → `Ctrl+x Ctrl+r` 포함). 불필요해진 `C-`/`M-` 범례 줄을 macOS 안내로 정리

---

## 2026-06-19 17:21:23

- **정리/수정**: `wiki/linux/editor/vim-01~05.md` — Sources를 "`:help`"에서 공식 Vim 문서(vimhelp.org) 토픽별 링크로 교체(modes→intro/insert/editing, navigation→motion/scroll, editing→change/undo/repeat, search-replace→pattern/change/repeat, practical→visual/various/repeat/windows/diff). Related pages 상호링크 누락 보완(vim-02에 [[vim-05-practical]], vim-04에 [[vim-02-navigation]] 추가). 본문 내용 검토 결과 정확하여 변경 없음. (readline-shortcuts는 GNU 공식 링크라 유지)

---

## 2026-06-19 17:16:10

- **수정**: `wiki/java/spring/querydsl.md` — Projection(DTO 직접 조회) 섹션(7장) 신규 추가: Tuple, `Projections.bean`(setter)·`fields`(필드)·`constructor`(생성자), `@QueryProjection`(Q-type 생성·컴파일 타임 안전), 방식 비교표·별칭(`.as`) 설명. 기존 컨벤션 섹션은 8장으로 이동. `wiki/index.md` 설명 갱신

---

## 2026-06-19 17:07:01

- **수정**: `wiki/java/spring/mybatis.md` — 비교표에서 jOOQ 열 제거, 장단점을 문단 → 목록(bullet)으로 변경, Stored Procedure 항목에 CALLABLE·파라미터 mode(IN/OUT/INOUT)·OUT 매핑 설명 추가

---

## 2026-06-19 17:00:38

- **통합/생성**: `wiki/java/spring/mybatis.md` — `mybatis-overview` + `mybatis-usage`를 단일 문서로 통합. 설정·의존성을 **단독 사용 / Spring Boot 자동설정**으로 분리, 트랜잭션(autoCommit·@Transactional) 보강, 결과 매핑(@Results·XML resultMap·생성자·연관관계) 확장, **Auto-Increment 키 반환(useGeneratedKeys / selectKey, MySQL AFTER vs Oracle 시퀀스 BEFORE) 신규 추가**, Dynamic SQL XML 태그 추가
- **삭제**: `wiki/java/spring/mybatis-overview.md`, `wiki/java/spring/mybatis-usage.md`
- **수정**: `wiki/index.md` — mybatis 2개 항목 → 1개(`[[mybatis]]`)로 통합

---

## 2026-06-19 16:41:14

- **통합/생성**: `wiki/java/spring/querydsl.md` — `querydsl-overview` + `querydsl-build`를 단일 문서로 통합. 기본 JPA 대비 장점(타입안전·**동적 조건 처리** BooleanExpression/BooleanBuilder 신규 추가), Q-type·컨벤션, 빌드 설정(4.1 공식 vs OpenFeign / 4.2 Gradle / 4.3 Maven / 4.4 마이그레이션), JPAQueryFactory 빈 설정, 쿼리 API, Custom Repository 패턴
- **삭제**: `wiki/java/spring/querydsl-overview.md`, `wiki/java/spring/querydsl-build.md`
- **수정**: `wiki/index.md`(querydsl 2개 항목 → 1개로 통합), `wiki/java/common/sbom-java.md`·`wiki/java/spring/mybatis-overview.md`(Related pages `[[querydsl-*]]` → `[[querydsl]]`)

---

## 2026-06-19 16:33:40

- **삭제**: `wiki/java/spring/jooq-overview.md`, `wiki/java/spring/jooq-build.md` — jOOQ 문서 삭제
- **수정**: `wiki/index.md`(jooq 2개 항목 제거), `wiki/java/common/sbom-java.md`·`wiki/java/spring/mybatis-overview.md`(Related pages의 `[[jooq-*]]` 링크 제거)
- **통합/재작성**: `wiki/java/spring/configuration-properties.md` — `@ConfigurationProperties` 문서를 요청 구조로 재구성. 사용법·관련 어노테이션(요약표), 설정파일↔필드 매핑(Relaxed Binding·중첩·타입변환), Setter vs Constructor 바인딩, 검증, `@Value` 장단점 비교, 흩어져 있던 버전 정보를 **Spring Boot 버전별 차이점(2.2/2.6/3.0/3.2 — @ConstructorBinding 패키지 이동·deprecation 포함)** 전용 섹션으로 통합. `externalized-configuration`은 별개 주제로 미병합·링크 유지. Sources에 Spring Boot 3 마이그레이션 추가
- **수정**: `wiki/index.md` — `[[configuration-properties]]` 설명 갱신

---

## 2026-06-19 15:54:03

- **수정(일괄)**: `raw/java/` 삭제로 깨진 Sources를 가진 Java/Spring 위키 25개 파일의 `## Sources`를 공식/권위 웹 문서 링크로 교체하고 `Last updated` 갱신.
  - common(9): `jmap`·`jps`·`jstack`(Oracle JDK 21 man pages), `jvm-options`·`java-version`(java man page·Baeldung·man7·sdkman), `java17-features`·`java21-features`(openjdk.org JEP), `sbom`·`sbom-java`(GitHub·CycloneDX 등)
  - spring(16): `jpa-transaction`/`jpa-delete`/`jpa-entity-lifecycle`/`jpa-composite-key`/`jpa-n-plus-one`, `repository-projection`/`multi-datasource`/`routing-datasource`/`externalized-configuration`/`configuration-properties`, `jooq-overview`/`jooq-build`/`querydsl-overview`/`querydsl-build`/`mybatis-overview`/`mybatis-usage` (Spring/Spring Data/Spring Boot reference·Baeldung·Hibernate·MyBatis/jOOQ/QueryDSL 공식·일부 블로그)
  - fallback: ConstructorBinding 2.6.3 javadoc 미존재 → 2.7.16(동일 패키지)로 대체.
- **수정**: `wiki/java/spring/jpa-transaction.md` — "실무에서 만난 글로벌 롤백 마킹" Sources를 사용자 제공 실제 출처(https://mj950425.github.io/jvm-lang/project/dev/rollback-marking/)로 교체
- **수정**: `wiki/java/spring/{jooq-overview,jooq-build}.md` — "jOOQ를 JPA와 같이 써보자" Sources를 사용자 제공 실제 출처(https://sightstudio.tistory.com/68)로 교체
- **수정**: `wiki/java/spring/{querydsl-overview,querydsl-build}.md` — "OpenFeign QueryDSL 기본 설정 및 사용법" Sources를 사용자 제공 실제 출처(https://rebugs.tistory.com/900)로 교체

---

## 2026-06-19 15:44:11

- **통합/수정**: `wiki/java/spring/spring-aop.md` — `spring-aop`(개요) + `spring-aop-usage`(사용법)를 단일 Spring AOP 문서로 통합. Spring Boot 설정 보강(starter-aop 자동설정, `spring.aop.auto`/`proxy-target-class=true` 기본값과 순수 Spring 차이, `@Order`). Sources를 삭제된 `raw/java/spring/*`에서 공식 웹 문서로 교체
- **삭제**: `wiki/java/spring/spring-aop-usage.md` — 위로 통합
- **수정**: `wiki/java/spring/aspectj.md` — Sources를 공식 웹 문서로 교체, 깨진 `[[spring-aop-usage]]` 링크 제거
- **수정**: `wiki/index.md` — `[[spring-aop-usage]]` 항목 제거, `[[spring-aop]]` 설명을 통합 내용으로 갱신

---

## 2026-06-19 15:30:45

- **생성**: `wiki/java/common/java-process-analysis-tools.md` — 자바 프로세스 분석·진단 도구 종합 문서. jps/top/jstat/jinfo/jstack/jmap/jcmd/JFR/async-profiler의 용도·방식·차이점·장단점 비교(사용법은 개별 문서 참조로 간략화), 증상별 트러블슈팅 워크플로우. 소스: Oracle 진단도구 docs + async-profiler docs + 웹
- **삭제**: `wiki/java/common/async-profiler.md` — 위 종합 문서로 확장·대체
- **수정**: `wiki/index.md` — `[[async-profiler]]` 항목을 `[[java-process-analysis-tools]]`로 교체
- **수정**: `wiki/java/common/{jps,jstack,jmap,jvm-options,cpu-usage-troubleshooting}.md`, `wiki/linux/system/system-monitoring.md` — Related pages의 `[[async-profiler]]`를 `[[java-process-analysis-tools]]`로 갱신

---

## 2026-06-19 15:17:51

- **생성**: `wiki/java/common/async-profiler.md` — async-profiler 개요·원리(AsyncGetCallTrace+perf_events), 자바 프로세스 분석 도구(jps/top/jstack/jmap) 비교표, 이벤트·사용법·플레임 그래프·주의사항. 소스: async-profiler 공식 docs + 웹
- **수정**: `wiki/index.md` — Java 섹션에 `[[async-profiler]]` 추가
- **수정**: `wiki/java/common/{jps,jstack,jmap,jvm-options}.md`, `wiki/linux/system/system-monitoring.md` — Related pages에 `[[async-profiler]]`(및 일부 `[[cpu-usage-troubleshooting]]`) 백링크 추가로 진단 도구 클러스터 통합

---

## 2026-06-19 15:10:11

- **수정**: `wiki/java/common/cpu-usage-troubleshooting.md` — 회고(KPT) 섹션 및 Action items 추가, `[[async-profiler]]` 링크 삽입

---

## 2026-06-19 15:07:18

- **생성**: `wiki/java/common/cpu-usage-troubleshooting.md` — CPU 사용량 증가 트러블슈팅. KeyStore 반복 접근(PBKDF) 사례, 진단 개선 방법(top -H→jstack nid 매칭, async-profiler/JFR), Map 캐시 해결책 및 평가. 소스: `raw/troubleshoot/keystore and cpu usage.md` + 웹
- **수정**: `wiki/index.md` — Java 섹션에 `[[cpu-usage-troubleshooting]]` 추가
- **수정**: `wiki/java/common/jstack.md` — Related pages에 `[[cpu-usage-troubleshooting]]` 백링크 추가

---

## 2026-06-19 10:20:05

- **생성**: `wiki/ai/okf.md` — Open Knowledge Format(OKF) v0.1 스펙 정리. 소스: `raw/ai/knowledge-catalogokfSPEC.md at main.md`
- **수정**: `wiki/index.md` — AI 섹션 신설 및 `[[okf]]` 항목 추가

---

## 2026-06-24

**변경 사항** :
- 전체 위키 페이지(115개) 메타데이터 형식 마이그레이션 — 마크다운 표(`| Title | … |`) → YAML frontmatter(`title`/`updated`/`tags`). 선두 H1 제거하고 title을 frontmatter로 이동, tags는 `#` 제거 후 리스트화. 본문·`updated` 값은 보존(형식 변경이라 갱신 불필요).
- `wiki/java/spring/forward-headers-proxy.md` 생성 — nginx 리버스 프록시(TLS 종료) 뒤 Spring Boot redirect 문제와 `server.forward-headers-strategy`(native/framework/none) 해결책 정리. `externalized-configuration` 역링크 및 index Spring 섹션 추가.

---

## 2026-06-26

**변경 사항** :
- `wiki/java/spring/spring-batch.md` 생성 — Spring Batch 개념 문서. 도메인 모델(Job/JobInstance/JobExecution/Step/StepExecution/JobRepository/ExecutionContext), 스텝 처리 방식(Tasklet vs Chunk·트랜잭션 경계), Chunk 구성요소(ItemReader/Processor/Writer 종류) 정리. 버전 무관 개념 중심(설정·재실행·메타데이터 스키마 상세는 별도 문서로 분리 예정). `jpa-transaction`·`mybatis`·`excel` 역링크 및 index Spring 섹션 추가.
- `wiki/java/spring/spring-batch.md` 보강 — Job·Step을 각각 별도 항목(§3 Job, §4 Step)으로 분리·상세화. Job(이름·Step 정의/실행순서·흐름 제어·재시작 설정·계층상 위치), Step(구성요소·트랜잭션 독립성·StepExecution 추적). 이후 섹션 번호 재정렬.
- `wiki/java/spring/spring-batch.md` 출처를 최신 레퍼런스(버전 비종속 `/spring-batch/reference/`, 현재 6.0.4)로 변경. 내용은 6.0.4 기준 검토 결과 정합. 버전 노트를 Batch 4~6(Boot 2/3/4 매핑)로 갱신, XML 네임스페이스 deprecated(6.0) 주석 추가.
- `wiki/java/spring/spring-batch-scope.md` 생성 — StepScope/JobScope: 빈 생성 지연(Late Binding), 프록시, SpEL(jobParameters/jobExecutionContext/stepExecutionContext), 사용 이유(JobParameter 바인딩·Thread Safety), 주의사항. 공식 레퍼런스 late-binding + jojoldu(tistory/330) 참조. `spring-batch` 역링크 및 index Spring 섹션 추가. (최초 `step-job-scope`로 생성 후 `spring-batch-scope`로 파일명 변경)
- `wiki/java/spring/spring-batch-job-parameters.md` 생성 — JobParameters: 지원 타입(4.x 4개 고정 String/Long/Double/Date → 5.0+ 임의 타입 JobParameter<T>, 스키마·변환기 변경)·버전 차이, 식별/비식별, 전달(JobParametersBuilder·커맨드라인 표기법 버전차·Spring Boot `--key=value`), 사용(SpEL·실행 컨텍스트 조회). 공식 레퍼런스(running/domain) + What's New 5.0 + 변환기 API 참조. `spring-batch`·`spring-batch-scope` 역링크 및 index 추가.
- `wiki/java/spring/spring-batch-tasklet.md` 생성 — Tasklet: 개념(execute/RepeatStatus, 호출당 트랜잭션, FINISHED까지 반복), 사용 시점(프로시저·SQL/DDL·파일/시스템 작업·셋업/클린업), 예시(FileDeletingTasklet 구현·람다·MethodInvokingTaskletAdapter/기타 어댑터), 장단점. 공식 레퍼런스 tasklet/step 참조. `spring-batch` 역링크 및 index 추가.
- `wiki/java/spring/spring-batch-chunk.md` 생성 — Chunk 지향 처리: 개념(read→process→write 루프·chunk size=commit-interval·chunk당 트랜잭션·의사코드), 예시, ItemReader(read()/null·ItemStream)·ItemProcessor(process()/null 필터)·ItemWriter(write(Chunk), 4.x List→5.0 Chunk 변경) 메서드·역할·구현체, Tasklet과 차이, 장단점. 공식 레퍼런스 item-reader/item-writer/step 참조. `spring-batch`·`spring-batch-tasklet` 역링크 및 index 추가.
- `wiki/java/spring/spring-batch-db-reader-writer.md` 생성 — DB ItemReader/Writer 카테고리별 정리(JDBC/JPA/Hibernate/Spring Data). 커서 vs 페이징 트레이드오프, JdbcCursorItemReader/JdbcPagingItemReader(sortKey)/StoredProcedureItemReader/JdbcBatchItemWriter, JpaPagingItemReader/JpaItemWriter(persist/merge), Hibernate, RepositoryItemReader/Writer 속성·예시·선택 기준. 공식 레퍼런스 database 참조. `spring-batch`·`spring-batch-chunk` 역링크 및 index 추가.
- `wiki/java/spring/spring-batch-db-reader-writer.md` 보강 — §7 "Offset 성능 이슈와 커스텀 리더" 추가: offset 페이징 한계, No Offset(Zero Offset) 방식, QueryDSL 커스텀 리더(QuerydslPagingItemReader/QuerydslNoOffsetPagingItemReader). 카카오페이 기술블로그(ifkakao2022 read)·jojoldu(tistory/473) 출처 추가. `querydsl` 역링크, 선택 기준·index 갱신. (선택기준 §7→§8)

---

