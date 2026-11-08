export type ChallengeLevel = 'beginner' | 'intermediate' | 'advanced' | 'capstone';
export type WorkspaceHint = 'identify' | 'discover' | 'journey' | 'map' | 'any';

export interface RubricCriterion {
  criterion: string;
  satisfactory: string;
  exemplary: string;
}

export interface ChallengeDefinition {
  id: string;
  scenarioId: string;
  level: ChallengeLevel;
  title: string;
  task: string;
  expectedEvidence: string[];
  hints: string[];
  rubric: RubricCriterion[];
  workspaceHint: WorkspaceHint;
  estimatedTime: string;
}

export const CHALLENGES: ChallengeDefinition[] = [
  // ── IT-01 (service desk support — use IT-03 fixture) ──
  {
    id: 'IT-01-A', scenarioId: 'IT-02', level: 'beginner',
    title: 'Separate service requests, incidents and organisational units',
    task: 'Using the IT-03 scenario, identify at least 2 process candidates. For each, write a one-sentence trigger and outcome. Mark which is a service request process and which is an incident process. Explain the boundary between them in a note.',
    expectedEvidence: ['Correctly typed candidates with explained boundaries', 'Trigger and outcome per candidate', 'Note explaining service request vs incident distinction'],
    hints: ['A service request is for something new (like a loaner); an incident is for something broken.', 'Look at what changes the status from "New" to "Resolved" — that often defines the process boundary.', 'An IT department is not a process — name the work, not the team.'],
    rubric: [
      { criterion: 'Candidate naming', satisfactory: 'Uses verb+object naming', exemplary: 'Name clearly distinguishes service request from incident without referring to teams' },
      { criterion: 'Boundary explanation', satisfactory: 'Identifies at least one boundary difference', exemplary: 'Explains trigger, outcome and handoff point between both processes' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '20 min',
  },
  {
    id: 'IT-01-B', scenarioId: 'IT-02', level: 'beginner',
    title: 'Build an employee support journey from six evidence cards',
    task: 'Open the IT-03 scenario. Using only the action cards as evidence, create a journey with: a named persona, at least 4 stages, at least one touchpoint per stage, and at least one pain point linked to a step.',
    expectedEvidence: ['Persona with goal and situation', 'Stages with descriptive names', 'Touchpoints with channel type', 'Pain point linked to a specific step'],
    hints: ['The persona is Maya Chen — use her goals from the scenario description.', 'Stages group steps by phase: think about what changes between stages.', 'A touchpoint must have a channel (portal, email, phone) — not just a system name.'],
    rubric: [
      { criterion: 'Persona completeness', satisfactory: 'Name and role present', exemplary: 'Goal, situation and at least one constraint defined' },
      { criterion: 'Stage structure', satisfactory: 'At least 3 stages covering full journey', exemplary: 'Stages aligned with emotional arc; names describe experience, not system state' },
      { criterion: 'Pain point quality', satisfactory: 'Pain point linked to a step', exemplary: 'Symptom and hypothesised cause are distinct; intervention is realistic' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '30 min',
  },
  {
    id: 'IT-01-C', scenarioId: 'IT-02', level: 'beginner',
    title: 'Explain a reopening problem and propose a TO-BE response',
    task: 'In IT-03, the ticket status goes from "In progress" to "Waiting parts" with no customer notification. Identify this as a pain point. Write a symptom (what the customer observes), a hypothesised cause, and a TO-BE intervention. Then create a second journey step showing what the TO-BE experience would look like.',
    expectedEvidence: ['Pain point with distinct symptom, cause and intervention', 'TO-BE journey step with improved touchpoint', 'Explanation of what changes between AS-IS and TO-BE'],
    hints: ['The symptom is what the customer experiences, not what the system does.', 'A good TO-BE step changes who communicates, when and through which channel.', 'Consider: would a proactive notification change the sentiment score for this step?'],
    rubric: [
      { criterion: 'Symptom/cause distinction', satisfactory: 'Symptom and cause are different sentences', exemplary: 'Symptom is from customer perspective; cause identifies the internal process gap' },
      { criterion: 'TO-BE proposal', satisfactory: 'Describes a changed interaction', exemplary: 'Specifies role, channel and timing of the improved notification; links to a defined reopen metric' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '25 min',
  },

  // ── IT-02 ──
  {
    id: 'IT-02-A', scenarioId: 'IT-01', level: 'beginner',
    title: 'Create a SaaS onboarding journey from a blank project',
    task: 'Using the IT-02 scenario as reference, create a new project from scratch. Build a customer journey with at least 4 stages, 8 steps, and sentiment for every step. Do not copy the fixture directly — rephrase at least 3 steps in your own words.',
    expectedEvidence: ['Journey with persona, goal and situation', 'At least 4 named stages', 'Sentiment on every step', 'At least 3 rephrased steps in customer-perspective language'],
    hints: ['Start with the persona goal — what does the customer ultimately want?', 'Think about where the emotional low-point is — that is often the most important stage.', 'Steps should describe what the customer does or experiences, not what the system does.'],
    rubric: [
      { criterion: 'Journey completeness', satisfactory: 'All required elements present', exemplary: 'Journey reads as a coherent narrative from customer perspective with no system-centric steps' },
      { criterion: 'Sentiment arc', satisfactory: 'Sentiment varies across steps', exemplary: 'Sentiment arc has a logical shape; lowest point aligns with known pain point' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-02-B', scenarioId: 'IT-01', level: 'beginner',
    title: 'Identify supporting processes and accountable owners',
    task: 'From the IT-02 journey, identify at least 3 supporting processes. For each process, name an accountable owner role (not a department). Create process links in the journey matrix. Add an ownership gap note where you cannot identify a clear owner.',
    expectedEvidence: ['3 process candidates with charters', 'Owner role (not department) for each', 'Journey-to-process links in the matrix', 'At least one documented ownership gap'],
    hints: ['An accountable owner is a role like "Onboarding Manager", not a team like "Customer Success".', 'If you cannot name an owner, that is an ownership gap — document it, do not skip it.', 'A process link in the journey shows which steps a process supports.'],
    rubric: [
      { criterion: 'Process naming', satisfactory: 'Processes named with verb+object', exemplary: 'Processes have distinct triggers and outcomes; no overlapping boundaries' },
      { criterion: 'Ownership gaps', satisfactory: 'At least one gap identified', exemplary: 'Gap explanation includes consequence and suggested accountability model' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '35 min',
  },
  {
    id: 'IT-02-C', scenarioId: 'IT-01', level: 'beginner',
    title: 'Derive the onboarding provider\'s sequential BPMN draft',
    task: 'Using the Map workspace on IT-02, generate a BPMN draft for the onboarding provider process. Select only steps where the provider does work. Name all activities from the provider\'s perspective. Add at least one handoff note. Download both the .bpmn and .trace.json files.',
    expectedEvidence: ['Scope limited to provider-side steps (at least one exclusion with rationale)', 'Activity names in provider perspective (no customer-language names)', 'At least one handoff note for a decision or external interaction', 'Both files downloaded'],
    hints: ['Exclude steps like "Customer chooses a plan" — the provider cannot control or observe that internal decision.', 'An activity name should be what the provider does: "Send welcome email", not "Customer receives welcome email".', 'Handoff notes are for things like: "What happens if the customer does not verify their email within 24 hours?"'],
    rubric: [
      { criterion: 'Activity mapping', satisfactory: 'Activities use provider perspective language', exemplary: 'All exclusions have written rationale; activity names are concise and action-oriented' },
      { criterion: 'Handoff notes', satisfactory: 'At least one note present', exemplary: 'Notes identify specific decisions with conditions and expected BPMN Studio constructs' },
    ],
    workspaceHint: 'map',
    estimatedTime: '30 min',
  },

  // ── IT-03 ──
  {
    id: 'IT-03-A', scenarioId: 'IT-02', level: 'beginner',
    title: 'Distinguish channel, touchpoint and identity system',
    task: 'In the IT-03 scenario, identify all touchpoints. For each, specify the channel type (portal/email/chat/phone). Then list at least one IT system that supports each touchpoint. Explain in one sentence how the channel, touchpoint and system are related but distinct.',
    expectedEvidence: ['List of touchpoints with channel types', 'System linked to each touchpoint', 'One-sentence explanation of channel/touchpoint/system distinction'],
    hints: ['Email is a channel; "IT desk reception" uses a physical channel (in-person).', 'A touchpoint is a specific interaction; a channel is the medium it happens through.', 'A system enables the touchpoint — it is not the same as the touchpoint.'],
    rubric: [
      { criterion: 'Classification accuracy', satisfactory: 'All touchpoints have correct channel type', exemplary: 'Frontstage/backstage distinction applied; no system misclassified as a channel' },
      { criterion: 'Conceptual distinction', satisfactory: 'Explanation distinguishes all three concepts', exemplary: 'Explanation uses a concrete example from the scenario and explains reusability' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '20 min',
  },
  {
    id: 'IT-03-B', scenarioId: 'IT-02', level: 'beginner',
    title: 'Repair an inaccessible hardware incident journey',
    task: 'The IT-03 "IT desk reception" touchpoint requires physical presence. Identify this as an accessibility barrier. Write a pain point for a user who cannot physically visit reception (e.g. remote employee). Propose an alternative touchpoint that serves the same purpose.',
    expectedEvidence: ['Pain point with accessibility impact identified', 'Alternative touchpoint with channel type', 'Explanation of why the original touchpoint excludes some users'],
    hints: ['The existing touchpoint is "in-person" — which users cannot use this?', 'An alternative could be a remote option (email, phone, portal) that achieves the same handoff.', 'The concern is not just preference but access — some users physically cannot travel to reception.'],
    rubric: [
      { criterion: 'Barrier identification', satisfactory: 'Identifies physical access barrier', exemplary: 'Names specific affected populations with realistic scenarios' },
      { criterion: 'Alternative proposal', satisfactory: 'Alternative touchpoint has different channel', exemplary: 'Alternative preserves same outcome (asset transfer) with equal evidence quality' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '25 min',
  },
  {
    id: 'IT-03-C', scenarioId: 'IT-02', level: 'beginner',
    title: 'Explain expired-link recovery in the journey and process map',
    task: 'The IT-03 scenario has a step "Provide more information" triggered by an email request. What would happen if the response email link expired? Create an exception path in the journey (a step for the expired-link case). Then describe which provider role is responsible and what information they need to recover.',
    expectedEvidence: ['Exception step added to the journey', 'Responsible role identified (not department)', 'Information required for recovery described', 'Note on how the exception path rejoins the main flow'],
    hints: ['An exception is a known alternative — it should be documented, not ignored.', 'The responsible role for email recovery is likely IT Service Desk, not "IT department".', 'Recovery means: how does the user get back on the happy path? What information is needed?'],
    rubric: [
      { criterion: 'Exception modeling', satisfactory: 'Exception step added with clear trigger', exemplary: 'Exception path rejoins main flow with explicit condition; role and information needs defined' },
      { criterion: 'Recovery description', satisfactory: 'Role and information named', exemplary: 'Recovery explains what changes (re-send, extension) and prevents recurrence' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '25 min',
  },

  // ── IT-04 ──
  {
    id: 'IT-04-A', scenarioId: 'IT-03', level: 'intermediate',
    title: 'Identify processes from a cloud service catalog',
    task: 'From the IT-04 scenario, write process charters for "Cloud resource request and approval" and "Automated resource provisioning". For each, write: trigger, outcome, in-scope steps, out-of-scope steps. Then explain where the boundary between the two processes lies and why.',
    expectedEvidence: ['Two process charters with trigger and outcome', 'In-scope and out-of-scope for each', 'Boundary explanation with rationale'],
    hints: ['The first process ends when a decision is made; the second starts when a decision is confirmed.', 'Out-of-scope items for one process are often in-scope for another — make the handoff explicit.', 'The boundary is the trigger of the second process, which should match the outcome of the first.'],
    rubric: [
      { criterion: 'Charter quality', satisfactory: 'Trigger and outcome present and distinct', exemplary: 'Trigger is an event (not a time); outcome is measurable; in/out-of-scope is specific' },
      { criterion: 'Boundary reasoning', satisfactory: 'Boundary location identified', exemplary: 'Boundary explains why splitting here creates cleaner accountability' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '35 min',
  },
  {
    id: 'IT-04-B', scenarioId: 'IT-03', level: 'intermediate',
    title: 'Investigate contradictory cost centre evidence',
    task: 'The IT-04 scenario shows the developer does not know their cost centre. Suppose you receive two contradictory interviews: Interview A says "Cost centre is mandatory to prevent overspend"; Interview B says "We added cost centre after a complaint — most devs just use department default". Create both as evidence records. Mark the contradiction. What follow-up question would you ask?',
    expectedEvidence: ['Two evidence records with source type, confidence and date', 'Contradiction flag on at least one record', 'Follow-up question that would resolve the contradiction', 'Note on which claim is currently treated as assumption'],
    hints: ['Both sources should be retained — do not delete the less convenient one.', 'A contradiction note should explain what exactly conflicts, not just that two sources disagree.', 'Your follow-up question should target the fact that is in dispute, not the person you like less.'],
    rubric: [
      { criterion: 'Evidence recording', satisfactory: 'Both records created with source type', exemplary: 'Confidence level set appropriately; dates and collection context noted' },
      { criterion: 'Contradiction handling', satisfactory: 'Contradiction identified on at least one record', exemplary: 'Follow-up question is specific and testable; assumption clearly labeled' },
    ],
    workspaceHint: 'discover',
    estimatedTime: '30 min',
  },
  {
    id: 'IT-04-C', scenarioId: 'IT-03', level: 'intermediate',
    title: 'Prioritize provisioning improvements under two weight sets',
    task: 'Using the Identify workspace on IT-04, rate the three process candidates on: customer impact (1–5) and improvement effort (1–5, lower = less effort). Apply weight set A (impact 70%, effort 30%) and weight set B (impact 40%, effort 60%). Record the rankings under both sets. Which process changes rank? Write a one-paragraph explanation of the tradeoff.',
    expectedEvidence: ['Ratings for all three candidates on both criteria', 'Rankings under both weight sets', 'Identification of which process changes rank', 'Written tradeoff explanation'],
    hints: ['A lower effort score means less work — make sure your direction is consistent.', 'If two processes tie, you need a tiebreaker criterion.', 'The tradeoff explanation should state whose interests each weight set favours.'],
    rubric: [
      { criterion: 'Scoring accuracy', satisfactory: 'Scores and rankings consistent', exemplary: 'Scores justified with reference to scenario evidence; not arbitrary' },
      { criterion: 'Tradeoff explanation', satisfactory: 'Identifies which process changes rank', exemplary: 'Explains which stakeholder perspective each weight set reflects and what that implies' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '40 min',
  },

  // ── IT-05 ──
  {
    id: 'IT-05-A', scenarioId: 'IT-04', level: 'intermediate',
    title: 'Scope the employee access-request process',
    task: 'From the IT-05 scenario, write a process charter for "Access request and approval workflow". Identify at least two interfaces with other processes (HR onboarding, security review). For each interface, describe what is handed off and what would happen if the handoff failed.',
    expectedEvidence: ['Process charter with trigger and outcome', 'Two interface descriptions with named handoff objects', 'Failure consequence for each interface'],
    hints: ['An interface is a point where your process depends on or feeds another process.', 'What is handed off could be data (access request), a decision (approval) or a physical item.', 'Failure consequences help identify where SLAs and fallbacks are needed.'],
    rubric: [
      { criterion: 'Charter completeness', satisfactory: 'Trigger and outcome present', exemplary: 'In/out-of-scope explicitly excludes adjacent processes' },
      { criterion: 'Interface quality', satisfactory: 'Two interfaces identified', exemplary: 'Each interface names sender, receiver, transferred object and failure consequence' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '35 min',
  },
  {
    id: 'IT-05-B', scenarioId: 'IT-04', level: 'intermediate',
    title: 'Map missing-information handoffs in a blueprint',
    task: 'The IT-05 access request is rejected because the wrong form was used. Create a simple blueprint row for the access request process showing: (1) the user action, (2) the IT portal interaction (frontstage), and (3) the validation step (backstage). Show the information-incomplete exception path.',
    expectedEvidence: ['Three-row blueprint structure', 'Information-incomplete exception path shown', 'Sender and receiver named for each handoff', 'Transferred object identified (form, approval, rejection reason)'],
    hints: ['Frontstage is what the user can see; backstage is what the IT team does internally.', 'The rejection notification is a frontstage interaction — the user receives it.', 'The resubmission starts a new instance of the same process — make this explicit in your blueprint.'],
    rubric: [
      { criterion: 'Blueprint structure', satisfactory: 'Three rows with correct labels', exemplary: 'Line of visibility correctly placed; frontstage/backstage activities distinct' },
      { criterion: 'Exception path', satisfactory: 'Exception path shown', exemplary: 'Exception path rejoins main flow; sender, receiver and transferred object named at each step' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-05-C', scenarioId: 'IT-04', level: 'intermediate',
    title: 'Complete an access-request blueprint and handoff checklist',
    task: 'Build on IT-05-B to create a complete access-request blueprint with all five stages of the journey. For each handoff between stages, create a handoff record with: sender role, receiver role, transferred object, channel and what happens if the transfer fails. Add at least one unresolved question to the BPMN handoff notes.',
    expectedEvidence: ['Five-stage blueprint', 'Handoff record for each stage transition', 'At least one unresolved question in BPMN handoff notes', 'BPMN draft downloaded from Map workspace'],
    hints: ['A handoff record is not the same as a step — it is the transition between steps.', 'Unresolved questions for BPMN handoff notes: "What if the manager is on leave during the approval window?"', 'Make sure each handoff record names a role, not a department.'],
    rubric: [
      { criterion: 'Handoff completeness', satisfactory: 'All stage transitions have a handoff record', exemplary: 'Each record specifies failure consequence and escalation path' },
      { criterion: 'BPMN readiness', satisfactory: 'At least one unresolved question', exemplary: 'Questions target specific decisions or loops that need BPMN gateways' },
    ],
    workspaceHint: 'map',
    estimatedTime: '50 min',
  },

  // ── IT-06 ──
  {
    id: 'IT-06-A', scenarioId: 'IT-05', level: 'intermediate',
    title: 'Identify incident-response and customer-communication processes',
    task: 'From IT-06, identify two distinct process candidates: one for technical incident response and one for customer communication. Write charters for both. Explain the dependency between them: which must start first? Can they run in parallel?',
    expectedEvidence: ['Two process charters', 'Dependency description with direction', 'Explanation of parallel vs sequential relationship'],
    hints: ['The technical response process starts with detection; communication starts with acknowledgement.', 'Both processes may run in parallel — the communication process does not wait for resolution.', 'Dependency direction: does A supply an output that B needs, or do they just share a trigger?'],
    rubric: [
      { criterion: 'Charter quality', satisfactory: 'Two distinct processes with trigger/outcome', exemplary: 'Owners are different roles; in-scope activities do not overlap' },
      { criterion: 'Dependency reasoning', satisfactory: 'Dependency direction identified', exemplary: 'Explains why parallel operation is correct and what coordination is needed' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '35 min',
  },
  {
    id: 'IT-06-B', scenarioId: 'IT-05', level: 'intermediate',
    title: 'Create a major-incident customer journey with uncertainty',
    task: 'Create a journey for the IT-06 scenario. Mark at least two steps where the customer is operating on incomplete or potentially incorrect information. Use evidence cards to show what the customer believes vs what is actually happening. Set sentiment for every step.',
    expectedEvidence: ['Journey with persona, goal and situation', 'Two steps marked with uncertainty/incomplete info', 'Evidence cards distinguishing customer belief from actual state', 'Sentiment on every step'],
    hints: ['When the status page shows "Operational" but the service is down, the customer has incorrect information.', 'You can use a note or evidence card to record what the customer believes vs what is true.', 'Sentiment for a step where the customer is uninformed is likely negative.'],
    rubric: [
      { criterion: 'Uncertainty modeling', satisfactory: 'Two steps with uncertainty identified', exemplary: 'Customer belief and actual state explicitly contrasted; evidence source noted' },
      { criterion: 'Sentiment arc', satisfactory: 'All steps have sentiment', exemplary: 'Sentiment arc reflects the customer\'s information state, not just the incident severity' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-06-C', scenarioId: 'IT-05', level: 'intermediate',
    title: 'Propose status updates without claiming proven satisfaction gains',
    task: 'The IT-06 scenario shows late and vague status updates. Propose a TO-BE intervention: more frequent and specific updates. Write: (1) the proposed change, (2) the expected benefit (as a hypothesis, not a proven fact), (3) a KPI target that would indicate success, and (4) how you would measure whether the target was achieved without confusing it with the target itself.',
    expectedEvidence: ['TO-BE change description', 'Benefit framed as hypothesis (not proven fact)', 'KPI target as a separate record from any observation', 'Measurement plan that distinguishes observation from target'],
    hints: ['A hypothesis starts with "We believe that…" or "We expect that…" — not "This will…"', 'A KPI target is an aspiration; a measurement is an observation. Never mix them.', 'What would you need to measure? How often? For how long? Over which population?'],
    rubric: [
      { criterion: 'Hypothesis framing', satisfactory: 'Benefit described as expected, not guaranteed', exemplary: 'Hypothesis has a falsifiable condition; validation plan names collection method and time window' },
      { criterion: 'KPI hygiene', satisfactory: 'Target and observation in separate records', exemplary: 'Population, unit and time window match between target and observation definition' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '35 min',
  },

  // ── IT-07 ──
  {
    id: 'IT-07-A', scenarioId: 'IT-06', level: 'advanced',
    title: 'Build the release-management process landscape',
    task: 'From IT-07, build a process landscape with at least 4 candidates organised across two levels (L1 value stream, L2 processes). Add at least one dependency relationship. Explain the granularity rationale: why are these at L2 and not L1 or L3?',
    expectedEvidence: ['At least 4 candidates at correct levels', 'At least one dependency relationship', 'Granularity rationale written as a note'],
    hints: ['L1 is usually a capability area: "Software Delivery" could be L1.', 'Dependencies: "Change advisory board approval" depends on "Release preparation" before it can proceed.', 'L2 is executable work with a clear trigger; L3 is a subprocess with the same trigger as its parent.'],
    rubric: [
      { criterion: 'Hierarchy structure', satisfactory: 'L1/L2 distinction present', exemplary: 'Level labels match process scope; L1 describes a value stream, not a team' },
      { criterion: 'Granularity reasoning', satisfactory: 'Rationale provided', exemplary: 'Explains what would be lost if processes were merged or what would be gained by splitting further' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-07-B', scenarioId: 'IT-06', level: 'advanced',
    title: 'Identify independent reviews and a failed-release alternative',
    task: 'The IT-07 scenario involves CAB approval (a sequential gate). Suppose security review and performance testing could run in parallel with CAB. Create an evidence record arguing for parallel execution. Then model the failed-release alternative path: what happens after a rollback? Who is responsible at each step?',
    expectedEvidence: ['Evidence record for parallel execution argument', 'Alternative path steps from rollback to reschedule', 'Named responsible role for each alternative path step'],
    hints: ['Evidence for parallel execution: neither CAB nor security review changes the other\'s inputs.', 'The alternative path starts at "Rollback production deployment" — what must happen next?', 'Who is responsible for the incident report? Who reschedules with CAB?'],
    rubric: [
      { criterion: 'Parallel argument', satisfactory: 'Evidence record created', exemplary: 'Argument identifies which inputs each parallel activity needs; independence justified' },
      { criterion: 'Alternative path completeness', satisfactory: 'Steps from rollback to reschedule', exemplary: 'Each step has a named responsible role; end state matches restart condition for main flow' },
    ],
    workspaceHint: 'discover',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-07-C', scenarioId: 'IT-06', level: 'advanced',
    title: 'Compare customer communication in two release journeys',
    task: 'Create a TO-BE journey for IT-07 that includes proactive customer communication during the deployment window. Compare it with the AS-IS journey. Identify at least 2 steps where the customer communication changes. Write an evidence-backed rationale for why the TO-BE communication approach is better.',
    expectedEvidence: ['TO-BE journey with proactive communication steps', 'Comparison note identifying 2 changed steps', 'Evidence-backed rationale for the change'],
    hints: ['In the TO-BE, the customer might receive a maintenance window notification and a confirmation of completion.', 'Evidence from the AS-IS pain points supports why communication was inadequate.', 'A "better" claim should reference a customer need, not just a provider preference.'],
    rubric: [
      { criterion: 'TO-BE quality', satisfactory: 'At least 2 changed communication steps', exemplary: 'TO-BE steps specify role, channel and content of communication; linked to AS-IS pain points' },
      { criterion: 'Rationale quality', satisfactory: 'References AS-IS evidence', exemplary: 'Rationale separates customer need from provider convenience; acknowledges tradeoffs' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '50 min',
  },

  // ── IT-08 ──
  {
    id: 'IT-08-A', scenarioId: 'IT-07', level: 'advanced',
    title: 'Create a developer API integration journey',
    task: 'Build the IT-08 journey from scratch (do not use the fixture directly). Include at least 4 stages, all required touchpoints (documentation, sandbox, production access, first call), and sentiment for each step. Mark at least two steps where the developer is operating on incorrect information.',
    expectedEvidence: ['Journey with persona and goal', 'All 4 required touchpoints', 'Sentiment on every step', 'Two steps with incorrect information noted'],
    hints: ['The developer finds incorrect auth docs — that is a step with incorrect information.', 'Sandbox rate limits not in docs is another case of the developer missing information.', 'Touchpoints need a channel type — the developer portal is a "portal" channel.'],
    rubric: [
      { criterion: 'Journey completeness', satisfactory: 'All touchpoints present', exemplary: 'Journey reads as developer experience; no system-centric steps; incorrect info clearly marked' },
      { criterion: 'Sentiment accuracy', satisfactory: 'Sentiment on all steps', exemplary: 'Negative steps align with identified pain points; arc has logical shape' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-08-B', scenarioId: 'IT-07', level: 'advanced',
    title: 'Prepare the production-access BPMN handoff',
    task: 'Using the Map workspace on IT-08, generate a BPMN draft for the "Production API access approval" process. Include: at least 3 mapped activities, at least 1 excluded step with rationale, and at least 2 handoff notes (one for the security questionnaire decision, one for the SLA breach scenario). Download both files.',
    expectedEvidence: ['At least 3 mapped activities in provider perspective', 'At least 1 excluded step with written rationale', '2 handoff notes addressing decision and SLA scenarios', 'Both .bpmn and .trace.json files downloaded'],
    hints: ['The security questionnaire decision is an approval/rejection — that is a gateway in BPMN.', 'The SLA breach handoff note should describe what happens after day 5 with no response.', 'Exclude "Developer applies for production access" — that is the customer step, not the provider step.'],
    rubric: [
      { criterion: 'Activity mapping', satisfactory: 'Activities use provider perspective', exemplary: 'All exclusions justified; activity names are specific and action-oriented' },
      { criterion: 'Handoff note quality', satisfactory: 'Two notes present', exemplary: 'Notes identify gateway type (XOR/AND), conditions and expected BPMN element' },
    ],
    workspaceHint: 'map',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-08-C', scenarioId: 'IT-07', level: 'advanced',
    title: 'Revise the developer journey after usability evidence',
    task: 'Suppose you receive new evidence: an interview with a developer who failed to integrate the API because the sandbox differed from production. Create this as an evidence record (interview, low confidence, synthetic). Link it to the relevant step and pain point. Then create a TO-BE journey step that addresses the sandbox discrepancy. Export a new BPMN draft revision.',
    expectedEvidence: ['Evidence record with type, confidence and synthetic label', 'Evidence linked to relevant step or pain point', 'TO-BE step addressing sandbox/production discrepancy', 'Second BPMN export created (new revision, different filename)'],
    hints: ['Synthetic data must be labeled as synthetic — do not present it as real research.', 'Linking evidence to a pain point shows which claims are supported.', 'The second BPMN export is a new revision — the previous file is not overwritten.'],
    rubric: [
      { criterion: 'Evidence quality', satisfactory: 'Evidence record created with correct fields', exemplary: 'Synthetic label present; confidence level justified; linked to specific artifact' },
      { criterion: 'Revision handling', satisfactory: 'Second BPMN export created', exemplary: 'TO-BE step changes the sandbox touchpoint; new revision has different filename; prior export visible in history' },
    ],
    workspaceHint: 'any',
    estimatedTime: '45 min',
  },

  // ── IT-09 ──
  {
    id: 'IT-09-A', scenarioId: 'IT-08', level: 'intermediate',
    title: 'Model renewal, cancellation and data-export experiences',
    task: 'From IT-09, create three separate journey segments: (1) the renewal consideration, (2) the cancellation attempt, and (3) the data export request. For each segment, identify the stakeholder goal and at least one moment of friction. Explain which segment has the most significant business impact and why.',
    expectedEvidence: ['Three journey segments with distinct goals', 'Friction identified per segment', 'Business impact argument for one segment'],
    hints: ['Different segments may have different personas — the renewal decision involves finance.', 'Friction can be a confusing UI, a missing option, or an unexpected wait time.', 'Business impact can mean customer trust, regulatory risk, revenue or operational cost.'],
    rubric: [
      { criterion: 'Segment clarity', satisfactory: 'Three segments with distinct goals', exemplary: 'Segments have distinct stages; goals are from the user perspective, not the provider' },
      { criterion: 'Business impact argument', satisfactory: 'Impact statement present', exemplary: 'Impact references a specific risk category with evidence from the scenario' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-09-B', scenarioId: 'IT-08', level: 'intermediate',
    title: 'Identify billing/support/account-management ownership gaps',
    task: 'From IT-09, identify the processes that span billing, support and account management. For each process, write the accountable owner role. Identify at least one ownership gap (where no clear owner exists). Create a coverage matrix showing which services each process supports.',
    expectedEvidence: ['Processes identified with owner roles', 'At least one ownership gap documented', 'Coverage matrix or note linking processes to services'],
    hints: ['The SLA credit claim process has no documented owner — that is a gap.', 'Billing, support and account management may be in different teams — make interfaces explicit.', 'A coverage matrix can be a simple table: process vs service, with yes/no/gap.'],
    rubric: [
      { criterion: 'Ownership accuracy', satisfactory: 'Owner roles named (not departments)', exemplary: 'Ownership gaps explained with consequence; no process listed as "owned by IT"' },
      { criterion: 'Coverage matrix', satisfactory: 'Matrix covers all processes', exemplary: 'Matrix identifies gaps and proposes which team should own them' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-09-C', scenarioId: 'IT-08', level: 'intermediate',
    title: 'Interpret cancellation KPIs and redesign targets',
    task: 'The IT-09 scenario implies a low cancellation rate is desirable. Create a KPI definition for "Monthly churn rate". Add two observation records (synthetic): one for the current state and one as a target. Explain why the target is not an observation. What would happen to the metric if cancelled accounts were re-activated — and how would you handle that in the formula?',
    expectedEvidence: ['KPI definition with population, unit and time window', 'Two records: one observation, one target', 'Explanation of why target ≠ observation', 'Formula note addressing re-activation edge case'],
    hints: ['Churn rate = cancelled in period / active at start of period × 100.', 'Population matters: are you counting seats, accounts or organisations?', 'If a cancelled account re-activates, the numerator in a previous period should not change retroactively.'],
    rubric: [
      { criterion: 'KPI definition quality', satisfactory: 'Population, unit and direction present', exemplary: 'Formula is explicit; re-activation edge case addressed; missing-data policy stated' },
      { criterion: 'Target/observation separation', satisfactory: 'Two separate records', exemplary: 'Explanation explains why confusing them produces misleading reports; linked to scenario example' },
    ],
    workspaceHint: 'any',
    estimatedTime: '35 min',
  },

  // ── IT-10 ──
  {
    id: 'IT-10-A', scenarioId: 'IT-09', level: 'advanced',
    title: 'Identify procurement processes without naming departments as processes',
    task: 'From IT-10, identify all process candidates. For each one, verify it passes the "trigger and outcome test": it must have an event-based trigger and a measurable outcome — not a department or team as the name. Write at least one example of a common mislabeling and explain why it fails the test.',
    expectedEvidence: ['All process candidates pass trigger/outcome test', 'At least one mislabeling example with explanation'],
    hints: ['Finance approval is a gate within procurement — is it a separate process or a step?', 'DPO review could be a separate process (it has its own trigger and owner).', '"Legal" is a department — "Contract review" is a process.'],
    rubric: [
      { criterion: 'Charter quality', satisfactory: 'All candidates have trigger and outcome', exemplary: 'No candidate name refers to a department; mislabeling example is specific and explained' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '35 min',
  },
  {
    id: 'IT-10-B', scenarioId: 'IT-09', level: 'advanced',
    title: 'Build the service-procurement SIPOC and supplier handoffs',
    task: 'Create a SIPOC for the "IT service procurement and vendor selection" process from IT-10. Include: suppliers (who provides inputs), inputs (what is received), process name and high-level steps, outputs (what is produced), and customers (who receives the output). Then identify the two most critical supplier handoffs and define what would happen if each failed.',
    expectedEvidence: ['Complete SIPOC with all five columns', 'At least 3 high-level process steps', 'Two critical handoffs with failure consequences'],
    hints: ['Suppliers in procurement: Finance (budget), Legal (contract review), Vendor (proposal).', 'Outputs: signed contract, PO, onboarded vendor — not just the final deliverable.', 'A critical handoff is one whose failure stops the process or causes a significant delay.'],
    rubric: [
      { criterion: 'SIPOC completeness', satisfactory: 'All five columns present', exemplary: 'No department in process column; outputs are specific artefacts; customers include internal teams' },
      { criterion: 'Handoff quality', satisfactory: 'Two handoffs with failure consequences', exemplary: 'Failure consequence identifies downstream impact and recovery action' },
    ],
    workspaceHint: 'any',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-10-C', scenarioId: 'IT-09', level: 'advanced',
    title: 'Clarify buyer/provider interfaces in a process map',
    task: 'The IT-10 scenario has three approval interfaces (finance, legal, DPO). For each interface, describe: the information transferred, who owns the approval decision, and what the buyer team can do if the approval is delayed. Create a process link in the journey matrix for each approval step.',
    expectedEvidence: ['Three interface descriptions with transferred information', 'Owner role for each approval (not department)', 'Buyer action option for each delay scenario', 'Process links in journey matrix'],
    hints: ['Finance: information transferred is the spend request; delay option is re-estimation.', 'Legal: information transferred is the contract draft; delay option is escalation to CLO.', 'The buyer team cannot approve on behalf of the approver — only escalate or wait.'],
    rubric: [
      { criterion: 'Interface completeness', satisfactory: 'All three interfaces described', exemplary: 'Each interface specifies transferred object, owner role and delay escalation path' },
      { criterion: 'Process links', satisfactory: 'Links created in journey matrix', exemplary: 'Links show which approval steps each process supports; no approval step unlinked' },
    ],
    workspaceHint: 'any',
    estimatedTime: '40 min',
  },

  // ── IT-11 ──
  {
    id: 'IT-11-A', scenarioId: 'IT-10', level: 'advanced',
    title: 'Build a cloud-migration value chain and process hierarchy',
    task: 'From IT-11, build a process landscape with at least 3 L2 processes and one L1 value stream. Add at least 2 dependency relationships. Write a note explaining the customer outcome each L1 value stream delivers.',
    expectedEvidence: ['L1 value stream with customer outcome', 'At least 3 L2 processes', 'At least 2 dependency relationships', 'Customer outcome note per L1'],
    hints: ['L1 could be "Infrastructure Modernisation" or "Cloud Migration Programme".', 'Dependencies: "Migration readiness assessment" precedes "Data migration and validation".', 'Customer outcome is about what the customer can do after the value stream completes — not what IT delivers.'],
    rubric: [
      { criterion: 'Hierarchy structure', satisfactory: 'L1/L2 distinction with customer outcomes', exemplary: 'L2 names describe work, not teams; L1 describes a customer-valued capability' },
      { criterion: 'Dependency reasoning', satisfactory: '2 dependencies present', exemplary: 'Dependencies explain why the relationship exists; no circular dependencies' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '45 min',
  },
  {
    id: 'IT-11-B', scenarioId: 'IT-10', level: 'advanced',
    title: 'Analyze migration cutover impact and customer pain',
    task: 'The IT-11 cutover failed due to a schema issue discovered late. Create three evidence records: (1) the schema issue itself (observed), (2) the customer impact (downtime, observed), and (3) the CMDB gap that enabled it (assumption). Link each to the relevant journey step or pain point. What would you have needed to know before the cutover started?',
    expectedEvidence: ['Three evidence records with correct types and confidence', 'Links to relevant steps or pain points', 'Pre-cutover knowledge gap described'],
    hints: ['Evidence type for the schema issue: observation (discovered during cutover). Confidence: high.', 'Evidence for CMDB gap: assumption (we believe the CMDB was out of date). Confidence: medium.', 'Pre-cutover knowledge: schema compatibility report, CMDB reconciliation, integration inventory.'],
    rubric: [
      { criterion: 'Evidence quality', satisfactory: 'Three records with type and confidence', exemplary: 'Each record has provenance; assumption is labeled as assumption; observation type matches source' },
      { criterion: 'Knowledge gap analysis', satisfactory: 'Gap identified', exemplary: 'Gap describes specific information with collection method and timing relative to cutover decision' },
    ],
    workspaceHint: 'discover',
    estimatedTime: '40 min',
  },
  {
    id: 'IT-11-C', scenarioId: 'IT-10', level: 'advanced',
    title: 'Compare migration journeys and defend communication choices',
    task: 'Create a TO-BE version of the IT-11 journey that includes proactive communication for the cutover overrun scenario. Compare 3 steps between AS-IS and TO-BE. For each changed step, write evidence from the AS-IS pain points that justifies the change. Identify one remaining risk in the TO-BE.',
    expectedEvidence: ['TO-BE journey with proactive communication steps', 'Comparison of 3 steps', 'Evidence-backed rationale for each change', 'One remaining risk in TO-BE'],
    hints: ['Proactive communication: "Notify stakeholders of overrun at 15 minutes before window close" is a new step.', 'Evidence from AS-IS: stakeholders were not notified proactively during the overrun.', 'Remaining risk: even with notification, stakeholders may not be available at 03:30.'],
    rubric: [
      { criterion: 'TO-BE quality', satisfactory: 'Three changed steps with communication improvement', exemplary: 'Changes are specific to communication timing and content; not just "communicate better"' },
      { criterion: 'Remaining risk', satisfactory: 'One risk identified', exemplary: 'Risk is specific, realistic and not already addressed by the TO-BE changes' },
    ],
    workspaceHint: 'journey',
    estimatedTime: '50 min',
  },

  // ── IT-12 (Capstone) ──
  {
    id: 'IT-12-A', scenarioId: 'IT-11', level: 'capstone',
    title: 'Identify and prioritize a managed-service process portfolio',
    task: 'From IT-12, identify at least 4 process candidates with full charters. Rate them on: (1) customer impact, (2) operational risk. Apply two weight sets and produce ranked lists. Write a recommendation memo (3–5 sentences) explaining which process to improve first and why, acknowledging the weight-set sensitivity.',
    expectedEvidence: ['At least 4 process candidates with charters', 'Ratings under two weight sets', 'Two ranked lists', 'Recommendation memo acknowledging weight-set sensitivity'],
    hints: ['Service discovery and transition should be in your list — they are where most problems originate.', 'Your recommendation should name which weight set reflects the current organisational priority.', 'Acknowledge: "If the weight set changes, the recommendation may change."'],
    rubric: [
      { criterion: 'Portfolio completeness', satisfactory: 'Four candidates with charters and ratings', exemplary: 'All candidates have distinct triggers; ratings justified with scenario evidence' },
      { criterion: 'Recommendation quality', satisfactory: 'Recommendation present with weight-set reference', exemplary: 'Recommendation names tradeoffs; acknowledges other stakeholder perspectives; avoids false certainty' },
    ],
    workspaceHint: 'identify',
    estimatedTime: '60 min',
  },
  {
    id: 'IT-12-B', scenarioId: 'IT-11', level: 'capstone',
    title: 'Build an onboarding journey, blueprint and BPMN handoff',
    task: 'Build the full IT-12 Transition stage as: (1) a journey map with persona, all steps and sentiment; (2) a simple blueprint showing customer, MSP and customer-internal layers; (3) a BPMN draft for "Knowledge transfer and transition" with at least 3 activities and 2 handoff notes. All three artefacts must have consistent source links.',
    expectedEvidence: ['Journey for Transition stage with sentiment', 'Blueprint with 3 layers', 'BPMN draft with 3 activities and 2 handoff notes', 'Consistent source references across all three artefacts'],
    hints: ['Consistency means: a pain point in the journey should correspond to a handoff note in the BPMN.', 'Blueprint layers: (1) customer actions (IT head), (2) MSP visible actions, (3) MSP internal actions.', 'Handoff notes for BPMN: escalation path sign-off is a decision; shadow period end is a parallel-to-sequential transition.'],
    rubric: [
      { criterion: 'Cross-artefact consistency', satisfactory: 'Pain points and handoff notes aligned', exemplary: 'All three artefacts reference the same steps and use consistent naming' },
      { criterion: 'BPMN readiness', satisfactory: 'Three activities, two notes', exemplary: 'Notes identify gateway types; exclusion rationale present for any out-of-scope steps' },
    ],
    workspaceHint: 'any',
    estimatedTime: '90 min',
  },
  {
    id: 'IT-12-C', scenarioId: 'IT-11', level: 'capstone',
    title: 'Full capstone: landscape, journey, blueprint, BPMN',
    task: 'Complete the full IT-12 capstone: (1) build a 4-process landscape with hierarchy, services and prioritization; (2) model the complete IT-12 journey with all stages, evidence-linked pain points and sentiment; (3) create a blueprint for the operational stage; (4) generate a BPMN draft with at least 4 activities, 3 handoff notes and an exclusion. All artefacts must be coherent and defensible.',
    expectedEvidence: ['4-process landscape with hierarchy and prioritization', 'Full journey with evidence-linked pain points', 'Blueprint for operational stage', 'BPMN draft downloaded with trace manifest', 'Coherence: same pain points appear across journey, blueprint and BPMN notes'],
    hints: ['Start with the landscape — it defines the scope for all other artefacts.', 'Defensible means: every significant claim has evidence or is marked as assumption.', 'The BPMN notes are the bridge between your journey pain points and the BPMN Studio work ahead.'],
    rubric: [
      { criterion: 'Landscape quality', satisfactory: 'Four processes with hierarchy and prioritization', exemplary: 'Landscape has service coverage and ownership gaps documented' },
      { criterion: 'Journey quality', satisfactory: 'All stages with pain points', exemplary: 'Pain points have symptom, cause and intervention; linked to evidence' },
      { criterion: 'BPMN readiness', satisfactory: 'Draft downloaded with notes', exemplary: 'Handoff notes address real decisions; trace manifest references all journey steps' },
      { criterion: 'Cross-artefact coherence', satisfactory: 'Pain points appear in multiple artefacts', exemplary: 'Complete chain: evidence → pain point → journey step → process → BPMN activity → handoff note' },
    ],
    workspaceHint: 'any',
    estimatedTime: '120 min',
  },
];

export function getChallengesForScenario(scenarioId: string): ChallengeDefinition[] {
  return CHALLENGES.filter(c => c.scenarioId === scenarioId);
}

export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find(c => c.id === id);
}
