import { useState, useEffect, useRef } from 'react';
import { Plus, FolderOpen, BookOpen, Upload, AlertCircle, CheckCircle, Trash2, RotateCcw } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import { commitProjectImport, prepareProjectImportFile } from '../../storage/projectIO';
import { buildIT02Scenario } from '../scenarios/it02SaasOnboarding';
import { buildIT03Scenario } from '../scenarios/it03ServiceDesk';
import { buildIT04Scenario } from '../scenarios/it04CloudResources';
import { buildIT05Scenario } from '../scenarios/it05EmployeeAccess';
import { buildIT06Scenario } from '../scenarios/it06MajorIncident';
import { buildIT07Scenario } from '../scenarios/it07SoftwareRelease';
import { buildIT08Scenario } from '../scenarios/it08ApiIntegration';
import { buildIT09Scenario } from '../scenarios/it09SaasRenewal';
import { buildIT10Scenario } from '../scenarios/it10ITProcurement';
import { buildIT11Scenario } from '../scenarios/it11CloudMigration';
import { buildIT12Scenario } from '../scenarios/it12ManagedServiceOnboarding';
import type { ProjectManifest } from '../../domain/contracts/types';
import type { ImportPreview, ImportResult } from '../../storage/projectIO';
import { clearApplicationData, deleteProject } from '../../storage/projectLifecycle';
import type { Workspace } from '../../app/AppShell';

interface Props {
  onOpenProject: (id: string) => void;
  activeProjectId?: string | null;
  onProjectsReset?: () => void;
  onStartGuidedMode?: () => void;
  onNavigate?: (w: Workspace) => void;
}

