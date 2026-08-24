# SIH Judge Frequently Asked Questions (FAQ) & Strategic Answers

### Q1: How does your system prevent LLM hallucinations across multiple outputs?
**Answer**:
> *"Instead of passing raw source text to independent LLM prompts for each output, we extract a **Content Spine** first. The Content Spine acts as an immutable Single Source of Truth. All critical dates, numbers, names, and claims are extracted and locked in the **Fact Lock Layer**. When output generators run, they receive the locked facts as strict constraints and are validated against them afterwards."*

---

### Q2: What happens if a generated deliverable alters a locked date or metric?
**Answer**:
> *"Our **Consistency Validator** automatically parses all 8 fact categories (dates, numbers, person, organization, location, claims, risks, recommendations) and computes a proportional consistency score. If a discrepancy is detected, the **Auto-Fix Loop** automatically regenerates the output up to 3 times, enforcing fact compliance with `[Fact Lock - Attempt X/3]` annotations. If unresolvable, it triggers a **Human Review Required** red banner."*

---

### Q3: How do users verify where a specific claim came from?
**Answer**:
> *"Every output claim includes an interactive `[Why was this generated?]` inspector button. Clicking it displays a **4-Tier Source Lineage Inspector**:
> `Generated Statement` → `Content Spine Fact` → `Source Document` → `Raw Text Quote & Page Number`
> This provides 100% auditability for government reviewers."*

---

### Q4: Does your platform work offline or without paid AI API keys?
**Answer**:
> *"Yes! We implemented a pluggable **AI Provider Abstraction Layer**. In `MockProvider` mode, the entire application operates 100% offline, deterministically parsing documents, building Content Spines, locking facts, generating 7 deliverables, validating consistency, and exporting packages without requiring external API keys or network connectivity."*

---

### Q5: What input document formats are supported?
**Answer**:
> *"Our `DocumentProcessor` supports PDF documents, plain text (.txt), Markdown (.md), JSON data, uploaded images (via OCR adapter), Microsoft Word (.docx), and raw text prompts."*
