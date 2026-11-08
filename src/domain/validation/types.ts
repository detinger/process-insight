export type Severity = 'error' | 'warning' | 'info';

export type ValidationLayer = 'structure' | 'semantics' | 'control-flow' | 'modeling';

export interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: Severity;
  layer: ValidationLayer;
  elementIds: string[];
  title: string;
  explanation: string;
  suggestion: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  counts: Record<Severity, number>;
  /** True when there are any errors — export should be blocked or warned. */
  hasErrors: boolean;
  generatedAt: string;
}

export const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
};

export const LAYER_LABEL: Record<ValidationLayer, string> = {
  structure: 'Structure',
  semantics: 'BPMN semantics',
  'control-flow': 'Control flow',
  modeling: 'Modeling advice',
};
