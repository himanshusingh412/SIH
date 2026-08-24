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
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
