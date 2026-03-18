import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

interface HUDProps {
  mode: 'endless' | 'blitz' | 'daily' | 'duo';
}

const BLITZ_TOTAL = 60_000;

export function HUD({ mode }: HUDProps) {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const consecutiveErrors = useGameStore((s) => s.consecutiveErrors);
  const blitzTimeRemaining = useGameStore((s) => s.blitzTimeRemaining);
  const difficulty = useGameStore((s) => s.difficulty);
  const phase = useGameStore((s) => s.phase);

  // Show "+Xs" bonus text when time is added in Blitz
  const [timeBonus, setTimeBonus] = useState<string | null>(null);
  const prevRound = useRef(roundNumber);

  useEffect(() => {
    if (mode === 'blitz' && roundNumber > prevRound.current && phase === 'observe') {
      const bonusMs = Math.max(1000, 3000 - (difficulty.difficulty - 1) * 300);
      const bonusSec = (bonusMs / 1000).toFixed(bonusMs % 1000 === 0 ? 0 : 1);
      setTimeBonus(`+${bonusSec}s`);
      const t = setTimeout(() => setTimeBonus(null), 1200);
      prevRound.current = roundNumber;
      return () => clearTimeout(t);
    }
    prevRound.current = roundNumber;
  }, [roundNumber, mode, phase]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const blitzPct = mode === 'blitz' ? blitzTimeRemaining / BLITZ_TOTAL : 0;
  const blitzUrgent = blitzPct < 0.2;
  const blitzCritical = blitzPct < 0.1;

  // Pulsing urgency effect for Blitz
  const urgencyOpacity = useSharedValue(1);
  useEffect(() => {
    if (blitzCritical) {
      urgencyOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 200 }),
          withTiming(1, { duration: 200 }),
        ),
        -1,
        true,
      );
    } else {
      urgencyOpacity.value = withTiming(1, { duration: 100 });
    }
  }, [blitzCritical]);

  const urgencyStyle = useAnimatedStyle(() => ({
    opacity: urgencyOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Blitz timer bar */}
      {mode === 'blitz' && (
        <View style={styles.timerBarBg}>
          <View
            style={[
              styles.timerBarFill,
              {
                width: `${blitzPct * 100}%`,
                backgroundColor: blitzUrgent ? COLORS.magenta : COLORS.cyan,
              } as any,
            ]}
          />
        </View>
      )}

      <View style={styles.topRow}>
        <View style={styles.statBlock}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{score.toLocaleString()}</Text>
        </View>

        {mode === 'blitz' && (
          <Animated.View style={[styles.statBlock, urgencyStyle]}>
            <Text style={styles.label}>TIEMPO</Text>
            <View style={styles.timerRow}>
              <Text style={[styles.value, blitzUrgent ? styles.timerUrgent : styles.timerValue]}>
                {formatTime(blitzTimeRemaining)}
              </Text>
              {timeBonus && (
                <Animated.Text
                  style={styles.timeBonus}
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(300)}
                >
                  {timeBonus}
                </Animated.Text>
              )}
            </View>
          </Animated.View>
        )}

        <View style={styles.statBlock}>
          <Text style={styles.label}>LVL</Text>
          <Text style={styles.value}>{difficulty.difficulty}</Text>
        </View>

        <View style={styles.statBlock}>
          <Text style={styles.label}>RONDA</Text>
          <Text style={styles.value}>{roundNumber}</Text>
        </View>
      </View>

      <View style={styles.comboRow}>
        <Text style={[styles.comboText, combo.isActive && styles.comboActive]}>
          x{combo.multiplier}
        </Text>
        {combo.isActive && (
          <Text style={styles.comboStreak}>{combo.correctCount} racha</Text>
        )}
        {consecutiveErrors > 0 && (
          <View style={styles.errorDots}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.errorDot,
                  i < consecutiveErrors && styles.errorDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingLeft: 56,
    paddingTop: 48,
    paddingBottom: 8,
  },
  timerBarBg: {
    height: 3,
    backgroundColor: '#1a1b2e',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statBlock: {
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerValue: {
    color: COLORS.yellow,
  },
  timerUrgent: {
    color: COLORS.magenta,
  },
  timeBonus: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00ff88',
    textShadowColor: '#00ff88',
    textShadowRadius: 8,
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  comboText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  comboActive: {
    color: COLORS.cyan,
  },
  comboStreak: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '600',
  },
  errorDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 12,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e1f35',
  },
  errorDotActive: {
    backgroundColor: COLORS.magenta,
  },
});
