---
title: JVM 실행 옵션 — java 명령어
updated: 2026-08-31 14:25:48
tags:
  - java
  - jvm
  - options
  - gc
  - memory
---

## 1. 옵션 분류

| 접두사 | 분류 | 특성 |
|---|---|---|
| (없음) | Standard | 모든 JVM 구현 보장 |
| `-X` | Non-Standard / Extra | HotSpot 전용, 변경 가능 |
| `-XX` | Advanced | 하위 수준 튜닝·진단, 구현별 상이, 변경 가능 |

`-XX` Boolean 옵션: `-XX:+OptionName`(활성) / `-XX:-OptionName`(비활성) 크기 단위: `k`/`K`(KB), `m`/`M`(MB), `g`/`G`(GB)

---

## 2. 메모리

### 2.1. 힙

| 옵션 | 설명 |
|---|---|
| `-Xms<size>` | 초기(최소) 힙 크기. `-XX:InitialHeapSize`와 동일 |
| `-Xmx<size>` | 최대 힙 크기. `-XX:MaxHeapSize`와 동일 |
| `-XX:InitialRAMPercentage=<pct>` | 시스템 메모리 대비 초기 힙 비율 |
| `-XX:MaxRAMPercentage=<pct>` | 시스템 메모리 대비 최대 힙 비율 (컨테이너 환경에서 유용) |
| `-XX:MinHeapFreeRatio=<pct>` | GC 후 힙에 유지할 최소 여유 공간 비율 |
| `-XX:MaxHeapFreeRatio=<pct>` | GC 후 힙에 유지할 최대 여유 공간 비율 |
| `-XX:+AlwaysPreTouch` | JVM 시작 시 힙 전체 페이지를 미리 초기화. 런타임 지연 감소, 시작 시간 증가 |
| `-Xmn<size>` | Young Generation 크기 (G1에서는 권장하지 않음) |

서버 배포 시 `-Xms`와 `-Xmx`를 동일 값으로 설정하면 리사이징 오버헤드를 없앨 수 있다.

### 2.2. Metaspace

| 옵션 | 설명 |
|---|---|
| `-XX:MetaspaceSize=<size>` | Metaspace 초기 크기 (이 크기 도달 시 첫 GC 트리거) |
| `-XX:MaxMetaspaceSize=<size>` | Metaspace 최대 크기. 미설정 시 제한 없음 |
| `-XX:CompressedClassSpaceSize=<size>` | 압축 클래스 포인터 사용 시 클래스 메타데이터 저장 공간 크기 |

### 2.3. 스택 및 기타

| 옵션 | 설명 |
|---|---|
| `-Xss<size>` | 스레드 스택 크기. `-XX:ThreadStackSize`와 동일. 기본값은 플랫폼별 상이 (Linux/x64: 1024KB) |
| `-XX:MaxDirectMemorySize=<size>` | NIO Direct Buffer (`java.nio`) 최대 크기 |
| `-XX:-UseCompressedOops` | 압축 포인터 비활성화. 기본 활성, 32GB 이하 힙에서 성능 향상 |

---

## 3. GC 선택

Java 9부터 G1이 기본 GC다. 각 GC의 동작·장단점·지원 이력은 [[gc]] 참고.

| 옵션 | GC | 특성 |
|---|---|---|
| `-XX:+UseSerialGC` | Serial | 단일 스레드, 소규모 앱 |
| `-XX:+UseParallelGC` | Parallel (Throughput) | 처리량 중심 |
| `-XX:+UseG1GC` | G1 | 기본값(Java 9+). 처리량·지연 균형 |
| `-XX:+UseZGC` | ZGC | 저지연, Java 15 정식 도입. Generational ZGC: Java 21 |
| `-XX:+UseShenandoahGC` | Shenandoah | 저지연, JDK12+. 벤더·버전별 가용성 상이 |
| `-XX:+UseEpsilonGC` | Epsilon | GC 없음 (메모리 소진 시 OOM). 성능 테스트·단명 프로세스 |

> CMS(`UseConcMarkSweepGC`)는 Java 9에서 deprecated, Java 14에서 제거됨.

### 3.1. G1 주요 옵션

