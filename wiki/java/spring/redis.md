---
title: Spring Boot Redis
updated: 2026-08-11 17:04:12
tags:
  - spring
  - spring-boot
  - redis
  - lettuce
  - cache
  - nosql
  - connection-pool
---

## 1. 개요

Spring Boot는 `spring-boot-starter-data-redis` 의존성만 추가하면 Redis 연결, `RedisTemplate`, `StringRedisTemplate`을 자동으로 설정한다. 기본 클라이언트는 **Lettuce**이며, 비동기·반응형·파이프라이닝·클러스터를 지원한다. Jedis는 선택 가능한 대안이지만 Master/Replica와 Reactive API를 지원하지 않는다.

## 2. 의존성

```groovy
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // 커넥션 풀 사용 시 (commons-pool2 클래스패스에 있으면 자동 활성화)
    implementation 'org.apache.commons:commons-pool2'

    // Spring Cache 연동 시
    implementation 'org.springframework.boot:spring-boot-starter-cache'

    // Reactive Redis
    implementation 'org.springframework.boot:spring-boot-starter-data-redis-reactive'
}
```

Jedis로 전환할 경우 `lettuce-core`를 제외하고 `jedis`를 추가한다:

```groovy
dependencies {
    implementation('org.springframework.boot:spring-boot-starter-data-redis') {
        exclude group: 'io.lettuce', module: 'lettuce-core'
    }
    implementation 'redis.clients:jedis'
}
```

## 3. 기본 연결 설정

```yaml
spring:
  data:
    redis:
      host: localhost       # 기본값
      port: 6379            # 기본값
      database: 0           # 기본값
      username: user
      password: secret
      timeout: 2000ms       # 읽기/쓰기 타임아웃
      ssl:
        enabled: false
```

URL 방식으로 설정할 수도 있다. `url`이 설정되면 `host`, `port`, `username`, `password`는 무시된다:

```yaml
spring:
  data:
    redis:
      url: redis://user:secret@localhost:6379
      database: 0
```

## 4. 자동 설정 원리

`RedisAutoConfiguration`이 다음 조건을 만족할 때 빈을 생성한다:

```java
@AutoConfiguration
@ConditionalOnClass(RedisOperations.class)             // (1) spring-data-redis 클래스패스 존재
@EnableConfigurationProperties(RedisProperties.class)
@Import({ LettuceConnectionConfiguration.class, JedisConnectionConfiguration.class })
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")           // (2) redisTemplate 빈 없을 때
    @ConditionalOnSingleCandidate(RedisConnectionFactory.class) // (3) ConnectionFactory 1개일 때
    public RedisTemplate<Object, Object> redisTemplate(...) { ... }

    @Bean
    @ConditionalOnMissingBean                                   // (4) stringRedisTemplate 빈 없을 때
    @ConditionalOnSingleCandidate(RedisConnectionFactory.class) // (5) ConnectionFactory 1개일 때
    public StringRedisTemplate stringRedisTemplate(...) { ... }
}
```

`RedisConnectionFactory` 빈을 하나만 정의하면 `RedisTemplate`, `StringRedisTemplate`이 자동 생성된다. 다중 DataSource처럼 `ConnectionFactory`가 여러 개이면 자동 설정이 비활성화되므로 직접 등록해야 한다.

## 5. RedisTemplate

### 5.1. 직렬화 전략

기본 직렬화는 `JdkSerializationRedisSerializer`로 바이너리 저장되어 Redis CLI에서 읽기 어렵고 보안상 취약하다. 실무에서는 아래 직렬화 조합을 권장한다:

| 대상 | 권장 직렬화 | 이유 |
| :--- | :--- | :--- |
| Key | `StringRedisSerializer` | 사람이 읽을 수 있는 키 |
| Value | `GenericJackson2JsonRedisSerializer` | 타입 정보 포함 JSON, 역직렬화 안전 |
| Hash Key | `StringRedisSerializer` | |
| Hash Value | `GenericJackson2JsonRedisSerializer` | |

