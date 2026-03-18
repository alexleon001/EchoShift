import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { config } from '@/constants/config';

const PRODUCTS = {
  ECHO_PASS_MONTHLY: 'echoshift_pass_monthly_499',
  ECHOES_SMALL: 'echoes_pack_100_099',
  ECHOES_MEDIUM: 'echoes_pack_500_399',
  ECHOES_LARGE: 'echoes_pack_1500_999',
  SKIN_PACK_NEON: 'skin_pack_neon_199',
} as const;

export async function initRevenueCat(): Promise<void> {
  const apiKey = Platform.OS === 'ios'
    ? config.revenueCatIosKey
    : config.revenueCatAndroidKey;

  if (!apiKey) return;
  Purchases.configure({ apiKey });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchaseEchoPass() {
  const offerings = await Purchases.getOfferings();
  const echoPass = offerings.current?.availablePackages.find(
    (p) => p.product.identifier === PRODUCTS.ECHO_PASS_MONTHLY,
  );

  if (!echoPass) throw new Error('EchoPass not found');
  return Purchases.purchasePackage(echoPass);
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.entitlements.active['echopass'] !== undefined;
}

export { PRODUCTS };
