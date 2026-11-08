/**
 * Lightweight BPMN XML validator for generated drafts.
 * Parses with DOMParser — no extra dependencies.
 *
 * Rules checked:
 *   - XML is well-formed
 *   - Each process has at least one start event
 *   - Each process has at least one end event
 *   - No element has both zero incoming AND zero outgoing flows (fully isolated)
 *   - Non-start elements with zero incoming flows (dangling source)
 *   - Non-end elements with zero outgoing flows (dangling sink)
 *   - Exclusive/inclusive gateways with multiple outgoing flows: at least one must be labeled or a default
 */
import { SEVERITY_ORDER, type ValidationIssue, type ValidationReport } from './types';

const BPMN_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL';

let _issueCounter = 0;
function makeId(ruleId: string) {
  return `${ruleId}-${++_issueCounter}`;
}

type El = Element;

function getByTag(parent: El | Document, local: string): El[] {
  return Array.from(parent.getElementsByTagNameNS(BPMN_NS, local));
}

function attr(el: El, name: string) {
  return el.getAttribute(name) ?? '';
}

function label(el: El) {
  const name = attr(el, 'name');
  return name ? `"${name}"` : `element ${attr(el, 'id') || '(unknown)'}`;
}

export function validateBpmnXml(xml: string): ValidationReport {
  _issueCounter = 0;
  const issues: ValidationIssue[] = [];

  // ── Parse ──────────────────────────────────────────────────────────────────
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      issues.push({
        id: makeId('xml-parse'),
        ruleId: 'xml-parse',
        severity: 'error',
        layer: 'structure',
        elementIds: [],
        title: 'File is not valid XML',
        explanation: parseError.textContent?.slice(0, 200) ?? 'The document could not be parsed as XML.',
        suggestion: 'Re-export the BPMN from the modeler or check for encoding issues.',
      });
      return finalize(issues);
    }
  } catch (err) {
    issues.push({
      id: makeId('xml-parse'),
      ruleId: 'xml-parse',
      severity: 'error',
      layer: 'structure',
      elementIds: [],
      title: 'File is not valid XML',
      explanation: err instanceof Error ? err.message : String(err),
      suggestion: 'Re-export the BPMN from the modeler.',
    });
    return finalize(issues);
  }

  const processes = getByTag(doc, 'process');
  if (processes.length === 0) {
    issues.push({
      id: makeId('no-process'),
      ruleId: 'no-process',
      severity: 'error',
      layer: 'structure',
      elementIds: [],
      title: 'No process found',
      explanation: 'The BPMN file contains no process element.',
      suggestion: 'Ensure the file was exported from a BPMN modeler with at least one process.',
    });
    return finalize(issues);
  }

  for (const process of processes) {
    const pid = attr(process, 'id');

    // Build incoming/outgoing maps from sequence flows
    const incomingMap = new Map<string, string[]>();
    const outgoingMap = new Map<string, string[]>();
    for (const flow of getByTag(process, 'sequenceFlow')) {
      const src = attr(flow, 'sourceRef');
      const tgt = attr(flow, 'targetRef');
      if (src) {
        if (!outgoingMap.has(src)) outgoingMap.set(src, []);
        outgoingMap.get(src)!.push(attr(flow, 'id'));
      }
      if (tgt) {
        if (!incomingMap.has(tgt)) incomingMap.set(tgt, []);
        incomingMap.get(tgt)!.push(attr(flow, 'id'));
      }
    }

    // Build default flow map for gateways
    const defaultFlows = new Set<string>();
    for (const gw of [...getByTag(process, 'exclusiveGateway'), ...getByTag(process, 'inclusiveGateway')]) {
      const def = attr(gw, 'default');
      if (def) defaultFlows.add(def);
    }

    // ── Start events ─────────────────────────────────────────────────────────
    const startEvents = getByTag(process, 'startEvent');
    if (startEvents.length === 0) {
      issues.push({
        id: makeId('no-start-event'),
        ruleId: 'no-start-event',
        severity: 'error',
        layer: 'structure',
        elementIds: [pid],
        title: 'Process has no start event',
        explanation: 'Every process must have at least one start event that triggers execution.',
        suggestion: 'Add a start event and connect it to the first task.',
      });
    }

    // ── End events ────────────────────────────────────────────────────────────
    const endEvents = getByTag(process, 'endEvent');
    if (endEvents.length === 0) {
      issues.push({
        id: makeId('no-end-event'),
        ruleId: 'no-end-event',
        severity: 'error',
        layer: 'structure',
        elementIds: [pid],
        title: 'Process has no end event',
        explanation: 'Every process must have at least one end event that marks process completion.',
        suggestion: 'Add an end event at the end of each path.',
      });
    }

    // ── Flow connectivity ────────────────────────────────────────────────────
    const startIds = new Set(startEvents.map(e => attr(e, 'id')));
    const endIds = new Set(endEvents.map(e => attr(e, 'id')));

    const flowElements = [
      ...getByTag(process, 'task'),
      ...getByTag(process, 'userTask'),
      ...getByTag(process, 'serviceTask'),
      ...getByTag(process, 'manualTask'),
      ...getByTag(process, 'scriptTask'),
      ...getByTag(process, 'sendTask'),
      ...getByTag(process, 'receiveTask'),
      ...getByTag(process, 'businessRuleTask'),
      ...getByTag(process, 'callActivity'),
      ...getByTag(process, 'subProcess'),
      ...getByTag(process, 'exclusiveGateway'),
      ...getByTag(process, 'inclusiveGateway'),
      ...getByTag(process, 'parallelGateway'),
      ...getByTag(process, 'eventBasedGateway'),
      ...startEvents,
      ...endEvents,
      ...getByTag(process, 'intermediateCatchEvent'),
      ...getByTag(process, 'intermediateThrowEvent'),
    ];

    for (const el of flowElements) {
      const eid = attr(el, 'id');
      const isStart = startIds.has(eid);
      const isEnd = endIds.has(eid);
      const hasIncoming = (incomingMap.get(eid)?.length ?? 0) > 0;
      const hasOutgoing = (outgoingMap.get(eid)?.length ?? 0) > 0;

      if (!isStart && !hasIncoming && !isEnd) {
        issues.push({
          id: makeId('dangling-no-incoming'),
          ruleId: 'dangling-no-incoming',
          severity: 'warning',
          layer: 'control-flow',
          elementIds: [eid],
          title: 'Element has no incoming flow',
          explanation: `${label(el)} is not a start event but has no incoming sequence flow.`,
          suggestion: 'Connect a sequence flow from the preceding element, or remove this element.',
        });
      }

      if (!isEnd && !hasOutgoing && !isStart) {
        issues.push({
          id: makeId('dangling-no-outgoing'),
          ruleId: 'dangling-no-outgoing',
          severity: 'warning',
          layer: 'control-flow',
          elementIds: [eid],
          title: 'Element has no outgoing flow',
          explanation: `${label(el)} is not an end event but has no outgoing sequence flow.`,
          suggestion: 'Connect a sequence flow to the next element, or add an end event.',
        });
      }
    }

    // ── Gateway labeling ─────────────────────────────────────────────────────
    for (const gw of [...getByTag(process, 'exclusiveGateway'), ...getByTag(process, 'inclusiveGateway')]) {
      const eid = attr(gw, 'id');
      const outgoing = outgoingMap.get(eid) ?? [];
      if (outgoing.length <= 1) continue;

      // Find all outgoing flows in this process
      const flows = getByTag(process, 'sequenceFlow').filter(f => attr(f, 'sourceRef') === eid);
      const unlabeled = flows.filter(f => {
        const fid = attr(f, 'id');
        return !defaultFlows.has(fid) && !attr(f, 'name').trim();
      });

      if (unlabeled.length === outgoing.length) {
        issues.push({
          id: makeId('gateway-unlabeled'),
          ruleId: 'gateway-unlabeled',
          severity: 'warning',
          layer: 'semantics',
          elementIds: [eid, ...unlabeled.map(f => attr(f, 'id'))],
          title: 'Gateway outgoing flows have no labels',
          explanation: `${label(gw)} has ${outgoing.length} outgoing flows but none are labeled or marked as default.`,
          suggestion: 'Label each outgoing flow with its routing condition, or mark one as the default path.',
        });
      }
    }

    // ── Exclusive gateway default ────────────────────────────────────────────
    for (const gw of getByTag(process, 'exclusiveGateway')) {
      const eid = attr(gw, 'id');
      const outgoing = outgoingMap.get(eid) ?? [];
      if (outgoing.length <= 1) continue;

      const hasDefault = !!attr(gw, 'default');
      const flows = getByTag(process, 'sequenceFlow').filter(f => attr(f, 'sourceRef') === eid);
      const allConditional = flows.every(f => {
        const condEl = f.getElementsByTagNameNS(BPMN_NS, 'conditionExpression')[0];
        return !!condEl;
      });

      if (allConditional && !hasDefault) {
        issues.push({
          id: makeId('xor-no-default'),
          ruleId: 'xor-no-default',
          severity: 'warning',
          layer: 'semantics',
          elementIds: [eid],
          title: 'Exclusive gateway has no default path',
          explanation: `${label(gw)} has conditions on all outgoing flows but no default. If no condition matches, the process gets stuck.`,
          suggestion: 'Mark one outgoing flow as the default (the one taken when no condition matches).',
        });
      }
    }
  }

  return finalize(issues);
}

function finalize(issues: ValidationIssue[]): ValidationReport {
  issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const counts: Record<'error' | 'warning' | 'info', number> = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;
  return {
    issues,
    counts,
    hasErrors: counts.error > 0,
    generatedAt: new Date().toISOString(),
  };
}
