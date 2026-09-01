# log

---

## 2026-09-01 23:21:14

- **생성**: `wiki/dbms/clob.md` — CLOB 신규 문서(Oracle 공식 문서 기반). §1 개요, §2 특징(최대 크기, 트랜잭션 지원, 로케이터), §3 저장 방식(in-row/out-of-row 약 4000바이트 임계값과 CHUNK 할당 단위, BasicFile vs SecureFile), §4 저장 옵션(CREATE TABLE LOB 절 옵션 표), §5 DBMS_LOB 패키지(주요 함수, 행 잠금이 필요한 이유, GETLENGTH 문자/바이트 차이와 CONVERTTOBLOB 우회 예시), §6 선택 기준(VARCHAR2/CLOB/NCLOB/BLOB), §7.1 내부 저장 인코딩(AL32UTF8→AL16UTF16 변환에 따른 영문 2배 증가·아시아 문자 약 30% 감소, Globalization Support Guide §6.5.3 원문 각주)
- **수정**: `wiki/index.md` — DBMS 섹션에 `[[clob]]` 항목 추가

## 2026-09-01 11:38:34

- **수정**: `wiki/java/common/gradle-shadow.md` — title을 "Gradle Shadow 플러그인"→"Gradle Shadow"로 축약, 문장 내 대시(—) 연결 구문을 단문으로 분리(§1/§4.1/§4.3/§6), §7 Minimize에 `minimize.exclude`와 §4.2 `dependencies.exclude`의 동작 방향 차이(축소 대상 제외 vs jar에서 완전 제거) 설명 추가
- **수정**: `wiki/index.md` — `[[gradle-shadow]]` 항목 설명에서 "플러그인" 표현 제거해 title과 통일

## 2026-09-01 10:42:07

- **생성**: `wiki/java/common/gradle-shadow.md` — Gradle Shadow 플러그인 신규 문서(Shadow 공식 문서 gradleup.com/shadow 기반). §1 개요(플러그인 ID 이관 배경, 버전별 최소 Gradle/Java/플러그인 ID 호환성 표), §2 기본 동작(자동 구성 항목, CLI 옵션), §3 application 플러그인 통합(runShadow, 배포 Task), §4 의존성 구성(소스 Configuration 변경, 필터링, 로컬/비-jar 의존성), §5 JAR 내용 병합(duplicatesStrategy, 서비스 파일 병합, 콘텐츠 필터링), §6 패키지 relocate, §7 minimize(R8 포함)
- **수정**: `wiki/index.md` — Java 섹션에 `[[gradle-shadow]]` 항목 추가
