---
title: ML-KEM — 격자 기반 KEM (FIPS 203)
updated: 2026-09-07 22:18:44
tags:
  - crypto
  - pqc
  - ml-kem
  - lattice
---

## 1. 개념

**ML-KEM**(Module-Lattice-Based Key-Encapsulation Mechanism)은 NIST **FIPS 203**(2024) 표준 PQC(Post-Quantum Cryptography) 키 캡슐화 메커니즘이다. CRYSTALS-**Kyber**를 표준화한 것이다.

- **KEM이란**: 캡슐화 키로 **공유 비밀(shared secret) + 암호문(ciphertext)** 을 생성하고(`Encaps`), 복호화 키로 같은 비밀을 복원한다(`Decaps`). 임의 평문을 암호화하는 것이 아니라 **대칭키 합의**를 수행한다.
- **세 알고리즘**: `KeyGen`(키쌍) → `Encaps`(송신측) → `Decaps`(수신측).
- **2단 구조**: MLWE 격자 문제 위에 IND-CPA 공개키 암호 **K-PKE**를 세우고(§4), 이를 **Fujisaki–Okamoto 변환**으로 IND-CCA2 KEM으로 승격한다(§5).

```
송신측                                수신측
                          캡슐화 키 ek ←── KeyGen() → (ek, dk)
Encaps(ek) → (K, c)  ── c ──▶  Decaps(dk, c) → K
   K로 AES 키 사용            K로 AES 키 사용 (양측 동일 K)
```

FIPS 203은 "공개키/개인키" 대신 **캡슐화 키(ek)** / **복호화 키(dk)** / **공유 비밀 키(K)** 로 용어를 구분한다. Java 구현은 [[ml-kem-bouncycastle]] 참조.

---

## 2. 대수 구조

### 2.1. 다항식 링 $R_q$

$$R_q = \mathbb{Z}_q[X]/(X^{n}+1), \qquad n = 256,\quad q = 3329 = 2^8 \cdot 13 + 1$$

원소는 계수 256개짜리 다항식이다. $X^{256} \equiv -1$ 이므로 곱셈은 **negacyclic convolution** — 차수 256을 넘는 항이 부호를 뒤집어 되접힌다. $q$의 비트 길이가 12이므로 계수 하나는 12비트, 다항식 하나는 $256 \times 12 / 8 = 384$ byte로 직렬화된다(`ByteEncode12`). 이 384가 모든 키 크기 공식의 단위다(§6.2).

### 2.2. 모듈 $R_q^k$

$R_q$를 $k$번 데카르트 곱한 **모듈**이 비밀·잡음·공개값이 사는 공간이다. 보안 강도는 링 $R_q$를 고정한 채 **$k$만 바꿔** 조절하므로, 세 파라미터 세트가 NTT·샘플링·직렬화 구현을 그대로 공유한다.

- $k = 1$ 이면 **RLWE**(Ring-LWE), $n = 1$ 이면 **LWE**. 모듈 격자는 그 사이의 절충으로, RLWE의 구조적 위험을 줄이면서 LWE의 큰 키를 피한다.

### 2.3. NTT

$q \equiv 1 \pmod{256}$ 이므로 $\mathbb{Z}_q$ 안에 원시 256제곱근이 존재하지만($\zeta = 17$, $\zeta^{128} \equiv -1$) **512제곱근은 없다**. 따라서 $X^{256}+1$은 1차가 아니라 **2차 인수 128개**까지만 분해된다.

$$X^{256} + 1 = \prod_{i=0}^{127}\left(X^2 - \zeta^{2\,\mathrm{BitRev}_7(i)+1}\right)$$

중국인의 나머지 정리로 $R_q$는 2차 확대체 128개의 직합과 동형이다.

$$T_q := \bigoplus_{i=0}^{127} \mathbb{Z}_q[X]/\left(X^2 - \zeta^{2\,\mathrm{BitRev}_7(i)+1}\right) \;\cong\; R_q$$

**NTT**는 이 동형사상이며, $f \times_{R_q} g = \mathrm{NTT}^{-1}(\hat f \times_{T_q} \hat g)$ 가 성립한다. $T_q$에서의 곱셈은 1차 다항식 쌍 128번의 곱이라 소박한 $O(n^2)$ 곱셈이 $O(n \log n)$ 나비 연산 + 128회 기저 곱으로 줄어든다.

