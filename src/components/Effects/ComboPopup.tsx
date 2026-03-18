import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';
import { trackEvent } from '@/services/analytics';

interface PopupData {
  id: number;
  text: string;
  color: string;
}

let popupId = 0;

/**
 * ComboPopup — Shows floating text when combo milestones are reached.
 * "+500 STREAK!", "x2!", "x3!", etc.
 */
export function ComboPopup() {
  const [popups, setPopups] = useState<PopupData[]>([]);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prevState) => {
      if (state.phase !== 'replicate') return;

      // Multiplier increased
      if (state.combo.multiplier > prevState.combo.multiplier && state.combo.multiplier > 1) {
        const id = ++popupId;
        const color = state.combo.multiplier >= 5 ? COLORS.magenta
          : state.combo.multiplier >= 3 ? COLORS.violet
          : COLORS.cyan;
        setPopups((p) => [...p, { id, text: `x${state.combo.multiplier}`, color }]);
        setTimeout(() => setPopups((p) => p.filter((pp) => pp.id !== id)), 800);
        trackEvent({ type: 'combo_reached', multiplier: state.combo.multiplier });
      }

      // Streak bonus
      if (state.combo.streakBonusPoints > 0 && prevState.combo.streakBonusPoints === 0) {
        const id = ++popupId;
        setPopups((p) => [...p, { id, text: '+500 STREAK', color: COLORS.yellow }]);
        setTimeout(() => setPopups((p) => p.filter((pp) => pp.id !== id)), 1000);
      }
    });
    return unsub;
  }, []);

  if (popups.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {popups.map((p, i) => (
        <Animated.View
          key={p.id}
          style={[styles.popupWrap, { top: i * 28 }]}
          entering={SlideInUp.duration(200).springify()}
          exiting={FadeOut.duration(300)}
        >
          <Animated.Text style={[styles.popup, { color: p.color, textShadowColor: p.color }]}>
            {p.text}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: 'center',
  },
  popupWrap: {
    position: 'absolute',
  },
  popup: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowRadius: 10,
  },
});
