---
title: BouncyCastle CMP — ir/ip 생성·파싱·POP 검증
updated: 2026-08-11 17:04:12
tags:
  - java
  - crypto
  - bouncycastle
  - cmp
  - pki
---

## 1. 개요

CMP 프로토콜 개념·메시지 구조는 [[cmp]] 참조. 이 문서는 **BouncyCastle**(`bcprov`+`bcpkix`)와 **JCA**로 `ir`/`ip`를 생성·파싱하고 **POP(Proof-of-Possession)** 를 검증하는 실행 예시다.

구성: EC(secp256r1) 키에 **서명 기반 POP**, 요청(`ir`)은 **PBM(MAC)**·응답(`ip`)은 **CA 서명**으로 보호한다. `ir`은 아직 인증서가 없어 공유 비밀(PBM), `ip`는 CA가 서명하는 구조는 [[cmp]] §5.1의 초기 신뢰 확립 맥락과 일치한다.

> 오류 처리·nonce 관리는 간략화한 예시다. 실무 주의사항은 §8 참조.

---

## 2. 의존성

- `org.bouncycastle:bcprov-jdk18on`, `org.bouncycastle:bcpkix-jdk18on` (1.78+)
- 주요 패키지: `asn1.cmp` / `asn1.crmf` / `cert.cmp` / `cert.crmf` / `operator`

```gradle
implementation("org.bouncycastle:bcprov-jdk18on:1.78.1")
implementation("org.bouncycastle:bcpkix-jdk18on:1.78.1")
```

---

## 3. 공통 준비

```java
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import java.security.*;
import java.security.spec.ECGenParameterSpec;

Security.addProvider(new BouncyCastleProvider());

// EE(요청자) 키쌍
KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC", "BC");
kpg.initialize(new ECGenParameterSpec("secp256r1"));
KeyPair eeKeyPair = kpg.generateKeyPair();   // ir의 subject 공개키 + POP 서명용 개인키

// CA 키쌍 + CA 인증서(ip 서명/발급용) — 데모용 자체 서명
KeyPair caKeyPair = kpg.generateKeyPair();

// PBM 공유 비밀(대역 외로 사전 배포된 값)과 참조번호(senderKID)
char[]  sharedSecret   = "s3cr3t-provisioned-oob".toCharArray();
byte[]  referenceNo    = "device-0001".getBytes();

X500Name eeName   = new X500Name("CN=device-0001");
X500Name caName   = new X500Name("CN=Demo CA");
```

---

## 4. ir 생성 — EE → CA

CRMF로 요청을 조립해 서명 POP를 포함하고, 요청 전체를 PBM(MAC)으로 보호한다.

```java
import org.bouncycastle.asn1.cmp.*;
import org.bouncycastle.asn1.crmf.CertReqMsg;
import org.bouncycastle.asn1.x509.GeneralName;
import org.bouncycastle.cert.crmf.CertificateRequestMessage;
import org.bouncycastle.cert.crmf.jcajce.JcaCertificateRequestMessageBuilder;
import org.bouncycastle.cert.cmp.ProtectedPKIMessage;
import org.bouncycastle.cert.cmp.ProtectedPKIMessageBuilder;
import org.bouncycastle.operator.MacCalculator;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.cert.crmf.jcajce.JcePKMACValuesCalculator;
import org.bouncycastle.cert.crmf.PKMACBuilder;
import java.math.BigInteger;
import java.util.Date;

// 4-1) CRMF 요청 + 서명 POP (EE 개인키로 CertRequest 서명)
JcaCertificateRequestMessageBuilder crmfBuilder =
        new JcaCertificateRequestMessageBuilder(BigInteger.ONE);   // certReqId = 1
crmfBuilder.setSubject(eeName);
crmfBuilder.setPublicKey(eeKeyPair.getPublic());
crmfBuilder.setProofOfPossessionSigningKeySigner(
        new JcaContentSignerBuilder("SHA256withECDSA").setProvider("BC")
                .build(eeKeyPair.getPrivate()));                    // ← POP 서명
CertificateRequestMessage certReqMsg = crmfBuilder.build();

// 4-2) CertReqMessages → PKIBody(ir = TYPE_INIT_REQ = 0)
CertReqMessages certReqMessages =
        new CertReqMessages(certReqMsg.toASN1Structure());
PKIBody irBody = new PKIBody(PKIBody.TYPE_INIT_REQ, certReqMessages);

// 4-3) PBM(MAC)으로 보호한 PKIMessage 조립
MacCalculator mac = new PKMACBuilder(new JcePKMACValuesCalculator())
        .build(sharedSecret);

ProtectedPKIMessage irMessage = new ProtectedPKIMessageBuilder(
                new GeneralName(eeName), new GeneralName(caName))
        .setBody(irBody)
        .setMessageTime(new Date())
        .setSenderKID(referenceNo)         // 어떤 공유 비밀인지 식별
        .setTransactionID("tx-0001".getBytes())
        .build(mac);

byte[] irEncoded = irMessage.toASN1Structure().getEncoded();   // 전송(예: HTTP application/pkixcmp)
```

