// Merge two process candidates into one canonical record (AT-09).
// The merged candidate keeps its status = 'merged' + mergedIntoId pointing to the canonical.
// Combined sourceRefs and evidence IDs are retained on the canonical.
// Operation is reversible: set merged candidate's status back to any active status.

import { useState } from 'react';
import { GitMerge, AlertTriangle } from 'lucide-react';
import { db } from '../../storage/db';
import type { ProcessCandidate } from '../../domain/contracts/types';

interface Props {
  candidates: ProcessCandidate[];
  primaryId: string; // pre-selected "keep" candidate
  onMerged: (canonical: ProcessCandidate, merged: ProcessCandidate) => void;
  onClose: () => void;
}

export function MergeDialog({ candidates, primaryId, onMerged, onClose }: Props) {
  const active = candidates.filter(c => c.status !== 'merged' && c.status !== 'rejected');
  const [canonicalId, setCanonicalId] = useState(primaryId);
  const [mergeId, setMergeId] = useState(() => {
    const other = active.find(c => c.id !== primaryId);
    return other?.id ?? '';
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canonical = candidates.find(c => c.id === canonicalId);
  const toMerge = candidates.find(c => c.id === mergeId);

  async function doMerge() {
    if (!canonical || !toMerge || canonicalId === mergeId) return;
    setSaving(true);
    setError('');
    try {
      // Combine sourceRefs and evidenceIds (dedup by id)
      const combinedRefs = [
        ...canonical.sourceRefs,
        ...toMerge.sourceRefs.filter(r => !canonical.sourceRefs.some(e => e.artifactId === r.artifactId)),
      ];

      await db.transaction('rw', [db.candidates], async () => {
        await db.candidates.update(canonicalId, { sourceRefs: combinedRefs });
        await db.candidates.update(mergeId, {
          status: 'merged',
          mergedIntoId: canonicalId,
        });
      });

      const updatedCanonical = { ...canonical, sourceRefs: combinedRefs };
      const updatedMerged = { ...toMerge, status: 'merged' as const, mergedIntoId: canonicalId };
      onMerged(updatedCanonical, updatedMerged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
      setSaving(false);
    }
  }

  return (
    <div className="dialog-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" style={{ width: 520 }}>
        <div className="dialog-header">
          <GitMerge size={16} style={{ color: 'var(--primary)' }} />
          <span className="dialog-title">Merge candidates</span>
        </div>

        <div className="dialog-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Choose the canonical (kept) candidate and the one to merge into it.
            The merged candidate becomes an alias; its evidence and source references
            are combined into the canonical. This operation is reversible.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="field">
              <label className="field-label">Keep (canonical)</label>
              <select
                className="input input-sm"
                value={canonicalId}
                onChange={e => setCanonicalId(e.target.value)}
              >
                {active.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Merge into canonical</label>
              <select
                className="input input-sm"
                value={mergeId}
                onChange={e => setMergeId(e.target.value)}
              >
                <option value="">— select —</option>
                {active.filter(c => c.id !== canonicalId).map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {canonical && toMerge && (
            <div className="callout callout-info" style={{ fontSize: 13 }}>
              <AlertTriangle size={14} className="callout-icon" />
              <div>
                <strong>{toMerge.title}</strong> will be marked as an alias of{' '}
                <strong>{canonical.title}</strong>. Its source references (
                {toMerge.sourceRefs.length}) will be added to the canonical.
                To reverse, change the merged candidate's status back to Proposed.
              </div>
            </div>
          )}

          {error && (
            <div className="callout callout-error" style={{ fontSize: 13, marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            className="btn btn-primary"
            onClick={doMerge}
            disabled={!mergeId || canonicalId === mergeId || saving}
          >
            {saving ? 'Merging…' : 'Merge candidates'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
