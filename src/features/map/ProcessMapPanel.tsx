import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  type Node, type Edge, type Connection, type NodeTypes,
  Handle, Position, MarkerType, Panel, ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, ChevronLeft, Circle, Square, Diamond, Flag } from 'lucide-react';
import { db } from '../../storage/db';
import { newId } from '../../domain/contracts/ids';
import type { ProcessMap, MapLane, MapActivity, MapActivityType, ProcessMapEdge } from '../../domain/contracts/types';

// ─── Constants ────────────────────────────────────────────────

const LANE_HEIGHT = 170;
const CANVAS_W = 2200;

const LANE_COLORS = [
  'rgba(59,130,246,0.05)',
  'rgba(16,185,129,0.05)',
  'rgba(245,158,11,0.05)',
  'rgba(139,92,246,0.05)',
  'rgba(239,68,68,0.05)',
  'rgba(236,72,153,0.05)',
];

function now() { return new Date().toISOString(); }

// ─── Custom node components ───────────────────────────────────

function LaneNode({ data }: { data: Record<string, unknown> }) {
  const label = data.label as string;
  const color = data.color as string;
  return (
    <div style={{ width: '100%', height: '100%', background: color, borderBottom: '1px solid rgba(0,0,0,0.07)', position: 'relative', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        fontWeight: 700, fontSize: 10, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        writingMode: 'vertical-rl', userSelect: 'none',
        maxHeight: LANE_HEIGHT - 20, overflow: 'hidden',
      }}>
        {label}
      </div>
    </div>
  );
}

function StartNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10b981', border: `3px solid ${selected ? '#1e3a5f' : '#059669'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none' }}>
      <Handle type="source" position={Position.Right} style={{ background: '#059669', width: 8, height: 8 }} />
      <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, lineHeight: 1.2, textAlign: 'center', maxWidth: 36 }}>{(data.label as string) || 'Start'}</span>
    </div>
  );
}

function EndNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: `4px solid ${selected ? '#1e3a5f' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none' }}>
      <Handle type="target" position={Position.Left} style={{ background: '#ef4444', width: 8, height: 8 }} />
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{(data.label as string) || 'End'}</span>
      </div>
    </div>
  );
}

function TaskNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  return (
    <div style={{
      width: 150, minHeight: 54, borderRadius: 7, background: 'var(--bg)',
      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--primary)', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--primary)', width: 8, height: 8 }} />
      <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.35, color: 'var(--text)' }}>
        {(data.label as string) || 'Task'}
      </span>
    </div>
  );
}

function DecisionNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  return (
    <div style={{ width: 76, height: 76, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 58, height: 58, background: 'var(--bg)',
        border: `2px solid ${selected ? 'var(--primary)' : '#f59e0b'}`,
        transform: 'rotate(45deg)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }} />
      <span style={{ position: 'absolute', fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.2, maxWidth: 52, color: 'var(--text)' }}>
        {(data.label as string) || '?'}
      </span>
      <Handle type="target" position={Position.Left} style={{ left: 2, background: '#f59e0b', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ right: 2, background: '#f59e0b', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ bottom: 2, background: '#ef4444', width: 8, height: 8 }} />
    </div>
  );
}

const NODE_TYPES: NodeTypes = {
  laneNode: LaneNode,
  startNode: StartNode,
  endNode: EndNode,
  taskNode: TaskNode,
  decisionNode: DecisionNode,
};

// ─── Node height lookup (for centering in lane) ───────────────

const NODE_H: Record<MapActivityType, number> = { start: 44, end: 44, task: 54, decision: 76 };

// ─── Map list ─────────────────────────────────────────────────

export function ProcessMapPanel({ projectId }: { projectId: string }) {
  const [maps, setMaps] = useState<ProcessMap[]>([]);
  const [openMapId, setOpenMapId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    db.processMaps.where('projectId').equals(projectId).toArray().then(rows => {
      const sorted = rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setMaps(sorted);
      if (sorted.length > 0) setOpenMapId(sorted[0].id);
    });
  }, [projectId]);

  async function createMap() {
    if (!newTitle.trim()) return;
    const rec: ProcessMap = { id: newId('pm'), projectId, title: newTitle.trim(), createdAt: now(), updatedAt: now() };
    await db.processMaps.add(rec);
    // Seed with 2 default lanes
    const lane1: MapLane = { id: newId('ml'), projectId, mapId: rec.id, label: 'Actor 1', order: 0 };
    const lane2: MapLane = { id: newId('ml'), projectId, mapId: rec.id, label: 'Actor 2', order: 1 };
    await db.mapLanes.bulkAdd([lane1, lane2]);
    // Seed with start + end node in lane 1
    const startAct: MapActivity = { id: newId('ma'), projectId, mapId: rec.id, laneId: lane1.id, type: 'start', label: 'Start', note: '', x: 60, y: 0 * LANE_HEIGHT + (LANE_HEIGHT - 44) / 2 };
    const endAct: MapActivity = { id: newId('ma'), projectId, mapId: rec.id, laneId: lane1.id, type: 'end', label: 'End', note: '', x: 400, y: 0 * LANE_HEIGHT + (LANE_HEIGHT - 44) / 2 };
    await db.mapActivities.bulkAdd([startAct, endAct]);
    setMaps(prev => [...prev, rec]);
    setNewTitle('');
    setCreating(false);
    setOpenMapId(rec.id);
  }

  async function deleteMap(id: string) {
    await db.processMaps.delete(id);
    await db.mapLanes.where('mapId').equals(id).delete();
    await db.mapActivities.where('mapId').equals(id).delete();
    await db.mapEdges.where('mapId').equals(id).delete();
    setMaps(prev => prev.filter(m => m.id !== id));
    if (openMapId === id) setOpenMapId(null);
  }

  if (openMapId) {
    const map = maps.find(m => m.id === openMapId);
    if (!map) { setOpenMapId(null); return null; }
    return (
      <ReactFlowProvider>
        <MapEditor
          map={map}
          projectId={projectId}
          onBack={() => setOpenMapId(null)}
        />
      </ReactFlowProvider>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Model activities, decisions and handoffs in a swimlane diagram.
        </p>
        <button className="btn btn-sm btn-ghost" onClick={() => setCreating(c => !c)}>
          <Plus size={13} /> New map
        </button>
      </div>

      {creating && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Map title (e.g. Cloud resource approval)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') createMap(); if (e.key === 'Escape') setCreating(false); }}
          />
          <button className="btn btn-primary btn-sm" onClick={createMap} disabled={!newTitle.trim()}>Create</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </div>
      )}

      {maps.length === 0 && !creating && (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-title">No process maps yet</div>
          <div className="empty-state-desc">Create a map to model activities, decisions and handoffs in swimlanes.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {maps.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <button
              onClick={() => setOpenMapId(m.id)}
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
            >
              {m.title}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{new Date(m.updatedAt).toLocaleDateString()}</span>
            <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px' }} onClick={() => deleteMap(m.id)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Map editor ───────────────────────────────────────────────

type AddForm = { type: MapActivityType; laneId: string; label: string };

function MapEditor({ map, projectId, onBack }: { map: ProcessMap; projectId: string; onBack: () => void }) {
  const [lanes, setLanes] = useState<MapLane[]>([]);
  const [activities, setActivities] = useState<MapActivity[]>([]);
  const [domainEdges, setDomainEdges] = useState<ProcessMapEdge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [newLaneLabel, setNewLaneLabel] = useState('');
  const [addingLane, setAddingLane] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([
      db.mapLanes.where('mapId').equals(map.id).toArray(),
      db.mapActivities.where('mapId').equals(map.id).toArray(),
      db.mapEdges.where('mapId').equals(map.id).toArray(),
    ]).then(([ls, as, es]) => {
      const sortedLanes = ls.sort((a, b) => a.order - b.order);
      setLanes(sortedLanes);
      setActivities(as);
      setDomainEdges(es);
    });
  }, [map.id]);

  // Build React Flow nodes whenever lanes or activities change
  const rfNodes = useMemo<Node[]>(() => {
    const laneNodes: Node[] = lanes.map((lane, idx) => ({
      id: `lane-${lane.id}`,
      type: 'laneNode',
      position: { x: 0, y: idx * LANE_HEIGHT },
      data: { label: lane.label, color: LANE_COLORS[idx % LANE_COLORS.length] },
      style: { width: CANVAS_W, height: LANE_HEIGHT },
      selectable: false,
      draggable: false,
      zIndex: -1,
    }));

    const activityNodes: Node[] = activities.map(act => {
      const laneOrder = lanes.findIndex(l => l.id === act.laneId);
      const laneY = (laneOrder >= 0 ? laneOrder : 0) * LANE_HEIGHT;
      return {
        id: act.id,
        type: `${act.type}Node`,
        position: { x: act.x, y: act.y ?? laneY + (LANE_HEIGHT - NODE_H[act.type]) / 2 },
        data: { label: act.label, note: act.note, laneId: act.laneId, actType: act.type },
        zIndex: 1,
      };
    });

    return [...laneNodes, ...activityNodes];
  }, [lanes, activities]);

  const rfEdges = useMemo<Edge[]>(() =>
    domainEdges.map(e => ({
      id: e.id,
      source: e.fromId,
      target: e.toId,
      label: e.label || undefined,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    })),
    [domainEdges]
  );

  useEffect(() => { setNodes(rfNodes); }, [rfNodes, setNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges, setEdges]);

  // Save position on drag stop
  const onNodeDragStop = useCallback((_: unknown, node: Node) => {
    if (node.type === 'laneNode') return;
    const newLaneOrder = Math.max(0, Math.min(lanes.length - 1, Math.floor(node.position.y / LANE_HEIGHT)));
    const newLane = lanes[newLaneOrder];
    const laneId = newLane ? newLane.id : (node.data.laneId as string);
    db.mapActivities.update(node.id, { x: node.position.x, y: node.position.y, laneId });
    setActivities(prev => prev.map(a => a.id === node.id ? { ...a, x: node.position.x, y: node.position.y, laneId } : a));
  }, [lanes]);

  // Save new edges
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const edge: ProcessMapEdge = { id: newId('mpe'), projectId, mapId: map.id, fromId: connection.source, toId: connection.target, label: '' };
    db.mapEdges.add(edge);
    setDomainEdges(prev => [...prev, edge]);
    setEdges(prev => addEdge({ ...connection, id: edge.id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, prev));
  }, [projectId, map.id, setEdges]);

  // Delete selected
  async function deleteSelected() {
    if (!selectedNodeId) return;
    // Could be activity or edge — check both
    const isActivity = activities.some(a => a.id === selectedNodeId);
    if (isActivity) {
      await db.mapActivities.delete(selectedNodeId);
      await db.mapEdges.where('mapId').equals(map.id).filter(e => e.fromId === selectedNodeId || e.toId === selectedNodeId).delete();
      setActivities(prev => prev.filter(a => a.id !== selectedNodeId));
      setDomainEdges(prev => prev.filter(e => e.fromId !== selectedNodeId && e.toId !== selectedNodeId));
    } else {
      // It's an edge id
      await db.mapEdges.delete(selectedNodeId);
      setDomainEdges(prev => prev.filter(e => e.id !== selectedNodeId));
    }
    setSelectedNodeId(null);
  }

  // Add activity
  async function addActivity() {
    if (!addForm || !addForm.label.trim()) return;
    const laneOrder = lanes.findIndex(l => l.id === addForm.laneId);
    const laneY = (laneOrder >= 0 ? laneOrder : 0) * LANE_HEIGHT;
    const countInLane = activities.filter(a => a.laneId === addForm.laneId).length;
    const nodeH = NODE_H[addForm.type];
    const rec: MapActivity = {
      id: newId('ma'), projectId, mapId: map.id,
      laneId: addForm.laneId, type: addForm.type,
      label: addForm.label.trim(), note: '',
      x: 60 + countInLane * 190,
      y: laneY + (LANE_HEIGHT - nodeH) / 2,
    };
    await db.mapActivities.add(rec);
    setActivities(prev => [...prev, rec]);
    setAddForm(null);
  }

  // Add lane
  async function addLane() {
    if (!newLaneLabel.trim()) return;
    const rec: MapLane = { id: newId('ml'), projectId, mapId: map.id, label: newLaneLabel.trim(), order: lanes.length };
    await db.mapLanes.add(rec);
    setLanes(prev => [...prev, rec]);
    setNewLaneLabel('');
    setAddingLane(false);
  }

  // Update label of selected node
  async function saveLabel() {
    if (!selectedNodeId || !editLabel.trim()) return;
    await db.mapActivities.update(selectedNodeId, { label: editLabel.trim() });
    setActivities(prev => prev.map(a => a.id === selectedNodeId ? { ...a, label: editLabel.trim() } : a));
  }

  const selectedActivity = selectedNodeId ? activities.find(a => a.id === selectedNodeId) : null;
  const canvasH = Math.max(400, lanes.length * LANE_HEIGHT + 60);

  const TYPE_OPTS: { type: MapActivityType; icon: React.ReactNode; label: string }[] = [
    { type: 'start',    icon: <Circle size={13} style={{ color: '#10b981' }} />, label: 'Start' },
    { type: 'task',     icon: <Square size={13} style={{ color: 'var(--primary)' }} />, label: 'Task' },
    { type: 'decision', icon: <Diamond size={13} style={{ color: '#f59e0b' }} />, label: 'Decision' },
    { type: 'end',      icon: <Flag size={13} style={{ color: '#ef4444' }} />, label: 'End' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>
          <ChevronLeft size={14} /> All maps
        </button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{map.title}</span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, alignItems: 'center' }}>
        {/* Add node types */}
        {TYPE_OPTS.map(opt => (
          <button
            key={opt.type}
            className="btn btn-sm btn-ghost"
            onClick={() => setAddForm({ type: opt.type, laneId: lanes[0]?.id ?? '', label: opt.type === 'task' ? 'Task' : opt.type === 'decision' ? 'Decision?' : opt.label })}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
        <button className="btn btn-sm btn-ghost" onClick={() => setAddingLane(a => !a)}>
          <Plus size={13} /> Lane
        </button>
        {selectedNodeId && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }} onClick={deleteSelected}>
              <Trash2 size={13} /> Delete
            </button>
          </>
        )}
      </div>

      {/* Add activity inline form */}
      {addForm && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 10px', background: 'var(--primary-soft)', border: '1px solid var(--primary)', borderRadius: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Add {addForm.type}</span>
          <input
            className="input input-sm"
            style={{ width: 200 }}
            placeholder="Label"
            value={addForm.label}
            onChange={e => setAddForm(f => f ? { ...f, label: e.target.value } : null)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') addActivity(); if (e.key === 'Escape') setAddForm(null); }}
          />
          <select
            className="input input-sm"
            style={{ width: 160 }}
            value={addForm.laneId}
            onChange={e => setAddForm(f => f ? { ...f, laneId: e.target.value } : null)}
          >
            {lanes.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="btn btn-sm btn-primary" onClick={addActivity} disabled={!addForm.label.trim()}>Add</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAddForm(null)}>Cancel</button>
        </div>
      )}

      {/* Add lane inline form */}
      {addingLane && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, alignItems: 'center' }}>
          <input
            className="input input-sm"
            style={{ width: 220 }}
            placeholder="Lane label (actor or role)"
            value={newLaneLabel}
            onChange={e => setNewLaneLabel(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') addLane(); if (e.key === 'Escape') setAddingLane(false); }}
          />
          <button className="btn btn-sm btn-primary" onClick={addLane} disabled={!newLaneLabel.trim()}>Add lane</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAddingLane(false)}>Cancel</button>
        </div>
      )}

      {/* Properties panel for selected node */}
      {selectedActivity && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Edit:</span>
          <input
            className="input input-sm"
            style={{ width: 220 }}
            defaultValue={selectedActivity.label}
            onKeyDown={e => { if (e.key === 'Enter') saveLabel(); }}
            onChange={e => setEditLabel(e.target.value)}
            onFocus={() => setEditLabel(selectedActivity.label)}
          />
          <button className="btn btn-sm btn-ghost" onClick={saveLabel}>Save label</button>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 4 }}>
            Lane: {lanes.find(l => l.id === selectedActivity.laneId)?.label ?? '—'} · Type: {selectedActivity.type}
          </span>
        </div>
      )}

      {/* React Flow canvas */}
      <div style={{ height: canvasH, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_e, node) => {
            if (node.type === 'laneNode') return;
            setSelectedNodeId(node.id);
            setEditLabel(node.data.label as string);
          }}
          onEdgeClick={(_e, edge) => setSelectedNodeId(edge.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={NODE_TYPES}
          fitView
          minZoom={0.3}
          maxZoom={2}
          deleteKeyCode={null}
        >
          <Background gap={16} size={1} color="var(--border)" />
          <Controls />
          <MiniMap zoomable pannable />
          <Panel position="top-right">
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: 'var(--text-muted)' }}>
              Drag to move · Connect handles to link · Click to select
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
