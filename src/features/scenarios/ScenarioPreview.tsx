import type { ProcessDefinition, JourneyStage, JourneyStep, MapLane, MapActivity, ProcessMapEdge } from '../../domain/contracts/types';
import type { ScenarioBundle } from './it01SaasOnboarding';

const W = 240;
const H = 140;
const PAD = 6;
const TOP = 13;

// ── Landscape ──────────────────────────────────────────────────────────────────

const ZONE_ORDER = ['management', 'core-group', 'core', 'support'] as const;
type Zone = typeof ZONE_ORDER[number];

const ZONE_FILL: Record<Zone, string> = {
  management: '#2563eb',
  'core-group': '#16a34a',
  core: '#86efac',
  support: '#fef08a',
};
const ZONE_TEXT: Record<Zone, string> = {
  management: '#fff',
  'core-group': '#fff',
  core: '#1f2937',
  support: '#1f2937',
};
const ZONE_LABEL: Record<Zone, string> = {
  management: 'Mgmt',
  'core-group': 'Core Grp',
  core: 'Core',
  support: 'Support',
};

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function LandscapeThumb({ processes }: { processes: ProcessDefinition[] }) {
  const zones = ZONE_ORDER
    .map(z => ({ z, items: processes.filter(p => p.levelLabel === z) }))
    .filter(g => g.items.length > 0);

  if (zones.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
        <rect width={W} height={H} fill="#f9fafb" rx={6} />
        <text x={W / 2} y={H / 2} fontSize={8} fill="#9ca3af" textAnchor="middle" dominantBaseline="middle">No process data</text>
      </svg>
    );
  }

  const usableH = H - TOP - PAD;
  const zoneH = usableH / zones.length;
  const LABEL_W = 44;
  const BOX_GAP = 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      <rect width={W} height={H} fill="#f4f6f9" rx={6} />
      <text x={PAD} y={10} fontSize={6.5} fill="#6b7280" fontWeight={700} letterSpacing="0.04em">PROCESS LANDSCAPE</text>

      {zones.map(({ z, items }, i) => {
        const y = TOP + i * zoneH;
        const fill = ZONE_FILL[z];
        const tc = ZONE_TEXT[z];
        const label = ZONE_LABEL[z];
        const boxArea = W - PAD - LABEL_W - 4;
        const maxBoxes = Math.floor(boxArea / (60 + BOX_GAP));
        const displayItems = items.slice(0, Math.max(1, maxBoxes));
        const boxW = Math.min(80, Math.floor((boxArea - BOX_GAP * (displayItems.length - 1)) / displayItems.length));

        return (
          <g key={z}>
            {/* Zone band bg */}
            <rect x={PAD} y={y + 1} width={W - PAD * 2} height={zoneH - 2} rx={3}
              fill={fill} opacity={0.1} />
            {/* Zone label pill */}
            <rect x={PAD} y={y + 1} width={LABEL_W} height={zoneH - 2} rx={3}
              fill={fill} opacity={z === 'management' || z === 'core-group' ? 0.88 : 0.75} />
            <text x={PAD + LABEL_W / 2} y={y + zoneH / 2 + 0.5} fontSize={6} fill={tc}
              textAnchor="middle" dominantBaseline="middle" fontWeight={700}>{label}</text>

            {/* Process boxes */}
            {displayItems.map((p, j) => {
              const bx = PAD + LABEL_W + 4 + j * (boxW + BOX_GAP);
              return (
                <g key={p.id}>
                  <rect x={bx} y={y + 2} width={boxW} height={zoneH - 4} rx={2}
                    fill="#fff" opacity={0.9} stroke="#d1d5db" strokeWidth={0.5} />
                  <text x={bx + boxW / 2} y={y + zoneH / 2 + 0.5} fontSize={5}
                    fill="#374151" textAnchor="middle" dominantBaseline="middle">
                    {truncate(p.title, Math.floor(boxW / 3.6))}
                  </text>
                </g>
              );
            })}
            {items.length > maxBoxes && (
              <text x={W - PAD - 1} y={y + zoneH / 2 + 0.5} fontSize={5} fill="#9ca3af"
                textAnchor="end" dominantBaseline="middle">+{items.length - maxBoxes}</text>
            )}
          </g>
        );
      })}

      <text x={W - PAD} y={H - 2} fontSize={5.5} fill="#9ca3af" textAnchor="end">Identify workspace</text>
    </svg>
  );
}

