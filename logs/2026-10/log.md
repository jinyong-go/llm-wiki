# log

---

## 2026-10-26 15:27:25

- **이동**: `wiki/javascript/`의 공통 문서 12개를 `wiki/javascript/common/`으로 이동
- **수정**: `index.md` JavaScript 문서 목록을 공통 하위 절로 배치

## 2026-10-26 15:25:46

- **이동**: `wiki/typescript/` 문서 4개를 `wiki/javascript/typescript/`로 이동
- **이동**: `wiki/node/` 문서 3개를 `wiki/javascript/node/`로 이동
- **이동**: `wiki/nestjs/` 문서 13개를 `wiki/javascript/nestjs/`로 이동
- **수정**: `index.md` TypeScript·Node.js·NestJS 섹션을 JavaScript 하위로 변경

## 2026-10-26 14:23:30

- **수정**: `testcontainers.md` 실행 환경·의존성·설정을 환경 구성으로 묶고 Ryuk 정리를 생명주기로 이동, API 변경 표의 JUnit 4 항목 제거, FAQ(Docker 환경 감지·Docker 29 API 버전, Docker Hub 요청 제한, 컨테이너 내 실행, 시작 타임아웃, 연결 거부) 추가

## 2026-10-26 14:02:11

- **수정**: `testcontainers.md` 생성자·중첩 클래스·JDBC URL·서비스 식별 설명 정정, 생명주기와 Spring 구성 재배치, 문장·예시·설정 표 정리

## 2026-10-26 13:35:39

- **생성**: `testcontainers.md` Testcontainers 2.x(JUnit 5 기준) 의존성, 컨테이너 정의, 네트워크, 대기 전략, JUnit 5 생명주기, 컨테이너 공유, JDBC URL, Spring Boot 연동, Ryuk·설정, 1.x 차이
- **수정**: `java-testing-libraries.md` Testcontainers 항목에 [[testcontainers]] 링크 추가
- **수정**: `index.md` 테스트 섹션에 [[testcontainers]] 추가

## 2026-10-26 13:27:25

- **생성**: `mockwebserver.md` OkHttp MockWebServer(mockwebserver3 5.x, JUnit 5 기준) 의존성, 생명주기, 응답·Dispatcher, 요청 검증, 4.x 차이, HTTPS, FAQ
- **수정**: `java-testing-libraries.md` MockWebServer 항목에 [[mockwebserver]] 링크 추가
- **수정**: `index.md` 테스트 섹션에 [[mockwebserver]] 추가

## 2026-10-24 23:26:53

- **수정**: Git 문서 6개 구성 개선. commit·stash·fetch/pull/push의 반복 예시를 줄이고 branch 설정을 git-config로 모았으며 reset과 restore의 설명 범위를 상호 참조로 정리. commit diff 비교 대상·pull 기본 동작 서술 정정

## 2026-10-24 23:20:53

- **수정**: git 문서 4개 구성 개선(lint `report-20261024-git` 2단계). file-states 중복 상태 전환 표 삭제 및 다이어그램 보완, config useConfigOnly 예시 중복 정리·§6 제목 변경, log 중복 alias 제거, stash 중복 구분선 제거

## 2026-10-24 23:16:15

- **수정**: git 문서 14개 사실 정정(lint `report-20261024-git` 1단계). 템플릿 디렉터리 복사 대상, 태그 사전순 정렬, --prune-tags 조건, add -p a/d 범위, clone -b 태그 detached HEAD, useConfigOnly 사용법, diff @{u} 의미, merge --abort 한계, 경로 reset·revert 계수 정정. stash·reflog·gitignore·diff3 예시 수정, 단축 SHA 서술 통일, 프록시 해제 예시를 remote.<name>.proxy로 교체, 누락 출처 추가

## 2026-10-24 00:28:11

- **수정**: `docker-volume.md`의 볼륨 초기 파일 처리 설명을 기존 §2.1과 일치하도록 보완

## 2026-10-24 00:27:44

- **수정**: Docker 문서 도입부와 설명 흐름 정리. 네트워크 드라이버·마운트 비교표를 확인 가능한 동작 기준으로 재구성하고 Dockerfile 지시어 설명 보완

