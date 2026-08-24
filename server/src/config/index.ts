import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || (process.env.VERCEL ? 'file:/tmp/dev.db' : 'file:./dev.db');

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: dbUrl,
  aiProvider: process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
  demoMode: process.env.DEMO_MODE === 'true',
  geminiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  // Audio & ElevenLabs Configuration
  aiAudioProvider: process.env.AI_AUDIO_PROVIDER || 'elevenlabs',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Rachel
  elevenlabsModel: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
};

// Ensure SQLite DB schema exists on startup
if (dbUrl.startsWith('file:')) {
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'ignore',
    });
  } catch (e) {
    // Ignore schema sync warnings
  }
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});
