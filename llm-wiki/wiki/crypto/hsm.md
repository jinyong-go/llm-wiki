---
title: HSM (Hardware Security Module)
updated: 2026-08-31 14:25:48
tags:
  - crypto
  - hsm
  - pkcs11
  - security
  - java
---

## 1. 개요

암호 키의 생성·저장·사용을 변조 방지(tamper-resistant) 하드웨어 내부에서 수행하는 전용 장치. 개인키가 평문 상태로 하드웨어 경계를 벗어나지 않는 것이 핵심 보안 속성이며, 서명·암복호 연산은 키를 외부로 꺼내지 않고 장치 내부에서 수행한다. 키 사용에 대한 감사 로그를 제공한다.

## 2. 기능

- 키 생성 — 하드웨어 난수 생성기 기반
- 키 저장 — 비추출(non-extractable) 속성으로 평문 유출 차단
- 암호 연산 — 서명, 암복호, MAC 등을 장치 내부에서 수행
- 접근 제어 — 역할 기반·신원 기반 인증
- 감사 — 키 사용 이력 로깅

## 3. 형태

| 형태 | 설명 |
|---|---|
| 네트워크 부착형 | 독립 어플라이언스. 다수 서버가 네트워크로 공유. 엔터프라이즈 표준 |
| PCIe 카드 | 서버 내장형 |
| USB 토큰 | 소형·저성능. 개인·소규모 용도 |
| 클라우드 HSM | CSP 관리형 서비스. 7절 참고 |

## 4. FIPS 140-3

암호 모듈 보안 요구사항 표준으로 NIST가 2019-03 발행. FIPS 140-2를 대체하며 ISO/IEC 19790:2012·ISO/IEC 24759:2017 기반. 4개 보안 수준을 정의한다.

| 수준 | 추가 요구사항 |
|---|---|
| Level 1 | 승인된 알고리즘 사용 등 기본 요구사항 |
| Level 2 | 역할 기반 인증, 변조 흔적 |
| Level 3 | 신원 기반 인증, 변조 저항, 커버·도어 개봉 감지 시 키 소거, EFP 또는 EFT |
| Level 4 | 다중 요소 인증, 모듈 전면 침입 감지·소거, 결함 주입 보호, EFP 필수 |

상용 HSM은 통상 Level 3 인증을 획득한다.[^1]

### 4.1. 물리 보안 요구사항

- **변조 흔적 (tamper evidence)** — 봉인 씰, 특수 코팅 등으로 물리적 개봉 시도가 사후에 육안 확인 가능해야 함. 침입 자체를 막지는 않음. Level 2 요구
- **변조 저항 (tamper resistance)** — 견고한 하우징·포팅(potting)으로 내부 접근 자체를 어렵게 함. Level 3 요구
- **변조 대응 (tamper response)** — 침입을 감지하면 평문 키와 인증 정보를 즉시 소거(zeroize). Level 3은 커버·도어 개봉 수준의 감지가 요구되고, Level 4는 감지 범위가 모듈 전면(envelope)으로 확대되며 결함 주입(fault injection) 공격 보호가 추가됨
- **EFP (Environmental Failure Protection)** — 전압·온도가 정상 범위를 벗어나면 감지하여 동작 중단 또는 키 소거로 대응. Level 3은 EFP 또는 EFT 중 택일, Level 4는 EFP 필수
- **EFT (Environmental Failure Testing)** — 환경 이상 조건에서도 보안이 훼손되지 않음을 시험으로 입증

## 5. 인터페이스

- **PKCS#11 (Cryptoki)** — OASIS 표준 C API. 사실상 표준 연동 방식
- JCA/JCE — Java. SunPKCS11 또는 벤더 프로바이더. [[keystore-java]] 참고
- CNG — Windows
- KMIP — OASIS 키 관리 프로토콜
- 벤더별 REST API

### 5.1. PKCS#11 개념

