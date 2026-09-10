---
title: Java WebAuthn — java-webauthn-server·Spring Security 구현 예시
updated: 2026-09-10 22:26:07
tags:
  - java
  - security
  - webauthn
  - fido2
  - spring-security
---

## 1. 개요

WebAuthn 개념(등록/인증 Ceremony, Attestation, Authenticator 분류 등)은 [[webauthn]] 참조. 이 문서는 Java RP 서버에서 Yubico **java-webauthn-server**로 등록·인증을 구현하는 예시이며, 클라이언트는 브라우저 표준 API를 사용한다.

`start*`가 생성한 요청 객체(challenge 포함)는 세션 등 서버 측 저장소에 보관했다가 `finish*`에 그대로 넘긴다. `finish*`는 클라이언트가 보낸 서명 응답이 이 요청과 일치하는지 검증하므로, 요청 자체를 클라이언트가 되돌려주는 값으로 대체할 수 없다 — challenge는 재전송([[webauthn]] §10) 방지의 근거이고, rpId·userVerification 요구치·allowCredentials 등 나머지 필드도 검증에 그대로 쓰인다.

---

## 2. Yubico java-webauthn-server

이 라이브러리로 등록·인증 엔드포인트와 Credential 저장 로직을 직접 구현한다.

### 2.1. 의존성

```gradle
dependencies {
    implementation("com.yubico:webauthn-server-core:2.9.0")
}
```

### 2.2. RelyingParty 구성

**RelyingPartyIdentity**는 RP 자체의 식별 정보(RP ID·표시 이름)를 담는 불변 값 객체로, WebAuthn `create()` 옵션의 `rp` 필드([[webauthn]] §3.1)에 대응한다.

**RelyingParty**는 등록·인증 Ceremony 전체를 수행하는 최상위 진입점 객체다. RelyingPartyIdentity·`CredentialRepository`·허용 origin 등을 조합해 구성하며, `startRegistration()`/`finishRegistration()`/`startAssertion()`/`finishAssertion()`을 제공해 옵션 생성과 응답 검증을 전담한다.

```java
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import java.util.Set;

RelyingPartyIdentity rpIdentity = RelyingPartyIdentity.builder()
    .id("example.com")              // RP ID([[webauthn]] §2)
    .name("Example Service")
    .build();

RelyingParty rp = RelyingParty.builder()
    .identity(rpIdentity)
    .credentialRepository(credentialRepository)
    .origins(Set.of("https://example.com"))
    .build();
```

`CredentialRepository`는 Credential 저장소를 추상화하며 RP가 직접 구현한다.

```java
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import java.util.Optional;
import java.util.Set;

public interface CredentialRepository {
    Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username);
    Optional<ByteArray> getUserHandleForUsername(String username);
    Optional<String> getUsernameForUserHandle(ByteArray userHandle);
    Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle);
    Set<RegisteredCredential> lookupAll(ByteArray credentialId);
}
```

`getCredentialIdsForUsername()`은 `excludeCredentials`·`allowCredentials` 구성에, `lookup()`은 서명 검증용 공개키와 `signCount` 조회에 쓰인다.

### 2.3. 등록

**(a) 서버 — 옵션 발급**([[webauthn]] §3.1)
```java
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.ResidentKeyRequirement;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;

PublicKeyCredentialCreationOptions request = rp.startRegistration(
    StartRegistrationOptions.builder()
        .user(UserIdentity.builder()
            .name("alice")
            .displayName("Alice")
            .id(userHandle)                 // ByteArray, 최대 64B
            .build())
        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
            .residentKey(ResidentKeyRequirement.REQUIRED)
            .userVerification(UserVerificationRequirement.REQUIRED)
            .build())
        .build());

session.setAttribute("regRequest", request.toJson());
return request.toCredentialsCreateJson();   // {"publicKey": {...}}
```

**(b) 클라이언트 — `create()` 호출**
```js
const options = await fetch("/webauthn/register/start", { method: "POST" }).then(r => r.json());
const credential = await navigator.credentials.create({
  publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options.publicKey),
});
await fetch("/webauthn/register/finish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(credential.toJSON()),
});
```
`parseCreationOptionsFromJSON()`과 `toJSON()`이 base64url ↔ `ArrayBuffer` 변환을 대신한다. 미지원 브라우저에서는 `challenge`, `user.id`, `excludeCredentials[].id`를 직접 디코딩해야 한다.

