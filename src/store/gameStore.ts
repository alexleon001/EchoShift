import { create } from 'zustand';
import { PatternEngine, type Pattern, type ValidationResult } from '@/engine/PatternEngine';
import { ComboSystem, type ComboState } from '@/engine/ComboSystem';
import { DifficultyAdapter, type DifficultyState } from '@/engine/DifficultyAdapter';
import { type PowerUpType, type PowerUpUsage, createEmptyUsage, canUsePowerUp, POWER_UPS } from '@/engine/PowerUpSystem';
import { playPowerUp } from '@/utils/audio';
import { fetchPattern, fetchDailyChallenge } from '@/services/claude';
import { isValidPattern } from '@/utils/validators';
import { trackEvent } from '@/services/analytics';

type GameMode = 'endless' | 'blitz' | 'daily' | 'duo';
type GamePhase = 'idle' | 'observe' | 'replicate' | 'validate' | 'evolve' | 'gameOver';

interface GameState {
  mode: GameMode | null;
  phase: GamePhase;
  score: number;
  combo: ComboState;
  difficulty: DifficultyState;
  currentPattern: Pattern | null;
  activeCell: number | null;
  consecutiveErrors: number;
  roundNumber: number;
  blitzTimeRemaining: number;
  lastPatterns: number[][];
  nextExpectedCell: number | null;
  totalTaps: number;
  correctTaps: number;
  lastCellScore: number;
  roundErrors: number;
  perfectRounds: number;
  powerUpUsage: PowerUpUsage;
  hintCells: number[];
  freezeActive: boolean;
  slowCellsRemaining: number;
  shieldActive: boolean;

  _patternEngine: PatternEngine;
  _comboSystem: ComboSystem;
  _difficultyAdapter: DifficultyAdapter;

  startGame: (mode: GameMode, externalPattern?: any) => void;
  setPhase: (phase: GamePhase) => void;
  setActiveCell: (cell: number | null) => void;
  handleCellTap: (cellIndex: number, responseTimeMs: number) => ValidationResult;
  nextRound: () => void;
  endGame: () => void;
  reset: () => void;
  setBlitzTime: (ms: number) => void;
  usePowerUp: (type: PowerUpType) => boolean;
  clearHintCells: () => void;
}

const initialCombo: ComboState = {
  correctCount: 0,
  multiplier: 1,
  streakBonusPoints: 0,
  isActive: false,
};

const initialDifficulty: DifficultyState = {
  difficulty: 1,
  skillLevel: 'Novice',
  avgResponseMs: 1000,
  gridSize: 4,
};

/**
 * Try to fetch a pattern from the server, fall back to local generation.
 * Keeps last 3 patterns to send to Claude for variety.
 */