## 2026-10-24 00:23:08

- **수정**: Docker 문서 8개 사실·적용 범위 정정. VM 비교 수치 제거, containerd 저장 방식·네트워크 기본값·Dockerfile 지시어·user namespace 설명 보완

## 2026-10-24 00:17:34

- **수정**: docker 문서 12개 문체 정리(lint `report-20261024-docker` 3단계). '-다'체·도커 표기 통일, 강조 볼드·설명성 괄호·대시 연결·수사 표현 제거, 명령 문서 옵션 목록 정리, 축약어 원어 병기, ps virtual size·exec 기본 사용자·shell form 시그널·bind mount 가림 동작·macvlan 용도 서술 정정, netstat을 ss로 교체

## 2026-10-24 00:10:08

- **수정**: docker 문서 12개 구성 개선(lint `report-20261024-docker` 2단계). 제목·절 제목 축약, 개념 문서 개요 절 추가, 문서 간 중복 제거(네트워크 3개 문서 역할 분리, CoW·최적화·레이어·격리 원리·stats 단일화), security 절 재배치, stop·copy-up·entrypoint·네트워크 디버깅 다이어그램 추가, Sources 형식 통일, 태그 정리
- **수정**: `wiki/index.md` docker 항목 설명을 주제 수준으로 축약

## 2026-10-24 00:04:55

- **수정**: docker 문서 12개 사실 정정(lint `report-20261024-docker` 1단계). volume prune·rm -v 동작, ADD 원격 다운로드 권장, ARG 노출, ENTRYPOINT 덮어쓰기, containerd image store 기본값, 매니페스트·config 구분, docker0 서브넷, host 드라이버 지원 환경, overlay Swarm 필수·IPsec 암호화, macvlan 제약 원인, 컨테이너 상태 removing, USER 네임스페이스 적용 조건, userns 제한 사항, run·stop 옵션 정정. 성능 등급·크기 수치 각주 추가, network-commands 깨진 앵커 수정, dockerfile 미반영 출처 삭제

## 2026-10-23 23:56:44

- **수정**: DBMS 문서 10개 도입부와 설명 문단을 읽기 쉽게 정리하고, 실행 순서·복합 인덱스·upsert 설명의 문장 구성을 다듬음

## 2026-10-22 23:09:21

- **수정**: java/test 문서 12개 문체 정리(lint `report-20261022-java-test` 3단계). 대시 연결·본문 화살표·강조 볼드·이모지 제거, 정의형 목록 통일, 명사형 종결 서술형 전환, 근거 없는 권장 표현 정리, test-double·spock 추론 서술에 각주 추가

## 2026-10-22 23:02:05

- **수정**: java/test 문서 13개 구성 개선(lint `report-20261022-java-test` 2단계). 제목·절 제목 축약, 요약 절을 작성 규칙·선택 기준으로 정리, 중복 예시 제거, Sources·Related pages 형식 통일, mockserver 절 구분선 추가
- **수정**: `wiki/index.md` java/test 항목 설명을 주제 수준으로 축약

## 2026-10-22 22:53:27

- **수정**: java/test 문서 13개 사실 정정(lint `report-20261022-java-test` 1단계). Mockito doXxx 체이닝·final 모킹·doNothing 사용 사례, Spock Stub 카디널리티·final mock maker, Spy 정의, GCM 테스트 벡터, Test Desiderata·FIRST 서술, JMH Error 정의, starter-test 구성, Suite failIfNoTests, MockServer 버전, JUnit 버전 표기 정정. 문서 내 깨진 앵커 링크 수정
- **수정**: `junit-test-suite.md`, `junit-test-execution-order.md`, `java-testing-libraries.md` JUnit 4 내용 제거

## 2026-10-21 23:14:11

- **수정**: dbms 문서 10개 문체 정리(lint `report-20261021-dbms` 3단계). 제목 축약, 정의형 목록 통일, 강조 볼드·본문 화살표·대시 연결 제거, 명사형 종결 문장 서술형 전환, 근거 없는 권장 표현 정리

