---
title: Java KeyStore
updated: 2026-07-16 13:31:34
tags:
  - java
  - crypto
  - keystore
  - pkcs12
---

## 1. 개요

`java.security.KeyStore`는 개인키·인증서·대칭키를 비밀번호로 보호해 저장하는 저장소 추상화다. 파일 형식(타입)은 다음과 같다.

| 타입 | 설명 |
|---|---|
| PKCS12 | 표준 형식 (`.p12`/`.pfx` 동일 형식). Java 9+ 기본 타입 (JEP 229) |
| JKS | Java 전용 레거시 형식 |
| JCEKS | 대칭키 저장을 지원하는 JKS 확장. 레거시 |

엔트리는 대소문자 구분 없는 alias 문자열로 식별한다 (엔트리 유형은 2절 참고). PKCS#12 파일의 CLI 조작은 [[openssl-pkcs12]] 참고.

## 2. Entry

`KeyStore.Entry`는 KeyStore에 저장되는 엔트리를 표현하는 인터페이스다. `setEntry`/`getEntry`가 이 타입을 주고받으며, 구현 클래스에 따라 저장되는 객체가 다르다. 조회 시 비밀번호는 `ProtectionParameter`(대표 구현 `PasswordProtection`)로 전달한다.

### 2.1 PrivateKeyEntry

개인키(`PrivateKey`)와 인증서 체인(`Certificate[]`)을 하나의 엔트리에 함께 담는다.

```java
KeyStore.Entry e = ks.getEntry("mykey", new KeyStore.PasswordProtection(keyPassword));
if (e instanceof KeyStore.PrivateKeyEntry pke) {
    PrivateKey key       = pke.getPrivateKey();
    Certificate[] chain  = pke.getCertificateChain();
    X509Certificate cert = (X509Certificate) pke.getCertificate();  // 체인의 첫 인증서
}
```

### 2.2 TrustedCertificateEntry

신뢰 인증서(`Certificate`) 1개만 담는다. 개인키가 없으므로 조회 시 `ProtectionParameter`는 null을 전달한다.

```java
KeyStore.Entry e = ks.getEntry("trusted-ca", null);
if (e instanceof KeyStore.TrustedCertificateEntry tce) {
    Certificate cert = tce.getTrustedCertificate();
}
```

### 2.3 SecretKeyEntry

대칭키(`SecretKey`)를 담는다.

```java
ks.setEntry("aes-key", new KeyStore.SecretKeyEntry(secretKey),
        new KeyStore.PasswordProtection(keyPassword));

KeyStore.Entry e = ks.getEntry("aes-key", new KeyStore.PasswordProtection(keyPassword));
SecretKey k = ((KeyStore.SecretKeyEntry) e).getSecretKey();
```

### 2.4 getKey와의 차이

- `getKey`·`getCertificate`·`getCertificateChain`은 엔트리의 일부만 반환하는 구형 API고, `getEntry`는 엔트리 전체를 반환한다. 성능 차이는 없다 (둘 다 호출 시 키 복호화 수행).
- `getEntry`는 `PasswordProtection` 외에 `CallbackHandlerProtection`(콜백으로 비밀번호 지연 획득)을 쓸 수 있어 PKCS#11 토큰 등 비밀번호가 문자열이 아닌 저장소에도 대응한다.
- 모든 Entry 구현은 `getAttributes()`로 PKCS#12 속성(friendlyName, localKeyId 등)을 노출한다.
- 비밀번호 오류 시 `UnrecoverableEntryException`, alias 부재 시 null 반환이므로 캐스팅 전 null·타입 확인이 안전하다.

## 3. 생성·저장

`getInstance`만으로는 미초기화 상태이므로 빈 키스토어라도 `load(null, null)` 호출이 필수다.

