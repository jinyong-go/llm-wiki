---
title: Gradle Shadow
updated: 2026-09-01 11:38:34
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Shadow는 Gradle에서 Fat jar(uber jar)를 생성하는 플러그인이다. 의존성을 jar 하나로 병합하면서 서명 파일 제외, 서비스 파일 병합, 패키지 relocate, 사용하지 않는 클래스 제거(minimize) 등을 처리한다([[gradle-application]] §4.3 참고).

원 개발자(johnrengelman)에서 GradleUp 조직으로 유지보수가 이관되며 플러그인 ID가 바뀌었다. 옛 ID를 쓰고 있다면 새 ID와 최신 버전으로 전환이 권장된다.

| Shadow 버전 | 최소 Gradle | 최소 Java | 플러그인 ID |
|---|---|---|---|
| 8.0.0+ | 8.0 | 8 | `com.github.johnrengelman.shadow` |
| 8.3.0+ | 8.3 | 8 | `com.gradleup.shadow` |
| 9.0.0+ | 8.11 | 11 | `com.gradleup.shadow` |
| 9.2.0+ | 8.11 | 17 | `com.gradleup.shadow` |
| 9.3.0+ | 9.0 | 17 | `com.gradleup.shadow` |
| 9.5.0+ | 9.2 | 17 | `com.gradleup.shadow` |

즉 옛 ID 사용 여부는 Gradle 버전 자체가 아니라 **적용하는 Shadow 플러그인 버전**이 기준이다. Gradle 8.3 미만 프로젝트는 8.3.0 이상 Shadow를 적용할 수 없으므로, 그 경우에만 옛 ID(`com.github.johnrengelman.shadow`)가 필요하다.

```groovy
plugins {
    id 'java'
    id 'com.gradleup.shadow' version '<version>'
}
```

Shadow는 **반응형(reactive)** 플러그인으로, 단독 적용만으로는 아무 동작도 하지 않는다. `java`/`org.jetbrains.kotlin.jvm`/`groovy` 플러그인이 함께 적용되어야 `shadowJar` Task를 구성한다.

---

## 2. 기본 동작

`java`/`kotlin`/`groovy` 플러그인 존재 시 Shadow는 다음을 자동 구성한다.

- `shadowJar` Task 추가 (`main` 소스셋 산출물 + `runtimeClasspath` 의존성 병합)
- `shadow` Configuration, Variant, Component 추가 (`maven-publish` 연동용)
- 아카이브 classifier를 `'all'`로 설정
- 매니페스트에 `Class-Path` 속성 추가 (`shadow` Configuration의 의존성 나열)
- 다음 패턴 자동 제외: `META-INF/INDEX.LIST`, `META-INF/*.SF`, `*.DSA`, `*.RSA`, `META-INF/versions/**/module-info.class`, `module-info.class`

서명 파일 자동 제외 덕분에 [[fat-jar-signature-error]]에서 다룬 `SecurityException`이 내장 `jar` Task 커스터마이징 방식과 달리 Shadow에서는 기본적으로 발생하지 않는다.

### 2.1. CLI 옵션

```
--main-class                     매니페스트 Main-Class 지정
--minimize-jar / --no-...        미사용 클래스 제거 여부
--enable-auto-relocation         의존성 패키지 자동 relocate
--relocation-prefix              자동 relocate 시 사용할 prefix
--fail-on-duplicate-entries      중복 엔트리 존재 시 빌드 실패
--enable-kotlin-module-remapping Kotlin 모듈 메타데이터 리매핑
--add-multi-release-attribute    멀티 릴리스 매니페스트 속성 추가
```

---

## 3. application 플러그인 통합

`application` 플러그인이 함께 있으면 `application.mainClass` 값이 매니페스트 `Main-Class`에 자동 반영된다.

```groovy
application {
    mainClass = 'myapp.Main'
}
```

