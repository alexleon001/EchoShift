import { createHash } from 'crypto';

/**
 * PatternCache — Caches generated patterns to reduce Claude API calls.
 * Uses in-memory Map for development. Production will use Redis (Upstash).
 */

interface CacheEntry {
  pattern: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function buildCacheKey(difficulty: number, gridSize: number, lastPatterns: number[][]): string {
  const patternsHash = createHash('md5')
    .update(JSON.stringify(lastPatterns))
    .digest('hex')
    .slice(0, 8);
  return `pattern:${difficulty}:${gridSize}:${patternsHash}`;
}

export async function getCachedPattern(
  difficulty: number,
  gridSize: number,
  lastPatterns: number[][],
): Promise<unknown | null> {
  const key = buildCacheKey(difficulty, gridSize, lastPatterns);
  const entry = cache.get(key);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.pattern;
}

export async function cachePattern(
  difficulty: number,
  gridSize: number,
  lastPatterns: number[][],
  pattern: unknown,
  ttlSeconds: number,
): Promise<void> {
  const key = buildCacheKey(difficulty, gridSize, lastPatterns);
  cache.set(key, {
    pattern,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function clearCache(): Promise<void> {
  cache.clear();
}
