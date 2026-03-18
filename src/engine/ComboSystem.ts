/**
 * ComboSystem — Manages score multipliers and streaks.
 *
 * Multiplier tiers (from GAME_DESIGN.md):
 *   1-4 correct  -> x1
 *   5-9 correct  -> x2
 *   10-14 correct -> x3
 *   15-19 correct -> x5
 *   20+ correct   -> x10
 *
 * Streak bonus: every 10 perfect cells -> +500 fixed points
 */

export interface ComboState {
  correctCount: number;
  multiplier: number;
  streakBonusPoints: number;
  isActive: boolean;
}

const MULTIPLIER_TIERS: { threshold: number; multiplier: number }[] = [
  { threshold: 20, multiplier: 10 },
  { threshold: 15, multiplier: 5 },
  { threshold: 10, multiplier: 3 },
  { threshold: 5, multiplier: 2 },
  { threshold: 0, multiplier: 1 },
];

const STREAK_INTERVAL = 10;
const STREAK_BONUS = 500;

export class ComboSystem {
  private correctCount = 0;
  private totalStreakBonuses = 0;

  /** Register a correct cell hit */
  hit(): ComboState {
    this.correctCount++;

    let streakBonusPoints = 0;
    if (this.correctCount > 0 && this.correctCount % STREAK_INTERVAL === 0) {
      streakBonusPoints = STREAK_BONUS;
      this.totalStreakBonuses += STREAK_BONUS;
    }

    return this.getState(streakBonusPoints);
  }

  /** Register a miss — resets combo to 0 */
  miss(): ComboState {
    this.correctCount = 0;
    return this.getState(0);
  }

  /** Calculate score for a correct cell */
  calculateCellScore(responseTimeMs: number): number {
    const multiplier = this.getMultiplier();
    // score = cells_correct x multiplier x (1000 / response_time_ms)
    const speedBonus = 1000 / Math.max(responseTimeMs, 100);
    return Math.round(1 * multiplier * speedBonus);
  }

  /** Get the current multiplier based on consecutive correct count */
  getMultiplier(): number {
    for (const tier of MULTIPLIER_TIERS) {
      if (this.correctCount >= tier.threshold) {
        return tier.multiplier;
      }
    }
    return 1;
  }

  /** Get full combo state */
  getState(pendingStreakBonus = 0): ComboState {
    const multiplier = this.getMultiplier();
    return {
      correctCount: this.correctCount,
      multiplier,
      streakBonusPoints: pendingStreakBonus,
      isActive: multiplier > 1,
    };
  }

  /** Reset all combo state */
  reset(): void {
    this.correctCount = 0;
    this.totalStreakBonuses = 0;
  }
}