export function HomeScreen({ onOpenProject, activeProjectId, onProjectsReset, onStartGuidedMode, onNavigate }: Props) {
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadScenario(titlePrefix: string, build: () => ReturnType<typeof buildIT02Scenario>) {
    const existing = await db.projects.where('title').startsWith(titlePrefix).first();
    if (existing) { onOpenProject(existing.id); return; }
    const s = build();
    await db.transaction('rw',
      [db.projects, db.candidates, db.processes, db.personas, db.systems,
       db.channels, db.touchpoints, db.journeys, db.stages, db.steps,
       db.rows, db.cells, db.cards, db.painPoints,
       db.interviews, db.interviewItems, db.observations, db.stormingCards, db.contradictions,
       db.sipocDiagrams, db.sipocRows, db.processMaps, db.mapLanes, db.mapActivities, db.mapEdges],
      async () => {
        await db.projects.add(s.manifest);
        if (s.candidates.length) await db.candidates.bulkAdd(s.candidates);
        if (s.processes.length) await db.processes.bulkAdd(s.processes);
        if (s.personas.length) await db.personas.bulkAdd(s.personas);
        if (s.systems.length) await db.systems.bulkAdd(s.systems);
        if (s.channels.length) await db.channels.bulkAdd(s.channels);
        if (s.touchpoints.length) await db.touchpoints.bulkAdd(s.touchpoints);
        if (s.journeys.length) await db.journeys.bulkAdd(s.journeys);
        if (s.stages.length) await db.stages.bulkAdd(s.stages);
        if (s.steps.length) await db.steps.bulkAdd(s.steps);
        if (s.rows.length) await db.rows.bulkAdd(s.rows);
        if (s.cells.length) await db.cells.bulkAdd(s.cells);
        if (s.cards.length) await db.cards.bulkAdd(s.cards);
        if (s.painPoints.length) await db.painPoints.bulkAdd(s.painPoints);
        if (s.interviews?.length) await db.interviews.bulkAdd(s.interviews);
        if (s.interviewItems?.length) await db.interviewItems.bulkAdd(s.interviewItems);
        if (s.observations?.length) await db.observations.bulkAdd(s.observations);
        if (s.stormingCards?.length) await db.stormingCards.bulkAdd(s.stormingCards);
        if (s.contradictions?.length) await db.contradictions.bulkAdd(s.contradictions);
        if (s.sipocDiagrams?.length) await db.sipocDiagrams.bulkAdd(s.sipocDiagrams);
        if (s.sipocRows?.length) await db.sipocRows.bulkAdd(s.sipocRows);
        if (s.processMaps?.length) await db.processMaps.bulkAdd(s.processMaps);
        if (s.mapLanes?.length) await db.mapLanes.bulkAdd(s.mapLanes);
        if (s.mapActivities?.length) await db.mapActivities.bulkAdd(s.mapActivities);
        if (s.mapEdges?.length) await db.mapEdges.bulkAdd(s.mapEdges);
      }
    );
    const updated = await db.projects.orderBy('updatedAt').reverse().toArray();
    setProjects(updated);
    onOpenProject(s.manifest.id);
  }

  const SCENARIO_PACKS = [
    { id: 'IT-01', label: 'Employee hardware incident (beginner challenges)',  level: 'Beginner',     build: buildIT03Scenario },
    { id: 'IT-02', label: 'SaaS customer onboarding',              level: 'Beginner',     build: buildIT02Scenario },
    { id: 'IT-03', label: 'Employee hardware incident',             level: 'Beginner',     build: buildIT03Scenario },
    { id: 'IT-04', label: 'Developer cloud resource request',       level: 'Intermediate', build: buildIT04Scenario },
    { id: 'IT-05', label: 'New employee access request',            level: 'Intermediate', build: buildIT05Scenario },
    { id: 'IT-06', label: 'Enterprise major incident',              level: 'Intermediate', build: buildIT06Scenario },
    { id: 'IT-07', label: 'Product team software release',          level: 'Advanced',     build: buildIT07Scenario },
    { id: 'IT-08', label: 'Developer API integration',              level: 'Advanced',     build: buildIT08Scenario },
    { id: 'IT-09', label: 'SaaS renewal and cancellation',          level: 'Intermediate', build: buildIT09Scenario },
    { id: 'IT-10', label: 'IT service procurement',                 level: 'Advanced',     build: buildIT10Scenario },
    { id: 'IT-11', label: 'Cloud migration',                        level: 'Advanced',     build: buildIT11Scenario },
    { id: 'IT-12', label: 'Managed service onboarding (capstone)',  level: 'Capstone',     build: buildIT12Scenario },
  ] as const;

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      setImportPreview(await prepareProjectImportFile(file));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function confirmImport() {
    if (!importPreview?.prepared) return;
    setImporting(true);
    try {
      const result = await commitProjectImport(importPreview.prepared);
      setImportResult(result);
      setImportPreview(null);
      if (result.ok) {
        setProjects(await db.projects.orderBy('updatedAt').reverse().toArray());
      }
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    db.projects.orderBy('updatedAt').reverse().toArray().then(setProjects);
  }, []);

  async function createProject() {
    if (!newTitle.trim()) return;
    const now = new Date().toISOString();
    const project: ProjectManifest = {
      id: newId('proj'),
      title: newTitle.trim(),
      description: '',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    await db.projects.add(project);
    setProjects(prev => [project, ...prev]);
    setNewTitle('');
    setCreating(false);
    onOpenProject(project.id);
  }

  async function handleDeleteProject(id: string) {
    try {
      await deleteProject(id);
      setProjects(current => current.filter(item => item.id !== id));
      setConfirmDeleteId(null);
      if (id === activeProjectId) onProjectsReset?.();
    } catch (error) {
      alert(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function handleStartOver() {
    try {
      await clearApplicationData();
      setProjects([]);
      setImportPreview(null);
      setImportResult(null);
      setShowResetConfirm(false);
      onProjectsReset?.();
    } catch (error) {
      alert(`Start over failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="workspace">
      <div className="workspace-narrow">
        {/* ── Hero ── */}
        <div className="home-hero-section">
          <div className="home-hero-left">
            <div className="eyebrow">Process Identification · User Journey · Mapping</div>
            <h1 className="hero-heading" style={{ marginTop: 8, marginBottom: 12 }}>
              Understand processes by identifying,<br />mapping, and improving them
            </h1>
            <p className="hero-desc" style={{ maxWidth: '58ch', marginBottom: 24 }}>
              Process Insight is a learning environment for Business Process Management.
              Identify your organisation's processes, model user journeys, discover pain points,
              and build process maps.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ height: 40, fontSize: 14, padding: '0 20px' }}
                onClick={() => onNavigate?.('learn')}>
                <BookOpen size={16} /> Start learning
              </button>
              <button className="btn" style={{ height: 40, fontSize: 14, padding: '0 20px' }}
                onClick={() => { const el = document.getElementById('scenario-packs'); el?.scrollIntoView({ behavior: 'smooth' }); }}>
                Open a scenario
              </button>
              <button className="btn btn-ghost" style={{ height: 40, fontSize: 14, padding: '0 20px' }}
                onClick={() => setCreating(true)}>
                <Plus size={16} /> Create a project
              </button>
            </div>
          </div>
        </div>

        {/* ── Analysis cycle ── */}
        <h2 className="section-heading" style={{ marginTop: 48, marginBottom: 8 }}>The analysis cycle</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Four workspaces take you from raw evidence to a complete process map.
          Each workspace builds on the previous one.
        </p>
        <div className="cycle-grid">
          {[
            { n: 1, ws: 'identify', name: 'Identify', desc: 'Map process candidates, systems, personas and channels from stakeholder evidence.' },
            { n: 2, ws: 'discover', name: 'Discover', desc: 'Run interviews and observations, then storm events and commands to surface contradictions.' },
            { n: 3, ws: 'journey',  name: 'Journey',  desc: 'Build the user journey map with stages, touchpoints, pain points and sentiment.' },
            { n: 4, ws: 'map',      name: 'Map',      desc: 'Create SIPOC diagrams and process maps with swim lanes, activities and edges.' },
          ].map(step => (
            <button
              key={step.n}
              className="cycle-card"
              onClick={() => onNavigate?.(step.ws as Workspace)}
            >
              <div className="cycle-number">{step.n}</div>
              <div className="cycle-name">{step.name}</div>
              <div className="cycle-desc">{step.desc}</div>
            </button>
          ))}
        </div>

        {/* ── Pick up where you left off ── */}
        {projects.length > 0 && (
          <>
            <h2 className="section-heading" style={{ marginTop: 48, marginBottom: 16 }}>Pick up where you left off</h2>
            <div className="resume-grid">
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="resume-card">
                  <button
                    className="resume-card-link"
                    onClick={() => onOpenProject(p.id)}
                  >
                    <FolderOpen size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                  <div className="resume-card-actions">
                    {confirmDeleteId === p.id ? (
                      <>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Delete?</span>
                        <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none' }} onClick={() => handleDeleteProject(p.id)}>Yes</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(p.id)} aria-label={`Delete ${p.title}`}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {projects.length > 3 && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>+{projects.length - 3} more projects</span>
                {showResetConfirm ? (
                  <div className="callout callout-error" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Delete ALL?</span>
                    <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none' }} onClick={handleStartOver}>Yes, delete everything</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowResetConfirm(true)}>
                    <RotateCcw size={14} /> Start over
                  </button>
                )}
              </div>
            )}
            {projects.length <= 3 && (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                {showResetConfirm ? (
                  <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Delete ALL projects and data?</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This cannot be undone.</span>
                    <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none' }} onClick={handleStartOver}>Yes, delete everything</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowResetConfirm(true)}>
                    <RotateCcw size={14} /> Start over
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Scenario packs ── */}
        <h2 className="section-heading" id="scenario-packs" style={{ marginTop: 48, marginBottom: 8 }}>IT scenario packs</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Real-world IT scenarios with pre-loaded data across all five workspaces. Load any scenario and explore it immediately.
        </p>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 40 }}>
          {SCENARIO_PACKS.map((sp, i) => {
            const levelColor = sp.level === 'Beginner' ? 'var(--success)' : sp.level === 'Intermediate' ? 'var(--info)' : sp.level === 'Advanced' ? 'var(--warning)' : 'var(--accent)';
            return (
              <div key={sp.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                borderBottom: i < SCENARIO_PACKS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', width: 46, flexShrink: 0 }}>{sp.id}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{sp.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                  background: `color-mix(in srgb, ${levelColor} 12%, transparent)`, color: levelColor,
                }}>{sp.level}</span>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => loadScenario(sp.id, sp.build)}
                  style={{ fontSize: 12 }}
                >
                  <BookOpen size={12} /> Load
                </button>
                {onStartGuidedMode && (
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 12, background: 'var(--primary)', color: '#fff', border: 'none' }}
                    onClick={async () => { await loadScenario(sp.id, sp.build); onStartGuidedMode(); }}
                  >
                    ▶ Guided
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Import / Create ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> New blank project
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload size={14} /> {importing ? 'Importing…' : 'Import .pjs.json'}
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept=".pjs.json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />

        {/* Import preview */}
        {importPreview && (
          <div className={`callout callout-${importPreview.valid ? 'warning' : 'error'}`} style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              {importPreview.valid ? <><AlertCircle size={16} /> Review import: {importPreview.sourceTitle}</> : <><AlertCircle size={16} /> Import file is not valid</>}
            </div>
            {importPreview.errors.map((error, i) => <div key={i} style={{ fontSize: 13 }}>{error}</div>)}
            {importPreview.warnings.map((warning, i) => <div key={i} style={{ fontSize: 13, opacity: 0.85 }}>{warning}</div>)}
            {Object.values(importPreview.counts).some(count => count > 0) && (
              <div style={{ fontSize: 13 }}>{Object.entries(importPreview.counts).filter(([, count]) => count > 0).map(([key, count]) => `${count} ${key}`).join(' · ')}</div>
            )}
            {importPreview.valid && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This creates a new independent project. Nothing has been saved yet.</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {importPreview.valid && importPreview.prepared && (
                <button className="btn btn-primary btn-sm" onClick={confirmImport} disabled={importing}>{importing ? 'Importing…' : 'Import project'}</button>
              )}
              <button className="btn btn-sm" onClick={() => setImportPreview(null)} disabled={importing}>{importPreview.valid ? 'Cancel' : 'Dismiss'}</button>
            </div>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className={`callout callout-${importResult.ok ? 'success' : 'error'}`} style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              {importResult.ok ? <><CheckCircle size={16} /> Project imported</> : <><AlertCircle size={16} /> Import failed</>}
            </div>
            {importResult.errors.map((e, i) => <div key={i} style={{ fontSize: 13 }}>{e}</div>)}
            {importResult.warnings.map((w, i) => <div key={i} style={{ fontSize: 13, opacity: 0.8 }}>{w}</div>)}
            {importResult.ok && <div style={{ fontSize: 13 }}>{Object.entries(importResult.counts).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(' · ')}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {importResult.ok && importResult.projectId && (
                <button className="btn btn-primary btn-sm" onClick={() => { setImportResult(null); onOpenProject(importResult.projectId!); }}>Open project</button>
              )}
              <button className="btn btn-sm" onClick={() => setImportResult(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* Create dialog */}
        {creating && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title-row"><span className="card-title">New project</span></div>
            <div className="field">
              <label className="field-label" htmlFor="new-project-title">Project title</label>
              <input
                id="new-project-title" className="input"
                placeholder="e.g. SaaS Onboarding Journey"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createProject(); if (e.key === 'Escape') setCreating(false); }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={createProject} disabled={!newTitle.trim()}>Create project</button>
              <button className="btn" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        )}

        {projects.length === 0 && !creating && (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen size={36} /></div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-desc">Load a scenario above to get started, or create a blank project.</div>
            <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create a project</button>
          </div>
        )}
      </div>
    </div>
  );
}
