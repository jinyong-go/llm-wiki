---
title: Node 패키지 매니저
updated: 2026-08-11 17:38:47
tags:
  - nodejs
  - npm
  - build-tool
---

## 1. 개요

Node.js 생태계의 주요 패키지 매니저는 **npm**, **Yarn**, **pnpm** 세 가지다. 셋 다 `package.json`과 npm 레지스트리를 공유하므로 의존성 선언 방식은 동일하고, 차이는 **의존성을 디스크에 배치하는 방식**과 그로부터 파생되는 특성(디스크 사용량, 설치 속도, 미선언 의존성 접근 차단)에 있다.

| | npm | Yarn (Berry) | pnpm |
|---|---|---|---|
| `node_modules` 배치 | flat (hoisting) | 없음 (PnP) 또는 flat | 심볼릭 링크 + `.pnpm` |
| lockfile | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
| 저장소 공유 | 없음 (프로젝트별 복사) | zip 캐시 | content-addressable store + 하드 링크 |
| 미선언 의존성 접근 | 가능 | 차단 | 차단 |
| Node.js 동봉 | O | X | X |

---

## 2. node_modules 구조

### 2.1. flat — hoisting

npm과 Yarn Classic은 전이 의존성을 `node_modules` 최상위로 끌어올린다(hoisting). Node.js의 모듈 해석이 상위 디렉터리를 거슬러 탐색하므로 중첩 구조보다 중복이 줄고 경로가 짧아진다.

부작용은 **phantom dependency**(ghost dependency)다. `package.json`에 선언하지 않은 패키지가 hoisting으로 최상위에 올라오면 코드에서 `require`할 수 있게 된다. 이 코드는 로컬에서 동작하지만, 해당 패키지를 끌어올린 중간 의존성이 버전을 올려 그것을 제거하면 갑자기 깨진다. 의존성 트리 변화에 따라 hoisting 결과가 달라지므로 재현성도 떨어진다.

### 2.2. pnpm — 심볼릭 링크와 content-addressable store

pnpm은 두 계층으로 나눈다.

- **전역 store** — 모든 패키지 파일을 내용 주소 기반으로 한 곳에 저장. 설치 시 이 위치에서 **하드 링크**를 걸므로 추가 디스크를 소비하지 않는다. 파일 단위로 저장되기 때문에 100개 파일 중 1개만 바뀐 새 버전은 store에 파일 1개만 추가된다
- **프로젝트 `node_modules`** — 실제 패키지는 `node_modules/.pnpm` 아래에 두고, **직접 의존성만** 최상위에 심볼릭 링크로 노출한다

기본이 non-flat 구조이므로 선언하지 않은 패키지는 최상위에 나타나지 않아 phantom dependency가 차단된다. 호환이 필요하면 `hoisted` node-linker 모드로 npm/Yarn과 같은 flat 배치를 쓸 수 있다.

### 2.3. Yarn PnP

Yarn Berry(3.x 이상)의 기본 설치 전략은 **Plug'n'Play**다. `node_modules`를 만들지 않고, 의존성 트리 전체 정보를 담은 Node.js 로더 파일 `.pnp.cjs`를 생성해 모듈 해석을 가로챈다.

- 파일 복사·심볼릭 링크 생성에 드는 I/O가 없어 설치가 빠르다
- 선언되지 않은 의존성 접근이 차단된다
- 해석 실패 시 "Cannot find module" 대신 어떤 패키지 간 문제인지 알려주는 에러를 낸다

제약도 있다. React Native·Expo 프로젝트는 PnP를 쓸 수 없어 전통적 `node_modules` 설치가 필요하다. 기존 프로젝트를 이관하면 잠재하던 ghost dependency가 드러나 수정이 필요하고, peer 의존성을 많이 쓰는 구성에서는 workspace가 의도치 않게 중복 인스턴스화될 수 있다. `.yarnrc.yml` 설정으로 `node_modules` 방식으로 되돌릴 수 있다.

---

## 3. lockfile

