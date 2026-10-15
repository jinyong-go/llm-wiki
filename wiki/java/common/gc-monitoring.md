---
title: GC 모니터링
updated: 2026-10-15 22:47:28
tags:
  - java
  - jvm
  - gc
  - monitoring
---

## 1. 개요

GC 모니터링은 GC가 애플리케이션 지연과 처리량에 주는 영향을 측정하는 작업이다. GC 종류별 동작은 [[gc]], 진단 도구 전반은 [[java-process-analysis-tools]]에서 다룬다.

GC 로그와 JDK 명령어는 JVM 상태를 기록하거나 조회한다. JFR은 GC 이벤트를 할당·스레드 이벤트와 함께 분석하고, JMX·Micrometer는 지표를 대시보드와 알림으로 제공한다.

| 수단 | 시점 | 오버헤드 | 용도 |
|---|---|---|---|
| `-Xlog:gc*` | 기동 시 설정, `jcmd VM.log`로 실행 중 변경 | 낮음 | 상시 기록, 사후 분석 |
| `jstat` | 실행 중 | 낮음 | 실시간 추이 확인 |
| `jcmd` | 실행 중 | 명령별 상이 | 힙 상태, 로그·JFR 제어 |
| JFR | 실행 중 또는 기동 시 | 낮음 | GC 이벤트와 할당·스레드 상관 분석 |
| JMX·Micrometer | 상시 | 낮음 | 대시보드, 알림 |

오버헤드는 일반적인 경향을 나타낸다. 실제 영향은 JFR 설정, 샘플링 빈도, 로그 출력 위치와 애플리케이션 부하에 따라 달라진다.

## 2. 지표

| 지표 | 정의 | 이상 징후 |
|---|---|---|
| 정지 시간 | GC가 애플리케이션을 멈추고 공간을 회수하는 시간 | 최대값이나 p99가 응답 시간 목표를 초과 |
| 빈도 | 단위 시간당 GC 횟수 | Young GC 간격이 짧아지거나 Full GC 발생 |
| 처리량 | 전체 시간 중 GC 외 애플리케이션 시간의 비율 | 감소 |
| GC 후 Old 사용량 | GC 직후 살아남은 장기 객체 크기 | Full GC 후에도 계속 증가하면 메모리 누수 의심 |
| 할당률 | 단위 시간당 Young 영역 할당량 | 급증하면 Young GC 빈도 증가 |
| 승격률 | 단위 시간당 Old로 이동한 양 | 높으면 Old GC 빈도 증가 |

처리량은 측정 구간 $T$와 GC 정지 시간 $t_i$로 계산한다. `-XX:GCTimeRatio=N`은 GC 시간과 애플리케이션 실행 시간의 목표 비율을 $\frac{1}{1+N}$으로 설정한다. Parallel GC와 G1 등에서 사용할 수 있으며, 예를 들어 $N=19$이면 전체 시간 중 GC에 쓰는 비율을 약 5%로 목표한다.

$$
\text{Throughput} = 1 - \frac{\sum_i t_i}{T}
$$

할당률은 연속한 두 GC 로그에서 구한다[^1]. $H^{before}_{n}$은 $n$번째 GC 직전 힙 사용량, $H^{after}_{n-1}$은 직전 GC 직후 사용량이다.

$$
\text{Allocation rate} \approx \frac{H^{before}_{n} - H^{after}_{n-1}}{t_n - t_{n-1}}
$$

## 3. GC 로그

### 3.1. -Xlog 문법

```
-Xlog:<what>:<output>:<decorators>:<output-options>
```

| 요소 | 형식 | 기본값 |
|---|---|---|
| what | `tag[+tag][*][=level]` | 선택을 생략하면 `all=info` |
| output | `stdout`, `stderr`, `file=<path>` | `stdout` |
| decorators(출력 부가 정보) | `time`, `uptime`, `level`, `tags`, `pid`, `tid` 등 | `uptime,level,tags` |
| output-options | `filecount=<n>,filesize=<size>` | 파일 5개, 각 20MB 순환 |

표의 `all=info`는 태그 선택을 생략했을 때의 값이다. 인자 없이 `-Xlog`만 지정하면 별도 기본 설정인 `all=warning`이 적용된다. 안전 지점(safepoint) 로그는 `safepoint` 태그로 선택한다.

`gc`는 `gc` 태그만 정확히 일치하는 메시지를, `gc*`는 `gc`를 포함하는 모든 태그 조합을 출력한다. 파일명의 `%p`, `%t`는 PID와 기동 시각으로 치환된다. zsh 등 셸에서는 `*`가 글롭으로 해석되므로 옵션을 따옴표로 감싼다.

### 3.2. 권장 설정

