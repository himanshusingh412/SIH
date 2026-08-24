# Testing — ContentSpine AI

## Test Infrastructure

The project uses manual TypeScript test scripts in `server/src/tests/`. These are run with `npx tsx` — there is no Jest, Mocha, or Vitest configured.

Test scripts connect directly to the Neon database and the real Gemini API (or mock). They are integration-level tests, not isolated unit tests.

---

## Test Files

| File | What It Tests |
|---|---|
| `db_production_test_suite.ts` | Neon DB connection, dashboard stats aggregation, project create + read |
| `gemini_rate_limit_test_suite.ts` | Gemini 429 handling, `GEMINI_RATE_LIMITED` error code, retry behavior |
| `neon_history_test_suite.ts` | Conversation creation, message persistence, conversation retrieval |
| `pdf_extraction_test_suite.ts` | PDF text extraction pipeline, sanitization of PDF binary syntax |
| `provider_test_suite.ts` | AI provider connectivity (Gemini, Mock) |
| `resume_test_suite.ts` | Resume creation, ATS scan, optimizer, version management, export |
| `agent_harness_test_suite.ts` | Knowledge agent guardrails, grounding, zero-facts rejection |

---

## Running Tests

```bash
# Requires DATABASE_URL and AI_API_KEY to be set in server/.env
cd server

# Run a specific test suite
npx tsx src/tests/db_production_test_suite.ts
npx tsx src/tests/gemini_rate_limit_test_suite.ts
npx tsx src/tests/neon_history_test_suite.ts
npx tsx src/tests/pdf_extraction_test_suite.ts
npx tsx src/tests/provider_test_suite.ts
npx tsx src/tests/resume_test_suite.ts
npx tsx src/tests/agent_harness_test_suite.ts
```

> **Note:** Tests require a live Neon database and (for Gemini tests) a valid `AI_API_KEY`. Running without these will fail with `DATABASE_UNAVAILABLE` or `GEMINI_RATE_LIMITED`.

---

## Feature Verification Matrix

| Feature | Test File | Verified Behavior |
|---|---|---|
| Neon DB connection | `db_production_test_suite` | `SELECT 1` succeeds |
| Dashboard stats (real data) | `db_production_test_suite` | `activeProjectsCount` increments after project create |
| Prisma error sanitization | `db_production_test_suite` | No credentials in error response |
| Gemini 429 response structure | `gemini_rate_limit_test_suite` | `GEMINI_RATE_LIMITED` code + `retryAfterSeconds` |
| No Mock fallback on 429 | `gemini_rate_limit_test_suite` | Provider stays GEMINI, not MOCK |
| Conversation creation | `neon_history_test_suite` | `Conversation` row in Neon |
| Message persistence | `neon_history_test_suite` | `Message` rows linked to conversation |
| PDF text extraction | `pdf_extraction_test_suite` | Raw text — no `/MediaBox`, `stream`, `endobj` |
| Gemini connectivity | `provider_test_suite` | `testConnection()` returns `success: true` |
| Resume creation | `resume_test_suite` | `Resume` row created in Neon |
| ATS scan | `resume_test_suite` | `ATSScan` row with 9 dimension scores |
| Resume DOCX export | `resume_test_suite` | Binary DOCX buffer returned |
| Resume PDF export | `resume_test_suite` | Binary PDF buffer returned |
| Knowledge agent grounding | `agent_harness_test_suite` | Response cites locked facts |
| Zero-facts guardrail | `agent_harness_test_suite` | Agent rejects query when no facts locked |

---

## TypeScript Compilation Check

```bash
cd server && npx tsc --noEmit   # Must complete with 0 errors
cd client && npx tsc -b          # Must complete with 0 errors (also run by vite build)
```

---

## Build Verification

```bash
# Full production build check (same as Vercel)
npm run vercel-build
```

Expected output:
- `✔ Generated Prisma Client`
- `✔ Built in XXXms` (server TypeScript)
- `✓ built in XXXms` (Vite client)

---

## Live Production Endpoint Tests

After deployment, verify manually:

```bash
# Health
curl https://sih-2026-ai-engine.vercel.app/api/health
# Expected: { "database": "connected", "status": "healthy" }

# DB diagnostics
curl https://sih-2026-ai-engine.vercel.app/api/health/db-diagnostics
# Expected: { "databaseConfigured": true, "connection": "healthy" }

# Dashboard stats
curl https://sih-2026-ai-engine.vercel.app/api/projects/dashboard-stats
# Expected: { "success": true, "data": { "stats": { ... } } }

# Create project
curl -X POST https://sih-2026-ai-engine.vercel.app/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test","description":"Verify write pipeline"}'
# Expected: { "success": true, "data": { "project": { "id": "uuid", ... } } }
```

---

## Known Test Limitations

1. **No automated CI test runner** — tests must be run manually. There is no GitHub Actions workflow running tests on push.
2. **Integration-only** — there are no pure unit tests with mocked Prisma/Gemini dependencies.
3. **Rate limit sensitivity** — Gemini tests may fail during a 429 window; wait 60 seconds and retry.
4. **Local DATABASE_URL required** — tests cannot run without Neon credentials in `server/.env`.

---

## Planned Testing Improvements 🔲

| Improvement | Priority |
|---|---|
| Add Jest + ts-jest with Prisma mock for unit tests | High |
| GitHub Actions CI workflow: type-check + build on every push | High |
| E2E tests with Playwright against the live Vercel deployment | Medium |
| Automated smoke test after every deployment | Medium |
| Contract tests for all API response shapes | Low |