| 옵션 | 설명 |
|---|---|
| `-XX:G1HeapRegionSize=<size>` | 리전 크기. 1MB~32MB, 2의 거듭제곱. 기본값은 힙 크기 기반 자동 결정 |
| `-XX:InitiatingHeapOccupancyPercent=<pct>` | Old Generation 점유율이 이 값 도달 시 concurrent marking 시작 (기본 45%) |
| `-XX:G1ReservePercent=<pct>` | 승격 실패 방지용 예약 힙 비율 (기본 10%) |
| `-XX:MaxGCPauseMillis=<ms>` | 목표 최대 STW 시간 (기본 200ms). 보장값이 아닌 목표값 |
| `-XX:ConcGCThreads=<n>` | 동시 GC 스레드 수 (기본: ParallelGCThreads의 약 1/4) |
| `-XX:ParallelGCThreads=<n>` | STW GC 스레드 수 |

---

## 4. GC 로깅

### 4.1. Unified Logging (`-Xlog`)

Java 9부터 지원한다.

```bash
# 기본 GC 이벤트
java -Xlog:gc -jar app.jar

# 상세 GC 로그 (구 -XX:+PrintGCDetails)
java -Xlog:gc* -jar app.jar

# 파일 출력 + 타임스탬프
java -Xlog:gc*:file=/var/log/gc.log:time,uptime -jar app.jar

# 컨테이너 진단
java -Xlog:os+container=trace -jar app.jar
```

> `-XX:+PrintGC`와 `-XX:+PrintGCDetails`는 Java 9에서 deprecated. `-Xlog`로 대체.  
> `-verbose:gc`는 `-Xlog:gc`와 동일하며 여전히 사용 가능.

---

## 5. JIT 컴파일

| 옵션 | 설명 |
|---|---|
| `-XX:-TieredCompilation` | Tiered Compilation 비활성화 (기본 활성) |
| `-XX:CICompilerCount=<n>` | JIT 컴파일러 스레드 수 (기본: CPU·메모리 기반 자동 결정) |
| `-XX:ReservedCodeCacheSize=<size>` | JIT 컴파일된 네이티브 코드 저장 최대 크기 (기본 240MB, tiered 비활성 시 48MB) |
| `-XX:CompileThreshold=<n>` | 메서드 최초 컴파일 전 호출 횟수 임계값 |
| `-XX:CompileThresholdScaling=<x>` | 컴파일 임계값 스케일 (0~+Inf. 1.0 미만: 조기 컴파일, 0: 컴파일 비활성) |
| `-XX:MaxInlineSize=<bytes>` | 인라이닝 대상 최대 바이트코드 크기 (기본 35 bytes) |
| `-XX:+PrintCompilation` | 메서드 컴파일 시마다 콘솔 출력 |
| `-XX:+LogCompilation` | JIT 컴파일 상세 로그를 파일에 기록 (`-XX:+UnlockDiagnosticVMOptions` 필요) |

---

## 6. 진단 및 OOM 처리

### 6.1. 힙 덤프

```bash
java -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/var/log/java/heap.hprof \
     -jar app.jar
```

| 옵션 | 설명 |
|---|---|
| `-XX:+HeapDumpOnOutOfMemoryError` | OOM 발생 시 힙 덤프 자동 생성 |
| `-XX:HeapDumpPath=<path>` | 힙 덤프 파일 경로 (`%p` = PID) |

### 6.2. OOM 동작 제어

| 옵션 | 설명 |
|---|---|
| `-XX:+ExitOnOutOfMemoryError` | OOM 즉시 JVM 종료 |
| `-XX:+CrashOnOutOfMemoryError` | OOM 시 코어 덤프 후 크래시 |
| `-XX:OnOutOfMemoryError="<cmd>"` | OOM 발생 시 실행할 셸 명령 |
| `-XX:OnError="<cmd>"` | 복구 불가 오류 발생 시 실행할 셸 명령 |

### 6.3. 네이티브 메모리 추적

```bash
java -XX:NativeMemoryTracking=summary -jar app.jar
# 실행 중 조회
jcmd <pid> VM.native_memory summary
```

