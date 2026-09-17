---
title: JMeter 구성 요소
updated: 2026-09-17 09:32:50
tags:
  - performance
  - testing
---

## 1. 개요
최소 테스트는 Test Plan, Thread Group, 하나 이상의 Sampler로 구성된다. 트리 내 요소는 순서(ordered) 요소와 계층(hierarchical) 요소로 나뉜다. Controller·Sampler는 트리에 나타난 순서대로 처리되고, Listener·Configuration Element·Pre/Post-Processor·Assertion·Timer는 속한 범위(scope)에 따라 적용된다. 개요는 [[jmeter-introduction]] 참고.

## 2. Thread Group
모든 Controller와 Sampler는 Thread Group 하위에 있어야 한다. Thread Group은 스레드 수, ramp-up 기간, 반복 횟수를 설정한다.
- 스레드 수: 동시 접속을 시뮬레이션할 스레드(가상 사용자) 개수
- Ramp-up 기간: 전체 스레드가 모두 기동하기까지 걸리는 시간. 예: 스레드 10개, ramp-up 100초면 10초 간격으로 순차 기동. 시작값은 스레드 수와 동일하게 잡고 조정하는 것을 권장
- Thread lifetime: Duration(지속시간)과 Startup Delay(시작 지연)를 별도로 설정 가능

## 3. Controller
Sampler와 Logic Controller 두 종류로 나뉜다.

### 3.1 Sampler
서버에 요청을 보내고 응답을 기다리는 요소로, 트리에 나타난 순서대로 처리된다. HTTP, FTP, JDBC, Java Object, JMS, JUnit, LDAP, Mail, OS Process, TCP Request 등이 있다. Configuration Element로 세부 설정을 추가하거나 Assertion으로 응답을 검증할 수 있다.

### 3.2 Logic Controller
요청을 보내는 순서와 로직을 제어한다. 예: Once Only Controller(최초 1회만 실행), Interleave Controller(자식 요소를 순서를 기억하며 번갈아 실행). 여러 Logic Controller를 조합해 복잡한 시나리오를 구성할 수 있다.

### 3.3 Test Fragment
Thread Group과 같은 레벨의 특수 Controller로, Module Controller나 Include Controller가 참조할 때만 실행된다. 테스트 계획 내 재사용을 위한 요소다.

## 4. Listener
테스트 실행 중 수집된 정보를 조회하거나 파일로 저장하는 요소다. 예: Graph Results(응답시간 그래프), View Results Tree(요청/응답 상세, HTML/XML 렌더링). 모든 Listener는 동일한 데이터를 수집하며 표시 방식만 다르다. Test Plan 바로 아래를 포함해 어디에나 추가할 수 있고, 자신과 같은 레벨 이하 요소의 데이터만 수집한다.

## 5. Timer
기본적으로 스레드는 Sampler를 지연 없이 순차 실행한다. 짧은 시간에 과도한 요청이 몰려 서버에 부담을 줄 수 있으므로 Timer로 지연을 추가하는 것을 권장한다. Timer는 자신의 scope에 속한 각 Sampler 실행 전에 지연을 발생시키며, 여러 개가 적용되면 지연 시간을 합산한다.

## 6. Assertion
서버 응답에 대한 조건을 검증한다. 예: 응답에 특정 텍스트(정규식) 포함 여부 확인. 검증 실패 시 요청이 실패로 기록되며 Aggregate/Summary Report의 오류율에 반영된다. scope 내 모든 Sampler에 적용되며, 특정 Sampler로 제한하려면 그 Sampler의 자식으로 추가한다.

## 7. Configuration Element
Sampler와 함께 동작하며 요청 자체를 보내지는 않고(HTTP(S) Test Script Recorder 제외) 요청 내용을 추가·수정한다. 배치된 트리 분기 내에서만 접근 가능하며, 하위 분기의 설정이 상위 분기의 동일 설정보다 우선한다. User Defined Variables는 예외로, 위치와 무관하게 테스트 시작 시 처리된다.

## 8. Pre-Processor / Post-Processor
- Pre-Processor: Sampler 실행 직전에 동작. 요청 설정 변경, 응답 외 변수 갱신 등에 사용
- Post-Processor: Sampler 실행 직후에 동작. 주로 응답 데이터에서 값을 추출하는 데 사용(예: Regular Expression Extractor)

## 9. 실행 순서
Controller·Sampler는 트리 순서대로 처리되며, 하나의 Sampler에 대해서는 다음 순서로 실행된다.
1. Configuration Elements
2. Pre-Processors
3. Timers
4. Sampler
5. Post-Processors (SampleResult가 null이 아닌 경우)
6. Assertions (SampleResult가 null이 아닌 경우)
7. Listeners (SampleResult가 null이 아닌 경우)

## 10. Scoping Rules
Listener, Configuration Element, Pre/Post-Processor, Assertion, Timer는 계층적으로 적용된다. 부모가 Sampler면 그 Sampler에만, 부모가 Controller면 그 하위 모든 Sampler에 적용된다. Header Manager, Cookie Manager, Authorization Manager 같은 Manager 계열 Configuration Element는 병합되지 않아 scope 내 여러 개가 있으면 그중 하나만 사용되며 어떤 것이 사용될지는 지정할 수 없다(Default 계열 Configuration Element는 병합됨).

## 11. Properties와 Variables
- Property: `jmeter.properties`에 정의되는 전역 값. 스레드별로 다르게 설정할 수 없다.
- Variable: 스레드 로컬 값. 한 스레드가 변경해도 해당 스레드의 사본만 바뀐다. Regular Expression Extractor 같은 Post-Processor가 변수를 설정해 이후 같은 스레드에서 참조하는 식으로 사용

Test Plan과 User Defined Variables에서 정의한 값은 시작 시 전체 스레드에 복사되며, 이후 같은 이름으로 재정의하면 해당 스레드에만 적용된다. `__setProperty` 함수로 Property를 정의하면 스레드 간 정보 전달에 사용할 수 있다. Property/Variable 모두 대소문자를 구분한다.

## 12. 변수를 이용한 테스트 파라미터화
반복 실행 사이에 값이 바뀔 수 있는 항목(호스트명, 스레드 수 등)은 변수로 정의해 `${VAR}` 형태로 참조한다. `__P` 함수를 사용하면 커맨드라인에서 `-J옵션=값`으로 값을 오버라이드할 수 있다.
```
HOST    ${__P(host,www.example.com)}
```
```
jmeter … -Jhost=www3.example.org
```

---
## Sources
- [Elements of a Test Plan - Apache JMeter User's Manual](https://jmeter.apache.org/usermanual/test_plan.html)

---
## Related pages
- [[jmeter-introduction]]
