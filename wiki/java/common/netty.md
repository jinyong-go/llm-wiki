---
title: Netty
updated: 2026-09-02 13:02:54
tags:
  - java
  - network
  - netty
  - nio
  - reactor-pattern
  - tcp
---

## 1. 개요

Netty는 비동기 이벤트 기반(asynchronous event-driven) 네트워크 애플리케이션 프레임워크다. Java NIO의 복잡한 API를 추상화해 고성능 프로토콜 서버·클라이언트를 빠르게 개발할 수 있게 한다.[^1]

---

## 2. 배경

### 2.1 Blocking I/O의 한계

전통적인 소켓 프로그래밍은 커넥션 하나마다 OS 스레드 하나를 할당해 `accept()`/`read()`/`write()`를 순차적으로 블로킹 호출하는 **thread-per-connection** 모델을 쓴다. 이 모델은 커넥션 수가 늘어날수록 스레드 수도 같이 늘어나므로, 스레드 스택 메모리와 컨텍스트 스위칭 비용이 커넥션 수에 비례해 증가한다 — 동시 커넥션이 많아질수록(수천~수만 단위) 확장성의 병목이 된다.

Netty를 비롯해 Nginx 등 대부분의 고성능 서버는 이 문제를 **커넥션당 스레드를 두지 않는** 방식으로 해결한다.

### 2.2 TCP 스트림과 메시지 경계 문제

TCP는 스트림 기반 프로토콜이라 메시지 경계 개념이 없다. 송신 측이 한 번에 쓴 데이터가 수신 측에서 여러 조각으로 나뉘어 도착하거나, 반대로 여러 메시지가 하나로 합쳐져 도착할 수 있다.[^1] 따라서 애플리케이션은 수신한 바이트 스트림에서 완전한 메시지 단위를 직접 구분(길이 필드, 구분자 등)해야 한다. 이 문제는 4.2 ChannelPipeline에서 다루는 코덱으로 해결한다.

---

## 3. 원리

### 3.1 논블로킹 I/O와 멀티플렉싱

Java NIO의 `Selector`(`java.nio.channels.Selector`)는 **하나의 스레드가 다수의 채널(소켓)을 동시에 감시**할 수 있게 하는 멀티플렉서다.[^4] 채널들을 Selector에 등록해두면, Selector는 OS에 어떤 채널이 읽기/쓰기/연결 수락 등 I/O 준비가 됐는지 질의하고, 준비된(ready) 채널만 골라 애플리케이션에 알려준다.

이 방식이면 스레드 하나가 수천 개의 소켓을 동시에 처리할 수 있어, 2.1의 thread-per-connection 모델과 달리 커넥션 수와 스레드 수가 비례하지 않는다.

### 3.2 Reactor 패턴과 EventLoop

Netty의 `EventLoop`는 이 Selector 기반 멀티플렉싱을 감싼 이벤트 루프로, "등록된 Channel의 모든 I/O 작업을 처리한다"고 공식문서에 정의돼 있다.[^5] `EventLoopGroup`은 여러 `EventLoop`(스레드)를 관리하는 풀이다.

핵심 규칙은 **하나의 Channel은 하나의 EventLoop에 등록되어, 해당 Channel의 모든 이벤트가 항상 같은 스레드에서 순차 처리**된다는 것이다. 이 덕분에 하나의 Channel에 대한 핸들러 로직은 별도의 동기화 없이도 스레드 안전하게 작성할 수 있다 — 여러 스레드가 같은 Channel 상태를 동시에 건드릴 가능성이 애초에 없기 때문이다. 커넥션이 수락되는 시점과 개별 커넥션이 EventLoop에 배정되는 방식은 4.1 Channel에서 다룬다.

### 3.3 스레딩 규칙: EventLoop 블로킹 금지

3.2에서 본 것처럼 하나의 EventLoop(스레드)가 여러 Channel의 I/O를 전담하므로, 어느 한 Channel의 핸들러 코드가 블로킹되면 같은 EventLoop에 등록된 다른 모든 커넥션의 처리까지 지연된다.

시간이 걸리는(블로킹) 로직은 파이프라인에 핸들러를 추가할 때 I/O를 담당하는 EventLoop와 별도의 `EventExecutorGroup`을 지정해 실행 스레드를 분리해야 한다:

> "Tell the pipeline to run MyBusinessLogicHandler's event handler methods in a different thread than an I/O thread so that the I/O thread is not blocked by a time-consuming task. If your business logic is fully asynchronous or finished very quickly, you don't need to specify a group."[^9]

---

## 4. 구성 요소

### 4.1 Channel: TCP 커넥션의 추상화

`Channel`은 "네트워크 소켓 또는 I/O 작업이 가능한 컴포넌트에 대한 연결 통로(nexus)"로 정의된다.[^6] 서버 측에서 클라이언트 연결을 수락(`accept`)하는 주체는 `ServerChannel`이고, 연결이 수락될 때마다 그 TCP 커넥션 하나에 대응하는 별도의 `Channel` 인스턴스가 새로 생성되어 EventLoop에 등록된다.

서버는 보통 두 개의 `EventLoopGroup`으로 역할을 나눈다: 연결 수락(accept)만 담당하는 "boss" 그룹과, 수락된 각 커넥션의 트래픽(read/write)을 처리하는 "worker" 그룹.[^1] 이렇게 분리하면 대량의 신규 연결이 몰려도 accept 처리가 기존 커넥션의 트래픽 처리를 방해하지 않는다.

### 4.2 ChannelPipeline과 ChannelHandler

`ChannelPipeline`은 Intercepting Filter 패턴을 확장 구현한 것으로, 하나의 Channel에 연결된 `ChannelHandler`들을 순서대로 담는 컨테이너다.[^7]

