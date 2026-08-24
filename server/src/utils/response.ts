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
  details: any = null
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
  return res.status(cleanStatus).json({
    success: false,
    error: {
      code: cleanCode,
      message: cleanMessage,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
