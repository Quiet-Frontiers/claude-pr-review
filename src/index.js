/**
 * GitHub PR 자동 리뷰 시스템 - 메인 서버 파일
 */

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname 설정 (ESM에서는 기본 제공되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드
dotenv.config();

// 핸들러 모듈 임포트
import { handleGitHubWebhook, handleManualReviewRequest } from './github-handler.js';

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

// HTML 폼 파싱을 위한 미들웨어 추가
app.use(express.urlencoded({ extended: true }));

// Claude API 테스트 페이지 (폼)
app.get('/test-claude', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Claude API 테스트</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        .container {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }
        .input-section, .output-section {
          flex: 1;
          padding: 15px;
          border-radius: 5px;
        }
        .input-section {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
        }
        .output-section {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          min-height: 300px;
        }
        textarea, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: monospace;
          margin-bottom: 10px;
        }
        textarea {
          min-height: 300px;
          resize: vertical;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #45a049;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
        }
        .loading {
          display: none;
          text-align: center;
          margin: 20px 0;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #09f;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <h1>Claude API 테스트</h1>
      <p>아래 폼에 코드를 입력하고 분석을 요청하세요.</p>
      
      <div class="container">
        <div class="input-section">
          <form id="codeForm" action="/test-claude" method="post">
            <label for="language">프로그래밍 언어:</label>
            <select id="language" name="language">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="go">Go</option>
              <option value="swift">Swift</option>
              <option value="typescript">TypeScript</option>
            </select>
            
            <label for="code">코드:</label>
            <textarea id="code" name="code" required placeholder="여기에 분석할 코드를 입력하세요...">function add(a, b) {
  return a + b;
}

const result = add(5, "3");
console.log(result);
</textarea>
            
            <button type="submit">분석 요청</button>
          </form>
        </div>
        
        <div class="output-section">
          <h3>분석 결과</h3>
          <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>분석 중입니다. 잠시만 기다려주세요...</p>
          </div>
          <pre id="result">${req.query.result || '분석 결과가 여기에 표시됩니다.'}</pre>
        </div>
      </div>

      <script>
        document.getElementById('codeForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const loadingElement = document.getElementById('loading');
          const resultElement = document.getElementById('result');
          
          loadingElement.style.display = 'block';
          resultElement.textContent = '분석 중입니다...';
          
          const formData = new FormData(this);
          const code = formData.get('code');
          const language = formData.get('language');
          
          try {
            const response = await fetch('/api/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code, language }),
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultElement.textContent = data.review;
            } else {
              resultElement.textContent = '오류가 발생했습니다: ' + data.error;
            }
          } catch (error) {
            resultElement.textContent = '요청 처리 중 오류가 발생했습니다: ' + error.message;
          } finally {
            loadingElement.style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Claude API 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: '코드가 입력되지 않았습니다.' });
    }

    // 파일 확장자 결정
    const extensionMap = {
      'javascript': 'js',
      'python': 'py',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'cs',
      'php': 'php',
      'ruby': 'rb',
      'go': 'go',
      'swift': 'swift',
      'typescript': 'ts'
    };

    const extension = extensionMap[language] || 'txt';
    const filename = `test.${extension}`;

    // Claude API로 분석 요청
    const { analyzeCodeWithClaude } = await import('./claude-api.js');
    const review = await analyzeCodeWithClaude(code, filename);

    // 결과 반환
    res.json({ success: true, review });
  } catch (error) {
    console.error('Claude API 테스트 중 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});