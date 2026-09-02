---
title: Netty 구현
updated: 2026-09-02 13:02:54
tags:
  - java
  - network
  - netty
  - code-example
---

## 1. 개요

[[netty]]에서 다룬 아키텍처(EventLoop, ChannelPipeline, ByteBuf)를 실제 코드로 구성할 때 자주 쓰는 구체 클래스의 역할과 최소 예시, 주의점을 정리한다.

---

## 2. 부트스트랩과 채널

### 2.1 EventLoopGroup 구현체

`EventLoopGroup`의 표준(NIO) 구현체는 `NioEventLoopGroup`이다. Native Transport를 쓰면 `EpollEventLoopGroup`(Linux)/`KQueueEventLoopGroup`(macOS)으로 대체한다([[netty]] 5.1 참고).

### 2.2 ServerBootstrap과 ChannelOption

`ServerBootstrap`은 boss/worker `EventLoopGroup`, 채널 구현체(`NioServerSocketChannel`), 파이프라인 초기화 로직, 소켓 옵션을 조립하는 헬퍼다.

```java
EventLoopGroup bossGroup = new NioEventLoopGroup(1);
EventLoopGroup workerGroup = new NioEventLoopGroup();
try {
    ServerBootstrap b = new ServerBootstrap();
    b.group(bossGroup, workerGroup)
     .channel(NioServerSocketChannel.class)
     .option(ChannelOption.SO_BACKLOG, 128)        // 부모(boss) 채널 옵션
     .childOption(ChannelOption.TCP_NODELAY, true)  // 자식(worker) 채널 옵션
     .childHandler(new MyChannelInitializer());

    ChannelFuture f = b.bind(8080).sync();
    f.channel().closeFuture().sync();
} finally {
    bossGroup.shutdownGracefully();
    workerGroup.shutdownGracefully();
}
```

**주의**: `option()`은 서버 소켓(부모, accept 담당) 옵션이고 `childOption()`은 accept된 커넥션(자식) 옵션이다 — `SO_BACKLOG`를 `childOption()`에 넣거나 `TCP_NODELAY`를 `option()`에 넣는 실수를 하면 옵션이 적용되지 않는다.

### 2.3 종료: shutdownGracefully()

`shutdownGracefully()`는 종료 신호를 보낸 뒤 지정된 quiet period 동안 새 작업이 들어오지 않으면 종료하고, timeout을 넘기면 강제 종료한다.[^1] `finally` 블록에서 반드시 호출해 EventLoop 스레드를 정리해야 한다.

---

## 3. 파이프라인 구성: ChannelInitializer

`ChannelInitializer`는 Channel이 EventLoop에 등록될 때 파이프라인을 한 번만 구성하기 위한 특수 핸들러다. `initChannel()`이 반환되면 파이프라인에서 스스로 제거된다.[^2]

```java
public class MyChannelInitializer extends ChannelInitializer<SocketChannel> {
    @Override
    protected void initChannel(SocketChannel ch) {
        ChannelPipeline p = ch.pipeline();
        p.addLast(new LengthFieldBasedFrameDecoder(65536, 0, 4, 0, 4));
        p.addLast(new LengthFieldPrepender(4));
        p.addLast(new MyBusinessHandler());
    }
}
```

---

## 4. 핸들러 작성

### 4.1 ChannelInboundHandlerAdapter vs SimpleChannelInboundHandler

`SimpleChannelInboundHandler<T>`는 `channelRead0()`가 반환되면 메시지를 자동으로 `release()`한다(생성자 `autoRelease` 기본값 `true`). `ChannelInboundHandlerAdapter`는 이런 자동 해제가 없다.[^3]

```java
public class MyBusinessHandler extends SimpleChannelInboundHandler<ByteBuf> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) {
        System.out.println(msg.toString(CharsetUtil.UTF_8));
        // msg는 이 메서드 반환 시 자동 release() 된다
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
```

**주의**: `autoRelease=false`로 만들거나 메시지를 다음 핸들러로 넘길 때는 `ReferenceCountUtil.retain()`으로 참조 카운트를 직접 늘려야 한다.[^3]

### 4.2 @Sharable

같은 핸들러 인스턴스를 여러 파이프라인에 재사용하려면 `@ChannelHandler.Sharable`을 붙여야 한다. 이 애너테이션은 "동일 인스턴스가 레이스 컨디션 없이 하나 이상의 파이프라인에 여러 번 추가될 수 있다"는 뜻이며, 핸들러가 멤버 변수 등 공유 가변 상태를 갖지 않는다는 것을 전제로 한다.[^4]

