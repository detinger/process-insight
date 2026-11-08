// Data loading for the documentation report (HTML export).
import { db } from '../../storage/db';
import { collectProjectData } from '../../storage/projectIO';
import type {
  ProjectData, DiscoveryInterview, DiscoveryInterviewItem, DiscoveryObservation,
  StormingCard, Contradiction, ProcessMap, MapLane, MapActivity, ProcessMapEdge,
  SipocDiagram, SipocRow,
} from '../../domain/contracts/types';

export type SectionId =
  | 'landscape' | 'register' | 'coverage' | 'scoring'
  | 'discover' | 'journeys' | 'sipoc' | 'maps' | 'dictionary';

export const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: 'landscape',  label: 'Process landscape',    hint: 'The landscape diagram: management, core and support processes' },
  { id: 'register',   label: 'Process register',     hint: 'Every process with owner, status, trigger and outcome' },
  { id: 'coverage',   label: 'Coverage',             hint: 'Which processes link to services and capabilities' },
  { id: 'scoring',    label: 'Priority scoring',     hint: 'Ranked processes with ratings per criterion' },
  { id: 'discover',   label: 'Discovery findings',   hint: 'Interviews, observations, event storming and contradictions' },
  { id: 'journeys',   label: 'Journey canvases',     hint: 'Each journey as the visual canvas, plus pain points' },
  { id: 'sipoc',      label: 'SIPOC',                hint: 'Supplier–input–process–output–customer tables' },
  { id: 'maps',       label: 'Process maps',         hint: 'Swimlane diagrams' },
  { id: 'dictionary', label: 'Dictionary',           hint: 'Personas, systems, channels and touchpoints' },
];

export interface ReportData extends ProjectData {
  interviews: DiscoveryInterview[];
  interviewItems: DiscoveryInterviewItem[];
  observations: DiscoveryObservation[];
  stormingCards: StormingCard[];
  contradictions: Contradiction[];
  processMaps: ProcessMap[];
  mapLanes: MapLane[];
  mapActivities: MapActivity[];
  mapEdges: ProcessMapEdge[];
  sipocDiagrams: SipocDiagram[];
  sipocRows: SipocRow[];
}

export async function loadReportData(projectId: string): Promise<ReportData> {
  const base = await collectProjectData(projectId);
  const [
    interviews, interviewItems, observations, stormingCards, contradictions,
    processMaps, mapLanes, mapActivities, mapEdges, sipocDiagrams, sipocRows,
  ] = await Promise.all([
    db.interviews.where('projectId').equals(projectId).toArray(), db.interviewItems.where('projectId').equals(projectId).toArray(), db.observations.where('projectId').equals(projectId).toArray(), db.stormingCards.where('projectId').equals(projectId).toArray(), db.contradictions.where('projectId').equals(projectId).toArray(),
    db.processMaps.where('projectId').equals(projectId).toArray(), db.mapLanes.where('projectId').equals(projectId).toArray(), db.mapActivities.where('projectId').equals(projectId).toArray(), db.mapEdges.where('projectId').equals(projectId).toArray(), db.sipocDiagrams.where('projectId').equals(projectId).toArray(), db.sipocRows.where('projectId').equals(projectId).toArray(),
  ]);
  return {
    ...base,
    interviews, interviewItems, observations, stormingCards, contradictions,
    processMaps, mapLanes, mapActivities, mapEdges, sipocDiagrams, sipocRows,
  };
}
