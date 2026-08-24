# Tech Stack & Architectural Justification — ContentSpine AI

## 1. Core Frameworks & Runtime

| Layer | Technology | Version | Rationale & Justification |
|---|---|---|---|
| **Frontend Framework** | React | 18.3.1 | Declarative component model, fast virtual DOM rendering for complex 3-pane workspaces. |
| **Frontend Build Tool** | Vite | 5.4.10 | Instant Hot Module Replacement (HMR) and fast production bundle optimization. |
| **Language** | TypeScript | 5.6.3 | Strict end-to-end type safety between API interfaces, database models, and React props. |
| **Styling** | Vanilla CSS (CSS Variables) | Custom | Zero dependency overhead, maximum control over glassmorphism tokens, dark theme, and fluid responsive layouts. |
| **Icons** | Lucide React | 0.454.0 | Lightweight, accessible SVG icon library for UI controls and format badges. |
| **Backend Runtime** | Node.js | v18+ | High concurrency asynchronous I/O for handling document processing and multi-output AI requests. |
| **Backend Framework** | Express | 4.21.1 | Robust, lightweight REST API routing, middleware pipeline, and error handling. |
| **Database ORM** | Prisma | 5.22.0 | Type-safe SQL query builder, auto-generated TypeScript client, and seamless database migrations. |
| **Database** | SQLite / PostgreSQL | 3.x / 15+ | Embedded SQLite for zero-config offline SIH judge demo; PostgreSQL-ready schema for production deployment. |
| **File Uploads** | Multer | 1.4.5 | Multipart form-data handling with memory storage and 50MB size limit controls. |

---

## 2. Key Libraries & Utilities

* **`dotenv`**: Environment configuration management.
* **`cors`**: Cross-Origin Resource Sharing control.
* **`ts-node` / `tsx`**: Development execution for TypeScript files.

---

## 3. Why Vanilla CSS instead of Tailwind?
* **Design Taste & Control**: Custom HSL color design tokens, custom glassmorphism backdrop filters (`backdrop-filter: blur(12px)`), and precise 3-pane grid height math (`calc(100vh - 140px)`).
* **Zero Build Pipeline Dependencies**: Ensures instant stylesheet loading and zero class collision risks.
