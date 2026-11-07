import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type { SipocDiagram, SipocRow } from '../../domain/contracts/types';

function now() { return new Date().toISOString(); }

const COLUMNS: { key: keyof Omit<SipocRow, 'id' | 'projectId' | 'diagramId' | 'order'>; label: string; desc: string; color: string }[] = [
  { key: 'supplier', label: 'Suppliers',     desc: 'Who provides inputs?',          color: '#dbeafe' },
  { key: 'input',    label: 'Inputs',         desc: 'What goes in?',                 color: '#fce7f3' },
  { key: 'step',     label: 'Process',        desc: 'What steps are performed?',     color: '#d1fae5' },
  { key: 'output',   label: 'Outputs',        desc: 'What comes out?',               color: '#fef3c7' },
  { key: 'customer', label: 'Customers',      desc: 'Who receives the output?',      color: '#ede9fe' },
];

export function SipocPanel({ projectId }: { projectId: string }) {
  const [diagrams, setDiagrams] = useState<SipocDiagram[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    db.sipocDiagrams.where('projectId').equals(projectId).toArray().then(rows => {
      const sorted = rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setDiagrams(sorted);
      if (sorted.length > 0) setExpandedId(sorted[0].id);
    });
  }, [projectId]);

  async function createDiagram() {
    if (!newTitle.trim()) return;
    const rec: SipocDiagram = {
      id: newId('sip'), projectId,
      title: newTitle.trim(),
      processRef: '',
      createdAt: now(),
    };
    await db.sipocDiagrams.add(rec);
    // Seed with 3 blank rows
    const rows: SipocRow[] = Array.from({ length: 3 }, (_, i) => ({
      id: newId('srow'), projectId, diagramId: rec.id,
      supplier: '', input: '', step: '', output: '', customer: '',
      order: i,
    }));
    await db.sipocRows.bulkAdd(rows);
    setDiagrams(prev => [...prev, rec]);
    setExpandedId(rec.id);
    setNewTitle('');
    setCreating(false);
  }

  async function deleteDiagram(id: string) {
    await db.sipocDiagrams.delete(id);
    await db.sipocRows.where('diagramId').equals(id).delete();
    setDiagrams(prev => prev.filter(d => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, flex: 1 }}>
          Scope a process by defining its Suppliers, Inputs, Process steps, Outputs and Customers before mapping detail.
        </p>
        <button className="btn btn-sm btn-ghost" onClick={() => setCreating(c => !c)} style={{ marginLeft: 16 }}>
          <Plus size={13} /> New SIPOC
        </button>
      </div>

      {creating && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Process name (e.g. Cloud resource request)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') createDiagram(); if (e.key === 'Escape') setCreating(false); }}
          />
          <button className="btn btn-primary btn-sm" onClick={createDiagram} disabled={!newTitle.trim()}>Create</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      )}

      {diagrams.length === 0 && !creating && (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-title">No SIPOCs yet</div>
          <div className="empty-state-desc">Create one to scope a process before mapping its detail.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {diagrams.map(diag => {
          const isOpen = expandedId === diag.id;
          return (
            <div key={diag.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isOpen ? 'var(--bg-subtle)' : 'none' }}
                onClick={() => setExpandedId(isOpen ? null : diag.id)}
              >
                {isOpen ? <ChevronDown size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />}
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{diag.title}</span>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ padding: '2px 6px' }}
                  onClick={e => { e.stopPropagation(); deleteDiagram(diag.id); }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {isOpen && <SipocEditor diagramId={diag.id} projectId={projectId} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SipocEditor({ diagramId, projectId }: { diagramId: string; projectId: string }) {
  const [rows, setRows] = useState<SipocRow[]>([]);

  useEffect(() => {
    db.sipocRows.where('diagramId').equals(diagramId).toArray().then(r =>
      setRows(r.sort((a, b) => a.order - b.order))
    );
  }, [diagramId]);

  async function addRow() {
    const rec: SipocRow = {
      id: newId('srow'), projectId, diagramId,
      supplier: '', input: '', step: '', output: '', customer: '',
      order: rows.length,
    };
    await db.sipocRows.add(rec);
    setRows(prev => [...prev, rec]);
  }

  async function deleteRow(id: string) {
    await db.sipocRows.delete(id);
    setRows(prev => prev.filter(r => r.id !== id));
  }

  async function updateCell(id: string, field: keyof SipocRow, value: string) {
    await db.sipocRows.update(id, { [field]: value });
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  return (
    <div style={{ padding: '0 0 14px', borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, 1fr) 36px`, minWidth: 760, borderBottom: '1px solid var(--border)' }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ padding: '8px 10px', background: col.color, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{col.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 1 }}>{col.desc}</div>
          </div>
        ))}
        <div style={{ padding: '8px 4px', background: 'var(--bg-subtle)' }} />
      </div>

      {/* Rows */}
      {rows.map((row, idx) => (
        <div
          key={row.id}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, 1fr) 36px`,
            minWidth: 760,
            borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {COLUMNS.map(col => (
            <div key={col.key} style={{ padding: 4, borderRight: '1px solid var(--border)' }}>
              <textarea
                value={row[col.key] as string}
                onChange={e => updateCell(row.id, col.key, e.target.value)}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: 12, lineHeight: 1.5, resize: 'none', outline: 'none',
                  fontFamily: 'inherit', color: 'var(--text)', padding: '4px 6px',
                  minHeight: 52,
                }}
                placeholder="—"
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn btn-sm btn-ghost" style={{ padding: 4 }} onClick={() => deleteRow(row.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <div style={{ padding: '8px 10px' }}>
        <button className="btn btn-sm btn-ghost" onClick={addRow}>
          <Plus size={13} /> Add row
        </button>
      </div>
    </div>
  );
}