FIPS 203은 NTT를 최적화가 아닌 **명세의 일부**로 규정한다 — 행렬 $\hat{\mathbf{A}}$는 처음부터 NTT 도메인에서 샘플링되고, 키도 NTT 표현 그대로 인코딩·저장된다. 즉 `ek`/`dk` 바이트열은 $\hat{\mathbf{t}}, \hat{\mathbf{s}}$이지 $\mathbf{t}, \mathbf{s}$가 아니다.

---

## 3. MLWE

### 3.1. 문제

$\mathbf{A} \in R_q^{k \times k}$ 를 균등하게, $\mathbf{s}, \mathbf{e} \in R_q^k$ 를 작은 잡음 분포에서 뽑아 $\mathbf{t} = \mathbf{A}\mathbf{s} + \mathbf{e}$ 를 공개한다.

- **탐색 MLWE**: $(\mathbf{A}, \mathbf{t})$ 로부터 $\mathbf{s}$ 를 복원
- **결정 MLWE**: $(\mathbf{A}, \mathbf{t})$ 를 균등 분포와 구별

$\mathbf{t}$는 $\mathbf{s}$에 대한 **잡음 섞인 연립방정식**이다. 잡음 $\mathbf{e}$가 없으면 가우스 소거로 즉시 풀리지만, 잡음이 있으면 오차 누적으로 소거가 무의미해진다. 최선의 공격은 격자 축소(BKZ 등)이며 비용이 차원에 지수적이다.

Shor 알고리즘은 아벨 은닉 부분군 문제(인수분해·이산로그)를 푸는 것이라 격자 문제에는 적용되지 않는다. 이것이 RSA/ECC 대비 양자 내성의 근거다.

### 3.2. 잡음 분포 — CBD

잡음은 이산 가우시안 대신 **중심 이항 분포**(CBD, Centered Binomial Distribution) $\mathcal{D}_\eta(R_q)$ 에서 뽑는다. 계수마다 $2\eta$개의 랜덤 비트를 소비해

$$f_i = \sum_{j=0}^{\eta-1} b_{2i\eta+j} \;-\; \sum_{j=0}^{\eta-1} b_{2i\eta+\eta+j} \pmod q$$

지지집합은 $[-\eta, \eta]$, 평균 0, 분산 $\eta/2$ 다. 가우시안을 충분히 근사하면서 **분기 없이 상수 시간으로 구현**되므로 부채널 내성이 좋다.

### 3.3. 균등 샘플링

$\hat{\mathbf{A}}$ 의 $k^2$개 원소는 공개 시드 $\rho$ 와 인덱스 $(i,j)$ 로부터 XOF(SHAKE128)를 **거부 샘플링**해 만든다(`SampleNTT`): 3바이트를 12비트 값 두 개로 쪼개 $q$ 미만인 것만 채택한다. 덕분에 캡슐화 키에는 $\hat{\mathbf{A}}$ 대신 **시드 32 byte만** 담기고, 캡슐화 측이 같은 행렬을 재생성한다.

---

## 4. K-PKE — IND-CPA 공개키 암호

ML-KEM의 내부 부품이다. 단독으로는 IND-CPA만 만족하므로 FIPS 203은 K-PKE를 독립 사용하지 못하게 한다.

### 4.1. KeyGen

시드 $d$ 32 byte를 받아

1. $(\rho, \sigma) \leftarrow G(d \,\|\, k)$ — 행렬 시드와 잡음 시드로 분리
2. $\hat{\mathbf{A}}[i,j] \leftarrow \mathrm{SampleNTT}(\rho \| j \| i)$
3. $\mathbf{s}, \mathbf{e} \leftarrow \mathcal{D}_{\eta_1}(R_q)^k$ (PRF$(\sigma, N)$ 로 구동)
4. $\hat{\mathbf{t}} = \hat{\mathbf{A}} \circ \hat{\mathbf{s}} + \hat{\mathbf{e}}$
5. $ek_{\mathrm{PKE}} = \mathrm{ByteEncode}_{12}(\hat{\mathbf{t}}) \,\|\, \rho$, $\quad dk_{\mathrm{PKE}} = \mathrm{ByteEncode}_{12}(\hat{\mathbf{s}})$

