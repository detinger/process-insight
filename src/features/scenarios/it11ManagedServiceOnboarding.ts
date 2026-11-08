// IT-11: Enterprise onboarding a managed-service provider — cross-company architecture and governance. (Capstone)

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
import type { ScenarioBundle } from './it01SaasOnboarding';

export function buildIT11Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysCMDB = newId('sys');
  const sysITSM = newId('sys');
  const sysMonitor = newId('sys');
  const sysContract = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const chPhone = newId('ch');
  const tpKickoff = newId('tp');
  const tpRunbook = newId('tp');
  const tpServiceReview = newId('tp');

  const procCoreGroup    = newId('proc');  // core-group: Managed Service Delivery
  const procDiscover     = newId('proc');
  const procTransition   = newId('proc');
  const procOpsReadiness = newId('proc');
  const procGovernance   = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcManagedOps   = newId('svc');
  const svcTransition   = newId('svc');
  const svcGovernance   = newId('svc');

  const capL1L2Support  = newId('cap');
  const capKnowledge    = newId('cap');
  const capScopeAgree   = newId('cap');

  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');
  const candId4 = newId('cand');

  const journeyId = newId('journey');
  const stgDiscover = newId('stg');
  const stgTransition = newId('stg');
  const stgOperational = newId('stg');
  const stgReview = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgDiscover,    label: 'Joint discovery workshop',                    order: 0 },
    { stageId: stgDiscover,    label: 'Document current-state service architecture', order: 1 },
    { stageId: stgDiscover,    label: 'Agree service scope and exclusions',          order: 2 },
    { stageId: stgTransition,  label: 'MSP establishes CMDB access',                order: 0 },
    { stageId: stgTransition,  label: 'Create joint runbooks and escalation paths',  order: 1 },
    { stageId: stgTransition,  label: 'Shadow support for 4 weeks',                  order: 2 },
    { stageId: stgTransition,  label: 'Hypercare period begins',                     order: 3 },
    { stageId: stgOperational, label: 'MSP takes over L1/L2 support',               order: 0 },
    { stageId: stgOperational, label: 'First major incident under MSP',             order: 1 },
    { stageId: stgOperational, label: 'Escalation to customer internal team',        order: 2 },
    { stageId: stgOperational, label: 'Joint post-incident review',                  order: 3 },
    { stageId: stgReview,      label: 'Monthly service review meeting',              order: 0 },
    { stageId: stgReview,      label: 'Review SLA and continual improvement items',  order: 1 },
    { stageId: stgReview,      label: 'Adjust service scope for next quarter',       order: 2 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Joint discovery workshop':                   'Two-day workshop; customer teams incomplete; 15 undocumented legacy services identified',
    'Document current-state service architecture': 'Architecture doc 60% complete; 3 integration owners unavailable; gaps accepted as assumptions',
    'Agree service scope and exclusions':          'Scope agreed for 42 of 57 services; 15 deferred — unclear ownership; decision documented',
    'MSP establishes CMDB access':                 'Read access granted; CMDB out of date by 8 months; MSP must verify against actual infrastructure',
    'Create joint runbooks and escalation paths':  'Runbooks created for top 20 scenarios; escalation paths contested by customer L3 team',
    'Shadow support for 4 weeks':                  'MSP shadows successfully for most ticket types; 3 ticket categories have no documented process',
    'Hypercare period begins':                     'Customer SMEs on-call; response time target 15 minutes; SMEs still handling own BAU work',
    'MSP takes over L1/L2 support':               'Formal transition complete; ticket volumes 20% higher than contract estimate',
    'First major incident under MSP':             'Network outage at 03:00; MSP triages for 90 min before realising it is a hardware fault',
    'Escalation to customer internal team':        'Customer network team woken at 04:30; 20-minute handover delay due to unclear escalation path',
    'Joint post-incident review':                  'PIR identifies 4 runbook gaps; customer blames MSP; MSP blames undocumented legacy config',
    'Monthly service review meeting':              'First review: 2 of 5 SLA metrics missed; customer team has not read MSP performance report',
    'Review SLA and continual improvement items':  'SLA renegotiated for two metrics; 6 improvement items agreed; owners not assigned',
    'Adjust service scope for next quarter':       '3 of 15 deferred services added to scope; discovery still incomplete for 2 of them',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Joint discovery workshop': -1, 'Document current-state service architecture': -1,
    'Agree service scope and exclusions': 0, 'MSP establishes CMDB access': -1,
    'Create joint runbooks and escalation paths': -1, 'Shadow support for 4 weeks': 0,
    'Hypercare period begins': -1, 'MSP takes over L1/L2 support': 0,
    'First major incident under MSP': -2, 'Escalation to customer internal team': -2,
    'Joint post-incident review': -1, 'Monthly service review meeting': -1,
    'Review SLA and continual improvement items': 0, 'Adjust service scope for next quarter': 0,
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
      title: 'Stale CMDB causes MSP to verify infrastructure manually — doubles discovery effort',
      description: 'CMDB 8 months out of date; MSP cannot rely on it; must discover actual state through direct system queries.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[3]], affectedProcessIds: [procDiscover],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Discovery phase takes twice as long; 15 undocumented services still unknown at transition.',
      hypothesizedCause: 'CMDB updates are manual; IT teams skip updates during project delivery peaks.',
      validatedCause: '', proposedIntervention: 'Automate CMDB discovery with network scanning tool; block MSP transition gate if CMDB confidence below threshold.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Contested escalation path causes 20-minute delay during first major incident',
      description: "L3 escalation path not agreed between customer and MSP; MSP contacts wrong person at 04:30.",
      severity: 'critical', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[9]], affectedProcessIds: [procTransition, procGovernance],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Major incident resolution delayed 20 minutes; customer L3 team woken unnecessarily; trust damaged.',
      hypothesizedCause: 'Escalation matrix signed off at manager level; individual engineers not briefed on expectations.',
      validatedCause: '', proposedIntervention: 'Publish escalation matrix to all engineers; run a live escalation drill before hypercare ends.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-11 · Managed Service Onboarding Journey (Capstone)', description: 'Enterprise experience onboarding a managed-service provider: discovery, transition, first incident and service review. Capstone scenario with cross-company process architecture.', createdAt: now, updatedAt: now, schemaVersion: 2 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Service discovery and scope agreement', status: 'accepted', rationale: 'Foundational joint process; defines the boundary for all subsequent managed services.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Knowledge transfer and transition', status: 'accepted', rationale: 'Time-bounded process; different roles and deliverables from steady-state operations.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId3, title: 'Managed service delivery and incident management', status: 'accepted', rationale: 'Ongoing operational process; jointly owned by MSP and customer.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId4, title: 'Service governance and continual improvement', status: 'proposed', rationale: 'Review cadence and SLA management process; often treated as an afterthought.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procGovernance, title: 'Service governance and continual improvement', purpose: 'Review service performance, resolve scope disputes and agree improvement actions on a regular cadence.', levelLabel: 'management', trigger: 'Monthly governance review meeting.', outcome: 'SLA review complete; improvement items agreed with owners; scope changes scoped for next quarter.', inScope: ['SLA performance review', 'Improvement backlog management', 'Scope change requests', 'Contract alignment'], outOfScope: ['Day-to-day incident management'], status: 'draft', serviceIds: [svcGovernance], capabilityIds: [], systemIds: [sysContract], evidenceIds: [] },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'Managed Service Delivery',
      purpose: 'Deliver ongoing L1/L2 support for in-scope services, from first ticket through escalation and post-incident review.',
      levelLabel: 'core-group',
      trigger: 'Support ticket raised or monitoring alert fires.',
      outcome: 'Incident resolved or escalated within SLA; SLA metrics recorded.',
      inScope: ['L1/L2 ticket handling', 'Incident triage', 'L3 escalation', 'Post-incident review', 'SLA reporting'],
      outOfScope: ['Service scope changes', 'Knowledge transfer and onboarding'],
      status: 'draft', serviceIds: [svcManagedOps, svcTransition, svcGovernance], capabilityIds: [capL1L2Support, capKnowledge, capScopeAgree], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procOpsReadiness, title: 'Managed service delivery and incident management', purpose: 'Deliver L1/L2 support for in-scope services and escalate incidents within agreed SLA.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Support ticket raised or monitoring alert fires.', outcome: 'Incident resolved or escalated; SLA metrics recorded; customer notified.', inScope: ['L1/L2 ticket handling', 'Incident triage', 'L3 escalation', 'Post-incident review'], outOfScope: ['Service scope changes', 'Capital projects'], status: 'draft', serviceIds: [svcManagedOps], capabilityIds: [capL1L2Support], systemIds: [sysITSM, sysMonitor], evidenceIds: [] },
    // ── Support layer ─────────────────────────────────────────────────────────
    { projectId: projId, id: procDiscover, title: 'Service discovery and scope agreement', purpose: 'Establish a shared, accurate picture of services to be managed and those explicitly excluded.', levelLabel: 'support', trigger: 'MSP engagement signed; joint onboarding begins.', outcome: 'Agreed service scope, CMDB baseline and known gaps documented.', inScope: ['Discovery workshops', 'Architecture documentation', 'CMDB verification', 'Scope agreement'], outOfScope: ['Runbook creation', 'Support transition'], status: 'draft', serviceIds: [svcTransition], capabilityIds: [capScopeAgree], systemIds: [sysCMDB], evidenceIds: [] },
    { projectId: projId, id: procTransition, title: 'Knowledge transfer and transition', purpose: 'Enable the MSP to operate managed services independently through shadowing, runbook creation and hypercare.', levelLabel: 'support', trigger: 'Service scope agreed and CMDB access granted.', outcome: 'MSP can independently handle L1/L2 for all in-scope services; escalation paths agreed.', inScope: ['Runbook creation', 'Shadow period', 'Hypercare', 'Escalation path sign-off'], outOfScope: ['Steady-state service delivery', 'Service scope changes'], status: 'draft', serviceIds: [svcTransition], capabilityIds: [capKnowledge], systemIds: [sysCMDB, sysITSM], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Thomas Berg', role: 'Head of IT Operations (Customer)', goals: ['Transfer L1/L2 burden to MSP within 3 months', 'Maintain service quality above pre-MSP baseline', 'Avoid escalation conflicts during hypercare'], needs: ['Accurate CMDB before transition', 'Clear and tested escalation paths', 'Transparent SLA reporting from day one'], constraints: ['Internal L3 team must maintain BAU during transition', 'Cannot extend hypercare beyond 6 weeks', 'Contract SLAs fixed for first 12 months'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysCMDB,    name: 'Configuration Management Database (CMDB)', type: 'internal', criticality: 'critical', supportingRole: 'Service inventory, dependency mapping and asset record of truth.', evidenceIds: [] },
    { projectId: projId, id: sysITSM,    name: 'Shared ITSM Platform',                    type: 'saas',     criticality: 'critical', supportingRole: 'Joint ticket management, SLA tracking and escalation routing.', evidenceIds: [] },
    { projectId: projId, id: sysMonitor, name: 'Joint Monitoring Platform',               type: 'saas',     criticality: 'high',     supportingRole: 'Shared alerting and dashboard access for both customer and MSP teams.', evidenceIds: [] },
    { projectId: projId, id: sysContract, name: 'Contract and SLA Management System',     type: 'internal', criticality: 'medium',   supportingRole: 'SLA definitions, governance calendar and improvement tracking.', evidenceIds: [] },
  ];
  const channels: Channel[] = [
    { projectId: projId, id: chEmail,  name: 'Email',  type: 'email' },
    { projectId: projId, id: chPortal, name: 'Portal', type: 'portal' },
    { projectId: projId, id: chPhone,  name: 'Phone',  type: 'phone' },
  ];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpKickoff,       name: 'Joint discovery workshop session',   purpose: 'Align both teams on service scope and architecture.',     channelId: chPhone,  systemIds: [],         recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpRunbook,       name: 'Shared runbook and ITSM portal',    purpose: 'Collaboration on runbook authoring and ticket handling.', channelId: chPortal, systemIds: [sysITSM],  recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpServiceReview, name: 'Monthly service review report',      purpose: 'SLA performance and improvement items delivered by MSP.', channelId: chEmail,  systemIds: [sysContract], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'Managed Service Onboarding — IT Operations (Capstone)',
    goal: 'Successfully hand over L1/L2 support to an MSP within 3 months, maintaining service quality.',
    situation: "Head of IT Operations onboards an MSP. CMDB is stale. Escalation path contested. First major incident at 03:00 reveals gaps. Monthly review shows 2 SLA breaches. Scope adjustment starts Q2.",
    perspective: 'employee', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgDiscover, stgTransition, stgOperational, stgReview],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgDiscover,    journeyId, title: 'Discovery',   description: '', order: 0 },
    { projectId: projId, id: stgTransition,  journeyId, title: 'Transition',  description: '', order: 1 },
    { projectId: projId, id: stgOperational, journeyId, title: 'Operations',  description: '', order: 2 },
    { projectId: projId, id: stgReview,      journeyId, title: 'Review',      description: '', order: 3 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Thomas Berg',    role: 'Head of IT Operations', date: '2024-07-10', notes: 'Thomas said the stale CMDB doubled MSP discovery effort and nearly derailed the transition timeline.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Amara Okonkwo',  role: 'MSP Project Manager',   date: '2024-07-12', notes: 'Amara flagged the escalation path ambiguity as the highest risk during the first incident.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Lars Eriksson',  role: 'Internal L3 Lead',      date: '2024-07-14', notes: 'Lars noted the KT sessions were compressed; engineers left without enough context to handle edge cases alone.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: '"Our CMDB was 8 months out of date. The MSP had to rediscover everything manually — it doubled the discovery phase time."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The contested escalation path caused a 20-minute delay at the start of the first major incident at 03:00; both teams were waiting for the other to act.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Who owns the CMDB update process going forward — customer IT or MSP — and how often should it be verified?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: '"At 03:00 we escalated to L3 as per the runbook, but the customer team said that path was for P1 only. It took 20 minutes to agree who should own it."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The MSP runbook had an outdated escalation matrix that did not reflect the agreed RACI from the final contract.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'question', text: 'Should a joint war game exercise be run before go-live to validate escalation paths under pressure?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: '"We had 1 hour allocated for each KT session. We got through maybe 60% of the content. The engineers went into hypercare without the full picture."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'KT sessions were scheduled for 1 hour per service area but each session required at least 2.5–3 hours to cover adequately.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Can KT sessions be recorded and followed up with a written Q&A period to cover content that did not fit within the slot?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Amara Okonkwo', description: 'MSP runs discovery workshops; CMDB found 8 months stale; manual infrastructure rediscovery required across 40 assets.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Amara Okonkwo', description: 'Manual rediscovery adds 3 weeks to transition timeline; KT sessions compressed from 3h to 1h slots to recover schedule.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Lars Eriksson', description: 'Runs compressed KT sessions; covers 60% of planned content; engineers confirm runbook coverage is incomplete.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'MSP L2 Agent', description: 'Major incident at 03:00; MSP escalates to L3 per runbook; customer team disputes ownership — 20-minute resolution gap.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Thomas Berg',   description: 'Emergency call at 03:20 to agree escalation path; both teams unclear on P2 vs P1 boundary in runbook.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Thomas Berg',   description: 'Monthly service review shows 2 SLA breaches; root cause linked to incomplete KT and stale CMDB.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Amara Okonkwo', description: 'Improvement plan agreed at review: CMDB refresh scheduled, escalation matrix rewritten, additional KT sessions booked.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'CMDB Found 8 Months Stale',       sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Manual Rediscovery Started',       sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'KT Sessions Compressed',           sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Major Incident at 03:00',          sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Escalation Path Contested',        sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'SLA Breaches Reported (Month 1)',  sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Improvement Plan Agreed',          sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Escalation Matrix Revised',        sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Run Discovery Workshops',          sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Rediscover Infrastructure',        sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Conduct KT Sessions',              sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Escalate to L3',                   sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Resolve Escalation Dispute',       sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Thomas Berg (Head of IT Ops)',     sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Amara Okonkwo (MSP PM)',           sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Lars Eriksson (Internal L3 Lead)', sequence: 16 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Escalation Policy — All P1/P2 incidents must follow the RACI matrix; L3 escalation requires L2 confirmation first.', sequence: 17 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'CMDB Policy — CMDB must be verified and updated before any major infrastructure change or service transition begins.', sequence: 18 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Escalation path for P2 incidents during hypercare',
      sourceA: 'MSP runbook (escalation matrix — hypercare version)',
      claimA: 'P2 incidents during hypercare should be escalated to customer L3 immediately if MSP L2 cannot resolve within 15 minutes.',
      sourceB: 'Customer IT operations RACI (final contract version)',
      claimB: 'P2 incidents during hypercare are owned by MSP until resolution; L3 escalation is at customer discretion, not automatic.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'CMDB accuracy at transition start',
      sourceA: 'Customer IT pre-transition statement to MSP',
      claimA: 'The CMDB is current and can be used as the primary reference for infrastructure discovery.',
      sourceB: 'Amara Okonkwo post-discovery assessment',
      claimB: 'CMDB was 8 months out of date; 40% of assets required manual verification; 12 assets were missing entirely.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Managed Service Transition', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'Thomas Berg, Heidi Brandt (asset owners)', input: 'CMDB access, infrastructure documentation, service scope', step: '1. Discovery and scope agreement', output: 'Agreed service scope, CMDB baseline, gap register', customer: 'MSP (Amara Okonkwo), IT Management' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Lars Eriksson, Customer IT engineers', input: 'Architecture knowledge, runbook templates, access credentials', step: '2. Knowledge transfer and runbook creation', output: 'Completed runbooks, access provisioned, KT sign-off', customer: 'MSP L2/L3 engineers' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'MSP L2 agents, joint monitoring platform', input: 'Monitoring alerts, incident tickets, escalation matrix', step: '3. Hypercare operations and incident handling', output: 'Resolved incidents, SLA records, escalation log', customer: 'End Users, Thomas Berg, IT Management' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'MSP (Amara Okonkwo), Thomas Berg', input: 'SLA performance data, incident log, improvement backlog', step: '4. Monthly service review', output: 'SLA review report, improvement actions, scope changes', customer: 'IT Management, End Users' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Thomas Berg, MSP', input: 'Steady-state metrics, agreed improvements, updated RACI', step: '5. Transition to steady state', output: 'Hypercare closed, steady-state BAU delivery begins', customer: 'End Users, Business Operations' },
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
  const maB3     = newId('ma');
  const maC1     = newId('ma');
  const maD1     = newId('ma');
  const maEnd    = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Managed Service Onboarding Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: lane0Id, projectId: projId, mapId: pmId, label: 'Customer IT',    order: 0 },
    { id: lane1Id, projectId: projId, mapId: pmId, label: 'MSP',            order: 1 },
    { id: lane2Id, projectId: projId, mapId: pmId, label: 'IT Management',  order: 2 },
    { id: lane3Id, projectId: projId, mapId: pmId, label: 'End Users',      order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart, projectId: projId, mapId: pmId, laneId: lane0Id, type: 'start', label: 'Start',                 note: '',                                                                  x: 60,   y: 63  },
    { id: maA1,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Grant CMDB Access',     note: 'CMDB found 8 months stale; MSP must rediscover manually.',          x: 280,  y: 58  },
    { id: maB1,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Run Discovery',         note: 'Manual rediscovery adds 3 weeks; scope agreed with 12 gaps.',       x: 500,  y: 228 },
    { id: maA2,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Conduct KT Sessions',   note: 'Compressed 3h content into 1h slots; 40% of content missed.',       x: 720,  y: 58  },
    { id: maB2,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Write Runbooks',        note: 'MSP writes runbooks from compressed KT; escalation matrix outdated.', x: 720, y: 228 },
    { id: maC1,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Approve Go-Live',       note: 'Management signs off on hypercare start despite known gaps.',          x: 940,  y: 398 },
    { id: maB3,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Handle First Incident', note: 'Major incident at 03:00; 20-min delay due to disputed escalation path.', x: 1160, y: 228 },
    { id: maA3,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Monthly Review',        note: '2 SLA breaches reported; root causes linked to stale CMDB and KT gaps.', x: 1380, y: 58  },
    { id: maA4,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Agree Improvements',    note: 'CMDB refresh, revised escalation matrix, and extra KT sessions agreed.', x: 1600, y: 58  },
    { id: maD1,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Receive BAU Service',   note: 'End users transition to steady-state MSP-delivered support.',           x: 1600, y: 568 },
    { id: maEnd,   projectId: projId, mapId: pmId, laneId: lane3Id, type: 'end',   label: 'End',                   note: '',                                                                  x: 1820, y: 573 },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart, toId: maA1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA1,   toId: maB1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB1,   toId: maA2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA2,   toId: maB2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maC1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC1,   toId: maB3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB3,   toId: maA3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA3,   toId: maA4,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA4,   toId: maD1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD1,   toId: maEnd, label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup,  toId: procOpsReadiness, type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procDiscover,   toId: procOpsReadiness, type: 'supportsService' },
    { id: newId('rel'), projectId: projId, fromId: procTransition, toId: procOpsReadiness, type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcManagedOps, projectId: projId, name: 'Managed IT Operations', customerOutcome: 'L1/L2 incidents resolved within SLA by MSP; customer IT team freed for strategic work.', scope: 'L1/L2 ticket handling, incident triage, L3 escalation and SLA reporting for in-scope services.' },
    { id: svcTransition, projectId: projId, name: 'MSP Transition & Knowledge Transfer', customerOutcome: 'MSP can independently operate all in-scope services within 3 months of engagement start.', scope: 'Service discovery, CMDB baseline, runbook creation, shadow period, hypercare and escalation sign-off.' },
    { id: svcGovernance, projectId: projId, name: 'Service Governance & Improvement', customerOutcome: 'SLA compliance tracked and improvement actions agreed monthly in a structured review.', scope: 'Monthly service reviews, SLA performance reporting, improvement backlog and scope change management.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capScopeAgree,  projectId: projId, name: 'Service Scope Agreement', description: 'Ability to establish a shared, documented and CMDB-verified service scope before transition begins.', realizingProcessIds: [procDiscover, procCoreGroup] },
    { id: capKnowledge,   projectId: projId, name: 'Knowledge Transfer & Runbook Delivery', description: 'Ability to transfer operational knowledge to MSP via shadowing, runbook authoring and hypercare.', realizingProcessIds: [procTransition, procCoreGroup] },
    { id: capL1L2Support, projectId: projId, name: 'L1/L2 Managed Support', description: 'Ability to handle L1/L2 tickets and escalate to L3 within agreed SLAs for all in-scope services.', realizingProcessIds: [procOpsReadiness, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procGovernance}__default`,   projectId: projId, processId: procGovernance,   configId: 'default', ratings: { strategic_impact: 4, pain_severity: 3, feasibility: 4, volume: 2 } },
    { id: `${procCoreGroup}__default`,    projectId: projId, processId: procCoreGroup,    configId: 'default', ratings: { strategic_impact: 5, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procOpsReadiness}__default`, projectId: projId, processId: procOpsReadiness, configId: 'default', ratings: { strategic_impact: 5, pain_severity: 4, feasibility: 3, volume: 5 } },
    { id: `${procDiscover}__default`,     projectId: projId, processId: procDiscover,     configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 2 } },
    { id: `${procTransition}__default`,   projectId: projId, processId: procTransition,   configId: 'default', ratings: { strategic_impact: 5, pain_severity: 5, feasibility: 2, volume: 2 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
