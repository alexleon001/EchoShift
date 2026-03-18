import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

// expo-haptics is a no-op on web but can throw on import in some bundler configs
let Haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

export function triggerCorrect(): void {
  if (!Haptics || !useSettingsStore.getState().hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function triggerError(): void {
  if (!Haptics || !useSettingsStore.getState().hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function triggerCombo(): void {
  if (!Haptics || !useSettingsStore.getState().hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function triggerGameOver(): void {
  if (!Haptics || !useSettingsStore.getState().hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
