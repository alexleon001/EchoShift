import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { ensureProfile, updateProfile } from '@/services/supabase';

type Rank = 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'Diamante';

interface PlayerState {
  id: string | null;
  username: string;
  avatarUrl: string | null;
  rank: Rank;
  totalXp: number;
  echoes: number;
  gamesPlayed: number;
  isAuthenticated: boolean;
  isLoading: boolean;

  setPlayer: (data: { id: string; username: string; avatarUrl?: string }) => void;
  setSession: (session: Session | null) => void;
  hydrateProfile: (userId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  addXp: (amount: number) => void;
  addEchoes: (amount: number) => void;
  spendEchoes: (amount: number) => boolean;
  incrementGamesPlayed: () => void;
  logout: () => void;
}

function calculateRank(xp: number): Rank {
  if (xp >= 40_000) return 'Diamante';
  if (xp >= 15_000) return 'Platino';
  if (xp >= 5_000) return 'Oro';
  if (xp >= 1_000) return 'Plata';
  return 'Bronce';
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  id: null,
  username: '',
  avatarUrl: null,
  rank: 'Bronce',
  totalXp: 0,
  echoes: 999,
  gamesPlayed: 0,
  isAuthenticated: false,
  isLoading: true,

  setPlayer: (data) =>
    set({
      id: data.id,
      username: data.username,
      avatarUrl: data.avatarUrl ?? null,
      isAuthenticated: true,
    }),

  setSession: (session) => {
    if (session) {
      set({ id: session.user.id, isAuthenticated: true });
    } else {
      get().logout();
    }
  },

  hydrateProfile: async (userId) => {
    try {
      const profile = await ensureProfile(userId);
      set({
        id: userId,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        totalXp: profile.total_xp,
        echoes: profile.echoes,
        gamesPlayed: profile.games_played ?? 0,
        rank: calculateRank(profile.total_xp),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  addXp: (amount) => {
    const state = get();
    const newXp = state.totalXp + amount;
    set({ totalXp: newXp, rank: calculateRank(newXp) });
    // Sync to Supabase in background
    if (state.id) {
      updateProfile(state.id, { total_xp: newXp }).catch(() => {});
    }
  },

  addEchoes: (amount) =>
    set((s) => ({ echoes: s.echoes + amount })),

  spendEchoes: (amount) => {
    const current = get().echoes;
    if (current < amount) return false;
    set({ echoes: current - amount });
    return true;
  },

  incrementGamesPlayed: () => {
    const state = get();
    const newCount = state.gamesPlayed + 1;
    set({ gamesPlayed: newCount });
    if (state.id) {
      updateProfile(state.id, { games_played: newCount }).catch(() => {});
    }
  },

  logout: () =>
    set({
      id: null,
      username: '',
      avatarUrl: null,
      rank: 'Bronce',
      totalXp: 0,
      echoes: 100,
      gamesPlayed: 0,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
