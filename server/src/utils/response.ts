import { Response } from 'express';

export function sendSuccess(res: Response, data: any, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details: any = null,
  retryAfterSeconds?: number
) {
  let cleanMessage = message;
  let cleanCode = code;
  let cleanStatus = statusCode;

  if (
    message.includes("Can't reach database server") ||
    message.includes('localhost:5432') ||
    message.includes('127.0.0.1:5432') ||
    code === 'P1001'
  ) {
    cleanMessage = 'Database connection unavailable. Please verify production configuration.';
    cleanCode = 'DATABASE_UNAVAILABLE';
    cleanStatus = 503;
  }

  res.setHeader('Content-Type', 'application/json');
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    res.setHeader('Retry-After', String(Math.ceil(retryAfterSeconds)));
  }
  return res.status(cleanStatus).json({
    success: false,
    error: {
      code: cleanCode,
      message: cleanMessage,
      details,
      ...(retryAfterSeconds ? { retryAfterSeconds: Math.ceil(retryAfterSeconds) } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Maps a thrown AI/provider error onto an HTTP response, preserving 429
 * semantics and the retry hint the client UI counts down from.
 */
export function sendAIError(res: Response, err: any, fallbackMessage: string) {
  const status = err?.status || err?.statusCode || (err?.code === 'GEMINI_RATE_LIMITED' ? 429 : 500);
  const code = err?.code || (status === 429 ? 'GEMINI_RATE_LIMITED' : 'AI_UNAVAILABLE');
  const retryAfterSeconds = err?.retryAfterSeconds;
  const message = err?.message || fallbackMessage;
  const normalizedStatus = status === 429 ? 429 : status >= 400 && status < 600 ? status : 500;
  return sendError(res, message, normalizedStatus, code, null, retryAfterSeconds);
}
