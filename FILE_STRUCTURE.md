# Repository File Structure — ContentSpine AI

```
SIH/
├── README.md                     # Product overview & quick start
├── PRD.md                        # Product Requirements Document
├── ARCHITECTURE.md               # System & component architecture
├── TECH_STACK.md                 # Technical stack breakdown & rationales
├── DATABASE.md                   # Prisma models & database ERD
├── API.md                        # REST API endpoint reference
├── FEATURES.md                   # Feature status matrix
├── USER_FLOW.md                  # Screen-by-screen user journey
├── UI_GUIDELINES.md              # Design tokens & UI component specs
├── CODING_RULES.md               # Development conventions
├── FILE_STRUCTURE.md             # Repository directory map
├── TASKS.md                      # Task log & progress tracking
├── PROMPTS.md                    # System prompts used by generators
├── CHANGELOG.md                  # Chronological revision history
├── ROADMAP.md                    # Future feature roadmap
├── ENVIRONMENT.md                # Environment variable setup
├── SECURITY.md                   # Security measures & production guidance
├── TESTING.md                    # Test suite instructions
├── DEPLOYMENT.md                 # Production deployment procedures
├── DEMO_SCRIPT.md                # 3-5 minute SIH judge demo script
├── PPT_CONTENT.md                # SIH pitch presentation content
├── FAQ.md                        # Judge Q&A reference
├── LICENSE.md                    # License statement
│
├── client/                       # React 18 Frontend
│   ├── public/                   # Static assets & favicons
│   ├── src/
│   │   ├── assets/               # CSS & graphic assets
│   │   ├── components/           # React UI components
│   │   │   ├── ConfigScreen.tsx
│   │   │   ├── ContentSpineViewer.tsx
│   │   │   ├── ExportModal.tsx
│   │   │   ├── GenerationProgressScreen.tsx
│   │   │   ├── GeneratorStage.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── OutputWorkspace.tsx
│   │   │   ├── ProcessingScreen.tsx
│   │   │   ├── ReviewWorkspace3Pane.tsx
│   │   │   ├── SidebarNav.tsx
│   │   │   ├── Stepper.tsx
│   │   │   └── UploadStage.tsx
│   │   ├── hooks/                # Custom React state hooks
│   │   │   └── useProject.ts
│   │   ├── layouts/              # Root layout wrappers
│   │   │   └── RootLayout.tsx
│   │   ├── pages/                # Top-level page views
│   │   │   └── DashboardPage.tsx
│   │   ├── services/             # API client layer
│   │   │   └── apiClient.ts
│   │   ├── App.tsx               # Main application routing
│   │   ├── index.css             # Global design tokens & styling
│   │   ├── main.tsx              # React entrypoint
│   │   └── types.ts              # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── server/                       # Node.js Express Backend
    ├── prisma/
    │   ├── dev.db                # SQLite database
    │   └── schema.prisma         # 12 Prisma data models
    ├── src/
    │   ├── ai/                   # AI Provider Abstraction Layer
    │   │   └── provider.ts       # Mock, Gemini & OpenAI Providers
    │   ├── config/               # Environment & Prisma client setup
    │   │   └── index.ts
    │   ├── controllers/          # Express route handlers
    │   │   └── projectController.ts
    │   ├── middleware/           # Rate limiting & error middleware
    │   │   ├── errorHandler.ts
    │   │   └── security.ts
    │   ├── processors/           # Document ingestion & PDF/text parsing
    │   │   └── documentProcessor.ts
    │   ├── repositories/         # Database persistence queries
    │   │   └── projectRepository.ts
    │   ├── routes/               # Express REST API routes
    │   │   └── projectRoutes.ts
    │   ├── services/             # Business logic & auto-fix engine
    │   │   └── projectService.ts
    │   ├── tests/                # Unit, Integration & E2E Test Suite
    │   │   └── test_suite.ts
    │   ├── types/                # Backend TypeScript types
    │   │   └── index.ts
    │   ├── utils/                # Standard response utilities
    │   │   └── response.ts
    │   ├── validators/           # Consistency Validator & Fact Lock Engine
    │   │   ├── consistencyValidator.ts
    │   │   └── factLockEngine.ts
    │   └── index.ts              # Express server entrypoint
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```
