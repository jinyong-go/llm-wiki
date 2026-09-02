---
title: "Spring Events (Baeldung)"
source: "https://www.baeldung.com/spring-events"
author:
  - "[[Eugen Paraschiv]]"
published: 2014-11-10
created: 2026-07-10
description: "The Basics of Events in Spring - create a simple, custom Event, publish it and handle it in a listener."
tags:
  - "clippings"
---
## 1\. Overview

In this tutorial, we’ll be discussing **how to use events in Spring.**

Events are one of the most overlooked functionalities in the framework, although they’re also among the most useful. And like many other things in Spring, event publishing is one of the capabilities provided by *ApplicationContext*.

There are a few simple guidelines to follow:

- The event class should extend *ApplicationEvent* if we’re using versions before Spring Framework 4.2. [As of the 4.2 version](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationEventPublisher.html#publishEvent-java.lang.Object-), the event classes no longer need to extend the *ApplicationEvent* class.
- The publisher should inject an *ApplicationEventPublisher* object.
- The listener should implement the *ApplicationListener* interface.

## 2\. A Custom Event

Spring allows us to create and publish custom events that by default **are synchronous.** This has a few advantages, such as the listener being able to participate in the publisher’s transaction context.

### 2.1. A Simple Application Event

Let’s create **a simple event class** — just a placeholder to store the event data.

In this case, the event class holds a String message:

```java
public class CustomSpringEvent extends ApplicationEvent {
    private String message;

    public CustomSpringEvent(Object source, String message) {
        super(source);
        this.message = message;
    }
    public String getMessage() {
        return message;
    }
}
```

### 2.2. A Publisher

Now let’s create **a publisher of that event.** The publisher constructs the event object and publishes it to anyone who’s listening.

To publish the event, the publisher can simply inject the *ApplicationEventPublisher* and use the *publishEvent()* API:

```java
@Component
public class CustomSpringEventPublisher {
    @Autowired
    private ApplicationEventPublisher applicationEventPublisher;

    public void publishCustomEvent(final String message) {
        System.out.println("Publishing custom event. ");
        CustomSpringEvent customSpringEvent = new CustomSpringEvent(this, message);
        applicationEventPublisher.publishEvent(customSpringEvent);
    }
}
```

Alternatively, the publisher class can implement the *ApplicationEventPublisherAware* interface, and this will also inject the event publisher on the application startup. Usually, it’s simpler to just inject the publisher with *@Autowire*.

As of Spring Framework 4.2, the *ApplicationEventPublisher* interface provides a new overload for the *[publishEvent(Object event)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationEventPublisher.html#publishEvent-java.lang.Object-)* method that accepts any object as the event. **Therefore, Spring events no longer need to extend the *ApplicationEvent* class.**

### 2.3. A Listener

Finally, let’s create the listener.

The only requirement for the listener is to be a bean and implement *ApplicationListener* interface:

```java
@Component
public class CustomSpringEventListener implements ApplicationListener<CustomSpringEvent> {
    @Override
    public void onApplicationEvent(CustomSpringEvent event) {
        System.out.println("Received spring custom event - " + event.getMessage());
    }
}
```

Notice how our custom listener is parametrized with the generic type of custom event, which makes the *onApplicationEvent()* method type-safe. This also avoids having to check if the object is an instance of a specific event class and casting it.

And, as already discussed (by default **Spring events are synchronous**), the *publishCustomEvent()* method blocks until all listeners finish processing the event.

## 3\. Creating Asynchronous Events

In some cases, publishing events synchronously isn’t really what we’re looking for — **we may need async handling of our events.**

### 3.1. Using an ApplicationEventMulticaster

We can turn asynchronous event handling on in the configuration by creating an *ApplicationEventMulticaster* bean with an executor.

For our purposes here, *SimpleAsyncTaskExecutor* works well:

```java
@Configuration
public class AsynchronousSpringEventsConfig {
    @Bean(name = "applicationEventMulticaster")
    public ApplicationEventMulticaster simpleApplicationEventMulticaster() {
        SimpleApplicationEventMulticaster eventMulticaster =
          new SimpleApplicationEventMulticaster();
        
        eventMulticaster.setTaskExecutor(new SimpleAsyncTaskExecutor());
        return eventMulticaster;
    }
}
```

The event, publisher, and listener implementations remain the same as before, but now **the listener will asynchronously deal with the event in a separate thread**.

However, there are times when we can’t use the multicaster or otherwise prefer to have some events operate asynchronously and not others.

### 3.2. Using @Async

To this end, we can add Spring’s *@Async* annotation to identify and annotate individual listeners that should process events asynchronously:

```java
@EventListener
@Async
public void handleAsyncEvent(CustomSpringEvent event) {
    System.out.println("Handle event asynchronously: " + event.getMessage());
}
```

This processes an event in a separate thread. Furthermore, we can use the *value* attribute of the *@Async* annotation to indicate that an executor other than the default should be used, for example:

```java
@Async("nonDefaultExecutor")
void handleAsyncEvent(CustomSpringEvent event) {
    // run asynchronously by "nonDefaultExecutor"
}
```

To enable support for *@Async* annotations, we can [add *@EnableAsync*](https://www.baeldung.com/spring-async) to a *@Configuration* or *@SpringBootApplication* class:

```java
@Configuration
 @EnableAsync
 public class AppConfig {
}
```

The *@EnableAsync* annotation switches on Spring’s ability to run *@Async* methods in a background thread pool. It also customizes the used *Executor*. Spring searches for an associated thread pool definition. It looks for either:

- a unique *TaskExecutor* bean in the context, or
- an *Executor* bean named “ *taskExecutor* “

If it doesn’t find either, a *SimpleAsyncTaskExecutor* will be used to invoke event listeners asynchronously.

## 4\. Existing Framework Events

Spring itself publishes a variety of events out of the box. For example, the *ApplicationContext* will fire various framework events: *ContextRefreshedEvent*, *ContextStartedEvent*, *RequestHandledEvent* etc.

These events provide application developers an option to hook into the life cycle of the application and the context and add in their own custom logic where needed.

Here’s a quick example of a listener listening for context refreshes:

```java
public class ContextRefreshedListener 
  implements ApplicationListener<ContextRefreshedEvent> {
    @Override
    public void onApplicationEvent(ContextRefreshedEvent cse) {
        System.out.println("Handling context re-freshed event. ");
    }
}
```

To learn more about existing framework events, have a look at [our next tutorial here](https://www.baeldung.com/spring-context-events).

## 5\. Annotation-Driven Event Listener

Starting with Spring 4.2, an event listener is not required to be a bean implementing the *ApplicationListener* interface — it can be registered on any *public* method of a managed bean via the *@EventListener* annotation:

```java
@Component
public class AnnotationDrivenEventListener {
    @EventListener
    public void handleContextStart(ContextStartedEvent cse) {
        System.out.println("Handling context started event.");
    }
}
```

As before, the method signature declares the event type it consumes.

By default, the listener is invoked synchronously. However, we can easily make it asynchronous by adding an *@Async* annotation. We just need to remember to [*EnableAsync* support](https://www.baeldung.com/spring-async#enable-async-support) in the application.

## 6\. Generics Support

It is also possible to dispatch events with generics information in the event type.

### 6.1. A Generic Application Event

**Let’s create a generic event type.**

In our example, the event class holds any content and a *success* status indicator:

```java
public class GenericSpringEvent<T> {
    private T what;
    protected boolean success;

    public GenericSpringEvent(T what, boolean success) {
        this.what = what;
        this.success = success;
    }
    // ... standard getters
}
```

Notice the difference between *GenericSpringEvent* and *CustomSpringEvent*. We now have the flexibility to publish any arbitrary event and it’s not required to extend from *ApplicationEvent* anymore.

### 6.2. A Listener

Now let’s create **a listener of that event.**

We could define the listener by implementing the *ApplicationListener* interface like before:

```java
@Component
public class GenericSpringEventListener 
  implements ApplicationListener<GenericSpringEvent<String>> {
    @Override
    public void onApplicationEvent(@NonNull GenericSpringEvent<String> event) {
        System.out.println("Received spring generic event - " + event.getWhat());
    }
}
```

But this definition unfortunately requires us to inherit *GenericSpringEvent* from the *ApplicationEvent* class. So for this tutorial, let’s make use of an annotation-driven event listener discussed [previously](#annotation-driven).

It is also possible to **make the event listener conditional** by defining a boolean SpEL expression on the *@EventListener* annotation.

In this case, the event handler will only be invoked for a successful *GenericSpringEvent* of *String*:

```java
@Component
public class AnnotationDrivenEventListener {
    @EventListener(condition = "#event.success")
    public void handleSuccessful(GenericSpringEvent<String> event) {
        System.out.println("Handling generic event (conditional).");
    }
}
```

The [Spring Expression Language (SpEL)](https://www.baeldung.com/spring-expression-language) is a powerful expression language that’s covered in detail in another tutorial.

### 6.3. A Publisher

The event publisher is similar to the one described [above](#publisher). But due to type erasure, we need to publish an event that resolves the generics parameter we would filter on, for example, *class GenericStringSpringEvent extends GenericSpringEvent\<String>*.

Also, there’s **an alternative way of publishing events.** If we return a non-null value from a method annotated with *@EventListener* as the result, Spring Framework will send that result as a new event for us. Moreover, we can publish multiple new events by returning them in a collection as the result of event processing.

## 7\. Transaction-Bound Events

This section is about using the *@TransactionalEventListener* annotation. To learn more about transaction management, check out [Transactions With Spring and JPA](https://www.baeldung.com/transaction-configuration-with-jpa-and-spring).

Since Spring 4.2, the framework provides a new *@TransactionalEventListener* annotation, which is an extension of *@EventListener*, that allows binding the listener of an event to a phase of the transaction.

Binding is possible to one of four transaction phases:

- *AFTER\_COMMIT* (default) – used to fire the event if the transaction has **completed successfully**
- *AFTER\_ROLLBACK* – if the transaction has **rolled back**
- *AFTER\_COMPLETION* – if the transaction has **completed** (an alias for *AFTER\_COMMIT* and *AFTER\_ROLLBACK*)
- *BEFORE\_COMMIT* – used to fire the event right **before** transaction **commit**

By default, this listener will be invoked only when *CustomSpringEvent* was published within a transaction that has now completed:

```java
@TransactionalEventListener
public void handleCustom(CustomSpringEvent event) {
    System.out.println("Handling event only when a transaction successfully completes.");
}
```

It’s essential to understand that, **unlike regular *@EventListener* methods, @ *TransactionalEventListener* doesn’t dispatch event processing through *ApplicationEventMulticaster.*** Instead, *@TransactionalEventListener* registers a transaction synchronization callback via [*TransactionSynchronizationManager#registerSynchronization*](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionSynchronizationManager.html#registerSynchronization\(org.springframework.transaction.support.TransactionSynchronization\)), allowing the event to be handled at a specified transaction phase.

As a result, **by default, *@TransactionalEventListener* methods are executed in the same thread that publishes the event**, regardless of which *TaskExecutor* is applied in the multicaster, as the multicaster is simply not used.

This leads to a common question: How can we make *@TransactionalEventListener* process the event asynchronously?

The answer is to use the *@Async* annotation, for example:

```java
@Async
@TransactionalEventListener
void handleCustom(CustomSpringEvent event) { 
    System.out.println("Handling event only when a transaction successfully completes.");
}
```

In the above example, we combined *@Async* and *@TransactionalEventListener* annotations. In this way, **the *handleCustom()* method will run in a separate thread asynchronously when the original transaction has completed successfully**.

While this is a convenient way to handle transactional events asynchronously, it’s important to use it with caution. **Spring binds transactions to the current thread**. When the listener runs in a separate thread (due to *@Async*), it cannot access the original transactional context. That means **we should not use *@Async + @TransactionalEventListener* if our event handler relies on the original transaction’s context,** such as lazy-loaded entities, shared database state, or transactional rollback logic.

Of course, when we use *@Async*, let’s remember to add *@EnableAsync* support.

## 8\. Conclusion

In this quick article, we went over the basics of **dealing with events in Spring**, including creating a simple custom event, publishing it and then handling it in a listener. We also had a brief look at how to enable the asynchronous processing of events in the configuration.

Then we learned about improvements introduced in Spring 4.2, such as annotation-driven listeners, better generics support, and events binding to transaction phases.

The code backing this article is available on GitHub. Once you're **logged in as a [Baeldung Pro Member](https://www.baeldung.com/members/)**, start learning and coding on the project.