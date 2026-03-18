/**
 * Duo Mode — WebSocket rooms for 1v1 real-time matches.
 *
 * Flow:
 *  1. Player A creates a room → receives a 6-char room code
 *  2. Player B joins with the code
 *  3. Server generates a shared pattern and sends it to both
 *  4. Both play simultaneously — server relays progress
 *  5. When both finish, server sends final results
 */

import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { generatePattern } from '../services/claudeGenerator.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  ws: WebSocket;
  id: string;
  username: string;
  score: number;
  combo: number;
  errors: number;
  finished: boolean;
  progress: number; // 0-100%
}

interface Room {
  code: string;
  host: Player;
  guest: Player | null;
  pattern: any | null;
  round: number;
  difficulty: number;
  state: 'waiting' | 'countdown' | 'playing' | 'roundEnd' | 'finished';
  createdAt: number;
  roundTimer: ReturnType<typeof setTimeout> | null;
}

type ClientMsg =
  | { type: 'create'; userId: string; username: string }
  | { type: 'join'; code: string; userId: string; username: string }
  | { type: 'ready' }
  | { type: 'tap'; correct: boolean; score: number; combo: number; progress: number }
  | { type: 'roundComplete'; score: number; combo: number; errors: number }
  | { type: 'leave' };

type ServerMsg =
  | { type: 'roomCreated'; code: string }
  | { type: 'playerJoined'; username: string }
  | { type: 'countdown'; seconds: number }
  | { type: 'roundStart'; round: number; pattern: any; difficulty: number }
  | { type: 'opponentTap'; progress: number; score: number; combo: number }
  | { type: 'roundEnd'; yourScore: number; opponentScore: number; yourErrors: number; opponentErrors: number }
  | { type: 'matchEnd'; winner: string; yourTotal: number; opponentTotal: number; rounds: number }
  | { type: 'opponentLeft' }
  | { type: 'error'; message: string };

// ─── Room management ─────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
const playerRooms = new Map<WebSocket, string>();

const MAX_ROUNDS = 5;
const ROOM_TIMEOUT_MS = 5 * 60 * 1000; // 5 min waiting timeout
const ROUND_TIME_MS = 45_000; // 45s per round max

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure unique
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMsg) {
  send(room.host.ws, msg);
  if (room.guest) send(room.guest.ws, msg);
}

function getOpponent(room: Room, ws: WebSocket): Player | null {
  if (room.host.ws === ws) return room.guest;
  if (room.guest?.ws === ws) return room.host;
  return null;
}

function getPlayer(room: Room, ws: WebSocket): Player | null {
  if (room.host.ws === ws) return room.host;
  if (room.guest?.ws === ws) return room.guest;
  return null;
}

function cleanupRoom(code: string) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.roundTimer) clearTimeout(room.roundTimer);
  playerRooms.delete(room.host.ws);
  if (room.guest) playerRooms.delete(room.guest.ws);
  rooms.delete(code);
}

async function startRound(room: Room) {
  room.round++;
  room.state = 'countdown';

  // Generate pattern for this round
  const difficulty = Math.min(3 + room.round, 10);
  room.difficulty = difficulty;

  try {
    const pattern = await generatePattern({
      difficulty,
      playerSkillMs: 500,
      lastPatterns: [],
      gridSize: 4,
      mode: 'endless', // duo uses endless-style patterns
    });
    room.pattern = pattern;
  } catch {
    // Fallback: simple sequential pattern
    const cellCount = 3 + room.round;
    room.pattern = {
      sequence: Array.from({ length: cellCount }, (_, i) => ({
        cell: Math.floor(Math.random() * 16),
        color: ['#00f5d4', '#f72585', '#ffd166', '#7b2fff'][Math.floor(Math.random() * 4)],
        displayTime: Math.max(300, 600 - room.round * 30),
      })),
      totalCells: cellCount,
      estimatedDifficulty: difficulty,
      reasoning: 'Fallback pattern',
    };
  }

  // Reset player round state
  room.host.score = 0;
  room.host.combo = 0;
  room.host.errors = 0;
  room.host.finished = false;
  room.host.progress = 0;
  if (room.guest) {
    room.guest.score = 0;
    room.guest.combo = 0;
    room.guest.errors = 0;
    room.guest.finished = false;
    room.guest.progress = 0;
  }

  // 3-2-1 countdown
  broadcast(room, { type: 'countdown', seconds: 3 });
  await sleep(1000);
  broadcast(room, { type: 'countdown', seconds: 2 });
  await sleep(1000);
  broadcast(room, { type: 'countdown', seconds: 1 });
  await sleep(1000);

  // Send round start
  room.state = 'playing';
  broadcast(room, {
    type: 'roundStart',
    round: room.round,
    pattern: room.pattern,
    difficulty: room.difficulty,
  });

  // Round timeout
  room.roundTimer = setTimeout(() => {
    endRound(room);
  }, ROUND_TIME_MS);
}

