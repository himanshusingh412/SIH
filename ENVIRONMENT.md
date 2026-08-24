# Environment Setup & Configuration Guide — ContentSpine AI

## 1. System Requirements
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Operating System**: macOS, Linux, or Windows (WSL2 / PowerShell)

---

## 2. Environment Variables Specification

The backend server is configured via `server/.env`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `5001` | Express API server port |
| `NODE_ENV` | String | `development` | Environment mode (`development` / `production`) |
| `DATABASE_URL` | String | `file:./dev.db` | SQLite file connection string or PostgreSQL URL |
| `DEFAULT_AI_PROVIDER` | String | `mock` | Active AI provider (`mock`, `gemini`, `openai`) |
| `GEMINI_API_KEY` | String | `""` | Optional Google Gemini API Key |
| `OPENAI_API_KEY` | String | `""` | Optional OpenAI API Key |

The frontend client is configured via `client/.env`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | `http://localhost:5001/api` | Backend REST API endpoint URL |

---

## 3. Setup Commands

```bash
# 1. Copy sample environment file
cp server/.env.example server/.env

# 2. Install server dependencies & push database schema
cd server
npm install
npx prisma db push

# 3. Install client dependencies
cd ../client
npm install
```
