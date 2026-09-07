---
title: ML-DSA — 격자 기반 디지털 서명 (FIPS 204)
updated: 2026-09-07 22:27:37
tags:
  - crypto
  - pqc
  - ml-dsa
  - lattice
---

## 1. 개념

**ML-DSA**(Module-Lattice-Based Digital Signature Algorithm)는 NIST **FIPS 204**(2024) 표준 PQC(Post-Quantum Cryptography) 디지털 **서명** 알고리즘이다. CRYSTALS-**Dilithium**을 표준화한 것이다. 키 합의용인 [[ml-kem]]과 짝을 이루며, 이쪽은 **서명/검증**을 담당한다.

- **서명이란**: 개인키로 메시지에 서명(`Sign`)하고, 공개키로 무결성·발신자를 검증(`Verify`)한다.
- **세 알고리즘**: `KeyGen`(키쌍) → `Sign(sk, M, ctx)`(서명 생성) → `Verify(pk, M, σ, ctx)`(검증).
- **보안 목표**: **SUF-CMA**(Strongly Existentially Unforgeable under Chosen Message Attack) — 서명자가 임의 메시지에 서명하게 만들어도, 공격자는 이미 서명된 메시지에 대한 **다른** 유효 서명조차 만들 수 없다.
- **구성 원리**: MLWE + MSIS 격자 문제 위에 **Fiat–Shamir with Aborts**(FS-with-Aborts) 패러다임을 적용한 Schnorr류 서명이다.

Java 구현은 [[ml-dsa-bouncycastle]] 참조.

---

## 2. 대수 구조

$$R_q = \mathbb{Z}_q[X]/(X^{256}+1), \qquad q = 2^{23} - 2^{13} + 1 = 8380417$$

$q$는 [[ml-kem]]의 $q=3329$보다 훨씬 크다. $q \equiv 1 \pmod{512}$ 이므로 $\mathbb{Z}_q$ 안에 **원시 512제곱근** $\zeta = 1753$ 이 존재해, $X^{256}+1$이 **256개의 1차 인수로 완전히 분해**된다.

$$X^{256}+1 = \prod_{i=0}^{255}\left(X - \zeta^{2\,\mathrm{BitRev}_8(i)+1}\right)$$

$T_q \cong \mathbb{Z}_q^{256}$ — 계수 256개짜리 벡터 그 자체다. ML-KEM은 $q=3329$가 256제곱근만 갖고 512제곱근은 없어 2차 인수 128개까지만 쪼개졌지만([[ml-kem]] §2.3), ML-DSA는 $q$를 크게 잡아 **완전한 NTT**(원소별 곱셈)를 쓴다. 대신 $q$가 커진 만큼 계수당 비트 수(23비트)와 키·서명 크기가 늘어난다.

행렬 $\mathbf{A} \in R_q^{k\times \ell}$, 벡터 $\mathbf{s}_1 \in R_q^\ell$, $\mathbf{s}_2, \mathbf{t} \in R_q^k$ 가 기본 대수 대상이다. 세트 이름 "ML-DSA-$k\ell$"은 이 $(k,\ell)$ 차원을 직접 가리킨다(예: ML-DSA-65 → $k=6,\ \ell=5$).

---

## 3. 계산 가정

### 3.1. MLWE + MSIS

ML-DSA의 안전성은 $R_q$ 위의 **MLWE**(모듈 LWE)와, MSIS(Module Short Integer Solution)의 비표준 변형인 **SelfTargetMSIS**에 기반한다.

- **LWE류(MLWE)**: $\mathbf{A}, \mathbf{t}=\mathbf{A}\mathbf{s}_1+\mathbf{s}_2$ 로부터 작은 $\mathbf{s}_1, \mathbf{s}_2$ 를 복원하는 문제 — [[ml-kem]] §3과 같은 난제.
- **SIS류(MSIS)**: $\mathbf{A}\mathbf{t}=\mathbf{0}$ 을 만족하는 작은 노름의 $\mathbf{t}\neq\mathbf{0}$ 를 찾는 문제. 서명 위조가 곧 짧은 격자 벡터를 찾는 것과 동치가 되도록 구성된다.

