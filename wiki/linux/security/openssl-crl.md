---
title: OpenSSL CRL — 인증서 폐기 목록 관리
updated: 2026-07-14 14:28:58
tags:
  - linux
  - openssl
  - crl
  - pki
  - security
---

## 1. 개요

`openssl crl`은 CRL(Certificate Revocation List, 인증서 폐기 목록) 파일을 처리하고 조회·변환·검증하는 도구이다. DER 또는 PEM 형식의 CRL 파일을 지원한다.

---

## 2. 주요 용도

### 2.1. CRL 내용 조회
CRL에 포함된 폐기된 인증서 목록과 발급자 정보를 텍스트 형식으로 확인한다.

```bash
# PEM 형식 CRL 조회
openssl crl -in list.crl -text -noout

# DER 형식 CRL 조회
openssl crl -in list.der -inform DER -text -noout
```

### 2.2. 형식 변환 — PEM ↔ DER

```bash
# PEM → DER
openssl crl -in list.crl -outform DER -out list.der

# DER → PEM
openssl crl -in list.der -inform DER -out list.crl
```

### 2.3. CRL 서명 검증
CRL 파일이 신뢰할 수 있는 CA에 의해 서명되었는지 확인한다.

```bash
# CA 인증서를 지정하여 CRL 서명 검증
openssl crl -in list.crl -CAfile ca.crt -verify -noout
```

- `-CAfile`, `-CApath`, `-CAstore` 중 하나라도 지정하면 `-verify`가 묵시적으로 활성화된다.
- 검증 실패 시 즉시 종료되며, 이후 옵션(`-gendelta` 등)은 실행되지 않는다.
- **OpenSSL 3.3+**: 검증 실패 시 exit code `1` 반환 (이전 버전과 동작 다름)

---

## 3. 필드별 정보 추출

전체 텍스트 대신 특정 필드 정보만 필요한 경우 사용할 수 있다.

```bash
# 발급자(Issuer) 확인
openssl crl -in list.crl -issuer -noout

# 업데이트 날짜 확인
openssl crl -in list.crl -lastupdate -nextupdate -noout

# CRL 번호 확인
openssl crl -in list.crl -crlnumber -noout

# 지문(Fingerprint) 출력
openssl crl -in list.crl -fingerprint -noout
```

---

## 4. 주요 옵션 정리

| 옵션 | 설명 |
|------|------|
| `-in <file>` | 입력 CRL 파일 (지정하지 않으면 stdin) |
| `-out <file>` | 출력 파일 (지정하지 않으면 stdout) |
| `-inform DER\|PEM` | 입력 형식 |
| `-outform DER\|PEM` | 출력 형식 (기본: PEM) |
| `-text` | CRL 상세 내용을 텍스트로 출력 |
| `-noout` | 인코딩된 CRL 자체는 출력하지 않음 |
| `-verify` | CRL의 서명 검증 |
| `-CAfile <file>` | 검증에 사용할 CA 인증서 파일 |
| `-hash` | 발급자 이름의 해시값 출력 (디렉터리 내 CRL 조회용) |
| `-hash_old` | OpenSSL 1.0.0 이전 방식의 해시값 출력 |
| `-nameopt <option>` | 발급자/주체 이름 표시 방식 |
| `-dateopt` | 날짜 출력 형식 (`rfc_822` / `iso_8601`, 기본: `rfc_822`) |
| `-key <file>` | CRL에 서명할 개인 키 파일 |
| `-keyform DER\|PEM\|P12` | 개인 키 형식 |
| `-badsig` | 서명을 훼손하여 출력 (테스트용) |
| `-CApath <dir>` | 검증에 사용할 CA 인증서 디렉터리 |
| `-CAstore <uri>` | 검증에 사용할 CA 저장소 URI |
| `-gendelta <file>` | 두 CRL 간의 차이(Delta)를 비교하여 출력 |

---

## Sources
- [openssl-crl (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-crl/)

---

## Related pages
- [[openssl-overview]]
- [[openssl-x509]]
- [[certificate-revocation]] — CRL·OCSP 폐기 개념
- [[crl-java]] — Java로 CRL 생성·파싱·검증 (BouncyCastle)
