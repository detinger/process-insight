import { useState, useEffect } from 'react';
import {
  Plus, CheckCircle, Circle, XCircle, AlertTriangle, ChevronRight,
  ChevronDown, Layers, ArrowRight, GitMerge, BarChart2, Grid, Map as MapIcon,
} from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import { MergeDialog } from './MergeDialog';
import { CoverageMatrix } from './CoverageMatrix';
import { PriorityScoringPanel } from './PriorityScoringPanel';
import { wouldCreateCycle } from './hierarchy';
import { ImpactPanel } from './ImpactPanel';
import { ProcessLandscapeView, type LandscapeZone } from './ProcessLandscapeView';
import { WorkspacePath } from '../../components/WorkspacePath';
import type { Workspace } from '../../app/AppShell';
import type {
  ProcessCandidate, ProcessDefinition, CandidateStatus, LandscapeRelation,
  Service, Capability, EvidenceRecord, Journey, JourneyStep, RelationshipType,
} from '../../domain/contracts/types';

interface Props {
  projectId: string;
  onNavigate?: (ws: Workspace) => void;
}

type LeftTab = 'candidates' | 'processes';
type MainTab = 'landscape' | 'identify' | 'coverage' | 'scoring';

const STATUS_CFG: Record<CandidateStatus, { label: string; color: string; icon: React.ReactNode }> = {
  proposed:       { label: 'Proposed',    color: 'var(--info)',        icon: <Circle size={13} /> },
  'under-review': { label: 'In review',   color: 'var(--warning)',     icon: <AlertTriangle size={13} /> },
  accepted:       { label: 'Accepted',    color: 'var(--success)',     icon: <CheckCircle size={13} /> },
  merged:         { label: 'Merged',      color: 'var(--text-subtle)', icon: <GitMerge size={13} /> },
  rejected:       { label: 'Rejected',    color: 'var(--error)',       icon: <XCircle size={13} /> },
};

const BOUNDARY_CHECKS = [
  'Is this a process (not a team, department or capability)?',
  'Is its result meaningful to a customer or stakeholder?',
  'Are the start and end conditions observable?',
  'Does the name describe work (verb–object format)?',
  'Is its granularity consistent with sibling processes?',
  'Is there an accountable owner for this process?',
];

const MAIN_TABS: { id: MainTab; label: string; icon: React.ReactNode; why: string }[] = [
  { id: 'identify', label: 'Identify', icon: <Circle size={13} />,
    why: 'Collect candidate processes from interviews and evidence, check their boundaries, then accept them as process definitions with a charter (purpose, trigger, outcome, scope).' },
  { id: 'landscape', label: 'Landscape', icon: <MapIcon size={13} />,
    why: 'The big picture on one page: arrange the accepted processes into management, core and support zones.' },
  { id: 'coverage', label: 'Coverage', icon: <Grid size={13} />,
    why: 'A completeness check: which processes are linked to services, capabilities and an owner. Empty cells reveal processes nobody owns or services no process supports — fix these before you trust the landscape.' },
  { id: 'scoring', label: 'Scoring', icon: <BarChart2 size={13} />,
    why: 'Rates processes on strategic impact, pain severity, feasibility and volume, then ranks them, so you know which to analyse or improve first instead of tackling everything at once.' },
];

