import { MousePointerClick } from 'lucide-react';

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  'bpmn:Task': 'Task',
  'bpmn:UserTask': 'User Task',
  'bpmn:ServiceTask': 'Service Task',
  'bpmn:ManualTask': 'Manual Task',
  'bpmn:ScriptTask': 'Script Task',
  'bpmn:SendTask': 'Send Task',
  'bpmn:ReceiveTask': 'Receive Task',
  'bpmn:BusinessRuleTask': 'Business Rule Task',
  'bpmn:SubProcess': 'Sub-Process',
  'bpmn:CallActivity': 'Call Activity',
  'bpmn:ExclusiveGateway': 'Exclusive Gateway (XOR)',
  'bpmn:InclusiveGateway': 'Inclusive Gateway (OR)',
  'bpmn:ParallelGateway': 'Parallel Gateway (AND)',
  'bpmn:EventBasedGateway': 'Event-Based Gateway',
  'bpmn:ComplexGateway': 'Complex Gateway',
  'bpmn:StartEvent': 'Start Event',
  'bpmn:EndEvent': 'End Event',
  'bpmn:IntermediateCatchEvent': 'Intermediate Catch Event',
  'bpmn:IntermediateThrowEvent': 'Intermediate Throw Event',
  'bpmn:BoundaryEvent': 'Boundary Event',
  'bpmn:SequenceFlow': 'Sequence Flow',
  'bpmn:MessageFlow': 'Message Flow',
  'bpmn:Association': 'Association',
  'bpmn:Lane': 'Lane',
  'bpmn:Participant': 'Pool / Participant',
  'bpmn:DataObjectReference': 'Data Object',
  'bpmn:DataStoreReference': 'Data Store',
  'bpmn:TextAnnotation': 'Text Annotation',
};

const ELEMENT_TYPE_EXPLANATIONS: Record<string, string> = {
  'bpmn:ExclusiveGateway': 'Routes the flow to exactly one outgoing path based on a condition. Each path should have a condition expression; one path may be the default. In a generated draft, decision points are represented as simple tasks — convert them to exclusive gateways here.',
  'bpmn:ParallelGateway': 'Splits or joins parallel flows. A splitting gateway activates all outgoing paths simultaneously; the joining gateway waits until all incoming tokens arrive.',
  'bpmn:InclusiveGateway': 'Routes to one or more outgoing paths based on conditions. More flexible than XOR but harder to reason about — prefer XOR when only one path fires.',
  'bpmn:SubProcess': 'A collapsed activity that contains its own flow. Use it to hide complexity and focus on the top-level flow.',
  'bpmn:UserTask': 'A task performed by a human using a software interface (form, portal, inbox).',
  'bpmn:ServiceTask': 'A task performed automatically by a software system or API call.',
  'bpmn:StartEvent': 'The trigger that starts the process. Every process needs exactly one none start event at minimum.',
  'bpmn:EndEvent': 'Marks the end of a path. A process can have multiple end events (one per outcome).',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ExplainPanel({ businessObject }: { businessObject: any }) {
  if (!businessObject) {
    return (
      <div className="modeler-explain-pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        <MousePointerClick size={28} style={{ opacity: 0.4 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Select an element</div>
          <p style={{ fontSize: 12, lineHeight: 1.6, maxWidth: '24ch' }}>Click any element in the diagram to see what it represents.</p>
        </div>
      </div>
    );
  }

  const type: string = businessObject.$type ?? '';
  const name: string = businessObject.name ?? '';
  const label = ELEMENT_TYPE_LABELS[type] ?? type.replace('bpmn:', '');
  const explanation = ELEMENT_TYPE_EXPLANATIONS[type];

  const docText: string = businessObject.documentation?.[0]?.text ?? '';

  return (
    <div className="modeler-explain-pad">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', marginBottom: 4 }}>{label}</div>
        {name && <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.3 }}>{name}</div>}
      </div>

      {explanation && (
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-muted)', marginBottom: 12 }}>{explanation}</p>
      )}

      {docText && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', marginBottom: 6 }}>Documentation</div>
          {docText}
        </div>
      )}

      {!explanation && !docText && (
        <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>No additional explanation for this element type.</p>
      )}
    </div>
  );
}
