---
title: JaCoCo — Java 테스트 커버리지 측정
updated: 2026-07-23 17:58:31
tags:
  - java
  - testing
  - coverage
  - jacoco
  - gradle
  - maven
---

## 1. 목적

**JaCoCo**(Java Code Coverage)는 테스트가 **소스 코드의 어느 부분을 실행했는지** 측정하는 커버리지 도구다.

- **미검증 코드 식별** — 테스트가 닿지 않은 분기·라인을 찾아 테스트 보강 지점을 드러낸다.
- **품질 게이트** — 최소 커버리지 기준을 빌드에 강제(`check`/verification)해 회귀를 막는다.
- **리포트 산출** — HTML/XML/CSV 리포트로 가시화하고, XML은 SonarQube 등 외부 도구가 소비한다.

> 커버리지는 "테스트가 실행한 코드 비율"이지 "테스트가 검증한 정확성"이 아니다. 높은 커버리지가 단언(assert) 품질을 보장하지 않는다.[^1]

[^1]: 커버리지의 측정 대상이 "실행 여부"라는 정의로부터 도출한 일반적 주장임. 출처가 단언 품질을 직접 다루지는 않는다.

---

## 2. 원리

JaCoCo는 **바이트코드 계측(instrumentation)** 으로 동작한다. 소스가 아니라 컴파일된 `.class` 바이트코드에 **프로브(probe)** 를 삽입해 실행 여부를 기록한다.

### 2.1. 기본 - On-the-fly 계측
- **Java agent**(`-javaagent`)가 클래스 로딩 시점에 바이트코드를 가로채 프로브를 주입한다. 원본 클래스 파일은 수정하지 않는다.
- 테스트 실행 중 프로브가 실행 데이터를 수집해 **`*.exec`**(execution data) 파일에 누적한다.
- 빌드 종료 후 `.exec` + 원본 클래스 + 소스를 결합해 리포트를 생성한다.

```
[test JVM] --javaagent:jacocoagent.jar--> 프로브 주입 → jacoco.exec
                                                          │
원본 .class + 소스 ───────────────────────────────────────┴─▶ HTML/XML/CSV 리포트
```

### 2.2. 대안 - Offline 계측
agent를 못 붙이는 환경(특수 런타임 등)에서는 빌드 시점에 클래스를 미리 계측하고(`instrument`) 나중에 원본을 복원(`restore-instrumented-classes`)한다. 일반적으로는 on-the-fly로 충분하다.

---

## 3. 커버리지 카운터

JaCoCo는 바이트코드 기준으로 여러 지표를 동시에 집계한다.

| 카운터 | 의미 | 비고 |
|--------|------|------|
| **Instructions** (C0) | 실행된 바이트코드 명령어 비율 | 가장 작은 단위. 디버그 정보·소스 포맷과 무관하게 항상 측정 |
| **Branches** (C1) | `if`/`switch` 분기 실행 비율 | 부분 실행은 노란 마름모(◆)로 표시 |
| **Lines** | 실행된 소스 라인 비율 | **디버그 정보(`-g`) 필요**. 빨강(미실행)/노랑(부분)/초록(전체) |
| **Methods** | 명령어가 하나라도 실행된 메서드 비율 | 생성자·static 초기화 포함 |
| **Classes** | 메서드가 하나라도 실행된 클래스 비율 | |
| **Cyclomatic Complexity** | 순환 복잡도. $v(G)=B-D+1$ | Missed complexity ≈ 완전 커버에 부족한 테스트 케이스 수 |

> Lines 카운터는 컴파일 시 디버그 정보가 있어야 한다(기본 활성). Instructions/Branches는 디버그 정보 없이도 측정된다.

---

## 4. 플러그인 추가

### 4.1. Maven

