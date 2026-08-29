---
title: LDAP
updated: 2026-07-22 14:38:24
tags:
  - ldap
  - directory
  - authentication
  - protocol
---

## 1. 개요

**LDAP**(Lightweight Directory Access Protocol)은 트리 구조로 저장된 디렉터리 정보에 접근하는 프로토콜이다(RFC 4511). X.500 DAP(Directory Access Protocol)의 경량화 버전으로, X.500 데이터·서비스 모델을 따른다.

디렉터리 서버(DSA, Directory System/Server Agent)는 엔트리의 트리로 데이터를 저장한다는 점에서 행(row)·열(column) 기반 관계형 DB와 다르며, 일종의 NoSQL DB로 분류되기도 한다. 각 연산은 원자적으로 처리되고, 클라이언트-서버 간 요청·응답은 동기 처리를 강제하지 않는다.

## 2. 디렉터리 구조

### 2.1. DIT(Directory Information Tree)

디렉터리 데이터는 계층적 트리(DIT)로 구성된다. 트리의 각 노드가 하나의 **엔트리(entry)**다.

### 2.2. 엔트리(Entry)

엔트리는 세 요소로 구성된다.
- **DN(Distinguished Name)** — 엔트리를 유일하게 식별하는 이름, DIT 내 위치를 나타냄
- **속성(attribute)** 집합
- **objectClass** 집합

### 2.3. DN과 RDN

DN은 파일시스템 경로와 유사하지만 **왼쪽에서 오른쪽으로 갈수록 트리 루트에 가까워진다**(파일시스템 경로와 반대 방향). DN은 0개 이상의 **RDN**(Relative Distinguished Name)을 쉼표로 연결한 것이다.

```
uid=john.doe,ou=People,dc=example,dc=com
```

- 각 RDN은 `속성=값` 쌍(예: `uid=john.doe`)이며, `+`로 여러 쌍을 묶으면 다중값 RDN(예: `cn=John Doe+mail=john.doe@example.com`)이 된다.
- 최좌측 RDN을 흔히 해당 엔트리의 RDN이라 부르고, 그 값은 엔트리 자신에 속성으로 존재해야 한다.
- RDN이 0개인 DN을 **null DN**이라 하며, 서버 기능·버전 등을 조회하는 특수 엔트리 **root DSE**를 가리킨다.
- DIT 최상단 엔트리의 DN을 **naming context**(suffix)라 한다.
- 값에 포함된 공백(시작/끝)·`#`·`"`·`+`·`,`·`;`·`<`·`>`·`\`는 이스케이프가 필요하다(RFC 4514).

### 2.4. 속성(Attribute)

속성은 **속성 타입**(스키마에 OID·이름·구문(syntax)·매칭 규칙 정의) + **값**으로 구성된다. 다중값 허용 여부, 사용자 속성/운영 속성(서버 설정·상태용) 구분도 스키마에서 정의된다.

### 2.5. objectClass

objectClass는 엔트리가 가질 수 있는 속성 타입의 집합을 정의하는 스키마 요소다. 모든 엔트리는 엔트리 종류(사람/그룹/장치 등)를 나타내는 **구조적(structural) objectClass** 하나를 가지며, 추가 특성을 위한 **보조(auxiliary) objectClass**를 여러 개 가질 수 있다. objectClass는 필수 속성(MUST)과 선택 속성(MAY) 목록을 갖는다.

### 2.6. OID(Object Identifier)

OID는 점으로 구분된 숫자열(예: `1.2.840.113556.1.4.473`)로, 속성 타입·objectClass·컨트롤·확장 요청 등 프로토콜 요소를 유일하게 식별한다. 스키마 요소는 보통 OID 대신 사람이 읽을 수 있는 이름도 함께 갖는다.

## 3. 오퍼레이션

LDAP은 10가지 기본 오퍼레이션을 정의한다.

| 분류 | 오퍼레이션 | 설명 |
|---|---|---|
| 인증/제어 | Bind | 클라이언트 연결의 인증 신원 설정 |
| | Unbind | 연결 종료 |
| | Abandon | 진행 중인 요청 처리 중단 요청 |
| 조회 | Search | 조건에 맞는 엔트리 검색 |
| | Compare | 엔트리가 특정 속성값을 갖는지 확인 |
| 변경 | Add | 엔트리 생성 |
| | Delete | 엔트리 삭제 |
| | Modify | 엔트리 속성 변경(add/delete/replace/increment) |
| | Modify DN | 엔트리 DN 변경(이동/이름변경) |
| 기타 | Extended | 표준 오퍼레이션 외 확장 처리 요청 |

### 3.1. Modify 타입

- **add** — 속성(또는 값) 추가
- **delete** — 속성 전체 또는 지정 값 삭제(값 미지정 시 속성 전체 삭제)
- **replace** — 값 집합을 완전히 교체(값 미지정 시 속성 삭제)
- **increment** — 정수 속성값 증감

## 4. 검색

### 4.1. 검색 스코프

| 스코프 | 별칭 | 대상 |
|---|---|---|
| baseObject | base | base DN 엔트리만 |
| singleLevel | one, onelevel | base DN 바로 하위(자신 제외) |
| wholeSubtree | sub | base DN + 하위 전체 |
| subordinateSubtree | | base DN 제외한 하위 전체 |

### 4.2. 검색 필터 종류

presence(`attr=*`), equality(`attr=value`), substring(`attr=*value*`), greater-or-equal(`attr>=value`), less-or-equal(`attr<=value`), approximate match(`attr~=value`), extensible match, 그리고 이들을 조합하는 AND(`&`)·OR(`|`)·NOT(`!`).

## 5. LDIF

**LDIF**(LDAP Data Interchange Format)는 디렉터리 엔트리·변경 요청을 텍스트로 표현하는 포맷이다.

```ldif
dn: uid=john.doe,ou=People,dc=example,dc=com
objectClass: inetOrgPerson
uid: john.doe
cn: John Doe
sn: Doe
mail: john.doe@example.com
```

## 6. 인증과 보안

### 6.1. Bind 인증 방식

- **Simple bind** — DN(신원) + 패스워드. 평문 전송이므로 TLS 없이는 사용하지 않는다.
  - **Anonymous** — DN·패스워드 모두 빈 문자열.
  - **Unauthenticated** — DN은 있고 패스워드는 빈 문자열(취약, 비활성 권장).
  - **Authenticated** — DN·패스워드 모두 값 존재.
- **SASL**(RFC 4422) — 확장 가능한 인증 프레임워크로, Kerberos(GSSAPI) 등 다양한 메커니즘을 LDAP에 연결 가능.

### 6.2. 전송 보안과 포트

| 방식 | 포트 | 설명 |
|---|---|---|
| LDAP(평문) | 389 | 기본, 암호화 없음 |
| LDAPS | 636 | 연결 시작부터 TLS(SSL) |
| LDAP + StartTLS | 389 | 평문 연결 후 TLS로 업그레이드 |

## 7. LDAP URL

LDAP URL은 서버·특정 엔트리·검색 조건을 하나의 문자열로 표현한다. 주로 리퍼럴(referral)에 사용된다.

```
ldap://dir.example.com:389/dc=example,dc=com?cn,mail?sub?(uid=john.doe)
```

## 8. 명령행 조회 예시

```bash
ldapsearch -x -H ldap://dir.example.com:389 \
  -D "uid=admin,dc=example,dc=com" -w secret \
  -b "dc=example,dc=com" -s sub "(uid=john.doe)" cn mail
