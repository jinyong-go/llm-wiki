---
title: OpenSSL dgst — 해시·HMAC·디지털 서명
updated: 2026-07-08 10:32:15
tags:
  - linux
  - openssl
  - hash
  - hmac
  - cryptography
---

## 1. 개요

해시(Hash)란 임의 길이의 데이터를 고정 길이의 값으로 변환하는 단방향 함수. 주요 용도는 데이터 무결성 검사. 같은 입력은 항상 같은 출력을 내고, 출력에서 입력을 역산할 수 없다.

`openssl dgst`는 해시·HMAC·디지털 서명을 알고리즘에 무관하게 일관된 인터페이스로 제공한다. OpenSSL 1.1.0부터 기본 알고리즘이 MD5 → SHA-256으로 변경되었다.

```
openssl dgst [-<alg>] [options] [file ...]
```

---

## 2. 기본 사용법

```bash
# 지원 알고리즘 목록
openssl dgst -list

# 파일 해시
openssl dgst -sha256 file.txt
# SHA2-256(file.txt)= e3b0c44...

# 알고리즘 변경
openssl dgst -sha512 file.txt
openssl dgst -sha3-256 file.txt

# 표준 입력 해시
echo -n "message" | openssl dgst -sha256
```

> `echo` 사용 시 `-n` 없으면 줄바꿈(`\n`)까지 해시에 포함되어 결과가 달라진다.

---

## 3. 주요 옵션

| 옵션 | 설명 |
|------|------|
| `-<alg>` | 해시 알고리즘 지정 (`-sha256`, `-sha512`, `-sha3-256`, `-shake256` 등) |
| `-list` | 지원 알고리즘 목록 출력 |
| `-hex` | 결과를 16진수 문자열로 출력 (기본값) |
| `-binary` | 결과를 바이너리로 출력 |
| `-c` | 16진수 출력을 콜론으로 구분 (`ab:cd:ef:...`) |
| `-r` | Coreutils 형식 출력 (`해시값  파일명`) — `sha256sum`과 동일 형식 |
| `-out <file>` | 결과를 파일로 저장 |
| `-xoflen <n>` | shake128/shake256 출력 바이트 수 지정 |
| `-hmac <key>` | HMAC 생성 |
| `-sign <key>` | 개인키로 디지털 서명 생성 |
| `-verify <key>` | 공개키로 서명 검증 |
| `-signature <file>` | `-verify`와 함께 사용할 서명 파일 지정 |

---

## 4. 출력 형식 비교

```bash
# -hex (기본): 알고리즘과 파일명 포함
openssl dgst -sha256 file.txt
# SHA2-256(file.txt)= abc123...

# -r: sha256sum과 동일한 형식
openssl dgst -sha256 -r file.txt
# abc123...  file.txt

# -c: 콜론 구분 16진수
openssl dgst -sha256 -c file.txt
# SHA2-256(file.txt)= ab:cd:ef:...

# -binary: 바이너리 → base64 조합
openssl dgst -sha256 -binary file.txt | base64
```

---

## 5. HMAC

공유 비밀키로 메시지 인증 코드를 생성. 수신 측이 동일 키로 계산해 값이 일치하면 메시지의 무결성과 출처를 함께 확인할 수 있다. API 인증, 웹훅 서명 검증 등에 사용.

```bash
echo -n "message" | openssl dgst -sha256 -hmac "secret-key"
# HMAC-SHA2-256(stdin)= 5a4f...
```

> OpenSSL 공식 문서는 MAC 연산에 `openssl dgst -hmac` 대신 `openssl mac` 사용을 권장한다.

---

## 6. 디지털 서명

```bash
# 개인키로 서명 생성 (바이너리 출력)
openssl dgst -sha256 -sign private.key -out signature.bin file.txt

# 공개키로 서명 검증
openssl dgst -sha256 -verify public.key -signature signature.bin file.txt
# Verified OK  (또는 Verification Failure)

# 개인키에서 공개키 추출
openssl rsa -in private.key -pubout -out public.key
```

주의:
- `-sign` / `-verify`는 파일 하나에만 동작한다. 여러 파일은 별도 처리 필요.
- `-hex` 형식의 서명은 `openssl dgst -verify`로 직접 검증할 수 없다. 검증하려면 먼저 `xxd -r`로 바이너리 변환이 필요하다.
- `-sign`은 Ed25519·Ed448 키를 지원하지 않는다. 해당 키로 서명할 때는 `openssl pkeyutl`을 사용.

---

## 7. XOF 알고리즘 (shake)

shake128/shake256은 출력 길이를 직접 지정하는 XOF(Extendable Output Function).

```bash
openssl dgst -shake256 -xoflen 32 file.txt   # 256-bit 출력
openssl dgst -shake128 -xoflen 32 file.txt   # 256-bit 강도
```

> shake128의 기본 출력 길이는 보안 강도가 64-bit에 불과하다. 128-bit 강도를 원한다면 `-xoflen 32` 이상을 명시해야 한다.

---

## Sources
- [openssl-dgst (OpenSSL Documentation)](https://docs.openssl.org/master/man1/openssl-dgst/)

---

## Related pages
- [[openssl-overview]]
- [[openssl-keygen]]
- [[openssl-cms]]
- `openssl enc`
- `openssl genrsa` / `openssl genpkey`