### 3.2. Schnorr에서 FS-with-Aborts로

ML-DSA는 이산로그 기반 **Schnorr 서명**(커밋 $g^r$ → 챌린지 $c$ → 응답 $s=r-cx$)의 격자류 아날로그다. $\mathbf{A}, \mathbf{s}_1, \mathbf{s}_2, \mathbf{t}=\mathbf{A}\mathbf{s}_1+\mathbf{s}_2$ 를 두고

1. **커밋**: $\mathbf{y}$ 를 작은 계수로 뽑아 $\mathbf{w} = \mathbf{A}\mathbf{y}$
2. **챌린지**: $c$ 를 작은 계수 다항식으로
3. **응답**: $\mathbf{z} = \mathbf{y} + c\mathbf{s}_1$

문제는 $\mathbf{z}$ 가 비밀 $\mathbf{s}_1$ 방향으로 **편향**된다는 것이다 — 여러 서명을 모으면 $\mathbf{s}_1$이 통계적으로 드러난다(LWE 기반 서명의 초기 시도들이 겪은 문제). **FS-with-Aborts**는 이를 **거부 샘플링**으로 해결한다: $\mathbf{z}$(및 관련 잔차)가 정해진 범위를 벗어나면 서명을 버리고 새 $\mathbf{y}$로 처음부터 다시 시도한다. 범위 안에 들어온 $\mathbf{z}$의 분포는 비밀과 독립적이므로 편향이 사라진다. 이 아이디어가 §5의 거부 샘플링 루프다.

---

## 4. 키 생성

시드 $\xi$ 32 byte로부터:

