import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthInit } from '@/hooks/useAuthInit';
import { COLORS } from '@/constants/theme';
import { RankUpOverlay } from '@/components/Effects/RankUpOverlay';
import { useEffect } from 'react';
import { registerForPushNotifications, scheduleDailyReminder } from '@/services/notifications';
import { initErrorReporting, setUser } from '@/services/errorReporting';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

function useProtectedRoute(isLoading: boolean, isAuthenticated: boolean) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, segments]);
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Animated.Text style={styles.loadingLogo} entering={FadeIn.duration(500)}>
        ECHO
      </Animated.Text>
      <Animated.Text style={styles.loadingLogoSub} entering={FadeIn.delay(200).duration(500)}>
        SHIFT
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ marginTop: 32 }}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </Animated.View>
      <Animated.Text style={styles.loadingTagline} entering={FadeIn.delay(700).duration(400)}>
        Memoriza. Replica. Domina.
      </Animated.Text>
    </View>
  );
}

// Initialize error reporting on module load
initErrorReporting();

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuthInit();
  useProtectedRoute(isLoading, isAuthenticated);

  // Register push notifications and set user context when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      registerForPushNotifications().then(() => {
        scheduleDailyReminder();
      });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <>
        <LoadingScreen />
        {/* Slot must always render so expo-router can mount */}
        <Slot />
      </>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#07080f' },
          animation: 'fade',
        }}
      />
      <RankUpOverlay />
    </>
  );
}

export default function RootLayout() {
  const content = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar style="light" />
          <RootNavigator />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        <View style={styles.webPhone}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore — web-only
    height: '100vh',
    padding: 16,
  },
  webPhone: {
    width: 375,
    // @ts-ignore — web-only
    height: 'min(92vh, 780px)',
    backgroundColor: '#07080f',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1a1b2e',
    // @ts-ignore — web-only
    boxShadow: '0 0 60px rgba(0, 245, 212, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: '#07080f',
  },
  loading: {
    flex: 1,
    backgroundColor: '#07080f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 12,
  },
  loadingLogoSub: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.magenta,
    letterSpacing: 16,
  },
  loadingTagline: {
    fontSize: 11,
    color: '#444',
    letterSpacing: 3,
    marginTop: 16,
  },
});