---

## 5. ir 파싱 + PBM 검증 + POP 검증 — CA 측

```java
import org.bouncycastle.cert.cmp.GeneralPKIMessage;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.operator.ContentVerifierProvider;
import org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder;

// 5-1) 파싱 + 보호 확인
GeneralPKIMessage general = new GeneralPKIMessage(irEncoded);
if (!general.hasProtection()) throw new IllegalStateException("보호되지 않은 메시지");
ProtectedPKIMessage received = new ProtectedPKIMessage(general);

// 5-2) PBM(MAC) 검증 — 서버도 같은 공유 비밀 보유
boolean macOk = received.verify(
        new PKMACBuilder(new JcePKMACValuesCalculator()), sharedSecret);
System.out.println("PBM 검증: " + macOk);
// (실무: header.senderKID(referenceNo)로 어떤 비밀을 쓸지 조회)

// 5-3) 본문에서 CRMF 추출
if (received.getBody().getType() != PKIBody.TYPE_INIT_REQ)
        throw new IllegalStateException("ir 아님");
CertReqMessages reqs = CertReqMessages.getInstance(received.getBody().getContent());

for (CertReqMsg m : reqs.toCertReqMsgArray()) {
    CertificateRequestMessage crm = new CertificateRequestMessage(m);

    // 5-4) POP 검증 — 요청에 담긴 "자기 공개키"로 POP 서명 검증
    SubjectPublicKeyInfo spki = crm.getCertTemplate().getPublicKey();
    ContentVerifierProvider cvp = new JcaContentVerifierProviderBuilder()
            .setProvider("BC").build(spki);
    boolean popOk = crm.hasProofOfPossession() && crm.isValidSigningKeyPOP(cvp);
    System.out.println("POP 검증: " + popOk);
    if (!popOk) throw new SecurityException("POP 실패 — 개인키 소유 미증명");
}
```

---

## 6. ip 생성 — CA → EE

인증서를 발급하고 응답 메시지를 CA 서명으로 보호한다.

```java
import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.x509.Certificate;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;

// 6-1) CA가 인증서 발급 (요청의 공개키/subject 사용)
X509CertificateHolder issued = new JcaX509v3CertificateBuilder(
                caName,
                BigInteger.valueOf(System.currentTimeMillis()),
                new Date(), new Date(System.currentTimeMillis() + 365L*24*3600*1000),
                eeName,
                eeKeyPair.getPublic())
        .build(new JcaContentSignerBuilder("SHA256withECDSA").setProvider("BC")
                .build(caKeyPair.getPrivate()));

// 6-2) CertRepMessage(ip 본문) 조립 — certReqId는 요청과 동일(=1)
CMPCertificate cmpCert = new CMPCertificate(issued.toASN1Structure());
CertifiedKeyPair ckp   = new CertifiedKeyPair(new CertOrEncCert(cmpCert));
CertResponse resp = new CertResponse(
        new ASN1Integer(BigInteger.ONE),
        new PKIStatusInfo(PKIStatus.granted),
        ckp, null);
CertRepMessage repMessage = new CertRepMessage(null, new CertResponse[]{ resp });
PKIBody ipBody = new PKIBody(PKIBody.TYPE_INIT_REP, repMessage);   // ip = 1

// 6-3) CA 개인키 서명으로 보호(+extraCerts에 CA 인증서 동봉)
X509CertificateHolder caCertHolder = /* CA 자체서명 인증서 (§6 발급 패턴과 동일: issuer=subject=caName) */
        buildCaSelfSigned(caKeyPair, caName);
ContentSigner caSigner = new JcaContentSignerBuilder("SHA256withECDSA")
        .setProvider("BC").build(caKeyPair.getPrivate());

ProtectedPKIMessage ipMessage = new ProtectedPKIMessageBuilder(
                new GeneralName(caName), new GeneralName(eeName))
        .setBody(ipBody)
        .setMessageTime(new Date())
        .setTransactionID("tx-0001".getBytes())     // 요청과 동일 트랜잭션
        .addCMPCertificate(caCertHolder)             // extraCerts
        .build(caSigner);

byte[] ipEncoded = ipMessage.toASN1Structure().getEncoded();
```

