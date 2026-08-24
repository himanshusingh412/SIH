# Coding Rules & Conventions — ContentSpine AI

## 1. General Principles
* **Strict TypeScript**: No explicit `any` types in core domain contracts; maintain full type definitions in `server/src/types/index.ts` and `client/src/types.ts`.
* **No Symptom Masking**: Never resolve bugs by wrapping broken calls in empty `try/catch` or returning empty default fallback buffers. Trace upstream root causes.
* **Preserve API Contracts**: All REST endpoints return `{ success: true, data }` or `{ success: false, error: { message } }`.

---

## 2. Frontend Conventions (React / TypeScript)
* **Functional Components**: Use `React.FC<Props>` or named export functions.
* **Hooks Scoping**: Keep state localized to custom hooks (e.g. `useProject.ts`).
* **Explicit Click Handlers**: Attach explicit `e.stopPropagation()` when triggering nested toggles inside list items.
* **Component File Naming**: `PascalCase.tsx` in `client/src/components/`.

---

## 3. Backend Conventions (Node.js / Express / Prisma)
* **Layered Architecture**:
  ```
  routes/ → controllers/ → services/ → repositories/ → prisma/
  ```
* **Controllers**: Extract URL parameters via `getParam(req.params.id)` and validate inputs before invoking services.
* **Repositories**: Enforce async Prisma queries with clean include scopes (`facts`, `references`, `outputs`).
* **Async Error Propagation**: Always pass errors to Express `next(err)` or return `sendError(res, message, status)`.
