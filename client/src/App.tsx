import { useState, useEffect } from 'react';
import { RootLayout } from './layouts/RootLayout';
import { SidebarNav } from './components/SidebarNav';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ResumeStudio } from './components/studios/ResumeStudio';
import { UploadStage } from './components/UploadStage';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ContentSpineViewer } from './components/ContentSpineViewer';
import { ConfigScreen } from './components/ConfigScreen';
import { GenerationProgressScreen } from './components/GenerationProgressScreen';
import { ReviewWorkspace3Pane } from './components/ReviewWorkspace3Pane';
import { ExportModal } from './components/ExportModal';
import { useProject } from './hooks/useProject';
import type { AudienceProfile, InputCategory, OutputType } from './types';

export function App() {
  const [route, setRouteState] = useState<string>(() => {
    return localStorage.getItem('sih_active_route') || 'dashboard';
  });

  const setRoute = (r: string) => {
    setRouteState(r);
    localStorage.setItem('sih_active_route', r);
  };

  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [autoFixAttempt, setAutoFixAttempt] = useState<number>(0);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<OutputType[]>([
    'EXECUTIVE_SUMMARY',
    'LINKEDIN_POST',
    'X_THREAD',
    'ADVISORY',
    'PRESENTATION',
    'INFOGRAPHIC',
    'VIDEO_PACKAGE',
  ]);

  const {
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
  } = useProject();

  // Initial load: restore active project from Neon PostgreSQL if ID saved in URL or localStorage
  useEffect(() => {
    import('./services/apiClient').then(({ apiClient }) => {
      apiClient.checkHealth().then((data) => {
        if (data && data.providers && data.providers.aiProvider) {
          setSelectedProvider(data.providers.aiProvider.toLowerCase());
        }
      }).catch(() => {});
    });

    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('projectId');
    const savedId = urlProjectId || localStorage.getItem('sih_active_project_id');

    if (savedId) {
      loadProject(savedId).then((project) => {
        if (project) {
          const storedRoute = localStorage.getItem('sih_active_route');
          const targetRoute = (storedRoute && storedRoute !== 'processing' && storedRoute !== 'spine') ? storedRoute : 'workspace';
          setRoute(targetRoute);
        } else {
          handleLoadDemo();
        }
      }).catch(() => {
        handleLoadDemo();
      });
    } else {
      handleLoadDemo();
    }
  }, []);

  const handleLoadDemo = async () => {
    const res = await loadDemo();
    if (res && res.projectId) {
      const url = new URL(window.location.href);
      url.searchParams.set('projectId', res.projectId);
      window.history.replaceState({}, '', url.toString());
      setRoute('workspace');
    }
  };

  const handleIngestSubmit = async (category: InputCategory, file: File | null, rawText: string) => {
    setRoute('processing');
    const res = await ingestDoc(category, file, rawText);
    const pId = (res as any)?.projectId || (res as any)?.project?.id;
    if (res && pId) {
      const url = new URL(window.location.href);
      url.searchParams.set('projectId', pId);
      window.history.pushState({}, '', url.toString());
      localStorage.setItem('sih_active_project_id', pId);
      localStorage.setItem('sih_active_route', 'workspace');
      setRoute('workspace');
    } else {
      setRoute('new-transformation');
    }
  };

  const handleProcessingComplete = () => {
    setRoute('workspace');
  };

  const handleConfigSubmit = async (
    types: OutputType[],
    audience: AudienceProfile
  ) => {
    setSelectedOutputTypes(types);
    setRoute('generation');
    await generate(types, audience, selectedProvider);
  };

  const handleGenerationComplete = () => {
    setRoute('workspace');
  };

  // Data transformations for UI components
  const spineData = projectData?.contentSpines?.[0]
    ? {
        summary: projectData.contentSpines[0].summary || 'Structured Content Spine',
        entities: projectData.contentSpines[0].entities || [],
        dates: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'DATE')
          .map((f: any) => ({
            id: f.id,
            key: f.factKey,
            value: f.factValue,
            category: 'DATE',
            isLocked: f.isLocked,
            sourceSnippet: f.references?.[0]?.snippetText || '',
            pageNumber: f.references?.[0]?.pageNumber || 1,
          })),
        numbers: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'NUMBER')
          .map((f: any) => ({
            id: f.id,
            key: f.factKey,
            value: f.factValue,
            category: 'NUMBER',
            isLocked: f.isLocked,
            sourceSnippet: f.references?.[0]?.snippetText || '',
            pageNumber: f.references?.[0]?.pageNumber || 1,
          })),
        locations: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'LOCATION')
          .map((f: any) => f.factValue),
        events: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'EVENT' || f.category === 'TIMELINE')
          .map((f: any) => f.factValue),
        risks: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'RISK')
          .map((f: any) => f.factValue),
        recommendations: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'RECOMMENDATION')
          .map((f: any) => f.factValue),
        claims: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'CLAIM')
          .map((f: any) => f.factValue),
        systemsAffected: (projectData.contentSpines[0].facts || [])
          .filter((f: any) => f.category === 'SYSTEM' || f.category === 'TECHNOLOGY')
          .map((f: any) => f.factValue),
        relationships: [],
        factLocks: (projectData.contentSpines[0].facts || []).map((f: any) => ({
          id: f.id,
          key: f.factKey,
          value: f.factValue,
          category: f.category,
          isLocked: f.isLocked,
          sourceSnippet: f.references?.[0]?.snippetText || '',
          pageNumber: f.references?.[0]?.pageNumber || 1,
        })),
        sourceDocument: projectData.sourceDocuments?.[0] || null,
      }
    : null;

  const outputs = (projectData?.outputs || []).map((o: any) => {
    const curVer = o.versions?.find((v: any) => v.id === o.currentVersionId) || o.versions?.[0];
    return {
      id: o.id,
      outputType: o.outputType,
      audienceProfile: o.audienceProfile?.name || 'EXECUTIVE',
      title: curVer?.title || o.outputType,
      content: curVer?.content || '',
      isConsistent: o.isConsistent,
    };
  });

  const latestVal = projectData?.validationResults?.[0];
  const validationReport = latestVal
    ? (() => {
        let parsed: any;
        try {
          parsed = JSON.parse(latestVal.issuesFound || 'null');
        } catch {
          parsed = null;
        }

        let issues: any[] = [];
        let summary = { factsChecked: 0, passedCount: 0, warningsCount: 0, errorsCount: 0 };

        if (parsed && parsed._summary) {
          issues = parsed.issues || [];
          summary = parsed._summary;
        } else if (Array.isArray(parsed)) {
          issues = parsed;
          const errors = issues.filter((i: any) => i.severity === 'CRITICAL').length;
          const warnings = issues.filter((i: any) => i.severity === 'WARNING').length;
          summary = {
            factsChecked: issues.length + (latestVal.passed ? 10 : 0),
            passedCount: latestVal.passed ? issues.length + 10 : 0,
            warningsCount: warnings,
            errorsCount: errors,
          };
        }

        const humanReviewRequired = issues.some(
          (i: any) => i.id === 'human-review-required'
        );

        return {
          consistencyScore: latestVal.consistencyScore,
          passed: latestVal.passed,
          factsChecked: summary.factsChecked,
          passedCount: summary.passedCount,
          warningsCount: summary.warningsCount,
          errorsCount: summary.errorsCount,
          issues,
          autoCorrected: latestVal.autoCorrected,
          humanReviewRequired,
          verifiedAt: latestVal.createdAt,
        };
      })()
    : null;

  return (
    <RootLayout error={error} onClearError={() => setError(null)} isLoading={isLoading}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Sidebar */}
        <SidebarNav
          currentRoute={route}
          onNavigate={(r) => setRoute(r)}
          activeProjectTitle={projectData?.title}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', minWidth: 0 }}>
          <Header
            onLoadDemo={handleLoadDemo}
            onOpenExport={() => setShowExportModal(true)}
            isLoading={isLoading}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            activeRoute={route}
          />

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {/* Screen 1: Dashboard / Projects */}
            {(route === 'dashboard' || route === 'projects') && (
              <DashboardPage
                projects={projectData ? [projectData] : []}
                onStartNew={() => setRoute('new-transformation')}
                onOpenProject={() => setRoute('workspace')}
              />
            )}

            {/* Persistent History Route */}
            {route === 'history' && (
              <HistoryPage
                projectId={projectData?.id || ''}
                onOpenConversation={(convId) => {
                  setActiveConversationId(convId);
                  setRoute('agents');
                }}
                onStartNewConversation={() => {
                  setActiveConversationId(undefined);
                  setRoute('agents');
                }}
              />
            )}

            {/* AI Agents Route */}
            {route === 'agents' && (
              <AgentsPage
                projectId={projectData?.id || ''}
                spine={spineData}
                selectedProvider={selectedProvider}
                activeConversationId={activeConversationId}
                onConversationChange={(convId) => setActiveConversationId(convId)}
              />
            )}

            {/* Resume Studio Route */}
            {route === 'resume-studio' && <ResumeStudio />}

            {/* Analytics Route */}
            {route === 'analytics' && <AnalyticsPage />}

            {/* Settings Route */}
            {route === 'settings' && <SettingsPage />}

            {/* Screen 2: New Transformation */}
            {route === 'new-transformation' && (
              <UploadStage
                onIngest={handleIngestSubmit}
                isLoading={isLoading}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {/* Screen 3: Upload Processing */}
            {route === 'processing' && (
              <ProcessingScreen onComplete={handleProcessingComplete} />
            )}

            {/* Screen 4: Content Spine */}
            {route === 'spine' && (
              <ContentSpineViewer
                spine={spineData}
                isLoading={isLoading}
                error={error}
                projectTitle={projectData?.title}
                sourceDocument={projectData?.sourceDocuments?.[0]}
                onToggleLock={(id, isLocked) => toggleLock(id, isLocked)}
                onNext={() => setRoute('config')}
                onStartNew={() => setRoute('new-transformation')}
                onRetry={() => {
                  if (projectData?.id) loadProject(projectData.id);
                }}
              />
            )}

            {/* Screen 5 & 6: Configuration & Output Cards */}
            {route === 'config' && (
              <ConfigScreen
                onGenerate={handleConfigSubmit}
                isLoading={isLoading}
              />
            )}

            {/* Screen 7: Generation Progress Screen */}
            {route === 'generation' && (
              <GenerationProgressScreen
                selectedTypes={selectedOutputTypes}
                onComplete={handleGenerationComplete}
              />
            )}

            {/* Screen 8 & 9: Review Workspace 3-Pane Layout & Validation */}
            {(route === 'workspace' || route === 'validation') && (
              <ReviewWorkspace3Pane
                projectTitle={projectData?.title}
                outputs={outputs}
                spine={spineData}
                validationReport={validationReport}
                onToggleLock={(id, isLocked) => toggleLock(id, isLocked)}
                onAutoCorrect={async () => {
                  setAutoFixAttempt((prev) => Math.min(prev + 1, 3));
                  await autoFix();
                }}
                onRegenerateOutput={(type) => regenerateSingle(type, 'EXECUTIVE', selectedProvider)}
                onInjectTestErrors={(injections) => injectErrors(injections)}
                onOpenExport={() => setShowExportModal(true)}
                isFixing={isLoading}
                autoFixAttempt={autoFixAttempt}
              />
            )}
          </main>
        </div>
      </div>

      {/* Screen 10: Export Modal */}
      {showExportModal && (
        <ExportModal
          projectId={projectData?.id}
          projectTitle={projectData?.title}
          outputs={outputs}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </RootLayout>
  );
}

export default App;
