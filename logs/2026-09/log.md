# log

---

## 2026-09-03 11:24:27

- **수정**: `wiki/dbms/index-scan.md` — §3 PostgreSQL 도입부에 `pg_hint_plan` 설치 안내(shared_preload_libraries)와 힌트 주석 사용 예시 추가. §7.3에 INLIST ITERATOR와 OR expansion의 차이(동일 컬럼은 항상 INLIST ITERATOR, OR expansion은 서로 다른 컬럼·테이블 대상이며 분기별 독립 최적화 가능), UNION ALL을 쓰는 이유(LNNVL로 분기 간 상호배타성 확보해 중복 없이 결합), 12.2 CONCATENATION→UNION-ALL 연산자 변경, OR_EXPAND/NO_EXPAND 힌트 내용 추가. Sources에 Oracle Optimizer 블로그 추가

## 2026-09-02 23:54:28

- **삭제**: `wiki/react/react-ssr.md`, `wiki/web/ssr-vs-csr.md` — 불필요 판단에 따라 삭제. `wiki/react/`가 해당 문서만 있던 디렉터리라 함께 제거
- `wiki/index.md`에서 두 항목과 빈 "React" 섹션 제거, `wiki/web/reverse-proxy.md` Related pages에서 `[[ssr-vs-csr]]` 링크 제거(깨진 링크 방지)

## 2026-09-02 23:46:40

- **이동**: `wiki/java/spring/*` → `wiki/spring/*`(39개), `wiki/javascript/nestjs/*` → `wiki/nestjs/*`(13개), `wiki/javascript/react/*` → `wiki/react/*`(1개), `wiki/javascript/typescript/*` → `wiki/typescript/*`(4개), `wiki/javascript/node/*` → `wiki/node/*`(3개) — 물리 디렉터리를 `wiki/index.md`의 기존 카테고리 분류(Spring/NestJS/React/TypeScript/Node.js가 Java/JavaScript와 대등한 최상위 섹션)에 맞춰 최상위로 승격. 사이드바 트리(NavTree)·breadcrumb이 물리 디렉터리 기준으로 렌더링되어 기존에는 index.md 분류와 어긋났음
- **이동**: `wiki/javascript/common/*` → `wiki/javascript/*`(12개) — 위 이동 후 `common`이 javascript 하위 유일한 서브디렉터리로 남아 구분 의미가 없어져 평탄화
- wikilink는 파일명 기준으로 해석되어 본문·index.md 링크 수정 불필요. 파일명·본문 변경 없음

## 2026-09-02 13:02:54

- **생성**: `wiki/java/common/netty-implementation.md` — Netty 구현 신규 문서(공식문서 기반: netty.io User Guide/Reference-Counted Objects, Netty 4.1 API Javadoc 다수). §2 부트스트랩과 채널(EventLoopGroup 구현체, ServerBootstrap option/childOption 구분, shutdownGracefully), §3 ChannelInitializer, §4 핸들러 작성(ChannelInboundHandlerAdapter vs SimpleChannelInboundHandler 자동 release 차이, @Sharable 상태 없음 요건, exceptionCaught), §5 길이 기반 프레이밍 코덱(LengthFieldBasedFrameDecoder/LengthFieldPrepender), §6 ByteBuf 메모리 관리(ctx.alloc(), 참조 카운팅 릴리스 책임, ResourceLeakDetector PARANOID 테스트 권고), §7 ChannelFuture/ChannelFutureListener(I/O 스레드 내 sync()/await() 데드락 경고), §8 IdleStateHandler, §9 주의할 점 요약 표. [[netty]]를 전제로 코드 예시 중심 작성
- **수정**: `wiki/java/common/netty.md` — Related pages에 `[[netty-implementation]]` 상호 링크 추가
- **수정**: `wiki/index.md` — Java 섹션에 `[[netty-implementation]]` 항목 추가

## 2026-09-02 11:32:50

- **수정**: `wiki/java/common/netty.md` — 전체 구조를 §1 개요/§2 배경/§3 원리/§4 구성 요소/§5 기타로 재편. TCP 메시지 경계 문제를 원래 위치(구성요소 뒤)에서 §2.2 배경으로 이동(구성요소보다 먼저 나와야 할 배경 문제이자, ChannelPipeline 미소개 시점의 forward-reference 문제 해결), 버전 이력을 §1 개요에서 §5.2 기타로 이동. §3.2→§3.3, §3.2→§4.1, §2.2→§4.2 간 연결 문장 보강. 문구 수정: Selector에 전체 패키지 경로(`java.nio.channels.Selector`) 명시, §2.1 Nginx 괄호 표기를 문장에 통합, §2.2 대시(—) 연결 문장을 분리
- **수정**: `wiki/index.md` — netty 항목 설명을 새 구조(배경/원리/구성 요소)에 맞춰 갱신

## 2026-09-02 11:19:37

- **생성**: `wiki/java/common/netty.md` — Netty 신규 문서(공식문서 기반: netty.io User Guide/Native Transports, Netty 4.1 API Javadoc, Netty 4.2 Migration Guide, Netty 5.0.0 상태 공지, Java SE Selector Javadoc). §1 개요(4.1/4.2 병행 유지, 5.x 폐기), §2 Blocking I/O의 한계(thread-per-connection 모델과 확장성 병목), §3 논블로킹 I/O와 멀티플렉싱(Selector), §4 Reactor 패턴과 EventLoop(Channel-EventLoop 1:1 고정과 스레드 안전성), §5 Channel(TCP 커넥션 추상화, boss/worker 그룹 분리), §6 ChannelPipeline/ChannelHandler(inbound/outbound 흐름), §7 ByteBuf(readerIndex/writerIndex, 참조 카운팅), §8 EventLoop 블로킹 금지 원칙(EventExecutorGroup 분리), §9 메시지 프레이밍 문제, §10 Native Transport(epoll/kqueue/io_uring 개요). 코드 예시 없이 아키텍처·동작원리 중심으로 작성
- **수정**: `wiki/index.md` — Java 섹션에 `[[netty]]` 항목 추가