`jacoco-maven-plugin`을 `build/plugins`에 선언한다.

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.14</version>
</plugin>
```

선언만으로는 어떤 골도 빌드 단계에 바인딩되지 않는다. 실제 계측·리포트·검증은 `executions` 설정이 있어야 동작한다([§5.1](#51-maven--execution)).

### 4.2. Gradle

내장 `jacoco` 플러그인을 적용한다. 별도 의존성 없이 코어 배포에 포함된다.

```groovy
plugins {
    id 'java'
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.14"   // JaCoCo 버전 고정(선택)
}
```

적용 시점에 `jacocoTestReport`·`jacocoTestCoverageVerification` 태스크가 생성되지만, 리포트 형식·검증 규칙·`check` 연결은 태스크 설정에서 별도로 지정한다([§5.2](#52-gradle--task)).

---

## 5. 상세 설정

### 5.1. Maven — execution

핵심은 **`prepare-agent`**(테스트 JVM에 agent 부착)와 **`report`**(리포트 생성) 골을 빌드 단계에 바인딩하는 것이며, 여기에 **`check`**(기준 검사)를 더한다.

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.14</version>
  <executions>
    <!-- test 실행 전 agent 설정 (surefire에 argLine 주입) -->
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <!-- test 후 리포트 생성 (target/site/jacoco) -->
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <!-- 커버리지 기준 강제 -->
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

각 `execution`은 `goal`을 특정 `phase`에 바인딩한다. `prepare-agent`는 기본 `initialize`, `report`는 위처럼 `test` 단계에 건다.

주요 골: `prepare-agent`, `prepare-agent-integration`(IT용), `report`, `report-integration`, `report-aggregate`(멀티모듈 통합), `merge`(.exec 병합), `check`(기준 검사), `instrument`/`restore-instrumented-classes`(offline), `dump`(실행 중 JVM에서 데이터 추출).

> `prepare-agent`는 surefire/failsafe의 `argLine`에 agent 옵션을 주입한다. **`forkCount=0` 또는 `forkMode=never`** 로 두면 같은 JVM에서 돌아 agent가 동작하지 않으므로 피한다.

### 5.2. Gradle — task

플러그인 적용으로 생성된 태스크를 설정하고 `check`에 검증을 연결한다.

```groovy
test {
    finalizedBy jacocoTestReport     // 테스트 후 자동 리포트
}

jacocoTestReport {
    dependsOn test
    reports {
        html.required = true
        xml.required  = true         // SonarQube 등 연동 시
        csv.required  = false
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                counter = 'LINE'
                value   = 'COVEREDRATIO'
                minimum = 0.80
            }
        }
    }
}

