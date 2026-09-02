---
title: CPU 사용량 증가 트러블슈팅 — KeyStore 반복 접근 사례
updated: 2026-08-31 14:25:48
tags:
  - java
  - jvm
  - troubleshooting
  - performance
  - keystore
  - netty
---

## 1. 개요
서버 코드 변경 후 CPU 사용량이 상승한 사례와 그 진단·해결 과정을 정리한다. 근본 원인은 **요청 처리 경로(hot path)에서 `KeyStore`에 매번 접근하여 개인키를 복호화**한 것이었다. `KeyStore.getKey(alias, password)`는 호출마다 암호 기반 키 유도(PBKDF)를 수행하므로 CPU 비용이 누적된다.

---

## 2. 사례

### 2.1. 변경 내역
2026-06-15 서버 수정 후 CPU 사용량 상승. 변경 항목은 3가지였다.
1. Netty 버전 업그레이드 (4.1.42 → 4.1.127)
2. 소켓 통신 패킷 길이 증가
3. PFX(PKCS#12) 파일에 인증서·개인키가 복수 존재 → alias로 사용할 인증서·개인키를 **KeyStore에서 매번 조회**하도록 변경

### 2.2. 진단
변수 소거식(bisection)으로 원인을 좁혀 간다.
- `top` + `jstack`으로 확인 → `nioEventLoopGroup` 스레드가 평소보다 CPU 과다 사용
- Netty 다운그레이드 → CPU 여전히 높음 (Netty 무관)
- 패킷 길이 원복 → CPU 여전히 높음 (패킷 무관)
- 이전 서버로 롤백 → 정상화 (코드 변경이 원인으로 확정)
- 코드 diff 전수 확인 → 인증서 검증 시 발급자 인증서를 가져오는 부분 변경 발견
  - 기존: KeyStore 로드 후 인증서·개인키를 **필드(메모리)** 에 올려두고 사용
  - 변경: 인증서·개인키가 2개 존재함에 따라 **매번 KeyStore에 접근**하여 조회

### 2.3. 검증 및 해결
- 성능테스트: ① 필드 캐시 방식 vs ② KeyStore 조회 방식으로 API 수백 회 호출 → ②의 자원 사용량이 큼을 확인
- **해결**: `alias → (인증서, 개인키)` 를 `Map`에 캐시하고 KeyStore가 아닌 Map에서 조회하도록 변경
- 개발·운영 반영 후 CPU 사용량 정상화

---

## 3. 근본 원인: KeyStore 반복 접근 비용

`KeyStore`는 개인키를 **암호화된 상태로** 보관한다. 평문 키를 얻으려면 `getKey(alias, password)` / `getEntry()`를 호출해야 하며, 이때 비밀번호로부터 복호화 키를 유도(PBKDF)한 뒤 키 엔트리를 복호화한다. 키는 KeyStore 객체 내부에 여전히 암호화 상태로 남으므로 **접근할 때마다 복호화가 반복**된다.

- PKCS#12 기본 PBKDF 반복 횟수는 Java 12부터 `102400` (`java.security`에서 조정 가능)
- 반복 횟수는 brute-force 방어를 위한 의도적 비용 — 단일 키 유도가 ~100ms 수준이 되도록 설계됨
- 따라서 요청마다 `getKey`를 호출하면 PBKDF 비용이 매 요청 누적되어 CPU가 급증
- 기존 코드는 KeyStore를 1회만 로드하고 키 객체를 필드에 올려두어 이 비용이 0에 가까웠음

> 즉 문제의 본질은 "암호화/복호화 자체"가 아니라 **고비용 키 유도를 hot path에서 반복**했다는 점이다.

---

## 4. 더 나은 트러블슈팅 방법

실제 과정은 변경 항목을 하나씩 되돌려보는 소거식 진단이었다. 핫 스레드의 **실제 스택을 보지 않고** 의심 항목을 제거했기 때문에 운영 롤백까지 필요했고 시간이 길었다. 다음 방법이 더 빨랐을 것이다.

### 4.1. 핫 스레드 직접 추적
각 JVM 스레드는 네이티브 스레드로 매핑되므로 OS 도구로 스레드별 CPU를 볼 수 있다.
1. `top -H -p <pid>` → 스레드별 CPU 점유 확인, 최상위 TID 식별
2. `printf '%x\n' <TID>` → 10진수 TID를 16진수로 변환
3. `jstack <pid> > dump.txt`
4. 덤프에서 `nid=0x<hex>` 검색 → 해당 스레드가 실행 중인 **정확한 메서드·스택 프레임** 확인

이렇게 했다면 `nioEventLoop` 스레드의 스택에서 `KeyStore.getKey` / PBKDF 복호화 프레임이 바로 드러나, **Netty·패킷 소거 단계를 건너뛸** 수 있었다. 주의: `jstack` 단발 스냅샷은 그 순간만 포착할 수 있으므로, 수 초 간격으로 여러 번 떠서 **반복 등장하는 프레임**을 확인해야 정확하다. ([[java-process-analysis-tools]] 참고)

### 4.2. CPU 샘플링 프로파일러 (async-profiler / JFR)
플레임 그래프로 CPU 점유 핫패스를 직접 시각화한다.
- **async-profiler**: `AsyncGetCallTrace` 기반 샘플링, 오버헤드 보통 1% 미만 → 운영 환경에서도 안전. 가장 넓은 plateau(상단 프레임)가 핫스폿.
- **JFR (Java Flight Recorder)**: JVM 내장. `-XX:StartFlightRecording`으로 기록.
- PBKDF2 / PKCS#12 복호화 네이티브 프레임이 가장 넓은 영역으로 나타나 근본 원인을 **서버 롤백 없이** 즉시 식별 가능.

### 4.3. 코드 diff 우선 검토
롤백 전에 `git diff`에서 "요청 경로에서 **매 호출마다** 실행되도록 바뀐 변경"을 먼저 식별한다. 인증서 조회가 검증마다 실행되는 hot path로 이동한 것이 곧 1순위 후보가 된다.

### 4.4. 시스템 차원 CPU 부하 성격 파악 (vmstat)
스레드 스택을 파고들기 전, `vmstat`으로 **CPU 부하가 어떤 성격인지**(연산 중심 / 커널 / I/O 대기)를 먼저 확인하면 진단 방향이 좁혀진다. `procps-ng` 패키지에 포함되어 기본 설치된다.

```bash
vmstat [delay [count]]
vmstat 1 5      # 1초 간격으로 5회 출력
vmstat -w 1     # 와이드 출력(메모리 큰 시스템)
vmstat -t 1     # 각 줄에 타임스탬프 추가
```

```
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  0      0 1662800  84000 1937400    0    0     1     5  120  240 35  5 60  0  0
```

> **첫 줄은 부팅 후 평균값**이므로 무시하고, `delay`를 준 **둘째 줄부터의 구간 통계**를 본다.

CPU 진단에 핵심인 컬럼:

| 섹션 | 컬럼 | 의미 |
|---|---|---|
| procs | `r` | 실행 가능(실행 중 + 실행 대기) 프로세스 수. **코어 수보다 지속적으로 크면 CPU 포화** |
| procs | `b` | I/O 완료 대기로 블록된 프로세스 수 |
| system | `in` | 초당 인터럽트 수 (클럭 포함) |
| system | `cs` | 초당 컨텍스트 스위치 수. 과도하면 스레드 경합·과다 생성 의심 |
| cpu | `us` | 사용자 공간(비커널) 코드 실행 비율 (nice 포함) |
| cpu | `sy` | 커널(시스템 콜 등) 실행 비율 |
| cpu | `id` | 유휴 비율 |
| cpu | `wa` | I/O 대기 비율 |
| cpu | `st` | 하이퍼바이저에 빼앗긴 시간 (VM 환경) |

**이 사례에의 적용**: PBKDF 반복 같은 순수 연산 부하는 `us`가 높고 `sy`·`wa`는 낮게 나타난다. 따라서 vmstat에서 `us`가 지속적으로 높고 `r`이 코어 수를 초과하는 패턴을 봤다면, I/O·커널이 아닌 **사용자 코드 연산 핫스폿**으로 방향을 좁혀 곧바로 4.1(top -H → jstack)로 진입할 수 있다.

기타 유용한 옵션: `-s`(부팅 후 이벤트 카운터·메모리 통계 표), `-a`(active/inactive 메모리 구분), `-S`(단위 스케일 지정). 시스템 요약·프로세스 단위 조회는 [[system-monitoring]] 참고.

---

## 5. 해결책 평가

- 채택한 `Map` 캐시(alias → 인증서/개인키)는 적절하다. 본질적으로 "KeyStore 1회 로드 후 키 객체를 메모리에 보관" = **PBKDF 1회로 축소**.
- 대안인 PKCS#12 반복 횟수 하향은 **보안 약화**이므로 권장하지 않는다.
- 캐시 맵은 불변(immutable) 또는 `ConcurrentHashMap`으로 두어 `nioEventLoop` 멀티스레드 접근에 안전해야 한다.

### 5.1. 체크리스트
- [ ] 인증/암호 키, 컴파일된 정규식, 커넥션 등 **고비용 객체를 요청마다 생성·조회하지 않는가**
- [ ] 높은 CPU 발생 시 의심 항목 소거 전에 **핫 스레드 스택**(top -H → jstack)부터 확인했는가
- [ ] 가능하면 **샘플링 프로파일러**로 핫패스를 정량 확인했는가
- [ ] 캐시한 공유 객체의 **스레드 안전성**을 확보했는가

---

## 6. 회고 (KPT)

### 6.1. Keep — 유지할 점
- `top` + `jstack`으로 **`nioEventLoop` 스레드 그룹이 핫스폿임을 초기에 식별**했다.
- 변경 항목(Netty·패킷·인증서)을 **하나씩 격리**해 원인이 외부 라이브러리가 아닌 **자사 코드 변경**임을 확정했다.
- 추정에서 멈추지 않고 **성능테스트(필드 캐시 vs KeyStore 조회)로 가설을 정량 검증**한 뒤 반영했다.

### 6.2. Problem — 문제점
- 핫 스레드의 **스택 프레임까지 추적하지 않고** 의심 항목을 되돌리는 방식에 의존했다.
- 그 결과 Netty·패킷이라는 **red herring(무관한 변경)** 에 진단 시간을 소모했다.
- **운영 서버 롤백**으로 원인을 좁혔다 → 진단을 위해 서비스에 영향을 주는 비용이 컸다.
- 코드 diff 검토가 **소거 절차의 마지막**에 이루어졌다. 보안/인증 변경이 요청 경로(hot path)에 들어왔는지에 대한 사전 점검이 없었다.

### 6.3. Try — 다음에 시도할 것
- 고CPU 발생 시 **`top -H` → `jstack` `nid` 매칭으로 스택 프레임까지** 먼저 확인 (4.1절).
- **`async-profiler`/JFR 상시 또는 즉시 프로파일링** 체계를 마련해 롤백 없이 핫패스를 정량 식별 (4.2절, [[java-process-analysis-tools]]).
- 코드 리뷰 시 **"이 변경이 요청마다 실행되는 hot path에 들어가는가"** 를 체크리스트화.
- 인증 키·정규식·커넥션 등 **고비용 객체는 캐싱 패턴을 기본 검토**.

### 6.4. Action items
- [ ] 운영 JVM에 핫 스레드 추적·프로파일링 절차(런북) 정비
- [ ] PR 리뷰 템플릿에 "hot path 고비용 연산" 점검 항목 추가
- [ ] 보안/암호 관련 공유 객체의 생성·캐싱 가이드 정리

---

## Sources
- `raw/troubleshoot/keystore and cpu usage.md`
- [Java KeyStores – the gory details (Neil Madden)](https://neilmadden.blog/2017/11/17/java-keystores-the-gory-details/)
- [Mind Your Keys? A Security Evaluation of Java Keystores (NDSS 2018)](https://www.ndss-symposium.org/wp-content/uploads/2018/02/ndss2018_02B-1_Focardi_paper.pdf)
- [JDK-8267040: Customizing the generation of a PKCS12 keystore](https://bugs.openjdk.org/browse/JDK-8267040)
- [Java KeyStore API (Baeldung)](https://www.baeldung.com/java-keystore)
- [PRSTAT/top -H + jstack로 고CPU 스레드 추적 (Java EE Support Patterns)](https://javaeesupportpatterns.blogspot.com/2012/02/prstat-linux-how-to-pinpoint-high-cpu.html)
- [Troubleshoot Java High CPU Usage (Site24x7)](https://www.site24x7.com/learn/java/troubleshoot-java-high-cpu-usage.html)
- [A Guide to async-profiler (Baeldung)](https://www.baeldung.com/java-async-profiler)
- [vmstat(8)](https://man7.org/linux/man-pages/man8/vmstat.8.html)

---

## Related pages
- [[java-process-analysis-tools]]
- [[system-monitoring]]
- [[jvm-options]]
- [[openssl-pkcs12]]
- [[openssl-x509]]
