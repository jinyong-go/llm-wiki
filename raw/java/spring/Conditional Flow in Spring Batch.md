---
title: "Conditional Flow in Spring Batch"
source: "https://www.baeldung.com/spring-batch-conditional-flow"
author:
  - "[[baeldung]]"
published: 2020-04-06
created: 2026-06-29
description: "Learn how to create Spring Batch jobs with conditional flow."
tags:
  - "clippings"
---
## 1\. Introduction

We use [Spring Batch](https://www.baeldung.com/introduction-to-spring-batch) to compose jobs from multiple steps that read, transform, and write data. If the steps in a job have multiple paths, similar to using an *if* statement in our code, we say that the job flow is *conditional*.

In this tutorial, we’ll look at two ways to create Spring Batch jobs with a conditional flow.

## 2\. Exit Status and Batch Status

When we specify a conditional step with Spring’s Batch framework, we’re using the exit status of a step or job. Therefore, we need to understand the difference between Batch Status and Exit Status in our steps and jobs:

- ***BatchStatus* is an Enum representing the status of a step/job and is used by the Batch framework internally**
- Possible values are: *ABANDONED, COMPLETED, FAILED, STARTED, STARTING, STOPPED, STOPPING, UNKNOWN*
- ***ExitStatus* is the status of a step when execution is completed and is used to conditionally determine the flow**

By default, the *ExitStatus* of a step or job is the same as its *BatchStatus*. We can also set a custom *ExitStatus* to drive flow.

## 3\. Conditional Flow

Let’s say we have an IOT device that sends us measurements. Our device measurements are arrays of integers, and we need to send notifications if any of our measurements contain positive integers.

In other words, we need to send a notification when we detect a positive measurement.

### 3.1. ExitStatus

Importantly, **we use the exit status of a step to drive conditional flow**.

**To set the exit status of a step, we need to use the *StepExecution* object’s *setExitStatus* method.** In order to do that, we need to create an *ItemProcessor* that extends *ItemListenerSupport* and gets the step’s *StepExecution*.

We use this to set our step’s exit status to *NOTIFY* when we find a positive number. **When we determine our exit status based on data within the batch job, we can use an *ItemProcessor*.**

Let’s look at our *NumberInfoClassifier* to see the three methods we need:

```java
public class NumberInfoClassifier extends ItemListenerSupport<NumberInfo, Integer>
  implements ItemProcessor<NumberInfo, Integer> {
 
    private StepExecution stepExecution;

    @BeforeStep
    public void beforeStep(StepExecution stepExecution) {
        this.stepExecution = stepExecution;
        this.stepExecution.setExitStatus(new ExitStatus(QUIET));
    }

    @Override
    public Integer process(NumberInfo numberInfo) throws Exception {
        return Integer.valueOf(numberInfo.getNumber());
    }

    @Override
    public void afterProcess(NumberInfo item, Integer result) {
        super.afterProcess(item, result);
        if (item.isPositive()) {
            stepExecution.setExitStatus(new ExitStatus(NOTIFY));
        }
    }
}
```

Note: we use the *ItemProcessor* to set the *ExitStatus* in this example, but we could just as easily do it in our step’s *ItemReader* or *ItemWriter*.

Finally, when we create our job, we tell our *JobBuilder* to send notifications for any step that exits with a status of *NOTIFY*:

```java
new JobBuilder("Number generator - second dataset", jobRepository)
    .start(dataProviderStep)
    .on("NOTIFY").to(notificationStep)
    .end()
    .build();
```

Also note that when we have additional conditional branches and multiple exit codes, we can add them to our job with the *from* and *on* methods of the *JobBuilder*:

```java
new JobBuilder("Number generator - second dataset", jobRepository)
    .start(dataProviderStep)
    .on("NOTIFY").to(notificationStep)
    .from(step).on("LOG_ERROR").to(errorLoggingStep)
    .end()
    .build();
```

Now, any time our *ItemProcessor* sees a positive number, it will direct our job to run the *notificationStep*, which simply prints a message to *System.out*:

```bash
Second Dataset Processor 11
Second Dataset Processor -2
Second Dataset Processor -3
[Number generator - second dataset] contains interesting data!!
```

If we had a data set without a positive number, we would not see our *notificationStep* message:

```bash
Second Dataset Processor -1
Second Dataset Processor -2
Second Dataset Processor -3
```

### 3.2. Programmatic Branching With JobExecutionDecider

Alternatively, we can use a class that implements *JobExecutionDecider* to determine job flow. This is especially useful **if we have external factors for determining execution flow**.

To use this method, we first need to modify our *ItemProcessor* to remove the *ItemListenerSupport* interface and *@BeforeStep* method:

```java
public class NumberInfoClassifierWithDecider extends ItemListenerSupport<NumberInfo, Integer>
  implements ItemProcessor<NumberInfo, Integer> {

    @Override
    public Integer process(NumberInfo numberInfo) throws Exception {
        return Integer.valueOf(numberInfo.getNumber());
    }
}
```

Next, we create a decider class that determines the notification status of our step:

```java
public class NumberInfoDecider implements JobExecutionDecider {

    private boolean shouldNotify() {
        return true;
    }

    @Override
    public FlowExecutionStatus decide(JobExecution jobExecution, StepExecution stepExecution) {
        if (shouldNotify()) {
            return new FlowExecutionStatus(NOTIFY);
        } else {
            return new FlowExecutionStatus(QUIET);
        }
    }
}
```

Then, we set up our *Job* to use the decider in the flow:

```java
new JobBuilder("Number generator - third dataset", jobRepository)
    .start(dataProviderStep)
    .next(new NumberInfoDecider()).on("NOTIFY").to(notificationStep)
    .end()
    .build();
```

## 4\. Conclusion

In this quick tutorial, we explored two options for implementing conditional flows with Spring Batch. First, we looked at how to use the *ExitStatus* to control the flow of our job.

Then we took a look at how we can control flow programmatically by defining our own *JobExecutionDecider*.

The code backing this article is available on GitHub. Once you're **logged in as a [Baeldung Pro Member](https://www.baeldung.com/members/)**, start learning and coding on the project.