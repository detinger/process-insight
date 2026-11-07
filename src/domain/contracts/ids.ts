let counter = 0;

export function newId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export function newRevisionId(): string {
  return newId('rev');
}
