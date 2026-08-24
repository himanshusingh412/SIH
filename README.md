# ContentSpine AI

> **AI Content Transformation Engine** — Upload a source document, lock facts, and generate multi-format deliverables grounded in verified truth.

**Live URL:** https://sih-2026-ai-engine.vercel.app  
**Repository:** https://github.com/himanshusingh412/SIH

---

## What It Does

ContentSpine AI takes a single source document (PDF, DOCX, TXT, image) and transforms it into multiple output formats — executive summaries, LinkedIn posts, X threads, presentations, infographics, and more — while enforcing a **Fact Lock** system that prevents AI hallucination by grounding every generation in verified source facts.

```
Source Document
    ↓
Content Spine (structured extraction)
    ↓
Fact Lock (human-verified facts)
    ↓
Gemini AI (grounded generation)
    ↓
Validated Outputs (multi-format)
    ↓
Neon PostgreSQL (persistent storage)
```

---

## Core Modules

| Module | Description |
|---|---|
| **Dashboard** | Real-time project metrics from Neon DB |
| **Content Spine** | Structured fact extraction from source documents |
| **Review Workspace** | 3-pane review: source ↔ spine ↔ outputs |
| **Resume Studio** | 8-tab ATS-aware resume intelligence system |
| **AI Agents** | Gemini-powered knowledge agent with guardrails |
| **History** | Persistent conversation + generation logs |
| **Analytics** | Project activity and generation statistics |
| **Settings** | Provider configuration (Gemini / Mock) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| AI | Google Gemini (`gemini-3.1-flash-lite`) |
| ORM | Prisma 5.22 |
| Database | Neon PostgreSQL (production) |
| Deployment | Vercel (serverless) |
| Export | `docx`, `pdfkit`, `pptxgenjs` |
| File parsing | `pdf-parse`, `multer` |

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [Neon PostgreSQL](https://neon.tech) database
- A [Google AI Studio](https://aistudio.google.com) API key

### Setup

```bash
# Clone
git clone https://github.com/himanshusingh412/SIH.git
cd SIH

# Configure server environment
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and AI_API_KEY

# Push database schema to Neon
cd server && npx prisma db push --schema=prisma/schema.prisma

# Install all dependencies
npm install
npm --prefix client install
npm --prefix server install

# Start development
npm --prefix server run dev   # API on http://localhost:5001
npm --prefix client run dev   # UI on http://localhost:5173
```

### Environment Variables

```env
# server/.env
PORT=5001
NODE_ENV=development
DATABASE_URL=<your-neon-connection-string>
AI_PROVIDER=gemini
AI_API_KEY=<your-gemini-api-key>
AI_MODEL=gemini-3.1-flash-lite
DEMO_MODE=false
```

> **Never commit `server/.env` to version control.** It is in `.gitignore`.

---

## Deployment

Deployed on [Vercel](https://vercel.com). The `vercel-build` script:

1. Installs client dependencies
2. Generates Prisma client
3. Runs `prisma db push` (if `DATABASE_URL` is set)
4. Builds server TypeScript
5. Builds client Vite bundle

Required Vercel environment variables:
- `DATABASE_URL` — Neon connection string
- `AI_API_KEY` — Gemini API key
- `AI_PROVIDER=gemini`
- `AI_MODEL=gemini-3.1-flash-lite`
- `DEMO_MODE=false`

---

## API Health Check

```bash
curl https://sih-2026-ai-engine.vercel.app/api/health
# → { "success": true, "database": "connected", "status": "healthy" }
```

---

## Rate Limiting

The Gemini Free Tier allows **15 requests/minute**. The server handles `HTTP 429` responses with:
- Structured error code `GEMINI_RATE_LIMITED`
- `retryAfterSeconds` field in response
- Provider health status tracking
- No silent fallback to mock AI

---

## File Upload Limits

| Type | Limit |
|---|---|
| Source documents | 50 MB |
| Resume uploads | 20 MB |
| Allowed formats | PDF, DOCX, TXT, MD, JSON, PNG, JPG, WEBP |

---

## License

See [LICENSE.md](LICENSE.md).
