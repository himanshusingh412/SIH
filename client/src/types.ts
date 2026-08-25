export type InputCategory =
  | 'PDF'
  | 'REPORT'
  | 'ARTICLE'
  | 'RESEARCH_PAPER'
  | 'THREAT_INTEL'
  | 'POLICY'
  | 'IMAGE'
  | 'VIDEO'
  | 'PROMPT'
  | 'AUDIO';

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

export type AppRoute =
  | 'dashboard'
  | 'projects'
  | 'spine'
  | 'agents'
  | 'history'
  | 'analytics'
  | 'settings'
  | 'new-transformation'
  | 'processing'
  | 'configuration'
  | 'workspace';

export interface FactItem {
  id: string;
  key: string;
  value: string;
  category: string;
  isLocked: boolean;
  sourceSnippet?: string;
  pageNumber?: number;
}

export interface EntityItem {
  id: string;
  name: string;
  type: string;
  confidence: number;
  sourceReference: string;
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

export interface GeneratedOutput {
  id: string;
  outputType: OutputType;
  audienceProfile: AudienceProfile;
  title: string;
  content: string;
  isConsistent: boolean;
}

export interface ValidationIssue {
  id: string;
  outputType: OutputType;
  factKey: string;
  expectedValue: string;
  foundValue?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  autoFixAvailable?: boolean;
  suggestedFix?: string;
}

export interface ValidationReportData {
  consistencyScore: number;
  passed: boolean;
  factsChecked: number;
  passedCount: number;
  warningsCount: number;
  errorsCount: number;
  issues: ValidationIssue[];
  autoCorrected: boolean;
  humanReviewRequired?: boolean;
  verifiedAt: string;
  summary?: string;
  errors?: Array<{ deliverableType: string; claimKey?: string; foundValue?: string; expectedValue?: string }>;
}

export interface ProjectData {
  id: string;
  title: string;
  description?: string;
  spine?: ContentSpineData;
  outputs?: GeneratedOutput[];
  validationReport?: ValidationReportData;
}

export interface VoiceProfile {
  id: string;
  voiceId: string;
  name: string;
  provider: string;
  category: string;
  language: string;
  gender: string;
  previewUrl?: string;
  description?: string;
  isCloned?: boolean;
  consentConfirmed?: boolean;
}

export interface AnalyticsData {
  totalProjects: number;
  totalContentSpines: number;
  totalFactsLocked: number;
  totalOutputsGenerated: number;
  totalVoiceGenerations: number;
  totalTranscriptions: number;
  totalDubbingJobs: number;
  totalAgentSessions: number;
  totalMediaAssets: number;
  avgConsistencyScore: number;
}
