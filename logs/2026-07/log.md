# log

---

## 2026-07-30 15:27:53

- **수정**: `wiki/java/test/jmh.md` — 어색하게 끊긴 줄바꿈 정리(§3.3, §3.4, §3.6, §3.8, §3.9, §3.10 등), §1.1 "단순 반복 측정과의 차이" 신설 — naive for 루프+nanoTime 측정의 문제점(워밍업 미고려, 데드 코드 제거, 루프 최적화, 단일 표본, 프로세스 오염)과 JMH의 대응 메커니즘 비교표 추가

---

## 2026-07-30 09:32:07

- **수정**: `wiki/javascript/null-operators.md` — 용어 한글화(옵셔널 체이닝/널 병합/널 병합 할당, 영어 병기는 title에서 1회만), §2~4 제목의 연산자 기호 괄호 제거 후 본문으로 이동, §2 제약사항에 tagged template/new 표현식 예시 코드 추가, §4 줄바꿈 정리
- **수정**: `wiki/index.md` — [[null-operators]] 설명 한글화

---

## 2026-07-30 09:13:08

- **생성**: `wiki/javascript/null-operators.md` — 자바스크립트 null 관련 연산자: Optional Chaining(`?.`), Nullish Coalescing(`??`), Nullish Coalescing Assignment(`??=`), null vs undefined
- **수정**: `wiki/index.md` — `## JavaScript` 카테고리 신설, [[null-operators]] 링크 추가

---

## 2026-07-23 17:58:31

- **수정**: `wiki/java/test/jacoco.md` — §4를 "플러그인 추가"(선언만)로 축소, §5 "상세 설정"(Maven execution·Gradle task) 신설, 측정 제외를 §5.3 아래 Maven/Gradle 하위로 분리, 사용 방법 §6·최소 커버리지 기준 §7로 재구성, gradle 코드펜스를 groovy로 변경

---

## 2026-07-23 16:29:03

- **수정**: `wiki/java/spring/aop-transaction-order.md` — 개요에서 "재현 어려운 버그" 표현 제거, precedence를 우선순위로 한글화(첫 등장만 영어 병기), §2.2 제목 단순화 및 본문 설명 보강

---

## 2026-07-23 09:42:24

- **생성**: `wiki/java/spring/aop-transaction-order.md` — AOP Advice 순서와 트랜잭션 경계. Advice precedence 규칙, 트랜잭션 advisor 기본 order(LOWEST_PRECEDENCE), @Aspect 빈의 프록시 제외, 위치별(안/밖) 롤백 영향, 예외 삼킴으로 롤백 실패한 사례(`raw/troubleshoot/Spring AOP and transaction.md`)와 해결
- **수정**: `wiki/index.md`, `wiki/java/spring/aop.md`, `wiki/java/spring/jpa-transaction.md` — [[aop-transaction-order]] 링크 추가

---

## 2026-07-22 17:26:46

- **수정**: `wiki/java/common/gradle-task.md` — §2.8 제목을 "기타 — Spring Boot 프로젝트에서 자주 쓰는 Task"로 정정(구 제목이 test까지 Spring Boot 소속처럼 보이게 하던 문제 해소). GradleBuild `dir` 미지정 시 프로젝트 자신의 디렉터리가 기본값임을 명시. 신규 §2.6 JavaExec 추가(mainClass/classpath/args/jvmArgs/systemProperty — jvmArgs는 JavaForkOptions 인터페이스 제공이며 Test와 공유됨을 명시), 이에 따라 Javadoc/GradleBuild/기타(Spring Boot)/커스텀 타입이 각각 2.7~2.10으로 순연. bootRun 항목은 JavaExec 서브타입임을 명시하고 공유 프로퍼티는 §2.6 참조로 대체, optimizedLaunch만 고유 프로퍼티로 남김. test 항목의 jvmArgs에 JavaExec와 공유하는 프로퍼티라는 설명 추가. §1·§6의 커스텀 타입 앵커 참조(§2.9→§2.10)도 함께 수정. Gradle JavaExec/JavaForkOptions Javadoc 기준

---

## 2026-07-22 17:16:00

- **수정**: `wiki/java/common/gradle-task.md` — §2에 "2.8. 기타 — Spring Boot 태스크" 신규 추가(bootJar/bootWar/bootRun/test 용도와 주요 프로퍼티·메서드를 목록으로 간략 설명). 커스텀 타입은 2.9로 뒤로 밀려 마지막 항목 유지. §1·§6의 커스텀 타입 참조 앵커(§2.8→§2.9)도 함께 수정. Spring Boot Gradle Plugin 공식 문서(Packaging, Running your Application)·Gradle Test DSL 기준

---

## 2026-07-22 16:35:22

- **수정**: `wiki/java/common/gradle-task.md` — §2 타입을 각 타입별 하위 항목(2.1 타입 미지정 ~ 2.7 GradleBuild)으로 재구성, 커스텀 타입을 2.8로 마지막에 유지. §3.1에 `tasks.create()`(deprecated) 관련 언급 추가. §5에 `enabled` 프로퍼티(조건부 스킵 onlyIf와 대비되는 완전 비활성화 수단) 추가. 신규 §6 증분 빌드와 Task Input/Output — `UP-TO-DATE` 판정 원리, 커스텀 타입에 `@Input`/`@OutputDirectory` 등 애너테이션이 필요함을 §2.8 예시와 연결해 설명. Gradle TaskContainer/Task Javadoc·Incremental Build 공식 문서 기준

---

## 2026-07-22 16:15:14

- **수정**: `wiki/java/common/gradle.md` — 모든 코드 예시를 Kotlin DSL에서 Groovy DSL로 전면 수정(§2 settings.gradle, §6.2/6.3 plugins 블록, §7.1 repositories, §7.3/7.5 dependencies)
- **수정**: `wiki/java/common/gradle-multi-project.md` — 모든 코드 예시를 Kotlin DSL에서 Groovy DSL로 전면 수정(§2 include()·프로젝트 디스크립터, §3 project()·타입세이프 접근자, §4 cross-project configuration·dependencyResolutionManagement, §5 buildSrc/build-logic — `kotlin-dsl` 플러그인→`groovy-gradle-plugin`, `src/main/kotlin`→`src/main/groovy`, `*.gradle.kts`→`*.gradle` 포함)

---

## 2026-07-22 16:05:36

- **수정**: `wiki/java/common/gradle-task.md` §2 타입 지정 — 대표 내장 타입(Copy/Delete/Zip·Jar·Tar/Exec/Javadoc/GradleBuild)을 각각 하위 목록으로 추가. 타입별 용도와 주요 프로퍼티/메서드를 각 키워드가 무엇을 지정하는지 설명과 함께 목록으로 작성. 각 타입의 Gradle DSL 공식 레퍼런스 기준

---

## 2026-07-22 15:42:02

- **수정**: `wiki/java/common/gradle-task.md` — 모든 코드 예시를 Kotlin DSL에서 Groovy DSL 기준으로 전면 수정. `register()`/`named()`의 두 번째 인자로 타입을 넘기는 형태로 통일(Kotlin의 reified 제네릭 `<T>` 구문 관련 설명 제거), 이미 등록된 TaskProvider 설정은 `.configure { }`로 표기(Kotlin의 `taskY { }` 축약 invoke는 Groovy에 없음), `onlyIf`의 `Provider.isPresent()`는 Groovy 프로퍼티 접근 `.present`로 표기. Gradle 공식 문서의 Groovy DSL 예시 기준

---

## 2026-07-22 15:32:59

- **수정**: `wiki/java/common/gradle-task.md` §2 타입 지정 — `tasks.register(name, Type) { ... }` 형태(`TaskContainer.register(String, Class<T>, Action)` 오버로드) 추가 누락 보완. Kotlin DSL의 `register<Copy>(name)`은 이 오버로드를 감싼 확장 함수이며, `register("name", Type::class.java)`로도 동일하게 호출 가능함을 명시. Groovy DSL은 클래스 리터럴을 그대로 넘기는 `register("name", Type) { ... }` 표기를 씀. `GradleBuild`(다른 Gradle 빌드 실행 Task) 예시 추가. Gradle TaskContainer/GradleBuild 공식 Javadoc 기준

---

## 2026-07-22 15:22:12

- **생성**: `wiki/java/common/gradle-task.md` — Gradle Task 기본 설명. Task 정의(Action 순차 목록), 타입(타입 미지정/ad-hoc — doFirst/doLast, 내장 타입 — Copy 등, 커스텀 타입 — DefaultTask 상속+@TaskAction), 등록 방법(tasks.register() 지연 등록·Task Configuration Avoidance, tasks.named(), group/description과 숨김 Task), 의존관계와 순서(dependsOn·mustRunAfter/shouldRunAfter 차이·finalizedBy), 조건부 실행(onlyIf). Gradle User Guide(More about Tasks, Controlling Task Execution)·Task Javadoc 공식 문서 기준으로 신규 작성(wiki-ingest, raw/ 내 관련 진실 공급원 없음)
- **수정**: `wiki/java/common/gradle.md` — Related pages에 [[gradle-task]] 추가
- **수정**: `wiki/java/common/gradle-multi-project.md` — Related pages에 [[gradle-task]] 추가
- **수정**: `wiki/index.md` — Java 섹션에 [[gradle-task]] 항목 추가 (gradle-multi-project 다음 위치)

---

## 2026-07-22 14:38:24

- **생성**: `wiki/web/sso.md` — SSO(Single Sign-On) 개념 개요와 주요 프로토콜 비교. 핵심 모델(IdP/SP·RP, 신뢰 관계, SP-initiated vs IdP-initiated), SAML 2.0(Assertion/Protocol/Binding/Profile 구성, SP-initiated·IdP-initiated SSO 플로우, Single Logout), OpenID Connect(OP/RP, ID Token 클레임), Kerberos(AS/TGS/Ticket/세션 키/Authenticator, SSO 동작 원리, LDAP과의 관계), 프로토콜 비교표, 보안 고려사항(재사용 방지·서명/암호화·대상 검증·세션 고정 방지). OASIS SAML 2.0 Technical Overview·OpenID Connect Core 1.0·RFC 4120 공식 문서 기준으로 신규 작성(wiki-ingest, raw/ 내 관련 진실 공급원 없음)
- **수정**: `wiki/web/oauth2.md` — Related pages에 [[sso]] 추가
- **수정**: `wiki/directory/ldap.md` — Related pages에 [[sso]] 추가
- **수정**: `wiki/index.md` — Web 섹션에 [[sso]] 항목 추가 (oauth2 다음 위치)

- **수정**: `wiki/java/common/gradle-multi-project.md` — §4 제목을 "build.gradle에서 공통 설정(cross-project configuration)"으로 정리(위키 제목 규칙상 부연은 괄호로), §4.3 대체 수단 표의 첫 헤더를 "용도"로 간결화, §5 제목을 "컨벤션 플러그인"으로 축약. §5.2에 `build-logic`을 루트에서 사용하는 방법 추가 — 루트 `settings.gradle(.kts)`의 `pluginManagement { includeBuild("build-logic") }`으로 등록해야 서브프로젝트가 플러그인 ID로 인식할 수 있음을 명시(Gradle Composite Builds 공식 문서 기준)

---

## 2026-07-22 11:16:13

- **생성**: `wiki/java/common/gradle-multi-project.md` — Gradle 멀티 프로젝트 관리. settings.gradle(.kts)의 include()로 서브프로젝트 등록·프로젝트 경로-디렉터리 매핑·ProjectDescriptor로 이름/경로 커스터마이징, 프로젝트 간 의존성(project() 함수·타입세이프 접근자), cross-project configuration(allprojects/subprojects) 정의와 지양 이유(설정 시점 결합, 암묵적 주입) 및 항목별 대체 수단(빌드 로직→컨벤션 플러그인, repositories→settings의 dependencyResolutionManagement, 공유 버전→버전 카탈로그), buildSrc·build-logic을 통한 컨벤션 플러그인 공유 방법. Gradle User Guide 공식 문서 기준으로 신규 작성(wiki-ingest, raw/ 내 관련 진실 공급원 없음)
- **수정**: `wiki/java/common/gradle.md` — Related pages에 [[gradle-multi-project]] 추가
- **수정**: `wiki/index.md` — Java 섹션에 [[gradle-multi-project]] 항목 추가 (maven 다음 위치)

- **생성**: `wiki/java/common/maven.md` — Maven 빌드 방식. 핵심 개념(POM/Coordinate/Lifecycle/Phase/Plugin/Goal/Repository), POM 구조(최소 POM·GAV 좌표, Parent 상속, Aggregation), 표준 디렉터리 구조, 빌드 라이프사이클(default/clean/site 3종, default의 validate~deploy Phase, packaging별 Phase-Goal 기본 바인딩), 대표 core 플러그인·Goal, 의존성 관리(scope 6종, dependencyManagement, exclusion/optional), 리포지토리(local/remote, mirror, 내부 리포지토리), 멀티모듈 Reactor(정렬 규칙, -pl/-am/-amd/-rf 등), CLI 사용법과 자주 쓰는 옵션. Apache Maven 공식 Guide·CLI Reference 문서 기준으로 신규 작성(wiki-ingest, raw/ 내 관련 진실 공급원 없음)
- **수정**: `wiki/java/common/gradle.md` — Related pages에 [[maven]] 추가
- **수정**: `wiki/index.md` — Java 섹션에 [[maven]] 항목 추가 (gradle 다음 위치)