check.dependsOn jacocoTestCoverageVerification   // check에 검증 연결(기본 미연결)
```

주요 태스크:
- **`jacocoTestReport`** — `test` 태스크 결과(`jacoco.exec`)로 리포트 생성. 기본 출력 `build/reports/jacoco/test/`.
- **`jacocoTestCoverageVerification`** — `violationRules` 기준 검증. **기본적으로 `check`의 의존이 아니므로** 위처럼 직접 연결해야 한다.

#### 태스크 공통 설정

두 태스크는 모두 `JacocoReportBase`를 상속하므로 분석 입력을 동일한 항목으로 제어한다.

- `executionData` — 집계할 실행 데이터(`.exec`) 지정. 태스크를 인자로 주면 그 태스크의
  실행 데이터를 사용한다: `executionData(test, integrationTest)`
- `classDirectories` — 분석 대상 클래스 디렉터리. `setFrom` + `fileTree(exclude:)`
  조합으로 측정 제외를 구현한다([§5.3](#53-측정-제외) 참고)
- `sourceDirectories` — 리포트에 연결할 소스 디렉터리
- `additionalClassDirs` / `additionalSourceDirs` — 다른 모듈의 클래스·소스 병합
  (멀티모듈 통합 리포트)
- `sourceSets(sourceSets.main)` — 소스셋 지정으로 클래스·소스 디렉터리 일괄 설정

#### jacocoTestReport 설정

전용 항목은 `reports`이며, 나머지는 위 공통 설정이다. `reports`의 `html`/`xml`/`csv`
각각에 다음을 지정한다.

- `required` — 해당 형식 생성 여부
- `outputLocation` — 출력 경로 (기본 `build/reports/jacoco/test/`)

```groovy
jacocoTestReport {
    reports {
        xml.required = true
        html.outputLocation = layout.buildDirectory.dir('jacocoHtml')
    }
}
```

#### jacocoTestCoverageVerification 설정

전용 항목은 `violationRules`이며, 나머지는 위 공통 설정이다.
계층은 `violationRules > rule > limit`이다.

**`violationRules`** — 규칙 컨테이너 (JacocoViolationRulesContainer)
- `failOnViolation` (기본 `true`) — `false`면 기준 미달 시 빌드 실패 대신 경고만 출력
- `rule { }` — 규칙을 여러 개 정의할 수 있고 각각 독립적으로 평가된다

**`rule`** — 검증 규칙 (JacocoViolationRule)
- `enabled` (기본 `true`) — 규칙 활성화 여부
- `element` (기본 `BUNDLE`) — 평가 단위: `BUNDLE`(프로젝트 전체 집계) /
  `PACKAGE`(패키지별) / `CLASS`(클래스별) / `SOURCEFILE`(소스 파일별) / `METHOD`(메서드별).
  `BUNDLE`은 전체 평균이라 특정 클래스가 0%여도 통과할 수 있다 — 클래스 단위
  하한이 필요하면 `CLASS`로 건다
- `includes` (기본 `['*']`) / `excludes` (기본 빈 목록) — element 이름 패턴
  (`*`, `?` 와일드카드)으로 규칙 적용 대상을 제한
- `limit { }` — 한 규칙에 카운터별로 여러 개 정의 가능

**`limit`** — 임계값 (JacocoLimit)
- `counter` (기본 `INSTRUCTION`) — 검사할 카운터: `INSTRUCTION` / `LINE` / `BRANCH` /
  `METHOD` / `CLASS` / `COMPLEXITY` (3장의 커버리지 카운터와 대응)
- `value` (기본 `COVEREDRATIO`) — 측정 방식: `COVEREDRATIO`(커버 비율 0~1) /
  `MISSEDRATIO`(미커버 비율) / `COVEREDCOUNT`(커버 절대 수) / `MISSEDCOUNT`(미커버
  절대 수) / `TOTALCOUNT`(전체 수)
- `minimum` / `maximum` (기본 없음) — 하한/상한. 측정값이 범위를 벗어나면 위반.
  예: `MISSEDCOUNT` + `maximum = 0` → 하나라도 놓치면 실패

```groovy
jacocoTestCoverageVerification {
    violationRules {
        failOnViolation = true
        rule {                                   // 전체 라인 커버리지 80%
            limit {
                counter = 'LINE'
                value   = 'COVEREDRATIO'
                minimum = 0.80
            }
        }
        rule {                                   // 서비스 클래스에만 강화 기준
            element  = 'CLASS'
            includes = ['com.example.service.*']
            limit {                              // 분기 커버리지 90%
                counter = 'BRANCH'
                minimum = 0.90
            }
            limit {                              // 미커버 메서드 5개 이하
                counter = 'METHOD'
                value   = 'MISSEDCOUNT'
                maximum = 5
            }
        }
    }
}
```

### 5.3. 측정 제외

불필요한 대상은 exclusion으로 제외한다. DTO·설정·생성 코드 등 의미 없는 대상이 해당된다.

#### Maven

플러그인 `configuration`의 `excludes`에 클래스 경로 패턴을 지정한다. `report`·`check` 골에 공통 적용된다.

```xml
<configuration>
  <excludes>
    <exclude>**/dto/**</exclude>
    <exclude>**/config/**</exclude>
  </excludes>
</configuration>
```

#### Gradle

리포트 태스크의 `classDirectories`를 `fileTree(exclude:)`로 재구성한다([§5.2](#52-gradle--task) 공통 설정).

```groovy
jacocoTestReport {
    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: ['**/dto/**', '**/config/**', '**/*Application.*'])
        }))
    }
}
```

---

## 6. 사용 방법

### 6.1. 실행과 리포트 위치
```bash
# Maven
mvn test            # prepare-agent → 테스트 → report
# 리포트: target/site/jacoco/index.html