- **runShadow** — `JavaExec` Task, `java -jar <project>-all.jar` 실행([[gradle-task]] §2.6과 동일 인터페이스)
- **shadowDistZip / shadowDistTar** — shadow jar와 시작 스크립트를 포함한 배포 아카이브
- **installShadowDist / startShadowScripts** — `build/install/<project>-shadow/`에 스테이징

일반 `application` 플러그인의 `lib/` 배포본([[gradle-application]] §4.1)과 별개로 `-shadow` 접미사가 붙은 배포본이 추가로 생성된다.

---

## 4. 의존성 구성

### 4.1. 소스 Configuration 변경

`shadowJar`가 병합 대상으로 삼는 의존성 목록은 특정 Gradle Configuration(의존성 묶음, [[gradle-dependency-configurations]] 참고)에서 가져온다. 기본은 `runtimeClasspath`다. 변경 시 반드시 `project.configurations`를 참조해야 한다. `configurations.compileClasspath`로 축약하면 `ShadowJar` 자신의 `configurations` 프로퍼티로 위임되어 의도대로 동작하지 않는다.

```groovy
tasks.shadowJar {
    configurations = project.configurations.compileClasspath.map { [it] }
}
```

### 4.2. 의존성 필터링

`dependencies` 블록으로 특정 의존성을 최종 jar에서 제외한다. 전이 의존성에는 적용되지 않는다(제외한 의존성의 하위 의존성은 그대로 포함).

```groovy
tasks.shadowJar {
    dependencies {
        exclude(dependency('org.apache.logging.log4j:log4j-core:2.11.1'))
    }
}
```

### 4.3. 로컬 jar·비-jar 의존성

- `implementation files('foo.jar')`로 선언하면 압축 해제되어 병합됨
- `from('bar.jar')`으로 압축 해제 없이 특정 경로에 그대로 복사 가능
- POM/SO 파일처럼 ZIP이 아닌 의존성이 `runtimeClasspath`에 있으면 `Cannot expand ZIP` 오류가 발생한다. 별도 Configuration을 만들어 `shadowJar.from(...)`으로 추가하거나, 불필요하면 `dependencies { exclude(...) }`로 제외한다

---

## 5. JAR 내용 병합

### 5.1. duplicatesStrategy

`ShadowJar`는 `AbstractCopyTask`를 상속해 `duplicatesStrategy`를 따른다. 기본값은 `EXCLUDE`(첫 항목만 유지). `ResourceTransformer`보다 **우선 적용**되므로, `mergeServiceFiles()` 등을 함께 쓰려면 기본 전략을 `INCLUDE`/`WARN`으로 바꾼 뒤 transformer 적용 후 특정 경로만 `filesMatching`/`filesNotMatching`으로 재조정해야 한다.

### 5.2. 서비스 파일 병합

`META-INF/services` 아래 동일 파일명이 여러 의존성에 존재할 때 내용을 합친다.

```groovy
tasks.shadowJar {
    mergeServiceFiles()          // 기본 경로 META-INF/services
    mergeServiceFiles {
        path = 'META-INF/custom' // 경로 변경
    }
}
```

Groovy Extension Module 디스크립터(`META-INF/services/org.codehaus.groovy.runtime.ExtensionModule`)는 별도로 `mergeGroovyExtensionModules()`가 필요하다.

`ResourceTransformer`는 프로젝트 파일이 의존성 파일보다 먼저 처리된다는 순서 보장이 있다.

### 5.3. 콘텐츠 필터링

`Jar` Task와 동일한 `include`/`exclude`(Ant 스타일)를 최종 병합 결과에 적용한다. `exclude`가 `include`보다 우선한다.

```groovy
tasks.shadowJar {
    exclude('a2.properties')
}

tasks.shadowJar {
    include('*.jar')
    include('*.properties')
    exclude('a2.properties')   // include와 결합 가능, exclude가 우선
}
```

---

## 6. 패키지 Relocate

ASM으로 바이트코드의 패키지 경로·import를 재작성한다. 버전 충돌이나 classpath 오염을 피할 때 쓴다(예: Guava, ASM 자체).

