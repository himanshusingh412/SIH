# User Flow — ContentSpine AI

## Primary Flow: Content Transformation

```
1. Open Application
        ↓
2. Dashboard (real Neon metrics)
        ↓
3. Click "Start New Transformation"
        ↓
4. Upload Stage
   Upload: PDF / DOCX / TXT / Image (max 50 MB)
   OR paste raw text
        ↓
5. Processing Screen
   POST /api/projects/:id/source
   → DocumentProcessor → Adapter selection → Text extraction
   → POST /api/projects/:id/process
   → Gemini extractContentSpine()
        ↓
6. Content Spine Viewer
   Review extracted facts
   Toggle Fact Locks (lock verified facts, unlock uncertain ones)
   Review entities + source references
        ↓
7. Config Screen
   Select output types:
   ✓ Executive Summary
   ✓ LinkedIn Post
   ✓ X Thread
   ✓ Advisory
   ✓ Presentation
   ✓ Infographic
   ✓ Video Package
   Set audience profile
        ↓
8. Generation Progress Screen
   POST /api/projects/:id/generate
   → Each output generated using only locked facts
   → Validation run against locked facts
        ↓
9. Review Workspace (3-Pane)
   Left:   Source document text
   Center: Content Spine + locked facts
   Right:  Generated outputs + validation scores
        ↓
10. Export
    Select format: DOCX / PDF / PPTX / Data
    Download generated file
```

---

## Resume Studio Flow

```
1. Sidebar → Resume Studio
        ↓
2. Tab 1 — Resume Builder
   Fill in: contact info, summary, experience, education, skills, etc.
   Save → POST /api/resume/save → Neon (Resume model)
        ↓
3. Tab 2 — ATS Scanner
   Paste job description
   POST /api/resume/ats-scan
   → jobSpine.ts → ATS Engine → Gemini analysis
   → 9-dimension score + keyword table + missing keywords
        ↓
4. Tab 3 — Job Match
   Review match analysis
   See requirement gaps and recommendations
        ↓
5. Tab 4 — Resume Optimizer
   POST /api/resume/optimize
   → candidateSpine.ts + jobSpine.ts → Gemini
   → resumeFactLock.ts validation (no hallucination)
   → Optimized bullets returned
        ↓
6. Tab 5 — Resume Versions
   Save current state as named version
   POST /api/resume/:id/versions → Neon (ResumeVersion)
   Browse, restore, or delete past versions
        ↓
7. Tab 6 — Cover Letter
   POST /api/resume/cover-letter
   → Gemini generates tailored letter
   → Neon (CoverLetter)
        ↓
8. Tab 7 — LinkedIn Profile
   POST /api/resume/linkedin
   → Gemini generates headline + about + experience highlights + skills
   → Neon (LinkedInProfile)
        ↓
9. Tab 8 — Resume Analytics
   GET /api/resume/:id/analytics
   → ATS score history, keyword coverage, optimization history
        ↓
10. Export
    GET /api/resume/:id/export/docx → binary DOCX
    GET /api/resume/:id/export/pdf  → binary PDF
```

---

## Knowledge Agent Flow

```
1. Sidebar → AI Agents
        ↓
2. Knowledge Agent UI loads
   GET /api/projects/:id/content-spine → locked facts count
        ↓
3. Zero-facts guardrail check
   If no facts locked → agent refuses to answer
   "Please lock at least one fact to activate the agent."
        ↓
4. User types question in chat
        ↓
5. POST /api/agents/knowledge
   { message, projectId, conversationId }
        ↓
6. Server:
   Load locked facts from Neon
   Build system prompt: "Answer only from these verified facts: ..."
   Call Gemini with grounded prompt
        ↓
7. Gemini response
   → Grounded answer with source citations
   OR → "Not in source." if question exceeds available facts
        ↓
8. Message persisted to Neon (Conversation + Message models)
        ↓
9. Response displayed with source citations
        ↓
10. Gemini 429 case:
    Server returns GEMINI_RATE_LIMITED
    UI shows: "Rate limited. Retry in X seconds."
    (No silent fallback to Mock AI)
```

---

## History Flow

```
1. Sidebar → History
        ↓
2. GET /api/conversations
   → List all conversations from Neon
        ↓
3. Click conversation → GET /api/conversations/:id
   → Load messages
        ↓
4. Rename conversation → PATCH /api/conversations/:id
        ↓
5. Delete conversation → DELETE /api/conversations/:id
   → Cascades to Messages in Neon
```

---

## Settings Flow

```
1. Sidebar → Settings
        ↓
2. Provider selector:
   • Google Gemini (gemini-3.1-flash-lite) — Production default ✅
   • OpenAI GPT-4o — Requires OPENAI_API_KEY (not configured in production)
   • Mock AI — Testing only
        ↓
3. Select provider → POST /api/ai/providers/test → connectivity test
        ↓
4. Active provider shown in Header badge
```

---

## Error States

| Scenario | UI Behavior |
|---|---|
| Gemini 429 | "Rate limited. Retry in X seconds." — no fake responses |
| Database unavailable | "Service temporarily unavailable" — structured error from `/api/health` |
| Upload MIME rejected | "Unsupported file type" inline error |
| File too large | multer size limit error |
| PDF binary syntax in source | `pdfSanitizer.ts` strips all non-text content before display |
| No facts locked (agent) | Agent refuses to respond with guardrail message |
