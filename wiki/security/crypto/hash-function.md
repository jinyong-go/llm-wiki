---
title: 해시 함수 (Hash Function)
updated: 2026-10-19 17:18:36
tags:
  - crypto
  - hash
  - security
---

## 1. 개요

해시 함수는 임의 길이의 입력을 다이제스트로 변환한다. 일반적인 해시는 출력 길이가 고정되며 SHAKE 같은 확장 출력 함수는 필요한 출력 길이를 지정한다. 이 문서는 암호학적 해시를 다룬다.

해시에는 복호화 연산이 정의되지 않는다. 안전한 암호학적 해시는 주어진 출력에 대응하는 입력을 찾기 어렵게 설계된다. 그러나 후보가 적은 입력은 후보별 해시를 계산해 알아낼 수 있으므로, 단방향성을 입력값의 비밀 보장과 혼동해서는 안 된다.

## 2. 성질과 구조

### 2.1. 요구 성질[^1]

- **결정성** — 동일 입력은 항상 동일 출력을 낸다.
- **프리이미지 저항성 (preimage resistance)** — 출력 $h$가 주어졌을 때 $H(x) = h$인 $x$를 찾는 것이 계산상 불가능.
- **제2프리이미지 저항성 (second-preimage resistance)** — 입력 $x_1$이 주어졌을 때 $H(x_1) = H(x_2)$인 다른 $x_2$를 찾는 것이 계산상 불가능.
- **충돌 저항성 (collision resistance)** — $H(x_1) = H(x_2)$인 임의의 서로 다른 $x_1, x_2$ 쌍을 찾는 것이 계산상 불가능.
- **눈사태 효과 (avalanche effect)** — 입력의 작은 변화가 출력 비트에 광범위하게 영향을 준다. 이상적인 경우 각 출력 비트는 약 1/2 확률로 변한다.

출력 길이가 $n$비트면 충돌 저항성의 이론적 상한은 생일 문제에 의해 $2^{n/2}$ 연산이다. 예컨대 $n=256$인 SHA-256의 상한은 $2^{128}$이다.

### 2.2. 내부 구조

#### 2.2.1. Merkle–Damgård

입력 메시지를 고정 크기 블록으로 나누고, 정해진 초기값 $IV$에서 시작해 압축 함수(compression function) $f$를 블록마다 순차 적용한다. $H_0 = IV$, $H_i = f(H_{i-1}, m_i)$로 체이닝하며, 출력은 마지막 체이닝 값 또는 그 일부를 사용한다. 메시지 길이를 패딩에 포함하는 Merkle–Damgård strengthening은 압축 함수의 충돌 저항성을 전체 해시로 연결하는 구성의 일부이며 모든 충돌을 원천적으로 막는다는 뜻은 아니다. MD5·SHA-1·SHA-2 계열이 이 구조를 사용한다.

SHA-256처럼 출력이 마지막 내부 상태를 모두 드러내는 구성에서는 길이 확장 공격이 가능하다. 공격자가 $H(m)$ 값과 $m$의 패딩 포함 길이만 알고 $m$ 자체는 몰라도, $H(m)$을 새로운 체이닝 값으로 삼아 그 뒤에 임의의 블록 $m'$을 이어붙여 $H(m \parallel pad \parallel m')$을 원본 $m$ 없이 계산할 수 있다. 이를 **length-extension 공격**이라 한다. 해시를 $H(\text{secret} \parallel \text{message})$ 형태로 MAC처럼 사용하면, 공격자가 secret 값을 몰라도 message 뒤에 임의 데이터를 덧붙이고 그에 대한 유효한 해시를 위조할 수 있어 위험하다.

#### 2.2.2. 스펀지

내부 상태를 비트 배열(크기 $b$)로 두고, 이를 **rate** $r$과 **capacity** $c$로 나눈다($b = r + c$). **흡수(absorb)** 단계에서는 입력을 $r$비트 블록으로 나눠 상태의 rate 부분에 XOR한 뒤 치환 함수를 적용하는 과정을 반복한다. **방출(squeeze)** 단계에서는 상태의 rate 부분을 그대로 출력으로 읽어내고, 더 많은 출력이 필요하면 치환 함수를 다시 적용한 뒤 이어서 읽는다. SHA-3의 치환 함수는 Keccak-$f$다.

capacity $c$에 해당하는 상태는 흡수·방출 어느 단계에서도 외부에 노출되지 않는다. Merkle–Damgård에서는 출력 자체가 다음 단계를 이어갈 수 있는 전체 내부 상태였지만, 스펀지에서는 출력(rate 부분)만으로 capacity를 포함한 전체 상태를 복원할 수 없어 공격자가 치환 함수를 이어서 적용할 수 없다. 이 때문에 스펀지 구조는 length-extension 공격에 안전하다. NIST는 이 특성을 활용해 SHA-3 전용 MAC인 **KMAC**(SP 800-185)을 별도로 표준화했다. 보안 강도는 capacity에 의해 결정되며 일반 공격 비용은 $2^{c/2}$다.

#### 2.2.3. HAIFA와 트리

