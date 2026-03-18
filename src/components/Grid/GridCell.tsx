import React from 'react';
import { Pressable, StyleSheet, Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useSettingsStore } from '@/store/settingsStore';
import { getSkin } from '@/engine/SkinSystem';

interface GridCellProps {
  index: number;
  color: string | null;
  isActive: boolean;
  isHint: boolean;
  hintColor: string | null;
  ghostColor: string | null;
  size: number;
  onPress: (index: number) => void;
  disabled: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ghostTint(color: string, ghostMap: Record<string, string>, fallback: string): string {
  return ghostMap[color] ?? fallback;
}

function glowColor(color: string, glowMap: Record<string, string>): string {
  return glowMap[color] ?? 'rgba(255, 255, 255, 0.3)';
}

export function GridCell({
  index, color, isActive, isHint, hintColor, ghostColor, size, onPress, disabled,
}: GridCellProps) {
  const activeSkin = useSettingsStore((s) => s.activeSkin);
  const skin = getSkin(activeSkin);

  const animatedStyle = useAnimatedStyle(() => {
    // Active cell — full neon with glow
    if (isActive && color) {
      return {
        backgroundColor: withTiming(color, { duration: 50 }),
        borderColor: withTiming(color, { duration: 50 }),
        transform: [{ scale: withSpring(1.08, { damping: 12, stiffness: 500 }) }],
        opacity: 1,
      };
    }

    // Hint: pulsing border
    if (isHint && hintColor) {
      return {
        backgroundColor: ghostColor ? ghostTint(ghostColor, skin.ghostMap, skin.cell.idleBg) : '#181a2a',
        borderColor: withRepeat(
          withSequence(
            withTiming(hintColor, { duration: 500 }),
            withTiming(skin.cell.idleBorder, { duration: 500 }),
          ),
          -1,
          true,
        ),
        transform: [{ scale: 1 }],
        opacity: withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.6, { duration: 500 }),
          ),
          -1,
          true,
        ),
      };
    }

    // Default idle state
    const bg = ghostColor ? ghostTint(ghostColor, skin.ghostMap, skin.cell.idleBg) : skin.cell.idleBg;
    const border = ghostColor ? '#2a2b40' : skin.cell.idleBorder;

    return {
      backgroundColor: withTiming(bg, { duration: 80 }),
      borderColor: withTiming(border, { duration: 80 }),
      transform: [{ scale: withSpring(1, { damping: 18, stiffness: 400 }) }],
      opacity: withTiming(1, { duration: 80 }),
    };
  });

  // Web-only box-shadow glow for active neon effect
  const webGlowStyle = Platform.OS === 'web' && isActive && color ? {
    // @ts-ignore web-only
    boxShadow: `0 0 12px ${glowColor(color, skin.glowMap)}, inset 0 0 8px ${glowColor(color, skin.glowMap)}`,
  } : undefined;

  const handlePress = () => {
    if (disabled) return;
    onPress(index);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        {
          borderRadius: skin.cell.borderRadius,
          borderWidth: skin.cell.borderWidth,
          margin: 4,
          width: size,
          height: size,
        },
        animatedStyle,
        webGlowStyle,
      ]}
    />
  );
}