```java
@ChannelHandler.Sharable
public class LoggingHandler extends ChannelInboundHandlerAdapter {
    // 상태(멤버 변수) 없음 — 여러 커넥션이 동시에 이 인스턴스를 공유해도 안전
}
```

**주의**: `@Sharable` 핸들러에 실수로 상태(예: 커넥션별 카운터)를 넣으면 서로 다른 커넥션의 EventLoop 스레드가 같은 필드를 동시에 수정해 동시성 버그가 생긴다.

### 4.3 예외 처리

각 핸들러(또는 파이프라인 마지막 핸들러)에서 `exceptionCaught()`를 구현해 처리하지 않은 예외를 반드시 로깅하고 `ctx.close()`해야 한다 — 구현하지 않으면 예외가 조용히 파이프라인 끝까지 전파되다 사라질 수 있다.

---

## 5. 코덱: 길이 기반 프레이밍

수신 측은 `LengthFieldBasedFrameDecoder`, 송신 측은 `LengthFieldPrepender`를 짝으로 등록해 길이 필드 기반 프레이밍을 구현한다. `LengthFieldPrepender`는 "메시지 길이를 바이너리 형태로 앞에 붙이는 인코더"다.[^5] 3장 예시의 `(65536, 0, 4, 0, 4)`는 "앞 4바이트가 길이 필드, 최대 프레임 65536바이트"를 의미한다([[netty]] 2.2/4.2 참고).

---

## 6. ByteBuf 메모리 관리

### 6.1 할당

핸들러 안에서 새 버퍼가 필요하면 `Unpooled.buffer()` 대신 `ctx.alloc().buffer()`를 쓴다. 파이프라인이 속한 Channel의 `ByteBufAllocator`(기본은 풀링되는 `PooledByteBufAllocator`)를 통해 할당되어 재사용 이득을 얻는다.

### 6.2 참조 카운팅과 릴리스 규칙

"참조 카운트 객체를 마지막으로 사용하는 쪽이 그 객체를 해제할 책임을 진다"가 원칙이다.[^6] 핸들러가 받은 메시지를 다음 핸들러로 넘기지 않고 직접 소비했다면 그 핸들러가 `release()`를 호출해야 한다.

```java
public class RawHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ByteBuf buf = (ByteBuf) msg;
        try {
            // 처리
        } finally {
            buf.release();   // 호출하지 않으면 메모리 누수
        }
    }
}
```

**주의**: JVM은 Netty의 참조 카운트를 알지 못하므로, `release()`를 호출하지 않은 채 버퍼가 도달 불가능해지면 참조 카운트가 0이 아니어도 그냥 GC된다 — 이 경우 버퍼가 풀로 반환되지 못해 누수로 이어진다.[^6]

### 6.3 ResourceLeakDetector

개발·테스트 단계에서는 `-Dio.netty.leakDetection.level=paranoid`로 실행해 릴리스 누락을 조기에 잡아야 한다. 공식 가이드는 "단위·통합 테스트는 PARANOID 레벨과 SIMPLE(기본) 레벨 모두에서 실행하라"고 권고한다.[^7] PARANOID는 오버헤드가 커서 테스트 전용이다.

---

## 7. 비동기 쓰기 결과 처리: ChannelFuture / ChannelFutureListener

Netty의 모든 I/O 작업은 즉시 반환되는 `ChannelFuture`로 결과를 알려준다. 공식문서는 **핸들러 콜백(= I/O 스레드) 안에서 `await()`/`sync()`를 호출하면 그 작업이 완료되지 않아 데드락에 빠질 수 있다**고 명시하며, 대신 논블로킹 `addListener()`를 쓰라고 권고한다.[^8]

```java
ChannelFuture f = ctx.writeAndFlush(msg);
f.addListener(future -> {
    if (!future.isSuccess()) {
        future.cause().printStackTrace();
    }
    ctx.close();
});
```

**주의**: 2.2 예시의 `b.bind(8080).sync()`는 `main()` 스레드(=I/O 스레드가 아닌 애플리케이션 스레드)에서 호출되므로 안전하다. 핸들러의 `channelRead()`/`channelActive()` 등 EventLoop가 직접 호출하는 콜백 안에서는 `sync()`를 쓰면 안 된다.

---

## 8. 타임아웃 처리: IdleStateHandler

`IdleStateHandler`는 지정 시간 동안 read/write/둘 다가 없으면 `IdleStateEvent`를 발생시킨다.[^9] 파이프라인에 등록해두고, 이후 핸들러의 `userEventTriggered()`에서 이벤트를 받아 처리한다.

