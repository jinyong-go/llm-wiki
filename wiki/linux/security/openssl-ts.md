---
title: OpenSSL TS — RFC 3161 타임스탬프
updated: 2026-07-14 11:44:34
tags:
  - linux
  - openssl
  - timestamp
  - pki
  - cryptography
---

## 1. 개요

`openssl ts`는 RFC 3161 타임스탬프의 요청 생성·응답 생성(TSA)·검증을 수행한다. 프로토콜·토큰 구조는 [[timestamp-token]] 참고.

| 모드 | 역할 | 사용 주체 |
|------|------|----------|
| `-query` | 타임스탬프 요청(`.tsq`) 생성·출력 | 클라이언트 |
| `-reply` | 요청에 대한 응답(`.tsr`)/토큰 생성·출력 | TSA |
| `-verify` | 응답·토큰을 원본 데이터/요청과 대조해 검증 | 검증자 |

---

## 2. 요청 생성 (`-query`)

```bash
# 파일을 해시하여 요청 생성 (TSA 인증서 포함 요청)
openssl ts -query -data file.txt -sha256 -cert -out req.tsq

# 이미 계산된 해시로 요청 생성
openssl ts -query -digest 3a1b...f0 -sha256 -out req.tsq

# 요청 내용 확인
openssl ts -query -in req.tsq -text
```

| 옵션 | 설명 |
|------|------|
| `-data <file>` | 타임스탬프 대상 원본 파일 (해시는 명령이 계산) |
| `-digest <hex>` | 원본 없이 해시 값을 직접 지정 |
| `-sha256` 등 | 해시 알고리즘 (기본: **SHA-256**) |
| `-tspolicy <OID>` | 요청할 TSA 정책 OID ([[timestamp-token]] reqPolicy) |
| `-no_nonce` | nonce 제외 — 기본은 **64비트 의사난수 nonce 포함** (권장: 포함 유지) |
| `-cert` | 응답에 TSA 인증서 포함 요청 (certReq) |
| `-in` / `-text` | 기존 요청 파일 읽기 / 텍스트 출력 |

---

## 3. 응답 생성 (`-reply`)

`-reply`는 **config 파일(`tsa` 섹션)이 필요**하며, 일부 설정은 커맨드라인 옵션으로 재정의할 수 있다.

```bash
# 요청에 대한 응답 생성
openssl ts -reply -config tsa.cnf -queryfile req.tsq \
    -signer tsacert.pem -inkey tsakey.pem -out resp.tsr

# 응답 내용 확인
openssl ts -reply -in resp.tsr -text

# TimeStampResp 대신 토큰(ContentInfo)만 출력
openssl ts -reply -config tsa.cnf -queryfile req.tsq -token_out -out token.der
```

config 예시 (`tsa.cnf`):

```ini
[ tsa ]
default_tsa       = tsa_config1

[ tsa_config1 ]
serial            = tsaserial          # 일련번호 상태 파일 (필수)
signer_cert       = tsacert.pem        # TSA 서명 인증서
signer_key        = tsakey.pem         # TSA 개인키
signer_digest     = sha256             # 서명 다이제스트 (필수)
digests           = sha256, sha384, sha512   # 수용 해시 목록 (필수)
default_policy    = 1.2.3.4.1          # 기본 정책 OID
accuracy          = secs:1, millis:500 # 정확도 (TSTInfo accuracy)
ordering          = yes                # TSTInfo ordering
tsa_name          = yes                # TSTInfo tsa 필드 포함
ess_cert_id_alg   = sha256             # ESSCertID(v2) 해시 (기본 sha256)
ess_cert_id_chain = no                 # SigningCertificate에 체인 포함 여부
```

| 옵션 | 설명 |
|------|------|
| `-queryfile <file>` | 처리할 요청 파일 |
| `-signer` / `-inkey` | TSA 인증서 / 개인키 (critical `timeStamping` EKU 필수 — [[timestamp-token]] §6.1) |
| `-chain <file>` | 응답에 포함할 체인 인증서 |
| `-tspolicy <OID>` | 기본 정책 재정의 |
| `-token_out` | `TimeStampResp` 대신 토큰만 출력 |
| `-token_in` | 입력이 응답이 아닌 토큰임을 표시 |

---

## 4. 검증 (`-verify`)

검증 대상은 `-data`(원본), `-digest`(해시), `-queryfile`(원본 요청) 중 **하나만** 지정한다. 신뢰 루트(`-CAfile`/`-CApath`/`-CAstore`)는 필수.

```bash
# 원본 파일로 검증
openssl ts -verify -data file.txt -in resp.tsr -CAfile cacert.pem

# 원본 요청으로 검증 (TSA 인증서가 응답에 없으면 -untrusted로 공급)
openssl ts -verify -queryfile req.tsq -in resp.tsr \
    -CAfile cacert.pem -untrusted tsacert.pem

# 토큰 단독 검증
openssl ts -verify -data file.txt -in token.der -token_in -CAfile cacert.pem
```

| 옵션 | 설명 |
|------|------|
| `-data` / `-digest` / `-queryfile` | 대조 대상 (택 1) |
| `-CAfile` / `-CApath` / `-CAstore` | 신뢰 루트 인증서 (필수) |
| `-untrusted <file>` | 체인 구성용 중간/TSA 인증서 (신뢰하지 않음) |
| `-token_in` | 입력이 토큰(ContentInfo)임을 표시 |

---

## 5. HTTP 전송

`openssl ts` 자체는 RFC 3161의 HTTP/TCP 전송을 지원하지 않는다. HTTP 전송은 OpenSSL 부속 도구 `tsget` 또는 범용 HTTP 클라이언트를 사용한다 (Content-Type 규약은 [[timestamp-token]] §6.2).

```bash
# tsget — RFC 3161 HTTP 클라이언트 (여러 요청 일괄 전송 가능)
tsget -h https://tsa.example.com/tsr req.tsq   # req.tsr 생성

# curl
curl -H "Content-Type: application/timestamp-query" \
     --data-binary @req.tsq https://tsa.example.com/tsr -o resp.tsr
```

---

## 6. 주의사항

- `-reply`의 `serial` 파일은 잠금(locking) 없이 갱신되므로 동시 요청을 받는 운영 TSA 용도로는 부적합하다 — 테스트·데모 용도.
- TSA 인증서에는 critical `timeStamping` EKU가 있어야 하며, `openssl ts`가 이를 검사한다.
- nonce는 기본 포함이 안전하다. `-no_nonce`는 재전송 공격 탐지 수단을 포기하는 것.

---

## Sources
- [openssl-ts (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-ts/)
- [tsget (OpenSSL Documentation)](https://docs.openssl.org/master/man1/tsget/)

---

## Related pages
- [[timestamp-token]] — RFC 3161 개념 (프로토콜·토큰 구조·검증)
- [[openssl-overview]]
- [[openssl-cms]]
- [[openssl-dgst]]
- [[openssl-x509]]
