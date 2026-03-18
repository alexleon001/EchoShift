import type { Pattern, PatternCell } from '@/engine/PatternEngine';

/** Validate that a pattern from the server is well-formed and playable */
export function isValidPattern(pattern: unknown): pattern is Pattern {
  if (!pattern || typeof pattern !== 'object') return false;

  const p = pattern as Record<string, unknown>;

  if (!Array.isArray(p.sequence) || p.sequence.length === 0) return false;
  if (typeof p.totalCells !== 'number' || p.totalCells < 3) return false;
  if (typeof p.estimatedDifficulty !== 'number') return false;

  const validColors = new Set(['#00f5d4', '#f72585', '#ffd166', '#7b2fff']);

  return p.sequence.every((cell: unknown) => {
    if (!cell || typeof cell !== 'object') return false;
    const c = cell as Record<string, unknown>;
    return (
      typeof c.cell === 'number' &&
      c.cell >= 0 &&
      c.cell <= 35 &&
      typeof c.color === 'string' &&
      validColors.has(c.color) &&
      typeof c.displayTime === 'number' &&
      c.displayTime >= 150 &&
      c.displayTime <= 1200
    );
  });
}

/** Check that no two consecutive cells in a sequence are the same */
export function hasNoConsecutiveDuplicates(sequence: PatternCell[]): boolean {
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i]!.cell === sequence[i - 1]!.cell) return false;
  }
  return true;
}
