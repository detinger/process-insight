import { ChevronRight } from 'lucide-react';
import type { Workspace } from '../app/AppShell';

const STEPS: { id: Workspace; label: string; short: string }[] = [
  { id: 'discover', label: 'Discover',  short: '1' },
  { id: 'identify', label: 'Identify',  short: '2' },
  { id: 'journey',  label: 'Journey',   short: '3' },
  { id: 'map',      label: 'Map',       short: '4' },
];

interface Props {
  current: Workspace;
  onNavigate: (ws: Workspace) => void;
}

/** Persistent step navigation (Discover → Identify → Journey → Map); rendered once by AppShell. */
export function WorkspacePath({ current, onNavigate }: Props) {
  const idx = STEPS.findIndex(s => s.id === current);
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 20px', flexShrink: 0,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
    }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {STEPS.map((step, i) => {
          const isActive = step.id === current;
          const isDone = idx >= 0 && i < idx;
          return (
            <span key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => onNavigate(step.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 400,
                  background: isActive ? 'var(--primary)' : isDone ? 'var(--primary-tint)' : 'transparent',
                  color: isActive ? '#fff' : isDone ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700,
                  background: isActive ? 'rgba(255,255,255,0.25)' : isDone ? 'var(--primary)' : 'var(--border)',
                  color: isActive ? '#fff' : isDone ? '#fff' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {step.short}
                </span>
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={12} style={{ color: 'var(--border)', flexShrink: 0 }} />
              )}
            </span>
          );
        })}
      </div>

      {/* Next button */}
      {next && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onNavigate(next.id)}
          style={{ gap: 6 }}
        >
          Next: {next.label}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
