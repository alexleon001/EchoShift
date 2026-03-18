import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '@/constants/theme';
import { FEATURE_FLAGS } from '@/constants/config';
import { usePlayerStore } from '@/store/playerStore';
import { getAllBestScores, getSetting, saveSetting, wasDailyPlayedToday, getDailyStreak } from '@/utils/storage';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';
import { HowToPlay } from '@/components/HowToPlay';
import { Onboarding } from '@/components/Onboarding';
import { trackEvent } from '@/services/analytics';

type GameMode = 'endless' | 'blitz' | 'daily';

const MODES: { key: GameMode; label: string; description: string; icon: string; accent: string }[] = [
  { key: 'endless', label: 'ENDLESS', description: 'Sin límites. ¿Hasta dónde llegas?', icon: '∞', accent: COLORS.cyan },
  { key: 'blitz', label: 'BLITZ', description: '60 segundos. Máximo puntaje.', icon: '⚡', accent: COLORS.yellow },
  { key: 'daily', label: 'DAILY', description: 'Un patrón. Todos juegan.', icon: '◆', accent: COLORS.magenta },
];

export default function HomeScreen() {
  const router = useRouter();
  const { rank, totalXp } = usePlayerStore();
  const [bestScores, setBestScores] = useState<Record<GameMode, number>>({
    endless: 0, blitz: 0, daily: 0,
  });
  const [showHelp, setShowHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyPlayed, setDailyPlayed] = useState(false);
  const [streak, setStreak] = useState(0);

  // Show onboarding on first launch
  useEffect(() => {
    const seen = getSetting('onboardingSeen', false);
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const scores = getAllBestScores();
      setBestScores(scores);
      setDailyPlayed(wasDailyPlayedToday());
      setStreak(getDailyStreak());
    }, []),
  );

  const handlePlay = (mode: GameMode) => {
    router.push(`/game/${mode}`);
  };

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <View style={styles.header}>
        <Text style={styles.title}>ECHO</Text>
        <Text style={styles.titleAccent}>SHIFT</Text>
        <View style={styles.badgesRow}>
          <View style={styles.playerBadge}>
            <View style={[styles.rankDot, { backgroundColor: COLORS.yellow }]} />
            <Text style={styles.badgeRank}>{rank}</Text>
            <View style={styles.badgeDivider} />
            <Text style={styles.badgeXp}>{totalXp.toLocaleString()} XP</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{streak}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.modes}>
        {MODES.map((mode) => {
          const best = bestScores[mode.key] ?? 0;
          return (
            <Pressable
              key={mode.key}
              style={({ pressed }) => [
                styles.modeButton,
                { borderColor: pressed ? mode.accent : COLORS.border },
              ]}
              onPress={() => handlePlay(mode.key)}
            >
              <View style={styles.modeHeader}>
                <Text style={[styles.modeIcon, { color: mode.accent }]}>{mode.icon}</Text>
                <View style={styles.modeInfo}>
                  <View style={styles.modeLabelRow}>
                    <Text style={[styles.modeLabel, { color: mode.accent }]}>{mode.label}</Text>
                    {mode.key === 'daily' && dailyPlayed && (
                      <Text style={styles.playedBadge}>JUGADO</Text>
                    )}
                  </View>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
                {best > 0 && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestLabel}>BEST</Text>
                    <Text style={styles.bestScore}>{best.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Duo Mode button */}
      {FEATURE_FLAGS.duoModeEnabled && (
        <Pressable
          style={({ pressed }) => [
            styles.duoButton,
            pressed && { borderColor: COLORS.magenta },
          ]}
          onPress={() => router.push('/game/duo-lobby')}
        >
          <Text style={styles.duoIcon}>⚔</Text>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeLabel, { color: COLORS.magenta }]}>DUO</Text>
            <Text style={styles.modeDescription}>1v1 en tiempo real con amigos</Text>
          </View>
          <View style={styles.duoLiveBadge}>
            <Text style={styles.duoLiveText}>LIVE</Text>
          </View>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Pressable style={styles.helpBtn} onPress={() => setShowHelp(true)}>
          <Text style={styles.helpBtnText}>?</Text>
        </Pressable>
        <Text style={styles.footerText}>Toca un modo para jugar</Text>
      </View>

      <HowToPlay visible={showHelp} onClose={() => setShowHelp(false)} />
      <Onboarding
        visible={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          saveSetting('onboardingSeen', true);
          trackEvent({ type: 'onboarding_complete' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 10,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowRadius: 20,
  },
  titleAccent: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 10,
    marginTop: -4,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeRank: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.yellow,
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#333',
  },
  badgeXp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 50, 0.3)',
  },
  streakFire: {
    fontSize: 12,
  },
  streakCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff6432',
  },
  modes: {
    gap: 12,
  },
  modeButton: {
    backgroundColor: 'rgba(13, 14, 26, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  playedBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 1,
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  bestBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 2,
  },
  bestScore: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.yellow,
  },
  duoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(247, 37, 133, 0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.25)',
    marginTop: 12,
  },
  duoIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
    color: COLORS.magenta,
  },
  duoLiveBadge: {
    backgroundColor: 'rgba(247, 37, 133, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.magenta,
  },
  duoLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.magenta,
    letterSpacing: 2,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#333',
    letterSpacing: 2,
  },
  helpBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(13, 14, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  helpBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
});
