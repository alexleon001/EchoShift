import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { usePlayerStore } from '@/store/playerStore';
import { COLORS } from '@/constants/theme';

const RANK_COLORS: Record<string, string> = {
  Bronce: '#cd7f32',
  Plata: '#c0c0c0',
  Oro: '#ffd700',
  Platino: '#e5e4e2',
  Diamante: '#b9f2ff',
};

/**
 * RankUpOverlay — Shows a celebration when the player reaches a new rank.
 * Subscribes to playerStore rank changes.
 */
export function RankUpOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [newRank, setNewRank] = useState('');

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prevState) => {
      if (state.rank !== prevState.rank && prevState.totalXp > 0) {
        setNewRank(state.rank);
        setShowOverlay(true);
      }
    });
    return unsub;
  }, []);

  if (!showOverlay) return null;

  const color = RANK_COLORS[newRank] ?? COLORS.cyan;

  return (
    <Animated.View
      style={styles.overlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <Animated.View
        style={styles.card}
        entering={SlideInDown.delay(200).duration(500).springify()}
      >
        <Text style={styles.label}>RANGO ALCANZADO</Text>
        <Text style={[styles.rank, { color, textShadowColor: color }]}>{newRank.toUpperCase()}</Text>
        <View style={[styles.divider, { backgroundColor: color }]} />
        <Text style={styles.subtitle}>Sigue jugando para avanzar</Text>
        <TouchableOpacity style={[styles.btn, { borderColor: color }]} onPress={() => setShowOverlay(false)}>
          <Text style={[styles.btnText, { color }]}>CONTINUAR</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 32,
  },
  card: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1b2e',
    width: '100%',
    maxWidth: 300,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 4,
    marginBottom: 12,
  },
  rank: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowRadius: 20,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginVertical: 16,
    opacity: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  btn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
