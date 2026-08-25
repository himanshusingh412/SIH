# ContentSpine AI — Gen AI Platform for Automated Content Transformation

> **Smart India Hackathon (SIH) 2026** | **Problem Statement:** 26154  
> **Theme:** Smart Automation | **Category:** Software  
> **Team:** PHI Tech | **Team ID:** 373  
> **Live Production Application:** [https://sih-2026-ai-engine.vercel.app](https://sih-2026-ai-engine.vercel.app)  
> **GitHub Repository:** [https://github.com/himanshusingh412/SIH](https://github.com/himanshusingh412/SIH)

---

## 1. Project Overview

**ContentSpine AI** is a production-grade Enterprise Generative AI Platform engineered for **automated, fact-locked content transformation**. It takes unstructured, multi-modal source documents (PDFs, Word DOCX files, plain text, or uploaded resumes) and transforms them into verified, multi-channel deliverables—such as Executive Summaries, LinkedIn Posts, X/Twitter Threads, Advisory Notes, PowerPoint Presentations, Infographic Summaries, and ATS-Optimized Resumes.

Unlike generic AI wrappers that hallucinate facts or lose context across channels, ContentSpine AI enforces a **Zero-Hallucination Fact Lock Protocol**. Grounded in a centralized **Content Spine** schema, the system guarantees 100% factual fidelity between the original source document and all derivative outputs.

---

## 2. SIH Problem Statement Details

- **Problem Statement ID:** 26154
- **Problem Statement Title:** Smart Automation for High-Fidelity Enterprise Content Extraction and Multi-Channel Generation
- **Theme:** Smart Automation
- **Category:** Software
- **Team Name:** PHI Tech
- **Team ID:** 373

---

## 3. The Problem

Enterprise organizations, professionals, and job applicants struggle with:

1. **Information Fragmentation:** Critical information is trapped inside unorganized PDFs, Word documents, and raw text files.
2. **AI Hallucinations:** Commercial LLMs often invent facts, metrics, employment dates, company names, or technical accomplishments when summarizing or transforming documents.
3. **Multi-Channel Overhead:** Adapting a single core document for multiple platforms (e.g. corporate summaries, social channels, presentation decks, or ATS resumes) requires hours of manual editing.
4. **Applicant Tracking System (ATS) Rejections:** Over 75% of qualified job seekers are rejected by automated ATS screeners due to formatting errors, missing keywords, or poor bullet structure.

---

## 4. The Solution

ContentSpine AI solves these challenges by combining **deterministic document parsing**, **structured Content Spine extraction**, **Fact-Locked Gemini AI generation**, an automated **Consistency Validator**, and a **Resume Intelligence & ATS Studio**.

```
Source Document / Resume
        ↓
Ingestion & Text Parsing (pdf-parse / multer / docx)
        ↓
Content Spine Extraction (JSON Fact Normalization)
        ↓
Fact Lock Security Layer (Human Verification & Traceability)
        ↓
Multi-Channel Generation (Gemini 3.1 Flash Lite)
        ↓
Consistency Validator & 3-Retry Auto-Fix Loop
        ↓
Export (Word .docx, PDF, Copyable Formats)
```

---

## 5. Core Idea & Architectural Innovations

1. **Content Spine Protocol:** Converts any input document into a canonical JSON representation containing extracted claims, entities, statistics, key topics, and structural metadata.
2. **Fact Lock Layer:** Locks verified facts into the system state before content generation begins, preventing downstream AI models from fabricating numbers or dates.
3. **Consistency Validator & 3-Retry Loop:** Automatically audits generated outputs against the original Content Spine. If an output fails the 90%+ consistency threshold, the platform executes up to 3 automatic re-prompts with diagnostic feedback.
4. **Resume Studio Dual Entry Path:** Enables candidates to either **Build Resumes Manually** or **Upload Existing Resumes (PDF, DOCX, TXT)** with real text parsing, section detection, and 8-dimension ATS scanning.

---

## 6. Key Features & Capabilities

### A. General Content Transformation Studio
- **Multi-File Ingestion:** PDF, DOCX, TXT, MD, and image uploads (up to 50MB).
- **3-Pane Review Workspace:** Simultaneous view of Source Text ↔ Extracted Content Spine ↔ Multi-Format Generated Outputs.
- **7 Output Channels:** Executive Summaries, LinkedIn Posts, X/Twitter Threads, Advisory Notes, PowerPoint Outlines, Infographics, Video Scripts.
- **Real Brand Logos:** Integrated vector marks for LinkedIn (`#0A66C2`), X (`#000000`), Word, PDF, PowerPoint, and Excel.

### B. Resume Intelligence & ATS Studio
- **Dual Entry Path:** Choice between **Build Resume Manually** or **Upload Existing Resume (PDF, DOCX, TXT)**.
- **Import Review UX:** Interactive modal showing detected sections (Personal Info, Summary, Experience, Education, Skills, Projects) with status badges (`✓ Verified`, `⚠ Needs Review`, `Missing`) before saving.
- **8-Dimension ATS Scanner:** Computes real multidimensional scores across Keyword Match, Skills Alignment, Title Fit, Format Risk, Section Completeness, Missing Keywords, Experience Relevance, and Education Match.
- **Job Match Engine:** Semantic alignment comparison between candidate resume and job descriptions.
- **Fact-Locked Resume Optimizer:** Enhances action verbs and keyword placement without hallucinating employment dates, companies, or fake metrics.
- **Resume Versions & History:** Full state snapshot persistence in Neon PostgreSQL with one-click restore.
- **Targeted Cover Letters & LinkedIn Assets:** Generates grounded cover letters and optimized LinkedIn profiles.
- **Document Export:** Exports customized resumes directly to Word `.docx` and PDF `.pdf`.

---

## 7. Platform Workflow & System Flowchart

### Platform Architecture & Data Pipeline

```mermaid
flowchart TD
    A[User Document / Resume Upload] --> B[File Ingestion Engine]
    B --> C{File Type?}
    C -- PDF --> D[pdf-parse Extraction]
    C -- DOCX --> E[Docx Text Extractor]
    C -- TXT --> F[UTF-8 Text Stream]
    
    D --> G[Raw Text Normalizer]
    E --> G
    F --> G
    
    G --> H[Gemini Content Spine Generator]
    H --> I[Content Spine JSON]
    I --> J[Fact Lock Protocol]
    
    J --> K[Import Review Screen]
    K -->|User Confirms| L[(Neon PostgreSQL Database)]
    
    L --> M[Multi-Channel Engines]
    M --> N[Executive Summary]
    M --> O[LinkedIn Post]
    M --> P[X Thread]
    M --> Q[8-Dimension ATS Scanner]
    M --> R[Fact-Locked Resume Optimizer]
    
    Q --> S[Consistency Validator]
    R --> S
    S -->|Consistency < 90%| T[3-Retry Auto-Fix Loop]
    T --> M
    S -->|Consistency >= 90%| U[Verified Output & Export DOCX/PDF]
```

---

## 8. Direct Resume Upload Workflow

```mermaid
flowchart TD
    A[User Clicks Upload Existing Resume] --> B[Modal & Dropzone Appears]
    B --> C[Select PDF / DOCX / TXT File]
    C --> D{Validate Format & Size <= 20MB}
    D -- Invalid --> E[Show Error Alert]
    D -- Valid --> F[POST /api/resume/import]
    F --> G[Extract Text & Run Gemini Section Parser]
    G --> H[Detect Sections: Personal, Summary, Experience, Skills, Education]
    H --> I[Show Import Review UX]
    I -->|User Edits / Confirms| J[Save to Neon Database]
    J --> K[Open Resume Builder & Populate All 8 Tabs]
```

---

## 9. Fact Lock & Non-Hallucination Security Protocol

To ensure 100% factual accuracy, ContentSpine AI enforces strict guardrails across all AI prompts:

1. **Grounding Constraint:** Gemini is explicitly instructed to extract only facts present in the source text.
2. **Missing Information Policy:** Unspecified employment dates, companies, percentages, or skills are left blank or flagged as `Needs Review`.
3. **No Metric Fabrication:** The optimizer improves bullet clarity and action verbs (e.g. changing *"worked on backend"* to *"Architected backend services"*), but **never invents statistics or percentages** not found in the original upload.

---

## 10. Technology Stack

| Layer | Component | Technology |
|---|---|---|
| **Frontend UI** | Core Framework | React 18 + TypeScript + Vite |
| **Frontend Styling** | Design System | Vanilla CSS (Burgundy `#880E4F` + Light Pink `#FFF1F5` + Slate) |
| **Icons & Logos** | Visual Assets | Lucide React + Authentic SVG Brand Marks (LinkedIn, X, Word, PDF) |
| **Backend API** | Server Runtime | Node.js + Express + TypeScript |
| **Database** | Database & ORM | Neon PostgreSQL + Prisma ORM 5.22 |
| **AI Integration** | Primary LLM | Google Gemini API (`gemini-3.1-flash-lite`) |
| **File Parsing** | Document Extraction | `pdf-parse`, `multer` memory storage |
| **Export Services** | Document Generation | `docx` (Word), `pdfkit` (PDF), `pptxgenjs` (PPT) |
| **Deployment** | Cloud Hosting | Vercel (Production) + Local Node/Vite Dev Servers |

---

## 11. Project Directory Structure

```
SIH/
├── client/                      # React 18 Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   │   ├── BrandLogo.tsx    # Authentic Vector Logos
│   │   │   ├── Header.tsx       # Navigation Header
│   │   │   ├── Sidebar.tsx      # Burgundy Navigation Sidebar
│   │   │   ├── ReviewWorkspace3Pane.tsx # 3-Pane Workspace
│   │   │   └── studios/
│   │   │       └── ResumeStudio.tsx   # 8-Tab Resume Studio & Upload Modal
│   │   ├── pages/               # Main Application Pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ContentSpinePage.tsx
│   │   │   ├── AgentsPage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/
│   │   │   └── apiClient.ts     # Typed API Request Gateway
│   │   ├── App.tsx              # Application Routing & State
│   │   └── index.css            # Burgundy + Light Pink Design System
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Node.js Express Backend
│   ├── src/
│   │   ├── controllers/         # Business Logic Controllers
│   │   │   ├── resumeController.ts # Resume Import, ATS & Optimization Logic
│   │   │   ├── spineController.ts  # Document Parsing & Content Spine Logic
│   │   │   └── agentController.ts  # Gemini AI Agent Handlers
│   │   ├── routes/              # Express API Routes
│   │   │   ├── resumeRoutes.ts
│   │   │   ├── spineRoutes.ts
│   │   │   └── agentRoutes.ts
│   │   ├── services/
│   │   │   ├── geminiService.ts # Gemini API Integration & Rate Limit Handlers
│   │   │   └── dbService.ts     # Neon Database Client
│   │   └── index.ts             # Express Server Entry Point
│   ├── prisma/
│   │   └── schema.prisma        # Prisma Database Schema
│   ├── package.json
│   └── tsconfig.json
├── package.json                 # Monorepo Workspace Scripts
├── README.md                    # System Documentation
└── SECURITY.md                  # Security Policy
```

---

## 12. Database Schema (Neon PostgreSQL + Prisma ORM)

```prisma
model Resume {
  id                  String          @id @default(uuid())
  title               String          @default("Untitled Resume")
  targetRole          String?
  candidateContentSpine Json          // Candidate Content Spine (Personal, Exp, Edu, Skills)
  contactInfo         Json?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  versions            ResumeVersion[]
}

model ResumeVersion {
  id              String   @id @default(uuid())
  resumeId        String
  resume          Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  version         Int      @default(1)
  versionName     String   @default("Initial Version")
  targetJobTitle  String?
  atsScore        Int?
  optimizedContent Json
  changesSummary  Json?
  createdAt       DateTime @default(now())
}
```

---

## 13. API Route Architecture

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check & Neon PostgreSQL ping |
| `POST` | `/api/resume/import` | Upload existing resume (`PDF`, `DOCX`, `TXT`), extract text, parse sections, save to Neon DB |
| `POST` | `/api/resume/create` | Parse raw resume text and return structured `CandidateContentSpine` |
| `GET` | `/api/resume/:id` | Fetch resume candidate spine from Neon DB |
| `POST` | `/api/resume/save` | Update and save candidate spine to Neon DB |
| `POST` | `/api/resume/ats-scan` | Run 8-dimension ATS scan against job description |
| `POST` | `/api/resume/optimize` | Run Fact-Locked resume bullet optimizer |
| `POST` | `/api/resume/job-match` | Perform semantic job description skill gap analysis |
| `POST` | `/api/resume/versions` | Create a new snapshot version in Neon DB |
| `GET` | `/api/resume/versions/:id` | List all saved versions for a resume |
| `GET` | `/api/resume/:id/export/docx` | Download resume as Word `.docx` |
| `GET` | `/api/resume/:id/export/pdf` | Download resume as formatted PDF `.pdf` |

---

## 14. Installation & Local Setup Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Database:** [Neon PostgreSQL Connection String](https://neon.tech)
- **AI Key:** [Google Gemini API Key](https://aistudio.google.com)

### Step 1: Clone Repository
```bash
git clone https://github.com/himanshusingh412/SIH.git
cd SIH
```

### Step 2: Configure Environment Variables
Create a file named `server/.env`:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-cool-endpoint.us-east-2.aws.neon.tech/neondb?sslmode=require"
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-3.1-flash-lite
DEMO_MODE=false
```

### Step 3: Install Dependencies & Setup Database
```bash
# Install root, client, and server dependencies
npm install

# Push database schema to Neon PostgreSQL
cd server
npx prisma db push --schema=prisma/schema.prisma
cd ..
```

### Step 4: Run Development Servers
```bash
# Terminal 1: Backend Server (Port 5001)
npm --prefix server run dev

# Terminal 2: Frontend Vite App (Port 5173)
npm --prefix client run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 15. Testing & Verification Plan

The platform has been validated against 16 core test scenarios:

| Test ID | Test Scenario | Verified Result |
|:---:|:---|:---:|
| **TC-01** | Manual Resume Creation | 🟢 Passed — Full form editing and real-time preview sync |
| **TC-02** | PDF Resume Upload | 🟢 Passed — Successfully extracted text via `pdf-parse` |
| **TC-03** | DOCX Resume Upload | 🟢 Passed — Successfully parsed Word document sections |
| **TC-04** | TXT Resume Upload | 🟢 Passed — Parsed plain text and markdown resumes |
| **TC-05** | Invalid File Format Upload | 🟢 Passed — Shows user-friendly error banner (`PDF, DOCX or TXT supported`) |
| **TC-06** | File Size Limit (> 20MB) | 🟢 Passed — File size validation prevents upload overflow |
| **TC-07** | Import Review Modal UX | 🟢 Passed — Displays detected section checklists (`✓ Verified`, `⚠ Needs Review`) |
| **TC-08** | Save Imported Resume | 🟢 Passed — Saves spine to Neon DB and populates Resume Builder |
| **TC-09** | 8-Dimension ATS Scanning | 🟢 Passed — Computes real scores across Keyword Match, Format Risk, Title Fit |
| **TC-10** | Job Description Matching | 🟢 Passed — Analyzes required vs missing skills against target role |
| **TC-11** | Fact-Locked Resume Optimizer | 🟢 Passed — Enhances action verbs without inventing fake metrics |
| **TC-12** | Version Control & Restore | 🟢 Passed — Creates snapshot versions in Neon DB; restores previous states |
| **TC-13** | DOCX Document Export | 🟢 Passed — Downloads formatted Word `.docx` resume |
| **TC-14** | PDF Document Export | 🟢 Passed — Downloads formatted PDF `.pdf` resume |
| **TC-15** | Rate Limit Handling (HTTP 429) | 🟢 Passed — Catches `GEMINI_RATE_LIMITED` and returns `retryAfterSeconds` |
| **TC-16** | Responsive UI Layout | 🟢 Passed — Tested on Desktop (1440px), Laptop (1024px), Tablet (768px), Mobile (375px) |

---

## 16. SIH Demo Walkthrough Flow

When presenting ContentSpine AI to SIH judges, follow this sequence:

1. **Dashboard Overview:** Open `http://localhost:5173/` or `https://sih-2026-ai-engine.vercel.app/`. Show real-time project metrics loaded from Neon PostgreSQL.
2. **Resume Studio Landing:** Click **Resume Studio** in the left sidebar navigation. Highlight the **Dual Entry Banner**: `[ Build Resume Manually ]` vs `[ ↑ Upload Existing Resume ]`.
3. **Upload Resume Demonstration:** Click `[ ↑ Upload Existing Resume ]`. Drag and drop a sample PDF or DOCX resume into the modal. Watch text extraction and section detection.
4. **Import Review UX:** Show the **Import Review Screen**. Point out the detected sections checklist and demonstrate how missing details remain blank to enforce Fact Lock integrity.
5. **Resume Builder & ATS Scanner:** Click **Import & Continue**. Show how the imported resume pre-populates all 8 tabs. Switch to **ATS Scanner** and run a scan against a Job Description.
6. **Fact-Locked Optimization:** Switch to **Resume Optimizer**. Click **Run Fact-Locked Optimizer**. Show how action verbs and keyword alignment improve while original metrics remain untouched.
7. **Export Deliverable:** Click **Export DOCX** or **Export PDF** to generate the final formatted resume document.

---

## 17. Security, Privacy & Safeguards

- **Zero Client-Side Keys:** All Gemini API credentials and database connection strings are isolated on the Node.js Express server.
- **Fact Lock Guardrails:** AI prompts forbid inventing companies, percentages, or dates not present in the input resume.
- **Sanitized Errors:** Internal database stack traces and API error details are sanitized before returning responses to the user.

---

## 18. Team Information & Submission Details

- **Smart India Hackathon 2026**
- **Problem Statement ID:** 26154
- **Theme:** Smart Automation
- **Category:** Software
- **Team Name:** PHI Tech
- **Team ID:** 373

---

## 19. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
