import { useState } from 'react';
import { X, FileJson, FileText } from 'lucide-react';
import { exportProject } from '../../storage/projectIO';
import { SECTIONS } from './reportData';
import type { SectionId } from './reportData';

type Kind = 'html' | 'json';

export function ExportDialog({ projectId, projectTitle, onClose }: {
  projectId: string; projectTitle?: string; onClose: () => void;
}) {
  const [kind, setKind] = useState<Kind>('html');
  const [selected, setSelected] = useState<Set<SectionId>>(new Set(SECTIONS.map(s => s.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: SectionId) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function run() {
    setBusy(true); setError(null);
    try {
      if (kind === 'json') {
        await exportProject(projectId);
      } else {
        const { exportDocumentationHtml } = await import('./exportHtml');
        await exportDocumentationHtml(projectId, SECTIONS.map(s => s.id).filter(id => selected.has(id)));
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const card = (k: Kind, icon: React.ReactNode, title: string, desc: string) => (
    <button
      type="button" onClick={() => !busy && setKind(k)}
      style={{
        flex: 1, textAlign: 'left', padding: 14, borderRadius: 8, cursor: 'pointer',
        border: `2px solid ${kind === k ? 'var(--primary)' : 'var(--border)'}`,
        background: kind === k ? 'var(--primary-soft)' : 'var(--bg)', color: 'var(--text)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 650 }}>{icon}{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{desc}</div>
    </button>
  );

  return (
    <div className="dialog-backdrop" onClick={() => !busy && onClose()}>
      <div className="dialog" style={{ width: 'min(620px, 100%)' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Export project">
        <div className="dialog-header">
          <span>Export{projectTitle ? ` “${projectTitle}”` : ''}</span>
          <button className="btn btn-icon" onClick={onClose} disabled={busy} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {card('html', <FileText size={16} />, 'Documentation (HTML)', 'One standalone page with the landscape, journey canvases, SIPOC and process maps. Open it in any browser, or print it to PDF.')}
            {card('json', <FileJson size={16} />, 'Project file (JSON)', 'The complete project data. Re-import it later or share it with others.')}
          </div>

          {kind === 'html' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <span className="field-label" style={{ flex: 1 }}>Sections to include</span>
                <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setSelected(new Set(SECTIONS.map(s => s.id)))}>All</button>
                <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setSelected(new Set())}>None</button>
              </div>
              {SECTIONS.map(s => (
                <label key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.has(s.id)} disabled={busy} onChange={() => toggle(s.id)} style={{ marginTop: 3 }} />
                  <span>
                    <span style={{ fontSize: 13, fontWeight: 550 }}>{s.label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{s.hint}</span>
                  </span>
                </label>
              ))}
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>
                Sections with no content in this project are skipped automatically.
              </div>
            </div>
          )}

          {error && <div className="callout callout-error" role="alert">Export failed: {error}</div>}
        </div>
        <div className="dialog-footer">
          <button className="btn btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={run} disabled={busy || (kind === 'html' && selected.size === 0)}>
            {busy ? 'Exporting…' : kind === 'html' ? 'Export HTML' : 'Export JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}
