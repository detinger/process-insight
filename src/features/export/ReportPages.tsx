// Sections of the standalone HTML documentation, built from the project data.
// The landscape and journey canvas reuse the app's own components.

import type { ReactNode } from 'react';
import { ProcessLandscapeView } from '../identify/ProcessLandscapeView';
import { JourneyCanvas } from '../journey/JourneyCanvas';
import { computeScore, DEFAULT_SCORING_CONFIG } from '../../domain/scoring';
import type { ReportData, SectionId } from './reportData';
import type { MapActivity, MapActivityType } from '../../domain/contracts/types';


const INK = '#1a2433';
const MUTED = '#5b6676';
const LINE = '#d7dde5';
const HEAD_BG = '#eef2f7';
const NOOP = async () => {};

// ─── Layout primitives ───────────────────────────────────────

interface PageMeta { title: string; section: string }

function Page({ meta, no, children }: { meta: PageMeta; no: number; children: ReactNode }) {
  return (
    <section className="rp-section" id={`s${no}`}>
      <div className="rp-eyebrow">{meta.section}</div>
      <h2>{meta.title}</h2>
      <div className="rp-body">{children}</div>
    </section>
  );
}

/** Wide visuals keep their natural size and scroll sideways instead of shrinking. */
function FitBox({ children }: { children: ReactNode }) {
  return <div className="rp-scroll"><div style={{ width: 'max-content' }}>{children}</div></div>;
}

