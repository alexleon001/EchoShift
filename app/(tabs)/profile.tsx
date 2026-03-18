import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { COLORS } from '@/constants/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { signOut } from '@/services/auth';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { getAllBestScores, getAllStats, getDailyStreak, getLongestStreak } from '@/utils/storage';
import { SKINS, SKIN_LIST, type SkinId } from '@/engine/SkinSystem';

const RANK_COLORS: Record<string, string> = {
  Bronce: '#cd7f32',
  Plata: '#c0c0c0',
  Oro: '#ffd700',
  Platino: '#e5e4e2',
  Diamante: '#b9f2ff',
};

const RANK_THRESHOLDS: { name: string; xp: number }[] = [
  { name: 'Bronce', xp: 0 },
  { name: 'Plata', xp: 1000 },
  { name: 'Oro', xp: 5000 },
  { name: 'Platino', xp: 15000 },
  { name: 'Diamante', xp: 40000 },
];

function getRankProgress(xp: number): { current: string; next: string | null; progress: number } {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i]!.xp) {
      const next = RANK_THRESHOLDS[i + 1];
      if (!next) return { current: RANK_THRESHOLDS[i]!.name, next: null, progress: 1 };
      const range = next.xp - RANK_THRESHOLDS[i]!.xp;
      const progress = (xp - RANK_THRESHOLDS[i]!.xp) / range;
      return { current: RANK_THRESHOLDS[i]!.name, next: next.name, progress: Math.min(progress, 1) };
    }
  }
  return { current: 'Bronce', next: 'Plata', progress: 0 };
}

function SettingToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={settingStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <Text style={settingStyles.label}>{label}</Text>
      <View style={[settingStyles.toggle, value && settingStyles.toggleOn]}>
        <View style={[settingStyles.knob, value && settingStyles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 27, 46, 0.5)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1b2e',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: 'rgba(0, 245, 212, 0.3)',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
  },
  knobOn: {
    backgroundColor: COLORS.cyan,
    alignSelf: 'flex-end',
  },
});

