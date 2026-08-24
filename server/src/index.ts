import cors from 'cors';
import express from 'express';
import path from 'path';
import { config } from './config';
import { errorHandler, requestLogger } from './middleware/errorHandler';
import { rateLimiter, securityHeaders } from './middleware/security';
import projectRoutes from './routes/projectRoutes';
import audioRoutes from './routes/audioRoutes';
import agentRoutes from './routes/agentRoutes';
import resumeRoutes from './routes/resumeRoutes';
import mediaRoutes from './routes/mediaRoutes';

const app = express();

app.use(cors());
app.use(securityHeaders);
app.use(rateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Serve static media uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'ContentSpine AI — Multimodal Engine',
    providers: {
      aiProvider: config.aiProvider,
      audioProvider: config.aiAudioProvider,
      demoMode: config.demoMode,
    },
    timestamp: new Date().toISOString(),
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