function endRound(room: Room) {
  if (room.state !== 'playing') return;
  room.state = 'roundEnd';
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  const hostScore = room.host.score;
  const guestScore = room.guest?.score ?? 0;

  // Send round results to host
  send(room.host.ws, {
    type: 'roundEnd',
    yourScore: hostScore,
    opponentScore: guestScore,
    yourErrors: room.host.errors,
    opponentErrors: room.guest?.errors ?? 0,
  });

  // Send round results to guest
  if (room.guest) {
    send(room.guest.ws, {
      type: 'roundEnd',
      yourScore: guestScore,
      opponentScore: hostScore,
      yourErrors: room.guest.errors,
      opponentErrors: room.host.errors,
    });
  }

  // Check if match is over
  if (room.round >= MAX_ROUNDS) {
    endMatch(room);
  } else {
    // Next round after 3s
    setTimeout(() => {
      if (room.state === 'roundEnd' && rooms.has(room.code)) {
        startRound(room);
      }
    }, 3000);
  }
}

function endMatch(room: Room) {
  room.state = 'finished';

  // Accumulate total scores across rounds wouldn't work since we reset each round.
  // Use current round score as final (the game tracks totals client-side).
  // For simplicity, send match end with final round data.
  const hostTotal = room.host.score;
  const guestTotal = room.guest?.score ?? 0;

  const winner = hostTotal > guestTotal
    ? room.host.username
    : guestTotal > hostTotal
      ? room.guest?.username ?? 'Oponente'
      : 'Empate';

  send(room.host.ws, {
    type: 'matchEnd',
    winner,
    yourTotal: hostTotal,
    opponentTotal: guestTotal,
    rounds: room.round,
  });

  if (room.guest) {
    send(room.guest.ws, {
      type: 'matchEnd',
      winner,
      yourTotal: guestTotal,
      opponentTotal: hostTotal,
      rounds: room.round,
    });
  }

  // Cleanup after a short delay
  setTimeout(() => cleanupRoom(room.code), 5000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Message handler ─────────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string) {
  let msg: ClientMsg;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(ws, { type: 'error', message: 'Mensaje inválido' });
    return;
  }

  switch (msg.type) {
    case 'create': {
      // Cleanup any existing room for this player
      const existingCode = playerRooms.get(ws);
      if (existingCode) cleanupRoom(existingCode);

      const code = generateRoomCode();
      const room: Room = {
        code,
        host: { ws, id: msg.userId, username: msg.username, score: 0, combo: 0, errors: 0, finished: false, progress: 0 },
        guest: null,
        pattern: null,
        round: 0,
        difficulty: 3,
        state: 'waiting',
        createdAt: Date.now(),
        roundTimer: null,
      };
      rooms.set(code, room);
      playerRooms.set(ws, code);

      send(ws, { type: 'roomCreated', code });

      // Auto-cleanup after timeout
      setTimeout(() => {
        if (rooms.has(code) && rooms.get(code)!.state === 'waiting') {
          send(ws, { type: 'error', message: 'Sala expirada' });
          cleanupRoom(code);
        }
      }, ROOM_TIMEOUT_MS);
      break;
    }

    case 'join': {
      const code = msg.code.toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        send(ws, { type: 'error', message: 'Sala no encontrada' });
        return;
      }
      if (room.guest) {
        send(ws, { type: 'error', message: 'Sala llena' });
        return;
      }
      if (room.host.id === msg.userId) {
        send(ws, { type: 'error', message: 'No puedes unirte a tu propia sala' });
        return;
      }

      room.guest = { ws, id: msg.userId, username: msg.username, score: 0, combo: 0, errors: 0, finished: false, progress: 0 };
      playerRooms.set(ws, code);

      // Notify host
      send(room.host.ws, { type: 'playerJoined', username: msg.username });
      // Notify guest (confirm join)
      send(ws, { type: 'playerJoined', username: room.host.username });

      // Auto-start after 2s
      setTimeout(() => {
        if (rooms.has(code) && room.state === 'waiting' && room.guest) {
          startRound(room);
        }
      }, 2000);
      break;
    }

    case 'tap': {
      const code = playerRooms.get(ws);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.state !== 'playing') return;

      const player = getPlayer(room, ws);
      const opponent = getOpponent(room, ws);
      if (!player || !opponent) return;

      player.score = msg.score;
      player.combo = msg.combo;
      player.progress = msg.progress;
      if (!msg.correct) player.errors++;

      // Relay progress to opponent
      send(opponent.ws, {
        type: 'opponentTap',
        progress: msg.progress,
        score: msg.score,
        combo: msg.combo,
      });
      break;
    }

    case 'roundComplete': {
      const code = playerRooms.get(ws);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.state !== 'playing') return;

      const player = getPlayer(room, ws);
      if (!player) return;

      player.score = msg.score;
      player.combo = msg.combo;
      player.errors = msg.errors;
      player.finished = true;

      // Check if both finished
      if (room.host.finished && room.guest?.finished) {
        endRound(room);
      }
      break;
    }

    case 'leave': {
      const code = playerRooms.get(ws);
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;

      const opponent = getOpponent(room, ws);
      if (opponent) {
        send(opponent.ws, { type: 'opponentLeft' });
      }
      cleanupRoom(code);
      break;
    }
  }
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export const duoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/duo', { websocket: true }, (socket) => {
    socket.on('message', (data) => {
      handleMessage(socket, data.toString());
    });

    socket.on('close', () => {
      const code = playerRooms.get(socket);
      if (code) {
        const room = rooms.get(code);
        if (room) {
          const opponent = getOpponent(room, socket);
          if (opponent) {
            send(opponent.ws, { type: 'opponentLeft' });
          }
          cleanupRoom(code);
        }
      }
    });
  });
};
