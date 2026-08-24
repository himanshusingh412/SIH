import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { FactLockEngine } from '../../validators/factLockEngine';
import { AdvisoryGenerator } from '../generators/advisoryGenerator';
import { ExecutiveSummaryGenerator } from '../generators/executiveSummaryGenerator';
import { InfographicGenerator } from '../generators/infographicGenerator';
import { LinkedInPostGenerator } from '../generators/linkedinPostGenerator';
import { PresentationGenerator } from '../generators/presentationGenerator';
import { VideoPackageGenerator } from '../generators/videoPackageGenerator';
import { XThreadGenerator } from '../generators/xThreadGenerator';
import { AIProviderInstance, ProviderType } from './types';

export class MockProvider implements AIProviderInstance {
  name = 'Mock AI Provider (Offline / Deterministic Demo Mode)';
  type: ProviderType = 'MOCK';
  private factEngine = new FactLockEngine();

  private generators = {
    EXECUTIVE_SUMMARY: new ExecutiveSummaryGenerator(),
    LINKEDIN_POST: new LinkedInPostGenerator(),
    X_THREAD: new XThreadGenerator(),
    ADVISORY: new AdvisoryGenerator(),
    PRESENTATION: new PresentationGenerator(),
    INFOGRAPHIC: new InfographicGenerator(),
    VIDEO_PACKAGE: new VideoPackageGenerator(),
  };

  async extractContentSpine(rawText: string, _category: InputCategory): Promise<ContentSpineData> {
    const summaryText = rawText.length > 50 ? rawText.slice(0, 300) : 'Content Spine Single Source of Truth Summary.';

    // Dynamically classify & lock facts from input text
    const extractedFacts = this.factEngine.classifyAndLockFacts(rawText, []);

    // Extract dynamic organizations & locations from text if present
    const orgMatches = rawText.match(/(?:Organization|Company|Lab|Ministry|Agency|Project):\s*([A-Za-z0-9\s]+)/i);
    const locMatches = rawText.match(/(?:Location|City|Region|Country):\s*([A-Za-z0-9\s]+)/i);

    const mainOrg = orgMatches ? orgMatches[1].trim() : 'SIH Innovation Authority';
    const mainLoc = locMatches ? locMatches[1].trim() : 'New Delhi, India';

    const dates = extractedFacts.filter((f) => f.category === 'DATE');
    const numbers = extractedFacts.filter((f) => f.category === 'NUMBER');

    return {
      summary: `Content Spine extraction: ${summaryText}`,
      entities: [
        { id: '1', name: mainOrg, type: 'ORGANIZATION', confidence: 0.98, sourceReference: 'Page 1' },
        { id: '2', name: 'SIH 2026 AI Engine', type: 'TECHNOLOGY', confidence: 0.99, sourceReference: 'Page 1' },
      ],
      dates: dates.map((d, i) => ({
        id: `d${i + 1}`,
        key: d.key,
        value: d.value,
        category: 'DATE' as const,
        isLocked: true,
        sourceSnippet: d.sourceSnippet,
        pageNumber: d.pageNumber,
      })),
      numbers: numbers.map((n, i) => ({
        id: `n${i + 1}`,
        key: n.key,
        value: n.value,
        category: 'NUMBER' as const,
        isLocked: true,
        sourceSnippet: n.sourceSnippet,
        pageNumber: n.pageNumber,
      })),
      locations: [
        { id: 'loc1', name: mainLoc, type: 'LOCATION', confidence: 0.95, sourceReference: 'Page 1' },
      ],
      events: ['Source Layout Ingestion', 'Fact Lock Layer Extraction', 'Multi-Deliverable Generation'],
      risks: ['Fact drift across independently generated outputs', 'Unverified statistics in zero-shot LLM prompts'],
      recommendations: ['Establish Content Spine as single source of truth', 'Verify source references before release'],
      claims: [extractedFacts.find((f) => f.category === 'CLAIM')?.value || summaryText],
      relationships: [
        { subject: 'Content Spine', relation: 'anchors', object: 'Output Generators' },
      ],
      factLocks: extractedFacts.map((f, i) => ({
        id: `fl${i + 1}`,
        key: f.key,
        value: f.value,
        category: f.category,
        isLocked: f.isLocked,
        sourceSnippet: f.sourceSnippet,
        pageNumber: f.pageNumber,
      })),
    };
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    const generator = this.generators[outputType];
    if (!generator) {
      return {
        title: `${outputType} Output`,
        content: `Generated content for ${outputType} anchored to Content Spine summary: ${spine.summary}`,
      };
    }

    return generator.generate(spine, audience);
  }

  async validateOutput(
    _spine: ContentSpineData,
    _outputType: OutputType,
    _content: string
  ): Promise<ValidationIssue[]> {
    return [];
  }
}
