/** EchoShift visual theme — retro-futurist dark neon aesthetic */

export const COLORS = {
  background: '#07080f',
  surface: '#0d0e1a',
  border: '#1a1b2e',

  // Neon accents (from GAME_DESIGN.md)
  cyan: '#00f5d4',
  magenta: '#f72585',
  yellow: '#ffd166',
  violet: '#7b2fff',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#555555',

  // Functional
  success: '#00f5d4',
  error: '#f72585',
  warning: '#ffd166',
} as const;

export const GRID_COLORS = [
  COLORS.cyan,
  COLORS.magenta,
  COLORS.yellow,
  COLORS.violet,
] as const;

export const FONTS = {
  mono: 'SpaceMono',
  sans: 'Inter',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
