---
title: HSM
updated: 2026-10-20 17:54:47
tags:
  - crypto
  - hsm
  - pkcs11
  - security
  - java
---

## 1. 개요

HSM(Hardware Security Module)은 키 생성·저장과 암호 연산을 보호 경계 안에서 수행하는 하드웨어 장치다. 비추출 정책이 적용된 키는 평문으로 외부에 내보내지 않고 내부 연산에 사용한다. 지원 알고리즘·키 속성·감사 기능은 제품과 운영 모드에 따라 확인한다.

## 2. 기능과 용도

- 키 생성: 하드웨어 난수 생성기 기반
- 키 저장: 비추출(non-extractable) 속성으로 평문 유출 차단
- 암호 연산: 서명, 암복호, MAC 등을 장치 내부에서 수행
- 접근 제어: 역할 기반·신원 기반 인증
- 감사: 키 사용 이력 로깅

### 2.1. 용도

- CA 개인키 보호 ([[x509-certificate]], [[cmp]])
- TLS 서버 키, 코드 서명, [[timestamp-token]] TSA 키
- 결제: PIN 처리 등 전용 payment HSM
- FIPS 준수가 요구되는 환경의 키 관리 ([[kdf]]의 PBKDF2 항목 참고)

## 3. 연결 형태

| 연결 형태 | 설명 |
|---|---|
| 네트워크 부착형 | 여러 애플리케이션 서버가 네트워크로 접근하는 별도 장치 |
| PCIe 카드 | 서버 내부에 장착하는 암호 모듈 |
| USB 장치 | USB로 연결하며 지원 연산·처리량은 제품별 확인 |

클라우드는 연결 형태가 아니라 서비스 제공 방식이므로 §4에서 별도로 구분한다.

## 4. 클라우드 서비스

클라우드에서는 키 관리 API를 제공하는 서비스와 HSM의 사용자·파티션을 직접 관리하는 서비스를 구분한다. 싱글테넌트 여부와 PKCS#11 직접 접근 여부는 별개의 선택 기준이다.

| 비교 기준 | 확인할 내용 |
|---|---|
| 키 통제 | 키 생성·사용·삭제·복구 권한을 누가 관리하는지 |
| 테넌시 | 하드웨어·파티션이 전용인지 공유되는지 |
| 인터페이스 | CSP 키 관리 API인지 PKCS#11·JCE 등 직접 연동인지 |
| 인증 | 모듈·펌웨어·운영 모드별 FIPS 인증 범위 |
| 가용성 | 장애 조치, 백업 복원, 리전 간 복구 지원 |

AWS CloudHSM, Azure Managed HSM, Google Cloud HSM은 서비스별 관리 범위와 인터페이스가 다르다. 제품명만으로 동일한 전용 HSM 모델이라고 판단하지 말고 각 공식 문서의 통제권·테넌시·지원 연산을 확인한다.

서비스 선택은 키 통제권과 규제 요구뿐 아니라 처리량, 지연, 가용성, 지원 알고리즘을 함께 비교한다. 일반 애플리케이션이라는 이유만으로 관리형 키 서비스가 충분하다고 단정하지 않는다.

## 5. 연동

- PKCS#11 (Cryptoki): OASIS 표준 C API. 사실상 표준 연동 방식
- JCA/JCE: Java. SunPKCS11 또는 벤더 프로바이더. [[keystore-java]] 참고
- CNG: Windows
- KMIP: OASIS 키 관리 프로토콜
- 벤더별 REST API

### 5.1. PKCS#11

- Slot: 토큰을 담을 수 있는 논리적 리더. 물리 장치의 접속 지점을 추상화하며, 하나의 HSM이 여러 슬롯을 노출할 수 있다
- Token: 슬롯 안에 존재하는 암호 장치의 논리적 뷰. 키·인증서가 저장되는 단위이며, 네트워크 HSM에서는 파티션 하나가 토큰 하나로 보인다
- Session: 애플리케이션과 토큰 간 논리적 연결. 로그인 상태와 연산 컨텍스트를 유지하며, 하나의 세션은 동시에 한 스레드만 사용할 수 있다
- Object: 토큰에 저장되는 항목으로 키, 인증서, 데이터가 있다. 세션 객체는 세션 종료 시 자동 소멸하고, 토큰 객체는 장치에 영속 저장되어 모든 세션에서 보인다. 객체마다 속성 `CKA_EXTRACTABLE`, `CKA_SENSITIVE` 등으로 추출 가능 여부를 제어한다
- Mechanism: 암호 연산의 수행 방식. `CKM_RSA_PKCS`, `CKM_AES_GCM` 등 알고리즘과 모드의 조합으로 식별한다

### 5.2. SunPKCS11

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

### 5.3. LunaProvider

Thales Luna는 자체 JCA/JCE 프로바이더인 Luna JSP를 제공한다. `LunaProvider.jar`가 JNI 네이티브 라이브러리 `libLunaAPI.so` / `LunaAPI.dll`를 통해 Luna 클라이언트와 통신하며, Thales의 PKCS#11(cryptoki) 구현 위에서 동작한다. PKCS#11 API로 생성한 키를 JSP에서 사용할 수 있고 그 역도 성립한다.

