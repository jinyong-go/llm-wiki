---
title: "Testing a Spring Batch Job"
source: "https://www.baeldung.com/spring-batch-testing-job"
author:
  - "[[baeldung]]"
published: 2019-10-28
created: 2026-06-29
description: "Explore various approaches to test a Spring Batch job."
tags:
  - "clippings"
---
## 1\. Introduction

Unlike other Spring-based applications, testing batch jobs comes with some specific challenges, mostly due to the asynchronous nature of how jobs are executed.

In this tutorial, we’re going to explore the various alternatives for testing a [Spring Batch](https://www.baeldung.com/introduction-to-spring-batch) job.

## 2\. Required Dependencies

**We’re using [*spring-boot-starter-batch*](https://mvnrepository.com/search?q=spring-boot-starter-batch)**, so first let’s set up the required dependencies in our *pom.xml*:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-batch</artifactId>
    <version>3.3.2</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <version>3.3.2</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.batch</groupId>
    <artifactId>spring-batch-test</artifactId>
    <version>3.3.2.RELEASE</version>
    <scope>test</scope>
</dependency>
```

**We included the [*spring-boo* *t-starter-test*](https://mvnrepository.com/search?q=spring-boot-starter-test) and *[spring-batch-test](https://mvnrepository.com/search?q=spring-batch-test)*** which bring in some necessary helper methods, listeners and runners for testing Spring Batch applications.

## 3\. Defining the Spring Batch Job

Let’s create a simple application to show how Spring Batch solves some of the testing challenges.

**Our application uses a two-step *Job* that reads a CSV input file with structured book information and outputs books and book details.**

### 3.1. Defining the Job Steps

The two subsequent *Step* s extract specific information from *BookRecord* s and then map these to *Book* s (step1) and *BookDetail* s (step2):

```java
@Bean
public Step step1(
  ItemReader<BookRecord> csvItemReader, ItemWriter<Book> jsonItemWriter) throws IOException {
    return stepBuilderFactory
      .get("step1")
      .<BookRecord, Book> chunk(3)
      .reader(csvItemReader)
      .processor(bookItemProcessor())
      .writer(jsonItemWriter)
      .build();
}

@Bean
public Step step2(
  ItemReader<BookRecord> csvItemReader, ItemWriter<BookDetails> listItemWriter) {
    return stepBuilderFactory
      .get("step2")
      .<BookRecord, BookDetails> chunk(3)
      .reader(csvItemReader)
      .processor(bookDetailsItemProcessor())
      .writer(listItemWriter)
      .build();
}
```

### 3.2. Defining the Input Reader and Output Writer

Let’s now **configure the CSV file input reader using a *FlatFileItemReader*** to de-serialize the structured book information into *BookRecord* objects:

```java
private static final String[] TOKENS = { 
  "bookname", "bookauthor", "bookformat", "isbn", "publishyear" };

@Bean
@StepScope
public FlatFileItemReader<BookRecord> csvItemReader(
  @Value("#{jobParameters['file.input']}") String input) {
    FlatFileItemReaderBuilder<BookRecord> builder = new FlatFileItemReaderBuilder<>();
    FieldSetMapper<BookRecord> bookRecordFieldSetMapper = new BookRecordFieldSetMapper();
    return builder
      .name("bookRecordItemReader")
      .resource(new FileSystemResource(input))
      .delimited()
      .names(TOKENS)
      .fieldSetMapper(bookRecordFieldSetMapper)
      .build();
}
```

There are a couple of important things in this definition, which will have implications on the way we test.

First of all, **we annotated the *FlatItemReader* bean with** ***@StepScope**,* and as a result, **this object will share its lifetime with** ***StepExecution**.*

**This also allows us to inject dynamic values at runtime so that we can pass our input file from the *JobParameter* s in line 4**. In contrast, the tokens used for the *BookRecordFieldSetMapper* are configured at compile-time.

We then similarly define the *JsonFileItemWriter* output writer:

```java
@Bean
@StepScope
public JsonFileItemWriter<Book> jsonItemWriter(
  @Value("#{jobParameters['file.output']}") String output) throws IOException {
    JsonFileItemWriterBuilder<Book> builder = new JsonFileItemWriterBuilder<>();
    JacksonJsonObjectMarshaller<Book> marshaller = new JacksonJsonObjectMarshaller<>();
    return builder
      .name("bookItemWriter")
      .jsonObjectMarshaller(marshaller)
      .resource(new FileSystemResource(output))
      .build();
}
```

For the second *Step*, we use a Spring Batch-provided *ListItemWriter* that just dumps stuff to an in-memory list.

### 3.3. Defining the Custom JobLauncher

Next, let’s disable the default *Job* launching configuration of Spring Boot Batch by setting *spring.batch.job.enabled=false* in our *application.properties.*

**We configure our own *JobLauncher* to pass a custom *JobParameters* instance when launching the *Job*:**

```java
@SpringBootApplication
public class SpringBatchApplication implements CommandLineRunner {

    // autowired jobLauncher and transformBooksRecordsJob

    @Value("${file.input}")
    private String input;

    @Value("${file.output}")
    private String output;

    @Override
    public void run(String... args) throws Exception {
        JobParametersBuilder paramsBuilder = new JobParametersBuilder();
        paramsBuilder.addString("file.input", input);
        paramsBuilder.addString("file.output", output);
        jobLauncher.run(transformBooksRecordsJob, paramsBuilder.toJobParameters());
   }

   // other methods (main etc.)
}
```

## 4\. Testing the Spring Batch Job

The *spring-batch-test* dependency provides a set of useful helper methods and listeners that can be used to configure the Spring Batch context during testing.

Let’s create a basic structure for our test:

```java
@RunWith(SpringRunner.class)
@SpringBatchTest
@EnableAutoConfiguration
@ContextConfiguration(classes = { SpringBatchConfiguration.class })
@TestExecutionListeners({ DependencyInjectionTestExecutionListener.class, 
  DirtiesContextTestExecutionListener.class})
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
public class SpringBatchIntegrationTest {

    // other test constants
 
    @Autowired
    private JobLauncherTestUtils jobLauncherTestUtils;
  
    @Autowired
    private JobRepositoryTestUtils jobRepositoryTestUtils;
  
    @After
    public void cleanUp() {
        jobRepositoryTestUtils.removeJobExecutions();
    }

    private JobParameters defaultJobParameters() {
        JobParametersBuilder paramsBuilder = new JobParametersBuilder();
        paramsBuilder.addString("file.input", TEST_INPUT);
        paramsBuilder.addString("file.output", TEST_OUTPUT);
        return paramsBuilder.toJobParameters();
   }
```

**The *@SpringBatchTest* annotation provides the *JobLauncherTestUtils* and *JobRepositoryTestUtils* helper classes.** We use them to trigger the *Job* and *Step* s in our tests.

Our application uses **[Spring Boot auto-configuration](https://www.baeldung.com/spring-boot-annotations), which enables a default in-memory *JobRepository*.** As a result, **running multiple tests in the same class requires a cleanup step after each test run**.

Finally, **if we want to run multiple tests from several test classes, we need to mark our [context as dirty](https://www.baeldung.com/spring-dirtiescontext)**. This is required to avoid the clashing of several *JobRepository* instances using the same data source.

### 4.1. Testing the End-To-End Job

The first thing we’ll test is a complete end-to-end *Job* with a small data-set input.

We can then compare the results with an expected test output:

```java
@Test
public void givenReferenceOutput_whenJobExecuted_thenSuccess() throws Exception {
    // given
    FileSystemResource expectedResult = new FileSystemResource(EXPECTED_OUTPUT);
    FileSystemResource actualResult = new FileSystemResource(TEST_OUTPUT);

    // when
    JobExecution jobExecution = jobLauncherTestUtils.launchJob(defaultJobParameters());
    JobInstance actualJobInstance = jobExecution.getJobInstance();
    ExitStatus actualJobExitStatus = jobExecution.getExitStatus();
  
    // then
    assertThat(actualJobInstance.getJobName(), is("transformBooksRecords"));
    assertThat(actualJobExitStatus.getExitCode(), is("COMPLETED"));
    AssertFile.assertFileEquals(expectedResult, actualResult);
}
```

Spring Batch Test provides a useful **file comparison method for verifying outputs using the *AssertFile* class**.

### 4.2. Testing Individual Steps

Sometimes it’s quite expensive to test the complete *Job* end-to-end and so it makes sense to test individual *Steps* instead:

```java
@Test
public void givenReferenceOutput_whenStep1Executed_thenSuccess() throws Exception {
    // given
    FileSystemResource expectedResult = new FileSystemResource(EXPECTED_OUTPUT);
    FileSystemResource actualResult = new FileSystemResource(TEST_OUTPUT);

    // when
    JobExecution jobExecution = jobLauncherTestUtils.launchStep(
      "step1", defaultJobParameters()); 
    Collection actualStepExecutions = jobExecution.getStepExecutions();
    ExitStatus actualJobExitStatus = jobExecution.getExitStatus();

    // then
    assertThat(actualStepExecutions.size(), is(1));
    assertThat(actualJobExitStatus.getExitCode(), is("COMPLETED"));
    AssertFile.assertFileEquals(expectedResult, actualResult);
}

@Test
public void whenStep2Executed_thenSuccess() {
    // when
    JobExecution jobExecution = jobLauncherTestUtils.launchStep(
      "step2", defaultJobParameters());
    Collection actualStepExecutions = jobExecution.getStepExecutions();
    ExitStatus actualExitStatus = jobExecution.getExitStatus();

    // then
    assertThat(actualStepExecutions.size(), is(1));
    assertThat(actualExitStatus.getExitCode(), is("COMPLETED"));
    actualStepExecutions.forEach(stepExecution -> {
        assertThat(stepExecution.getWriteCount(), is(8));
    });
}
```

Notice that **we use the *launchStep* method to trigger specific steps**.

Remember that **we also designed our *ItemReader* and *ItemWriter* to use dynamic values at runtime**, which means **we can pass our I/O parameters to the *JobExecution*** (lines 9 and 23).

For the first *Step* test, we compare the actual output with an expected output.

On the other hand, **in the second test, we verify the *StepExecution* for the expected written items**.

### 4.3. Testing Step-scoped Components

Let’s now test the *FlatFileItemReader**.* **Recall that we exposed it as *@StepScope* bean, so we’ll want to use Spring Batch’s dedicated support for this**:

```java
// previously autowired itemReader

@Test
public void givenMockedStep_whenReaderCalled_thenSuccess() throws Exception {
    // given
    StepExecution stepExecution = MetaDataInstanceFactory
      .createStepExecution(defaultJobParameters());

    // when
    StepScopeTestUtils.doInStepScope(stepExecution, () -> {
        BookRecord bookRecord;
        itemReader.open(stepExecution.getExecutionContext());
        while ((bookRecord = itemReader.read()) != null) {

            // then
            assertThat(bookRecord.getBookName(), is("Foundation"));
            assertThat(bookRecord.getBookAuthor(), is("Asimov I."));
            assertThat(bookRecord.getBookISBN(), is("ISBN 12839"));
            assertThat(bookRecord.getBookFormat(), is("hardcover"));
            assertThat(bookRecord.getPublishingYear(), is("2018"));
        }
        itemReader.close();
        return null;
    });
}
```

**The *MetadataInstanceFactory* creates a custom *StepExecution* that is needed to inject our Step-scoped *ItemReader.***

Because of this, **we can check the behavior of the reader with the help of the *doInTestScope* method.**

<iframe src="https://static.btloader.com/safeFrame.html?upapi=true"></iframe>

AD

Next, let’s test the *JsonFileItemWriter* and verify its output:

```java
@Test
public void givenMockedStep_whenWriterCalled_thenSuccess() throws Exception {
    // given
    FileSystemResource expectedResult = new FileSystemResource(EXPECTED_OUTPUT_ONE);
    FileSystemResource actualResult = new FileSystemResource(TEST_OUTPUT);
    Book demoBook = new Book();
    demoBook.setAuthor("Grisham J.");
    demoBook.setName("The Firm");
    StepExecution stepExecution = MetaDataInstanceFactory
      .createStepExecution(defaultJobParameters());

    // when
    StepScopeTestUtils.doInStepScope(stepExecution, () -> {
        jsonItemWriter.open(stepExecution.getExecutionContext());
        jsonItemWriter.write(Arrays.asList(demoBook));
        jsonItemWriter.close();
        return null;
    });

    // then
    AssertFile.assertFileEquals(expectedResult, actualResult);
}
```

Unlike the previous tests, **we are now in full control of our test objects**. As a result, **we’re responsible for opening and closing the I/O streams**.

## 5\. Conclusion

In this tutorial, we’ve explored the various approaches of testing a Spring Batch job.

End-to-end testing verifies the complete execution of the job. Testing individual steps may help in complex scenarios.

Finally, when it comes to Step-scoped components, we can use a bunch of helper methods provided by *spring-batch-test.* They will assist us in stubbing and mocking Spring Batch domain objects.

The code backing this article is available on GitHub. Once you're **logged in as a [Baeldung Pro Member](https://www.baeldung.com/members/)**, start learning and coding on the project.