# Coding Rules — ContentSpine AI

Standards and patterns enforced across this codebase. New contributors and AI agents must follow these rules.

---

## 1. Source of Truth Hierarchy

```
Codebase
    ↓
Database Schema (Prisma)
    ↓
API Routes
    ↓
Service/Controller Logic
    ↓
Frontend Components
    ↓
Documentation
```

If documentation conflicts with the codebase, update the documentation — not the code — unless the code has a bug.

---

## 2. Database Rules

### Single ORM: Prisma only

Do not introduce Drizzle, TypeORM, Sequelize, or raw `pg` queries. Prisma is the only ORM.

### Singleton client

The Prisma client is initialized once in `server/src/config/index.ts` as `global.prisma`. Do not create new `PrismaClient()` instances elsewhere.

```typescript
// ✅ Correct
import { prisma } from '../config';

// ❌ Wrong
const prisma = new PrismaClient();
```

### No localhost in production

`DATABASE_URL` must never default to `localhost:5432` in production server code. The config reads `process.env.DATABASE_URL` only. If no URL is set, the error is surfaced cleanly — not silently swallowed.

### Never expose credentials

```typescript
// ❌ Wrong
res.json({ error: err.message }); // may contain host/port/password

// ✅ Correct
res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: '...' } });
```

---

## 3. Error Response Format

All errors must use the standard envelope via `sendError()` in `server/src/utils/response.ts`:

```typescript
// ✅ Correct
import { sendError } from '../utils/response';
return sendError(res, 'Project title is required', 400, 'VALIDATION_ERROR');

// ❌ Wrong
res.status(400).json({ error: 'bad request' });
```

Standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null
  },
  "timestamp": "..."
}
```

Standard success envelope:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "..."
}
```

---

## 4. AI Provider Rules

### Provider factory, not direct instantiation

```typescript
// ✅ Correct
import { getAIProviderInstance } from '../ai/providers/factory';
const provider = getAIProviderInstance();

// ❌ Wrong
import { GeminiProvider } from '../ai/providers/geminiProvider';
const provider = new GeminiProvider();
```

### API keys are server-side only

Never put `AI_API_KEY` or any API key in:
- Client-side TypeScript/JavaScript
- `VITE_*` environment variables
- Vite build output
- API response bodies
- Console logs

### Handle 429 explicitly

When Gemini returns HTTP 429, the server must:
1. Return HTTP 429 to the client
2. Include `code: 'GEMINI_RATE_LIMITED'`
3. Include `retryAfterSeconds` if available
4. **Never fall back to Mock AI silently**

---

## 5. Fact Lock Invariant

Generated content must never automatically become a source fact:

```
Source Document → Facts → [Human Lock] → AI Generation → Output
                                                              ↑
                                              NEVER feeds back here
```

When writing any generation code, ensure that `output.content` is never written to the `Fact` table or `ContentSpine.facts` without explicit human action.

---

## 6. TypeScript Rules

- All server files must be `.ts` — no `.js` files in `server/src/`
- All client files must be `.tsx` or `.ts` — no `.jsx` or `.js`
- `tsc --noEmit` must pass with zero errors before any commit
- Avoid `any` types except in narrow error catch blocks

```typescript
// ✅ Acceptable
} catch (err: any) {
  const message = err?.message || 'Unknown error';
}

// ❌ Wrong
const data: any = response;
data.something.deeply.nested; // no type safety
```

---

## 7. File Upload Rules

Uploads are validated by `validateUploadFile` middleware before the controller sees them:
- MIME type must be in the allowlist
- Filenames are sanitized to `[a-zA-Z0-9_.\-]` characters
- Size limits: 50 MB (projects), 20 MB (resumes)

Never bypass `validateUploadFile` on upload routes.

---

## 8. Frontend State Rules

- All API calls go through `client/src/services/apiClient.ts` — no inline `fetch()` calls in components
- Project state is managed by `client/src/hooks/useProject.ts`
- Route state is managed by `useState` in `App.tsx` — there is no react-router

---

## 9. Documentation Rules

- The codebase is the primary source of truth
- Never document a feature as implemented if the code does not implement it
- Mark planned features as `🔲 Planned` — not as complete
- Never include real secrets in documentation
- Use `<placeholder>` syntax for secret values in docs

---

## 10. Commit Message Format

```
type(scope): description

Examples:
fix(db): remove localhost fallback in production config
feat(resume): add ATS Scanner 9-dimension scoring
chore: update server .env to Neon PostgreSQL
docs: update ARCHITECTURE.md to reflect current codebase
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`