- **수정**: `wiki/java/common/gradle.md` — §2 제목에서 "— settings.gradle(.kts)" 제거, 해당 파일명은 본문 첫 문장에 기술하도록 변경. §8에 8.1 자주 쓰는 옵션 추가(`-x`/`--continue`/`--rerun-tasks`/`--offline`/`-U`/`--parallel`/`--build-cache`/로그 레벨(`-q`/`-w`/`-i`/`-d`)/스택트레이스(`-s`/`-S`)/`-t`/`--scan`/`-p`) — 로컬 `gradle --help`(8.13) 출력과 공식 CLI/Logging 문서 대조로 검증. 신규 §9 Maven과 비교 추가(빌드 스크립트 형식, 빌드 모델 — 고정 라이프사이클 vs Task 그래프, 의존성 scope-Configuration 대응표, 빌드 성능 — Gradle 코어 내장 캐시/데몬 vs Maven의 별도 extension/mvnd) — Apache Maven 공식 문서·maven-build-cache-extension 문서·mvnd README 기준
- **수정**: `wiki/index.md` — [[gradle]] 설명에 CLI, Maven과 비교 항목 반영

- **생성**: `wiki/java/common/gradle.md` — Gradle 개요. 핵심 개념(Build/Project/Task/Build Script/Plugin/Dependency), settings.gradle(.kts), Gradle Wrapper, 빌드 라이프사이클 3단계(Initialization/Configuration/Execution)와 Task 그래프(DAG), Task(플러그인 미적용 시 기본 제공되는 Help/Build Setup Task vs 플러그인이 추가하는 Task), 플러그인 종류(Core/Community/Custom)별 대표 예시, 의존성 관리(리포지토리, Configuration별 용도, 의존성 선언, 버전 카탈로그), CLI 사용법. Gradle User Guide 공식 문서 기준. Task 기본 제공 여부는 로컬 Gradle 8.13으로 빈 프로젝트 vs `java` 플러그인 적용 프로젝트의 `gradle tasks` 출력을 직접 비교해 검증. raw/에 관련 진실 공급원 없어 웹 공식 문서 기반으로 신규 작성(wiki-ingest)
- **수정**: `wiki/index.md` — Java 섹션에 [[gradle]] 항목 추가 (cpu-usage-troubleshooting 다음 위치)

---

## 2026-07-22 09:56:05

- **수정**: `wiki/java/spring/ldap-java.md` §8.3(LdapQueryBuilder — 동적 필터) — `LdapQueryBuilder`의 필터 조건 종류(is/gte/lte/like/whitespaceWildcardsLike/isPresent/not) 및 다중값 속성 매칭 방식 추가. 다중값 매칭은 LDAP equality 필터의 프로토콜 차원 동작(값 중 하나라도 일치 시 매치)이며, OR은 `or()` 체이닝, AND는 같은 속성에 `and()` 체이닝으로 구성함을 명시. Spring LDAP Reference — Advanced LDAP Queries(기존 Sources 등록 문서) 기준

---

## 2026-07-22 09:31:30

- **수정**: `wiki/java/spring/ldap-java.md` — 구 §8 사용자 인증(자격증명 확인), 구 §9 Referral 처리 항목 삭제. 두 내용은 개념적으로 [[ldap]] 문서(§6 인증과 보안)에 속하며 이 문서에서 별도 서술할 필요가 없다고 판단. 뒤따르던 Spring LDAP §10 → §8, 선택 기준 §11 → §9로 재번호. §2.1 REFERRAL 행·선택 기준 표의 관련 섹션 참조 제거, Sources에서 Oracle JNDI Tutorial — Referrals 항목 삭제

---

## 2026-07-21 17:43:13

- **수정**: `wiki/java/spring/ldap-java.md` — §10.5를 'Bind/Unbind'에서 'Bind/Rebind/Unbind'로 확장. `rebind`가 unbind+bind와 동일한 전체 교체(crude) 방식이라 지정하지 않은 속성이 사라짐을 명시하고, 부분 갱신 시 `modifyAttributes` 사용을 안내. Spring LDAP 공식 레퍼런스(Basic Operations §2.4~2.5, 기존 Sources에 등록된 문서) 근거

---

## 2026-07-21 11:36:55

- **생성**: `wiki/java/spring/spring-event-error-handling.md` — Spring 이벤트 리스너 예외 처리. 동기 리스너 기본 동작(멀티캐스트 중단·발행자 전파)과 ErrorHandler 커스터마이징(TaskUtils.LOG_AND_SUPPRESS/PROPAGATE_ERROR_HANDLER), 비동기(@Async) 리스너 예외(AsyncUncaughtExceptionHandler), @TransactionalEventListener phase별 예외 영향(BEFORE_COMMIT 롤백 유발 vs AFTER_COMMIT/AFTER_ROLLBACK/AFTER_COMPLETION 로그만). Spring 공식 Javadoc·Framework 소스(TransactionSynchronizationUtils, AbstractPlatformTransactionManager) 기준. wiki-lint에서 발견된 `spring-event.md`의 깨진 링크 3건(L101, L115, L160) 해소
- **수정**: `wiki/index.md` — Spring 섹션에 [[spring-event-error-handling]] 항목 추가 (spring-event 다음 위치)

---

## 2026-07-21 11:07:34

- **생성**: `wiki/linux/system/crontab.md` — crontab 개요, crontab 명령어(-e/-l/-r/-i/-u/-T/-s/-V), crontab 파일 문법(필드·특수문자·특수 닉네임·환경변수), 파일 위치(/var/spool/cron, /etc/crontab, /etc/cron.d, cron.allow/deny), 예시, 주의사항. man7.org crontab(5)/crontab(1) 기준으로 작성
- **수정**: `wiki/index.md` — Linux CLI 섹션에 [[crontab]] 항목 추가 (nohup 다음 위치)

---

## 2026-07-20 17:47:17

- **이동+수정**: `wiki/java/ldap-java.md` → `wiki/java/spring/ldap-java.md` — Spring 카테고리 위치로 이동. JNDI 파트(구 2번)를 §2~§9 상위 항목으로 분리·대폭 보강: §2 연결 설정(표준/프로바이더 전용 env 속성 전체, BATCHSIZE·REFERRAL·URL_PKG_PREFIXES·타임아웃·커넥션 풀), §3 Attributes/BasicAttributes/BasicAttribute 상세, §4 검색(SearchControls 스코프·옵션, 필터 문자열 검색, Attributes 매칭 검색), §5 엔트리 생성, §6 modifyAttributes(ADD/REPLACE/REMOVE_ATTRIBUTE), §7 검색 후 hasMore()로 생성/변경 분기하는 upsert 패턴, §8 사용자 인증, §9 Referral 처리. Spring LDAP 파트는 §10으로 유지. Oracle 공식 API 문서·JNDI 튜토리얼 기준
- **수정**: `wiki/index.md` — ldap-java 항목을 Java 섹션에서 Spring 섹션(mybatis 다음)으로 이동

---
## 2026-07-20 17:05:30

- **생성**: `wiki/java/ldap-java.md` — Java LDAP 연동(JNDI vs Spring LDAP 비교, JNDI 검색/bind/추가/사용자 인증, Spring LDAP LdapTemplate/LdapQueryBuilder/ODM(@Entry) 예시, 선택 기준). Oracle JNDI 튜토리얼, Spring LDAP 공식 레퍼런스 기준으로 작성
- **수정**: `wiki/directory/ldap.md` — Related pages에 [[ldap-java]] 추가
- **수정**: `wiki/web/oauth2.md` — Related pages에 [[ldap]] 추가

---
## 2026-07-20 16:51:42

- **생성**: `wiki/directory/ldap.md` — 신규 카테고리 "디렉터리 서비스" 생성. LDAP 개요(X.500과의 관계), 디렉터리 구조(DIT/DN·RDN/속성/objectClass/OID), 오퍼레이션 10종, 검색(스코프·필터), LDIF, 인증·보안(Simple bind/SASL, 포트 389·636, StartTLS), LDAP URL. RFC 4511/4513/4514, ldap.com 기준으로 작성

---

## 2026-07-20 13:48:13

- **수정**: `wiki/java/spring/hikari-datasource.md` — 2.2 획득·2.3 반납 흐름에 mermaid 플로우 차트 추가, 공식 소스 기준으로 서술 보강(CAS, addBagItem, 유효성 검사·재시도, close 시 rollback 조건, 대기자 없을 때 ThreadLocal 등록), Sources에 HikariCP 소스·우아한형제들 이론편 추가

---

## 2026-07-20 11:15:47

- **수정**: `wiki/java/spring/hikari-datasource.md` — 5절 풀 크기 결정과 7.2 커넥션 누수 감지 제거, 7절 기타 신설(풀 크기 결정·데드락·누수 감지 링크/요약), 절 번호 재정렬

---

## 2026-07-20 11:07:09

- **수정**: `wiki/java/spring/hikari-pool-sizing.md` — 문장 내 불필요한 줄바꿈 제거, 공리 절을 3.1 시작점 말미로 병합, 데드락 방지 공식을 3.2 하위 절로 이동

---

## 2026-07-20 11:01:03

- **생성**: `wiki/java/spring/hikari-pool-sizing.md` — HikariCP 풀 사이징
  - 작게 잡는 원리(컨텍스트 스위칭, I/O 블로킹, SSD), 시작점 공식, 데드락 방지 최소값(pool-locking), 배포 환경별 조정
- **수정**: `wiki/java/spring/hikari-datasource.md` — 5절 풀 크기 결정을 [[hikari-pool-sizing]] 링크로 축소, 소스와 불일치한 Oracle 시연 수치(100→10) 제거
- **수정**: `wiki/index.md` — Spring 섹션에 [[hikari-pool-sizing]] 추가

---

## 2026-07-20 10:51:56

- **수정**: `wiki/dbms/deadlock-livelock.md` — S락/X락 표기를 공유 락/배타 락으로 변경(첫 언급 시 영문 병기), 기아 관련 내용 제거(3.1 문장, 4절 비교표)

---

## 2026-07-16 18:01:00

- **생성**: `wiki/dbms/deadlock-livelock.md` — DBMS 데드락·라이브락
  - 비교 개요, 데드락 발생 조건(Coffman)·DBMS별 감지/해소(MySQL/PostgreSQL/Oracle)·진단·예방, 라이브락 정의·사례·대응, 기아 비교
- **수정**: `wiki/index.md` — DBMS 섹션에 [[deadlock-livelock]] 추가

---

## 2026-07-16 16:59:10

- **생성**: `wiki/crypto/hsm.md` — HSM
  - 개요·기능·형태, FIPS 140-3 수준별 요구사항과 물리 보안 상세(변조 흔적/저항/대응, EFP/EFT), PKCS#11 개념, Java 연동 예시(SunPKCS11, Thales LunaProvider), 용도, 클라우드 HSM 비교(AWS/Azure/GCP)
- **수정**: `wiki/index.md` — Crypto 섹션에 [[hsm]] 추가

---

## 2026-07-16 13:31:34

- **수정**: `wiki/java/crypto/keystore-java.md` — Entry 절 신설(2절: 인터페이스 설명, 구현 클래스별 하위 항목·예시 코드, getKey와의 차이), 개요의 엔트리 표 제거(alias 식별 문장만 유지), 기존 생성·저장/로드·조회/참고사항 번호 재조정(3~5), Sources 1건 추가

---

## 2026-07-16 11:44:50

- **수정**: `wiki/java/crypto/keystore-java.md` — 참고사항에 alias당 엔트리 1개 원칙(타입 혼합 저장 불가, setKeyEntry 덮어쓰기)과 엔트리 타입별 getter 반환 규칙 추가

---

## 2026-07-16 11:31:11

- **생성**: `wiki/java/crypto/keystore-java.md` — Java KeyStore
  - 타입(PKCS12/JKS/JCEKS)·엔트리 유형, 생성·저장(setKeyEntry/store), 로드·조회(getKey/getCertificate/aliases), 반복 조회 성능 캐시 권장(운영 사례 각주)
  - 출처: raw/troubleshoot/keystore and cpu usage.md, Java SE 17 KeyStore API, JCA Reference Guide, JEP 229
- **수정**: `wiki/index.md` Java 암호 섹션에 `[[keystore-java]]` 추가

---

## 2026-07-16 11:16:05

- **수정**: `wiki/dbms/sql-functions.md` — 날짜 연산(4), 문자열(5), 조건 분기(7) 절 추가, 기존 NULL 처리·순위 절 번호 재조정(6, 8), Sources 2건 추가
- **수정**: `wiki/index.md` `[[sql-functions]]` 설명에 추가 주제 반영

---

## 2026-07-16 11:07:55

- **생성**: `wiki/dbms/sql-functions.md` — RDBMS 공통 SQL 함수
  - 타입 변환(TO_CHAR/TO_DATE/CAST, 대상 타입), 현재 날짜·시간(SYSDATE/now()/NOW() 기준 시각 차이), NULL 처리(COALESCE/NULLIF/NVL/IFNULL), 순위 윈도우 함수(ROW_NUMBER/RANK/DENSE_RANK/NTILE)
  - 출처: Oracle SQL Language Reference, PostgreSQL Functions 문서, MySQL 함수 문서
- **수정**: `wiki/index.md` DBMS 섹션에 `[[sql-functions]]` 추가

---

## 2026-07-16 10:50:35

- **수정**: `wiki/dbms/optimizer-statistics.md` — 개요에 CBO 약자 병기·자동 수집 방식 요약 추가, autovacuum 설명 각주 추가, 5.1 괄호 예시를 하위 목록으로 변경, 트러블슈팅 케이스 추가(5.2 바인드 피킹·히스토그램 계획 급변, 5.3 자동 수집 제외 테이블), Sources 2건 추가

---

## 2026-07-16 10:38:49

- **수정**: `wiki/dbms/execution-plan.md` — "해석 공통 원칙" 섹션을 개요 본문 말미로 이동(섹션 번호 재조정), Oracle 확인 방법에 `sql_id` 설명 추가

---

## 2026-07-15 17:45:40

- **생성**: `wiki/dbms/execution-plan.md` — RDBMS 실행 계획
  - 기존 통합 문서에서 분리·확장. DBMS별(Oracle/PostgreSQL/MySQL) 확인 방법, 출력 항목(예상·실측 컬럼 표), 성능 확인 포인트(E-Rows vs A-Rows, Buffers, actual rows × loops, type·filtered·Extra 등) 상세화
  - 출처: Oracle SQL Tuning Guide(Generating/Reading Execution Plans), PostgreSQL Using EXPLAIN, MySQL EXPLAIN 문서
