import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { COLORS } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { SKINS, SKIN_LIST, type SkinId } from '@/engine/SkinSystem';
import Animated, { FadeIn } from 'react-native-reanimated';
import { trackEvent } from '@/services/analytics';

interface EchoesPack {
  id: string;
  amount: number;
  price: string;
  bonus: string | null;
  accent: string;
  popular?: boolean;
}

const ECHOES_PACKS: EchoesPack[] = [
  { id: 'small', amount: 100, price: '$0.99', bonus: null, accent: COLORS.cyan },
  { id: 'medium', amount: 500, price: '$3.99', bonus: '+50 gratis', accent: COLORS.yellow, popular: true },
  { id: 'large', amount: 1500, price: '$9.99', bonus: '+300 gratis', accent: COLORS.violet },
];

export default function ShopScreen() {
  const { echoes } = usePlayerStore();
  const { activeSkin, ownedSkins, setActiveSkin, unlockSkin } = useSettingsStore();
  const addEchoes = usePlayerStore((s) => s.addEchoes);

  const handleBuyPack = (pack: EchoesPack) => {
    // TODO: Replace with RevenueCat purchase when integrated
    const confirm = () => {
      addEchoes(pack.amount + (pack.bonus ? parseInt(pack.bonus) || 0 : 0));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Comprar ${pack.amount} Echoes por ${pack.price}? (Demo: se añadirán gratis)`)) {
        confirm();
      }
    } else {
      Alert.alert('Comprar Echoes', `¿Comprar ${pack.amount} Echoes por ${pack.price}?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Comprar', onPress: confirm },
      ]);
    }
  };

  useEffect(() => {
    trackEvent({ type: 'shop_view' });
  }, []);

  const handleBuySkin = (skinId: SkinId) => {
    const skin = SKINS[skinId];
    if (ownedSkins.includes(skinId)) {
      setActiveSkin(skinId);
      return;
    }
    if (echoes < skin.cost) return;

    const confirm = () => {
      const playerStore = usePlayerStore.getState();
      if (playerStore.spendEchoes(skin.cost)) {
        unlockSkin(skinId);
        setActiveSkin(skinId);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Comprar ${skin.name} por ${skin.cost} ◆?`)) confirm();
    } else {
      Alert.alert('Comprar Skin', `¿Comprar ${skin.name} por ${skin.cost} ◆?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Comprar', onPress: confirm },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>TIENDA</Text>

        {/* Echoes balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TUS ECHOES</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceIcon}>◆</Text>
            <Text style={styles.balanceValue}>{echoes.toLocaleString()}</Text>
          </View>
        </View>

        {/* EchoPass banner */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Pressable style={styles.passBanner}>
            <View style={styles.passHeader}>
              <Text style={styles.passIcon}>⚡</Text>
              <View>
                <Text style={styles.passTitle}>ECHOPASS</Text>
                <Text style={styles.passPrice}>$4.99/mes</Text>
              </View>
              <View style={styles.passBadge}>
                <Text style={styles.passBadgeText}>PRONTO</Text>
              </View>
            </View>
            <View style={styles.passPerks}>
              <Text style={styles.passPerk}>✓ 500 Echoes mensuales</Text>
              <Text style={styles.passPerk}>✓ Skins exclusivas</Text>
              <Text style={styles.passPerk}>✓ Sin anuncios</Text>
              <Text style={styles.passPerk}>✓ Badge dorado en leaderboard</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Echoes Packs */}
        <Text style={styles.sectionTitle}>PACKS DE ECHOES</Text>
        <View style={styles.packsRow}>
          {ECHOES_PACKS.map((pack) => (
            <Pressable
              key={pack.id}
              style={[
                styles.packCard,
                pack.popular && styles.packPopular,
                { borderColor: pack.accent },
              ]}
              onPress={() => handleBuyPack(pack)}
            >
              {pack.popular && (
                <View style={[styles.popularBadge, { backgroundColor: pack.accent }]}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
              <Text style={styles.packIcon}>◆</Text>
              <Text style={[styles.packAmount, { color: pack.accent }]}>
                {pack.amount.toLocaleString()}
              </Text>
              {pack.bonus && (
                <Text style={[styles.packBonus, { color: pack.accent }]}>{pack.bonus}</Text>
              )}
              <View style={[styles.packPriceBtn, { backgroundColor: pack.accent }]}>
                <Text style={styles.packPrice}>{pack.price}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Grid Skins */}
        <Text style={styles.sectionTitle}>SKINS DE CUADRÍCULA</Text>
        <View style={styles.skinsGrid}>
          {SKIN_LIST.map((skinId) => {
            const skin = SKINS[skinId];
            const owned = ownedSkins.includes(skinId);
            const isActive = activeSkin === skinId;
            const canBuy = !owned && echoes >= skin.cost;

            return (
              <Pressable
                key={skinId}
                style={[
                  styles.skinCard,
                  isActive && styles.skinActive,
                  !owned && !canBuy && styles.skinLocked,
                ]}
                onPress={() => handleBuySkin(skinId)}
                disabled={!owned && !canBuy}
              >
                {/* Skin preview: mini grid */}
                <View style={styles.skinPreviewGrid}>
                  {[0, 1, 2, 3].map((i) => {
                    const colors = Object.values(skin.colors);
                    return (
                      <View
                        key={i}
                        style={[
                          styles.skinPreviewCell,
                          {
                            backgroundColor: skin.cell.idleBg,
                            borderColor: colors[i],
                            borderRadius: skin.cell.borderRadius / 2,
                            borderWidth: skin.cell.borderWidth,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={styles.skinPreviewEmoji}>{skin.preview}</Text>
                <Text style={[styles.skinName, isActive && { color: COLORS.cyan }]}>
                  {skin.name}
                </Text>
                <Text style={styles.skinDesc}>{skin.description}</Text>
                {!owned && (
                  <Text style={[styles.skinCost, canBuy && { color: COLORS.yellow }]}>
                    {skin.cost} ◆
                  </Text>
                )}
                {isActive && <Text style={styles.skinStatus}>EQUIPADO</Text>}
                {owned && !isActive && <Text style={styles.skinStatusOwned}>USAR</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Rewarded Ad placeholder */}
        <View style={styles.adCard}>
          <Text style={styles.adIcon}>🎬</Text>
          <View style={styles.adContent}>
            <Text style={styles.adTitle}>VER ANUNCIO</Text>
            <Text style={styles.adDesc}>Mira un video y gana 10 ◆ gratis</Text>
          </View>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>PRONTO</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.yellow,
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: COLORS.yellow,
    textShadowRadius: 10,
  },
  balanceCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 3,
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceIcon: {
    fontSize: 24,
    color: COLORS.cyan,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.cyan,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 12,
  },
  passBanner: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.yellow,
    marginBottom: 24,
    // @ts-ignore web
    boxShadow: `0 0 20px rgba(255, 209, 102, 0.1)`,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  passIcon: {
    fontSize: 28,
  },
  passTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.yellow,
    letterSpacing: 4,
  },
  passPrice: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  passBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.yellow,
    letterSpacing: 2,
  },
  passPerks: {
    gap: 6,
  },
  passPerk: {
    fontSize: 12,
    color: '#aaa',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 3,
    marginBottom: 12,
  },
  packsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  packCard: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  packPopular: {
    // @ts-ignore web
    boxShadow: `0 0 20px rgba(255, 209, 102, 0.1)`,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  popularText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 2,
  },
  packIcon: {
    fontSize: 24,
    color: COLORS.cyan,
    marginTop: 8,
    marginBottom: 4,
  },
  packAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  packBonus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  packPriceBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  packPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#07080f',
  },
  skinsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  skinCard: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skinActive: {
    borderColor: COLORS.cyan,
    // @ts-ignore web
    boxShadow: `0 0 16px rgba(0, 245, 212, 0.1)`,
  },
  skinLocked: {
    opacity: 0.5,
  },
  skinPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 52,
    gap: 3,
    marginBottom: 8,
  },
  skinPreviewCell: {
    width: 23,
    height: 23,
  },
  skinPreviewEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  skinName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ccc',
    letterSpacing: 2,
    marginBottom: 3,
  },
  skinDesc: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  skinCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  skinStatus: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 2,
    marginTop: 4,
  },
  skinStatusOwned: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 2,
    marginTop: 4,
  },
  adCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  adIcon: {
    fontSize: 28,
  },
  adContent: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ccc',
    letterSpacing: 2,
  },
  adDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  adBadge: {
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 2,
  },
});
