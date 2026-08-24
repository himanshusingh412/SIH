import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// In-memory rate limiting store (rate-limit-ready for production redis swap)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute per IP

/**
 * Rate Limiter Middleware
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
    return sendError(res, 'Rate limit exceeded. Too many requests, please try again shortly.', 429);
  }

  next();
}

/**
 * Security Headers Middleware
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/**
 * Upload Security Filter Middleware
 */
export function validateUploadFile(req: Request, res: Response, next: NextFunction) {
  if (!req.file) return next();

  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(pdf|txt|md|json|png|jpe?g|webp|docx)$/i)) {
    return sendError(
      res,
      `Unsupported file type '${req.file.mimetype}'. Allowed formats: PDF, TXT, MD, JSON, PNG, JPG, WEBP, DOCX`,
      400
    );
  }

  // Sanitize filename to prevent directory traversal
  req.file.originalname = req.file.originalname.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  next();
}

/**
 * Sanitizes input strings by stripping suspicious script tags
 */
export function sanitizeInputText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