## 2026-10-21 23:10:25

- **수정**: dbms 문서 10개 구성 개선(lint `report-20261021-dbms` 2단계). 절 구분선·`§` 참조 통일, CLOB 인코딩 절을 저장 방식으로 이동, IN-list·OR expansion 절 분리, 통계 문서 절 순서 정렬, 데드락 순서도 추가, 중복 문장 정리, 접근 불가 출처를 Oracle Error Help로 교체
- **수정**: `wiki/index.md` DBMS 항목 설명을 주제 수준으로 축약

## 2026-10-21 23:04:48

- **수정**: dbms 문서 9개 사실 정정(lint `report-20261021-dbms` C1–C13, W1–W3)
	- `upsert-merge.md`: PostgreSQL `WHEN NOT MATCHED BY SOURCE` 지원 버전(17+), `ON CONFLICT` 잠금 범위, 비교표 MySQL 중복 매칭 항목
	- `sql-functions.md`: Oracle `SUBSTRING` 미지원
	- `optimizer-statistics.md`: MySQL 8.4 히스토그램 `AUTO UPDATE`
	- `partitioning.md`: MySQL `EXCHANGE PARTITION`, 파티셔닝 변형 유형
	- `clob-in-oracle.md`: CLOB 최대 크기, AL16UTF16 보충 문자 4바이트, 절 참조, `VARCHAR2` 선택 기준
	- `execution-plan.md`: MySQL `EXPLAIN ANALYZE` 대상 문장
	- `index-scan.md`: pg_hint_plan 로드 방식, IN-list 처리, Index Only Scan 설명
	- `concurrency-control.md`: PostgreSQL READ UNCOMMITTED 동작
	- `oracle-hints.md`: 근거 없는 권장 표현을 추론 각주로 전환

## 2026-10-21 22:52:59

- **수정**: git 문서 18개 문체 정리(lint `report-20261021-git` 3단계). 제목·절 제목의 대시 설명 제거, 강조 볼드·인용 블록·이모지 제거, 명사형 종결 문장 서술형 전환, 근거 없는 권장 표현 정리

## 2026-10-21 22:49:50

- **수정**: git 문서 18개 구성 개선(lint `report-20261021-git` 2단계). 개요 절 추가, 문서 간 중복을 링크로 대체, 흐름·상태 그림을 mermaid로 전환, 요약·실용 패턴 중복 절 정리, hooks 시점·mirror·`-s`/`-X ours`·stash 범위 등 사실 정정

## 2026-10-21 22:37:40

- **수정**: git 문서 14개 사실 정정(lint `report-20261021-git` C1–C25, W1)
	- `git-fetch-pull-push.md`: pull 기본 동작(fast-forward only), `--force-with-lease`·`--follow-tags` 설명
	- `git-tag.md`: lightweight tag 무시 명령, `--follow-tags` 설명
	- `git-detached-head.md`: unreachable reflog 보존 기간 30일
	- `git-file-states.md`: short status `D` 컬럼 의미, `git diff` 빈 출력 조건
	- `git-switch-restore.md`: tree-ish 지정 checkout의 restore 대응
	- `git-init.md`: Git 3.0 기본 브랜치 변경 예정, `.gitignore` 생성 예시
	- `git-branch.md`: `-d` 병합 판정 기준, `branch.autoSetupRebase` 설명
	- `git-clone.md`: single-branch 이후 fetch 동작, partial clone 예시 주석
	- `git-config.md`: 존재하지 않는 `https.proxy`·비내장 `merge.tool` 예시
	- `git-revisions.md`: 머지 부모·`~`/`^` 다이어그램, 범위 결과, `--short` 길이
	- `git-rebase.md`: merge 이력 다이어그램
	- `git-reset-revert.md`: `--hard` 복구 범위, 커밋 분리 예시
	- `git-internals.md`: annotated tag·SHA-1 설명, Pro Git Git Internals 출처 추가
	- `git-log.md`: `-S` 설명

## 2026-10-21 16:40:24

- **수정**: `kdf.md`의 비교표를 알고리즘별 설명으로 통합하고 비용 파라미터·salt·HKDF·PBKDF2 설명과 용도 구분 보완

