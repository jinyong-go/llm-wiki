---
title: Gradle Shadow
updated: 2026-11-11 22:57:08
tags:
  - java
  - gradle
  - build-tool
---

## 1. 개요

Shadow는 런타임 의존성을 애플리케이션 JAR에 합쳐 Fat JAR을 만드는 Gradle 플러그인이다. 일반 JAR과 달리 실행에 필요한 라이브러리를 하나의 파일로 배포할 수 있다. Gradle의 `application` 플러그인과 함께 쓰는 기본 방법을 설명한다. Fat JAR의 다른 구성 방식은 [[gradle-application]]을 참고한다.

## 2. 적용과 실행

플러그인을 적용하고 메인 클래스를 지정한다. `<plugin-version>`에는 프로젝트에서 사용할 Shadow 플러그인 버전을 넣는다.

```groovy
plugins {
    id 'application'
    id 'com.gradleup.shadow' version '<plugin-version>'
}

application {
    mainClass = 'com.example.Main'
}
```

다음 명령으로 Fat JAR을 만들고 실행한다.

```bash
./gradlew shadowJar
java -jar build/libs/<project>-all.jar
```

Shadow는 `runtimeClasspath`의 의존성을 기본 병합 대상으로 삼는다. `application` 플러그인을 적용하면 `application.mainClass` 값을 매니페스트의 `Main-Class`로 사용한다. 의존성 서명 파일도 기본 제외하므로, 서명 파일로 인한 실행 오류를 피할 수 있다. 관련 오류의 원인은 [[fat-jar-signature-error]]에서 설명한다.

## 3. 의존성 선택

기본적으로 런타임 의존성이 Fat JAR에 포함된다. 특정 의존성을 제외하거나 병합 대상을 바꾸려면 `shadowJar` Task를 설정한다.

```groovy
tasks.shadowJar {
    dependencies {
        exclude(dependency('group:module:version'))
    }
}
```

의존성을 제외하면 해당 라이브러리는 결과물에서 빠진다. 필요한 라이브러리를 제외하면 애플리케이션 실행이 실패할 수 있으므로, 결과 JAR을 실행해 확인한다. Shadow 설정의 자세한 내용은 [의존성 구성 문서](https://gradleup.com/shadow/configuration/dependencies/)를 참고한다.

## 4. JAR 내용 처리

### 4.1. 서비스 파일 병합

여러 라이브러리에 같은 `META-INF/services` 파일이 있으면 기본 처리에서 일부 내용이 제외될 수 있다. 서비스 제공자를 모두 유지하려면 `mergeServiceFiles()`를 설정한다.

```groovy
tasks.shadowJar {
    mergeServiceFiles()
}
```

중복 파일 처리 방식은 서비스 파일 병합에도 영향을 준다. 해당 파일을 병합할 때는 `duplicatesStrategy`와 Shadow의 Resource Transformer 동작을 함께 확인한다. 자세한 설정은 [JAR 병합 문서](https://gradleup.com/shadow/configuration/merging/)를 참고한다.

### 4.2. 패키지 경로 변경

패키지 경로 변경(Relocation)은 의존 라이브러리의 바이트코드에 기록된 패키지 이름을 다른 이름으로 바꾸는 기능이다. 같은 라이브러리의 서로 다른 버전을 함께 포함해야 하는 등 클래스 이름 충돌을 피할 때 사용한다.

```groovy
tasks.shadowJar {
    relocate('org.example.library', 'com.example.internal.library')
}
```

Relocation은 지정한 패턴과 일치하는 프로젝트 코드와 의존성에도 적용될 수 있다. 적용 범위를 좁히고 실행 시 동적 클래스 로딩이 올바르게 동작하는지 확인한다. [Relocation 문서](https://gradleup.com/shadow/configuration/relocation/)에서 필터와 자동 설정을 설명한다.

### 4.3. JAR 내용 필터링

`include`와 `exclude`로 결과 JAR에 넣을 파일을 제한할 수 있다. 예를 들어 특정 설정 파일을 제외한다.

```groovy
tasks.shadowJar {
    exclude('a2.properties')
}
```

필터는 의존성 외에도 프로젝트 파일에 적용될 수 있다. 자세한 패턴과 적용 순서는 [필터링 문서](https://gradleup.com/shadow/configuration/filtering/)를 참고한다.

## 5. 고급 기능

Shadow는 사용하지 않는 클래스를 제거하는 최소화(Minimize) 기능도 제공한다. 리플렉션이나 문자열로 클래스를 불러오는 코드는 자동 분석에서 누락될 수 있어, 이 기능을 켜면 필요한 클래스를 수동으로 포함해야 할 수 있다. 최소화는 결과물 크기를 줄여야 할 때만 적용하고, 전체 실행 경로를 확인한다. 자세한 설정은 [Minimizing 문서](https://gradleup.com/shadow/configuration/minimizing/)를 참고한다.

Shadow는 `application` 플러그인과 함께 배포용 시작 스크립트 및 압축 배포본도 생성할 수 있다. 이 기능과 Shadow 버전별 요구사항은 공식 [Shadow 문서](https://gradleup.com/shadow/)에서 확인한다.

---

## Sources
- [Shadow Gradle Plugin: Introduction](https://gradleup.com/shadow/)
- [Shadow Gradle Plugin: Getting Started](https://gradleup.com/shadow/getting-started/)
- [Shadow Gradle Plugin: Integrating with Application Plugin](https://gradleup.com/shadow/application-plugin/)
- [Shadow Gradle Plugin: Configuring Shadowed Dependencies](https://gradleup.com/shadow/configuration/dependencies/)
- [Shadow Gradle Plugin: Controlling JAR Content Merging](https://gradleup.com/shadow/configuration/merging/)
- [Shadow Gradle Plugin: Relocating Packages](https://gradleup.com/shadow/configuration/relocation/)
- [Shadow Gradle Plugin: Filtering Shadow Jar Contents](https://gradleup.com/shadow/configuration/filtering/)
- [Shadow Gradle Plugin: Minimizing](https://gradleup.com/shadow/configuration/minimizing/)

---

## Related pages
- [[gradle-application]]
- [[fat-jar-signature-error]]
- [[gradle-task]]
- [[gradle-dependency-configurations]]
- [[gradle-multi-project]]
