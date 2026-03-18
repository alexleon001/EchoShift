import { create } from 'zustand';
import { getSetting, saveSetting, getStringSetting, saveStringSetting } from '@/utils/storage';
import { type SkinId } from '@/engine/SkinSystem';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
  activeSkin: SkinId;
  ownedSkins: SkinId[];

  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleMusic: () => void;
  toggleReducedMotion: () => void;
  setActiveSkin: (id: SkinId) => void;
  unlockSkin: (id: SkinId) => void;
}

function loadOwnedSkins(): SkinId[] {
  const raw = getStringSetting('ownedSkins');
  if (!raw) return ['default'];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : ['default'];
  } catch {
    return ['default'];
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: getSetting('sound', true),
  hapticsEnabled: getSetting('haptics', true),
  musicEnabled: getSetting('music', true),
  reducedMotion: getSetting('reducedMotion', false),
  activeSkin: (getStringSetting('activeSkin') as SkinId) || 'default',
  ownedSkins: loadOwnedSkins(),

  toggleSound: () =>
    set((s) => {
      const next = !s.soundEnabled;
      saveSetting('sound', next);
      return { soundEnabled: next };
    }),
  toggleHaptics: () =>
    set((s) => {
      const next = !s.hapticsEnabled;
      saveSetting('haptics', next);
      return { hapticsEnabled: next };
    }),
  toggleMusic: () =>
    set((s) => {
      const next = !s.musicEnabled;
      saveSetting('music', next);
      return { musicEnabled: next };
    }),
  toggleReducedMotion: () =>
    set((s) => {
      const next = !s.reducedMotion;
      saveSetting('reducedMotion', next);
      return { reducedMotion: next };
    }),
  setActiveSkin: (id) => {
    saveStringSetting('activeSkin', id);
    set({ activeSkin: id });
  },
  unlockSkin: (id) => {
    const owned = get().ownedSkins;
    if (owned.includes(id)) return;
    const updated = [...owned, id];
    saveStringSetting('ownedSkins', JSON.stringify(updated));
    set({ ownedSkins: updated });
  },
}));