```bash
java '-Xlog:gc*,safepoint:file=/var/log/app/gc-%p-%t.log:time,uptime,level,tags:filecount=10,filesize=50M' \
  -jar app.jar
```

| 목적 | 설정 |
|---|---|
| 요약 한 줄 | `-Xlog:gc` |
| 상세 | `-Xlog:gc*` |
| safepoint 정지 시간 | `-Xlog:safepoint` |
| 객체 나이 분포 | `-Xlog:gc+age*=debug` |
| GC 전후 힙 상세 | `-Xlog:gc+heap=trace` |
| 참조 처리 시간 | `-Xlog:gc+ref*=debug` |
| 힙 크기 조정 결정 | `-Xlog:gc+ergo*=debug` |

JDK 8의 `PrintGCDetails`는 `-Xlog:gc*`, `PrintGCApplicationStoppedTime`은 `-Xlog:safepoint`, `PrintTenuringDistribution`은 `-Xlog:gc+age*`로 대체할 수 있다. `PrintGCCause`는 별도 옵션 없이 GC 원인을 기록한다. 날짜와 JVM 실행 후 경과 시간은 각각 `time`, `uptime` 부가 정보로 출력한다. `UseGCLogFileRotation`을 켜는 직접 대응 옵션은 없으며, 파일 순환은 `filecount`와 `filesize`로 설정한다.

### 3.3. 읽는 법

G1, `-Xlog:gc*` 출력 예시다.

```
[2026-10-15T22:30:08.275+0900][0.048s][info][gc,start    ] GC(0) Pause Young (Normal) (G1 Evacuation Pause)
[2026-10-15T22:30:08.276+0900][0.048s][info][gc,phases   ] GC(0)   Evacuate Collection Set: 0.4ms
[2026-10-15T22:30:08.276+0900][0.048s][info][gc,heap     ] GC(0) Eden regions: 23->0(32)
[2026-10-15T22:30:08.276+0900][0.048s][info][gc,heap     ] GC(0) Survivor regions: 0->1(3)
[2026-10-15T22:30:08.276+0900][0.048s][info][gc,heap     ] GC(0) Old regions: 0->0
[2026-10-15T22:30:08.276+0900][0.048s][info][gc          ] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 23M->0M(64M) 0.727ms
[2026-10-15T22:30:08.276+0900][0.048s][info][gc,cpu      ] GC(0) User=0.00s Sys=0.00s Real=0.00s
```

| 항목 | 의미 |
|---|---|
| `[...][0.048s][info][gc,heap]` | decorators. 시각, JVM 기동 후 경과 시간, 레벨, 태그 |
| `GC(0)` | GC ID. 같은 ID의 줄은 같은 GC 사이클 |
| `Pause Young (Normal)` | GC 종류. `Concurrent Start`, `Mixed`, `Full` 등 |
| `(G1 Evacuation Pause)` | GC 원인. `G1 Humongous Allocation`, `System.gc()` 등 |
| `23M->0M(64M)` | GC 전 사용량, GC 후 사용량, 힙 크기 |
| `0.727ms` | 정지 시간 |
| `Eden regions: 23->0(32)` | 리전 수 변화와 다음 GC까지의 목표 리전 수 |
| `User/Sys/Real` | GC 스레드 CPU 시간과 실제 경과 시간 |

`Real`이 `User + Sys`보다 크면 GC 스레드가 CPU를 충분히 얻지 못했거나 I/O 대기가 있었다는 의미다[^2].

### 3.4. 분석 도구

