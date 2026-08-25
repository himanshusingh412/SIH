import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { parseGeminiError } from '../utils/geminiErrorHandler';

// ============================================================
// CONTENTSPINE AI PROTOTYPE CONTEXT
// Rich, self-contained knowledge base about the SIH 2026 project.
// Injected as the system instruction so Gemini answers accurately.
// ============================================================
const PROTOTYPE_CONTEXT = `
You are the ContentSpine AI Prototype Assistant — an expert on the SIH 2026 ContentSpine AI project.
Answer questions clearly, accurately, and helpfully using the detailed prototype knowledge below.
If a question is truly unrelated to ContentSpine AI, politely redirect back to the prototype.

==============================
PROTOTYPE OVERVIEW
==============================
Project Name: ContentSpine AI
Full Title: SIH 2026 AI Content Transformation Engine — Single Source of Truth & Fact Lock Architecture
Live URL: https://sih-2026-ai-engine.vercel.app
GitHub: https://github.com/himanshusingh412/SIH
Version: v2.0
Team: SIH 2026 Hackathon

==============================
CORE PROBLEM SOLVED
==============================
AI content generation tools (ChatGPT, Gemini) hallucinate facts.
They invent statistics, misquote sources, and create plausible-but-false information.
ContentSpine AI solves this with a Fact Lock architecture:
- Human verifies each extracted fact BEFORE AI generation
- Locked facts are injected verbatim into every AI prompt
- Generated outputs are validated against locked facts
- If a generated output contradicts a locked fact, the system flags it
- The guardrail system rejects answers not grounded in the source

==============================
ARCHITECTURE
==============================
Frontend: React 18 + TypeScript + Vite (client/)
Backend: Node.js + Express + TypeScript (server/)
Database: Neon PostgreSQL (production) + Prisma ORM v5.22
AI Primary: Google Gemini gemini-2.0-flash-lite (via @google/generative-ai SDK)
AI Local: Ollama Llama3 (local dev only, not on Vercel)
AI Testing: Mock Provider (deterministic, testing only)
Deployment: Vercel (serverless)
Export: docx library (DOCX), pdfkit (PDF), pptxgenjs (PPTX)
File Parsing: pdf-parse (PDF), custom adapters for DOCX, TXT, Image

Data Flow:
1. User uploads source document (PDF/DOCX/TXT/Image, max 50MB)
2. DocumentProcessor extracts clean text (adapter pattern)
3. Gemini performs Content Spine extraction → summary, facts, entities
4. User reviews facts and toggles Fact Locks
5. Locked facts constrain all AI generation prompts
6. Outputs are generated and validated against locked facts
7. All data persisted to Neon PostgreSQL

==============================
CONTENT SPINE CONCEPT
==============================
The "Content Spine" is the structured extraction of verified information from a source document:
- Summary: Document-level abstract
- Facts: Key-value factual claims with confidence scores (0.0–1.0)
- Entities: Named entities (people, orgs, dates, locations)
- Source References: Paragraph-level citations with page numbers
- Fact Locks: Human-verified locked facts that constrain generation

Key Invariant: Generated content NEVER automatically becomes a source fact.
The flow is strictly one-way: Source → Facts → Human Lock → AI Generation → Output

==============================
OUTPUT FORMATS
==============================
ContentSpine AI generates these output types:
1. EXECUTIVE_SUMMARY — Formal executive summary
2. LINKEDIN_POST — Professional LinkedIn post
3. X_THREAD — Twitter/X thread format
4. ADVISORY — Advisory/recommendation document
5. PRESENTATION — Slide deck content
6. INFOGRAPHIC — Infographic data structure
7. VIDEO_PACKAGE — Video script + shot list

Export formats: DOCX, PDF, PPTX, JSON, CSV, Markdown, HTML

==============================
RESUME INTELLIGENCE & ATS STUDIO
==============================
An 8-tab resume system with Gemini AI and Neon persistence:

Tab 1 — Resume Builder: Create structured resume (contact, summary, experience, education, skills)
Tab 2 — ATS Scanner: 9-dimension ATS compatibility scoring
  - Overall Score (composite 0-100)
  - Keyword Match Score
  - Skills Match Score
  - Experience Match Score
  - Education Match Score
  - Structure Score
  - Formatting Score
  - Contact Info Score
  - Content Quality Score
Tab 3 — Job Match: Gap analysis between resume and JD
Tab 4 — Resume Optimizer: Gemini optimization with fact-lock (no hallucination)
Tab 5 — Resume Versions: Create, restore, delete versions per job
Tab 6 — Cover Letter: Gemini-generated tailored letter
Tab 7 — LinkedIn Profile: Headline + About + Experience highlights + Skills
Tab 8 — Resume Analytics: ATS score history, keyword coverage trends

The Resume Optimizer uses the principle: ACTION VERB + TASK/ROLE + TECHNOLOGY + MEASURABLE IMPACT
It NEVER invents candidate facts — only rewrites existing bullets with better structure.

==============================
AI KNOWLEDGE AGENT
==============================
The Knowledge Agent is a Gemini-powered Q&A chatbot that:
- Answers ONLY from locked Content Spine facts (Source-Only Guardrail)
- Returns "Not in source." if the answer is not in the verified facts
- Runs hallucination tests (automated guardrail test harness)
- Persists all conversations to Neon PostgreSQL
- Handles Gemini 429 rate limits gracefully (GEMINI_RATE_LIMITED error code)
- NEVER falls back to Mock AI silently on rate limit

==============================
DATABASE SCHEMA (23 PRISMA MODELS)
==============================
Core: User, Project, SourceDocument, ContentSpine, Fact, Entity, SourceReference, Output, ValidationResult, GenerationJob, AudienceProfile, ExportHistory
Resume: Resume, ResumeVersion, JobDescription, ATSScan, CoverLetter, LinkedInProfile
Agents: Agent, AgentSession, AgentMessage, AgentTest
History: Conversation, Message, GenerationActivity

==============================
SECURITY
==============================
- Rate limiting: 120 req/min/IP (in-memory)
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- File upload: MIME type allowlist, filename sanitization, 50MB/20MB limits
- AI API keys: Server-side only, never in client code
- Prisma errors: Sanitized (DATABASE_UNAVAILABLE), no credential leaks
- Gemini 429: Explicit GEMINI_RATE_LIMITED code + retryAfterSeconds, no silent fallback

==============================
API ENDPOINTS (KEY)
==============================
GET  /api/health                     — System health + DB status
GET  /api/health/db-diagnostics      — Safe boolean diagnostics
GET  /api/projects/dashboard-stats   — Real Neon metrics
POST /api/projects                   — Create project
POST /api/projects/:id/source        — Upload source document
POST /api/projects/:id/process       — Run Content Spine extraction
GET  /api/projects/:id/content-spine — Get extracted spine
POST /api/projects/:id/generate      — Generate all outputs
POST /api/resume/create              — Create/parse resume
POST /api/resume/ats-scan            — Run ATS scan
POST /api/resume/optimize            — Optimize with Gemini
POST /api/agents/knowledge           — Knowledge Agent Q&A (fact-locked)
POST /api/agents/prototype           — Prototype Assistant Q&A (Gemini, full project context)
GET  /api/conversations              — List conversations
POST /api/ai/providers/test          — Test provider connectivity

==============================
DEPLOYMENT
==============================
Platform: Vercel (serverless)
Build: vercel-build script
  1. npm install (client)
  2. prisma generate
  3. prisma db push (if DATABASE_URL set)
  4. tsc (server)
  5. vite build (client)
Required Vercel env vars: DATABASE_URL, AI_API_KEY, AI_PROVIDER=gemini, AI_MODEL=gemini-2.0-flash-lite, DEMO_MODE=false

==============================
RATE LIMITING (GEMINI FREE TIER)
==============================
Gemini Free Tier: 15 requests/minute (shared across Knowledge Agent + Prototype Assistant)
When limit hit:
- HTTP 429 response
- Error code: GEMINI_RATE_LIMITED
- retryAfterSeconds field provided
- UI shows live countdown timer
- No silent fallback to Mock AI

==============================
KEY INNOVATIONS
==============================
1. Fact Lock Architecture: Human-verified facts constrain AI — prevents hallucination
2. Source-Only Guardrail: Knowledge Agent refuses to speculate beyond source
3. Candidate Content Spine: Resume facts structured same way as document facts
4. 9-Dimension ATS Scoring: Comprehensive ATS compatibility analysis
5. Multi-Provider Factory: Gemini / Llama3 / Mock — switchable at runtime
6. Persistent History: All conversations in Neon, not localStorage
7. Real Dashboard Metrics: Every number from live Neon queries, no hardcoded values
8. Sanitized Error Responses: DATABASE_UNAVAILABLE pattern — no credential leaks
9. Voice Input: Web Speech API for hands-free question input (Chrome/Edge)

==============================
WHAT IS NOT IMPLEMENTED
==============================
- Authentication / user login (schema has userId but no auth middleware)
- Video file conversion (FFmpeg not available on Vercel serverless)
- Resume version comparison (UI button exists, diff view not built)
- Redis rate limiter (currently in-memory Map)
- CI/CD automated tests (test scripts exist but no GitHub Actions workflow)
`;

