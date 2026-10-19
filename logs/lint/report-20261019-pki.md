# wiki-lint report — 2026-10-19 (security/pki)

- **범위**: `wiki/security/pki/` 5개 문서 (certificate-purpose, certificate-revocation, cmp, timestamp-token, x509-certificate) + `raw/crypto/X.509.md`
- **결과**: broken links 0건 / 사실 오류 3건 / 불일치·근거 부족 3건 / 형식 2건 / 경미 3건
- **조치**: 경미 1건(timestamp-token Sources)을 제외하고 수정 완료 (2026-10-19 17:47:41)

---

## 1. 링크

- 위키링크: 5개 문서의 `[[...]]` 대상 전부 존재. 본문 절 참조(`[[openssl-x509]]` §8, `[[cert-path-validation]]` §4.3)도 실재
- 웹 링크: Sources URL 전부 200

---

## 2. 사실 오류

| # | 파일 | 위치 | 내용 | 조치 |
|---|---|---|---|---|
| E1 | `certificate-purpose.md` | §6.2 | "EV 코드서명은 발급 즉시 SmartScreen 신뢰" 서술이 낡음. 2024년 이후 EV·OV 동일 취급, 평판은 파일별 누적. 2023-06부터 CS BR §6.2.7.4가 OV에도 하드웨어 키 보관 요구 | 정정, 출처·각주 추가 |
| E2 | `certificate-revocation.md` | §3 | "CRL 유효기간은 보통 24시간 이하" 근거 없음. CA/B BR은 7일 재발행·`nextUpdate` 10일 이내 | 정정, 출처·각주 추가 |
| E3 | `cmp.md` | §5.5 | "사용자가 언급한 '다른 용도'" 대화 잔재 문장 | 삭제 |

---

## 3. 불일치·근거 부족

| # | 파일 | 내용 | 조치 |
|---|---|---|---|
| C1 | `x509-certificate.md` §5 ↔ §2.2 | 중간 인증서를 단일 계층으로만 서술. `pathLenConstraint`는 다단계 전제. raw도 단일 계층 | 다단계 서술로 정정, raw 불일치 각주 |
| C2 | `cmp.md` §5.4 | 폐기 반영 설명이 `[[x509-certificate]]` 링크 | `[[certificate-revocation]]`으로 교체 |
| C3 | `certificate-purpose.md` §6.1, §8.1 | 코드서명·TSA KU 요건의 출처(CS BR) 누락. RFC 3161은 KU 미규정 | CS BR 출처 추가, §8.1 각주 |

---

## 4. 형식

| 내용 | 조치 |
|---|---|
| 각주가 최하단에 없음 (x509-certificate §4.1, timestamp-token §3.2·§6.2, certificate-purpose Sources 뒤) | 최하단으로 이동 |
| 제목 대시 연결 (certificate-revocation, cmp) | "인증서 폐기", "CMP (Certificate Management Protocol)"로 변경 |

---

## 5. 경미

- `cmp.md` §5.1 in-band 비밀 교환 불가 서술이 추론인데 각주 없음 → 각주 추가
- `x509-certificate.md`·`certificate-purpose.md` "브라우저는 serverAuth EKU 없는 서버 인증서 거부" 출처 없음 → CA/B Forum BR 요건으로 서술 변경
- `timestamp-token.md` Sources의 `raw/crypto/CMS.md`는 타임스탬프 관련 서술이 거의 없음 → 미조치 (CMS 구조 출처로 유지)

---

## 6. 확인 결과 문제없음

- `x509-certificate.md` 알고리즘 OID, SKI·AKI·Basic Constraints·SAN 규정
- `certificate-revocation.md` CRLReason 값, RFC 6066·7633, Let's Encrypt Must-Staple 중단일(2025-01-30)
- `cmp.md` RFC 9810·9811·9480~9483 체계
- `timestamp-token.md` status·failInfo 코드값, TSTInfo 필드, `id-ct-TSTInfo` OID, RFC 5816, TCP 포트 318
- `certificate-purpose.md` §8 ↔ `timestamp-token.md` §6.1 TSA EKU 요건 일치

---

## 7. 동반 작업

- `wiki/security/crypto/cms.md` 구조 개편(사용자 요청)에 따라 `timestamp-token.md` §5의 `[[cms]] 5.2` 참조를 `3.2`로 갱신

---

## 8. 참고 출처

- [CA/Browser Forum Code Signing Baseline Requirements](https://cabforum.org/working-groups/code-signing/requirements/)
- [CA/Browser Forum TLS Baseline Requirements](https://cabforum.org/working-groups/server/baseline-requirements/requirements/)
- [CA/Browser Forum S/MIME Baseline Requirements](https://cabforum.org/working-groups/smime/requirements/)
- [Microsoft Q&A: Issue with Microsoft SmartScreen and DigiCert](https://learn.microsoft.com/en-us/answers/questions/5883575/issue-with-microsoft-smartscreen-and-digicert)
