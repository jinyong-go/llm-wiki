---
title: npx
updated: 2026-08-11 17:38:47
tags:
  - nodejs
  - npm
  - cli
---

## 1. 개요

**npx**는 npm 패키지의 바이너리를 실행하는 명령이다. `npm run`과 유사한 컨텍스트에서 로컬 설치된 패키지 또는 원격에서 가져온 패키지의 실행 파일을 호출한다. npm v5.2.0부터 npm과 함께 설치된다.

두 가지 문제를 해결한다.

- **로컬 도구의 대화형 실행** — 프로젝트 로컬 `devDependencies`로 설치된 도구를 `./node_modules/.bin/mocha` 같은 경로 지정 없이 `npx mocha`로 실행
- **일회성 실행** — 전역 설치 없이 패키지를 임시로 가져와 실행. 실행이 끝나면 전역 환경에 남지 않음

```bash
npx serve                    # 정적 파일 서버를 설치 없이 기동
npx create-react-app my-app  # 프로젝트 생성기 일회성 실행
```

생성기(generator)류 도구에 특히 적합하다. 재실행 간격이 길어 어차피 매번 최신 버전을 받아야 하기 때문이다.

---

## 2. 문법

```bash
npx -- <pkg>[@<version>] [args...]
npx --package=<pkg>[@<version>] -- <cmd> [args...]
npx -c '<cmd> [args...]'
npx --package=foo -c '<cmd> [args...]'
```

패키지 이름 뒤의 옵션과 인자는 npx가 아니라 **실행되는 명령에 그대로 전달**된다.

```bash
npx create-react-app my-app --template typescript
# my-app, --template typescript 는 create-react-app 에 전달됨
```

---

## 3. 해석 순서

1. `--package`로 지정된 패키지와 로컬 설치된 실행 파일이 실행 프로세스의 `PATH`에 추가된다
2. 요청한 패키지가 로컬 프로젝트 의존성에 **없으면** npm 캐시 내 디렉터리에 설치하고, 그 경로를 `PATH`에 추가한다. 이때 확인 프롬프트가 출력된다(`--yes`/`--no`로 억제)
3. 버전 지정자 없는 패키지 이름은 로컬에 존재하는 버전과 매칭된다. 지정자가 붙으면 **이름과 버전이 정확히 같을 때만** 로컬 의존성과 매칭된다

프롬프트는 패키지 이름 오타로 인한 보안·UX 문제를 막기 위한 장치다.

---

## 4. bin 이름 추론

`-c`/`--call`도 `--package`도 없으면, npm은 첫 번째 위치 인자로 받은 패키지 지정자에서 실행 파일 이름을 다음 순서로 추론한다.

1. 패키지 `package.json`의 `bin` 항목이 **하나**이거나 모든 항목이 같은 명령의 별칭이면 그 명령을 사용
2. `bin` 항목이 여러 개이고 그중 하나가 `name` 필드의 스코프 제외 부분과 일치하면 그 명령을 사용
3. 위 조건으로 정확히 하나가 결정되지 않으면(`bin`이 없거나 이름이 일치하지 않으면) `npm exec`이 에러로 종료

패키지 이름과 다른 바이너리를 실행하려면 `--package`를 명시한다. 이 옵션이 있으면 첫 인자로부터의 패키지 추론이 비활성화된다.

```bash
npx --package=foo bar --bar-argument
```

---

## 5. -c 옵션

`-c`로 전달한 문자열은 `npm run` 스크립트와 **동일한 환경변수**를 가진 셸에서 실행된다([[npm]] §5.4). 파이프와 복수 명령도 쓸 수 있다.

```bash
npx -c 'eslint && say "hooray, lint passed"'
npx -p cowsay -p lolcatjs -c 'echo "$npm_package_name@$npm_package_version" | cowsay | lolcatjs'
```

`npm run` 스크립트를 대화형으로 개발·검증할 때 유용하다. `$(npm bin)/some-bin` 같은 우회 방법으로는 `npm_` 환경변수에 접근할 수 없다.

