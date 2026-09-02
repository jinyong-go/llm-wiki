# log

---

## 2026-08-31 17:33:58

- **수정**: `wiki/java/common/gradle-dependency-configurations.md` — §2~8을 "§2. 종류"의 하위 항목(2.1~2.7)으로 재구성, ABI 설명 각주 추가, §2.3 compileOnly 문장 정리, §2.4 compileOnlyApi 괄호 예시를 본문 문장으로 변경, 내부 앵커 링크 갱신

## 2026-08-31 17:25:58

- **이동**: `wiki/java/excel.md` → `wiki/java/common/excel.md`(내용 변경 없음)

## 2026-08-31 17:21:44

- **생성**: `wiki/java/common/gradle-dependency-configurations.md` — Gradle 의존성 Configuration 신규 문서(Gradle 공식 문서: Java Library Plugin/Java Plugin/Dependency Management for Java Projects 기반). §2 implementation, §3 api(ABI 노출 판단 기준), §4 compileOnly, §5 compileOnlyApi, §6 runtimeOnly, §7 테스트 전용 Configuration(testImplementation/testCompileOnly/testRuntimeOnly), §8 annotationProcessor(Lombok compileOnly+annotationProcessor 병행 필요), §9 종합 비교(컴파일/런타임 클래스패스·소비자 노출 여부 표, implementation의 런타임 노출 오해 정정, Resolvable Configuration 구성), §10 선택 기준
- **수정**: `wiki/java/common/gradle.md` — §7.2에 신규 문서 링크 추가, Related pages에 `[[gradle-dependency-configurations]]` 추가
- **수정**: `wiki/index.md` — Java 섹션에 `[[gradle-dependency-configurations]]` 항목 추가

## 2026-08-31 17:13:10

- **생성**: `wiki/javascript/common/fetch-api.md` — Fetch API 신규 문서(MDN Fetch API/Using Fetch/fetch()/RequestInit/Response.type, WHATWG Fetch Standard 기반). §1 개요(XMLHttpRequest 대비 장점), §2 기본 사용법, §3 응답 상태 확인(HTTP 에러 상태엔 reject 안 됨), §4 요청 옵션(method/headers/body/credentials/mode), §5 응답 본문 읽기(locked·disturbed 스트림, clone()), §6 요청 취소(AbortController/AbortSignal.timeout()), §7 기타(redirect: "manual"의 opaqueredirect 동작, JSON 전송 시 Content-Type 기본값이 text/plain인 문제, 캐시로 인한 오래된 응답, 업로드 진행률 추적 불가), §8 에러 처리(에러 유형별 표, error.name 분기 패턴)
- **수정**: `wiki/index.md` — JavaScript 섹션에 `[[fetch-api]]` 항목 추가

## 2026-08-31 16:55:52

- **수정**: `wiki/javascript/common/async-await.md` — §1 "내부적으로 여전히 Promise다" 표현을 "async 함수는 여전히 Promise를 반환하고 await는 그 Promise가 처리되기를 기다린다"로 정정, §3 "async 함수 안에서만(또는 모듈 최상위에서)"를 "모듈 최상위 또는 async 함수 내에서"로 수정

## 2026-08-31 14:25:48

- **수정**: 프로즈/목록 항목 내 하드랩(문장 중간 줄바꿈) 제거, 단락을 한 줄로 병합(내용 변경 없음) — `wiki/ai/ai-agent-schema.md`, `wiki/crypto/hsm.md`, `wiki/dbms/concurrency-control.md`, `wiki/dbms/index-scan.md`, `wiki/dbms/oracle-hints.md`, `wiki/dbms/upsert-merge.md`, `wiki/java/common/cpu-usage-troubleshooting.md`, `wiki/java/common/expression-vs-statement.md`, `wiki/java/common/java-process-analysis-tools.md`, `wiki/java/common/jvm-options.md`, `wiki/java/spring/aop.md`, `wiki/java/spring/batch-tasklet.md`, `wiki/java/spring/dependency-injection.md`, `wiki/java/spring/entity-listener-di.md`, `wiki/java/spring/externalized-configuration.md`, `wiki/java/spring/jpa-composite-key.md`, `wiki/java/spring/jpa-entity-lifecycle.md`, `wiki/java/spring/profiles.md`, `wiki/java/spring/spring-event.md`, `wiki/java/test/inverse-operation-testing.md`, `wiki/java/test/jacoco.md`, `wiki/java/test/jmh.md`, `wiki/java/test/junit-parameterized-test.md`, `wiki/javascript/common/es-module.md`, `wiki/javascript/common/template-literals.md`, `wiki/linux/network/dns-configuration.md`, `wiki/linux/system/crontab.md`, `wiki/programming/first-class-citizen.md`, `wiki/web/cors.md`

## 2026-08-31 11:23:31

- **생성**: `wiki/javascript/react/react-ssr.md` — React SSR 신규 문서(React 공식 문서/React Router 문서 기반). §2 패키지 구성(react-dom 서브 경로 vs react-router-dom·메타프레임워크 별도 설치), §3 비스트리밍 SSR(renderToString/renderToStaticMarkup), §4 스트리밍 SSR(renderToPipeableStream/renderToReadableStream, Suspense·셸), §5 하이드레이션(선택적 하이드레이션)
- **수정**: `wiki/index.md` — `## React` 섹션 신설, `[[react-ssr]]` 항목 추가

## 2026-08-27 17:40:43

- **수정**: `wiki/javascript/common/function-declaration.md` — §4.1 목록을 각 항목별 문단으로 풀고, 생성자·generator 예시 코드를 해당 항목 바로 아래로 재배치

## 2026-08-27 17:34:26

- **생성**: `wiki/javascript/common/function-declaration.md` — 자바스크립트 함수 선언 신규 문서(MDN function statement/expression/Arrow functions/Default·Rest parameters 기반). §2 함수 선언문(호이스팅, 블록 스코프), §3 함수 표현식(호이스팅 안 됨, 익명/기명), §4 화살표 함수(축약 문법, this/arguments/super 없음, 생성자·generator 불가 예시), §5 매개변수(기본값 — 여러 매개변수 기본값이 독립적으로 적용됨을 예시로 명시, 나머지 매개변수), §6 세 방식 비교표, §7 IIFE·메서드 단축 문법
- **수정**: `wiki/index.md` — JavaScript 섹션에 `[[function-declaration]]` 항목 추가

## 2026-08-27 17:05:57

- **수정**: `wiki/javascript/common/async-await.md` — §1 "Promise의 상태·체이닝 개념은 참고" 문장 삭제, 본문 프로즈의 "promise"를 "Promise"로 대문자화(코드블럭·태그·Related pages 제외)
- **수정**: `wiki/javascript/common/promise.md` — 동일하게 본문 프로즈의 "promise"를 "Promise"로 대문자화, §5.2/5.3의 "settle" → "settled"로 정정(§2 상태의 settled 표기 및 fulfilled된다/rejected된다 패턴과 일관성 맞춤)

## 2026-08-27 16:57:40

- **수정**: `wiki/javascript/common/async-await.md` — §1 개요 첫 문장 병합·링크 위치 조정, §3 제목을 "await 키워드"로 변경, §3 마지막 문장의 괄호·"단," 제거, §5.2 도입 문장을 간결한 단문으로 수정

## 2026-08-27 16:51:53

- **생성**: `wiki/javascript/common/async-await.md` — 자바스크립트 async/await 신규 문서(MDN async function/await + jojoldu 블로그 기반), [[promise]]와 분리 작성. §1 개요(then 체이닝 대비 장점: 가독성/try-catch/스택 트레이스/중간값 재사용), §2 async 함수(Promise.resolve와 달리 항상 새 promise로 감싸는 이유), §3 await, §4 순차 실행 vs 동시 실행, §5 주의사항(5.1 forEach가 await를 기다리지 않음, 5.2 try 안에서 return await — catch 여부 + Node.js 에러 스택 트레이스 보존, 5.3 처리되지 않은 거부)
- **수정**: `wiki/index.md` — JavaScript 섹션에 `[[async-await]]` 항목 추가

## 2026-08-27 16:27:54

