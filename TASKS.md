# Tasks — ContentSpine AI

Active development tasks and known issues. Updated as work completes.

---

## ✅ Completed

- [x] PDF raw syntax exposure fix (pdfSanitizer.ts)
- [x] Fix "Failed to fetch" in deployed app (CORS + API routing)
- [x] Remove localhost:5432 production fallback
- [x] Add DATABASE_URL to Vercel environment variables
- [x] Push Prisma schema to Neon (all 23 tables)
- [x] Implement real dashboard metrics from Neon queries
- [x] Add GET /api/health/db-diagnostics (no credential exposure)
- [x] Sanitize Prisma errors (DATABASE_UNAVAILABLE response)
- [x] Gemini 429 rate limit handling (GEMINI_RATE_LIMITED code + retryAfterSeconds)
- [x] Remove Mock AI silent fallback on rate limit
- [x] Zero-facts guardrail in Knowledge Agent
- [x] Persistent conversation + message history in Neon
- [x] Resume Intelligence & ATS Studio (8 tabs)
- [x] ATS Scanner 9-dimension scoring
- [x] Resume Optimizer with fact-lock validation
- [x] Resume version management (create, restore, delete)
- [x] Cover letter generation
- [x] LinkedIn profile generation
- [x] Resume analytics from real Neon data
- [x] Resume DOCX + PDF binary export
- [x] Remove Creative Studio from navigation and codebase
- [x] Update all documentation to match current codebase

---

## 🔲 Open Issues

### High Priority

- [ ] **Authentication not implemented** — all projects are publicly accessible by UUID. `userId` fields exist in the schema but no auth middleware enforces ownership.
- [ ] **No automated CI tests** — `tsc --noEmit` and `vite build` must be run manually. No GitHub Actions workflow exists.
- [ ] **In-memory rate limiter** — the 120 req/min rate limiter resets on every Vercel function cold-start. Move to Redis for true persistence.

### Medium Priority

- [ ] **OpenAI not configured in production** — `OPENAI_API_KEY` is not set in Vercel. The provider code is ready; just needs the key added.
- [ ] **Resume version comparison** — "Compare versions" button is in the UI but diff view is not implemented.
- [ ] **File conversion not implemented** — `POST /api/projects/:id/convert` route exists but the converter engine has stub implementations.
- [ ] **MOV → MP4 not available on Vercel** — FFmpeg cannot run in Vercel serverless functions.

### Low Priority

- [ ] **Llama 3 / Ollama not available on Vercel** — works locally only. Document this clearly in Settings UI.
- [ ] **`prisma db push` vs `prisma migrate`** — project uses schema push. Consider migrating to formal migration files for production safety.
- [ ] **Projects page stub** — the "Projects" sidebar item routes to a basic view. Full project list management UI is incomplete.

---

## 🔲 Planned Work

See [ROADMAP.md](ROADMAP.md) for the full planned feature list.

---

## Recently Resolved

| Issue | Resolution Date | Fix |
|---|---|---|
| `localhost:5432` in production | 2026-08-24 | Removed fallback from vercel-build script |
| `DATABASE_URL` missing from Vercel | 2026-08-24 | Added via `vercel env add` |
| Neon tables not created | 2026-08-24 | Ran `prisma db push` against Neon |
| PDF raw syntax in Review Workspace | 2026-08-24 | Added pdfSanitizer.ts |
| Mock AI shown as default | 2026-08-24 | Default provider set to Gemini |
| 429 silently falling back to Mock | 2026-08-24 | Explicit GEMINI_RATE_LIMITED error response |
| Hardcoded dashboard zeros | 2026-08-24 | Real Neon queries via getDashboardStats() |