function Table({ head, rows, widths }: { head: string[]; rows: ReactNode[][]; widths?: (string | number)[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: widths ? 'fixed' : 'auto' }}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={i} style={{ textAlign: 'left', padding: '6px 8px', background: HEAD_BG, border: `1px solid ${LINE}`, fontWeight: 650, width: widths?.[i] }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((c, ci) => (
              <td key={ci} style={{ padding: '5px 8px', border: `1px solid ${LINE}`, verticalAlign: 'top' }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A flowing document needs no page breaks; kept as a single chunk per list. */
function paginate<T>(items: T[], _weight?: (t: T) => number, _budget?: number): T[][] {
  return items.length ? [items] : [];
}

const lines = (text: string, perLine: number) => Math.max(1, Math.ceil((text || '').length / perLine));
const dash = (t?: string) => (t && t.trim() ? t : '—');

function Pill({ children, color = MUTED }: { children: ReactNode; color?: string }) {
  return <span style={{ border: `1px solid ${color}`, color, borderRadius: 10, padding: '0 7px', fontSize: 11, whiteSpace: 'nowrap' }}>{children}</span>;
}

// ─── Page builders ───────────────────────────────────────────

interface Built { meta: PageMeta; node: ReactNode }

function buildPages(d: ReportData, sections: Set<SectionId>): Built[] {
  const out: Built[] = [];
  const unitName = new Map(d.units.map(u => [u.id, u.name]));

  // Cover
  out.push({
    meta: { section: 'Documentation', title: d.manifest.title },
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ fontSize: 15, color: MUTED, margin: 0, maxWidth: 760 }}>{d.manifest.description || 'Process documentation generated from the project workspace.'}</p>
        <div style={{ fontSize: 12, color: MUTED }}>Generated {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 820 }}>
          {([
            ['Processes', d.processes.length], ['Journeys', d.journeys.length],
            ['Interviews', d.interviews.length], ['Observations', d.observations.length],
            ['Contradictions', d.contradictions.length], ['SIPOC diagrams', d.sipocDiagrams.length],
            ['Process maps', d.processMaps.length], ['Personas', d.personas.length],
          ] as [string, number][]).map(([l, n]) => (
            <div key={l} style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  if (sections.has('landscape') && d.processes.length > 0) {
    out.push({
      meta: { section: 'Identify', title: 'Process landscape' },
      node: (
        <FitBox>
          <div style={{ width: 1100 }}>
            <ProcessLandscapeView
              processes={d.processes} projectId={d.manifest.id}
              onAdd={async () => d.processes[0]} onUpdate={NOOP} onDelete={NOOP} onSelect={() => {}}
            />
          </div>
        </FitBox>
      ),
    });
  }

  if (sections.has('register') && d.processes.length > 0) {
    const procs = [...d.processes].sort((a, b) => a.levelLabel.localeCompare(b.levelLabel) || a.title.localeCompare(b.title));
    const weight = (p: typeof procs[number]) => 18 + 16 * Math.max(lines(p.purpose, 48), lines(p.trigger, 24), lines(p.outcome, 24), lines(p.title, 22));
    paginate(procs, weight).forEach((chunk, i, all) => out.push({
      meta: { section: 'Identify', title: `Process register${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
      node: (
        <Table
          head={['Process', 'Level', 'Status', 'Owner', 'Purpose', 'Trigger', 'Outcome']}
          widths={['16%', '8%', '7%', '11%', '30%', '14%', '14%']}
          rows={chunk.map(p => [
            <strong>{p.title}</strong>, p.levelLabel, p.status,
            dash(p.ownerRoleId ? unitName.get(p.ownerRoleId) : ''),
            dash(p.purpose), dash(p.trigger), dash(p.outcome),
          ])}
        />
      ),
    }));
  }

  if (sections.has('coverage') && d.processes.length > 0) {
    const procs = [...d.processes].sort((a, b) => a.title.localeCompare(b.title));
    const matrix = (title: string, cols: { id: string; name: string }[], get: (p: typeof procs[number]) => string[]) => {
      if (cols.length === 0) return;
      paginate(procs, () => 26).forEach((chunk, i, all) => out.push({
        meta: { section: 'Identify', title: `Coverage: ${title}${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: (
          <FitBox>
            <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', background: HEAD_BG, border: `1px solid ${LINE}`, minWidth: 220 }}>Process</th>
                  {cols.map(c => (
                    <th key={c.id} style={{ padding: '6px 6px', background: HEAD_BG, border: `1px solid ${LINE}`, width: 100, fontSize: 11, verticalAlign: 'bottom' }}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chunk.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '4px 8px', border: `1px solid ${LINE}` }}>{p.title}</td>
                    {cols.map(c => (
                      <td key={c.id} style={{ textAlign: 'center', border: `1px solid ${LINE}`, color: '#15803d', fontWeight: 700 }}>
                        {get(p).includes(c.id) ? '✓' : <span style={{ color: LINE }}>·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '4px 8px', border: `1px solid ${LINE}`, fontStyle: 'italic', color: MUTED }}>Coverage (of {procs.length} processes)</td>
                  {cols.map(c => {
                    const n = procs.filter(p => get(p).includes(c.id)).length;
                    return <td key={c.id} style={{ textAlign: 'center', border: `1px solid ${LINE}`, fontWeight: 650 }}>{Math.round((n / procs.length) * 100)}%</td>;
                  })}
                </tr>
              </tfoot>
            </table>
          </FitBox>
        ),
      }));
    };
    matrix('services', d.services, p => p.serviceIds);
    matrix('capabilities', d.capabilities, p => p.capabilityIds);
  }

  if (sections.has('scoring') && d.processes.length > 0) {
    const cfg = DEFAULT_SCORING_CONFIG;
    const ratings = new Map(d.processRatings.filter(r => r.configId === cfg.id).map(r => [r.processId, r]));
    const scored = d.processes.map(p => {
      const r = ratings.get(p.id);
      return { p, r: r?.ratings ?? {}, score: r ? computeScore(r.ratings, cfg.criteria) : null };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.p.title.localeCompare(b.p.title));
    paginate(scored, () => 28).forEach((chunk, i, all) => out.push({
      meta: { section: 'Identify', title: `Priority scoring${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
      node: (
        <Table
          head={['#', 'Process', ...cfg.criteria.map(c => `${c.label} (${Math.round(c.weight * 100)}%)`), 'Score']}
          rows={chunk.map(s => [
            scored.indexOf(s) + 1,
            s.p.title,
            ...cfg.criteria.map(c => s.r[c.id] ?? '—'),
            <strong>{s.score === null ? '—' : s.score.toFixed(0)}</strong>,
          ])}
        />
      ),
    }));
  }

  if (sections.has('discover')) {
    if (d.interviews.length > 0) {
      const items = (id: string) => d.interviewItems.filter(x => x.interviewId === id);
      const w = (iv: typeof d.interviews[number]) =>
        44 + 16 * lines(iv.notes, 120) + items(iv.id).reduce((s, it) => s + 16 * lines(it.text, 115), 0);
      paginate(d.interviews, w).forEach((chunk, i, all) => out.push({
        meta: { section: 'Discover', title: `Interviews${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chunk.map(iv => (
              <div key={iv.id} style={{ border: `1px solid ${LINE}`, borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontWeight: 650 }}>{iv.interviewee} <span style={{ fontWeight: 400, color: MUTED }}>· {iv.role}{iv.date ? ` · ${iv.date}` : ''}</span></div>
                {iv.notes && <div style={{ color: MUTED, fontSize: 12 }}>{iv.notes}</div>}
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12 }}>
                  {items(iv.id).map(it => (
                    <li key={it.id}><strong style={{ textTransform: 'capitalize' }}>{it.type}:</strong> {it.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ),
      }));
    }
    if (d.observations.length > 0) {
      const obs = [...d.observations].sort((a, b) => a.sequence - b.sequence);
      paginate(obs, o => 20 + 16 * lines(o.description, 90)).forEach((chunk, i, all) => out.push({
        meta: { section: 'Discover', title: `Observation timeline${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: <Table head={['#', 'Type', 'Actor', 'Observation']} widths={['5%', '12%', '18%', '65%']}
          rows={chunk.map(o => [o.sequence, o.type, dash(o.actor), o.description])} />,
      }));
    }
    if (d.stormingCards.length > 0) {
      const cards = [...d.stormingCards].sort((a, b) => a.sequence - b.sequence);
      const colors: Record<string, string> = { event: '#fdba74', command: '#93c5fd', actor: '#fde68a', policy: '#d8b4fe' };
      out.push({
        meta: { section: 'Discover', title: 'Event storming board' },
        node: (
          <FitBox>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: 1000 }}>
              {cards.map(c => (
                <div key={c.id} style={{ width: 150, minHeight: 60, background: colors[c.type] ?? '#eee', padding: 8, fontSize: 12, borderRadius: 3 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, opacity: 0.7 }}>{c.type}</div>
                  {c.text}
                </div>
              ))}
            </div>
          </FitBox>
        ),
      });
    }
    if (d.contradictions.length > 0) {
      paginate(d.contradictions, c => 28 + 16 * Math.max(lines(c.claimA, 42), lines(c.claimB, 42), lines(c.resolution, 24))).forEach((chunk, i, all) => out.push({
        meta: { section: 'Discover', title: `Contradictions${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: <Table head={['Topic', 'Source A claims', 'Source B claims', 'Status', 'Resolution']} widths={['14%', '27%', '27%', '8%', '24%']}
          rows={chunk.map(c => [<strong>{c.topic}</strong>, <><em>{c.sourceA}:</em> {c.claimA}</>, <><em>{c.sourceB}:</em> {c.claimB}</>, c.status, dash(c.resolution)])} />,
      }));
    }
  }

  if (sections.has('journeys')) {
    for (const j of d.journeys) {
      const stages = d.stages.filter(s => s.journeyId === j.id).sort((a, b) => a.order - b.order);
      const stageOrder = new Map(stages.map(s => [s.id, s.order]));
      const steps = d.steps.filter(s => s.journeyId === j.id)
        .sort((a, b) => (stageOrder.get(a.stageId) ?? 0) - (stageOrder.get(b.stageId) ?? 0) || a.order - b.order);
      const rows = d.rows.filter(r => r.journeyId === j.id).sort((a, b) => a.order - b.order);
      const cells = d.cells.filter(c => c.journeyId === j.id);
      const cellIds = new Set(cells.map(c => c.id));
      const cards = d.cards.filter(c => cellIds.has(c.cellId));
      const personas = d.personas.filter(p => j.personaIds.includes(p.id));
      out.push({
        meta: { section: 'Journey', title: `${j.title} (${j.state === 'as-is' ? 'AS-IS' : 'TO-BE'})` },
        node: (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: MUTED }}>
              <strong>Perspective:</strong> {j.perspective}
              {personas.length > 0 && <> · <strong>Personas:</strong> {personas.map(p => p.name).join(', ')}</>}
              {j.goal && <> · <strong>Goal:</strong> {j.goal}</>}
              {j.situation && <> · <strong>Situation:</strong> {j.situation}</>}
            </div>
            <FitBox>
              <JourneyCanvas
                fullSize stages={stages} steps={steps} rows={rows} cells={cells} cards={cards}
                painPoints={d.painPoints} personas={d.personas} touchpoints={d.touchpoints}
              />
            </FitBox>
          </div>
        ),
      });
      const jPain = d.painPoints.filter(p => p.affectedStepIds.some(id => steps.some(s => s.id === id)));
      if (jPain.length > 0) {
        paginate(jPain, p => 24 + 16 * Math.max(lines(p.description, 60), lines(p.scopeEstimate, 20))).forEach((chunk, i, all) => out.push({
          meta: { section: 'Journey', title: `${j.title}: pain points${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
          node: <Table head={['Pain point', 'Severity', 'State', 'Description', 'Scope']} widths={['20%', '9%', '9%', '42%', '20%']}
            rows={chunk.map(p => [<strong>{p.title}</strong>, p.severity, p.state, p.description, dash(p.scopeEstimate)])} />,
        }));
      }
    }
  }

  if (sections.has('sipoc')) {
    const cols: { key: 'supplier' | 'input' | 'step' | 'output' | 'customer'; label: string; color: string }[] = [
      { key: 'supplier', label: 'Suppliers', color: '#dbeafe' }, { key: 'input', label: 'Inputs', color: '#fce7f3' },
      { key: 'step', label: 'Process', color: '#d1fae5' }, { key: 'output', label: 'Outputs', color: '#fef3c7' },
      { key: 'customer', label: 'Customers', color: '#ede9fe' },
    ];
    for (const dg of d.sipocDiagrams) {
      const rows = d.sipocRows.filter(r => r.diagramId === dg.id).sort((a, b) => a.order - b.order);
      paginate(rows, r => 14 + 17 * Math.max(...cols.map(c => lines(r[c.key], 28)))).forEach((chunk, i, all) => out.push({
        meta: { section: 'SIPOC', title: `${dg.title}${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: (
          <div>
            {dg.processRef && <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>Process: {dg.processRef}</div>}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 12 }}>
              <thead>
                <tr>{cols.map(c => <th key={c.key} style={{ background: c.color, border: `1px solid ${LINE}`, padding: '8px', textAlign: 'left' }}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {chunk.map(r => (
                  <tr key={r.id}>{cols.map(c => <td key={c.key} style={{ border: `1px solid ${LINE}`, padding: '6px 8px', verticalAlign: 'top' }}>{r[c.key] || ''}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      }));
    }
  }

  if (sections.has('maps')) {
    for (const m of d.processMaps) {
      const lanes = d.mapLanes.filter(l => l.mapId === m.id).sort((a, b) => a.order - b.order);
      if (lanes.length === 0) continue;
      out.push({
        meta: { section: 'Process map', title: m.title },
        node: (
          <FitBox>
            <MapSvg
              lanes={lanes}
              activities={d.mapActivities.filter(a => a.mapId === m.id)}
              edges={d.mapEdges.filter(e => e.mapId === m.id)}
            />
          </FitBox>
        ),
      });
    }
  }

  if (sections.has('dictionary')) {
    const chName = new Map(d.channels.map(c => [c.id, c.name]));
    const sysName = new Map(d.systems.map(s => [s.id, s.name]));
    const persName = new Map(d.personas.map(s => [s.id, s.name]));
    if (d.personas.length > 0) {
      paginate(d.personas, p => 24 + 16 * Math.max(lines(p.goals.join('; '), 40), lines(p.needs.join('; '), 40))).forEach((chunk, i, all) => out.push({
        meta: { section: 'Dictionary', title: `Personas${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: <Table head={['Persona', 'Role', 'Goals', 'Needs', 'Constraints']} widths={['15%', '15%', '25%', '25%', '20%']}
          rows={chunk.map(p => [<strong>{p.name}</strong>, dash(p.role), dash(p.goals.join('; ')), dash(p.needs.join('; ')), dash(p.constraints.join('; '))])} />,
      }));
    }
    if (d.systems.length > 0) {
      paginate(d.systems, () => 28).forEach((chunk, i, all) => out.push({
        meta: { section: 'Dictionary', title: `IT systems${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: <Table head={['System', 'Type', 'Criticality', 'Supporting role']}
          rows={chunk.map(s => [<strong>{s.name}</strong>, dash(s.type), s.criticality, dash(s.supportingRole)])} />,
      }));
    }
    if (d.touchpoints.length > 0 || d.channels.length > 0) {
      paginate(d.touchpoints, t => 24 + 16 * Math.max(lines(t.purpose, 50), 1)).forEach((chunk, i, all) => out.push({
        meta: { section: 'Dictionary', title: `Channels & touchpoints${all.length > 1 ? ` (${i + 1}/${all.length})` : ''}` },
        node: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {i === 0 && d.channels.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {d.channels.map(c => <Pill key={c.id}>{c.name} · {c.type}</Pill>)}
              </div>
            )}
            <Table head={['Touchpoint', 'Purpose', 'Channel', 'Systems', 'Recipients']} widths={['18%', '32%', '12%', '19%', '19%']}
              rows={chunk.map(t => [<strong>{t.name}</strong>, dash(t.purpose), dash(chName.get(t.channelId)),
                dash(t.systemIds.map(id => sysName.get(id)).filter(Boolean).join(', ')),
                dash(t.recipientPersonaIds.map(id => persName.get(id)).filter(Boolean).join(', '))])} />
          </div>
        ),
      }));
    }
  }

  return out;
}

// ─── Process map (static SVG) ────────────────────────────────

const LANE_H = 170;
const LANE_COLORS = ['#eff6ff', '#f0fdf4', '#fefce8', '#fdf2f8', '#f5f3ff', '#fff7ed'];
const NODE: Record<MapActivityType, { w: number; h: number }> = {
  start: { w: 44, h: 44 }, end: { w: 44, h: 44 }, task: { w: 150, h: 54 }, decision: { w: 76, h: 76 },
};

function wrap(text: string, max: number): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const res: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) res.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) res.push(cur);
  return res.slice(0, 3);
}

function MapSvg({ lanes, activities, edges }: {
  lanes: { id: string; label: string }[]; activities: MapActivity[];
  edges: { id: string; fromId: string; toId: string; label: string }[];
}) {
  const maxX = Math.max(600, ...activities.map(a => a.x + NODE[a.type].w + 60));
  const W = maxX + 40, H = lanes.length * LANE_H;
  const laneIdx = new Map(lanes.map((l, i) => [l.id, i]));
  const pos = new Map(activities.map(a => {
    const n = NODE[a.type];
    const y = a.y ?? (laneIdx.get(a.laneId) ?? 0) * LANE_H + (LANE_H - n.h) / 2;
    return [a.id, { a, x: a.x, y, w: n.w, h: n.h }];
  }));
  return (
    <svg width={W} height={H} style={{ background: '#fff', border: `1px solid ${LINE}`, fontFamily: 'inherit' }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
        </marker>
      </defs>
      {lanes.map((l, i) => (
        <g key={l.id}>
          <rect x={0} y={i * LANE_H} width={W} height={LANE_H} fill={LANE_COLORS[i % LANE_COLORS.length]} stroke="#e2e8f0" />
          <text x={10} y={i * LANE_H + 20} fontSize={11} fontWeight={700} fill="#475569" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.label}</text>
        </g>
      ))}
      {edges.map(e => {
        const f = pos.get(e.fromId), t = pos.get(e.toId);
        if (!f || !t) return null;
        const x1 = f.x + f.w, y1 = f.y + f.h / 2, x2 = t.x, y2 = t.y + t.h / 2;
        const mx = (x1 + x2) / 2;
        return (
          <g key={e.id}>
            <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="#64748b" strokeWidth={1.5} markerEnd="url(#arrow)" />
            {e.label && <text x={mx} y={(y1 + y2) / 2 - 5} fontSize={10} textAnchor="middle" fill="#475569">{e.label}</text>}
          </g>
        );
      })}
      {[...pos.values()].map(({ a, x, y, w, h }) => {
        const cx = x + w / 2, cy = y + h / 2;
        const label = wrap(a.label, a.type === 'task' ? 22 : 10);
        const text = (size: number, color = INK) => label.map((ln, i) => (
          <text key={i} x={cx} y={cy + (i - (label.length - 1) / 2) * (size + 2) + size / 3} fontSize={size} textAnchor="middle" fill={color}>{ln}</text>
        ));
        if (a.type === 'start') return <g key={a.id}><circle cx={cx} cy={cy} r={22} fill="#10b981" stroke="#059669" strokeWidth={3} />{text(9, '#fff')}</g>;
        if (a.type === 'end') return <g key={a.id}><circle cx={cx} cy={cy} r={20} fill="#fff" stroke="#ef4444" strokeWidth={4} />{text(8)}</g>;
        if (a.type === 'decision') return <g key={a.id}><polygon points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`} fill="#fff" stroke="#f59e0b" strokeWidth={2} />{text(10)}</g>;
        return <g key={a.id}><rect x={x} y={y} width={w} height={h} rx={7} fill="#fff" stroke="#94a3b8" strokeWidth={2} />{text(12)}</g>;
      })}
    </svg>
  );
}

// ─── Document ────────────────────────────────────────────────

export function ReportDocument({ data, sections }: { data: ReportData; sections: Set<SectionId> }) {
  const pages = buildPages(data, sections);
  return (
    <div data-theme="light" style={{ background: '#fff', color: INK }}>
      {pages.map((p, i) => <Page key={i} meta={p.meta} no={i + 1}>{p.node}</Page>)}
    </div>
  );
}

/** Section headings for the table of contents. */
export function reportOutline(data: ReportData, sections: Set<SectionId>): { id: string; section: string; title: string }[] {
  return buildPages(data, sections).map((p, i) => ({ id: `s${i + 1}`, section: p.meta.section, title: p.meta.title }));
}
