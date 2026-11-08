import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, ChevronRight, Smile, Frown, Meh, AlertCircle, Zap,
  ClipboardList, Info, X, Edit3, User, Settings, Undo2, Redo2,
  Copy, Search, Trash2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  LayoutTemplate, Table2, BookOpen, Target, Clock, BookMarked,
} from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import { DictionaryPanel } from '../dictionary/DictionaryPanel';
import { WorkspacePath } from '../../components/WorkspacePath';
import type { Workspace } from '../../app/AppShell';
import type {
  Journey, JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  RowType, CardPayload, PainPoint, PainSeverity, ProcessDefinition,
  Persona, Touchpoint, Channel,
} from '../../domain/contracts/types';
import {
  duplicateJourneyAsToBe, restoreJourneySnapshot, type JourneySnapshot,
} from './journeyService';
import { JourneyCanvas } from './JourneyCanvas';
import { getChallengesForScenario } from '../learn/challenges';

interface Props {
  projectId: string;
  onNavigate?: (ws: Workspace) => void;
}

const DEFAULT_ROWS: { type: RowType; label: string }[] = [
  { type: 'customer-actions',   label: 'Customer actions' },
  { type: 'thoughts-questions', label: 'Thoughts & questions' },
  { type: 'sentiment',          label: 'Sentiment' },
  { type: 'touchpoints',        label: 'Touchpoints' },
  { type: 'pain-points',        label: 'Pain points' },
  { type: 'processes',          label: 'Supporting processes' },
];

const ALL_ROWS: { type: RowType; label: string }[] = [
  { type: 'customer-actions', label: 'Customer actions' },
  { type: 'goals-expectations', label: 'Goals & expectations' },
  { type: 'thoughts-questions', label: 'Thoughts & questions' },
  { type: 'touchpoints', label: 'Touchpoints' },
  { type: 'sentiment', label: 'Sentiment' },
  { type: 'pain-points', label: 'Pain points' },
  { type: 'moments-that-matter', label: 'Moments that matter' },
  { type: 'opportunities', label: 'Opportunities' },
  { type: 'processes', label: 'Supporting processes' },
  { type: 'roles-units', label: 'Roles & units' },
  { type: 'systems', label: 'Systems' },
  { type: 'kpis', label: 'KPIs' },
  { type: 'evidence', label: 'Evidence' },
  { type: 'free-notes', label: 'Free notes' },
];

type RightPanel = 'none' | 'properties' | 'painpoints' | 'evidence' | 'challenges';

const SCENARIO_PREFIXES = ['IT-02','IT-03','IT-04','IT-05','IT-06','IT-07','IT-08','IT-09','IT-10','IT-11','IT-12'];

