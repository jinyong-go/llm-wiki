---
title: 좋은 테스트 코드 작성법 — 결과 검증·구조(GWT/AAA)·속성(FIRST/Test Desiderata)
updated: 2026-08-11 17:04:12
tags:
  - java
  - testing
  - best-practices
  - tdd
---

## 1. 왜 중요한가

테스트는 한 번 작성하고 끝나는 코드가 아니라 **제품 코드가 바뀔 때마다 함께 유지되는 자산**이다. 잘못 작성된 테스트는 리팩터링을 방해하고("메인 코드 수정보다 깨진 테스트 수정에 더 많은 시간"), 실패해도 원인을 알 수 없어 신뢰를 잃는다. 좋은 테스트의 목표는 **변경에 강하면서(리팩터링 내성) 문제를 빠르고 명확하게 드러내는 것**이다.

---

## 2. 핵심 원칙 ① — 내부 구현이 아닌 "결과/행위"를 검증

가장 흔한 실수는 **기능의 최종 결과가 아니라 내부 구현을 검증**하는 것이다. 구현이 바뀌면 동작이 같아도 테스트가 깨진다.

### 2.1. 안티패턴 A — 상세 구현부까지 모두 검증
공개 기능의 최종 결과만 확인하면 될 것을, 그 기능이 내부적으로 거치는 보조 계산·중간 단계까지 각각 검증하면 내부 로직을 리팩터링하는 순간 동작이 같아도 테스트 대부분이 깨진다. → **공개 API의 최종 결과만 검증한다.**

예를 들어 주문 총액을 계산하는 `OrderService.calculateTotal()`이 내부적으로 `applyDiscount()`(할인)와 `applyTax()`(세금)를 거친다고 하자.

```java
// ❌ 내부 중간 단계까지 검증 — 할인/세금 계산 방식을 바꾸면 깨짐
@Test
void 총액_계산_내부단계() {
    var order = new Order(10_000);
    assertThat(orderService.applyDiscount(order)).isEqualTo(9_000);  // 내부 단계
    assertThat(orderService.applyTax(9_000)).isEqualTo(9_900);       // 내부 단계
}

// ✅ 공개 API의 최종 결과만 검증 — 내부 계산 방식이 바뀌어도 안정적
@Test
void 총액_계산() {
    var order = new Order(10_000);   // 정가 10,000
    assertThat(orderService.calculateTotal(order)).isEqualTo(9_900); // 최종 결과
}
```

중간 단계를 검증하려고 `applyDiscount`/`applyTax`를 `public`으로 노출하는 것 자체가 신호다. 할인·세금을 하나의 정책 객체로 합치거나 순서를 바꾸는 리팩터링을 하면, 최종 총액은 같아도 위쪽 테스트는 전부 깨진다.

### 2.2. 안티패턴 B — Mock으로 메서드 호출 여부를 검증
특정 메서드가 호출됐는지(예: 저장소의 갱신 메서드 호출 여부)를 검증하면, 같은 결과를 내는 다른 메서드로 구현이 바뀌는 순간 동작이 옳아도 실패한다. → **호출 여부가 아니라 저장/변경된 실제 데이터의 상태를 검증한다.**

| 항목 | 피할 것 | 지향할 것 |
|------|---------|-----------|
| 검증 대상 | 내부 구현 세부 | 비즈니스 기능 결과 |
| Mock 사용 | 특정 메서드 호출 검증 | 최종 상태 확인 |
| 리팩터링 내성 | 낮음 | 높음 |

> 이는 [[test-double]]의 "상태 검증(Stub) 우선, 행위 검증(Mock)은 부수효과 위임에만" 원칙과 같은 맥락이다. Kent Beck도 좋은 테스트의 속성으로 **Behavioral**(동작 변화에 민감)과 **Structure-insensitive**(구조 변화엔 둔감)를 함께 든다.

---

## 3. 핵심 원칙 ② — 구조: Given-When-Then / AAA

테스트는 세 단계로 구조화하면 의도가 드러난다(Martin Fowler).

- **Given** — 행위 이전의 상태(사전 조건, pre-condition)
- **When** — 검증 대상이 되는 그 행위(stimulus)
- **Then** — 그 행위로 인해 기대되는 변화

이는 Bill Wake의 **Arrange-Act-Assert(AAA)**, Meszaros의 **Four-Phase Test(Setup-Exercise-Verify-Teardown)**와 같은 구조다. [[spock]]의 블록(`given/when/then`)이 이를 문법으로 구현한 예다.

```java
@Test
void 출금하면_잔액이_줄어든다() {
    // given
    Account account = new Account(10_000);

    // when
    account.withdraw(3_000);

    // then
    assertThat(account.getBalance()).isEqualTo(7_000);
}
```

---

## 4. 핵심 원칙 ③ — 좋은 테스트의 속성

### 4.1. FIRST (Robert C. Martin)

