/**
 * PatternEngine — Generates, plays back, and validates cell sequences.
 *
 * Responsibilities:
 * - Generate fallback patterns when offline
 * - Control the timing of pattern display (playback)
 * - Validate the player's input against the current sequence
 * - Track consecutive errors (3 = game over)
 */

export interface PatternCell {
  cell: number;
  color: string;
  displayTime: number;
}

export interface Pattern {
  sequence: PatternCell[];
  totalCells: number;
  estimatedDifficulty: number;
  reasoning: string;
}

export interface ValidationResult {
  correct: boolean;
  cellIndex: number;
  expectedCell: number;
  actualCell: number;
  isComplete: boolean;
}

const COLORS = ['#00f5d4', '#f72585', '#ffd166', '#7b2fff'] as const;

export class PatternEngine {
  private currentPattern: Pattern | null = null;
  private playerInputIndex = 0;
  private consecutiveErrors = 0;
  private readonly maxConsecutiveErrors = 3;

  /** Get adjacent cells (including diagonals) for a given cell */
  private getNeighbors(cell: number, gridSize: number): number[] {
    const row = Math.floor(cell / gridSize);
    const col = cell % gridSize;
    const neighbors: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
          neighbors.push(nr * gridSize + nc);
        }
      }
    }
    return neighbors;
  }

  /** Generate a spatially-aware offline fallback pattern */
  generateFallbackPattern(difficulty: number, gridSize: number): Pattern {
    const totalCells = gridSize * gridSize;
    const sequenceLength = Math.min(1 + Math.ceil(difficulty * 1.1), 12);
    const displayTime = Math.max(1000 - (difficulty - 1) * 78, 300);

    const sequence: PatternCell[] = [];
    let lastCell = -1;

    // At low difficulty, prefer adjacent moves (more natural/memorable)
    // At high difficulty, mix in random jumps
    const adjacencyChance = Math.max(0.8 - difficulty * 0.06, 0.3);

    for (let i = 0; i < sequenceLength; i++) {
      let cell: number;

      if (i === 0 || lastCell < 0) {
        // Start near center for easier start
        const center = Math.floor(gridSize / 2);
        const offset = Math.floor(Math.random() * 2);
        cell = (center + offset - 1) * gridSize + center + (Math.floor(Math.random() * 2) - 1);
        cell = Math.max(0, Math.min(totalCells - 1, cell));
      } else if (Math.random() < adjacencyChance) {
        // Move to a neighbor
        const neighbors = this.getNeighbors(lastCell, gridSize);
        const filtered = neighbors.filter((n) => n !== lastCell);
        cell = filtered[Math.floor(Math.random() * filtered.length)] ?? Math.floor(Math.random() * totalCells);
      } else {
        // Random jump
        do {
          cell = Math.floor(Math.random() * totalCells);
        } while (cell === lastCell);
      }

      lastCell = cell;

      // Color variety: at low difficulty use fewer colors, at high use all 4
      const colorCount = difficulty <= 2 ? 2 : difficulty <= 5 ? 3 : 4;
      const color = COLORS[Math.floor(Math.random() * colorCount)]!;

      sequence.push({ cell, color, displayTime });
    }

    return {
      sequence,
      totalCells: sequenceLength,
      estimatedDifficulty: difficulty,
      reasoning: 'Offline fallback pattern',
    };
  }

  /** Load a pattern (from Claude API or fallback) for playback */
  loadPattern(pattern: Pattern): void {
    this.currentPattern = pattern;
    this.playerInputIndex = 0;
    this.consecutiveErrors = 0;
  }

  /** Replay the current pattern without resetting player progress */
  replayPattern(): void {
    // Keep playerInputIndex and consecutiveErrors as-is
  }

  /** Get the current loaded pattern */
  getPattern(): Pattern | null {
    return this.currentPattern;
  }

  /**
   * Validate one cell tap from the player.
   * Returns validation result with info about correctness and game state.
   */
  validateInput(cellIndex: number): ValidationResult {
    if (!this.currentPattern) {
      throw new Error('No pattern loaded');
    }

    const expected = this.currentPattern.sequence[this.playerInputIndex];
    if (!expected) {
      // Already completed the sequence — ignore extra taps
      return {
        correct: true,
        cellIndex: this.playerInputIndex - 1,
        expectedCell: cellIndex,
        actualCell: cellIndex,
        isComplete: true,
      };
    }

    const correct = cellIndex === expected.cell;

    if (correct) {
      this.consecutiveErrors = 0;
      this.playerInputIndex++;
    } else {
      this.consecutiveErrors++;
    }

    return {
      correct,
      cellIndex: this.playerInputIndex - (correct ? 1 : 0),
      expectedCell: expected.cell,
      actualCell: cellIndex,
      isComplete: correct && this.playerInputIndex >= this.currentPattern.sequence.length,
    };
  }

  /** Check if the game should end (3 consecutive errors) */
  isGameOver(): boolean {
    return this.consecutiveErrors >= this.maxConsecutiveErrors;
  }

  /** Get current consecutive error count */
  getConsecutiveErrors(): number {
    return this.consecutiveErrors;
  }

  /** Get the current expected input index */
  getPlayerInputIndex(): number {
    return this.playerInputIndex;
  }

  /** Undo the last error — decrement consecutive errors by 1 */
  undoLastError(): void {
    if (this.consecutiveErrors > 0) {
      this.consecutiveErrors--;
    }
  }

  /** Reset engine state */
  reset(): void {
    this.currentPattern = null;
    this.playerInputIndex = 0;
    this.consecutiveErrors = 0;
  }
}
