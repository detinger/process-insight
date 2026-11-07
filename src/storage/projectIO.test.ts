import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  collectProjectData,
  commitProjectImport,
  prepareProjectImportFile,
  type PreparedProjectImport,
} from './projectIO';
import type { ProcessDefinition, ProjectData, ProjectManifest } from '../domain/contracts/types';

function projectData(projectId = 'proj_source'): ProjectData {
  const manifest: ProjectManifest = {
    id: projectId,
    title: 'Safety fixture',
    description: 'Import/export test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
  };
  const process: ProcessDefinition = {
    id: 'proc_source', projectId, title: 'Handle request', purpose: 'Test',
    levelLabel: 'L2', trigger: 'Request received', outcome: 'Request handled',
    inScope: [], outOfScope: [], evidenceIds: [], status: 'draft',
    serviceIds: [], capabilityIds: [], systemIds: [],
  };
  return {
    manifest,
    revisions: [],
    processes: [process],
    candidates: [],
    relations: [],
    personas: [],
    units: [],
    services: [],
    capabilities: [],
    channels: [],
    touchpoints: [],
    systems: [],
    journeys: [{
      id: 'journey_source', projectId, title: 'Request journey', goal: 'Finish', situation: 'Testing',
      perspective: 'customer', state: 'as-is', personaIds: [], stageOrder: ['stage_source'],
      rowOrder: ['row_source'], createdAt: manifest.createdAt, updatedAt: manifest.updatedAt,
    }],
    stages: [{ id: 'stage_source', projectId, journeyId: 'journey_source', title: 'Start', description: '', order: 0 }],
    steps: [{ id: 'step_source', projectId, journeyId: 'journey_source', stageId: 'stage_source', title: 'Ask', order: 0 }],
    rows: [{ id: 'row_source', projectId, journeyId: 'journey_source', type: 'processes', label: 'Processes', order: 0 }],
    cells: [{ id: 'cell_source', projectId, journeyId: 'journey_source', stepId: 'step_source', rowId: 'row_source', cardOrder: ['card_source'] }],
    cards: [{
      id: 'card_source', projectId, cellId: 'cell_source',
      payload: { kind: 'process-link', processId: 'proc_source' },
      sourceStatus: 'evidence-backed', evidenceIds: [], note: '',
    }],
    painPoints: [],
    evidence: [],
    evidenceLinks: [],
    kpiDefinitions: [],
    kpiObservations: [],
    derivations: [],
    processRatings: [{
      id: 'proc_source__default', projectId, processId: 'proc_source', configId: 'default',
      ratings: { strategic_impact: 4 },
    }],
    bpmnExports: [{
      id: 'export_source', projectId, journeyId: 'journey_source', processName: 'Handle request',
      participantName: 'Provider', exportedAt: manifest.updatedAt, status: 'draft', mappingCount: 1,
      exclusionCount: 0, unresolvedCount: 0, converterVersion: '1', filename: 'request.bpmn',
    }],
    learningProgress: [{
      id: 'progress_source', projectId, challengeId: 'CH-01', status: 'in-progress', attempts: 2,
      usedHintIndexes: [0], reflection: 'A thought', criterionResults: { naming: 'needs-review' },
      updatedAt: manifest.updatedAt,
    }],
  };
}

async function seed(data: ProjectData) {
  await db.transaction('rw', [
    db.projects, db.processes, db.journeys, db.stages, db.steps, db.rows, db.cells, db.cards,
    db.processRatings, db.bpmnExports, db.learningProgress,
  ], async () => {
    await db.projects.add(data.manifest);
    await db.processes.bulkAdd(data.processes);
    await db.journeys.bulkAdd(data.journeys);
    await db.stages.bulkAdd(data.stages);
    await db.steps.bulkAdd(data.steps);
    await db.rows.bulkAdd(data.rows);
    await db.cells.bulkAdd(data.cells);
    await db.cards.bulkAdd(data.cards);
    await db.processRatings.bulkAdd(data.processRatings);
    await db.bpmnExports.bulkAdd(data.bpmnExports);
    await db.learningProgress.bulkAdd(data.learningProgress);
  });
}

function fileFor(data: ProjectData): File {
  return new File([JSON.stringify(data)], 'fixture.pjs.json', { type: 'application/json' });
}

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