---

## 7. ip 파싱 + CA 서명 검증 + 발급 인증서 추출 — EE 측

```java
import java.security.cert.CertificateFactory;
import java.io.ByteArrayInputStream;

GeneralPKIMessage ipGeneral = new GeneralPKIMessage(ipEncoded);
ProtectedPKIMessage ipReceived = new ProtectedPKIMessage(ipGeneral);

// 7-1) CA 공개키로 서명 보호 검증
boolean sigOk = ipReceived.verify(
        new JcaContentVerifierProviderBuilder().setProvider("BC")
                .build(caKeyPair.getPublic()));
System.out.println("ip 서명 검증: " + sigOk);

// 7-2) 발급된 인증서 추출
CertRepMessage rep = CertRepMessage.getInstance(ipReceived.getBody().getContent());
CertResponse cr = rep.getResponse()[0];
if (cr.getStatus().getStatus().intValue() != PKIStatus.GRANTED)
        throw new IllegalStateException("발급 거부: " + cr.getStatus());

Certificate certAsn1 = cr.getCertifiedKeyPair()
        .getCertOrEncCert().getCertificate().getX509v3PKCert();
java.security.cert.X509Certificate issuedCert = (java.security.cert.X509Certificate)
        CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(certAsn1.getEncoded()));
System.out.println("발급 인증서 subject: " + issuedCert.getSubjectX500Principal());

// 7-3) (실무) 이후 certConf → pkiconf 핸드셰이크로 수신 확정
```

---

## 8. 주의사항

- **POP 핵심**: `setProofOfPossessionSigningKeySigner`가 EE 개인키로 `CertRequest`를 서명 → CA가 `isValidSigningKeyPOP`로 **요청에 담긴 공개키**를 사용해 검증. 개인키 실보유를 증명한다.
- **보호(protection) 분리**: `ir`은 아직 인증서가 없어 **PBM(공유 비밀)**, `ip`는 CA가 **서명**한다([[cmp]] §5.1).
- `buildCaSelfSigned(...)`는 §6의 발급 코드와 동일 패턴(issuer=subject=caName, caKeyPair로 자체 서명)으로 구현.
- 실제 배포에선 `senderNonce`/`recipNonce`/`transactionID` 관리, `certReqId` 매칭, `certConf` 처리, 시간·재전송(replay) 검증을 반드시 추가한다.

---

## Sources
- BouncyCastle bcpkix Javadoc — `org.bouncycastle.cert.cmp` / `cert.crmf`: https://javadoc.io/doc/org.bouncycastle/bcpkix-jdk18on/latest/index.html
- RFC 4210 — CMP: https://www.rfc-editor.org/rfc/rfc4210
- RFC 4211 — CRMF: https://www.rfc-editor.org/rfc/rfc4211
- RFC 9810 — CMP(CMPv3): https://www.rfc-editor.org/rfc/rfc9810

---

## Related pages
- [[cmp]] — CMP 프로토콜 개념·메시지 구조·종류
- [[x509-certificate]] — 발급 대상 인증서 규격
- [[ml-kem]] — BouncyCastle 기반 PQC KEM 예시
- [[ml-dsa]] — BouncyCastle 기반 PQC 서명 예시
