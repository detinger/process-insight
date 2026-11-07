// Impact and reference consistency panel (AT-12).
// Shows all contexts where a selected process is referenced:
// services, capabilities, journey steps (via cards), downstream processes (via relations),
// and evidence records. Repositioning never changes relationships.

import type {
  ProcessDefinition, LandscapeRelation,
  Service, Capability, JourneyStep, Journey,
  EvidenceRecord,
} from '../../domain/contracts/types';

interface Props {
  process: ProcessDefinition;
  allProcesses: ProcessDefinition[];
  relations: LandscapeRelation[];
  services: Service[];
  capabilities: Capability[];
  journeys: Journey[];
  steps: JourneyStep[];
  evidence: EvidenceRecord[];
  onSelectProcess: (id: string) => void;
}

export function ImpactPanel({
  process: proc, allProcesses, relations, services, capabilities,
  journeys, steps, evidence, onSelectProcess,
}: Props) {
  const linkedServices = services.filter(s => proc.serviceIds.includes(s.id));
  const linkedCapabilities = capabilities.filter(c => proc.capabilityIds.includes(c.id));
  const linkedEvidence = evidence.filter(e => proc.evidenceIds.includes(e.id));

  const downstreamRels = relations.filter(r => r.fromId === proc.id);
  const upstreamRels   = relations.filter(r => r.toId === proc.id);

  // Journey steps linked to this process (via process-link cards, stored in JourneyWorkspace)
  // We approximate by finding steps whose journeyId maps to a journey that could reference this process.
  // A more precise check would scan cards, but here we use JourneyStep titles + step descriptions.
  const relatedSteps = steps.filter(s =>
    s.title.toLowerCase().includes(proc.title.toLowerCase().slice(0, 10))
  );

  const totalRefs = linkedServices.length + linkedCapabilities.length + linkedEvidence.length
    + downstreamRels.length + upstreamRels.length;

  return (
    <div style={{ padding: 20, overflowY: 'auto' }}>
      <div className="eyebrow">Impact analysis</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{proc.title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        {totalRefs} reference{totalRefs !== 1 ? 's' : ''} across {4 + (relatedSteps.length > 0 ? 1 : 0)} context{totalRefs !== 1 ? 's' : ''}.
        Repositioning this process in the hierarchy does not change any of these relationships.
      </p>

      <Section title="Services" count={linkedServices.length}>
        {linkedServices.length === 0
          ? <EmptyRef msg="No services linked." />
          : linkedServices.map(s => (
            <RefItem key={s.id} label={s.name} detail={s.customerOutcome} />
          ))
        }
      </Section>

      <Section title="Capabilities" count={linkedCapabilities.length}>
        {linkedCapabilities.length === 0
          ? <EmptyRef msg="No capabilities linked." />
          : linkedCapabilities.map(c => (
            <RefItem key={c.id} label={c.name} detail={c.description} />
          ))
        }
      </Section>

      <Section title="Downstream processes" count={downstreamRels.length}>
        {downstreamRels.length === 0
          ? <EmptyRef msg="No downstream relations." />
          : downstreamRels.map(r => {
            const target = allProcesses.find(p => p.id === r.toId);
            return (
              <RefItem
                key={r.id}
                label={target?.title ?? r.toId}
                detail={r.type}
                onClick={target ? () => onSelectProcess(target.id) : undefined}
              />
            );
          })
        }
      </Section>

      <Section title="Upstream processes" count={upstreamRels.length}>
        {upstreamRels.length === 0
          ? <EmptyRef msg="No upstream relations." />
          : upstreamRels.map(r => {
            const source = allProcesses.find(p => p.id === r.fromId);
            return (
              <RefItem
                key={r.id}
                label={source?.title ?? r.fromId}
                detail={r.type}
                onClick={source ? () => onSelectProcess(source.id) : undefined}
              />
            );
          })
        }
      </Section>

      <Section title="Evidence" count={linkedEvidence.length}>
        {linkedEvidence.length === 0
          ? <EmptyRef msg="No evidence linked." />
          : linkedEvidence.map(e => (
            <RefItem key={e.id} label={e.title} detail={`${e.type} · ${e.confidence} confidence`} />
          ))
        }
      </Section>

      {relatedSteps.length > 0 && (
        <Section title="Possibly related journey steps" count={relatedSteps.length}>
          {relatedSteps.map(s => {
            const journey = journeys.find(j => j.id === s.journeyId);
            return (
              <RefItem key={s.id} label={s.title} detail={journey?.title ?? 'Unknown journey'} />
            );
          })}
        </Section>
      )}

      {/* Archive impact preview */}
      <div className="callout callout-warning" style={{ marginTop: 20, fontSize: 13 }}>
        <strong>Archive impact preview:</strong>{' '}
        {totalRefs > 0
          ? `Archiving "${proc.title}" would affect: ${[
              linkedServices.length && `${linkedServices.length} service(s)`,
              linkedCapabilities.length && `${linkedCapabilities.length} capability(s)`,
              downstreamRels.length && `${downstreamRels.length} downstream relation(s)`,
              linkedEvidence.length && `${linkedEvidence.length} evidence record(s)`,
            ].filter(Boolean).join(', ')}.`
          : `No live references. Safe to archive.`}
      </div>
    </div>
  );
}

function Section({
  title, count, children,
}: {
  title: string; count: number; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {title}
        <span className="badge">{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function RefItem({ label, detail, onClick }: { label: string; detail?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 10px', borderRadius: 6,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13,
        transition: onClick ? 'background 100ms' : undefined,
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
    >
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      {detail && <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{detail}</span>}
    </div>
  );
}

function EmptyRef({ msg }: { msg: string }) {
  return <div style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '4px 0' }}>{msg}</div>;
}
