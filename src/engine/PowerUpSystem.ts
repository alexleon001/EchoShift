/**
 * PowerUpSystem — Manages power-up definitions, costs, and usage limits.
 *
 * Power-ups (from GAME_DESIGN.md):
 *   Freeze  — Replays the current pattern once more (observe phase restarts)
 *   Hint    — Highlights the next 2 expected cells briefly
 *   Undo    — Forgives the last error and restores combo
 *   Slow    — Reduces playback speed to 0.7x for the next 5 cells
 *   Shield  — Protects the combo multiplier from one error
 */

export type PowerUpType = 'freeze' | 'hint' | 'undo' | 'slow' | 'shield';

export interface PowerUpDef {
  type: PowerUpType;
  label: string;
  icon: string;
  cost: number;
  maxPerGame: number;
  description: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUpDef> = {
  freeze: {
    type: 'freeze',
    label: 'FREEZE',
    icon: '❄',
    cost: 30,
    maxPerGame: 2,
    description: 'Repite el patrón una vez más',
  },
  hint: {
    type: 'hint',
    label: 'HINT',
    icon: '◎',
    cost: 15,
    maxPerGame: 3,
    description: 'Muestra las próximas 2 celdas',
  },
  undo: {
    type: 'undo',
    label: 'UNDO',
    icon: '↺',
    cost: 25,
    maxPerGame: 2,
    description: 'Deshace el último error',
  },
  slow: {
    type: 'slow',
    label: 'SLOW',
    icon: '🐢',
    cost: 25,
    maxPerGame: 2,
    description: 'Reduce velocidad 0.7x por 5 celdas',
  },
  shield: {
    type: 'shield',
    label: 'SHIELD',
    icon: '🛡',
    cost: 30,
    maxPerGame: 1,
    description: 'Protege tu combo de un error',
  },
};

export interface PowerUpUsage {
  freeze: number;
  hint: number;
  undo: number;
  slow: number;
  shield: number;
}

export function createEmptyUsage(): PowerUpUsage {
  return { freeze: 0, hint: 0, undo: 0, slow: 0, shield: 0 };
}

export function canUsePowerUp(type: PowerUpType, usage: PowerUpUsage, echoes: number): boolean {
  const def = POWER_UPS[type];
  return usage[type] < def.maxPerGame && echoes >= def.cost;
}
