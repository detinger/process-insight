import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { CURRICULUM } from './curriculum';
import { loadScenarioById } from '../scenarios/loadScenarioById';
import type { Workspace } from '../../app/AppShell';

export function UnitsTab({ onOpenProject, onNavigate }: { onOpenProject?: (id: string) => void; onNavigate?: (w: Workspace) => void }) {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  async function handleOpenScenario(scenarioId: string) {
    if (!onOpenProject) { onNavigate?.('home'); return; }
    const projectId = await loadScenarioById(scenarioId);
    if (projectId) { onOpenProject(projectId); } else { onNavigate?.('home'); }
  }

  return (
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
  );
}
