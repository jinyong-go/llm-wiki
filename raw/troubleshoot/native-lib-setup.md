# 네이티브 라이브러리 로딩 설정 정리

- 정리일: 2026-08-11
- 주제: JNI 네이티브 모듈을 JVM이 찾게 하는 방법, macOS Gatekeeper 이슈

---

## 1. 현재 파일 현황

| 경로                        | 형식                                     |
| ------------------------- | -------------------------------------- |
| `lib/debian/lib_jni.so`   | ELF 64-bit, x86-64, dynamically linked |
| `lib/redhat/lib_jni.so`   | ELF 64-bit, x86-64, dynamically linked |
| `lib/macos/lib_jni.dylib` | Mach-O, arm64, ad-hoc(linker-signed)   |

debian / redhat 빌드는 BuildID가 달라 별도 빌드다. 두 빌드의 실질적 차이(glibc 버전인지, 링크 대상인지)는 아직 미확인.

`.so` 로딩은 SDK가 아니라 **우리 `safebox/` 코드에서 수행**할 예정이다.

---

## 2. `java.library.path`의 제약

이 값은 **JVM 기동 시점에 한 번 읽고 캐싱**된다(`ClassLoader`의 `usr_paths`).

- 런타임에 `System.setProperty("java.library.path", ...)` 를 호출해도 반영되지 않는다.
- 예전에 쓰던 `ClassLoader.sys_paths` 리플렉션 초기화 해킹은 **Java 12+ 에서 막혔다.**
- `gradle.properties` 의 `org.gradle.jvmargs` 는 **Gradle 데몬용**이라 fork된 테스트 JVM과 무관하다.

결론: **JVM을 fork하는 태스크마다 지정해야 한다.** 다만 태스크마다 일일이 쓸 필요는 없고, 한 곳에서 일괄 적용할 수 있다.

---

## 3. 방법 A — `build.gradle`에서 지정 (채택)

### 3.1 OS 자동 판별 + `test` 태스크 적용

`ext` 블록에 네이티브 디렉터리 정의를 추가한다.

```gradle
ext {
    sessionType = 'all'
    projectType = 'QSPL'
    jakartaVersion = '5.0.0'
    javaxVersion = '4.0.1'
    nativeLibDir = file("lib/${
        org.gradle.internal.os.OperatingSystem.current().isMacOsX()
            ? 'macos'
            : (project.findProperty('distro') ?: 'debian')
    }")
}
```

`test` 태스크에 `systemProperty` 를 추가한다.

```gradle
test {
    useJUnitPlatform()
    systemProperty 'java.library.path',
            "${nativeLibDir}${File.pathSeparator}${System.getProperty('java.library.path')}"
    finalizedBy jacocoTestReport
}
```

리눅스에서 RHEL 계열 빌드를 쓰려면 `./gradlew test -Pdistro=redhat`.

### 3.2 여러 태스크에 한 번에 적용하려면

`jmh`, `bootRun` 등까지 필요하면 태스크 타입별로 일괄 설정한다. (`me.champeau.jmh` 0.7.x의 `jmh` 태스크는 `JavaExec` 하위 타입이다.)

```gradle
def javaLibraryPath = [nativeLibDir.absolutePath, System.getProperty('java.library.path')]
        .findAll { it }.join(File.pathSeparator)

tasks.withType(Test).configureEach {
    systemProperty 'java.library.path', javaLibraryPath
}
tasks.withType(JavaExec).configureEach {
    systemProperty 'java.library.path', javaLibraryPath
}
```

demo 모듈까지 커버하려면 `settings.gradle`의 `subprojects { }` 블록에 넣고 경로를 `"${rootDir}/qsafelinepad-library/lib/..."` 로 잡는다.

### 3.3 주의점

- **`jvmArgs` 대신 `systemProperty` 를 쓴다.** `jvmArgs`는 리스트를 통째로 덮어써서 다른 JVM 옵션과 충돌한다.
- **기존 값에 append 한다.** 통째로 교체하면 JVM 기본 네이티브 경로가 사라져 다른 라이브러리 로딩이 깨질 수 있다. 여기서 읽는 `System.getProperty`는 Gradle 데몬의 값이라 fork된 JVM의 기본값과 완전히 같지는 않지만, 같은 머신·같은 JDK라 실무상 문제없다.
- **전이 의존 `.so`** — `libqsa_jni.so`가 다른 공유 라이브러리를 링크한다면 `java.library.path`로는 해결되지 않고 동적 링커가 찾아야 한다. 이 경우 `environment 'LD_LIBRARY_PATH', nativeLibDir.absolutePath` 가 추가로 필요하다. 리눅스에서 `ldd libqsa_jni.so` 로 확인 필요.
- **한계** — 이 방식은 개발/빌드 환경만 해결한다. 라이브러리를 쓰는 고객사에서도 동일하게 `-Djava.library.path` 를 지정해야 한다.

---

## 4. macOS Gatekeeper quarantine 이슈

### 증상

```
Apple은 'lib_jni.dylib'에 사용자의 Mac에 손상을 입히거나
사용자의 개인정보에 침입할 수 있는 악성 코드가 없음을 확인할 수 없습니다.
```

### 원인

다운로드된 파일에 붙는 격리 확장 속성.

```
com.apple.quarantine: 0082;6a795e82;Slack;E3A19FE9-6DB0-45D8-859A-9C8FA0200246
```

dylib 서명이 **ad-hoc(linker-signed)** 이라 공증(notarization)이 없어 Gatekeeper가 차단한다.

### 해결

```bash
xattr -d com.apple.quarantine <파일경로>
xattr -r -d com.apple.quarantine <디렉터리>    # 재귀
```

제거 후 `xattr -l` 로 `com.apple.provenance` 만 남으면 정상. `com.apple.provenance`는 로딩을 막지 않는다.

GUI로는 **시스템 설정 → 개인정보 보호 및 보안** 의 "그래도 허용" 버튼도 있지만, dylib은 이 버튼이 안 뜨는 경우가 많아 `xattr` 쪽이 확실하다.

### 재발 조건

- **`cp`는 macOS에서 확장 속성을 그대로 복사한다.** Downloads → 프로젝트로 복사하면 quarantine이 따라온다(실제로 동일 UUID로 재발했다). `cp -X` 를 쓰면 따라오지 않는다.
- **git은 확장 속성을 저장하지 않는다.** 커밋 후 clone하는 사람이나 CI는 깨끗한 파일을 받으므로 이 문제를 겪지 않는다. 로컬 재복사 때만 재발한다.

### 아키텍처 확인

quarantine과 별개로 아키텍처 불일치도 같은 증상처럼 보일 수 있어 함께 확인했다.

| 항목 | 값 |
|---|---|
| dylib | `Mach-O arm64` |
| 호스트 | `arm64` |
| 기본 JDK | Temurin 17 (arm64) |

셋이 일치해 문제없음. 단 로컬에 설치된 **Temurin 8은 x86_64** 라 그걸로 실행하면 아키텍처 불일치로 실패한다.

### 현재 상태 (2026-08-11)

- `lib/macos/lib_jni.dylib` — quarantine **제거됨**
- `lib/debian/lib_jni.so`, `lib/redhat/lib_jni.so` — quarantine 남아 있음 (Chrome 다운로드). 리눅스에는 Gatekeeper가 없고 macOS에서 로드할 일도 없어 무해하다.
