// Pure BPMN XML generator — takes a resolved derivation input and returns
// standards-compliant BPMN 2.0 XML with BPMNDI diagram interchange data.
// No bpmn-js modeler is used; bpmn-moddle is used only for XML serialization.
// Diagram coordinates are computed analytically; no layout engine is required
// for the sequential lane subset this module supports.

export interface BpmnActivity {
  id: string;        // stable semantic ID, e.g. "Task_receive_request"
  name: string;
  laneId: string;
  sourceStepIds: string[];  // journey step IDs that map to this activity
  disposition: 'mapped' | 'annotation';
}

export interface BpmnLane {
  id: string;
  name: string;
}

export interface BpmnGeneratorInput {
  processId: string;
  processName: string;
  participantName: string;
  lanes: BpmnLane[];
  activities: BpmnActivity[];  // ordered; sequential flow only
  sourceJourneyId: string;
  sourceRevisionId: string;
  converterVersion: string;
  unresolved: string[];  // questions for BPMN Studio
}

export interface BpmnGeneratorResult {
  xml: string;
  elementIds: Record<string, string>;  // activity id → BPMN element id
  warnings: string[];
}

// ─── Layout constants ───
const LANE_HEADER_W = 30;
const LANE_H = 120;
const START_X = 100;
const TASK_W = 120;
const TASK_H = 60;
const H_GAP = 40;    // between tasks
const V_PADDING = 30; // top/bottom inside lane
const PARTICIPANT_HEADER_W = 30;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, '_');
}

export function groupActivitiesByName(activities: BpmnActivity[]): BpmnActivity[] {
  // AT-16: Multiple steps may share one activity name → merge sourceStepIds.
  // Order is determined by first occurrence.
  const seen = new Map<string, BpmnActivity>();
  for (const act of activities) {
    const key = act.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (existing) {
      seen.set(key, { ...existing, sourceStepIds: [...existing.sourceStepIds, ...act.sourceStepIds] });
    } else {
      seen.set(key, { ...act });
    }
  }
  return [...seen.values()];
}

