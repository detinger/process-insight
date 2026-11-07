import { useState, useEffect } from 'react';
import { Plus, User, Monitor, Radio, X, ChevronRight, Trash2 } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type { Persona, ITSystem, Touchpoint, Channel } from '../../domain/contracts/types';

type DictSection = 'personas' | 'systems' | 'channels' | 'touchpoints';

interface Props {
  projectId: string;
  onClose: () => void;
}

export function DictionaryPanel({ projectId, onClose }: Props) {
  const [section, setSection] = useState<DictSection>('personas');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [systems, setSystems] = useState<ITSystem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      db.personas.where('projectId').equals(projectId).toArray(),
      db.systems.where('projectId').equals(projectId).toArray(),
      db.channels.where('projectId').equals(projectId).toArray(),
      db.touchpoints.where('projectId').equals(projectId).toArray(),
    ]).then(([p, s, c, t]) => {
      setPersonas(p); setSystems(s); setChannels(c); setTouchpoints(t);
    });
  }, [projectId]);

  const counts: Record<DictSection, number> = {
    personas: personas.length,
    systems: systems.length,
    channels: channels.length,
    touchpoints: touchpoints.length,
  };

  async function createPersona(name: string) {
    const p: Persona = {
      id: newId('persona'), projectId, name, role: '', goals: [], needs: [],
      constraints: [], accessibilityNeeds: [], evidenceIds: [],
    };
    await db.personas.add(p);
    setPersonas(prev => [...prev, p]);
    setSelected(p.id);
  }

  async function updatePersona(id: string, patch: Partial<Persona>) {
    await db.personas.update(id, patch);
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  async function deletePersona(id: string) {
    await db.personas.delete(id);
    setPersonas(prev => prev.filter(p => p.id !== id));
    if (selected === id) setSelected(null);
  }

  async function createSystem(name: string) {
    const s: ITSystem = {
      id: newId('sys'), projectId, name, type: '', criticality: 'medium',
      supportingRole: '', evidenceIds: [],
    };
    await db.systems.add(s);
    setSystems(prev => [...prev, s]);
    setSelected(s.id);
  }

  async function updateSystem(id: string, patch: Partial<ITSystem>) {
    await db.systems.update(id, patch);
    setSystems(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  async function createChannel(name: string) {
    const c: Channel = { id: newId('chan'), projectId, name, type: 'portal' };
    await db.channels.add(c);
    setChannels(prev => [...prev, c]);
    setSelected(c.id);
  }

  async function updateChannel(id: string, patch: Partial<Channel>) {
    await db.channels.update(id, patch);
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  async function createTouchpoint(name: string) {
    const t: Touchpoint = {
      id: newId('tp'), projectId, name, purpose: '', channelId: channels[0]?.id ?? '',
      systemIds: [], recipientPersonaIds: [], accessibilityConcerns: [],
    };
    await db.touchpoints.add(t);
    setTouchpoints(prev => [...prev, t]);
    setSelected(t.id);
  }

  async function updateTouchpoint(id: string, patch: Partial<Touchpoint>) {
    await db.touchpoints.update(id, patch);
    setTouchpoints(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0,
      width: 480, background: 'var(--bg-elevated)',
      borderLeft: '1px solid var(--border)', zIndex: 40,
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <span style={{ fontWeight: 650, fontSize: 15, flex: 1 }}>Dictionary</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close dictionary">
          <X size={16} />
        </button>
      </div>

      {/* Section tabs */}
      <div className="tabs" style={{ padding: '0 18px', flexShrink: 0 }}>
        {(['personas', 'systems', 'channels', 'touchpoints'] as DictSection[]).map(s => (
          <button key={s} className={`tab${section === s ? ' active' : ''}`}
            onClick={() => { setSection(s); setSelected(null); setCreating(false); }}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px', flexShrink: 0 }}>
            {creating ? (
              <QuickCreate
                onSave={name => {
                  if (!name.trim()) { setCreating(false); return; }
                  if (section === 'personas') createPersona(name);
                  if (section === 'systems') createSystem(name);
                  if (section === 'channels') createChannel(name);
                  if (section === 'touchpoints') createTouchpoint(name);
                  setCreating(false);
                }}
                onCancel={() => setCreating(false)}
              />
            ) : (
              <button className="btn btn-sm btn-ghost" style={{ width: '100%' }}
                onClick={() => setCreating(true)}>
                <Plus size={13} /> Add {section.slice(0, -1)}
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {section === 'personas' && personas.map(p => (
              <ListItem key={p.id} id={p.id} label={p.name}
                icon={<User size={13} />} selected={selected === p.id}
                onSelect={() => setSelected(p.id)} />
            ))}
            {section === 'systems' && systems.map(s => (
              <ListItem key={s.id} id={s.id} label={s.name}
                icon={<Monitor size={13} />} selected={selected === s.id}
                onSelect={() => setSelected(s.id)} />
            ))}
            {section === 'channels' && channels.map(c => (
              <ListItem key={c.id} id={c.id} label={c.name}
                icon={<Radio size={13} />} selected={selected === c.id}
                onSelect={() => setSelected(c.id)} />
            ))}
            {section === 'touchpoints' && touchpoints.map(t => (
              <ListItem key={t.id} id={t.id} label={t.name}
                icon={<ChevronRight size={13} />} selected={selected === t.id}
                onSelect={() => setSelected(t.id)} />
            ))}
            {counts[section] === 0 && !creating && (
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '12px 10px', textAlign: 'center' }}>
                No {section} yet
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {section === 'personas' && selected && (() => {
            const p = personas.find(p => p.id === selected);
            if (!p) return null;
            return <PersonaEditor persona={p} onUpdate={patch => updatePersona(p.id, patch)} onDelete={() => deletePersona(p.id)} />;
          })()}
          {section === 'systems' && selected && (() => {
            const s = systems.find(s => s.id === selected);
            if (!s) return null;
            return <SystemEditor sys={s} onUpdate={patch => updateSystem(s.id, patch)} />;
          })()}
          {section === 'channels' && selected && (() => {
            const c = channels.find(c => c.id === selected);
            if (!c) return null;
            return <ChannelEditor channel={c} onUpdate={patch => updateChannel(c.id, patch)} />;
          })()}
          {section === 'touchpoints' && selected && (() => {
            const t = touchpoints.find(t => t.id === selected);
            if (!t) return null;
            return (
              <TouchpointEditor
                tp={t} channels={channels} systems={systems} personas={personas}
                onUpdate={patch => updateTouchpoint(t.id, patch)}
              />
            );
          })()}
          {!selected && (
            <SectionIntro section={section} />
          )}
        </div>
      </div>
    </div>
  );
}

function ListItem({ id: _id, label, icon, selected, onSelect }: {
  id: string; label: string; icon: React.ReactNode; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      style={{
        width: '100%', textAlign: 'left', padding: '7px 10px',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, color: 'var(--text)',
        background: selected ? 'var(--primary-soft)' : 'none',
        borderLeft: selected ? '2px solid var(--primary)' : '2px solid transparent',
      }}
      onClick={onSelect}
    >
      <span style={{ color: selected ? 'var(--primary)' : 'var(--text-subtle)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function QuickCreate({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input className="input input-sm" style={{ flex: 1, fontSize: 12 }}
        placeholder="Name…" value={val} onChange={e => setVal(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
      />
      <button className="btn btn-primary btn-sm btn-icon" onClick={() => onSave(val)}>
        <Plus size={12} />
      </button>
      <button className="btn btn-sm btn-icon" onClick={onCancel}>
        <X size={12} />
      </button>
    </div>
  );
}

function SectionIntro({ section }: { section: DictSection }) {
  const info: Record<DictSection, { title: string; desc: string; example: string }> = {
    personas: {
      title: 'Personas',
      desc: 'Analytical viewpoints representing a role and its goals, needs and constraints.',
      example: 'A "Platform engineer" and a "Security reviewer" have different goals on the same access-request process.',
    },
    systems: {
      title: 'IT systems',
      desc: 'Software systems and services referenced across journeys and processes.',
      example: '"Email" is a channel. "Receive reset link" is a touchpoint. "Identity provider" is a system.',
    },
    channels: {
      title: 'Channels',
      desc: 'Communication and interaction channels: portal, email, chat, phone, mobile app, API or in-person.',
      example: 'A channel is "Email". The touchpoint is the specific interaction ("Receive password reset link").',
    },
    touchpoints: {
      title: 'Touchpoints',
      desc: 'Specific interactions with a purpose, channel and recipient. Reused across journeys.',
      example: '"Receive password reset link" — channel: Email, system: Identity provider, purpose: Account recovery.',
    },
  };
  const item = info[section];
  return (
    <div>
      <div className="eyebrow">Dictionary</div>
      <h3 style={{ fontSize: 16, fontWeight: 650, marginBottom: 8 }}>{item.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{item.desc}</p>
      <div className="callout callout-info">
        <ChevronRight size={15} className="callout-icon" />
        <span style={{ fontSize: 12 }}>{item.example}</span>
      </div>
    </div>
  );
}

// ─── Entity editors ───

function PersonaEditor({ persona, onUpdate, onDelete }: {
  persona: Persona; onUpdate: (p: Partial<Persona>) => void; onDelete: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <User size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 650, flex: 1, fontSize: 14 }}>Persona</span>
        <button className="btn btn-sm btn-ghost" onClick={onDelete} title="Delete persona">
          <Trash2 size={13} style={{ color: 'var(--error)' }} />
        </button>
      </div>
      <StrField label="Name" value={persona.name} onChange={v => onUpdate({ name: v })} />
      <StrField label="Role / context" value={persona.role} onChange={v => onUpdate({ role: v })} placeholder="e.g. Junior developer, first month" />
      <ListField label="Goals" items={persona.goals} onChange={v => onUpdate({ goals: v })} placeholder="What does this persona want to achieve?" />
      <ListField label="Needs" items={persona.needs} onChange={v => onUpdate({ needs: v })} placeholder="What information or support do they need?" />
      <ListField label="Constraints" items={persona.constraints} onChange={v => onUpdate({ constraints: v })} placeholder="Time limits, permissions, knowledge gaps…" />
      <ListField label="Accessibility needs" items={persona.accessibilityNeeds} onChange={v => onUpdate({ accessibilityNeeds: v })} placeholder="e.g. screen reader, keyboard navigation" />
      <div className="callout callout-recommendation" style={{ marginTop: 12 }}>
        <User size={14} className="callout-icon" />
        <span style={{ fontSize: 11 }}>
          Avoid demographic stereotypes. Distinguish authored assumptions from interview-supported needs.
          Personas are analytical viewpoints, not predictions about groups.
        </span>
      </div>
    </div>
  );
}

function SystemEditor({ sys, onUpdate }: { sys: ITSystem; onUpdate: (p: Partial<ITSystem>) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Monitor size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 650, flex: 1, fontSize: 14 }}>IT system</span>
      </div>
      <StrField label="Name" value={sys.name} onChange={v => onUpdate({ name: v })} />
      <StrField label="Type" value={sys.type} onChange={v => onUpdate({ type: v })} placeholder="e.g. Identity provider, CRM, portal" />
      <StrField label="Supporting role" value={sys.supportingRole} onChange={v => onUpdate({ supportingRole: v })} placeholder="What role does this system play?" />
      <div className="field">
        <label className="field-label">Criticality</label>
        <select className="input input-sm" value={sys.criticality}
          onChange={e => onUpdate({ criticality: e.target.value as ITSystem['criticality'] })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
  );
}

function ChannelEditor({ channel, onUpdate }: { channel: Channel; onUpdate: (p: Partial<Channel>) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Radio size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 650, flex: 1, fontSize: 14 }}>Channel</span>
      </div>
      <StrField label="Name" value={channel.name} onChange={v => onUpdate({ name: v })} />
      <div className="field">
        <label className="field-label">Type</label>
        <select className="input input-sm" value={channel.type}
          onChange={e => onUpdate({ type: e.target.value as Channel['type'] })}>
          {['portal', 'email', 'chat', 'phone', 'mobile-app', 'api', 'in-person', 'other'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="callout callout-info" style={{ marginTop: 10 }}>
        <ChevronRight size={14} className="callout-icon" />
        <span style={{ fontSize: 11 }}>
          A channel is the medium (e.g. "Email"). A touchpoint is the specific interaction
          (e.g. "Receive reset link"). A system is the technical platform (e.g. "Identity provider").
        </span>
      </div>
    </div>
  );
}

function TouchpointEditor({ tp, channels, systems: _systems, personas: _personas, onUpdate }: {
  tp: Touchpoint; channels: Channel[]; systems: ITSystem[]; personas: Persona[];
  onUpdate: (p: Partial<Touchpoint>) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 650, flex: 1, fontSize: 14 }}>Touchpoint</span>
      </div>
      <StrField label="Name" value={tp.name} onChange={v => onUpdate({ name: v })} />
      <StrField label="Purpose" value={tp.purpose} onChange={v => onUpdate({ purpose: v })}
        placeholder="What is the intent of this interaction?" />
      <div className="field">
        <label className="field-label">Channel</label>
        <select className="input input-sm" value={tp.channelId}
          onChange={e => onUpdate({ channelId: e.target.value })}>
          <option value="">No channel</option>
          {channels.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
        </select>
      </div>
      <ListField label="Accessibility concerns" items={tp.accessibilityConcerns}
        onChange={v => onUpdate({ accessibilityConcerns: v })}
        placeholder="e.g. Screen reader cannot identify the reset control" />
    </div>
  );
}

// ─── Shared field helpers ───

function StrField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input className="input input-sm" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ListField({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const text = items.join('\n');
  return (
    <div className="field">
      <label className="field-label">{label} (one per line)</label>
      <textarea className="input" style={{ fontSize: 12, minHeight: 56 }}
        value={text} placeholder={placeholder}
        onChange={e => onChange(e.target.value.split('\n').filter(Boolean))}
      />
    </div>
  );
}
