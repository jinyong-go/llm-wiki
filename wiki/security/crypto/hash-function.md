---
title: 해시 함수 (Hash Function)
updated: 2026-09-05 23:22:44
tags:
  - crypto
  - hash
  - security
---

## 1. 개요

임의 길이의 입력을 고정 길이의 출력(다이제스트)으로 변환하는 함수. 역함수가 존재하지 않아 출력에서 입력을 복원할 수 없다는 의미로 **단방향(one-way)** 함수라 부른다.

"단방향 암호화"는 통상적 용어이나 엄밀히는 암호화(encryption)가 아니다. 암호화는 키로 복호화가 가능한 양방향 변환([[cms]] 등)인 반면, 해시는 복호화 자체가 정의되지 않는다. 별도의 키 없이 입력만으로 출력이 결정된다.

---

## 2. 원리

### 2.1. 요구 성질[^1]

- **결정성** — 동일 입력은 항상 동일 출력을 낸다.
- **프리이미지 저항성 (preimage resistance)** — 출력 $h$가 주어졌을 때 $H(x) = h$인 $x$를 찾는 것이 계산상 불가능.
- **제2프리이미지 저항성 (second-preimage resistance)** — 입력 $x_1$이 주어졌을 때 $H(x_1) = H(x_2)$인 다른 $x_2$를 찾는 것이 계산상 불가능.
- **충돌 저항성 (collision resistance)** — $H(x_1) = H(x_2)$인 임의의 서로 다른 $x_1, x_2$ 쌍을 찾는 것이 계산상 불가능.
- **눈사태 효과 (avalanche effect)** — 입력을 1비트만 바꿔도 출력이 완전히 달라진다.

출력 길이가 $n$비트면 충돌 저항성의 이론적 상한은 생일 문제에 의해 $2^{n/2}$ 연산이다. 예컨대 $n=256$인 SHA-256의 상한은 $2^{128}$이다.

### 2.2. 내부 구조

#### 2.2.1. Merkle–Damgård

입력 메시지를 고정 크기 블록으로 나누고, 정해진 초기값 $IV$에서 시작해 압축 함수(compression function) $f$를 블록마다 순차 적용한다. $H_0 = IV$, $H_i = f(H_{i-1}, m_i)$로 체이닝하며, 마지막 블록 처리 후의 체이닝 값 $H_n$이 곧 해시 출력이 된다. 메시지 길이를 패딩에 포함시키는 Merkle–Damgård strengthening으로 서로 다른 길이의 입력 간 충돌을 막는다. MD5·SHA-1·SHA-2 계열이 이 구조를 사용한다.

이 구조의 구조적 약점은 **출력이 곧 마지막 내부 상태와 동일**하다는 점이다. 공격자가 $H(m)$ 값과 $m$의 패딩 포함 길이만 알고 $m$ 자체는 몰라도, $H(m)$을 새로운 체이닝 값으로 삼아 그 뒤에 임의의 블록 $m'$을 이어붙여 $H(m \parallel pad \parallel m')$을 원본 $m$ 없이 계산할 수 있다. 이를 **length-extension 공격**이라 한다. 해시를 $H(\text{secret} \parallel \text{message})$ 형태로 MAC처럼 사용하면, 공격자가 secret 값을 몰라도 message 뒤에 임의 데이터를 덧붙이고 그에 대한 유효한 해시를 위조할 수 있어 위험하다.

#### 2.2.2. HMAC의 방어 원리

HMAC은 해시를 이중으로 중첩해 이 문제를 해결한다.

$$HMAC(K, m) = H\big((K' \oplus opad) \parallel H((K' \oplus ipad) \parallel m)\big)$$

