---
title: 비트 연산자
updated: 2026-09-07 09:02:35
tags:
  - java
  - language
---

Java는 정수형(byte/short/char/int/long)에 대해 비트 논리 연산자(`&`, `|`, `^`, `~`)와 시프트 연산자(`<<`, `>>`, `>>>`)를 제공한다.

## 1. 비트 논리 연산자

| 연산자 | 이름 | 동작 |
| --- | --- | --- |
| `&` | AND | 두 비트 모두 1이면 1 |
| \| | OR | 두 비트 중 하나라도 1이면 1 |
| `^` | XOR | 두 비트가 다르면 1 |
| `~` | NOT (단항) | 비트 반전 (0↔1) |

```java
5 & 3   // 0101 & 0011 = 0001 = 1
5 | 3   // 0101 | 0011 = 0111 = 7
5 ^ 3   // 0101 ^ 0011 = 0110 = 6
~5      // 00000101 -> 11111010 (2의 보수) = -6
```

`&`, `|`, `^`는 `boolean` 피연산자에도 적용된다 (JLS §15.22.2). `&&`, `||`와 달리 단락 평가(short-circuit)를 하지 않고 항상 양쪽을 모두 평가한다.

## 2. 시프트 연산자

| 연산자 | 이름 | 동작 |
| --- | --- | --- |
| `<<` | 좌측 시프트 | 우측을 0으로 채움 |
| `>>` | 부호 있는 우측 시프트 | 좌측을 부호 비트로 채움 (부호 확장) |
| `>>>` | 부호 없는 우측 시프트 | 좌측을 항상 0으로 채움 |

```java
int a = -8;              // 11111111 11111111 11111111 11111000
a >> 2;                  // -2  (부호 비트 1로 확장)
a >>> 2;                 // 1073741822 (0으로 채움)
10 << 1;                 // 20 (2배)
10 >> 1;                 // 5  (절반, 내림)
```

### 2.1. 시프트 거리 마스킹

우측 피연산자(시프트 거리)는 좌측 피연산자 타입에 따라 마스킹된다 (JLS §15.19).

- 좌측이 `int`(또는 그보다 작은 타입 승격 후): 시프트 거리 = `우측 & 0x1f` (0~31)
- 좌측이 `long`: 시프트 거리 = `우측 & 0x3f` (0~63)

```java
int x = 5;
x << 35;   // 35 & 0x1f = 3 -> x << 3 = 40

long y = 5L;
y << 67;   // 67 & 0x3f = 3 -> y << 3 = 40L
```

## 3. 타입 승격

`byte`, `short`, `char`는 단항 수치 승격(unary numeric promotion)에 의해 `int`로 승격된 후 연산된다.

```java
byte b = 5;         // 00000101
int r = ~b;         // int로 승격 후 반전 -> -6
```

시프트 연산자는 다른 이항 연산자와 달리 **좌우 피연산자를 독립적으로 승격**한다(공통 타입으로 맞추는 binary numeric promotion을 적용하지 않음). 결과 타입은 좌측 피연산자의 승격된 타입을 따른다.

```java
long l = 1L;
int shiftBy = 3;
l << shiftBy;   // 결과는 long (우측 int는 그대로 시프트 거리로만 사용)
```

## 4. 복합 대입

`&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=`는 암묵적 캐스팅을 포함한 복합 대입 연산자다.

```java
byte flags = 0b0001;
flags |= 0b0010;   // (byte)(flags | 0b0010) — 결과를 byte로 암묵 캐스팅
```

## 5. 활용 패턴

```java
int flags = 0b1101;

// 특정 비트 확인
(flags & 0b0010) != 0;   // false

// 특정 비트 설정(set)
flags |= 0b0010;

// 특정 비트 해제(clear)
flags &= ~0b0010;

// 특정 비트 토글
flags ^= 0b0010;

// 최하위 1비트만 추출
int lowest = flags & -flags;
```

## 6. Integer/Long 비트 유틸리티

`java.lang.Integer`, `java.lang.Long`은 비트 조작을 위한 static 메서드를 제공한다.

| 메서드 | 설명 |
| --- | --- |
| `bitCount(int)` | 1비트 개수 (population count) |
| `numberOfLeadingZeros(int)` | 최상위 1비트 앞의 0 개수 |
| `numberOfTrailingZeros(int)` | 최하위 1비트 뒤의 0 개수 |
| `highestOneBit(int)` | 최상위 1비트만 남긴 값 |
| `lowestOneBit(int)` | 최하위 1비트만 남긴 값 |
| `reverse(int)` | 비트 순서 반전 |
| `rotateLeft/rotateRight(int, int)` | 순환 시프트 |
| `toBinaryString/toHexString(int)` | 부호 없는 진법 문자열 변환 |
| `compress/expand(int, int)` | 마스크 기준 비트 압축/확장 (Java 19+) |

```java
int v = 12;                             // 0b1100
Integer.bitCount(v);                    // 2
Integer.numberOfTrailingZeros(v);       // 2
Integer.toBinaryString(v);              // "1100"
Integer.rotateLeft(v, 2);               // 0b110000 = 48
```

---
## Sources
- [Oracle Java Tutorials - Bitwise and Bit Shift Operators](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/op3.html)
- [JLS SE21 §15.19 Shift Operators](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.19)
- [JLS SE21 §15.22 Bitwise and Logical Operators](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.22)
- [Integer (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html)

---
## Related pages
- [[expression-vs-statement]]
