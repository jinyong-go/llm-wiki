---
title: 자바 프로세스 분석·진단 도구
updated: 2026-08-31 14:25:48
tags:
  - java
  - jvm
  - diagnostics
  - profiling
  - troubleshooting
  - performance
---

## 1. 개요

실행 중인 JVM의 상태와 동작을 **외부에서 관측**하는 도구 중, 실무 진단에서 자주 쓰는 것 위주로 정리한다. 관측 방식에 따라 두 축으로 나뉜다.

- **상태 스냅샷** — 특정 시점의 스레드·힙을 한 번 떠본다 (`jps`, `jstack`, `jmap`).
- **시간축 관측** — 일정 기간의 통계 추이를 모은다 (`jstat`, `top -H`).

`jcmd`는 위 기능 다수를 통합한 단일 진입점으로, JDK 9 이후 Oracle이 개별 도구 대신 사용을 권장한다. `jinfo`·`jhat` 등 구형 도구도 `jcmd`와 외부 분석 도구로 대체됐다.

---

## 2. 도구별 상세

### 2.1. jps — JVM 프로세스 목록

- **방식/대상**: 스냅샷. instrumented HotSpot JVM의 PID와 메인 클래스.
- **용도**: 분석 대상 PID 식별 — 다른 모든 도구의 입력값을 얻는 출발점.
- **장점**: `ps`보다 가볍게 JVM만 필터링. **단점**: instrumented JVM만 보이고, 권한에 따라 타 사용자 프로세스가 누락될 수 있어 `sudo`가 필요할 수 있다.
- **주요 옵션**
  - 기본 — PID + 메인 클래스명(또는 JAR 파일명)
  - `-l` — 메인 클래스의 전체 패키지명 또는 JAR 전체 경로
  - `-m` — main 메서드에 전달된 인자
  - `-v` — JVM에 전달된 플래그
  - `-q` — PID만 출력 (스크립트 파이프용)
- **예시**
  ```bash
  $ jps -lv
  12345 com.example.OrderApplication -Xmx2g -XX:+UseG1GC
  67890 org.gradle.launcher.daemon.bootstrap.GradleDaemon -Xmx1g
  ```
  애플리케이션 PID(12345)를 확인해 이후 도구의 인자로 사용한다.

### 2.2. top -H — OS 레벨 스레드 CPU

- **방식/대상**: 실시간. 프로세스·스레드의 CPU·메모리 점유.
- **용도**: 어떤 스레드가 CPU를 점유하는지 TID로 식별. TID를 16진수로 변환해 `jstack` 출력의 `nid=0x...`와 매칭하면 자바 스택으로 연결된다.
- **장점**: 기본 설치, 즉시 사용, JVM 무관. **단점**: 자바 내부 컨텍스트(메서드· 스택)를 모름 → 반드시 `jstack`/프로파일러와 결합해야 원인에 도달한다.
- **예시**
  ```bash
  top -H -p 12345        # 스레드별 CPU 점유 확인, 최상위 TID 식별 (예: 12377)
  printf '%x\n' 12377    # TID → 16진수 변환: 3059
  jstack 12345 | grep -A 20 'nid=0x3059'
  ```

### 2.3. jstat — GC·힙 추이

- **방식/대상**: 지정 간격 폴링. GC·힙 영역·클래스로더·JIT 통계.
- **용도**: **추이 관찰** — GC 빈도·소요 시간, Eden/Old 사용률 변화. Full GC 후에도 Old가 회복되지 않고 계속 증가하면 메모리 누수 징후.
- **장점**: 매우 가볍고 STW를 유발하지 않아 운영 상시 관측에 적합. **단점**: 요약 수치만 제공 — "어떤 코드가" 원인인지는 알 수 없다.
- **주요 옵션**
  - `-gcutil` — 영역별 사용률(%)과 GC 횟수·누적 시간
  - `-gc` — 용량·사용량 절대값(KB)
  - `-gccause` — `-gcutil` + 직전/현재 GC 원인
  - `-h10` — 10줄마다 헤더 재출력, `-t` — 경과 시간 컬럼 추가
- **예시**
  ```bash
  $ jstat -gcutil 12345 1000 5     # 1초 간격 5회
    S0     S1     E      O      M     CCS    YGC   YGCT   FGC   FGCT    GCT
    0.00  97.52  28.14  63.20  95.01  92.33   124  1.246     3  0.412  1.658
  ```
`O`(Old 사용률)가 반복 관측에서 계속 상승하고 `FGC` 후에도 떨어지지 않으면 누수를 의심하고 `jmap`으로 넘어간다.

### 2.4. jstack — 스레드 덤프

