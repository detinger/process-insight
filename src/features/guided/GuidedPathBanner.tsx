import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, X, CheckCircle } from 'lucide-react';
import type { Workspace } from '../../app/AppShell';

// ─── Step definitions ─────────────────────────────────────────

export interface GuidedStep {
  id: number;
  workspace: Workspace;
  label: string;
  verb: string;
  hint: string;
  /** Detailed, tool-by-tool guidance for this workspace (shown under "Show tips"). */
  tips: { label: string; hint: string }[];
}

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 1,
    workspace: 'discover',
    label: 'Discovery',
    verb: 'Gather your evidence',
    hint: 'Log interviews, observations and contradictions. Mark each claim as evidence or assumption. This raw material justifies every decision you make in the next steps.',
    tips: [
      { label: 'Interview synthesis', hint: 'Record each interviewee and add their direct quotes, claims and open questions. If this is a scenario, read the pre-loaded interviews to understand the key themes.' },
      { label: 'Observation timeline', hint: 'Log what you saw happen in sequence: work steps, delays, exceptions and interactions. Delays and exceptions are the most valuable findings.' },
      { label: 'Event storming', hint: 'Map the domain events (things that happened), the commands that triggered them, the actors who gave the commands, and the policies that govern the flow.' },
      { label: 'Contradiction log', hint: 'When two sources disagree on the same fact, record both sides here — without picking a winner yet. Contradictions often point to the root of a problem.' },
    ],
  },
  {
    id: 2,
    workspace: 'identify',
    label: 'Process Landscape',
    verb: 'Build the big picture',
    hint: 'Use what you found in Discovery to propose and accept process candidates. Build the landscape — management on top, core in the middle, support at the bottom.',
    tips: [
      { label: 'Identify: add process candidates', hint: 'Use the sidebar → "Add". Write down every process you think might be relevant, even if you\'re unsure. You can filter them later.' },
      { label: 'Identify: review and accept', hint: 'Work through each candidate: check the boundary checklist, change status to "Accepted" for the ones worth modeling, then complete the charter (purpose, trigger, outcome, scope).' },
      { label: 'Landscape: build the big picture', hint: 'Assign each accepted process a role — management, core, or support — and arrange them into one overview.' },
      { label: 'Coverage and Scoring: check and prioritise', hint: 'Find gaps (no owner, no service) and decide which processes to analyse first. Each tab explains what it is for.' },
    ],
  },
  {
    id: 3,
    workspace: 'journey',
    label: 'Customer Journey',
    verb: 'Map the experience',
    hint: 'Create journey stages and steps from the customer\'s or employee\'s perspective. Add sentiment, touchpoints and pain points. Link steps back to the processes you identified.',
    tips: [
      { label: 'Stages and steps', hint: 'Split the journey into stages, then add the steps a person goes through in each stage.' },
      { label: 'Rows', hint: 'Add rows for actions, sentiment, touchpoints, pain points and systems. Use the Dictionary button to manage personas, channels and touchpoints.' },
      { label: 'Link to processes', hint: 'Connect steps back to the processes you identified so the journey and the landscape stay traceable.' },
    ],
  },
  {
    id: 4,
    workspace: 'map',
    label: 'Process Map',
    verb: 'Build the blueprint',
    hint: 'Translate the journey into an operational process blueprint. Define actors in swimlanes, handoffs between teams, decision points and supporting systems.',
    tips: [
      { label: 'Start with SIPOC', hint: 'Open the SIPOC tab and scope the process: who supplies inputs, what the inputs are, the main process steps, outputs, and who receives them. This takes 10 minutes and forces clear thinking before you draw anything.' },
      { label: 'Build a swimlane Process Map', hint: 'Open Process Map and add lanes — one per role or team. Add activities to each lane and connect them with edges. If this is a scenario, the map is pre-built — explore the lanes and read the activity notes.' },
      { label: 'Export BPMN when ready', hint: 'The BPMN Export tab converts your journey steps into a standards-compliant BPMN 2.0 file for use in a modeling tool. Run it after the journey is fully mapped.' },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────

interface Props {
  currentStep: number;
  completedSteps: Set<number>;
  onGoToStep: (step: GuidedStep) => void;
  onComplete: (stepId: number) => void;
  onExit: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function GuidedPathBanner({ currentStep, completedSteps, onGoToStep, onComplete, onExit }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showTips, setShowTips] = useState(false);

  const step = GUIDED_STEPS.find(s => s.id === currentStep) ?? GUIDED_STEPS[0];
  const nextStep = GUIDED_STEPS.find(s => s.id === currentStep + 1);
  const allDone = currentStep > GUIDED_STEPS.length;

  if (!expanded) {
    return (
      <div style={{
        background: 'var(--primary)',
        color: '#fff',
        padding: '5px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 12, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 600 }}>Guided Path</span>
        <span style={{ opacity: 0.7 }}>·</span>
        <span>Step {Math.min(currentStep, 4)} / 4 — {allDone ? 'Complete!' : step.label}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setExpanded(true)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, color: '#fff', padding: '2px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ChevronDown size={12} /> Show
        </button>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 2 }} title="Exit guided mode">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #312e81 100%)',
      color: '#fff',
      flexShrink: 0,
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Header row */}
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
          Guided Learning Path
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setExpanded(false)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', padding: '2px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ChevronUp size={12} /> Hide
        </button>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px 4px', fontSize: 11 }} title="Exit guided mode">
          <X size={13} /> Exit
        </button>
      </div>

      {/* Stepper */}
      <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 0 }}>
        {GUIDED_STEPS.map((s, i) => {
          const done = completedSteps.has(s.id);
          const active = s.id === currentStep;
          const future = s.id > currentStep && !done;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => onGoToStep(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: active ? '1.5px solid rgba(255,255,255,0.9)' : '1.5px solid transparent',
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: future ? 'rgba(255,255,255,0.4)' : '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  transition: 'all 120ms',
                }}
                title={s.hint}
              >
                {done ? (
                  <CheckCircle size={13} style={{ color: '#4ade80' }} />
                ) : (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: active ? '#fff' : 'rgba(255,255,255,0.2)',
                    color: active ? '#1e3a5f' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>{s.id}</span>
                )}
                <span style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
              </button>
              {i < GUIDED_STEPS.length - 1 && (
                <ArrowRight size={12} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 2px', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step hint + actions */}
      <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {allDone ? (
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#4ade80' }}>
              🎉 You've completed the full learning path!
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
              You built a process landscape, ran discovery, mapped the customer journey, and created a process blueprint. Well done.
            </p>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                Step {step.id}: {step.verb}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, maxWidth: '70ch' }}>
                {step.hint}
              </p>
              {step.tips.length > 0 && (
                <>
                  <button
                    onClick={() => setShowTips(v => !v)}
                    style={{ marginTop: 6, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {showTips ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showTips ? 'Hide tips' : 'Show tips for this step'}
                  </button>
                  {showTips && (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', maxWidth: '80ch', maxHeight: '30vh', overflowY: 'auto' }}>
                      {step.tips.map(t => (
                        <li key={t.label} style={{ marginBottom: 4 }}><strong>{t.label}.</strong> {t.hint}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              {!completedSteps.has(step.id) && (
                <button
                  onClick={() => onComplete(step.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12,
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  ✓ Mark done
                </button>
              )}
              {nextStep && (
                <button
                  onClick={() => onGoToStep(nextStep)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: '#fff', border: 'none',
                    color: '#1e3a5f', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Next: {nextStep.label} <ArrowRight size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
