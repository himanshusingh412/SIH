# Testing Strategy & Automated Test Suite — ContentSpine AI

## 1. Test Architecture

The test suite ([`server/src/tests/test_suite.ts`](file:///Users/himanshusingh/Downloads/hackathon/SIH/server/src/tests/test_suite.ts)) covers 3 levels of testing:

1. **Unit Tests**:
   - `AIProvider` abstraction layer instantiation.
   - `DocumentProcessor` raw text & chunk extraction.
   - `FactLockEngine` automatic date and metric locking.
   - `ConsistencyValidator` 100% pass verification & contradiction detection.
   - Deliverable generator factory logic.

2. **Integration Tests**:
   - Express REST API server route responses (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).
   - Source document upload and Content Spine processing.
   - Multi-output 7-deliverable generation.
   - Project-wide validation reporting.

3. **End-to-End (E2E) Full Lifecycle Test**:
   - Complete workflow assertion:
     `Create Project → Upload → Process → Content Spine → Select Formats → Generate → Validate → Review → Export Package`

---

## 2. Executing Automated Tests

Run the full test suite using:
```bash
cd server
npm run test
```

### Expected Output
```text
======================================================
🧪 SIH 2026 AI PLATFORM — UNIT, INTEGRATION & E2E SUITE
======================================================

📦 1. UNIT TESTS
  ✓ PASS: AI Provider Abstraction Layer
  ✓ PASS: Content Spine Extraction Engine
  ✓ PASS: Fact Lock Classification & Protection Default
  ✓ PASS: Consistency Validator — 100% Immutable Pass
  ✓ PASS: Consistency Validator — Discrepancy Contradiction Detection
  ✓ PASS: AI Output Generation Engine

🔗 2. INTEGRATION TESTS (API Server)
  ✓ PASS: Integration — Create Project
  ✓ PASS: Integration — Document Upload & Ingestion
  ✓ PASS: Integration — Process & Build Content Spine
  ✓ PASS: Integration — Multi-Output Generation (7 Deliverables)
  ✓ PASS: Integration — Project Validation Report

🔄 3. END-TO-END FULL WORKFLOW TEST
  Flow: Create Project → Upload → Process → Content Spine → Select Formats → Generate → Validate → Review → Export Package
  ✓ PASS: E2E — Full Lifecycle Complete & Export Bundle Generated

======================================================
SUMMARY: 12 PASSED | 0 FAILED
======================================================
```
