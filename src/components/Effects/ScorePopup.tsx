import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, SlideOutUp } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

interface PopupEntry {
  id: number;
  score: number;
  multiplier: number;
}

let popupId = 0;

/**
 * ScorePopup — Shows floating "+N" text when the player scores points.
 * Auto-fades and slides up after a short delay.
 */
export function ScorePopup() {
  const [popups, setPopups] = useState<PopupEntry[]>([]);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.lastCellScore > 0 && state.lastCellScore !== prev.lastCellScore && state.phase === 'replicate') {
        const entry: PopupEntry = {
          id: ++popupId,
          score: state.lastCellScore,
          multiplier: state.combo.multiplier,
        };
        setPopups((p) => [...p.slice(-3), entry]);
        setTimeout(() => {
          setPopups((p) => p.filter((x) => x.id !== entry.id));
        }, 800);
      }
    });
    return unsub;
  }, []);

  if (popups.length === 0) return null;

  return (
    <>
      {popups.map((p, i) => (
        <Animated.Text
          key={p.id}
          style={[
            styles.popup,
            { top: 140 + i * 22 },
            p.multiplier >= 5 && styles.popupHigh,
          ]}
          exiting={SlideOutUp.duration(300).withCallback(() => {})}
        >
          +{p.score}{p.multiplier > 1 ? ` x${p.multiplier}` : ''}
        </Animated.Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    right: 20,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
    zIndex: 15,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 6,
  },
  popupHigh: {
    fontSize: 16,
    color: COLORS.yellow,
    textShadowColor: COLORS.yellow,
  },
});
