---
title: Java SBOM 생성
updated: 2026-07-08 10:32:15
tags:
  - java
  - gradle
  - maven
  - sbom
  - cyclonedx
---

## 1. Source SBOM vs Build SBOM

| 구분 | Source SBOM | Build SBOM |
|---|---|---|
| 입력 | `pom.xml`, `build.gradle`, `gradle.lockfile` | 실제 클래스패스의 JAR, 패키징된 아티팩트 |
| 특징 | 선언된 의존성 기반, 빠름 | 실제 런타임 컴포넌트 반영, 정확도 높음 |
| 도구 | cdxgen, CycloneDX Plugin | Trivy (`trivy fs --deep`), cdxgen `--deep` |

Java는 복잡한 트랜지티브 의존성 트리, 컴파일/런타임/테스트 스코프 분리, 멀티모듈 구조로 인해 두 유형의 차이가 중요하다.

---

## 2. 의존성 선언

### 2.1. Maven (`pom.xml`)

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
  </dependency>
  <dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.16.0</version>
  </dependency>
</dependencies>
```

Maven에는 전통적인 lockfile이 없다. 버전 범위나 부모 POM의 `<dependencyManagement>`로 관리된다.

```bash
# 실제 해석된 의존성 확인
mvn dependency:tree
mvn dependency:list
```

### 2.2. Gradle (`build.gradle` / `build.gradle.kts`)

```groovy
// Groovy DSL
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

```kotlin
// Kotlin DSL
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.2.0")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}
```

### 2.3. Gradle Lockfile

재현 가능한 빌드를 위해 의존성 잠금을 활성화한다.

```groovy
// build.gradle
dependencyLocking {
    lockAllConfigurations()
}
```

```bash
# gradle.lockfile 생성
gradle dependencies --write-locks
```

생성된 `gradle.lockfile`:

```
com.fasterxml.jackson.core:jackson-annotations:2.16.0=compileClasspath,runtimeClasspath
com.fasterxml.jackson.core:jackson-databind:2.16.0=compileClasspath,runtimeClasspath
org.springframework.boot:spring-boot-starter-web:3.2.0=compileClasspath,runtimeClasspath
```

---

## 3. Maven vs Gradle 의존성 해석 차이

| 항목 | Maven | Gradle |
|---|---|---|
| 충돌 해결 전략 | 가장 가까운 선언 우선(nearest-wins) | 최신 버전 우선(newest-wins, 기본값) |
| 의존성 스코프 | compile, provided, runtime, test | implementation, api, compileOnly, runtimeOnly, testImplementation |
| BOM 지원 | `<dependencyManagement>` | `platform()` |
| Lockfile | 없음 (enforcer 플러그인 권고) | `gradle.lockfile` 지원 |

---

## 4. 멀티모듈 프로젝트

```
my-app/
├── pom.xml (parent)
├── core/
│   └── pom.xml
├── api/
│   └── pom.xml
└── web/
    └── pom.xml
```

SBOM 생성 방식 선택:

| 방식 | 설명 | 적합 상황 |
|---|---|---|
| **Per-module SBOM** | 모듈별 개별 SBOM | 모듈이 독립 배포되는 경우 |
| **Aggregate SBOM** | 전체 프로젝트 단일 SBOM | 단일 아티팩트로 배포되는 경우 |

---

## 5. SBOM 생성 도구

### 5.1. cdxgen

언어를 가리지 않는 범용 도구로, 우선 권장된다.

```bash
npm install -g @cyclonedx/cdxgen
cdxgen -t maven -o sbom.cdx.json
```

Maven과 Gradle 모두 지원하며, `--deep` 플래그로 Shaded JAR 내부까지 분석한다.

### 5.2. CycloneDX Maven Plugin

```xml
<plugin>
    <groupId>org.cyclonedx</groupId>
    <artifactId>cyclonedx-maven-plugin</artifactId>
    <version>2.9.1</version>
</plugin>
```

```bash
mvn cyclonedx:makeAggregateBom
```

### 5.3. CycloneDX Gradle Plugin

기본 적용:

