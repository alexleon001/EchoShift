import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

/**
 * PerfectBanner — Flashes "PERFECTO!" when a round is completed with zero errors.
 */
export function PerfectBanner() {
  const [show, setShow] = useState(false);
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = useGameStore.subscribe((state, prev) => {
      if (
        state.perfectRounds > prev.perfectRounds &&
        state.phase === 'observe' &&
        state.roundNumber > 1
      ) {
        const bonusAmount = 200 * state.difficulty.difficulty;
        setBonus(bonusAmount);
        // Delay appearance so it doesn't clash with the round transition
        showTimer = setTimeout(() => {
          setShow(true);
          hideTimer = setTimeout(() => setShow(false), 1400);
        }, 500);
      }
    });
    return () => {
      unsub();
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(300)}
      pointerEvents="none"
    >
      <Animated.Text
        style={styles.text}
        entering={SlideInDown.duration(300).springify()}
      >
        PERFECTO!
      </Animated.Text>
      <Animated.Text
        style={styles.bonus}
        entering={FadeIn.delay(200).duration(200)}
      >
        +{bonus}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 18,
  },
  text: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.yellow,
    letterSpacing: 6,
    textShadowColor: COLORS.yellow,
    textShadowRadius: 20,
  },
  bonus: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.yellow,
    marginTop: 4,
    textShadowColor: COLORS.yellow,
    textShadowRadius: 10,
  },
});
