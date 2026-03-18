/**
 * SkinSystem — Grid skin definitions and theming.
 *
 * Each skin defines: cell colors, glow colors, ghost tints, border style, background.
 * Players unlock skins via gameplay or purchase with Echoes.
 */

export type SkinId = 'default' | 'neon_sakura';

export interface GridSkin {
  id: SkinId;
  name: string;
  description: string;
  cost: number; // 0 = free
  preview: string; // icon/emoji preview
  cell: {
    idleBg: string;
    idleBorder: string;
    borderRadius: number;
    borderWidth: number;
  };
  colors: {
    cyan: string;
    magenta: string;
    yellow: string;
    violet: string;
  };
  glowMap: Record<string, string>;
  ghostMap: Record<string, string>;
}

export const SKINS: Record<SkinId, GridSkin> = {
  default: {
    id: 'default',
    name: 'CYBER GRID',
    description: 'El clásico estilo cyberpunk',
    cost: 0,
    preview: '⬛',
    cell: {
      idleBg: '#14162a',
      idleBorder: '#1e2040',
      borderRadius: 12,
      borderWidth: 1.5,
    },
    colors: {
      cyan: '#00f5d4',
      magenta: '#f72585',
      yellow: '#ffd166',
      violet: '#7b2fff',
    },
    glowMap: {
      '#00f5d4': 'rgba(0, 245, 212, 0.6)',
      '#f72585': 'rgba(247, 37, 133, 0.6)',
      '#ffd166': 'rgba(255, 209, 102, 0.5)',
      '#7b2fff': 'rgba(123, 47, 255, 0.6)',
    },
    ghostMap: {
      '#00f5d4': '#0a1f1c',
      '#f72585': '#1f0a14',
      '#ffd166': '#1f1a0a',
      '#7b2fff': '#120a1f',
    },
  },
  neon_sakura: {
    id: 'neon_sakura',
    name: 'NEON SAKURA',
    description: 'Rosa y violeta, estilo japonés',
    cost: 200,
    preview: '🌸',
    cell: {
      idleBg: '#1a0f1e',
      idleBorder: '#2a1535',
      borderRadius: 8,
      borderWidth: 2,
    },
    colors: {
      cyan: '#ff6bce',
      magenta: '#ff2d7b',
      yellow: '#ffb3e6',
      violet: '#c44dff',
    },
    glowMap: {
      '#ff6bce': 'rgba(255, 107, 206, 0.6)',
      '#ff2d7b': 'rgba(255, 45, 123, 0.6)',
      '#ffb3e6': 'rgba(255, 179, 230, 0.5)',
      '#c44dff': 'rgba(196, 77, 255, 0.6)',
    },
    ghostMap: {
      '#ff6bce': '#1f0a18',
      '#ff2d7b': '#1f0510',
      '#ffb3e6': '#1f1018',
      '#c44dff': '#150a1f',
    },
  },
};

export const SKIN_LIST: SkinId[] = ['default', 'neon_sakura'];

export function getSkin(id: SkinId): GridSkin {
  return SKINS[id] ?? SKINS.default;
}
