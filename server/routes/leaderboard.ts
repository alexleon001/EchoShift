import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getSupabase } from '../services/supabase.js';
import type { TablesInsert, GameMode } from '../types/database.js';

const SubmitScoreSchema = z.object({
  playerId: z.string().uuid(),
  mode: z.enum(['endless', 'blitz', 'daily', 'duo']),
  score: z.number().min(0),
  maxCombo: z.number().min(0),
  cellsHit: z.number().min(0),
  durationMs: z.number().min(0),
  gridSize: z.number().refine((v): v is 4 | 5 | 6 => [4, 5, 6].includes(v)).optional(),
});

export async function leaderboardRoutes(server: FastifyInstance) {
  server.get('/scores', async (request) => {
    const { mode = 'endless', limit = '10' } = request.query as Record<string, string>;

    const { data, error } = await getSupabase()
      .from('scores')
      .select('score, max_combo, cells_hit, created_at, profiles(username)')
      .eq('mode', mode as GameMode)
      .order('score', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;
    return data;
  });

  server.post('/scores', async (request, reply) => {
    const parseResult = SubmitScoreSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid score data',
        details: parseResult.error.flatten(),
      });
    }

    const { playerId, mode, score, maxCombo, cellsHit, durationMs, gridSize } = parseResult.data;

    const insert: TablesInsert<'scores'> = {
      player_id: playerId,
      mode,
      score,
      max_combo: maxCombo,
      cells_hit: cellsHit,
      duration_ms: durationMs,
      grid_size: gridSize,
    };

    const { error } = await getSupabase().from('scores').insert(insert);
    if (error) throw error;
    return { success: true };
  });
}
