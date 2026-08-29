---
title: npm
updated: 2026-08-11 17:38:47
tags:
  - nodejs
  - npm
  - build-tool
---

## 1. 개요

**npm**은 Node.js 기본 패키지 매니저다. 세 부분으로 구성된다.

- **레지스트리** — 패키지가 배포·보관되는 저장소(registry.npmjs.org)
- **CLI** — 의존성 설치·스크립트 실행·배포를 수행하는 명령행 도구
- **`package.json`** — 프로젝트 메타데이터와 의존성을 선언하는 매니페스트

빌드 자체를 수행하는 도구는 아니며, `scripts` 필드를 통해 실제 빌드 도구(tsc, webpack, vite 등)를 호출하는 진입점 역할을 한다.

---

## 2. package.json

### 2.1. 의존성 필드

| 필드 | 설치 시점 | 용도 |
|---|---|---|
| `dependencies` | 항상 | 런타임에 필요한 의존성 |
| `devDependencies` | 로컬 개발 시만 | 테스트·빌드 도구. 이 패키지를 의존성으로 설치하는 소비자에게는 설치되지 않음 |
| `peerDependencies` | npm v7부터 기본 설치 | 호스트 도구·라이브러리와의 호환 범위 선언. 플러그인이 본체 버전을 명시할 때 사용. 충돌을 피하려면 넓은 범위로 지정 |
| `peerDependenciesMeta` | — | peer 의존성을 `optional: true`로 표시해 자동 설치 제외 |
| `optionalDependencies` | 시도 후 실패 허용 | 설치 실패가 전체 설치를 중단시키지 않음. 코드가 부재 상황을 처리해야 함. 같은 이름이 `dependencies`에 있으면 이쪽이 우선 |
| `bundleDependencies` | 배포 tarball에 포함 | 패키지 이름 배열 또는 boolean |
| `overrides` | — | 의존성 트리 전체의 특정 버전을 강제 교체. 루트 `package.json`에서만 유효 |

```json
{
  "dependencies": {
    "foo": "1.0.0",
    "bar": ">=1.0.2 <2.1.2",
    "baz": "~1.2.3",
    "qux": "^1.0.0",
    "dyl": "file:../dyl",
    "kpg": "npm:pkg@1.0.0"
  }
}
```

버전 자리에는 정확한 버전, 비교 연산자, 범위, URL, Git URL, `user/repo` 형태의 GitHub 축약, dist-tag, 로컬 경로를 쓸 수 있다.

`overrides`는 전이 의존성의 취약 버전을 교체할 때 쓴다.

```json
{
  "overrides": {
    "vulnerable-dep": "1.0.0",
    "@npm/bar@2.0.0": { "@npm/foo": "1.0.0" }
  }
}
```

### 2.2. 진입점과 실행 파일

| 필드 | 설명 |
|---|---|
| `main` | `require()`의 기본 진입점. 미지정 시 `index.js` |
| `exports` | 다중 진입점과 조건부 해석을 지원하는 `main`의 대체 필드 ([[module-system]]) |
| `bin` | 명령 이름 → 실행 파일 경로 매핑. 대상 파일은 `#!/usr/bin/env node`로 시작해야 함 |
| `type` | `.js` 파일의 해석 방식(`module`/`commonjs`). npm이 아니라 Node.js가 사용 ([[es-module]]) |
| `files` | 배포 tarball에 포함할 패턴 배열. 기본값 `["*"]`, `.gitignore` 문법. `package.json`·README·LICENSE·`main`·`bin`은 항상 포함 |

```json
{
  "bin": { "myapp": "bin/cli.js" }
}
```