// ── Journey ────────────────────────────────────────────────────────────────────

const STEP_COLORS = ['#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fbbf24'];

export function JourneyThumb({ stages, steps }: { stages: JourneyStage[]; steps: JourneyStep[] }) {
  const sorted = [...stages].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
        <rect width={W} height={H} fill="#f9fafb" rx={6} />
        <text x={W / 2} y={H / 2} fontSize={8} fill="#9ca3af" textAnchor="middle" dominantBaseline="middle">No journey data</text>
      </svg>
    );
  }

  const HEADER_H = 16;
  const colW = (W - PAD * 2) / sorted.length;
  const DOT_R = 3.5;
  const DOT_GAP = 9;
  const contentTop = TOP + HEADER_H + 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      <rect width={W} height={H} fill="#f4f6f9" rx={6} />
      <text x={PAD} y={10} fontSize={6.5} fill="#6b7280" fontWeight={700} letterSpacing="0.04em">JOURNEY MAP</text>

      {sorted.map((stage, i) => {
        const x = PAD + i * colW;
        const color = STEP_COLORS[i % STEP_COLORS.length];
        const stageSteps = steps.filter(s => s.stageId === stage.id).sort((a, b) => a.order - b.order);

        return (
          <g key={stage.id}>
            {/* Stage header */}
            <rect x={x + 1} y={TOP} width={colW - 2} height={HEADER_H} rx={2}
              fill={color} opacity={0.75} />
            <text x={x + colW / 2} y={TOP + HEADER_H / 2 + 0.5} fontSize={5} fill="#fff"
              textAnchor="middle" dominantBaseline="middle" fontWeight={600}>
              {truncate(stage.title, Math.floor(colW / 3.3))}
            </text>

            {/* Step dots */}
            {stageSteps.map((step, j) => {
              const cy = contentTop + j * DOT_GAP + DOT_R;
              if (cy + DOT_R > H - 8) return null;
              return (
                <g key={step.id}>
                  <circle cx={x + colW / 2} cy={cy} r={DOT_R} fill={color} opacity={0.6} />
                </g>
              );
            })}

            {/* Step count label */}
            {stageSteps.length > 0 && (
              <text x={x + colW / 2} y={H - 5} fontSize={5} fill="#9ca3af"
                textAnchor="middle">{stageSteps.length}</text>
            )}
          </g>
        );
      })}

      {/* Column dividers */}
      {sorted.map((_, i) => i > 0 && (
        <line key={i} x1={PAD + i * colW} y1={TOP} x2={PAD + i * colW} y2={H - 8}
          stroke="#e5e7eb" strokeWidth={0.5} />
      ))}

      <text x={W - PAD} y={H - 2} fontSize={5.5} fill="#9ca3af" textAnchor="end">Journey workspace</text>
    </svg>
  );
}

// ── Map ────────────────────────────────────────────────────────────────────────

const LANE_FILLS = ['#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#f3f4f6'];

