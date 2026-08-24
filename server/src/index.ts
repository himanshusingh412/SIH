import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';
import { config } from './config';
import { ensureDbSchema } from './config/dbInit';
import { errorHandler, requestLogger } from './middleware/errorHandler';
import { rateLimiter, securityHeaders } from './middleware/security';
import agentRoutes from './routes/agentRoutes';
import aiProviderRoutes from './routes/aiProviderRoutes';
import historyRoutes from './routes/historyRoutes';
import projectRoutes from './routes/projectRoutes';
import resumeRoutes from './routes/resumeRoutes';
import { prisma } from './config';

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

// Health Endpoint Handler (Requirement 40)
const healthHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return res.json({
      success: true,
      database: 'connected',
      service: 'ContentSpine AI',
      status: 'healthy',
      environment: process.env.NODE_ENV || 'production',
      providers: {
        aiProvider: config.aiProvider,
        demoMode: config.demoMode,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      database: 'unavailable',
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The database is temporarily unavailable.',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Database Diagnostics Handler (Requirement 12)
const dbDiagnosticsHandler = async (_req: Request, res: Response) => {
  const isConfigured = config.isDatabaseConfigured;
  const isNeon = config.isNeonDatabase;
  const isLocal = config.isLocalhostDatabase;

  let connectionStatus = 'disconnected';
  let schemaStatus = 'unknown';

  try {
    if (isConfigured || !isLocal) {
      await prisma.$queryRawUnsafe('SELECT 1');
      connectionStatus = 'healthy';
      schemaStatus = 'healthy';
    }
  } catch {
    connectionStatus = 'error';
    schemaStatus = 'unavailable';
  }

  return res.json({
    databaseConfigured: isConfigured,
    productionDatabase: isNeon || (!isLocal && (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL))),
    provider: 'postgresql',
    connection: connectionStatus,
    schema: schemaStatus,
  });
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
app.get('/api/health/db-diagnostics', dbDiagnosticsHandler);
app.get('/health/db-diagnostics', dbDiagnosticsHandler);
app.get('/api/health/ai', aiHealthHandler);
app.get('/health/ai', aiHealthHandler);

// Mount Specific Routes BEFORE Generic Catch-All Routes
app.use('/api/ai', aiProviderRoutes);
app.use('/ai', aiProviderRoutes);

app.use('/api/agents', agentRoutes);
app.use('/agents', agentRoutes);

app.use('/api', historyRoutes);
app.use('/', historyRoutes);

app.use('/api', resumeRoutes);
app.use('/', resumeRoutes);

app.use('/api', projectRoutes);
app.use('/', projectRoutes);

// Global Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 ContentSpine AI Engine running on http://localhost:${config.port}`);
  });
}

export default app;