1. $(\rho, \rho', K) \leftarrow H(\xi \,\|\, k \,\|\, \ell,\ 128)$ — 32+64+32 byte로 분할(도메인 분리에 $k,\ell$ 포함)
2. $\hat{\mathbf{A}} \leftarrow \mathrm{ExpandA}(\rho)$ — NTT 도메인에서 직접 샘플링
3. $(\mathbf{s}_1, \mathbf{s}_2) \leftarrow \mathrm{ExpandS}(\rho')$ — 계수가 $[-\eta, \eta]$ 인 짧은 벡터
4. $\mathbf{t} = \mathbf{A}\mathbf{s}_1 + \mathbf{s}_2$
5. $(\mathbf{t}_1, \mathbf{t}_0) \leftarrow \mathrm{Power2Round}(\mathbf{t})$ — 계수당 하위 $d=13$ 비트를 분리(§7)
6. $pk = \mathrm{pkEncode}(\rho, \mathbf{t}_1)$, $\quad tr = H(pk, 64)$
7. $sk = \mathrm{skEncode}(\rho, K, tr, \mathbf{s}_1, \mathbf{s}_2, \mathbf{t}_0)$

공개키에는 $\mathbf{t}$ 전체가 아니라 상위 비트 $\mathbf{t}_1$ 만 담긴다 — 하위 비트 $\mathbf{t}_0$ 는 서명 몇 개만 있으면 재구성 가능해 비밀로 취급할 이유가 없기 때문이다(성능 최적화이지 보안 목적이 아님). $tr$(공개키 해시)은 서명 시 재계산하지 않고 개인키에 캐시해 둔다.

---

## 5. 서명

`Sign(sk, M, ctx)` 는 컨텍스트 문자열 $ctx$(255 byte 이하, 기본 빈 문자열)를 메시지 앞에 인코딩한 뒤 내부 함수를 호출한다. 기본 **hedged** 모드는 매 서명마다 새 난수 $rnd$를 섞고, **결정론적** 모드는 $rnd = 0^{32}$ 로 고정한다(둘의 유일한 차이).

```
Sign_internal(sk, M', rnd):
  (ρ, K, tr, s1, s2, t0) = skDecode(sk)
  μ    = H(tr ‖ M', 64)              // 메시지 대표값
  ρ''  = H(K ‖ rnd ‖ μ, 64)          // 서명별 사설 시드
  κ = 0
  repeat:                              // 거부 샘플링 루프
    y  = ExpandMask(ρ'', κ)            // 계수 ∈ [-γ1+1, γ1]
    w  = A·y
    w1 = HighBits(w)                   // 커밋
    c̃  = H(μ ‖ w1Encode(w1), λ/4)      // 커밋 해시
    c  = SampleInBall(c̃)               // 챌린지, 계수 ∈ {-1,0,1}, 해밍weight τ
    z  = y + c·s1                      // 응답
    r0 = LowBits(w - c·s2)
    if ‖z‖∞ ≥ γ1-β or ‖r0‖∞ ≥ γ2-β: retry
    h = MakeHint(-c·t0, w - c·s2 + c·t0)
    if ‖c·t0‖∞ ≥ γ2 or weight(h) > ω: retry
    κ += ℓ
  return σ = sigEncode(c̃, z, h)
```

핵심은 **두 단계 거부 샘플링**이다.

1. $\lVert \mathbf{z}\rVert_\infty < \gamma_1-\beta$ 이고 $\lVert \mathbf{r}_0\rVert_\infty < \gamma_2-\beta$ — 응답과 저차 비트 잔차가 편향 없는 범위 안에 있는지(§3.2의 이유).
2. $\lVert c\mathbf{t}_0\rVert_\infty < \gamma_2$ 이고 힌트 $\mathbf{h}$ 의 1의 개수가 $\omega$ 이하 — §7의 힌트가 정확히 복원 가능한 범위인지.

두 조건을 모두 만족할 때까지 $\mathbf{y}$ 를 바꿔가며 재시도한다(기대 반복 횟수는 세트별로 약 3.9~5.1회, §10).

---

## 6. 검증

`Verify(pk, M, σ, ctx)` 는 서명자가 커밋을 다시 만들 필요 없이, **$\mathbf{z}$와 압축된 $\mathbf{t}_1$만으로 커밋을 근사 재구성**한다.

```
Verify_internal(pk, M', σ):
  (ρ, t1)     = pkDecode(pk)
  (c̃, z, h)  = sigDecode(σ)
  if h == ⊥: return false
  tr  = H(pk, 64)
  μ   = H(tr ‖ M', 64)
  c   = SampleInBall(c̃)
  w'_approx = A·z - c·t1·2^d          // ≈ A·y (아래 근사식)
  w1' = UseHint(h, w'_approx)
  c̃' = H(μ ‖ w1Encode(w1'), λ/4)
  return ‖z‖∞ < γ1-β  and  weight(h) ≤ ω  and  c̃ == c̃'
```

정당한 서명이면

$$\mathbf{w} = \mathbf{A}\mathbf{y} = \mathbf{A}\mathbf{z} - c\mathbf{t} + c\mathbf{s}_2 \;\approx\; \mathbf{A}\mathbf{z} - c\mathbf{t}_1\cdot 2^d = \mathbf{w}'_{\mathrm{approx}}$$

가 성립한다($c, \mathbf{s}_2$ 가 작고 $\mathbf{t}_1\cdot 2^d \approx \mathbf{t}$ 이므로). 다만 이 근사는 $\mathbf{t}_1\cdot 2^d$ 로 버려진 하위 비트 $\mathbf{t}_0$ 만큼 어긋나 있어, $\mathrm{HighBits}$ 를 직접 적용하면 경계 근처에서 다른 결과가 나올 수 있다. 서명에 포함된 **힌트 $\mathbf{h}$** 가 이 어긋남을 보정해 정확한 $\mathbf{w}_1' = \mathbf{w}_1$ 을 복원시켜 준다. 마지막으로 재계산한 커밋 해시 $\tilde c'$ 가 서명의 $\tilde c$ 와 일치해야 통과한다.

---

## 7. 압축·힌트 메커니즘

공개키를 압축(§4의 $\mathbf{t}_1$)하면서도 검증이 가능하려면, 버린 하위 비트를 서명이 부분적으로 복구해 줘야 한다. 여섯 개 함수가 이를 담당하며, 모두 계수별로 적용된다.

- **Power2Round$(r)$**: $r \bmod q = r_1\cdot 2^d + r_0$ 로 단순 이진 분해(키 압축용).
- **Decompose$(r)$**: $r \bmod q = r_1\cdot 2\gamma_2 + r_0$ 로 분해하되, $q-1$ 근처의 wrap-around를 보정한 버전. HighBits/LowBits/MakeHint/UseHint의 기반.
- **HighBits$(r)$ / LowBits$(r)$**: Decompose의 $r_1$ / $r_0$ 만 반환. 서명자가 커밋 $\mathbf{w}_1$(HighBits)과 재시도 판단용 잔차 $\mathbf{r}_0$(LowBits)를 얻는 데 쓴다.
- **MakeHint$(z, r)$ / UseHint$(h, r)$**: $z$ 만큼 어긋난 반올림 결과가 있을 때, 그 반올림이 실제로 자리올림/내림을 일으켰는지를 1비트 힌트로 표시(`MakeHint`)하고, 검증자가 그 힌트로 올바른 $\mathrm{HighBits}$ 값을 복원(`UseHint`)한다.

힌트는 §5의 $\mathbf{h} \leftarrow \mathrm{MakeHint}(-c\mathbf{t}_0,\ \mathbf{w}-c\mathbf{s}_2+c\mathbf{t}_0)$ 로 만들어지고, §6의 $\mathrm{UseHint}(\mathbf{h}, \mathbf{w}'_{\mathrm{approx}})$ 로 소비된다. 힌트의 1의 개수를 $\omega$ 이하로 제한하는 것(§5의 두 번째 거부 조건)이 서명 크기를 억제하는 장치다.

---

## 8. Pre-hash 변형 — HashML-DSA

메시지가 매우 크면 SHAKE256으로 직접 서명하는 비용이 부담스러울 수 있다. **HashML-DSA**는 메시지를 먼저 별도 해시/XOF(PH)로 다이제스트한 뒤, 그 다이제스트를 서명한다.

$$M' = \underbrace{1}_{\text{도메인 구분자}} \,\|\, \mathrm{len}(ctx) \,\|\, ctx \,\|\, \mathrm{OID}_{\mathrm{DER}}(\mathrm{PH}) \,\|\, \mathrm{PH}(M)$$

도메인 구분자는 순수 ML-DSA가 0, HashML-DSA가 1이라 **같은 키로 두 버전을 섞어도 서명이 서로의 위조로 재해석되지 않는다**(다만 한 키쌍은 한쪽 용도로만 쓰기를 권장). PH에 쓰는 해시는 $\lambda$ 비트 이상의 충돌 내성을 가져야 하며(다이제스트 길이 $\geq 2\lambda$ 비트), FIPS 204는 SHA-256/SHA-512/SHAKE128의 DER OID 인코딩 예시를 제공한다. 키 생성은 두 변형이 동일하다.

일반적으로는 **순수 ML-DSA**가 권장되고, 메시지 스트리밍·하드웨어 해시 가속 제약이 있을 때만 HashML-DSA를 고려한다.

---

## 9. Dilithium 대비 변경점

- **$\rho'$(사설 시드)·$\mu$(메시지 대표값) 길이 확장**: round-3의 384비트 → 512비트. $\mu$가 384비트였을 때 SHAKE256 충돌 공격으로 Category 5가 실질적으로 Category 4로 낮아지는 결함이 있었다.
- **$tr$(공개키 해시) 길이**: 384비트 → (v3.1) 256비트 → (최종) 512비트로 재조정.
- **서명 방식**: Dilithium v3.1의 기본은 결정론적(개인키+메시지에서 $\rho'$ 유도)이었으나, ML-DSA는 기본을 **hedged**(RBG의 $rnd$를 함께 섞음)로 바꾸고 결정론적 모드를 옵션으로 남겼다.
- **커밋 해시 $\tilde c$ 길이**: ML-DSA-65/87에서 384/512비트로 확장(초안에서는 앞 256비트만 챌린지 생성에 사용 → 최종본은 전체 비트 사용).
- **힌트 검증 버그 수정**: 초안은 힌트 언패킹 시 잘못된 입력 검사를 누락해 SUF-CMA가 깨질 수 있었다. 최종본에서 복원.
- **키 생성 도메인 분리**: 같은 시드를 다른 파라미터 세트로 오용해 확장하는 것을 막기 위해 $H(\xi\|k\|\ell)$ 형태로 변경([[ml-kem]] §4.1의 $G(d\|k)$와 동일한 취지).

---

## 10. 파라미터

$n=256$, $q=8380417$, $d=13$, $\zeta=1753$ 은 공통이다.

| 파라미터 | ML-DSA-44 | ML-DSA-65 | ML-DSA-87 |
|---|---|---|---|
| $(k,\ell)$ | (4,4) | (6,5) | (8,7) |
| $\eta$ | 2 | 4 | 2 |
| $\gamma_1$ | $2^{17}$ | $2^{19}$ | $2^{19}$ |
| $\gamma_2$ | $(q-1)/88$ | $(q-1)/32$ | $(q-1)/32$ |
| $\tau$ | 39 | 49 | 60 |
| $\lambda$ | 128 | 192 | 256 |
| $\beta=\tau\eta$ | 78 | 196 | 120 |
| $\omega$ | 80 | 55 | 75 |
| 기대 반복 횟수 | 4.25 | 5.1 | 3.85 |
| 보안 카테고리 | 2 | 3 | 5 |

크기 공식(byte 단위, $q-1$의 비트 길이는 23):

$$|pk| = 32 + 32k(23-d), \qquad |sk| = 32+32+64+32\big((\ell+k)\lceil\log_2 2\eta\rceil + dk\big)$$
$$|\sigma| = \lambda/4 + 32\ell\big(1+\lceil\log_2(\gamma_1-1)\rceil\big) + \omega + k$$

| 세트 | 공개키 | 개인키 | 서명 |
|------|--------|--------|------|
| ML-DSA-44 | 1312 | 2560 | 2420 |
| ML-DSA-65 | 1952 | 4032 | 3309 |
| ML-DSA-87 | 2592 | 4896 | 4627 |

> ML-DSA-65 공개키는 **1952 byte**다(FIPS 204 Table 2). BouncyCastle 등 구현체·문서에서 종종 round-3 Dilithium 값과 혼동해 1592로 잘못 표기되는 경우가 있으니 주의한다.

---

## 11. 운영 고려

### 11.1. 장점

- **양자 내성** — MLWE/MSIS 기반으로 Shor 알고리즘에 안전. RSA/ECDSA 대체.
- **빠른 검증** — 서명도 실용적 속도(반복 3.9~5.1회 기대). 상태 비저장(stateless)이라 해시 기반 서명(SLH-DSA/FIPS 205)보다 다루기 쉽다.
- **표준화** — FIPS 204 정식 표준. BouncyCastle, OpenSSL 3.5+, OpenJDK 24+ 지원.
- **BUFF 속성** — 메시지 대표값 $\mu$ 에 공개키 해시 $tr$ 을 섞어 넣어, 키 대체·중복 서명 등 단순 위조 불가능성을 넘어서는 추가 안전성(BUFF: Beyond UnForgeability Features)을 노린다.

### 11.2. 제약

- **큰 키/서명** — ECDSA(서명 약 64~72B, 키 32B) 대비 키 1.3~2.6KB·서명 2.4~4.6KB로 매우 크다. 인증서·TLS 핸드셰이크·체인 크기 증가가 실무 부담.
- **가변 시간(거부 샘플링 루프)** — 서명 시간이 실행마다 달라질 수 있어(반복 횟수가 확률적), 구현체는 부채널 관점에서 루프 자체의 타이밍이 아니라 각 반복 내부 연산의 상수 시간성을 보장해야 한다.
- **역할 구분** — 서명 전용. 키 교환은 [[ml-kem]], 암호화는 대칭/하이브리드를 별도로 사용한다.
- **신규성** — 전환기에는 고전 알고리즘과 결합한 **하이브리드 인증서/서명** 배치가 권장된다.[^1]

[^1]: FIPS 204 원문의 요구사항이 아니라 PQC 전환기의 업계 권고를 일반화한 주장임.

---

## 12. 요약

- ML-DSA = MLWE + SelfTargetMSIS 위의 Fiat-Shamir-with-Aborts 서명. Dilithium 표준화.
- $R_q=\mathbb{Z}_q[X]/(X^{256}+1)$, $q=8380417$은 512제곱근을 가져 $X^{256}+1$이 1차 인수 256개로 완전히 분해된다(ML-KEM보다 완전한 NTT).
- 서명은 거부 샘플링 루프(응답·잔차 범위 검사 + 힌트 크기 검사)로 비밀 편향을 제거하고, 검증은 힌트로 압축된 공개키에서 커밋을 재구성한다.
- 세트는 44/65/87 — 보안 Category 2/3/5, 기본 권장 65. ML-DSA-65 공개키는 1952 byte.
- Pre-hash 변형 HashML-DSA는 도메인 구분자로 순수 서명과 혼동을 막는다.

---

## Sources
- NIST FIPS 204 — Module-Lattice-Based Digital Signature Standard: https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf
- Bai, Ducas, Kiltz, Lepoint, Lyubashevsky, Schwabe, Seiler, Stehlé — CRYSTALS-Dilithium: Algorithm Specifications and Supporting Documentation (v3.1): https://pq-crystals.org/dilithium/data/dilithium-specification-round3-20210208.pdf
- Lyubashevsky — Fiat-Shamir with Aborts: Applications to Lattice and Factoring-Based Signatures (ASIACRYPT 2009): https://doi.org/10.1007/978-3-642-10366-7_35
- Lyubashevsky — Lattice Signatures Without Trapdoors (EUROCRYPT 2012): https://doi.org/10.1007/978-3-642-29011-4_43
- Cremers, Düzlü, Fiedler, Janson, Fischlin — BUFFing Signature Schemes Beyond Unforgeability (IEEE S&P 2021): https://doi.org/10.1109/SP40001.2021.00093
- Kiltz, Lyubashevsky, Schaffner — A Concrete Treatment of Fiat-Shamir Signatures in the Quantum Random-Oracle Model (EUROCRYPT 2018): https://doi.org/10.1007/978-3-319-78372-7_18
- Langlois, Stehlé — Worst-case to Average-case Reductions for Module Lattices: https://doi.org/10.1007/s10623-014-9938-4

---

## Related pages
- [[ml-dsa-bouncycastle]] — Java/BouncyCastle 구현·X.509 인증서 발급 예시
- [[ml-kem]] — 격자 기반 KEM(키 캡슐화), 같은 PQC 계열의 짝
- [[hash-function]] — SHA-3/SHAKE 스펀지 구조
- [[openssl-x509]] — X.509 인증서 구조·발급·검증
- [[openssl-dgst]] — 고전 해시·서명(sign/verify) 비교
- [[openssl-keygen]] — RSA/EC/Ed25519 키 생성(고전 서명 키 비교)
- [[openssl-s_client]] — TLS 인증서 체인(PQC 인증서 적용 지점)
