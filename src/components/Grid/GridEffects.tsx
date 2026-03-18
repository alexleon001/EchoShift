import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * GridEffects — Particle and visual effects layer.
 * Will be implemented with @shopify/react-native-skia in Phase 2 for:
 * - Glow particles on streak completion
 * - Neon bloom effect on active cells
 * - Scanline background effect
 * - Combo break shatter animation
 */

interface GridEffectsProps {
  comboMultiplier: number;
  isStreakActive: boolean;
}

export function GridEffects(_props: GridEffectsProps) {
  return <View style={styles.effectsLayer} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  effectsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
