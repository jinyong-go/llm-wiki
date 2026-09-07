# log

---

## 2026-09-07 09:02:35

- **생성**: `wiki/java/common/bitwise-operators.md` — 비트 연산자 신규 문서(Oracle Java Tutorials, JLS SE21 §15.19/§15.22, Integer API 기반). 1장 비트 논리 연산자(&/|/^/~), 2장 시프트 연산자(<<,>>,>>>)와 시프트 거리 마스킹(0x1f/0x3f), 3장 타입 승격(단항 승격, 시프트의 독립 승격), 4장 복합 대입, 5장 활용 패턴(마스킹·플래그 설정/해제/토글), 6장 Integer/Long 비트 유틸리티 메서드
- **수정**: `wiki/index.md` — Java 섹션에 `[[bitwise-operators]]` 항목 추가

## 2026-09-06 00:10:51

- **점검**: wiki-lint 링크 점검 실행(238개 문서, 위키링크 1,561건·고유 242종, Sources 웹 URL 855종 고유). 실제 깨진 위키링크 1건, 웹 링크 깨짐 0건(403 80건은 봇 차단 오탐 확인)
- **수정**: `wiki/javascript/fetch-api.md` — 대응 페이지 없는 `[[XMLHttpRequest]]` 위키링크를 `` `XMLHttpRequest` `` 코드 스팬으로 전환
- **생성**: `logs/lint/report-20260906.md` — 점검 결과 보고서

## 2026-09-06 00:00:38

- **생성**: `wiki/security/web/session-hijacking.md` — Session Hijacking 신규 문서(OWASP Session Management Cheat Sheet, Firesheep 사례 기반). 1장 개요([[csrf]]와의 구분), 2장 공격 기법(세션 스니핑/예측/무차별 대입/세션 고정/클라이언트 사이드 탈취/노출), 3장 방어 기법(세션 ID 엔트로피, 전 구간 TLS, HttpOnly·SameSite, 세션 ID 재발급, idle/absolute 타임아웃, 클라이언트 속성 바인딩, URL 노출 금지), 4장 실제 사례(Firesheep, 2010)
- **수정**: `wiki/web/cookie.md` — 5장 표의 "세션 하이재킹 (XSS 경유)"·"Session Fixation" 두 행을 `[[session-hijacking]]` 링크 한 행으로 축약, Related pages에 `[[session-hijacking]]`·`[[csrf]]` 추가
- **수정**: `wiki/index.md` — Security > Web에 `[[session-hijacking]]` 항목 추가

## 2026-09-05 23:49:03

- **생성**: `wiki/security/crypto/hash-function.md` — 해시 함수(단방향 암호화) 신규 문서(NIST FIPS 180-4/202, SP 800-185, RFC 9155/7693, HAIFA·BLAKE2 논문 기반). 1장 개요(암호화와의 구분), 2장 원리(요구 성질, 내부 구조 — Merkle–Damgård와 length-extension 공격, HMAC 방어 원리, 스펀지, HAIFA/트리), 3장 주요 알고리즘 비교(MD5/SHA-1/SHA-2/SHA-3/BLAKE), 4장 주요 활용 사례(무결성 검증, 디지털 서명, HMAC, 패스워드 저장, 블록체인, 중복 제거, 커밋먼트), 5장 보안 고려사항
- **수정**: `wiki/index.md` — Security > Crypto에 `[[hash-function]]` 항목 추가

## 2026-09-04 23:10:34

- **생성**: `wiki/security/web/csrf.md` — CSRF 신규 문서(OWASP CSRF Prevention Cheat Sheet, OWASP CSRF, Wikipedia 기반). 1장 개요, 2장 성립 조건과 원리(2.1 GET vs POST, 공격 예시 포함), 3장 방어 기법(Synchronizer Token, Double Submit Cookie, SameSite 쿠키, Origin/Referer 검증, Custom Header), 4장 로그인 CSRF, 5장 실제 사고 사례(Netflix/ING Direct/YouTube/uTorrent/멕시코 은행 라우터/TikTok)
- **수정**: `wiki/index.md` — Security > Web에 `[[csrf]]` 항목 추가

## 2026-09-04 17:00:33