- **생성**: `wiki/dbms/optimizer-statistics.md` — RDBMS 옵티마이저 통계
  - 기존 통합 문서에서 분리·확장. DBMS별 수집(자동 수집 조건·임계), 저장·조회, 히스토그램(Oracle 4유형, PostgreSQL 확장 통계, MySQL 8.0 히스토그램), 트러블슈팅(낡은 통계) 이관
  - 출처: Oracle Optimizer Statistics Concepts·Histograms, PostgreSQL Planner Stats·ANALYZE, MySQL InnoDB Persistent Stats·ANALYZE TABLE
- **삭제**: `wiki/dbms/execution-plan-and-statistics.md` — 위 두 문서로 분리
- **수정**: `wiki/index.md` DBMS 섹션 항목 교체 (1건 → 2건)
- **수정**: `wiki/dbms/index-scan.md`, `wiki/dbms/oracle-hints.md`, `wiki/dbms/concurrency-control.md` — 본문·Related pages의 `[[execution-plan-and-statistics]]` 링크를 `[[execution-plan]]`/`[[optimizer-statistics]]`로 교체

---

## 2026-07-15 17:33:50

- **수정**: `wiki/dbms/index-scan.md` — 구조 개편 및 힌트 키워드 추가
  - §3 PostgreSQL, §4 MySQL을 Oracle처럼 스캔 유형별 하위 목차(3.1~3.3, 4.1~4.4)로 분리
  - 각 스캔 유형 항목에 `지정:` 줄로 힌트 키워드 기술 (Oracle INDEX/INDEX_ASC/INDEX_DESC/INDEX_FFS/INDEX_SS/INDEX_JOIN, PostgreSQL enable_* 파라미터·pg_hint_plan, MySQL USE/FORCE/IGNORE INDEX·옵티마이저 힌트, SQL Server WITH (INDEX)/FORCESEEK/FORCESCAN)
  - §7.1 용어 수정: 필터 강등 기준을 "선두" → "선행"으로 정정 (범위 조건이 중간 컬럼이어도 이후 컬럼은 필터로 강등)
  - 출처 추가: MySQL Index/Optimizer Hints, SQL Server Table Hints, PostgreSQL Planner Method Configuration, pg_hint_plan

---

## 2026-07-15 16:53:14

- **수정**: `wiki/dbms/index-scan.md` — `7. 주의사항` 절 신설
  - 7.1 복합 인덱스 컬럼 순서: 카디널리티 기준 통념 반박(등치 조건만이면 순서 무관), 실제 기준(선두 컬럼 요건, 등치→범위 순, 저카디널리티 선두의 skip scan·압축 이점)
  - 7.2 범위 조건과 액세스·필터 조건: 선행 컬럼 범위·LIKE 시 후행 컬럼 필터 강등과 성능 감소, LIKE 와일드카드 규칙
  - 7.3 IN-List: INLIST ITERATOR 값별 반복(UNION ALL 재작성 아님), 후행 컬럼 액세스 조건 유지, 대량 IN 값 시 수직 탐색 반복으로 성능 감소 가능, OR expansion과의 구분
  - 출처 추가: Richard Foote 블로그 2건, Use The Index Luke 2건, Oracle 문서(INLIST ITERATOR, OR Expansion)

---

## 2026-07-15 11:43:48

- **생성**: `wiki/dbms/index-scan.md` — RDBMS 인덱스 스캔
  - 개요(B-tree 구조, 2단계 동작, single/multiblock I/O), DBMS별 유형(Oracle: unique/range/full/fast full/skip/join scan + 비교표, PostgreSQL: index/index only/bitmap scan, MySQL: EXPLAIN type, SQL Server: seek/scan/lookup), 인덱스 스캔 vs 전체 테이블 스캔 선택 기준(선택도, 클러스터링 팩터, 커버링, 정렬)
  - 출처: Oracle SQL Tuning Guide(Access Paths, Statistics Concepts), PostgreSQL 공식 문서, Percona 블로그, MySQL EXPLAIN 문서, SQL Server Showplan 문서 (raw 소스 없음 — 웹 문서 기반)
- **수정**: `wiki/index.md` DBMS 섹션에 `[[index-scan]]` 추가

---

## 2026-07-09 08:52:49

- **생성**: `wiki/programming/first-class-citizen.md` — 일급 객체
  - 정의(Strachey 유래, Popplestone 4권리 — 인자/반환값/대입/동등성 검사), 일급 함수(MDN 3조건·콜백·고차 함수·JS 예시), 언어별 지원 표(완전 지원/C 함수 포인터/Java), Java의 우회(lambda = 함수형 인터페이스 인스턴스, java.util.function, 메서드 참조)
  - 출처: Wikipedia First-class citizen, MDN First-class Function, Oracle Java Tutorials Lambda Expressions (raw 소스 없음 — 웹 문서 기반)
- **수정**: `wiki/index.md` 프로그래밍 일반 섹션에 `[[first-class-citizen]]` 추가
- **수정**: `wiki/java/common/expression-vs-statement.md` Related pages에 `[[first-class-citizen]]` 역링크 추가

---

## 2026-07-08 13:14:15

- **수정**: `wiki/java/common/expression-vs-statement.md` 구조 재편
  - §1 개요(비교표) 삭제 — 표 내용(값 유무·JLS 장·동작)을 expression/statement 각 절 서두 문장으로 이동
  - 통합 코드 블록을 항목별 예시로 분리: expression은 denote 3종(변수/값/void) 불릿 아래에, statement는 종류별(block·선언·제어 흐름·제어 이동·기타) 불릿 아래에 각각 배치
  - 장 번호 재조정(1~4) 및 내부 참조 갱신(4장 → 3장)

---

## 2026-07-08 11:34:51

- **수정**: `wiki/java/common/expression-vs-statement.md` §2.1 구문 형태 — 문단을 목록으로 전환, 항목별 짧은 예시 병기(primary/단항/이항/삼항/대입/캐스트/lambda/switch expression)

---

## 2026-07-08 11:31:33

- **수정**: `wiki/java/common/expression-vs-statement.md` — §2·§3에 예시 코드 추가
  - §2 expression: denote 3종별 예시(변수 — 배열/필드 접근, 값 — 산술·비교·문자열 연결·메서드 호출·삼항·캐스트·배열 생성, void 호출)
  - §3 statement: 문 종류별 예시(선언·대입·if/while/for/switch·continue·return) + 문은 값 자리에 올 수 없음 명시

---

## 2026-07-08 10:50:28

- **수정**: 위키 전체 AGENTS.md 형식 준수 일괄 정리 (150개 파일)
  - 본문 `##`/`###` 제목에 번호 체계(`1. 개요`/`1.1. 상세`) 일괄 적용 — h2 미번호 96개·h3만 미번호 27개, 기존 번호 문서의 `### N.M` → `### N.M.` 마침표 통일 포함
  - 번호 상호 참조 24건(N장·N.M절) 전수 검증 — 어긋남 없음
  - 제목 설명형 괄호 정리 11개 파일: cmp-bouncycastle(4개 장 제목 — 방향·측은 `—`로, 요약은 본문 이동), certificate-revocation(RFC 인용 본문 이동), git-revisions·spock·jwt-java·openssl-crl/keygen/x509(구문·한정어 괄호 → `—`), java17/21-features(Oracle 기준 → `—`), aspectj(별칭 '바이너리 위빙' 본문 이동)
  - `wiki/index.md` updated의 `KST` 접미사 제거 (형식 `YYYY-MM-DD HH:MM:SS` 통일)

---

## 2026-07-08 10:02:57

- **생성**: `wiki/java/common/expression-vs-statement.md` — Java expression vs statement
  - 식(평가→결과)/문(실행→효과) 구분, denote 3종(변수/값/void), poly vs standalone, 문 종류, expression statement 허용 7형태(값 버리는 식은 컴파일 오류·C/C++과 차이), 혼동 지점(대입은 식·삼항 vs if·switch 문/식·yield·void 호출과 lambda body)
  - 출처: JLS SE21 Ch.14/Ch.15 (raw 소스 없음 — 웹 공식 문서 기반)
- **수정**: `wiki/index.md` Java 섹션에 `[[expression-vs-statement]]` 추가
- **수정**: `wiki/java/common/java17-features.md`·`wiki/java/common/java21-features.md` Related pages에 `[[expression-vs-statement]]` 역링크 추가

---

## 2026-07-07 15:52:18

- **수정**: `wiki/crypto/certificate-revocation.md` §1 개요 — CRL/OCSP 약자 풀이(영문 정식 명칭)만 남기고 괄호 내 한글 설명·§3/§4 참조 삭제, "별도로 조회한다" 뒤 괄호 링크(§6·Related와 중복) 삭제

---

## 2026-07-07 15:43:39

