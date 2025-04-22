# GitHub PR 자동 리뷰 시스템 (Claude AI 기반)

이 프로젝트는 GitHub Pull Request를 자동으로 리뷰하는 시스템입니다. Claude AI를 활용하여 코드 변경사항을 분석하고 유용한 피드백을 제공합니다.

## 주요 기능

- GitHub Pull Request가 생성되거나 업데이트될 때 자동으로 코드 리뷰 수행
- 변경된 파일의 코드 품질, 버그, 성능, 보안 문제 등을 분석
- 각 파일에 대한 상세한 리뷰 코멘트 자동 생성
- 민감한 정보 필터링을 통한 보안 강화

## 설치 방법

### 사전 요구사항

- Node.js 16 이상
- GitHub 계정 및 Personal Access Token
- Anthropic API 키 (Claude AI 사용)

### 설치 단계

1. 이 레포지토리를 클론합니다:
   ```bash
   git clone https://github.com/yourusername/github-claude-pr-review.git
   cd github-claude-pr-review
   ```

2. 필요한 패키지를 설치합니다:
   ```bash
   npm install
   ```

3. 환경 변수 설정을 위해 `.env` 파일을 생성합니다:
   ```
   ANTHROPIC_API_KEY=your_claude_api_key
   GITHUB_TOKEN=your_github_personal_access_token
   PORT=3000
   ```

## 사용 방법

### 로컬에서 실행하기

1. 개발 모드로 서버 실행:
   ```bash
   npm run dev
   ```

2. 프로덕션 모드로 서버 실행:
   ```bash
   npm start
   ```

### 웹훅 설정

1. 로컬 서버를 외부에 노출하기 위해 ngrok 등을 사용할 수 있습니다:
   ```bash
   npx ngrok http 3000
   ```

2. GitHub 리포지토리 설정에서 웹훅을 구성합니다:
    - 웹훅 URL: `https://your-ngrok-url/webhook`
    - 콘텐츠 유형: `application/json`
    - 이벤트: `Pull requests` 선택

### 서버 배포하기

Vercel이나 다른 서비스에 배포하여 상시 운영할 수 있습니다:

1. Vercel CLI 설치 및 로그인:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. 배포하기:
   ```bash
   vercel
   ```

3. 환경 변수 설정:
    - Vercel 대시보드에서 프로젝트 설정으로 이동
    - `ANTHROPIC_API_KEY`와 `GITHUB_TOKEN` 환경 변수 추가

## 사용자 정의

### 리뷰 프롬프트 수정

`src/claude-api.js` 파일에서 프롬프트를 수정하여 리뷰 방식을 사용자 정의할 수 있습니다.

### 지원하는 파일 형식 확장

`src/github-handler.js` 파일에서 `codeFileExtensions` 배열을 수정하여 추가 파일 형식을 지원할 수 있습니다.

## 향후 계획

- GitLab 지원 추가
- 웹 인터페이스 개발
- 리뷰 품질 개선
- 사용자 관리 기능

## 기여하기

Pull Request와 이슈는 언제나 환영합니다. 큰 변경사항은 먼저 이슈를 통해 논의해주세요.

## 라이선스

MIT

## 보안 고려사항

이 도구는 코드를 Claude AI에 전송합니다. 민감한 정보를 필터링하는 기능이 포함되어 있지만, 매우 중요한 프로젝트나 비밀 코드에는 주의해서 사용하세요.