```java
p.addLast(new IdleStateHandler(60, 30, 0, TimeUnit.SECONDS));
p.addLast(new ChannelInboundHandlerAdapter() {
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof IdleStateEvent) {
            IdleState state = ((IdleStateEvent) evt).state();
            if (state == IdleState.READER_IDLE) {
                ctx.close();                  // 60초간 read 없으면 연결 종료
            } else if (state == IdleState.WRITER_IDLE) {
                ctx.writeAndFlush(PING_MSG);  // 30초간 write 없으면 하트비트 전송
            }
        }
    }
});
```

---

## 9. 주의할 점 요약

| 항목 | 주의점 |
|---|---|
| `option()` vs `childOption()` | 서버 소켓 옵션(`SO_BACKLOG`)과 자식 커넥션 옵션(`TCP_NODELAY` 등)을 구분해서 설정해야 한다 (2.2) |
| `ChannelInboundHandlerAdapter` | `SimpleChannelInboundHandler`와 달리 자동 release가 없어 직접 `release()`해야 한다 (4.1, 6.2) |
| `@Sharable` | 상태(멤버 변수) 없는 핸들러에만 붙여야 한다 (4.2) |
| `exceptionCaught` | 미구현 시 예외가 조용히 유실될 수 있다 (4.3) |
| `ByteBuf` 릴리스 | 마지막으로 소비한 핸들러가 반드시 `release()` — 안 하면 GC돼도 누수로 남는다 (6.2) |
| `ChannelFuture.sync()`/`await()` | 핸들러 콜백(I/O 스레드) 안에서 호출 금지 — 데드락 위험, `addListener()` 사용 (7) |
| `shutdownGracefully()` | 애플리케이션 종료 시 반드시 호출해 EventLoop 스레드를 정리해야 한다 (2.3) |

---

## Sources
- [Netty User Guide for 4.x](https://netty.io/wiki/user-guide-for-4.x.html)
- [Netty Reference-Counted Objects](https://netty.io/wiki/reference-counted-objects.html)
- [ChannelInitializer (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelInitializer.html)
- [ChannelHandler.Sharable (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelHandler.Sharable.html)
- [SimpleChannelInboundHandler (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/SimpleChannelInboundHandler.html)
- [ChannelFuture (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelFuture.html)
- [IdleStateHandler (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/handler/timeout/IdleStateHandler.html)
- [ChannelOption (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/channel/ChannelOption.html)
- [EventExecutorGroup#shutdownGracefully() (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/util/concurrent/EventExecutorGroup.html#shutdownGracefully())
- [LengthFieldPrepender (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/handler/codec/LengthFieldPrepender.html)
- [ResourceLeakDetector (Netty 4.1 API)](https://netty.io/4.1/api/io/netty/util/ResourceLeakDetector.html)

---

## Related pages
- [[netty]]

[^1]: EventExecutorGroup#shutdownGracefully() 공식 API 문서 — quietPeriod/timeout 파라미터로 진행 중인 작업을 마친 뒤 종료.
[^2]: ChannelInitializer (Netty 4.1 API) — "After the method returns this instance will be removed from the ChannelPipeline of the Channel."
[^3]: SimpleChannelInboundHandler (Netty 4.1 API) — "it will release all handled messages by passing them to ReferenceCountUtil.release(Object)." autoRelease=false 시 "you may need to use ReferenceCountUtil.retain(Object) if you pass the object to the next handler."
[^4]: ChannelHandler.Sharable (Netty 4.1 API) — "the same instance of the annotated ChannelHandler can be added to one or more ChannelPipelines multiple times without a race condition."
[^5]: LengthFieldPrepender (Netty 4.1 API) — "An encoder that prepends the length of the message. The length value is prepended as a binary form."
[^6]: Netty Reference-Counted Objects — "the party that accesses a reference-counted object last is also responsible for the destruction of that reference-counted object." / "Because the JVM is not aware of the reference counting Netty implements, it will automatically garbage collect them once they become unreachable, even if their reference counts are not zero."
[^7]: Netty Reference-Counted Objects — "Run your unit tests and integration tests at PARANOID leak detection level, as well as at SIMPLE level."
[^8]: ChannelFuture (Netty 4.1 API) — "If await() is called by an event handler method, which is called by the I/O thread, the I/O operation it is waiting for might never complete because await() can block the I/O operation it is waiting for, which is a dead lock."
[^9]: IdleStateHandler (Netty 4.1 API) — "Triggers an IdleStateEvent when a Channel has not performed read, write, or both operation for a while."
