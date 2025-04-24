/**
 * 유틸리티 함수 모음
 */

/**
 * 민감한 정보를 코드에서 제거
 * @param {string} code - 원본 코드
 * @returns {string} - 민감 정보가 제거된 코드
 */
export function sanitizeCode(code) {
  if (!code) return '';

  // API 키, 시크릿, 암호 등 마스킹
  let sanitizedCode = code.replace(/(['"`])(?:api|key|token|secret|password|pwd)(?:[_-]?\w+)?(['"`])\s*[=:]\s*(['"`])[\w\-+.]+(['"`])/gi,
    '$1$2$3[REDACTED]$4');

  // 내부 URL, IP 마스킹
  sanitizedCode = sanitizedCode.replace(/(https?:\/\/|(?:\d{1,3}\.){3}\d{1,3})[\w\-.:]*/gi,
    '[REDACTED_URL]');

  return sanitizedCode;
}

/**
 * 파일 확장자에 따라 언어 이름 반환
 * @param {string} filename - 파일명
 * @returns {string} - 언어 이름
 */
export function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();

  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'php': 'php',
    'go': 'go',
    'c': 'c',
    'cpp': 'c++',
    'cs': 'csharp',
    'swift': 'swift',
    'kt': 'kotlin',
    'rs': 'rust',
    'sh': 'bash',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'md': 'markdown',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sql': 'sql'
  };

  return languageMap[ext] || 'plaintext';
}

/**
 * 리뷰할 파일 필터링
 * @param {Array} files - 파일 목록
 * @param {Object} options - 필터링 옵션
 * @returns {Array} - 필터링된 파일 목록
 */
export function filterFilesToReview(files, options = {}) {
  const defaultOptions = {
    maxFilesToReview: 10,
    excludePatterns: [/node_modules/, /\.env/, /\.lock$/, /\.git/],
    includedExtensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'rb', 'go', 'php', 'c', 'cpp', 'cs', 'swift']
  };

  const opts = { ...defaultOptions, ...options };

  return files
    .filter(file => {
      // 제외 패턴에 해당하는 파일 필터링
      for (const pattern of opts.excludePatterns) {
        if (pattern.test(file.filename)) {
          return false;
        }
      }

      // 포함된 확장자만 처리
      const ext = file.filename.split('.').pop().toLowerCase();
      return opts.includedExtensions.includes(ext);
    })
    .sort((a, b) => b.changes - a.changes) // 변경이 많은 파일 우선
    .slice(0, opts.maxFilesToReview); // 최대 파일 수 제한
}