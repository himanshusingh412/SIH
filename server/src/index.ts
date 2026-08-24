import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';
import { config } from './config';
import { ensureDbSchema } from './config/dbInit';
import { errorHandler, requestLogger } from './middleware/errorHandler';
import { rateLimiter, securityHeaders } from './middleware/security';
import agentRoutes from './routes/agentRoutes';
import audioRoutes from './routes/audioRoutes';
import mediaRoutes from './routes/mediaRoutes';
import projectRoutes from './routes/projectRoutes';
import resumeRoutes from './routes/resumeRoutes';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Database initialization middleware for serverless cold-starts
app.use(async (_req, _res, next) => {
  try {
    await ensureDbSchema();
  } catch (err) {
    console.warn('⚠️ DB schema initialization warning:', err);
  }
  next();
});

// Serve static media uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Endpoint Handler
const healthHandler = async (_req: Request, res: Response) => {
  try {
    await ensureDbSchema();
    return res.json({
      success: true,
      service: 'ContentSpine AI',
      status: 'healthy',
      environment: process.env.NODE_ENV || 'production',
      providers: {
        aiProvider: config.aiProvider,
        audioProvider: config.aiAudioProvider,
        demoMode: config.demoMode,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable.',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// AI Provider Health Endpoint Handler
const aiHealthHandler = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    provider: config.aiProvider || 'gemini',
    model: config.aiModel || 'gemini-3.1-flash-lite',
    demoMode: config.demoMode,
  });
};

// Support both /api/health and /health for Vercel routing compatibility
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/api/health/ai', aiHealthHandler);
app.get('/health/ai', aiHealthHandler);

// Mount Routes under both /api and root / for Vercel serverless rewrite compatibility
app.use('/api', projectRoutes);
app.use('/', projectRoutes);

app.use('/api', resumeRoutes);
app.use('/', resumeRoutes);

app.use('/api/audio', audioRoutes);
app.use('/audio', audioRoutes);

app.use('/api/agents', agentRoutes);
app.use('/agents', agentRoutes);

app.use('/api/media', mediaRoutes);
app.use('/media', mediaRoutes);

// Global Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 ContentSpine AI Multimodal Engine running on http://localhost:${config.port}`);
  });
}

export default app;
