import type { AudienceProfile, InputCategory, OutputType } from '../types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? '/api'
    : 'http://localhost:5001/api');

export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(message: string, statusCode = 500, details: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
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
      const code = json?.error?.code || 'API_ERROR';
      throw new ApiError(msg, res.status, { code, details: json?.error?.details });
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
};
