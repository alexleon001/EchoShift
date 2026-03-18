import { type FastifyInstance } from 'fastify';
import { getSupabase } from '../services/supabase.js';
import { generatePattern } from '../services/claudeGenerator.js';
import type { TablesInsert, Json } from '../types/database.js';

export async function dailyRoutes(server: FastifyInstance) {
  server.get('/daily-challenge', async (_request, _reply) => {
    const today = new Date().toISOString().split('T')[0] as string;

    // Check if today's challenge already exists
    const { data: existing } = await getSupabase()
      .from('daily_challenges')
      .select('pattern')
      .eq('date', today)
      .single();

    if (existing) {
      return existing.pattern;
    }

    // Generate a new daily challenge (difficulty 5 = balanced for all players)
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
      server.log.error({ err: error }, 'Failed to store daily challenge');
    }

    return pattern;
  });
}