export function MapThumb({ lanes, activities, edges }: {
  lanes: MapLane[];
  activities: MapActivity[];
  edges: ProcessMapEdge[];
}) {
  const sortedLanes = [...lanes].sort((a, b) => a.order - b.order);

  if (sortedLanes.length === 0 || activities.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
        <rect width={W} height={H} fill="#f9fafb" rx={6} />
        <text x={W / 2} y={H / 2} fontSize={8} fill="#9ca3af" textAnchor="middle" dominantBaseline="middle">No map data</text>
      </svg>
    );
  }

  const LABEL_W = 42;
  const usableW = W - PAD - LABEL_W - 4;
  const usableH = H - TOP - PAD;
  const laneH = usableH / sortedLanes.length;

  const xs = activities.map(a => a.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const xRange = maxX - minX || 1;

  const svgX = (x: number) => PAD + LABEL_W + 4 + ((x - minX) / xRange) * usableW;

  const laneIndexMap = new Map(sortedLanes.map((l, i) => [l.id, i]));
  const svgY = (a: MapActivity) => {
    const idx = laneIndexMap.get(a.laneId) ?? 0;
    return TOP + idx * laneH + laneH / 2;
  };

  const posMap = new Map(activities.map(a => [a.id, { x: svgX(a.x), y: svgY(a) }]));

  const TASK_W = 30;
  const TASK_H = Math.min(10, laneH - 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      <rect width={W} height={H} fill="#f4f6f9" rx={6} />
      <text x={PAD} y={10} fontSize={6.5} fill="#6b7280" fontWeight={700} letterSpacing="0.04em">PROCESS MAP</text>

      {/* Lane bands */}
      {sortedLanes.map((lane, i) => (
        <g key={lane.id}>
          <rect x={PAD} y={TOP + i * laneH} width={W - PAD * 2} height={laneH - 0.5}
            fill={LANE_FILLS[i % LANE_FILLS.length]} opacity={0.8}
            stroke="#d1d5db" strokeWidth={0.5} />
          <text x={PAD + LABEL_W / 2} y={TOP + i * laneH + laneH / 2 + 0.5}
            fontSize={5.5} fill="#374151" textAnchor="middle" dominantBaseline="middle" fontWeight={600}>
            {truncate(lane.label, 8)}
          </text>
        </g>
      ))}

      {/* Edges (draw behind activities) */}
      {edges.map((e, idx) => {
        const from = posMap.get(e.fromId);
        const to = posMap.get(e.toId);
        if (!from || !to) return null;
        return (
          <line key={idx} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="#94a3b8" strokeWidth={0.8} opacity={0.6} />
        );
      })}

      {/* Activities */}
      {activities.map(a => {
        const cx = svgX(a.x);
        const cy = svgY(a);

        if (a.type === 'start') {
          return <circle key={a.id} cx={cx} cy={cy} r={4.5} fill="#374151" />;
        }
        if (a.type === 'end') {
          return (
            <g key={a.id}>
              <circle cx={cx} cy={cy} r={4.5} fill="#374151" />
              <circle cx={cx} cy={cy} r={2.5} fill="#f4f6f9" />
            </g>
          );
        }
        if (a.type === 'decision') {
          const s = 7;
          return (
            <polygon key={a.id}
              points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
              fill="#fde68a" stroke="#d97706" strokeWidth={0.5} />
          );
        }
        // task
        return (
          <g key={a.id}>
            <rect x={cx - TASK_W / 2} y={cy - TASK_H / 2} width={TASK_W} height={TASK_H} rx={2}
              fill="#bfdbfe" stroke="#93c5fd" strokeWidth={0.5} />
            <text x={cx} y={cy + 0.5} fontSize={4.5} fill="#1e3a5f"
              textAnchor="middle" dominantBaseline="middle">
              {truncate(a.label, Math.floor(TASK_W / 2.8))}
            </text>
          </g>
        );
      })}

      <text x={W - PAD} y={H - 2} fontSize={5.5} fill="#9ca3af" textAnchor="end">Map workspace</text>
    </svg>
  );
}

// ── Composed thumb from bundle ─────────────────────────────────────────────────

export type PreviewType = 'landscape' | 'journey' | 'map';

export const PREVIEW_LABELS: Record<PreviewType, string> = {
  landscape: 'Process Landscape',
  journey: 'Journey Map',
  map: 'Process Map',
};

export function ScenarioThumb({ type, bundle }: { type: PreviewType; bundle: ScenarioBundle | null }) {
  if (!bundle) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
        <rect width={W} height={H} fill="#f4f6f9" rx={6} />
        <text x={W / 2} y={H / 2} fontSize={8} fill="#9ca3af" textAnchor="middle" dominantBaseline="middle">Loading…</text>
      </svg>
    );
  }

  if (type === 'landscape') {
    return <LandscapeThumb processes={bundle.processes} />;
  }

  if (type === 'journey') {
    const firstJourney = bundle.journeys[0];
    const stages = firstJourney ? bundle.stages.filter(s => s.journeyId === firstJourney.id) : bundle.stages;
    const steps = firstJourney ? bundle.steps.filter(s => s.journeyId === firstJourney.id) : bundle.steps;
    return <JourneyThumb stages={stages} steps={steps} />;
  }

  // map
  const firstMap = bundle.processMaps?.[0];
  const lanes = firstMap ? (bundle.mapLanes ?? []).filter(l => l.mapId === firstMap.id) : (bundle.mapLanes ?? []);
  const activities = firstMap ? (bundle.mapActivities ?? []).filter(a => a.mapId === firstMap.id) : (bundle.mapActivities ?? []);
  const edges = firstMap ? (bundle.mapEdges ?? []).filter(e => e.mapId === firstMap.id) : (bundle.mapEdges ?? []);
  return <MapThumb lanes={lanes} activities={activities} edges={edges} />;
}
