import {
  AIProvider,
  AudienceProfile,
  ContentSpineData,
  EntityItem,
  FactItem,
  InputCategory,
  OutputType,
  ValidationIssue,
} from '../types';

export class MockAIProvider implements AIProvider {
  name = 'Mock AI Provider (SIH Demo Mode)';

  async extractContentSpine(
    rawText: string,
    category: InputCategory
  ): Promise<ContentSpineData> {
    // Regex extractors for numbers, dates, organizations, locations
    const dateRegex = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4})\b/gi;
    const numberRegex = /\b(\d+(?:\.\d+)?(?:\%|k|M|B| million| billion| percent)?)\b/g;

    const matchedDates = Array.from(new Set(rawText.match(dateRegex) || ['2026-08-24', 'Q3 2026']));
    const matchedNumbers = Array.from(new Set(rawText.match(numberRegex) || ['99.9%', '500+']));

    const sentences = rawText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const summary = sentences.slice(0, 3).join(' ') || 'Source document extracted successfully.';

    const entities: EntityItem[] = [
      {
        id: 'ent-1',
        name: 'Smart India Hackathon 2026',
        type: 'ORGANIZATION',
        confidence: 0.98,
        sourceReference: 'Title & Heading',
      },
      {
        id: 'ent-2',
        name: 'Ministry of Education & Innovation Cell',
        type: 'ORGANIZATION',
        confidence: 0.95,
        sourceReference: 'Section 1',
      },
      {
        id: 'ent-3',
        name: 'AI Content Transformation Engine',
        type: 'TECHNOLOGY',
        confidence: 0.99,
        sourceReference: 'Section 2',
      },
    ];

    const dates: FactItem[] = matchedDates.slice(0, 5).map((d, idx) => ({
      id: `date-${idx + 1}`,
      key: `Target Milestone / Date #${idx + 1}`,
      value: d,
      category: 'DATE',
      isLocked: true,
      sourceSnippet: `Extracted date ${d} from source document context.`,
      pageNumber: 1,
    }));

    const numbers: FactItem[] = matchedNumbers.slice(0, 5).map((n, idx) => ({
      id: `num-${idx + 1}`,
      key: `Metric / Statistic #${idx + 1}`,
      value: n,
      category: 'NUMBER',
      isLocked: true,
      sourceSnippet: `Key metric ${n} reported in source analysis.`,
      pageNumber: 1,
    }));

    const locations: EntityItem[] = [
      { id: 'loc-1', name: 'New Delhi, India', type: 'LOCATION', confidence: 0.9, sourceReference: 'Metadata' },
    ];

    const events = [
      'Source Content Ingestion & Multi-Format Preprocessing',
      'Fact Lock Layer Enforcement & Entity Extraction',
      'Multi-Output Generation across 7 Target Communication Artefacts',
      'Factual Consistency Verification & Automated Drift Prevention',
    ];

    const risks = [
      'Fact drift occurring when generating multiple communication outputs independently',
      'Lack of source traceability in standard LLM zero-shot outputs',
      'Misalignment of audience tone between technical reports and public advisories',
    ];

    const recommendations = [
      'Establish Content Spine as the single immutable source of truth before output generation',
      'Enforce mandatory Fact Locking on critical dates, numbers, and named entities',
      'Run independent Consistency Validator before publishing or exporting deliverables',
    ];

    const claims = [
      'Content Spine approach eliminates fact drift across all 7 generated communication formats.',
      '100% source traceability guaranteed back to original paragraph snippets.',
      'Audience profiles dynamically adjust tone, detail depth, and vocabulary without altering locked facts.',
    ];

    const relationships = [
      { subject: 'Content Spine', relation: 'serves as Single Source of Truth for', object: 'All Output Generators' },
      { subject: 'Fact Lock Layer', relation: 'enforces strict accuracy on', object: 'Dates, Numbers, and Entities' },
      { subject: 'Consistency Validator', relation: 'detects and corrects drift in', object: 'Generated Deliverables' },
    ];

    const factLocks: FactItem[] = [...dates, ...numbers];

    return {
      summary,
      entities,
      dates,
      numbers,
      locations,
      events,
      risks,
      recommendations,
      claims,
      relationships,
      factLocks,
    };
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    const lockedDatesStr = spine.dates.map((d) => d.value).join(', ');
    const lockedNumbersStr = spine.numbers.map((n) => n.value).join(', ');
    const mainOrg = spine.entities.find((e) => e.type === 'ORGANIZATION')?.name || 'Target Organization';

    switch (outputType) {
      case 'EXECUTIVE_SUMMARY': {
        const title = `Executive Summary: Content Transformation Blueprint (${audience})`;
        const text = `## Executive Summary

**Target Audience**: ${audience}
**Primary Source**: ${mainOrg}

### Key Overview
${spine.summary}

### Factual Highlighting & Verified Metrics
* **Key Metrics**: ${lockedNumbersStr}
* **Critical Milestones**: ${lockedDatesStr}

### Strategic Recommendations
${spine.recommendations.map((r) => `- ${r}`).join('\n')}

### Risk Analysis
${spine.risks.map((r) => `- ${r}`).join('\n')}
`;
        return { title, content: text };
      }

      case 'LINKEDIN_POST': {
        const title = `LinkedIn Post (${audience})`;
        const text = `🚀 Exciting Breakthrough in AI Content Transformation!

Transforming raw reports into accurate, multi-format communication deliverables without fact drift is now a reality.

✨ **Key Highlights & Metric Gains**:
${spine.numbers.slice(0, 3).map((n) => `• ${n.key}: ${n.value}`).join('\n')}

📅 **Key Milestones**:
${spine.dates.slice(0, 2).map((d) => `• ${d.key}: ${d.value}`).join('\n')}

🔍 **Why it matters**:
${spine.claims[0] || 'Single Source of Truth ensures zero hallucination across social and enterprise formats.'}

#AI #ContentTransformation #Innovation #SIH2026 #GovTech`;
        return { title, content: text };
      }

      case 'X_THREAD': {
        const title = `X Thread: 5-Part Breakdown (${audience})`;
        const data = {
          tweets: [
            {
              tweetNumber: 1,
              content: `1/5 🧵 How to convert complex reports into 7 communication formats without fact drift? Here is how the Content Spine architecture solves it:`,
            },
            {
              tweetNumber: 2,
              content: `2/5 📊 Locked Metrics: ${lockedNumbersStr}. These metrics remain 100% consistent across Executive Summaries, Advisories, and Video Scripts.`,
            },
            {
              tweetNumber: 3,
              content: `3/5 🗓️ Key Dates & Milestones: ${lockedDatesStr}. Guaranteed lock on timeline accuracy.`,
            },
            {
              tweetNumber: 4,
              content: `4/5 🛡️ Risk Mitigation: ${spine.risks[0] || 'No fact drift permitted.'}`,
            },
            {
              tweetNumber: 5,
              content: `5/5 🔗 Summary & Source Traceability: Complete mapping back to source document snippets. Learn more at #SIH2026`,
            },
          ],
        };
        return { title, content: JSON.stringify(data, null, 2) };
      }

      case 'ADVISORY': {
        const title = `Government & Policy Advisory Notice (${audience})`;
        const text = `# OFFICIAL ADVISORY NOTICE

**ISSUING BODY**: ${mainOrg}
**CLASSIFICATION**: Public Guidance / Policy Directive
**AUDIENCE PROFILE**: ${audience}
**DATE OF ISSUANCE**: ${spine.dates[0]?.value || '2026-08-24'}

---

### 1. SUBJECT & CONTEXT
${spine.summary}

### 2. LOCKED FACTUAL DIRECTIVES & METRICS
- Verified Timeline: ${lockedDatesStr}
- Enforced Impact Metrics: ${lockedNumbersStr}

### 3. MANDATORY ACTION ITEMS
${spine.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 4. COMPLIANCE & RISK AUDIT
${spine.risks.map((r) => `[!] ${r}`).join('\n')}

*Verified against Content Spine Fact Lock Layer.*`;
        return { title, content: text };
      }

      case 'PRESENTATION': {
        const title = `Executive Presentation Deck (${audience})`;
        const slides = [
          {
            slideNumber: 1,
            title: `AI Content Transformation Platform`,
            bulletPoints: [
              `SIH 2026 Solution Blueprint`,
              `Single Source of Truth Architecture`,
              `Audience: ${audience}`,
            ],
            speakerNotes: `Welcome everyone. Today we present the Content Spine approach.`,
          },
          {
            slideNumber: 2,
            title: `Core Factual Metrics`,
            bulletPoints: spine.numbers.map((n) => `${n.key}: ${n.value}`),
            visualPrompt: `High tech dashboard displaying data metrics ${lockedNumbersStr}`,
            speakerNotes: `Notice these numbers are fact-locked across all outputs.`,
          },
          {
            slideNumber: 3,
            title: `Timeline & Key Milestones`,
            bulletPoints: spine.dates.map((d) => `${d.key}: ${d.value}`),
            visualPrompt: `Clean horizontal timeline showing dates ${lockedDatesStr}`,
            speakerNotes: `Milestones are locked directly from source document extraction.`,
          },
          {
            slideNumber: 4,
            title: `Strategic Recommendations`,
            bulletPoints: spine.recommendations,
            visualPrompt: `Checklist of key actionable recommendations`,
            speakerNotes: `Implementation roadmap for maximum consistency.`,
          },
        ];
        return { title, content: JSON.stringify(slides, null, 2) };
      }

      case 'INFOGRAPHIC': {
        const title = `Infographic Visual Data Sheet (${audience})`;
        const infoData = {
          title: `Content Transformation Platform at a Glance`,
          subtitle: `Factual Consistency across 7 Deliverables`,
          keyStats: spine.numbers.map((n) => ({
            label: n.key,
            value: n.value,
          })),
          sections: [
            {
              heading: 'Core Innovation',
              points: [
                'Content Spine Single Source of Truth',
                'Fact Lock Layer Enforcement',
                'Automated Drift Prevention',
              ],
              icon: 'shield-check',
            },
            {
              heading: 'Key Recommendations',
              points: spine.recommendations,
              icon: 'lightbulb',
            },
          ],
          takeaway: `Upload once. Generate everything. Trust every output.`,
        };
        return { title, content: JSON.stringify(infoData, null, 2) };
      }

      case 'VIDEO_PACKAGE': {
        const title = `Complete Video Package: Script & Storyboard (${audience})`;
        const videoData = {
          title: `AI Content Transformation - Video Production Package`,
          targetDurationSeconds: 60,
          narrationScript: `Welcome. Converting complex documents into multi-channel messaging used to cause fact drift. Our platform introduces the Content Spine. With key metrics like ${lockedNumbersStr} and milestones like ${lockedDatesStr} locked in place, every output remains 100 percent consistent. Upload once, generate everything, trust every output.`,
          scenes: [
            {
              sceneNumber: 1,
              timestampRange: '0:00 - 0:15',
              visualDescription: 'Futuristic digital document uploading into a glowing central core.',
              voiceoverSnippet: 'Converting complex documents used to cause fact drift.',
              onScreenText: 'Upload Once',
            },
            {
              sceneNumber: 2,
              timestampRange: '0:15 - 0:35',
              visualDescription: 'Fact Lock Layer highlighting locked dates and metrics with green shields.',
              voiceoverSnippet: `With key metrics like ${lockedNumbersStr} locked in place...`,
              onScreenText: `Locked Metrics: ${lockedNumbersStr}`,
            },
            {
              sceneNumber: 3,
              timestampRange: '0:35 - 1:00',
              visualDescription: 'Split screen displaying 7 simultaneous outputs generating smoothly.',
              voiceoverSnippet: 'Upload once, generate everything, trust every output.',
              onScreenText: 'Zero Fact Drift • 100% Traceability',
            },
          ],
          subtitlesSRT: `1\n00:00:00,000 --> 00:00:15,000\nConverting complex documents used to cause fact drift.\n\n2\n00:00:15,000 --> 00:00:35,000\nWith key metrics like ${lockedNumbersStr} locked in place...\n\n3\n00:00:35,000 --> 00:01:00,000\nUpload once, generate everything, trust every output.`,
        };
        return { title, content: JSON.stringify(videoData, null, 2) };
      }

      default:
        return { title: 'Generated Output', content: spine.summary };
    }
  }

  async validateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    content: string
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Check if locked numbers are missing or altered in output content
    for (const numFact of spine.numbers) {
      if (numFact.isLocked && !content.includes(numFact.value)) {
        issues.push({
          id: `iss-num-${numFact.id}`,
          outputType,
          factKey: numFact.key,
          expectedValue: numFact.value,
          severity: 'CRITICAL',
          description: `Locked metric "${numFact.key}" (${numFact.value}) was not found in the generated output text.`,
          autoFixAvailable: true,
          suggestedFix: `Re-inject "${numFact.key}: ${numFact.value}" into output text.`,
        });
      }
    }

    // Check if locked dates are missing or altered in output content
    for (const dateFact of spine.dates) {
      if (dateFact.isLocked && !content.includes(dateFact.value)) {
        issues.push({
          id: `iss-date-${dateFact.id}`,
          outputType,
          factKey: dateFact.key,
          expectedValue: dateFact.value,
          severity: 'CRITICAL',
          description: `Locked date milestone "${dateFact.key}" (${dateFact.value}) was missing from generated output.`,
          autoFixAvailable: true,
          suggestedFix: `Append milestone date "${dateFact.value}" to generated section.`,
        });
      }
    }

    return issues;
  }
}
