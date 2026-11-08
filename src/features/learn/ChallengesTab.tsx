import { useState } from 'react';
import { ChevronRight, Clock, Target } from 'lucide-react';
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

interface ChallengesTabProps {
  onOpenProject?: (id: string) => void;
  onNavigate?: (w: Workspace) => void;
}

export function ChallengesTab({ onOpenProject, onNavigate }: ChallengesTabProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [filterScenario, setFilterScenario] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  const filteredChallenges = CHALLENGES.filter(c =>
    (!filterScenario || c.scenarioId === filterScenario) &&
    (!filterLevel || c.level === filterLevel)
  );

  if (selectedChallenge) {
    const ch = CHALLENGES.find(c => c.id === selectedChallenge)!;
    return (
      <ChallengeDetail
        challenge={ch}
        onBack={() => setSelectedChallenge(null)}
        onOpenProject={onOpenProject}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
          CHALLENGES
        </button>
        <span>·</span>
        <span style={{ fontWeight: 500 }}>{SCENARIO_LABELS[challenge.scenarioId] ?? challenge.scenarioId}</span>
      </div>

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

      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Scenario</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{challenge.task}</p>
      </div>

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