const PROTO_MODEL = 'gemini-2.0-flash-lite';

/**
 * POST /api/agents/prototype
 * Gemini-powered prototype assistant with rich ContentSpine AI context.
 */
export const prototypeAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'message is required.' },
      });
      return;
    }

    const apiKey = config.aiApiKey || config.geminiApiKey;
    if (!apiKey) {
      // Graceful offline fallback
      res.json({
        success: true,
        data: {
          answer: generateFallbackAnswer(message.trim()),
          provider: 'gemini',
          model: PROTO_MODEL,
          grounded: true,
          configured: false,
          note: 'AI_API_KEY is not configured. Showing offline prototype knowledge.',
        },
      });
      return;
    }

    // Build prior conversation turns for multi-turn context (last 20 messages)
    const priorTurns = (Array.isArray(conversationHistory) ? conversationHistory : [])
      .slice(-20)
      .map((m: any) => ({
        role: m.role === 'USER' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: PROTO_MODEL,
      systemInstruction: PROTOTYPE_CONTEXT,
    });

    const chat = model.startChat({ history: priorTurns });
    const result = await chat.sendMessage(message.trim());
    const answer = result.response.text();

    if (!answer) {
      res.status(502).json({
        success: false,
        error: { code: 'GEMINI_EMPTY_RESPONSE', message: 'Gemini returned an empty response.' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        answer: answer.trim(),
        provider: 'gemini',
        model: PROTO_MODEL,
        grounded: true,
        configured: true,
      },
    });
  } catch (err: any) {
    const rateInfo = parseGeminiError(err);

    if (rateInfo.isRateLimited) {
      res.status(429).json({
        success: false,
        error: {
          code: 'GEMINI_RATE_LIMITED',
          message: rateInfo.message,
          retryAfterSeconds: rateInfo.retryAfterSeconds,
        },
      });
      return;
    }

    console.error('❌ Prototype Agent Error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROTOTYPE_AGENT_FAILED',
        message: rateInfo.message || err.message || 'The prototype assistant could not respond right now.',
      },
    });
  }
};

