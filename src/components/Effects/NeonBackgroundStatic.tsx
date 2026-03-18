import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

/**
 * NeonBackgroundStatic — Lighter ambient neon background for non-game screens.
 * Scanlines + slow ambient glow, no laser beams.
 */
export function NeonBackgroundStatic() {
  const pulse = useSharedValue(0.03);
  const pulse2 = useSharedValue(0.02);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.07, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.02, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    pulse2.value = withRepeat(
      withSequence(
        withTiming(0.05, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.01, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const glowTop = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const glowBottom = useAnimatedStyle(() => ({
    opacity: pulse2.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.glowTop, glowTop]} />
      <Animated.View style={[styles.glowBottom, glowBottom]} />
      <View style={styles.scanlines} />
      <View style={styles.lineH} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: '5%',
    width: '90%',
    height: 250,
    borderRadius: 150,
    backgroundColor: COLORS.cyan,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    left: '20%',
    width: '60%',
    height: 200,
    borderRadius: 150,
    backgroundColor: COLORS.magenta,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    // @ts-ignore web
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)',
  },
  lineH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1a1b2e',
    opacity: 0.2,
  },
});
