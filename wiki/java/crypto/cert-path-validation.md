---
title: BouncyCastle 인증서 경로 검증 — CertPathValidator/Builder
updated: 2026-08-11 17:04:12
tags:
  - java
  - crypto
  - bouncycastle
  - x509
  - pki
---

## 1. 개요

**인증서 경로 검증(certification path validation)** 은 **말단 인증서(EE)에서 신뢰 앵커(루트 CA)까지의 체인을 구성**하고, 각 단계를 검증해 "이 인증서를 신뢰할 수 있는가"를 판정하는 절차다(RFC 5280 §6). 인증서 개념·체인 구조는 [[x509-certificate]] 참조.

이 문서는 Java 표준 **JCA `CertPathValidator`/`CertPathBuilder`** 를 **BouncyCastle** 프로바이더로 수행하는 예시다.

---

## 2. 검증 대상

- **서명 체인** : 각 인증서가 상위(발급자)의 **개인키로 서명**됐음을 상위 인증서의 **공개키로 검증**
- **유효기간** : 검증 기준 시각(기본: 현재)이 각 인증서의 **notBefore~notAfter 사이**에 있는지 확인
- **이름 체이닝** : 하위의 issuer == 상위의 subject
- **Basic Constraints** : CA 인증서는 `CA:TRUE`, `pathLenConstraint` 준수
- **Key Usage / EKU** : CA는 `keyCertSign`, 용도(EKU) 적합성
- **신뢰 앵커 도달** : 루트가 신뢰 저장소(TrustAnchor)에 존재
- **폐기(revocation)** : CRL/OCSP로 폐기 여부(§4.3)

---

## 3. 준비 — 인증서 로딩

```java
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import java.security.Security;
import java.security.cert.*;
import java.io.FileInputStream;

Security.addProvider(new BouncyCastleProvider());
CertificateFactory cf = CertificateFactory.getInstance("X.509", "BC");

X509Certificate root = load(cf, "root.pem");   // 루트 CA(자체 서명) → 신뢰 앵커
X509Certificate ca   = load(cf, "inter.pem");  // 중간 CA
X509Certificate ee   = load(cf, "ee.pem");     // 말단(검증 대상)

static X509Certificate load(CertificateFactory cf, String path) throws Exception {
    try (FileInputStream in = new FileInputStream(path)) {
        return (X509Certificate) cf.generateCertificate(in);
    }
}
```

> 테스트 체인은 [[cmp-bouncycastle]] §6의 `JcaX509v3CertificateBuilder` 패턴으로 root→ca→ee를 순차 서명해 만들 수 있다.

---

## 4. 수행 방법

**TrustAnchor에는 신뢰 시작점(보통 루트 CA, 자체 서명)만** 담는다(앵커·EE는 CertPath에 넣지 않음). 앵커가 반드시 자체 서명이어야 하는 것은 아니며, 원하면 중간 CA를 앵커로 직접 신뢰할 수도 있다(그 지점에서 경로가 끝남).

### 4.1. CertPathValidator — 경로 검증

경로가 EE→중간 순으로 정해져 있으면 바로 검증한다. **CertPath에는 신뢰 앵커(루트)를 포함하지 않는다.** 서명 체인·유효기간·제약 등 §2의 기본 항목을 검증한다(폐기는 §4.3에서 옵션으로 추가). 경로를 직접 구성해 넘기므로 **중간 인증서는 `CertPath`(cp)에 담으며**, 이때 `CertStore`는 (필요 시) CRL 공급용이다.

```java
import java.util.*;

// EE → 중간 순서(루트 제외)
CertPath certPath = cf.generateCertPath(Arrays.asList(ee, ca));

// 신뢰 앵커 = 루트 CA
TrustAnchor anchor = new TrustAnchor(root, null);
PKIXParameters params = new PKIXParameters(Collections.singleton(anchor));
params.setRevocationEnabled(false);           // 데모: 폐기검사 끔(§4.3에서 켬)

// 검증 기준 시각 — 미설정 시 "현재(now)". 과거 서명 검증 등에 특정 시점 지정
Calendar validDate = Calendar.getInstance();
params.setDate(validDate.getTime());

CertPathValidator validator = CertPathValidator.getInstance("PKIX", "BC");
PKIXCertPathValidatorResult result =
        (PKIXCertPathValidatorResult) validator.validate(certPath, params);

System.out.println("검증 성공, 신뢰 앵커: "
        + result.getTrustAnchor().getTrustedCert().getSubjectX500Principal());
// 실패 시 CertPathValidatorException(원인·인덱스 포함) 발생
```

### 4.2. CertPathBuilder — 경로 자동 구성 + 검증

중간 인증서 여러 개가 섞인 풀에서 **경로를 자동으로 찾아** 검증한다. **중간 인증서를 `CertStore` 풀에 넣으면** 빌더가 그중에서 경로를 조립한다.

