import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

/**
 * Shop — In-app purchase and EchoPass subscription screen.
 * Will be implemented in Phase 2 with RevenueCat integration.
 */
export function Shop() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SHOP</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
});