- **방식/대상**: 스냅샷. 모든 스레드의 호출 스택·상태·보유/대기 락 정보.
- **용도**: 핫 스레드 스택 추적(`top -H`의 nid 매칭), 데드락 감지, 락 대기 병목 분석. 자바 수준 데드락은 덤프 하단에 **자동으로 리포트**된다.
- **장점**: 즉시 스레드 상태 파악. **단점**: 단발 스냅샷이라 그 순간만 포착 — 수 초 간격으로 여러 번 떠서 **반복 등장하는 프레임**을 확인해야 정확하다. CPU 점유를 정량화하지는 못한다.
- **주요 옵션**
  - 기본 — 전 스레드 상태와 호출 스택
  - `-l` — 락 상세(`ownable synchronizers` 목록 등) 포함
  - `-F` — 응답 없는 프로세스 강제 덤프 (JDK 9+는 `jhsdb jstack --pid`)
- **스레드 상태 해석**
  - `RUNNABLE` — 실행 중/실행 가능. 반복 관측에서 같은 프레임이면 핫 스레드
  - `WAITING`/`TIMED_WAITING` — notify·타임아웃 대기. 풀 스레드의 대기는 정상
  - `BLOCKED` — 모니터 락 대기. 다수 스레드가 같은 락에 BLOCKED면 경합 병목
- **예시**
  ```
  "http-nio-8080-exec-3" #42 daemon prio=5 os_prio=0 tid=0x00007f... nid=0x3059 runnable
     java.lang.Thread.State: RUNNABLE
          at com.example.crypto.KeyStoreLoader.load(KeyStoreLoader.java:42)
          at com.example.order.PaymentService.sign(PaymentService.java:88)
  ```
  스레드 라인의 주요 필드:
  - **`nid`** — native thread ID. OS(커널)가 부여한 네이티브 스레드 ID를 **16진수**로 표기한 값. `top -H`가 보여주는 OS 스레드 TID(10진수)와 동일 대상이라, `printf '%x'` 로 변환해 매칭하면 OS 관점의 핫 스레드와 자바 스택이 연결된다(2.2 참고).
  - `tid` — JVM 내부 스레드 객체의 주소. `#42` — JVM이 매긴 자바 스레드 번호.

  데드락이 있으면 하단에 다음과 같이 리포트된다.
  ```
  Found one Java-level deadlock:
  "Thread-1": waiting to lock monitor 0x...(object 0x..., a java.lang.Object),
    which is held by "Thread-2"
  ```
- **jcmd 대체**: `jcmd 12345 Thread.print -l`

### 2.5. jmap — 힙 분석

- **방식/대상**: 스냅샷/힙 덤프. 클래스별 인스턴스 수·메모리 점유, 힙 구성.
- **용도**: OOM·메모리 누수·객체 생성 패턴 분석. 덤프(`.hprof`)는 Eclipse MAT(dominator tree·leak suspects)나 VisualVM으로 심층 분석한다.
- **장점**: 클래스별 점유를 즉시 요약, 덤프로 사후 정밀 분석. **단점**: 힙 덤프와 `-histo:live`는 **STW(Full GC)** 를 유발 — 운영 노드는 트래픽을 뺀 뒤 실행한다. 대용량 힙은 덤프 시간·디스크 부담이 크다.
- **주요 기능**
  - `jmap -histo <pid>` — 클래스별 인스턴스 수·점유 크기 히스토그램
  - `jmap -histo:live <pid>` — 라이브 객체만 집계 (Full GC 유발 주의)
  - `jmap -dump:live,format=b,file=heap.hprof <pid>` — 힙 덤프 생성
  - 힙 구성 요약 — JDK 8 `jmap -heap`, JDK 9+ `jhsdb jmap --heap --pid <pid>`
- **예시**
  ```bash
  $ jmap -histo 12345 | head -6
   num     #instances         #bytes  class name
     1:        398211      120051216  [B
     2:        104211       12505320  java.lang.String
     3:         52108        8337280  com.example.order.OrderCache$Entry
  ```
도메인 클래스가 상위에 보이면 누수·캐시 비대를 의심하고, 힙 덤프를 떠서 MAT의 dominator tree로 보유 경로를 추적한다.
- **실무 팁**: OOM 시점의 덤프는 `-XX:+HeapDumpOnOutOfMemoryError`로 자동 생성해 두는 것이 안전하다([[jvm-options]] 참고).
- **jcmd 대체**: `jcmd 12345 GC.class_histogram`, `jcmd 12345 GC.heap_dump /tmp/heap.hprof`

### 2.6. jcmd — 통합 진단

- **방식/대상**: 실행 중 JVM에 진단 명령 전송. 위 도구들의 기능 다수를 단일 진입점에서 제공하는 **Oracle 권장 통합 도구**.
- **장점**: 하나의 도구로 다기능, 낮은 오버헤드, 최신 JDK 표준. **단점**: 명령별 출력 형식이 제각각이고, 힙 덤프 등은 외부 분석 도구가 필요.
- **예시**
  ```bash
  jcmd                                    # JVM 프로세스 목록 (jps 대체)
  jcmd 12345 help                         # 사용 가능한 명령 목록
  jcmd 12345 Thread.print -l              # 스레드 덤프 (jstack 대체)
  jcmd 12345 GC.class_histogram           # 클래스 히스토그램 (jmap -histo 대체)
  jcmd 12345 GC.heap_dump /tmp/heap.hprof # 힙 덤프 (jmap -dump 대체)
  jcmd 12345 VM.flags                     # JVM 플래그 (jinfo 대체)
  jcmd 12345 VM.native_memory summary     # NMT 네이티브 메모리
  jcmd 12345 JFR.start duration=60s filename=rec.jfr   # JFR 기록 시작
  ```

