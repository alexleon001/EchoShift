/**
 * Sharing Service — Deep links for score challenges + share functionality.
 *
 * Deep link format: echoshift://challenge?mode=endless&score=1234&combo=5&player=Username
 * Web fallback:     https://echoshift.app/challenge?mode=endless&score=1234&combo=5&player=Username
 */

import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';

export interface ShareScoreParams {
  mode: string;
  score: number;
  combo: number;
  round: number;
  accuracy: number;
  playerName: string;
}

/**
 * Build a challenge deep link URL.
 */
export function buildChallengeLink(params: ShareScoreParams): string {
  const queryParams = new URLSearchParams({
    mode: params.mode,
    score: String(params.score),
    combo: String(params.combo),
    round: String(params.round),
    accuracy: String(params.accuracy),
    player: params.playerName,
  });

  // Use expo-linking to build the proper scheme URL
  return Linking.createURL(`challenge?${queryParams.toString()}`);
}

/**
 * Parse a challenge deep link URL.
 */
export function parseChallengeLink(url: string): ShareScoreParams | null {
  try {
    const parsed = Linking.parse(url);
    const p = parsed.queryParams;
    if (!p) return null;

    return {
      mode: String(p.mode ?? 'endless'),
      score: Number(p.score ?? 0),
      combo: Number(p.combo ?? 0),
      round: Number(p.round ?? 0),
      accuracy: Number(p.accuracy ?? 0),
      playerName: String(p.player ?? 'Anónimo'),
    };
  } catch {
    return null;
  }
}

/**
 * Get mode display label.
 */
function getModeLabel(mode: string): string {
  switch (mode) {
    case 'blitz': return 'Blitz';
    case 'daily': return 'Daily';
    case 'duo': return 'Duo';
    default: return 'Endless';
  }
}

/**
 * Share a score with a challenge deep link.
 */
export async function shareScore(params: ShareScoreParams): Promise<'shared' | 'copied' | 'failed'> {
  const modeLabel = getModeLabel(params.mode);
  const link = buildChallengeLink(params);

  const message = [
    `EchoShift ${modeLabel}`,
    `${params.score.toLocaleString()} pts | x${params.combo} combo | Ronda ${params.round} | ${params.accuracy}% precisión`,
    `¿Puedes superarme?`,
    link,
  ].join('\n');

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: message });
        return 'shared';
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        return 'copied';
      }
      // Fallback textarea copy
      if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = message;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return 'copied';
      }
      return 'failed';
    }

    await Share.share({
      message,
      title: `EchoShift ${modeLabel} — ${params.score.toLocaleString()} pts`,
    });
    return 'shared';
  } catch {
    return 'failed';
  }
}

/**
 * Share a duo room code.
 */
export async function shareDuoRoom(roomCode: string): Promise<'shared' | 'copied' | 'failed'> {
  const link = Linking.createURL(`duo?code=${roomCode}`);
  const message = `¡Únete a mi sala en EchoShift!\nCódigo: ${roomCode}\n${link}`;

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        return 'copied';
      }
      return 'failed';
    }
    await Share.share({ message, title: 'EchoShift — Partida Duo' });
    return 'shared';
  } catch {
    return 'failed';
  }
}
