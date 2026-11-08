import type {
  JourneyStage, JourneyStep, JourneyRow, Cell, JourneyCard,
  PainPoint, Persona, Touchpoint, SentimentValue,
} from '../../domain/contracts/types';

const COL_W = 180;
const LABEL_W = 156;
const SENTIMENT_H = 90;
const ROW_MIN_H = 72;

const ROW_COLORS: Partial<Record<string, string>> = {
  'customer-actions':   'var(--info)',
  'thoughts-questions': '#a78bfa',
  'sentiment':          'var(--accent)',
  'touchpoints':        'var(--success)',
  'pain-points':        'var(--error)',
  'opportunities':      '#f59e0b',
  'processes':          'var(--text-muted)',
};

const SEVERITY_COLOR: Record<string, string> = {
  minor: 'var(--info)', moderate: 'var(--warning)',
  significant: 'var(--error)', critical: '#7f1d1d',
};

interface Props {
  stages: JourneyStage[];
  steps: JourneyStep[];
  rows: JourneyRow[];
  cells: Cell[];
  cards: JourneyCard[];
  painPoints: PainPoint[];
  personas: Persona[];
  touchpoints: Touchpoint[];
  /** Render at full natural size without an internal scroll area (used for PDF export). */
  fullSize?: boolean;
}

