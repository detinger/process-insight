import { useState } from 'react';
import { Lightbulb, ChevronRight, ChevronDown, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { loadScenarioById } from '../scenarios/loadScenarioById';
import type { Workspace } from '../../app/AppShell';

interface ConceptDef {
  title: string;
  tag: string;
  desc: string;
  detail: string;
  examples: [string, string];
  watchOut: string;
  tryIt: { label: string; scenarioId?: string; workspace: Workspace };
}

const CONCEPTS: ConceptDef[] = [
  {
    title: 'Process vs Journey',
    tag: 'Foundation',
    desc: 'A process describes how the organisation does work internally. A journey describes the experience of a person pursuing a goal.',
    detail: 'The same situation produces both: a customer submitting a support ticket is their journey step "Submit ticket". Behind it runs a process "Register service request". One is told from the outside in, the other from the inside out. Neither is more true — they are complementary lenses.',
    examples: [
      '"Employee recovers access to a locked account" — that is a journey.',
      '"Handle password reset" — that is a process (trigger: password reset requested; outcome: access restored).',
    ],
    watchOut: 'Avoid writing journey steps that describe system actions ("System sends email"). That is the process view intruding into the journey. The journey step should be "Receives confirmation email."',
    tryIt: { label: 'Open IT-02 and name both sides', scenarioId: 'IT-02', workspace: 'journey' },
  },
  {
    title: 'Process vs Department',
    tag: 'Foundation',
    desc: 'A department is an organisational unit. A process is work with a trigger, an outcome and a stakeholder.',
    detail: 'Departments are containers for people and budgets. Processes are flows of work that cross departments, serve customers, and produce outcomes. A department may own a process, but it is never the process itself. This distinction matters when scoping: "IT Support" cannot have a trigger or an outcome, but "Resolve service request" can.',
    examples: [
      '"IT Support" — a department (a structure, not a flow of work).',
      '"Resolve service request" — a process (trigger: ticket received; outcome: issue resolved; stakeholder: employee).',
    ],
    watchOut: 'When someone says "our process is IT Support" they mean their team handles that area. Push back with: what starts it? what ends it? who cares about the outcome? If they cannot answer, it is not yet a process.',
    tryIt: { label: 'Find candidates in IT-03', scenarioId: 'IT-03', workspace: 'identify' },
  },
  {
    title: 'Process vs Capability',
    tag: 'Foundation',
    desc: 'A capability is something an organisation can do. A process is an instance of executing that capability.',
    detail: 'Capabilities are strategic; processes are operational. "Identity management" is a capability — it describes an organisational strength. "Provision user access" is a process — it is the actual work that exercises that capability for a specific trigger. Capabilities survive even when processes change. Processes are redesigned; capabilities are grown or bought.',
    examples: [
      '"Identity management" — a capability (what the IT function can do).',
      '"Provision user access for a new hire" — a process (a specific execution of that capability).',
    ],
    watchOut: 'Do not list capabilities in a process landscape as if they were processes. A landscape node should always answer: "what starts this, and what does completing it produce?" A capability has no trigger and no single outcome.',
    tryIt: { label: 'Open IT-05 and map candidates', scenarioId: 'IT-05', workspace: 'identify' },
  },
  {
    title: 'Evidence vs Assumption',
    tag: 'Discovery',
    desc: 'Evidence has a source, collection date and confidence level. An assumption is a claim without supporting observation.',
    detail: 'Most process models are built on a mixture of both — and that is fine. The problem is when assumptions are presented as evidence. Every claim in your model should be explicitly typed. "The form takes 20 minutes" is an assumption until someone observed it and recorded when and how. "The form takes 20 minutes (IT workshop, Oct 2024, n=6)" is low-confidence evidence.',
    examples: [
      '"It probably takes a while" — an assumption (no source, no date, no population).',
      '"Average form completion: 22 min (observed, service desk walk-through, 2024-10, n=4)" — evidence with confidence: medium.',
    ],
    watchOut: 'Silently upgrading an assumption to evidence by repeating it in multiple documents. The source is still one person\'s opinion. If two people independently observed the same thing, that raises confidence — but only if collected independently.',
    tryIt: { label: 'Open IT-03, go to Interview synthesis — mark each quote as evidence or assumption', scenarioId: 'IT-03', workspace: 'discover' },
  },
  {
    title: 'Observation vs Target',
    tag: 'Metrics',
    desc: 'An observation is a measured value at a point in time. A target is an aspiration. Never mix them in the same record.',
    detail: 'The most common reporting mistake: quoting an SLA as if it were a measurement. "Our resolution time is 4 hours" can mean either "we measured 4h average" or "our SLA says ≤4h". These are very different claims. Observations require a period, a source and a population. Targets require a direction and a basis. Mixing them makes it impossible to tell whether performance is improving.',
    examples: [
      '"Average resolution time: 4h 12min (Q3 2024, all P2 incidents, n=847)" — an observation.',
      '"Resolution time SLA: ≤4h" — a target (an aspiration set contractually, not measured).',
    ],
    watchOut: 'Percentage improvement claims require two observations with identical populations and time windows. "We improved by 20%" is meaningless if the first measurement was an estimate and the second was measured.',
    tryIt: { label: 'Open IT-06 and find the SLA claim', scenarioId: 'IT-06', workspace: 'journey' },
  },
  {
    title: 'BPMN Draft vs Finished Model',
    tag: 'Export',
    desc: 'A BPMN draft export is a sequential starting point. Decisions, loops, parallel work and timers require BPMN Studio.',
    detail: 'The export produces one task per journey step, in sequence, inside a pool. That is enough to open in Camunda or Signavio and start modelling. It is not a finished model. Approval/rejection gateways, escalation loops, parallel provisioning, and timer events must be added manually in the BPMN editor. The handoff notes in the export explain what the sequential model cannot represent.',
    examples: [
      'Exporting 10 journey steps → 10 sequential BPMN tasks, no gateways, no loops.',
      'The approval step in IT-05 needs a gateway (approved / rejected) — that must be added in BPMN Studio after export.',
    ],
    watchOut: 'Teams that treat the BPMN draft as authoritative skip the modelling step. The export is a starting point, not an end state. Always review handoff notes before handing off to a process engineer.',
    tryIt: { label: 'Export IT-08 and inspect handoff notes', scenarioId: 'IT-08', workspace: 'map' },
  },
];

export function ConceptsTab({ onOpenProject, onNavigate }: { onOpenProject?: (id: string) => void; onNavigate?: (w: Workspace) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  async function openScenario(scenarioId: string, _workspace: Workspace) {
    if (!onOpenProject) { onNavigate?.('home'); return; }
    const projectId = await loadScenarioById(scenarioId);
    if (projectId) {
      onOpenProject(projectId);
    } else {
      onNavigate?.('home');
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Core distinctions every BPM practitioner must internalise. Click any concept to see examples, common traps and a practice action.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 40 }}>
        {CONCEPTS.map((c, idx) => {
          const isOpen = expandedIdx === idx;
          return (
            <div key={c.title} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '11px 14px', background: isOpen ? 'var(--bg-subtle)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Lightbulb size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', flexShrink: 0,
                }}>{c.tag}</span>
                {isOpen
                  ? <ChevronDown size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, lineHeight: 1.65, margin: '14px 0 12px', color: 'var(--text)' }}>{c.desc}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.65, margin: '0 0 14px', color: 'var(--text-muted)' }}>{c.detail}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {c.examples.map((ex, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-subtle)', borderRadius: 6, padding: '8px 10px',
                        fontSize: 12, color: 'var(--text)', lineHeight: 1.5,
                        borderLeft: `3px solid ${i === 0 ? 'var(--error)' : 'var(--success)'}`,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--error)' : 'var(--success)', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                          {i === 0 ? 'Example A' : 'Example B'}
                        </span>
                        {ex}
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', borderRadius: 6, padding: '8px 10px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text)' }}><strong>Watch out: </strong>{c.watchOut}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ArrowRight size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Practice: {c.tryIt.label}</span>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 12 }}
                      onClick={() => c.tryIt.scenarioId
                        ? openScenario(c.tryIt.scenarioId, c.tryIt.workspace)
                        : onNavigate?.(c.tryIt.workspace)
                      }
                    >
                      <ExternalLink size={12} />
                      {c.tryIt.scenarioId ? `Open ${c.tryIt.scenarioId}` : `Go to ${c.tryIt.workspace}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