```java
@Bean
public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(factory);

    ObjectMapper mapper = new ObjectMapper();
    mapper.activateDefaultTyping(
        LaissezFaireSubTypeValidator.instance,
        ObjectMapper.DefaultTyping.NON_FINAL
    );
    GenericJackson2JsonRedisSerializer jsonSerializer =
        new GenericJackson2JsonRedisSerializer(mapper);

    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(jsonSerializer);
    template.setHashKeySerializer(new StringRedisSerializer());
    template.setHashValueSerializer(jsonSerializer);
    template.afterPropertiesSet();
    return template;
}
```

### 5.2. Operations

`RedisTemplate`은 데이터 타입별 Operations 인터페이스를 제공한다:

| 메서드 | 인터페이스 | Redis 타입 |
| :--- | :--- | :--- |
| `opsForValue()` | `ValueOperations` | String |
| `opsForList()` | `ListOperations` | List |
| `opsForSet()` | `SetOperations` | Set |
| `opsForZSet()` | `ZSetOperations` | Sorted Set |
| `opsForHash()` | `HashOperations` | Hash |
| `opsForGeo()` | `GeoOperations` | Geospatial |
| `opsForHyperLogLog()` | `HyperLogLogOperations` | HyperLogLog |

```java
// Value
redisTemplate.opsForValue().set("user:1", user, Duration.ofHours(1));
User user = (User) redisTemplate.opsForValue().get("user:1");

// List
redisTemplate.opsForList().leftPush("queue", message);
String msg = (String) redisTemplate.opsForList().rightPop("queue");

// Hash
redisTemplate.opsForHash().put("session:abc", "userId", "123");
Object userId = redisTemplate.opsForHash().get("session:abc", "userId");
```

Bound 연산은 키를 한 번 바인딩해 반복 지정을 피한다:

```java
BoundValueOperations<String, Object> ops = redisTemplate.boundValueOps("user:1");
ops.set(user, Duration.ofHours(1));
User user = (User) ops.get();
ops.expire(Duration.ofMinutes(30));
```

### 5.3. StringRedisTemplate

String 전용 템플릿. `StringRedisSerializer`가 기본으로 설정되어 있어 별도 직렬화 설정 없이 사용 가능하다.

```java
@Autowired
StringRedisTemplate stringRedisTemplate;

stringRedisTemplate.opsForValue().set("name", "Alice");
String name = stringRedisTemplate.opsForValue().get("name");
```

## 6. 커넥션 풀 설정 (Lettuce + commons-pool2)

`commons-pool2`가 클래스패스에 있으면 자동 활성화된다.

```yaml
spring:
  data:
    redis:
      lettuce:
        pool:
          max-active: 8       # 최대 활성 커넥션 수. 기본값 8. -1 = 무제한
          max-idle: 8         # 최대 유휴 커넥션 수. 기본값 8
          min-idle: 0         # 최소 유휴 커넥션 수. 기본값 0
          max-wait: -1ms      # 커넥션 대기 최대 시간. -1 = 무제한
          time-between-eviction-runs: 60s  # 유휴 커넥션 정리 주기
```

## 7. LettuceConnectionFactory 고급 설정

자동 설정의 기본값 외에 안정적인 운영을 위해 직접 `LettuceConnectionFactory`를 빈으로 등록하는 것을 권장한다 (특히 Redis Cluster 환경).

