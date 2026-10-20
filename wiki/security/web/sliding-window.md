---
title: 재전송 방지 윈도우
updated: 2026-10-20 17:54:47
tags:
  - security
  - network
  - ipsec
  - replay-attack
---

## 1. 개요

재전송 방지 윈도우는 순서가 뒤바뀔 수 있는 채널에서 시퀀스 번호와 수신 비트맵으로 중복 패킷을 거부하는 기법이다. IPsec AH·ESP가 사용하며, [[replay-attack]]의 방어 기법 중 하나다. 상태는 Security Association별로 관리한다.

## 2. 구조

수신자는 무결성 검증에 성공한 최고 시퀀스 번호 $N$과 윈도우 크기 $W$를 유지한다. 비트맵은 $[N-W+1, N]$의 수신 여부를 나타낸다. RFC 4303은 32비트 시퀀스 번호에서 최소 32패킷 윈도우 지원을 요구하고, 기본값으로 64를 권고한다. 수신자는 순서 뒤바뀜의 범위에 따라 크기를 늘릴 수 있다.

| 조건 | 처리 |
|---|---|
| $seq > N$ | 무결성 검증 후 윈도우를 전진하고 수신 표시 |
| $N-W < seq \le N$ | 이미 수신한 번호면 거부하고, 미수신이면 검증 후 표시 |
| $seq \le N-W$ | 오래된 패킷으로 거부 |

무결성 검증 전에는 상태를 바꾸지 않는다. 검증 후에는 최신 상태를 기준으로 중복 여부를 다시 검사하고 수신 표시를 원자적으로 수행해야 한다.[^1]

### 2.1. ESN

확장 시퀀스 번호(Extended Sequence Number, ESN)는 64비트 번호의 하위 32비트만 전송한다. 수신자는 윈도우 위치와 수신한 하위 비트로 이전·현재·다음 상위 비트 후보를 결정하고 무결성을 검증한다. 하위 값이 작다는 이유만으로 상위 값을 증가시키면 순서가 뒤바뀐 패킷을 잘못 해석한다. 상세 알고리즘은 RFC 4303 부록 A를 따른다.

## 3. 비트 시프트

아래 예제는 ESN을 사용하지 않는 32비트 시퀀스 번호를 Java `long`으로 표현한다. 유효 범위는 1부터 $2^{32}-1$까지이며, 번호를 소진하기 전에 새 SA를 설정해야 한다. 시퀀스 번호 0은 거부한다.

```java
public final class AntiReplayWindow {
    private static final int WINDOW_SIZE = 64;
    private static final long MAX_SEQUENCE = 0xffff_ffffL;
    private long highest;
    private long bitmap;

    public synchronized boolean mayAccept(long seq) {
        if (seq <= 0 || seq > MAX_SEQUENCE) return false;
        if (seq > highest) return true;
        long offset = highest - seq;
        return offset < WINDOW_SIZE && ((bitmap >>> offset) & 1L) == 0;
    }

    // 무결성 검증에 성공한 패킷에만 호출한다.
    public synchronized boolean commitAuthenticated(long seq) {
        if (!mayAccept(seq)) return false;
        if (seq > highest) {
            long shift = seq - highest;
            bitmap = shift >= WINDOW_SIZE ? 0L : bitmap << shift;
            highest = seq;
            bitmap |= 1L;
        } else {
            bitmap |= 1L << (highest - seq);
        }
        return true;
    }
}
```

`mayAccept()`는 불필요한 암호 연산을 줄이는 사전 검사다. 다른 스레드가 검증 중에 윈도우를 갱신할 수 있으므로, 실제 처리 여부는 `commitAuthenticated()`의 반환값으로 결정한다.[^1]

```java
long seq = extractSequenceNumber(packet);
if (window.mayAccept(seq)
        && verifyIntegrity(packet)
        && window.commitAuthenticated(seq)) {
    process(packet);
} else {
    drop(packet);
}
```

`extractSequenceNumber`, `verifyIntegrity`, `process`, `drop`에 해당하는 처리는 프로토콜 구현이 제공해야 한다. 클래스는 재전송 상태 관리만 담당하며 패킷의 무결성을 검증하지 않는다.

