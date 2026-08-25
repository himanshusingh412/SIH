import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const rawDbUrl = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim();
const isProdEnv = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

// If DATABASE_URL is not set in environment, use standard postgresql URL scheme string
const dbUrl = rawDbUrl || 'postgresql://postgres:postgres@localhost:5432/contentspine_db';

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: dbUrl,
  isDatabaseConfigured: Boolean(rawDbUrl && rawDbUrl !== ''),
  isNeonDatabase: Boolean(rawDbUrl && (rawDbUrl.includes('neon.tech') || rawDbUrl.includes('neon'))),
  isLocalhostDatabase: Boolean(!rawDbUrl || rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1')),
  aiProvider: process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  bedrockApiKey: process.env.BEDROCK_API_KEY || '',
  bedrockModel: process.env.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  demoMode: process.env.DEMO_MODE === 'true',
  geminiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
};

// Recursively sanitize all strings to strip PostgreSQL 0x00 / NUL bytes (Error 22021)
export function removeNullBytes<T>(obj: T): T {
  if (typeof obj === 'string') {
    return obj.replace(/[\0\u0000]/g, '') as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeNullBytes) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = removeNullBytes((obj as Record<string, any>)[key]);
    }
    return res as T;
  }
  return obj;
}

// Singleton PrismaClient reuse for serverless connection safety (Requirement 28)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : undefined
  );

prisma.$use(async (params, next) => {
  if (params.args) {
    if (params.args.data) {
      params.args.data = removeNullBytes(params.args.data);
    }
    if (params.args.where) {
      params.args.where = removeNullBytes(params.args.where);
    }
    if (params.args.create) {
      params.args.create = removeNullBytes(params.args.create);
    }
    if (params.args.update) {
      params.args.update = removeNullBytes(params.args.update);
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
