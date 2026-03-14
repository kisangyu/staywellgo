# StayWellGo 자동 포스팅 시스템

## 설치 방법 (노트북에서)

### 1. Node.js 설치
https://nodejs.org 에서 LTS 버전 다운로드 설치

### 2. 이 폴더를 노트북에 복사

### 3. 패키지 설치
```
npm install
```

### 4. .env 파일 수정
```
ANTHROPIC_API_KEY=여기에_Claude_API_키_입력
```

### 5. 테스트 실행
```
node index.js --test
```

### 6. 정식 자동화 실행
```
node index.js
```

## 노트북 2대 설정
- 노트북 A: POST_HOUR_1=8, POST_HOUR_2=14
- 노트북 B: POST_HOUR_1=11, POST_HOUR_2=20

## 주의사항
- .env 파일은 절대 공유하지 마세요
- Claude API 키는 console.anthropic.com 에서 발급
- 하루 2~3개 포스팅 유지 (스팸 방지)
