import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

interface OnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'OBSERVA',
    subtitle: 'Memoriza la secuencia',
    description: 'Las celdas se iluminan una por una con colores neón. Presta atención al orden y los colores.',
    icon: '👀',
    accent: COLORS.yellow,
    cells: [
      { delay: 0, color: COLORS.cyan },
      { delay: 1, color: COLORS.magenta },
      { delay: 2, color: COLORS.yellow },
    ],
  },
  {
    title: 'REPLICA',
    subtitle: 'Toca en el mismo orden',
    description: 'Reproduce la secuencia tocando las celdas correctas. Pistas sutiles te guían al inicio.',
    icon: '👆',
    accent: COLORS.cyan,
    cells: [
      { delay: 0, color: COLORS.cyan },
      { delay: 1, color: COLORS.magenta },
      { delay: 2, color: COLORS.yellow },
    ],
  },
  {
    title: 'DOMINA',
    subtitle: 'Combos, power-ups y más',
    description: 'Acierta seguido para multiplicar tu score. Usa power-ups estratégicamente. ¡Cada ronda es más difícil!',
    icon: '🔥',
    accent: COLORS.magenta,
    cells: [],
  },
];

export function Onboarding({ visible, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      setStep(0);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    setStep(0);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <Animated.View
          key={step}
          style={styles.container}
          entering={FadeIn.duration(300)}
        >
          {/* Step indicator */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && { backgroundColor: current.accent, width: 20 },
                ]}
              />
            ))}
          </View>

          {/* Icon */}
          <View style={[styles.iconCircle, { borderColor: current.accent }]}>
            <Text style={styles.icon}>{current.icon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: current.accent, textShadowColor: current.accent }]}>
            {current.title}
          </Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>

          {/* Mini grid demo for steps 0 and 1 */}
          {current.cells.length > 0 && (
            <View style={styles.demoGrid}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const cellData = current.cells.find((c) => c.delay === i);
                const isHighlighted = !!cellData;
                return (
                  <View
                    key={i}
                    style={[
                      styles.demoCell,
                      isHighlighted && { backgroundColor: cellData!.color, borderColor: cellData!.color },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Features list for last step */}
          {isLast && (
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <Text style={[styles.featureIcon, { color: COLORS.cyan }]}>x10</Text>
                <Text style={styles.featureText}>Combos hasta x10 multiplicador</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={[styles.featureIcon, { color: COLORS.yellow }]}>◆</Text>
                <Text style={styles.featureText}>Gana Echoes y usa power-ups</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={[styles.featureIcon, { color: COLORS.violet }]}>⚡</Text>
                <Text style={styles.featureText}>3 modos: Endless, Blitz, Daily</Text>
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{current.description}</Text>

          {/* Buttons */}
          <Pressable style={[styles.nextBtn, { backgroundColor: current.accent }]} onPress={handleNext}>
            <Text style={styles.nextText}>{isLast ? 'JUGAR' : 'SIGUIENTE'}</Text>
          </Pressable>

          {!isLast && (
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>SALTAR</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 15, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowRadius: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 2,
    marginBottom: 28,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 150,
    gap: 6,
    marginBottom: 24,
  },
  demoCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2040',
    backgroundColor: '#14162a',
  },
  features: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(13, 14, 26, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 16,
    fontWeight: '900',
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#aaa',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 3,
  },
  skipBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 2,
  },
});
