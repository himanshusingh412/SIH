import { prisma } from './index';

let dbInitialized = false;

export async function ensureDbSchema() {
  if (dbInitialized) return;
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM Project LIMIT 1');
    dbInitialized = true;
  } catch {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS User (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'OPERATOR',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Project (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'DRAFT',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS SourceDocument (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          filename TEXT NOT NULL,
          fileType TEXT NOT NULL,
          inputCategory TEXT NOT NULL,
          rawText TEXT NOT NULL,
          fileSize INTEGER DEFAULT 0,
          pageCount INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ContentSpine (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          summary TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Fact (
          id TEXT PRIMARY KEY,
          contentSpineId TEXT NOT NULL,
          factKey TEXT NOT NULL,
          factValue TEXT NOT NULL,
          category TEXT NOT NULL,
          isLocked BOOLEAN DEFAULT 1,
          confidence REAL DEFAULT 1.0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Output (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          outputType TEXT NOT NULL,
          audienceProfileId TEXT,
          currentVersionId TEXT,
          isConsistent BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS OutputVersion (
          id TEXT PRIMARY KEY,
          outputId TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          createdReason TEXT DEFAULT 'INITIAL_GENERATION',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ValidationResult (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          consistencyScore REAL DEFAULT 100.0,
          passed BOOLEAN DEFAULT 1,
          issuesFound TEXT NOT NULL,
          autoCorrected BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      dbInitialized = true;
    } catch (e: any) {
      console.warn('DB DDL auto-init warning:', e.message);
    }
  }
}
