---
title: "Herdr, AI 코딩 에이전트를 위한 터미널 멀티플렉서"
source: "https://daleseo.com/herdr/"
author:
  - "[[Dale Seo]]"
published: 2026-08-01
created: 2026-11-17
description: "AI 코딩 에이전트를 위한 터미널 멀티플렉서 Herdr를 소개합니다. 설치부터 상태 추적, 세션 유지, 워크트리, CLI 자동화, 여러 원격 머신 관리까지 실전 흐름으로 익히고 주요 주의점도 짚습니다."
tags:
  - "clippings"
---


AI 코딩 에이전트 하나를 터미널에서 돌릴 때는 별문제가 없습니다. 그런데 버그 수정은 Codex에 맡기고, 테스트 실패 원인 조사는 Claude Code에 시키고, 옆에서는 개발 서버까지 띄우기 시작하면 상황이 달라져요. 터미널 탭을 돌아다니며 누가 작업 중인지, 누가 권한 승인을 기다리는지 계속 확인해야 합니다.

일은 에이전트들이 하는데 정작 사람은 터미널을 순찰하느라 바쁜 셈이죠. 🤔

[Herdr](https://herdr.dev/) 는 이 문제를 풀기 위해 만든 터미널 멀티플렉서(terminal multiplexer)입니다. 화면을 나누고 세션을 유지하는 데서 그치지 않아요. 각 패널(pane)에서 돌아가는 코딩 에이전트를 인식해 상태를 한곳에 모아 보여줍니다. Claude Code와 Codex처럼 서로 다른 에이전트를 함께 써도 되고요.

이번 글에서는 Herdr를 설치해 첫 에이전트를 띄우고, 여러 작업을 워크스페이스와 워크트리로 나눠보겠습니다. 명령줄 인터페이스(command-line interface, CLI)로 다른 에이전트까지 제어하는 흐름도 살펴볼게요.

## Herdr는 무엇이 다른가요?

[tmux](https://daleseo.com/tmux/) 나 [Zellij](https://daleseo.com/zellij/) 를 써보셨다면 화면 분할, 탭, 세션 유지라는 개념은 익숙하실 겁니다. 에이전트를 여러 개 띄우려고 [cmux](https://daleseo.com/cmux/) 를 써봤다면 워크스페이스로 작업을 나누는 방식도 낯설지 않으실 거예요. Herdr도 실제 터미널 프로세스를 패널에 담습니다. 클라이언트(client)를 닫아도 프로세스는 백그라운드 서버(background server)에서 계속 돌아가고요.

기존 멀티플렉서와의 차이는 에이전트를 단순한 터미널 프로세스로만 보지 않는다는 데 있어요. Herdr는 패널 안에서 [Claude Code](https://daleseo.com/tag/ClaudeCode/), [Codex](https://daleseo.com/codex/), [OpenCode](https://daleseo.com/opencode/) 같은 코딩 에이전트를 감지하고, 사람의 승인을 기다리는 중인지 도구를 실행하는 중인지 작업을 마쳤는지 구분합니다. 어떤 상태가 있고 화면에서 어떻게 표시되는지는 잠시 뒤 사이드바를 읽는 법에서 하나씩 살펴볼게요.

이 상태는 패널에서 탭과 워크스페이스까지 위로 합쳐집니다. 에이전트 하나가 승인을 기다리면 그 에이전트가 속한 워크스페이스도 `blocked` 로 표시돼요. 이제 터미널을 하나씩 열어볼 필요가 없습니다. 사이드바에서 내 판단이 필요한 작업부터 찾으면 되니까요.

Herdr는 별도의 터미널 앱이 아닙니다. [Ghostty](https://daleseo.com/ghostty/), iTerm2, Kitty처럼 원래 쓰던 터미널 안에서 돌아가는 단일 Rust 바이너리예요. 웹 대시보드나 호스팅 계정도 필요하지 않고, 로컬 서버와 소켓을 통해 화면과 상태를 관리합니다. 소스 코드는 Apache 2.0 라이선스로 공개되어 있습니다.

터미널 안에서 도는 프로그램이지만 그 안에 또 하나의 터미널이 들어 있습니다. 패널마다 출력을 해석하고 화면 상태를 유지해야 하니까요. Herdr는 이 역할을 Ghostty의 터미널 엔진인 libghostty에 맡깁니다. 바깥 터미널이 무엇이든 패널 안의 동작은 같은 엔진이 책임지는 셈이죠.

## 설치하고 시작하기

macOS에서는 Homebrew로 설치하는 방법이 간단합니다.

```sh
brew install herdr
```

Linux나 macOS에서 공식 설치 스크립트를 써도 됩니다.

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows도 0.8.2부터 정식 지원 대상이 되어 안정(stable) 채널로 배포됩니다. PowerShell에서 다음 명령을 실행하면 돼요.

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

예전에 프리뷰 버전을 설치했다면 자동으로 안정 채널로 넘어가지 않으니 `herdr channel set stable` 로 직접 바꿔주세요. 설치가 끝났다면 바로 실행해볼까요?

```sh
herdr
```

처음 실행하면 기본 세션(session)이 만들어지고, 다음부터 같은 명령을 실행하면 그 세션에 다시 붙습니다. 별도로 소켓 이름을 정하거나 서버를 먼저 띄울 필요는 없어요.

여기서 헷갈리기 쉬운 부분이 있습니다. 세션은 디렉토리별로 만들어지지 않습니다. 어느 경로에서 `herdr` 를 실행하든 같은 기본 세션으로 들어가요. 프로젝트를 나누는 단위는 세션이 아니라 잠시 뒤에 볼 워크스페이스입니다.

마우스만으로도 시작할 수 있습니다. 패널과 탭, 워크스페이스를 클릭해 이동하세요. 경계선을 드래그해 크기를 바꾸고 마우스 오른쪽 버튼 메뉴에서 화면을 나눌 수 있어요. 텍스트를 드래그하면 복사되므로 `Ctrl+C` 로 패널 안의 프로세스를 실수로 중단할 일도 줄어듭니다.

키보드를 선호한다면 프리픽스 키(prefix key) 방식을 씁니다. 기본값인 `Ctrl+b` 를 먼저 누르고 손을 뗀 다음 동작 키를 누르는 식이에요. [tmux](https://daleseo.com/tmux/) 와 같은 기본값이라 tmux를 쓰던 분은 손에 익은 감각을 그대로 옮겨올 수 있습니다.

당장 외울 건 `Ctrl+b ?` 하나면 충분합니다. 지금 쓸 수 있는 단축키가 전부 나오거든요. 마우스로 며칠 써보다가 자주 반복하는 동작만 키보드로 옮기는 편이 자연스럽습니다.

## 세션, 워크스페이스, 탭, 패널 이해하기

Herdr의 화면은 다섯 단계로 나뉩니다. 이름이 비슷해서 처음에는 복잡해 보이죠. 프로젝트와 터미널을 담는 상자라고 생각하면 금방 정리됩니다.

```
Herdr의 세션과 터미널 구조하나의 세션 안에 여러 워크스페이스가 있고, 각 워크스페이스는 탭과 패널을 가지며 패널 안에서 셸이나 코딩 에이전트가 실행된다.#mermaid-iqugwzuhy{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#mermaid-iqugwzuhy .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#mermaid-iqugwzuhy .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#mermaid-iqugwzuhy .error-icon{fill:#552222;}#mermaid-iqugwzuhy .error-text{fill:#552222;stroke:#552222;}#mermaid-iqugwzuhy .edge-thickness-normal{stroke-width:1px;}#mermaid-iqugwzuhy .edge-thickness-thick{stroke-width:3.5px;}#mermaid-iqugwzuhy .edge-pattern-solid{stroke-dasharray:0;}#mermaid-iqugwzuhy .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-iqugwzuhy .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-iqugwzuhy .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-iqugwzuhy .marker{fill:#333333;stroke:#333333;}#mermaid-iqugwzuhy .marker.cross{stroke:#333333;}#mermaid-iqugwzuhy svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#mermaid-iqugwzuhy p{margin:0;}#mermaid-iqugwzuhy .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#mermaid-iqugwzuhy .cluster-label text{fill:#333;}#mermaid-iqugwzuhy .cluster-label span{color:#333;}#mermaid-iqugwzuhy .cluster-label span p{background-color:transparent;}#mermaid-iqugwzuhy .label text,#mermaid-iqugwzuhy span{fill:#333;color:#333;}#mermaid-iqugwzuhy .node rect,#mermaid-iqugwzuhy .node circle,#mermaid-iqugwzuhy .node ellipse,#mermaid-iqugwzuhy .node polygon,#mermaid-iqugwzuhy .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#mermaid-iqugwzuhy .rough-node .label text,#mermaid-iqugwzuhy .node .label text,#mermaid-iqugwzuhy .image-shape .label,#mermaid-iqugwzuhy .icon-shape .label{text-anchor:middle;}#mermaid-iqugwzuhy .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#mermaid-iqugwzuhy .rough-node .label,#mermaid-iqugwzuhy .node .label,#mermaid-iqugwzuhy .image-shape .label,#mermaid-iqugwzuhy .icon-shape .label{text-align:center;}#mermaid-iqugwzuhy .node.clickable{cursor:pointer;}#mermaid-iqugwzuhy .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#mermaid-iqugwzuhy .arrowheadPath{fill:#333333;}#mermaid-iqugwzuhy .edgePaths .path{stroke:#333333;stroke-width:1px;}#mermaid-iqugwzuhy .flowchart-link{stroke:#333333;fill:none;}#mermaid-iqugwzuhy .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#mermaid-iqugwzuhy .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#mermaid-iqugwzuhy .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#mermaid-iqugwzuhy .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#mermaid-iqugwzuhy .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#mermaid-iqugwzuhy .cluster text{fill:#333;}#mermaid-iqugwzuhy .cluster span{color:#333;}#mermaid-iqugwzuhy .node .collapsed-indicator{fill:#aaaa33;stroke:none;opacity:0.6;}#mermaid-iqugwzuhy .node .collapsed-separator{stroke:#aaaa33;stroke-width:0.75px;}#mermaid-iqugwzuhy div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#mermaid-iqugwzuhy .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#mermaid-iqugwzuhy rect.text{fill:none;stroke-width:0;}#mermaid-iqugwzuhy .icon-shape,#mermaid-iqugwzuhy .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#mermaid-iqugwzuhy .icon-shape p,#mermaid-iqugwzuhy .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#mermaid-iqugwzuhy .icon-shape .label rect,#mermaid-iqugwzuhy .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#mermaid-iqugwzuhy .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#mermaid-iqugwzuhy .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#mermaid-iqugwzuhy .node .neo-node{stroke:#9370DB;}#mermaid-iqugwzuhy [data-look="neo"].node rect,#mermaid-iqugwzuhy [data-look="neo"].cluster rect,#mermaid-iqugwzuhy [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#mermaid-iqugwzuhy [data-look="neo"].swimlane.cluster rect{filter:none;}#mermaid-iqugwzuhy [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#mermaid-iqugwzuhy [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#mermaid-iqugwzuhy [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#mermaid-iqugwzuhy [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#mermaid-iqugwzuhy [data-look="neo"].node circle .state-start{fill:#000000;}#mermaid-iqugwzuhy [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#mermaid-iqugwzuhy [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#mermaid-iqugwzuhy :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}세션
백그라운드 서버워크스페이스
프로젝트나 작업탭
화면 배치패널
실제 터미널셸, 서버, 테스트코딩 에이전트
```

세션은 독립된 Herdr 서버입니다. 보통은 기본 세션 하나면 충분해요. 워크스페이스(workspace)는 프로젝트나 조사 작업처럼 큰 맥락을 나누고, 탭(tab)은 그 안의 화면 배치를 담습니다. 예를 들어 `agents`, `server`, `review` 탭을 따로 둘 수 있죠.

패널은 셸(shell)과 프로세스가 실제로 실행되는 터미널입니다. 코딩 에이전트는 패널을 대체하는 별도 화면이 아닙니다. Herdr가 패널 안에서 인식한 프로세스예요. 한 패널에는 Codex를 띄우고 옆 패널에는 `bun run dev`, 아래에는 `bun run test` 를 실행하는 익숙한 구성을 그대로 쓸 수 있습니다.

여러 프로젝트를 완전히 다른 세션으로 나누기보다는 먼저 워크스페이스로 나누는 편이 좋습니다. 세션을 여러 개 만들면 서버와 소켓, 저장된 상태까지 갈라지지만 워크스페이스는 한 사이드바에서 상태를 함께 볼 수 있거든요. 업무용과 개인용 런타임을 아예 분리해야 할 때만 이름을 붙인 세션을 고려하면 됩니다.

```sh
herdr session attach work
herdr session attach side-project
```

## 단축키 익히기

`Ctrl+b ?`를 누르면 지금 쓸 수 있는 단축키가 범주별로 정리되어 나옵니다. 아래에서는 프리픽스를 `prefix` 로 줄여 쓸게요. `prefix v` 는 “ `Ctrl+b` 를 누르고 손을 뗀 다음 `v` 를 누른다”는 뜻입니다.

전역 단축키는 어느 화면에서나 통합니다.

- `prefix ?`: 단축키 목록 열기
- `prefix s`: 설정 화면 열기
- `prefix q`: 클라이언트 분리
- `prefix Shift+r`: 설정 파일 다시 읽기
- `prefix o`: 알림이 발생한 곳으로 이동

패널 단축키는 앞에서 본 계층 중 가장 아래인 터미널을 다룹니다. 방향 이동은 [Vim](https://daleseo.com/vim/) 과 같은 `h`, `j`, `k`, `l` 을 씁니다.

- `prefix v`: 세로로 분할해 오른쪽에 새 패널 만들기
- `prefix -`: 가로로 분할해 아래에 새 패널 만들기
- `prefix h`, `prefix j`, `prefix k`, `prefix l`: 왼쪽, 아래, 위, 오른쪽 패널로 이동
- `prefix Tab`: 다음 패널로 순환
- `prefix z`: 현재 패널만 확대
- `prefix r`: 크기 조절 모드 진입
- `prefix x`: 패널 닫기
- `prefix Shift+p`: 패널 이름 변경
- `prefix [`: 복사 모드 진입
- `prefix e`: 스크롤백을 편집기로 열기
- `prefix b`: 사이드바 접고 펼치기

워크스페이스와 탭 단축키는 그 위 계층을 다룹니다.

- `prefix w`: 워크스페이스 탐색 화면 열기
- `prefix g`: 세션 내비게이터 열기
- `prefix c`: 새 탭 만들기
- `prefix n`: 다음 탭으로 이동
- `prefix Shift+n`: 새 워크스페이스 만들기
- `prefix Shift+g`: 새 워크트리 만들기
- `prefix Shift+w`: 워크스페이스 이름 변경
- `prefix Shift+d`: 워크스페이스 닫기

`prefix w` 나 `prefix g` 로 연 탐색 화면 안에서는 프리픽스 없이 바로 누릅니다.

- 위아래 방향키: 워크스페이스 목록 훑기
- `h`, `j`, `k`, `l` 이나 방향키: 포커스 이동
- `Tab` 과 `Shift+Tab`: 패널 순환
- `Enter`: 선택한 워크스페이스 열기
- `1` 부터 `9`: 해당 번호의 워크스페이스로 전환
- `Esc`: 뒤로 가기

목록을 훑다 보면 `unset` 이라고 적힌 항목이 눈에 띕니다. 기능은 있는데 기본 키가 할당되지 않은 동작이에요. 이전 에이전트와 다음 에이전트로 이동하기, 번호로 특정 에이전트에 바로 포커스 주기, 워크트리 열기와 체크아웃 삭제가 여기에 속합니다. 하필 에이전트를 여러 개 굴리기 시작하면 아쉬워지는 것들이라, 설정 파일에서 직접 키를 붙여줄 만합니다.

## 에이전트를 띄우고 상태 확인하기

에이전트를 시작하는 방법은 평소와 같습니다. 원하는 패널에서 명령을 실행하면 Herdr가 전경 프로세스를 감지합니다.

```sh
codex
```

다른 패널에서는 Claude Code를 실행해도 됩니다.

```sh
claude
```

Herdr는 에이전트의 프로세스와 터미널 화면을 보고 상태를 판별합니다. 지원하는 에이전트라면 별도 설정 없이도 감지돼요. 자주 쓰는 에이전트에는 공식 통합(integration)을 설치해두는 편이 좋습니다.

```sh
herdr integration install codex
herdr integration install claude
```

무엇이 설치됐는지는 다음 명령으로 확인합니다.

```sh
herdr integration status
```
```text
pi: not installed (/Users/dale/.pi/agent/extensions/herdr-agent-state.ts)
omp: not installed (/Users/dale/.omp/agent/extensions/herdr-omp-agent-state.ts)
claude: current (v7) (/Users/dale/.claude/hooks/herdr-agent-state.sh)
codex: current (v6) (/Users/dale/.codex/herdr-agent-state.sh)
copilot: not installed (/Users/dale/.copilot/hooks/herdr-agent-state.sh)
devin: not installed (/Users/dale/.config/devin/herdr-agent-state.sh)
droid: not installed (/Users/dale/.factory/hooks/herdr-agent-state.sh)
kimi: not installed (/Users/dale/.kimi-code/hooks/herdr-agent-state.sh)
opencode: not installed (/Users/dale/.config/opencode/plugins/herdr-agent-state.js)
kilo: not installed (/Users/dale/.config/kilo/plugin/herdr-agent-state.js)
hermes: not installed (/Users/dale/.hermes/plugins/herdr-agent-state/__init__.py)
qodercli: not installed (/Users/dale/.qoder/hooks/herdr-agent-state.sh)
cursor: not installed (/Users/dale/.cursor/herdr-agent-state.sh)
mastracode: not installed (/Users/dale/.mastracode/hooks/herdr-agent-state.sh)
```

이 목록이 곧 Herdr가 지원하는 에이전트 명단입니다. Claude Code와 Codex 외에도 Copilot, Cursor, Devin, Droid, OpenCode처럼 이름이 익숙한 도구가 줄줄이 보이죠. `current (v7)` 은 이미 설치되어 있고 버전도 최신이라는 뜻이고, 나머지는 아직 설치하지 않은 상태예요.

지원 명단은 릴리스마다 늘어나고 있습니다. 위 출력을 뽑은 뒤로 Qwen Code(`qwen`), Grok CLI(`grok`), Antigravity CLI(`antigravity-cli`) 통합이 추가됐고, Letta Code(`letta`)는 아직 실험 단계라 설정 화면에는 나오지 않고 `herdr integration install letta` 로만 설치할 수 있어요. 업데이트 뒤에는 `herdr integration status --outdated-only` 로 다시 설치해야 할 통합만 골라보면 편합니다.

경로를 보면 통합이 무엇인지도 짐작이 갑니다. 별도의 서버나 데몬이 아니라 각 에이전트의 설정 디렉토리에 파일 하나를 놓는 방식이거든요. Claude Code는 `~/.claude/hooks/` 에 셸 스크립트를, OpenCode는 플러그인 자바스크립트를, Hermes는 파이썬 모듈을 설치합니다. 에이전트가 제공하는 확장 지점에 맞춰 형태만 달라지는 셈입니다.

Codex와 Claude Code 통합은 고유 세션 식별자(native session identity)를 Herdr에 알려줍니다. 서버가 완전히 재시작되어 원래 프로세스가 사라져도 대화를 다시 시작하는 데 쓰이는 정보예요. 이 두 에이전트의 `working` 과 `blocked` 상태는 통합 훅(integration hook)만 믿지 않고 화면 감지 규칙으로 계속 판별합니다. 권한 승인 뒤의 상태 전환처럼 훅이 놓칠 수 있는 순간이 있기 때문입니다.

화면 문구가 바뀌어 상태를 잘못 감지하는 것 같다면 설정부터 건드리지 마세요. 다음 명령으로 어떤 규칙이 적용됐는지 먼저 확인할 수 있습니다.

```sh
herdr agent explain <에이전트_이름_또는_패널_ID>
```

이 명령은 어떤 감지 규칙이 화면과 일치했는지, 왜 최종 상태가 선택됐는지 보여줍니다. `unknown` 은 작업 완료가 아니라 Herdr가 확신하지 못한다는 뜻이므로, 결과를 확인하기 전에는 끝났다고 간주하지 않는 게 안전해요.

## 사이드바 읽는 법

에이전트를 띄우면 사이드바에 한 줄씩 쌓입니다. 워크스페이스 이름 아래에 어떤 에이전트인지가 흐리게 붙고, 왼쪽 아이콘이 지금 상태를 나타냅니다. Herdr가 분류하는 상태는 다섯 가지예요.

- **`blocked`**: 질문, 승인, 의사 결정처럼 사람의 입력이 필요합니다. 가장 먼저 손대야 할 줄이죠.
- **`working`**: 도구를 실행하거나 응답을 만드는 중입니다. 점이 도는 표시가 붙어요.
- **`done`**: 작업은 끝났는데 아직 열어보지 않은 상태입니다. 채워진 원이 붙고, 사람이 확인해야 할 결과가 기다리고 있다는 뜻이에요.
- **`idle`**: 결과까지 확인이 끝나 당장 손댈 일이 없습니다. 체크 표시가 붙습니다.
- **`unknown`**: 현재 상태를 확실하게 분류하지 못했습니다.

체크 표시와 채워진 원의 차이가 헷갈리기 쉬운데, 기준은 “일이 끝났는가”가 아니라 “내가 봤는가”입니다. 원이 붙어 있다면 아직 읽지 않은 결과가 남아 있다는 신호예요.

사이드바 오른쪽 위에는 현재 정렬 방식이 적혀 있습니다. 두 가지 중에서 고를 수 있어요.

- `grouped`: 워크스페이스별로 묶어서 보여줍니다. 줄 순서가 잘 바뀌지 않아 어디에 무엇이 있는지 외우기 좋습니다.
- `priority`: 사람의 손이 필요한 순서로 재배치합니다. 확인을 기다리는 에이전트가 위로 올라오고 조용한 에이전트는 아래로 내려가요.

설정 파일에도 적어둘 수 있는데, 값 이름이 화면 표시와 조금 다릅니다. `grouped` 는 `spaces` 로 씁니다.

```toml
[ui]
agent_panel_sort = "priority"
```

에이전트가 두세 개일 때는 위치가 고정된 `grouped` 가 편합니다. 대여섯 개를 넘어가면 `priority` 가 낫고요. 목록 맨 위만 확인하면 되니까요.

## 터미널을 닫아도 작업 유지하기

Herdr를 실행하면 백그라운드 서버가 패널과 프로세스를 맡습니다. 지금 눈앞에 보이는 터미널 사용자 인터페이스(terminal user interface, TUI)는 클라이언트로 붙어요. 터미널 창을 닫거나 다음 키로 클라이언트만 분리해도 에이전트와 개발 서버, 테스트는 계속 돌아갑니다.

```text
Ctrl+b q
```

나중에 다시 `herdr` 를 실행하면 같은 세션으로 돌아옵니다.

```sh
herdr
```

여기서 분리와 서버 종료를 구분해야 합니다. `Ctrl+b q` 는 화면만 떼어내지만 다음 명령은 서버와 그 안의 패널 프로세스를 실제로 종료합니다.

```sh
herdr server stop
```

서버를 다시 시작하면 워크스페이스, 탭, 패널 배치와 작업 디렉토리는 복원됩니다. 하지만 실행 중이던 개발 서버나 임의의 셸 명령까지 되살아나는 것은 아니에요. 통합이 설치된 에이전트 대화는 네이티브 세션 정보로 재개할 수 있지만, 일반 프로세스는 새 셸에서 다시 실행해야 합니다.

즉, 잠시 자리를 비울 때는 클라이언트를 분리하고, 모든 작업을 정말 끝낼 때만 서버를 멈추면 됩니다. 두 동작을 헷갈리면 오래 돌리던 작업을 직접 종료하는 셈이니 주의하세요.

참고로 0.9.0부터는 서버 없이 단일 프로세스로 띄우던 `--no-session` 모드가 사라져서, `herdr` 를 실행하면 항상 백그라운드 서버에 붙습니다. 같은 서버에 클라이언트를 여러 개 붙였을 때 각자 다른 워크스페이스와 탭을 따로 볼 수 있게 된 것도 이때부터예요. 노트북 터미널에서는 구현 중인 워크스페이스를, 외부 모니터 터미널에서는 리뷰 워크스페이스를 띄워두는 식으로 쓸 수 있습니다.

## 워크트리로 병렬 작업 격리하기

여러 에이전트가 같은 체크아웃에서 파일을 고치면 서로의 변경을 덮어쓸 수 있습니다. 병렬 작업에서는 화면만 나눠서는 부족해요. Herdr는 [git worktree 사용법](https://daleseo.com/git-worktree/) 에서 다룬 워크트리(worktree)를 워크스페이스와 연결해 파일까지 분리합니다.

현재 저장소를 기준으로 새 브랜치와 워크트리를 만들고 Herdr 워크스페이스로 열려면 다음처럼 실행합니다.

```sh
herdr worktree create \
  --cwd "$PWD" \
  --branch feature/auth \
  --base main \
  --label auth \
  --no-focus
```

새 워크트리는 원본 저장소의 워크스페이스 아래에 묶여 표시됩니다. 그래도 일반 워크스페이스처럼 탭과 패널을 자유롭게 만들 수 있어요. 인증 기능은 한 워크트리에서 Codex가 구현하고 원래 워크스페이스에서는 Claude Code가 다른 버그를 조사하도록 나누는 식입니다.

워크트리 작업이 끝났다면 워크스페이스 ID를 확인하고 제거합니다.

```sh
herdr worktree list --cwd "$PWD"
herdr worktree remove --workspace <워크스페이스_ID>
```

`herdr workspace close` 는 Herdr 화면에서 워크스페이스만 닫고 체크아웃은 남깁니다. 0.9.0부터는 워크트리 워크스페이스가 열려 있는 원본 워크스페이스를 닫으려면 `--group` 을 붙여 그룹 전체를 닫겠다는 의도를 분명히 밝혀야 해요. 실수로 딸린 워크트리 작업까지 한꺼번에 닫는 일을 막기 위해서입니다. 반면 `herdr worktree remove` 는 `git worktree remove` 를 실행해 체크아웃까지 정리해요. 브랜치는 삭제하지 않으며, 커밋하지 않은 변경이 있으면 기본적으로 제거를 거부합니다. 작업 결과를 검토하고 커밋한 뒤 정리하는 습관을 들이는 게 좋습니다.

## CLI로 에이전트가 다른 에이전트 다루기

Herdr의 재미있는 지점은 사람이 화면을 조작하는 데서 끝나지 않는다는 겁니다. 실행 중인 서버는 워크스페이스와 탭, 패널, 에이전트를 제어하는 CLI와 소켓 응용 프로그래밍 인터페이스(application programming interface, API)를 제공합니다. 한 에이전트가 옆 패널을 만들고 다른 에이전트를 띄울 수 있어요. 작업이 끝날 때까지 기다렸다가 결과를 읽는 것도 가능합니다.

예를 들어 현재 패널 오른쪽에 새 패널을 만들고 Codex 리뷰어를 시작해보겠습니다.

```sh
# 현재 작업 디렉토리를 유지한 채 오른쪽에 패널을 만듭니다.
split=$(herdr pane split \
  --current \
  --direction right \
  --cwd "$PWD" \
  --no-focus)

# 응답 JSON에서 새 패널 ID를 읽습니다.
review_pane=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')

# 빈 셸 패널에 이름이 reviewer인 Codex를 시작합니다.
herdr agent start reviewer --kind codex --pane "$review_pane"

# 작업을 보내고 처리 결과가 나올 때까지 기다립니다.
herdr agent prompt reviewer \
  "현재 변경분을 리뷰하고 실제 버그만 보고해줘" \
  --wait \
  --timeout 120000

# 리뷰어의 최근 출력을 읽습니다.
herdr agent read reviewer --source recent-unwrapped --lines 120
```

화면 순서를 보고 패널 ID를 짐작하면 안 됩니다. 생성 명령이 돌려준 JSON에서 ID를 읽어 다음 명령에 넘기세요. `agent start` 는 이미 에이전트나 서버가 실행 중인 패널을 비워주지도 않습니다. 대화형 셸 프롬프트가 떠 있는 패널을 직접 지정해야 해요.

에이전트에게 이 제어 방법을 매번 설명하기 싫다면 Herdr가 제공하는 [에이전트 스킬](https://daleseo.com/agent-skills/) (agent skill)을 설치할 수 있습니다.

```sh
bunx skills add herdrdev/herdr --skill herdr -g
```

명령에 등장하는 `skills` 는 공개된 스킬을 내려받아 설치하는 [skills.sh](https://daleseo.com/skills-sh/) 도구입니다. 지금 설치된 Herdr 버전에 딱 맞는 스킬 내용을 보고 싶다면 `herdr --skill` 로 바이너리에 내장된 사본을 출력할 수도 있어요.

이 스킬은 에이전트가 Herdr 안에서 실행 중인지 `HERDR_ENV=1` 로 먼저 확인하고, 현재 패널을 기준으로 안전하게 분할하고 출력과 상태를 읽는 방법을 알려줍니다. 스킬 자체가 별도 서비스는 아니고, Herdr CLI를 올바르게 쓰도록 가르치는 지침 파일입니다.

그래서 Herdr는 사람을 위한 멀티플렉서이면서 에이전트가 조작할 수 있는 런타임(runtime)이 됩니다. 개발 서버가 준비될 때까지 기다렸다가 테스트를 실행해도 되고, 구현 담당이 끝난 뒤 리뷰 담당 에이전트를 시작해도 됩니다. 이런 흐름이 모두 터미널 안에서 이어져요.

## SSH로 원격 세션에 붙기

Herdr 서버는 작업이 실제로 돌아가는 머신에 둡니다. 원격 서버에 코드와 인증 정보가 있다면 평소처럼 SSH로 접속한 뒤 그 안에서 Herdr를 실행하세요.

```sh
ssh you@server
herdr
```

연결을 끊기 전에 `Ctrl+b q` 로 분리하면 원격 Herdr 서버와 에이전트는 계속 실행됩니다. 다시 SSH로 들어가 `herdr` 를 실행하면 같은 화면으로 돌아오고요. 이 흐름은 tmux를 원격 서버에서 쓰는 방식과 거의 같습니다.

로컬 터미널에서 원격 Herdr 서버에 바로 붙는 방법도 있습니다.

```sh
herdr --remote workbox
```

`workbox` 는 `~/.ssh/config` 에 등록한 호스트 이름입니다. 이 방식에서는 로컬 Herdr가 얇은 클라이언트(thin client)가 되어 SSH로 원격 서버 화면을 받아옵니다. 로컬 단축키를 유지할 수 있고, 이미지 클립보드 붙여넣기 같은 데스크톱 기능을 원격 세션으로 연결할 수 있다는 장점이 있어요.

### 여러 머신을 한 화면에서 관리하기

0.9.0에서 가장 크게 바뀐 부분이 바로 여기입니다. 이제 SSH 머신을 한 번 저장해두면 로컬 작업과 원격 에이전트를 Herdr 창 하나에서 함께 볼 수 있어요.

```sh
herdr machine add workbox --label "Build machine"
```

`machine add` 는 원격에 Herdr가 없거나 호환되지 않으면 확인을 받은 뒤 설치하고, 백그라운드 서버까지 띄운 다음 프로필을 저장합니다. 설치나 서버 교체에 승인이 필요할 수 있으니 대화형 터미널에서 실행하세요. 로컬과 원격의 Herdr 버전이 정확히 같을 필요는 없습니다.

저장이 끝나면 `herdr` 를 실행했을 때 사이드바에 `Local` 과 저장한 머신이 함께 나타나고, 머신마다 워크스페이스 목록이 딸려 표시됩니다. 머신이나 워크스페이스를 선택하면 입력과 화면이 그 머신으로 전환돼요. 에이전트 목록도 머신을 가리지 않고 합쳐지기 때문에, 원격 서버의 에이전트가 `blocked` 가 되면 로컬 에이전트와 똑같이 바로 눈에 띄어요. 한 머신의 연결이 끊겨도 다른 머신에는 영향이 없고, 끊긴 머신은 흐리게 표시된 채 자동으로 다시 연결을 시도합니다.

저장한 머신은 다음 명령으로 관리합니다. 프로필 ID는 라벨이나 호스트 이름으로 짐작하지 말고 `list` 결과에서 읽으세요.

```sh
herdr machine list
herdr machine disable <프로필_ID>
herdr machine remove <프로필_ID>
```

머신을 비활성화하거나 제거해도 연결만 끊길 뿐 원격 세션과 에이전트는 계속 돌아갑니다.

0.9.1부터는 CLI 자동화도 원격 머신으로 넘길 수 있습니다. 명령 앞에 `--machine` 을 붙이면 저장된 프로필의 원격 세션을 대상으로 실행돼요. Herdr 창을 열어두지 않아도 됩니다.

```sh
herdr --machine "Build machine" agent list
herdr --machine "Build machine" agent prompt reviewer "현재 변경분을 리뷰해줘"
```

화면에서 원격 머신을 선택해도 기존 패널에서 실행하는 CLI 명령의 대상은 바뀌지 않는다는 점은 기억해두세요. 워크스페이스, 패널 ID, 에이전트 이름은 서버마다 따로 매겨지므로 두 머신에 똑같이 `reviewer` 라는 에이전트가 있을 수도 있습니다. 원격 대상을 다룰 때는 항상 `--machine` 을 명시하는 편이 안전해요.

### 휴대폰에서 확인하기

별도의 모바일 앱이나 웹 대시보드는 없지만, 휴대폰의 SSH 클라이언트로 서버에 접속해 같은 세션을 열 수도 있습니다. 좁은 화면에서는 UI가 그 폭에 맞게 바뀌므로 외부에서 막힌 에이전트의 질문을 확인하는 용도로 쓸 만합니다.

## 설정으로 내 환경에 맞추기

Herdr 설정은 `~/.config/herdr/config.toml` 한 파일에 모입니다. Windows에서는 `%APPDATA%\herdr\config.toml` 이고요. 파일이 없으면 직접 만들면 됩니다.

고친 내용은 서버를 재시작하지 않고 적용할 수 있습니다.

```sh
herdr server reload-config
```

Herdr 안에서는 `prefix Shift+r` 이 같은 일을 합니다. 문법이 맞는지 미리 확인하려면 다음 명령을 쓰세요.

```sh
herdr config check
```

`prefix s` 로 여는 설정 화면에서 값을 바꿀 수도 있지만, 어떤 항목이 있는지 훑어보기에는 파일을 직접 여는 편이 빠릅니다.

### 알림음 끄기

기본적으로 백그라운드 워크스페이스의 에이전트가 상태를 바꾸면 소리가 납니다. 집중할 때 거슬린다면 통째로 끕니다.

```toml
[ui.sound]
enabled = false
```

에이전트별로 나눠서 끌 수도 있어요. 오래 걸리는 작업만 소리로 알리고 나머지는 조용히 두는 식입니다.

```toml
[ui.sound.agents]
claude = "on"
codex = "off"
```

값은 `"default"`, `"on"`, `"off"` 중 하나입니다. 소리 파일을 바꾸고 싶다면 mp3 경로를 지정하면 되고, 작업 완료와 승인 요청에 다른 소리를 줄 수도 있습니다.

```toml
[ui.sound]
done_path = "sounds/done.mp3"
request_path = "sounds/request.mp3"
```

잠깐만 조용히 시키고 싶을 때는 설정을 고치는 대신 `HERDR_DISABLE_SOUND` 환경 변수를 쓰는 게 편합니다.

### 알림 받는 방식 바꾸기

소리 말고 눈으로 보는 알림은 별도 설정이고, 기본값은 꺼져 있습니다.

```toml
[ui.toast]
delivery = "system"
delay_seconds = 1
```

`delivery` 에 넣을 수 있는 값은 네 가지예요.

- `"off"`: 알림을 띄우지 않음(기본값)
- `"herdr"`: Herdr 화면 안에 토스트로 표시
- `"terminal"`: 바깥 터미널의 알림 기능 사용
- `"system"`: 운영체제 알림 센터로 전달

원격 서버에서 작업한다면 `"terminal"` 이 특히 쓸모 있습니다. 알림이 원격 머신이 아니라 지금 보고 있는 로컬 터미널에 뜨거든요. `delay_seconds` 는 상태가 바뀌고 몇 초 뒤에 알릴지 정합니다. 잠깐 `blocked` 가 됐다가 스스로 풀리는 경우까지 알림을 받지 않으려는 장치예요.

Herdr 토스트를 쓴다면 위치도 고를 수 있습니다.

```toml
[ui.toast.herdr]
position = "bottom-right"
```

알림을 봤다면 `prefix o` 로 해당 패널까지 한 번에 이동할 수 있습니다.

### 테마 바꾸기

테마는 이름만 적으면 됩니다.

```toml
[theme]
name = "catppuccin"
```

터미널의 밝기 설정을 따라 자동으로 전환할 수도 있어요.

```toml
[theme]
name = "catppuccin"
auto_switch = true
light_name = "catppuccin-latte"
dark_name = "catppuccin"
```

개별 색만 손보고 싶다면 덮어씁니다. 16진수 색상 코드나 `rgb(r,g,b)` 를 쓰고, 터미널 배경을 그대로 비치게 하려면 `reset` 을 넣습니다.

```toml
[theme.custom]
panel_bg = "reset"
accent = "#a6e3a1"
```

### 단축키 다시 지정하기

앞에서 본 `unset` 동작에 키를 붙이거나 기존 키를 바꾸는 일도 이 파일에서 합니다.

```toml
[keys]
prefix = "ctrl+a"
new_tab = "prefix+c"
switch_workspace = "prefix+shift+1..9"
next_tab = ["prefix+n", "ctrl+alt+]"]
```

`prefix` 값을 바꾸면 나머지 `prefix+...` 정의가 통째로 따라옵니다. `1..9` 처럼 범위를 쓰면 번호 키를 한 줄로 묶어 할당할 수 있고, 배열로 적으면 한 동작에 단축키를 여러 개 붙일 수 있어요. 키 설정이 꼬였다면 되돌리는 명령이 있습니다.

```sh
herdr config reset-keys
```

자주 쓰는 도구를 팝업으로 띄우는 키도 만들 수 있습니다. [lazygit](https://daleseo.com/lazygit/) 을 패널 위에 겹쳐 열었다 닫는 식이죠.

```toml
[[keys.command]]
key = "prefix+alt+g"
type = "popup"
command = "lazygit"
description = "run lazygit"
width = "80%"
height = "80%"
```

`type` 에는 팝업 대신 `"pane"` (확대된 임시 패널)이나 `"shell"` (백그라운드 실행)도 쓸 수 있습니다.

### 사이드바와 터미널 기본값

사이드바는 폭과 시작 상태를 정할 수 있습니다. 화면이 좁다면 접은 채로 시작하는 편이 낫습니다.

```toml
[ui]
sidebar_width = 26
sidebar_start_collapsed = true
sidebar_collapsed_mode = "compact"
```

`sidebar_collapsed_mode` 를 `"hidden"` 으로 두면 접었을 때 완전히 사라지고, `"compact"` 는 상태 아이콘만 남깁니다.

새 패널이 어떤 셸을 어디서 시작할지도 정해둘 수 있어요.

```toml
[terminal]
default_shell = "nu"
new_cwd = "follow"
```

`new_cwd` 는 `"follow"` (현재 패널의 디렉토리를 따라감), `"home"`, `"current"` 중에서 고르거나 `"~/projects"` 처럼 고정 경로를 넣습니다.

화면 배치를 조금 더 다듬는 옵션도 최근 릴리스에서 늘었습니다.

```toml
[ui]
tab_bar_position = "bottom"
pane_scrollbars = false
pane_borders = "always"
```

`tab_bar_position` 은 탭 줄을 패널 아래로 내리고, `pane_scrollbars = false` 는 스크롤바가 차지하던 한 칸을 돌려줍니다. `pane_borders` 는 `"auto"` (분할했을 때만), `"always"` (패널이 하나여도), `"off"` 중에서 고를 수 있어요. 호환되는 터미널에서는 패널 안 이미지 표시가 기본으로 켜지는데, 끄고 싶다면 `[terminal]` 아래에 `kitty_graphics = false` 를 적으면 됩니다.

## tmux, Zellij, cmux와 비교하기

Herdr가 등장했다고 기존 터미널 도구가 필요 없어지는 것은 아닙니다. 어떤 문제를 풀고 싶은지에 따라 선택이 달라져요.

[tmux](https://daleseo.com/tmux/) 는 오래 검증된 범용성과 서버 환경의 높은 보급률이 강점입니다. 에이전트 상태를 이해하지는 않지만, 원격 서버에서 셸과 프로세스를 안정적으로 유지하려는 목적에는 여전히 훌륭해요.

[Zellij](https://daleseo.com/zellij/) 는 화면에 단축키가 표시되고 선언형 레이아웃과 플러그인을 지원해 멀티플렉서 입문이 편합니다. 여러 셸을 보기 좋게 구성하는 게 목적이라면 좋은 선택입니다.

[cmux](https://daleseo.com/cmux/) 는 Herdr와 같은 Ghostty 엔진을 쓰지만 형태가 다릅니다. 내장 브라우저와 macOS 알림까지 묶은 네이티브 터미널 앱이라, 쓰던 터미널을 아예 대체하고 macOS 로컬 개발 환경을 하나로 합치고 싶을 때 매력적이죠.

[Superlogical](https://daleseo.com/superlogical/) 은 Ghostty 개발자가 직접 만드는 서버 중심 멀티플렉서입니다. 세션을 여러 기기에서 이어 쓰고 블록마다 메서드와 이벤트 API를 노출하는 방향이라, Herdr가 앱 기능으로 넣은 에이전트 관리를 API 재료로 풀어내려는 시도로 볼 수 있어요. 아직 알파 전 단계라 당장 쓸 수는 없습니다.

[Paseo](https://daleseo.com/paseo/) 는 터미널 멀티플렉서가 아니라 데몬이 에이전트를 실행하고 데스크톱, 모바일, CLI가 그 데몬에 접속하는 구조입니다. 워크트리마다 Claude Code나 Codex를 띄우는 점은 Herdr와 비슷하지만, 폰 앱에서 권한 요청을 승인하고 diff까지 확인할 수 있다는 점이 다릅니다.

Herdr는 기존 터미널을 그대로 쓰면서 여러 종류의 코딩 에이전트를 동시에 관리하고 싶을 때 가장 잘 맞습니다. 실제 프로세스를 유지하면서 에이전트의 상태를 읽어주고, 에이전트 자신도 CLI를 호출할 수 있으니까요.

다만 Herdr 안에서 tmux를 한 번 더 실행하는 중첩 구성은 피하는 편이 좋습니다. Herdr는 패널의 전경 프로세스를 기준으로 에이전트를 찾는데, 그 안에 tmux가 있으면 실제 에이전트 대신 tmux 프로세스만 보일 수 있습니다. Herdr를 바깥 멀티플렉서로 쓸지, tmux를 쓸지 한 계층에서 선택하는 편이 상태 감지에 유리합니다.

## 사용할 때 주의할 점

Herdr는 빠르게 바뀌는 비교적 새로운 도구입니다. 마지막으로 확인한 버전은 0.9.1이며, 0.7.5로 처음 글을 쓴 뒤 두 달 사이에 Windows 정식 지원과 멀티 머신 관리가 들어올 만큼 변화가 빠릅니다. 설치 직후나 업데이트 후에는 `herdr --help` 로 현재 CLI를 확인하는 편이 안전합니다.

상태 표시를 절대적인 사실로 믿어서도 안 됩니다. 에이전트의 터미널 UI가 바뀌거나 예상하지 못한 화면이 나오면 `unknown` 으로 남거나 다른 상태로 분류될 수 있어요. 중요한 작업은 사이드바의 색만 보고 끝났다고 판단하지 말고, 결과와 변경분을 직접 검토해야 합니다.

병렬 에이전트 수를 늘리면 모델 사용량과 머신 자원도 함께 늘어납니다. 패널을 열 수 있다는 이유만으로 작업을 잘게 쪼개기보다는 서로 독립적이고 동시에 진행할 가치가 있는 일만 나누는 게 좋습니다. 같은 파일을 고치는 작업이라면 워크트리로 격리하고, 결과를 합치는 책임은 여전히 사람에게 있고요.

`herdr server stop`, `herdr pane close`, `herdr worktree remove` 처럼 프로세스나 체크아웃을 없애는 명령은 자동화에서 특히 조심해야 합니다. 현재 위치를 뜻하는 `--current` 나 생성 응답에서 받은 명시적인 ID를 쓰세요. 그래야 다른 작업을 잘못 건드릴 가능성이 줄어듭니다.

## 마치며

Herdr는 tmux에 에이전트 상태 표시를 조금 더한 도구가 아닙니다. 실제 터미널 프로세스를 유지하는 멀티플렉서, 여러 프로젝트를 정리하는 워크스페이스 관리자, 에이전트가 다시 호출할 수 있는 자동화 API가 한 바이너리에 모여 있어요.

처음에는 프로젝트 하나에 패널 두 개만 열어보세요. 한쪽에는 익숙한 코딩 에이전트, 다른 쪽에는 개발 서버를 띄우고 `Ctrl+b q` 로 분리했다가 다시 붙어보는 겁니다. 그다음 에이전트를 두세 개로 늘렸을 때 사이드바의 `blocked`, `working`, `done` 상태가 터미널 순찰을 얼마나 줄여주는지 체감할 수 있을 거예요.

더 자세한 설치 옵션과 설정은 [Herdr 공식 문서](https://herdr.dev/docs/) 를, 구현과 라이선스는 [Herdr GitHub 저장소](https://github.com/herdrdev/herdr) 를 참고하세요.

This work is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/?ref=chooser-v1)