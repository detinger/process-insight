import { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, MessageSquare,
  Lightbulb, HelpCircle, Clock, AlertTriangle, Users,
  Zap, Terminal, User, FileText, CheckCircle, Pause,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type {
  DiscoveryInterview, DiscoveryInterviewItem, InterviewItemType,
  DiscoveryObservation, ObservationType2,
  StormingCard, StormingCardType,
  Contradiction, ContradictionStatus,
} from '../../domain/contracts/types';

// ─── Tab type ────────────────────────────────────────────────

type DiscoverTab = 'interviews' | 'observations' | 'storming' | 'contradictions';

// ─── Shared helpers ──────────────────────────────────────────

function now() { return new Date().toISOString(); }

// ─── Main workspace ──────────────────────────────────────────

export function DiscoverWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<DiscoverTab>('interviews');

  const TABS: { id: DiscoverTab; label: string }[] = [
    { id: 'interviews',     label: 'Interview synthesis' },
    { id: 'observations',   label: 'Observation timeline' },
    { id: 'storming',       label: 'Event storming' },
    { id: 'contradictions', label: 'Contradiction log' },
  ];

  return (
    <div className="workspace">
      <div className="workspace-narrow">
        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px', fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none', border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'interviews'     && <InterviewPanel     projectId={projectId} />}
        {tab === 'observations'   && <ObservationPanel   projectId={projectId} />}
        {tab === 'storming'       && <StormingPanel      projectId={projectId} />}
        {tab === 'contradictions' && <ContradictionPanel projectId={projectId} />}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. INTERVIEW SYNTHESIS
// ═══════════════════════════════════════════════════════════

const ITEM_ICONS: Record<InterviewItemType, React.ReactNode> = {
  quote:    <MessageSquare size={12} />,
  claim:    <Lightbulb size={12} />,
  question: <HelpCircle size={12} />,
};

const ITEM_COLORS: Record<InterviewItemType, string> = {
  quote:    'var(--info)',
  claim:    'var(--accent)',
  question: 'var(--warning)',
};

function InterviewPanel({ projectId }: { projectId: string }) {
  const [interviews, setInterviews] = useState<DiscoveryInterview[]>([]);
  const [items, setItems] = useState<DiscoveryInterviewItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingInterview, setAddingInterview] = useState(false);
  const [form, setForm] = useState({ interviewee: '', role: '', date: '', notes: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [itemText, setItemText] = useState('');
  const [itemType, setItemType] = useState<InterviewItemType>('quote');

  useEffect(() => {
    db.interviews.where('projectId').equals(projectId).toArray().then(rows => {
      setInterviews(rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    });
  }, [projectId]);

  useEffect(() => {
    if (!selectedId) return;
    db.interviewItems.where('interviewId').equals(selectedId).toArray().then(rows => {
      setItems(rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    });
  }, [selectedId]);

  async function createInterview() {
    if (!form.interviewee.trim()) return;
    const rec: DiscoveryInterview = {
      id: newId('int'), projectId,
      interviewee: form.interviewee.trim(),
      role: form.role.trim(),
      date: form.date || undefined,
      notes: form.notes.trim(),
      createdAt: now(),
    };
    await db.interviews.add(rec);
    setInterviews(prev => [...prev, rec]);
    setSelectedId(rec.id);
    setForm({ interviewee: '', role: '', date: '', notes: '' });
    setAddingInterview(false);
  }

  async function deleteInterview(id: string) {
    await db.interviews.delete(id);
    await db.interviewItems.where('interviewId').equals(id).delete();
    setInterviews(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) { setSelectedId(null); setItems([]); }
  }

  async function addItem() {
    if (!itemText.trim() || !selectedId) return;
    const rec: DiscoveryInterviewItem = {
      id: newId('iti'), projectId,
      interviewId: selectedId,
      type: itemType,
      text: itemText.trim(),
      createdAt: now(),
    };
    await db.interviewItems.add(rec);
    setItems(prev => [...prev, rec]);
    setItemText('');
    setAddingItem(false);
  }

  async function deleteItem(id: string) {
    await db.interviewItems.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const selected = interviews.find(i => i.id === selectedId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, minHeight: 400 }}>
      {/* Left: interview list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)' }}>Interviews</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setAddingInterview(a => !a)}>
            <Plus size={13} /> Add
          </button>
        </div>

        {addingInterview && (
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input input-sm" placeholder="Interviewee name *" value={form.interviewee} onChange={e => setForm(f => ({ ...f, interviewee: e.target.value }))} autoFocus />
            <input className="input input-sm" placeholder="Role / title" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            <input className="input input-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <textarea className="input input-sm" placeholder="Session notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-primary" onClick={createInterview} disabled={!form.interviewee.trim()}>Add</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setAddingInterview(false)}>Cancel</button>
            </div>
          </div>
        )}

        {interviews.length === 0 && !addingInterview && (
          <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: '12px 0' }}>No interviews yet. Add one to start.</div>
        )}

        {interviews.map(iv => (
          <div
            key={iv.id}
            onClick={() => setSelectedId(iv.id)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 4,
              background: selectedId === iv.id ? 'var(--primary-soft)' : 'var(--bg-subtle)',
              border: selectedId === iv.id ? '1px solid var(--primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: selectedId === iv.id ? 'var(--primary)' : 'var(--text)' }}>{iv.interviewee}</div>
              {iv.role && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{iv.role}</div>}
              {iv.date && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{iv.date}</div>}
            </div>
            <button
              className="btn btn-sm btn-ghost"
              style={{ padding: 2, flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); deleteInterview(iv.id); }}
              aria-label="Delete interview"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Right: items */}
      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
        {!selected ? (
          <div style={{ color: 'var(--text-subtle)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
            Select an interview to view or add notes.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selected.interviewee}</div>
                {selected.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selected.notes}</div>}
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setAddingItem(a => !a)}>
                <Plus size={13} /> Add item
              </button>
            </div>

            {addingItem && (
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 10, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['quote', 'claim', 'question'] as InterviewItemType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setItemType(t)}
                      style={{
                        padding: '3px 10px', borderRadius: 4, fontSize: 12, border: '1px solid',
                        borderColor: itemType === t ? ITEM_COLORS[t] : 'var(--border)',
                        background: itemType === t ? `color-mix(in srgb, ${ITEM_COLORS[t]} 12%, transparent)` : 'transparent',
                        color: itemType === t ? ITEM_COLORS[t] : 'var(--text-muted)', cursor: 'pointer',
                      }}
                    >
                      {ITEM_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
                <textarea
                  className="input"
                  placeholder={itemType === 'quote' ? 'Direct quote from the interviewee…' : itemType === 'claim' ? 'A claim or insight to investigate…' : 'Follow-up question to pursue…'}
                  rows={2}
                  value={itemText}
                  onChange={e => setItemText(e.target.value)}
                  autoFocus
                  style={{ resize: 'vertical' }}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addItem(); }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-primary" onClick={addItem} disabled={!itemText.trim()}>Add</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setAddingItem(false); setItemText(''); }}>Cancel</button>
                </div>
              </div>
            )}

            {items.length === 0 && !addingItem && (
              <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>No items yet. Add a quote, claim or question.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 6,
                  background: 'var(--bg-subtle)',
                  borderLeft: `3px solid ${ITEM_COLORS[item.type]}`,
                }}>
                  <span style={{ color: ITEM_COLORS[item.type], flexShrink: 0, marginTop: 1 }}>{ITEM_ICONS[item.type]}</span>
                  <span style={{ fontSize: 13, flex: 1, lineHeight: 1.5 }}>{item.text}</span>
                  <button className="btn btn-sm btn-ghost" style={{ padding: 2, flexShrink: 0 }} onClick={() => deleteItem(item.id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. OBSERVATION TIMELINE
// ═══════════════════════════════════════════════════════════

const OBS_META: Record<ObservationType2, { icon: React.ReactNode; color: string; label: string }> = {
  work:        { icon: <FileText size={13} />,       color: 'var(--info)',    label: 'Work performed' },
  delay:       { icon: <Clock size={13} />,           color: 'var(--warning)', label: 'Delay' },
  exception:   { icon: <AlertTriangle size={13} />,   color: 'var(--error)',   label: 'Exception' },
  interaction: { icon: <Users size={13} />,           color: 'var(--success)', label: 'Interaction' },
};

function ObservationPanel({ projectId }: { projectId: string }) {
  const [obs, setObs] = useState<DiscoveryObservation[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: 'work' as ObservationType2, actor: '', description: '' });

  useEffect(() => {
    db.observations.where('projectId').equals(projectId).toArray().then(rows => {
      setObs(rows.sort((a, b) => a.sequence - b.sequence));
    });
  }, [projectId]);

  async function addObs() {
    if (!form.description.trim()) return;
    const rec: DiscoveryObservation = {
      id: newId('obs'), projectId,
      type: form.type,
      actor: form.actor.trim(),
      description: form.description.trim(),
      sequence: obs.length,
      createdAt: now(),
    };
    await db.observations.add(rec);
    setObs(prev => [...prev, rec]);
    setForm(f => ({ ...f, actor: '', description: '' }));
    setAdding(false);
  }

  async function deleteObs(id: string) {
    await db.observations.delete(id);
    setObs(prev => prev.filter(o => o.id !== id));
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = obs.findIndex(o => o.id === id);
    const other = obs[idx + dir];
    if (!other) return;
    const seqA = obs[idx].sequence;
    const seqB = other.sequence;
    await db.observations.update(id, { sequence: seqB });
    await db.observations.update(other.id, { sequence: seqA });
    const updated = [...obs];
    updated[idx] = { ...updated[idx], sequence: seqB };
    updated[idx + dir] = { ...updated[idx + dir], sequence: seqA };
    setObs(updated.sort((a, b) => a.sequence - b.sequence));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Log what you observed: work performed, delays, exceptions and visible interactions.
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setAdding(a => !a)}>
          <Plus size={13} /> Add entry
        </button>
      </div>

      {adding && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.entries(OBS_META) as [ObservationType2, typeof OBS_META[ObservationType2]][]).map(([t, m]) => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{
                  padding: '3px 10px', borderRadius: 4, fontSize: 12, border: '1px solid', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  borderColor: form.type === t ? m.color : 'var(--border)',
                  background: form.type === t ? `color-mix(in srgb, ${m.color} 12%, transparent)` : 'transparent',
                  color: form.type === t ? m.color : 'var(--text-muted)',
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <input className="input input-sm" placeholder="Actor / role (e.g. Service desk agent)" value={form.actor} onChange={e => setForm(f => ({ ...f, actor: e.target.value }))} />
          <textarea className="input" placeholder="What did you observe?" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} autoFocus style={{ resize: 'vertical' }} onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addObs(); }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-primary" onClick={addObs} disabled={!form.description.trim()}>Add</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {obs.length === 0 && !adding && (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-title">No observations yet</div>
          <div className="empty-state-desc">Add work steps, delays, exceptions and interactions as you observe them.</div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {/* Timeline spine */}
        {obs.length > 0 && (
          <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }} />
        )}
        {obs.map((o, idx) => {
          const meta = OBS_META[o.type];
          return (
            <div key={o.id} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start', position: 'relative' }}>
              {/* Dot */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                background: `color-mix(in srgb, ${meta.color} 15%, var(--bg))`,
                border: `2px solid ${meta.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: meta.color, marginTop: 10,
              }}>
                {meta.icon}
              </div>

              {/* Card */}
              <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${meta.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase' }}>{meta.label}</span>
                  {o.actor && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>· {o.actor}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{o.description}</p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, paddingTop: 6 }}>
                <button className="btn btn-sm btn-ghost" style={{ padding: 2 }} onClick={() => move(o.id, -1)} disabled={idx === 0}><ArrowUp size={11} /></button>
                <button className="btn btn-sm btn-ghost" style={{ padding: 2 }} onClick={() => move(o.id, 1)} disabled={idx === obs.length - 1}><ArrowDown size={11} /></button>
                <button className="btn btn-sm btn-ghost" style={{ padding: 2 }} onClick={() => deleteObs(o.id)}><Trash2 size={11} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. EVENT STORMING BOARD
// ═══════════════════════════════════════════════════════════

const STORM_META: Record<StormingCardType, { icon: React.ReactNode; color: string; bg: string; label: string; placeholder: string }> = {
  event:   { icon: <Zap size={12} />,      color: '#92400e', bg: '#fef3c7', label: 'Domain Event',  placeholder: 'e.g. Cloud resource requested' },
  command: { icon: <Terminal size={12} />, color: '#1e40af', bg: '#dbeafe', label: 'Command',        placeholder: 'e.g. Submit resource request' },
  actor:   { icon: <User size={12} />,     color: '#065f46', bg: '#d1fae5', label: 'Actor',          placeholder: 'e.g. Developer' },
  policy:  { icon: <FileText size={12} />, color: '#5b21b6', bg: '#ede9fe', label: 'Policy',         placeholder: 'e.g. Requests > $500 need approval' },
};

function StormingPanel({ projectId }: { projectId: string }) {
  const [cards, setCards] = useState<StormingCard[]>([]);
  const [addingType, setAddingType] = useState<StormingCardType | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    db.stormingCards.where('projectId').equals(projectId).toArray().then(rows => {
      setCards(rows.sort((a, b) => a.sequence - b.sequence));
    });
  }, [projectId]);

  async function addCard() {
    if (!text.trim() || !addingType) return;
    const rec: StormingCard = {
      id: newId('sc'), projectId,
      type: addingType,
      text: text.trim(),
      sequence: cards.length,
    };
    await db.stormingCards.add(rec);
    setCards(prev => [...prev, rec]);
    setText('');
    setAddingType(null);
  }

  async function deleteCard(id: string) {
    await db.stormingCards.delete(id);
    setCards(prev => prev.filter(c => c.id !== id));
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = cards.findIndex(c => c.id === id);
    const other = cards[idx + dir];
    if (!other) return;
    const seqA = cards[idx].sequence;
    const seqB = other.sequence;
    await db.stormingCards.update(id, { sequence: seqB });
    await db.stormingCards.update(other.id, { sequence: seqA });
    const updated = [...cards];
    updated[idx] = { ...updated[idx], sequence: seqB };
    updated[idx + dir] = { ...updated[idx + dir], sequence: seqA };
    setCards(updated.sort((a, b) => a.sequence - b.sequence));
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Place domain events, commands, actors and policies on a shared timeline. Add cards left-to-right as the flow unfolds.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(STORM_META) as [StormingCardType, typeof STORM_META[StormingCardType]][]).map(([t, m]) => (
            <button
              key={t}
              onClick={() => { setAddingType(addingType === t ? null : t); setText(''); }}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                background: addingType === t ? m.bg : 'var(--bg-subtle)',
                color: m.color, border: `1px solid ${addingType === t ? m.color : 'var(--border)'}`,
              }}
            >
              <Plus size={12} /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {addingType && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 8, padding: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: STORM_META[addingType].bg, border: `1px solid ${STORM_META[addingType].color}`, flexShrink: 0 }} />
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={STORM_META[addingType].placeholder}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') addCard(); if (e.key === 'Escape') { setAddingType(null); setText(''); } }}
          />
          <button className="btn btn-sm btn-primary" onClick={addCard} disabled={!text.trim()}>Add</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setAddingType(null); setText(''); }}>✕</button>
        </div>
      )}

      {cards.length === 0 && !addingType && (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-title">Board is empty</div>
          <div className="empty-state-desc">Start by adding domain events (what happened), then commands (what triggered them), actors (who did it) and policies (what rules apply).</div>
        </div>
      )}

      {/* Board: horizontal scrollable */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', paddingTop: 4 }}>
          {cards.map((card, idx) => {
            const meta = STORM_META[card.type];
            return (
              <div
                key={card.id}
                style={{
                  width: 150, minHeight: 90, borderRadius: 6, padding: '8px 10px',
                  background: meta.bg, border: `1px solid ${meta.color}`,
                  display: 'flex', flexDirection: 'column', gap: 4,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase' }}>{meta.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: meta.color, lineHeight: 1.4, flex: 1 }}>{card.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: meta.color, opacity: 0.6 }}>#{idx + 1}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => move(card.id, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, color: meta.color, opacity: idx === 0 ? 0.3 : 1 }}>◀</button>
                    <button onClick={() => move(card.id, 1)} disabled={idx === cards.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, color: meta.color, opacity: idx === cards.length - 1 ? 0.3 : 1 }}>▶</button>
                    <button onClick={() => deleteCard(card.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, color: meta.color }}><Trash2 size={10} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cards.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(Object.entries(STORM_META) as [StormingCardType, typeof STORM_META[StormingCardType]][]).map(([t, m]) => {
            const count = cards.filter(c => c.type === t).length;
            return count > 0 ? (
              <span key={t} style={{ fontSize: 12, color: m.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.icon} {count} {m.label}{count > 1 ? 's' : ''}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. CONTRADICTION LOG
// ═══════════════════════════════════════════════════════════

const STATUS_META: Record<ContradictionStatus, { icon: React.ReactNode; color: string; label: string }> = {
  open:     { icon: <AlertTriangle size={12} />, color: 'var(--error)',   label: 'Open' },
  resolved: { icon: <CheckCircle size={12} />,   color: 'var(--success)', label: 'Resolved' },
  deferred: { icon: <Pause size={12} />,         color: 'var(--warning)', label: 'Deferred' },
};

function ContradictionPanel({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Contradiction[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ topic: '', sourceA: '', claimA: '', sourceB: '', claimB: '' });

  useEffect(() => {
    db.contradictions.where('projectId').equals(projectId).toArray().then(rows => {
      setItems(rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    });
  }, [projectId]);

  async function addContradiction() {
    if (!form.topic.trim() || !form.claimA.trim() || !form.claimB.trim()) return;
    const rec: Contradiction = {
      id: newId('ctr'), projectId,
      topic: form.topic.trim(),
      sourceA: form.sourceA.trim(),
      claimA: form.claimA.trim(),
      sourceB: form.sourceB.trim(),
      claimB: form.claimB.trim(),
      status: 'open',
      resolution: '',
      createdAt: now(),
    };
    await db.contradictions.add(rec);
    setItems(prev => [...prev, rec]);
    setForm({ topic: '', sourceA: '', claimA: '', sourceB: '', claimB: '' });
    setAdding(false);
    setExpandedId(rec.id);
  }

  async function updateStatus(id: string, status: ContradictionStatus) {
    await db.contradictions.update(id, { status });
    setItems(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  async function updateResolution(id: string, resolution: string) {
    await db.contradictions.update(id, { resolution });
    setItems(prev => prev.map(c => c.id === id ? { ...c, resolution } : c));
  }

  async function deleteItem(id: string) {
    await db.contradictions.delete(id);
    setItems(prev => prev.filter(c => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  const openCount = items.filter(c => c.status === 'open').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Track disagreements between sources. Do not resolve by picking the more convenient side.
          {openCount > 0 && <span style={{ color: 'var(--error)', fontWeight: 600, marginLeft: 8 }}>{openCount} open</span>}
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setAdding(a => !a)}>
          <Plus size={13} /> Add contradiction
        </button>
      </div>

      {adding && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="input input-sm" placeholder="Topic / claim being disputed *" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="input input-sm" placeholder="Source A (e.g. Interview: Alice)" value={form.sourceA} onChange={e => setForm(f => ({ ...f, sourceA: e.target.value }))} />
            <input className="input input-sm" placeholder="Source B (e.g. Document: SLA doc)" value={form.sourceB} onChange={e => setForm(f => ({ ...f, sourceB: e.target.value }))} />
            <textarea className="input input-sm" placeholder="Source A claims… *" rows={2} value={form.claimA} onChange={e => setForm(f => ({ ...f, claimA: e.target.value }))} style={{ resize: 'vertical' }} />
            <textarea className="input input-sm" placeholder="Source B claims… *" rows={2} value={form.claimB} onChange={e => setForm(f => ({ ...f, claimB: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-primary" onClick={addContradiction} disabled={!form.topic.trim() || !form.claimA.trim() || !form.claimB.trim()}>Add</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-title">No contradictions logged</div>
          <div className="empty-state-desc">When two sources disagree, record both sides here without picking a winner.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const statusMeta = STATUS_META[item.status];
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {/* Row header */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: isExpanded ? 'var(--bg-subtle)' : 'none' }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span style={{ color: statusMeta.color, flexShrink: 0 }}>{statusMeta.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.topic}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: statusMeta.color, padding: '2px 7px', borderRadius: 4, background: `color-mix(in srgb, ${statusMeta.color} 12%, transparent)`, flexShrink: 0 }}>
                  {statusMeta.label}
                </span>
                {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />}
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <div style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '8px 10px', borderLeft: '3px solid var(--info)' }}>
                      {item.sourceA && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--info)', marginBottom: 4 }}>{item.sourceA}</div>}
                      <p style={{ margin: 0, fontSize: 13 }}>{item.claimA}</p>
                    </div>
                    <div style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '8px 10px', borderLeft: '3px solid var(--accent)' }}>
                      {item.sourceB && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{item.sourceB}</div>}
                      <p style={{ margin: 0, fontSize: 13 }}>{item.claimB}</p>
                    </div>
                  </div>

                  {item.status !== 'open' && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 4 }}>Resolution note</div>
                      <textarea
                        className="input input-sm"
                        placeholder="How was this resolved or why was it deferred?"
                        rows={2}
                        value={item.resolution}
                        onChange={e => updateResolution(item.id, e.target.value)}
                        style={{ resize: 'vertical', width: '100%' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {(['open', 'resolved', 'deferred'] as ContradictionStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(item.id, s)}
                        style={{
                          padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${item.status === s ? STATUS_META[s].color : 'var(--border)'}`,
                          background: item.status === s ? `color-mix(in srgb, ${STATUS_META[s].color} 12%, transparent)` : 'transparent',
                          color: item.status === s ? STATUS_META[s].color : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        {STATUS_META[s].icon} {STATUS_META[s].label}
                      </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-sm btn-ghost" onClick={() => deleteItem(item.id)}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.some(c => c.status === 'open') && (
        <div className="callout callout-warning" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 13 }}>
            <strong>{openCount} contradiction{openCount > 1 ? 's' : ''} remain open.</strong> Review them before finalizing your process landscape or journey map — open contradictions may hide a critical assumption.
          </span>
        </div>
      )}
    </div>
  );
}