`bin`에 등록된 명령은 설치 시 `node_modules/.bin`에 링크되고, `npm run`·`npx` 실행 환경의 `PATH`에 추가된다([§5.1](#51-실행과-path), [[npx]]).

### 2.3. 환경 선언

| 필드 | 설명 |
|---|---|
| `engines` | 호환 Node.js·npm 버전. **기본은 권고 수준**이며, `engine-strict` 설정을 켜야 강제된다 |
| `workspaces` | 모노레포 하위 패키지 경로 glob ([§6](#6-workspaces)) |
| `packageManager` | 프로젝트가 사용할 패키지 매니저와 버전. Corepack이 해석 ([[package-manager]] §6) |

```json
{
  "engines": { "node": ">=20" },
  "packageManager": "npm@11.0.0"
}
```

---

## 3. 버전 범위

`^`·`~` 등 범위 표기는 `node-semver`가 해석한다.

### 3.1. 캐럿

`[major, minor, patch]` 중 **가장 왼쪽의 0이 아닌 요소를 바꾸지 않는** 변경만 허용한다. 0.x 버전에서 동작이 달라지는 이유가 이 규칙이다.

| 범위 | 전개 결과 | 허용 범위 |
|---|---|---|
| `^1.2.3` | `>=1.2.3 <2.0.0-0` | minor·patch |
| `^0.2.3` | `>=0.2.3 <0.3.0-0` | patch만 |
| `^0.0.3` | `>=0.0.3 <0.0.4-0` | 없음 |
| `^0.x` | `>=0.0.0 <1.0.0-0` | minor·patch |

### 3.2. 틸드

minor를 명시하면 patch 변경만, 생략하면 minor 변경까지 허용한다.

| 범위 | 전개 결과 |
|---|---|
| `~1.2.3` | `>=1.2.3 <1.3.0-0` |
| `~1.2` | `>=1.2.0 <1.3.0-0` |
| `~1` | `>=1.0.0 <2.0.0-0` |

`^0.2.3`과 `~0.2.3`은 결과가 같다.

### 3.3. x-range와 하이픈 범위

```
*        →  >=0.0.0
1.x      →  >=1.0.0 <2.0.0-0
1.2.x    →  >=1.2.0 <1.3.0-0

1.2.3 - 2.3.4  →  >=1.2.3 <=2.3.4
1.2.3 - 2      →  >=1.2.3 <3.0.0-0
```

### 3.4. 프리릴리스

프리릴리스 버전은 기본적으로 범위 매칭에서 제외된다. `1.2.3-alpha.3`이 어떤 범위를 만족하려면, 그 범위의 비교자 중 하나가 **동일한 `[major, minor, patch]`를 가지면서 프리릴리스 태그를 포함**해야 한다. `includePrerelease` 옵션으로 이 제약을 해제할 수 있다.

의도치 않은 프리릴리스 설치를 막는 장치이므로, 안정 버전만 원하면 별도 설정이 필요 없다.

---

## 4. lockfile

### 4.1. package-lock.json

`package.json`의 범위 표기(`^1.2.3`)는 여러 버전에 매칭되므로, 설치 시점에 따라 실제 설치 버전이 달라진다. `package-lock.json`은 해석된 전체 트리를 정확한 버전·해시와 함께 고정해 재현성을 보장한다. 반드시 버전 관리에 포함한다.

### 4.2. npm install vs npm ci

| | `npm install` | `npm ci` |
|---|---|---|
| lockfile | 없으면 생성, 불일치 시 갱신 | **필수**. `package.json`과 불일치하면 갱신 대신 **에러 종료** |
| 파일 수정 | `package.json`·lockfile 갱신 | 어느 쪽도 쓰지 않음 (설치가 동결됨) |
| 기존 `node_modules` | 유지하고 차이만 반영 | 시작 시 **삭제** |
| 개별 패키지 설치 | 가능 | 불가 — 프로젝트 전체 단위만 |

CI 파이프라인에서는 재현성과 실패 가시성 때문에 `npm ci`를 쓴다.

---

## 5. scripts

### 5.1. 실행과 PATH

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  }
}
```

```bash
npm run build
npm test          # test/start/stop 등은 run 생략 가능
npm run           # 정의된 스크립트 목록 출력
```

스크립트 실행 시 `node_modules/.bin`이 `PATH`에 추가되므로, 로컬 설치된 도구를 경로 없이 이름만으로 호출할 수 있다. 대화형으로 같은 환경을 쓰려면 [[npx]]를 사용한다.

`npm run <script> -- <args>`처럼 `--` 뒤에 인자를 붙여 스크립트에 전달한다.

### 5.2. pre/post 훅

`scripts`에 정의된 임의의 이름 `X`에 대해 `preX`·`postX`를 정의하면 앞뒤로 자동 실행된다.

```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "tsc",
    "postbuild": "node scripts/report.js"
  }
}
```

### 5.3. 라이프사이클 스크립트

특정 npm 명령은 정해진 순서로 스크립트를 실행한다.

| 명령 | 실행 순서 |
|---|---|
| `npm install` / `npm ci` | `preinstall` → `install` → `postinstall` → `prepublish` → `preprepare` → `prepare` → `postprepare` |
| `npm publish` | `prepublishOnly` → `prepack` → `prepare` → `postpack` → `publish` → `postpublish` |
| `npm pack` | `prepack` → `prepare` → `postpack` |
| `npm test` | `pretest` → `test` → `posttest` |
| `npm start` / `stop` | `pre*` → `*` → `post*` |
| `npm version` | `preversion` → `version` → `postversion` |

- **`prepare`** — 로컬 `npm install` 시점과 `npm publish` 패킹 직전 양쪽에서 실행된다. 빌드 산출물을 배포에 포함시켜야 하는 라이브러리에서 쓴다
- **`prepublishOnly`** — `npm publish` 시에만 실행된다
- **`dependencies`** — `node_modules`가 변경된 뒤 실행된다

`postinstall`은 의존성 설치만으로 임의 코드가 실행되는 경로이므로 공급망 공격 표면이 된다([[sbom]]).

### 5.4. 환경변수

스크립트 프로세스에는 `package.json` 필드가 `npm_package_` 접두사로 주입된다.

```bash
npm run env | grep npm_
```

`npm_package_name`, `npm_package_version`, `npm_lifecycle_event`(현재 실행 중인 스크립트 이름) 등을 사용할 수 있다.

---

## 6. workspaces

루트 `package.json`에 하위 패키지 경로를 선언하면 모노레포로 동작한다.

```json
{
  "workspaces": ["packages/*"]
}
```

루트에서 `npm install`을 실행하면 workspace 패키지를 레지스트리에서 받지 않고 루트 `node_modules`에 심볼릭 링크로 연결한다. `npm link`를 수동으로 쓸 필요가 없다.

```bash
npm init -w ./packages/a          # workspace 생성 및 루트 package.json 갱신
npm install abbrev -w a           # 특정 workspace에 의존성 추가
npm run test -w a -w b            # 지정 workspace에서 스크립트 실행
npm run test --workspaces --if-present   # 전체 workspace, 스크립트가 있는 곳만
```

`--workspaces`(`-ws`) 실행 순서는 `package.json`에 선언된 순서를 따른다.

---

## 7. 주요 명령어

| 명령 | 용도 |
|---|---|
| `npm install` (`i`) | `package.json` 기준 전체 설치 |
| `npm install <pkg>` | 의존성 추가(`-D` devDependencies, `-g` 전역, `-E` 정확한 버전 고정) |
| `npm ci` | lockfile 기준 재현 설치 ([§4.2](#42-npm-install-vs-npm-ci)) |
| `npm uninstall <pkg>` | 제거 |
| `npm update` | 범위 내 최신으로 갱신 |
| `npm outdated` | 갱신 가능한 의존성 목록 |
| `npm ls` | 설치된 트리 조회(`--depth=0`으로 직접 의존성만) |
| `npm run <script>` | 스크립트 실행 |
| `npm exec` / `npx` | 패키지 바이너리 실행 ([[npx]]) |
| `npm audit` | 알려진 취약점 점검(`--fix`로 자동 갱신 시도) |
| `npm publish` | 레지스트리 배포(`--dry-run`으로 포함 파일 확인) |
| `npm view <pkg>` | 레지스트리 메타데이터 조회 |
| `npm cache clean --force` | 캐시 삭제 |

---

## Sources
- `raw/node/npm Docs.md`
- npm Docs — package.json: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
- npm Docs — scripts: https://docs.npmjs.com/cli/v11/using-npm/scripts
- npm Docs — npm ci: https://docs.npmjs.com/cli/v11/commands/npm-ci
- npm Docs — workspaces: https://docs.npmjs.com/cli/v11/using-npm/workspaces
- node-semver — Ranges: https://github.com/npm/node-semver

---

## Related pages
- [[npx]] — 패키지 바이너리 실행
- [[package-manager]] — npm·yarn·pnpm 비교
- [[module-system]] — CommonJS와 ES Module
- [[es-module]] — `type: module`과 ESM 해석
- [[sbom]] — 의존성 목록과 공급망 보안
