import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generatePattern } from '../services/claudeGenerator.js';
import { getCachedPattern, cachePattern } from '../services/patternCache.js';

const GenerateRequestSchema = z.object({
  difficulty: z.number().min(1).max(10),
  playerSkillMs: z.number().min(50).max(5000),
  lastPatterns: z.array(z.array(z.number())).max(3),
  gridSize: z.union([z.literal(4), z.literal(5), z.literal(6)]),
  mode: z.enum(['endless', 'blitz', 'daily']),
});

export async function patternRoutes(server: FastifyInstance) {
  server.post('/patterns/generate', async (request, reply) => {
    const parseResult = GenerateRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parseResult.error.flatten(),
      });
    }

    const params = parseResult.data;

    // Check cache first
    const cached = await getCachedPattern(params.difficulty, params.gridSize, params.lastPatterns);
    if (cached) {
      return cached;
    }

    // Generate new pattern via Claude API
    const pattern = await generatePattern(params);

    // Cache for 5 minutes
    await cachePattern(params.difficulty, params.gridSize, params.lastPatterns, pattern, 300);

    return pattern;
  });
}
