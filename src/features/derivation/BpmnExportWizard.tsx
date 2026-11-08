import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Download, AlertCircle, CheckCircle, Info, X, Plus, Trash2, History, Pencil, RotateCcw } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import {
  generateBpmnXml, buildTraceManifest, detectNonLinearPatterns,
  type BpmnActivity, type BpmnLane, type BpmnGeneratorInput, type NonLinearWarning,
} from './bpmnGenerator';
import { BpmnViewer } from './BpmnViewer';
import { BpmnModeler } from '../modeler/BpmnModeler';
import '../modeler/modeler.css';
import { validateBpmnXml } from '../../domain/validation/validate';
import { IssueList } from '../validation/IssueList';
import type { ValidationReport } from '../../domain/validation/types';
import type { Journey, JourneyStage, JourneyStep, ProcessDefinition, BpmnExport } from '../../domain/contracts/types';

interface Props {
  projectId: string;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface StepMapping {
  stepId: string;
  activityName: string;
  laneId: string;
  disposition: 'mapped' | 'annotation' | 'excluded';
  exclusionRationale: string;
}

interface WizardState {
  journeyId: string;
  selectedStepIds: string[];
  targetProcessId: string;
  targetProcessName: string;
  participantName: string;
  lanes: BpmnLane[];
  mappings: StepMapping[];
  unresolved: string[];
  generatedXml: string;
  editedXml: string;
  warnings: string[];
  nonLinearWarnings: NonLinearWarning[];
}

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Select scope',
  2: 'Map activities',
  3: 'Participant & lanes',
  4: 'Review coverage',
  5: 'Preview',
  6: 'Export',
};

