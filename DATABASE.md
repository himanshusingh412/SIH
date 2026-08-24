# Database Reference — ContentSpine AI

## Production Database

| Property | Value |
|---|---|
| Provider | **Neon PostgreSQL** |
| ORM | **Prisma 5.22** |
| Schema file | `server/prisma/schema.prisma` |
| Environment variable | `DATABASE_URL` (server-side only) |
| Connection | Pooled via Neon connection pooler |
| SSL | Required (`sslmode=require`) |

> **Production must never use `localhost:5432`.**  
> `DATABASE_URL` must point to a Neon PostgreSQL connection string on Vercel.

---

## Connection Configuration

```env
# server/.env  (never commit this file)
DATABASE_URL=<your-neon-connection-string>
```

Example format (placeholder only — never use a real secret in docs):

```
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

The Prisma singleton in `server/src/config/index.ts` reads `DATABASE_URL` at startup and is reused across serverless cold-starts via `global.prisma`.

---

## Schema Overview

All models are defined in `server/prisma/schema.prisma`.

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Models

### User
Stores registered user accounts. Currently optional (many records have `userId: null`).

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| email | String | Unique |
| name | String? | Optional |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto-update |

**Relations:** Projects, Resumes, Agents

---

### Project
The root entity for a content transformation job.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| userId | String? | FK → User (nullable) |
| title | String | Required |
| description | String? | Optional |
| status | String | DRAFT / ACTIVE / COMPLETED / DELETED |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto-update |

**Relations:** SourceDocuments, ContentSpines, Facts, Entities, SourceReferences, Outputs, ValidationResults, GenerationJobs, AudienceProfiles, Agents, Resumes, Conversations, GenerationActivities, ExportHistories

---

### SourceDocument
A raw uploaded document attached to a project.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| filename | String | Sanitized original filename |
| mimeType | String | Detected MIME type |
| category | String | PDF / DOCX / TXT / IMAGE |
| rawText | String | Extracted plain text |
| pageCount | Int | Extracted page count |
| fileSize | Int | Bytes |
| metadata | String? | JSON |
| createdAt | DateTime | Auto |

---

### ContentSpine
Structured extraction result for a project.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project (unique) |
| summary | String | Extracted document summary |
| outputTypes | String | JSON array of selected output types |
| audience | String | Audience profile JSON |
| createdAt / updatedAt | DateTime | Auto |

---

### Fact
An individual extracted fact from the source.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| key | String | Fact label |
| value | String | Fact content |
| confidence | Float | 0.0–1.0 extraction confidence |
| isLocked | Boolean | Human-verified lock |
| category | String? | Grouping category |
| sourceRef | String? | JSON source reference |
| createdAt / updatedAt | DateTime | Auto |

---

### Entity
Named entities extracted from source (people, organizations, dates).

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| type | String | PERSON / ORG / DATE / LOCATION / etc. |
| value | String | Entity text |
| confidence | Float | Extraction confidence |
| createdAt | DateTime | Auto |

---

### Output
A generated deliverable for a project.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| type | String | EXECUTIVE_SUMMARY / LINKEDIN_POST / X_THREAD / ADVISORY / PRESENTATION / INFOGRAPHIC / VIDEO_PACKAGE |
| title | String | Generated title |
| content | String | Generated content |
| format | String | TEXT / MARKDOWN / HTML / JSON |
| validationScore | Float? | 0.0–1.0 |
| validationErrors | String? | JSON array of errors |
| status | String | PENDING / GENERATED / VALIDATED / ERROR |
| createdAt / updatedAt | DateTime | Auto |

---

### ValidationResult
Validation run result for a project's outputs.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| totalFacts | Int | Total facts checked |
| passedFacts | Int | Facts verified present |
| failedFacts | Int | Facts found missing/wrong |
| consistencyScore | Float | passedFacts / totalFacts |
| details | String | JSON detail array |
| createdAt | DateTime | Auto |

---

### Resume
The root entity for resume intelligence.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| userId | String? | FK → User (nullable) |
| projectId | String? | FK → Project (nullable) |
| title | String | Resume title |
| targetRole | String? | Target job role |
| candidateContentSpine | String | JSON Candidate Content Spine |
| contactInfo | String? | JSON contact information |
| template | String | ATS_CLASSIC (default) |
| atsSafe | Boolean | ATS safe flag |
| createdAt / updatedAt | DateTime | Auto |

**Relations:** ResumeVersions, ATSScans, CoverLetters, LinkedInProfiles

---

### ResumeVersion
A saved version of a resume targeting a specific job.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| resumeId | String | FK → Resume |
| version | Int | Sequential version number |
| versionName | String | Human label (e.g., "Version 2 — Google") |
| targetJobTitle | String? | Target job title |
| targetCompany | String? | Target company |
| jobDescriptionId | String? | FK → JobDescription |
| atsScore | Float | ATS compatibility score |
| scoreBreakdown | String? | JSON scoring breakdown |
| optimizedContent | String | JSON optimized resume structure |
| changesSummary | String? | JSON list of changes |
| createdAt | DateTime | Auto |

---

### JobDescription
A parsed job description for ATS matching.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| title | String | Job title |
| company | String? | Company name |
| rawText | String | Full raw JD text |
| parsedJobSpine | String | JSON Job Content Spine |
| requiredSkills | String? | JSON array |
| preferredSkills | String? | JSON array |
| keywords | String? | JSON array |
| createdAt | DateTime | Auto |

---

### ATSScan
ATS compatibility scan result with 9-dimension scoring.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| resumeId | String | FK → Resume |
| resumeVersionId | String? | FK → ResumeVersion |
| jobDescriptionId | String? | FK → JobDescription |
| overallScore | Float | Composite score 0–100 |
| keywordMatchScore | Float | Keyword overlap |
| skillsMatchScore | Float | Skills alignment |
| experienceMatchScore | Float | Experience alignment |
| educationMatchScore | Float | Education alignment |
| structureScore | Float | Section structure quality |
| formattingScore | Float | ATS-safe formatting |
| contactInfoScore | Float | Contact info completeness |
| contentQualityScore | Float | Content quality |
| findings | String | JSON findings + penalties |
| missingKeywords | String | JSON missing keywords |
| keywordTable | String | JSON keyword matrix |
| createdAt | DateTime | Auto |

---

### CoverLetter

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| resumeId | String | FK → Resume |
| targetJobTitle | String | |
| targetCompany | String | |
| content | String | Full cover letter text |
| createdAt | DateTime | Auto |

---

### LinkedInProfile

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| resumeId | String | FK → Resume |
| headline | String | LinkedIn headline |
| aboutSummary | String | About section |
| experienceHighlights | String | JSON array |
| skills | String | JSON array |
| createdAt | DateTime | Auto |

---

### Conversation
A persistent conversation thread linked to a project.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| title | String | Conversation title |
| provider | String? | `gemini` (default) |
| model | String? | `gemini-3.1-flash-lite` (default) |
| createdAt / updatedAt | DateTime | Auto |

**Relations:** Messages, GenerationActivities, ExportHistories

---

### Message
Individual message in a conversation.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| conversationId | String | FK → Conversation |
| role | String | `user` / `assistant` / `system` |
| content | String | Message body |
| provider | String? | AI provider used |
| model | String? | Model name |
| sources | String? | JSON source references |
| grounded | Boolean | Fact-grounded response flag |
| isError | Boolean | Error message flag |
| createdAt | DateTime | Auto |

---

### GenerationActivity
Audit log of every AI generation attempt.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| conversationId | String? | FK → Conversation |
| provider | String | Provider used |
| model | String? | Model name |
| status | String | SUCCESS / FAILED / RATE_LIMITED / VALIDATION_FAILED |
| latencyMs | Int? | Generation latency |
| inputTokens | Int? | Input token count |
| outputTokens | Int? | Output token count |
| errorCode | String? | Structured error code |
| retryAfterSeconds | Int? | Retry delay (for 429s) |
| createdAt | DateTime | Auto |

---

### ExportHistory
Record of every file export.

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| projectId | String | FK → Project |
| conversationId | String? | FK → Conversation |
| format | String | PDF / DOCX / PPTX / JSON / CSV / Markdown / HTML / XML / YAML |
| filename | String | Output filename |
| createdAt | DateTime | Auto |

---

## Development Workflow

```bash
# Push schema changes to Neon (development)
cd server
npx prisma db push --schema=prisma/schema.prisma

# Generate Prisma client after schema changes
npx prisma generate --schema=prisma/schema.prisma

# Inspect database
npx prisma studio
```

## Production Migration

The `vercel-build` script automatically runs `prisma db push` if `DATABASE_URL` is set:

```bash
if [ -n "$DATABASE_URL" ]; then
  npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss || true
fi
```

> **Note:** `prisma db push` is used (not `prisma migrate deploy`) because this project uses schema push rather than migration files. Consider migrating to `prisma migrate` for stricter production change management.

---

## Security

- `DATABASE_URL` is **server-side only**. It is never sent to the browser.
- Prisma errors are sanitized in `server/src/middleware/errorHandler.ts` — connection errors return `DATABASE_UNAVAILABLE` JSON without host/port details.
- The `.env` file is in `.gitignore` and must never be committed.