- **생성**: `wiki/javascript/common/promise.md` — 자바스크립트 Promise 신규 문서(MDN Promise/Using promises 기반). §1 개요, §2 상태(pending/fulfilled/rejected, settled/completed, resolved), §3 생성과 소비(then 2인자, onFulfilled 에러가 같은 then의 onRejected로 전파되지 않는 함정), §4 체이닝(4.1 then/4.2 catch/4.3 finally), §5 동시성 정적 메서드(5.1 all/5.2 allSettled/5.3 race/5.4 any), §6 Thenable, §7 Promise를 반환하는 내장 함수/API(fetch, 동적 import, clipboard, fs.promises). async-await 문서와 분리 작성 예정
- **수정**: `wiki/index.md` — JavaScript 섹션에 `[[promise]]` 항목 추가

## 2026-08-27 13:15:13

- **수정**: `wiki/javascript/nestjs/nestjs-prisma.md` — §3.2 여러 데이터베이스 연결에 `--schema` CLI 플래그로 대상 스키마 파일을 지정하는 방법과, `prisma/schema/` 멀티파일 스키마 기능(하나의 클라이언트로 병합됨)과의 차이점 추가

## 2026-08-27 13:03:09

- **수정**: `wiki/javascript/nestjs/nestjs-prisma.md` — TypeORM/Sequelize와 동일한 상위 구조(개요→설치→설정→모델 정의→쿼리→의존성 주입→기타)로 재구성. §2 설치에 DB별 `datasource` provider 값 표 추가, §3 설정(3.1 연결: 기존 schema 블록+PrismaService/PrismaModule 등록 통합, 3.2 여러 데이터베이스 연결: 별도 schema/출력 경로로 다중 PrismaService 구성하는 방법 신규 작성), §4 모델 정의(4.1 모델 정의, 4.2 관계: 1:1/1:N/N:N 표현 방식 표 신규, 4.3 마이그레이션), §5 쿼리(5.1 기본 CRUD, 5.2 Raw SQL), §6 의존성 주입(6.1 PrismaService 주입, 6.2 테스트에서 교체: `{ provide: PrismaService, useValue }` mock 패턴 신규 작성), §7 기타(기존 7.1~7.4 내용·번호 유지)

## 2026-08-27 11:22:54

- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — §5.1 @InjectModel에 역할·인자 설명 문장 추가, §5.2 테스트에서 교체에 사용 목적(mock 교체) 설명 추가 및 문서 구조 관련 편집 메모("DI 토큰 교체라는 점에서 §5 하위로 옮기는 게 자연스럽다") 삭제

## 2026-08-27 11:05:16

- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — TypeORM 문서와 순서를 맞추기 위해 §3 Model 정의(구 §3)와 §4 설정(구 §4)의 순서를 교체(설정이 먼저, Model 정의가 다음). 하위 번호도 3.1~3.3(설정)/4.1~4.2(컬럼·관계 데코레이터)로 재조정. 내용 변경 없음

## 2026-08-27 10:52:15

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — §2 설치에 DB별 드라이버 패키지 표 추가, §3.1 연결에 `forRoot()` 하드코딩 예시 추가(ConfigService 문단 앞), §3 옵션 표에 `entities`/`database`/`logging`/`extra` 행 추가, §3.3 여러 데이터베이스 연결 예시를 주석에서 실제 값으로 구체화, §4 Entity 개요에 `@Entity()` 옵션(테이블명/`schema`) 언급 추가, §4.1 컬럼 데코레이터·§4.2 관계 데코레이터 표에 "자주 쓰는 옵션" 컬럼 추가
- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — §2 설치에 DB별 드라이버 패키지 표 추가, §4.1 연결에 `forRoot()` 하드코딩 예시 추가, §4 옵션 표에 `models`/`database`/`logging`/`dialectOptions` 행 추가, §4.3 여러 데이터베이스 연결 예시 구체화, §3.1 컬럼 데코레이터·§3.2 관계 데코레이터 표에 "자주 쓰는 옵션" 컬럼 추가

## 2026-08-26 17:57:26

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — 전체 재구조화: §3 설정(3.1 연결/3.2 모델 등록—forFeature를 Repository에서 이동/3.3 여러 데이터베이스 연결)과 §4 Entity 순서 교체(설정이 Entity보다 먼저), §5 Repository에서 forFeature 코드 제거 후 §3.2·§6.1 포인터로 축약하고 §5.4에 Raw SQL을 네 번째 쿼리 작성 방법으로 편입(구 §7 독립 항목 제거), §6 의존성 주입은 구 §8에서 당겨짐, §7 트랜잭션은 구 §6에서 기타 바로 위로 이동, §8 기타는 구 §9. 문서 내 모든 §앵커 갱신
- **수정**: `wiki/javascript/nestjs/nestjs-database.md`, `nestjs-mongoose.md`, `nestjs-prisma.md`, `nestjs-sequelize.md` — nestjs-typeorm 재구조화에 따라 `[[nestjs-typeorm]] §7`→`§5.4`, `§9.1`→`§8.1` 교차 참조 갱신

## 2026-08-26 17:47:23

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — §3에 3.1 자주 쓰는 옵션(`@Schema({ timestamps, collection })`, `@Prop({ required, default, unique, enum, type/ref })` 표+예시), 3.2 참조 관계(MongoDB에 JOIN이 없다는 점, `ref`+`ObjectId`는 populate 없이는 ObjectId만 반환, 단일/다중 참조 예시, §6.2 N+1과 상호 링크) 추가. §6.1의 "하이드레이션"에 각주 추가(원시 데이터 → Document 인스턴스 변환 과정, `HydratedDocument<T>` 설명). Sources에 Mongoose Schemas 공식 문서 추가

## 2026-08-26 17:39:42

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — 전체 재검토 후 다듬음: §4.2 "해당하는 지점"→"해당하는 역할", §5.1 "여러 연결을 쓸 때는"→"여러 연결을 사용할 때는", §4.1 도입 문장을 `{ uri }` 한정에서 "옵션 객체(예: `{ uri }`)"로 완화(2번 예시가 user/pass도 반환하는 것과의 불일치 수정), §4.1 끝에 자주 쓰는 연결 옵션 표 추가(`dbName`/`autoIndex`—TypeORM `synchronize`와 유사한 프로덕션 주의/`maxPoolSize`/`serverSelectionTimeoutMS`), §4.3 여러 데이터베이스 연결 예시를 하드코딩된 URI에서 TypeORM/Sequelize와 동일한 `/* ... */` 플레이스홀더 스타일로 교체. 출처: Mongoose 공식 Connections 문서(옵션 기본값·autoIndex 프로덕션 권장사항)

## 2026-08-26 17:33:28

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — §4.1 연결의 두 예시를 각각 해당 번호 목록 항목(1. URI에 포함 / 2. user·pass 별도 지정) 아래로 들여써서 이동. 원래의 단순 `uri` 예시는 1번, host/port/db+user/pass 예시는 2번 아래에 배치

## 2026-08-26 17:31:18

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — §4.1 연결에 인증 정보(username/password) 지정 방법 2가지 추가: URI에 포함(특수문자 URL 인코딩 필요)과 `user`/`pass` 옵션 별도 지정(Mongoose 전용, 인코딩 불필요). 예시를 host/port/db + user/pass 필드별 `ConfigService` 조합으로 확장. Sources에 Mongoose Connections 공식 문서 추가

## 2026-08-26 17:28:40

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — §3 제목을 "Schema와 Model"에서 "Schema"로 변경(해당 항목엔 Model 내용이 없었음), Model 역할 설명을 §4.2 모델 등록으로 이동(forFeature가 Schema를 실제 Model로 만드는 지점). §4.1 연결 예시를 하드코딩된 URI에서 `ConfigService` 기반 `forRootAsync({ uri: ... })`로 교체 — `forRoot()`는 URI 문자열, `forRootAsync()`는 `{ uri }` 옵션 객체를 반환해야 한다는 API 차이 설명 추가

## 2026-08-26 17:05:09