로그 파일은 [GCViewer](https://github.com/chewiebug/GCViewer), [GCeasy](https://gceasy.io/) 등에서 정지 시간 분포, 처리량, 할당률을 집계할 수 있다.

## 4. jstat

```bash
jstat -gcutil <pid> 1s        # 1초 간격 무한 출력
jstat -gc -t -h20 <pid> 1s 60 # 경과 시간 포함, 20줄마다 헤더, 60회
jstat -gccause <pid> 1s       # 직전·현재 GC 원인 추가
jstat -gcnew <pid> 1s         # tenuring threshold, survivor 목표 크기
```

```
  S0     S1     E      O      M     CCS    YGC     YGCT     FGC    FGCT     CGC    CGCT       GCT
  0.00  61.78  75.00  82.75  94.45  76.46    242     0.211     0     0.000    18     0.002     0.213
```

| 열 | 의미 |
|---|---|
| `S0`, `S1`, `E`, `O`, `M`, `CCS` | Survivor, Eden, Old, Metaspace, Compressed Class 사용률(%) |
| `YGC`, `YGCT` | Young GC 누적 횟수, 누적 시간(초) |
| `FGC`, `FGCT` | Full GC 누적 횟수, 누적 시간(초) |
| `CGC`, `CGCT` | Concurrent GC 정지 누적 횟수, 누적 시간(초)[^3] |
| `GCT` | 전체 GC 누적 시간(초) |

`-gc`는 같은 항목을 KB 단위의 용량(`C`)과 사용량(`U`)으로 출력한다. 연속한 두 출력의 `GCT` 차이를 샘플링 간격으로 나누면 해당 구간의 GC 시간 비율이 된다. 공식 문서는 jstat를 실험적이며 지원되지 않는 도구로 분류한다.

## 5. jcmd

| 명령 | 기능 | 영향도 |
|---|---|---|
| `GC.heap_info` | 힙 영역별 크기, 사용량 | Medium |
| `GC.class_histogram` | 클래스별 인스턴스 수, 크기 | High |
| `GC.heap_dump <file>` | HPROF 힙 덤프. `-all` 없으면 Full GC 선행 | High |
| `GC.run` | `System.gc()` 호출 | Medium |
| `VM.log` | 로그 설정 조회·변경·순환 | Low |
| `VM.flags` | 적용된 GC·힙 플래그 | Low |
| `PerfCounter.print` | jstat이 읽는 성능 카운터 원본 | |
| `JFR.start`, `JFR.dump`, `JFR.stop` | JFR 기록 제어 | Low |

### 5.1. 힙 상태

```
$ jcmd <pid> GC.heap_info
 garbage-first heap   total 58368K, used 48012K [0x00000007fc000000, 0x0000000800000000)
  region size 1024K, 4 young (4096K), 1 survivors (1024K)
 Metaspace       used 3630K, committed 3840K, reserved 1056768K
  class space    used 294K, committed 384K, reserved 1048576K
```

### 5.2. 실행 중 로그 활성화

재기동 없이 GC 로그를 켜고 끌 수 있다. 출력 파일은 대상 JVM의 작업 디렉터리 기준이므로 절대 경로를 쓴다.

```bash
jcmd <pid> VM.log list                                       # 현재 설정
jcmd <pid> VM.log output=/tmp/gc.log what=gc* decorators=time,uptime
jcmd <pid> VM.log rotate                                     # 파일 순환
jcmd <pid> VM.log disable                                    # 모든 로그 끄기
```

`VM.log disable`은 기본 경고 로그를 포함해 모든 출력을 끄고 설정을 초기화한다. 기동 시 지정한 `-Xlog` 설정도 사라진다.

### 5.3. 성능 카운터

```
$ jcmd <pid> PerfCounter.print | grep -E 'sun.gc.collector.[0-9].(name|invocations|time)'
sun.gc.collector.0.name="G1 young collection pauses"
sun.gc.collector.0.invocations=244
sun.gc.collector.1.name="G1 full collection pauses"
sun.gc.collector.1.invocations=1
sun.gc.collector.2.name="G1 concurrent cycle pauses"
sun.gc.collector.2.invocations=78
```

## 6. JFR

```bash
# 기동 시
java -XX:StartFlightRecording=duration=10m,filename=rec.jfr -jar app.jar

# 실행 중
jcmd <pid> JFR.start name=gc duration=5m filename=/tmp/rec.jfr
jcmd <pid> JFR.dump name=gc filename=/tmp/snap.jfr   # 기록 유지한 채 저장

# 분석
jfr summary rec.jfr
jfr print --events GarbageCollection rec.jfr
jfr view gc-pauses rec.jfr                            # JDK 21+
```

```
jdk.GarbageCollection {
  startTime = 22:30:57.192
  duration = 0.848 ms
  gcId = 128
  name = "G1New"
  cause = "G1 Evacuation Pause"
  sumOfPauses = 0.848 ms
  longestPause = 0.848 ms
}
```

| 이벤트 | 내용 |
|---|---|
| `jdk.GarbageCollection` | GC 1회의 종류, 원인, 정지 시간 합계·최대 |
| `jdk.GCPhasePause` | 정지 구간별 단계 시간 |
| `jdk.GCHeapSummary` | GC 전후 힙 사용량 |
| `jdk.YoungGarbageCollection`, `jdk.OldGarbageCollection` | 세대별 GC |

JDK 21부터 `jfr view`와 `jcmd <pid> JFR.view`로 `gc`, `gc-pauses`, `gc-pause-phases`, `gc-concurrent-phases`, `gc-configuration`, `gc-cpu-time`, `gc-references`, `heap-configuration` 뷰를 표 형식으로 볼 수 있다. GUI 분석은 JDK Mission Control을 사용한다.

## 7. JMX·Micrometer

`GarbageCollectorMXBean`은 컬렉터별 누적 횟수와 누적 시간(ms)을 제공한다. 값이 정의되지 않으면 `-1`을 반환한다.

```java
for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
    System.out.printf("%s count=%d time=%dms%n",
        gc.getName(), gc.getCollectionCount(), gc.getCollectionTime());
}
```

Micrometer `JvmGcMetrics`는 GC 알림을 받아 정지 시간, 동시 단계 시간, GC 후 생존 데이터 크기, Young 영역 할당량과 Old 영역 승격량을 지표로 등록한다. Spring Boot Actuator는 Micrometer의 GC 통계를 포함한 JVM 지표를 자동 구성한다.

| 지표 | 타입 | 의미 |
|---|---|---|
| `jvm.gc.pause` | Timer | GC 정지 시간. 태그 `gc`, `action`, `cause` |
| `jvm.gc.concurrent.phase.time` | Timer | 동시 단계 시간 |
| `jvm.gc.live.data.size` | Gauge | 마지막 GC 후 생존 데이터 크기 |
| `jvm.gc.max.data.size` | Gauge | Old 영역 최대 크기 |
| `jvm.gc.memory.allocated` | Counter | Young 영역 할당량 |
| `jvm.gc.memory.promoted` | Counter | Old 영역 승격량. 세대형 GC에서만 등록 |

```promql
# 정지 시간 비율
sum(rate(jvm_gc_pause_seconds_sum[5m])) by (instance)
# 최대 정지 시간
max(jvm_gc_pause_seconds_max) by (instance, action)
```

## 8. 주의사항

1. 기본 설정에서 `jcmd GC.run`과 `System.gc()`는 G1의 Full GC를 일으킨다[^4]. `-XX:+ExplicitGCInvokesConcurrent`를 켜면 동시 GC를 요청하고, `-XX:+DisableExplicitGC`를 켜면 요청을 무시한다. 운영 중에는 호출을 피한다.
2. `GC.heap_dump`와 `GC.class_histogram`은 힙 크기에 비례해 애플리케이션을 정지시킨다.
3. `-XX:-UsePerfData`로 기동하면 `hsperfdata` 디렉터리가 생성되지 않아 `jstat`을 사용할 수 없다.
4. `jcmd`는 대상 JVM이 실행 중인 같은 머신에서 실행해야 하며, 대상 JVM과 유효 UID와 GID가 같아야 attach할 수 있다[^5].
5. `filecount=0`이면 순환하지 않으며 기존 로그 파일을 덮어쓸 수 있다.

---

[^1]: 공식 문서에 정의된 공식이 아니다. 로그의 GC 전후 힙 사용량으로 계산하는 일반적인 방법이며 Humongous 할당 등은 반영하지 못한다.
[^2]: 공식 문서 근거가 아니다. GC 스레드의 CPU 시간과 경과 시간을 비교한 추론이다.
[^3]: Oracle jstat 문서(JDK 21)의 열 정의에는 `CGC`, `CGCT`가 없다. JDK 17.0.5 실제 출력에서 확인했으며, G1 Remark·Cleanup 같은 동시 사이클 정지가 여기에 집계되는 것으로 보인다.
[^4]: JDK 17.0.5에서 `jcmd GC.run` 후 `sun.gc.collector.1`(G1 full collection pauses) 횟수가 1 증가한 것을 확인했다. `-XX:+ExplicitGCInvokesConcurrent`와 `-XX:+DisableExplicitGC`의 동작은 [Oracle java 명령 문서](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)에 근거한다.
[^5]: [Oracle jcmd 문서](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)는 대상 JVM과 같은 머신에서 같은 유효 UID와 GID를 사용해야 한다고 명시한다.

---

## Sources
- [The java Command (JDK 21), Unified Logging](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [The jcmd Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
- [The jstat Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstat.html)
- [The jfr Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html)
- [GarbageCollectorMXBean (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.management/java/lang/management/GarbageCollectorMXBean.html)
- [HotSpot GC Tuning Guide (JDK 21), Ergonomics](https://docs.oracle.com/en/java/javase/21/gctuning/ergonomics1.html)
- [HotSpot GC Tuning Guide (JDK 21), Garbage-First GC](https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-garbage-collector-tuning.html)
- [Micrometer, JVM Metrics](https://docs.micrometer.io/micrometer/reference/reference/jvm.html)
- [Micrometer source, JvmGcMetrics](https://github.com/micrometer-metrics/micrometer/blob/main/micrometer-core/src/main/java/io/micrometer/core/instrument/binder/jvm/JvmGcMetrics.java)
- [Spring Boot, Metrics](https://docs.spring.io/spring-boot/reference/actuator/metrics.html)
- [GCViewer](https://github.com/chewiebug/GCViewer)
- [GCeasy](https://gceasy.io/)
- 실측: OpenJDK 17.0.5 (Temurin), G1, `-Xmx64m`

---

## Related pages
- [[gc]]
- [[jvm-options]]
- [[java-process-analysis-tools]]
- [[cpu-usage-troubleshooting]]