$G$의 입력에 $k$ 바이트를 붙이는 것은 **도메인 분리**다. 키를 시드 형태로 보관했다가 다른 파라미터 세트로 잘못 확장하면 전혀 무관한 키가 나오게 해, 보안 등급 혼용을 막는다.

### 4.2. Encrypt

캡슐화 키 $ek$, 32 byte 평문 $m$, 32 byte 난수 $r$ 로부터

$$\mathbf{y} \leftarrow \mathcal{D}_{\eta_1}(R_q)^k, \quad \mathbf{e}_1 \leftarrow \mathcal{D}_{\eta_2}(R_q)^k, \quad e_2 \leftarrow \mathcal{D}_{\eta_2}(R_q)$$

$$\mathbf{u} = \mathbf{A}^\top \mathbf{y} + \mathbf{e}_1, \qquad v = \mathbf{t}^\top \mathbf{y} + e_2 + \mu$$

$$c = \mathrm{Compress}_{d_u}(\mathbf{u}) \,\|\, \mathrm{Compress}_{d_v}(v)$$

여기서 $\mu = \mathrm{Decompress}_1(m)$ 은 평문의 각 비트를 계수 하나에 싣는다 — 비트 0은 $0$, 비트 1은 $\lceil q/2 \rfloor = 1665$.

의미: $(\mathbf{A}, \mathbf{t})$ 가 $\mathbf{s}$ 에 대한 잡음 방정식계이므로, $\mathbf{y}$ 로 **무작위 선형결합**을 취하면 $\mathbf{s}$ 를 모른 채 같은 비밀에 대한 새 방정식을 하나 더 만들 수 있다. 그 방정식의 상수항 $v$ 를 $q/2$ 만큼 옮기느냐로 비트를 부호화한다. 계수가 256개이므로 한 암호문에 256비트를 담는다.

### 4.3. Decrypt

$$w = v' - \mathbf{s}^\top \mathbf{u}', \qquad m = \mathrm{Compress}_1(w)$$

$\mathrm{Compress}_1$ 은 계수가 $q/2$ 에 가까우면 1, $0$ 이나 $q$ 에 가까우면 0으로 반올림한다.

### 4.4. 압축

$$\mathrm{Compress}_d(x) = \left\lceil \frac{2^d}{q}\, x \right\rfloor \bmod 2^d, \qquad \mathrm{Decompress}_d(y) = \left\lceil \frac{q}{2^d}\, y \right\rfloor$$

계수당 12비트를 $d$ 비트로 줄여 암호문을 압축한다($d_u = 10$ 이면 12→10비트, 약 17% 절감). 두 성질이 중요하다.

- $\mathrm{Compress}_d(\mathrm{Decompress}_d(y)) = y$ 는 **항상** 성립 — 그래서 $\mu$ 부호화·복호가 무손실이다.
- 반대 방향은 계수당 최대 $\lceil q/2^{d+1} \rfloor$ 의 오차를 남긴다. 이 오차가 복호 잡음에 더해지므로 $d_u, d_v$ 는 **암호문 크기 ↔ 복호 실패율**의 트레이드오프다.

FIPS 203은 이 계산에 **부동소수점 사용을 금지**한다(유리수 연산으로 정확히 반올림). 반올림이 1 어긋나면 곧바로 복호 오류나 구현 간 불일치가 된다.

### 4.5. 복호 정확성

압축을 무시하면 큰 항이 정확히 상쇄된다.

$$v - \mathbf{s}^\top\mathbf{u} = (\mathbf{A}\mathbf{s}+\mathbf{e})^\top\mathbf{y} + e_2 + \mu - \mathbf{s}^\top(\mathbf{A}^\top\mathbf{y}+\mathbf{e}_1) = \mu + \underbrace{\mathbf{e}^\top\mathbf{y} - \mathbf{s}^\top\mathbf{e}_1 + e_2}_{\text{잡음}}$$

$\mathbf{s}^\top\mathbf{A}^\top\mathbf{y}$ 가 양쪽에 공통으로 나타나 사라지고, 남는 것은 **작은 값들의 곱과 합**뿐이다. 압축 오차 $\Delta\mathbf{u}, \Delta v$ 까지 포함하면 잡음은

$$\mathbf{e}^\top\mathbf{y} - \mathbf{s}^\top\mathbf{e}_1 + e_2 + \Delta v - \mathbf{s}^\top\Delta\mathbf{u}$$

