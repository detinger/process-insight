// Native .pjs.json import/export.
// Import is deliberately two-phase: parse/validate/remap first, then commit all
// records in a single transaction after the user has reviewed the preview.

import { z } from 'zod';
import { db } from './db';
import { newId } from '../domain/contracts/ids';
import type { ProjectData, ProjectManifest } from '../domain/contracts/types';

const SCHEMA_VERSION = 1;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const DATA_KEYS = [
  'revisions', 'processes', 'candidates', 'relations',
  'personas', 'units', 'services', 'capabilities', 'channels', 'touchpoints', 'systems',
  'journeys', 'stages', 'steps', 'rows', 'cells', 'cards',
  'painPoints', 'evidence', 'evidenceLinks', 'kpiDefinitions', 'kpiObservations',
  'derivations', 'processRatings', 'bpmnExports', 'learningProgress',
] as const satisfies readonly (Exclude<keyof ProjectData, 'manifest'>)[];

const nonEmptyString = z.string().min(1);
const manifestSchema = z.object({
  id: nonEmptyString,
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  currentRevisionId: z.string().optional(),
  schemaVersion: z.number().int().nonnegative(),
}).passthrough();

const ownedRecordSchema = z.object({
  id: nonEmptyString,
  projectId: nonEmptyString,
}).passthrough();

const projectFileSchema = z.object({
  manifest: manifestSchema,
  ...Object.fromEntries(DATA_KEYS.map(key => [key, z.array(ownedRecordSchema).default([])])),
}).passthrough();

export interface ImportResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  projectId?: string;
}

export interface PreparedProjectImport {
  readonly data: ProjectData;
  readonly counts: Record<string, number>;
  readonly warnings: string[];
}

export interface ImportPreview {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  sourceTitle?: string;
  prepared?: PreparedProjectImport;
}

// ─── Export ───

export async function collectProjectData(projectId: string): Promise<ProjectData> {
  const manifest = await db.projects.get(projectId);
  if (!manifest) throw new Error(`Project ${projectId} not found`);

  const [
    revisions, processes, candidates, relations,
    personas, units, services, capabilities, channels, touchpoints, systems,
    journeys, stages, steps, rows, cells, cards,
    painPoints, evidence, evidenceLinks, kpiDefinitions, kpiObservations, derivations,
    processRatings, bpmnExports, learningProgress,
  ] = await Promise.all([
    db.revisions.where('projectId').equals(projectId).toArray(),
    db.processes.where('projectId').equals(projectId).toArray(),
    db.candidates.where('projectId').equals(projectId).toArray(),
    db.relations.where('projectId').equals(projectId).toArray(),
    db.personas.where('projectId').equals(projectId).toArray(),
    db.units.where('projectId').equals(projectId).toArray(),
    db.services.where('projectId').equals(projectId).toArray(),
    db.capabilities.where('projectId').equals(projectId).toArray(),
    db.channels.where('projectId').equals(projectId).toArray(),
    db.touchpoints.where('projectId').equals(projectId).toArray(),
    db.systems.where('projectId').equals(projectId).toArray(),
    db.journeys.where('projectId').equals(projectId).toArray(),
    db.stages.where('projectId').equals(projectId).toArray(),
    db.steps.where('projectId').equals(projectId).toArray(),
    db.rows.where('projectId').equals(projectId).toArray(),
    db.cells.where('projectId').equals(projectId).toArray(),
    db.cards.where('projectId').equals(projectId).toArray(),
    db.painPoints.where('projectId').equals(projectId).toArray(),
    db.evidence.where('projectId').equals(projectId).toArray(),
    db.evidenceLinks.where('projectId').equals(projectId).toArray(),
    db.kpiDefinitions.where('projectId').equals(projectId).toArray(),
    db.kpiObservations.where('projectId').equals(projectId).toArray(),
    db.derivations.where('projectId').equals(projectId).toArray(),
    db.processRatings.where('projectId').equals(projectId).toArray(),
    db.bpmnExports.where('projectId').equals(projectId).toArray(),
    db.learningProgress.where('projectId').equals(projectId).toArray(),
  ]);

  return {
    manifest: { ...manifest, schemaVersion: SCHEMA_VERSION },
    revisions, processes, candidates, relations,
    personas, units, services, capabilities, channels, touchpoints, systems,
    journeys, stages, steps, rows, cells, cards,
    painPoints, evidence, evidenceLinks, kpiDefinitions, kpiObservations, derivations,
    processRatings, bpmnExports, learningProgress,
  };
}

