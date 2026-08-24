# Tech Stack — ContentSpine AI

## Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI component framework |
| **TypeScript** | 5.x | Static typing |
| **Vite** | 8.x | Build tool, dev server, HMR |
| **Custom CSS** | — | Styling (vanilla CSS, no Tailwind) |
| **react-markdown** | 10.x | Renders Markdown output content |

**No Tailwind, no CSS-in-JS, no external component library.**  
All UI is built with custom CSS in `client/src/index.css` and `App.css`.

---

## Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Server runtime |
| **Express** | 4.x | HTTP framework |
| **TypeScript** | 5.x | Static typing |
| **multer** | 1.4.5 | Multipart file upload handling |
| **cors** | 2.8.x | Cross-origin request handling |
| **dotenv** | 16.x | `.env` file loading |
| **zod** | 3.x | Schema validation |
| **xml2js** | 0.6.x | XML parsing |
| **js-yaml** | 4.x | YAML parsing |

---

## Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| **Neon PostgreSQL** | Serverless | Production database |
| **Prisma** | 5.22 | ORM, schema management, migrations |

Prisma schema at `server/prisma/schema.prisma`.  
Prisma client singleton at `server/src/config/index.ts`.

---

## AI

| Technology | Version | Purpose |
|---|---|---|
| **@google/generative-ai** | 0.24.x | Official Google Gemini SDK |
| **Model** | `gemini-3.1-flash-lite` | Primary AI model |
| OpenAI (fetch-based) | — | Optional provider (requires `OPENAI_API_KEY`) |
| Ollama (fetch-based) | — | Optional local Llama 3 (not available on Vercel) |

---

## Document Processing

| Library | Purpose |
|---|---|
| **pdf-parse** | PDF text extraction |
| **docx** | DOCX generation (export) |
| **pdfkit** | PDF generation (export) |
| **pptxgenjs** | PPTX generation (export) |

DOCX and image input parsing use built-in Node.js `Buffer` operations with custom adapter logic.

---

## Security & Middleware

| Implementation | Purpose |
|---|---|
| Custom rate limiter | 120 req/min/IP, in-memory Map |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` |
| multer validation | MIME type allowlist + filename sanitization |
| Prisma error sanitizer | Strips credentials from DB error responses |

---

## Deployment

| Technology | Purpose |
|---|---|
| **Vercel** | Serverless deployment (frontend + backend) |
| **GitHub** | Source control, CI trigger |
| **Vercel CLI** | Production deploy (`npx vercel --prod`) |

---

## Development Tools

| Tool | Purpose |
|---|---|
| **TypeScript** | Compile-time type safety |
| `tsc --noEmit` | Type check without building |
| `vite build` | Client production build |
| `prisma generate` | Prisma client code generation |
| `prisma db push` | Schema synchronization to Neon |
| `npx tsx` | Run TypeScript files directly (test scripts) |

---

## What Is NOT Used

| Technology | Status |
|---|---|
| Tailwind CSS | ❌ Not used |
| Next.js | ❌ Not used (plain Vite React) |
| GraphQL | ❌ Not used (REST only) |
| Redis | ❌ Not used (rate limiter is in-memory) |
| FFmpeg | ❌ Not available in production (Vercel serverless) |
| SQLite | ❌ Was local dev default; replaced by Neon in production |
| Drizzle | ❌ Not used (Prisma only) |
| MongoDB | ❌ Not used |
