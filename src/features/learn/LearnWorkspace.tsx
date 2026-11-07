import { useState } from 'react';
import { Lightbulb, ChevronRight, ChevronDown, Clock, Target, AlertTriangle, ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { CURRICULUM } from './curriculum';
import { CHALLENGES, type ChallengeDefinition } from './challenges';
import { loadScenarioById } from '../scenarios/loadScenarioById';
import type { Workspace } from '../../app/AppShell';

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--info)',
  advanced:     'var(--warning)',
  capstone:     'var(--accent)',
};

const SCENARIO_LABELS: Record<string, string> = {
  'IT-02': 'IT-02 · SaaS Onboarding',
  'IT-03': 'IT-03 · Hardware Incident',
  'IT-04': 'IT-04 · Cloud Resources',
  'IT-05': 'IT-05 · Employee Access',
  'IT-06': 'IT-06 · Major Incident',
  'IT-07': 'IT-07 · Software Release',
  'IT-08': 'IT-08 · API Integration',
  'IT-09': 'IT-09 · SaaS Renewal',
  'IT-10': 'IT-10 · IT Procurement',
  'IT-11': 'IT-11 · Cloud Migration',
  'IT-12': 'IT-12 · Managed Service (Capstone)',
};

interface LearnProps {
  projectId: string;
  onOpenProject?: (id: string) => void;
  onNavigate?: (w: Workspace) => void;
}

