/**
 * Push Notification Service — Handles registration and scheduling.
 *
 * Uses expo-notifications for:
 * - Daily challenge reminders (local notification at 20:00 daily)
 * - Streak reminders (if player hasn't played today)
 *
 * On web, notifications are not supported (graceful no-op).
 */

import { Platform } from 'react-native';

let Notifications: any = null;

async function getNotifications() {
  if (Platform.OS === 'web') return null;
  if (Notifications) return Notifications;
  try {
    Notifications = require('expo-notifications');
    return Notifications;
  } catch {
    return null;
  }
}

/**
 * Request notification permissions and register for push.
 * Returns the Expo push token or null if unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const notif = await getNotifications();
  if (!notif) return null;

  try {
    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Set notification handler
    notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Get Expo push token
    const tokenData = await notif.getExpoPushTokenAsync();
    return tokenData?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Schedule the daily challenge reminder.
 * Fires every day at 20:00 local time.
 */
export async function scheduleDailyReminder(): Promise<void> {
  const notif = await getNotifications();
  if (!notif) return;

  // Cancel existing daily reminders
  await cancelDailyReminder();

  try {
    await notif.scheduleNotificationAsync({
      content: {
        title: 'Daily Challenge disponible',
        body: 'El patrón diario te espera. ¿Puedes superar tu récord?',
        data: { type: 'daily_challenge' },
      },
      trigger: {
        type: 'daily',
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  } catch {
    // Silently fail — notifications are non-critical
  }
}

/**
 * Schedule a streak reminder if player hasn't played today.
 * Fires at 21:00 if streak is active.
 */
export async function scheduleStreakReminder(currentStreak: number): Promise<void> {
  const notif = await getNotifications();
  if (!notif || currentStreak <= 0) return;

  try {
    await notif.scheduleNotificationAsync({
      content: {
        title: `Racha de ${currentStreak} días en peligro`,
        body: 'Juega una partida hoy para mantener tu racha activa.',
        data: { type: 'streak_reminder' },
      },
      trigger: {
        type: 'daily',
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
  } catch {
    // Silently fail
  }
}

/**
 * Cancel all scheduled daily reminders.
 */
export async function cancelDailyReminder(): Promise<void> {
  const notif = await getNotifications();
  if (!notif) return;

  try {
    await notif.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silently fail
  }
}
