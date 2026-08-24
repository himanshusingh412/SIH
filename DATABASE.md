# Database Schema & Entity Relationships — ContentSpine AI

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ SOURCE_DOCUMENT : contains
    PROJECT ||--o{ CONTENT_SPINE : has
    PROJECT ||--o{ OUTPUT : generates
    PROJECT ||--o{ VALIDATION_RESULT : produces
    PROJECT ||--o{ GENERATION_JOB : tracks
    PROJECT ||--o{ AUDIENCE_PROFILE : uses

    CONTENT_SPINE ||--o{ FACT : locks
    CONTENT_SPINE ||--o{ ENTITY : extracts

    SOURCE_DOCUMENT ||--o{ SOURCE_REFERENCE : references
    FACT ||--o{ SOURCE_REFERENCE : cites
    ENTITY ||--o{ SOURCE_REFERENCE : cites

    OUTPUT ||--o{ OUTPUT_VERSION : versioned
    AUDIENCE_PROFILE ||--o{ OUTPUT : targets
```

---

## 2. Model Definitions (Prisma)

### 2.1 `User`
* `id` (String, UUID, PK)
* `email` (String, Unique)
* `name` (String, Optional)
* `role` (String, default "OPERATOR")
* `createdAt`, `updatedAt` (DateTime)

### 2.2 `Project`
* `id` (String, UUID, PK)
* `userId` (String, FK to User)
* `title` (String)
* `description` (String, Optional)
* `status` (String: DRAFT, INGESTED, GENERATED, VALIDATED)
* `createdAt`, `updatedAt` (DateTime)
* Indexes: `@@index([userId])`, `@@index([status])`

### 2.3 `SourceDocument`
* `id` (String, UUID, PK)
* `projectId` (String, FK to Project)
* `filename` (String)
* `fileType` (String)
* `inputCategory` (String: PDF, REPORT, ARTICLE, THREAT_INTEL, POLICY, IMAGE, VIDEO, PROMPT)
* `rawText` (String)
* `fileSize`, `pageCount` (Int)
* `createdAt` (DateTime)
* Indexes: `@@index([projectId])`

### 2.4 `ContentSpine`
* `id` (String, UUID, PK)
* `projectId` (String, FK to Project)
* `version` (Int, default 1)
* `summary` (String, Optional)
* `createdAt`, `updatedAt` (DateTime)
* Indexes: `@@index([projectId])`

### 2.5 `Fact`
* `id` (String, UUID, PK)
* `contentSpineId` (String, FK to ContentSpine)
* `factKey` (String)
* `factValue` (String)
* `category` (String: DATE, NUMBER, PERSON, ORGANIZATION, LOCATION, CLAIM, RISK, RECOMMENDATION)
* `isLocked` (Boolean, default true)
* `confidence` (Float, default 1.0)
* `createdAt` (DateTime)
* Indexes: `@@index([contentSpineId])`, `@@index([category])`

### 2.6 `Entity`
* `id` (String, UUID, PK)
* `contentSpineId` (String, FK to ContentSpine)
* `name` (String)
* `type` (String: PERSON, ORGANIZATION, LOCATION, TECHNOLOGY, EVENT)
* `confidence` (Float, default 1.0)
* Indexes: `@@index([contentSpineId])`, `@@index([type])`

### 2.7 `SourceReference`
* `id` (String, UUID, PK)
* `sourceDocumentId` (String, FK to SourceDocument)
* `factId` (String, FK to Fact, Optional)
* `entityId` (String, FK to Entity, Optional)
* `snippetText` (String)
* `pageNumber` (Int, default 1)
* `startCharIndex`, `endCharIndex` (Int)
* Indexes: `@@index([sourceDocumentId])`, `@@index([factId])`, `@@index([entityId])`

### 2.8 `Output`
* `id` (String, UUID, PK)
* `projectId` (String, FK to Project)
* `outputType` (String: EXECUTIVE_SUMMARY, LINKEDIN_POST, X_THREAD, ADVISORY, PRESENTATION, INFOGRAPHIC, VIDEO_PACKAGE)
* `audienceProfileId` (String, FK to AudienceProfile)
* `currentVersionId` (String, Optional)
* `isConsistent` (Boolean, default true)
* Indexes: `@@index([projectId])`, `@@index([outputType])`

### 2.9 `OutputVersion`
* `id` (String, UUID, PK)
* `outputId` (String, FK to Output)
* `version` (Int, default 1)
* `title` (String)
* `content` (String)
* `createdReason` (String: INITIAL_GENERATION, MANUAL_EDIT, AUTO_CORRECTION, RE_GENERATION)
* Indexes: `@@index([outputId])`

### 2.10 `ValidationResult`
* `id` (String, UUID, PK)
* `projectId` (String, FK to Project)
* `consistencyScore` (Float, default 100.0)
* `passed` (Boolean, default true)
* `issuesFound` (String, JSON envelope containing `_summary` and `issues`)
* `autoCorrected` (Boolean, default false)
* Indexes: `@@index([projectId])`

---

## 3. Migration Strategy
* **Local Development**: SQLite database (`server/prisma/dev.db`) initialized via `npx prisma db push`.
* **Production Deployment**: PostgreSQL database configured via `DATABASE_URL="postgresql://user:pass@host:5432/content_spine_db"` and `npx prisma migrate deploy`.
