/**
 * Duo Mode WebSocket client — manages connection to duo game server.
 */

import { config } from '@/constants/config';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ServerMessage =
  | { type: 'roomCreated'; code: string }
  | { type: 'playerJoined'; username: string }
  | { type: 'countdown'; seconds: number }
  | { type: 'roundStart'; round: number; pattern: any; difficulty: number }
  | { type: 'opponentTap'; progress: number; score: number; combo: number }
  | { type: 'roundEnd'; yourScore: number; opponentScore: number; yourErrors: number; opponentErrors: number }
  | { type: 'matchEnd'; winner: string; yourTotal: number; opponentTotal: number; rounds: number }
  | { type: 'opponentLeft' }
  | { type: 'error'; message: string };

export type DuoEventHandler = (msg: ServerMessage) => void;

// ─── Socket manager ──────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let handler: DuoEventHandler | null = null;
let reconnectAttempts = 0;

function getWsUrl(): string {
  const base = config.apiBaseUrl.replace(/^http/, 'ws');
  return `${base}/api/duo`;
}

export function connectDuo(onMessage: DuoEventHandler): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      handler = onMessage;
      resolve();
      return;
    }

    handler = onMessage;
    const url = getWsUrl();
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      resolve();
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data as string);
        handler?.(msg);
      } catch {}
    };

    ws.onerror = () => {
      reject(new Error('Error de conexión'));
    };

    ws.onclose = () => {
      ws = null;
    };
  });
}

export function sendDuo(msg: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function createRoom(userId: string, username: string) {
  sendDuo({ type: 'create', userId, username });
}

export function joinRoom(code: string, userId: string, username: string) {
  sendDuo({ type: 'join', code: code.toUpperCase(), userId, username });
}

export function sendTap(correct: boolean, score: number, combo: number, progress: number) {
  sendDuo({ type: 'tap', correct, score, combo, progress });
}

export function sendRoundComplete(score: number, combo: number, errors: number) {
  sendDuo({ type: 'roundComplete', score, combo, errors });
}

export function leaveDuo() {
  sendDuo({ type: 'leave' });
  disconnectDuo();
}

export function disconnectDuo() {
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  handler = null;
}