## 2026-10-21 16:21:56

- **수정**: `kdf.md` 개요에 입력별 목적을 보완하고 선택 절을 용도 절로 변경해 알고리즘 설명 뒤로 이동
- **생성**: `kdf-java.md`로 Java 예제·구현 출처를 분리하고 두 문서의 관련 링크와 `wiki/index.md` 항목 갱신

## 2026-10-21 16:13:46

- **수정**: `timestamp-token.md`의 CMS 서명 검증 절 참조를 §5.2로 갱신

## 2026-10-21 15:59:31

- **수정**: `cms.md`의 주요 기능·활용 절 분리, 콘텐츠 구조·MAC 키 관리·검증 조건·호환성 설명 보강
- **이동**: `wiki/security/crypto/cms.md`를 `wiki/security/pki/cms.md`로 이동하고 `wiki/index.md`의 PKI 분류와 항목 설명 갱신

## 2026-10-20 18:00:44

- **수정**: security 문서 12개 문체 정리. 항목명·문장·제목의 대시 연결, 본문 화살표, 강조용 볼드 제거(`x509-certificate`, `cmp`, `timestamp-token`, `certificate-revocation`, `certificate-purpose`, crypto 5개, `jwt`, `oauth2`)

## 2026-10-20 17:54:47

- **수정**: 위키 전체 lint 2단계 반영. 문장형 요약 절 12개 삭제(`aop-transaction-order` 고유 내용은 본문으로 이동), 요약 표 절 16개 제목 변경, 45개 문서의 "n장·n절" 참조를 `§n`으로 통일, 인바운드 링크가 없던 23개 문서에 대한 Related pages 역링크 추가, git 문서 3개의 실용 패턴 절을 최상위로 이동

## 2026-10-20 17:29:19

- **수정**: `sso.md` 구성 정리. IdP-initiated의 unsolicited response 설명을 각주로 이동, SLO 약어 보완, OIDC·Kerberos 절을 SAML과 같은 구성 요소·흐름·로그아웃 구조로 재구성, Kerberos SSO 흐름도·SPNEGO·로그아웃 추가, 보안 절 문장 정리

## 2026-10-20 14:14:04

- **수정**: web 문서 문체·양식 정리. `cookie`, `session-vs-cookie`, `web-storage`, `load-balancer`, `reverse-proxy`, `restful-api-design`의 대시 연결 문장·기호·과도한 볼드 정리, 제목 축약, 요약 절 삭제, Sources·Related pages 형식 통일. `wiki/index.md` Web 항목 서술 정리

## 2026-10-20 13:53:38

- **수정**: web 문서 구성 개선. `cookie.md` 특징 절 분리·CHIPS 추가, `session-vs-cookie.md`를 서버 측 세션과 클라이언트 측 상태 비교로 재구성, `web-storage.md` 제목 변경·sessionStorage 범위·용량 초과 처리 보강, `load-balancer.md` 목적·장점 통합·세션 고정 절 정리, `reverse-proxy.md`에 Forwarded·XFF 신뢰 범위 추가, `restful-api-design.md` 결론 출처 보강·URI 규칙 관례 표시

## 2026-10-20 13:28:01

- **수정**: web 문서 lint 결과 반영. `cookie.md`의 SameSite 기본값·제3자 쿠키 현황, `session-vs-cookie.md`의 쿠키 삭제 제어, `web-storage.md`의 용량·IndexedDB API, `load-balancer.md`의 L4 동작·리버스 프록시 관계, `restful-api-design.md`의 422 명칭·문서 내 링크·MDN 경로 정정

## 2026-10-20 13:15:26

- **수정**: `wiki/web/cors-preflight.md`에 POST가 CORS-safelisted 메서드인 이유를 각주로 추가

## 2026-10-20 13:00:15

- **생성**: `wiki/web/cors-preflight.md`에 프리플라이트 발생 조건, 요청 형식, 응답 검사, 캐시, 서버 처리 정리
- **이동**: `wiki/security/web/cors.md`를 `wiki/web/cors.md`로 이동하고 프리플라이트 문서 링크 추가

