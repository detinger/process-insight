// Core ID types
import type { ProcessRating } from '../scoring';

export type ID = string;
export type RevisionID = string;

export type SourceStatus = 'evidence-backed' | 'assumption' | 'contested';

export type ArtifactKind =
  | 'process' | 'candidate' | 'journey' | 'step' | 'card'
  | 'map-node' | 'blueprint-action' | 'dictionary-entry'
  | 'pain-point' | 'kpi' | 'evidence' | 'bpmn-element';

export interface EntityRef {
  kind: ArtifactKind;
  artifactId: ID;
  revisionId?: RevisionID;
  elementId?: ID;
}

// ─── Project ───

export interface ProjectManifest {
  id: ID;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentRevisionId?: RevisionID;
  schemaVersion: number;
}

export interface ProjectOwned {
  projectId: ID;
}

export interface Revision extends ProjectOwned {
  id: RevisionID;
  name: string;
  createdAt: string;
  snapshot: boolean;
}

// ─── Process landscape ───

export type CandidateStatus = 'proposed' | 'under-review' | 'accepted' | 'merged' | 'rejected';

export interface ProcessCandidate extends ProjectOwned {
  id: ID;
  title: string;
  status: CandidateStatus;
  rationale: string;
  sourceRefs: EntityRef[];
  mergedIntoId?: ID;
  createdAt: string;
}

export interface ProcessDefinition extends ProjectOwned {
  id: ID;
  title: string;
  purpose: string;
  categoryId?: ID;
  parentId?: ID;
  levelLabel: string;
  trigger: string;
  outcome: string;
  inScope: string[];
  outOfScope: string[];
  ownerRoleId?: ID;
  evidenceIds: ID[];
  status: 'draft' | 'reviewed' | 'retired';
  serviceIds: ID[];
  capabilityIds: ID[];
  systemIds: ID[];
  maturity?: 1 | 2 | 3 | 4 | 5;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  reviewedAt?: string;
}

export type RelationshipType =
  | 'decomposesInto'
  | 'precedesInValueChain'
  | 'suppliesOutputTo'
  | 'dependsOn'
  | 'supportsService'
  | 'realizesCapability'
  | 'supportsJourneyStep'
  | 'interfacesWith';

export interface LandscapeRelation extends ProjectOwned {
  id: ID;
  fromId: ID;
  toId: ID;
  type: RelationshipType;
  label?: string;
  rationale?: string;
  criticality?: 'low' | 'medium' | 'high';
}

export interface PriorityScore {
  processId: ID;
  ratings: Record<string, number | null>;
  weights: Record<string, number>;
  score: number | null;
  evidenceConfidence?: number | null;
  configVersion: string;
}

// ─── Dictionary ───

export interface Persona extends ProjectOwned {
  id: ID;
  name: string;
  role: string;
  goals: string[];
  needs: string[];
  constraints: string[];
  accessibilityNeeds: string[];
  evidenceIds: ID[];
}

export interface OrganizationUnit extends ProjectOwned {
  id: ID;
  name: string;
  type: 'department' | 'team' | 'role' | 'external';
  responsibility: string;
}

export interface Service extends ProjectOwned {
  id: ID;
  name: string;
  customerOutcome: string;
  ownerRoleId?: ID;
  scope: string;
}

export interface Capability extends ProjectOwned {
  id: ID;
  name: string;
  description: string;
  realizingProcessIds: ID[];
}

export interface Channel extends ProjectOwned {
  id: ID;
  name: string;
  type: 'portal' | 'email' | 'chat' | 'phone' | 'mobile-app' | 'api' | 'in-person' | 'other';
}

export interface Touchpoint extends ProjectOwned {
  id: ID;
  name: string;
  purpose: string;
  channelId: ID;
  systemIds: ID[];
  recipientPersonaIds: ID[];
  accessibilityConcerns: string[];
}

export interface ITSystem extends ProjectOwned {
  id: ID;
  name: string;
  type: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  supportingRole: string;
  evidenceIds: ID[];
}

// ─── Journey ───

export type JourneyPerspective = 'customer' | 'employee' | 'developer' | 'supplier' | 'partner';
export type JourneyState = 'as-is' | 'to-be';

