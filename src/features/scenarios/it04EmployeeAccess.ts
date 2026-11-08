// IT-04: New employee requesting system access — HR/IT/security interfaces and accountability.
// A new engineer discovers missing access on their first day and navigates approval loops.

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

export function buildIT04Scenario(): ScenarioBundle {
  const now = new Date().toISOString();

  const projId     = newId('proj');
  const personaId  = newId('persona');
  const sysHRIS    = newId('sys');
  const sysITPortal = newId('sys');
  const sysIAM     = newId('sys');
  const sysGitHub  = newId('sys');
  const chEmail    = newId('ch');
  const chPortal   = newId('ch');
  const tpWelcome  = newId('tp');
  const tpITPortal = newId('tp');
  const tpApproval = newId('tp');

  const procCoreGroup = newId('proc');  // core-group: Identity & Access Provisioning
  const procOnboard   = newId('proc');
  const procAccess    = newId('proc');
  const procSecurity  = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcOnboarding  = newId('svc');
  const svcAccessReq   = newId('svc');

  const capDayOneAccess = newId('cap');
  const capSelfSvcAccess = newId('cap');

  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');

  const journeyId = newId('journey');

  const stgPreStart  = newId('stg');
  const stgFirstDay  = newId('stg');
  const stgRequest   = newId('stg');
  const stgApproval  = newId('stg');
  const stgResolution = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgPreStart,   label: 'Receive welcome email',            order: 0 },
    { stageId: stgPreStart,   label: 'Complete HR profile online',       order: 1 },
    { stageId: stgFirstDay,   label: 'Activate primary account',         order: 0 },
    { stageId: stgFirstDay,   label: 'Receive standard access package',  order: 1 },
    { stageId: stgFirstDay,   label: 'Discover missing dev environment', order: 2 },
    { stageId: stgRequest,    label: 'Find the IT request form',         order: 0 },
    { stageId: stgRequest,    label: 'Submit access request',            order: 1 },
    { stageId: stgApproval,   label: 'Manager approves',                 order: 0 },
    { stageId: stgApproval,   label: 'Request rejected — wrong form',    order: 1 },
    { stageId: stgApproval,   label: 'Resubmit with correct form',       order: 2 },
    { stageId: stgApproval,   label: 'Security group review',            order: 3 },
    { stageId: stgResolution, label: 'Access granted',                   order: 0 },
    { stageId: stgResolution, label: 'Verify all required systems',      order: 1 },
  ];
  const stepIds = stepDefs.map(() => newId('step'));

  const rowActions   = newId('row');
  const rowSentiment = newId('row');
  const rowPainPts   = newId('row');
  const rowSystems   = newId('row');

  const actionSeeds: Record<string, string> = {
    'Receive welcome email':            'Email from HR contains laptop collection instructions; IT setup steps missing or link is broken',
    'Complete HR profile online':       'Sets up payroll and emergency contacts in HRIS; no mention of access request process',
    'Activate primary account':         'Receives activation link by phone on day one; link expires before IT desk opens at 9am',
    'Receive standard access package':  'Gets email, calendar and VPN access; no dev tools, no source code repository',
    'Discover missing dev environment': 'Tries to clone first repo — no GitHub organisation membership; asks team, discovers 3 more missing systems',
    'Find the IT request form':         'Searches intranet; finds three different access request forms — unclear which applies to developer role',
    'Submit access request':            'Submits "Generic Access Request" for GitHub, Jira, Confluence and cloud console',
    'Manager approves':                 'Manager receives email and approves within the hour',
    'Request rejected — wrong form':    'IT rejects request — developer should have used "Developer Onboarding Access" form; no auto-redirect',
    'Resubmit with correct form':       'Finds correct form after asking senior colleague; resubmits; loses manager approval (must re-approve)',
    'Security group review':            'Security team reviews GitHub org and cloud console access; no status updates during 2-day wait',
    'Access granted':                   'Access email arrives on day 3; Confluence still missing — was not on the new form',
    'Verify all required systems':      'Checks list with manager; 1 of 5 systems still missing; submits third ticket',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Receive welcome email':            0,
    'Complete HR profile online':       0,
    'Activate primary account':         -2,
    'Receive standard access package':  -1,
    'Discover missing dev environment': -2,
    'Find the IT request form':         -2,
    'Submit access request':            -1,
    'Manager approves':                 1,
    'Request rejected — wrong form':    -2,
    'Resubmit with correct form':       -2,
    'Security group review':            -1,
    'Access granted':                   0,
    'Verify all required systems':      -1,
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
      title: 'Account activation link expires before IT desk opens',
      description: "Welcome email sent at 7am; link expiry is 2 hours; IT help desk opens at 9am — employee cannot activate on first day.",
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[2]], affectedProcessIds: [procOnboard],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Employee cannot log in; wastes first morning waiting for IT reset.',
      hypothesizedCause: 'Email automation uses default 2-hour expiry; no coordination with working hours.',
      validatedCause: '', proposedIntervention: 'Extend expiry to 24 hours or trigger send at start of business day.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Three overlapping access forms with no role-based routing',
      description: 'Intranet has Generic, Developer Onboarding and Contractor Access forms; no guidance on which to use.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[5]], affectedProcessIds: [procAccess],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Developer uses wrong form; request rejected on day 2; must restart approval chain.',
      hypothesizedCause: 'Forms created by different teams without central routing logic.',
      validatedCause: '', proposedIntervention: 'Single access request form with role-based pre-selection from HR data.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Rejection resets manager approval requiring re-approval',
      description: 'When IT rejects a request for form reason, the original approval is voided and manager must re-approve.',
      severity: 'moderate', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[9]], affectedProcessIds: [procAccess],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Manager re-approval adds another day; total resolution time stretches to 4 days.',
      hypothesizedCause: 'Approval system ties approvals to form instance, not to the access bundle requested.',
      validatedCause: '', proposedIntervention: 'Transfer approval to corrected request automatically when rejection reason is form error only.',
    },
  ];

  const manifest: ProjectManifest = {
    id: projId,
    title: 'IT-04 · New Employee Access Journey',
    description: "New software engineer's experience requesting system access in their first week, navigating broken links, wrong forms and approval loops.",
    createdAt: now, updatedAt: now, schemaVersion: 2,
  };

  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Employee onboarding access provisioning', status: 'accepted', rationale: 'Core IT onboarding process; directly experienced by new hires.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Access request and approval workflow', status: 'accepted', rationale: 'Repeatable self-service process triggered outside onboarding too.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId3, title: 'Security group membership review', status: 'proposed', rationale: 'Supporting governance process for privileged system access.', sourceRefs: [], createdAt: now },
  ];

  const processes: ProcessDefinition[] = [
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup,
      title: 'Identity & Access Provisioning',
      purpose: 'Provision and govern all employee system access from day-one onboarding through ongoing self-service requests.',
      levelLabel: 'core-group',
      trigger: 'HR confirms a new hire, or an employee submits an access request.',
      outcome: 'Employee has all required system access; IAM records up to date.',
      inScope: ['Onboarding access packages', 'Self-service access requests', 'Manager approval routing', 'IAM provisioning'],
      outOfScope: ['Security group policy definition', 'Emergency break-glass access'],
      status: 'draft', serviceIds: [svcOnboarding, svcAccessReq], capabilityIds: [capDayOneAccess, capSelfSvcAccess], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procOnboard, title: 'Employee onboarding access provisioning',
      purpose: 'Ensure new employees have all required system access on their first working day.',
      levelLabel: 'core', parentId: procCoreGroup, trigger: 'HR confirms new hire start date in HRIS.',
      outcome: 'Standard access package activated; employee can begin productive work.',
      inScope: ['Account creation', 'Standard access package assignment', 'Activation email delivery', 'IT orientation'],
      outOfScope: ['Role-specific access beyond standard package', 'Hardware provisioning'],
      status: 'draft', serviceIds: [svcOnboarding], capabilityIds: [capDayOneAccess], systemIds: [sysHRIS, sysIAM], evidenceIds: [],
    },
    { projectId: projId, id: procAccess, title: 'Access request and approval workflow',
      purpose: 'Process employee requests for system access beyond the standard onboarding package.',
      levelLabel: 'core', parentId: procCoreGroup, trigger: 'Employee submits an access request via IT portal.',
      outcome: 'Access granted or denied with explanation; IAM records updated.',
      inScope: ['Request intake', 'Manager approval routing', 'IT validation', 'IAM provisioning', 'Requester notification'],
      outOfScope: ['Standard onboarding access', 'Emergency break-glass access'],
      status: 'draft', serviceIds: [svcAccessReq], capabilityIds: [capSelfSvcAccess], systemIds: [sysITPortal, sysIAM], evidenceIds: [],
    },
    { projectId: projId, id: procSecurity, title: 'Security group membership review',
      purpose: 'Validate that access requests to sensitive systems meet security policy before provisioning.',
      levelLabel: 'management', trigger: 'Access request routed to security team for elevated or sensitive access.',
      outcome: 'Request approved or denied with policy justification; audit record created.',
      inScope: ['Policy check', 'Risk assessment', 'Approval or denial', 'Audit logging'],
      outOfScope: ['Routine access requests below sensitivity threshold'],
      status: 'draft', serviceIds: [svcAccessReq], capabilityIds: [], systemIds: [sysIAM], evidenceIds: [],
    },
  ];

  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Jordan Kim', role: 'Software Engineer (New Hire)',
    goals: ['Be productive in the first week', 'Set up development environment quickly', 'Avoid blocking teammates while waiting for access'],
    needs: ['Clear list of required systems at onboarding', 'Single access request path', 'Transparent approval status'],
    constraints: ['Cannot self-provision access', 'Does not know internal forms or processes', 'Time pressure from team sprint starting on day one'],
    accessibilityNeeds: [],
    evidenceIds: [],
  }];

  const systems: ITSystem[] = [
    { projectId: projId, id: sysHRIS,    name: 'HR Information System (HRIS)', type: 'saas', criticality: 'high', supportingRole: 'Employee record, role and start date; source of truth for onboarding triggers.', evidenceIds: [] },
    { projectId: projId, id: sysITPortal, name: 'IT Self-Service Portal',     type: 'internal', criticality: 'high', supportingRole: 'Access request forms, ticket tracking, knowledge base.', evidenceIds: [] },
    { projectId: projId, id: sysIAM,     name: 'Identity and Access Management (IAM)', type: 'internal', criticality: 'critical', supportingRole: 'Identity directory, group membership, SSO integration.', evidenceIds: [] },
    { projectId: projId, id: sysGitHub,  name: 'GitHub Enterprise',            type: 'saas', criticality: 'high', supportingRole: 'Source code repository and CI/CD; requires org membership.', evidenceIds: [] },
  ];

  const channels: Channel[] = [
    { projectId: projId, id: chEmail,  name: 'Email', type: 'email' },
    { projectId: projId, id: chPortal, name: 'IT Self-Service Portal', type: 'portal' },
  ];

  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpWelcome,  name: 'HR welcome email', purpose: 'Delivers first-day instructions and activation link.', channelId: chEmail, systemIds: [sysHRIS], recipientPersonaIds: [personaId], accessibilityConcerns: ['Link expiry must accommodate users who cannot access email immediately'] },
    { projectId: projId, id: tpITPortal, name: 'Access request form', purpose: 'Primary channel for requesting system access beyond onboarding package.', channelId: chPortal, systemIds: [sysITPortal], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpApproval, name: 'Approval status notifications', purpose: 'Notifies requester and approvers of approval actions and rejections.', channelId: chEmail, systemIds: [sysITPortal], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
  ];

  const journey: Journey = { projectId: projId, id: journeyId, title: 'New Employee Access — First Week',
    goal: 'Gain all required system access within the first week to contribute to the sprint.',
    situation: "New software engineer joins a tech company. Standard onboarding package is missing developer tools. Navigates three overlapping request forms, a rejection, and a re-approval loop before getting access on day 4.",
    perspective: 'employee', state: 'as-is',
    personaIds: [personaId],
    stageOrder: [stgPreStart, stgFirstDay, stgRequest, stgApproval, stgResolution],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };

  const stages: JourneyStage[] = [
    { projectId: projId, id: stgPreStart,   journeyId, title: 'Pre-start',   description: '', order: 0 },
    { projectId: projId, id: stgFirstDay,   journeyId, title: 'First day',   description: '', order: 1 },
    { projectId: projId, id: stgRequest,    journeyId, title: 'Request',     description: '', order: 2 },
    { projectId: projId, id: stgApproval,   journeyId, title: 'Approval',    description: '', order: 3 },
    { projectId: projId, id: stgResolution, journeyId, title: 'Resolution',  description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Jordan Kim', role: 'Software Engineer (New Hire)', date: '2024-10-07', notes: 'Day 4 of employment. Arrived with notes app open listing every access block encountered. Very precise about times and sequence of events.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Sarah Park', role: 'HR Coordinator', date: '2024-10-08', notes: 'Sends 15–20 welcome emails per month. Not aware of the activation link expiry timing issue — no one had reported it directly to HR.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Tom Wells', role: 'IT Service Desk Agent', date: '2024-10-08', notes: 'Processes new hire access tickets daily. Knows the three-form problem well. Has had the same conversation about which form to use "maybe 50 times".', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'The welcome email arrived at 7am. I was excited — clicked the link straight away on my phone. It said the link had expired. I assumed I\'d done something wrong. I didn\'t find out until 9:30 that IT doesn\'t open until 9.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'I found three different access request forms on the intranet. None of them said "this one is for software engineers". I guessed wrong and my request got rejected on day two.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Why can\'t onboarding just come with a checklist of all the systems I need? My manager had to tell me about GitHub — it wasn\'t on any official list.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'We send the welcome email the night before the start date — usually around 7pm, sometimes earlier. I didn\'t realise the activation link only lasted 2 hours.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The standard access package was designed by IT two years ago. We\'ve never reviewed it against current role requirements. Developer tools were never in scope.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'When a request gets rejected, HR isn\'t notified. We only find out if the new hire escalates. Otherwise it just disappears into IT\'s queue.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'The "Developer Onboarding Access" form was created by one team and the "Generic Access Request" was created by another. Nobody put a pointer between them. I explain it to new hires maybe every other day.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'When I reject a request because they used the wrong form, the manager\'s approval gets voided. That\'s a system limitation I can\'t fix from my end.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'If the HRIS knew someone\'s role, couldn\'t it pre-fill the right form or at least route them to it automatically? We have all that data — it just doesn\'t connect.', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'New Employee',   description: 'Arrives at desk at 8:52am. Attempts to click activation link from phone email. Browser shows "This link has expired. Please contact your IT helpdesk." Employee rereads the welcome email twice looking for another link.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'New Employee',   description: 'Waits 37 minutes from arriving at desk to being able to log in after IT agent manually resets the activation link at 9:29am. During the wait, the employee has no laptop access and sits in the welcome meeting unable to follow along.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'New Employee',   description: 'Searches intranet for "access request form". Three forms appear: Generic Access Request, Developer Onboarding Access, and Contractor System Access. No descriptions explain which applies to permanent employees in developer roles. Employee picks Generic.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'IT Agent',       description: 'Reviews submitted Generic Access Request. Identifies GitHub and cloud console as requiring Developer Onboarding form. Sends rejection email with form name but no link. Employee must search again.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'New Employee',   description: 'Resubmits with correct form on day 3. Manager re-approval email sent — manager already approved the identical request the previous day. Additional 6-hour wait for manager to re-action.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'IT Security',    description: 'Security group review for GitHub org and cloud console access takes 2 days. No status update sent during review. Employee checks ticket 4 times on day 3 and day 4 — status shows "Pending Security Approval" with no ETA.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'New Employee & Manager', description: 'Manager walks over to employee desk on day 4 to find out why they haven\'t committed any code yet. Employee explains access chain. Manager sends escalation email directly to IT manager — access provisioned within 2 hours.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Start Date Confirmed',              sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Welcome Email Sent',                sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Standard Account Activated',        sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Missing Access Discovered',         sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Access Request Submitted',          sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Manager Approval Received',         sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Access Provisioned',                sequence: 13 },
    // Commands
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Trigger Onboarding Workflow',       sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Activate Account',                  sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Submit Access Request',             sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Route to Manager Approval',         sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Provision System Access',           sequence: 10 },
    // Actors
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'New Employee',                       sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'HR Coordinator',                    sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'IT Service Desk',                   sequence: 16 },
    // Policies
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Activation Link Expiry Policy — links expire 2 hours after generation (default security setting; not role-aware)', sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Access Approval Policy — all access beyond standard package requires direct manager approval before IT provisioning', sequence: 17 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Standard access package coverage for developer role',
      sourceA: 'HR Coordinator Sarah Park (2024-10-08)',
      claimA: 'The standard access package covers everything a new employee needs on day one: email, calendar, VPN, and the company intranet.',
      sourceB: 'Jordan Kim — New Hire Software Engineer (2024-10-07)',
      claimB: 'The standard package had no developer tools, no GitHub access, no Jira and no cloud console. I couldn\'t do any actual work until day 4.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Which access request form applies to new software engineers',
      sourceA: 'IT Self-Service Portal — intranet search results',
      claimA: 'Three forms available: Generic Access Request, Developer Onboarding Access, Contractor System Access. No routing guidance shown.',
      sourceB: 'IT Agent Tom Wells (2024-10-08)',
      claimB: 'Developer Onboarding Access is the right form for permanent software engineers. I\'ve explained this to new hires maybe 50 times. It\'s not documented anywhere accessible.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'New Employee IT Access Provisioning', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'HR / HRIS', input: 'Confirmed start date\nRole and department', step: '1. HR triggers onboarding in HRIS', output: 'Onboarding record created\nWelcome email triggered', customer: 'New Employee\nIT Service Desk' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'IAM / Identity Platform', input: 'Employee record\nActivation link', step: '2. IT provisions standard access package', output: 'Active account\nEmail / VPN / calendar', customer: 'New Employee' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'New Employee\nIT Self-Service Portal', input: 'Access request form\nRole justification', step: '3. Employee submits additional access request', output: 'Submitted access ticket\nManager approval request', customer: 'Manager\nIT Security' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'Manager\nIT Security', input: 'Approval decision\nSecurity review result', step: '4. Approve and security-review request', output: 'Approved request\nSecurity clearance', customer: 'IT Service Desk' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'IAM / GitHub / Cloud Console', input: 'Approved access spec\nSystem provisioning rules', step: '5. Provision role-specific system access', output: 'Active developer access\nNotification to employee', customer: 'New Employee\nManager' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneEmpId  = newId('ml');
  const laneHRId   = newId('ml');
  const laneDeskId = newId('ml');
  const laneSecId  = newId('ml');

  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart    = newId('ma');
  const maHRTrig   = newId('ma');
  const maStdPkg   = newId('ma');
  const maActivate = newId('ma');
  const maDiscover = newId('ma');
  const maSubmit   = newId('ma');
  const maMgrApprv = newId('ma');
  const maSecRev   = newId('ma');
  const maProvision = newId('ma');
  const maVerify   = newId('ma');
  const maEnd      = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'New Employee Access Provisioning Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneEmpId,  projectId: projId, mapId: pmId, label: 'New Employee',     order: 0 },
    { id: laneHRId,   projectId: projId, mapId: pmId, label: 'HR',               order: 1 },
    { id: laneDeskId, projectId: projId, mapId: pmId, label: 'IT Service Desk',  order: 2 },
    { id: laneSecId,  projectId: projId, mapId: pmId, label: 'IT Security',      order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,     projectId: projId, mapId: pmId, laneId: laneHRId,   type: 'start', label: 'Start',                      note: '', x: 60,   y: ly(1, 44) },
    { id: maHRTrig,    projectId: projId, mapId: pmId, laneId: laneHRId,   type: 'task',  label: 'Trigger onboarding in HRIS',  note: 'Sends welcome email at ~7am day before start; activation link 2h expiry', x: 280,  y: ly(1, 54) },
    { id: maStdPkg,    projectId: projId, mapId: pmId, laneId: laneDeskId, type: 'task',  label: 'Provision standard package',  note: 'Email, calendar, VPN — no developer tools', x: 500,  y: ly(2, 54) },
    { id: maActivate,  projectId: projId, mapId: pmId, laneId: laneEmpId,  type: 'task',  label: 'Activate account',            note: 'Link expires at 9am before IT desk opens — common failure point', x: 500,  y: ly(0, 54) },
    { id: maDiscover,  projectId: projId, mapId: pmId, laneId: laneEmpId,  type: 'task',  label: 'Discover missing access',     note: 'GitHub, Jira, cloud console missing; no official checklist', x: 720,  y: ly(0, 54) },
    { id: maSubmit,    projectId: projId, mapId: pmId, laneId: laneEmpId,  type: 'task',  label: 'Submit access request',       note: '3 overlapping forms; employee chooses wrong form; rejection adds 1 day', x: 940,  y: ly(0, 54) },
    { id: maMgrApprv,  projectId: projId, mapId: pmId, laneId: laneHRId,   type: 'task',  label: 'Manager approves',            note: 'Same-hour approval; but rejection voids this — must re-approve', x: 1160, y: ly(1, 54) },
    { id: maSecRev,    projectId: projId, mapId: pmId, laneId: laneSecId,  type: 'task',  label: 'Security group review',       note: '2-day review; no status updates during wait', x: 1160, y: ly(3, 54) },
    { id: maProvision, projectId: projId, mapId: pmId, laneId: laneDeskId, type: 'task',  label: 'Provision developer access',  note: 'GitHub org, Jira, cloud console; Confluence missed on second form', x: 1380, y: ly(2, 54) },
    { id: maVerify,    projectId: projId, mapId: pmId, laneId: laneEmpId,  type: 'task',  label: 'Verify all access',           note: '1 of 5 systems still missing on day 4; third ticket required', x: 1600, y: ly(0, 54) },
    { id: maEnd,       projectId: projId, mapId: pmId, laneId: laneEmpId,  type: 'end',   label: 'End',                         note: '', x: 1820, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,    toId: maHRTrig,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maHRTrig,   toId: maStdPkg,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maHRTrig,   toId: maActivate,  label: 'Welcome email' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maActivate, toId: maDiscover,  label: 'Logged in' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maDiscover, toId: maSubmit,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSubmit,   toId: maMgrApprv,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maMgrApprv, toId: maSecRev,    label: 'Approved' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSecRev,   toId: maProvision, label: 'Cleared' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maProvision,toId: maVerify,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maVerify,   toId: maEnd,       label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procOnboard,  type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procAccess,   type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procSecurity,  toId: procOnboard,  type: 'supportsService' },
    { id: newId('rel'), projectId: projId, fromId: procSecurity,  toId: procAccess,   type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcOnboarding,  projectId: projId, name: 'Employee Day-One Access', customerOutcome: 'New employee fully productive on day one with all standard system access activated.', scope: 'Account creation, standard access package provisioning and activation email delivery for new hires.' },
    { id: svcAccessReq,   projectId: projId, name: 'Self-Service Access Request', customerOutcome: 'Employee receives role-appropriate system access within agreed SLA after a single approved request.', scope: 'Access request intake, manager approval routing, security review and IAM provisioning for existing employees.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capDayOneAccess,   projectId: projId, name: 'Day-One Access Provisioning', description: 'Ability to deliver a complete, role-matched access package to a new employee before their start date.', realizingProcessIds: [procOnboard, procCoreGroup] },
    { id: capSelfSvcAccess,  projectId: projId, name: 'Access Request & Approval', description: 'Ability to process, approve and provision additional system access via a governed self-service workflow.', realizingProcessIds: [procAccess, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procCoreGroup}__default`, projectId: projId, processId: procCoreGroup, configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 4 } },
    { id: `${procOnboard}__default`,   projectId: projId, processId: procOnboard,   configId: 'default', ratings: { strategic_impact: 5, pain_severity: 5, feasibility: 3, volume: 4 } },
    { id: `${procAccess}__default`,    projectId: projId, processId: procAccess,    configId: 'default', ratings: { strategic_impact: 4, pain_severity: 5, feasibility: 3, volume: 5 } },
    { id: `${procSecurity}__default`,  projectId: projId, processId: procSecurity,  configId: 'default', ratings: { strategic_impact: 4, pain_severity: 2, feasibility: 3, volume: 3 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
