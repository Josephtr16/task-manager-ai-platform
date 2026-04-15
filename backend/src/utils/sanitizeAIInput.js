const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /you\s+are\s+now/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
];

const sanitizeForAI = (text, maxLength = 500) => {
  if (typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.slice(0, maxLength).trim();
};

module.exports = {
  sanitizeForAI,
};
