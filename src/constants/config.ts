/** App configuration — reads from environment variables */

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  environment: (process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development') as
    | 'development'
    | 'staging'
    | 'production',
} as const;

export const FEATURE_FLAGS = {
  dailyChallengeEnabled: true,
  blitzModeEnabled: true,
  duoModeEnabled: true,
  creativeModeEnabled: false,
  adsEnabled: false,
} as const;