export interface Journey extends ProjectOwned {
  id: ID;
  title: string;
  goal: string;
  situation: string;
  perspective: JourneyPerspective;
  state: JourneyState;
  personaIds: ID[];
  stageOrder: ID[];
  rowOrder: ID[];
  derivedFromRevisionId?: RevisionID;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStage extends ProjectOwned {
  id: ID;
  journeyId: ID;
  title: string;
  description: string;
  order: number;
}

export interface JourneyStep extends ProjectOwned {
  id: ID;
  journeyId: ID;
  stageId: ID;
  title: string;
  order: number;
}

export type RowType =
  | 'customer-actions'
  | 'goals-expectations'
  | 'thoughts-questions'
  | 'touchpoints'
  | 'sentiment'
  | 'pain-points'
  | 'moments-that-matter'
  | 'opportunities'
  | 'processes'
  | 'roles-units'
  | 'systems'
  | 'kpis'
  | 'evidence'
  | 'free-notes';

export interface JourneyRow extends ProjectOwned {
  id: ID;
  journeyId: ID;
  type: RowType;
  label: string;
  order: number;
}

export interface Cell extends ProjectOwned {
  id: ID;
  journeyId: ID;
  stepId: ID;
  rowId: ID;
  cardOrder: ID[];
}

export type SentimentValue = -2 | -1 | 0 | 1 | 2 | null;

export type CardPayload =
  | { kind: 'text'; text: string }
  | { kind: 'touchpoint'; touchpointId: ID }
  | { kind: 'process-link'; processId: ID }
  | { kind: 'pain-link'; painPointId: ID }
  | { kind: 'metric-link'; definitionId: ID; observationIds: ID[] }
  | { kind: 'sentiment'; personaId: ID; value: SentimentValue }
  | { kind: 'dictionary-link'; entryId: ID }
  | { kind: 'image'; assetId: ID; alt: string };

export interface JourneyCard extends ProjectOwned {
  id: ID;
  cellId: ID;
  payload: CardPayload;
  sourceStatus: SourceStatus;
  evidenceIds: ID[];
  note: string;
}

// ─── Pain points ───

export type PainSeverity = 'minor' | 'moderate' | 'significant' | 'critical';

export interface PainPoint extends ProjectOwned {
  id: ID;
  title: string;
  description: string;
  affectedPersonaIds: ID[];
  affectedStepIds: ID[];
  affectedProcessIds: ID[];
  severity: PainSeverity;
  scopeEstimate: string;
  evidenceIds: ID[];
  suspectedCauseIds: ID[];
  owner?: string;
  state: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
  symptom: string;
  hypothesizedCause: string;
  validatedCause: string;
  proposedIntervention: string;
}

// ─── Evidence ───

export type EvidenceType = 'interview' | 'observation' | 'document' | 'survey' | 'workshop' | 'assumption';

export interface EvidenceRecord extends ProjectOwned {
  id: ID;
  type: EvidenceType;
  title: string;
  content: string;
  sourceRole: string;
  collectionDate?: string;
  context: string;
  excerpt: string;
  confidence: 'low' | 'medium' | 'high';
  synthetic: boolean;
}

export interface EvidenceLink extends ProjectOwned {
  id: ID;
  claim: EntityRef;
  evidenceId: ID;
  relation: 'supports' | 'contradicts' | 'context';
  excerpt?: string;
}

// ─── Metrics ───

export type ObservationType = 'measured' | 'imported' | 'estimated' | 'synthetic' | 'target';

export interface KpiDefinition extends ProjectOwned {
  id: ID;
  name: string;
  description: string;
  unit: string;
  direction: 'higher-better' | 'lower-better' | 'target-based';
  formula: string;
  population: string;
  timeWindow: string;
  source: string;
  missingDataPolicy: string;
}

export interface KpiObservation extends ProjectOwned {
  id: ID;
  definitionId: ID;
  value: number;
  type: ObservationType;
  period: string;
  source: string;
  provenance: string;
  note: string;
  revisionRef?: EntityRef;
}

// ─── BPMN derivation ───

export interface DerivationDecision {
  id: ID;
  sourceStepIds: ID[];
  targetNodeIds: ID[];
  disposition: 'mapped' | 'annotation' | 'excluded';
  rationale: string;
  assumptions: string[];
}

export interface BpmnDerivation extends ProjectOwned {
  id: ID;
  sourceJourneyId: ID;
  sourceRevisionId: RevisionID;
  targetProcessId: ID;
  converterVersion: string;
  configurationHash: string;
  decisions: DerivationDecision[];
  targetArtifactId: ID;
  targetRevisionId: RevisionID;
  status: 'draft' | 'reviewed' | 'source-changed' | 'broken-links';
  createdAt: string;
}

// Lightweight record of a completed BPMN download (AT-21: immutable export revisions).
export interface BpmnExport extends ProjectOwned {
  id: ID;
  journeyId: ID;
  processName: string;
  participantName: string;
  exportedAt: string;
  status: 'draft' | 'source-changed';
  mappingCount: number;
  exclusionCount: number;
  unresolvedCount: number;
  converterVersion: string;
  filename: string;
}

// Project-scoped learning state. The Learn workspace will progressively fill
// these fields; keeping them in the native project format prevents progress
// from becoming a separate, easy-to-lose data island.
export interface LearningProgress extends ProjectOwned {
  id: ID;
  challengeId: ID;
  status: 'not-started' | 'in-progress' | 'completed';
  attempts: number;
  usedHintIndexes: number[];
  reflection: string;
  criterionResults: Record<string, 'not-checked' | 'satisfactory' | 'exemplary' | 'needs-review'>;
  updatedAt: string;
}

// ─── Process map & SIPOC ───

export interface ProcessMap extends ProjectOwned {
  id: ID;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapLane extends ProjectOwned {
  id: ID;
  mapId: ID;
  label: string;
  order: number;
}

export type MapActivityType = 'start' | 'task' | 'decision' | 'end';

export interface MapActivity extends ProjectOwned {
  id: ID;
  mapId: ID;
  laneId: ID;
  type: MapActivityType;
  label: string;
  note: string;
  x: number;
  y: number;
}

export interface ProcessMapEdge extends ProjectOwned {
  id: ID;
  mapId: ID;
  fromId: ID;
  toId: ID;
  label: string;
}

export interface SipocDiagram extends ProjectOwned {
  id: ID;
  title: string;
  processRef: string;
  createdAt: string;
}

export interface SipocRow extends ProjectOwned {
  id: ID;
  diagramId: ID;
  supplier: string;
  input: string;
  step: string;
  output: string;
  customer: string;
  order: number;
}

// ─── Discovery tools ───

export interface DiscoveryInterview extends ProjectOwned {
  id: ID;
  interviewee: string;
  role: string;
  date?: string;
  notes: string;
  createdAt: string;
}

export type InterviewItemType = 'quote' | 'claim' | 'question';

export interface DiscoveryInterviewItem extends ProjectOwned {
  id: ID;
  interviewId: ID;
  type: InterviewItemType;
  text: string;
  createdAt: string;
}

export type ObservationType2 = 'work' | 'delay' | 'exception' | 'interaction';

export interface DiscoveryObservation extends ProjectOwned {
  id: ID;
  type: ObservationType2;
  actor: string;
  description: string;
  sequence: number;
  createdAt: string;
}

export type StormingCardType = 'event' | 'command' | 'actor' | 'policy';

export interface StormingCard extends ProjectOwned {
  id: ID;
  type: StormingCardType;
  text: string;
  sequence: number;
}

export type ContradictionStatus = 'open' | 'resolved' | 'deferred';

export interface Contradiction extends ProjectOwned {
  id: ID;
  topic: string;
  sourceA: string;
  claimA: string;
  sourceB: string;
  claimB: string;
  status: ContradictionStatus;
  resolution: string;
  createdAt: string;
}

// ─── Diagnostics ───

export interface Diagnostic {
  code: string;
  severity: 'error' | 'warning' | 'recommendation' | 'information';
  category: 'schema' | 'reference' | 'modeling' | 'derivation' | 'learning';
  target: EntityRef;
  message: string;
  suggestedAction?: string;
  relatedLessonId?: ID;
}

// ─── Full project data ───

export interface ProjectData {
  manifest: ProjectManifest;
  revisions: Revision[];
  processes: ProcessDefinition[];
  candidates: ProcessCandidate[];
  relations: LandscapeRelation[];
  personas: Persona[];
  units: OrganizationUnit[];
  services: Service[];
  capabilities: Capability[];
  channels: Channel[];
  touchpoints: Touchpoint[];
  systems: ITSystem[];
  journeys: Journey[];
  stages: JourneyStage[];
  steps: JourneyStep[];
  rows: JourneyRow[];
  cells: Cell[];
  cards: JourneyCard[];
  painPoints: PainPoint[];
  evidence: EvidenceRecord[];
  evidenceLinks: EvidenceLink[];
  kpiDefinitions: KpiDefinition[];
  kpiObservations: KpiObservation[];
  derivations: BpmnDerivation[];
  processRatings: ProcessRating[];
  bpmnExports: BpmnExport[];
  learningProgress: LearningProgress[];
}
