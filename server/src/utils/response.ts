import { Response } from 'express';

export function sendSuccess(res: Response, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function sendError(res: Response, message: string, statusCode = 500, details: any = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
