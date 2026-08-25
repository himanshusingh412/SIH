import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import type { AudienceProfile, InputCategory, OutputType } from '../types';

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(() => {
    return localStorage.getItem('sih_active_project_id');
  });
  const [projectData, setProjectData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync active project ID to localStorage
  const updateActiveProjectId = (id: string | null) => {
    setProjectId(id);
    if (id) {
      localStorage.setItem('sih_active_project_id', id);
    } else {
      localStorage.removeItem('sih_active_project_id');
    }
  };

  // Restore active project state on browser refresh
  useEffect(() => {
    const savedId = localStorage.getItem('sih_active_project_id');
    if (savedId && !projectData) {
      setIsLoading(true);
      apiClient
        .getProject(savedId)
        .then((res) => {
          setProjectData(res.project);
        })
        .catch(() => {
          localStorage.removeItem('sih_active_project_id');
          setProjectId(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const loadDemo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.seedDemo();
      updateActiveProjectId(res.projectId);
      setProjectData(res.project);
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to load demo project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ingestDoc = useCallback(
    async (category: InputCategory, file: File | null, rawText: string) => {
      setIsLoading(true);
      setError(null);
      try {
        let title = file ? file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : '';
        if (!title && rawText) {
          title = rawText.trim().split('\n')[0].slice(0, 45);
        }
        if (!title) {
          title = `${category} Intelligence Briefing`;
        }

        const createRes = await apiClient.createProject({
          title,
          category,
          contentText: rawText,
        });
        const pId = createRes.project.id;

        const ingestRes = await apiClient.ingestDocument(pId, category, file, rawText);
        updateActiveProjectId(pId);
        if (ingestRes && ingestRes.project) {
          setProjectData(ingestRes.project);
        }
        return ingestRes;
      } catch (err: any) {
        setError(err.message || 'Failed to ingest document');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const toggleLock = useCallback(
    async (factId: string, isLocked: boolean) => {
      try {
        await apiClient.toggleFactLock(factId, isLocked);
        if (projectId) {
          const res = await apiClient.getProject(projectId);
          setProjectData(res.project);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to toggle fact lock');
      }
    },
    [projectId]
  );

  const generate = useCallback(
    async (types: OutputType[], audience: AudienceProfile, provider?: string) => {
      if (!projectId) return null;
      setIsLoading(true);
      setError(null);
      try {
        await apiClient.generateOutputs(projectId, types, audience, provider);
        const res = await apiClient.getProject(projectId);
        setProjectData(res.project);
        return res.project;
      } catch (err: any) {
        setError(err.message || 'Failed to generate outputs');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const regenerateSingle = useCallback(
    async (type: OutputType, audience: AudienceProfile, provider?: string) => {
      if (!projectId) return null;
      setIsLoading(true);
      setError(null);
      try {
        await apiClient.regenerateOutput(projectId, type, audience, provider);
        const res = await apiClient.getProject(projectId);
        setProjectData(res.project);
        return res.project;
      } catch (err: any) {
        setError(err.message || `Failed to regenerate ${type}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const autoFix = useCallback(async () => {
    if (!projectId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.autoCorrect(projectId);
      setProjectData(res.project);
      return res.project;
    } catch (err: any) {
      setError(err.message || 'Failed to auto-correct outputs');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const injectErrors = useCallback(
    async (injections: Array<{ outputType: OutputType; find: string; replace: string }>) => {
      if (!projectId) return null;
      setIsLoading(true);
      setError(null);
      try {
        await apiClient.injectTestErrors(projectId, injections);
        const res = await apiClient.getProject(projectId);
        setProjectData(res.project);
        return res.project;
      } catch (err: any) {
        setError(err.message || 'Failed to inject test errors');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const loadProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getProject(id);
      if (res && res.project) {
        updateActiveProjectId(id);
        setProjectData(res.project);
        return res.project;
      } else {
        throw new Error('Project not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projectId,
    projectData,
    isLoading,
    error,
    setError,
    loadDemo,
    loadProject,
    ingestDoc,
    toggleLock,
    generate,
    regenerateSingle,
    autoFix,
    injectErrors,
  };
}