## 2026-09-02 09:13:53

- **이동/수정**: `wiki/dbms/clob.md` → `wiki/dbms/clob-in-oracle.md` — Oracle 전용 문서임을 명시하기 위해 파일명·title("CLOB"→"CLOB in Oracle") 변경. §8 타 DBMS 비교를 §7로 이동, 기존 §7 기타를 §8로 재배치(§7.1→§8.1, §7.2→§8.2), 내부 교차 참조("(7.1)"→"(8.1)", "7. 기타"→"8. 기타") 갱신
- **수정**: `wiki/index.md` — `[[clob]]`→`[[clob-in-oracle]]`로 링크 갱신, 설명 순서를 문서 순서에 맞춰 조정

## 2026-09-02 09:11:11

- **수정**: `wiki/dbms/clob.md` — 직전 §7.2 재구성(§7.2.1 Oracle/§7.2.2 PostgreSQL 분리) 되돌림. §7.2 제목을 "저장 크기 측정"→"실측 검증"으로 원복, PostgreSQL 하위 항목·관련 Sources·각주[^5] 제거. Oracle 전용 실측 검증 내용만 유지

## 2026-09-02 09:09:05

- **수정**: `wiki/dbms/clob.md` — §7.2 제목을 "실측 검증"→"저장 크기 측정"으로 변경하고 기존 Oracle 내용을 §7.2.1로 이동, §7.2.2 PostgreSQL 신설(char_length/octet_length/pg_column_size로 문자 수·압축 전 바이트·실제 저장 바이트 구분 측정, EXTENDED 저장 전략에서 압축으로 인해 octet_length보다 작게 나올 수 있다는 점, 테이블당 TOAST 테이블 하나를 여러 컬럼이 공유하는 특성), Sources에 PostgreSQL Database Object Size Functions 문서 추가

## 2026-09-02 08:45:41

- **수정**: `wiki/dbms/clob.md` — §7.2 실측 검증 신설(user_lobs/user_segments 기반 세그먼트 크기 조회 시 in-row 누락·파티션 테이블·CHUNK 반올림 주의점, DBMS_LOB.GETLENGTH 기반 문자 수 대비 비율 검증 방법), §8 타 DBMS 비교 신설(PostgreSQL text·MySQL TEXT/LONGTEXT는 CLOB과 달리 내부 재인코딩 없이 설정된 인코딩 그대로 가변폭 저장한다는 공식문서 근거 비교표), Sources에 PostgreSQL/MySQL 문서 6건 추가, tags에 postgresql/mysql 추가
- **수정**: `wiki/index.md` — clob 항목 설명에 "실측 검증, PostgreSQL/MySQL 비교" 추가

## 2026-09-01 23:21:14

- **생성**: `wiki/dbms/clob.md` — CLOB 신규 문서(Oracle 공식 문서 기반). §1 개요, §2 특징(최대 크기, 트랜잭션 지원, 로케이터), §3 저장 방식(in-row/out-of-row 약 4000바이트 임계값과 CHUNK 할당 단위, BasicFile vs SecureFile), §4 저장 옵션(CREATE TABLE LOB 절 옵션 표), §5 DBMS_LOB 패키지(주요 함수, 행 잠금이 필요한 이유, GETLENGTH 문자/바이트 차이와 CONVERTTOBLOB 우회 예시), §6 선택 기준(VARCHAR2/CLOB/NCLOB/BLOB), §7.1 내부 저장 인코딩(AL32UTF8→AL16UTF16 변환에 따른 영문 2배 증가·아시아 문자 약 30% 감소, Globalization Support Guide §6.5.3 원문 각주)
- **수정**: `wiki/index.md` — DBMS 섹션에 `[[clob]]` 항목 추가

## 2026-09-01 11:38:34

- **수정**: `wiki/java/common/gradle-shadow.md` — title을 "Gradle Shadow 플러그인"→"Gradle Shadow"로 축약, 문장 내 대시(—) 연결 구문을 단문으로 분리(§1/§4.1/§4.3/§6), §7 Minimize에 `minimize.exclude`와 §4.2 `dependencies.exclude`의 동작 방향 차이(축소 대상 제외 vs jar에서 완전 제거) 설명 추가
- **수정**: `wiki/index.md` — `[[gradle-shadow]]` 항목 설명에서 "플러그인" 표현 제거해 title과 통일

## 2026-09-01 10:42:07

- **생성**: `wiki/java/common/gradle-shadow.md` — Gradle Shadow 플러그인 신규 문서(Shadow 공식 문서 gradleup.com/shadow 기반). §1 개요(플러그인 ID 이관 배경, 버전별 최소 Gradle/Java/플러그인 ID 호환성 표), §2 기본 동작(자동 구성 항목, CLI 옵션), §3 application 플러그인 통합(runShadow, 배포 Task), §4 의존성 구성(소스 Configuration 변경, 필터링, 로컬/비-jar 의존성), §5 JAR 내용 병합(duplicatesStrategy, 서비스 파일 병합, 콘텐츠 필터링), §6 패키지 relocate, §7 minimize(R8 포함)
- **수정**: `wiki/index.md` — Java 섹션에 `[[gradle-shadow]]` 항목 추가
