import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { POWER_UPS, type PowerUpType, canUsePowerUp } from '@/engine/PowerUpSystem';
import { COLORS } from '@/constants/theme';

const POWER_UP_LIST: PowerUpType[] = ['freeze', 'hint', 'undo', 'slow', 'shield'];

export function PowerUpBar() {
  const phase = useGameStore((s) => s.phase);
  const powerUpUsage = useGameStore((s) => s.powerUpUsage);
  const usePowerUp = useGameStore((s) => s.usePowerUp);
  const shieldActive = useGameStore((s) => s.shieldActive);
  const slowCellsRemaining = useGameStore((s) => s.slowCellsRemaining);
  const echoes = usePlayerStore((s) => s.echoes);

  // Only show during replicate phase
  if (phase !== 'replicate') return null;

  return (
    <View style={styles.container}>
      {/* Active power-up indicators */}
      {shieldActive && (
        <View style={[styles.activeBadge, { borderColor: COLORS.violet }]}>
          <Text style={styles.activeIcon}>🛡</Text>
        </View>
      )}
      {slowCellsRemaining > 0 && (
        <View style={[styles.activeBadge, { borderColor: COLORS.yellow }]}>
          <Text style={styles.activeIcon}>🐢</Text>
          <Text style={[styles.activeCount, { color: COLORS.yellow }]}>{slowCellsRemaining}</Text>
        </View>
      )}
      <View style={styles.echoesBadge}>
        <Text style={styles.echoesIcon}>◆</Text>
        <Text style={styles.echoesValue}>{echoes}</Text>
      </View>
      {POWER_UP_LIST.map((type) => {
        const def = POWER_UPS[type];
        const available = canUsePowerUp(type, powerUpUsage, echoes);
        const used = powerUpUsage[type];

        return (
          <Pressable
            key={type}
            style={[styles.button, !available && styles.buttonDisabled]}
            onPress={() => available && usePowerUp(type)}
            disabled={!available}
          >
            <Text style={[styles.icon, !available && styles.iconDisabled]}>{def.icon}</Text>
            <Text style={[styles.cost, !available && styles.costDisabled]}>{def.cost}</Text>
            {used > 0 && (
              <View style={styles.usedBadge}>
                <Text style={styles.usedText}>{used}/{def.maxPerGame}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  echoesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13, 14, 26, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  echoesIcon: {
    fontSize: 12,
    color: COLORS.cyan,
  },
  echoesValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 56,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  icon: {
    fontSize: 18,
    color: COLORS.cyan,
  },
  iconDisabled: {
    color: '#555',
  },
  cost: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.yellow,
    marginTop: 2,
  },
  costDisabled: {
    color: '#444',
  },
  usedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1a1b2e',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  usedText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#666',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeIcon: {
    fontSize: 12,
  },
  activeCount: {
    fontSize: 10,
    fontWeight: '700',
  },
});
