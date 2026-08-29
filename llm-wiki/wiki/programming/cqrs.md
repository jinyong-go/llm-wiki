---
title: CQRS
updated: 2026-08-11 17:04:12
tags:
  - programming
  - architecture
  - cqrs
  - ddd
  - event-sourcing
---

## 1. 개요

**CQRS(Command Query Responsibility Segregation)**는 데이터 변경(Command)과 데이터 조회(Query)를 별도의 모델로 분리하는 아키텍처 패턴이다. Greg Young이 ~2010년 제안했으며, Bertrand Meyer의 **CQS(Command Query Separation)** 원칙을 객체/서비스 모델 수준으로 확장한 것이다.

- **CQS** (Meyer, 1988): 메서드 수준. 상태를 변경하는 메서드(Command)는 값을 반환하지 않고, 값을 반환하는 메서드(Query)는 상태를 변경하지 않는다.
- **CQRS**: 모델 수준. 쓰기용 모델과 읽기용 모델을 완전히 분리한다.

> "you can use a different model to update information than the model you use to read information." — Martin Fowler

---

## 2. 핵심 개념

### 2.1. Command (쓰기 모델)

- 비즈니스 의도를 표현한다. `"SetReservationStatus = Reserved"` 대신 `"BookHotelRoom"`.
- 도메인 유효성 검사와 비즈니스 규칙을 포함한다.
- 트랜잭션 정합성을 보장한다.
- 반환값은 없거나 생성된 ID만 반환한다.

```java
// Command: 비즈니스 의도
public record BookHotelRoomCommand(
    String roomId,
    String guestId,
    LocalDate checkIn,
    LocalDate checkOut
) {}

// Command Handler
@Component
public class BookHotelRoomHandler {
    private final ReservationRepository repository;

    public String handle(BookHotelRoomCommand cmd) {
        Room room = repository.findRoom(cmd.roomId());
        room.book(cmd.guestId(), cmd.checkIn(), cmd.checkOut()); // 도메인 로직
        repository.save(room);
        return room.getReservationId();
    }
}
```

### 2.2. Query (읽기 모델)

- 비즈니스 로직·유효성 검사를 포함하지 않는다.
- 프레젠테이션에 최적화된 DTO/프로젝션을 반환한다.
- 부작용(Side Effect)이 없다.

```java
// Query
public record GetRoomAvailabilityQuery(String roomId, LocalDate from, LocalDate to) {}

// Query Handler — 도메인 모델 없이 바로 DTO 반환
@Component
public class GetRoomAvailabilityHandler {
    private final RoomReadRepository readRepository;

    public RoomAvailabilityDto handle(GetRoomAvailabilityQuery query) {
        return readRepository.findAvailability(
            query.roomId(), query.from(), query.to()
        );
    }
}
```

---

## 3. 구현 수준

### 3.1. Level 1 — 동일 DB, 분리된 모델

단일 데이터 저장소를 사용하되 읽기/쓰기 로직만 분리한다. 가장 낮은 오버헤드이며, CQRS 도입의 첫 단계로 적합하다.

```
Controller ──► CommandService ──► Domain Model ──► RDB
             ◄──────────────────────────────────────────
Controller ──► QueryService   ──► DTO Projection ──► RDB
```

```java
// 쓰기: 도메인 모델 경유
@Transactional
public void placeOrder(PlaceOrderCommand cmd) {
    Order order = new Order(cmd.customerId(), cmd.items());
    orderRepository.save(order);
}

// 읽기: JPA 인터페이스 프로젝션으로 직접 DTO 반환 (도메인 객체 생략)
public interface OrderSummaryRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o.id AS id, o.status AS status, SUM(i.price) AS total " +
           "FROM Order o JOIN o.items i WHERE o.customerId = :customerId " +
           "GROUP BY o.id, o.status")
    List<OrderSummaryDto> findSummariesByCustomer(@Param("customerId") Long customerId);
}
```

### 3.2. Level 2 — 분리된 저장소

쓰기 저장소(정규화된 RDBMS)와 읽기 저장소(역정규화된 문서 DB, Redis, Elasticsearch 등)를 분리한다. 쓰기 이벤트로 읽기 저장소를 동기화한다.

```
Command ──► Write DB (RDB)
                │
                ▼ (이벤트/메시지)
           Event Bus (Kafka, RabbitMQ)
                │
                ▼
           Projection Builder ──► Read DB (MongoDB, Redis, ES)
                                        │
                                        ▼
                                  Query Handler ──► DTO
```

