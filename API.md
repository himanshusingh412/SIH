# API Reference — ContentSpine AI

Base URL (production): `https://sih-2026-ai-engine.vercel.app`  
Base URL (development): `http://localhost:5001`

All endpoints are prefixed with `/api` in production Vercel routing. The server also accepts requests without the `/api` prefix directly.

---

## Health Endpoints

### `GET /api/health`

System health check including database connectivity.

**Response 200:**
```json
{
  "success": true,
  "database": "connected",
  "service": "ContentSpine AI",
  "status": "healthy",
  "environment": "production",
  "providers": {
    "aiProvider": "gemini",
    "demoMode": false
  },
  "timestamp": "2026-08-24T19:56:51.955Z"
}
```

**Response 503 (database unavailable):**
```json
{
  "success": false,
  "database": "unavailable",
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "The database is temporarily unavailable."
  },
  "timestamp": "..."
}
```

---

### `GET /api/health/db-diagnostics`

Safe diagnostics — returns boolean flags only. Never exposes credentials.

**Response 200:**
```json
{
  "databaseConfigured": true,
  "productionDatabase": true,
  "provider": "postgresql",
  "connection": "healthy",
  "schema": "healthy"
}
```

---

### `GET /api/health/ai`

AI provider status.

**Response 200:**
```json
{
  "success": true,
  "provider": "gemini",
  "model": "gemini-3.1-flash-lite",
  "demoMode": false
}
```

---

## Project Endpoints

### `GET /api/projects`

List all projects.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "title": "My Project",
        "description": "...",
        "status": "DRAFT",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  },
  "timestamp": "..."
}
```

---

### `GET /api/projects/dashboard-stats`

Real aggregated metrics from Neon database.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeProjectsCount": 3,
      "factLocksCount": 42,
      "deliverablesCount": 17,
      "consistencyRate": 97.8,
      "recentProjects": [
        {
          "id": "uuid",
          "title": "...",
          "status": "ACTIVE",
          "updatedAt": "...",
          "sourceDocuments": [],
          "outputs": [],
          "validationResults": []
        }
      ]
    }
  },
  "timestamp": "..."
}
```

---

### `POST /api/projects`

Create a new project.

**Request:**
```json
{
  "title": "My New Project",
  "description": "Optional description",
  "type": "BLOG_POST"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "title": "My New Project",
      "status": "DRAFT",
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "timestamp": "..."
}
```

---

### `GET /api/projects/:id`

Get a single project by ID.

---

### `POST /api/projects/seed-demo`

Seed a demo project with sample content spine.

---

### `POST /api/projects/:id/source`

Upload a source document. `multipart/form-data`, field `file`.

**Accepted MIME types:** `application/pdf`, `text/plain`, `text/markdown`, `application/json`, `image/jpeg`, `image/png`, `image/webp`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**File size limit:** 50 MB

**Response 200:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "rawText": "...",
    "pageCount": 5,
    "chunks": [...]
  }
}
```

---

### `POST /api/projects/:id/process`

Trigger Content Spine extraction (Gemini) for an ingested document.

---

### `GET /api/projects/:id/content-spine`

Get the extracted Content Spine for a project.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "spine": {
      "summary": "...",
      "facts": [
        { "id": "uuid", "key": "Revenue", "value": "$2.4M", "isLocked": true, "confidence": 0.97 }
      ],
      "entities": [...],
      "sourceReferences": [...]
    }
  }
}
```

---

### `PATCH /api/fact-locks/:factId`

Toggle a fact lock on or off.

**Request:**
```json
{ "isLocked": true }
```

---

### `POST /api/projects/:id/generate`

Generate all selected output deliverables using locked facts.

**Request:**
```json
{
  "outputTypes": ["EXECUTIVE_SUMMARY", "LINKEDIN_POST", "X_THREAD"],
  "audience": { "role": "Executive", "sector": "Finance" }
}
```

---

### `GET /api/projects/:id/outputs`

List all generated outputs for a project.

---

### `GET /api/outputs/:id`

Get a single output by ID.

---

### `POST /api/outputs/:id/validate`

Validate a single output against the locked facts.

---

### `POST /api/outputs/:id/regenerate`

Regenerate a single output.

---

### `POST /api/projects/:id/validate`

Run full project validation across all outputs.

---

### `GET /api/projects/:id/validation`

Get the latest validation result.

---

### `POST /api/projects/:id/auto-correct`

Attempt AI-powered auto-correction of validation errors.

---

### `GET /api/projects/:id/export`

Export full project package (ZIP or combined format).

---

### `GET /api/projects/:id/export/docx`

Export primary output as DOCX.

---

### `GET /api/projects/:id/export/pdf`

