// IT-02: IT Service Desk scenario — incident reporting and fulfillment from the end-user perspective.
// A developer reports a laptop issue, waits for triage, gets a loaner, and follows up on resolution.

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

export function buildIT02Scenario(): ScenarioBundle {
  const now = new Date().toISOString();

  const projId       = newId('proj');
  const personaId    = newId('persona');
  const sysItsm      = newId('sys');
  const sysChat      = newId('sys');
  const chPortal     = newId('ch');
  const chEmail      = newId('ch');
  const chChatCh     = newId('ch');
  const tpPortal     = newId('tp');
  const tpEmail      = newId('tp');
  const tpAgent      = newId('tp');

  const procMgmt1      = newId('proc');  // management: IT Service Quality & SLA Governance
  const procCoreGroup  = newId('proc');  // core-group: Incident & Service Fulfillment
  const procIncident   = newId('proc');
  const procFulfill    = newId('proc');

  // ─── Service & Capability IDs ─────────────────────────────────────────────
  const svcIncident    = newId('svc');
  const svcLoaner      = newId('svc');

  const capTicket      = newId('cap');
  const capLoanerFul   = newId('cap');
  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');

  const journeyId = newId('journey');

  const stgReport    = newId('stg');
  const stgTriage    = newId('stg');
  const stgFulfill   = newId('stg');
  const stgResolution = newId('stg');
  const stgClosure   = newId('stg');

  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgReport,     label: 'Notice the issue',          order: 0 },
    { stageId: stgReport,     label: 'Search knowledge base',     order: 1 },
    { stageId: stgReport,     label: 'Submit ticket via portal',  order: 2 },
    { stageId: stgTriage,     label: 'Receive acknowledgement',   order: 0 },
    { stageId: stgTriage,     label: 'Wait for triage',           order: 1 },
    { stageId: stgTriage,     label: 'Provide more information',  order: 2 },
    { stageId: stgFulfill,    label: 'Get loaner device',         order: 0 },
    { stageId: stgFulfill,    label: 'Transfer data',             order: 1 },
    { stageId: stgFulfill,    label: 'Configure loaner',          order: 2 },
    { stageId: stgResolution, label: 'Monitor ticket status',     order: 0 },
    { stageId: stgResolution, label: 'Receive repair update',     order: 1 },
    { stageId: stgResolution, label: 'Return loaner',             order: 2 },
    { stageId: stgClosure,    label: 'Confirm resolution',        order: 0 },
    { stageId: stgClosure,    label: 'Complete satisfaction survey', order: 1 },
  ];

  const stepIds = stepDefs.map(() => newId('step'));

  const rowActions    = newId('row');
  const rowSentiment  = newId('row');
  const rowPainPts    = newId('row');
  const rowSystems    = newId('row');

  const actionSeeds: Record<string, string> = {
    'Notice the issue':         'Laptop keyboard unresponsive; tries restart — no effect',
    'Search knowledge base':    'Searches "keyboard not working" in self-service portal; no relevant result',
    'Submit ticket via portal': 'Fills in form with category Hardware, priority Medium; uploads photo',
    'Receive acknowledgement':  'Gets auto-reply email with ticket number and 4-hour SLA',
    'Wait for triage':          'No updates for 3 hours; checks portal — ticket still "New"',
    'Provide more information':  'Agent asks for serial number via email; user has to find asset label under laptop',
    'Get loaner device':        'IT desk hands over loaner at reception; must sign asset transfer form',
    'Transfer data':            'Copies files manually to USB; cloud sync not configured for this device',
    'Configure loaner':         'Needs to reinstall dev tools; some require admin rights not granted',
    'Monitor ticket status':    'Checks portal daily; status changes from "In progress" to "Waiting parts"',
    'Receive repair update':    'Gets call from IT when device is ready; no prior progress notification',
    'Return loaner':            'Returns to reception; waits 20 min for asset paperwork',
    'Confirm resolution':       'Verifies keyboard works; ticket auto-closed within 2 hours',
    'Complete satisfaction survey': '3-question CSAT survey sent by email',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Notice the issue':          -2,
    'Search knowledge base':     -1,
    'Submit ticket via portal':  -1,
    'Receive acknowledgement':    0,
    'Wait for triage':           -2,
    'Provide more information':  -1,
    'Get loaner device':          0,
    'Transfer data':             -1,
    'Configure loaner':          -2,
    'Monitor ticket status':     -1,
    'Receive repair update':      0,
    'Return loaner':             -1,
    'Confirm resolution':         1,
    'Complete satisfaction survey': 0,
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

    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowPainPts,  cardOrder: [] });
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowSystems,  cardOrder: [] });
  }

  const painPoints: PainPoint[] = [
    {
      id: newId('pp'), projectId: projId,
      title: 'No proactive status updates during triage',
      description: 'User has to actively poll the portal; no push notifications or automated status emails during wait.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[4]], affectedProcessIds: [procIncident],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Checks portal multiple times with no updates; calls desk after 3 hours.',
      hypothesizedCause: 'ITSM tool sends notifications only on status transitions, not on inactivity SLA breach.',
      validatedCause: '', proposedIntervention: 'Send proactive "still investigating" email after 2 hours of no update.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Loaner configuration requires admin rights not granted to end users',
      description: 'Standard dev tools require elevated privileges; user cannot configure loaner without IT intervention.',
      severity: 'significant', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[8]], affectedProcessIds: [procFulfill],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Installation blocked with "Access denied"; escalates to IT again, extending downtime by 1 day.',
      hypothesizedCause: 'Loaner policy does not include pre-approved software package for developer role.',
      validatedCause: '', proposedIntervention: 'Create "Developer loaner" profile pre-installed with standard dev stack.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Serial number collection wastes time',
      description: 'Agent requests asset serial number by email; user must physically flip laptop to find label.',
      severity: 'moderate', state: 'open',
      affectedPersonaIds: [personaId], affectedStepIds: [stepIds[5]], affectedProcessIds: [procIncident],
      scopeEstimate: '', evidenceIds: [], suspectedCauseIds: [],
      symptom: 'Round-trip email exchange adds 2–4 hours to triage; some users cannot find the label.',
      hypothesizedCause: 'Asset inventory not automatically linked to user record in ITSM.',
      validatedCause: '', proposedIntervention: 'Auto-populate asset details from CMDB when ticket is submitted by authenticated user.',
    },
  ];

  const manifest: ProjectManifest = {
    id: projId,
    title: 'IT-02 · IT Service Desk Journey',
    description: 'Developer end-user experience reporting a hardware incident and receiving a loaner device.',
    createdAt: now, updatedAt: now, schemaVersion: 2,
  };

  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1, title: 'Incident reporting and triage', status: 'accepted', rationale: 'Core ITSM process; directly observable from ticket data.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId2, title: 'Hardware fulfillment and loaner management', status: 'under-review', rationale: 'Fulfillment subprocess; may be part of incident or separate service request.', sourceRefs: [], createdAt: now },
    { projectId: projId, id: candId3, title: 'Asset tracking and CMDB update', status: 'proposed', rationale: 'Supporting data process; not directly visible to end user.', sourceRefs: [], createdAt: now },
  ];

  const processes: ProcessDefinition[] = [
    // ── Management layer ──────────────────────────────────────────────────────
    { projectId: projId, id: procMgmt1,
      title: 'IT Service Quality & SLA Governance',
      purpose: 'Define and monitor service-level targets, ticket quality standards, and continual improvement actions for the service desk.',
      levelLabel: 'management',
      trigger: 'Monthly service review or SLA breach detected.',
      outcome: 'SLA targets reviewed; improvement actions agreed and assigned.',
      inScope: ['SLA definition and review', 'Ticket quality audits', 'Continual service improvement', 'CSAT trend analysis'],
      outOfScope: ['Individual ticket handling', 'Hardware procurement'],
      status: 'draft', serviceIds: [svcIncident], capabilityIds: [], systemIds: [sysItsm], evidenceIds: [],
    },
    // ── Core group ────────────────────────────────────────────────────────────
    { projectId: projId, id: procCoreGroup,
      title: 'Incident & Service Fulfillment',
      purpose: 'Restore service and fulfil hardware requests for end users, from first contact to confirmed resolution.',
      levelLabel: 'core-group',
      trigger: 'User reports an incident or submits a service request.',
      outcome: 'User productive again; ticket closed; CSAT collected.',
      inScope: ['Incident management', 'Hardware fulfillment', 'Asset management during repair'],
      outOfScope: ['Problem management', 'Procurement of new hardware'],
      status: 'draft', serviceIds: [svcIncident, svcLoaner], capabilityIds: [capTicket, capLoanerFul], systemIds: [], evidenceIds: [],
    },
    // ── Core sub-processes ────────────────────────────────────────────────────
    { projectId: projId, id: procIncident, title: 'Incident management',
      purpose: 'Restore normal service operation as quickly as possible, minimizing impact on the end user.',
      levelLabel: 'core', parentId: procCoreGroup,
      trigger: 'User reports a service disruption via portal, chat or phone.',
      outcome: 'Incident resolved and user confirmed; ticket closed with CSAT collected.',
      inScope: ['Incident logging', 'Categorization and priority', 'Triage and diagnosis', 'Resolution and closure'],
      outOfScope: ['Root cause analysis (Problem Management)', 'Hardware repair execution'],
      status: 'draft', serviceIds: [svcIncident], capabilityIds: [capTicket], systemIds: [sysItsm], evidenceIds: [],
    },
    // ── Support layer ─────────────────────────────────────────────────────────
    { projectId: projId, id: procFulfill, title: 'Loaner device fulfillment',
      purpose: 'Provide a configured replacement device to users whose primary device is unavailable.',
      levelLabel: 'support', trigger: 'Incident ticket escalated to hardware replacement required.',
      outcome: 'User receives and returns loaner; asset records updated.',
      inScope: ['Loaner assignment', 'Asset transfer documentation', 'Device configuration', 'Return and re-imaging'],
      outOfScope: ['Original device repair', 'Procurement of new hardware'],
      status: 'draft', serviceIds: [svcLoaner], capabilityIds: [capLoanerFul], systemIds: [sysItsm], evidenceIds: [],
    },
  ];

  const personas: Persona[] = [{ projectId: projId, id: personaId, name: 'Maya Chen', role: 'Software Developer',
    goals: ['Resume productive work as quickly as possible', 'Avoid losing uncommitted work', 'Avoid context-switching to IT tasks'],
    needs: ['Real-time ticket status updates', 'Pre-configured loaner with dev tools', 'Minimal paperwork'],
    constraints: ['Cannot authorize hardware expenditures', 'Limited admin rights on managed devices', 'Deadline-driven work schedule'],
    accessibilityNeeds: [],
    evidenceIds: [],
  }];

  const systems: ITSystem[] = [
    { projectId: projId, id: sysItsm, name: 'ITSM Platform', type: 'saas', criticality: 'critical', supportingRole: 'Ticket management, SLA tracking, knowledge base and asset linking.', evidenceIds: [] },
    { projectId: projId, id: sysChat, name: 'Team Chat (IT channel)', type: 'saas', criticality: 'medium', supportingRole: 'Informal escalation and status queries via dedicated IT support channel.', evidenceIds: [] },
  ];

  const channels: Channel[] = [
    { projectId: projId, id: chPortal, name: 'Self-Service Portal', type: 'portal' },
    { projectId: projId, id: chEmail,  name: 'Email',               type: 'email' },
    { projectId: projId, id: chChatCh, name: 'Team Chat',            type: 'chat' },
  ];

  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpPortal, name: 'Ticket submission form', purpose: 'Primary channel for logging incidents and service requests.', channelId: chPortal, systemIds: [sysItsm], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpEmail,  name: 'Automated status emails', purpose: 'Sends acknowledgement and status change notifications.', channelId: chEmail,  systemIds: [sysItsm], recipientPersonaIds: [personaId], accessibilityConcerns: [] },
    { projectId: projId, id: tpAgent,  name: 'IT desk reception',       purpose: 'Physical handoff point for loaner devices and asset paperwork.', channelId: chChatCh, systemIds: [], recipientPersonaIds: [personaId], accessibilityConcerns: ['No accessible alternative for users who cannot visit reception'] },
  ];

  const journey: Journey = { projectId: projId, id: journeyId, title: 'IT Service Desk — Hardware Incident',
    goal: 'Get back to productive work with minimal downtime after a hardware failure.',
    situation: "Developer's laptop keyboard fails during a sprint. They report the incident, wait for triage, receive a loaner, and track resolution.",
    perspective: 'employee', state: 'as-is',
    personaIds: [personaId],
    stageOrder: [stgReport, stgTriage, stgFulfill, stgResolution, stgClosure],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now, updatedAt: now,
  };

  const stages: JourneyStage[] = [
    { projectId: projId, id: stgReport,     journeyId, title: 'Report',     description: '', order: 0 },
    { projectId: projId, id: stgTriage,     journeyId, title: 'Triage',     description: '', order: 1 },
    { projectId: projId, id: stgFulfill,    journeyId, title: 'Fulfillment', description: '', order: 2 },
    { projectId: projId, id: stgResolution, journeyId, title: 'Resolution', description: '', order: 3 },
    { projectId: projId, id: stgClosure,    journeyId, title: 'Closure',    description: '', order: 4 },
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
    { id: intv1Id, projectId: projId, interviewee: 'Maya Chen', role: 'Software Developer', date: '2024-11-04', notes: 'Primary persona. Had the ticket number and timeline memorised. Visibly frustrated by the loaner admin rights issue.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Ben Okafor', role: 'IT Service Desk Agent (L1)', date: '2024-11-05', notes: 'Handles 25–30 tickets per day. Gave us data on serial number lookup time. Sympathetic to developers but constrained by process.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'Lisa Park', role: 'IT Service Desk Manager', date: '2024-11-06', notes: 'Manages team of 6. Has SLA dashboards. Aware of the loaner configuration gap but waiting on procurement budget.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'Three hours of silence after submitting the ticket. I kept refreshing the portal. It just said "New" the whole time. I had no idea if anyone had even looked at it.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The loaner was fine hardware-wise, but I couldn\'t install anything without admin rights. I had to open a second ticket just to get a tool I need every day to function.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'If the system knows my name and my device from my login, why does the agent need to ask me for the serial number? IT manages these assets — they should already have it.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'We ask for the serial number because the CMDB record is often wrong or outdated. It\'s faster to confirm with the user than trust a stale database.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The standard loaner image doesn\'t include developer tools because we don\'t have an approved developer profile yet. It\'s been on the backlog for two quarters.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'I wish I could send a "we\'re still working on it" update automatically. Right now I have to remember to do it manually between other tickets.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'Our SLA says 4 hours for Priority Medium. We consistently hit it on first contact — the problem is there\'s no SLA clock on the silence between actions.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The developer loaner profile has been blocked by procurement. Each unit costs £80 more with the pre-installed dev stack, and we need executive sign-off to change the standard image.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'We know the CMDB asset linking is a problem but it\'s tied to a larger infrastructure project. Any quick win we can do in the ITSM tool itself?', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Developer',      description: 'Opens self-service portal on mobile phone. Ticket form has 12 fields. Developer fills in 8, leaves "Asset tag" and "Business impact" blank because they don\'t know the values.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Developer',      description: 'Ticket in "New" status for 3h 12m with no agent assigned. Developer sends a follow-up chat in the IT channel at hour 3 — that triggers an agent to pick it up.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'IT Agent',       description: 'Agent cannot find device in CMDB by employee name. Spends ~4 minutes trying different search terms before sending an email asking for the serial number.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'Developer',      description: 'Physically turns laptop upside-down to read serial number off label. Types it into email reply. Entire round-trip adds 2h 20m to triage time.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'Developer',      description: 'Receives loaner. Attempts to install VS Code — blocked with "You need administrative privileges to install this application." Opens a second ticket. Waits another 4 hours for admin rights to be granted remotely.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'Developer',      description: 'Checks ticket status daily for 4 days. Status transitions seen: New → In Progress → Waiting for Parts → In Progress. No email sent for any of these transitions.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'Developer & IT Agent', description: 'Developer calls IT desk to ask when laptop will be ready. Agent cannot give ETA — parts order is managed by a different team and tracked in a separate spreadsheet not visible in the ITSM tool.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Incident Reported',              sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Ticket Created',                 sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Ticket Assigned to Agent',       sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Serial Number Confirmed',        sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Loaner Device Issued',           sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Device Repaired',                sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Incident Resolved',              sequence: 13 },
    // Commands
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Submit Incident Ticket',         sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Triage and Categorise',          sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Issue Loaner Device',            sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Escalate to L2 Hardware',        sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Close Ticket and Survey',        sequence: 10 },
    // Actors
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Developer (End User)',            sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'L1 Service Desk Agent',          sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'L2 Hardware Repair Team',        sequence: 16 },
    // Policies
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'SLA Policy — P2 hardware incident: first response within 4 hours, resolution within 2 business days', sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Loaner Policy — standard image only; developer role profile requires separate procurement approval', sequence: 17 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'CMDB asset record accuracy',
      sourceA: 'IT Service Desk Manager Lisa Park (2024-11-06)',
      claimA: 'All company laptops are logged in the CMDB and linked to their assigned user; agents should be able to look up devices by employee name.',
      sourceB: 'IT Agent Ben Okafor (2024-11-05)',
      claimB: 'The CMDB is often out of date — especially for devices reassigned after upgrades. I can\'t trust it, so I always ask the user for the serial number.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'Loaner device suitability for developers',
      sourceA: 'IT Service Desk Manager Lisa Park (2024-11-06)',
      claimA: 'We issue loaners with a standard image that covers most user needs; developers can request additional tools via a software request ticket.',
      sourceB: 'Maya Chen — Developer (2024-11-04)',
      claimB: 'The loaner had no dev tools and no admin rights. I lost a full day waiting for a second ticket to be resolved just to get my editor installed.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'IT Incident & Service Request Management', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'End User\nITSM Platform', input: 'Incident description\nDevice details', step: '1. User reports incident via portal', output: 'Submitted ticket with ticket number', customer: 'L1 Service Desk Agent' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'L1 Agent\nCMDB', input: 'Ticket details\nAsset records', step: '2. Agent triages and categorises', output: 'Categorised ticket\nPriority assigned', customer: 'End User\nL2 Team' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Hardware team\nAsset inventory', input: 'Loaner availability\nAsset transfer form', step: '3. Issue loaner device', output: 'Loaner assigned to user\nAsset transfer record', customer: 'End User' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'L2 Hardware Repair\nParts supplier', input: 'Faulty device\nReplacement parts', step: '4. Diagnose and repair device', output: 'Repaired device\nRepair record', customer: 'End User\nCMDB' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'L1 Agent\nITSM Platform', input: 'User confirmation\nCSAT survey', step: '5. Confirm resolution and close ticket', output: 'Closed ticket\nCSAT score', customer: 'IT Manager\nReporting' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneUserITId  = newId('ml');
  const laneL1Id      = newId('ml');
  const laneL2Id      = newId('ml');
  const laneMgrId     = newId('ml');

  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart    = newId('ma');
  const maReport   = newId('ma');
  const maAck      = newId('ma');
  const maTriage   = newId('ma');
  const maSerial   = newId('ma');
  const maLoaner   = newId('ma');
  const maRepair   = newId('ma');
  const maUpdate   = newId('ma');
  const maReturn   = newId('ma');
  const maClose    = newId('ma');
  const maEnd      = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'IT Service Desk — Laptop Incident Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneUserITId, projectId: projId, mapId: pmId, label: 'End User',          order: 0 },
    { id: laneL1Id,     projectId: projId, mapId: pmId, label: 'Level 1 Support',   order: 1 },
    { id: laneL2Id,     projectId: projId, mapId: pmId, label: 'Level 2 Support',   order: 2 },
    { id: laneMgrId,    projectId: projId, mapId: pmId, label: 'IT Manager',         order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,   projectId: projId, mapId: pmId, laneId: laneUserITId, type: 'start', label: 'Start',                note: '', x: 60,   y: ly(0, 44) },
    { id: maReport,  projectId: projId, mapId: pmId, laneId: laneUserITId, type: 'task',  label: 'Submit ticket',        note: 'Portal form; 12 fields; asset tag and business impact often left blank', x: 280,  y: ly(0, 54) },
    { id: maAck,     projectId: projId, mapId: pmId, laneId: laneL1Id,     type: 'task',  label: 'Send acknowledgement', note: 'Auto-email with ticket number and 4h SLA', x: 500,  y: ly(1, 54) },
    { id: maTriage,  projectId: projId, mapId: pmId, laneId: laneL1Id,     type: 'task',  label: 'Triage ticket',        note: 'Agent requests serial number by email — CMDB often stale', x: 720,  y: ly(1, 54) },
    { id: maSerial,  projectId: projId, mapId: pmId, laneId: laneUserITId, type: 'task',  label: 'Provide serial number', note: 'User must physically flip laptop; round-trip adds 2–4 hours', x: 940,  y: ly(0, 54) },
    { id: maLoaner,  projectId: projId, mapId: pmId, laneId: laneL1Id,     type: 'task',  label: 'Issue loaner',         note: 'Standard image only; no dev tools; no admin rights for developer role', x: 1160, y: ly(1, 54) },
    { id: maRepair,  projectId: projId, mapId: pmId, laneId: laneL2Id,     type: 'task',  label: 'Diagnose & repair',    note: 'Parts ordered via separate spreadsheet not visible in ITSM', x: 1160, y: ly(2, 54) },
    { id: maUpdate,  projectId: projId, mapId: pmId, laneId: laneL1Id,     type: 'task',  label: 'Notify user of ETA',   note: 'Manual step — no automated proactive update; often missed', x: 1380, y: ly(1, 54) },
    { id: maReturn,  projectId: projId, mapId: pmId, laneId: laneUserITId, type: 'task',  label: 'Return loaner',        note: 'Physical handoff at reception; asset paperwork takes 20 min', x: 1600, y: ly(0, 54) },
    { id: maClose,   projectId: projId, mapId: pmId, laneId: laneL1Id,     type: 'task',  label: 'Confirm & close',      note: 'CSAT survey sent by email; 3 questions', x: 1820, y: ly(1, 54) },
    { id: maEnd,     projectId: projId, mapId: pmId, laneId: laneUserITId, type: 'end',   label: 'End',                  note: '', x: 2040, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,  toId: maReport,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maReport, toId: maAck,     label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maAck,    toId: maTriage,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maTriage, toId: maSerial,  label: 'Serial needed' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSerial, toId: maLoaner,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maLoaner, toId: maRepair,  label: 'Escalate' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maRepair, toId: maUpdate,  label: 'Repaired' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maUpdate, toId: maReturn,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maReturn, toId: maClose,   label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maClose,  toId: maEnd,     label: '' },
  ];

  const relations: LandscapeRelation[] = [
    { id: newId('rel'), projectId: projId, fromId: procCoreGroup, toId: procIncident,  type: 'decomposesInto' },
    { id: newId('rel'), projectId: projId, fromId: procFulfill,   toId: procIncident,  type: 'supportsService' },
  ];

  // ─── Services ───────────────────────────────────────────────────────────────
  const services: Service[] = [
    { id: svcIncident, projectId: projId, name: 'Incident Resolution', customerOutcome: 'User productive again after hardware or software failure, within SLA.', scope: 'All hardware and software incidents for end users, from logging to closure.' },
    { id: svcLoaner,   projectId: projId, name: 'Loaner Device Provision', customerOutcome: 'User receives a configured replacement device within hours of hardware failure.', scope: 'Loaner assignment, configuration, asset tracking and return for employees awaiting repair.' },
  ];

  // ─── Capabilities ────────────────────────────────────────────────────────────
  const capabilities: Capability[] = [
    { id: capTicket,    projectId: projId, name: 'Ticket Management', description: 'Ability to log, triage, route and close IT incidents and service requests within SLA.', realizingProcessIds: [procIncident, procCoreGroup] },
    { id: capLoanerFul, projectId: projId, name: 'Loaner Device Fulfillment', description: 'Ability to provision a pre-configured loaner device and manage its return and re-imaging.', realizingProcessIds: [procFulfill, procCoreGroup] },
  ];

  // ─── Process Ratings ─────────────────────────────────────────────────────────
  const processRatings: ProcessRating[] = [
    { id: `${procMgmt1}__default`,     projectId: projId, processId: procMgmt1,     configId: 'default', ratings: { strategic_impact: 3, pain_severity: 2, feasibility: 4, volume: 2 } },
    { id: `${procCoreGroup}__default`, projectId: projId, processId: procCoreGroup, configId: 'default', ratings: { strategic_impact: 4, pain_severity: 4, feasibility: 3, volume: 5 } },
    { id: `${procIncident}__default`,  projectId: projId, processId: procIncident,  configId: 'default', ratings: { strategic_impact: 4, pain_severity: 5, feasibility: 3, volume: 5 } },
    { id: `${procFulfill}__default`,   projectId: projId, processId: procFulfill,   configId: 'default', ratings: { strategic_impact: 3, pain_severity: 4, feasibility: 3, volume: 3 } },
  ];

  return {
    manifest, candidates, processes, relations, personas, systems, channels, touchpoints,
    journeys: [journey], stages, steps: journeySteps, rows, cells, cards, painPoints,
    services, capabilities, processRatings,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
