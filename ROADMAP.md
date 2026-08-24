# Roadmap — ContentSpine AI

Features are categorized by status and priority. This roadmap reflects the current codebase and realistic near-term improvements.

---

## ✅ Implemented (Current Release)

### Core Content Transformation
- [x] PDF, DOCX, TXT, Image ingestion with adapter pattern
- [x] Gemini-powered Content Spine extraction (summary, facts, entities)
- [x] Fact Lock system (human-verified locks constrain AI generation)
- [x] Multi-format output generation: Executive Summary, LinkedIn Post, X Thread, Advisory, Presentation, Infographic, Video Package
- [x] 3-pane Review Workspace
- [x] Output validation against locked facts
- [x] Auto-correction of validation errors
- [x] DOCX, PDF, PPTX, data export engines

### Resume Intelligence & ATS Studio
- [x] 8-tab Resume Studio
- [x] 9-dimension ATS Scanner
- [x] Job Match analysis
- [x] Gemini optimizer with fact-lock validation
- [x] Resume version management (create, restore, delete)
- [x] Cover letter generation
- [x] LinkedIn profile generation
- [x] Resume analytics (ATS history, keyword coverage)
- [x] Resume DOCX + PDF binary export

### AI & Provider System
- [x] Google Gemini (`gemini-3.1-flash-lite`) — production default
- [x] OpenAI GPT-4o provider (requires `OPENAI_API_KEY`)
- [x] Llama 3 / Ollama provider (local only)
- [x] Mock provider (testing)
- [x] Gemini 429 rate limit handling (`GEMINI_RATE_LIMITED` + retry countdown)
- [x] Zero-facts guardrail for Knowledge Agent

### Persistence
- [x] Neon PostgreSQL production database
- [x] Prisma ORM with 23 models
- [x] Persistent conversation + message history
- [x] Generation activity audit log
- [x] Export history log

### Infrastructure
- [x] Vercel serverless deployment
- [x] Database error sanitization (no credential leaks)
- [x] Rate limiting (120 req/min/IP)
- [x] Security headers
- [x] Upload MIME validation + filename sanitization
- [x] Real dashboard metrics from Neon queries

---

## 🔲 Short-Term Planned

### Authentication
- [ ] User registration + login (JWT or session)
- [ ] Project isolation — users can only see their own projects
- [ ] Per-user resume isolation

### Testing Infrastructure
- [ ] Jest + ts-jest unit tests with Prisma mock
- [ ] GitHub Actions CI: type-check + build on every push
- [ ] Automated smoke test after every Vercel deployment

### File Conversion
- [ ] MOV → MP4 conversion (requires non-serverless environment or external service)
- [ ] Audio file transcription support

### Provider Configuration
- [ ] Configure `OPENAI_API_KEY` in production for live OpenAI fallback
- [ ] Provider selection UI that persists choice to server

### Resume Studio
- [ ] Version comparison (diff view between two versions)
- [ ] Resume templates beyond `ATS_CLASSIC`
- [ ] Import from LinkedIn URL

---

## 🔲 Medium-Term Planned

### Collaboration
- [ ] Project sharing with other users (read/edit access)
- [ ] Comments on locked facts
- [ ] Approval workflow for fact locks

### Content Intelligence
- [ ] Source document change detection (re-extract when source updates)
- [ ] Multiple source documents per project
- [ ] Cross-document fact reconciliation

### Performance & Scale
- [ ] Redis for rate limiting (replace in-memory Map)
- [ ] Job queue for async generation (replace synchronous Gemini calls)
- [ ] CDN for exported files

### Observability
- [ ] Structured logging with correlation IDs
- [ ] Generation latency tracking in UI
- [ ] Error rate dashboard

---

## ❌ Explicitly Not Planned

| Feature | Reason |
|---|---|
| FFmpeg video processing on Vercel | Vercel serverless cannot run FFmpeg binaries |
| SQLite in production | Replaced by Neon PostgreSQL |
| Mock AI as production fallback | Would defeat the purpose of fact-locked generation |
| Client-side AI calls | API keys must remain server-side |
| Hardcoded demo data as real metrics | Dashboard uses only real Neon queries |