export function JourneyCanvas({ stages, steps, rows, cells, cards, painPoints, personas: _personas, touchpoints, fullSize }: Props) {
  if (stages.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: 48 }}>
        <div className="empty-state-title">No stages yet</div>
        <div className="empty-state-desc">Add at least one stage and step in the table view to see the canvas.</div>
      </div>
    );
  }

  // Index lookups
  const stepsForStage = new Map<string, JourneyStep[]>();
  for (const st of stages) stepsForStage.set(st.id, []);
  for (const s of steps) {
    const arr = stepsForStage.get(s.stageId);
    if (arr) arr.push(s);
  }

  const orderedSteps: JourneyStep[] = stages.flatMap(st => stepsForStage.get(st.id) ?? []);

  const cellByRowStep = new Map<string, Cell>();
  for (const c of cells) cellByRowStep.set(`${c.rowId}|${c.stepId}`, c);

  const cardsByCell = new Map<string, JourneyCard[]>();
  for (const card of cards) {
    const arr = cardsByCell.get(card.cellId) ?? [];
    arr.push(card);
    cardsByCell.set(card.cellId, arr);
  }

  const touchpointById = new Map(touchpoints.map(t => [t.id, t]));
  const painById = new Map(painPoints.map(p => [p.id, p]));

  const totalW = LABEL_W + orderedSteps.length * COL_W;

  // Sentiment data: one value per ordered step (avg or first)
  const sentimentRow = rows.find(r => r.type === 'sentiment');
  const sentimentByStep = new Map<string, SentimentValue>();
  if (sentimentRow) {
    for (const step of orderedSteps) {
      const cell = cellByRowStep.get(`${sentimentRow.id}|${step.id}`);
      if (!cell) continue;
      const sc = (cardsByCell.get(cell.id) ?? []).find(c => c.payload.kind === 'sentiment');
      if (sc && sc.payload.kind === 'sentiment') sentimentByStep.set(step.id, sc.payload.value);
    }
  }

  return (
    <div style={fullSize
      ? { borderRadius: 8, border: '1px solid var(--border)', width: 'max-content' }
      : { overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ minWidth: totalW, position: 'relative' }}>

        {/* Stage header row */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{
            width: LABEL_W, flexShrink: 0,
            background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 12px',
          }} />
          {stages.map((stage, si) => {
            const stps = stepsForStage.get(stage.id) ?? [];
            return (
              <div key={stage.id} style={{
                width: stps.length * COL_W,
                flexShrink: 0,
                background: STAGE_BGSAFE(si),
                borderBottom: '2px solid var(--border)',
                borderRight: si < stages.length - 1 ? '1px solid var(--border)' : 'none',
                padding: '8px 12px',
                display: 'flex', alignItems: 'center',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: STAGE_ACCENT(si), marginRight: 8,
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stage.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step sub-header row */}
        <div style={{ display: 'flex', position: 'sticky', top: 37, zIndex: 9 }}>
          <div style={{
            width: LABEL_W, flexShrink: 0,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            padding: '6px 12px',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: 'var(--text-subtle)',
            display: 'flex', alignItems: 'center',
          }}>
            Swimlane
          </div>
          {orderedSteps.map((step, si) => (
            <div key={step.id} style={{
              width: COL_W, flexShrink: 0,
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
              borderRight: si < orderedSteps.length - 1 ? '1px solid var(--border)' : 'none',
              padding: '6px 10px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{step.title}</span>
            </div>
          ))}
        </div>

        {/* Swimlane rows */}
        {rows.map((row, ri) => {
          const accent = ROW_COLORS[row.type] ?? 'var(--text-subtle)';
          const isSentiment = row.type === 'sentiment';
          const rowH = isSentiment ? SENTIMENT_H : ROW_MIN_H;

          return (
            <div key={row.id} style={{ display: 'flex', borderBottom: ri < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {/* Row label */}
              <div style={{
                width: LABEL_W, flexShrink: 0,
                borderRight: '1px solid var(--border)',
                padding: '10px 12px',
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'var(--bg-elevated)',
                minHeight: rowH,
              }}>
                <div style={{ width: 3, borderRadius: 2, background: accent, alignSelf: 'stretch', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{row.label}</span>
              </div>

              {/* Sentiment row: emotion curve SVG */}
              {isSentiment ? (
                <div style={{ flex: 1, position: 'relative', height: SENTIMENT_H }}>
                  <SentimentCurve steps={orderedSteps} valueMap={sentimentByStep} colW={COL_W} height={SENTIMENT_H} />
                  {/* Per-step sentiment dots with labels */}
                  {orderedSteps.map((step, si) => {
                    const val = sentimentByStep.get(step.id);
                    if (val == null) return null;
                    const label = val >= 2 ? '😄' : val === 1 ? '🙂' : val === 0 ? '😐' : val === -1 ? '😕' : '😞';
                    const x = si * COL_W + COL_W / 2;
                    const y = sentY(val, SENTIMENT_H);
                    return (
                      <div key={step.id} style={{
                        position: 'absolute', top: y - 10, left: x - 10,
                        fontSize: 16, lineHeight: 1, zIndex: 2,
                        userSelect: 'none',
                      }} title={`${step.title}: ${val}`}>
                        {label}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Normal row: cells */
                orderedSteps.map((step, si) => {
                  const cell = cellByRowStep.get(`${row.id}|${step.id}`);
                  const cellCards = cell ? (cardsByCell.get(cell.id) ?? []) : [];
                  return (
                    <div key={step.id} style={{
                      width: COL_W, flexShrink: 0,
                      borderRight: si < orderedSteps.length - 1 ? '1px solid var(--border)' : 'none',
                      padding: 8,
                      display: 'flex', flexDirection: 'column', gap: 4,
                      minHeight: ROW_MIN_H,
                    }}>
                      {cellCards.map(card => (
                        <CardChip key={card.id} card={card} touchpointById={touchpointById} painById={painById} />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function STAGE_BGSAFE(i: number) {
  const BGSAFE = ['#4f46e508','#06b6d408','#f59e0b08','#10b98108','#8b5cf608'];
  return BGSAFE[i % BGSAFE.length];
}
function STAGE_ACCENT(i: number) {
  const ACCENTS = ['#4f46e5','#06b6d4','#f59e0b','#10b981','#8b5cf6'];
  return ACCENTS[i % ACCENTS.length];
}

function sentY(val: SentimentValue, h: number): number {
  if (val == null) return h / 2;
  const pad = 16;
  return pad + ((2 - val) / 4) * (h - pad * 2);
}

function SentimentCurve({ steps, valueMap, colW, height }: {
  steps: JourneyStep[];
  valueMap: Map<string, SentimentValue>;
  colW: number;
  height: number;
}) {
  const pts = steps
    .map((s, i) => ({ x: i * colW + colW / 2, y: sentY(valueMap.get(s.id) ?? null, height) }))
    .filter(p => p.y !== height / 2 || valueMap.has(steps[Math.floor((p.x - colW / 2) / colW)]?.id ?? ''));

  if (pts.length < 2) {
    return (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1="0" y1={height / 2} x2={steps.length * colW} y2={height / 2}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    );
  }

  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      {/* neutral line */}
      <line x1="0" y1={height / 2} x2={steps.length * colW} y2={height / 2}
        stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
      {/* filled area */}
      <path d={areaD} fill="color-mix(in srgb, var(--accent) 10%, transparent)" />
      {/* curve */}
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function CardChip({ card, touchpointById, painById }: {
  card: JourneyCard;
  touchpointById: Map<string, { name: string }>;
  painById: Map<string, PainPoint>;
}) {
  const p = card.payload;

  if (p.kind === 'text') {
    return (
      <div style={{
        fontSize: 11, lineHeight: 1.4, padding: '4px 6px',
        background: 'var(--bg-subtle)', borderRadius: 4,
        color: 'var(--text)', wordBreak: 'break-word',
      }}>
        {p.text}
      </div>
    );
  }

  if (p.kind === 'touchpoint') {
    const tp = touchpointById.get(p.touchpointId);
    return (
      <div style={{
        fontSize: 11, padding: '3px 7px', borderRadius: 12,
        background: 'color-mix(in srgb, var(--success) 12%, transparent)',
        color: 'var(--success)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        ↗ {tp?.name ?? 'Touchpoint'}
      </div>
    );
  }

  if (p.kind === 'pain-link') {
    const pain = painById.get(p.painPointId);
    const color = pain ? SEVERITY_COLOR[pain.severity] : 'var(--error)';
    return (
      <div style={{
        fontSize: 11, padding: '3px 7px', borderRadius: 4,
        background: 'color-mix(in srgb, var(--error) 10%, transparent)',
        color, fontWeight: 600, wordBreak: 'break-word',
        borderLeft: `3px solid ${color}`,
      }}>
        ⚡ {pain?.title ?? 'Pain point'}
      </div>
    );
  }

  if (p.kind === 'process-link') {
    return (
      <div style={{
        fontSize: 11, padding: '3px 7px', borderRadius: 4,
        background: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
        color: 'var(--text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        ⚙ Process
      </div>
    );
  }

  if (p.kind === 'sentiment') {
    return null; // rendered by emotion curve
  }

  return (
    <div style={{ fontSize: 10, color: 'var(--text-subtle)', padding: '2px 4px' }}>
      {p.kind}
    </div>
  );
}
