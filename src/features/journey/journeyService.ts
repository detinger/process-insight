import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type { Cell, Journey, JourneyCard, JourneyRow, JourneyStage, JourneyStep } from '../../domain/contracts/types';

export interface JourneySnapshot {
  journey: Journey;
  stages: JourneyStage[];
  steps: JourneyStep[];
  rows: JourneyRow[];
  cells: Cell[];
  cards: JourneyCard[];
}

export async function readJourneySnapshot(projectId: string, journeyId: string): Promise<JourneySnapshot> {
  const journey = await db.journeys.get(journeyId);
  if (!journey || journey.projectId !== projectId) throw new Error('Journey not found in this project');
  const [stages, steps, rows, cells] = await Promise.all([
    db.stages.where('journeyId').equals(journeyId).and(row => row.projectId === projectId).toArray(),
    db.steps.where('journeyId').equals(journeyId).and(row => row.projectId === projectId).toArray(),
    db.rows.where('journeyId').equals(journeyId).and(row => row.projectId === projectId).toArray(),
    db.cells.where('journeyId').equals(journeyId).and(row => row.projectId === projectId).toArray(),
  ]);
  const cellIds = cells.map(row => row.id);
  const cards = cellIds.length
    ? await db.cards.where('cellId').anyOf(cellIds).and(row => row.projectId === projectId).toArray()
    : [];
  return { journey, stages, steps, rows, cells, cards };
}

/** Replace one journey atomically. Used by undo/redo and recovery. */
export async function restoreJourneySnapshot(snapshot: JourneySnapshot): Promise<void> {
  const { journey, stages, steps, rows, cells, cards } = snapshot;
  await db.transaction('rw', [db.journeys, db.stages, db.steps, db.rows, db.cells, db.cards], async () => {
    const currentCells = await db.cells.where('journeyId').equals(journey.id).toArray();
    const currentCellIds = currentCells.map(row => row.id);
    if (currentCellIds.length) await db.cards.where('cellId').anyOf(currentCellIds).delete();
    await db.cells.where('journeyId').equals(journey.id).delete();
    await db.steps.where('journeyId').equals(journey.id).delete();
    await db.stages.where('journeyId').equals(journey.id).delete();
    await db.rows.where('journeyId').equals(journey.id).delete();
    await db.journeys.put(journey);
    if (stages.length) await db.stages.bulkPut(stages);
    if (steps.length) await db.steps.bulkPut(steps);
    if (rows.length) await db.rows.bulkPut(rows);
    if (cells.length) await db.cells.bulkPut(cells);
    if (cards.length) await db.cards.bulkPut(cards);
  });
}

function mapped(map: Map<string, string>, id: string): string {
  return map.get(id) ?? id;
}

/** Create an independent TO-BE copy while retaining links to project dictionary/evidence records. */
export async function duplicateJourneyAsToBe(projectId: string, journeyId: string): Promise<Journey> {
  const source = await readJourneySnapshot(projectId, journeyId);
  const idMap = new Map<string, string>();
  idMap.set(source.journey.id, newId('journey'));
  [...source.stages, ...source.steps, ...source.rows, ...source.cells, ...source.cards]
    .forEach(record => idMap.set(record.id, newId(record.id.split('_')[0] || 'copy')));
  const now = new Date().toISOString();
  const journey: Journey = {
    ...source.journey,
    id: mapped(idMap, source.journey.id),
    title: source.journey.title + ' — TO-BE',
    state: 'to-be',
    stageOrder: source.journey.stageOrder.map(id => mapped(idMap, id)),
    rowOrder: source.journey.rowOrder.map(id => mapped(idMap, id)),
    createdAt: now,
    updatedAt: now,
  };
  const stages = source.stages.map(row => ({
    ...row, id: mapped(idMap, row.id), journeyId: journey.id,
  }));
  const steps = source.steps.map(row => ({
    ...row, id: mapped(idMap, row.id), journeyId: journey.id, stageId: mapped(idMap, row.stageId),
  }));
  const rows = source.rows.map(row => ({
    ...row, id: mapped(idMap, row.id), journeyId: journey.id,
  }));
  const cells = source.cells.map(row => ({
    ...row,
    id: mapped(idMap, row.id),
    journeyId: journey.id,
    stepId: mapped(idMap, row.stepId),
    rowId: mapped(idMap, row.rowId),
    cardOrder: row.cardOrder.map(id => mapped(idMap, id)),
  }));
  const cards = source.cards.map(row => ({
    ...row, id: mapped(idMap, row.id), cellId: mapped(idMap, row.cellId),
  }));
  await db.transaction('rw', [db.journeys, db.stages, db.steps, db.rows, db.cells, db.cards], async () => {
    await db.journeys.add(journey);
    if (stages.length) await db.stages.bulkAdd(stages);
    if (steps.length) await db.steps.bulkAdd(steps);
    if (rows.length) await db.rows.bulkAdd(rows);
    if (cells.length) await db.cells.bulkAdd(cells);
    if (cards.length) await db.cards.bulkAdd(cards);
  });
  return journey;
}
