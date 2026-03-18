import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

/**
 * ScreenFlash — Full-screen neon flash that reacts to gameplay events.
 * More dramatic at higher combos and on combo breaks.
 */
export function ScreenFlash() {
  const opacity = useSharedValue(0);
  const color = useSharedValue<string>(COLORS.cyan);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prevState) => {
      // Game over — heavy magenta flash
      if (state.phase === 'gameOver' && prevState.phase !== 'gameOver') {
        color.value = COLORS.magenta;
        opacity.value = withSequence(
          withTiming(0.35, { duration: 80 }),
          withTiming(0, { duration: 600 }),
        );
        return;
      }

      // Blitz urgency — subtle pulse each second under 10s
      if (
        state.mode === 'blitz' &&
        state.blitzTimeRemaining <= 10000 &&
        state.blitzTimeRemaining > 0 &&
        state.phase !== 'gameOver' &&
        Math.floor(state.blitzTimeRemaining / 1000) !== Math.floor(prevState.blitzTimeRemaining / 1000)
      ) {
        color.value = COLORS.magenta;
        opacity.value = withSequence(
          withTiming(0.08, { duration: 40 }),
          withTiming(0, { duration: 200 }),
        );
      }

      if (state.phase !== 'replicate') return;

      // Combo BREAK — dramatic double flash
      if (
        prevState.combo.multiplier > 1 &&
        state.combo.multiplier === 1 &&
        state.consecutiveErrors > prevState.consecutiveErrors
      ) {
        color.value = COLORS.magenta;
        opacity.value = withSequence(
          withTiming(0.4, { duration: 50 }),
          withTiming(0.1, { duration: 100 }),
          withTiming(0.3, { duration: 50 }),
          withTiming(0, { duration: 500 }),
        );
        return;
      }

      // Combo multiplier UP — golden flash, intensity scales with multiplier
      if (
        state.combo.isActive &&
        state.combo.multiplier > prevState.combo.multiplier
      ) {
        const intensity = Math.min(0.4, 0.12 + state.combo.multiplier * 0.04);
        color.value = state.combo.multiplier >= 5 ? COLORS.yellow : COLORS.cyan;
        opacity.value = withSequence(
          withTiming(intensity, { duration: 60 }),
          withTiming(0, { duration: 400 }),
        );
        return;
      }

      // Correct hit — subtle flash, color matches the cell
      if (state.combo.correctCount > prevState.combo.correctCount) {
        color.value = COLORS.cyan;
        opacity.value = withSequence(
          withTiming(0.06, { duration: 30 }),
          withTiming(0, { duration: 150 }),
        );
        return;
      }

      // Error flash — magenta, stronger on consecutive errors
      if (state.consecutiveErrors > prevState.consecutiveErrors) {
        const errorIntensity = 0.1 + state.consecutiveErrors * 0.08;
        color.value = COLORS.magenta;
        opacity.value = withSequence(
          withTiming(errorIntensity, { duration: 50 }),
          withTiming(0, { duration: 350 }),
        );
      }
    });

    return unsub;
  }, []);

  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: color.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