- **생성**: `wiki/crypto/certificate-revocation.md` — 인증서 폐기(CRL·OCSP)
  - 폐기 정보와 특성(CRLReason 사유·폐기 시각·불가역, CRL/OCSP 공통), 전달 방식 CRL(CertificateList X.509 구조·CRLDP·Delta·ARL), OCSP(CertID·good/revoked/unknown·AIA·Stapling·Must-Staple), CRL vs OCSP 비교, 실무 동향(Let's Encrypt OCSP 종료·soft-fail·CRLite)
  - 출처: RFC 5280/6960/6066/7633, Let's Encrypt
- **수정**: `wiki/index.md` Crypto 섹션에 `[[certificate-revocation]]` 추가
- **수정**: `wiki/crypto/x509-certificate.md`·`wiki/java/crypto/cert-path-validation.md`·`wiki/linux/security/openssl-crl.md` Related pages에 `[[certificate-revocation]]` 역링크 추가

---

## 2026-07-07 15:27:41

- **수정**: `wiki/java/crypto/cert-path-validation.md` — §4 도입부의 중간 인증서 위치 설명을 4.1(CertPath)·4.2(CertStore) 각 항목 본문으로 이동. 도입부에는 TrustAnchor 설명만 유지

---

## 2026-07-07 15:25:27

- **수정**: `wiki/java/crypto/cert-path-validation.md` §4 도입부 추가 — TrustAnchor는 신뢰 시작점(보통 루트, 자체 서명이 필수는 아님)만, 중간 인증서는 Validator=CertPath / Builder=CertStore 구분 명시

---

## 2026-07-07 13:57:41

- **수정**: `wiki/java/crypto/cert-path-validation.md`
  - §2 검증 대상 보강 — 서명 체인(개인키 서명→상위 공개키로 검증), 유효기간(기준 시각이 notBefore~notAfter 사이인지)
  - §4.3 폐기 정보 획득 경로 주석 추가 — OCSP는 AIA 자동 조회 / CRL·ARL은 CRLDP 자동 다운로드 안 함(CertStore 공급 또는 enableCRLDP 필요)

---

## 2026-07-07 13:49:16

- **수정**: `wiki/java/crypto/cert-path-validation.md` 구조 재편
  - §2 "무엇을 검증하나"→"검증 대상" 개명, 표→목록 형태
  - §4~7을 상위 항목 "수행 방법" 하위(4.1 Validator/4.2 Builder/4.3 폐기/4.4 BC 네이티브)로 묶음
  - 폐기(4.3)는 Validator(4.1)에 폐기 옵션을 더한 것임을 명시, CRL/OCSP 획득 실패 시 동작(기본 실패 vs SOFT_FAIL) 주석 추가

---

## 2026-07-07 13:42:19

- **생성**: `wiki/java/crypto/cert-path-validation.md` — BouncyCastle 인증서 경로 검증
  - 경로 검증 의미·검증 항목, CertPathValidator(경로 검증·setDate 기준시각), CertPathBuilder(경로 자동 구성), 폐기(CRL/OCSP·PKIXRevocationChecker·CertStore 인증서/CRL 혼합), BC 네이티브 path API, 주의사항
  - 출처: Java PKI Guide, BouncyCastle Javadoc, RFC 5280
- **수정**: `wiki/index.md` Java>암호 섹션에 `[[cert-path-validation]]` 추가
- **수정**: `wiki/crypto/x509-certificate.md` Related pages에 `[[cert-path-validation]]` 추가

---

## 2026-07-07 13:06:36

- **수정**: wiki-lint 깨진 링크 제거
  - `wiki/java/common/sbom-java.md` — 존재하지 않는 `[[cyclonedx-gradle-plugin]]` 링크 제거
  - `wiki/programming/cqrs.md` — 존재하지 않는 `[[event-sourcing]]` 링크 2곳(본문·Related) 제거
  - `wiki/linux/security/openssl-crl.md` — `[[openssl-ca]] (TBD)` 링크 제거 (실제 작성 시 다시 추가 예정)
- **수정**: `wiki/java/crypto/jwt-java.md` — 개요에 "많이 쓰이는 알고리즘: HS256/RS256/ES256/EdDSA" 한 줄로 정리(별도 하위 항목 없이, 상세는 [[jwt]] §5 링크), Sources RFC(7519/7515/7518/8037/8725) 실제 링크 추가 (서명 알고리즘 표는 jwt 문서 §5에 이미 존재해 추가 안 함)

---

## 2026-07-07 11:44:56

- **생성**: `wiki/java/crypto/jwt-java.md` — Java JWT 생성·검증 예시
  - JJWT/Nimbus/Auth0 3종 HS256·RS256 코드, 라이브러리 비교·장단점·선택 가이드, 검증 공통 주의(alg 고정·클레임·키 길이)
  - 출처: JJWT/Nimbus/Auth0 공식, RFC 7519/8725
- **수정**: `wiki/index.md` Java>암호 섹션에 `[[jwt-java]]` 추가
- **수정**: `wiki/web/jwt.md` Related pages에 `[[jwt-java]]` 추가

---

## 2026-07-07 11:29:35

- **생성**: `wiki/java/crypto/cmp-bouncycastle.md` — BouncyCastle CMP 구현 예시
  - 신규 카테고리 `wiki/java/crypto/` 생성
  - ir/ip 생성·파싱·POP 검증(EC 서명 POP, PBM 요청/CA 서명 응답), CRMF 조립, ProtectedPKIMessage 빌드·검증, 발급 인증서 추출, 주의사항
  - 출처: BouncyCastle bcpkix Javadoc, RFC 4210/4211/9810
- **수정**: `wiki/index.md` Java 섹션에 `### 암호 (crypto)` 하위 신설 + `[[cmp-bouncycastle]]` 추가
- **수정**: `wiki/crypto/cmp.md` Related pages에 `[[cmp-bouncycastle]]` 추가

---

## 2026-07-07 11:06:31

- **수정**: `wiki/crypto/cmp.md` §5.1 아래 "초기 신뢰 확립" 소절 추가 — PBM 공유 비밀 대역 외 배포 vs IDevID 서명, genm/genp로 부트스트랩 불가(닭-달걀)

---

## 2026-07-07 09:15:48

- **생성**: `wiki/crypto/cmp.md` — CMP(인증서 관리 프로토콜)
  - 개요(X.509 생명주기 관리)·RFC 체계(4210/9480/9483/9810 CMPv3·KEM/9811), 용도·목적(발급/갱신/폐기/복구/교차인증·POP·certConf)
  - 메시지 구조(PKIMessage: header/body/protection/extraCerts, PKIHeader 필드, PBM/서명 보호), 메시지 종류(PKIBody CHOICE 전체 표)
  - 예시(별도 항목): ir/ip 초기발급(시퀀스), cr 추가발급, kur 키갱신, rr 폐기, genm/genp 정보조회(InfoType: caCerts/rootCa/certReqTemplate/CRL)
  - 전송(HTTP/CoAP), 출처: RFC 4210/9480/9483/9810, Wikipedia
- **수정**: `wiki/index.md` Crypto 섹션에 `[[cmp]]` 추가
- **수정**: `wiki/crypto/x509-certificate.md` Related pages에 `[[cmp]]` 추가

---

## 2026-07-07 09:15:48

- **생성**: `wiki/web/load-balancer.md` — 로드 밸런서
  - 개요(목적: 부하 분산·HA·수평 확장), 동작 방식(헬스 체크·풀·시퀀스)
  - 세션 고정(sticky session): 세션 저장 위치 문제·알고리즘 override·L4 IP해시/L7 쿠키 구분·외부 저장소 대안
  - L4 vs L7 계층 비교, 분산 알고리즘(RR/가중RR/최소연결/IP해시/일관성해시/P2C), 장점, 배포 형태(HW/SW/클라우드/DNS), 인접 개념(프록시/게이트웨이/CDN)
  - 출처: Cloudflare, A10, NGINX, AWS ELB
- **수정**: `wiki/index.md` Web 섹션에 `[[load-balancer]]` 추가
- **수정**: `wiki/web/reverse-proxy.md` Related pages에 `[[load-balancer]]` 추가

---

## 2026-07-07 09:15:48

- **생성**: `wiki/web/ssr-vs-csr.md` — SSR vs CSR
  - 개요(렌더링 위치 차이), CSR(동작 시퀀스·장단점), SSR(동작 시퀀스·하이드레이션·두 종류·장단점)
  - 하이드레이션 상세: 필요성, hydrateRoot 코드 예시, 불일치(mismatch) 원인, 개선 기법(스트리밍/부분 하이드레이션/서버 컴포넌트)
  - 고전 SSR(Thymeleaf/JSP) vs 동형 SSR(Next.js/Nuxt), 차이점 표, SSG/ISR 스펙트럼, 대표 기술 스택
  - 출처: MDN, React hydrateRoot, Next.js hydration error, Vercel, Prismic
- **수정**: `wiki/index.md` Web 섹션에 `[[ssr-vs-csr]]` 추가

---

## 2026-07-02 15:16:16

- **생성**: `wiki/web/jwt.md` — JWT(JSON Web Token)
  - 개요(토큰 규격, 프로토콜 아님, OAuth와 관계), 구조(header.payload.signature·base64url은 인코딩), 클레임(registered/public/private)
  - JWS(서명·내용 노출) vs JWE(암호화), 서명 알고리즘(HS256 대칭 / RS256·ES256 비대칭)
  - 검증 절차(서명+exp/nbf+iss/aud), 보안(RFC 8725: alg:none·RS256→HS256 혼동·allowlist·클레임 검증·키 엔트로피·민감정보 금지)
  - 장단점(stateless vs 폐기 곤란·payload 노출)
  - 출처: RFC 7519/7515/7516/7518/8725, jwt.io
- **수정**: `wiki/index.md` Web 섹션에 `[[jwt]]` 추가
- **수정**: `oauth2` related의 `[[jwt]]` "작성 예정" 표기 해제·설명 갱신

---

## 2026-07-02 15:09:30

- **수정**: `wiki/web/oauth2.md` §8.2 JWT 상세 제거
  - JWT 구조·JWS/JWE·등록 클레임 등 상세 삭제(별도 [[jwt]] 문서 예정), 층위 차이 + 관계(opaque vs JWT 토큰·OIDC ID Token·OAuth 무관 사용)만 유지
  - 비교표 제거하고 관계 서술로 축약, related에 `[[jwt]]`(작성 예정) 추가

---

## 2026-07-02 15:08:41

- **수정**: `wiki/web/oauth2.md` §8·§9 통합
  - "## 8. 비교 — 관련 기술과의 구분"으로 합치고 §8.1 OAuth vs OIDC, §8.2 OAuth vs JWT로 하위 항목화(JWT의 기존 9.1/9.2는 bold 라벨로 평탄화)
  - 기존 §10 요약 → §9로 재번호, §1 개요의 앵커 참조(§8→§8.1, §9→§8.2) 갱신

---

## 2026-07-02 15:04:47

- **수정**: `wiki/web/oauth2.md` 구조 정리
  - §6.2 Java 예시 삭제(§6.1 code_verifier/challenge 설명·표·타임라인은 유지)
  - §5.2 토큰 저장 위치 → §7 보안 고려사항으로 이동
  - §7 heading을 "보안 고려사항"으로 변경하고 하위 항목 분리: §7.1 RFC 9700 Security BCP, §7.2 토큰 저장 위치
  - §7 앵커 참조(#7-보안-고려사항-rfc-9700 → #7-보안-고려사항) 갱신

---

## 2026-07-02 14:28:26

- **수정**: `wiki/web/oauth2.md` §6(PKCE) 보강
  - §6.1 code_verifier(난수 규격 43~128자)·code_challenge(파생 해시) 정의, 보유/전송 주체 표(클라이언트=verifier / AS=challenge), verifier는 토큰 요청 시 1회 전송·즉시 검증, 타임라인 도식
  - §6.2 Java 예시(SecureRandom 32바이트→base64url verifier, SHA-256 challenge)

---

## 2026-07-02 14:17:58

- **수정**: `wiki/web/oauth2.md` §5.2 "토큰 저장 위치" 신설
  - 클라이언트 타입별 저장(서버 사이드=서버 보관⭐ / SPA=localStorage·메모리·HttpOnly 쿠키 트레이드오프 / 네이티브=Keychain·Keystore)
  - XSS vs CSRF 트레이드오프, refresh_token 강보호
  - IETF OAuth 2.0 for Browser-Based Apps 3패턴(BFF⭐/Token-Mediating Backend/Browser-based OAuth Client)
  - 출처에 IETF Browser-Based Apps draft 추가

---

## 2026-07-02 13:32:56

- **수정**: `wiki/web/oauth2.md` — 토큰 갱신 내용 분리
  - §5 Authorization Code+PKCE 시퀀스에서 refresh(opt 블록) 제거
  - §5.1 "액세스 토큰 갱신(Refresh Token)" 신설: 별도 시퀀스 다이어그램 + 하단에 만료 감지(선제/반응)·갱신 상대(AS 토큰 엔드포인트)·사용자 무개입·Refresh Token Rotation·refresh 만료 시 재인증 정리

---

## 2026-07-02 08:59:23

- **생성**: `wiki/web/reverse-proxy.md` — 리버스 프록시
  - 개념, 포워드 프록시 vs 리버스 프록시(서버 대리 vs 클라이언트 대리) 비교표·다이어그램
  - 용도(로드밸런싱·TLS 종료·캐싱·보안 은닉·압축·라우팅·정적 서빙)
  - 동작·전달 헤더(X-Forwarded-For/Proto/Host·X-Real-IP) + mermaid 시퀀스
  - nginx 설정(proxy_pass·proxy_set_header·upstream 로드밸런싱·proxy_buffering)
  - 인접 개념 구분(LB·API 게이트웨이·CDN·포워드 프록시)
  - 출처: NGINX Admin Guide, Cloudflare, Kemp
- **수정**: `wiki/index.md` Web 섹션에 `[[reverse-proxy]]` 추가
- **수정**: `forward-headers-proxy`·`cors` related에 `[[reverse-proxy]]` 역링크 추가(forward-headers-proxy updated 갱신)

---

## 2026-07-02 08:54:13

- **생성**: `wiki/web/cors.md` — CORS(교차 출처 리소스 공유)
  - 개념(SOP 완화 opt-in)·origin(scheme+host+port), 왜 필요한가
  - 자주 하는 오해(서버 보호 아님·요청은 서버 도달·CSRF 아님·와일드카드·프론트로 못 고침)
  - §3.1 server-to-server에 CORS가 적용되지 않는 이유(강제 주체=브라우저/보호 대상=ambient 자격/origin 개념 부재)
  - 단순 vs 프리플라이트(mermaid 시퀀스), 요청/응답 헤더, credentials 규칙(와일드카드 불가)
  - 서버 설정: Spring(@CrossOrigin/addCorsMappings/CorsFilter/Security http.cors, allowedOriginPatterns)·nginx(add_header always·OPTIONS 204·if 컨텍스트 주의)
  - 출처: MDN CORS, Spring Framework CORS, Baeldung, enable-cors.org, getpagespeed
- **수정**: `wiki/index.md` Web 섹션에 `[[cors]]` 추가
- **수정**: `restful-api-design`·`oauth2` related에 `[[cors]]` 역링크 추가

---

## 2026-07-01 16:33:45

- **생성**: `wiki/web/oauth2.md` — OAuth 2.0
  - 개요(인가 프레임워크, 인증 아님), 4역할, 구성요소(클라이언트 타입·엔드포인트·토큰·scope/state/PKCE)
  - Grant Type(Authorization Code+PKCE⭐·Client Credentials·Device·Refresh, Implicit/Password 금지)
  - Authorization Code+PKCE 시퀀스 다이어그램(mermaid), PKCE(RFC 7636) 원리
  - 보안 고려사항(RFC 9700): PKCE 필수·redirect_uri 정확매칭·state/nonce·Implicit/Password 금지·토큰 URL 노출 금지·refresh 회전·mix-up/코드주입 방지
  - §8 OAuth vs OIDC, §9 OAuth vs JWT(토큰 규격 vs 프로토콜, opaque vs JWT 액세스토큰·RFC 9068, ID Token은 JWT)
  - 출처: RFC 6749/6750/7636/7519/9068/9700, oauth.net(grant-types/pkce/jwt)
- **수정**: `wiki/index.md` Web 섹션에 `[[oauth2]]` 추가
- **수정**: `restful-api-design` related에 `[[oauth2]]` 역링크 추가

---

## 2026-07-01 15:55:13

- **신규 카테고리**: `wiki/web/` 생성 (HTTP·REST·API 등 웹 주제)
- **생성**: `wiki/web/restful-api-design.md` — RESTful API 설계
  - REST 개요·6제약, Uniform Interface 4세부(자원식별·표현조작·Self-descriptive·HATEOAS)·"진짜 REST vs HTTP API"(Fielding/NHN)
  - HTTP 메서드·용도·Safe/Idempotent, POST/PUT/PATCH 차이·재시도 안전성(멱등키)
  - 요청 데이터 전달(path/query/body/header)·본문 인코딩(json/x-www-form-urlencoded/multipart)
  - 응답 상태코드·헤더(Location/ETag/Retry-After)·에러 포맷(RFC 9457 Problem Details)
  - URI 명명·설계 규칙(명사·복수·소문자·하이픈·중첩·확장자 배제)
  - 출처: MDN(methods/status/POST/content-negotiation), RFC 9110, NHN Cloud Meetup posts/92
- **수정**: `wiki/index.md`에 Web 섹션 신설 + `[[restful-api-design]]` 추가

---

## 2026-07-01 15:19:42

- **생성**: `wiki/java/test/mockito-doreturn-vs-when.md` — Mockito when().thenXxx() vs doXxx().when()
  - 두 구문 동작, when()의 호출 기록 원리, doXxx 계열(void/spy)
  - 차이: 스터빙 시 실제 메서드 호출(spy 부수효과)·타입 안전성(thenReturn vs doReturn Object)·void 지원·체이닝(OngoingStubbing<T> vs Stubber)
  - BDDMockito(given/will), 장단점·좋은 패턴, 요약
  - 근거: raw/java/test/Difference Between when() and doXxx()... (Baeldung), Mockito javadoc, sangsoonam
- **수정**: `wiki/index.md` Java>테스트에 `[[mockito-doreturn-vs-when]]` 추가
- **수정**: `test-double`·`java-testing-libraries` related에 역링크 추가

---

## 2026-07-01 11:46:26

- **생성**: `wiki/java/test/inverse-operation-testing.md` — 역연산 함수 테스트(복호화·역직렬화·디코딩·단방향 해시)
  - 문제 정의, 안티패턴(SUT 미러링 역함수 자작 = 자기충족·구조 결합)
  - 전략: Known Answer Test(독립 출처 고정 벡터)⭐·독립 구현 라운드트립·양방향 SUT 라운드트립(보완)·프로퍼티/메타모픽
  - 실제 사례 조사: BouncyCastle GCMTest(하드코딩 K/P/IV/C/T 벡터·암복호화 동시 검증), NIST CAVP(KAT vs Monte Carlo Test), Project Wycheproof(구현 비종속 JSON 벡터)
  - 실무 지침(벡터 불변·출처 명기·실패 경로), 요약
  - 출처: bcgit/bc-java GCMTest.java, NIST CAVP·CAVP FAQ, C2SP/wycheproof
- **수정**: `wiki/index.md` Java>테스트에 `[[inverse-operation-testing]]` 추가
- **수정**: `good-test-practices`·`test-double` related에 역링크 추가

---

## 2026-07-01 11:09:46

- **수정**: `wiki/java/test/good-test-practices.md` §4.3 신설 "Behavioral과 Structure-insensitive — 리팩터링 내성의 핵심" — 두 속성 정의, 2축 4분면 표, 각 속성을 해치는 요인, 동작 결합 예시(verify ❌ vs 최종 결과 ✅), 부수효과 예외. 기존 4.3 Solitary vs Sociable → 4.4로 재번호

---

## 2026-07-01 10:52:37

- **수정**: `wiki/java/test/good-test-practices.md` §2 안티패턴 A에 코드 예시 추가 — 출처와 다른 일반 예시(OrderService.calculateTotal 내부 applyDiscount/applyTax 중간 단계 검증 ❌ vs 최종 총액 검증 ✅)

---

## 2026-07-01 10:45:25

- **수정**: `wiki/java/test/good-test-practices.md`
  - §2 안티패턴 A/B에서 특정 예시(sumAmount/plusSum/minusSum, repository.update/saveOrUpdate) 제거 → 일반적 서술로 교체
  - §4.2 Test Desiderata(Kent Beck) 상세화: 12속성 표(의미+위반 증상), 맞물리는 쌍(Behavioral↔Structure-insensitive, Fast↔Predictive, Isolated↔Composable), FIRST와의 차이 설명

---

## 2026-07-01 10:33:04

- **생성**: `wiki/java/test/good-test-practices.md` — 좋은 테스트 코드 작성법
  - 원칙①: 내부 구현이 아닌 결과/행위 검증(안티패턴 A 상세구현 검증·B Mock 호출 검증, jojoldu 614)
  - 원칙②: 구조 Given-When-Then/AAA(Four-Phase Test, Fowler)
  - 원칙③: 속성 FIRST(R.C.Martin)·Test Desiderata 12(Kent Beck)·solitary vs sociable(Fowler)
  - 실무 체크리스트, 요약
  - 출처: jojoldu 614, Fowler UnitTest/GivenWhenThen, testdesiderata.com, Clean Code(FIRST)
- **수정**: `wiki/index.md` Java>테스트에 `[[good-test-practices]]` 추가
- **수정**: `test-double`·`java-testing-libraries` related에 `[[good-test-practices]]` 역링크 추가

---

## 2026-07-01 10:12:24

- **wiki-lint 수행**: 깨진 링크 점검
- **수정**: `wiki/java/test/junit-test-suite.md` 앵커 링크 2건 형식 오류 수정 — GitHub 슬러그(`#4-태그-필터링-tag`·`#43-태그-표현식`) → Obsidian 헤딩 텍스트(`#4. 태그 필터링 (@Tag)`·`#4.2 태그 표현식`)
- 미해결(대상 페이지 없음) 링크 3건 확인: `[[cyclonedx-gradle-plugin]]`(sbom-java), `[[event-sourcing]]`(cqrs), `[[openssl-ca]]`(openssl-crl, TBD 명시) — 향후 작성 대상으로 유지

---

## 2026-07-01 10:07:13

- **생성**: `wiki/java/test/test-double.md` — 테스트 더블(Mock/Stub/Spy 차이)
  - Meszaros 5종 분류(Dummy/Fake/Stub/Spy/Mock) 정의
  - 핵심 축: 상태 검증(Stub) vs 행위 검증(Mock) — Mock만 행위 검증 강제(Fowler)
  - 프레임워크 차이: Spock(Stub/Mock/Spy 명시 구분) vs Mockito(mock/spy만·stub은 when().thenReturn() 행위)
  - 실무 선택 기준, Mock 남용 주의(구현 결합)
  - 출처: Fowler "Mocks Aren't Stubs", Spock Reference, Mockito javadoc
- **수정**: `wiki/index.md` Java>테스트에 `[[test-double]]` 추가
- **수정**: `spock`·`java-testing-libraries` related에 `[[test-double]]` 역링크 추가

---

## 2026-07-03

**변경 사항** :
- `wiki/dbms/concurrency-control.md` 생성 — DBMS 동시성 제어와 일관성 전략. 3계층(정책/메커니즘/도구)으로 구성: 격리 수준(4단계·이상현상·수준별 장단점·구현 차이 InnoDB next-key/PostgreSQL SI·SSI/Oracle·격리↑→TPS↓ 트레이드오프), 메커니즘(비관적 락·2PL/낙관적 락·version/MVCC·장단점·비교표), SQL 명시적 잠금 도구(FOR UPDATE/FOR SHARE·LOCK IN SHARE MODE/NOWAIT/SKIP LOCKED/FOR UPDATE OF/LOCK TABLE/advisory lock — 각 동작·장단점), 선택 가이드. PostgreSQL(transaction-iso·explicit-locking)·MySQL(locking-reads·isolation-levels)·Oracle(data-concurrency) 공식 문서 검증·출처. `execution-plan-and-statistics`·`oracle-hints`·`jpa-transaction` 역링크(전 2개엔 backlink 추가) 및 index DBMS 섹션 추가.
- `wiki/dbms/` 전반 검토 후 수정 — `execution-plan-and-statistics.md`: 실행 계획 읽기 규칙 정정(동일 레벨 형제는 위→아래), ALLSTATS LAST 전제(STATISTICS_LEVEL=ALL 또는 GATHER_PLAN_STATISTICS) 추가, PostgreSQL EXPLAIN (ANALYZE, BUFFERS)·MySQL EXPLAIN ANALYZE 섹션 추가, 통계 내용을 수집 명령(PG ANALYZE/Oracle DBMS_STATS/MySQL ANALYZE TABLE) 중심으로 간소화(ANALYZE 상세 옵션·정밀도 튜닝·Real-time Statistics 제거), 존재하지 않는 raw 소스·LinkedIn 소스 제거 및 19c 공식 문서로 교체. `oracle-hints.md`: `--+` 힌트 "SQL*Plus/SQLcl 전용" 오류 정정, 11.2 구버전 소스를 19c로 교체. `concurrency-control.md`: 격리 수준 표 각주(*) 명시, Oracle SERIALIZABLE=Snapshot Isolation(Write Skew 가능) 보강, FOR UPDATE 차단 대상에 FOR SHARE 추가. index의 execution-plan 요약 갱신.
- `AGENTS.md` format 템플릿을 실제 위키 관례에 맞게 갱신 — YAML frontmatter(`title`/`updated`/`tags`, `#` 없는 태그), 섹션 순서 `## Sources` → `## Related pages`.
- 위키 전체를 AGENTS.md format 템플릿에 맞게 일괄 정리 — 소문자 섹션(`## related`/`## sources`) 사용 파일 25개(web 5·java/crypto 2·java/test 9·java/spring 9)를 `## Sources` → `## Related pages` 헤더·순서로 변환, 섹션 순서만 뒤집혀 있던 2개(`forward-headers-proxy.md`, `memory-troubleshooting.md`) 순서 교정. 내용 변경 없음(형식만). 대상 27개 파일 `updated` 갱신.
- `wiki/java/test/jmh.md` 생성 — JMH를 이용한 Java 마이크로벤치마크. 설정(Maven archetype/기존 프로젝트 의존성·annotationProcessorPaths, Gradle me.champeau.jmh 플러그인), 주요 어노테이션 상세(@Benchmark/@BenchmarkMode 4모드/@OutputTimeUnit/@State 3스코프/@Setup·@TearDown Level별/@Param/@Fork/@Warmup·@Measurement/@Threads/기타 @OperationsPerInvocation·@CompilerControl·@Group·Blackhole), 최소 실행 예시, 결과 해석(Score±Error 99.9% CI·Cnt·판단 기준), 흔한 함정(데드 코드 제거·상수 폴딩·수동 루프·fork 생략). OpenJDK JMH 공식 GitHub·JMH Samples·jmh-gradle-plugin·Baeldung 출처. `java-testing-libraries`에 역링크 2곳 추가, index Java 테스트 섹션에 항목 추가.
- `wiki/java/test/jmh.md` 수정 — AGENTS.md 신규 rule(제목/소제목 단순화, `()`는 축약어 전용) 적용: 소제목의 설명형 괄호 제거(`Maven — 신규 프로젝트`·`Gradle`·`흔한 함정`, 부가 설명은 본문으로 이동), 어노테이션 소제목에서 사용 문법 제거(`@BenchmarkMode`/`@OutputTimeUnit`/`@State`/`@Param`/`@Fork`/`@Threads` — 문법·기본값은 본문에 반영). 내용 변경 없음.
- `wiki/java/test/jacoco.md` 수정 — 설정 섹션 재구조화: `4. 설정 — Maven`/`5. 설정 — Gradle` 대분류 2개를 `4. 설정` 하위의 `4.1 Maven`/`4.2 Gradle`로 통합(이후 섹션 번호 재조정: 사용 방법 6→5, 요약 7→6). `5.3 최소 커버리지 기준` 신설 — Google Testing Blog(60% acceptable/75% commendable/90% exemplary)·SonarQube 기본 Quality Gate(신규 코드 80%)·수치 목표 강제의 부작용 경고, 출처 3건(Google Testing Blog·SonarQube Quality Gates·Fowler TestCoverage) 추가. index 요약 갱신.
- `wiki/java/test/jacoco.md` 수정 — 제목/소제목 rule 적용: title 괄호 설명 삭제(`JaCoCo — Java 테스트 커버리지 측정`), 소제목 `2.1 기본 - On-the-fly 계측`/`2.2 대안 - Offline 계측` 형식으로 변경. 내용 변경 없음.
- 위키 전체 제목/소제목 rule(단순한 제목, `()`는 축약어 전용) 일괄 적용 — 56개 파일 103건 수정. frontmatter title 7건(cors·java-testing-libraries·inverse-operation-testing·test-double·spock·cpu-usage-troubleshooting·vim-05-practical: 열거·설명 괄호 삭제 또는 `—` 형식 전환), 헤딩 96건: 설명·라벨·열거·버전 괄호 삭제(본문이 이미 설명하는 경우) 또는 본문 한 줄로 이동(docker ps/logs·Exec Form·버퍼링 제어·excel XSSF/SXSSF·cdxgen·mybatis·spring-redis 파이프라이닝·hikari 방법4·@Pointcut·jpa-composite-key·externalized-configuration·cqrs·vim·git --mixed·@FieldSource 5.11·-Xlog Java9·모듈 시스템 등), 라벨 접두 형식 전환(`4.5 대안 - Java 21+ 표준 KEM API`, `권장 - Ed25519`). 용어 병기(`도커(Docker)`, `Propagation (전파 속성)`)·축약어(`(VM)`, `(FIPS 203)`, `(JEP 444)`)·플래그(`(-u)`, `(-Xlog)`)는 허용 범주로 유지. 수정 파일 전부 `updated` 갱신.
- `wiki/java/test/jacoco.md` 수정 — 4.2 Gradle에 태스크 설정 상세 추가: 공통 설정(JacocoReportBase — executionData/classDirectories/sourceDirectories/additionalClassDirs·additionalSourceDirs/sourceSets), jacocoTestReport(reports의 required/outputLocation), jacocoTestCoverageVerification(violationRules > rule > limit 계층 — failOnViolation, rule의 enabled/element 5종/includes·excludes, limit의 counter 6종/value 5종/minimum·maximum과 기본값·의미·예시). Gradle DSL/Javadoc 공식 문서 4건으로 검증·출처 추가.
- `wiki/java/test/junit-parameterized-test.md` 수정 — 6장 플레이스홀더를 상세 목록으로 재작성({displayName}/{index}/{arguments}/{argumentsWithNames}/{argumentSetName}/{argumentSetNameOrArgumentsWithNames}/{0}·{1} + 기본 패턴·displayname.default 설정·MessageFormat 이스케이프 규칙), 3.8에 ArgumentsProvider 설명 보강(역할·재사용·구현 제약·ExtensionContext), 3.9 커스텀 소스 어노테이션 신설(@ArgumentsSource 메타 어노테이션 합성 + AnnotationBasedArgumentsProvider 속성 수신, IntRange 예시, 5.10 이전 AnnotationConsumer 방식 언급).
- `wiki/java/common/java-process-analysis-tools.md` 전면 개정 — 자주 쓰는 도구(jps/top -H/jstat/jstack/jmap/jcmd) 중심으로 재구성: jinfo 상세 삭제(jcmd 대체 언급), JFR·async-profiler는 3.7 심층 프로파일링으로 압축. 각 도구에 방식/대상·용도·장단점 + 주요 옵션·예시(명령·샘플 출력·해석) 추가. jps(-l/-m/-v/-q)·jstack(-l/-F, 스레드 상태 해석, 데드락 리포트)·jmap(-histo/-dump/jhsdb, MAT, HeapDumpOnOutOfMemoryError) 상세를 본문에 통합. 한글 출처 3건(voidmainvoid·honeymon·homoefficio) + jps/jstack/jmap 공식 man 페이지·dev.java 추가.
- `wiki/java/common/jps.md`, `jstack.md`, `jmap.md` 삭제 — 상세 내용을 java-process-analysis-tools에 통합. 역링크 정리: index 항목 3건 삭제·java-process-analysis-tools 요약 갱신, cpu-usage-troubleshooting(인라인 참조·related), jvm-options(related)에서 링크 제거.
- `wiki/java/common/java-process-analysis-tools.md` 수정 — '한눈에 비교' 섹션을 '도구별 상세' 뒤로 이동(2↔3 번호 교체, 2.1~2.7 재번호, 내부 참조 3.7→2.7). 내용 변경 없음.
- 2026-07-06 `wiki/java/common/java17-features.md` 수정 — 개요에 정식 릴리즈일(2021-09-14)·LTS 지원기간(Oracle Premier ~2026.09/Extended ~2029.09·NFTC 종료) 추가. Records/Text Blocks/Switch Expressions를 예시 코드 + 목적/선언/이점/제약 형식으로 확장(2.1 Sealed Classes 스타일 통일). Sources에 JDK 17 프로젝트·Oracle 로드맵 추가.
- 2026-07-06 `wiki/java/common/java21-features.md` 수정 — 개요에 정식 릴리즈일(2023-09-19)·LTS 지원기간(Oracle Premier ~2028.09/Extended ~2031.09·NFTC ~2026.09) 추가. Virtual Threads/Sequenced Collections/Pattern Matching/Generational ZGC를 예시 코드 + 목적/선언/이점/제약 형식으로 확장. Sources에 JDK 21 프로젝트·Oracle 로드맵 추가.
- 2026-07-06 `wiki/java/common/gc.md` 생성 — GC 종류별(Serial/Parallel/CMS/G1/ZGC/Shenandoah/Epsilon) 동작·장단점·지원 JDK(도입/deprecated/제거)·지정 옵션 정리 및 선택 가이드. CMS(JDK9 deprecated·JDK14 제거), G1(JDK9 기본), ZGC(JDK11 exp·JDK15 정식·세대별 JDK21/기본 JDK23/비세대 제거 JDK24), Shenandoah(JDK12 exp·JDK15 정식), Epsilon(JDK11 exp) 이력을 JEP 출처와 함께 기록. index.md 항목 추가, jvm-options에 상호 링크(GC 선택 절·related). 출처: OpenJDK JEP 248/291/318/333/363/377/379/439/474/490, JDK21 GC Tuning Guide.
- 2026-07-06 `wiki/java/common/gc.md` 수정 — 제목을 Garbage Collector (GC)로 변경. 4장 '용어' 신설: concurrent marking(병행 마킹·barrier 오버헤드), compaction(단편화 해소, GC별 방식 비교), colored pointer(ZGC 포인터 비트 메타데이터), load barrier(참조 읽기 검사·self-healing) 설명 추가. 1장에 4장 참조 문구 추가.
- 2026-07-06 `wiki/java/spring/mybatis.md` 수정 — 목차 재구성: '비교와 장단점'을 2장에서 마지막(6장)으로 이동. 기존 5~8·10장(Mapper 작성/결과값 객체 매핑/Auto-Increment 키 반환/Dynamic SQL/Stored Procedure)을 4장 'SQL 작성과 매핑'의 하위 항목(4.1~4.5)으로 통합. 트랜잭션 관리는 5장으로 재번호. 내부 장 번호 참조(3장·5장) 갱신. 내용 변경 없음.
- 2026-07-06 `wiki/java/spring/mybatis.md` 수정 — ① mybatis.configuration.*/config-location 동시 지정 시 동작 명확화: 우선순위가 아니라 상호 배타로 기동 실패(SqlSessionFactoryBean 예외) 명시. ② Spring(비 Boot) 수동 통합 Java Config 예시 추가(@MapperScan, DataSource/SqlSessionFactoryBean/DataSourceTransactionManager 빈 등록, mapperLocations·typeAliasesPackage). ③ mappers 등록 예시 패키지를 org.mybatis.mapper → com.example.mapper로 통일.
- 2026-07-06 `wiki/java/spring/mybatis.md` 수정 — Spring 수동 통합 예시에 SqlSessionTemplate 빈 추가(선택 표시) 및 설명 보강: 생략 시 MapperFactoryBean이 SqlSessionFactory로 자동 생성(둘 다 있으면 template 우선), 명시 등록이 필요한 경우(ExecutorType.BATCH, 멀티 DataSource sqlSessionTemplateRef, DAO 직접 주입). Sources에 mybatis-spring sqlsession/mappers 공식 문서 추가.
- 2026-07-06 `wiki/java/common/logging-frameworks.md` 생성 — Logback vs Log4j2 비교: SLF4J+구현체 구조(Bridge 패턴 연결), Log4j2 우위(LMAX Disruptor Async Logger 처리량·지연, garbage-free 모드, 람다 지연 평가, 설정 리로드·형식), Logback 우위(Spring Boot 기본, SLF4J 네이티브, logback-access·prudent mode·조건부 설정, Log4Shell 무관), 성능 요약표, 선택 기준(추론 표시). index.md 항목 추가, design-patterns-structural related에 역링크. 출처: Log4j 공식 async/garbagefree 매뉴얼, Logback 매뉴얼, Spring Boot Logging, CVE-2021-44228.
- 2026-07-06 `wiki/java/spring/logback.md` 생성 — Logback Spring Boot 설정: 기본 구현체 개요, logging.* 프로퍼티(레벨/파일/패턴/rollingpolicy), logback-spring.xml 권장 이유(-spring 접미사와 Spring 확장 태그), springProfile/springProperty, Console·RollingFile(SizeAndTimeBased)·AsyncAppender 예시, Boot 기본 include 재사용, 주의사항(AsyncAppender 이벤트 유실·prudent mode).
- 2026-07-06 `wiki/java/spring/log4j2.md` 생성 — Log4j2 Spring Boot 설정: 의존성 교체(Maven exclusion/Gradle 전역 exclude·module replacement), log4j2-spring.xml 권장, 설정 형식(JSON/YAML 의존성), Spring Boot 2.6+ 확장(SpringProfile arbiter·spring: lookup), Async Logger 활성화(Disruptor·contextSelector·AsyncLogger 혼합), 주의사항(Log4Shell 버전 관리·바인딩 충돌). index.md Spring 섹션에 두 항목 추가, logging-frameworks related에 역링크.
- 2026-07-06 `wiki/java/spring/logback.md` 수정 — 4장 'Appender 종류와 주요 프로퍼티' 신설(주의사항 5장으로 재번호): appender 8종 표(Console/File/RollingFile/Async/SMTP/DB/Socket/Sifting), 공통·파일 프로퍼티(target/file/append/immediateFlush/prudent), 롤링 정책 3종(TimeBased %d 패턴이 주기 결정, SizeAndTimeBased, FixedWindow)과 프로퍼티(fileNamePattern 압축/maxHistory/maxFileSize/totalSizeCap/cleanHistoryOnStart), AsyncAppender 프로퍼티(queueSize/discardingThreshold/neverBlock/includeCallerData/maxFlushTime). Sources에 Appenders 매뉴얼 추가.
- 2026-07-06 `wiki/java/spring/log4j2.md` 수정 — 4장 'Appender 종류와 주요 프로퍼티' 신설(Async Logger 5장·주의사항 6장 재번호): appender 10종 표(RollingRandomAccessFile/Failover/Routing 포함), 공통·파일 프로퍼티, TriggeringPolicy 4종(TimeBased interval·modulate, SizeBased, Cron, OnStartup)·복수 지정 시 OR 동작, DefaultRolloverStrategy max·Delete 액션 예시(IfLastModified), Logback과 달리 maxHistory 없음 명시, Async appender 프로퍼티(bufferSize/blocking). Sources에 Appenders 매뉴얼 추가.
- 2026-07-06 `wiki/java/spring/logback.md` 수정 — 4장을 3개 장으로 분리: 4장 'Appender 종류'(appender별 상세 서브섹션 — Console withJansi, File prudent, RollingFile의 rollingPolicy/triggeringPolicy 역할 구분, SMTP CyclicBuffer 발송 구조, DB 3테이블, Socket 재연결, Sifting discriminator 예시), 5장 '롤링 정책', 6장 '비동기'(AsyncAppender), 주의사항 7장으로 재번호.
- 2026-07-06 `wiki/java/spring/log4j2.md` 수정 — 4장을 3개 장으로 분리: 4장 'Appender 종류'(appender별 상세 — Console follow/direct, File locking, RollingRandomAccessFile ByteBuffer, Failover retryInterval 예시, Routing Routes/Route/IdlePurgePolicy 예시, SMTP 버퍼 발송, JDBC ColumnMapping·배치, Socket/Kafka/HTTP 표), 5장 '롤링 정책', 6장 '비동기'(Async Logger 이름 변경·Async Appender 통합, ArrayBlockingQueue 대비 구분), 주의사항 7장으로 재번호.
- 2026-07-06 `wiki/java/spring/logback.md`, `log4j2.md` 수정 — 4장 Appender 종류에 항목별 간략 예시 추가: Console(양쪽), File 계열은 대표 구성인 RollingFile 예시(일 단위+10MB 롤링, 양쪽), SMTP(양쪽). JDBC(DB)·Socket/Kafka/HTTP는 예시 생략. Failover·Routing·Sifting은 기존 예시 유지.
- 2026-07-06 `wiki/crypto/` 디렉터리 생성 — `wiki/java/crypto/`의 ml-kem.md·ml-dsa.md를 이동하고 기존 폴더 삭제(crypto는 Java 한정 주제가 아니라 판단). index.md의 '### crypto'(Java 하위)를 최상위 '## Crypto' 섹션으로 이동.
- 2026-07-06 `wiki/crypto/kdf.md` 생성 — KDF: 목적(키 스트레칭 vs 키 확장), 알고리즘 5종(Argon2id/scrypt/bcrypt/PBKDF2/HKDF) 동작·OWASP 권장 파라미터(19MiB·2^17·cost10·600k), Java 예시(PBKDF2 JCA·Argon2id Spring Security·HKDF JDK25 javax.crypto.KDF/JEP510), 보안 고려사항(salt·비용 상향 재해시·pepper·HKDF 오용 금지·DoS 트레이드오프-cpu-usage-troubleshooting 연결·상수 시간 비교), 선택 가이드. index Crypto 섹션 등록, ml-kem related에 역링크. 출처: OWASP Password Storage, RFC 9106/5869/2898, JEP 510.
- 2026-07-06 `wiki/crypto/cms.md` 생성 — CMS 메시지 규격 정리: 개요·주요 기능, PKCS#7→RFC 5652 계보(RFC 3852 보완), 콘텐츠 타입 7종 표(+대표 사용처), 구조 상세(raw/crypto/CMS.md 기반 SignedData·SignerInfo·EnvelopedData ASN.1+필드 설명, Detached 서명-PDF·코드서명, certs-only .p7b, EncryptedData-PKCS#12, 중첩으로 SignedAndEnvelopedData 대체 정정), RecipientInfo 6종(KEMRecipientInfo RFC 9629·RSA-KEM 9690·ML-KEM 9936), 알고리즘 규격(3370/5754/8419/5084/8933), 상위 규격(S/MIME v4.0 8551·TSP 3161·CAdES 5126). Related는 openssl 계열 4건(jwt·ml-kem·kdf 제외 — 사용자 지정). index Crypto 섹션 등록, openssl-cms related에 역링크. 출처: raw/crypto/CMS.md + RFC 5652/5083/9629/8551/3161.
- 2026-07-06 `wiki/crypto/x509.md` 생성 — X.509 인증서(raw/crypto/X.509.md + RFC 5280 기반): 개요(구조 정의+인증체계, RFC 5280 프로파일), Certificate/TBSCertificate ASN.1 구조·필드(subject=피발급자 — raw 원문 수정 반영), Extensions 상세(SKI SHA-1 생성·AKI 매칭 체인 조립, Key Usage 9비트 표, Basic Constraints cA·pathLenConstraint, EKU OID 7종 목록, SAN 현대 TLS 필수), 파일 형식 표(PEM/DER/CER·CRT/p7b/p12), 서명 검증 3단계(RSA 관례 표현 주석)·경로 검증 요소, 인증서 체인 3계층·검증 순서, 폐기(CRL/OCSP/OCSP Stapling), 사용 사례. index Crypto 섹션 등록, openssl-x509·cms에 역링크. raw의 Subject 항목은 사용자가 '피발급자'로 사전 수정 확인(에이전트 수정 없음). ASN.1(raw/crypto/ANS.1.md)은 별도 페이지 후보로 보류.
- 2026-07-06 `wiki/crypto/x509.md` 수정 — 2.3 '주요 알고리즘' 신설: 공개키 알고리즘 표(RSA/EC/Ed25519·448/DSA deprecated/ML-DSA — OID·권장 크기·비고), 서명 알고리즘 표(sha256WithRSA 계열/RSASSA-PSS/ecdsa-with-SHA2/Ed25519/ML-DSA/md5·sha1WithRSA 금지), 서명 알고리즘은 발급 CA 키가 결정한다는 주의. Related에 ml-dsa 추가, index 요약 갱신.
- 2026-07-06 crypto 용어 통일 — '후양자'를 원문 'post-quantum'으로 전체 치환: wiki/crypto(x509·cms·ml-kem·ml-dsa) 및 이를 참조하는 페이지(inverse-operation-testing, openssl-x509·overview·keygen)와 index.md. 내용 변경 없음(용어만).
- 2026-07-06 crypto 용어 재조정 — 'post-quantum'을 약어 'PQC'로 통일(각 문서 첫 언급은 PQC(Post-Quantum Cryptography)로 확장): x509·cms·ml-kem·ml-dsa 및 참조 페이지 4건·index. '격자 기반 post-quantum X' 패턴은 ml-kem·ml-dsa 제목/본문에서 '격자 기반 X'로 단순화, index·openssl 역링크 설명은 '격자 기반 PQC X'로 압축. 내용 변경 없음(용어만).
- 2026-07-06 `wiki/crypto/x509.md` 수정 — 제목 변경: 'X.509 인증서' → 'X.509 Certificate — PKI 인증서 구조·검증·체인·폐기'. 내용 변경 없음.
- 2026-07-06 `wiki/crypto/x509.md` → `x509-certificate.md` 파일명 변경 — 직전 제목 변경은 파일명 요청의 오해로 원복(title: X.509 인증서). 인바운드 링크 3건([[x509]] → [[x509-certificate]]: index·cms·openssl-x509) 갱신.
- 2026-07-06 `logs/lint/report-20260706.md` 생성 — wiki/crypto 5개 문서 lint 결과 저장: broken links 0건(위키링크 14종·웹 링크 27개 전부 유효, HEAD 오탐 9건 GET 재검증), conflicts 0건(raw CMS·X.509 대비 의도된 정정 2건은 근거 기록).
- 2026-07-06 `wiki/web/session-vs-cookie.md` 생성 — Session vs Cookie(MDN 기반): HTTP stateless 배경·상호 관계(세션 ID를 쿠키로 운반), Cookie(Set-Cookie 동작·4KB·persistent/세션 쿠키·변조 가능성), Session(서버 저장·세션 스토어 공유·즉시 무효화·jwt stateless 대안 연결), 차이 중심 비교표 7항목, Set-Cookie 보안 속성 표(HttpOnly/Secure/SameSite Strict·Lax·None/Domain·Path/Expires/__Host-·__Secure- 접두사)와 세션 쿠키 권장 조합. index Web 섹션 등록, jwt related에 역링크. 출처: MDN 3건.
- 2026-07-06 `wiki/web/cookie.md` 생성 — Cookie 단독 문서: Set-Cookie/Cookie 동작 예시, 주요 특징(자동 첨부·4KB·persistent/session cookie·클라이언트 소유 신뢰 불가·1st/3rd party), 저장 용도 표(세션 관리/개인화/트래킹/임시 상태 + 민감 정보 금지), 보안 속성 표(session-vs-cookie에서 이동), 취약점·공격 표(XSS 세션 하이재킹/CSRF/MITM 스니핑/session fixation/cookie tossing/쿠키 변조 — 원리·완화). session-vs-cookie 5장은 cookie로 위임하는 요약으로 교체, related·index·cors 역링크 갱신.
- 2026-07-06 `wiki/web/cookie.md` 수정 — 2장 주요 특징에 'name=value 형식' 항목 추가: = 없는 값만 설정 시 RFC 6265(전체 무시) vs RFC 6265bis·최신 브라우저(빈 이름 쿠키, 서버 생성 MUST NOT) 차이, 실무 권고(항상 name=value — Safari 불일치·프레임워크 비호환·__Host- 혼동). Sources에 RFC 6265·6265bis 추가.
- 2026-07-06 `wiki/web/web-storage.md` 생성 — Web Storage 3종(localStorage/sessionStorage/IndexedDB) 비교: 개요(origin 격리, 쿠키와 달리 요청 자동 첨부 안 됨), 각 저장소 수명·범위·용량·API·저장 타입 + 사용 예시(setItem/getItem, IndexedDB open/onupgradeneeded/transaction), 비교표, 용도 선택표, 보안 주의(HttpOnly 부재·XSS 전량 탈취·토큰 저장 지양). index Web 섹션 등록, cookie·session-vs-cookie related에 역링크. 출처: MDN Web Storage/IndexedDB/Storage API.
- 2026-07-06 `wiki/web/web-storage.md` 수정 — 7장 '데이터 삭제·수명' 신설(보안 고려사항 앞): 캐시(cached images) vs 쿠키·사이트 데이터 별개 항목, 삭제 동작표(캐시만 삭제 시 3종 유지 / 사이트 데이터 삭제 시 3종 삭제 / 탭 닫기 / eviction), navigator.storage.persist() 자동 축출 보호·수동 삭제 불가, Clear-Site-Data 헤더. 기존 '보안 주의' → '보안 고려사항'(8장)으로 개명·삭제 취약성 항목 추가. Sources에 Clear-Site-Data 추가.
- 2026-07-06 `wiki/web/web-storage.md` 수정 — 8장 보안 고려사항 정정: '인증 토큰·세션 ID·민감 정보는 HttpOnly 쿠키가 안전' 서술이 부정확 → 토큰·세션 ID(HttpOnly 쿠키 권장)와 민감 정보(클라이언트 저장 자체 지양, 쿠키도 대안 아님·서버 측 보관+불투명 식별자)를 분리 서술.
- 2026-07-09 `wiki/java/spring/bean-registration-control.md` 생성 — 설정 기반 동적 빈 등록 제어: 빈 정의 등록 단계 원리(ConfigurationClassPostProcessor·@Import 대상 Aware 콜백 4종·생성자 주입), 방법별 예시·장점·한계(@Conditional 계열 우선 설명 후 @ComponentScan `${...}` 플레이스홀더/ImportSelector·DeferredImportSelector/ImportBeanDefinitionRegistrar/BeanDefinitionRegistryPostProcessor/ApplicationContextInitializer/BeanRegistrar(Spring 7)/커스텀 자동 구성 모듈), 선택 기준표. index Spring 섹션 등록, externalized-configuration·configuration-properties·mybatis related에 역링크. 출처: Spring Framework/Boot 공식 문서 7건.
- 2026-07-09 `wiki/java/spring/enable-annotations.md` 생성 — @Enable 계열 어노테이션: 개요(opt-in 인프라 스위치·사용 시점), @Import 메타 어노테이션 원리(Configuration/ImportSelector/Registrar 3유형·AdviceMode 패턴·Configurer 패턴), 대표 9종 일람표·어노테이션별 예시 코드, 커스텀 @EnableXxx 작성, 주의사항(@EnableWebMvc 부트 자동 구성 비활성화·단일 선언, @SpringBootApplication의 @EnableAutoConfiguration 포함, @EnableCaching CacheManager 필수, @EnableAspectJAutoProxy 로컬 컨텍스트). index Spring 섹션 등록, bean-registration-control·configuration-properties·spring-aop·jpa-transaction·multi-datasource related에 역링크. 출처: Spring Framework/Boot/Data JPA 공식 문서 11건.
- 2026-07-10 `wiki/java/spring/jpa-entity-lifecycle.md` 수정 — 구조 재편(내용 변경 없음): 2~4장(콜백 어노테이션/메서드 규칙/엔티티 내부 콜백)을 '2. 라이프사이클 콜백' 하위 2.1~2.3으로 통합, '외부 EntityListener 클래스'를 '3. EntityListener'로 개명, Auditing(4장) 설정을 '4.1. 의존성·설정'으로 바꾸고 Gradle 의존성 추가, Envers(5장)를 Maven→Gradle 전환 후 4장과 같은 구조(5.1 의존성/5.2 엔티티/5.3 히스토리 조회)로 재편, 비교표는 6장으로 재번호.
- 2026-07-10 `wiki/java/spring/jpa-entity-lifecycle.md` 수정 — 5장 Envers 보강(Hibernate User Guide 기반): 5.1 의존성·설정(integrator 자동 등록으로 @Enable류 설정 불필요, org.hibernate.envers.* 프로퍼티 표 7종, ddl-auto 의존·마이그레이션 도구 시 직접 DDL 주의), 5.3 생성 테이블 신설({table}_AUD 컬럼 표: 복합 PK·REV·REVTYPE 0/1/2·store_data_at_delete·REVEND, REVINFO 컬럼 표, @RevisionEntity 커스텀), 5.4 히스토리 조회 확장(find/getRevisions/forRevisionsOfEntity 파라미터·반환값 설명, Object[3] 언패킹 예시, AuditEntity 조건). Sources에 Hibernate User Guide 추가.
- 2026-07-10 `wiki/java/spring/jpa-entity-lifecycle.md` 수정 — 2.2 'Post 계열 호출 시점' 신설(기존 한 줄 노트 대체, 기존 2.2~2.3은 2.3~2.4로 재번호): Pre persist/remove는 연산의 일부로 동기 호출, Post 계열은 DML 실행 직후 호출이며 write-behind로 DML 시점이 3가지(연산 직후—Hibernate IDENTITY 즉시 INSERT/flush/커밋 직전 암묵적 flush)로 갈림, 커밋 시점도 커밋 완료 전이라 롤백 가능·콜백 예외 시 롤백·AFTER_COMMIT은 @TransactionalEventListener, persist 후 수정·수정 후 삭제 시 Update 콜백 호출은 구현 의존. Sources: Baeldung 웹 링크를 raw 파일로 교체, Jakarta Persistence 3.1 §3.5.3·Spring Transaction-bound Events 추가.
- 2026-07-10 `wiki/java/spring/` 파일명 정리 — spring- 접두사 제거 11건(spring-aop→aop, spring-batch→batch, spring-batch-chunk 등 batch 하위 8건, spring-redis→redis). 인바운드 위키링크 [[spring-X]]→[[X]] 22개 파일 치환(index·batch 상호 링크·aspectj·enable-annotations·querydsl·mybatis·jpa-transaction·excel·java-testing-libraries·session-vs-cookie·programming 4건 등). 내용 변경 없음(파일명·링크만).
- 2026-07-10 `wiki/java/spring/entity-listener-di.md` 생성 — EntityListener 의존성 주입: 생성 구조(JPA 프로바이더 생성, Hibernate 5.3+ BeanContainer SPI·Spring 5.1+ SpringBeanContainer·Boot 자동 설정), 주입 실패 원인(EMF 부트스트랩 시점에 인스턴스 생성·의존 빈 미준비 시 리플렉션 fallback(DEBUG 로그만)·인스턴스 캐시, AuditingEntityListener가 동작하는 이유), 출처 간 관점 차이 명시(javadoc 지원 기술 vs 기사 실패 보고), 대안(이벤트 발행+@TransactionalEventListener(AFTER_COMMIT) 권장·static 필드 주입 비권장). index Spring 섹션 등록. 출처: Medium 기사·Hibernate User Guide §25·SpringBeanContainer javadoc/소스·HibernateJpaConfiguration 소스.
- 2026-07-10 `wiki/java/spring/jpa-entity-lifecycle.md` 수정 — 3장 DI 인용 블록("Hibernate가 BeanFactory를 통해 빈을 조회") 삭제: 부정확한 서술(실제는 BeanContainer SPI 경유·타이밍에 따라 실패 가능)이며 상세를 [[entity-listener-di]]로 분리, 링크 한 줄로 대체. Related pages에 entity-listener-di 추가.
- 2026-07-10 `wiki/java/spring/entity-listener-di.md` 수정 — 3장 '출처 간 관점 차이' 인용의 Spring javadoc·참조 기사·fallback 로직 언급에 인라인 링크 추가(괄호 형식, Sources와 동일 URL).
- 2026-07-10 `wiki/java/spring/entity-listener-di.md` 수정 — 3장 인용에서 fallback 로직 근거 괄호 삭제, 데드락 주의 추가(생성자 주입+@EnableJpaAuditing 시 EMF 초기화 중 데드락, Boot #22997, ObjectFactory 우회). 4.1 예시를 SpringContextHolder에서 ApplicationEventPublisher 직접 주입으로 교체(인프라 빈이라 EMF 시점에도 주입 성공)·@Configurable 각주 삭제, 4.2 '지연 조회 주입' 신설(@Lazy/ApplicationContext.getBean 사용 시점 조회/BootstrapMode.DEFERRED), 기존 static 주입은 4.3으로 재번호·keencho 체계화 변형 언급 추가. Sources에 한글 블로그 3건(kimchanjung·kangwoojin·keencho)·Boot 이슈 #22997 추가.
- 2026-07-10 `wiki/index.md` 전면 간소화 — 전 항목(111건) 설명을 상세 하위 항목 나열 없이 주제 수준 한 줄로 축약(괄호는 범위 키워드 2~4개까지만). 링크 대상·섹션 구조 변경 없음.
- 2026-07-10 `wiki/java/spring/spring-event.md` 생성 — Spring 이벤트: 구성 요소(ApplicationEvent 상속 불필요·PayloadApplicationEvent, ApplicationEventPublisher 주입 시 ApplicationContext 자신이 주입(registerResolvableDependency)·멀티캐스팅은 SimpleApplicationEventMulticaster 위임), 내장 이벤트(컨텍스트 4종+RequestHandledEvent, Boot 시동 순서·spring.factories 조기 등록), @EventListener(condition SpEL·다중 이벤트·반환값 재발행·@Order·제네릭 ResolvableTypeProvider·lazy 금지), 동기 실행 시맨틱, @Async 비동기(제약 3종), @TransactionalEventListener(phase 4종·fallbackExecution·AFTER_COMMIT 쓰기 유실→REQUIRES_NEW·6.1+ 리액티브), 예외 처리(유형별 동작표: 동기 전파·멀티캐스트 중단 / @Async void는 AsyncUncaughtExceptionHandler 로그만 / BEFORE_COMMIT 전파·롤백 / AFTER_* 로그만·유실 + 처리 가이드). index Spring 섹션 등록, entity-listener-di·jpa-transaction·hikari-deadlock에 역링크. 출처: Spring Framework/Boot 공식 문서·Javadoc·소스 9건.
- 2026-07-10 `wiki/java/spring/dependency-injection.md` 생성 — Spring 의존성 주입 방식: 생성자/Setter/필드(+임의 설정 메서드) 주입 예시·특징, 선택적 의존성 정의(기본값 대체 가능), 필드 주입 문제점 4항(컨테이너 결합·의존성 은닉·final 불가·SRP 위반 감지 지연), 방식 비교표(불변성·null 안전·테스트·순환 참조 등 7항), Spring 팀 권장(필수=생성자·선택=Setter·생성자 인자 과다는 code smell). index Spring 섹션 등록, entity-listener-di related에 역링크. 출처: Spring 레퍼런스 2건·Drotbohm.
- 2026-07-10 `wiki/java/spring/dependency-injection.md` 수정 — 구조 재편(내용 변경 없음): '3. 필드 주입의 문제점' 장을 삭제하고 문제점 4개를 넘버링 없는 불릿으로 2.3 필드 주입 본문에 통합, 4~5장을 3~4장으로 재번호.
- 2026-07-10 `wiki/java/spring/spring-event.md` 수정 — 4.5 예외 처리 절 삭제, [[spring-event-error-handling]] 분리 예정에 따라 4.2/4.3/4.4의 예외 언급을 링크 참조로 교체. 예외 전용 Sources 3건(TransactionSynchronizationUtils 소스·Task Execution and Scheduling·TransactionalApplicationListener Javadoc) 제거(신규 문서로 이관 예정), SimpleApplicationEventMulticaster Javadoc은 2.1 근거로 유지. Related pages에 spring-event-error-handling 추가. index 설명에서 '예외 처리' 제거.
- 2026-07-13 `wiki/java/spring/profiles.md` 생성 — Spring 프로파일: @Profile·활성화 방법 4종(active/env/CLI/programmatic)·spring.profiles.default, include(추가 방식·순서), profile group, multi-document 파일(YAML `---`·properties `#---` 구분자 규칙, last-wins), activation properties(on-profile/on-cloud-platform, 프로파일 표현식), 제약사항(active·include·group의 non-profile-specific 문서 한정, @PropertySource 미지원, 이름 검증 규칙). index Spring 섹션 등록, externalized-configuration related에 역링크. 출처: Spring Boot 공식 문서 2건(Profiles·Externalized Configuration).
- 2026-07-13 `wiki/crypto/cms.md` 수정 — 약자 풀네임 추가(MAC=Message Authentication Code, CEK=Content Encryption Key, AEAD=Authenticated Encryption with Associated Data), 4.3에 EncryptedContentInfo ASN.1 구조·필드 표 추가, 4.5 서명+암호화 중첩에 구조 상세(콘텐츠 자리·타입 OID 표시 방식, 서명 후 암호화/암호화 후 서명 중첩 트리, triple wrapping RFC 2634) 추가.
- 2026-07-13 `wiki/crypto/cms.md` 수정 — 5. 검증 장 신설(인증서 검증=RFC 5280 경로 검증·키 용도, SignedData 서명 검증 절차 RFC 5652 §5.4/§5.6, EnvelopedData는 무결성·인증 미제공으로 복호화만, AuthEnveloped/Digested/Authenticated/EncryptedData 검증 방식), 기존 5~7장을 6~8장으로 재번호 및 4.3 교차 참조 수정, Sources에 RFC 5280 추가.
- 2026-07-14 `wiki/crypto/timestamp-token.md` 생성 — RFC 3161 타임스탬프 토큰: 개요(TSA proof-of-existence·해시만 전송), 용도(LTV/CAdES·코드 서명·존재 증명·토큰 갱신), TSP 프로토콜(TimeStampReq 필드 상세—reqPolicy는 TSA 정책 OID·미지원 시 unacceptedPolicy, TimeStampResp PKIStatus 6종—granted vs grantedWithMods 차이·failInfo 주요 값), 토큰 구조(TSTInfo 필드 상세—accuracy는 genTime±범위·ordering true면 동일 TSA 토큰 genTime만으로 정렬, ESSCertID/V2·RFC 5816), 검증 절차, 기타(TSA 인증서 EKU critical id-kp-timeStamping 단독, 전송 HTTP/파일/TCP). OpenSSL 예시는 openssl-ts 문서로 분리 예정에 따라 제외. index Crypto 섹션 등록, cms related·본문 2곳에 역링크. 출처: raw/crypto/CMS.md, RFC 3161·5816.
- 2026-07-14 위키 전반 추론·주장 표시 각주 전환 (20개 파일, 28곳) — 인라인 `(inference)`/`(claim)` 마커와 숨김 HTML 주석을 `[^n]` 각주로 통일하고 각주 본문에 추론 근거 기술. 대상: crypto(ml-dsa·ml-kem 하이브리드 권고, x509-certificate RSA 관례 표현), java/test(java-testing-libraries PowerMock·H2, jmh peer review, jacoco 커버리지 한계·80% 기준), java/common(logging-frameworks 선택 기준), java/spring(batch 커서vs페이징, batch-chunk ×2, batch-db-reader-writer ×2, batch-flow default 메서드, batch-tasklet ×2, batch-fault-tolerance 재실행 예외·retry→skip, batch-job-parameters Converter, batch-testing 버전별 차이, profiles legacy 키, forward-headers-proxy 기본값, bean-registration-control 실무 권고 ×4, enable-annotations 수동 위첨자 ¹→[^1] 전환), programming(first-class-citizen C second-class). batch.md의 "별도 문서로 분리 예정. (claim)"은 편집 계획이므로 마커만 삭제. 내용 변경 없음(표기 형식·근거 기술만).
- 2026-07-14 `wiki/linux/security/openssl-ts.md` 생성 — openssl ts: 모드 3종(-query/-reply/-verify) 표, 요청 생성(-data/-digest, 기본 SHA-256·64비트 nonce, -tspolicy/-cert), 응답 생성(config tsa 섹션 필수—serial·signer_digest·digests 등 예시, -token_out/-token_in), 검증(-data/-digest/-queryfile 택1, 신뢰 루트 필수, -untrusted), HTTP 전송(자동 전송 미지원, tsget·curl 예시), 주의사항(serial 파일 잠금 없음, critical timeStamping EKU, -no_nonce 비권장). index Linux CLI openssl 그룹 등록, timestamp-token §6.2·related, openssl-overview related에 역링크. 출처: OpenSSL 공식 매뉴얼(openssl-ts, tsget).
- 2026-07-14 `wiki/java/crypto/crl-java.md` 생성 — Java CRL 생성·파싱·검증: 역할 분담(JDK 공개 API 생성 기능 부재는 근거 각주로 표시, 생성은 BouncyCastle), X509v2CRLBuilder 생성 예시(JcaX509v2CRLBuilder, addCRLEntry 오버로드 3종, AKI·CRLNumber 확장, JcaContentSignerBuilder 서명, JcaX509CRLConverter 변환), CRLReason 상수 표(RFC 5280 §5.3.1), CRL 갱신(addCRL 기존 항목 복사·CRLNumber 증가·template 생성자), java.security 파싱·검증(CertificateFactory.generateCRL, verify, isRevoked/getRevokedCertificate), 주의사항(발급 CA 키 서명, AKI·CRLNumber·nextUpdate MUST, 누적 유지, UTCTime/GeneralizedTime). index Java 암호 섹션 등록, certificate-revocation·openssl-crl·cert-path-validation related에 역링크. 출처: BouncyCastle Javadoc, Java PKI Programmer's Guide, RFC 5280.
- 2026-07-14 `wiki/linux/text/grep-sed-awk.md` 분리 — [[grep]]/[[sed]]/[[awk]] 3개 문서로 분할(같은 디렉터리, 본문 내용 변경 없이 이동·섹션 재번호). 기존 §5 조합 패턴은 awk.md '8. grep·sed와의 조합'으로 이동, 각 문서 개요에 상호 링크 추가. 원본 삭제. 인바운드 링크 치환 6개 파일(compression-archiving은 한 줄 병기, cat-tee-more-less·time·readline-shortcuts·environment-variables·ps-nohup은 3줄 확장), index Linux CLI 섹션 1줄→3줄.
- 2026-07-14 `wiki/linux/text/grep.md` 수정 — 구조 재편: 개요에서 sed/awk 언급 제거 후 grep(1) 기반 보강(복수 패턴 개행 구분, 따옴표 구분—작은따옴표는 셸 비해석·기본, 큰따옴표는 변수 확장 시, FILE '-'/미지정 동작, 종료 코드 용도), 기존 §2~5(패턴 문법·매칭 제어·출력 제어·파일/디렉터리)를 '2. 옵션' 하위 2.1~2.4로 통합, '4. 기타' 신설(sed·awk 조합 안내 이동, [[awk]] §8 참조). 표·예시 내용 변경 없음. Sources에 Bash Reference Manual(Quoting) 추가.
- 2026-07-14 `wiki/linux/text/sed.md` 수정 — grep.md와 동일한 구조 재편: 개요에서 grep/awk 언급 제거 후 sed(1) 기반 보강(stream editor 정의, one pass 효율·파이프라인 필터, -e/-f 부재 시 첫 인자=스크립트, 미지정 시 stdin), 기존 §3 주소 지정+§4 핵심 명령을 '3. 스크립트' 하위 3.1~3.7로 통합, '5. 기타' 신설(grep·awk 조합 안내, [[awk]] §6 참조). 표·예시 내용 변경 없음.
- 2026-07-14 `wiki/linux/text/awk.md` 수정 — 동일 구조 재편: 개요에서 grep/sed 언급 제거 후 gawk(1) 기반 보강(gawk=GNU 구현·POSIX 준수, 레코드/필드 처리 방식, program 전달 방식—첫 인자 또는 -f 복수 연결, 미지정 시 stdin), 옵션을 §2로 이동, 패턴 종류·내장 변수·내장 함수를 '4. 문법' 하위 4.1~4.3으로 통합, 기존 §8 'grep·sed와의 조합'을 '6. 기타'로 이동. grep.md·sed.md의 조합 예시 참조를 [[awk]] §6으로 갱신.
- 2026-07-14 `wiki/linux/system/ps-nohup.md` 분리 — [[ps]]/[[nohup]] 2개 문서로 분할(같은 디렉터리, 표·예시 내용 변경 없이 이동·재번호, grep-sed-awk 분리 방침 적용). ps.md: 개요에 스냅샷 특성·top 참조([[system-monitoring]]) 보강, 기존 §2.1~2.3을 '2. 옵션' 하위로, §2.4~2.6을 '3. 출력' 하위로 통합, '5. 기타' 신설(조합 패턴 중 ps+awk 진단 예시 2개 이동). nohup.md: 동작 방식·종료 코드·disown 비교·패턴 유지, '6. 기타' 신설(nohup+ps 모니터링 예시 이동, [[systemd-unit-file]] 참조). 원본 삭제. 인바운드 링크 치환 5개 파일(journalctl·systemctl·user-group-management·time·memory-troubleshooting, 2줄 확장), index 1줄→2줄.
- 2026-07-14 `wiki/linux/system/ps.md` 수정 — §5 기타에 '권한과 가시성' 항목 추가: hidepid=0 기본에서 타 사용자 프로세스 조회 가능, hidepid=1/2 예외, /proc/PID/environ·fd/ 소유자 전용, 소켓-PID 매핑의 root 요구([[network-diagnostics]] §2.1 참조). Sources에 proc(5) 추가.
- 2026-07-14 `wiki/linux/network/network-diagnostics.md` 수정 — §2.1에 -p 권한 제약 노트 추가: 비소유 소켓의 프로세스 표시는 root 필요(netstat(8) 원문 인용), /proc/PID/fd 대조 방식이 원인, ss 적용은 추론임을 각주로 표시. Sources에 netstat(8)·proc(5), Related에 [[ps]] 추가.
- 2026-07-14 `wiki/linux/system/shell-special-parameters.md` 생성 — 셸 특수 매개변수: 개요(자동 설정·읽기 전용·대입 불가), 일람 표($? $! $$ $0 $# $@ $* $- $_, $_의 출처·유동성은 각주), 종료 상태 상세(0=성공 규약, 2/126/127/128+N 표, 매 명령 덮어쓰기 주의·rc=$? 저장, 파이프라인 PIPESTATUS는 [[standard-streams]] 참조), "$@" vs "$*" 확장 비교 표, 자주 쓰는 패턴($? 분기·if ! 관용구·$! PID 저장·$$ 임시파일·$#/$0 인자 검증·$_ 재사용). index Linux CLI 섹션 등록, environment-variables·standard-streams·nohup related에 역링크. 출처: Bash Reference Manual(Special Parameters·Exit Status), bash(1).
- 2026-07-14 `wiki/java/spring/spring-event.md` 수정 — §2.1 멀티캐스팅 정의 보강(이벤트 하나를 타입·조건 일치 리스너 전원에 전달하는 1:N 전파, 발행자-수신자 디커플링, 기본 구현의 호출자 스레드 순차 호출·§4.2 참조), §4 제목 정리(4→@EventListener, 4.1→상세, 4.2→실행 시맨틱 — 동기, 4.3→실행 시맨틱 — 비동기), §4.3 도입부 추가(사용 시점—발행자 블로킹 회피, 동작—@Async로 TaskExecutor 별도 스레드 위임·즉시 반환). 근거: 기존 Sources(SimpleApplicationEventMulticaster Javadoc 등) 유지.
- 2026-07-15 `wiki/java/spring/spring-event.md` 수정 — 괄호 페이지 링크 4곳을 각주로 전환(동일 링크 동일 번호: [^1] spring-event-error-handling ×2, [^2] enable-annotations, [^3] jpa-transaction, 정의는 §4 끝 배치), §4.1에 @EventListener 속성 표 추가(value/classes 별칭·파라미터 타입 추론, condition SpEL #event/#args/파라미터명, id 기본값·5.3.5+ — 기존 condition·다중 이벤트 불릿은 표로 흡수, 동작 특성 4개 불릿 유지), §4.4에 @TransactionalEventListener 속성 표 추가(@EventListener 메타 어노테이션 관계, phase 기본 AFTER_COMMIT, fallbackExecution 기본 false·미실행 시 폐기). Sources에 @EventListener·@TransactionalEventListener Javadoc 2건 추가.
- 2026-07-15 `wiki/java/spring/spring-event.md` 수정 — 직전 각주 전환 되돌림: [^1](spring-event-error-handling ×2)·[^2](enable-annotations)는 원래 괄호 링크로 복원, [^3](jpa-transaction)은 마커·정의 완전 삭제, §4.4 말미의 중복 안내 문장("리스너 예외 동작·처리 가이드는 ... 참고") 삭제. 속성 표 등 나머지 보강 내용은 유지.