## 4. 순환 비트맵

RFC 6479는 비트 시프트 대신 블록을 순환시킨다. 블록 수 $M$과 블록당 비트 수 $B$에 대해 저장 공간은 $MB$비트이며, 지원 윈도우는 $(M-1)B$패킷이다. 예를 들어 32비트 워드 32개를 사용하면 저장 공간은 1024비트, 지원 윈도우는 992패킷이다. 여분의 한 블록은 새 블록 진입 시 초기화해도 유효 범위의 수신 기록을 보존하기 위해 필요하다.

각 수신 패킷의 비트는 계속 갱신하지만, 블록 초기화는 경계를 넘을 때 수행한다. 순차 수신 시 블록 초기화 빈도가 패킷당 비트 시프트보다 낮다. 전체 비트맵 갱신 횟수가 1/B로 줄어드는 것은 아니다.

```java
public final class Rfc6479AntiReplayWindow {
    private static final int BITS_PER_WORD = 32;
    private static final int WORD_COUNT = 32;
    private static final int WINDOW_SIZE = (WORD_COUNT - 1) * BITS_PER_WORD;
    private static final long MAX_SEQUENCE = 0xffff_ffffL;
    private final int[] bitmap = new int[WORD_COUNT];
    private long highest;

    public synchronized boolean mayAccept(long seq) {
        if (seq <= 0 || seq > MAX_SEQUENCE) return false;
        if (seq > highest) return true;
        if (highest - seq >= WINDOW_SIZE) return false;
        int index = (int) ((seq >>> 5) & (WORD_COUNT - 1));
        int mask = 1 << (seq & (BITS_PER_WORD - 1));
        return (bitmap[index] & mask) == 0;
    }

    // 무결성 검증에 성공한 패킷에만 호출한다.
    public synchronized boolean commitAuthenticated(long seq) {
        if (!mayAccept(seq)) return false;
        if (seq > highest) {
            long oldBlock = highest >>> 5;
            long newBlock = seq >>> 5;
            long count = Math.min(newBlock - oldBlock, WORD_COUNT);
            for (long i = 1; i <= count; i++) {
                bitmap[(int) ((oldBlock + i) & (WORD_COUNT - 1))] = 0;
            }
            highest = seq;
        }
        int index = (int) ((seq >>> 5) & (WORD_COUNT - 1));
        bitmap[index] |= 1 << (seq & (BITS_PER_WORD - 1));
        return true;
    }
}
```

이 예제도 §3의 호출 순서를 사용하며 ESN은 지원하지 않는다. 64패킷 시프트 구현과 992패킷 순환 구현은 허용하는 순서 뒤바뀜 범위가 다르다.

## 5. 활용

- IPsec AH·ESP는 SA별 재전송 방지 윈도우를 사용한다.
- DTLS 1.2는 RFC 6347에서 레코드 중복 탐지를 위한 윈도우를 설명한다.
- SRTP는 RTP 시퀀스 번호와 Rollover Counter로 패킷 인덱스를 구성하고 재전송을 검사한다.

---

## Sources
- [RFC 4303 §3.4.3, Appendix A](https://www.rfc-editor.org/rfc/rfc4303.html)
- [RFC 6479 §2–3](https://www.rfc-editor.org/rfc/rfc6479.html)
- [RFC 6347 §4.1.2.6](https://www.rfc-editor.org/rfc/rfc6347.html#section-4.1.2.6)
- [RFC 3711 §3.3.2](https://www.rfc-editor.org/rfc/rfc3711.html#section-3.3.2)

---
## Related pages
- [[replay-attack]]

---

[^1]: 코드 분석에 따른 구현 판단. 사전 검사와 갱신을 각각 동기화해도 두 호출 사이에 다른 스레드가 실행될 수 있다. 검증 후 중복 검사와 상태 갱신을 같은 임계 구역에서 수행하고, 성공한 호출만 패킷을 처리하도록 구성했다. 프로세스가 상태를 공유하는 경우에도 동등한 원자성이 필요하다.
