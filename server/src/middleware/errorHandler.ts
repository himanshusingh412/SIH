import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Express Global Error Handler:', err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  });
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}
