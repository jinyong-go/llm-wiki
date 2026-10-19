---
title: SSO
updated: 2026-10-19 18:01:14
tags:
  - web
  - sso
  - authentication
  - saml
  - oidc
  - kerberos
---

## 1. 개요

SSO(Single Sign-On)는 사용자가 한 번 인증하면, 이후 여러 독립된 서비스(애플리케이션)에 재로그인 없이 접근할 수 있게 하는 인증 모델이다. 연합 신원(federated identity)에서는 서비스가 별도 신원 제공자를 신뢰해 인증 결과를 수용한다. SSO와 신원 연합은 관련되지만 동일한 개념은 아니다.

핵심은 인증(누구인지 확인)과 개별 서비스 접근을 분리하는 것이다. 사용자는 한 곳에서만 인증하고, 그 인증 결과(assertion·ticket·token)를 여러 서비스가 신뢰해 세션을 만든다.

---

## 2. 모델

| 역할 | 설명 |
|---|---|
| IdP(Identity Provider) | 사용자를 인증하고 신원 정보를 발급하는 주체 |
| SP(Service Provider) / RP(Relying Party) | IdP가 발급한 신원 정보를 신뢰해 접근을 허용하는 서비스. SAML은 SP, OIDC는 RP로 부름 |
| 신뢰 관계(trust) | IdP와 SP/RP가 사전에 맺어둔 관계(인증서 교환, 클라이언트 등록 등). 신뢰 관계가 없으면 발급된 신원 정보를 검증할 수 없음 |

SAML Web Browser SSO는 시작 지점에 따라 다음 흐름을 지원한다. OIDC의 제3자 로그인 시작은 4장에서 구분한다.

- SP-initiated: 사용자가 SP 리소스에 먼저 접근 시도 → 로그인 세션이 없으면 SP가 IdP로 리다이렉트 → 인증 후 IdP가 사용자를 SP로 되돌려보냄
- IdP-initiated: 사용자가 IdP에 이미 로그인된 상태에서 SP로 가는 링크를 클릭 → IdP가 신원 정보를 만들어 SP로 바로 전달

---

## 3. SAML 2.0

### 3.1. 구성 요소

| 구성 | 내용 |
|---|---|
| Assertion | IdP가 발급하는 XML 문서. Authentication(인증 사실)·Attribute(속성)·Authorization Decision(인가 결정) 3종 statement를 담음 |
| Protocol | Assertion을 주고받는 요청/응답 규약. 대표적으로 Authentication Request Protocol(인증 요청), Single Logout Protocol(단일 로그아웃) |
| Binding | Protocol 메시지를 실제 전송 프로토콜에 얹는 방법. HTTP Redirect, HTTP POST, HTTP Artifact, SOAP 등 |
| Profile | Assertion·Protocol·Binding을 특정 시나리오에 맞게 조합한 것. 대표적으로 Web Browser SSO Profile |

### 3.2. SP-initiated SSO

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자(브라우저)
    participant SP as Service Provider
    participant IdP as Identity Provider

    U->>SP: 리소스 접근 시도(로그인 세션 없음)
    SP-->>U: HTTP 302 리다이렉트(AuthnRequest, HTTP Redirect Binding)
    U->>IdP: GET /SSO (SAMLRequest, RelayState)
    IdP->>U: 로그인 화면(세션 없을 시)
    U->>IdP: 자격증명 제출
    Note over IdP: 로그인 세션 생성, 서명된 Assertion 포함 Response 생성
    IdP-->>U: HTML Form(SAMLResponse, RelayState): HTTP POST Binding
    U->>SP: POST /ACS (SAMLResponse)
    Note over SP: 서명 검증, Assertion 처리, 로컬 세션 생성
    SP-->>U: 요청했던 리소스 반환