**(c) 서버 — 검증·저장**
```java
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.exception.RegistrationFailedException;

var request = PublicKeyCredentialCreationOptions.fromJson(
    (String) session.getAttribute("regRequest"));
try {
    RegistrationResult result = rp.finishRegistration(FinishRegistrationOptions.builder()
        .request(request)
        .response(PublicKeyCredential.parseRegistrationResponseJson(responseJson))
        .build());

    // RP 구현: 검증된 Credential(공개키·signCount)을 저장소에 기록
    credentialRepository.save(username, userHandle,
        result.getKeyId().getId(),      // Credential ID
        result.getPublicKeyCose(),      // COSE 공개키
        result.getSignatureCount());    // signCount 초기값([[webauthn]] §5)
} catch (RegistrationFailedException e) {
    // challenge·origin·RP ID·서명·attestation 검증 실패
}
```
[[webauthn]] §3의 검증 항목은 `finishRegistration()`이 수행하므로 RP 코드는 결과 저장만 담당한다.

### 2.4. 인증

**(a) 서버 — 옵션 발급**([[webauthn]] §4.1)
```java
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.data.UserVerificationRequirement;

AssertionRequest request = rp.startAssertion(
    StartAssertionOptions.builder()
        .username("alice")   // 생략 시 allowCredentials가 비어 discoverable credential 탐색([[webauthn]] §8)
        .userVerification(UserVerificationRequirement.REQUIRED)
        .build());

session.setAttribute("authRequest", request.toJson());
return request.toCredentialsGetJson();
```

**(b) 클라이언트 — `get()` 호출**
```js
const options = await fetch("/webauthn/login/start", { method: "POST" }).then(r => r.json());
const assertion = await navigator.credentials.get({
  publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options.publicKey),
});
await fetch("/webauthn/login/finish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(assertion.toJSON()),
});
```

**(c) 서버 — 검증**
```java
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.exception.AssertionFailedException;

var request = AssertionRequest.fromJson((String) session.getAttribute("authRequest"));
try {
    AssertionResult result = rp.finishAssertion(FinishAssertionOptions.builder()
        .request(request)
        .response(PublicKeyCredential.parseAssertionResponseJson(responseJson))
        .build());

    if (result.isSuccess()) {
        // RP 구현: 클론 탐지용 signCount 갱신([[webauthn]] §5)
        credentialRepository.updateSignCount(
            result.getCredential().getCredentialId(), result.getSignatureCount());
        // RP 구현: 세션·보안 컨텍스트 수립(로그인 처리)
        login(result.getUsername());
    }
} catch (AssertionFailedException e) {
    // 서명·challenge·RP ID 불일치 또는 signCount 역행([[webauthn]] §5)
}
```

---

## 3. Spring Security

Spring Security 6.4+는 `webAuthn()` DSL로 등록·인증 엔드포인트와 저장소를 기본 제공한다.

### 3.1. 의존성

```gradle
dependencies {
    implementation("org.springframework.security:spring-security-webauthn")
}
```

`spring-security-webauthn`은 `spring-security-web`과 별도인 독립 artifact다. 버전은 직접 명시하지 않고 Spring Boot BOM(`org.springframework.boot:spring-boot-dependencies`) 또는 Spring Security BOM으로 관리한다.

### 3.2. 구성 방법

`webAuthn()` DSL의 주요 옵션:

| 옵션 | 필수 | 의미 |
|---|---|---|
| `rpId` | 필수 | RP ID([[webauthn]] §2) |
| `allowedOrigins` | 필수 | 허용 origin 목록 |
| `rpName` | 선택 | 등록·로그인 시 브라우저가 표시할 수 있는 이름. 6.4.13/7.0.0-RC3부터 생략 시 `rpId` 값을 사용 |
| `creationOptionsRepository` | 선택 | 등록 옵션(challenge 포함) 저장소. 기본은 `HttpSession` 기반 |
| `messageConverter` | 선택 | 요청·응답 직렬화에 쓰이는 HTTP 메시지 컨버터 |

```java
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .formLogin(withDefaults())
        .webAuthn(webAuthn -> webAuthn
            .rpName("Example Service")
            .rpId("example.com")
            .allowedOrigins("https://example.com"));
    return http.build();
}
```

DSL이 등록하는 엔드포인트는 다음과 같으며, challenge 영속화로 상태가 변경되므로 모두 POST + CSRF 토큰(`X-CSRF-TOKEN` 헤더)이 필요하다.