```

## 9. 요약

- LDAP은 X.500 DAP의 경량 버전으로, 엔트리를 트리(DIT)로 저장하는 디렉터리 접근 프로토콜(RFC 4511)이다.
- 엔트리 = DN + 속성 + objectClass. DN은 RDN을 쉼표로 연결하며 왼쪽일수록 하위 노드다.
- 오퍼레이션은 Bind/Unbind/Abandon, Search/Compare, Add/Delete/Modify/ModifyDN, Extended로 구성된다.
- 인증은 Simple bind(평문, TLS 필수)와 SASL(확장 프레임워크)로 나뉘며, 전송 보안은 LDAPS(636) 또는 StartTLS(389)로 확보한다.

---
## Sources
- RFC 4511 — LDAP: The Protocol: https://datatracker.ietf.org/doc/html/rfc4511
- RFC 4513 — LDAP: Authentication Methods and Security Mechanisms: https://datatracker.ietf.org/doc/html/rfc4513
- RFC 4514 — LDAP: String Representation of Distinguished Names: https://www.rfc-editor.org/rfc/rfc4514
- ldap.com — Basic LDAP Concepts: https://ldap.com/basic-ldap-concepts/
- ldap.com — LDAP DNs and RDNs: https://ldap.com/ldap-dns-and-rdns/
- ldap.com — LDAP Operation Types: https://ldap.com/ldap-operation-types/
- ldap.com — The LDAP Bind Operation: https://ldap.com/the-ldap-bind-operation/

---
## Related pages
- [[ldap-java]] — Java LDAP 연동: JNDI·Spring LDAP(LdapTemplate/ODM) 예시
- [[oauth2]] — 웹 애플리케이션 인가 프레임워크(LDAP과 다른 계층의 인증 수단)
- [[sso]] — SSO 개념, Kerberos와 LDAP의 관계(§5.3)
