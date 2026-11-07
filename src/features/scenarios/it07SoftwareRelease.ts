// IT-07: Product team releasing software — engineering, quality, change and operations dependencies.

import { newId } from '../../domain/contracts/ids';
import type {
  ProjectManifest, ProcessCandidate, ProcessDefinition, LandscapeRelation,
  Persona, ITSystem, Channel, Touchpoint,
  Journey, JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  PainPoint,
  DiscoveryInterview, DiscoveryInterviewItem, DiscoveryObservation,
  StormingCard, Contradiction,
  SipocDiagram, SipocRow, ProcessMap, MapLane, MapActivity, ProcessMapEdge,
  Service, Capability,
} from '../../domain/contracts/types';
import type { ProcessRating } from '../../domain/scoring';
import type { ScenarioBundle } from './it02SaasOnboarding';

export function buildIT07Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysCICD = newId('sys');
  const sysCAB = newId('sys');
  const sysMonitor = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const tpCAB = newId('tp');
  const tpDeploy = newId('tp');

  const procCoreGroup = newId('proc');  // core-group: Software Delivery
  const procRelease   = newId('proc');
  const procChange    = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcRelease     = newId('svc');
  const svcChangeCtrl  = newId('svc');

  const capCICD        = newId('cap');
  const capChangeGov   = newId('cap');
  const candId1 = newId('cand');
  const candId2 = newId('cand');

  const journeyId = newId('journey');
  const stgPrep = newId('stg');
  const stgApproval = newId('stg');
  const stgDeploy = newId('stg');
  const stgMonitor = newId('stg');
  const stgClosure = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgPrep,     label: 'Complete feature freeze',                order: 0 },
    { stageId: stgPrep,     label: 'Run automated test suite',               order: 1 },
    { stageId: stgPrep,     label: 'Submit change advisory board request',   order: 2 },
    { stageId: stgApproval, label: 'CAB reviews change request',             order: 0 },
    { stageId: stgApproval, label: 'CAB requests rollback plan update',      order: 1 },
    { stageId: stgApproval, label: 'CAB approves with conditions',           order: 2 },
    { stageId: stgDeploy,   label: 'Deploy to staging environment',          order: 0 },
    { stageId: stgDeploy,   label: 'Run smoke tests on staging',             order: 1 },
    { stageId: stgDeploy,   label: 'Deploy to production',                   order: 2 },
    { stageId: stgMonitor,  label: 'Monitor error rates and latency',        order: 0 },
    { stageId: stgMonitor,  label: 'Detect post-deploy regression',          order: 1 },
    { stageId: stgMonitor,  label: 'Rollback production deployment',         order: 2 },
    { stageId: stgClosure,  label: 'File incident report for regression',    order: 0 },
    { stageId: stgClosure,  label: 'Reschedule release with CAB',            order: 1 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Complete feature freeze':               'Sets feature-freeze tag in repo; notifies QA; two pending PRs merged under time pressure',
    'Run automated test suite':              '94% pass rate; 6 flaky tests suppressed as "known issues" to meet deadline',
    'Submit change advisory board request':  'Fills CAB form with deployment window, risk assessment and rollback plan; takes 2 hours',
    'CAB reviews change request':            'CAB meeting is weekly; this release misses Thursday slot; waits 7 days for next meeting',
    'CAB requests rollback plan update':     'Rollback section missing automated verification step; team updates and resubmits',
    'CAB approves with conditions':          'Approved for Saturday 02:00–04:00 window only; deployment cannot happen during business hours',
    'Deploy to staging environment':         'Staging pipeline runs; passes; staging DB is 3 months old — does not reflect current schema',
    'Run smoke tests on staging':            'All smoke tests pass on staging; end-to-end order flow not covered',
    'Deploy to production':                  'Deployment starts at 02:00 as approved; completes in 18 minutes',
    'Monitor error rates and latency':       'First 10 minutes normal; 02:28 — error rate climbs from 0.1% to 4.2%',
    'Detect post-deploy regression':         'New DB index conflicts with existing query pattern; only manifests under real traffic',
    'Rollback production deployment':        'Rollback starts 02:35; completes 02:51; 23 minutes of degraded service',
    'File incident report for regression':   'P2 incident filed; team starts root cause analysis on Monday',
    'Reschedule release with CAB':           'Next available CAB slot is 2 weeks away; feature delivery slips by a sprint',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Complete feature freeze': -1, 'Run automated test suite': 0,
    'Submit change advisory board request': -1, 'CAB reviews change request': -2,
    'CAB requests rollback plan update': -1, 'CAB approves with conditions': 0,
    'Deploy to staging environment': 0, 'Run smoke tests on staging': 1,
    'Deploy to production': 1, 'Monitor error rates and latency': 0,
    'Detect post-deploy regression': -2, 'Rollback production deployment': -2,
    'File incident report for regression': -1, 'Reschedule release with CAB': -2,
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
      title: 'Weekly CAB cadence adds 7-day lead time to every release',
      description: 'CAB meets weekly; missing the Thursday slot delays any release by one full sprint.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[3]], affectedProcessIds: [procChange],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Teams schedule releases for Thursdays only; Friday hotfixes require emergency CAB — rarely granted.',
      hypothesizedCause: 'CAB governance designed for high-risk infrastructure changes applied uniformly to all changes.',
      validatedCause: '', proposedIntervention: 'Introduce low-risk standard change category with pre-approved deployment pattern; bypass CAB for qualifying releases.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Staging DB schema is 3 months stale — does not catch production schema conflicts',
      description: 'Regression DB index conflict only manifests under production traffic pattern; staging DB never refreshed.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[6], stepIds[10]], affectedProcessIds: [procRelease],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'All staging tests pass; production regression discovered 28 minutes post-deploy; rollback required.',
      hypothesizedCause: 'No scheduled staging DB refresh; schema drift accumulates over time.',
      validatedCause: '', proposedIntervention: 'Automate weekly staging DB refresh from anonymised production schema dump.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-07 · Software Release Journey', description: 'Product team experience releasing a backend service: CAB approval, staging deploy, production regression and rollback.', createdAt: now, updatedAt: now, schemaVersion: 2 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Software release management', status: 'accepted', rationale: 'End-to-end release pipeline from freeze to production closure.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Change advisory board approval', status: 'accepted', rationale: 'Distinct governance gate; different stakeholders and cadence.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procChange, title: 'Change advisory board approval', purpose: 'Review and authorize high-risk changes to production systems.', levelLabel: 'management', trigger: 'Change request submitted by delivery team.', outcome: 'Change approved, conditionally approved or rejected; deployment window defined.', inScope: ['Change request review', 'Risk assessment', 'Approval decision', 'Conditions and window assignment'], outOfScope: ['Technical deployment execution'], status: 'draft', serviceIds: [svcChangeCtrl], capabilityIds: [capChangeGov], systemIds: [sysCAB], evidenceIds: [] },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'Software Delivery',
      purpose: 'Deliver tested software changes to production on a sprint cadence, with safe rollback capability.',
      levelLabel: 'core-group',
      trigger: 'Sprint ends and release candidate is ready for CAB submission.',
      outcome: 'Release deployed and stable in production, or rolled back and rescheduled.',
      inScope: ['Feature freeze', 'CAB submission', 'Staging deploy', 'Production deploy', 'Post-deploy monitoring', 'Rollback'],
      outOfScope: ['CAB policy definition', 'Bug triage and prioritisation'],
      status: 'draft', serviceIds: [svcRelease, svcChangeCtrl], capabilityIds: [capCICD, capChangeGov], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procRelease, title: 'Software release management', purpose: 'Deliver tested software changes to production safely and predictably.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Sprint ends and feature freeze is set.', outcome: 'Release deployed to production; rollback plan executed if regression detected.', inScope: ['Feature freeze', 'Test execution', 'Staging deployment', 'Production deployment', 'Post-deploy monitoring', 'Rollback'], outOfScope: ['CAB governance', 'Bug investigation'], status: 'draft', serviceIds: [svcRelease], capabilityIds: [capCICD], systemIds: [sysCICD, sysMonitor], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Priya Kapoor', role: 'Engineering Lead', goals: ['Ship features on sprint cadence', 'Avoid production regressions', 'Navigate change governance without delays'], needs: ['Predictable approval process', 'Staging environment that reflects production', 'Automated rollback trigger'], constraints: ['Cannot bypass CAB for standard changes', 'Production deploys must be in approved window', 'On-call during own release window'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysCICD,   name: 'CI/CD Pipeline',           type: 'internal', criticality: 'critical', supportingRole: 'Build, test, staging and production deployment automation.', evidenceIds: [] },
    { projectId: projId, id: sysCAB,    name: 'Change Management System', type: 'internal', criticality: 'high',     supportingRole: 'Change request submission, CAB workflow and approval records.', evidenceIds: [] },
    { projectId: projId, id: sysMonitor, name: 'Observability Platform',  type: 'saas',     criticality: 'critical', supportingRole: 'Error rates, latency and rollback trigger monitoring.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chEmail, name: 'Email', type: 'email' }, { projectId: projId, id: chPortal, name: 'Change Portal', type: 'portal' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpCAB,    name: 'CAB change request form', purpose: 'Submit and track change approval requests.', channelId: chPortal, systemIds: [sysCAB],     recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpDeploy, name: 'CI/CD deployment dashboard', purpose: 'Monitor pipeline progress and trigger rollbacks.', channelId: chPortal, systemIds: [sysCICD], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'Software Release — Backend Service',
    goal: 'Deploy a sprint release to production safely within the approved maintenance window.',
    situation: "Engineering lead navigates weekly CAB, discovers a stale staging environment, deploys to production, encounters a DB index regression at 02:28, and rolls back. Release rescheduled two weeks.",
    perspective: 'developer', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgPrep, stgApproval, stgDeploy, stgMonitor, stgClosure],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgPrep,     journeyId, title: 'Preparation', description: '', order: 0 },
    { projectId: projId, id: stgApproval, journeyId, title: 'CAB Approval', description: '', order: 1 },
    { projectId: projId, id: stgDeploy,   journeyId, title: 'Deployment',  description: '', order: 2 },
    { projectId: projId, id: stgMonitor,  journeyId, title: 'Monitoring',  description: '', order: 3 },
    { projectId: projId, id: stgClosure,  journeyId, title: 'Closure',     description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Priya Kapoor', role: 'Engineering Lead', date: '2024-11-11', notes: 'Interviewed 10 days after the rollback incident. Had a Confluence timeline doc open during the interview. Very precise about the 7-day CAB delay impact on sprint planning.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'David Marsh', role: 'CAB Chair', date: '2024-11-12', notes: 'Has chaired the weekly CAB for 3 years. Defensive about the weekly cadence. Acknowledged the standard change category idea but noted it needs policy backing.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Yuki Tanaka', role: 'QA Engineer', date: '2024-11-12', notes: 'Has worked with Priya\'s team for 18 months. Flagged the staging DB staleness issue in a retrospective 6 months ago — no action taken. Frustrated.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'We missed the Thursday CAB slot by one day. The next slot was 7 days later. That\'s a full sprint delay just because of a calendar constraint. We ended up sneaking a hotfix through emergency CAB — which is exactly what emergency CAB is not supposed to be for.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The staging environment passed every test. The regression only appeared under real traffic because staging hasn\'t been refreshed in three months. The DB index conflict didn\'t exist in staging — it was a schema that production had migrated to in August.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Why does every change go through the same weekly CAB? A one-line config change and a database migration have the same governance overhead. That can\'t be right.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'CAB is weekly because we need attendance from Security, Operations and Finance. Getting those three groups together more often than weekly is not practical.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'About 40% of what comes to CAB is genuinely low-risk. If we had a formal standard change category with pre-approved patterns, I could remove those from the meeting entirely.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The rollback plan requirement is there for good reason — but the rollback plan field in the form is a free-text box. We get everything from one-liners to ten-page documents. There\'s no template.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'I raised the staging DB staleness issue in the November retrospective last year. It\'s been on the backlog for 11 months. We keep deprioritising it because it\'s infrastructure work and nobody owns it formally.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'We run smoke tests on staging but they don\'t cover the full order flow — only the happy path. The regression was on a combined write pattern that only the end-to-end test suite would catch, and we don\'t have one.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'If we automated a weekly anonymised schema dump from production to staging, could we also automate a schema drift alert? So we know before a release if staging is out of sync?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Engineering Lead',  description: 'Fills in CAB change request form. 14 required fields. Spends most time on "Risk Assessment" and "Rollback Plan" — no template provided. Total form completion time: 2h 05m.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Engineering Lead',  description: 'Submits CAB request on Friday. Realises Thursday meeting has already occurred. Next available CAB slot is in 7 days. Sprint planning for next cycle happens in 5 days — release now misses the sprint commitment.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'CAB',               description: 'CAB meeting review: rollback plan resubmitted after first rejection. Original rollback plan lacked automated verification step. Resubmission approved with condition: Saturday 02:00–04:00 window only.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'QA Engineer',       description: 'Runs smoke test suite on staging at 23:00 Friday. 100% pass rate. Test suite covers 8 of 14 critical user flows. The DB index conflict path is not in any existing test case.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Engineering Lead',  description: 'Production deployment completes at 02:18. First 10 minutes show normal error rates. At 02:28 error rate climbs from 0.1% to 4.2%. On-call engineer alerts Priya. Rollback decision made at 02:34 — 6 minutes of internal discussion.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Engineering Lead',  description: 'Post-rollback root cause analysis: a DB index added in the August schema migration conflicts with a query pattern in the new code. The index existed in production but not in the 3-month-stale staging DB. No test covered this query shape.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Engineering Lead & CAB Chair', description: 'Priya emails CAB chair Monday to reschedule. Next available slot with correct attendees is in 2 weeks (holiday period). Priya must present the same change request again with an addendum explaining the regression. Feature delivery slips by one full sprint.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Feature Freeze Set',                sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'CAB Request Submitted',             sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'CAB Approved with Conditions',      sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Staging Tests Passed',              sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Production Deployed',               sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Regression Detected',               sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Rollback Completed',                sequence: 13 },
    // Commands
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Submit CAB Change Request',         sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Review and Approve Change',         sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Deploy to Staging',                 sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Deploy to Production',              sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Trigger Rollback',                  sequence: 10 },
    // Actors
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Engineering Lead',                  sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Change Advisory Board',             sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'CI/CD Pipeline',                    sequence: 16 },
    // Policies
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'CAB Approval Policy — all production changes require weekly CAB review; no standard change category for pre-approved low-risk patterns', sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Deployment Window Policy — CAB-approved changes may only deploy in the specified maintenance window (typically Saturday 02:00–04:00)', sequence: 17 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Staging environment fidelity',
      sourceA: 'CI/CD pipeline documentation — staging environment spec',
      claimA: 'The staging environment mirrors the production stack and is refreshed with each sprint deployment.',
      sourceB: 'Yuki Tanaka — QA Engineer (2024-11-12)',
      claimB: 'Staging hasn\'t had a DB refresh in three months. The schema drift between staging and production is the reason the regression wasn\'t caught. I\'ve flagged this multiple times.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'CAB change throughput vs. delivery velocity',
      sourceA: 'David Marsh — CAB Chair (2024-11-12)',
      claimA: 'The weekly cadence is necessary to coordinate Security, Operations and Finance. Meeting more frequently is not feasible.',
      sourceB: 'Priya Kapoor — Engineering Lead (2024-11-11)',
      claimB: 'Missing the Thursday slot cost us a full sprint delay. We ended up routing a standard deployment through emergency CAB, which undermines the entire governance model.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Software Release & Change Management', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'Engineering team\nProduct owner', input: 'Sprint deliverables\nFeature freeze commit', step: '1. Complete feature freeze and testing', output: 'Tested release candidate\nTest report', customer: 'QA Engineer\nCAB' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Engineering Lead\nChange Management System', input: 'Change request form\nRisk assessment\nRollback plan', step: '2. Submit and get CAB approval', output: 'Approved change with deployment window', customer: 'Engineering team\nRelease Management' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'CI/CD Pipeline\nQA Engineer', input: 'Release candidate\nStaging environment', step: '3. Deploy to staging and validate', output: 'Staging test results\nSmoke test sign-off', customer: 'Engineering Lead\nCAB' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'CI/CD Pipeline\nRelease Manager', input: 'Approved release\nDeployment window', step: '4. Deploy to production', output: 'Live release\nDeployment log', customer: 'End users\nObservability platform' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Observability platform\nOn-call engineer', input: 'Error rate alerts\nLatency metrics', step: '5. Post-deploy monitoring and rollback', output: 'Stable production or rolled-back release\nIncident report', customer: 'Engineering Lead\nCAB (reschedule)' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneEngId = newId('ml');
  const laneQAId  = newId('ml');
  const laneCABId = newId('ml');
  const laneRelId = newId('ml');

  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart    = newId('ma');
  const maFreeze   = newId('ma');
  const maTests    = newId('ma');
  const maCABSubmit = newId('ma');
  const maCABReview = newId('ma');
  const maCABApprv = newId('ma');
  const maStaging  = newId('ma');
  const maSmokeTest = newId('ma');
  const maProdDeploy = newId('ma');
  const maMonitor  = newId('ma');
  const maRollback = newId('ma');
  const maEnd      = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Software Release & Change Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneEngId, projectId: projId, mapId: pmId, label: 'Engineering',         order: 0 },
    { id: laneQAId,  projectId: projId, mapId: pmId, label: 'QA',                  order: 1 },
    { id: laneCABId, projectId: projId, mapId: pmId, label: 'CAB',                 order: 2 },
    { id: laneRelId, projectId: projId, mapId: pmId, label: 'Release Management',  order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,     projectId: projId, mapId: pmId, laneId: laneEngId,  type: 'start', label: 'Start',                     note: '', x: 60,   y: ly(0, 44) },
    { id: maFreeze,    projectId: projId, mapId: pmId, laneId: laneEngId,  type: 'task',  label: 'Feature freeze',            note: 'Two PRs merged under time pressure; 6 flaky tests suppressed', x: 280,  y: ly(0, 54) },
    { id: maTests,     projectId: projId, mapId: pmId, laneId: laneQAId,   type: 'task',  label: 'Run automated test suite',  note: '94% pass rate; end-to-end order flow not covered', x: 500,  y: ly(1, 54) },
    { id: maCABSubmit, projectId: projId, mapId: pmId, laneId: laneEngId,  type: 'task',  label: 'Submit CAB request',        note: '14-field form; 2h completion time; no template for rollback plan', x: 720,  y: ly(0, 54) },
    { id: maCABReview, projectId: projId, mapId: pmId, laneId: laneCABId,  type: 'task',  label: 'CAB weekly review',         note: 'Meets Thursdays only; missing slot = 7-day delay', x: 940,  y: ly(2, 54) },
    { id: maCABApprv,  projectId: projId, mapId: pmId, laneId: laneCABId,  type: 'task',  label: 'CAB approves with conditions', note: 'Saturday 02:00–04:00 window only; rollback plan resubmission required', x: 1160, y: ly(2, 54) },
    { id: maStaging,   projectId: projId, mapId: pmId, laneId: laneRelId,  type: 'task',  label: 'Deploy to staging',         note: 'Staging DB 3 months stale — missing Aug schema migration', x: 1160, y: ly(3, 54) },
    { id: maSmokeTest, projectId: projId, mapId: pmId, laneId: laneQAId,   type: 'task',  label: 'Staging smoke tests',       note: 'All pass — DB index conflict not in any test case', x: 1380, y: ly(1, 54) },
    { id: maProdDeploy, projectId: projId, mapId: pmId, laneId: laneRelId, type: 'task',  label: 'Deploy to production',      note: 'Deploys at 02:00; completes 02:18; first 10 min normal', x: 1600, y: ly(3, 54) },
    { id: maMonitor,   projectId: projId, mapId: pmId, laneId: laneEngId,  type: 'task',  label: 'Monitor post-deploy',       note: 'Error rate 0.1% → 4.2% at 02:28; regression under real traffic', x: 1820, y: ly(0, 54) },
    { id: maRollback,  projectId: projId, mapId: pmId, laneId: laneRelId,  type: 'task',  label: 'Rollback production',       note: 'Decision at 02:34; rollback completes 02:51; 23 min degraded service', x: 2040, y: ly(3, 54) },
    { id: maEnd,       projectId: projId, mapId: pmId, laneId: laneEngId,  type: 'end',   label: 'End',                       note: '', x: 2260, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,      toId: maFreeze,     label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maFreeze,     toId: maTests,      label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maTests,      toId: maCABSubmit,  label: 'QA sign-off' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maCABSubmit,  toId: maCABReview,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maCABReview,  toId: maCABApprv,   label: 'Approved' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maCABApprv,   toId: maStaging,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStaging,    toId: maSmokeTest,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSmokeTest,  toId: maProdDeploy, label: 'Passed' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maProdDeploy, toId: maMonitor,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maMonitor,    toId: maRollback,   label: 'Regression' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maRollback,   toId: maEnd,        label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procRelease, type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procChange,    toId: procRelease, type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcRelease,    projectId: projId, name: 'Software Release', customerOutcome: 'Tested software changes deployed to production safely on sprint cadence with automated rollback on regression.', scope: 'Feature freeze, test execution, staging and production deployment, post-deploy monitoring and rollback.' },
    { id: svcChangeCtrl, projectId: projId, name: 'Change Control', customerOutcome: 'High-risk production changes reviewed and authorized within defined windows to protect service stability.', scope: 'Change request review, CAB approval, conditions and deployment window assignment.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capCICD,      projectId: projId, name: 'CI/CD Delivery Pipeline', description: 'Ability to build, test, stage and deploy software to production with automated rollback on failure.', realizingProcessIds: [procRelease, procCoreGroup] },
    { id: capChangeGov, projectId: projId, name: 'Change Governance', description: 'Ability to review, risk-assess and approve production changes via a structured CAB process.', realizingProcessIds: [procChange, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procChange}__default`,     projectId: projId, processId: procChange,     configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procCoreGroup}__default`,  projectId: projId, processId: procCoreGroup,  configId: 'default', ratings: { strategic_impact: 5, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procRelease}__default`,    projectId: projId, processId: procRelease,    configId: 'default', ratings: { strategic_impact: 5, pain_severity: 4, feasibility: 3, volume: 5 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
