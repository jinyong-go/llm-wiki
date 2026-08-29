---
title: 셸 특수 매개변수 (Special Parameters)
updated: 2026-07-14 17:27:27
tags:
  - linux
  - cli
  - shell
  - bash
---

## 1. 개요

셸이 **자동으로 값을 설정하는 읽기 전용 매개변수**. `$` 확장으로만 참조할 수 있고 직접 대입은 불가능하다. 대화형 CLI와 셸 스크립트에서 동일하게 동작하며, 직전 명령의 실행 결과 확인(`$?`), 백그라운드 프로세스 추적(`$!`), 스크립트 인자 처리(`$@`, `$#`) 등에 사용한다.

---

## 2. 일람

| 매개변수 | 값                                                     |
| ---- | ----------------------------------------------------- |
| `$?` | 가장 최근에 실행된(포그라운드) 명령의 **종료 상태**                       |
| `$!` | 가장 최근에 백그라운드로 실행된 프로세스의 PID                           |
| `$$` | 현재 셸의 PID (서브셸에서도 상위 셸의 PID)                          |
| `$0` | 셸 또는 스크립트 파일의 이름                                      |
| `$#` | 위치 매개변수(`$1`, `$2`, …)의 개수                            |
| `$@` | 위치 매개변수 전체 — `"$@"`는 `"$1" "$2" …`처럼 **각각 별도 단어**로 확장 |
| `$*` | 위치 매개변수 전체 — `"$*"`는 IFS 첫 문자로 이어붙인 **단일 단어**로 확장     |
| `$-` | 현재 설정된 셸 옵션 플래그 (예: `himBHs`)                         |
| `$_` | 직전 명령의 마지막 인자 (셸 시작 시에는 셸/스크립트 경로)[^1]                |

[^1]: `$_`는 Bash Reference Manual의 Special Parameters 절과 bash(1)에 정의되어 있으나, 확장 시점·용도가 다른 매개변수보다 유동적이다(직전 simple command 기준).

---

## 3. 종료 상태 (`$?`)

**직전 명령의 실행 결과를 확인하는 표준 수단.** 0~255 범위이며 **0 = 성공**, 0이 아닌 값 = 실패가 규약이다.

| 값 | 의미 |
|----|------|
| 0 | 성공 |
| 1~125 | 명령별 실패 코드 (의미는 각 명령이 정의) |
| 2 | (빌트인) 잘못된 사용 — 옵션 오류, 인자 누락 |
| 126 | 명령이 존재하나 실행 불가 (권한 등) |
| 127 | 명령을 찾을 수 없음 |
| 128+N | 시그널 N으로 종료 (예: 137 = 128+9 = SIGKILL) |

```bash
ls /nonexistent
echo $?              # 2 (ls의 오류 코드)

ls /nonexistent; echo $?; echo $?
                     # 첫 echo는 2, 두 번째는 0 — $?는 매 명령마다 덮어써짐
```

- **`$?`는 다음 명령 실행 즉시 덮어써진다.** 나중에 쓰려면 바로 변수에 저장한다: `rc=$?`
- 파이프라인의 `$?`는 **마지막 명령**의 종료 상태다. 각 단계의 상태는 `PIPESTATUS` 배열로 확인한다 ([[standard-streams]] §5).

```bash
grep foo file | sort
echo "${PIPESTATUS[@]}"   # 예: 1 0 (grep 실패, sort 성공)
```

---

## 4. `$@` vs `$*`

인자를 다른 명령에 전달할 때는 **`"$@"`(큰따옴표 포함)를 사용**한다. 공백이 든 인자가 보존된다.

```bash
#!/bin/bash
# wrapper.sh — 받은 인자를 그대로 전달
java -jar app.jar "$@"
```

| 표기 | 확장 결과 (인자: `a b` `c`) |
|------|--------------------------|
| `"$@"` | `"a b"` `"c"` — 2개 단어 (원형 보존) |
| `"$*"` | `"a b c"` — 1개 단어 (IFS로 연결) |
| `$@` / `$*` (따옴표 없음) | `a` `b` `c` — 3개 단어 (단어 분리 발생) |

---

## 5. 자주 쓰는 패턴

```bash
# 직전 명령 성공 여부 분기
./deploy.sh
if [ $? -ne 0 ]; then
    echo "deploy failed"
fi

# 관용적 대안 — 종료 상태를 조건으로 직접 사용
if ! ./deploy.sh; then
    echo "deploy failed"
fi

# 백그라운드 프로세스 PID 저장 ($!)
nohup java -jar app.jar > app.log 2>&1 &
echo $! > app.pid                # [[nohup]] 참고

# 셸 PID로 유니크한 임시 파일 ($$)
tmpfile="/tmp/work.$$"

# 스크립트 인자 검증 ($#, $0)
if [ $# -lt 2 ]; then
    echo "Usage: $0 SRC DST" >&2
    exit 1
fi

# 직전 명령의 마지막 인자 재사용 ($_)
mkdir -p /var/app/config
cd $_
```

---

## Sources
- [Bash Reference Manual — Special Parameters](https://www.gnu.org/software/bash/manual/html_node/Special-Parameters.html)
- [Bash Reference Manual — Exit Status](https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html)
- [bash(1)](https://man7.org/linux/man-pages/man1/bash.1.html)

---

## Related pages
- [[environment-variables]] — 사용자 정의 변수·변수 확장
- [[standard-streams]] — 파이프라인·PIPESTATUS
- [[nohup]] — `$!`로 백그라운드 PID 추적
