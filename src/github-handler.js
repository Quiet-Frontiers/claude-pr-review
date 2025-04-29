/**
 * GitHub API 통합 모듈
 */

import { Octokit } from '@octokit/rest';
import { analyzeCodeWithClaude } from './claude-api.js';
import { filterFilesToReview } from './utils.js';

// GitHub API 클라이언트 초기화
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * GitHub 웹훅 핸들러
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
export async function handleGitHubWebhook(req, res) {
  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    // Pull Request 이벤트만 처리
    if (event === 'pull_request' &&
      (payload.action === 'opened' || payload.action === 'synchronize')) {

      // 비동기로 PR 리뷰 처리 시작 (응답 대기 없이)
      reviewPullRequest({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        pullNumber: payload.pull_request.number,
        sha: payload.pull_request.head.sha
      }).catch(err => console.error('PR 리뷰 중 오류:', err));

      res.status(202).json({ message: 'PR 리뷰 요청이 접수되었습니다' });
    } else {
      res.status(200).json({ message: '처리가 필요 없는 이벤트입니다' });
    }
  } catch (error) {
    console.error('웹훅 처리 중 오류:', error);
    res.status(500).json({ error: '웹훅 처리 중 오류가 발생했습니다' });
  }
}

/**
 * Pull Request 리뷰 실행
 * @param {Object} options - PR 정보
 * @param {string} options.owner - 저장소 소유자
 * @param {string} options.repo - 저장소 이름
 * @param {number} options.pullNumber - PR 번호
 * @param {string} options.sha - 커밋 SHA
 */
export async function reviewPullRequest({ owner, repo, pullNumber, sha }) {
  try {
    console.log(`GitHub PR #${pullNumber} (${owner}/${repo}) 리뷰 시작`);

    // PR 변경 파일 가져오기
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    // 리뷰할 파일 필터링
    const filesToReview = filterFilesToReview(files);

    if (filesToReview.length === 0) {
      console.log('리뷰할 코드 파일이 없습니다.');
      await addPRComment({
        owner,
        repo,
        pullNumber,
        body: '## Claude 자동 코드 리뷰\n\n리뷰할 코드 파일이 발견되지 않았습니다.'
      });
      return;
    }

    console.log(`리뷰할 파일 ${filesToReview.length}개 선택됨:`, filesToReview.map(f => f.filename).join(', '));

    // 각 파일 리뷰
    const reviewComments = [];

    for (const file of filesToReview) {
      // 파일 내용 가져오기
      const { data: content } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: sha,
      });

      // Base64로 인코딩된 내용 디코딩
      const fileContent = Buffer.from(content.content, 'base64').toString();

      // Claude를 사용하여 코드 분석
      const review = await analyzeCodeWithClaude(fileContent, file.filename);

      // 리뷰 코멘트 저장
      reviewComments.push({
        path: file.filename,
        body: `## Claude 코드 리뷰: ${file.filename}\n\n${review}`,
        position: file.changes, // 파일 끝에 코멘트 추가
        commit_id: sha
      });
    }

    // PR에 리뷰 제출
    if (reviewComments.length > 0) {
      await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: sha,
        event: 'COMMENT',
        comments: reviewComments,
        body: `# Claude 자동 코드 리뷰\n\n${filesToReview.length}개 파일을 분석했습니다. 각 파일의 코멘트를 확인해주세요.`
      });

      console.log(`GitHub PR #${pullNumber} 리뷰 완료`);
    }
  } catch (error) {
    console.error('Pull Request 리뷰 중 오류:', error);

    // 오류 발생 시 PR에 코멘트 추가
    try {
      await addPRComment({
        owner,
        repo,
        pullNumber,
        body: '## Claude 자동 코드 리뷰 오류\n\n코드 리뷰 중 오류가 발생했습니다: ' + error.message
      });
    } catch (commentError) {
      console.error('오류 코멘트 추가 실패:', commentError);
    }
  }
}

/**
 * Pull Request에 일반 코멘트 추가
 */
async function addPRComment({ owner, repo, pullNumber, body }) {
  return octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body
  });
}

/**
 * Pull Request 수동 리뷰 요청 처리
 */
export async function handleManualReviewRequest(req, res) {
  try {
    const { owner, repo, pullNumber, sha } = req.body;

    if (!owner || !repo || !pullNumber || !sha) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다. owner, repo, pullNumber, sha가 필요합니다.' });
    }

    // 비동기로 PR 리뷰 처리 시작
    reviewPullRequest({ owner, repo, pullNumber, sha })
      .catch(err => console.error('수동 PR 리뷰 중 오류:', err));

    res.status(202).json({ message: 'PR 리뷰 요청이 접수되었습니다' });
  } catch (error) {
    console.error('수동 리뷰 요청 처리 중 오류:', error);
    res.status(500).json({ error: '리뷰 요청 처리 중 오류가 발생했습니다' });
  }
}