$\mu$ 의 계수는 $0$ 또는 $1665$ 이므로, **잡음 계수의 절댓값이 모두 $q/4 \approx 832$ 미만**이면 $\mathrm{Compress}_1$ 이 원래 비트를 정확히 복원한다. 이 한계를 넘길 확률이 §6.3의 복호 실패율이다.

---

## 5. FO 변환 — IND-CCA2 KEM

### 5.1. 해시 함수

| 기호 | 정의 | 용도 |
|------|------|------|
| $H$ | SHA3-256 | 캡슐화 키 해시 $H(ek)$ |
| $G$ | SHA3-512 | 시드 분할, $(K, r)$ 도출 |
| $J$ | SHAKE256$(\cdot, 256)$ | 암묵적 거부 키 |
| PRF$_\eta(s,b)$ | SHAKE256$(s\|b,\ 512\eta)$ | CBD 바이트 스트림 |
| XOF | SHAKE128 | $\hat{\mathbf{A}}$ 샘플링 |

대칭 원시함수를 전부 **Keccak 계열**로 통일해, 구현이 스펀지 하나만 갖추면 되도록 했다([[hash-function]] 참조).

### 5.2. 알고리즘

```
KeyGen():
  d, z ←$ 32 byte
  (ek, dk_PKE) = K-PKE.KeyGen(d)
  dk = dk_PKE ‖ ek ‖ H(ek) ‖ z

Encaps(ek):
  m ←$ 32 byte
  (K, r) = G(m ‖ H(ek))
  c = K-PKE.Encrypt(ek, m, r)
  return (K, c)

Decaps(dk, c):
  m'      = K-PKE.Decrypt(dk_PKE, c)
  (K', r') = G(m' ‖ h)          // h = 저장된 H(ek)
  K̄       = J(z ‖ c)
  c'      = K-PKE.Encrypt(ek, m', r')   // 재암호화
  if c ≠ c' then K' = K̄
  return K'
```

### 5.3. IND-CCA2가 되는 이유

K-PKE 단독은 **연성(malleable)** 이다. 암호문을 조금 변형해 복호 오라클에 물어보면 비밀에 대한 정보가 새어 나간다. FO 변환은 세 가지로 이를 막는다.

1. **결정론화** — 암호화 난수 $r$ 을 평문 $m$ 의 해시에서 유도한다. 평문 하나에 정당한 암호문이 정확히 하나 대응한다.
2. **재암호화 검증** — 복호 측이 $m'$ 을 다시 암호화해 입력 암호문과 바이트 단위로 비교한다. 정직하게 생성되지 않은 암호문은 전부 걸러지므로, 복호 오라클이 무의미해진다.
3. **키 유도** — 공유 비밀 $K$ 는 $m$ 자체가 아니라 $G(m \| H(ek))$ 의 앞 32 byte다. $H(ek)$ 를 함께 해시하므로 **$K$ 가 수신자의 키에 묶인다**(키 오용·다중 키 공격 방어).

### 5.4. 암묵적 거부

재암호화가 불일치해도 오류를 반환하지 않고, 복호화 키에만 들어 있는 32 byte $z$ 로 만든 $\bar K = J(z \| c)$ 를 대신 반환한다. 공격자는 $\bar K$ 와 정상 $K$ 를 구별할 수 없다.

오류 코드·처리 시간의 차이 자체가 복호 오라클이 되기 때문이다. FIPS 203은 비교 결과 플래그를 **출력 금지**하고 종료 전에 폐기하도록 규정한다.

> 실무적 함의: `Decaps`는 사실상 절대 실패하지 않는다. 잘못된 암호문을 넣어도 32 byte가 나온다. 따라서 **상위 프로토콜이 도출한 키로 대칭 인증(AEAD 태그 검증 등)을 수행해** 키 불일치를 검출해야 한다.

### 5.5. 입력 검사

`Encaps` 전에 캡슐화 키를 검사한다.

1. **타입 검사** — 길이가 $384k+32$ byte인가
2. **모듈러 검사** — `ByteEncode12(ByteDecode12(ek[0:384k])) == ek[0:384k]`. `ByteDecode12`는 12비트 값을 $q$ 로 환산하므로 단사가 아니다. 왕복이 일치해야만 인코딩된 계수가 모두 $[0, q-1]$ 범위임이 보장된다.