```java
KeyStore ks = KeyStore.getInstance("PKCS12");
ks.load(null, null);  // 빈 키스토어로 초기화

// 개인키 + 인증서 체인 저장
ks.setKeyEntry("mykey", privateKey, keyPassword, new Certificate[]{cert});

// 신뢰 인증서 저장 (개인키 없음)
ks.setCertificateEntry("trusted-ca", caCert);

// 파일로 저장 (.p12/.pfx)
try (OutputStream os = Files.newOutputStream(Path.of("keystore.p12"))) {
    ks.store(os, storePassword);
}
```

- `keyPassword`(엔트리별 키 보호)와 `storePassword`(파일 무결성·전체 보호)는 별개 인자다. PKCS12 타입에서는 통상 동일 값을 사용한다.

## 4. 로드·조회

```java
KeyStore ks = KeyStore.getInstance("PKCS12");
try (InputStream is = Files.newInputStream(Path.of("keystore.p12"))) {
    ks.load(is, storePassword);
}

PrivateKey key = (PrivateKey) ks.getKey("mykey", keyPassword);
X509Certificate cert = (X509Certificate) ks.getCertificate("mykey");
Certificate[] chain = ks.getCertificateChain("mykey");
```

alias를 모르는 경우 순회로 탐색한다.

```java
Enumeration<String> aliases = ks.aliases();
while (aliases.hasMoreElements()) {
    String alias = aliases.nextElement();
    if (ks.isKeyEntry(alias)) {          // PrivateKeyEntry 여부
        // ks.getKey(alias, keyPassword) ...
    }
}
```

## 5. 참고사항

- **alias당 엔트리 1개**: alias 네임스페이스는 평면적이며, 서로 다른 타입의 엔트리를 같은 alias에 함께 저장할 수 없다. `setCertificateEntry`는 대상 alias에 TrustedCertificateEntry가 아닌 엔트리가 이미 있으면 `KeyStoreException`을 던지고, `setKeyEntry`는 기존 엔트리를 덮어쓴다.
- **엔트리 타입별 getter 반환**: PrivateKeyEntry는 하나의 엔트리에 개인키와 인증서 체인을 함께 담으므로, 같은 alias로 `getKey`(개인키), `getCertificate`(체인의 첫 인증서), `getCertificateChain`(체인 전체)을 조회한다. TrustedCertificateEntry는 `getCertificate`만 값을 반환하고 `getKey`·`getCertificateChain`은 null을 반환한다.
- **반복 조회 성능**: `getKey`는 호출할 때마다 저장된 암호화 키의 복호화를 수행한다. 요청 처리 경로에서 매번 KeyStore를 조회하면 CPU 부하가 커지므로, 기동 시 조회해 필드나 `Map<String, PrivateKey>`로 캐시한다.[^1]
- 인증서 검증 활용은 [[cert-path-validation]], 인증서 구조는 [[x509-certificate]] 참고.

[^1]: 운영 사례(`raw/troubleshoot/keystore and cpu usage.md`)에서 요청마다 KeyStore에서 인증서·개인키를 조회하도록 변경한 후 CPU 사용량이 상승했고, alias를 키로 한 Map 캐시로 전환해 정상화됐다. 호출마다 복호화가 수행된다는 원인 설명은 PKCS#12가 키를 PBE(비밀번호 기반 암호화)로 저장하는 구조에서 도출한 추론이다.

---
## Sources
- `raw/troubleshoot/keystore and cpu usage.md`
- [Java SE 17 API — java.security.KeyStore](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/security/KeyStore.html)
- [Java SE 17 API — KeyStore.PrivateKeyEntry](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/security/KeyStore.PrivateKeyEntry.html)
- [Java Cryptography Architecture (JCA) Reference Guide](https://docs.oracle.com/en/java/javase/17/security/java-cryptography-architecture-jca-reference-guide.html)
- [JEP 229: Create PKCS12 Keystores by Default](https://openjdk.org/jeps/229)

---
## Related pages
- [[x509-certificate]]
- [[openssl-pkcs12]]
- [[cert-path-validation]]
- [[cpu-usage-troubleshooting]]