- **Inbound 이벤트**(연결 수립, 데이터 수신 등): Head→Tail 방향으로 흐르며 `ChannelInboundHandler`만 통과한다.
- **Outbound 이벤트**(쓰기, 연결, 바인드, 종료 등): Tail→Head 방향으로 흐르며 `ChannelOutboundHandler`만 통과한다.
- 각 핸들러는 이벤트를 처리한 뒤 명시적으로 다음 핸들러로 전파해야 하며, 전파하지 않으면 이벤트는 해당 핸들러에서 종료된다.[^7]

2.2에서 설명한 TCP 메시지 경계 문제는 이 파이프라인에 `ByteToMessageDecoder`/`MessageToByteEncoder` 계열 코덱 핸들러를 등록해, 수신 스트림을 완전한 메시지 단위로 재조립하거나 송신 메시지를 직렬화하는 방식으로 해결한다.

### 4.3 ByteBuf

Netty의 자체 버퍼 구현으로, NIO `ByteBuffer`와 근본적으로 다른 두 가지 설계를 갖는다.[^8]

- **readerIndex / writerIndex 이중 포인터**: NIO `ByteBuffer`는 포인터가 하나뿐이라 쓰기 후 읽기로 전환할 때 `flip()`이 필요하지만, `ByteBuf`는 읽기·쓰기 포인터가 독립적이라 이 과정이 불필요하다.
- **참조 카운팅**: `ReferenceCounted`를 구현해 `retain()`/`release()`로 수명을 명시적으로 관리한다. GC에만 의존하는 NIO 버퍼와 달리 버퍼를 재사용(pooling)할 수 있어 메모리 할당·회수 오버헤드를 줄인다.

---

## 5. 기타

### 5.1 Native Transport

Netty는 JNI 기반으로 Linux `epoll`, macOS/BSD `kqueue`, Linux `io_uring`을 직접 사용하는 전송 구현을 별도로 제공한다. 표준 Java NIO(Selector) 기반 전송 대비 가비지 발생이 적고 일반적으로 성능이 우수하며, 플랫폼 특화 기능을 활용할 수 있다.[^10]

### 5.2 버전 이력

- **4.1 / 4.2 병행 유지**: 4.1(LTS 성격)과 4.2(최신)가 함께 유지된다. 4.2는 4.1과 대체로 하위 호환되며 최소 Java 요구 버전을 6→8로 상향했다. 주요 비호환 변경: 클라이언트 TLS 호스트명 검증 기본 활성화, 기본 메모리 할당자가 `pooled`→`adaptive`로 변경, `io_uring` 전송이 incubator에서 정식 졸업.[^2]
- **5.x는 폐기됨**: 5.0.0-Alpha 단계에서 개발 중단, Netty 팀이 4.1 계속 사용을 공식 권고했다.[^3]

---

## Sources
- [Netty User Guide for 4.x](https://netty.io/wiki/user-guide-for-4.x.html)
- [Netty 4.2 Migration Guide](https://github.com/netty/netty/wiki/Netty-4.2-Migration-Guide)
- [Status of Netty 5.0.0 (Netty Google Group)](https://groups.google.com/g/netty/c/jJ-tkHiGQ84)
- [java.nio.channels.Selector (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/Selector.html)
- [EventLoop (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/EventLoop.html)
- [Channel (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/Channel.html)
- [ChannelPipeline (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelPipeline.html)
- [ByteBuf (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/buffer/ByteBuf.html)
- [ChannelPipeline#addLast(EventExecutorGroup, ChannelHandler...) (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelPipeline.html#addLast(io.netty.util.concurrent.EventExecutorGroup,io.netty.channel.ChannelHandler...))
- [Netty Native Transports](https://netty.io/wiki/native-transports.html)

---

## Related pages
- [[jvm-options]]
- [[netty-implementation]]

[^1]: Netty User Guide for 4.x — 아키텍처 개요, boss/worker EventLoopGroup 설명, TCP 스트림 프레이밍 문제.
[^2]: Netty 4.2 Migration Guide — "Netty 4.2 is largely backwards compatible with Netty 4.1, but there are a few choice compatibility breakages to be aware of." 최소 Java 버전 6→8 상향, TLS 호스트명 검증 기본 활성화, 기본 할당자 pooled→adaptive, io_uring 전송 정식 졸업.
[^3]: Netty 공식 Google Group, Trustin Lee(Netty 리드) — "We decided to drop Netty 5 in favor of 4.1. Please use 4.1 instead."
[^4]: java.nio.channels.Selector — "A multiplexor of SelectableChannel objects." 하나의 스레드가 다수 채널의 I/O 준비 상태를 질의·처리하는 메커니즘.
[^5]: EventLoop (Netty 4.1 API) — "Will handle all the I/O operations for a Channel once registered. One EventLoop instance will usually handle more than one Channel..."
[^6]: Channel (Netty 4.1 API) — "A nexus to a network socket or a component which is capable of I/O operations such as read, write, connect, and bind."
[^7]: ChannelPipeline (Netty 4.1 API) — "An inbound event is handled by the inbound handlers in the bottom-up direction..." / "An outbound event is handled by the outbound handler in the top-down direction..."
[^8]: ByteBuf (Netty 4.1 API) — "ByteBuf provides two pointer variables to support sequential read and write operations..."
[^9]: ChannelPipeline#addLast(EventExecutorGroup, ChannelHandler...) 공식 API 문서 "Building a pipeline" 절.
[^10]: Netty Native Transports — "adds features specific to a particular platform, generate less garbage, and generally improve performance when compared to the NIO based transport."
