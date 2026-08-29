---
title: vi/vim 검색·치환
updated: 2026-07-08 10:32:15
tags:
  - linux
  - vim
  - editor
---

## 1. 검색

```
/pattern    앞으로 검색 (Enter로 확정)
?pattern    뒤로 검색
n           다음 결과
N           이전 결과
*           커서 아래 단어를 앞으로 검색
#           커서 아래 단어를 뒤로 검색
:noh        검색 강조 표시 해제
```

검색은 정규식을 지원한다:

| 패턴 | 의미 |
|------|------|
| `/foo\|bar` | foo 또는 bar |
| `/\<foo\>` | 단어 경계 (foo 단독) |
| `/\cfoo` | 대소문자 무시 |
| `/^foo` | foo로 시작하는 줄 |
| `/foo$` | foo로 끝나는 줄 |
| `/\d\+` | 숫자 1개 이상 |

## 2. 치환 (Substitute)

기본 형태:
```
:[range]s/pattern/replace/[flags]
```

### 2.1. 범위 지정

| 범위 | 의미 |
|------|------|
| (생략) | 현재 줄만 |
| `%` | 파일 전체 |
| `1,10` | 1~10번째 줄 |
| `.,+5` | 현재 줄부터 5줄 |
| `'<,'>` | Visual 선택 범위 (Visual 모드에서 `:` 입력 시 자동 설정) |

### 2.2. 플래그

| 플래그 | 의미 |
|--------|------|
| `g` | 줄 내 모든 매칭 (없으면 첫 번째만) |
| `i` | 대소문자 무시 |
| `c` | 각 치환 전 확인 (`y/n/a/q/l`) |
| `e` | 매칭 없어도 에러 무시 |

### 2.3. 자주 쓰는 패턴

```vim
" 파일 전체에서 foo → bar
:%s/foo/bar/g

" 대소문자 무시
:%s/foo/bar/gi

" 치환 전 확인
:%s/foo/bar/gc

" 단어 단위 치환 (oldMethod → newMethod, oldMethodName은 제외)
:%s/\<oldMethod\>/newMethod/g

" 줄 끝 공백 제거 (서버 설정 파일 정리 시 유용)
:%s/\s\+$//g

" 빈 줄 제거
:g/^$/d

" 특정 패턴이 있는 줄 전체 삭제
:g/pattern/d

" Visual 선택 범위만 치환
:'<,'>s/old/new/g
```

## 3. :g 전역 명령

`pattern`이 있는 줄에 명령을 일괄 실행한다.

```
:g/pattern/cmd     pattern이 있는 줄에 cmd 실행
:v/pattern/cmd     pattern이 없는 줄에 cmd 실행 (:g! 와 동일)
```

실용 예시:
```vim
:g/TODO/p          TODO 포함 줄 모두 출력
:g/^#/d            # 로 시작하는 줄 삭제 (주석 제거)
:g/ERROR/t$        ERROR 포함 줄을 파일 끝으로 복사
```

---
## Sources
- [Vim: pattern.txt — 검색 패턴(정규식)](https://vimhelp.org/pattern.txt.html)
- [Vim: change.txt — :substitute 치환](https://vimhelp.org/change.txt.html)
- [Vim: repeat.txt — :global 전역 명령](https://vimhelp.org/repeat.txt.html)

---
## Related pages
- [[vim-01-modes]]
- [[vim-02-navigation]]
- [[vim-03-editing]]
- [[vim-05-practical]]