## 2026-10-20 11:29:32

- **수정**: `wiki/security/web/csrf.md`에 상수 시간 비교의 의미와 타이밍 공격 완화 목적을 각주로 추가

## 2026-10-20 11:26:02

- **수정**: `wiki/security/web/oauth2.md`의 토큰·파라미터를 분리하고 scope·state·PKCE 파라미터를 개별 항목으로 정리. PKCE 정의를 보강하고 리소스 서버 구현 및 전용 출처 삭제

## 2026-10-20 11:13:22

- **수정**: `wiki/security/web/csrf.md`의 이중 제출 쿠키 동작·방어 원리를 보강. 단순 비교형의 쿠키 주입 취약점, 서명형의 세션 결합·HMAC 검증, CSRF 쿠키의 HttpOnly 설정을 명시

## 2026-10-20 11:00:44

- **수정**: `wiki/security/web/jwt.md`의 base64url 설명과 Header 제목을 정리하고 비공개 클레임 설명·예시를 보강. JWE 구조를 코드 블록으로 분리하고 장점·단점을 하위 항목으로 구분

## 2026-10-20 08:26:50

- **수정**: `wiki/security/crypto/` 7개 문서의 제목·항목 순서·문장을 정리. CMS 보호 범위·수신 처리, 해시 커밋먼트의 은닉 조건, HSM 운영, KDF 용도별 비용·salt 설명을 보완하고 ML-KEM·ML-DSA의 파라미터·사용 흐름을 앞쪽으로 이동. 암묵적 거부·t₀ 취급·JWE CBC-HMAC 설명 정정
- **수정**: `wiki/java/crypto/ml-kem-bouncycastle.md`의 암묵적 거부 설명과 변경된 절 참조를 갱신

## 2026-10-19 22:50:33

- **수정**: `wiki/programming/` 14개 문서의 구성·양식 정리. 7월 작성 문서(SOLID·GoF 패턴·CQRS)의 번호·구분선·표 형식을 통일하고 제목·목록의 대시 연결을 제거. 각주를 문서 최하단으로 옮기고 Related pages 보강. Adapter 예제 교체, Goetz 공식 LaTeX 전환, 리액티브 문서의 Virtual Threads 장 분리, JMeter 중복 서술·관련 문서 절 삭제, DFS 비교 절 삭제, 백트래킹 복잡도 각주 추가
- **수정**: `wiki/index.md`의 프로그래밍 항목을 주제 수준으로 축약

## 2026-10-19 22:48:02

- **수정**: `wiki/programming/` 4개 문서의 문서 간 충돌을 정리. Spring Security 필터 체인을 Chain of Responsibility, SLF4J를 Facade로 통일하고 Command 사용처를 `javax.swing.Action`으로 교체. `ApplicationEventPublisher`의 Observer·Mediator 분류와 `JdbcTemplate`의 template-callback 방식을 각주로 설명. DFS 공간 복잡도의 재귀형·반복형 기준을 명시

## 2026-10-19 22:47:14

- **수정**: `wiki/programming/` 8개 문서에 lint 결과(`logs/lint/report-20261019-programming.md`)의 사실 오류·근거 부족 항목을 반영. Decorator 실행 순서 주석, Servlet API·Hibernate·Spring Security 타입명, JDBC 추상 팩토리 설명, Prototype 깊은 복사 예제 컴파일 오류를 정정. CQRS의 트랜잭션 이벤트 리스너·Outbox, Axon 예제, 서버 측 검증 서술을 수정. SOLID 약어 유래·SRP 재정의·ISP 예시·DIP 서술, Vert.x·Flow 표, 가상 스레드 pinning 조건을 보완

## 2026-10-19 18:01:14

