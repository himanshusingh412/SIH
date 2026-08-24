import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Express Global Error Handler:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, status, err.stack);
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}