세 매니저 모두 해석된 의존성 트리를 lockfile에 고정해 재현성을 확보하며, 형식이 서로 호환되지 않는다. 한 저장소에 여러 lockfile이 공존하면 팀원·CI가 서로 다른 트리를 설치하게 되므로 하나만 커밋하고 나머지는 `.gitignore`에 넣는다.

| 매니저 | lockfile | CI 재현 설치 명령 |
|---|---|---|
| npm | `package-lock.json` | `npm ci` |
| Yarn | `yarn.lock` | `yarn install --immutable` |
| pnpm | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |

CI에서는 lockfile 불일치를 갱신이 아니라 **실패로 처리**하는 위 명령을 쓴다([[npm]] §4.2).

---

## 4. 명령어

### 4.1. 대응

| 작업 | npm | Yarn | pnpm |
|---|---|---|---|
| 전체 설치 | `npm install` | `yarn` | `pnpm install` |
| 의존성 추가 | `npm install <pkg>` | `yarn add <pkg>` | `pnpm add <pkg>` |
| dev 의존성 추가 | `npm install -D <pkg>` | `yarn add -D <pkg>` | `pnpm add -D <pkg>` |
| 제거 | `npm uninstall <pkg>` | `yarn remove <pkg>` | `pnpm remove <pkg>` |
| 스크립트 실행 | `npm run <s>` | `yarn <s>` | `pnpm <s>` |
| 로컬 bin 실행 | `npm exec` | `yarn exec` | `pnpm exec` |
| 일회성 원격 실행 | `npx <pkg>` | `yarn dlx <pkg>` | `pnpm dlx <pkg>` |
| 재현 설치 | `npm ci` | `yarn install --immutable` | `pnpm install --frozen-lockfile` |

### 4.2. 일회성 실행

`pnpm dlx`(별칭 `pnx`, `pnpx`)는 패키지를 의존성으로 설치하지 않고 레지스트리에서 가져와 즉시 실행한다. [[npx]]와 목적이 같다.

```bash
pnx create-vue my-app
pnx create-vue@next my-app
pnpm dlx --package=foo bar        # 패키지와 다른 바이너리 실행
pnpm dlx -c 'eslint && vitest'    # 셸 모드
```

pnpm v11.0.0부터 `dlx`는 프로젝트의 보안 설정(최소 릴리스 경과 시간, 신뢰 정책)을 따르며, 신뢰 조건을 만족하지 못하는 패키지는 실행을 거부한다.

---

## 5. workspaces

세 매니저 모두 모노레포를 지원하지만 선언 위치가 다르다.

**npm / Yarn** — 루트 `package.json`

```json
{
  "workspaces": ["packages/*"]
}
```

**pnpm** — 루트에 별도 파일 `pnpm-workspace.yaml`이 있어야 한다

pnpm은 로컬 패키지 참조에 `workspace:` 프로토콜을 제공한다.

```json
{
  "dependencies": {
    "foo": "workspace:*",
    "bar": "workspace:^1.0.0",
    "baz": "workspace:../baz",
    "aliased": "workspace:foo@*"
  }
}
```

`workspace:^1.0.0`은 로컬에 `foo@1.0.0`이 존재하지 않으면 설치를 실패시킨다. 레지스트리 fallback을 막아 로컬 패키지를 확실히 쓰게 하는 장치다.

배포 시 `workspace:` 참조는 실제 semver 범위로 자동 변환된다.

```json
// 배포 전                          // 배포 후 (foo 버전이 1.5.0일 때)
{ "foo": "workspace:*",             { "foo": "1.5.0",
  "bar": "workspace:~",               "bar": "~1.5.0",
  "qar": "workspace:^" }              "qar": "^1.5.0" }
```

npm workspaces의 CLI 사용법은 [[npm]] §6 참고.

---

## 6. Corepack

**Corepack**은 프로젝트가 지정한 패키지 매니저와 버전을 자동으로 준비하는 브리지 도구다. Yarn·pnpm을 별도로 전역 설치하지 않아도 된다.

