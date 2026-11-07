// IT-02: SaaS onboarding scenario — pre-populated project data for lab use.
// Scenario: a mid-sized IT company onboarding enterprise customers to a cloud collaboration platform.
// Perspective: customer journey (new IT admin setting up the platform for their organization).

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

export interface ScenarioBundle {
  manifest: ProjectManifest;
  candidates: ProcessCandidate[];
  processes: ProcessDefinition[];
  personas: Persona[];
  systems: ITSystem[];
  channels: Channel[];
  touchpoints: Touchpoint[];
  journeys: Journey[];
  stages: JourneyStage[];
  steps: JourneyStep[];
  rows: JourneyRow[];
  cells: Cell[];
  cards: JourneyCard[];
  painPoints: PainPoint[];
  // Discovery workspace
  interviews?: DiscoveryInterview[];
  interviewItems?: DiscoveryInterviewItem[];
  observations?: DiscoveryObservation[];
  stormingCards?: StormingCard[];
  contradictions?: Contradiction[];
  // Map workspace
  sipocDiagrams?: SipocDiagram[];
  sipocRows?: SipocRow[];
  processMaps?: ProcessMap[];
  mapLanes?: MapLane[];
  mapActivities?: MapActivity[];
  mapEdges?: ProcessMapEdge[];
}