- **수정**: `wiki/javascript/nestjs/nestjs-mongoose.md` — 다른 ORM 문서와 동일한 구조로 재편: §2 설치/§3 Schema와 Model/§4 설정(4.1 연결, 4.2 모델 등록, 4.3 여러 데이터베이스 연결)/§5 의존성 주입(5.1 `@InjectModel`, 5.2 테스트에서 교체)/§6 기타(6.1 객체 매핑 — Document 인스턴스 vs `.lean()`, 6.2 N+1 문제 — `populate()` 배치와 반복문 안 호출 시 N+1, 6.3 예외 처리 — E11000 중복 키(`unique`는 validator 아님)와 CastError·ObjectId(NestJS에 대응 내장 Pipe 없음)). 모든 코드 예시에 import 문 추가. 출처: NestJS Mongoose 공식 문서, Mongoose 공식 문서(Lean, Query Population), GitHub 이슈(nestjs/nest #12919 ParseObjectIdPipe 부재)

## 2026-08-26 16:39:19

- **구조 변경**: `logs/log.md`(단일 파일, 309개 항목)를 월별 디렉터리로 분리 — `logs/2026-05/log.md`, `logs/2026-06/log.md`, `logs/2026-07/log.md`, `logs/2026-08/log.md`. 각 항목은 `## YYYY-MM-DD` 헤더의 연-월을 기준으로 분류했고, 원본 파일 순서를 그대로 보존(문자 단위 무손실 검증 완료). 이후 이력은 작업 시점의 현재 월 파일에 기록하며, 월이 바뀌면 새 디렉터리를 생성. `CLAUDE.md`의 "구조"·"위키"·"이력" 절을 새 경로 규칙에 맞게 갱신

## 2026-08-26 16:17:03

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — §9에 9.2 관계 로딩(eager/lazy, 양쪽 eager 시 순환 참조 에러), 9.3 bigint·COUNT 문자열 반환, 9.4 N+1 문제(`relationLoadStrategy` join/query, 반복문 레이지 접근 예시) 추가
- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — §6에 6.2 forFeature와 연관 모델(연관관계로만 참조된 모델은 자동 등록 안 됨), 6.3 N+1 문제(`include` 기본 JOIN과 hasMany 중복 행, `separate: true`), 6.4 순환 연관관계(`constraints: false`) 추가
- **수정**: `wiki/javascript/nestjs/nestjs-prisma.md` — §7에 7.2 예외 처리(`PrismaClientKnownRequestError`, P2002/P2025, Exception Filter 연계), 7.3 N+1 문제(관계 단위 배치 쿼리, JOIN이 아님), 7.4 종료 시 연결 정리(`OnModuleDestroy`) 추가. Related pages에 nestjs-request-pipeline 추가. 출처: StackOverflow/GitHub 이슈(typeorm, sequelize, prisma), Prisma 공식 에러 레퍼런스, Sequelize 공식 문서(N+1 관련 GitHub 이슈 포함)

## 2026-08-26 16:07:25

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — §9 기타/9.1 객체 매핑 신설. `getMany()`/`getOne()`(Entity 인스턴스) vs `getRawMany()`/`getRawOne()`(plain object) 차이, 제네릭이 런타임 변환을 하지 않는다는 점(ConfigService.get<T>()와 동일한 함정), 수동 매핑·`plainToInstance()`, `getRawAndEntities()` 정리. JPA의 constructor expression에 해당하는 기능이 없음을 명시
- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — §6 기타/6.1 객체 매핑 신설. `{ raw: true }` 옵션, `sequelize.query()`의 `model`/`mapToModel`(Sequelize 자신의 Model 클래스로만 매핑 가능, 임의 DTO 불가) 정리, TypeORM과 동일한 제약임을 상호 링크
- **수정**: `wiki/javascript/nestjs/nestjs-prisma.md` — §7 기타/7.1 객체 매핑 신설. Prisma는 애초에 Entity/Model 클래스가 없어 모든 결과가 plain object라는 점, `select`/`include`로 타입이 좁혀지는 방식, 실제 DTO 클래스 인스턴스가 필요하면 동일하게 수동 변환해야 함을 정리. Related pages에 nestjs-typeorm 추가

## 2026-08-26 15:02:28

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — §4.1 연결의 하드코딩 예시(`host: 'localhost'` 등)를 제거하고 `ConfigService` 기반 `forRootAsync()` 동적 설정 예시(host/port/username/password/database, `synchronize`를 `NODE_ENV`로 분기)로 교체. 별도였던 §4.3 "비동기 설정"은 내용이 중복돼 제거(§4.1로 흡수), 뒤 섹션 번호는 원래 5부터라 영향 없음
- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — §4.1 연결도 동일하게 하드코딩 예시 제거, `ConfigService` 기반 `forRootAsync()` 예시로 교체

## 2026-08-26 14:35:50

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — 전체 재구조화: §2 설치/§3 Entity/§4 설정(4.1 연결, 4.2 여러 데이터베이스 연결, 4.3 비동기 설정 — 기존 별도 항목이었던 다중연결·비동기설정을 설정 하위로 통합)/§5 Repository(쿼리 작성법, `@InjectRepository` 인젝션 코드는 제거하고 §8.1로 포인터 이동)/§6 트랜잭션/§7 Raw SQL/§8 의존성 주입(8.1 `@InjectRepository` 설명 신설, 8.2 테스트에서 교체 — 기존 최상위 항목을 하위로 이동). 모든 코드 예시 상단에 import 문 추가
- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — 모든 코드 예시 상단에 import 문 추가(sequelize-typescript 데코레이터, `@nestjs/sequelize` 등)
- **수정**: `wiki/javascript/nestjs/nestjs-prisma.md` — PrismaService/PrismaModule/UsersService 예시에 import 문 추가
- **수정**: `wiki/javascript/nestjs/nestjs-database.md` — nestjs-typeorm 재구조화에 따라 raw SQL 참조 앵커 갱신(§7)

## 2026-08-26 11:42:22

- **수정**: `wiki/javascript/nestjs/nestjs-sequelize.md` — 구조 재편: §2 설치(연결 설정 분리) → §3 Model 정의(3.1 컬럼 데코레이터: `@Table`/`@Column`/`@PrimaryKey`/`@AutoIncrement`/`@Default`/`@AllowNull`/`@Unique`/`@CreatedAt,@UpdatedAt`/`@DeletedAt`/`@Index`, 3.2 관계 데코레이터: `@ForeignKey`/`@BelongsTo`/`@HasMany`/`@HasOne`/`@BelongsToMany`와 외래키 위치 표) → §4 설정(4.1 연결(forRoot)/4.2 모델 등록(forFeature)/4.3 다중 연결로 이동) → §5 의존성 주입(5.1 `@InjectModel`, 5.2 테스트에서 교체 — `getModelToken` mock 교체를 DI 토큰 교체 관점에서 이 하위로 이동). 출처: sequelize-typescript 공식 README(데코레이터·관계 정의)

## 2026-08-26 10:38:59

- **수정**: `wiki/javascript/nestjs/nestjs-typeorm.md` — 기존 §3 "Entity와 Repository"를 §3 Entity/§4 Repository로 분리. Entity에 컬럼 데코레이터 표(`@PrimaryColumn`/`@PrimaryGeneratedColumn`(시퀀스 지정 불가 비고 포함)/`@Column`/`@CreateDateColumn` 등)와 관계 데코레이터 표(owning side·외래키 위치) 추가. Repository에는 TypeORM이 Spring Data JPA 같은 메서드 이름 기반 자동 쿼리 생성을 지원하지 않는다는 점을 명시하고, 옵션 객체(`find`/`findBy`/`findOneBy`), QueryBuilder, `Repository.extend()` 커스텀 리포지토리(구 `@EntityRepository` 데코레이터는 0.3에서 제거됨) 3가지 쿼리 작성 방식 정리. §5 트랜잭션은 콜백/QueryRunner/격리 수준(Isolation Level) 3개 하위 항목으로 보강. 이어지는 섹션 번호 전체 조정(6~9). 출처: typeorm.io(Repository API, Entities, Relations, Transactions, Custom Repository), GitHub typeorm#3506(커스텀 시퀀스명 미지원, not planned로 종료 확인)
- **수정**: `wiki/javascript/nestjs/nestjs-database.md` — nestjs-typeorm 섹션 재편에 따라 raw SQL 참조 앵커 §7 → §8 갱신

## 2026-08-25 17:58:02

- **생성**: `wiki/javascript/nestjs/nestjs-typeorm.md` — NestJS TypeORM 신규 문서. 설치·연결(forRoot, retryAttempts/autoLoadEntities/synchronize), Entity·Repository(forFeature, @InjectRepository, exports 필요성), 트랜잭션, 다중 연결, 비동기 설정(forRootAsync), raw SQL(dataSource.query), 테스트 mock 교체(getRepositoryToken) 작성
- **생성**: `wiki/javascript/nestjs/nestjs-mongoose.md` — NestJS Mongoose 신규 문서. 설치·연결, Schema/@Prop, forFeature/@InjectModel, 다중 연결(connectionName), mock 교체(getModelToken) 작성
- **생성**: `wiki/javascript/nestjs/nestjs-sequelize.md` — NestJS Sequelize 신규 문서. 설치·연결(forRoot, autoLoadModels/keepConnectionAlive/synchronize 기본값 true 주의), Active Record 모델(@Table/@Column extends Model), forFeature/@InjectModel, 다중 연결 작성. 출처: docs.nestjs.com/techniques/sql(공식 @nestjs/sequelize API), 기존 /recipes/sql-sequelize는 구식 수동 provider 방식이라 제외
- **생성**: `wiki/javascript/nestjs/nestjs-prisma.md` — NestJS Prisma 신규 문서. 스키마 우선 개념, 설치·초기화(schema.prisma, generator/datasource, moduleFormat cjs), 모델·마이그레이션, PrismaService(PrismaClient 상속) + PrismaModule 연동 패턴(forRoot 관례와 다름), 기본 CRUD, raw SQL($queryRaw/$executeRaw) 작성
- **생성**: `wiki/javascript/nestjs/nestjs-database.md` — 4개 DB 통합 비교 문서로 재작성(기존 단일 통합 문서 계획을 라이브러리별 분리 후 비교 문서로 전환). 비교표, forRoot/forFeature 공통 관례 vs Prisma 차이, 선택 기준, Raw SQL/SQL Mapper(MyBatis·JdbcTemplate 대응 부재) 정리
- **수정**: `wiki/javascript/nestjs/nestjs.md` — §1.1 DB 연동 행에 4개 문서 링크 추가, Related pages에 nestjs-database 추가
- **수정**: `wiki/index.md` — NestJS 섹션에 nestjs-database/typeorm/mongoose/sequelize/prisma 5개 항목 추가

## 2026-08-25 17:38:41

- **수정**: `wiki/javascript/typescript/typescript-5.0.md`, `wiki/javascript/typescript/typescript-6.0.md` — "기타 기본값 변경"/"기본값이 변경된 옵션"이 컴파일러 옵션(newLine, strict, module 등)에 대한 내용임을 확인하고, §2를 "컴파일러 옵션"으로 묶어 추가된 옵션(2.1)/기본값 변경(2.2)/Deprecated 옵션(2.3) 하위 항목으로 재편, 두 문서 간 하위 항목 순서 통일. 이어지는 언어 기능 변경/언어 문법 Deprecation 섹션 번호도 순차 조정(5.0: §3, 6.0: §3~4)

## 2026-08-25 17:35:49

- **수정**: `wiki/javascript/typescript/typescript-5.0.md` — §5 "언어 기능 변경" 신규 추가(컴파일러 옵션 외 순수 언어/타입시스템 변경). Decorators(ECMAScript 표준, 코드 예시 포함), `const` 타입 파라미터, 모든 enum이 union enum으로 동작, `export type *`, JSDoc `@satisfies`/`@overload`, 관계 연산자 암묵적 형변환 금지, enum 값 검증 강화 정리
- **수정**: `wiki/javascript/typescript/typescript-6.0.md` — §5 "언어 기능 변경" 신규 추가, 기존 §5(언어 문법 Deprecation)는 §6으로 재번호. 문맥 민감 함수 판정 완화(제네릭 추론 개선), `Temporal`/`Map,WeakMap` upsert/`RegExp.escape` 타입(모두 Stage 4 제안), DOM iterable lib 통합 정리
- **수정**: `wiki/index.md` — typescript-5.0/6.0 서술에 "언어 기능" 반영

## 2026-08-25 13:21:56

- **생성**: `wiki/javascript/typescript/typescript.md` — TypeScript 개요 신규 문서(`typescript/` 카테고리 대표 문서). 정의(JS 상위집합, 정적 타입, erasable 타입, 구조적 타이핑), 왜 사용하는가(조기 오류 발견·에디터 지원·협업·점진적 도입), 컴파일러(`tsc`, 2026-07-08 TypeScript 7.0 Go 네이티브 포트로 전환, 8~12배 속도 개선), 관련 도구(타입체크·트랜스파일 분리 구조, ts-node/tsx/Deno/Bun, Node.js 24 네이티브 type stripping·`--erasableSyntaxOnly`), 장단점 작성. 출처: TypeScript 핸드북, Announcing TypeScript 7.0 공식 발표, Node.js Docs
- **수정**: `wiki/javascript/typescript/tsconfig.md`, `wiki/javascript/typescript/typescript-6.0.md` — Related pages에 `[[typescript]]` 추가
- **수정**: `wiki/index.md` — TypeScript 섹션 맨 위에 typescript 항목 추가

## 2026-08-24 18:00:59

- **생성**: `wiki/javascript/typescript/typescript-5.0.md` — TypeScript 5.0 신규 문서(2023-03-16 릴리스). 추가된 컴파일러 옵션(moduleResolution bundler, verbatimModuleSyntax, allowImportingTsExtensions, resolvePackageJsonExports/Imports, allowArbitraryExtensions, customConditions — 값 타입·예시 포함), Deprecated 옵션(TS 6.0에서 제거 완료된 11개, 값 예시 포함), 기타 기본값 변경(newLine, forceConsistentCasingInFileNames) 작성
- **생성**: `wiki/javascript/typescript/typescript-6.0.md` — TypeScript 6.0 신규 문서(2026-03-23 릴리스, JS 기반 마지막 릴리스·Go 네이티브 7.0 전 단계). 추가된 컴파일러 옵션(stableTypeOrdering, CLI 전용 ignoreConfig), 기본값 변경(strict/module/target/types/rootDir/noUncheckedSideEffectImports/libReplacement, 이전·이후 값 표), Deprecated 옵션(baseUrl 포함 11개, TS 7.0 제거 예정, 값 예시 포함), 언어 문법 deprecation(namespace `module` 키워드, import attributes) 작성. baseUrl deprecation은 여러 독립 프로젝트(nestjs/nest 등) GitHub 이슈의 동일 에러 메시지로 교차 확인
- **수정**: `wiki/javascript/typescript/tsconfig.md` — §3 compilerOptions에 자주 쓰는 옵션 8개(target/lib, module/moduleResolution, strict, esModuleInterop, outDir/rootDir, paths, skipLibCheck, declaration/sourceMap) 하위 항목으로 분리, 각각 값 타입과 JSON 예시 추가. 카테고리 표에서 deprecated된 `baseUrl` 제거. §5 Deprecated 옵션 표를 제거하고 typescript-5.0/typescript-6.0 문서로 링크만 남김(이 문서는 현재 유효한 옵션만 다루도록 범위 축소). Sources에서 버전별 릴리스 노트 제거(각 버전 문서로 이동), Related pages에 두 버전 문서 추가
- **수정**: `wiki/index.md` — TypeScript 섹션에 typescript-5.0/typescript-6.0 항목 추가

## 2026-08-24 17:40:06

- **생성**: `wiki/javascript/typescript/tsconfig.md` — tsconfig.json 신규 문서. 새 `typescript/` 하위 카테고리(`common/`/`node/`/`nestjs/`와 동일 레벨) 최초 문서. 개요(프로젝트 루트 표시, tsc 탐색 순서, jsconfig.json, `tsc --init`), 최상위 필드(files/include/exclude 기본값, extends 배열 지원(TS 5.0+)과 우선순위·상속 제외 대상), compilerOptions 공식 카테고리별 대표 옵션(NestJS 실제 생성 tsconfig.json을 예시로 사용), references(프로젝트 참조), Deprecated 옵션(TS 5.0에서 deprecated·5.5부터 무효·6.0 에러 예정인 11개 옵션과 대체안: importsNotUsedAsValues/preserveValueImports → verbatimModuleSyntax, out → outFile, target ES3, charset 등) 작성. 출처: TypeScript 공식 tsconfig 핸드북·레퍼런스, 5.0/5.5 릴리스 노트
- **수정**: `wiki/index.md` — `## JavaScript`와 `## Node.js` 사이에 `## TypeScript` 섹션 신설, tsconfig 항목 추가
- **수정**: `wiki/javascript/nestjs/nestjs.md` — §3.1 tsconfig.json/tsconfig.build.json 행에 `[[tsconfig]]` 링크 추가
- **수정**: `wiki/javascript/common/module-system.md` — Related pages에 tsconfig 링크 추가

## 2026-08-24 17:13:30

- **생성**: `wiki/javascript/nestjs/nestjs-testing.md` — NestJS 테스트 신규 문서. Jest가 기본 프레임워크로 설정됨(devDependencies, `.spec.ts`/`.e2e-spec.ts` 파일 규칙), 단위 테스트(격리 테스트, `Test.createTestingModule()`+`TestingModule`), Mock 교체(그 외 override* 메서드, 전역 등록 컴포넌트 오버라이드 시 `useExisting` 트릭, `useMocker()` 자동 목킹 — 기본 `overrideProvider()` 사용법은 nestjs-dependency-injection §3.5로 위임), e2e 테스트(supertest, createNestApplication/init, Fastify inject()), 요청 스코프 provider 테스트(ContextIdFactory), package.json `jest` 필드·`test/jest-e2e.json`·테스트 스크립트 정리. 출처: NestJS 공식 Testing 문서, `@nestjs/cli@11` `nest new` 실행 결과(jest 필드, spec 파일 실물 확인)
- **수정**: `wiki/javascript/nestjs/nestjs-dependency-injection.md` — §3.5에 nestjs-testing 링크 추가, Related pages에 추가
- **수정**: `wiki/javascript/nestjs/nestjs.md` — Related pages에 nestjs-testing 추가
- **수정**: `wiki/index.md` — NestJS 섹션에 nestjs-testing 항목 추가

## 2026-08-24 17:07:34

- **수정**: `wiki/javascript/nestjs/nestjs.md` — §1.2 표: "의존성 역전(DIP)" → "의존성 주입(DI)"로 수정(내용이 DIP가 아니라 IoC 컨테이너의 생성자 주입 메커니즘 자체를 설명하고 있어 용어 오류였음, `nestjs-dependency-injection.md`도 DI로만 지칭). 인터페이스 행의 `[[nestjs-controllers]]` 링크 제거(직접 관련 없음). §1.3 제목 "왜 사용하는가" → "사용 이유"로 명사형 변경(스타일 가이드: 제목은 서술형 지양)

## 2026-08-24 17:03:44

- **이동**: `wiki/javascript/` → `wiki/javascript/common/` 하위로 재편. `commonjs.md`, `es-module.md`, `module-system.md`, `lexical-scope.md`, `variable-declaration.md`, `null-operators.md`, `truthy-falsy.md`, `template-literals.md` 8개(프레임워크·툴링 무관 코어 JS 언어 문서) 이동. `node/`가 Node.js 툴링, `nestjs/`가 프레임워크 전용 하위 카테고리인 것과 대칭되는 구조. `[[wikilink]]`는 파일명 기준 해석이라 본문 링크 수정 불필요, `wiki/index.md`의 `## JavaScript` 헤딩도 `## Node.js`/`## NestJS`와 동일한 패턴이라 변경 불필요

## 2026-08-24 16:08:18

- **수정**: `wiki/javascript/nestjs/nestjs-request-pipeline.md` — 각 컴포넌트 섹션(Guard/Pipe/Interceptor/Exception Filter)에 실제 적용 예시(`@UseGuards`/`@UsePipes`/`@UseInterceptors`/`@UseFilters`) 추가. `Reflector`에 각주 추가(정의·역할). `ExecutionContext`(§3.1, Interceptor에서는 §5.1로 참조만)·`ArgumentMetadata`(§4.3)·`CallHandler`(§5.1)·`ArgumentsHost`(§6.2, Guard에서는 §3.1로 참조만)를 각 컴포넌트 하위 항목으로 분리해 정리. 공유 타입(ExecutionContext/ArgumentsHost)은 한쪽에 전체 설명을 두고 반대쪽엔 상호 참조 링크만 남겨 중복 방지

## 2026-08-24 15:04:05

- **생성**: `wiki/javascript/nestjs/nestjs-request-pipeline.md` — 요청 파이프라인 4개 컴포넌트(Guard/Pipe/Interceptor/Exception Filter) 신규 문서. 공통 등록 범위(메서드/컨트롤러/전역 인스턴스/전역 프로바이더 `APP_*` 토큰)를 한 번만 정리한 뒤, 컴포넌트별로 구현 인터페이스·핵심 메서드·최소 예제를 기술. Guard는 `CanActivate`+Reflector 기반 역할 인가, Pipe는 내장 파이프 목록과 class-validator 검증, Interceptor는 `CallHandler`+RxJS 연산자(AOP), Exception Filter는 `HttpException` 계층·`ArgumentsHost`·`BaseExceptionFilter` 상속 포함. 출처: NestJS 공식 문서(Guards, Pipes, Interceptors, Exception filters)
- **수정**: `wiki/javascript/nestjs/nestjs-controllers.md` — §5.1~5.4 각 항목에 nestjs-request-pipeline 링크 추가, Related pages에 추가
- **수정**: `wiki/javascript/nestjs/nestjs.md` — Related pages에 nestjs-request-pipeline 추가
- **수정**: `wiki/index.md` — NestJS 섹션에 nestjs-request-pipeline 항목 추가

## 2026-08-24 14:55:39

- **수정**: `wiki/javascript/nestjs/nestjs-controllers.md` — §5 요청 파이프라인 데코레이터의 컴포넌트/데코레이터/역할 표를 제거하고, 본문에는 어떤 컴포넌트(Guard/Pipe/Interceptor/Exception Filter)가 있는지와 요청 처리 순서 시퀀스만 남김. 각 컴포넌트는 §5.1~5.4 하위 항목으로 분리해 역할·구현 인터페이스·적용 데코레이터 기술. Middleware는 데코레이터를 쓰지 않아 하위 항목 대상에서 제외, 시퀀스 다이어그램에만 유지

## 2026-08-24 14:41:14

- **수정**: `wiki/javascript/nestjs/nestjs.md` — 섹션 재편: 장단점(구 §2)을 마지막 §6으로 이동, 나머지(설치/프로젝트 구조/스크립트)를 §2~§4로 앞당김. §1 개요에 §1.1 제공 기능(DB 연동·설정·유효성 검사 등 기능 표), §1.2 객체지향 기반 설계(클래스·캡슐화·인터페이스·DIP), §1.3 왜 사용하는가 3개 소절 추가(OOP/FP/FRP 결합, out-of-the-box 아키텍처 목표는 공식 Introduction 문서 인용). §5 데코레이터는 클래스/HTTP/파라미터 데코레이터 상세 표·예제를 제거하고, 데코레이터 정의·`reflect-metadata` 필요성·사용 이유만 다루는 개념 설명으로 축소(상세는 nestjs-controllers/modules/dependency-injection로 위임). 섹션 번호 변경에 따라 문서 내 모든 §앵커 링크 갱신
- **수정**: `wiki/javascript/nestjs/nestjs-controllers.md` — nestjs.md 섹션 재편에 따라 §1.1 → §1.4 앵커 참조 갱신

## 2026-08-24 14:26:20

- **수정**: `wiki/javascript/nestjs/nestjs.md` — §3(구 "설치와 프로젝트 구조")를 §3 설치/§4 프로젝트 구조/§5 스크립트 3개 항목으로 분리(구 §4 데코레이터는 §6으로 재번호). §3에 CLI 기본 설치 dependencies·devDependencies 표 추가. §4 프로젝트 구조를 `src/`뿐 아니라 `test/`, `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `README.md`를 포함한 전체 트리·역할 표로 확장하고 main.ts 설명을 별도 소절로 분리. §5 스크립트에 기본 스크립트 표와 새 스크립트가 `package.json`의 `scripts` 필드에 정의된다는 설명 추가. 구조·의존성 목록은 `@nestjs/cli@11`로 실제 `nest new` 실행해 확인
- **수정**: `wiki/index.md` — nestjs 서술에 "설치", "스크립트" 항목명 반영

## 2026-08-21 18:00:06

- **생성**: `wiki/javascript/nestjs/nestjs-static-files.md` — NestJS 정적 파일 서빙 신규 문서. `ServeStaticModule`(설치, 디렉터리 구조, 주요 옵션, SPA 폴백과 컨트롤러 라우트 우선순위, `forRoot` 다중 경로 등록, React 빌드와 Nest 서버 빌드를 오케스트레이션하는 package.json 스크립트 구성)과 `app.useStaticAssets()`(MVC 보조 자산, Express/Fastify 시그니처 차이) 두 방식 정리. 빌드 스크립트 구성은 공식 문서에 없는 내용이라 각주로 출처 성격 명시. 출처: NestJS 공식 문서(Serve Static, MVC), `@nestjs/serve-static` 소스
- **수정**: `wiki/javascript/nestjs/nestjs.md` — Related pages에 nestjs-static-files 추가
- **수정**: `wiki/index.md` — NestJS 섹션에 nestjs-static-files 항목 추가

## 2026-08-21 17:26:23

- **생성**: `wiki/javascript/nestjs/nestjs-controllers.md` — NestJS 컨트롤러 데코레이터 신규 문서. `@Controller`(prefix, 서브도메인 host), HTTP 메서드 데코레이터(경로 배열, 상태 코드/헤더/리다이렉트, 라우트 와일드카드), 파라미터 데코레이터(`@Param`/`@Body`+DTO/`@Query`/`@Res` 라이브러리 전용 모드와 passthrough), 비동기 처리(Promise/Observable), Guard/Pipe/Interceptor/Exception Filter는 적용 데코레이터와 요청 처리 순서만 개략적으로 정리(상세는 별도 문서 예정). 출처: NestJS 공식 문서(Controllers, Guards, Pipes, Interceptors, Exception filters, Request lifecycle)
- **수정**: `wiki/javascript/nestjs/nestjs.md` — §4.2에 nestjs-controllers 링크 추가, Related pages에 추가
- **수정**: `wiki/index.md` — NestJS 섹션에 nestjs-controllers 항목 추가

## 2026-08-21 15:50:17

- **이동**: `wiki/node/` → `wiki/javascript/` 하위로 재편. `java/spring/`이 `java/` 하위 카테고리인 것과의 일관성을 위해 `node/`를 최상위에서 제거. `npm.md`/`npx.md`/`package-manager.md` → `wiki/javascript/node/`, `nestjs*.md` 4개 → `wiki/javascript/nestjs/`. `[[wikilink]]`는 파일명 기준 해석이라 본문 링크 수정 불필요
- **수정**: `wiki/index.md` — "## Node.js" 절에서 nestjs 항목 4개를 분리해 새 "## NestJS" 절로 이동(Java/Spring이 index에서 분리된 것과 동일 패턴). "## Node.js"에는 npm/npx/package-manager만 유지

## 2026-08-21 15:38:05

- **생성**: `wiki/node/nestjs-config.md` — NestJS Config 신규 문서. `@nestjs/config`(내부적으로 dotenv 사용) 설치와 `ConfigModule.forRoot()`(.env 경로, 전역 등록), `ConfigService`(get, infer 제네릭), 커스텀 설정 팩토리·네임스페이스(registerAs), forRoot/forFeature 역할과 차이, 검증(Joi/custom validate), 부트스트랩 시 설정(main.ts에서 app.get(ConfigService)로 포트 읽기, app 생성 이전 필요 시 process.env·--env-file·envVariablesLoaded 훅), Spring 설정(@Value/@ConfigurationProperties/PropertySource 우선순위)과 비교 정리. 출처: NestJS 공식 문서, 기존 Spring 설정 문서
- **수정**: `wiki/node/nestjs.md` — Related pages에 nestjs-config 추가
- **수정**: `wiki/java/spring/configuration-properties.md`, `wiki/java/spring/externalized-configuration.md` — Related pages에 nestjs-config 상호 링크 추가
- **수정**: `wiki/index.md` — Node.js 섹션에 nestjs-config 항목 추가

## 2026-08-21 15:02:38

- **생성**: `wiki/node/nestjs-dependency-injection.md` — NestJS DI 신규 문서. 토큰 개념, 데코레이터 기반 주입(생성자/프로퍼티/@Optional/비클래스 토큰), 커스텀 프로바이더 4종(useValue/useClass/useFactory/useExisting) 상세, 테스트 overrideProvider, 모듈 범위 요약([[nestjs-modules]] 링크), Provider Scope, 순환 의존성(forwardRef), Spring DI와 비교(컨테이너 범위·주입 방식·토큰 해석·의존성 교체 모델·순환 의존성 처리 방식 차이) 정리. 출처: NestJS 공식 문서(GitHub 원본 마크다운), Spring DI 문서
- **생성**: `wiki/node/nestjs-modules.md` — NestJS 모듈 신규 문서. @Module 메타데이터, Feature 모듈, provider 공유(exports/imports)와 재노출, 전역 모듈(@Global), 동적 모듈(forRoot/DynamicModule), 모듈에서의 DI 정리. 출처: NestJS 공식 문서
- **수정**: `wiki/node/nestjs.md` — §4.1 @Module/@Injectable 행에 nestjs-modules/nestjs-dependency-injection 링크 추가, Related pages에 두 문서 추가
- **수정**: `wiki/index.md` — Node.js 섹션에 nestjs-dependency-injection, nestjs-modules 항목 추가

## 2026-08-21 13:47:15

- **생성**: `wiki/node/nestjs.md` — NestJS 신규 문서. 개요(플랫폼 독립성, Express/Fastify 어댑터 비교), 장단점(정형화된 아키텍처 vs 학습 곡선·보일러플레이트, 선택 기준표), 설치와 프로젝트 구조(Nest CLI, 기본 파일 구성, package.json 핵심 의존성), 데코레이터(클래스/HTTP/파라미터/커스텀 데코레이터) 정리. DI는 별도 문서 예정으로 제외. 출처: NestJS 공식 문서(GitHub 원본 마크다운), Encore 비교 아티클
- **수정**: `wiki/index.md` — Node.js 섹션에 nestjs 항목 추가

## 2026-08-12 17:51:52

- **생성**: `wiki/dbms/partitioning.md` — RDBMS 파티셔닝 신규 문서. 개요(파티션 프루닝), 장단점, DBMS별 파티셔닝(Oracle MERGE류 INTERVAL/EXCHANGE PARTITION/로컬·글로벌 인덱스, PostgreSQL 선언적 파티셔닝/ATTACH·DETACH, MySQL 유니크 키·FK 제약), DBMS별 비교, 주의사항(파티션 키 선택, 행 이동, 핫 파티션 등) 정리. 출처: Oracle/PostgreSQL/MySQL 공식 문서
- **수정**: `wiki/index.md` — DBMS 섹션에 partitioning 항목 추가

## 2026-08-12 17:40:32

- **수정**: `wiki/dbms/upsert-merge.md` — 1장 공통 원칙에서 "매칭 조건은 유니크해야 한다"는 서술이 Oracle MERGE(유니크 제약 불필요)와 모순되어 수정. 결정성 보장 방식이 DBMS별로 다르다는 설명으로 대체(PostgreSQL·MySQL은 유니크 제약 요구, Oracle은 런타임 1:1 매칭 검사)

## 2026-08-12 17:32:32

- **생성**: `wiki/dbms/upsert-merge.md` — DBMS별 upsert/merge 신규 문서. upsert 개념·장단점(원자성, 왕복 감소 vs 락 확대, AUTO_INCREMENT 소모, 이식성 부족 등), Oracle MERGE(ORA-38104/ORA-30926), PostgreSQL INSERT ON CONFLICT(유니크 제약 누락/cardinality violation), MySQL ON DUPLICATE KEY UPDATE(오류 없이 침묵하는 사례) 정리. 출처: Oracle/PostgreSQL/MySQL 공식 문서
- **수정**: `wiki/index.md` — DBMS 섹션에 upsert-merge 항목 추가

## 2026-08-12 09:32:28

- **수정**: `wiki/java/common/thread-unsafe-utilities.md` — 1.1/2.1절 소제목을 "왜 thread-unsafe한가" → "원인"으로 단순화, 본문을 원인(메커니즘)과 결과(예외·오류) 두 문단으로 분리. 문단 내부 수동 줄바꿈 제거(단일 행 문단)

## 2026-08-12 09:26:45

- **수정**: `wiki/java/common/thread-unsafe-utilities.md` — CLAUDE.md 간결성 지시(불필요한 줄바꿈 지양) 재적용. 1.1/2.1절의 분절된 문단·목록을 맥락 단위 단일 문단으로 병합

## 2026-08-12 09:22:42

- **생성**: `wiki/java/common/thread-unsafe-utilities.md` — SimpleDateFormat/DateFormat, Calendar가 thread-unsafe한 원인(내부 가변 상태 공유)과 대안(DateTimeFormatter, ThreadLocal, FastDateFormat, java.time) 정리
- **수정**: `wiki/index.md` — Java 섹션에 thread-unsafe-utilities 항목 추가

## 2026-08-11 17:56:14

- **생성**: `wiki/javascript/lexical-scope.md` — 자바스크립트 렉시컬 스코프 신규 문서. 정적/동적 스코프 대비, 스코프 종류, 스코프 체인과 섀도잉, 환경 레코드 5종과 식별자 해석 절차, 클로저(모듈 패턴·반복문 var/let), this와 화살표 함수, with·eval 예외 작성. 출처: MDN, ECMAScript 명세
- **수정**: `wiki/javascript/variable-declaration.md` — Related pages에 lexical-scope 링크 추가
- **수정**: `wiki/index.md` — JavaScript 섹션에 lexical-scope 항목 추가

## 2026-08-11 17:38:47

- **수정**: `wiki/node/package-manager.md` — 구조 개편. "일회성 실행"을 "명령어" 하위 4.2로 이동(기존 대응표는 4.1), "선택 기준"을 "비교"로 변경 후 7.1 장단점 표·7.2 선택 기준으로 분리. workspaces·Corepack 항목 번호 조정(6→5, 7→6)
- **수정**: `wiki/node/npx.md`, `wiki/node/npm.md` — package-manager 절 번호 변경에 따른 상호 참조 갱신

## 2026-08-11 17:20:46

- **생성**: `wiki/node/npm.md` — npm 신규 문서. package.json 의존성·진입점·환경 필드, semver 범위(캐럿·틸드·x-range·프리릴리스), lockfile과 `npm ci` 비교, scripts(PATH·pre/post 훅·라이프사이클·환경변수), workspaces, 주요 명령어 작성. 출처: `raw/node/npm Docs.md`, npm Docs, node-semver
- **생성**: `wiki/node/npx.md` — npx 신규 문서. 로컬·원격 실행, 해석 순서, bin 이름 추론 규칙, `-c` 옵션, `npm exec` 인자 파싱 차이, npm v7 변경사항, 원격 코드 실행 주의 작성. 출처: `raw/node/npm Docs.md`, `raw/node/Introducing npx an npm package runner.md`, `raw/node/serve.md`
- **생성**: `wiki/node/package-manager.md` — Node 패키지 매니저 비교 신규 문서. node_modules 배치(hoisting과 phantom dependency, pnpm 심볼릭 링크·content-addressable store, Yarn PnP), lockfile, 명령어 대응표, `pnpm dlx`, workspaces 비교, Corepack(Node 25에서 제거), 선택 기준 작성. 출처: pnpm·Yarn·Corepack·npm 공식 문서
- **수정**: `wiki/index.md` — `## Node.js` 섹션 신규 추가, npm·npx·package-manager 3개 항목 등록

## 2026-08-11 17:04:12

- **점검**: wiki-lint 전체 실행 (200개 문서). 결과는 `logs/lint/report-20260811.md`
- **수정**: 깨진 외부 링크 교체 — `wiki/dbms/execution-plan.md`(Oracle 19c tgsql), `wiki/programming/cqrs.md`(Axon), `wiki/web/ssr-vs-csr.md`(Vercel), `wiki/java/crypto/cmp-bouncycastle.md`·`wiki/java/crypto/cert-path-validation.md`(BouncyCastle javadoc → javadoc.io)
- **수정**: `wiki/java/common/java-process-analysis-tools.md` — 소실된 honeymon.io 출처 제거
- **수정**: Sources에 `raw/` 경로 추가 — `wiki/java/spring/spring-event.md`, `wiki/java/spring/redis.md`, `wiki/java/excel.md`, `wiki/java/common/jni.md`
- **수정**: 태그 통일 — `wiki/javascript/template-literals.md`에서 `language` 제거, `wiki/java/test/good-test-practices.md`·`wiki/java/test/inverse-operation-testing.md`의 `best-practice` → `best-practices`
- **수정**: `wiki/java/common/gradle-application.md` — Shadow 플러그인 버전 표기를 `<version>` 플레이스홀더로 통일

## 2026-08-11 16:48:13

- **수정**: `wiki/javascript/var-let-const.md` → `wiki/javascript/variable-declaration.md` 파일명 변경, `title`에서 `(var, let, const)` 제거, `language` 태그 제거, 개요에 세 가지 선언 방법 존재 설명 추가, "2. 스코프"를 `var`(2.1)와 `let`/`const`(2.2) 항목으로 분리하고 예시도 각각 배치(`for`에 `let` 예시 추가)
- **수정**: `wiki/index.md` — JavaScript 섹션의 var-let-const 링크를 variable-declaration으로 변경

## 2026-08-11 15:19:24

- **생성**: `wiki/java/common/gradle-application.md` — Gradle 애플리케이션 실행 구성 신규 문서. mainClass 지정(application 플러그인, jar 매니페스트, JavaExec, Spring Boot 결정 순서), 클래스패스 구성(소스셋, 로컬 jar, 로컬 리포지토리), lib 구성 방식 4종(배포본/Class-Path/Fat jar/bootJar), `-jar`와 `-cp` 비양립 및 와일드카드 제약 작성. 출처: Gradle User Guide, Spring Boot Gradle Plugin, Shadow, JDK java 도구 문서
- **수정**: `wiki/index.md` — Java 섹션에 gradle-application 항목 추가

## 2026-08-10 17:52:00

- **생성**: `wiki/javascript/var-let-const.md` — var/let/const 신규 문서. 스코프, 호이스팅과 TDZ, 재선언/재할당, 전역 객체 프로퍼티, 선택 기준 작성. 출처: MDN
- **수정**: `wiki/index.md` — JavaScript 섹션에 var-let-const 항목 추가

---

## 2026-08-10 17:42:15

- **생성**: `wiki/java/common/jni.md` — Java JNI 신규 문서. Native 메서드(Java 선언/C 구현), 라이브러리 빌드와 로드(java.library.path vs LD_LIBRARY_PATH), 주의사항(라이브러리 이름, macOS quarantine 속성으로 인한 로드 실패) 작성. 출처: Oracle JNI Specification/System·javac 문서, 사용자 실측(quarantine 이슈)
- **수정**: `wiki/index.md` — Java 섹션에 jni 항목 추가

---

## 2026-08-10 17:25:03

- **수정**: `wiki/javascript/truthy-falsy.md` — `language` 태그 제거, 개요를 한 문단으로 병합, "3. Truthy 값" 항목 신규 분리(기존 Falsy 값 항목에서 truthy 설명 이동), Nullish와의 관계 문단 줄바꿈 정리
- **수정**: `wiki/javascript/null-operators.md` — `language` 태그 제거, 개요 예제 코드 블록 삭제 후 `===`/`==` 비교 설명을 별도 문단으로 분리, Short-circuiting·널 병합·널 병합 할당 도입부 문장 중간 줄바꿈 정리
- **수정**: `wiki/index.md` — truthy-falsy 항목 설명에 truthy 값 반영

---

## 2026-08-10 17:09:40

- **생성**: `wiki/javascript/truthy-falsy.md` — Truthy/Falsy 신규 문서. 8가지 falsy 값, nullish와의 관계(`??` vs `||`) 작성. `null-operators.md`에서 분리. 출처: MDN
- **수정**: `wiki/javascript/null-operators.md` — 개요 nullish 뒤 중복 괄호 제거, 문장 중간 줄바꿈 정리, 2·3·4번 항목명에 영문 병기(Optional Chaining/Nullish Coalescing/Logical Nullish Assignment), 널 병합 falsy 설명에 [[truthy-falsy]] 링크 추가
- **수정**: `wiki/index.md` — JavaScript 섹션에 truthy-falsy 항목 추가

---

## 2026-08-10 16:52:34

- **생성**: `wiki/javascript/template-literals.md` — 템플릿 리터럴(백틱) 신규 문서. 문법, 문자열 보간, 여러 줄 문자열, 이스케이프, 중첩, tagged template(raw 문자열, 이스케이프 시퀀스 완화) 작성. 출처: MDN
- **수정**: `wiki/index.md` — JavaScript 섹션에 template-literals 항목 추가

---

## 2026-08-07 13:49:17

- **수정**: `wiki/javascript/es-module.md` — "4. 모듈 해석"(확장자 필수, 디렉토리 자동 해석 없음), "5. 순환 참조"(live binding·TDZ, MDN 예시) 신규 섹션 추가, 이후 섹션 번호 재조정(브라우저 로딩 6, Node.js 사용 7, 장단점 8), Sources에 Node.js packages.html 추가
- **수정**: `wiki/javascript/commonjs.md` — 3.1 모듈 해석에 "folders as modules"(디렉토리의 index.js 자동 해석) 설명과 ESM 대조 문구 추가
- **수정**: `wiki/javascript/module-system.md` — 2.2 비교표에 "모듈 해석" 행 추가, 4.2 `require(esm)` 활성화 버전(Node.js 20.19.0/22.12.0) 명시, "4.3 패키지 진입점: exports/imports" 신규 작성(conditional exports, imports 필드, dual package hazard), Related pages에서 무관한 `[[null-operators]]` 링크 제거, Sources에 Node.js packages.html·릴리스 노트 추가
- **수정**: `wiki/index.md` — module-system·es-module 항목 설명에 exports/imports, 순환 참조 반영

---

## 2026-08-07 11:52:49

- **수정**: `wiki/javascript/es-module.md` — "4.1. 기본적으로 defer된다" 항목명을 "4.1. defer 동작"으로 축약. "2. 문법"을 2.1 import / 2.2 export / 2.3 기타(동적 import(), import.meta, import attributes, import map)로 재구성, 각 항목에 형태·역할 설명과 예시 보강

---

## 2026-08-07 09:54:26

- **수정**: `wiki/javascript/commonjs.md` — "2. 문법"을 2.1 require / 2.2 exports / 2.3 기타(module.id, require.cache, require.main 등 미포함 문법 추가)로 재구성, 각 항목에 역할 설명과 예시 보강. "3. 동작"과 "4. require() 동작 상세"를 "3. 동작"으로 통합하고 3.1 require 동작 / 3.2 exports 동작 하위 항목으로 재편

---

## 2026-08-06 18:07:11

- **수정**: `wiki/javascript/commonjs.md` — 개요에 등장 배경·용도(서버 환경 코드 캡슐화·재사용, module wrapper를 통한 비공개 스코프) 보강, 문법 언급 문구를 개요에서 "2. 문법" 항목 도입부로 이동
- **수정**: `wiki/javascript/es-module.md` — 개요에 등장 배경·용도(언어 표준 부재로 인한 서드파티 의존 → 표준화, 네이티브 로딩 최적화, 정적 구조 기반 트리쉐이킹) 보강, 문법 언급 문구를 개요에서 "2. 문법" 항목 도입부로 이동

---

## 2026-08-06 18:00:53

- **수정**: `wiki/javascript/commonjs.md` — 개요의 `[[module-system]]` 참고 문구 삭제, "4. require() 동작 상세"(모듈 해석·캐싱·순환 참조·exports 단축 표현) 신규 작성, "6. 장단점" 추가(트리쉐이킹 불가 판단 근거 각주 포함)
- **수정**: `wiki/javascript/es-module.md` — 개요의 `[[module-system]]` 참고 문구 삭제, "4. 브라우저에서 사용" → "4. 브라우저 스크립트 로딩"으로 개명, 동적 `import()` 설명 보강(Promise 반환·non-module 스크립트에서도 사용 가능), "6. 장단점" 추가(트리쉐이킹 가능 판단 근거 각주 포함)

---

## 2026-08-06 17:52:21

- **수정**: `wiki/javascript/module-system.md` — 1장 개요를 목록에서 문단 형식으로 변경(첫 문장에 모듈 시스템 도입 배경 보강, 상세 문서 참고 문구 제거), "2. 비교"를 "2. CommonJS vs ESM"으로 개명, 기존 4·5장(바닐라 JS 사용 가능 여부/Node.js 상호운용성)을 "4. 실행 환경"으로 통합해 4.1/4.2 하위 항목으로 재편

---

## 2026-08-06 17:46:04

- **수정**: `wiki/javascript/module-system.md` — 1장 개요를 표에서 목록 형식으로 변경, 상세 문서 참고 문구를 항목 끝으로 이동. 기존 2·3장(문법/동작 비교)을 "2. 비교" 하나로 통합해 2.1/2.2 하위 항목으로 재편. 4장(바닐라 JS 사용 가능 여부) 도입부를 "CommonJS는 불가능하지만 ES Module은 가능하다"로 단순화

---

## 2026-08-06 15:00:00

- **생성**: `wiki/javascript/commonjs.md` — CommonJS 상세: 문법, 동작(동기 로드, module wrapper, exports 스냅숏, this, top-level await 미지원), Node.js 설정
- **생성**: `wiki/javascript/es-module.md` — ES Module 상세: 문법, 동작(정적 분석·의존성 그래프, live binding, this, strict mode, top-level await), 브라우저 `<script type="module">` 사용법과 기본 defer 동작(동작 방식·이유·장점), `nomodule` 폴백, Node.js 설정
- **수정**: `wiki/javascript/module-system.md` — CommonJS/ES Module 상세 동작을 각 문서로 분리, 비교 표·CJS 전용 기능 대체 API·바닐라 JS 사용 가능 여부·Node.js 상호운용성 등 비교 중심 내용만 유지
- **수정**: `wiki/index.md` — [[commonjs]], [[es-module]] 추가, [[module-system]] 설명 수정

---

## 2026-08-06 14:04:26

- **생성**: `wiki/javascript/module-system.md` — 자바스크립트 모듈 시스템. CommonJS vs ES Module 표준 소속·문법·동작(동기/비동기, 정적/동적, 값 스냅숏 vs live binding, this, top-level await) 비교, CommonJS 전용 기능과 ESM 대체 API, 바닐라 자바스크립트(브라우저) 사용 가능 여부(CJS 불가/ESM 가능), Node.js 상호운용성
- **수정**: `wiki/index.md` — [[module-system]] 추가

---

## 2026-08-06 13:22:59

- **생성**: `wiki/java/crypto/jar-signing.md` — JAR 서명 개요. 구성 파일(MANIFEST.MF/.SF/.RSA·DSA·EC), keytool/jarsigner CLI 서명, Maven(maven-jarsigner-plugin)·Gradle(ant.signjar) 빌드 통합, JVM 검증 절차 4단계, 검증 실패 사례(재패키징·변조·jarsigner severe warning 코드표)
- **수정**: `wiki/java/common/fat-jar-signature-error.md` — Related pages에 [[jar-signing]] 추가
- **수정**: `wiki/index.md` — [[jar-signing]] 추가

---

## 2026-08-06 11:08:31

- **생성**: `wiki/java/common/fat-jar-signature-error.md` — Fat Jar 서명 파일(META-INF/*.SF/.RSA/.DSA) 충돌로 인한 SecurityException 트러블슈팅. 원인(서명 jar 재패키징 시 매니페스트 변경→다이제스트 불일치), 해결(Shadow 플러그인 자동 제외, Maven Shade 수동 filters, 내장 jar task 수동 exclude, relocate 대안)
- **수정**: `wiki/index.md` — [[fat-jar-signature-error]] 추가

---