export function generateBpmnXml(input: BpmnGeneratorInput): BpmnGeneratorResult {
  const warnings: string[] = [...input.unresolved];
  const elementIds: Record<string, string> = {};
  // Apply many-to-many grouping before layout
  const inputWithGrouped: BpmnGeneratorInput = { ...input, activities: groupActivitiesByName(input.activities) };

  const { activities } = inputWithGrouped;
  const laneCount = Math.max(inputWithGrouped.lanes.length, 1);
  const participantW =
    PARTICIPANT_HEADER_W + LANE_HEADER_W + START_X + (TASK_W + H_GAP) * (activities.length + 1) + H_GAP;
  const participantH = laneCount * LANE_H;

  // ─── Assign lane index for Y offsets ───
  const laneIndex: Record<string, number> = {};
  inputWithGrouped.lanes.forEach((l, i) => { laneIndex[l.id] = i; });

  // ─── Build node positions ───
  interface NodePos { x: number; y: number; w: number; h: number; laneI: number }
  const startId = `StartEvent_${sanitizeId(inputWithGrouped.processId)}`;
  const endId   = `EndEvent_${sanitizeId(inputWithGrouped.processId)}`;

  const startLaneI = activities.length > 0 ? laneIndex[activities[0].laneId] ?? 0 : 0;
  const endLaneI   = activities.length > 0 ? laneIndex[activities[activities.length - 1].laneId] ?? 0 : 0;

  const nodePos: Record<string, NodePos> = {};

  nodePos[startId] = {
    x: PARTICIPANT_HEADER_W + LANE_HEADER_W + 60,
    y: startLaneI * LANE_H + (LANE_H - 36) / 2,
    w: 36, h: 36, laneI: startLaneI,
  };

  activities.forEach((act, i) => {
    const laneI = laneIndex[act.laneId] ?? 0;
    const x = PARTICIPANT_HEADER_W + LANE_HEADER_W + START_X + (TASK_W + H_GAP) * (i + 1);
    nodePos[act.id] = {
      x,
      y: laneI * LANE_H + V_PADDING,
      w: TASK_W, h: TASK_H, laneI,
    };
    elementIds[act.id] = act.id;
  });

  nodePos[endId] = {
    x: PARTICIPANT_HEADER_W + LANE_HEADER_W + START_X + (TASK_W + H_GAP) * (activities.length + 1),
    y: endLaneI * LANE_H + (LANE_H - 28) / 2,
    w: 28, h: 28, laneI: endLaneI,
  };

  // ─── Sequence IDs ───
  const allNodes = [startId, ...activities.map(a => a.id), endId];
  const flows: { id: string; src: string; tgt: string }[] = [];
  for (let i = 0; i < allNodes.length - 1; i++) {
    flows.push({ id: `Flow_${i + 1}_${sanitizeId(input.processId)}`, src: allNodes[i], tgt: allNodes[i + 1] });
  }

  // ─── Lane flowNodeRef membership ───
  const laneRefs: Record<string, string[]> = {};
  inputWithGrouped.lanes.forEach(l => { laneRefs[l.id] = []; });
  if (inputWithGrouped.lanes.length > 0) {
    laneRefs[inputWithGrouped.lanes[startLaneI]?.id ?? inputWithGrouped.lanes[0].id].push(startId);
    activities.forEach(act => {
      const lid = act.laneId;
      if (laneRefs[lid]) laneRefs[lid].push(act.id);
    });
    laneRefs[inputWithGrouped.lanes[endLaneI]?.id ?? inputWithGrouped.lanes[0].id].push(endId);
  }

  // ─── Build XML ───
  const participantId = `Participant_${sanitizeId(inputWithGrouped.processId)}`;
  const processElId   = `Process_${sanitizeId(inputWithGrouped.processId)}`;

  const laneSetXml = inputWithGrouped.lanes.length > 0 ? `
    <bpmn:laneSet id="LaneSet_${sanitizeId(inputWithGrouped.processId)}">
${inputWithGrouped.lanes.map(l => `      <bpmn:lane id="${sanitizeId(l.id)}" name="${escapeXml(l.name)}">
${(laneRefs[l.id] ?? []).map(ref => `        <bpmn:flowNodeRef>${ref}</bpmn:flowNodeRef>`).join('\n')}
      </bpmn:lane>`).join('\n')}
    </bpmn:laneSet>` : '';

  const tasksXml = activities.map(act =>
    `    <bpmn:task id="${act.id}" name="${escapeXml(act.name)}"/>`
  ).join('\n');

  const flowsXml = flows.map(f =>
    `    <bpmn:sequenceFlow id="${f.id}" sourceRef="${f.src}" targetRef="${f.tgt}"/>`
  ).join('\n');

  const annotationXml = inputWithGrouped.unresolved.length > 0 ? `
    <bpmn:textAnnotation id="Annotation_handoff_${sanitizeId(inputWithGrouped.processId)}">
      <bpmn:text>Handoff notes for BPMN Studio:\n${inputWithGrouped.unresolved.map((u, i) => `${i + 1}. ${u}`).join('\n')}</bpmn:text>
    </bpmn:textAnnotation>
    <bpmn:association id="Assoc_handoff_${sanitizeId(inputWithGrouped.processId)}" sourceRef="Annotation_handoff_${sanitizeId(inputWithGrouped.processId)}" targetRef="${endId}" associationDirection="None"/>` : '';

  // ─── DI shapes ───
  function taskMidY(pos: NodePos) { return pos.y + pos.h / 2; }

  const laneShapes = inputWithGrouped.lanes.length > 0 ? inputWithGrouped.lanes.map((l, i) => {
    const ly = i * LANE_H;
    return `      <bpmndi:BPMNShape id="${sanitizeId(l.id)}_di" bpmnElement="${sanitizeId(l.id)}" isHorizontal="true">
        <dc:Bounds x="${PARTICIPANT_HEADER_W + LANE_HEADER_W}" y="${ly}" width="${participantW - PARTICIPANT_HEADER_W - LANE_HEADER_W}" height="${LANE_H}"/>
        <bpmndi:BPMNLabel/>
      </bpmndi:BPMNShape>`;
  }).join('\n') : '';

  const startPos = nodePos[startId];
  const endPos   = nodePos[endId];

  const startShape = `      <bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">
        <dc:Bounds x="${startPos.x}" y="${startPos.y}" width="${startPos.w}" height="${startPos.h}"/>
        <bpmndi:BPMNLabel/>
      </bpmndi:BPMNShape>`;

  const taskShapes = activities.map(act => {
    const p = nodePos[act.id];
    return `      <bpmndi:BPMNShape id="${act.id}_di" bpmnElement="${act.id}">
        <dc:Bounds x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/>
        <bpmndi:BPMNLabel/>
      </bpmndi:BPMNShape>`;
  }).join('\n');

  const endShape = `      <bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}" biocIsExpanded="true">
        <dc:Bounds x="${endPos.x}" y="${endPos.y}" width="${endPos.w}" height="${endPos.h}"/>
        <bpmndi:BPMNLabel/>
      </bpmndi:BPMNShape>`;

  const flowEdges = flows.map(f => {
    const src = nodePos[f.src];
    const tgt = nodePos[f.tgt];
    if (!src || !tgt) return '';
    const midSrcY = taskMidY(src);
    const midTgtY = taskMidY(tgt);
    // Straight horizontal when same lane; dog-leg when different lanes.
    // Intermediate x is the midpoint between source right edge and target left edge
    // so the final segment always enters the target from the left (never backwards).
    const midX = Math.round(src.x + src.w + (tgt.x - src.x - src.w) / 2);
    const waypoints = midSrcY === midTgtY
      ? `<di:waypoint x="${src.x + src.w}" y="${midSrcY}"/>
            <di:waypoint x="${tgt.x}" y="${midTgtY}"/>`
      : `<di:waypoint x="${src.x + src.w}" y="${midSrcY}"/>
            <di:waypoint x="${midX}" y="${midSrcY}"/>
            <di:waypoint x="${midX}" y="${midTgtY}"/>
            <di:waypoint x="${tgt.x}" y="${midTgtY}"/>`;
    return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
            ${waypoints}
      </bpmndi:BPMNEdge>`;
  }).join('\n');

  const participantShape = `      <bpmndi:BPMNShape id="${participantId}_di" bpmnElement="${participantId}" isHorizontal="true">
        <dc:Bounds x="0" y="0" width="${participantW}" height="${participantH}"/>
        <bpmndi:BPMNLabel/>
      </bpmndi:BPMNShape>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by Process Insight. Open in BPMN Studio to continue editing. -->
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_${sanitizeId(inputWithGrouped.processId)}"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Process Insight"
                  exporterVersion="${escapeXml(inputWithGrouped.converterVersion)}">
  <bpmn:collaboration id="Collaboration_${sanitizeId(inputWithGrouped.processId)}">
    <bpmn:participant id="${participantId}" name="${escapeXml(inputWithGrouped.participantName)}" processRef="${processElId}"/>
  </bpmn:collaboration>
  <bpmn:process id="${processElId}" name="${escapeXml(inputWithGrouped.processName)}" isExecutable="false">${laneSetXml}
    <bpmn:startEvent id="${startId}" name="Start">
      <bpmn:outgoing>${flows[0]?.id ?? ''}</bpmn:outgoing>
    </bpmn:startEvent>
${tasksXml}
    <bpmn:endEvent id="${endId}" name="End">
      <bpmn:incoming>${flows[flows.length - 1]?.id ?? ''}</bpmn:incoming>
    </bpmn:endEvent>
${flowsXml}${annotationXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_${sanitizeId(input.processId)}">
${participantShape}
${laneShapes}
${startShape}
${taskShapes}
${endShape}
${flowEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return { xml, elementIds, warnings };
}

// ─── Trace manifest ───

export interface TraceManifest {
  exportedAt: string;
  converterVersion: string;
  sourceJourneyId: string;
  sourceRevisionId: string;
  processName: string;
  mappings: {
    journeyStepIds: string[];
    bpmnElementId: string;
    activityName: string;
    disposition: 'mapped' | 'annotation' | 'excluded';
    rationale: string;
    assumptions: string[];
  }[];
  exclusions: { stepId: string; rationale: string }[];
  unresolved: string[];
  supportedSubset: string;
}

// ─── Non-linear behavior detection (AT-17, AT-18) ───

export type NonLinearKind = 'decision' | 'parallel' | 'rework' | 'external';

export interface NonLinearWarning {
  kind: NonLinearKind;
  stepTitle: string;
  message: string;
  hint: string;
}

const DECISION_PATTERNS = [
  /\bif\b/i, /\bwhen\b/i, /\bapproved?\b/i, /\brejected?\b/i, /\bdenied?\b/i,
  /\balternative\b/i, /\botherwise\b/i, /\bvalid(ate)?\b/i, /\binvalid\b/i,
  /\bsuccess\b/i, /\bfail(ure|ed)?\b/i, /\bdecide?s?\b/i, /\breview\b/i,
];
const PARALLEL_PATTERNS = [
  /\bsimultaneous(ly)?\b/i, /\bin parallel\b/i, /\bconcurrent(ly)?\b/i,
  /\bmeanwhile\b/i, /\bat the same time\b/i, /\bindependently\b/i,
];
const REWORK_PATTERNS = [
  /\bresubmit\b/i, /\bretry\b/i, /\bresend\b/i, /\bcorrect(ion)?\b/i,
  /\btry again\b/i, /\brepeat\b/i, /\brework\b/i, /\brevise?\b/i,
  /\bclarif(y|ication)\b/i, /\bloop\b/i,
];
const EXTERNAL_PATTERNS = [
  /\bnotif(y|ication)\b/i, /\bsend(s)?\b/i, /\breceive?s?\b/i,
  /\bcustomer\b/i, /\bpartner\b/i, /\bvendor\b/i, /\bexternal\b/i,
  /\bthird.party\b/i, /\bsupplier\b/i,
];

export function detectNonLinearPatterns(stepTitles: string[]): NonLinearWarning[] {
  const warnings: NonLinearWarning[] = [];
  for (const title of stepTitles) {
    if (DECISION_PATTERNS.some(p => p.test(title))) {
      warnings.push({
        kind: 'decision', stepTitle: title,
        message: `"${title}" suggests a conditional path (approval, validation or alternative outcome).`,
        hint: 'Add a handoff note describing the conditions. Model decision gateways in BPMN Studio.',
      });
    } else if (PARALLEL_PATTERNS.some(p => p.test(title))) {
      warnings.push({
        kind: 'parallel', stepTitle: title,
        message: `"${title}" suggests work that may run concurrently.`,
        hint: 'Note the parallel behavior. Add an AND-split/join gateway in BPMN Studio.',
      });
    } else if (REWORK_PATTERNS.some(p => p.test(title))) {
      warnings.push({
        kind: 'rework', stepTitle: title,
        message: `"${title}" suggests a rework or retry loop.`,
        hint: 'Note the loop condition. Model it as a looping task or compensation in BPMN Studio.',
      });
    } else if (EXTERNAL_PATTERNS.some(p => p.test(title))) {
      warnings.push({
        kind: 'external', stepTitle: title,
        message: `"${title}" may involve an external actor or cross-boundary interaction.`,
        hint: 'Keep external interactions in handoff notes. Model message flows in BPMN Studio.',
      });
    }
  }
  return warnings;
}

export function buildTraceManifest(
  input: BpmnGeneratorInput,
  _result: BpmnGeneratorResult,
  exclusions: { stepId: string; rationale: string }[]
): TraceManifest {
  return {
    exportedAt: new Date().toISOString(),
    converterVersion: input.converterVersion,
    sourceJourneyId: input.sourceJourneyId,
    sourceRevisionId: input.sourceRevisionId,
    processName: input.processName,
    mappings: input.activities.map(act => ({
      journeyStepIds: act.sourceStepIds,
      bpmnElementId: act.id,
      activityName: act.name,
      disposition: act.disposition,
      rationale: '',
      assumptions: [],
    })),
    exclusions,
    unresolved: input.unresolved,
    supportedSubset:
      'Sequential tasks, start/end events, role lanes, annotations. ' +
      'Non-linear behavior, decisions, parallel work and cross-pool messaging require BPMN Studio.',
  };
}
