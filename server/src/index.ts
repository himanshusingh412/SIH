import cors from 'cors';
import express from 'express';
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

// Health Endpoint (Section 4 & 5 Requirement)
app.get('/api/health', async (_req, res) => {
  try {
    await ensureDbSchema();
    res.json({
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
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable.',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Gemini/AI Provider Health Endpoint (Section 10 Requirement)
app.get('/api/health/ai', (_req, res) => {
  res.json({
    success: true,
    provider: config.aiProvider || 'gemini',
    model: config.aiModel || 'gemini-3.1-flash-lite',
    demoMode: config.demoMode,
  });
});

// Mount Routes
app.use('/api', projectRoutes);
app.use('/api', resumeRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/media', mediaRoutes);

// Global Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 ContentSpine AI Multimodal Engine running on http://localhost:${config.port}`);
  });
}

export default app;