# Gradle
./gradlew test jacocoTestReport
# 리포트: build/reports/jacoco/test/html/index.html
```

### 6.2. 기준 검증
```bash
mvn verify                              # check 골 평가 → 미달 시 빌드 실패
./gradlew jacocoTestCoverageVerification # 또는 check (위 연결 시)
```

---

## 7. 최소 커버리지 기준

절대적인 표준 수치는 없으나, 널리 인용되는 기준은 다음과 같다.

- **Google Testing Blog**: 60% = acceptable, 75% = commendable, 90% = exemplary
- **SonarQube 기본 Quality Gate**(Sonar way): **신규 코드 커버리지 80% 이상**
- 실무에서는 위 예시(`minimum = 0.80`)처럼 **라인 커버리지 80%** 를 게이트로 쓰는
  경우가 많다.[^2]

[^2]: SonarQube 기본 Quality Gate(신규 코드 80%)와 업계 관행에 근거한 일반화임.

주의: 커버리지 수치를 목표로 강제하면 단언 없는 무의미한 테스트가 늘 수 있다.
수치는 미검증 영역을 찾는 신호로 쓰고, 테스트 품질은 [[good-test-practices]]와
변이 테스트(PIT)로 보완한다.

---

## 8. 요약

- JaCoCo는 Java agent로 바이트코드에 프로브를 주입해 `.exec`에 실행 데이터를 모으고 HTML/XML/CSV 리포트를 만든다.
- 카운터: Instructions(C0)·Branches(C1)·Lines·Methods·Classes·Cyclomatic Complexity. Lines는 디버그 정보 필요.
- Maven은 `jacoco-maven-plugin`의 `prepare-agent`+`report`(+`check`), Gradle은 `jacoco` 플러그인의 `jacocoTestReport`+`jacocoTestCoverageVerification`. 검증을 `check`/`verify`에 연결해 품질 게이트로 쓴다.

---

## Sources
- JaCoCo Documentation — Overview: https://www.jacoco.org/jacoco/trunk/doc/
- JaCoCo — Coverage Counters: https://www.jacoco.org/jacoco/trunk/doc/counters.html
- JaCoCo — Maven Plug-in: https://www.jacoco.org/jacoco/trunk/doc/maven.html
- Gradle — The JaCoCo Plugin: https://docs.gradle.org/current/userguide/jacoco_plugin.html
- Gradle DSL — JacocoReport: https://docs.gradle.org/current/dsl/org.gradle.testing.jacoco.tasks.JacocoReport.html
- Gradle DSL — JacocoCoverageVerification: https://docs.gradle.org/current/dsl/org.gradle.testing.jacoco.tasks.JacocoCoverageVerification.html
- Gradle Javadoc — JacocoViolationRule: https://docs.gradle.org/current/javadoc/org/gradle/testing/jacoco/tasks/rules/JacocoViolationRule.html
- Gradle Javadoc — JacocoLimit: https://docs.gradle.org/current/javadoc/org/gradle/testing/jacoco/tasks/rules/JacocoLimit.html
- Google Testing Blog — Code Coverage Best Practices: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
- SonarQube — Quality Gates: https://docs.sonarsource.com/sonarqube/latest/user-guide/quality-gates/
- Martin Fowler — TestCoverage: https://martinfowler.com/bliki/TestCoverage.html

---

## Related pages
- [[java-testing-libraries]] — Java 테스트 라이브러리 개요(JaCoCo의 위치)
- [[jvm-options]] — `-javaagent` 등 JVM 에이전트 옵션
