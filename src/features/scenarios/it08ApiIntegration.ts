// IT-08: Developer integrating a public API — developer relations, security and platform services.

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

export function buildIT08Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysDocs = newId('sys');
  const sysSandbox = newId('sys');
  const sysApproval = newId('sys');
  const chPortal = newId('ch');
  const chEmail = newId('ch');
  const tpDocs = newId('tp');
  const tpSandbox = newId('tp');
  const tpProdAccess = newId('tp');

  const procCoreGroup = newId('proc');  // core-group: Developer API Enablement
  const procOnboard   = newId('proc');
  const procSecurity  = newId('proc');
  const candId1 = newId('cand');
  const candId2 = newId('cand');

  const journeyId = newId('journey');
  const stgDiscover = newId('stg');
  const stgSandbox = newId('stg');
  const stgProdAccess = newId('stg');
  const stgIntegration = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgDiscover,    label: 'Read API documentation',              order: 0 },
    { stageId: stgDiscover,    label: 'Register for sandbox access',         order: 1 },
    { stageId: stgSandbox,     label: 'Obtain sandbox credentials',          order: 0 },
    { stageId: stgSandbox,     label: 'Make first sandbox API call',         order: 1 },
    { stageId: stgSandbox,     label: 'Discover undocumented rate limits',   order: 2 },
    { stageId: stgProdAccess,  label: 'Apply for production access',         order: 0 },
    { stageId: stgProdAccess,  label: 'Complete security questionnaire',     order: 1 },
    { stageId: stgProdAccess,  label: 'Receive production API key',          order: 2 },
    { stageId: stgIntegration, label: 'Integrate into production build',     order: 0 },
    { stageId: stgIntegration, label: 'First production API call',           order: 1 },
    { stageId: stgIntegration, label: 'Handle rate limit in production',     order: 2 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Read API documentation':             'Finds reference docs but no quick-start guide; authentication section contradicts the changelog',
    'Register for sandbox access':        'Signs up with work email; must wait for email verification; activation takes 4 hours',
    'Obtain sandbox credentials':         'Credentials arrive in email but no instructions on which environment endpoint to use',
    'Make first sandbox API call':        'First call returns 401; authentication header format in docs is wrong — fixed in GitHub issues only',
    'Discover undocumented rate limits':  'Hits 429 after 10 calls; sandbox rate limit not in docs; finds it in a community forum post',
    'Apply for production access':        'Fills out production access form; 5-business-day SLA stated; no progress tracker',
    'Complete security questionnaire':    '40-question security questionnaire; some questions irrelevant to a read-only integration',
    'Receive production API key':         'Key arrives on day 6 (SLA breach); no explanation of production rate limits or quotas',
    'Integrate into production build':    'Adds key to secrets manager; updates integration layer; PR reviewed and merged',
    'First production API call':          'First call succeeds; response schema differs slightly from sandbox — undocumented change',
    'Handle rate limit in production':    'Implements exponential backoff; discovers no webhook alternative for real-time use case',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Read API documentation': -1, 'Register for sandbox access': -1,
    'Obtain sandbox credentials': -1, 'Make first sandbox API call': -2,
    'Discover undocumented rate limits': -2, 'Apply for production access': 0,
    'Complete security questionnaire': -1, 'Receive production API key': -1,
    'Integrate into production build': 1, 'First production API call': 1,
    'Handle rate limit in production': -1,
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
      title: 'Authentication format in docs is incorrect — only fixed in GitHub issues',
      description: 'Official reference docs show wrong header format; correct format buried in a 2-year-old GitHub issue.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[3]], affectedProcessIds: [procOnboard],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Developer wastes 1–2 hours debugging a docs error; first integration call fails with no useful error message.',
      hypothesizedCause: 'Documentation team and engineering team use separate content pipelines; breaking fix not reflected in docs.',
      validatedCause: '', proposedIntervention: 'Add authentication quick-start with working code examples; link changelog from main docs.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Production access SLA breached with no proactive communication',
      description: 'Stated 5-business-day SLA; actual delivery on day 6; developer not notified of delay.',
      severity: 'moderate', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[7]], affectedProcessIds: [procSecurity],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Sprint blocked for one day; developer discovers breach only by checking ticket status.',
      hypothesizedCause: 'Manual review queue; no automated SLA breach alert to reviewer or requester.',
      validatedCause: '', proposedIntervention: 'Send proactive email at SLA boundary; expose estimated completion in portal.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-08 · Public API Integration Journey', description: "Developer's experience integrating a third-party API: docs discovery, sandbox, production access approval, first call and rate-limit handling.", createdAt: now, updatedAt: now, schemaVersion: 1 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Developer API onboarding', status: 'accepted', rationale: 'Primary self-service journey from docs to first production call.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Production API access approval', status: 'accepted', rationale: 'Security-gated subprocess; different team and timebox.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procSecurity, title: 'Production API access approval', purpose: 'Review and approve production API key requests against security and usage policy.', levelLabel: 'management', trigger: 'Developer submits production access application.', outcome: 'Production key issued or request rejected with explanation.', inScope: ['Application review', 'Security questionnaire', 'Usage policy check', 'Key provisioning'], outOfScope: ['Sandbox access', 'Developer support'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysApproval], evidenceIds: [] },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'Developer API Enablement',
      purpose: 'Enable external developers to discover, test and integrate APIs from first contact to production.',
      levelLabel: 'core-group',
      trigger: 'Developer discovers the API documentation.',
      outcome: 'Developer makes first successful production API call and handles rate limits.',
      inScope: ['Documentation', 'Sandbox access', 'Production access', 'First integration support'],
      outOfScope: ['Billing and commercial terms', 'Custom API development'],
      status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procOnboard, title: 'Developer API onboarding', purpose: 'Enable external developers to discover, test and integrate an API into their product.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Developer registers for API access.', outcome: 'Developer makes first successful production API call.', inScope: ['Documentation access', 'Sandbox provisioning', 'Credential delivery', 'First-call guidance'], outOfScope: ['Production access security review', 'Billing setup'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysDocs, sysSandbox], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Ravi Sharma', role: 'Backend Developer', goals: ['Integrate API within sprint', 'Understand rate limits before production', 'Avoid production surprises'], needs: ['Accurate docs with working code examples', 'Transparent production access SLA', 'Sandbox that mirrors production behaviour'], constraints: ['Cannot bypass production approval process', 'Sprint deadline cannot slip more than one day', 'No internal contact at API vendor'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysDocs,    name: 'Developer Portal / Docs Site',  type: 'saas', criticality: 'high',   supportingRole: 'API reference, authentication guides, changelog.', evidenceIds: [] },
    { projectId: projId, id: sysSandbox, name: 'API Sandbox Environment',       type: 'saas', criticality: 'medium', supportingRole: 'Test endpoint with limited data and rate limits for development.', evidenceIds: [] },
    { projectId: projId, id: sysApproval, name: 'Production Access Review Queue', type: 'internal', criticality: 'high', supportingRole: 'Manual security review for production API key requests.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chPortal, name: 'Developer Portal', type: 'portal' }, { projectId: projId, id: chEmail, name: 'Email', type: 'email' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpDocs,      name: 'API documentation site',       purpose: 'Primary self-service reference for integration.', channelId: chPortal, systemIds: [sysDocs],    recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpSandbox,   name: 'Sandbox registration form',    purpose: 'Request and activate sandbox credentials.',         channelId: chPortal, systemIds: [sysSandbox], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpProdAccess, name: 'Production access application', purpose: 'Submit and track production API key request.',   channelId: chPortal, systemIds: [sysApproval], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'Public API Integration — Developer Journey',
    goal: 'Integrate a third-party REST API into a backend service within one sprint.',
    situation: "Backend developer discovers incorrect auth docs, hits undocumented sandbox rate limits, waits 6 days for production access (SLA breach), then discovers schema drift on first production call.",
    perspective: 'developer', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgDiscover, stgSandbox, stgProdAccess, stgIntegration],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgDiscover,    journeyId, title: 'Discover',         description: '', order: 0 },
    { projectId: projId, id: stgSandbox,     journeyId, title: 'Sandbox',          description: '', order: 1 },
    { projectId: projId, id: stgProdAccess,  journeyId, title: 'Production Access', description: '', order: 2 },
    { projectId: projId, id: stgIntegration, journeyId, title: 'Integration',      description: '', order: 3 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Ravi Sharma',   role: 'Backend Developer',              date: '2024-09-10', notes: 'Ravi spent ~2h debugging auth before finding the fix in a GitHub issue.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Yuki Chen',     role: 'API Vendor Developer Relations', date: '2024-09-12', notes: 'Yuki acknowledged docs lag behind engineering by 2–4 weeks.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Carlos Mendez', role: 'Internal Tech Lead',             date: '2024-09-13', notes: 'Carlos flagged that the sandbox rate limit is a known gotcha not documented anywhere official.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: '"I literally copy-pasted the exact header from the docs and got a 401. It took me two hours to find the fix in a two-year-old GitHub issue."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The sandbox rate limit of 10 calls/min is not mentioned anywhere in the official documentation.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Why does the production schema differ from the sandbox if there is no documented changelog for that change?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: '"Our docs team and engineering team work in separate repos; a breaking fix can take 2–4 weeks to surface in the docs."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'Production access approval is manually reviewed and the queue backs up at the end of each month.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'question', text: 'Is there a planned automation for the production key provisioning step to meet the 5-day SLA consistently?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: '"Everyone on the team hits the sandbox rate limit the first time. We just tell new joiners to check the community forum."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The production schema drift was caused by an unannounced vendor-side field renaming pushed 3 weeks before Ravi integrated.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Should the team escalate the SLA breach formally or accept it as a one-off?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Ravi Sharma',   description: 'Opens developer portal docs; navigates to authentication section; copies header format example.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Ravi Sharma',   description: 'First sandbox API call returns HTTP 401; error message does not indicate which header is malformed.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Ravi Sharma',   description: 'Searches GitHub issues; finds 2-year-old thread with correct Authorization header format.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Ravi Sharma',   description: 'Hits HTTP 429 after 10 requests; waits for rate-limit reset; limit undocumented in official docs.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Ravi Sharma',   description: 'Submits production access application via portal; no progress tracker visible after submission.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Approval Queue', description: 'Production key delivered on day 6 — SLA is 5 business days; no automated breach notification sent.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Ravi Sharma',   description: 'First production call succeeds but response schema has renamed field not present in sandbox — no migration guide.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'API Docs Opened',               sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Auth Header Rejected (401)',     sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'GitHub Issue Found',             sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Rate Limit Hit (429)',           sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Production Access Submitted',   sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'SLA Deadline Passed',           sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Production Key Received',       sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Schema Mismatch Detected',      sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Register Sandbox Account',      sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Submit Production Application', sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Approve Production Key',        sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Provision API Key',             sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Implement Backoff Logic',       sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Ravi Sharma (Developer)',       sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'API Vendor Security Team',      sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Developer Relations',           sequence: 16 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'SLA Policy — Production keys must be provisioned within 5 business days of complete application.', sequence: 17 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Security Policy — All production API access requires a completed security questionnaire.', sequence: 18 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Authentication header format',
      sourceA: 'Official API documentation (docs site)',
      claimA: 'The Authorization header should use the format: "Token <api_key>".',
      sourceB: 'GitHub issue #1847 (2 years old) — confirmed by vendor engineer',
      claimB: 'The correct format is "Bearer <api_key>"; the docs were never updated after the auth migration.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Production response schema parity with sandbox',
      sourceA: 'API vendor developer documentation (sandbox section)',
      claimA: 'Sandbox and production environments use an identical response schema.',
      sourceB: 'Ravi Sharma post-integration observation and vendor changelog (private)',
      claimB: 'Production renamed the "user_ref" field to "user_id" three weeks prior; no public migration notice was issued.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'API Developer Onboarding', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'API Vendor Engineering', input: 'API specification, authentication guide', step: '1. Discover API documentation', output: 'Developer understanding of endpoints and auth', customer: 'Developer (Ravi Sharma)' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'API Vendor Portal', input: 'Work email, registration form', step: '2. Register & obtain sandbox credentials', output: 'Sandbox API key, endpoint URL', customer: 'Developer (Ravi Sharma)' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Developer (Ravi Sharma)', input: 'Completed sandbox tests, security questionnaire', step: '3. Apply for production access', output: 'Production access application', customer: 'API Vendor Security Team' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'API Vendor Security Team', input: 'Reviewed application, approval decision', step: '4. Review & approve production access', output: 'Production API key', customer: 'Developer (Ravi Sharma)' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Developer (Ravi Sharma)', input: 'Production API key, integration code', step: '5. Integrate & validate in production', output: 'Working production integration, backoff logic', customer: 'Product / Internal Services' },
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
  const maB1     = newId('ma');
  const maB2     = newId('ma');
  const maC1     = newId('ma');
  const maC2     = newId('ma');
  const maC3     = newId('ma');
  const maD1     = newId('ma');
  const maEnd    = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'API Integration Onboarding Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: lane0Id, projectId: projId, mapId: pmId, label: 'Developer',     order: 0 },
    { id: lane1Id, projectId: projId, mapId: pmId, label: 'API Vendor',    order: 1 },
    { id: lane2Id, projectId: projId, mapId: pmId, label: 'IT Security',   order: 2 },
    { id: lane3Id, projectId: projId, mapId: pmId, label: 'Product Team',  order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart, projectId: projId, mapId: pmId, laneId: lane0Id, type: 'start', label: 'Start',                    note: '',                                                       x: 60,   y: 63  },
    { id: maA1,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Read API Docs',            note: 'Auth format in docs is incorrect; fix only in GitHub.',  x: 280,  y: 58  },
    { id: maA2,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Register Sandbox',         note: 'Sign up and wait for email activation (~4 hours).',      x: 500,  y: 58  },
    { id: maA3,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Test Sandbox Calls',       note: 'Hits undocumented rate limit of 10 calls/min.',          x: 720,  y: 58  },
    { id: maB1,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Provide Sandbox Access',   note: 'Portal auto-provisions credentials after email verify.',  x: 500,  y: 228 },
    { id: maC1,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Receive Application',      note: 'Developer submits 40-question security questionnaire.',   x: 940,  y: 398 },
    { id: maC2,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Review & Approve',         note: 'Manual review; SLA 5 days; actual delivery day 6.',       x: 1160, y: 398 },
    { id: maC3,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Provision Prod Key',       note: 'Key sent by email with no quota documentation.',          x: 1380, y: 398 },
    { id: maB2,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Apply for Prod Access',    note: 'Developer fills production access form in portal.',       x: 940,  y: 228 },
    { id: maD1,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Integrate & Go Live',      note: 'Schema mismatch found on first production call.',         x: 1600, y: 568 },
    { id: maEnd,   projectId: projId, mapId: pmId, laneId: lane3Id, type: 'end',   label: 'End',                      note: '',                                                       x: 1820, y: 573 },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart, toId: maA1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA1,   toId: maA2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA2,   toId: maB1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB1,   toId: maA3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA3,   toId: maB2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maC1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC1,   toId: maC2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC2,   toId: maC3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC3,   toId: maD1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD1,   toId: maEnd, label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procOnboard, type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procSecurity,  toId: procOnboard, type: 'supportsService' },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
