# Security — ContentSpine AI

## Principles

1. **API keys are server-side only** — never in client code, browser storage, or `VITE_*` env vars
2. **Database credentials never leave the server** — `DATABASE_URL` is never returned in responses
3. **Errors are sanitized** — Prisma connection errors return structured JSON without host/port details
4. **Input is validated** — file uploads are filtered by MIME type and size before processing
5. **Secrets are never committed** — `server/.env` is in `.gitignore`

---

## Implemented Controls

### Rate Limiting

- **Limit:** 120 requests/minute per client IP
- **Implementation:** In-memory `Map` in `server/src/middleware/security.ts`
- **Response when exceeded:** HTTP 429 + `Retry-After` header
- **Scope:** All Express routes

> For higher-scale production, swap the in-memory store for Redis.

---

### Security Headers

Set on all responses by `securityHeaders` middleware:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |

---

### File Upload Security

Enforced by `validateUploadFile` middleware:

**Allowed MIME types:**
- `application/pdf`
- `text/plain`, `text/markdown`, `application/json`
- `image/jpeg`, `image/png`, `image/webp`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Filename sanitization:** Characters not matching `[a-zA-Z0-9_.\-]` are replaced with `_`.

**Size limits:**
- Source documents: 50 MB
- Resume uploads: 20 MB

---

### Database Error Sanitization

`server/src/middleware/errorHandler.ts` catches Prisma errors and returns:

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Database connection unavailable. Please verify production configuration."
  }
}
```

Internal connection details (host, port, user, password) are **never** included in HTTP responses.

---

### AI Key Protection

- `AI_API_KEY` is read from `process.env` on the server
- It is never returned in any API response
- It is never embedded in client-side code or Vite build output
- All Gemini calls originate from `server/src/ai/providers/geminiProvider.ts`

---

### Input Sanitization

`sanitizeInputText()` in `security.ts` strips `<script>` tags and `javascript:` protocol strings from text inputs before AI processing.

---

### Gemini Rate Limit Handling

When Gemini returns HTTP 429:
- The server returns `GEMINI_RATE_LIMITED` (not a generic 500)
- `retryAfterSeconds` is included in the response
- The UI shows the real rate-limit state — it does **not** silently fall back to Mock AI
- Duplicate requests within the rate-limit window are blocked at the provider health service layer

---

## What Must Never Happen

| ❌ Never Do | ✅ Do Instead |
|---|---|
| Return `DATABASE_URL` in API response | Return `DATABASE_UNAVAILABLE` code |
| Store `AI_API_KEY` in `VITE_*` variable | Keep in `process.env` server-side |
| Commit `server/.env` to git | Use `.gitignore` (already configured) |
| Use `localhost:5432` in production | Use Neon `DATABASE_URL` |
| Log full Prisma error stack to HTTP response | Sanitize to structured JSON |
| Return raw PDF binary syntax to client | Use `pdfSanitizer.ts` to strip internals |
| Fallback to Mock AI on Gemini 429 | Return `GEMINI_RATE_LIMITED` with retry delay |

---

## Planned Security Improvements 🔲

| Improvement | Priority |
|---|---|
| Replace in-memory rate limiter with Redis | Medium |
| Add authentication (JWT or session) to protect per-user data | High |
| Add Content Security Policy (CSP) header | Medium |
| Add Helmet.js for comprehensive header hardening | Low |
| Implement project-level authorization (user can only access own projects) | High |
| Add OWASP dependency audit to CI | Low |
