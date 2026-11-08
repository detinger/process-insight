import { X } from 'lucide-react';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl/⌘ + Z', 'Undo'],
  ['Ctrl/⌘ + Shift + Z, Ctrl + Y', 'Redo'],
  ['Ctrl/⌘ + A', 'Select all'],
  ['Ctrl/⌘ + C / V', 'Copy / paste'],
  ['Delete / Backspace', 'Remove selected elements'],
  ['E', 'Edit label of the selected element'],
  ['H', 'Hand tool (pan)'],
  ['L', 'Lasso tool (select)'],
  ['S', 'Space tool (create/remove space)'],
  ['C', 'Global connect tool'],
  ['R', 'Replace selected element (change type)'],
  ['A', 'Append element to the selection'],
  ['Arrow keys', 'Move selected elements'],
  ['Ctrl/⌘ + scroll', 'Zoom'],
  ['?', 'Show this help'],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" style={{ maxWidth: 560 }} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="dialog-header">
          <span>Keyboard shortcuts</span>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="dialog-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Canvas shortcuts work when the canvas has focus (click on an empty area of the diagram first).
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {SHORTCUTS.map(([k, d]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px 8px 0', width: 220, whiteSpace: 'nowrap' }}>
                    <kbd style={{
                      display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                      fontSize: 12, fontFamily: 'var(--font-mono)',
                    }}>{k}</kbd>
                  </td>
                  <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
