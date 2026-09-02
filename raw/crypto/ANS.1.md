## **ASN.1  ?o?** 

**ASN.1Abstract Syntax Notation One)** 은 데이터 구조를 정의하기 위한 표준화된 표기 법으로 네트워크 상 데이타 교환을 위해 정의한 프로토콜 표준이다 . 

## **ASN.1** 의 주요 특징 

- 플랫폼 독립성 : 다양한 시스템과 프로그래밍 언어 간에 데이터를 교환할 수 있습니다 . 

- 표준화된 인코딩 규칙 : BERBasic Encoding Rules), DERDistinguished Encoding Rules) 등 다양한 인코딩 방식을 지원합니다 . 

- 복잡한 데이터 구조 지원 : SEQUENCE, SET, CHOICE 등 다양한 데이터 타입을 제공 합니다 . 

## 주요 사용 분야 

- 네트워크 프로토콜 : SNMP, LDAP 등의 프로토콜 정의 

- 보안 **: X.509** 인증서 **, PKI** 공개키 기반구조 **)** 

- 통신 시스템 : 이동통신 , 네트워크 장비 등 

## **ASN.1** 을 사용하는 주요 이유 

- 플랫폼 독립성 **:** 서로 다른 시스템과 프로그래밍 언어 간에 데이터를 안정적으로 교환할 수 있습니다 . 

- 표준화된 데이터 표현 **:** 복잡한 데이터 구조를 명확하고 일관된 방식으로 정의할 수 있습 니다 . 

- 보안성 **:** 특히 PKI 공개키 기반구조 ) 와 같은 보안 시스템에서 널리 사용되며 검증된 안정 성을 제공합니다 . 

- 효율적인 인코딩 **:** BER, DER, PER 등 다양한 인코딩 규칙을 통해 효율적인 데이터 전송 이 가능합니다 . 

- 자동화된 코드 생성 **:** ASN.1 정의로부터 인코딩 / 디코딩 코드를 자동으로 생성할 수 있어 개발 효율성이 높습니다 . 

- 확장성 **:** 프로토콜의 향후 확장을 고려한 설계가 가능하며 , 하위 호환성을 유지할 수 있 습니다 . 

ASN.1 ?o? 

1 

## **ASN.1** 인코딩 방식의 종류와 특징 

## **1. BER (Basic Encoding Rules)** 

- 유연한 인코딩 **:** 같은 데이터를 여러 가지 방식으로 인코딩할 수 있음 

- **TLV** 구조 **:** Type( 타입 ), Length( 길이 ), Value( 값 ) 형식으로 구성 

- 가변 길이 지원 **:** 데이터의 길이를 동적으로 처리 가능 

## **!! BER** 인코딩 규칙 

## **2. DER (Distinguished Encoding Rules)** 

- **BER** 의 제한된 형태 **:** 하나의 데이터는 항상 동일한 방식으로 인코딩 

- 디지털 서명에 적합 **:** 암호화 응용 프로그램에서 주로 사용 

- 정규화된 형식 **:** 인코딩 결과의 일관성 보장 

## **3. PER (Packed Encoding Rules)** 

- 최적화된 인코딩 **:** 최소한의 바이트로 데이터를 표현 

- 두 가지 변형 **:** UPERUnaligned) 및 APERAligned) 지원 

- 네트워크 효율성 **:** 대역폭이 제한된 환경에 적합 

## **4. XER (XML Encoding Rules)** 

   - **XML** 기반 인코딩 **:** ASN.1 데이터를 XML 형식으로 표현 

   - 가독성 **:** 사람이 읽기 쉬운 형태로 데이터 표현 

   - 웹 서비스 통합 **:** XML 기반 시스템과의 호환성 제공 

- 각 인코딩 방식은 특정 사용 사례에 맞게 최적화되어 있으며 , 애플리케이션의 요구사항에 따 

- 라 적절한 인코딩 방식을 선택할 수 있습니다 . 

## **ASN.1** 기본 문법 

## **1.** 기본 데이터 타입 