- **생성**: `wiki/security/crypto/padding-oracle-attack.md` — Padding Oracle Attack 신규 문서(OWASP WSTG, Vaudenay/Rizzo·Duong 논문, Microsoft 보안 권고, POODLE/Lucky13 자료 기반). 1장 개요(적용 범위), 2장 원리(PKCS#7, CBC 복호화 구조, 바이트 단위 복원 절차), 3장 방어(AEAD 전환, Encrypt-then-MAC, 상수 시간 처리, 에러 응답 통일, 검증된 라이브러리 사용, 레거시 프로토콜 비활성화), 4장 탐지 방법(OWASP WSTG 절차), 5장 실제 사례(ASP.NET MS10-070, POODLE, Lucky13)
- **수정**: `wiki/index.md` — Security > Crypto에 `[[padding-oracle-attack]]` 항목 추가

## 2026-09-03 22:36:42

- **생성**: `wiki/security/web/sliding-window.md` — Sliding Window(Anti-Replay Window) 신규 문서(RFC 4303/RFC 6479, RFC 6347, RFC 3711 기반). §1 개요, §2 구조(ESN 포함), §3 판정 규칙, §4 비트 시프트 구현(4.1 Java 예제 — 64비트 long 단일 워드), §5 RFC 6479 블록 기반 순환 비트맵 개선(5.1 Java 예제 — 32비트 워드 32개), §6 활용 예시(IPsec/DTLS/SRTP)
- **수정**: `wiki/security/web/replay-attack.md` — 5장(Sliding Window)을 상세 구조·판정 규칙·RFC 6479 서술에서 요약 문단 + `[[sliding-window]]` 링크로 축약. Sources에서 RFC 6479 제거(본문에서 더 이상 직접 언급 안 함), Related pages에 `[[sliding-window]]` 추가
- **수정**: `wiki/index.md` — Security > Web에 `[[sliding-window]]` 항목 추가, `[[replay-attack]]` 설명을 축약된 5장 내용에 맞게 수정

## 2026-09-03 22:26:11

- **생성**: `wiki/security/web/replay-attack.md` — Replay Attack 신규 문서(RFC 4303/RFC 6479, OWASP REST Security Cheat Sheet, Packetlabs 가이드 기반). 1장 개요(정의·대상), 2~4장 Nonce/타임스탬프/Nonce+타임스탬프 조합(각 기법의 원리·한계), 5장 시퀀스 번호 기반 Sliding Window(구조·판정 규칙·RFC 6479 비트맵 개선)
- **수정**: `wiki/index.md` — Security > Web에 `[[replay-attack]]` 항목 추가

## 2026-09-03 22:16:18

- **이동**: `wiki/security/crypto/*`(9개) 재분류 → `wiki/security/crypto/*`(cms, hsm, kdf, ml-dsa, ml-kem 5개 잔류), `wiki/security/pki/*`(cmp, certificate-revocation, x509-certificate, timestamp-token 4개 신설)
- **이동**: `wiki/web/{cors,jwt,oauth2,sso}.md` → `wiki/security/web/*` — 보안 프로토콜/토큰 문서를 security 하위로 통합. `cookie`/`session-vs-cookie`는 보안 외 일반 서술 비중이 커 web에 유지
- **수정**: `wiki/index.md` — `## Security`를 `### Crypto`/`### PKI`/`### Web` 하위 섹션으로 재편, `## Web`에서 이동된 4개 항목 제거. wikilink는 파일명 기준 해석되어 본문 링크 수정 불필요

## 2026-09-03 22:12:41

- **이동**: `wiki/linux/security/*`(openssl-*.md 9개) → `wiki/linux/openssl/*` — 디렉터리에 OpenSSL 문서만 남아 용도에 맞게 개명
- **이동**: `wiki/linux/security/linux-file-permissions.md` → `wiki/linux/filesystem/linux-file-permissions.md` — 파일시스템 권한 주제로 기존 `filesystem` 서브디렉터리(df/du/inode 등)에 합류
- **이동**: `wiki/crypto/*`(8개) → `wiki/security/crypto/*` — `wiki/java/crypto`(Java 전용 크립토 문서) 서브디렉터리 명명 패턴과 통일. `wiki/web`의 보안 관련 문서(cookie/cors/jwt/oauth2/sso 등)는 이동 대상 아님
- **수정**: `wiki/index.md` — `## Crypto` 섹션 헤더를 `## Security`로 변경(항목 목록은 동일). wikilink는 파일명 기준으로 해석되어 본문 링크 수정 불필요

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