export default function ProfileScreen() {
  const { username, rank, totalXp, echoes, gamesPlayed } = usePlayerStore();
  const { soundEnabled, hapticsEnabled, reducedMotion, toggleSound, toggleHaptics, toggleReducedMotion, activeSkin, ownedSkins, setActiveSkin, unlockSkin } = useSettingsStore();
  const bestScores = getAllBestScores();
  const stats = getAllStats();
  const currentStreak = getDailyStreak();
  const longestStreak = getLongestStreak();
  const rankColor = RANK_COLORS[rank] ?? COLORS.yellow;
  const rankProgress = getRankProgress(totalXp);

  async function handleLogout() {
    await signOut();
  }

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>PERFIL</Text>

        <View style={styles.card}>
          <View style={[styles.rankCircle, { borderColor: rankColor }]}>
            <Text style={[styles.rankInitial, { color: rankColor }]}>
              {(username || 'P')[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{username || 'Player'}</Text>
          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
          </View>
          {rankProgress.next && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${rankProgress.progress * 100}%` as any,
                      backgroundColor: RANK_COLORS[rankProgress.next] ?? COLORS.cyan,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {rankProgress.next} en {(RANK_THRESHOLDS.find((r) => r.name === rankProgress.next)!.xp - totalXp).toLocaleString()} XP
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalXp.toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP TOTAL</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.yellow }]}>{echoes}</Text>
            <Text style={styles.statLabel}>ECHOES</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.violet }]}>
              {gamesPlayed}
            </Text>
            <Text style={styles.statLabel}>PARTIDAS</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>MEJORES PUNTAJES</Text>
        <View style={styles.scoresRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMode}>ENDLESS</Text>
            <Text style={[styles.scoreVal, { color: COLORS.cyan }]}>
              {bestScores.endless > 0 ? bestScores.endless.toLocaleString() : '—'}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMode}>BLITZ</Text>
            <Text style={[styles.scoreVal, { color: COLORS.yellow }]}>
              {bestScores.blitz > 0 ? bestScores.blitz.toLocaleString() : '—'}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreMode}>DAILY</Text>
            <Text style={[styles.scoreVal, { color: COLORS.magenta }]}>
              {bestScores.daily > 0 ? bestScores.daily.toLocaleString() : '—'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
        <View style={styles.statsDetailGrid}>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>{stats.totalGames}</Text>
            <Text style={styles.statsDetailLabel}>Partidas</Text>
          </View>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>{stats.totalScore.toLocaleString()}</Text>
            <Text style={styles.statsDetailLabel}>Puntos Total</Text>
          </View>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>{stats.perfectRounds}</Text>
            <Text style={styles.statsDetailLabel}>Perfectas</Text>
          </View>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>x{stats.highestCombo}</Text>
            <Text style={styles.statsDetailLabel}>Max Combo</Text>
          </View>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>
              {stats.totalTaps > 0 ? `${Math.round((stats.correctTaps / stats.totalTaps) * 100)}%` : '—'}
            </Text>
            <Text style={styles.statsDetailLabel}>Precisión</Text>
          </View>
          <View style={styles.statsDetailItem}>
            <Text style={styles.statsDetailValue}>{currentStreak}</Text>
            <Text style={styles.statsDetailLabel}>Racha</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SKINS</Text>
        <View style={styles.skinsRow}>
          {SKIN_LIST.map((skinId) => {
            const skin = SKINS[skinId];
            const owned = ownedSkins.includes(skinId);
            const isActive = activeSkin === skinId;
            const canBuy = !owned && echoes >= skin.cost;

            const handleSkinPress = () => {
              if (owned) {
                setActiveSkin(skinId);
              } else if (canBuy) {
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
              }
            };

            return (
              <TouchableOpacity
                key={skinId}
                style={[
                  styles.skinCard,
                  isActive && styles.skinCardActive,
                  !owned && !canBuy && styles.skinCardLocked,
                ]}
                onPress={handleSkinPress}
                activeOpacity={0.7}
                disabled={!owned && !canBuy}
              >
                <Text style={styles.skinPreview}>{skin.preview}</Text>
                <Text style={[styles.skinName, isActive && { color: COLORS.cyan }]}>{skin.name}</Text>
                {!owned && (
                  <Text style={[styles.skinCost, canBuy && { color: COLORS.yellow }]}>
                    {skin.cost} ◆
                  </Text>
                )}
                {isActive && <Text style={styles.skinEquipped}>EQUIPADO</Text>}
                {owned && !isActive && <Text style={styles.skinOwned}>DESBLOQUEADO</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>AJUSTES</Text>
        <View style={styles.settingsCard}>
          <SettingToggle label="Sonido" value={soundEnabled} onToggle={toggleSound} />
          <SettingToggle label="Vibración" value={hapticsEnabled} onToggle={toggleHaptics} />
          <SettingToggle label="Menos animaciones" value={reducedMotion} onToggle={toggleReducedMotion} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
    color: COLORS.cyan,
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 10,
  },
  card: {
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  rankCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rankInitial: {
    fontSize: 28,
    fontWeight: '900',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  progressContainer: {
    width: '100%',
    marginTop: 14,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#1a1b2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    color: '#555',
    marginTop: 6,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 3,
    marginBottom: 10,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreMode: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statsDetailItem: {
    width: '30%',
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsDetailValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  statsDetailLabel: {
    fontSize: 9,
    color: '#555',
    marginTop: 3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skinsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  skinCard: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skinCardActive: {
    borderColor: COLORS.cyan,
  },
  skinCardLocked: {
    opacity: 0.5,
  },
  skinPreview: {
    fontSize: 28,
    marginBottom: 6,
  },
  skinName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ccc',
    letterSpacing: 2,
    marginBottom: 4,
  },
  skinCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  skinEquipped: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 2,
    marginTop: 2,
  },
  skinOwned: {
    fontSize: 8,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 1,
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.4)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(247, 37, 133, 0.05)',
  },
  logoutText: {
    color: COLORS.magenta,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
});
