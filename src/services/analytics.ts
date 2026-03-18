/**
 * Analytics — Tracks gameplay events for retention and monetization analysis.
 *
 * Uses Supabase as the analytics backend via a simple events table.
 * Events are batched and sent periodically to avoid excessive network calls.
 */

import { Platform } from 'react-native';

type GameEvent =
  | { type: 'game_start'; mode: string }
  | { type: 'game_end'; mode: string; score: number; duration: number }
  | { type: 'pattern_complete'; difficulty: number; responseTime: number }
  | { type: 'combo_reached'; multiplier: number }
  | { type: 'power_used'; power: string }
  | { type: 'purchase'; product: string }
  | { type: 'ad_watched' }
  | { type: 'skin_equipped'; skin: string }
  | { type: 'onboarding_complete' }
  | { type: 'shop_view' }
  | { type: 'notification_enabled' }
  | { type: 'duo_match_start' }
  | { type: 'duo_match_end'; winner: string; yourTotal: number; opponentTotal: number };

interface QueuedEvent {
  event: GameEvent;
  timestamp: string;
  platform: string;
}

const eventQueue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 30_000; // 30 seconds
const MAX_QUEUE_SIZE = 20;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

async function flushEvents() {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_QUEUE_SIZE);

  try {
    // Lazy import to avoid circular dependency
    const { getSupabase } = require('@/services/supabase');
    const supabase = getSupabase();
    if (!supabase) return;

    const rows = batch.map((e) => ({
      event_type: e.event.type,
      event_data: e.event,
      platform: e.platform,
      created_at: e.timestamp,
    }));

    await supabase.from('analytics_events').insert(rows);
  } catch {
    // Re-queue failed events (limit to prevent memory leak)
    if (eventQueue.length < 100) {
      eventQueue.push(...batch);
    }
  }
}

export function trackEvent(event: GameEvent): void {
  if (__DEV__) {
    console.log('[Analytics]', event.type, event);
  }

  eventQueue.push({
    event,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
  });

  // Flush immediately if queue is large, otherwise schedule
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

/** Flush any remaining events (call on app background/close) */
export function flushAnalytics(): void {
  flushEvents();
}
