import { prisma } from './index';

let dbInitialized = false;

export async function ensureDbSchema() {
  if (dbInitialized) return;
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM SourceReference LIMIT 1');
    dbInitialized = true;
  } catch {
    const statements = [
      `CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'OPERATOR',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Project (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'DRAFT',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS SourceDocument (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        filename TEXT NOT NULL,
        fileType TEXT NOT NULL,
        inputCategory TEXT NOT NULL,
        rawText TEXT NOT NULL,
        fileSize INTEGER DEFAULT 0,
        pageCount INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS ContentSpine (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        summary TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Fact (
        id TEXT PRIMARY KEY,
        contentSpineId TEXT NOT NULL,
        factKey TEXT NOT NULL,
        factValue TEXT NOT NULL,
        category TEXT NOT NULL,
        isLocked BOOLEAN DEFAULT 1,
        confidence REAL DEFAULT 1.0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Entity (
        id TEXT PRIMARY KEY,
        contentSpineId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS SourceReference (
        id TEXT PRIMARY KEY,
        sourceDocumentId TEXT NOT NULL,
        factId TEXT,
        entityId TEXT,
        snippetText TEXT NOT NULL,
        pageNumber INTEGER DEFAULT 1,
        startCharIndex INTEGER DEFAULT 0,
        endCharIndex INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS Output (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        outputType TEXT NOT NULL,
        audienceProfileId TEXT,
        currentVersionId TEXT,
        isConsistent BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS OutputVersion (
        id TEXT PRIMARY KEY,
        outputId TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdReason TEXT DEFAULT 'INITIAL_GENERATION',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS ValidationResult (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        consistencyScore REAL DEFAULT 100.0,
        passed BOOLEAN DEFAULT 1,
        issuesFound TEXT NOT NULL,
        autoCorrected BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS GenerationJob (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        outputTypes TEXT NOT NULL,
        errorMessage TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME
      );`,
      `CREATE TABLE IF NOT EXISTS AudienceProfile (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        name TEXT NOT NULL,
        tone TEXT DEFAULT 'FORMAL',
        detailLevel TEXT DEFAULT 'HIGH',
        targetGoal TEXT,
        isDefault BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Voice (
        id TEXT PRIMARY KEY,
        voiceId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        provider TEXT DEFAULT 'elevenlabs',
        category TEXT DEFAULT 'premade',
        language TEXT DEFAULT 'en-US',
        gender TEXT DEFAULT 'neutral',
        previewUrl TEXT,
        description TEXT,
        isCloned BOOLEAN DEFAULT 0,
        consentConfirmed BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS VoiceGeneration (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        outputId TEXT,
        voiceId TEXT NOT NULL,
        text TEXT NOT NULL,
        audioUrl TEXT NOT NULL,
        durationSeconds REAL DEFAULT 0.0,
        stability REAL DEFAULT 0.5,
        similarity REAL DEFAULT 0.75,
        style REAL DEFAULT 0.0,
        status TEXT DEFAULT 'COMPLETED',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Transcript (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        filename TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        fullText TEXT NOT NULL,
        duration REAL DEFAULT 0.0,
        status TEXT DEFAULT 'COMPLETED',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS TranscriptSegment (
        id TEXT PRIMARY KEY,
        transcriptId TEXT NOT NULL,
        speaker TEXT DEFAULT 'Speaker 1',
        startTime REAL NOT NULL,
        endTime REAL NOT NULL,
        text TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS MusicGeneration (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        prompt TEXT NOT NULL,
        genre TEXT DEFAULT 'ambient',
        mood TEXT DEFAULT 'calm',
        durationSeconds INTEGER DEFAULT 30,
        audioUrl TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS SFXGeneration (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        prompt TEXT NOT NULL,
        category TEXT DEFAULT 'alert',
        audioUrl TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS DubbingProject (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        sourceLanguage TEXT DEFAULT 'en',
        targetLanguage TEXT NOT NULL,
        status TEXT DEFAULT 'COMPLETED',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS DubbingTrack (
        id TEXT PRIMARY KEY,
        dubbingProjectId TEXT NOT NULL,
        originalText TEXT NOT NULL,
        translatedText TEXT NOT NULL,
        audioUrl TEXT NOT NULL,
        factLocksPassed BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS MediaAsset (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        assetType TEXT NOT NULL,
        filename TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        storageLocation TEXT NOT NULL,
        sizeBytes INTEGER DEFAULT 0,
        provider TEXT DEFAULT 'local',
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Agent (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT DEFAULT 'ContentSpine Knowledge Agent',
        instructions TEXT NOT NULL,
        voiceId TEXT,
        language TEXT DEFAULT 'en-US',
        guardrails TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS AgentSession (
        id TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS AgentMessage (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        audioUrl TEXT,
        toolCalls TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS AgentTest (
        id TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        inputQuery TEXT NOT NULL,
        expectedAns TEXT NOT NULL,
        actualAns TEXT NOT NULL,
        passed BOOLEAN NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS Resume (
        id TEXT PRIMARY KEY,
        userId TEXT,
        projectId TEXT,
        title TEXT NOT NULL,
        targetRole TEXT,
        candidateContentSpine TEXT NOT NULL,
        contactInfo TEXT,
        template TEXT DEFAULT 'ATS_CLASSIC',
        atsSafe BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS ResumeVersion (
        id TEXT PRIMARY KEY,
        resumeId TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        versionName TEXT DEFAULT 'Version 1',
        targetJobTitle TEXT,
        targetCompany TEXT,
        jobDescriptionId TEXT,
        atsScore REAL DEFAULT 0.0,
        scoreBreakdown TEXT,
        optimizedContent TEXT NOT NULL,
        changesSummary TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS JobDescription (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        rawText TEXT NOT NULL,
        parsedJobSpine TEXT NOT NULL,
        requiredSkills TEXT,
        preferredSkills TEXT,
        keywords TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS ATSScan (
        id TEXT PRIMARY KEY,
        resumeId TEXT NOT NULL,
        resumeVersionId TEXT,
        jobDescriptionId TEXT,
        overallScore REAL DEFAULT 0.0,
        keywordMatchScore REAL DEFAULT 0.0,
        skillsMatchScore REAL DEFAULT 0.0,
        experienceMatchScore REAL DEFAULT 0.0,
        educationMatchScore REAL DEFAULT 0.0,
        structureScore REAL DEFAULT 0.0,
        formattingScore REAL DEFAULT 0.0,
        contactInfoScore REAL DEFAULT 0.0,
        contentQualityScore REAL DEFAULT 0.0,
        findings TEXT NOT NULL,
        missingKeywords TEXT NOT NULL,
        keywordTable TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS CoverLetter (
        id TEXT PRIMARY KEY,
        resumeId TEXT NOT NULL,
        targetJobTitle TEXT NOT NULL,
        targetCompany TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS LinkedInProfile (
        id TEXT PRIMARY KEY,
        resumeId TEXT NOT NULL,
        headline TEXT NOT NULL,
        aboutSummary TEXT NOT NULL,
        experienceHighlights TEXT NOT NULL,
        skills TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    ];

    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e: any) {
        console.warn('DB statement init warning:', e.message);
      }
    }
    dbInitialized = true;
  }
}