| 약자 | 의미 |
|------|------|
| **F**ast | 빠르게 실행 — 자주 돌릴 수 있어야 함 |
| **I**ndependent | 테스트 간 의존 없음 — 순서 무관 |
| **R**epeatable | 어떤 환경에서도 같은 결과 |
| **S**elf-validating | 통과/실패를 스스로 판정(수동 확인 불필요) |
| **T**imely | 제품 코드 직전/직후 적시에 작성 |

### 4.2. Test Desiderata

Kent Beck이 정리한 **좋은 테스트가 가지길 바라는 12가지 속성**이다. 핵심 전제는 "모든 테스트가 12개를 다 만족할 필요는 없다"는 것 — 이들은 규칙이 아니라 **트레이드오프의 좌표**다. 지침은 **"더 큰 가치를 얻지 않는 한 어떤 속성도 포기하지 말라"**이다. 어떤 속성은 서로를 돕고(자동화하면 빨라짐), 어떤 속성은 서로 충돌한다(운영 예측력을 높이면 느려짐).

| 속성 | 의미 | 위반 시 증상 |
|------|------|--------------|
| **Isolated** | 실행 순서와 무관하게 같은 결과 | 다른 테스트가 남긴 상태에 의존해 순서 바뀌면 실패 |
| **Composable** | 각 변동 차원을 분리해 테스트하고 조합 가능 | 한 테스트가 여러 관심사를 섞어 원인 분리가 어려움 |
| **Deterministic** | 입력이 안 바뀌면 결과도 안 바뀜 | 시간·난수·스레드 타이밍에 따라 간헐적 실패(flaky) |
| **Fast** | 빠르게 실행 | 느려서 자주 안 돌리게 되고 피드백이 늦어짐 |
| **Writable** | 대상 코드 대비 저렴하게 작성 | 테스트 준비(셋업)가 과해 작성 자체를 기피 |
| **Readable** | 왜 이 테스트가 있는지 의도가 읽힘 | 실패해도 무엇을 보장하려던 건지 알 수 없음 |
| **Behavioral** | 코드의 **동작 변화**에 민감 | 버그가 생겨도 테스트가 통과함(검증 공백) |
| **Structure-insensitive** | 코드의 **구조 변화**엔 둔감 | 리팩터링만 해도 테스트가 깨짐 |
| **Automated** | 사람 개입 없이 실행 | 수동 확인 단계가 있어 재현·CI 불가 |
| **Specific** | 실패 시 원인이 명확 | 하나 깨지면 어디가 문제인지 추적에 시간 소모 |
| **Predictive** | 통과하면 운영에서도 동작하리라 신뢰 가능 | 테스트는 다 통과하는데 운영에서 터짐 |
| **Inspiring** | 통과가 배포 자신감을 줌 | 통과해도 불안해 수동 재확인하게 됨 |

**서로 맞물리는 쌍**
- **Behavioral ↔ Structure-insensitive**: 이 둘의 균형이 §2(결과 검증) 원칙의 근거다. 동작 변화는 잡고(Behavioral) 구조 변화엔 안 깨지는(Structure-insensitive) 테스트가 리팩터링 내성을 만든다.
- **Fast ↔ Predictive**: 실제 DB·네트워크를 쓸수록 운영 예측력은 오르지만 느려진다. 단위/통합 테스트 비중으로 조율한다.
- **Isolated ↔ Composable**: 테스트가 격리돼 있으면 1개든 100만 개든 조합해도 같은 결과가 보장된다.

> FIRST와 겹치는 부분이 많지만(Fast·Isolated=Independent·Deterministic≈Repeatable), Test Desiderata는 **"규칙이 아니라 절충 대상"**이라는 관점과 Behavioral/Structure-insensitive/Specific/Predictive/Inspiring 같은 **가치 지향 속성**을 추가로 강조한다는 점이 다르다.

### 4.3. Behavioral과 Structure-insensitive — 리팩터링 내성의 핵심

12속성 중 이 둘은 **좋은 테스트의 방향을 정의하는 한 쌍**이라 따로 자세히 본다. §2의 "결과를 검증하라"는 원칙이 결국 이 두 속성을 동시에 만족시키려는 것이다.

- **Behavioral** — 테스트는 대상 코드의 **동작(관측 가능한 입출력·상태 변화)이 바뀌면 반드시 결과가 바뀌어야** 한다. 즉 버그가 들어오면 반드시 실패해야 한다. 이 속성이 약하면 테스트가 있어도 회귀를 못 잡는 **검증 공백**이 생긴다.
- **Structure-insensitive** — 테스트는 대상 코드의 **내부 구조(클래스 분리, 메서드 추출, private 헬퍼, 호출 순서)만 바뀌고 동작은 그대로면 결과가 바뀌지 않아야** 한다. 이 속성이 약하면 순수 리팩터링에도 테스트가 깨져 **변경을 방해**한다.

