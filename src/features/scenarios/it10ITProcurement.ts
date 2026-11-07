// IT-10: Team procuring an IT service — procurement, security, vendor and finance boundaries.

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

export function buildIT10Scenario(): ScenarioBundle {
  const now = new Date().toISOString();
  const projId = newId('proj');
  const personaId = newId('persona');
  const sysProcure = newId('sys');
  const sysVendor = newId('sys');
  const chEmail = newId('ch');
  const chPortal = newId('ch');
  const tpRFP = newId('tp');
  const tpApproval = newId('tp');

  const procCoreGroup = newId('proc');  // core-group: IT Service Procurement
  const procProcure   = newId('proc');
  const procSecurity  = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcProcurement = newId('svc');
  const svcVendorComp  = newId('svc');

  const capVendorSelect = newId('cap');
  const capSecReview    = newId('cap');

  const candId1 = newId('cand');
  const candId2 = newId('cand');

  const journeyId = newId('journey');
  const stgIdentify = newId('stg');
  const stgEvaluation = newId('stg');
  const stgApproval = newId('stg');
  const stgPurchase = newId('stg');
  const stgHandover = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgIdentify,   label: 'Define procurement requirements',      order: 0 },
    { stageId: stgIdentify,   label: 'Get finance pre-approval estimate',    order: 1 },
    { stageId: stgEvaluation, label: 'Issue RFP to shortlisted vendors',     order: 0 },
    { stageId: stgEvaluation, label: 'Review vendor responses',              order: 1 },
    { stageId: stgEvaluation, label: 'Complete security assessment',         order: 2 },
    { stageId: stgApproval,   label: 'Submit for finance approval',          order: 0 },
    { stageId: stgApproval,   label: 'Legal reviews contract terms',         order: 1 },
    { stageId: stgApproval,   label: 'DPO approves data processing',         order: 2 },
    { stageId: stgPurchase,   label: 'Sign contract and raise PO',           order: 0 },
    { stageId: stgHandover,   label: 'Onboard vendor to systems',            order: 0 },
    { stageId: stgHandover,   label: 'Complete internal handover to ops',    order: 1 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));
  const rowActions = newId('row'); const rowSentiment = newId('row');
  const rowPainPts = newId('row'); const rowSystems = newId('row');

  const actionSeeds: Record<string, string> = {
    'Define procurement requirements':   'Writes requirements doc with functional, security and integration needs; no standard template available',
    'Get finance pre-approval estimate':  'Requests budget estimate; finance responds in 5 days; estimate valid for 30 days only',
    'Issue RFP to shortlisted vendors':   'Sends RFP to 4 vendors; 2 respond within deadline; 1 response is a marketing deck',
    'Review vendor responses':            'Scores responses on requirements matrix; two vendors tied; must run a demo week',
    'Complete security assessment':       'Security team has 10-page questionnaire; one vendor refuses to answer certain questions citing NDAs',
    'Submit for finance approval':        'Finance requires new approval because original estimate expired during vendor evaluation',
    'Legal reviews contract terms':       'Legal flags three clauses; vendor negotiations add 3 weeks; legal capacity is shared with 6 other teams',
    'DPO approves data processing':       'DPA required because vendor processes employee data; DPO queue is 6 weeks',
    'Sign contract and raise PO':         'PO raised in ERP; contract signed; payment terms differ from PO terms — requires correction',
    'Onboard vendor to systems':          'Vendor needs network access; IT helpdesk ticket raised; provisioning takes 2 more weeks',
    'Complete internal handover to ops':  'Ops team received no prior context; require another requirements document',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Define procurement requirements': -1, 'Get finance pre-approval estimate': -1,
    'Issue RFP to shortlisted vendors': 0, 'Review vendor responses': -1,
    'Complete security assessment': -1, 'Submit for finance approval': -2,
    'Legal reviews contract terms': -2, 'DPO approves data processing': -2,
    'Sign contract and raise PO': 0, 'Onboard vendor to systems': -1,
    'Complete internal handover to ops': -1,
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
      title: 'Finance estimate expires during vendor evaluation — requires resubmission',
      description: 'Budget estimate valid 30 days; vendor evaluation exceeds this; second approval round adds 5 more working days.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[5]], affectedProcessIds: [procProcure],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Total procurement timeline extended by 1–2 weeks; legal review period delayed by finance backlog.',
      hypothesizedCause: 'Finance policy requires fresh estimate for every approval stage; not adjusted for typical evaluation timelines.',
      validatedCause: '', proposedIntervention: 'Extend estimate validity to 90 days or link to procurement workflow stage not calendar date.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'DPO queue is 6 weeks — data processing approval on critical path',
      description: 'DPA required for any vendor processing employee data; DPO team shared across all business units; queue not visible.',
      severity: 'critical', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[7]], affectedProcessIds: [procSecurity],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Procurement blocked for 6 weeks at DPA stage; total time-to-contract exceeds 5 months.',
      hypothesizedCause: 'DPO team not resourced for growth in SaaS adoption; DPA is last gate not first.',
      validatedCause: '', proposedIntervention: 'Start DPA review in parallel with security assessment; provide DPO queue visibility to procurement teams.',
    },
  ];

  const manifest: ProjectManifest = { id: projId, title: 'IT-10 · IT Service Procurement Journey', description: 'Product team procurement of an IT service from RFP through contract signing, vendor onboarding and internal handover.', createdAt: now, updatedAt: now, schemaVersion: 2 };
  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'IT service procurement and vendor selection', status: 'accepted', rationale: 'Primary procurement lifecycle from need to contract.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Vendor security and data protection review', status: 'accepted', rationale: 'Distinct compliance gate; involves security and DPO teams.', sourceRefs: [], createdAt: now },
  ];
  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procSecurity, title: 'Vendor security and data protection review', purpose: 'Assess vendor security posture and data processing practices against policy before procurement commitment.', levelLabel: 'management', trigger: 'Vendor shortlisted in procurement process.', outcome: 'Vendor approved, conditionally approved or rejected; DPA signed if data processing confirmed.', inScope: ['Security questionnaire', 'Risk assessment', 'DPA review and signing'], outOfScope: ['Procurement decision', 'Contract negotiation'], status: 'draft', serviceIds: [svcVendorComp], capabilityIds: [capSecReview], systemIds: [sysProcure, sysVendor], evidenceIds: [] },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup, title: 'IT Service Procurement',
      purpose: 'Identify, evaluate, approve and contract IT services from initial requirement through internal handover.',
      levelLabel: 'core-group',
      trigger: 'Business unit raises a procurement requirement with finance pre-approval.',
      outcome: 'Contract signed; vendor onboarded; ops team briefed and operational.',
      inScope: ['Requirements definition', 'RFP and vendor evaluation', 'Finance, legal and DPO approval', 'Contract execution', 'Vendor onboarding', 'Internal handover'],
      outOfScope: ['Ongoing vendor management', 'Security policy definition'],
      status: 'draft', serviceIds: [svcProcurement, svcVendorComp], capabilityIds: [capVendorSelect, capSecReview], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procProcure, title: 'IT service procurement and vendor selection', purpose: 'Identify, evaluate and contract a suitable IT service vendor within budget and policy.', levelLabel: 'core', parentId: procCoreGroup, trigger: 'Business unit raises a procurement requirement.', outcome: 'Contract signed; PO raised; vendor onboarded; ops team briefed.', inScope: ['Requirements definition', 'RFP process', 'Vendor evaluation', 'Finance and legal approval', 'Contract execution', 'Handover'], outOfScope: ['Security and DPA review', 'Ongoing vendor management'], status: 'draft', serviceIds: [svcProcurement], capabilityIds: [capVendorSelect], systemIds: [sysProcure], evidenceIds: [] },
  ];
  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Marcus Lee', role: 'Product Manager (Procurement Lead)', goals: ['Contract a monitoring tool within Q2', 'Stay within budget while meeting security requirements', 'Avoid delays in internal ops handover'], needs: ['Procurement timeline visibility', 'DPO queue transparency', 'Standard requirements template'], constraints: ['Cannot commit spend without finance approval', 'All vendors processing data require DPA', 'Legal capacity shared with other teams'], accessibilityNeeds: [], evidenceIds: [] }];
  const systems: ITSystem[] = [
    { projectId: projId, id: sysProcure, name: 'Procurement Management System', type: 'internal', criticality: 'high', supportingRole: 'RFP management, vendor scoring, PO and contract tracking.', evidenceIds: [] },
    { projectId: projId, id: sysVendor,  name: 'Vendor Portal (DPA/NDA exchange)', type: 'saas', criticality: 'medium', supportingRole: 'Secure document exchange for contracts and compliance questionnaires.', evidenceIds: [] },
  ];
  const channels: Channel[] = [{ projectId: projId, id: chEmail, name: 'Email', type: 'email' }, { projectId: projId, id: chPortal, name: 'Procurement Portal', type: 'portal' }];
  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpRFP,      name: 'RFP and vendor evaluation portal', purpose: 'Issue RFP and collect vendor responses for evaluation.', channelId: chPortal, systemIds: [sysProcure], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpApproval, name: 'Finance and legal approval workflow', purpose: 'Route procurement for finance budget approval and legal contract review.', channelId: chPortal, systemIds: [sysProcure], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];
  const journey: Journey = { projectId: projId, id: journeyId, title: 'IT Service Procurement — Monitoring Tool',
    goal: 'Contract a monitoring tool within Q2, within budget, meeting security and data protection requirements.',
    situation: "Product manager leads procurement for a monitoring tool. Finance estimate expires, security review takes 3 weeks, DPO queue adds 6 weeks, and legal negotiations add another 3. Total time: 5 months.",
    perspective: 'employee', state: 'as-is', personaIds: [personaId],
    stageOrder: [stgIdentify, stgEvaluation, stgApproval, stgPurchase, stgHandover],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };
  const stages: JourneyStage[] = [
    { projectId: projId, id: stgIdentify,   journeyId, title: 'Identify',   description: '', order: 0 },
    { projectId: projId, id: stgEvaluation, journeyId, title: 'Evaluation', description: '', order: 1 },
    { projectId: projId, id: stgApproval,   journeyId, title: 'Approval',   description: '', order: 2 },
    { projectId: projId, id: stgPurchase,   journeyId, title: 'Purchase',   description: '', order: 3 },
    { projectId: projId, id: stgHandover,   journeyId, title: 'Handover',   description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Marcus Lee',  role: 'Product Manager',         date: '2024-11-05', notes: 'Marcus ran the full procurement; noted that the finance estimate expired mid-evaluation.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Anna Weber',  role: 'Data Protection Officer', date: '2024-11-07', notes: 'Anna confirmed the DPO review queue is currently 6 weeks; it is on the critical path.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Kevin Park',  role: 'Finance Manager',         date: '2024-11-08', notes: 'Kevin explained the 30-day validity rule is a policy constraint; re-submissions require new board sign-off.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: '"By the time we finished evaluating vendors, our finance estimate had expired. We had to restart the approval chain from scratch — that cost us three weeks."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The DPO review is always on the critical path; it cannot run in parallel with vendor evaluation because the DPO needs the final vendor selected first.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Can the DPO review be initiated in parallel with final commercial negotiation to reduce cycle time?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: '"We review 40+ contracts per quarter with one DPO. The 6-week queue is structural — it needs resourcing, not process tweaking."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'Standard SaaS tools with GDPR data processing agreements could be pre-approved via a framework contract to bypass individual DPO review.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'question', text: 'Which vendor categories are eligible for a pre-approved framework DPA that would skip the full DPO queue?', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: '"The 30-day validity is set by the board. If the estimate expires, we need a fresh sign-off — it is not something Finance can waive."', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'Procurement timelines routinely exceed 30 days for complex tools; the validity window was designed for commodity purchases.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Should the board policy be amended to allow a 90-day estimate validity for procurement cycles with mandatory DPO review?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Marcus Lee',  description: 'Drafts monitoring tool requirements; initiates RFP in procurement portal with 5 vendor invitations.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Kevin Park',  description: 'Issues budget estimate approval; validity stamp is 30 calendar days from signature date.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Marcus Lee',  description: 'Vendor evaluation takes 35 days; finance estimate expires on day 30; resubmission triggered.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Marcus Lee',  description: 'Submits DPO review request; logs ticket in legal queue; notified the queue is currently 6 weeks.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Anna Weber',  description: 'DPO review completed at week 7; minor data retention clause requested; contract revised.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Legal Team',  description: 'Legal negotiates contract clauses; shared capacity with 3 other procurement processes causes 3-week delay.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Marcus Lee',  description: 'Contract signed; hands over to IT Operations for tool provisioning and onboarding.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'RFP Issued',                        sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Budget Estimate Approved',          sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Finance Estimate Expired',          sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Vendor Selected',                   sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'DPO Review Requested',              sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'DPO Review Completed (Week 7)',     sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Contract Signed',                   sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Handover to IT Ops',                sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Issue RFP',                         sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Approve Budget Estimate',           sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Submit DPO Review Request',         sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Sign Contract',                     sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Resubmit Finance Estimate',         sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Marcus Lee (Product Manager)',      sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Anna Weber (DPO)',                  sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Kevin Park (Finance Manager)',      sequence: 16 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Finance Policy — Budget estimates are valid for 30 calendar days; resubmission requires new board sign-off.', sequence: 17 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Data Protection Policy — Any SaaS tool processing personal data requires a DPO-approved Data Processing Agreement before contract signing.', sequence: 18 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'DPO review can run in parallel with evaluation',
      sourceA: 'Marcus Lee (Product Manager) — assumed from past procurement experience',
      claimA: 'DPO review can begin once the shortlist is known (2–3 vendors), before the final selection.',
      sourceB: 'Anna Weber (DPO) — standard practice clarification',
      claimB: 'DPO review requires the final selected vendor only; initiating earlier would require re-review and waste capacity.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Finance estimate validity window vs. typical procurement cycle length',
      sourceA: 'Finance Policy documentation (approved by board)',
      claimA: 'Budget estimates are valid for 30 calendar days to ensure financial control and accuracy.',
      sourceB: 'Marcus Lee and procurement data (average cycle length analysis)',
      claimB: 'Complex procurement cycles with mandatory DPO review consistently exceed 30 days, making expiry a structural certainty, not an edge case.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'IT Service Procurement', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'Marcus Lee, IT Operations', input: 'Business requirements, monitoring tool criteria', step: '1. Issue RFP and evaluate vendors', output: 'Vendor shortlist, evaluation scorecard', customer: 'Finance, Legal, DPO' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'Marcus Lee', input: 'Selected vendor, contract draft', step: '2. Obtain finance budget approval', output: 'Approved budget estimate (valid 30 days)', customer: 'Marcus Lee, Legal' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Marcus Lee', input: 'Vendor data processing details, DPA draft', step: '3. DPO review and approval', output: 'Approved DPA, compliance sign-off', customer: 'Legal Team, Marcus Lee' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'Legal Team, Marcus Lee', input: 'Approved DPA, contract terms', step: '4. Negotiate and sign contract', output: 'Signed contract, PO number', customer: 'Finance, IT Operations' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Marcus Lee', input: 'Signed contract, vendor access details', step: '5. Hand over to IT Operations', output: 'Provisioned tool, onboarding plan', customer: 'IT Operations, End Users' },
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
  const maC2     = newId('ma');
  const maD1     = newId('ma');
  const maEnd    = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'IT Service Procurement Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: lane0Id, projectId: projId, mapId: pmId, label: 'Product Manager',  order: 0 },
    { id: lane1Id, projectId: projId, mapId: pmId, label: 'Finance',          order: 1 },
    { id: lane2Id, projectId: projId, mapId: pmId, label: 'Legal & DPO',      order: 2 },
    { id: lane3Id, projectId: projId, mapId: pmId, label: 'IT Operations',    order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart, projectId: projId, mapId: pmId, laneId: lane0Id, type: 'start', label: 'Start',                 note: '',                                                               x: 60,   y: 63  },
    { id: maA1,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Issue RFP',             note: 'Sends RFP to 5 vendors; collects responses over 3 weeks.',     x: 280,  y: 58  },
    { id: maB1,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Approve Budget',        note: 'Estimate valid 30 days; expires before evaluation ends.',       x: 280,  y: 228 },
    { id: maA2,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Evaluate Vendors',      note: 'Takes 35 days; finance estimate expires at day 30.',            x: 500,  y: 58  },
    { id: maB2,    projectId: projId, mapId: pmId, laneId: lane1Id, type: 'task',  label: 'Resubmit Estimate',     note: 'Re-approval required due to expiry; adds ~3 weeks.',            x: 500,  y: 228 },
    { id: maA3,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Select Vendor',         note: 'Final vendor selected post-evaluation.',                        x: 720,  y: 58  },
    { id: maC1,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'DPO Review',            note: '6-week queue; structural bottleneck on critical path.',          x: 940,  y: 398 },
    { id: maC2,    projectId: projId, mapId: pmId, laneId: lane2Id, type: 'task',  label: 'Legal Negotiation',     note: 'Shared legal capacity; 3-week delay across concurrent deals.',  x: 1160, y: 398 },
    { id: maA4,    projectId: projId, mapId: pmId, laneId: lane0Id, type: 'task',  label: 'Sign Contract',         note: 'Contract signed after DPO and legal sign-off received.',        x: 1380, y: 58  },
    { id: maD1,    projectId: projId, mapId: pmId, laneId: lane3Id, type: 'task',  label: 'Provision & Onboard',   note: 'IT Ops provisions tool and runs onboarding sessions.',           x: 1600, y: 568 },
    { id: maEnd,   projectId: projId, mapId: pmId, laneId: lane3Id, type: 'end',   label: 'End',                   note: '',                                                               x: 1820, y: 573 },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart, toId: maA1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA1,   toId: maB1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB1,   toId: maA2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA2,   toId: maB2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maB2,   toId: maA3,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA3,   toId: maC1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC1,   toId: maC2,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maC2,   toId: maA4,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maA4,   toId: maD1,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maD1,   toId: maEnd, label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procProcure, type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procSecurity,  toId: procProcure, type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcProcurement, projectId: projId, name: 'IT Service Procurement', customerOutcome: 'Business unit contracts a compliant IT service within budget and timeline through a governed process.', scope: 'Requirements definition, RFP, vendor evaluation, finance/legal approval, contract execution and handover.' },
    { id: svcVendorComp,  projectId: projId, name: 'Vendor Compliance Review', customerOutcome: 'Shortlisted vendors assessed for security and data protection compliance before contract commitment.', scope: 'Security questionnaire, risk assessment, DPA review and signing for all vendors processing personal data.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capVendorSelect, projectId: projId, name: 'Vendor Selection & Contracting', description: 'Ability to run a structured RFP, evaluate vendors and execute compliant contracts within budget.', realizingProcessIds: [procProcure, procCoreGroup] },
    { id: capSecReview,    projectId: projId, name: 'Vendor Security & Data Protection Review', description: 'Ability to assess vendor security posture and obtain a signed DPA before procurement commitment.', realizingProcessIds: [procSecurity, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procCoreGroup}__default`, projectId: projId, processId: procCoreGroup, configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 3 } },
    { id: `${procProcure}__default`,   projectId: projId, processId: procProcure,   configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 3 } },
    { id: `${procSecurity}__default`,  projectId: projId, processId: procSecurity,  configId: 'default', ratings: { strategic_impact: 4, pain_severity: 5, feasibility: 2, volume: 2 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
