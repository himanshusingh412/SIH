# REST API Reference & Endpoint Specification — ContentSpine AI

**Base URL**: `http://localhost:5001/api`

---

## 1. Project Management Endpoints

### 1.1 Create Project
* **`POST /api/projects`**
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "title": "Cyber Threat Intelligence Transformation",
    "description": "SIH 2026 Benchmark Transformation"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "project": {
        "id": "ad92706f-5f8d-4db6-b377-dc15e4893be9",
        "title": "Cyber Threat Intelligence Transformation",
        "status": "DRAFT",
        "createdAt": "2026-08-24T10:00:00.000Z"
      }
    }
  }
  ```

### 1.2 List Projects
* **`GET /api/projects`**
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "projects": [...]
    }
  }
  ```

### 1.3 Get Project Details
* **`GET /api/projects/:id`**
* **Response (200 OK)**:
  Returns full nested project object with source documents, content spines, facts, outputs, and validation results.

### 1.4 Seed Benchmark Demo Project
* **`POST /api/projects/seed-demo`**
* **Response (200 OK)**:
  Seeds official SIH threat intelligence dataset with 7 fact-locked outputs.

---

## 2. Ingestion & Content Spine Endpoints

### 2.1 Ingest Source Document / Raw Text
* **`POST /api/projects/:id/source`** (or `/ingest`)
* **Headers**: `multipart/form-data` or `application/json`
* **Request Body**:
  ```json
  {
    "category": "THREAT_INTEL",
    "rawText": "SIH 2026 Cyber Report..."
  }
  ```
* **Response (201 Created)**: Returns `documentId`, `project`, and extracted `spine`.

### 2.2 Process Project Sources
* **`POST /api/projects/:id/process`**
* **Response (200 OK)**: Re-runs extraction & fact locking over all uploaded documents.

### 2.3 Get Content Spine
* **`GET /api/projects/:id/content-spine`**
* **Response (200 OK)**: Returns latest Content Spine summary, facts, entities, and source references.

### 2.4 Toggle Fact Lock
* **`PATCH /api/fact-locks/:factId`**
* **Request Body**: `{ "isLocked": false }`
* **Response (200 OK)**: Returns updated fact.

---

## 3. Output Generation & Deliverables Endpoints

### 3.1 Generate Multi-Output Package
* **`POST /api/projects/:id/generate`**
* **Request Body**:
  ```json
  {
    "outputTypes": ["EXECUTIVE_SUMMARY", "LINKEDIN_POST", "X_THREAD", "ADVISORY", "PRESENTATION", "INFOGRAPHIC", "VIDEO_PACKAGE"],
    "audience": "EXECUTIVE"
  }
  ```
* **Response (200 OK)**: Returns array of 7 generated deliverables and initial validation result.

### 3.2 Get All Project Outputs
* **`GET /api/projects/:id/outputs`**
* **Response (200 OK)**: Returns all output records.

### 3.3 Get Single Output
* **`GET /api/outputs/:id`**
* **Response (200 OK)**: Returns output by ID with version history.

### 3.4 Regenerate Single Output
* **`POST /api/outputs/:id/regenerate`**
* **Request Body**: `{ "audience": "TECHNICAL" }`
* **Response (200 OK)**: Regenerates output and saves new version.

---

## 4. Validation & Export Endpoints

### 4.1 Validate Single Output
* **`POST /api/outputs/:id/validate`**
* **Response (200 OK)**: Returns single output validation report.

### 4.2 Validate Project Outputs
* **`POST /api/projects/:id/validate`**
* **Response (200 OK)**: Returns aggregate consistency score, counts, and issues list.

### 4.3 Get Latest Validation Report
* **`GET /api/projects/:id/validation`**
* **Response (200 OK)**: Returns latest stored validation report.

### 4.4 Auto-Correct Discrepancies
* **`POST /api/projects/:id/auto-correct`**
* **Response (200 OK)**: Triggers 3-retry auto-fix loop.

### 4.5 Inject Test Error
* **`POST /api/projects/:id/test-inject`**
* **Request Body**: `{ "injections": [{ "outputType": "EXECUTIVE_SUMMARY", "find": "2026-08-24", "replace": "2026-09-15" }] }`
* **Response (200 OK)**: Corrupts content and re-validates to demonstrate validator detection.

### 4.6 Export Project Package
* **`GET /api/projects/:id/export`**
* **Response (200 OK)**: Returns JSON package and Markdown report bundle.
