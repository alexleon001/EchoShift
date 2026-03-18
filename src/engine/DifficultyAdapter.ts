/**
 * DifficultyAdapter — Adjusts game difficulty based on player performance.
 *
 * Skill levels (from GAME_DESIGN.md):
 *   Novice   -> avg response > 900ms
 *   Explorer -> 600-900ms
 *   Master   -> 350-600ms
 *   Legend   -> 200-350ms
 *   Infinite -> < 200ms
 */

export type SkillLevel = 'Novice' | 'Explorer' | 'Master' | 'Legend' | 'Infinite';

export interface DifficultyState {
  difficulty: number;
  skillLevel: SkillLevel;
  avgResponseMs: number;
  gridSize: 4 | 5 | 6;
}

export class DifficultyAdapter {
  private responseTimes: number[] = [];
  private currentDifficulty = 1;
  private successRate = 1.0;

  /** Record a player response time */
  recordResponse(timeMs: number, correct: boolean): void {
    this.responseTimes.push(timeMs);
    if (this.responseTimes.length > 20) {
      this.responseTimes.shift();
    }

    const alpha = 0.15;
    this.successRate = this.successRate * (1 - alpha) + (correct ? 1 : 0) * alpha;
  }

  /** Get the average response time */
  getAvgResponseMs(): number {
    if (this.responseTimes.length === 0) return 1000;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  /** Determine skill level from average response time */
  getSkillLevel(): SkillLevel {
    const avg = this.getAvgResponseMs();
    if (avg < 200) return 'Infinite';
    if (avg < 350) return 'Legend';
    if (avg < 600) return 'Master';
    if (avg < 900) return 'Explorer';
    return 'Novice';
  }

  /** Determine appropriate grid size */
  getGridSize(): 4 | 5 | 6 {
    if (this.currentDifficulty >= 8) return 6;
    if (this.currentDifficulty >= 5) return 5;
    return 4;
  }

  /** Adjust difficulty after each round */
  adapt(): DifficultyState {
    if (this.successRate > 0.8 && this.currentDifficulty < 10) {
      this.currentDifficulty = Math.min(10, this.currentDifficulty + 1);
    } else if (this.successRate < 0.4 && this.currentDifficulty > 1) {
      this.currentDifficulty = Math.max(1, this.currentDifficulty - 1);
    }

    return this.getState();
  }

  /** Get current difficulty state */
  getState(): DifficultyState {
    return {
      difficulty: this.currentDifficulty,
      skillLevel: this.getSkillLevel(),
      avgResponseMs: this.getAvgResponseMs(),
      gridSize: this.getGridSize(),
    };
  }

  /** Reset adapter */
  reset(): void {
    this.responseTimes = [];
    this.currentDifficulty = 1;
    this.successRate = 1.0;
  }
}
