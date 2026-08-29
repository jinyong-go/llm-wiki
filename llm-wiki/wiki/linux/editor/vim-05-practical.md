---
title: vi/vim 실용 팁
updated: 2026-07-08 10:32:15
tags:
  - linux
  - vim
  - editor
---

## 1. Visual 블록 편집 (Ctrl+v)

여러 줄에 동시 편집할 때 사용. 설정 파일에서 동일 위치 일괄 수정 시 유용.

1. `Ctrl+v`로 열(column) 선택
2. `I`로 Insert 진입 → 텍스트 입력
3. `Esc` → 선택된 모든 줄에 일괄 적용

| 키 | Visual 모드에서 동작 |
|----|----------------------|
| `v` | 문자 단위 선택 |
| `V` | 줄 단위 선택 |
| `Ctrl+v` | 블록(열) 선택 |
| `d` | 선택 영역 삭제 |
| `y` | 선택 영역 복사 |
| `>` / `<` | 들여쓰기 |
| `~` | 대소문자 전환 |
| `:s/…` | 선택 범위 내 치환 |

## 2. 외부 명령어 연동

```vim
:!{cmd}           셸 명령 실행 (결과 표시만)
:r !{cmd}         명령 출력을 커서 아래에 삽입
:%!{cmd}          파일 전체를 cmd에 통과시켜 결과로 교체
:.!{cmd}          현재 줄을 cmd에 통과시켜 교체
```

실용 예시:
```vim
:%!python3 -m json.tool    JSON 포맷팅 (application.yml 검증 등)
:%!sort                    줄 정렬
:%!sort -u                 줄 정렬 + 중복 제거
:r !date                   현재 날짜를 파일에 삽입
:r !cat /etc/hosts         다른 파일 내용 삽입
```

## 3. 레지스터

삭제·복사한 내용은 레지스터에 저장된다. 기본은 unnamed 레지스터(`"`).

```vim
"ayy      현재 줄을 레지스터 a에 복사
"ap       레지스터 a 내용 붙여넣기
"bdd      현재 줄 삭제 후 레지스터 b에 저장
"+y       시스템 클립보드에 복사
"+p       시스템 클립보드에서 붙여넣기
:reg      레지스터 전체 목록 확인
```

여러 내용을 동시에 다룰 때 a~z 레지스터를 활용하면 된다.

## 4. 매크로

반복 편집 작업을 레지스터에 기록해 재실행.

```
q{a-z}    레지스터에 매크로 기록 시작
q         기록 종료
@{a-z}    매크로 실행
@@        마지막 매크로 재실행
{n}@a     매크로 n회 실행
```

예: 각 줄 끝에 `;` 추가
```
qa         레지스터 a에 기록 시작
$A;<Esc>j  줄 끝으로 이동 → ; 추가 → 다음 줄
q          기록 종료
100@a      100줄에 반복 적용
```

## 5. 멀티 파일 편집

```vim
:e {file}         파일 열기
:tabe {file}      새 탭으로 열기
:tabn / :tabp     다음/이전 탭 (또는 gt / gT)
:split {file}     수평 분할
:vsplit {file}    수직 분할
Ctrl+w h/j/k/l    분할 창 간 이동
Ctrl+w w          다음 창으로 순환
:qa               모든 창 닫기
```

## 6. vimdiff — 파일 비교

```bash
vimdiff file1 file2    # 두 파일 차이 비교
```

vim 내부:
```vim
]c          다음 차이점으로 이동
[c          이전 차이점으로 이동
:diffget    상대 창 내용 가져오기
:diffput    현재 내용 상대 창에 반영
```

## 7. 자주 쓰는 Command-line 명령

```vim
:set paste        외부 붙여넣기 시 자동 들여쓰기 방지
:set nopaste      paste 모드 해제
:set number!      줄 번호 토글
:noh              검색 강조 끄기
:%y+              전체 내용을 클립보드로 복사
:w !sudo tee %    권한 없는 파일 강제 저장
```

## 8. 최소 .vimrc 설정

서버에서 vi 작업 시 유용한 기본값:

```vim
set number
set hlsearch
set incsearch
set ignorecase
set smartcase
set expandtab
set tabstop=4
set shiftwidth=4
set autoindent
syntax on
```

---
## Sources
- [Vim: visual.txt — Visual 모드/블록](https://vimhelp.org/visual.txt.html)
- [Vim: various.txt — 외부 명령(`!`) 필터](https://vimhelp.org/various.txt.html)
- [Vim: repeat.txt — 매크로(q)·레지스터](https://vimhelp.org/repeat.txt.html)
- [Vim: windows.txt — 분할/탭 편집](https://vimhelp.org/windows.txt.html)
- [Vim: diff.txt — vimdiff](https://vimhelp.org/diff.txt.html)

---
## Related pages
- [[vim-01-modes]]
- [[vim-02-navigation]]
- [[vim-03-editing]]
- [[vim-04-search-replace]]
