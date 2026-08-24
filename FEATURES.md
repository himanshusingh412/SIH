# Features — ContentSpine AI

This document describes every feature in the current codebase. Features marked **✅ Implemented** exist in working code. Features marked **🔲 Planned** are documented goals not yet in the codebase.

---

## 1. Content Spine Workflow

### Source Document Ingestion ✅

Upload a source document and extract human-readable text.

**Supported input formats:**
| Format | MIME Type | Backend Adapter |
|---|---|---|
| PDF | `application/pdf` | `PdfAdapter` (pdf-parse) |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `DocxAdapter` |
| TXT / MD / JSON | `text/plain`, `text/markdown`, `application/json` | `TxtAdapter` |
| PNG / JPG / WEBP | `image/png`, `image/jpeg`, `image/webp` | `ImageAdapter` |

**File size limit:** 50 MB

**Not supported (backend):** MP4, MOV, audio files. These may appear in UI elements but are not processed by the backend.

---

### Content Spine Extraction ✅

After ingestion, the document text is sent to Gemini with a structured extraction prompt that produces:

- **Summary** — document-level abstract
- **Facts** — key-value factual claims with confidence scores
- **Entities** — named entities (people, organizations, dates, locations)
- **Source References** — paragraph-level citations with page numbers

---

### Fact Lock System ✅

Users manually review extracted facts and toggle locks:

- **Unlocked fact** — extracted, not verified
- **Locked fact** — human-verified, will be injected into all AI generation prompts
- **Lock invariant** — AI-generated content is never automatically promoted to a source fact

---

### Multi-Format Output Generation ✅

After fact locking, the system generates deliverables. Supported output types:

| Output Type | Description |
|---|---|
| `EXECUTIVE_SUMMARY` | Formal executive summary document |
| `LINKEDIN_POST` | Professional LinkedIn-format post |
| `X_THREAD` | Twitter/X thread format |
| `ADVISORY` | Advisory or recommendation document |
| `PRESENTATION` | Slide deck content |
| `INFOGRAPHIC` | Infographic data structure |
| `VIDEO_PACKAGE` | Video script + shot list |

---

### Validation ✅

After generation, the system verifies each output against locked facts:

- **Total facts checked**
- **Passed facts** (present in output)
- **Failed facts** (missing or contradicted)
- **Consistency score** (percentage)

---

### Auto-Correction ✅

The system can attempt AI-powered correction of validation errors by re-generating flagged outputs with stricter grounding prompts.

---

### 3-Pane Review Workspace ✅

- **Left pane** — source document text (sanitized, no PDF internals)
- **Center pane** — Content Spine with fact locks
- **Right pane** — generated outputs with validation results

---

## 2. Export System

### Project Exports ✅

| Format | Endpoint |
|---|---|
| DOCX | `GET /api/projects/:id/export/docx` |
| PDF | `GET /api/projects/:id/export/pdf` |
| PPTX | `GET /api/projects/:id/export/pptx` |
| Data (JSON/CSV) | `GET /api/projects/:id/export/data` |
| Full package | `GET /api/projects/:id/export` |

Libraries used: `docx` (DOCX), `pdfkit` (PDF), `pptxgenjs` (PPTX).

---

## 3. Resume Intelligence & ATS Studio ✅

A complete 8-tab resume system with Gemini-powered AI and Neon persistence.

### Tab 1 — Resume Builder ✅

Create and edit a structured resume:
- Contact information
- Professional summary
- Work experience (company, title, dates, bullets)
- Education
- Skills
- Projects
- Certifications
- Achievements
- Links

Operations: create, edit, save to Neon (`Resume` model), preview.

---

### Tab 2 — ATS Scanner ✅

Run a 9-dimension ATS compatibility scan against a job description:

| Dimension | Description |
|---|---|
| Overall Score | Composite 0–100 |
| Keyword Match | Keyword overlap % |
| Skills Match | Skills alignment % |
| Experience Match | Experience alignment % |
| Education Match | Education alignment % |
| Structure Score | Section structure quality |
| Formatting Score | ATS-safe formatting check |
| Contact Info Score | Contact completeness |
| Content Quality | Content quality assessment |

Output: keyword table, missing keywords list, findings with penalties, recommendations.

> **Note:** Scores are Gemini-computed estimates based on semantic analysis. They are not guaranteed to match any specific commercial ATS product's scoring.

---

### Tab 3 — Job Match ✅

Match a candidate resume against a parsed job description:

```
Job Description → jobSpine.ts → Requirement Extraction
Candidate Resume → candidateSpine.ts → Candidate Spine
Both → atsEngine.ts → Match Analysis → Gaps + Recommendations
```

---

### Tab 4 — Resume Optimizer ✅

