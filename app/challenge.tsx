/**
 * Challenge Screen — Receives a challenge deep link and shows the challenger's score,
 * then lets the player start the same mode to try to beat it.
 *
 * Route: /challenge?mode=endless&score=1234&combo=5&round=10&accuracy=95&player=Username
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { NeonBackgroundStatic } from '@/components/Effects/NeonBackgroundStatic';

export default function ChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    score?: string;
    combo?: string;
    round?: string;
    accuracy?: string;
    player?: string;
  }>();

  const mode = params.mode ?? 'endless';
  const score = Number(params.score ?? 0);
  const combo = Number(params.combo ?? 0);
  const round = Number(params.round ?? 0);
  const accuracy = Number(params.accuracy ?? 0);
  const player = params.player ?? 'Anónimo';

  const modeLabel = mode === 'blitz' ? 'Blitz' : mode === 'daily' ? 'Daily' : 'Endless';
  const modeColor = mode === 'blitz' ? COLORS.yellow : mode === 'daily' ? COLORS.magenta : COLORS.cyan;

  const handleAccept = () => {
    router.replace(`/game/${mode}`);
  };

  const handleDecline = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.container}>
      <NeonBackgroundStatic />

      <Animated.Text style={styles.challengeLabel} entering={FadeIn.duration(400)}>
        DESAFÍO
      </Animated.Text>

      <Animated.View style={styles.card} entering={FadeInDown.delay(200).duration(500).springify()}>
        <Text style={styles.playerName}>{player}</Text>
        <Text style={styles.playerChallenge}>te desafía en</Text>
        <Text style={[styles.modeLabel, { color: modeColor }]}>{modeLabel.toUpperCase()}</Text>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: modeColor }]}>{score.toLocaleString()}</Text>
            <Text style={styles.statLabel}>PUNTAJE</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>x{combo}</Text>
            <Text style={styles.statLabel}>COMBO</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{round}</Text>
            <Text style={styles.statLabel}>RONDAS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>PRECISIÓN</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.question}>¿Puedes superarlo?</Text>
      </Animated.View>

      <Animated.View style={styles.buttons} entering={FadeIn.delay(500).duration(300)}>
        <Pressable style={[styles.acceptBtn, { backgroundColor: modeColor }]} onPress={handleAccept}>
          <Text style={styles.acceptText}>ACEPTAR DESAFÍO</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} onPress={handleDecline}>
          <Text style={styles.declineText}>NO GRACIAS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080f',
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  challengeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.yellow,
    letterSpacing: 8,
    marginBottom: 28,
    textShadowColor: COLORS.yellow,
    textShadowRadius: 10,
  },
  card: {
    backgroundColor: 'rgba(13, 14, 26, 0.95)',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  playerChallenge: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1b2e',
    width: '100%',
    marginVertical: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 1,
    marginTop: 4,
  },
  question: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  buttons: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  acceptBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#07080f',
    letterSpacing: 3,
  },
  declineBtn: {
    paddingVertical: 10,
  },
  declineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 2,
  },
});