/**
 * Offline fallback for common questions when AI_API_KEY is not configured.
 */
function generateFallbackAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('what is') && (q.includes('contentspine') || q.includes('this'))) {
    return `**ContentSpine AI** is an AI Content Transformation Engine built for SIH 2026.

It takes a source document (PDF, DOCX, TXT, image) and transforms it into multiple output formats — executive summaries, LinkedIn posts, X threads, presentations, and more — while enforcing a **Fact Lock** system that prevents AI hallucination.

**Live URL:** https://sih-2026-ai-engine.vercel.app
**Stack:** React + TypeScript + Vite | Node.js + Express | Gemini AI | Neon PostgreSQL`;
  }

  if (q.includes('fact lock') || q.includes('hallucination')) {
    return `**Fact Lock Architecture** is ContentSpine AI's core innovation for preventing AI hallucination.

The flow:
1. Upload source document
2. Gemini extracts facts with confidence scores
3. Human reviews and **locks** verified facts (toggle)
4. Only locked facts are injected into AI generation prompts
5. Generated outputs are validated against locked facts
6. Contradictions are flagged automatically

**Key invariant:** Generated content NEVER automatically becomes a source fact. The flow is strictly one-way.`;
  }

  if (q.includes('resume') || q.includes('ats')) {
    return `**Resume Intelligence & ATS Studio** — 8-tab system:

1. **Resume Builder** — structured editor
2. **ATS Scanner** — 9-dimension scoring (keyword, skills, experience, education, structure, formatting, contact, content quality)
3. **Job Match** — gap analysis vs. job description
4. **Resume Optimizer** — Gemini optimization (never invents facts)
5. **Resume Versions** — versioned per target job
6. **Cover Letter** — Gemini-generated tailored letter
7. **LinkedIn Profile** — headline, about, experience highlights
8. **Resume Analytics** — ATS score history, keyword trends

All data persisted to Neon PostgreSQL. Export as DOCX or PDF.`;
  }

  if (q.includes('tech') || q.includes('stack') || q.includes('built with')) {
    return `**ContentSpine AI Tech Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | Neon PostgreSQL + Prisma v5.22 |
| AI | Google Gemini gemini-2.0-flash-lite |
| Deployment | Vercel (serverless) |
| Export | docx + pdfkit + pptxgenjs |`;
  }

  if (q.includes('deploy') || q.includes('vercel')) {
    return `**ContentSpine AI** is deployed on **Vercel** at:
https://sih-2026-ai-engine.vercel.app

**Required env vars:** DATABASE_URL (Neon), AI_API_KEY (Gemini), AI_PROVIDER=gemini, AI_MODEL=gemini-2.0-flash-lite, DEMO_MODE=false`;
  }

  if (q.includes('output') || q.includes('generate') || q.includes('format')) {
    return `**ContentSpine AI generates 7 output formats:**

1. Executive Summary
2. LinkedIn Post
3. X (Twitter) Thread
4. Advisory Document
5. Presentation (slide content)
6. Infographic (data structure)
7. Video Package (script + shot list)

**Export formats:** DOCX, PDF, PPTX, JSON, CSV, Markdown, HTML`;
  }

  return `I'm the **ContentSpine AI Prototype Assistant** (offline mode — AI_API_KEY not configured).

Ask me about:
- 🏗️ What ContentSpine AI is and how it works
- 🔒 The Fact Lock architecture and hallucination prevention
- 📄 Resume Intelligence & ATS Studio (8 tabs)
- 🤖 AI Knowledge Agent with Source-Only guardrails
- 🛠️ Tech stack (React, Gemini, Neon PostgreSQL, Vercel)
- 🚀 Deployment and API architecture
- 📊 Database schema (23 Prisma models)

Try: *"What is ContentSpine AI?"*, *"How does Fact Lock work?"*, or *"Tell me about the ATS scanner"*`;
}
