---
title: Maven
updated: 2026-07-22 10:45:47
tags:
  - java
  - maven
  - build-tool
---

## 1. 개요

**Maven**은 POM(Project Object Model, `pom.xml`)에 정의된 정보를 바탕으로 빌드를 수행하는 빌드 도구다. 대부분의 설정에 기본값(convention over configuration)을 두어, 표준 구조를 따르면 최소한의 설정만으로 빌드할 수 있다.

| 개념 | 의미 |
|---|---|
| POM | `pom.xml` — 프로젝트 정보·의존성·플러그인 등 빌드에 필요한 모든 설정을 담는 XML 파일 |
| Coordinate(GAV) | `groupId:artifactId:version` — 프로젝트(아티팩트)를 식별하는 좌표 |
| Lifecycle | 빌드 단계의 큰 흐름. `default`/`clean`/`site` 3종 |
| Phase | Lifecycle을 구성하는 개별 단계(`compile`, `test`, `package` 등). 정해진 순서로 실행됨 |
| Plugin | Goal을 제공하는 단위. Maven 코어는 빌드 기능이 거의 없고 대부분 플러그인이 담당 |
| Goal | 플러그인이 제공하는 개별 작업(`compiler:compile` 등). 0개 이상의 Phase에 바인딩됨 |
| Repository | 아티팩트 저장소. 로컬(`~/.m2/repository`)과 원격(Central 등)으로 구분 |

---

## 2. POM(pom.xml)

### 2.1. 최소 POM과 좌표

POM에 최소한 필요한 요소는 `modelVersion`, `groupId`, `artifactId`, `version`이다. 세 값(GAV)이 프로젝트의 좌표를 이룬다.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
</project>
```

명시하지 않은 설정은 Maven의 기본 POM인 **Super POM**의 값을 상속한다 — 빌드 디렉터리 `target`, 소스 디렉터리 `src/main/java`, 패키징 타입 `jar`, 원격 리포지토리로 Maven Central(`https://repo.maven.apache.org/maven2`) 등이 기본값이다.

### 2.2. 상속(Parent POM)

`<parent>` 요소로 다른 POM을 부모로 지정하면 의존성·플러그인 설정·리소스 등을 상속받는다. 부모 POM이 모듈과 같은 디렉터리 계층에 없으면 `<relativePath>`로 위치를 지정한다.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>com.mycompany.app</groupId>
    <artifactId>my-app</artifactId>
    <version>1</version>
  </parent>
  <artifactId>my-module</artifactId>
</project>
```

`groupId`/`version`을 모듈에서 생략하면 부모의 값을 그대로 물려받는다.

### 2.3. Aggregation(멀티모듈)

부모 POM의 `packaging`을 `pom`으로 설정하고 `<modules>`에 하위 모듈 디렉터리를 나열하면, 부모 프로젝트에 대한 Maven 명령이 모든 모듈에 함께 실행된다. 상속(모듈 → 부모 참조)과 Aggregation(부모 → 모듈 나열)은 별개의 메커니즘으로, 함께 쓰이는 경우가 많다.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
  <packaging>pom</packaging>
  <modules>
    <module>my-module</module>
  </modules>
</project>
```

---

## 3. 디렉터리 구조 컨벤션

| 경로 | 내용 |
|---|---|
| `src/main/java` | 애플리케이션/라이브러리 소스 |
| `src/main/resources` | 애플리케이션/라이브러리 리소스 |
| `src/main/webapp` | 웹 애플리케이션 소스 |
| `src/test/java` | 테스트 소스 |
| `src/test/resources` | 테스트 리소스 |
| `src/it` | (주로 플러그인용) 통합 테스트 |
| `src/assembly` | Assembly 디스크립터 |
| `target` | 빌드 산출물 디렉터리 |

이 구조를 따르면 별도 설정 없이 Maven이 소스·리소스 위치를 인식한다. 필요 시 POM에서 개별 경로를 재정의할 수 있다.

---

## 4. 빌드 라이프사이클

### 4.1. 3개의 Lifecycle

Maven은 `default`(배포까지의 빌드), `clean`(정리), `site`(프로젝트 사이트 생성) 3개의 내장 Lifecycle을 제공한다. 각 Lifecycle은 정해진 순서의 Phase로 구성된다.

### 4.2. default Lifecycle의 주요 Phase

```
validate → compile → test → package → verify → install → deploy
```

| Phase | 내용 |
|---|---|
| `validate` | 프로젝트 정보가 올바르고 필요한 정보가 모두 있는지 검증 |
| `compile` | 소스 코드 컴파일 |
| `test` | 컴파일된 소스 코드를 단위 테스트 |
| `package` | 컴파일된 코드를 JAR 등 배포 형식으로 패키징 |
| `verify` | 통합 테스트 결과 등 품질 기준 충족 여부 검사 |
| `install` | 로컬 리포지토리에 설치(다른 로컬 프로젝트의 의존성으로 사용 가능) |
| `deploy` | 빌드 환경에서 원격 리포지토리로 최종 패키지 배포 |

