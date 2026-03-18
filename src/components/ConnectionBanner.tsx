import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

/**
 * ConnectionBanner — Shows a subtle banner when the device is offline.
 * On web, uses navigator.onLine. On native, we check periodically.
 */
export function ConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const update = () => setIsOffline(!navigator.onLine);
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      update();
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }

    // On native, do a simple periodic connectivity check
    let active = true;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (active) setIsOffline(false);
      } catch {
        if (active) setIsOffline(true);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={styles.banner}
      entering={SlideInUp.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Text style={styles.text}>Sin conexión — modo offline</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 37, 133, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    zIndex: 50,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 37, 133, 0.3)',
  },
  text: {
    fontSize: 10,
    color: COLORS.magenta,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