```java
@Bean
public RedisConnectionFactory redisConnectionFactory() {

    // (1) 소켓 옵션
    SocketOptions socketOptions = SocketOptions.builder()
        .connectTimeout(Duration.ofMillis(100))
        .keepAlive(true)  // TCP Keep Alive: Java 11+, epoll NIO 필요
        .build();

    // (2) 클러스터 토폴로지 갱신 옵션
    ClusterTopologyRefreshOptions topologyRefreshOptions = ClusterTopologyRefreshOptions.builder()
        .dynamicRefreshSources(true)            // 모든 노드에서 토폴로지 정보 수집
        .enableAllAdaptiveRefreshTriggers()     // MOVED, ASK 등 이벤트 발생 시 즉시 갱신
        .enablePeriodicRefresh(Duration.ofSeconds(30))  // 주기적 갱신 (기본 60s)
        .build();

    // (3) 클러스터 클라이언트 옵션
    ClusterClientOptions clusterClientOptions = ClusterClientOptions.builder()
        .pingBeforeActivateConnection(true)     // 커넥션 사용 전 PING으로 유효성 검증
        .autoReconnect(true)
        .socketOptions(socketOptions)
        .topologyRefreshOptions(topologyRefreshOptions)
        .maxRedirects(3)                        // MOVED 응답 시 최대 리다이렉트 횟수
        .build();

    // (4) Lettuce 클라이언트 설정
    LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
        .commandTimeout(Duration.ofMillis(150)) // connectTimeout < commandTimeout 필수
        .clientOptions(clusterClientOptions)
        .build();

    RedisClusterConfiguration clusterConfig =
        new RedisClusterConfiguration(List.of("redis1:6379", "redis2:6379", "redis3:6379"));
    clusterConfig.setMaxRedirects(3);
    clusterConfig.setPassword("password");

    LettuceConnectionFactory factory = new LettuceConnectionFactory(clusterConfig, clientConfig);
    factory.setValidateConnection(false);  // (5) 매 명령마다 커넥션 검증 X (성능)
    return factory;
}
```

### 7.1. 각 설정 설명

**SocketOptions**

| 옵션 | 권장값 | 설명 |
| :--- | :--- | :--- |
| `connectTimeout` | 100ms | Redis 커넥션 생성 타임아웃. 짧게 설정해 장애 시 빠른 실패 유도 |
| `keepAlive` | true | TCP Keep Alive 활성화. 장시간 유휴 커넥션이 끊기지 않도록 유지. Java 11+ epoll 필요 |

**ClusterTopologyRefreshOptions**

| 옵션 | 권장값 | 설명 |
| :--- | :--- | :--- |
| `dynamicRefreshSources` | true (소규모) / false (대규모) | true: 모든 노드에 질의. false: seed 노드만 질의. 노드 수 많으면 false 권장 |
| `enableAllAdaptiveRefreshTriggers` | true | MOVED, ASK, RECONNECT 등 이벤트 발생 시 즉시 토폴로지 갱신 |
| `enablePeriodicRefresh` | 30s | 주기적 토폴로지 갱신. 노드 수 많으면 길게 설정 (갱신 자체가 부하) |

**ClusterClientOptions**

| 옵션 | 권장값 | 설명 |
| :--- | :--- | :--- |
| `pingBeforeActivateConnection` | true | 커넥션 활성화 전 PING으로 검증 |
| `autoReconnect` | true | 연결 끊어지면 자동 재접속 |
| `maxRedirects` | 3 | MOVED 응답 시 최대 리다이렉트 횟수. 클러스터 노드 수 이상으로 설정 권장 |

**LettuceClientConfiguration**

| 옵션 | 권장값 | 설명 |
| :--- | :--- | :--- |
| `commandTimeout` | 150ms | Redis 명령어 응답 타임아웃. Lettuce는 지연 연결을 사용하므로 connectTimeout보다 반드시 크게 설정 |

타임아웃을 너무 크게(1초 이상) 설정하면 Redis 장애 시 애플리케이션 스레드가 오래 블로킹되어 연쇄 장애로 이어질 수 있다. 짧은 타임아웃 + 빠른 실패가 시스템 전체를 보호한다.

### 7.2. 명령어별 동적 타임아웃 (DynamicTimeout)

`KEYS`, `FLUSHALL`, `INFO` 등 무거운 명령어와 일반 `GET`/`SET`에 서로 다른 타임아웃을 적용할 수 있다:

