import Dexie, { type EntityTable } from 'dexie';
import type {
  ProjectManifest, Revision,
  ProcessDefinition, ProcessCandidate, LandscapeRelation,
  Persona, OrganizationUnit, Service, Capability, Channel, Touchpoint, ITSystem,
  Journey, JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  PainPoint, EvidenceRecord, EvidenceLink,
  KpiDefinition, KpiObservation, BpmnDerivation, BpmnExport, LearningProgress,
  DiscoveryInterview, DiscoveryInterviewItem, DiscoveryObservation, StormingCard, Contradiction,
  ProcessMap, MapLane, MapActivity, ProcessMapEdge, SipocDiagram, SipocRow,
} from '../domain/contracts/types';
import type { ProcessRating } from '../domain/scoring';

let writesAllowed = true;

export class StorageWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageWriteError';
  }
}

export function setDatabaseWriteAccess(allowed: boolean): void {
  writesAllowed = allowed;
}

function guardWrite(): void {
  if (writesAllowed) return;
  const error = new StorageWriteError('This tab is read-only because another tab owns editing. Take ownership before making changes.');
  window.dispatchEvent(new CustomEvent('pjs-storage-error', { detail: error }));
  throw error;
}

export class AppDB extends Dexie {
  projects!: EntityTable<ProjectManifest, 'id'>;
  revisions!: EntityTable<Revision, 'id'>;
  processes!: EntityTable<ProcessDefinition, 'id'>;
  candidates!: EntityTable<ProcessCandidate, 'id'>;
  relations!: EntityTable<LandscapeRelation, 'id'>;
  personas!: EntityTable<Persona, 'id'>;
  units!: EntityTable<OrganizationUnit, 'id'>;
  services!: EntityTable<Service, 'id'>;
  capabilities!: EntityTable<Capability, 'id'>;
  channels!: EntityTable<Channel, 'id'>;
  touchpoints!: EntityTable<Touchpoint, 'id'>;
  systems!: EntityTable<ITSystem, 'id'>;
  journeys!: EntityTable<Journey, 'id'>;
  stages!: EntityTable<JourneyStage, 'id'>;
  steps!: EntityTable<JourneyStep, 'id'>;
  rows!: EntityTable<JourneyRow, 'id'>;
  cells!: EntityTable<Cell, 'id'>;
  cards!: EntityTable<JourneyCard, 'id'>;
  painPoints!: EntityTable<PainPoint, 'id'>;
  evidence!: EntityTable<EvidenceRecord, 'id'>;
  evidenceLinks!: EntityTable<EvidenceLink, 'id'>;
  kpiDefinitions!: EntityTable<KpiDefinition, 'id'>;
  kpiObservations!: EntityTable<KpiObservation, 'id'>;
  derivations!: EntityTable<BpmnDerivation, 'id'>;
  processRatings!: EntityTable<ProcessRating, 'id'>;
  bpmnExports!: EntityTable<BpmnExport, 'id'>;
  learningProgress!: EntityTable<LearningProgress, 'id'>;
  interviews!: EntityTable<DiscoveryInterview, 'id'>;
  interviewItems!: EntityTable<DiscoveryInterviewItem, 'id'>;
  observations!: EntityTable<DiscoveryObservation, 'id'>;
  stormingCards!: EntityTable<StormingCard, 'id'>;
  contradictions!: EntityTable<Contradiction, 'id'>;
  processMaps!: EntityTable<ProcessMap, 'id'>;
  mapLanes!: EntityTable<MapLane, 'id'>;
  mapActivities!: EntityTable<MapActivity, 'id'>;
  mapEdges!: EntityTable<ProcessMapEdge, 'id'>;
  sipocDiagrams!: EntityTable<SipocDiagram, 'id'>;
  sipocRows!: EntityTable<SipocRow, 'id'>;

