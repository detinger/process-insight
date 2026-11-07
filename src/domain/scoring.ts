// Priority scoring for process landscape.
// Formula (AT-11): score = sum_i((rating_i - 1) / 4 * weight_i) * 100
// Ratings are 1–5; a rating of 1 contributes 0, a rating of 5 contributes weight * 100.
// Weights must sum to 1.0; missing ratings yield null (incomplete).

export interface ScoringCriterion {
  id: string;
  label: string;
  description: string;
  weight: number; // 0–1, all weights must sum to 1.0
}

export interface ScoringConfig {
  id: string;
  name: string;
  criteria: ScoringCriterion[];
  createdAt: string;
}

export interface ProcessRating {
  id: string; // `${processId}__${configId}`
  projectId: string;
  processId: string;
  configId: string;
  ratings: Record<string, number | null>; // criterionId → 1–5 | null
}

export function computeScore(
  ratings: Record<string, number | null>,
  criteria: ScoringCriterion[],
): number | null {
  for (const c of criteria) {
    if (ratings[c.id] == null) return null; // incomplete
  }
  let score = 0;
  for (const c of criteria) {
    const r = ratings[c.id] as number;
    score += ((r - 1) / 4) * c.weight;
  }
  return Math.round(score * 100);
}

export function validateWeights(criteria: ScoringCriterion[]): string | null {
  const sum = criteria.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    return `Weights sum to ${(sum * 100).toFixed(0)}% — must equal 100%.`;
  }
  return null;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  id: 'default',
  name: 'Standard BPM prioritization',
  criteria: [
    {
      id: 'strategic_impact',
      label: 'Strategic impact',
      description: 'How much does improving this process contribute to key strategic goals?',
      weight: 0.3,
    },
    {
      id: 'pain_severity',
      label: 'Pain severity',
      description: 'How much pain and waste does the current state generate for customers and staff?',
      weight: 0.3,
    },
    {
      id: 'feasibility',
      label: 'Feasibility',
      description: 'How feasible is improvement given current resources, ownership clarity and technology?',
      weight: 0.2,
    },
    {
      id: 'volume',
      label: 'Volume / frequency',
      description: 'How often does this process run, and how many people are affected?',
      weight: 0.2,
    },
  ],
  createdAt: new Date().toISOString(),
};