export async function exportProject(projectId: string): Promise<void> {
  const data = await collectProjectData(projectId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const safeName = data.manifest.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  anchor.download = `${safeName || 'project'}.pjs.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Import validation and preview ───

export async function prepareProjectImportFile(file: File): Promise<ImportPreview> {
  if (file.size > MAX_FILE_SIZE) {
    return invalidPreview(`File too large (${(file.size / 1048576).toFixed(1)} MB > 25 MB)`);
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return invalidPreview('Could not read file');
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return invalidPreview('Invalid JSON — not a .pjs.json file');
  }

  const parsed = projectFileSchema.safeParse(json);
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 20).map(issue => {
      const path = issue.path.length ? issue.path.join('.') : 'file';
      return `${path}: ${issue.message}`;
    });
    if (parsed.error.issues.length > 20) errors.push(`${parsed.error.issues.length - 20} more validation errors`);
    return { valid: false, errors, warnings: [], counts: {} };
  }

  const data = parsed.data as unknown as ProjectData;
  const errors = [
    ...validateRecordShapes(data),
    ...validateOwnershipAndDuplicates(data),
  ];
  const warnings = validateReferences(data);

  if (data.manifest.schemaVersion !== SCHEMA_VERSION) {
    warnings.unshift(
      `Schema version ${data.manifest.schemaVersion} differs from supported version ${SCHEMA_VERSION}; review the imported counts carefully.`,
    );
  }
  if (errors.length) {
    return { valid: false, errors, warnings, counts: countRecords(data), sourceTitle: data.manifest.title };
  }

  const remapped = remapProjectData(data);
  const counts = countRecords(remapped);
  return {
    valid: true,
    errors: [],
    warnings,
    counts,
    sourceTitle: data.manifest.title,
    prepared: { data: remapped, counts, warnings },
  };
}

function invalidPreview(error: string): ImportPreview {
  return { valid: false, errors: [error], warnings: [], counts: {} };
}

function countRecords(data: ProjectData): Record<string, number> {
  return Object.fromEntries(DATA_KEYS.map(key => [key, data[key].length]));
}

const REQUIRED_STRING_FIELDS: Partial<Record<(typeof DATA_KEYS)[number], readonly string[]>> = {
  revisions: ['name', 'createdAt'],
  processes: ['title', 'purpose', 'levelLabel', 'trigger', 'outcome', 'status'],
  candidates: ['title', 'status', 'rationale', 'createdAt'],
  relations: ['fromId', 'toId', 'type'],
  personas: ['name', 'role'],
  units: ['name', 'type', 'responsibility'],
  services: ['name', 'customerOutcome', 'scope'],
  capabilities: ['name', 'description'],
  channels: ['name', 'type'],
  touchpoints: ['name', 'purpose', 'channelId'],
  systems: ['name', 'type', 'criticality', 'supportingRole'],
  journeys: ['title', 'goal', 'situation', 'perspective', 'state', 'createdAt', 'updatedAt'],
  stages: ['journeyId', 'title', 'description'],
  steps: ['journeyId', 'stageId', 'title'],
  rows: ['journeyId', 'type', 'label'],
  cells: ['journeyId', 'stepId', 'rowId'],
  cards: ['cellId', 'sourceStatus', 'note'],
  painPoints: ['title', 'description', 'severity', 'scopeEstimate', 'state', 'symptom', 'hypothesizedCause', 'validatedCause', 'proposedIntervention'],
  evidence: ['type', 'title', 'content', 'sourceRole', 'context', 'excerpt', 'confidence'],
  evidenceLinks: ['evidenceId', 'relation'],
  kpiDefinitions: ['name', 'description', 'unit', 'direction', 'formula', 'population', 'timeWindow', 'source', 'missingDataPolicy'],
  kpiObservations: ['definitionId', 'type', 'period', 'source', 'provenance', 'note'],
  derivations: ['sourceJourneyId', 'sourceRevisionId', 'targetProcessId', 'converterVersion', 'configurationHash', 'targetArtifactId', 'targetRevisionId', 'status', 'createdAt'],
  processRatings: ['processId', 'configId'],
  bpmnExports: ['journeyId', 'processName', 'participantName', 'exportedAt', 'status', 'converterVersion', 'filename'],
  learningProgress: ['challengeId', 'status', 'reflection', 'updatedAt'],
};

const REQUIRED_ARRAY_FIELDS: Partial<Record<(typeof DATA_KEYS)[number], readonly string[]>> = {
  processes: ['inScope', 'outOfScope', 'evidenceIds', 'serviceIds', 'capabilityIds', 'systemIds'],
  candidates: ['sourceRefs'],
  personas: ['goals', 'needs', 'constraints', 'accessibilityNeeds', 'evidenceIds'],
  capabilities: ['realizingProcessIds'],
  touchpoints: ['systemIds', 'recipientPersonaIds', 'accessibilityConcerns'],
  systems: ['evidenceIds'],
  journeys: ['personaIds', 'stageOrder', 'rowOrder'],
  cells: ['cardOrder'],
  cards: ['evidenceIds'],
  painPoints: ['affectedPersonaIds', 'affectedStepIds', 'affectedProcessIds', 'evidenceIds', 'suspectedCauseIds'],
  derivations: ['decisions'],
  learningProgress: ['usedHintIndexes'],
};

const REQUIRED_NUMBER_FIELDS: Partial<Record<(typeof DATA_KEYS)[number], readonly string[]>> = {
  stages: ['order'],
  steps: ['order'],
  rows: ['order'],
  kpiObservations: ['value'],
  bpmnExports: ['mappingCount', 'exclusionCount', 'unresolvedCount'],
  learningProgress: ['attempts'],
};

const REQUIRED_BOOLEAN_FIELDS: Partial<Record<(typeof DATA_KEYS)[number], readonly string[]>> = {
  revisions: ['snapshot'],
  evidence: ['synthetic'],
};

const REQUIRED_OBJECT_FIELDS: Partial<Record<(typeof DATA_KEYS)[number], readonly string[]>> = {
  cards: ['payload'],
  evidenceLinks: ['claim'],
  processRatings: ['ratings'],
  learningProgress: ['criterionResults'],
};

function validateRecordShapes(data: ProjectData): string[] {
  const errors: string[] = [];
  for (const key of DATA_KEYS) {
    for (const record of data[key] as unknown as Record<string, unknown>[]) {
      const label = `${key}.${String(record.id)}`;
      for (const field of REQUIRED_STRING_FIELDS[key] ?? []) {
        if (typeof record[field] !== 'string') errors.push(`${label}.${field} must be a string`);
      }
      for (const field of REQUIRED_ARRAY_FIELDS[key] ?? []) {
        if (!Array.isArray(record[field])) errors.push(`${label}.${field} must be an array`);
      }
      for (const field of REQUIRED_NUMBER_FIELDS[key] ?? []) {
        if (typeof record[field] !== 'number' || !Number.isFinite(record[field])) {
          errors.push(`${label}.${field} must be a finite number`);
        }
      }
      for (const field of REQUIRED_BOOLEAN_FIELDS[key] ?? []) {
        if (typeof record[field] !== 'boolean') errors.push(`${label}.${field} must be a boolean`);
      }
      for (const field of REQUIRED_OBJECT_FIELDS[key] ?? []) {
        if (!record[field] || typeof record[field] !== 'object' || Array.isArray(record[field])) {
          errors.push(`${label}.${field} must be an object`);
        }
      }
    }
  }
  return errors;
}

function validateOwnershipAndDuplicates(data: ProjectData): string[] {
  const errors: string[] = [];
  for (const key of DATA_KEYS) {
    const seen = new Set<string>();
    for (const record of data[key] as { id: string; projectId: string }[]) {
      if (record.projectId !== data.manifest.id) {
        errors.push(`${key}.${record.id}: projectId does not match the exported project`);
      }
      if (seen.has(record.id)) errors.push(`${key}: duplicate ID ${record.id}`);
      seen.add(record.id);
    }
  }
  return errors;
}

function validateReferences(data: ProjectData): string[] {
  const warnings: string[] = [];
  const ids = <T extends { id: string }>(rows: T[]) => new Set(rows.map(row => row.id));
  const journeyIds = ids(data.journeys);
  const stageIds = ids(data.stages);
  const stepIds = ids(data.steps);
  const rowIds = ids(data.rows);
  const cellIds = ids(data.cells);
  const processIds = ids(data.processes);
  const channelIds = ids(data.channels);
  const evidenceIds = ids(data.evidence);
  const definitionIds = ids(data.kpiDefinitions);

  const check = (table: string, recordId: string, field: string, value: string | undefined, targets: Set<string>) => {
    if (value && !targets.has(value)) warnings.push(`${table}.${recordId}.${field} references missing ID ${value}`);
  };
  data.stages.forEach(row => check('stages', row.id, 'journeyId', row.journeyId, journeyIds));
  data.steps.forEach(row => {
    check('steps', row.id, 'journeyId', row.journeyId, journeyIds);
    check('steps', row.id, 'stageId', row.stageId, stageIds);
  });
  data.rows.forEach(row => check('rows', row.id, 'journeyId', row.journeyId, journeyIds));
  data.cells.forEach(row => {
    check('cells', row.id, 'journeyId', row.journeyId, journeyIds);
    check('cells', row.id, 'stepId', row.stepId, stepIds);
    check('cells', row.id, 'rowId', row.rowId, rowIds);
  });
  data.cards.forEach(row => check('cards', row.id, 'cellId', row.cellId, cellIds));
  data.touchpoints.forEach(row => check('touchpoints', row.id, 'channelId', row.channelId, channelIds));
  data.evidenceLinks.forEach(row => check('evidenceLinks', row.id, 'evidenceId', row.evidenceId, evidenceIds));
  data.kpiObservations.forEach(row => check('kpiObservations', row.id, 'definitionId', row.definitionId, definitionIds));
  data.processRatings.forEach(row => check('processRatings', row.id, 'processId', row.processId, processIds));
  data.bpmnExports.forEach(row => check('bpmnExports', row.id, 'journeyId', row.journeyId, journeyIds));
  data.derivations.forEach(row => {
    check('derivations', row.id, 'sourceJourneyId', row.sourceJourneyId, journeyIds);
    check('derivations', row.id, 'targetProcessId', row.targetProcessId, processIds);
  });
  return warnings;
}

// Remap record IDs and all ID-shaped references recursively. Catalog identifiers
// (scoring config and challenge definition IDs) are external stable keys, so they
// intentionally remain unchanged.
function remapProjectData(source: ProjectData): ProjectData {
  const newProjectId = newId('proj');
  const idMap = new Map<string, string>([[source.manifest.id, newProjectId]]);
  const stableExternalKeys = new Set(['configId', 'challengeId']);

  const mapId = (oldId: string): string => {
    const existing = idMap.get(oldId);
    if (existing) return existing;
    const prefixMatch = /^[a-z][a-z0-9-]*/i.exec(oldId);
    const mapped = newId(prefixMatch?.[0].toLowerCase() || 'id');
    idMap.set(oldId, mapped);
    return mapped;
  };

  const remap = (value: unknown, key?: string): unknown => {
    if (key === 'projectId') return newProjectId;
    if (typeof value === 'string' && key && !stableExternalKeys.has(key)) {
      if (key === 'id' || key.endsWith('Id')) return value ? mapId(value) : value;
    }
    if (Array.isArray(value)) {
      if (key?.endsWith('Ids') || key === 'stageOrder' || key === 'rowOrder' || key === 'cardOrder') {
        return value.map(item => typeof item === 'string' && item ? mapId(item) : item);
      }
      return value.map(item => remap(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, remap(childValue, childKey)]),
      );
    }
    return value;
  };

  const cloned = remap(source) as ProjectData;
  const now = new Date().toISOString();
  const manifest: ProjectManifest = {
    ...cloned.manifest,
    id: newProjectId,
    title: `${source.manifest.title} (imported)`,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };

  // Rating IDs are composite in the editor and must remain compatible with its
  // subsequent put() calls after the process ID changes.
  const processRatings = cloned.processRatings.map(rating => ({
    ...rating,
    id: `${rating.processId}__${rating.configId}`,
  }));

  return { ...cloned, manifest, processRatings };
}

// ─── Atomic import commit ───

export async function commitProjectImport(prepared: PreparedProjectImport): Promise<ImportResult> {
  const data = prepared.data;
  try {
    await db.transaction('rw',
      [db.projects, db.revisions, db.processes, db.candidates, db.relations,
        db.personas, db.units, db.services, db.capabilities, db.channels,
        db.touchpoints, db.systems, db.journeys, db.stages, db.steps, db.rows,
        db.cells, db.cards, db.painPoints, db.evidence, db.evidenceLinks,
        db.kpiDefinitions, db.kpiObservations, db.derivations, db.processRatings,
        db.bpmnExports, db.learningProgress],
      async () => {
        await db.projects.add(data.manifest);
        if (data.revisions.length) await db.revisions.bulkAdd(data.revisions);
        if (data.processes.length) await db.processes.bulkAdd(data.processes);
        if (data.candidates.length) await db.candidates.bulkAdd(data.candidates);
        if (data.relations.length) await db.relations.bulkAdd(data.relations);
        if (data.personas.length) await db.personas.bulkAdd(data.personas);
        if (data.units.length) await db.units.bulkAdd(data.units);
        if (data.services.length) await db.services.bulkAdd(data.services);
        if (data.capabilities.length) await db.capabilities.bulkAdd(data.capabilities);
        if (data.channels.length) await db.channels.bulkAdd(data.channels);
        if (data.touchpoints.length) await db.touchpoints.bulkAdd(data.touchpoints);
        if (data.systems.length) await db.systems.bulkAdd(data.systems);
        if (data.journeys.length) await db.journeys.bulkAdd(data.journeys);
        if (data.stages.length) await db.stages.bulkAdd(data.stages);
        if (data.steps.length) await db.steps.bulkAdd(data.steps);
        if (data.rows.length) await db.rows.bulkAdd(data.rows);
        if (data.cells.length) await db.cells.bulkAdd(data.cells);
        if (data.cards.length) await db.cards.bulkAdd(data.cards);
        if (data.painPoints.length) await db.painPoints.bulkAdd(data.painPoints);
        if (data.evidence.length) await db.evidence.bulkAdd(data.evidence);
        if (data.evidenceLinks.length) await db.evidenceLinks.bulkAdd(data.evidenceLinks);
        if (data.kpiDefinitions.length) await db.kpiDefinitions.bulkAdd(data.kpiDefinitions);
        if (data.kpiObservations.length) await db.kpiObservations.bulkAdd(data.kpiObservations);
        if (data.derivations.length) await db.derivations.bulkAdd(data.derivations);
        if (data.processRatings.length) await db.processRatings.bulkAdd(data.processRatings);
        if (data.bpmnExports.length) await db.bpmnExports.bulkAdd(data.bpmnExports);
        if (data.learningProgress.length) await db.learningProgress.bulkAdd(data.learningProgress);
      },
    );
  } catch (error) {
    return {
      ok: false,
      errors: [`Import failed; no records were saved: ${error instanceof Error ? error.message : String(error)}`],
      warnings: prepared.warnings,
      counts: prepared.counts,
    };
  }

  return {
    ok: true,
    errors: [],
    warnings: prepared.warnings,
    counts: prepared.counts,
    projectId: data.manifest.id,
  };
}

// Compatibility helper for non-UI callers. The Home screen uses the two-phase
// API so users can review counts and warnings before any data is written.
export async function importProjectFile(file: File): Promise<ImportResult> {
  const preview = await prepareProjectImportFile(file);
  if (!preview.valid || !preview.prepared) {
    return { ok: false, errors: preview.errors, warnings: preview.warnings, counts: preview.counts };
  }
  return commitProjectImport(preview.prepared);
}
