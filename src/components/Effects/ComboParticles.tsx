import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '@/store/gameStore';
import { COLORS } from '@/constants/theme';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

let particleId = 0;

const PARTICLE_COLORS = [COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.violet];

function randomColor(): string {
  return PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!;
}

/** Single animated particle */
function ParticleView({ particle }: { particle: Particle }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const dx = Math.cos(particle.angle) * particle.speed;
    const dy = Math.sin(particle.angle) * particle.speed;

    translateX.value = withTiming(dx, { duration: 1200, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(dy, { duration: 1200, easing: Easing.out(Easing.ease) });
    opacity.value = withDelay(400, withTiming(0, { duration: 800 }));
    scale.value = withTiming(0.2, { duration: 1200, easing: Easing.out(Easing.ease) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        // @ts-ignore web
        { boxShadow: `0 0 ${particle.size}px ${particle.color}` },
        animStyle,
      ]}
    />
  );
}

/**
 * ComboParticles — Emits glowing particles on combo milestones.
 * More particles and bigger at higher multipliers.
 */
export function ComboParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      // Emit on multiplier increase
      if (
        state.combo.multiplier > prev.combo.multiplier &&
        state.combo.multiplier > 1
      ) {
        const count = Math.min(state.combo.multiplier * 3, 20);
        const centerX = width / 2;
        const centerY = height * 0.45;
        const newParticles: Particle[] = [];

        for (let i = 0; i < count; i++) {
          newParticles.push({
            id: ++particleId,
            x: centerX + (Math.random() - 0.5) * 80,
            y: centerY + (Math.random() - 0.5) * 80,
            color: randomColor(),
            size: 3 + Math.random() * (state.combo.multiplier >= 5 ? 6 : 4),
            angle: Math.random() * Math.PI * 2,
            speed: 40 + Math.random() * 60 * (state.combo.multiplier >= 5 ? 1.5 : 1),
          });
        }

        setParticles((prev) => [...prev, ...newParticles]);

        // Cleanup after animation completes
        setTimeout(() => {
          const ids = new Set(newParticles.map((p) => p.id));
          setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
        }, 1300);
      }

      // Big burst on streak bonus
      if (state.combo.streakBonusPoints > 0 && prev.combo.streakBonusPoints === 0) {
        const centerX = width / 2;
        const centerY = height * 0.4;
        const burst: Particle[] = [];

        for (let i = 0; i < 24; i++) {
          burst.push({
            id: ++particleId,
            x: centerX + (Math.random() - 0.5) * 40,
            y: centerY + (Math.random() - 0.5) * 40,
            color: COLORS.yellow,
            size: 4 + Math.random() * 5,
            angle: (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.3,
            speed: 60 + Math.random() * 80,
          });
        }

        setParticles((prev) => [...prev, ...burst]);
        setTimeout(() => {
          const ids = new Set(burst.map((p) => p.id));
          setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
        }, 1300);
      }
    });
    return unsub;
  }, [width, height]);

  if (particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <ParticleView key={p.id} particle={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 14,
  },
  particle: {
    position: 'absolute',
  },
});
