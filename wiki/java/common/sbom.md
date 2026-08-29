---
title: SBOM (Software Bill of Materials)
updated: 2026-07-08 10:32:15
tags:
  - java
  - security
  - sbom
  - supply-chain
---

## 1. 개요

SBOM(Software Bill of Materials)은 소프트웨어에 포함된 모든 컴포넌트의 목록이다. 오픈소스 라이브러리, 서드파티 패키지, 간접(transitive) 의존성까지 포함한다.

**SBOM이 담는 정보:**

| 항목 | 예시 |
|---|---|
| 컴포넌트 이름 | `log4j-core`, `openssl` |
| 버전 | `2.14.1` |
| 공급자 | Apache Software Foundation |
| 라이선스 타입 | MIT, Apache 2.0 |
| 의존 관계 | 컴포넌트 간 계층 구조 |
| 고유 식별자 | SWID 태그, Package URL (purl) |

---

## 2. 형식

SBOM은 기계 가독 표준 형식으로 구조화된다. NTIA는 SPDX, CycloneDX, SWID를 기준 형식으로 권고한다.

| 형식 | 개발 주체 | 출력 포맷 | 주용도 | 규격 |
|---|---|---|---|---|
| **SPDX** | Linux Foundation | tag-value, JSON, YAML, RDF/XML | 라이선스 감사, 오픈소스 컴플라이언스 | ISO/IEC 5962:2021 |
| **CycloneDX** | OWASP | JSON, XML, Protobuf | 보안·취약점 관리, DevSecOps | NIST SP 800-218 |
| **SWID** | ISO/IEC | XML | IT 자산 관리, 엔터프라이즈 인벤토리 | ISO/IEC 19770-2 |

**용도별 선택:**

| 목적 | 권장 형식 |
|---|---|
| 보안·CVE 스캔 | CycloneDX |
| 오픈소스 라이선스 컴플라이언스 | SPDX |
| IT 자산 인벤토리 | SWID |

실무에서는 CycloneDX(CI 통합)와 SPDX(계약·감사) 두 형식을 함께 사용하는 경우가 많다.

---

## 3. 라이프사이클

```
생성 → 검증 → 배포 → 업데이트
```

1. **생성(Generate)**: 빌드 시 Syft, Trivy, cdxgen 등으로 SBOM 생성
2. **검증(Validate)**: 완전성 및 정확성 확인 (트랜지티브 의존성 누락 여부)
3. **배포(Distribute)**: 버전 관리 저장소, 릴리스 아티팩트, OCI 레지스트리에 저장
4. **업데이트(Update)**: 빌드·배포 때마다, 의존성 변경 시, 신규 CVE 발표 시 갱신

CI/CD 환경에서는 빌드마다 자동 생성하여 보안 스캐너에 즉시 공급하는 것이 표준 패턴이다.

---

## 4. 보안 통합

### 4.1. 취약점 관리

SBOM을 보안 도구와 연결하면 알려진 CVE를 자동으로 검출할 수 있다.

- **OWASP Dependency-Track** — NVD, OSV 데이터베이스와 대조
- **Anchore Enterprise** — 정책·위협 인텔리전스 매핑
- **GitHub Dependabot** — 취약 의존성 감지 및 수정 제안
- **Microsoft Defender for DevOps** — GitHub·Azure 파이프라인 위험 탐지

**전형적인 워크플로:**
```
CI 빌드 → Syft/Trivy로 CycloneDX SBOM 생성
       → Dependency-Track 스캔
       → 보안 알림 발생 → 티켓 생성
```

### 4.2. 공급망 공격 방어

SBOM은 다음 공격 유형에서 변조된 컴포넌트를 조기에 탐지하는 데 기여한다:

- **Typosquatting**: 유사 이름 패키지로 위장
- **Dependency confusion**: 내부 패키지와 동일 이름의 공개 패키지 치환
- **Trojanized updates**: 정상적으로 보이는 소프트웨어에 악성 코드 삽입

> SolarWinds 공격에서 서명된 빌드에 악성코드가 삽입되었는데, SBOM이 있었다면 예상치 못한 컴포넌트를 조기에 식별할 수 있었다.

---

## 5. 클라우드 네이티브 SBOM

컨테이너·마이크로서비스 환경에서는 기존 정적 SBOM만으로는 부족하다.

**특수 요건:**
- 컨테이너 레이어별 컴포넌트 추적 (베이스 이미지 포함)
- 빌드 타임 vs 런타임 의존성 분리
- 빌드·배포마다 자동 갱신

**주요 도구:**

| 도구 | 특징 |
|---|---|
| **Syft** | 컨테이너·코드 스캔, GitHub Actions 통합 |
| **Trivy** | 취약점 스캔 + SBOM 생성, 이미지 레이어 분석 |
| **Tern** | Debian 기반 컨테이너 심층 검사 |
| **github/sbom-action** | GitHub Actions에서 SPDX/CycloneDX SBOM 생성 |

베스트 프랙티스: 빌드 시 SBOM을 생성하고 OCI 레지스트리에 컨테이너 이미지와 함께 저장한다.

---

## 6. 규제 요구사항

| 주체 | 규제/지침 | 내용 |
|---|---|---|
| 미국 정부 | EO 14028 (2021.05) | 연방 기관 대상 소프트웨어 구매 시 SBOM 요구 |
| FDA | 의료기기 사이버보안 지침 | 의료기기 업데이트에 SBOM 포함 (Philips 사례) |
| CISA | SBOM Sharing Lifecycle Report | 연방기관 SBOM 생성·검증·공유 절차 정의 |
| EU | 사이버복원력법(CRA) | 핵심 인프라 소프트웨어에 SBOM 요구 추진 중 |

---

## Sources

- [What is an SBOM (software bill of materials)?](https://github.com/resources/articles/what-is-an-sbom-software-bill-of-materials)

---

## Related pages

- [[sbom-java]]
- [[docker-security]]
- [[docker-image]]