export function JourneyWorkspace({ projectId, onNavigate }: Props) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [rows, setRows] = useState<JourneyRow[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [cards, setCards] = useState<JourneyCard[]>([]);
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dictOpen, setDictOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingStage, setAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [newJourneyTitle, setNewJourneyTitle] = useState('');
  const [editingCard, setEditingCard] = useState<{ cellId: string; rowType: RowType; cardId?: string } | null>(null);
  const [cardText, setCardText] = useState('');
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [rowToAdd, setRowToAdd] = useState<RowType>('free-notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const undoStack = useRef<JourneySnapshot[]>([]);
  const redoStack = useRef<JourneySnapshot[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'canvas'>('table');
  const [projectTitle, setProjectTitle] = useState('');

  const loadJourney = useCallback(async (j: Journey) => {
    setActiveJourney(j);
    const [stgs, stps, rws, pains] = await Promise.all([
      db.stages.where('journeyId').equals(j.id).and(stage => stage.projectId === projectId).toArray(),
      db.steps.where('journeyId').equals(j.id).and(step => step.projectId === projectId).toArray(),
      db.rows.where('journeyId').equals(j.id).and(row => row.projectId === projectId).toArray(),
      db.painPoints.where('projectId').equals(projectId).toArray(),
    ]);
    stgs.sort((a, b) => a.order - b.order);
    stps.sort((a, b) => a.order - b.order);
    rws.sort((a, b) => a.order - b.order);
    setStages(stgs);
    setSteps(stps);
    setRows(rws);
    setPainPoints(pains);
    const stepIds = stps.map(s => s.id);
    if (stepIds.length > 0) {
      const cs = await db.cells.where('stepId').anyOf(stepIds).and(cell => cell.projectId === projectId).toArray();
      setCells(cs);
      const cellIds = cs.map(c => c.id);
      if (cellIds.length > 0) {
        const cds = await db.cards.where('cellId').anyOf(cellIds).and(card => card.projectId === projectId).toArray();
        setCards(cds);
      } else {
        setCards([]);
      }
    } else {
      setCells([]);
      setCards([]);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      db.journeys.where('projectId').equals(projectId).toArray(),
      db.processes.where('projectId').equals(projectId).toArray(),
      db.personas.where('projectId').equals(projectId).toArray(),
      db.touchpoints.where('projectId').equals(projectId).toArray(),
      db.channels.where('projectId').equals(projectId).toArray(),
    ]).then(async ([js, procs, pers, tps, chs]) => {
      if (cancelled) return;
      setJourneys(js);
      setProcesses(procs);
      setPersonas(pers);
      setTouchpoints(tps);
      setChannels(chs);
      if (js.length > 0) await loadJourney(js[0]);
      if (!cancelled) setLoading(false);
    }).catch(error => {
      if (!cancelled) {
        setSaveError(error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [loadJourney, projectId]);

  useEffect(() => {
    db.projects.get(projectId).then(p => setProjectTitle(p?.title ?? ''));
  }, [projectId]);

  function snapshotFromState(): JourneySnapshot | null {
    if (!activeJourney) return null;
    return structuredClone({ journey: activeJourney, stages, steps, rows, cells, cards });
  }

  async function refreshActiveJourney() {
    if (!activeJourney) return;
    const current = await db.journeys.get(activeJourney.id);
    if (current) await loadJourney(current);
  }

  async function runEdit(action: () => Promise<void>, options: { reload?: boolean; undoable?: boolean } = {}) {
    const before = options.undoable === false ? null : snapshotFromState();
    setSaving(true);
    setSaveError(null);
    try {
      await action();
      if (before) {
        undoStack.current.push(before);
        redoStack.current = [];
        setHistoryVersion(value => value + 1);
      }
      if (options.reload !== false) await refreshActiveJourney();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
      window.dispatchEvent(new CustomEvent('pjs-storage-error', { detail: error }));
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    const previous = undoStack.current.pop();
    const current = snapshotFromState();
    if (!previous || !current) return;
    setSaving(true);
    try {
      await restoreJourneySnapshot(previous);
      redoStack.current.push(current);
      await loadJourney(previous.journey);
      setHistoryVersion(value => value + 1);
    } finally {
      setSaving(false);
    }
  }

  async function redo() {
    const next = redoStack.current.pop();
    const current = snapshotFromState();
    if (!next || !current) return;
    setSaving(true);
    try {
      await restoreJourneySnapshot(next);
      undoStack.current.push(current);
      await loadJourney(next.journey);
      setHistoryVersion(value => value + 1);
    } finally {
      setSaving(false);
    }
  }

  async function createJourney() {
    if (!newJourneyTitle.trim()) return;
    const now = new Date().toISOString();
    const j: Journey = {
      id: newId('journey'), projectId,
      title: newJourneyTitle.trim(),
      goal: '',
      situation: '',
      perspective: 'customer',
      state: 'as-is',
      personaIds: [],
      stageOrder: [],
      rowOrder: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.journeys.add(j);
    const rws: JourneyRow[] = DEFAULT_ROWS.map((r, i) => ({
      id: newId('row'), projectId, journeyId: j.id, type: r.type, label: r.label, order: i,
    }));
    await db.rows.bulkAdd(rws);
    setJourneys(prev => [...prev, j]);
    setNewJourneyTitle('');
    setCreating(false);
    await loadJourney(j);
  }

  async function addStage() {
    if (!activeJourney || !newStageTitle.trim()) return;
    const stage: JourneyStage = {
      id: newId('stage'), projectId, journeyId: activeJourney.id,
      title: newStageTitle.trim(), description: '', order: stages.length,
    };
    const step: JourneyStep = {
      id: newId('step'), projectId, journeyId: activeJourney.id, stageId: stage.id,
      title: 'Step 1', order: 0,
    };
    const newCells: Cell[] = rows.map(row => ({
      id: newId('cell'), projectId, journeyId: activeJourney.id, stepId: step.id,
      rowId: row.id, cardOrder: [],
    }));
    await runEdit(async () => {
      await db.transaction('rw', [db.journeys, db.stages, db.steps, db.cells], async () => {
        await db.stages.add(stage);
        await db.steps.add(step);
        if (newCells.length) await db.cells.bulkAdd(newCells);
        await db.journeys.update(activeJourney.id, { stageOrder: [...activeJourney.stageOrder, stage.id] });
      });
    });
    setNewStageTitle('');
    setAddingStage(false);
  }

  async function addStep(stageId: string) {
    if (!activeJourney) return;
    const stageSteps = steps.filter(s => s.stageId === stageId);
    const step: JourneyStep = {
      id: newId('step'), projectId, journeyId: activeJourney.id, stageId,
      title: `Step ${stageSteps.length + 1}`, order: stageSteps.length,
    };
    const newCells: Cell[] = rows.map(row => ({
      id: newId('cell'), projectId, journeyId: activeJourney.id, stepId: step.id,
      rowId: row.id, cardOrder: [],
    }));
    await runEdit(async () => {
      await db.transaction('rw', [db.steps, db.cells], async () => {
        await db.steps.add(step);
        if (newCells.length) await db.cells.bulkAdd(newCells);
      });
    });
  }

  async function updateStageTitle(stageId: string, title: string) {
    if (!title.trim()) return;
    await runEdit(() => db.stages.update(stageId, { title: title.trim() }).then(() => undefined));
  }

  async function moveStage(stageId: string, direction: -1 | 1) {
    const ordered = [...stages].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex(stage => stage.id === stageId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length || !activeJourney) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const updated = ordered.map((stage, order) => ({ ...stage, order }));
    await runEdit(async () => {
      await db.transaction('rw', [db.stages, db.journeys], async () => {
        await db.stages.bulkPut(updated);
        await db.journeys.update(activeJourney.id, { stageOrder: updated.map(stage => stage.id) });
      });
    });
  }

  async function deleteStage(stageId: string) {
    if (!activeJourney) return;
    const stageSteps = steps.filter(step => step.stageId === stageId);
    const stepIds = stageSteps.map(step => step.id);
    const stageCells = cells.filter(cell => stepIds.includes(cell.stepId));
    const cellIds = stageCells.map(cell => cell.id);
    const linkedCards = cards.filter(card => cellIds.includes(card.cellId));
    const stage = stages.find(item => item.id === stageId);
    const warning = 'Delete stage “' + (stage?.title ?? 'Untitled') + '” and its ' + stageSteps.length + ' step(s)?'
      + (linkedCards.length ? ' This also removes ' + linkedCards.length + ' linked card(s).' : '');
    if (!window.confirm(warning)) return;
    await runEdit(async () => {
      await db.transaction('rw', [db.journeys, db.stages, db.steps, db.cells, db.cards], async () => {
        if (cellIds.length) await db.cards.where('cellId').anyOf(cellIds).delete();
        if (stepIds.length) {
          await db.cells.where('stepId').anyOf(stepIds).delete();
          await db.steps.bulkDelete(stepIds);
        }
        await db.stages.delete(stageId);
        const remaining = stages.filter(item => item.id !== stageId)
          .sort((a, b) => a.order - b.order)
          .map((item, order) => ({ ...item, order }));
        if (remaining.length) await db.stages.bulkPut(remaining);
        await db.journeys.update(activeJourney.id, { stageOrder: remaining.map(item => item.id) });
      });
    });
  }

  async function moveStep(stepId: string, direction: -1 | 1) {
    const ordered = stages.flatMap(stage =>
      steps.filter(step => step.stageId === stage.id).sort((a, b) => a.order - b.order).map(step => ({ ...step })),
    );
    const index = ordered.findIndex(step => step.id === stepId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const moving = ordered[index];
    const neighbor = ordered[target];
    const movingStage = moving.stageId;
    moving.stageId = neighbor.stageId;
    neighbor.stageId = movingStage;
    [ordered[index], ordered[target]] = [neighbor, moving];
    const updated = stages.flatMap(stage =>
      ordered.filter(step => step.stageId === stage.id).map((step, order) => ({ ...step, order })),
    );
    await runEdit(() => db.steps.bulkPut(updated).then(() => undefined));
  }

  async function deleteStep(stepId: string) {
    const step = steps.find(item => item.id === stepId);
    if (!step) return;
    const stepCells = cells.filter(cell => cell.stepId === stepId);
    const cellIds = stepCells.map(cell => cell.id);
    const linkedCards = cards.filter(card => cellIds.includes(card.cellId));
    const warning = 'Delete step “' + step.title + '”?'
      + (linkedCards.length ? ' This also removes ' + linkedCards.length + ' linked card(s).' : '');
    if (!window.confirm(warning)) return;
    await runEdit(async () => {
      await db.transaction('rw', [db.steps, db.cells, db.cards], async () => {
        if (cellIds.length) await db.cards.where('cellId').anyOf(cellIds).delete();
        await db.cells.where('stepId').equals(stepId).delete();
        await db.steps.delete(stepId);
        const remaining = steps.filter(item => item.id !== stepId && item.stageId === step.stageId)
          .sort((a, b) => a.order - b.order)
          .map((item, order) => ({ ...item, order }));
        if (remaining.length) await db.steps.bulkPut(remaining);
      });
    });
  }

  async function addRow() {
    if (!activeJourney) return;
    const definition = ALL_ROWS.find(row => row.type === rowToAdd)!;
    const row: JourneyRow = {
      id: newId('row'), projectId, journeyId: activeJourney.id,
      type: definition.type, label: definition.label, order: rows.length,
    };
    const newCells: Cell[] = steps.map(step => ({
      id: newId('cell'), projectId, journeyId: activeJourney.id,
      stepId: step.id, rowId: row.id, cardOrder: [],
    }));
    await runEdit(async () => {
      await db.transaction('rw', [db.journeys, db.rows, db.cells], async () => {
        await db.rows.add(row);
        if (newCells.length) await db.cells.bulkAdd(newCells);
        await db.journeys.update(activeJourney.id, { rowOrder: [...activeJourney.rowOrder, row.id] });
      });
    });
  }

  async function moveRow(rowId: string, direction: -1 | 1) {
    const ordered = [...rows].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex(row => row.id === rowId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length || !activeJourney) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const updated = ordered.map((row, order) => ({ ...row, order }));
    await runEdit(async () => {
      await db.transaction('rw', [db.rows, db.journeys], async () => {
        await db.rows.bulkPut(updated);
        await db.journeys.update(activeJourney.id, { rowOrder: updated.map(row => row.id) });
      });
    });
  }

  async function deleteRow(rowId: string) {
    if (!activeJourney) return;
    const row = rows.find(item => item.id === rowId);
    const rowCells = cells.filter(cell => cell.rowId === rowId);
    const cellIds = rowCells.map(cell => cell.id);
    const linkedCards = cards.filter(card => cellIds.includes(card.cellId));
    const warning = 'Remove row “' + (row?.label ?? 'Untitled') + '”?'
      + (linkedCards.length ? ' This also removes ' + linkedCards.length + ' card(s).' : '');
    if (!window.confirm(warning)) return;
    await runEdit(async () => {
      await db.transaction('rw', [db.journeys, db.rows, db.cells, db.cards], async () => {
        if (cellIds.length) await db.cards.where('cellId').anyOf(cellIds).delete();
        await db.cells.where('rowId').equals(rowId).delete();
        await db.rows.delete(rowId);
        const remaining = rows.filter(item => item.id !== rowId)
          .sort((a, b) => a.order - b.order)
          .map((item, order) => ({ ...item, order }));
        if (remaining.length) await db.rows.bulkPut(remaining);
        await db.journeys.update(activeJourney.id, { rowOrder: remaining.map(item => item.id) });
      });
    });
  }

  async function saveCard(cellId: string, text: string, rowType: RowType) {
    if (!text.trim()) { setEditingCard(null); return; }
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    let payload: CardPayload;
    if (rowType === 'processes') {
      // Try to match a process by name
      const matched = processes.find(p => p.title.toLowerCase() === text.trim().toLowerCase());
      payload = matched
        ? { kind: 'process-link', processId: matched.id }
        : { kind: 'text', text: `[Process] ${text.trim()}` };
    } else {
      payload = { kind: 'text', text: text.trim() };
    }

    const card: JourneyCard = {
      id: newId('card'), projectId, cellId, payload,
      sourceStatus: 'assumption', evidenceIds: [], note: '',
    };
    await runEdit(async () => {
      await db.transaction('rw', [db.cards, db.cells], async () => {
        await db.cards.add(card);
        await db.cells.update(cellId, { cardOrder: [...(cell.cardOrder ?? []), card.id] });
      });
    });
    setCardText('');
    setEditingCard(null);
  }

  async function editCard(cardId: string) {
    const card = cards.find(item => item.id === cardId);
    if (!card || card.payload.kind !== 'text') return;
    const text = window.prompt('Edit card text', card.payload.text);
    if (text === null || !text.trim()) return;
    await runEdit(() => db.cards.update(cardId, { payload: { kind: 'text', text: text.trim() } }).then(() => undefined));
  }

  async function deleteCard(cardId: string) {
    const card = cards.find(item => item.id === cardId);
    if (!card) return;
    const cell = cells.find(item => item.id === card.cellId);
    const linked = card.evidenceIds.length > 0 || card.payload.kind !== 'text';
    if (linked && !window.confirm('This card has linked data or evidence. Delete it anyway?')) return;
    await runEdit(async () => {
      await db.transaction('rw', [db.cards, db.cells], async () => {
        await db.cards.delete(cardId);
        if (cell) await db.cells.update(cell.id, { cardOrder: cell.cardOrder.filter(id => id !== cardId) });
      });
    });
  }

  async function moveCard(cardId: string, direction: -1 | 1) {
    const card = cards.find(item => item.id === cardId);
    const sourceCell = cells.find(item => item.id === card?.cellId);
    if (!card || !sourceCell) return;
    const orderedSteps = stages.flatMap(stage =>
      steps.filter(step => step.stageId === stage.id).sort((a, b) => a.order - b.order),
    );
    const index = orderedSteps.findIndex(step => step.id === sourceCell.stepId);
    const targetStep = orderedSteps[index + direction];
    const targetCell = targetStep
      ? cells.find(item => item.stepId === targetStep.id && item.rowId === sourceCell.rowId)
      : undefined;
    if (!targetCell) return;
    await runEdit(async () => {
      await db.transaction('rw', [db.cards, db.cells], async () => {
        await db.cards.update(card.id, { cellId: targetCell.id });
        await db.cells.update(sourceCell.id, { cardOrder: sourceCell.cardOrder.filter(id => id !== card.id) });
        await db.cells.update(targetCell.id, { cardOrder: [...targetCell.cardOrder, card.id] });
      });
    });
  }

  async function addSentimentCard(cellId: string, value: number | null) {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    // Replace existing sentiment card for this cell+persona or add new
    const pid = selectedPersonaId ?? 'default';
    const existingSentCard = (cell.cardOrder ?? [])
      .map(cid => cards.find(c => c.id === cid))
      .find(c => c?.payload.kind === 'sentiment' && c.payload.personaId === pid);
    if (existingSentCard) {
      const updated = { ...existingSentCard, payload: { ...existingSentCard.payload, value } as CardPayload };
      await db.cards.update(existingSentCard.id, { payload: updated.payload });
      setCards(prev => prev.map(c => c.id === existingSentCard.id ? updated : c));
    } else {
      const card: JourneyCard = {
        id: newId('card'), projectId, cellId,
        payload: { kind: 'sentiment', personaId: selectedPersonaId ?? 'default', value: value as (-2 | -1 | 0 | 1 | 2 | null) },
        sourceStatus: 'assumption', evidenceIds: [], note: '',
      };
      await db.cards.add(card);
      await db.cells.update(cellId, { cardOrder: [...(cell.cardOrder ?? []), card.id] });
      setCells(prev => prev.map(c => c.id === cellId ? { ...c, cardOrder: [...(c.cardOrder ?? []), card.id] } : c));
      setCards(prev => [...prev, card]);
    }
  }

  async function addPainPoint(cellId: string, title: string, severity: PainSeverity) {
    if (!title.trim() || !activeJourney) return;
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;
    const stepId = cell.stepId;

    const pp: PainPoint = {
      id: newId('pain'), projectId,
      title: title.trim(), description: '',
      affectedPersonaIds: [], affectedStepIds: [stepId], affectedProcessIds: [],
      severity, scopeEstimate: '', evidenceIds: [],
      suspectedCauseIds: [], state: 'open',
      symptom: title.trim(), hypothesizedCause: '', validatedCause: '', proposedIntervention: '',
    };
    await db.painPoints.add(pp);
    setPainPoints(prev => [...prev, pp]);

    // Add a pain-link card to the cell
    const card: JourneyCard = {
      id: newId('card'), projectId, cellId,
      payload: { kind: 'pain-link', painPointId: pp.id },
      sourceStatus: 'assumption', evidenceIds: [], note: '',
    };
    await db.cards.add(card);
    await db.cells.update(cellId, { cardOrder: [...(cell.cardOrder ?? []), card.id] });
    setCells(prev => prev.map(c => c.id === cellId ? { ...c, cardOrder: [...(c.cardOrder ?? []), card.id] } : c));
    setCards(prev => [...prev, card]);
  }

  async function updateStepTitle(stepId: string, title: string) {
    if (!title.trim()) return;
    await runEdit(() => db.steps.update(stepId, { title: title.trim() }).then(() => undefined));
  }

  async function updateJourneyProp(key: keyof Journey, value: string) {
    if (!activeJourney) return;
    await db.journeys.update(activeJourney.id, { [key]: value });
    setActiveJourney(prev => prev ? { ...prev, [key]: value } : prev);
    setJourneys(prev => prev.map(j => j.id === activeJourney.id ? { ...j, [key]: value } : j));
  }

  async function updateJourneyPersonas(personaIds: string[]) {
    if (!activeJourney) return;
    await runEdit(async () => {
      await db.journeys.update(activeJourney.id, { personaIds });
    });
  }

  async function createToBeCopy() {
    if (!activeJourney) return;
    setSaving(true);
    setSaveError(null);
    try {
      const copy = await duplicateJourneyAsToBe(projectId, activeJourney.id);
      setJourneys(current => [...current, copy]);
      await loadJourney(copy);
      undoStack.current = [];
      redoStack.current = [];
      setHistoryVersion(value => value + 1);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="workspace"><div className="text-muted">Loading…</div></div>;

  if (journeys.length === 0 || (!activeJourney && !creating)) {
    return (
      <div className="workspace">
        <div className="workspace-narrow">
          {creating ? (
            <div className="card" style={{ maxWidth: 480 }}>
              <h2 className="card-title" style={{ marginBottom: 16 }}>New journey</h2>
              <div className="field">
                <label className="field-label" htmlFor="journey-title">Journey title</label>
                <input
                  id="journey-title" className="input"
                  placeholder="e.g. Developer integrates API for the first time"
                  value={newJourneyTitle}
                  onChange={e => setNewJourneyTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createJourney(); if (e.key === 'Escape') setCreating(false); }}
                  autoFocus
                />
                <div className="field-hint">Frame it from the stakeholder's perspective and goal.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={createJourney} disabled={!newJourneyTitle.trim()}>
                  Create journey
                </button>
                <button className="btn" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><ChevronRight size={36} /></div>
              <div className="empty-state-title">No journeys yet</div>
              <div className="empty-state-desc">
                Create a journey to map the experience of a customer, employee or developer
                pursuing a specific goal.
              </div>
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={16} /> Create a journey
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!activeJourney) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Journey selector & toolbar */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {journeys.length > 1 ? (
          <select className="input" style={{ width: 'auto', height: 28, fontSize: 13 }}
            value={activeJourney.id}
            onChange={e => { const j = journeys.find(j => j.id === e.target.value); if (j) loadJourney(j); }}>
            {journeys.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        ) : (
          <span style={{ fontWeight: 650, fontSize: 14 }}>{activeJourney.title}</span>
        )}
        <span className={`badge ${activeJourney.state === 'as-is' ? 'badge-info' : 'badge-primary'}`}>
          {activeJourney.state === 'as-is' ? 'AS-IS' : 'TO-BE'}
        </span>
        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
          {activeJourney.perspective}
        </span>
        {/* AT-04: Persona lens switcher — filters sentiment row to show one persona's observations */}
        {personas.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <User size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input"
              style={{ height: 26, fontSize: 12, padding: '0 4px', width: 'auto' }}
              value={selectedPersonaId ?? ''}
              onChange={e => setSelectedPersonaId(e.target.value || null)}
              aria-label="Persona lens for sentiment"
            >
              <option value="">All personas</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: 7, color: 'var(--text-subtle)' }} />
          <input
            className="input input-sm"
            style={{ width: 150, paddingLeft: 24 }}
            placeholder="Filter cards…"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            aria-label="Filter journey cards"
          />
        </div>
        <button key={`undo-${historyVersion}`} className="btn btn-sm btn-ghost" onClick={undo}
          disabled={saving || undoStack.current.length === 0} title="Undo last structural change">
          <Undo2 size={14} /> Undo
        </button>
        <button className="btn btn-sm btn-ghost" onClick={redo}
          disabled={saving || redoStack.current.length === 0} title="Redo change">
          <Redo2 size={14} /> Redo
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => setDictOpen(true)} title="Manage personas, systems, channels and touchpoints">
          <BookMarked size={14} /> Dictionary
        </button>
        <button className="btn btn-sm btn-ghost" onClick={createToBeCopy} disabled={saving} title="Create independent TO-BE copy">
          <Copy size={14} /> TO-BE copy
        </button>
        {/* Panel toggles */}
        {(['properties', 'painpoints', 'evidence'] as RightPanel[]).map(panel => {
          const icons: Record<string, React.ReactNode> = {
            properties: <Settings size={14} />,
            painpoints: <AlertCircle size={14} />,
            evidence: <ClipboardList size={14} />,
          };
          const labels: Record<string, string> = {
            properties: 'Properties',
            painpoints: `Pain points (${painPoints.length})`,
            evidence: 'Evidence',
          };
          return (
            <button
              key={panel}
              className={`btn btn-sm${rightPanel === panel ? '' : ' btn-ghost'}`}
              style={rightPanel === panel
                ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary)' }
                : {}}
              onClick={() => setRightPanel(rightPanel === panel ? 'none' : panel)}
            >
              {icons[panel]} {labels[panel]}
            </button>
          );
        })}
        {/* View mode toggle */}
        <button
          className={`btn btn-sm${viewMode === 'canvas' ? '' : ' btn-ghost'}`}
          style={viewMode === 'canvas' ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
          onClick={() => setViewMode(v => v === 'table' ? 'canvas' : 'table')}
          title={viewMode === 'table' ? 'Switch to canvas view' : 'Switch to table view'}
        >
          {viewMode === 'table' ? <LayoutTemplate size={14} /> : <Table2 size={14} />}
          {viewMode === 'table' ? 'Canvas' : 'Table'}
        </button>
        {/* Scenario challenges panel */}
        {SCENARIO_PREFIXES.some(p => projectTitle.startsWith(p)) && (
          <button
            className={`btn btn-sm${rightPanel === 'challenges' ? '' : ' btn-ghost'}`}
            style={rightPanel === 'challenges' ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
            onClick={() => setRightPanel(rightPanel === 'challenges' ? 'none' : 'challenges')}
          >
            <BookOpen size={14} /> Challenges
          </button>
        )}
        <button className="btn btn-sm" onClick={() => setCreating(true)}>
          <Plus size={14} /> New
        </button>
      </div>

      {(saving || saveError) && (
        <div role={saveError ? 'alert' : 'status'} style={{
          padding: '5px 16px', fontSize: 12,
          color: saveError ? 'var(--error)' : 'var(--text-muted)',
          background: saveError ? 'var(--error-soft)' : 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
        }}>
          {saveError ? `Save failed: ${saveError}` : 'Saving…'}
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Matrix */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {stages.length === 0 ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
              <div className="empty-state">
                <div className="empty-state-icon"><ChevronRight size={32} /></div>
                <div className="empty-state-title">No stages yet</div>
                <div className="empty-state-desc">
                  Add stages to represent the major phases of the experience, like "Discover", "Onboard" or "Support".
                </div>
                <button className="btn btn-primary" onClick={() => setAddingStage(true)}>
                  <Plus size={16} /> Add first stage
                </button>
              </div>
            </div>
          ) : viewMode === 'canvas' ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <JourneyCanvas
                stages={stages}
                steps={steps}
                rows={rows}
                cells={cells}
                cards={cards}
                painPoints={painPoints}
                personas={personas}
                touchpoints={touchpoints}
              />
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <JourneyMatrix
                stages={stages}
                steps={steps}
                rows={rows}
                cells={cells}
                cards={cards}
                processes={processes}
                painPoints={painPoints}
                personas={personas}
                touchpoints={touchpoints}
                channels={channels}
                selectedPersonaId={selectedPersonaId}
                searchQuery={searchQuery}
                editingCard={editingCard}
                cardText={cardText}
                onAddStep={addStep}
                onUpdateStageTitle={updateStageTitle}
                onMoveStage={moveStage}
                onDeleteStage={deleteStage}
                onUpdateStepTitle={updateStepTitle}
                onMoveStep={moveStep}
                onDeleteStep={deleteStep}
                onMoveRow={moveRow}
                onDeleteRow={deleteRow}
                onStartEditCard={(cellId, rowType) => { setEditingCard({ cellId, rowType }); setCardText(''); }}
                onCardTextChange={setCardText}
                onSaveCard={saveCard}
                onCancelEdit={() => { setEditingCard(null); setCardText(''); }}
                onAddSentiment={addSentimentCard}
                onAddPainPoint={addPainPoint}
                onSelectCard={setSelectedCardId}
                onEditCard={editCard}
                onMoveCard={moveCard}
                onDeleteCard={deleteCard}
                selectedCardId={selectedCardId}
              />
            </div>
          )}

          {/* Add stage bar */}
          <div style={{
            padding: '6px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            {addingStage ? (
              <>
                <input
                  className="input input-sm" style={{ width: 220 }}
                  placeholder="Stage title, e.g. Discover"
                  value={newStageTitle}
                  onChange={e => setNewStageTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addStage(); if (e.key === 'Escape') setAddingStage(false); }}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={addStage} disabled={!newStageTitle.trim()}>Add stage</button>
                <button className="btn btn-sm" onClick={() => setAddingStage(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn btn-sm btn-ghost" onClick={() => setAddingStage(true)}>
                  <Plus size={14} /> Add stage
                </button>
                <span style={{ width: 1, height: 18, background: 'var(--border)' }} />
                <select className="input input-sm" style={{ width: 180 }} value={rowToAdd}
                  onChange={event => setRowToAdd(event.target.value as RowType)} aria-label="Row type to add">
                  {ALL_ROWS.map(row => <option key={row.type} value={row.type}>{row.label}</option>)}
                </select>
                <button className="btn btn-sm btn-ghost" onClick={addRow}>
                  <Plus size={14} /> Add row
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right inspector panel */}
        {rightPanel !== 'none' && (
          <div style={{
            width: 300,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-elevated)',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontWeight: 650, fontSize: 13, flex: 1 }}>
                {rightPanel === 'properties' && 'Journey properties'}
                {rightPanel === 'painpoints' && 'Pain points'}
                {rightPanel === 'evidence' && 'Evidence'}
                {rightPanel === 'challenges' && 'Scenario challenges'}
              </span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRightPanel('none')}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              {rightPanel === 'properties' && (
                <JourneyProperties journey={activeJourney} personas={personas}
                  onUpdate={updateJourneyProp} onUpdatePersonas={updateJourneyPersonas} />
              )}
              {rightPanel === 'painpoints' && (
                <PainPointsPanel
                  painPoints={painPoints}
                  steps={steps}
                  projectId={projectId}
                  onAdd={pp => setPainPoints(prev => [...prev, pp])}
                  onUpdate={pp => setPainPoints(prev => prev.map(p => p.id === pp.id ? pp : p))}
                />
              )}
              {rightPanel === 'evidence' && (
                <EvidencePanel projectId={projectId} />
              )}
              {rightPanel === 'challenges' && (
                <ScenarioChallengesPanel projectTitle={projectTitle} />
              )}
            </div>
          </div>
        )}
      </div>
      {onNavigate && <WorkspacePath current="journey" onNavigate={onNavigate} />}
      {dictOpen && (
        <DictionaryPanel
          projectId={projectId}
          onClose={() => {
            setDictOpen(false);
            // Reload dictionary entries so edits show up immediately
            Promise.all([
              db.personas.where('projectId').equals(projectId).toArray(),
              db.touchpoints.where('projectId').equals(projectId).toArray(),
              db.channels.where('projectId').equals(projectId).toArray(),
            ]).then(([pers, tps, chs]) => { setPersonas(pers); setTouchpoints(tps); setChannels(chs); });
          }}
        />
      )}
    </div>
  );
}

// ─── Journey Matrix ───

interface MatrixProps {
  stages: JourneyStage[];
  steps: JourneyStep[];
  rows: JourneyRow[];
  cells: Cell[];
  cards: JourneyCard[];
  processes: ProcessDefinition[];
  painPoints: PainPoint[];
  personas: Persona[];
  touchpoints: Touchpoint[];
  channels: Channel[];
  selectedPersonaId: string | null;
  searchQuery: string;
  editingCard: { cellId: string; rowType: RowType } | null;
  cardText: string;
  selectedCardId: string | null;
  onAddStep: (stageId: string) => void;
  onUpdateStageTitle: (stageId: string, title: string) => void;
  onMoveStage: (stageId: string, direction: -1 | 1) => void;
  onDeleteStage: (stageId: string) => void;
  onUpdateStepTitle: (stepId: string, title: string) => void;
  onMoveStep: (stepId: string, direction: -1 | 1) => void;
  onDeleteStep: (stepId: string) => void;
  onMoveRow: (rowId: string, direction: -1 | 1) => void;
  onDeleteRow: (rowId: string) => void;
  onStartEditCard: (cellId: string, rowType: RowType) => void;
  onCardTextChange: (text: string) => void;
  onSaveCard: (cellId: string, text: string, rowType: RowType) => void;
  onCancelEdit: () => void;
  onAddSentiment: (cellId: string, value: number | null) => void;
  onAddPainPoint: (cellId: string, title: string, severity: PainSeverity) => void;
  onSelectCard: (cardId: string | null) => void;
  onEditCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: -1 | 1) => void;
  onDeleteCard: (cardId: string) => void;
}

function JourneyMatrix({
  stages, steps, rows, cells, cards, processes, painPoints,
  personas: _personas, touchpoints, channels, selectedPersonaId, searchQuery,
  editingCard, cardText,
  onAddStep, onUpdateStageTitle, onMoveStage, onDeleteStage,
  onUpdateStepTitle, onMoveStep, onDeleteStep, onMoveRow, onDeleteRow,
  onStartEditCard, onCardTextChange, onSaveCard, onCancelEdit,
  onAddSentiment, onAddPainPoint, onSelectCard, onEditCard, onMoveCard, onDeleteCard, selectedCardId,
}: MatrixProps) {
  const ROW_HEADER_W = 164;
  const COL_W = 184;
  const STAGE_H = 34;
  const STEP_H = 44;
  const ROW_H = 100;

  function getCell(stepId: string, rowId: string) {
    return cells.find(c => c.stepId === stepId && c.rowId === rowId);
  }

  function getCellCards(cellId: string) {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return [];
    const ordered = (cell.cardOrder ?? []).map(cid => cards.find(c => c.id === cid)).filter(Boolean) as JourneyCard[];
    const query = searchQuery.trim().toLowerCase();
    return query ? ordered.filter(card => JSON.stringify(card).toLowerCase().includes(query)) : ordered;
  }

  const allSteps = stages.flatMap(s =>
    steps.filter(st => st.stageId === s.id).sort((a, b) => a.order - b.order)
  );

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%' }}>
      <table
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: ROW_HEADER_W + allSteps.length * COL_W }}
        role="grid" aria-label="Journey matrix"
      >
        <thead>
          {/* Stage header */}
          <tr>
            <th style={{
              width: ROW_HEADER_W, height: STAGE_H,
              background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 3,
            }} />
            {stages.map(stage => {
              const ss = steps.filter(s => s.stageId === stage.id);
              return (
                <th key={stage.id} colSpan={ss.length}
                  style={{
                    height: STAGE_H, background: 'var(--primary-soft)',
                    borderRight: '2px solid var(--border-strong)',
                    borderBottom: '1px solid var(--border)',
                    padding: '0 12px', textAlign: 'left',
                    fontWeight: 650, fontSize: 13, color: 'var(--primary)', letterSpacing: '-0.01em',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <StepTitleEditor title={stage.title} onSave={title => onUpdateStageTitle(stage.id, title)} />
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveStage(stage.id, -1)}
                      title="Move stage left" aria-label={`Move ${stage.title} left`}><ArrowLeft size={11} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveStage(stage.id, 1)}
                      title="Move stage right" aria-label={`Move ${stage.title} right`}><ArrowRight size={11} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteStage(stage.id)}
                      title="Delete stage" aria-label={`Delete ${stage.title}`}><Trash2 size={11} /></button>
                  </div>
                </th>
              );
            })}
          </tr>

          {/* Step header */}
          <tr>
            <th style={{
              width: ROW_HEADER_W, height: STEP_H,
              background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)',
              borderBottom: '2px solid var(--border-strong)',
              fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)',
              textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px',
              position: 'sticky', left: 0, zIndex: 3,
            }}>
              Row / Step
            </th>
            {stages.flatMap(stage => {
              const ss = steps.filter(s => s.stageId === stage.id).sort((a, b) => a.order - b.order);
              return [
                ...ss.map((step, si) => (
                  <th key={step.id}
                    style={{
                      height: STEP_H, width: COL_W,
                      borderRight: si === ss.length - 1 ? '2px solid var(--border-strong)' : '1px solid var(--border)',
                      borderBottom: '2px solid var(--border-strong)',
                      padding: '4px 8px', background: 'var(--bg-elevated)',
                      verticalAlign: 'middle', position: 'sticky', top: STAGE_H,
                    }}>
                    <StepTitleEditor title={step.title} onSave={t => onUpdateStepTitle(step.id, t)} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveStep(step.id, -1)}
                        title="Move step left" aria-label={`Move ${step.title} left`}><ArrowLeft size={10} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveStep(step.id, 1)}
                        title="Move step right" aria-label={`Move ${step.title} right`}><ArrowRight size={10} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteStep(step.id)}
                        title="Delete step" aria-label={`Delete ${step.title}`}><Trash2 size={10} /></button>
                    </div>
                  </th>
                )),
                <th key={`add-${stage.id}`}
                  style={{
                    width: 36, borderRight: '2px solid var(--border-strong)',
                    borderBottom: '2px solid var(--border-strong)',
                    background: 'var(--bg-subtle)', textAlign: 'center', padding: 0,
                  }}>
                  <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => onAddStep(stage.id)}
                    title={`Add step to ${stage.title}`}
                    style={{ width: '100%', height: '100%', borderRadius: 0 }}>
                    <Plus size={12} />
                  </button>
                </th>,
              ];
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              {/* Row label */}
              <td style={{
                width: ROW_HEADER_W, height: ROW_H,
                borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                padding: '8px 12px', background: 'var(--bg-elevated)',
                position: 'sticky', left: 0, zIndex: 1, verticalAlign: 'top',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RowIcon type={row.type} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {row.label}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveRow(row.id, -1)}
                    title="Move row up" aria-label={`Move ${row.label} up`}><ArrowUp size={10} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMoveRow(row.id, 1)}
                    title="Move row down" aria-label={`Move ${row.label} down`}><ArrowDown size={10} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDeleteRow(row.id)}
                    title="Remove row" aria-label={`Remove ${row.label}`}><Trash2 size={10} /></button>
                </div>
              </td>

              {/* Data cells */}
              {stages.flatMap(stage => {
                const ss = steps.filter(s => s.stageId === stage.id).sort((a, b) => a.order - b.order);
                return [
                  ...ss.map((step, si) => {
                    const cell = getCell(step.id, row.id);
                    const cellCards = cell ? getCellCards(cell.id) : [];
                    const isEditing = editingCard?.cellId === cell?.id;
                    return (
                      <td key={`${step.id}-${row.id}`}
                        style={{
                          width: COL_W, height: ROW_H,
                          borderRight: si === ss.length - 1 ? '2px solid var(--border-strong)' : '1px solid var(--border)',
                          borderBottom: '1px solid var(--border)',
                          padding: 6, verticalAlign: 'top',
                          background: isEditing ? 'var(--primary-soft)' : 'var(--bg)',
                          transition: 'background 120ms',
                        }}>
                        {cell && (
                          <MatrixCell
                            cell={cell}
                            cards={cellCards}
                            rowType={row.type}
                            isEditing={isEditing}
                            cardText={isEditing ? cardText : ''}
                            processes={processes}
                            painPoints={painPoints}
                            touchpoints={touchpoints}
                            channels={channels}
                            selectedPersonaId={selectedPersonaId}
                            selectedCardId={selectedCardId}
                            onStartEdit={() => onStartEditCard(cell.id, row.type)}
                            onTextChange={onCardTextChange}
                            onSave={text => onSaveCard(cell.id, text, row.type)}
                            onCancel={onCancelEdit}
                            onAddSentiment={v => onAddSentiment(cell.id, v)}
                            onAddPainPoint={(t, s) => onAddPainPoint(cell.id, t, s)}
                            onSelectCard={onSelectCard}
                            onEditCard={onEditCard}
                            onMoveCard={onMoveCard}
                            onDeleteCard={onDeleteCard}
                          />
                        )}
                      </td>
                    );
                  }),
                  <td key={`add-${stage.id}-${row.id}`}
                    style={{
                      width: 36, borderRight: '2px solid var(--border-strong)',
                      borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)',
                    }} />,
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cell component ───

interface CellProps {
  cell: Cell;
  cards: JourneyCard[];
  rowType: RowType;
  isEditing: boolean;
  cardText: string;
  processes: ProcessDefinition[];
  painPoints: PainPoint[];
  touchpoints: Touchpoint[];
  channels: Channel[];
  selectedPersonaId: string | null;
  selectedCardId: string | null;
  onStartEdit: () => void;
  onTextChange: (t: string) => void;
  onSave: (text: string) => void;
  onCancel: () => void;
  onAddSentiment: (v: number | null) => void;
  onAddPainPoint: (title: string, severity: PainSeverity) => void;
  onSelectCard: (id: string | null) => void;
  onEditCard: (id: string) => void;
  onMoveCard: (id: string, direction: -1 | 1) => void;
  onDeleteCard: (id: string) => void;
}

function MatrixCell({
  cell: _cell, cards, rowType, isEditing, cardText, processes, painPoints,
  touchpoints, channels, selectedPersonaId,
  selectedCardId, onStartEdit, onTextChange, onSave, onCancel,
  onAddSentiment, onAddPainPoint, onSelectCard, onEditCard, onMoveCard, onDeleteCard,
}: CellProps) {
  const [showPainForm, setShowPainForm] = useState(false);
  const [painTitle, setPainTitle] = useState('');
  const [painSeverity, setPainSeverity] = useState<PainSeverity>('moderate');
  const [showSentimentPicker, setShowSentimentPicker] = useState(false);

  if (rowType === 'sentiment') {
    // AT-04: When a persona lens is active, show only that persona's observation.
    // No zero substitution: missing observations render as empty, not neutral.
    const sentCards = cards.filter(c => c.payload.kind === 'sentiment');
    const sentCard = selectedPersonaId
      ? sentCards.find(c => c.payload.kind === 'sentiment' && c.payload.personaId === selectedPersonaId)
      : sentCards[0];
    const val = sentCard?.payload.kind === 'sentiment' ? sentCard.payload.value : null;
    const hasOtherPersonas = selectedPersonaId && sentCards.some(
      c => c.payload.kind === 'sentiment' && c.payload.personaId !== selectedPersonaId
    );
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {showSentimentPicker ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {([-2, -1, 0, 1, 2] as const).map(v => (
              <button key={v}
                className="btn btn-ghost btn-sm"
                style={{
                  color: v > 0 ? 'var(--success)' : v < 0 ? 'var(--error)' : 'var(--text-muted)',
                  fontWeight: v === val ? 700 : 400,
                  padding: '0 4px',
                  background: v === val ? 'var(--bg-subtle)' : undefined,
                }}
                onClick={() => { onAddSentiment(v); setShowSentimentPicker(false); }}
                title={sentimentLabel(v)}
              >
                {sentimentIcon(v, 16)}
              </button>
            ))}
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowSentimentPicker(false)}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button
              className="btn btn-ghost"
              style={{ gap: 6, color: sentCard ? sentimentColor(val) : 'var(--text-subtle)', opacity: sentCard ? 1 : 0.4 }}
              onClick={() => setShowSentimentPicker(true)}
              title={sentCard ? 'Change sentiment' : 'Set sentiment'}
            >
              {sentimentIcon(val, 18)}
              <span style={{ fontSize: 12 }}>{sentCard ? sentimentLabel(val) : '—'}</span>
            </button>
            {hasOtherPersonas && (
              <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>+other personas</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // AT-15: Touchpoints row — show channel type with frontstage/backstage distinction.
  if (rowType === 'touchpoints') {
    const tpCards = cards.filter(c => c.payload.kind === 'touchpoint' || c.payload.kind === 'text');
    const frontstageTypes = new Set(['portal', 'email', 'chat', 'phone', 'mobile-app', 'in-person']);
    return (
      <div style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: 2 }}>
        {tpCards.map(card => {
          if (card.payload.kind === 'touchpoint') {
            const tp = touchpoints.find(t => t.id === (card.payload as { kind: 'touchpoint'; touchpointId: string }).touchpointId);
            const ch = tp ? channels.find(c => c.id === tp.channelId) : null;
            const isFront = ch ? frontstageTypes.has(ch.type) : true;
            return (
              <div key={card.id} style={{
                background: isFront ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                border: `1px solid ${isFront ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 4, padding: '2px 6px', fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: isFront ? 'var(--primary)' : 'var(--text-subtle)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {isFront ? 'Front' : 'Back'}
                </span>
                <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tp?.name ?? 'Touchpoint'}
                </span>
              </div>
            );
          }
          if (card.payload.kind === 'text') {
            return (
              <div key={card.id} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text)',
              }}>
                {(card.payload as { kind: 'text'; text: string }).text}
              </div>
            );
          }
          return null;
        })}
        {tpCards.length === 0 && (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', fontSize: 11 }}
            onClick={onStartEdit}>
            <Plus size={11} /> Add touchpoint
          </button>
        )}
        {tpCards.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', fontSize: 10 }}
            onClick={onStartEdit}>
            <Plus size={10} />
          </button>
        )}
      </div>
    );
  }

  if (rowType === 'pain-points') {
    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        {cards.map(card => card.payload.kind === 'pain-link' && (
          <PainChip key={card.id} painPointId={card.payload.painPointId} painPoints={painPoints} />
        ))}
        {showPainForm ? (
          <div style={{ padding: 4 }}>
            <input className="input input-sm" style={{ marginBottom: 4, fontSize: 11 }}
              placeholder="Pain point title…" value={painTitle}
              onChange={e => setPainTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onAddPainPoint(painTitle, painSeverity);
                  setPainTitle(''); setShowPainForm(false);
                }
                if (e.key === 'Escape') setShowPainForm(false);
              }}
              autoFocus
            />
            <select className="input input-sm" style={{ marginBottom: 4, fontSize: 11 }}
              value={painSeverity}
              onChange={e => setPainSeverity(e.target.value as PainSeverity)}>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="significant">Significant</option>
              <option value="critical">Critical</option>
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 10 }}
                onClick={() => { onAddPainPoint(painTitle, painSeverity); setPainTitle(''); setShowPainForm(false); }}
                disabled={!painTitle.trim()}>
                Add
              </button>
              <button className="btn btn-sm" style={{ fontSize: 10 }}
                onClick={() => setShowPainForm(false)}>✕</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', fontSize: 11, marginTop: 4 }}
            onClick={() => setShowPainForm(true)}>
            <Plus size={11} /> Add pain point
          </button>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%' }}>
        <textarea
          className="input"
          style={{ flex: 1, minHeight: 56, fontSize: 12, padding: '4px 6px', resize: 'none' }}
          value={cardText}
          onChange={e => onTextChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(cardText); }
            if (e.key === 'Escape') onCancel();
          }}
          autoFocus
          placeholder={rowTypePlaceholder(rowType)}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 11 }}
            onClick={() => onSave(cardText)}>Save</button>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={onCancel}>Esc</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', cursor: 'text' }}
      onClick={onStartEdit}
      role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onStartEdit(); }}
      aria-label={`Edit ${rowType} cell`}>
      {cards.length === 0 ? (
        <EmptyHint />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {cards.map(card => (
            <MatrixCardChip
              key={card.id} card={card} processes={processes} painPoints={painPoints}
              selected={card.id === selectedCardId}
              onSelect={() => onSelectCard(card.id)}
              onEdit={() => onEditCard(card.id)}
              onMove={direction => onMoveCard(card.id, direction)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyHint() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hovered ? 1 : 0, transition: 'opacity 120ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>+ add</span>
    </div>
  );
}

function MatrixCardChip({
  card, processes, painPoints, selected, onSelect, onEdit, onMove, onDelete,
}: {
  card: JourneyCard;
  processes: ProcessDefinition[];
  painPoints: PainPoint[];
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  let text: string = card.payload.kind;
  let icon: React.ReactNode = null;
  if (card.payload.kind === 'text') text = card.payload.text;
  if (card.payload.kind === 'process-link') {
    const pl = card.payload;
    text = processes.find(p => p.id === pl.processId)?.title ?? 'Process';
    icon = <Zap size={11} />;
  }
  if (card.payload.kind === 'pain-link') {
    const pl = card.payload;
    text = painPoints.find(p => p.id === pl.painPointId)?.title ?? 'Pain point';
    icon = <AlertCircle size={11} />;
  }
  if (card.payload.kind === 'sentiment') {
    text = sentimentLabel(card.payload.value);
    icon = sentimentIcon(card.payload.value, 12);
  }
  const statusColor = card.sourceStatus === 'evidence-backed' ? 'var(--success)'
    : card.sourceStatus === 'contested' ? 'var(--warning)' : 'var(--border-strong)';

  return (
    <div
      style={{
        background: selected ? 'var(--primary-soft)' : 'var(--bg-elevated)',
        border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 4, padding: '3px 6px', fontSize: 12, lineHeight: 1.4,
        color: 'var(--text)', cursor: 'pointer',
      }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{text}</div>
      {selected && (
        <div style={{ display: 'flex', gap: 2, marginTop: 3 }} onClick={event => event.stopPropagation()}>
          {card.payload.kind === 'text' && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit card"><Edit3 size={10} /></button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMove(-1)} title="Move card left"><ArrowLeft size={10} /></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMove(1)} title="Move card right"><ArrowRight size={10} /></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete card"><Trash2 size={10} /></button>
        </div>
      )}
    </div>
  );
}

function PainChip({ painPointId, painPoints }: { painPointId: string; painPoints: PainPoint[] }) {
  const pp = painPoints.find(p => p.id === painPointId);
  const severityColor: Record<PainSeverity, string> = {
    minor: 'var(--warning)', moderate: 'var(--accent)',
    significant: 'var(--error)', critical: 'var(--error)',
  };
  const sev = pp?.severity ?? 'moderate';
  return (
    <div style={{
      background: 'var(--error-soft)',
      border: `1px solid color-mix(in srgb, ${severityColor[sev]} 30%, transparent)`,
      borderLeft: `3px solid ${severityColor[sev]}`,
      borderRadius: 4, padding: '2px 6px', fontSize: 11,
      display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)',
    }}>
      <AlertCircle size={10} />
      {pp?.title ?? 'Pain point'}
    </div>
  );
}

// ─── Sentiment helpers ───

function sentimentColor(val: number | null): string {
  if (val === null) return 'var(--text-subtle)';
  if (val > 0) return 'var(--success)';
  if (val < 0) return 'var(--error)';
  return 'var(--text-muted)';
}

function sentimentIcon(val: number | null, size: number) {
  if (val === null || val === 0) return <Meh size={size} />;
  if (val === 1) return <Smile size={size} />;
  if (val === 2) return <Smile size={size} style={{ strokeWidth: 2.5 }} />;
  if (val === -1) return <Frown size={size} />;
  return <Frown size={size} style={{ strokeWidth: 2.5 }} />;
}

function sentimentLabel(val: number | null): string {
  switch (val) {
    case -2: return 'Very negative';
    case -1: return 'Negative';
    case 0: return 'Neutral';
    case 1: return 'Positive';
    case 2: return 'Very positive';
    default: return 'Unknown';
  }
}

// ─── Step title editor ───

function StepTitleEditor({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);
  if (editing) {
    return (
      <input className="input input-sm" style={{ width: '100%', fontSize: 12 }}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(val); setEditing(false); }
          if (e.key === 'Escape') { setVal(title); setEditing(false); }
        }}
        autoFocus
      />
    );
  }
  return (
    <button
      style={{
        fontSize: 12, fontWeight: 550, color: 'var(--text)',
        background: 'none', border: 'none', cursor: 'text',
        padding: '2px 4px', borderRadius: 4, width: '100%', textAlign: 'left',
        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
    >
      {title}
    </button>
  );
}

// ─── Row icon ───

function RowIcon({ type }: { type: RowType }) {
  switch (type) {
    case 'sentiment': return <Smile size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
    case 'pain-points': return <AlertCircle size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />;
    case 'processes': return <Zap size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />;
    case 'touchpoints': return <Info size={13} style={{ color: 'var(--recommendation)', flexShrink: 0 }} />;
    case 'customer-actions': return <User size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />;
    default: return <ChevronRight size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />;
  }
}

function rowTypePlaceholder(type: RowType): string {
  switch (type) {
    case 'customer-actions': return 'What is the user doing?';
    case 'thoughts-questions': return 'What is the user thinking or asking?';
    case 'sentiment': return 'How does the user feel?';
    case 'touchpoints': return 'Which interaction or channel?';
    case 'pain-points': return 'What goes wrong?';
    case 'processes': return 'Which process supports this? (name or link)';
    default: return 'Add a note…';
  }
}

// ─── Right panel: Journey properties ───

function JourneyProperties({
  journey, personas, onUpdate, onUpdatePersonas,
}: {
  journey: Journey;
  personas: Persona[];
  onUpdate: (key: keyof Journey, value: string) => void;
  onUpdatePersonas: (ids: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="field">
        <label className="field-label">Title</label>
        <input className="input input-sm" value={journey.title}
          onChange={e => onUpdate('title', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Goal</label>
        <input className="input input-sm" placeholder="What is the persona trying to achieve?"
          value={journey.goal} onChange={e => onUpdate('goal', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Personas</label>
        {personas.length === 0 ? (
          <div className="field-hint">Create personas in the Dictionary first.</div>
        ) : personas.map(persona => (
          <label key={persona.id} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12, marginBottom: 5 }}>
            <input type="checkbox" checked={journey.personaIds.includes(persona.id)} onChange={event => {
              const next = event.target.checked
                ? [...journey.personaIds, persona.id]
                : journey.personaIds.filter(id => id !== persona.id);
              onUpdatePersonas(next);
            }} />
            {persona.name}
          </label>
        ))}
      </div>
      <div className="field">
        <label className="field-label">Perspective</label>
        <select className="input input-sm" value={journey.perspective}
          onChange={e => onUpdate('perspective', e.target.value)}>
          {['customer', 'employee', 'developer', 'supplier', 'partner'].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label">State</label>
        <select className="input input-sm" value={journey.state}
          onChange={e => onUpdate('state', e.target.value)}>
          <option value="as-is">AS-IS (current)</option>
          <option value="to-be">TO-BE (proposed)</option>
        </select>
      </div>
      <div className="field">
        <label className="field-label">Situation / context</label>
        <textarea className="input" style={{ fontSize: 12, minHeight: 60 }}
          placeholder="Describe the situation and scope…"
          value={journey.situation}
          onChange={e => onUpdate('situation', e.target.value)} />
      </div>
    </div>
  );
}

// ─── Right panel: Pain points ───

function PainPointsPanel({
  painPoints, steps, projectId, onAdd, onUpdate,
}: {
  painPoints: PainPoint[];
  steps: JourneyStep[];
  projectId: string;
  onAdd: (pp: PainPoint) => void;
  onUpdate: (pp: PainPoint) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<PainSeverity>('moderate');

  async function create() {
    if (!title.trim()) return;
    const pp: PainPoint = {
      id: newId('pain'), projectId, title: title.trim(), description: '',
      affectedPersonaIds: [], affectedStepIds: [], affectedProcessIds: [],
      severity, scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      state: 'open', symptom: title.trim(),
      hypothesizedCause: '', validatedCause: '', proposedIntervention: '',
    };
    await db.painPoints.add(pp);
    onAdd(pp);
    setTitle('');
    setCreating(false);
  }

  const severityColors: Record<PainSeverity, string> = {
    minor: 'badge-info', moderate: 'badge-warning',
    significant: 'badge-error', critical: 'badge-error',
  };

  return (
    <div>
      {creating ? (
        <div style={{ marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Title</label>
            <input className="input input-sm" placeholder="Describe the problem…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false); }}
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Severity</label>
            <select className="input input-sm" value={severity}
              onChange={e => setSeverity(e.target.value as PainSeverity)}>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="significant">Significant</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={create} disabled={!title.trim()}>Add</button>
            <button className="btn btn-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-sm btn-ghost" onClick={() => setCreating(true)} style={{ marginBottom: 12, width: '100%' }}>
          <Plus size={13} /> Add pain point
        </button>
      )}

      {painPoints.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', padding: '12px 0' }}>
          No pain points recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {painPoints.map(pp => (
            <PainPointCard key={pp.id} pp={pp} steps={steps} onUpdate={onUpdate} severityClass={severityColors[pp.severity]} />
          ))}
        </div>
      )}
    </div>
  );
}

function PainPointCard({
  pp, steps, onUpdate, severityClass,
}: {
  pp: PainPoint;
  steps: JourneyStep[];
  onUpdate: (pp: PainPoint) => void;
  severityClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const affectedStepTitles = pp.affectedStepIds
    .map(sid => steps.find(s => s.id === sid)?.title)
    .filter(Boolean);

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 6, overflow: 'hidden',
    }}>
      <div
        style={{
          padding: '8px 10px', display: 'flex', alignItems: 'flex-start',
          gap: 8, cursor: 'pointer', background: 'var(--bg-elevated)',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <AlertCircle size={13} style={{ color: 'var(--error)', marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 550, lineHeight: 1.3 }}>{pp.title}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            <span className={`badge ${severityClass}`} style={{ fontSize: 10 }}>{pp.severity}</span>
            <span className="badge badge-info" style={{ fontSize: 10 }}>{pp.state}</span>
          </div>
        </div>
        <Edit3 size={12} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Symptom (what is experienced)</label>
            <textarea className="input" style={{ fontSize: 11, minHeight: 48 }}
              value={pp.symptom}
              onChange={e => onUpdate({ ...pp, symptom: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Hypothesized cause</label>
            <textarea className="input" style={{ fontSize: 11, minHeight: 48 }}
              placeholder="What might be causing this?"
              value={pp.hypothesizedCause}
              onChange={e => onUpdate({ ...pp, hypothesizedCause: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label">Source status</label>
            <select className="input input-sm"
              value={pp.state}
              onChange={e => onUpdate({ ...pp, state: e.target.value as PainPoint['state'] })}>
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont-fix">Won't fix</option>
            </select>
          </div>
          {affectedStepTitles.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-subtle)' }}>
              Affects: {affectedStepTitles.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Right panel: Evidence ───

import type { EvidenceRecord, EvidenceType } from '../../domain/contracts/types';

function EvidencePanel({ projectId }: { projectId: string }) {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EvidenceType>('interview');
  const [content, setContent] = useState('');

  useEffect(() => {
    db.evidence.where('projectId').equals(projectId).toArray().then(setEvidence);
  }, [projectId]);

  async function create() {
    if (!title.trim()) return;
    const rec: EvidenceRecord = {
      id: newId('ev'), projectId, type,
      title: title.trim(), content, sourceRole: '',
      context: '', excerpt: '', confidence: 'medium', synthetic: false,
    };
    await db.evidence.add(rec);
    setEvidence(prev => [...prev, rec]);
    setTitle(''); setContent(''); setCreating(false);
  }

  const typeColors: Record<EvidenceType, string> = {
    interview: 'badge-primary', observation: 'badge-info', document: 'badge-info',
    survey: 'badge-accent', workshop: 'badge-primary', assumption: 'badge-warning',
  };

  return (
    <div>
      {creating ? (
        <div style={{ marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Title</label>
            <input className="input input-sm" placeholder="Evidence title…"
              value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Type</label>
            <select className="input input-sm" value={type}
              onChange={e => setType(e.target.value as EvidenceType)}>
              <option value="interview">Interview</option>
              <option value="observation">Observation</option>
              <option value="document">Document</option>
              <option value="survey">Survey</option>
              <option value="workshop">Workshop</option>
              <option value="assumption">Assumption</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label className="field-label">Content / excerpt</label>
            <textarea className="input" style={{ fontSize: 11, minHeight: 60 }}
              placeholder="Paste excerpt or describe the evidence…"
              value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={create} disabled={!title.trim()}>Add</button>
            <button className="btn btn-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-sm btn-ghost" onClick={() => setCreating(true)} style={{ marginBottom: 12, width: '100%' }}>
          <Plus size={13} /> Add evidence
        </button>
      )}

      {evidence.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', padding: '12px 0' }}>
          No evidence records yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {evidence.map(ev => (
            <div key={ev.id} style={{
              border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                <span className={`badge ${typeColors[ev.type]}`} style={{ fontSize: 10, flexShrink: 0 }}>
                  {ev.type}
                </span>
                <span style={{ fontSize: 12, fontWeight: 550, lineHeight: 1.3 }}>{ev.title}</span>
              </div>
              {ev.content && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {ev.content.length > 100 ? ev.content.slice(0, 100) + '…' : ev.content}
                </div>
              )}
              {ev.synthetic && (
                <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 4 }}>
                  Synthetic teaching data
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scenario challenges panel ────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  beginner:     'var(--success)',
  intermediate: 'var(--info)',
  advanced:     'var(--warning)',
  capstone:     'var(--accent)',
};

function ScenarioChallengesPanel({ projectTitle }: { projectTitle: string }) {
  const scenarioId = SCENARIO_PREFIXES.find(p => projectTitle.startsWith(p));
  const challenges = scenarioId ? getChallengesForScenario(scenarioId) : [];

  if (!scenarioId || challenges.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
        No challenges found for this project.
        Load a scenario pack from the home screen to unlock challenges.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        Challenges for <strong>{scenarioId}</strong>
      </div>
      {challenges.map(ch => {
        const lc = LEVEL_COLORS[ch.level] ?? 'var(--text-muted)';
        return (
          <div key={ch.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{ch.id}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                background: `color-mix(in srgb, ${lc} 12%, transparent)`, color: lc,
                textTransform: 'capitalize',
              }}>{ch.level}</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} /> {ch.estimatedTime}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{ch.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{ch.task}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target size={11} /> Workspace: <strong>{ch.workspaceHint}</strong>
            </div>
            {ch.hints.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer' }}>Hints ({ch.hints.length})</summary>
                <ol style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {ch.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ol>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