`Decaps` 전에는 암호문 길이 $32(d_u k + d_v)$, 복호화 키 길이 $768k+96$, 그리고 `H(dk[384k:768k+32]) == dk[768k+32:768k+64]`(저장된 해시와 일치)를 검사한다. 키 검사는 다른 수단으로 보증해도 되지만 **암호문 길이 검사는 매 호출마다 필수**다.

### 5.6. Kyber 대비 변경점

- 공유 비밀 길이를 **256비트 고정**(round-3는 가변 길이)
- FO 변형 교체 — 공유 비밀 도출에서 **암호문 해시를 제거**($K = \mathrm{KDF}(\bar K \| H(c))$ 단계 삭제)
- `Encaps` 초입의 $m \leftarrow H(m)$ 제거 — 승인된 RBG 사용을 요구하므로 불필요
- 명시적 입력 검사 추가(§5.5)
- ipd → final: $G(d \| k)$ 도메인 분리 추가, $\hat{\mathbf{A}}$ 인덱스 뒤바뀜 수정

---

## 6. 파라미터

### 6.1. 세트

$n = 256$, $q = 3329$ 는 공통이고 나머지 다섯 개가 세트를 결정한다.

| 세트 | $k$ | $\eta_1$ | $\eta_2$ | $d_u$ | $d_v$ | 보안 카테고리 | 요구 RBG 강도 |
|------|-----|----------|----------|-------|-------|---------------|---------------|
| ML-KEM-512 | 2 | 3 | 2 | 10 | 4 | 1 (AES-128급) | 128 bit |
| ML-KEM-768 | 3 | 2 | 2 | 10 | 4 | 3 (AES-192급) | 192 bit |
| ML-KEM-1024 | 4 | 2 | 2 | 11 | 5 | 5 (AES-256급) | 256 bit |

$k$ 가 커지면 $\mathbf{e}^\top\mathbf{y}$ 의 항 수가 늘어 잡음이 커진다. 그래서 512는 $\eta_1 = 3$ 으로 잡음을 키워 보안을 확보하고, 1024는 반대로 $d_u, d_v$ 를 키워(압축 오차를 줄여) 실패율을 억제한다.

### 6.2. 크기

$$|ek| = 384k + 32, \qquad |dk| = 768k + 96, \qquad |c| = 32(d_u k + d_v), \qquad |K| = 32$$

$|dk|$ 의 내역은 $dk_{\mathrm{PKE}}(384k) + ek(384k+32) + H(ek)(32) + z(32)$ 다 — 재암호화 검증에 $ek$ 가 필요하므로 복호화 키가 캡슐화 키를 통째로 품는다.

| 세트 | 캡슐화 키 | 복호화 키 | 암호문 | 공유 비밀 |
|------|-----------|-----------|--------|-----------|
| ML-KEM-512 | 800 | 1632 | 768 | 32 |
| ML-KEM-768 | 1184 | 2400 | 1088 | 32 |
| ML-KEM-1024 | 1568 | 3168 | 1568 | 32 |

(단위: byte) 복호화 키는 시드 $(d, z)$ 64 byte만 저장했다가 재확장할 수도 있다. 이 경우 시드는 복호화 키와 동일한 민감도로 다뤄야 한다.

### 6.3. 복호 실패율

§4.5의 잡음이 $q/4$ 를 넘길 확률이다.

| 세트 | 실패율 |
|------|--------|
| ML-KEM-512 | $2^{-138.8}$ |
| ML-KEM-768 | $2^{-164.8}$ |
| ML-KEM-1024 | $2^{-174.8}$ |

FO 변환은 이 값이 충분히 작아야 IND-CCA2 증명이 성립한다 — 실패 사례를 대량으로 수집할 수 있으면 비밀 $\mathbf{s}$ 를 복원하는 공격(decryption failure attack)이 가능해지기 때문이다.

### 6.4. 세트 선택

NIST는 **ML-KEM-768을 기본 권장값**으로 명시한다(보안 여유 대비 성능 비용이 합리적). 처음 보호를 설정할 때는 가능한 한 강한 세트를 쓰되, 키·암호문 크기나 속도가 감당 가능한지 함께 판단한다.

---

## 7. 운영 고려

### 7.1. 장점

