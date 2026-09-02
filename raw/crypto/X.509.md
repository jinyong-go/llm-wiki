## **X.509** 

**PKI** 공개 키 기반구조 **)** 에서 사용되는 국제 표준 

- (1) 인증서의 내부 구조를 정의 

- → ASN.1 기반으로 인증서의 구조와 데이터를 기술하고 인코딩 

- (2) 인증체계의 사용방식을 규정 

- → 인증서를 발급 , 배포 , 검증하여 사용자의 신원을 증명하고 데이터를 안전하게 보호하는 모든 과정 

## **1. X.509** 인증서 구조 

- � **TBSCertificate To-Be-Signed Certificate)** : 인증서 본체로 , 서명 대상이 되는 데이터 

- � **Signature Algorithm** : 인증서 서명 알고리즘 

- � **Signature Value**  TBSCertificate 에 서명 알고리즘을 적용하여 생성한 서명 값 

```
Certificate ::= SEQUENCE {
    tbsCertificate       TBSCertificate,
    signatureAlgorithm   AlgorithmIdentifier,
    signatureValue       BIT STRING
}
```

## **(1) TBSCertificate** 

tbsCertificate 

- **Version** : x.509 버전 

- **Serial Number** : 정수로 된 인증서 고유 번호 

- **Signature** : tbsCertificate 를 서명할 때 

- 사용된 알고리즘 

**Algorithm** : 알고리즘 

**Parameters** : 매개 변수 

- **Issuer** : 인증서를 발급한 CA 인증기관 ) 의 이름정보 

**Validity** : 유효기간 

- **Not Before** : 유효기간 시작 날짜 

- **Not After** : 유효기간 끝나는 날짜 

X.509 

1 

- **Subject** : 주체 ( 피발급자 ) 

- **Subject Public Key Info** : 주체 공개 키 정보 

   - **Public Key Algorithm** : 공개 키 알 고리즘 

- . **Subject Public Key** : 주체 공개 키 

- **Issuer Unique Identifier** Optional) : 발행자 고유 식별자 

- **Subject Unique Identifier** Optional) : 주체 고유 식별자 

- **Extensions** Optional) 확장 

   - **Subject Key Identifier** : 공개 키 식 별자 

   - **Authority Key Identifier**  CA 인증 기관 ) 의 공개키 식별자 

   - **Key Usage** : 인증서 사용 목적 

   - **Basic Constraints** : 인증서의 인증 기관 (CA) 여부 

   - **Extended Key Usage** : 구체적인 사 용 사례 

`TBSCertificate ::= SEQUENCE { version             [0] EXPLICIT Version DEFAULT v1, serialNumber         CertificateSerialNumber, signature            AlgorithmIdentifier, issuer               Name, validity             Validity, subject              Name, subjectPublicKeyInfo SubjectPublicKeyInfo, extensions          [3] EXPLICIT Extensions OPTIONAL }` 

X.509 

2 

## **(2) Signature Algorithm** 

- Algorithm : 인증서 발급자가 서명을 생성할 때 사용한 알고리즘으로 , 검증 시 이 필드에 작성된 알고리즘 을 이용해 검증됨 

Parameters : 알고리즘에 필요한 파라미터 

## `AlgorithmIdentifier ::= SEQUENCE {` 

```
    algorithm      OBJECT IDENTIFIER, ex) 1.2.840.113549.1.1.11 (SHA256 wi
    parameters     ANY DEFINED BY algorithm OPTIONAL
}
```

## **(3) Signature** 

Signature Value  CA 의 개인키로 서명된 값 

## `signatureValue BIT STRING` 

## **2. X.509** 인증서 확장자 

