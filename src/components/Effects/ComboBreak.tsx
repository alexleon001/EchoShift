import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

/**
 * ComboBreak — Dramatic "COMBO BREAK" text when a streak is lost.
 * Only shows when multiplier drops from >1 to 1.
 */
export function ComboBreak() {
  const [show, setShow] = useState(false);
  const [lostMultiplier, setLostMultiplier] = useState(0);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (
        prev.combo.multiplier > 1 &&
        state.combo.multiplier === 1 &&
        state.consecutiveErrors > prev.consecutiveErrors
      ) {
        setLostMultiplier(prev.combo.multiplier);
        setShow(true);
        setTimeout(() => setShow(false), 1000);
      }
    });
    return unsub;
  }, []);

  if (!show) return null;

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(400)}
      pointerEvents="none"
    >
      <Animated.Text
        style={styles.text}
        entering={SlideInUp.duration(200).springify()}
      >
        COMBO BREAK
      </Animated.Text>
      <Animated.Text
        style={styles.sub}
        entering={FadeIn.delay(100).duration(200)}
      >
        x{lostMultiplier} perdido
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
    zIndex: 16,
  },
  text: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.magenta,
    letterSpacing: 4,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 20,
  },
  sub: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(247, 37, 133, 0.6)',
    marginTop: 4,
    letterSpacing: 2,
  },
});
