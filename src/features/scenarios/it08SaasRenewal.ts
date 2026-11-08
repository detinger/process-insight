// IT-08: SaaS administrator handling renewal/cancellation — billing, account management, export and retention.

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

export function buildIT08Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysBilling = newId('sys');
  const sysAdmin = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const tpInvoice = newId('tp');
  const tpExport = newId('tp');

  const procMgmt1     = newId('proc');  // management: Subscription Lifecycle Governance
  const procCoreGroup = newId('proc');  // core-group: Subscription & Account Lifecycle
  const procRenewal   = newId('proc');
  const procExport    = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcSubscription = newId('svc');
  const svcDataExport   = newId('svc');

  const capRenewalMgmt  = newId('cap');
  const capDataPort     = newId('cap');

  const candId1 = newId('cand');
  const candId2 = newId('cand');

  const journeyId = newId('journey');
  const stgNotice = newId('stg');
  const stgEvaluation = newId('stg');
  const stgCancellation = newId('stg');
  const stgExport = newId('stg');
  const stgClosure = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgNotice,       label: 'Receive renewal notice',                order: 0 },
    { stageId: stgNotice,       label: 'Review usage and costs',                order: 1 },
    { stageId: stgEvaluation,   label: 'Evaluate alternative solutions',        order: 0 },
    { stageId: stgEvaluation,   label: 'Negotiate renewal terms',               order: 1 },
    { stageId: stgCancellation, label: 'Decide to cancel subscription',         order: 0 },
    { stageId: stgCancellation, label: 'Locate cancellation workflow',          order: 1 },
    { stageId: stgCancellation, label: 'Confirm cancellation',                  order: 2 },
    { stageId: stgExport,       label: 'Request data export',                   order: 0 },
    { stageId: stgExport,       label: 'Receive export package',                order: 1 },
    { stageId: stgExport,       label: 'Verify data completeness',              order: 2 },
    { stageId: stgClosure,      label: 'Access billing final invoice',          order: 0 },
    { stageId: stgClosure,      label: 'Confirm account closure',               order: 1 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Receive renewal notice':          'Email 60 days before renewal with auto-renewal enabled; no opt-out link in email',
    'Review usage and costs':          'Checks admin dashboard; seat utilization is 40%; paying for unused licenses',
    'Evaluate alternative solutions':  'Compares three alternatives; pricing is 30% lower for similar features',
    'Negotiate renewal terms':         'Contacts account manager; offered 10% discount but no seat reduction option',
    'Decide to cancel subscription':   'Decision made to cancel; finance sign-off received',
    'Locate cancellation workflow':    'Settings menu has no "Cancel" option; must call support or find buried help article',
    'Confirm cancellation':            'Support confirms cancellation; states data retained for 30 days only',
    'Request data export':             'Submits data export request via admin panel; estimated completion "24–48 hours"',
    'Receive export package':          'Download link arrives after 36 hours; ZIP file contains multiple formats with no manifest',
    'Verify data completeness':        'Spot-checks export; audit logs missing from ZIP; must file separate export request',
    'Access billing final invoice':    'Invoice generated immediately after cancellation; disputes a charge from prior billing cycle',
    'Confirm account closure':         'Account portal shows "Closed" status; API credentials still active for 7 days — undocumented',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Receive renewal notice': -1, 'Review usage and costs': -1,
    'Evaluate alternative solutions': 0, 'Negotiate renewal terms': -1,
    'Decide to cancel subscription': 0, 'Locate cancellation workflow': -2,
    'Confirm cancellation': -1, 'Request data export': 0,
    'Receive export package': -1, 'Verify data completeness': -2,
    'Access billing final invoice': -1, 'Confirm account closure': -1,
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
      title: 'Cancellation requires support call — not available in self-service portal',
      description: 'No cancellation option in admin settings; help article buried three levels deep; requires phone call during business hours.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[5]], affectedProcessIds: [procRenewal],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Admin spends 45 minutes finding cancellation path; calls are queued during month-end billing peak.',
      hypothesizedCause: 'Cancellation flow intentionally obstructed to reduce churn — not surfaced in self-service.',
      validatedCause: '', proposedIntervention: 'Provide accessible cancellation workflow in account settings; confirm in writing within 24 hours.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Data export is incomplete — audit logs excluded without documentation',
      description: 'Standard export ZIP does not include audit logs; separate request required; not disclosed in export documentation.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[9]], affectedProcessIds: [procExport],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Compliance team flags missing audit trail after account closure; re-requesting post-closure is uncertain.',
      hypothesizedCause: 'Audit logs stored in separate system; export pipeline not updated when logs were migrated.',
      validatedCause: '', proposedIntervention: 'Document all data types included and excluded in export manifest; include audit log download link in cancellation workflow.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-08 · SaaS Renewal/Cancellation Journey', description: 'SaaS administrator evaluating renewal, negotiating terms, cancelling, exporting data and closing account.', createdAt: now, updatedAt: now, schemaVersion: 2 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Subscription renewal and cancellation management', status: 'accepted', rationale: 'Core account lifecycle process; spans billing, account management and customer success.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Customer data export and portability', status: 'accepted', rationale: 'Distinct data process; regulatory and compliance implications.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procMgmt1, title: 'Subscription Lifecycle Governance',
      purpose: 'Define renewal policies, cancellation rights, data retention rules and SLA commitments for the subscription lifecycle.',
      levelLabel: 'management',
      trigger: 'Policy review cycle or regulatory change affecting data retention or cancellation rights.',
      outcome: 'Published renewal policy; cancellation rights documented; data retention SLA confirmed.',
      inScope: ['Renewal policy definition', 'Cancellation rights', 'Data retention policy', 'Customer portability compliance'],
      outOfScope: ['Individual subscription processing', 'Billing dispute resolution'],
      status: 'draft', serviceIds: [svcSubscription], capabilityIds: [], systemIds: [sysBilling], evidenceIds: [],
    },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'Subscription & Account Lifecycle',
      purpose: 'Manage subscription renewals, cancellations, and data export from renewal notice to account closure.',
      levelLabel: 'core-group',
      trigger: 'Renewal notice sent or customer initiates cancellation.',
      outcome: 'Subscription renewed or account closed; data exported; billing reconciled.',
      inScope: ['Renewal and cancellation', 'Data export', 'Final invoicing', 'Account closure'],
      outOfScope: ['Post-closure data deletion', 'Procurement of replacement service'],
      status: 'draft', serviceIds: [svcSubscription, svcDataExport], capabilityIds: [capRenewalMgmt, capDataPort], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procRenewal, title: 'Subscription renewal and cancellation management', purpose: 'Handle subscription lifecycle events including renewal, negotiation, downgrade and cancellation.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Renewal date approaches or customer initiates cancellation.', outcome: 'Subscription renewed, modified or cancelled; customer notified; billing reconciled.', inScope: ['Renewal notice', 'Negotiation', 'Cancellation processing', 'Final invoicing'], outOfScope: ['Data export', 'Post-cancellation data retention'], status: 'draft', serviceIds: [svcSubscription], capabilityIds: [capRenewalMgmt], systemIds: [sysBilling, sysAdmin], evidenceIds: [] },
    // ── Support layer ─────────────────────────────────────────────────────────
    { projectId: projId, id: procExport, title: 'Customer data export and portability', purpose: 'Provide customers with a complete, verifiable export of all their data before or after account closure.', levelLabel: 'support', trigger: 'Customer requests data export.', outcome: 'Complete data package delivered; customer confirms receipt.', inScope: ['Export request intake', 'Data package generation', 'Delivery', 'Completeness verification support'], outOfScope: ['Data deletion', 'Account closure'], status: 'draft', serviceIds: [svcDataExport], capabilityIds: [capDataPort], systemIds: [sysAdmin], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Dana Patel', role: 'IT Systems Administrator', goals: ['Manage SaaS costs within budget', 'Ensure data portability before closure', 'Complete cancellation before auto-renewal date'], needs: ['Transparent seat utilization data', 'Self-service cancellation', 'Complete data export with manifest'], constraints: ['Finance must approve spend decisions', 'Cannot extend beyond contract renewal date', 'Must retain audit logs for 3 years per policy'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysBilling, name: 'SaaS Billing System',  type: 'saas', criticality: 'high', supportingRole: 'Invoicing, subscription management and payment processing.', evidenceIds: [] },
    { projectId: projId, id: sysAdmin,   name: 'Admin Portal',          type: 'saas', criticality: 'high', supportingRole: 'User management, usage analytics and account settings.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chEmail, name: 'Email', type: 'email' }, { projectId: projId, id: chPortal, name: 'Admin Portal', type: 'portal' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpInvoice, name: 'Billing and invoice portal', purpose: 'Subscription management, invoice access and payment.', channelId: chPortal, systemIds: [sysBilling], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpExport,  name: 'Data export request interface', purpose: 'Request and download account data.', channelId: chPortal, systemIds: [sysAdmin], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'SaaS Renewal/Cancellation — Administrator Journey',
    goal: 'Cancel underused SaaS subscription and export all organizational data before closure.',
    situation: "IT admin receives renewal notice, finds 40% utilization, negotiates but decides to cancel. Hits obstructed cancellation workflow, receives incomplete data export, and disputes a final invoice charge.",
    perspective: 'customer', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgNotice, stgEvaluation, stgCancellation, stgExport, stgClosure],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgNotice,       journeyId, title: 'Notice',      description: '', order: 0 },
    { projectId: projId, id: stgEvaluation,   journeyId, title: 'Evaluation',  description: '', order: 1 },
    { projectId: projId, id: stgCancellation, journeyId, title: 'Cancellation', description: '', order: 2 },
    { projectId: projId, id: stgExport,       journeyId, title: 'Data Export', description: '', order: 3 },
    { projectId: projId, id: stgClosure,      journeyId, title: 'Closure',     description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Dana Patel',    role: 'IT Systems Administrator', date: '2024-10-02', notes: 'Dana confirmed the cancellation can only be done by phone during business hours.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Greg Wallace',  role: 'SaaS Vendor Account Manager', date: '2024-10-04', notes: 'Greg said self-service cancellation is on the roadmap but no timeline confirmed.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Fatima Nguyen', role: 'Finance Manager', date: '2024-10-05', notes: 'Fatima flagged the 36-hour export delay creates compliance exposure when the retention window is tight.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: '"There is no Cancel button anywhere. I had to call support and wait 20 minutes on hold — during business hours only."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'Audit logs were not included in the standard data export ZIP; a separate request process exists but is not documented at export time.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'What is the minimum compliant approach if we need audit logs for a regulatory request after account closure?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: '"The phone-only cancellation policy is intentional — it gives our team a last chance to retain the customer before they leave."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The export completion time of "24–48 hours" is an estimate; actual delivery depends on account data volume and queue depth.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'question', text: 'Is the vendor willing to provide a written SLA for data export turnaround in the enterprise tier?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: '"We only have 30 days to export data after cancellation. Getting the export at 36 hours with no manifest left us scrambling to verify completeness."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The final invoice dispute process requires a formal written request; phone disputes are not accepted by the finance team.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Should we negotiate a data export SLA into the contract before the next vendor engagement?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Dana Patel',    description: 'Receives auto-renewal email 60 days before renewal date; no opt-out link in email body.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Dana Patel',    description: 'Logs into admin dashboard; downloads seat utilization report showing 40% usage across 150 seats.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Greg Wallace',  description: 'Account manager call: vendor offers 10% discount; refuses seat count reduction below contract minimum.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Dana Patel',    description: 'Searches admin portal for cancellation option; no Cancel button in Settings, Billing, or Account menus.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Support Queue', description: 'Calls support; holds for 20 minutes before reaching an agent who can process cancellation.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Export System', description: 'Data export arrives at 36 hours — 12 hours past the lower estimate — with no manifest file.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Dana Patel',    description: 'Spot-checks export; audit logs entirely absent from ZIP; discovers separate export form in help docs.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Renewal Notice Received',           sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Low Utilization Identified',        sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Cancellation Decision Made',        sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Cancel Button Not Found',           sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Cancellation Confirmed by Phone',   sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Export Delivered (36h, no manifest)', sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Audit Logs Missing from Export',    sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Invoice Disputed',                  sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Request Data Export',               sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Process Cancellation',              sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Issue Final Invoice',               sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Close Account',                     sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Provide Audit Log Export',          sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Dana Patel (IT Admin)',             sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Greg Wallace (Account Manager)',    sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Fatima Nguyen (Finance Manager)',   sequence: 16 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Retention Policy — Customer data retained for 30 days after cancellation before permanent deletion.', sequence: 17 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Cancellation Policy — Subscription cancellations must be confirmed by a support agent via phone or email.', sequence: 18 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Self-service cancellation availability',
      sourceA: 'SaaS vendor help documentation (account settings article)',
      claimA: 'Accounts can be cancelled directly from the Admin > Account Settings > Subscription page.',
      sourceB: 'Dana Patel (direct observation during cancellation attempt)',
      claimB: 'No cancellation option exists in Admin, Billing, or Account Settings; support confirmed phone-only cancellation.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Data export scope (audit logs)',
      sourceA: 'SaaS vendor data export documentation',
      claimA: 'The standard data export package includes all account data: messages, files, settings, and activity logs.',
      sourceB: 'Dana Patel post-export verification; support ticket response',
      claimB: 'Audit logs are excluded from standard export by default; a separate form must be submitted — not mentioned at export initiation.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'SaaS Contract Renewal & Offboarding', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'SaaS Vendor Billing System', input: 'Renewal notice, contract terms, usage report', step: '1. Evaluate renewal and usage', output: 'Usage analysis, cost-benefit decision', customer: 'Dana Patel (IT Admin), Fatima Nguyen (Finance)' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Dana Patel, Fatima Nguyen', input: 'Cancellation decision, finance approval', step: '2. Cancel subscription', output: 'Cancellation confirmation, closure date', customer: 'SaaS Vendor, Legal/Compliance' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Dana Patel', input: 'Completed export request form', step: '3. Export account data', output: 'Data export ZIP, audit log export (separate)', customer: 'IT Admin, Legal/Compliance' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'SaaS Vendor Finance', input: 'Final invoice, billing records', step: '4. Settle final invoice', output: 'Invoice paid or disputed, record of payment', customer: 'Fatima Nguyen (Finance), Dana Patel' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'SaaS Vendor', input: 'Account closure confirmation', step: '5. Confirm account closure', output: 'Closed status confirmation, credential revocation', customer: 'Dana Patel, IT Security' },
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
    { id: pmId, projectId: projId, title: 'SaaS Renewal & Cancellation Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: lane0Id, projectId: projId, mapId: pmId, label: 'IT Admin',           order: 0 },
    { id: lane1Id, projectId: projId, mapId: pmId, label: 'SaaS Vendor',        order: 1 },
    { id: lane2Id, projectId: projId, mapId: pmId, label: 'Finance',            order: 2 },
    { id: lane3Id, projectId: projId, mapId: pmId, label: 'Legal/Compliance',   order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart, projectId: projId, mapId: pmId, laneId: lane0Id, type: 'start', label: 'Start',                note: '',                                                            x: 60,   y: 63  },
    { id: maA1,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Review Usage & Cost',  note: 'Pulls usage report; 40% seat utilization identified.',        x: 280,  y: 58  },
    { id: maA2,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Decide to Cancel',     note: 'Finance sign-off received; decision logged.',                 x: 500,  y: 58  },
    { id: maA3,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Call Support to Cancel', note: 'No self-service option; 20-minute hold required.',           x: 720,  y: 58  },
    { id: maB1,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Process Cancellation', note: 'Agent confirms cancellation; sets 30-day data retention.',   x: 720,  y: 228 },
    { id: maB2,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Generate Export',      note: 'Export delivered at 36h; audit logs excluded by default.',   x: 940,  y: 228 },
    { id: maA4,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Request Data Export',  note: 'Submits export form in admin panel.',                         x: 940,  y: 58  },
    { id: maC1,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Review Final Invoice', note: 'Disputes prior-cycle charge; formal written request required.', x: 1160, y: 398 },
    { id: maD1,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Verify Export Scope',  note: 'Checks for audit logs; discovers separate request needed.',  x: 1160, y: 568 },
    { id: maD2,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Confirm Closure',      note: 'Account marked Closed; API credentials revoked after 7 days.', x: 1380, y: 568 },
    { id: maEnd,   projectId: projId, mapId: pmId, laneId: lane3Id, type: 'end',   label: 'End',                  note: '',                                                            x: 1600, y: 573 },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart, toId: maA1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA1,   toId: maA2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA2,   toId: maA3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA3,   toId: maB1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB1,   toId: maA4,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA4,   toId: maB2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maC1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maD1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC1,   toId: maD2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD1,   toId: maD2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD2,   toId: maEnd, label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procRenewal, type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procExport,    toId: procRenewal, type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcSubscription, projectId: projId, name: 'Subscription Lifecycle Management', customerOutcome: 'Customer can renew, downgrade or cancel their subscription at any time through self-service with accurate billing.', scope: 'Renewal notices, negotiation, cancellation processing and final invoicing.' },
    { id: svcDataExport,   projectId: projId, name: 'Data Export & Portability', customerOutcome: 'Customer receives a complete, verifiable export of all organizational data before account closure.', scope: 'Export request intake, data package generation, delivery and completeness support.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capRenewalMgmt, projectId: projId, name: 'Subscription Renewal & Cancellation', description: 'Ability to process subscription renewals, negotiations and cancellations with accurate billing reconciliation.', realizingProcessIds: [procRenewal, procCoreGroup] },
    { id: capDataPort,    projectId: projId, name: 'Customer Data Portability', description: 'Ability to generate and deliver a complete, documented export of all customer data on request.', realizingProcessIds: [procExport, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procMgmt1}__default`,     projectId: projId, processId: procMgmt1,     configId: 'default', ratings: { strategic_impact: 4, pain_severity: 3, feasibility: 4, volume: 2 } },
    { id: `${procCoreGroup}__default`, projectId: projId, processId: procCoreGroup, configId: 'default', ratings: { strategic_impact: 4, pain_severity: 3, feasibility: 3, volume: 3 } },
    { id: `${procRenewal}__default`,   projectId: projId, processId: procRenewal,   configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 3 } },
    { id: `${procExport}__default`,    projectId: projId, processId: procExport,    configId: 'default', ratings: { strategic_impact: 3, pain_severity: 4, feasibility: 3, volume: 2 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
