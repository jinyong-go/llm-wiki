---
title: Sliding Window (Anti-Replay Window)
updated: 2026-09-03 22:35:48
tags:
  - security
  - network
  - ipsec
  - replay-attack
---

## 1. 개요

Sliding Window(Anti-Replay Window)는 순서가 보장되지 않는 채널에서 **순증가 시퀀스 번호**와 **수신 여부 비트맵**으로 중복·재전송 패킷을 판별하는 기법이다. IPsec AH/ESP([RFC 4303](https://www.rfc-editor.org/rfc/rfc4303.html))가 표준 메커니즘으로 정의하며, 순서 있는 시퀀스 번호를 부여할 수 있는 채널이면 IPsec 외에도 적용 가능하다. [[replay-attack]]의 방어 기법 중 하나다.

## 2. 구조

- 송신자는 패킷마다 1씩 증가하는 시퀀스 번호를 부여
- 수신자는 **N**(지금까지 무결성 검증에 성공한 최고 시퀀스 번호)과 **W**(윈도우 크기)를 유지
- `[N-W+1, N]` 구간의 수신 여부를 비트맵으로 기록 — 인덱스 0이 N, 인덱스 W-1이 N-W+1에 대응
- RFC 4303 기준 기본 윈도우 크기는 **64**(최소 32) 패킷. 순서 뒤바뀜이 잦은 고속·다중 경로 환경일수록 윈도우를 키워야 함

### 2.1 확장 시퀀스 번호(ESN)

64비트 시퀀스 번호(ESN, Extended Sequence Number) 사용 시 헤더에는 하위 32비트만 실어 보낸다. 수신자는 자신이 유지하는 상위 비트 카운터로 전체 64비트 값을 복원하며, 수신한 하위 32비트가 자신이 알고 있는 하위 비트보다 작으면 상위 비트가 1 증가한 것으로 간주해 오버플로를 처리한다.

## 3. 판정 규칙

| 조건 | 판정 |
|---|---|
| `seq > N` | 윈도우보다 신규 — 무결성 검증 통과 시 수용, 윈도우를 seq까지 슬라이드 |
| `N-W < seq ≤ N` | 윈도우 내부 — 비트맵에 이미 표시돼 있으면 중복 거부, 아니면 수용 후 표시 |
| `seq ≤ N-W` | 윈도우보다 오래됨 — 무조건 거부 |

윈도우는 **무결성 검증에 성공한 패킷만** 반영해 슬라이드한다. 검증에 실패한 패킷은 판정에만 쓰이고 윈도우 상태를 바꾸지 않는다 — 위조된 시퀀스 번호로 윈도우를 조작해 정상 패킷을 거부하게 만드는 공격을 막기 위함이다.

## 4. 구현: 비트 시프트 방식 (RFC 4303)

전통적인 구현은 비트맵을 고정폭 정수(또는 비트 배열)로 두고, 윈도우가 슬라이드할 때마다 비트를 시프트한다. 윈도우 크기를 64로 두면 언어의 64비트 정수 타입 하나로 비트맵을 표현할 수 있어 구현이 단순하다.

### 4.1 Java 구현 예제

```java
public final class AntiReplayWindow {

    private static final int WINDOW_SIZE = 64; // long 한 워드로 표현
    private long highest = -1L;                // 아직 수신 없음
    private long bitmap = 0L;                  // bit i == (highest - i) 수신 여부

    /** 무결성 검증 전 1차 판정. true면 검증 진행, false면 즉시 폐기 */
    public synchronized boolean accept(long seq) {
        if (highest < 0) return true;              // 첫 패킷
        long offset = highest - seq;
        if (offset >= WINDOW_SIZE) return false;    // 윈도우보다 오래됨
        if (offset < 0) return true;                // 윈도우보다 신규
        return ((bitmap >>> offset) & 1L) == 0L;     // 0이면 미수신(중복 아님)
    }

    /** 무결성 검증 성공 후에만 호출 — 윈도우를 갱신한다 */
    public synchronized void markReceived(long seq) {
        if (highest < 0) {
            highest = seq;
            bitmap = 1L;
            return;
        }
        long offset = highest - seq;
        if (offset < 0) {                           // 신규 → 슬라이드
            long shift = -offset;
            // long의 <<는 시프트 값을 64로 나눈 나머지만 적용하므로
            // WINDOW_SIZE 이상이면 명시적으로 0 처리해야 한다
            bitmap = (shift >= WINDOW_SIZE) ? 0L : (bitmap << shift);
            bitmap |= 1L;
            highest = seq;
        } else {                                     // 윈도우 내부 → 비트만 표시
            bitmap |= (1L << offset);
        }
    }
}
```

사용 예:

```java
AntiReplayWindow window = new AntiReplayWindow();

long seq = extractSequenceNumber(packet);
if (!window.accept(seq)) {
    drop(packet);
} else if (verifyIntegrity(packet)) {
    window.markReceived(seq);
    process(packet);
} else {
    drop(packet); // 무결성 실패 — 윈도우 상태 불변
}
```

## 5. RFC 6479 개선: 블록 기반 순환 비트맵

비트 시프트 방식은 패킷마다 비트맵을 갱신해야 해 고속 환경에서 비효율적이다. [RFC 6479](https://datatracker.ietf.org/doc/html/rfc6479)는 비트맵을 **N비트 블록 M개로 구성된 원형(circular) 구조**로 바꾼다.

- 시퀀스 번호의 하위 비트로 블록 인덱스를 직접 계산 — 윈도우 하단 인덱스에 의존하지 않음
- 새 시퀀스 번호가 블록 경계를 넘으면 해당 블록 전체를 한 번에 0으로 초기화(비트 단위 시프트 불필요)
- 결과적으로 비트맵 갱신 횟수가 1/N로 줄어 고속 처리에 유리

### 5.1 Java 구현 예제

RFC 6479는 32비트 워드 32개(총 1024비트 윈도우)를 예시로 든다. 4.1의 64비트 단일 워드 예제보다 실무에 가까운 크기다.

```java
public final class Rfc6479AntiReplayWindow {

    private static final int BITS_PER_WORD = 32;
    private static final int WORD_COUNT = 32;                  // 32*32 = 1024비트 윈도우
    private static final int REDUNDANT_BIT_SHIFTS = 5;         // log2(BITS_PER_WORD)
    private static final int BITMAP_INDEX_MASK = WORD_COUNT - 1;
    private static final int BITMAP_LOC_MASK = BITS_PER_WORD - 1;

    private final int[] bitmap = new int[WORD_COUNT];
    private long lastSeq = -1L; // 아직 수신 없음

    public synchronized boolean accept(long seq) {
        if (lastSeq < 0) return true;
        if (seq > lastSeq) return true;                                   // 신규
        if (seq + (long) WORD_COUNT * BITS_PER_WORD <= lastSeq) return false; // 윈도우보다 오래됨
        int bitLocation = (int) (seq & BITMAP_LOC_MASK);
        int index = (int) ((seq >>> REDUNDANT_BIT_SHIFTS) & BITMAP_INDEX_MASK);
        return (bitmap[index] & (1 << bitLocation)) == 0;                 // 0이면 미수신
    }

    /** 무결성 검증 성공 후에만 호출 */
    public synchronized void markReceived(long seq) {
        if (lastSeq < 0) {
            lastSeq = seq;
        } else if (seq > lastSeq) {
            long blockCur = lastSeq >>> REDUNDANT_BIT_SHIFTS;
            long blockNew = seq >>> REDUNDANT_BIT_SHIFTS;
            long toClear = Math.min(blockNew - blockCur, WORD_COUNT);     // 시프트 대신 블록 통째로 초기화
            for (long i = 1; i <= toClear; i++) {
                bitmap[(int) ((blockCur + i) & BITMAP_INDEX_MASK)] = 0;
            }
            lastSeq = seq;
        }
        int bitLocation = (int) (seq & BITMAP_LOC_MASK);
        int index = (int) ((seq >>> REDUNDANT_BIT_SHIFTS) & BITMAP_INDEX_MASK);
        bitmap[index] |= (1 << bitLocation);
    }
}
```

4.1과의 차이: 비트맵을 통째로 시프트하는 대신, 새 시퀀스 번호가 진입한 블록까지만 `bitmap[idx] = 0`으로 초기화한다. 시프트 연산이 사라지고 블록 단위로만 갱신하므로 윈도우가 클수록 이득이 커진다.

## 6. 활용 예시

Sliding window 기반 anti-replay는 순서를 보장하지 않는 전송 위에서, 무결성 검증과 별개로 재전송을 걸러내야 하는 프로토콜에 널리 쓰인다.

- **IPsec AH/ESP** — [RFC 4303](https://www.rfc-editor.org/rfc/rfc4303.html)/RFC 4302가 정의하는 원 사용처. 2~5장이 이 스펙 기준
- **DTLS(Datagram TLS)** — UDP 위에서 동작해 TCP 기반 TLS보다 순서 뒤섞임·중복 문제가 크다. [RFC 6347](https://datatracker.ietf.org/doc/html/rfc6347)이 IPsec과 동일한 방식의 비트맵 윈도우 기반 레코드 재생 탐지를 옵션으로 정의
- **SRTP(Secure RTP)** — [RFC 3711](https://datatracker.ietf.org/doc/html/rfc3711). RTP의 16비트 시퀀스 번호에 32비트 Rollover Counter(ROC)를 더해 48비트 시퀀스 번호를 구성하고, 이를 기준으로 재생 방지 윈도우를 적용

---

## Sources
- [RFC 4303 — IP Encapsulating Security Payload (ESP)](https://www.rfc-editor.org/rfc/rfc4303.html)
- [RFC 6479 — IPsec Anti-Replay Algorithm without Bit Shifting](https://datatracker.ietf.org/doc/html/rfc6479)
- [RFC 6347 — Datagram Transport Layer Security Version 1.2](https://datatracker.ietf.org/doc/html/rfc6347)
- [RFC 3711 — The Secure Real-time Transport Protocol (SRTP)](https://datatracker.ietf.org/doc/html/rfc3711)

---
## Related pages
- [[replay-attack]]