Phase는 **순차적으로** 실행된다 — 특정 Phase를 호출하면 그 앞의 모든 Phase가 먼저 실행된다. 예를 들어 `mvn install`은 `validate`부터 `install`까지 전부 실행한다.

### 4.3. Phase-Goal 바인딩

각 Phase는 그 자체로는 아무 동작도 하지 않으며, 플러그인의 **Goal**이 바인딩되어야 실제 작업을 수행한다. `packaging`(`jar`, `war` 등) 값에 따라 기본 바인딩이 결정된다. `jar` 패키징의 기본 바인딩은 다음과 같다.

| Phase | plugin:goal |
|---|---|
| `process-resources` | `resources:resources` |
| `compile` | `compiler:compile` |
| `process-test-resources` | `resources:testResources` |
| `test-compile` | `compiler:testCompile` |
| `test` | `surefire:test` |
| `package` | `jar:jar` |
| `install` | `install:install` |
| `deploy` | `deploy:deploy` |

POM의 `<plugins>`에 실행(`<executions>`)을 추가로 선언하면, 패키징이 기본 제공하는 Goal 외의 Goal도 특정 Phase에 바인딩할 수 있다.

---

## 5. 플러그인과 Goal

Maven 코어는 Lifecycle·Phase 구조만 제공하고, 실제 빌드 동작(컴파일·테스트·패키징 등)은 전부 플러그인이 제공하는 **Goal**로 이뤄진다. Goal은 Phase에 바인딩되지 않고 단독으로도 실행할 수 있다.

```bash
mvn dependency:copy-dependencies      # 특정 Goal만 단독 실행
mvn clean dependency:copy-dependencies package   # Phase와 Goal을 함께 지정
```

대표적인 core 플러그인:

| 플러그인 | Goal 예시 | 역할 |
|---|---|---|
| `maven-compiler-plugin` | `compile`, `testCompile` | 소스 컴파일 |
| `maven-surefire-plugin` | `test` | 단위 테스트 실행 |
| `maven-jar-plugin` | `jar` | JAR 패키징 |
| `maven-resources-plugin` | `resources`, `testResources` | 리소스 복사 |
| `maven-install-plugin` | `install` | 로컬 리포지토리 설치 |
| `maven-deploy-plugin` | `deploy` | 원격 리포지토리 배포 |
| `maven-dependency-plugin` | `tree`, `copy-dependencies`, `analyze` | 의존성 조회·분석 |

---

## 6. 의존성 관리

### 6.1. 의존성 선언

```xml
<dependencies>
  <dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

### 6.2. Scope

| Scope | 컴파일 클래스패스 | 런타임 클래스패스 | 전이 전파 | 설명 |
|---|---|---|---|---|
| `compile`(기본값) | O | O | O | 모든 클래스패스에서 사용 가능, 의존 프로젝트에도 전파 |
| `provided` | O | X | X | 컴파일·테스트 시에만 필요, 컨테이너/JDK가 런타임에 제공(예: `servlet-api`) |
| `runtime` | X | O | O | 컴파일에는 불필요, 실행 시에만 필요 |
| `test` | 테스트에만 | 테스트에만 | X | 테스트 컴파일·실행 전용(예: JUnit) |
| `system` | O | O | X | 리포지토리를 거치지 않고 로컬 파일 시스템의 jar를 직접 참조 |
| `import` | - | - | - | `dependencyManagement`의 `pom` 타입 의존성 전용, 다른 POM의 의존성 관리 목록을 그대로 가져옴 |

### 6.3. dependencyManagement — 버전 중앙 관리

부모 POM의 `<dependencyManagement>`에 버전을 선언해두면, 자식 모듈은 버전 없이 `groupId`/`artifactId`만으로 의존성을 선언할 수 있다.

```xml
<!-- 부모 POM -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.guava</groupId>
      <artifactId>guava</artifactId>
      <version>32.1.2-jre</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

```xml
<!-- 자식 모듈 -->
<dependencies>
  <dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
  </dependency>
</dependencies>
```

### 6.4. 전이 의존성 제어

- **exclusion** — 특정 전이 의존성을 제외
- **optional** — 의존성을 선택적으로 표시해, 이 프로젝트를 의존하는 다른 프로젝트에 전파되지 않게 함

```xml
<dependency>
  <groupId>com.example</groupId>
  <artifactId>some-lib</artifactId>
  <version>1.0</version>
  <exclusions>
    <exclusion>
      <groupId>commons-logging</groupId>
      <artifactId>commons-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>
```

```bash
mvn dependency:tree    # 의존성 트리 조회
```

---

## 7. 리포지토리

