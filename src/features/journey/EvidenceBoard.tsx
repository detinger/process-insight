// Evidence board with contradiction detection (AT-14).
// Displays evidence records linked to the current project.
// Supports importing fictional evidence, promoting clusters to candidates,
// and manually flagging contradictions between two evidence items.
// Contradictions are stored as EvidenceLinks with relation='contradicts'.

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle, FileText, MessageSquare, Eye, X, ChevronDown } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type { EvidenceRecord, EvidenceLink, EvidenceType } from '../../domain/contracts/types';

interface Props {
  projectId: string;
  onClose: () => void;
}

const TYPE_ICONS: Record<EvidenceType, React.ReactNode> = {
  interview:   <MessageSquare size={13} />,
  observation: <Eye size={13} />,
  document:    <FileText size={13} />,
  survey:      <FileText size={13} />,
  workshop:    <MessageSquare size={13} />,
  assumption:  <AlertTriangle size={13} />,
};

export function EvidenceBoard({ projectId, onClose }: Props) {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [links, setLinks] = useState<EvidenceLink[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [markingContradiction, setMarkingContradiction] = useState<string | null>(null);
  const [contradictionTarget, setContradictionTarget] = useState('');

  // Form state
  const [form, setForm] = useState({
    type: 'interview' as EvidenceType,
    title: '',
    content: '',
    sourceRole: '',
    excerpt: '',
    confidence: 'medium' as EvidenceRecord['confidence'],
    synthetic: false,
  });

  useEffect(() => {
    Promise.all([
      db.evidence.where('projectId').equals(projectId).toArray(),
      db.evidenceLinks.where('projectId').equals(projectId).toArray(),
    ]).then(([evid, lnks]) => {
      setEvidence(evid);
      setLinks(lnks);
    });
  }, [projectId]);

  async function createEvidence() {
    if (!form.title.trim()) return;
    const rec: EvidenceRecord = {
      id: newId('ev'),
      projectId,
      type: form.type,
      title: form.title.trim(),
      content: form.content,
      sourceRole: form.sourceRole,
      excerpt: form.excerpt,
      confidence: form.confidence,
      synthetic: form.synthetic,
      context: '',
    };
    await db.evidence.add(rec);
    setEvidence(prev => [...prev, rec]);
    setForm({ type: 'interview', title: '', content: '', sourceRole: '', excerpt: '', confidence: 'medium', synthetic: false });
    setCreating(false);
    setSelected(rec.id);
  }

  async function markContradiction(aId: string, bId: string) {
    // Check if already linked
    const existing = links.find(l =>
      l.relation === 'contradicts' &&
      ((l.claim.artifactId === aId && l.evidenceId === bId) ||
       (l.claim.artifactId === bId && l.evidenceId === aId))
    );
    if (existing) return;

    const link: EvidenceLink = {
      id: newId('evlink'),
      projectId,
      claim: { kind: 'evidence', artifactId: aId },
      evidenceId: bId,
      relation: 'contradicts',
      excerpt: '',
    };
    await db.evidenceLinks.add(link);
    setLinks(prev => [...prev, link]);
    setMarkingContradiction(null);
    setContradictionTarget('');
  }

  async function removeContradiction(linkId: string) {
    await db.evidenceLinks.delete(linkId);
    setLinks(prev => prev.filter(l => l.id !== linkId));
  }

  const selectedEvidence = selected ? evidence.find(e => e.id === selected) : null;

  // Find contradictions for selected item
  const contradictions = selectedEvidence
    ? links.filter(l =>
        l.relation === 'contradicts' &&
        (l.claim.artifactId === selectedEvidence.id || l.evidenceId === selectedEvidence.id)
      )
    : [];

  const contradictionPeers = contradictions.map(l => {
    const peerId = l.claim.artifactId === selectedEvidence?.id ? l.evidenceId : l.claim.artifactId;
    return { link: l, peer: evidence.find(e => e.id === peerId) };
  });

  // Count global contradictions
  const totalContradictions = links.filter(l => l.relation === 'contradicts').length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'stretch', zIndex: 50,
    }}>
      <div style={{
        marginLeft: 'auto', width: 900, maxWidth: '95vw',
        background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Phase 3</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Evidence board</h2>
          </div>
          {totalContradictions > 0 && (
            <div className="badge" style={{ background: 'var(--error-soft)', color: 'var(--error)', borderColor: 'var(--error)' }}>
              <AlertTriangle size={11} /> {totalContradictions} contradiction{totalContradictions > 1 ? 's' : ''}
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            <Plus size={13} /> Add evidence
          </button>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Evidence list */}
          <div style={{
            width: 280, borderRight: '1px solid var(--border)',
            overflowY: 'auto', flexShrink: 0,
          }}>
            {creating && (
              <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--primary-soft)' }}>
                <div className="field">
                  <label className="field-label">Type</label>
                  <select className="input input-sm" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as EvidenceType }))}>
                    {(['interview', 'observation', 'document', 'survey', 'workshop', 'assumption'] as EvidenceType[]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginTop: 6 }}>
                  <label className="field-label">Title</label>
                  <input className="input input-sm" placeholder="Short description"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') createEvidence(); if (e.key === 'Escape') setCreating(false); }}
                    autoFocus
                  />
                </div>
                <div className="field" style={{ marginTop: 6 }}>
                  <label className="field-label">Source role</label>
                  <input className="input input-sm" placeholder="e.g. IT Admin, Security Lead"
                    value={form.sourceRole} onChange={e => setForm(f => ({ ...f, sourceRole: e.target.value }))}
                  />
                </div>
                <div className="field" style={{ marginTop: 6 }}>
                  <label className="field-label">Confidence</label>
                  <select className="input input-sm" value={form.confidence}
                    onChange={e => setForm(f => ({ ...f, confidence: e.target.value as EvidenceRecord['confidence'] }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={{ marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <input type="checkbox" checked={form.synthetic}
                      onChange={e => setForm(f => ({ ...f, synthetic: e.target.checked }))} />
                    Synthetic / fictional (for lab use)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={createEvidence} disabled={!form.title.trim()}>Add</button>
                  <button className="btn btn-sm" onClick={() => setCreating(false)}>Cancel</button>
                </div>
              </div>
            )}
            {evidence.length === 0 && !creating ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-state-title" style={{ fontSize: 13 }}>No evidence yet</div>
                <div className="empty-state-desc" style={{ fontSize: 12 }}>
                  Import interviews, observations and documents to support or challenge your process analysis.
                </div>
              </div>
            ) : (
              evidence.map(ev => {
                const hasContradiction = links.some(l =>
                  l.relation === 'contradicts' &&
                  (l.claim.artifactId === ev.id || l.evidenceId === ev.id)
                );
                return (
                  <button key={ev.id}
                    onClick={() => setSelected(ev.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      border: 'none', cursor: 'pointer',
                      background: selected === ev.id ? 'var(--primary-soft)' : 'none',
                      borderLeft: selected === ev.id ? '2px solid var(--primary)' : '2px solid transparent',
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}>
                    <span style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>
                      {TYPE_ICONS[ev.type]}
                    </span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', gap: 4, marginTop: 2 }}>
                        <span>{ev.type}</span>
                        <span>·</span>
                        <span>{ev.confidence}</span>
                        {ev.synthetic && <><span>·</span><span style={{ color: 'var(--accent)' }}>synthetic</span></>}
                        {hasContradiction && <><span>·</span><AlertTriangle size={10} style={{ color: 'var(--error)' }} /></>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Inspector */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {!selectedEvidence ? (
              <div className="empty-state">
                <div className="empty-state-title">Select an evidence record</div>
                <div className="empty-state-desc">
                  Review its content, add an excerpt, link it to process claims, or mark contradictions with other sources.
                </div>
              </div>
            ) : (
              <EvidenceInspector
                record={selectedEvidence}
                contradictions={contradictionPeers}
                allEvidence={evidence}
                markingContradiction={markingContradiction}
                contradictionTarget={contradictionTarget}
                onSetContradictionTarget={setContradictionTarget}
                onStartMarkContradiction={() => setMarkingContradiction(selectedEvidence.id)}
                onConfirmContradiction={() => {
                  if (contradictionTarget) markContradiction(selectedEvidence.id, contradictionTarget);
                }}
                onRemoveContradiction={removeContradiction}
                onUpdate={async patch => {
                  await db.evidence.update(selectedEvidence.id, patch);
                  setEvidence(prev => prev.map(e => e.id === selectedEvidence.id ? { ...e, ...patch } : e));
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceInspector({
  record, contradictions, allEvidence,
  markingContradiction, contradictionTarget,
  onSetContradictionTarget, onStartMarkContradiction, onConfirmContradiction,
  onRemoveContradiction, onUpdate,
}: {
  record: EvidenceRecord;
  contradictions: { link: EvidenceLink; peer: EvidenceRecord | undefined }[];
  allEvidence: EvidenceRecord[];
  markingContradiction: string | null;
  contradictionTarget: string;
  onSetContradictionTarget: (id: string) => void;
  onStartMarkContradiction: () => void;
  onConfirmContradiction: () => void;
  onRemoveContradiction: (linkId: string) => void;
  onUpdate: (patch: Partial<EvidenceRecord>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: 'var(--text-muted)' }}>{TYPE_ICONS[record.type]}</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, flex: 1, margin: 0 }}>{record.title}</h3>
        <span className="badge">{record.confidence} confidence</span>
        {record.synthetic && <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>synthetic</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 13 }}>
        <div>
          <label className="field-label">Type</label>
          <div style={{ color: 'var(--text)' }}>{record.type}</div>
        </div>
        <div>
          <label className="field-label">Source role</label>
          <input className="input input-sm" value={record.sourceRole}
            onChange={e => onUpdate({ sourceRole: e.target.value })}
            placeholder="Who provided this?"
          />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label className="field-label">Content</label>
        <textarea className="input" style={{ minHeight: 100, fontSize: 13 }}
          value={record.content}
          onChange={e => onUpdate({ content: e.target.value })}
          placeholder="Full text, notes, or transcript excerpt…"
        />
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field-label">Key excerpt (claim being supported or challenged)</label>
        <input className="input input-sm" value={record.excerpt}
          onChange={e => onUpdate({ excerpt: e.target.value })}
          placeholder="Single sentence capturing the core claim"
        />
      </div>

      {/* Contradictions section */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title-row" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <span className="card-title" style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            {contradictions.length > 0
              ? <AlertTriangle size={13} style={{ color: 'var(--error)' }} />
              : <CheckCircle size={13} style={{ color: 'var(--success)' }} />}
            Contradictions ({contradictions.length})
          </span>
          <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
        </div>
        {expanded && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Evidence contradictions are retained as first-class records.
              Neither source is automatically dismissed. Both remain visible
              and must be explicitly resolved by the analyst.
            </p>
            {contradictions.map(({ link, peer }) => (
              <div key={link.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: 'var(--error-soft)',
                borderRadius: 6, marginBottom: 6, border: '1px solid var(--error)',
              }}>
                <AlertTriangle size={12} style={{ color: 'var(--error)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>
                  Contradicts: <strong>{peer?.title ?? 'Unknown'}</strong>
                </span>
                <button className="btn btn-icon btn-sm"
                  onClick={() => onRemoveContradiction(link.id)}
                  title="Remove contradiction link">
                  <X size={12} />
                </button>
              </div>
            ))}
            {markingContradiction === record.id ? (
              <div style={{ marginTop: 8 }}>
                <div className="field">
                  <label className="field-label">Contradicts which other source?</label>
                  <select className="input input-sm" value={contradictionTarget}
                    onChange={e => onSetContradictionTarget(e.target.value)}>
                    <option value="">— select —</option>
                    {allEvidence.filter(e => e.id !== record.id).map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', borderColor: 'var(--error)' }}
                    onClick={onConfirmContradiction} disabled={!contradictionTarget}>
                    Mark contradiction
                  </button>
                  <button className="btn btn-sm" onClick={() => onSetContradictionTarget('')}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={onStartMarkContradiction}>
                <AlertTriangle size={12} /> Mark contradiction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
