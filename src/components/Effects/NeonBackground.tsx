import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

/**
 * NeonBackground — Animated scanlines and laser beams behind the grid.
 * Creates the retro-futurist atmosphere without being distracting.
 */
export function NeonBackground() {
  const scanlineOffset = useSharedValue(0);
  const beam1 = useSharedValue(-100);
  const beam2 = useSharedValue(-100);
  const beam3 = useSharedValue(-100);
  const pulse = useSharedValue(0.03);

  useEffect(() => {
    // Slow scanline scroll
    scanlineOffset.value = withRepeat(
      withTiming(20, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );

    // Horizontal laser beams that sweep across at different speeds
    beam1.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withDelay(2000, withTiming(110, { duration: 3000, easing: Easing.inOut(Easing.ease) })),
      ),
      -1,
      false,
    );

    beam2.value = withRepeat(
      withSequence(
        withTiming(110, { duration: 0 }),
        withDelay(4000, withTiming(-100, { duration: 4000, easing: Easing.inOut(Easing.ease) })),
      ),
      -1,
      false,
    );

    beam3.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withDelay(6000, withTiming(110, { duration: 2500, easing: Easing.inOut(Easing.ease) })),
      ),
      -1,
      false,
    );

    // Ambient glow pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.06, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const beam1Style = useAnimatedStyle(() => ({
    top: '30%',
    left: `${beam1.value}%` as any,
    opacity: 0.15,
  }));

  const beam2Style = useAnimatedStyle(() => ({
    top: '55%',
    left: `${beam2.value}%` as any,
    opacity: 0.1,
  }));

  const beam3Style = useAnimatedStyle(() => ({
    top: '75%',
    left: `${beam3.value}%` as any,
    opacity: 0.12,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Ambient glow at top */}
      <Animated.View style={[styles.ambientGlow, glowStyle]} />

      {/* Horizontal laser beams */}
      <Animated.View style={[styles.beam, styles.beamCyan, beam1Style]} />
      <Animated.View style={[styles.beam, styles.beamMagenta, beam2Style]} />
      <Animated.View style={[styles.beam, styles.beamViolet, beam3Style]} />

      {/* Scanlines overlay */}
      <View style={styles.scanlines} />

      {/* Bottom ambient glow */}
      <Animated.View style={[styles.ambientGlowBottom, glowStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: '10%',
    width: '80%',
    height: 300,
    borderRadius: 200,
    backgroundColor: COLORS.cyan,
  },
  beam: {
    position: 'absolute',
    width: '90%',
    height: 1,
  },
  beamCyan: {
    backgroundColor: COLORS.cyan,
    // @ts-ignore web
    boxShadow: `0 0 8px ${COLORS.cyan}`,
  },
  beamMagenta: {
    backgroundColor: COLORS.magenta,
    // @ts-ignore web
    boxShadow: `0 0 8px ${COLORS.magenta}`,
  },
  beamViolet: {
    backgroundColor: COLORS.violet,
    // @ts-ignore web
    boxShadow: `0 0 8px ${COLORS.violet}`,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    // @ts-ignore web
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -80,
    left: '15%',
    width: '70%',
    height: 200,
    borderRadius: 150,
    backgroundColor: COLORS.magenta,
  },
});