```

- SP는 최초 요청 URL을 로컬 상태로 저장해두고, IdP를 거쳐 돌아온 뒤 RelayState로 원래 리소스 위치를 복원한다.
- AuthnRequest(SP→IdP)에는 Redirect/POST/Artifact Binding을, Response(IdP→SP)에는 POST/Artifact Binding을 쓸 수 있으며 양쪽 Binding을 다르게 조합할 수 있다.
- POST Binding으로 전달되는 Assertion은 반드시 전자서명되어야 한다.

### 3.3. IdP-initiated SSO

사용자가 IdP에 이미 로그인된 상태에서 IdP가 제공하는 SP 바로가기 링크를 클릭하면, SP로의 AuthnRequest 없이 IdP가 곧바로 서명된 Assertion을 담은 Response를 SP로 보낸다. 요청과 응답을 연결하는 `InResponseTo`가 없으므로, SP는 unsolicited response 수용 정책과 재사용 방지 검사를 별도로 적용해야 한다.

### 3.4. Single Logout

SLO는 IdP와 참여 SP의 세션을 종료하는 프로파일이며 HTTP Redirect·POST·SOAP 바인딩을 지원한다. 프론트채널은 브라우저를 경유하고, SOAP 백채널은 서버 간 세션 식별 정보로 로그아웃을 처리할 수 있다. 프론트채널에서는 브라우저 이탈로 일부 처리가 중단될 수 있다. 전파 실패와 부분 로그아웃을 고려해 서비스별 세션 만료 정책도 유지한다.

---

## 4. OpenID Connect

OIDC는 OAuth 2.0 위에 얹은 인증 계층이다. OAuth 2.0만으로는 "무엇을 할 수 있는가"(인가)만 다루고 "누구인가"(인증)를 표준화하지 않는데, OIDC가 이를 채운다. OAuth2 자체의 역할·플로우·PKCE·보안 고려사항은 [[oauth2]] 참고.

| 용어 | 의미 |
|---|---|
| OP(OpenID Provider) | OIDC를 구현한 OAuth 2.0 Authorization Server |
| RP(Relying Party) | OIDC를 사용하는 OAuth 2.0 Client |
| ID Token | 인증 사실을 담은 JWT. OIDC가 OAuth2에 추가하는 핵심 산출물 |

인증 요청 시 `scope`에 `openid`를 포함한다. Authorization Code 흐름에서는 RP가 코드를 토큰 엔드포인트에서 교환해 Access Token과 ID Token을 받는다.

제3자 로그인 시작에서는 OP나 포털이 RP의 로그인 시작 엔드포인트로 사용자를 보낸다. RP는 전달된 발급자 정보를 검증하고 OP에 인증 요청을 시작한다. SAML IdP-initiated처럼 요청하지 않은 ID Token을 바로 수용하는 흐름과는 다르다.

ID Token 주요 클레임(모두 JWT 클레임, 상세 구조는 [[jwt]] 참고)

| 클레임 | 필수 여부 | 의미 |
|---|---|---|
| `iss` | REQUIRED | 발급자(OP) Issuer Identifier |
| `sub` | REQUIRED | 사용자를 나타내는 Subject Identifier |
| `aud` | REQUIRED | 대상 RP의 client_id |
| `exp` / `iat` | REQUIRED | 만료 시각 / 발급 시각 |
| `auth_time` | 조건부 REQUIRED | 실제 인증이 이뤄진 시각 |
| `nonce` | 흐름에 따라 필수 | Code 흐름에서는 선택 사항이지만, 요청에 포함했다면 응답 값의 존재와 일치를 검증 |
| `acr` / `amr` | OPTIONAL | 인증 컨텍스트 등급 / 사용된 인증 방식(비밀번호, OTP 등) |

ID Token은 원칙적으로 JWS로 서명하며 선택적으로 서명 후 JWE로 암호화한다. OIDC Core는 Code 흐름에서 등록 시 명시적으로 요청한 경우 `alg=none`을 허용하지만, 일반 구현은 서명된 ID Token을 요구하도록 구성한다. RP는 OP의 설정 정보(엔드포인트 위치, 서명키 등)를 보통 OpenID Connect Discovery로 얻는다.

### 4.1. 로그아웃

OIDC는 SAML SLO에 대응하는 로그아웃 규격을 별도로 정의한다.

| 규격 | 방식 |
|---|---|
| RP-Initiated Logout 1.0 | RP가 사용자를 OP의 `end_session_endpoint`로 보내 OP 세션 종료를 요청. `id_token_hint`, `post_logout_redirect_uri` 사용 |
| Front-Channel Logout 1.0 | OP가 브라우저에서 각 RP의 로그아웃 URI를 iframe으로 호출 |
| Back-Channel Logout 1.0 | OP가 각 RP에 서명된 Logout Token(JWT)을 서버 간 POST로 전송 |

프론트채널 방식은 브라우저의 서드파티 콘텐츠 차단으로 iframe에서 RP 세션 쿠키를 받지 못할 수 있다[^2]. 백채널 방식은 브라우저에 의존하지 않지만, RP가 `sid`·`sub`로 로컬 세션을 찾아 무효화할 수 있도록 세션 매핑을 저장해야 한다.

---

## 5. Kerberos

### 5.1. 개념

Kerberos(RFC 4120)는 신뢰할 수 있는 제3자(trusted third party)가 공유 비밀키 암호화로 개방된(안전하지 않은) 네트워크에서 신원을 검증하는 프로토콜이다.

- AS(Authentication Server): 클라이언트에게 TGT(Ticket-Granting Ticket)를 발급
- TGS(Ticket-Granting Server): TGT를 제시받아 특정 서비스용 서비스 티켓을 발급
- Ticket: 클라이언트 신원과 세션 키를 담아 서버의 키로 암호화한 자격증명. 서버만 열어볼 수 있음
- 세션 키: 클라이언트-서버 간 공유되는 임시 키. 이후 통신 인증·암호화에 사용
- Authenticator: 클라이언트가 티켓 재사용(replay)을 막기 위해 세션 키로 암호화해 함께 보내는 타임스탬프 포함 정보

AS와 TGS는 논리적으로 구분되는 서비스이며 KDC(Key Distribution Center)가 이를 제공한다.

### 5.2. SSO

사용자는 로그인 시 AS에 한 번만 인증해 TGT를 발급받는다. 이후 다른 서비스에 접근할 때마다 비밀번호를 다시 묻지 않고, 보유한 TGT를 TGS에 제시해 그 서비스 전용 티켓을 받아 접근한다. Windows Active Directory 환경의 도메인 로그인이 대표적인 구현 사례다.

### 5.3. LDAP

Kerberos는 인증 프로토콜이고 LDAP은 디렉터리 접근 프로토콜로 계층이 다르다. Active Directory 등에서는 LDAP 디렉터리가 계정·그룹 정보를 저장하고, Kerberos가 그 계정에 대한 인증을 처리하는 식으로 함께 쓰인다. LDAP 자체의 Bind 인증·구조는 [[ldap]] 참고.

---

## 6. 프로토콜 비교

| | SAML 2.0 | OpenID Connect | Kerberos |
|---|---|---|---|
| 데이터 포맷 | XML(Assertion) | JSON/JWT(ID Token) | 바이너리 티켓(ASN.1) |
| 기반 | 독립 프로토콜 | OAuth 2.0 확장 | 독립 프로토콜(대칭키 기반) |
| 주 전송 | 브라우저 리다이렉트/POST | 브라우저 리다이렉트 + 백채널 토큰 교환 | 네트워크 프로토콜(비-HTTP, 주로 사내망) |
| 주 사용처 | 기업용 웹 SSO(B2B, 엔터프라이즈 SaaS 연동) | 웹/모바일 앱 로그인, 소셜 로그인 | 사내 인트라넷(AD 도메인 로그인) |
| 신원 정보 | 서명된 XML Assertion | 서명된 JWT(ID Token) | 암호화된 티켓 |

---

## 7. 보안

- 재사용 방지: SAML은 유효기간과 Assertion ID의 재사용을 검사하고, 요청 기반 흐름에서는 `InResponseTo`도 검증한다. OIDC는 요청에 바인딩된 nonce 등을 검증한다. Kerberos는 Authenticator의 시각 검사와 replay cache를 함께 사용하며, 프로토콜 자체가 재사용을 방어하는 경우에만 캐시 생략을 검토할 수 있다.
- 서명·암호화: 적용 프로파일과 등록 정책이 요구하는 서명을 검증한다. 암호화를 사용하는 경우에도 대상·발급자·유효기간 검증을 생략하지 않는다.
- 정확한 대상 검증: SAML은 `Audience`, OIDC는 `aud` 클레임으로 이 토큰이 자신을 대상으로 발급됐는지 반드시 확인
- 세션 고정 방지: SP/RP는 SSO로 로그인 성공 후 반드시 로컬 세션 식별자를 새로 발급(세션 고정 공격 방어)
- Single Logout의 한계: 여러 SP에 걸친 로그아웃은 프론트채널 방식에 의존하는 한 완전한 보장이 어려우므로, 민감한 서비스는 짧은 세션 수명·재인증 정책을 병행
- XML 서명 래핑(XSW): SAML 응답에 서명된 Assertion을 남긴 채 위조 Assertion을 추가하면, 서명 검증 대상과 애플리케이션이 읽는 요소가 달라질 수 있다. 서명 검증에 사용된 요소만 처리하고 스키마 검증과 검증된 라이브러리를 사용한다[^1].

---

## Sources
- [OASIS SAML 2.0 Profiles §4.1, §4.4](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf)
- [OASIS: SAML V2.0 Technical Overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [OpenID Foundation: OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [RFC 4120: The Kerberos Network Authentication Service (V5)](https://datatracker.ietf.org/doc/html/rfc4120)
- [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- [OpenID Connect Front-Channel Logout 1.0](https://openid.net/specs/openid-connect-frontchannel-1_0.html)
- [OpenID Connect Back-Channel Logout 1.0](https://openid.net/specs/openid-connect-backchannel-1_0.html)
- [Somorovsky et al., On Breaking SAML (USENIX Security 2012)](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/somorovsky)

---

## Related pages
- [[oauth2]]
- [[jwt]]
- [[ldap]]
- [[webauthn]]
- [[session-hijacking]]

---

[^1]: Somorovsky et al.(2012)은 다수 SAML 프레임워크에서 XSW로 인증 우회가 가능했음을 보고함. 대응 방식은 같은 논문의 권고를 요약.
[^2]: OpenID Connect Front-Channel Logout 1.0의 "User Agents Blocking Access to Third-Party Content" 항목에 근거함.
