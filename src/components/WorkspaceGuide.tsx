import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface Step {
  label: string;
  hint: string;
}

interface Props {
  storageKey: string;
  title: string;
  description: string;
  steps: Step[];
}

export function WorkspaceGuide({ storageKey, title, description, steps }: Props) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'closed'; } catch { return true; }
  });

  function toggle() {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(storageKey, next ? 'open' : 'closed'); } catch { /* ignore */ }
  }

  return (
    <div style={{
      border: '1px solid var(--primary-tint)',
      borderRadius: 10,
      background: 'var(--primary-soft)',
      marginBottom: 28,
      overflow: 'hidden',
    }}>
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <BookOpen size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>{title}</span>
        {open
          ? <ChevronUp size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
            {description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.5 }}>{step.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
