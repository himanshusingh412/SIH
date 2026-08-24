# Security Architecture & Production Hardening — ContentSpine AI

## 1. Implemented Security Controls

### 1.1 Secret & Environment Variable Protection
* All sensitive credentials (API keys, DB connection strings) are stored in `.env` files and excluded from version control via `.gitignore`.
* `server/.env.example` provides clean parameter documentation without exposing secrets.

### 1.2 Input Sanitization & Path Traversal Evasion
* User-submitted text input is sanitized to strip script tags and javascript execution triggers (`server/src/middleware/security.ts`).
* Uploaded filenames are sanitized (`filename.replace(/[^a-zA-Z0-9_.\-]/g, '_')`) to prevent path traversal vulnerability attacks.

### 1.3 Upload File Validation & Size Limits
* Uploads are processed in-memory via Multer with strict 50MB file size limits.
* MIME-type whitelist enforcement: PDF, TXT, MD, JSON, PNG, JPG, WEBP, DOCX.

### 1.4 Security Headers
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY`
* `X-XSS-Protection: 1; mode=block`
* `Referrer-Policy: strict-origin-when-cross-origin`

### 1.5 Rate Limiting
* Sliding-window IP rate limiter (`120 req/min/IP`) protects against brute force and Denial of Service (DoS) attempts.

---

## 2. Production Security Recommendations
1. **HTTPS / TLS Termination**: Deploy behind Nginx or Cloudflare with SSL certificates.
2. **Redis Rate Limiting**: Swap in-memory rate limiter for a distributed Redis rate limiter store when scaling across multiple instances.
3. **Database Encryption**: Enforce TLS encryption on PostgreSQL database connections (`sslmode=require`).