describe('native project import/export', () => {
  it('exports only the selected project, including scoring, BPMN history and learning progress', async () => {
    const first = projectData('proj_a');
    const second = projectData('proj_b');
    // Primary keys are database-wide inside each table.
    for (const key of Object.keys(second) as (keyof ProjectData)[]) {
      if (key === 'manifest') continue;
      for (const record of second[key] as { id: string }[]) record.id = `b_${record.id}`;
    }
    await seed(first);
    await seed(second);

    const exported = await collectProjectData('proj_a');
    expect(exported.processes).toHaveLength(1);
    expect(exported.processRatings).toHaveLength(1);
    expect(exported.bpmnExports).toHaveLength(1);
    expect(exported.learningProgress).toHaveLength(1);
    for (const key of Object.keys(exported) as (keyof ProjectData)[]) {
      if (key === 'manifest') continue;
      expect((exported[key] as { projectId: string }[]).every(row => row.projectId === 'proj_a')).toBe(true);
    }
  });

  it('previews without writing and remaps all internal IDs and references', async () => {
    const source = projectData();
    const preview = await prepareProjectImportFile(fileFor(source));
    expect(preview.valid).toBe(true);
    expect(await db.projects.count()).toBe(0);

    const imported = preview.prepared!.data;
    expect(imported.manifest.id).not.toBe(source.manifest.id);
    expect(imported.processes[0].id).not.toBe(source.processes[0].id);
    expect(imported.cards[0].payload).toEqual({ kind: 'process-link', processId: imported.processes[0].id });
    expect(imported.steps[0].stageId).toBe(imported.stages[0].id);
    expect(imported.cells[0].cardOrder).toEqual([imported.cards[0].id]);
    expect(imported.processRatings[0].id).toBe(`${imported.processes[0].id}__default`);
    expect(imported.learningProgress[0].challengeId).toBe('CH-01');
  });

  it('imports the same file twice as independent projects', async () => {
    const file = fileFor(projectData());
    const first = await prepareProjectImportFile(file);
    const second = await prepareProjectImportFile(file);
    const firstResult = await commitProjectImport(first.prepared!);
    const secondResult = await commitProjectImport(second.prepared!);

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    expect(firstResult.projectId).not.toBe(secondResult.projectId);
    expect(await db.projects.count()).toBe(2);
    expect(await db.processes.where('projectId').equals(firstResult.projectId!).count()).toBe(1);
    expect(await db.processes.where('projectId').equals(secondResult.projectId!).count()).toBe(1);
  });

  it('restores the same project content after export, database clear and import', async () => {
    const source = projectData();
    await seed(source);
    const exported = await collectProjectData(source.manifest.id);
    const expectedCounts = Object.fromEntries(
      Object.entries(exported)
        .filter(([key]) => key !== 'manifest')
        .map(([key, rows]) => [key, (rows as unknown[]).length]),
    );

    db.close();
    await db.delete();
    await db.open();
    const preview = await prepareProjectImportFile(fileFor(exported));
    const result = await commitProjectImport(preview.prepared!);
    const restored = await collectProjectData(result.projectId!);
    const restoredCounts = Object.fromEntries(
      Object.entries(restored)
        .filter(([key]) => key !== 'manifest')
        .map(([key, rows]) => [key, (rows as unknown[]).length]),
    );

    expect(result.ok).toBe(true);
    expect(restoredCounts).toEqual(expectedCounts);
    expect(restored.processes[0].title).toBe(source.processes[0].title);
    expect(restored.cards[0].payload).toEqual({ kind: 'process-link', processId: restored.processes[0].id });
  });

  it('rejects malformed structure before writing', async () => {
    const malformed = projectData();
    delete (malformed.steps[0] as Partial<(typeof malformed.steps)[number]>).journeyId;
    const preview = await prepareProjectImportFile(fileFor(malformed));
    expect(preview.valid).toBe(false);
    expect(preview.errors.join(' ')).toContain('journeyId must be a string');
    expect(await db.projects.count()).toBe(0);
  });

  it('rolls back the whole transaction when a write fails', async () => {
    const data = projectData('proj_rollback');
    data.processes.push({ ...data.processes[0] });
    const prepared: PreparedProjectImport = { data, counts: {}, warnings: [] };
    const result = await commitProjectImport(prepared);
    expect(result.ok).toBe(false);
    expect(await db.projects.count()).toBe(0);
    expect(await db.processes.count()).toBe(0);
  });
});
