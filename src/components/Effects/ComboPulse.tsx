import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

/**
 * ComboPulse — Neon glow border that intensifies with combo multiplier.
 * At high combos, the edges pulse and thicken dramatically.
 */
export function ComboPulse() {
  const glowOpacity = useSharedValue(0);
  const glowColor = useSharedValue<string>(COLORS.cyan);
  const edgeWidth = useSharedValue(2);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prevState) => {
      if (state.phase !== 'replicate') {
        glowOpacity.value = withTiming(0, { duration: 400 });
        edgeWidth.value = withTiming(2, { duration: 300 });
        return;
      }

      const mult = state.combo.multiplier;

      if (mult >= 10) {
        glowColor.value = COLORS.yellow;
        glowOpacity.value = withTiming(0.8, { duration: 150 });
        edgeWidth.value = withTiming(6, { duration: 200 });
        // Pulsing glow at max combo
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.8, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
      } else if (mult >= 5) {
        glowColor.value = COLORS.magenta;
        glowOpacity.value = withTiming(0.6, { duration: 200 });
        edgeWidth.value = withTiming(4, { duration: 200 });
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 500 }),
            withTiming(0.9, { duration: 500 }),
          ),
          -1,
          true,
        );
      } else if (mult >= 3) {
        glowColor.value = COLORS.violet;
        glowOpacity.value = withTiming(0.4, { duration: 200 });
        edgeWidth.value = withTiming(3, { duration: 200 });
        pulseScale.value = withTiming(1, { duration: 200 });
      } else if (mult >= 2) {
        glowColor.value = COLORS.cyan;
        glowOpacity.value = withTiming(0.25, { duration: 200 });
        edgeWidth.value = withTiming(2, { duration: 200 });
        pulseScale.value = withTiming(1, { duration: 200 });
      } else {
        glowOpacity.value = withTiming(0, { duration: 500 });
        edgeWidth.value = withTiming(2, { duration: 300 });
        pulseScale.value = withTiming(1, { duration: 200 });
      }

      // Combo break — dramatic flash then kill
      if (
        prevState.combo.multiplier > 1 &&
        state.combo.multiplier === 1 &&
        state.consecutiveErrors > prevState.consecutiveErrors
      ) {
        glowColor.value = COLORS.magenta;
        glowOpacity.value = withSequence(
          withTiming(1, { duration: 60 }),
          withTiming(0, { duration: 600 }),
        );
        edgeWidth.value = withSequence(
          withTiming(8, { duration: 60 }),
          withTiming(2, { duration: 600 }),
        );
        pulseScale.value = withTiming(1, { duration: 200 });
      }
    });
    return unsub;
  }, []);

  const topStyle = useAnimatedStyle(() => ({
    backgroundColor: glowColor.value,
    opacity: glowOpacity.value * pulseScale.value,
    height: edgeWidth.value,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    backgroundColor: glowColor.value,
    opacity: glowOpacity.value * 0.7 * pulseScale.value,
    height: edgeWidth.value,
  }));

  const leftStyle = useAnimatedStyle(() => ({
    backgroundColor: glowColor.value,
    opacity: glowOpacity.value * 0.5 * pulseScale.value,
    width: edgeWidth.value * 0.7,
  }));

  const rightStyle = useAnimatedStyle(() => ({
    backgroundColor: glowColor.value,
    opacity: glowOpacity.value * 0.5 * pulseScale.value,
    width: edgeWidth.value * 0.7,
  }));

  return (
    <>
      <Animated.View style={[styles.edgeTop, topStyle]} pointerEvents="none" />
      <Animated.View style={[styles.edgeBottom, bottomStyle]} pointerEvents="none" />
      <Animated.View style={[styles.edgeLeft, leftStyle]} pointerEvents="none" />
      <Animated.View style={[styles.edgeRight, rightStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  edgeLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 4,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
});