export function LearnWorkspace({ projectId: _, onOpenProject, onNavigate }: LearnProps) {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'challenges' | 'concepts'>('curriculum');
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [filterScenario, setFilterScenario] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  const filteredChallenges = CHALLENGES.filter(c =>
    (!filterScenario || c.scenarioId === filterScenario) &&
    (!filterLevel || c.level === filterLevel)
  );

  async function handleOpenScenario(scenarioId: string) {
    if (!onOpenProject) { onNavigate?.('home'); return; }
    const projectId = await loadScenarioById(scenarioId);
    if (projectId) { onOpenProject(projectId); } else { onNavigate?.('home'); }
  }

  return (
    <div className="workspace">
      <div className="workspace-narrow">
        <div className="page-header">
          <div className="page-header-content">
            <div className="eyebrow">Curriculum</div>
            <h1 className="page-title">Learn</h1>
            <p className="page-description">
              Concept explanations, curriculum units, practice challenges and IT scenario packs
              for Business Process Management.
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {(['curriculum', 'challenges', 'concepts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedChallenge(null); }}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                marginBottom: -1,
              }}
            >
              {tab === 'curriculum' ? 'Units (12)' : tab === 'challenges' ? `Challenges (${CHALLENGES.length})` : 'Concepts'}
            </button>
          ))}
        </div>

        {/* Curriculum tab */}
        {activeTab === 'curriculum' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>Learn BPM step by step</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: '56ch', lineHeight: 1.6 }}>
                  Twelve units take you from basic process concepts to discovery, journey mapping and process modelling.
                  Each unit has an explanation, key points, common mistakes and a practice exercise.
                </p>
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', minWidth: 220, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Your progress</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>0 / 12 units</span>
                </div>
                <div className="progress-track" style={{ marginBottom: 12 }}>
                  <div className="progress-fill" style={{ width: '0%' }} />
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}
                  onClick={() => setExpandedUnit(expandedUnit === null ? 1 : null)}>
                  Start: Unit 1
                </button>
              </div>
            </div>

            <h3 className="subsection-heading">Units</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CURRICULUM.map(unit => (
                <div key={unit.unit} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedUnit(expandedUnit === unit.unit ? null : unit.unit)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                      padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--primary-soft)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15, flexShrink: 0,
                    }}>{unit.unit}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 650, fontSize: 15, marginBottom: 2 }}>Unit {unit.unit}: {unit.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit.outcome}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{unit.time}</span>
                      {expandedUnit === unit.unit ? <ChevronDown size={16} style={{ color: 'var(--text-subtle)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-subtle)' }} />}
                    </div>
                  </button>
                  {expandedUnit === unit.unit && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)', marginTop: 14, marginBottom: 16 }}>{unit.explanation}</p>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Key points</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {unit.keyPoints.map((kp, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, alignItems: 'flex-start' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0, marginTop: 6 }} />
                              {kp}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Exercise</div>
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{unit.exercise}</p>
                      </div>
                      {unit.relatedScenarios.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Related:</span>
                          {unit.relatedScenarios.map(sid => (
                            <button key={sid} className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}
                              onClick={() => handleOpenScenario(sid)}>
                              {sid}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges tab */}
        {activeTab === 'challenges' && (
          <div>
            {selectedChallenge ? (
              (() => {
                const ch = CHALLENGES.find(c => c.id === selectedChallenge)!;
                return <ChallengeDetail challenge={ch} onBack={() => setSelectedChallenge(null)} onOpenProject={onOpenProject} onNavigate={onNavigate} />;
              })()
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                  <select className="input input-sm" style={{ width: 220 }} value={filterScenario} onChange={e => setFilterScenario(e.target.value)}>
                    <option value="">All scenarios</option>
                    {Object.entries(SCENARIO_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                  <select className="input input-sm" style={{ width: 160 }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                    <option value="">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="capstone">Capstone</option>
                  </select>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', alignSelf: 'center' }}>{filteredChallenges.length} of {CHALLENGES.length}</div>
                </div>
                {filteredChallenges.length === 0 && (
                  <div className="empty-state"><div className="empty-state-title">No challenges match the filter</div></div>
                )}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {filteredChallenges.map((ch, i) => {
                    const levelColor = LEVEL_COLORS[ch.level] ?? 'var(--text-muted)';
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedChallenge(ch.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: i < filteredChallenges.length - 1 ? '1px solid var(--border)' : 'none',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ch.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                            {SCENARIO_LABELS[ch.scenarioId]} · {ch.estimatedTime}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                          background: `color-mix(in srgb, ${levelColor} 12%, transparent)`, color: levelColor,
                        }}>{ch.level}</span>
                        <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Concepts tab */}
        {activeTab === 'concepts' && (
          <ConceptsTab onOpenProject={onOpenProject} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}

function ChallengeDetail({ challenge, onBack, onOpenProject, onNavigate }: {
  challenge: ChallengeDefinition;
  onBack: () => void;
  onOpenProject?: (id: string) => void;
  onNavigate?: (w: Workspace) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    if (!onOpenProject) { onNavigate?.('home'); return; }
    setLoading(true);
    try {
      const projectId = await loadScenarioById(challenge.scenarioId);
      if (projectId) { onOpenProject(projectId); } else { onNavigate?.('home'); }
    } finally { setLoading(false); }
  }

  const levelColor = LEVEL_COLORS[challenge.level] ?? 'var(--text-muted)';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
          CHALLENGES
        </button>
        <span>·</span>
        <span style={{ fontWeight: 500 }}>{SCENARIO_LABELS[challenge.scenarioId] ?? challenge.scenarioId}</span>
      </div>

      {/* Title + meta */}
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.2 }}>
        {challenge.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: `color-mix(in srgb, ${levelColor} 12%, transparent)`, color: levelColor,
        }}>{challenge.level}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {challenge.estimatedTime}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={13} /> {challenge.workspaceHint} workspace</span>
      </div>

      {/* Scenario box */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Scenario</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{challenge.task}</p>
      </div>

      {/* What you'll explore */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>What you'll explore</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {challenge.expectedEvidence.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, alignItems: 'flex-start' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 7 }} />
              {item}
            </li>
          ))}
        </ul>
        {challenge.hints.length > 0 && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              Show hints ({challenge.hints.length})
            </summary>
            <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {challenge.hints.map((h, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 14, borderLeft: '2px solid var(--border)' }}>{h}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary"
        style={{ height: 44, fontSize: 15, padding: '0 28px' }}
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Open scenario →'}
      </button>
    </div>
  );
}

// ─── Concepts tab ────────────────────────────────────────────

interface ConceptDef {
  title: string;
  tag: string;
  desc: string;
  detail: string;
  examples: [string, string];
  watchOut: string;
  tryIt: { label: string; scenarioId?: string; workspace: Workspace };
}

const CONCEPTS: ConceptDef[] = [
  {
    title: 'Process vs Journey',
    tag: 'Foundation',
    desc: 'A process describes how the organisation does work internally. A journey describes the experience of a person pursuing a goal.',
    detail: 'The same situation produces both: a customer submitting a support ticket is their journey step "Submit ticket". Behind it runs a process "Register service request". One is told from the outside in, the other from the inside out. Neither is more true — they are complementary lenses.',
    examples: [
      '"Employee recovers access to a locked account" — that is a journey.',
      '"Handle password reset" — that is a process (trigger: password reset requested; outcome: access restored).',
    ],
    watchOut: 'Avoid writing journey steps that describe system actions ("System sends email"). That is the process view intruding into the journey. The journey step should be "Receives confirmation email."',
    tryIt: { label: 'Open IT-02 and name both sides', scenarioId: 'IT-02', workspace: 'journey' },
  },
  {
    title: 'Process vs Department',
    tag: 'Foundation',
    desc: 'A department is an organisational unit. A process is work with a trigger, an outcome and a stakeholder.',
    detail: 'Departments are containers for people and budgets. Processes are flows of work that cross departments, serve customers, and produce outcomes. A department may own a process, but it is never the process itself. This distinction matters when scoping: "IT Support" cannot have a trigger or an outcome, but "Resolve service request" can.',
    examples: [
      '"IT Support" — a department (a structure, not a flow of work).',
      '"Resolve service request" — a process (trigger: ticket received; outcome: issue resolved; stakeholder: employee).',
    ],
    watchOut: 'When someone says "our process is IT Support" they mean their team handles that area. Push back with: what starts it? what ends it? who cares about the outcome? If they cannot answer, it is not yet a process.',
    tryIt: { label: 'Find candidates in IT-03', scenarioId: 'IT-03', workspace: 'identify' },
  },
  {
    title: 'Process vs Capability',
    tag: 'Foundation',
    desc: 'A capability is something an organisation can do. A process is an instance of executing that capability.',
    detail: 'Capabilities are strategic; processes are operational. "Identity management" is a capability — it describes an organisational strength. "Provision user access" is a process — it is the actual work that exercises that capability for a specific trigger. Capabilities survive even when processes change. Processes are redesigned; capabilities are grown or bought.',
    examples: [
      '"Identity management" — a capability (what the IT function can do).',
      '"Provision user access for a new hire" — a process (a specific execution of that capability).',
    ],
    watchOut: 'Do not list capabilities in a process landscape as if they were processes. A landscape node should always answer: "what starts this, and what does completing it produce?" A capability has no trigger and no single outcome.',
    tryIt: { label: 'Open IT-05 and map candidates', scenarioId: 'IT-05', workspace: 'identify' },
  },
  {
    title: 'Evidence vs Assumption',
    tag: 'Discovery',
    desc: 'Evidence has a source, collection date and confidence level. An assumption is a claim without supporting observation.',
    detail: 'Most process models are built on a mixture of both — and that is fine. The problem is when assumptions are presented as evidence. Every claim in your model should be explicitly typed. "The form takes 20 minutes" is an assumption until someone observed it and recorded when and how. "The form takes 20 minutes (IT workshop, Oct 2024, n=6)" is low-confidence evidence.',
    examples: [
      '"It probably takes a while" — an assumption (no source, no date, no population).',
      '"Average form completion: 22 min (observed, service desk walk-through, 2024-10, n=4)" — evidence with confidence: medium.',
    ],
    watchOut: 'Silently upgrading an assumption to evidence by repeating it in multiple documents. The source is still one person\'s opinion. If two people independently observed the same thing, that raises confidence — but only if collected independently.',
    tryIt: { label: 'Log evidence in Discover', workspace: 'discover' },
  },
  {
    title: 'Observation vs Target',
    tag: 'Metrics',
    desc: 'An observation is a measured value at a point in time. A target is an aspiration. Never mix them in the same record.',
    detail: 'The most common reporting mistake: quoting an SLA as if it were a measurement. "Our resolution time is 4 hours" can mean either "we measured 4h average" or "our SLA says ≤4h". These are very different claims. Observations require a period, a source and a population. Targets require a direction and a basis. Mixing them makes it impossible to tell whether performance is improving.',
    examples: [
      '"Average resolution time: 4h 12min (Q3 2024, all P2 incidents, n=847)" — an observation.',
      '"Resolution time SLA: ≤4h" — a target (an aspiration set contractually, not measured).',
    ],
    watchOut: 'Percentage improvement claims require two observations with identical populations and time windows. "We improved by 20%" is meaningless if the first measurement was an estimate and the second was measured.',
    tryIt: { label: 'Open IT-06 and find the SLA claim', scenarioId: 'IT-06', workspace: 'journey' },
  },
  {
    title: 'BPMN Draft vs Finished Model',
    tag: 'Export',
    desc: 'A BPMN draft export is a sequential starting point. Decisions, loops, parallel work and timers require BPMN Studio.',
    detail: 'The export produces one task per journey step, in sequence, inside a pool. That is enough to open in Camunda or Signavio and start modelling. It is not a finished model. Approval/rejection gateways, escalation loops, parallel provisioning, and timer events must be added manually in the BPMN editor. The handoff notes in the export explain what the sequential model cannot represent.',
    examples: [
      'Exporting 10 journey steps → 10 sequential BPMN tasks, no gateways, no loops.',
      'The approval step in IT-05 needs a gateway (approved / rejected) — that must be added in BPMN Studio after export.',
    ],
    watchOut: 'Teams that treat the BPMN draft as authoritative skip the modelling step. The export is a starting point, not an end state. Always review handoff notes before handing off to a process engineer.',
    tryIt: { label: 'Export IT-08 and inspect handoff notes', scenarioId: 'IT-08', workspace: 'map' },
  },
];

const SCENARIO_ROWS = [
  { id: 'IT-02', scenario: 'SaaS customer completing onboarding',              perspective: 'Customer',  level: 'Beginner' },
  { id: 'IT-03', scenario: 'Employee reporting a hardware incident',            perspective: 'Employee',  level: 'Beginner' },
  { id: 'IT-04', scenario: 'Developer requesting cloud resources',              perspective: 'Developer', level: 'Intermediate' },
  { id: 'IT-05', scenario: 'New employee requesting system access',             perspective: 'Employee',  level: 'Intermediate' },
  { id: 'IT-06', scenario: 'Enterprise customer during a major incident',       perspective: 'Customer',  level: 'Intermediate' },
  { id: 'IT-07', scenario: 'Product team releasing software',                  perspective: 'Developer', level: 'Advanced' },
  { id: 'IT-08', scenario: 'Developer integrating a public API',               perspective: 'Developer', level: 'Advanced' },
  { id: 'IT-09', scenario: 'SaaS administrator handling renewal/cancellation', perspective: 'Customer',  level: 'Intermediate' },
  { id: 'IT-10', scenario: 'Team procuring an IT service',                     perspective: 'Employee',  level: 'Advanced' },
  { id: 'IT-11', scenario: 'Customer migrating to cloud hosting',              perspective: 'Customer',  level: 'Advanced' },
  { id: 'IT-12', scenario: 'Enterprise onboarding a managed-service provider', perspective: 'Employee',  level: 'Capstone' },
] as const;

function ConceptsTab({ onOpenProject, onNavigate }: { onOpenProject?: (id: string) => void; onNavigate?: (w: Workspace) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  async function openScenario(scenarioId: string, _workspace: Workspace) {
    if (!onOpenProject) { onNavigate?.('home'); return; }
    const projectId = await loadScenarioById(scenarioId);
    if (projectId) {
      onOpenProject(projectId);
    } else {
      onNavigate?.('home');
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Core distinctions every BPM practitioner must internalise. Click any concept to see examples, common traps and a practice action.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 40 }}>
        {CONCEPTS.map((c, idx) => {
          const isOpen = expandedIdx === idx;
          return (
            <div key={c.title} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {/* Header */}
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '11px 14px', background: isOpen ? 'var(--bg-subtle)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Lightbulb size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', flexShrink: 0,
                }}>{c.tag}</span>
                {isOpen
                  ? <ChevronDown size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />}
              </button>

              {/* Body */}
              {isOpen && (
                <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, lineHeight: 1.65, margin: '14px 0 12px', color: 'var(--text)' }}>{c.desc}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.65, margin: '0 0 14px', color: 'var(--text-muted)' }}>{c.detail}</p>

                  {/* Examples */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {c.examples.map((ex, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-subtle)', borderRadius: 6, padding: '8px 10px',
                        fontSize: 12, color: 'var(--text)', lineHeight: 1.5,
                        borderLeft: `3px solid ${i === 0 ? 'var(--error)' : 'var(--success)'}`,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--error)' : 'var(--success)', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                          {i === 0 ? 'Example A' : 'Example B'}
                        </span>
                        {ex}
                      </div>
                    ))}
                  </div>

                  {/* Watch out */}
                  <div style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', borderRadius: 6, padding: '8px 10px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text)' }}><strong>Watch out: </strong>{c.watchOut}</span>
                  </div>

                  {/* Try it */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ArrowRight size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Practice: {c.tryIt.label}</span>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 12 }}
                      onClick={() => c.tryIt.scenarioId
                        ? openScenario(c.tryIt.scenarioId, c.tryIt.workspace)
                        : onNavigate?.(c.tryIt.workspace)
                      }
                    >
                      <ExternalLink size={12} />
                      {c.tryIt.scenarioId ? `Open ${c.tryIt.scenarioId}` : `Go to ${c.tryIt.workspace}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scenario packs */}
      <h2 className="section-heading">Scenario packs</h2>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 90px 110px 80px', padding: '6px 14px', background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          <span>ID</span><span>Scenario</span><span>Perspective</span><span>Level</span><span />
        </div>
        {SCENARIO_ROWS.map((row, i) => (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 90px 110px 80px', padding: '9px 14px', borderBottom: i < SCENARIO_ROWS.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>{row.id}</span>
            <span>{row.scenario}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.perspective}</span>
            <span>
              <span style={{
                display: 'inline-block', padding: '2px 7px', borderRadius: 4,
                fontSize: 11, fontWeight: 600,
                background: `color-mix(in srgb, ${LEVEL_COLORS[row.level.toLowerCase()]} 12%, transparent)`,
                color: LEVEL_COLORS[row.level.toLowerCase()],
              }}>
                {row.level}
              </span>
            </span>
            <span>
              <button
                className="btn btn-sm btn-ghost"
                style={{ fontSize: 11 }}
                onClick={() => openScenario(row.id, 'journey')}
              >
                <BookOpen size={11} /> Load
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