내부 해시 $H((K' \oplus ipad) \parallel m)$의 결과는 그 자체로 최종 출력이 아니라 외부 해시 입력의 일부로만 쓰인다. 공격자가 이 내부 해시값을 안다 해도, 그것을 체이닝 값 삼아 이어붙이려면 외부 해시 $H((K' \oplus opad) \parallel \cdot)$ 전체를 다시 계산해야 하는데, 여기에는 공격자가 모르는 $(K' \oplus opad)$가 필요하다. 즉 내부 해시 출력을 그대로 이어 붙일 수 있는 경로가 외부 해시 계층에서 차단되므로, 키를 모르는 공격자는 length-extension을 이용할 수 없다.

#### 2.2.3. 스펀지 (Sponge)

내부 상태를 비트 배열(크기 $b$)로 두고, 이를 **rate** $r$과 **capacity** $c$로 나눈다($b = r + c$). **흡수(absorb)** 단계에서는 입력을 $r$비트 블록으로 나눠 상태의 rate 부분에 XOR한 뒤 치환 함수를 적용하는 과정을 반복한다. **방출(squeeze)** 단계에서는 상태의 rate 부분을 그대로 출력으로 읽어내고, 더 많은 출력이 필요하면 치환 함수를 다시 적용한 뒤 이어서 읽는다. SHA-3의 치환 함수는 Keccak-$f$다.

capacity $c$에 해당하는 상태는 흡수·방출 어느 단계에서도 외부에 노출되지 않는다. Merkle–Damgård에서는 출력 자체가 다음 단계를 이어갈 수 있는 전체 내부 상태였지만, 스펀지에서는 출력(rate 부분)만으로 capacity를 포함한 전체 상태를 복원할 수 없어 공격자가 치환 함수를 이어서 적용할 수 없다. 이 때문에 스펀지 구조는 length-extension 공격에 안전하다. NIST는 이 특성을 활용해 SHA-3 전용 MAC인 **KMAC**(SP 800-185)을 별도로 표준화했다. 보안 강도는 capacity에 의해 결정되며 일반 공격 비용은 $2^{c/2}$다.

#### 2.2.4. HAIFA / 트리 구조

Biham과 Dunkelman이 2007년 제안한 **HAIFA**(HAsh Iterative FrAmework)는 Merkle–Damgård의 압축 함수 입력에 **누적 비트 카운터**(지금까지 처리한 총 비트 수)와 **salt**를 추가한 구조다. 카운터가 포함되므로 동일한 체이닝 값이라도 처리 위치(몇 번째 블록인지)에 따라 압축 함수 출력이 달라져, 체이닝 값만으로 성립하는 멀티충돌·herding 등 구조적 공격을 막는다. BLAKE·BLAKE2가 이 구조를 사용하며, 카운터와 종료 플래그 $f_0$를 압축 함수 입력에 추가해 마지막 블록을 중간 블록과 다르게 처리하므로 출력값을 그대로 다음 압축의 입력 상태로 재사용할 수 없어 length-extension도 방어된다. 트리 모드에서는 마지막 노드 표시용 플래그 $f_1$을 추가로 사용한다.

BLAKE3는 여기서 더 나아가 **트리(tree) 구조**를 사용한다. 입력을 고정 크기 청크로 나눠 각 청크를 독립적으로 압축한 뒤, 청크 쌍을 상위 노드로 결합하는 과정을 반복해 이진 트리를 구성하고 최종 루트 노드의 출력이 해시값이 된다. 각 압축 호출에는 청크 시작·끝, parent, root 등 역할을 나타내는 플래그가 포함되어 내부 노드 출력과 최종 출력이 구분된다. 트리 구조 덕분에 청크 단위 병렬 처리(멀티코어·SIMD)가 가능해 SHA-2/SHA-3 대비 처리 속도가 빠르다.

---

## 3. 주요 알고리즘

| 알고리즘 | 출력 길이 | 구조 | 표준 | 상태 |
|---|---|---|---|---|
| MD5 | 128비트 | Merkle–Damgård | RFC 1321 | **깨짐** — 2004년 충돌 발견, 사용 금지 |
| SHA-1 | 160비트 | Merkle–Damgård | FIPS 180-4 | **깨짐** — 2017년 SHAttered 충돌 공개, 사용 금지[^2] |
| SHA-2 (SHA-256/384/512 등) | 224~512비트 | Merkle–Damgård | FIPS 180-4 | 현재 표준 |
| SHA-3 (Keccak) | 224~512비트 (SHAKE는 가변) | 스펀지 | FIPS 202 | SHA-2와 병행하는 대안 표준, 신규 설계 권장[^3] |
| BLAKE2/BLAKE3 | 가변 | HAIFA/트리 | 비표준(RFC 7693) | SHA-2보다 고속, FIPS 미승인 |

- **MD5·SHA-1**: 충돌 발견 가능 → 디지털 서명·인증서 등 무결성이 중요한 용도에는 사용 금지. 체크섬 등 비보안 용도로만 잔존.
- **SHA-2**: 현재 TLS·X.509 인증서·코드 서명 등 대부분의 실무 표준(SHA-256/SHA-384 위주).
- **SHA-3**: SHA-2와 다른 설계(스펀지)로 SHA-2가 미래에 깨질 경우의 대비책 성격. length-extension 내성이 필요한 경우 우선 고려.

---

## 4. 주요 활용 사례

### 4.1. 무결성 검증

파일 다운로드 후 배포자가 공개한 해시값과 로컬에서 계산한 해시값을 비교해 전송 중 손상이나 변조 여부를 확인한다. Git은 커밋·트리·blob 객체를 SHA-1 해시로 식별하는데, SHAttered 충돌 공개 이후 알려진 충돌 패턴을 탐지해 거부하는 기능을 기본 적용했고 SHA-256 전환을 진행 중이나 GitHub 등 호스팅 서비스 및 기존 저장소와의 상호운용성 미비로 아직 정체된 상태다[^4]. TLS 인증서의 지문(fingerprint) 역시 인증서 전체를 SHA-256으로 해시한 값으로, 별도 경로로 전달받은 지문과 대조해 신뢰 여부를 판단한다.

### 4.2. 디지털 서명

공개키 서명 알고리즘(RSA, ECDSA 등)은 원문 전체가 아니라 원문의 해시값에 서명한다. 원문 크기와 무관하게 고정 크기 해시에 서명하므로 연산량이 줄어든다. 또한 RSA처럼 서명 가능한 메시지 크기가 키 크기 이하로 제한되는 알고리즘에서도, 해시를 이용하면 이 제한과 무관하게 임의 크기의 원문에 서명할 수 있다. [[x509-certificate]]의 서명, [[jwt]]의 RS256/ES256 등이 이 방식이다. 이때 사용된 해시가 충돌 공격에 노출되면(MD5·SHA-1 사례), 서로 다른 두 원문이 같은 해시값을 갖도록 조작해 하나에 대한 서명을 다른 하나의 서명인 것처럼 재사용하는 위조가 가능해진다 — 서명용 해시에서 충돌 저항성이 특히 중요한 이유다.

### 4.3. 메시지 인증 (HMAC)

공유 비밀키와 해시를 결합해 메시지 위변조와 발신자 위장을 동시에 방지한다. 2.2.2에서 설명한 이중 해시 구조로 Merkle–Damgård 계열 해시의 length-extension 취약점을 구조적으로 차단하면서도, 기존 해시 함수를 그대로 재사용할 수 있어 널리 쓰인다.

### 4.4. 패스워드 저장

로그인 시스템은 원문 패스워드를 저장하지 않고 해시값만 저장한다. 다만 SHA-256 등을 단발로 적용하면 salt 없이 동일 패스워드가 항상 동일 해시로 노출되고, GPU를 이용한 무차별 대입 속도도 매우 빨라 그대로 사용해서는 안 된다. 실무에서는 salt와 의도적 연산·메모리 비용을 부과하는 별도의 KDF(Argon2id, bcrypt 등)를 사용한다 — [[kdf]].

### 4.5. 블록체인

각 블록 헤더에 이전 블록의 해시값을 포함시켜 블록을 체이닝한다. 특정 과거 블록의 내용을 변경하면 그 블록의 해시가 바뀌고 이후 모든 블록의 해시가 연쇄적으로 달라지므로 위조가 즉시 드러난다. 비트코인의 작업증명(Proof of Work)은 SHA-256을 반복 적용해 선행 0비트 개수 등 특정 조건을 만족하는 해시를 찾는 데 소요되는 연산량으로 난이도를 조절한다. 블록 내 다수 트랜잭션은 머클 트리(Merkle Tree)로 묶여, 루트 해시 하나만으로 전체 트랜잭션 집합의 무결성을 검증할 수 있다.

### 4.6. 데이터 중복 제거 (Deduplication)

파일이나 블록 단위로 해시를 계산해 저장소에 이미 동일한 해시가 존재하면 원본 대신 참조만 저장한다. 충돌 저항성이 확보된 해시라면 서로 다른 두 데이터가 우연히 같은 해시를 가질 확률이 무시할 수준이므로, 해시 일치를 사실상 데이터 일치로 간주해도 안전하다는 전제로 동작한다.

### 4.7. 커밋먼트 스킴

값을 즉시 공개하지 않고 그 해시값만 먼저 상대에게 전달한 뒤, 이후 시점에 원본 값을 공개해 검증받는 방식. 프리이미지 저항성 덕분에 해시만으로는 원본 값을 추측할 수 없어 은닉(hiding)이 보장되고, 충돌 저항성 덕분에 공개 시점에 다른 값으로 바꿔치기할 수 없어 구속(binding)이 보장된다.

---

## 5. 보안 고려사항

- MD5·SHA-1은 신규 설계에 사용하지 않는다. 레거시 호환 목적으로 쓰이는 HMAC-SHA1은 예외적으로 아직 허용되는 경우가 있다[^2].
- 패스워드에는 해시 단독이 아닌 salt+비용 파라미터를 갖춘 KDF를 사용한다 — [[kdf]].
- Merkle–Damgård 계열 해시를 MAC처럼 직접 사용하지 않는다. length-extension 공격에 노출되므로(2.2.1) 반드시 HMAC 구조를 사용한다.
- 비교는 상수 시간 비교(`MessageDigest.isEqual()` 등)를 사용해 타이밍 부채널을 차단한다.

---

## Sources
- [FIPS 180-4: Secure Hash Standard (SHS)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)
- [FIPS 202: SHA-3 Standard](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.202.pdf)
- [NIST SP 800-185: SHA-3-Derived Functions (cSHAKE, KMAC, TupleHash, ParallelHash)](https://csrc.nist.gov/pubs/sp/800/185/final)
- [NIST CSRC: Research Results on SHA-1 Collisions (2017)](https://csrc.nist.gov/news/2017/research-results-on-sha-1-collisions)
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155.html)
- [A Framework for Iterative Hash Functions — HAIFA (Biham & Dunkelman, 2007)](https://eprint.iacr.org/2007/278)
- [BLAKE2: simpler, smaller, fast as MD5](https://eprint.iacr.org/2013/322.pdf)
- [RFC 7693: BLAKE2](https://www.rfc-editor.org/rfc/rfc7693)
- [Git hash function transition](https://git-scm.com/docs/hash-function-transition)

---

## Related pages
- [[kdf]]
- [[jwt]]
- [[x509-certificate]]
- [[openssl-dgst]]
- [[cms]]

---

[^1]: 세 저항성 개념 정의는 FIPS 180-4/202의 서술을 요약함.
[^2]: NIST는 2011년 SHA-1을 deprecated, 2013년 말부터 디지털 서명 용도 사용을 금지했음. RFC 9155/NIST 발표에 따르면 HMAC-SHA1(레코드 보호 등 MAC 용도)은 별도 deprecated 대상이 아님.
[^3]: SHA-3는 SHA-2를 대체하기 위한 표준이 아니라, 별도 설계 기반의 대안으로 제공됨(FIPS 202 서문).
[^4]: Git의 SHA-256 지원은 2018년 이후 진행 중이나, 호스팅 서비스 및 기존 저장소와의 상호운용성 미비로 실질적 전환은 정체된 상태.
