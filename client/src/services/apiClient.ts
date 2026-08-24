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
      json = await res.json();
    } else {
      const text = await res.text();
      json = {
        success: false,
        error: {
          code: 'INVALID_API_RESPONSE',
          message: text ? text.substring(0, 200) : 'The server returned an unparseable non-JSON response.',
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
  // Health Check
  checkHealth: () => request<{ success: boolean; service: string; status: string; providers?: any }>('/health'),
  checkAiHealth: () => request<{ success: boolean; provider: string; model: string; demoMode: boolean }>('/health/ai'),

  // Projects
  listProjects: () => request<{ projects: any[] }>('/projects'),
  createProject: (title: string, description?: string) =>
    request<{ project: any }>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    }),
  getProject: (projectId: string) => request<{ project: any }>(`/projects/${projectId}`),

  // Seed Demo
  seedDemo: () =>
    request<{
      projectId: string;
      project: any;
      spine: any;
      outputs: any[];
      validationResult: any;
    }>('/projects/seed-demo', { method: 'POST' }),

  // Document Ingestion
  ingestDocument: (projectId: string, category: InputCategory, file: File | null, rawText?: string) => {
    const formData = new FormData();
    formData.append('category', category);
    if (rawText) formData.append('rawText', rawText);
    if (file) formData.append('file', file);

    return request<{ documentId: string; project: any; spine: any }>(
      `/projects/${projectId}/ingest`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // Fact Lock Toggle
  toggleFactLock: (factId: string, isLocked: boolean) =>
    request<{ fact: any }>(`/fact-locks/${factId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked }),
    }),

  // Output Generation
  generateOutputs: (projectId: string, outputTypes: OutputType[], audienceProfile: AudienceProfile) =>
    request<{ outputs: any[]; validationResult: any }>(`/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputTypes, audience: audienceProfile }),
    }),

  // Single Output Regeneration
  regenerateOutput: (projectId: string, outputType: OutputType, audienceProfile: AudienceProfile) =>
    request<{ outputs: any[]; validationResult: any }>(`/projects/${projectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputTypes: [outputType], audience: audienceProfile }),
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

  runAgentTest: (projectId?: string, agentId?: string, testCases?: any[]) =>
    request<{
      testId: string;
      agentId: string;
      status: string;
      summary: { total: number; passed: number; failed: number; passRate: string };
      tests: Array<{ id: string; name: string; query: string; expected: string; actual: string; status: string; details: string }>;
    }>('/agents/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, agentId: agentId || 'demo-agent-id', testCases }),
    }),
};
