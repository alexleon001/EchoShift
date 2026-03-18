import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

/**
 * RoundBanner — Shows a brief "RONDA N" banner when a new round starts.
 * Disappears after 600ms.
 */
export function RoundBanner() {
  const roundNumber = useGameStore((s) => s.roundNumber);
  const phase = useGameStore((s) => s.phase);
  const [show, setShow] = useState(false);
  const [displayRound, setDisplayRound] = useState(1);

  useEffect(() => {
    if (phase === 'observe' && roundNumber > 1) {
      setDisplayRound(roundNumber);
      setShow(true);
      const t = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(t);
    }
  }, [roundNumber, phase]);

  if (!show) return null;

  return (
    <Animated.View
      style={styles.container}
      entering={SlideInUp.duration(300).springify()}
      exiting={FadeOut.duration(300)}
      pointerEvents="none"
    >
      <Animated.Text style={styles.text} entering={FadeIn.duration(200)}>
        RONDA {displayRound}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  text: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 6,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 15,
    backgroundColor: 'rgba(7, 8, 15, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