Maven 리포지토리는 **local**(로컬 컴퓨터의 캐시, 기본 `~/.m2/repository`)과 **remote**(원격 서버) 두 종류뿐이다. 프로젝트가 로컬 리포지토리에 없는 의존성을 선언하면 원격에서 다운로드해 로컬에 캐시한다.

- 별도 설정이 없으면 원격 리포지토리로 **Maven Central**(`https://repo.maven.apache.org/maven2`)을 사용한다
- `settings.xml`에 **mirror**를 지정해 다운로드 경로를 재정의할 수 있다
- 사내 등에서 자체 아티팩트를 공유·배포하려면 POM의 `<repositories>`에 내부 리포지토리를 추가한다

```xml
<repositories>
  <repository>
    <id>my-internal-site</id>
    <url>https://myserver/repo</url>
  </repository>
</repositories>
```

```bash
mvn -o package    # 오프라인 빌드(네트워크 접근 없이)
```

---

## 8. 멀티모듈 빌드(Reactor)

여러 모듈로 구성된 프로젝트를 처리하는 메커니즘을 **Reactor**라 한다. Reactor는 빌드할 모듈을 수집하고, 모듈 간 의존관계(프로젝트 의존성, 플러그인 의존성 등)를 분석해 올바른 빌드 순서로 정렬한 뒤 순서대로 빌드한다.

| 옵션 | 설명 |
|---|---|
| `-pl`, `--projects` | 지정한 모듈만 빌드 |
| `-am`, `--also-make` | 지정한 모듈이 의존하는 모듈도 함께 빌드 |
| `-amd`, `--also-make-dependents` | 지정한 모듈에 의존하는 모듈도 함께 빌드 |
| `-rf`, `--resume-from` | 지정한 모듈부터 재개(중간 실패 후 재시작 시 유용) |
| `-ff`, `--fail-fast`(기본값) | 모듈 빌드 실패 시 즉시 전체 중단 |
| `-fae`, `--fail-at-end` | 실패해도 나머지 모듈을 계속 빌드하고 끝에 실패 목록 출력 |
| `-N`, `--non-recursive` | Reactor를 쓰지 않고 현재 디렉터리 프로젝트만 빌드 |

```bash
mvn install -pl my-module -am    # my-module과 그 의존 모듈만 빌드
```

---

## 9. CLI 사용법

```
mvn [options] [<goal(s)>] [<phase(s)>]
```

```bash
mvn clean install       # clean 후 install까지의 default lifecycle 실행
mvn verify               # validate~verify까지 실행 — 확실치 않을 때 권장되는 호출
mvn compiler:compile     # 특정 Goal만 단독 실행
```

### 9.1. 자주 쓰는 옵션

| 옵션 | 설명 |
|---|---|
| `-D`, `--define <key>=<value>` | 사용자 프로퍼티 정의(예: `-DskipTests`, `-Dmaven.test.skip=true`) |
| `-P`, `--activate-profiles` | 활성화할 profile 목록(콤마 구분) |
| `-o`, `--offline` | 오프라인 빌드 |
| `-U`, `--update-snapshots` | 릴리스 누락·SNAPSHOT 갱신 여부를 원격에서 강제 확인 |
| `-q`, `--quiet` | 에러만 출력 |
| `-X`, `--debug` | 디버그 로그 출력 |
| `-e`, `--errors` | 에러 발생 시 상세 메시지 출력 |
| `-T`, `--threads` | 병렬 빌드 스레드 수(예: `-T 4`, `-T 1C`) |
| `-f`, `--file` | 사용할 POM 파일 지정 |
| `-fae` / `-ff` / `-fn` | 실패 처리 방식(끝까지 진행/즉시 중단(기본)/절대 실패 안 함) |
| `-N`, `--non-recursive` | 하위 모듈로 재귀하지 않음 |

```bash
mvn install -DskipTests           # 테스트 생략하고 install
mvn clean package -Pprod          # prod profile 활성화
mvn install -T 4                  # 4개 스레드로 병렬 빌드
```

---

## Sources
- Apache Maven — Introduction to the POM: https://maven.apache.org/guides/introduction/introduction-to-the-pom.html
- Apache Maven — Introduction to the Build Lifecycle: https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html
- Apache Maven — Introduction to the Standard Directory Layout: https://maven.apache.org/guides/introduction/introduction-to-the-standard-directory-layout.html
- Apache Maven — Introduction to the Dependency Mechanism: https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html
- Apache Maven — Introduction to Repositories: https://maven.apache.org/guides/introduction/introduction-to-repositories.html
- Apache Maven — Guide to Working with Multiple Modules: https://maven.apache.org/guides/mini/guide-multiple-modules.html
- Apache Maven — CLI Options Reference: https://maven.apache.org/ref/current/maven-embedder/cli.html

---

## Related pages
- [[gradle]] — Gradle 개요(§9 Maven과 비교)
