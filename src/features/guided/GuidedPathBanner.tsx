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
}

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 1,
    workspace: 'discover',
    label: 'Discovery',
    verb: 'Gather your evidence',
    hint: 'Log interviews, observations and contradictions. Mark each claim as evidence or assumption. This raw material justifies every decision you make in the next steps.',
  },
  {
    id: 2,
    workspace: 'identify',
    label: 'Process Landscape',
    verb: 'Build the big picture',
    hint: 'Use what you found in Discovery to propose and accept process candidates. Build the landscape — management on top, core in the middle, support at the bottom.',
  },
  {
    id: 3,
    workspace: 'journey',
    label: 'Customer Journey',
    verb: 'Map the experience',
    hint: 'Create journey stages and steps from the customer\'s or employee\'s perspective. Add sentiment, touchpoints and pain points. Link steps back to the processes you identified.',
  },
  {
    id: 4,
    workspace: 'map',
    label: 'Process Map',
    verb: 'Build the blueprint',
    hint: 'Translate the journey into an operational process blueprint. Define actors in swimlanes, handoffs between teams, decision points and supporting systems.',
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
