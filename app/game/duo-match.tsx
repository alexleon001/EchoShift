import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { NeonBackground } from '@/components/Effects/NeonBackground';
import { usePlayerStore } from '@/store/playerStore';
import { useDuoStore } from '@/store/duoStore';
import { GridBoard } from '@/components/Grid/GridBoard';
import { useGameStore } from '@/store/gameStore';
import {
  sendTap,
  sendRoundComplete,
  leaveDuo,
  disconnectDuo,
  type ServerMessage,
} from '@/services/duoSocket';
import { connectDuo } from '@/services/duoSocket';
import { trackEvent } from '@/services/analytics';

export default function DuoMatchScreen() {
  const router = useRouter();
  const username = usePlayerStore((s) => s.username);
  const { opponentName, roomCode } = useDuoStore();
  const duoState = useDuoStore();
  const setState = useDuoStore((s) => s.setState);
  const addRoundResult = useDuoStore((s) => s.addRoundResult);
  const resetDuo = useDuoStore((s) => s.reset);

  const { startGame, phase: gamePhase, score, combo, roundNumber, endGame, reset: resetGame, totalTaps, correctTaps } = useGameStore();

  const [countdown, setCountdown] = useState(0);
  const [duoPhase, setDuoPhase] = useState<'waiting' | 'countdown' | 'playing' | 'roundEnd' | 'matchEnd'>('waiting');
  const [roundResult, setRoundResult] = useState<{ yourScore: number; opponentScore: number; yourErrors: number; opponentErrors: number } | null>(null);
  const [matchResult, setMatchResult] = useState<{ winner: string; yourTotal: number; opponentTotal: number } | null>(null);
  const [currentRound, setCurrentRound] = useState(0);

  // Opponent progress bar
  const opponentProgress = useSharedValue(0);
  const opponentScoreRef = useRef(0);
  const opponentComboRef = useRef(0);

  const opponentBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(opponentProgress.value, 100)}%`,
  }));

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'countdown':
        setDuoPhase('countdown');
        setCountdown(msg.seconds);
        break;

      case 'roundStart':
        setCurrentRound(msg.round);
        setDuoPhase('playing');
        setCountdown(0);
        // Inject pattern into game store and start
        setState({ pattern: msg.pattern, round: msg.round, difficulty: msg.difficulty });
        startGame('duo', msg.pattern);
        break;

      case 'opponentTap':
        opponentProgress.value = withTiming(msg.progress, { duration: 150 });
        opponentScoreRef.current = msg.score;
        opponentComboRef.current = msg.combo;
        setState({ opponentProgress: msg.progress, opponentScore: msg.score, opponentCombo: msg.combo });
        break;

      case 'roundEnd':
        setDuoPhase('roundEnd');
        setRoundResult(msg);
        addRoundResult({
          round: currentRound,
          yourScore: msg.yourScore,
          opponentScore: msg.opponentScore,
          yourErrors: msg.yourErrors,
          opponentErrors: msg.opponentErrors,
        });
        opponentProgress.value = 0;
        endGame();
        break;

      case 'matchEnd':
        setDuoPhase('matchEnd');
        setMatchResult(msg);
        setState({ matchWinner: msg.winner, yourTotal: msg.yourTotal, opponentTotal: msg.opponentTotal });
        trackEvent({ type: 'duo_match_end', winner: msg.winner, yourTotal: msg.yourTotal, opponentTotal: msg.opponentTotal });
        break;

      case 'opponentLeft':
        setDuoPhase('matchEnd');
        setMatchResult({ winner: username, yourTotal: score, opponentTotal: 0 });
        break;

      case 'error':
        // Handle error during match
        break;
    }
  }, [currentRound, username, score]);

  useEffect(() => {
    // Re-register message handler
    connectDuo(handleMessage).catch(() => {
      router.replace('/game/duo-lobby');
    });

    trackEvent({ type: 'duo_match_start' });

    return () => {
      resetGame();
    };
  }, [handleMessage]);

  // Notify server when player completes their replicate phase
  useEffect(() => {
    if (gamePhase === 'gameOver' && duoPhase === 'playing') {
      sendRoundComplete(score, combo.multiplier, totalTaps - correctTaps);
    }
  }, [gamePhase, duoPhase]);

  // Send taps to server during replicate phase
  useEffect(() => {
    if (gamePhase === 'replicate' && duoPhase === 'playing') {
      const progress = totalTaps > 0 ? Math.round((correctTaps / Math.max(totalTaps, 1)) * 100) : 0;
      sendTap(true, score, combo.multiplier, progress);
    }
  }, [correctTaps, totalTaps, score, combo.multiplier, gamePhase, duoPhase]);

  const handleExit = () => {
    leaveDuo();
    resetDuo();
    resetGame();
    router.replace('/');
  };

  const handlePlayAgain = () => {
    // Go back to lobby to create a new room
    resetDuo();
    resetGame();
    router.replace('/game/duo-lobby');
  };

  return (
    <View style={styles.container}>
      <NeonBackground />

      {/* Duo HUD — opponent info bar */}
      <View style={styles.duoHud}>
        <View style={styles.playerSide}>
          <Text style={styles.playerName}>{username}</Text>
          <Text style={styles.playerScore}>{score.toLocaleString()}</Text>
        </View>
        <View style={styles.vsBox}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.roundText}>R{currentRound}/5</Text>
        </View>
        <View style={[styles.playerSide, styles.opponentSide]}>
          <Text style={styles.opponentNameText}>{opponentName}</Text>
          <Text style={styles.opponentScoreText}>{opponentScoreRef.current.toLocaleString()}</Text>
        </View>
      </View>

      {/* Opponent progress bar */}
      {duoPhase === 'playing' && (
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Oponente</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, opponentBarStyle]} />
          </View>
        </View>
      )}

      {/* Countdown overlay */}
      {duoPhase === 'countdown' && (
        <View style={styles.countdownOverlay}>
          <Animated.Text style={styles.countdownNumber} entering={FadeIn.duration(200)} key={countdown}>
            {countdown}
          </Animated.Text>
          <Text style={styles.countdownLabel}>Ronda {currentRound + 1}</Text>
        </View>
      )}

      {/* Game grid during playing */}
      {duoPhase === 'playing' && (
        <View style={styles.gridContainer}>
          <GridBoard />
        </View>
      )}

      {/* Phase indicator */}
      {duoPhase === 'playing' && (
        <View style={styles.phaseRow}>
          {gamePhase === 'observe' && (
            <Animated.Text style={styles.phaseObserve} entering={FadeIn.duration(150)}>
              OBSERVA
            </Animated.Text>
          )}
          {gamePhase === 'replicate' && (
            <Animated.Text style={styles.phaseReplicate} entering={FadeIn.duration(150)}>
              TU TURNO
            </Animated.Text>
          )}
        </View>
      )}

      {/* Round End overlay */}
      {duoPhase === 'roundEnd' && roundResult && (
        <View style={styles.resultOverlay}>
          <Animated.View style={styles.resultCard} entering={SlideInDown.duration(400).springify()}>
            <Text style={styles.resultTitle}>
              {roundResult.yourScore > roundResult.opponentScore ? 'GANASTE LA RONDA' :
               roundResult.yourScore < roundResult.opponentScore ? 'PERDISTE LA RONDA' : 'EMPATE'}
            </Text>
            <View style={styles.resultRow}>
              <View style={styles.resultSide}>
                <Text style={styles.resultLabel}>TÚ</Text>
                <Text style={styles.resultScore}>{roundResult.yourScore.toLocaleString()}</Text>
                <Text style={styles.resultErrors}>{roundResult.yourErrors} errores</Text>
              </View>
              <Text style={styles.resultVs}>vs</Text>
              <View style={styles.resultSide}>
                <Text style={styles.resultLabel}>{opponentName}</Text>
                <Text style={[styles.resultScore, { color: COLORS.magenta }]}>
                  {roundResult.opponentScore.toLocaleString()}
                </Text>
                <Text style={styles.resultErrors}>{roundResult.opponentErrors} errores</Text>
              </View>
            </View>
            <Text style={styles.nextRoundText}>Siguiente ronda en breve...</Text>
          </Animated.View>
        </View>
      )}

      {/* Match End overlay */}
      {duoPhase === 'matchEnd' && matchResult && (
        <View style={styles.resultOverlay}>
          <Animated.View style={styles.matchCard} entering={SlideInDown.delay(200).duration(500).springify()}>
            <Text style={[styles.matchTitle, matchResult.winner === username ? { color: COLORS.cyan } : { color: COLORS.magenta }]}>
              {matchResult.winner === username ? 'VICTORIA' :
               matchResult.winner === 'Empate' ? 'EMPATE' : 'DERROTA'}
            </Text>

            <View style={styles.matchScores}>
              <View style={styles.matchSide}>
                <Text style={styles.matchName}>{username}</Text>
                <Text style={styles.matchTotal}>{matchResult.yourTotal.toLocaleString()}</Text>
              </View>
              <Text style={styles.matchVs}>vs</Text>
              <View style={styles.matchSide}>
                <Text style={styles.matchName}>{opponentName}</Text>
                <Text style={[styles.matchTotal, { color: COLORS.magenta }]}>
                  {matchResult.opponentTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Round history */}
            <View style={styles.roundHistory}>
              {useDuoStore.getState().roundResults.map((r, i) => (
                <View key={i} style={styles.roundHistoryRow}>
                  <Text style={styles.roundHistoryLabel}>R{r.round}</Text>
                  <Text style={[styles.roundHistoryScore, r.yourScore >= r.opponentScore && { color: COLORS.cyan }]}>
                    {r.yourScore}
                  </Text>
                  <Text style={styles.roundHistoryDash}>—</Text>
                  <Text style={[styles.roundHistoryScore, r.opponentScore >= r.yourScore && { color: COLORS.magenta }]}>
                    {r.opponentScore}
                  </Text>
                </View>
              ))}
            </View>

            <Animated.View style={styles.matchButtons} entering={FadeIn.delay(600).duration(300)}>
              <Pressable style={styles.playAgainBtn} onPress={handlePlayAgain}>
                <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
              </Pressable>
              <Pressable style={styles.exitBtn} onPress={handleExit}>
                <Text style={styles.exitBtnText}>SALIR</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      )}

      {/* Waiting state */}
      {duoPhase === 'waiting' && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Preparando partida...</Text>
        </View>
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
  duoHud: {
    flexDirection: 'row',
    paddingTop: 50,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  playerSide: {
    flex: 1,
  },
  opponentSide: {
    alignItems: 'flex-end',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  playerScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  opponentNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.magenta,
    letterSpacing: 1,
  },
  opponentScoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  vsBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#555',
    letterSpacing: 2,
  },
  roundText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444',
    marginTop: 2,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#444',
    marginBottom: 3,
    textAlign: 'right',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(26, 27, 46, 0.6)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.magenta,
    borderRadius: 2,
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
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 8, 15, 0.85)',
    zIndex: 30,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.cyan,
    textShadowColor: COLORS.cyan,
    textShadowRadius: 30,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 3,
    marginTop: 12,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 8, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  resultCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.yellow,
    letterSpacing: 3,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  resultSide: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultScore: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  resultErrors: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
  },
  resultVs: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginHorizontal: 12,
  },
  nextRoundText: {
    fontSize: 11,
    color: '#555',
    marginTop: 16,
  },
  matchCard: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 24,
    textShadowRadius: 20,
  },
  matchScores: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  matchSide: {
    flex: 1,
    alignItems: 'center',
  },
  matchName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  matchTotal: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  matchVs: {
    fontSize: 16,
    fontWeight: '900',
    color: '#444',
    marginHorizontal: 12,
  },
  roundHistory: {
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1b2e',
    marginBottom: 20,
  },
  roundHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  roundHistoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    width: 24,
  },
  roundHistoryScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#666',
    width: 50,
    textAlign: 'center',
  },
  roundHistoryDash: {
    fontSize: 12,
    color: '#444',
  },
  matchButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  playAgainBtn: {
    backgroundColor: COLORS.magenta,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  playAgainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  exitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 2,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
});