- **수정**: `wiki/security/web/` 10개 문서의 구성·문장 개선. CORS 설정 오류, CSRF Fetch Metadata·Spring Security 설정, XSS Trusted Types·CSP 설정, JWT 헤더 파라미터·명시적 타입, OAuth 확장 규격·리소스 서버 구현, OIDC 로그아웃·SAML 서명 래핑, WebAuthn Passkey, 재전송 방지 Redis 구현, 세션 Spring 설정 항목 추가
- **수정**: XSS 실행 예제를 클라이언트 렌더링 항목으로, JWT의 JWE를 서명 알고리즘 뒤로, 재전송 공격을 대상·방어·구현 순으로, 세션 하이재킹 공격 기법을 OWASP 분류 순으로 재배치. WebAuthn 벤더 목록 압축, 사례·각주·구분선 정리

## 2026-10-19 17:50:53

- **수정**: `wiki/security/web/cors.md`의 SOP 풀 이름과 요청·응답 헤더 설명을 보완. 개요·단순 요청 조건을 다듬고 Spring 경로 패턴을 복원. no-cors·응답 헤더 노출·오류 진단 항목 추가

## 2026-10-19 17:47:41

- **수정**: `wiki/security/crypto/cms.md` 구조 개편. 콘텐츠 타입 표와 구조 상세를 타입별 하위 항목으로 통합하고 DigestedData·EncryptedData·AuthenticatedData·AuthEnvelopedData 설명과 ASN.1을 보강. 규격 계보·알고리즘·상위 규격을 관련 규격 항목으로 이동
- **수정**: `wiki/security/pki/` 5개 문서에 lint 결과(`logs/lint/report-20261019-pki.md`)를 반영. 코드서명 HSM·SmartScreen 서술, CRL 갱신 주기, 다단계 중간 CA 설명을 정정하고 CMP 대화 잔재 문장을 삭제. 인증서 폐기·CMP 제목을 단순화하고 각주를 문서 최하단으로 이동. timestamp-token의 CMS 절 참조를 갱신

## 2026-10-19 17:26:20

- **생성**: `wiki/security/web/xss.md`에 XSS 유형별 예제, 출력 인코딩·HTML 정제·CSP·쿠키 방어, MySpace·Twitter·TweetDeck 사고 사례를 작성
- **수정**: `wiki/index.md`에 XSS 항목 추가

## 2026-10-19 17:18:36

- **수정**: `wiki/security/crypto/` 7개 문서에 lint 결과(`logs/lint/report-20261019.md`)를 반영. ML-DSA 서명 의사코드의 κ 증가 위치와 개인키 크기 공식, 근거 없는 서술을 정정하고 CMS detached 서명 설명을 RFC 5652에 맞춰 수정. 해시 함수의 SHA-3 권장·BLAKE3 표준·Git SHA-256 현황을 갱신하고 PBKDF2 출처를 RFC 8018로, SSLv3 설명을 정정. 각주를 문서 최하단으로 이동

## 2026-10-19 17:18:00

- **수정**: `wiki/security/web/` 9개 문서의 CORS·쿠키 전송, CSRF 조건, JWT 검증·폐기, OAuth PKCE·토큰 보관, SSO 흐름, WebAuthn Level 3 검증, 세션·재전송 방어 설명을 정정. 재전송 방지 Java 예제의 동시성·윈도우 크기를 수정하고 출처·제목·중복 요약을 정리
- **수정**: `wiki/index.md`의 웹 보안 항목을 주제 수준으로 축약

## 2026-10-15 22:47:28

- **수정**: `wiki/java/common/gc-monitoring.md` — GCTimeRatio·Unified Logging 기본값·JDK 8 옵션 대체·jcmd attach 조건을 정정. 도구 영향도와 지표 설명을 명확히 하고 Sources 링크를 Markdown으로 통일
- **수정**: `wiki/index.md` — GC 모니터링 항목의 주제 설명을 로그 분석과 진단으로 구체화

## 2026-10-15 22:42:31

- **수정**: `wiki/java/test/mockserver.md` — 개요를 기능 설명과 사용 목적으로 문단 분리. 3.2 제목을 MockServer 클라이언트 주입으로 구체화

## 2026-10-15 22:34:58