  constructor() {
    super('ProcessJourneyStudio');
    this.version(1).stores({
      projects:        '&id, title, updatedAt',
      revisions:       '&id, projectId',
      processes:       '&id, parentId, status',
      candidates:      '&id, status',
      relations:       '&id, fromId, toId, type',
      personas:        '&id',
      units:           '&id',
      services:        '&id',
      capabilities:    '&id',
      channels:        '&id',
      touchpoints:     '&id, channelId',
      systems:         '&id',
      journeys:        '&id, state',
      stages:          '&id, journeyId',
      steps:           '&id, journeyId, stageId',
      rows:            '&id, journeyId',
      cells:           '&id, journeyId, stepId, rowId',
      cards:           '&id, cellId',
      painPoints:      '&id, projectId, state',
      evidence:        '&id, projectId, type',
      evidenceLinks:   '&id, evidenceId',
      kpiDefinitions:  '&id, projectId',
      kpiObservations: '&id, definitionId',
      derivations:     '&id, sourceJourneyId, status',
    });
    this.version(2).stores({
      processRatings: '&id, processId, configId',
    });
    this.version(3).stores({
      bpmnExports: '&id, projectId, journeyId, status',
    });
    this.version(4).stores({
      projects:        '&id, title, updatedAt',
      revisions:       '&id, projectId',
      processes:       '&id, projectId, parentId, status',
      candidates:      '&id, projectId, status',
      relations:       '&id, projectId, fromId, toId, type',
      personas:        '&id, projectId',
      units:           '&id, projectId',
      services:        '&id, projectId',
      capabilities:    '&id, projectId',
      channels:        '&id, projectId',
      touchpoints:     '&id, projectId, channelId',
      systems:         '&id, projectId',
      journeys:        '&id, projectId, state',
      stages:          '&id, projectId, journeyId',
      steps:           '&id, projectId, journeyId, stageId',
      rows:            '&id, projectId, journeyId',
      cells:           '&id, projectId, journeyId, stepId, rowId',
      cards:           '&id, projectId, cellId',
      painPoints:      '&id, projectId, state',
      evidence:        '&id, projectId, type',
      evidenceLinks:   '&id, projectId, evidenceId',
      kpiDefinitions:  '&id, projectId',
      kpiObservations: '&id, projectId, definitionId',
      derivations:     '&id, projectId, sourceJourneyId, status',
      processRatings:  '&id, projectId, processId, configId, [projectId+configId]',
      bpmnExports:     '&id, projectId, journeyId, status',
    }).upgrade(async tx => {
      const ownedTables = [
        'revisions', 'processes', 'candidates', 'relations',
        'personas', 'units', 'services', 'capabilities', 'channels', 'touchpoints', 'systems',
        'journeys', 'stages', 'steps', 'rows', 'cells', 'cards',
        'painPoints', 'evidence', 'evidenceLinks', 'kpiDefinitions', 'kpiObservations',
        'derivations', 'processRatings', 'bpmnExports',
      ];
      const projects = await tx.table('projects').toArray();
      const hasData = (await Promise.all(ownedTables.map(name => tx.table(name).count())))
        .some(count => count > 0);
      if (!hasData) return;

      let fallbackProjectId: string;
      if (projects.length === 1) {
        fallbackProjectId = projects[0].id;
      } else {
        fallbackProjectId = 'proj_legacy_recovered';
        const existing = await tx.table('projects').get(fallbackProjectId);
        if (!existing) {
          const now = new Date().toISOString();
          await tx.table('projects').add({
            id: fallbackProjectId,
            title: 'Recovered legacy data',
            description: projects.length > 1
              ? 'Records from the pre-project-isolation database. Review and move needed content into a new project.'
              : 'Records recovered from the pre-project-isolation database.',
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
          });
        }
      }

      for (const tableName of ownedTables) {
        await tx.table(tableName).toCollection().modify((record: { projectId?: string }) => {
          if (!record.projectId) record.projectId = fallbackProjectId;
        });
      }
    });
    this.version(5).stores({
      learningProgress: '&id, projectId, challengeId, status, [projectId+challengeId]',
    });
    this.version(6).stores({
      interviews:      '&id, projectId',
      interviewItems:  '&id, projectId, interviewId',
      observations:    '&id, projectId',
      stormingCards:   '&id, projectId',
      contradictions:  '&id, projectId',
    });
    this.version(7).stores({
      processMaps:   '&id, projectId',
      mapLanes:      '&id, projectId, mapId',
      mapActivities: '&id, projectId, mapId, laneId',
      mapEdges:      '&id, projectId, mapId',
      sipocDiagrams: '&id, projectId',
      sipocRows:     '&id, projectId, diagramId',
    });

    // Enforce tab ownership at the database boundary. UI styling alone is not
    // sufficient: every create, update and delete path passes through here.
    for (const table of this.tables) {
      table.hook('creating', () => guardWrite());
      table.hook('updating', () => guardWrite());
      table.hook('deleting', () => guardWrite());
    }
  }
}

export const db = new AppDB();