- **Slot** — 토큰을 담을 수 있는 논리적 리더. 물리 장치의 접속 지점을 추상화하며, 하나의 HSM이 여러 슬롯을 노출할 수 있다
- **Token** — 슬롯 안에 존재하는 암호 장치의 논리적 뷰. 키·인증서가 저장되는 단위이며, 네트워크 HSM에서는 파티션 하나가 토큰 하나로 보인다
- **Session** — 애플리케이션과 토큰 간 논리적 연결. 로그인 상태와 연산 컨텍스트를 유지하며, 하나의 세션은 동시에 한 스레드만 사용할 수 있다
- **Object** — 토큰에 저장되는 항목으로 키, 인증서, 데이터가 있다. 세션 객체는 세션 종료 시 자동 소멸하고, 토큰 객체는 장치에 영속 저장되어 모든 세션에서 보인다. 객체마다 속성 `CKA_EXTRACTABLE`, `CKA_SENSITIVE` 등으로 추출 가능 여부를 제어한다
- **Mechanism** — 암호 연산의 수행 방식. `CKM_RSA_PKCS`, `CKM_AES_GCM` 등 알고리즘과 모드의 조합으로 식별한다

### 5.2. Java 예시 — SunPKCS11

JDK 내장 프로바이더가 벤더의 PKCS#11 라이브러리(.so/.dll)를 감싸 JCA/JCE로 노출한다.

```java
// pkcs11.cfg: name = MyHSM / library = /path/to/vendor-pkcs11.so / slotListIndex = 0
// JDK 9+. JDK 8 이하는 new sun.security.pkcs11.SunPKCS11(configPath) 생성자 사용
Provider p = Security.getProvider("SunPKCS11").configure("/path/to/pkcs11.cfg");
Security.addProvider(p);

KeyStore ks = KeyStore.getInstance("PKCS11", p);
ks.load(null, pin);   // 스트림은 항상 null, PIN으로 로그인
PrivateKey key = (PrivateKey) ks.getKey("alias", null);  // 핸들만 반환, 키는 HSM 내부에 유지
```

개발·테스트에는 소프트웨어 구현인 SoftHSM2를 동일 인터페이스로 사용할 수 있다.

### 5.3. Java 예시 — 벤더 프로바이더 (Thales LunaProvider)

Thales Luna는 자체 JCA/JCE 프로바이더인 Luna JSP를 제공한다. `LunaProvider.jar`가 JNI 네이티브 라이브러리 `libLunaAPI.so` / `LunaAPI.dll`를 통해 Luna 클라이언트와 통신하며, Thales의 PKCS#11(cryptoki) 구현 위에서 동작한다. PKCS#11 API로 생성한 키를 JSP에서 사용할 수 있고 그 역도 성립한다.

```java
Security.addProvider(new com.safenetinc.luna.provider.LunaProvider());

KeyStore ks = KeyStore.getInstance("Luna");
ks.load(null, partitionPassword);   // 파티션 로그인
```

SunPKCS11 대비 벤더 확장 기능으로 LunaSlotManager 등 HSM 전용 정보 조회와 고가용성 그룹을 쓸 수 있다는 차이가 있으며, JCA/JCE 표준 API만 사용하면 애플리케이션 코드는 두 방식 간 이식 가능하다.

## 6. 용도

- CA 개인키 보호 ([[x509-certificate]], [[cmp]])
- TLS 서버 키, 코드 서명, [[timestamp-token]] TSA 키
- 결제 — PIN 처리 등 전용 payment HSM
- FIPS 준수가 요구되는 환경의 키 관리 ([[kdf]]의 PBKDF2 항목 참고)

## 7. 클라우드 HSM

CSP가 HSM을 서비스로 제공하며 두 계층으로 나뉜다.