export function buildIT02Scenario(): ScenarioBundle {
  const now = new Date().toISOString();

  // ─── IDs ───
  const projId     = newId('proj');
  const personaId  = newId('persona');
  const sysPortal  = newId('sys');
  const sysIdp     = newId('sys');
  const sysCrm     = newId('sys');
  const chEmail    = newId('ch');
  const chPortal   = newId('ch');
  const chChat     = newId('ch');
  const tpWelcome  = newId('tp');
  const tpProvWiz  = newId('tp');
  const tpSupport  = newId('tp');

  const procOnboard = newId('proc');
  const candId1 = newId('cand');
  const candId2 = newId('cand');
  const candId3 = newId('cand');

  const journeyId  = newId('journey');

  // Stage IDs
  const stgAwareness    = newId('stg');
  const stgPurchase     = newId('stg');
  const stgProvisioning = newId('stg');
  const stgActivation   = newId('stg');
  const stgAdoption     = newId('stg');

  // Step definitions
  type StepDef = { stageId: string; label: string; order: number };
  const stepDefs: StepDef[] = [
    { stageId: stgAwareness,    label: 'Discover product',         order: 0 },
    { stageId: stgAwareness,    label: 'Review documentation',     order: 1 },
    { stageId: stgAwareness,    label: 'Request trial',            order: 2 },
    { stageId: stgPurchase,     label: 'Evaluate pricing',         order: 0 },
    { stageId: stgPurchase,     label: 'Sign contract',            order: 1 },
    { stageId: stgPurchase,     label: 'Receive confirmation',     order: 2 },
    { stageId: stgProvisioning, label: 'Create tenant',            order: 0 },
    { stageId: stgProvisioning, label: 'Configure IdP',            order: 1 },
    { stageId: stgProvisioning, label: 'Invite users',             order: 2 },
    { stageId: stgProvisioning, label: 'Set permissions',          order: 3 },
    { stageId: stgActivation,   label: 'First login',              order: 0 },
    { stageId: stgActivation,   label: 'Complete setup wizard',    order: 1 },
    { stageId: stgActivation,   label: 'Migrate existing data',    order: 2 },
    { stageId: stgAdoption,     label: 'Train end users',          order: 0 },
    { stageId: stgAdoption,     label: 'Monitor usage metrics',    order: 1 },
    { stageId: stgAdoption,     label: 'Review with CSM',          order: 2 },
  ];

  // Assign stable IDs to steps
  const stepIds = stepDefs.map(() => newId('step'));

  // Row IDs
  const rowActions    = newId('row');
  const rowSentiment  = newId('row');
  const rowPainPts    = newId('row');
  const rowSystems    = newId('row');

  // Pre-seeded action texts
  const actionSeeds: Record<string, string> = {
    'Discover product':       'Searches via LinkedIn ad + word of mouth from conference',
    'Create tenant':          'Clicks "Create organization" in self-serve portal',
    'Configure IdP':          'Copies SAML metadata XML from IdP, pastes into provider console',
    'First login':            'End user authenticates via SSO; redirect loop on first attempt',
    'Complete setup wizard':  'Walks through 7-step wizard; two steps require reading external docs',
    'Train end users':        'Schedules live session + shares LMS link; attendance varies',
  };

  const sentimentSeeds: Record<string, -2 | -1 | 0 | 1 | 2> = {
    'Discover product':       1,
    'Review documentation':   0,
    'Request trial':          1,
    'Evaluate pricing':       0,
    'Sign contract':         -1,
    'Receive confirmation':   1,
    'Create tenant':          1,
    'Configure IdP':         -2,
    'Invite users':          -1,
    'Set permissions':       -1,
    'First login':           -1,
    'Complete setup wizard': -1,
    'Migrate existing data': -2,
    'Train end users':        0,
    'Monitor usage metrics':  1,
    'Review with CSM':        2,
  };

  // Build cells and cards
  const cells: Cell[] = [];
  const cards: JourneyCard[] = [];

  for (let i = 0; i < stepDefs.length; i++) {
    const stepId = stepIds[i];
    const label = stepDefs[i].label;

    // Action row cell
    const actionCardIds: string[] = [];
    if (actionSeeds[label]) {
      const cardId = newId('card');
      actionCardIds.push(cardId);
      cards.push({ projectId: projId, id: cardId,
        cellId: '', // filled below after cell creation
        payload: { kind: 'text', text: actionSeeds[label] },
        sourceStatus: 'assumption',
        evidenceIds: [],
        note: '',
      });
    }
    const actionCellId = newId('cell');
    cells.push({ projectId: projId, id: actionCellId, journeyId, stepId, rowId: rowActions, cardOrder: actionCardIds });
    // back-fill cellId on the just-added cards
    for (const c of cards.slice(-actionCardIds.length)) {
      c.cellId = actionCellId;
    }

    // Sentiment row cell
    const sentCardIds: string[] = [];
    if (label in sentimentSeeds) {
      const cardId = newId('card');
      sentCardIds.push(cardId);
      cards.push({ projectId: projId, id: cardId,
        cellId: '',
        payload: { kind: 'sentiment', personaId, value: sentimentSeeds[label] },
        sourceStatus: 'assumption',
        evidenceIds: [],
        note: '',
      });
    }
    const sentCellId = newId('cell');
    cells.push({ projectId: projId, id: sentCellId, journeyId, stepId, rowId: rowSentiment, cardOrder: sentCardIds });
    for (const c of cards.slice(-sentCardIds.length)) {
      c.cellId = sentCellId;
    }

    // Empty pain points + systems cells (students fill these in)
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowPainPts,   cardOrder: [] });
    cells.push({ projectId: projId, id: newId('cell'), journeyId, stepId, rowId: rowSystems,   cardOrder: [] });
  }

  // Pain points
  const painPoints: PainPoint[] = [
    {
      id: newId('pp'), projectId: projId,
      title: 'IdP configuration requires deep SAML knowledge',
      description: 'Most IT admins expect guided IdP setup but face a raw XML copy-paste workflow with no validation.',
      severity: 'significant',
      state: 'open',
      affectedPersonaIds: [personaId],
      affectedStepIds: [stepIds[7]], // 'Configure IdP'
      affectedProcessIds: [procOnboard],
      scopeEstimate: '',
      evidenceIds: [],
      suspectedCauseIds: [],
      symptom: 'Admin opens IdP tab, sees raw XML fields, calls support within 5 minutes.',
      hypothesizedCause: 'Setup designed by engineers familiar with SAML; no UX review for IT-generalist admins.',
      validatedCause: '',
      proposedIntervention: 'Add provider-specific guided wizard (Okta / Azure AD / Google Workspace).',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'SSO redirect loop on first login',
      description: 'First-time SSO login frequently redirects to an error page; requires a support ticket to resolve.',
      severity: 'critical',
      state: 'open',
      affectedPersonaIds: [personaId],
      affectedStepIds: [stepIds[10]], // 'First login'
      affectedProcessIds: [procOnboard],
      scopeEstimate: '',
      evidenceIds: [],
      suspectedCauseIds: [],
      symptom: 'User hits SSO endpoint, browser loops 3–5 times then shows "Invalid state" error.',
      hypothesizedCause: 'State parameter not persisted across redirect; session cookie SameSite=Strict conflict.',
      validatedCause: '',
      proposedIntervention: 'Fix session cookie to SameSite=Lax and add IdP relay-state validation.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Migration tool has no progress indicator',
      description: 'Data migration can take 30-120 minutes with no feedback; admins assume it has failed.',
      severity: 'significant',
      state: 'open',
      affectedPersonaIds: [personaId],
      affectedStepIds: [stepIds[12]], // 'Migrate existing data'
      affectedProcessIds: [procOnboard],
      scopeEstimate: '',
      evidenceIds: [],
      suspectedCauseIds: [],
      symptom: 'Migration page shows spinner with no ETA or item count; 60% of admins open a support ticket.',
      hypothesizedCause: 'Background job does not emit progress events; front-end polls status endpoint every 60s.',
      validatedCause: '',
      proposedIntervention: 'Add real-time progress bar with item count + ETA; send email notification on completion.',
    },
    {
      id: newId('pp'), projectId: projId,
      title: 'Permission model complexity delays user invites',
      description: 'Five permission levels with overlapping scopes; admins over-assign admin roles by default.',
      severity: 'moderate',
      state: 'open',
      affectedPersonaIds: [personaId],
      affectedStepIds: [stepIds[8], stepIds[9]], // 'Invite users', 'Set permissions'
      affectedProcessIds: [procOnboard],
      scopeEstimate: '',
      evidenceIds: [],
      suspectedCauseIds: [],
      symptom: 'Admin selects "Admin" for all invited users; security review later forces manual downgrade.',
      hypothesizedCause: 'Role descriptions are technical; no onboarding default recommendation shown.',
      validatedCause: '',
      proposedIntervention: 'Add recommended role badges + tooltip explaining least-privilege principle.',
    },
  ];

  // ─── Assembling the bundle ───

  const manifest: ProjectManifest = {
    id: projId,
    title: 'IT-02 · SaaS Onboarding Journey',
    description: 'Enterprise customer onboarding for a cloud collaboration platform. IT admin perspective.',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };

  const candidates: ProcessCandidate[] = [
    { projectId: projId, id: candId1,
      title: 'Tenant provisioning',
      status: 'accepted',
      rationale: 'Directly observed in portal logs; triggers cascade of configuration sub-processes.',
      sourceRefs: [],
      createdAt: now,
    },
    { projectId: projId, id: candId2,
      title: 'Identity provider configuration',
      status: 'under-review',
      rationale: 'High pain severity; may warrant own process definition separate from provisioning.',
      sourceRefs: [],
      createdAt: now,
    },
    { projectId: projId, id: candId3,
      title: 'User activation and training',
      status: 'proposed',
      rationale: 'Owned by Customer Success; may overlap with onboarding process boundary.',
      sourceRefs: [],
      createdAt: now,
    },
  ];

  const processes: ProcessDefinition[] = [
    { projectId: projId, id: procOnboard,
      title: 'SaaS platform onboarding',
      purpose: 'Enable enterprise IT admins to configure and launch the platform for their organization within the agreed SLA window.',
      levelLabel: 'core',
      trigger: 'Signed contract received; account activation email sent to IT admin contact.',
      outcome: 'All invited users can authenticate via SSO; at least one workspace is active; admin acknowledges completion in portal.',
      inScope: [
        'Tenant creation and configuration',
        'IdP/SSO setup and verification',
        'Admin-initiated user invitations',
        'Initial permission assignment',
        'Setup wizard completion',
      ],
      outOfScope: [
        'Data migration from previous tools',
        'End-user training (Customer Success scope)',
        'Custom integration development',
        'Billing disputes',
      ],
      status: 'draft',
      serviceIds: [],
      capabilityIds: [],
      systemIds: [sysPortal, sysIdp],
      evidenceIds: [],
    },
  ];

  const personas: Persona[] = [
    { projectId: projId, id: personaId,
      name: 'Alex Kovač',
      role: 'IT Administrator',
      goals: [
        'Get the platform live before the agreed go-live date',
        'Avoid end-user complaints about access issues',
        'Minimize time spent on vendor support tickets',
      ],
      needs: [
        'Step-by-step IdP configuration guide',
        'Bulk user import from Active Directory',
        'Real-time status updates during provisioning',
      ],
      constraints: [
        'Limited budget for external consultants',
        'Must comply with internal security review before go-live',
        'Only 20% of working time allocated to this project',
      ],
      accessibilityNeeds: [],
      evidenceIds: [],
    },
  ];

  const systems: ITSystem[] = [
    { projectId: projId, id: sysPortal,
      name: 'SaaS Admin Portal',
      type: 'saas',
      criticality: 'critical',
      supportingRole: 'Primary admin interface for tenant setup, user management, and monitoring.',
      evidenceIds: [],
    },
    { projectId: projId, id: sysIdp,
      name: 'Identity Provider (SAML/OIDC)',
      type: 'enterprise',
      criticality: 'critical',
      supportingRole: 'Customer-managed IdP integrated via SAML 2.0 or OIDC for SSO.',
      evidenceIds: [],
    },
    { projectId: projId, id: sysCrm,
      name: 'CRM / Contract System',
      type: 'saas',
      criticality: 'high',
      supportingRole: 'Stores signed contract; triggers account provisioning webhook.',
      evidenceIds: [],
    },
  ];

  const channels: Channel[] = [
    { projectId: projId, id: chEmail,  name: 'Email',        type: 'email' },
    { projectId: projId, id: chPortal, name: 'Admin Portal', type: 'portal' },
    { projectId: projId, id: chChat,   name: 'Live Chat',    type: 'chat' },
  ];

  const touchpoints: Touchpoint[] = [
    { projectId: projId, id: tpWelcome,
      name: 'Welcome & activation email',
      purpose: 'Delivers portal URL and temporary credentials to IT admin contact.',
      channelId: chEmail,
      systemIds: [],
      recipientPersonaIds: [personaId],
      accessibilityConcerns: [],
    },
    { projectId: projId, id: tpProvWiz,
      name: 'Provisioning wizard',
      purpose: 'Guides admin through tenant creation, IdP setup, and first user invitation.',
      channelId: chPortal,
      systemIds: [sysPortal],
      recipientPersonaIds: [personaId],
      accessibilityConcerns: ['Wizard does not support keyboard-only navigation at step 4'],
    },
    { projectId: projId, id: tpSupport,
      name: 'Onboarding support chat',
      purpose: 'Live agent available during business hours to assist with IdP config and SSO issues.',
      channelId: chChat,
      systemIds: [],
      recipientPersonaIds: [personaId],
      accessibilityConcerns: [],
    },
  ];

  const journey: Journey = { projectId: projId, id: journeyId,
    title: 'Enterprise IT Admin Onboarding',
    goal: 'Have the platform fully configured and all users able to log in via SSO within the contractual SLA window.',
    situation: 'An IT admin at a mid-market company has just signed a contract for a cloud collaboration platform. They must set up the tenant, configure SSO, invite users, and reach go-live before the agreed date.',
    perspective: 'customer',
    state: 'as-is',
    personaIds: [personaId],
    stageOrder: [stgAwareness, stgPurchase, stgProvisioning, stgActivation, stgAdoption],
    rowOrder: [rowActions, rowSentiment, rowPainPts, rowSystems],
    createdAt: now,
    updatedAt: now,
  };

  const stages: JourneyStage[] = [
    { projectId: projId, id: stgAwareness,    journeyId, title: 'Awareness',    description: '', order: 0 },
    { projectId: projId, id: stgPurchase,     journeyId, title: 'Purchase',     description: '', order: 1 },
    { projectId: projId, id: stgProvisioning, journeyId, title: 'Provisioning', description: '', order: 2 },
    { projectId: projId, id: stgActivation,   journeyId, title: 'Activation',   description: '', order: 3 },
    { projectId: projId, id: stgAdoption,     journeyId, title: 'Adoption',     description: '', order: 4 },
  ];

  const journeySteps: JourneyStep[] = stepDefs.map((s, i) => ({ projectId: projId, id: stepIds[i],
    journeyId,
    stageId: s.stageId,
    title: s.label,
    order: s.order,
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
    { id: intv1Id, projectId: projId, interviewee: 'Alex Kovač', role: 'IT Administrator', date: '2024-09-10', notes: 'Primary persona. Very detailed about SAML pain. Had screenshots of the error page ready.', createdAt: now },
    { id: intv2Id, projectId: projId, interviewee: 'Sarah Jensen', role: 'SaaS Vendor Onboarding Specialist', date: '2024-09-12', notes: 'Has handled 200+ onboardings. Gave us aggregated data on support ticket categories.', createdAt: now },
    { id: intv3Id, projectId: projId, interviewee: 'James Wu', role: 'Department Manager / End User', date: '2024-09-13', notes: 'First user to log in after Alex set up SSO. Got the redirect loop firsthand.', createdAt: now },
  ];

  const interviewItems: DiscoveryInterviewItem[] = [
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'quote',    text: 'The SAML setup page just shows two empty text boxes — one for Entity ID, one for metadata URL. There\'s no guide, no example values, nothing. I had to call support just to know what format the metadata URL should be in.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'claim',    text: 'The bulk import failed on the first try with a vague "row validation error". I had no idea which row or which column was wrong — I had 400 users in that file.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv1Id, type: 'question', text: 'Why can\'t the portal detect which IdP we\'re using and show me the right fields? We\'re on Azure AD — it should know what to ask for.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'quote',    text: 'About 60% of our onboarding support tickets are about IdP configuration. The other 40% are mostly about bulk import and permission levels.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'The admin panel was designed for power users. We hear consistently that first-time IT admins feel overwhelmed by all the options visible at once.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv2Id, type: 'claim',    text: 'When a migration job fails silently, admins open a support ticket assuming it has crashed. The job usually finishes fine an hour later — but by then there\'s a ticket in queue.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'quote',    text: 'I clicked the SSO login button, the browser spun for a few seconds, then showed "Invalid state parameter". I tried twice more and gave up. Alex had to submit a ticket and I lost half a morning.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'claim',    text: 'The first-login experience felt fragile. I didn\'t trust the platform after that — even once it was working.', createdAt: now },
    { id: newId('ii'), projectId: projId, interviewId: intv3Id, type: 'question', text: 'Is there a checklist somewhere of what I need before my first login? I had no idea I needed to clear my browser cache.', createdAt: now },
  ];

  const observations: DiscoveryObservation[] = [
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'IT Admin',          description: 'Opens IdP configuration tab. Stares at two empty fields — Entity ID and Metadata URL. Switches to a second browser tab to look up the vendor knowledge base. Spends ~12 minutes before finding the correct article.', sequence: 1, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'IT Admin',          description: 'Waits on hold with vendor support for 18 minutes to confirm the SAML relay state setting. Support agent resolves it in 2 minutes once connected.', sequence: 2, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'IT Admin',          description: 'Bulk user import returns "Row validation error — 3 rows affected." No row numbers shown. Admin must manually scan a 400-row CSV export to find the malformed entries.', sequence: 3, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'work',        actor: 'IT Admin',          description: 'Navigates admin panel. Counts 14 visible menu items in the left sidebar on first login. Spends ~5 minutes clicking through menus before finding the user invitation page.', sequence: 4, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'delay',       actor: 'End User',          description: 'SSO login attempt results in redirect loop. Browser cycles through 4 redirects before displaying "Invalid state parameter" error. User retries twice, then sends chat message to IT admin.', sequence: 5, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'exception',   actor: 'IT Admin',          description: 'Data migration launched. No progress indicator appears — only a spinner icon. Admin refreshes the page after 15 minutes to check if it\'s still running; refresh resets the display, increasing confusion.', sequence: 6, createdAt: now },
    { id: newId('obs'), projectId: projId, type: 'interaction', actor: 'IT Admin & Support Agent', description: 'Admin opens live chat with onboarding support. Agent cannot see the IdP configuration fields in the admin console remotely — requests a screenshare. Screenshare tool requires separate plugin install on admin\'s machine, adding 10 minutes.', sequence: 7, createdAt: now },
  ];

  const stormingCards: StormingCard[] = [
    // Events
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Contract Signed',               sequence: 1 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Tenant Created',                sequence: 3 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'IdP Configuration Saved',       sequence: 5 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'SSO Verified',                  sequence: 7 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Users Invited',                 sequence: 9 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'First Login Completed',         sequence: 11 },
    { id: newId('sc'), projectId: projId, type: 'event',   text: 'Setup Wizard Finished',         sequence: 13 },
    // Commands
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Activate Account',              sequence: 2 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Configure IdP',                 sequence: 4 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Verify SSO',                    sequence: 6 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Import Users in Bulk',          sequence: 8 },
    { id: newId('sc'), projectId: projId, type: 'command', text: 'Assign Permission Roles',       sequence: 10 },
    // Actors
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'IT Admin',                      sequence: 12 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'SaaS Vendor Platform',          sequence: 14 },
    { id: newId('sc'), projectId: projId, type: 'actor',   text: 'Identity Provider (Azure AD)',   sequence: 16 },
    // Policies
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'SSO Enforcement Policy — all users must authenticate via corporate IdP; password login disabled after go-live', sequence: 15 },
    { id: newId('sc'), projectId: projId, type: 'policy',  text: 'Least Privilege Policy — new users default to Viewer role; admin must explicitly elevate to Editor or Admin', sequence: 17 },
  ];

  const contradictions: Contradiction[] = [
    {
      id: newId('con'), projectId: projId,
      topic: 'Bulk user import error rate',
      sourceA: 'SaaS vendor onboarding documentation (v2.4)',
      claimA: 'Bulk import supports CSV files up to 1,000 rows with standard UTF-8 encoding; validation errors are shown per row.',
      sourceB: 'Alex Kovač — IT admin interview (2024-09-10)',
      claimB: 'The error message just said "3 rows affected" with no row numbers. I had to manually scan 400 rows to find the problem.',
      status: 'open', resolution: '', createdAt: now,
    },
    {
      id: newId('con'), projectId: projId,
      topic: 'SSO setup complexity',
      sourceA: 'Sarah Jensen — Vendor Onboarding Specialist (2024-09-12)',
      claimA: 'Most IT admins complete IdP setup in under 30 minutes using the in-portal guide.',
      sourceB: 'Alex Kovač — IT admin interview (2024-09-10)',
      claimB: 'I spent over 90 minutes on SAML configuration between the portal, the knowledge base, and time on hold with support.',
      status: 'open', resolution: '', createdAt: now,
    },
  ];

  // ─── Map workspace: SIPOC ────────────────────────────────────────────────────

  const sipocId = newId('sip');
  const sipocDiagrams: SipocDiagram[] = [
    { id: sipocId, projectId: projId, title: 'Enterprise SaaS Onboarding', processRef: '', createdAt: now },
  ];

  const sipocRows: SipocRow[] = [
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 0, supplier: 'CRM / Contract System', input: 'Signed contract\nActivation trigger', step: '1. Provision tenant & send welcome email', output: 'Active tenant\nAdmin credentials email', customer: 'IT Admin' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 1, supplier: 'IT Admin\nIdentity Provider (Azure AD)', input: 'SAML metadata\nIdP Entity ID', step: '2. Configure IdP / SSO', output: 'Verified SSO integration', customer: 'End Users\nSaaS Admin Portal' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 2, supplier: 'Active Directory\nHR system', input: 'User list CSV\nRole assignments', step: '3. Import users & assign permissions', output: 'Invited user accounts\nRole assignments', customer: 'End Users' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 3, supplier: 'SaaS Vendor Platform', input: 'Setup wizard steps\nAdmin configuration', step: '4. Complete setup wizard & go-live check', output: 'Configured workspace\nGo-live confirmation', customer: 'IT Admin\nEnd Users' },
    { id: newId('srow'), projectId: projId, diagramId: sipocId, order: 4, supplier: 'Customer Success Manager\nUsage analytics', input: 'Adoption metrics\nTraining materials', step: '5. Train end users & review adoption', output: 'Trained users\nAdoption report', customer: 'Department Manager\nCSM' },
  ];

  // ─── Map workspace: Process Map ──────────────────────────────────────────────

  const pmId = newId('pm');
  const laneITId     = newId('ml');
  const laneVendorId = newId('ml');
  const laneSecId    = newId('ml');
  const laneUsersId  = newId('ml');

  const L = 170;
  function ly(lane: number, h: number) { return lane * L + Math.floor((L - h) / 2); }

  const maStart    = newId('ma');
  const maActivate = newId('ma');
  const maIdP      = newId('ma');
  const maVerify   = newId('ma');
  const maImport   = newId('ma');
  const maPerms    = newId('ma');
  const maSecReview = newId('ma');
  const maWizard   = newId('ma');
  const maLogin    = newId('ma');
  const maAdopt    = newId('ma');
  const maEnd      = newId('ma');

  const processMaps: ProcessMap[] = [
    { id: pmId, projectId: projId, title: 'Enterprise SaaS Onboarding Process', createdAt: now, updatedAt: now },
  ];

  const mapLanes: MapLane[] = [
    { id: laneITId,     projectId: projId, mapId: pmId, label: 'IT Admin',     order: 0 },
    { id: laneVendorId, projectId: projId, mapId: pmId, label: 'SaaS Vendor',  order: 1 },
    { id: laneSecId,    projectId: projId, mapId: pmId, label: 'IT Security',  order: 2 },
    { id: laneUsersId,  projectId: projId, mapId: pmId, label: 'End Users',    order: 3 },
  ];

  const mapActivities: MapActivity[] = [
    { id: maStart,     projectId: projId, mapId: pmId, laneId: laneVendorId, type: 'start', label: 'Start',                    note: '', x: 60,   y: ly(1, 44) },
    { id: maActivate,  projectId: projId, mapId: pmId, laneId: laneVendorId, type: 'task',  label: 'Provision tenant',         note: 'Auto-triggered from CRM on contract close', x: 280,  y: ly(1, 54) },
    { id: maIdP,       projectId: projId, mapId: pmId, laneId: laneITId,     type: 'task',  label: 'Configure IdP / SSO',      note: 'Raw XML fields; no guided wizard; 60% of support tickets originate here', x: 500,  y: ly(0, 54) },
    { id: maSecReview, projectId: projId, mapId: pmId, laneId: laneSecId,    type: 'task',  label: 'Security sign-off',        note: 'Internal security team validates SSO config before go-live', x: 720,  y: ly(2, 54) },
    { id: maVerify,    projectId: projId, mapId: pmId, laneId: laneITId,     type: 'task',  label: 'Verify SSO',               note: 'Test login with admin account; redirect loop occurs ~40% of first attempts', x: 940,  y: ly(0, 54) },
    { id: maImport,    projectId: projId, mapId: pmId, laneId: laneITId,     type: 'task',  label: 'Import users',             note: 'CSV bulk import; 30% failure rate; error messages show no row numbers', x: 1160, y: ly(0, 54) },
    { id: maPerms,     projectId: projId, mapId: pmId, laneId: laneITId,     type: 'task',  label: 'Assign permissions',       note: 'Admins default to granting "Admin" role; security review later forces downgrade', x: 1380, y: ly(0, 54) },
    { id: maWizard,    projectId: projId, mapId: pmId, laneId: laneITId,     type: 'task',  label: 'Complete setup wizard',    note: '7-step wizard; steps 4 & 6 require reading external docs', x: 1600, y: ly(0, 54) },
    { id: maLogin,     projectId: projId, mapId: pmId, laneId: laneUsersId,  type: 'task',  label: 'First SSO login',          note: 'End users encounter redirect loop; IT admin must resolve', x: 1600, y: ly(3, 54) },
    { id: maAdopt,     projectId: projId, mapId: pmId, laneId: laneUsersId,  type: 'task',  label: 'Adopt platform',           note: 'CSM schedules live training session; attendance varies 40–90%', x: 1820, y: ly(3, 54) },
    { id: maEnd,       projectId: projId, mapId: pmId, laneId: laneITId,     type: 'end',   label: 'End',                      note: '', x: 2040, y: ly(0, 44) },
  ];

  const mapEdges: ProcessMapEdge[] = [
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maStart,     toId: maActivate,  label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maActivate,  toId: maIdP,       label: 'Welcome email sent' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maIdP,       toId: maSecReview, label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maSecReview, toId: maVerify,    label: 'Cleared' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maVerify,    toId: maImport,    label: 'SSO verified' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maImport,    toId: maPerms,     label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maPerms,     toId: maWizard,    label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maWizard,    toId: maLogin,     label: 'Go-live' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maLogin,     toId: maAdopt,     label: '' },
    { id: newId('me'), projectId: projId, mapId: pmId, fromId: maWizard,    toId: maEnd,       label: '' },
  ];

  return {
    manifest,
    candidates,
    processes,
    personas,
    systems,
    channels,
    touchpoints,
    journeys: [journey],
    stages,
    steps: journeySteps,
    rows,
    cells,
    cards,
    painPoints,
    interviews, interviewItems, observations, stormingCards, contradictions,
    sipocDiagrams, sipocRows, processMaps, mapLanes, mapActivities, mapEdges,
  };
}
