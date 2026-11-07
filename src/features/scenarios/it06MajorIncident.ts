// IT-06: Enterprise customer during a major incident — detection, response, communications and review.

import { newId } from '../../domain/contracts/ids';
import type {
  ProjectManifest, ProcessCandidate, ProcessDefinition,
  Persona, ITSystem, Channel, Touchpoint,
  Journey, JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  PainPoint,
  DiscoveryInterview, DiscoveryInterviewItem, DiscoveryObservation,
  StormingCard, Contradiction,
  SipocDiagram, SipocRow, ProcessMap, MapLane, MapActivity, ProcessMapEdge,
} from '../../domain/contracts/types';
import type { ScenarioBundle } from './it02SaasOnboarding';

export function buildIT06Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysStatus = newId('sys');
  const sysSupport = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const tpStatus = newId('tp');
  const tpSupport = newId('tp');

  const procDetect = newId('proc');
  const procComms = newId('proc');
  const candId1 = newId('cand');
  const candId2 = newId('cand');

  const journeyId = newId('journey');
  const stgDetect = newId('stg');
  const stgImpact = newId('stg');
  const stgMonitor = newId('stg');
  const stgResolution = newId('stg');
  const stgReview = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgDetect,     label: 'Notice service degradation',         order: 0 },
    { stageId: stgDetect,     label: 'Check status page',                  order: 1 },
    { stageId: stgImpact,     label: 'Assess business impact',             order: 0 },
    { stageId: stgImpact,     label: 'Open support ticket',                order: 1 },
    { stageId: stgMonitor,    label: 'Wait for incident updates',          order: 0 },
    { stageId: stgMonitor,    label: 'Apply workaround',                   order: 1 },
    { stageId: stgMonitor,    label: 'Escalate to account manager',        order: 2 },
    { stageId: stgResolution, label: 'Receive resolution notification',    order: 0 },
    { stageId: stgResolution, label: 'Verify service restored',            order: 1 },
    { stageId: stgReview,     label: 'Read post-incident report',          order: 0 },
    { stageId: stgReview,     label: 'Review SLA compliance',              order: 1 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Notice service degradation':      'API calls start returning 503; monitoring alert fires at 02:14; on-call engineer wakes up',
    'Check status page':               'Status page shows "Operational" — no active incident declared yet despite widespread impact',
    'Assess business impact':          'Estimates 40% of transaction processing offline; finance team cannot run end-of-month reports',
    'Open support ticket':             'Opens P1 support ticket; must re-enter account details already in the support system',
    'Wait for incident updates':       'First status update posted 90 minutes after confirmed outage; content is vague: "investigating"',
    'Apply workaround':                'Routes half the traffic to secondary region; not intended for full load — degrades performance',
    'Escalate to account manager':     'Calls account manager who has no more information than the status page',
    'Receive resolution notification': 'Email at 06:45 says service restored; no explanation of cause or duration',
    'Verify service restored':         'Runs smoke tests; confirms primary region restored but secondary region still degraded',
    'Read post-incident report':       'PIR arrives 7 days later: cause identified as a failed network upgrade; remediation steps listed',
    'Review SLA compliance':           'Calculates 4h 31min outage; SLA threshold is 4h; credit claim process unclear in contract',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Notice service degradation':      -1,
    'Check status page':               -2,
    'Assess business impact':          -2,
    'Open support ticket':             -1,
    'Wait for incident updates':       -2,
    'Apply workaround':                -1,
    'Escalate to account manager':     -2,
    'Receive resolution notification': -1,
    'Verify service restored':         -1,
    'Read post-incident report':       0,
    'Review SLA compliance':           -1,
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
      title: 'Status page not updated until 90 minutes after outage start',
      description: 'Customers detect and diagnose the incident before the vendor acknowledges it publicly.',
      severity: 'critical', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[1]], affectedProcessIds: [procComms],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Customer opens P1 ticket before status page reflects any issue; wastes 30 min confirming it is not their infrastructure.',
      hypothesizedCause: 'Incident response runbook does not require status page update until root cause is confirmed.',
      validatedCause: '', proposedIntervention: 'Update status page to "Investigating" within 10 minutes of P1 alert confirmation.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'SLA credit claim process is undocumented in customer contract',
      description: 'Customer calculates SLA breach but cannot find credit claim instructions; account manager does not know either.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[10]], affectedProcessIds: [procComms],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Customer escalates to legal after one week of unanswered questions; trust damage exceeds credit value.',
      hypothesizedCause: 'SLA credit process owned by billing team; not referenced in support or account management docs.',
      validatedCause: '', proposedIntervention: 'Include SLA credit claim link in every PIR delivered to affected customers.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-06 · Major Incident Customer Journey', description: 'Enterprise customer experience during a 4-hour service outage: detection, workaround, escalation and PIR review.', createdAt: now, updatedAt: now, schemaVersion: 1 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Major incident detection and response', status: 'accepted', rationale: 'Core operational process; directly impacts customer trust and SLA.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Customer incident communication', status: 'accepted', rationale: 'Distinct comms subprocess; involves different roles and tools than technical response.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    { projectId: projId, id: procDetect, title: 'Major incident detection and response', purpose: 'Detect, contain and resolve service-affecting incidents within SLA.', levelLabel: 'core', trigger: 'Monitoring alert or customer report indicates P1 impact.', outcome: 'Service restored; root cause identified; PIR published.', inScope: ['Alert triage', 'Incident command', 'Technical response', 'Service restoration'], outOfScope: ['Customer communication', 'SLA credit processing'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysStatus, sysSupport], evidenceIds: [] },
    { projectId: projId, id: procComms, title: 'Customer incident communication', purpose: 'Keep affected customers informed with accurate, timely updates during and after incidents.', levelLabel: 'support', trigger: 'P1 incident declared.', outcome: 'Status page updated; customers notified; PIR delivered.', inScope: ['Status page updates', 'Customer notifications', 'Post-incident report'], outOfScope: ['Technical incident response', 'SLA credit approval'], status: 'draft', serviceIds: [], capabilityIds: [], systemIds: [sysStatus], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Claire Osei', role: 'Head of Platform Engineering (Customer)', goals: ['Maintain service uptime for internal users', 'Make informed decisions during outage', 'Hold vendor accountable to SLA'], needs: ['Real-time status updates', 'Actionable workaround guidance', 'Clear SLA credit process'], constraints: ['Cannot access vendor internal systems', 'On-call 24/7 but cannot fix vendor infrastructure'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysStatus,  name: 'Public Status Page', type: 'saas', criticality: 'high', supportingRole: 'Public incident tracking and customer-facing status.', evidenceIds: [] },
    { projectId: projId, id: sysSupport, name: 'Enterprise Support Portal', type: 'saas', criticality: 'high', supportingRole: 'P1 ticket submission and incident case management.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chEmail, name: 'Email', type: 'email' }, { projectId: projId, id: chPortal, name: 'Status Page / Portal', type: 'portal' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpStatus,  name: 'Public status page', purpose: 'Communicates incident status and updates.', channelId: chPortal, systemIds: [sysStatus], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpSupport, name: 'Support ticket portal', purpose: 'P1 case submission and status tracking.', channelId: chPortal, systemIds: [sysSupport], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'Major Incident — Enterprise Customer Experience',
    goal: 'Maintain business operations and hold vendor accountable during a production outage.',
    situation: "Enterprise customer's primary SaaS service goes down at 02:14. Status page shows green. Customer detects, escalates, applies workaround and reviews PIR over 7 days.",
    perspective: 'customer', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgDetect, stgImpact, stgMonitor, stgResolution, stgReview],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgDetect,     journeyId, title: 'Detection',    description: '', order: 0 },
    { projectId: projId, id: stgImpact,     journeyId, title: 'Impact',       description: '', order: 1 },
    { projectId: projId, id: stgMonitor,    journeyId, title: 'Monitor',      description: '', order: 2 },
    { projectId: projId, id: stgResolution, journeyId, title: 'Resolution',   description: '', order: 3 },
    { projectId: projId, id: stgReview,     journeyId, title: 'Review',       description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Claire Osei', role: 'Head of Platform Engineering (Customer)', date: '2024-10-21', notes: 'Conducted 1 week post-incident. Had a detailed timeline she\'d written herself. Calm but very precise about the trust damage caused by the green status page.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Vendor Support Rep', role: 'L2 Support Engineer (Vendor)', date: '2024-10-22', notes: 'Could only speak to the customer-facing side of the incident — not the internal response. Acknowledged the status page delay was a process gap.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Ahmed Kalani', role: 'Internal Engineering Lead (Customer)', date: '2024-10-22', notes: 'Was the on-call engineer at 02:14. Provided exact alert timestamps and workaround sequence. Noted secondary region degradation was not communicated back to the vendor.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'At 02:14 our monitoring fired. At 02:15 I checked your status page — it said "All Systems Operational". I spent the next 30 minutes convinced it was our infrastructure. It wasn\'t.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The SLA credit clause was in an appendix of the contract I signed 18 months ago. I had no idea how to claim it. Neither did my account manager.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'If you have an internal alert system that fires within 2 minutes of a failure, why does it take 90 minutes to update the public status page?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'Our runbook says we update the status page once root cause is confirmed. For this incident, that took over an hour because the failure mode was unexpected.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'We had over 200 P1 tickets opened by customers in the first 90 minutes — all reporting the same issue. If we\'d posted an "Investigating" update at minute 10, most of those would never have been opened.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The SLA credit process is handled by the billing team. We in support don\'t have visibility into it and can\'t initiate it on a customer\'s behalf.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'I routed half our traffic to the secondary region at 02:35. It wasn\'t designed for full load — response times went from 120ms to 800ms. That\'s technically "working" but it\'s not acceptable for our users.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The post-incident report said the cause was a failed network upgrade. But the PIR didn\'t explain why the rollout wasn\'t canary-deployed. That\'s the question I actually needed answered.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Is there a way to get machine-readable incident data — start time, affected regions, duration — via an API instead of reading a status page? Our SRE team could automate a lot of the response steps.', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'On-call Engineer',  description: 'Monitoring alert fires at 02:14 for elevated 503 error rate. Engineer opens status page on mobile — shows green. Spends 8 minutes checking own infrastructure (load balancer, DNS, internal firewall) before concluding it is vendor-side.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Customer',          description: 'P1 support ticket opened at 02:22. Must re-enter company name, account ID, and affected service — all details already on the account record. Takes 7 minutes to complete the form under time pressure.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Vendor',            description: 'Status page updated to "Investigating — network connectivity issues" at 03:46 — 92 minutes after first internal alert. By this time 200+ customer P1 tickets had been opened.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'On-call Engineer',  description: 'Applies traffic rerouting workaround to secondary region at 02:35. Secondary region handles load but response times degrade significantly. Engineer monitors Datadog dashboard throughout — no vendor communication about expected restore time.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Customer',          description: 'Account manager called at 03:50 for a status update. Account manager checks the same public status page as the customer and has no additional information. Call ends without actionable update after 12 minutes.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Customer',          description: 'Service restoration email arrives at 06:45. Email states "service has been restored" with no mention of cause, duration, or next steps. No SLA credit information included. Customer must calculate outage duration manually from their own logs.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Customer & Vendor Billing', description: 'Customer contacts vendor billing 8 days after incident to claim SLA credit. Billing team has no record of the incident linked to the account. Customer must resubmit evidence. Process takes another 3 weeks.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'P1 Alert Triggered',                sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Incident Declared Internally',       sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Status Page Updated to Investigating', sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Workaround Applied',                 sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Service Restored',                   sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Post-Incident Report Published',     sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'SLA Credit Claim Initiated',         sequence: 13 },
    // Commands
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Declare Incident',                   sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Post Status Update',                 sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Route Traffic to Secondary Region',  sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Restore Primary Service',            sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Publish PIR',                        sequence: 10 },
    // Actors
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Customer On-call Engineer',          sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Vendor Incident Commander',          sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Vendor L2 Engineering',              sequence: 16 },
    // Policies
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Status Page Update Policy — currently requires root cause confirmation before update; delays first post by 60–90 minutes', sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'SLA Credit Policy — 4-hour uptime SLA; credit claim requires customer submission within 30 days via billing portal (undocumented in support materials)', sequence: 17 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Status page update timing',
      sourceA: 'Vendor incident response runbook (internal)',
      claimA: 'The status page is updated once the incident commander has confirmed root cause, to avoid posting inaccurate information.',
      sourceB: 'Claire Osei — Head of Platform Engineering (2024-10-21)',
      claimB: 'The status page showed "Operational" for 90 minutes after widespread impact. I spent 30 minutes checking my own infrastructure because of it. Even "Investigating" at minute 10 would have saved us an hour of wasted effort.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'SLA credit claim process accessibility',
      sourceA: 'Vendor enterprise contract Appendix B — SLA Terms',
      claimA: 'Customers experiencing SLA breaches may submit a credit claim via the billing portal within 30 days of the incident.',
      sourceB: 'Vendor Support Rep (2024-10-22)',
      claimB: 'SLA credits are handled entirely by the billing team. We in support cannot initiate a claim on a customer\'s behalf and are not trained on the billing portal process.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Major Incident Management & Communication', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'Monitoring platform\nCustomer reports', input: 'Automated alert\nP1 ticket', step: '1. Detect and declare incident', output: 'Declared incident\nIncident commander assigned', customer: 'L2 Engineering\nCustomer Comms' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Incident Commander\nL2 Engineering', input: 'Incident severity\nInitial diagnosis', step: '2. Post initial status page update', output: '"Investigating" status page entry\nAffected customer notification', customer: 'All affected customers' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'L2 Engineering', input: 'Root cause analysis\nFix or workaround', step: '3. Contain and restore service', output: 'Service restored\nCustomer notification of resolution', customer: 'Customers\nAccount Managers' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'Incident Commander\nL2 Engineering', input: 'Root cause\nTimeline\nRemediation steps', step: '4. Publish post-incident report', output: 'PIR published to affected customers\nSLA credit information included', customer: 'Customers\nBilling team' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Billing team\nContract data', input: 'Downtime duration\nCustomer SLA tier', step: '5. Process SLA credit claims', output: 'Credit applied to account\nConfirmation sent to customer', customer: 'Customer Finance\nAccount Manager' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneCustId = newId('ml');
  const laneL1Id   = newId('ml');
  const laneL2Id   = newId('ml');
  const laneICId   = newId('ml');

  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart    = newId('ma');
  const maAlert    = newId('ma');
  const maDeclare  = newId('ma');
  const maStatusPg = newId('ma');
  const maP1Ticket = newId('ma');
  const maWorkaround = newId('ma');
  const maInvestig = newId('ma');
  const maRestore  = newId('ma');
  const maPIR      = newId('ma');
  const maSLAClaim = newId('ma');
  const maEnd      = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Major Incident Response Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneCustId, projectId: projId, mapId: pmId, label: 'Customer',          order: 0 },
    { id: laneL1Id,   projectId: projId, mapId: pmId, label: 'Level 1 Support',   order: 1 },
    { id: laneL2Id,   projectId: projId, mapId: pmId, label: 'L2 Engineering',    order: 2 },
    { id: laneICId,   projectId: projId, mapId: pmId, label: 'Incident Commander', order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,      projectId: projId, mapId: pmId, laneId: laneL2Id,   type: 'start', label: 'Start',                       note: '', x: 60,   y: ly(2, 44) },
    { id: maAlert,      projectId: projId, mapId: pmId, laneId: laneL2Id,   type: 'task',  label: 'Monitor alert fires',          note: 'P1 alert at 02:14 — monitoring detects elevated 503 rate', x: 280,  y: ly(2, 54) },
    { id: maDeclare,    projectId: projId, mapId: pmId, laneId: laneICId,   type: 'task',  label: 'Declare incident',             note: 'IC assigned; internal war room opened', x: 500,  y: ly(3, 54) },
    { id: maStatusPg,   projectId: projId, mapId: pmId, laneId: laneICId,   type: 'task',  label: 'Update status page',           note: 'Delayed 92 min — runbook requires root cause before posting', x: 720,  y: ly(3, 54) },
    { id: maP1Ticket,   projectId: projId, mapId: pmId, laneId: laneCustId, type: 'task',  label: 'Open P1 support ticket',       note: 'Customer detects outage before status page updated; wastes 30 min on own infra', x: 500,  y: ly(0, 54) },
    { id: maWorkaround, projectId: projId, mapId: pmId, laneId: laneCustId, type: 'task',  label: 'Apply traffic workaround',     note: 'Reroutes to secondary region; not designed for full load — 800ms response time', x: 940,  y: ly(0, 54) },
    { id: maInvestig,   projectId: projId, mapId: pmId, laneId: laneL2Id,   type: 'task',  label: 'Investigate root cause',       note: 'Network upgrade failure; no canary rollout; full impact before detected', x: 940,  y: ly(2, 54) },
    { id: maRestore,    projectId: projId, mapId: pmId, laneId: laneL2Id,   type: 'task',  label: 'Restore primary service',      note: 'Service restored at 06:45 — 4h 31m total outage', x: 1160, y: ly(2, 54) },
    { id: maPIR,        projectId: projId, mapId: pmId, laneId: laneICId,   type: 'task',  label: 'Publish PIR',                  note: 'Delivered 7 days post-incident; no SLA credit info included', x: 1380, y: ly(3, 54) },
    { id: maSLAClaim,   projectId: projId, mapId: pmId, laneId: laneCustId, type: 'task',  label: 'Claim SLA credit',             note: 'Undocumented process; billing team has no link to incident record; 3-week resolution', x: 1600, y: ly(0, 54) },
    { id: maEnd,        projectId: projId, mapId: pmId, laneId: laneCustId, type: 'end',   label: 'End',                          note: '', x: 1820, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,      toId: maAlert,      label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maAlert,      toId: maDeclare,    label: 'P1 confirmed' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maDeclare,    toId: maStatusPg,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maAlert,      toId: maP1Ticket,   label: 'Customer detects' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maP1Ticket,   toId: maWorkaround, label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maDeclare,    toId: maInvestig,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maInvestig,   toId: maRestore,    label: 'Fix deployed' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maRestore,    toId: maPIR,        label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maPIR,        toId: maSLAClaim,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSLAClaim,   toId: maEnd,        label: '' },
  ];

  return {
    manifest, candidates, processes, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