|확장자|설명|파일 형식|포함 데이터|사용목적 및 특징|비고|
|---|---|---|---|---|---|
|.PEM|Base64로 인코<br>딩 된 텍스트 형식<br>의 인증서|텍스트|인증서<br>개인키<br>공개키|인증서나 키를 저<br>장할 때 주로 사용|BEGIN<br>CERTIFICATE<br>--- -----END<br>CERTIFICATE<br>---|
|.DER|DER인코딩 된 인<br>증서|바이너리|인증서|크기가 작아서 전<br>송,저장에 유리|.pem을 바이너리<br>로 변환한 것|
|.CER|CER인코딩 된 인<br>증서|텍스트,바이너리<br>모두 가능|인증서||Windows환경에<br>서 주로 사용|
|.CRT|CRT인코딩 된 인<br>증서|텍스트,바이너리<br>모두 가능|인증서||Linux환경에서<br>주로 사용|
|.p7c|PKCS#7표준을<br>따르는 인증서|텍스트,바이너리<br>모두 가능|인증서<br>인증서 체인<br>(개인키X)|인증서 체인을 배<br>포하거나 디지털<br>서명검증에 주로<br>사용||
|.pfx|PKCS#12표준을<br>따르는<br>암호화된<br>인증서|바이너리|인증서<br>인증서 체인<br>개인키|인증서 및 키 배포<br>에 주로 사용|Windows환경에<br>서 주로 사용|
|.p12|PKCS#12표준을<br>따르는<br>암호화된<br>인증서|바이너리|인증서<br>인증서 체인<br>개인키|인증서 및 키 배포<br>에 주로 사용|Windows환경<br>뿐만 아니라<br>macOs, Linux,<br>모바일 환경에서<br>도 널리 사용|



X.509 

3 

## **3. X.509** 인증서 검증 

인증서가 상위 인증기관 (CA) 에 의해 유효하게 서명되었는지 확인하여 검증 

## **<** 검증 과정 **>** 

- (1) 인증서의 서명전 데이터 (tbsCertificate) 를 서명 알고리즘 (Signature Algorithm) 으로 해시 

- (2) 상위 인증서의 공개키를 사용해 서명 값 (signatureValue) 을 복호화 

- (3) 두 값을 비교하여 일치하는지 확인 

## **4. X.509** 인증서 체인 

PKI  공개키 기반 구조 ) 의 핵심 개념으로 , 신뢰할 수 있는 루트인증서에서 시작해 최종 엔터티 인증서까지 이 어지는 계층적 연결을 의미함 

이를 통해 각 인증서가 신뢰할 수 있는 발급자에 의해 발급 되었음을 검증할 수 있음 

1 X.509 인증서 체인의 구성 

- 루트인증서 : 체인의 최상위 인증서 , 자체서명 되어있음 

- 중간인증서 : 루트 CA 로부터 발급된 인증서 , 최종 인증서를 발급할 권한을 가짐 

- 최종 엔터티 인증서 : 중간 CA 로부터 발급된 인증서 , 클라이언트가 직접 사용하는 인증서 

(2) 인증서 체인 검증 과정 

- 상위 인증서의 공개키를 이용해 하위 인증서의 서명을 검증하여 신뢰성을 확인함 

   - 최종 엔터티 인증서 검증 : 클라이언트가 최종 인증서의 서명을 검증하고 , 발급자가 중간 CA 인지 확인 

   - 중간 인증서 검증 : 중간 CA 인증서의 서명을 검증하고 , 발급자가 루트 CA 인지 확인 

   - 루트 인증서 검증 : 클라이언트의 신뢰저장소 (Trusted Store) 에서 신뢰여부를 확인 

   - 체인 전체 검증 : 모든 단계에서 서명이 유효하고 , 체인의 최상단이 신뢰 저장소에 존재하면 인증서가 유효 하다고 간주함 

(3) 체인 검증의 주요 요소 

- 서명 검증 : 상위 인증서의 공개키를 이용해 검증 

- 신뢰 저장소 확인 : 루트 인증서가 클라이언트의 신뢰 저장소에 포함되어 있는지 확인 

- 유효기간 검증 : 각 인증서의 유효기간이 현재 시간 내에 있는지 확인 

- 폐기 상태 검증 : 인증서가 폐기되지 않았는지 확인 (CRL 또는 OCSP) 

## **4. X.509** 인증서의 사용사례 

HTTPS, TLS/SSL  X.509 인증서를 사용해 서버의 신원을 증명하고 클라이언트와의 통신을 암호화 

X.509 

4 

- 이메일 암호화 (S/MIME) : 이메일 송수신 시 메시지를 암호화하고 디지털 서명을 추가 

- VPN  사용자와 서버의 신원을 인증하여 안전한 네트워크 연결 제공 

X.509 

5 

