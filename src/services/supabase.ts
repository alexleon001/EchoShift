import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config } from '@/constants/config';
import type { Database, Tables, TablesInsert, GameMode } from '@/types/database';

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') return window.localStorage.getItem(key);
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorageAdapter : secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);

export interface ScoreRecord {
  playerId: string;
  mode: GameMode;
  score: number;
  maxCombo: number;
  cellsHit: number;
  durationMs: number;
  gridSize?: 4 | 5 | 6;
}

export async function submitScore(record: ScoreRecord) {
  const insert: TablesInsert<'scores'> = {
    player_id: record.playerId,
    mode: record.mode,
    score: record.score,
    max_combo: record.maxCombo,
    cells_hit: record.cellsHit,
    duration_ms: record.durationMs,
    grid_size: record.gridSize,
  };

  const { error } = await supabase.from('scores').insert(insert);
  if (error) throw error;
}

export async function getLeaderboard(mode: GameMode, limit = 10) {
  const { data, error } = await supabase
    .from('scores')
    .select('score, max_combo, cells_hit, created_at, player_id, profiles(username)')
    .eq('mode', mode)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getProfile(userId: string): Promise<Tables<'profiles'>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Ensure a profile exists for the given user. Creates one if missing.
 * Uses the username from auth metadata (set during signUp).
 */
export async function ensureProfile(userId: string): Promise<Tables<'profiles'>> {
  // Try to get existing profile first
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) return existing;

  // Get username from auth user metadata
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username,
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string | null; total_xp?: number; echoes?: number; games_played?: number }) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
