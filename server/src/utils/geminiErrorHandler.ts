export interface RateLimitInfo {
  /** True only for real 429 / quota exhaustion responses */
  isRateLimited: boolean;
  /** True when retrying the same request could plausibly succeed (429, 5xx, transient network) */
  isRetryable: boolean;
  /** True when the configured model id does not exist / is not enabled for this key */
  isModelNotFound: boolean;
  /** True for missing/invalid API key or permission errors — retrying never helps */
  isAuthError: boolean;
  /** Best-effort HTTP status */
  status: number;
  code: string;
  message: string;
  retryAfterSeconds: number;
}

const AUTH_PATTERNS = [
  /api[\s_-]?key not valid/i,
  /API_KEY_INVALID/i,
  /PERMISSION_DENIED/i,
  /UNAUTHENTICATED/i,
  /missing on server/i,
  /caller does not have permission/i,
];

const MODEL_NOT_FOUND_PATTERNS = [
  /is not found for API version/i,
  /not supported for generateContent/i,
  /models\/[\w.\-]+ is not found/i,
  /NOT_FOUND/i,
  /unknown name .*model/i,
];

const RATE_LIMIT_PATTERNS = [
  /Too Many Requests/i,
  /RESOURCE_EXHAUSTED/i,
  /QuotaExceeded/i,
  /GenerateRequestsPerMinutePerProjectPerModel/i,
  /exceeded your (current )?quota/i,
  /exceeded your rate limit/i,
  /rate\s*limit/i,
  /\bquota\b/i,
];

const TRANSIENT_PATTERNS = [
  /overloaded/i,
  /UNAVAILABLE/i,
  /Service Unavailable/i,
  /Internal (Server )?error/i,
  /deadline exceeded/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /socket hang up/i,
  /fetch failed/i,
  /network error/i,
];

function extractStatus(err: any, errStr: string): number {
  const direct = err?.status ?? err?.statusCode ?? err?.response?.status;
  if (typeof direct === 'number' && direct >= 100) return direct;
  const match = errStr.match(/\[(\d{3})\s/) || errStr.match(/\b(4\d{2}|5\d{2})\b/);
  if (match) return parseInt(match[1], 10);
  return 0;
}

function extractRetrySeconds(errStr: string): number {
  // Google returns either a prose hint ("Please retry in 43.123s.") or a
  // structured RetryInfo block ("retryDelay": "43s").
  const patterns = [
    /"?retryDelay"?\s*[:=]\s*"?([\d.]+)s/i,
    /retry[- ]after[:=]?\s*([\d.]+)/i,
    /(?:retry|try again)\s*(?:in|after)\s*([\d.]+)\s*s(?:econds)?/i,
    /([\d.]+)\s*seconds?/i,
  ];
  for (const re of patterns) {
    const m = errStr.match(re);
    if (m && m[1]) {
      const parsed = parseFloat(m[1]);
      if (!isNaN(parsed) && parsed > 0) return Math.ceil(parsed);
    }
  }
  return 0;
}

function sanitize(errStr: string): string {
  return errStr
    .replace(/https?:\/\/[^\s]+/g, '[API Endpoint]')
    .replace(/\[GoogleGenerativeAI Error\]:\s*/gi, '')
    .replace(/key=[\w-]+/gi, 'key=[redacted]')
    .trim();
}

/**
 * Classifies any Gemini / provider error into an actionable shape.
 * Never throws — always returns a usable RateLimitInfo.
 */
export function parseGeminiError(err: any): RateLimitInfo {
  const errStr = String(err?.message || err?.stack || err || '');
  const status = extractStatus(err, errStr);
  const explicitCode = String(err?.code || '');

  const base = {
    status: status || 500,
    retryAfterSeconds: 0,
    isRateLimited: false,
    isRetryable: false,
    isModelNotFound: false,
    isAuthError: false,
  };

  // 1. Auth / configuration problems — never retryable, never a rate limit.
  if (status === 401 || status === 403 || AUTH_PATTERNS.some((re) => re.test(errStr))) {
    return {
      ...base,
      status: status || 401,
      code: 'GEMINI_NOT_CONFIGURED',
      isAuthError: true,
      message: 'Gemini API key is missing or invalid on the server.',
    };
  }

  // 2. Model id problems — retrying the same model never helps, but another model can.
  if (status === 404 || MODEL_NOT_FOUND_PATTERNS.some((re) => re.test(errStr))) {
    return {
      ...base,
      status: 404,
      code: 'GEMINI_MODEL_NOT_FOUND',
      isModelNotFound: true,
      message: `Configured Gemini model is unavailable for this API key. (${sanitize(errStr).slice(0, 140)})`,
    };
  }

  // 3. Real rate limiting / quota exhaustion.
  const isRateLimited =
    status === 429 || explicitCode === 'GEMINI_RATE_LIMITED' || RATE_LIMIT_PATTERNS.some((re) => re.test(errStr));

  if (isRateLimited) {
    const parsed = extractRetrySeconds(errStr);
    return {
      ...base,
      status: 429,
      code: 'GEMINI_RATE_LIMITED',
      isRateLimited: true,
      isRetryable: true,
      retryAfterSeconds: parsed > 0 ? Math.min(parsed, 60) : 30,
      message: 'Gemini is temporarily rate-limited.',
    };
  }

  // 4. Transient server/network trouble — worth one more attempt.
  const isTransient = (status >= 500 && status <= 599) || TRANSIENT_PATTERNS.some((re) => re.test(errStr));
  if (isTransient) {
    return {
      ...base,
      status: status || 503,
      code: 'GEMINI_TRANSIENT_ERROR',
      isRetryable: true,
      retryAfterSeconds: 2,
      message: 'Gemini is temporarily unavailable. Retrying with the fallback chain.',
    };
  }

  // 5. Everything else (bad prompt, unparseable output, etc.)
  const sanitized = sanitize(errStr);
  return {
    ...base,
    code: 'GEMINI_ERROR',
    message: sanitized
      ? `Gemini request could not be completed. (${sanitized.slice(0, 150)})`
      : 'Gemini request could not be completed.',
  };
}