| 엔드포인트 | 역할 |
|---|---|
| `POST /webauthn/register/options` | 등록 옵션(challenge 포함) 발급([[webauthn]] §3.1) |
| `POST /webauthn/register` | Credential 등록 응답 검증 |
| `POST /webauthn/authenticate/options` | 인증 옵션 발급([[webauthn]] §4.1) |
| `POST /login/webauthn` | Credential 인증 응답 검증·로그인 처리 |

### 3.3. 구현체·사용 클래스

Credential 영속화는 두 인터페이스로 추상화된다.

- **`PublicKeyCredentialUserEntityRepository`** — 사용자 엔티티(`user.id`/`name`/`displayName`, [[webauthn]] §3.1의 `user`에 대응)를 저장
- **`UserCredentialRepository`** — 등록된 Credential(공개키, `signCount` 등)을 저장

기본 구현은 인메모리이므로 애플리케이션 재시작 시 소실되며, 영속화하려면 아래 JDBC 구현체를 빈으로 등록한다.

```java
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.web.webauthn.management.JdbcPublicKeyCredentialUserEntityRepository;
import org.springframework.security.web.webauthn.management.JdbcUserCredentialRepository;

@Bean
JdbcPublicKeyCredentialUserEntityRepository userEntityRepository(JdbcOperations jdbc) {
    return new JdbcPublicKeyCredentialUserEntityRepository(jdbc);
}

@Bean
JdbcUserCredentialRepository userCredentialRepository(JdbcOperations jdbc) {
    return new JdbcUserCredentialRepository(jdbc);
}
```

---

## 4. 기타

### 4.1. 요청 객체의 세션 저장

`start*`가 반환한 요청 객체(`regRequest`/`authRequest`, challenge 포함)를 세션 등 서버 측 저장소에 보관했다가 `finish*`에 그대로 넘겨야 하는 이유:
- challenge는 재전송(replay) 공격을 막는 근거([[webauthn]] §10)이므로, `finish*`는 클라이언트 응답을 서버가 최초 발급한 값과 정확히 대조해야 한다. 클라이언트가 스스로 제시하는 challenge를 신뢰하면 재전송 방지가 무력화된다.
- 요청 객체에는 challenge 외에도 `rpId`·`userVerification` 요구 수준·`allowCredentials`(인증 시) 등 검증 기준이 되는 필드가 함께 담겨 있어, 변조를 막으려면 서버가 직접 보관해야 한다.
- 세션은 사용자별로 격리되고 만료 시점이 있어, 짧은 기간만 유효해야 하는 challenge를 보관하기에 적합하다(Spring Security의 기본 `creationOptionsRepository`도 `HttpSession` 기반, §3.2 참고).

### 4.2. 라이브러리 선택 기준

§2(Yubico)와 §3(Spring Security)은 서로 다른 하부 구현이다 — Spring Security의 `webAuthn()` DSL은 내부적으로 Yubico java-webauthn-server가 아닌 **WebAuthn4J** 라이브러리를 사용한다.
- 엔드포인트 경로·응답 형식·저장 방식을 자유롭게 설계해야 하거나 WebFlux(리액티브) 환경이면 §2를 직접 사용한다 — Spring Security의 WebAuthn 지원은 서블릿(Spring MVC) 기반에서만 제공되며 WebFlux는 미지원이다.
- 표준 서블릿 기반 애플리케이션에서 등록·인증 엔드포인트를 빠르게 붙이려면 §3을 사용한다.

---

## Sources
- Yubico — java-webauthn-server: https://github.com/Yubico/java-webauthn-server
- Maven Central — `com.yubico:webauthn-server-core`: https://central.sonatype.com/artifact/com.yubico/webauthn-server-core
- Spring Security — Passkeys: https://docs.spring.io/spring-security/reference/servlet/authentication/passkeys.html
- Maven Repository — `org.springframework.security:spring-security-webauthn`: https://mvnrepository.com/artifact/org.springframework.security/spring-security-webauthn
- webauthn4j/webauthn4j-spring-security GitHub Discussion — Reactive/WebFlux 미지원, Spring Security WebAuthn의 WebAuthn4J 기반 구현: https://github.com/webauthn4j/webauthn4j-spring-security/discussions/1642
- MDN — `PublicKeyCredential.parseCreationOptionsFromJSON()`: https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseCreationOptionsFromJSON_static

---

## Related pages
- [[webauthn]] — WebAuthn 개념: 등록/인증 Ceremony, Attestation, Authenticator 분류, FIDO2/Passkey