- **관리형 키 서비스** — AWS KMS, Azure Key Vault, GCP Cloud KMS. 멀티테넌트이며 백엔드가 HSM으로 보호되지만 사용자는 HSM을 직접 제어하지 않고 CSP API로만 키를 사용
- **전용 HSM 서비스** — 싱글테넌트 HSM 클러스터를 사용자가 직접 제어. PKCS#11 등 표준 인터페이스 제공

| 서비스 | 테넌시 | 인증 | 인터페이스 |
|---|---|---|---|
| AWS CloudHSM | 싱글 | FIPS 140-3 Level 3 | PKCS#11, JCE, CNG/KSP, OpenSSL |
| Azure Managed HSM | 싱글 | FIPS 140-3 Level 3 | Key Vault API |
| GCP Cloud HSM | 멀티, 싱글테넌트 옵션 | FIPS 140-2 Level 3 | Cloud KMS API, PKCS#11 라이브러리 |

AWS CloudHSM의 FIPS 140-3 인증은 FIPS 모드 클러스터에 적용된다. Azure Managed HSM은 Marvell LiquidSecurity 기반이며 Key Vault Premium도 동일하게 FIPS 140-3 Level 3 펌웨어로 갱신되었다.

키 통제권·규제 준수(예: CA 키의 전용 HSM 보관 요건)가 필요하면 전용 HSM, 일반 애플리케이션 암호화는 관리형 키 서비스로 충분하다.[^2]

[^1]: 추론. Thales Luna, Utimaco 등 주요 벤더 제품과 클라우드 HSM이 FIPS 140-2/140-3 Level 3 인증을 명시하는 사례([Cloudflare 블로그](https://blog.cloudflare.com/keyless-ssl-supports-fips-140-2-l3-hsm/), [Thales Docs](https://thalesdocs.com/gphsm/luna/7/docs/network/Content/compliance/fips.htm))에 근거한 일반화이며, 모든 제품에 대한 전수 확인은 아님. [^2]: 추론. AWS CloudHSM 공식 문서가 키에 대한 전적인 통제가 필요한 경우 CloudHSM, 그 외 관리형 통합은 KMS로 구분하는 가이드와 각 CSP의 서비스 포지셔닝에 근거한 일반화.

---

## Sources
- [FIPS 140-3 (NIST CSRC)](https://csrc.nist.gov/pubs/fips/140-3/final)
- [FIPS 140-3 Security Requirements (Encryption Consulting)](https://www.encryptionconsulting.com/fips-140-3-security-requirements-for-cryptographic-modules/)
- [FIPS 140-3 Requirements for Cryptographic Devices (Keysight)](https://www.keysight.com/blogs/en/tech/nwvs/2024/07/23/understanding-the-fips-140-3-requirements-for-cryptographic-devices)
- [PKCS #11 Specification Version 3.1 (OASIS)](https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.1/os/pkcs11-spec-v3.1-os.html)
- [PKCS #11 Usage Guide Version 2.40 (OASIS)](https://docs.oasis-open.org/pkcs11/pkcs11-ug/v2.40/pkcs11-ug-v2.40.html)
- [JDK PKCS#11 Reference Guide (Oracle)](https://docs.oracle.com/javase/8/docs/technotes/guides/security/p11guide.html)
- [Luna JSP Overview (Thales Docs)](https://www.thalesdocs.com/gphsm/luna/7/docs/pci/Content/sdk/java/jsp_overview_install.htm)
- [What is AWS CloudHSM? (AWS Docs)](https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html)
- [Azure Key Vault Managed HSM Overview (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/key-vault/managed-hsm/overview)
- [Cloud HSM (Google Cloud Docs)](https://docs.cloud.google.com/kms/docs/hsm)
- [Hardware Security Modules: Functions and Deployment (Encryption Authority)](https://encryptionauthority.com/hardware-security-modules)

---

## Related pages
- [[x509-certificate]]
- [[keystore-java]]
- [[kdf]]
- [[cmp]]
- [[timestamp-token]]