```java
public class DynamicCommandTimeout extends TimeoutOptions.TimeoutSource {

    private static final Set<ProtocolKeyword> META_COMMANDS = ImmutableSet.of(
        CommandType.FLUSHDB, CommandType.FLUSHALL,
        CommandType.CLUSTER, CommandType.INFO, CommandType.KEYS
    );

    private final Duration defaultTimeout;
    private final Duration metaTimeout;

    DynamicCommandTimeout(Duration defaultTimeout, Duration metaTimeout) {
        this.defaultTimeout = defaultTimeout;
        this.metaTimeout = metaTimeout;
    }

    @Override
    public long getTimeout(RedisCommand<?, ?, ?> command) {
        return META_COMMANDS.contains(command.getType())
            ? metaTimeout.toMillis()
            : defaultTimeout.toMillis();
    }
}

// 적용
TimeoutOptions timeoutOptions = TimeoutOptions.builder()
    .timeoutSource(new DynamicCommandTimeout(
        Duration.ofMillis(100),   // 일반 명령
        Duration.ofMillis(300)))  // 메타 명령
    .build();

ClusterClientOptions options = ClusterClientOptions.builder()
    .timeoutOptions(timeoutOptions)
    .build();
```

### 7.3. 장애 노드 필터링 (DynamicConnection)

장애 복구 중인 노드를 토폴로지에서 제외해 연결 시도를 방지한다:

```java
ClusterClientOptions clusterClientOptions = ClusterClientOptions.builder()
    .nodeFilter(node ->
        !(node.is(RedisClusterNode.NodeFlag.FAIL)
        || node.is(RedisClusterNode.NodeFlag.EVENTUAL_FAIL)
        || node.is(RedisClusterNode.NodeFlag.HANDSHAKE)
        || node.is(RedisClusterNode.NodeFlag.NOADDR)))
    .validateClusterNodeMembership(false)  // 장애 노드 검증 비활성화
    .build();
```

## 8. 클러스터 / Sentinel 설정

### 8.1. Redis Cluster

```java
@Bean
public RedisConnectionFactory redisConnectionFactory() {
    RedisClusterConfiguration config = new RedisClusterConfiguration(
        List.of("node1:6379", "node2:6379", "node3:6379")
    );
    config.setMaxRedirects(3);
    config.setPassword("password");
    return new LettuceConnectionFactory(config);
}
```

또는 `application.yml`:

```yaml
spring:
  data:
    redis:
      cluster:
        nodes: node1:6379,node2:6379,node3:6379
        max-redirects: 3
```

### 8.2. Redis Sentinel

```yaml
spring:
  data:
    redis:
      sentinel:
        master: mymaster
        nodes: sentinel1:26379,sentinel2:26379,sentinel3:26379
        password: sentinel-password
```

## 9. Spring Cache 연동

### 9.1. 설정

```java
@Configuration
@EnableCaching  // 메인 클래스가 아닌 별도 Config에 선언 권장
public class CacheConfig {

    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));
    }
}
```

캐시별 TTL 설정:

```java
@Bean
public RedisCacheManagerBuilderCustomizer cacheManagerCustomizer() {
    return builder -> builder
        .withCacheConfiguration("users",
            RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30)))
        .withCacheConfiguration("tokens",
            RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1)));
}
```

`application.yml`로 전역 설정:

```yaml
spring:
  cache:
    type: redis
    cache-names: users,tokens
    redis:
      time-to-live: 10m
      use-key-prefix: true    # 캐시 이름을 키 prefix로 사용 (키 충돌 방지, 기본 true)
      key-prefix: "myapp::"  # 커스텀 prefix
```

### 9.2. 사용

```java
@Service
public class UserService {

    @Cacheable("users")              // 결과 캐시
    public User findById(Long id) { ... }

    @CachePut(value = "users", key = "#user.id")  // 캐시 갱신
    public User update(User user) { ... }

    @CacheEvict("users")             // 캐시 삭제
    public void delete(Long id) { ... }

    @CacheEvict(value = "users", allEntries = true)  // 전체 삭제
    public void clearAll() { }
}
```

## 10. 주요 사용 사례

### 10.1. 세션 저장소

```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

```java
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
public class SessionConfig { }
```

### 10.2. Pub/Sub

```java
// 발행
@Autowired StringRedisTemplate template;
template.convertAndSend("channel:events", "message");

// 구독 (선언적)
@Component
public class EventListener {
    @RedisListener("channel:events")
    public void handle(String message) { ... }
}

