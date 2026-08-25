import type { AudienceProfile, InputCategory, OutputType } from '../types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? '/api'
    : 'http://localhost:5001/api');

export class ApiError extends Error {
  statusCode: number;
  code: string;
  retryAfterSeconds?: number;
  details: any;

  constructor(message: string, statusCode = 500, details: any = null, code = 'API_ERROR', retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    let json: any;

    if (contentType.includes('application/json')) {
      try {
        json = await res.json();
      } catch {
        json = {
          success: false,
          error: { code: 'INVALID_JSON', message: 'The server returned invalid JSON data.' },
        };
      }
    } else {
      const text = await res.text();
      json = {
        success: false,
        error: {
          code: 'INVALID_API_RESPONSE',
          message: text && !text.startsWith('<') ? text.substring(0, 200) : `The server returned HTTP ${res.status} error.`,
        },
      };
    }

    if (!res.ok || json.success === false) {
      const msg =
        json?.error?.message ||
        (typeof json?.error === 'string' ? json.error : `HTTP ${res.status} Error`);
      const code = json?.error?.code || (res.status === 429 ? 'GEMINI_RATE_LIMITED' : 'API_ERROR');
      const retryAfter = json?.error?.retryAfterSeconds || (res.status === 429 ? 45 : undefined);
      throw new ApiError(msg, res.status, { code, details: json?.error?.details }, code, retryAfter);
    }

    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network communication error', 500);
  }
}