Biham과 Dunkelman이 2007년 제안한 **HAIFA**(HAsh Iterative FrAmework)는 Merkle–Damgård의 압축 함수 입력에 **누적 비트 카운터**(지금까지 처리한 총 비트 수)와 **salt**를 추가한 구조다. 카운터가 포함되므로 동일한 체이닝 값이라도 처리 위치(몇 번째 블록인지)에 따라 압축 함수 출력이 달라져, 체이닝 값만으로 성립하는 멀티충돌·herding 등 구조적 공격을 막는다. BLAKE·BLAKE2가 이 구조를 사용하며, 카운터와 종료 플래그 $f_0$를 압축 함수 입력에 추가해 마지막 블록을 중간 블록과 다르게 처리하므로 출력값을 그대로 다음 압축의 입력 상태로 재사용할 수 없어 length-extension도 방어된다. 트리 모드에서는 마지막 노드 표시용 플래그 $f_1$을 추가로 사용한다.

BLAKE3는 여기서 더 나아가 **트리(tree) 구조**를 사용한다. 입력을 고정 크기 청크로 나눠 각 청크를 독립적으로 압축한 뒤, 청크 쌍을 상위 노드로 결합하는 과정을 반복해 이진 트리를 구성하고 최종 루트 노드의 출력이 해시값이 된다. 각 압축 호출에는 청크 시작·끝, parent, root 등 역할을 나타내는 플래그가 포함되어 내부 노드 출력과 최종 출력이 구분된다. 트리 구조 덕분에 청크 단위 병렬 처리(멀티코어·SIMD)가 가능해 SHA-2/SHA-3 대비 처리 속도가 빠르다.

## 3. 알고리즘

| 알고리즘 | 출력 길이 | 구조 | 표준 | 상태 |
|---|---|---|---|---|
| MD5 | 128비트 | Merkle–Damgård | RFC 1321 | **깨짐** — 2004년 충돌 발견, 사용 금지 |
| SHA-1 | 160비트 | Merkle–Damgård | FIPS 180-4 | **깨짐** — 2017년 SHAttered 충돌 공개, 사용 금지[^2] |
| SHA-2 (SHA-256/384/512 등) | 224~512비트 | Merkle–Damgård | FIPS 180-4 | 현재 표준 |
| SHA-3 (Keccak) | 224~512비트 (SHAKE는 가변) | 스펀지 | FIPS 202 | SHA-2와 병행하는 대안 표준[^3] |
| BLAKE2/BLAKE3 | 가변 | HAIFA/트리 | BLAKE2만 RFC 7693(Informational), BLAKE3는 비표준 | SHA-2보다 고속, FIPS 미승인 |

- **MD5·SHA-1**: 충돌 발견 가능 → 디지털 서명·인증서 등 무결성이 중요한 용도에는 사용 금지. 체크섬 등 비보안 용도로만 잔존.
- **SHA-2**: 현재 TLS·X.509 인증서·코드 서명 등 대부분의 실무 표준(SHA-256/SHA-384 위주).
- **SHA-3**: SHA-2와 다른 설계(스펀지)로 SHA-2가 미래에 깨질 경우의 대비책 성격. length-extension 내성이 필요한 경우 우선 고려.

## 4. HMAC

HMAC은 해시를 이중으로 중첩해 이 문제를 해결한다.

$$HMAC(K, m) = H\big((K' \oplus opad) \parallel H((K' \oplus ipad) \parallel m)\big)$$

