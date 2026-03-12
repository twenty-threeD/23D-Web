# Git 협업 규칙 (Git Collaboration Guide)

## 1. Commit Type 규칙

커밋 메시지는 작업 목적을 명확히 하기 위해 Prefix를 사용한다.

| Type | 설명 |
|-----|-----|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 / 코드 리팩토링 |
| docs | 문서 수정 (README, md 파일 등) |
| test | 테스트 코드 추가 / 테스트 코드 리팩토링 |
| chore | 빌드 업무 수정, 패키지 매니저 수정 |
| comment | 코드 주석 추가 |

### 예시
feat: 인벤토리 시스템 추가
fix: 플레이어 이동 버그 수정
docs: README 업데이트
test: 아이템 시스템 테스트 코드 추가
chore: 패키지 버전 업데이트
comment: PlayerController 설명 주석 추가

---

# 2. 기본 Git 작업 흐름

작업 후 기본적인 Git 사용 흐름

### 1. 변경사항 추가
git add -A

규칙  
- 항상 `-A` 옵션 사용  
- 모든 변경 파일을 한번에 staging

---

### 2. 커밋 생성
git commit


`-m` 옵션을 사용하지 않고 **vim에서 커밋 메시지 작성**

vim 화면이 열리면 다음처럼 작성

구조

첫 줄 → 커밋 제목

둘째 줄 → 공백

셋째 줄부터 → 상세 설명

---

### 3. 원격 저장소에 push
git push origin

---

### 4. 최신 코드 가져오기

작업 시작 전 또는 충돌 방지용

git pull origin main

---
# 커밋 메시지(같이 잔디에 심어짐)

Refactor login logic

Co-authored-by: 친구이름 <친구이메일@example.com>

Co-authored-by: 다른친구 <다른친구@example.com>