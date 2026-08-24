# Changelog — ContentSpine AI

All significant changes to the ContentSpine AI project, in reverse chronological order.

---

## [Unreleased]

No pending unreleased changes.

---

## 2026-08-24 — Production Database Fix + Real Dashboard Metrics

### Fixed
- **Critical:** Removed `localhost:5432` fallback from `vercel-build` script that caused `Can't reach database server at localhost:5432` in production
- **Critical:** Added `DATABASE_URL` to Vercel production + preview environment variables
- Prisma errors now return `DATABASE_UNAVAILABLE` JSON instead of raw stack traces with host/port details
- `GET /api/health` now runs a real `SELECT 1` against Neon before returning `"database": "connected"`

### Added
- `GET /api/health/db-diagnostics` — safe boolean-only diagnostics (no credentials)
- `GET /api/projects/dashboard-stats` — real Neon aggregation: active project count, fact locks, deliverables, consistency rate, recent projects
- `server/src/tests/db_production_test_suite.ts` — automated production database test suite

### Changed
- `DashboardPage.tsx` — overview cards now show real Neon metrics (not hardcoded zeros)
- `server/src/config/index.ts` — exports `isDatabaseConfigured`, `isNeonDatabase`, `isLocalhostDatabase` flags
- `server/src/middleware/errorHandler.ts` — global Prisma error sanitizer

---

## 2026-08-24 — Resume Intelligence & ATS Studio

### Added
- Complete 8-tab Resume Intelligence & ATS Studio (`client/src/components/studios/ResumeStudio.tsx`)
  - Tab 1: Resume Builder (contact, summary, experience, education, skills, projects, certs)
  - Tab 2: ATS Scanner (9-dimension scoring with keyword matrix)
  - Tab 3: Job Match (gap analysis and recommendations)
  - Tab 4: Resume Optimizer (Gemini + fact-lock validation)
  - Tab 5: Resume Versions (create, restore, delete)
  - Tab 6: Cover Letter (Gemini generation + save)
  - Tab 7: LinkedIn Profile (Gemini headline + about + experience + skills)
  - Tab 8: Resume Analytics (ATS history, keyword coverage)
- Resume engine: `atsEngine.ts`, `candidateSpine.ts`, `jobSpine.ts`, `resumeOptimizer.ts`, `resumeFactLock.ts`, `resumeExporters.ts`
- Resume API routes: 16 endpoints in `resumeRoutes.ts`
- Resume Prisma models: `Resume`, `ResumeVersion`, `JobDescription`, `ATSScan`, `CoverLetter`, `LinkedInProfile`
- Binary DOCX + PDF export for resumes

---

## 2026-08-24 — Persistent History with Neon PostgreSQL

### Added
- `Conversation`, `Message`, `GenerationActivity`, `ExportHistory` Prisma models
- `historyController.ts`, `historyService.ts`, `historyRoutes.ts`
- `HistoryPage.tsx` — full conversation browser with real Neon data

---

## 2026-08-24 — Gemini 429 Rate Limit Handling

### Added
- `providerHealthService.ts` — tracks Gemini health state and retry windows
- Structured `GEMINI_RATE_LIMITED` error code with `retryAfterSeconds`
- Zero-facts guardrail in Knowledge Agent

### Fixed
- Provider status no longer shows "Connected" during a 429 window
- No silent fallback to Mock AI on rate limit

---

## 2026-08-24 — AI Knowledge Agent

### Added
- Knowledge Agent UI in `AgentsPage.tsx`
- `agentController.ts`, `agentService.ts`, `agentRoutes.ts`
- `Agent`, `AgentSession`, `AgentMessage`, `AgentTest` Prisma models
- Gemini-grounded response generation using locked facts as context
- Hallucination test runner (`POST /api/agents/test`)

---

## 2026-08-24 — Creative Studio Removal

### Removed
- Creative Studio and Creative Studio Multimodal from sidebar navigation
- All Creative Studio routes, API endpoints, and related code
- Sidebar now contains exactly 9 items: Dashboard, Projects, Content Spine, Review Workspace, Resume Studio, AI Agents, History, Analytics, Settings

---

## 2026-08-24 — PDF Extraction Pipeline Fix

### Fixed
- Review Workspace source panel was displaying raw PDF internal syntax (`/MediaBox`, `stream`, `endobj`)
- `pdfSanitizer.ts` added to strip PDF binary/object syntax from extracted text before display
- `PdfAdapter` updated to return clean human-readable text only

---

## 2026-08-24 — AI Provider Architecture

### Added
- Multi-provider factory (`server/src/ai/providers/factory.ts`)
- `GeminiProvider` — primary production provider using `@google/generative-ai`
- `OpenAIProvider` — optional provider (requires `OPENAI_API_KEY`)
- `LlamaProvider` — Ollama/Llama3 (local only, not on Vercel)
- `MockProvider` — deterministic mock for testing

### Changed
- Default provider: `GEMINI` (`gemini-3.1-flash-lite`)
- Provider label: "Gemini 3.1 Flash Lite" (not "Gemini 1.5")

---

## Initial Implementation

### Added
- Express + TypeScript server
- React + Vite client
- Content Spine extraction with Gemini
- Fact Lock system
- Multi-format output generation (Executive Summary, LinkedIn Post, X Thread, Advisory, Presentation, Infographic, Video Package)
- 3-pane Review Workspace
- DOCX, PDF, PPTX export engines
- Document ingestion: PDF, DOCX, TXT, Image adapters
- ValidationResult model and output fact-checking
- Auto-correction workflow
- Vercel deployment with `vercel.json` routing
- Prisma schema with full model set