### 2.7. 심층 프로파일링 — JFR·async-profiler

자주 쓰는 도구로 증상 위치를 좁힌 뒤, 코드 수준 정량화가 필요할 때 사용한다.

- **JFR** — JVM 내장 연속 이벤트 기록(CPU 샘플·할당·GC·락·I/O). 오버헤드 ~1%로 상시 가동 가능, JDK Mission Control로 시각화. `jcmd <pid> JFR.start ...`로 제어.
- **async-profiler** — 외부 도구. safepoint bias 없는 CPU/alloc/lock 샘플링과 플레임 그래프 생성. 네이티브 스택까지 관측. `asprof -d 30 -f flame.html <pid>`

추적 사례는 [[cpu-usage-troubleshooting]] 참고.

---

## 3. 한눈에 비교

| 도구 | 관측 대상 | 방식 | 대표 용도 | 제공 |
|------|-----------|------|-----------|------|
| `jps` | 실행 중 JVM 목록 | 스냅샷 | PID·메인 클래스 식별 | JDK |
| `top -H` ([[system-monitoring]]) | 스레드별 CPU/메모리 | 실시간 | 고CPU 스레드 식별 | OS |
| `jstat` | GC·힙 통계 | 주기 폴링 | GC 빈도·힙 사용률 추이 | JDK |
| `jstack` | 스레드 스택·상태 | 스냅샷 | 핫 스레드·데드락 | JDK |
| `jmap` | 힙 구성·객체 분포 | 스냅샷/덤프 | OOM·메모리 누수 | JDK |
| `jcmd` | 위 기능 다수 통합 | 진단 명령 전송 | 통합 진단 — 권장 | JDK |

원인을 코드 수준까지 정량화해야 할 때는 심층 프로파일링 도구(`JFR`, `async-profiler`)를 쓴다(2.7).

---

## 4. 증상별 트러블슈팅 워크플로우

| 증상 | 1차 | 2차 — 원인 좁히기 | 정량 확인 |
|------|-----|------------------|-----------|
| **고CPU** | `top -H`로 핫 스레드 TID | `jstack` nid 매칭으로 스택 | `async-profiler -e cpu` / JFR |
| **OOM·누수** | `jstat -gcutil`로 Old 증가 추이 | `jmap -histo`로 점유 클래스 | 힙 덤프 → Eclipse MAT |
| **응답 지연** | `jstack` 반복(WAITING/BLOCKED) | 락 보유 스레드 추적(`-l`) | JFR 락·I/O 이벤트 |
| **GC 빈발** | `jstat -gccause` | `jcmd VM.flags`로 힙·GC 설정 확인 | JFR GC 이벤트 |

---

## 5. 차이점·선택 가이드

- **스냅샷 vs 추이**: 순간 상태(스레드·힙)는 `jstack`/`jmap`, 시간에 걸친 추이는 `jstat`, 코드 수준 핫패스는 JFR/`async-profiler`.
- **운영 안전성**: `jstat`은 오버헤드가 낮아 상시 사용 가능. `jmap` 힙 덤프와 `-histo:live`는 **STW**를 유발하므로 트래픽 없는 노드에서 수행.
- **의존성**: JDK만으로 가능한 범위는 `jcmd`(+JFR)로 대부분 커버된다.
- **결합이 기본**: OS 도구(`top -H`)는 자바 컨텍스트가 없으므로 `jstack`과 함께 써야 원인까지 도달한다.

---

## Sources
- [JDK 21 Diagnostic Tools (Oracle)](https://docs.oracle.com/en/java/javase/21/troubleshoot/diagnostic-tools.html)
- [The jps Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jps.html)
- [The jstack Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jstack.html)
- [The jmap Command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jmap.html)
- [The jstat Command (JDK 17)](https://docs.oracle.com/en/java/javase/17/docs/specs/man/jstat.html)
- [The Troubleshooting Tools (dev.java)](https://dev.java/learn/jvm/tool/troubleshooting/)
- [async-profiler — Getting Started](https://github.com/async-profiler/async-profiler/blob/master/docs/GettingStarted.md)
- [JVM 기반 애플리케이션 운영시 스레드 덤프를 통한 이슈 해결 (voidmainvoid)](https://blog.voidmainvoid.net/365)
- [Java Memory Monitoring (homoefficio)](https://homoefficio.github.io/2020/04/09/Java-Memory-Monitoring/)

---

## Related pages
- [[cpu-usage-troubleshooting]]
- [[jvm-options]]
- [[system-monitoring]]
