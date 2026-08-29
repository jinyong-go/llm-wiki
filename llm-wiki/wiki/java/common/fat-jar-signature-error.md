---
title: Fat Jar 서명 파일 충돌 오류
updated: 2026-08-06 11:08:31
tags:
  - java
  - gradle
  - maven
  - build-tool
  - troubleshooting
  - bouncycastle
---

## 1. 개요
서명된(signed) 의존성 jar를 fat jar(uber jar)로 재패키징할 때, 원본 서명 파일(META-INF/*.SF, *.RSA, *.DSA)이 그대로 포함되어 클래스 로드가 `SecurityException`으로 실패하는 문제를 정리한다.

---

## 2. 증상

Gradle 내장 `jar` task를 다음과 같이 커스터마이징해 fat jar를 구성했다.

```groovy
jar {
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

이후 jar 내 모든 클래스의 로드가 실패한다.

```
Exception in thread "main" java.lang.SecurityException:
    Invalid signature file digest for Manifest main attributes
        at sun.security.util.SignatureFileVerifier.processImpl(SignatureFileVerifier.java:340)
        at java.util.jar.JarVerifier.processEntry(JarVerifier.java:279)
        at java.util.jar.JarFile.initializeVerifier(JarFile.java:761)
```

`jarsigner -verify`로도 동일하게 재현된다.

```
$ jarsigner -verify ReduceSign-1.0.4.jar
jarsigner: java.lang.SecurityException:
    Invalid signature file digest for Manifest main attributes
```

---

## 3. 원인
BouncyCastle 등 **서명된 jar**를 fat jar로 재패키징하면서 원본 서명 파일이 그대로 병합되었다.

- 서명 파일 예: `META-INF/BCRSA204.SF`, `META-INF/BCRSA204.RSA` (BC 1.0.4), `META-INF/BC2048KE.SF`, `META-INF/BC2048KE.DSA` (BC 1.0.3)
- 서명 파일(`.SF`)에는 원본 `META-INF/MANIFEST.MF`의 다이제스트가 기록되어 있다.
- fat jar 재패키징 과정에서 여러 jar의 `MANIFEST.MF`가 병합·변경되므로, 서명 파일의 다이제스트와 실제 매니페스트가 불일치한다.
- JVM은 이를 변조로 판단해 **jar 전체의 클래스 로드를 거부**한다.
- 위 사례는 Gradle 내장 `jar` task를 직접 커스터마이징한 방식으로, 서명 파일을 자동으로 걸러내는 로직이 없다.

해당 서명 파일 2개를 제거한 뒤 재검증하면 모든 클래스 로드와 암복호화 동작이 정상 작동함을 확인했다.

---

## 4. 해결

### 4.1. Shadow/Shade 플러그인 사용
**Gradle**: Shadow 플러그인은 `java`/`groovy`/`kotlin` 플러그인이 있으면 `shadowJar` task가 `META-INF/*.SF`, `*.DSA`, `*.RSA` 등을 **기본값으로 자동 제외**한다. 플러그인 선언만으로 해결된다. 단, 앞서 사용한 내장 `jar` task 커스터마이징 방식은 이 자동 제외 대상이 아니므로, Shadow 플러그인 자체로 전환해야 적용된다.

```groovy
plugins {
    id 'java'
    id 'com.gradleup.shadow' version '<version>'
}
```

**Maven**: Shade 플러그인은 서명 파일을 **자동으로 제거하지 않으므로** filters를 명시적으로 추가해야 한다.

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.6.2</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals><goal>shade</goal></goals>
            <configuration>
                <filters>
                    <filter>
                        <artifact>*:*</artifact>
                        <excludes>
                            <exclude>META-INF/*.SF</exclude>
                            <exclude>META-INF/*.DSA</exclude>
                            <exclude>META-INF/*.RSA</exclude>
                        </excludes>
                    </filter>
                </filters>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 4.2. 수동 제외
Shadow/Shade 플러그인 없이 Gradle 내장 `jar` task를 직접 커스터마이징하는 경우(위 2절 사례), 자동 제외 로직이 없으므로 exclude를 직접 추가해야 한다.

```groovy
jar {
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    exclude 'META-INF/*.SF'
    exclude 'META-INF/*.DSA'
    exclude 'META-INF/*.RSA'
}
```

### 4.3. 패키지 relocate
번들이 반드시 필요하다면 `org.bouncycastle` 패키지를 relocate 처리하는 방법도 있다. 클래스 경로 자체가 바뀌므로 원본 서명과의 충돌 문제를 근본적으로 회피한다.

---

## 5. 체크리스트
- [ ] fat jar에 포함되는 의존성 중 **서명된(signed) jar**가 있는가
- [ ] Shadow(Gradle)/Shade(Maven) 플러그인을 사용 중인가, 아니면 내장 `jar` task를 직접 커스터마이징하는가
- [ ] Shade(Maven) 사용 시 서명 파일 제외 filters가 명시적으로 설정되어 있는가
- [ ] 제외 대신 패키지 relocate로 충돌 자체를 피할 수 있는가

---

## Sources
- `raw/troubleshoot/fat jar and sign error.md`
- [Shadow Plugin — Getting Started (기본 Java/Kotlin/Groovy task 자동 exclude 목록)](https://gradleup.com/shadow/getting-started/)
- [Excluding crypto artifacts during Maven shade uber-jar creation](https://gist.github.com/rkoshy/af8b53b8738be955e8238d78511d36f3)

---

## Related pages
- [[gradle-task]]
- [[maven]]
- [[cmp-bouncycastle]]
- [[jar-signing]]
