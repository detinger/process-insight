// Process landscape graph using @xyflow/react (AT-12, AT-26).
// Nodes = ProcessDefinitions. Edges = LandscapeRelations typed by RelationshipType.
// Layout: simple layered by parentId depth with horizontal spread.
// Cycle detection: decomposesInto cycles blocked; dependsOn cycles shown and labelled.

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  type Node, type Edge, type NodeTypes,
  Handle, Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, GitBranch } from 'lucide-react';
import type { ProcessDefinition, LandscapeRelation, RelationshipType } from '../../domain/contracts/types';

// ─── Cycle detection ───

function buildDescendants(processId: string, decomposesEdges: LandscapeRelation[]): Set<string> {
  const visited = new Set<string>();
  const queue = [processId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of decomposesEdges) {
      if (e.fromId === id && !visited.has(e.toId)) {
        visited.add(e.toId);
        queue.push(e.toId);
      }
    }
  }
  return visited;
}

export function wouldCreateCycle(
  fromId: string, toId: string, relations: LandscapeRelation[]
): boolean {
  // Adding decomposesInto from→to creates a cycle if 'to' is already a descendant of 'from'.
  const decomp = relations.filter(r => r.type === 'decomposesInto');
  const descendants = buildDescendants(fromId, decomp);
  return descendants.has(toId) || toId === fromId;
}

export function findDependencyCycles(relations: LandscapeRelation[]): Set<string>[] {
  const dependEdges = relations.filter(r => r.type === 'dependsOn');
  const adj = new Map<string, string[]>();
  for (const e of dependEdges) {
    if (!adj.has(e.fromId)) adj.set(e.fromId, []);
    adj.get(e.fromId)!.push(e.toId);
  }
  // Tarjan's SCC to find cycles
  const result: Set<string>[] = [];
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  let counter = 0;
  const nodes = new Set([...dependEdges.map(e => e.fromId), ...dependEdges.map(e => e.toId)]);

  function strongconnect(v: string) {
    index.set(v, counter);
    lowlink.set(v, counter);
    counter++;
    stack.push(v);
    onStack.add(v);
    for (const w of (adj.get(v) ?? [])) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }
    if (lowlink.get(v) === index.get(v)) {
      const scc = new Set<string>();
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.add(w);
      } while (w !== v);
      if (scc.size > 1) result.push(scc);
    }
  }

  for (const n of nodes) {
    if (!index.has(n)) strongconnect(n);
  }
  return result;
}

// ─── Layout ───

function computeLayout(
  processes: ProcessDefinition[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const NODE_W = 180;
  const NODE_H = 60;
  const H_GAP = 40;
  const V_GAP = 80;

  // BFS by depth (parentId chain)
  const levels = new Map<string, number>();
  const roots = processes.filter(p => !p.parentId);
  roots.forEach(p => levels.set(p.id, 0));
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of processes) {
      if (p.parentId && levels.has(p.parentId) && !levels.has(p.id)) {
        levels.set(p.id, levels.get(p.parentId)! + 1);
        changed = true;
      }
    }
  }
  // Processes without a parent chain: depth 0
  for (const p of processes) {
    if (!levels.has(p.id)) levels.set(p.id, 0);
  }

  // Group by level, sort alphabetically within level
  const byLevel = new Map<number, ProcessDefinition[]>();
  for (const p of processes) {
    const lvl = levels.get(p.id) ?? 0;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(p);
  }

  for (const [lvl, procs] of byLevel) {
    const sorted = [...procs].sort((a, b) => a.title.localeCompare(b.title));
    sorted.forEach((p, i) => {
      positions.set(p.id, {
        x: i * (NODE_W + H_GAP),
        y: lvl * (NODE_H + V_GAP),
      });
    });
  }

  return positions;
}

// ─── Edge styles ───

const EDGE_STYLE: Record<RelationshipType, { stroke: string; strokeDasharray?: string; label: string }> = {
  decomposesInto:       { stroke: 'var(--primary)',  label: 'decomposes' },
  precedesInValueChain: { stroke: 'var(--accent)',   label: 'precedes' },
  suppliesOutputTo:     { stroke: 'var(--success)',  label: 'supplies' },
  dependsOn:            { stroke: 'var(--warning)', strokeDasharray: '5 3', label: 'depends on' },
  supportsService:      { stroke: 'var(--info)',    strokeDasharray: '3 3', label: 'supports' },
  realizesCapability:   { stroke: 'var(--info)',    strokeDasharray: '3 3', label: 'realizes' },
  supportsJourneyStep:  { stroke: 'var(--text-subtle)', strokeDasharray: '2 4', label: 'supports step' },
  interfacesWith:       { stroke: 'var(--border-strong)', label: 'interfaces' },
};

// ─── Custom node ───

type ProcessNodeData = {
  label: string;
  status: string;
  levelLabel: string;
  inCycle: boolean;
  selected: boolean;
};

