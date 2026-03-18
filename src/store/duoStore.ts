/**
 * Duo Mode Store — shared state between lobby and match screens.
 */

import { create } from 'zustand';

interface RoundResult {
  round: number;
  yourScore: number;
  opponentScore: number;
  yourErrors: number;
  opponentErrors: number;
}

interface DuoState {
  connected: boolean;
  opponentName: string;
  roomCode: string;
  round: number;
  countdownSeconds: number;
  phase: 'lobby' | 'countdown' | 'observe' | 'replicate' | 'roundEnd' | 'matchEnd';
  pattern: any | null;
  difficulty: number;
  // Opponent live state
  opponentProgress: number;
  opponentScore: number;
  opponentCombo: number;
  // Results
  roundResults: RoundResult[];
  matchWinner: string;
  yourTotal: number;
  opponentTotal: number;

  // Actions
  setState: (partial: Partial<DuoState>) => void;
  addRoundResult: (result: RoundResult) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  opponentName: '',
  roomCode: '',
  round: 0,
  countdownSeconds: 0,
  phase: 'lobby' as const,
  pattern: null,
  difficulty: 3,
  opponentProgress: 0,
  opponentScore: 0,
  opponentCombo: 0,
  roundResults: [] as RoundResult[],
  matchWinner: '',
  yourTotal: 0,
  opponentTotal: 0,
};

export const useDuoStore = create<DuoState>((set) => ({
  ...initialState,

  setState: (partial) => set(partial),

  addRoundResult: (result) =>
    set((s) => ({
      roundResults: [...s.roundResults, result],
    })),

  reset: () => set(initialState),
}));
