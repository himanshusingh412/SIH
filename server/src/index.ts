import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler, requestLogger } from './middleware/errorHandler';
import { rateLimiter, securityHeaders } from './middleware/security';
import projectRoutes from './routes/projectRoutes';

const app = express();

app.use(cors());
app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'AI Content Transformation Engine (SIH 2026)',
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api', projectRoutes);

// Global Error Handler
app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`🚀 SIH 2026 AI Content Transformation Server running on http://localhost:${config.port}`);
  });
}

export default app;