**두 축으로 본 4분면**

| | Structure-insensitive 높음 | Structure-insensitive 낮음 |
|---|---|---|
| **Behavioral 높음** | ✅ **이상적** — 버그는 잡고 리팩터링엔 안 깨짐 | ⚠️ 버그는 잡지만 리팩터링마다 깨짐(유지비↑) |
| **Behavioral 낮음** | ⚠️ 안 깨지지만 버그도 못 잡음(헛된 안정감) | ❌ 최악 — 깨지기만 하고 못 잡음 |

**무엇이 각 속성을 해치나**

- Structure-insensitive를 **해치는** 것: 내부 메서드 호출 여부 검증(Mock `verify`), private/중간 계산 결과 단언, 호출 순서 강제, 내부 자료구조 형태에 대한 단언.
- Behavioral을 **해치는** 것: 너무 느슨한 단언(널 아님만 확인), 실제 로직을 통째로 스텁으로 대체해 정작 대상 동작을 안 거치게 만드는 것.

**핵심 지향점**: 테스트는 **"무엇을(동작) 하는가"에 결합하고 "어떻게(구조) 하는가"에는 결합하지 않아야** 한다. 그래서 공개 API의 입력→출력/상태를 검증하고([[test-double]]의 상태 검증), 내부 호출·중간 단계는 검증하지 않는다.

```java
// ❌ Structure-insensitive 위반 — 동작은 같아도 내부 호출 방식을 바꾸면 깨짐
verify(discountPolicy).apply(order);
verify(taxPolicy).apply(any());

// ✅ Behavioral + Structure-insensitive — 동작(최종 금액)에만 결합
assertThat(orderService.calculateTotal(order)).isEqualTo(9_900);
```

> 단, 외부로 나가는 부수효과(메일 발송, 결제 요청처럼 상태로 관측 불가능한 것)는 예외적으로 상호작용(Mock) 검증이 정당하다 — 그 "호출" 자체가 대상의 관측 가능한 **동작**이기 때문이다.

### 4.4. Solitary vs Sociable (Fowler)

- **Solitary**: 협력 객체를 테스트 더블로 격리(mockist 선호)
- **Sociable**: 실제 협력 객체와 상호작용(classicist 선호, Fowler 본인 선호)
- 원격 결제 검증처럼 협력이 곤란할 때만 더블을 쓰는 것이 실용적 균형.

> "나는 컴파일할 가치가 있는 코드가 생기면 언제든, 1분에도 몇 번씩 유닛 테스트를 돌린다." — 테스트는 **자주 돌릴 만큼 빨라야** 한다(self-testing code).

---

## 5. 실무 체크리스트

- [ ] 테스트 이름이 **행위와 기대 결과**를 서술하는가(`출금하면_잔액이_줄어든다`)
- [ ] 하나의 테스트가 **하나의 개념**만 검증하는가
- [ ] 내부 구현이 아니라 **관측 가능한 결과/상태**를 단언하는가
- [ ] Mock 호출 검증은 **부수효과 위임**(외부 전송 등)에만 쓰는가
- [ ] Given-When-Then으로 **구조가 분리**되어 있는가
- [ ] 다른 테스트·실행 순서·환경에 **독립적**인가
- [ ] 실패 시 **원인이 즉시 드러나는가**(Specific)
- [ ] 조건문·반복문 등 **테스트 내 로직을 배제**했는가(로직은 그 자체가 버그 소지)

---

## 6. 요약

- 내부 구현이 아니라 **비즈니스 결과/상태**를 검증하라 → 리팩터링 내성 확보(jojoldu, Beck의 Behavioral+Structure-insensitive).
- **Given-When-Then/AAA**로 구조화해 의도를 드러내라.
- **FIRST**와 **Test Desiderata**를 속성 기준으로, 상황에 맞게 트레이드오프하라.
- 테스트는 **자주 돌릴 만큼 빠르고 독립적**이어야 하며, 실패 시 원인이 명확해야 한다.

---

## Sources
- jojoldu — 테스트 코드에서 내부 구현 검증 피하기: https://jojoldu.tistory.com/614
- Martin Fowler — UnitTest: https://martinfowler.com/bliki/UnitTest.html
- Martin Fowler — GivenWhenThen: https://martinfowler.com/bliki/GivenWhenThen.html
- Kent Beck — Test Desiderata: https://testdesiderata.com/
- Robert C. Martin, *Clean Code* — F.I.R.S.T principles

---

## Related pages
- [[inverse-operation-testing]] — 역연산(복호화·역직렬화 등) 함수 테스트: KAT·라운드트립
- [[test-double]] — 결과(상태) 검증 vs 행위 검증, Mock 남용 주의
- [[spock]] — Given-When-Then 블록 구조 구현
- [[java-testing-libraries]] — 테스트 도구 선택