- **생성**: `wiki/java/common/gc-monitoring.md` — GC 모니터링 신규 문서. 지표(정지 시간, 처리량, 할당률 등), -Xlog 문법·권장 설정·로그 해석, jstat, jcmd(GC.heap_info, VM.log, PerfCounter), JFR, JMX·Micrometer, 주의사항. JDK 17 실측 출력 포함. `wiki/index.md` 링크 추가
- **수정**: `wiki/java/common/jvm-options.md` §4에 `[[gc-monitoring]]` 참조 추가, `gc.md`·`java-process-analysis-tools.md` Related pages 갱신

## 2026-10-15 22:31:46

- **수정**: `wiki/java/test/mockserver.md` — API 출처를 8.0.0으로 통일하고 JUnit·Spring 초기화 시점과 범위, 병렬 테스트의 고유 매처 사용, 비동기 요청 검증을 보완. 용어 설명과 Sources Markdown 링크 적용
- **수정**: `wiki/index.md` — MockServer 항목에 병렬 테스트 격리 주제 추가

## 2026-10-15 22:22:49

- **생성**: `wiki/java/test/mockserver.md` — MockServer 신규 문서. 의존성, JUnit 5 통합(@ExtendWith/@MockServerSettings 선택, 속성), Spring @MockServerTest, Expectation 매칭·횟수·우선순위, 검증, 주의사항, FAQ. `wiki/index.md` 링크 추가
- **수정**: `wiki/java/test/java-testing-libraries.md` — §5 통합/외부 의존성과 요약 표에 MockServer 추가, Sources·Related pages 갱신

## 2026-10-04 23:11:01

- **생성**: `wiki/programming/dynamic-programming.md` — 동적 계획법 신규 문서. 적용 조건, 탑다운·바텀업 비교, 설계 절차, 공간 최적화, 대표 유형(선형, 격자, 배낭, LIS, 두 문자열), LeetCode 문제 예시 7종. `wiki/index.md` 링크 추가
- **수정**: `wiki/programming/backtracking.md` — Related pages에 `[[dynamic-programming]]` 추가

## 2026-10-04 23:07:21

- **생성**: `wiki/programming/backtracking.md` — 백트래킹 신규 문서. 6개 절차 구조, 선택·재귀·되돌리기, 가지치기 기법, 복잡도, 완전 탐색·분기 한정 비교, N-Queens 탐색 공간, LeetCode 문제 예시 5종. `wiki/index.md` 링크 추가
- **수정**: `wiki/programming/dfs.md` — 7.5 백트래킹 위키 링크 및 Related pages에 `[[backtracking]]` 추가

## 2026-10-03 23:33:29

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 복잡도 항목에 $V$(정점 수), $E$(간선 수) 정의와 $O(V+E)$ 도출 근거(인접 리스트 길이 합), 인접 행렬 시 $O(V^2)$ 추가. 근거 각주 추가에 따라 기존 각주 번호 재정렬

## 2026-10-03 23:18:30

- **수정**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — 기존 위키 형식에 맞춰 재작성. 도입부를 개요로 통합, 하위 항목을 `###` 헤딩으로 변환, 문단 서술로 정리, Sources를 링크 형식으로 변경, 제목에 한글 번역명과 `programming` 태그 추가. DFS 간선 분류에 순방향·교차 간선 정의 추가

## 2026-10-03 23:11:09

- **생성**: `wiki/programming/bfs.md`, `wiki/programming/dfs.md` — BFS·DFS 신규 문서. BFS는 큐 기반 동작, 거리·경로 복원, 격자 BFS, 0-1 BFS 등 변형, 장단점, LeetCode 문제 예시 4종. DFS는 재귀·반복 구현, 시간 기록, 간선 분류, 활용(사이클 탐지, 위상 정렬, SCC, 브리지), 장단점, LeetCode 문제 예시 5종. `wiki/index.md` 프로그래밍 일반 섹션에 링크 추가

## 2026-10-01 16:45:35

- **생성**: `wiki/java/spring/jpa-exceptions.md` — Spring Data JPA 리포지터리 예외 신규 문서. 예외 변환 흐름, 발생 시점(flush·커밋), 유형별 매핑(무결성 제약, save()와 PK 중복, 동시성·락, 조회 결과, API 오용, SQL·리소스), DataAccessException 계층, 처리 기준으로 구성. `wiki/index.md` Spring 섹션에 링크 추가
