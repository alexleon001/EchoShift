/**
 * Error Reporting — Crash reporting and error tracking.
 *
 * Currently uses console logging in development.
 * When Sentry is configured, it will automatically capture errors.
 *
 * Setup: Install @sentry/react-native and add DSN to config.
 * Then uncomment the Sentry initialization below.
 */

import { Platform } from 'react-native';
import { config } from '@/constants/config';

let sentryInitialized = false;

/**
 * Initialize error reporting.
 * Call once on app startup.
 */
export function initErrorReporting(): void {
  if (sentryInitialized) return;

  // When Sentry is installed, uncomment:
  // try {
  //   const Sentry = require('@sentry/react-native');
  //   Sentry.init({
  //     dsn: config.sentryDsn,
  //     environment: config.environment,
  //     enabled: config.environment !== 'development',
  //     tracesSampleRate: 0.2,
  //     beforeSend(event: any) {
  //       // Don't send events from dev
  //       if (__DEV__) return null;
  //       return event;
  //     },
  //   });
  //   sentryInitialized = true;
  // } catch {
  //   // Sentry not installed — fallback to console
  // }

  if (__DEV__) {
    console.log('[ErrorReporting] Using console logging (Sentry not configured)');
  }
}

/**
 * Capture an exception.
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (__DEV__) {
    console.error('[Error]', error.message, context);
    return;
  }

  // When Sentry is installed:
  // try {
  //   const Sentry = require('@sentry/react-native');
  //   if (context) {
  //     Sentry.withScope((scope: any) => {
  //       scope.setExtras(context);
  //       Sentry.captureException(error);
  //     });
  //   } else {
  //     Sentry.captureException(error);
  //   }
  // } catch {}
}

/**
 * Log a breadcrumb for debugging context.
 */
export function addBreadcrumb(message: string, data?: Record<string, any>): void {
  if (__DEV__) {
    console.log('[Breadcrumb]', message, data);
    return;
  }

  // When Sentry is installed:
  // try {
  //   const Sentry = require('@sentry/react-native');
  //   Sentry.addBreadcrumb({
  //     message,
  //     data,
  //     level: 'info',
  //   });
  // } catch {}
}

/**
 * Set user context for error reports.
 */
export function setUser(id: string, username?: string): void {
  // When Sentry is installed:
  // try {
  //   const Sentry = require('@sentry/react-native');
  //   Sentry.setUser({ id, username });
  // } catch {}
}
