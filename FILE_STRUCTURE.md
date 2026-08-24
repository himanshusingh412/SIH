# File Structure — ContentSpine AI

Generated from the actual repository. Excludes `node_modules`, `.git`, and build output directories.

```
SIH/
├── package.json                   # Root monorepo scripts (vercel-build, build, start, test)
├── package-lock.json
├── vercel.json                    # Vercel routing: /api → server, / → client
│
├── client/                        # React + TypeScript + Vite frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.tsx               # App entry point
│       ├── App.tsx                # Root component, client-side router, project state
│       ├── App.css
│       ├── index.css              # Global styles (custom CSS, no Tailwind)
│       ├── types.ts               # Shared TypeScript types (InputCategory, OutputType, etc.)
│       ├── assets/
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── layouts/
│       │   └── RootLayout.tsx     # Shell layout: sidebar + header + content area
│       ├── hooks/
│       │   └── useProject.ts      # Project state management hook (ingest, generate, lock, etc.)
│       ├── services/
│       │   └── apiClient.ts       # All API calls to the Express server
│       ├── utils/
│       │   └── pdfSanitizer.ts    # Strips PDF binary/object syntax from extracted text
│       ├── components/
│       │   ├── Header.tsx         # Top bar: AI provider badge, project name
│       │   ├── SidebarNav.tsx     # Left navigation: 9 items
│       │   ├── Navbar.tsx         # Secondary navigation component
│       │   ├── Stepper.tsx        # Multi-step workflow progress indicator
│       │   ├── UploadStage.tsx    # Source document upload UI
│       │   ├── ProcessingScreen.tsx   # Ingestion progress display
│       │   ├── ContentSpineViewer.tsx # Fact browser + lock toggles
│       │   ├── ConfigScreen.tsx       # Output type selector
│       │   ├── GenerationProgressScreen.tsx  # Generation progress display
│       │   ├── GeneratorStage.tsx     # Individual output generation stage
│       │   ├── ReviewWorkspace3Pane.tsx  # 3-pane review: source ↔ spine ↔ outputs
│       │   ├── OutputWorkspace.tsx    # Output display and validation panel
│       │   ├── ExportModal.tsx        # Export format selection modal
│       │   ├── MarkdownRenderer.tsx   # Renders markdown output content
│       │   └── studios/
│       │       └── ResumeStudio.tsx   # 8-tab Resume Intelligence & ATS Studio
│       └── pages/
│           ├── DashboardPage.tsx      # Real Neon metrics dashboard
│           ├── AgentsPage.tsx         # AI Knowledge Agent chat UI
│           ├── HistoryPage.tsx        # Persistent conversation history
│           ├── AnalyticsPage.tsx      # Generation analytics
│           └── SettingsPage.tsx       # Provider + model configuration
│
├── server/                        # Express + TypeScript + Prisma backend
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example               # Environment variable template
│   ├── .env                       # Local secrets (git-ignored)
│   ├── .gitignore
│   ├── prisma/
│   │   └── schema.prisma          # All 23 Prisma models for Neon PostgreSQL
│   └── src/
│       ├── index.ts               # Express app setup, route mounting, health endpoints
│       ├── types.ts               # Server-side TypeScript types
│       ├── config/
│       │   ├── index.ts           # Config object, Prisma singleton (global.prisma), DB flags
│       │   └── dbInit.ts          # ensureDbSchema() for serverless cold-start safety
│       ├── middleware/
│       │   ├── errorHandler.ts    # Global Express error handler + Prisma error sanitizer
│       │   └── security.ts        # Rate limiter, security headers, upload MIME validator
│       ├── controllers/
│       │   ├── projectController.ts   # Content Spine + generation + export + validation
│       │   ├── resumeController.ts    # Resume + ATS + cover letter + LinkedIn + exports
│       │   ├── agentController.ts     # Knowledge agent handler
│       │   ├── historyController.ts   # Conversation CRUD
│       │   └── aiProviderController.ts # Provider health + direct generation
│       ├── services/
│       │   ├── projectService.ts      # Business logic: ingest, process, generate, validate
│       │   ├── agentService.ts        # Agent orchestration: guardrail, Gemini, grounding
│       │   ├── historyService.ts      # Conversation + message Prisma operations
│       │   └── providerHealthService.ts  # Gemini 429 tracking + retry state
│       ├── repositories/
│       │   └── projectRepository.ts   # Low-level Prisma queries + dashboard aggregation
│       ├── processors/
│       │   ├── documentProcessor.ts   # Orchestrates adapter selection + text normalization
│       │   └── adapters/
│       │       ├── pdfAdapter.ts      # pdf-parse based PDF extraction
│       │       ├── docxAdapter.ts     # DOCX text extraction
│       │       ├── imageAdapter.ts    # Image text extraction (OCR wrapper)
│       │       ├── txtAdapter.ts      # Plain text / fallback adapter
│       │       └── types.ts           # InputAdapter interface
│       ├── ai/
│       │   ├── provider.ts            # Legacy provider interface (kept for compatibility)
│       │   ├── geminiProvider.ts      # Legacy Gemini wrapper
│       │   ├── mockProvider.ts        # Legacy mock wrapper
│       │   ├── generators/
│       │   │   ├── baseGenerator.ts
│       │   │   ├── executiveSummaryGenerator.ts
│       │   │   ├── linkedinPostGenerator.ts
│       │   │   ├── xThreadGenerator.ts
│       │   │   ├── advisoryGenerator.ts
│       │   │   ├── presentationGenerator.ts
│       │   │   ├── infographicGenerator.ts
│       │   │   ├── videoPackageGenerator.ts
│       │   │   └── factory.ts
│       │   └── providers/
│       │       ├── factory.ts         # Provider registry + active provider selection
│       │       ├── geminiProvider.ts  # Gemini 1.5 / Flash integration (@google/generative-ai)
│       │       ├── openAIProvider.ts  # OpenAI GPT-4o integration (fetch-based)
│       │       ├── llamaProvider.ts   # Ollama/Llama3 integration (local, fallback to mock)
│       │       ├── mockProvider.ts    # Deterministic mock for testing
│       │       └── types.ts           # AIProviderInstance interface, ProviderType
│       ├── engine/
│       │   ├── formatEngine/
│       │   │   ├── index.ts
│       │   │   ├── formatValidator.ts
│       │   │   ├── styleEngine.ts
│       │   │   ├── exporters/
│       │   │   │   ├── docxExporter.ts
│       │   │   │   ├── pdfExporter.ts
│       │   │   │   ├── pptxExporter.ts
│       │   │   │   └── dataExporters.ts
│       │   │   ├── formatters/
│       │   │   └── converters/        # Format conversion (stub — not production-ready)
│       │   └── resumeEngine/
│       │       ├── atsEngine.ts       # 9-dimension ATS scoring
│       │       ├── candidateSpine.ts  # Candidate Content Spine builder
│       │       ├── jobSpine.ts        # Job Description parser
│       │       ├── resumeExporters.ts # DOCX + PDF resume export
│       │       ├── resumeFactLock.ts  # Fact validation for resume optimization
│       │       └── resumeOptimizer.ts # Gemini-powered resume optimizer
│       ├── routes/
│       │   ├── projectRoutes.ts       # /projects/* + /fact-locks/* + /outputs/*
│       │   ├── resumeRoutes.ts        # /resume/* + /job/*
│       │   ├── agentRoutes.ts         # /agents/*
│       │   ├── historyRoutes.ts       # /conversations/* + /history/*
│       │   └── aiProviderRoutes.ts    # /ai/*
│       ├── utils/
│       │   └── response.ts            # sendSuccess(), sendError() helpers
│       └── tests/
│           ├── db_production_test_suite.ts       # Neon DB connection + dashboard stats
│           ├── gemini_rate_limit_test_suite.ts   # 429 handling + retry behavior
│           ├── neon_history_test_suite.ts         # Conversation + message persistence
│           ├── pdf_extraction_test_suite.ts       # PDF text extraction pipeline
│           ├── provider_test_suite.ts             # AI provider connectivity
│           ├── resume_test_suite.ts               # Resume + ATS + export pipeline
│           └── agent_harness_test_suite.ts        # Knowledge agent guardrail tests
│
└── docs/                          # (Documentation — markdown files in root)
    README.md
    ARCHITECTURE.md
    API.md
    DATABASE.md
    ENVIRONMENT.md
    DEPLOYMENT.md
    FEATURES.md
    FILE_STRUCTURE.md
    TECH_STACK.md
    SECURITY.md
    TESTING.md
    USER_FLOW.md
    CODING_RULES.md
    CHANGELOG.md
    ROADMAP.md
    TASKS.md
    DEMO_SCRIPT.md
    FAQ.md
    PRD.md
    PPT_CONTENT.md
    PROMPTS.md
    LICENSE.md
    UI_GUIDELINES.md
```
