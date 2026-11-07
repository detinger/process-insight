import { db } from './db';

const OWNED_TABLES = [
  db.revisions, db.processes, db.candidates, db.relations,
  db.personas, db.units, db.services, db.capabilities, db.channels, db.touchpoints, db.systems,
  db.journeys, db.stages, db.steps, db.rows, db.cells, db.cards,
  db.painPoints, db.evidence, db.evidenceLinks, db.kpiDefinitions, db.kpiObservations,
  db.derivations, db.processRatings, db.bpmnExports, db.learningProgress,
  db.interviews, db.interviewItems, db.observations, db.stormingCards, db.contradictions,
  db.processMaps, db.mapLanes, db.mapActivities, db.mapEdges, db.sipocDiagrams, db.sipocRows,
] as const;

/** Delete one project and only records owned by it, atomically. */
export async function deleteProject(projectId: string): Promise<void> {
  await db.transaction('rw', [db.projects, ...OWNED_TABLES], async () => {
    for (const table of OWNED_TABLES) {
      await table.where('projectId').equals(projectId).delete();
    }
    await db.projects.delete(projectId);
  });
}

/** Return local application storage to the same state as a first launch. */
export async function clearApplicationData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}
