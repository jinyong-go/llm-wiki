---
title: JAR 서명
updated: 2026-08-06 13:22:59
tags:
  - java
  - crypto
  - jar
---

## 1. 개요
JAR 서명은 배포한 JAR 파일이 서명 시점 이후 변경되지 않았고, 서명자(개인키 소유자)가 실제로 서명했음을 증명하는 메커니즘이다. `keytool`로 생성한 키스토어의 개인키를 `jarsigner`가 사용해 서명하며, JVM은 클래스 로드 시 서명을 자동 검증한다.

---

## 2. 구성 파일
서명 시 META-INF 디렉터리에 파일이 추가·변경된다.

| 파일 | 역할 |
|---|---|
| MANIFEST.MF | 각 JAR 엔트리(파일)의 다이제스트(해시)를 나열. 서명 시 자동 생성·갱신 |
| x.SF | 서명 파일. MANIFEST.MF 각 섹션의 해시값을 담음(2중 해시 구조) |
| x.DSA / x.RSA / x.EC | 서명 블록 파일. x.SF에 대한 전자서명과 서명자 인증서(체인)를 PKCS#7 구조로 저장 |

`x`는 서명 시 `-sigfile` 옵션 값, 또는 미지정 시 alias 앞 8자(대문자, 허용 안 되는 문자는 `_`로 치환)다. 한 JAR을 여러 명이 서명하면 서명자별로 파일 쌍이 추가된다.

```bash
jarsigner myBundle.jar susan
jarsigner myBundle.jar kevin
# → SUSAN.SF/SUSAN.RSA, KEVIN.SF/KEVIN.RSA 각각 생성
```

---

## 3. 서명

### 3.1. 키스토어 준비
`keytool`로 키페어와 인증서를 키스토어에 생성·저장한다. Java KeyStore API 사용은 [[keystore-java]] 참고.

```bash
keytool -genkeypair -alias mykey -keyalg RSA -keysize 2048 \
  -validity 3650 -keystore keystore.p12 -storetype PKCS12
```

### 3.2. CLI로 서명

```bash
jarsigner -keystore keystore.p12 -storepass <password> app.jar mykey
```

- 기본 동작은 원본 JAR을 서명된 JAR로 덮어쓴다. 별도 출력이 필요하면 `-signedjar` 사용
- 서명 알고리즘은 키 종류·크기에 따라 자동 선택된다 (예: RSA ≤3072bit → SHA256withRSA). `-sigalg`로 재정의 가능

### 3.3. 빌드 도구 통합
수동 CLI 대신 빌드 과정에 서명을 포함시키는 방법.

**Maven**: 공식 `maven-jarsigner-plugin`을 사용한다. `sign` goal은 기본으로 `package` 단계에 바인딩된다.

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jarsigner-plugin</artifactId>
    <version>3.1.0</version>
    <executions>
        <execution>
            <id>sign</id>
            <goals><goal>sign</goal></goals>
        </execution>
    </executions>
    <configuration>
        <keystore>${signKeystore}</keystore>
        <alias>${signAlias}</alias>
        <storepass>${signStorePass}</storepass>
        <keypass>${signKeyPass}</keypass>
    </configuration>
