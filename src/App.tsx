import { useState, useEffect } from 'react';
import { ThemeProvider } from './app/theme';
import { AppShell, type Workspace } from './app/AppShell';
import { GuidedPathBanner, GUIDED_STEPS } from './features/guided/GuidedPathBanner';
import { HomeScreen } from './features/home/HomeScreen';
import { LearnWorkspace } from './features/learn/LearnWorkspace';
import { IdentifyWorkspace } from './features/identify/IdentifyWorkspace';
import { DiscoverWorkspace } from './features/discover/DiscoverWorkspace';
import { JourneyWorkspace } from './features/journey/JourneyWorkspace';
import { MapWorkspace } from './features/map/MapWorkspace';
import { DictionaryPanel } from './features/dictionary/DictionaryPanel';
import { db, setDatabaseWriteAccess } from './storage/db';
import { exportProject } from './storage/projectIO';
import { getTabOwnership, type OwnershipState } from './app/tabOwnership';

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>('home');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | undefined>();
  const [dictOpen, setDictOpen] = useState(false);
  const [tabState, setTabState] = useState<OwnershipState>('pending');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedStep, setGuidedStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Tab ownership (AT-24)
  useEffect(() => {
    const mgr = getTabOwnership();
    return mgr.subscribe(state => {
      setTabState(state);
      setDatabaseWriteAccess(state === 'owner');
    });
  }, []);

  useEffect(() => {
    const onStorageError = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setStorageError(detail instanceof Error ? detail.message : String(detail));
    };
    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof Error && /dexie|database|storage|quota|read-only/i.test(`${reason.name} ${reason.message}`)) {
        setStorageError(reason.message);
        event.preventDefault();
      }
    };
    window.addEventListener('pjs-storage-error', onStorageError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('pjs-storage-error', onStorageError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  async function openProject(id: string) {
    const project = await db.projects.get(id);
    setProjectId(id);
    setProjectTitle(project?.title);
    setWorkspace('discover');
  }

  function startGuidedMode() {
    setGuidedStep(1);
    setCompletedSteps(new Set());
    setGuidedMode(true);
    setWorkspace('discover');
  }

  function handleGuidedGoToStep(step: typeof GUIDED_STEPS[number]) {
    setGuidedStep(step.id);
    setWorkspace(step.workspace);
  }

  function handleGuidedComplete(stepId: number) {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    const next = GUIDED_STEPS.find(s => s.id === stepId + 1);
    if (next) {
      setGuidedStep(next.id);
      setWorkspace(next.workspace);
    } else {
      setGuidedStep(GUIDED_STEPS.length + 1); // signals "all done"
    }
  }

  async function handleExport(id: string) {
    try {
      await exportProject(id);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleNavigate(w: Workspace) {
    setWorkspace(w);
    if (guidedMode && w !== 'home') {
      const matchingStep = GUIDED_STEPS.find(s => s.workspace === w);
      if (matchingStep) setGuidedStep(matchingStep.id);
    }
  }

  function resetOpenProject() {
    setProjectId(null);
    setProjectTitle(undefined);
    setDictOpen(false);
    setWorkspace('home');
  }

  function renderWorkspace() {
    const pid = projectId ?? '__default__';
    switch (workspace) {
      case 'home':     return <HomeScreen onOpenProject={openProject} activeProjectId={projectId} onProjectsReset={resetOpenProject} onStartGuidedMode={startGuidedMode} onNavigate={handleNavigate} />;
      case 'learn':    return <LearnWorkspace projectId={pid} onOpenProject={openProject} onNavigate={handleNavigate} />;
      case 'identify': return <IdentifyWorkspace projectId={pid} onNavigate={handleNavigate} />;
      case 'discover': return <DiscoverWorkspace projectId={pid} onNavigate={handleNavigate} />;
      case 'journey':  return <JourneyWorkspace projectId={pid} onNavigate={handleNavigate} />;
      case 'map':      return <MapWorkspace projectId={pid} onNavigate={handleNavigate} />;
    }
  }

  const isObserver = tabState === 'observer';

  return (
    <ThemeProvider>
      {/* Read-only banner for non-owner tabs (AT-24) */}
      {isObserver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--warning)', color: '#000', padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600,
        }}>
          <span>Read-only — another tab has edit ownership.</span>
          <button
            className="btn btn-sm"
            style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.15)', border: 'none' }}
            onClick={() => getTabOwnership().requestOwnership()}
          >
            Take ownership
          </button>
        </div>
      )}

      {storageError && (
        <div role="alert" className="callout callout-error" style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 200, maxWidth: 520,
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <strong>Changes were not saved</strong>
          <span style={{ fontSize: 13 }}>{storageError}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {projectId && (
              <button className="btn btn-sm" onClick={() => handleExport(projectId)}>
                Download recovery copy
              </button>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => setStorageError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: isObserver ? 36 : 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppShell
          active={workspace}
          onNavigate={handleNavigate}
          projectTitle={projectTitle}
          projectId={projectId}
          onDictionary={() => setDictOpen(true)}
          onExport={handleExport}
          readOnly={isObserver}
          onStartGuidedMode={projectId && !guidedMode ? startGuidedMode : undefined}
          guidedBanner={guidedMode && projectId ? (
            <GuidedPathBanner
              currentStep={guidedStep}
              completedSteps={completedSteps}
              onGoToStep={handleGuidedGoToStep}
              onComplete={handleGuidedComplete}
              onExit={() => setGuidedMode(false)}
            />
          ) : undefined}
        >
          {renderWorkspace()}
        </AppShell>
      </div>

      {dictOpen && (
        <DictionaryPanel projectId={projectId ?? '__default__'} onClose={() => setDictOpen(false)} />
      )}

    </ThemeProvider>
  );
}