- **양자 내성** — 격자 기반이라 Shor 알고리즘의 대상이 아니다(RSA/ECDH 대체).
- **성능** — KeyGen/Encaps/Decaps 모두 빠르다. 연산이 작은 정수의 NTT와 Keccak뿐이라 부동소수점·큰 정수 산술이 필요 없다.
- **상수 시간 친화** — CBD 샘플링·NTT·암묵적 거부 모두 분기 없이 구현 가능.
- **표준화** — FIPS 203 정식 표준. BouncyCastle, OpenSSL 3.5+, OpenJDK 24+ 지원.

### 7.2. 제약

- **큰 키/암호문** — ECDH 공개키(32~65 byte) 대비 800~1568 byte. TLS 핸드셰이크의 첫 왕복 크기가 늘어난다.
- **KEM 한정** — 직접 암호화·서명 불가. 서명은 [[ml-dsa]](FIPS 204).
- **키 유도 필요성** — 공유 비밀은 균등 랜덤 32 byte라 대칭키로 직접 쓸 수 있지만, 여러 키를 파생하거나 세션 트랜스크립트를 바인딩하려면 [[kdf]]를 거친다.
- **실패를 알리지 않음** — §5.4. AEAD 인증으로 검출해야 한다.
- **신규성** — 전환기에는 검증된 고전 알고리즘과 결합한 **하이브리드(예: X25519 + ML-KEM-768)** 배치가 권장된다.[^1]

[^1]: FIPS 203 원문의 요구사항이 아니라 PQC 전환기의 업계 권고를 일반화한 주장임.

---

## 8. 요약

- ML-KEM = MLWE 격자 문제 위의 IND-CPA 암호 K-PKE + FO 변환 → IND-CCA2 KEM.
- 대수 구조는 $R_q = \mathbb{Z}_q[X]/(X^{256}+1)$, $q = 3329$; $X^{256}+1$이 2차 인수 128개로 쪼개져 NTT로 빠른 곱셈이 가능하다.
- 복호는 $v - \mathbf{s}^\top\mathbf{u}$ 에서 큰 항이 상쇄되고 남은 잡음이 $q/4$ 미만일 때 성립하며, 실패율은 $2^{-139}$ 이하.
- FO는 암호화 결정론화 + 재암호화 비교 + 암묵적 거부로 선택 암호문 공격을 차단한다.
- 세트는 512/768/1024, 기본 권장 768, 공유 비밀은 항상 32 byte.

---

## Sources
- NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism Standard: https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf
- NIST SP 800-227 — Recommendations for Key-Encapsulation Mechanisms: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf
- Avanzi et al. — CRYSTALS-Kyber algorithm specifications (round 3): https://csrc.nist.gov/Projects/post-quantum-cryptography/post-quantum-cryptography-standardization/round-3-submissions
- Bos et al. — CRYSTALS-Kyber: A CCA-secure module-lattice-based KEM (EuroS&P 2018): https://doi.org/10.1109/EuroSP.2018.00032
- Langlois, Stehlé — Worst-case to average-case reductions for module lattices: https://doi.org/10.1007/s10623-014-9938-4
- Regev — On lattices, learning with errors, random linear codes, and cryptography: https://doi.org/10.1145/1060590.1060603
- Hofheinz, Hövelmanns, Kiltz — A modular analysis of the Fujisaki-Okamoto transformation: https://doi.org/10.1007/978-3-319-70500-2_12
- Ducas, Schanck — Security estimation scripts for Kyber and Dilithium: https://github.com/pq-crystals/security-estimates

---

## Related pages
- [[ml-kem-bouncycastle]] — Java/BouncyCastle 구현 예시
- [[ml-dsa]] — 격자 기반 디지털 서명(FIPS 204), 같은 PQC 계열의 짝
- [[hash-function]] — SHA-3/SHAKE 스펀지 구조
- [[kdf]] — 공유 비밀에서 세션 키 유도(HKDF)
- [[openssl-keygen]] — RSA/EC/Ed25519 비대칭 키 생성 (고전 알고리즘 비교)
- [[openssl-overview]] — 대칭/비대칭 암호, 키·인증서 계층
- [[cms]] — 합의한 대칭키로 데이터 암호화(EnvelopedData)
- [[openssl-s_client]] — TLS 핸드셰이크(PQC 하이브리드 키 교환의 적용 지점)