</plugin>
```

**Gradle**: jarsigner 전용 공식 플러그인은 없다. Gradle 내장 `signing` 플러그인은 Maven Central 배포용 아티팩트에 PGP 서명(`.asc`)을 붙이는 기능으로, jarsigner 기반 JAR 코드 서명과는 별개다. 대신 Ant 통합(`ant.signjar`)으로 `jar` task 산출물에 서명하는 task를 직접 구성한다.

```groovy
tasks.register('signJar') {
    dependsOn jar
    doLast {
        ant.signjar(
            jar: jar.archiveFile.get().asFile,
            alias: signAlias,
            storepass: signStorePass,
            keystore: signKeystore
        )
    }
}
build.dependsOn signJar
```

---

## 4. 검증

### 4.1. jarsigner 명령어

```bash
jarsigner -verify app.jar
jarsigner -verify -verbose -certs app.jar   # 서명 상세, 인증서 내용까지 출력
```

### 4.2. 검증 절차
JVM이 클래스 로드 시 수행하는 순서는 다음과 같다.

1. 서명 블록 파일(.DSA/.RSA/.EC)의 서명 유효성 검증 → x.SF가 변조되지 않았음을 확인
2. x.SF 헤더의 매니페스트 전체 해시와 현재 MANIFEST.MF 해시 비교 (불일치 시 섹션별 해시로 재확인)
3. 실제 로드하는 파일마다 다이제스트를 계산해 매니페스트 값과 대조
4. 사용된 서명·다이제스트 알고리즘이 `jdk.jar.disabledAlgorithms` 등으로 비활성화됐는지 확인

어느 단계든 실패하면 `SecurityException`이 발생하고 해당 클래스(또는 JAR 전체)의 로드가 거부된다.

---

## 5. 검증 실패
검증 실패는 (a) JVM이 클래스 로드 시 무결성 검증에 실패해 `SecurityException`을 던지는 경우와, (b) `jarsigner -verify`가 정책 위반을 경고·오류로 보고하는 경우로 나뉜다.

### 5.1. 무결성 검증 실패 (SecurityException)

#### 5.1.1. 재패키징으로 인한 매니페스트 변경
fat jar 등으로 서명된 JAR을 재패키징하면 MANIFEST.MF가 변경되어 4.2절 2단계에서 다이제스트 불일치가 발생하고, `Invalid signature file digest for Manifest main attributes` 오류로 이어진다. 사례와 해결책은 [[fat-jar-signature-error]] 참고.

#### 5.1.2. 서명 후 파일 변조
파일 내용이 서명 이후 변경되면 4.2절 3단계(엔트리별 다이제스트 비교)에서 불일치가 발생해 동일하게 `SecurityException`이 발생한다.

### 5.2. jarsigner 검증 경고·오류 (Severe Warnings)
`jarsigner -verify -strict` 시 심각한 경고는 오류로 처리되어 0이 아닌 종료 코드를 반환한다.

| 경고 | 코드 | 원인 |
|---|---|---|
| hasExpiredCert | 4 | 서명자 인증서 만료 |
| notYetValidCert | 4 | 서명자 인증서 유효기간 이전 |
| signerSelfSigned | 4 | 자체 서명 인증서 사용 |
| disabledAlg | 4 | 비활성화된 알고리즘 사용 |
| badKeyUsage | 8 | 인증서 KeyUsage가 코드 서명 미허용 |
| hasUnsignedEntry | 16 | 서명되지 않은 엔트리 포함(무결성 미검증) |
| notSignedByAlias / aliasNotInStore | 32 | 지정 alias로 서명되지 않음 |
| tsaChainNotValidated | 64 | 타임스탬프 인증서 체인 무효 |

---

## Sources
- [JAR File Specification — JAR File Signing (Oracle)](https://docs.oracle.com/en/java/javase/17/docs/specs/jar/jar.html#jar-file-signing)
- [jarsigner 명령어 문서 (Oracle)](https://docs.oracle.com/en/java/javase/17/docs/specs/man/jarsigner.html)
- [Apache Maven Jarsigner Plugin — jarsigner:sign](https://maven.apache.org/plugins/maven-jarsigner-plugin/sign-mojo.html)
- [Ant signjar Task](https://ant.apache.org/manual/Tasks/signjar.html)
- [Gradle Signing Plugin (PGP 아티팩트 서명, jarsigner와 구분)](https://docs.gradle.org/current/userguide/signing_plugin.html)

---

## Related pages
- [[keystore-java]]
- [[fat-jar-signature-error]]
- [[x509-certificate]]
- [[cert-path-validation]]
- [[gradle-task]]
- [[maven]]