ASN.1 은 다음과 같은 기본 데이터 타입을 제공합니다 : 

ASN.1 ?o? 

2 

## 단순 타입 **(Simple Types)** 

- 숫자형 **:** INTEGER, REAL, ENUMERATED 

- 문자형 **:** IA5String, UTF8String, PrintableString, NumericString 

- 이진형 **:** BIT STRING, OCTET STRING 

- 시간형 **:** UTCTime, GeneralizedTime 

## 구조화된 타입 **(Structured Types)** 

- **SEQUENCE** 순서가 있는 필드들의 집합 

- **SET** 순서가 없는 필드들의 집합 

- **CHOICE** 여러 타입 중 하나를 선택 

- **SEQUENCE OF** 동일한 타입의 순서가 있는 배열 

- **SET OF** 동일한 타입의 순서가 없는 집합 

이러한 기본 타입들을 조합하여 복잡한 데이터 구조를 정의할 수 있습니다 . 

## **2.** 타입 정의 

`TypeName ::= Type  --` 기본 타입 정의 형식 `Person ::= SEQUENCE { --` 복합 타입 예제 `name UTF8String, age  INTEGER }` 

## **2.** 기본 구문 규칙 

- 식별자 규칙 **:** 대문자로 시작하는 것은 타입 , 소문자로 시작하는 것은 값을 나타냅니다 . 

- 주석 **:** 두 개의 하이픈 (--) 을 사용하여 한 줄 주석을 작성합니다 . 

- 할당 연산자 **:** ::= 를 사용하여 타입이나 값을 정의합니다 . 

## **3.** 중첩 구조 

```
Address::=SEQUENCE{
    street UTF8String,
```

ASN.1 ?o? 

3 

`city   UTF8String, country PrintableString } Employee ::= SEQUENCE { --` 중첩된 구조 사용 `info    Person, --` 이전에 정의된 `Person` 타입 사용 `address Address     --` 이전에 정의된 `Address` 타입 사용 `}` 

## **4.** 선택적 필드와 기본값 

`UserProfile ::= SEQUENCE { username UTF8String, email    UTF8String OPTIONAL, --` 선택적 필드 `status   INTEGER DEFAULT 1, --` 기본값 지정 `role     ENUMERATED { --` 열거형 정의 `admin(0), user(1), guest(2) } }` 

## **5.** 제약 조건 사용 

`Age ::= INTEGER (0..120) --` 범위 제약 `Password ::= UTF8String (SIZE(8..32)) --` 길이 제약 `CountryCode ::= PrintableString (SIZE(2)) --` 정확한 길이 지정 

이러한 문법 요소들을 조합하여 복잡한 데이터 구조를 정의할 수 있으며 , 각 필드에 대한 정 확한 타입과 제약 조건을 명시할 수 있습니다 . 

## **ASN.1** 실제 사용 예제 

## **1. RSA Public/Private Key** 정의 

ASN.1 ?o? 

4 

```
RSAPublicKey ::= SEQUENCE {
    modulus           INTEGER,  -- n
    publicExponent    INTEGER   -- e
}
```

```
30820122300D06092A864886F70D01010105000382010F003082010A028201
3082010A0282010100B634922909F67EF874A87CDA5779113DF8C129B457C0
```

```
RSAPrivateKey ::= SEQUENCE {
version           Version,
     modulus           INTEGER,  -- n
     publicExponent    INTEGER,  -- e
     privateExponent   INTEGER,  -- d
     prime1            INTEGER,  -- p
     prime2            INTEGER,  -- q
     exponent1         INTEGER,  -- d mod (p-1)
     exponent2         INTEGER,  -- d mod (q-1)
     coefficient       INTEGER,  -- (inverse of q) mod p
     otherPrimeInfos   OtherPrimeInfos OPTIONAL
}
```

```
308204BE020100300D06092A864886F70D0101010500048204A8308204A402
```

## **ASN.1 BER** 인코딩 규칙 

BERBasic Encoding Rules) 인코딩은 LTV 구조로 인코딩됩니다 . 