function ProcessNode({ data, selected }: { data: ProcessNodeData; selected: boolean }) {
  const statusColor =
    data.status === 'reviewed' ? 'var(--success)' :
    data.status === 'retired' ? 'var(--text-subtle)' : 'var(--primary)';

  return (
    <div style={{
      background: selected ? 'var(--primary)' : data.inCycle ? 'var(--warning-soft)' : 'var(--bg-elevated)',
      border: `2px solid ${selected ? 'var(--primary)' : data.inCycle ? 'var(--warning)' : 'var(--border)'}`,
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 160,
      maxWidth: 200,
      cursor: 'pointer',
      boxShadow: selected ? 'var(--shadow)' : 'var(--shadow-sm)',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--border-strong)' }} />
      <div style={{
        fontSize: 12, fontWeight: 650,
        color: selected ? 'var(--text-on-primary)' : 'var(--text)',
        lineHeight: 1.3,
        marginBottom: 4,
      }}>
        {data.label}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{
          fontSize: 10, color: selected ? 'rgba(255,255,255,0.75)' : 'var(--text-subtle)',
          background: selected ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)',
          borderRadius: 4, padding: '1px 5px',
        }}>
          {data.levelLabel}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: selected ? 'rgba(255,255,255,0.75)' : statusColor,
        }}>
          {data.status}
        </span>
        {data.inCycle && <AlertTriangle size={10} style={{ color: 'var(--warning)' }} />}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--border-strong)' }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { process: ProcessNode };

// ─── Main component ───

interface Props {
  processes: ProcessDefinition[];
  relations: LandscapeRelation[];
  selectedId: string | null;
  onSelectProcess: (id: string) => void;
  onAddRelation: (fromId: string, toId: string, type: RelationshipType) => void;
  onCycleWarning: (msg: string) => void;
}

export function LandscapeGraph({
  processes, relations, selectedId, onSelectProcess, onCycleWarning,
}: Props) {
  const cycles = useMemo(() => findDependencyCycles(relations), [relations]);
  const cycleNodes = useMemo(() => {
    const set = new Set<string>();
    cycles.forEach(c => c.forEach(id => set.add(id)));
    return set;
  }, [cycles]);

  const positions = useMemo(() => computeLayout(processes), [processes]);

  const initialNodes: Node[] = useMemo(() => processes.map(p => ({
    id: p.id,
    type: 'process',
    position: positions.get(p.id) ?? { x: 0, y: 0 },
    data: {
      label: p.title,
      status: p.status,
      levelLabel: p.levelLabel,
      inCycle: cycleNodes.has(p.id),
      selected: p.id === selectedId,
    } as ProcessNodeData,
    selected: p.id === selectedId,
  })), [processes, positions, cycleNodes, selectedId]);

  const initialEdges: Edge[] = useMemo(() => relations.map(r => {
    const style = EDGE_STYLE[r.type] ?? EDGE_STYLE['dependsOn'];
    return {
      id: r.id,
      source: r.fromId,
      target: r.toId,
      label: style.label,
      style: { stroke: style.stroke, strokeDasharray: style.strokeDasharray, strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: 'var(--text-subtle)' },
      labelBgStyle: { fill: 'var(--bg)', fillOpacity: 0.9 },
    };
  }), [relations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync when processes/relations change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectProcess(node.id);
  }, [onSelectProcess]);

  if (processes.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state-icon"><GitBranch size={36} /></div>
        <div className="empty-state-title">No processes to display</div>
        <div className="empty-state-desc">Accept candidates to populate the landscape graph.</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {cycles.length > 0 && (
        <div
          className="callout callout-warning"
          style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, fontSize: 12 }}
          onClick={() => onCycleWarning(`${cycles.length} dependency cycle(s) detected among: ${
            [...cycleNodes].map(id => processes.find(p => p.id === id)?.title ?? id).join(', ')
          }`)}
        >
          <AlertTriangle size={13} className="callout-icon" />
          {cycles.length} dependency cycle{cycles.length > 1 ? 's' : ''} detected — click for details.
          Operational dependency cycles are retained and shown as investigable groups.
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        style={{ background: 'var(--bg-sunken)' }}
      >
        <Background color="var(--border)" />
        <Controls />
        <MiniMap
          nodeColor={n =>
            (n.data as ProcessNodeData).selected ? 'var(--primary)' :
            (n.data as ProcessNodeData).inCycle ? 'var(--warning)' : 'var(--bg-subtle)'
          }
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        />
      </ReactFlow>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', fontSize: 11, zIndex: 5,
      }}>
        {(['decomposesInto', 'precedesInValueChain', 'dependsOn', 'supportsService'] as RelationshipType[]).map(t => {
          const s = EDGE_STYLE[t];
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <svg width={24} height={6}>
                <line x1={0} y1={3} x2={24} y2={3}
                  stroke={s.stroke} strokeWidth={2}
                  strokeDasharray={s.strokeDasharray ?? 'none'}
                />
              </svg>
              <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