Export primary output as PDF.

---

### `GET /api/projects/:id/export/pptx`

Export primary output as PPTX presentation.

---

### `GET /api/projects/:id/export/data`

Export project data (JSON / CSV).

---

### `POST /api/projects/:id/convert`

Convert between output formats.

---

## Resume Endpoints

### `POST /api/resume/create`

Create or parse a resume. Accepts `multipart/form-data` (field `file`) or JSON body.

**File size limit:** 20 MB  
**Accepted types:** PDF, DOCX, TXT

---

### `POST /api/resume/save`

Save resume data to Neon.

---

### `GET /api/resume/:id`

Get a resume by ID.

---

### `POST /api/resume/ats-scan`

Run an ATS compatibility scan.

**Request:**
```json
{
  "resumeId": "uuid",
  "jobDescriptionText": "Senior Software Engineer at Acme Corp..."
}
```

**Response 200 (partial):**
```json
{
  "success": true,
  "data": {
    "scan": {
      "overallScore": 84.2,
      "keywordMatchScore": 78.0,
      "skillsMatchScore": 90.0,
      "missingKeywords": ["Kubernetes", "gRPC"],
      "findings": [...],
      "keywordTable": [...]
    }
  }
}
```

---

### `POST /api/resume/optimize`

Optimize resume for a specific job description using Gemini.

---

### `GET /api/resume/:id/versions`

List all versions of a resume.

---

### `POST /api/resume/:id/versions`

Create a new version.

---

### `POST /api/resume/:id/versions/restore`

Restore a previous version.

---

### `DELETE /api/resume/:id/versions/:vId`

Delete a specific version.

---

### `POST /api/resume/cover-letter`

Generate a tailored cover letter using Gemini.

**Request:**
```json
{
  "resumeId": "uuid",
  "targetJobTitle": "Software Engineer",
  "targetCompany": "Google"
}
```

---

### `POST /api/resume/linkedin`

Generate LinkedIn profile sections using Gemini.

---

### `GET /api/resume/:id/analytics`

Get ATS scan history, keyword coverage trends, and optimization history.

---

### `GET /api/resume/:id/export/docx`

Export resume as DOCX binary.

---

### `GET /api/resume/:id/export/pdf`

Export resume as PDF binary.

---

### `POST /api/job/parse`

Parse a job description and extract job content spine.

---

## Agent Endpoints

### `POST /api/agents/knowledge`

Send a message to the Knowledge Agent.

**Request:**
```json
{
  "message": "What are the key facts from the source?",
  "projectId": "uuid",
  "conversationId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the verified facts...",
    "grounded": true,
    "sources": [...],
    "conversationId": "uuid"
  }
}
```

**Response 429 (Gemini rate limit):**
```json
{
  "success": false,
  "error": {
    "code": "GEMINI_RATE_LIMITED",
    "message": "Gemini rate limit reached. Retry after 45 seconds.",
    "retryAfterSeconds": 45
  }
}
```

---

### `POST /api/agents/test`

Run hallucination test against the agent.

---

### `GET /api/agents/analytics`

Get agent session statistics.

---

## AI Provider Endpoints

### `GET /api/ai/providers`

List all configured AI providers and their status.

**Response 200:**
```json
{
  "success": true,
  "providers": [
    { "type": "GEMINI", "name": "Google Gemini", "model": "gemini-3.1-flash-lite", "configured": true },
    { "type": "OPENAI", "name": "OpenAI GPT-4o", "model": "gpt-4o", "configured": false },
    { "type": "MOCK", "name": "Mock AI", "model": "mock", "configured": true }
  ]
}
```

---

### `POST /api/ai/providers/test`

Test connectivity to a specific provider.

---

### `POST /api/ai/generate`

Direct AI generation endpoint.

---

## History Endpoints

### `GET /api/conversations`

List all conversations.

---

### `GET /api/conversations/:id`

Get a single conversation with all messages.

---

### `POST /api/conversations`

Create a new conversation.

**Request:**
```json
{
  "projectId": "uuid",
  "title": "My Conversation"
}
```

---

### `PATCH /api/conversations/:id`

Rename a conversation.

---

### `DELETE /api/conversations/:id`

Delete a conversation and all its messages.

---

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `DATABASE_UNAVAILABLE` | 503 | Neon DB is unreachable |
| `GEMINI_RATE_LIMITED` | 429 | Gemini free-tier quota exceeded |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `NOT_FOUND` | 404 | Resource does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `INVALID_PROVIDER` | 400 | Unknown AI provider requested |
| `UNSUPPORTED_FILE_TYPE` | 400 | Upload MIME type not allowed |

All errors follow this envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": null
  },
  "timestamp": "..."
}
```
