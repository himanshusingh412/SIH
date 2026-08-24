# SIH 2026 Judge Presentation Demo Script (3–5 Minutes)

**Presenter Roles**:
* **Presenter**: Demonstrates live software walkthrough.
* **Tech Lead**: Explains architectural innovation & fact-locking mechanics.

---

## Minute 0:00 – 1:00: Problem & Core Innovation (The "Why")

**Presenter**:
> *"Respected Judges, when government ministries or enterprise teams use standard AI chatbots to convert an 80-page cyber threat report into press releases, slide decks, or public advisories, a dangerous issue occurs: **LLM Fact Drift**. Standard LLMs independently alter dates, vulnerability metrics, and ministry names across different outputs."*

**Tech Lead**:
> *"ContentSpine AI solves this fundamentally. Instead of independently generating outputs from raw text, we introduce **Content Spine Architecture**: **UPLOAD ONCE → EXTRACT CONTENT SPINE → LOCK FACTS → GENERATE MULTIPLE OUTPUTS → VALIDATE CONSISTENCY → EXPORT**."*

---

## Minute 1:00 – 2:30: Live Benchmark Demonstration

**Presenter** *(Actions on Screen)*:
1. Click **"Load Benchmark Demo"** or upload a Cyber Threat Report.
2. Show the **Content Spine Viewer**: Point out extracted entities, dates, numbers, and locked facts.
3. Show the **Fact Lock Layer**: Toggle a lock icon (e.g. `System Consistency Metric: 99.9%` or `Milestone Date: 2026-08-24`).
4. Click **"Generate 7 Deliverables"**.

---

## Minute 2:30 – 4:00: Review Workspace, Traceability & Auto-Fix Loop

**Presenter**:
1. Show the **3-Pane Review Workspace**: Click through Executive Summary, LinkedIn, X Thread, Advisory, Presentation Deck, Infographic Layout, and Video Package.
2. Click **`[Why was this generated?]`**: Point to the **4-Tier Source Lineage Inspector**: `Generated Statement` → `Content Spine Fact` → `Document` → `Raw Text Quote & Page Number`
3. Click **"Inject Fact Error"**: Intentionally corrupt a date (e.g. `2026-08-24` → `2026-09-15`). Show the score drop live to 66% and flag a red Discrepancy Error.
4. Click **"⚡ Fix Automatically"**: Watch the 3-retry auto-correction loop fix the fact drift in real time and restore the score to 100%!

---

## Minute 4:00 – 5:00: Export & Conclusion

**Presenter**:
1. Click **"Export Package"**: Demonstrate downloading JSON packages, HTML slide decks, and video production packages.
2. Highlight offline capability: *"Our entire demo runs 100% offline without external API dependencies."*

**Tech Lead**:
> *"ContentSpine AI guarantees zero fact drift, 100% verifiable source traceability, and instant multi-channel publishing for government and enterprise communications. Thank you!"*
