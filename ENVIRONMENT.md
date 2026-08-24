# Environment Variables — ContentSpine AI

All server-side environment variables belong in `server/.env` (never committed to git).

---

## Server Variables

### `DATABASE_URL`

| Property | Value |
|---|---|
| Required | **Yes** (production) |
| Side | Server-side only |
| Purpose | Neon PostgreSQL connection string |
| Example | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |

> **Security:** Never expose this value in client code, logs, API responses, or documentation. Use `<your-neon-connection-string>` as a placeholder.

---

### `AI_API_KEY`

| Property | Value |
|---|---|
| Required | **Yes** (for Gemini) |
| Side | Server-side only |
| Purpose | Google Gemini API key from [AI Studio](https://aistudio.google.com) |
| Example | `AI_API_KEY=` *(never write the real key in docs)* |

---

### `AI_PROVIDER`

| Property | Value |
|---|---|
| Required | Yes |
| Side | Server-side |
| Default | `gemini` |
| Allowed values | `gemini`, `openai`, `mock`, `llama` |
| Purpose | Selects the active AI provider |

---

### `AI_MODEL`

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `gemini-3.1-flash-lite` |
| Purpose | Model name passed to the AI provider |

---

### `DEMO_MODE`

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `false` |
| Purpose | When `true`, bypasses live AI calls and uses mock provider |

---

### `PORT`

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `5001` |
| Purpose | Local Express server port (ignored on Vercel) |

---

### `NODE_ENV`

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `development` |
| Allowed values | `development`, `production` |
| Purpose | Controls Prisma client reuse and error verbosity |

---

### `OPENAI_API_KEY` *(optional)*

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Purpose | OpenAI API key. Required only if `AI_PROVIDER=openai`. Not configured in production. |

---

### `OPENAI_MODEL` *(optional)*

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `gpt-4o` |
| Purpose | OpenAI model name. Only used if `AI_PROVIDER=openai`. |

---

### `OLLAMA_ENDPOINT` *(optional)*

| Property | Value |
|---|---|
| Required | No |
| Side | Server-side |
| Default | `http://localhost:11434/api/generate` |
| Purpose | Ollama endpoint for local Llama 3. Not available on Vercel. |

---

## Client Variables

The client (`client/`) currently has **no public environment variables**. The API base URL is determined at runtime from `window.location`.

> Do not create `VITE_*` variables that expose secrets.

---

## Vercel Environment Variables

These must be set in the Vercel project dashboard under **Settings → Environment Variables**:

| Variable | Environment | Notes |
|---|---|---|
| `DATABASE_URL` | Production + Preview | Neon connection string |
| `AI_API_KEY` | Production + Preview | Gemini API key |
| `AI_PROVIDER` | Production + Preview | `gemini` |
| `AI_MODEL` | Production + Preview | `gemini-3.1-flash-lite` |
| `DEMO_MODE` | Production + Preview | `false` |

All Vercel variables should be marked **Sensitive** (hidden).

---

## Local Development Setup

```bash
cp server/.env.example server/.env
# Edit server/.env and fill in DATABASE_URL and AI_API_KEY
```

`server/.env.example`:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=gemini-3.1-flash-lite
DEMO_MODE=false
```

---

## Security Rules

1. **Never commit `server/.env`** — it is in `.gitignore`
2. **Never put `DATABASE_URL` in client code** — Prisma runs server-side only
3. **Never use `VITE_*` prefix for secrets** — Vite embeds these into the public bundle
4. **Never log `DATABASE_URL` or `AI_API_KEY`** — sanitize all error responses
5. **Never use `localhost:5432` in production** — always use the Neon connection string