```java
Security.addProvider(new com.safenetinc.luna.provider.LunaProvider());

KeyStore ks = KeyStore.getInstance("Luna");
ks.load(null, partitionPassword);   // 파티션 로그인
```

SunPKCS11 대비 벤더 확장 기능으로 LunaSlotManager 등 HSM 전용 정보 조회와 고가용성 그룹을 쓸 수 있다는 차이가 있으며, JCA/JCE 표준 API는 연산 코드를 공통화하는 데 도움이 된다. 로그인·키 속성·지원 알고리즘·장애 처리의 차이는 별도로 확인해야 한다.

## 6. FIPS 140-3

암호 모듈 보안 요구사항 표준으로 NIST가 2019-03 발행. FIPS 140-2를 대체하며 ISO/IEC 19790:2012·ISO/IEC 24759:2017 기반. 4개 보안 수준을 정의한다.

| 수준 | 추가 요구사항 |
|---|---|
| Level 1 | 승인된 알고리즘 사용 등 기본 요구사항 |
| Level 2 | 역할 기반 인증, 변조 흔적 |
| Level 3 | 신원 기반 인증, 변조 저항, 커버·도어 개봉 감지 시 키 소거, EFP 또는 EFT |
| Level 4 | 다중 요소 인증, 모듈 전면 침입 감지·소거, 결함 주입 보호, EFP 필수 |

이 표는 영역별 요구사항을 축약한 비교다. 실제 인증은 모듈 경계, 하드웨어·펌웨어 버전, 보안 정책과 운영 모드를 기준으로 확인한다. 전체 보안 수준과 물리 보안 등 개별 영역의 수준을 혼동하지 않는다.

### 6.1. 물리 보안

- 변조 흔적 (tamper evidence): 봉인 씰, 특수 코팅 등으로 물리적 개봉 시도가 사후에 육안 확인 가능해야 함. 침입 자체를 막지는 않음. Level 2 요구
- 변조 저항 (tamper resistance): 견고한 하우징·포팅(potting)으로 내부 접근 자체를 어렵게 함. Level 3 요구
- 변조 대응 (tamper response): 침입을 감지하면 평문 키와 인증 정보를 즉시 소거(zeroize). Level 3은 커버·도어 개봉 수준의 감지가 요구되고, Level 4는 감지 범위가 모듈 전면(envelope)으로 확대되며 결함 주입(fault injection) 공격 보호가 추가됨
- EFP (Environmental Failure Protection): 전압·온도가 정상 범위를 벗어나면 감지하여 동작 중단 또는 키 소거로 대응. Level 3은 EFP 또는 EFT 중 택일, Level 4는 EFP 필수
- EFT (Environmental Failure Testing): 환경 이상 조건에서도 보안이 훼손되지 않음을 시험으로 입증

## 7. 운영

### 7.1. 키 수명과 복구

백업·복구 가능 여부를 키의 비추출 정책과 구분한다. 제품이 지원하는 보호된 백업 절차를 사용하고, 키 소거·장치 장애 후에도 필요한 데이터를 복구할 수 있는지 확인한다. 복원 절차와 접근 자격도 운영 전에 검증한다.

### 7.2. 권한과 감사

관리자와 암호 연산 사용자의 역할을 분리하고 애플리케이션에는 필요한 키와 연산만 허용한다. 키가 외부로 추출되지 않더라도, 권한을 탈취한 애플리케이션이 HSM에 서명 요청을 보내는 위험은 남는다.[^1] 키 사용 로그와 애플리케이션의 업무 요청 이력을 함께 추적한다.

### 7.3. 세션과 장애

클라이언트·세션 자원을 재사용할 때는 벤더의 스레드 안전성·로그인 범위·세션 한도를 따른다. 연결 실패 시 재연결과 타임아웃을 처리하고, 클러스터 장애 조치 후에도 키 핸들이 유효한지 확인한다. 재시도 정책은 서명·키 생성 등 요청의 성격에 맞게 정한다.

AWS 문서의 클러스터·사용자·애플리케이션 모범 사례를 참고하되, 세션과 핸들의 동작을 다른 제품에 그대로 적용하지 않는다.

---

## Sources

- [AWS CloudHSM Cluster Management](https://docs.aws.amazon.com/cloudhsm/latest/userguide/bp-cluster-management.html)
- [AWS CloudHSM User Management](https://docs.aws.amazon.com/cloudhsm/latest/userguide/bp-hsm-user-management.html)
- [AWS CloudHSM Application Integration](https://docs.aws.amazon.com/cloudhsm/latest/userguide/bp-application-integration.html)
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

---

[^1]: 위협 모델에 대한 판단. HSM 내부에서 키를 사용하는 설계도 정상 연산 권한 자체가 탈취되면 무단 요청을 막지 못하므로, 키 추출 방지와 애플리케이션 인가를 별도 통제로 설명했다. AWS의 사용자 권한 분리 지침에 근거한다.