내부 해시 결과는 외부 해시의 입력으로 사용되며 최종 MAC으로 직접 노출되지 않는다. 공격자가 이 내부 해시값을 안다 해도, 그것을 체이닝 값 삼아 이어붙이려면 외부 해시 $H((K' \oplus opad) \parallel \cdot)$ 전체를 다시 계산해야 하는데, 여기에는 공격자가 모르는 $(K' \oplus opad)$가 필요하다. 즉 내부 해시 출력을 그대로 이어 붙일 수 있는 경로가 외부 해시 계층에서 차단되므로, 키를 모르는 공격자는 length-extension을 이용할 수 없다.

## 5. 활용

### 5.1. 무결성과 서명

파일의 해시를 신뢰할 수 있는 경로로 얻은 값과 비교하면 데이터가 같은지 확인할 수 있다. 파일과 해시를 함께 바꿀 수 있는 공격자에게는 해시 비교만으로 대응할 수 없다. 인증서 지문도 별도 경로로 확보한 값과 비교해야 신뢰 판단에 사용할 수 있다.

RSA·ECDSA 서명은 해시와 알고리즘별 인코딩을 사용해 메시지를 처리한다. 충돌 공격으로 서로 다른 메시지의 해시를 같게 만들 수 있으면 서명 재사용 공격으로 이어질 수 있다. [[x509-certificate]]와 [[jwt]]의 서명도 사용하는 알고리즘의 해시 요구사항을 따른다.

다음은 UTF-8 입력의 SHA-256을 계산하는 실행 예제다.

```python
import hashlib

print(hashlib.sha256("hello".encode("utf-8")).hexdigest())
```

### 5.2. 메시지 인증

공유 비밀키로 메시지의 인증값을 계산할 때는 4장의 HMAC이나 표준 MAC을 사용한다. 일반 해시를 `H(secret || message)`로 조합하지 않는다. MAC 키를 가진 당사자는 모두 인증값을 만들 수 있으므로 전자서명과 같은 부인 방지 수단은 아니다.

### 5.3. 패스워드

패스워드는 후보를 빠르게 대입할 수 있으므로 SHA-256을 한 번 적용해 저장하지 않는다. 항목별 salt와 연산·메모리 비용을 갖춘 Argon2id 등의 패스워드 해시를 사용한다. 선택과 비용 설정은 [[kdf]]를 참고한다.

### 5.4. 데이터 구조

Git은 커밋·트리·blob 객체를 해시로 식별한다. 머클 트리는 하위 데이터의 해시를 상위 노드에 결합해, 신뢰하는 루트와 검증 경로로 데이터 포함 여부를 확인한다. 블록체인은 이전 블록의 해시로 연결 관계를 검증하며, 최종 이력에 대한 합의는 별도 프로토콜이 담당한다.

중복 제거 저장소는 해시로 동일 데이터의 후보를 찾는다. 충돌 시 데이터 손실이 허용되지 않는 설계라면 원본 비교 등 별도 확인 정책을 정해야 한다.[^5]

### 5.5. 커밋먼트

커밋먼트는 값을 지금 고정하고 나중에 공개하는 방식이다. 단순히 `H(m)`만 공개하면 값이 찬성·반대처럼 적은 후보 중 하나일 때 후보별 해시로 알아낼 수 있으므로 은닉이 보장되지 않는다.

해시 기반 구성의 예는 다음과 같다. `encode`는 메시지와 난수의 경계를 모호하지 않게 인코딩한다.

$$C = H(\operatorname{encode}(m, r))$$

커밋 시 예측 불가능한 비밀 난수 $r$을 생성하고 $C$만 공개한다. 공개 단계에서는 $m,r$을 전달해 검증한다. 충돌 저항성은 다른 값으로 열기 어렵게 하는 구속 성질에 관련되며, 은닉은 충분한 비밀 난수와 해시 모델 등의 추가 가정에 의존한다. 프리이미지 저항성만으로 두 성질을 모두 보장한다고 서술해서는 안 된다. 출처는 Stanford의 해시 기반 커밋먼트 강의 자료다.

## 6. 보안

- MD5·SHA-1은 신규 보안 설계에 사용하지 않는다. 레거시 HMAC-SHA1 사용 여부는 적용 프로토콜과 전환 정책을 별도로 확인한다.[^2]
- 패스워드는 [[kdf]]의 패스워드 기반 함수를 사용한다. 인증용 MAC과 일반 체크섬도 구분한다.
- 길이 확장 공격은 출력이 내부 상태를 드러내는 SHA-256 등의 구성에서 문제가 된다. 해시 출력이 잘린 SHA-384 등까지 같은 공격 조건으로 일반화하지 않는다.
- MAC 등 비밀에 의존하는 인증값을 직접 비교할 때는 상수 시간 비교를 사용한다. 공개 파일 체크섬 비교와 요구사항을 구분한다.

## 7. Git 전환

Git의 SHA-1 저장소는 알려진 충돌 패턴을 탐지하는 보호 기능을 사용하며 SHA-256 저장소 형식도 지원한다. Git 3.0의 신규 저장소 기본값 변경 계획과 기존 저장소 호환성은 공식 Breaking Changes 문서를 확인한다. 이 전환 계획은 해시 알고리즘의 보안 성질과 분리해 관리한다.

---

## Sources
- [RFC 2104: HMAC](https://www.rfc-editor.org/rfc/rfc2104.html)
- [Stanford CS355: Hash-Based Commitments](https://crypto.stanford.edu/cs355/23sp/lec3.pdf)
- [FIPS 180-4: Secure Hash Standard (SHS)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)
- [FIPS 202: SHA-3 Standard](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.202.pdf)
- [NIST SP 800-185: SHA-3-Derived Functions (cSHAKE, KMAC, TupleHash, ParallelHash)](https://csrc.nist.gov/pubs/sp/800/185/final)
- [NIST CSRC: Research Results on SHA-1 Collisions (2017)](https://csrc.nist.gov/news/2017/research-results-on-sha-1-collisions)
- [RFC 9155: Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2](https://www.rfc-editor.org/rfc/rfc9155.html)
- [A Framework for Iterative Hash Functions — HAIFA (Biham & Dunkelman, 2007)](https://eprint.iacr.org/2007/278)
- [BLAKE2: simpler, smaller, fast as MD5](https://eprint.iacr.org/2013/322.pdf)
- [RFC 7693: BLAKE2](https://www.rfc-editor.org/rfc/rfc7693)
- [Git hash function transition](https://git-scm.com/docs/hash-function-transition)
- [Git Breaking Changes](https://git-scm.com/docs/BreakingChanges)

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

[^5]: 저장소 설계에 대한 판단. 해시 충돌 가능성이 0은 아니므로, 허용할 오류와 데이터 손실의 범위에 따라 원본 비교 여부를 정한다.