---

## 6. npx vs npm exec

동일한 실행 엔진(`npm exec`)을 쓰지만 인자 파싱 규칙이 다르다.

- **`npx`** — 모든 플래그·옵션이 위치 인자보다 **앞에** 와야 한다
- **`npm exec`** — `--`로 npm의 옵션 파싱을 중단시킬 수 있다

같은 문자열이 다르게 해석되는 예:

```bash
npx foo@latest bar --package=@npmcli/foo
# → foo bar --package=@npmcli/foo
#   --package가 위치 인자 뒤에 있어 실행 명령의 인자로 취급됨

npm exec foo@latest bar --package=@npmcli/foo
# → foo@latest bar
#   npm이 --package를 먼저 파싱해 @npmcli/foo 컨텍스트에서 실행
```

혼동을 피하려면 `--`로 파싱 중단을 명시한다. 아래는 위 `npx` 명령과 동등하다.

```bash
npm exec -- foo@latest bar --package=@npmcli/foo
```

```bash
npm exec -- tap --bail test/foo.js
npx tap --bail test/foo.js              # 동등
```

---

## 7. npm v7 변경사항

`npx` 바이너리는 npm v7.0.0에서 재작성되어 `npm exec`을 사용하도록 바뀌었고, 독립 `npx` 패키지는 이때 deprecated 됐다. 이 과정에서 동작이 달라진 항목이다.[^1]

| 항목 | 변경 내용 |
|---|---|
| npm config | 모든 npm config 값을 전달 가능 |
| 설치 프롬프트 | 설치 전 확인 프롬프트 추가. `-y`/`--yes`로 억제 |
| `--no-install` | deprecated — `--no`로 변환됨 |
| 셸 auto-fallback | **제거** |
| `-p` | npm에서는 `--parseable` 축약이지만 `npx`에서는 `--package` 축약으로 유지 |
| `--ignore-existing` | **제거**. 로컬 설치된 bin은 항상 실행 프로세스 `PATH`에 존재 |
| `--npm` | **제거**. 함께 배포된 npm을 항상 사용 |
| `--node-arg`, `-n` | **제거**. `NODE_OPTIONS` 환경변수 사용 |
| `--always-spawn` | 중복이라 제거 |
| `--shell` | `--script-shell`로 대체(`npx` 실행 파일에서는 호환 유지) |

```bash
NODE_OPTIONS="--trace-warnings --trace-exit" npx foo --random=true
```

---

## 8. 주의

npx는 npm이 지원하는 모든 지정자를 받는다. Git URL이나 gist도 실행 대상이 될 수 있다.

```bash
npx https://gist.github.com/zkat/4bc19503fe9e9309e2bfaa2c58074d32
```

원격 코드를 즉시 실행하는 것이므로 `.sh` 스크립트를 받아 실행할 때와 같은 수준의 검토가 필요하다. 오타로 인한 typosquatting 패키지 설치도 실행 경로가 된다.

pnpm의 대응 명령은 `pnpm dlx`다([[package-manager]] §4.2).

---

## Sources
- `raw/node/npm Docs.md` (npm Docs — npx): https://docs.npmjs.com/cli/v11/commands/npx
- `raw/node/Introducing npx an npm package runner.md` (Kat Marchán, 2017): https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
- `raw/node/serve.md` (npx 실행 예): https://www.npmjs.com/package/serve

[^1]: 두 출처가 불일치한다. 2017년 소개 글은 셸 auto-fallback(`.zshrc`에 등록해 `npx` 없이 `mocha` 호출)과 `-p` 옵션을 주요 기능으로 설명하지만, npm v11 공식 문서는 auto-fallback이 "advisable하지 않아 제거됐다"고 명시한다. 현행 동작은 공식 문서를 기준으로 기술하고, 소개 글은 도입 배경·설계 의도 서술에만 사용했다.

---

## Related pages
- [[npm]] — package.json, scripts, 명령어
- [[package-manager]] — npm·yarn·pnpm 비교
