---
title: Java JNI (Java Native Interface)
updated: 2026-08-11 17:04:12
tags:
  - java
  - jni
  - native
  - c
---

## 1. 개요

JNI(Java Native Interface)는 JVM에서 실행되는 Java 코드가 C/C++로 작성된 네이티브 코드를 호출하거나, 네이티브 코드가 JVM을 구동해 Java 코드를 호출할 수 있게 하는 표준 인터페이스다. Java에서 네이티브 코드를 호출하는 경우, `native` 키워드로 선언한 메서드를 네이티브 라이브러리(`.so`/`.dylib`/`.dll`)의 C 함수에 연결하는 방식으로 동작한다.

---

## 2. Native 메서드

### 2.1 Java 선언

`native` 키워드를 붙이고 본문 없이 세미콜론으로 끝내면 구현이 네이티브 라이브러리에 있음을 나타낸다. 클래스 초기화 시 `System.loadLibrary()`로 라이브러리를 로드해야 링크된다.

```java
package p.q.r;

class A {
    native double f(int i, String s);
    static {
        System.loadLibrary("p_q_r_A");
    }
}
```

`javac -h <dir>` 옵션으로 컴파일하면 native 메서드를 포함한 클래스마다 대응하는 C 헤더 파일(`.h`)이 생성된다.

```bash
javac -h . p/q/r/A.java
```

### 2.2 C 구현

JNI는 `native` 메서드 선언과 네이티브 라이브러리의 C 함수를 1:1로 매핑하는 이름 규칙을 정의한다: `Java_` + 이스케이프된 클래스 바이너리 이름(`/`→`_`) + `_` + 이스케이프된 메서드 이름 (오버로드 시 `__`+파라미터 시그니처 추가).

```c
#include <jni.h>

JNIEXPORT jdouble JNICALL Java_p_q_r_A_f
  (JNIEnv *env, jobject obj, jint i, jstring s)
{
    const char *str = (*env)->GetStringUTFChars(env, s, 0);
    /* ... */
    (*env)->ReleaseStringUTFChars(env, s, str);
    return /* ... */;
}
```

- 첫 인자는 항상 `JNIEnv*`(인터페이스 포인터), 두 번째는 인스턴스 메서드면 `jobject`(this), static 메서드면 `jclass`.
- 나머지 인자는 Java 메서드 인자와 1:1 대응하고, 함수 이름·시그니처는 `javac -h`가 생성한 헤더와 정확히 일치해야 링크된다.

---

## 3. 라이브러리 빌드와 로드

### 3.1 빌드

플랫폼별 컴파일러로 공유 라이브러리를 빌드한다. macOS는 `.dylib`, Linux는 `.so`, Windows는 `.dll`.

```bash
# macOS
clang -shared -fPIC -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/darwin" \
  -o libp_q_r_A.dylib p_q_r_A.c

# Linux
gcc -shared -fPIC -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/linux" \
  -o libp_q_r_A.so p_q_r_A.c
```

### 3.2 로드

- `System.loadLibrary(String libname)`: 라이브러리 이름만 전달(접두사·확장자·경로 제외). `java.library.path`에서 탐색해 플랫폼별 이름(`libX.so`, `libX.dylib`, `X.dll`)으로 매핑한다.
- `System.load(String filename)`: 절대 경로를 직접 전달. 경로 탐색 없이 해당 파일을 즉시 로드한다.

```java
System.loadLibrary("p_q_r_A");             // java.library.path에서 libp_q_r_A.dylib 탐색
System.load("/abs/path/libp_q_r_A.dylib"); // 절대 경로 직접 로드
```

`-Djava.library.path=<dir>` VM 옵션으로 탐색 경로를 지정할 수 있다.

`java.library.path`는 Java가 직접 요청한 라이브러리 파일을 찾는 데만 쓰인다. 그 라이브러리가 다른 공유 라이브러리에 의존한다면, 그 전이적 의존성은 OS 동적 링커가 `LD_LIBRARY_PATH`(Linux, macOS는 `DYLD_LIBRARY_PATH`)를 통해 해석한다 — `java.library.path`는 여기 관여하지 않는다. 의존성이 있는 라이브러리는 두 경로 변수를 모두 설정해야 한다. 단, Unix 계열 JVM은 시작 시 `LD_LIBRARY_PATH` 내용을 `java.library.path`에 병합하기도 한다.

---

## 4. 주의사항

### 4.1 라이브러리 이름

`System.loadLibrary()`에 플랫폼 접두사(`lib`)나 확장자(`.so`/`.dylib`)를 포함하면 `UnsatisfiedLinkError`가 발생한다. 순수 라이브러리 이름만 전달해야 한다.

### 4.2 macOS Quarantine 속성으로 인한 로드 실패

macOS는 인터넷이나 외부 출처에서 받은 파일에 Gatekeeper가 `com.apple.quarantine` 확장 속성(extended attribute)을 부여한다. 다운로드하거나 외부에서 복사해온 `.dylib`을 이 속성이 남은 채로 JNI를 통해 로드하면 오류가 발생할 수 있다[^1].

실제로 `.dylib`을 `System.loadLibrary()`/`System.load()`로 로드할 때 오류가 발생했고, 아래 명령으로 quarantine 속성을 제거한 뒤 정상 동작을 확인했다.

```bash
xattr -d com.apple.quarantine /path/to/libp_q_r_A.dylib
```

`xattr -d <attr_name> <file>`은 지정한 확장 속성을 삭제하는 명령이다.

---
## Sources
- `raw/troubleshoot/native-lib-setup.md`
- [JNI Specification: Chapter 2. Design Overview — Oracle](https://docs.oracle.com/en/java/javase/21/docs/specs/jni/design.html)
- [System — Java SE 21 API — Oracle](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html)
- [javac — Java SE 21 Tool Reference — Oracle](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html)
- `man xattr` (macOS)
- [Difference between java.library.path and LD_LIBRARY_PATH](https://kalpakrg.wordpress.com/2009/01/09/java-library-path-and-ld_library_path/)
- [JNI and the Java library path](https://zauner.nllk.net/post/0013-jni-and-the-java-library-path/)
- 사용자 실측: quarantine 속성 제거 전 로드 오류, 제거 후 정상 동작 확인

---
## Related pages

---
[^1]: quarantine 속성과 JNI 라이브러리 로드 실패의 정확한 인과 관계(서명·공증 여부에 따른 Gatekeeper 차단 조건)는 Apple 공식 문서에서 별도로 확인하지 못함. 사용자가 실제로 겪은 사례를 근거로 기술.
