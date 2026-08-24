# Product Requirements Document (PRD) — ContentSpine AI

## 1. Product Vision
To build an enterprise and government-grade AI Content Transformation Platform for Smart India Hackathon (SIH) 2026 that solves LLM fact drift across multi-channel communications. By using a single, immutable **Content Spine** with a **Fact Lock Layer**, the platform guarantees 100% factual consistency across all generated deliverables.

---

## 2. Problem Statement
When government agencies, ministries, or enterprises use standard zero-shot LLM prompts to adapt source reports into press releases, social posts, advisories, and slide decks:
1. **Fact Drift**: LLMs independently hallucinate or alter dates, numeric metrics, names, and claims across different outputs.
2. **Lack of Traceability**: Stakeholders cannot trace generated claims back to original source pages or quotes.
3. **Manual Audit Overhead**: Human reviewers must manually cross-check every output against 50+ page documents.

---

## 3. Users & Target Personas

### Persona A: Government Communications Officer (Rajesh Kumar)
* **Goal**: Quickly convert 80-page cyber threat reports into press releases, public advisories, and social posts.
* **Pain Point**: Cannot risk releasing incorrect dates, vulnerability counts, or ministry names.

### Persona B: Executive Briefing Specialist (Priya Sharma)
* **Goal**: Transform complex policy reports into C-suite executive briefings, slide decks, and video packages.
* **Pain Point**: Needs 100% verifiable source quotes for every metric presented to leadership.

---

## 4. User Stories

1. **As a User**, I want to upload PDFs or paste raw text prompts so that the system extracts a structured Content Spine.
2. **As a User**, I want critical dates and numbers automatically locked so that AI generators cannot change them.
3. **As a User**, I want to generate 7 distinct deliverable formats simultaneously for different audience profiles.
4. **As a User**, I want an automated consistency validator that flags any fact discrepancies and auto-fixes them.
5. **As a User**, I want to click any claim to view its 4-tier source lineage (Statement → Fact → Document → Page Quote).
6. **As a User**, I want to export deliverables in JSON, Markdown, TXT, HTML presentation decks, and video packages.

---

## 5. Functional Requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | Multi-format source ingestion (PDF, TXT, MD, Images, DOCX, Prompt) | High | ✅ Complete |
| FR-2 | Structured Content Spine extraction (Entities, Facts, Risks, Claims) | High | ✅ Complete |
| FR-3 | Fact Lock Layer with manual lock/unlock toggles | High | ✅ Complete |
| FR-4 | Multi-channel AI generators (7 formats) with audience profiling | High | ✅ Complete |
| FR-5 | 8-category Consistency Validator with proportional scoring | High | ✅ Complete |
| FR-6 | 3-retry automated correction loop (`[Fact Lock — Attempt X/3]`) | High | ✅ Complete |
| FR-7 | 4-Tier Source Traceability Inspector (`[Why was this generated?]`) | High | ✅ Complete |
| FR-8 | 3-Pane Review Workspace with format preview switching | High | ✅ Complete |
| FR-9 | Comprehensive Export Modal (JSON, TXT, MD, HTML Deck, Video) | High | ✅ Complete |
| FR-10 | Offline Deterministic Demo Mode requiring no external API key | High | ✅ Complete |

---

## 6. Out of Scope (MVP)
* Real-time MP4 video rendering via Remotion worker pool (supported via video package script/storyboard stub).
* OAuth2 Multi-Tenant Organization SSO (single operator mode supported).

---

## 7. Success Metrics
* **Fact Drift Mismatch Rate**: 0% across locked facts.
* **Validation Accuracy**: 100% detection of date and numeric contradictions.
* **Transformation Speed**: < 5 seconds per multi-output package in demo mode.