## **TLV** 구조 

## � **T (Tag)** : 

- 데이터의 유형 (type) 을 나타냅니다 . 

- 각 태그는 데이터가 무엇인지 ( 예 : INTEGER, SEQUENCE, BOOLEAN 등 ) 와 데이 

- 터의 클래스 (Universal, Application, Context-Specific, Private) 를 설명합니 다 . 

ASN.1 ?o? 

5 

## � **L Length)** : 

- 데이터 값 (Value) 의 길이를 나타냅니다 . 

- 데이터 값의 크기를 바이트 단위로 표현합니다 . 

## � **V Value)** : 

- 실제 데이터의 값입니다 . 

- T 와 L 에 의해 설명된 유형과 길이에 따라 값을 직렬화합니다 . 

## **TLV** 구성 요소의 세부 사항 

## **1. Tag (T)** 

Tag 는 데이터의 유형과 클래스 (Class), 그리고 복합 여부 (Constructed/Primitive) 를 설명 하는 **1~N** 바이트 필드입니다 . 

## **Class 2** 비트 **)** : 

- 데이터의 범위를 정의합니다 . 

   - `00`  Universal ASN.1 기본 데이터 유형 , 예 : INTEGER, SEQUENCE 

   - `01`  Application-specific 

   - `10`  Context-specific 

   - `11`  Private 

## **P/C 1** 비트 **)** : 

데이터가 단순 (Primitive) 인지 복합 (Constructed) 인지 나타냅니다 . 

- `0`  Primitive ( 단일 값 ) 

- `1`  Constructed ( 집합 데이터 , 예 : SEQUENCE 

## **Tag Number 5** 비트 **)** : 

데이터의 유형 ( 예 : INTEGER2, BOOLEAN1) 을 나타냅니다 . 

- **5** 비트 초과 시 추가 바이트로 확장 . 

## **SEQUENCE** 의 **Tag** 값 분석 

`SEQUENCE` 는 ASN.1 의 **Universal** 클래스에 속하며 , **Constructed** 데이터 유형입니다 . 이를 바탕으로 태그 값이 계산됩니다 : 

ASN.1 ?o? 

6 

## 1. **Class 2** 비트 **)** : 

Universal 클래스 : `00` 

## 2. **P/C 1** 비트 **)** : 

Constructed: `1` 

## 3. **Tag Number 5** 비트 **)** : 

SEQUENCE 는 Universal 클래스에서 Tag Number 가 **16** . 

## 결합된 **8** 비트 태그 값 **:** 

`Class (2` 비트 `) | P/C (1` 비트 `) | Tag Number (5` 비트 `) 00            | 1           | 10000` 

- 이진수 : `00110000` 

- 십진수 : `48` 

- **16** 진수 : `30` 

## **2. Length (L)** 

Length 필드는 데이터 값의 길이를 바이트 단위로 나타냅니다 . BER 에서는 길이를 표현하는 방식이 두 가지입니다 . 

## 단일 바이트 **(Short Form)** : 

값이 **127** 이하일 때 사용 . 

- 1 바이트로 길이를 표현 . 

## 다중 바이트 **(Long Form)** : 

- 값이 **128** 이상일 때 사용 . 

첫 바이트 : 

MSB 최상위 비트 ) 가 `1` 이면 Long Form. 

하위 7 비트는 길이 값의 바이트 수를 나타냄 . 

## 이후 바이트 : 

실제 길이를 나타냄 . 

ASN.1 ?o? 

7 

길이 `: 3 00000011` 길이 `: 130` 첫 바이트 `: 10000001` 이후 바이트 `: 10000010` 인코딩 `81 82` 길이 `: 300` 첫 바이트 `: 10000002` 이후 바이트 `: 0000 0001 0010 1100` 인코딩 `81 01 2C` 

## **3. Value (V)** 

Value 는 실제 데이터입니다 . T 와 L 에서 정의된 데이터 유형과 길이에 따라 인코딩됩니다 . 

ASN.1 ?o? 

8 