```java
// 검증 대상(target) 지정
X509CertSelector target = new X509CertSelector();
target.setCertificate(ee);

Set<TrustAnchor> anchors = Collections.singleton(new TrustAnchor(root, null));
PKIXBuilderParameters bparams = new PKIXBuilderParameters(anchors, target);
bparams.setRevocationEnabled(false);

// 중간 인증서 풀(어떤 게 경로에 쓰일지는 빌더가 결정)
CertStore interStore = CertStore.getInstance("Collection",
        new CollectionCertStoreParameters(Arrays.asList(ca)), "BC");
bparams.addCertStore(interStore);

CertPathBuilder builder = CertPathBuilder.getInstance("PKIX", "BC");
PKIXCertPathBuilderResult br = (PKIXCertPathBuilderResult) builder.build(bparams);

CertPath built = br.getCertPath();            // 자동 구성된 경로
System.out.println("경로 길이: " + built.getCertificates().size());
```

### 4.3. 폐기 검증 (CRL / OCSP)

§4.1의 validator에 **폐기 검사를 더한 것**이다(기본 검증은 그대로 수행). `PKIXRevocationChecker`(Java 8+)로 확인하며, 미설정 시 기본은 CRL이다.

```java
CertPathValidator cpv = CertPathValidator.getInstance("PKIX", "BC");
PKIXRevocationChecker rc = (PKIXRevocationChecker) cpv.getRevocationChecker();
rc.setOptions(EnumSet.of(
        PKIXRevocationChecker.Option.PREFER_CRLS,   // OCSP 대신 CRL 우선
        PKIXRevocationChecker.Option.NO_FALLBACK));  // 대체 수단 금지
// 폐기 정보(CRL/OCSP)를 못 구하면 기본적으로 검증 실패(예외).
// 획득 실패를 통과시키려면 Option.SOFT_FAIL 추가 → 네트워크 오류·CRL 부재는
// '폐기 아님'으로 간주(단, 폐기 확인을 못 한 채 통과하므로 보안상 주의).

PKIXParameters params = new PKIXParameters(Collections.singleton(new TrustAnchor(root, null)));
params.addCertPathChecker(rc);                 // 폐기 체커 등록

// 오프라인 CRL/ARL 공급 — 인증서와 CRL을 한 CertStore에 혼합 가능
CertStore store = CertStore.getInstance("Collection",
        new CollectionCertStoreParameters(Arrays.asList(ca, rootArl)));  // rootArl = X509CRL
params.addCertStore(store);

cpv.validate(cf.generateCertPath(Arrays.asList(ee, ca)), params);
```

- **폐기 정보 획득 경로**: **OCSP**는 인증서의 **AIA(OCSP URL)를 자동으로 읽어** 응답자에 조회한다(네트워크 필요). 반면 **CRL/ARL은 인증서의 CRL Distribution Points(CRLDP)를 기본적으로 자동 다운로드하지 않는다** — `CertStore`로 직접 공급하거나(위 `addCertStore(rootArl)`), 시스템 속성 `com.sun.security.enableCRLDP=true`로 CRLDP 네트워크 다운로드를 허용해야 한다.

### 4.4. (보조) BouncyCastle 네이티브 경로 API

BC는 `org.bouncycastle.cert.path` 저수준 API도 제공한다. 개별 검증 단계를 조립한다.

```java
import org.bouncycastle.cert.path.*;
import org.bouncycastle.cert.path.validations.*;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.operator.jcajce.JcaX509ContentVerifierProviderBuilder;

CertPath bcPath = new CertPath(new X509CertificateHolder[]{ eeHolder, caHolder, rootHolder });
CertPathValidationResult r = bcPath.validate(new CertPathValidation[]{
        new ParentCertIssuedValidation(
                new JcaX509ContentVerifierProviderBuilder().setProvider("BC")),
        new BasicConstraintsValidation(),
        new KeyUsageValidation()
});
System.out.println("BC 경로 유효: " + r.isValid());
```

> 일반적으로는 표준 JCA(§4.1~4.3)가 폐기·정책까지 포괄해 실무에 적합하다. BC 네이티브 API는 세밀 제어가 필요할 때 쓴다.

---

## 5. 주의사항

- **CertPath에 루트 미포함** — 신뢰 앵커(루트)는 `TrustAnchor`로만 제공하고 `CertPath`에는 EE~중간만 담는다.
- **순서** — `CertPath`는 EE(리프)부터 상위 방향으로 정렬한다.
- **폐기 기본값** — `PKIXParameters`의 `revocationEnabled` 기본은 true다. 데모에서 끄지 않으면 CRL 접근 실패로 예외가 날 수 있다.
- **기준 시각** — `setDate` 미설정 시 현재 시각. 과거 시점 검증이 필요하면 명시한다.
- **실패 진단** — `CertPathValidatorException.getIndex()`로 어느 인증서에서 실패했는지 확인한다.

---

## Sources
- Java — CertPathValidator / PKIX: https://docs.oracle.com/en/java/javase/21/security/java-pki-programmers-guide.html
- BouncyCastle Javadoc — `org.bouncycastle.cert.path`: https://javadoc.io/doc/org.bouncycastle/bcpkix-jdk18on/latest/index.html
- RFC 5280 — Certification Path Validation (§6): https://datatracker.ietf.org/doc/html/rfc5280

---

## Related pages
- [[x509-certificate]] — 인증서 체인·검증 경로·폐기(CRL/OCSP) 개념
- [[certificate-revocation]] — CRL/OCSP 폐기 정보 개념·구조
- [[crl-java]] — 테스트용 CRL 생성 (같은 카테고리)
- [[cmp-bouncycastle]] — 테스트 인증서 체인 발급(같은 카테고리)
- [[openssl-x509]] — CLI로 체인·검증 확인
