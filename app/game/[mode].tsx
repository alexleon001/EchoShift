import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/playerStore';
import { GridBoard } from '@/components/Grid/GridBoard';
import { HUD } from '@/components/HUD';
import { NeonBackground } from '@/components/Effects/NeonBackground';
import { ScreenFlash } from '@/components/Effects/ScreenFlash';
import { ComboPulse } from '@/components/Effects/ComboPulse';
import { Countdown } from '@/components/Effects/Countdown';
import { RoundBanner } from '@/components/Effects/RoundBanner';
import { ComboPopup } from '@/components/Effects/ComboPopup';
import { ScorePopup } from '@/components/Effects/ScorePopup';
import { PerfectBanner } from '@/components/Effects/PerfectBanner';
import { ComboBreak } from '@/components/Effects/ComboBreak';
import { ComboParticles } from '@/components/Effects/ComboParticles';
import { PowerUpBar } from '@/components/PowerUpBar';
import { useEffect, useRef, useState } from 'react';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { submitScore } from '@/services/supabase';
import { saveBestScore, getBestScore, setDailyPlayed, saveGameStats, updateDailyStreak, checkLongestStreak } from '@/utils/storage';
import { triggerGameOver } from '@/utils/haptics';
import { initAudio, startMusic, stopMusic, setMusicIntensity, setMusicPadVolume } from '@/utils/audio';
import { useCountUp } from '@/hooks/useCountUp';
import { trackEvent } from '@/services/analytics';
import { shareScore } from '@/services/sharing';

type GameMode = 'endless' | 'blitz' | 'daily' | 'duo';