export function IdentifyWorkspace({ projectId, onNavigate }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('identify');
  const [tab, setTab] = useState<LeftTab>('candidates');
  const [candidates, setCandidates] = useState<ProcessCandidate[]>([]);
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [relations, setRelations] = useState<LandscapeRelation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [steps, setSteps] = useState<JourneyStep[]>([]);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCand, setSelectedCand] = useState<ProcessCandidate | null>(null);
  const [selectedProc, setSelectedProc] = useState<ProcessDefinition | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [cycleWarning, setCycleWarning] = useState('');

  useEffect(() => {
    Promise.all([
      db.candidates.where('projectId').equals(projectId).toArray(),
      db.processes.where('projectId').equals(projectId).toArray(),
      db.relations.where('projectId').equals(projectId).toArray(),
      db.services.where('projectId').equals(projectId).toArray(),
      db.capabilities.where('projectId').equals(projectId).toArray(),
      db.evidence.where('projectId').equals(projectId).toArray(),
      db.journeys.where('projectId').equals(projectId).toArray(),
      db.steps.where('projectId').equals(projectId).toArray(),
    ]).then(([cands, procs, rels, svcs, caps, evid, jnys, stps]) => {
      setCandidates(cands);
      setProcesses(procs);
      setRelations(rels);
      setServices(svcs);
      setCapabilities(caps);
      setEvidence(evid);
      setJourneys(jnys);
      setSteps(stps);
    });
  }, [projectId]);

  async function addCandidate() {
    if (!newTitle.trim()) return;
    const c: ProcessCandidate = {
      id: newId('cand'), projectId, title: newTitle.trim(), status: 'proposed',
      rationale: '', sourceRefs: [], createdAt: new Date().toISOString(),
    };
    await db.candidates.add(c);
    setCandidates(prev => [...prev, c]);
    setNewTitle(''); setCreating(false);
    setSelectedCand(c); setSelectedProc(null);
  }

  async function updateCandStatus(id: string, status: CandidateStatus) {
    await db.candidates.update(id, { status });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setSelectedCand(prev => prev?.id === id ? { ...prev, status } : prev);

    if (status === 'accepted') {
      const cand = candidates.find(c => c.id === id);
      if (!cand) return;
      if (!processes.some(p => p.title === cand.title)) {
        const proc: ProcessDefinition = {
          id: newId('proc'), projectId, title: cand.title, purpose: '', levelLabel: 'L2',
          trigger: '', outcome: '', inScope: [], outOfScope: [],
          ownerRoleId: undefined, evidenceIds: [], status: 'draft',
          serviceIds: [], capabilityIds: [], systemIds: [],
        };
        await db.processes.add(proc);
        setProcesses(prev => [...prev, proc]);
      }
    }
  }

  async function updateCandRationale(id: string, rationale: string) {
    await db.candidates.update(id, { rationale });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, rationale } : c));
    setSelectedCand(prev => prev?.id === id ? { ...prev, rationale } : prev);
  }

  async function updateProc(id: string, patch: Partial<ProcessDefinition>) {
    // Cycle detection for parentId change
    if (patch.parentId !== undefined && patch.parentId !== '') {
      const proc = processes.find(p => p.id === id);
      if (proc && wouldCreateCycle(patch.parentId, id, relations)) {
        setCycleWarning(`Cannot set "${processes.find(p => p.id === patch.parentId)?.title}" as parent — it would create a decomposition cycle.`);
        return;
      }
    }
    await db.processes.update(id, patch);
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    setSelectedProc(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  }

  async function addProcFromScratch() {
    const proc: ProcessDefinition = {
      id: newId('proc'), projectId, title: 'New process', purpose: '', levelLabel: 'L2',
      trigger: '', outcome: '', inScope: [], outOfScope: [],
      ownerRoleId: undefined, evidenceIds: [], status: 'draft',
      serviceIds: [], capabilityIds: [], systemIds: [],
    };
    await db.processes.add(proc);
    setProcesses(prev => [...prev, proc]);
    setSelectedProc(proc); setSelectedCand(null);
    setTab('processes');
  }

  async function addRelation(fromId: string, toId: string, type: RelationshipType = 'decomposesInto') {
    if (type === 'decomposesInto' && wouldCreateCycle(fromId, toId, relations)) {
      setCycleWarning('Cannot add this decomposesInto relation — it would create a hierarchy cycle.');
      return;
    }
    const rel: LandscapeRelation = { id: newId('rel'), projectId, fromId, toId, type };
    await db.relations.add(rel);
    setRelations(prev => [...prev, rel]);
  }

  async function addLandscapeProcess(title: string, levelLabel: LandscapeZone, parentId?: string): Promise<ProcessDefinition> {
    const proc: ProcessDefinition = {
      id: newId('proc'), projectId, title, purpose: '', levelLabel,
      parentId, trigger: '', outcome: '', inScope: [], outOfScope: [],
      ownerRoleId: undefined, evidenceIds: [], status: 'draft',
      serviceIds: [], capabilityIds: [], systemIds: [],
    };
    await db.processes.add(proc);
    setProcesses(prev => [...prev, proc]);
    return proc;
  }

  async function deleteProc(id: string) {
    await db.transaction('rw', [db.processes, db.relations], async () => {
      await db.processes.delete(id);
      await db.relations.where('fromId').equals(id).delete();
      await db.relations.where('toId').equals(id).delete();
    });
    setProcesses(prev => prev.filter(p => p.id !== id));
    setRelations(prev => prev.filter(r => r.fromId !== id && r.toId !== id));
    if (selectedProc?.id === id) setSelectedProc(null);
  }

  const grouped: Record<CandidateStatus, ProcessCandidate[]> = {
    proposed: [], 'under-review': [], accepted: [], merged: [], rejected: [],
  };
  candidates.forEach(c => grouped[c.status].push(c));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Workspace header: the page title comes first, tabs below it */}
      <div style={{ padding: '18px 24px 0', flexShrink: 0, background: 'var(--bg)' }}>
        <div className="eyebrow">Identification</div>
        <h1 className="page-title" style={{ marginBottom: 6 }}>Process landscape</h1>
        <p className="page-description" style={{ marginBottom: 14 }}>
          Identify candidate processes from evidence, classify them, define boundaries
          and organize into a coherent architecture.
        </p>
      </div>

      {/* Top-level workspace tabs */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '0 20px',
        background: 'var(--bg-elevated)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {MAIN_TABS.map(t => (
          <button
            key={t.id}
            className={`tab${mainTab === t.id ? ' active' : ''}`}
            onClick={() => setMainTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{
        padding: '7px 24px', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
        background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)',
      }}>
        {MAIN_TABS.find(t => t.id === mainTab)?.why}
      </div>

      {/* Cycle warning banner */}
      {cycleWarning && (
        <div className="callout callout-error" style={{ margin: '8px 16px', flexShrink: 0, fontSize: 13 }}>
          <AlertTriangle size={14} className="callout-icon" />
          {cycleWarning}
          <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setCycleWarning('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {mainTab === 'landscape' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ProcessLandscapeView
              processes={processes}
              projectId={projectId}
              onAdd={addLandscapeProcess}
              onUpdate={(id, patch) => updateProc(id, patch)}
              onDelete={deleteProc}
              onSelect={proc => { setSelectedProc(proc); setSelectedCand(null); }}
              selectedId={selectedProc?.id}
            />
          </div>
        )}
        {mainTab === 'identify' && (
          <>
            {/* Left sidebar */}
            <div style={{
              width: 300, flexShrink: 0, borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 650, fontSize: 14, flex: 1 }}>Process identification</span>
                  <button className="btn btn-sm btn-primary" onClick={() => setCreating(true)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
                <div className="tabs" style={{ borderBottom: 'none' }}>
                  <button className={`tab${tab === 'candidates' ? ' active' : ''}`}
                    onClick={() => setTab('candidates')} style={{ flex: 1 }}>
                    Candidates ({candidates.length})
                  </button>
                  <button className={`tab${tab === 'processes' ? ' active' : ''}`}
                    onClick={() => setTab('processes')} style={{ flex: 1 }}>
                    Processes ({processes.length})
                  </button>
                </div>
              </div>

              {creating && tab === 'candidates' && (
                <div style={{
                  padding: '10px 14px', borderBottom: '1px solid var(--border)',
                  background: 'var(--primary-soft)', flexShrink: 0,
                }}>
                  <div className="field">
                    <input className="input input-sm"
                      placeholder="Verb–object title, e.g. Provision Cloud Resources"
                      value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCandidate(); if (e.key === 'Escape') setCreating(false); }}
                      autoFocus
                    />
                    <div className="field-hint" style={{ fontSize: 11 }}>
                      Use verb–object format and avoid department names.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={addCandidate} disabled={!newTitle.trim()}>Add</button>
                    <button className="btn btn-sm" onClick={() => setCreating(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {tab === 'candidates' ? (
                  candidates.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px 16px' }}>
                      <div className="empty-state-title" style={{ fontSize: 13 }}>No candidates yet</div>
                      <div className="empty-state-desc" style={{ fontSize: 12 }}>
                        Identify candidate processes from stakeholder outcomes, service offerings or value chain steps.
                      </div>
                    </div>
                  ) : (
                    (['proposed', 'under-review', 'accepted', 'rejected', 'merged'] as CandidateStatus[]).map(status => {
                      const group = grouped[status];
                      if (!group.length) return null;
                      const cfg = STATUS_CFG[status];
                      return (
                        <div key={status}>
                          <div style={{
                            padding: '4px 14px 2px', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)',
                          }}>
                            {cfg.label} ({group.length})
                          </div>
                          {group.map(c => (
                            <button key={c.id}
                              style={{
                                width: '100%', textAlign: 'left', padding: '7px 14px',
                                border: 'none',
                                background: selectedCand?.id === c.id ? 'var(--primary-soft)' : 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, color: c.status === 'merged' ? 'var(--text-subtle)' : 'var(--text)',
                                borderLeft: selectedCand?.id === c.id ? '2px solid var(--primary)' : '2px solid transparent',
                              }}
                              onClick={() => { setSelectedCand(c); setSelectedProc(null); setShowImpact(false); }}>
                              <span style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</span>
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.title}
                              </span>
                              {c.mergedIntoId && (
                                <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>→ alias</span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })
                  )
                ) : (
                  <>
                    <div style={{ padding: '0 8px 8px' }}>
                      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={addProcFromScratch}>
                        <Plus size={13} /> New process definition
                      </button>
                    </div>
                    {processes.length === 0 ? (
                      <div className="empty-state" style={{ padding: '16px' }}>
                        <div className="empty-state-title" style={{ fontSize: 13 }}>No processes yet</div>
                        <div className="empty-state-desc" style={{ fontSize: 12 }}>
                          Accept a candidate or create a process directly.
                        </div>
                      </div>
                    ) : (
                      <ProcessHierarchy
                        processes={processes}
                        relations={relations}
                        selectedId={selectedProc?.id ?? null}
                        onSelect={id => {
                          const p = processes.find(p => p.id === id);
                          if (p) { setSelectedProc(p); setSelectedCand(null); }
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Inspector */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24, position: 'relative' }}>
              {selectedCand && tab === 'candidates' && (
                <CandidateInspector
                  candidate={selectedCand}
                  candidates={candidates}
                  onUpdateStatus={updateCandStatus}
                  onUpdateRationale={updateCandRationale}
                  onMerge={() => setShowMerge(true)}
                />
              )}
              {selectedProc && tab === 'processes' && !showImpact && (
                <ProcessCharterEditor
                  proc={selectedProc}
                  allProcesses={processes}
                  relations={relations}
                  onUpdate={patch => updateProc(selectedProc.id, patch)}
                  onAddRelation={addRelation}
                  onShowImpact={() => setShowImpact(true)}
                />
              )}
              {selectedProc && tab === 'processes' && showImpact && (
                <div>
                  <button className="btn btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowImpact(false)}>
                    ← Back to charter
                  </button>
                  <ImpactPanel
                    process={selectedProc}
                    allProcesses={processes}
                    relations={relations}
                    services={services}
                    capabilities={capabilities}
                    journeys={journeys}
                    steps={steps}
                    evidence={evidence}
                    onSelectProcess={id => {
                      const p = processes.find(p => p.id === id);
                      if (p) { setSelectedProc(p); setShowImpact(false); }
                    }}
                  />
                </div>
              )}
              {!selectedCand && !selectedProc && (
                <LandscapeOverview
                  candidates={candidates}
                  processes={processes}
                  relations={relations}
                />
              )}
            </div>
          </>
        )}

        {mainTab === 'coverage' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <CoverageMatrix
              processes={processes}
              services={services}
              capabilities={capabilities}
            />
          </div>
        )}

        {mainTab === 'scoring' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <PriorityScoringPanel projectId={projectId} processes={processes} />
          </div>
        )}
      </div>

      {/* Merge dialog */}
      {showMerge && selectedCand && (
        <MergeDialog
          candidates={candidates}
          primaryId={selectedCand.id}
          onMerged={(canonical, merged) => {
            setCandidates(prev => prev.map(c =>
              c.id === canonical.id ? canonical : c.id === merged.id ? merged : c
            ));
            setSelectedCand(canonical);
            setShowMerge(false);
          }}
          onClose={() => setShowMerge(false)}
        />
      )}

      {onNavigate && (
        <WorkspacePath current="identify" onNavigate={onNavigate} />
      )}
    </div>
  );
}

// ─── Process hierarchy tree ───

function ProcessHierarchy({
  processes, relations: _relations, selectedId, onSelect,
}: {
  processes: ProcessDefinition[];
  relations: LandscapeRelation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const childMap = new Map<string | undefined, ProcessDefinition[]>();
  processes.forEach(p => {
    const key = p.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(p);
  });

  function renderNode(p: ProcessDefinition, depth: number): React.ReactNode {
    const children = childMap.get(p.id) ?? [];
    return (
      <div key={p.id}>
        <button
          style={{
            width: '100%', textAlign: 'left', padding: `6px ${14 + depth * 12}px`,
            border: 'none', background: selectedId === p.id ? 'var(--primary-soft)' : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            borderLeft: selectedId === p.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: 'var(--text)',
          }}
          onClick={() => onSelect(p.id)}
        >
          {children.length > 0 ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="badge badge-info" style={{ fontSize: 10 }}>{p.levelLabel}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.title}
          </span>
          {p.status === 'reviewed' && <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />}
        </button>
        {children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  }

  const roots = childMap.get(undefined) ?? [];
  return <div>{roots.map(p => renderNode(p, 0))}</div>;
}

// ─── Candidate inspector ───

function CandidateInspector({
  candidate, candidates, onUpdateStatus, onUpdateRationale, onMerge,
}: {
  candidate: ProcessCandidate;
  candidates: ProcessCandidate[];
  onUpdateStatus: (id: string, s: CandidateStatus) => void;
  onUpdateRationale: (id: string, r: string) => void;
  onMerge: () => void;
}) {
  const [checks, setChecks] = useState<boolean[]>(BOUNDARY_CHECKS.map(() => false));
  const cfg = STATUS_CFG[candidate.status];
  const activeOthers = candidates.filter(c => c.id !== candidate.id && c.status !== 'merged' && c.status !== 'rejected');
  const mergeTarget = candidate.mergedIntoId
    ? candidates.find(c => c.id === candidate.mergedIntoId)
    : null;

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="eyebrow">Process candidate</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h2 className="page-title" style={{ fontSize: 20, marginBottom: 6 }}>{candidate.title}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              {cfg.icon} {cfg.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
              Created {new Date(candidate.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {activeOthers.length > 0 && candidate.status !== 'merged' && (
          <button className="btn btn-sm btn-ghost" onClick={onMerge} title="Merge with another candidate">
            <GitMerge size={13} /> Merge
          </button>
        )}
      </div>

      {/* Merge alias notice */}
      {mergeTarget && (
        <div className="callout callout-info" style={{ marginBottom: 16 }}>
          <GitMerge size={14} className="callout-icon" />
          <span style={{ fontSize: 13 }}>
            This candidate was merged into <strong>{mergeTarget.title}</strong>.
            To reverse, change the status below.
          </span>
        </div>
      )}

      {/* Status buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['proposed', 'under-review', 'accepted', 'rejected'] as CandidateStatus[]).map(s => (
          <button key={s}
            className={`btn btn-sm${candidate.status === s ? '' : ' btn-ghost'}`}
            style={candidate.status === s ? {
              background: STATUS_CFG[s].color, borderColor: STATUS_CFG[s].color, color: '#fff',
            } : {}}
            onClick={() => onUpdateStatus(candidate.id, s)}>
            {STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* Boundary checklist */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <span className="card-title" style={{ fontSize: 14 }}>Boundary checklist</span>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
            {checks.filter(Boolean).length}/{BOUNDARY_CHECKS.length}
          </span>
        </div>
        <div className="callout callout-recommendation" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} className="callout-icon" />
          <span style={{ fontSize: 12 }}>
            These are guidance questions, not a guarantee of a unique correct answer.
            Multiple valid decompositions can exist.
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BOUNDARY_CHECKS.map((q, i) => (
            <label key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
              fontSize: 13, color: checks[i] ? 'var(--text)' : 'var(--text-muted)',
            }}>
              <input type="checkbox" checked={checks[i]} style={{ marginTop: 2 }}
                onChange={e => setChecks(prev => { const n = [...prev]; n[i] = e.target.checked; return n; })}
              />
              {q}
            </label>
          ))}
        </div>
      </div>

      {/* Rationale */}
      <div className="card">
        <div className="card-title-row">
          <span className="card-title" style={{ fontSize: 14 }}>Classification rationale</span>
        </div>
        <textarea className="input" style={{ minHeight: 80, fontSize: 13 }}
          placeholder="Why is this a process and not a department, capability or system?"
          value={candidate.rationale}
          onChange={e => onUpdateRationale(candidate.id, e.target.value)}
        />
      </div>

      {candidate.status === 'accepted' && (
        <div className="callout callout-success" style={{ marginTop: 16 }}>
          <CheckCircle size={16} className="callout-icon" />
          <span style={{ fontSize: 13 }}>
            Candidate accepted — a process definition has been created in the Processes tab.
            Complete the charter there.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Process charter editor ───

function ProcessCharterEditor({
  proc, allProcesses, relations, onUpdate, onAddRelation: _onAddRelation, onShowImpact,
}: {
  proc: ProcessDefinition;
  allProcesses: ProcessDefinition[];
  relations: LandscapeRelation[];
  onUpdate: (patch: Partial<ProcessDefinition>) => void;
  onAddRelation: (fromId: string, toId: string, type: RelationshipType) => void;
  onShowImpact: () => void;
}) {
  const [inScopeText, setInScopeText] = useState(proc.inScope.join('\n'));
  const [outOfScopeText, setOutOfScopeText] = useState(proc.outOfScope.join('\n'));

  // Reset text state when proc changes
  const procId = proc.id;
  useEffect(() => {
    setInScopeText(proc.inScope.join('\n'));
    setOutOfScopeText(proc.outOfScope.join('\n'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procId]);

  const children = allProcesses.filter(p => p.parentId === proc.id);
  const parent = allProcesses.find(p => p.id === proc.parentId);

  // Check for potential cycle before showing parent options
  const validParents = allProcesses.filter(p =>
    p.id !== proc.id && !wouldCreateCycle(p.id, proc.id, relations)
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="eyebrow">Process definition</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <input
            className="input"
            style={{ fontSize: 20, fontWeight: 650, border: 'none', padding: '4px 0', background: 'none' }}
            value={proc.title}
            onChange={e => onUpdate({ title: e.target.value })}
            aria-label="Process title"
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <select className="input input-sm"
            value={proc.levelLabel}
            onChange={e => onUpdate({ levelLabel: e.target.value })}>
            {['L0', 'L1', 'L2', 'L3'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="input input-sm"
            value={proc.status}
            onChange={e => onUpdate({ status: e.target.value as ProcessDefinition['status'] })}>
            <option value="draft">Draft</option>
            <option value="reviewed">Reviewed</option>
            <option value="retired">Retired</option>
          </select>
          <button className="btn btn-sm btn-ghost" onClick={onShowImpact} title="Show impact analysis">
            Impact
          </button>
        </div>
      </div>

      {/* Hierarchy context */}
      {(parent || children.length > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title-row">
            <Layers size={14} style={{ color: 'var(--primary)' }} />
            <span className="card-title" style={{ fontSize: 13 }}>Hierarchy</span>
          </div>
          {parent && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              <ArrowRight size={12} style={{ display: 'inline', marginRight: 4 }} />
              Parent: <span style={{ color: 'var(--text)' }}>{parent.title}</span>
            </div>
          )}
          {children.map(child => (
            <div key={child.id} style={{ fontSize: 13, paddingLeft: 16, color: 'var(--text-muted)', marginBottom: 4 }}>
              ↳ {child.title}
            </div>
          ))}
        </div>
      )}

      {/* Charter fields */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <span className="card-title" style={{ fontSize: 14 }}>Charter</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Purpose</label>
            <textarea className="input" style={{ fontSize: 13, minHeight: 56 }}
              placeholder="What value does this process deliver?"
              value={proc.purpose}
              onChange={e => onUpdate({ purpose: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label">Parent process</label>
            <select className="input input-sm"
              value={proc.parentId ?? ''}
              onChange={e => onUpdate({ parentId: e.target.value || undefined })}>
              <option value="">No parent (top-level)</option>
              {validParents.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {allProcesses.filter(p => p.id !== proc.id).length > validParents.length && (
              <div className="field-hint" style={{ fontSize: 11, color: 'var(--warning)' }}>
                Some options hidden — would create a decomposition cycle.
              </div>
            )}
          </div>
          <div className="field">
            <label className="field-label">Trigger / start boundary</label>
            <input className="input input-sm"
              placeholder="What initiates this process?"
              value={proc.trigger}
              onChange={e => onUpdate({ trigger: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label">Outcome / end boundary</label>
            <input className="input input-sm"
              placeholder="What is the observable end state?"
              value={proc.outcome}
              onChange={e => onUpdate({ outcome: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row">
          <span className="card-title" style={{ fontSize: 14 }}>Scope</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="field-label">Included work (one item per line)</label>
            <textarea className="input" style={{ fontSize: 12, minHeight: 72 }}
              placeholder="What is included…"
              value={inScopeText}
              onChange={e => {
                setInScopeText(e.target.value);
                onUpdate({ inScope: e.target.value.split('\n').filter(Boolean) });
              }}
            />
          </div>
          <div className="field">
            <label className="field-label">Excluded work (one item per line)</label>
            <textarea className="input" style={{ fontSize: 12, minHeight: 72 }}
              placeholder="What is excluded…"
              value={outOfScopeText}
              onChange={e => {
                setOutOfScopeText(e.target.value);
                onUpdate({ outOfScope: e.target.value.split('\n').filter(Boolean) });
              }}
            />
          </div>
        </div>
      </div>

      {/* Validation */}
      <CharterDiagnostics proc={proc} />
    </div>
  );
}

function CharterDiagnostics({ proc }: { proc: ProcessDefinition }) {
  const issues: string[] = [];
  if (!proc.trigger) issues.push('No trigger defined — when does this process start?');
  if (!proc.outcome) issues.push('No outcome defined — what is the observable result?');
  if (!proc.purpose) issues.push('Purpose is empty — what value does this process deliver?');
  if (proc.inScope.length === 0) issues.push('Included scope is empty — what work does this cover?');
  if (!proc.ownerRoleId && issues.length > 0) issues.push('No accountable owner assigned.');

  if (issues.length === 0) {
    return (
      <div className="callout callout-success">
        <CheckCircle size={15} className="callout-icon" />
        <span style={{ fontSize: 13 }}>Charter is complete — trigger, outcome, purpose and scope are defined.</span>
      </div>
    );
  }

  return (
    <div className="callout callout-recommendation">
      <AlertTriangle size={15} className="callout-icon" />
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Incomplete charter</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          {issues.map((issue, i) => <li key={i}>{issue}</li>)}
        </ul>
      </div>
    </div>
  );
}

// ─── Landscape overview ───

function LandscapeOverview({
  candidates, processes, relations,
}: {
  candidates: ProcessCandidate[];
  processes: ProcessDefinition[];
  relations: LandscapeRelation[];
}) {
  const accepted = candidates.filter(c => c.status === 'accepted').length;
  const complete = processes.filter(p => p.trigger && p.outcome && p.purpose).length;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Candidates', value: candidates.length, sub: `${accepted} accepted` },
          { label: 'Processes', value: processes.length, sub: `${complete} with complete charter` },
          { label: 'Relationships', value: relations.length, sub: 'typed links' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {item.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 550, marginTop: 2 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="callout callout-recommendation">
        <ChevronRight size={16} className="callout-icon" />
        <div style={{ fontSize: 13 }}>
          <strong>Getting started:</strong> Add candidate processes from the sidebar,
          check their boundaries, accept them to create process definitions, then complete
          each charter with trigger, outcome and scope.
          Use <strong>Coverage</strong> to check service/capability linkage, and
          <strong> Scoring</strong> to rank processes by priority.
        </div>
      </div>
    </div>
  );
}
