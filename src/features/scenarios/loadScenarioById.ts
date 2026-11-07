import { db } from '../../storage/db';
import { deleteProject } from '../../storage/projectLifecycle';
import { buildIT02Scenario } from './it02SaasOnboarding';
import { buildIT03Scenario } from './it03ServiceDesk';
import { buildIT04Scenario } from './it04CloudResources';
import { buildIT05Scenario } from './it05EmployeeAccess';
import { buildIT06Scenario } from './it06MajorIncident';
import { buildIT07Scenario } from './it07SoftwareRelease';
import { buildIT08Scenario } from './it08ApiIntegration';
import { buildIT09Scenario } from './it09SaasRenewal';
import { buildIT10Scenario } from './it10ITProcurement';
import { buildIT11Scenario } from './it11CloudMigration';
import { buildIT12Scenario } from './it12ManagedServiceOnboarding';
import type { ScenarioBundle } from './it02SaasOnboarding';

const BUILDERS: Record<string, () => ScenarioBundle> = {
  'IT-02': buildIT02Scenario,
  'IT-03': buildIT03Scenario,
  'IT-04': buildIT04Scenario,
  'IT-05': buildIT05Scenario,
  'IT-06': buildIT06Scenario,
  'IT-07': buildIT07Scenario,
  'IT-08': buildIT08Scenario,
  'IT-09': buildIT09Scenario,
  'IT-10': buildIT10Scenario,
  'IT-11': buildIT11Scenario,
  'IT-12': buildIT12Scenario,
};

/**
 * Returns the project ID for a scenario, loading it into the DB if not yet present.
 * Returns null if the scenarioId is not recognised.
 */
export async function loadScenarioById(scenarioId: string): Promise<string | null> {
  const builder = BUILDERS[scenarioId];
  if (!builder) return null;

  const s = builder();
  const existing = await db.projects.where('title').startsWith(scenarioId).first();
  if (existing) {
    if (existing.schemaVersion >= s.manifest.schemaVersion) return existing.id;
    await deleteProject(existing.id);
  }

  await db.transaction('rw',
    [db.projects, db.candidates, db.processes, db.relations, db.personas, db.systems,
     db.channels, db.touchpoints, db.journeys, db.stages, db.steps,
     db.rows, db.cells, db.cards, db.painPoints,
     db.interviews, db.interviewItems, db.observations, db.stormingCards, db.contradictions,
     db.services, db.capabilities, db.processRatings,
     db.sipocDiagrams, db.sipocRows, db.processMaps, db.mapLanes, db.mapActivities, db.mapEdges],
    async () => {
      await db.projects.add(s.manifest);
      if (s.candidates.length) await db.candidates.bulkAdd(s.candidates);
      if (s.processes.length) await db.processes.bulkAdd(s.processes);
      if (s.relations?.length) await db.relations.bulkAdd(s.relations);
      if (s.personas.length) await db.personas.bulkAdd(s.personas);
      if (s.systems.length) await db.systems.bulkAdd(s.systems);
      if (s.channels.length) await db.channels.bulkAdd(s.channels);
      if (s.touchpoints.length) await db.touchpoints.bulkAdd(s.touchpoints);
      if (s.journeys.length) await db.journeys.bulkAdd(s.journeys);
      if (s.stages.length) await db.stages.bulkAdd(s.stages);
      if (s.steps.length) await db.steps.bulkAdd(s.steps);
      if (s.rows.length) await db.rows.bulkAdd(s.rows);
      if (s.cells.length) await db.cells.bulkAdd(s.cells);
      if (s.cards.length) await db.cards.bulkAdd(s.cards);
      if (s.painPoints.length) await db.painPoints.bulkAdd(s.painPoints);
      if (s.interviews?.length) await db.interviews.bulkAdd(s.interviews);
      if (s.interviewItems?.length) await db.interviewItems.bulkAdd(s.interviewItems);
      if (s.observations?.length) await db.observations.bulkAdd(s.observations);
      if (s.stormingCards?.length) await db.stormingCards.bulkAdd(s.stormingCards);
      if (s.contradictions?.length) await db.contradictions.bulkAdd(s.contradictions);
      if (s.services?.length) await db.services.bulkAdd(s.services);
      if (s.capabilities?.length) await db.capabilities.bulkAdd(s.capabilities);
      if (s.processRatings?.length) await db.processRatings.bulkAdd(s.processRatings);
      if (s.sipocDiagrams?.length) await db.sipocDiagrams.bulkAdd(s.sipocDiagrams);
      if (s.sipocRows?.length) await db.sipocRows.bulkAdd(s.sipocRows);
      if (s.processMaps?.length) await db.processMaps.bulkAdd(s.processMaps);
      if (s.mapLanes?.length) await db.mapLanes.bulkAdd(s.mapLanes);
      if (s.mapActivities?.length) await db.mapActivities.bulkAdd(s.mapActivities);
      if (s.mapEdges?.length) await db.mapEdges.bulkAdd(s.mapEdges);
    }
  );
  return s.manifest.id;
}
