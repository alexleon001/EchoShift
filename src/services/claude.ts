import { config } from '@/constants/config';
import type { Pattern } from '@/engine/PatternEngine';

interface GeneratePatternRequest {
  difficulty: number;
  playerSkillMs: number;
  lastPatterns: number[][];
  gridSize: 4 | 5 | 6;
  mode: 'endless' | 'blitz' | 'daily';
}

/**
 * Client-side service to request patterns from the EchoShift server.
 * The server handles Claude API calls — the client never talks to Claude directly.
 */
export async function fetchPattern(params: GeneratePatternRequest): Promise<Pattern> {
  const response = await fetch(`${config.apiBaseUrl}/api/patterns/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Pattern generation failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchDailyChallenge(): Promise<Pattern> {
  const response = await fetch(`${config.apiBaseUrl}/api/daily-challenge`);

  if (!response.ok) {
    throw new Error(`Daily challenge fetch failed: ${response.status}`);
  }

  return response.json();
}
