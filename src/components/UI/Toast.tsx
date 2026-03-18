import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type = 'info', duration = 2000, onDismiss }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });

    opacity.value = withDelay(
      duration,
      withTiming(0, { duration: 200 }, () => {
        runOnJS(onDismiss)();
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const colorMap = {
    success: COLORS.cyan,
    error: COLORS.magenta,
    info: COLORS.yellow,
  };

  return (
    <Animated.View style={[styles.container, { borderColor: colorMap[type] }, animatedStyle]}>
      <Text style={[styles.text, { color: colorMap[type] }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#0d0e1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
