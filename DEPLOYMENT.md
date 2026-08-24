# Deployment Guide — ContentSpine AI

## Production Environment

| Property | Value |
|---|---|
| Platform | Vercel (serverless) |
| Live URL | https://sih-2026-ai-engine.vercel.app |
| Scope | `himanshu-prj` |
| Project | `sih-2026-ai-engine` |
| Region | Washington D.C. (`iad1`) |
| Database | Neon PostgreSQL |
| AI Provider | Google Gemini (`gemini-3.1-flash-lite`) |

---

## Architecture

```
GitHub (main)
    ↓  push or vercel --prod
Vercel Build
    ↓  vercel-build script
  1. npm --prefix client install
  2. prisma generate
  3. prisma db push (if DATABASE_URL set)
  4. npm --prefix server run build (tsc)
  5. npm --prefix client run build (vite)
    ↓
Vercel Serverless Functions (server/)
Vercel Static CDN (client/dist/)
    ↓
Neon PostgreSQL ← DATABASE_URL
Google Gemini   ← AI_API_KEY
```

---

## Prerequisites

1. **Neon PostgreSQL database** — create at [neon.tech](https://neon.tech)
2. **Google Gemini API key** — create at [aistudio.google.com](https://aistudio.google.com)
3. **Vercel account** with the project linked to the GitHub repository
4. **Vercel CLI** — `npm i -g vercel`

---

## Required Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Environments | Type |
|---|---|---|
| `DATABASE_URL` | Production + Preview | Sensitive |
| `AI_API_KEY` | Production + Preview | Sensitive |
| `AI_PROVIDER` | Production + Preview | Sensitive |
| `AI_MODEL` | Production + Preview | Sensitive |
| `DEMO_MODE` | Production + Preview | Sensitive |

Or add via CLI:

```bash
echo "postgresql://..." | npx vercel env add DATABASE_URL production
echo "gemini" | npx vercel env add AI_PROVIDER production
echo "gemini-3.1-flash-lite" | npx vercel env add AI_MODEL production
echo "false" | npx vercel env add DEMO_MODE production
# AI_API_KEY — add manually in dashboard (sensitive)
```

---

## Deploying

### From CLI (production)

```bash
cd /path/to/SIH
npx vercel --prod --scope himanshu-prj
```

### From Git Push

Vercel automatically deploys when you push to `main` if the project is connected to GitHub.

---

## Build Script

Defined in root `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm --prefix client install && prisma generate --schema=server/prisma/schema.prisma && (if [ -n \"$DATABASE_URL\" ]; then npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss || true; fi) && npm --prefix server run build && npm --prefix client run build"
  }
}
```

> The `prisma db push` only runs if `DATABASE_URL` is set in the build environment. This prevents build failures when the variable is temporarily missing.

---

## Database Migration

The project uses **`prisma db push`** (schema synchronization) rather than `prisma migrate`.

### First deployment

```bash
# Locally, with Neon DATABASE_URL in server/.env:
cd server
npx prisma db push --schema=prisma/schema.prisma
```

### Subsequent schema changes

1. Modify `server/prisma/schema.prisma`
2. Run `npx prisma db push` locally to verify
3. Commit and push — the `vercel-build` script will apply it automatically

> **Warning:** `prisma db push --accept-data-loss` can drop columns. Review schema diffs carefully before pushing destructive changes.

---

## Post-Deployment Verification

After every production deploy, verify these endpoints:

```bash
# 1. Health check
curl https://sih-2026-ai-engine.vercel.app/api/health

# Expected:
# { "success": true, "database": "connected", "status": "healthy" }

# 2. DB diagnostics (no credentials exposed)
curl https://sih-2026-ai-engine.vercel.app/api/health/db-diagnostics

# Expected:
# { "databaseConfigured": true, "productionDatabase": true, "connection": "healthy" }

# 3. Dashboard stats (real Neon query)
curl https://sih-2026-ai-engine.vercel.app/api/projects/dashboard-stats

# Expected:
# { "success": true, "data": { "stats": { "activeProjectsCount": ... } } }
```

---

## Rollback

Vercel keeps previous deployment builds. To rollback:

```bash
# List recent deployments
npx vercel ls --scope himanshu-prj

# Promote a previous deployment to production
npx vercel promote <deployment-url> --scope himanshu-prj
```

---

## Common Deployment Issues

### `Can't reach database server at localhost:5432`

**Cause:** `DATABASE_URL` environment variable is not set in Vercel.  
**Fix:** Add `DATABASE_URL` to Vercel environment variables (Production + Preview) and redeploy.

### `Error validating datasource: URL must start with postgresql://`

**Cause:** `DATABASE_URL` is set to a SQLite path (e.g., `file:./dev.db`) or is empty.  
**Fix:** Set `DATABASE_URL` to a valid Neon PostgreSQL connection string.

### Prisma Client not found

**Cause:** `prisma generate` did not run during build.  
**Fix:** The `vercel-build` script runs `prisma generate` — ensure it is not modified to skip this step.

### `Gemini 429 Too Many Requests`

**Cause:** Free-tier rate limit (15 req/min) exceeded.  
**Fix:** Wait for the retry window. The server returns `retryAfterSeconds` in the error body. Upgrade to a paid Gemini tier for higher limits.

---

## Local Development vs Production

| Concern | Development | Production |
|---|---|---|
| Database | Same Neon DB (or local SQLite for isolated dev) | Neon PostgreSQL |
| AI | Gemini (same key) or `DEMO_MODE=true` | Gemini |
| Server | `npm run dev` on port 5001 | Vercel serverless |
| Client | Vite dev server on port 5173 | Vercel CDN static |
| Prisma | `prisma db push` locally | `prisma db push` in `vercel-build` |