```groovy
tasks.shadowJar {
    relocate('junit.framework', 'shadow.junit')
}
```

- prefix 단위로 동작하며 패턴 매칭이 필요 없다
- **전역** 적용된다. shadow 대상 의존성으로 범위가 제한되지 않으므로 과도한 relocate에 주의한다
- `include`/`exclude`로 Ant 패턴, `%regex[...]`로 정규식 필터링 가능
- 빈 문자열 `''`을 매칭 패턴으로 쓰면 전체 relocate 후 `exclude`로 예외 지정 가능
- 문자열 리터럴도 기본적으로 relocate 대상이다. 원치 않으면 `skipStringConstants = true`로 설정한다

### 6.1. 자동 relocate

```groovy
tasks.shadowJar {
    enableAutoRelocation = true
    relocationPrefix = 'myapp'
}
```

모든 의존성 패키지를 자동으로 relocate하며, 대상 Configuration(기본 `runtimeClasspath`) 전체를 처리하므로 빌드 시간이 늘어날 수 있다. Kotlin Standard Library는 Kotlin Metadata/Reflection 사용 시 relocate 비권장.

---

## 7. Minimize

사용하지 않는 클래스·jar를 제거해 크기를 줄인다.

```groovy
tasks.shadowJar {
    minimize {
        exclude(dependency('org.scala-lang:.*:.*'))  // 강제 포함
        exclude(project(':api'))                      // 프로젝트 단위 제외
    }
}
```

`minimize` 블록의 `exclude`는 [§4.2](#42-의존성-필터링)의 `dependencies { exclude(...) }`와 동작 방향이 반대다. `dependencies.exclude`는 의존성을 최종 jar에서 완전히 제거하지만, `minimize.exclude`는 **축소 대상에서만 제외**해 해당 의존성을 원본 그대로 jar에 포함시킨다. 사용 여부 분석기가 리플렉션 등으로 인한 클래스 참조를 찾지 못해 필요한 클래스까지 잘못 제거하는 것을 막는 안전장치다.

`api` Configuration으로 선언된 의존성은 자동으로 minimize 대상에서 제외되고 진입점(entry point)으로 취급된다. `Class.forName(String)` 같은 동적 로딩은 분석기가 감지하지 못하므로 수동 제외가 필요할 수 있다.

R8(`minimize { r8 { ... } }`)로 전체 프로그램 축소(이름 난독화 포함 가능)도 지원하며, `shadowR8` Configuration으로 R8 버전을 지정한다(기본 저장소는 Google Maven).

---

## Sources
- Shadow Gradle Plugin — Introduction (버전별 호환성 표): https://gradleup.com/shadow/
- Shadow Gradle Plugin — Getting Started: https://gradleup.com/shadow/getting-started/
- Shadow Gradle Plugin — Integrating with Application Plugin: https://gradleup.com/shadow/application-plugin/
- Shadow Gradle Plugin — Configuring Shadowed Dependencies: https://gradleup.com/shadow/configuration/dependencies/
- Shadow Gradle Plugin — Controlling JAR Content Merging: https://gradleup.com/shadow/configuration/merging/
- Shadow Gradle Plugin — Relocating Packages: https://gradleup.com/shadow/configuration/relocation/
- Shadow Gradle Plugin — Filtering Shadow Jar Contents: https://gradleup.com/shadow/configuration/filtering/
- Shadow Gradle Plugin — Minimizing: https://gradleup.com/shadow/configuration/minimizing/

---

## Related pages
- [[gradle-application]] — Gradle 애플리케이션 실행 구성, Fat jar 기본 방식
- [[fat-jar-signature-error]] — Fat Jar 서명 파일 충돌
- [[gradle-task]] — Gradle Task 타입
- [[gradle-dependency-configurations]] — 의존성 Configuration
- [[gradle-multi-project]] — Gradle 멀티 프로젝트