```java
// 쓰기 완료 후 이벤트 발행
@Transactional
public void placeOrder(PlaceOrderCommand cmd) {
    Order order = new Order(cmd.customerId(), cmd.items());
    orderRepository.save(order);
    eventPublisher.publish(new OrderPlacedEvent(order.getId(), order.getItems()));
}

// 읽기 저장소 동기화
@EventListener
public void on(OrderPlacedEvent event) {
    OrderReadModel readModel = OrderReadModel.from(event);
    orderReadRepository.save(readModel);  // MongoDB 등 읽기 전용 저장소
}
```

### 3.3. Level 3 — Event Sourcing 결합

이벤트 저장소가 쓰기 모델의 단일 진실 공급원이 된다. 읽기 모델은 이벤트를 재생(Replay)해 구축한 Materialized View다.

```
Command ──► Aggregate ──► Event Store (append-only)
                                │
                           Event Stream
                                │
                          Projection ──► Read Store
```

---

## 4. CQRS vs Event Sourcing

두 패턴은 **독립적**이다. 함께 사용하면 시너지가 크지만 각각 단독으로도 적용 가능하다.

| | CQRS | Event Sourcing |
| :--- | :--- | :--- |
| 핵심 | 읽기/쓰기 모델 분리 | 상태를 이벤트 스트림으로 저장 |
| 필수 관계 | ✗ | ✗ |
| 함께 사용 시 | 이벤트 저장소 = 쓰기 모델, Materialized View = 읽기 모델 | |
| 독립 사용 | 동일 DB에서도 CQRS 적용 가능 | CQRS 없이 Event Sourcing만 사용 가능 |

---

## 5. 동기 vs 비동기 Command 처리

| | 동기 | 비동기 |
| :--- | :--- | :--- |
| 처리 방식 | HTTP 요청 내에서 즉시 처리 | 메시지 큐에 적재 후 별도 처리 |
| 일관성 | 즉시 | 최종 일관성(Eventual) |
| 확장성 | 낮음 | 높음 |
| 클라이언트 | 즉시 결과 수신 | polling / webhook / SSE로 결과 확인 |
| 사용 예 | 단순 도메인, 즉시 피드백 필요 | 대용량 처리, 긴 트랜잭션 |

비동기 처리 시 명백한 오류(입력값 검증 등)는 클라이언트 측에서 선제 검증해 큐 부하를 줄인다. 서버는 경쟁 조건 등 비즈니스 예외만 처리한다.

---

## 6. 최종 일관성(Eventual Consistency)

분리된 저장소를 사용하면 읽기 모델이 쓰기 모델보다 뒤처질 수 있다.

**처리 전략**:
- **낙관적 UI**: Command 완료 후 UI에서 로컬 상태를 즉시 반영, 서버 응답으로 나중에 검증
- **버전 체크**: 읽기 응답에 버전 번호 포함 → Command 전송 시 함께 전달 → 서버에서 충돌 감지
- **멱등성 소비자**: 메시지 중복 전달에 대비해 이벤트 핸들러를 멱등하게 구현

---

## 7. Java/Spring 구현

### 7.1. 수동 디스패치 패턴

프레임워크 없이 직접 구현하는 방식이다.

```java
// CommandBus
public interface CommandHandler<C> {
    void handle(C command);
}

@Component
public class CommandBus {
    private final Map<Class<?>, CommandHandler<?>> handlers;

    public CommandBus(List<CommandHandler<?>> handlerList) {
        this.handlers = handlerList.stream()
            .collect(toMap(h -> resolveCommandType(h), h -> h));
    }

    @SuppressWarnings("unchecked")
    public <C> void dispatch(C command) {
        CommandHandler<C> handler = (CommandHandler<C>) handlers.get(command.getClass());
        if (handler == null) throw new IllegalArgumentException("No handler for " + command.getClass());
        handler.handle(command);
    }
}

// QueryBus
public interface QueryHandler<Q, R> {
    R handle(Q query);
}

@Component
public class QueryBus {
    private final Map<Class<?>, QueryHandler<?, ?>> handlers;

    public QueryBus(List<QueryHandler<?, ?>> handlerList) {
        this.handlers = handlerList.stream()
            .collect(toMap(h -> resolveQueryType(h), h -> h));
    }

    @SuppressWarnings("unchecked")
    public <Q, R> R dispatch(Q query) {
        QueryHandler<Q, R> handler = (QueryHandler<Q, R>) handlers.get(query.getClass());
        return handler.handle(query);
    }
}
```

### 7.2. Axon Framework

Java 생태계에서 CQRS + Event Sourcing을 가장 완전하게 지원하는 프레임워크다.

```groovy
implementation 'org.axonframework:axon-spring-boot-starter:4.10.3'
```

