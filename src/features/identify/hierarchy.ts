import type { LandscapeRelation } from '../../domain/contracts/types';

function buildDescendants(processId: string, decomposesEdges: LandscapeRelation[]): Set<string> {
  const visited = new Set<string>();
  const queue = [processId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of decomposesEdges) {
      if (e.fromId === id && !visited.has(e.toId)) {
        visited.add(e.toId);
        queue.push(e.toId);
      }
    }
  }
  return visited;
}

/** Adding decomposesInto from→to creates a cycle if `to` is already a descendant of `from`. */
export function wouldCreateCycle(
  fromId: string, toId: string, relations: LandscapeRelation[],
): boolean {
  const decomp = relations.filter(r => r.type === 'decomposesInto');
  return buildDescendants(fromId, decomp).has(toId) || toId === fromId;
}
