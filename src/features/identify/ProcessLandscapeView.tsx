import { useState, useRef, useEffect } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';
import type { ProcessDefinition } from '../../domain/contracts/types';

// ─── Zone types ──────────────────────────────────────────────
export type LandscapeZone = 'management' | 'core-group' | 'core' | 'support';
const ZONE_LABELS: LandscapeZone[] = ['management', 'core-group', 'core', 'support'];

// ─── Colors ──────────────────────────────────────────────────
const MGMT_BG   = '#1e3a5f';
const MGMT_TEXT = '#fff';
const CORE_GROUP_BG   = '#14532d';
const CORE_GROUP_TEXT = '#fff';
const CORE_BG   = '#d1fae5';
const CORE_TEXT = '#065f46';
const CORE_BORDER = '#6ee7b7';
const SUPPORT_BG   = '#fef3c7';
const SUPPORT_TEXT = '#78350f';
const SUPPORT_BORDER = '#fcd34d';
const ZONE_OUTER = '#1e3a5f';

// ─── Props ───────────────────────────────────────────────────
interface Props {
  processes: ProcessDefinition[];
  projectId: string;
  onAdd: (title: string, levelLabel: LandscapeZone, parentId?: string) => Promise<ProcessDefinition>;
  onUpdate: (id: string, patch: Partial<ProcessDefinition>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (proc: ProcessDefinition) => void;
  selectedId?: string | null;
  leftLabel?: string;
  rightLabel?: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function isZone(label: string): label is LandscapeZone {
  return ZONE_LABELS.includes(label as LandscapeZone);
}

function sort(procs: ProcessDefinition[]) {
  return [...procs].sort((a, b) => a.title.localeCompare(b.title));
}

// ─── Main component ──────────────────────────────────────────
export function ProcessLandscapeView({
  processes, projectId: _projectId, onAdd, onUpdate, onDelete, onSelect, selectedId,
  leftLabel = 'Customer Requirements',
  rightLabel = 'Customer Satisfaction',
}: Props) {
  const [zoom, setZoom] = useState(1);

  const mgmtProcs   = sort(processes.filter(p => p.levelLabel === 'management'));
  const coreGroups  = sort(processes.filter(p => p.levelLabel === 'core-group'));
  const coreProcs   = processes.filter(p => p.levelLabel === 'core');
  const supportProcs = sort(processes.filter(p => p.levelLabel === 'support'));
  const uncategorized = processes.filter(p => !isZone(p.levelLabel));

  function childrenOf(groupId: string) {
    return sort(coreProcs.filter(p => p.parentId === groupId));
  }

  async function addManagement() {
    await onAdd(`Management process ${mgmtProcs.length + 1}`, 'management');
  }

  async function addCoreGroup() {
    await onAdd(`Process group ${coreGroups.length + 1}`, 'core-group');
  }

  async function addCoreChild(groupId: string) {
    const siblings = childrenOf(groupId);
    await onAdd(`Step ${siblings.length + 1}`, 'core', groupId);
  }

  async function addSupport() {
    await onAdd(`Support process ${supportProcs.length + 1}`, 'support');
  }

  async function promoteToLandscape(proc: ProcessDefinition, zone: LandscapeZone) {
    await onUpdate(proc.id, { levelLabel: zone });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div data-export-skip style={{
        padding: '6px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elevated)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 650 }}>Process Landscape</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Zoom</span>
        <input type="range" min="50" max="130" value={Math.round(zoom * 100)}
          onChange={e => setZoom(Number(e.target.value) / 100)}
          style={{ width: 80, cursor: 'pointer' }} />
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', width: 32 }}>{Math.round(zoom * 100)}%</span>
        <button className="btn btn-sm btn-ghost" onClick={() => setZoom(1)}>Reset</button>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bg-subtle)' }}>
        <div style={{ transformOrigin: 'top left', transform: `scale(${zoom})`, transition: 'transform 150ms' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>

            {/* Left rail */}
            <div style={{
              width: 36, flexShrink: 0, background: ZONE_OUTER, borderRadius: '8px 0 0 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0',
            }}>
              <span style={{
                writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#fff',
                whiteSpace: 'nowrap',
              }}>{leftLabel}</span>
            </div>

            {/* Main canvas */}
            <div style={{
              flex: 1, background: '#fff', border: `1px solid ${ZONE_OUTER}`,
              borderLeft: 'none', borderRight: 'none',
              display: 'flex', flexDirection: 'column', gap: 0,
            }}>

              {/* Management layer */}
              <ZoneHeader label="Management Processes" />
              <div style={{
                padding: '14px 20px 20px', borderBottom: `2px solid ${ZONE_OUTER}`,
                display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 8,
              }}>
                {mgmtProcs.map((p, i) => (
                  <ChevronBox
                    key={p.id}
                    proc={p}
                    index={i}
                    total={mgmtProcs.length}
                    bg={MGMT_BG}
                    color={MGMT_TEXT}
                    selected={selectedId === p.id}
                    onSelect={() => onSelect(p)}
                    onRename={title => onUpdate(p.id, { title })}
                    onDelete={() => onDelete(p.id)}
                  />
                ))}
                <AddChevronButton onClick={addManagement} bg={MGMT_BG} />
              </div>

              {/* Core processes layer */}
              <ZoneHeader label="Core Processes" />
              <div style={{ padding: '12px 20px 20px', borderBottom: `2px solid ${ZONE_OUTER}` }}>
                {coreGroups.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '8px 0 4px' }}>
                    Add process groups to define your value chain.
                  </div>
                )}
                {coreGroups.map(group => (
                  <SwimlaneRow
                    key={group.id}
                    group={group}
                    children={childrenOf(group.id)}
                    selectedId={selectedId}
                    onSelectGroup={() => onSelect(group)}
                    onSelectChild={onSelect}
                    onRenameGroup={title => onUpdate(group.id, { title })}
                    onDeleteGroup={() => onDelete(group.id)}
                    onAddChild={() => addCoreChild(group.id)}
                    onRenameChild={(id, title) => onUpdate(id, { title })}
                    onDeleteChild={id => onDelete(id)}
                  />
                ))}
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ marginTop: 8, fontSize: 12, borderStyle: 'dashed' }}
                  onClick={addCoreGroup}
                >
                  <Plus size={13} /> Add process group
                </button>
              </div>

              {/* Support layer */}
              <ZoneHeader label="Support Processes" />
              <div style={{
                padding: '14px 20px 20px',
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                {supportProcs.map(p => (
                  <SupportBox
                    key={p.id}
                    proc={p}
                    selected={selectedId === p.id}
                    onSelect={() => onSelect(p)}
                    onRename={title => onUpdate(p.id, { title })}
                    onDelete={() => onDelete(p.id)}
                  />
                ))}
                <AddSupportButton onClick={addSupport} />
              </div>
            </div>

            {/* Right rail */}
            <div style={{
              width: 36, flexShrink: 0, background: ZONE_OUTER, borderRadius: '0 8px 8px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0',
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#fff',
                whiteSpace: 'nowrap',
              }}>{rightLabel}</span>
            </div>
          </div>

          {/* Uncategorized processes */}
          {uncategorized.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block' }} />
                Uncategorized processes — drag or assign to a zone
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {uncategorized.map(p => (
                  <UncategorizedBox
                    key={p.id}
                    proc={p}
                    selected={selectedId === p.id}
                    onSelect={() => onSelect(p)}
                    onPromote={zone => promoteToLandscape(p, zone)}
                    onDelete={() => onDelete(p.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Zone header ─────────────────────────────────────────────
function ZoneHeader({ label }: { label: string }) {
  return (
    <div style={{
      padding: '7px 20px', background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      fontSize: 12, fontWeight: 700, color: '#475569',
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {label}
    </div>
  );
}

// ─── Chevron box ─────────────────────────────────────────────
function chevronPath(first: boolean, last: boolean, _h: number, tip: number) {
  if (first && last) return `polygon(0% 0%, calc(100% - ${tip}px) 0%, 100% 50%, calc(100% - ${tip}px) 100%, 0% 100%)`;
  if (first)  return `polygon(0% 0%, calc(100% - ${tip}px) 0%, 100% 50%, calc(100% - ${tip}px) 100%, 0% 100%)`;
  if (last)   return `polygon(${tip}px 0%, 100% 0%, 100% 100%, ${tip}px 100%, 0% 50%)`;
  return `polygon(${tip}px 0%, calc(100% - ${tip}px) 0%, 100% 50%, calc(100% - ${tip}px) 100%, ${tip}px 100%, 0% 50%)`;
}

interface ChevronBoxProps {
  proc: ProcessDefinition;
  index: number;
  total: number;
  bg: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function ChevronBox({ proc, index, total, bg, color, selected, onSelect, onRename, onDelete }: ChevronBoxProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(proc.title);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(proc.title); }, [proc.title]);

  const tip = 16;
  const isFirst = index === 0;
  const isLast  = index === total - 1;
  const path = chevronPath(isFirst, isLast, 56, tip);

  async function commit() {
    if (draft.trim() && draft !== proc.title) await onRename(draft.trim());
    setEditing(false);
  }

  return (
    <div
      style={{
        position: 'relative',
        marginLeft: index === 0 ? 0 : -tip + 2,
        zIndex: index,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          clipPath: path,
          background: selected ? `color-mix(in srgb, ${bg} 70%, #fff)` : bg,
          width: 160,
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          paddingLeft: index === 0 ? 12 : 24,
          paddingRight: 24,
          border: selected ? '2px solid var(--accent)' : 'none',
          transition: 'opacity 120ms',
        }}
        onClick={onSelect}
        onDoubleClick={() => setEditing(true)}
        title="Click to select · Double-click to rename"
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(proc.title); setEditing(false); } }}
            onBlur={commit}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color, fontSize: 12, fontWeight: 600, width: '100%', textAlign: 'center',
            }}
          />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'center', lineHeight: 1.3, pointerEvents: 'none' }}>
            {proc.title}
          </span>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute', top: -6, right: 2,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--error)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 120ms',
        }}
        title="Delete"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ─── Add chevron button ───────────────────────────────────────
function AddChevronButton({ onClick, bg }: { onClick: () => void; bg: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginLeft: 12, width: 36, height: 36, borderRadius: '50%',
        background: `color-mix(in srgb, ${bg} 15%, transparent)`,
        border: `2px dashed color-mix(in srgb, ${bg} 40%, transparent)`,
        color: bg, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 120ms',
        flexShrink: 0,
      }}
      title="Add process"
    >
      <Plus size={16} />
    </button>
  );
}

// ─── Swimlane row ─────────────────────────────────────────────
interface SwimlaneProps {
  group: ProcessDefinition;
  children: ProcessDefinition[];
  selectedId?: string | null;
  onSelectGroup: () => void;
  onSelectChild: (p: ProcessDefinition) => void;
  onRenameGroup: (title: string) => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  onAddChild: () => Promise<void>;
  onRenameChild: (id: string, title: string) => Promise<void>;
  onDeleteChild: (id: string) => Promise<void>;
}

function SwimlaneRow({
  group, children, selectedId,
  onSelectGroup, onSelectChild, onRenameGroup, onDeleteGroup,
  onAddChild, onRenameChild, onDeleteChild,
}: SwimlaneProps) {
  const [editingGroup, setEditingGroup] = useState(false);
  const [groupDraft, setGroupDraft] = useState(group.title);
  const [groupHovered, setGroupHovered] = useState(false);

  useEffect(() => { setGroupDraft(group.title); }, [group.title]);

  async function commitGroup() {
    if (groupDraft.trim() && groupDraft !== group.title) await onRenameGroup(groupDraft.trim());
    setEditingGroup(false);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10,
      background: `color-mix(in srgb, ${CORE_BG} 30%, #fff)`,
      borderRadius: 8, border: `1px solid ${CORE_BORDER}`,
      padding: '10px 14px',
    }}>
      {/* Group label (rounded oval on left) */}
      <div
        style={{
          minWidth: 140, width: 140, flexShrink: 0,
          background: selectedId === group.id ? CORE_GROUP_BG : '#fff',
          border: `2px solid ${CORE_GROUP_BG}`,
          borderRadius: 60, padding: '10px 14px',
          cursor: 'pointer', textAlign: 'center', marginRight: 20,
          position: 'relative',
        }}
        onClick={onSelectGroup}
        onDoubleClick={() => setEditingGroup(true)}
        onMouseEnter={() => setGroupHovered(true)}
        onMouseLeave={() => setGroupHovered(false)}
        title="Click to select · Double-click to rename"
      >
        {editingGroup ? (
          <input
            autoFocus
            value={groupDraft}
            onChange={e => setGroupDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitGroup(); if (e.key === 'Escape') { setGroupDraft(group.title); setEditingGroup(false); } }}
            onBlur={commitGroup}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, fontWeight: 700,
              color: selectedId === group.id ? CORE_GROUP_TEXT : CORE_GROUP_BG,
              width: '100%', textAlign: 'center',
            }}
          />
        ) : (
          <span style={{
            fontSize: 12, fontWeight: 700, lineHeight: 1.3,
            color: selectedId === group.id ? CORE_GROUP_TEXT : CORE_GROUP_BG,
          }}>
            {group.title}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDeleteGroup(); }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--error)', color: '#fff',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: groupHovered ? 1 : 0,
            transition: 'opacity 120ms',
          }}
          title="Delete group"
        >
          <X size={10} />
        </button>
      </div>

      {/* Arrow from group to children */}
      {children.length > 0 && (
        <ArrowRight size={16} style={{ color: CORE_GROUP_BG, flexShrink: 0, marginRight: 8 }} />
      )}

      {/* Children chevrons */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 0, rowGap: 8 }}>
        {children.map((child, i) => (
          <ChevronBox
            key={child.id}
            proc={child}
            index={i}
            total={children.length}
            bg={CORE_BG}
            color={CORE_TEXT}
            selected={selectedId === child.id}
            onSelect={() => onSelectChild(child)}
            onRename={title => onRenameChild(child.id, title)}
            onDelete={() => onDeleteChild(child.id)}
          />
        ))}
        <button
          onClick={onAddChild}
          style={{
            marginLeft: children.length === 0 ? 0 : 10,
            width: 30, height: 30, borderRadius: '50%',
            background: `color-mix(in srgb, ${CORE_GROUP_BG} 10%, transparent)`,
            border: `2px dashed ${CORE_BORDER}`,
            color: CORE_GROUP_BG, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          title="Add step to this group"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Support box ─────────────────────────────────────────────
function SupportBox({ proc, selected, onSelect, onRename, onDelete }: {
  proc: ProcessDefinition; selected: boolean;
  onSelect: () => void; onRename: (t: string) => Promise<void>; onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(proc.title);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { setDraft(proc.title); }, [proc.title]);

  async function commit() {
    if (draft.trim() && draft !== proc.title) await onRename(draft.trim());
    setEditing(false);
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 140, minHeight: 64,
        border: `2px solid ${selected ? 'var(--primary)' : SUPPORT_BORDER}`,
        background: selected ? `color-mix(in srgb, var(--primary) 8%, #fff)` : SUPPORT_BG,
        borderRadius: 6, padding: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', textAlign: 'center',
        borderTopColor: SUPPORT_BORDER,
        borderTopWidth: 4,
      }}
      onClick={onSelect}
      onDoubleClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to select · Double-click to rename"
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(proc.title); setEditing(false); } }}
          onBlur={commit}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 12, fontWeight: 500, color: SUPPORT_TEXT,
            width: '100%', textAlign: 'center',
          }}
        />
      ) : (
        <span style={{ fontSize: 12, fontWeight: 500, color: SUPPORT_TEXT, lineHeight: 1.3 }}>
          {proc.title}
        </span>
      )}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute', top: -8, right: -8,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 120ms',
        }}
        title="Delete"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ─── Add support button ───────────────────────────────────────
function AddSupportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 140, minHeight: 64,
        border: `2px dashed ${SUPPORT_BORDER}`,
        background: 'transparent',
        borderRadius: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: SUPPORT_TEXT, gap: 4, fontSize: 12,
        transition: 'all 120ms',
      }}
      title="Add support process"
    >
      <Plus size={14} /> Add
    </button>
  );
}

// ─── Uncategorized box ────────────────────────────────────────
function UncategorizedBox({ proc, selected, onSelect, onPromote, onDelete }: {
  proc: ProcessDefinition; selected: boolean;
  onSelect: () => void;
  onPromote: (zone: LandscapeZone) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          border: `1px solid var(--border)`,
          background: selected ? 'var(--primary-soft)' : 'var(--bg-elevated)',
          borderRadius: 6, padding: '8px 12px',
          cursor: 'pointer', fontSize: 12, color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
        onClick={onSelect}
      >
        <span>{proc.title}</span>
        <button
          className="btn btn-xs btn-ghost"
          style={{ fontSize: 10, padding: '1px 5px' }}
          onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
          title="Assign to zone"
        >
          Assign ▾
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
          title="Delete"
        >
          <X size={12} />
        </button>
      </div>
      {showMenu && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 6, boxShadow: 'var(--shadow-lg)', padding: 4, minWidth: 160,
        }}>
          {(['management', 'core-group', 'support'] as LandscapeZone[]).map(zone => (
            <button
              key={zone}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', fontSize: 12 }}
              onClick={() => { onPromote(zone); setShowMenu(false); }}
            >
              → {zone === 'core-group' ? 'Core process group' : zone === 'management' ? 'Management layer' : 'Support layer'}
            </button>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', fontSize: 12 }}
            onClick={() => setShowMenu(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
