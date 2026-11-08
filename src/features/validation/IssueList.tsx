import { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Crosshair, Info } from 'lucide-react';
import { SEVERITY_LABEL, LAYER_LABEL, type Severity, type ValidationIssue, type ValidationReport } from '../../domain/validation/types';

function SeverityIcon({ severity, size = 14 }: { severity: Severity; size?: number }) {
  if (severity === 'error') return <AlertCircle size={size} style={{ color: 'var(--error)', flexShrink: 0 }} />;
  if (severity === 'warning') return <AlertTriangle size={size} style={{ color: 'var(--warning)', flexShrink: 0 }} />;
  return <Info size={size} style={{ color: 'var(--info)', flexShrink: 0 }} />;
}

export function IssueList({
  report,
  onFocus,
}: {
  report: ValidationReport | null;
  onFocus?: (issue: ValidationIssue) => void;
}) {
  if (!report) {
    return (
      <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
        Validating…
      </div>
    );
  }

  const { issues, counts } = report;

  if (issues.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>No issues found</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>The diagram passed all checks.</div>
      </div>
    );
  }

  const groups = (['structure', 'semantics', 'control-flow', 'modeling'] as const)
    .map(layer => ({ layer, label: LAYER_LABEL[layer], items: issues.filter(i => i.layer === layer) }))
    .filter(g => g.items.length > 0);

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {(['error', 'warning', 'info'] as Severity[]).map(s => counts[s] > 0 && (
          <span key={s} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
            background: s === 'error' ? 'color-mix(in srgb, var(--error) 12%, transparent)'
              : s === 'warning' ? 'color-mix(in srgb, var(--warning) 12%, transparent)'
              : 'color-mix(in srgb, var(--info) 12%, transparent)',
            color: s === 'error' ? 'var(--error)' : s === 'warning' ? 'var(--warning)' : 'var(--info)',
          }}>
            <SeverityIcon severity={s} size={12} />
            {counts[s]} {SEVERITY_LABEL[s]}{counts[s] !== 1 ? 's' : ''}
          </span>
        ))}
      </div>

      {/* Issues by layer */}
      {groups.map(g => (
        <div key={g.layer}>
          <div style={{
            padding: '6px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--text-subtle)',
            background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)',
          }}>
            {g.label}
          </div>
          {g.items.map(i => <IssueItem key={i.id} issue={i} onFocus={onFocus} />)}
        </div>
      ))}
    </div>
  );
}

export function IssueItem({ issue, onFocus }: { issue: ValidationIssue; onFocus?: (issue: ValidationIssue) => void }) {
  const [open, setOpen] = useState(issue.severity === 'error');

  return (
    <article style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontSize: 13,
        }}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />}
        <SeverityIcon severity={issue.severity} />
        <span style={{ flex: 1, fontWeight: 500 }}>{issue.title}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 12px 36px', fontSize: 12, color: 'var(--text-muted)' }}>
          <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{issue.explanation}</p>
          <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Fix: </strong>{issue.suggestion}
          </p>
          {onFocus && issue.elementIds.length > 0 && (
            <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={() => onFocus(issue)}>
              <Crosshair size={13} /> Show in diagram
            </button>
          )}
        </div>
      )}
    </article>
  );
}
