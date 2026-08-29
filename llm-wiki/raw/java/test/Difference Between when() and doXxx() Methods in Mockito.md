---
title: "Difference Between when() and doXxx() Methods in Mockito"
source: "https://www.baeldung.com/java-mockito-when-vs-do"
author:
  - "[[Attila Fejér]]"
published: 2020-09-09
created: 2026-07-01
description: "Learn the advantages and disadvantages of the configuring a mock object the when().thenXxx() or the doXxx().when() way."
tags:
  - "clippings"
---
## 1\. Introduction

[Mockito](https://www.baeldung.com/mockito-series) is a popular Java mocking framework. With it, it’s simple to [create mock objects](https://www.baeldung.com/mockito-mock-methods), [configure mock behavior](https://www.baeldung.com/mockito-behavior), [capture method arguments](https://www.baeldung.com/mockito-argument-matchers), and [verify interactions with mocks](https://www.baeldung.com/mockito-verify).

**Now, we’ll focus on specifying mock behavior. We have two ways to do that: the *when().thenDoSomething()* and the *doSomething().when()* syntax.**

In this short tutorial, we’ll see why we have both of them.

## 2\. when() Method

Let’s consider the following *Employee* interface:

```java
interface Employee {
    String greet();
    void work(DayOfWeek day);
}
```

In our tests, we use a mock of this interface. Let’s say we want to configure the mock’s *greet()* method to return the string *“Hello”*. It’s straightforward to do so using Mockito’s *when()* method:

```java
@Test
void givenNonVoidMethod_callingWhen_shouldConfigureBehavior() {
    // given
    when(employee.greet()).thenReturn("Hello");

    // when
    String greeting = employee.greet();

    // then
    assertThat(greeting, is("Hello"));
}
```

What happens? The *employee* object is a mock. **When we call any of its methods, Mockito registers that call. With the call of the *when()* method, Mockito knows that this invocation wasn’t an interaction by the business logic. It was a statement that we want to assign some behavior to the mock object. After that, with one of the *thenXxx()* methods, we specify the expected behavior.**

Until this point, it’s good old mocking. Likewise, we want to configure the *work()* method to throw an exception, when we call it with an argument of Sunday:

```java
@Test
void givenVoidMethod_callingWhen_wontCompile() {
    // given
    when(employee.work(DayOfWeek.SUNDAY)).thenThrow(new IAmOnHolidayException());

    // when
    Executable workCall = () -> employee.work(DayOfWeek.SUNDAY);

    // then
    assertThrows(IAmOnHolidayException.class, workCall);
}
```

**Unfortunately, this code won’t compile, because in the *work(employee.work(…))* call, the *work()* method has a *void* return type; hence we cannot wrap it into another method call.** Does it mean that we can’t mock void methods? Of course, we can. *doXxx* methods to the rescue!

## 3\. doXxx() Methods

Let’s see how we can configure the exception throwing with the *doThrow()* method:

```java
@Test
void givenVoidMethod_callingDoThrow_shouldConfigureBehavior() {
    // given
    doThrow(new IAmOnHolidayException()).when(employee).work(DayOfWeek.SUNDAY);

    // when
    Executable workCall = () -> employee.work(DayOfWeek.SUNDAY);

    // then
    assertThrows(IAmOnHolidayException.class, workCall);
}
```

This syntax is slightly different than the previous one: we don’t try to wrap a *void* method call inside another method call. Therefore, this code compiles.

Let’s see what just happened. **First, we stated that we want to throw an exception. Next, we called the *when()* method, and we passed the mock object. After that, we specified which mock interaction’s behavior we want to configure.**

Note that this isn’t the same *when()* method we used before. Also, note that we chained the mock interaction after the invocation of *when().* Meanwhile, we defined it inside the parentheses with the first syntax.

Why do we have the first *when().thenXxx()*, when it isn’t capable of such a common task, as configuring a *void* invocation? It has multiple advantages to the *doXxx().when()* syntax.

First, **it’s more logical for developers to write and read statements like “when some interaction, then do something” than “do something, when some interaction”.**

Second, we can add multiple behaviors to the same interaction with chaining. That’s because *when()* returns an instance of the class [*OngoingStubbing\<T>*](https://javadoc.io/static/org.mockito/mockito-core/3.5.10/org/mockito/stubbing/OngoingStubbing.html), which’s *thenXxx()* methods return the same type.

On the other hand, *doXxx()* methods return a *[Stubber](https://javadoc.io/static/org.mockito/mockito-core/3.5.10/org/mockito/stubbing/Stubber.html)* instance, and *Stubber.when(T mock)* returns *T*, so we can specify what kind of method invocation we want to configure. But *T* is part of our application, for example, *Employee* in our code snippets. But *T* won’t return a Mockito class, so we won’t be able to add multiple behaviors with chaining.

## 4\. BDDMockito

[BDDMockito](https://www.baeldung.com/bdd-mockito) uses an alternative syntax to those which we covered. It’s pretty simple: in our mock configurations, we have to replace the keyword “ *when”* to “ *given* ” and the keyword “ *do* ” to “ *will* “. Other than that, our code remains the same:

```java
@Test
void givenNonVoidMethod_callingGiven_shouldConfigureBehavior() {
    // given
    given(employee.greet()).willReturn("Hello");

    // when
    String greeting = employee.greet();

    // then
    assertThat(greeting, is("Hello"));
}

@Test
void givenVoidMethod_callingWillThrow_shouldConfigureBehavior() {
    // given
    willThrow(new IAmOnHolidayException()).given(employee).work(DayOfWeek.SUNDAY);

    // when
    Executable workCall = () -> employee.work(DayOfWeek.SUNDAY);

    // then
    assertThrows(IAmOnHolidayException.class, workCall);
}
```

## 5\. Conclusion

We saw the advantages and disadvantages of the configuring a mock object the *when().thenXxx()* or the *doXxx().when()* way. Also, we saw how these syntaxes work and why we have both.

The code backing this article is available on GitHub. Once you're **logged in as a [Baeldung Pro Member](https://www.baeldung.com/members/)**, start learning and coding on the project.