// 구독 (프로그래밍)
@Bean
public RedisMessageListenerContainer listenerContainer(
        RedisConnectionFactory factory) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(factory);
    container.addMessageListener(
        (message, pattern) -> System.out.println(new String(message.getBody())),
        new ChannelTopic("channel:events")
    );
    return container;
}
```

### 10.3. 파이프라이닝

여러 명령을 일괄 전송해 왕복 지연을 줄인다.

```java
List<Object> results = redisTemplate.executePipelined(
    (RedisCallback<Object>) connection -> {
        for (int i = 0; i < 1000; i++) {
            connection.stringCommands().set(
                ("key:" + i).getBytes(), ("value:" + i).getBytes()
            );
        }
        return null;
    }
);
```

### 10.4. 분산 락

```java
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent("lock:order:123", "locked", Duration.ofSeconds(30));
if (Boolean.TRUE.equals(acquired)) {
    try {
        // 임계 구역
    } finally {
        redisTemplate.delete("lock:order:123");
    }
}
```

## 11. 성능 및 장애대응 설정 요약

| 항목 | 권장 설정 | 이유 |
| :--- | :--- | :--- |
| `connectTimeout` | 100ms | 장애 시 빠른 실패로 연쇄 장애 방지 |
| `commandTimeout` | 150ms | connectTimeout보다 크게. 장애 시 스레드 블로킹 최소화 |
| `keepAlive` | true | 유휴 커넥션 유지, 재연결 비용 절감 |
| `autoReconnect` | true | 네트워크 순단 후 자동 복구 |
| `pingBeforeActivateConnection` | true | 데드 커넥션 사전 제거 |
| `enableAllAdaptiveRefreshTriggers` | true | 클러스터 토폴로지 변경 즉시 반영 |
| `enablePeriodicRefresh` | 30s (소규모) / 60s+ (대규모) | 대규모 클러스터에서 갱신 트래픽 부하 주의 |
| `dynamicRefreshSources` | false (대규모) | 모든 노드 질의로 인한 부하 방지 |
| `validateConnection` | false | 매 명령 전 검증 생략, 성능 개선 |
| `max-active` (pool) | CPU 코어 수 × 2 수준 | [[hikari-datasource]]의 풀 사이즈 공식과 동일 원칙 |
| `leakDetectionThreshold` | — | Redis는 HikariCP와 달리 별도 누수 감지 미제공, 앱 레벨에서 관리 |

## 12. Lettuce vs Jedis 비교

| 항목 | Lettuce | Jedis |
| :--- | :--- | :--- |
| Spring Boot 기본 | ✅ | ✗ |
| 비동기 / Reactive | ✅ | ✗ |
| 클러스터 | ✅ 전체 지원 | ✅ 기본 지원 |
| Sentinel | ✅ 전체 지원 | Master Lookup만 |
| Master/Replica | ✅ | ✗ |
| 커넥션 공유 | 단일 커넥션 공유 (`shareNativeConnection=true`) | 커넥션 당 스레드 |
| 파이프라이닝 + 트랜잭션 | 동시 가능 | 상호 배타적 |
| 소켓 | TCP, Unix, epoll, kqueue | TCP만 |

---

## Sources
- `raw/java/spring/Redis Cluster를 사용할 때 Spring Boot와 Lettuce client를 설정해 드립니다  NHN Cloud Meetup.md`
- [Spring Boot Reference — Working with NoSQL Technologies](https://docs.spring.io/spring-boot/reference/data/nosql.html)
- [Spring Boot Reference — Caching](https://docs.spring.io/spring-boot/reference/io/caching.html)
- [Spring Data Redis Reference — Drivers (Lettuce/Jedis)](https://docs.spring.io/spring-data/redis/reference/redis/drivers.html)
- [Spring Data Redis Reference — RedisTemplate](https://docs.spring.io/spring-data/redis/reference/redis/template.html)
- [Spring Data Redis Reference — Redis Cluster](https://docs.spring.io/spring-data/redis/reference/redis/cluster.html)
- [Redis Cluster를 사용할 때 Spring Boot와 Lettuce client를 설정해 드립니다 — NHN Cloud Meetup](https://meetup.nhncloud.com/posts/379)

---

## Related pages
- [[hikari-datasource]]
- [[hikari-deadlock]]
- [[multi-datasource]]
- [[externalized-configuration]]
- [[jpa-transaction]]