export const apiClient = {
  // Health
  checkHealth: () => request<{ status: string; providers: any }>('/health'),
  checkAiHealth: () => request<{ provider: string; model: string }>('/health/ai'),

  // AI Providers API
  getAIProviders: () =>
    request<{
      providers: Record<
        string,
        { id: string; name: string; model: string; configured?: boolean; available?: boolean }
      >;
      defaultProvider: string;
    }>('/ai/providers'),

  testAIProvider: (provider: string) =>
    request<{ provider: string; status: string; model?: string }>('/ai/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    }),

  generateAIOutput: (options: {
    provider: string;
    prompt?: string;
    projectId?: string;
    contentSpineId?: string;
    outputType?: OutputType;
    audience?: AudienceProfile;
  }) =>
    request<{
      provider: string;
      model: string;
      title: string;
      content: string;
      outputType: OutputType;
      audience: AudienceProfile;
      validation: any;
    }>('/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  // Seed Demo
  seedDemo: () =>
    request<{ projectId: string; project: any }>('/projects/seed-demo', {
      method: 'POST',
    }),

  // Project Endpoints
  createProject: (titleOrData: string | { title: string; category?: InputCategory; contentText?: string }) => {
    const body = typeof titleOrData === 'string' ? { title: titleOrData, category: 'PROMPT' } : titleOrData;
    return request<{ project: any }>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  ingestDocument: (projectId: string, category: InputCategory, file: File | null, rawText: string) => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      return request<{ project: any }>(`/projects/${projectId}/ingest`, {
        method: 'POST',
        body: formData,
      });
    }
    return request<{ project: any }>(`/projects/${projectId}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, rawText }),
    });
  },

  toggleFactLock: (factId: string, isLocked: boolean) =>
    request<{ fact: any }>(`/fact-locks/${factId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked }),
    }),

  uploadFile: (file: File, category: InputCategory, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (title) formData.append('title', title);

    return request<{ project: any }>('/projects/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getProject: (id: string) => request<{ project: any }>(`/projects/${id}`),
  listProjects: () => request<{ projects: any[] }>('/projects'),
  deleteProject: (id: string) => request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),

  // Full Pipeline Execution
  runFullPipeline: (
    projectId: string,
    options: {
      outputTypes: OutputType[];
      audience: AudienceProfile;
      provider?: string;
    }
  ) =>
    request<{ project: any; validationResult: any }>(`/projects/${projectId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  generateOutputs: (projectId: string, outputTypes: OutputType[], audience: AudienceProfile, provider?: string) =>
    request<{ outputs: any[]; validationResult: any }>(`/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputTypes, audience, provider }),
    }),

  // Single Output Regeneration
  regenerateOutput: (projectId: string, outputType: OutputType, audienceProfile: AudienceProfile, provider?: string) =>
    request<{ outputs: any[]; validationResult: any }>(`/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputTypes: [outputType], audience: audienceProfile, provider }),
    }),

  // Standalone Validation Run
  validateProject: (projectId: string) =>
    request<{ report: any }>(`/projects/${projectId}/validate`, {
      method: 'POST',
    }),

  // Auto Correction
  autoCorrect: (projectId: string) =>
    request<{ project: any }>(`/projects/${projectId}/auto-correct`, {
      method: 'POST',
    }),

  // Test Error Injection
  injectTestErrors: (
    projectId: string,
    injections: Array<{ outputType: OutputType; find: string; replace: string }>
  ) =>
    request<{ results: any[]; validationResult: any }>(`/projects/${projectId}/test-inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ injections }),
    }),

  askKnowledgeAgent: (projectId: string, message: string, conversationId?: string, provider?: string) =>
    request<{
      answer: string;
      provider: string;
      model: string;
      conversationId: string;
      sources: Array<{ documentId: string; page: number; title: string; snippet: string }>;
      grounded: boolean;
      toolCalls?: any[];
    }>('/agents/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message, conversationId, provider }),
    }),

  runAgentTest: (projectId?: string, agentId?: string, testCases?: any[], provider?: string) =>
    request<{
      testId: string;
      agentId: string;
      status: string;
      summary: { total: number; passed: number; failed: number; passRate: string };
      tests: Array<{ id: string; name: string; query: string; expected: string; actual: string; status: string; details: string }>;
    }>('/agents/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, agentId: agentId || 'demo-agent-id', testCases, provider }),
    }),

  // Persistent History & Conversation Endpoints (Neon PostgreSQL)
  getConversations: (projectId: string, search?: string) =>
    request<Array<{
      id: string;
      projectId: string;
      title: string;
      provider: string;
      model: string;
      lastMessage: string | null;
      createdAt: string;
      updatedAt: string;
    }>>(`/conversations?projectId=${encodeURIComponent(projectId)}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getConversation: (id: string) =>
    request<{
      conversation: {
        id: string;
        projectId: string;
        title: string;
        provider: string;
        model: string;
        createdAt: string;
        updatedAt: string;
      };
      messages: Array<{
        id: string;
        conversationId: string;
        role: 'USER' | 'ASSISTANT' | 'SYSTEM';
        content: string;
        provider?: string;
        model?: string;
        sources?: Array<{ documentId: string; page: number; title: string; snippet: string }>;
        grounded?: boolean;
        isError?: boolean;
        createdAt: string;
      }>;
    }>(`/conversations/${id}`),

  createConversation: (projectId: string, title?: string, provider = 'gemini', model = 'gemini-3.1-flash-lite') =>
    request<{
      id: string;
      projectId: string;
      title: string;
      provider: string;
      model: string;
      createdAt: string;
      updatedAt: string;
    }>('/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title, provider, model }),
    }),

  renameConversation: (id: string, title: string) =>
    request<{ id: string; title: string; updatedAt: string }>(`/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (id: string) =>
    request<{ message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    }),

  // Resume Intelligence & ATS Studio Endpoints
  importExistingResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{
      resumeId: string;
      resume: any;
      candidateSpine: any;
      detectedSections: {
        personal: boolean;
        summary: boolean;
        experiences: boolean;
        education: boolean;
        skills: boolean;
        projects: boolean;
        certifications: boolean;
        achievements: boolean;
      };
      filename: string;
      fileSize: number;
    }>('/resume/import', {
      method: 'POST',
      body: formData,
    });
  },

  createOrParseResume: (rawText: string, title?: string, projectId?: string, resumeId?: string) =>
    request<{ resumeId: string; resume: any; candidateSpine: any }>('/resume/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, title, projectId, resumeId }),
    }),

  saveResume: (id: string, candidateSpine: any, title?: string, targetRole?: string) =>
    request<{ resume: any; message: string }>('/resume/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, candidateSpine, title, targetRole }),
    }),

  getResume: (id: string) => request<{ resume: any; candidateSpine: any }>(`/resume/${id}`),

  parseJobDescription: (rawText: string, title?: string, company?: string) =>
    request<{ jobId: string; jobSpine: any; job: any }>('/job/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, title, company }),
    }),

  runATSScan: (options: { resumeId?: string; jobId?: string; resumeText?: string; jobText?: string }) =>
    request<{ report: any; candidate: any; job: any; scanId?: string }>('/resume/ats-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  optimizeResume: (options: { resumeId?: string; jobId?: string; resumeText?: string; jobText?: string }) =>
    request<{ optimizedPackage: any }>('/resume/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  getResumeVersions: (resumeId: string) =>
    request<{ versions: any[] }>(`/resume/${encodeURIComponent(resumeId)}/versions`),

  createResumeVersion: (
    resumeId: string,
    data: {
      versionName?: string;
      targetJobTitle?: string;
      targetCompany?: string;
      atsScore?: number;
      optimizedContent?: any;
      changesSummary?: any;
    }
  ) =>
    request<{ version: any }>(`/resume/${encodeURIComponent(resumeId)}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  restoreResumeVersion: (resumeId: string, versionId: string) =>
    request<{ version: any; candidateSpine: any }>(`/resume/${encodeURIComponent(resumeId)}/versions/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    }),

  deleteResumeVersion: (resumeId: string, vId: string) =>
    request<{ message: string }>(`/resume/${encodeURIComponent(resumeId)}/versions/${encodeURIComponent(vId)}`, {
      method: 'DELETE',
    }),

  generateCoverLetter: (options: { resumeId?: string; jobId?: string; resumeText?: string; jobText?: string }) =>
    request<{ coverLetter: string }>('/resume/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  generateLinkedInProfile: (options: { resumeId?: string; resumeText?: string }) =>
    request<{ linkedInProfile: any }>('/resume/linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }),

  getResumeAnalytics: (resumeId: string) =>
    request<{ analytics: any }>(`/resume/${encodeURIComponent(resumeId)}/analytics`),

  getDashboardStats: () => request<{ stats: any }>('/projects/dashboard-stats'),

  getDatabaseDiagnostics: () =>
    request<{
      databaseConfigured: boolean;
      productionDatabase: boolean;
      provider: string;
      connection: string;
      schema: string;
    }>('/health/db-diagnostics'),
};
