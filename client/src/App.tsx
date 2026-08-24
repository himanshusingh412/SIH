import { useState, useEffect } from 'react';
import { RootLayout } from './layouts/RootLayout';
import { SidebarNav } from './components/SidebarNav';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CreativeStudioPage } from './pages/CreativeStudioPage';
import { AgentsPage } from './pages/AgentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
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
  const [route, setRoute] = useState<string>('dashboard');
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
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
    ingestDoc,
    toggleLock,
    generate,
    regenerateSingle,
    autoFix,
    injectErrors,
  } = useProject();

  // Initial load
  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleLoadDemo = async () => {
    const res = await loadDemo();
    if (res) {
      setRoute('workspace');
    }
  };

  const handleIngestSubmit = async (category: InputCategory, file: File | null, rawText: string) => {
    setRoute('processing');
    const res = await ingestDoc(category, file, rawText);
    if (!res) {
      setRoute('new-transformation');
    }
  };

  const handleProcessingComplete = () => {
    setRoute('spine');
  };

  const handleConfigSubmit = async (
    types: OutputType[],
    audience: AudienceProfile
  ) => {
    setSelectedOutputTypes(types);
    setRoute('generation');
    await generate(types, audience);
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
        locations: [],
        events: [
          'Source Document Ingestion & Layout Parsing',
          'Fact Lock Layer Verification & Extraction',
          'Multi-Channel Deliverable Generation',
        ],
        risks: [
          'Fact drift occurring when generating multiple outputs independently',
          'Lack of source traceability in standard zero-shot LLM prompts',
        ],
        recommendations: [
          'Establish Content Spine as single immutable source of truth',
          'Enforce Fact Locking on critical dates, metrics & numbers',
        ],
        claims: ['Content Spine architecture eliminates fact drift across all 7 deliverables.'],
        relationships: [
          {
            subject: 'Content Spine',
            relation: 'serves as Single Source of Truth for',
            object: 'Output Generators',
          },
        ],
        factLocks: (projectData.contentSpines[0].facts || []).map((f: any) => ({
          id: f.id,
          key: f.factKey,
          value: f.factValue,
          category: f.category,
          isLocked: f.isLocked,
          sourceSnippet: f.references?.[0]?.snippetText || '',
          pageNumber: f.references?.[0]?.pageNumber || 1,
        })),
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
          <Header
            onLoadDemo={handleLoadDemo}
            onOpenExport={() => setShowExportModal(true)}
            isLoading={isLoading}
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            activeRoute={route}
          />

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {/* Screen 1: Dashboard / Projects / History */}
            {(route === 'dashboard' || route === 'projects' || route === 'history') && (
              <DashboardPage
                projects={projectData ? [projectData] : []}
                onStartNew={() => setRoute('new-transformation')}
                onOpenProject={() => setRoute('workspace')}
              />
            )}

            {/* Creative Studio Route */}
            {route === 'creative-studio' && (
              <CreativeStudioPage
                projectId={projectData?.id || 'demo-project'}
                spine={spineData}
              />
            )}

            {/* AI Agents Route */}
            {route === 'agents' && (
              <AgentsPage
                projectId={projectData?.id || 'demo-project'}
                spine={spineData}
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
            {route === 'spine' && spineData && (
              <ContentSpineViewer
                spine={spineData}
                onToggleLock={(id, isLocked) => toggleLock(id, isLocked)}
                onNext={() => setRoute('config')}
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
                onRegenerateOutput={(type) => regenerateSingle(type, 'EXECUTIVE')}
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
