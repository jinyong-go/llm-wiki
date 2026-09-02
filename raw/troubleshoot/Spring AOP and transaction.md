## 상황
- 서비스(`@Service`)의 메서드에 트랜잭션 선언(`@Transactional`)
- `@EnableTransactionManagement`로 별도 `order` 설정하지 않음
- 서비스의 메서드에 AOP(`@Around`) 적용
	- 마찬가지로 `order` 미설정
	- 예외를 try - catch로 묶고 예외를 삼킴
	- AOP에도 `@Transactional` 사용
	- AOP의 DB 작업은 원래 서비스의 롤백과 무관하게 이뤄져야 함
## 문제
- 서비스의 메서드에서 `RuntimeException` 발생
- 기본적으로는 `RuntimeException` 발생 시 DB 변경사항이 롤백되어야 함
- 하지만 실제 롤백되지 않고 UPDATE되고 있었음
## 해결
- AOP에서 DB에 쓰는 작업은 별도 서비스로 분리하고 해당 서비스 메서드에 `@Transactional` 적용
	- 전파는 `REQUIRE_NEW` 사용
- AOP에는 `@Transactional` 제거하고 예외를 삼키지 않고 그대로 전파하도록 수정
- 정상적으로 서비스에서 예외 발생 시 롤백되는 것 확인