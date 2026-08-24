# UI/UX & Design System Guidelines — ContentSpine AI

## 1. Aesthetic Character & Principles
* **Enterprise / Government Grade**: Authoritative, clean, dense, modern, and trustworthy.
* **Non-Chatbot Interface**: Dedicated multi-pane analytical workspace instead of a linear chat log.
* **Glassmorphism Theme**: Dark slate background (`#0b0f19`) with translucent glass panels (`backdrop-filter: blur(12px)`).

---

## 2. Color Palette & CSS Tokens

```css
:root {
  /* Backgrounds */
  --bg-dark: #0b0f19;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-card-hover: rgba(255, 255, 255, 0.06);

  /* Glass Panels */
  --glass-bg: rgba(17, 24, 39, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* Primary & Accent Colors */
  --accent-primary: #6366f1;   /* Indigo-500 */
  --accent-indigo: #818cf8;    /* Indigo-400 */
  --accent-emerald: #10b981;   /* Emerald-500 (Fact Lock Verified) */
  --accent-amber: #f59e0b;     /* Amber-500 (Warning) */
  --accent-rose: #f43f5e;      /* Rose-500 (Discrepancy Error) */
  --accent-sky: #38bdf8;       /* Sky-400 (Source Trace) */

  /* Typography */
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 3. Component Specs

### 3.1 Glass Panels (`.glass-panel`)
* `background: rgba(17, 24, 39, 0.7)`
* `backdrop-filter: blur(12px)`
* `border: 1px solid rgba(255, 255, 255, 0.08)`
* `border-radius: 12px`

### 3.2 Badges (`.badge`)
* `.badge-emerald`: `background: rgba(16, 185, 129, 0.2); color: #6ee7b7` (Fact Lock Verified)
* `.badge-indigo`: `background: rgba(99, 102, 241, 0.2); color: #a5b4fc` (Profile)
* `.badge-amber`: `background: rgba(245, 158, 11, 0.2); color: #fcd34d` (Warning)
* `.badge-rose`: `background: rgba(244, 63, 94, 0.2); color: #fda4af` (Discrepancy Error)

---

## 4. Typography Hierarchy
* **App Title**: `1.4rem`, `font-weight: 800`, gradient background clip.
* **Section Headers**: `1.1rem`, `font-weight: 700`, `color: white`.
* **Body Text**: `0.9rem`, `line-height: 1.7`, `color: #e2e8f0`.
* **Fact Lock Values**: `font-family: var(--font-mono)`, `font-weight: 700`, `color: #38bdf8`.