| 모드 | 설명 |
|---|---|
| `off` | 추적 안 함 (기본) |
| `summary` | JVM 서브시스템별 메모리 추적 |
| `detail` | CallSite·가상 메모리 영역별 상세 추적 |

`-XX:+PrintNMTStatistics`: JVM 종료 시 NMT 데이터 출력 (NativeMemoryTracking 활성 필요).

### 6.4. 기타 진단

| 옵션 | 설명 |
|---|---|
| `-XX:ErrorFile=<path>` | 복구 불가 오류 발생 시 저장할 로그 파일 경로 (기본: `hs_err_pid<pid>.log`) |
| `-XX:+UnlockDiagnosticVMOptions` | 진단용 옵션 잠금 해제 (`-XX:+LogCompilation` 등 필요) |
| `-XX:+ShowCodeDetailsInExceptionMessages` | NPE 메시지에 구체적 null 참조 정보 포함 (기본 활성, Java 14+) |
| `-XX:+DisableAttachMechanism` | jcmd/jstack/jmap 등 Attach API 비활성화 |
| `-XX:+PrintClassHistogram` | SIGQUIT(Linux) / Ctrl+C(Windows) 신호 수신 시 클래스 히스토그램 출력 |

---

## 7. Ergonomics

JVM은 하드웨어(CPU, 메모리)에 따라 GC, 힙 크기 등을 자동으로 결정한다.

```bash
# 현재 환경의 모든 플래그 기본값 확인
java -XX:+PrintFlagsFinal -version

# 실제 적용된 ergonomic 플래그만 확인
java -XX:+PrintCommandLineFlags -version
```

---

## 8. 시스템 프로퍼티 (`-D`)

```bash
java -Dserver.port=8080 -Dspring.profiles.active=prod -jar app.jar
```

[[externalized-configuration]] 의 PropertySource 우선순위에서 Java System properties(순위 6)에 해당한다.

---

## 9. 모듈 시스템

Java 9에서 도입되었다.

Java 17 이상에서 JDK 내부 API 접근 시 강한 캡슐화로 인해 `--add-opens`가 필요할 수 있다.

```bash
# 특정 패키지 열기
java --add-opens java.base/java.lang=ALL-UNNAMED -jar app.jar

# 리플렉션 허용 (Spring Boot 등에서 자주 필요)
java --add-opens java.base/java.lang.reflect=ALL-UNNAMED \
     --add-opens java.base/java.util=ALL-UNNAMED \
     -jar app.jar
```

| 옵션 | 설명 |
|---|---|
| `--add-opens <module>/<package>=<target>` | 패키지를 타겟 모듈에 open (딥 리플렉션 허용) |
| `--add-exports <module>/<package>=<target>` | 패키지를 타겟 모듈에 export (공개 API 접근 허용) |
| `--add-modules <module>` | 추가 루트 모듈 지정 |

---

## 10. 컨테이너 환경

| 옵션 | 설명 |
|---|---|
| `-XX:+UseContainerSupport` | 컨테이너 CPU·메모리 제한 자동 감지 (기본 활성, Linux) |
| `-XX:ActiveProcessorCount=<n>` | JVM이 인식할 CPU 수 강제 지정 |
| `-XX:MaxRAMPercentage=75.0` | 컨테이너 메모리의 75%를 힙으로 사용 |

Docker 환경에서 `-Xmx` 고정값 대신 `-XX:MaxRAMPercentage`를 사용하면 컨테이너 메모리 변경에 자동으로 대응한다.

---

## 11. 주요 실전 예시

```bash
# Spring Boot 운영 서버
java \
  -Xms2g -Xmx2g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/var/log/heap.hprof \
  -XX:+ExitOnOutOfMemoryError \
  -Xlog:gc*:file=/var/log/gc.log:time,uptime \
  -jar app.jar

# 컨테이너 환경
java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseZGC \
  -XX:+ExitOnOutOfMemoryError \
  -jar app.jar
```

---

## Sources

- [The java Command (JDK 21 Tool Specifications)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [Exploring Advanced JVM Options (Baeldung)](https://www.baeldung.com/jvm-advanced-options)

---

## Related pages

- [[gc]]
- [[java-version]]
- [[java-process-analysis-tools]]
- [[externalized-configuration]]
