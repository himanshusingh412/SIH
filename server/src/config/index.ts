import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  aiProvider: process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
  demoMode: process.env.DEMO_MODE === 'true',
  geminiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};

export const prisma = new PrismaClient();
