import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Express Global Error Handler:', err);
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  if (
    message.includes("Can't reach database server") ||
    message.includes('localhost:5432') ||
    message.includes('127.0.0.1:5432') ||
    code === 'P1001' ||
    err.name === 'PrismaClientInitializationError'
  ) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database connection unavailable. Please verify production configuration.';
  }

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
