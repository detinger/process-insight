// Coverage matrix: processes vs services and vs capabilities (AT-10).
// Shows ownership coverage, service coverage and capability coverage.
// Filtering declares scope (all vs filtered) to avoid denominator confusion.

import { useState } from 'react';
import type { ProcessDefinition, Service, Capability } from '../../domain/contracts/types';

interface Props {
  processes: ProcessDefinition[];
  services: Service[];
  capabilities: Capability[];
}

type View = 'services' | 'capabilities' | 'ownership';
type Scope = 'all' | 'active';

function pct(num: number, den: number): string {
  if (den === 0) return 'N/A';
  return `${Math.round((num / den) * 100)}%`;
}

export function CoverageMatrix({ processes, services, capabilities }: Props) {
  const [view, setView] = useState<View>('services');
  const [scope, setScope] = useState<Scope>('all');

  const filtered = scope === 'active'
    ? processes.filter(p => p.status !== 'retired')
    : processes;

  const ownedCount = filtered.filter(p => p.ownerRoleId).length;
  const ownedPct = pct(ownedCount, filtered.length);

  return (
    <div style={{ padding: 20, overflowY: 'auto' }}>
      <div className="eyebrow">Coverage analysis</div>
      <h2 className="page-title" style={{ marginBottom: 8 }}>Coverage matrix</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Shows which processes link to each service, capability or owner.
        Coverage denominator is{' '}
        <strong>{scope === 'all' ? 'all processes' : 'non-retired processes'}</strong>
        {' '}({filtered.length}).
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs" style={{ borderBottom: 'none' }}>
          {(['services', 'capabilities', 'ownership'] as View[]).map(v => (
            <button key={v} className={`tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Scope:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} />
            All
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="radio" name="scope" checked={scope === 'active'} onChange={() => setScope('active')} />
            Active only
          </label>
        </div>
      </div>

      {view === 'ownership' && (
        <OwnershipView processes={filtered} ownedCount={ownedCount} ownedPct={ownedPct} />
      )}
      {view === 'services' && (
        <CrossMatrix
          processes={filtered}
          columns={services.map(s => ({ id: s.id, label: s.name }))}
          getLinked={p => p.serviceIds}
          emptyMsg="No services defined. Add services in the Dictionary panel."
          columnLabel="Service"
        />
      )}
      {view === 'capabilities' && (
        <CrossMatrix
          processes={filtered}
          columns={capabilities.map(c => ({ id: c.id, label: c.name }))}
          getLinked={p => p.capabilityIds}
          emptyMsg="No capabilities defined. Add capabilities in the Dictionary panel."
          columnLabel="Capability"
        />
      )}
    </div>
  );
}

function OwnershipView({
  processes, ownedCount, ownedPct,
}: {
  processes: ProcessDefinition[];
  ownedCount: number;
  ownedPct: string;
}) {
  return (
    <div>
      <div className="grid grid-kpi" style={{ marginBottom: 24 }}>
        <KpiTile label="Processes" value={processes.length.toString()} />
        <KpiTile label="With owner" value={ownedCount.toString()} />
        <KpiTile label="Ownership coverage" value={ownedPct} highlight={ownedPct !== 'N/A' && parseInt(ownedPct) >= 75} />
        <KpiTile label="Missing owner" value={(processes.length - ownedCount).toString()} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Process</th>
              <th>Level</th>
              <th>Status</th>
              <th>Owner role</th>
            </tr>
          </thead>
          <tbody>
            {processes.map(p => (
              <tr key={p.id} style={{ opacity: p.ownerRoleId ? 1 : 0.65 }}>
                <td style={{ fontWeight: p.ownerRoleId ? undefined : 500 }}>{p.title}</td>
                <td><span className="badge">{p.levelLabel}</span></td>
                <td><span className="badge">{p.status}</span></td>
                <td>
                  {p.ownerRoleId
                    ? <span className="badge badge-success">Assigned</span>
                    : <span className="badge" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>Gap</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CrossMatrix({
  processes, columns, getLinked, emptyMsg, columnLabel,
}: {
  processes: ProcessDefinition[];
  columns: { id: string; label: string }[];
  getLinked: (p: ProcessDefinition) => string[];
  emptyMsg: string;
  columnLabel: string;
}) {
  if (columns.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">{emptyMsg}</div>
      </div>
    );
  }

  // Coverage per column
  const covered = columns.map(col =>
    processes.filter(p => getLinked(p).includes(col.id)).length
  );

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Process</th>
              {columns.map((col, i) => (
                <th key={col.id} title={col.label} style={{ textAlign: 'center', minWidth: 90, maxWidth: 130, verticalAlign: 'bottom' }}>
                  <div style={{ fontSize: 12, padding: '4px 0', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25 }}>
                    {col.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 4 }}>
                    {pct(covered[i], processes.length)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processes.map(p => {
              const linked = getLinked(p);
              return (
                <tr key={p.id}>
                  <td style={{ fontSize: 13 }}>{p.title}</td>
                  {columns.map(col => (
                    <td key={col.id} style={{ textAlign: 'center' }}>
                      {linked.includes(col.id)
                        ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                        : <span style={{ color: 'var(--border-strong)' }}>·</span>
                      }
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontSize: 12, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                {columnLabel} coverage (scope: {processes.length} processes)
              </td>
              {columns.map((col, i) => (
                <td key={col.id} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                  {pct(covered[i], processes.length)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function KpiTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card" style={{
      textAlign: 'center',
      background: highlight ? 'var(--success-soft)' : 'var(--bg-elevated)',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: highlight ? 'var(--success)' : 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
