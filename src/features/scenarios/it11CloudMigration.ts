// IT-11: Customer migrating to cloud hosting — assessment, migration, validation and support value chain.

import { newId } from '../../domain/contracts/ids';
import type {
  ProjectManifest, ProcessCandidate, ProcessDefinition, LandscapeRelation,
  Persona, ITSystem, Channel, Touchpoint,
  Journey, JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  PainPoint,
  DiscoveryInterview, DiscoveryInterviewItem, DiscoveryObservation,
  StormingCard, Contradiction,
  SipocDiagram, SipocRow, ProcessMap, MapLane, MapActivity, ProcessMapEdge,
} from '../../domain/contracts/types';
import type { ScenarioBundle } from './it02SaasOnboarding';

export function buildIT11Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysMigration = newId('sys');
  const sysCloud = newId('sys');
  const sysSupport = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const tpAssessment = newId('tp');
  const tpMigration = newId('tp');

  const procCoreGroup = newId('proc');  // core-group: Workload Migration
  const procAssess    = newId('proc');
  const procMigrate   = newId('proc');
  const procCutover   = newId('proc');
  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');

  const journeyId = newId('journey');
  const stgAssess = newId('stg');
  const stgPlan = newId('stg');
  const stgMigrate = newId('stg');
  const stgCutover = newId('stg');
  const stgValidate = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgAssess,   label: 'Complete migration readiness assessment', order: 0 },
    { stageId: stgAssess,   label: 'Receive migration complexity report',     order: 1 },
    { stageId: stgPlan,     label: 'Define cutover window',                   order: 0 },
    { stageId: stgPlan,     label: 'Communicate downtime to stakeholders',    order: 1 },
    { stageId: stgMigrate,  label: 'Migrate data in batches',                 order: 0 },
    { stageId: stgMigrate,  label: 'Validate batch integrity',                order: 1 },
    { stageId: stgMigrate,  label: 'Encounter incompatible legacy schema',    order: 2 },
    { stageId: stgCutover,  label: 'Begin production cutover',                order: 0 },
    { stageId: stgCutover,  label: 'Cutover overruns window',                 order: 1 },
    { stageId: stgCutover,  label: 'Activate rollback plan',                  order: 2 },
    { stageId: stgValidate, label: 'Complete second cutover attempt',         order: 0 },
    { stageId: stgValidate, label: 'Run post-migration validation tests',     order: 1 },
    { stageId: stgValidate, label: 'Decommission legacy environment',         order: 2 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Complete migration readiness assessment': 'Fills out 50-question vendor assessment; some legacy systems undocumented',
    'Receive migration complexity report':     'Complexity scored "High"; vendor recommends phased approach; no detailed timeline provided',
    'Define cutover window':                   'Agrees 4-hour Saturday night window; must negotiate with 3 customer teams using the system',
    'Communicate downtime to stakeholders':    'Sends advance notice 2 weeks before; 1 team objects — scheduled maintenance window conflicts',
    'Migrate data in batches':                 'Batch 1 of 4 completes in 2h; batch 2 fails at 60% — disk quota exceeded on target',
    'Validate batch integrity':                'Row counts match; checksum validation skipped by migration tool — not noticed until cutover',
    'Encounter incompatible legacy schema':    'Legacy table uses reserved keyword in target DB; blocked; schema transform added to plan',
    'Begin production cutover':               'Cutover starts on schedule; schema transform takes 40% longer than estimated',
    'Cutover overruns window':                 '4-hour window runs out at 94% completion; decision: proceed or rollback',
    'Activate rollback plan':                  'Rollback completes in 55 minutes; legacy environment restored; re-migration needed',
    'Complete second cutover attempt':         'Second attempt 2 weeks later; schema issue resolved; cutover completes in 3h 20min',
    'Run post-migration validation tests':     '98% of test cases pass; 2 integrations use hardcoded legacy IP — must be updated',
    'Decommission legacy environment':         'Legacy decommissioned after 30-day parallel run; cost saving realized',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Complete migration readiness assessment': -1, 'Receive migration complexity report': -1,
    'Define cutover window': -1, 'Communicate downtime to stakeholders': -1,
    'Migrate data in batches': 0, 'Validate batch integrity': 0,
    'Encounter incompatible legacy schema': -2, 'Begin production cutover': 0,
    'Cutover overruns window': -2, 'Activate rollback plan': -2,
    'Complete second cutover attempt': 0, 'Run post-migration validation tests': 1,
    'Decommission legacy environment': 1,
  };

  const cells: Cell[] = []; const cards: JourneyCard[] = [];
  for (let i = 0; i < stepDefs.length; i++) {
    const stepId = stepIds[i]; const label = stepDefs[i].label;
    const aIds: string[] = [];
    if (actionSeeds[label]) { const id = newId('card'); aIds.push(id); cards.push({ projectId: projId, id, cellId: '', payload: { kind: 'text', text: actionSeeds[label] }, sourceStatus: 'assumption', evidenceIds: [], note: '' }); }
    const aCellId = newId('cell');
    cells.push({ projectId: projId, id: aCellId, journeyId, stepId, rowId: rowActions, cardOrder: aIds });
    for (const c of cards.slice(-aIds.length)) c.cellId = aCellId;
    const sIds: string[] = [];
    if (label in sentimentSeeds) { const id = newId('card'); sIds.push(id); cards.push({ projectId: projId, id, cellId: '', payload: { kind: 'sentiment', personaId, value: sentimentSeeds[label] }, sourceStatus: 'assumption', evidenceIds: [], note: '' }); }
    const sCellId = newId('cell');
    cells.push({ projectId: projId, id: sCellId, journeyId, stepId, rowId: rowSentiment, cardOrder: sIds });
    for (const c of cards.slice(-sIds.length)) c.cellId = sCellId;
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowPainPts, cardOrder: [] });
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowSystems, cardOrder: [] });
  }

  const painPoints: PainPoint[] = [
    {
      id: newId('pp'), projectId: projId,
      title: 'Schema transform not discovered until cutover — causes overrun and rollback',
      description: 'Legacy table uses a reserved keyword in the target DB; not flagged during assessment or batch migration.',
      severity: 'critical', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[6], stepIds[8]], affectedProcessIds: [procAssess, procCutover],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Cutover window exceeded; full rollback required; migration delayed 2 weeks; reputation impact.',
      hypothesizedCause: 'Assessment tool checks row counts but not reserved-keyword conflicts in schema diff.',
      validatedCause: '', proposedIntervention: 'Add schema compatibility check to assessment and dry-run phases; block cutover if unresolved conflicts remain.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Hardcoded legacy IP in 2 integrations discovered post-migration',
      description: 'Two downstream integrations bypass DNS and hardcode the legacy server IP; not discovered in validation tests.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[11]], affectedProcessIds: [procMigrate],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Integration failures discovered on day 3 of parallel run; 6 hours of downtime for affected services.',
      hypothesizedCause: 'Integration inventory incomplete; no automated scan for hardcoded IPs in config files.',
      validatedCause: '', proposedIntervention: 'Run automated IP/hostname scan across all integration configs during assessment phase.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-11 · Cloud Migration Journey', description: 'Customer experience migrating on-premise workloads to cloud: readiness assessment, batch migration, failed cutover, rollback and second attempt.', createdAt: now, updatedAt: now, schemaVersion: 1 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Migration readiness assessment', status: 'accepted', rationale: 'Discovery phase before any migration work begins.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Data migration and validation', status: 'accepted', rationale: 'Core technical migration process; distinct from planning and cutover.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId3, title: 'Production cutover and rollback', status: 'accepted', rationale: 'High-risk coordinated event; different roles, timebox and rollback criteria.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procAssess, title: 'Migration readiness assessment', purpose: 'Evaluate workload complexity, dependencies and risks before committing to migration.', levelLabel: 'management', trigger: 'Customer decides to migrate a workload to cloud.', outcome: 'Complexity report and migration plan approved; risks and blockers documented.', inScope: ['Workload inventory', 'Dependency mapping', 'Schema compatibility check', 'Risk assessment'], outOfScope: ['Actual data migration', 'Cutover planning'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysMigration], evidenceIds: [] },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'Workload Migration',
      purpose: 'Execute the end-to-end transfer of on-premise workloads to the cloud environment, including validation and cutover.',
      levelLabel: 'core-group',
      trigger: 'Migration readiness assessment approved and cutover window agreed with stakeholders.',
      outcome: 'Workload running in cloud; legacy decommissioned; hardcoded dependencies resolved.',
      inScope: ['Batch data migration', 'Schema transformation', 'Production cutover', 'Rollback execution', 'Post-migration validation'],
      outOfScope: ['Readiness assessment', 'Billing and commercial transition'],
      status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procMigrate, title: 'Data migration and validation', purpose: 'Transfer workload data to the target environment with integrity verification.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Migration plan approved and cutover window agreed.', outcome: 'All data transferred and validated; rollback plan confirmed.', inScope: ['Batch migration execution', 'Integrity checks', 'Schema transforms', 'Integration config updates'], outOfScope: ['Cutover coordination', 'Legacy decommission'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysMigration, sysCloud], evidenceIds: [] },
    { projectId: projId, id: procCutover, title: 'Production cutover and rollback', purpose: 'Switch live traffic from legacy to cloud environment within an agreed window; rollback if criteria not met.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Migration complete and cutover window approved.', outcome: 'Traffic routed to cloud; legacy in standby; validation complete; legacy decommissioned.', inScope: ['Traffic cutover', 'Post-cutover validation', 'Rollback execution', 'Stakeholder communication'], outOfScope: ['Data migration', 'Billing transition'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysCloud, sysSupport], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Elena Voss', role: 'Infrastructure Architect', goals: ['Complete migration with zero data loss', 'Minimize business disruption during cutover', 'Decommission legacy before next billing cycle'], needs: ['Reliable schema compatibility check', 'Realistic cutover time estimates', 'Clear rollback criteria'], constraints: ['Cutover must complete within 4-hour Saturday window', 'Cannot extend parallel run beyond 30 days', 'Must notify all affected teams 2 weeks in advance'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysMigration, name: 'Migration Tool Suite',   type: 'saas', criticality: 'critical', supportingRole: 'Data transfer, schema conversion, batch progress and integrity checks.', evidenceIds: [] },
    { projectId: projId, id: sysCloud,     name: 'Target Cloud Platform',  type: 'saas', criticality: 'critical', supportingRole: 'Target infrastructure, database services and DNS management.', evidenceIds: [] },
    { projectId: projId, id: sysSupport,   name: 'Migration Support Portal', type: 'saas', criticality: 'high', supportingRole: 'P1 ticket escalation during cutover; migration runbook repository.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chEmail, name: 'Email', type: 'email' }, { projectId: projId, id: chPortal, name: 'Migration Portal', type: 'portal' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpAssessment, name: 'Readiness assessment portal', purpose: 'Complete and receive migration readiness assessment results.', channelId: chPortal, systemIds: [sysMigration], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpMigration,  name: 'Migration progress dashboard', purpose: 'Monitor batch migration progress and cutover status.', channelId: chPortal, systemIds: [sysMigration, sysCloud], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'Cloud Migration — On-Premise to Cloud Hosting',
    goal: 'Migrate production workloads to cloud with zero data loss and minimal downtime.',
    situation: "Infrastructure architect leads migration. Assessment misses schema issue. First cutover overruns 4-hour window; rollback required. Second cutover succeeds 2 weeks later. Hardcoded IPs found on day 3.",
    perspective: 'employee', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgAssess, stgPlan, stgMigrate, stgCutover, stgValidate],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgAssess,   journeyId, title: 'Assessment',  description: '', order: 0 },
    { projectId: projId, id: stgPlan,     journeyId, title: 'Planning',    description: '', order: 1 },
    { projectId: projId, id: stgMigrate,  journeyId, title: 'Migration',   description: '', order: 2 },
    { projectId: projId, id: stgCutover,  journeyId, title: 'Cutover',     description: '', order: 3 },
    { projectId: projId, id: stgValidate, journeyId, title: 'Validation',  description: '', order: 4 },
  ];
  const journeySteps: JourneyStep[] = stepDefs.map((s, i) => ({ projectId: projId, id: stepIds[i], journeyId, stageId: s.stageId, title: s.label, order: s.order }));
  const rows: JourneyRow[] = [
    { projectId: projId, id: rowActions,   journeyId, type: 'customer-actions', label: 'Actions',     order: 0 },
    { projectId: projId, id: rowSentiment, journeyId, type: 'sentiment',         label: 'Sentiment',   order: 1 },
    { projectId: projId, id: rowPainPts,   journeyId, type: 'pain-points',       label: 'Pain points', order: 2 },
    { projectId: projId, id: rowSystems,   journeyId, type: 'systems',           label: 'Systems',     order: 3 },
  ];
  // ─── Discovery workspace ────────────────────────────────────────────────────

  const intv1Id = newId('intv');
  const intv2Id = newId('intv');
  const intv3Id = newId('intv');

  const interviews: DiscoveryInterview[] = [
    { id: intv1Id, projectId: projId, interviewee: 'Elena Voss',    role: 'Infrastructure Architect',       date: '2024-08-15', notes: 'Elena described the schema issue as the root cause of the first cutover failure — it was entirely preventable.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Oliver Grant',  role: 'Cloud Vendor Migration Engineer', date: '2024-08-17', notes: 'Oliver acknowledged the cutover estimate was based on a similar but less complex workload.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Heidi Brandt',  role: 'Legacy System Owner',            date: '2024-08-18', notes: 'Heidi noted two integrations had hardcoded IPs that were not in any CMDB or runbook.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: '"The schema check tool said everything was compatible. It was not until we ran the actual transform that we hit the reserved keyword error. That should have been caught in assessment."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The assessment tool does not test reserved keywords in the target database dialect; it only checks data types and nullability.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Which additional schema validation steps can be added to the assessment phase to catch reserved keyword conflicts before cutover?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: '"Our estimate was 2.5 hours based on a 300GB workload. This one was 480GB with 12 more tables. We should have recalculated."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'Cutover estimates should scale with data volume and table count; the current estimating model uses a fixed template.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'question', text: 'Can the vendor provide a data-driven estimating model that accounts for schema complexity and volume as inputs?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: '"Those two integrations were built five years ago. The IPs were hardcoded directly in the application config — no one had documented it."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The CMDB was last fully audited 8 months ago and does not reflect recent infrastructure changes or integration dependencies.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Should a mandatory pre-migration integration scan be added to the assessment checklist to catch hardcoded dependencies?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Elena Voss',   description: 'Runs readiness assessment tool; tool reports no schema issues; hardcoded IP integrations not scanned.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Elena Voss',   description: 'Executes batch migration in 3 waves; completes with 100% row count match and checksum verification.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Oliver Grant', description: 'Cutover schema transform fails at step 4/9 — "order" is a reserved keyword in target DB; transform aborts.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Elena Voss',   description: 'Cutover overruns 4-hour window by 1.5 hours; rollback initiated to prevent business impact on Monday.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Elena Voss',   description: 'Renames reserved-keyword columns in schema; updates ORM layer; runs full regression suite.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Heidi Brandt', description: 'Two integrations fail on day 3 post-cutover — hardcoded legacy IP addresses discovered in application configs.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Elena Voss',   description: 'Updates integration configs; re-tests; second cutover succeeds within the 4-hour window 2 weeks later.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Readiness Assessment Completed',    sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Batch Migration Completed',         sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Cutover Failed (Reserved Keyword)', sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Rollback Executed',                 sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Hardcoded IPs Discovered',          sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Schema Fix Applied',                sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Second Cutover Succeeded',          sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Legacy Decommissioned',             sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Run Readiness Assessment',          sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Execute Batch Migration',           sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Initiate Cutover',                  sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Execute Rollback',                  sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Fix Schema & Retry Cutover',        sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Elena Voss (Infra Architect)',      sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Oliver Grant (Vendor Engineer)',    sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Heidi Brandt (Legacy Owner)',       sequence: 16 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Cutover Policy — Production cutover must complete within a 4-hour Saturday maintenance window; rollback triggered if window is exceeded.', sequence: 17 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Migration Policy — All batch migrations require row count and checksum validation before cutover is permitted.', sequence: 18 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Schema compatibility assessment result',
      sourceA: 'Migration readiness assessment tool report',
      claimA: 'Schema assessment passed: all data types and nullability constraints are compatible with the target database.',
      sourceB: 'Elena Voss during cutover execution',
      claimB: 'Transform failed due to "order" being a reserved keyword in the target DB dialect — not checked by the assessment tool.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Cutover time estimate accuracy',
      sourceA: 'Oliver Grant (vendor migration engineer) pre-cutover estimate',
      claimA: 'The cutover will take approximately 2.5 hours including schema transforms and validation.',
      sourceB: 'Actual cutover execution log',
      claimB: 'Cutover took 5.5 hours before rollback; workload was 60% larger and had more complex schema than the reference used for estimation.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Cloud Migration', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'Elena Voss, Heidi Brandt', input: 'Workload inventory, CMDB data, infrastructure specs', step: '1. Run readiness assessment', output: 'Complexity report, risk register, migration plan', customer: 'Cloud Vendor, IT Management' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Elena Voss, Oliver Grant', input: 'Approved migration plan, source data', step: '2. Execute batch migration', output: 'Migrated data with integrity checksums', customer: 'Testing & QA, Elena Voss' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Elena Voss, Oliver Grant', input: 'Validated data, cutover runbook, rollback plan', step: '3. Execute production cutover', output: 'Traffic switched to cloud, or rollback completed', customer: 'Business Operations, IT Management' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'Elena Voss, Testing & QA', input: 'Post-cutover system state, integration test suite', step: '4. Post-cutover validation', output: 'Validation report, integration status, issues log', customer: 'Business Operations, Heidi Brandt' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Elena Voss, IT Management', input: 'Validation sign-off, decommission approval', step: '5. Decommission legacy systems', output: 'Legacy systems offline, final cost report', customer: 'Business Operations, Finance' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId    = newId('pm');
  const lane0Id = newId('ml');
  const lane1Id = newId('ml');
  const lane2Id = newId('ml');
  const lane3Id = newId('ml');

  const maStart  = newId('ma');
  const maA1     = newId('ma');
  const maA2     = newId('ma');
  const maA3     = newId('ma');
  const maA4     = newId('ma');
  const maB1     = newId('ma');
  const maB2     = newId('ma');
  const maC1     = newId('ma');
  const maD1     = newId('ma');
  const maD2     = newId('ma');
  const maEnd    = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Cloud Migration Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: lane0Id, projectId: projId, mapId: pmId, label: 'Infrastructure Team',  order: 0 },
    { id: lane1Id, projectId: projId, mapId: pmId, label: 'Cloud Vendor',         order: 1 },
    { id: lane2Id, projectId: projId, mapId: pmId, label: 'Testing & QA',         order: 2 },
    { id: lane3Id, projectId: projId, mapId: pmId, label: 'Business Operations',  order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart, projectId: projId, mapId: pmId, laneId: lane0Id, type: 'start', label: 'Start',                    note: '',                                                                 x: 60,   y: 63  },
    { id: maA1,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Run Assessment',           note: 'Schema tool misses reserved keyword; hardcoded IPs not scanned.',  x: 280,  y: 58  },
    { id: maB1,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Plan Migration',           note: 'Vendor provides migration plan and cutover estimate.',              x: 500,  y: 228 },
    { id: maA2,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Execute Batch Migration',  note: 'Three waves; 100% row count and checksum match.',                  x: 720,  y: 58  },
    { id: maC1,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Validate Migrated Data',   note: 'QA team verifies data integrity before cutover sign-off.',          x: 720,  y: 398 },
    { id: maA3,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'First Cutover Attempt',    note: 'Fails at transform step 4/9 — reserved keyword; rollback triggered.', x: 940, y: 58  },
    { id: maB2,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Support Rollback',         note: 'Vendor assists rollback; cutover overran by 1.5h.',                 x: 940,  y: 228 },
    { id: maA4,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Fix Schema & Retry',       note: 'Rename reserved columns; update ORM; second cutover succeeds.',    x: 1160, y: 58  },
    { id: maD1,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Validate Production',      note: 'Business confirms critical flows; hardcoded IP issue found day 3.', x: 1380, y: 568 },
    { id: maD2,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Decommission Legacy',      note: 'Legacy taken offline after 30-day parallel run.',                  x: 1600, y: 568 },
    { id: maEnd,   projectId: projId, mapId: pmId, laneId: lane3Id, type: 'end',   label: 'End',                      note: '',                                                                 x: 1820, y: 573 },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart, toId: maA1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA1,   toId: maB1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB1,   toId: maA2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA2,   toId: maC1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC1,   toId: maA3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA3,   toId: maB2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maA4,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA4,   toId: maD1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD1,   toId: maD2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD2,   toId: maEnd, label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procMigrate,  type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procCutover,  type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procMigrate,   toId: procCutover,  type: 'precedesInValueChain' },
    { id: newId('rel'), projectId: projId, fromId: procAssess,    toId: procMigrate,  type: 'supportsService' },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
