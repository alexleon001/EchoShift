import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { patternRoutes } from './routes/patterns.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { dailyRoutes } from './routes/daily.js';
import { duoRoutes } from './routes/duo.js';
import { shareRoutes } from './routes/share.js';
import { startDailyCron } from './cron/dailyChallenge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

async function start() {
  await server.register(cors, { origin: true });
  await server.register(websocket);
  await server.register(fastifyStatic, {
    root: join(__dirname, 'public'),
    prefix: '/',
  });

  await server.register(patternRoutes, { prefix: '/api' });
  await server.register(leaderboardRoutes, { prefix: '/api' });
  await server.register(dailyRoutes, { prefix: '/api' });
  await server.register(duoRoutes, { prefix: '/api' });
  await server.register(shareRoutes, { prefix: '/api' });

  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
    server.log.info(`EchoShift server running on ${host}:${port}`);

    // Start daily challenge cron job
    startDailyCron();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
