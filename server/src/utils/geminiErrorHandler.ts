export interface RateLimitInfo {
  isRateLimited: boolean;
  code: string;
  message: string;
  retryAfterSeconds: number;
}

/**
 * Parses Gemini error object or string for 429 rate limit details
 */
export function parseGeminiError(err: any): RateLimitInfo {
  const errStr = String(err?.message || err?.stack || err || '');
  const status = err?.status || err?.statusCode || (errStr.includes('429') ? 429 : 500);

  const isRateLimited =
    status === 429 ||
    errStr.includes('429') ||
    errStr.includes('Too Many Requests') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('QuotaExceeded') ||
    errStr.includes('GenerateRequestsPerMinutePerProjectPerModel') ||
    /rate\s*limit/i.test(errStr) ||
    /exceeded your rate limit/i.test(errStr) ||
    /quota/i.test(errStr);

  if (!isRateLimited) {
    // Sanitize raw error string to hide Google internal URLs and stack traces
    const sanitizedMsg = errStr
      .replace(/https?:\/\/[^\s]+/g, '[API Endpoint]')
      .replace(/\[GoogleGenerativeAI Error\]:\s*/gi, '')
      .trim();

    return {
      isRateLimited: false,
      code: 'GEMINI_ERROR',
      message: sanitizedMsg ? `Gemini is currently unavailable. (${sanitizedMsg.slice(0, 150)})` : 'Gemini is currently unavailable.',
      retryAfterSeconds: 0,
    };
  }

  // Parse retry delay from Google error string (e.g., "Please retry in 43.123s." or "retry after 45s")
  let retryAfterSeconds = 45; // Standard default fallback
  const matchSeconds =
    errStr.match(/(?:retry\s*(?:in|after)|in|after)\s*([\d\.]+)\s*s/i) ||
    errStr.match(/(?:retry\s*(?:in|after)|in|after)\s*([\d\.]+)\s*seconds/i) ||
    errStr.match(/(\d+)\s*seconds/i);

  if (matchSeconds && matchSeconds[1]) {
    const parsed = parseFloat(matchSeconds[1]);
    if (!isNaN(parsed) && parsed > 0) {
      retryAfterSeconds = Math.ceil(parsed);
    }
  }

  return {
    isRateLimited: true,
    code: 'GEMINI_RATE_LIMITED',
    message: 'Gemini is temporarily rate-limited.',
    retryAfterSeconds,
  };
}