`package.json`의 `packageManager` 필드로 대상을 지정한다. 값은 `yarn`·`npm`·`pnpm` 중 하나이며, 무결성 검증용 SHA-224 해시를 덧붙일 수 있다.

```json
{
  "packageManager": "yarn@3.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa"
}
```

Corepack은 Node.js 14.19.0부터 24.x까지 동봉됐고, **Node.js 25.0.0에서 제거**됐다. 동봉된 버전에서는 `corepack enable`로 활성화하며, 그 외에는 직접 설치한다.

```bash
corepack enable                  # 동봉 버전 활성화
npm install -g corepack@latest   # 수동 설치 또는 최신화
```

---

## 7. 비교

### 7.1. 장단점

| | 장점 | 단점 |
|---|---|---|
| **npm** | Node.js에 동봉되어 추가 설치가 없다. 생태계 기본값이라 도구 호환 문제가 가장 적다 | flat 배치로 phantom dependency가 발생한다([§2.1](#21-flat--hoisting)). 프로젝트마다 의존성을 복사하므로 디스크 사용량이 크다 |
| **pnpm** | 하드 링크로 디스크를 공유하고, 파일 단위 store라 버전 갱신 시 변경된 파일만 추가된다. non-flat 구조로 phantom dependency를 차단한다. `workspace:` 프로토콜로 로컬 패키지 참조를 강제할 수 있다 | 별도 설치가 필요하다. 심볼릭 링크 구조를 전제하지 않는 도구를 위해 `hoisted` node-linker 모드로 되돌려야 하는 경우가 있다 |
| **Yarn Berry** | `node_modules`를 만들지 않아 설치 I/O가 없다. ghost dependency를 차단하고, 해석 실패 시 어떤 패키지 간 문제인지 알려준다. hoisting의 불완전성에서 오는 중복 없이 정확히 dedup된다 | React Native·Expo와 호환되지 않는다. 기존 프로젝트 이관 시 드러난 ghost dependency를 수정해야 한다. peer 의존성을 많이 쓰면 workspace가 중복 인스턴스화될 수 있다 |

### 7.2. 선택 기준

- **npm** — 단일 패키지 프로젝트, 또는 도구 체인을 단순하게 유지하려는 경우의 기본값
- **pnpm** — 여러 프로젝트가 같은 의존성을 공유하는 환경, 모노레포, 컨테이너 이미지 크기가 중요한 경우
- **Yarn Berry** — 설치 I/O를 최소화하려는 경우. 다만 React Native 등 호환 제약을 먼저 확인해야 한다

phantom dependency 차단은 CI에서만 재현되는 의존성 누락 오류를 로컬 설치 시점에 드러내므로, 팀 규모가 커질수록 이득이 크다.[^1]

---

## Sources
- pnpm — Motivation: https://pnpm.io/motivation
- pnpm — dlx: https://pnpm.io/cli/dlx
- pnpm — Workspaces: https://pnpm.io/workspaces
- Yarn — Plug'n'Play: https://yarnpkg.com/features/pnp
- Corepack (nodejs/corepack): https://github.com/nodejs/corepack
- npm Docs — npm ci: https://docs.npmjs.com/cli/v11/commands/npm-ci
- npm Docs — workspaces: https://docs.npmjs.com/cli/v11/using-npm/workspaces

[^1]: 추론. pnpm·Yarn 공식 문서는 phantom/ghost dependency가 문제라는 점과 각자의 차단 메커니즘은 명시하지만, "팀 규모에 따른 이득"은 명시하지 않는다. 미선언 의존성이 hoisting 결과에 의존한다는 사실([§2.1](#21-flat--hoisting))과, 로컬·CI 환경의 의존성 트리가 달라질 수 있다는 점에서 도출한 판단이다.

---

## Related pages
- [[npm]] — package.json, semver, scripts, 명령어
- [[npx]] — 패키지 바이너리 실행
- [[module-system]] — Node.js 모듈 해석
- [[sbom]] — 의존성 목록과 공급망 보안
