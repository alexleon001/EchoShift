/**
 * Daily Challenge Cron — Pre-generates the daily challenge at midnight UTC.
 *
 * Runs every day at 00:01 UTC. If a challenge already exists for today, skips.
 * This ensures the daily challenge is ready before any player requests it,
 * eliminating cold-start latency on the first request of the day.
 */

import { getSupabase } from '../services/supabase.js';
import { generatePattern } from '../services/claudeGenerator.js';
import type { TablesInsert, Json } from '../types/database.js';

export async function generateDailyChallenge(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0] as string;

  // Check if already generated
  const { data: existing } = await getSupabase()
    .from('daily_challenges')
    .select('id')
    .eq('date', today)
    .single();

  if (existing) {
    console.log(`[cron] Daily challenge for ${today} already exists, skipping`);
    return false;
  }

  console.log(`[cron] Generating daily challenge for ${today}...`);

  const pattern = await generatePattern({
    difficulty: 5,
    playerSkillMs: 600,
    lastPatterns: [],
    gridSize: 4,
    mode: 'daily',
  });

  const insert: TablesInsert<'daily_challenges'> = {
    date: today,
    pattern: pattern as unknown as Json,
    difficulty: 5,
  };

  const { error } = await getSupabase().from('daily_challenges').insert(insert);

  if (error) {
    console.error(`[cron] Failed to store daily challenge:`, error);
    return false;
  }

  console.log(`[cron] Daily challenge for ${today} generated successfully`);
  return true;
}

/**
 * Start the daily challenge cron scheduler.
 * Uses a simple setInterval that checks every hour.
 * At midnight UTC (hour 0), generates the daily challenge.
 */
export function startDailyCron(): void {
  console.log('[cron] Daily challenge cron started');

  // Generate immediately on startup if needed
  generateDailyChallenge().catch((err) =>
    console.error('[cron] Startup generation failed:', err),
  );

  // Check every hour — generate at midnight UTC
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    const hour = new Date().getUTCHours();
    if (hour === 0) {
      generateDailyChallenge().catch((err) =>
        console.error('[cron] Scheduled generation failed:', err),
      );
    }
  }, ONE_HOUR);
}