export function BpmnExportWizard({ projectId, onClose }: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [state, setState] = useState<WizardState>({
    journeyId: '',
    selectedStepIds: [],
    targetProcessId: '',
    targetProcessName: '',
    participantName: '',
    lanes: [{ id: 'lane_default', name: 'Provider' }],
    mappings: [],
    unresolved: [],
    generatedXml: '',
    editedXml: '',
    warnings: [],
    nonLinearWarnings: [],
  });
  const [showModeler, setShowModeler] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [priorExports, setPriorExports] = useState<BpmnExport[]>([]);

  useEffect(() => {
    db.journeys.where('projectId').equals(projectId).toArray().then(setJourneys);
    db.processes.where('projectId').equals(projectId).toArray().then(setProcesses);
  }, [projectId]);

  useEffect(() => {
    if (!state.journeyId) return;
    Promise.all([
      db.stages.where('journeyId').equals(state.journeyId).and(stage => stage.projectId === projectId).toArray(),
      db.steps.where('journeyId').equals(state.journeyId).and(step => step.projectId === projectId).toArray(),
      db.bpmnExports.where('journeyId').equals(state.journeyId).and(exp => exp.projectId === projectId).toArray(),
    ]).then(([stgs, stps, exps]) => {
      stgs.sort((a, b) => a.order - b.order);
      stps.sort((a, b) => a.order - b.order);
      setStages(stgs);
      setSteps(stps);
      setPriorExports(exps.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt)));
    });
  }, [projectId, state.journeyId]);

  function update(patch: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function toggleStep(stepId: string) {
    const sel = state.selectedStepIds.includes(stepId)
      ? state.selectedStepIds.filter(id => id !== stepId)
      : [...state.selectedStepIds, stepId];
    update({ selectedStepIds: sel });
  }

  function initMappings() {
    const existing = new Map(state.mappings.map(m => [m.stepId, m]));
    const defaultLaneId = state.lanes[0]?.id ?? 'lane_default';
    const mappings: StepMapping[] = state.selectedStepIds.map(sid => {
      const stepObj = steps.find(s => s.id === sid);
      return existing.get(sid) ?? {
        stepId: sid,
        activityName: stepObj?.title ?? '',
        laneId: defaultLaneId,
        disposition: 'mapped',
        exclusionRationale: '',
      };
    });
    update({ mappings });
  }

  function updateMapping(stepId: string, patch: Partial<StepMapping>) {
    update({
      mappings: state.mappings.map(m => m.stepId === stepId ? { ...m, ...patch } : m),
    });
  }

  function addLane() {
    const lane: BpmnLane = { id: newId('lane'), name: 'New lane' };
    update({ lanes: [...state.lanes, lane] });
  }

  function updateLane(id: string, name: string) {
    update({ lanes: state.lanes.map(l => l.id === id ? { ...l, name } : l) });
  }

  function removeLane(id: string) {
    if (state.lanes.length <= 1) return;
    const defaultLane = state.lanes.find(l => l.id !== id)!;
    update({
      lanes: state.lanes.filter(l => l.id !== id),
      mappings: state.mappings.map(m => m.laneId === id ? { ...m, laneId: defaultLane.id } : m),
    });
  }

  function addUnresolved() {
    update({ unresolved: [...state.unresolved, ''] });
  }

  function updateUnresolved(i: number, val: string) {
    const u = [...state.unresolved];
    u[i] = val;
    update({ unresolved: u });
  }

  function removeUnresolved(i: number) {
    update({ unresolved: state.unresolved.filter((_, idx) => idx !== i) });
  }

  function generate() {
    const activities: BpmnActivity[] = state.mappings
      .filter(m => m.disposition !== 'excluded' && m.activityName.trim())
      .map(m => ({
        id: `Task_${newId('t')}`,
        name: m.activityName.trim(),
        laneId: m.laneId,
        sourceStepIds: [m.stepId],
        disposition: m.disposition as 'mapped' | 'annotation',
      }));

    if (activities.length === 0) {
      update({ warnings: ['No mapped activities — add at least one activity name.'] });
      return;
    }

    // Detect non-linear patterns in selected step titles (AT-17, AT-18)
    const selectedStepTitles = state.selectedStepIds
      .map(sid => steps.find(s => s.id === sid)?.title ?? '')
      .filter(Boolean);
    const nonLinearWarnings = detectNonLinearPatterns(selectedStepTitles);

    const input: BpmnGeneratorInput = {
      processId: state.targetProcessId || newId('proc'),
      processName: state.targetProcessName || 'Unnamed process',
      participantName: state.participantName || state.targetProcessName || 'Provider',
      lanes: state.lanes,
      activities,
      sourceJourneyId: state.journeyId,
      sourceRevisionId: 'working-copy',
      converterVersion: '1.0',
      unresolved: state.unresolved.filter(u => u.trim()),
    };

    const result = generateBpmnXml(input);
    update({ generatedXml: result.xml, editedXml: '', warnings: result.warnings, nonLinearWarnings });
  }

  async function saveExportRecord(filename: string): Promise<void> {
    const rec: BpmnExport = {
      id: newId('exp'),
      projectId,
      journeyId: state.journeyId,
      processName: state.targetProcessName || 'Unnamed process',
      participantName: state.participantName || 'Provider',
      exportedAt: new Date().toISOString(),
      status: 'draft',
      mappingCount: state.mappings.filter(m => m.disposition === 'mapped' && m.activityName.trim()).length,
      exclusionCount: state.mappings.filter(m => m.disposition === 'excluded').length,
      unresolvedCount: state.unresolved.filter(u => u.trim()).length,
      converterVersion: '1.0',
      filename,
    };
    await db.bpmnExports.add(rec);
    setPriorExports(prev => [rec, ...prev]);
  }

  function downloadBpmn() {
    const blob = new Blob([state.editedXml || state.generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const procName = (state.targetProcessName || 'process').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${procName}-draft.bpmn`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    saveExportRecord(filename);
  }

  function downloadTrace() {
    const activities: BpmnActivity[] = state.mappings
      .filter(m => m.disposition !== 'excluded' && m.activityName.trim())
      .map(m => ({
        id: `Task_${m.stepId}`,
        name: m.activityName.trim(),
        laneId: m.laneId,
        sourceStepIds: [m.stepId],
        disposition: m.disposition as 'mapped' | 'annotation',
      }));
    const input: BpmnGeneratorInput = {
      processId: state.targetProcessId || 'unknown',
      processName: state.targetProcessName,
      participantName: state.participantName,
      lanes: state.lanes,
      activities,
      sourceJourneyId: state.journeyId,
      sourceRevisionId: 'working-copy',
      converterVersion: '1.0',
      unresolved: state.unresolved.filter(u => u.trim()),
    };
    const exclusions = state.mappings
      .filter(m => m.disposition === 'excluded')
      .map(m => ({ stepId: m.stepId, rationale: m.exclusionRationale }));
    const result = generateBpmnXml(input);
    const manifest = buildTraceManifest(input, result, exclusions);
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const procName = (state.targetProcessName || 'process').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `${procName}-draft.trace.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!state.journeyId && state.selectedStepIds.length > 0 && !!state.targetProcessName;
      case 2: return state.mappings.some(m => m.disposition !== 'excluded' && m.activityName.trim());
      case 3: return state.lanes.length > 0 && !!state.participantName;
      case 4: return true;
      case 5: return !!state.generatedXml;
      case 6: return false;
    }
  }

  function advance() {
    if (step === 2 && state.mappings.length === 0) initMappings();
    if (step === 4) generate();
    if (step === 5) {
      const xmlToCheck = state.editedXml || state.generatedXml;
      if (xmlToCheck) setValidationReport(validateBpmnXml(xmlToCheck));
    }
    if (step < 6) setStep((step + 1) as WizardStep);
  }

  function back() {
    if (step > 1) setStep((step - 1) as WizardStep);
  }

  const orderedSteps = stages.flatMap(stage =>
    steps.filter(s => s.stageId === stage.id).sort((a, b) => a.order - b.order)
  );

  return (
    <>
    <div className="dialog-backdrop">
      <div className="dialog" style={{ width: 'min(800px, 100%)', maxHeight: 'calc(100vh - 48px)' }}>
        {/* Header */}
        <div className="dialog-header">
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
              Generate BPMN draft
            </div>
            <div>Step {step} of 6: {STEP_LABELS[step]}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)', padding: '0 18px',
        }}>
          {([1, 2, 3, 4, 5, 6] as WizardStep[]).map(s => (
            <div key={s} style={{
              flex: 1, padding: '8px 4px', fontSize: 11, textAlign: 'center',
              color: s === step ? 'var(--primary)' : s < step ? 'var(--success)' : 'var(--text-subtle)',
              fontWeight: s === step ? 600 : 400,
              borderBottom: s === step ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: s < step ? 'pointer' : 'default',
            }}
              onClick={() => s < step && setStep(s)}
            >
              {s < step ? '✓ ' : ''}{STEP_LABELS[s]}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="dialog-body">
          {step === 1 && (
            <Step1
              journeys={journeys}
              stages={stages}
              orderedSteps={orderedSteps}
              processes={processes}
              state={state}
              priorExports={priorExports}
              onToggleStep={toggleStep}
              onUpdate={update}
            />
          )}
          {step === 2 && (
            <Step2
              orderedSteps={orderedSteps}
              state={state}
              onUpdateMapping={updateMapping}
              onInitMappings={initMappings}
            />
          )}
          {step === 3 && (
            <Step3
              state={state}
              onUpdate={update}
              onAddLane={addLane}
              onUpdateLane={updateLane}
              onRemoveLane={removeLane}
            />
          )}
          {step === 4 && (
            <Step4
              orderedSteps={orderedSteps}
              state={state}
              onAddUnresolved={addUnresolved}
              onUpdateUnresolved={updateUnresolved}
              onRemoveUnresolved={removeUnresolved}
            />
          )}
          {step === 5 && (
            <Step5
              state={state}
              onEdit={() => setShowModeler(true)}
              onReset={() => update({ editedXml: '' })}
            />
          )}
          {step === 6 && (
            <Step6
              state={state}
              validationReport={validationReport}
              onDownloadBpmn={downloadBpmn}
              onDownloadTrace={downloadTrace}
            />
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button className="btn" onClick={back} disabled={step === 1}>
            <ChevronLeft size={15} /> Back
          </button>
          <div style={{ flex: 1 }} />
          {step < 6 ? (
            <button className="btn btn-primary" onClick={advance} disabled={!canAdvance()}>
              {step === 4 ? 'Generate preview' : 'Continue'}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>

    {showModeler && (
      <div className="modeler-fullscreen">
        <BpmnModeler
          xml={state.editedXml || state.generatedXml}
          title={state.targetProcessName || 'Draft'}
          onChange={(xml) => update({ editedXml: xml })}
          onClose={(finalXml) => {
            update({ editedXml: finalXml });
            setShowModeler(false);
          }}
        />
      </div>
    )}
    </>
  );
}

// ─── Step components ───

function Step1({
  journeys, stages, orderedSteps, processes, state, priorExports, onToggleStep, onUpdate,
}: {
  journeys: Journey[];
  stages: JourneyStage[];
  orderedSteps: JourneyStep[];
  processes: ProcessDefinition[];
  state: WizardState;
  priorExports: BpmnExport[];
  onToggleStep: (id: string) => void;
  onUpdate: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div>
      <div className="callout callout-recommendation" style={{ marginBottom: 20 }}>
        <Info size={16} className="callout-icon" />
        <div style={{ fontSize: 13 }}>
          Select a journey, choose the steps to include, and name the process you're drafting.
          You'll map journey steps to activities in the next step.
        </div>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field-label">Journey</label>
        <select
          className="input"
          value={state.journeyId}
          onChange={e => onUpdate({ journeyId: e.target.value, selectedStepIds: [] })}
        >
          <option value="">Select a journey…</option>
          {journeys.map(j => (
            <option key={j.id} value={j.id}>{j.title} ({j.state})</option>
          ))}
        </select>
      </div>

      {/* AT-21: Show prior exports — regenerating creates a new revision, never overwrites */}
      {priorExports.length > 0 && (
        <div className="callout callout-info" style={{ marginBottom: 16 }}>
          <History size={16} className="callout-icon" />
          <div style={{ fontSize: 13 }}>
            <strong>{priorExports.length} previous export{priorExports.length > 1 ? 's' : ''}</strong> for this journey.
            Regenerating creates a <em>new revision</em> — it will not overwrite or synchronize any externally edited BPMN file.
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {priorExports.slice(0, 3).map(ex => (
                <div key={ex.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(ex.exportedAt).toLocaleString()} · {ex.processName} · {ex.mappingCount} activities
                  {ex.unresolvedCount > 0 && ` · ${ex.unresolvedCount} unresolved`}
                </div>
              ))}
              {priorExports.length > 3 && (
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>+{priorExports.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      )}

      {state.journeyId && orderedSteps.length > 0 && (
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label">Journey steps to include</label>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 8 }}>
            Select the steps that the provider process will support. Steps outside the provider's
            boundary (e.g. pre-service awareness) can be excluded with a rationale in step 4.
          </div>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            {stages.map(stage => {
              const stageSteps = orderedSteps.filter(s => s.stageId === stage.id);
              if (!stageSteps.length) return null;
              return (
                <div key={stage.id}>
                  <div style={{
                    padding: '4px 10px',
                    background: 'var(--bg-subtle)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-subtle)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {stage.title}
                  </div>
                  {stageSteps.map(s => (
                    <label key={s.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: state.selectedStepIds.includes(s.id) ? 'var(--primary-soft)' : 'none',
                      fontSize: 13,
                    }}>
                      <input
                        type="checkbox"
                        checked={state.selectedStepIds.includes(s.id)}
                        onChange={() => onToggleStep(s.id)}
                      />
                      {s.title}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <label className="field-label">Process name (what you're drafting)</label>
          <input
            className="input"
            placeholder="e.g. Fulfill API Access Request"
            value={state.targetProcessName}
            onChange={e => onUpdate({ targetProcessName: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label">Link to landscape process (optional)</label>
          <select
            className="input"
            value={state.targetProcessId}
            onChange={e => {
              const p = processes.find(p => p.id === e.target.value);
              onUpdate({
                targetProcessId: e.target.value,
                targetProcessName: p ? p.title : state.targetProcessName,
              });
            }}
          >
            <option value="">Not linked</option>
            {processes.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Step2({
  orderedSteps, state, onUpdateMapping, onInitMappings,
}: {
  orderedSteps: JourneyStep[];
  state: WizardState;
  onUpdateMapping: (stepId: string, patch: Partial<StepMapping>) => void;
  onInitMappings: () => void;
}) {
  useEffect(() => {
    if (state.mappings.length === 0) onInitMappings();
  }, []);

  const selectedSteps = orderedSteps.filter(s => state.selectedStepIds.includes(s.id));

  return (
    <div>
      <div className="callout callout-recommendation" style={{ marginBottom: 20 }}>
        <Info size={16} className="callout-icon" />
        <div style={{ fontSize: 13 }}>
          Map each journey step to an activity name in the provider process. A step can be excluded
          with a rationale (e.g. pre-service awareness is outside the provider's scope).
          The activity name describes provider work, not the customer's experience.
        </div>
      </div>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 160px 100px',
          gap: 0,
          background: 'var(--bg-subtle)',
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
        }}>
          <span>Journey step</span>
          <span>Activity name</span>
          <span>Lane</span>
          <span>Disposition</span>
        </div>

        {selectedSteps.map(s => {
          const m = state.mappings.find(m => m.stepId === s.id);
          if (!m) return null;
          return (
            <div key={s.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 160px 100px',
              gap: 8,
              padding: '8px 10px',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
              background: m.disposition === 'excluded' ? 'var(--bg-subtle)' : undefined,
            }}>
              <div style={{ fontSize: 13, color: m.disposition === 'excluded' ? 'var(--text-subtle)' : 'var(--text)' }}>
                {s.title}
              </div>
              <input
                className="input input-sm"
                placeholder="Activity name…"
                value={m.activityName}
                disabled={m.disposition === 'excluded'}
                onChange={e => onUpdateMapping(s.id, { activityName: e.target.value })}
              />
              <select
                className="input input-sm"
                value={m.laneId}
                disabled={m.disposition === 'excluded'}
                onChange={e => onUpdateMapping(s.id, { laneId: e.target.value })}
              >
                {state.lanes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select
                className="input input-sm"
                value={m.disposition}
                onChange={e => onUpdateMapping(s.id, { disposition: e.target.value as StepMapping['disposition'] })}
              >
                <option value="mapped">Mapped</option>
                <option value="annotation">Annotation</option>
                <option value="excluded">Excluded</option>
              </select>
            </div>
          );
        })}
      </div>

      {selectedSteps.length === 0 && (
        <div className="empty-state" style={{ padding: 24 }}>
          <div className="empty-state-title" style={{ fontSize: 14 }}>No steps selected</div>
          <div className="empty-state-desc" style={{ fontSize: 12 }}>Go back to step 1 and select journey steps.</div>
        </div>
      )}
    </div>
  );
}

function Step3({
  state, onUpdate, onAddLane, onUpdateLane, onRemoveLane,
}: {
  state: WizardState;
  onUpdate: (patch: Partial<WizardState>) => void;
  onAddLane: () => void;
  onUpdateLane: (id: string, name: string) => void;
  onRemoveLane: (id: string) => void;
}) {
  return (
    <div>
      <div className="callout callout-recommendation" style={{ marginBottom: 20 }}>
        <Info size={16} className="callout-icon" />
        <div style={{ fontSize: 13 }}>
          Name the participant (the organization or system performing the process) and define
          the internal role lanes. External interactions belong in handoff notes, not additional pools.
        </div>
      </div>

      <div className="field" style={{ marginBottom: 20 }}>
        <label className="field-label">Participant name</label>
        <input
          className="input"
          placeholder="e.g. Platform Engineering Team"
          value={state.participantName}
          onChange={e => onUpdate({ participantName: e.target.value })}
        />
        <div className="field-hint">The organization, team or system performing this process.</div>
      </div>

      <div className="field">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="field-label" style={{ flex: 1 }}>Internal role lanes</span>
          <button className="btn btn-sm btn-ghost" onClick={onAddLane}>
            <Plus size={13} /> Add lane
          </button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {state.lanes.map((lane, i) => (
            <div key={lane.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderBottom: i < state.lanes.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <input
                className="input input-sm"
                style={{ flex: 1 }}
                value={lane.name}
                onChange={e => onUpdateLane(lane.id, e.target.value)}
                placeholder="Lane name"
              />
              <button
                className="btn btn-sm btn-ghost btn-icon"
                onClick={() => onRemoveLane(lane.id)}
                disabled={state.lanes.length <= 1}
                title="Remove lane"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="field-hint">
          Lanes represent internal roles or teams (e.g. Support, Security, Platform).
          A customer participant or external partner belongs in handoff notes.
        </div>
      </div>
    </div>
  );
}

function Step4({
  orderedSteps, state, onAddUnresolved, onUpdateUnresolved, onRemoveUnresolved,
}: {
  orderedSteps: JourneyStep[];
  state: WizardState;
  onAddUnresolved: () => void;
  onUpdateUnresolved: (i: number, val: string) => void;
  onRemoveUnresolved: (i: number) => void;
}) {
  const mapped = state.mappings.filter(m => m.disposition === 'mapped' && m.activityName.trim());
  const annotations = state.mappings.filter(m => m.disposition === 'annotation' && m.activityName.trim());
  const excluded = state.mappings.filter(m => m.disposition === 'excluded');
  const unaccounted = state.mappings.filter(m => m.disposition !== 'excluded' && !m.activityName.trim());

  return (
    <div>
      {/* Coverage summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {[
          { label: 'Mapped', count: mapped.length, color: 'var(--success)' },
          { label: 'Annotations', count: annotations.length, color: 'var(--info)' },
          { label: 'Excluded', count: excluded.length, color: 'var(--text-muted)' },
          { label: 'Missing names', count: unaccounted.length, color: unaccounted.length ? 'var(--error)' : 'var(--success)' },
        ].map(item => (
          <div key={item.label} style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
              {item.count}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {unaccounted.length > 0 && (
        <div className="callout callout-warning" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} className="callout-icon" />
          <div style={{ fontSize: 13 }}>
            {unaccounted.length} step(s) have no activity name and will be skipped in the export.
            Go back to step 2 to add names or mark them as excluded.
          </div>
        </div>
      )}

      {/* AT-17/18: Non-linear pattern warnings — prompt student to add handoff notes */}
      {state.nonLinearWarnings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="subsection-heading">Non-linear behavior detected</div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 8 }}>
            The sequential export cannot model these patterns. Add a handoff note describing
            each one, then complete it in BPMN Studio.
          </div>
          {state.nonLinearWarnings.map((w, i) => {
            const kindColors: Record<typeof w.kind, string> = {
              decision: 'callout-warning',
              parallel: 'callout-info',
              rework:   'callout-warning',
              external: 'callout-recommendation',
            };
            return (
              <div key={i} className={`callout ${kindColors[w.kind]}`} style={{ marginBottom: 8 }}>
                <AlertCircle size={14} className="callout-icon" />
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{w.message}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{w.hint}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {excluded.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="subsection-heading">Excluded steps</div>
          {excluded.map(m => {
            const s = orderedSteps.find(s => s.id === m.stepId);
            return (
              <div key={m.stepId} style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, fontSize: 13 }}>{s?.title}</div>
                <input
                  className="input input-sm"
                  style={{ width: 280 }}
                  placeholder="Exclusion rationale…"
                  value={m.exclusionRationale}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Unresolved questions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="subsection-heading" style={{ flex: 1, margin: 0 }}>Handoff notes for BPMN Studio</span>
          <button className="btn btn-sm btn-ghost" onClick={onAddUnresolved}>
            <Plus size={13} /> Add question
          </button>
        </div>
        <div className="field-hint" style={{ marginBottom: 10 }}>
          Record decisions, exceptions, parallel work, and external interactions that the
          sequential export cannot represent. Students complete these in BPMN Studio.
        </div>
        {state.unresolved.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', padding: '8px 0' }}>
            No handoff notes yet. Add questions about edge cases, exceptions, and advanced behavior.
          </div>
        )}
        {state.unresolved.map((u, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className="input input-sm"
              style={{ flex: 1 }}
              value={u}
              onChange={e => onUpdateUnresolved(i, e.target.value)}
              placeholder="e.g. What happens when the access request is incomplete?"
            />
            <button className="btn btn-sm btn-ghost btn-icon" onClick={() => onRemoveUnresolved(i)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5({ state, onEdit, onReset }: { state: WizardState; onEdit: () => void; onReset: () => void }) {
  if (!state.generatedXml) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No preview yet</div>
        <div className="empty-state-desc">Go back and click "Generate preview".</div>
      </div>
    );
  }

  const isEdited = !!state.editedXml;
  const displayXml = isEdited ? state.editedXml : state.generatedXml;

  return (
    <div>
      {isEdited ? (
        <div className="callout callout-warning" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} className="callout-icon" />
          <div style={{ fontSize: 13 }}>
            This is your <strong>edited</strong> draft. The original generated XML is preserved — reset to undo all edits.
          </div>
        </div>
      ) : (
        <div className="callout callout-info" style={{ marginBottom: 16 }}>
          <Info size={16} className="callout-icon" />
          <div style={{ fontSize: 13 }}>
            Read-only preview. Use <strong>Edit draft</strong> to open the BPMN editor and adjust the diagram before exporting.
          </div>
        </div>
      )}

      {state.warnings.length > 0 && !isEdited && (
        <div style={{ marginBottom: 16 }}>
          {state.warnings.map((w, i) => (
            <div key={i} className="callout callout-warning" style={{ marginBottom: 8 }}>
              <AlertCircle size={16} className="callout-icon" />
              <span style={{ fontSize: 13 }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={onEdit}>
          <Pencil size={14} /> {isEdited ? 'Continue editing' : 'Edit draft'}
        </button>
        {isEdited && (
          <button className="btn btn-sm btn-ghost" onClick={onReset}>
            <RotateCcw size={14} /> Reset to generated
          </button>
        )}
      </div>

      <BpmnViewer xml={displayXml} height={400} />

      <details style={{ marginTop: 16 }}>
        <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>View raw BPMN XML</summary>
        <pre style={{
          marginTop: 8,
          padding: 12,
          background: 'var(--bg-subtle)',
          borderRadius: 6,
          fontSize: 11,
          overflow: 'auto',
          maxHeight: 300,
          fontFamily: 'var(--font-mono)',
        }}>
          {displayXml}
        </pre>
      </details>
    </div>
  );
}

function Step6({
  state: _state, validationReport, onDownloadBpmn, onDownloadTrace,
}: {
  state: WizardState;
  validationReport: ValidationReport | null;
  onDownloadBpmn: () => void;
  onDownloadTrace: () => void;
}) {
  const [bpmnDownloaded, setBpmn] = useState(false);
  const [traceDownloaded, setTrace] = useState(false);

  const hasErrors = validationReport?.hasErrors ?? false;

  return (
    <div>
      {hasErrors ? (
        <div className="callout callout-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} className="callout-icon" />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Validation errors</div>
            <div style={{ fontSize: 13 }}>
              The diagram has errors. Go back to step 5 and use "Edit draft" to fix them before exporting.
            </div>
          </div>
        </div>
      ) : (
        <div className="callout callout-success" style={{ marginBottom: validationReport ? 8 : 24 }}>
          <CheckCircle size={18} className="callout-icon" />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Export ready</div>
            <div style={{ fontSize: 13 }}>
              Download the BPMN draft and the traceability manifest, then open the .bpmn file in
              BPMN Studio to edit, validate, add advanced behavior and simulate.
            </div>
          </div>
        </div>
      )}

      {validationReport && (
        <div style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <IssueList report={validationReport} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title-row">
            <Download size={16} style={{ color: 'var(--primary)' }} />
            <span className="card-title" style={{ fontSize: 14 }}>BPMN draft</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Standards-compliant BPMN 2.0 XML with diagram interchange data.
            Open this file in BPMN Studio to continue.
          </p>
          <button
            className={`btn ${bpmnDownloaded ? '' : 'btn-primary'}`}
            style={{ width: '100%' }}
            disabled={hasErrors}
            onClick={() => { onDownloadBpmn(); setBpmn(true); }}
            title={hasErrors ? 'Fix validation errors before downloading' : undefined}
          >
            <Download size={15} />
            {bpmnDownloaded ? 'Downloaded ✓' : 'Download .bpmn'}
          </button>
        </div>

        <div className="card">
          <div className="card-title-row">
            <Download size={16} style={{ color: 'var(--accent)' }} />
            <span className="card-title" style={{ fontSize: 14 }}>Trace manifest</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            JSON sidecar with journey-to-BPMN mappings, exclusion rationale and
            source revision references.
          </p>
          <button
            className="btn"
            style={{ width: '100%' }}
            onClick={() => { onDownloadTrace(); setTrace(true); }}
          >
            <Download size={15} />
            {traceDownloaded ? 'Downloaded ✓' : 'Download .trace.json'}
          </button>
        </div>
      </div>

      <div className="callout callout-info">
        <Info size={16} className="callout-icon" />
        <div style={{ fontSize: 13 }}>
          <strong>Important:</strong> This export is a scoped sequential draft.
          Decisions, parallel work, rework loops, timers and cross-pool messaging require BPMN Studio.
          If you edit the .bpmn file externally, regenerating here creates a <em>new revision</em> —
          it will never overwrite or synchronize your BPMN Studio changes.
        </div>
      </div>
    </div>
  );
}