async function getPattern(
  mode: GameMode,
  diffState: DifficultyState,
  lastPatterns: number[][],
  engine: PatternEngine,
): Promise<Pattern> {
  // Daily challenge has its own endpoint
  if (mode === 'daily') {
    try {
      const pattern = await fetchDailyChallenge();
      if (isValidPattern(pattern)) return pattern;
    } catch {
      // Fall through to fallback
    }
  }

  // Try server-generated pattern
  try {
    const pattern = await fetchPattern({
      difficulty: diffState.difficulty,
      playerSkillMs: diffState.avgResponseMs,
      lastPatterns,
      gridSize: diffState.gridSize,
      mode: mode === 'duo' ? 'endless' : mode,
    });
    if (isValidPattern(pattern)) return pattern;
  } catch {
    // Fall through to local fallback
  }

  // Local fallback — always works offline
  return engine.generateFallbackPattern(diffState.difficulty, diffState.gridSize);
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: null,
  phase: 'idle',
  score: 0,
  combo: initialCombo,
  difficulty: initialDifficulty,
  currentPattern: null,
  activeCell: null,
  consecutiveErrors: 0,
  roundNumber: 0,
  blitzTimeRemaining: 60_000,
  lastPatterns: [],
  nextExpectedCell: null,
  totalTaps: 0,
  correctTaps: 0,
  lastCellScore: 0,
  roundErrors: 0,
  perfectRounds: 0,
  powerUpUsage: createEmptyUsage(),
  hintCells: [],
  freezeActive: false,
  slowCellsRemaining: 0,
  shieldActive: false,

  _patternEngine: new PatternEngine(),
  _comboSystem: new ComboSystem(),
  _difficultyAdapter: new DifficultyAdapter(),

  startGame: (mode, externalPattern) => {
    const state = get();
    state._patternEngine.reset();
    state._comboSystem.reset();
    state._difficultyAdapter.reset();

    const diffState = state._difficultyAdapter.getState();

    // Use external pattern (duo mode) or generate a local one
    const pattern = externalPattern ?? state._patternEngine.generateFallbackPattern(
      diffState.difficulty,
      diffState.gridSize,
    );
    state._patternEngine.loadPattern(pattern);

    set({
      mode,
      phase: 'observe',
      score: 0,
      combo: initialCombo,
      difficulty: diffState,
      currentPattern: pattern,
      activeCell: null,
      consecutiveErrors: 0,
      roundNumber: 1,
      blitzTimeRemaining: 60_000,
      lastPatterns: [],
      totalTaps: 0,
      correctTaps: 0,
      lastCellScore: 0,
      roundErrors: 0,
      perfectRounds: 0,
      powerUpUsage: createEmptyUsage(),
      hintCells: [],
      freezeActive: false,
      slowCellsRemaining: 0,
      shieldActive: false,
    });

    // Async: try to fetch a server pattern for the next round (skip for duo — server sends patterns)
    if (!externalPattern) {
      getPattern(mode, diffState, [], state._patternEngine).then((serverPattern) => {
        const current = get();
        if (current.roundNumber === 1 && current.phase === 'observe') {
          state._patternEngine.loadPattern(serverPattern);
          set({ currentPattern: serverPattern });
        }
      });
    }
  },

  setPhase: (phase) => {
    const state = get();
    if (phase === 'replicate') {
      // Set the first expected cell for hint display
      const firstStep = state.currentPattern?.sequence[0];
      set({ phase, nextExpectedCell: firstStep?.cell ?? null });
    } else {
      set({ phase, nextExpectedCell: null });
    }
  },
  setActiveCell: (cell) => set({ activeCell: cell }),

  handleCellTap: (cellIndex, responseTimeMs) => {
    const state = get();
    const result = state._patternEngine.validateInput(cellIndex);

    if (result.correct) {
      const comboState = state._comboSystem.hit();
      const cellScore = state._comboSystem.calculateCellScore(responseTimeMs);
      state._difficultyAdapter.recordResponse(responseTimeMs, true);

      // Update next expected cell
      const nextIdx = state._patternEngine.getPlayerInputIndex();
      const nextStep = state.currentPattern?.sequence[nextIdx];

      // Decrement slow counter on correct tap
      const newSlow = state.slowCellsRemaining > 0 ? state.slowCellsRemaining - 1 : 0;

      const totalScore = cellScore + comboState.streakBonusPoints;
      set({
        score: state.score + totalScore,
        combo: comboState,
        consecutiveErrors: 0,
        nextExpectedCell: nextStep?.cell ?? null,
        totalTaps: state.totalTaps + 1,
        correctTaps: state.correctTaps + 1,
        lastCellScore: totalScore,
        slowCellsRemaining: newSlow,
      });
    } else {
      // Shield absorbs the error — combo is preserved, error doesn't count
      if (state.shieldActive) {
        state._patternEngine.undoLastError();
        state._difficultyAdapter.recordResponse(responseTimeMs, false);
        set({
          shieldActive: false,
          totalTaps: state.totalTaps + 1,
          lastCellScore: 0,
        });
      } else {
        const comboState = state._comboSystem.miss();
        state._difficultyAdapter.recordResponse(responseTimeMs, false);
        const errors = state._patternEngine.getConsecutiveErrors();

        set({
          combo: comboState,
          consecutiveErrors: errors,
          totalTaps: state.totalTaps + 1,
          lastCellScore: 0,
          roundErrors: state.roundErrors + 1,
        });

        if (state._patternEngine.isGameOver()) {
          set({ phase: 'gameOver', nextExpectedCell: null });
        }
      }
    }

    return result;
  },

  nextRound: () => {
    const state = get();
    const diffState = state._difficultyAdapter.adapt();

    // Track last patterns for variety (keep last 3)
    const currentCells = state.currentPattern?.sequence.map((s) => s.cell) ?? [];
    const updatedLastPatterns = [...state.lastPatterns, currentCells].slice(-3);

    // Immediate fallback pattern to keep gameplay fluid
    const pattern = state._patternEngine.generateFallbackPattern(
      diffState.difficulty,
      diffState.gridSize,
    );
    state._patternEngine.loadPattern(pattern);

    const newRound = state.roundNumber + 1;
    const isPerfect = state.roundErrors === 0;

    // Perfect round bonus: +200 * difficulty
    let perfectBonus = 0;
    if (isPerfect) {
      perfectBonus = 200 * diffState.difficulty;
    }

    // Blitz bonus: award extra time for completing a round
    let blitzTime = state.blitzTimeRemaining;
    if (state.mode === 'blitz') {
      const bonusMs = Math.max(1000, 3000 - (diffState.difficulty - 1) * 300);
      blitzTime = Math.min(blitzTime + bonusMs, 60_000);
    }

    set({
      phase: 'observe',
      difficulty: diffState,
      currentPattern: pattern,
      activeCell: null,
      roundNumber: newRound,
      lastPatterns: updatedLastPatterns,
      blitzTimeRemaining: blitzTime,
      score: state.score + perfectBonus,
      roundErrors: 0,
      perfectRounds: state.perfectRounds + (isPerfect ? 1 : 0),
    });

    // Async: try to fetch server pattern (will update if still observing)
    if (state.mode) {
      getPattern(state.mode, diffState, updatedLastPatterns, state._patternEngine).then(
        (serverPattern) => {
          const current = get();
          if (current.roundNumber === newRound && current.phase === 'observe') {
            state._patternEngine.loadPattern(serverPattern);
            set({ currentPattern: serverPattern });
          }
        },
      );
    }
  },

  endGame: () => set({ phase: 'gameOver' }),

  setBlitzTime: (ms) => set({ blitzTimeRemaining: ms }),

  reset: () => {
    const state = get();
    state._patternEngine.reset();
    state._comboSystem.reset();
    state._difficultyAdapter.reset();
    set({
      mode: null,
      phase: 'idle',
      score: 0,
      combo: initialCombo,
      difficulty: initialDifficulty,
      currentPattern: null,
      activeCell: null,
      consecutiveErrors: 0,
      roundNumber: 0,
      blitzTimeRemaining: 60_000,
      lastPatterns: [],
      nextExpectedCell: null,
      totalTaps: 0,
      correctTaps: 0,
      lastCellScore: 0,
      roundErrors: 0,
      perfectRounds: 0,
      powerUpUsage: createEmptyUsage(),
      hintCells: [],
      freezeActive: false,
      slowCellsRemaining: 0,
      shieldActive: false,
    });
  },

  usePowerUp: (type) => {
    const state = get();
    // Import echoes from playerStore at call-time
    const { usePlayerStore } = require('@/store/playerStore');
    const playerState = usePlayerStore.getState();
    const def = POWER_UPS[type];

    if (!canUsePowerUp(type, state.powerUpUsage, playerState.echoes)) return false;
    if (state.phase !== 'replicate') return false;

    // Spend echoes
    playerState.spendEchoes(def.cost);
    const newUsage = { ...state.powerUpUsage, [type]: state.powerUpUsage[type] + 1 };

    // Play power-up sound and track
    playPowerUp();
    trackEvent({ type: 'power_used', power: type });

    switch (type) {
      case 'freeze': {
        // Replay the pattern visually without resetting player progress
        if (state.currentPattern) {
          state._patternEngine.replayPattern();
          set({ powerUpUsage: newUsage, phase: 'observe', freezeActive: true, nextExpectedCell: null });
        }
        break;
      }
      case 'hint': {
        // Flash the remaining cells in order (up to 3) with a staggered reveal
        if (state.currentPattern) {
          const idx = state._patternEngine.getPlayerInputIndex();
          const remaining = state.currentPattern.sequence.slice(idx, idx + 3);
          const cells = remaining.map((s) => s.cell);
          set({ powerUpUsage: newUsage, hintCells: cells });
          setTimeout(() => set({ hintCells: [] }), 2000);
        }
        break;
      }
      case 'undo': {
        // Forgive errors and give a second chance — clears all consecutive errors
        state._patternEngine.undoLastError();
        set({
          powerUpUsage: newUsage,
          consecutiveErrors: 0,
          roundErrors: Math.max(0, state.roundErrors - 1),
        });
        break;
      }
      case 'slow': {
        // Slow down playback speed for next 5 cells (applied via slowCellsRemaining)
        set({
          powerUpUsage: newUsage,
          slowCellsRemaining: 5,
        });
        break;
      }
      case 'shield': {
        // Activate shield — protects combo from the next error
        set({
          powerUpUsage: newUsage,
          shieldActive: true,
        });
        break;
      }
    }
    return true;
  },

  clearHintCells: () => set({ hintCells: [] }),
}));