export default function GameScreen() {
  const { mode } = useLocalSearchParams<{ mode: GameMode }>();
  const router = useRouter();
  const { startGame, phase, score, combo, roundNumber, difficulty, endGame, reset, setBlitzTime, blitzTimeRemaining, totalTaps, correctTaps, perfectRounds } = useGameStore();
  const addXp = usePlayerStore((s) => s.addXp);
  const addEchoes = usePlayerStore((s) => s.addEchoes);
  const incrementGamesPlayed = usePlayerStore((s) => s.incrementGamesPlayed);
  const playerId = usePlayerStore((s) => s.id);
  const blitzInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const bestScore = useRef<number>(0);
  const echoesEarnedRef = useRef<number>(0);
  const [showCountdown, setShowCountdown] = useState(true);
  const animatedScore = useCountUp(phase === 'gameOver' ? score : 0, 900, 600);

  // Initialize audio + load best score on mount
  useEffect(() => {
    initAudio();
    if (mode) {
      getBestScore(mode as GameMode).then((s) => { bestScore.current = s; });
    }
    return () => { stopMusic(); };
  }, [mode]);

  // Start music when game starts, stop on game over
  useEffect(() => {
    if (phase === 'observe' && !showCountdown) {
      startMusic();
      setMusicPadVolume(0.04); // Lower during observe
    } else if (phase === 'replicate') {
      setMusicPadVolume(0.06); // Full during replicate
    } else if (phase === 'gameOver') {
      stopMusic();
    }
  }, [phase, showCountdown]);

  // Music reacts to combo multiplier
  useEffect(() => {
    if (phase === 'replicate') {
      setMusicIntensity(combo.multiplier);
    }
  }, [combo.multiplier, phase]);

  // Start game after countdown
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    if (mode) {
      startGame(mode as GameMode);
      trackEvent({ type: 'game_start', mode });
    }
  };

  // Blitz mode countdown timer
  useEffect(() => {
    if (mode !== 'blitz' || phase === 'gameOver' || phase === 'idle') {
      if (blitzInterval.current) {
        clearInterval(blitzInterval.current);
        blitzInterval.current = null;
      }
      return;
    }

    blitzInterval.current = setInterval(() => {
      const remaining = useGameStore.getState().blitzTimeRemaining;
      if (remaining <= 0) {
        endGame();
        if (blitzInterval.current) clearInterval(blitzInterval.current);
      } else {
        setBlitzTime(remaining - 100);
      }
    }, 100);

    return () => {
      if (blitzInterval.current) clearInterval(blitzInterval.current);
    };
  }, [mode, phase]);

  // Award XP and save score on game over
  useEffect(() => {
    if (phase === 'gameOver' && mode) {
      triggerGameOver();
      trackEvent({ type: 'game_end', mode, score, duration: mode === 'blitz' ? 60000 - blitzTimeRemaining : 0 });
      const xpGained = Math.max(10, 15 * difficulty.difficulty);
      addXp(xpGained);
      incrementGamesPlayed();

      // Award echoes: base 5 + 1 per round + bonus for high combos
      const echoesEarned = 5 + roundNumber + (combo.multiplier >= 5 ? 10 : combo.multiplier >= 3 ? 5 : 0);
      echoesEarnedRef.current = echoesEarned;
      addEchoes(echoesEarned);

      // Track daily streak
      updateDailyStreak();
      checkLongestStreak();

      // Persist lifetime stats
      saveGameStats({
        score,
        perfectRounds,
        maxCombo: combo.multiplier,
        totalTaps,
        correctTaps,
      });

      if (score > bestScore.current) {
        bestScore.current = score;
        saveBestScore(mode as GameMode, score);
      }

      if (mode === 'daily') {
        setDailyPlayed();
      }

      if (playerId) {
        submitScore({
          playerId,
          mode: mode as GameMode,
          score,
          maxCombo: combo.multiplier,
          cellsHit: combo.correctCount,
          durationMs: mode === 'blitz' ? 60_000 - blitzTimeRemaining : 0,
          gridSize: difficulty.gridSize as 4 | 5 | 6,
        }).catch(() => {});
      }
    }
  }, [phase]);

  const handleRetry = () => {
    reset();
    setShowCountdown(true);
  };

  const navigateHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleExit = () => {
    const isPlaying = phase === 'observe' || phase === 'replicate' || phase === 'evolve';
    if (isPlaying) {
      if (Platform.OS === 'web') {
        if (window.confirm('¿Salir de la partida? Perderás tu progreso.')) {
          endGame();
          navigateHome();
        }
      } else {
        Alert.alert('Salir', '¿Salir de la partida? Perderás tu progreso.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => { endGame(); navigateHome(); } },
        ]);
      }
    } else {
      navigateHome();
    }
  };

  const [shareLabel, setShareLabel] = useState('COMPARTIR');
  const playerName = usePlayerStore((s) => s.username);

  const handleShare = async () => {
    const accuracy = totalTaps > 0 ? Math.round((correctTaps / totalTaps) * 100) : 0;
    const result = await shareScore({
      mode: mode ?? 'endless',
      score,
      combo: combo.multiplier,
      round: roundNumber,
      accuracy,
      playerName: playerName || 'Anónimo',
    });
    if (result === 'copied') {
      setShareLabel('COPIADO!');
      setTimeout(() => setShareLabel('COMPARTIR'), 2000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background effects */}
      <NeonBackground />

      {/* Combo edge glow */}
      <ComboPulse />

      {/* Screen flash on events */}
      <ScreenFlash />

      {/* Round banner */}
      <RoundBanner />

      {/* Combo milestone popups */}
      <ComboPopup />

      {/* Floating score popups */}
      <ScorePopup />

      {/* Perfect round banner */}
      <PerfectBanner />

      {/* Combo break effect */}
      <ComboBreak />

      {/* Combo streak particles */}
      <ComboParticles />

      {/* Countdown overlay */}
      {showCountdown && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      <HUD mode={mode as GameMode} />

      {/* Phase indicator */}
      <View style={styles.phaseRow}>
        {phase === 'observe' && (
          <Animated.Text style={styles.phaseObserve} entering={FadeIn.duration(150)}>
            OBSERVA
          </Animated.Text>
        )}
        {phase === 'replicate' && (
          <Animated.Text style={styles.phaseReplicate} entering={FadeIn.duration(150)}>
            TU TURNO
          </Animated.Text>
        )}
      </View>

      <View style={styles.gridContainer}>
        <GridBoard />
      </View>

      {/* Power-up buttons */}
      <PowerUpBar />

      {/* Back button — always visible, confirms if mid-game */}
      {phase !== 'gameOver' && (
        <Pressable style={styles.backButton} onPress={handleExit}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
      )}

      {phase === 'gameOver' && (
        <Animated.View style={styles.overlay} entering={FadeIn.duration(400)}>
          <Animated.Text
            style={styles.gameOverText}
            entering={FadeIn.delay(200).duration(500)}
          >
            FIN DEL JUEGO
          </Animated.Text>

          <Animated.View
            style={styles.scoreCard}
            entering={SlideInDown.delay(400).duration(500).springify()}
          >
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>PUNTAJE</Text>
              <Text style={styles.scoreValue}>{animatedScore.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statsGrid}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{roundNumber}</Text>
                <Text style={styles.miniStatLabel}>Rondas</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>x{combo.multiplier}</Text>
                <Text style={styles.miniStatLabel}>Combo</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{difficulty.difficulty}</Text>
                <Text style={styles.miniStatLabel}>Nivel</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>
                  {totalTaps > 0 ? `${Math.round((correctTaps / totalTaps) * 100)}%` : '—'}
                </Text>
                <Text style={styles.miniStatLabel}>Precisión</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {score >= bestScore.current && score > 0 && (
              <Animated.Text
                style={styles.newBest}
                entering={FadeIn.delay(900).duration(400)}
              >
                NUEVO RECORD!
              </Animated.Text>
            )}
            <View style={styles.rewardsRow}>
              <Text style={styles.xpGained}>+{Math.max(10, 15 * difficulty.difficulty)} XP</Text>
              <Text style={styles.echoesGained}>+{echoesEarnedRef.current} ◆</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={styles.buttonRow}
            entering={FadeIn.delay(800).duration(400)}
          >
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>REINTENTAR</Text>
            </Pressable>
            <Pressable style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitText}>SALIR</Text>
            </Pressable>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(1000).duration(300)}>
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareText}>{shareLabel}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    overflow: 'hidden',
  },
  phaseRow: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
  },
  phaseObserve: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.yellow,
    letterSpacing: 6,
    textShadowColor: COLORS.yellow,
    textShadowRadius: 10,
  },
  phaseReplicate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 6,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 10,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 27, 46, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 20,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.magenta,
    letterSpacing: 4,
    marginBottom: 28,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 20,
  },
  scoreCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    marginBottom: 28,
    // @ts-ignore web
    boxShadow: `0 0 30px rgba(0, 245, 212, 0.08), inset 0 0 20px rgba(0, 245, 212, 0.03)`,
  },
  scoreRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 3,
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1b2e',
    marginVertical: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  newBest: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.magenta,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
    textShadowColor: COLORS.magenta,
    textShadowRadius: 10,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    alignItems: 'center',
  },
  xpGained: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.yellow,
    textAlign: 'center',
  },
  echoesGained: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cyan,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  retryButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    // @ts-ignore web
    boxShadow: `0 0 20px ${COLORS.cyan}60, 0 0 40px ${COLORS.cyan}20`,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#07080f',
    letterSpacing: 2,
  },
  exitButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  exitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 2,
  },
  shareButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  shareText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 2,
    textDecorationLine: 'underline',
  },
});
