// IT-03: Developer requesting cloud resources — platform service catalog and cost ownership.
// A platform engineer requests a Kubernetes namespace and storage quota for a new microservice.

import { newId } from '../../domain/contracts/ids';
import type {
  ProjectManifest, ProcessCandidate, ProcessDefinition,
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

export function buildIT03Scenario(): ScenarioBundle {
  const now = new Date().toISOString();

  const projId    = newId('proj');
  const personaId = newId('persona');
  const sysCatalog = newId('sys');
  const sysCloud   = newId('sys');
  const sysApproval = newId('sys');
  const chPortal  = newId('ch');
  const chEmail   = newId('ch');
  const tpCatalog = newId('tp');
  const tpApproval = newId('tp');
  const tpProvision = newId('tp');

  const procGroup     = newId('proc');  // core-group: Cloud Infrastructure Operations
  const procMgmt1     = newId('proc');  // management: IT Governance & Compliance
  const procMgmt2     = newId('proc');  // management: Cloud Strategy & Architecture
  const procRequest   = newId('proc');  // core: Request & Approval
  const procProvision = newId('proc');  // core: Automated Provisioning
  const procCost      = newId('proc');  // support: Cost Management
  const procSecurity  = newId('proc');  // support: Security & Access Control

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcCloudProv   = newId('svc');
  const svcCostMgmt    = newId('svc');

  const capSelfService = newId('cap');
  const capAutoProvision = newId('cap');
  const capCostAlloc   = newId('cap');

  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');

  const journeyId = newId('journey');

  const stgIdentify  = newId('stg');
  const stgRequest   = newId('stg');
  const stgApproval  = newId('stg');
  const stgProvision = newId('stg');
  const stgVerify    = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgIdentify,  label: 'Define resource requirements',      order: 0 },
    { stageId: stgIdentify,  label: 'Search the service catalog',        order: 1 },
    { stageId: stgRequest,   label: 'Configure the resource request',    order: 0 },
    { stageId: stgRequest,   label: 'Submit request with cost centre',   order: 1 },
    { stageId: stgApproval,  label: 'Receive acknowledgement',           order: 0 },
    { stageId: stgApproval,  label: 'Manager approves budget',           order: 1 },
    { stageId: stgApproval,  label: 'Security review clears request',    order: 2 },
    { stageId: stgProvision, label: 'Receive provisioning notification', order: 0 },
    { stageId: stgVerify,    label: 'Access cloud console',              order: 0 },
    { stageId: stgVerify,    label: 'Verify resources match request',    order: 1 },
    { stageId: stgVerify,    label: 'Run connectivity test',             order: 2 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));

  const rowActions   = newId('row');
  const rowSentiment = newId('row');
  const rowPainPts   = newId('row');
  const rowSystems   = newId('row');

  const actionSeeds: Record<string, string> = {
    'Define resource requirements':      'Lists CPU, memory and storage needs for new microservice; estimates traffic from existing services',
    'Search the service catalog':        'Finds "Kubernetes namespace" offering; tier options are unclear — no size guidance for new projects',
    'Configure the resource request':    'Chooses standard tier; must enter cost centre code — developer does not know it, asks manager',
    'Submit request with cost centre':   '20-min delay to get cost centre; finally submits; no confirmation of estimated monthly cost',
    'Receive acknowledgement':           'Auto-email with ticket number; states "2 business days"; no progress tracker linked',
    'Manager approves budget':           'Manager receives email; approves same day; developer not notified of approval step',
    'Security review clears request':    'No notification; developer discovers review happened only when checking ticket status',
    'Receive provisioning notification': 'Email arrives on day 2 with cluster endpoint and credentials — no instructions on first use',
    'Access cloud console':              'Navigates to console; default namespace not visible — must switch context manually',
    'Verify resources match request':    'Quota matches request; region is correct; no tagging applied — cost reporting will be inaccurate',
    'Run connectivity test':             'Test deployment succeeds; persistent storage class is different from what was requested',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Define resource requirements':      1,
    'Search the service catalog':        -1,
    'Configure the resource request':    -1,
    'Submit request with cost centre':   -2,
    'Receive acknowledgement':           0,
    'Manager approves budget':           0,
    'Security review clears request':    -1,
    'Receive provisioning notification': 0,
    'Access cloud console':              -1,
    'Verify resources match request':    0,
    'Run connectivity test':             -1,
  };

  const cells: Cell[] = [];
  const cards: JourneyCard[] = [];

  for (let i = 0; i < stepDefs.length; i++) {
    const stepId = stepIds[i];
    const label  = stepDefs[i].label;

    const actionCardIds: string[] = [];
    if (actionSeeds[label]) {
      const cardId = newId('card');
      actionCardIds.push(cardId);
      cards.push({ projectId: projId, id: cardId, cellId: '', payload: { kind: 'text', text: actionSeeds[label] }, sourceStatus: 'assumption', evidenceIds: [], note: '' });
    }
    const actionCellId = newId('cell');
    cells.push({ projectId: projId, id: actionCellId, journeyId, stepId, rowId: rowActions, cardOrder: actionCardIds });
    for (const c of cards.slice(-actionCardIds.length)) c.cellId = actionCellId;

    const sentCardIds: string[] = [];
    if (label in sentimentSeeds) {
      const cardId = newId('card');
      sentCardIds.push(cardId);
      cards.push({ projectId: projId, id: cardId, cellId: '', payload: { kind: 'sentiment', personaId, value: sentimentSeeds[label] }, sourceStatus: 'assumption', evidenceIds: [], note: '' });
    }
    const sentCellId = newId('cell');
    cells.push({ projectId: projId, id: sentCellId, journeyId, stepId, rowId: rowSentiment, cardOrder: sentCardIds });
    for (const c of cards.slice(-sentCardIds.length)) c.cellId = sentCellId;

    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowPainPts, cardOrder: [] });
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowSystems, cardOrder: [] });
  }

  const painPoints: PainPoint[] = [
    {
      id: newId('pp'), projectId: projId,
      title: 'Service catalog offers no sizing guidance for new projects',
      description: 'Developers must guess resource tier without workload benchmarks or examples.',
      severity: 'moderate', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[1]], affectedProcessIds: [procRequest],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Developer picks "standard" tier with no data; over- or under-provisions.',
      hypothesizedCause: 'Catalog managed by platform team without integration with capacity planning.',
      validatedCause: '', proposedIntervention: 'Add workload sizing calculator to catalog with examples by service type.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Cost centre required at submission but not communicated in advance',
      description: 'Developers do not know their cost centre code; must interrupt manager mid-task.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[3]], affectedProcessIds: [procRequest],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Average 20-min delay per request; some submissions abandoned for the day.',
      hypothesizedCause: 'Finance requirement added to form without updating developer onboarding docs.',
      validatedCause: '', proposedIntervention: 'Pre-populate cost centre from team membership in directory; allow override.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Provisioned storage class differs from catalog selection',
      description: 'Request specified SSD-backed storage; cluster was provisioned with standard spinning disk.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[10]], affectedProcessIds: [procProvision],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'I/O performance tests fail; developer must re-open ticket and wait another cycle.',
      hypothesizedCause: 'Automation script maps catalog tiers to cloud storage classes; mapping is outdated.',
      validatedCause: '', proposedIntervention: 'Post-provisioning verification step compares request spec to actual resource tags.',
    },
  ];

  const manifest: ProjectManifest = {
    id: projId,
    title: 'IT-03 · Cloud Resource Request Journey',
    description: 'Developer experience requesting a Kubernetes namespace and storage through a self-service cloud catalog.',
    createdAt: now, updatedAt: now, schemaVersion: 2,
  };

  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Cloud resource request and approval', status: 'accepted', rationale: 'Primary self-service workflow; directly observed from service catalog logs.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Automated resource provisioning', status: 'accepted', rationale: 'Platform automation triggered by approved request; hidden from requester.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId3, title: 'Cloud cost management and tagging', status: 'proposed', rationale: 'Supporting governance process; not visible to developer but affects billing accuracy.', sourceRefs: [], createdAt: now },
  ];

  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procMgmt1, title: 'IT Governance & Compliance',
      purpose: 'Ensure cloud usage aligns with security policies, regulatory requirements and architecture standards.',
      levelLabel: 'management', trigger: 'Policy review cycle or new compliance requirement.',
      outcome: 'Up-to-date governance policies; audit-ready cloud environment.',
      inScope: ['Policy definition', 'Compliance audits', 'Architecture review board'],
      outOfScope: ['Day-to-day provisioning operations'],
      status: 'draft', serviceIds: [svcCloudProv], capabilityIds: [], systemIds: [], evidenceIds: [],
    },
    { projectId: projId, id: procMgmt2, title: 'Cloud Strategy & Architecture',
      purpose: 'Define the multi-cloud adoption strategy, standard resource tiers and cost targets.',
      levelLabel: 'management', trigger: 'Annual planning or significant workload change.',
      outcome: 'Published cloud strategy; approved service catalog with standard tiers.',
      inScope: ['Service catalog design', 'Provider selection', 'Cost target-setting'],
      outOfScope: ['Individual request handling'],
      status: 'draft', serviceIds: [svcCloudProv], capabilityIds: [], systemIds: [], evidenceIds: [],
    },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procGroup, title: 'Cloud Infrastructure Operations',
      purpose: 'End-to-end delivery of cloud infrastructure from developer request to running resource.',
      levelLabel: 'core-group',
      trigger: 'Developer identifies infrastructure need.',
      outcome: 'Resources provisioned, cost-allocated and verified.',
      inScope: ['Self-service request', 'Approval', 'Provisioning', 'Verification'],
      outOfScope: ['Billing negotiation', 'Strategic cloud selection'],
      status: 'draft', serviceIds: [svcCloudProv, svcCostMgmt], capabilityIds: [capSelfService, capAutoProvision, capCostAlloc], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes (children of procGroup) ────────────────────────────
    { projectId: projId, id: procRequest, title: 'Request & Approval',
      purpose: 'Enable developers to request infrastructure resources through a governed self-service channel.',
      levelLabel: 'core', parentId: procGroup,
      trigger: 'Developer selects a catalog item and submits a resource request.',
      outcome: 'Request approved or rejected; developer notified with reason.',
      inScope: ['Catalog browsing', 'Request configuration', 'Budget approval', 'Security review', 'Requester notification'],
      outOfScope: ['Actual resource provisioning', 'Cost centre maintenance'],
      status: 'draft', serviceIds: [svcCloudProv], capabilityIds: [capSelfService], systemIds: [sysCatalog, sysApproval], evidenceIds: [],
    },
    { projectId: projId, id: procProvision, title: 'Automated Provisioning',
      purpose: 'Create cloud resources from an approved request spec without manual intervention.',
      levelLabel: 'core', parentId: procGroup,
      trigger: 'Request status changes to "Approved" in the approval system.',
      outcome: 'Resources created, tagged and accessible; requester receives access credentials.',
      inScope: ['Infrastructure-as-code execution', 'Resource tagging', 'Credential delivery', 'Post-provision verification'],
      outOfScope: ['Approval workflow', 'Billing reconciliation'],
      status: 'draft', serviceIds: [svcCloudProv], capabilityIds: [capAutoProvision], systemIds: [sysCatalog, sysCloud], evidenceIds: [],
    },
    // ── Support layer ─────────────────────────────────────────────────────────
    { projectId: projId, id: procCost, title: 'Cost Management & Tagging',
      purpose: 'Allocate cloud spend to cost centres and enforce tagging policy.',
      levelLabel: 'support',
      trigger: 'Resource provisioned or monthly billing cycle.',
      outcome: 'All resources tagged with valid cost centre; untagged spend alerted to owner.',
      inScope: ['Tag validation at provisioning', 'Monthly cost allocation reports', 'Untagged resource alerts'],
      outOfScope: ['Budget approval', 'Procurement'],
      status: 'draft', serviceIds: [svcCostMgmt], capabilityIds: [capCostAlloc], systemIds: [sysCloud], evidenceIds: [],
    },
    { projectId: projId, id: procSecurity, title: 'Security & Access Control',
      purpose: 'Enforce least-privilege access and security baselines on all provisioned resources.',
      levelLabel: 'support',
      trigger: 'New resource provisioned or security policy update.',
      outcome: 'Resources meet security baseline; access logs retained.',
      inScope: ['IAM policy enforcement', 'Network security group rules', 'Access log retention'],
      outOfScope: ['Application-level security', 'DDoS protection negotiation'],
      status: 'draft', serviceIds: [svcCloudProv], capabilityIds: [], systemIds: [sysCloud], evidenceIds: [],
    },
  ];

  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Alex Torres', role: 'Platform Engineer',
    goals: ['Provision infrastructure quickly without blocking team velocity', 'Understand cost implications before committing', 'Avoid manual back-and-forth with finance'],
    needs: ['Clear tier guidance in service catalog', 'Pre-populated cost centre from team directory', 'Immediate post-approval status update'],
    constraints: ['Cannot approve their own budget', 'No write access to cost centre records', 'Must use company service catalog — no direct cloud console access'],
    accessibilityNeeds: [],
    evidenceIds: [],
  }];

  const systems: ITSystem[] = [
    { projectId: projId, id: sysCatalog, name: 'Internal Developer Platform (IDP)', type: 'internal', criticality: 'high', supportingRole: 'Service catalog, request forms and approval workflow.', evidenceIds: [] },
    { projectId: projId, id: sysCloud,   name: 'Cloud Provider Console', type: 'saas', criticality: 'critical', supportingRole: 'Actual infrastructure hosting; accessed post-provisioning.', evidenceIds: [] },
    { projectId: projId, id: sysApproval, name: 'Budget Approval System', type: 'internal', criticality: 'medium', supportingRole: 'Routes budget approval requests to manager and finance.', evidenceIds: [] },
  ];

  const channels: Channel[] = [
    { projectId: projId, id: chPortal, name: 'Developer Portal', type: 'portal' },
    { projectId: projId, id: chEmail,  name: 'Email',            type: 'email' },
  ];

  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpCatalog,  name: 'Service catalog browser', purpose: 'Discover and configure available infrastructure offerings.', channelId: chPortal, systemIds: [sysCatalog], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpApproval, name: 'Approval workflow notifications', purpose: 'Notify requesters and approvers of pending decisions.', channelId: chEmail, systemIds: [sysApproval], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpProvision, name: 'Provisioning completion email', purpose: 'Delivers credentials and cluster endpoint to requester.', channelId: chEmail, systemIds: [sysCloud], recipientPersonaIds: [personaId], accessibilityConcerns: ['No accessible alternative if email is inaccessible'] },
  ];

  const journey: Journey = { projectId: projId, id: journeyId, title: 'Cloud Resource Request — Kubernetes Namespace',
    goal: 'Obtain a Kubernetes namespace and storage quota for a new microservice project.',
    situation: "Platform engineer needs cloud resources for a new service. Goes through the self-service catalog, hits a cost-centre blocker, and discovers post-provisioning that the storage class is wrong.",
    perspective: 'developer', state: 'as-is',
    personaIds: [personaId],
    stageOrder: [stgIdentify, stgRequest, stgApproval, stgProvision, stgVerify],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };

  const stages: JourneyStage[] = [
    { projectId: projId, id: stgIdentify,  journeyId, title: 'Identify',    description: '', order: 0 },
    { projectId: projId, id: stgRequest,   journeyId, title: 'Request',     description: '', order: 1 },
    { projectId: projId, id: stgApproval,  journeyId, title: 'Approval',    description: '', order: 2 },
    { projectId: projId, id: stgProvision, journeyId, title: 'Provisioning', description: '', order: 3 },
    { projectId: projId, id: stgVerify,    journeyId, title: 'Verification', description: '', order: 4 },
  ];

  const journeySteps: JourneyStep[] = stepDefs.map((s, i) => ({ projectId: projId, id: stepIds[i], journeyId, stageId: s.stageId, title: s.label, order: s.order,
  }));

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
    { id: intv1Id, projectId: projId, interviewee: 'Alex Torres', role: 'Platform Engineer', date: '2024-10-14', notes: 'Main requester persona; primary journey subject. Very candid about frustrations.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Priya Sharma', role: 'IT Service Desk Lead', date: '2024-10-15', notes: 'Processes 15–20 resource requests per week. Gave operational data on error rates.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Marcus Chen', role: 'Platform Engineering Lead', date: '2024-10-16', notes: 'Owns the IaC provisioning pipeline. Aware of storage class bug but deprioritised.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    // Alex Torres
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'I spent 20 minutes trying to get my cost centre code. The form just says "required" but nobody tells you where to find it.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'The tier names — Standard, Enhanced, Premium — mean nothing to me. I just picked Standard and hoped for the best.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'I check the ticket status 3–4 times on the first day. After that I just forget about it and wait for the email.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Can\'t the system pull my cost centre from my team profile? Finance already has the data in the directory.', createdAt: now },
    // Priya Sharma
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'About a third of requests come back to us because the cost centre code is wrong or missing.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'We get 15–20 resource requests a week. Each one that bounces takes another 2–3 days to resolve.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'Developers blame us for slow approvals, but the request usually sits in the manager\'s queue — we have no visibility there.', createdAt: now },
    // Marcus Chen
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'The storage class mapping in the provisioning script hasn\'t been touched since we migrated cloud providers in 2022.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The IaC pipeline runs in about 8 minutes once approved. The bottleneck is always the human approval chain.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'We should add a post-provision verification step, but it keeps falling between teams — nobody owns it.', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Developer',              description: 'Opens service catalog; spends ~3 minutes scanning tier options (Standard / Enhanced / Premium) without clicking any. No sizing guidance visible.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Developer',              description: 'Leaves the form mid-way to find cost centre code. Sends chat message to manager; waits ~20 minutes for a reply.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Developer',              description: 'Submits with wrong cost centre format. Form rejects silently — only an error message at the top of the page, easy to miss.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'IT Service Desk',        description: 'Reviews request fields against a printed checklist. Most time is spent verifying that the cost centre code is valid in Finance\'s system.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Developer',              description: 'Three separate status checks on day 1 — ticket page shows only "In progress" with no next step or ETA visible.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Developer',              description: 'Receives provisioning email with cluster endpoint but no first-use instructions. Developer googles "kubectl switch context".', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Developer & Platform Engineering', description: 'Developer opens ticket about wrong storage class. Ticket initially routed to wrong team; takes one extra day to reach the provisioning team.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events (domain facts that happened)
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Resource Requested',              sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Catalog Item Selected',           sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Cost Centre Entered',             sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Request Submitted',               sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Budget Approved',                 sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Security Cleared',                sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Resource Provisioned',            sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Storage Class Mismatch Detected', sequence: 17 },
    // Commands (actions that trigger events)
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Browse Service Catalog',          sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Configure & Submit Request',      sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Approve Budget',                  sequence: 10 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Review Security Scope',           sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Execute IaC Pipeline',            sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Verify Provisioned Resources',    sequence: 16 },
    // Actors (who issues each command)
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Developer',                       sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Manager / Finance',               sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Security Team',                   sequence: 13 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Provisioning Pipeline',           sequence: 15 },
    // Policies (business rules that gate transitions)
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Budget Approval Policy — requests over €500/month require manager sign-off', sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Security Review Policy — all external-facing namespaces need security clearance', sequence: 11 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Approval turnaround time',
      sourceA: 'Service catalog SLA documentation',
      claimA: 'Resource requests are processed within 2 business hours of submission.',
      sourceB: 'Alex Torres — developer interview (2024-10-14)',
      claimB: 'My request took 2 full business days. Nobody told me there was a separate security review step.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Storage class delivered by "Standard" tier',
      sourceA: 'Service catalog listing — Standard tier description',
      claimA: 'The Standard tier includes SSD-backed block storage for all persistent volumes.',
      sourceB: 'Alex Torres — post-provisioning ticket (2024-10-17)',
      claimB: 'My cluster was provisioned with standard spinning disk, not SSD. I/O performance tests failed.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Cloud Resource Provisioning', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    {
      id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0,
      supplier: 'Developer team',
      input: 'Resource request form\nCost centre code',
      step: '1. Developer submits request via portal',
      output: 'Submitted request ticket',
      customer: 'IT Service Desk',
    },
    {
      id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1,
      supplier: 'Finance / HR directory\n(cost centre data)',
      input: 'Budget allocation\nManager approval',
      step: '2. Manager reviews and approves budget',
      output: 'Approved request',
      customer: 'IT Service Desk\nSecurity team',
    },
    {
      id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2,
      supplier: 'Security team',
      input: 'Security policies\nIAM baseline rules',
      step: '3. Security team reviews access scope',
      output: 'Security clearance',
      customer: 'Provisioning pipeline',
    },
    {
      id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3,
      supplier: 'Cloud provider\nIaC templates',
      input: 'Approved request spec\nInfrastructure-as-code',
      step: '4. Pipeline provisions cloud resources',
      output: 'Running Kubernetes namespace\nAccess credentials',
      customer: 'Developer team',
    },
    {
      id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4,
      supplier: 'Provisioning pipeline',
      input: 'Resource specification\nExpected storage class',
      step: '5. Post-provision verification',
      output: 'Verified resource with correct tags and storage class',
      customer: 'Developer team\nFinance (cost allocation)',
    },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneDevId     = newId('ml');
  const laneDeskId    = newId('ml');
  const laneMgrId     = newId('ml');
  const lanePipeId    = newId('ml');

  // LANE_HEIGHT=170; y = laneIndex*170 + (170-nodeH)/2
  // nodeH: start/end=44, task=54, decision=76
  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart   = newId('ma');
  const maDefine  = newId('ma');
  const maBrowse  = newId('ma');
  const maSubmit  = newId('ma');
  const maReview  = newId('ma');
  const maApprove = newId('ma');
  const maSecurity = newId('ma');
  const maProvision = newId('ma');
  const maDeliver = newId('ma');
  const maAccess  = newId('ma');
  const maEnd     = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Cloud Resource Request & Provisioning', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneDevId,  projectId: projId, mapId: pmId, label: 'Developer',            order: 0 },
    { id: laneDeskId, projectId: projId, mapId: pmId, label: 'IT Service Desk',       order: 1 },
    { id: laneMgrId,  projectId: projId, mapId: pmId, label: 'Manager / Security',    order: 2 },
    { id: lanePipeId, projectId: projId, mapId: pmId, label: 'Provisioning Pipeline', order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,    projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'start',    label: 'Start',                    note: '', x: 60,   y: ly(0, 44) },
    { id: maDefine,   projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'task',     label: 'Define requirements',      note: 'Developer lists CPU, memory and storage needs', x: 280,  y: ly(0, 54) },
    { id: maBrowse,   projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'task',     label: 'Browse service catalog',   note: 'Developer picks tier — no sizing guidance available', x: 500,  y: ly(0, 54) },
    { id: maSubmit,   projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'task',     label: 'Submit request',           note: '20-min delay to find cost centre code', x: 720,  y: ly(0, 54) },
    { id: maReview,   projectId: projId, mapId: pmId, laneId: laneDeskId, type: 'task',     label: 'Review & validate',        note: '~30% of requests rejected due to wrong cost centre', x: 940,  y: ly(1, 54) },
    { id: maApprove,  projectId: projId, mapId: pmId, laneId: laneMgrId,  type: 'task',     label: 'Approve budget',           note: 'Manager approves same day — developer not notified', x: 940,  y: ly(2, 54) },
    { id: maSecurity, projectId: projId, mapId: pmId, laneId: laneMgrId,  type: 'task',     label: 'Security review',          note: 'No notification to developer; discovered only by checking ticket status', x: 1160, y: ly(2, 54) },
    { id: maProvision,projectId: projId, mapId: pmId, laneId: lanePipeId, type: 'task',     label: 'Execute IaC pipeline',     note: '~8 minutes runtime; storage class mapping outdated since 2022', x: 1160, y: ly(3, 54) },
    { id: maDeliver,  projectId: projId, mapId: pmId, laneId: lanePipeId, type: 'task',     label: 'Deliver credentials',      note: 'Email with endpoint only — no first-use instructions', x: 1380, y: ly(3, 54) },
    { id: maAccess,   projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'task',     label: 'Access cloud console',     note: 'Developer must switch kubectl context manually', x: 1600, y: ly(0, 54) },
    { id: maEnd,      projectId: projId, mapId: pmId, laneId: laneDevId,  type: 'end',      label: 'End',                      note: '', x: 1820, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,    toId: maDefine,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maDefine,   toId: maBrowse,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maBrowse,   toId: maSubmit,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSubmit,   toId: maReview,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maReview,   toId: maApprove,  label: 'Valid' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maApprove,  toId: maSecurity, label: 'Approved' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSecurity, toId: maProvision,label: 'Cleared' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maProvision,toId: maDeliver,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maDeliver,  toId: maAccess,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maAccess,   toId: maEnd,      label: '' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcCloudProv, projectId: projId, name: 'Cloud Resource Provisioning', customerOutcome: 'Developer receives a correctly configured, cost-tagged cloud resource within 2 business days of submission.', scope: 'Self-service catalog requests, approval, automated IaC provisioning and post-provision verification.' },
    { id: svcCostMgmt,  projectId: projId, name: 'Cloud Cost Management', customerOutcome: 'All cloud spend accurately allocated to cost centres with timely alerts for untagged resources.', scope: 'Resource tagging at provisioning, monthly cost allocation reports and untagged resource alerting.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capSelfService,   projectId: projId, name: 'Self-Service Resource Catalog', description: 'Ability for developers to discover, configure and submit infrastructure requests without manual IT involvement.', realizingProcessIds: [procRequest, procGroup] },
    { id: capAutoProvision, projectId: projId, name: 'Automated Infrastructure Provisioning', description: 'Ability to execute IaC pipelines and deliver correctly tagged, accessible cloud resources on approved requests.', realizingProcessIds: [procProvision, procGroup] },
    { id: capCostAlloc,     projectId: projId, name: 'Cost Allocation & Tagging', description: 'Ability to enforce cost centre tags at provisioning and report unallocated spend to owners.', realizingProcessIds: [procCost, procGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procMgmt1}__default`,     projectId: projId, processId: procMgmt1,     configId: 'default', ratings: { strategic_impact: 4, pain_severity: 2, feasibility: 4, volume: 2 } },
    { id: `${procMgmt2}__default`,     projectId: projId, processId: procMgmt2,     configId: 'default', ratings: { strategic_impact: 5, pain_severity: 3, feasibility: 3, volume: 1 } },
    { id: `${procGroup}__default`,     projectId: projId, processId: procGroup,     configId: 'default', ratings: { strategic_impact: 5, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procRequest}__default`,   projectId: projId, processId: procRequest,   configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procProvision}__default`, projectId: projId, processId: procProvision, configId: 'default', ratings: { strategic_impact: 5, pain_severity: 3, feasibility: 4, volume: 4 } },
    { id: `${procCost}__default`,      projectId: projId, processId: procCost,      configId: 'default', ratings: { strategic_impact: 4, pain_severity: 3, feasibility: 4, volume: 3 } },
    { id: `${procSecurity}__default`,  projectId: projId, processId: procSecurity,  configId: 'default', ratings: { strategic_impact: 5, pain_severity: 2, feasibility: 4, volume: 3 } },
  ];

  return {
    manifest, candidates, processes, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
