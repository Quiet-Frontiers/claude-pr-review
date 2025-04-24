/**
 * Claude API 통합 모듈
 */

import Anthropic from '@anthropic-ai/sdk';
import { sanitizeCode, getLanguageFromFilename } from './utils.js';
import dotenv from "dotenv";

dotenv.config();

// Anthropic Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Claude를 사용하여 코드 분석
 * @param {string} code - 분석할 코드
 * @param {string} filename - 파일명
 * @param {Object} options - 추가 옵션
 * @returns {Promise<string>} - 분석 결과
 */
export async function analyzeCodeWithClaude(code, filename, options = {}) {
  try {
    // 파일 확장자에서 언어 추출
    const language = getLanguageFromFilename(filename);

    // 민감한 정보 제거
    const sanitizedContent = sanitizeCode(code);

    // 프롬프트 구성
    const prompt = generateReviewPrompt(sanitizedContent, language, filename, options);

    console.log(`Claude에 ${filename} 코드 분석 요청 중...`);

    // Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // 최신 모델 사용
      max_tokens: 4000,
      system: "당신은 경험 많은 소프트웨어 개발자이며 코드 리뷰 전문가입니다. 코드를 깊이 분석하고 구체적이고 실용적인 피드백을 제공합니다.",
      messages: [
        { role: 'user', content: prompt }
      ],
      // 비저장 옵션 활성화 (API 버전에 따라 파라미터명 확인 필요)
      data_retention_policy: "discard"
    });

    console.log(`${filename} 코드 분석 완료`);
    return message.content[0].text;
  } catch (error) {
    console.error('Claude API 호출 중 오류:', error);
    return `코드 분석 중 오류가 발생했습니다: ${error.message}`;
  }
}

/**
 * 코드 리뷰를 위한 프롬프트 생성
 * @param {string} code - 분석할 코드
 * @param {string} language - 프로그래밍 언어
 * @param {string} filename - 파일명
 * @param {Object} options - 추가 옵션
 * @returns {string} - 프롬프트
 */
function generateReviewPrompt(code, language, filename, options = {}) {
  return `
다음은 GitHub Pull Request에 포함된 "${filename}" 파일의 코드입니다. 
이 코드를 분석하고 다음 측면에서 리뷰해주세요:

1. 코드 품질 및 가독성
   - 명확성, 일관성, 간결성
   - 네이밍 규칙 및 포맷팅
   - 코드 구조 및 모듈화

2. 잠재적인 버그나 문제점
   - 논리적 오류
   - 경계 조건 및 예외 처리
   - 타입 관련 이슈

3. 성능 최적화 제안
   - 비효율적인 알고리즘이나 데이터 구조
   - 불필요한 연산이나 메모리 사용
   - 최적화 가능한 부분

4. 보안 문제
   - 입력 검증 부족
   - 인증/권한 문제
   - 일반적인 보안 취약점

5. 개선할 수 있는 부분
   - 디자인 패턴 적용
   - 테스트 가능성
   - 코드 재사용성

코드:
\`\`\`${language}
${code}
\`\`\`

리뷰는 명확하고 건설적인 피드백을 제공하며, 코드의 강점도 언급해주세요.
각 섹션별로 중요한 부분을 먼저 언급하고, 개선 제안이 있다면 구체적인 코드 예시를 들어주세요.
`;
}