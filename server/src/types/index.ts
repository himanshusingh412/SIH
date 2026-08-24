export type InputCategory =
  | 'PDF'
  | 'REPORT'
  | 'ARTICLE'
  | 'RESEARCH_PAPER'
  | 'THREAT_INTEL'
  | 'POLICY'
  | 'IMAGE'
  | 'VIDEO'
  | 'PROMPT';

export type OutputType =
  | 'EXECUTIVE_SUMMARY'
  | 'LINKEDIN_POST'
  | 'X_THREAD'
  | 'ADVISORY'
  | 'PRESENTATION'
  | 'INFOGRAPHIC'
  | 'VIDEO_PACKAGE';

export type AudienceProfile =
  | 'EXECUTIVE'
  | 'TECHNICAL'
  | 'GOVERNMENT'
  | 'PUBLIC';

export interface EntityItem {
  id: string;
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'TECHNOLOGY' | 'OTHER';
  confidence: number;
  sourceReference: string;
}

export interface FactItem {
  id: string;
  key: string;
  value: string;
  category: 'DATE' | 'NUMBER' | 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'ENTITY' | 'CLAIM' | 'RISK' | 'RECOMMENDATION';
  isLocked: boolean;
  sourceSnippet: string;
  pageNumber?: number;
}

export interface ContentSpineData {
  summary: string;
  entities: EntityItem[];
  dates: FactItem[];
  numbers: FactItem[];
  locations: EntityItem[];
  events: string[];
  risks: string[];
  recommendations: string[];
  claims: string[];
  relationships: Array<{ subject: string; relation: string; object: string }>;
  factLocks: FactItem[];
}

export interface PresentationSlide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  visualPrompt?: string;
  speakerNotes?: string;
}

export interface InfographicData {
  title: string;
  subtitle: string;
  keyStats: Array<{ label: string; value: string; unit?: string }>;
  sections: Array<{ heading: string; points: string[]; icon?: string }>;
  takeaway: string;
}

export interface VideoPackageData {
  title: string;
  objective: string;
  audience: string;
  targetDurationSeconds: number;
  narrationScript: string;
  scenes: Array<{
    sceneNumber: number;
    timestampRange: string;
    visualDescription: string;
    voiceoverSnippet: string;
    onScreenText: string;
  }>;
  storyboardNotes: string;
  narrationVoiceStyle: string;
  subtitlesSRT: string;
  callToAction: string;
}

export interface XThreadData {
  tweets: Array<{ tweetNumber: number; content: string }>;
}

export interface ValidationIssue {
  id: string;
  outputType: OutputType;
  factKey: string;
  expectedValue: string;
  foundValue?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  autoFixAvailable: boolean;
  suggestedFix?: string;
}

export interface ValidationReportData {
  consistencyScore: number;
  passed: boolean;
  issues: ValidationIssue[];
  autoCorrected: boolean;
  verifiedAt: string;
}

export interface AIProvider {
  name: string;
  extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData>;
  generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }>;
  validateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    content: string
  ): Promise<ValidationIssue[]>;
}
