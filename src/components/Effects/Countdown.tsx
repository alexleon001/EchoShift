import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

interface CountdownProps {
  onComplete: () => void;
}

const STEPS = ['3', '2', '1', 'GO!'];
const STEP_COLORS = [COLORS.cyan, COLORS.cyan, COLORS.yellow, COLORS.yellow];

/**
 * Countdown — Cyberpunk-style 3-2-1-GO! overlay with angular design.
 */
export function Countdown({ onComplete }: CountdownProps) {
  const [step, setStep] = useState(0);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });

    const interval = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          clearInterval(interval);
          opacity.value = withTiming(0, { duration: 120 });
          setTimeout(onComplete, 150);
          return prev;
        }
        // Punch-in animation
        scale.value = withSequence(
          withTiming(0.4, { duration: 30 }),
          withSpring(1, { damping: 10, stiffness: 300 }),
        );
        // Subtle rotation tick
        rotation.value = withSequence(
          withTiming(next % 2 === 0 ? 3 : -3, { duration: 40 }),
          withSpring(0, { damping: 12, stiffness: 200 }),
        );
        return next;
      });
    }, 380);

    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const currentStep = STEPS[step] ?? 'GO!';
  const isGo = currentStep === 'GO!';
  const stepColor = STEP_COLORS[step] ?? COLORS.cyan;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.container,
          { borderColor: stepColor },
          // @ts-ignore web
          { boxShadow: `0 0 40px ${stepColor}50, inset 0 0 20px ${stepColor}15` },
          animStyle,
        ]}
      >
        {/* Corner accents */}
        <View style={[styles.corner, styles.cornerTL, { backgroundColor: stepColor }]} />
        <View style={[styles.corner, styles.cornerTR, { backgroundColor: stepColor }]} />
        <View style={[styles.corner, styles.cornerBL, { backgroundColor: stepColor }]} />
        <View style={[styles.corner, styles.cornerBR, { backgroundColor: stepColor }]} />

        <Text style={[styles.text, { color: stepColor, textShadowColor: stepColor }, isGo && styles.textGo]}>
          {currentStep}
        </Text>
        {!isGo && (
          <Text style={[styles.subText, { color: stepColor }]}>PREPARADO</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(7, 8, 15, 0.5)',
  },
  container: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 8, 15, 0.9)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 2,
  },
  cornerTL: { top: -1, left: -1, borderRadius: 1 },
  cornerTR: { top: -1, right: -1, borderRadius: 1 },
  cornerBL: { bottom: -1, left: -1, borderRadius: 1 },
  cornerBR: { bottom: -1, right: -1, borderRadius: 1 },
  text: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowRadius: 20,
  },
  textGo: {
    fontSize: 38,
    letterSpacing: 6,
  },
  subText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 4,
    opacity: 0.5,
    marginTop: 4,
  },
});
