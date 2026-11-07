// Priority scoring panel (AT-11).
// Formula: score = sum_i((rating_i - 1) / 4 * weight_i) * 100
// Ratings 1–5; a rating of 1 → 0 contribution, 5 → weight × 100 contribution.
// Missing ratings → score null (incomplete).
// Config versioning: changing weights records a new config without altering baseline ratings.

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Settings } from 'lucide-react';
import { db } from '../../storage/db';
import {
  computeScore, validateWeights, DEFAULT_SCORING_CONFIG,
} from '../../domain/scoring';
import type { ProcessDefinition } from '../../domain/contracts/types';
import type { ScoringConfig, ScoringCriterion, ProcessRating } from '../../domain/scoring';

interface Props {
  projectId: string;
  processes: ProcessDefinition[];
}

export function PriorityScoringPanel({ projectId, processes }: Props) {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [ratings, setRatings] = useState<Map<string, ProcessRating>>(new Map());
  const [editingWeights, setEditingWeights] = useState(false);
  const [draftWeights, setDraftWeights] = useState<Record<string, string>>({});

  useEffect(() => {
    db.processRatings.where('[projectId+configId]').equals([projectId, config.id]).toArray().then(rows => {
      setRatings(new Map(rows.map(r => [r.processId, r])));
    });
  }, [config.id, projectId]);

  async function setRating(processId: string, criterionId: string, value: number | null) {
    const ratingId = `${processId}__${config.id}`;
    const existing = ratings.get(processId);
    const updated: ProcessRating = existing
      ? { ...existing, ratings: { ...existing.ratings, [criterionId]: value } }
      : { id: ratingId, projectId, processId, configId: config.id, ratings: { [criterionId]: value } };

    await db.processRatings.put(updated);
    setRatings(prev => new Map(prev).set(processId, updated));
  }

  function startEditWeights() {
    setDraftWeights(Object.fromEntries(
      config.criteria.map(c => [c.id, (c.weight * 100).toFixed(0)])
    ));
    setEditingWeights(true);
  }

  function saveWeights() {
    const newCriteria: ScoringCriterion[] = config.criteria.map(c => ({
      ...c,
      weight: (parseFloat(draftWeights[c.id] ?? '0') || 0) / 100,
    }));
    const err = validateWeights(newCriteria);
    if (err) { alert(err); return; }
    setConfig(prev => ({
      ...prev,
      criteria: newCriteria,
      id: prev.id === 'default' ? 'custom-1' : `custom-${Date.now()}`,
    }));
    setEditingWeights(false);
  }

  // Sort by score desc, then alphabetically
  const scored = processes.map(p => {
    const r = ratings.get(p.id);
    const score = r ? computeScore(r.ratings, config.criteria) : null;
    return { process: p, score };
  }).sort((a, b) => {
    if (a.score === null && b.score === null) return a.process.title.localeCompare(b.process.title);
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  const weightErr = validateWeights(config.criteria);

  return (
    <div style={{ padding: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Priority scoring</div>
          <h2 className="page-title">Process ranking</h2>
        </div>
        <button className="btn btn-sm" onClick={editingWeights ? saveWeights : startEditWeights}>
          <Settings size={13} /> {editingWeights ? 'Save weights' : 'Edit weights'}
        </button>
        {editingWeights && (
          <button className="btn btn-sm" onClick={() => setEditingWeights(false)}>Cancel</button>
        )}
      </div>

      {/* Criteria / weight editor */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title-row">
          <span className="card-title">Scoring criteria</span>
          <span style={{ fontSize: 12, color: weightErr ? 'var(--error)' : 'var(--text-subtle)' }}>
            {weightErr ?? `Weights sum: 100%`}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px', fontSize: 13 }}>
          {config.criteria.map(c => (
            <div key={c.id} style={{ display: 'contents' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {editingWeights ? (
                  <input
                    className="input input-sm"
                    style={{ width: 56, textAlign: 'right' }}
                    value={draftWeights[c.id] ?? ''}
                    onChange={e => setDraftWeights(prev => ({ ...prev, [c.id]: e.target.value }))}
                  />
                ) : (
                  <span style={{ fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                    {(c.weight * 100).toFixed(0)}%
                  </span>
                )}
                <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>wt</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formula note */}
      <div className="callout callout-info" style={{ fontSize: 12, marginBottom: 20 }}>
        <AlertCircle size={14} className="callout-icon" />
        <span>
          Score = Σ (rating − 1) / 4 × weight × 100. Rating 1 → 0 pts, rating 5 → weight × 100 pts.
          Incomplete (missing ratings) blocks scoring — shown as —.
        </span>
      </div>

      {/* Scoring table */}
      {processes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No processes to score</div>
          <div className="empty-state-desc">Accept candidates first to populate the scoring table.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>Process</th>
                {config.criteria.map(c => (
                  <th key={c.id} title={c.description} style={{ textAlign: 'center', minWidth: 80, fontSize: 12 }}>
                    {c.label}
                    <div style={{ color: 'var(--text-subtle)', fontSize: 10 }}>{(c.weight * 100).toFixed(0)}%</div>
                  </th>
                ))}
                <th style={{ textAlign: 'right', minWidth: 70 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {scored.map(({ process: p, score }, idx) => {
                const r = ratings.get(p.id);
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-subtle)', fontSize: 12 }}>
                      {score !== null ? idx + 1 : '—'}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</td>
                    {config.criteria.map(c => (
                      <td key={c.id} style={{ textAlign: 'center', padding: '4px 6px' }}>
                        <RatingCell
                          value={r?.ratings[c.id] ?? null}
                          onChange={v => setRating(p.id, c.id, v)}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {score !== null
                        ? <ScoreBar score={score} />
                        : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RatingCell({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          title={n.toString()}
          onClick={() => onChange(value === n ? null : n)}
          style={{
            width: 20, height: 20, borderRadius: 4, border: 'none',
            background: value === n ? 'var(--primary)' : 'var(--bg-subtle)',
            color: value === n ? 'var(--text-on-primary)' : 'var(--text-muted)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'background 100ms',
          }}
        >
          {n}
        </button>
      ))}
      <button
        title="Clear"
        onClick={() => onChange(null)}
        style={{
          width: 16, height: 20, borderRadius: 4, border: 'none',
          background: 'transparent', cursor: 'pointer', fontSize: 11,
          color: 'var(--text-subtle)', padding: 0,
        }}
        tabIndex={-1}
      >
        ×
      </button>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
      <div style={{ width: 48, height: 6, borderRadius: 3, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 24 }}>{score}</span>
    </div>
  );
}

export function AddCriterionButton({ onAdd }: { onAdd: (c: ScoringCriterion) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');

  function submit() {
    if (!label.trim()) return;
    onAdd({ id: `crit_${Date.now()}`, label: label.trim(), description: desc.trim(), weight: 0 });
    setLabel(''); setDesc(''); setOpen(false);
  }

  if (!open) return (
    <button className="btn btn-sm" onClick={() => setOpen(true)}>
      <Plus size={13} /> Add criterion
    </button>
  );

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="field">
        <label className="field-label">Label</label>
        <input className="input input-sm" value={label} onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
          autoFocus placeholder="e.g. Customer impact" />
      </div>
      <div className="field" style={{ marginTop: 8 }}>
        <label className="field-label">Description</label>
        <input className="input input-sm" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Brief guidance for raters" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={!label.trim()}>Add</button>
        <button className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
