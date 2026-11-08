import { useState, useEffect, useCallback } from 'react';
import { FileCode, Table2, GitBranch } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import { SipocPanel } from './SipocPanel';
import { ProcessMapPanel } from './ProcessMapPanel';
import { BpmnModeler } from '../modeler/BpmnModeler';
import { generateBpmnXml } from '../derivation/bpmnGenerator';
import type { ProcessMap, MapLane, MapActivity, ProcessMapEdge, SipocDiagram, SipocRow } from '../../domain/contracts/types';
import type { BpmnLane, BpmnActivity, BpmnGeneratorInput } from '../derivation/bpmnGenerator';

type MapTab = 'sipoc' | 'processmap' | 'bpmn';

const MAP_TABS: { id: MapTab; label: string; icon: React.ReactNode; why: string }[] = [
  { id: 'sipoc',      label: 'SIPOC',       icon: <Table2 size={13} />,
    why: 'Define suppliers, inputs, process steps, outputs and customers at a high level.' },
  { id: 'processmap', label: 'Process Map', icon: <GitBranch size={13} />,
    why: 'Build a swimlane role map with tasks, decisions and flow connections.' },
  { id: 'bpmn',       label: 'BPMN Editor', icon: <FileCode size={13} />,
    why: 'Edit and token-simulate a BPMN 2.0 draft pre-filled from your process map, then export.' },
];

function topoSort(tasks: MapActivity[], edges: ProcessMapEdge[], allActivities: MapActivity[]): MapActivity[] {
  if (edges.length === 0) return [...tasks].sort((a, b) => a.x - b.x);

  const actById = new Map(allActivities.map(a => [a.id, a]));
  const nextIds = new Map<string, string[]>();
  for (const a of allActivities) nextIds.set(a.id, []);
  for (const e of edges) {
    const arr = nextIds.get(e.fromId);
    if (arr) arr.push(e.toId);
  }
  const hasIncoming = new Set(edges.map(e => e.toId));
  const roots = allActivities.filter(a => a.type === 'start' || !hasIncoming.has(a.id));

  const visited = new Set<string>();
  const ordered: MapActivity[] = [];
  const taskIds = new Set(tasks.map(t => t.id));

  function bfs(startId: string) {
    const queue = [startId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const a = actById.get(id);
      if (a && taskIds.has(a.id)) ordered.push(a);
      for (const nid of nextIds.get(id) ?? []) {
        if (!visited.has(nid)) queue.push(nid);
      }
    }
  }

  for (const r of roots) bfs(r.id);
  for (const t of tasks) {
    if (!visited.has(t.id)) ordered.push(t);
  }
  return ordered;
}

function buildBpmnInput(
  maps: ProcessMap[],
  lanes: MapLane[],
  activities: MapActivity[],
  edges: ProcessMapEdge[],
  sipocDiagrams: SipocDiagram[],
  sipocRows: SipocRow[],
): BpmnGeneratorInput {
  const map = maps[0];

  if (map) {
    const mapLanes = lanes.filter(l => l.mapId === map.id).sort((a, b) => a.order - b.order);
    const mapActivities = activities.filter(a => a.mapId === map.id);
    const mapEdges = edges.filter(e => e.mapId === map.id);
    const mapTasks = topoSort(
      mapActivities.filter(a => a.type === 'task' && a.label.trim()),
      mapEdges,
      mapActivities,
    );

    const bpmnLanes: BpmnLane[] = mapLanes.length > 0
      ? mapLanes.map(l => ({ id: l.id, name: l.label }))
      : [{ id: 'lane_default', name: 'Provider' }];

    const defaultLaneId = bpmnLanes[0].id;

    const bpmnActivities: BpmnActivity[] = mapTasks.map(a => ({
      id: `Task_${a.id}`,
      name: a.label,
      laneId: bpmnLanes.find(l => l.id === a.laneId) ? a.laneId : defaultLaneId,
      sourceStepIds: [],
      disposition: 'mapped',
    }));

    return {
      processId: map.id,
      processName: map.title || 'Process',
      participantName: map.title || 'Provider',
      lanes: bpmnLanes,
      activities: bpmnActivities,
      sourceJourneyId: '',
      sourceRevisionId: 'map-auto',
      converterVersion: '1.0',
      unresolved: [],
    };
  }

  // Fall back to SIPOC steps
  const diagram = sipocDiagrams[0];
  if (diagram) {
    const rows = sipocRows
      .filter(r => r.diagramId === diagram.id && r.step.trim())
      .sort((a, b) => a.order - b.order);
    return {
      processId: diagram.id,
      processName: diagram.title || 'Process',
      participantName: diagram.title || 'Provider',
      lanes: [{ id: 'lane_default', name: 'Provider' }],
      activities: rows.map(r => ({
        id: `Task_${r.id}`,
        name: r.step,
        laneId: 'lane_default',
        sourceStepIds: [],
        disposition: 'mapped',
      })),
      sourceJourneyId: '',
      sourceRevisionId: 'sipoc-auto',
      converterVersion: '1.0',
      unresolved: [],
    };
  }

  return {
    processId: newId('proc'),
    processName: 'New Process',
    participantName: 'Provider',
    lanes: [{ id: 'lane_default', name: 'Provider' }],
    activities: [],
    sourceJourneyId: '',
    sourceRevisionId: 'empty',
    converterVersion: '1.0',
    unresolved: [],
  };
}

export function MapWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<MapTab>('sipoc');
  const [bpmnXml, setBpmnXml] = useState<string | null>(null);
  const [bpmnLoaded, setBpmnLoaded] = useState(false);

  // Load map data and auto-generate BPMN when first entering bpmn tab
  useEffect(() => {
    if (tab !== 'bpmn' || bpmnLoaded) return;
    Promise.all([
      db.processMaps.where('projectId').equals(projectId).toArray(),
      db.mapLanes.where('projectId').equals(projectId).toArray(),
      db.mapActivities.where('projectId').equals(projectId).toArray(),
      db.mapEdges.where('projectId').equals(projectId).toArray(),
      db.sipocDiagrams.where('projectId').equals(projectId).toArray(),
      db.sipocRows.where('projectId').equals(projectId).toArray(),
    ]).then(([maps, lanes, activities, edges, diagrams, rows]) => {
      const input = buildBpmnInput(maps, lanes, activities, edges, diagrams, rows);
      const { xml } = generateBpmnXml(input);
      setBpmnXml(xml);
      setBpmnLoaded(true);
    });
  }, [tab, projectId, bpmnLoaded]);

  const handleBpmnChange = useCallback((xml: string) => {
    setBpmnXml(xml);
  }, []);

  const active = MAP_TABS.find(t => t.id === tab)!;
  const isBpmn = tab === 'bpmn';

  return (
    <div className="workspace" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        {MAP_TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {/* Description bar */}
      <div style={{ padding: '7px 24px', fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
        {active.why}
      </div>

      {/* SIPOC / Process Map — scrollable narrow content */}
      {!isBpmn && (
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 48px' }}>
          <div className="workspace-narrow">
            {tab === 'sipoc'      && <SipocPanel      projectId={projectId} />}
            {tab === 'processmap' && <ProcessMapPanel  projectId={projectId} />}
          </div>
        </div>
      )}

      {/* BPMN Editor — fills remaining height */}
      {isBpmn && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {bpmnXml !== null ? (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                <BpmnModeler
                  xml={bpmnXml}
                  title="Process draft"
                  onChange={handleBpmnChange}
                />
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-title">Loading…</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
