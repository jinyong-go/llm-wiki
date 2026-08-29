---
title: vi/vim 모드 체계
updated: 2026-07-08 10:32:15
tags:
  - linux
  - vim
  - editor
---

vi는 모드 기반 편집기다. 현재 모드에 따라 동일한 키가 다른 동작을 한다. 처음 실행 시 **Normal 모드**로 진입한다.

## 1. 모드 종류

| 모드 | 진입 | 화면 하단 표시 |
|------|------|----------------|
| Normal | `Esc` (어느 모드에서든) | (표시 없음) |
| Insert | `i`, `a`, `o` 등 | `-- INSERT --` |
| Visual | `v`, `V`, `Ctrl+v` | `-- VISUAL --` |
| Command-line | `:`, `/`, `?` | `:` 프롬프트 |
| Replace | `R` | `-- REPLACE --` |

```
Insert ←──── i/a/o ────── Normal ──── : ────→ Command-line
  └──────────────────── Esc ──────────────────┘
                          │
                    v / V / Ctrl+v
                          │
                        Visual
```

## 2. Normal → Insert 진입 키

| 키 | 커서 위치 기준 동작 |
|----|---------------------|
| `i` | 커서 앞에서 삽입 |
| `a` | 커서 뒤에서 삽입 (append) |
| `I` | 줄 첫 비공백 문자 앞에서 삽입 |
| `A` | 줄 끝에서 삽입 |
| `o` | 아래에 새 줄 삽입 후 Insert |
| `O` | 위에 새 줄 삽입 후 Insert |
| `s` | 커서 문자 삭제 후 Insert |
| `S` | 현재 줄 내용 삭제 후 Insert (`cc`와 동일) |
| `c{motion}` | motion 범위 삭제 후 Insert |
| `R` | Replace 모드 (덮어쓰기) |

## 3. 저장·종료

Command-line 모드에서 실행한다.

| 명령 | 동작 |
|------|------|
| `:w` | 저장 |
| `:q` | 종료 (변경 없을 때) |
| `:wq` / `:x` | 저장 후 종료 |
| `:q!` | 변경 내용 버리고 강제 종료 |
| `:w !sudo tee %` | 권한 없는 파일 강제 저장 |
| `ZZ` | `:wq`와 동일 (Normal 모드) |
| `ZQ` | `:q!`와 동일 (Normal 모드) |

---
## Sources
- [Vim: intro.txt — Vim modes](https://vimhelp.org/intro.txt.html)
- [Vim: insert.txt — Insert mode 진입](https://vimhelp.org/insert.txt.html)
- [Vim: editing.txt — 저장·종료](https://vimhelp.org/editing.txt.html)

---
## Related pages
- [[vim-02-navigation]]
- [[vim-03-editing]]
- [[vim-04-search-replace]]
- [[vim-05-practical]]