Gemini-powered optimization with fact-lock protection:

```
Candidate Content Spine + Locked Facts
    ↓ + Job Description
Gemini (optimization prompt)
    ↓
resumeFactLock.ts (hallucination prevention)
    ↓
Optimized Resume Content
```

Optimization principle: ACTION VERB + TASK/ROLE + TECHNOLOGY + MEASURABLE IMPACT.  
**The optimizer does not invent candidate facts.** It rewrites existing bullets using better language and structure.

---

### Tab 5 — Resume Versions ✅

Version management for resumes targeting different jobs:

| Operation | Status |
|---|---|
| Create version | ✅ |
| Name/rename version | ✅ |
| Restore version | ✅ |
| Delete version | ✅ |
| Compare versions | 🔲 Planned |

Persisted in `ResumeVersion` model in Neon.

---

### Tab 6 — Cover Letter ✅

Generate a tailored cover letter using Gemini:

- Inputs: resume data + job description (title + company)
- Output: full cover letter text
- Persisted in `CoverLetter` model
- Operations: generate, edit, save

---

### Tab 7 — LinkedIn Profile ✅

Generate optimized LinkedIn profile sections using Gemini:

- Headline
- About summary
- Experience highlights
- Skills list

Persisted in `LinkedInProfile` model.

---

### Tab 8 — Resume Analytics ✅

Historical analytics for a resume:

- ATS scan history (score over time)
- Keyword coverage per version
- Optimization history
- Version count

Data sourced from real Neon queries against `ATSScan`, `ResumeVersion`, `GenerationActivity`.

> **Note:** Analytics display real data from the database. If no scans have been run, the analytics tab shows an empty state.

---

### Resume Exports ✅

| Format | Endpoint |
|---|---|
| DOCX | `GET /api/resume/:id/export/docx` |
| PDF | `GET /api/resume/:id/export/pdf` |

---

## 4. AI Knowledge Agent ✅

A Gemini-powered knowledge agent grounded in the project's Content Spine.

**Architecture:**
```
User message
    ↓
POST /api/agents/knowledge
    ↓
Source-Only Guardrail (0 facts → reject)
    ↓
Gemini (system prompt: locked facts only)
    ↓
Response with source citations
    ↓
Conversation persisted to Neon
```

**Guardrails:**
- Agent refuses to answer if no facts are locked (zero-facts guardrail)
- Responses are grounded in the Content Spine, not general knowledge
- Rate limit handling: 429 responses surface `GEMINI_RATE_LIMITED` with retry countdown

**Hallucination testing:** `POST /api/agents/test` runs pre-defined test queries and measures grounding accuracy.

---

## 5. Persistent History ✅

All conversations and messages are persisted to Neon PostgreSQL.

| Entity | Model |
|---|---|
| Conversation thread | `Conversation` |
| Individual messages | `Message` |
| Generation events | `GenerationActivity` |
| Export events | `ExportHistory` |

Operations: create, list, load, rename, delete conversation.

---

## 6. Dashboard ✅

Real-time metrics calculated from Neon queries:

| Metric | Source |
|---|---|
| Active Projects | `prisma.project.count()` |
| Fact Locks Enforced | `prisma.fact.count({ isLocked: true })` |
| Deliverables Built | `prisma.output.count()` |
| Factual Consistency Rate | Average from `prisma.validationResult` |
| Recent Projects | Top 5 by `updatedAt` |

---

## 7. AI Provider System ✅

| Provider | Model | Status |
|---|---|---|
| Google Gemini | `gemini-3.1-flash-lite` | ✅ Production default |
| OpenAI | `gpt-4o` | ⚠️ Code implemented; requires `OPENAI_API_KEY` — not configured in production |
| Llama 3 (Ollama) | `llama3` | ⚠️ Code implemented; requires local Ollama server — not available on Vercel |
| Mock | deterministic | ✅ Available via `AI_PROVIDER=mock` |

---

## 8. Rate Limit Handling ✅

Gemini Free Tier: 15 requests/minute.

When the limit is hit:
- HTTP 429 response
- Structured error code `GEMINI_RATE_LIMITED`
- `retryAfterSeconds` field
- Provider health status updates
- No silent fallback to Mock AI

---

## 9. File Conversion 🔲 Planned

`POST /api/projects/:id/convert` endpoint exists in the router but format conversion (e.g., MOV → MP4 via FFmpeg) is not implemented in production. FFmpeg is not available in the Vercel serverless environment.

---

## 10. Security Controls ✅

- Rate limiting: 120 req/min/IP (in-memory)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Upload filtering: MIME type allowlist, filename sanitization
- Prisma error sanitization (no credential leaks)
- Server-side AI keys
- 50 MB / 20 MB upload limits