```kotlin
// build.gradle.kts
plugins {
    id("org.cyclonedx.bom") version "3.2.4"
}
```

```bash
./gradlew cyclonedxDirectBom  # 프로젝트별 SBOM
./gradlew cyclonedxBom        # 전체 집계 SBOM
```

출력 위치:
- 프로젝트별: `build/reports/cyclonedx-direct/bom.{json,xml}`
- 집계: `build/reports/cyclonedx/bom.{json,xml}`

### 5.4. Trivy

```bash
trivy fs --format cyclonedx --output sbom.cdx.json .
```

---

## 6. CycloneDX Gradle Plugin 설정

```kotlin
tasks.cyclonedxDirectBom {
    includeConfigs = listOf("runtimeClasspath", "compileClasspath")
    skipConfigs = listOf(".*[Tt]est.*")

    projectType = "application"
    componentName = "my-service"
    componentVersion = "1.0.0"

    schemaVersion = org.cyclonedx.model.schema.SchemaVersion.VERSION_16
    includeBomSerialNumber = true
    includeLicenseText = false
    includeMetadataResolution = true
    includeBuildSystem = true

    jsonOutput.set(file("build/reports/sbom/${project.name}-bom.json"))
    xmlOutput.unsetConvention()  // JSON만 생성
}
```

**주요 프로퍼티:**

| 프로퍼티 | 기본값 | 설명 |
|---|---|---|
| `includeConfigs` | `[]` (전체) | 포함할 configuration (정규식 가능) |
| `skipConfigs` | `[]` | 제외할 configuration (정규식 가능) |
| `projectType` | `"library"` | `"application"`, `"library"`, `"container"` 등 |
| `schemaVersion` | `VERSION_16` | CycloneDX 스키마 버전 |
| `includeBuildSystem` | `true` | CI 빌드 시스템 URL 포함 |
| `componentVersion` | 프로젝트 버전 | 컴포넌트 버전 오버라이드 |

**init script 방식**: 빌드 파일 수정 없이 SBOM 생성 가능:

```kotlin
// init.gradle.kts
import org.cyclonedx.gradle.CyclonedxPlugin

initscript {
    repositories { gradlePluginPortal() }
    dependencies {
        classpath("org.cyclonedx.bom:org.cyclonedx.bom.gradle.plugin:3.2.4")
    }
}
rootProject { apply<CyclonedxPlugin>() }
```

```bash
./gradlew cyclonedxBom --init-script init.gradle.kts
```

**Gradle 버전 호환성:**

| 플러그인 버전 | Gradle 버전 |
|---|---|
| 3.x.x | Gradle 8.4+ |
| 2.x.x | Gradle 8.0+ |
| 1.x.x | Gradle <8.0 |

---

## 7. Shaded/Uber JAR 처리

Maven Shade Plugin이나 Gradle Shadow Plugin으로 uber JAR를 생성하면 의존성이 번들링된다.

정확한 SBOM을 위한 방법:
1. 셰이딩 **전에** SBOM 생성
2. cdxgen의 `--deep` 플래그로 JAR 내부 분석:

```bash
cdxgen -t java --deep -o sbom.cdx.json
```

---

## 8. Best Practices

1. **버전 명시** — 프로덕션 의존성에 버전 범위 사용 금지
2. **Gradle Lockfile 활성화** — 재현 가능한 빌드 보장
3. **BOM 활용** — Spring Boot BOM, Jackson BOM 등으로 버전 일관성 유지
4. **스코프 분리** — 컴파일/런타임 의존성을 명확히 구분
5. **테스트 의존성 제외** — 컴플라이언스 요건이 없으면 `skipConfigs`로 제외
6. **CI/CD 자동화** — 빌드마다 SBOM을 자동 생성하여 보안 스캐너에 공급

---

## Sources

- [SBOM Generation Guide for Java - Maven, Gradle](https://sbomify.com/guides/java/)
- [CycloneDX/cyclonedx-gradle-plugin: Creates CycloneDX Software Bill of Materials (SBOM) from Gradle projects](https://github.com/CycloneDX/cyclonedx-gradle-plugin)

---

## Related pages

- [[sbom]]
- [[querydsl]]