```java
// Aggregate (Command 처리 + Event 발행)
@Aggregate
public class OrderAggregate {

    @AggregateIdentifier
    private String orderId;
    private OrderStatus status;

    @CommandHandler
    public OrderAggregate(PlaceOrderCommand cmd) {
        apply(new OrderPlacedEvent(cmd.getOrderId(), cmd.getCustomerId(), cmd.getItems()));
    }

    @CommandHandler
    public void handle(ConfirmOrderCommand cmd) {
        if (status != OrderStatus.PENDING) throw new IllegalStateException();
        apply(new OrderConfirmedEvent(orderId));
    }

    @EventSourcingHandler
    public void on(OrderPlacedEvent event) {
        this.orderId = event.getOrderId();
        this.status  = OrderStatus.PENDING;
    }

    @EventSourcingHandler
    public void on(OrderConfirmedEvent event) {
        this.status = OrderStatus.CONFIRMED;
    }
}

// Projection (읽기 모델 생성)
@Component
@ProcessingGroup("order-summary")
public class OrderSummaryProjection {

    private final OrderSummaryRepository repository;

    @EventHandler
    public void on(OrderPlacedEvent event) {
        repository.save(new OrderSummary(event.getOrderId(), OrderStatus.PENDING, event.getTotal()));
    }

    @EventHandler
    public void on(OrderConfirmedEvent event) {
        repository.findById(event.getOrderId())
            .ifPresent(s -> { s.setStatus(OrderStatus.CONFIRMED); repository.save(s); });
    }

    @QueryHandler
    public OrderSummary handle(GetOrderSummaryQuery query) {
        return repository.findById(query.getOrderId()).orElseThrow();
    }
}

// Controller
@RestController
public class OrderController {
    private final CommandGateway commandGateway;
    private final QueryGateway   queryGateway;

    @PostMapping("/orders")
    public String placeOrder(@RequestBody PlaceOrderRequest req) {
        return commandGateway.sendAndWait(new PlaceOrderCommand(UUID.randomUUID().toString(), req));
    }

    @GetMapping("/orders/{id}")
    public OrderSummary getOrder(@PathVariable String id) {
        return queryGateway.query(
            new GetOrderSummaryQuery(id), ResponseTypes.instanceOf(OrderSummary.class)
        ).join();
    }
}
```

### 7.3. Spring만으로 최소 적용

서비스 레이어를 Command/Query로 명시적 분리하는 것만으로도 CQRS의 이점을 얻을 수 있다.

```java
@Service
public class OrderCommandService {
    // Command 전용 — 도메인 모델, 트랜잭션, 비즈니스 규칙
    @Transactional
    public void placeOrder(PlaceOrderCommand cmd) { ... }

    @Transactional
    public void confirmOrder(ConfirmOrderCommand cmd) { ... }
}

@Service
@Transactional(readOnly = true)
public class OrderQueryService {
    // Query 전용 — DTO 반환, 비즈니스 로직 없음
    public OrderSummaryDto getSummary(Long orderId) { ... }

    public Page<OrderListItemDto> listOrders(Pageable pageable) { ... }
}
```

---

## 8. 장단점

| | |
| :--- | :--- |
| **장점** | 읽기/쓰기 독립 확장, 각 모델 최적화(정규화된 쓰기 / 역정규화된 읽기), 복잡한 도메인 로직 격리, 보안 분리(읽기 전용 역할), 읽기 쿼리 단순화(Materialized View) |
| **단점** | 복잡도 증가(특히 Event Sourcing 결합 시), 최종 일관성 → UX 설계 필요, 메시지 인프라 요구(분리 저장소), ORM 자동 생성 도구와 궁합 안 맞음 |

---

## 9. 적용 판단 기준

**적합한 경우**

- 읽기/쓰기 부하가 크게 다른 시스템 (읽기 100 : 쓰기 1)
- 복잡한 도메인 로직이 있는 Bounded Context (DDD)
- 다수의 사용자가 동일 데이터를 동시에 수정하는 협업 도메인
- 읽기 모델의 스키마가 쓰기 모델과 크게 다를 때 (복잡한 JOIN 다수)

**부적합한 경우** (Fowler: "be very cautious")

- 단순 CRUD 도메인 — 복잡도 증가가 이득을 압도
- 전체 시스템에 일괄 적용 — 특정 Bounded Context에만 국소 적용이 원칙
- 팀이 최종 일관성을 다룰 준비가 되지 않은 경우

> 읽기 전용 DB 분리(Reporting Database)만으로도 충분한 경우가 많다. CQRS는 그보다 더 많은 복잡성을 수반한다.

---

## Sources

- [CQRS — Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [CQRS pattern — Microsoft Azure Architecture](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [CQRS Documents — Greg Young (2010)](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)
- [Axon Framework Reference Guide](https://docs.axoniq.io/reference-guide/)

---

## Related pages

- [[design-patterns]]
- [[design-patterns-behavioral]]
- [[jpa-transaction]]
- [[aop]]
