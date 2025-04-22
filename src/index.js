/**
 * GitHub PR 자동 리뷰 시스템 - 메인 서버 파일
 */

const express = require('express');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

// 핸들러 모듈 임포트
const { handleGitHubWebhook, handleManualReviewRequest } = require('./github-handler');

// 환경 변수 확인
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'GITHUB_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`오류: 다음 환경 변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}`);
  console.error('실행을 중단합니다. .env 파일을 확인하세요.');
  process.exit(1);
}

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 파싱
app.use(express.json({ limit: '10mb' }));

// 기본 라우트
app.get('/', (req, res) => {
  res.send(`
    <h1>GitHub PR 자동 리뷰 서버</h1>
    <p>이 서버는 GitHub Pull Request를 Claude AI를 사용하여 자동으로 리뷰합니다.</p>
    <p>서버가 정상적으로 실행 중입니다.</p>
  `);
});

// 상태 확인 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GitHub 웹훅 엔드포인트
app.post('/webhook', handleGitHubWebhook);

// 수동 리뷰 요청 엔드포인트
app.post('/review', handleManualReviewRequest);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`GitHub 웹훅 URL: http://localhost:${PORT}/webhook`);
  console.log(`수동 리뷰 요청 URL: http://localhost:${PORT}/review`);
  console.log('Claude API와 GitHub API를 사용하여 PR 자동 리뷰를 시작합니다.');
});

// 예상치 못한 오류 처리
process.on('uncaughtException', (error) => {
  console.error('예상치 못한 오류 발생:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason);
});