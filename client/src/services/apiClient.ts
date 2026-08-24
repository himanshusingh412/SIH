import type { AudienceProfile, InputCategory, OutputType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

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
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
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
  // Health
  checkHealth: () => request<{ status: string; platform: string }>('/health'),

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

  // Media & Video Conversion
  uploadMediaAsset: (file: File, projectId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);
    return request<{ success: boolean; mediaAsset: any }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  convertMedia: (options: {
    sourceAssetId: string;
    targetFormat?: string;
    resolution?: string;
    quality?: string;
    fps?: string;
    audioBitrate?: string;
    projectId?: string;
  }) =>
    request<{ success: boolean; conversionId: string; status: string; progress: number; sourceAsset: any }>(
      '/media/convert',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      }
    ),

  getConversionStatus: (conversionId: string) =>
    request<{ success: boolean; conversion: any }>(`/media/conversions/${conversionId}`),

  cancelConversion: (conversionId: string) =>
    request<{ success: boolean; message: string }>(`/media/conversions/${conversionId}/cancel`, {
      method: 'POST',
    }),

  listMediaLibrary: (projectId?: string) =>
    request<{ success: boolean; assets: any[]; conversions: any[] }>(
      `/media/library${projectId ? `?projectId=${projectId}` : ''}`
    ),

  deleteMediaAsset: (assetId: string) =>
    request<{ success: boolean; message: string }>(`/media/${assetId}`, {
      method: 'DELETE',
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

  getMediaStreamUrl: (assetId: string) => `${API_BASE}/media/stream/${assetId}`,
  getMediaDownloadUrl: (assetId: string) => `${API_BASE}/media/download/${assetId}`,
};
