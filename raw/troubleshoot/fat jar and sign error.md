fat jar 생성 시 build.gradle에서 다음 스크립트 사용함:
```groovy
jar {
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

jar 내 모든 클래스의 로드가 SecurityException으로 실패합니다.
  
Exception in thread "main" java.lang.SecurityException:  
    Invalid signature file digest for Manifest main attributes  
        at sun.security.util.SignatureFileVerifier.processImpl(SignatureFileVerifier.java:340)  
        at java.util.jar.JarVerifier.processEntry(JarVerifier.java:279)  
        at java.util.jar.JarFile.initializeVerifier(JarFile.java:761)  
        at jdk.internal.loader.BuiltinClassLoader.defineClass(BuiltinClassLoader.java:848)  
        at java.lang.ClassLoader.loadClass(ClassLoader.java:526)  
  
jarsigner로도 동일하게 재현됩니다.  
  
$ jarsigner -verify library-1.0.4.jar  
jarsigner: java.lang.SecurityException:  
    Invalid signature file digest for Manifest main attributes  
  
원인으로 보이는 부분  
  
jar 내부에 BouncyCastle의 서명 파일이 포함되어 있습니다.  
  
- 1.0.4: META-INF/BCRSA204.SF, META-INF/BCRSA204.RSA  
- 1.0.3: META-INF/BC2048KE.SF, META-INF/BC2048KE.DSA  
  
BouncyCastle을 fat jar로 재패키징하시면서 원본 서명 파일이 함께 포함된 것으로 보입니다. 재패키징 과정에서 META-INF/MANIFEST.MF가 변경되므로 서명 파일에 기록된 다이제스트와 일치하지 않게 되고, JVM이 이를 변조로 판단해 jar 전체를 거부하는 상황입니다.

확인한 사항  
  
해당 서명 파일 2개를 제거한 뒤 동일 테스트를 수행하면 모든 클래스 로드와 암복호화 동작이 정상입니다.

재패키징 시 BouncyCastle 원본 서명 파일(META-INF/*.SF, *.RSA, *.DSA)을 제외한 빌드

부득이 번들이 필요하시면 org.bouncycastle 패키지를 relocate(shade) 처리한 빌드도 대안이 됩니다.