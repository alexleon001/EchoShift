import { Platform } from 'react-native';

type GameMode = 'endless' | 'blitz' | 'daily' | 'duo';

// MMKV only works on native — use localStorage on web
let mmkvStorage: any = null;

function getMMKV() {
  if (mmkvStorage) return mmkvStorage;
  if (Platform.OS !== 'web') {
    try {
      const { MMKV } = require('react-native-mmkv');
      mmkvStorage = new MMKV({ id: 'echoshift-storage' });
    } catch {
      // fallback handled below
    }
  }
  return mmkvStorage;
}

function getNumber(key: string): number {
  const mmkv = getMMKV();
  if (mmkv) {
    return mmkv.getNumber(key) ?? 0;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const val = window.localStorage.getItem(key);
    return val ? Number(val) : 0;
  }
  return 0;
}

function setNumber(key: string, value: number): void {
  const mmkv = getMMKV();
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, String(value));
  }
}

function getBoolean(key: string, defaultValue: boolean): boolean {
  const mmkv = getMMKV();
  if (mmkv) {
    const val = mmkv.getBoolean(key);
    return val !== undefined ? val : defaultValue;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const val = window.localStorage.getItem(key);
    return val !== null ? val === 'true' : defaultValue;
  }
  return defaultValue;
}

function setBoolean(key: string, value: boolean): void {
  const mmkv = getMMKV();
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, String(value));
  }
}

export function getSetting(key: string, defaultValue: boolean): boolean {
  return getBoolean(`setting_${key}`, defaultValue);
}

export function saveSetting(key: string, value: boolean): void {
  setBoolean(`setting_${key}`, value);
}

export function getStringSetting(key: string): string | null {
  return getString(`setting_${key}`);
}

export function saveStringSetting(key: string, value: string): void {
  setString(`setting_${key}`, value);
}

export function saveBestScore(mode: GameMode, score: number): void {
  setNumber(`best_score_${mode}`, score);
}

export function getBestScore(mode: GameMode): Promise<number> {
  return Promise.resolve(getNumber(`best_score_${mode}`));
}

export function getAllBestScores(): Record<GameMode, number> {
  return {
    endless: getNumber('best_score_endless'),
    blitz: getNumber('best_score_blitz'),
    daily: getNumber('best_score_daily'),
    duo: getNumber('best_score_duo'),
  };
}

function getString(key: string): string | null {
  const mmkv = getMMKV();
  if (mmkv) {
    return mmkv.getString(key) ?? null;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

function setString(key: string, value: string): void {
  const mmkv = getMMKV();
  if (mmkv) {
    mmkv.set(key, value);
    return;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

/** Check if the daily challenge has been played today */
export function getDailyPlayedDate(): string | null {
  return getString('daily_played_date');
}

/** Mark today's daily challenge as played */
export function setDailyPlayed(): void {
  setString('daily_played_date', new Date().toISOString().split('T')[0]!);
}

/** Increment a numeric counter */
export function incrementStat(key: string, amount = 1): void {
  const current = getNumber(`stat_${key}`);
  setNumber(`stat_${key}`, current + amount);
}

/** Get a stat value */
export function getStat(key: string): number {
  return getNumber(`stat_${key}`);
}

/** Get all game stats */
export function getAllStats(): {
  totalGames: number;
  totalScore: number;
  perfectRounds: number;
  highestCombo: number;
  totalTaps: number;
  correctTaps: number;
} {
  return {
    totalGames: getNumber('stat_totalGames'),
    totalScore: getNumber('stat_totalScore'),
    perfectRounds: getNumber('stat_perfectRounds'),
    highestCombo: getNumber('stat_highestCombo'),
    totalTaps: getNumber('stat_totalTaps'),
    correctTaps: getNumber('stat_correctTaps'),
  };
}

/** Save game stats after a game ends */
export function saveGameStats(data: {
  score: number;
  perfectRounds: number;
  maxCombo: number;
  totalTaps: number;
  correctTaps: number;
}): void {
  incrementStat('totalGames');
  incrementStat('totalScore', data.score);
  incrementStat('perfectRounds', data.perfectRounds);
  incrementStat('totalTaps', data.totalTaps);
  incrementStat('correctTaps', data.correctTaps);
  const currentHighest = getNumber('stat_highestCombo');
  if (data.maxCombo > currentHighest) {
    setNumber('stat_highestCombo', data.maxCombo);
  }
}

/** Check if daily was played today */
export function wasDailyPlayedToday(): boolean {
  const played = getDailyPlayedDate();
  if (!played) return false;
  return played === new Date().toISOString().split('T')[0];
}

/** Get current daily streak count */
export function getDailyStreak(): number {
  return getNumber('daily_streak');
}

/** Update daily streak — call when a game is completed */
export function updateDailyStreak(): void {
  const today = new Date().toISOString().split('T')[0]!;
  const lastPlay = getString('last_play_date');

  if (lastPlay === today) return; // Already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
  const currentStreak = getNumber('daily_streak');

  if (lastPlay === yesterday) {
    // Consecutive day — increment streak
    setNumber('daily_streak', currentStreak + 1);
  } else {
    // Streak broken or first day — start at 1
    setNumber('daily_streak', 1);
  }

  setString('last_play_date', today);
}

/** Get the longest streak ever */
export function getLongestStreak(): number {
  return getNumber('longest_streak');
}

/** Update longest streak if current exceeds it */
export function checkLongestStreak(): void {
  const current = getNumber('daily_streak');
  const longest = getNumber('longest_streak');
  if (current > longest) {
    setNumber('longest_streak', current);
  }
}
